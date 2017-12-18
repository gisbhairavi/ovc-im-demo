var express = require('express');
var log = require('../log');
var utils = require('./utils');
var countModel = require('./../model/countModel');
var scheduleAtpModel = require('./../model/scheduleAtpModel');
var countsnapshotSchema = require('./../model/countsnapshotModel');
var countsnapshotModel = countsnapshotSchema.countsnapshotSchema;
var countItemDiscrepancy = countsnapshotSchema.countItemDiscrepancy;
var snapshotModel = countsnapshotSchema.countSnapshot;
var countZoneModel = require('./../model/countZoneModel');
var directiveMasterModel = require('./../model/directiveMasterModel');
var countItemModel = require('./../model/countItemModel');
var router = express.Router();
var constant = require('../../config/const.json');
var env_config = require('../../config/config.js');
var lodash = require('lodash');
var async = require('async');
var request = require('request');
var countItemManager = require('./countItemManager');
var reviewManager = require('./reviewManager');
var countItemQtyManager = require('./countItemQtyManager');
lodash.extend(module.exports, {
    getCount: getCount,
    createCount: createCount,
    uploadCountZone: uploadCountZone,
    editCount: editCount,
    deleteCount: deleteCount,
    addCountZone: addCountZone,
    createCountSnapshot: createCountSnapshot,
    getcountSnapshot: getcountSnapshot,
    addNewZone: addNewZone,
    addSnapShotDisc: addSnapShotDisc
});
/*
 * GET count by countId.
 */
function getCount(userInput, callback) {
    var id = userInput['id'];
    var name = userInput['name'];
    var countNo = userInput['countNumber'];
    var description = userInput['description'];
    var endDate = userInput['endDate'];
    var numberOfZones = userInput['numberOfZones'];
    var comment = userInput['comment'];
    var startDate = userInput['startDate'];
    var store = userInput['store'];
    var countStatus = userInput['countStatus'];
    var key = userInput['key'];
    var condition = {};
    var locArray = [];
    condition["$and"] = [];
    condition["$and"].push({
        isDeleted: false
    });
    console.log('url', env_config.dashPath + constant.apis.GETUSERLOCATION + userInput.user.clientId);
    request(env_config.dashPath + constant.apis.GETUSERLOCATION + userInput.user.clientId, function(err, response, data) {
        if (data) {
            try {
                var loc = JSON.parse(data);
                for (var num = loc.length - 1; num >= 0; num--) {
                    locArray.push(loc[num].id);
                }
            } catch (ex) {
                return callback('can not load user data.');
            }
            condition["$and"].push({
                "locationId": {
                    "$in": locArray
                }
            });
        }
        if (id) {
            condition["$and"].push({
                "_id": id
            });
            countModel.findOne(condition).exec(callback);
        } else if (name || description || endDate || numberOfZones || comment || startDate || countNo || store || countStatus) {
            var query = JSON.parse('{"isDeleted" : false}');
            if (name) {
                query['name'] = new RegExp('^.*?' + name + '.*?$', "i");
            }
            if (countNo) {
                query['_id'] = countNo;
            }
            if (countStatus) {
                query['countStatus'] = {
                    "$in": countStatus.split(',')
                };
            }
            if (store && store != '') {
                query['locationId'] = {
                    '$in': store.split(',')
                };
            }
            if (description) {
                query['description'] = new RegExp('^' + description + '$', "i");
            }
            if (endDate) {
                endDate = new Date(endDate);
                endDate = endDate.setDate(endDate.getDate() + 1);
                query['endDate'] = {
                    '$lte': endDate
                };
            }
            if (numberOfZones) {
                query['numberOfZones'] = numberOfZones;
            }
            if (comment) {
                query['comment'] = new RegExp('^' + comment + '$', "i");
            }
            if (startDate) {
                query['startDate'] = {
                    '$gte': new Date(startDate)
                };
            }
            condition["$and"].push(query);
            countModel.find(condition).sort({
                'lastModified': -1
            }).exec(callback);
        } else if (key) {
            var keyobj = '^.*?' + key + '.*?$';
            countModel.find({
                $or: [
                    /*{ _id: new RegExp('^.*?'+key+'.*?$', "i") }, */
                    {
                        name: new RegExp('^.*?' + key + '.*?$', "i")
                    }, {
                        countType: new RegExp('^.*?' + key + '.*?$', "i")
                    }, {
                        $where: 'return /' + keyobj + '/.test(obj._id)'
                    }
                ],
                isDeleted: false
            }).sort({
                'lastModified': -1
            }).exec(callback);
        } else {
            countModel.find(condition).sort({
                'lastModified': -1
            }).exec(callback);
        }
    });
}
/*
 * create count.
 */
