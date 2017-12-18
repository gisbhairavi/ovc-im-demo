var express = require('express');
var log = require('../log');
var documenttypeModel  = require('./../model/documenttypeModel');
var router = express.Router();

module.exports = {
  getDocumenttype: getDocumenttype,
  createDocumenttype: createDocumenttype,
  editDocumenttype: editDocumenttype,
  deleteDocumenttype: deleteDocumenttype
};

/*
 * GET documenttype by directiveTypeId , id 
 */
function getDocumenttype(userInput, callback) {
  var id = userInput['id'];
  var directiveTypeId = userInput['directivetypeid'];    
  var key = userInput['key'];

  if(id) {
    documenttypeModel.findById(id).exec(callback);      
  }else if(directiveTypeId && key ) {
     // documenttypeModel.find({directiveTypeId:new RegExp('^'+directiveTypeId+'$', "i"), isDeleted: false}).exec(callback);
      documenttypeModel.find({   
                         $and:[{directiveTypeId:new RegExp('^'+directiveTypeId+'$', "i")},{isDeleted: false},
                           {$or:[
                                {directiveName:new RegExp('^.*?'+key+'.*?$', "i")},                                
                                {tranTypeId:new RegExp('^.*?'+key+'.*?$', "i")}                                
                                ]
                           }]     
                       }).exec(callback);
  }else if(directiveTypeId){
    documenttypeModel.find({directiveTypeId:new RegExp('^'+directiveTypeId+'$', "i"), isDeleted: false}).exec(callback);
  }else if(key){

    documenttypeModel.find({   
                         $and:[{isDeleted: false},
                           {$or:[
                                {directiveTypeId:new RegExp('^.*?'+key+'.*?$', "i")},
                                {directiveName:new RegExp('^.*?'+key+'.*?$', "i")},                                
                                {tranTypeId:new RegExp('^.*?'+key+'.*?$', "i")}                                
                                ]
                           }]     
                       }).exec(callback);

       
  }else {
    documenttypeModel.find({isDeleted: false}).exec(callback);
  }
}

/*
 * create documenttype.
 */
function createDocumenttype(userInput, callback) { 

   //userInput['requiredFields'] = strToJson(userInput['requiredFields']);
  userInput['createdBy']=userInput.user.clientId;
  userInput['updatedBy']=userInput.user.clientId;
  var documenttype = new documenttypeModel(userInput);
    documenttype.save(callback);
}

/* convert string to json, give required fields */
/*function strToJson(str){  
  var res = str.split(',');
  var temp = {};
  for(var i=0;i<res.length;i++){
    temp[res[i]] = true;
  } 
  return JSON.stringify(temp);
}*/

/*
 * edit documenttype by directiveTypeId.
 */
function editDocumenttype(id, userInput, callback) {
  userInput['updatedBy']=userInput.user.clientId;
  var documenttype = documenttypeModel.findById(id);  
  
  if(documenttype){    
    //userInput['requiredFields'] = strToJson(userInput['requiredFields']);
    documenttype.update(userInput,callback);
  }  
}

/*
 * delete documenttype by directiveTypeId.
 */
function deleteDocumenttype(data, callback){
editDocumenttype(data.id, {isDeleted:true,user: data.user}, callback);   
};

