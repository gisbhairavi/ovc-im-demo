var express = require('express');
var log = require('../log');
var env_config = require('../../config/config');
var Ordertype = require('../../config/Ordertype.json');
var constant = require('../../config/const.json');
var po_asnModel = require('./../model/po_asnModel');
var po_asn_packageModel = require('./../model/po_asn_packageModel');
var po_item_quantity_statusModel = require('./../model/po_item_quantity_statusModel');
var orderModel = require('./../model/orderModel');
var orderItemModel = require('./../model/orderItemModel');
var request = require("request");
var async = require('async');
var lo = require('lodash');
var router = express.Router();
module.exports = {
    checkOrder: checkOrder,
    createOrder: createOrder,
    checkErpOrder: checkErpOrder,
    checkpoasn: checkpoasn,
    createpoasn: createpoasn,
    getshipment: getshipment,
    checkpoasnpackage: checkpoasnpackage,
    createpoasnpackage: createpoasnpackage,
    checkitmequantitystatus: checkitmequantitystatus,
    createitmequantitystatus: createitmequantitystatus,
    getshipmentdata: getshipmentdata,
    updatepackagestatus: updatepackagestatus,
    createitemqtystatus: createitemqtystatus,
    // updateNosku: updateNosku,
    getPoAsn: getPoAsn,
    closeAsnPackageStatus: closeAsnPackageStatus,
    reverseReceiptPackageStatus: reverseReceiptPackageStatus,
    reverseIBTOrders: reverseIBTOrders
};

function checkOrder(purchaseOrder, callback) {
    console.log(purchaseOrder);
    if (purchaseOrder) {
        orderModel.findOne({
            purchaseOrderNumber: purchaseOrder,
            isDeleted: false
        }).exec(callback);
    } else {
        callback();
        return console.log('Error ');
    }
}

function checkErpOrder(erpPurchaseOrder, callback) {
    console.log(erpPurchaseOrder, 'erpPurchaseOrder');
    if (erpPurchaseOrder) {
        orderModel.findOne({
            erpPurchaseOrder: erpPurchaseOrder,
            isDeleted: false
        }).exec(callback);
    } else {
        callback();
        return console.log('Error ');
    }
}
// To check the no value and delete the non no value by Ratheesh.(23.8.2016).
var delNotNovalue = function(data, noArr) {
    for (var j = 0, length2 = noArr.length; j < length2; j++) {
        try {
            if (data[noArr[j]]) data[noArr[j]] = data[noArr[j]] || 0;
            else delete data[noArr[j]];
        } catch (e) {
            delete data[noArr[j]];
            console.log(e);
        }
    }
    return data;
};

function createOrder(id, userInput, callback) {
    var noArr = ['PoSubtotal', 'PoSubtotalConfirm', 'PoSubtotalAsn', 'totalPoCost', 'totalPoCostConfirm', 'totalPoCostAsn', 'totalPoVAT', 'totalPoTax', 'totalPoVATConfirm', 'totalPoTaxConfirm', 'totalPoVATAsn', 'totalPoTaxAsn'];
    userInput = delNotNovalue(userInput, noArr);
    if (id == 0) {
        userInput['createdBy'] = userInput.user.clientId;
        userInput['updatedBy'] = userInput.user.clientId;
        var order = new orderModel(userInput);
        order.save(callback);
    } else {
        var order = orderModel.findById(id);
        if (order) {
            order.exec(function(err, orderdata) {
                if (err) {
                    return console.log('Error ' + err);
                }
                userInput['updatedBy'] = userInput.user.clientId;
                order.update(userInput, function(err, data) {
                    checkOrder(orderdata.purchaseOrderNumber, callback);
                });
            });
        } else {
            callback('No order.');
        }
    }
}

function checkpoasn(userInput, callback) {
    po_asnModel.findOne({
        poId: userInput.poId,
        asnId: userInput.asnId,
        isDeleted: false
    }).exec(callback);
}

function createpoasn(userInput, callback) {

    checkpoasn(userInput, function(err, asnData){

        if (err)
            callback(err);

        userInput['createdBy'] = userInput.user.clientId;
        userInput['updatedBy'] = userInput.user.clientId;

        if(!asnData) {
            asnData = new po_asnModel(userInput);
        }

        asnData = lo.extend(asnData, userInput);
        asnData.save(callback);

    });
    
}

function checkpoasnpackage(userInput, callback) {
    po_asn_packageModel.findOne({
        packageId: userInput.packageId,
        asnId: userInput.asnId,
        isDeleted: false
    }, function(err, data) {
        if (err) {
            return console.log('Error ' + err);
        }
        //console.log(data);
        var po_asn_id = 0;
        if (data) {
            po_asn_id = data._id;
        }
        createpoasnpackage(po_asn_id, userInput, callback);
    });
}

function createpoasnpackage(id, userInput, callback) {
    if (id == 0) {
        userInput['createdBy'] = userInput.user.clientId;
        userInput['updatedBy'] = userInput.user.clientId;
        var po_asn_package = new po_asn_packageModel(userInput);
        po_asn_package.save(callback);
    } else {
        userInput['updatedBy'] = userInput.user.clientId;
        var po_asn_package = po_asn_packageModel.findById(id);
        if (po_asn_package) {
            po_asn_package.update(userInput, callback);
        }
        else {
            console.log("Error-:")
        }
    }
}

function checkitmequantitystatus(userInput, callback, CreateSKUstatusTran, purchaseOrder) {
    po_item_quantity_statusModel.findOne({
        poId: userInput.poId,
        asnId: userInput.asnId,
        packageId: userInput.packageId,
        sku: userInput.sku,
        qtyStatus: userInput.qtyStatus,
        isDeleted: false
    }, function(err, data) {
        if (err) {
            return console.log('Error ' + err);
        }
        if (data) {
            // if (userInput.qty == '' || userInput.qty == undefined) {
            //     var po_asn_package = po_item_quantity_statusModel.findById(data._id);
            //     var new_qty = parseInt(data.qty || 0);
            //     // var new_qty =  parseInt(userInput.qty || 0);
            //     userInput.qty = new_qty;
            //     po_asn_package.update(userInput, callback);
            //     // callback(err, data);
            // } else {
            var updatepostatus = function(err, response, responsedata) {
                var po_asn_package = po_item_quantity_statusModel.findById(data._id);
                if (po_asn_package) {
                    var noArr = ['skuCost', 'skuCostConfirm', 'skuCostAsn', 'totalProductTaxConfirm', 'totalProductVatConfirm', 'totalProductCostConfirm', 'totalProductTaxAsn', 'totalProductVatAsn', 'totalProductCostAsn']
                    userInput = delNotNovalue(userInput, noArr);
                    // var new_qty = parseInt(data.qty) + parseInt(userInput.qty || 0);
                    var new_qty = parseInt(userInput.qty || 0);
                    userInput.qty = new_qty;
                    po_asn_package.update(userInput, callback);
                }
            };
            if (purchaseOrder) {
                if (purchaseOrder.purchaseOrderType == 'MAN' || purchaseOrder.purchaseOrderType == 'ZFUT') {
                    if (userInput.qtyStatus === constant.status.CONFIRMED) {
                        data.qtyStatus = constant.status.CONFIRMED_RVS;
                        CreateSKUstatusTran(purchaseOrder, data, updatepostatus);
                    } else if (userInput.qtyStatus === constant.status.REJECTED) {
                        data.qtyStatus = constant.status.REJECTED_RVS;
                        CreateSKUstatusTran(purchaseOrder, data, updatepostatus);
                    } else if (userInput.qtyStatus === constant.status.UNCONFIRMED) {
                        data.qtyStatus = constant.status.UNCONFIRMED_RVS;
                        CreateSKUstatusTran(purchaseOrder, data, updatepostatus);
                    } else {
                        updatepostatus('', '', '');
                    }
                } else {
                    updatepostatus('', '', '');
                }
            }
            // }
        } else {
            createitmequantitystatus(userInput, callback);
        }
    });
}

function createitmequantitystatus(userInput, callback) {
    var noArr = ['skuCost', 'skuCostConfirm', 'skuCostAsn', 'totalProductTaxConfirm', 'totalProductVatConfirm', 'totalProductCostConfirm', 'totalProductTaxAsn', 'totalProductVatAsn', 'totalProductCostAsn']
    userInput = delNotNovalue(userInput, noArr);
    orderModel.findOne({
        "purchaseOrderNumber": userInput.poId,
        isDeleted: false
    }).exec(function(err, packageorder) {
        if (err) {
            return console.log('Error ' + err);
        }
        var toLoc = '';
        if (packageorder) {
            if (packageorder.markForLocation == '') {
                toLoc = packageorder.shipToLocation;
            } else {
                toLoc = packageorder.markForLocation;
            }
            if (userInput['location']) {} else {
                userInput['location'] = toLoc;
            }
        }
        var po_item_quantity_status = new po_item_quantity_statusModel(userInput);
        po_item_quantity_status.save(callback);
    });
}

function getshipmentdata(userInput, callback) {
    po_item_quantity_statusModel.find({
        poId: userInput,
        isDeleted: false
    }).exec(callback);
}

