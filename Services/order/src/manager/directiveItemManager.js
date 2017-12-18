var express = require('express');
var events = require('events');
var log = require('../log');
var directiveItemModel  = require('./../model/directiveItemModel');
var router = express.Router();
var eventEmitter = new events.EventEmitter();

module.exports = {
  getDirectiveItem: getDirectiveItem,
  createDirectiveItem: createDirectiveItem,
  editDirectiveItem:editDirectiveItem,
  deleteDirectiveItem: deleteDirectiveItem
};


/*
 * GET directiveItem by id.
 */
function getDirectiveItem(userInput, callback) {
  var id = userInput['id'];
  if(id) {
    directiveItemModel.findById(id).exec(callback);      
   }else{
     directiveItemModel.find({isDeleted: false}).exec(callback);
   } 
}

/*
 * create directiveItem.
 */
function createDirectiveItem(userInput, callback) { 
    userInput['createdBy']=userInput.user.clientId;
    userInput['updatedBy']=userInput.user.clientId;   
    var directiveItem = new directiveItemModel(userInput);
    directiveItem.save(callback);
} 

/*
 * edit directiveItem.
 */

function editDirectiveItem(id, userInput, callback) {

    userInput['updatedBy']=userInput.user.clientId;
  var directiveItem = directiveItemModel.findById(id);
  if(directiveItem){
    directiveItem.update(userInput,callback);
  }  
}

/*
 * delete directiveItem by id.
 */
function deleteDirectiveItem(data, callback){  
 editDirectiveItem(data.id, {isDeleted:true,user:data.user}, callback);  
};

