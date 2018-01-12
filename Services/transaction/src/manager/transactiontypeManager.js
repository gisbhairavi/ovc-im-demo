var express = require('express');
var log = require('../log');
var transactiontypeModel = require('./../model/transactiontypeModel');
var router = express.Router();
module.exports = {
    getTransactionType: getTransactionType,
    createTransactionType: createTransactionType,
    editTransactionType: editTransactionType,
    deleteTransactionType: deleteTransactionType
};
/*
 * GET transactiontype by transactiontypeId , id 
 */
function getTransactionType(userInput, callback) {
    var id = userInput['id'];
    var key = userInput['key'];
    var tranCode = userInput['tranCode'];
    var tranTypeId = userInput['trantypeid'];
    var isAllowReversal  =  userInput['isAllowReversal'];
    if (id) {
        transactiontypeModel.findById(id).exec(callback);
    } else if (tranTypeId) {
        if (key) {
            transactiontypeModel.find({
                $and: [{
                    tranTypeId: new RegExp('^' + tranTypeId + '$', "i")
                }, {
                    isDeleted: false
                }, {
                    $or: [{
                        tranName: new RegExp('^.*?' + key + '.*?$', "i")
                    }, {
                        tranTypeId: new RegExp('^' + key + '$', "i")
                    }, {
                        description: new RegExp('^.*?' + key + '.*?$', "i")
                    }]
                }]
            }).exec(callback);
        } else {
            transactiontypeModel.find({
                tranTypeId: new RegExp('^' + tranTypeId + '$', "i"),
                isDeleted: false
            }).exec(callback);
        }
    } else if( tranCode ){
        transactiontypeModel.find({
            tranCode: new RegExp('^' + tranCode + '$', "i"),
            isDeleted: false
        }).exec(callback);
    }else if( isAllowReversal ){
        transactiontypeModel.find({
            isAllowReversal: true,
            isDeleted: false
        }).exec(callback);
    }else {
        if (key) {
            transactiontypeModel.find({
                $and: [{
                    isDeleted: false
                }, {
                    $or: [{
                        tranName: new RegExp('^.*?' + key + '.*?$', "i")
                    }, {
                        tranTypeId: new RegExp('^.*?' + key + '.*?$', "i")
                    }, {
                        description: new RegExp('^.*?' + key + '.*?$', "i")
                    }]
                }]
            }).exec(callback);
        } else {
            transactiontypeModel.find({
                isDeleted: false
            }).exec(callback);
        }
    }
}
/*
 * create transactiontype.
 */
function createTransactionType(userInput, callback) {
    userInput['createdBy'] = userInput.user.clientId;
    userInput['updatedBy'] = userInput.user.clientId;
    // userInput['requiredFields'] = strToJson(userInput['requiredFields']);
    var transactiontype = new transactiontypeModel(userInput);
    transactiontype.save(callback);
}
/* convert string to json, give required fields */
// function strToJson(str) {
//     var res = str.split(',');
//     var temp = {};
//     for (var i = 0; i < res.length; i++) {
//         temp[res[i]] = true;
//     }
//     return JSON.stringify(temp);
// }
/*
 * edit transactiontype by transactiontypeId.
 */
function editTransactionType(id, userInput, callback) {
    userInput['updatedBy'] = userInput.user.clientId;
    var transactiontype = transactiontypeModel.findById(id);
    // userInput['requiredFields'] = strToJson(userInput['requiredFields']);
    if (transactiontype) {
        transactiontype.update(userInput, callback);
    }
}
/*
 * delete transactiontype by transactiontypeId.
 */
function deleteTransactionType(data, callback) {
    var transactiontype = transactiontypeModel.findById(data.id);
    transactiontype.update({
        isDeleted: true,
        updatedBy: data.user.clientId
    }, callback);
};