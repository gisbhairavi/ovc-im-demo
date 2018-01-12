var express = require('express');
var log = require('../log');
var replenishmentRequestModel  = require('./../model/replenishmentRequestModel');
var router = express.Router();

module.exports = {
  getReplenishmentRequest: getReplenishmentRequest,
  createReplenishmentRequest: createReplenishmentRequest,
  editReplenishmentRequest: editReplenishmentRequest,
  deleteReplenishmentRequest: deleteReplenishmentRequest
};


/*
 * GET ReplenishmentRequest by ReplenishmentRequestId.
 */
function getReplenishmentRequest(userInput, callback) {
  var id = userInput['id'];
  if(id) {
    replenishmentRequestModel.findById(id).exec(callback);      
   }else{
     replenishmentRequestModel.find({isDeleted: false}).exec(callback);
   } 
}

/*
 * create ReplenishmentRequest.
 */
function createReplenishmentRequest(userInput, callback) {
 
 /* var url = userInput['url'];
  var request = require('request');
    request('http://demo.greatinnovus.com/ovcdashboard/apis/ang_getstockjson?locid=Prahran', function (err, response, body) {
      if (!err && response.statusCode == 200) {
        body = JSON.parse(body);
        console.log("url data--------------->"+JSON.stringify(body));
        if(body["status"] == 'error'){
         callback(err,null);
        }else{
          callback(err,body);
       }
      }
    })
*/
  userInput['createdBy']=userInput.user.clientId;
    userInput['updatedBy']=userInput.user.clientId;
  var replenishmentRequest = new replenishmentRequestModel(userInput);
    replenishmentRequest.save(callback);
}

/*
 * edit replenishmentRequest by id.
 */
function editReplenishmentRequest(id, userInput, callback) {

    userInput['updatedBy']=userInput.user.clientId;
  var replenishmentRequest = replenishmentRequestModel.findById(id);
  if(replenishmentRequest){
    replenishmentRequest.update(userInput,callback);
  }  
}

/*
 * delete replenishmentRequest by ReplenishmentRequestId.
 */
function deleteReplenishmentRequest(data, callback){  
  editReplenishmentRequest(data.id, {isDeleted:true,user: data.user}, callback);   
};

