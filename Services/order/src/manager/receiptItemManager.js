var express = require('express');
var events = require('events');
var log = require('../log');
var return_receiptModel = require('./../model/return_receiptModel');
var return_receipt_itemModel = require('./../model/return_receipt_itemModel');
var return_receipt_packageModel = require('./../model/return_receipt_packageModel');
var return_receipt_quantity_statusModel = require('./../model/return_receipt_quantity_statusModel');
var constant = require('../../config/const.json');
var Ordertype = require('../../config/Ordertype.json');
var async = require('async');
var router = express.Router();
var eventEmitter = new events.EventEmitter();
var request = require('request');
module.exports = {
    getReceiptItem: getReceiptItem,
    createReceiptItem: createReceiptItem,
    editReceiptItem: editReceiptItem,
    checkpo: checkpo,
    deleteReceiptItem: deleteReceiptItem,
    deleteReceiptData: deleteReceiptData
};

var getjson = function(data) {
    return JSON.parse(JSON.stringify(data));
};

/*
 * GET orderItem by id.
 */
function getReceiptItem(userInput, callback) {
    var id = userInput['id'];
    var purchaseOrderNumber = userInput['purchaseordernumber'];
    var orderNumber = userInput['orderNumber'];
    var sku = userInput['sku'];
    var productStatus = userInput['productStatus'];
    if (id) {
        return_receipt_itemModel.findById(id).exec(callback);
    } else if (purchaseOrderNumber || productStatus || orderNumber || sku) {
        var query = JSON.parse('{"isDeleted" : false}');
        if (orderNumber) {
            query['orderNumber'] = orderNumber;
        }
        if (sku) {
            query['SKU'] = sku;
        }
        if (purchaseOrderNumber) {
            query['purchaseOrderNumber'] = purchaseOrderNumber;
        }
        if (productStatus) {
            query['productStatus'] = new RegExp('^' + productStatus + '$', "i");
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
function createReceiptItem(userInput, header, callback) {
    //userInput['purchaseOrderNumber']=parseInt(userInput['purchaseOrderNumber']);
    userInput['createdBy']=userInput.user.clientId;
    userInput['updatedBy']=userInput.user.clientId;
    if(userInput['productCost'] === '')
        delete userInput['productCost'];
    if(userInput['productTax'] === '')
        delete userInput['productTax'];
    if(userInput['productVat'] === '')
        delete userInput['productVat'];
    if(userInput['totalProductCost'] === '')
        delete userInput['totalProductCost'];
    if(userInput['totalProductTax'] === '')
        delete userInput['totalProductTax'];
    if(userInput['totalProductVat'] === '')
        delete userInput['totalProductVat'];
    var orderItem = new return_receipt_itemModel(userInput);
    // var erpOrderNumber = new return_receipt_itemModel('erpOrderNumber');
    var purchaseOrderNumber = userInput['purchaseOrderNumber'];
    var orderNumber = userInput['orderNumber'];
    return_receiptModel.find({
        orderNumber: orderNumber,
        isDeleted: false
    }, function(error, data) {
        if (!error) {
            orderItem.save(function(err, result) {
                // updateNosku(purchaseOrderNumber, function() {});
                /*var dir = data[0]['directiveId'];
                var loc = data[0]['location'];
                var sku=userInput['SKU'];
                var cost=userInput['productCost'];
                var qty=userInput['qty'];*/
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
            console.log(error); callback(error);
        }
    });
}
/*
 * edit orderItem by id.
 */
function editReceiptItem(id, userInput, callback) {
    var orderItem = return_receipt_itemModel.findById(id);
    var orderConfirmed = 0;
    var orderShipped = 0;
    var orderReceived = 0;
    var orderStatus = null;
    if (orderItem) {
        if(userInput['productCost'] === '')
            delete userInput['productCost'];
        if(userInput['productTax'] === '')
            delete userInput['productTax'];
        if(userInput['productVat'] === '')
            delete userInput['productVat'];
        if(userInput['totalProductCost'] === '')
            delete userInput['totalProductCost'];
        if(userInput['totalProductTax'] === '')
            delete userInput['totalProductTax'];
        if(userInput['totalProductVat'] === '')
            delete userInput['totalProductVat'];
        userInput['updatedBy']=userInput.user.clientId;
        orderItem.update(userInput, function(err, data) {
            callback(err, data);
            return_receipt_itemModel.find({
                orderNumber: userInput['orderNumber'],
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
                                orderNumber: userInput['orderNumber']
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
        orderNumber: purchaseOrder,
        isDeleted: false
    }, function(err, noofsku) {
        var sku = {
            numberOfSKU: noofsku
        };
        var query = {
            orderNumber: purchaseOrder
        };
        return_receiptModel.update(query, sku, callback);
    });
};

function checkpo(userInput, header, callback) {
    return_receipt_itemModel.findOne({
        orderNumber: userInput['orderNumber'],
        SKU: userInput['SKU'],
        isDeleted: false
    }).exec(function(err, returndata) {
        if (err) {
            return callback(err);
        }
        if (returndata) {
            editReceiptItem(returndata._id, userInput, function(err, data) {
                if (err) {
                    return callback(err);
                }
                if (data.ok) {
                    getReceiptItem({
                        id: returndata._id
                    }, callback);
                }
            });
        } else {
            createReceiptItem(userInput, header, callback);
        }
    });
}
/*******************************************************************************
 *
 * FUNCTION:    deleteReceiptItem
 *
 * DESCRIPTION: For delete Receipt Items And Packages based on user input.
 *
 * PARAMETERS:  receipt item _id's.
 *
 * RETURNED:    null.
 *
 * REVISION HISTORY:
 *
 *            Name          Date            Description
 *            ----          ----            -----------
 *            Arun          26/08/2016      First Version
 *
 *******************************************************************************/
function deleteReceiptItem(data, header, Createrecvtran, callback) {
    return_receipt_itemModel.find({_id: {'$in' : data}},function(err, item_data){
        if(item_data){
            var sku_arr =   [];
            var uomObj  =   {};
            for (var num = item_data.length - 1; num >= 0; num--) {
                sku_arr.push(item_data[num].SKU);
                uomObj[item_data[num].SKU] = item_data[num].producUom;
            }
            return_receiptModel.findOne({
                orderNumber: item_data[0].orderNumber
            }).exec(function(err, order) {
                return_receipt_quantity_statusModel.find({
                    '$and':[
                        {"poId" : item_data[0].orderNumber},
                        {"sku" : { '$in' : sku_arr }}
                    ]
                },function(err,item_qty_data){
                    for (var num = item_qty_data.length - 1; num >= 0; num--) {
                        Createrecvtran(order, getjson({
                            poId: order.orderNumber,
                            packageId: item_qty_data[num].packageId,
                            asnid: item_qty_data[num].asnId,
                            sku: item_qty_data[num].sku,
                            qtyStatus: "deleted",
                            uom: uomObj[item_qty_data[num].sku],
                            itemForceClosedReasonCode: null,
                            itemOnHoldReasonCode: null,
                            qty: item_qty_data[num].qty,
                            lineNumber: item_qty_data[num].lineNumber,
                            skuCost: item_qty_data[num].skuCost,
                            user: ''
                        }));
                    }
                    return_receipt_itemModel.remove({
                    _id: {'$in' : data}}).exec(function(err,data){
                        return_receipt_quantity_statusModel.remove({
                            '$and':[
                                {"poId" : item_data[0].orderNumber},
                                {"sku" : { '$in' : sku_arr }}
                            ]
                        }).exec(callback);
                    });
                });
            });
        }
    });
        
};

/*******************************************************************************
 *
 * FUNCTION:    deleteReceiptData
 *
 * DESCRIPTION: For delete Receipt Items And Packages based on user input.
 *
 * PARAMETERS:  receipt number.
 *
 * RETURNED:    Deleted Recieipt Data.
 *
 * REVISION HISTORY:
 *
 *            Name          Date            Description
 *            ----          ----            -----------
 *            Arun          11/07/2016      First Version
 *
 *******************************************************************************/
function deleteReceiptData(data, callback) {

    var receipt_deleted = [];
    return_receipt_itemModel.findOne({
        orderNumber: data.receiptNumber,
        // orderStatus: 'draft',
        isDeleted: false
    }).exec(function(err, receiptItemData){
        if(receiptItemData) {
            return_receipt_itemModel.update({
                orderNumber: data.receiptNumber,
                isDeleted: false
            },{
                isDeleted: true,
                 updatedBy: data.user.clientId
            },{ multi: true},function( er, receiptItmData){
                return_receiptModel.findOne({
                    orderNumber: data.receiptNumber,
                }).exec(function(error, receiptData){
                return_receipt_quantity_statusModel.find({
                    poId: data.receiptNumber,
                    qtyStatus: constant.status.MAN_RECEIPT_DRAFT,
                    isDeleted: false
                }).exec(function(error, receiptQty){
                    async.forEach(receiptQty, function(receiptQtyData, asynccallback){
                        var loc = (receiptData.location ? receiptData.location : receiptData.shipToLocation);
                        var dataobj = {
                            transtypeid: '',
                            stocklocationid: '',
                            asnid: receiptQtyData.asnid,
                            locationid: loc,
                            stockUOM: receiptQtyData.producUom,
                            quantity: receiptQtyData.qty,
                            purchaseOrderNumber: receiptData.orderNumber,
                            purchaseOrderType: receiptData.purchaseOrderType,
                            cost: receiptQtyData.skuCost,
                            warehouseid: (receiptData.location ? receiptData.location : receiptData.shipToLocation),
                            sku: receiptQtyData.sku,     
                            createTran: receiptData.orderStatus == constant.status.DRAFT?true:'',
                            directivetype: Ordertype[receiptData.purchaseOrderType]['deleted']
                        };
                        receipt_deleted.push(dataobj);
                        asynccallback();
                    },function(){
                        return_receipt_quantity_statusModel.find({
                            poId: data.receiptNumber
                        },'packageId').exec(function(error,receiptDetails){
                            var pacId = [];
                            for(var n = receiptDetails.length - 1; n>=0; n--){
                                pacId.push(receiptDetails[n].packageId);
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
                                        poId:data.receiptNumber
                                    },{
                                        isDeleted: true,
                                         updatedBy: data.user.clientId
                                    }, {multi:true}).exec();
                                });

                            }
                        });
                        callback(null,receipt_deleted,receiptItmData);
                    });
                });
                });

            });
        }else{
            callback(null,receipt_deleted,'No Data.');
        }
    });
}