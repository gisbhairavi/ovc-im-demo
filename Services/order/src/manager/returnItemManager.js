var express = require('express');
var events = require('events');
var log = require('../log');
var return_receiptModel = require('./../model/return_receiptModel');
var return_receipt_itemModel = require('./../model/return_receipt_itemModel');
var return_receipt_quantity_statusModel = require('./../model/return_receipt_quantity_statusModel');
var return_receipt_packageModel = require('./../model/return_receipt_packageModel');
var constant = require('../../config/const.json');
var router = express.Router();
var Ordertype = require('../../config/Ordertype.json');
var async = require('async');
var eventEmitter = new events.EventEmitter();
var request = require('request');
module.exports = {
    getReturnItem: getReturnItem,
    createReturnItem: createReturnItem,
    checkpo: checkpo,
    editReturnItem: editReturnItem,
    deleteReturnItem: deleteReturnItem,
    deleteReturnSKU: deleteReturnSKU,
    deleteReturnData: deleteReturnData
};
/*
 * coded by ArunStefen.
 */
/*
 * GET orderItem by id.
 */
function getReturnItem(userInput, callback) {
    var id = userInput['id'];
    var purchaseOrderNumber = userInput['purchaseordernumber'];
    var sku = userInput['sku'];
    var productStatus = userInput['productStatus'];
    if (id) {
        return_receipt_itemModel.findById(id).exec(callback);
    } else if (purchaseOrderNumber || sku || productStatus) {
        var query = JSON.parse('{"isDeleted" : false}');
        if (purchaseOrderNumber) {
            query['purchaseOrderNumber'] = purchaseOrderNumber;
        }
        if (productStatus) {
            query['productStatus'] = new RegExp('^' + productStatus + '$', "i");
        }
        if (sku) {
            query['SKU'] = new RegExp('^' + sku + '$', "i");
        }
        return_receipt_itemModel.find(query).sort({
            "lineNumber": -1
        }).exec(callback);
    } else {
        return_receipt_itemModel.find({
            isDeleted: false
        }).sort({
            "lineNumber": -1
        }).exec(callback);
    }
}
/*
 * create orderItem.
 */
function createReturnItem(userInput, header, callback) {
    //userInput['purchaseOrderNumber']=parseInt(userInput['purchaseOrderNumber']);
    userInput['createdBy'] = userInput.user.clientId;
    userInput['updatedBy'] = userInput.user.clientId;
    var orderItem = new return_receipt_itemModel(userInput);
    var purchaseOrderNumber = userInput['purchaseOrderNumber'];
    return_receipt_itemModel.find({
        purchaseOrderNumber: purchaseOrderNumber,
        isDeleted: false
    }, function(error, data) {
        if (!error) {
            orderItem.save(function(err, result) {
                // updateNosku(purchaseOrderNumber, function() {});
                callback(err, result);
                /*var options = {
                  url: 'http://devsar.ovcdemo.com:3000/invtransactionservice',
                  headers: { 'authorization': header},
                  method: 'PUT',
                  form:  {'directivetype':dir,'locationid':loc,'sku':sku,'cost':cost,'quantity':qty}
                };

                request(options, function (err, response, body) {         
                  
                  if (!err && response.statusCode == 200) {
                    body = JSON.parse(body);
                    if(body["status"] == 'error'){
                     callback(err,null);
                    }else{
                     callback(err,body); 
                   }
                  }else {
                    console.log(err);
                  }

                }) */ // Request Call Ends.
            });
        } else {
            console.log(error);
        }
    });
}
/* Ratheesh.
 * create or update orderItem.
 */
