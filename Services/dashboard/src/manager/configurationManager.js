var log = require('../log');
var configurationModel  = require('./../model/configurationModel');
var env_config = require('../../config/config.js');
var constant = require('../../config/const.json');
var request = require('request');
var async = require('async');

module.exports = {
  getConfig: getConfig,
  editConfig: editConfig,
  resetToDefaultConfig: resetToDefaultConfig,
  getConfigByUser: getConfigByUser
};

/***********************************************************************
 *
 * FUNCTION:    getConfig
 *
 * DESCRIPTION: To get the Config for the given location.
 *
 * PARAMETERS:  locationId and callback.
 *
 * RETURNED:    config data for the location (array of object).
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         15/02/2016    1.0.0       First Version
 *
 ***********************************************************************/
function getConfig( userInput, callback ) {
    var locationId  =   userInput['locationId'];
    var group       =   userInput['featureGroup']?userInput['featureGroup'].split(','):'';
    var condition   =   {};
    var loc_level_arry  =   [];
    var main_config_arr =   [];
    condition["$and"]   =   [];
    condition["$and"].push({
        isDeleted: false
    });
    condition["$and"].push({
        isPublic: { $gte: 1 } 
    });

    if(locationId) { 
        getConfigByLoc( locationId, userInput['featureId'] || null,group, function( err, data ) {
            main_config_arr =   data;

            console.log('url', env_config.dashPath + constant.apis.GET_ALL_HIERARCHY_LOCATION);
            request(env_config.dashPath + constant.apis.GET_ALL_HIERARCHY_LOCATION, function(err, response, data) {             
                try
                {   
                    if (data) {
                        var loc     =   JSON.parse(data);
                        var loc_level   =   '';
                        var parent_loc  =   '';
                        Object.keys(loc.hierarchy).forEach(function(n) {
                            if(loc.hierarchy[n].hasOwnProperty('id') && loc.hierarchy[n].id == locationId){
                                locationId  =   loc.hierarchy[n].id;
                                parent_loc  =   loc.hierarchy[n].parent;
                                loc_level   =   loc.hierarchy[n].level;
                                // loc_level_arry.push(locationId);
                                for ( var level_value   =   loc_level; level_value >= 0; level_value-- ) {
                                    locationId  =   parent_loc;
                                    Object.keys(loc.hierarchy).forEach(function(num) {
                                        if(loc.hierarchy[num].hasOwnProperty('id') && loc.hierarchy[num].id == locationId){
                                            locationId  =   loc.hierarchy[num].id;
                                            parent_loc  =   loc.hierarchy[num].parent;
                                            loc_level   =   loc.hierarchy[num].level;
                                            loc_level_arry.push(locationId);
                                        }
                                    });          
                                };
                            }
                        });
                    }
                }
                catch(ex)
                {
                    return callback('can not load user data.');
                }   

               async.eachSeries(loc_level_arry,function(loc_level_array,ancallback){
                    getConfigByLoc(loc_level_array, userInput['featureId'] || null,group, function(err, loc_data){
                        Object.keys(loc_data).forEach(function(n) {
                            if (!containsObject(loc_data[n],main_config_arr)) {
                                // if ( !(loc_data[n].featureGroup == constant.productConfiguration.productProperty) || !(loc_data[n].featureGroup == constant.productConfiguration.productAttribute) )
                                    main_config_arr.push(loc_data[n]);
                            }
                        })
                        ancallback();
                    })
               }, 

               function (data) {
                    checkTopMost(main_config_arr, userInput['featureId'] || null,group, function(config_arr){
                        getGroupIds(group, function(group_arr, feature_id_arr){
                            function sortgroup_arr() {
                                group_arr.splice(group_arr.indexOf("globals"), 1);
                                group_arr.unshift("globals");
                            }
                            config_arr = config_arr.sort(sortConfigData('displaySeqNumber', false, parseInt));
                            group_arr.indexOf("globals")>= 0?sortgroup_arr() :group_arr;
                            callback( err, {config_arr:config_arr, featureGroup:group_arr, featureId:feature_id_arr} );
                        });
                    });
               });

            });   
        })
    }

    else{
        callback("locationOrGroupId not found."); 
    }
}