function getshipment(c, header, callback) {
    if (c.hasOwnProperty('po_id') || c.hasOwnProperty('asn_id')) {
        var query = {};
        query['$match'] = {
            qtyStatus: {
                $in: ['shipped', 'received']
            }
        };
        if (c.hasOwnProperty('po_id')) {
            query['$match']['poId'] = c.po_id;
        }
        if (c.hasOwnProperty('asn_id') && c.asn_id) {
            query['$match']['asnId'] = c.asn_id;
        }
        if (c.hasOwnProperty('package_id')) {
            query['$match']['packageId'] = c.package_id;
        }
        var po_res = [];
        po_item_quantity_statusModel.aggregate([query, {
            $group: {
                '_id': '$_id',
                "data": {
                    "$first": {
                        "poId": "$poId",
                        "packageId": "$packageId",
                        "sku": "$sku",
                        "qty": "$qty",
                        "qtyStatus": "$qtyStatus",
                        "cost": "$skuCost"
                    }
                }
            }
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
                callback(null, result);
            }
            var po_asn = {};
            var asn = [];
            var x = {};
            for (var n = po_asn_status.length - 1; n >= 0; n--) {
                if (po_asn_status[n].data.packageId) {
                    if (asn.indexOf(po_asn_status[n].data.packageId) == -1) {
                        asn.push(po_asn_status[n].data.packageId);
                        po_asn[po_asn_status[n].data.packageId] = [];
                    }
                    po_asn[po_asn_status[n].data.packageId].push(po_asn_status[n].data);
                    delete po_asn_status[n].data.packageId;
                }
            };
            var skus = [];
            for (var key in po_asn) {
                var obj = po_asn[key];
                for (var f = obj.length - 1; f >= 0; f--) {
                    skus.push(obj[f].sku);
                };
            }
            var options = {
                url: env_config.apiPath + constant.apis.GETORDERBYPONUMBER + c.po_id,
                headers: {
                    'authorization': header
                }
            };
            request(options, function(error, response, orderdata) {
                var orderdata = JSON.parse(orderdata);
                if (orderdata && orderdata.length > 0) {
                    request(env_config.dashPath + constant.apis.GETSKUDETAIL + skus.join() + "&locid=" + orderdata[0].location, function(error, response, skudata) {
                        var skudata = JSON.parse(skudata);
                        loadAsnPackage(skudata);
                    });
                }
            });
            var loadAsnPackage = function(skudata) {
                    for (var n = asn.length - 1; n >= 0; n--) {
                        x['c' + n] = 1;
                        var packagedata = {};
                        packagedata.numberOfSKU = 0;
                        packagedata.packageCost = 0;
                        for (var f = po_asn[asn[n]].length - 1; f >= 0; f--) {
                            var po_asn_item = po_asn[asn[n]][f];
                            for (var j = skudata.length - 1; j >= 0; j--) {
                                if (skudata[j].ProductTbl.sku == po_asn_item.sku) {
                                    po_asn_item['productCode'] = skudata[j].ProductTbl.productCode;
                                    po_asn_item['description'] = skudata[j].ProductTbl.description;
                                    po_asn_item['productDescription'] = skudata[j].ProductTbl.productDescription;
                                }
                            };
                            packagedata.numberOfSKU = packagedata.numberOfSKU + parseInt(po_asn_item.qty);
                            packagedata.packageCost = packagedata.packageCost + parseFloat(po_asn_item.cost);
                        };
                        getpopackage(asn[n], po_asn[asn[n]], packagedata, n, function(err, v, po_asn_package) {
                            po_res.push(po_asn_package);
                            delete x['c' + v];
                            if (Object.keys(x).length == 0) {
                                // callback(err, po_res);
                                if (c.hasOwnProperty('asn')) {
                                    getASN(po_res, function(err, po_res) {
                                        callback(err, po_res);
                                    });
                                } else {
                                    callback(err, po_res);
                                }
                            }
                        })
                    };
                }
                // for (var n = po_asn_status.length - 1; n >= 0; n--) {
                //     var status = po_asn_status[n];
                // x['c' + n] = 1;
                // getpopackage(status, n, function(err, v, po_asn_package) {
                //     po_res.push(po_asn_package);
                //     delete x['c' + v];
                //     console.log(x, Object.keys(x).length);
                //     if (Object.keys(x).length == 0) {
                //         callback(err, po_res);
                //     }
                // })
                // };
        });
    } else {
        var result = {
            status: constant.label.ERROR,
            message: constant.label.NO_POID
        }
        callback(null, result);
    }
}

function getpopackage(asn, po_asn_status, packagedata, n, callback) {
    po_asn_packageModel.findOne({
        "packageId": asn,
        isDeleted: false
            // "packageId": 
    }).exec(function(err, po_asn_package) {
        // delete po_asn_status.data.packageId;
        var po_asn = JSON.parse(JSON.stringify(po_asn_package));
        // console.log(''+asn);
        // console.log('cdcdcdcc'+po_asn_status.data);
        if (err) {
            // po_asn_status.data.po_asn_package = {};
            po_asn = {};
            return callback(err, n, po_asn);
        }
        po_asn.qtyStatus = po_asn_status[0].qtyStatus;
        po_asn.numberOfSKU = po_asn_status.length;
        po_asn.SKUQty = packagedata.numberOfSKU;
        po_asn.packageCost = packagedata.packageCost;
        po_asn.po_asn_status = po_asn_status;
        // po_asn_status.data.po_asn_package = po_asn_package;
        callback(err, n, po_asn);
    });
}
// Code By Ratheesh.
function getASN(po_res, callback) {
    // body...
    var asn = [];
    var po_asn = {};
    var po_asnres = [];
    for (var j = 0, length2 = po_res.length; j < length2; j++) {
        if (asn.indexOf(po_res[j].asnId) == -1) {
            asn.push(po_res[j].asnId);
            po_asn[po_res[j].asnId] = [];
        }
        po_asn[po_res[j].asnId].push(po_res[j]);
    }
    var getasn = function(asn, j) {
        po_asnModel.findOne({
            asnId: asn[j],
            isDeleted: false
        }).exec(function(err, data) {
            var asnres = JSON.parse(JSON.stringify(data));
            asnres.numberOfPackage = po_asn[asn].length;
            asnres.packageQty = 0;
            asnres.asnCost = 0;
            for (var no = 0, length2 = po_asn[asn].length; no < length2; no++) {
                asnres.packageQty = asnres.packageQty + po_asn[asn][no].SKUQty;
                asnres.asnCost = asnres.asnCost + po_asn[asn][no].packageCost;
            }
            asnres.po_asn_package = po_asn[asn];
            po_asnres.push(asnres);
            if (j == asn.length - 1) {
                callback(null, po_asnres);
            }
        });
    };
    for (var j = 0, length2 = asn.length; j < length2; j++) {
        getasn(asn, j);
    }
}

function updateASN (asnId) {
    po_asn_packageModel.find({
        asnId: asnId,
        isDeleted: false
    }).exec(function(err, pack_data){
        if (err)
            return callback(err);
        var noOfPack = pack_data.length;
        if (noOfPack) {
            var pack_status_data =  {};
            var asnStatus = '';

            for (var i = noOfPack - 1; i >= 0; i--) {
                if (!pack_status_data[pack_data[i]['packageStatus']]) {
                    pack_status_data[pack_data[i]['packageStatus']] = []
                }
                pack_status_data[pack_data[i]['packageStatus']].push(pack_data[i]);
            }

            if (pack_status_data['received']){

                asnStatus = 'partiallyReceived';

                if (pack_status_data['received'].length === noOfPack)
                    asnStatus = 'receivedInFull';
                    
            }
            console.log("pack_status_data____________:",pack_status_data);
            if (pack_status_data['shippedReversed']){

                asnStatus = 'partiallyReceived';

                if (pack_status_data['shippedReversed'].length === noOfPack)
                    asnStatus = 'shipped';

            }
            if (pack_status_data['receiveInProgress'] && pack_status_data['receiveInProgress'].length >0)
                asnStatus = 'receiveInProgress';
            if (pack_status_data['closed'] && pack_status_data['closed'].length >0)
                asnStatus = 'closed';
            po_asnModel.update({
                "asnId": asnId,
                "isDeleted": false
            },{
                asnStatus: asnStatus
            }, {
                multi: true
            },function(err, data){

            });
        }
    });
}

