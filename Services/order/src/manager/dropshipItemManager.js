var express = require('express');
var events = require('events');
var log = require('../log');
var dropshipModel = require('./../model/dropshipModel');
var Ordertype = require('../../config/Ordertype.json');
var dropshipItemModel = require('./../model/dropshipItemModel');
var po_item_quantity_statusModel = require('./../model/po_item_quantity_statusModel');
var constant = require('../../config/const.json');
var env_config = require('../../config/config.js');
var router = express.Router();
var eventEmitter = new events.EventEmitter();
var request = require('request');
var async = require('async');
var querystring = require('querystring');
module.exports = {
    getOrderSKUs: getOrderSKUs,
    createOrderSKUs: createOrderSKUs,
    deleteOrderSKUs: deleteOrderSKUs,
    deletePoOrderSKUs: deletePoOrderSKUs
};
/*
 * GET orderItem by id.
 */
function getOrderSKUs(userInput, callback) {
    var id = userInput['id'];
    var purchaseOrderNumber = userInput['purchaseordernumber'];
    var productStatus = userInput['productStatus'];
    var vendors = userInput['vendors'] || '';
    if (id) {
        dropshipItemModel.findById(id).exec(callback);
    } else if (purchaseOrderNumber || productStatus || vendors) {
        var query = JSON.parse('{"isDeleted" : false}');
        if (purchaseOrderNumber) {
            query['purchaseOrderNumber'] = purchaseOrderNumber;
        }
        if (productStatus) {
            query['productStatus'] = new RegExp('^' + productStatus + '$', "i");
        }
        if (vendors) {
            query['vendorData.vendorId'] = {
                $in: vendors.split(',')
            };
        }
        // orderItemModel.find(query).exec(callback);
        dropshipItemModel.find(query).sort({
            "lineNumber": 1
        }).exec(function(err, data) {
            addSKUdesc(err, data, callback);
        });
    } else {
        callback('No OrderNumber.');
    }
}

function addSKUdesc(err, data, callback) {
    var skus = [];
    for (var n = data.length - 1; n >= 0; n--) {
        skus.push(data[n].SKU);
    };
    if (skus.length > 0) {
        console.log('url');
        n = 0;
        console.log(env_config.dashPath + constant.apis.GETSKUDETAIL + skus.join() + "&locid=" + (data[n].location ? data[n].location : data[n].shipToLocation));
        request(env_config.dashPath + constant.apis.GETSKUDETAIL + skus.join() + "&locid=" + (data[n].location ? data[n].location : data[n].shipToLocation), function(error, response, skudata) {
            if (skudata) {
                var skudata = JSON.parse(skudata);
            } else {
                var skudata = {};
            }
            skus = [];
            for (var sku = data.length - 1; sku >= 0; sku--) {
                // console.log(skudata[sku]);
                var skuDesc = JSON.parse(JSON.stringify(data[sku]));
                for (var j = skudata.length - 1; j >= 0; j--) {
                    if (skudata[j].ProductTbl.sku == data[sku].SKU) {
                        // data[sku]['productCode'] = skudata[j].ProductTbl.productCode;
                        // data[sku]['description'] = skudata[j].ProductTbl.description;
                        // data[sku]['productDescription'] = skudata[j].ProductTbl.productDescription;
                        skuDesc['productCode'] = skuDesc['productCode'] ? skuDesc['productCode'] : skudata[j].ProductTbl.productCode;
                        skuDesc['description'] = skuDesc['description'] ? skuDesc['description'] : skudata[j].ProductTbl.description;
                        skuDesc['variants'] = skuDesc['variants'] ? skuDesc['variants'] : skudata[j].ProductTbl.variants;
                        // skuDesc['waist'] = skuDesc['waist'] ? skuDesc['waist'] : skudata[j].ProductTbl.waist;
                        // skuDesc['length'] = skuDesc['length'] ? skuDesc['length'] : skudata[j].ProductTbl.length;
                        skuDesc['styleColor'] = skuDesc['styleColor'] ? skuDesc['styleColor'] : skudata[j].ProductTbl.color;
                        // skuDesc['size'] = skuDesc['size'] ? skuDesc['size'] : skudata[j].ProductTbl.size;
                        skuDesc['styleDescription'] = skudata[j].ProductTbl.styleDescription;
                    }
                };
                skus.push(skuDesc);
            };
            // callback(err, data);
            callback(err, skus);
        });
    } else {
        // callback(err, data);
        callback(err, skus);
    }
}
/*
 * create orderItem.
 */
