var log = require('./log');
var env_config = require('../config/config');
var Worker = require('pigato').Worker;
var transactionManager = require('./manager/transactionManager');
var mongodb = require('./mongodb');

var adjustmentManager = require('./manager/adjustmentManager');
var adjustmentItemManager = require('./manager/adjustmentItemManager');
var constant  =  require('../config/const.json');
var querystring = require('querystring');
var request = require("request")
var qs = require('querystring');

var transactionitemManager = require('./manager/transactionitemManager');
var transactioniteminventoryManager = require('./manager/transactioniteminventoryManager');
var transactiontypeManager = require('./manager/transactiontypeManager');
var transactionruleManager = require('./manager/transactionruleManager');
var invtransactionserviceManager = require('./manager/invtransactionserviceManager');
var uomManager = require('./manager/uomManager');
var transactiontypeModel             =   require('./model/transactiontypeModel');
var documentruleManager = require('./manager/documentruleManager');
var documenttypeManager = require('./manager/documenttypeManager');
var transactionhistoryManager = require('./manager/transactionhistoryManager');
var Utils   =   require('./manager/utils');
var worker_transaction = new Worker(env_config.brokerHost, 'transaction');

var worker_adjustment = new Worker ( env_config.brokerHost, 'adjustment' )
var worker_adjustmentitem = new Worker(env_config.brokerHost, 'adjustmentItem');

var worker_transactionitem = new Worker(env_config.brokerHost, 'transactionitem');
var worker_transactioniteminventory = new Worker(env_config.brokerHost, 'transactioniteminventory');
var worker_transactiontype = new Worker(env_config.brokerHost, 'transactiontype');
var worker_transactionrule = new Worker(env_config.brokerHost, 'transactionrule');
var worker_invtransactionservice = new Worker(env_config.brokerHost, 'invtransactionservice');
var worker_uom = new Worker(env_config.brokerHost, 'uom');
var worker_documenttype = new Worker(env_config.brokerHost, 'documenttype');
var worker_documentrule = new Worker(env_config.brokerHost, 'documentrule');
var worker_transactionhistory = new Worker(env_config.brokerHost, 'transactionhistory');
// var worker_inventoryManager    = new Worker(env_config.brokerHost, 'inventoryManager');
worker_transaction.on('error', function(e) {
    log.error('Worker error', e);
});

worker_adjustment.on('error', function(e) {
    log.error('Worker error', e);
});

worker_adjustmentitem.on('error', function(e) {
    log.error('Worker error', e);
});

