var express = require('express');
var log = require('../log');
var countItemQtyModel = require('./../model/countItemQtyModel');
var router = express.Router();
module.exports = {
    getCountItemQty: getCountItemQty,
    createCountItemQty: createCountItemQty,
    editCountItemQty: editCountItemQty,
    deleteCountItemQty: deleteCountItemQty,
    updateCountItemQty: updateCountItemQty,
    updateQty: updateQty,
    getCountItemQtyRecount: getCountItemQtyRecount
};
/*
 * GET Recount.
 sort({
            countNumber: -1,
        }).
 */
function getCountItemQtyRecount(allcount, data, callback) {
    if (allcount === '') {
        if (data) {
            countItemQtyModel.aggregate(
                [{
                    $match: {
                        $and: [{
                            'countItemId': data.toString()
                        }, {
                            isDeleted: false
                        }]
                    }
                }, {
                    $sort: {
                        countNumber: 1,
                    }
                }, {
                    $group: {
                        _id: "$countItemId",
                        'qty': {
                            $last: "$qty"
                        },
                    }
                }]).exec(function(x, v) {
                console.log(v);
                callback(x, v);
            });
        } else {
            callback(1);
        }
    } else {
        if (data) {
            countItemQtyModel.find({
                countItemId: data,
                isDeleted: false
            }, 'countNumber countItemId qty _id').sort({
                countNumber: 1,
            }).exec(function(err, data) {
                callback(err, data);
            });
        } else {
            callback(1, allcount);
        }
    }
}
/*
 * GET countItemQty by countItemQtyId.
 */
function getCountItemQty(userInput, callback) {
    var id = userInput['id'];
    var countItemData = userInput['countItemData'];
    var countNumber = userInput['countNumber'];
    var page_offset = userInput['page_offset'] || 0;
    var page_lmt = userInput['page_lmt'] || 0;
    var countItems = userInput['countItems'];

    if(countNumber && countItemData){
        countItemQtyModel.find({countItemId:{ $in: countItemData},countNumber:countNumber,isDeleted: false}).count().exec(function(err,totalCount){
            countItemQtyModel.find({countItemId:{ $in: countItemData},countNumber:countNumber,isDeleted: false}).skip(page_offset).limit(page_lmt).exec(function(error,countItemQtyData){
                if(error)
                    callback(error,'');
                else{
                    var response ={
                        totalCount: totalCount,
                        countItemQtyData:countItemQtyData
                    }
                    callback('',response);
                }
            });
        });
    }else if(countItems){
        countItemQtyModel.find({countItemId:{ $in: countItems}}).sort({"countNumber":-1}).limit(1).exec(function(err,countItemQty){
            if(err)
                callback(err,'');
            else
                callback('',countItemQty);
        });
    }
    else {
        countItemQtyModel.findById(id).exec(callback);
    }
}
/*
 * create countItemQty.
 */
function createCountItemQty(c, callback) {
    countItemQtyModel.create(c, callback);
    // var countItemQty = new countItemQtyModel;
    // countItemQty.save(callback);
}
/*
 * edit countItemQty by id.
 */
function editCountItemQty(id, userInput, callback) {
    var countItemQty = countItemQtyModel.findById(id);
    if (countItemQty) {
        countItemQty.update(userInput, callback);
    }
}
/*
 * update countItemQty by id.
 */
function updateCountItemQty(id, countNumber, qty, callback) {
    countItemQtyModel.findOne({
        'countItemId': id,
        'countNumber': countNumber
    }, function(err, countItemQty) {
        if (countItemQty) {
            countItemQty.update(qty, {
                upsert: true,
                new: true
            }, callback);
        } else {
            createCountItemQty(qty, callback);
        }
    });
}
function updateQty(data,qty, callback){
  try {
    countItemQtyModel.update(data,{$set:qty}, {
        upsert: true,
        new: true
    }, callback);
  } catch (e) {
    callback(e);
  }
}
/*
 * delete countItemQty by countItemQtyId.
 */
function deleteCountItemQty(data, callback) {
    editCountItemQty(data.id, {
        isDeleted: true,
        user: data.user
    }, callback);
};