/***********************************************************************
 *
 * FUNCTION:    getGroupIds
 *
 * DESCRIPTION: To get the featureGroup Id's for the given location.
 *
 * PARAMETERS:  callback.
 *
 * RETURNED:    featureGroup Id's for the location (object).
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         15/02/2016    1.0.0       First Version
 *
 ***********************************************************************/
function getGroupIds(featureGroup , callback){
    configurationModel.find({featureGroup: { $in: featureGroup}}).distinct("featureGroup").exec(function(err,groupIds){
        configurationModel.find({featureGroup: { $in: featureGroup}}).distinct("featureId").exec(function(err,featureIds){
            callback(groupIds, featureIds);
        });
    });
}

/***********************************************************************
 *
 * FUNCTION:    checkTopMost
 *
 * DESCRIPTION: To get the config data of the top most location in  
 *              location hierarchy for the given location with out 
 *              dublicates.
 *
 * PARAMETERS:  config_arr, top most location from config.js and callback.
 *
 * RETURNED:    config data without duplicates for the location 
 *              (array of object).
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         15/02/2016    1.0.0       First Version
 *
 ***********************************************************************/
function checkTopMost(config_arr, featureId,featuregroup,callback){
    var top_most_loc = constant.DefaultlocationOrGroupId;
    getConfigByLoc( top_most_loc, featureId, featuregroup, function( err, top_config_arr ) {
        if(top_config_arr){    
            if(top_config_arr.length > config_arr.length){    
                var len_top_config_arr =   top_config_arr.length
                for (var n = len_top_config_arr - 1; n >= 0; n--) {
                    if (!containsObject(top_config_arr[n],config_arr)) {
                        // if ( !(top_config_arr[n].featureGroup == constant.productConfiguration.productProperty) || !(top_config_arr[n].featureGroup == constant.productConfiguration.productAttribute) )
                            config_arr.push(top_config_arr[n]);
                    } 
                };
            }
        }
        callback(config_arr)
    })
}

/***********************************************************************
 *
 * FUNCTION:    sortConfigData
 *
 * DESCRIPTION: To sort the config array based on key.
 *
 * PARAMETERS:  config_arr, top most location from config.js and callback.
 *
 * RETURNED:    config data without duplicates for the location 
 *              (array of object).
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         15/02/2016    1.0.0       First Version
 *
 ***********************************************************************/
function sortConfigData(field, order, parse_param){

   var key = parse_param ? 
       function(x) {return x[field]?parse_param(x[field]):0} : 
       function(x) {return x[field]?x[field]:0};

   order = !order ? 1 : -1;

   return function (a, b) {
       return a = key(a), b = key(b), order * ((a > b) - (b > a));
     } 
}

/***********************************************************************
 *
 * FUNCTION:    containsObject
 *
 * DESCRIPTION: To check the given config_array for dublicates data.
 *
 * PARAMETERS:  config json object(obj), 
 *              config array to be checked(list) and callback.
 *
 * RETURNED:    true or false
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         15/02/2016    1.0.0       First Version
 *
 ***********************************************************************/
function containsObject(obj, list) {
    for (var num = 0; num < list.length; num++) {
        if (list[num].featureId == obj.featureId) {
            return true;
        }
    }
    return false;
}

/***********************************************************************
 *
 * FUNCTION:    getConfigByLoc
 *
 * DESCRIPTION: To get the config data for the given location.
 *
 * PARAMETERS:  locationId and callback.
 *
 * RETURNED:    config data (array of object)
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         15/02/2016    1.0.0       First Version
 *
 ***********************************************************************/
function getConfigByLoc(locationId, featureId,featureGroup, callback){
    var condition   =   {};
    condition["$and"]   =   [];
    condition["$and"].push({
        isDeleted: false
    });

    if (featureId && featureId != '') {
        condition["$and"].push({
            featureId: featureId
        });
    }
    if(featureGroup){
        condition["$and"].push({
            featureGroup: { $in: featureGroup}
        });
    }
    // condition["$and"].push({
    //     isPublic: { $gte: 1 } 
    // });
    if (locationId) {
        // query['locationOrGroupId'] = locationId
        condition["$and"].push({
            locationOrGroupId: locationId
        });
    }
    configurationModel.find(condition).sort({'displaySeqNumber':1}).exec(callback);
}

