var inventoryavailabilityModel = require('./../model/scheduleAtpModel');
var orderModel = require('./../model/orderModel');
var orderItemModel = require('./../model/orderItemModel');
var replenishmentRulesModel = require('./../model/replenishmentRulesModel');
var request = require('request');
var utils = require('./utils');
var constant = require('../../config/const.json');
var env_config = require('../../config/config.js');
var async = require('async');
var deffered = require('q');
var log = require('./../log');
var querystring = require('querystring');
module.exports = {
    getScheduler: getScheduler,
    runReplenishment: runReplenishment,
    start: function() {
        startScheduler();
    }
}

function startScheduler() {
    // console.log("scheduler started.......");
    // var cron = require('node-schedule');
    // var rule = new cron.RecurrenceRule();
    // // Here rule is configured to start a schedule at 12.00.00 AM of every day.
    // rule.dayOfWeek = [1, 2, 3, 4, 5, 6, 0];
    // rule.hour = 00;
    // rule.minute = 00;
    // rule.second = 00;
    // cron.scheduleJob(rule, function() {
    //     checkATP();
    // });
}

// function jmspublish(order, header) {
//     order     =   JSON.stringify(order);
//     var formData    =   querystring.stringify({data: order});
//     var contentLength = formData.length;
//     var options = {
//         url: env_config.apiPath + constant.apis.JMSPUBLISH + env_config.JMS_QUEUEPOSUBMIT,
//         headers: {
//             'authorization': header,
//             'Content-Length': contentLength,
//             'Content-Type': 'application/x-www-form-urlencoded',
//         },
//         body: formData,
//         method: 'POST'
//     };
//     console.log(JSON.stringify(order));
//     console.log(options);
//     request(options, function(err, response, data) {
//         console.log('jmspublish', err, data);
//     });
// }

function runReplenishment(userInput, header, callback) {
    var locationIds = userInput['URLObject']['locName'].split(",");
    delete userInput['URLObject']['locName'];
    getAllVendor(header, function(err, vendor) {
        if (err) callback(err);
        getAllUom(header, function(err, uom) {
            if (err) callback(err);
            var vendorArray = new Array();
            if (vendor) {
                vendorArray = vendor.filter(function(vendorDetails) {
                    return vendorDetails.primarysupplier;
                });
            }
            var vendorId = (vendorArray.length > 0) ? vendorArray[0]._id.toString() : "";
            var vendorName  =   (vendorArray.length > 0) ? vendorArray[0].companyName : "";
            var uomId = '';
            if (uom.length > 0) {
                uomId = uom[0].uomId;
            }
            var numberOfSKUs = 0;
            var locationNo = locationIds.length;
            var resultObj = {};
            resultObj['error'] = [];
            var jmspubData = [];
            async.eachSeries(locationIds, function(location, locationCallback) {
                userInput['URLObject']['locationId'] = userInput['location'] = location;
                if (userInput['skuObject'][userInput['location']]) {
                    userInput['URLObject']['skus'] = userInput['skuObject'][userInput['location']].toString();
                    getSchedulerByLocation(header, userInput, vendorId, vendorName, uomId, 'RPLFilter', function(e, s) {
                        if (s) {
                            numberOfSKUs += s.ok;
                            if (s.jmspub) {
                                jmspubData.push(s.jmspub);
                            }
                        } else {
                            resultObj['error'].push(e);
                        }
                        locationCallback();
                    });
                } else {
                    locationCallback();
                }
            }, function() {
                if (env_config.JMS_QUEUEPOSUBMIT) {
                    jmspubData.forEach(function(order) {
                        // jmspublish(order, header);
                        utils.publishMessage({
                            jsonData: order,
                            tranType : "PurchaseOrder",
                            header: header,
                            type: env_config.JMS_QUEUEPOSUBMIT
                        });
                    });
                } else {
                    console.log('Can not PUBLISH to JMS - JMS_QUEUEPOSUBMIT ');
                }
                resultObj['message'] = resultObj['error'].length == locationNo ? 'Can not Run Replenishment' : 'Replenishment Started Successfully';
                resultObj['numberOfSKUs'] = numberOfSKUs;
                callback(resultObj['error'].length ? resultObj['error'] : null, resultObj);
            });
        });
    });
}

