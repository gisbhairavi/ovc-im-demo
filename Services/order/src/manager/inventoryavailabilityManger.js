var express = require('express');
var log = require('../log');
var scheduleAtpModel = require('./../model/scheduleAtpModel');
var router = express.Router();
module.exports = {
    checkAvailability: checkAvailability,
    createAvailability: createAvailability,
    updateAvailability: updateAvailability,
    getSkuValue: getSkuValue,
};

function checkAvailability(userInput, callback) {
    scheduleAtpModel.find({
        'sku': userInput['sku'],
        'locationId': userInput['locationId'],
        'balanceType': userInput['balanceType']
    }, function(err, data) {
        if (err) {
            return console.log('Error ' + err);
        }
        if (data.length > 0) {
            updateAvailability(data[0]._id, userInput, callback);
            log.info('SKU ' + userInput['sku'] + ' Updated Successfully');
        } else {
            createAvailability(userInput, callback);
            log.info('SKU ' + userInput['sku'] + ' Inserted Successfully');
        }
    });
}

function getSkuValue(querydata, callback) {
    var locationId = querydata['loc'];
    var sku = querydata['sku'];
    var balanceType = "oh";
    // var balanceType = querydata['balanceType'] ? querydata['balanceType'] : "oh";
    if (locationId && sku) {
        scheduleAtpModel.find({
            'sku': sku,
            'locationId': locationId,
            'balanceType': balanceType
        }, callback);
    } else {
        console.log("sku","no sku found.");
        callback("no sku found.");
    }
}

function createAvailability(userInput, callback) {
    userInput['createdBy']=userInput.user.clientId;
    userInput['updatedBy']=userInput.user.clientId;   
    var Availability = new scheduleAtpModel(userInput);
    Availability.save(callback);
}

function updateAvailability(id, userInput, callback) {
    
    userInput['updatedBy']=userInput.user.clientId;   
    var Availability = scheduleAtpModel.findById(id);
    if (Availability) {
        Availability.update(userInput, callback);
    }
}