function createOrderSKUs(userInput, header, CreateTran, callback) {
    //userInput['purchaseOrderNumber']=parseInt(userInput['purchaseOrderNumber']);
    var orderItem = new dropshipItemModel(userInput);
    var purchaseOrderNumber = userInput['purchaseOrderNumber'];
    dropshipModel.findOne({
        purchaseOrderNumber: purchaseOrderNumber,
        isDeleted: false
    }, function(error, data) {
        if (data) {
            try {
                var skus = JSON.parse(userInput['skus']);
            } catch (e) {
                var skus = [];
                console.log(e);
            }
            if (skus && skus.length) {
                var createsku = [];
                var updated = 0;
                var createqtystatus = function() {};
                async.forEach(skus, function(sku, asynccallback) {
                    sku['updatedBy'] = userInput.user.clientId;
                    if(sku['productCost'] === '')
                        delete sku['productCost'];
                    if(sku['productTax'] === '')
                        delete sku['productTax'];
                    if(sku['productVat'] === '')
                        delete sku['productVat'];
                    if(sku['totalProductCost'] === '')
                        delete sku['totalProductCost'];
                    if(sku['totalProductTax'] === '')
                        delete sku['totalProductTax'];
                    if(sku['totalProductVat'] === '')
                        delete sku['totalProductVat'];
                    if (sku._id && sku._id.length) {
                        var loc = dropshipItemModel.findById(sku._id);
                        loc.update(sku, function() {
                            updated++;
                            asynccallback();
                        });
                    } else {
                        sku['createdBy'] = userInput.user.clientId;
                        delete sku._id;
                        createsku.push(sku);
                        asynccallback();
                    }
                }, function() {
                    if (createsku.length) {
                        dropshipItemModel.create(createsku, function(err) {
                            console.log('err', err);
                            callback('', {
                                status: constant.label.SUCCESS
                            });
                        });
                    } else {
                        callback('', {
                            status: constant.label.SUCCESS
                        });
                    }
                });
                // for (sku in skus) {
                // }
                // var loc = new locationitemsModel(userInput);
                // loc.save(callback);
            } else {
                callback('No skus.');
            }
        } else {
            callback('No order.');
        }
    });
}
/*
 * Ratheesh code.
 */
function updateNosku(purchaseOrder, callback) {
    dropshipItemModel.count({
        purchaseOrderNumber: purchaseOrder,
        isDeleted: false
    }, function(err, noofsku) {
        var sku = {
            numberOfSKU: noofsku
        };
        var query = {
            purchaseOrderNumber: purchaseOrder
        };
        dropshipModel.update(query, sku, callback);
    });
};
/*
 * delete orderData by id.
 */
function deleteOrderSKUs(data, callback) {
    var skus = data.id.split(',');
    var podata = [];
    async.forEach(skus, function(sku, asynccallback) {
        dropshipItemModel.findById(sku, function(err, skudata) {
            dropshipModel.findOne({
                purchaseOrderNumber: skudata.purchaseOrderNumber,
                isDeleted: false
            }, function(error, order) {
                skudata.update({
                    isDeleted: true,
                    updatedBy: data.user.clientId
                }, function(err, sku) {
                    console.log('err', err);
                    po_item_quantity_statusModel.find({
                        poId: order.purchaseOrderNumber,
                        qtyStatus: constant.status.DRAFTORDER,
                        isDeleted: false
                    }).exec(function(er, qtydata) {
                        deleteOrderSKUsTranData(order, qtydata, function(err, dataobj) {
                            podata.push(dataobj[0]);
                            po_item_quantity_statusModel.remove({
                                poId: data.purchaseOrderNumber,
                                qtyStatus: constant.status.DRAFTORDER
                            }).exec(function(err, success) {
                                asynccallback();
                            });
                        });
                    });
                });
            });
        });
    }, function() {
        callback(null, {
            status: constant.label.SUCCESS
        }, podata);
    });
};

function deleteOrderSKUsTranData(order, podata, callback) {
    var po_item_data = [];
    async.forEach(podata, function(qtyData, asynccallback) {
        var toLoc = order.location;
        if (order.purchaseOrderType == 'DROP_SHIP') {
            var dataobj = {
                transtypeid: '',
                stocklocationid: '',
                asnid: '',
                locationid: toLoc,
                stockUOM: '',
                quantity: qtyData.qty,
                purchaseOrderNumber: order.purchaseOrderNumber,
                purchaseOrderType: order.purchaseOrderType,
                cost: qtyData.skuCost,
                createTran: order.orderStatus == constant.status.DRAFT ? true : '',
                // addTran:  true,
                warehouseid: toLoc,
                sku: qtyData.sku,
                // user: user,
                directivetype: Ordertype[order.purchaseOrderType]['deleted']
            };
            po_item_data.push(dataobj);
        }
        asynccallback();
    }, function() {
        var podata = po_item_data;
        callback(null, podata);
    });
}

function deletePoOrderSKUs(data, callback) {
    dropshipModel.findById(data.id).exec(function(err, order) {
        var po_item_data = [];
        if (order) {
            dropshipItemModel.update({
                purchaseOrderNumber: order.purchaseOrderNumber,
                isDeleted: false
            }, {
                isDeleted: true,
                updatedBy: data.user.clientId
            }, {
                multi: true
            }, function(error, podata) {
                po_item_quantity_statusModel.find({
                    poId: order.purchaseOrderNumber,
                    qtyStatus: constant.status.DRAFTORDER,
                    isDeleted: false
                }).exec(function(er, itemqty) {
                    deleteOrderSKUsTranData(order, itemqty, function(err, podata) {
                        po_item_quantity_statusModel.remove({
                            poId: order.purchaseOrderNumber,
                            qtyStatus: constant.status.DRAFTORDER
                        }).exec(function(err, success) {
                            // var podata = po_item_data;
                            callback(null, podata, success.result);
                        });
                    });
                });
            });
        }
    });
}