worker_transactionitem.on('error', function(e) {
    log.error('Worker error', e);
});
worker_transactioniteminventory.on('error', function(e) {
    log.error('Worker error', e);
});
worker_transactionhistory.on('error', function(e) {
    log.error('Worker error', e);
});
worker_transactiontype.on('error', function(e) {
    log.error('Worker error', e);
});
worker_transactionrule.on('error', function(e) {
    log.error('Worker error', e);
});
worker_invtransactionservice.on('error', function(e) {
    log.error('Worker error', e);
});
worker_uom.on('error', function(e) {
    log.error('Worker error', e);
});
worker_documenttype.on('error', function(e) {
    log.error('Worker error', e);
});
worker_documentrule.on('error', function(e) {
    log.error('Worker error', e);
});
// worker_inventoryManager.on('error', function(e) {
//   log.error('Worker error', e);
// });
var CreateTran = function(input, dataArr, exportData, callback) {

    var srch = {
        skus: JSON.stringify(dataArr)
    };
    if(exportData){
        srch.adjustmentExport = JSON.stringify(exportData);
    }

    var formData = querystring.stringify(srch);
    var contentLength = formData.length;

    var options = {
        url: env_config.apiPath + constant.apis.TRANSACTIONSERVICE,
        method: 'PUT',
        body: formData,
        headers: {
            'authorization': input.params.headers,
            'Content-Length': contentLength,
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    };

    request(options, function(err, response, data) {
        console.log(env_config.apiPath + constant.apis.TRANSACTIONSERVICE, dataArr);
        console.log(err, data);
        // console.log('asynccallback', data);
        callback ? callback(err, data) : '';
    });

};



//Transaction
worker_transaction.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getTransaction':
            log.info('Find all transaction');
            transactionManager.getTransaction(input.params.transactionData, function(err, transaction) {
                rep.end({
                    result: transaction,
                    error: err
                });
            });
            break;
        case 'createTransaction':
            log.info('Creating a new transaction...');
            transactionManager.createTransaction(input.params.transactionData, function(err, transaction) {
                rep.end({
                    result: transaction,
                    error: err
                });
            });
            break;
        case 'editTransaction':
            log.info('Editing a transaction...');
            transactionManager.editTransaction(input.params.id, input.params.transactionData, function(err, transaction) {
                rep.end({
                    result: transaction,
                    error: err
                });
            });
            break;
        case 'deleteTransaction':
            log.info('Delete a transaction...');
            transactionManager.deleteTransaction(input.params.id, function(err, transaction) {
                rep.end({
                    result: transaction,
                    error: err
                });
            });
            break;
        case 'getTrantypeqtyData':
            log.info('getTrantypeqtyData...');
            transactionManager.getTrantypeqtyData(input.params.transactionData, function(err,qtyData) {
                rep.end({
                    result: qtyData,
                    error: err
                });
            });
            break;
        case 'getBalanceReport':
            log.info('getBalanceReport...');
            transactionhistoryManager.getBalanceReport(input.params.searchData, function(err,qtyData) {
                rep.end({
                    result: qtyData,
                    error: err
                });
            });
            break;
        case 'getStatusReport':
            transactionhistoryManager.getStatusReport(input.params.searchData, function(err,qtyData) {
                rep.end({
                    result: qtyData,
                    error: err
                });
            });
            break;
        case 'getBalanceReportExcel':
            transactionhistoryManager.getBalanceReportExcel(input.params.searchData, function(err,qtyData) {
                rep.end({
                    result: qtyData,
                    error: err
                });
            });
            break;
        case 'getStatus':
            log.info('getStatus');
            mongodb.getreadystate(function(state) {
                transactiontypeModel.findOne(function(err) {
                    var test = constant.label.SUCCESS;
                    if (err) {
                        test = constant.label.ERROR;
                    }
                    var result = {
                        db: {
                            state: state,
                            test: test
                        },
                        appServer: 'connected'
                    };
                    rep.end({
                        result: result
                    });
                });
            });
            break;
    }
});

//Transactionitem
worker_transactionitem.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getTransactionitem':
            log.info('Find all transactionitem');
            transactionitemManager.getTransactionitem(input.params.transactionitemData, function(err, transactionitem) {
                rep.end({
                    result: transactionitem,
                    error: err
                });
            });
            break;
        case 'createTransactionitem':
            log.info('Creating a new transactionitem...');
            transactionitemManager.createTransactionitem(input.params.transactionitemData, function(err, transactionitem) {
                rep.end({
                    result: transactionitem,
                    error: err
                });
            });
            break;
        case 'editTransactionitem':
            log.info('Editing a transactionitem...');
            transactionitemManager.editTransactionitem(input.params.id, input.params.transactionitemData, function(err, transactionitem) {
                rep.end({
                    result: transactionitem,
                    error: err
                });
            });
            break;
        case 'deleteTransactionitem':
            log.info('Delete a transactionitem...');
            transactionitemManager.deleteTransactionitem(input.params.id, function(err, transactionitem) {
                rep.end({
                    result: transactionitem,
                    error: err
                });
            });
            break;
    }
});

