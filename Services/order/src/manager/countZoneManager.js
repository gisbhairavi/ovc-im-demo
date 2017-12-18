var express = require('express');
var log = require('../log');
var countModel = require('./../model/countModel');
var countZoneModel = require('./../model/countZoneModel');
var countItemModel = require('./../model/countItemModel');
var constant = require('../../config/const.json');
var countItemManager = require('./countItemManager');
var countItemQtyManager = require('./countItemQtyManager');

var router = express.Router();
var async = require('async');

module.exports = {
    getCountZone: getCountZone,
    createCountZone: createCountZone,
    editCountZone: editCountZone,
    deleteCountZone: deleteCountZone
};
/*
 * GET countZone by countZoneId.
 */
function getCountZone(userInput, callback) {
    var id = userInput['id'];
    var countId = userInput['countid'];
    var page_offset = 0;
    var page_lmt = 0;
    if (userInput['page_offset'] && userInput['page_lmt']) {
        page_offset = parseInt(userInput['page_offset']) || 0;
        page_lmt = parseInt(userInput['page_lmt']) || 10;
    }
    if (id) {
        countZoneModel.findById(id).exec(callback);
    } else if (countId) {
        var query = JSON.parse('{"isDeleted" : false}');
        query['countId'] = new RegExp('^' + countId + '$', "i");
        countZoneModel.find(query, {_id: 0, id: 1}).exec(function(err, total_zone_data) {
            if ( !err ) {

                var total_count =   total_zone_data.length;

                getZoneIds (total_zone_data, total_count, function(zoneIdArr){
                    countZoneModel.find(query).sort({
                        'id': 1,
                        'startDate': -1
                    }).skip(page_offset).limit(page_lmt).exec(function(err, zone_data) {

                        var recountZoneIds = [];
                        zone_data.forEach(function(zoneValue){
                            if(!zoneValue.recountNumber)
                                recountZoneIds.push(zoneValue._id);
                        });


                        var countItemQuery = {
                            recountZoneIds:recountZoneIds
                        };
                        if(recountZoneIds.length > 0 ){
                            countItemManager.getCountItems(countItemQuery,function(error,countItems){
                                if(error)
                                    callback(error);
                                else{
                                    try{
                                        var countItemQtyQuery ={
                                            countItems:countItems
                                        };
                                        countItemQtyManager.getCountItemQty(countItemQtyQuery,function(error,countItemQty){
                                            if(error)
                                                callback(error);
                                            else{
                                                try{
                                                    var countZoneData = [];
                                                    zone_data.forEach(function(zoneValue){
                                                        if(zoneValue.recountNumber){
                                                            zoneValue = JSON.parse(JSON.stringify(zoneValue));
                                                            countZoneData.push(zoneValue);
                                                        }else{
                                                            zoneValue = JSON.parse(JSON.stringify(zoneValue));
                                                            zoneValue.recountNumber = countItemQty[0].countNumber;
                                                            countZoneData.push(zoneValue);
                                                        }
                                                    });
                                                        callback(err, {
                                                            status: constant.label.SUCCESS,
                                                            zone_data: countZoneData,
                                                            total_count: total_count,
                                                            zone_names: zoneIdArr
                                                        });
                                                }catch(error){
                                                    callback(error);
                                                }
                                            }
                                        });
                                    }catch(error){
                                        callback(error);
                                    }
                                }
                            });
                        }else{
                            callback(err, {
                                    status: constant.label.SUCCESS,
                                    zone_data: zone_data,
                                    total_count: total_count,
                                    zone_names: zoneIdArr
                                });
                        }


                        // async.map(zone_data,function(zoneValue,done){
                        //     if(zoneValue.recountNumber){
                        //         zoneValue = JSON.parse(JSON.stringify(zoneValue));
                        //         done(null, zoneValue); 
                        //     }else{
                        //         countItemModel.distinct('_id',{zoneId:zoneValue._id}).exec(function(err,counts){
                        //             if(err)
                        //                 done(err,'');
                        //             else{
                        //                countItemQtyModel.find({countItemId:{ $in: counts}}).sort({"countNumber":-1}).limit(1).exec(function(err,countItemQty){
                        //                 if(countItemQty.length > 0){
                        //                         zoneValue = JSON.parse(JSON.stringify(zoneValue));
                        //                         zoneValue.recountNumber = countItemQty[0].countNumber;
                        //                         done(null, zoneValue); 
                        //                 }else{
                        //                     zoneValue = JSON.parse(JSON.stringify(zoneValue));
                        //                     zoneValue.recountNumber = 1;
                        //                     done(null, zoneValue); 
                        //                 }
                        //                });
                        //             }
                        //         });
                        //     }
                        // },
                        // function(err,results){
                        //     callback(err, {
                        //             status: constant.label.SUCCESS,
                        //             zone_data: results,
                        //             total_count: total_count,
                        //             zone_names: zoneIdArr
                        //         });
                        // });

                        // callback(err, {
                        //     status: constant.label.SUCCESS,
                        //     zone_data: zone_data,
                        //     total_count: total_count,
                        //     zone_names: zoneIdArr
                        // });
                    });
                })

            }
            else {
                callback('', {
                    status: constant.label.ERROR,
                    message: err
                });
            }
        });
    } else {
        callback("countId is Required");
    }
}

