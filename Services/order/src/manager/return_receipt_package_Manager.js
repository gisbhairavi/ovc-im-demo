var express = require('express');
var log = require('../log');
var returnManager = require('./returnManager');
var returnItemManager = require('./returnItemManager');
var receiptManager = require('./receiptManager');
var receiptItemManager = require('./receiptItemManager');
var env_config = require('../../config/config');
var constant = require('../../config/const.json');
var return_receipt_packageModel = require('./../model/return_receipt_packageModel');
var return_receipt_itemModel = require('./../model/return_receipt_itemModel');
var return_receipt_quantity_statusModel = require('./../model/return_receipt_quantity_statusModel');
var orderModel = require('./../model/return_receiptModel');
var po_asnModel = require('./../model/po_asnModel');
var router = express.Router();
var request = require("request");
var async = require('async');
var _ = require('lodash');
module.exports = {
    checkOrder: checkOrder,
    checkErpOrder: checkErpOrder,
    checkpoasn: checkpoasn,
    createpoasn: createpoasn,
    checkreceiptpackage: checkreceiptpackage,
    checkorderpackage: checkorderpackage,
    createorderpackage: createorderpackage,
    checkitmequantitystatus: checkitmequantitystatus,
    createitmequantitystatus: createitmequantitystatus,
    createitemqtystatus: createitemqtystatus,
    getOrderPackage: getOrderPackage,
    deleteReturnPackage: deleteReturnPackage,
    checkReturnData: checkReturnData,
    reverseManualReceipt: reverseManualReceipt
};
// Code By Ratheesh.
var getjson = function(data) {
    return JSON.parse(JSON.stringify(data));
};

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
function canParseJson(data) {
    if (data && /^[\],:{}\s]*$/.test(data.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
        //the json is ok
        return true;
    } else {
        //the json is not ok
        return false;
    }
}
/*
 * delete orderItem by id.
 */
