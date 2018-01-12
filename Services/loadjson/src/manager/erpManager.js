/***********************************************************************
 *
 * Cron for Consuming Order messages from ERP.
 *
 * REVISION HISTORY:
 *
 *            Name          Date            Description
 *            ----          ----            -----------
 *            Ratheesh     16/03/2016      First Version
 *
 ***********************************************************************/
var log = require('../log');
var constant = require('../../config/const.json');
var env_config = require('../../config/config.js');
var utils = require('../utils');
var path = require('path');
var querystring = require('querystring');
var async = require('async');
var request = require('request');
var node_cron = require('node-schedule');
var Ordertype = require('../../config/Ordertype.json');
var trantype = require('../../config/trantype.json');
var po_item_quantity_statusModel = require('../model/po_item_quantity_statusModel');
var orderItem = require('./orderItemManager');
var shipmentManger = require('./shipmentManger');
var job = null;
var posjob = null;
var headers = null;
module.exports = {
    createCron: createCron
};
var getjson = function(data) {
    return JSON.parse(JSON.stringify(data));
};

function uploadjson(data, croncallback) {
    var jsonData = JSON.parse(data);
    var formData = querystring.stringify({
        type: 'json',
        uploaded_file: data
    });
    var contentLength = formData.length;
    var options = {
        url: env_config.apiPath + constant.apis.UPDATEPURCHASEJSON,
        method: 'POST',
        body: formData,
        headers: {
            'authorization': headers,
            'Content-Length': contentLength,
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    };
    request(options, function(err, response, data) {
        console.log(env_config.apiPath + constant.apis.UPDATEPURCHASEJSON, jsonData);
        console.log(err, data);
        console.log('asynccallback', data);
    });
};

function CreateTran(dataobj, callback) {
    var formData = querystring.stringify(dataobj);
    var contentLength = formData.length;
    var options = {
        url: env_config.apiPath + constant.apis.TRANSACTIONSERVICE,
        method: 'PUT',
        body: formData,
        headers: {
            'authorization': headers,
            'Content-Length': contentLength,
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    };
    // console.log('authorization' + input.params.headers);
        console.log(env_config.apiPath + constant.apis.TRANSACTIONSERVICE, dataobj);
    request(options, function(err, response, data) {
        console.log(err, data);
        console.log('asynccallback', data);
        callback ? callback(err, data) : '';
    });
};
//schema validator
var tLog_Schema = require('../../config/tlog.json');
var tLog_ovcposSchema = require('../../config/tlog_ovcpos.json');
var ZSchema = require("z-schema");
var tLog_validator = new ZSchema();

function checkTran(data, tLog) {
    try {
        console.log('tLog_validator:', tLog_validator.validate(data, tLog));
        return tLog_validator.validate(data, tLog);
    } catch (e) {
        return false;
    }
}
/*
 * create Cron.
 */
function cron(url) {
    // console.log('cron : ' + (new Date().toString()));
    // var formData = querystring.stringify(dataobj);
    //     var contentLength = formData.length;
    var options = {
        url: env_config.posPath + url,
        method: 'POST',
        // body: formData,
        headers: {
            // 'authorization': input.params.headers,
            // 'Content-Length': contentLength,
            // 'Content-Type': 'application/x-www-form-urlencoded',
        }
    };
    // console.log('authorization' + input.params.headers);
    request(options, function(err, response, data) {
        var orderData = [];
        console.log(env_config.posPath + url, err, data);
        if (data) {
            try {
                var rev_data = JSON.parse(data);
                async.forEach(rev_data, function(data, json_callback) {
                    if (constant.Error_data.hasOwnProperty(data)) {
                        console.log('Not a Required format.');
                    } else {
                        try {
                            // console.log(data);
                            orderData.push(JSON.parse(data));
                        } catch (e) {
                            console.log('uploadjson', e);
                        }
                    }
                    json_callback();
                }, function() {
                    orderData.length ? uploadjson(JSON.stringify(orderData)) : '';
                });
            } catch (e) {
                orderData.length ? uploadjson(JSON.stringify(orderData)) : '';
                // console.log(e);
            }
        }
    });
    console.log(job.nextInvocation().toString());
}

function cronPOS(url) {
    var options = {
        url: env_config.posPath + url,
        method: 'POST',
        headers: {
            // 'authorization': input.params.headers,
            // 'Content-Length': contentLength,
            // 'Content-Type': 'application/x-www-form-urlencoded',
        }
    };
    var chkArr = function(value, data) {
        try {
            for (var j = data.length; j > 0; j--) {
                if (value == data[j - 1]) {
                    return 1;
                }
            }
            return 0;
        } catch (e) {
            return 0;
        }
    };
    // console.log('authorization' + input.params.headers);
    request(options, function(err, response, data) {
        console.log(env_config.posPath + url, err, data);
        if (data) {
            try {
                function getcalcAmount(sku) {
                    if (sku.calcAmount) {
                        return sku.calcAmount.length ? sku.calcAmount[0] : sku.calcAmount;
                    } else {
                        return sku.amount;
                    }
                }
                function getTranType(tranType,SKUType) {
                  return SKUType  ?  trantype["tranType"][tranType][SKUType]  :  trantype["tranType"][tranType];
                }
                function ovcposTran(data, json_callback) {
                    if (trantype["tranType"][data.tranTypeId]) {
                        var loc = data.storeId;
                        var tran_data = data.tranItemList || data.tranItems || [];
                        var itemObj = {};
                        var skuIdx = {};
                        console.log('from OVC POS ', data);
                        async.eachSeries(tran_data, function(sku, sku_callback) {
                            var tranTypeId = constant.POS_RETURN  ===  data.tranTypeId  ?  getTranType(data.tranTypeId,sku['itemType'])  :  getTranType(data.tranTypeId);;
                            var SKU;
                            if (chkArr(+sku['itemType'], trantype["type"][data.tranTypeId])) {
                                try {
                                    console.log(data.tranTypeId);
                                    SKU = sku.sku || sku.product.sku;
                                    var dataobj = {
                                        transtypeid: tranTypeId,
                                        stocklocationid: '',
                                        asnid: '',
                                        postranNo: data.id || sku.tranId || data._id,
                                        locationid: loc,
                                        stockUOM: sku.uom,
                                        quantity: sku.qty ? sku.qty : 0,
                                        purchaseOrderNumber: '',
                                        purchaseOrderType: '',
                                        cost: getcalcAmount(sku),
                                        warehouseid: loc,
                                        sku: SKU,
                                        directivetype: ''
                                    };
                                    skuIdx[sku.itemIdx] = dataobj;
                                    sku_callback();
                                } catch (e) {
                                    sku_callback();
                                    console.log('Not a Required type.', e);
                                }
                            } else if ( (trantype["type"]["voidItem"].indexOf(sku['itemType'])) !== -1) {
                                delete skuIdx[sku.refItemIdx];
                                sku_callback();
                            } else {
                                console.log('Not a Required type.');
                                sku_callback();
                            }
                        }, function() {
                            CreateTran({skus: JSON.stringify(skuIdx)});
                            json_callback();
                        });
                    } else {
                        console.log('Not a Required trantype.');
                        json_callback();
                    }
                }

                function posTran(data, json_callback) {
                    if (trantype["tranType"][data.tranTypeId]) {
                        var loc = data.storeId;
                        var tran_data = data.tranItems || [];
                        async.eachSeries(tran_data, function(sku, sku_callback) {
                            try {
                                console.log('Not from OVC POS ', data);
                                var dataobj = {
                                    transtypeid: trantype["tranType"][data.tranTypeId],
                                    stocklocationid: '',
                                    asnid: '',
                                    postranNo: data.tranId,
                                    locationid: loc,
                                    stockUOM: sku.uom,
                                    quantity: sku.qty ? sku.qty : 0,
                                    purchaseOrderNumber: '',
                                    purchaseOrderType: '',
                                    cost: sku.cost,
                                    warehouseid: loc,
                                    sku: sku.sku,
                                    directivetype: ''
                                };
                                CreateTran(dataobj, sku_callback);
                            } catch (e) {
                                sku_callback();
                                console.log('Not a Required type.', e);
                            }
                        }, function() {
                            json_callback();
                        });
                    } else {
                        console.log('Not a Required trantype.');
                        json_callback();
                    }
                }
                var pos_data = JSON.parse(data);
                async.eachSeries(pos_data, function(data, json_callback) {
                    try {
                        if (constant.Error_data.hasOwnProperty(data)) {
                            console.log('Not a Required format.');
                            json_callback();
                        } else {
                                var data = JSON.parse(data);
                                if (checkTran(data, tLog_Schema)) {
                                    posTran(data, json_callback);
                                } else if (checkTran(data, tLog_ovcposSchema)) {
                                    ovcposTran(data, json_callback);
                                } else {
                                    console.log('Schema validate : false');
                                    json_callback();
                                }
                        }
                    } catch (e) {
                        console.log(e);
                        json_callback();
                    }
                }, function() {});
            } catch (e) {
                console.log(e);
            }
        }
    });
    console.log(posjob.nextInvocation().toString());
}

function getheaders(callback) {
    var formData = querystring.stringify(constant.scheduler.data);
    var options = {
        url: env_config.authPath + constant.apis.GETCODE,
        method: 'POST',
        body: formData,
        headers: {
            // 'authorization': input.params.headers,
            // 'Content-Length': contentLength,
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    };
    request(options, function(err, response, data) {
        try {
            var data = JSON.parse(data);
            var formData = querystring.stringify({
                code: data.code,
                grant_type: 'authorization_code'
            });
            var options = {
                url: env_config.authPath + constant.apis.GETHEADERSCODE,
                method: 'POST',
                body: formData,
                headers: {
                    // 'authorization': input.params.headers,
                    // 'Content-Length': contentLength,
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            };
            request(options, function(err, response, data) {
                // console.log('data', data);
                try {
                    var data = JSON.parse(data);
                    headers = data.token_type + ' ' + data.access_token.token;
                    // console.log('headers', headers);
                    callback(true);
                } catch (e) {
                    callback();
                    console.log(e);
                }
            });
        } catch (e) {
            console.log('err can not get - ', env_config.authPath + constant.apis.GETCODE);
            callback(e);
        }
    });
}

function createCron(callback) {
    if (!env_config.JMS_QUEUEPOCONFIRMED && !env_config.JMS_QUEUEPOASN && !env_config.JMS_QUEUEPOS) {
        console.log("*******Queue name undefined - PO ASN, PO Confirm, POS")
    } else {
        var cronEnvVar = {
            "JMS_QUEUEPOCONFIRMED": "PO Confirm",
            "JMS_QUEUEPOASN": "PO ASN",
            "JMS_QUEUEPOS": "POS"
        }
        var envVar = Object.keys(cronEnvVar);
        for (var num = envVar.length - 1; num >= 0; num--) {
            if (!env_config[envVar[num]]) {
                console.log("*******Queue name undefined - ", cronEnvVar[envVar[num]]);
            }
        }
        getheaders(function(returndata) {
            if (returndata == true) {
                job = node_cron.scheduleJob(constant.scheduler.rule, function() {
                    // cron(constant.apis.JMS_GETPOCONFIRMED);
                    // cron(constant.apis.JMS_GETPOASN);
                    if (env_config.JMS_QUEUEPOCONFIRMED) cron(constant.apis.JMS_GETDATA + env_config.JMS_QUEUEPOCONFIRMED);
                    if (env_config.JMS_QUEUEPOASN) cron(constant.apis.JMS_GETDATA + env_config.JMS_QUEUEPOASN);
                    // cronPOS(constant.apis.JMS_GETDATA + env_config.JMS_QUEUEPOS);
                });
                console.log('job', job.nextInvocation().toString());
                if (env_config.JMS_QUEUEPOS) {
                    posjob = node_cron.scheduleJob(constant.scheduler.posrule, function() {
                        cronPOS(constant.apis.JMS_GETDATA + env_config.JMS_QUEUEPOS);
                    });
                    console.log('posjob', posjob.nextInvocation().toString());
                }
                console.log('cron created');
            } else {
                setTimeout(function() {
                    createCron(callback);
                }, 20000);
            }
        });
    }
}