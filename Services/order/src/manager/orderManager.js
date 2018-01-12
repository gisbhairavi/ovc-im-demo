var express = require('express');
var log = require('../log');
var orderModel = require('./../model/orderModel');
var po_item_quantity_statusModel = require('./../model/po_item_quantity_statusModel');
var countModel = require('./../model/countModel');
var orderItemModel = require('./../model/orderItemModel');
var directiveMasterModel = require('./../model/directiveMasterModel');
var directiveItemModel = require('./../model/directiveItemModel');
var po_asnModel = require('./../model/po_asnModel');
var utils = require('./utils');
var router = express.Router();
var async = require('async');
var lodash = require('lodash');
var querystring = require('querystring');
var constant = require('../../config/const.json');
var env_config = require('../../config/config.js');
var request = require('request');
var Ordertype = require('../../config/Ordertype.json');
var orderItemManager = require('./../manager/orderItemManager');
var countItemManager = require('./../manager/countItemManager');
lodash.extend(module.exports, {
    getOrder: getOrder,
    createOrder: createOrder,
    editOrder: editOrder,
    deleteOrder: deleteOrder,
    getStatusReport: getStatusReport,
    getSKUCosts: getSKUCosts,
    getOrdersSummary: getOrdersSummary,
    addorderSKU: addorderSKU,
    cancelDraftOrder: cancelDraftOrder,
    forceCloseOrder: forceCloseOrder,
    getOrderNumbers: getOrderNumbers,
    copyOrder: copyOrder
});
/***********************************************************************
 *
 * FUNCTION:    getOrder
 *
 * DESCRIPTION: For get orders based on user input.
 *
 * PARAMETERS:  "" or "id" or "fromdate" or "toDate" or "orderStatus" or 
                "purchaseOrderNumber" or "erpPurchaseOrder" or 
                "shipToLocation" or "order_type" or "pageOffSet" or "page_lmt".
 *
 * RETURNED:    returns purchase order details based on the input params.
 *
 * REVISION HISTORY:
 *
 *            Name          Date            Description
 *            ----          ----            -----------
 *            Arun          02/02/2016      First Version
 *            Ratheesh      10/02/2016      2 Version
 *
 ***********************************************************************/