function getZoneIds(zoneData, total_count, zone_callback) {

    var zoneIdArr = [];

    for (var num = total_count - 1; num >= 0; num--) {
        zoneIdArr.push(zoneData[num].id);
    }

    zone_callback (zoneIdArr);

}

/*
 * create countZone.
 */
function createCountZone(userInput, callback) {
    userInput['createdBy'] = userInput.user.clientId;
    userInput['updatedBy'] = userInput.user.clientId;
    var countZone = new countZoneModel(userInput);
    countZone.save(callback);
}
/*
 * edit countZone by id.
 */
function editCountZone(id, userInput, callback) {
    var openCountZone = 0;
    var recountCountZone = 0;
    var validatedCountZone = 0;
    var inProcessCountZone = 0;
    var submittedCountZone = 0;
    var approvedCountZone = 0;
    var modifiedCountZone = 0;
    var countStatus = null;
    if (userInput['skuQty']) {
        userInput['skuQty'] = parseInt(userInput['skuQty']);
    } else {
        // userInput['skuQty'] = 0;
    }
    delete userInput['id'];

    if (userInput['zoneId']) {
        userInput['id'] = userInput['zoneId'];
    }
    
    var zoneIdInput = id;
    countZoneModel.findById(id, function(err, data) {
        if (data) {
            userInput['updatedBy'] = userInput.user.clientId;
            countZoneModel.update({
                _id: data._id
            },  userInput, function(err, countZoneData) {
                var dataToInsert = {
                    $set: {
                        countStatus: userInput['countStatus'],
                        updatedBy: userInput.user.clientId
                    }
                };
                if (countZoneData) {
                    countItemModel.find({
                        countId: countZoneData['countId'],
                        zoneId: data._id,
                        isDeleted: false
                    }, function(err, countItemData) {
                        if (countItemData) {
                            countItemModel.update({
                                countId: userInput['countId'],
                                zoneId: data._id
                            }, dataToInsert, {
                                multi: true
                            }, function(countItemErr, countItemValue) {});
                            callback(err, countZoneData);
                        } else {
                            callback(err, countZoneData);
                        }
                    });
                } else {
                    callback(err, countZoneData);
                }
            });
        } else {
            callback(err);
        }
    });
    if (userInput['countId']) {
        var CountId = userInput['countId'];
        countZoneModel.find({
            countId: userInput['countId'],
            isDeleted: false
        }, function(countZoneErr, countZonedata) {
            var countStatusUpdate = function() {
                var query = {
                    _id: CountId
                };
                // var dataToInsert = {
                //     countStatus: userInput['countStatus']
                // };
                // countModel.findOneAndUpdate(query, dataToInsert, function(countError, countData) {});
            };
            if (countZonedata.length > 0) {
                if (userInput['countStatus'] == constant.countStatus.VALIDATED) {
                    countZoneModel.find({
                        countId: userInput['countId'],
                        countStatus: userInput['countStatus'],
                        isDeleted: false
                    }, function(countZoneErr, countZonedata1) {
                        console.log("countZonedata.length-->" + countZonedata.length);
                        console.log("countZonedata.length-->" + countZonedata1.length);
                        if (countZonedata.length == countZonedata1.length) {
                            countStatusUpdate();
                        }
                    });
                } else {
                    countStatusUpdate();
                }
                // for (var i = 0; i < countZonedata.length; i++) {
                //     if (countZonedata[i]['countStatus']) {
                //         if (countZonedata[i]._id == id) {
                //             if (userInput['countStatus'] == constant.countStatus.OPEN) {
                //                 openCountZone = openCountZone + 1;
                //             } else if (userInput['countStatus'] == constant.countStatus.RECOUNT) {
                //                 recountCountZone = recountCountZone + 1;
                //             } else if (userInput['countStatus'] == constant.countStatus.VALIDATED) {
                //                 validatedCountZone = validatedCountZone + 1;
                //             } else if (userInput['countStatus'] == constant.countStatus.INPROCESS) {
                //                 inProcessCountZone = inProcessCountZone + 1;
                //             } else if (userInput['countStatus'] == constant.countStatus.SUBMITTED) {
                //                 submittedCountZone = submittedCountZone + 1;
                //             } else if (userInput['countStatus'] == constant.countStatus.APPROVED) {
                //                 approvedCountZone = approvedCountZone + 1;
                //             } else if (userInput['countStatus'] == constant.countStatus.MODIFIED) {
                //                 modifiedCountZone = modifiedCountZone + 1;
                //             }
                //         } else {
                //             if (countZonedata[i]['countStatus'] == constant.countStatus.OPEN) {
                //                 openCountZone = openCountZone + 1;
                //             } else if (countZonedata[i]['countStatus'] == constant.countStatus.RECOUNT) {
                //                 recountCountZone = recountCountZone + 1;
                //             } else if (countZonedata[i]['countStatus'] == constant.countStatus.VALIDATED) {
                //                 validatedCountZone = validatedCountZone + 1;
                //             } else if (countZonedata[i]['countStatus'] == constant.countStatus.INPROCESS) {
                //                 inProcessCountZone = inProcessCountZone + 1;
                //             } else if (countZonedata[i]['countStatus'] == constant.countStatus.SUBMITTED) {
                //                 submittedCountZone = submittedCountZone + 1;
                //             } else if (countZonedata[i]['countStatus'] == constant.countStatus.APPROVED) {
                //                 approvedCountZone = approvedCountZone + 1;
                //             } else if (countZonedata[i]['countStatus'] == constant.countStatus.MODIFIED) {
                //                 modifiedCountZone = modifiedCountZone + 1;
                //             }
                //         }
                //     }
                // }
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
                //         countModel.findOneAndUpdate(query, dataToInsert, function(countError, countData) {});
                //     }
                // }
            }
        });
    }
}
/*, {upsert:true}
 * delete countZone by countZoneId.
 */
function deleteCountZone(countData, callback) {
    countZoneModel.findById(countData.id, function(err, data) {
        if (data) {
            countZoneModel.update({
                _id: data._id
            }, {
                isDeleted: true,
                updatedBy: countData.user.clientId
            }, function(err, countZoneData) {
                var query = {
                    countId: data.countId,
                    zoneId: data._id
                };
                var dataToInsert = {
                    isDeleted: true,
                    updatedBy: countData.user.clientId
                };
                var countItemManager = require('./countItemManager');
                var search_cond=query;
                search_cond.user=countData.user;
                countItemManager.deleteCountItem(search_cond,function(err, data){
                    callback(err, data);
                });
                countModel.update(query,{
                     "$inc": { "numberOfZones": -1 } ,
                    updatedBy: countData.user.clientId
                },function (err, data) {});
            });
        }
    });
}