//Adjustment
worker_adjustment.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getAdjustment':
            log.info('Find all adjustment');
            adjustmentManager.getAdjustment(input.params.adjustmentData, function(err, adjustment) {
                rep.end({
                    result: adjustment,
                    error: err
                });
            });
            break;
        case 'createAdjustment':
            log.info('Creating a new adjustment...');
            adjustmentManager.createAdjustment(input.params.adjustmentData, function(err, adjustment) {
                rep.end({
                    result: adjustment,
                    error: err
                });
            });
            break;
        case 'editAdjustment':
            log.info('Editing a adjustment...');
            adjustmentManager.editAdjustment(input.params.id, input.params.adjustmentData, function(err, adjustment) {

                if(adjustment && (adjustment.adjustmentStatus  ==  "Adjusted" || adjustment.adjustmentStatus  ==  "adjusted_rvs") && adjustment.tranArr && adjustment.tranArr.length){
                    adjustment.adjustExportObj = adjustment.adjustExportObj ? adjustment.adjustExportObj : '';
                    CreateTran(input, adjustment.tranArr, adjustment.adjustExportObj, function(err, data) {
                        if (adjustment.adjustExportObj) {
                            if (data){
                                data    =   JSON.parse(data);
                                data.export_type
                                    ? ( (adjustment.adjustExportObj.adjustment &&  adjustment.adjustExportObj.adjustment[0])
                                        ? adjustment.adjustExportObj.adjustment[0]['balanceUpdate'] = data.export_type 
                                        : '')
                                    : adjustment.adjustExportObj['balanceUpdate'] = [];
                            }
                            Utils.jmsPublish(input, adjustment.adjustExportObj, env_config.JMS_QUEUE_ADJUST_EXPORT,  function (err, export_data){
                                if (err) {
                                    console.log("*****Adjustment Publish Failed - ",err);
                                }
                                else {
                                    console.log("*****Adjustment Publish Success - ",export_data);
                                }
                            });
                        }
                    });
                }
                else {
                    if (adjustment.adjustExportObj) {
                        Utils.jmsPublish(input, adjustment.adjustExportObj, env_config.JMS_QUEUE_ADJUST_EXPORT,  function (err, export_data){
                            if (err) {
                                console.log("*****Adjustment Publish Failed - ",err);
                            }
                            else {
                                console.log("*****Adjustment Publish Success - ",export_data);
                            }
                        });
                    }
                }
                rep.end({
                    result: adjustment.data,
                    error: err
                });
            });
            break;
        case 'deleteAdjustment':
            log.info('Delete a adjustment...');
            adjustmentManager.deleteAdjustment(input.params.id, function(err, adjustment) {
                rep.end({
                    result: adjustment,
                    error: err
                });
            });
            break;
        case 'getAdjustmentData':
            log.info('Find all adjustment');
            adjustmentManager.getAdjustmentData(input.params.adjustmentData, function(err, adjustment) {
                rep.end({
                    result: adjustment,
                    error: err
                });
            });
            break;
        case 'copyAdjustment':
            log.info('Copying an adjustment...');
            adjustmentManager.copyAdjustment(input.params.adjustmentData, function(err, adjustment) {
                rep.end({
                    result: adjustment,
                    error: err
                });
            });
            break;
    }
});

