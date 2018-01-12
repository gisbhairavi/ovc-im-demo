var express = require('express');
var log = require('../log');
var transactionitemModel  = require('./../model/transactionitemModel');
var router = express.Router();

module.exports = {
  getTransactionitem: getTransactionitem,
  createTransactionitem: createTransactionitem,
  editTransactionitem: editTransactionitem,
  deleteTransactionitem: deleteTransactionitem
};

/*
 * GET transactionitem by TransactionItem , id 
 */
function getTransactionitem(userInput, callback) {
  var id = userInput['id'];
  var tranId = userInput['tranId'];    
  if(id) {
    transactionitemModel.findById(id).exec(callback);  
  }else if(tranId) {
    transactionitemModel.find({tranId:new RegExp('^'+tranId+'$', "i"), isDeleted: false}).exec(callback);
  }else {
    transactionitemModel.find({isDeleted: false}).exec(callback);
  }
}

/*
 * create transactionitem.
 */
function createTransactionitem(userInput, callback) {
  userInput['createdBy']=userInput.user.clientId;
  userInput['updatedBy']=userInput.user.clientId;
  if(userInput['cost'] === '')
    delete userInput['cost'];
  var transactionitem = new transactionitemModel(userInput);
    transactionitem.save(callback);
}


/*
 * edit transactionitem by transactionitemId.
 */
function editTransactionitem(id, userInput, callback) {
  userInput['updatedBy']=userInput.user.clientId;
  var transactionitem = transactionitemModel.findById(id);
  if ( userInput['cost'] === '' )
      delete userInput['cost'];
  if(transactionitem){
    transactionitem.update(userInput,callback);
  }  
}

/*
 * delete transactionitem by transactionitemId.
 */
function deleteTransactionitem(data, callback){    
  editTransactionitem(data.id, {isDeleted:true,user: data.user}, callback);   
};