function createCount(userInput, callback) {
    userInput['numberOfZones'] = userInput['numberOfZones'] ? parseInt(userInput['numberOfZones']) : '';
    userInput['createdBy'] = userInput.user.clientId;
    userInput['updatedBy'] = userInput.user.clientId;
    try {
        // if (userInput.countType == constant.countType.zoneCount || userInput.countType == constant.countType.cycleCount) {
        userInput['countStatus'] = 'open';
        // } else {
        //     userInput['numberOfZones'] = 1;
        //     userInput['countStatus'] = 'beingCreated';
        // }
        var count = new countModel(userInput);
        count.save(function(error, data) {
            if (!error) {
                //     var directiveMasterObj = {
                //         directiveId: data['directiveId'],
                //         storeId: data['locationId'],
                //         createdBy: userInput.user.clientId,
                //         updatedBy: userInput.user.clientId,
                //     };
                //     var directiveMaster = new directiveMasterModel(directiveMasterObj);
                //     directiveMaster.save(function(dirErr, dirData) {
                //         // Do Nothing
                //     });count.countType
                // if (userInput.countType == constant.countType.zoneCount || userInput.countType == constant.countType.cycleCount) {
                for (var i = 0; i < userInput['numberOfZones']; i++) {
                    var query = {
                        id: i + 1,
                        countId: data['_id'],
                        createdBy: userInput.user.clientId,
                        updatedBy: userInput.user.clientId,
                    };
                    var countZone = new countZoneModel(query);
                    countZone.save(function(error2, data2) {});
                }
                callback(error, data); //directiveMasterModel
                // } else {
                //     var query = {
                //         id: 1,
                //         countId: data['_id'],
                //         createdBy: userInput.user.clientId,
                //         updatedBy: userInput.user.clientId,
                //     };
                //     var countZone = new countZoneModel(query);
                //     countZone.save(function(error2, countZone) {
                //         var TotalPages = 1;
                //         var lineNumber = 1;
                //         function addSKUs(products) {
                //             var skuData = {
                //                 countId: data['_id'],
                //                 zoneId: countZone['_id'],
                //                 countStatus: 'open',
                //                 productCode: '',
                //                 sku: '',
                //                 lineNumber: +lineNumber,
                //                 createdBy: userInput.user.clientId,
                //                 updatedBy: userInput.user.clientId
                //             };
                //             var updateData = {
                //                 skus: products,
                //                 skuData: lodash.clone(skuData)
                //             };
                //             lineNumber += products.length;
                //             countItemManager.createCountItem(updateData, userInput.header, function(err, SKUdata) {
                //                 // console.log('updateData', err, SKUdata);
                //                 // console.log(SKUdata);
                //                 products = null;
                //             });
                //         }
                //         function getProductDatas(page, productcallback) {
                //             if (page > TotalPages) {
                //                 count.countStatus = 'open';
                //                 countZone.skuQty = lineNumber - 1;
                //                 count.save();
                //                 countZone.save();
                //             } else {
                //                 var url = env_config.dashPath + constant.apis.GETLOCPRODUCTS + userInput.locationId + constant.pagination.PAGE + page;
                //                 console.log(url);
                //                 request.post(url, function(error, response, data) {
                //                     try {
                //                         var data = JSON.parse(data);
                //                         if (data.status) {
                //                             console.log('**********');
                //                             console.log(data);
                //                         } else {
                //                             TotalPages = data.TotalCount.totalPages;
                //                             addSKUs(data.products);
                //                             getProductDatas(++page);
                //                         }
                //                     } catch (e) {
                //                         console.log(data);
                //                         console.log(e);
                //                     }
                //                 });
                //             }
                //         }
                //         getProductDatas(TotalPages);
                //         callback(error, data);
                //     });
                // }
            } else {
                callback(error);
            }
        });
    } catch (e) {
        console.log(e);
        callback('Error - Can not Update.');
    }
}
/*
 * edit count by id.
 */
function editCount(id, userInput, callback) {
    userInput['updatedBy'] = userInput.user.clientId;
    var numberOfZones = userInput['numberOfZones'];
    var count = countModel.findById(id);
    if (count) {
        count.update(JSON.parse(JSON.stringify(userInput)), function(err, countData) {
            if (!err) {
                if (numberOfZones && numberOfZones != '') {
                    countZoneModel.find({
                        "countId": id,
                        "isDeleted": false
                    }).sort({
                        'id': -1
                    }).exec(function(errr, zoneData) {
                        if (zoneData.length != 0) {
                            var zone_len = numberOfZones - (zoneData.length);
                            var zone_id = zoneData[0].id;
                            for (var i = 0; i < zone_len; i++) {
                                var query = {
                                    id: +zone_id + i + 1,
                                    countId: id,
                                    createdBy: userInput.user.clientId,
                                    updatedBy: userInput.user.clientId,
                                };
                                var countZone = new countZoneModel(query);
                                countZone.save(function(error2, data2) {});
                            }
                            callback(err, countData);
                        } else {
                            for (var i = 0; i < userInput['numberOfZones']; i++) {
                                var query = {
                                    id: i + 1,
                                    countId: id,
                                    createdBy: userInput.user.clientId,
                                    updatedBy: userInput.user.clientId,
                                };
                                var countZone = new countZoneModel(query);
                                countZone.save(function(error2, data2) {});
                            }
                            callback(err, countData);
                        }
                    });
                } else {
                    callback(err, countData)
                }
            }
        });
    }
}
/*
 * delete count by countId.
 */
