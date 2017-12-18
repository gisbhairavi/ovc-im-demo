var express = require('express');
var log = require('../log');
var locationModel = require('./../model/locationModel');
var locationitemsModel = require('./../model/locationitemsModel');
var async = require('async');
var constant = require('../../config/const.json');
module.exports = {
    getLocationitem: getLocationitem,
    createLocationitem: createLocationitem,
    editLocationitem: editLocationitem,
    deleteLocationitem: deleteLocationitem
};
/*
 * GET location by locationId , id 
 */
function getLocationitem(userInput, callback) {
    var id = userInput['id'];
    var key = userInput['key'];
    var locationid = userInput['locationid'];
    if (id) {
        locationitemsModel.findById(id).exec(callback);
    } else if (locationid) {
        locationitemsModel.find({
            isDeleted: false,
            locationId: locationid
        }).exec(callback);
    } else {
        callback('no locationid.');
    }
}
/*
 * create locationitemsModel.
 */
function createLocationitem(userInput, callback) {
    try {
        var skus = JSON.parse(userInput['skus']);
    } catch (e) {
        var skus = [];
    }
    if (skus && skus.length) {
        var createsku = [];
        var updated = 0;
        async.forEach(skus, function(sku, asynccallback) {
            sku['updatedBy'] = userInput.user.clientId;
            if (sku._id) {
                var loc = locationitemsModel.findById(sku._id);
                loc.update(sku, function() {
                    updated++;
                    asynccallback();
                });
            } else {
                sku['createdBy'] = userInput.user.clientId;
                createsku.push(sku);
                asynccallback();
            }
        }, function() {
            if (createsku.length) {
                locationitemsModel.create(skus,function() {
                    callback('', {
                        status: constant.label.SUCCESS
                    });
                });
            } else {
                callback('', {
                    status: constant.label.SUCCESS
                });
            }
        });
        // for (sku in skus) {
        // }
        // var loc = new locationitemsModel(userInput);
        // loc.save(callback);
    } else {
        callback('No skus.');
    }
}
/*
 * edit locationitemsModel.
 */
function editLocationitem(id, userInput, callback) {
    userInput['updatedBy'] = userInput.user.clientId;
    var loc = locationitemsModel.findById(id);
    if (loc) {
        loc.update(userInput, callback);
    }
}
/*
 * delete locationitemsModel.
 */
function deleteLocationitem(data, callback) {
    editLocationitem(data.id, {
        isDeleted: true,
        user: data.user
    }, callback);
};