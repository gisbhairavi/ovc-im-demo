var express = require('express');
var async = require('async');
var log = require('../log');
var transactionModel = require('./../model/transactionModel');
var transactiondataModel = require('./../model/transactionitemModel');
var transactionhistoryManager = require('./transactionhistoryManager');
var router = express.Router();
module.exports = {
    getTransaction: getTransaction,
    getTrantypeqtyData: getTrantypeqtyData,
    createTransaction: createTransaction,
    editTransaction: editTransaction,
    deleteTransaction: deleteTransaction
};
/*
 * GET transaction by UOMId , id 
 */
function getTransaction(userInput, callback) {
    var id = userInput['id'];
    var tranTypeId = userInput['tranTypeId'];
    if (id) {
        transactionModel.findById(id).exec(callback);
    } else if (tranTypeId) {
        transactionModel.find({
            tranTypeId: new RegExp('^' + tranTypeId + '$', "i"),
            isDeleted: false
        }).exec(callback);
    } else {
        transactionModel.find({
            isDeleted: false
        }).exec(callback);
    }
}
/*
 * create transaction.
 */
function createTransaction(userInput, callback) {
    userInput['createdBy'] = userInput.user.clientId;
    userInput['updatedBy'] = userInput.user.clientId;
    var transaction = new transactionModel(userInput);
    transaction.save(callback);
}
/*
 * edit transaction by transactionId.
 */
function editTransaction(id, userInput, callback) {
    if (id) {
        var transaction = transactionModel.findById(id);
        if (transaction) {
            transaction.update(userInput, callback);
        }
    }
    else if (userInput.count_number) {
        transactionModel.update({
            countNumber: userInput.count_number
        },{
            '$set': {sqsJson: userInput.sqsJson}
        },{
            multi: true
        }).exec(callback);
    }
}
/*
 * delete transaction by transactionId.
 */
function deleteTransaction(data, callback) {
    editTransaction(data.id, {
        isDeleted: true,
        user: data.user
    }, callback);
};
/*
 * getTrantypeqtyData.
 */
