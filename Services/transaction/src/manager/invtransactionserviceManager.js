/* 
Modifed by Ram
Date : 14-oct-2015
*/
var express = require('express');
var async = require('async');
var log = require('../log');
var request = require('request');
var querystring = require('querystring');
var inventoryavailabilityModel = require('./../model/inventoryavailabilityModel');
var transactionruleModel = require('./../model/transactionruleModel');
var transactionModel = require('./../model/transactionModel');
var transactionitemModel = require('./../model/transactionitemModel');
var transactioniteminventoryModel = require('./../model/transactioniteminventoryModel');
var documenttypeModel = require('./../model/documenttypeModel');
var transactionTypeModel = require('./../model/transactiontypeModel');
var documentrulemodel = require('./../model/documentruleModel');
var router = express.Router();
var config = require('../../config/const.json');
var deffered = require('q');
var lo = require('lodash');
var envConfig = require('../../config/config.js');
var utils = require('./utils');
module.exports = {
    createInvtransactionservice: createInvtransactionService,
    getInventories: getInventories,
    generateStoreJson: generateStoreJson,
    generateStockLocJson: generateStockLocJson,
    generateStocklookupJson: generateStocklookupJson,
    getChildLocation: getChildLocation,
    getLocation: getLocation,
    getInventoryReports: getInventoryReports
};

function canParseJson(data) {
    if (/^[\],:{}\s]*$/.test(data.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
        //the json is ok
        return true;
    } else {
        //the json is not ok
        return false;
    }
}

function getChildLocation(userInput, inv_callback) {
    var locationid = userInput['locationid'];
    var locationArray = [];
    if (locationid) {
        async.series(
            [
                function(callback) {
                    //To get child locations
                    console.log("URL:",envConfig.dashPath + config.apis.GETCHILDLOCATIONS + locationid);
                    request(envConfig.dashPath + config.apis.GETCHILDLOCATIONS + locationid, function(err, data) {
                        callback(err, data.body);
                    });
                }
            ],
            function(err, results) {
                if (err) {
                    inv_callback(err);
                }
                var data = results[0];
                if (canParseJson(data)) {
                    //the json is ok
                    var dataObj = JSON.parse(data);
                    if (dataObj.locations) {
                        locationArray = dataObj.locations;
                    }
                    inv_callback(err, locationArray);
                } else {
                    //the json is not ok
                    inv_callback(config.label.ERROR + data);
                }
            });
    }
}

function getLocation(loc, inv_callback) {
    async.series(
        [
            function(callback) {
                //To get child locations
                request(envConfig.dashPath + config.apis.GETLOCATIONS + loc, function(err, data) {
                    callback(err, data.body);
                });
            }
        ],
        function(err, results) {
            if (err) {
                inv_callback(err);
            }
            var data = results[0];
            if (canParseJson(data)) {
                //the json is ok  
                var dataObj = JSON.parse(data);
                if (dataObj.locations) {
                    dataObj = dataObj.locations;
                }
                inv_callback(err, dataObj);
            } else { //the json is not ok
                inv_callback(config.ERROR + data);
            }
        });
}

