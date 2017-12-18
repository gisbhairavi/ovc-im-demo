var express = require('express');
var log = require('../log');
var return_receiptModel = require('./../model/return_receiptModel');
// var return_receiptModel = require('./../model/orderModel');
 // var orderModel = require('./../model/orderModel');
// var orderManager = require('./orderManager');
var receiptItemManager = require('./receiptItemManager');
var po_item_quantity_statusModel = require('./../model/po_item_quantity_statusModel');
var return_receipt_itemModel = require('./../model/return_receipt_itemModel');
var directiveMasterModel = require('./../model/directiveMasterModel');
var directiveItemModel = require('./../model/directiveItemModel');
var po_asnModel = require('./../model/po_asnModel');
var utils = require('./utils');
var async = require('async');
var router = express.Router();
var constant = require('../../config/const.json');
var env_config = require('../../config/config.js');
var request = require('request');
module.exports = {
    getReceipt: getReceipt,
    createReceipt: createReceipt,
    editReceipt: editReceipt,
    deleteReceipt: deleteReceipt,
    Saverpt: Saverpt
};
/*

 */
/*
 * GET order by orderId.
 */
function getReceipt(userInput, callback) {
    var id = userInput['id'];
    var fromDate = userInput['fromdate'];
    var toDate = userInput['todate'];
    var orderStatus = userInput['orderstatus'];
    var purchaseOrderNumber = userInput['purchaseordernumber'];
    var orderNumber = userInput['orderNumber'];
    var erpPurchaseOrder = userInput['erpPurchaseOrder'];
    var shipToLocation = userInput['shiptolocation'];
    var sku = userInput['sku'];
    var asnNo = userInput['asnNo'];
    var frmQty = userInput['frmQty'];
    var toQty = userInput['toQty'];
    var frmPrice = userInput['frmPrice'];
    var toPrice = userInput['toPrice'];
    var page_offset = 0;
    var page_lmt = 0;
    if (userInput['page_offset'] && userInput['page_lmt']) {
        page_offset = parseInt(userInput['page_offset']) || 0;
        page_lmt = parseInt(userInput['page_lmt']) || 10;
    }
    var condition = {};
    var locArray = [];
    condition["$and"] = [];
    condition["$and"].push({
        isDeleted: false,
        'orderType': constant['orderType']['RECEIPT']
    });
    console.log('url', env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId);
    request(env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId, function(err, response, data) {
        try {
            if (data) {
                var loc = JSON.parse(data);
                Object.keys(loc.hierarchy).forEach(function(n) {
                    // console.log('loc', loc.hierarchy[n]);
                    locArray.push(loc.hierarchy[n].id);
                });
            }
        } catch (ex) {
            return callback('can not load user data.');
        }
        var orcond = [];
        orcond.push({
            "FromLocation": {
                "$in": locArray
            }
        });
        orcond.push({
            "shipToLocation": {
                "$in": locArray
            }
        });
        condition["$and"].push({
            '$or': orcond
        });
        if (id) {
            condition["$and"].push({
                "_id": id
            });
            return_receiptModel.findOne(condition).exec(callback);
        } else if (purchaseOrderNumber || orderNumber || orderStatus || fromDate || toDate || shipToLocation || sku || asnNo || frmQty || toQty || frmPrice || toPrice) {
            var query = JSON.parse('{"isDeleted" : false}');
            if (purchaseOrderNumber) {
                query['purchaseOrderNumber'] = new RegExp(purchaseOrderNumber, "g");
            }
            if (orderNumber) {
                query['orderNumber'] = new RegExp(orderNumber, "g");
            }
            if (orderStatus) {
                query['orderStatus'] =  {
                     '$in': orderStatus.split(',')
                };
            }
            if (shipToLocation) {
                query['shipToLocation'] = { '$in' : shipToLocation.split(',') };
            }
            
            if (fromDate || toDate) {
                if (fromDate && toDate) {
                    toDate = new Date(toDate);
                    toDate = toDate.toISOString();
                    fromDate = new Date(fromDate);
                    fromDate = fromDate.toISOString();
                    if (fromDate != toDate) {
                        query['purchaseOrderDate'] = {
                            '$gte': new Date(fromDate),
                            '$lte': new Date(toDate)
                        };
                    } else {
                        fromDate = new Date(fromDate);
                        fromDate.setSeconds(0);
                        fromDate.setHours(0);
                        fromDate.setMinutes(0);
                        fromDate = fromDate.toISOString();
                        toDate = new Date(toDate);
                        toDate.setHours(23);
                        toDate.setMinutes(59);
                        toDate.setSeconds(59);
                        toDate = toDate.toISOString();
                        query['purchaseOrderDate'] = {
                            '$gte': new Date(fromDate),
                            '$lte': new Date(toDate)
                        };
                    }
                } else if (toDate) {
                    toDate = new Date(toDate);
                    toDate = toDate.toISOString();
                    query['purchaseOrderDate'] = {
                        '$lte': new Date(toDate)
                    };
                } else {
                    query['purchaseOrderDate'] = {
                        '$gte': new Date(fromDate)
                    };
                }
            }
            console.log(query);
            condition["$and"].push(query);
            return_receiptModel.find(condition, {
                "orderNumber" : 1,
                "purchaseOrderNumber": 1,
                "numberOfProducts" : 1,
                "totalPoCost" : 1,
                "totalPoCostAsn" : 1,
                "totalPoCostConfirm" : 1
            }).sort({
                'lastModified': -1
            }).exec(function(err, return_data) {
                if (err) {
                    utils.errorTrace(err);
                    return callback(err);
                }
                advanceSearch( userInput, return_data, function(error, advSrchCond ){
                    if (error) {
                        utils.errorTrace(error);
                        return callback(error);
                    }              
                    if( advSrchCond)
                        condition["$and"].push(advSrchCond);

                    return_receiptModel.find(condition,{"orderNumber":1}).sort({
                        'lastModified': -1
                    }).exec(function(err, order_data) {
                        var orderNumber_arr = [];
                        for (var num = order_data.length - 1; num >= 0; num--) {
                            orderNumber_arr.push(order_data[num].orderNumber);
                        }
                        getOrderItemQty(orderNumber_arr,  function(err, qryStatusResponse) {
                            var qty_status_data = qryStatusResponse['orderQuantityData'];
                            return_receiptModel.find(condition).count().exec(function(err,total_count) {
                                return_receiptModel.find(condition).sort({
                                    'lastModified': -1
                                }).skip(page_offset).limit(page_lmt).exec(function(err, order_data) {
                                    callback(err, {
                                        order_data: order_data,
                                        qty_data: qty_status_data,
                                        total_count: total_count
                                    });
                                });
                            });
                        }); 
                    });
                });
            });
        } else {
            var orcond = [];
            orcond.push({
                "FromLocation": {
                    "$in": locArray
                }
            });
            orcond.push({
                "shipToLocation": {
                    "$in": locArray
                }
            });
            condition["$and"].push({
                '$or': orcond
            });
            return_receiptModel.find(condition).sort({
                'lastModified': -1
            }).skip(page_offset).limit(page_lmt).exec(function(err, order_data) {
                var orderNumber_arr = [];
                for (var num = order_data.length - 1; num >= 0; num--) {
                    orderNumber_arr.push(order_data[num].orderNumber);
                }
                getOrderItemQty(orderNumber_arr, function(err, qryStatusResponse) {
                    var qty_status_data = qryStatusResponse['orderQuantityData'];
                    return_receiptModel.find(condition).count().exec(function(err, total_count) {
                        callback(err, {
                            order_data: order_data,
                            qty_data: qty_status_data,
                            total_count: total_count
                        });
                    });
                });
            });
        }
    });
}
    