function checkpo(userInput, header, callback) {
    return_receipt_itemModel.findOne({
        purchaseOrderNumber: userInput['purchaseOrderNumber'],
        SKU: userInput['SKU'],
        isDeleted: false
    }).exec(function(err, returndata) {
        if (err) {
            return callback(err);
        }
        if (returndata) {
            editReturnItem(returndata._id, userInput, function(err, data) {
                if (err) {
                    return callback(err);
                }
                if (data.ok) {
                    getReturnItem({
                        id: returndata._id
                    }, callback);
                }
            });
        } else {
            createReturnItem(userInput, header, callback);
        }
    });
}
/*
 * edit orderItem by id.
 */
function editReturnItem(id, userInput, callback) {
    var orderItem = return_receipt_itemModel.findById(id);
    var orderConfirmed = 0;
    var orderShipped = 0;
    var orderReceived = 0;
    var orderStatus = null;
    if (orderItem) {
        userInput['updatedBy'] = userInput.user.clientId;
        orderItem.update(userInput, function(err, data) {
            callback(err, data);
            return_receipt_itemModel.find({
                purchaseOrderNumber: userInput['purchaseOrderNumber'],
                isDeleted: false
            }, function(error, records) {
                if (records.length > 0) {
                    for (var i = 0; i < records.length; i++) {
                        if (records[i]['productStatus']) {
                            if (records[i]['productStatus'] == constant.status.CONFIRMEDQTY) {
                                orderConfirmed = orderConfirmed + 1;
                            } else if (records[i]['productStatus'] == constant.status.SHIPPEDQTY) {
                                orderShipped = orderShipped + 1;
                            } else if (records[i]['productStatus'] == constant.status.RECEIVEDQTY) {
                                orderReceived = orderReceived + 1;
                            }
                        }
                    }
                    if (orderConfirmed > 0 || orderShipped > 0 || orderReceived > 0) {
                        if (records.length == (orderConfirmed + orderShipped + orderReceived)) {
                            orderStatus = constant.status.CONFIRMEDQTY;
                        }
                        if (records.length == (orderShipped + orderReceived)) {
                            orderStatus = constant.status.SHIPPEDQTY;
                        }
                        if (records.length == orderReceived) {
                            orderStatus = constant.status.RECEIVEDQTY;
                        }
                        if (orderStatus != null) {
                            var query = {
                                purchaseOrderNumber: userInput['purchaseOrderNumber']
                            };
                            var dataToInsert = {
                                orderStatus: orderStatus
                            };
                            return_receiptModel.findOneAndUpdate(query, dataToInsert, {
                                upsert: true
                            }, function(er, data2) {});
                        }
                    }
                }
                // updateNosku(userInput['purchaseOrderNumber'], function() {});
            });
        });
    }
}
/*
 * Ratheesh code.
 */
function updateNosku(purchaseOrder, callback) {
    return_receipt_itemModel.count({
        purchaseOrderNumber: purchaseOrder,
        isDeleted: false
    }, function(err, noofsku) {
        var sku = {
            numberOfSKU: noofsku
        };
        var query = {
            purchaseOrderNumber: purchaseOrder
        };
        orderModel.update(query, sku, callback);
    });
};
/*
 * delete orderItem by id.
 */
function deleteReturnItem(data, callback) {
    var ObjectId = require('mongoose').Types.ObjectId;
    if (ObjectId.isValid(data.id)) {
        var orderItem = return_receipt_itemModel.findById(data.id);
        orderItem.update({
            isDeleted: true,
            updatedBy: data.user.clientId
        }, callback);
        return_receipt_itemModel.findById(data.id, function(err, skudata) {
            deleteReturnSKUqty(skudata, {user:data.user}, function(err, skudata) {});
        });
    } else {
        callback("SKU not found.");
    }
};

function deleteReturnSKUqty(data, user, callback) {
    var toDeleteQuery = {
        poId: data.purchaseOrderNumber,
        sku: data.SKU,
        isDeleted: false
    }
    if (data.packageId){
        toDeleteQuery.packageId = data.packageId;
    }
    return_receipt_quantity_statusModel.update(toDeleteQuery, {
        isDeleted: true,
        updatedBy: user.clientId
    }, {
        // upsert: true
        multi: true
    }).exec(callback);
}
/*
 * delete ordersku.
 */