function updatepackagestatus(poAsnPackage, user, CreateTran, callback) {
    async.forEach(poAsnPackage, function(poAsnPackageObj, asynccallback) {
        var packageid = null;
        var Order = function(Status, n) {
            orderModel.findOne({
                "purchaseOrderNumber": Status.poId,
                isDeleted: false
            }).exec(function(err, packageorder) {
                if (packageorder) {
                    packageorder.location = packageorder.location ? packageorder.location : packageorder.shipToLocation;
                    po_item_quantity_statusModel.find({
                        "poId": packageorder.purchaseOrderNumber,
                        "sku": Status.sku,
                        "qtyStatus": constant.status.CONFIRMED
                    }).sort({
                        'lastModified': -1
                    }).exec(function(err, data) {
                        po_item_quantity_statusModel.find({
                            "poId": packageorder.purchaseOrderNumber,
                            "sku": Status.sku,
                            "qtyStatus": 'shipped'
                        }).sort({
                            'lastModified': -1
                        }).exec(function(err, dataAsn) {
                            var qty_cost;
                            if (Status.skuCostAsn) {
                                qty_cost = Status.skuCostAsn;
                            } else if (dataAsn && dataAsn[0] && dataAsn[0].skuCostAsn) {
                                qty_cost = dataAsn[0].skuCostAsn;
                            } else if (Status.skuCostConfirm) {
                                qty_cost = Status.skuCostConfirm;
                            } else {
                                if (data && data[0] && data[0].skuCostConfirm) {
                                    qty_cost = data[0].skuCostConfirm;
                                } else {
                                    qty_cost = Status.skuCost
                                }
                            }
                            console.log('qty_cost');
                            console.log(qty_cost);
                            Status.skuCost = qty_cost;
                            CreateTran(packageorder, function(n) {
                                if (n == 0) {
                                    asynccallback();
                                }
                            }, n, Status);
                        });
                    });
                }else{
                    asynccallback('PO_ITEM_ERROR');
                    console.log('PO_ORDER_ITEM_NOT_HAVING_DATA');
                }
            });
        };
        var qtyStatus = function(userInput, callback) {
            var submitteddata = {
                poId: userInput.poId,
                qtyStatus: 'submitted',
                sku: userInput.sku,
                qty: '0',
                skuCost: userInput.skuCost,
                lineNumber: userInput.lineNumber,
                createdBy: user.clientId,
                updatedBy: user.clientId,
                isDeleted: false
            };
            po_item_quantity_statusModel.findOne({
                poId: userInput.poId,
                packageId: packageid,
                qtyStatus: userInput.qtyStatus,
                sku: userInput.sku,
                isDeleted: false
            }, function(err, data) {
                if (err) {
                    return console.log('Error ' + err);
                }
                if (data) {
                    var po_asn_package = po_item_quantity_statusModel.findById(data._id);
                    if (po_asn_package) {
                        var new_qty = parseInt(userInput.qty);
                        po_asn_package.update({
                            qty: new_qty
                        }, callback);
                    }
                } else {
                    po_item_quantity_statusModel.findOne({
                        poId: userInput.poId,
                        packageId: packageid,
                        qtyStatus: "receiveInProgress",
                        isDeleted: false,
                        sku: userInput.sku
                    }, function(err, data) {
                        if (err) {
                            return console.log('Error ' + err);
                        }
                        if (data) {
                            var po_asn_package_item = po_item_quantity_statusModel.findById(data._id);
                            if (po_asn_package_item) {
                                var new_qty = parseInt(userInput.qty);
                                po_asn_package_item.update({
                                    isDeleted: true
                                }).exec(function(err, item_data) {
                                    po_item_quantity_statusModel.findOne({
                                        packageId: packageid,
                                        qtyStatus: "shipped",
                                        isDeleted: false,
                                        sku: userInput.sku
                                    }, function(err, result) {
                                        if (!result) {
                                            userInput['updatedBy'] = user.clientId;
                                            userInput['qtyStatus'] = 'shipped';
                                        }
                                    });
                                });
                            }
                        }
                    });
                    createitmequantitystatus(userInput, callback);
                }
            });
        }
        var updatePackge = function () {
            po_item_quantity_statusModel.find({
                packageId: poAsnPackageObj.packageId,
                asnId: poAsnPackageObj.asnId,
                isDeleted: false
            }).exec(function(err, qty_data) {
                var pack_qty_status  =   {};
                for (var i = qty_data.length - 1; i >= 0; i--) {

                    if (!pack_qty_status[qty_data[i].sku])
                        pack_qty_status[qty_data[i].sku] = {};
                    if (!pack_qty_status[qty_data[i].sku][qty_data[i].qtyStatus])
                        pack_qty_status[qty_data[i].sku][qty_data[i].qtyStatus] = 0;

                    pack_qty_status[qty_data[i].sku][qty_data[i].qtyStatus] =  pack_qty_status[qty_data[i].sku][qty_data[i].qtyStatus] + qty_data[i].qty;
                }
                var packageStatus = poAsnPackageObj.status ? packageStatus : '';
                async.forEach(pack_qty_status, function(sku_qty, async_callback){
                    if (sku_qty['receiveInProgress'] && sku_qty['receiveInProgress'] > 0) {
                        packageStatus = 'receiveInProgress';
                    }
                    else if (sku_qty['received'] && sku_qty['received'] > 0) {
                        packageStatus = 'received';
                    }
                    else if (sku_qty['shippedReversed'] && sku_qty['shippedReversed'] > 0) {
                        packageStatus = 'shippedReversed';
                    }
                    async_callback();
                }, function(){
                    po_asn_packageModel.update({
                        "asnId": poAsnPackageObj.asnId,
                        "packageId": poAsnPackageObj.packageId,
                        "isDeleted": false
                    }, {
                        $set: { packageStatus: packageStatus }
                    }, {
                        multi: true
                    }).exec(function(err, asndlts) {
                        // asynccallback();
                    });
                })
                    
            });
        }
        var postatus = function(Status, n) {
            po_item_quantity_statusModel.findOne({
                "poId": Status.poId,
                "sku": Status.sku,
                "packageId": packageid,
                isDeleted: false,
                "skuCost": {
                    $ne: ""
                }
            }, function(err, data) {
                var cost = "0";
                if (data) {
                    cost = data.skuCost;
                }
                delete Status["_id"];
                // Status["skuCost"] = cost;
                // Status["qtyStatus"] = "received";createitmequantitystatus  
                Status["qtyStatus"] = poAsnPackageObj.status;
                Status["lastModified"] = new Date();
                Status["created"] = new Date();
                Status["qty"] = Status.newQty;
                Status["packageId"] = packageid;
                Status.asnId = poAsnPackageObj.asnId;
                qtyStatus(Status, function(err, data) {
                    if (packageid !== null)
                        updatePackge();
                    Order(Status, n);
                });
            });
        };
        var createPoItem = function(Status) {
            var input = {};
            input = Status;
            input.purchaseOrderNumber = Status.poId;
            input.productName = Status.description;
            input.SKU = Status.sku;
            input.qty = Status.newQty;
            input.productUom = Status.producUom;
            // input.qty = 0;
            input.lineNumber = Status.lineNumber;
            input.originalOrder = false;
            input.created = new Date();
            input.createdBy = user.clientId;
            input.updatedBy = user.clientId; // user.clientId
            var orderItem = new orderItemModel(input);
            orderItem.save(function(err, result) {});
        }
        if (poAsnPackageObj.status == "received") {
            // set.receivedDate = new Date();
            // set.userId = user.clientId;                                 
        }
        if (poAsnPackageObj.packageId == null) {
            packageid = null;
            var set = {
                "asnStatus": "receivedInFull",
                "updatedBy": user.clientId,
                "userId": user.clientId,
                "receivedDate": new Date()
            };
            po_asnModel.update({
                "asnId": poAsnPackageObj.asnId
            }, {
                $set: set
            }, {
                multi: true
            }).exec(function(err, asnstatus) {
                if (err) {
                    asynccallback();
                    return console.log('Error ' + err);
                }
                for (var n = poAsnPackageObj.itemStatus.length - 1; n >= 0; n--) {
                    var Status = poAsnPackageObj.itemStatus[n];
                    if (Status.is_new) {
                        createPoItem(Status);
                    }
                    postatus(Status, n);
                };
            });
        } else {
            packageid = poAsnPackageObj.packageId;
            var set = {
                "packageStatus": poAsnPackageObj.status,
                "updatedBy": user.clientId,
                "userId": user.clientId,
                "receivedDate": new Date()
            };
            po_asn_packageModel.update({
                "packageId": packageid,
                "asnId": poAsnPackageObj.asnId
            }, {
                $set: set
            }, {
                multi: true
            }).exec(function(err, packageStatus) {
                if (err) {
                    asynccallback();
                    return console.log('Error ' + err);
                }
                if (poAsnPackageObj.itemStatus && poAsnPackageObj.itemStatus.length){
                    for (var n = poAsnPackageObj.itemStatus.length - 1; n >= 0; n--) {
                        var Status = poAsnPackageObj.itemStatus[n];
                        if (Status.is_new) {
                            createPoItem(Status);
                        }
                        postatus(Status, n);
                    };
                }
                else {
                    asynccallback();
                }
            });
        }
    }, function(err) {
        if(err){
           console.log(err , 'PO_ASN_ERROR');
           return callback(err);
        }
        //metohd calls if the iteration complete
        if (poAsnPackage[0] && poAsnPackage[0].asnId)
            updateASN(poAsnPackage[0].asnId);
        var result = {
            status: constant.label.SUCCESS,
            message: constant.label.PACKAGE_UPDATE
        }
        callback(null, result);
    });
}

