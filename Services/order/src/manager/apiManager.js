var replenishmentFilterModel  = require('./../model/replenishmentFilterModel');
var constant = require('../../config/const.json');
var scheduleAtpManager  = require('./../manager/scheduleAtpManager');
var querystring = require('querystring');
var env_config = require('../../config/config.js');
var lodash = require('lodash');

var request = require('request');

module.exports = {
    apiGetReplenishmentFilter: apiGetReplenishmentFilter,
    apiCreateReplenishmentOrder: apiCreateReplenishmentOrder
};

function apiGetReplenishmentFilter(userInput, callback){

    var id          =   userInput['id'];
    var filterName  =   userInput['filterName'];
    var condition   =   {};
    var projection  =   {};
    var result  =   {};
    var locArray    =   [];

    projection['filterName']    =   1;
    projection['modeId']    =   '$_id';
    projection['modeName']    =   '$filterName';
    result['modeId']    =   1;
    result['_id']    =   0;
    result['modeName']    =   1;

    condition["$and"] = [];

    condition["$and"].push({
        isDeleted: false
    });

    console.log('url', env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId);
    request(env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId, function(err, response, data) {

        try{
            if (data) {
                var loc =JSON.parse(data);
                Object.keys(loc.hierarchy).forEach(function(n) {
                    // console.log('loc', loc.hierarchy[n]);
                    locArray.push(loc.hierarchy[n].id);
                });
                // condition["$and"].push({'locName.locName.id': {$in:locArray}});
                condition["$and"].push({'locName.locName': {$in:locArray}});
            }
        }
        catch(ex){
            return callback('can not load user data.');
        }
        if(id) {
            condition["$and"].push({
                    "_id": id
                });
            replenishmentFilterModel.find(condition, projection).exec(callback);      
       
        } else if(filterName ){

            var query = JSON.parse('{"isDeleted" : false}'); 
            query['filterName'] = new RegExp('^.*?'+filterName+'.*?$', "i"); 

            condition["$and"].push(query);

            replenishmentFilterModel.find(condition, projection).sort({
                'lastModified': -1
            }).exec(callback);

        } else  {
            replenishmentFilterModel.aggregate([
               { $match: condition},
               { $project: projection},
               { $project: result}]).
            sort({
                'lastModified': -1
            }).exec(callback);
        }

    });

}
function apiCreateReplenishmentOrder(userInput, headerdata, callback) {
    var locArray = [];

    function getRulesObjData(rulesObj) {
        var result = [];
        Object.keys(rulesObj).forEach(function(data) {
            result.push(rulesObj[data]);
        });
        return result;
    }
    console.log('url', env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId);
    request(env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId, function(err, response, data) {
        try {
            if (data) {
                var loc = JSON.parse(data);
                Object.keys(loc.hierarchy).forEach(function(n) {
                    // console.log('loc', loc.hierarchy[n]);
                    locArray.push(loc.hierarchy[n].id);
                });
            }
        } catch (ex) {
            console.log('can not load user data.');
            console.log(ex);
            return callback('can not load user data.');
        }
        replenishmentFilterModel.findOne({
            "_id": userInput['id'],
            "isDeleted": false,
            'locName.locName': {
                $in: locArray
            }
        }).exec(function(err, replenishmentFilter) {
            try {
                if (err) {
                    console.log(err);
                    return callback('can not load replenishment data.');
                }
                if (replenishmentFilter) {
                    replenishmentFilter = JSON.parse(JSON.stringify(replenishmentFilter));
                    var acceptedKeys = ['locName', 'productProperties', 'productVariants', 'merchandiseGroup', 'pricing', 'purchasePrice', 'retailPrice', 'storeQuantities'];
                    var runReplenishmentData = {};
                    var URLObject = {};
                    var replenishmentRulesObj = {};
                    Object.keys(replenishmentFilter).forEach(function(data) {
                        if (acceptedKeys.indexOf(data) > -1) {
                            var replenishmentFilterArr = [];
                            Object.keys(replenishmentFilter[data]).forEach(function(value) {
                                if (data === 'pricing') {
                                    URLObject[value] = getRulesObjData(replenishmentFilter[data][value]).toString();
                                } else {
                                    if (data !== "locName" && data !== "merchandiseGroup") replenishmentFilterArr.push(value.id);
                                }
                                if (value === 'reorderPoint') {
                                    if (replenishmentFilter[data][value].from) {
                                        replenishmentRulesObj['minReorder'] = replenishmentFilter[data][value].from;
                                    }
                                    if (replenishmentFilter[data][value].to) {
                                        replenishmentRulesObj['maxReorder'] = replenishmentFilter[data][value].to;
                                    }
                                }
                            });
                        }
                        if (data === "merchandiseGroup") {
                            URLObject[data] = replenishmentFilter[data][data].toString();
                        }
                        if (data === "locName") {
                            var activeStores = lodash.intersection(locArray, replenishmentFilter[data][data]);
                            URLObject[data] = activeStores.toString();
                        }
                        if (data === 'productProperties' || data === 'productVariants') {
                            URLObject[data] = getRulesObjData(replenishmentFilter[data]).toString();
                        }
                    });
                    try {
                        replenishmentRulesObj['locationId'] = encodeURIComponent(URLObject['locName']);
                    }
                    catch (e) {
                        console.log(e);
                    }
                    var options = {
                        url: env_config.apiPath + constant.apis.GETREPLENISHMENTRULESSKU + JSON.stringify(replenishmentRulesObj),
                        headers: {
                            'authorization': headerdata
                        }
                    };
                    console.log(options, 'GETREPLENISHMENTRULESSKU');
                    try {
                        request(options, function(error, response) {
                            try {
                                var resultsData = response.body;
                                try {
                                    resultsData = JSON.parse(resultsData);
                                } catch (e) {
                                    resultsData = [];
                                    console.log(e);
                                }
                                var skuWithRules = {};
                                resultsData.forEach(function(sku) {
                                    if (!skuWithRules[sku.locationId]) {
                                        skuWithRules[sku.locationId] = [];
                                    }
                                    skuWithRules[sku.locationId].push(sku.sku);
                                });
                                scheduleAtpManager.runReplenishment({
                                    URLObject: URLObject,
                                    skuObject: skuWithRules,
                                    enableReview: userInput.enanbleReview,
                                    user: userInput.user
                                }, headerdata, callback);
                            } catch (e) {
                                console.log(e);
                                return callback('can not load replenishment data.');
                            }
                        });
                    } catch (e) {
                        console.log(e);
                        return callback('can not load replenishment data.');
                    }
                } else {
                    return callback('No Replenishment Filter.');
                }
            } catch (ex) {
                console.log(ex);
                return callback('can not load replenishment data.');
            }
        });
    });
}