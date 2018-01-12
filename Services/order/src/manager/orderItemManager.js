var express = require('express');
var events = require('events');
var log = require('../log');
var utils = require('./utils');
var orderManager = require('./../manager/orderManager');
var orderModel = require('./../model/orderModel');
var Ordertype = require('../../config/Ordertype.json');
var orderItemModel = require('./../model/orderItemModel');
var po_item_quantity_statusModel = require('./../model/po_item_quantity_statusModel');
var constant = require('../../config/const.json');
var env_config = require('../../config/config.js');
var router = express.Router();
var lo = require('lodash');
var eventEmitter = new events.EventEmitter();
var request = require('request');
var async = require('async');
var querystring = require('querystring');
lo.extend(module.exports, {
    getOrderItem: getOrderItem,
    createOrderItem: createOrderItem,
    editOrderItem: editOrderItem,
    deleteOrderItem: deleteOrderItem,
    deletePoOrderItem: deletePoOrderItem,
    checkOrderItems: checkOrderItems,
    copyOrderItem: copyOrderItem,
    checkOrderItem: checkOrderItem,
    bulkInsertQtystatus: bulkInsertQtystatus
});

function getFloat(value) {
    value = parseFloat(value);
    if (Number.isNaN(value))
        return 0;
    else
        return value;
}

/*
 * GET orderItem by id.
 */
function getOrderItem(userInput, callback) {

    var id                  =   userInput['id'];
    var purchaseOrderNumber =   userInput['purchaseordernumber'] || userInput['purchaseOrderNumber'];
    var productStatus       =   userInput['productStatus'];
    var order_data          =   userInput['order_data'];
    var page_offset         =   page_lmt    =   null;

    //setting pagination input params. If nothing set as 0 to get all data 
    if ((userInput['page_offset'] ||  userInput['page_offset'] === 0)&& (userInput['page_lmt'] || userInput['page_lmt'] === 0)) {
        page_offset =   parseInt(userInput['page_offset']) || 0;
        page_lmt    =   parseInt(userInput['page_lmt']) || 10;
    } else {
        page_offset =   0;
        page_lmt    =   0;
    }

    if (id) {
        orderItemModel.findById(id).exec(callback);
    } else if (purchaseOrderNumber || productStatus) {
        var query   =   JSON.parse('{"isDeleted" : false}');
        if (purchaseOrderNumber) {
            query['purchaseOrderNumber'] = purchaseOrderNumber;
        }
        if (productStatus) {
            query['productStatus'] = new RegExp('^' + productStatus + '$', "i");
        }
        // orderItemModel.find(query).exec(callback);
        orderItemModel.count(query).exec(function(err, total_count) {
            orderItemModel.find(query).sort({
                "lineNumber": 1
            }).skip(page_offset).limit(page_lmt).exec(function(err, data) {
                if (err){
                    utils.errorTrace(err);
                    return callback(err);
                }
                var results = {
                    item_data: data,
                    total_count: total_count,
                    order_data: order_data,
                    current_offset: page_offset,
                    page_lmt: page_lmt,
                    order_type: userInput.order_type
                }
                if (userInput.noDescription){
                    callback (err, results);
                }
                else {
                    //function call to add sku desc in the response
                    addSKUdesc(err, results, callback);
                }
            });
        });
    } else {
        return callback('No order data found for order no:',purchaseOrderNumber);
    }
}