function reverseReceiptPackageStatus(poAsnPackage, user, CreateTran, callback) {
    async.forEach(poAsnPackage, function(poAsnPackageObj, asynccallback) {
        var set = {
            "reversedDate": new Date(),
            "reversedBy": user.clientId,
            "reasonCode": poAsnPackageObj.reasonCode,
            "updatedBy": user.clientId,
            "userId": user.clientId
        };
        var Order = function(Status, n) {
            orderModel.findOne({
                "purchaseOrderNumber": Status.poId,
                isDeleted: false
            }).exec(function(err, packageorder) {
                if (packageorder) {
                    packageorder.location = packageorder.location ? packageorder.location : packageorder.shipToLocation;
                    Status["qtyStatus"] = "shippedReversed";
                    CreateTran(packageorder, function(n) {
                        if (n == 0) {
                            // asynccallback();
                        }
                    }, n, Status);
                };
            });
        }
        var qtyStatus = function(userInput, callback) {
            po_item_quantity_statusModel.findOne({
                poId: userInput.poId,
                packageId: packageid,
                qtyStatus: "received",
                isDeleted: false,
                sku: userInput.sku
            }, function(err, data) {
                if (err) {
                    return console.log('Error ' + err);
                }
                if (data) {
                    var po_asn_package_item = po_item_quantity_statusModel.findById(data._id);
                    if (po_asn_package_item) {
                        var new_qty = parseInt(userInput.qty);
                        po_asn_package_item.update({
                            isDeleted: true
                        }).exec(function(err, recv_data) {
                            po_item_quantity_statusModel.findOne({
                                packageId: packageid,
                                qtyStatus: "shipped",
                                isDeleted: false,
                                sku: userInput.sku
                            }, function(err, ship_data) {
                                if (!ship_data) {
                                    userInput['updatedBy'] = user.clientId;
                                    userInput['qtyStatus'] = 'shipped';
                                    createitmequantitystatus(userInput, callback);
                                } else {
                                    callback();
                                }
                            });
                        });
                    }
                }
            });
        }
        var postatus = function(Status, n) {
            po_item_quantity_statusModel.findOne({
                "poId": Status.poId,
                "sku": Status.sku,
                "packageId": packageid,
                isDeleted: false,
                "skuCost": {
                    $ne: ""
                }
            }, function(err, data) {
                var cost = "0";
                if (data) {
                    cost = data.skuCost;
                }
                delete Status["_id"];
                Status["qtyStatus"] = "shipped";
                Status["lastModified"] = new Date();
                Status["qty"] = Status.newQty;
                Status["packageId"] = packageid;
                Status.asnId = poAsnPackageObj.asnId;
                qtyStatus(Status, function(err, data) {
                    Order(Status, n);
                });
            });
        };
        var packageid = null;
        if (poAsnPackageObj.packageId == null) {
            packageid = null;
            if (poAsnPackageObj.status == "shippedReversed") {
                set.asnStatus = poAsnPackageObj.status;
            }
            po_asnModel.findOne({
                "asnId": poAsnPackageObj.asnId,
                "asnStatus": "received",
                isDeleted: false
            }).exec(function(err, asndetails) {
                if (asndetails) {
                    po_asnModel.update({
                        "asnId": poAsnPackageObj.asnId,
                        "asnStatus": "received",
                        "isDeleted": false
                    }, {
                        $set: set
                    }, {
                        multi: true
                    }).exec(function(err, asndlts) {
                        for (var n = poAsnPackageObj.itemStatus.length - 1; n >= 0; n--) {
                            var Status = poAsnPackageObj.itemStatus[n];
                            postatus(Status, n);
                        };
                    })
                }
                asynccallback();
            });
        } else {
            packageid = poAsnPackageObj.packageId;
            if (poAsnPackageObj.status == "shippedReversed") {
                set.packageStatus = poAsnPackageObj.status;
            }
            po_asn_packageModel.findOne({
                "packageId": packageid,
                "asnId": poAsnPackageObj.asnId,
                "packageStatus": "received",
                "isDeleted": false
            }).exec(function(err, receivedPackage) {
                if (receivedPackage) {
                    po_asn_packageModel.update({
                        "packageId": packageid,
                        "asnId": poAsnPackageObj.asnId,
                        "packageStatus": "received",
                        "isDeleted": false
                    }, {
                        $set: set
                    }, {
                        multi: true
                    }).exec(function(err, packageStatus) {
                        if (err) {
                            return console.log('Error ' + err);
                        }
                        for (var n = poAsnPackageObj.itemStatus.length - 1; n >= 0; n--) {
                            var Status = poAsnPackageObj.itemStatus[n];
                            postatus(Status, n);
                        };
                    });
                };
                asynccallback();
            });
        }
    }, function(err) {
        //metohd calls if the iteration complete
        if (poAsnPackage[0] && poAsnPackage[0].asnId)
            updateASN(poAsnPackage[0].asnId);
        var result = {
            status: constant.label.SUCCESS,
            message: constant.label.PACKAGE_UPDATE
        }
        callback(null, result);
    });
}

function closeAsnPackageStatus(poAsnPackage, user, CreateTran, callback) {
    async.forEach(poAsnPackage, function(poAsnPackageObj, asynccallback) {
        var set = {
            "updatedBy": user.clientId,
            "userId": user.clientId
        };
        var Order = function(Status, n) {
            orderModel.findOne({
                "purchaseOrderNumber": Status.poId,
                isDeleted: false
            }).exec(function(err, packageorder) {
                if (packageorder) {
                    packageorder.location = packageorder.location ? packageorder.location : packageorder.shipToLocation;
                    CreateTran(packageorder, function(n) {
                        if (n == 0) {
                            // asynccallback();
                        }
                    }, n, Status);
                };
            });
        }
        var qtyStatus = function(userInput, callback) {
            po_item_quantity_statusModel.findOne({
                poId: userInput.poId,
                packageId: packageid,
                qtyStatus: "shipped",
                isDeleted: false,
                sku: userInput.sku
            }, function(err, data) {
                if (err) {
                    return console.log('Error ' + err);
                }
                if (data) {
                    var po_asn_package_item = po_item_quantity_statusModel.findById(data._id);
                    if (po_asn_package_item) {
                        var new_qty = parseInt(userInput.qty);
                        po_asn_package_item.update({
                            qtyStatus: "closed"
                        }, callback);
                    }
                } else {
                    //  createitmequantitystatus(userInput, callback);
                }
            });
        }
        var postatus = function(Status, n) {
            po_item_quantity_statusModel.findOne({
                "poId": Status.poId,
                "sku": Status.sku,
                "packageId": packageid,
                isDeleted: false,
                "skuCost": {
                    $ne: ""
                }
            }, function(err, data) {
                var cost = "0";
                if (data) {
                    cost = data.skuCost;
                }
                delete Status["_id"];
                // Status["skuCost"] = cost;
                // Status["qtyStatus"] = "received";createitmequantitystatus  
                Status["qtyStatus"] = poAsnPackageObj.asnStatus;
                Status["lastModified"] = new Date();
                Status["qty"] = Status.qty;
                Status["packageId"] = packageid;
                Status.asnId = poAsnPackageObj.asnId;
                // console.log(Status);
                qtyStatus(Status, function(err, data) {
                    Order(Status, n);
                });
            });
        };
        var packageid = null;
        if (poAsnPackageObj.packageId == null) {
            if (poAsnPackageObj.asnStatus == "closed") {
                set.asnStatus = poAsnPackageObj.asnStatus;
            }
            packageid = null;
            po_asnModel.find({
                "asnId": poAsnPackageObj.asnId,
                isDeleted: false
            }).exec(function(err, asndetails) {
                if (asndetails) {
                    po_asnModel.update({
                        "packageId": packageid,
                        "asnId": poAsnPackageObj.asnId
                    }, {
                        $set: set
                    }, {
                        multi: true
                    }).exec(function(err, asnstatus) {
                        if (err) {
                            return console.log('Error ' + err);
                        }
                        for (var n = poAsnPackageObj.itemStatus.length - 1; n >= 0; n--) {
                            var Status = poAsnPackageObj.itemStatus[n];
                            postatus(Status, n);
                        };
                    });
                }
                asynccallback();
            });
        } else {
            packageid = poAsnPackageObj.packageId;
            if (poAsnPackageObj.asnStatus == "closed") {
                set.packageStatus = poAsnPackageObj.asnStatus;
            }
            po_asn_packageModel.find({
                "packageId": packageid,
                "asnId": poAsnPackageObj.asnId,
                "packageStatus": "received",
                isDeleted: false
            }).exec(function(err, receivedPackage) {
                if (receivedPackage) {
                    po_asn_packageModel.update({
                        "packageId": packageid,
                        "asnId": poAsnPackageObj.asnId
                    }, {
                        $set: set
                    }, {
                        multi: true
                    }).exec(function(err, packageStatus) {
                        if (err) {
                            return console.log('Error ' + err);
                        }
                        for (var n = poAsnPackageObj.itemStatus.length - 1; n >= 0; n--) {
                            var Status = poAsnPackageObj.itemStatus[n];
                            postatus(Status, n);
                        };
                    });
                }
                asynccallback();
            });
        }
    }, function(err) {
        //metohd calls if the iteration complete
        if (poAsnPackage[0] && poAsnPackage[0].asnId)
            updateASN(poAsnPackage[0].asnId);
        var result = {
            status: constant.label.SUCCESS,
            message: constant.label.PACKAGE_UPDATE
        }
        callback(null, result);
    });
}

