var express = require('express');
var log = require('../log');
var receiptManager = require('./receiptManager');
var receiptItemManager = require('./receiptItemManager');
var env_config = require('../../config/config');
var constant = require('../../config/const.json');
var utils = require('./utils');
var return_receipt_packageModel = require('./../model/return_receipt_packageModel');
var return_receipt_quantity_statusModel = require('./../model/return_receipt_quantity_statusModel');
var orderModel = require('./../model/return_receiptModel');
var po_asnModel = require('./../model/po_asnModel');
var router = express.Router();
var request = require("request");
var async = require('async');
module.exports = {
    checkOrder : checkOrder,
    checkpoasn: checkpoasn,
    createpoasn: createpoasn,
    createorderpackage: createorderpackage,
    createPackage : createPackage,
    receiptPackage : receiptPackage
};

var getjson = function(data) {
    return JSON.parse(JSON.stringify(data));
};

function checkOrder(purchaseOrder, callback) {
    console.log(purchaseOrder);
    if (purchaseOrder) {
        orderModel.findOne({
            orderNumber: purchaseOrder
        }).exec(callback);
    } else {
        callback();
        return console.log('Error ');
    }
}

function checkpoasn(userInput, callback) {
    po_asnModel.findOne({
        asnId: userInput.asnId,
        // poId: userInput.purchaseOrderNumber
    }).exec(function(err, data) {
        if (err) {
            return console.log('Error ' + err);
        }
        if (data) {
            createpoasn(data._id, {
                asnId: userInput.asnId,
                poId: userInput.orderNumber
            }, function(err, poasndata) {
                po_asnModel.findOne({
                    asnId: userInput.asnId,
                    // poId: userInput.purchaseOrderNumber
                }).exec(function(err, data) {
                    callback(err, data);
                });
            });
        } else {
            // {
            createpoasn(0, {
                asnId: userInput.asnId,
                poId: userInput.orderNumber
            }, callback);
            // }
        }
    });
}

function createpoasn(id, userInput, callback) {
    if (id == 0) {
        var po_asn = new po_asnModel(userInput);
        po_asn.save(callback);
    } else {
        var po_asn = po_asnModel.findById(id);
        if (po_asn) {
            po_asn.update(userInput, callback);
        }
    }
}

function createPackage(userInput, callback) {
    return_receipt_packageModel.findOne({
        packageId: userInput.packageId
    }, function(err, data) {
        if (err) {
            return console.log('Error ' + err);
        }
        var po_asn_id = 0;
        if (data) {
            po_asn_id = data._id;
        }
        createorderpackage(po_asn_id, userInput, callback);
    });
}

