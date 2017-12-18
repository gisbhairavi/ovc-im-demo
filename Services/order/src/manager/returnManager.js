var express = require('express');
var log = require('../log');
var orderModel = require('./../model/return_receiptModel');
var orderItemModel = require('./../model/orderItemModel');
var directiveMasterModel = require('./../model/directiveMasterModel');
var directiveItemModel = require('./../model/directiveItemModel');
var po_asnModel = require('./../model/po_asnModel');
var utils = require('./utils');
var async = require('async');
var router = express.Router();
var constant = require('../../config/const.json');
var env_config = require('../../config/config.js');
var request = require('request');
var returnItemManager = require('./returnItemManager');
module.exports = {
    getOrder: getOrder,
    createOrder: createOrder,
    editOrder: editOrder,
    deleteOrder: deleteOrder
};
/*
 * GET order by orderId.
 */
function getOrder(userInput, callback) {
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
    var condition = {};
    var locArray = [];
    condition["$and"] = [];
    condition["$and"].push({
        isDeleted: false,
        'orderType': constant['orderType']['RETURN']
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
            orderModel.findOne(condition).exec(callback);
        } else if (purchaseOrderNumber || orderNumber || orderStatus || erpPurchaseOrder || fromDate || toDate || shipToLocation|| sku || asnNo || frmQty || toQty || frmPrice || toPrice) {
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
            if (erpPurchaseOrder) {
                query['erpPurchaseOrder'] = new RegExp(erpPurchaseOrder, "g");
            }
            if (fromDate || toDate) {
                if (fromDate && toDate) {
                    toDate = new Date(toDate);
                    toDate = toDate.toISOString();
                    fromDate = new Date(fromDate);
                    fromDate = fromDate.toISOString();
                    if (fromDate != toDate) {
                        toDate  =   new Date(toDate);
                        toDate.setHours(23, 59, 59);
                        toDate = toDate.toISOString();
                        query['purchaseOrderDate'] = {
                            '$gte': new Date(fromDate),
                            '$lte': new Date(toDate)
                        };
                    } else {
                        fromDate = new Date(fromDate);
                        fromDate.setHours(0, 0, 0);
                        fromDate = fromDate.toISOString();
                        toDate = new Date(toDate);
                        toDate.setHours(23, 59, 59);
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
            orderModel.find(condition, {
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
                    {
                        condition["$and"].push(advSrchCond);
                    }
                    orderModel.find(condition).sort({
                        'lastModified': -1
                    }).exec(callback);
                });
            });
        } else {
            // console.log(condition);
            orderModel.find(condition).sort({
                'lastModified': -1
            }).exec(callback);
        }
    });
}
/*
 * create order. userInput['purchaseOrderNumber'] = parseInt(userInput['purchaseOrderNumber']);
 */
function createOrder(userInput, callback) {
    var token = utils.uid(6);
    var purchaseNumber = {};
    userInput['orderNumber'] = token;
    userInput['orderType'] = constant['orderType']['RETURN'];
    userInput['createdBy'] = userInput.user.clientId;
    userInput['updatedBy'] = userInput.user.clientId;
    var order = new orderModel(userInput);
    order.save(function(err, data) {
        if (!err && data) {
            // console.log("Data-->"+JSON.stringify(data));
           
            callback(null,data);
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
    /*purchaseNumber['purchaseOrderNumber'] = userInput['purchaseOrderNumber']; 
    var orderItem = new orderItemModel(purchaseNumber);
 
    order.save(function(err, data){
     if(!err){
       orderItem.save(callback);   
     }else{
       callback(err);
     }
    });*/
}
/*
 * edit order by id.
 */
function editOrder(id, userInput, callback) {
    var order = orderModel.findById(id);
    if (order) {
        userInput['updatedBy'] = userInput.user.clientId;
        order.update(userInput, callback);
    }
}
/*
 * delete order by orderId.
 */
function deleteOrder(data, callback) {
    editOrder(data.id, {
        isDeleted: true,
        user: data.user
    }, function(err,returndata){
        if(returndata){
            returnItemManager.deleteReturnData(data,callback)
        }
    });
};

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
                        orderItemModel.find(temp_cond).exec(function(err, itemData) {
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