function deleteCount(countdata, callback) {
    editCount(countdata.id, {
        isDeleted: true,
        user: countdata.user
    }, function(err, data) {
        var query = {
            countId: countdata.id
        };
        var dataToInsert = {
            isDeleted: true,
            updatedBy: countdata.user.clientId
        };
        countZoneModel.update(query, dataToInsert, {
            multi: true
        }, function(err, data) {
            var query = {
                countId: countdata.id
            };
            countItemModel.update(query, dataToInsert, {
                multi: true
            }, callback);
        });
    });
};
/***********************************************************************
 *
 * uploadCountZone.
 *
 * REVISION HISTORY:
 *
 *            Name          Date            Description
 *            ----          ----            -----------
 *            Ratheesh     1/09/2016      First Version
 *
 ***********************************************************************/
function uploadCountZone(countdata, header, callback) {
    if (countdata && countdata.zoneUpload && countdata.zoneData) {
        try {
            countdata.zoneData = JSON.parse(countdata.zoneData);
            getCount({
                user: countdata.user,
                countNumber: countdata.countid
            }, function(err, count) {
                if (count.length) {
                    countItemManager.getCountSKUData({
                        countId: countdata.countid,
                        sku: countdata.SKUS.split(',')
                    }, function(err, skuData) {
                        if (err) {
                            utils.errorTrace(err);
                            callback('Can Not Update.');
                        } else {
                            count = count[0];
                            var zone = 0;
                            var skusArray = skuData && skuData.length? skuData[0].sku : [];
                            var sku_data = [];
                            var createZone = function(countZoneNo, asynccallback) {
                                var countZonedata = {};
                                countZonedata['createdBy'] = countdata.user.clientId;
                                countZonedata['updatedBy'] = countdata.user.clientId;
                                countZonedata['countStatus'] = constant.countStatus.OPEN;
                                countZonedata['countId'] = countdata.countid;
                                countZonedata['noApproval'] = (count.countType === constant.countType.cycleCount ? true : false);
                                countZonedata['id'] = countZoneNo;
                                var countZone = new countZoneModel(countZonedata);
                                countZone.save(asynccallback);
                            };
                            var createZoneData = function(countZone, asynccallback) {
                                countZoneModel.findOne({
                                    "isDeleted": false,
                                    countId: countdata.countid,
                                    id: countZone
                                }).exec(function(err, zonedata) {
                                    if (err) {
                                        asynccallback('Can not update countZone.');
                                    } else if (zonedata) {
                                        if (zonedata.countStatus !== constant.countStatus.VALIDATED) {
                                            var scanQty = zonedata.scanQty || 0;
                                            var skuQty = zonedata.skuQty || 0;
                                            countItemManager.getCountItem({
                                                countId: countdata.countid,
                                                zoneId: zonedata._id,
                                                sku: countdata.SKUS,
                                                page_offset: 0,
                                                page_lmt: 0,
                                                countNumber: zonedata.recountNumber
                                            }, function(err, item_data) {
                                                if (err) {
                                                    asynccallback();
                                                } else {
                                                    try {
                                                        var data = item_data ? item_data.zone_data || [] : [];
                                                        if (data) {
                                                            var countZoneData = {
                                                                no: item_data.totalcount + 1
                                                            };
                                                            if (zonedata.recountNumber) {
                                                                countZoneData.maxRecount = zonedata.recountNumber;
                                                            } else {
                                                                countZoneData.maxRecount = data[0] ? data[0].maxRecount || 1 : 1;
                                                            }
                                                            var zoneData = {};
                                                            for (var j = 0, length2 = data.length; j < length2; j++) {
                                                                zoneData[data[j].sku] = data[j];
                                                            }
                                                            data = null;
                                                            var SKUData = countdata.zoneData[countZone];
                                                            var createSKUData = [];
                                                            var updateSKUData = [];
                                                            SKUData.forEach(function(countZoneSKU) {
                                                                if (zoneData[countZoneSKU.SKU]) {
                                                                    var qty = 0;
                                                                    if (countZoneSKU.qty == undefined) {
                                                                        skuQty++;
                                                                    } else {
                                                                        if(zonedata.countStatus === constant.countStatus.RECOUNT && !zonedata.skuQty){
                                                                            skuQty++;
                                                                        }
                                                                        qty = zoneData[countZoneSKU.SKU].qty ? zoneData[countZoneSKU.SKU].qty : 0;
                                                                    }
                                                                    var updateData = {
                                                                        user: countdata.user,
                                                                        countNumber: countZoneData.maxRecount
                                                                    };
                                                                    if (countZoneSKU['qty']) {
                                                                        updateData = {
                                                                            user: countdata.user,
                                                                            qty: qty + +countZoneSKU.qty,
                                                                            zoneId: zonedata._id,
                                                                            countNumber: countZoneData.maxRecount
                                                                        };
                                                                    }
                                                                    updateData.noCountZoneStatus = true;
                                                                    updateData.sku = countZoneSKU.SKU;
                                                                    updateSKUData.push(updateData);
                                                                    zoneData[countZoneSKU.SKU].noApproval ? '' : sku_data.push(updateData);
                                                                    countZoneSKU['qty'] ? scanQty += +countZoneSKU.qty : true;
                                                                } else {
                                                                    if (err) {
                                                                        utils.errorTrace(err);
                                                                    } else {
                                                                        skuQty++;
                                                                        var updateData = {
                                                                            user: countdata.user,
                                                                            qty: +countZoneSKU.qty,
                                                                            countNumber: countZoneData.maxRecount,
                                                                            sku: countZoneSKU.SKU,
                                                                            noApproval: skusArray.indexOf(countZoneSKU.SKU) < 0 && count.countType == constant.countType.cycleCount,
                                                                            zoneId: zonedata._id,
                                                                            countId: countdata.countid,
                                                                            lineNumber: countZoneData.no++
                                                                        };
                                                                        createSKUData.push(updateData);
                                                                        count.countType === constant.countType.cycleCount ? (skusArray.indexOf(countZoneSKU.SKU) >= 0 ? sku_data.push(updateData) : null) : sku_data.push(updateData);
                                                                        countZoneSKU['qty'] ? scanQty += +countZoneSKU.qty : true;
                                                                    }
                                                                }
                                                            });
                                                            SKUData = null;
                                                            async.forEach(lodash.chunk(createSKUData, 100), function(createSKUData, asyncchunkcallback) {
                                                                async.forEach(createSKUData, function(updateData, asyncSKUcallback) {
                                                                    countItemManager.createCountItem(updateData, header, function(err, SKUdata) {
                                                                        asyncSKUcallback();
                                                                    });
                                                                }, function() {
                                                                    asyncchunkcallback();
                                                                    createSKUData = null;
                                                                });
                                                            }, function() {
                                                                createSKUData = null;
                                                            });
                                                            async.forEach(lodash.chunk(updateSKUData, 100), function(updateSKUData, asyncchunkcallback) {
                                                                async.forEach(updateSKUData, function(updateData, asyncSKUcallback) {
                                                                    countItemManager.editCountItem(zoneData[updateData.sku]._id, updateData, function(err, SKUdata) {
                                                                        asyncSKUcallback();
                                                                    });
                                                                }, function() {
                                                                    asyncchunkcallback();
                                                                });
                                                            }, function() {
                                                                updateSKUData = null;
                                                                zonedata.skuQty = skuQty;
                                                                zonedata.scanQty = scanQty;
                                                                zonedata.save(function(err, data) {});
                                                                countdata.zoneData[countZone] = null;
                                                                asynccallback();
                                                            });
                                                        } else {
                                                            console.log('No countdata.');
                                                            asynccallback();
                                                        }
                                                    } catch (e) {
                                                        console.log(e);
                                                        asynccallback();
                                                    }
                                                }
                                            });
                                        } else {
                                            zonedata = null;
                                            console.log('Can not add new SKUS.' + countZone);
                                            asynccallback();
                                        }
                                    } else {
                                        if (count.countType === constant.countType.zoneCount || count.countType === constant.countType.physicalCount) {
                                            createZone(countZone, function(err, data) {
                                                zone++;
                                                var countZoneData = {
                                                    no: 1,
                                                    maxRecount: 1
                                                };
                                                var scanQty = 0;
                                                var skuQty = 0;
                                                var SKUData = countdata.zoneData[countZone];
                                                async.eachSeries(SKUData, function(countZoneSKU, asyncSKUcallback) {
                                                    var updateData = {
                                                        user: countdata.user,
                                                        qty: +countZoneSKU.qty,
                                                        countNumber: countZoneData.maxRecount,
                                                        noApproval: count.countType === constant.countType.cycleCount ? true : false,
                                                        sku: countZoneSKU.SKU,
                                                        zoneId: data._id.toString(),
                                                        countId: countdata.countid,
                                                        lineNumber: countZoneData.no++
                                                    };
                                                    count.countType === constant.countType.cycleCount ? '' : sku_data.push(updateData);
                                                    countItemManager.createCountItem(updateData, header, function(err, SKUdata) {
                                                        skuQty++;
                                                        scanQty += +countZoneSKU.qty;
                                                        asyncSKUcallback();
                                                    });
                                                }, function() {
                                                    data.skuQty = skuQty;
                                                    data.scanQty = scanQty;
                                                    data.save(function(err, data) {});
                                                    asynccallback();
                                                });
                                            });
                                        } else {
                                            if (count.countType === constant.countType.cycleCount) {
                                                if (skusArray) {
                                                    try {
                                                        createZone(countZone, function(err, data) {
                                                            zone++;
                                                            var countZoneData = {
                                                                no: 1,
                                                                maxRecount: 1
                                                            };
                                                            var scanQty = 0;
                                                            var skuQty = 0;
                                                            var SKUData = countdata.zoneData[countZone];
                                                            async.eachSeries(SKUData, function(countZoneSKU, asyncSKUcallback) {
                                                                var updateData = {
                                                                    user: countdata.user,
                                                                    qty: +countZoneSKU.qty,
                                                                    countNumber: countZoneData.maxRecount,
                                                                    noApproval: skusArray.indexOf(countZoneSKU.SKU) < 0 && count.countType === constant.countType.cycleCount ? true : false,
                                                                    sku: countZoneSKU.SKU,
                                                                    zoneId: data._id.toString(),
                                                                    countId: countdata.countid,
                                                                    lineNumber: countZoneData.no++
                                                                };
                                                                skusArray.indexOf(countZoneSKU.SKU) < 0 ? null : sku_data.push(updateData);
                                                                countItemManager.createCountItem(updateData, header, function(err, SKUdata) {
                                                                    skuQty++;
                                                                    scanQty += +countZoneSKU.qty;
                                                                    asyncSKUcallback();
                                                                });
                                                            }, function() {
                                                                data.skuQty = skuQty;
                                                                data.scanQty = scanQty;
                                                                data.save(function(err, data) {});
                                                                asynccallback();
                                                            });
                                                        });
                                                    } catch (e) {
                                                        console.log(e);
                                                        asynccallback();
                                                    }
                                                } else {
                                                    asynccallback();
                                                }
                                            } else {
                                                console.log('Can Add Zone for Count.');
                                                // console.log(countZone);
                                                asynccallback();
                                            }
                                        }
                                    };
                                });
                            };
                            var countZoneArr = Object.keys(countdata.zoneData);
                            async.eachSeries(countZoneArr, function(countZone, asyncSKUcallback) {
                                createZoneData(countZone, function(err, data) {
                                    if (err) {
                                        return callback(err);
                                    } else {
                                        asyncSKUcallback();
                                    }
                                });
                            }, function() {
                                if (sku_data && sku_data.length) {
                                    countsnapshotModel.findOne({
                                        countId: countdata.countid
                                    }).lean().exec(function(err, item_disc) {
                                        addSnapShotDisc(countdata.user, count, sku_data, item_disc, function(err, result) {
                                            item_disc = null;
                                            sku_data = null;
                                            if (err) utils.errorTrace(err);
                                        });
                                    });
                                }
                                count.numberOfZones = count.numberOfZones + zone;
                                count.zoneUpload ? '' : count.zoneUpload = {};
                                count.zoneUpload[countdata.zoneUpload.split('.')[0]] = Date.now();
                                count.markModified('zoneUpload')
                                count.save(function(err, data) {});
                                callback('', constant['label']['SUCCESS']);
                            });
                        }
                    });
                } else {
                    callback('Not found.');
                }
            });
        } catch (e) {
            console.log(e.stack);
            callback('Can not update countZone.');
        }
    } else {
        callback('No data.');
    }
};

