var express = require('express');
var log = require('../log');
var countModel = require('./../model/countModel');
var countZoneModel = require('./../model/countZoneModel');
var countItemModel = require('./../model/countItemModel');
var countItemQtyModel = require('./../model/countItemQtyModel');
var router = express.Router();
module.exports = {
    checkCounts: checkCounts,
    checkCountZone: checkCountZone,
    checkCount: checkCount,
    updateCountdata: updateCountdata,
    updateCountQty: updateCountQty,
    updateCount: updateCount,
    updateCountZone: updateCountZone
};

function checkCounts(countId, callback) {
    console.log(countId);
    countModel.findById(countId).exec(callback);
}

function checkCountZone(cid, zoneid, callback) {
    console.log(cid, zoneid);
    countZoneModel.findOne({
        id: zoneid,
        countId: cid,
        isDeleted: false
    }).exec(callback);
}

function checkCount(cid, zoneid, countNumber, sku, callback) {
    console.log(cid, zoneid, sku, countNumber);
    countItemModel.findOne({
        zoneId: zoneid,
        countId: cid,
        sku: sku,
        // countNumber: countNumber,
        isDeleted: false
    }).exec(callback);
}

function updateCountdata(cid, data, callback) {
    console.log(cid, data);
    var count = countItemModel.findById(cid);
    var count = countItemModel.findOne({
        zoneId: data.zoneId,
        countId: data.countId,
        sku: data.sku,
        // countNumber: data.countNumber,
        isDeleted: false
    });
    if (count) {
        count.update(data, function(err, Countdata) {
            checkCount(cid, data.zoneId, data.countNumber, data.sku, function(err, countdata) {
                updateCountQty(cid, data.countNumber, data.qty, callback)
            });
        });
    } else {
        callback('No count.');
    }
}

function updateCountQty(cid, countNumber, qty, callback) {
    console.log(cid, countNumber, qty);
    var created = new Date();
    countItemQtyModel.update({
        countItemId: cid,
        countNumber: countNumber,
        // sku: sku
    }, {
        $set: {
            "qty": qty
        },
        $setOnInsert: {
            status: true,
            created: created,
            lastModified: created,
            isDeleted: false,
            __v: 0
        }
    }, {
        upsert: true
    }).exec(function(err, data) {
        if (data.n == 0) {
            console.log('updateCountQty', data);
        }
        callback(err, data);
    });
}

function updateCount(id, userInput, callback) {
    if (id == 0) {
        userInput['createdBy']=userInput.user.clientId;
        userInput['updatedBy']=userInput.user.clientId;
        var count = new countModel(userInput);
        count.save(callback);
    } else {
        userInput['updatedBy']=userInput.user.clientId;
        var count = countModel.findById(id);
        if (count) {
            count.update(userInput, function(err, data) {
                checkCounts(id, callback);
            });
        } else {
            callback('No count.');
        }
    }
}

function updateCountZone(cid, id, userInput, callback) {
    if (id == 0) {
        userInput['createdBy']=userInput.user.clientId;
        userInput['updatedBy']=userInput.user.clientId;
        var countzone = new countZoneModel(userInput);
        countzone.save(callback);
    } else {

        userInput['updatedBy']=userInput.user.clientId;
        var countzone = countZoneModel.findOne({
            id: id,
            countId: cid
        });
        if (countzone) {
            countzone.update(userInput, function(err, data) {
                checkCountZone(cid, id, callback);
            });
        } else {
            callback('No countzone.');
        }
    }
}

function checkpoasn(userInput, callback) {
    po_asnModel.findOne({
        asnId: userInput
    }).exec(callback);
}

function createpoasn(id, userInput, callback) {
    if (id == 0) {
        var po_asn = new po_asnModel(userInput);
        po_asn.save(callback);
    } else {
        var po_asn = po_asnModel.findById(id);
        if (po_asn) {
            po_asn.update(userInput, callback);
        }
    }
}

function checkpoasnpackage(userInput, callback) {
    //console.log(userInput.packageId);
    po_asn_packageModel.findOne({
        packageId: userInput.packageId
    }, function(err, data) {
        if (err) {
            return console.log('Error ' + err);
        }
        //console.log(data);
        var po_asn_id = 0;
        if (data) {
            po_asn_id = data._id;
        }
        createpoasnpackage(po_asn_id, userInput, callback);
    });
}