function createitemqtystatus(userInput, callback) {
    if (!userInput.sku && userInput.qtyStatus === constant.status.DRAFTORDER) {
        po_item_quantity_statusModel.findOne({
            poId: userInput.poId,
            qtyStatus: userInput.qtyStatus,
            isDeleted: false
        }).update({isDeleted: true}, callback);
    } else {
        po_item_quantity_statusModel.findOne({
            poId: userInput.poId,
            qtyStatus: userInput.qtyStatus,
            sku: userInput.sku,
            isDeleted: false
        }, function(err, data) {
            if (err) {
                return console.log('Error ' + err);
            }
            if (data) {
                var po_asn_package = po_item_quantity_statusModel.findById(data._id);
                if (po_asn_package) {
                    var new_qty = parseInt(userInput.qty) + parseInt(data.qty);
                    po_asn_package.update({
                        qty: new_qty
                    }, callback);
                }
            } else {
                createitmequantitystatus(userInput, callback);
            }
            var numberOfSKU = {
                numberOfSKU: userInput.numberOfSKU
            };
            orderModel.findOne({
                purchaseOrderNumber: userInput.poId,
                isDeleted: false
            }).update(numberOfSKU, function(err, data) {});
        });
    }
}
// function updateNosku(purchaseOrder, callback) {
//     orderItemModel.count({
//         purchaseOrderNumber: purchaseOrder,
//         isDeleted: false
//     }, function(err, noofsku) {
//         if (err) {
//             callback('Error ' + err);
//         } else {
//             var updatepurchaseOrder = {
//                 numberOfSKU: noofsku
//             };
//             createOrder(purchaseOrder, updatepurchaseOrder, callback);
//         }
//     });
// }
function getPoStatus(poAsnPackageObj, asndata, podata, status, header, sku, callback) {
    var query = {};
    if (podata) {
        query['poId'] = {
            $in: podata
        };
    }
    // if (status) {
    //     query['qtyStatus'] = {
    //         $in: status.split(',')
    //     };
    // }
    if (sku) {
        query['sku'] = {
            $in: sku.split(',')
        };
    }
    if (asndata.length) {
        query['asnId'] = {
            $in: asndata
        };
    }
    // var packageId = poAsnPackageObj.packageId;
    if (poAsnPackageObj.length) {
        query['$or'] = [{
            'packageId': {
                $in: poAsnPackageObj
            }
        }, {
            'packageId': null
        }];
    }
    po_item_quantity_statusModel.find({
        $and: [query, {
            isDeleted: false
        }]
    }).sort({
        'lineNumber': 1
    }).exec(function(err, StatusData) {
        StatusData = JSON.parse(JSON.stringify(StatusData));
        // console.log('.................', 'query', query);
        // for (var n = statusData.length - 1; n >= 0; n--) {
        //     for (var j = skudata.length - 1; j >= 0; j--) {
        //         if (skudata[j].ProductTbl.sku == statusData[n].sku) {
        //             statusData[n] = assignItemStatus(statusData[n], skudata[j]);
        //         }
        //     };
        // };
        // if (status == "received" || status == 'receiveInProgress') {
        var skuData = {};
        // query['qtyStatus'] = {
        //     $in: ['shipped', 'shipInProgress', 'confirmed', 'submitted', 'lost', 'shippedLess', 'shippedMore', 'received']
        // };
        // po_item_quantity_statusModel.find({
        //     $and: [query, {
        //         isDeleted: false
        //     }]
        // }, null, {sort: { lineNumber: 1 }}, function(err, qtyStatusData) {
        //     query['packageId'] = null;
        //     query['qtyStatus'] = {
        //         $in: ['confirmed', 'submitted']
        //     };
        //     for (var n = qtyStatusData.length - 1; n >= 0; n--) {
        //         skuData[qtyStatusData[n].qtyStatus] == undefined ? skuData[qtyStatusData[n].qtyStatus] = {} : undefined;
        //         skuData[qtyStatusData[n].qtyStatus][qtyStatusData[n].asnId] == undefined ? skuData[qtyStatusData[n].qtyStatus][qtyStatusData[n].asnId] = {} : undefined;
        //         if (qtyStatusData[n].packageId && qtyStatusData[n].packageId != null) {
        //             skuData[qtyStatusData[n].qtyStatus][qtyStatusData[n].asnId][qtyStatusData[n].packageId] == undefined ? skuData[qtyStatusData[n].qtyStatus][qtyStatusData[n].asnId][qtyStatusData[n].packageId] = {} : undefined;
        //             skuData[qtyStatusData[n].qtyStatus][qtyStatusData[n].asnId][qtyStatusData[n].packageId][qtyStatusData[n].sku] = qtyStatusData[n];
        //         } else {
        //             skuData[qtyStatusData[n].qtyStatus][qtyStatusData[n].asnId][qtyStatusData[n].sku] = qtyStatusData[n];
        //         }
        //     };
        //     po_item_quantity_statusModel.find({
        //         $and: [query, {
        //             isDeleted: false
        //         }]
        //     },null , {sort: { lineNumber: 1 }}, function(err, qtyStatusData) {
        //         for (var n = qtyStatusData.length - 1; n >= 0; n--) {
        //             skuData[qtyStatusData[n].qtyStatus] == undefined ? skuData[qtyStatusData[n].qtyStatus] = {} : undefined;
        //             skuData[qtyStatusData[n].qtyStatus][qtyStatusData[n].poId] == undefined ? skuData[qtyStatusData[n].qtyStatus][qtyStatusData[n].poId] = {} : undefined;
        //             skuData[qtyStatusData[n].qtyStatus][qtyStatusData[n].poId][qtyStatusData[n].sku] = qtyStatusData[n];
        //         };
                // callback(err, statusData);
                callback(err, skuData, StatusData);
            // });
        // });
        // } else {
        //     callback(err, statusData);
        // };
        // var skus = [];
        // var statusResolved = ['lost', 'shippedLess', 'shippedMore'];
        // for (var n = itemStatusData.length - 1; n >= 0; n--) {
        //     skus.push(itemStatusData[n].sku);
        // };
        // if (skus && skus.length > 0) {
        //     request(env_config.dashPath + constant.apis.GETSKUDETAIL + skus.join() + "&locid=" + po.location, function(error, response, skudata) {
        //         if (skudata) {
        //             var skudata = JSON.parse(skudata);
        //         } else {
        //             var skudata = [];
        //         }
        // console.log('skudata');
        // console.log(skudata);
        // loadProductInfo();
        // });
        // } else {
        //     callback(err, itemStatusData);
        // }
    });
}

function getUserLocations (userId, callback) {
    console.log("URL:",env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userId);
    request(env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userId, function(err, response, data) {
        
        if (err)
            return callback(err);

        try {
            if (data) {
                var locArray    =   [];
                var loc = JSON.parse(data);
                Object.keys(loc.hierarchy).forEach(function(n) {
                    // console.log('loc', loc.hierarchy[n]);
                    locArray.push(loc.hierarchy[n].id);
                });
                return callback(null, locArray);
            }
        } catch (ex) {
            return callback(ex);
        }
    });
}