function addSKUdesc( err, itemObj, callback) {

    var getProductDetails = function(skuData, product_callback) {
        var obj = {};
        obj['srch']=skuData
        var sku_data = querystring.stringify(obj);
        var options = {
            url: env_config.dashPath + constant.apis.GETALLPRODUCTS,
            method: 'POST',
            body: sku_data,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
        request(options, function(err, response, productData) {
            console.log(env_config.dashPath + constant.apis.GETALLPRODUCTS, obj);
            // console.log(err, data);
            product_callback ? product_callback(err, productData) : '';
        });
    }

    var skus = [];
    var skuWitDesc = [];
    if (itemObj.item_data && itemObj.item_data.length) {
        for (var n = itemObj.item_data.length - 1; n >= 0; n--) {
            skus.push(itemObj.item_data[n].SKU);
        };
        if (skus.length > 0) {
            var skudata = [];
            getProductDetails( skus.join(), function(err, pro_data){
                if (err)
                    utils.errorTrace(err);

                try {
                    skudata = JSON.parse(pro_data);
                    itemObj.item_data = JSON.parse(JSON.stringify(itemObj.item_data));
                }
                catch (e) {
                    utils.errorTrace(e);
                    skudata = [];
                }

                var skuDesc = {};
                for (var i = skudata.length - 1; i >= 0; i--) {
                    var sku_item = skudata[i].ProductTbl;
                    skuDesc[sku_item.sku] = sku_item;
                }

                var skuWitDesc = [];
                for(var sku = 0; sku <= itemObj.item_data.length - 1; sku++) {
                    var itemData = itemObj.item_data[sku];
                    if (skuDesc[itemData.SKU]) {
                        itemData['productCode'] = itemData['productCode'] ? itemData['productCode'] : skuDesc[itemData.SKU].productCode;
                        itemData['description'] = itemData['description'] ? itemData['description'] : skuDesc[itemData.SKU].description;
                        itemData['variants']    = itemData['variants']  ? itemData['variants'] : skuDesc[itemData.SKU].variants;
                        itemData['styleDescription'] = skuDesc[itemData.SKU].styleDescription;
                    }
                    skuWitDesc.push(itemData);
                }
                itemObj.item_data = skuWitDesc;
                callback(err, itemObj);
             
            });
            
        } else {
            callback(err, itemObj);
        }
    }
    else {
        callback(err, itemObj);
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
            utils.errorTrace(e);
        }
    }
    return data;
};
/**********************************************************************************
 * create orderItem.
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *  Ratheesh    24.7.2017        1.0        Round SKU qty.
 *
 **********************************************************************************/
function createOrderItem(userInput, headers, callback) {
    //userInput['purchaseOrderNumber']=parseInt(userInput['purchaseOrderNumber']);
    // var orderItem = new orderItemModel(userInput['arrData']);
    var user = userInput.user;
    try {
        userInput = JSON.parse(userInput.dataObj);
    } 
    catch (ex) {
        utils.errorTrace(ex);
        return callback(ex);
    }
    var purchaseOrderNumber = (userInput['arrData'] && userInput['arrData'][0]) && userInput['arrData'][0]['purchaseOrderNumber'] ? userInput['arrData'][0]['purchaseOrderNumber'] : userInput['purchaseOrderNumber'];
    orderModel.findOne({
        purchaseOrderNumber: purchaseOrderNumber,
        isDeleted: false
    }, function(error, data) {
        if (error) {
            utils.errorTrace(error);
            return callback (error);
        }
        if (data) {
            var orderItemArr = [];
            // orderItemArr = userInput.arrData ? userInput.arrData : orderItemArr.push(userInput);
            if (userInput.arrData) {
                orderItemArr = userInput.arrData;
            }
            else {
                orderItemArr.push(userInput);
            }
            try {
                orderItemArr = JSON.parse(JSON.stringify(orderItemArr));
            }
            catch (e) {
                utils.errorTrace(e);
                return callback(e);
            } 
            async.eachSeries(orderItemArr, function(orderItemData, asynccallback) {
                if(userInput['purchaseOrderNumber'])
                    orderItemData['purchaseOrderNumber'] = userInput['purchaseOrderNumber']
                orderItemData['createdBy'] = user ? user.clientId : '';
                orderItemData['updatedBy'] = user ? user.clientId : '';
                var noArr = ['productCost', 'productTax', 'productVat', 'totalProductCost', 'totalProductTax', 'totalProductVat'];
                orderItemData = delNotNovalue(orderItemData, noArr);
                if (userInput['storeConfig'] && userInput['skuRoundvalue']) {
                    checkReorderqty(userInput['storeConfig'],userInput['skuRoundvalue'],orderItemData,'0');
                }
                orderItemModel.create(orderItemData, function(err, result) {
                    if (err){
                        utils.errorTrace(err);
                    }
                    asynccallback();
                });
            }, function() {
                if (userInput.submitjson) {
                    try {
                        userInput.submitjson = JSON.parse(userInput.submitjson);
                        utils.publishMessage({
                            jsonData: userInput.submitjson,
                            tranType : "PurchaseOrder",
                            type: env_config.JMS_QUEUEPOSUBMIT,
                            header: headers
                        });
                    }
                    catch (e) {
                        utils.errorTrace(e);
                    }
                }
                return callback(null, {status: "success"});
            });
        } else {
            return callback ('No Order found');
        }
    });
}
/*
 * edit orderItem by id.
 */