function createpoasnpackage(id, userInput, callback) {
    if (id == 0) {
        var po_asn_package = new po_asn_packageModel(userInput);
        po_asn_package.save(callback);
    } else {
        var po_asn_package = po_asn_packageModel.findById(id);
        if (po_asn_package) {
            po_asn_package.update(userInput, callback);
        }
    }
}

function checkitmequantitystatus(userInput, callback) {
    po_item_quantity_statusModel.findOne({
        poId: userInput.poId,
        packageId: userInput.packageId,
        sku: userInput.sku,
        qtyStatus: userInput.qtyStatus
    }, function(err, data) {
        if (err) {
            return console.log('Error ' + err);
        }
        if (data) {
            var po_asn_package = po_item_quantity_statusModel.findById(data._id);
            if (po_asn_package) {
                var new_qty = parseInt(data.qty) + parseInt(userInput.qty);
                po_asn_package.update({
                    qty: new_qty
                }, callback);
            }
        } else {
            createitmequantitystatus(userInput, callback);
        }
    });
}

function createitmequantitystatus(userInput, callback) {
    var po_item_quantity_status = new po_item_quantity_statusModel(userInput);
    po_item_quantity_status.save(callback);
}

function getshipmentdata(userInput, callback) {
    po_item_quantity_statusModel.find({
        poId: userInput
    }).exec(callback);
}

function getshipment(c, callback) {
    if (c.hasOwnProperty('po_id')) {
        var po_res = [];
        po_item_quantity_statusModel.aggregate([{
            $match: {
                poId: c.po_id,
                qtyStatus: {
                    $in: ['shipped', 'received']
                },
            }
        }, {
            $sort: {
                "qtyStatus": -1
            }
        }, {
            $group: {
                '_id': '$_id',
                "data": {
                    "$first": {
                        "poId": "$poId",
                        "packageId": "$packageId",
                        "sku": "$sku",
                        "qty": "$qty",
                        "qtyStatus": "$qtyStatus",
                    }
                }
            }
        }, {
            $project: {
                _id: 0,
                data: 1,
                // poId: 1,
                // packageId: 1,
                // sku: 1,
                // qty: 1,
                // qtyStatus: 1,
            }
        }]).exec(function(err, po_asn_status) {
            if (err) {
                return callback(err);
            }
            if (po_asn_status.length == 0) {
                return callback("No Data.");
            }
            var po_asn = {};
            var asn = [];
            var x = {};
            for (var n = po_asn_status.length - 1; n >= 0; n--) {
                if (po_asn_status[n].data.packageId) {
                    if (asn.indexOf(po_asn_status[n].data.packageId) == -1) {
                        asn.push(po_asn_status[n].data.packageId);
                        po_asn[po_asn_status[n].data.packageId] = [];
                    }
                    po_asn[po_asn_status[n].data.packageId].push(po_asn_status[n].data);
                    delete po_asn_status[n].data.packageId;
                }
                // if (po_asn_status[n].packageId) {
                //     if (asn.indexOf(po_asn_status[n].packageId) == -1) {
                //         asn.push(po_asn_status[n].packageId);
                //         po_asn[po_asn_status[n].packageId] = [];
                //     }
                //     po_asn[po_asn_status[n].packageId].push(po_asn_status[n]);
                //     delete po_asn_status[n].packageId;
                // }
            };
            if (asn.length == 0) {
                return callback("No Data.");
            }
            for (var n = asn.length - 1; n >= 0; n--) {
                x['c' + n] = 1;
                console.log(asn);
                getpopackage(asn[n], po_asn[asn[n]], n, function(err, v, po_asn_package) {
                    po_res.push(po_asn_package);
                    delete x['c' + v];
                    console.log(x, Object.keys(x).length);
                    if (Object.keys(x).length == 0) {
                        callback(err, po_res);
                    }
                })
            };
            // for (var n = po_asn_status.length - 1; n >= 0; n--) {
            //     var status = po_asn_status[n];
            // x['c' + n] = 1;
            // getpopackage(status, n, function(err, v, po_asn_package) {
            //     po_res.push(po_asn_package);
            //     delete x['c' + v];
            //     console.log(x, Object.keys(x).length);
            //     if (Object.keys(x).length == 0) {
            //         callback(err, po_res);
            //     }
            // })
            // };
        });
    } else {
        callback("No Data.");
    }
}