function addCountZone(countdata, header, callback) {
    if (countdata && countdata.zoneupdateData || countdata.zonecreateData) {
        try {
            var updatedata = [];
            getCount({
                user: countdata.user,
                countNumber: countdata.countid
            }, function(err, count) {
                if (count.length) {
                    count = count[0];
                    var zone = 0;
                    if (countdata.zoneupdateData || countdata.zonecreateData) {
                        async.series([
                            function (series_callback) {
                                if (countdata.zoneupdateData) {
                                    var skuArr = [];
                                    try {
                                        countdata.zoneupdateData = JSON.parse(countdata.zoneupdateData);
                                    }
                                    catch (ex) {
                                        utils.errorTrace(ex);
                                        return series_callback(ex);
                                    }
                                    async.forEach(countdata.zoneupdateData, function(SKUdata, async_callback) {
                                        if (SKUdata) {
                                            if (countdata.user)
                                                SKUdata['updatedBy'] = countdata.user.clientId;
                                            var countNumber = 1;
                                            if (SKUdata.hasOwnProperty('countNumber')) {
                                                countNumber = SKUdata.countNumber;
                                            }
                                            var updateData = {
                                                user: countdata.user,
                                                countNumber: countNumber
                                            };
                                            if (SKUdata.hasOwnProperty('qty')) {
                                                updateData.qty = parseFloat(SKUdata.qty);
                                            }
                                            if (SKUdata.comment) {
                                                updateData.comment = SKUdata.comment;
                                            }
                                            updateData.noCountZoneStatus = true;
                                            countItemManager.editCountItem(SKUdata._id, updateData, function(err, countSKUdata) {
                                                if (!err){
                                                    SKUdata.old_qty = countSKUdata.old_qty;
                                                    if(SKUdata.qty){
                                                        skuArr.push(SKUdata);
                                                    }
                                                }
                                                async_callback();
                                            });
                                        }
                                    }, function (){
                                        //mem clean
                                        countdata.zoneupdateData = null;
                                        if (skuArr && skuArr.length) {
                                            countsnapshotModel.findOne({countId: count._id}).lean().exec(function(err, itemDisc) {
                                                addSnapShotDisc(countdata.user, count, skuArr, itemDisc, function(err, result) {
                                                    itemDisc = null;
                                                    if (err)
                                                        utils.errorTrace(err);
                                                    series_callback(err, result);
                                                });
                                            });
                                        }
                                        else
                                            series_callback();
                                    });
                                }
                                else {
                                    series_callback();
                                }
                            },
                            function (series_callback) {
                                if (count.countType == constant.countType.zoneCount || count.countType == constant.countType.cycleCount) {
                                    if (countdata.zonecreateData) {
                                        try {
                                            countdata.zonecreateData = JSON.parse(countdata.zonecreateData);
                                        }
                                        catch (ex) {
                                            utils.errorTrace(ex);
                                            return series_callback(ex);
                                        }
                                        countdata.zonecreateData.forEach(function(SKUdata, index) {
                                            if (countdata.user) {
                                                SKUdata['createdBy'] = countdata.user.clientId;
                                                SKUdata['updatedBy'] = countdata.user.clientId;
                                            }
                                        });
                                        countItemModel.create(countdata.zonecreateData, function(err, zonecreateData) {
                                            countdata.zonecreateData = null;
                                            if (err) {
                                                utils.errorTrace(err);
                                                return series_callback(err);
                                            }
                                            if (zonecreateData) {
                                                addItemQty(zonecreateData, countdata);
                                                countsnapshotModel.findOne({countId: count._id}).lean().exec(function(err, item_disc) {
                                                    addSnapShotDisc(countdata.user, count, zonecreateData, item_disc, function(err, result) {
                                                        if (err)
                                                            utils.errorTrace(err);
                                                        series_callback(err, result);
                                                    });
                                                });
                                            }
                                            else
                                                series_callback();
                                        });
                                    }
                                    else
                                        series_callback();
                                }
                                else {
                                    series_callback();
                                }
                            }
                        ], function(err, result){
                            if (err){
                                utils.errorTrace(err);
                            }
                        });
                    } else {
                        utils.errorTrace(new Error('Can not add data!'));
                    }
                    callback('', constant['label']['SUCCESS']);
                } else {
                    callback('Not found.');
                }
            });
        } catch (e) {
            console.log(e.stack);
            callback('Can not update countZone.');
        }
    } else {
        callback('No data.');
    }
};

