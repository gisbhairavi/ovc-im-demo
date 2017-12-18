var express = require('express');
var log = require('../log');
var po_asnModel = require('./../model/po_asnModel');
var po_asn_packageModel = require('./../model/po_asn_packageModel');
var po_item_quantity_statusModel = require('./../model/po_item_quantity_statusModel');
var orderModel = require('./../model/orderModel');
var router = express.Router();
module.exports = {
    checkOrder: checkOrder,
    createOrder: createOrder,
    checkErpOrder: checkErpOrder,
    checkpoasn: checkpoasn,
    createpoasn: createpoasn,
    getshipment: getshipment,
    checkpoasnpackage: checkpoasnpackage,
    createpoasnpackage: createpoasnpackage,
    checkitmequantitystatus: checkitmequantitystatus,
    createitmequantitystatus: createitmequantitystatus,
    getshipmentdata: getshipmentdata,
    updatepackagestatus: updatepackagestatus,
    createitemqtystatus: createitemqtystatus,
};

function checkOrder(userInput, callback) {
    console.log(userInput);
    orderModel.findOne({
        purchaseOrderNumber: userInput
    }).exec(callback);
}

function checkErpOrder(erpPurchaseOrder, callback) {
    console.log(erpPurchaseOrder, 'erpPurchaseOrder');
    orderModel.findOne({
        erpPurchaseOrder: erpPurchaseOrder
    }).exec(callback);
}

function createOrder(id, userInput, callback) {
    if(userInput['PoSubtotal'] === '')
        delete userInput['PoSubtotal'];
    if(userInput['PoSubtotalConfirm'] === '')
        delete userInput['PoSubtotalConfirm'];
    if(userInput['PoSubtotalAsn'] === '')
        delete userInput['PoSubtotalAsn'];
    if(userInput['totalPoCost'] === '')
        delete userInput['totalPoCost'];
    if(userInput['totalPoCostConfirm'] === '')
        delete userInput['totalPoCostConfirm'];
    if(userInput['totalPoCostAsn'] === '')
        delete userInput['totalPoCostAsn'];
    if(userInput['totalPoVAT'] === '')
        delete userInput['totalPoVAT'];
    if(userInput['totalPoTax'] === '')
        delete userInput['totalPoTax'];
    if(userInput['totalPoVATConfirm'] === '')
        delete userInput['totalPoVATConfirm'];
    if(userInput['totalPoTaxConfirm'] === '')
        delete userInput['totalPoTaxConfirm'];
    if(userInput['totalPoVATAsn'] === '')
        delete userInput['totalPoVATAsn'];
    if(userInput['totalPoTaxAsn'] === '')
        delete userInput['totalPoTaxAsn'];
    if (id == 0) {
        var order = new orderModel(userInput);
        order.save(callback);
    } else {
        var order = orderModel.findById(id);
        if (order) {
            order.exec(function(err, orderdata) {
                order.update(userInput, function(err, data) {
                    checkOrder(orderdata.purchaseOrderNumber, callback);
                });
            });
        } else {
            callback('No order.');
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
            if (userInput.qty) {
                var po_asn_package = po_item_quantity_statusModel.findById(data._id);
                if (po_asn_package) {
                    var new_qty = parseInt(data.qty) + parseInt(userInput.qty);
                    po_asn_package.update({
                        qty: new_qty
                    }, callback);
                }
            } else {
                callback(err, data);
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
            "receivedDate": new Date()
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
                    // "qtyStatus": "submitted"
                    "skuCost": { $ne: "" } 
                }, function(err, data) {
                    var cost= "0";
                    if (data) {
                        cost = data.skuCost;
                    }
                    Status["skuCost"] = cost;
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