function createorderpackage(id, userInput, callback) {
    if (id == 0) {
        userInput['createdBy'] = userInput.user.clientId;
        userInput['updatedBy'] = userInput.user.clientId;
        var order_asn_package = new return_receipt_packageModel(userInput);
        order_asn_package.save(callback);
    } else {
        var order_asn_package = return_receipt_packageModel.findById(id);
        if (order_asn_package) {
            userInput['updatedBy'] = userInput.user.clientId;
            order_asn_package.update(userInput, function(err, data) {
                return_receipt_packageModel.findOne({
                    packageId: userInput.packageId
                }, function(err, data) {
                    callback(err, data);
                });
            });
        } else {
            callback('No package found.');
        }
    }
}
function receiptPackage(data, header, callback) {
    var order_package = data;
    if (order_package && (order_package.hasOwnProperty('po_id') || order_package.hasOwnProperty('asn_id'))) {
        var query = {};
        var packId = '';
        query['$match'] = {
            // qtyStatus: {
            //     $in: ['shipped', 'received']
            // }
            isDeleted: false
        };
        if (order_package.hasOwnProperty('po_id')) {
            query['$match']['poId'] = order_package.po_id;
        }
        // if (c.hasOwnProperty('asn_id') && c.asn_id) {
        //     query['$match']['asnId'] = c.asn_id;
        // }
        if (order_package.hasOwnProperty('package_id')) {
            query['$match']['packageId'] = order_package.package_id;
        }
        var po_res = [];
        return_receipt_quantity_statusModel.aggregate([query, {
            $group: {
                '_id': {'_id': '$_id', 'lineNumber': '$lineNumber'},
                "data": {
                    "$first": {
                        "poId": "$poId",
                        "packageId": "$packageId",
                        "sku": "$sku",
                        "qty": "$qty",
                        "qtyStatus": "$qtyStatus",
                        "cost": "$skuCost",
                        "asnId": "$asnId",
                        "lineNumber": "$lineNumber"
                    }
                }
            }
        }, { 
            $sort : { '_id.lineNumber' : 1 } 
        }, {
            $project: {
                _id: 0,
                data: 1,
                // poId: 1,
                // packageId: 1,
                // sku: 1,
                // qty: 1,
                // qtyStatus: 1,
            }
        }]).exec(function(err, po_asn_status) {
            if (err) {
                return callback(err);
            }
            if (po_asn_status.length == 0) {
                var result = {
                    status: constant.label.ERROR,
                    message: constant.label.NO_DATA
                }
                return callback(null, result);
            }
            var po_asn = {};
            var asn = [];
            var x = {};
            var qty_data = {};
            var qtyStatus = function(data) {
                data = [data];
                // console.log(data);
                var return_data = {};
                var return_qty = {};
                if (data.length > 0) {
                    for (var n = 0; n < data.length; n++) {
                        if (data[n].sku in return_data) {
                            if (data[n].qtyStatus in return_data[data[n].sku]['qtyStatus']) {
                                return_data[data[n].sku]['qtyStatus'][data[n].qtyStatus] = parseInt(return_data[data[n].sku]['qtyStatus'][data[n].qtyStatus]) + parseInt(data[n].qty);
                                //return_data[data[n].sku]['qty'] = parseInt(return_data[data[n].sku]['qty']) + parseInt(data[n].qty);
                            } else {
                                return_data[data[n].sku]['qtyStatus'][data[n].qtyStatus] = data[n].qty;
                            }
                        } else {
                            return_data[data[n].sku] = {};
                            return_data[data[n].sku]['qtyStatus'] = {};
                            return_data[data[n].sku]['sku'] = data[n].sku;
                            return_data[data[n].sku]['skuCost'] = data[n].skuCost;
                            return_data[data[n].sku]['qtyStatus'][data[n].qtyStatus] = data[n].qty;
                        }
                        // if (constant.createPurchaseOrderType.hasOwnProperty(order.purchaseOrderType)) {
                        return_data[data[n].sku]['qty'] = parseInt((return_data[data[n].sku]['qty'] ? return_data[data[n].sku]['qty'] : 0)) + parseInt(data[n].qty);
                        // }
                        // if (data[n].qtyStatus == 'submitted') {
                        // return_data[data[n].sku]['qty'] = data[n].qty;
                        // }
                    }
                }
                //console.log(return_data);
                return return_data;
            };
            var getvalues = function(resultskus, skudata, location, loadAsnPackage) {
                // var resultskus = '';
                // po_asn_status.forEach(function(data, n) {
                //     resultskus = resultskus.concat(data.data.sku) + ',';
                // });
                var querystring = require('querystring');
                var formData = querystring.stringify({
                    sku: resultskus
                });
                var contentLength = formData.length;
                var options = {
                    url: env_config.apiPath + constant.apis.INVENTORIESSERVICE + location,
                    method: 'GET',
                    // method: 'POST',
                    body: formData,
                    headers: {
                        'authorization': header,
                        'Content-Length': contentLength,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }
                };
                console.log("url", env_config.apiPath + constant.apis.INVENTORIESSERVICE + location + "&sku=" + resultskus);
                async.series([
                    function(callback) {
                        request(options, function(err, data) {
                            try {
                                result = JSON.parse(data['body']);
                                return callback(result);
                            }
                            catch (e) {
                                utils.errorTrace(e);
                                return callback(null);
                            }
                        });
                    }
                ], function(skuwac) {
                    // console.log('skuwac');
                    // console.log(skuwac);
                    loadAsnPackage(skudata, skuwac);
                    // return skudata;
                });
            };
            var pack_id_obj = {};
            // for (var n = po_asn_status.length - 1; n >= 0; n--) {po_asn_status[n]
            async.eachSeries(po_asn_status, function(po_asnstatus, asynccallback) {
                var data = po_asnstatus.data;
                qty_data =  data;
                if(!pack_id_obj[data.packageId] && data.packageId)
                    pack_id_obj[data.packageId] = [];
                if(!pack_id_obj["noPackage"] && !data.packageId)
                    pack_id_obj["noPackage"] = [];
                if (data.packageId && pack_id_obj[data.packageId].indexOf(data.sku) == -1) {
                    if (asn.indexOf(data.packageId) == -1) {
                        asn.push(data.packageId);
                        po_asn[data.packageId] = [];
                    }
                    receiptItemManager.getReceiptItem({
                         sku: data.sku,
                        orderNumber: order_package.po_id
                    }, function(err, skudata) {
                        if (err) {
                            utils.errorTrace(err);
                        }
                        if (skudata && skudata.length) {
                            var returnskudata = JSON.parse(JSON.stringify(skudata[0]));
                            returnskudata.qtyStatus = qtyStatus(data);
                            po_asn[data.packageId].push(returnskudata);
                        }
                        pack_id_obj[data.packageId].push(data.sku);
                        packId = data.packageId?data.packageId:null;
                        delete data.packageId;
                        asynccallback();
                    });
                }
                else if( !data.packageId && data.asnId && pack_id_obj["noPackage"].indexOf(data.sku) == -1 ){
                    if (asn.indexOf(data.asnId) == -1) {
                        asn.push(data.asnId);
                        po_asn[data.asnId] = [];
                    }
                    receiptItemManager.getReceiptItem({
                         sku: data.sku,
                        orderNumber: order_package.po_id
                    }, function(err, skudata) {
                        if (err) {
                            utils.errorTrace(err);
                        }
                        if (skudata && skudata.length) {
                            var returnskudata = JSON.parse(JSON.stringify(skudata[0]));
                            returnskudata.qtyStatus = qtyStatus(data);
                            po_asn[data.asnId].push(returnskudata);
                        }
                        pack_id_obj["noPackage"].push(data.sku);
                        delete data.asnId;
                        asynccallback();
                    });
                } else {
                    delete data.asnId;
                    asynccallback();
                }
            }, function(err) {
                loadPackage();
            });
            // };
            // return callback(po_asn);
            var loadPackage = function(data) {
                var skus = [];
                // console.log(po_asn);
                for (var key in po_asn) {
                    var obj = po_asn[key];
                    for (var n = obj.length - 1; n >= 0; n--) {
                        skus.push(obj[n].SKU);
                    };
                }
                var options = {
                    url: env_config.apiPath + constant.apis.GETORDERBYPONUMBER + order_package.po_id,
                    headers: {
                        'authorization': header
                    }
                };
                // console.log('url');
                // console.log(env_config.dashPath + constant.apis.GETSKUDETAIL + skus.join() + "&locid=" + orderdata.location ? orderdata.location : orderdata.shipToLocation);
                // request(options, function(error, response, orderdata) {
                checkOrder(order_package.po_id, function(err, orderdata) {
                    if (orderdata) {
                        console.log('url');
                        console.log(env_config.dashPath + constant.apis.GETSKUDETAIL + skus.join() + "&locid=" + (orderdata.location ? orderdata.location : orderdata.shipToLocation));
                        request(env_config.dashPath + constant.apis.GETSKUDETAIL + skus.join() + "&locid=" + (orderdata.location ? orderdata.location : orderdata.shipToLocation), function(error, response, skudata) {
                            try {
                                var skudata = JSON.parse(skudata);
                            } 
                            catch (e) {
                                var skudata = {};
                            }
                            var skuwac = getvalues(skus.join(), skudata, (orderdata.location ? orderdata.location : orderdata.shipToLocation), loadAsnPackage);
                            // loadAsnPackage(skudata, skuwac);
                        });
                    } else {
                        callback('No Receipt Order Found');
                    }
                });
                // var orderdata = JSON.parse(orderdata);
                // });&& orderdata.length > 0
                var loadAsnPackage = function(skudata, skuwac) {
                        // console.log(skudata, skuwac);
                        for (var n = asn.length - 1; n >= 0; n--) {
                            x['c' + n] = 1;
                            var packagedata = {};
                            packagedata.numberOfSKU = 0;
                            packagedata.packageCost = 0;
                            for (var sku = po_asn[asn[n]].length - 1; sku >= 0; sku--) {
                                var po_asn_item = po_asn[asn[n]][sku];
                                // console.log(po_asn_item);
                                for (var j = skudata.length - 1; j >= 0; j--) {
                                    if (skudata[j].ProductTbl.sku == po_asn_item.SKU) {
                                        po_asn_item['productCode'] = skudata[j].ProductTbl.productCode;
                                        po_asn_item['description'] = skudata[j].ProductTbl.description;
                                        po_asn_item['productDescription'] = skudata[j].ProductTbl.productDescription;
                                        po_asn_item['styleDescription'] = skudata[j].ProductTbl.styleDescription;
                                        po_asn_item['variants'] = skudata[j].ProductTbl.variants;
                                    }
                                };
                                if (skuwac) {
                                    for (var j = skuwac.length - 1; j >= 0; j--) {
                                        if (skuwac[j] && (skuwac[j].sku == po_asn_item.SKU)) {
                                            po_asn_item['wac'] = skuwac[j].wac;
                                        }
                                    };
                                }
                                packagedata.numberOfSKU = packagedata.numberOfSKU + parseInt(po_asn_item.qty);
                                packagedata.packageCost = packagedata.packageCost + parseFloat(po_asn_item.totalProductCost);
                            };
                            if ( packId ){
                                getpopackage(asn[n], po_asn[asn[n]], packagedata, n, function(err, v, po_asn_package) {
                                    po_res.push(po_asn_package);
                                    // console.log(po_res);
                                    delete x['c' + v];
                                    // console.log(Object.keys(x).length);
                                    if (Object.keys(x).length == 0) {
                                        callback(err, po_res);
                                        // getASN(po_res, function(err, po_res) {
                                        //     callback(err, po_res);
                                        // });
                                    }
                                })
                            }
                            else if( !packId ){
                                getPoAsn(asn[n], po_asn[asn[n]], packagedata, n, function(err, v, po_asn_data) {
                                    po_res.push(po_asn_data);
                                    // console.log(po_res);
                                    delete x['c' + v];
                                    // console.log(Object.keys(x).length);
                                    if (Object.keys(x).length == 0) {
                                        callback(err, po_res);
                                        // getASN(po_res, function(err, po_res) {
                                        //     callback(err, po_res);
                                        // });
                                    }
                                })
                            }   
                        };
                    }
            };
        });
    } else {
        var result = {
            status: constant.label.ERROR,
            message: constant.label.NO_POID
        }
        callback(null, result);
    }
}

