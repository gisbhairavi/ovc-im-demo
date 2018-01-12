var express = require('express');
var log = require('../log');
var directiveMasterModel  = require('./../model/directiveMasterModel');
var router = express.Router();

module.exports = {
  getDirectiveMaster: getDirectiveMaster,
  createDirectiveMaster: createDirectiveMaster,
  editDirectiveMaster: editDirectiveMaster,
  deleteDirectiveMaster: deleteDirectiveMaster
};


/*
 * GET DirectiveMaster by DirectiveMasterId.
 */
function getDirectiveMaster(userInput, callback) {
  var id = userInput['id'];
  if(id) {
    directiveMasterModel.findById(id).exec(callback);      
   }else{
     directiveMasterModel.find({isDeleted: false}).exec(callback);
   } 
}

/*
 * create DirectiveMaster.
 */
function createDirectiveMaster(userInput, callback) {
  userInput['createdBy']=userInput.user.clientId;
    userInput['updatedBy']=userInput.user.clientId;   
  var directiveMaster = new directiveMasterModel(userInput);
    directiveMaster.save(callback);
}

/*
 * edit DirectiveMaster by id.
 */
function editDirectiveMaster(id, userInput, callback) {
    userInput['updatedBy']=userInput.user.clientId;   
  var directiveMaster = directiveMasterModel.findById(id);
  if(directiveMaster){
    directiveMaster.update(userInput,callback);
  }  
}

/*
 * delete DirectiveMaster by DirectiveMasterId.
 */
function deleteDirectiveMaster(data, callback){  
  editDirectiveMaster(data.id, {isDeleted:true,user:data.user}, callback);   
};