function addItemQty(zonecreateData, countdata) {
    zonecreateData.forEach(function(data, n) {
        var countNumber = 1;
        if (data.hasOwnProperty('countNumber')) {
            countNumber = data.countNumber;
        }
        var qty = [];
        for (var n = countNumber; n > 0; n--) {
            qty[n] = {
                countItemId: data['_id'],
                lineNumber: data['lineNumber'],
                countNumber: n,
                isDeleted: 'false',
                createdBy: countdata.user.clientId,
                updatedBy: countdata.user.clientId,
                qty: n == countNumber ? data['qty'] : '0'
            };
        };
        countItemQtyManager.createCountItemQty(qty, function(err, data) {});
    });
}

function constructItemDiscData(count, skuData, itemDiscrepancy, snapShotData) {

    var discObj = {};
    var lineCount = 0;
    var discrepancyData = itemDiscrepancy ? itemDiscrepancy.count_item_discrepancy : '';

    if (discrepancyData && discrepancyData.length)
        discObj = utils.arrayToKeyValueObj({array_val: discrepancyData, key: 'sku'});


    for (var arrayVal = skuData.length - 1; arrayVal >= 0; arrayVal--) {
        try {
            var countItem = skuData[arrayVal];
            if (!discObj[countItem.sku]){
                discObj[countItem.sku] = {};
            }

            var tempObj = discObj[countItem.sku];

            if (!tempObj.lineNumber) {
                if (itemDiscrepancy && discrepancyData && discrepancyData.length){
                    tempObj.lineNumber = lineCount + (discrepancyData.length + 1);
                }
                else{
                    tempObj.lineNumber = lineCount + 1;
                }
                lineCount++;
            }
            tempObj.countId = count._id;
            tempObj.sku = countItem.sku;

            if (!tempObj.zoneData) {
                tempObj.zoneData = [];
            }
            if (countItem.zoneId) {
                countItem.zoneId = String(countItem.zoneId);
                if (tempObj.zoneData.indexOf(countItem.zoneId) == -1){
                    tempObj.zoneData.push(countItem.zoneId);
                }

                if (countItem.delete) {
                    var zones = lodash.pull(tempObj.zoneData, countItem.zoneId);
                    tempObj.zoneData = zones;
                }
            }
            if (countItem.hasOwnProperty('qty')) {
                if (typeof tempObj.qty !== 'number') {
                    tempObj.qty = countItem.qty;
                }
                else if (typeof countItem.old_qty === 'number') {
                    if( tempObj.qty >= 0 && tempObj.qty  >= countItem.old_qty){
                        tempObj.qty = (tempObj.qty - countItem.old_qty + countItem.qty);
                    }else{
                        tempObj.qty = 0;
                    }
                }
                else{
                    tempObj.qty = (tempObj.qty + countItem.qty);
                }
            }
            else {
                tempObj.qty = 0;
            }
            tempObj.oh = 0;
            if (snapShotData){
                tempObj.oh = snapShotData.hasOwnProperty(tempObj.sku) ? snapShotData[tempObj.sku] : 0;
            }
            tempObj.discrepancy = (tempObj.oh !== undefined) ? (tempObj.qty - tempObj.oh) : 0;
            if (!tempObj._id) {
                tempObj = new countItemDiscrepancy(tempObj);
            }
            discObj[tempObj.sku] = tempObj;
            countItem.delete && tempObj.zoneData.length === 0 && (count.countType == constant.countType.zoneCount || count.countType == constant.countType.cycleCount) ? delete discObj[tempObj.sku] : discObj[tempObj.sku] = tempObj;
        }
        catch (ex) {
            utils.errorTrace(ex);
        }
    }

    return Object.keys(discObj).map(function (key) {
        return discObj[key];
    });
}