function getScheduler(userInput, header, callback) {
    //console.log('*****');
    //console.log(userInput['location']);
    if (userInput['location']) {
        getAllVendor(header, function(err, vendor) {
            if (err) callback(err);
            getAllUom(header, function(err, uom) {
                if (err) callback(err);
                var vendorId = vendor ? vendor[0]._id.toString() : "";
                var vendorName  =   vendor ? vendor[0].companyName : "";
                var uomId = '';
                if (uom.length > 0) {
                    uomId = uom[0].uomId;
                }
                getSchedulerByLocation(header, userInput, vendorId, vendorName, uomId, 'scheduler', callback);
            });
        });
    } else {
        callback("LocationId is required");
    }
}

function getAllVendor(header, callback) {
    var options = {
        url: env_config.apiPath + constant.apis.GETVENDOR,
        headers: {
            'authorization': header
        }
    };
    request(options, function(error, response, vendordata) {
        try {
            var vendordata = JSON.parse(vendordata);
            callback(error, vendordata);
        }
        catch (e) {
            console.log("ERROR_:",e);
            callback(e);
        }
    });
}

function getAllUom(header, callback) {
    var options = {
        url: env_config.apiPath + constant.apis.GETUOM,
        headers: {
            'authorization': header
        }
    };
    request(options, function(error, response, uomdata) {
        var uomdata = JSON.parse(uomdata);
        callback(error, uomdata);
    });
}

function getconfig(header, userInput, callback) {
    var options = {
        url: env_config.apiPath + constant.apis.GETCONFIG + userInput['location'],
        headers: {
            'authorization': header
        }
    };
    userInput['config'] = {};
    console.log(options);
    request(options, function(error, response, data) {
        try {
            var config_arr = JSON.parse(data);
            config_arr.config_arr.forEach(function(data) {
                if (data.featureValue != null && data.featureValue != "") {
                    var edetail = data.featureValue;
                } else {
                    var edetail = data.defaultValue;
                }
                userInput['config'][data.featureId] = {
                    featureName: data.featureName,
                    featureValue: edetail
                };
            });
            callback('', userInput);
        } catch (err) {
            // var config_arr = {};
            callback('No config.');
        }
    });
}

