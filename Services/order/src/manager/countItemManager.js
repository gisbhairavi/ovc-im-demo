var express = require('express');
var log = require('../log');
var utils = require('./utils');
var countItemModel = require('./../model/countItemModel');
var countZoneModel = require('./../model/countZoneModel');
var countModel = require('./../model/countModel');
var countsnapshotSchema = require('./../model/countsnapshotModel');
var countsnapshotModel = countsnapshotSchema.countsnapshotSchema;
var countItemQtyManager = require('./countItemQtyManager');
var countManager = require('./countManager');
var lodash = require('lodash');
var constant = require('../../config/const.json');
var router = express.Router();
var request = require('request');
var async = require('async');

lodash.extend(module.exports, {
    getCountItem: getCountItem,
    getCountItemStatus: getCountItemStatus,
    createCountItem: createCountItem,
    updateOH: updateOH,
    editCountItem: editCountItem,
    deleteCountItem: deleteCountItem,
    getCountItems:getCountItems,
    getCountSKUData: getCountSKUData
});
/*
 * GET countItem by id.
 */
function getCountItem(userInput, callback) {
    var id = userInput['id'];
    var key = userInput['sku'];
    var zoneId = userInput['zoneId'];
    var countId = userInput['countId'];
    var noScan = userInput['noScan'];
    var srchCond = {};
    var page_offset = 0;
    var page_lmt = 100;

    if (userInput['page_offset'] !== undefined && userInput['page_offset'] !== null && userInput['page_lmt'] !== undefined && userInput['page_lmt'] !== null) {
        page_offset =  parseInt(userInput['page_offset']) ||  0;
        page_lmt =  parseInt(userInput['page_lmt']) || 100;

    }
    var countType = userInput['countType'];
    var countNumber = userInput['countNumber'] ? userInput['countNumber'] : 1;



    var count = 0;
    if (id) {
        countItemModel.findById(id).exec(callback);
    } else if (countId || zoneId || noScan) {
        var query = JSON.parse('{"isDeleted" : false}');
        if (zoneId) {
            query['zoneId'] = new RegExp('^.*?' + zoneId + '.*?$', "i");
        }
        if (countId) {
            query['countId'] = +countId;
        }
        if (noScan && countId) {
            query['qty'] = {
                $exists: false
            };
            countItemModel.aggregate([{
                $match: query
            }, {
                $group: {
                    _id: {
                        countId: "$countId",
                        zoneId: "$zoneId"
                    },
                    "sku": {
                        "$push": "$sku"
                    },
                    "total_count": {
                        "$sum": 1
                    },
                    // "count": {
                    //     "$sum": 1
                    // }
                }
            }]).exec(function(err, data) {
                if (err) return callback(err);
                if (data) {
                    // For get the count data.
                    var skus = {};
                    data.forEach(function(sku) {
                        skus[sku['_id']['zoneId']] = sku['sku'];
                    });
                    callback(err, skus);
                } else {
                    callback('Can Not Load Data.');
                }
            });
        } else if (zoneId && countId) {
            srchCond = {
                countId: Number(countId),
                zoneId: String(zoneId),
                isDeleted: false
            }

            if (key) {
                srchCond['sku'] = {
                    '$in': key.split(',')
                };
            }
            if(countType === constant.countType.physicalCount){
                countItemModel.find(srchCond).count().exec(function(err, totalCount) {
                    countItemModel.find(srchCond).sort({
                        'lastModified': 1
                    }).skip(page_offset).limit(page_lmt).exec(function(err,countItemData){
                        if(err){
                            callback(err);
                        }
                        else if(countItemData.length > 0){
                            countItemData = lodash.map(countItemData, '_id');
                            var countQtyQuery = {
                                countItemData:countItemData,
                                countNumber : countNumber
                            };
                            countItemQtyManager.getCountItemQty(countQtyQuery,function(error,countItemQtyResponse){
                                countItemModel.find({_id:{$in:countItemData},isDeleted:false}).exec(function(err,countItem){
                                    if(err)
                                        callback(err);
                                    else{
                                        if(countItem.length > 0){
                                             countItem = utils.arrayToKeyValueObj({array_val: countItem, key:"_id"});
                                              var zoneData = [];
                                             countItemQtyResponse.countItemQtyData.forEach(function(countQtyItem){
                                                    if(countItem[countQtyItem.countItemId]){  
                                                         try{
                                                            countQtyItem = JSON.parse(JSON.stringify(countQtyItem));
                                                            countQtyItem._id = countItem[countQtyItem.countItemId]['_id'];
                                                            countQtyItem.sku = countItem[countQtyItem.countItemId]['sku'];
                                                            countQtyItem.zoneId = countItem[countQtyItem.countItemId]['zoneId'];
                                                            countQtyItem.countId = countItem[countQtyItem.countItemId]['countId'];
                                                            countQtyItem.lineNumber = countItem[countQtyItem.countItemId]['lineNumber'];
                                                            countQtyItem.noApproval = countItem[countQtyItem.countItemId]['noApproval'];
                                                         }catch(error){
                                                            callback(error);
                                                         }
                                                     }
                                                     zoneData.push(countQtyItem);
                                                });
                                             callback('', {
                                                        zone_data: zoneData,
                                                        total_count: totalCount
                                                    });
                                        }
                                    }
                                });

                            });
                            
                        }else{
                            callback('', {
                                    zone_data: countItemData,
                                    total_count: 0,
                                    totalcount:0
                                });
                        }
                    });
                });
            }else{                
                countItemModel.distinct('_id',srchCond).exec(function(err,countItemData){
                    if(err)
                        callback(err);
                    else{
                        if(countItemData.length > 0){
                            var countQtyQuery = {
                                countItemData:countItemData,
                                countNumber : countNumber,
                                page_offset:page_offset,
                                page_lmt:page_lmt
                            };
                            countItemModel.find({
                                countId: countId,
                                zoneId: zoneId,
                                isDeleted: false
                            }).count().exec(function(err, totalcount) {
                                countItemModel.find(srchCond).count().exec(function(err, totalCount) {
                                    countItemQtyManager.getCountItemQty(countQtyQuery,function(error,countItemQtyResponse){
                                    var lineNumber = 1;
                                    countItemModel.find({_id:{$in:countItemData},isDeleted:false}).exec(function(err,countItem){
                                        if(err)
                                            callback(err);
                                        else{
                                            try{
                                                 countItem = utils.arrayToKeyValueObj({array_val: countItem, key:"_id"});
                                                  var zoneData = [];
                                                 countItemQtyResponse.countItemQtyData.forEach(function(countQtyItem){
                                                        if(countItem[countQtyItem.countItemId]){
                                                             try{
                                                                countQtyItem = JSON.parse(JSON.stringify(countQtyItem));
                                                                countQtyItem._id = countItem[countQtyItem.countItemId]['_id'];
                                                                countQtyItem.sku = countItem[countQtyItem.countItemId]['sku'];
                                                                countQtyItem.zoneId = countItem[countQtyItem.countItemId]['zoneId'];
                                                                countQtyItem.countId = countItem[countQtyItem.countItemId]['countId'];
                                                                countQtyItem.lineNumber = lineNumber;
                                                                countQtyItem.noApproval = countItem[countQtyItem.countItemId]['noApproval'];
                                                                lineNumber++;
                                                             }catch(error){
                                                                callback(error);
                                                             }
                                                         }
                                                         zoneData.push(countQtyItem);
                                                    });
                                                   if(zoneData.length > 0){
                                                        callback('', {
                                                            zone_data: zoneData,
                                                            total_count: countItemQtyResponse.totalCount,
                                                            totalcount:totalcount
                                                        });
                                                     }else{
                                                       countItemModel.find(srchCond).skip(page_offset).limit(page_lmt).exec(function(err,countItemData){
                                                            if(err)
                                                                callback(err);
                                                            else{
                                                                 callback('', {
                                                                    zone_data: countItemData,
                                                                    total_count: totalCount,
                                                                    totalcount:totalcount
                                                                });
                                                            }
                                                        });
                                                     }
                                            }catch(error){
                                                callback(error);
                                            }
                                                
                                        }
                                    });

                                });
                                });
                            });
                        }else{
                            callback('', {
                                zone_data: countItemData,
                                total_count: 0,
                                totalcount:0
                            });
                        }
                        
                    }
                });
                
            }
        } else {
            callback("ZoneId & countId Required");
        }
    } else if (key) {
        srchCond = {
            $or: [{
                sku: new RegExp('^.*?' + key + '.*?$', "i")
            }],
            isDeleted: false
        }
        countItemModel.find(srchCond).count().exec(function(err, totalCount) {
            countItemModel.find(srchCond).sort({
                "lineNumber": 1
            }).skip(page_offset).limit(page_lmt).exec(function(err, itemData) {
                callback({
                    zone_data: itemData,
                    total_count: totalCount
                })
            });
        });
    } else {
        callback("ZoneId & countId Required");
    }
}
/***********************************************************************
 *
 * FUNCTION:    getCountItemStatus
 *
 * DESCRIPTION: For Count Item Pie Chart in Dashboard Report.
 *
 * PARAMETERS:  "" or "fromdate" or "todate" or "invlimit".
 *
 * RETURNED:    sku
 *              countId
 *              name (count)
 *              lastModified
 *              qty 
 *              oh.
 *
 * REVISION HISTORY:
 *
 *            Name      Date            Description
 *            ----      ----            -----------
 *            Arun      12/01/2016      First Version
 *            Ratheesh  13/01/2016      Second Version
 *            Arun      18/07/2016      Added filter basded
 *                                      countId.
 *
 ***********************************************************************/