/***********************************************************************
 *
 * FUNCTION:    editConfig
 *
 * DESCRIPTION: To edit and insert the config for the given location.
 *
 * PARAMETERS:  locationId, config data and callback.
 *
 * RETURNED:    config data (array of object)
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         15/02/2016    1.0.0       First Version
 *
 ***********************************************************************/
function editConfig(locationId, userInput, callback) {
    if(locationId) { 
        var query = JSON.parse('{"isDeleted" : false}');
        var set = {};
        var datevalue = new Date();
        var config_data_json = userInput.configData;
        async.forEach(config_data_json,function (config_data, asynccallback){
                if(config_data.locationOrGroupId == locationId){
                    var defaultValue = config_data.defaultValue;
                    config_data.modifiedValue ? '' : config_data.modifiedValue = '';
                    checkArrayValue(config_data.defaultValue, config_data.modifiedValue, config_data.featureType, function(isEql){
                        if(config_data.hasOwnProperty('modifiedValue') && ((config_data.modifiedValue == config_data.defaultValue) || isEql) ){
                            set = {
                                "featureValue": ''
                            };
                        }
                        else if (config_data.hasOwnProperty('modifiedValue') && ((config_data.modifiedValue != config_data.defaultValue) || !isEql) ){
                            set = {
                                "featureValue": config_data.modifiedValue
                                
                            };
                            if(config_data.modified){
                                set.lastModified = datevalue.toISOString();   
                            }
                        }
                        if(config_data.featureGroup == constant.productConfiguration.productProperty || config_data.featureGroup == constant.productConfiguration.productAttribute || config_data.featureGroup == constant.productConfiguration.balanceproperty)
                        {
                            configurationModel.find({
                                '$and' : [ 
                                    {"featureGroup" : config_data.featureGroup},
                                    {"featureId" : config_data.featureId},
                                    {"locationOrGroupId" : config_data.locationOrGroupId}
                                ]
                            }).exec(function( err, loc_config_data ){
                                if(loc_config_data && loc_config_data != ''){
                                    var pro_set = {
                                        "featureValue": config_data.modifiedValue
                                    };
                                    configurationModel.update({
                                        "_id" : config_data._id,
                                        "locationOrGroupId": config_data.locationOrGroupId
                                     }, {
                                        $set: pro_set
                                     }).exec(asynccallback);
                                }
                                else {
                                    // var productConfiguration = new configurationModel(config_data);
                                    config_data.featureValue = config_data.modifiedValue;
                                    configurationModel.create(config_data, function(err, productConfig){
                                        if(err){
                                            return callback(err);
                                        }
                                        else{
                                            configurationModel.find({
                                                '$and' : [ 
                                                    {"featureGroup" : config_data.featureGroup},
                                                    {"featureId" : config_data.featureId},
                                                    {"locationOrGroupId" : constant.DefaultlocationOrGroupId}
                                                ]
                                            }).exec(function( err, defaultProductConfigData ){
                                                if( !defaultProductConfigData || defaultProductConfigData == ''){
                                                    delete config_data._id
                                                    config_data.locationOrGroupId = constant.DefaultlocationOrGroupId;
                                                    // var productConfiguration = new configurationModel(config_data);
                                                    configurationModel.create(config_data, function(err, defaultProductConfig){
                                                        if(err){
                                                            return callback(err);
                                                        }
                                                        asynccallback(defaultProductConfig);
                                                    });
                                                }
                                                else{
                                                   asynccallback(productConfig); 
                                                }
                                            });
                                        }
                                    });
                                }
                            })
                        }else{
                            configurationModel.update({
                                "_id" : config_data._id,
                                "locationOrGroupId": config_data.locationOrGroupId
                             }, {
                                $set: set
                             }).exec(asynccallback);
                        }
                    });
                }
                else{
                    var defaultValue = config_data.featureValue ? config_data.featureValue : config_data.defaultValue;
                    config_data.modifiedValue ? '' : config_data.modifiedValue = '';
                    checkArrayValue(defaultValue, config_data.modifiedValue, config_data.featureType, function(isEql){
                        var configuration = new configurationModel(config_data);
                        if(config_data.featureValue != ''){
                            if((config_data.modifiedValue != config_data.featureValue) || isEql === false){
                                delete config_data._id;
                            }
                        }
                        else if((config_data.modifiedValue != config_data.defaultValue) || isEql === false){
                            delete config_data._id;
                        }
                        configuration = new configurationModel(config_data);
                        if(config_data.hasOwnProperty('modifiedValue') && ( (config_data.modifiedValue == config_data.defaultValue) || isEql === true)){
                            configuration.set('featureValue','');
                        }
                        else if (config_data.hasOwnProperty('modifiedValue') && ( (config_data.modifiedValue != config_data.defaultValue) || isEql === false) ){
                            configuration.set('featureValue',config_data.modifiedValue);
                            if(config_data.modified){
                                configuration.set('lastModified',datevalue.toISOString());
                            }                     
                        }
                        configuration.set('locationOrGroupId',locationId);   
                        configuration.save(asynccallback);
                    });
                }
        },function (data){
            callback("","success"); 
        }) 
    }
    else{
        callback("locationOrGroupId not found."); 
    }
}

