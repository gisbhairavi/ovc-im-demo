var express = require('express');
var log = require('../log');
var replenishmentRequestItemModel  = require('./../model/replenishmentRequestItemModel');
var router = express.Router();

module.exports = {
  getReplenishmentRequestItem: getReplenishmentRequestItem,
  createReplenishmentRequestItem: createReplenishmentRequestItem,
  editReplenishmentRequestItem: editReplenishmentRequestItem,
  deleteReplenishmentRequestItem: deleteReplenishmentRequestItem
};


/*
 * GET ReplenishmentRequestItem by orderId.
 */
function getReplenishmentRequestItem(userInput, callback) {
  var id = userInput['id'];
  if(id) {
    replenishmentRequestItemModel.findById(id).exec(callback);      
   }else{
     replenishmentRequestItemModel.find({isDeleted: false}).exec(callback);
   } 
}

/*
 * create replenishmentRequestItem.
 */
function createReplenishmentRequestItem(userInput, callback) {
  userInput['createdBy']=userInput.user.clientId;
    userInput['updatedBy']=userInput.user.clientId;
  var replenishmentRequestItem = new replenishmentRequestItemModel(userInput);
    replenishmentRequestItem.save(callback);
}

/*
 * edit replenishmentRequestItem by id.
 */
function editReplenishmentRequestItem(id, userInput, callback) {

    userInput['updatedBy']=userInput.user.clientId;
  var replenishmentRequestItem = replenishmentRequestItemModel.findById(id);
  if(replenishmentRequestItem){
    replenishmentRequestItem.update(userInput,callback);
  }  
}

/*
 * delete ReplenishmentRequestItem by replenishmentRequestItemId.
 */
function deleteReplenishmentRequestItem(data, callback){  
  editReplenishmentRequestItem(data.id, {isDeleted:true,user:data.user}, callback);   
};