function getCountItemStatus(userInput, callback) {
    var fromDate = userInput['fromdate'],
        storeId = userInput['storeId'],
        toDate = userInput['todate'],
        invLimit = userInput['invlimit'] || 50,
        countId = userInput['countIdArr'];
    var tmp = {};
    if ((!countId) && (fromDate && fromDate != '') && (toDate && toDate != '')) {
        fromDate = new Date(fromDate);
        toDate = new Date(toDate);
        if (!tmp.$and) tmp.$and = [];
        var date_range = {
            '$gte': fromDate,
            '$lt': toDate
        };
        tmp.$and.push({
            lastModified: date_range
        });
    }
    if (countId) {
        tmp = {
            countId: {
                '$in': countId
            }
        }
    }
    // if(storeId && storeId != '')
    // {
    //Get count IDS From the Count Table
    //     if( ! tmp.$and)
    //         tmp.$and    =   [];
    //     tmp.$and.push({lastModified: date_range});
    // }
    var search_cond = {
        $match: tmp
    };
    countItemModel.aggregate([
        search_cond, {
            $group: {
                _id: {
                    sku: "$sku",
                    countId: "$countId",
                    lastModified: "$lastModified"
                },
                "countId": {
                    "$last": "$countId"
                },
                "storeId": {
                    "$last": "$countId"
                },
                "qty": {
                    "$push": "$qty"
                },
                "oh": {
                    "$push": "$oh"
                },
                "count": {
                    "$sum": 1
                }
            }
        }, {
            "$sort": {
                '_id.lastModified': -1
            }
        }, {
            "$limit": parseInt(invLimit)
        }
    ]).exec(function(err, data) {
        // For get the count data.
        countModel.populate(data, {
            path: 'countId',
            select: 'name -_id',
        }, function(err, countItemData) {
            countModel.populate(countItemData, {
                path: 'storeId',
                select: 'locationId -_id',
            }, function(err, countItemData) {
                callback(err, countItemData);
            });
        });
    });
}
/*
 * create and update countItem.
 */