function getpopackage(asn, order_status, packagedata, n, callback) {
    return_receipt_packageModel.findOne({
        "packageId": asn
            // "packageId": 
    }).exec(function(err, order_package) {
        // delete po_asn_status.data.packageId;
        try{
            var order = JSON.parse(JSON.stringify(order_package));
            // console.log(''+asn);
            // console.log('cdcdcdcc'+po_asn_status.data);
            if (err) {
                // po_asn_status.data.po_asn_package = {};
                order = {};
                return callback(err, n, order);
            }
            var qtyStatus = [];
            for (var j = 0, length2 = order_status.length; j < length2; j++) {
                qtyStatus.push(order_status[j].qtyStatus);
                delete order_status[j].qtyStatus;
            }
            order.qtyStatus = qtyStatus;
            order.numberOfSKU = order_status.length;
            order.SKUQty = packagedata.numberOfSKU;
            order.packageCost = packagedata.packageCost;
            order.orderSKU = order_status;
            // po_asn_status.data.po_asn_package = po_asn_package;
            // order.order_status = order_status;
            // console.log(order);
            callback(err, n, order);
        }
        catch (e) {
            utils.errorTrace(e);
            callback(err);
        }
    });
}

function getPoAsn(asn, order_status, packagedata, n, callback) {
    po_asnModel.findOne({
        "asnId": asn
            // "packageId": 
    }).exec(function(err, order_asn) {
        // delete po_asn_status.data.packageId;
        try {
            var order = JSON.parse(JSON.stringify(order_asn));
            // console.log(''+asn);
            // console.log('cdcdcdcc'+po_asn_status.data);
            if (err) {
                // po_asn_status.data.po_asn_package = {};
                order = {};
                return callback(err, n, order);
            }
            var qtyStatus = [];
            for (var j = 0, length2 = order_status.length; j < length2; j++) {
                qtyStatus.push(order_status[j].qtyStatus);
                delete order_status[j].qtyStatus;
            }
            order.qtyStatus = qtyStatus;
            order.numberOfSKU = order_status.length;
            order.SKUQty = packagedata.numberOfSKU;
            order.asnCost = packagedata.packageCost;
            order.orderSKU = order_status;
            // po_asn_status.data.po_asn_package = po_asn_package;
            // order.order_status = order_status;
            // console.log(order);
            callback(err, n, order);
        }
        catch (e) {
            utils.errorTrace(e);
            callback(e);
        }
    });
}
