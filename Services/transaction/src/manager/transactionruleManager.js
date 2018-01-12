var express = require('express');
var log = require('../log');
var transactionruleModel  = require('./../model/transactionruleModel');
var router = express.Router();

module.exports = {
  getTransactionRule: getTransactionRule,
  createTransactionRule: createTransactionRule,
  editTransactionRule: editTransactionRule,
  deleteTransactionRule: deleteTransactionRule
};

/*
 * GET transactionrule by transactionruleId , id 
 */
function getTransactionRule(userInput, callback) {
  var id = userInput['id'];
  var tranTypeId = userInput['trantypeid'];
  if(id) {
    transactionruleModel.findById(id).exec(callback);
  }else if(tranTypeId) {
    transactionruleModel.find({tranTypeId: tranTypeId, isDeleted: false}).exec(callback);
  }else {
    transactionruleModel.find({isDeleted: false}).exec(callback);
  }
}

/*
 * create transactionrule.
 */
function createTransactionRule(userInput, callback) {
  userInput['createdBy']=userInput.user.clientId;
  userInput['updatedBy']=userInput.user.clientId;
  var transactionrule = new transactionruleModel(userInput);
    transactionrule.save(callback);
}


/*
 * edit transactionrule by transactionruleId.
 */
function editTransactionRule(id, userInput, callback) {
  userInput['updatedBy']=userInput.user.clientId;
  var transactionrule = transactionruleModel.findById(id);
  if(transactionrule){
    transactionrule.update(userInput,callback);
  }  
}

/*
 * delete transactionrule by transactionruleId.
 */
function deleteTransactionRule(data, callback){  
  editTransactionRule(data.id, {isDeleted:true,user: data.user}, callback);   
};