function createCountItem(userInput, header, callback) {
    var error;
    var countNumber = 1;
    if (userInput.hasOwnProperty('countNumber')) {
        countNumber = userInput.countNumber;
        delete userInput.countNumber;
    }
    try {
        if (userInput['skuData'] && userInput['skus']) {
            var skuData = [];
            userInput['skus'].forEach(function(sku) {
                userInput['skuData']['sku'] = sku.sku;
                userInput['skuData']['productCode'] = sku.productCode;
                skuData.push(lodash.clone(userInput['skuData']));
                ++userInput['skuData']['lineNumber'];
            });
            countItemModel.create(skuData, callback);
        } else {
            if (userInput['updateDefaultQty'] && userInput['countId']) {
                var zoneId= userInput['zoneId'];
                var countId= +userInput['countId'];
                var srchCond = {
                    qty: {
                        $exists: false
                    }
                };
                if (zoneId) {
                    srchCond['zoneId'] = userInput['zoneId'];
                }
                if (countId) {
                    srchCond['countId'] = +userInput['countId'];
                }
                countItemModel.update(srchCond, {
                    $set: {
                        qty: 0
                    }
                }, {
                    multi: true
                }, function(err, data) {
                        var update_cond = {
                            qty: 0
                        };
                        if (zoneId) {
                            update_cond['zoneId'] = userInput['zoneId'];
                        }
                        if (countId) {
                            update_cond['countId'] = +countId;
                        }
                        countItemModel.find(update_cond).exec(function(err, data) {
                            try {
                                data.forEach(function(sku, n) {
                                    var qty = {
                                        updatedBy: userInput.user.clientId,
                                        qty: 0
                                    };
                                    countItemQtyManager.updateQty({
                                        countItemId: sku['_id']+'',
                                        countNumber: countNumber+'',
                                        qty: {
                                            $exists: false
                                        }
                                    },qty, function(err, data) {

                                    });
                                });callback(err, {
                                    result: constant.label.SUCCESS
                                });
                            } catch (c) {
                                console.log(c);
                                callback(c);
                            }
                        });
                });
            } else {
                userInput['createdBy'] = userInput.user.clientId;
                userInput['updatedBy'] = userInput.user.clientId;
                countItemObject = new countItemModel(userInput);
                countItemObject.save(function(err, data) {
                    if (data) {
                        var qty = {};
                        //var qty = [];
                        // for (var n = countNumber; n > 0; n--) {
                            qty = {
                                countItemId: data['_id'],
                                lineNumber: data['lineNumber'],
                                countNumber:countNumber?countNumber : 1 ,
                                isDeleted: 'false',
                                createdBy: userInput.user.clientId,
                                updatedBy: userInput.user.clientId,
                                qty: userInput['qty']
                                // qty: n == countNumber ? userInput['qty'] : '0'
                            };
                        // };
                        qty ? countItemQtyManager.createCountItemQty(qty, callback) : callback(err, data);
                    } else {
                        callback(err);
                    }
                });
            }
        }
    } catch (e) {
        console.log(e);
        callback('Error - Can not Update.');
    }
    /*for(var d=0; d<userInput.length; d++){
    if(userInput[d]._id){       
           var query                  = { _id: userInput[d]._id };
               userInput[d].isDeleted = false;

          countItemModel.findOneAndUpdate(query, userInput[d], {upsert:true},function(err,data){
            
            if(err){
              error = err;
            }
          });

      }else {
        countItemObject = new countItemModel(userInput[d]);
          countItemObject.save(function(err,data){
            
            if(err){
              error = err;
            }
          });
        }
        if(d == (userInput.length-1)){
           
          var countItem = new countItemModel(userInput);
          var id = userInput[0]['countId'];            
             countModel.findById(id).exec(function(error,data){
                if(!error){               
                var dir = data['directiveId'];
                var loc = data['locationId'];
                var sku=userInput['sku'];      
                var qty=userInput['qty'];

                var options = {
                  url: 'http://devsar.ovcdemo.com:3000/invtransactionservice',
                  headers: { 'authorization': header},
                  method: 'PUT',
                  form:  {'directivetype':dir,'locationid':loc,'sku':sku,'quantity':qty}
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

                }) // Request Call Ends.                   
                
              }else{
                console.log(error);
              }
            });
        }
    }*/
}
/*
 * edit countItem by id.
 */
