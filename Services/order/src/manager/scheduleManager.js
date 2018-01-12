var orderModel = require('./../model/orderModel');
var po_item_quantity_statusModel = require('./../model/po_item_quantity_statusModel');
var orderItemModel = require('./../model/orderItemModel');
var constant = require('../../config/const.json');
var env_config = require('../../config/config.js');
var async = require('async');
var lo = require('lodash');
var deffered = require('q');
var request = require("request");
var querystring = require('querystring');
module.exports = {
    updateStatus: updateStatus
}

function updateStatus(payload, headers, callback) {
    'use strict';
    var CreateTranService = function(dataArr, trancallback) {
        var srch = {
            skus: JSON.stringify(dataArr)
        };
        var formData = querystring.stringify(srch);
        var contentLength = formData.length;
        var options = {
            url: env_config.apiPath + constant.apis.TRANSACTIONSERVICE,
            method: 'PUT',
            body: formData,
            headers: {
                'authorization': headers,
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        };
        request(options, function(err, response, data) {
            console.log(env_config.apiPath + constant.apis.TRANSACTIONSERVICE, data);
            trancallback ? trancallback(err, data) : '';
        });
    };
    let order_type = ["MAN", "RPL"];
    let orderStatus = ["inProgress"];
    let srch = {
        isDeleted: false
    };
    srch['orderStatus'] = {
        "$in": orderStatus
    };
    srch.purchaseOrderType = {
        "$in": order_type
    };
    var config = {};
    var configarr = {};

    function getconfig(loc) {
        // var defer = deffered.defer();
        var options = {
            url: env_config.apiPath + constant.apis.GETCONFIG + loc + '&featureId=' + constant.checkNeedbydate,
            headers: {
                'authorization': headers
            }
        };
        if (config[loc]) {
            return config[loc].promise;
        } else {
            config[loc] = deffered.defer();;
        }
        console.log(options);
        request(options, function(error, response, data) {
            try {
                configarr[loc] = {};
                var config_arr = JSON.parse(data);
                config_arr.config_arr.forEach(function(data) {
                    if (data.featureValue != null && data.featureValue != "") {
                        var edetail = data.featureValue;
                    } else {
                        var edetail = data.defaultValue;
                    }
                    configarr[loc][data.featureId] = {
                        featureName: data.featureName,
                        featureValue: edetail
                    };
                });
                config[loc].resolve(configarr[loc]);
            } catch (err) {
                console.log(err);
                config[loc].resolve();
            }
        });
        return config[loc].promise;
    }
    var shippedStatus = {
        "shippedQty": "qtyStatusValues.unconfirmed + qtyStatusValues.confirmed",
        "allStatuses": "unconfirmed,confirmed,received"
    };
    orderModel.find(srch, function(error, orderData) {
        if (error) {
            console.log(error);
            callback(error);
        } else if (orderData) {
            console.log('All orderData ' + orderData.length);
            let updated = 0;
            let all_order = 0;
            orderData.forEach(function(v) {
                console.log(v.purchaseOrderNumber);
            });
            async.forEach(orderData, function(order, ordercallback) {
                getconfig(order.shipToLocation).then(function(config_arr) {
                    function checkStatus() {
                        let SKUCompleted = [];
                        let srch = {
                            isDeleted: false
                        };
                        srch['purchaseOrderNumber'] = order.purchaseOrderNumber;
                        orderItemModel.find(srch, function(error, orderSKUData) {
                            console.log(++all_order, 'orderSKUData ' + orderSKUData.length, order.purchaseOrderNumber);
                            async.forEach(orderSKUData, function(SKUData, skudatacallback) {
                                var qtyStatus = {};
                                qtyStatus.poId = order.purchaseOrderNumber;
                                qtyStatus.sku = SKUData.SKU;
                                qtyStatus.qtyStatus = {
                                    "$in": shippedStatus.allStatuses.split(',')
                                };
                                po_item_quantity_statusModel.aggregate([{
                                    $match: qtyStatus
                                }, {
                                    $group: {
                                        _id: {
                                            sku: "$sku",
                                            qtyStatus: "$qtyStatus"
                                        },
                                        sku: {
                                            $last: "$sku"
                                        },
                                        skuCost: {
                                            $last: "$skuCost"
                                        },
                                        asnId: {
                                            $last: "$asnId"
                                        },
                                        packageId: {
                                            $last: "$packageId"
                                        },
                                        qtyStatus: {
                                            $last: "$qtyStatus"
                                        },
                                        total: {
                                            $sum: {
                                                $ifNull: ["$qty", 0]
                                            }
                                        },
                                    }
                                }]).exec(function(err, qtyValues) {
                                    let qtyStatusValues = {};
                                    let qtyStatusData = {};
                                    qtyValues.forEach(function(qtyData) {
                                        qtyStatusValues[qtyData.qtyStatus] = qtyData.total;
                                        qtyStatusData = lo.extend(qtyStatusData, qtyData);
                                    });
                                    if (lo.keys(qtyStatusValues).length === shippedStatus.allStatuses.split(',').length) {
                                        try {
                                            let shippedQty = eval(shippedStatus.shippedQty);
                                            if (shippedQty === qtyStatusValues[constant.status.RECEIVED]) {
                                                SKUCompleted.push({
                                                    orderSKUData: lo.extend(SKUData, qtyStatusData)
                                                });
                                            }
                                        } catch (e) {
                                            console.log(e);
                                        }
                                        skudatacallback();
                                    } else {
                                        console.log(order.purchaseOrderNumber + ' : Status Not Updated.');
                                        skudatacallback();
                                    }
                                });
                            }, function() {
                                if (orderSKUData.length > 0 && orderSKUData.length === SKUCompleted.length) {
                                    SaveCompleted(function() {
                                        updated++;
                                        order.orderStatus   =   constant.status.COMPLETED;
                                        order.lastModified  =   new Date();
                                        if (payload.user)
                                            order.updatedBy     =   payload.user.clientId;
                                        order.save();
                                        ordercallback();
                                        console.log('Order updated ' + updated);
                                    });
                                } else {
                                    ordercallback();
                                }
                            });

                            function SaveCompleted(trancallback) {
                                var tranSKUsArray = [];
                                let loc;
                                // if (order.markForLocation == '' || order.markForLocation == undefined) {
                                loc = order.shipToLocation;
                                // } else {
                                // loc = order.markForLocation;
                                // }
                                SKUCompleted.forEach(function(orderSKUData) {
                                    var SKUData = orderSKUData.orderSKUData;
                                    let qtyStatus = {};
                                    let dataobj = {
                                        transtypeid: '',
                                        stocklocationid: '',
                                        asnid: SKUData.asnId,
                                        postranNo: '',
                                        locationid: loc,
                                        stockUOM: SKUData.uom,
                                        quantity: SKUData.qty,
                                        purchaseOrderNumber: order.purchaseOrderNumber,
                                        purchaseOrderType: order.purchaseOrderType,
                                        cost: SKUData.skuCost,
                                        warehouseid: loc,
                                        sku: SKUData.sku,
                                        directivetype: constant.DirectiveType.CRON_PO_COMPLETE
                                    };
                                    tranSKUsArray.push(dataobj);
                                });
                                console.log(tranSKUsArray);
                                CreateTranService(tranSKUsArray, trancallback);
                            };
                        });
                    }

                    function checkNeedbydate() {
                        var dateToCheck = new Date();
                        var needByDate = new Date(order.needByDate);
                        if (order.needByDate && dateToCheck > needByDate) {
                            var qtyStatus = {};
                            qtyStatus.poId = order.purchaseOrderNumber;
                            qtyStatus.qtyStatus = {
                                "$in": ["received"]
                            };
                            
                            function getQtyData(callback) {
                                po_item_quantity_statusModel.aggregate([{
                                    $match: qtyStatus
                                }, {
                                    $group: {
                                        _id: {
                                            sku: "$sku",
                                            qtyStatus: "$qtyStatus"
                                        },
                                        sku: {
                                            $last: "$sku"
                                        },
                                        skuCost: {
                                            $last: "$skuCost"
                                        },
                                        asnId: {
                                            $last: "$asnId"
                                        },
                                        packageId: {
                                            $last: "$packageId"
                                        },
                                        qtyStatus: {
                                            $last: "$qtyStatus"
                                        },
                                        total: {
                                            $sum: {
                                                $ifNull: ["$qty", 0]
                                            }
                                        },
                                    }
                                }]).exec(callback);
                            };
                                
                            getQtyData (function(err, qtyValues){
                                if (qtyValues.length) {
                                    let skuArr = [];
                                    let qtyObj = {};

                                    for (var i = qtyValues.length - 1; i >= 0; i--) {
                                        skuArr.push(qtyValues[i].sku);
                                        if (!qtyObj[qtyValues[i].sku])
                                            qtyObj[qtyValues[i].sku] = {};
                                        qtyObj[qtyValues[i].sku] = qtyValues[i];
                                        qtyObj[qtyValues[i].sku][qtyValues[i].qtyStatus+'Qty'] = qtyValues[i].total;
                                    }

                                    qtyStatus.sku = {'$in': skuArr};
                                    qtyStatus.qtyStatus = {
                                        "$in": ["submitted"]
                                    };
                                    getQtyData (function(err, submitQty) {

                                        for (var i = submitQty.length - 1; i >= 0; i--) {
                                            if (qtyObj[submitQty[i].sku])
                                                qtyObj[submitQty[i].sku][submitQty[i].qtyStatus+'Qty'] = submitQty[i].total;
                                        }

                                        orderItemModel.find({
                                            purchaseOrderNumber: order.purchaseOrderNumber,
                                            SKU: {'$in': Object.keys(qtyObj)},
                                            isDeleted: false
                                        }, function(err, orderSKUData){
                                            if (err)
                                                return callback (err);
                                            let tranSKUsArray = [];
                                            async.forEach(orderSKUData, function(skuData, async_callback){
                                                if (qtyObj[skuData.SKU] && (qtyObj[skuData.SKU].submittedQty !== qtyObj[skuData.SKU].receivedQty)) {
                                                    
                                                    let dirType = null;
                                                    let qtyDiff = 0;

                                                    (qtyObj[skuData.SKU].receivedQty < qtyObj[skuData.SKU].submittedQty)
                                                        ? (dirType = constant.DirectiveType.PO_COMPLETE_LESS_RECEIVED,
                                                           qtyDiff = qtyObj[skuData.SKU].submittedQty - qtyObj[skuData.SKU].receivedQty)
                                                        : (dirType = constant.DirectiveType.PO_COMPLETE_MORE_RECEIVED,
                                                           qtyDiff = qtyObj[skuData.SKU].receivedQty - qtyObj[skuData.SKU].submittedQty);

                                                    var dataobj = {
                                                        transtypeid: '',
                                                        stocklocationid: '',
                                                        asnid: qtyObj[skuData.SKU].asnId,
                                                        postranNo: '',
                                                        locationid: order.shipToLocation,
                                                        stockUOM: skuData.producUom,
                                                        quantity: qtyDiff,
                                                        purchaseOrderNumber: order.purchaseOrderNumber,
                                                        purchaseOrderType: order.purchaseOrderType,
                                                        cost: qtyObj[skuData.SKU].skuCost,
                                                        warehouseid: order.shipToLocation,
                                                        sku: skuData.SKU,
                                                        directivetype: dirType
                                                    };
                                                    
                                                    tranSKUsArray.push(dataobj);

                                                }
                                                async_callback();
                                            }, function(){
                                                console.log(tranSKUsArray);
                                                CreateTranService(tranSKUsArray, function(err, data){
                                                    if (!err){
                                                        updated++;
                                                        order.orderStatus = constant.status.COMPLETED;
                                                        order.lastModified  =   new Date();
                                                        if (payload.user)
                                                            order.updatedBy     =   payload.user.clientId;
                                                        order.save();
                                                        console.log('Order updated ' + updated);
                                                    }
                                                    ordercallback();
                                                });
                                            });
                                        });
                                                
                                    });
                                } else {
                                    console.log(order.purchaseOrderNumber + ' : Status Not Updated.');
                                    ordercallback();
                                }
                            });
                        } else {
                            console.log(order.purchaseOrderNumber + ' NeedByDate Error.');
                            ordercallback();
                        }
                    }
                    if (config_arr && config_arr[constant.checkNeedbydate]) {
                        console.log(config_arr[constant.checkNeedbydate]);
                        if (config_arr[constant.checkNeedbydate].featureValue == '1') {
                            checkNeedbydate();
                        } else {
                            checkStatus();
                        }
                    } else {
                        console.log(config_arr);
                        console.log('No config for loc : ' + order.shipToLocation);
                        ordercallback();
                    }
                });
            }, function() {
                callback('', 'Orders updated : ' + updated);
                console.log('Order updated : ' + updated);
            });
        } else {
            callback('', 'All Orders are Completed.');
            console.log('All Orders are Completed.');
        }
    });
}