function deleteReturnSKU(data, callback) {
    var toDeleteQuery = {
        purchaseOrderNumber: data.purchaseOrder,
        SKU: data.sku,
        isDeleted: false
    }
    var orderItem = return_receipt_itemModel.findOneAndUpdate(toDeleteQuery, {
        isDeleted: true,
        updatedBy: data.user.clientId
    }, callback);
    return_receipt_itemModel.findOne({
        purchaseOrderNumber: data.purchaseOrder,
        SKU: data.sku
    }, function(err, skudata) {
        if (skudata)
            deleteReturnSKUqty(skudata,{user:data.user}, function(err, skudata) {});
    });
};

function deleteReturnData(data, callback) {
    console.log('!!!!!!!!!!',data);
    // console.log('@@@@@@@@@@@',packageStatus);
    // console.log('###########',purchaseOrder);

                    var return_deleted = [];
    return_receipt_itemModel.findOne({
        purchaseOrderNumber: data.returnOrderNumber,
        // orderStatus: 'draft',
        isDeleted: false
    }).exec(function(err, returnData){
        console.log('********',returnData);
        if(returnData) {
            return_receipt_itemModel.update({
                purchaseOrderNumber: data.returnOrderNumber,
                isDeleted: false
            },{
                isDeleted: true,
                 updatedBy: data.user.clientId
            },{ multi: true},function( er, returndata){
                console.log('&&&&&&&&',returndata);
                return_receiptModel.findOne({
                    orderNumber: data.returnOrderNumber,
                }).exec(function(error, returnOrder){
                return_receipt_quantity_statusModel.find({
                    poId: data.returnOrderNumber,
                    qtyStatus: constant.status.DRAFTQTY,
                    isDeleted: false
                }).exec(function(error, returnqty){
                    async.forEach(returnqty, function(returnqtydata, asynccallback){
                        console.log(')))))))',returnqtydata);
                        var loc = (returnOrder.location ? returnOrder.location : returnOrder.shipToLocation);
                        var dataobj = {
                            transtypeid: '',
                            stocklocationid: '',
                            asnid: returnqtydata.asnid,
                            locationid: loc,
                            stockUOM: returnqtydata.uom,
                            quantity: returnqtydata.qty,
                            purchaseOrderNumber: returnOrder.orderNumber,
                            purchaseOrderType: returnOrder.purchaseOrderType,
                            cost: returnqtydata.skuCost,
                            warehouseid: (returnOrder.location ? returnOrder.location : returnOrder.shipToLocation),
                            sku: returnqtydata.sku,     
                            createTran: returnOrder.orderStatus == constant.status.DRAFT?true:'',
                            directivetype: Ordertype[returnOrder.orderType]['deleted']
                        };
                        return_deleted.push(dataobj);
                        asynccallback();
                    },function(){
                        return_receipt_quantity_statusModel.find({
                            poId: data.purchaseOrderNumber
                        },'packageId').exec(function(e,returndetails){
                            var pacId = [];
                            for(var n = returndetails.length - 1; n>=0; n--){
                                pacId.push(returndetails[n].packageId);
                            }
                            if (pacId.length > 0){
                                return_receipt_packageModel.update({
                                    packageId:{
                                        $in: pacId
                                    }
                                }, {
                                    isDeleted: true,
                                    updatedBy: data.user.clientId
                                },{multi: true}).exec(function(){
                                    return_receipt_packageModel.update({
                                        poId:data.returnOrderNumber
                                    },{
                                        isDeleted: true,
                                         updatedBy: data.user.clientId
                                    }, {multi:true}).exec();
                                });

                            }
                        });
                        callback(null,return_deleted,returndata);
                    });
                });
                });

            });
        }else{
                        callback(null,return_deleted,'No Data.');
        }
    });
}