var express = require('express');
var log = require('../log');
var adjustmentModel = require('./../model/adjustmentModel');
var adjustmentItemModel = require('./../model/adjustmentItemModel');
var adjustmentItemManager   =   require('./../manager/adjustmentItemManager');
var utils = require('./utils');
var constant = require('../../config/const.json');
var env_config = require('../../config/config.js');
var request = require('request');
var lo = require('lodash');
var async   =   require('async');
var router = express.Router();
lo.extend(module.exports, {
    getAdjustment: getAdjustment,
    createAdjustment: createAdjustment,
    editAdjustment: editAdjustment,
    deleteAdjustment: deleteAdjustment,
    getAdjustmentData: getAdjustmentData,
    copyAdjustment: copyAdjustment
});
/***********************************************************************
 *
 * FUNCTION:    getAdjustment
 *
 * DESCRIPTION: For get Adjustment based on user input.
 *
 * PARAMETERS:  "" or "id" or "fromdate" or "toDate" or "adjustmentName" or 
                "adjustmentCode" or "orderNumber" or 
                "storeId" or "pageOffSet" or "page_lmt".
 *
 * RETURNED:    returns Adjustment details based on the input params.
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         22/03/2016    1.0.0       First Version
 *
 ***********************************************************************/
function getAdjustment(userInput, callback) {
    var id = userInput['id'];
    var fromDate = userInput['fromdate'];
    var toDate = userInput['todate'];
    var adjustmentName = userInput['adjustmentName'];
    var adjustmentNumber = userInput['adjustmentNumber'];
    var adjustmentCode = userInput['adjustmentCode'];
    var adjustmentStatus = userInput['adjustmentStatus'];
    var orderNumber = userInput['orderNumber'];
    var storeId = userInput['store'];
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
    console.log('url', env_config.dashPath + constant.apis.GETUSERLOCATION + userInput.user.clientId);
    request(env_config.dashPath + constant.apis.GETUSERLOCATION + userInput.user.clientId, function(err, response, data) {
        try {
            if (data) {
                var loc = JSON.parse(data);
                for (var num = loc.length - 1; num >= 0; num--) {
                    locArray.push(loc[num].id);
                }
                // Object.keys(loc.hierarchy).forEach(function(n) {
                //     locArray.push(loc.hierarchy[n].id);
                // });
            }
        } catch (ex) {
            return callback('can not load user data.');
        }
        if (id) {
            var orcond = [];
            orcond.push({
                "storeId": {
                    "$in": locArray
                }
            });
            condition["$and"].push({
                '$or': orcond
            });
            condition["$and"].push({
                "_id": id
            });
            adjustmentModel.findOne(condition).populate('reversalAdjustmentNumber').populate('originalAdjustmentNumber').exec(callback);
        } else if (adjustmentName || orderNumber || adjustmentNumber || adjustmentCode || adjustmentStatus || fromDate || toDate || storeId || sku || asnNo || frmQty || toQty || frmPrice || toPrice) {
            var query = JSON.parse('{"isDeleted" : false}');
            if (adjustmentName) {
                query['adjustmentName'] = new RegExp('^' + adjustmentName + '$', "i");
            }
            if (orderNumber) {
                query['orderNumber'] = new RegExp(orderNumber, "g");
            }
            if (adjustmentCode) {
                query['adjustmentCode'] = new RegExp('^' + adjustmentCode + '$', "i");
            }
            if (adjustmentStatus) {
                query['adjustmentStatus'] = {
                    '$in': adjustmentStatus.split(',')
                };
            }
            if (storeId) {
                query['storeId'] = { '$in' : storeId.split(',') };
            }
            if (adjustmentNumber) {
                query['adjustmentNumber'] = new RegExp(adjustmentNumber, "g");
            }
            if (fromDate || toDate) {
                if (fromDate && toDate) {
                        fromDate = new Date(fromDate);
                        fromDate.setHours(0,0,0);
                        fromDate = fromDate.toISOString();
                        toDate = new Date(toDate);
                        toDate.setHours(23,59,59);
                        toDate = toDate.toISOString();
                        query['created'] = {
                            '$gte': fromDate,
                            '$lte': toDate
                        };
                } else if (toDate) {
                    toDate = new Date(toDate);
                    toDate = toDate.toISOString();
                    query['created'] = {
                        '$lte': toDate
                    };
                } else {
                    fromDate = new Date(fromDate);
                    fromDate = fromDate.toISOString();
                    query['created'] = {
                        '$gte': fromDate
                    };
                }
            }
            var orcond = [];
            orcond.push({
                "storeId": {
                    "$in": locArray
                }
            });
            condition["$and"].push({
                '$or': orcond
            });
            console.log(query);
            condition["$and"].push(query);
            adjustmentModel.find(condition, {
                "adjustmentNumber": 1,
                "numberOfSKU": 1,
                "totalAdjustmentCost": 1
            }).sort({
                'lastModified': -1
            }).exec(function(err, adjust_data) {
                advanceSearch(userInput, adjust_data, function(error, advSrchCond) {
                    if (error) {
                        utils.errorTrace(error);
                        return callback(error);
                    }
                    if (advSrchCond)
                        condition["$and"].push(advSrchCond);
                    adjustmentModel.find(condition).sort({
                        'lastModified': -1
                    }).skip(page_offset).limit(page_lmt).populate('reversalAdjustmentNumber').populate('originalAdjustmentNumber').exec(function(err, adjustment_data) {
                        adjustmentModel.find(condition).count().exec(function(err, total_count) {
                            callback(err, {
                                adjustment_data: adjustment_data,
                                total_count: total_count
                            });
                        });
                    });
                });
            });
        } else {
            var orcond = [];
            orcond.push({
                "storeId": {
                    "$in": locArray
                }
            });
            condition["$and"].push({
                '$or': orcond
            });
            adjustmentModel.find(condition).sort({
                'lastModified': -1
            }).skip(page_offset).limit(page_lmt).populate('reversalAdjustmentNumber').populate('originalAdjustmentNumber').exec(function(err, adjustment_data) {
                adjustmentModel.find(condition).count().exec(function(err, total_count) {
                    callback(err, {
                        adjustment_data: adjustment_data,
                        total_count: total_count
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
/***********************************************************************
 *
 * FUNCTION:    createAdjustment
 *
 * DESCRIPTION: To create Adjustment for the userInput.
 *
 * PARAMETERS:  "userInput" and callback.
 *
 * RETURNED:    null
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         22/03/2016    1.0.0       First Version
 *   Ratheesh     4/08/2016    2.0.0       adjustmentStatus update.
 *   Ratheesh     23/08/2016    2.0.0       delNotNovalue update.
 *
 ***********************************************************************/
function createAdjustment(userInput, callback) {
    if (userInput['isReversal']) {
        userInput['originalAdjustmentNumber'] = userInput['isReversal'];
        var adsts = userInput['adjustmentStatus'] == 'rvs_draft' ? 'reversed_draft' : 'reversed';
        adjustmentModel.findOneAndUpdate({
            '_id': userInput['isReversal']
        }, {
            $set: {
                'isReversed': true,
                adjustmentStatus: adsts,
                reversedBy: userInput.user.clientId
            }
        }).exec(function(err, data) {});
    }
    var token = utils.uid(7);
    if (userInput.user) {
        userInput['createdBy'] = userInput.user.clientId;
        userInput['updatedBy'] = userInput.user.clientId;
    }
    userInput['adjustmentNumber'] = token;
    var noArr = ['adjustmentSubtotal', 'totalAdjustmentCost', 'totalAdjustmentVAT', 'totalAdjustmentTax'];
    delNotNovalue(userInput, noArr);
    try {
        userInput = JSON.parse(JSON.stringify(userInput));
    }
    catch (e) {
        console.log("Error_:",e);
        return callback(e);
    }
    var adjustment = new adjustmentModel(userInput);
    adjustment.save(function(err, data) {
        callback(err, data);
        if (userInput['isReversal'] && data) {
            adjustmentModel.findOneAndUpdate({
                '_id': userInput['isReversal']
            }, {
                $set: {
                    'reversalAdjustmentNumber': data['_id']
                }
            }).exec(function(err, data) {});
        }
    });
}
/***********************************************************************
 *
 * FUNCTION:    editAdjustment
 *
 * DESCRIPTION: To edit Adjustment for the userInput.
 *
 * PARAMETERS:  "id", "userInput" and callback.
 *
 * RETURNED:    null
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         22/03/2016    1.0.0       First Version
 *   Ratheesh     4/08/2016    2.0.0       adjustmentStatus update.
 *
 ***********************************************************************/
function editAdjustment(id, userInput, callback) {

    userInput['updatedBy'] = userInput.user.clientId;

    //constructing data object to push in response data
    dataObj =   {};
    dataObj.adjustmentNumber   =   userInput['adjustmentNumber'];
    dataObj.adjustmentCode     =   userInput['adjustmentCode'];
    dataObj.adjustmentName     =   userInput['adjustmentName'];
    dataObj.ReasonCodeID       =   userInput['ReasonCodeID'];
    dataObj.adjustmentStatus   =   userInput['adjustmentStatus'];
    dataObj.storeId            =   userInput['storeId'];
    dataObj.created            =   userInput['created'];
    dataObj.createdBy          =   userInput['createdBy'];
    dataObj.updatedBy          =   userInput['updatedBy'];

    var adjustment = adjustmentModel.findById(id);

    if (adjustment) {

        var noArr = ['adjustmentSubtotal', 'totalAdjustmentCost', 'totalAdjustmentVAT', 'totalAdjustmentTax'];

        delNotNovalue(userInput, noArr);

        adjustment.exec(function(err, adjustmentdata) {

            if (userInput.user) {
                userInput['updatedBy'] = userInput.user.clientId;
            }

            adjustment.update(userInput, function(err, data) {

                if (data && userInput['adjustmentStatus'] == 'adjusted_rvs' && adjustmentdata.originalAdjustmentNumber) {
                    adjustmentModel.findOneAndUpdate({
                        '_id': adjustmentdata.originalAdjustmentNumber
                    }, {
                        $set: {
                            adjustmentStatus: 'reversed'
                        }
                    }).exec(function(err, data) {});
                }

                //pushing adjustment data into response data
                data.dataObj    =   dataObj;
                var resultObj   =   {};
                resultObj.data  =   data;
                resultObj.adjustmentStatus =  userInput['adjustmentStatus'];

                function sendResult() {
                    if (userInput['adjustmentStatus'] != "Draft") {
                        adjustmentItemManager.getAdjustmentItem({
                            adjustmentNumber: adjustmentdata.adjustmentNumber
                        }, function(err, data){
                            var tranArr = [];
                            async.forEach(data.item_data, function(adjustItem, async_callback){
                                var dataobj  =  {};

                                dataobj.sku                 =   adjustItem['SKU'];
                                dataobj.adjustmentNumber    =   adjustItem['adjustmentNumber'];
                                dataobj.locationid          =   userInput['storeId'];
                                dataobj.quantity            =   adjustItem['qty'];
                                dataobj.cost                =   adjustItem['productCost'];
                                dataobj.warehouseid         =   userInput['storeId'];
                                dataobj.transtypeid         =   adjustmentdata['adjustmentName'];
                                dataobj.stockUOM            =   adjustItem['producUom'];

                                tranArr.push(dataobj);
                                async_callback();
                            }, function(){
                                resultObj.tranArr = tranArr;
                                callback(err, resultObj);
                            });
                        });
                    }
                    else
                        callback(err, resultObj);
                }

                if(userInput.export_config && 
                    (userInput.export_config.isPublish === 'true' || userInput.export_config.isPublish === true) &&
                    (userInput.export_config.status && userInput.export_config.status.indexOf(userInput['adjustmentStatus']) != -1))
                {
                    var adjustExportObj     =   {};

                    adjustExportObj.adjustmentNumber   =   adjustmentdata.adjustmentNumber;
                    // adjustExportObj.adjustmentCode     =   adjustmentdata.adjustmentCode;
                    // adjustExportObj.adjustmentName     =   adjustmentdata.adjustmentName;
                    // adjustExportObj.reasonCode         =   adjustmentdata.ReasonCodeID;
                    adjustExportObj.status             =   userInput.adjustmentStatus;
                    adjustExportObj.storeId            =   userInput.storeId;
                    adjustExportObj.created            =   adjustmentdata.created;
                    adjustExportObj.createdBy          =   adjustmentdata.createdBy;
                    adjustExportObj.updatedBy          =   userInput.updatedBy;
                    adjustExportObj.adjustment         =   [];

                    adjustExportObj.adjustment.push({
                        adjustmentCode: userInput.adjustmentCode,
                        reasonCode: userInput.ReasonCodeID,
                        adjustmentName: userInput.adjustmentName
                    });

                    adjustmentItemManager.jmsPublishCall(adjustExportObj, function(err, export_data){
                        resultObj.adjustExportObj = export_data;
                        sendResult();
                    });

                }
                else {
                    sendResult();
                }
            });

        });
    }
}
/***********************************************************************
 *
 * FUNCTION:    deleteAdjustment
 *
 * DESCRIPTION: To delete Adjustment for the userInput.
 *
 * PARAMETERS:  "userInput" and callback.
 *
 * RETURNED:    null
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         22/03/2016    1.0.0       First Version
 *
 ***********************************************************************/
function deleteAdjustment(data, callback) {
    editAdjustment(data.id, {
        isDeleted: true,
        user: data.user
    }, function(err, adjustment) {
        if(adjustment) {
            adjustmentItemManager.updateDeletedAdjustItem(data, callback);
        }
    });
};

function advanceSearch(userInput, orderData, callback) {
    var sku = userInput['sku'];
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
    if (sku || frmQty || toQty || frmPrice || toPrice) {
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
                        adjustmentItemModel.find(temp_cond).exec(function(err, itemData) {
                            var orderNumberArr = [];
                            if (itemData && itemData.length) {
                                for (var item = itemData.length - 1; item >= 0; item--) {
                                    orderNumberArr.push(itemData[item].adjustmentNumber);
                                }
                            }
                            result_obj["adjustmentNumber"] = {
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
                if (frmQty || toQty) {
                    var temp_cond = {};
                    temp_cond['numberOfSKU'] = {};
                    if (frmQty)
                        temp_cond['numberOfSKU']['$gte'] = +frmQty;
                    if (toQty)
                        temp_cond['numberOfSKU']['$lte'] = +toQty;
                    callback(null, temp_cond);
                }
                else {
                    callback(null, {});
                }
            },
            function(callback) {
                if (frmPrice || toPrice) {
                    var temp_cond = {};
                    temp_cond['totalAdjustmentCost'] = {};
                    if (frmPrice)
                        temp_cond['totalAdjustmentCost']['$gte'] = +frmPrice;
                    if (toPrice)
                        temp_cond['totalAdjustmentCost']['$lte'] = +toPrice;
                    callback(null, temp_cond);
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

/***********************************************************************
 *
 * FUNCTION:    getAdjustment
 *
 * DESCRIPTION: For get Adjustment based on user input.
 *
 * PARAMETERS:  "" or "id" or "fromdate" or "toDate" or "adjustmentName" or 
                "adjustmentCode" or "orderNumber" or 
                "storeId" or "pageOffSet" or "page_lmt".
 *
 * RETURNED:    returns Adjustment details based on the input params.
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         31/10/2016    1.0.0       First Version
 *
 ***********************************************************************/
function getAdjustmentData(userInput, callback) {
    var condition = {};
    var project_field = {};
    var result = {};
    var locArray = [];
    condition["$and"] = [];
    condition["$and"].push({
        isDeleted: false
    });
    console.log('url', env_config.dashPath + constant.apis.GETUSERLOCATION + userInput.user.clientId);
    request(env_config.dashPath + constant.apis.GETUSERLOCATION + userInput.user.clientId, function(err, response, data) {
        try {
            if (data) {
                var loc = JSON.parse(data);
                for (var num = loc.length - 1; num >= 0; num--) {
                    locArray.push(loc[num].id);
                }
                // Object.keys(loc.hierarchy).forEach(function(n) {
                //     locArray.push(loc.hierarchy[n].id);
                // });
            }
        } catch (ex) {
            return callback('can not load user data.');
        }
        var orcond = [];
        orcond.push({
            "storeId": {
                "$in": locArray
            }
        });
        condition["$and"].push({
            '$or': orcond
        });

        project_field.adjustmentNumber = 1;
        project_field.orderNumber = 1;

        adjustmentModel.find(condition, project_field).sort({
            'lastModified': -1
        }).exec(function(err, adjustmentData){
            if(err) {
                result.status = constant.label.ERROR;
                result.message = err;
                return callback(err, result);
            }
            result.status = constant.label.SUCCESS;
            result.adjustmentData = adjustmentData;
            callback('', result);
        });
    });
}


/**********************************************************************************
 *
 * FUNCTION:    copyAdjustment
 *
 * DESCRIPTION: copy and saves Adjustment.
 *
 * PARAMETERS:  adjustmentNumber, page_offset, page_limit and callback.
 *
 * RETURNED:    current_offset, page_limit, item_data, adjustment_data.
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         17/07/2017    1.0.0       First Version
 *
 **********************************************************************************/
function copyAdjustment (payload, callback) {
    var adjustmentNumber = payload.adjustmentNumber;
    adjustmentModel.findOne({
        adjustmentNumber: adjustmentNumber,
        isDeleted: false
    }, {
        _id: 0,
        createdBy: 0,
        updatedBy: 0,
        created: 0,
        lastModified: 0,
        __v: 0
    }).exec(function(err, adjustmentData){

        if (err)
            return callback(err);

        if(adjustmentData) {
            adjustmentData["adjustmentStatus"] = "Draft";
            adjustmentData["user"] = payload.user;
            createAdjustment(adjustmentData, function(err, savedData){

                if (err)
                    return callback(err);

                adjustmentItemManager.copyAdjustmentItem({
                    existAdjustment: adjustmentNumber,
                    user: payload.user,
                    newAdjustment: savedData.adjustmentNumber,
                    page_lmt: payload.page_lmt
                }, function(err, itemDataSaved){

                    if (err)
                        return callback("Failed to save item data");

                    callback(err, {
                        adjustment_data: savedData,
                        item_result: itemDataSaved
                    });

                });

            });
        } else {
            return callback("No adjustment found");
        }

    });
}