function getPoAsn(userInput, header, callback) {
    var asnId = userInput['asnid'];
    var poId = userInput['poid'];
    var package_id = userInput['package_id'];
    var fromDate = userInput['fromdate'];
    var toDate = userInput['todate'];
    var status = userInput['status'];
    var sku = userInput['sku'];
    var frmQty = userInput['frmQty'];
    var toQty = userInput['toQty'];
    var frmPrice = userInput['frmPrice'];
    var toPrice = userInput['toPrice'];
    var locationIds = userInput['locationId'];
    var orderType = userInput['orderType'];
    var loc_data = null;
    var condition = {};
    var page_offset = 0;
    var page_lmt = 0;
    if (userInput['page_offset'] && userInput['page_lmt']) {
        page_offset = parseInt(userInput['page_offset']) || 0;
        page_lmt = parseInt(userInput['page_lmt']) || 10;
    }
    //var user = {};
    var locArray = [];
    condition["$and"] = [];
    condition["$and"].push({
        isDeleted: false
    });
    console.log('url', env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId);
    // request(env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId, function(err, response, data) {
    
    function getPoAsnData() {
        try {
            if (locationIds && locationIds != '')
            {
                locArray = locationIds.split(',');
            }
            else if (loc_data) {
                locArray = loc_data;
            } else {
                return callback('no user location data');
            }
            var query = {};
            var poPackageResult = [];
            if (asnId) {
                query['asnId'] = new RegExp(asnId, "g");
            }
            if (status) {
                query["$and"] = [];
                query["$and"].push({
                    $or: [{
                        "asnStatus": {
                            $exists: false
                        }
                    }, {
                        "asnStatus": {
                            $in: status.split(',')
                        }
                    }]
                });
            }
            if (fromDate || toDate) {
                query['asnDate'] = {};
                if (fromDate) {
                    query['asnDate']['$gte'] = new Date(fromDate);
                }
                if (toDate) {
                    toDate = new Date(toDate);
                    toDate.setDate(toDate.getDate() + 1); // To increase toDate by 1 as it fails to on equal condition.
                    query['asnDate']['$lte'] = toDate;
                }
            }

            if (frmQty || toQty) {
                query['asnQty'] = {};
                if (frmQty) {
                    query['asnQty']['$gte'] = parseFloat(frmQty);
                }
                if (toQty) {
                    query['asnQty']['$lte'] = parseFloat(toQty);
                }
            }

            if (frmPrice || toPrice) {
                query['asnCost'] = {};
                if (frmPrice) {
                    query['asnCost']['$gte'] = parseFloat(frmPrice);
                }
                if (toPrice) {
                    query['asnCost']['$lte'] = parseFloat(toPrice);
                }
            }
            if (poId) {
                query['poId'] = {
                    $in: poId.split(',')
                };
            }

            var poDataObj = {};
            function getAsnData() {
                po_asnModel.find({
                    $and: [query, {
                        isDeleted: false
                    }]
                }).count().exec(function(err, total_count) {
                    po_asnModel.find({
                        $and: [query, {
                            isDeleted: false
                        }]
                    }).sort({
                        'lastModified': -1
                    }).skip(page_offset).limit(page_lmt).exec(function(err, data) {

                        if(err)
                            return callback(err);

                        try {
                            if (data && data.length) {
                                var asndata = [];
                                var asndataObj = {};
                                var receivedData = {};
                                var podata = [];
                                var AsnPackage = [];
                                var qs = require('querystring');
                                var poAsnPackagerev = [];
                                data    =   JSON.parse(JSON.stringify(data));
                                for (var j = 0, length2 = data.length; j < length2; j++) {
                                    var poAsnObj = data[j];
                                    if (poAsnObj.asnId) {
                                        if( poAsnObj.userId && poAsnPackagerev.indexOf(poAsnObj.userId) == -1)
                                        poAsnPackagerev.push(poAsnObj.userId);

                                        asndataObj[poAsnObj.asnId] = poAsnObj;
                                        asndataObj[poAsnObj.asnId].totalOrderSKU = 0;
                                        asndata.push(poAsnObj.asnId);
                                        podata.push(poAsnObj.poId);
                                    }
                                }
                                data = null;
                                // getOrder(podata, locArray, orderType, function(err, po) {
                                    getOrderItems(podata, function(err, orderItemData){
                                        getshipmentByAsn(asndata, status, package_id, function(err, poPackage) {
                                            try {
                                                if (poPackage) {
                                                    // var poPackage = {};
                                                    var revUser = {};
                                                    var ALLUser = {};
                                                    poPackage = JSON.parse(JSON.stringify(poPackage));
                                                    for (var j = 0, length2 = poPackage.length; j < length2; j++) {
                                                        var poAsnPackageObj = poPackage[j];
                                                        if (poAsnPackageObj.packageId) {
                                                            AsnPackage[j] = poAsnPackageObj.packageId;

                                                            if  (!asndataObj[poAsnPackageObj.asnId]['packages'])
                                                                asndataObj[poAsnPackageObj.asnId]['packages'] = {};
                                                            asndataObj[poAsnPackageObj.asnId]['packages'][poAsnPackageObj.packageId] = poAsnPackageObj;

                                                            if(poAsnPackageObj.userId && poAsnPackagerev.indexOf(poAsnPackageObj.userId) == -1)
                                                            poAsnPackagerev.push(poAsnPackageObj.userId);
                                                        }
                                                    }
                                                    var allUserName = {};
                                                    poPackage = null;
                                                }
                                                getAllUserNames(poAsnPackagerev, function(err, data){
                                                        if (err){
                                                            console.log("loc_err",err);
                                                        }
                                                        if(data){
                                                            allUserName = JSON.parse(data);
                                                        }
                                                    getPoStatus(AsnPackage, asndata, podata, status, header, sku, function(err, skuStatusData, qtyStatusData) {
                                                        var skus        =   [];
                                                        var poqtyData   =   [];
                                                        var asnObj     =   {};

                                                        AsnPackage  =   null;
                                                        asndata     =   null;
                                                        podata      =   null;
                                                        status      =   null;

                                                        async.forEach(qtyStatusData, function (qtyData, asyn_callback) {
                                                            if (qtyData.asnId) {
                                                                try {
                                                                    skus.push(qtyData.sku);
                                                                    var orderData = poDataObj[asndataObj[qtyData.asnId].poId];
                                                                    var receiptCondition = (((qtyData.qtyStatus === 'receiveInProgress' || qtyData.qtyStatus === 'received') && orderData.purchaseOrderType === 'MR_IBT_M') || ((qtyData.qtyStatus === 'receiveInProgress' || qtyData.qtyStatus === 'received') && orderData.purchaseOrderType === 'MR_MAN'))
                                                                    if (qtyData.qtyStatus === 'shipped' || qtyData.qtyStatus === 'shipInProgress' || qtyData.qtyStatus === 'closed' || receiptCondition){
                                                                        if (!asnObj[qtyData.asnId])
                                                                            asnObj[qtyData.asnId]  =   {};
                                                                        if (!asnObj[qtyData.asnId]['skus'])
                                                                            asnObj[qtyData.asnId]['skus'] = {};
                                                                        if (!asnObj[qtyData.asnId]['skus'][orderData.shipToLocation])
                                                                            asnObj[qtyData.asnId]['skus'][orderData.shipToLocation] = [];
                                                                        asnObj[qtyData.asnId]['skus'][orderData.shipToLocation].push({
                                                                            sku: qtyData.sku,
                                                                            asnId: qtyData.asnId,
                                                                            packageId: qtyData.packageId,
                                                                            poId: qtyData.poId,
                                                                            qty: qtyData.qty
                                                                        });

                                                                        if (qtyData.packageId) {
                                                                            if (asndataObj[qtyData.asnId] && asndataObj[qtyData.asnId]['packages'] && asndataObj[qtyData.asnId]['packages'][qtyData.packageId]) {
                                                                                if (!asndataObj[qtyData.asnId]['packages'][qtyData.packageId]['skus'])
                                                                                    asndataObj[qtyData.asnId]['packages'][qtyData.packageId]['skus'] = {};
                                                                                asndataObj[qtyData.asnId]['packages'][qtyData.packageId]['skus'][qtyData.sku] = qtyData;
                                                                            }
                                                                        }
                                                                        else {
                                                                            if (asndataObj[qtyData.asnId]) {
                                                                                if (!asndataObj[qtyData.asnId]['skus'])
                                                                                    asndataObj[qtyData.asnId]['skus'] = {};
                                                                                asndataObj[qtyData.asnId]['skus'][qtyData.sku] = qtyData;
                                                                            }
                                                                        }
                                                                    }
                                                                    if (qtyData.qtyStatus === 'received' || qtyData.qtyStatus === 'receiveInProgress'){
                                                                        if (!receivedData[qtyData.asnId])
                                                                            receivedData[qtyData.asnId] = {};
                                                                        if (qtyData.packageId) {
                                                                            if (!receivedData[qtyData.asnId][qtyData.packageId])
                                                                                receivedData[qtyData.asnId][qtyData.packageId] = {};
                                                                            receivedData[qtyData.asnId][qtyData.packageId][qtyData.sku] = qtyData;
                                                                        }
                                                                        else {
                                                                            receivedData[qtyData.asnId][qtyData.sku] = qtyData;
                                                                        }
                                                                    }
                                                                    asyn_callback();
                                                                }
                                                                catch (e){
                                                                    console.log("qtyStatusData_err:",e);
                                                                }
                                                            }
                                                        }, function(){
                                                            try {
                                                                qtyStatusData = null;
                                                                var options = {
                                                                    url: env_config.dashPath + constant.apis.GETSKUDATAS,
                                                                    headers: {
                                                                        'Content-Type': 'application/x-www-form-urlencoded'
                                                                    }
                                                                };
                                                                options['method'] = 'POST';
                                                                var srch = {
                                                                    srch: JSON.stringify(asnObj)
                                                                };
                                                                options['body'] = qs.stringify(srch);
                                                                request(options, function(error, response, productData) {
                                                                    if (error) {
                                                                        return callback(error);
                                                                    }
                                                                    if (productData) {
                                                                        try {
                                                                            productData    =   JSON.parse(productData);
                                                                        }
                                                                        catch(e){
                                                                            console.log("Error_3:",e);
                                                                            return callback("Failed to get dashboard data");
                                                                        }

                                                                        var hasShippedPack = false;

                                                                        function withPackageFormat (asnValue) {

                                                                            try {
                                                                                var asnId = asnValue.asnId;
                                                                                var packageId = asnValue.packageId;
                                                                                var productCode = asnValue.productCode;
                                                                                var sku = asnValue.sku;

                                                                                if (asndataObj[asnId] && asndataObj[asnId]['packages'] 
                                                                                    && asndataObj[asnId]['packages'][packageId] && asndataObj[asnId]['packages'][packageId]['skus']
                                                                                    && asndataObj[asnId]['packages'][packageId]['skus'][sku])
                                                                                {
                                                                                    if (!(sku === productCode
                                                                                        && asndataObj[asnId]['packages'][packageId]['skus'][productCode]
                                                                                        && asndataObj[asnId]['packages'][packageId]['skus'][productCode]['skuArr']))
                                                                                    {
                                                                                        var asnSku = asndataObj[asnId]['packages'][packageId]['skus'][sku];
                                                                                        delete asndataObj[asnId]['packages'][packageId]['skus'][sku];
                                                                                    }
                                                                                    asnSku['description'] = asnValue.description;
                                                                                    
                                                                                    if (orderItemData[asnValue.poId] && orderItemData[asnValue.poId][sku]){
                                                                                        asnSku['producUom'] = orderItemData[asnValue.poId][sku]['producUom'];
                                                                                        asnSku['originalOrder'] = orderItemData[asnValue.poId][sku]['originalOrder'];
                                                                                    }

                                                                                    asndataObj[asnId]['purchaseOrderType']  =   poDataObj[asnValue.poId]['purchaseOrderType'];
                                                                                    asndataObj[asnId]['shipToLocation']  =   poDataObj[asnValue.poId]['shipToLocation'];

                                                                                    if (!asndataObj[asnId]['packages'][packageId]['skus'][productCode]){
                                                                                        asndataObj[asnId]['packages'][packageId]['skus'][productCode] = {};
                                                                                    }

                                                                                    asndataObj[asnId]['packages'][packageId]['skus'][productCode]['styleDescription'] = asnValue.styleDescription;
                                                                                    asndataObj[asnId]['packages'][packageId]['skus'][productCode]['stylecode'] = productCode;

                                                                                    if (!asndataObj[asnId]['packages'][packageId]['skus'][productCode]['skuArr']){
                                                                                        asndataObj[asnId]['packages'][packageId]['skus'][productCode]['skuArr'] = [];
                                                                                    }

                                                                                    if (receivedData[asnId] && receivedData[asnId][packageId] && receivedData[asnId][packageId][sku]){
                                                                                        asnSku.newQty = receivedData[asnId][packageId][sku].qty;
                                                                                    }
                                                                                    if(asndataObj[asnId]['packages'][packageId]){
                                                                                        asndataObj[asnId]['packages'][packageId]['receiveduser'] = allUserName[asndataObj[asnId]['packages'][packageId].userId] ? allUserName[asndataObj[asnId]['packages'][packageId].userId] : {};
                                                                                    }
                                                                                    if(asndataObj[asnId]['packages'][packageId]){
                                                                                        asndataObj[asnId]['packages'][packageId]['reverseduser'] = allUserName[asndataObj[asnId]['packages'][packageId].reversedBy] ? allUserName[asndataObj[asnId]['packages'][packageId].reversedBy] : {};
                                                                                    }

                                                                                    asndataObj[asnId]['packages'][packageId]['skus'][productCode]['skuArr'].push(asnSku);
                                                                                    
                                                                                    if (!asndataObj[asnId]['packages'][packageId]['skus'][productCode]['totalShippedQty']){
                                                                                        asndataObj[asnId]['packages'][packageId]['skus'][productCode]['totalShippedQty'] = 0;
                                                                                    }
                                                                                    asndataObj[asnId]['packages'][packageId]['skus'][productCode]['totalShippedQty'] = asndataObj[asnId]['packages'][packageId]['skus'][productCode]['totalShippedQty'] + asnSku['qty'];
                                                                                    asnId = packageId = productCode = sku = null;
                                                                                }
                                                                            }
                                                                            catch (e) {
                                                                                console.log("Error_withPackageFormat:",e);
                                                                            }    
                                                                        }

                                                                        function withoutPackageFormat (asnValue) {
                                                                            try {
                                                                                var asnId = asnValue.asnId;
                                                                                var productCode = asnValue.productCode;
                                                                                var sku = asnValue.sku;
                                                                                var poId = asnValue.poId;

                                                                                if (asndataObj[asnId] && asndataObj[asnId]['skus'] && asndataObj[asnId]['skus'][sku]) {
                                                                                    var asnSku = asndataObj[asnId]['skus'][sku];
                                                                                    delete asndataObj[asnId]['skus'][sku];
                                                                                    asnSku['description'] = asnValue.description;
                                                                                    
                                                                                    if (orderItemData[poId] && orderItemData[poId][sku]){
                                                                                        asnSku['producUom'] = orderItemData[poId][sku]['producUom'];
                                                                                        asnSku['originalOrder'] = orderItemData[poId][sku]['originalOrder'];
                                                                                    }

                                                                                    asndataObj[asnId]['purchaseOrderType']  =   poDataObj[poId]['purchaseOrderType'];
                                                                                    asndataObj[asnId]['shipToLocation']  =   poDataObj[poId]['shipToLocation'];
                                                                                    asndataObj[asnId]['numberOfPackages'] = 0;

                                                                                    if (!asndataObj[asnId]['skus'][productCode]){
                                                                                        asndataObj[asnId]['skus'][productCode] = {};
                                                                                    }

                                                                                    asndataObj[asnId]['skus'][productCode]['styleDescription'] = asnValue.styleDescription;
                                                                                    asndataObj[asnId]['skus'][productCode]['stylecode'] = productCode;

                                                                                    if (!asndataObj[asnId]['skus'][productCode]['skuArr']){
                                                                                        asndataObj[asnId]['skus'][productCode]['skuArr'] = [];
                                                                                    }

                                                                                    if (receivedData[asnId]  && receivedData[asnId][sku]){
                                                                                        asnSku.newQty = receivedData[asnId][sku].qty;
                                                                                    }

                                                                                    asndataObj[asnId]['skus'][productCode]['skuArr'].push(asnSku);
                                                                                    
                                                                                    if (!asndataObj[asnId]['skus'][productCode]['totalShippedQty']){
                                                                                        asndataObj[asnId]['skus'][productCode]['totalShippedQty'] = 0;
                                                                                    }
                                                                                    asndataObj[asnId]['skus'][productCode]['totalShippedQty'] = asndataObj[asnId]['skus'][productCode]['totalShippedQty'] + asnSku['qty'];
                                                                                    asnId = productCode = sku = poId = null;
                                                                                }
                                                                            }
                                                                            catch (e) {
                                                                                console.log("Error_withoutPackageFormat:",e);
                                                                            }
                                                                        }
                                                                        async.forEach(productData, function(asnObj, asyncCallback){
                                                                            try {
                                                                                if (asndataObj[asnObj.asnId] && asndataObj[asnObj.asnId].asnStatus === 'shipped' )
                                                                                    hasShippedPack = true;

                                                                                if (asnObj.packageId)
                                                                                    withPackageFormat(asnObj);
                                                                                else if (asnObj.packageId === null)
                                                                                    withoutPackageFormat(asnObj);

                                                                                asyncCallback();
                                                                            }
                                                                            catch (e) {
                                                                               console.log("Err",e) 
                                                                            }
                                                                        
                                                                        }, function(){
                                                                            return callback(error, {
                                                                                asnData : asndataObj,
                                                                                total_count: total_count,
                                                                                hasShippedPack: hasShippedPack
                                                                            });
                                                                        });
                                                                    }
                                                                    else {
                                                                        return callback('No data found')
                                                                    }
                                                                });
                                                            }
                                                            catch (e) {
                                                                return callback (e);
                                                            }
                                                        });
                                                        // });
                                                    });
                                                });
                                            }
                                            catch (e) {
                                                return callback (e);
                                            }
                                        });
                                    });
                                // });
                                //});
                            } else {
                                return callback(err, poPackageResult);
                            }
                        } catch (e) {
                            console.log("Error_1:",e);
                            return callback(e);
                        }
                    });
                });
            }

            // else {
            condition["$and"].push(query);
            getOrder( poId, locArray, orderType, function(err, po) {
                try {
                    if (err)
                        return callback(err);

                    var po_no;
                    var poIdArr =   [];
                    po = JSON.parse(JSON.stringify(po));
                    for (var j = 0, length2 = po.length; j < length2; j++) {
                        po_no = po[j].purchaseOrderNumber;
                        if (po[j].purchaseOrderType == 'MR_MAN' || po[j].purchaseOrderType == 'MR_IBT_M') {
                            po_no = po[j].orderNumber;
                        }
                        poDataObj[po_no] = po[j];
                        poIdArr.push(po_no);
                    }
                    query['poId'] = {
                        $in: poIdArr
                    };
                    getAsnData();
                }
                catch (e){
                    console.log("getOrder_err", e);
                    return callback(e);
                }
            });
            // }
        }
        catch(e) {
            console.log("Error_8", e);
            return callback(e);
        }
    }

    if (locationIds)
        getPoAsnData();
    else if(userInput.user){
        getUserLocations(userInput.user.clientId, function(err, data){
            if (err){
                console.log("loc_err",err);
                return callback('Failed to get user locations');
            }
            loc_data = data;
            getPoAsnData();
        });
    } else {
        return callback('No user data found');
    }
}

