var express = require('express');
var log = require('../log');
var locationModel = require('./../model/locationModel');
var router = express.Router();
module.exports = {
    getLocation: getLocation,
    createLocation: createLocation,
    editLocation: editLocation,
    deleteLocation: deleteLocation,
    hierarchyLocations: hierarchyLocations
};
/*
 * GET location by locationId , id 
 */
function getLocation(userInput, callback) {
    var id = userInput['id'];
    var key = userInput['key'];
    var locationid = userInput['locationid'];
    if (id) {
        locationModel.findById(id).exec(function(err,locationData){
            var locationArray = [];
            if(locationData){
                if(locationData.parentStockingLocationId != null && locationData.parentStockingLocationId != ''){
                    locationArray.push([locationData.parentStockingLocationId]);
                }
            }
            locationModel.find({
                "stockingLocationId":{
                    "$in": locationArray
                }
            }).exec(function(e,locData){
                for( var k = 0; k < locData; k++) {
                    if(locationData.parentStockingLocationId == locData.stockingLocationId) {
                        locationData.parentStockingLocationId = locData[k];
                    }
                }
                callback(null,locationData);
            });
        });
    } else if (locationid && key) {
        locationModel.find({
            $and: [{
                locationId: locationid
            }, {
                isDeleted: false
            }, {
                $or: [{
                    locationName: new RegExp('^.*?' + key + '.*?$', "i")
                }, {
                    stockingLocationDescription: new RegExp('^.*?' + key + '.*?$', "i")
                }, {
                    stockingLocationId: new RegExp('^.*?' + key + '.*?$', "i")
                }]
            }]
        }).exec(function(err,locationData){
            var locationArray = [];
            if(locationData){
                if(locationData.parentStockingLocationId != null && locationData.parentStockingLocationId != ''){
                    locationArray.push([locationData.parentStockingLocationId]);
                }
            }
            locationModel.find({
                "stockingLocationId":{
                    "$in": locationArray
                }
            }).exec(function(e,locData){
                for( var k = 0; k < locData; k++) {
                    if(locationData.parentStockingLocationId == locData.stockingLocationId) {
                        locationData.parentStockingLocationId = locData[k];
                    }
                }
                callback(null,locationData);
            });
        });
    } else if (locationid) {
        locationModel.find({
            isDeleted: false,
            locationId: locationid
        }).exec(function(err,locationData){
            var locationArray = [];
            if(locationData){
                if(locationData.parentStockingLocationId != null && locationData.parentStockingLocationId != ''){
                    locationArray.push([locationData.parentStockingLocationId]);
                }
            }
            locationModel.find({
                "stockingLocationId":{
                    "$in": locationArray
                }
            }).exec(function(e,locData){
                for( var k = 0; k < locData; k++) {
                    if(locationData.parentStockingLocationId == locData.stockingLocationId) {
                        locationData.parentStockingLocationId = locData[k];
                    }
                }
                callback(null,locationData);
            });
        });
    } else {
        locationModel.find({
            isDeleted: false
        }).exec(function(err,locationData){
            var locationArray = [];
            if(locationData){
                if(locationData.parentStockingLocationId != null && locationData.parentStockingLocationId != ''){
                    locationArray.push([locationData.parentStockingLocationId]);
                }
            }
            locationModel.find({
                "stockingLocationId":{
                    "$in": locationArray
                }
            }).exec(function(e,locData){
                for( var k = 0; k < locData; k++) {
                    if(locationData.parentStockingLocationId == locData.stockingLocationId) {
                        locationData.parentStockingLocationId = locData[k];
                    }
                }
                callback(null,locationData);
            });
        });
    }
}
/*
 * create location.
 */
function createLocation(userInput, callback) {
    userInput['createdBy'] = userInput.user.clientId;
    userInput['updatedBy'] = userInput.user.clientId;
    var stockingLocationId = userInput['stockingLocationId'];
    var locationId = userInput['locationId'];
    locationModel.find({locationId:locationId,stockingLocationId: stockingLocationId, isDeleted:false}, function(error,data){
        if(data){
            if(data.length > 0) {
                return callback('Stocking Location Id must be unique',null);
            } else {
                var location = new locationModel(userInput);
                location.save(callback);
            }
        }else {
            return callback('Error can not update.',null);
        }
    });
}
/*
 * edit location by locationId.
 */
function editLocation(id, userInput, callback) {
    userInput['updatedBy'] = userInput.user.clientId;
    try {
        delete userInput['stockingLocationId'];
        delete userInput['locationId'];
    } catch(e) {}
    var location = locationModel.findById(id);
    if (location) {
        location.update(userInput, callback);
    }
}
/*
 * delete location by locationId.
 */
function hierarchyLocations(data, callback) {
  console.log(data);
    var location = data['location'];
    if (location) {
        var srch = {};
        srch.$or = [];
        srch.$or.push({
            parentStockingLocationId: location
        });
        srch.$or.push({
            locationId: location
        });
        locationModel.find(srch, callback);
    } else {
        callback('No locationid.')
    }
};
/*
 * delete location by locationId.
 */
function deleteLocation(data, callback) {
    editLocation(data.id, {
        isDeleted: true,
        user: data.user
    }, callback);
};