function addSnapShotDisc (userData, count, itemData, snapShotData, callback) {

    itemData = JSON.parse(JSON.stringify(itemData));

    if (snapShotData) {
        updateItemDisc (userData, count, itemData, snapShotData, callback);
    }
    else {
        insertItemDisc (userData, count, itemData, snapShotData, callback);
    }

}

function insertItemDisc (userData, count, item_data, callback) {

    var count_obj = {};
    count_obj.countId = count._id;

    if (userData) {
        count_obj.createdBy = userData.clientId;
        count_obj.updatedBy = userData.clientId;
    }

    count_obj.count_item_discrepancy = constructItemDiscData (count, item_data);

    countsnapshotModel.create(count_obj, callback);

}

function updateItemDisc(userData, count, item_data, item_discrepancy, callback) {

    var sku_arr = [];
    for (var i = item_data.length - 1; i >= 0; i--) {
        sku_arr.push(item_data[i].sku);
    }
    getcountSnapshot({countId: count._id, sku: sku_arr.join()}, null, function (err, snap_shot_data) {
        if (err) {
            utils.errorTrace(err);
        }

        var count_item_discrepancy = constructItemDiscData(count, item_data, item_discrepancy, snap_shot_data);
        var update_data = {
            count_item_discrepancy: count_item_discrepancy
        }
        if (userData)
            update_data.updatedBy = userData.clientId

        countsnapshotModel.update({countId: count._id}, update_data, callback);

    });
}