function checkOrder(purchaseOrder, callback) {
    console.log(purchaseOrder);
    if (purchaseOrder) {
        return_receiptModel.findOne({
            orderNumber: purchaseOrder
        }).exec(callback);
    } else {
        callback();
        return console.log('Error ');
    }
}
/*
 * create order. userInput['purchaseOrderNumber'] = parseInt(userInput['purchaseOrderNumber']);
 */
function createReceipt(userInput, callback) {
    console.log('************');
    console.log('createReceipt');
    var token = utils.uid(6);
    var purchaseNumber = {};
    userInput['orderNumber'] = token.toString();
    userInput['orderType'] = constant['orderType']['RECEIPT'];
    userInput['createdBy'] = userInput.user.clientId;
    userInput['updatedBy'] = userInput.user.clientId;
    if(userInput['PoSubtotal'] === '')
        delete userInput['PoSubtotal'];
    if(userInput['totalPoCost'] === '')
        delete userInput['totalPoCost'];
    if(userInput['totalPoVAT'] === '')
        delete userInput['totalPoVAT'];
    if(userInput['totalPoTax'] === '')
        delete userInput['totalPoTax'];
    var order = new return_receiptModel(userInput);
    return_receiptModel.findOne({
        orderNumber: userInput['orderNumber'],
        isDeleted: false
    }).exec(function(err, receiptdata) {
        if (err) {
            return callback(err);
        }
        if (receiptdata) {
            editReceipt(receiptdata._id, userInput, function(err, data) {
                if (err) {
                    return callback(err);
                }
                // if (data.ok) {
                //     getReturnItem({
                //         id: receiptdata._id
                //     }, callback);
                // }
          callback(err, data);  });           
   
        } else {
            order.orderNumber = userInput['orderNumber'];
            order.save(function(err, data) {
                if (!err && data) {
                // console.log("Data-->"+JSON.stringify(data));
                callback(null, data);
                // var directiveMaster = {
                //     directiveId: data['directiveId'],
                //     storeId: data['location'],
                //     userId: data['userId'],
                //     numberOfItems: data['numberOfProducts']
                // };
                // var directiveMasterObj = directiveMasterModel(directiveMaster);
                // directiveMasterObj.save(function(dirError, dirData) {
                //     // Do Nothing
                // });
                }
                //directiveItemModel
            });            
        }
    });
    
}
function Saverpt(userInput, header, callback) {
   
    checkOrder(userInput.orderNumber,function(err, receiptdata) {
        if (err) {
            return callback(err);
        }
        if (receiptdata) {
            editReceipt(receiptdata._id, userInput, function(err, data) {
                if (err) {
                    return callback(err);
                }
                console.log(data);
                if (data.ok) {
                    getReceipt({
                        id: receiptdata._id,
                        user: userInput.user
                    }, callback);
                }
            });
        } else {
            createReceipt(userInput, callback);
        }
    });
}
/*
 * edit order by id.
 */