function getOrder(userInput, callback) {
    var id = userInput['id'];
    var fromDate = userInput['fromdate'];
    var toDate = userInput['todate'];
    var orderStatus = userInput['orderstatus'];
    var purchaseOrderNumber = userInput['purchaseordernumber'];
    var erpPurchaseOrder = userInput['erpPurchaseOrder'];
    var shipToLocation = userInput['shiptolocation'];
    var order_type = userInput['order_type'];
    var bound = userInput['bound'];
    var vendors = userInput['vendors'];
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
    var res_data = {};
    var condition = {};
    var locArray = [];
    condition["$and"] = [];
    condition["$and"].push({
        isDeleted: false
    });
    console.log('url', env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId);
    request(env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId, function(err, response, data) {
        // Loc error handler.
        //by Ratheesh
        try {
            if (data) {
                var loc = JSON.parse(data);
                Object.keys(loc.hierarchy).forEach(function(n) {
                    // console.log('loc', loc.hierarchy[n]);
                    locArray.push(loc.hierarchy[n].id);
                });
            }
        } catch (ex) {
            utils.errorTrace(ex);
            return callback('can not load user data.');
        }
        condition["$and"].push({
            orderType: null
        });
        if (id) {
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
            condition["$and"].push({
                "_id": id
            });
            console.log(JSON.stringify(condition));
            orderModel.findOne(condition).exec(function(err, data) {
                if(err){
                    res_data.status = constant.label.ERROR;
                    res_data.message = err;
                    utils.errorTrace(err);
                    return callback(err, res_data)
                }
                if(!data){
                    res_data.status = constant.label.ERROR;
                    res_data.message = constant.label.NO_ORDER;
                    return callback(err, res_data)
                }
                orderModel.find(condition, {
                "purchaseOrderNumber": 1,
                "numberOfProducts": 1,
                "totalPoCost": 1,
                "totalPoCostAsn": 1,
                "totalPoCostConfirm": 1
                }).sort({
                    'lastModified': -1
                }).exec(function(error, order_data) {
                    if (error) return callback(error);
                    if (checkPurchaseOrderTypes(data.purchaseOrderType)) {
                        callback(error, {
                            order_data: data
                        });
                    }
                    else {
                        addFullFillDescrepancy(data, order_data, function(er, result){
                            if (er) {
                                utils.errorTrace(er);
                                return callback(er);
                            }
                            callback(er, {
                                order_data: data,
                                qty_data: result.qty_status_data,
                                descrepanciesList: result.descrepanciesList,
                                displayStatusObject: result.displayStatusObject
                            });
                        });
                    }
                        
                });
            });
            // orderModel.find(condition).exec(function(err, data) {
            //     addFullFillDescrepancy(userInput, data, function(err, result) {
            //         callback(err, result || {});
            //     });Received data are populated from 'po_item_quantity_status' collection.but Adjustments creates transactions.so it is not affected there.
            // });
        } else if (purchaseOrderNumber || orderStatus || erpPurchaseOrder || fromDate || toDate || shipToLocation || bound || order_type || vendors || sku || asnNo || frmQty || toQty || frmPrice || toPrice) {
            var query = JSON.parse('{"isDeleted" : false}');
            if (purchaseOrderNumber) {
                query['purchaseOrderNumber'] = new RegExp(purchaseOrderNumber, "g");
            }
            if (orderStatus) {
                query['orderStatus'] = {
                    "$in": orderStatus.split(',')
                };
            }
            if (vendors) {
                query['vendorId'] = {
                    "$in": vendors.split(',')
                };
            }
            if (erpPurchaseOrder) {
                query['erpPurchaseOrder'] = new RegExp(erpPurchaseOrder, "g");
            }
            if (order_type) {
                condition["$and"].push({
                    purchaseOrderType: {
                        "$in": order_type.split(',')
                    }
                });
                var order_typeArray = [];

                function boundType(order_type) {
                    order_typeArray = order_type.split(',');
                    var response = false;
                    order_typeArray.forEach(function(data) {
                        if (constant.boundType.hasOwnProperty(data)) {
                            response = true;
                        } else {
                            response = false;
                        }
                    });
                    return response;
                }
                if (boundType(order_type)) {
                    if (bound) {
                        if (bound == 'Outbound') {
                            // condition["$and"].push( {'shipToLocation' :{$not:{
                            //     "$in": locArray
                            //     }
                            // }});
                            if (order_typeArray.indexOf(constant.orderType.TRANSFER) != -1) {
                                condition["$and"].push({
                                    'orderStatus': {
                                        "$ne": 'draft'
                                    }
                                });
                            }
                            condition["$and"].push({
                                'FromLocation': {
                                    "$in": locArray
                                }
                            });
                        } else if (bound == 'Inbound') {
                            if (order_typeArray.indexOf(constant.orderType.MANUAL_SHIP) != -1) {
                                condition["$and"].push({
                                    'orderStatus': {
                                        "$ne": 'draft'
                                    }
                                });
                            }
                            condition["$and"].push({
                                'shipToLocation': {
                                    "$in": locArray
                                }
                            });
                        }
                        // var orcond = [];
                        // orcond.push({
                        //     "FromLocation": {
                        //         "$in": locArray
                        //     }
                        // });
                        // orcond.push({
                        //     "shipToLocation": {
                        //         "$in": locArray
                        //     }
                        // });
                        // condition["$and"].push({
                        //     '$or': orcond
                        // });
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
                    }
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
                }
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
            }
            try{
            if (fromDate || toDate) {
                if (fromDate && toDate) {
                    toDate = new Date(toDate);
                    toDate = toDate.toISOString();
                    fromDate = new Date(fromDate);
                    fromDate = fromDate.toISOString();
                    if (fromDate != toDate) {
                        toDate = new Date(toDate);
                        toDate.setHours(23);
                        toDate.setMinutes(59);
                        toDate.setSeconds(59);
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
        }catch(e){
            utils.errorTrace(e);
            return callback('Date Error');
        }
            console.log(query);
            condition["$and"].push(query);
            orderModel.find(condition, {
                "purchaseOrderNumber": 1,
                "numberOfProducts": 1,
                "totalPoCost": 1,
                "totalPoCostAsn": 1,
                "totalPoCostConfirm": 1
            }).sort({
                'lastModified': -1
            }).exec(function(err, order_data) {
                advanceSearch(userInput, order_data, function(error, advSrchCond) {
                    if (error) {
                        utils.errorTrace(error);
                        return callback(error);
                    }
                    if (advSrchCond)
                        condition["$and"].push(advSrchCond);
                    if (checkPurchaseOrderTypes(order_type))
                        getOrderResult (condition, page_offset, page_lmt, null, callback);
                    else {
                        addFullFillDescrepancy(userInput, order_data, function(err, result) {
                            if (result.isOrderFulfillment) {
                                condition["$and"].push({
                                    "purchaseOrderNumber": {
                                        "$in": result.eligiblePoIds
                                    }
                                });
                            }
                            getOrderResult (condition, page_offset, page_lmt, result, callback);
                        });
                    }
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
            orderModel.find(condition).sort({
                'lastModified': -1
            }).skip(page_offset).limit(page_lmt).exec(function(err, order_data) {
                var poId_arr = [];
                for (var num = order_data.length - 1; num >= 0; num--) {
                    poId_arr.push(order_data[num].purchaseOrderNumber);
                }
                getOrderItemQty(poId_arr, false, function(err, qryStatusResponse) {
                    var qty_status_data = qryStatusResponse['orderQuantityData'];
                    orderModel.find(condition).count().exec(function(err, total_count) {
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
function getOrderResult(condition, page_offset, page_lmt, fullFillData, callback) {
    orderModel.find(condition).count().exec(function(err, total_count) {
            orderModel.find(condition).sort({
                'lastModified': -1
            }).skip(page_offset).limit(page_lmt).exec(function(err, order_data) {
                var result_data = {};
                result_data.order_data = order_data;
                result_data.total_count = total_count;
                if (fullFillData) {
                    result_data.qty_data = fullFillData.qty_status_data;
                    result_data.descrepanciesList = fullFillData.descrepanciesList;
                    result_data.displayStatusObject = fullFillData.displayStatusObject;
                }
                callback(err, result_data);
            });
    });
}

function checkPurchaseOrderTypes(order_type) {
    var response = false;
    try {
        order_typeArray = order_type.split(',');
        order_typeArray.forEach(function(type) {
            if ((type === constant.orderType.MANUAL_ORDER) || (type === constant.orderType.REPLENISHMENT_ORDER) || (type === constant.orderType.Z_FUT)) {
                response = true;
            } else {
                response = false;
            }
        });
    }
    catch (ex) {
        utils.errorTrace(ex);
    }
    return response;
}

/***********************************************************************
 *
 * FUNCTION:    getStatusReport
 *
 * DESCRIPTION: For get orders based on user input.
 *
 * PARAMETERS:  "" or "storeId" or "fromdate" or "toDate" or "report_action" or 
 *              "order_type" or "count_name" or "count_id" or "count_status".
 *
 * RETURNED:    returns order or count status details based on the input params.
 *
 * REVISION HISTORY:
 *
 *            Name          Date            Description
 *            ----          ----            -----------
 *            Arun          02/01/2016      First Version
 *            Arun          14/07/2016      added orderType filter
 *                                          and count filters.
 *
 ***********************************************************************/
function getStatusReport(userInput, input, callback) {
    var storeId = userInput['storeId'],
        fromDate = userInput['fromdate'] || userInput['startDate'],
        toDate = userInput['todate'] || userInput['endDate'],
        report_action = userInput['report_action'],
        query = JSON.parse('{"isDeleted" : false}'),
        order_type = userInput['order_type'],
        count_name = userInput['name'],
        count_id = userInput['countNumber'],
        count_status = userInput['countStatus'];
    var locArray = [];
    var tmp = {
        "isDeleted": false
    };
    console.log('url', env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId);
    request(env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId, function(err, response, data) {
        try {
            if (data) {
                var loc = JSON.parse(data);
                Object.keys(loc.hierarchy).forEach(function(n) {
                    locArray.push(loc.hierarchy[n].id);
                });
            }
        } catch (ex) {
            return callback('can not load user data.');
        }
        if (storeId && storeId != '') {
            if (!tmp.$and) tmp.$and = [];
            if (report_action === 'count') {
                tmp.$and.push({
                    locationId: { '$in': storeId.split(',') }
                });
            } else {
                tmp.$and.push({
                    shipToLocation: { '$in': storeId.split(',') }
                });
            }
        }
        if ((fromDate && fromDate != '') || (toDate && toDate != '')) {
            var date_range = {};
            if (fromDate && toDate) {
                toDate = new Date(toDate);
                toDate = toDate.toISOString();
                fromDate = new Date(fromDate);
                fromDate = fromDate.toISOString();
                if (fromDate != toDate) {
                    date_range = {
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
                    date_range = {
                        '$gte': new Date(fromDate),
                        '$lte': new Date(toDate)
                    };
                }
            } else if (toDate) {
                toDate = new Date(toDate);
                toDate = toDate.toISOString();
                date_range = {
                    '$lte': new Date(toDate)
                };
            } else {
                date_range = {
                    '$gte': new Date(fromDate)
                };
            }
            if (!tmp.$and) tmp.$and = [];
            if (report_action === 'count') {
                tmp.$and.push({
                    startDate: date_range
                });
            } else {
                //Need to check condition like this  both (lastModified or purchaseOrderDate) in the daterange
                tmp.$and.push({
                    purchaseOrderDate: date_range
                });
            }
        }
        if (report_action === 'count') {
            if (count_name && count_name != '' || count_id && count_id != '' || count_status && count_status != '') {
                if (!tmp.$and) tmp.$and = [];
                if (count_name) {
                    tmp.$and.push({
                        name: new RegExp('^.*?' + count_name + '.*?$', "i")
                    });
                }
                if (count_id) {
                    var id = parseInt(count_id)
                    tmp.$and.push({
                        _id:id 
                    });
                }
                if (count_status) {
                    tmp.$and.push({
                        countStatus: count_status
                    });
                }
            }
            if (!storeId || storeId == '' || storeId === undefined) {
                if (!tmp.$and) tmp.$and = [];
                tmp.$and.push({
                    locationId: {
                        '$in': locArray
                    }
                });
            }
        }
        if (report_action === 'order') {
            if (order_type && order_type != '') {
                var order_type_arr = order_type.split();
                if (order_type == constant.orderType.MANUAL_ORDER) order_type_arr.push(constant.orderType.REPLENISHMENT_ORDER);
                if (!tmp.$and) tmp.$and = [];
                tmp.$and.push({
                    '$or': [{
                        purchaseOrderType: {
                            '$in': order_type_arr
                        }
                    }, {
                        orderType: order_type
                    }]
                });
            }
            if (!storeId || storeId == '' || storeId == undefined) {
                if (!tmp.$and) tmp.$and = [];
                tmp.$and.push({
                    '$or': [{
                        shipToLocation: {
                            '$in': locArray
                        }
                    }, {
                        FromLocation: {
                            '$in': locArray
                        }
                    }]
                });
            }
        }
        var search_cond = {
            $match: tmp
        };
        if (report_action === 'count') {
            countModel.aggregate([
                search_cond, {
                    $group: {
                        _id: {
                            countStatus: "$countStatus"
                        },
                        "counIds": {
                            "$push": {
                                "id": "$_id"
                            }
                        },
                        count: {
                            $sum: 1
                        }
                    }
                }
            ]).exec(function(err, countStatusData) {
                var countIdObj  =   {},
                    statusIdObj =   {},
                    countData   =   {},
                    countStatusObj  =   {},
                    countItmStatusData = [],
                    countStatusId   =   {};
                countIdObj.countIdArr = [];
                countData.countStatusData = countStatusData;
                for (var itemIds = countStatusData.length - 1; itemIds >= 0; itemIds--) {
                    for (var itemId = countStatusData[itemIds].counIds.length - 1; itemId >= 0; itemId--) {
                        countIdObj.countIdArr.push(countStatusData[itemIds].counIds[itemId].id);
                        statusIdObj[countStatusData[itemIds].counIds[itemId].id] = countStatusData[itemIds]._id.countStatus;
                    }
                }
                countItemManager.getCountItemStatus(countIdObj, function(err, countItmStatus) {
                    // { _id: 
                    //      { sku: '115061_silver_mirror',
                    //        countId: 1028,
                    //        lastModified: Fri Jul 29 2016 20:57:27 GMT+0530 (IST) },
                    //     countId: { name: 'NEW TEST' },
                    //     qty: [ 10 ],
                    //     oh: [],
                    //     count: 1 
                    // }
                    countStatusObj["approve"] = [];
                    countStatusObj["otherStatus"] = [];
                    for (var num = countItmStatus.length - 1; num >= 0; num--) {
                        if(statusIdObj[countItmStatus[num]._id.countId] == "approve")
                        {
                            if( !countStatusObj["approve"] )
                                countStatusObj["approve"] = [];
                            countStatusObj["approve"].push(countItmStatus[num]);
                        }
                        else{
                            if( !countStatusObj["otherStatus"] )
                                countStatusObj["otherStatus"] = [];
                            countStatusObj["otherStatus"].push(countItmStatus[num]);
                        }
                    }
                    var getCountItemInv = function(countItemData, sku_callback){
                        var result = {};
                        var formData ={
                            CountSKUData: countItemData
                        };
                        var contentLength = formData.length;
                        var options = {
                            url: env_config.apiPath + constant.apis.INVENTORIESSERVICE+ 'noLocation',
                            method: 'POST',
                            body: JSON.stringify(formData),
                            headers: {
                                'authorization': input.params.headers,
                                'Content-Length': contentLength,
                                'Content-Type': 'application/json',
                            }
                        };
                        console.log("url", env_config.apiPath + constant.apis.INVENTORIESSERVICE+ 'noLocation' + "&sku=" + countItemData);
                        request(options, function(err, data) {
                            if(err){
                                console.log("ERROR",err);
                                callback('Can not load.');
                            }
                            try {
                                sku_callback(JSON.parse(data['body']));
                            } catch (e) {
                                callback('Can not load data.');
                            }
                        });
                    }
                    if(countStatusObj["otherStatus"]){
                        getCountItemInv(countStatusObj["otherStatus"], function(itmOhData){
                            for (var num = itmOhData.length - 1; num >= 0; num--) {
                                for (var itm = countStatusObj["otherStatus"].length - 1; itm >= 0; itm--) {
                                    if(itmOhData[num]._id.sku == countStatusObj["otherStatus"][itm]._id.sku && itmOhData[num]._id.locationId == countStatusObj["otherStatus"][itm].storeId.locationId ){
                                        countStatusObj["otherStatus"][itm].oh[0] = itmOhData[num].storevalue[0].value;
                                    }
                                }
                            }
                            countData.itemStatusData = countStatusObj["approve"].concat(countStatusObj["otherStatus"]);
                            callback(err, countData);
                        });
                    }
                    else{
                        countData.itemStatusData = countStatusObj["approve"];
                        callback(err, countData);
                    }   
                });
            });
        } else {
            orderModel.find(tmp, {
                "purchaseOrderNumber": 1
            }).exec(function(err, order_data) {
                addFullFillDescrepancy(userInput, order_data, function(err, result) {
                    var displayStatusObject = result.displayStatusObject;
                    if (result.isOrderFulfillment) {
                        tmp["$and"].push({
                            "purchaseOrderNumber": {
                                "$in": result.eligiblePoIds
                            }
                        });
                    }
                    orderModel.find(tmp, {
                        "purchaseOrderNumber": 1,
                        "orderNumber": 1,
                        "orderStatus": 1
                    }).exec(function(err, orderData) {
                        var orderData = JSON.parse(JSON.stringify(orderData));
                        for (var order = orderData.length - 1; order >= 0; order--) {
                            if ((orderData[order].orderNumber) && (orderData[order].orderNumber != '')) {
                                if (!displayStatusObject[orderData[order].orderNumber]) {
                                    displayStatusObject[orderData[order].orderNumber] = orderData[order].orderStatus;
                                }
                            }
                            if (orderData[order].purchaseOrderNumber && orderData[order].purchaseOrderNumber != '') {
                                if (!displayStatusObject[orderData[order].purchaseOrderNumber]) {
                                    displayStatusObject[orderData[order].purchaseOrderNumber] = orderData[order].orderStatus;
                                }
                            }
                        }
                        var setStatusCount = function(displayStatusObj, status_callback) {
                            var statusArr = {};
                            Object.keys(displayStatusObject).forEach(function(orderNum) {
                                if (!statusArr[displayStatusObject[orderNum]]) {
                                    statusArr[displayStatusObject[orderNum]] = {};
                                    statusArr[displayStatusObject[orderNum]]['count'] = 1;
                                } else {
                                    statusArr[displayStatusObject[orderNum]]['count'] = ++statusArr[displayStatusObject[orderNum]]['count'];
                                }
                            });
                            status_callback(statusArr);
                        }
                        setStatusCount(displayStatusObject, function(statusObj) {
                            var resultObject = {};
                            resultObject.orderData = orderData;
                            resultObject.displayStatusObject = displayStatusObject;
                            resultObject.statusObj = statusObj;
                            callback(err, statusObj);
                        });
                    });
                });
            });
        }
    });
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

function createOrder(userInput, callback) {
    var token = utils.uid(6);
    var purchaseNumber = {};
    userInput['purchaseOrderNumber'] = token;
    userInput['createdBy'] = userInput.user.clientId;
    userInput['updatedBy'] = userInput.user.clientId;
    var noArr = ['PoSubtotal', 'PoSubtotalConfirm', 'PoSubtotalAsn', 'totalPoCost', 'totalPoCostConfirm', 'totalPoCostAsn', 'totalPoVAT', 'totalPoTax', 'totalPoVATConfirm', 'totalPoTaxConfirm', 'totalPoVATAsn', 'totalPoTaxAsn'];
    userInput = delNotNovalue(userInput, noArr);
    try {
        orderData = JSON.parse(JSON.stringify(userInput));
    }
    catch (e) {
        console.log("Error_:",e);
        return callback(e);
    }
    var order = new orderModel(orderData);
    order.save(function(err, data) {
        if (!err && data) {
            callback(null, data);
            var directiveMaster = {
                directiveId: data['directiveId'],
                storeId: data['location'],
                userId: data['userId'],
                numberOfItems: data['numberOfProducts'],
                createdBy: userInput.user ? userInput.user.clientId : '',
                updatedBy: userInput.user ? userInput.user.clientId : ''
            };
            var directiveMasterObj = directiveMasterModel(directiveMaster);
            directiveMasterObj.save(function(dirError, dirData) {
                // Do Nothing
            });
        }
        //directiveItemModel
    });
}


function getOrderItem(userInput, action_tag, item_callback) {
    orderItemManager.getOrderItem({
        purchaseOrderNumber: userInput.purchaseOrderNumber,
        noDescription: false
    }, function(err, data){
        if (err){
            console.log("Error__",err);
            return item_callback(err);
        }
        if (data.item_data && data.item_data.length) {
            order_item = data.item_data;
            var jms_item_arr    =   [];
            var tran_item_arr   =   [];
            var qty_status_arr  =   [];
            for (var i = order_item.length - 1; i >= 0; i--) {
                var jms_obj = {};
                var tran_obj = {};
                    var qtyStatus = constant.tranStatus[userInput.orderStatus];
                // if (action_tag === 'JMS'){
                    jms_obj.lineNumber =   order_item[i].lineNumber;
                    jms_obj.sku        =   order_item[i].SKU;
                    jms_obj.qty        =   order_item[i].qty;
                    jms_obj.qtyStatus  =   qtyStatus;
                    jms_item_arr.push(jms_obj);
                // }
                // if (action_tag === 'tran') {
                    tran_obj.transtypeid        =   '';
                    tran_obj.stocklocationid    =   '';
                    tran_obj.locationid         =   userInput.shipToLocation;
                    tran_obj.stockUOM           =   order_item[i].producUom;
                    tran_obj.quantity           =   order_item[i].qty;
                    tran_obj.purchaseOrderNumber=   order_item[i].purchaseOrderNumber;
                    tran_obj.purchaseOrderType  =   userInput.purchaseOrderType;
                    tran_obj.cost               =   order_item[i].productCost;
                    tran_obj.warehouseid        =   userInput.shipToLocation;
                    tran_obj.createTran         =   qtyStatus == constant.status.DRAFTORDER ? 'true' : '';
                    tran_obj.addTran            =   (qtyStatus == constant.status.DRAFTORDER && i == 1) ? 'true' : '';
                    tran_obj.sku                =   order_item[i].SKU;
                    tran_obj.directivetype      =   Ordertype[userInput.purchaseOrderType][qtyStatus];
                    tran_item_arr.push(tran_obj);
                // }
                // if (action_tag === 'tran') {
                    if (qtyStatus === "submitted") {
                        var qty_obj = {};
                        qty_obj.purchaseOrderType   =   userInput.purchaseOrderType || "MAN";
                        qty_obj.location            =   userInput.shipToLocation;
                        if (userInput.markForLocation)
                            qty_obj.location        =   userInput.markForLocation;
                        qty_obj.producUom           =   order_item[i].producUom;
                        qty_obj.skuCost             =   order_item[i].productCost;
                        qty_obj.sku                 =   order_item[i].SKU;
                        qty_obj.qty                 =   order_item[i].qty;
                        qty_obj.poId                =   order_item[i].purchaseOrderNumber;
                        qty_obj.qtyStatus           =   qtyStatus;
                        qty_status_arr.push(qty_obj);
                    }
                // }
            }
            item_callback(null, tran_item_arr, qty_status_arr, jms_item_arr);
        }
        else {
            item_callback('no item data');
        }
    });
}

function publishOrder(userInput, orderData, jms_item, callback) {
    var submitjson = {};
    submitjson.purchaseOrder = {};
    submitjson.purchaseOrder.purchaseOrderNumber    =   userInput.purchaseOrderNumber;
    submitjson.purchaseOrder.purchaseOrderDate      =   new Date().getTime();
    submitjson.purchaseOrder.specialInstructions    =   userInput.specialInstructions;
    submitjson.purchaseOrder.shipToLocation         =   userInput.shipToLocation;
    submitjson.purchaseOrder.markForLocation        =   userInput.markForLocation;
    submitjson.purchaseOrder.vendorId               =   userInput.vendorName;
    submitjson.purchaseOrder.poType                 =   userInput.purchaseOrderType;
    submitjson.purchaseOrder.afs                    =   userInput.billTo;
    submitjson.purchaseOrder.needByDate             =   Number(userInput.needByDate) ? Number(userInput.needByDate) : undefined;
    submitjson.purchaseOrder.purchaseOrderItem      =   jms_item;
    if (userInput.orderStatus === 'submitted')
        orderData.submitJson = submitjson;
    callback(null, orderData);
}

function createTranData(userInput, orderData, callback) {
    getOrderItem (userInput, 'tran', function (err, tran_item, qty_status_data, jms_item){
        if (err){
            console.log(err);
            return callback(null, orderData);
        }

        orderItemManager.bulkInsertQtystatus (qty_status_data);
        orderData.tranArr = tran_item;
        publishOrder(userInput, orderData, jms_item, callback);
    });
}

/*
 * edit order by id.
 */
function editOrder(id, userInput, callback) {
    userInput['updatedBy'] = userInput.user.clientId;
    var order = orderModel.findById(id);
    if (order) {
        var noArr = ['PoSubtotal', 'PoSubtotalConfirm', 'PoSubtotalAsn', 'totalPoCost', 'totalPoCostConfirm', 'totalPoCostAsn', 'totalPoVAT', 'totalPoTax', 'totalPoVATConfirm', 'totalPoTaxConfirm', 'totalPoVATAsn', 'totalPoTaxAsn'];
        userInput = delNotNovalue(userInput, noArr);
        order.update(userInput, function(err, orderData){
            if(err)
                return callback(err);

            if (userInput.createTran)
                createTranData (userInput, orderData, callback);
            else
                callback(err, orderData);
        });
    }
}
/***************************************************************************************
 *
 * FUNCTION:    deleteOrder
 *
 * DESCRIPTION: to Delete draft orders.
 *
 * PARAMETERS:  _id, auth_header
 *
 * RETURNED:    service status reponse
 *
 * REVISION HISTORY:
 *
 *      Name          Date            Description
 *      ----          ----            -----------
 *       -              -             1st veesion
 *      Arun      03/15/2017          2nd version - added cancel functionality
 *
 ***************************************************************************************/
function deleteOrder(data, auth, callback) {

    orderModel.findOne({_id: data.id, isDeleted: false}, function(err, order){

        if (err || !order) {
            return callback({
                status: constant['label']['ERROR'],
                result: err ? err : order
            });
        }
        
        var updateData  =   {};

        ( order.purchaseOrderType == 'MAN' || order.purchaseOrderType == 'RPL' )
            ? updateData.isDeleted  =   false
            : updateData.isDeleted  =   true;
        ( order.purchaseOrderType == 'MAN' || order.purchaseOrderType == 'RPL' )
            ? updateData.orderStatus    =   constant.status.CANCELLED
            : '';
        updateData.lastModified     =   new Date();

        updateData.user     =   data.user;

        editOrder(data.id, updateData, function(err, order) {
            if (order) {
                orderItemManager.deletePoOrderItem(data, data.user, auth, callback);
            }
        });

    });

};
/***********************************************************************
 *
 * FUNCTION:    getSKUCosts
 *
 * DESCRIPTION: get last added SKUCost.
 *
 * REVISION HISTORY:
 *
 *            Name          Date            Description
 *            ----          ----            -----------
 *            Ratheesh      23/02/2016      First Version
 *
 ***********************************************************************/
function getSKUCosts(order, callback) {
    // var db_col = {
    //     "sku": "$sku"
    // };
    // db_col['skuCost'] = '$' + order.costvalue;
    po_item_quantity_statusModel.aggregate({
        "$match": {
            "poId": order.purchaseOrderNumber
        }
        // }, {
        //     "$sort": {
        //         "lastModified": -1
        //     }
    }, {
        "$group": {
            "_id": '$sku',
            "sku": {
                "$last": "$sku"
            },
            // "data": {
            //     "$last": {
            //         // "sku": "$sku",
            //         'skuCost': 
            //     }
            // }
            "data": {
                "$last": '$skuCost'
            }
        }
    }, {
        "$sort": {
            "lastModified": -1
        }
    }).exec(function(err, skudata) {
        var data = {};
        async.eachSeries(skudata, function(sku, asynccallback) {
            data[sku.sku] = sku.data;
            asynccallback();
        }, function() {
            callback('', data);
        });
    });
}

function getOrderItemQty(order_array, isReceivedWithDescrepancies, callback) {
    var condition = {};
    var locArray = [];
    condition["$and"] = [];
    condition["$and"].push({
        isDeleted: false
    });
    condition["$and"].push({
        "qtyStatus": {
            "$in": ["submitted", "received", "confirmed", "shipped", "unconfirmed"]
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
        if (isReceivedWithDescrepancies) {
            po_item_quantity_statusModel.find({
                'poId': {
                    $in: order_array
                },
                'packageId': {
                    $ne: null
                },
                'qtyStatus': {
                    $in: constant.discripencyQtyStatus
                },
                "isDeleted": false
            }).exec(function(err, records) {
                var response = {};
                response['orderQuantityData'] = success;
                response['descrepanciesData'] = records;
                callback(err, response);
            });
        } else {
            var response = {};
            response['orderQuantityData'] = success;
            callback(err, response);
        }
    });
}
/***********************************************************************
 *
 * FUNCTION:    getOrdersSummary
 *
 * DESCRIPTION: For get all orders based on user input.
 *
 * PARAMETERS:  "" or "id" or "fromdate" or "toDate" or "orderStatus" or 
                "purchaseOrderNumber" or "erpPurchaseOrder" or 
                "shipToLocation" or "order_type" or "pageOffSet" or "page_lmt".
 *
 * RETURNED:    returns All order details based on the input params.
 *
 * REVISION HISTORY:
 *
 *            Name          Date            Description
 *            ----          ----            -----------
 *            Arun          14/06/2016      First Version
 *
 ***********************************************************************/
function getOrdersSummary(userInput, callback) {
    var page_offset = 0;
    var page_lmt = 0;
    if (userInput['page_offset'] && userInput['page_lmt']) {
        page_offset = parseInt(userInput['page_offset']) || 0;
        page_lmt = parseInt(userInput['page_lmt']) || 1;
    }
    var required_field = {
        "_id": 1,
        "purchaseOrderNumber": 1,
        "purchaseOrderType": 1,
        "orderStatus": 1
    };
    var result = {};
    var condition = {};
    var locArray = [];
    condition["$and"] = [];
    condition["$and"].push({
        isDeleted: false
    });
    condition["$and"].push({
        'orderStatus': {
            $ne: 'draft'
        }
    });
    console.log('url', env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId);
    request(env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId, function(err, response, data) {
        // console.log("USER_LOC",data);
        try {
            if (data) {
                var loc = JSON.parse(data);
                Object.keys(loc.hierarchy).forEach(function(n) {
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
        var outboundOrder = [];
        var inboundOrder = [];
        var po_condtion = {};
        po_condtion["$and"] = [];
        po_condtion["$and"].push({
            isDeleted: false
        });
        po_condtion["$and"].push({
            'orderStatus': {
                $ne: 'draft'
            }
        });
        po_condtion["$and"].push({
            '$or': orcond
        });
        po_condtion["$and"].push({
            'purchaseOrderType': {
                $in: [constant.orderType.TRANSFER, constant.orderType.MANUAL_SHIP]
            }
        })
        orderModel.find(po_condtion, {
            "purchaseOrderNumber": 1
        }).sort({
            'lastModified': -1
        }).exec(function(err, order_data) {
            var poId_arr = [];
            for (var num = order_data.length - 1; num >= 0; num--) {
                poId_arr.push(order_data[num].purchaseOrderNumber);
            }
            var receivedWithDescrepancies = true;
            getOrderItemQty(poId_arr, receivedWithDescrepancies, function(err, qryStatusResponse) {
                var descrepanciesList = [];
                if (receivedWithDescrepancies) {
                    var records = qryStatusResponse['descrepanciesData'];
                    if (records.length > 0) {
                        var descripencyData = {};
                        records.forEach(function(qtyData) {
                            if (!descripencyData[qtyData.poId]) {
                                descripencyData[qtyData.poId] = {};
                            }
                            if (!descripencyData[qtyData.poId][qtyData.packageId]) {
                                descripencyData[qtyData.poId][qtyData.packageId] = {};
                            }
                            if (!descripencyData[qtyData.poId][qtyData.packageId][qtyData.sku]) {
                                descripencyData[qtyData.poId][qtyData.packageId][qtyData.sku] = {};
                            }
                            descripencyData[qtyData.poId][qtyData.packageId][qtyData.sku][qtyData.qtyStatus] = qtyData.qty;
                        });
                        if (Object.keys(descripencyData).length > 0) {
                            Object.keys(descripencyData).forEach(function(poId) {
                                Object.keys(descripencyData[poId]).forEach(function(packageId) {
                                    Object.keys(descripencyData[poId][packageId]).forEach(function(sku) {
                                        if (Object.keys(descripencyData[poId][packageId][sku]).length == 2) {
                                            if (descripencyData[poId][packageId][sku]['shipped'] != descripencyData[poId][packageId][sku]['received']) {
                                                descrepanciesList.push(poId);
                                            }
                                        } else if (Object.keys(descripencyData[poId][packageId][sku]).length == 1 && descripencyData[poId][packageId][sku]['received']) {
                                            descrepanciesList.push(poId);
                                        }
                                    });
                                });
                            });
                        }
                    }
                }
                var and_cond_1 = [];
                var and_cond_2 = [];
                var or_cond = [];
                var status_and = {};
                var loc_and = {};
                var bound_cond = {};
                and_cond_1.push({
                    purchaseOrderType: constant.orderType.TRANSFER
                }, {
                    orderStatus: {
                        $in: ["submitted", "confirmed"]
                    }
                });
                and_cond_2.push({
                    purchaseOrderType: {
                        $in: [constant.orderType.TRANSFER, constant.orderType.MANUAL_SHIP]
                    }
                }, {
                    purchaseOrderNumber: {
                        $in: descrepanciesList
                    }
                });
                var or_cond_1 = {
                    "$and": and_cond_1
                }
                var or_cond_2 = {
                    "$and": and_cond_2
                }
                or_cond.push(or_cond_1, or_cond_2);
                status_and = {
                    "$or": or_cond
                }
                loc_and = {
                    "FromLocation": {
                        "$in": locArray
                    }
                }
                bound_cond["$and"] = [];
                bound_cond["$and"].push(status_and, loc_and);
                orderModel.find(bound_cond, required_field).sort({
                    'lastModified': -1
                }).skip(page_offset).limit(page_lmt).exec(function(err, outOrderData) {
                    result.outBoundOrder = outOrderData;
                    and_cond_1 = [];
                    and_cond_2 = [];
                    or_cond = [];
                    status_and = {};
                    loc_and = {};
                    bound_cond = {};
                    var and_cond_3 = [];
                    and_cond_1.push({
                        purchaseOrderType: constant.orderType.MANUAL_ORDER
                    }, {
                        orderStatus: {
                            $in: ["submitted", "inProgress"]
                        }
                    });
                    and_cond_2.push({
                        purchaseOrderType: constant.orderType.TRANSFER
                    }, {
                        orderStatus: {
                            $in: ["confirmed", "partiallyShipped"]
                        }
                    });
                    and_cond_3.push({
                        purchaseOrderType: constant.orderType.MANUAL_SHIP
                    }, {
                        orderStatus: "inProgress"
                    });
                    var or_cond_1 = {
                        "$and": and_cond_1
                    }
                    var or_cond_2 = {
                        "$and": and_cond_2
                    }
                    var or_cond_3 = {
                        "$and": and_cond_3
                    }
                    or_cond.push(or_cond_1, or_cond_2, or_cond_3);
                    status_and = {
                        "$or": or_cond
                    }
                    loc_and = {
                        "shipToLocation": {
                            "$in": locArray
                        }
                    }
                    bound_cond["$and"] = [];
                    bound_cond["$and"].push(status_and, loc_and);
                    orderModel.find(bound_cond, required_field).sort({
                        'lastModified': -1
                    }).skip(page_offset).limit(page_lmt).exec(function(err, inOrderData) {
                        result.inBoundOrder = inOrderData;
                        if (err) {
                            callback(err, '');
                        } else {
                            changeorderStatus(result, callback);
                        }
                    });
                });
            });
        });
    });
}
/***********************************************************************
 *
 * FUNCTION:    addorderSKU
 *
 * DESCRIPTION: Add SKU.
 *
 * PARAMETERS:  data orderdata.
 *
 *
 * REVISION HISTORY:
 *
 *            Name              Date            Description
 *            ----              ----            -----------
 *            Ratheesh          27/06/2016      First Version
 *
 ***********************************************************************/
function addorderSKU(data, headers, callback) {
    var updateOrderData = function(data, order) {
        orderItemModel.find({
            purchaseOrderNumber: data.purchaseOrderNumber,
            isDeleted: false
        }, function(err, orderData) {
            var PoSubtotal = "0";
            var totalPoCost = "0";
            var totalPoVAT = "0";
            var totalPoTax = "0";
            var totalorder = 0;
            var totalProducts = 0;
            var numberOfSKU = 0;
            for (var j = 0, length2 = orderData.length; j < length2; j++) {
                PoSubtotal = parseFloat(PoSubtotal) + parseFloat(orderData[j].totalProductCost);
                totalProducts = parseFloat(totalProducts) + parseFloat(orderData[j].qty);
                totalPoTax = parseFloat(totalPoTax) + parseFloat(orderData[j].totalProductTax);
                totalPoVAT = parseFloat(totalPoVAT) + parseFloat(orderData[j].totalProductVat);
            }
            order.PoSubtotal = parseFloat(PoSubtotal).toFixed(2);
            // order.totalPoCost = (parseFloat(orderData.productCost) + (parseFloat(orderData.productTax) || parseFloat(orderData.productTax))).toFixed(2);
            order.totalPoCost = parseFloat(parseFloat(PoSubtotal) + parseFloat(totalPoTax)).toFixed(2);
            // order.totalPoVAT = parseFloat(orderData.productVat);
            // order.totalPoTax = parseFloat(orderData.productTax);
            order.totalPoVAT = parseFloat(totalPoVAT).toFixed(2);
            order.totalPoTax = parseFloat(totalPoTax).toFixed(2);
            order.numberOfProducts = parseFloat(totalProducts);
            order.numberOfSKU = orderData.length;
            order.save();
        });
    };
    var tranArr = [];
    try {
        var getdataobj = function(orderData, order) {
            var toLoc;
            if (order.markForLocation) {
                toLoc = order.markForLocation;
            } else {
                toLoc = order.shipToLocation;
            }
            fromLoc = order.FromLocation;
            function createTranObj(orderData, itemData, location) {
                for (var i = location.length - 1; i >= 0; i--) {
                    var tempLoc;
                    var dataObj = {
                        transtypeid: '',
                        stocklocationid: '',
                        asnid: '',
                        stockUOM: '',
                        locationid: location[i],
                        quantity: itemData.qty,
                        purchaseOrderNumber: orderData.purchaseOrderNumber,
                        purchaseOrderType: orderData.purchaseOrderType,
                        cost: itemData.totalProductCost,
                        warehouseid: location[i],
                        createTran: true,
                        addTran: true,
                        sku: itemData.SKU
                    };
                    if (orderData.purchaseOrderType === constant.orderType.MANUAL_ORDER) {
                        dataObj.directivetype = Ordertype[orderData.purchaseOrderType]['draftOrder'];
                    } else if (orderData.purchaseOrderType === constant.orderType.TRANSFER) {
                        tempLoc = (i === 0) ? 'toStore' : 'fromStore';
                        dataObj.directivetype = Ordertype[orderData.purchaseOrderType][tempLoc][orderData.orderStatus];
                    }
                    tranArr.push(dataObj);
                }
            }
            if (order.purchaseOrderType === constant.orderType.MANUAL_ORDER) {
                createTranObj(order, orderData, [toLoc]);
            } else if (order.purchaseOrderType === constant.orderType.TRANSFER) {
                createTranObj(order, orderData, [toLoc, fromLoc]);
            }
            return tranArr;
        };
        if (data && data.purchaseOrderType) {
            if (data.purchaseOrderNumber) {
                orderModel.findOne({
                    purchaseOrderNumber: data.purchaseOrderNumber,
                    purchaseOrderType: data.purchaseOrderType,
                    orderStatus: constant.status.DRAFT,
                    isDeleted: false
                }, function(error, order) {
                    if (order) {
                        orderItemModel.find({
                            purchaseOrderNumber: data.purchaseOrderNumber,
                            isDeleted: false
                        }, function(err, orderSKU) {
                            var skuData;
                            for (var j = 0, length2 = orderSKU.length; j < length2; j++) {
                                if (orderSKU[j].SKU === data.orderSKU.SKU) {
                                    skuData = orderSKU[j];
                                }
                            }
                            if (skuData) {
                                var orderData = skuData;
                                var SKU = data.orderSKU;
                                orderData['createdBy'] = data.user.clientId;
                                orderData['purchaseOrderNumber'] = order.purchaseOrderNumber;
                                orderData['updatedBy'] = data.user.clientId;
                                orderData['qty'] = parseFloat(SKU.qty) + parseFloat(orderData['qty']);
                                orderData['totalProductCost'] = parseFloat(parseFloat(SKU.totalProductCost) + parseFloat(orderData['totalProductCost'])).toFixed(2);
                                orderData['totalProductTax'] = parseFloat(parseFloat(SKU.totalProductTax) + parseFloat(orderData['totalProductTax'])).toFixed(2);
                                orderData['totalProductVat'] = parseFloat(parseFloat(SKU.totalProductVat) + parseFloat(orderData['totalProductVat'])).toFixed(2);
                                orderItemModel.findOneAndUpdate({
                                    purchaseOrderNumber: data.purchaseOrderNumber,
                                    SKU: orderData.SKU,
                                    isDeleted: false
                                }, {
                                    $set: orderData
                                }, function(err, orderSKU) {
                                    var dataObj = getdataobj(orderData, order);
                                    console.log("ARRAYDATA___________:",dataObj);
                                    updateOrderData(data, order);
                                    callback('', {
                                        orderdata: orderData,
                                        dataobj: dataObj
                                    });
                                });
                            } else {
                                var orderData = data.orderSKU;
                                orderData['purchaseOrderNumber'] = order.purchaseOrderNumber;
                                orderData['lineNumber'] = orderSKU.length + 1;
                                orderData['updatedBy'] = data.user.clientId;
                                var orderItem = new orderItemModel(orderData);
                                orderItem.save(function(err, result) {
                                    updateOrderData(data, order);
                                    var dataObj = getdataobj(orderData, order);
                                    callback('', {
                                        orderdata: orderData,
                                        dataobj: dataObj
                                    });
                                });
                            }
                        });
                    } else {
                        callback('No purchaseOrder found.');
                    }
                });
            } else {
                var addOrder = {};
                var token = utils.uid(6);
                addOrder = data;
                addOrder['purchaseOrderNumber'] = data.newOrderNumber ? data.newOrderNumber : token;
                addOrder['shipToLocation'] = data.shipToLocation;
                if(data.status === 'draft'){
                addOrder['orderStatus'] = constant.status.DRAFT;
                }if(data.status === 'submitted'){
                addOrder['orderStatus'] = constant.orderStatus.SUBMITTED;
                }
                addOrder['createdBy'] = data.user.clientId;
                addOrder['updatedBy'] = data.user.clientId;
                var order = new orderModel(addOrder);
                order.save(function(err, order) {
                    if (!err && data) {
                        var orderData = data.orderSKU;
                        orderData['purchaseOrderNumber'] = order.purchaseOrderNumber;
                        orderData['lineNumber'] = 1;
                        orderData['createdBy'] = data.user.clientId;
                        orderData['updatedBy'] = data.user.clientId;
                        var orderItem = new orderItemModel(orderData);
                        orderItem.save(function(err, result) {
                            var dataObj = getdataobj(orderData, order);
                            order.PoSubtotal = parseFloat(orderData.productCost);
                            order.purchaseOrderType = data.purchaseOrderType;
                            // order.totalPoCost = (parseFloat(orderData.productCost) + (parseFloat(orderData.productTax) || parseFloat(orderData.productTax))).toFixed(2);
                            order.totalPoCost = parseFloat(orderData.totalProductCost);
                            // order.totalPoVAT = parseFloat(orderData.productVat);
                            // order.totalPoTax = parseFloat(orderData.productTax);
                            order.totalPoVAT = parseFloat(orderData.totalProductVat);
                            order.totalPoTax = parseFloat(orderData.totalProductTax);
                            order.numberOfProducts = parseFloat(orderData.qty);
                            order.numberOfSKU = 1;
                            order.save();
                            callback('', {
                                orderdata: orderData,
                                dataobj: dataObj
                            });
                        });
                    }
                });
                var quantityStatus = po_item_quantity_statusModel({
                      
                      skuCost:parseFloat(data.orderSKU.productCost),
                      sku:data.orderSKU.SKU,
                      qty:data.orderSKU.qty,
                      poId:data.purchaseOrderNumber,
                      reasonCode:'test reason',
                      qtyStatus: data.orderStatus,
                      tranCreate:true
                    });
                    quantityStatus.save(function(err , quantity) {
                if (err) console.log(err,'save error');

                console.log('quantity_status created!');
                });  

            }
        } else {
            callback('No purchaseOrderType found.');
        }
    } catch (e) {
        console.log(e);
        callback('No purchaseOrderType found.');
    }
}
/***********************************************************************
 *
 * FUNCTION:    changeorderStatus
 *
 * DESCRIPTION: displayStatus.
 *
 *
 *
 * REVISION HISTORY:
 *
 *            Name              Date            Description
 *            ----              ----            -----------
 *            Ratheesh          7/07/2016      First Version
 *
 ***********************************************************************/
function changeorderStatus(result, callback) {
    var fulFillmentData = {};
    var po_no_arr = [];
    var receivedWithDescrepancies = true;
    for (var j = 0, length2 = result.outBoundOrder.length, length = result.inBoundOrder.length; j < length2 && j < length; j++) {
        if (result.outBoundOrder[j]) {
            fulFillmentData[result.outBoundOrder[j].purchaseOrderNumber] = {};
            if (constant.fulFillmentStatus[result.outBoundOrder[j].purchaseOrderType]) {
                po_no_arr.push(result.outBoundOrder[j].purchaseOrderNumber);
            }
        }
        if (result.inBoundOrder[j]) {
            fulFillmentData[result.inBoundOrder[j].purchaseOrderNumber] = {};
            if (constant.fulFillmentStatus[result.inBoundOrder[j].purchaseOrderType]) {
                po_no_arr.push(result.inBoundOrder[j].purchaseOrderNumber);
            }
        }
    }
    var displayStatusObject = function(po, orderStatus) {
        try {
            var submittedQty = fulFillmentData[po.purchaseOrderNumber]['submitted'];
            var confirmedQty = fulFillmentData[po.purchaseOrderNumber]['confirmed'];
            var shippedQty = fulFillmentData[po.purchaseOrderNumber]['shipped'];
            var rejectedQty = fulFillmentData[po.purchaseOrderNumber]['rejected'];
            var receivedQty = fulFillmentData[po.purchaseOrderNumber]['received'];
            if (eval(constant.fulFillmentStatus[po.purchaseOrderType][orderStatus])) {
                po.orderStatus = orderStatus;
            }
        } catch (e) {}
    };
    getOrderItemQty(po_no_arr, receivedWithDescrepancies, function(err, qryStatusResponse) {
        var descrepanciesList = [];
        var qty_status_data = qryStatusResponse['orderQuantityData'];
        if (qty_status_data.length > 0) {
            qty_status_data.forEach(function(qtyStatusRecords) {
                qtyStatusRecords.orderQty.forEach(function(qtyStatusData) {
                    fulFillmentData[qtyStatusRecords._id][qtyStatusData.qtyStatus] = qtyStatusData['count'];
                });
            });
            var fulfillmentStatus = ["draft", "submitted", "confirmed", "partiallyShipped", "shippedFull", "receivedFull", "received", "rejected"];
            fulfillmentStatus.forEach(function(orderStatus) {
                for (var j = 0, length2 = result.outBoundOrder.length, length = result.inBoundOrder.length; j < length2 && j < length; j++) {
                    try {
                        if (result.outBoundOrder[j]) {
                            if (constant.fulFillmentStatus[result.outBoundOrder[j].purchaseOrderType]) {
                                displayStatusObject(result.outBoundOrder[j], orderStatus);
                            }
                        }
                        if (result.inBoundOrder[j]) {
                            if (constant.fulFillmentStatus[result.inBoundOrder[j].purchaseOrderType]) {
                                displayStatusObject(result.inBoundOrder[j], orderStatus);
                            }
                        }
                    } catch (e) {}
                }
            });
            callback('', result);
        } else {
            callback('', result);
        }
    });
}

function addFullFillDescrepancy(userInput, orderData, callback) {
    var poId_arr = [];
    var fulFillmentData = {};
    var result = {};
    var order_type = userInput['order_type'] || userInput['purchaseOrderType'];
    var fullFillmentStatus = userInput['orderFulfillment'] || '';
    for (var num = orderData.length - 1; num >= 0; num--) {
        poId_arr.push(orderData[num].purchaseOrderNumber);
        fulFillmentData[orderData[num].purchaseOrderNumber] = {};
    }
    var receivedWithDescrepancies = true;
    /*if(userInput['orderFulfillment']){
        var fulfillmentStatus    =   userInput['orderFulfillment'].split(',');
        if(fulfillmentStatus.indexOf('receivedWithDescrepancies') != -1){
            receivedWithDescrepancies   =   true;
        }
    }*/
    getOrderItemQty(poId_arr, receivedWithDescrepancies, function(err, qryStatusResponse) {
        var qty_status_data = qryStatusResponse['orderQuantityData'];
        if (qty_status_data.length > 0) {
            qty_status_data.forEach(function(qtyStatusRecords) {
                // console.log('qtyStatusRecords');
                // console.log(qtyStatusRecords);
                qtyStatusRecords.orderQty.forEach(function(qtyStatusData) {
                    fulFillmentData[qtyStatusRecords._id][qtyStatusData.qtyStatus] = qtyStatusData['count'];
                });
            });
        }
        // console.log('fulFillmentData');
        // console.log(fulFillmentData);
        var isOrderFulfillment = false;
        var descrepanciesList = [];
        if (receivedWithDescrepancies) {
            var records = qryStatusResponse['descrepanciesData'];
            if (records.length > 0) {
                var descripencyData = {};
                records.forEach(function(qtyData) {
                    if (!descripencyData[qtyData.poId]) {
                        descripencyData[qtyData.poId] = {};
                    }
                    if (!descripencyData[qtyData.poId][qtyData.packageId]) {
                        descripencyData[qtyData.poId][qtyData.packageId] = {};
                    }
                    if (!descripencyData[qtyData.poId][qtyData.packageId][qtyData.sku]) {
                        descripencyData[qtyData.poId][qtyData.packageId][qtyData.sku] = {};
                    }
                    descripencyData[qtyData.poId][qtyData.packageId][qtyData.sku][qtyData.qtyStatus] = qtyData.qty;
                });
                // console.log('descripencyData');
                // console.log(descripencyData);
                if (Object.keys(descripencyData).length > 0) {
                    Object.keys(descripencyData).forEach(function(poId) {
                        Object.keys(descripencyData[poId]).forEach(function(packageId) {
                            Object.keys(descripencyData[poId][packageId]).forEach(function(sku) {
                                // console.log(descripencyData[poId][packageId][sku]);
                                if (Object.keys(descripencyData[poId][packageId][sku]).length == 2) {
                                    if (descripencyData[poId][packageId][sku]['shipped'] != descripencyData[poId][packageId][sku]['received']) {
                                        descrepanciesList.push(poId);
                                    }
                                } else if (Object.keys(descripencyData[poId][packageId][sku]).length == 1 && descripencyData[poId][packageId][sku]['received']) {
                                    descrepanciesList.push(poId);
                                }
                            });
                        });
                    });
                }
            }
        }
        // console.log('orderFulfillment');
        // console.log(userInput['orderFulfillment']);
        if (!fullFillmentStatus) {
            var fulfillmentStatus = constant.fulFillmentStatus[order_type] ? Object.keys(constant.fulFillmentStatus[order_type]) : [];
        } else if(fullFillmentStatus && fullFillmentStatus == 'receivedWithDescrepancies') {
                var fulfillmentStatus = constant.fulFillmentStatus['receivedWithDescrepancies'][order_type] ? Object.keys(constant.fulFillmentStatus['receivedWithDescrepancies'][order_type]) : [];
                var eligiblePoIds = [];
                isOrderFulfillment = true;
        } else {
            isOrderFulfillment = true;
            var eligiblePoIds = [];
            var fulfillmentStatus = fullFillmentStatus.split(',');
        } 
        var displayStatusObject = {};
        fulfillmentStatus.forEach(function(orderStatus) {
            Object.keys(fulFillmentData).forEach(function(poId) {
                var submittedQty = fulFillmentData[poId]['submitted'];
                var confirmedQty = fulFillmentData[poId]['confirmed'];
                var shippedQty = fulFillmentData[poId]['shipped'];
                var rejectedQty = fulFillmentData[poId]['rejected'];
                var receivedQty = fulFillmentData[poId]['received'];
                if(userInput.orderFulfillment == 'receivedWithDescrepancies') {
                    if (eval(constant.fulFillmentStatus['receivedWithDescrepancies'][order_type][orderStatus])) {
                        if(isOrderFulfillment) {
                            eligiblePoIds = eligiblePoIds.concat(descrepanciesList); 
                        }
                        displayStatusObject[poId] = orderStatus;
                    }
                } else {
                    if (eval(constant.fulFillmentStatus[order_type][orderStatus])) {
                        if (isOrderFulfillment) {
                            eligiblePoIds.push(poId);
                        }
                        displayStatusObject[poId] = orderStatus;
                    }
                }
                    
            });
        });
        result.eligiblePoIds = eligiblePoIds;
        result.qty_status_data = qty_status_data;
        result.descrepanciesList = descrepanciesList;
        result.displayStatusObject = displayStatusObject;
        result.isOrderFulfillment = isOrderFulfillment;
        callback(err, result);
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
                                    orderNumberArr.push(itemData[item].purchaseOrderNumber);
                                }
                            }
                            result_obj["purchaseOrderNumber"] = {
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
                        result_obj["purchaseOrderNumber"] = {
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
                                if ((cost >= frmPriceNum) && (cost <= toPriceNum)) orderNumberArr.push(orderData[item].purchaseOrderNumber);
                            }
                            if ((toPrice && toPrice != '') && frmPrice == '') {
                                if (cost <= toPriceNum) orderNumberArr.push(orderData[item].purchaseOrderNumber);
                            } else if ((frmPrice && frmPrice != '') && toPrice == '') {
                                if (cost >= frmPriceNum) orderNumberArr.push(orderData[item].purchaseOrderNumber);
                            }
                        }
                        catch (ex) {
                            utils.errorTrace(ex);
                            callback ('unable to filter data')
                        }
                    }
                    result_obj["purchaseOrderNumber"] = {
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

/***********************************************************************************
 *
 * FUNCTION:    getUserConfigById
 *
 * DESCRIPTION: To get user config based on featureId.
 *
 * PARAMETERS:  featureId
 *
 * RETURNED:    config data
 *
 * REVISION HISTORY:
 *
 *            Name          Date            Description
 *            ----          ----            -----------
 *            Arun          04/12/2017      1st Version
 *
 ************************************************************************************/
function getUserConfigById(featureId, header, config_callback) {

    console.log(env_config.apiPath + constant.apis.GET_USER_CONFIG, featureId);
    var options = {
        url: env_config.apiPath + constant.apis.GET_USER_CONFIG + featureId,
        method: 'GET',
        headers: {
            'authorization': header
        }
    };

    request(options, function(err, response, data) {
        console.log(err, data);
        console.log('asynccallback', data);
        try {
            data    =   JSON.parse(data);
        }
        catch(ex) {
            utils.errorTrace(ex);
            if (config_callback)
                return config_callback(ex, data)
        }
        config_callback ? config_callback(err, data) : '';
    });
}

function calculateDate(config_date) {
    if (config_date) {
        try {
            var queryDate  =   new Date();
            
            queryDate.setDate(queryDate.getDate() - parseInt(config_date));
            queryDate.setHours(23);
            queryDate.setMinutes(59);
            queryDate.setSeconds(59);

            queryDate = queryDate.toISOString();
            return queryDate;
        }
        catch(ex) {
            console.log("Error:",e);
            return null;
        }
    }
    else {
        return null;
    }

}

/***********************************************************************************
 *
 * FUNCTION:    cancelDraftOrder
 *
 * DESCRIPTION: For cancel manual orders from jobs.
 *
 * PARAMETERS:  null
 *
 * RETURNED:    service status reponse
 *
 * REVISION HISTORY:
 *
 *            Name          Date            Description
 *            ----          ----            -----------
 *            Arun          03/15/2017      1st Version
 *
 ************************************************************************************/
function cancelDraftOrder (userInput, header, callback) {
    console.log('url', env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId);
    request(env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId, function(err, response, data) {
        // Loc error handler.
        try {
            var locArray = [];
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
        getUserConfigById ("autoForceCancelDraft", header, function(err, configData) {

            if (err)
                return callback(err);
            if (configData && configData.config_arr && configData.config_arr[0]) {
                var cancelConfig    =   configData.config_arr[0].featureValue ? configData.config_arr[0].featureValue : configData.config_arr[0].defaultValue;
            }
                         
            var query   =   {};
            query['$and']   =   [];
            query['$and'].push({isDeleted: false});
            query['$and'].push({orderStatus : constant.status.DRAFT});
            query['$and'].push({"purchaseOrderType" : {'$in': constant.CANCEL_ORDER_TYPES}});
            query['$and'].push({
                "shipToLocation": {
                    "$in": locArray
                }
            });
            try {
                var cancelDate  =   calculateDate(cancelConfig);
                if (!cancelDate)
                    return callback(null, "No Date configuration found");
                console.log("Draft_close_DATE_:",cancelDate);
                date_range = {
                    '$lte': new Date(cancelDate)
                };
            }
            catch (e) {
                console.log("Error_:",e);
                return callback(null, "No Date configuration found");
            }

            query['$and'].push({lastModified: date_range});

            orderModel.find(query, function(err, queryData) {

                orderModel.update(query, 
                {
                    orderStatus : constant.status.CANCELLED, 
                    updatedBy: userInput.user.clientId, 
                    lastModified: new Date() 
                }, 
                {multi: true}, function (err, modifiedData) {
                    if (err) {
                        return callback(err);
                    }
                    else if (modifiedData.nModified && modifiedData.nModified !== 0) {
                        orderItemManager.deletePoOrderItem(queryData, userInput.user, header, callback);
                    }
                    else {
                        return callback(null, "No Orders Found");
                    }
                });

            });

        });
    });

}

/***********************************************************************************
 *
 * FUNCTION:    forceCloseOrder
 *
 * DESCRIPTION: For Colse manual orders based on configuration.
 *
 * PARAMETERS:  null
 *
 * RETURNED:    API status reponse
 *
 * REVISION HISTORY:
 *
 *            Name          Date            Description
 *            ----          ----            -----------
 *            Arun          04/21/2017      1st Version
 *
 ************************************************************************************/
function forceCloseOrder (userInput, header, main_callback) {
    console.log('url', env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId);
    request(env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId, function(err, response, data) {
        // Loc error handler.
        var locArray = [];
        try {
            if (data) {
                var loc = JSON.parse(data);
                Object.keys(loc.hierarchy).forEach(function(n) {
                    // console.log('loc', loc.hierarchy[n]);
                    locArray.push(loc.hierarchy[n].id);
                });
            }
        } catch (ex) {
            console.log("Error:",ex);
            return main_callback('can not load user data.');
        }
        getUserConfigById ("autoForceCloseOrder", header, function(err, configData) {

            if (err)
                return main_callback(err);
            if (configData && configData.config_arr && configData.config_arr[0]) {
                var cancelConfig    =   configData.config_arr[0].featureValue ? configData.config_arr[0].featureValue : configData.config_arr[0].defaultValue;
            }

            var query   =   {};
            query['$and']   =   [];
            query['$and'].push({isDeleted: false});
            query['$and'].push({"purchaseOrderType" : {'$in': constant.CANCEL_ORDER_TYPES}});
            query['$and'].push({
                "shipToLocation": {
                    "$in": locArray
                }
            });

            try {
                var closeDate  =   calculateDate(cancelConfig);
                console.log("Force_close_DATE_:",closeDate);
                if (!closeDate) 
                    return main_callback(null, 'No Date configuration Found')
                var date_range = {
                    '$lte': new Date(closeDate)
                };
            }
            catch (e) {
                console.log("ERROR_:",e);
                return main_callback(null, 'No Date configuration Found')
            }

            query['$and'].push({lastModified: date_range});
                    
            async.waterfall([
                function getSubmittedPoId (callback) {
                    var submittedQuery  =   JSON.parse(JSON.stringify(query));

                    submittedQuery['$and'].push({
                        orderStatus : {
                            '$in': [constant.orderStatus.SUBMITTED]
                        }
                    });
                    orderModel.find(submittedQuery, function(err, orders) {
                        if (err) 
                            return main_callback(err);
                        var sub_po     =   {};
                        for (var i = orders.length - 1; i >= 0; i--) {
                            sub_po[orders[i].purchaseOrderNumber]    =   orders[i];
                        }
                        callback (null, sub_po);
                    });
                },
                function getInProgressPoIds (submittedPo, callback) {

                    var submittedPoIds  =  Object.keys(submittedPo)
                    var inProQuery  =     JSON.parse(JSON.stringify(query));

                    inProQuery['$and'].push({
                        orderStatus : {
                            '$in': [constant.orderStatus.INPROGRESS]
                        }
                    });

                    inProQuery['$and'].push({
                        purchaseOrderNumber : {
                            '$nin': submittedPoIds
                        }
                    });

                    orderModel.find(inProQuery, function(err, orders) {
                        if (err) 
                            return main_callback(err);
                        var poIdArr     =   [];
                        var inProPos = {};
                        var orderQtyData = {};
                        var result = {};
                        var resultInProPos     =   {};
                        for (var num = orders.length - 1; num >= 0; num--) {
                            poIdArr.push(orders[num].purchaseOrderNumber);
                            orderQtyData[orders[num].purchaseOrderNumber] = {};
                            inProPos[orders[num].purchaseOrderNumber]    =   orders[num];
                        }   
                        getOrderItemQty(poIdArr, false, function(err, qryStatusResponse) {
                            var qty_status_data = qryStatusResponse['orderQuantityData'];
                            if (qty_status_data.length > 0) {
                                qty_status_data.forEach(function(qtyStatusRecords) {
                                    // console.log('qtyStatusRecords');
                                    // console.log(qtyStatusRecords);
                                    qtyStatusRecords.orderQty.forEach(function(qtyStatusData) {
                                        orderQtyData[qtyStatusRecords._id][qtyStatusData.qtyStatus] = qtyStatusData['count'];
                                    });
                                });
                            }

                            var forceCloseStatus = constant.forceCloseStatus ? Object.keys(constant.forceCloseStatus) : [];

                            var eligiblePoIds   =   [];
                            forceCloseStatus.forEach(function(cond) {
                                Object.keys(orderQtyData).forEach(function(poId) {
                                    var submittedQty = orderQtyData[poId]['submitted'];
                                    var confirmedQty = orderQtyData[poId]['confirmed'];
                                    var unconfirmedQty = orderQtyData[poId]['unconfirmed'];
                                    var shippedQty = orderQtyData[poId]['shipped'];
                                    var receivedQty = orderQtyData[poId]['received'];
                                    var con_uncon   =   confirmedQty + unconfirmedQty;
                                    if (eval(constant.forceCloseStatus[cond]) && cond == "eligible") {
                                        eligiblePoIds.push(poId);
                                    }
                                        
                                });
                            });
                            // eligiblePoIds  =  eligiblePoIds.concat(submittedPoId);
                            eligiblePoIds.forEach(function (poId) {
                                resultInProPos[poId]    =   inProPos[poId];
                            });
                            var eligiblePos   =   lodash.merge({}, submittedPo, resultInProPos);
                            var resultPoIds = Object.keys(eligiblePos);
                            var resultObj = {};
                            resultObj.orders = eligiblePos;
                            resultObj.resultPoIds = resultPoIds;
                            callback(err, resultObj);
                        });
                    });
                },
                function closeEligiblePoItems (eligiblePos, callback) {
                    if (eligiblePos.resultPoIds && eligiblePos.resultPoIds.length == 0) {
                        return main_callback(null, "No Orders Found");
                    }
                    else {
                        orderItemManager.checkOrderItems (eligiblePos.orders, header, function (err, num_orders) {
                            callback(err, eligiblePos.resultPoIds)
                        });
                    }
                }
            ], function (error, eligibleIds) {
                if (error) { 
                    return main_callback(err);
                }
                if (eligibleIds && eligibleIds.length) {
                    query['$and'].push({
                        "shipToLocation": {
                            "$in": locArray
                        }
                    });
                    orderModel.update({
                        purchaseOrderNumber: { '$in': eligibleIds }
                    }, 
                    {
                        orderStatus : "forceClosed", 
                        updatedBy: userInput.user.clientId, 
                        lastModified: new Date() 
                    }, 
                    {
                        multi: true
                    }, function (err, modifiedData) {
                        return main_callback(null, "Number of Orders affected: "+eligibleIds.length);
                    });
                }
                else {
                    return main_callback(null, eligibleIds);
                }
            });

        });
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

/***********************************************************************
 *
 * FUNCTION:    getOrder
 *
 * DESCRIPTION: For get orders based on user input.
 *
 * PARAMETERS:  "" or "id" or "fromdate" or "toDate" or "orderStatus" or 
                "shipToLocation" or "order_type" or "pageOffSet" or "page_lmt".
 *
 * RETURNED:    returns purchase order details based on the input params.
 *
 * REVISION HISTORY:
 *
 *            Name          Date            Description
 *            ----          ----            -----------
 *            Arun          02/05/2017      First Version
 ***********************************************************************/
function getOrderNumbers(userInput, callback) {
    var userLocations   =   userInput['userStores'];
    var userId          =   userInput['user']['clientId'];
    var orderType       =   userInput['orderType'];
    var orderStatus     =   userInput['orderStatus'];
    var key             =   userInput['key'];
    var isErp           =   userInput['isErp'];
    var query           =   {};
  
    var getOrderData = function () {
        var orcond      =   [];
        var orcond_2    =   [];

        orcond.push({
            "FromLocation": {
                "$in": userLocations
            }
        });

        orcond.push({
            "shipToLocation": {
                "$in": userLocations
            }
        });

        var projectionField = {};

        projectionField._id     =   0;

        if (isErp) {

            projectionField.erpPurchaseOrder = 1;
            orcond_2.push({"erpPurchaseOrder": new RegExp('^.*?'+key+'.*?$', "i")});

        }

        else{

            projectionField.purchaseOrderNumber = 1;
            projectionField.orderNumber = 1;

            orcond_2.push({"purchaseOrderNumber": new RegExp('^.*?'+key+'.*?$', "i")});
            orcond_2.push({"orderNumber": new RegExp('^.*?'+key+'.*?$', "i")});
        }

            
        query["$and"].push({
            '$or': orcond
        });
        query["$and"].push({
            '$or': orcond_2
        });

        orderModel.find(query, projectionField ).sort({
            'lastModified': -1
        }).limit(20).exec(function(err, order_data) {
            callback(err, order_data);
        });  
    }

    query['$and']   =   [];

    query['$and'].push({isDeleted : false});

    if (orderType){
        query['$and'].push({
            purchaseOrderType : { '$in': orderType.split(',') }
        });
    }

    if (orderStatus){
        query['$and'].push({
            orderStatus : { '$in': orderStatus.split(',') }
        });
    }

    if (!userLocations || (userLocations && userLocations.length === 0)){
        getUserLocations (userId, function(err, loc_data){
            if (err)
                return callback(err);
            userLocations   =   loc_data;
            getOrderData();
        });
    }
    else {
        getOrderData();
    }


}

/**********************************************************************************
 *
 * FUNCTION:    copyOrder
 *
 * DESCRIPTION: copy and saves Order.
 *
 * PARAMETERS:  purchaseOrderNumber, page_offset, page_limit and callback.
 *
 * RETURNED:    current_offset, page_limit, item_data, order_data.
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         17/07/2017    1.0.0       First Version
 *
 **********************************************************************************/
function copyOrder (payload, callback) {
    var purchaseOrderNumber = payload.purchaseOrderNumber;
    orderModel.findOne({
        purchaseOrderNumber: purchaseOrderNumber,
        isDeleted: false
    }, {
        _id: 0,
        createdBy: 0,
        updatedBy: 0,
        created: 0,
        lastModified: 0,
        __v: 0,
        erpPurchaseOrder: 0,
        purchaseOrderDate: 0,
        userId: 0,
        erpNotes: 0,
        needByDate:0
    }).exec(function(err, orderData){

        if (err){
            utils.errorTrace(err);
            return callback(err);
        }

        if(orderData) {
            orderData["orderStatus"] = "draft";
            orderData["user"] = payload.user;
            createOrder(orderData, function(err, savedData){

                if (err){
                    utils.errorTrace(err);
                    return callback(err);
                }

                orderItemManager.copyOrderItem({
                    existOrder: purchaseOrderNumber,
                    user: payload.user,
                    newOrder: savedData.purchaseOrderNumber,
                    page_lmt: payload.page_lmt
                }, function(err, itemDataSaved){

                    if (err){
                        utils.errorTrace(err);
                        return callback("Failed to save item data");
                    }

                    callback(err, {
                        order_data: savedData,
                        item_result: itemDataSaved
                    });

                });

            });
        } else {
            return callback("No Order found");
        }

    });
}