function getSchedulerByLocation(header, userInput, vendorId, vendorName, uom, action, schedulerCallback) {
    var productData = new Array();
    var jsonData = new Array();
    var locationId = userInput['location'];
    async.series([
        function(callback) {
            var products = [];
            var totalPage = 1;
            var pageLimit = 300;
            var pageArray = [];
            if (action == 'scheduler') {
                var url = env_config.dashPath + constant.apis.GETPRODUCTS + locationId + constant.pagination.PAGE + 1;
            } else if (action == 'RPLFilter') {
                var url = env_config.dashPath + 'apis/replenishmentFiltersProducts' + constant.pagination.PAGE + 1;
            }
            console.log('*********');
            console.log(url);
            var formData = querystring.stringify(userInput['URLObject']);
            var contentLength = formData.length;
            console.log("POST Data " + formData);
            var postDataOptions = {
                headers: {
                    'Content-Length': contentLength,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                uri: url,
                body: formData,
                method: 'POST'
            };
            request.post(postDataOptions, function(error, response, data) {
                try {
                    var data = JSON.parse(data);
                    if (data.status) {
                        console.log('**********');
                        callback(data.message, products);
                    } else {
                        if (data.TotalCount && data.TotalCount.TotalPages) {
                            totalPage = data.TotalCount.TotalPages;
                            iterateProducts(data);
                            //totalPage = 15;
                            for (var i = 2; i <= totalPage; i++) {
                                pageArray.push(i);
                            };
                            pageLimit = products.length;
                            async.forEachLimit(pageArray, 1, function(i, asynccallback) {
                                //async.forEach(pageArray, function (i, asynccallback){ 
                                if (action == 'scheduler') {
                                    var url2 = env_config.dashPath + constant.apis.GETPRODUCTS + locationId + constant.pagination.PAGE + i;
                                } else if (action == 'RPLFilter') {
                                    var url2 = env_config.dashPath + 'apis/replenishmentFiltersProducts' + constant.pagination.PAGE + i;
                                }
                                var postDataOptions1 = {
                                    headers: {
                                        'Content-Length': contentLength,
                                        'Content-Type': 'application/x-www-form-urlencoded'
                                    },
                                    uri: url2,
                                    body: formData,
                                    method: 'POST'
                                };
                                request.post(postDataOptions1, function(error, response, data) {
                                    try {
                                        var data = JSON.parse(data);
                                        if (data.status) {
                                            asynccallback();
                                        } else {
                                            iterateProducts(data);
                                            log.debug("url : " + url2 + " products.lenght now : " + products.length);
                                            asynccallback();
                                        }
                                    } catch (e) {
                                        console.log(error,data);
                                        asynccallback();
                                    }
                                    
                                });
                            }, function(err) {
                                //metohd calls if the iteration complete
                                log.info('Total proudct to apply ReplenishmentEngine is ' + products.length);
                                callback(error, products);
                            });
                        }
                    }
                } catch (e) {
                    console.log(e);
                    schedulerCallback('No Product Data Found for the Location : ' + locationId, {
                        ok: 0
                    });
                }
            });
            var iterateProducts = function(data) {
                console.log('Iterate Products');
                for (var i in data) {
                    if (i != "TotalCount") {
                        products.push(data[i]);
                    }
                }
            }
        }
    ], function(err, result) {
        productData = result[0];
        console.log(productData.length);
        if (productData.length > 0) {
            getconfig(header, userInput, function(error, data) {
                if (error) {
                    schedulerCallback('No config for ' + locationId);
                } else {
                    callReplenishmentEngine(header, userInput, productData, locationId, vendorId, vendorName, uom, schedulerCallback);
                }
            });
        } else {
            console.log('schedulerCallback');
            schedulerCallback('No Product Data Found for the Location : ' + locationId, {
                ok: 0
            });
        }
    });
}
// Get dash Uom Data.
function getUom(baseQtyData) {
    var defer = deffered.defer();
    defer.resolve({
        uom: baseQtyData['replenishmentRoundingUOM'] && baseQtyData['replenishmentRoundingUOM'].featureValue || 'Each',
        baseQty: baseQtyData['replenishmentRoundingBaseQty'] && baseQtyData['replenishmentRoundingBaseQty'].featureValue || 1
    });
    return defer.promise;
}

function getresult(productDataLength, jmspub) {
    var result = {};
    result = {
        ok: productDataLength
    };
    if (jmspub.purchaseOrder && jmspub.purchaseOrder.purchaseOrderItem && jmspub.purchaseOrder.purchaseOrderItem.length)
        result.jmspub = jmspub;
    return result;
}

function callReplenishmentEngine(header, userInput, productData, locationId, vendorId, vendorName, uom, callback) {
    var token = utils.uid(6);
    var orderType = "RPL";
    //Setting draft configuration from client
    var enableReview = ((userInput.enableReview === true) || (userInput.enableReview === 'true')) ? true : false;
    var orderStatus = enableReview ? constant.orderStatus.DRAFT : constant.orderStatus.SUBMITTED;
    var recordsUpdated = 0;
    var PoSubtotal = "0";
    var totalPoCost = "0";
    var totalPoVAT = "0";
    var totalPoTax = "0";
    var totalorder = 0;
    var totalProducts = 0;
    var productDataLength = productData.length;
    var numberOfSKU = 0;
    var orderItemsToSave = [];
    var itemStatusToSave = [];
    var JMSData = {
        purchaseOrder: {
            purchaseOrderItem: [],
            "needByDate": "",
            "shipToLocation": locationId,
            "vendorId": vendorName,
            "poType": orderType,
            "orderStatus": orderStatus,
            "afs": locationId,
        }
    };
    var orderRequest = new orderModel({
        location: locationId,
        parentLocation: productData[0]['ProductTbl']['locationOrGroupId'],
        purchaseOrderNumber: token,
        purchaseOrderDate: new Date(),
        purchaseOrderType: orderType,
        orderStatus: orderStatus,
        shipToLocation: locationId,
        vendorId: vendorId,
        billTo: locationId,
        shippingMethod: constant.shippingMethod,
        createdBy: userInput.user.clientId,
        updatedBy: userInput.user.clientId,
        // numberOfProducts: productData.length
    });
    orderRequest.save();
    JMSData.purchaseOrder.purchaseOrderNumber = orderRequest.purchaseOrderNumber;
    JMSData.purchaseOrder.purchaseOrderDate = orderRequest.purchaseOrderDate.getTime();
    var getfloat = function(f) {
        return parseFloat(f).toFixed(2);
    }
    var purchaseOrder = function(productObj, productDataLength, reOrder, saveOrderItem) {
        console.log('Purchase Order');
        totalorder = totalorder + 1;
        var totalProductCost = 0;
        var totalProductTax = 0;
        var totalProductVat = 0;
        var productCost = 0;
        var Vat = 0;
        var productTax = 0;
        var productVat = 0;
        if (saveOrderItem) {
            if (productObj['ProductPrice']) {
                // Calculating Tax
                Vat = productObj['ProductPrice']['isVAT'];
                productCost = parseFloat(productObj['ProductPrice']['Cost']).toFixed(2);
                totalProductCost = parseFloat(reOrder) * parseFloat(productCost);
                totalProductCost = getfloat(totalProductCost);
                if (productObj['ProductPrice']['isVAT'] == "0") {
                    productTax = productObj['ProductPrice']['percentage'];
                    totalProductTax = parseFloat(totalProductCost) * parseFloat(productTax / 100);
                    totalProductTax = getfloat(totalProductTax);
                }
                if (productObj['ProductPrice']['isVAT'] == "1") {
                    productVat = productObj['ProductPrice']['percentage'];
                    totalProductVat = parseFloat(totalProductCost) * parseFloat(productVat / 100);
                    totalProductVat = getfloat(totalProductVat);
                }
            }
            PoSubtotal = parseFloat(PoSubtotal) + parseFloat(totalProductCost);
            totalPoVAT = parseFloat(totalPoVAT) + parseFloat(totalProductVat);
            totalPoTax = parseFloat(totalPoTax) + parseFloat(totalProductTax);
            // Create Object for Insert Query
            /* Push the data Object to the array which is used to save multiple Order Items in a Single Query*/
            var dataToSaveObject = {};
            dataToSaveObject.lineNumber = parseInt(numberOfSKU) + 1;
            dataToSaveObject.productName = productObj['ProductTbl']['name'];
            dataToSaveObject.shipToLocation = productObj['ProductTbl']['locationOrGroupId'];
            dataToSaveObject.purchaseOrderNumber = token;
            dataToSaveObject.producUom = productObj.uom || uom;
            dataToSaveObject.SKU = productObj['ProductTbl']['sku'];
            dataToSaveObject.productCost = productCost;
            dataToSaveObject.productTax = productTax;
            dataToSaveObject.productVat = productVat;
            dataToSaveObject.isVat = Vat;
            dataToSaveObject.totalProductCost = totalProductCost;
            dataToSaveObject.totalProductTax = totalProductTax;
            dataToSaveObject.totalProductVat = totalProductVat;
            dataToSaveObject.qty = reOrder;
            dataToSaveObject.createdBy = userInput.user.clientId;
            dataToSaveObject.updatedBy = userInput.user.clientId;
            dataToSaveObject.length = parseFloat(productObj['ProductTbl']['length']) || '';
            dataToSaveObject.waist = parseFloat(productObj['ProductTbl']['waist']) || '';
            dataToSaveObject.size = productObj['ProductTbl']['size'];
            dataToSaveObject.styleColor = productObj['ProductTbl']['styleColor'];
            orderItemsToSave.push(dataToSaveObject);
            numberOfSKU++;
            //Constructing object for Auditing transactions
            if (!enableReview) {
                var poItemStatusObj = {};
                poItemStatusObj.purchaseOrderType = orderType;
                // poItemStatusObj.FromLocation        =   '';
                poItemStatusObj.shipToLocation = locationId;
                // poItemStatusObj.markForLocation     =   '';
                poItemStatusObj.producUom = uom;
                poItemStatusObj.skuCost = productCost;
                poItemStatusObj.sku = productObj['ProductTbl']['sku'];
                poItemStatusObj.qty = reOrder;
                poItemStatusObj.poId = token;
                poItemStatusObj.qtyStatus = constant.orderStatus.SUBMITTED;
                itemStatusToSave.push(poItemStatusObj);
                JMSData.purchaseOrder.purchaseOrderItem.push({
                    "lineNumber": dataToSaveObject.lineNumber,
                    "sku": dataToSaveObject.SKU,
                    "qty": dataToSaveObject.qty,
                    "qtyStatus": constant.orderStatus.SUBMITTED
                });
            }
            if (orderItemsToSave.length == 500) {
                console.log('Create Items with 500 Products');
                try {
                    orderItemModel.create(orderItemsToSave);
                    orderItemsToSave = [];
                } catch (err) {
                    console.log('orderItemModel Create');
                    console.log(err);
                }
                //Auditing transactions
                if (!enableReview) {
                    // Create po item status object
                    //save part of records here to reduce system load
                    // if(itemStatusToSave.length == 500){
                    var reqObj = {};
                    reqObj.arrData = JSON.stringify(itemStatusToSave);
                    var formData = querystring.stringify(reqObj);
                    var optionsData = {
                        url: env_config.apiPath + constant.apis.SAVETRANSACTIONS,
                        method: 'PUT',
                        body: formData,
                        headers: {
                            'authorization': header,
                            'Content-Type': 'application/x-www-form-urlencoded',
                        }
                    };
                    itemStatusToSave = [];
                    request(optionsData, function(err, data) {
                        if (data) {
                            try {
                                //Error validation in try block
                                var dataObj = JSON.parse(data['body']);
                                if (dataObj && (!dataObj.error)) {
                                    console.log("Successfully created transactions");
                                } else {
                                    console.log("Error in creating transactions");
                                }
                            } catch (ex) {
                                console.log("Error in creating transactions", ex);
                            }
                        }
                    });
                    // }
                }
            }
        }
        console.log('totalorder : ' + totalorder + ' productDataLength : ' + productDataLength);
        if (totalorder == productDataLength) {
            var totalPo = parseFloat(PoSubtotal) + parseFloat(totalPoTax);
            totalPoTax = getfloat(totalPoTax);
            totalPoVAT = getfloat(totalPoVAT);
            orderRequest.PoSubtotal = PoSubtotal;
            orderRequest.totalPoCost = parseFloat(totalPo).toFixed(2);
            orderRequest.totalPoVAT = totalPoVAT;
            orderRequest.totalPoTax = totalPoTax;
            orderRequest.numberOfProducts = totalProducts;
            orderRequest.numberOfSKU = numberOfSKU;
            var daysForNeedbydate=userInput['config'][constant.daysForNeedbydate] ? parseFloat(userInput['config'][constant.daysForNeedbydate]['featureValue']) : '';
            if (!enableReview&&daysForNeedbydate) {
                var today=new Date();
                today.setDate(today.getDate()+daysForNeedbydate);
                orderRequest.needByDate = today.getTime();
                JMSData.purchaseOrder.needByDate = orderRequest.needByDate;
            }
            orderRequest.save();
            /* Save Order Item Object in a single Query */
            if (orderItemsToSave.length > 0) {
                console.log('Create Items with Remaining Products');
                try {
                    orderItemModel.create(orderItemsToSave);
                } catch (err) {
                    console.log('orderItemModel Create');
                    console.log(err);
                }
            }
            if (!enableReview) {
                //save part of records here to reduce system load
                if (itemStatusToSave.length > 0) {
                    var reqObj = {};
                    reqObj.arrData = JSON.stringify(itemStatusToSave);
                    var formData = querystring.stringify(reqObj);
                    var optionsData = {
                        url: env_config.apiPath + constant.apis.SAVETRANSACTIONS,
                        method: 'PUT',
                        body: formData,
                        headers: {
                            'authorization': header,
                            'Content-Type': 'application/x-www-form-urlencoded',
                        }
                    };
                    request(optionsData, function(err, data) {
                        if (data) {
                            //Error validation in try block
                            try {
                                var dataObj = JSON.parse(data['body']);
                                if (dataObj && (!dataObj.error)) {
                                    console.log("Successfully created transactions");
                                } else {
                                    console.log("Error in creating transactions");
                                }
                            } catch (ex) {
                                console.log("Error in creating transactions", ex);
                            }
                        }
                    });
                }
            }
            if (numberOfSKU == 0) {
                console.log('No SKU to the Order.');
                orderRequest.remove();
            }
            callback(null, getresult(productDataLength, enableReview ? '' : JMSData));
        }
    };
    /* Getting Rules for Replenishment Engine */
    try {
        console.log("URL_:", env_config.dashPath + constant.apis.GETPARENTLOC + locationId);
        request(env_config.dashPath + constant.apis.GETPARENTLOC + locationId, function(err, response, loc_data) {
            if (err || loc_data.status === 'error') {
                callback("Could not load user location data");
            } else {
                try {
                    var loc = JSON.parse(loc_data);
                    var locArray = [];
                    Object.keys(loc).forEach(function(n) {
                        locArray.push(n);
                        locArray = locArray.concat(loc[n]);
                    });
                    log.debug("url : " + env_config.dashPath + constant.apis.GETPARENTLOC + locationId);
                    replenishmentRulesModel.find({
                        locationId: {
                            '$in': locArray
                        }
                    }, function(err, replenishmentRulesRecords) {
                        if (err) callback(err);
                        if (!err && replenishmentRulesRecords) {
                            var rplRulesSku = {};
                            replenishmentRulesRecords.forEach(function(rplRulesDetails) {
                                if (rplRulesDetails.sku) {
                                    if (!rplRulesSku[rplRulesDetails.sku]) {
                                        rplRulesSku[rplRulesDetails.sku] = {};
                                        rplRulesSku[rplRulesDetails.sku] = rplRulesDetails;
                                    }
                                    if (locArray.indexOf(rplRulesSku[rplRulesDetails.sku].locationId) > 0 && locArray.indexOf(rplRulesSku[rplRulesDetails.sku].locationId) > locArray.indexOf(rplRulesDetails.locationId)) {
                                        rplRulesSku[rplRulesDetails.sku] = rplRulesDetails;
                                    }
                                    if (rplRulesSku[rplRulesDetails.sku].locationId == locationId) {
                                        rplRulesSku[rplRulesDetails.sku] = rplRulesDetails;
                                    }
                                }
                            });
                            // Getting ATP Values for SKU from ProductData
                            var skuArray = new Array();
                            productData.forEach(function(productDataDetails) {
                                skuArray.push(productDataDetails['ProductTbl']['sku']);
                            });
                            // Getting ATP Values for All Skus in a single Query
                            inventoryavailabilityModel.find({
                                balanceType: userInput['config'][constant.replenishmentReorderType] ? userInput['config'][constant.replenishmentReorderType]['featureValue'] : 'atp',
                                locationId: locationId,
                                sku: {
                                    $in: skuArray
                                }
                            }, function(err, inventoryData) {
                                if (!err) {
                                    var atpDataObject = {};
                                    if (inventoryData.length > 0) {
                                        inventoryData.forEach(function(inventoryDataDetails) {
                                            atpDataObject[inventoryDataDetails.sku] = inventoryDataDetails.value;
                                        });
                                    }
                                    // Assign the ATP values for corresponding sku 
                                    var atpData = {};
                                    //Reduces the number of usage of Object.keys inside loop
                                    var skuCheckArr = Object.keys(atpDataObject);
                                    productData.forEach(function(productObj) {
                                        var reOrderAmount = 0;
                                        totalValue = 0;
                                        if (skuCheckArr.indexOf(productObj['ProductTbl']['sku']) != -1) {
                                            totalValue = parseInt(atpDataObject[productObj['ProductTbl']['sku']]);
                                        }
                                        // Calculate Reorder Amount based on the Replenishment Rules
                                        var replenishmentRulesData = rplRulesSku[productObj['ProductTbl']['sku']];
                                        var reorder = 0;
                                        var maxOrder = 0;
                                        var minOrder = 0;
                                        var orderQuantityRounding = '';
                                        var roundingValue = 0;
                                        var saveOrderItem = false;
                                        if (replenishmentRulesData) {
                                            // Assign Values to use 
                                            reorder = replenishmentRulesData['reorder'] ? parseInt(replenishmentRulesData['reorder']) : 0;
                                            maxOrder = replenishmentRulesData['maxOrder'] ? parseInt(replenishmentRulesData['maxOrder']) : 0;
                                            minOrder = replenishmentRulesData['minOrder'] ? parseInt(replenishmentRulesData['minOrder']) : 0;
                                            orderQuantityRounding = replenishmentRulesData['orderQuantityRounding'] ? replenishmentRulesData['orderQuantityRounding'] : '';
                                            roundingValue = replenishmentRulesData['roundingValue'] ? parseInt(replenishmentRulesData['roundingValue']) : 0;
                                        }
                                        if (totalValue < reorder) {
                                            saveOrderItem = true;
                                            reOrderAmount = Math.abs((reorder - (totalValue < 0 ? 0 : totalValue)));
                                            if (userInput['config'][constant.replenishmentRounding]) {
                                                var noskuRoundvalue = '0';
                                                console.log(userInput['config'][constant.replenishmentRounding].featureValue, reOrderAmount);
                                                console.log(roundingValue);
                                                var ext;
                                                if (userInput['config'][constant.replenishmentRounding].featureValue != noskuRoundvalue&& roundingValue) {
                                                    ext = reOrderAmount % roundingValue;
                                                    if (ext != 0) {
                                                        if (constant.replenishmentRoundingValues[userInput['config'][constant.replenishmentRounding].featureValue] == constant.replenishmentRoundingValues['up']) {
                                                            reOrderAmount = reOrderAmount + (roundingValue - ext);
                                                        } else {
                                                            reOrderAmount = reOrderAmount - ext;
                                                        }
                                                    }
                                                }
                                                if (reOrderAmount) {
                                                    saveOrderItem = true;
                                                } else {
                                                    saveOrderItem = false;
                                                }
                                                purchaseOrder(productObj, productDataLength, reOrderAmount, saveOrderItem);
                                            } else {
                                                totalProducts = totalProducts + reOrderAmount;
                                                purchaseOrder(productObj, productDataLength, reOrderAmount, saveOrderItem);
                                            }
                                        } else {
                                            purchaseOrder(productObj, productDataLength, reOrderAmount, saveOrderItem);
                                        }
                                    });
                                }
                            });
                        }
                    });
                } catch (e) {
                    console.log("Error_:", e);
                    callback("Could not load user location data");
                }
            }
        });
    } catch (err) {
        console.log(err);
        callback(null, getresult(productDataLength, enableReview ? '' : JMSData));
    }
}