function getpopackage(asn, po_asn_status, n, callback) {
    po_asn_packageModel.findOne({
        "packageId": asn
            // "packageId": 
    }).exec(function(err, po_asn_package) {
        // delete po_asn_status.data.packageId;
        var po_asn = JSON.parse(JSON.stringify(po_asn_package));
        // console.log(''+asn);
        // console.log('cdcdcdcc'+po_asn_status.data);
        if (err) {
            // po_asn_status.data.po_asn_package = {};
            po_asn = {};
            return callback(err, n, po_asn);
        }
        po_asn.qtyStatus = po_asn_status[0].qtyStatus;
        po_asn.po_asn_status = po_asn_status;
        // po_asn_status.data.po_asn_package = po_asn_package;
        console.log(po_asn);
        callback(err, n, po_asn);
    });
}

function updatepackagestatus(userInput, CreateTran, callback) {
    var pkg_ids = userInput.split(',');
    po_asn_packageModel.update({
        "packageId": {
            $in: pkg_ids
        }
    }, {
        $set: {
            "packageStatus": "received",
            "receivedDate": new Date(),
            "updatedBy": user.clientId
        }
    }, {
        multi: true
    }).exec(function(err, packageStatus) {
        if (err) {
            callback("No Data.");
            return console.log('Error ' + err);
        }
        // po_item_quantity_statusModel.update({
        //     "packageId": {
        //         $in: pkg_ids
        //     }
        // }, {
        //     $set: {
        //         "qtyStatus": "received"
        //     }
        // }, {
        //     multi: true
        // }).exec(function(err, pkgStatus) {
        //     if (err) {
        //         return console.log('Error ' + err);
        //     }
        po_item_quantity_statusModel.find({
            "packageId": {
                $in: pkg_ids
            },
            "qtyStatus": "shipped"
        }).exec(function(err, packageStatus) {
            if (err) {
                callback("No Data.");
                return console.log('Error ' + err);
            }
            var Order = function(Status, n) {
                orderModel.findOne({
                    "purchaseOrderNumber": Status.poId
                }).exec(function(err, packageorder) {
                    CreateTran(packageorder, function(n) {
                        console.log(n);
                        if (n == 0) {
                            callback(err, packageStatus);
                        }
                    }, n, Status);
                    console.log(Status);
                });
            }
            var postatus = function(Status, n) {
                po_item_quantity_statusModel.findOne({
                    "poId": Status.poId,
                    "sku": Status.sku,
                    "qtyStatus": "submitted"
                }, function(err, data) {
                    // var cost;
                    // if (data) {
                    //     cost = data.skuCost;
                    // }
                    Status["skuCost"] = data.skuCost;
                    createitmequantitystatus(Status, function(err, data) {
                        po_asn_packageModel.findOne({
                            "packageId": Status.packageId
                        }).exec(function(err, asnpackage) {
                            Status.asnid = asnpackage.asnId;
                            Order(Status, n);
                        });
                    });
                });
            };
            for (var n = packageStatus.length - 1; n >= 0; n--) {
                var Status = JSON.parse(JSON.stringify(packageStatus[n]));
                Status["qtyStatus"] = "received";
                delete Status["_id"];
                postatus(Status, n);
            };
        });
        // });
    });
}

function createitemqtystatus(userInput, callback) {
    po_item_quantity_statusModel.findOne({
        poId: userInput.poId,
        qtyStatus: userInput.qtyStatus,
        sku: userInput.sku
    }, function(err, data) {
        if (err) {
            return console.log('Error ' + err);
        }
        if (data) {
            var po_asn_package = po_item_quantity_statusModel.findById(data._id);
            if (po_asn_package) {
                var new_qty = parseInt(userInput.qty) + parseInt(data.qty);
                po_asn_package.update({
                    qty: new_qty
                }, callback);
            }
        } else {
            createitmequantitystatus(userInput, callback);
        }
    });
}