var express = require('express');
var log = require('../log');
var reasonCodeModel  = require('./../model/reasonCodeModel');
var router = express.Router();
var constant = require('../../config/const.json');

module.exports = {
    getReasonCode: getReasonCode,
    createReasonCode: createReasonCode,
    editReasonCode: editReasonCode,
    deleteReasonCode: deleteReasonCode
};

/***********************************************************************
 *
 * FUNCTION:    getReasonCode
 *
 * DESCRIPTION: To get the Reason Code for the given search key.
 *
 * PARAMETERS:  "", "key" and callback.
 *
 * RETURNED:    Reason Code data (array of object).
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         03/04/2016    1.0.0       First Version
 *
 ***********************************************************************/
function getReasonCode(userInput, callback) {
    var res_id = userInput['res_id'];
    var key = userInput['key'];
    var code_type = userInput['code_type'];
    if(res_id) {
        reasonCodeModel.findOne({
            id : res_id,
            isDeleted : false
        }).exec(callback);
    }
    else if(code_type){
        reasonCodeModel.find({ $and: [ { codeType: code_type }, { isDeleted: false } ] }).exec(callback);
    }
    else if(key) {    
        reasonCodeModel.find({ $or: [ { id: new RegExp('^.*?'+key+'.*?$', "i") }, 
        { locationOrGroupId: new RegExp('^.*?'+key+'.*?$', "i") },
        { description: new RegExp('^.*?'+key+'.*?$', "i") } ] , isDeleted: false }).exec(callback);   
  
    }
    else {
        reasonCodeModel.find({isDeleted: false}).exec(callback);
    }
}

/***********************************************************************
 *
 * FUNCTION:    createReasonCode
 *
 * DESCRIPTION: To create Reason Code for the userInput.
 *
 * PARAMETERS:  "userInput" and callback.
 *
 * RETURNED:    "__v = 0" if success, "error" if error
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         03/04/2016    1.0.0       First Version
 *
 ***********************************************************************/
function createReasonCode(userInput, callback) {
    userInput['createdBy']=userInput.user.clientId;
    userInput['updatedBy']=userInput.user.clientId;
    var res_id  =  userInput['id'];
    reasonCodeModel.findOne({
        id : res_id,
        isDeleted : false
    },function( err, data ){
        if( data ){
            var result = {
                status: constant.label.ERROR,
                message: constant.label.NOT_UNIQUE_ID
            }
            callback(null, result);
        }
        else{
            var reason_code = new reasonCodeModel(userInput);
            reason_code.save(callback);
        }
    });
}

/***********************************************************************
 *
 * FUNCTION:    editReasonCode
 *
 * DESCRIPTION: To edit Reason Code for the userInput.
 *
 * PARAMETERS:  "res_id", "userInput" and callback.
 *
 * RETURNED:    "ok = 1" if success, "error" if error
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         03/04/2016    1.0.0       First Version
 *
 ***********************************************************************/
function editReasonCode(res_id, userInput, callback) {
    userInput['updatedBy']=userInput.user.clientId;
    var res_code_id = userInput['id'] || res_id;
    var code_data = userInput.code_data;
    reasonCodeModel.findOne({
        id : res_code_id,
        isDeleted : false
    },function(err, res_code_data){
        if(res_code_data){
            reasonCodeModel.findOne({
                id : code_data.id,
                isDeleted : false
            },function( err, data ){
                if(data && data.id != res_code_id){
                    var result = {
                        status: constant.label.ERROR,
                        message: constant.label.NOT_UNIQUE_ID
                    }
                    callback(null, result);
                }
               else{
                    reasonCodeModel.update({
                        "id": res_code_data.id
                    }, {
                        $set: code_data
                    }).exec(callback);
                }
            })
            
        } 
        else{
            callback(err);
        } 
    });

}

/***********************************************************************
 *
 * FUNCTION:    deleteReasonCode
 *
 * DESCRIPTION: To delete Reason Code.
 *
 * PARAMETERS:  "id" and callback.
 *
 * RETURNED:    "ok = 1" if success, "error" if error
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         03/04/2016    1.0.0       First Version
 *
 ***********************************************************************/
function deleteReasonCode(data, callback){
    editReasonCode(data.id, {
        code_data:{
            isDeleted:true,
        },
        user:data.user
    }, callback);   
};

