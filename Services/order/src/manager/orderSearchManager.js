var express = require('express');
var log = require('../log');
var orderModel = require('./../model/orderModel');
var po_item_quantity_statusModel = require('./../model/po_item_quantity_statusModel');
var utils = require('./utils');
var constant = require('../../config/const.json');
var env_config = require('../../config/config.js');
var trantype = require('../../config/trantype.json');
var async = require('async');
var request = require('request');
var querystring = require('querystring');
module.exports = {
    getProductPerformance: getProductPerformance
};
/***********************************************************************
 *
 * FUNCTION:    getProductPerformance
 *
 * DESCRIPTION: For get ProductPerformance details based on user input.
 *
 * PARAMETERS:  "fromdate" or "toDate" or 
                "Location" or "order_type" or "SKU" or "Product".
 *
 * RETURNED:    returns ProductPerformance details based on the input params.
 *
 * REVISION HISTORY:
 *
 *            Name          Date            Description
 *            ----          ----            -----------
 *            Ratheesh      01/03/2016      First Version
 *
 ***********************************************************************/
function getProductPerformance(userInput, header, callback) {
    var fromDate = userInput['fromdate'];
    var toDate = userInput['todate'];
    var location = userInput['locid'];
    var page = userInput['page'];
    var srch = userInput['srch'];
    var firstSeason = userInput['firstSeason'] || '';
    var lastSeason = userInput['lastSeason'] || '';
    var fit = userInput['fit'] || '';
    var fabric = userInput['fabric'] || '';
    var color = userInput['color'] || '';
    var material = userInput['material'] || '';
    var sku = userInput['sku'] || '';
    var condition = {};
    var properties = userInput['properties'];

    var productProperty = userInput['productProperty'];
    var productVariants = userInput['productVariants'];
    // var locArray = [];
    condition["$and"] = [];
    condition["$and"].push({
        isDeleted: false
    });
    var obj = {};
    obj['locid'] = location;
    obj['srch'] = srch;
    obj['properties'] = properties;
    obj['productProperty'] = productProperty;
    obj['productVariants'] = productVariants;
    obj['sku'] = sku;
    // var sku_data = querystring.stringify(obj);
    var options = {
        url: env_config.dashPath + constant.apis.GETPURCHASEDPRODUCTSNEW + page,
        method: 'POST',
        body: querystring.stringify(obj),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    console.log('url', env_config.dashPath + constant.apis.GETPURCHASEDPRODUCTSNEW + page);
    console.log('url', env_config.dashPath + constant.apis.GETPURCHASEDPRODUCTSNEW + obj);
    // request(env_config.dashPath + constant.apis.GETPURCHASEDPRODUCTS + location + '/srch:' + srch + '/page:' + page, function(err, response, data) {
    request(options, function(err, response, data) {
        // request(options, function(err, response, data) {
        // Loc error handler.
        //by Ratheesh
        // var data = '{"products":{"productCode":"50005","Description":"Westlake SL005","ImageURL":"","FirstSeason":"25.7","LastSeason":"25.69","Gender":"100010","Brand":"BC","Group":"100010,bombardier","Style":"22.6","Fabric":"18.8","Color":"BEST","skus":[{"sku":"6021-5783-89-2328","Length":"","Waist":"","Size":""},{"sku":"50128-4649-071-2630","Length":"","Waist":"","Size":""}]}}';
        try {
            console.log('data');
            console.log(data);
            var data = JSON.parse(data);
        } catch (ex) {
            console.log(data);
            return callback(data);
        }
        condition["$and"].push({
            orderType: null
        });
        if (data.status === constant.label.ERROR) {
            return callback(data);
        } else {
            var result = JSON.parse(JSON.stringify(data));
            // console.log('result',result);
            result.products = [];
            // console.log('result',result);
            function getproducts() {
                async.forEach(data.products, function(products, asynccallback) {
                    var products = JSON.parse(JSON.stringify(products));
                    if (products.skus) {
                        var skus = JSON.parse(JSON.stringify(products.skus));
                        var query = JSON.parse('{"isDeleted" : false}');
                        if (fromDate || toDate) {
                            if (fromDate && toDate) {
                                toDate = new Date(toDate);
                                toDate.setHours(23, 59, 59)
                                toDate = toDate.toISOString();
                                fromDate = new Date(fromDate);
                                fromDate.setHours(0,0,0);
                                fromDate = fromDate.toISOString();
                                query['created'] = {
                                    '$gte': new Date(fromDate),
                                    '$lte': new Date(toDate)
                                };
                               
                            } else if (toDate) {
                                toDate = new Date(toDate);
                                toDate.setHours(23, 59, 59);
                                toDate = toDate.toISOString();
                                query['created'] = {
                                    '$lte': new Date(toDate)
                                };
                            } else {
                                fromDate = new Date(fromDate);
                                fromDate.setHours(0,0,0);
                                fromDate = fromDate.toISOString();
                                query['created'] = {
                                    '$gte': new Date(fromDate)
                                };
                            }
                        }
                        var resultskus = [];
                        var returnskus = [];
                        skus.forEach(function(skudata, n) {
                            resultskus.push(skudata.sku);
                        });
                        // resultskus = resultskus.trim(',');
                        query['sku'] = {
                            '$in': resultskus
                        };
                        if (orderarr.length) {
                            query['poId'] = {
                                '$in': orderarr
                            };
                        }
                        if (location) {
                            query['location'] = {
                                '$in': location.split(',')
                            };
                        }
                        console.log('query', query);
                        // var result = {};
                        // var formData = querystring.stringify({
                        //     sku: resultskus
                        // });
                        // var contentLength = formData.length;
                        // var options = {
                        //     url: env_config.apiPath + constant.apis.INVENTORIESSERVICE + location,
                        //     method: 'POST',
                        //     body: formData,
                        //     headers: {
                        //         'authorization': input.params.headers,
                        //         'Content-Length': contentLength,
                        //         'Content-Type': 'application/x-www-form-urlencoded',
                        //     }
                        // };
                        var getQtystatusdata = function(status, asynccallback) {
                            delete query.qtyStatus;
                            if (status) {
                                query.qtyStatus = status;
                                // po_item_quantity_statusModel.find(query, '', {
                                //     $sort: {
                                //         'sku': -1
                                //     }
                                // }).exec(asynccallback);
                            }console.log(JSON.stringify([{
                                $match: query
                            }, {
                                $sort: {
                                    'lastModified': -1
                                }
                            }, {
                                $group: {
                                    _id: {
                                        sku: '$sku',
                                        location: '$location',
                                    },
                                    location: {
                                        $last: '$location'
                                    },
                                    sku: {
                                        $last: '$sku'
                                    },
                                    qtyStatus: {
                                        $last: '$qtyStatus'
                                    },
                                    qty: {
                                        $sum: '$qty'
                                    },
                                    sku: {
                                        $last: '$sku'
                                    },
                                    firstrecvdate: {
                                        $last: '$created'
                                    },
                                    lastrecvdate: {
                                        $first: '$created'
                                    },
                                    lastupdatedate: {
                                        $first: '$lastModified'
                                    }
                                }
                            }]));
                            po_item_quantity_statusModel.aggregate([{
                                $match: query
                            }, {
                                $sort: {
                                    'lastModified': -1
                                }
                            }, {
                                $group: {
                                    _id: {
                                        sku: '$sku',
                                        location: '$location',
                                    },
                                    location: {
                                        $last: '$location'
                                    },
                                    sku: {
                                        $last: '$sku'
                                    },
                                    qtyStatus: {
                                        $last: '$qtyStatus'
                                    },
                                    qty: {
                                        $sum: '$qty'
                                    },
                                    sku: {
                                        $last: '$sku'
                                    },
                                    firstrecvdate: {
                                        $last: '$created'
                                    },
                                    lastrecvdate: {
                                        $first: '$created'
                                    },
                                    lastupdatedate: {
                                        $first: '$lastModified'
                                    }
                                }
                            }]).exec(asynccallback);
                        };
                        // async.forEach(resultskus, function(skudata, asynccallback) {
                        // getQtystatusdata(
                        // {
                        //          $or: [{
                        // qtyStatus: 
                        // constant.status.RECEIVED
                        // }, {
                        //     qtyStatus: constant.status.RETURNQTY
                        // }]
                        // }
                        // ,
                        // function(err, qtyStatusdata) {
                        // console.log(qtyStatusdata);
                        // getQtystatusdata(constant.status.RETURNQTY, function(err, returnStatusdata) {
                        getQtystatusdata('', function(err, updateStatusdata) {
                            var qs = require('querystring');
                            var search = {};
                            search['fromdate'] = fromDate;
                            search['todate'] = toDate;
                            search['sku'] = resultskus.join(',');
                            search['fromLocationId'] = location;
                            var returnTran = constant.returnTran.split(',');
                            var receivedTran = constant.receivedTran;
                            var receivedTrandata = constant.receivedTran.split(',');
                            var return_POS = '';
                            for (var j = 0, length2 = returnTran.length; j < length2; j++) {
                                return_POS = return_POS + ',' + trantype[returnTran[j]];
                            }
                            var options = {
                                url: env_config.apiPath + constant.apis.GETTRANSACTIONDATA + trantype[constant.soldTran] + return_POS + '&' + qs.stringify(search),
                                method: 'GET',
                                headers: {
                                    'authorization': header,
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                }
                            };
                            console.log('url', env_config.apiPath + constant.apis.GETTRANSACTIONDATA + receivedTran + '&directiveTypeId=' + receivedTran + '&' + qs.stringify(search));
                            request(options, function(err, response, data) {
                                var options = {
                                    url: env_config.apiPath + constant.apis.GETTRANSACTIONDATA + '&tranType_or_directiveType=' + receivedTran + '&' + qs.stringify(search),
                                    method: 'GET',
                                    headers: {
                                        'authorization': header,
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                    }
                                };
                                console.log('url', options, env_config.dashPath + constant.apis.GETPURCHASEDPRODUCTS + location + '/srch:' + srch + '/page:' + page);
                                request(options, function(err, response, receiveddata) {

                                    for (var skuno = 0, length1 = skus.length; skuno < length1; skuno++) {
                                        // skus[skuno].storedata = {};
                                        var locArr = location.split(',');
                                        // var
                                        skus[skuno]['receiveddata'] = {};
                                        skus[skuno]['returneddata'] = {};
                                        skus[skuno]['solddata'] = {};
                                        for (var j = 0, length2 = locArr.length; j < length2; j++) {
                                            skus[skuno]['receiveddata'][locArr[j]] = '';
                                            skus[skuno]['returneddata'][locArr[j]] = '';
                                            skus[skuno]['solddata'][locArr[j]] = '';
                                        }
                                        for (var sku = 0, length = updateStatusdata.length; sku < length; sku++) {
                                            if (updateStatusdata[sku].sku == skus[skuno].sku) {
                                                skus[skuno].lastupdatedate = updateStatusdata[sku].lastupdatedate;
                                                sku = updateStatusdata.length;
                                            }
                                        }
                                        try {
                                            var POSTran = JSON.parse(data);
                                            var receivedTran = JSON.parse(receiveddata);
                                        } catch (e) {
                                            var POSTran = {};
                                            var receivedTran = {};
                                        }
                                        console.log('POSTran');
                                        console.log(POSTran);
                                        console.log('receiveddata');
                                        console.log(receivedTran);
                                            var skustotalrecv = 0;
                                        skus[skuno].totalsold = 0;
                                        skus[skuno].totalreturned = 0;
                                        skus[skuno].totalreceived = 0;
                                        skus[skuno]['locttl'] = 0;
                                        skus[skuno]['locsoldttl'] = 0;
                                        skus[skuno]['totalrecv'] = 0;
                                        for (var j = 0, length2 = locArr.length; j < length2; j++) {
                                            if (POSTran[locArr[j]]) {
                                                if (POSTran[locArr[j]][skus[skuno].sku]) {
                                                    skus[skuno].totalsold += POSTran[locArr[j]][skus[skuno].sku]['trandata'][trantype[constant.soldTran]] || 0;
                                                    skus[skuno]['solddata'][locArr[j]] = POSTran[locArr[j]][skus[skuno].sku]['trandata'][trantype[constant.soldTran]] || 0;
                                                    POSTran[locArr[j]][skus[skuno].sku]['trandata'][trantype[constant.soldTran]] ? skus[skuno]['locsoldttl']++ : '';
                                                    var totalreturned = 0;
                                                    for (var return_no = 0, length2 = returnTran.length; return_no < length2; return_no++) {
                                                        skus[skuno].totalreturned += POSTran[locArr[j]][skus[skuno].sku]['trandata'][trantype[returnTran[return_no]]] || 0;
                                                        totalreturned += POSTran[locArr[j]][skus[skuno].sku]['trandata'][trantype[returnTran[return_no]]] || 0;
                                                    }
                                                    skus[skuno]['returneddata'][locArr[j]] = totalreturned == 0 ? '' : totalreturned;
                                                    totalreturned ? skus[skuno]['locttl']++ : '';
                                                    skus[skuno]['lastsolddate'] ? '' : skus[skuno]['lastsolddate'] = POSTran[locArr[j]][skus[skuno].sku].lastrecvdate;
                                                    if(POSTran[locArr[j]][skus[skuno].sku].lastrecvdate < skus[skuno]['lastsolddate']){
                                                        skus[skuno]['lastsolddate'] = POSTran[locArr[j]][skus[skuno].sku].lastrecvdate;
                                                    }
                                                    skus[skuno]['lastupdatedate'] = POSTran[locArr[j]][skus[skuno].sku].lastupdatedate;
                                                }
                                            }
                                            if (receivedTran[locArr[j]]) {
                                                if (receivedTran[locArr[j]][skus[skuno].sku]) {
                                                    var totalrecv = 0;
                                                    for (var recv_no = 0, length2 = receivedTrandata.length; recv_no < length2; recv_no++) {
                                                        skus[skuno].totalreceived += (receivedTran[locArr[j]][skus[skuno].sku]['trandata'][receivedTrandata[recv_no]] || 0);
                                                        totalrecv += (receivedTran[locArr[j]][skus[skuno].sku]['trandata'][receivedTrandata[recv_no]] || 0);
                                                    }
                                                    skus[skuno].firstrecvdate ? '' : skus[skuno].firstrecvdate = receivedTran[locArr[j]][skus[skuno].sku].firstrecvdate;
                                                    skus[skuno].lastrecvdate ? '' : skus[skuno].lastrecvdate = receivedTran[locArr[j]][skus[skuno].sku].lastrecvdate;
                                                    if (skus[skuno].firstrecvdate < receivedTran[locArr[j]][skus[skuno].sku].firstrecvdate) {
                                                        skus[skuno].firstrecvdate = receivedTran[locArr[j]][skus[skuno].sku].firstrecvdate;
                                                    }
                                                    if (receivedTran[locArr[j]][skus[skuno].sku].lastrecvdate < skus[skuno].lastrecvdate) {
                                                        skus[skuno].lastrecvdate = receivedTran[locArr[j]][skus[skuno].sku].lastrecvdate;
                                                    }
                                                    
                                                    skus[skuno]['receiveddata'][locArr[j]] = totalrecv == 0 ? '' : totalrecv;
                                                    totalrecv ? skustotalrecv++ : '';
                                                }
                                            }
                                        }

                                        if (skus[skuno].locttl) {
                                            // skus[skuno].totalreturned ? skus[skuno].totalreturned = skus[skuno].totalreturned / skus[skuno].locttl : '';
                                            skus[skuno].totalreturned ? skus[skuno].totalreturned = skus[skuno].totalreturned: '';
                                        }
                                        if (skus[skuno].locsoldttl) {
                                            // skus[skuno].totalsold ? skus[skuno].totalsold = skus[skuno].totalsold / skus[skuno].locsoldttl : '';
                                            skus[skuno].totalsold ? skus[skuno].totalsold = skus[skuno].totalsold : '';
                                        }
                                        if (skustotalrecv) {
                                            // skus[skuno].totalreceived ? skus[skuno].totalreceived = skus[skuno].totalreceived / skustotalrecv : '';
                                            skus[skuno].totalreceived ? skus[skuno].totalreceived = skus[skuno].totalreceived: '';
                                           
                                        }
                                        skus[skuno].totalreceived ? skus[skuno].totalreceived = skus[skuno].totalreceived.toString() : '';
                                        delete skus[skuno]['locttl'];
                                        delete skus[skuno]['locsoldttl'],delete  skus[skuno]['totalrecv'];
                                        // POSTran[skus[skuno].sku] = {};POSTran[skus[skuno].sku]['LAY_POS_RETURN']=;
                                        // POSTran[skus[skuno].sku] ? skus[skuno].totalsold = POSTran[skus[skuno].sku][trantype[constant.soldTran]] || 0 : '';
                                        // for (var j = 0, length2 = returnTran.length; j < length2; j++) {
                                        //     POSTran[skus[skuno].sku] ? skus[skuno].totalreturned += POSTran[skus[skuno].sku][trantype[returnTran[j]]] || 0 : '';
                                        // }
                                        // skus[skuno].totalsold = soldTran[skus[skuno].sku][constant.soldTran] || 0;
                                    }
                                    // console.log(products);
                                    products.skus = skus;
                                    result.products.push(products);
                                    // callback('', products);
                                    asynccallback('', products);
                                });
                            });
                        });
                        // });
                        // });
                        // }, function(result) {
                        //     products.skus = skus;
                        //     callback('', products);
                        // });
                        // var getSKUdata = function(skudata) {};
                    } 
                    else if (products.productCode === null || products.productCode === '') {
                        asynccallback('', products);
                    }
                    else {
                        result.products.push(products);
                        asynccallback('', products);
                    }
                }, function() {
                    return callback('', result);
                });
            }
            var storedata = {};
            var storepodata = {};
            var orderarr = [];
            // if (location) {
            //     orderModel.find({
            //         shipToLocation: {
            //             '$in': location.split(',')
            //         }
            //         // }, 'purchaseOrderNumber', function(err, data) {
            //     }, function(err, data) {
            //         if (data) {
            //             // orderarr = data;
            //             for (var j = 0, length2 = data.length; j < length2; j++) {
            //                 if (data.purchaseOrderNumber) {
            //                     orderarr.push(data[j].purchaseOrderNumber);
            //                     storedata[data[j].shipToLocation] ? '' : storedata[data[j].shipToLocation] = [];
            //                     storedata[data[j].shipToLocation].push(data[j].purchaseOrderNumber);
            //                     storepodata[data[j].purchaseOrderNumber] = data[j].shipToLocation;
            //                 }
            //             }
            //             return getproducts('', result);
            //         }
            //     });
            // } else {
            getproducts();
            // }
        }
    });
}