function getInventories(userInput, locationArrayObj, inv_callback) {
    var locationid = userInput['locationid'];
    var countItemData = userInput['CountSKUData'];
    var sku = userInput['sku'];
    var fromDate = userInput['fromdate'];
    var toDate = userInput['todate'];
    var locationArray = [];
    var condition = {};
    condition["$and"] = [];
    var groupCond = {};
    if (locationid && locationid != 'noLocation') {
        // To Get locations
        if (locationArrayObj) {
            for (var i = locationArrayObj.length - 1; i >= 0; i--) {
                locationArray.push(locationArrayObj[i].id);
            };
        }
        locationArray.push(locationid);
        if (sku) {
            var query = {};
            sku = sku.toString();
            var skuArray = sku.split(',');
            condition["$and"] = [];
            condition["$and"].push({
                "locationId": {
                    "$in": locationArray
                }
            });
            condition["$and"].push({
                "sku": {
                    "$in": skuArray
                }
            });

            if (fromDate || toDate) {
                if (fromDate && toDate) {
                    toDate = new Date(toDate);
                    toDate = toDate.toISOString();
                    fromDate = new Date(fromDate);
                    fromDate = fromDate.toISOString();
                    if (fromDate != toDate) {
                        query['created'] = {
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
                        query['created'] = {
                            '$gte': new Date(fromDate),
                            '$lte': new Date(toDate)
                        };
                    }
                } else if (toDate) {
                    toDate = new Date(toDate);
                    toDate = toDate.toISOString();
                    query['created'] = {
                        '$lte': new Date(toDate)
                    };
                } else {
                    fromDate = new Date(fromDate);
                    fromDate = fromDate.toISOString();
                    query['created'] = {
                        '$gte': new Date(fromDate)
                    };
                }
                condition["$and"].push(query);
            }

        } else {
            condition["locationId"] = {
                "$in": locationArray
            };
        }
        groupCond = {
            "balanceType": "$balanceType",
            "sku": "$sku"
        }

        condition["$and"].push({
            "stockLocation": ''
        });

    } else if (locationid == 'noLocation') {
        condition = {};
        var loc_arr = [];
        var sku_arr = [];
        // {
        //     _id: 
        //         { sku: '300022349',
        //             countId: 1000,
        //             lastModified: '2016-01-11T06:29:42.539Z' 
        //         },
        //     countId: { name: 'Test Count' },
        //     storeId: { locationId: 'OvcStore' },
        //     qty: [ 10 ],
        //     oh: [ 0 ],
        //     count: 1 
        // }
        // async.waterfall([
        //     function(inv_callback){
        //         for (var num = countItemData.length - 1; num >= 0; num--) {
        //             loc_arr.push(countItemData[num].storeId.locationId);
        //             sku_arr.push(countItemData[num]._id.sku);
        //         }
        //         inv_callback(null, loc_arr, sku_arr);
        //     },
        //     function(arg1, arg2, inv_callback){
        //         // arg1 now equals 'one' and arg2 now equals 'two'
        //         callback(null, 'three');
        //     },
        //     function(arg1, callback){
        //         // arg1 now equals 'three'
        //         callback(null, 'done');
        //     }
        // ], function (err, result) {
        //    // result now equals 'done'    
        // });
        var getLocSku = function(countSkuData, fun_callback) {
            for (var num = countSkuData.length - 1; num >= 0; num--) {
                loc_arr.push(countSkuData[num].storeId.locationId);
                sku_arr.push(countSkuData[num]._id.sku);
            }
            fun_callback(loc_arr, sku_arr);
        }
        getLocSku(countItemData, function(locArr, skuArr) {
            if (!condition["$and"]) condition["$and"] = [];
            condition["$and"].push({
                "locationId": {
                    "$in": locArr
                }
            });
            condition["$and"].push({
                "sku": {
                    "$in": skuArr
                }
            });
            condition["$and"].push({
                "balanceType": {
                    "$in": ["oh"]
                }
            });
        });
        groupCond = {
            "balanceType": "$balanceType",
            "sku": "$sku",
            "locationId": "$locationId"
        }
    } else {
        inv_callback("locationId should not empty");
    }
    inventoryavailabilityModel.aggregate({
        $match: condition
    }, {
        $group: {
            _id: groupCond,
            "docs": {
                "$first": {
                    "balanceType": "$balanceType",
                    "sku": "$sku"
                }
            },
            "storevalue": {
                "$push": {
                    "locationId": "$locationId",
                    "value": "$value",
                    "sku": "$sku",
                    "balanceType": "$balanceType",
                    "warehouseId": "$warehouseId",
                    "stockLocation": "$stockLocation"
                }
            }
        }
    }).exec(inv_callback);
}

function getInventoryReports(userInput, callback) {
    var storeId = userInput['storeId'],
        fromDate = userInput['fromdate'],
        toDate = userInput['todate'],
        // query           =   JSON.parse('{"isDeleted" : false}'),
        report_action = userInput['report_action'];
    var tmp = {};
    var locArray = [];
    var page_offset = 0;
    var page_lmt = 0;
    if (userInput['page_offset'] && userInput['page_lmt']) {
        page_offset = parseInt(userInput['page_offset']) || 0;
        page_lmt = parseInt(userInput['page_lmt']) || 10;
    }
    console.log('url', envConfig.dashPath + config.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId);
    request(envConfig.dashPath + config.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId, function(err, response, data) {
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
        if (!storeId || storeId == '' || storeId === undefined) {
            if (!tmp.$and) tmp.$and = [];
            tmp.$and.push({
                locationId: {
                    '$in': locArray
                }
            });
        }
        if (storeId && storeId != '') {
            if (!tmp.$and) tmp.$and = [];
            tmp.$and.push({
                locationId: {
                    '$in': storeId.split(',')
                }
            });
        }
        if (((fromDate && fromDate != '') || (toDate && toDate != '')) && (report_action === 'negativeInventory')) {
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
            tmp.$and.push({
                lastModified: date_range
            });
        }
        if (report_action === 'lowInventory') {
            var invLimit = userInput['invlimit'] || 50;
            fromDate = toDate = ''; //Do not check the dates here
            if (!tmp.$and) tmp.$and = [];
            tmp.$and.push({
                balanceType: {
                    '$in': ['oh']
                }
            });
            var search_cond = {
                $match: tmp
            };
            inventoryavailabilityModel.aggregate([
                search_cond, {
                    "$group": {
                        "_id": {
                            "sku": "$sku",
                            "balanceType": "$balanceType"
                        },
                        "invCount": {
                            "$push": "$value"
                        }
                    }
                }, {
                    "$group": {
                        "_id": "$_id.sku",
                        "inventory": {
                            "$push": {
                                "balanceType": "$_id.balanceType",
                                "count": "$invCount"
                            },
                        },
                        "count": {
                            "$sum": "$invCount"
                        }
                    }
                }, {
                    "$sort": {
                        "count": -1
                    }
                }, {
                    "$limit": parseInt(invLimit)
                }
            ]).exec(callback);
        }
        if (report_action === 'negativeInventory') {
            if (!tmp.$and) tmp.$and = [];
            tmp.$and.push({
                value: {
                    '$lt': 0
                }
            });
            var search_cond = tmp;
            var result = {};
            inventoryavailabilityModel.find(search_cond).count().exec(function(err, totalCount) {
                result.totalCount = totalCount;
                inventoryavailabilityModel.find(search_cond).sort({
                    'value': 1
                }).skip(page_offset).limit(page_lmt).exec(function(err, invData) {
                    result.inventoryData = invData;
                    callback(err, result);
                });
            });
        }
    });
}

function generateStoreJson(data, location, isStockLoc) {
    var result = new Array();
    var skus = {};
    var locId = isStockLoc ? 'stockLocation' : 'locationId';
    console.log("locId___:",locId);
    //group by sku and sum the balanceTypeValue from each location
    Object.keys(data).forEach(function(i) {
        var skuvalue = {};
        var dataObj = data[i];
        var balanceType = dataObj._id.balanceType;
        var sku = dataObj._id.sku;
        if (!skus[sku]) {
            skus[sku] = {};
        }
        skuvalue = skus[sku] == undefined ? {} : skus[sku];
        if (dataObj.storevalue) {
            var balanceTypeValue = 0;
            Object.keys(dataObj.storevalue).forEach(function(j) {
                balanceTypeValue = parseFloat(balanceTypeValue + parseFloat(dataObj.storevalue[j].value));
            });
            var balanceTypeStorevalue = dataObj.storevalue;
            if (skuvalue[balanceType] && skuvalue[balanceType][value] != '') {
                skuvalue[balanceType][value] += balanceTypeValue;
                skuvalue[balanceType][storevalue].push(dataObj.storevalue);
            } else {
                skuvalue[balanceType] = {
                    value: balanceTypeValue,
                    storevalue: balanceTypeStorevalue
                };
            }
        }
        skus[sku] = skuvalue;
    });
    calcwac(skus);
    //generate new json with all balanceType and store level data.
    Object.keys(skus).forEach(function(sku) {
        var resultObj = {};
        var storeValueArray = [];
        var balanceTypeObj = skus[sku];
        Object.keys(balanceTypeObj).forEach(function(j) {
            //asign balance type
            resultObj[j] = balanceTypeObj[j].value ? balanceTypeObj[j].value : 0;
            if (storeValueArray) {
                storeValueArray = storeValueArray.concat(balanceTypeObj[j].storevalue);
            } else {
                storeValueArray = storeValueArray.concat(balanceTypeObj[j].storevalue);
            }
        });
        //Group by location
        var locations = {};
        Object.keys(storeValueArray).forEach(function(k) {
            var locationvalue = {};
            var storevalueObj = storeValueArray[k];
            if (!locations[storevalueObj[locId]]) {
                locations[storevalueObj[locId]] = {};
            }
            locationvalue = locations[storevalueObj[locId]] == undefined ? {} : locations[storevalueObj[locId]];
            if (storevalueObj.value && storevalueObj.balanceType) {
                locationvalue[storevalueObj.balanceType] = storevalueObj.balanceType == config.invtransaction_type.WEIGHT_AVG_COST ? parseFloat(storevalueObj.value || 0).toFixed(2) : parseFloat(storevalueObj.value);
            }
            locations[storevalueObj[locId]] = locationvalue;
        });
        //add all the empty location and invtypes
        var invtypes = config.invtransaction_type;
        for (var i = location.length - 1; i >= 0; i--) {
            if (locations[location[i].id]) {
                Object.keys(invtypes).forEach(function(k) {
                    if (!locations[location[i].id][invtypes[k]]) {
                        locations[location[i].id][invtypes[k]] = 0;
                    }
                });
            } else {
                var invtypeobj = {};
                Object.keys(invtypes).forEach(function(k) {
                    invtypeobj[invtypes[k]] = 0;
                });
                locations[location[i].id] = invtypeobj;
            }
        };
        var locationArray = [];
        for (var x in locations) {
            if (Object.prototype.hasOwnProperty.call(locations, x)) {
                var obj = {};
                obj = locations[x];
                var name = loadLocationName(location, x);
                // obj.locationid = name ? name : x;
                obj.locationdisplayName = name ? name : '';
                obj.locationid = x;
                locationArray.push(obj);
            }
        }
        storeValueArray = locationArray;
        resultObj["sku"] = sku;
        resultObj["storevalue"] = storeValueArray;
        result.push(resultObj);
    });
    return result;
}

function generateStocklookupJson(data, location) {
    var result = new Array();
    var skus = {};
    //group by sku and sum the balanceTypeValue from each location
    Object.keys(data).forEach(function(n) {
        var skuvalue = {};
        var dataObj = data[n];
        var balanceType = dataObj._id.balanceType;
        var sku = dataObj._id.sku;
        if (!skus[sku]) {
            skus[sku] = {};
        }
        skuvalue = skus[sku] == undefined ? {} : skus[sku];
        if (dataObj.storevalue) {
            var balanceTypeValue = 0;
            Object.keys(dataObj.storevalue).forEach(function(j) {
                balanceTypeValue = parseFloat(balanceTypeValue + parseFloat(dataObj.storevalue[j].value));
            });
            var balanceTypeStorevalue = dataObj.storevalue;
            if (skuvalue[balanceType] && skuvalue[balanceType][value]) {
                skuvalue[balanceType][value] += balanceTypeValue;
                skuvalue[balanceType][storevalue].push(dataObj.storevalue);
            } else {
                skuvalue[balanceType] = {
                    value: balanceTypeValue,
                    // storevalue: balanceTypeStorevalue
                };
            }
        }
        skus[sku] = skuvalue;
    });
    // calcwac(skus);
    return skus;
}
//Ratheesh : code for calc wac.
function calcwac(data) {
    Object.keys(data).forEach(function(sku) {
        var balanceTypeObj = data[sku];
        var wacObj = {};
        if (balanceTypeObj[config.invtransaction_type.WEIGHT_AVG_COST] && balanceTypeObj[config.invtransaction_type.ON_HAND]) {
            var value = parseFloat(balanceTypeObj[config.invtransaction_type.WEIGHT_AVG_COST].value);
            var storevalue = balanceTypeObj[config.invtransaction_type.WEIGHT_AVG_COST].storevalue;
            var ohvalue = parseFloat(balanceTypeObj[config.invtransaction_type.ON_HAND].value);
            var totalvalue = parseFloat(0);
            var ohstorevalue = balanceTypeObj[config.invtransaction_type.ON_HAND].storevalue;
            // var storeLength = 0;
            Object.keys(storevalue).forEach(function(v) {
                // parseFloat(storevalue[v].value) > 0 ? storeLength++ : '';
                wacObj[storevalue[v].locationId] = {};
                wacObj[storevalue[v].locationId].wac = parseFloat(storevalue[v].value);
            });
            Object.keys(ohstorevalue).forEach(function(v) {
                // parseFloat(ohstorevalue[v].value) > 0 ? storeLength++ : '';
                if (wacObj[ohstorevalue[v].locationId]) {
                    totalvalue = totalvalue + (wacObj[ohstorevalue[v].locationId].wac * parseFloat(ohstorevalue[v].value));
                }
            });
            totalvalue = totalvalue || 0;
            ohvalue = ohvalue || 0;
            if(ohvalue < 0){
                ohvalue = 0;
            }
            // value = value / storeLength;
            if (totalvalue == 0 || ohvalue == 0) {
                // value = 0;
                balanceTypeObj[config.invtransaction_type.WEIGHT_AVG_COST].value = value;
            } else {
                value = parseFloat(totalvalue / ohvalue);
                balanceTypeObj[config.invtransaction_type.WEIGHT_AVG_COST].value = value.toFixed(2);
            }
        }
    });
}
//Ratheesh : code for calc wac. stop.
function loadLocationName(location, id) {
    for (var i = location.length - 1; i >= 0; i--) {
        if (id == location[i].id) {
            return location[i].displayName;
        }
    }
}
// Get StockLoc for a SKU.
// Created by : Ratheesh.
// Updated by: Arun
function generateStockLocJson(userInput, result) {
    var defer = deffered.defer();
    var locationid = userInput['locationid'];
    var options = {
        url: envConfig.apiPath + config.apis.GETSTOCKINGLOCATIONS + locationid,
        headers: {
            'authorization': userInput.header
        }
    };
    console.log('url', options);
    request(options, function(err, response, data) {
        try {
            console.log(err, data);
            if (data) {
                var stockloc = JSON.parse(data);
                var locArray = {};
                var condition = {};
                lo.forEach(stockloc, function(loc) {
                    locArray[loc.stockingLocationId] = loc;
                });
                var getData = function(data, callback) {
                    var isStockLoc = true;
                    var stockLocationresult = generateStoreJson(data, locArray, isStockLoc);
                    if (stockLocationresult.length){
                        try {
                            var addnullstorevalue = function(storestockvalue) {
                                lo.keys(locArray).forEach(function(loc) {
                                    // if (!locArray[loc].hasOwnProperty('parentStockingLocationId')) {
                                    //     console.log("RESULT_____:",stockLocationresult[0]['oh']);
                                    //     locArray[loc]['oh'] = stockLocationresult[0]['oh']
                                    //     result[0].storestockvalue.push(locArray[loc]);
                                    //     locArray[loc]['parentLocationId'] = 0;
                                    // }
                                    // else if (!storestockvalue.hasOwnProperty(loc)) {
                                    //     locArray[loc]['parentLocationId'] = locArray[loc]['parentStockingLocationId'];
                                    //     var nullstorevalue = {
                                    //         oh: 0
                                    //     };
                                    //     result[0].storestockvalue.push(lo.extend(nullstorevalue, locArray[loc]));
                                    // }
                                    if (!storestockvalue.hasOwnProperty(loc)) {
                                        var nullstorevalue = {
                                            oh: 0,
                                            allocated: 0,
                                            reserved: 0,
                                            held: 0,
                                            returnToVendor: 0
                                        };
                                        result[0].storestockvalue.push(lo.extend(nullstorevalue, locArray[loc]));
                                    }
                                    
                                });
                            }
                            var storestockvalue = {};
                            stockLocationresult[0].storevalue.forEach(function(store) {
                                storestockvalue[store.locationid] = store;
                                lo.extend(store, locArray[store.locationid] || {});
                            });
                            result[0].storestockvalue = stockLocationresult[0].storevalue;
                            if (lo.keys(locArray).length != lo.keys(storestockvalue).length) {
                                addnullstorevalue(storestockvalue);
                            }
                            console.log(result);
                            callback(result);
                        }
                        catch (e) {
                            callback(result);
                        }
                    }
                    else {
                        callback(result);
                    }
                }
                if (lo.keys(locArray).length) {
                    var sku = userInput['sku'];
                    sku = sku.toString();
                    var skuArray = sku.split(',');
                    condition["$and"] = [];
                    condition["$and"].push({
                        "sku": {
                            "$in": skuArray
                        }
                    });
                    condition["$and"].push({
                        "stockLocation": {
                            "$in": lo.keys(locArray)
                        }
                    });
                    inventoryavailabilityModel.aggregate({
                        $match: condition
                    }, {
                        $group: {
                            _id: {
                                "balanceType": "$balanceType",
                                "sku": "$sku"
                            },
                            "docs": {
                                "$first": {
                                    "balanceType": "$balanceType",
                                    "sku": "$sku"
                                }
                            },
                            "storevalue": {
                                "$push": {
                                    "locationId": "$locationId",
                                    "value": "$value",
                                    "sku": "$sku",
                                    "balanceType": "$balanceType",
                                    "warehouseId": "$warehouseId",
                                    "stockLocation": "$stockLocation"
                                }
                            }
                        }
                    }).exec( function(err, loc_data) {
                        getData(loc_data, function(result){
                            var storeStockValue = result[0] ? result[0]['storestockvalue'] : [];

                            if (storeStockValue && storeStockValue.length) {

                                function buildStockLocTree( array, parent, tree ){

                                    tree = typeof tree !== 'undefined' ? tree : [];
                                    parent = typeof parent !== 'undefined' ? parent : { _id: 0 };

                                    var children = lo.filter( array, function(child){ return child.parentStockingLocationId == parent._id; });

                                    if( !lo.isEmpty( children )  ){
                                        if( parent._id == 0 ){
                                           tree = children;   
                                        }else{
                                           parent['children'] = children;
                                        }
                                        lo.each( children, function( child ){ buildStockLocTree( array, child ) } );                    
                                    }

                                    return tree;
                                }

                                function initializeCalculation(node) {

                                    if (node.children && node.children.length > 0) {
                                        node.oh = 0;
                                        node.allocated = 0;
                                        node.reserved = 0;
                                        node.held = 0;
                                        node.returnToVendor = 0;
                                        for (var i = 0; i < node.children.length; i++) {
                                            var newValue = initializeCalculation(node.children[i]);
                                            node.oh += newValue.oh;
                                            node.allocated += newValue.allocated;
                                            node.reserved += newValue.reserved;
                                            node.held += newValue.held;
                                            node.returnToVendor  += newValue.returnToVendor;
                                        }
                                    }

                                    return node;
                                    
                                }

                                for (var i = storeStockValue.length - 1; i >= 0; i--) {
                                    var default_value = {
                                        oh: 0,
                                        allocated: 0,
                                        reserved: 0,
                                        held: 0,
                                        returnToVendor: 0
                                    };
                                    storeStockValue[i] = lo.extend({},default_value, storeStockValue[i]);
                                    if (!storeStockValue[i]['parentStockingLocationId']) {
                                        storeStockValue[i]['parentStockingLocationId'] = 0;
                                    }
                                }

                                var loc_tree_data  = buildStockLocTree(storeStockValue);
                                for (var i = loc_tree_data.length - 1; i >= 0; i--) {
                                    initializeCalculation(loc_tree_data[i]);
                                }
                                
                            }
                            defer.resolve(result);
                        });
                    });
                } else {
                    defer.resolve(result);
                }
            } else {
                console.log(err);
                defer.resolve(result);
            }
        } catch (e) {
            console.log(e);
            defer.resolve(result);
        }
    });
    return defer.promise;
}
/*
 * create createInvtransactionservice. 
 * Code modifed by Muthu on 27-07-2015
 */
function createInvtransactionService(userInput, header, invcallback) {
    // Add Audit
    //audit(userInput);
    function createInvtransaction(userInput,inputJson, skucallback) {
        userInput['createdBy'] = userInput.user.clientId;
        userInput['updatedBy'] = userInput.user.clientId;
        var directiveType = userInput['directivetype'];
        var locationid = userInput['locationid'];
        var transactiontypeid = userInput['transtypeid'];
        var sku = userInput['sku'];
        var cost = userInput['cost'];
        var quantity = userInput['quantity'];
        var stocklocation = userInput['stocklocationid'];
        var stockUOM = userInput['stockUOM'];
        var warehouseid = userInput['warehouseid'];
        var createTran = userInput['createTran'];
        var invAvailabilityData = {};
        var transactionRules = new Array();
        var documentRules = new Array();
        var calculationRules = new Array();
        var oldInvAvailData = new Array();
        if (!directiveType && !transactiontypeid) {
            console.log("DIRECTIVE_TYPE_ID | TRANSACTIONID NOT PROVIDED");
            skucallback("No directiveType or transactiontypeid provided");
            return;
        }
        inventoryavailabilityModel.find({
            locationId: locationid,
            sku: sku,
            warehouseId: warehouseid,
            balanceType: {'$in': lo.values(config.invtransaction_type)}
        }).lean().exec(function(err, invAvalData) {
            if (err) {
                utils.errorTrace(err);
                return skucallback(err);
            }
            async.parallel([
                function(callback) {
                    if (directiveType) {
                        documenttypeModel.findOne({
                            directiveTypeId: directiveType,
                            isDeleted: false
                        }).lean().exec( function(err, typeData) {
                            if (typeData) {
                                transactionruleModel.find({
                                    $and: [{
                                        tranTypeId: typeData['tranTypeId']
                                    }, {
                                        isDeleted: false
                                    }, {
                                        balanceType: {$in: config.tranRulesBalTypes}
                                    }]
                                }, function(err, data) {
                                    callback(err, data);
                                });
                            } else {
                                var data = null;
                                callback("", data);
                            }
                        });
                    } else if (!directiveType && transactiontypeid) {
                        transactionruleModel.find({
                            $and: [{
                                tranTypeId: transactiontypeid
                            }, {
                                isDeleted: false
                            }, {
                                balanceType: {$in: config.tranRulesBalTypes}
                            }]
                        }).lean().exec( function(err, data) {
                            callback(err, data);
                        });
                    }
                },
                function(callback) {
                    if (directiveType) {
                        documentrulemodel.find({
                            $and: [{
                                directiveTypeId: directiveType
                            }, {
                                isDeleted: false
                            }, {
                                balanceType: {$in: config.dirRulesBalTypes}
                            }]
                        }).lean().exec( function(err, data) {
                            callback(err, data);
                        });
                    } else {
                        var data = null;
                        callback("", data);
                    }
                },
                function(callback) {
                    if (directiveType) {
                        documenttypeModel.findOne({
                            directiveTypeId: directiveType,
                            isDeleted: false
                        }).lean().exec( function(err, typeData) {
                            if (typeData) {
                                transactionruleModel.find({
                                    $and: [{
                                        tranTypeId: typeData['tranTypeId']
                                    }, {
                                        isDeleted: false
                                    }, {
                                        balanceType: {$in: config.calcRulesBalTypes}
                                    }]
                                }, function(err, data) {
                                    callback(err, data);
                                });
                            } else {
                                var data = null;
                                callback("", data);
                            }
                        });
                    } else if (!directiveType && transactiontypeid) {
                        transactionruleModel.find({
                            $and: [{
                                tranTypeId: transactiontypeid
                            }, {
                                isDeleted: false
                            }, {
                                balanceType: {$in: config.calcRulesBalTypes}
                            }]
                        }).lean().exec( function(err, data) {
                            callback(err, data);
                        });
                    }
                }
            ], function(err, results) {
                    if (err) {
                      utils.errorTrace(err);
                      return skucallback(err);
                    }
                    var update = 0;
                    if (invAvalData && invAvalData.length) {
                        update = 1;
                        for (var i = invAvalData.length - 1; i >= 0; i--) {
                            invAvailabilityData[invAvalData[i].balanceType] = invAvalData[i];
                            var histObj = {};
                            histObj.balanceType = invAvalData[i] != null ? invAvalData[i].balanceType : null;
                            histObj.value = invAvalData[i] != null ? invAvalData[i].value : null;
                            oldInvAvailData.push(histObj);
                        }
                    }
                    // To Get Rules 
                    transactionRules = results[0];
                    documentRules = results[1];
                    calculationRules = results[2];
                    console.log("export_config:",exportConfigBalances);
                    if (!((transactionRules && transactionRules.length > 0) || (documentRules && documentRules.length > 0) || (calculationRules && calculationRules.length > 0))) {
                        console.log("NO_RULES_FOUND");
                        skucallback("No Rules found");
                        return;
                    }
                    var crossValue = 0;
                    invAvailabilityData = performTransactionOperations(transactionRules, invAvailabilityData, userInput, exportBalncType);
                    if (directiveType) {
                        invAvailabilityData = performDocumentOperations(documentRules, invAvailabilityData, userInput);
                    }
                    invAvailabilityData = performCalculationOperations(calculationRules, invAvailabilityData, results, userInput, crossValue, oldInvAvailData, exportBalncType);

                    lo.forIn(invAvailabilityData, function(value, key) {
                        if (!value || value === {}) {
                            delete invAvailabilityData.key;
                        }
                    });

                    if (invAvailabilityData && lo.keys(invAvailabilityData).length > 0) {

                        // Add Audit
                        auditNew(userInput,inputJson, invAvailabilityData, oldInvAvailData, header, exportConfigBalances , function(err, transactionData){

                            if (update > 0) {
                                async.eachSeries(invAvailabilityData, function(data, datacallback) {
                                    data['lastModified'] = new Date();
                                    data['updatedBy'] = userInput.user.clientId;
                                    inventoryAvailability(userInput, data, function(err, inventory_data) {
                                        datacallback();
                                    });
                                }, function() {
                                    if (err) {
                                        utils.errorTrace(err);
                                    }
                                    skucallback(err, {
                                        "ok": 1,
                                        "n": lo.keys(invAvailabilityData) ? lo.keys(invAvailabilityData).length : 0 
                                    }, exportBalncType , transactionData);
                                });
                            } else {
                                var invAvailabilityArr = [];
                                lo.forEach(invAvailabilityData, function(invData) {
                                    invData['created'] = new Date();
                                    invData['lastModified'] = new Date();
                                    invData['createdBy'] = userInput.user.clientId;
                                    invData['updatedBy'] = userInput.user.clientId;
                                    invData['value'] = parseFloat(invData['value']);
                                    invAvailabilityArr.push(invData);
                                });
                                saveRecords(userInput, invAvailabilityArr, exportBalncType,function(err, data, exportBalncType){
                                    skucallback(err, data, exportBalncType, transactionData);
                                });
                            }
                        });
                        
                    } else {
                        // Create tran for draft. by Ratheesh.
                        if (createTran) {
                            auditNew(userInput,inputJson, invAvailabilityData, oldInvAvailData, header, exportConfigBalances , function(err, Data){
                                skucallback(err , {}, {}, Data);
                            });
                        }
                        // return;
                    }
            }); // Asynch callback ends
        });   
    }

    var exportResult   =   {};
    var tranTypeData    =   '';
    var tranTypeDataInv =   '';
    var tranTempData    = '';
    var exportConfigBalances = [];
    var exportBalncType     =   {};

    utils.getUserConfig("exportBalanceTypes", header, function(err, configData){
        if(err){
            utils.errorTrace(err);
        }

        if (configData && configData.config_arr && configData.config_arr[0]) {
               exportConfigBalances = configData.config_arr[0].featureValue ? configData.config_arr[0].featureValue : configData.config_arr[0].defaultValue;
        }
        if (userInput.skus) {
            tranTypeData    =   '';
            tranTypeDataInv =   '';
            tranTempData    = '';
            var results = {};
            var skus = 0;
            if (userInput.skus && !(userInput.skus.constructor === Array)) {
                userInput.skus = JSON.parse(userInput.skus);
            }
            async.eachSeries(userInput.skus, function(sku, asynccallback) {
                sku.user = userInput.user;
                if (!sku.sku) {
                    saveOnlyTranHistory(sku, function(err, tranData) {
                        tranTempData = tranData;
                        results = tranData;
                        asynccallback();
                    });
                }
                else {
                    createInvtransaction(sku, userInput.submitJson, function(err, skuresult, exportType , tranTypeData) {
                        try{
                            if( tranTypeData && tranTypeData.sqsJson && userInput && userInput.submitJson){
                                userInput.submitJson = null;
                            }
                            
                            tranTypeDataInv = tranTypeData ? tranTypeData : '';
                            results[envConfig.getstatus(err)] ? null : results[envConfig.getstatus(err)] = [];
                            results[envConfig.getstatus(err)].push(sku.sku);
                            (exportType && exportType != {})
                                ? exportResult   =   exportType
                                : exportResult   =   "";
                            asynccallback();
                        }catch(e){
                            utils.errorTrace(e);
                            asynccallback();
                        }
                        
                    });
                }
                // asynccallback();
            }, function() {
                if(tranTempData){
                    tranTypeData = tranTempData;
                }else if(tranTypeDataInv){
                    tranTypeData = tranTypeDataInv;
                }
                if(userInput.adjustmentExport) {
                    try{
                        var adjustmentExport = JSON.parse(userInput.adjustmentExport);
                        exportResult ? ( (adjustmentExport.adjustment &&  adjustmentExport.adjustment[0])
                                        ? adjustmentExport.adjustment[0]['balanceUpdate'] = exportResult : '')
                                        : adjustmentExport['balanceUpdate'] = [];
                        utils.trascationschema(tranTypeData._id , {sqsJson : JSON.stringify(adjustmentExport)});
                        adjustmentExport = null;
                    }catch(e){
                        utils.errorTrace(e);
                    }
                }

                invcallback('', {data: results, export_type: exportResult , tran_typeData : tranTypeData});
            });
        } else {
            createInvtransaction(userInput, userInput.submitJson, function(err, skuresult, exportType , tranTypeData) {
                (exportType && exportType !== {})
                    ? exportResult   =   exportType
                    : exportResult   =   "";
                invcallback(err, {data: skuresult, export_type: exportResult , tran_typeData : tranTypeData});
            });
        }
    });
} // create method ends 
var addExportData   =   function (userInput, transactionRules, blncType, exportBalncType) {

    var calculationRule     =   ['add','subtract','recalculate'];
    try {
        if (userInput && userInput.transtypeid) {
            calculationRule.forEach(function(key) {
                if (transactionRules[key] === true) {
                    if (!exportBalncType[userInput.transtypeid]) exportBalncType[userInput.transtypeid] = [];
                    var existObj = lo.find(exportBalncType[userInput.transtypeid], {balanceType: blncType});
                    if ( !existObj ) {
                        exportBalncType[userInput.transtypeid].push ({
                            balanceType: blncType,
                            updateType:key
                        });
                    }
                }
            });
        }
        return exportBalncType;
    }
    catch (ex) {
        utils.errorTrace(ex);
        return exportBalncType;
    }
}
function performTransactionOperations(transactionRules, invData, userInput, exportBalncType) {
    var invTypes = config.invtransaction_type;
    var quantity = userInput['quantity'];
    var ohData = invData[invTypes.ON_HAND] != null ? invData[invTypes.ON_HAND].value : 0;
    var allocatedData = invData[invTypes.ALLOCATED] != null ? invData[invTypes.ALLOCATED].value : 0;
    var reservedData = invData[invTypes.RESERVED] != null ? invData[invTypes.RESERVED].value : 0;
    var heldData = invData[invTypes.HELD] != null ? invData[invTypes.HELD].value : 0;
    var returntovendorData = invData[invTypes.RETURN_TO_VENDOR] != null ? invData[invTypes.RETURN_TO_VENDOR].value : 0;
    if (typeof transactionRules !== 'object' || transactionRules === null) {
        return invData;
    } else {
        transactionRules    =   JSON.parse(JSON.stringify(transactionRules));
        invData    =   JSON.parse(JSON.stringify(invData));
        Object.keys(transactionRules).forEach(function(k) {
            if (!transactionRules[k]['noAction']) {
                switch (transactionRules[k]['balanceType']) {
                    case invTypes.ON_HAND:
                        ohData = doCalculation(ohData, transactionRules[k], quantity);
                        if (invData[invTypes.ON_HAND]) {
                            invData[invTypes.ON_HAND].value   =   ohData;
                        } else {
                            invData[invTypes.ON_HAND]     =   createNewInvAvailObject(invTypes.ON_HAND, userInput, ohData);
                        }
                        if (userInput['adjustmentNumber'] || userInput['countNumber']) {
                            exportBalncType     =   addExportData(userInput, transactionRules[k],invTypes.ON_HAND, exportBalncType);
                        }
                        break;
                    case invTypes.ALLOCATED:
                        allocatedData = doCalculation(allocatedData, transactionRules[k], quantity);
                        if (invData[invTypes.ALLOCATED]) {
                            invData[invTypes.ALLOCATED].value = allocatedData;
                        } else {
                            invData[invTypes.ALLOCATED] = createNewInvAvailObject(invTypes.ALLOCATED, userInput, allocatedData);
                        }
                        if (userInput['adjustmentNumber'] || userInput['countNumber']) {
                            exportBalncType     =   addExportData(userInput, transactionRules[k],invTypes.ALLOCATED, exportBalncType);
                        }
                        break;
                    case invTypes.RESERVED:
                        reservedData = doCalculation(reservedData, transactionRules[k], quantity);
                        if (invData[invTypes.RESERVED]) {
                            invData[invTypes.RESERVED].value = reservedData;
                        } else {
                            invData[invTypes.RESERVED] = createNewInvAvailObject(invTypes.RESERVED, userInput, reservedData);
                        }
                        if (userInput['adjustmentNumber'] || userInput['countNumber']) {
                            exportBalncType     =   addExportData(userInput, transactionRules[k],invTypes.RESERVED, exportBalncType);
                        }
                        break;
                    case invTypes.HELD:
                        heldData = doCalculation(heldData, transactionRules[k], quantity);
                        if (invData[invTypes.HELD]) {
                            invData[invTypes.HELD].value = heldData;
                        } else {
                            invData[invTypes.HELD] = createNewInvAvailObject(invTypes.HELD, userInput, heldData);
                        }
                        if (userInput['adjustmentNumber'] || userInput['countNumber']) {
                            exportBalncType     =   addExportData(userInput, transactionRules[k],invTypes.HELD, exportBalncType);
                        }
                        break;
                    case invTypes.RETURN_TO_VENDOR:
                        returntovendorData = doCalculation(returntovendorData, transactionRules[k], quantity);
                        if (invData[invTypes.RETURN_TO_VENDOR]) {
                            invData[invTypes.RETURN_TO_VENDOR].value = returntovendorData;
                        } else {
                            invData[invTypes.RETURN_TO_VENDOR] = createNewInvAvailObject(invTypes.RETURN_TO_VENDOR, userInput, returntovendorData);
                        }
                        if (userInput['adjustmentNumber'] || userInput['countNumber']) {
                            exportBalncType     =   addExportData(userInput, transactionRules[k],invTypes.RETURN_TO_VENDOR, exportBalncType);
                        }
                        break;
                }
            }
        });
        return invData;
    }
}

function performDocumentOperations(documentRules, invData, userInput) {
    var invTypes = config.invtransaction_type;
    var quantity = userInput['quantity'];
    var orderInData = invData[invTypes.OPEN_ON_ORDER_IN] != null ? invData[invTypes.OPEN_ON_ORDER_IN].value : 0;
    var confirmedInData = invData[invTypes.CONFIRM_ORDERS_IN] != null ? invData[invTypes.CONFIRM_ORDERS_IN].value : 0;
    var asnInData = invData[invTypes.ASININ] != null ? invData[invTypes.ASININ].value : 0;
    var transferInData = invData[invTypes.TRANSFERIN] != null ? invData[invTypes.TRANSFERIN].value : 0;
    var orderOutData = invData[invTypes.OPEN_ON_ORDER_OUT] != null ? invData[invTypes.OPEN_ON_ORDER_OUT].value : 0;
    var confirmedOutData = invData[invTypes.CONFIRM_ORDERS_OUT] != null ? invData[invTypes.CONFIRM_ORDERS_OUT].value : 0;
    var asnOutData = invData[invTypes.ASINOUT] != null ? invData[invTypes.ASINOUT].value : 0;
    var transferOutData = invData[invTypes.TRANSFEROUT] != null ? invData[invTypes.TRANSFEROUT].value : 0;
    var unconfirmInData = invData[invTypes.UNCONFORMEDIN] != null ? invData[invTypes.UNCONFORMEDIN].value : 0;
    var rejectedInData = invData[invTypes.REJECTDIN] != null ? invData[invTypes.REJECTDIN].value : 0;
    var unconfirmOutData = invData[invTypes.UNCONFORMEDOUT] != null ? invData[invTypes.UNCONFORMEDOUT].value : 0;
    var rejectedOutData = invData[invTypes.REJECTDOUT] != null ? invData[invTypes.REJECTDOUT].value : 0;
    if (typeof documentRules !== 'object' || documentRules === null) {
        return invData;
    } else {
        Object.keys(documentRules).forEach(function(k) {
            if (!documentRules[k]['noAction']) {
                switch (documentRules[k]['balanceType']) {
                    case invTypes.OPEN_ON_ORDER_IN:
                        orderInData = doCalculation(orderInData, documentRules[k], quantity);
                        if (invData[invTypes.OPEN_ON_ORDER_IN]) {
                            invData[invTypes.OPEN_ON_ORDER_IN].value = orderInData;
                        } else {
                            invData[invTypes.OPEN_ON_ORDER_IN] = createNewInvAvailObject(invTypes.OPEN_ON_ORDER_IN, userInput, orderInData);
                        }
                        break;
                    case invTypes.CONFIRM_ORDERS_IN:
                        confirmedInData = doCalculation(confirmedInData, documentRules[k], quantity);
                        if (invData[invTypes.CONFIRM_ORDERS_IN]) {
                            invData[invTypes.CONFIRM_ORDERS_IN].value = confirmedInData;
                        } else {
                            invData[invTypes.CONFIRM_ORDERS_IN] = createNewInvAvailObject(invTypes.CONFIRM_ORDERS_IN, userInput, confirmedInData);
                        }
                        break;
                    case invTypes.ASININ:
                        asnInData = doCalculation(asnInData, documentRules[k], quantity);
                        if (invData[invTypes.ASININ]) {
                            invData[invTypes.ASININ].value = asnInData;
                        } else {
                            invData[invTypes.ASININ] = createNewInvAvailObject(invTypes.ASININ, userInput, asnInData);
                        }
                        break;
                    case invTypes.TRANSFERIN:
                        transferInData = doCalculation(transferInData, documentRules[k], quantity);
                        if (invData[invTypes.TRANSFERIN]) {
                            invData[invTypes.TRANSFERIN].value = transferInData;
                        } else {
                            invData[invTypes.TRANSFERIN] = createNewInvAvailObject(invTypes.TRANSFERIN, userInput, transferInData);
                        }
                        break;
                    case invTypes.OPEN_ON_ORDER_OUT:
                        orderOutData = doCalculation(orderOutData, documentRules[k], quantity);
                        if (invData[invTypes.OPEN_ON_ORDER_OUT]) {
                            invData[invTypes.OPEN_ON_ORDER_OUT].value = orderOutData;
                        } else {
                            invData[invTypes.OPEN_ON_ORDER_OUT] = createNewInvAvailObject(invTypes.OPEN_ON_ORDER_OUT, userInput, orderOutData);
                        }
                        break;
                    case invTypes.CONFIRM_ORDERS_OUT:
                        confirmedOutData = doCalculation(confirmedOutData, documentRules[k], quantity);
                        if (invData[invTypes.CONFIRM_ORDERS_OUT]) {
                            invData[invTypes.CONFIRM_ORDERS_OUT].value = confirmedOutData;
                        } else {
                            invData[invTypes.CONFIRM_ORDERS_OUT] = createNewInvAvailObject(invTypes.CONFIRM_ORDERS_OUT, userInput, confirmedOutData);
                        }
                        break;
                    case invTypes.ASINOUT:
                        asnOutData = doCalculation(asnOutData, documentRules[k], quantity);
                        if (invData[invTypes.ASINOUT]) {
                            invData[invTypes.ASINOUT].value = asnOutData;
                        } else {
                            invData[invTypes.ASINOUT] = createNewInvAvailObject(invTypes.ASINOUT, userInput, asnOutData);
                        }
                        break;
                    case invTypes.TRANSFEROUT:
                        transferOutData = doCalculation(transferOutData, documentRules[k], quantity);
                        if (invData[invTypes.TRANSFEROUT]) {
                            invData[invTypes.TRANSFEROUT].value = transferOutData;
                        } else {
                            invData[invTypes.TRANSFEROUT] = createNewInvAvailObject(invTypes.TRANSFEROUT, userInput, transferOutData);
                        }
                        break;
                    case invTypes.UNCONFORMEDIN:
                        unconfirmInData = doCalculation(unconfirmInData, documentRules[k], quantity);
                        if (invData[invTypes.UNCONFORMEDIN]) {
                            invData[invTypes.UNCONFORMEDIN].value = unconfirmInData;
                        } else {
                            invData[invTypes.UNCONFORMEDIN] = createNewInvAvailObject(invTypes.UNCONFORMEDIN, userInput, unconfirmInData);
                        }
                        break;
                    case invTypes.REJECTDIN:
                        rejectedInData = doCalculation(rejectedInData, documentRules[k], quantity);
                        if (invData[invTypes.REJECTDIN]) {
                            invData[invTypes.REJECTDIN].value = rejectedInData;
                        } else {
                            invData[invTypes.REJECTDIN] = createNewInvAvailObject(invTypes.REJECTDIN, userInput, rejectedInData);
                        }
                        break;
                    case invTypes.UNCONFORMEDOUT:
                        unconfirmOutData = doCalculation(unconfirmOutData, documentRules[k], quantity);
                        if (invData[invTypes.UNCONFORMEDOUT]) {
                            invData[invTypes.UNCONFORMEDOUT].value = unconfirmOutData;
                        } else {
                            invData[invTypes.UNCONFORMEDOUT] = createNewInvAvailObject(invTypes.UNCONFORMEDOUT, userInput, unconfirmOutData);
                        }
                        break;
                    case invTypes.REJECTDOUT:
                        rejectedOutData = doCalculation(rejectedOutData, documentRules[k], quantity);
                        if (invData[invTypes.REJECTDOUT]) {
                            invData[invTypes.REJECTDOUT].value = rejectedOutData;
                        } else {
                            invData[invTypes.REJECTDOUT] = createNewInvAvailObject(invTypes.REJECTDOUT, userInput, rejectedOutData);
                        }
                        break;
                }
            }
        });
        return invData;
    }
}

function performCalculationOperations(calculationRules, invData, results, userInput, crossValue, oldInvAvailData, exportBalncType) {
    var invTypes = config.invtransaction_type;
    var quantity = userInput['quantity'];
    var cost = userInput['cost'];
    var atpData = invData[invTypes.AVAIL_TO_PROMISE] != null ? invData[invTypes.AVAIL_TO_PROMISE].value : 0;
    var atsData = invData[invTypes.AVAIL_TO_SELL] != null ? invData[invTypes.AVAIL_TO_SELL].value : 0;
    var wacData = invData[invTypes.WEIGHT_AVG_COST] != null ? invData[invTypes.WEIGHT_AVG_COST].value : 0;
    var ccvData = invData[invTypes.CCV] != null ? invData[invTypes.CCV].value : 0;
    var ivData = invData[invTypes.INVENTORY_VALUE] != null ? invData[invTypes.INVENTORY_VALUE].value : 0;
    if (typeof calculationRules !== 'object' || calculationRules === null) {
        return invData;
    } else {
        calculationRules    =   JSON.parse(JSON.stringify(calculationRules));
        Object.keys(calculationRules).forEach(function(k) {
            if (!calculationRules[k]['noAction']) {
                switch (calculationRules[k]['balanceType']) {
                    case invTypes.AVAIL_TO_PROMISE:
                        atpData = calculateInventoryFields(invData, invTypes.AVAIL_TO_PROMISE, cost, quantity, crossValue, oldInvAvailData);
                        if (invData[invTypes.AVAIL_TO_PROMISE]) {
                            invData[invTypes.AVAIL_TO_PROMISE].value = atpData;
                        } else {
                            invData[invTypes.AVAIL_TO_PROMISE] = createNewInvAvailObject(invTypes.AVAIL_TO_PROMISE, userInput, atpData);   
                        }
                        if (userInput['adjustmentNumber'] || userInput['countNumber']) {
                            exportBalncType     =   addExportData(userInput,calculationRules[k],invTypes.AVAIL_TO_PROMISE, exportBalncType);
                        }
                        break;
                    case invTypes.AVAIL_TO_SELL:
                        atsData = calculateInventoryFields(invData, invTypes.AVAIL_TO_SELL, cost, quantity, crossValue, oldInvAvailData);
                        if (invData[invTypes.AVAIL_TO_SELL]) {
                            invData[invTypes.AVAIL_TO_SELL].value = atsData;
                        } else {
                            invData[invTypes.AVAIL_TO_SELL] = createNewInvAvailObject(invTypes.AVAIL_TO_SELL, userInput, atsData);
                        }
                        if (userInput['adjustmentNumber'] || userInput['countNumber']) {
                            exportBalncType     =   addExportData(userInput, calculationRules[k],invTypes.AVAIL_TO_SELL, exportBalncType);
                        }
                        break;
                    case invTypes.WEIGHT_AVG_COST:
                        wacData = calculateInventoryFields(invData, invTypes.WEIGHT_AVG_COST, cost, quantity, crossValue, oldInvAvailData);
                        if (invData[invTypes.WEIGHT_AVG_COST]) {
                            invData[invTypes.WEIGHT_AVG_COST].value = wacData;
                        } else {
                            invData[invTypes.WEIGHT_AVG_COST] = createNewInvAvailObject(invTypes.WEIGHT_AVG_COST, userInput, wacData);
                        }
                        if (userInput['adjustmentNumber'] || userInput['countNumber']) {
                            exportBalncType     =   addExportData(userInput, calculationRules[k],invTypes.WEIGHT_AVG_COST, exportBalncType);
                        }
                        break;
                    case invTypes.CCV:
                        ccvData = calculateInventoryFields(invData, invTypes.CCV, cost, quantity, crossValue, oldInvAvailData);
                        if (invData[invTypes.CCV]) {
                            invData[invTypes.CCV].value = ccvData;
                        } else {
                            invData[invTypes.CCV] = createNewInvAvailObject(invTypes.CCV, userInput, ccvData);
                        }
                        if (userInput['adjustmentNumber'] || userInput['countNumber']) {
                            exportBalncType     =   addExportData(userInput, calculationRules[k],invTypes.CCV, exportBalncType);
                        }
                        break;
                    case invTypes.INVENTORY_VALUE:
                        ivData = calculateInventoryFields(invData, invTypes.INVENTORY_VALUE, cost, quantity, crossValue, oldInvAvailData);
                        if (invData[invTypes.INVENTORY_VALUE]) {
                            invData[invTypes.INVENTORY_VALUE].value = ivData;
                        } else {
                            invData[invTypes.INVENTORY_VALUE] = createNewInvAvailObject(invTypes.INVENTORY_VALUE, userInput, ivData);
                        }
                        if (userInput['adjustmentNumber'] || userInput['countNumber']) {
                            exportBalncType     =   addExportData(userInput, calculationRules[k],invTypes.INVENTORY_VALUE, exportBalncType);
                        }
                        break;
                }
            }
        });
        return invData;
    }
}

function createNewInvAvailObject(balanceTypeString, userInput, balanceTypeValue) {
    var locationid = userInput['locationid'];
    var transactiontypeid = userInput['transtypeid'];
    var sku = userInput['sku'];
    var cost = userInput['cost'];
    var quantity = userInput['quantity'];
    var stocklocation = userInput['stocklocationid'];
    var stockUOM = userInput['stockUOM'];
    var warehouseid = userInput['warehouseid'];
    var newObject = {
        locationId: locationid,
        stockLocation: stocklocation ? stocklocation : '',
        sku: sku,
        warehouseId: warehouseid,
        stockUOM: stockUOM,
        balanceType: balanceTypeString,
        value: balanceTypeValue,
        createdBy: userInput.user.clientId,
        updatedBy: userInput.user.clientId,
    };
    return newObject;
}

function saveRecords(userInput, records, exportBalncType,callback) {
    // Coolection object is used for bulkinsert : http://stackoverflow.com/questions/16726330/mongoose-mongodb-batch-insert
    if (records && records.length) {
        inventoryavailabilityModel.collection.insert(records, onSave);
    }
    else {
        onSave(null, []);
    }

    function onSave(err, data) {
        if (err) {
            callback({
                message: 'Error While Saving..' + err
            });
        } else {
            callback(err, data, exportBalncType);
        }
    }
}

function calculateInventoryFields(dataList, balanceType, cost, quantity, crossValue, oldInvAvailData) {
    var invTypes = config.invtransaction_type;
    var currentOH = dataList[invTypes.ON_HAND] != null ? dataList[invTypes.ON_HAND].value : 0;
    var oh = currentOH;
    var ohQuantity = currentOH;
    var allocated = dataList[invTypes.ALLOCATED] != null ? dataList[invTypes.ALLOCATED].value : 0;
    var reserved = dataList[invTypes.RESERVED] != null ? dataList[invTypes.RESERVED].value : 0;
    var currentOpenOnOrder = dataList[invTypes.OPEN_ON_ORDER_IN] != null ? dataList[invTypes.OPEN_ON_ORDER_IN].value : 0;
    var confirmOrderIn = dataList[invTypes.CONFIRM_ORDERS_IN] != null ? dataList[invTypes.CONFIRM_ORDERS_IN].value : 0;
    var asnIn = dataList[invTypes.ASININ] != null ? dataList[invTypes.ASININ].value : 0;
    var transferIn = dataList[invTypes.TRANSFERIN] != null ? dataList[invTypes.TRANSFERIN].value : 0;
    var inventoryTransferOut = dataList[invTypes.TRANSFEROUT] != null ? dataList[invTypes.TRANSFEROUT].value : 0;
    var currentATS = dataList[invTypes.AVAIL_TO_SELL] != null ? dataList[invTypes.AVAIL_TO_SELL].value : 0;
    var wac = dataList[invTypes.WEIGHT_AVG_COST] != null ? dataList[invTypes.WEIGHT_AVG_COST].value : 0;
    var outputData;
    currentOH = parseFloat(currentOH);
    oh = parseFloat(oh);
    ohQuantity = parseFloat(ohQuantity);
    allocated = parseFloat(allocated);
    reserved = parseFloat(reserved);
    currentOpenOnOrder = parseFloat(currentOpenOnOrder);
    confirmOrderIn = parseFloat(confirmOrderIn);
    asnIn = parseFloat(asnIn);
    transferIn = parseFloat(transferIn);
    inventoryTransferOut = parseFloat(inventoryTransferOut);
    wac = parseFloat(wac);
    cost = parseFloat(cost);
    quantity = parseFloat(quantity);
    // var currentInventoryValue = eval(config.rule.ccv); //oh * wac;eval(config.rule.ccv);
    var transactionValue = cost * quantity;
    if (balanceType === config.invtransaction_type.AVAIL_TO_PROMISE) {
        outputData = eval(config.rule.atp);
    } else if (balanceType === config.invtransaction_type.AVAIL_TO_SELL) {
        currentATS = eval(config.rule.ats);
        outputData = currentATS;
    } else if (balanceType === config.invtransaction_type.WEIGHT_AVG_COST) {
        currentOH = ohQuantity = parseFloat((oldInvAvailData[0] != null && oldInvAvailData[0].value != null) ? oldInvAvailData[0].value : 0);
        
        if(ohQuantity < 0) {
            currentOH = ohQuantity = 0;
        }
        var currentInventoryValue = eval(config.rule.ccv);
        currentInventoryValue = currentInventoryValue ? currentInventoryValue : 0;
        outputData = eval(config.rule.wac);
        outputData = outputData ? outputData : 0;
    } else if (balanceType === config.invtransaction_type.CCV) {
        outputData = eval(config.rule.ccv);
    } else if (balanceType === config.invtransaction_type.INVENTORY_VALUE) {
        outputData = eval(config.rule.iv);
    }
    outputData = outputData == Infinity ? 0 : outputData;
    return outputData.toFixed(2);
}

function doCalculation(data, rule, quantity) {
    if (data !== 0) {
        if (rule.add) {
            data = (+data) + (+quantity);
        } else if (rule.subtract) {
            data = (+data) - (+quantity);
        }
    } else {
        if (rule.add) {
            data = 0 + (+quantity);
        } else if (rule.subtract) {
            data = 0 - (+quantity);
        }
    }
    return data.toFixed(2);
}

function inventoryAvailability(userInput, data, callback) {
    var query = {
        locationId: data.locationId,
        sku: data.sku,
        balanceType: data.balanceType,
        stockLocation: ''
    };
    var dataobj = JSON.parse(JSON.stringify(data));
    delete dataobj._id;
    delete dataobj.__v;
    data.isDeleted = false;
    data.stockLocation = data.stockLocation || '';
    dataobj.value = parseFloat(dataobj.value);
    inventoryavailabilityModel.findOneAndUpdate(query, {
        $set: dataobj
    }, {
        upsert: true
    }, function(err, doc) {
        if (err != null || err != '') {
            console.log('errerr');
            console.log(err);
        }
        try {
            callback(err, data);
        } catch (e) {}
        //auditTransactionItemInventory(userInput,data); // Transaction History  
    });
}

function saveOnlyTranHistory (userInput, callback) {
    var purchaseOrderType   =   userInput['purchaseOrderType'] ? userInput['purchaseOrderType'] : '';
    var purchaseOrderNumber =   userInput['purchaseOrderNumber'] ? userInput['purchaseOrderNumber'] : '';
    var adjustmentNumber    =   userInput['adjustmentNumber'] ? userInput['adjustmentNumber'] : '';
    var countType           =   userInput['countType'] ? userInput['countType'] : '';
    var countNumber         =   userInput['countNumber'] ? userInput['countNumber'] : '';
    var countName           =   userInput['countName'] ? userInput['countName'] : '';

    var transtypeid     =   userInput['transtypeid'];
    var directivetype   =   userInput['directivetype'];
    var locationid      =   userInput['locationid'];
    var stocklocation   =   userInput['stocklocationid'];
    var asnid           =   userInput['asnid'];
    var postranNo       =   userInput['postranNo'];

    var newTran     =   userInput['addTran'];
    var tranType    =   "";

    if (purchaseOrderType === config.orderType.MANUAL_ORDER || purchaseOrderType === config.orderType.REPLENISHMENT_ORDER) {
        tranType = config.PURCHASEORDER;
    } else if (purchaseOrderType === config.orderType.TRANSFER) {
        tranType = config.TRANSFER;
    } else if (purchaseOrderType === config.orderType.MANUAL_SHIP) {
        tranType = config.MANUAL_SHIP;
    } else if (purchaseOrderType === config.orderType.QUALITY || purchaseOrderType === config.orderType.OTHERS || purchaseOrderType === config.orderType.RETURN_ARNGMT) {
        tranType = config.RETURN;
    } else if (countNumber && countName) {
        tranType = config.COUNT;
        // fromLocationId = locationid;
    } else if (adjustmentNumber) {
        tranType = config.ADJUSTMENT;
        // fromLocationId = locationid;
    } else if (purchaseOrderType === config.orderType.DROP_SHIP) {
        tranType = config.orderType.DROP_SHIP;
    } else if (purchaseOrderType === config.orderType.MR_MAN || purchaseOrderType === config.orderType.MR_IBT_M) {
        tranType = config.RECEIPT
    } else if (postranNo) {
        tranType = config.POSTRANSACTION;
    } else if (purchaseOrderType === config.orderType.ZFUT) {
        tranType = config.ZFUT;
    }else {
        tranType = config.STOCKUPLOAD;
    }

    var transaction = new transactionModel({ // Save Transaction
        tranTypeId: transtypeid,
        fromLocationId: locationid,
        toLocationId: stocklocation,
        // markForId: markForLocationId,
        directiveTypeId: directivetype,
        purchaseOrderType: purchaseOrderType,
        purchaseOrderNumber: purchaseOrderNumber,
        adjustmentNumber: adjustmentNumber,
        countType: countType,
        countNumber: countNumber,
        countName: countName,
        asnid: asnid,
        postranNo: postranNo,
        tranType: tranType,
        createdBy: userInput.user ? userInput.user.clientId : undefined,
        updatedBy: userInput.user ? userInput.user.clientId : undefined
    });
    transaction.save(function(err,data){
        callback(err,data);
    });
}

function auditNew(userInput,inputJson,records, oldRecords, header, exportConfigBalances , callback) {
    console.log('Audit New Working....');
    var locationid = userInput['locationid'];
    // var toLocationId  =  userInput['toLocationId'];
    // var fromLocationId  =  userInput['fromLocationId'];
    // var markForLocationId  =  userInput['markForLocationId'];
    var asnid = userInput['asnid'];
    var sku = userInput['sku'];
    var transtypeid = userInput['transtypeid'];
    var directivetype = userInput['directivetype'];
    var postranNo = userInput['postranNo'];
    var cost = userInput['cost'];
    var quantity = userInput['quantity'];
    var stocklocation = userInput['stocklocationid'];
    var stockUOM = userInput['stockUOM'];
    var warehouseid = userInput['warehouseid'];
    var purchaseOrderType = userInput['purchaseOrderType'] ? userInput['purchaseOrderType'] : '';
    var purchaseOrderNumber = userInput['purchaseOrderNumber'] ? userInput['purchaseOrderNumber'] : '';
    var adjustmentNumber = userInput['adjustmentNumber'] ? userInput['adjustmentNumber'] : '';
    var countType = userInput['countType'] ? userInput['countType'] : '';
    var countNumber = userInput['countNumber'] ? userInput['countNumber'] : '';
    var countName = userInput['countName'] ? userInput['countName'] : '';
    var purchaseOrder = userInput['purchaseOrderNumber'] ? userInput['purchaseOrderNumber'] : '';
    var tranType = "";
    var newTran = userInput['addTran'];
    var saveOnlyTran = userInput['saveOnlyTran'];
    if (purchaseOrderType === config.orderType.MANUAL_ORDER || purchaseOrderType === config.orderType.REPLENISHMENT_ORDER) {
        tranType = config.PURCHASEORDER;
    } else if (purchaseOrderType === config.orderType.TRANSFER) {
        tranType = config.TRANSFER;
    } else if (purchaseOrderType === config.orderType.MANUAL_SHIP) {
        tranType = config.MANUAL_SHIP;
    } else if (purchaseOrderType === config.orderType.QUALITY || purchaseOrderType === config.orderType.OTHERS || purchaseOrderType === config.orderType.RETURN_ARNGMT) {
        tranType = config.RETURN;
    } else if (countNumber && countName) {
        tranType = config.COUNT;
        // fromLocationId = locationid;
    } else if (adjustmentNumber && adjustmentNumber != '') {
        tranType = config.ADJUSTMENT;
        // fromLocationId = locationid;
    } else if (purchaseOrderType === config.orderType.DROP_SHIP) {
        tranType = config.orderType.DROP_SHIP;
    } else if (purchaseOrderType === config.orderType.MR_MAN || purchaseOrderType === config.orderType.MR_IBT_M) {
        tranType = config.RECEIPT
    } else if (postranNo) {
        tranType = config.POSTRANSACTION;
    } else if (purchaseOrderType === config.orderType.ZFUT) {
        tranType = config.ZFUT;
    }else {
        tranType = config.STOCKUPLOAD;
    }
    var trandataCreate = function(trandata) {
            var tranItemObj = { // Save Transaction Item
                tranId: trandata.id,
                productCode: sku,
                sku: sku,
                cost: cost,
                qty: quantity,
                uom: stockUOM,
                toStockingLocation: stocklocation,
                createdBy: userInput.user.clientId,
                updatedBy: userInput.user.clientId,
            }
            if (cost === '') delete tranItemObj['cost'];
            var transactionitem = new transactionitemModel(tranItemObj);
            transactionitem.save(function(err, data) {
                console.log('err, data');
                console.log(err, data);
                if (records !== null && records !== {}) {
                    var exportArr  =   [];
                    async.eachSeries(records,function(newRecord, async_callback){
                        try {
                            var prevValue = "0";
                            var newValue = newRecord.value;
                            var balanceType = newRecord.balanceType;
                            for (var j = 0; j < oldRecords.length; j++) {
                                if (oldRecords[j] !== null && oldRecords[j].balanceType === newRecord.balanceType) {
                                    prevValue = oldRecords[j].value;
                                    break;
                                }
                            }
                            if (newValue !== prevValue && balanceType === 'oh') {
                                var valueChanged = newValue - prevValue;
                                inventoryavailabilityModel.findOne ({
                                    locationId: newRecord.locationId,
                                    sku: newRecord.sku,
                                    balanceType: 'oh',
                                    stockLocation: { $exists: true, $ne: '' }
                                }).sort({value: -1}).exec(function(err, blncData){
                                    if(!err && blncData) {
                                        blncData = JSON.parse(JSON.stringify(blncData));
                                        blncData.value = blncData.value + valueChanged;
                                        inventoryavailabilityModel.update({
                                            "_id" : blncData._id
                                        }, {
                                            $set: {value: blncData.value}
                                        }).exec(function(err, ohdata){
                                            console.log("SUCCESS:",ohdata, err);
                                        });
                                    }else {
                                        console.log('oh update err');
                                        console.log(err);
                                    }
                                });
                            }
                            if ((newValue !== prevValue) && (exportConfigBalances.indexOf(newRecord.balanceType) !== -1)) {
                                // Construct data for export Inventery balance
                                var exportObj            =   {};
                                exportObj['sku']         =   newRecord.sku;
                                exportObj['location']    =   newRecord.locationId;
    
                                var qtyObj             =   {};
                                qtyObj['balanceType']  =   newRecord.balanceType;
                                qtyObj['value']        =   newRecord.value;
    
                                exportObj['balanceTypeQty']  =   [];
                                exportObj['balanceTypeQty'].push(qtyObj);
                                exportArr.push(exportObj);
                            }
                            var transactionItemInventory = new transactioniteminventoryModel({ // Save Transaction Item Inventory
                                balanceType: balanceType,
                                tranId: trandata.id,
                                tranitemId: data._id,
                                newValue: newValue,
                                prevValue: prevValue,
                                createdBy: userInput.user.clientId,
                                updatedBy: userInput.user.clientId,
                            });
                            transactionItemInventory.save();
                        } catch (e) {
                            console.log(e);
                        }
                        async_callback();
                    }, function(){
                        if (exportArr && exportArr.length != 0) {
                            if (!envConfig.JMS_QUEUESTOCKBALANCEEXPORT) {
                                console.log("******Queue name undefined - Inventory Balance Export");
                            }
                            else {
                                exportOnHand(exportArr, header, function(err, exp_data){
                                    if (err) {
                                        console.log("Failed to export Inventory balances");
                                    }
                                    else {
                                        console.log("*****Inventory Balances export data:",JSON.stringify(exportArr));
                                    }
                                });
                            }
                        }

                    });
                }
            });
        }
        // transactionModel.findOne({ // Save Transaction
    transactionModel.find({ // Save Transaction
        tranTypeId: transtypeid,
        fromLocationId: locationid,
        directiveTypeId: directivetype,
        purchaseOrderNumber: purchaseOrder,
        adjustmentNumber : adjustmentNumber,
        countName: countName,
        postranNo: postranNo
    }).sort({
        createdDate: -1
    }).limit(1).exec(function(err, tran) {
        trandata = tran[0];
        var transcationObj = {
            tranTypeId: transtypeid,
            fromLocationId: locationid,
            toLocationId: stocklocation,
            directiveTypeId: directivetype,
            purchaseOrderType: purchaseOrderType,
            purchaseOrderNumber: purchaseOrderNumber,
            adjustmentNumber: adjustmentNumber,
            countType: countType,
            countNumber: countNumber,
            countName: countName,
            asnid: asnid,
            postranNo: postranNo,
            sqsJson : inputJson ? inputJson : '',
            tranType: tranType,
            createdBy: userInput.user.clientId,
            updatedBy: userInput.user.clientId,
        }
        if (trandata) {
            if (newTran === 'true') {
                //Transaction Json update
                if(inputJson){
                    transcationObj.sqsJson = inputJson;
                }
                var transaction = new transactionModel(transcationObj);
                transaction.save(function(err, trandata) {
                    trandataCreate(trandata);
                    callback ? callback ('', trandata) : '';
                });
            } else {
                var transactionUpdate = transactionModel.findById(trandata._id);
                if (transactionUpdate) {
                    console.log({
                        purchaseOrderType: purchaseOrderType,
                        purchaseOrderNumber: purchaseOrderNumber,
                        adjustmentNumber: adjustmentNumber,
                        postranNo: postranNo,
                        countType: countType,
                        asnid: asnid,
                        countNumber: countNumber,
                        countName: countName,
                        tranType: tranType
                    });
                    transactionUpdate.update({
                        purchaseOrderType: purchaseOrderType,
                        purchaseOrderNumber: purchaseOrderNumber,
                        adjustmentNumber: adjustmentNumber,
                        countType: countType,
                        countNumber: countNumber,
                        countType: countType,
                        asnid: asnid,
                        tranType: tranType,
                        countName: countName,
                        postranNo: postranNo,
                        updatedBy: userInput.user.clientId,
                    });
                }
                trandataCreate(trandata);
                transactionModel.findById(trandata._id).exec(function(err , Data){
                    callback ? callback ('', Data) : '';
                });
            }
        } else {
            if(inputJson){
                transcationObj.sqsJson = inputJson;
            }
            var transaction = new transactionModel(transcationObj);
            transaction.save(function(err, trandata) {
                if (!saveOnlyTran){
                    trandataCreate(trandata);
                    callback ? callback('', trandata) : '';

                }
                else{

                    return trandata;
                }
            });
        }
    });
}

var exportOnHand = function(dataObj, header, callback) {
    var  dataObj        =   {data: JSON.stringify(dataObj)};
    var formData        =   querystring.stringify(dataObj);
    var contentLength   =   formData.length;
    var options =   {
        url: envConfig.apiPath + config.apis.JMSPUBLISH + envConfig.JMS_QUEUESTOCKBALANCEEXPORT,
        method: 'POST',
        body: formData,
        headers: {
            'authorization': header,
            'Content-Length': contentLength,
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    };
    request(options, function(err, response, data) {
        console.log(envConfig.apiPath + config.apis.JMSPUBLISH + envConfig.JMS_QUEUESTOCKBALANCEEXPORT, dataObj);
        console.log(err, data);
        callback ? callback(err, data) : '';
    });
};