function deleteReturnPackage(userdata, callback) {
    return_receipt_packageModel.findOne({
        packageId: userdata.id
    }, function(err, data) {
        if (err) {
            callback('Error ' + err);
            return console.log('Error ' + err);
        }
        if (data) {
            return_receipt_packageModel.update({
                packageId: data.packageId
            }, {
                isDeleted: true,
                updatedBy: userdata.user.clientId,
            }, {
                multi: true
            }, callback);
            return_receipt_quantity_statusModel.find({
                packageId: data.packageId
            }, function(err, data) {
                if (data) {
                    for (var j = 0, length2 = data.length; j < length2; j++) {
                        returnItemManager.deleteReturnSKU({
                            purchaseOrder: data[j].poId,
                            sku: data[j].sku,
                            packageId: data.packageId,
                            user: userdata.user
                        }, function(err, returndata) {})
                    }
                }
            });
            return_receipt_quantity_statusModel.update({
                packageId: data.packageId
            }, {
                isDeleted: true,
                updatedBy: userdata.user.clientId,
            }, {
                multi: true
            }, function(err, data) {});
        }
        else {
            callback('No return packages');
        }
    });
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

function checkErpOrder(erpPurchaseOrder, callback) {
    console.log(erpPurchaseOrder, 'erpPurchaseOrder');
    if (erpPurchaseOrder) {
        orderModel.findOne({
            erpPurchaseOrder: erpPurchaseOrder
        }).exec(callback);
    } else {
        callback();
        return console.log('Error ');
    }
}

function checkpoasn(userInput, callback) {
    po_asnModel.findOne({
        asnId: userInput.asnId,
    }).exec(function(err, data) {
        if (err) {
            return console.log('Error ' + err);
        }
        if (data) {
            createpoasn(data._id, {
                asnId: userInput.asnId,
                poId: userInput.purchaseOrderNumber
            }, function(err, poasndata) {
                po_asnModel.findOne({
                    asnId: userInput.asnId,
                }).exec(function(err, data) {
                    callback(err, data);
                });
            });
        } else {
            // {
            createpoasn(0, {
                asnId: userInput.asnId,
                poId: userInput.purchaseOrderNumber
            }, callback);
            // }
        }
    });
}

function checkreceiptpoasn(userInput, callback) {
    po_asnModel.findOne({
        asnId: userInput.asnId,
    }).exec(function(err, data) {
        if (err) {
            return console.log('Error ' + err);
        }
        if (data) {
            createpoasn(data._id, getjson({
                asnId: userInput.asnId,
                poId: userInput.orderNumber,
                asnStatus: userInput.asnStatus,
                shipDate : userInput.shipDate,
                expectedDeliveryDate : userInput.expectedDeliveryDate,
                numberOfPackages: userInput.numberOfPackages, 
                asnQty : userInput.numberOfProducts,
                asnCost: userInput.totalPoCost,
                receivedDate: userInput.receivedDate,
                created : userInput.asnCreated,
                lastModified : userInput.asnLastModified,
                createdBy: userInput.user.clientId,
                updatedBy: userInput.user.clientId,
            }), function(err, poasndata) {
                po_asnModel.findOne({
                    asnId: userInput.asnId,
                }).exec(function(err, data) {
                    callback(err, data);
                });
            });
        } else {
            // {
            createpoasn(0, getjson({
                asnId: userInput.asnId,
                poId: userInput.orderNumber,
                asnStatus: userInput.asnStatus,
                shipDate : userInput.shipDate,
                expectedDeliveryDate : userInput.expectedDeliveryDate,
                receivedDate: userInput.receivedDate,
                numberOfPackages: userInput.numberOfPackages, 
                asnQty : userInput.numberOfProducts,
                asnCost: userInput.totalPoCost,
                created : userInput.asnCreated,
                lastModified : userInput.asnLastModified,
                createdBy: userInput.user.clientId,
                updatedBy: userInput.user.clientId,
            }), callback);
        }
    });
}

function createpoasn(id, userInput, callback) {
    if (id == 0) {
        userInput['createdBy'] = userInput.createdBy;
        userInput['updatedBy'] = userInput.updatedBy;
        var po_asn = new po_asnModel(userInput);
        po_asn.save(callback);
    } else {
        userInput['updatedBy'] = userInput.updatedBy;
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

function checkReturnData(order, header, callback) {
    var orderPackage = order.orderPackage;
    var allSKU = {};
    var resultskus = [];
    var location = order['location'];
    for (var j = 0, length2 = orderPackage.length; j < length2; j++) {
        var orderSKUs = orderPackage[j].orderSKU;
        if (orderSKUs) {
           _.forEach (orderSKUs, function(orderSKU, n) {
                allSKU[orderSKU.SKU] = allSKU[orderSKU.SKU] ? (+allSKU[orderSKU.SKU]) + (+orderSKU.qty) : (+orderSKU.qty);
            });
        }
    }
    resultskus = Object.keys(allSKU);
    var querystring = require('querystring');
    var formData = querystring.stringify({
        sku: resultskus
    });
    var contentLength = formData.length;
    var options = {
        url: env_config.apiPath + constant.apis.INVENTORIESSERVICE + location,
        method: 'POST',
        body: formData,
        headers: {
            'authorization': header,
            'Content-Length': contentLength,
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    };
    console.log("url", env_config.apiPath + constant.apis.INVENTORIESSERVICE + location);
    request(options, function(err, res, data) {
        var result_skus = {};
        async.eachSeries(resultskus, function(orderSKU, skuasynccallback) {
            var balanceData = JSON.parse(data);
            result_skus[orderSKU] = {};
            balanceData[orderSKU] && balanceData[orderSKU]['oh'] ? result_skus[orderSKU]['oh'] = balanceData[orderSKU]['oh'].value : result_skus[orderSKU]['oh'] = 0;
            result_skus[orderSKU]['qty'] = allSKU[orderSKU];
            result_skus[orderSKU]['status'] = result_skus[orderSKU]['oh'] >= allSKU[orderSKU];
            skuasynccallback();
        }, function(err, poasnpkgsuccess, poasn) {
            return callback(err, {
                data: result_skus
            });
        });
    });
}

function checkorderpackage(userInput, CreateTran, runTransaction, header, callback) {
    var orderNumber = userInput.orderNumber;
    var canupdate = function(data) {
        var sku = 0;
        var orderSKU = Object.keys(data);
        for (var j = 0, length2 = orderSKU.length; j < length2; j++) {
            var skudata = JSON.parse(JSON.stringify(data[orderSKU[j]]));
            if (skudata.status == false) {
                ++sku;
            }
        }
        return sku;
    };
    var order={};

    //To add UOM for the unchanged sku
    var addUOM  =   function (data_sku, uom_callback) {
        var data_skuLength  =   data_sku.length;
        var qry_sku =   [];
        for (var num = data_skuLength - 1; num >= 0; num--) {
            qry_sku.push(data_sku[num].sku);
        }
        if (qry_sku && qry_sku.length) {
            return_receipt_itemModel.find({
                purchaseOrderNumber: orderNumber,
                SKU: {'$in': qry_sku},
                isDeleted: false
            }, function (err, itmUomData) {
                if (!err){
                    var UomObj  =   {}
                    for (var itm = itmUomData.length - 1; itm >= 0; itm--) {
                        UomObj[itmUomData[itm].SKU] =   {'UOM': itmUomData[itm].producUom}
                    }
                    uom_callback(null, UomObj);
                }
            });
        }
        else {
            uom_callback('No Data found');
        }
    }

    //To get the unchanged sku's
    var getTranSkus =   function(modifiedSkuData, sku_callback) {
        var modifiedSkuArr  =   [];
        var modifiedSkuLen  =   modifiedSkuData.length;

        for (var num = modifiedSkuLen - 1; num >= 0; num--) {
            modifiedSkuArr.push(modifiedSkuData[num].SKU);
        }

        var sku_cond    =   {};
        sku_cond['isDeleted']   =   false;
        sku_cond['sku']         =   { '$nin': modifiedSkuArr };
        sku_cond['poId']        =   orderNumber;
        return_receipt_quantity_statusModel.find(sku_cond, function(err, tranSkuData){
            if(err)
                sku_callback([]);
            else{
                addUOM(tranSkuData, function(err, UomObj){
                    sku_callback(tranSkuData, UomObj);
                })
            }
        });

    }

    //To Create transactions for unchanged sku's
    var tranService     =   function( order_sku_data, order, UomObj ) {
        if (order_sku_data && order_sku_data.length){
            for (var itm = order_sku_data.length - 1; itm >= 0; itm--) {
                CreateTran(order, getjson({
                    poId: order.orderNumber,
                    packageId: order_sku_data[itm].packageId,
                    asnid: userInput.asnId,
                    sku: order_sku_data[itm].sku,
                    qtyStatus: order_sku_data[itm].qtyStatus,
                    uom: (UomObj && UomObj[order_sku_data[itm].sku]) ? UomObj[order_sku_data[itm].sku].UOM : '',
                    itemForceClosedReasonCode: null,
                    itemOnHoldReasonCode: null,
                    qty: order_sku_data[itm].qty,
                    lineNumber: order_sku_data[itm].lineNumber,
                    skuCost: order_sku_data[itm].skuCost,
                    location: order.location,
                    user: userInput.user,
                    createdBy: userInput.user.clientId,
                    updatedBy: userInput.user.clientId
                }));
            }
        }
    }

    var updatepackage = function() {
        checkOrder(orderNumber, function(err, order) {
            console.log(err, order, userInput.orderPackage);
            if (userInput.CreateTran) {}
            if (order) {
                if (userInput.hasOwnProperty('orderPackage')) {
                    var orderPackage = userInput.orderPackage;
                    if (Array.isArray(orderPackage)) {
                        async.eachSeries(orderPackage, function(pckg_details, asynccallback) {
                            createPackage(getjson({
                                packageId: pckg_details.packageId,
                                packageBarCode: pckg_details.packageBarCode,
                                trackingNumber: pckg_details.trackingNumber,
                                packageStatus: pckg_details.packageStatus,
                                numberOfSKU : userInput.numberOfSKU,
                                shipDate: pckg_details.shipDate,
                                expectedDeliveryDate: pckg_details.expectedDeliveryDate,
                                fromLocation: pckg_details.fromLocation,
                                fromStreetName: pckg_details.fromStreetName,
                                fromStreetNumber: pckg_details.fromStreetNumber,
                                fromCity: pckg_details.fromCity,
                                fromPostalCode: pckg_details.fromPostalCode,
                                fromCountry: pckg_details.fromCountry,
                                toLocation: pckg_details.shipToLocation,
                                toStreetName: pckg_details.toStreetName,
                                toStreetNumber: pckg_details.toStreetNumber,
                                toCity: pckg_details.toCity,
                                toPostalCode: pckg_details.toPostalCode,
                                toCountry: pckg_details.toCountry,
                                toPhoneNumber: null,
                                receivedDate: null,
                                user: userInput.user
                            }), function(err, poasnpkgsuccess) {
                                if (err) {
                                    return callback(err);
                                }
                                if (pckg_details.hasOwnProperty('orderSKU')) {
                                    var orderSKUs = pckg_details.orderSKU;
                                    async.eachSeries(orderSKUs, function(orderSKU, skuasynccallback) {
                                        orderSKU.purchaseOrderNumber = orderNumber;
                                        orderSKU.user = userInput.user;
                                        returnItemManager.checkpo(orderSKU, header, function(err, data) {
                                            var status = getjson({
                                                asnId: userInput.asnId,
                                                asnid: userInput.asnId,
                                                poId: orderNumber,
                                                uom: orderSKU.producUom,
                                                packageId: pckg_details.packageId,
                                                sku: orderSKU.SKU,
                                                qtyStatus: orderSKU.qtyStatus,
                                                itemForceClosedReasonCode: null,
                                                itemOnHoldReasonCode: null,
                                                qty: orderSKU.qty,
                                                lineNumber: orderSKU.lineNumber,
                                                skuCost: orderSKU.productCost,
                                                user: userInput.user
                                            });
                                            checkitmequantitystatus(status, function(err, itmqty) {
                                                if (err) {
                                                    return callback(err);
                                                }
                                                CreateTran(order, status);
                                            });
                                            skuasynccallback();
                                        });
                                    }, function(err) {

                                        getTranSkus(orderSKUs, function(allSKUData, UomObj){
                                            tranService(allSKUData, order, UomObj);                                            
                                        });

                                        asynccallback();

                                    });
                                } else {
                                    asynccallback();
                                }
                            });
                        }, function(err, poasnpkgsuccess, poasn) {
                            console.log(err, orderPackage);

                            runTransaction();

                            return callback(err, {
                                n: orderPackage.length
                            });
                        });
                    } else {
                        callback("Return Order Package error");
                    }
                } else {
                    callback("No Return Order Package Found");
                }
            } else {
                callback("No Return Order Found");
            }
        })
    };
    checkReturnData(userInput, header, function(err, validateResult) {
        checkOrder(orderNumber, function(err, order) {
            if (canupdate(validateResult.data) == 0 || (order.orderStatus != constant.status.RETURNQTY)) {
                order=order;
                updatepackage();
            } else {
                callback(validateResult);
            }
        });
    });
}

function checkreceiptpackage(userInput, deletedSkuData, header, runTransaction, Createrecvtran, callback) {
    var orderNumber = userInput.orderNumber;
        receiptManager.Saverpt(userInput, header, function(err, order) {
            console.log(err, order, userInput.orderPackage);
            if (order) {
                if(deletedSkuData && deletedSkuData.length){
                    receiptItemManager.deleteReceiptItem(deletedSkuData, header, Createrecvtran, function(err, del_data){
                    });
                }
                    
                checkreceiptpoasn(userInput, function(err, asnData) {
                });

                //To add UOM for the unchanged sku
                var addUOM  =   function (data_sku, uom_callback) {
                    var data_skuLength  =   data_sku.length;
                    var qry_sku =   [];
                    for (var num = data_skuLength - 1; num >= 0; num--) {
                        qry_sku.push(data_sku[num].sku);
                    }
                    if (qry_sku && qry_sku.length) {
                        return_receipt_itemModel.find({
                            orderNumber: orderNumber,
                            SKU: {'$in': qry_sku},
                            isDeleted: false
                        }, function (err, itmUomData) {
                            if (!err){
                                var UomObj  =   {}
                                for (var itm = itmUomData.length - 1; itm >= 0; itm--) {
                                    UomObj[itmUomData[itm].SKU] =   {'UOM': itmUomData[itm].producUom}
                                }
                                uom_callback(null, UomObj);
                            }
                        });
                    }
                    else {
                        uom_callback('No Data found');
                    }
                }

                //To get the unchanged sku's
                var getTranSkus =   function(modifiedSkuData, sku_callback) {
                    var modifiedSkuArr  =   [];
                    var modifiedSkuLen  =   modifiedSkuData.length;

                    for (var num = modifiedSkuLen - 1; num >= 0; num--) {
                        modifiedSkuArr.push(modifiedSkuData[num].SKU);
                    }

                    var sku_cond    =   {};
                    sku_cond['isDeleted']   =   false;
                    sku_cond['sku']         =   { '$nin': modifiedSkuArr };
                    sku_cond['poId']        =   orderNumber;
                    return_receipt_quantity_statusModel.find(sku_cond, function(err, tranSkuData){
                        if(err)
                            sku_callback([]);
                        else{
                            addUOM(tranSkuData, function(err, UomObj){
                                sku_callback(tranSkuData, UomObj);
                            })
                        }
                    });

                }

                //To Create transactions for unchanged sku's
                var tranService     =   function( order_sku_data, UomObj, tran_callback ) {
                    if (order_sku_data && order_sku_data.length){
                        // for (var itm = order_sku_data.length - 1; itm >= 0; itm--) {
                        async.eachSeries(order_sku_data, function(tranSKU, tran_asynccallback) {
                            Createrecvtran(order, getjson({
                                poId: order.orderNumber,
                                packageId: tranSKU.packageId,
                                asnid: userInput.asnId,
                                sku: tranSKU.sku,
                                qtyStatus: tranSKU.qtyStatus,
                                uom: (UomObj && UomObj[tranSKU.sku]) ? UomObj[tranSKU.sku].UOM : '',
                                itemForceClosedReasonCode: null,
                                itemOnHoldReasonCode: null,
                                qty: tranSKU.qty,
                                lineNumber: tranSKU.lineNumber,
                                skuCost: tranSKU.skuCost,
                                location: order.location,
                                user: userInput.user,
                                createdBy: userInput.user.clientId,
                                updatedBy: userInput.user.clientId
                            }));
                            tran_asynccallback();
                        }, function () {
                            tran_callback(1);
                        })
                    }
                    else {
                        tran_callback(0);
                    }
                }

                var createOrderSKU = function(skuData,action,pckg_details,skucallback){
                    async.eachSeries(skuData, function(orderSKU, skuasynccallback) {
                        orderSKU.orderNumber = order.orderNumber;
                        orderSKU.user = userInput.user;
                        order.location = order.shipToLocation;
                        if(action == "withoutPackage")
                            var packageId = null;
                        else
                            var packageId = pckg_details.packageId;
                        receiptItemManager.checkpo(orderSKU, header, function(err, data) {
                            checkitmequantitystatus(getjson({
                                asnId: userInput.asnId,
                                poId: order.orderNumber,
                                packageId: packageId,
                                sku: orderSKU.SKU,
                                uom: orderSKU.producUom,
                                qtyStatus: orderSKU.qtyStatus,
                                itemForceClosedReasonCode: null,
                                itemOnHoldReasonCode: null,
                                qty: orderSKU.qty,
                                lineNumber: orderSKU.lineNumber,
                                skuCost: orderSKU.productCost,
                                user: userInput.user,
                                createdBy: userInput.user.clientId,
                                updatedBy: userInput.user.clientId,
                                location: userInput.shipToLocation
                            }), function(err, itmqty) {
                                if (err) {
                                    return callback(err);
                                }
                                Createrecvtran(order, getjson({
                                    poId: order.orderNumber,
                                    packageId: packageId,
                                    asnid: userInput.asnId,
                                    sku: orderSKU.SKU,
                                    qtyStatus: orderSKU.qtyStatus,
                                    uom: data.producUom,
                                    itemForceClosedReasonCode: null,
                                    itemOnHoldReasonCode: null,
                                    qty: orderSKU.qty,
                                    lineNumber: orderSKU.lineNumber,
                                    skuCost: orderSKU.productCost,
                                    location: order.location,
                                    user: userInput.user,
                                    createdBy: userInput.user.clientId,
                                    updatedBy: userInput.user.clientId
                                }));
                            });
                            skuasynccallback();
                        });
                    },function(){
                        skucallback();
                    });
                }
                if (userInput.hasOwnProperty('orderPackage')) {
                    var orderPackage = userInput.orderPackage;
                    if (Array.isArray(orderPackage)) {
                        async.eachSeries(orderPackage, function(pckg_details, asynccallback) {
                            createPackage(getjson({
                                asnId: userInput.asnId,
                                packageId: pckg_details.packageId,
                                packageBarCode: pckg_details.packageBarCode,
                                trackingNumber: pckg_details.trackingNumber,
                                packageStatus: pckg_details.packageStatus,
                                numberOfSKU : userInput.numberOfSKU,
                                shipDate: pckg_details.shipDate,
                                expectedDeliveryDate: pckg_details.expectedDeliveryDate,
                                fromLocation: pckg_details.fromLocation,
                                fromStreetName: pckg_details.fromStreetName,
                                fromStreetNumber: pckg_details.fromStreetNumber,
                                fromCity: pckg_details.fromCity,
                                fromPostalCode: pckg_details.fromPostalCode,
                                fromCountry: pckg_details.fromCountry,
                                toLocation: pckg_details.shipToLocation,
                                toStreetName: pckg_details.toStreetName,
                                toStreetNumber: pckg_details.toStreetNumber,
                                toCity: pckg_details.toCity,
                                toPostalCode: pckg_details.toPostalCode,
                                toCountry: pckg_details.toCountry,
                                toPhoneNumber: pckg_details.toPhoneNumber,
                                receivedDate: pckg_details.receivedDate,
                                user: userInput.user,
                                userId: userInput.user.clientId,
                                created: pckg_details.created,
                                lastModified: pckg_details.lastModified,
                                createdBy: userInput.user.clientId,
                                updatedBy: userInput.user.clientId
                            }), function(err, poasnpkgsuccess) {
                                if (err) {
                                    return callback(err);
                                }
                                if (pckg_details.hasOwnProperty('orderSKU')) {
                                    var orderSKUs = pckg_details.orderSKU;
                                    action = "withPackage"

                                    order.location = order.shipToLocation;
                                    createOrderSKU(orderSKUs, action, pckg_details, function(err,skuSuccess){

                                        getTranSkus(orderSKUs, function(allSKUData, UomObj){
                                            tranService(allSKUData, UomObj, function(cond) {
                                                runTransaction();
                                            });
                                        });

                                        asynccallback();

                                    });

                                } else {
                                    asynccallback();
                                }
                            });
                        }, function(err, poasnpkgsuccess, poasn) {
                            console.log(err, poasnpkgsuccess, poasn);
                            return callback(err, {
                                n: orderPackage.length
                            });
                        });
                    }
                }
                else if (userInput.hasOwnProperty('orderSKU'))
                {
                    var orderSKUs = userInput.orderSKU;
                    if (Array.isArray(orderSKUs)) {
                        action = "withoutPackage"
                        createOrderSKU(orderSKUs,action,null,function(err,skuSuccess){
                            return callback(err, {
                                status : "success"
                            });
                        });
                    }
                } 
                else {
                    callback("No manual receipt Package Found");
                }
            } else {
                callback("No manual receipt Found");
            }
        })
}

function createorderpackage(id, userInput, callback) {
    if (id == 0) {
        userInput['createdBy'] = userInput.createdBy;
        userInput['updatedBy'] = userInput.updatedBy;
        var order_asn_package = new return_receipt_packageModel(userInput);
        order_asn_package.save(callback);
    } else {
        var order_asn_package = return_receipt_packageModel.findById(id);
        if (order_asn_package) {
            userInput['updatedBy'] = userInput.updatedBy;
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

function checkitmequantitystatus(userInput, callback) {
    if(userInput.qtyStatus == 'returned'){
        var queryCondition  =   {
            poId: userInput.poId,
            packageId: userInput.packageId,
            sku: userInput.sku
        };
    }else{
        var queryCondition  =   {
            poId: userInput.poId,
            packageId: userInput.packageId,
            sku: userInput.sku,
            qtyStatus: userInput.qtyStatus
        };
    }
    return_receipt_quantity_statusModel.findOne(queryCondition, function(err, data) {
        if (err) {
            return console.log('Error ' + err);
        }
        userInput['createdBy'] = userInput.createdBy;
        userInput['updatedBy'] = userInput.updatedBy;
        if (data) {
            if (userInput.qty) {
                var order_asn_package = return_receipt_quantity_statusModel.findById(data._id);
                if(order_asn_package && data.qtyStatus == 'draft' && userInput.qtyStatus == 'returned'){
                    var new_qty = parseInt(userInput.qty);
                    order_asn_package.update({
                        qtyStatus: userInput.qtyStatus,
                        created:new Date(),
                        lastModified:new Date(),
                        qty: new_qty,
                        updatedBy: userInput.updatedBy,
                        isDeleted: false
                    }, callback);
                }else{
                    var new_qty = parseInt(userInput.qty);
                    order_asn_package.update({
                        qty: new_qty,
                        updatedBy: userInput.updatedBy,
                        isDeleted: false
                    }, callback);
                }
            } else {
                callback(err, data);
            }
        } else {
            createitmequantitystatus(userInput, callback);
        }
    });
}

function createitmequantitystatus(userInput, callback) {
    var noArr = ['skuCost', 'skuCostConfirm', 'skuCostAsn'];
    userInput = delNotNovalue(userInput, noArr);
    orderModel.findOne({
        "orderNumber": userInput.poId,
        isDeleted: false
    }).exec(function(err, packageorder) {
        var toLoc;
        if (packageorder.markForLocation == '' || !packageorder.markForLocation) {
            toLoc = packageorder.shipToLocation;
        } else {
            toLoc = packageorder.markForLocation;
        }
        userInput['location']  = toLoc;
        var order_item_quantity_status = new return_receipt_quantity_statusModel(userInput);
        order_item_quantity_status.save(callback);
    });
}

function createitemqtystatus(userInput, callback) {
    return_receipt_quantity_statusModel.findOne({
        poId: userInput.poId,
        qtyStatus: userInput.qtyStatus,
        sku: userInput.sku
    }, function(err, data) {
        if (err) {
            return console.log('Error ' + err);
        }
        if (data) {
            var order_asn_package = return_receipt_quantity_statusModel.findById(data._id);
            if (order_asn_package) {
                var new_qty = parseInt(userInput.qty) + parseInt(data.qty);
                order_asn_package.update({
                    qty: new_qty
                }, callback);
            }
        } else {
            createitmequantitystatus(userInput, callback);
        }
    });
}

function getOrderPackage(data, header, callback) {
    var order_package = data;
    if (order_package && (order_package.hasOwnProperty('po_id') || order_package.hasOwnProperty('asn_id'))) {
        var query = {};
        query['$match'] = {
            isDeleted: false
        };
        if (order_package.hasOwnProperty('po_id')) {
            query['$match']['poId'] = order_package.po_id;
        }
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
                        return_data[data[n].sku]['qty'] = parseInt((return_data[data[n].sku]['qty'] ? return_data[data[n].sku]['qty'] : 0)) + parseInt(data[n].qty);
                    }
                }
                return return_data;
            };
            var getvalues = function(resultskus, skudata, location, loadAsnPackage) {
                var querystring = require('querystring');
                var formData = querystring.stringify({
                    sku: resultskus
                });
                var contentLength = formData.length;
                var options = {
                    url: env_config.apiPath + constant.apis.INVENTORIESSERVICE + location,
                    method: 'GET',
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
                            result = JSON.parse(data['body']);
                            callback(result);
                        });
                    }
                ], function(skuwac) {
                    loadAsnPackage(skudata, skuwac);
                });
            };
            async.eachSeries(po_asn_status, function(po_asnstatus, asynccallback) {
                var data = po_asnstatus.data;
                if (data.packageId) {
                    if (asn.indexOf(data.packageId) == -1) {
                        asn.push(data.packageId);
                        po_asn[data.packageId] = [];
                    }
                    returnItemManager.getReturnItem({
                        sku: data.sku,
                        purchaseordernumber: order_package.po_id
                    }, function(err, skudata) {
                        if (skudata.length) {
                            var returnskudata = JSON.parse(JSON.stringify(skudata[0]));
                            returnskudata.qtyStatus = qtyStatus(data);
                            po_asn[data.packageId].push(returnskudata);
                        }
                        delete data.packageId;
                        asynccallback();
                    });
                } else {
                    delete data.packageId;
                    asynccallback();
                }
            }, function(err) {
                loadPackage();
            });
            var loadPackage = function(data) {
                var skus = [];
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
                checkOrder(order_package.po_id, function(err, orderdata) {
                    if (orderdata) {
                        console.log('url');
                        console.log(env_config.dashPath + constant.apis.GETSKUDETAIL + skus.join() + "&locid=" + (orderdata.location ? orderdata.location : orderdata.shipToLocation));
                        request(env_config.dashPath + constant.apis.GETSKUDETAIL + skus.join() + "&locid=" + (orderdata.location ? orderdata.location : orderdata.shipToLocation), function(error, response, skudata) {
                            if (skudata) {
                                var skudata = JSON.parse(skudata);
                            } else {
                                var skudata = {};
                            }
                            var skuwac = getvalues(skus.join(), skudata, (orderdata.location ? orderdata.location : orderdata.shipToLocation), loadAsnPackage);
                        });
                    } else {
                        callback('No Return Order Found');
                    }
                });
                var loadAsnPackage = function(skudata, skuwac) {
                        for (var n = asn.length - 1; n >= 0; n--) {
                            x['c' + n] = 1;
                            var packagedata = {};
                            packagedata.numberOfSKU = 0;
                            packagedata.packageCost = 0;

                            for (var sku = po_asn[asn[n]].length - 1; sku >= 0; sku--) {
                                var po_asn_item = po_asn[asn[n]][sku];
                                for (var j = skudata.length - 1; j >= 0; j--) {
                                    if (skudata[j].ProductTbl.sku == po_asn_item.SKU) {
                                        po_asn_item['productCode'] = skudata[j].ProductTbl.productCode;
                                        po_asn_item['description'] = skudata[j].ProductTbl.description;
                                        po_asn_item['productDescription'] = skudata[j].ProductTbl.productDescription;
                                        po_asn_item['styleDescription'] = skudata[j].ProductTbl.styleDescription;
                                        po_asn_item['variants'] = skudata[j].ProductTbl.variants;
                                    }
                                };
                                try{
                                    if (po_asn[asn[n]][sku] && po_asn_item.qtyStatus && po_asn_item.qtyStatus[po_asn_item.SKU] && po_asn_item.qtyStatus[po_asn_item.SKU]['qty']){
                                        po_asn[asn[n]][sku].qty = po_asn_item.qtyStatus[po_asn_item.SKU]['qty'];
                                    }
                                }catch(e){
                                    console.log(e , 'LOAD_PACKAGE_ERROR');
                                }
                            
                                if (skuwac) {
                                    for (var j = skuwac.length - 1; j >= 0; j--) {
                                        if (skuwac[j].sku == po_asn_item.SKU) {
                                            po_asn_item['wac'] = skuwac[j].wac;
                                        }
                                    };
                                }
                                packagedata.numberOfSKU = packagedata.numberOfSKU + parseInt(po_asn_item.qty);
                                packagedata.packageCost = packagedata.packageCost + parseFloat(po_asn_item.totalProductCost);
                            };
                            getpopackage(asn[n], po_asn[asn[n]], packagedata, n, function(err, v, po_asn_package) {
                                po_res.push(po_asn_package);
                                delete x['c' + v];
                                if (Object.keys(x).length == 0) {
                                    callback(err, po_res);
                                    // getASN(po_res, function(err, po_res) {
                                    //     callback(err, po_res);
                                    // });
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
        var order = JSON.parse(JSON.stringify(order_package));
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
            asnId: asn[j]
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

function reverseManualReceipt(poAsnPackage, user, CreateTran, callback) {
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
                "orderNumber": Status.poId,
                isDeleted: false
            }).exec(function(err, packageorder) {
                console.log(packageorder);

                if (packageorder) {
                    packageorder.location = packageorder.location ? packageorder.location : packageorder.shipToLocation;
                    packageorder.orderStatus = "draft";
                    Status["qtyStatus"] = "receiveInProgress";
                    CreateTran(packageorder, function(n) {
                        orderModel.update({
                            "orderNumber": Status.poId,
                            isDeleted: false
                        },{
                            "orderStatus" : "draft"
                        }).exec(function (error, success) {
                            // callback();
                        });
                        if (n == 0) {
                            // asynccallback();
                        }
                    }, n, Status);
                };
            });
        }
        var qtyStatus = function(userInput, callback) {
            return_receipt_quantity_statusModel.findOne({
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
                    var po_asn_package_item = return_receipt_quantity_statusModel.findById(data._id);
                    if (po_asn_package_item) {
                        var new_qty = parseInt(userInput.qty);
                        po_asn_package_item.update({
                            isDeleted: true
                        }).exec(function(err, recv_data) {
                            return_receipt_quantity_statusModel.findOne({
                                packageId: packageid,
                                qtyStatus: "receiveInProgress",
                                isDeleted: false,
                                sku: userInput.sku
                            }, function(err, ship_data) {
                                if (!ship_data) {
                                    userInput['updatedBy'] = user.clientId;
                                    userInput['qtyStatus'] = 'receiveInProgress';
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
            return_receipt_quantity_statusModel.findOne({
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
                Status["qtyStatus"] = "receiveInProgress";
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
            if (poAsnPackageObj.status == "receiveInProgress") {
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
            if (poAsnPackageObj.status == "receiveInProgress") {
                set.packageStatus = poAsnPackageObj.status;
            }
            return_receipt_packageModel.findOne({
                "packageId": packageid,
                "asnId": poAsnPackageObj.asnId,
                "packageStatus": "received",
                "isDeleted": false
            }).exec(function(err, receivedPackage) {
                if (receivedPackage) {
                    return_receipt_packageModel.update({
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
        var result = {
            status: "success",
            message: "Package reversed"
        }
        callback(null, result);
    });
}