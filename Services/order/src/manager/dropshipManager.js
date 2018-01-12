var express = require('express');
var log = require('../log');
var dropshipModel = require('./../model/dropshipModel');
var po_item_quantity_statusModel = require('./../model/po_item_quantity_statusModel');
var countModel = require('./../model/countModel');
var orderItemModel = require('./../model/orderItemModel');
var directiveMasterModel = require('./../model/directiveMasterModel');
var po_asnModel = require('./../model/po_asnModel');
var directiveItemModel = require('./../model/directiveItemModel');
var utils = require('./utils');
var router = express.Router();
var async = require('async');
var constant = require('../../config/const.json');
var env_config = require('../../config/config.js');
var request = require('request');
var dropshipItemManager = require('./../manager/dropshipItemManager');
module.exports = {
    getOrder: getOrder,
    createOrder: createOrder,
    editOrder: editOrder,
    deleteOrder: deleteOrder,
};
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
 *            Ratheesh      10/02/2016      1 Version
 *
 ***********************************************************************/
function getOrder(userInput, callback) {
    var id = userInput['id'];
    var fromDate = userInput['fromdate'];
    var toDate = userInput['todate'];
    var orderStatus = userInput['orderstatus'];
    var purchaseOrderNumber = userInput['purchaseordernumber'];
    var erpPurchaseOrder = userInput['erpPurchaseOrder'];
    var location = userInput['location'];
    var order_type = userInput['order_type'];
    var contactName = userInput['contactName'];
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
            return callback('can not load user data.');
        }
        condition["$and"].push({
            orderType: constant['orderType']['DROPSHIP']
        });
        try {
            if (id) {
                var orcond = [];
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
                orcond.push({
                    "location": {
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
                dropshipModel.findOne(condition).exec(function(err, data) {
                    callback(err, data || {});
                });
            } else if (purchaseOrderNumber || orderStatus || contactName || orderStatus || erpPurchaseOrder || fromDate || toDate || location || vendors || order_type || sku || asnNo || frmQty || toQty || frmPrice || toPrice) {
                var query = JSON.parse('{"isDeleted" : false}');
                if (purchaseOrderNumber) {
                    query['purchaseOrderNumber'] = new RegExp(purchaseOrderNumber, "g");
                }
                if (orderStatus) {
                    query['orderStatus'] = {
                        "$in": orderStatus.split(',')
                    };
                }
                if (location) {
                    query['location'] = { '$in' : location.split(',') };
                }
                if (erpPurchaseOrder) {
                    query['erpPurchaseOrder'] = new RegExp(erpPurchaseOrder, "g");
                }
                if (contactName) {
                    query['contactName'] = new RegExp('^' + contactName + '$', "i");
                }
                var orcond = [];
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
                orcond.push({
                    "location": {
                        "$in": locArray
                    }
                });
                condition["$and"].push({
                    '$or': orcond
                });
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
                var getorder = function() {
                    console.log(query);
                    condition["$and"].push(query);
                    dropshipModel.find(condition, {
                        "purchaseOrderNumber": 1,
                        "numberOfProducts" : 1,
                        "totalPoCost" : 1,
                        "totalPoCostAsn" : 1,
                        "totalPoCostConfirm" : 1
                    }).sort({
                        'lastModified': -1
                    }).exec(function(err, orderData) {
                        advanceSearch( userInput, orderData, function(isAdvSrch, advSrchCond ){
                            if( isAdvSrch == true)
                            {
                                condition["$and"].push(advSrchCond);
                            }
                            dropshipModel.find(condition, {
                                "purchaseOrderNumber": 1
                            }).sort({
                                'lastModified': -1
                            }).exec(function(err, order_data) {
                                var poId_arr = [];
                                dropshipModel.find(condition).count().exec(function(err, total_count) {
                                    dropshipModel.find(condition).sort({
                                        'lastModified': -1
                                    }).skip(page_offset).limit(page_lmt).exec(function(err, order_data) {
                                        callback(err, {
                                            order_data: order_data,
                                            total_count: total_count
                                        });
                                    });
                                });
                            });
                        });
                    });
                };
                if (vendors) {
                    getvendorData({
                        vendors: vendors
                    }, function(err, vendorsorders) {
                        var orders = [];
                        if (vendorsorders && vendorsorders.length) {
                            vendorsorders.forEach(function(sku) {
                                orders.push(sku.purchaseOrderNumber);
                            });
                            query['purchaseOrderNumber'] = {
                                "$in": orders
                            };
                            getorder();
                        } else {
                            callback('no vendors.');
                        }
                    });
                } else {
                    getorder();
                }
            } else {
                var orcond = [];
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
                orcond.push({
                    "location": {
                        "$in": locArray
                    }
                });
                condition["$and"].push({
                    '$or': orcond
                });
                dropshipModel.find(condition).sort({
                    'lastModified': -1
                }).skip(page_offset).limit(page_lmt).exec(function(err, order_data) {
                    var poId_arr = [];
                    for (var num = order_data.length - 1; num >= 0; num--) {
                        poId_arr.push(order_data[num].purchaseOrderNumber);
                    }
                    dropshipModel.find(condition).count().exec(function(err, total_count) {
                        callback(err, {
                            order_data: order_data,
                            total_count: total_count
                        });
                    });
                });
            }
        } catch (e) {
            console.log(e);
            callback('can not load user data.');
        }
    });
}

