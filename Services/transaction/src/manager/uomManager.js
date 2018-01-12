var express = require('express');
var log = require('../log');
var uomModel  = require('./../model/uomModel');
var router = express.Router();

module.exports = {
  getUom: getUom,
  createUom: createUom,
  editUom: editUom,
  deleteUom: deleteUom
};

/*
 * GET uom by UOMId , id 
 */
function getUom(userInput, callback) {
  var id = userInput['id'];
  var uomId = userInput['uomId'];    
  if(id) {
    uomModel.findById(id).exec(callback);  
  }else if(uomId) {
    uomModel.find({uomId:new RegExp('^.*?'+uomId+'.*?$', "i"), isDeleted: false}).exec(callback);
  }else {
    uomModel.find({isDeleted: false}).exec(callback);
  }
}

/*
 * create uom.
 */
function createUom(userInput, callback) {
  userInput['createdBy']=userInput.user.clientId;
  userInput['updatedBy']=userInput.user.clientId;
  var uom = new uomModel(userInput);
    uom.save(callback);
}


/*
 * edit uom by uomId.
 */
function editUom(id, userInput, callback) {
  userInput['updatedBy']=userInput.user.clientId;
  var uom = uomModel.findById(id);
  if(uom){
    uom.update(userInput,callback);
  }  
}

/*
 * delete uom by uomId.
 */
function deleteUom(data, callback){    
  editUom(data.id, {isDeleted:true,user: data.user}, callback);   
};