function editOrderItem(id, userInput, headers, callback) {
    var orderConfirmed = 0;
    var orderShipped = 0;
    var orderReceived = 0;
    var orderStatus = null;
    var orderItem = null;

    var updateArr = []; 
    if (userInput.arrData) {
        updateArr = userInput.arrData;
    }
    else {
        updateArr.push(userInput);
    }
    // if(!updateArr.length) {
    //     updateArr = Object.keys(updateArr).map(function (key) { return updateArr[key]; });
    // }

    async.eachSeries(updateArr, function(updateItemObj, asynccallback) {
        orderItem = orderItemModel.findById(updateItemObj._id);
        if (orderItem) {
            updateItemObj['updatedBy'] = userInput.user.clientId;
            var noArr = ['productCost', 'productTax', 'productVat', 'totalProductCost', 'totalProductTax', 'totalProductVat'];
            updateItemObj = delNotNovalue(updateItemObj, noArr);
                if (userInput['storeConfig'] && userInput['skuRoundvalue']) {
                    checkReorderqty(userInput['storeConfig'],userInput['skuRoundvalue'],updateItemObj,'0');
                }
            orderItem.update(updateItemObj, function(err, data) {
                if(err){
                    utils.errorTrace(err);
                }
                orderItemModel.find({
                    purchaseOrderNumber: updateItemObj.purchaseOrderNumber,
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
                                    purchaseOrderNumber: userInput['arrData'][0]['purchaseOrderNumber']
                                };
                                var dataToInsert = {
                                    orderStatus: orderStatus
                                };
                                orderModel.findOneAndUpdate(query, dataToInsert, {
                                    upsert: true
                                }, function(er, data2) {});
                            }
                        }
                    }
                    // updateNosku(userInput['purchaseOrderNumber'], function() {});
                });
            });
            asynccallback();
        }
    }, function() {
        if (userInput.submitjson) {
            try {
                userInput.submitjson = JSON.parse(userInput.submitjson);
                utils.publishMessage({
                    jsonData: userInput.submitjson,
                    tranType : "PurchaseOrder",
                    type: env_config.JMS_QUEUEPOSUBMIT,
                    header: headers
                });
            }
            catch (e) {
                utils.errorTrace(e);
            }
        }
        return callback(null, {status: "success"});
    });

        
}
/*
 * Ratheesh code.
 */