function editCountItem(id, userInput, callback) {
    countItemModel.findById(id, function(err, sku) {
        if (sku) {
            if (!isNaN(parseFloat(sku.qty))) {
                var qty = {
                    countItemId: sku['_id'],
                    countNumber: userInput.countNumber,
                    updatedBy: userInput.user.clientId
                };
                userInput.old_qty = sku.qty;
            } else {
                var qty = {
                    countItemId: sku['_id'],
                    lineNumber: sku['lineNumber'],
                    countNumber: userInput.countNumber,
                    createdBy: userInput.user.clientId,
                    updatedBy: userInput.user.clientId
                };
            }
            if (userInput.hasOwnProperty('qty')) {
                qty.qty = (userInput.qty);
            }
            userInput['updatedBy'] = userInput.user.clientId;
            sku.update(userInput, function(err, data) {
                countItemQtyManager.updateCountItemQty(id, userInput.countNumber, qty, function(c, v) {
                    sku = null;
                    callback(c, userInput);
                    if (!userInput['noCountZoneStatus']) {
                        var openCountItem = 0;
                        var recountCountItem = 0;
                        var validatedCountItem = 0;
                        var inProcessCountItem = 0;
                        var submittedCountItem = 0;
                        var approvedCountItem = 0;
                        var modifiedCountItem = 0;
                        var countZoneStatus = null;
                        var openCountZone = 0;
                        var recountCountZone = 0;
                        var validatedCountZone = 0;
                        var inProcessCountZone = 0;
                        var submittedCountZone = 0;
                        var approvedCountZone = 0;
                        var modifiedCountZone = 0;
                        var countStatus = null;
                        countItemModel.find({
                            _id: id,
                            isDeleted: false
                        }, function(error, records) {
                            if (records.length > 0) {
                                var ZoneId = records[0]['zoneId'];
                                countItemModel.find({
                                    zoneId: records[0]['zoneId'],
                                    isDeleted: false
                                }, function(error, itemdata) {
                                    if (itemdata.length > 0) {
                                        for (var i = 0; i < itemdata.length; i++) {
                                            if (itemdata[i]['countStatus']) {
                                                if (itemdata[i]['countStatus'] == constant.countStatus.OPEN) {
                                                    openCountItem = openCountItem + 1;
                                                } else if (itemdata[i]['countStatus'] == constant.countStatus.RECOUNT) {
                                                    recountCountItem = recountCountItem + 1;
                                                } else if (itemdata[i]['countStatus'] == constant.countStatus.VALIDATED) {
                                                    validatedCountItem = validatedCountItem + 1;
                                                } else if (itemdata[i]['countStatus'] == constant.countStatus.INPROCESS) {
                                                    inProcessCountItem = inProcessCountItem + 1;
                                                } else if (itemdata[i]['countStatus'] == constant.countStatus.SUBMITTED) {
                                                    submittedCountItem = submittedCountItem + 1;
                                                } else if (itemdata[i]['countStatus'] == constant.countStatus.APPROVED) {
                                                    approvedCountItem = approvedCountItem + 1;
                                                } else if (itemdata[i]['countStatus'] == constant.countStatus.MODIFIED) {
                                                    modifiedCountItem = modifiedCountItem + 1;
                                                }
                                            }
                                        }
                                        if (openCountItem > 0 || recountCountItem > 0 || validatedCountItem > 0 || inProcessCountItem > 0 || submittedCountItem > 0 || approvedCountItem > 0 || modifiedCountItem > 0) {
                                            if (itemdata.length == (openCountItem + recountCountItem + validatedCountItem + inProcessCountItem + submittedCountItem + approvedCountItem + modifiedCountItem)) {
                                                countZoneStatus = constant.countStatus.OPEN;
                                            }
                                            if (itemdata.length == (recountCountItem + validatedCountItem + inProcessCountItem + submittedCountItem + approvedCountItem + modifiedCountItem)) {
                                                countZoneStatus = constant.countStatus.RECOUNT;
                                            }
                                            if (itemdata.length == (validatedCountItem + inProcessCountItem + submittedCountItem + approvedCountItem + modifiedCountItem)) {
                                                countZoneStatus = constant.countStatus.VALIDATED;
                                            }
                                            if (itemdata.length == (inProcessCountItem + submittedCountItem + approvedCountItem + modifiedCountItem)) {
                                                countZoneStatus = constant.countStatus.INPROCESS;
                                            }
                                            if (itemdata.length == (submittedCountItem + approvedCountItem + modifiedCountItem)) {
                                                countZoneStatus = constant.countStatus.SUBMITTED;
                                            }
                                            if (itemdata.length == (approvedCountItem + modifiedCountItem)) {
                                                countZoneStatus = constant.countStatus.APPROVED;
                                            }
                                            if (itemdata.length == modifiedCountItem) {
                                                countZoneStatus = constant.countStatus.MODIFIED;
                                            }
                                            if (countZoneStatus != null) {
                                                var query = {
                                                    _id: ZoneId
                                                };
                                                var dataToInsert = {
                                                    countStatus: countZoneStatus
                                                };
                                                countZoneModel.findOneAndUpdate(query, dataToInsert, {
                                                    upsert: true
                                                }, function(er, countZoneUpdatedata) {
                                                    if ((countZoneUpdatedata) && (countZoneUpdatedata.countId)) {
                                                        var CountId = countZoneUpdatedata.countId;
                                                        countZoneModel.find({
                                                            countId: countZoneUpdatedata.countId,
                                                            isDeleted: false
                                                        }, function(countZoneErr, countZonedata) {
                                                            if (countZonedata.length > 0) {
                                                                for (var i = 0; i < countZonedata.length; i++) {
                                                                    if (countZonedata[i]['countStatus']) {
                                                                        if (countZonedata[i]['countStatus'] == constant.countStatus.OPEN) {
                                                                            openCountZone = openCountZone + 1;
                                                                        } else if (countZonedata[i]['countStatus'] == constant.countStatus.RECOUNT) {
                                                                            recountCountZone = recountCountZone + 1;
                                                                        } else if (countZonedata[i]['countStatus'] == constant.countStatus.VALIDATED) {
                                                                            validatedCountZone = validatedCountZone + 1;
                                                                        } else if (countZonedata[i]['countStatus'] == constant.countStatus.INPROCESS) {
                                                                            inProcessCountZone = inProcessCountZone + 1;
                                                                        } else if (countZonedata[i]['countStatus'] == constant.countStatus.SUBMITTED) {
                                                                            submittedCountZone = submittedCountZone + 1;
                                                                        } else if (countZonedata[i]['countStatus'] == constant.countStatus.APPROVED) {
                                                                            approvedCountZone = approvedCountZone + 1;
                                                                        } else if (countZonedata[i]['countStatus'] == constant.countStatus.MODIFIED) {
                                                                            modifiedCountZone = modifiedCountZone + 1;
                                                                        }
                                                                    }
                                                                }
                                                                // if (openCountZone > 0 || recountCountZone > 0 || validatedCountZone > 0 || inProcessCountZone > 0 || submittedCountZone > 0 || approvedCountZone > 0 || modifiedCountZone > 0) {
                                                                //     if (countZonedata.length == (openCountZone + recountCountZone + validatedCountZone + inProcessCountZone + submittedCountZone + approvedCountZone + modifiedCountZone)) {
                                                                //         countStatus = constant.countStatus.OPEN;
                                                                //     }
                                                                //     if (countZonedata.length == (recountCountZone + validatedCountZone + inProcessCountZone + submittedCountZone + approvedCountZone + modifiedCountZone)) {
                                                                //         countStatus = constant.countStatus.RECOUNT;
                                                                //     }
                                                                //     if (countZonedata.length == (validatedCountZone + inProcessCountZone + submittedCountZone + approvedCountZone + modifiedCountZone)) {
                                                                //         countStatus = constant.countStatus.VALIDATED;
                                                                //     }
                                                                //     if (countZonedata.length == (inProcessCountZone + submittedCountZone + approvedCountZone + modifiedCountZone)) {
                                                                //         countStatus = constant.countStatus.INPROCESS;
                                                                //     }
                                                                //     if (countZonedata.length == (submittedCountZone + approvedCountZone + modifiedCountZone)) {
                                                                //         countStatus = constant.countStatus.SUBMITTED;
                                                                //     }
                                                                //     if (countZonedata.length == (approvedCountZone + modifiedCountZone)) {
                                                                //         countStatus = constant.countStatus.APPROVED;
                                                                //     }
                                                                //     if (countZonedata.length == modifiedCountZone) {
                                                                //         countStatus = constant.countStatus.MODIFIED;
                                                                //     }
                                                                //     if (countStatus != null) {
                                                                //         var query = {
                                                                //             _id: CountId
                                                                //         };
                                                                //         var dataToInsert = {
                                                                //             countStatus: countStatus
                                                                //         };
                                                                //         countModel.findOneAndUpdate(query, dataToInsert, {
                                                                //             upsert: true
                                                                //         }, function(countError, countData) {});
                                                                //     }
                                                                // }
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            });
        }
    });
}
/*
 * update On Hand.
 */
function updateOH(query, input, callback) {
    countItemModel.update(query, input, {
        // upsert: true
        multi: true
    }, function(err, Updatedata) {
        // countItemModel.findById(id);
        callback(err, Updatedata);
    });
}
/*
 * delete countItem by id.
 */
function deleteCountItem(data, callback) {

  if (data && data.countId && data.zoneId) {
    var searchCond = {
      countId: data.countId,
      zoneId: data.zoneId
    };
    lodash.extend(searchCond, {
      isDeleted: false
    });
    if (data.id) {
      lodash.extend(searchCond, {
        _id: data.id
      });
    }
    countManager.getCount({
        id: data.countId,
        user: data.user
      }, function(err, count) {

        if (err) {
          return callback(err, '');
        }
        countItemModel.find(searchCond).lean().exec(function(err, itemData) {
          if (itemData) {
            try {
              itemData.forEach(function(item) {
                item.old_qty = item.qty;
                item.delete = true;
                item.qty = 0;
              });
            } catch (ex) {
              utils.errorTrace(ex);
            }
            countItemModel.update(searchCond, {
              isDeleted: true,
              updatedBy: data.user.clientId
            }, {
              multi: true
            }).exec(function(error, updateData) {
              if (updateData) {
                countsnapshotModel.findOne({
                  countId: data.countId
                }).lean().exec(function(err, itemDisc) {
                  if (itemDisc && itemDisc.count_item_discrepancy && itemDisc.count_item_discrepancy.length) {
                    countManager.addSnapShotDisc(data.user, count, itemData, itemDisc, function(err, result) {
                      itemDisc = null;
                      if (err)
                        utils.errorTrace(err);
                      return callback(err, updateData);
                    });
                  } else {
                    callback(error, updateData);
                  }
                });
              } else {
                callback(error, updateData);
              }
            });
          } else {
            callback('No data');
          }
        });
      });
      } else {
        callback('No data');
      }
}


function getCountItems(userInput, callback){
    var recountZoneIds = userInput['recountZoneIds'];

    countItemModel.distinct('_id',{zoneId:{$in:recountZoneIds}}).exec(function(err,countItems){
        if(err)
            callback(err,'');
        else
            callback('',countItems);
    });
}

function getCountSKUData(skuData, callback) {

    if (skuData) {
        try {
            var query = {
                sku: {
                    '$in': skuData.sku
                }, "isDeleted": false,
                "noApproval": false,
                countId: +skuData.countId
            };
            countItemModel.aggregate([{$match: query}, {
                $group: {
                    _id: null,
                    "sku": {
                        "$push": "$sku"
                    }
                }
            }
            ]).exec(callback);
        }
        catch
            (e) {
            utils.errorTrace(e);
            callback('Error - Can not Get Data.');
        }

    }
    else {
        callback('No data');
    }
}