function editReceipt(id, userInput, callback) {
    var order = return_receiptModel.findById(id);
    if (order) {
        userInput['updatedBy'] = userInput.user.clientId;
        if(userInput['PoSubtotal'] === '')
            delete userInput['PoSubtotal'];
        if(userInput['totalPoCost'] === '')
            delete userInput['totalPoCost'];
        if(userInput['totalPoVAT'] === '')
            delete userInput['totalPoVAT'];
        if(userInput['totalPoTax'] === '')
            delete userInput['totalPoTax'];
        order.update(userInput, callback);
    }
}

/*******************************************************************************
 *
 * FUNCTION:    deleteReceipt
 *
 * DESCRIPTION: For delete Receipt based on user input.
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
function deleteReceipt(data, callback) {
    editReceipt(data.id, {
        isDeleted: true,
        user: data.user
    }, function(err,receiptdata){
        if(receiptdata){
            receiptItemManager.deleteReceiptData(data,callback)
        }
    });
};

function getOrderItemQty(order_array, callback) {
    var condition = {};
    var locArray = [];
    condition["$and"] = [];
    condition["$and"].push({
        isDeleted: false
    });
    condition["$and"].push({
        "qtyStatus": {
            "$in": ["receiveInProgress", "received"]
        }
    });
    condition["$and"].push({
        "poId": {
            "$in": order_array
        }
    });
    var search_cond = {
        $match: condition
    };
    po_item_quantity_statusModel.aggregate([
        search_cond, {
            "$group": {
                "_id": {
                    "poId": "$poId",
                    "qtyStatus": "$qtyStatus"
                },
                "qtyCount": {
                    "$sum": "$qty"
                }
            }
        }, {
            "$group": {
                "_id": "$_id.poId",
                "orderQty": {
                    "$push": {
                        "qtyStatus": "$_id.qtyStatus",
                        "count": "$qtyCount"
                    },
                },
            }
        }, {
            "$sort": {
                "count": -1
            }
        }
    ]).exec(function(err, success) {
        po_item_quantity_statusModel.find({
            'poId': {
                $in: order_array
            },
            'packageId': {
                $ne: null
            }
        }).exec(function(err, records) {
            var response = {};
            response['orderQuantityData'] = success;
            callback(err, response);
        });
    });
}

function advanceSearch(userInput, orderData, callback) {
    var sku = userInput['sku'];
    var asnNo = userInput['asnNo'];
    var frmQty = userInput['frmQty'];
    var toQty = userInput['toQty'];
    var frmPrice = userInput['frmPrice'];
    var toPrice = userInput['toPrice'];
    var condition = {};
    var advSrcPoIdArr = [];
    var isAdvancedSearch = true;

    condition["$and"] = [];
    condition["$and"].push({
        isDeleted: false
    });

    var query   =   JSON.parse('{"isDeleted" : false}');
    if (sku || frmQty || toQty || frmPrice || toPrice || asnNo) {
        async.parallel([
            function(callback) {
                if (sku) {
                    var prcode  =   sku;
                    var sku_arr =   [];
                    var temp_cond = {};
                    var result_obj = {};
                    console.log('url', env_config.dashPath + constant.apis.GETSTYLEPRODUCT + userInput.user.clientId);
                    request(env_config.dashPath + constant.apis.GETSTYLEPRODUCT + prcode + '&locid=' + null, function(err, sku_resp, sku_data) {
                        try {
                            if (sku_data) {
                                var sku_json = JSON.parse(sku_data);
                                for (var itm = sku_json.length - 1; itm >= 0; itm--) {
                                    sku_arr.push(sku_json[itm].ProductTbl.sku)
                                }  
                            }
                        } catch (ex) {
                            return callback(null, {});
                        }
                        temp_cond['isDeleted'] = false;
                        temp_cond['SKU'] = {
                            '$in' : sku_arr
                        }
                        return_receipt_itemModel.find(temp_cond).exec(function(err, itemData) {
                            var orderNumberArr = [];
                            if (itemData && itemData.length) {
                                for (var item = itemData.length - 1; item >= 0; item--) {
                                    orderNumberArr.push(itemData[item].orderNumber);
                                }
                            }
                            result_obj["orderNumber"] = {
                                '$in': orderNumberArr
                            }
                            callback(err, result_obj);
                        });
                    });
                }
                else {
                    callback(null, {});
                }
            },
            function(callback) {
                if (asnNo) {
                    var temp_cond = {};
                    var result_obj = {};
                    var orderNumberArr = [];
                    temp_cond['isDeleted'] = false;
                    temp_cond['asnId'] = new RegExp(asnNo, "g");
                    po_asnModel.find(temp_cond).exec(function(err, asnData) {
                        if (asnData && asnData.length) {
                            for (var item = asnData.length - 1; item >= 0; item--) {
                                orderNumberArr.push(asnData[item].poId);
                            }
                        }
                        result_obj["orderNumber"] = {
                            '$in': orderNumberArr
                        }
                        callback(err, result_obj);
                    });
                }
                else {
                    callback(null, {});
                }
            },
            function(callback) {
                if (frmQty || toQty) {
                    var temp_cond = {};
                    temp_cond['numberOfProducts'] = {};
                    if (frmQty)
                        temp_cond['numberOfProducts']['$gte'] = +frmQty;
                    if (toQty)
                        temp_cond['numberOfProducts']['$lte'] = +toQty;
                    callback(null, temp_cond);
                }
                else {
                    callback(null, {});
                }
            },
            function(callback) {
                if (frmPrice || toPrice) {
                    var frmPriceNum = parseFloat(frmPrice);
                    var toPriceNum = parseFloat(toPrice);
                    var orderNumberArr = [];
                    var result_obj = {};
                    for (var item = orderData.length - 1; item >= 0; item--) {
                        try {
                            var cost = null;
                            if (orderData[item]["totalPoCostAsn"] && orderData[item]["totalPoCostAsn"] != '') {
                                cost = orderData[item]["totalPoCostAsn"];
                            } else if (orderData[item]["totalPoCostConfirm"] && orderData[item]["totalPoCostConfirm"] != '') {
                                cost = orderData[item]["totalPoCostConfirm"];
                            } else if (orderData[item]["totalPoCost"] && orderData[item]["totalPoCost"] != '') {
                                cost = orderData[item]["totalPoCost"];
                            }
                            if (frmPrice != '' && toPrice != '') {
                                if ((cost >= frmPriceNum) && (cost <= toPriceNum)) orderNumberArr.push(orderData[item].orderNumber);
                            }
                            if ((toPrice && toPrice != '') && frmPrice == '') {
                                if (cost <= toPriceNum) orderNumberArr.push(orderData[item].orderNumber);
                            } else if ((frmPrice && frmPrice != '') && toPrice == '') {
                                if (cost >= frmPriceNum) orderNumberArr.push(orderData[item].orderNumber);
                            }
                        }
                        catch (ex) {
                            utils.errorTrace(ex);
                            callback ('unable filter data');
                        }
                    }
                    result_obj["orderNumber"] = {
                        '$in': orderNumberArr
                    }
                    callback(null, result_obj);
                }
                else {
                    callback(null, {});
                }
            }
        ], function(err, results) {
            if (err) {
                utils.errorTrace(err);
                callback(err);
            }
            else
                callback (null, {'$and' : results})
        });
    } else {
        callback(null);
    }
}
