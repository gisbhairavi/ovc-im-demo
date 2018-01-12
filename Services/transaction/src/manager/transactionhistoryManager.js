var express = require('express');
var log = require('../log');
var transactionModel = require('./../model/transactionModel');
var transactionitemModel = require('./../model/transactionitemModel');
var transactioniteminventoryModel = require('./../model/transactioniteminventoryModel');
var inventoryavailabilityModel = require('./../model/inventoryavailabilityModel');
var config = require('../../config/const.json');
var router = express.Router();
var env_config = require('../../config/config.js');
var request = require('request');
var querystring = require('querystring');
var lo = require('lodash');
var Q = require('q');
var json2xls = require('json2xls');

module.exports = {
    getTransactionHistory: getTransactionHistory,
    getTransactionitemHistory: getTransactionitemHistory,
    getTransactioniteminventoryHistory: getTransactioniteminventoryHistory,
    getBalanceReport: getBalanceReport,
    getStockBalances: getStockBalances,
    getStatusReport: getStatusReport,
    getBalanceReportExcel: getBalanceReportExcel
};
var getProducts = function(skuData, callback) {
    var sku_data = querystring.stringify(skuData);
    var options = {
        url: env_config.dashPath + config.apis.GETPRODUCTS,
        method: 'POST',
        body: sku_data,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    request(options, function(err, response, productData) {
        console.log(env_config.dashPath + config.apis.GETPRODUCTS, skuData);
        // console.log(err, data);
        callback ? callback(err, productData) : '';
        // return response;
    });
    // return response;
};
//****For internal Use Status Report****// 
var getSKUs = function(skuData, callback) {
    var sku_data = querystring.stringify(skuData);
    var options = {
        url: env_config.dashPath + config.apis.GETSTYLESKUS,
        method: 'POST',
        body: sku_data,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    request(options, function(err, response, productData) {
        console.log(env_config.dashPath + config.apis.GETSTYLESKUS, skuData);
        callback ? callback(err, productData) : '';
    });
};
var getLookUpData = function(search, callback) {
    var sku_data = querystring.stringify(search);
    var options = {
        url: env_config.dashPath + config.apis.GETSTOCKLOOKUPDATA,
        method: 'POST',
        body: sku_data,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    request(options, function(err, response, lookupData) {
        console.log(env_config.dashPath + config.apis.GETSTOCKLOOKUPDATA, lookupData);
        callback ? callback(err, lookupData) : '';
    });
};
var getAllProducts = function(skuData, callback) {
    var obj = {};
    obj['srch'] = skuData
    var sku_data = querystring.stringify(obj);
    var options = {
        url: env_config.dashPath + config.apis.GETALLPRODUCTS,
        method: 'POST',
        body: sku_data,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    request(options, function(err, response, productData) {
        options=null;
        console.log(env_config.dashPath + config.apis.GETALLPRODUCTS, obj);
        // console.log(err, data);
        callback ? callback(err, productData) : '';
        // return response;
    });
    // return response;
};

function getUserLocations(userId, callback) {
    console.log('url_hierarchy_location', env_config.dashPath + config.apis.GETUSERHIERARCHYLOCATION + userId);
    request(env_config.dashPath + config.apis.GETUSERHIERARCHYLOCATION + userId, function(err, response, data) {
        if (err) return callback(err);
        if (data) {
            try {
                var loc = JSON.parse(data);
                var userLocation = [];
                Object.keys(loc.hierarchy).forEach(function(n) {
                    // console.log('loc', loc.hierarchy[n]);
                    userLocation.push(loc.hierarchy[n].id);
                });
                console.log("userLocation____________:", userLocation);
                return callback(null, userLocation);
            } catch (e) {
                return callback(e);
            }
        }
    });
}
/*
 * GET transaction history & search key.
 */
function getTransactionHistory(userInput, callback) {
    var id = userInput['id'];
    var tranTypeId = userInput['tranTypeId'];
    var fromDate = userInput['fromdate'];
    var toDate = userInput['todate'];
    var fromLocationId = userInput['fromLocationId'];
    var directiveTypeId = userInput['directiveTypeId'];
    var countNumber = userInput['countNumber'];
    var purchaseordernumber = userInput['purchaseordernumber'];
    var trantype = userInput['trantype'];
    var tranType_or_directiveType = userInput['tranType_or_directiveType'];
    var sku = userInput['sku'] || '';
    var createdBy = userInput['createdBy'];
    var user_names = createdBy ? createdBy.split(' ') : '';
    var fromQtyRange = parseInt(userInput['fromQtyRange']);
    var toQtyRange = parseInt(userInput['toQtyRange']);
    var fromPriceRange = parseInt(userInput['fromPriceRange']);
    var toPriceRange = parseInt(userInput['toPriceRange']);
    var locationIds = userInput['fromLocationId'] ? fromLocationId.split(',') : null;
    var userId = userInput.user ? userInput.user.clientId : undefined;
    var page_offset = 0;
    var page_lmt = 0;
    if (userInput['page_offset'] && userInput['page_lmt']) {
        page_offset = parseInt(userInput['page_offset']) || 0;
        page_lmt = parseInt(userInput['page_lmt']) || 10;
    }
    var settranType = function(data) {
        var tran = [];
        for (var n = 0; n < data.length; n++) {
            var v = data[n].toJSON();
            var tranType;
            if (data[n].purchaseOrderNumber != '') {
                tranType = config.purchaseOrder;
                data[n].set('tranType', tranType);
            } else if (data[n].countNumber && data[n].countName) {
                tranType = config.count;
                data[n].set('tranType', tranType);
            } else {
                tranType = config.adjustment;
            }
            v.tranType = tranType;
            // console.log(v);
            tran.push(v);
        }
        return tran;
    };
    var condition = {};
    var locArray = [];
    condition["$and"] = [];
    condition["$and"].push({
        isDeleted: false
    });
    var getTranData = function() {
        if (locArray && locArray.length) {
            // try {
            //     if (data) {
            //         var loc = JSON.parse(data);
            //         Object.keys(loc.hierarchy).forEach(function(n) {
            //             // console.log('loc', loc.hierarchy[n]);
            //             locArray.push(loc.hierarchy[n].id);
            //         });
            //     }
            // } catch (ex) {
            //     return callback('can not load user data.');
            // }
            var orcond = [];
            orcond.push({
                "fromLocationId": {
                    "$in": locArray
                }
            });
            orcond.push({
                "toLocationId": {
                    "$in": locArray
                }
            });
            condition["$and"].push({
                '$or': orcond
            });
        }
        // if (toDate) {
        // toDate = new Date(toDate);
        // toDate.setDate(toDate.getDate() + 1); // To increase toDate by 1 as it fails to on equal condition.
        // }
        if (id) {
            condition["$and"].push({
                "_id": id
            });
            transactionModel.findOne(condition).exec(callback);
        } else if (fromDate || toDate || tranTypeId || fromLocationId || directiveTypeId || countNumber || purchaseordernumber || trantype || sku || fromQtyRange || toQtyRange || fromPriceRange || toPriceRange || createdBy) {
            var query = JSON.parse('{"isDeleted" : false}');
            if (fromLocationId) {
                query['fromLocationId'] = {
                    "$in": fromLocationId.split(',')
                };
                // query['fromLocationId'] = new RegExp('^' + fromLocationId + '$', "i");
            }
            if (tranTypeId) {
                query['tranTypeId'] = {
                    "$in": tranTypeId.split(',')
                };
            }
            if (directiveTypeId) {
                // query['directiveTypeId'] = new RegExp('^' + directiveTypeId + '$', "i");
                query['directiveTypeId'] = {
                    "$in": directiveTypeId.split(',')
                };
            }
            if (countNumber) {
                query['countNumber'] = countNumber;
            }
            if (purchaseordernumber) {
                // if(userInput['trantype'] == 'adjustment'){
                //     query['adjustmentNumber'] = new RegExp(purchaseordernumber, "g");
                // } else {
                //     query['purchaseOrderNumber'] = new RegExp(purchaseordernumber, "g");
                // }
                query['$or'] = [];
                query['$or'].push({
                    adjustmentNumber: new RegExp(purchaseordernumber, "g")
                });
                query['$or'].push({
                    purchaseOrderNumber: new RegExp(purchaseordernumber, "g")
                });
                query['$or'].push({
                    postranNo: new RegExp(purchaseordernumber, "g")
                });
            }
            if (tranType_or_directiveType) {
                query['$or'] ? query['$or'] : query['$or'] = [];
                query['$or'].push({
                    tranTypeId: {
                        "$in": tranType_or_directiveType.split(',')
                    }
                });
                query['$or'].push({
                    directiveTypeId: {
                        "$in": tranType_or_directiveType.split(',')
                    }
                });
            }
            if (trantype) {
                query['tranType'] = {
                    "$in": trantype.split(',')
                };
            }
            // if (fromDate || toDate) {
            //     if (fromDate && toDate) {
            //         query['createdDate'] = {
            //             '$gte': new Date(fromDate),
            //             '$lte': toDate
            //         };
            //     } else if (toDate) {
            //         query['createdDate'] = {
            //             '$lte': toDate
            //         };
            //     } else {
            //         query['createdDate'] = {
            //             '$gte': new Date(fromDate)
            //         };
            //     }
            // }
            if (fromDate || toDate) {
                if (fromDate && toDate) {
                    toDate = new Date(toDate);
                    toDate = toDate.toISOString();
                    fromDate = new Date(fromDate);
                    fromDate = fromDate.toISOString();
                    if (fromDate != toDate) {
                        toDate = new Date(toDate);
                        toDate.setHours(23, 59, 59, 999);
                        toDate = toDate.toISOString();
                        query['createdDate'] = {
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
                        query['createdDate'] = {
                            '$gte': new Date(fromDate),
                            '$lte': new Date(toDate)
                        };
                    }
                } else if (toDate) {
                    toDate = new Date(toDate);
                    toDate = toDate.toISOString();
                    query['createdDate'] = {
                        '$lte': new Date(toDate)
                    };
                } else {
                    query['createdDate'] = {
                        '$gte': new Date(fromDate)
                    };
                }
            }
            if (sku || fromQtyRange || toQtyRange || fromPriceRange || toPriceRange || createdBy) {
                var user_input = {};
                if(sku){
                    user_input.sku = {
                        "$in": sku.split(',')
                    };
                }
                user_input.fromQtyRange = fromQtyRange;
                user_input.toQtyRange = toQtyRange;
                user_input.fromPriceRange = fromPriceRange;
                user_input.toPriceRange = toPriceRange;
                var tranIdArr = [];
                getTransactionitemHistory(user_input, function(err, itemData) {
                    if ((itemData) && (sku || fromQtyRange || toQtyRange || fromPriceRange || toPriceRange)) {
                        for (var num = itemData.length - 1; num >= 0; num--) {
                            tranIdArr.push(itemData[num].tranId);
                        }
                        query['_id'] = {
                            '$in': tranIdArr
                        };
                    }
                    console.log('url', env_config.dashPath + config.apis.GETUSERDATA + user_names);
                    request(env_config.dashPath + config.apis.GETUSERDATA + user_names, function(err, response, data) {
                        if (data && createdBy) {
                            try {
                                var userData = JSON.parse(data);
                                var userId = userData.userDats.User.id;
                                query['createdBy'] = userId;
                            } catch (ex) {
                                return callback('can not load user data.');
                            }
                        }
                        condition["$and"].push(query);
                        console.log(JSON.stringify(condition));
                        console.log(condition);
                        transactionModel.find(condition).count().exec(function(err, total_count) {
                            transactionModel.find(condition).sort({
                                'lastModifiedDate': -1
                            }).skip(page_offset).limit(page_lmt).exec(function(err, data) {
                                // console.log('data');
                                // console.log(data);
                                // var tran = settranType(data);
                                callback(err, {
                                    data: data,
                                    total_count: total_count
                                });
                            });
                        });
                    });
                });
            } else {
                condition["$and"].push(query);
                console.log(condition);
                transactionModel.find(condition).count().exec(function(err, total_count) {
                    transactionModel.find(condition).sort({
                        'lastModifiedDate': -1
                    }).skip(page_offset).limit(page_lmt).exec(function(err, data) {
                        // console.log('data');
                        // console.log(data);
                        // var tran = settranType(data);
                        callback(err, {
                            data: data,
                            total_count: total_count
                        });
                    });
                });
            }
        } else {
            transactionModel.find(condition).count().exec(function(err, total_count) {
                transactionModel.find(condition).sort({
                    'lastModifiedDate': -1
                }).skip(page_offset).limit(page_lmt).exec(function(err, data) {
                    // var tran = settranType(data);
                    callback(err, {
                        data: data,
                        total_count: total_count
                    });
                });
            });
        }
    }
    // console.log('url', env_config.dashPath + config.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId);
    // request(env_config.dashPath + config.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId, function(err, response, data) {
    // var UserLocationsCall   =   getUserLocations(locationIds, userId);
    if (locationIds && locationIds.length) {
        locArray = locationIds;
        getTranData();
    } else {
        getUserLocations(userId, function(err, loc_data) {
            locArray = loc_data;
            getTranData();
        });
    }
    // });
}
/***********************************************************************
 *
 * FUNCTION:    addSKUdesc
 *
 * DESCRIPTION: To add the SKU desc for the skus.
 *
 * PARAMETERS:  data with SKUs and callback.
 *
 * RETURNED:    return data with sku desc.
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         26/04/2016    1.0.0       First Version
 *
 ***********************************************************************/
function addSKUdesc(err, data, count, callback) {
    var getProductDetails = function(skuData, callback) {
        var obj = {};
        obj['srch'] = skuData
        var sku_data = querystring.stringify(obj);
        var options = {
            url: env_config.dashPath + config.apis.GETALLPRODUCTS,
            method: 'POST',
            body: sku_data,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
        request(options, function(err, response, productData) {
            console.log(env_config.dashPath + config.apis.GETALLPRODUCTS, obj);
            // console.log(err, data);
            callback ? callback(err, productData) : '';
            // return response;
        });
        // return response;
    };
    var skus = [];
    var skuWitDesc = [];
    if(err){
        return callback('Error In TranscationItem');
    }
    if(data){
        for (var n = data.length - 1; n >= 0; n--) {
            skus.push(data[n].sku);
        };
    }
    if (skus.length > 0) {
        n = 0;
        var id = data[0].tranId;
        // transactionModel.findById(id).exec(function(err, tranData) {
            var locId;
            var skudata = {};
            // if(tranData.toLocationId && tranData.toLocationId != '')
            // {
            //     locId = tranData.toLocationId;
            // }
            // else
            // {
            //     locId = tranData.fromLocationId;
            // }
            getProductDetails(skus.join(), function(err, pro_data) {
                if (pro_data && pro_data != '') {
                    skudata = JSON.parse(pro_data);
                } else {
                    skudata = {};
                }
                var skuWitDesc = [];
                for (var sku = data.length - 1; sku >= 0; sku--) {
                    // console.log(skudata[sku]);
                    var skuDesc = JSON.parse(JSON.stringify(data[sku]));
                    for (var j = skudata.length - 1; j >= 0; j--) {
                        if (skudata[j].ProductTbl.sku == data[sku].sku) {
                            // data[sku]['productCode'] = skudata[j].ProductTbl.productCode;
                            // data[sku]['description'] = skudata[j].ProductTbl.description;
                            // data[sku]['productDescription'] = skudata[j].ProductTbl.productDescription;
                            skuDesc['description'] = skudata[j].ProductTbl.description;
                        }
                    };
                    skuWitDesc.push(skuDesc);
                    // data.skus = skus;
                };
                var result = {data : skuWitDesc , count : count };
                callback(err, result);
                result = null;
                // callback(err, data);
                // callback(err, skus);
            });
        // });
        // var tran = settranType(data);
    } else {
        // callback(err, data);
        var result = { data : data, count :count };
        callback(err, result);
        result = null;
    }
}
/*
 * GET transactionItem history
 */
function getTransactionitemHistory(userInput, callback) {
    var id = userInput['id'];
    var tranId = userInput['tranId'];
    var key = userInput['name'];
    var sku = userInput['sku'];
    var fromQtyRange = userInput['fromQtyRange'];
    var toQtyRange = userInput['toQtyRange'];
    var fromPriceRange = userInput['fromPriceRange'];
    var toPriceRange = userInput['toPriceRange'];
    var page_offset =  parseInt(userInput['page_offset']) || 0;
    var page_lmt    =  parseInt(userInput['page_lmt']) || 0;
    var condition = {};
    condition["$and"] = [];
    condition["$and"].push({
        isDeleted: false
    });

    if (id) {
        transactionitemModel.findById(id).exec(callback);
    } else if (tranId) {
        transactionitemModel.count({tranId:tranId, isDeleted: false }).exec(function(error, count){
             transactionitemModel.find({ tranId: tranId,  isDeleted: false }).skip(page_offset).limit(page_lmt).exec(function(err, data) {
                err = error ? error : err ? err : '';
                addSKUdesc(err, data, count, callback)
            });
        });
       
    } else if (key) {
        transactionModel.find({
            $or: [{
                toLocationId: new RegExp('^.*?' + key + '.*?$', "i")
            }],
            isDeleted: false
        }).sort({
            'lastModifiedDate': -1
        }).exec(callback);
    } else if (sku || fromQtyRange || toQtyRange || fromPriceRange || toPriceRange) {
        var query = JSON.parse('{"isDeleted" : false}');
        if (sku) {
            query['sku'] = sku
        }
        if (fromQtyRange || toQtyRange) {
            if (fromQtyRange && toQtyRange) {
                query['qty'] = {
                    '$gte': fromQtyRange,
                    '$lte': toQtyRange
                };
            } else if (toQtyRange && !fromQtyRange) {
                query['qty'] = {
                    '$lte': toQtyRange
                };
            } else if(fromQtyRange && !toQtyRange){
                query['qty'] = {
                    '$gte': fromQtyRange
                };
            }
        }
        if (fromPriceRange || toPriceRange) {
            if (fromPriceRange && toPriceRange) {
                query['cost'] = {
                    '$gte': fromPriceRange,
                    '$lte': toPriceRange
                };
            } else if (toPriceRange && !fromPriceRange) {
                query['cost'] = {
                    '$lte': toPriceRange
                };
            } else if(fromPriceRange && !fromPriceRange){
                query['cost'] = {
                    '$gte': fromPriceRange
                };
            }
        }
        condition["$and"].push(query);
        transactionitemModel.find(condition).sort({
            'lastModifiedDate': -1
        }).exec(callback);
    } else {
        transactionitemModel.find({
            isDeleted: false
        }).sort({
            'lastModified': -1
        }).exec(callback);
    }
}
/*
 * GET getTransactioniteminventoryHistory
 */
function getTransactioniteminventoryHistory(userInput, callback) {
    var id = userInput['id'];
    var tranId = userInput['tranId'];
    var tranitemId = userInput['tranitemId'];
    var tranitemIdArray = userInput['tranitemIdArray'];
    if (id) {
        transactioniteminventoryModel.findById(id).exec(callback);
    } else if (tranId) {
        transactioniteminventoryModel.find({
            tranId: new RegExp('^' + tranId + '$', "g"),
            isDeleted: false
        }).sort({
            'lastModified': -1
        }).exec(callback);
    } else if (tranitemId) {
        transactioniteminventoryModel.find({
            tranitemId: new RegExp('^' + tranitemId + '$', "g"),
            isDeleted: false
        }).sort({
            'lastModified': -1
        }).exec(callback);
    } else if(tranitemIdArray){
     transactioniteminventoryModel.find({ tranitemId : { "$in" : tranitemIdArray}}).exec(function(err , inventory){
        if(err){
            return callback(err);
        }
        var temp = {};
        if(inventory.length){
            inventory.forEach(function(value){
                if(!temp[value.tranitemId]){
                    temp[value.tranitemId] = {};
                }
                !temp[value.tranitemId][value.balanceType] ? temp[value.tranitemId][value.balanceType] = {} : '';

                temp[value.tranitemId][value.balanceType].oldvalue = value.prevValue;
                temp[value.tranitemId][value.balanceType].newvalue = value.newValue;
            });
        }
        callback(err,temp)
     });
    }else{
        transactioniteminventoryModel.find({
            isDeleted: false
        }).sort({
            'lastModified': -1
        }).exec(callback);
    }
}
/*
 * GET getStockBalances
 */
function getStockBalances(userInput, locArr, callback) {
    // var loc = userInput['locations'];
    var sku = userInput['sku'];
    var balanceType = userInput['balanceType'];
    var skuArray = [];
    var condition = {};
    // if (locArrObj.length) {
    try {
        // To Get locations
        var locArrObj = userInput['stores'] ? userInput['stores'].split(',') : locArr;
        console.log('locArrObj', locArrObj);
        if (locArrObj.length == 0) return callback('No location data found');
        // request(env_config.dashPath + config.apis.GETCHILDLOCATIONS + loc, function(err, response, data) {
        //     console.log(env_config.dashPath + config.apis.GETCHILDLOCATIONS + loc, data);
        //     var locArr = JSON.parse(data);
        //     locArray = locArr.locations;
        // if (locArray) {
        //     for (var n = locArray.length - 1; n >= 0; n--) {
        //         locArrObj.push(locArray[n].id);
        //     };
        // }
        if (locArrObj || balanceType || sku) {
            condition["$and"] = [];
            if (locArrObj) {
                if (locArrObj.length) {
                    condition["$and"].push({
                        "locationId": {
                            "$in": locArrObj
                        }
                    });
                }
            }
            if (balanceType) {
                if (balanceType.length) {
                    condition["$and"].push({
                        "balanceType": {
                            "$in": balanceType
                        }
                    });
                }
            }
            if (sku) {
                skuArray.push(new RegExp(sku + '.*'));
                condition["$and"].push({
                    "sku": {
                        "$in": skuArray
                    }
                });
            }
        }
        inventoryavailabilityModel.aggregate({
            $match: condition
        }, {
            $group: {
                _id: {
                    "locationId": "$locationId",
                    "sku": "$sku"
                },
                "locationId": {
                    "$first": "$locationId",
                },
                "sku": {
                    "$first": "$sku"
                },
                "balanceTypeQty": {
                    "$push": {
                        "value": "$value",
                        "balanceType": "$balanceType"
                    }
                }
            }
        }).project('-_id locationId sku balanceTypeQty').exec(function(err, data) {
            console.log("Error:", err);
            err ? callback("loc data error.") : callback(err, {"stockUpdate": data});
        });
        // });
    } catch (e) {
        console.log("Exception:", e);
        callback("loc data error.");
    }
    // } else {
    //     callback("loc should not empty");
    // }
}
/*
 * GET getBalanceReport
 */
function getTranItemInvent(tranItem, callback) {
    transactioniteminventoryModel.count(tranItem.condition).exec(function(err, skustockcount) {
        transactioniteminventoryModel.find(tranItem.condition, {
            "_id": 0,
            "tranId": 1,
            "tranitemId": 1,
            "balanceType": 1,
            "newValue": 1,
            "prevValue": 1
        }).skip(tranItem.pageOffset).limit(tranItem.pageLimit).sort({
            'lastModifiedDate': -1
        }).exec(function(err, skustockData) {
            var result = {};
            try {
                skustockData = JSON.parse(JSON.stringify(skustockData));
                result.skuData = skustockData;
                result.count = skustockcount;
                callback(err, result);
            } catch (e) {
                console.log(e, 'Balance Report');
                callback(e, result);
            }
        });
    });
}
//**************For Excel Data*************//
function getTranItemInventExcel(tranItem, callback) {
    // console.log('TRAN____ITEM____IVENTORY__EXCEL');
    // console.log(tranItem.condition, 'TRAN__ITEM__EXCEL');
    // transactioniteminventoryModel.count(tranItem.condition).exec(function(err, skustockcount) {
    transactioniteminventoryModel.find(tranItem.condition, {
        "_id": 0,
        "tranId": 1,
        "tranitemId": 1,
        "balanceType": 1,
        "newValue": 1,
        "prevValue": 1
    }).sort({
        'lastModifiedDate': -1
    }).exec(function(err, skustockData) {
        // console.log(skustockData, 'SKU_____STOCK___DATA');
        var result = {};
        tranItem=null;
        try {
            skustockData = JSON.parse(JSON.stringify(skustockData));
            result.skuData = skustockData;
            // result.count    =  skustockcount;
            callback(err, result);
            skustockData=null;
            result=null;
        } catch (e) {
            console.log(e, 'Balance Report');
            callback(e, result);
            result=null;
        }
    });
    // });
}

function gettranscationItem(condition, callback) {
    transactionitemModel.find(condition, {
        "_id": 1,
        "sku": 1
    }).sort({
        'lastModifiedDate': -1
    }).exec(function(err, SKUs) {
        condition=null;
        callback ? callback(err, SKUs) : '';
        SKUs=null;
    });
}

function getBalanceReport(searchData, callback) {
    try {
        var fromDate = searchData['fromdate'];
        var toDate = searchData['todate'];
        var locations = searchData['locations'];
        var skus = searchData['srch'];
        var srchsku = searchData['sku'];
        var affectedBalance = searchData['affectedBalance'];
        var page_offset = 0;
        var page_lmt = 0;
        page_offset = parseInt(searchData['page_offset']) || 0;
        page_lmt = parseInt(searchData['page_lmt']) || 100;
        var balanceType = searchData['balanceType'];
        if (locations && fromDate && toDate) {
            var skuDesc = {};
            var condition = {};
            if (locations) {
                condition['fromLocationId'] = {
                    "$in": locations.split(',')
                };
            }
            condition['isDeleted'] = false;
            if (fromDate && toDate) {
                toDate = new Date(toDate);
                toDate.setUTCHours(23, 59, 59, 999);
                toDate = toDate.toISOString();
                fromDate = new Date(fromDate);
                fromDate.setUTCHours(0, 0, 0, 0);
                fromDate = fromDate.toISOString();
                condition['createdDate'] = {
                    '$gte': fromDate,
                    '$lte': toDate
                };
            }
            transactionModel.find(condition, {
                "_id": 1,
                "tranTypeId": 1,
                "directiveTypeId": 1,
                "purchaseOrderType": 1,
                "purchaseOrderNumber": 1,
                "countType": 1,
                "countNumber": 1,
                "countName": 1,
                "adjustmentNumber": 1,
                "postranNo": 1,
                "tranType": 1,
                "createdDate": 1,
                "fromLocationId": 1
            }).sort({
                'lastModifiedDate': -1
            }).exec(function(err, data) {
                data = JSON.parse(JSON.stringify(data));
                var tranArray = [];
                var trandata = {};
                var condition = {};
                data.forEach(function(tran) {
                    tranArray.push(tran._id);
                    trandata[tran._id] = tran;
                });
                condition['isDeleted'] = false;
                condition['tranId'] = {
                    "$in": tranArray
                };
                var querySkus = '';
                if (skus) {
                    getProducts({
                        locid: locations,
                        srch: skus
                    }, function(err, pro_data) {
                        if (err) {
                            console.log('Cannot Get Load Getproducts');
                            return callback('cannot load Get products');
                        }
                        var skudata = [];
                        try {
                            if (pro_data && pro_data != '') {
                                skudata = JSON.parse(pro_data);
                            } else {
                                skudata = [];
                            }
                            if (skudata.status == config.label.ERROR) {
                                return callback('No Product Found.');
                            }
                            if (skudata.length) {
                                for (var skuDet = skudata.length - 1; skuDet >= 0; skuDet--) {
                                    skuDesc[skudata[skuDet].ProductTbl.sku] = skudata[skuDet].ProductTbl;
                                };
                            }
                            if (Object.keys(skuDesc).length) {
                                querySkus = Object.keys(skuDesc).join();
                            }
                            if (querySkus) {
                                condition['sku'] = {
                                    "$in": querySkus.split(',')
                                };
                            }
                            gettranscationItem(condition, function(error, tranItemSKUs) {
                                if (error) {
                                    return callback('cannot Find Data');
                                }
                                var tranSKUsArray = [];
                                var tranSKUsdata = {};
                                // var tranSKUs = {};
                                tranItemSKUs = JSON.parse(JSON.stringify(tranItemSKUs));
                                tranItemSKUs.forEach(function(tran) {
                                    tranSKUsArray.push(tran._id);
                                    tranSKUsdata[tran._id] = tran;
                                });
                                var condition = {};
                                condition['$and'] = [];
                                if (affectedBalance) {
                                    condition['$where'] = "this.newValue != this.prevValue";
                                }
                                if (balanceType) {
                                    condition['$and'].push({
                                        balanceType: {
                                            "$in": balanceType.split(',')
                                        }
                                    });
                                }
                                condition['$and'].push({
                                    tranId: {
                                        "$in": tranArray
                                    }
                                }, {
                                    tranitemId: {
                                        "$in": tranSKUsArray
                                    }
                                }, {
                                    "isDeleted": false
                                });
                                var searchData = {
                                    "condition": condition,
                                    "pageOffset": page_offset,
                                    "pageLimit": page_lmt
                                }
                                getTranItemInvent(searchData, function(err, tranitemInv) {
                                    if (err) {
                                        return callback('cannot Find Data')
                                    }
                                    try {
                                        var result = {};
                                        result.data = [];
                                        result.skustockcount = tranitemInv.count;
                                        if (tranitemInv && tranitemInv.skuData) {
                                            tranitemInv.skuData.forEach(function(stockData) {
                                                if (trandata[stockData.tranId] && tranSKUsdata[stockData.tranitemId]) {
                                                    result.data.push(lo.extend(stockData, tranSKUsdata[stockData.tranitemId], trandata[stockData.tranId], skuDesc[tranSKUsdata[stockData.tranitemId].sku]));
                                                } else {
                                                    result.skustockcount--;
                                                }
                                            });
                                        }
                                        return callback('', result);
                                    } catch (e) {
                                        console.log('Balance Report -NO data found')
                                        return callback('Can not load Data');
                                    }
                                });
                            });
                        } catch (e) {
                            console.log('BalanceReport', e);
                            return callback('Can not Load Data.');
                        }
                    });
                } else {
                    gettranscationItem(condition, function(error, tranItemSKUs) {
                        if (error) {
                            console.log('BalanceReport-TranItem', error);
                            return callback('Cannot Load Data.');
                        }
                        var tranSKUsArray = [];
                        var tranSKUsdata = {};
                        // var tranSKUs = {};
                        tranItemSKUs = JSON.parse(JSON.stringify(tranItemSKUs));
                        var tempSkus = [];
                        tranItemSKUs.forEach(function(tran) {
                            tranSKUsArray.push(tran._id);
                            tranSKUsdata[tran._id] = tran;
                            tempSkus.push(tran.sku);
                        });
                        var nonAffectedCondition = {};
                        var condition = {};
                        condition['$and'] = [];
                        if (affectedBalance) {
                            condition['$where'] = "this.newValue != this.prevValue";
                        }
                        if (balanceType) {
                            condition['$and'].push({
                                balanceType: {
                                    "$in": balanceType.split(',')
                                }
                            });
                        }
                        condition['$and'].push({
                            tranId: {
                                "$in": tranArray
                            }
                        }, {
                            tranitemId: {
                                "$in": tranSKUsArray
                            }
                        }, {
                            "isDeleted": false
                        });
                        getAllProducts(tempSkus.join(), function(err, SkuDes) {
                            var skudata = [];
                            if (err) {
                                return callback('Can not load Data');
                            }
                            try {
                                if (SkuDes && SkuDes != '') {
                                    skudata = JSON.parse(SkuDes);
                                } else {
                                    skudata = [];
                                }
                                if (skudata.status == config.label.ERROR) {
                                    return callback('No Product Found.');
                                }
                                if (skudata.length) {
                                    for (var skuDet = skudata.length - 1; skuDet >= 0; skuDet--) {
                                        skuDesc[skudata[skuDet].ProductTbl.sku] = skudata[skuDet].ProductTbl;
                                    };
                                }
                            } catch (e) {
                                console.log('ALL PRODUCTS', e);
                                return callback('Cannot load Data');
                            }
                            var searchData = {
                                "condition": condition,
                                "pageOffset": page_offset,
                                "pageLimit": page_lmt
                            }
                            getTranItemInvent(searchData, function(err, tranitemInv) {
                                if (err) {
                                    return callback('cannot Find Data');
                                }
                                try {
                                    var result = {};
                                    result.data = [];
                                    result.skustockcount = tranitemInv.count;
                                    if (tranitemInv && tranitemInv.skuData) {
                                        tranitemInv.skuData.forEach(function(stockData) {
                                            if (trandata[stockData.tranId] && tranSKUsdata[stockData.tranitemId]) {
                                                result.data.push(lo.extend(stockData, tranSKUsdata[stockData.tranitemId], trandata[stockData.tranId], skuDesc[tranSKUsdata[stockData.tranitemId].sku]));
                                            } else {
                                                result.skustockcount--;
                                            }
                                        });
                                    }
                                    return callback('', result);
                                } catch (e) {
                                    return callback(e, 'Balance Report TranHistoryInventry');
                                }
                            });
                        });
                    });
                }
            });
        } else {
            return callback('All feilds are required.');
        }
    } catch (e) {
        console.log('BalanceReport', e);
        return callback('Can not Load Data.');
    }
}
/*
 *GET getStatusReport
 */
function getStatusReport(searchData, callback) {
    try {
        var fromQuantity = parseFloat(searchData['fromQuantity']);
        var toQuantity = parseFloat(searchData['toQuantity']);
        var locations = searchData['locations'];
        var search = searchData['srch'];
        var sku = searchData['sku'];
        var balanceType = searchData['balanceType'];
        // var merchandise     =   searchData['merchandise'];
        var productProperty = searchData['productProperty'];
        var page_offset = 0;
        var page_lmt = 0;
        page_offset = parseInt(searchData['page_offset']) || 0;
        page_lmt = parseInt(searchData['page_lmt']) || 100;
        // var skuDesc         =   {};
        if (locations && locations.length > 0) {
            var templocArray = locations;
            var skuValue = '';
            var condition = {};
            condition["$and"] = [];

            function loadQuery(allSku) {
                try {
                    if (search && sku) {
                        condition['sku'] = search
                    }
                    if (locations) {
                        condition["$and"].push({
                            'locationId': {
                                "$in": templocArray
                            }
                        });
                    }
                    if (allSku) {
                        condition["$and"].push({
                            'sku': {
                                "$in": allSku
                            }
                        });
                    }
                    if (balanceType) {
                        condition["$and"].push({
                            'balanceType': {
                                "$in": balanceType
                            }
                        });
                    }
                    if (!isNaN(fromQuantity)   && !isNaN(toQuantity)) {
                        condition["$and"].push({
                            'value': {
                                '$gte': parseInt(fromQuantity),
                                '$lte': parseInt(toQuantity)
                            }
                        });
                    }
                    if (!isNaN(fromQuantity) && isNaN(toQuantity)) {
                        condition["$and"].push({
                            'value': {
                                '$gte': parseInt(fromQuantity)
                            }
                        });
                    }
                    if (isNaN(fromQuantity) && !isNaN(toQuantity)) {
                        condition["$and"].push({
                            'value': {
                                '$lte': parseInt(toQuantity)
                            }
                        });
                    }
                    inventoryavailabilityModel.count(condition).exec(function(err, count) {
                        inventoryavailabilityModel.find(condition, {
                            "_id": 0,
                            "locationId": 1,
                            "sku": 1,
                            "balanceType": 1,
                            "value": 1
                        }).skip(page_offset).limit(page_lmt).sort({
                            'lastModified': -1
                        }).exec(function(err, inventAvailData) {
                            if (err) {
                                return callback('Data not loaded');
                            }
                            var result = {};
                            result.data = [];
                            var skuArray = [];
                            inventAvailData = JSON.parse(JSON.stringify(inventAvailData));
                            inventAvailData.forEach(function(balnceData) {
                                if (skuArray.indexOf(balnceData.sku) == -1) {
                                    skuArray.push(balnceData.sku);
                                }
                            });
                            getAllProducts(skuArray.join(','), function(err, skuData) {
                                if (err) {
                                    console.log('Can not Load Data', err);
                                    return callback('Can not Load Data.');
                                }
                                if (skuData && skuData.status == config.label.ERROR) {
                                    return callback('No Product Found.');
                                }
                                try {
                                    if (skuData && skuData.length) {
                                        skuData = JSON.parse(skuData);
                                        var skuDataDash = {};
                                        skuData.forEach(function(value) {
                                            skuDataDash[value.ProductTbl.sku] = value.ProductTbl;
                                        });
                                        result.count = count;
                                        inventAvailData.forEach(function(invenAvail) {
                                            if (skuDataDash[invenAvail.sku]) {
                                                result.data.push(lo.extend(invenAvail, skuDataDash[invenAvail.sku]));
                                            }
                                        })
                                        return callback('', result);
                                    } else {
                                        return callback('Can not load Description from Dashboard');
                                    }
                                } catch (e) {
                                    console.log('Status Report', e);
                                    return callback('Can not Load Data.');
                                }
                            });
                        });
                    });
                } catch (e) {
                    console.log('Status Report', e);
                    return callback('Can not Load Data.');
                }
            }
            if (search && !sku) {
                getSKUs({
                    locationId: locations.join(','),
                    srch: search
                }, function(err, pro_data) {
                    var skudata = [];
                    var SKUs = [];
                    try {
                        if (pro_data && pro_data != '') {
                            skudata = JSON.parse(pro_data);
                        } else {
                            skudata = [];
                        }
                        if (skudata.status == config.label.ERROR) {
                            return callback('No Product Found.');
                        }
                        loadQuery(skudata);
                    } catch (e) {
                        console.log('Status Report', e);
                        return callback('Can not Load Data.');
                    }
                });
            } else {
                loadQuery();
            }
        } else {
            return callback('Location is required.');
        }
    } catch (e) {
        console.log('Status Report', e);
        return callback('Can not Load Data');
    }
}

function getBalanceReportExcel(searchData, callback) {
    try {
        var fromDate = searchData['fromdate'];
        var toDate = searchData['todate'];
        var locations = searchData['locations'];
        var skus = searchData['srch'];
        var srchsku = searchData['sku'];
        var affectedBalance = searchData['affectedBalance'];
        var page_offset = 0;
        var page_lmt = 0;
        page_offset = parseInt(searchData['page_offset']) || 0;
        page_lmt = parseInt(searchData['page_lmt']) || 100;
        var balanceType = searchData['balanceType'];
        if (locations && fromDate && toDate) {
            var skuDesc = {};
            var condition = {};
            if (locations) {
                condition['fromLocationId'] = {
                    "$in": locations.split(',')
                };
            }
            condition['isDeleted'] = false;
            if (fromDate && toDate) {
                toDate = new Date(toDate);
                toDate.setHours(23, 59, 59, 999);
                toDate = toDate.toISOString();
                fromDate = new Date(fromDate);
                fromDate = fromDate.toISOString();
                condition['createdDate'] = {
                    '$gte': new Date(fromDate),
                    '$lte': new Date(toDate)
                };
            }
            transactionModel.find(condition, {
                "_id": 1,
                "tranTypeId": 1,
                "directiveTypeId": 1,
                "purchaseOrderNumber": 1,
                "countNumber": 1,
                "adjustmentNumber": 1,
                "postranNo": 1,
                "tranType": 1,
                "createdDate": 1
            }).sort({
                'lastModifiedDate': -1
            }).exec(function(err, data) {
                data = JSON.parse(JSON.stringify(data));
                var tranArray = [];
                var trandata = {};
                var condition = {};
                data.forEach(function(tran) {
                    tranArray.push(tran._id);
                    trandata[tran._id] = tran;
                });
                data = null;
                condition['isDeleted'] = false;
                condition['tranId'] = {
                    "$in": tranArray
                };
                var querySkus = '';
                if (skus) {
                    getProducts({
                        locid: locations,
                        srch: skus
                    }, function(err, pro_data) {
                        if (err) {
                            console.log('Cannot Get Load Getproducts');
                            return callback('cannot load Get products');
                        }
                        var skudata = [];
                        try {
                            if (pro_data && pro_data != '') {
                                skudata = JSON.parse(pro_data);
                                pro_data = null;
                            } else {
                                skudata = [];
                            }
                            if (skudata.status == config.label.ERROR) {
                                return callback('No Product Found.');
                            }
                            if (skudata.length) {
                                for (var skuDet = skudata.length - 1; skuDet >= 0; skuDet--) {
                                    skuDesc[skudata[skuDet].ProductTbl.sku] = skudata[skuDet].ProductTbl;
                                };
                                skudata = null;
                            }
                            if (Object.keys(skuDesc).length) {
                                querySkus = Object.keys(skuDesc).join();
                            }
                            if (querySkus) {
                                condition['sku'] = {
                                    "$in": querySkus.split(',')
                                };
                            }
                            gettranscationItem(condition, function(error, tranItemSKUs) {
                                if (error) {
                                    return callback('cannot Find Data');
                                }
                                var tranSKUsArray = [];
                                var tranSKUsdata = {};
                                var tranSKUs = {};
                                tranItemSKUs = JSON.parse(JSON.stringify(tranItemSKUs));
                                tranItemSKUs.forEach(function(tran) {
                                    tranSKUsArray.push(tran._id);
                                    tranSKUsdata[tran._id] = tran;
                                });
                                tranItemSKUs  = null;
                                var condition = {};
                                condition['$and'] = [];
                                if (affectedBalance) {
                                    condition['$where'] = "this.newValue != this.prevValue";
                                }
                                if (balanceType) {
                                    condition['$and'].push({
                                        balanceType: {
                                            "$in": balanceType.split(',')
                                        }
                                    });
                                }
                                condition['$and'].push({
                                    tranId: {
                                        "$in": tranArray
                                    }
                                }, {
                                    tranitemId: {
                                        "$in": tranSKUsArray
                                    }
                                }, {
                                    "isDeleted": false
                                });
                                var searchData = {
                                    "condition": condition,
                                    "pageOffset": page_offset,
                                    "pageLimit": page_lmt
                                }
                                getTranItemInventExcel(searchData, function(err, tranitemInv) {
                                    searchData = null;
                                    if (err) {
                                        return callback('cannot Find Data')
                                    }
                                    try {
                                        var result = {};
                                        result.data = [];
                                        result.skustockcount = tranitemInv.count;
                                        if (tranitemInv && tranitemInv.skuData) {
                                            tranitemInv.skuData.forEach(function(stockData) {
                                                if (trandata[stockData.tranId] && tranSKUsdata[stockData.tranitemId]) {
                                                    result.data.push(lo.extend(stockData, tranSKUsdata[stockData.tranitemId], trandata[stockData.tranId], skuDesc[tranSKUsdata[stockData.tranitemId].sku]));
                                                } else {
                                                    result.skustockcount--;
                                                }
                                            });
                                            tranitemInv = null;
                                        }
                                        var newArr = [];
                                        var invenlabel = config.invtransactionLabel;
                                        result.data.forEach(function(val, index) {
                                            newArr.push({
                                                "SKU": val.sku,
                                                "Description": val.description,
                                                "Balance Type": invenlabel[val.balanceType],
                                                "Beginning Balance": val.prevValue,
                                                "Ending Balance": val.newValue,
                                                "Transaction Name": val.tranTypeId || val.directiveTypeId,
                                                "Document No": val.purchaseOrderNumber || val.adjustmentNumber || val.countNumber,
                                                "Date and Time": val.createdDate
                                            });
                                        });
                                        result = null;
                                        var xls = json2xls(newArr);
                                        newArr = null;
                                        return callback('', xls);
                                    } catch (e) {
                                        console.log('Balance Report Excel -NO data found')
                                        return callback('Can not load Data - tran item inventory');
                                    }
                                });
                            });
                        } catch (e) {
                            console.log('BalanceReport', e);
                            return callback('Can not Load Data.');
                        }
                    });
                } else {
                    gettranscationItem(condition, function(error, tranItemSKUs) {
                        if (error) {
                            console.log('BalanceReport-TranItem-Excel', error);
                            return callback('Cannot Load Data -  Get Tran item.');
                        }
                        var tranSKUsArray = [];
                        var tranSKUsdata = {};
                        var tranSKUs = {};
                        tranItemSKUs = JSON.parse(JSON.stringify(tranItemSKUs));
                        // var condition = {};
                        var tempSkus = [];
                        tranItemSKUs.forEach(function(tran) {
                            tranSKUsArray.push(tran._id);
                            tranSKUsdata[tran._id] = tran;
                            if(tempSkus.indexOf(tran.sku) == -1)
                                tempSkus.push(tran.sku);
                        });
                        tranItemSKUs = null;
                        var nonAffectedCondition = {};
                        getAllProducts(tempSkus.join(), function(err, SkuDes) {
                            tempSkus = null;
                            var skudata = [];
                            if (err) {
                                return callback('Can not load Data');
                            }
                            try {
                                if (SkuDes && SkuDes != '') {
                                    skudata = JSON.parse(SkuDes);
                                } else {
                                    skudata = [];
                                }
                                if (skudata.status == config.label.ERROR) {
                                    return callback('No Product Found.');
                                }
                                if (skudata.length) {
                                    for (var skuDet = skudata.length - 1; skuDet >= 0; skuDet--) {
                                        skuDesc[skudata[skuDet].ProductTbl.sku] = skudata[skuDet].ProductTbl;
                                    };
                                }
                            } catch (e) {
                                console.log('ALL PRODUCTS', e);
                                return callback('Cannot load Data Balance Report Excel');
                            }
                        var condition = {};
                        condition['$and'] = [];
                        if (affectedBalance) {
                            condition['$where'] = "this.newValue != this.prevValue";
                        }
                        if (balanceType) {
                            condition['$and'].push({
                                balanceType: {
                                    "$in": balanceType.split(',')
                                }
                            });
                            balanceType=null;
                        }
                        condition['$and'].push({
                            tranId: {
                                "$in": tranArray
                            }
                        }, {
                            tranitemId: {
                                "$in": tranSKUsArray
                            }
                        }, {
                            "isDeleted": false
                        });
                            balanceType=null;
                                tranSKUsArray = null;
                                tranArray = null;
                            var searchData = {
                                "condition": condition,
                                "pageOffset": page_offset,
                                "pageLimit": page_lmt
                            }
                            getTranItemInventExcel(searchData, function(err, tranitemInv) {
                                if (err) {
                                    return callback('cannot Find Data');
                                }
                                searchData = null;
                                try {
                                    var result = {};
                                    result.data = [];
                                    result.skustockcount = tranitemInv.count;
                                    if (tranitemInv && tranitemInv.skuData) {
                                        tranitemInv.skuData.forEach(function(stockData) {
                                            if (trandata[stockData.tranId] && tranSKUsdata[stockData.tranitemId]) {
                                                result.data.push(lo.extend(stockData, tranSKUsdata[stockData.tranitemId], trandata[stockData.tranId], skuDesc[tranSKUsdata[stockData.tranitemId].sku]));
                                            } else {
                                                result.skustockcount--;
                                            }
                                        });
                                        tranitemInv = null;
                                        skuDesc = null;
                                    }
                                    tranSKUsdata = null;
                                    var newArr = [];
                                    var invenlabel = config.invtransactionLabel;
                                    result.data.forEach(function(val, index) {
                                        newArr.push({
                                            "SKU": val.sku,
                                            "Description": val.description,
                                            "Balance Type": invenlabel[val.balanceType],
                                            "Beginning Balance": val.prevValue,
                                            "Ending Balance": val.newValue,
                                            "Transaction Name": val.tranTypeId || val.directiveTypeId,
                                            "Document No": val.purchaseOrderNumber || val.adjustmentNumber || val.countNumber,
                                            "Date and Time": val.createdDate
                                        });
                                    });
                                    result = null;
                                    var xls = json2xls(newArr);
                                    newArr = null;
                                    return callback('', xls);
                                } catch (e) {
                                    return callback(e, 'Balance Report TranHistoryInventry');
                                }
                            });
                        });
                    });
                }
            });
        } else {
            return callback('All feilds are required.');
        }
    } catch (e) {
        console.log('BalanceReportExcel', e);
        return callback('Can not Load Data.');
    }
}