//AdjustmentItem
worker_adjustmentitem.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getAdjustmentItem':
            log.info('Find all adjustmentitem');
            adjustmentItemManager.getAdjustmentItem(input.params.adjustmentItemData, function(err, adjustmentitem) {
                rep.end({
                    result: adjustmentitem,
                    error: err
                });
            });
            break;
        case 'createAdjustmentItem':
            log.info('Creating a new adjustmentitem...');
            adjustmentItemManager.createAdjustmentItem( input.params.adjustmentItemData, function(err, adjustmentitem) {
                if (!err && adjustmentitem){
                    var adjustExportObj = adjustmentitem.exportData;
                    var tranArr = adjustmentitem.tranArr;
                    if(adjustmentitem && (adjustmentitem.adjustmentStatus  ==  "Adjusted" || adjustmentitem.adjustmentStatus  ==  "adjusted_rvs") && tranArr && tranArr.length){
                        CreateTran(input, tranArr, function(err, data) {
                            if (adjustExportObj) {
                                if (data){
                                    data    =   JSON.parse(data);
                                    data.export_type
                                        ? ( (adjustExportObj.adjustment &&  adjustExportObj.adjustment[0]) ? adjustExportObj.adjustment[0]['balanceUpdate'] = data.export_type : '')
                                        : adjustExportObj['balanceUpdate'] = [];
                                }
                                Utils.jmsPublish(input, adjustExportObj, env_config.JMS_QUEUE_ADJUST_EXPORT, function (err, export_data){
                                    if (err) {
                                        console.log("*****Adjustment Publish Failed - ",err);
                                    }
                                    else {
                                        console.log("*****Adjustment Publish Success - ",export_data);
                                    }
                                });
                            }
                        });
                    }
                    else {
                        if (adjustExportObj) {
                            Utils.jmsPublish(input, adjustExportObj, env_config.JMS_QUEUE_ADJUST_EXPORT, function (err, export_data){
                                if (err) {
                                    console.log("*****Adjustment Publish Failed - ",err);
                                }
                                else {
                                    console.log("*****Adjustment Publish Success - ",export_data);
                                }
                            });
                        }
                    }
                }

                rep.end({
                    result: adjustmentitem,
                    error: err
                });

            });
            break;
        case 'editAdjustmentItem':
            log.info('Editing a adjustmentitem...');
            adjustmentItemManager.editAdjustmentItem(input.params.id, input.params.adjustmentItemData, function(err, adjustmentitem) {
                if (!err && adjustmentitem){
                    if(adjustmentitem.adjustmentStatus  != 'Draft'){
                        CreateTran(input, adjustmentitem.tranArr, function(err, data) {
                            if (adjustmentitem.exportData) {
                                if (data){
                                    data    =   JSON.parse(data);
                                    data.export_type
                                        ? (adjustmentitem.exportData['adjustment'] && adjustmentitem.exportData['adjustment'][0])
                                            ? adjustmentitem.exportData['adjustment'][0]['balanceUpdate'] = data.export_type
                                            : ""
                                        : adjustmentitem.exportData['adjustment'][0]['balanceUpdate'] = [];
                                }
                                Utils.jmsPublish(input, adjustmentitem.exportData, env_config.JMS_QUEUE_ADJUST_EXPORT, function (err, export_data){
                                    if (err) {
                                        console.log("*****Adjustment Publish Failed - ",err);
                                    }
                                    else {
                                        console.log("*****Adjustment Publish Success - ",export_data);
                                    }
                                });
                            }
                        });
                    }
                    else {
                       if (adjustmentitem.exportData) {
                            Utils.jmsPublish(input, adjustmentitem.exportData, env_config.JMS_QUEUE_ADJUST_EXPORT, function (err, export_data){
                                if (err) {
                                    console.log("*****Adjustment Publish Failed - ",err);
                                }
                                else {
                                    console.log("*****Adjustment Publish Success - ",export_data);
                                }
                            });
                        } 
                    }

                }

                rep.end({
                    result: adjustmentitem,
                    error: err
                });

            });
            break;

        case 'checkAdjustmentItem':
            log.info('Find all adjustmentitem');
            adjustmentItemManager.checkAdjustmentItem(input.params.adjustmentItemData, function(err, adjustmentitem) {
                rep.end({
                    result: adjustmentitem,
                    error: err
                });
            });
            break;
            
        case 'deleteAdjustmentItem':
            log.info('Delete a adjustmentitem...');
            adjustmentItemManager.deleteAdjustmentItem(input.params.id, function(err, adjustmentitem) {
                rep.end({
                    result: adjustmentitem,
                    error: err
                });
            });
            break;
    }
});

