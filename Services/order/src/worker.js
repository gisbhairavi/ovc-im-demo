var log = require('./log');
var env_config = require('../config/config');
var Worker = require('pigato').Worker;
var orderManager = require('./manager/orderManager');
var orderItemManager = require('./manager/orderItemManager');
var countManager = require('./manager/countManager');
var countItemManager = require('./manager/countItemManager');
var directiveMasterManager = require('./manager/directiveMasterManager');
var directiveItemManager = require('./manager/directiveItemManager');
var countZoneManager = require('./manager/countZoneManager');
var countItemQtyManager = require('./manager/countItemQtyManager');
var replenishmentRequestManager = require('./manager/replenishmentRequestManager');
var replenishmentFilterManager = require('./manager/replenishmentFilterManager');
var apiManager = require('./manager/apiManager');
var replenishmentRequestItemManager = require('./manager/replenishmentRequestItemManager');
var scheduleAtpManager = require('./manager/scheduleAtpManager');
var scheduleManager = require('./manager/scheduleManager');
var orderSearchManager = require('./manager/orderSearchManager');
var reviewManager = require('./manager/reviewManager');
var recountManager = require('./manager/recountManager');
var returnManager = require('./manager/returnManager');
var returnItemManager = require('./manager/returnItemManager');
var receiptManager = require('./manager/receiptManager');
var receiptPackageManager = require('./manager/receiptPackageManager');
var dropshipManager = require('./manager/dropshipManager');
var dropshipItemManager = require('./manager/dropshipItemManager');
var Ordertype = require('../config/Ordertype.json');
var constant = require('../config/const.json');
var request = require("request");
var querystring = require('querystring');
var po_asnModel = require('./model/po_asnModel');
var async = require('async');
var mongodb = require('./mongodb');
var utils = require('./manager/utils');
var return_receipt_package_Manager = require('./manager/return_receipt_package_Manager');
var worker_order = new Worker(env_config.brokerHost, 'order');
var worker_orderItem = new Worker(env_config.brokerHost, 'orderItem');
var worker_count = new Worker(env_config.brokerHost, 'count');
var worker_countItem = new Worker(env_config.brokerHost, 'countItem');
var worker_review = new Worker(env_config.brokerHost, 'review');
var worker_directiveMaster = new Worker(env_config.brokerHost, 'directiveMaster');
var worker_directiveItem = new Worker(env_config.brokerHost, 'directiveItem');
var worker_countZone = new Worker(env_config.brokerHost, 'countZone');
var worker_countItemQty = new Worker(env_config.brokerHost, 'countItemQty');
var worker_replenishmentRequest = new Worker(env_config.brokerHost, 'replenishmentRequest');
var worker_replenishmentFilter = new Worker(env_config.brokerHost, 'replenishmentFilter');
var worker_replenishmentRequestItem = new Worker(env_config.brokerHost, 'replenishmentRequestItem');
var worker_recount = new Worker(env_config.brokerHost, 'recount');
var worker_return = new Worker(env_config.brokerHost, 'return');
var worker_dropship = new Worker(env_config.brokerHost, 'dropship');
var worker_receipt = new Worker(env_config.brokerHost, 'receipt');
worker_order.on('error', function(e) {
    log.error('Worker error', e);
});
worker_orderItem.on('error', function(e) {
    log.error('Worker error', e);
});
worker_count.on('error', function(e) {
    log.error('Worker error', e);
});
worker_countItem.on('error', function(e) {
    log.error('Worker error', e);
});
worker_review.on('error', function(e) {
    log.error('Worker error', e);
});
worker_directiveMaster.on('error', function(e) {
    log.error('Worker error', e);
});
worker_directiveItem.on('error', function(e) {
    log.error('Worker error', e);
});
worker_countZone.on('error', function(e) {
    log.error('Worker error', e);
});
worker_countItemQty.on('error', function(e) {
    log.error('Worker error', e);
});
worker_replenishmentRequest.on('error', function(e) {
    log.error('Worker error', e);
});
worker_replenishmentFilter.on('error', function(e) {
    log.error('Worker error', e);
});
worker_replenishmentRequestItem.on('error', function(e) {
    log.error('Worker error', e);
});
worker_recount.on('error', function(e) {
    log.error('Worker error', e);
});
worker_return.on('error', function(e) {
    log.error('Worker error', e);
});
worker_dropship.on('error', function(e) {
    log.error('worker_dropship error', e);
});
worker_receipt.on('error', function(e) {
    log.error('Worker error', e);
});
//Create Transaction with Array (Common method)
var CreateTranService = function(dataArr,ExportData,headers, callback) {
    var srch = {
        skus: JSON.stringify(dataArr)
    };
    if(ExportData){
        srch.submitJson = JSON.stringify(ExportData);
    }
    var formData = querystring.stringify(srch);
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
    request(options, function(err, response, data) {
        console.log(env_config.apiPath + constant.apis.TRANSACTIONSERVICE, dataArr);
        console.log(err, data);
        // console.log('asynccallback', data);
        callback ? callback(err, data) : '';
    });
};
//Order
worker_order.on('request', function(input, rep) {
    log.info('Worker request', input);
    var CreateTran = function(dataobj, callback) {
        var formData = querystring.stringify(dataobj);
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
        console.log('authorization' + input.params.headers);
        request(options, function(err, response, data) {
            console.log(env_config.apiPath + constant.apis.TRANSACTIONSERVICE, dataobj);
            console.log(err, data);
            console.log('asynccallback', data);
            callback ? callback(err, data) : '';
        });
    };
    var jmsPublish = function(dataObj, type, callback) {
        if (!type)
            return callback('No queue type defined');
        try {
            dataObj     =   JSON.stringify(dataObj);
            var formData    =   querystring.stringify({data: dataObj});
            var contentLength   =   formData.length;
            var options     =   {
                url: env_config.apiPath + constant.apis.JMS_PUBLISH + type,
                method: 'POST',
                body: formData,
                headers: {
                    'authorization': input.params.headers,
                    'Content-Length': contentLength,
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            };
        }
        catch(e) {
            console.log("*****publish error:",e);
            if (callback)
                return callback(e);
        }
        request(options, function(err, response, data) {
            console.log(env_config.apiPath + constant.apis.JMS_PUBLISH, type, dataObj);
            console.log(err, data);
            callback ? callback(err, data) : '';
        });
    };
    switch (input.op) {
        case 'getOrder':
            log.info('Find all orders');
            orderManager.getOrder(input.params.orderData, function(err, order) {
                rep.end({
                    result: order,
                    error: err
                });
            });
            break;
        case 'getStatusReport':
            log.info('Find order and count status report');
            orderManager.getStatusReport(input.params.orderData, input, function(err, order) {
                rep.end({
                    result: order,
                    error: err
                });
            });
            break;
        case 'createOrder':
            log.info('Creating a new order...');
            orderManager.createOrder(input.params.orderData, function(err, order) {
                rep.end({
                    result: order,
                    error: err
                });
            });
            break;
        case 'getSKUCosts':
            log.info('getSKUCosts');
            orderManager.getSKUCosts(input.params.orderData, function(err, order) {
                rep.end({
                    result: order,
                    error: err
                });
            });
            break;
        case 'editOrder':
            log.info('Editing a order...');
            orderManager.editOrder(input.params.id, input.params.orderData, function(err, order) {
                if (order.tranArr){
                    var dataObj = {
                        skus: JSON.stringify(order.tranArr)
                    };
                    var submitJson = order.submitJson ? dataObj.submitJson = JSON.stringify(order.submitJson): dataObj.submitJson = '';
                    CreateTran(dataObj , function(err,tranData){
                        try{
                            tranData = JSON.parse(tranData);
                        }catch(e){
                            utils.errortrace(e);
                        }
                        
                        // var transcationTypeId = tranData && tranData.tran_typeData && tranData.tran_typeData._id ? tranData.tran_typeData._id : '';
                        if (order.submitJson) {
                            utils.publishMessage({
                                jsonData : order.submitJson,
                                tranType : "PurchaseOrder",
                                type: env_config.JMS_QUEUEPOSUBMIT,
                                header: input.params.headers
                            });
                        }
                    });
                }
                rep.end({
                    result: order,
                    error: err
                });
            });
            break;
        case 'copyOrder':
            log.info('Copying an order...');
            orderManager.copyOrder(input.params.orderData, function(err, order) {
                rep.end({
                    result: order,
                    error: err
                });
            });
            break;
        case 'deleteOrder':
            log.info('Delete a Order...');
            orderManager.deleteOrder(input.params.id, input.params.headers, function(err, success) {
                console.log(err, success);
                // if (success) {
                    // async.eachSeries(po_data, function(orderdata, asynccallback) {
                    //     CreateTran(orderdata, function(errrr, success, data) {
                    //         asynccallback();
                    //     });
                    // }, function() {
                        // rep.end({
                        //     result: success,
                        //     error: err
                        // });
                    // });
                // }
                if (err){
                    rep.end({
                        result: {status:constant['label']['ERROR'],result: err},
                        error: err
                    });
                }
                else if (success) {
                    rep.end({
                        result: {status:constant['label']['SUCCESS'],result: success},
                        error: err
                    });
                }
            });
            break;
        case 'getOrderNumbers':
            log.info('Find all orders');
            orderManager.getOrderNumbers(input.params.orderData, function(err, order) {
                rep.end({
                    result: order,
                    error: err
                });
            });
            break;
        case 'getStatus':
            log.info('getStatus');
            mongodb.getreadystate(function(state) {
                po_asnModel.findOne(function(err) {
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
        case 'getScheduler':
            log.info('Call Scheduler...');
            scheduleAtpManager.getScheduler(input.params.orderData, input.params.header, function(err, order) {
                rep.end({
                    result: order,
                    error: err
                });
            });
            break;
        case 'runReplenishment':
            log.info('Run Replenishment Engine Based on Replenishment Filter data');
            scheduleAtpManager.runReplenishment(input.params.replenishmentFilterData, input.params.header, function(err, order) {
                rep.end({
                    result: order,
                    error: err
                });
            });
            break;
        case 'getProductPerformance':
            log.info('getProductPerformance...');
            orderSearchManager.getProductPerformance(input.params.orderData, input.params.orderData.headers, function(err, order) {
                rep.end({
                    result: {
                        status: env_config.getstatus(err),
                        result: order
                    },
                    error: err
                });
            });
            break;
        case 'getOrdersSummary':
            log.info('Find all orders');
            orderManager.getOrdersSummary(input.params.orderData, function(err, order) {
                rep.end({
                    result: order,
                    error: err
                });
            });
            break;
        case 'addorderSKU':
            log.info('addorderSKU');
            orderManager.addorderSKU(input.params.orderData, input.params.orderData.headers, function(err, orderdata) {
                if (orderdata) {
                    CreateTran({skus: JSON.stringify(orderdata.dataobj)}, function(errrr, success, data) {
                        rep.end({
                            result: {
                                result: env_config.getstatus(err)
                            },
                            error: err
                        }); 
                    });
                } else {
                    rep.end({
                        result: env_config.getstatus(err),
                        error: err
                    });
                }
            });
            break;

        case 'cancelDraftOrder':
            log.info('Cancelling Draft Orders...');
            orderManager.cancelDraftOrder (input.params.orderData, input.params.headers, function(err, success) {
                console.log("result:",err,success);
                if (err){
                    rep.end({
                        result: {status:constant['label']['ERROR'],result: err},
                        error: null
                    });
                }
                else if (success) {
                    rep.end({
                        result: {status:constant['label']['SUCCESS'],result: success},
                        error: null
                    });
                }
            });
            break;

        case 'forceCloseOrder':
            log.info('Cancelling Draft Orders...');
            orderManager.forceCloseOrder (input.params.orderData, input.params.headers, function(err, success) {
                console.log("result:",err,success);
                if (err){
                    rep.end({
                        result: {status:constant['label']['ERROR'],result: err},
                        error: null
                    });
                }
                else if (success) {
                    rep.end({
                        result: {status:constant['label']['SUCCESS'],result: success},
                        error: null
                    });
                }
            });
            break;

        case 'api_updateCompleted':
            log.info('update Completed Orders...');
            scheduleManager.updateStatus(input.params.orderData, input.params.headers, function(err, success) {
                console.log("result:",err,success);
                if (err){
                    rep.end({
                        result: {status:constant['label']['ERROR'],result: err},
                        error: null
                    });
                }
                else if (success) {
                    rep.end({
                        result: {status:constant['label']['SUCCESS'],result: success},
                        error: null
                    });
                }
            });
            break;
    }
});
//OrderItem
worker_orderItem.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getOrderItem':
            log.info('Find all orderItems');
            orderItemManager.getOrderItem(input.params.orderItemData, function(err, orderItem) {
                rep.end({
                    result: orderItem,
                    error: err
                });
            });
            break;
        case 'createOrderItem':
            log.info('Creating a new orderItem...');
            orderItemManager.createOrderItem(input.params.orderItemData, input.params.header, function(err, orderItem) {
                rep.end({
                    result: orderItem,
                    error: err
                });
            });
            break;
        case 'editOrderItem':
            log.info('Editing a OrderItem...');
            orderItemManager.editOrderItem(input.params.id, input.params.orderItemData, input.params.header, function(err, orderItem) {
                rep.end({
                    result: orderItem,
                    error: err
                });
            });
            break;
        case 'deleteOrderItem':
            log.info('Delete a orderItem...');
            orderItemManager.deleteOrderItem(input.params.id, function(err, orderItem) {
                rep.end({
                    result: orderItem,
                    error: err
                });
            });
            break;
        case 'checkOrderItem':
            log.info('check OrderItem');
            orderItemManager.checkOrderItem(input.params.orderItemData, function(err, orderItem) {
                rep.end({
                    result: orderItem,
                    error: err
                });
            });
            break;
    }
});
//Count
worker_count.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getCount':
            log.info('Find all counts');
            countManager.getCount(input.params.countData, function(err, count) {
                rep.end({
                    result: count,
                    error: err
                });
            });
            break;
        case 'createCount':
            log.info('Creating a new count...');
            countManager.createCount(input.params.countData, function(err, count) {
                rep.end({
                    result: count,
                    error: err
                });
            });
            break;
        case 'editCount':
            log.info('Editing a count...');
            countManager.editCount(input.params.id, input.params.countData, function(err, count) {
                rep.end({
                    result: count,
                    error: err
                });
            });
            break;
        case 'deleteCount':
            log.info('Delete a count...');
            countManager.deleteCount(input.params.id, function(err, count) {
                rep.end({
                    result: count,
                    error: err
                });
            });
            break;
        case 'uploadCountZone':
            log.info('uploadCountZone...');
            countManager.uploadCountZone(input.params.countZoneData, input.params.header, function(err, order) {
                rep.end({
                    result:  {
                        status: env_config.getstatus(err),
                        result: order
                    },
                    error: err
                });
            });
            break;
        case 'addCountZone':
            log.info('addCountZone...');
            countManager.addCountZone(input.params.countZoneData, input.params.header, function(err, order) {
                rep.end({
                    result:  {
                        status: env_config.getstatus(err),
                        result: order
                    },
                    error: err
                });
            });
            break;
        case 'createCountSnapshot':
            log.info('createCountSnapshot...');
            countManager.createCountSnapshot(input.params.countData, input.params.header, function(err, order) {
                rep.end({
                    result:  {
                        status: env_config.getstatus(err),
                        result: order
                    },
                    error: err
                });
            });
            break;
        case 'getcountSnapshot':
            log.info('getcountSnapshot...');
            countManager.getcountSnapshot(input.params.countData, input.params.header, function(err, order) {
                rep.end({
                    result:  {
                        status: env_config.getstatus(err),
                        result: order
                    },
                    error: err
                });
            });
            break;
        case 'addNewZone':
            log.info('addNewZone...');
            countManager.addNewZone(input.params.countData, input.params.header, function(err, order) {
                rep.end({
                    result:  {
                        status: env_config.getstatus(err),
                        result: order
                    },
                    error: err
                });
            });
            break;
    }
});
//CountItem
worker_countItem.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getCountItem':
            log.info('Find all countItems');
            countItemManager.getCountItem(input.params.countItemData, function(err, countItem) {
                rep.end({
                    result: countItem,
                    error: err
                });
            });
            break;
        case 'getCountItemStatus':
            log.info('Find all countItems');
            countItemManager.getCountItemStatus(input.params.countItemData, function(err, countItem) {
                rep.end({
                    result: countItem,
                    error: err
                });
            });
            break;
        case 'createCountItem':
            log.info('Creating a new countItem...');
            countItemManager.createCountItem(input.params.countItemData, input.params.header, function(err, countItem) {
                rep.end({
                    result: countItem,
                    error: err
                });
            });
            break;
        case 'editCountItem':
            log.info('Edit a countItem...');
            countItemManager.editCountItem(input.params.id, input.params.countItemData, function(err, countItem) {
                rep.end({
                    result: countItem,
                    error: err
                });
            });
            break;
        case 'deleteCountItem':
            log.info('Delete a countItem...');
            countItemManager.deleteCountItem(input.params.id, function(err, countItem) {
                rep.end({
                    result: countItem,
                    error: err
                });
            });
            break;
    }
});
//Review
worker_review.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'approveCount':
            log.info('Approving a Count...');
            if(input.params.id){
                reviewManager.approveCount(input.params.id ,input.params.reviewData , input.params.reviewData.headers , function(err, Count){
                    rep.end({
                        result: {
                            status: env_config.getstatus(err),
                            result: Count,
                            error: err
                        },
                        error: err
                    });
                });
            }
            break;
        case 'getReview':
            log.info('Find all Reviews');
            reviewManager.getReview(input.params.reviewData, function(err, count_data) {
                rep.end({
                    result: {
                        status: env_config.getstatus(err),
                        result: count_data,
                        error: err
                    },
                    error: err
                });
            });
            break;
    }
});
//directiveMaster
worker_directiveMaster.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getDirectiveMaster':
            log.info('Find all directiveMasters');
            directiveMasterManager.getDirectiveMaster(input.params.directiveMasterData, function(err, directiveMaster) {
                rep.end({
                    result: directiveMaster,
                    error: err
                });
            });
            break;
        case 'createDirectiveMaster':
            log.info('Creating a new directiveMaster...');
            directiveMasterManager.createDirectiveMaster(input.params.directiveMasterData, function(err, directiveMaster) {
                rep.end({
                    result: directiveMaster,
                    error: err
                });
            });
            break;
        case 'editDirectiveMaster':
            log.info('Editing a directiveMaster...');
            directiveMasterManager.editDirectiveMaster(input.params.id, input.params.directiveMasterData, function(err, directiveMaster) {
                rep.end({
                    result: directiveMaster,
                    error: err
                });
            });
            break;
        case 'deleteDirectiveMaster':
            log.info('Delete a directiveMaster...');
            directiveMasterManager.deleteDirectiveMaster(input.params.id, function(err, directiveMaster) {
                rep.end({
                    result: directiveMaster,
                    error: err
                });
            });
            break;
    }
});
//directiveItem
worker_directiveItem.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getDirectiveItem':
            log.info('Find all DirectiveItem');
            directiveItemManager.getDirectiveItem(input.params.directiveItemData, function(err, directiveItem) {
                rep.end({
                    result: directiveItem,
                    error: err
                });
            });
            break;
        case 'createDirectiveItem':
            log.info('Creating a new DirectiveItem...');
            directiveItemManager.createDirectiveItem(input.params.directiveItemData, function(err, directiveItem) {
                rep.end({
                    result: directiveItem,
                    error: err
                });
            });
            break;
        case 'editDirectiveItem':
            log.info('Editing a DirectiveItem...');
            directiveItemManager.editDirectiveItem(input.params.id, input.params.directiveItemData, function(err, directiveItem) {
                rep.end({
                    result: directiveItem,
                    error: err
                });
            });
            break;
        case 'deleteDirectiveItem':
            log.info('Delete a DirectiveItem...');
            directiveItemManager.deleteDirectiveItem(input.params.id, function(err, directiveItem) {
                rep.end({
                    result: directiveItem,
                    error: err
                });
            });
            break;
    }
});
//countZone
worker_countZone.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getCountZone':
            log.info('Find all countZones');
            countZoneManager.getCountZone(input.params.countZoneData, function(err, countZone) {
                rep.end({
                    result: countZone,
                    error: err
                });
            });
            break;
        case 'createCountZone':
            log.info('Creating a new countZone...');
            countZoneManager.createCountZone(input.params.countZoneData, function(err, countZone) {
                rep.end({
                    result: countZone,
                    error: err
                });
            });
            break;
        case 'editCountZone':
            log.info('Editing a countZone...');
            countZoneManager.editCountZone(input.params.id, input.params.countZoneData, function(err, countZone) {
                rep.end({
                    result: countZone,
                    error: err
                });
            });
            break;
        case 'deleteCountZone':
            log.info('Delete a countZone...');
            countZoneManager.deleteCountZone(input.params.id, function(err, countZone) {
                rep.end({
                    result: countZone,
                    error: err
                });
            });
            break;
    }
});
//countItemQty
worker_countItemQty.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getCountItemQty':
            log.info('Find all countItemQtys');
            countItemQtyManager.getCountItemQty(input.params.countItemQtyData, function(err, countItemQty) {
                rep.end({
                    result: countItemQty,
                    error: err
                });
            });
            break;
        case 'createCountItemQty':
            log.info('Creating a new countItemQty...');
            countItemQtyManager.createCountItemQty(input.params.countItemQtyData, function(err, countItemQty) {
                rep.end({
                    result: countItemQty,
                    error: err
                });
            });
            break;
        case 'editCountItemQty':
            log.info('Editing a countItemQty...');
            countItemQtyManager.editCountItemQty(input.params.id, input.params.countItemQtyData, function(err, countItemQty) {
                rep.end({
                    result: countItemQty,
                    error: err
                });
            });
            break;
        case 'deleteCountItemQty':
            log.info('Delete a Order...');
            countItemQtyManager.deleteCountItemQty(input.params.id, function(err, countItemQty) {
                rep.end({
                    result: countItemQty,
                    error: err
                });
            });
            break;
    }
});
//recount
worker_recount.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'recount':
            log.info('Create Recount...');
            recountManager.recount(input.params.recountData, function(err, recount) {
                rep.end({
                    result: recount,
                    error: err
                });
            });
            break;
    }
});
//replenishmentRequest
worker_replenishmentRequest.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getReplenishmentRequest':
            log.info('Find all ReplenishmentRequest');
            replenishmentRequestManager.getReplenishmentRequest(input.params.replenishmentRequestData, function(err, replenishmentRequest) {
                rep.end({
                    result: replenishmentRequest,
                    error: err
                });
            });
            break;
        case 'createReplenishmentRequest':
            log.info('Creating a new ReplenishmentRequest...');
            replenishmentRequestManager.createReplenishmentRequest(input.params.replenishmentRequestData, function(err, replenishmentRequest) {
                rep.end({
                    result: replenishmentRequest,
                    error: err
                });
            });
            break;
        case 'editReplenishmentRequest':
            log.info('Editing a ReplenishmentRequest...');
            replenishmentRequestManager.editReplenishmentRequest(input.params.id, input.params.replenishmentRequestData, function(err, replenishmentRequest) {
                rep.end({
                    result: replenishmentRequest,
                    error: err
                });
            });
            break;
        case 'deleteReplenishmentRequest':
            log.info('Delete a ReplenishmentRequest...');
            replenishmentRequestManager.deleteReplenishmentRequest(input.params.id, function(err, replenishmentRequest) {
                rep.end({
                    result: replenishmentRequest,
                    error: err
                });
            });
            break;
    }
});
//replenishmentFilter
worker_replenishmentFilter.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getReplenishmentFilter':
            log.info('Find all ReplenishmentFilter');
            replenishmentFilterManager.getReplenishmentFilter(input.params.replenishmentFilterData, function(err, replenishmentFilter) {
                rep.end({
                    result: replenishmentFilter,
                    error: err
                });
            });
            break;
        case 'createReplenishmentFilter':
            log.info('Creating a new ReplenishmentFilter...');
            replenishmentFilterManager.createReplenishmentFilter(input.params.replenishmentFilterData, function(err, replenishmentFilter) {
                if (replenishmentFilter) {
                    var successMessage = {
                        success: 'Successfully Saved'
                    };
                }
                rep.end({
                    result: successMessage,
                    error: err
                });
            });
            break;
        case 'editReplenishmentFilter':
            log.info('Editing a ReplenishmentFilter...');
            replenishmentFilterManager.editReplenishmentFilter(input.params.id, input.params.replenishmentFilterData, function(err, replenishmentFilter) {
                rep.end({
                    result: replenishmentFilter,
                    error: err
                });
            });
            break;
        case 'deleteReplenishmentFilter':
            log.info('Delete a ReplenishmentFilter...');
            replenishmentFilterManager.deleteReplenishmentFilter(input.params.id, input.params.replenishmentFilterData, function(err, replenishmentFilter) {
                rep.end({
                    result: replenishmentFilter,
                    error: err
                });
            });
            break;
        case 'apiGetReplenishmentFilter':
            log.info('Find all ReplenishmentFilter');
            apiManager.apiGetReplenishmentFilter(input.params.replenishmentFilterData, function(err, replenishmentFilter) {
                rep.end({
                    result: {
                        result: err ? err : replenishmentFilter,
                        status: err ? constant.label.ERROR : constant.label.SUCCESS
                    }
                });
            });
            break;
        case 'apiCreateReplenishmentOrder':
            log.info('Create Replenishment');
            apiManager.apiCreateReplenishmentOrder(input.params.orderData, input.params.header, function(err, replenishmentFilter) {
                rep.end({
                    result: {
                        result: err ? err : replenishmentFilter,
                        status: env_config.getstatus(err)
                    }
                });
            });
            break;
}
});
//replenishmentRequestItem
worker_replenishmentRequestItem.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getReplenishmentRequestItem':
            log.info('Find all replenishmentRequestItem');
            replenishmentRequestItemManager.getReplenishmentRequestItem(input.params.replenishmentRequestItemData, function(err, replenishmentRequestItem) {
                rep.end({
                    result: replenishmentRequestItem,
                    error: err
                });
            });
            break;
        case 'createReplenishmentRequestItem':
            log.info('Creating a new replenishmentRequestItem...');
            replenishmentRequestItemManager.createReplenishmentRequestItem(input.params.replenishmentRequestItemData, function(err, replenishmentRequestItem) {
                rep.end({
                    result: replenishmentRequestItem,
                    error: err
                });
            });
            break;
        case 'editReplenishmentRequestItem':
            log.info('Editing a replenishmentRequestItem...');
            replenishmentRequestItemManager.editReplenishmentRequestItem(input.params.id, input.params.replenishmentRequestItemData, function(err, replenishmentRequestItem) {
                rep.end({
                    result: replenishmentRequestItem,
                    error: err
                });
            });
            break;
        case 'deleteReplenishmentRequestItem':
            log.info('Delete a replenishmentRequestItem...');
            replenishmentRequestItemManager.deleteReplenishmentRequestItem(input.params.id, function(err, replenishmentRequestItem) {
                rep.end({
                    result: replenishmentRequestItem,
                    error: err
                });
            });
            break;
    }
});
//Return
worker_return.on('request', function(input, rep) {
    var CreateTran = function(dataobj, callback) {
        var formData = querystring.stringify(dataobj);
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
        console.log('authorization' + input.params.headers);
        request(options, function(err, response, data) {
            console.log(env_config.apiPath + constant.apis.TRANSACTIONSERVICE, dataobj);
            console.log(err, data);
            console.log('asynccallback', data);
            callback ? callback(err, data) : '';
        });
    };

    log.info('Worker request', input);
    switch (input.op) {
        case 'getReturn':
            log.info('Find all return orders');
            returnManager.getOrder(input.params.orderData, function(err, order) {
                rep.end({
                    result: order,
                    error: err
                });
            });
            break;
        case 'createReturn':
            log.info('Creating a new return order...');
            returnManager.createOrder(input.params.orderData, function(err, order) {
                rep.end({
                    result: {
                        status: env_config.getstatus(err),
                        result: order
                    },
                    error: err
                });
            });
            break;
        case 'editReturn':
            log.info('Editing a return order...');
            returnManager.editOrder(input.params.id, input.params.orderData, function(err, order) {
                rep.end({
                    result: {
                        status: env_config.getstatus(err),
                        result: order
                    },
                    error: err
                });
            });
            break;
        case 'getReturnPackage':
            log.info('get Return order Package...');
            return_receipt_package_Manager.getOrderPackage(input.params.orderData, input.params.headers, function(err, order) {
                rep.end({
                    result: order,
                    error: err
                });
            });
            break;
        case 'returnPackageJson':
            log.info('Creating a new return order Package...');

            var user = input.params.orderData.user;
            var ReturnExportData = input.params.orderData && input.params.orderData.returnExpObj ? input.params.orderData.returnExpObj : ""
            if(input.params.orderData && input.params.orderData.returnExpObj)
                delete input.params.orderData.returnExpObj;

            var CreateTranArr   =   [];
            var Createrecvtran = function(purchaseOrder, packageStatus) {
                var loc = (purchaseOrder.location ? purchaseOrder.location : purchaseOrder.shipToLocation);
                // purchaseOrderType 
                var dataobj = {
                    transtypeid: '',
                    stocklocationid: '',
                    asnid: packageStatus.asnid,
                    locationid: loc,
                    stockUOM: packageStatus.uom,
                    quantity: packageStatus.qty,
                    purchaseOrderNumber: purchaseOrder.orderNumber,
                    purchaseOrderType: purchaseOrder.purchaseOrderType,
                    cost: packageStatus.skuCost,
                    warehouseid: (purchaseOrder.location ? purchaseOrder.location : purchaseOrder.shipToLocation),
                    sku: packageStatus.sku,
                    createTran: CreateTranArr.length === 0 ? true : '',
                    addTran: CreateTranArr.length === 0 ? true : '',
                    directivetype: Ordertype[purchaseOrder.orderType][packageStatus.qtyStatus]
                };
                CreateTranArr.push(dataobj);
                // Status(x);
            };

            var runTransaction  =   function() {
                setTimeout( function () { 
                    CreateTranService(CreateTranArr, ReturnExportData, input.params.headers ,  function(err, trandata){
                        try{
                            // trandata = JSON.parse(trandata);
                            var tempData = { type : env_config.JMS_QUEUERETURNEXPORT , jsonData :JSON.parse(ReturnExportData),  header :input.params.headers , tranType:'return'}
                            utils.publishMessage(tempData);
                            tempData = null;
                            trandata = null;
                            CreateTranArr = [];
                        }catch(error){
                            console.log(error , 'TRANSCATION JSON_PARSE ERROR');
                        }
                    }) 
                }, 1000);
            }

            return_receipt_package_Manager.checkorderpackage(input.params.orderData, Createrecvtran, runTransaction, input.params.headers, function(err, order) {
                rep.end({
                    result: {
                        status: env_config.getstatus(err),
                        result: order
                    },
                    error: err
                });
            });
            break;
        case 'deleteReturnOrderSKU':
            log.info('Delete a Return Order SKU...');
            returnItemManager.deleteReturnItem(input.params.returnData, function(err, order) {
                rep.end({
                    result: order,
                    error: err
                });
            });
            break;
        case 'checkReturnData':
            log.info('check a ReturnData...');
            return_receipt_package_Manager.checkReturnData(input.params.returnData, input.params.headers, function(err, order) {
                rep.end({
                    result: order,
                    error: err
                });
            });
            break;
        case 'deleteReturnPackage':
            log.info('Delete a Return Order Package...');
            return_receipt_package_Manager.deleteReturnPackage(input.params.returnData, function(err, order) {
                rep.end({
                    result: order,
                    error: err
                });
            });
            break;
        case 'deleteReturn':
            log.info('Delete a Return Order...');
            returnManager.deleteOrder(input.params.id, function(err, return_deleteData, returnData) {
                if (returnData) {
                    async.eachSeries(return_deleteData, function(returndetails, asynccallback) {
                        CreateTran(returndetails, function(errr, success, data) {
                            asynccallback();
                        })
                    }, function() {
                        rep.end({
                            result: returnData,
                            error: err
                        });
                    });
                } else {
                    rep.end({
                        result: constant.label.ERROR,
                        error: err
                    });
                }
                console.log(err, return_deleteData, returnData);
            });
            break;
    }
});
//Receipt
worker_receipt.on('request', function(input, rep) {
    log.info('Worker request', input);
    var CreateTran = function(dataobj, callback) {
        var formData = querystring.stringify(dataobj);
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
        console.log('authorization' + input.params.headers);
        request(options, function(err, response, data) {
            console.log(env_config.apiPath + constant.apis.TRANSACTIONSERVICE, dataobj);
            console.log(err, data);
            console.log('asynccallback', data);
            callback ? callback(err, data) : '';
        });
    };
    switch (input.op) {
        case 'getReceipt':
            log.info('Find all receipt');
            receiptManager.getReceipt(input.params.receiptData, function(err, order) {
                rep.end({
                    result: order,
                    error: err
                });
            });
            break;
        case 'createReceipt':
            log.info('Creating a new receipt...');
            receiptManager.createReceipt(input.params.receiptData, function(err, order) {
                rep.end({
                    result: {
                        status: env_config.getstatus(err),
                        result: order
                    },
                    error: err
                });
            });
            break;
            // case 'editReceipt':
            //     log.info('Editing a receipt...');
            //     receiptManager.editReceipt(input.params.id, input.params.orderData, function(err, order) {
            //         rep.end({
            //             result: {status:env_config.getstatus(err),result:order},
            //             error: err
            //         });
            //     });
            //     break;
        case 'deleteReceipt':
            log.info('Delete a Return Order...');
            receiptManager.deleteReceipt(input.params.id, function(err, receipt_deleteData, receiptData) {
                if (receiptData) {
                    async.eachSeries(receipt_deleteData, function(receiptdetails, asynccallback) {
                        CreateTran(receiptdetails, function(errr, success, data) {
                            asynccallback();
                        })
                    }, function() {
                        rep.end({
                            result: receiptData,
                            error: err
                        });
                    });
                } else {
                    rep.end({
                        result: constant.label.ERROR,
                        error: err
                    });
                }
                console.log(err, receipt_deleteData, receiptData);
            });
            break;
            /* case 'getScheduler':
                 log.info('Call Scheduler...');
                 scheduleAtpManager.getScheduler(input.params.orderData, input.params.header, function(err, order) {
                     rep.end({
                         result: order,
                         error: err
                     });
                 });
                 break;*/
            // case 'createReceiptItem':
            //     log.info('create receipt item...');
            //     receiptItemManager.createReceiptItem(input.params.id, function(err, order) {
            //         rep.end({
            //             result: order,
            //             error: err
            //         });
            //     });
        case 'createReceiptPackage':
            log.info('create receipt packages...');
            var user = input.params.receiptPackageData.user;
            var CreateTranArr   =   []; 
            var Createrecvtran = function(purchaseOrder, packageStatus) {
                if (purchaseOrder.purchaseOrderType == 'MR_MAN') {
                    var dataobj = {
                        transtypeid: '',
                        stocklocationid: '',
                        asnid: packageStatus.asnid,
                        locationid: purchaseOrder.location,
                        stockUOM: packageStatus.uom,
                        quantity: packageStatus.qty,
                        purchaseOrderNumber: purchaseOrder.orderNumber,
                        purchaseOrderType: purchaseOrder.purchaseOrderType,
                        cost: packageStatus.skuCost,
                        warehouseid: purchaseOrder.location,
                        sku: packageStatus.sku,
                        createTran: purchaseOrder.orderStatus == constant.status.DRAFT ? true : '',
                        addTran: purchaseOrder.orderStatus == constant.status.DRAFT ? true : '',
                        directivetype: Ordertype[purchaseOrder.purchaseOrderType][packageStatus.qtyStatus]
                    };
                    CreateTran(dataobj);
                } else if (purchaseOrder.purchaseOrderType == 'MR_IBT_M') {
                    var dataobj = {
                        transtypeid: '',
                        stocklocationid: '',
                        asnid: packageStatus.asnid,
                        locationid: purchaseOrder.location,
                        stockUOM: packageStatus.uom,
                        quantity: packageStatus.qty,
                        purchaseOrderNumber: purchaseOrder.orderNumber,
                        purchaseOrderType: purchaseOrder.purchaseOrderType,
                        cost: packageStatus.skuCost,
                        warehouseid: purchaseOrder.location,
                        sku: packageStatus.sku,
                        directivetype: Ordertype[purchaseOrder.purchaseOrderType]['toStore'][packageStatus.qtyStatus]
                    };
                    // CreateTran(dataobj);
                    CreateTranArr.push(dataobj);
                    var dataobj = {
                        transtypeid: '',
                        stocklocationid: '',
                        asnid: packageStatus.asnid,
                        locationid: purchaseOrder.FromLocation,
                        stockUOM: packageStatus.uom,
                        quantity: packageStatus.qty,
                        purchaseOrderNumber: purchaseOrder.orderNumber,
                        purchaseOrderType: purchaseOrder.purchaseOrderType,
                        cost: packageStatus.skuCost,
                        warehouseid: purchaseOrder.FromLocation,
                        sku: packageStatus.sku,
                        createTran: purchaseOrder.orderStatus == constant.status.DRAFT ? true : '',
                        addTran: purchaseOrder.orderStatus == constant.status.DRAFT ? true : '',
                        directivetype: Ordertype[purchaseOrder.purchaseOrderType]['fromStore'][packageStatus.qtyStatus]
                    };
                    // CreateTran(dataobj);
                    CreateTranArr.push(dataobj);
                }
                // Status(x);
            };

            var runTransaction  =   function() {
                setTimeout( function () {
                    CreateTranService(CreateTranArr,'',input.params.headers, function(err, data){
                        CreateTranArr = [];
                    }) 
                }, 1000);
            }
            var receiptPackageData = {};
            try {
                receiptPackageData = JSON.parse(input.params.receiptPackageData.returnObj);
            } catch (e) {
                console.log("Error:",e);
            }
            var orderData       =   receiptPackageData.orderData;
            var deletedSkuData  =   receiptPackageData.deletedData;
            if (orderData) {
                orderData.user = user;
                return_receipt_package_Manager.checkreceiptpackage(orderData, deletedSkuData, input.params.headers, runTransaction, Createrecvtran, function(err, order) {
                    rep.end({
                        result: {
                            status: env_config.getstatus(err),
                            result: order
                        },
                        error: err
                    });
                });
            } else {
                var err = 'orderData not found.';
                rep.end({
                    result: {
                        status: env_config.getstatus(err)
                    },
                    error: err
                });
            }
            break;
        case 'reverseManualReceipt':
            log.info('Reverse manual receipt packages...');
            var user = input.params.receiptPackageData.orderData.user;
            var CreateTran = function(dataobj, callback) {
                var formData = querystring.stringify(dataobj);
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
                console.log('authorization' + input.params.headers);
                request(options, function(err, response, data) {
                    console.log(env_config.apiPath + constant.apis.TRANSACTIONSERVICE, dataobj);
                    console.log(err, data);
                    console.log('asynccallback', data);
                    callback ? callback(err, data) : '';
                });
            };

            var Createrecvtran = function(purchaseOrder, Status, x, packageStatus) {
                var UOM;
                if (packageStatus.producUom) {
                    UOM = packageStatus.producUom;
                } else {
                    UOM = packageStatus.uom;
                }
                var ASNID;
                if (packageStatus.asnid) {
                    ASNID = packageStatus.asnid;
                } else {
                    ASNID = packageStatus.asnId;
                }
                if (purchaseOrder.purchaseOrderType == 'MR_IBT_M') {
                    var dataobj = {
                        transtypeid: '',
                        stocklocationid: '',
                        asnid: ASNID,
                        locationid: purchaseOrder.shipToLocation,
                        stockUOM: UOM ? UOM : '',
                        quantity: packageStatus.qty,
                        purchaseOrderNumber: purchaseOrder.orderNumber,
                        purchaseOrderType: purchaseOrder.purchaseOrderType,
                        cost: packageStatus.skuCost,
                        warehouseid: purchaseOrder.shipToLocation,
                        sku: packageStatus.sku,
                        // user: user,
                        directivetype: Ordertype[purchaseOrder.purchaseOrderType]['toStore']['receiveInProgress_rvs']
                    };
                    CreateTran(dataobj);
                    var dataobj = {
                        transtypeid: '',
                        stocklocationid: '',
                        asnid: ASNID,
                        locationid: purchaseOrder.FromLocation,
                        stockUOM: UOM ? UOM : '',
                        quantity: packageStatus.qty,
                        purchaseOrderNumber: purchaseOrder.orderNumber,
                        purchaseOrderType: purchaseOrder.purchaseOrderType,
                        cost: packageStatus.skuCost,
                        warehouseid: purchaseOrder.FromLocation ? purchaseOrder.FromLocation : '',
                        sku: packageStatus.sku,
                        // user: user,
                        directivetype: Ordertype[purchaseOrder.purchaseOrderType]['fromStore']['receiveInProgress_rvs']
                    };
                    CreateTran(dataobj);
                    Status(x);
                } else {
                    var dataobj = {
                        transtypeid: '',
                        stocklocationid: '',
                        asnid: ASNID,
                        locationid: purchaseOrder.shipToLocation,
                        stockUOM: UOM ? UOM : '',
                        quantity: packageStatus.qty,
                        purchaseOrderNumber: purchaseOrder.orderNumber,
                        purchaseOrderType: purchaseOrder.purchaseOrderType,
                        cost: packageStatus.skuCost,
                        warehouseid: purchaseOrder.shipToLocation,
                        sku: packageStatus.sku,
                        // user: user,
                        directivetype: Ordertype[purchaseOrder.purchaseOrderType]['receiveInProgress_rvs']
                    };
                    CreateTran(dataobj);
                    Status(x);
                }
            };
            var orderData       =   JSON.parse(input.params.receiptPackageData.orderData.data);
            if (orderData) {
                return_receipt_package_Manager.reverseManualReceipt(orderData, user, Createrecvtran, function(err, resultData) {
                    rep.end({
                        result: {
                            status: env_config.getstatus(err),
                            result: resultData
                        },
                        error: err
                    });
                });
            } else {
                var err = 'orderData not found.';
                rep.end({
                    result: {
                        status: env_config.getstatus(err)
                    },
                    error: err
                });
            }
            break;
        case 'getReceiptPackage':
            log.info('get receipt packages...');
            receiptPackageManager.receiptPackage(input.params.receiptPackageData.orderData, input.params.headers, function(err, order) {
                rep.end({
                    result: order,
                    error: err
                });
            });
            break;
    }
});
//worker_dropship
worker_dropship.on('request', function(input, rep) {
    log.info('worker_dropship request', input);
    // var querystring = require('querystring');
    var CreateTran = function(dataobj, callback) {
        var formData = querystring.stringify(dataobj);
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
        console.log('authorization' + input.params.headers);
        request(options, function(err, response, data) {
            console.log(env_config.apiPath + constant.apis.TRANSACTIONSERVICE, dataobj);
            console.log(err, data);
            console.log('asynccallback', data);
            callback ? callback(err, data) : '';
        });
    };
    switch (input.op) {
        case 'getDropship':
            log.info('Find all Dropships');
            dropshipManager.getOrder(input.params.orderData, function(err, order) {
                rep.end({
                    result: order,
                    error: err
                });
            });
            break;
        case 'createDropship':
            log.info('Creating a new Dropship...');
            dropshipManager.createOrder(input.params.orderData, function(err, order) {
                rep.end({
                    result: order,
                    error: err
                });
            });
            break;
        case 'editDropship':
            log.info('Editing a Dropship...');
            dropshipManager.editOrder(input.params.id, input.params.orderData, function(err, order) {
                rep.end({
                    result: order,
                    error: err
                });
            });
            break;
        case 'deleteDropship':
            log.info('Delete a Order...');
            dropshipManager.deleteOrder(input.params.orderData, function(err, po_data, success) {
                console.log(err, po_data, success);
                if (success) {
                    var CreateTran = function(dataobj, callback) {
                        var formData = querystring.stringify(dataobj);
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
                        console.log('authorization' + input.params.headers);
                        request(options, function(err, response, data) {
                            console.log(env_config.apiPath + constant.apis.TRANSACTIONSERVICE, dataobj);
                            console.log(err, data);
                            console.log('asynccallback', data);
                            callback ? callback(err, data) : '';
                        });
                    };
                    async.eachSeries(po_data, function(orderdata, asynccallback) {
                        CreateTran(orderdata, function(errrr, success, data) {
                            asynccallback();
                        });
                    }, function() {
                        rep.end({
                            result: success,
                            error: err
                        });
                    });
                }
            });
            break;
        case 'getdropshipSKUs':
            log.info('Find all dropshipData');
            dropshipItemManager.getOrderSKUs(input.params.orderData, function(err, orderItem) {
                rep.end({
                    result: orderItem,
                    error: err
                });
            });
            break;
        case 'createdropshipSKUs':
            log.info('Creating a new dropshipSKUs...');
            dropshipItemManager.createOrderSKUs(input.params.orderData, input.params.header, CreateTran, function(err, orderItem) {
                rep.end({
                    result: orderItem,
                    error: err
                });
            });
            break;
        case 'deletedropshipSKUs':
            log.info('Delete a dropshipSKUs...');
            dropshipItemManager.deleteOrderSKUs(input.params.orderData, function(err, orderItem, po_data) {
                var CreateTran = function(dataobj, callback) {
                    var formData = querystring.stringify(dataobj);
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
                    console.log('authorization' + input.params.headers);
                    request(options, function(err, response, data) {
                        console.log(env_config.apiPath + constant.apis.TRANSACTIONSERVICE, dataobj);
                        console.log(err, data);
                        console.log('asynccallback', data);
                        callback ? callback(err, data) : '';
                    });
                };
                async.eachSeries(po_data, function(orderdata, asynccallback) {
                    CreateTran(orderdata, function(errrr, success, data) {
                        asynccallback();
                    });
                }, function() {
                    rep.end({
                        result: orderItem,
                        error: err
                    });
                });
            });
            break;
    }
});
module.exports = {
    start: function() {
        log.info('Starting worker, broker ' + env_config.brokerHost + '...');
        worker_order.start();
        worker_orderItem.start();
        worker_count.start();
        worker_countItem.start();
        worker_review.start();
        worker_directiveMaster.start();
        worker_directiveItem.start();
        worker_countZone.start();
        worker_countItemQty.start();
        worker_replenishmentRequest.start();
        worker_replenishmentFilter.start();
        worker_replenishmentRequestItem.start();
        worker_recount.start();
        worker_return.start();
        worker_dropship.start();
        worker_receipt.start();
    }
};