function createOrder(userInput, callback) {
    var token = utils.uid(6);
    var purchaseNumber = {};
    userInput['purchaseOrderNumber'] = token;
    userInput['createdBy'] = userInput.user.clientId;
    userInput['updatedBy'] = userInput.user.clientId;
    userInput['orderType'] = constant['orderType']['DROPSHIP'];
    if(userInput['PoSubtotal'] === '')
        delete userInput['PoSubtotal'];
    if(userInput['PoSubtotalConfirm'] === '')
        delete userInput['PoSubtotalConfirm'];
    if(userInput['PoSubtotalAsn'] === '')
        delete userInput['PoSubtotalAsn'];
    if(userInput['totalPoCost'] === '')
        delete userInput['totalPoCost'];
    if(userInput['totalPoCostConfirm'] === '')
        delete userInput['totalPoCostConfirm'];
    if(userInput['totalPoCostAsn'] === '')
        delete userInput['totalPoCostAsn'];
    if(userInput['totalPoVAT'] === '')
        delete userInput['totalPoVAT'];
    if(userInput['totalPoTax'] === '')
        delete userInput['totalPoTax'];
    if(userInput['totalPoVATConfirm'] === '')
        delete userInput['totalPoVATConfirm'];
    if(userInput['totalPoTaxConfirm'] === '')
        delete userInput['totalPoTaxConfirm'];
    if(userInput['totalPoVATAsn'] === '')
        delete userInput['totalPoVATAsn'];
    if(userInput['totalPoTaxAsn'] === '')
        delete userInput['totalPoTaxAsn'];
    var order = new dropshipModel(userInput);
    order.save(function(err, data) {
        if (!err && data) {
            // console.log("Data-->"+JSON.stringify(data));
            callback(null, data);
        } else {
            callback(err);
        }
    });
}
/*
 * edit order by id.
 */
function editOrder(id, userInput, callback) {
    userInput['updatedBy'] = userInput.user.clientId;
    delete userInput['orderType'];
    delete userInput['purchaseOrderNumber'];
    if(userInput['PoSubtotal'] === '')
        delete userInput['PoSubtotal'];
    if(userInput['PoSubtotalConfirm'] === '')
        delete userInput['PoSubtotalConfirm'];
    if(userInput['PoSubtotalAsn'] === '')
        delete userInput['PoSubtotalAsn'];
    if(userInput['totalPoCost'] === '')
        delete userInput['totalPoCost'];
    if(userInput['totalPoCostConfirm'] === '')
        delete userInput['totalPoCostConfirm'];
    if(userInput['totalPoCostAsn'] === '')
        delete userInput['totalPoCostAsn'];
    if(userInput['totalPoVAT'] === '')
        delete userInput['totalPoVAT'];
    if(userInput['totalPoTax'] === '')
        delete userInput['totalPoTax'];
    if(userInput['totalPoVATConfirm'] === '')
        delete userInput['totalPoVATConfirm'];
    if(userInput['totalPoTaxConfirm'] === '')
        delete userInput['totalPoTaxConfirm'];
    if(userInput['totalPoVATAsn'] === '')
        delete userInput['totalPoVATAsn'];
    if(userInput['totalPoTaxAsn'] === '')
        delete userInput['totalPoTaxAsn'];
    var order = dropshipModel.findById(id);
    if (order) {
        order.update(userInput, callback);
    } else {
        callback('No order.');
    }
}
/*
 * delete order by orderId.
 */
function deleteOrder(data, callback) {
    editOrder(data.id, {
        isDeleted: true,
        user: data.user
    }, function(err, order) {
        if (order) {
            dropshipItemManager.deletePoOrderSKUs(data, callback);
        } else {
            callback('No order.');
        }
    });
};

function getvendorData(data, callback) {
    dropshipItemManager.getOrderSKUs({
        vendors: data.vendors
    }, function(err, orderSKUs) {
        if (orderSKUs.length) {
            callback('', orderSKUs)
        } else {
            callback('No orderSKUs.');
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
                            callback('unable filter data');
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
                callback (isAdvancedSearch, {'$and' : results})
        });
    } else {
        callback();
    }
}