function getAllUserNames(userInput,callback){
        console.log("GET USER NAME URL:",env_config.dashPath + constant.apis.GETUSERNAMEALLDETAILS + userInput.join());
    request(env_config.dashPath + constant.apis.GETUSERNAMEALLDETAILS +userInput.join(), function(error, response, skudata) {
        if(error)
            return callback(error);

        try{
            if(skudata){
                return callback(null, skudata);
            }
        }catch(exe){
            return callback(exe);
        }
    });
}

function getOrderItems (poIdArr, callback) {
    var query = {
        $and : [{ $or : [ { purchaseOrderNumber: {'$in': poIdArr} }, { orderNumber : {'$in': poIdArr} } ] }],
        isDeleted: false
    }
    orderItemModel.find(query, function(err, orderItem){
        if (err)
            return callback(err);
        var orderItemData = {};
        for (var i = orderItem.length - 1; i >= 0; i--) {
            //For PO
            if(orderItem[i].purchaseOrderNumber){
                if (!orderItemData[orderItem[i].purchaseOrderNumber]){
                    orderItemData[orderItem[i].purchaseOrderNumber] = {};
                }
                orderItemData[orderItem[i].purchaseOrderNumber][orderItem[i].SKU] = orderItem[i];
            }
            //For Manual Receipt
            if(orderItem[i].orderNumber){
                if (!orderItemData[orderItem[i].orderNumber]){
                    orderItemData[orderItem[i].orderNumber] = {};
                }
                orderItemData[orderItem[i].orderNumber][orderItem[i].SKU] = orderItem[i]
            }
            
        }
        callback(err, orderItemData);
    });
}

