var express = require('express');
var log = require('../log');
var countZoneModel = require('./../model/countZoneModel');
var countItemQtyModel = require('./../model/countItemQtyModel');
var countItemModel = require('./../model/countItemModel');
var countsnapshotSchema = require('./../model/countsnapshotModel');
var countsnapshotModel = countsnapshotSchema.countsnapshotSchema;
var countModel = require('./../model/countModel');
var router = express.Router();
var constant = require('../../config/const.json');
var utils = require('./utils');
var countItemQtyManager = require('./countItemQtyManager');
var lo = require('lodash');

module.exports = {
    recount: recount
};
/*
 * Create Recount By CountItemId
 */
function recount(userInput, callback) {
    // var zoneId = userInput['zoneId'];
    var countId = userInput['countId'];
    var countType = userInput['countType'];
    var recountNumber = userInput['recountNumber'];
    var recordsUpdated = 0;
    var count = 0;

    if(countType === constant.countType.physicalCount || countType === constant.countType.cycleCount){
     var zoneId = userInput['zoneId'].split(',');
        if (zoneId.length > 0 && countId) {
                var zonequery = {
                    _id: { $in: zoneId},
                    countId: countId,
                    isDeleted: false
                };
                var countItemQuery = {
                    zoneId: { $in: zoneId},
                    countId: countId,
                    isDeleted: false
                };
                var zonedata = {
                    countStatus: constant.countStatus.RECOUNT,
                    updatedBy: userInput.user.clientId,
                    qty: 0,
                    scanQty:0
                };
                if(countType === constant.countType.physicalCount ){
                    
                    zonedata.skuQty = 0;
                }
                zonedata.isDeleted = false;

                countZoneModel.findOne(zonequery).exec(function(err,zoneData){
                    if(err){
                        utils.errorTrace(err);
                        return callback(err);
                    }
                    else{
                        if(zoneData.countStatus == constant.countStatus.VALIDATED){
                            if(zoneData.recountNumber < recountNumber){
                                zonedata.recountNumber = recountNumber;
                                if(zonedata.recountNumber > constant.maxRecountNumber){
                                   return callback("Recount limit exceeded");
                                }else{
                                    countZoneModel.update(zonequery, zonedata, {
                                        multi: true
                                    }, function(zoneErr, zoneData) {
                                        var countItemQuery = {
                                            zoneId: { $in: zoneId},
                                            countId: countId,
                                            isDeleted: false
                                        };
                                        countItemModel.find(countItemQuery).lean().exec(function(error,countItemData){
                                            if(error){
                                                utils.errorTrace(error);
                                            }
                                            else{
                                                countItemModel.update(countItemQuery, {$set:zonedata}, {
                                                    multi: true
                                                }, function(updateErr, updateData) {
                                                    if(updateErr){
                                                        utils.errorTrace(updateErr);
                                                    }else{
                                                        if(countType === constant.countType.cycleCount){
                                                            var qty= [];
                                                            countItemData.forEach(function(sku, n) {
                                                                if(!sku['noApproval']){
                                                                    qty.push({
                                                                        countItemId: sku['_id'],
                                                                        lineNumber: sku['lineNumber'],
                                                                        countNumber: zonedata.recountNumber,
                                                                        createdBy: userInput.user.clientId,
                                                                        updatedBy: userInput.user.clientId
                                                                    });
                                                                }
                                                            });
                                                            countItemQtyManager.createCountItemQty(qty, function (error,qtyData) {
                                                            });
                                                        }
                                                        countsnapshotModel.findOne({countId: countId}, {'count_snapshot':0}).lean().exec(function(err, item_disc) {
                                                            // if(item_disc.count_item_discrepancy)
                                                            if(err){
                                                                utils.errorTrace(err);
                                                            }else{
                                                                var discData = item_disc.count_item_discrepancy;

                                                                var updateDiscData = [];

                                                                countItemData = utils.arrayToKeyValueObj({array_val: countItemData, key:"sku"});
                                                                discData.forEach(function(value){
                                                                    var ohvalue = value.oh?value.oh:0;
                                                                    if(countType === constant.countType.physicalCount && zoneId.length > 0 && value.zoneData){
                                                                        var zoneArr = [];
                                                                        value.zoneData.forEach(function(zoneValue){
                                                                            if(zoneId.indexOf(zoneValue)<0){
                                                                                zoneArr.push(zoneValue);
                                                                            }
                                                                        });
                                                                        value.zoneData = zoneArr;
                                                                    }

                                                                    if(countItemData[value.sku] && countItemData[value.sku]['qty'] <= value.qty){
                                                                        value.qty = value.qty - countItemData[value.sku]['qty'];
                                                                    }else if(countItemData[value.sku] && countItemData[value.sku]['qty'] >= value.qty){
                                                                        value.qty = 0;
                                                                     }
                                                                     value.discrepancy = (value.qty - ohvalue);
                                                                     updateDiscData.push(value);
                                                                });
                                                                var update_data = {
                                                                    count_item_discrepancy : updateDiscData
                                                                }
                                                                countsnapshotModel.update({countId: countId}, update_data, callback);
                                                            }
                                                            
                                                        });
                                                    }
                                                    
                                                });
                                            }
                                        })
                                        
                                    });
                                }
                            }else{
                                return callback("Recount Number is must be greater than Previous recount value");
                            }
                        }else{
                            return callback("Count Status Should be Validated.");
                        }
                        
                    }
                });
        } else {
            callback("countId & zoneId are Required");
        }
    }else{
        callback("Can't produce recount in other counts");
    }

}
