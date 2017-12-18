var express = require('express');
var log = require('../log');
var documentruleModel  = require('./../model/documentruleModel');
var router = express.Router();

module.exports = {
  getDocumentrule: getDocumentrule,
  createDocumentrule: createDocumentrule,
  editDocumentrule: editDocumentrule,
  deleteDocumentrule: deleteDocumentrule
};

/*
 * GET documentrule by UOMId , id 
 */
function getDocumentrule(userInput, callback) {
  var id = userInput['id'];
  var directiveTypeId =   userInput['directivetypeid']; 
  if(id) {
    documentruleModel.findById(id).exec(callback);      
   }else if(directiveTypeId) {
    documentruleModel.find({directiveTypeId:new RegExp('^'+directiveTypeId+'$', "i"), isDeleted: false}).exec(callback);
  }else {
    documentruleModel.find({isDeleted: false}).exec(callback);
  }
}

/*
 * create documentrule.
 */
function createDocumentrule(userInput, callback) {
  userInput['createdBy']=userInput.user.clientId;
  userInput['updatedBy']=userInput.user.clientId;
  var documentrule = new documentruleModel(userInput);
  documentrule = JSON.parse(JSON.stringify(documentrule));
  delete documentrule._id;
  documentruleModel.findOneAndUpdate({
    "directiveTypeId" : userInput.directiveTypeId,
    "balanceType" : userInput.balanceType
  }, {
    $set: documentrule
  }, {
    upsert: true
  }, function(err, data) {
    callback(err, 'success');
  });
}


/*
 * edit documentrule by documentruleId.
 */
function editDocumentrule(id, userInput, callback) {
  userInput['updatedBy']=userInput.user.clientId;
  var documentrule = documentruleModel.findById(id);
  if(documentrule){
    documentrule.update(userInput,callback);
  }  
}

/*
 * delete documentrule by documentruleId.
 */
function deleteDocumentrule(data, callback){    
  editDocumentrule(data.id, {isDeleted:true,user: data.user}, callback);   
};