function getPhyCountItems (atpData, lineNumber) {
    var ln = lineNumber;
    var count_item_discrepancy = {};
    var item_discrepancy_arr = [];

    atpData.forEach(function(data) {
        if (count_item_discrepancy[data.sku]) {
            if (data.balanceType == "oh") {
                var oh = data.value;
                count_item_discrepancy[data.sku].oh = oh;
                count_item_discrepancy[data.sku].discrepancy = -oh;
            }
        } else {
            var oh = data.balanceType == "oh" ? data.value : 0;
            count_item_discrepancy[data.sku] = {
                lineNumber: ln++,
                sku: data.sku,
                qty: 0,
                discrepancy: -oh,
                oh: oh,
                "isDeleted": false
            };
        }
    });
    lodash.forEach(count_item_discrepancy, function(data) {
        item_discrepancy_arr.push(data);
    });
    return item_discrepancy_arr;
}

function createCountSnapshot(data, header, callback) {
    countModel.findById(data['countId'], function(error, count) {
        console.log(error, count);
        if (count) {
            var createCountSnapshotData = function(skuQuery, skuData, oldData) {
                try {
                    // scheduleAtpModel.find(skuQuery).count().exec( function(error, total_count) {
                        var skip = 0;
                        var limit = constant.COUNT_SNAPSHOT_LIMIT;
                        var savedData = null;
                        var phyLineNum = 1;
                        var fetchInvData = function (){
                            scheduleAtpModel.find(skuQuery).skip(skip).limit(limit).exec( function(error, atpData) {
                                if (error) {
                                    utils.errorTrace(error);
                                }
                                try {
                                    if (atpData && atpData.length) {

                                        var pushObj = {
                                            count_snapshot: atpData
                                        }
                                        if (!oldData && (count.countType === constant.countType.physicalCount)) {
                                           pushObj.count_item_discrepancy = getPhyCountItems(atpData, phyLineNum);
                                        }
                                        if (pushObj.count_item_discrepancy) {
                                           phyLineNum = pushObj.count_item_discrepancy.length + 1;
                                        }
                                        var setObj = new countsnapshotModel({
                                            countId: data['countId'],
                                            updatedBy: data.user.clientId
                                        });

                                        setObj = JSON.parse(JSON.stringify(setObj));

                                        delete setObj['count_snapshot'];
                                        delete setObj['count_item_discrepancy'];

                                        if (savedData){
                                            delete setObj._id;
                                        }

                                        if (!oldData){
                                            setObj.createdBy = data.user.clientId;
                                        }

                                        countsnapshotModel.update({
                                            countId: data['countId']
                                        },{
                                            '$pushAll': pushObj,
                                            '$set': setObj
                                        }, {
                                            upsert: true
                                        }).exec(function(err, updateData){
                                            if (err) {
                                                utils.errorTrace(err);
                                            }
                                            if (updateData) {
                                                savedData = updateData;
                                                skip += limit;
                                                fetchInvData();
                                            }
                                        });
                                        atpData = null;
                                    }
                                    else {
                                        count.countCreated = Date.now();
                                        count.countStatus = constant.countStatus.INPROGRESS;
                                        count.save(function(error, data) {
                                            if (error) {
                                                utils.errorTrace(error);
                                            }
                                            saveSnapshotOh(count);
                                        });
                                    }
                                } catch (e) {
                                    utils.errorTrace(e);
                                }
                            });
                        }
                        fetchInvData();
                    // });
                } catch (e) {
                    utils.errorTrace(e);
                }
            };
            if (count.countType === constant.countType.cycleCount) {
                countItemModel.aggregate([{
                    $match: {
                        countId: count['_id']
                    }
                }, {
                    $group: {
                        _id: {
                            countId: "$countId"
                        },
                        "sku": {
                            "$push": "$sku"
                        }
                    }
                }]).exec(function(err, itemData) {
                    // callback('', data);
                    if (err) {
                        console.log(err);
                        return callback(err);
                    } else {
                        if (itemData && itemData[0]) {
                            checkAndCreateSnapshotData(itemData[0] ? itemData[0]['sku'] : '');
                            itemData = null;
                        } else {
                            callback('No SKU Found.');
                        }
                    }
                });
            } else {
                checkAndCreateSnapshotData();
            }

            function checkAndCreateSnapshotData(skuData) {
                countsnapshotModel.findOne({
                    countId: data['countId']
                }).exec(function(error, snapData) {
                    if (snapData && snapData.count_snapshot && snapData.count_snapshot.length) {
                        callback('Snapshot exists.');
                    } else {
                        var skuQuery = {
                            locationId: count.locationId
                        };
                        if (skuData) {
                            skuQuery['sku'] = {
                                "$in": skuData
                            };
                        }
                        count.countStatus = constant.countStatus.CREATING_SNAPSHOT;
                        count.save(function(error, result) {
                            if (error) {
                                utils.errorTrace(error);
                                return callback(error);
                            }
                            createCountSnapshotData(skuQuery, skuData, snapData);
                            callback(error, result);
                        });
                    }
                });
            }
        } else {
            callback('No Count found.');
        }
    });
};