function getTrantypeqtyData(data, callback) {
    transactionhistoryManager.getTransactionHistory(data, function(err, trandata) {
        var tranType = [];
        var tranTypeObj = {};
        var sku = [];
        if (err) {
            callback('', {});
            return console.log('Error ' + err);
        }
        if (data['sku']) {
            sku = data['sku'].split(',');
        }
        var locres = [];
        var locdata = {};
        for (var j = 0, length2 = trandata.data.length; j < length2; j++) {
            tranType.push(trandata.data[j]._id.toString());
            tranTypeObj[trandata.data[j]._id] = trandata.data[j].tranTypeId == "" ? trandata.data[j].directiveTypeId : trandata.data[j].tranTypeId;
            locres[trandata.data[j].fromLocationId] ? '' : locres[trandata.data[j].fromLocationId] = [];
            locres[trandata.data[j].fromLocationId].push(trandata.data[j]._id.toString());
        }
        async.forEach(Object.keys(locres), function(loctrandata, asynccallback) {
            var tranType = locres[loctrandata];
            var query = {};
            query['isDeleted'] = false;
            query['tranId'] = {
                '$in': tranType
            };
            if (sku.length) {
                query['sku'] = {
                    '$in': sku
                };
            }
            transactiondataModel.aggregate([{
                '$match': query
            }, {
                $group: {
                    _id: {
                        sku: '$sku',
                        tranId: '$tranId'
                    },
                    // _id: ['$sku', '$tranId'],
                    tranType: {
                        $last: '$tranId'
                    },
                    sku: {
                        $last: '$sku'
                    },
                    qty: {
                        $push: '$qty'
                    },
                    firstrecvdate: {
                        $first: '$created'
                    },
                    lastrecvdate: {
                        $last: '$created'
                    },
                }
            }], function(err, trandata) {
                console.log(JSON.stringify([{
                    '$match': query
                }, {
                    $group: {
                        _id: {
                            fromLocationId: '$fromLocationId',
                            sku: '$sku',
                            tranId: '$tranId'
                        },
                        // _id: ['$sku', '$tranId'],
                        tranType: {
                            $last: '$tranId'
                        },
                        fromLocationId: {
                            $last: '$fromLocationId'
                        },
                        sku: {
                            $last: '$sku'
                        },
                        qty: {
                            $push: '$qty'
                        },
                        firstrecvdate: {
                            $first: '$created'
                        },
                        lastrecvdate: {
                            $last: '$created'
                        },
                    }
                }]))
                console.log('trandata', trandata);
                if (err) {
                    return callback('', {});
                    console.log('Error ' + err);
                }
                locdata[loctrandata] = {};
                var res = {};
                for (var j = 0, length2 = trandata.length; j < length2; j++) {
                    var qtyData = 0;
                    trandata[j].qty.forEach(function(tranqty) {
                        qtyData = qtyData + +tranqty;
                    })
                    locdata[loctrandata][trandata[j].sku] ? '' : locdata[loctrandata][trandata[j].sku] = {};
                    locdata[loctrandata][trandata[j].sku]['trandata'] ? '' : locdata[loctrandata][trandata[j].sku]['trandata'] = {};
                    if (locdata[loctrandata][trandata[j].sku].firstrecvdate) {
                        trandata[j].firstrecvdate < locdata[loctrandata][trandata[j].sku].firstrecvdate ? locdata[loctrandata][trandata[j].sku].firstrecvdate = trandata[j].firstrecvdate : null;
                    } else {
                        locdata[loctrandata][trandata[j].sku].firstrecvdate = trandata[j].firstrecvdate;
                    }
                    if (locdata[loctrandata][trandata[j].sku].lastrecvdate) {
                        trandata[j].lastrecvdate < locdata[loctrandata][trandata[j].sku].lastrecvdate ? locdata[loctrandata][trandata[j].sku].lastrecvdate = trandata[j].lastrecvdate : null;
                    } else {
                        locdata[loctrandata][trandata[j].sku].lastrecvdate = trandata[j].lastrecvdate;
                    }
                    locdata[loctrandata][trandata[j].sku]['trandata'][tranTypeObj[trandata[j].tranType]] ? locdata[loctrandata][trandata[j].sku]['trandata'][tranTypeObj[trandata[j].tranType]] = locdata[loctrandata][trandata[j].sku]['trandata'][tranTypeObj[trandata[j].tranType]] + qtyData : locdata[loctrandata][trandata[j].sku]['trandata'][tranTypeObj[trandata[j].tranType]] = qtyData;
                }
                // callback('', res);
                asynccallback();
            });
        }, function() {
            callback('', locdata);
        });
    });
};
// function getTrantypeqtyData(data, callback) {
//     transactionhistoryManager.getTransactionHistory(data, function(err, trandata) {
//         var tranType = [];
//         var tranTypeObj = {};
//         var sku = [];
//         if (err) {
//             callback('', {});
//             return console.log('Error ' + err);
//         }
//         if (data['sku']) {
//             sku = data['sku'].split(',');
//         }
//         for (var j = 0, length2 = trandata.length; j < length2; j++) {
//             tranType.push(trandata[j]._id.toString());
//             tranTypeObj[trandata[j]._id] = trandata[j].tranTypeId;
//         }
//         console.log(JSON.stringify([{
//             $match: {
//                 'tranId': {
//                     "$in": tranType
//                 }
//             }
//         }, {
//             $group: {
//                 _id: '$tranId',
//                 tranType: {
//                     $last: '$tranId'
//                 },
//                 qty: {
//                     $push: '$qty'
//                 },
//             }
//         }]));
//         var query = {};
//         query['isDeleted'] = false;
//         query['tranId'] = {
//             '$in': tranType
//         };
//         if (sku.length) {
//             query['sku'] = {
//                 '$in': sku
//             };
//         }
//         transactiondataModel.aggregate([{
//             '$match': query
//         }, {
//             $group: {
//                 _id:  {fromLocationId:'$fromLocationId',sku:'$sku', tranId:'$tranId'},
//                 // _id: ['$sku', '$tranId'],
//                 tranType: {
//                     $last: '$tranId'
//                 },
//                 fromLocationId: {
//                     $last: '$fromLocationId'
//                 },
//                 sku: {
//                     $last: '$sku'
//                 },
//                 qty: {
//                     $push: '$qty'
//                 },
//             }
//         }], function(err, trandata) {
//             console.log(JSON.stringify([{
//             '$match': query
//         }, {
//             $group: {
//                 _id:  {fromLocationId:'$fromLocationId',sku:'$sku', tranId:'$tranId'},
//                 // _id: ['$sku', '$tranId'],
//                 tranType: {
//                     $last: '$tranId'
//                 },
//                 fromLocationId: {
//                     $last: '$fromLocationId'
//                 },
//                 sku: {
//                     $last: '$sku'
//                 },
//                 qty: {
//                     $push: '$qty'
//                 },
//             }
//         }]) )
//             console.log('trandata',trandata);
//             if (err) {
//                 return callback('', {});
//                 console.log('Error ' + err);
//             }
//             var res = {};
//             for (var j = 0, length2 = trandata.length; j < length2; j++) {
//                 var qtyData = 0;
//                 trandata[j].qty.forEach(function(tranqty) {
//                     qtyData = qtyData + +tranqty;
//                 })
//                 res[trandata[j].sku] ? '' : res[trandata[j].sku] = {};
//                 res[trandata[j].sku][tranTypeObj[trandata[j].tranType]] = qtyData;
//             }
//             callback('', res);
//         });
//     });
// };