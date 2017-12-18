var express = require('express');
var log = require('../log');
var transactioniteminventoryModel  = require('./../model/transactioniteminventoryModel');
var router = express.Router();

var inventoryavailabilityModel = require('./../model/inventoryavailabilityModel');
var env_config = require('../../config/config.js');
var config = require('../../config/const.json');
var request = require('request');

module.exports = {
  getTransactioniteminventory: getTransactioniteminventory,
  createTransactioniteminventory: createTransactioniteminventory,
  editTransactioniteminventory: editTransactioniteminventory,
  deleteTransactioniteminventory: deleteTransactioniteminventory,
  getLocationItemInventory: getLocationItemInventory
};

/*
 * GET transactioniteminventory by TransactionItem , id 
 */
function getTransactioniteminventory(userInput, callback) {
  var id = userInput['id'];
  var tranId = userInput['tranId'];    
  if(id) {
    transactioniteminventoryModel.findById(id).exec(callback);  
  }else if(tranId) {
    transactioniteminventoryModel.find({tranId:new RegExp('^'+tranId+'$', "i"), isDeleted: false}).exec(callback);
  }else {
    transactioniteminventoryModel.find({isDeleted: false}).exec(callback);
  }
}

/*
 * create transactioniteminventory.
 */
function createTransactioniteminventory(userInput, callback) {
  userInput['createdBy']=userInput.user.clientId;
  userInput['updatedBy']=userInput.user.clientId;
  var transactioniteminventory = new transactioniteminventoryModel(userInput);
    transactioniteminventory.save(callback);
}


/*
 * edit transactioniteminventory by transactioniteminventoryId.
 */
function editTransactioniteminventory(id, userInput, callback) {
  userInput['updatedBy']=userInput.user.clientId;
  var transactioniteminventory = transactioniteminventoryModel.findById(id);
  if(transactioniteminventory){
    transactioniteminventory.update(userInput,callback);
  }  
}

/*
 * delete transactioniteminventory by transactioniteminventoryId.
 */
function deleteTransactioniteminventory(data, callback){    
  editTransactioniteminventory(data.id, {isDeleted:true,user: data.user}, callback);   
};

/***********************************************************************
 *
 * FUNCTION:    getLocationItemInventory
 *
 * DESCRIPTION: For get all sibling location inventory item based on given 
 *              location.
 *
 * PARAMETERS:  "" or "locationId".
 *
 * RETURNED:    all sibling location inventory item based on given 
 *              location.
 *
 * REVISION HISTORY:
 *
 *            Name          Date            Description
 *            ----          ----            -----------
 *            Arun          24/06/2016      First Version
 *
 ***********************************************************************/
function getLocationItemInventory( userInput, callback )
{
    var locationId  =   userInput["locationId"].split(',');
    var sku         =   userInput["sku"];
    var locationArr =   [];
    var condition   =   {};
    if (locationId) 
    {
        console.log('url', env_config.dashPath + config.apis.GETFRANCHISESTORE + locationId + '&config=allStore');
        request(env_config.dashPath + config.apis.GETFRANCHISESTORE + locationId + '&config=allStore', function(err, response, data) {
            try 
            {
                if (data) {
                    var loc = JSON.parse(data);
                    Object.keys(loc).forEach(function(n) {
                        locationArr.push(loc[n].id);
                    });
                }
                condition["locationId"] = {
                    "$in": locationArr
                };
            } 
            catch (ex) 
            {
                return callback('can not load user data.');
            }
            if(sku)
            {
                condition["sku"] = sku;
            }
            inventoryavailabilityModel.aggregate( { 
                $match : condition 
            },
            {
                $group: {
                    _id: {
                        "sku": "$sku",
                        "locationId" : "$locationId"
                    },
                    "storevalue": {
                        "$push": {
                            "value": "$value",
                            "balanceType": "$balanceType"
                        }
                    }
                }
            }).exec(function(err, inv_data){
                var inv_result = {};
                for (var num = inv_data.length - 1; num >= 0; num--) {
                    if(!inv_result[inv_data[num]["_id"].locationId])
                    {
                        inv_result[inv_data[num]["_id"].locationId] = {};
                    }
                    if(!inv_result[inv_data[num]["_id"].locationId][inv_data[num]["_id"].sku])
                    {
                        inv_result[inv_data[num]["_id"].locationId][inv_data[num]["_id"].sku] = [];
                    }
                    inv_result[inv_data[num]["_id"].locationId][inv_data[num]["_id"].sku] = inv_data[num].storevalue;
                }
                callback(err, inv_result);
            });
        });
    } else {
        callback("locationId should not empty");
    }
}