function saveSnapshotOh (countData) {
    try {
        countData = JSON.parse(JSON.stringify(countData));
    }
    catch (ex) {
        utils.errorTrace(ex);
        return false;
    }
    countsnapshotModel.findOne({countId: countData._id}, {count_item_discrepancy : 1}).exec(function(err, item_data){
        if (err) {
            utils.errorTrace(err);
        }
        if (item_data && item_data.count_item_discrepancy && item_data.count_item_discrepancy.length) {
            var sku_arr = [];
            var item_disc = item_data.count_item_discrepancy;
            item_data = null;
            for (var i = item_disc.length - 1; i >= 0; i--) {
                sku_arr.push(item_disc[i].sku);
            }
            var match_cond = {
                "countId": countData._id,
                "count_snapshot.balanceType": "oh",
                "count_snapshot.sku": {
                    '$in': sku_arr
                }
            }
            countsnapshotModel.aggregate({
                $match: match_cond
            }, {
                $unwind: "$count_snapshot"
            }, {
                $match: match_cond
            }, {
                $group: {
                    "_id": "$countId",
                    "snapshot_sku": {
                        $push: {
                            "sku": "$count_snapshot.sku",
                            "balanceType": "$count_snapshot.balanceType",
                            "value": "$count_snapshot.value"
                        }
                    }
                }
            }, function(err, result_data) {
                if (result_data && result_data[0]) {
                    var snapshot_sku = utils.arrayToKeyValueObj({
                        array_val: result_data[0].snapshot_sku,
                        key: 'sku',
                        value: 'value'
                    });
                    result_data = null;
                    for (var i = item_disc.length - 1; i >= 0; i--) {
                        var count_item = item_disc[i];
                        item_disc[i].oh = snapshot_sku[item_disc[i].sku];
                        item_disc[i].discrepancy = item_disc[i].qty - item_disc[i].oh;
                    }
                    countsnapshotModel.update({
                        countId: countData._id
                    }, {
                        count_item_discrepancy: item_disc
                    }, function(err, data) {});
                } else {
                    return false;
                }
            });
        } else {
            return false;
        }
    });
}

function getcountSnapshot(data, header, callback) {
    var queryData = {};
    var sku = [];
    queryData.countId = +data['countId'];
    if (data['sku']) {
        // queryData['count_snapshot.sku'] = {
        //     $in: data['sku'].split(',')
        // };
        sku = data['sku'].split(',');
        queryData['count_snapshot'] = {
            $elemMatch: {
                sku: {
                    $in: data['sku'].split(',')
                }
            }
        };
    }
    countsnapshotModel.find(queryData).exec(function(error, snapShotData) {
        if(error){
            console.log(error);
            return callback('COUNT_SNAP_ERROR' , error);
        }
        var result = {};
        try{
            if (snapShotData) {
                if(snapShotData.length && sku.length){
                    snapShotData[0].count_snapshot.forEach(function(data) {
                        if (sku.indexOf(data.sku) >= 0 && data.balanceType === 'oh') {
                            result[data.sku] = data.value;
                        }
                    });
                    callback('', result);
                }else{
                    callback('', result);
                }
            } else {
                callback('Can not get snapshot.');
            }
        }catch(e){
            console.log('SNOPSHOT_ERROR :',e);
            return callback('Can not get snapshot.');
        }
    });
};
/*
 * addNewZone.
 */
function addNewZone(data, header, callback) {
    var countStatusCheck = {
        // 'validate': 'validate',
        'approve': 'approve'
    };
    countModel.findById(data['countId'], function(error, count) {
        if (count) {
            if (countStatusCheck[count.countStatus]) {
                callback('Can not add Zone.');
            } else {
                countZoneModel.find({
                    countId: data['countId']
                }).count(function(error, noOfZones) {
                    var query = {
                        id: noOfZones + 1,
                        countId: data['countId'],
                        createdBy: data.user.clientId,
                        updatedBy: data.user.clientId,
                    };
                    var countZone = new countZoneModel(query);
                    countZone.save(function(error, countZonedata) {
                        if (countZonedata) {
                            var querydata = {
                                isDeleted: false,
                                countId: data['countId']
                            };
                            countZoneModel.find(querydata).count(function(error, noOfZones) {
                                count.numberOfZones = noOfZones;
                                count.save(function(error, count) {
                                    // callback('', count);
                                });
                                callback(error, countZonedata);
                            });
                        } else {
                            callback('Can not add Zone.');
                        }
                    });
                });
            }
        } else {
            callback('No Count found.');
        }
    });
}