//Transactioniteminventory
worker_transactioniteminventory.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getTransactioniteminventory':
            log.info('Find all transactioniteminventory');
            transactioniteminventoryManager.getTransactioniteminventory(input.params.transactioniteminventoryData, function(err, transactioniteminventory) {
                rep.end({
                    result: transactioniteminventory,
                    error: err
                });
            });
            break;
        case 'createTransactioniteminventory':
            log.info('Creating a new transactioniteminventory...');
            transactioniteminventoryManager.createTransactioniteminventory(input.params.transactioniteminventoryData, function(err, transactioniteminventory) {
                rep.end({
                    result: transactioniteminventory,
                    error: err
                });
            });
            break;
        case 'editTransactioniteminventory':
            log.info('Editing a transactioniteminventory...');
            transactioniteminventoryManager.editTransactioniteminventory(input.params.id, input.params.transactioniteminventoryData, function(err, transactioniteminventory) {
                rep.end({
                    result: transactioniteminventory,
                    error: err
                });
            });
            break;
        case 'deleteTransactioniteminventory':
            log.info('Delete a transactioniteminventory...');
            transactioniteminventoryManager.deleteTransactioniteminventory(input.params.id, function(err, transactioniteminventory) {
                rep.end({
                    result: transactioniteminventory,
                    error: err
                });
            });
            break;
        case 'getLocationItemInventory':
            log.info('Find all transactioniteminventory');
            transactioniteminventoryManager.getLocationItemInventory(input.params.locationiteminventoryData, function(err, transactioniteminventory) {
                rep.end({
                    result: transactioniteminventory,
                    error: err
                });
            });
            break;
    }
});
// TransactionType
worker_transactiontype.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getTransactionType':
            log.info('Find all TransactionsType');
            transactiontypeManager.getTransactionType(input.params.transactiontypeData, function(err, transactiontype) {
                rep.end({
                    result: transactiontype,
                    error: err
                });
            });
            break;
        case 'createTransactionType':
            log.info('Creating a new transactiontype...');
            transactiontypeManager.createTransactionType(input.params.transactiontypeData, function(err, transactiontype) {
                rep.end({
                    result: transactiontype,
                    error: err
                });
            });
            break;
        case 'editTransactionType':
            log.info('Editing a transactiontype...');
            transactiontypeManager.editTransactionType(input.params.id, input.params.transactiontypeData, function(err, transactiontype) {
                rep.end({
                    result: transactiontype,
                    error: err
                });
            });
            break;
        case 'deleteTransactionType':
            log.info('Delete a transactiontype...');
            transactiontypeManager.deleteTransactionType(input.params.id, function(err, transactiontype) {
                rep.end({
                    result: transactiontype,
                    error: err
                });
            });
            break;
    }
});
// TransactionRule
worker_transactionrule.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getTransactionRule':
            log.info('Find all TransactionsRule');
            transactionruleManager.getTransactionRule(input.params.transactionruleData, function(err, transactionrule) {
                rep.end({
                    result: transactionrule,
                    error: err
                });
            });
            break;
        case 'createTransactionRule':
            log.info('Creating a new transactionrule...');
            transactionruleManager.createTransactionRule(input.params.transactionruleData, function(err, transactionrule) {
                rep.end({
                    result: transactionrule,
                    error: err
                });
            });
            break;
        case 'editTransactionRule':
            log.info('Editing a transactionrule...');
            transactionruleManager.editTransactionRule(input.params.id, input.params.transactionruleData, function(err, transactionrule) {
                rep.end({
                    result: transactionrule,
                    error: err
                });
            });
            break;
        case 'deleteTransactionRule':
            log.info('Delete a transactionrule...');
            transactionruleManager.deleteTransactionRule(input.params.id, function(err, transactionrule) {
                rep.end({
                    result: transactionrule,
                    error: err
                });
            });
            break;
    }
});
worker_invtransactionservice.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'createInvtransactionservice':
            log.info('Update inventory availability');
            invtransactionserviceManager.createInvtransactionservice(input.params.invtransactionserviceData, input.params.headers, function(err, data) {
                if(err)
                    console.log("ERROR___:",err);
                if (data && data.export_type && data.export_type != {}) {
                    rep.end({
                        result: data,
                        error: err
                    });
                }
                else {
                    rep.end({
                        result: data.data,
                        error: err
                    });
                }
            });
            break;
        case 'getInventories':
            log.info('get inventory availability');
            invtransactionserviceManager.getChildLocation(input.params.invtransactionserviceData, function(err, locations) {
                if (err) {
                    rep.end({
                        error: err
                    });
                } else {
                    if (input.params.invtransactionserviceData.locationid) {
                        var Skuvalues = function() {
                            invtransactionserviceManager.getInventories(input.params.invtransactionserviceData, locations, function(err, data) {
                                if (input.params.invtransactionserviceData.locationid) {
                                    var result = invtransactionserviceManager.generateStoreJson(data, locations );
                                    var sendData=function (err, data) {
                                        rep.end({
                                            result: data,
                                            error: err
                                        });
                                    }
        
                                    var options = {
                                        url: env_config.dashPath + 'apis/ang_userlocations',
                                        headers: {
                                            'Content-Type': 'application/x-www-form-urlencoded'
                                        },
                                        method: 'POST',
                                        body: qs.stringify({usid: input.params.invtransactionserviceData.user.clientId,isStore: 1})
                                    };

                                    request(options, function(error, response, loc_data) {
                                        try {
                                            loc_data = JSON.parse(loc_data);
                                            for (var i = loc_data.length - 1; i >= 0; i--) {
                                                if (loc_data[i].id == input.params.invtransactionserviceData.locationid ) {
                                                    locations[0].store = true;
                                                }
                                            }
                                        }
                                        catch (e) {
                                            console.log("Error:",e);
                                            return sendData(err, result);
                                        }
                                        if (locations.length == 1 && locations[0].store == true && result && result[0]) {
                                            try {
                                                // if (result[0]&&result[0][constant.invtransaction_type.ON_HAND] < 0) {
                                                    input.params.invtransactionserviceData.locations = locations;
                                                    invtransactionserviceManager.generateStockLocJson(input.params.invtransactionserviceData, result).then(function(data) {
                                                        return sendData(err, data);
                                                    });
                                                // } else {
                                                //    sendData(err, data);
                                                // }
                                            } catch (e) {
                                                console.log("Error:",e);
                                                return sendData(err, data);
                                            }
                                        } else {
                                           return sendData(err, result);
                                        }
                                    });

                                } else {
                                    return sendData(err, data);
                                }
                                //rep.end({
                                   // result: result,
                                    //error: err
                                //});
                            });
                        };
                        Skuvalues();
                    }
                }
                //rep.end({result: result, error: err});
            });
            break;

        case 'getInventoryReports':
            log.info('Find order and count status report');
            invtransactionserviceManager.getInventoryReports(input.params.invtransactionserviceData, function(err, data) {
                rep.end({
                    result: data,
                    error: err
                });
            });
            break;
            
        case 'getOHSKU':
            log.info('get OHSKU');
            if(input.params.Data.locationid == 'noLocation'){
                invtransactionserviceManager.getInventories(input.params.Data, '', function(err, data) {
                    rep.end({
                        result: data,
                        error: err
                    });
                });
            }
            else{
                invtransactionserviceManager.getChildLocation(input.params.Data, function(err, locations) {
                    if (err) {
                        rep.end({
                            error: err
                        });
                    } else {
                        if (input.params.Data.locationid) {
                            var Skuvalues = function() {
                                invtransactionserviceManager.getInventories(input.params.Data, locations, function(err, data) {
                                    if (input.params.Data.locationid) {
                                        var result = invtransactionserviceManager.generateStocklookupJson(data, locations);
                                        rep.end({
                                            result: result,
                                            error: err
                                        });
                                    }
                                });
                            };
                            Skuvalues();
                        }
                    }
                    //rep.end({result: result, error: err});
                });
            }
            break;
    }
});
// UOM
worker_uom.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getUom':
            log.info('Find all Uom');
            uomManager.getUom(input.params.uomData, function(err, uom) {
                rep.end({
                    result: uom,
                    error: err
                });
            });
            break;
        case 'createUom':
            log.info('Creating a new Uom...');
            uomManager.createUom(input.params.uomData, function(err, uom) {
                rep.end({
                    result: uom,
                    error: err
                });
            });
            break;
        case 'editUom':
            log.info('Editing a Uom...');
            uomManager.editUom(input.params.id, input.params.uomData, function(err, uom) {
                rep.end({
                    result: uom,
                    error: err
                });
            });
            break;
        case 'deleteUom':
            log.info('Delete a Uom...');
            uomManager.deleteUom(input.params.id, function(err, uom) {
                rep.end({
                    result: uom,
                    error: err
                });
            });
            break;
    }
});
worker_documentrule.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getDocumentrule':
            log.info('Find all Uom');
            documentruleManager.getDocumentrule(input.params.documentruleData, function(err, documentrule) {
                rep.end({
                    result: documentrule,
                    error: err
                });
            });
            break;
        case 'createDocumentrule':
            log.info('Creating a new Documentrule...');
            documentruleManager.createDocumentrule(input.params.documentruleData, function(err, documentrule) {
                rep.end({
                    result: documentrule,
                    error: err
                });
            });
            break;
        case 'editDocumentrule':
            log.info('Editing a documentrule...');
            documentruleManager.editDocumentrule(input.params.id, input.params.documentruleData, function(err, documentrule) {
                rep.end({
                    result: documentrule,
                    error: err
                });
            });
            break;
        case 'deleteDocumentrule':
            log.info('Delete a documentrule...');
            documentruleManager.deleteDocumentrule(input.params.id, function(err, documentrule) {
                rep.end({
                    result: documentrule,
                    error: err
                });
            });
            break;
    }
});
worker_documenttype.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getDocumenttype':
            log.info('Find all Uom');
            documenttypeManager.getDocumenttype(input.params.documenttypeData, function(err, documenttype) {
                rep.end({
                    result: documenttype,
                    error: err
                });
            });
            break;
        case 'createDocumenttype':
            log.info('Creating a new Documenttype...');
            documenttypeManager.createDocumenttype(input.params.documenttypeData, function(err, documenttype) {
                rep.end({
                    result: documenttype,
                    error: err
                });
            });
            break;
        case 'editDocumenttype':
            log.info('Editing a documenttype...');
            documenttypeManager.editDocumenttype(input.params.id, input.params.documenttypeData, function(err, documenttype) {
                rep.end({
                    result: documenttype,
                    error: err
                });
            });
            break;
        case 'deleteDocumenttype':
            log.info('Delete a documenttype...');
            documenttypeManager.deleteDocumenttype(input.params.id, function(err, documenttype) {
                rep.end({
                    result: documenttype,
                    error: err
                });
            });
            break;
    }
});
//transactionhistory
worker_transactionhistory.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getTransactionHistory':
            log.info('Find all Uom');
            transactionhistoryManager.getTransactionHistory(input.params.transactionhistoryData, function(err, transactionhistory) {
                rep.end({
                    result: transactionhistory,
                    error: err
                });
            });
            break;
        case 'getTransactionitemHistory':
            log.info('Find all Uom');
            transactionhistoryManager.getTransactionitemHistory(input.params.transactionhistoryData, function(err, transactionhistory) {
                rep.end({
                    result: transactionhistory,
                    error: err
                });
            });
            break;
        case 'getTransactioniteminventoryHistory':

            transactionhistoryManager.getTransactioniteminventoryHistory(input.params.transactionhistoryData, function(err, transactionhistory) {
                rep.end({
                    result: transactionhistory,
                    error: err
                });
            });
            break;
        case 'getStockBalances':
            log.info('getStockBalances');
            var locArray = [];

            var sendDataToClient    =   function (err, data) {
                rep.end({
                    result: {
                        status: env_config.getstatus(err),
                        result: err ? err : data
                    },
                    error: null
                });
            }

            var pushDataToJMS    =   function (err, data) {
                if (err) {
                    rep.end({
                        result: {
                            status: env_config.getstatus(err),
                            result: err ? err : data
                        },
                        error: null
                    });
                }
                else if (data) {
                    Utils.jmsPublish(input, data, env_config.JMS_QUEUE_STOCK_EXPORT, function (err, export_data){
                        rep.end({
                            result: {
                                status: env_config.getstatus(err),
                                result: err ? err : "Export Successfully Completed"
                            },
                            error: null
                        });
                    });
                }
            }

            // locArray.push(input.params.loc);
            locArray = input.params.transactionhistoryData.locations;
            transactionhistoryManager.getStockBalances(input.params.transactionhistoryData, locArray, function(err, data) {
                if( !input.params.transactionhistoryData.stores ) {
                    sendDataToClient(err, data);
                }
                else {
                    pushDataToJMS(err, data);
                }
            });
            break;
    }
});
module.exports = {
    start: function() {
        log.info('Starting worker, broker ' + env_config.brokerHost + '...');
        worker_transactiontype.start();
        worker_transactionrule.start();
        worker_invtransactionservice.start();
        worker_uom.start();
        worker_documentrule.start();
        worker_documenttype.start();
        worker_transactionhistory.start();
        worker_transaction.start();
        worker_transactionitem.start();
        worker_transactioniteminventory.start();
        // worker_inventoryManager.start();
        worker_adjustment.start();
        worker_adjustmentitem.start();
    }
};
