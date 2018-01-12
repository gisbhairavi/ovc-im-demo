var express = require('express');
var log = require('../log');
var countModel = require('./../model/countModel');
var countZoneModel = require('./../model/countZoneModel');
var countItemModel = require('./../model/countItemModel');
var countItemManager = require('./countItemManager');
var countsnapshotSchema = require('./../model/countsnapshotModel');
var countsnapshotModel = countsnapshotSchema.countsnapshotSchema;
var countItemDiscrepancy = countsnapshotSchema.countItemDiscrepancy;
var constant = require('../../config/const.json');
var utils = require('./utils');
var request = require('request');
var envConfig = require('../../config/config');
var querystring = require('querystring');
var lodash = require('lodash');
var async = require('async');
var countManger = require('./countManager');
var router = express.Router();
lodash.extend(module.exports, {
    getReview: getReview,
    approveCount: approveCount
});
var CreateTran = function(dataObj, headers, callback) {
    var formData = querystring.stringify(dataObj);
    var contentLength = formData.length;
    var options = {
        url: envConfig.apiPath + constant.apis.TRANSACTIONSERVICE,
        method: 'PUT',
        body: formData,
        headers: {
            'authorization': headers,
            'Content-Length': contentLength,
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    };
    console.log('authorization' + headers);
    console.log(envConfig.apiPath + constant.apis.TRANSACTIONSERVICE, dataObj);
    request(options, function(err, response, data) {
        if (err)
            utils.errorTrace(err);
        callback ? callback(err, data) : '';
    });
};

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
 *            Arun          20/09/2017      1st Version
 *
 ************************************************************************************/
function getUserConfigById(featureId, header, callback) {

    console.log(envConfig.apiPath + constant.apis.GET_USER_CONFIG, featureId);
    var options = {
        url: envConfig.apiPath + constant.apis.GET_USER_CONFIG + featureId,
        method: 'GET',
        headers: {
            'authorization': header
        }
    };

    request(options, function(err, response, data) {
        console.log(err, data);
        try {
            data    =   JSON.parse(data);
        }
        catch(ex) {
            utils.errorTrace(ex);
            if (callback)
                return callback(ex);
        }
        callback ? callback(err, data) : '';
    });
}

function getReview(userInput, callback) {
    var countId = userInput['countId'];
    var discFilter = userInput.discrepancy ? userInput.discrepancy.split(',') : constant.defaultDiscrepencyFilter;

    var pageOffset = 0;
    var pageLimit = constant.COUNT_REVIEW_PAGE_LIMIT;
    if (userInput['page_offset'] && userInput['page_lmt']) {
        pageOffset = parseInt(userInput['page_offset']) || 0;
        pageLimit = parseInt(userInput['page_lmt']) || constant.COUNT_REVIEW_PAGE_LIMIT;
    }

    if (countId && discFilter && discFilter.length) {
        var resultObj = {};

        var matchCond = {};
        matchCond['$or'] = [];
        if (discFilter.indexOf('discrepancy') != -1) {
            matchCond['$or'].push({'count_item_discrepancy.discrepancy': { $exists: true, $ne: 0 }});
        }
        if (discFilter.indexOf('noDiscrepancy') != -1) {
            matchCond['$or'].push({'count_item_discrepancy.discrepancy': { $exists: true, $eq: 0 }});
            matchCond['$or'].push({'count_item_discrepancy.discrepancy': { $exists: false }});
        }

        countsnapshotModel.aggregate([
            { $match: { countId: Number(countId)} },
            { $project: { 'count_item_discrepancy': 1} },
            { $unwind: "$count_item_discrepancy" }, 
            { $match: matchCond },
            { $group: { _id: "$_id", count: {$sum: 1}} }
        ]).exec(function(err, data){
            if (err) {
                utils.errorTrace(err);
                return callback(err);
            }
            if (data && data[0] && data[0].count) {
                var totalCount = data[0].count;
                countsnapshotModel.aggregate([
                    { $match: { countId: Number(countId) } },
                    { $project: { 'count_item_discrepancy': 1 } },
                    { $unwind: "$count_item_discrepancy" },
                    { $match: matchCond },
                    { $sort: { "count_item_discrepancy.lineNumber":1 } },
                    { $skip: pageOffset },
                    { $limit: pageLimit }, 
                    { $group: { _id: "$_id", count_item_discrepancy: { $push: "$count_item_discrepancy" } } }
                ]).exec(function(err, itemData) {
                    if (err) {
                        utils.errorTrace(err);
                        return callback(err);
                    }
                    if (itemData && itemData[0] && itemData[0].count_item_discrepancy && itemData[0].count_item_discrepancy.length) {
                        itemData = itemData[0].count_item_discrepancy;
                        var zoneArr = [];
                        var skuArr  = [];
                        var zoneProjectObj = {
                            "countId" : 0,
                            "createdBy" : 0,
                            "updatedBy" : 0,
                            "isDeleted" : 0,
                            "lastModified" : 0,
                            "created" : 0,
                            "__v" : 0,
                            "skuQty" : 0,
                            "operatorId" : 0,
                            "handCountQty" : 0,
                            "comment" : 0
                        }
                        var itemProjectObj = {
                                "zoneId" : 1,
                                "countStatus" : 1,
                                "productCode" : 1,
                                "noApproval" : 1,
                                "sku" : 1,
                                "qty" : 1,
                                "_id":0
                            }
                        for (var i = itemData.length - 1; i >= 0; i--) {
                            if (itemData[i].zoneData && itemData[i].zoneData.length) {
                                zoneArr = zoneArr.concat(itemData[i].zoneData);
                            }
                            if(skuArr.indexOf(itemData[i].sku) == -1){
                                skuArr.push(itemData[i].sku);
                            }
                        }
                        var countItemQuery = {"$and" :[ {zoneId: { '$in' : zoneArr }} , {sku: { '$in' : skuArr }}]};
                        countZoneModel.find({
                            _id: {
                                '$in' : zoneArr
                            }
                        }, zoneProjectObj, function(err, zoneData){
                            countItemModel.find(countItemQuery , itemProjectObj, function(error , countItemData){
                                if(error){
                                    utils.errorTrace(error);
                                }
                                countItemData =  utils.arrayToKeyValueArray({array:countItemData , key :"sku"});
                                zoneData = utils.arrayToKeyValueObj({array_val: zoneData, key:"_id"});
                                resultObj.zone_data = zoneData;
                                resultObj.review_data = itemData;
                                resultObj.total_count = totalCount;
                                resultObj.countItemData = countItemData;
                                callback(err, resultObj); 
                                countItemData = null;
                                zoneData = null;
                                resultObj = null;
                            });
                        });
                    }
                    else {
                        callback (null, resultObj);
                    }
                });
            }
            else {
                callback (null, resultObj);
            }
        });
    } else {
        callback("countId & filter data are Required");
    }
}

function getProductCost(productData ,SKUs, callback){
    var obj    = {};
    obj['sku'] = SKUs.join();
    obj['loc'] = productData.countData.locId;
    var sku_data = querystring.stringify(obj);
    var options = {
        url: envConfig.dashPath + constant.apis.GETPRODUCTCOST,
        method: 'POST',
        body: sku_data,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    request(options, function(err, response, productCostData) {
        //Mem clear
        sku_data = null;
        obj = null;
        console.log(envConfig.dashPath + constant.apis.GETPRODUCTCOST, obj);
        console.log(err, 'ERROR__DATA');
        callback ? callback(err, productCostData) : '';
        //Mem Clear
        productCostData = null;
    });
}

function updateCount(id, callback) {
    var countStatus = { countStatus: constant.countStatus.APPROVED, approvedDate: Date.now() };
    var query = { countId: id,  isDeleted: false };
    var dataToInsert = { $set: { countStatus: constant.countStatus.APPROVED } };
    countModel.update({_id: id, isDeleted: false}, countStatus, function(countError, countData) {
        if (countData) {
            countZoneModel.update(query, dataToInsert, {
                multi: true
            }, function(countZoneError, countZoneData) {
                if(countZoneError){
                    return callback(countZoneError);
                }
                if (countZoneData) {
                    countItemModel.update(query, dataToInsert, {
                        multi: true
                    }, function(countItemError, countItemData) {
                        if(countItemError){
                            return callback(countItemError);
                        }
                        if (countItemData) {
                            callback(countItemError, countItemData);
                            countItemData = null;
                            counting = null;
                        }
                    });
                }
            });
        } else {
            return callback(countError);
        }
    });
}

function approveCount(id, countDetails, headers, callback) {
    countModel.findOne({"_id" :id,"countStatus" : "inProgress"}).exec(function (error, countData) {
        if (error) {
            utils.errorTrace(error);
            return callback(error);
        }
        if (countData) {
            countsnapshotModel.findOne({countId: id},{count_snapshot: 0}).exec(function(err, itemDiscData){
                if (err) {
                    utils.errorTrace(err);
                    return callback(err);
                }
                if (itemDiscData && itemDiscData.count_item_discrepancy && itemDiscData.count_item_discrepancy.length) {
                    itemDiscData = itemDiscData.count_item_discrepancy
                    var skuArr = [];
                    itemDiscData.forEach(function(countValue){
                        if(skuArr.indexOf(countValue.sku) == -1)
                            skuArr.push(countValue.sku)
                    });
                    var tranItemArr = [];
                    getProductCost(countDetails, skuArr, function(err , costData){
                        skuArr = null;
                        if(err){
                            console.log(err);
                            return callback('GETPRODUCTCOST_Erro' , err);
                        }
                        try {
                            costData = JSON.parse(costData);
                            costData = utils.arrayToKeyValueObj({array_val: costData, key:'ProductPrice', key_2:'SKU'});
                        }
                        catch (ex) {
                            utils.errorTrace(ex);
                        }
                        async.forEach(itemDiscData, function(skuDisc, async_callback){
                            var tempObj     =   {};
                            var discrep     =   skuDisc['discrepancy'];
                            tempObj['discrepancy'] =     Math.abs(discrep);
                            tempObj['quantity']    =    tempObj['discrepancy'];
                            tempObj['lineNumber']  =    skuDisc.lineNumber;
                            tempObj['cost']        =    (costData[skuDisc.sku]['ProductPrice'] && costData[skuDisc.sku]['ProductPrice'].Cost) ? costData[skuDisc.sku]['ProductPrice'].Cost : 0;
                            tempObj['stockUOM']    =     '';
                            tempObj['stocklocationid']     =     '';
                            tempObj['warehouseid']         =     countData.locationId || '';
                            tempObj['locationid']          =     countData.locationId || '';
                            tempObj['directivetype']       =     '';
                            tempObj['countType']           =     countData.countType;
                            tempObj['countNumber']         =     id;
                            tempObj['countName']           =     countData.name; 
                            tempObj['sku']                 =     skuDisc.sku;
                            if(discrep) {
                                if(discrep > 0){
                                    tempObj['type']          =   'positive';
                                    tempObj['transtypeid']   =   constant.DIRECTIVETYPES.ZCOUNT.POSITIVE;
                                }else{
                                    tempObj['type']          =   'negative';
                                    tempObj['transtypeid']   =   constant.DIRECTIVETYPES.ZCOUNT.NEGATIVE;
                                }
                                tranItemArr.push(tempObj);
                            }
                            async_callback();
                        }, function(){
                            updateCount(id, callback);
                            var tranObj = {};
                            tranObj.balTypeObj = {};
                            tranObj.successTran = [];
                            var tempLength = 0;
                            async.eachSeries(lodash.chunk(tranItemArr, 200), function(chunkArr, async_callback) {
                                CreateTran({skus: JSON.stringify(chunkArr)}, headers, function(err, tranData){

                                    if (err) {
                                        utils.errorTrace(err);
                                        return async_callback();
                                    }

                                    try {
                                        tranData = JSON.parse(tranData);
                                    }
                                    catch (ex) {
                                        utils.errorTrace(ex);
                                        return async_callback();
                                    }

                                    if(tranData) {

                                        if (tranData.data && tranData.data.success)
                                            tranObj.successTran = tranObj.successTran.concat(tranData.data.success);

                                        if (tranData.export_type)
                                            tranObj.balTypeObj = lodash.merge({}, tranObj.balTypeObj, tranData.export_type);

                                        if (chunkArr && chunkArr.length) tempLength += chunkArr.length;

                                        if (tempLength === tranItemArr.length) {
                                            tranObj.transactionData = tranData.tran_typeData;
                                        }
                                    }
                                    async_callback();
                                });
                            }, function(){
                                getUserConfigById ("publishCountAdjustment", headers, function(err, configData) {

                                    if (err) utils.errorTrace(err);

                                    else if (configData && configData.config_arr && configData.config_arr[0]) {
                                        var countConfigTypes    =   (configData.config_arr[0].featureValue && configData.config_arr[0].featureValue.length) ? configData.config_arr[0].featureValue : configData.config_arr[0].defaultValue;
                                        console.log("count_publish_config:",countConfigTypes);
                                        if (countConfigTypes.indexOf(constant.countConfigMap[countData.countType]) >= 0) {
                                            exportCountAdjustment(countData, tranItemArr, tranObj, headers);
                                        }
                                    }
                                });
                            });
                        });
                    });
                }
            });
        }
        else {
            callback('No count Data');
        }
    });
}

function exportCountAdjustment(countData, itemArr, tranData, headers) {
    if (countData && tranData && tranData.transactionData) {
        var exportObj = {};
        exportObj.created  = tranData.transactionData.createdDate;
        exportObj.createdBy = tranData.transactionData.createdBy;
        exportObj.updatedBy = tranData.transactionData.updatedBy;
        exportObj.storeId = countData.locationId;
        var countId = countData._id.toString();
        exportObj.adjustmentNumber = countId;
        exportObj.status = constant.countStatus.COUNT_ADJUSTMENT_STATUS;
        exportObj.adjustment = [];
        if (tranData.balTypeObj && itemArr && itemArr.length) {
            var tranTypeSku = {};

            for (var i = itemArr.length - 1; i >= 0; i--) {
                if (!tranTypeSku[itemArr[i].transtypeid]) tranTypeSku[itemArr[i].transtypeid] = [];
                if (tranData.successTran.indexOf(itemArr[i].sku) != -1) {    
                    tranTypeSku[itemArr[i].transtypeid].push({
                        lineNumber: itemArr[i].lineNumber,
                        sku: itemArr[i].sku,
                        qty: itemArr[i].quantity
                    });
                }
            }

            lodash.forEach(tranData.balTypeObj, function(balChanges, tranType) {
                var tranTypeData = {};
                tranTypeData.adjustmentCode = constant.countTranCode[tranType];
                tranTypeData.adjustmentName = tranType;
                tranTypeData.reasonCode = countData.countType;
                tranTypeData.adjustmentItem = tranTypeSku[tranType];
                tranTypeData.balanceUpdate = {};
                tranTypeData.balanceUpdate[tranType] = balChanges;
                exportObj.adjustment.push(tranTypeData);
            });

            updateSqsJson(countId, exportObj, headers);

            utils.publishMessage({
                jsonData: exportObj,
                type: envConfig.JMS_QUEUE_ADJUST_EXPORT,
                header: headers,
                tranType: 'count_adjustment'
            });

        }
    }
}

function updateSqsJson (countId, exportJSON, headers) {
    var dataobj = { sqsJson: JSON.stringify(exportJSON), count_number: countId};
    var formData = querystring.stringify(dataobj);
    var contentLength = formData.length;
    var options = {
        url: envConfig.apiPath + constant.apis.TRANSACTIONUPDATE,
        method: 'POST',
        body: formData,
        headers: {
            'authorization': headers,
            'Content-Length': contentLength,
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    };
    console.log(envConfig.apiPath + constant.apis.TRANSACTIONUPDATE, dataobj);
    request(options, function(err, response, data) {
        if (err)
            utils.errorTrace(err);
    });
}