function checkArrayValue ( defaultArr, modifiedArr, featureType, arr_callback ) {
    
    if (featureType === constant.configFeatureType.SINGLESELECTDROPDOWN) {
        var isEql = true;
        var defaultArrLength = defaultArr.length;
        var modifiedArrLength = modifiedArr.length;

        for (var i = modifiedArrLength - 1; i >= 0; i--) {
            for (var j = defaultArrLength - 1; j >= 0; j--) {
                if (modifiedArr[i].name == defaultArr[j].name) {
                    if (modifiedArr[i].value != defaultArr[j].value) {
                        isEql = false;
                    }
                }
            }
        }
    }
    else {
        var isEql = null;
    }

    arr_callback (isEql);

}

/***********************************************************************
 *
 * FUNCTION:    resetToDefaultConfig
 *
 * DESCRIPTION: resetToDefault Config for location.
 *
 * PARAMETERS:  locationId and configData and callback.
 *
 * RETURNED:    deleted data..
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         15/02/2016    1.0.0       First Version
 *
 ***********************************************************************/
function resetToDefaultConfig(locationId, configData, callback ) {
    var locationId  =   locationId;
    var condition   =   {};
    condition["$and"]   =   [];

    if (locationId) {
        if (locationId == constant.DefaultlocationOrGroupId) {
           callback("Can not Delete Default locationOrGroupId..");
        }else
        {
            condition["$and"].push({
                locationOrGroupId: locationId
            });
            configurationModel.remove(condition).exec(callback);
        }
    }
    else{
        callback("locationOrGroupId not found."); 
    }
}

/***********************************************************************
 *
 * FUNCTION:    getConfigByUser
 *
 * DESCRIPTION: Get the config data for the first location in hierarchy.
 *
 * PARAMETERS:  userId and callback.
 *
 * RETURNED:    config Data (array of obj)
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         15/02/2016    1.0.0       First Version
 *
 ***********************************************************************/
function getConfigByUser(userInput, callback){

    var featureId   =   userInput.featureId;
    var condition   =   {};
    var locationId  =   '';
    condition["$and"]   =   [];
    condition["$and"].push({
        isDeleted: false
    });

    if (featureId && featureId != '') {
        condition["$and"].push({
            featureId: featureId
        });
    }

    console.log('url', env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId);
    request(env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId, function(err, response, data) {
        try
        {
            if (data) {
                var loc = JSON.parse(data);
                condition["$and"].push({
                    locationOrGroupId: loc.hierarchy[0].id
                });
                locationId = loc.hierarchy[0].id;
                
            }
        }
        catch(ex)
        {
            return callback('can not load user data.');
        }   

        getConfig ({locationId: locationId, featureId: featureId}, function (err, config_data) {
            callback (err, {config_arr: config_data ? config_data.config_arr : ''})
        });

        // configurationModel.find(condition).exec(function(err, config_data){
        //     checkTopMost(config_data, featureId,null, function(config_arr){
        //         callback(err, {config_arr:config_arr} );
        //     });
        // }); 
    })
}