function getshipmentByAsn(asndata, status, packageId, callback) {
    var query = {};
    var poAsnPackageResult = [];
    var user = {};
    // status = 'receiveInProgress';
    if (asndata) {
        query['asnId'] = {
            $in: asndata
        };;
    }
    // if (status) {
    //     query['qtyStatus'] = {
    //         $in: status.split(',')
    //     };
    // }
    if (packageId && packageId !== 'null') {
        query['packageId'] = packageId;
    }
    po_asn_packageModel.find({
        $and: [query, {
            isDeleted: false
        }]
    }).exec(function(err, poAsnPackage) {
        callback(err, poAsnPackage);
    });
}

function getOrder(poId, locArray, orderType, callback) {
    var condition = {};
    condition['$and'] = [];
    var orcond = {};
    orcond['$or'] = [];
    var orderTypeArr = [];

    condition['$and'].push({
        isDeleted: false
    });

    condition['$and'].push({
        orderStatus: {
            '$nin' : ['submitted','returned','confirmed']
        }
    });

    orcond['$or'].push({
        "FromLocation": {
            "$in": locArray
        }
    });

    orcond['$or'].push({
        "shipToLocation": {
            "$in": locArray
        }
    });

    condition['$and'].push(orcond);

    if (poId) {
        condition['$and'].push({
            $or: [{
                "purchaseOrderNumber": {
                    $in: poId.split(',')
                }
            }, {
                "orderNumber": {
                    $in: poId.split(',')
                }
            }]
        });
    }

    if (orderType && orderType.length) {
        orderTypeArr = orderType.split(',');
        condition['$and'].push({
            $or: [{
                "purchaseOrderType": {
                    $in: orderTypeArr
                }
            }, {
                "orderType": {
                    $in: orderTypeArr
                }
            }]
        });
    }
    orderModel.find(condition).exec(function(err, packageorder) {
        console.log(err);
        callback(err, packageorder);
    });
}

function assignPackageValue(poAsnPackageObj, itemStatusData, po) {
    var obj = {};
    obj.asnId = poAsnPackageObj.asnId;
    obj.packageId = poAsnPackageObj.packageId;
    obj._id = poAsnPackageObj._id;
    obj.packageBarCode = poAsnPackageObj.packageBarCode;
    obj.trackingNumber = poAsnPackageObj.trackingNumber;
    obj.packageStatus = poAsnPackageObj.packageStatus;
    obj.shipDate = poAsnPackageObj.shipDate;
    obj.expectedDeliveryDate = poAsnPackageObj.expectedDeliveryDate;
    obj.receivedDate = poAsnPackageObj.receivedDate;
    obj.reversedDate = poAsnPackageObj.reversedDate;
    obj.reversedBy = poAsnPackageObj.reversedBy;
    obj.reasonCode = poAsnPackageObj.reasonCode;
    obj.userId = poAsnPackageObj.userId;
    obj.erpPurchaseOrder = po.erpPurchaseOrder;
    obj.reasonCode = poAsnPackageObj.reasonCode;
    obj.numberOfSKU = 0;
    obj.packageCost = 0;
    obj.SKUQty = 0;
    obj.purchaseOrderType = po.purchaseOrderType;
    obj.po_asn_status = itemStatusData;
    if (po.purchaseOrderType == 'MR_MAN' || po.purchaseOrderType == 'MR_IBT_M') {
        obj.poId = po.orderNumber;
    } else {
        obj.poId = po.purchaseOrderNumber;
    }
    return obj;
}

function assignStatus(poItemStatusObj, skuData, sku) {
    var obj = {};
    obj.asnId = poItemStatusObj.asnId;
    obj.packageId = poItemStatusObj.packageId ? poItemStatusObj.packageId : null;
    obj._id = poItemStatusObj._id;
    obj.poId = poItemStatusObj.poId;
    obj.sku = poItemStatusObj.sku;
    obj.qtyStatus = poItemStatusObj.qtyStatus;
    obj.qty = poItemStatusObj.qty;
    obj.lineNumber = poItemStatusObj.lineNumber;
    obj.skuCost = poItemStatusObj.skuCost;
    obj.styleDescription = skuData.styleDescription;
    obj.productCode = skuData.productCode;
    obj.description = skuData.description;
    obj.productDescription = skuData.productDescription;
    obj.skuCostConfirm = poItemStatusObj.skuCostConfirm;
    obj.skuCostAsn = poItemStatusObj.skuCostAsn;
    obj.producUom = sku ? sku.producUom : '';
    obj.totalProductTaxAsn = poItemStatusObj.totalProductTaxAsn;
    obj.totalProductVatAsn = poItemStatusObj.totalProductVatAsn;
    obj.totalProductCostAsn = poItemStatusObj.totalProductCostAsn;
    obj.originalOrder = sku ?  sku.originalOrder : '';
    return obj;
}
/* Jegan Added Reverse IBT Orders */
function reverseIBTOrders(userInput, header, callback) {
    var itmeQtyStatusDelete = userInput['itmeQtyStatusDelete'];
    orderModel.findOneAndUpdate({
        'purchaseOrderNumber': userInput['orderNumber']
    }, {
        $set: {
            'orderStatus': userInput['statusToSave']
        }
    }).exec(function(err, orderData) {
        if (orderData) {
            po_item_quantity_statusModel.find({
                'poId': userInput['orderNumber'],
                qtyStatus: {
                    $in: itmeQtyStatusDelete
                }
            }).exec(function(e, StatusData) {
                var poNumber = [];
                var orderSkus = [];
                var orderItemData = [];
                for (var num = StatusData.length - 1; num >= 0; num--) {
                    poNumber.push(StatusData[num].poId);
                    orderSkus.push(StatusData[num].sku);
                }
                condition = {};
                if (poNumber && poNumber != '') {
                    condition.purchaseOrderNumber = {
                        "$in": poNumber
                    }
                }
                if (orderSkus && orderSkus != '') {
                    condition.SKU = {
                        "$in": orderSkus
                    }
                }
                orderItemModel.find(condition, function(err, itemData) {
                    orderItemData = itemData;
                    var directiveData = [];
                    async.forEach(StatusData, function(data, asynccallback) {
                        var uom = '';
                        for (var n = orderItemData.length - 1; n >= 0; n--) {
                            if (orderItemData[n].SKU == data.sku && orderItemData[n].purchaseOrderNumber == data.poId) {
                                uom = orderItemData[n].producUom;
                            }
                        }
                        var toLoc;
                        if (orderData.markForLocation == '') {
                            toLoc = orderData.shipToLocation;
                        } else {
                            toLoc = orderData.markForLocation;
                        }
                        var toStoreObj = {};
                        toStoreObj = {
                            transtypeid: '',
                            stocklocationid: '',
                            asnid: '',
                            stockUOM: uom,
                            quantity: data.qty,
                            purchaseOrderNumber: orderData.purchaseOrderNumber,
                            purchaseOrderType: orderData.purchaseOrderType,
                            cost: data.skuCost,
                            sku: data.sku,
                            locationid: toLoc,
                            warehouseid: toLoc,
                            directivetype: Ordertype[orderData.purchaseOrderType]['toStore'][data.qtyStatus + '_in_rvs']
                        };
                        directiveData.push(toStoreObj);
                        var fromStoreObj = {};
                        fromStoreObj = {
                            transtypeid: '',
                            stocklocationid: '',
                            asnid: '',
                            stockUOM: uom,
                            quantity: data.qty,
                            purchaseOrderNumber: orderData.purchaseOrderNumber,
                            purchaseOrderType: orderData.purchaseOrderType,
                            cost: data.skuCost,
                            sku: data.sku,
                            locationid: orderData.FromLocation,
                            warehouseid: orderData.FromLocation,
                            directivetype: Ordertype[orderData.purchaseOrderType]['fromStore'][data.qtyStatus + '_out_rvs']
                        };
                        directiveData.push(fromStoreObj);
                        asynccallback();
                    }, function() {
                        console.log('***********');
                        console.log(directiveData);
                        po_item_quantity_statusModel.remove({
                            'poId': userInput['orderNumber'],
                            qtyStatus: {
                                $in: itmeQtyStatusDelete
                            }
                        }).exec(function(err, success) {
                            callback(null, directiveData);
                        });
                    });
                });
            });
        }
    });
}