function updateNosku(purchaseOrder, callback) {
    orderItemModel.count({
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
function deleteOrderItem(data, callback) {
    var orderItem = orderItemModel.findById(data.id);
    orderItem.update({
        isDeleted: true,
        updatedBy: data.user.clientId
    }, function (err, item_data){
        if (err)
            return callback(err);
        try{
            orderItemModel.findOne({_id:data.id}).exec(function(error,orderData){
                if(error){
                    console.log(error);
                }
                if(orderData && orderData.purchaseOrderNumber && orderData.SKU){
                    var poorderItem = po_item_quantity_statusModel.findOne({poId:orderData.purchaseOrderNumber,sku:orderData.SKU});
                    poorderItem.update({
                        isDeleted : true,
                        updatedBy:data.user.clientId
                    },function(err,poItem_data){
                        console.log(poItem_data,"PO-ITEM DATA");
                    });
                }else{
                    console.log('PO_ITEM_QTY_SATUS :PO number & SKU Required');
                }
            });
            
        }catch(e){
            console.log(e,"ERROR");
            callback(e)
        }    

        if (data['page_lmt'] && (data['page_offset'] !== null || ata['page_offset'] !== undefined) && data['purchaseordernumber']) {
            data.purchaseOrderNumber = data.purchaseordernumber;

            recalcOrderData(data, callback);
        }
        else {
            callback(err, item_data);
        }
    });
};

var CreateTranService = function(dataArr, headers, tran_callback) {
    var srch = {
        skus: JSON.stringify(dataArr)
    };
    var formData = querystring.stringify(srch);
    var contentLength = formData.length;
    var options = {
        url: env_config.apiPath + constant.apis.TRANSACTIONSERVICE,
        method: 'PUT',
        body: formData,
        headers: {
            'authorization': headers,
            'Content-Length': contentLength,
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    };
    request(options, function(err, response, data) {
        console.log(env_config.apiPath + constant.apis.TRANSACTIONSERVICE, dataArr);
        console.log(err, data);
        // console.log('asynccallback', data);
        tran_callback ? tran_callback(err, data) : '';
    });
};


/***************************************************************************************
 *
 * FUNCTION:    deleteOrderItem
 *
 * DESCRIPTION: to Delete draft orders.
 *
 * REVISION HISTORY:
 *
 *      Name          Date            Description
 *      ----          ----            -----------
 *       -              -             1st veesion
 *      Arun        03/15/2017        2nd version - added cancel functionality
 *
 ***************************************************************************************/
function deletePoOrderItem(order_data, user, headers, callback) {
    try {
        if (order_data && !(order_data.constructor === Array)) {
            var order_data_arr   =   [];
            order_data_arr.push(order_data);
        }
        else {
            var order_data_arr   =   order_data;
        }
    }
    catch (e) {
        utils.errorTrace(e);
        return callback(e);
    }

    async.eachSeries(order_data_arr, function(data, order_async_callback){

        orderModel.findOne({
            purchaseOrderNumber: data.purchaseOrderNumber,
            orderStatus: { '$in':[constant.status.CANCELLED, constant.status.DRAFT]},
        }).exec(function(err, order) {
            console.log(order);

            if (order) {
                var po_item_data = [];
                orderItemModel.update({
                    purchaseOrderNumber: data.purchaseOrderNumber,
                    isDeleted: false
                }, {
                    isDeleted: (order.orderStatus == constant.status.CANCELLED) ? false : true,
                    updatedBy: user.clientId, 
                    lastModified: new Date() 
                }, {
                    multi: true
                }, function(error, podata) {
                    po_item_quantity_statusModel.find({
                        poId: data.purchaseOrderNumber,
                        qtyStatus: constant.status.DRAFTORDER,
                        isDeleted: false
                    }).exec(function(er, itemqty) {
                        async.forEach(itemqty, function(itemQtyData, item_async_callback) {
                            var toLoc;
                            if (order.markForLocation == '') {
                                toLoc = order.shipToLocation;
                            } else {
                                toLoc = order.markForLocation;
                            }
                            if (order.purchaseOrderType == 'MAN' || order.purchaseOrderType == 'RPL') {
                                var dataobj = {
                                    transtypeid: '',
                                    stocklocationid: '',
                                    asnid: '',
                                    stockUOM: '',
                                    locationid: toLoc,
                                    quantity: itemQtyData.qty,
                                    purchaseOrderNumber: order.purchaseOrderNumber,
                                    purchaseOrderType: order.purchaseOrderType,
                                    cost: itemQtyData.skuCost,
                                    warehouseid: toLoc,
                                    createTran: (order.orderStatus == constant.status.DRAFT || order.orderStatus == constant.status.CANCELLED) ? true : '',
                                    sku: itemQtyData.sku,
                                    // user: user,
                                    directivetype: Ordertype[order.purchaseOrderType]['deleted']
                                };
                                po_item_data.push(dataobj);
                            } else if (order.purchaseOrderType == 'IBT_M') {
                                var dataobj = {
                                    transtypeid: '',
                                    stocklocationid: '',
                                    asnid: '',
                                    locationid: toLoc,
                                    stockUOM: '',
                                    quantity: itemQtyData.qty,
                                    purchaseOrderNumber: order.purchaseOrderNumber,
                                    purchaseOrderType: order.purchaseOrderType,
                                    cost: itemQtyData.skuCost,
                                    warehouseid: toLoc,
                                    createTran: (order.orderStatus == constant.status.DRAFT || order.orderStatus == constant.status.CANCELLED) ? true : '',
                                    sku: itemQtyData.sku,
                                    // user: user,
                                    directivetype: Ordertype[order.purchaseOrderType]['toStore']['deleted']
                                };
                                po_item_data.push(dataobj);
                            } else if (order.purchaseOrderType == 'PUSH') {
                                var dataobj = {
                                    transtypeid: '',
                                    stocklocationid: '',
                                    asnid: '',
                                    locationid: toLoc,
                                    stockUOM: '',
                                    quantity: itemQtyData.qty,
                                    purchaseOrderNumber: order.purchaseOrderNumber,
                                    purchaseOrderType: order.purchaseOrderType,
                                    cost: itemQtyData.skuCost,
                                    createTran: (order.orderStatus == constant.status.DRAFT || order.orderStatus == constant.status.CANCELLED) ? true : '',
                                    warehouseid: toLoc,
                                    sku: itemQtyData.sku,
                                    // user: user,
                                    directivetype: Ordertype[order.purchaseOrderType]['fromStore']['deleted']
                                };
                                po_item_data.push(dataobj);
                            }
                            item_async_callback();
                        }, function() {

                            if( order.orderStatus == constant.status.CANCELLED){

                                po_item_quantity_statusModel.update(
                                    {
                                        poId: data.purchaseOrderNumber,
                                        qtyStatus: constant.status.DRAFTORDER
                                    },
                                    {
                                        qtyStatus: constant.status.CANCELLED,
                                        lastModified: new Date()
                                    },
                                    {multi: true}
                                ).exec(afterUpdate);

                            }

                            else {

                                po_item_quantity_statusModel.remove({
                                    poId: data.purchaseOrderNumber,
                                    qtyStatus: constant.status.DRAFTORDER
                                }).exec(afterUpdate);

                            }

                            function afterUpdate(err, success) {
                                var podata = po_item_data;

                                CreateTranService(podata, headers, function(err, tran_data){
                                    if (err) {
                                        utils.errorTrace(err);
                                        return callback(err);
                                    }
                                    order_async_callback();
                                });

                            }

                        });

                    });
                });
            }

        });
    }, function(){
        callback(null, "Number of Orders affected: "+order_data_arr.length);
    });
}

function checkOrderItems(order_data, headers, callback) {
    async.eachSeries(order_data, function(order, order_async_callback){
        po_item_quantity_statusModel.find({
            poId: order.purchaseOrderNumber,
            isDeleted: false,
            qtyStatus: { '$in': ['submitted','confirmed','unconfirmed']}
        }).exec(function(err, itemqty) {
            if (err) {
                utils.errorTrace(err);
                return callback(err);
            }
            var po_item_data = [];
            async.forEach(itemqty, function(itemQtyData, item_async_callback) {
                var toLoc;
                if (order.markForLocation == '') {
                    toLoc = order.shipToLocation;
                } else {
                    toLoc = order.markForLocation;
                }
                if ((order.purchaseOrderType == 'MAN' || order.purchaseOrderType == 'RPL') && Ordertype['FC_STATUS'].hasOwnProperty(itemQtyData.qtyStatus)){
                    var dataobj = {
                        transtypeid: '',
                        stocklocationid: '',
                        asnid: '',
                        stockUOM: '',
                        locationid: toLoc,
                        quantity: itemQtyData.qty,
                        purchaseOrderNumber: order.purchaseOrderNumber,
                        purchaseOrderType: order.purchaseOrderType,
                        cost: itemQtyData.skuCost,
                        warehouseid: toLoc,
                        createTran: (order.orderStatus == constant.status.DRAFT || order.orderStatus == constant.status.CANCELLED) ? true : '',
                        sku: itemQtyData.sku,
                        // user: user,
                        directivetype: Ordertype['FC_STATUS'][itemQtyData.qtyStatus]
                    };
                    po_item_data.push(dataobj);
                } 
                item_async_callback();
            }, function() {

                var podata = po_item_data;

                CreateTranService(podata, headers, function(err, tran_data){
                    if (err) {
                        utils.errorTrace(err);
                        return callback(err);
                    }
                    order_async_callback();
                });

            });
        });
    }, function(){
         callback(null, 'success');
    });
}

/**********************************************************************************
 *
 * FUNCTION:    checkOrderItem
 *
 * DESCRIPTION: Save item changes automaticlly.
 *
 * PARAMETERS:  page_offset, page_limit, item_data, order_data and callback.
 *
 * RETURNED:    current_offset, page_limit, item_data, order_data.
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         17/07/2017    1.0.0       First Version
 *   Ratheesh     24.7.2017     2.0         Round SKU qty.
 *
 **********************************************************************************/
function checkOrderItem(payload, callback) {

    try {
        var user        =   payload.user;
        payload         =   JSON.parse(payload.data);
        payload.user    =   user;
    }
    catch (e) {
        utils.errorTrace(e);
        return callback(e);
    }

    var orderNumber    =   null;
    var pageOffset     =   0;
    var pageLmt        =   0;
    var itemCount      =   payload['item_count'] ? parseInt(payload['item_count']) : 0;
    var isFileUpload    =   (payload['fileUpload'] === 'true' || payload['fileUpload'] === true);
    if ((payload['page_offset'] !== null || payload['page_offset'] !== undefined)
        && (payload['page_lmt'] !== null || payload['page_lmt'] !== undefined))
    {
        pageLmt    =   parseInt(payload['page_lmt']) || 50;
    }

    //SKU price calculations
    function doItemCalc (itemData) {
        var proPrice    =   getFloat(itemData.purchasePrice);
        var taxVal     =   getFloat(itemData.vatPercentage) / 100;
        var totProCost  =   getFloat(itemData.qty) * proPrice;
        var proTax      =   proPrice * taxVal;
        var totProTax   =   totProCost * taxVal;

        itemData.isVat              =   itemData.isVat;
        itemData.productCost        =   proPrice;
        itemData.totalProductCost   =   totProCost;
        itemData.productTax         =   itemData.isVat === '0' ? proTax : 0;
        itemData.productVat         =   itemData.isVat === '1' ? proTax : 0;
        itemData.totalProductTax    =   itemData.isVat === '0' ? totProTax: 0;
        itemData.totalProductVat    =   itemData.isVat === '1' ? totProTax: 0;
    }

    //updates the existing SKU valuse for the input
    function updateItemData(itemData, newItem, callback) {

        if(newItem.qty < 0){
            newItem.qty    =   0;
        }else if (isFileUpload){
            newItem.qty    =   itemData.qty + parseFloat(newItem.qty); //updating with the existing SKU qty for fileUpload
        }
        //saving the order item data
        itemData    =   lo.extend(itemData, newItem);
        if (payload['storeConfig'] && payload['skuRoundvalue']) {
            checkReorderqty(payload['storeConfig'],payload['skuRoundvalue'],itemData,'0');
        }
        doItemCalc (itemData);
        itemData.save(function (err, data){
            if (err)
                utils.errorTrace(err);
            callback(err, data);
        });
    }

    // Update the existing items with the input values 
    function updateExistingItem (offset, newItem, itemCallback) {

        //Recursion function for find the given SKU's offset
        function checkSKUoffset(offset, newItem) {
            orderItemModel.find({
                purchaseOrderNumber: newItem.purchaseOrderNumber ? newItem.purchaseOrderNumber : orderNumber,
                isDeleted: false
            }).skip(offset).limit(pageLmt).exec(function(err, itemData) {

                if (err){
                    utils.errorTrace(err);
                    return itemCallback();
                }

                var hasSKU   =  false;
                var skuFound =  null;
                for (var i = itemData.length - 1; i >= 0; i--) {
                    if (itemData[i].SKU === newItem.SKU){
                        hasSKU      =   true;
                        skuFound    =   itemData[i];
                    }
                }
                if (hasSKU){

                    if (!isFileUpload)
                        pageOffset = offset; //Setting the SKU's offset

                    updateItemData(skuFound, newItem, function(err, savedItem){
                        if (err) {
                            utils.errorTrace(err);
                        }
                        if (savedItem && payload.qty_status_obj){

                            var qtyObj = {};
                            qtyObj.purchaseOrderType   =   payload.qty_status_obj.purchaseOrderType || "MAN";
                            qtyObj.location            =   payload.qty_status_obj.shipToLocation;
                            if (payload.qty_status_obj.markForLocation)
                                qtyObj.location        =   payload.qty_status_obj.markForLocation;
                            qtyObj.producUom           =   savedItem.producUom;
                            qtyObj.skuCost             =   savedItem.productCost;
                            qtyObj.sku                 =   savedItem.SKU;
                            qtyObj.qty                 =   savedItem.qty;
                            qtyObj.poId                =   savedItem.purchaseOrderNumber ? savedItem.purchaseOrderNumber : orderNumber;
                            qtyObj.qtyStatus           =   "draftOrder";

                            saveItemQtyStatus(qtyObj);
                            itemCallback();
                        }
                    });
                }
                else
                    checkSKUoffset(offset+pageLmt, newItem)
            });
        }
        checkSKUoffset(offset, newItem);

    }

    //Saves new order item
    function saveNewItem(itemData, itemCallback) {
        orderItemModel.findOne({
            purchaseOrderNumber: itemData.purchaseOrderNumber ? itemData.purchaseOrderNumber : orderNumber,
            isDeleted: false
        }).sort({lineNumber: -1}).exec(function(err,data){
            if (data) {
                itemData['lineNumber']  =   data.lineNumber + 1; //Setting the lineNumber +1 with existing max lineNumber
            }
            else {
                itemData['lineNumber']  =   1; //Setting the lineNumber as 1 for for first SKU
            }
            if (!itemData['qty'])
                itemData['qty'] = 1;  //Setting the dfault qty as 1
            if (!itemData['purchaseOrderNumber'])
                itemData['purchaseOrderNumber'] = orderNumber;

            if (payload['storeConfig'] && payload['skuRoundvalue']) {
                checkReorderqty(payload['storeConfig'],payload['skuRoundvalue'],itemData,'0');
            }
            doItemCalc (itemData);

            var itemDataToSave  =   new orderItemModel(itemData);
            itemDataToSave.save(function(err, savedData){
                if (err){
                    utils.errorTrace(err);
                    return itemCallback();
                }
                if (!isFileUpload)
                    pageOffset     =   Math.floor(itemCount/pageLmt) * pageLmt; //calculate page_offset ffor the added SKU
                
                var qtyObj = {};
                if (payload.qty_status_obj) {
                    var qtyObj = {};
                    qtyObj.purchaseOrderType   =   payload.qty_status_obj.purchaseOrderType || "MAN";
                    qtyObj.location            =   payload.qty_status_obj.shipToLocation;
                    if (payload.qty_status_obj.markForLocation)
                        qtyObj.location        =   payload.qty_status_obj.markForLocation;
                    qtyObj.producUom           =   itemData.producUom;
                    qtyObj.skuCost             =   itemData.productCost;
                    qtyObj.sku                 =   itemData.SKU;
                    qtyObj.qty                 =   itemData.qty;
                    qtyObj.poId                =   itemData.purchaseOrderNumber ? itemData.purchaseOrderNumber : orderNumber;
                    qtyObj.qtyStatus           =   "draftOrder";

                    saveItemQtyStatus(qtyObj);
                }

                itemCallback();
            });
        })
    }

    //Iterates through all order items
    function iterateItemData () {
        async.eachSeries(payload.item_data, function(orderItem, asyncCallback){
            var sku                 =   orderItem['SKU'];
            var purchaseOrderNumber    =   orderItem['purchaseOrderNumber'] ? orderItem['purchaseOrderNumber'] : orderNumber;

            orderItemModel.findOne({
                purchaseOrderNumber: purchaseOrderNumber,
                SKU: sku,
                isDeleted: false
            }, function(err, itemData) {
                if (err){
                    utils.errorTrace(err);
                    asyncCallback();
                }
                if (itemData) {
                    updateExistingItem(pageOffset, orderItem, function(){
                        asyncCallback();
                    });
                }
                else {
                    saveNewItem(orderItem, function(){
                        asyncCallback();
                    });
                }
            });

        }, function(){
            if (!payload.purchaseOrderNumber)
                payload.purchaseOrderNumber    =   orderNumber;
            payload.page_offset         =   pageOffset;
            recalcOrderData(payload, callback);
        });
    }

    //Insert new order and iterates item data
    if (payload.order_data) {
        payload.order_data.user = payload.user;
        orderModel.findOne({
            purchaseOrderNumber: payload.purchaseOrderNumber,
            purchaseOrderType: payload.order_data.purchaseOrderType
        }, function(err, order){
            if (order)
                iterateItemData();
            else {
                orderManager.createOrder(payload.order_data, function(err, orderData){

                    if (err){
                        utils.errorTrace(err);
                        return callback(err);
                    }

                    orderNumber = orderData.purchaseOrderNumber;
                    iterateItemData();
                });
            }
        });
            
    }
    //just iterates the Item data
    else if (payload.item_data) {
        iterateItemData();
    }
}

function checkItemQtyStatus(userInput, callback) {
    po_item_quantity_statusModel.findOne({
        poId: userInput.poId,
        qtyStatus: userInput.qtyStatus,
        sku: userInput.sku,
        isDeleted: false
    }).exec(callback);
}

function saveItemQtyStatus (dataToSave) {

    checkItemQtyStatus(dataToSave, function(err, qtyStatusData) {

        if (err)
            console.log("qty_err",err);

        if(!qtyStatusData) {
            qtyStatusData = new po_item_quantity_statusModel(dataToSave);
        }

        qtyStatusData = lo.extend(qtyStatusData, dataToSave);
        qtyStatusData.save(function(err, data){
            console.log('qtyStatusData',err, data);
        });

    });
    
}

function bulkInsertQtystatus (qty_status_data) {
    if (qty_status_data && qty_status_data.length) {
        po_item_quantity_statusModel.create(qty_status_data, function(err, resultData){
            if (err)
                console.log("err", err);
        });
    }
}

function recalcOrderData(payload, callback) {
    var data_to_set = {};
    data_to_set.updatedBy = payload.user ? payload.user.clientId : undefined;
    orderItemModel.aggregate([
        {
            "$match": {
                purchaseOrderNumber: payload.purchaseOrderNumber,
                isDeleted: false
            }
        }, {
            $group: {
                _id: {
                    purchaseOrderNumber: "$purchaseOrderNumber"
                },
                "numberOfProducts": {
                    $sum: "$qty"
                },
                "PoSubtotal": {
                    $sum: "$totalProductCost"
                },
                "totalPoTax": {
                    $sum: "$totalProductTax"
                },
                "totalPoVAT": {
                    $sum: "$totalProductVat"
                },
                count: {
                    $sum: 1
                }
            }
        }
    ]).exec(function(err, item_data){
        if (err){
            utils.errorTrace(err);
            return callback(err);
        }

        if (item_data && item_data.length){
            var totalPoCost = getFloat(item_data[0].PoSubtotal) + getFloat(item_data[0].totalPoTax) + getFloat(item_data[0].totalPoVAT);
            data_to_set.numberOfProducts    =   item_data[0].numberOfProducts;
            data_to_set.numberOfSKU         =   item_data[0].count;
            data_to_set.PoSubtotal          =   item_data[0].PoSubtotal;
            data_to_set.totalPoVAT          =   item_data[0].totalPoVAT;
            data_to_set.totalPoTax          =   item_data[0].totalPoTax;
            data_to_set.totalPoCost         =   totalPoCost;
        }
        else {
            data_to_set.numberOfProducts = data_to_set.numberOfSKU = data_to_set.PoSubtotal = data_to_set.totalPoCost = 0;
            data_to_set.totalPoVAT = data_to_set.totalPoTax  = 0;
        }

        orderModel.findOneAndUpdate({
            purchaseOrderNumber: payload.purchaseOrderNumber,
            isDeleted: false
        }, {
            $set: data_to_set
        },
        {
            new: true
        }, function(err, doc){
            if (err){
                utils.errorTrace(err);
                return callback(err);
            }
            getOrderItem({
                purchaseOrderNumber: payload.purchaseOrderNumber,
                page_offset: payload.page_offset,
                page_lmt: payload.page_lmt,
                order_data : doc,
                isFileUpload: payload.fileUpload
            }, callback);
        });
    });
}


/**********************************************************************************
 *
 * FUNCTION:    checkReorderqty.
 *
 * DESCRIPTION: Round SKU qty.
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *  Ratheesh    24.7.2017        1.0        Round SKU qty.
 *
 **********************************************************************************/
function checkReorderqty(storeConfig, skuRoundvalue, skuData, noskuRoundvalue) {
    try {
        if (storeConfig.replenishmentRoundingQty && skuRoundvalue[skuData.SKU]) {
            if (storeConfig.replenishmentRoundingQty.featureValue && storeConfig.replenishmentRoundingQty.featureValue != noskuRoundvalue) {
                var ext = parseFloat(skuData.qty) % parseFloat(skuRoundvalue[skuData.SKU]);
                if (ext != 0) {
                    if (storeConfig.replenishmentRoundingQty.featureValue == 'up') {
                        skuData.qty = parseFloat(skuData.qty) + (parseFloat(skuRoundvalue[skuData.SKU]) - ext);
                    }
                    if (storeConfig.replenishmentRoundingQty.featureValue == 'down') {
                        skuData.qty = parseFloat(skuData.qty) - ext;
                    }
                }
            }
        }
    } catch (e) {
        utils.errorTrace(e);
    }
    return skuData;
};
/**********************************************************************************
 *
 * FUNCTION:    copyOrderItem
 *
 * DESCRIPTION: copy and saves OrderItems.
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
function copyOrderItem(payload, callback) {
    orderItemModel.find({
        purchaseOrderNumber: payload.existOrder,
        isDeleted: false
    }, {
        _id: 0,
        purchaseOrderNumber: 0,
        createdBy: 0,
        updatedBy: 0,
        created: 0,
        lastModified: 0,
        __v: 0
    }, function (err, itemDataFound){
        if (err)
            return callback(err);
        if (itemDataFound && itemDataFound.length) {
            createOrderItem({
                arrData: itemDataFound,
                user: payload.user,
                purchaseOrderNumber: payload.newOrder,
                orderStatus: 'draft'
            }, null, callback);
        } else {
            return callback(null, []);
        }
    });
}

