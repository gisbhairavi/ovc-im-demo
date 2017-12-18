var log = require('./log');
var env_config = require('../config/config');
var Ordertype = require('../config/Ordertype.json');
var Worker = require('pigato').Worker;
var inventoryavailabilityManger = require('./manager/inventoryavailabilityManger');
var shipmentManger = require('./manager/shipmentManger');
var countManager = require('./manager/countManager');
var orderItem = require('./manager/orderItemManager');
var fs = require('fs');
var constant = require('../config/const.json');
var utils = require('./utils');
var path = require('path');
var querystring = require('querystring');
var async = require('async');
var request = require("request")
var erpManager = require("./manager/erpManager")
var awsManager = require("./manager/awsManager")
var downloadManager = require("./manager/downloadManager")
var mongodb = require('./mongodb');
var worker = new Worker(env_config.brokerHost, 'loadjson');
var po_item_quantity_statusModel = require('./model/po_item_quantity_statusModel');
var po_asnModel = require('./model/po_asnModel');
var Q = require('q');
var lo = require('lodash');
worker.on('error', function(e) {
    log.error('Worker error', e);
});
worker.on('request', function(input, rep) {
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
        request(options, function(err, response, data) {
            console.log(env_config.apiPath + constant.apis.TRANSACTIONSERVICE, dataobj);
            console.log(err, data);
            console.log('asynccallback', data);
            callback ? callback(err, data) : '';
        });
    };
    var Createcountitem = function(dataobj, v) {
        var formData = querystring.stringify(dataobj);
        var contentLength = formData.length;
        var options = {
            url: env_config.apiPath + constant.apis.COUNTITEMSERVICE,
            method: 'PUT',
            body: formData,
            headers: {
                'authorization': input.params.headers,
                'Content-Length': contentLength,
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        };
        request(options, function(err, response, data) {
            console.log(env_config.apiPath + constant.apis.COUNTITEMSERVICE, dataobj);
            console.log(err, data);
            v(err, data);
        });
    };
    var CreateTranService = function(dataArr, callback) {
        var srch = {
            skus: JSON.stringify(dataArr)
        };
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
    var getjson = function(data) {
        return JSON.parse(JSON.stringify(data));
    };
    function checkPriceValue (priceData) {
        var result = false;
        if (priceData) {
            if (Array.isArray(priceData)) {
                if (priceData[0] && priceData[0].value && Number(priceData[0].value) !== NaN)
                    result = true;
            }
            else {
                if (priceData && Number(priceData) !== NaN)
                    result = true;
            }
        }
        return result;
    }
    log.info('Worker request', input);

    //===============================================================// 
    //***********Receive Purchase Json Calculation Start*************//

    //*****get all SKU in Given Json****//
    function getSkus (orderData){
        var skuArray    =   [];
        if(orderData.purchaseOrderAsn){
            if(orderData.purchaseOrderAsn.purchaseOrderItem && Array.isArray(orderData.purchaseOrderAsn.purchaseOrderItem)){
                orderData.purchaseOrderAsn.purchaseOrderItem.forEach(function(orderItem){
                    if(skuArray.indexOf(orderItem.sku) == -1){
                        skuArray.push(orderItem.sku);
                    }
                });
            }
            else if(orderData.purchaseOrderAsn.purchaseOrderPackage && Array.isArray(orderData.purchaseOrderAsn.purchaseOrderPackage)){
                orderData.purchaseOrderAsn.purchaseOrderPackage.forEach(function(pack){
                    if(pack.purchaseOrderItem && Array.isArray(pack.purchaseOrderItem)){
                        pack.purchaseOrderItem.forEach(function(orderItem){
                            if(skuArray.indexOf(orderItem.sku) == -1){
                                skuArray.push(orderItem.sku);
                            }
                        });
                    }
                });
            }
        }else{
            if(orderData.purchaseOrderItem && Array.isArray(orderData.purchaseOrderItem)){
                orderData.purchaseOrderItem.forEach(function(orderItem){
                    if(skuArray.indexOf(orderItem.sku) == -1){
                        skuArray.push(orderItem.sku);
                    }
                });
            }
        }
        return skuArray;
    }

    function getSkuprice (jsonData, callback) {
        var skuObj = {};
        async.forEach(jsonData, function(orderData, async_callback){
            if (orderData.purchaseOrder && orderData.purchaseOrder.purchaseOrderType !== 'PUSH') {
                var SkusArr = getSkus(orderData.purchaseOrder);
                if (SkusArr && SkusArr.length) {
                    var locationId = orderData.purchaseOrder.markForLocation ? orderData.purchaseOrder.markForLocation : orderData.purchaseOrder.shipToLocation;
                    console.log("URL_:",env_config.dashPath + constant.apis.GETPRODUCTCOST + '?sku=' + SkusArr.join(',') + '&loc=' + locationId);
                    request(env_config.dashPath + constant.apis.GETPRODUCTCOST + '?sku=' + SkusArr.join(',') + '&loc=' + locationId, function(err, body, skuPrice) {
                        if (err) {
                            return async_callback();
                        }

                        try{
                            skuPrice    =   JSON.parse(skuPrice);
                        }catch(e){
                            return async_callback();
                        }
                        if(skuPrice && skuPrice.status != 'error' && skuPrice.length){

                            skuPrice.forEach(function(price){
                                if(price.ProductPrice){
                                    if (!skuObj[locationId])
                                        skuObj[locationId] = {};
                                    skuObj[locationId][price.ProductPrice.SKU]  =   price.ProductPrice;
                                }
                            });
                        }

                        async_callback();
                    });
                }
                else {
                    async_callback();
                }
            } else {
                async_callback();
            }
        }, function (){
            callback(null, skuObj);
        });
    }

    //***** SKU all prices Calculation ****//
    function skuCalculation (order , priceData , item){
        var deffer      =    Q.defer();
        var tempcost    =    0, skuCost = 0, skutax = 0 , total = 0, skuvat = 0 , skutotalvat = 0 , totalcost = 0, totalPoTaxAsn = 0 , totalPoVATAsn = 0 , PoSubtotalAsn = 0 , totalPoCostAsn = 0
                                totalPoTaxConfirm = 0 , totalPoVATConfirm = 0 , totalPoCostConfirm = 0 , PoSubtotalConfirm = 0;
        if(order.purchaseOrderAsn){
            function calculateAsnPrices (orderItemData) {
                orderItemData.forEach(function(orderItem){
                    orderItem['totalProductTaxAsn']     =   0;
                    orderItem['totalProductVatAsn']     =   0;
                    orderItem['totalProductCostAsn']    =   0;
                    try {
                        if (orderItem && item[orderItem.sku] && (orderItem.purPrices && orderItem.purPrices[0])) {
                            if((item[orderItem.sku].qty != 0) 
                                || (orderItem.purPrices[0].value != 0)){

                                var skuPriceData    =   priceData[orderItem.sku];

                                tempcost    =   parseFloat(orderItem.purPrices[0].value) * parseFloat(item[orderItem.sku].qty);
                                skuCost     =   parseFloat(tempcost);
                                if (skuPriceData.isVAT == 0) {
                                    skutax          =    (skuCost * parseFloat(skuPriceData.percentage / 100));
                                    total           =    skutax + skuCost;
                                    totalcost       =    parseFloat(total).toFixed(2);
                                } else { 
                                    skuvat          =   ( skuCost  * parseFloat(skuPriceData.percentage / 100));
                                    skutotalvat     =   parseFloat(skuvat).toFixed(2);
                                    totalcost       =   parseFloat(skuCost).toFixed(2);
                                }
                                orderItem['totalProductTaxAsn']     =   skutax;
                                orderItem['totalProductVatAsn']     =   skutotalvat;
                                orderItem['totalProductCostAsn']    =   totalcost;
                            }
                        }
                        order['totalPoTaxAsn']      =   totalPoTaxAsn + orderItem['totalProductTaxAsn'];
                        order['totalPoVATAsn']      =   totalPoVATAsn + orderItem['totalProductVatAsn'];
                        order['totalPoCostAsn']     =   totalPoCostAsn+ orderItem['totalProductCostAsn'];
                        order['PoSubtotalAsn']      =   PoSubtotalAsn + (order['totalPoCostAsn'] - order['totalPoTaxAsn']);
                    }
                    catch (e) {
                        console.log("Error:",e);
                        deffer.reject(e);
                    }
                });
            }
            if (order.purchaseOrderAsn.purchaseOrderItem){
                calculateAsnPrices(order.purchaseOrderAsn.purchaseOrderItem);
                deffer.resolve(order);
            }
            else if(order.purchaseOrderAsn.purchaseOrderPackage){
                order.purchaseOrderAsn.purchaseOrderPackage.forEach(function(pack){
                    if(pack.purchaseOrderItem){
                        calculateAsnPrices(pack.purchaseOrderItem);
                    }else{
                        deffer.reject('order');
                        console.log(pack + 'not having package ID or purchaseOrderItem Object');
                    } 
                });
                deffer.resolve(order);
            }else{
                console.log('Not Having purchaseOrderPackage Object');
            }
        }else{
            var tempObjskuConfirm       =   [];
            if(order.purchaseOrderItem){
                order.purchaseOrderItem.forEach(function(confirmItem){
                    confirmItem['totalProductTaxConfirm']     =   0;
                    confirmItem['totalProductVatConfirm']     =   0;
                    confirmItem['totalProductCostConfirm']    =   0;
                    try {
                        if (confirmItem && item[confirmItem.sku] && (confirmItem.purPrices && confirmItem.purPrices[0])) {
                            if((item[confirmItem.sku] && item[confirmItem.sku].qty != 0) 
                                || (confirmItem.purPrices && confirmItem.purPrices[0] && confirmItem.purPrices[0].value != 0)){

                                var skuPriceData    =   priceData[confirmItem.sku];
                                tempcost            =   parseFloat(confirmItem.purPrices[0].value) * parseFloat(item[confirmItem.sku].qty);
                                skuCost             =   parseFloat(tempcost);
                                if (skuPriceData.isVAT == 0) {
                                    skutax          =    (skuCost * parseFloat(skuPriceData.percentage / 100));
                                    total           =    skutax + skuCost; 
                                    totalcost       =    parseFloat(total).toFixed(2);
                                } else { 
                                    skuvat          =   (skuCost * parseFloat(skuPriceData.percentage / 100));
                                    skutotalvat     =   parseFloat(skuvat).toFixed(2);
                                    totalcost       =   parseFloat(skuCost).toFixed(2);
                                }
                                confirmItem['totalProductTaxConfirm']     =   skutax;
                                confirmItem['totalProductVatConfirm']     =   skutotalvat;
                                confirmItem['totalProductCostConfirm']    =   totalcost;

                            }
                            if(tempObjskuConfirm.indexOf(confirmItem.sku) == -1){
                                order['totalPoTaxConfirm']      =   totalPoTaxConfirm + confirmItem['totalProductTaxConfirm'];
                                order['totalPoVATConfirm']      =   totalPoVATConfirm + confirmItem['totalProductVatConfirm'];
                                order['totalPoCostConfirm']     =   totalPoCostConfirm +confirmItem['totalProductCostConfirm'];
                                order['PoSubtotalConfirm']      =   PoSubtotalConfirm + (order['totalPoCostConfirm'] - order['totalPoTaxConfirm']);
                                tempObjskuConfirm.push(confirmItem.sku);
                            }
                        }
                    }
                    catch (e) {
                        console.log("Error:",e);
                        deffer.reject(e);
                    }
                });
            }else{
                console.log('Not Having purchaseOrderItem Object');
            }
            deffer.resolve(order);
        }
        return deffer.promise;
    };

    //**** Order item Qty Deffered ****//
    function getorderSkuQty (orderNo){
        var deffer      =    Q.defer();
        if(orderNo){
            console.log(env_config.apiPath + constant.apis.GETORDERITEMBYORDERNUMBER + orderNo , 'OPTIONS');
            var options = {
                url: env_config.apiPath + constant.apis.GETORDERITEMBYORDERNUMBER + orderNo,
                method: 'GET',
                headers: {
                    'authorization': input.params.headers
                }
            };
            request(options, function(err, response, data) {

                if(err){
                    console.log('ERRROR');
                    deffer.reject(err);
                }else if(data){
                    try {
                       data            =   JSON.parse(data);
                       var tempObj     =   {};
                       var orderitem   =   data.item_data;
                        orderitem.forEach(function(itemData){
                            tempObj[itemData.SKU]  = itemData;
                        });
                        deffer.resolve(tempObj);
                    } catch(e) {
                        console.log(e.message);
                        deffer.reject(e);
                    }
                    
                }
                
            });
        }

        return deffer.promise;
    }
    //**** Main Function Deffered ****// 
    function getJsonWithAllprices (dataArray){
        var deffer      =    Q.defer();
        var tempArray   =   []; 
         async.forEach(dataArray, function(data, tempCallBack) {
            if(data && data.constructor ===  Object){
                if(data.purchaseOrder && data.purchaseOrder.constructor ===  Object){
                    if((data.purchaseOrder && data.purchaseOrder.purchaseOrderAsn && data.purchaseOrder.purchaseOrderAsn.purchaseOrderPackage)
                        || (data.purchaseOrder && data.purchaseOrder.purchaseOrderItem)
                        || (data.purchaseOrder && data.purchaseOrder.purchaseOrderAsn && data.purchaseOrder.purchaseOrderAsn.purchaseOrderItem)){
                        
                        //****get orderitem for SKU qty Deffered****//
                        var getorderSkuQtyData      =    getorderSkuQty(data.purchaseOrder.purchaseOrderNumber);
                        getorderSkuQtyData.then(function(orderitemSKU){
                            var orderData   =   data.purchaseOrder;
                            var skuObj      =   {};
                            var locationId  =   data.purchaseOrder.markForLocation ? data.purchaseOrder.markForLocation : data.purchaseOrder.shipToLocation;
                            //****All SKU get Deffered****//
                            var getSkusData =   getSkus(orderData);
                            getSkusData.then(function(allSku){
                                if(allSku && locationId){
                                    request(env_config.dashPath + constant.apis.GETPRODUCTCOST + '?sku=' + allSku.join(',') + '&loc=' + locationId, function(err, body, skuPrice) {
                                        try{
                                            skuPrice    =   JSON.parse(skuPrice);
                                        }catch(e){
                                            deffer.reject(e);
                                        }
                                        if(err){
                                            console.log('Get product price Service Error'+ err);
                                            deffer.reject(err);
                                        }
                                        if(skuPrice && skuPrice.status != 'error' && skuPrice.length > 0){
 
                                            skuPrice.forEach(function(price){
                                                if(price.ProductPrice){
                                                    skuObj[price.ProductPrice.SKU]  =   price.ProductPrice;
                                                }
                                            });

                                            //****SKU Calculation Deffered Method****// 
                                            var skuCalculationData  =   skuCalculation(orderData , skuObj, orderitemSKU);
                                            skuCalculationData.then(function(sampleData){
                                                tempArray.push(data);
                                                tempCallBack();
                                            });
                                        }else{
                                            console.log('Cannot get price data');
                                            deffer.reject('Cannot get price data');
                                        }
                                        
                                    });
                                }
                            });
                        }, function(error){
                            console.log('Internal Ordertime Service Failed'+ error);
                            deffer.reject('Cannot get price data');
                        });
                        
                    }
                }
            }else{
                deffer.resolve(tempArray);  
            }
        }, function(err){
            if(err){
                deffer.reject(err);
            }else{
                deffer.resolve(tempArray);
            }
        });
         
        return deffer.promise;
    };

    function checkOrderType(orderdata){
        var deffer      =    Q.defer();
        async.forEach(orderdata, function(data, orderCallBack) {
            if(data.purchaseOrder && data.purchaseOrder.constructor ===  Object ){
                if(data.purchaseOrder.orderType && (data.purchaseOrder.orderType == 'MAN' || data.purchaseOrder.orderType == 'ZFUT' || data.purchaseOrder.orderType == 'RPL')){
                    deffer.resolve(true);
                    orderCallBack();
                }else{
                    deffer.resolve(false);
                    orderCallBack();
                }
            }
        });
        return deffer.promise;
    }
    //***********Receive Purchase Json Calculation End*************//
    // ============================================================ // 
    switch (input.op) {
        case 'uploadjson':
            if (input.params.jsonData && input.params.jsonData.uploaded_file) {
                try {
                    var response_count = 0;
                    var data = input.params.jsonData.uploaded_file;
                    data = JSON.parse(data);
                    if (data.hasOwnProperty('stockUpdate')) {
                        var error = [];
                        var tranArr = [];
                        var BALANCETRANTYPE = constant.BALANCETRANTYPE;
                        lo.forEach(data.stockUpdate, function(value, key) {
                            if (value.sku && value.location) {
                                lo.forEach(value.balanceTypeQty, function(skuvalue) {
                                    if (BALANCETRANTYPE[skuvalue.balanceType]) {
                                        if (parseFloat(skuvalue.value)) {
                                            var dataobj = {
                                                transtypeid: BALANCETRANTYPE[skuvalue.balanceType],
                                                stocklocationid: '',
                                                asnid: '',
                                                locationid: value.location,
                                                stockUOM: value.uom,
                                                quantity: skuvalue.value,
                                                warehouseid: value.location,
                                                sku: value.sku,
                                                directivetype: ''
                                            };
                                            tranArr.push(dataobj);
                                         }else {
                                          error.push('File Upload Error: value not allowed for <span class="text-uppercase">' + skuvalue.balanceType + '</span> (sku: '+value.sku+ ', location: '+value.location+')');
                                         }
                                    } else {
                                        error.push('Error: not allowed to upload data for <span class="text-uppercase">' + skuvalue.balanceType + '</span> (sku: ' + value.sku + ', location: ' + value.location + ')');
                                    }
                                });
                            } else {
                                error.push('File Upload Error: sku not found for ' + (key + 1));
                            }
                        });
                        if (tranArr.length) {
                            rep.end({
                                    result: {
                                        "status": constant.label.SUCCESS,
                                        "message": "Sucessfully Completed",
                                        "error": error.join('<br>')
                                    }
                                });
                            CreateTranService(tranArr, function(err, data) {
                            });
                        } else {
                            return rep.end({
                                result: {
                                    "status": constant.label.ERROR,
                                    "error": error.join('<br>')
                                }
                            });
                        }
                    } else {
                        return rep.end({
                            result: {
                                "status": constant.label.ERROR,
                                "message": "Error in JSON"
                            },
                            error: err
                        });
                    }
                } catch (e) {
                    console.log("Status Upload Error" + e);
                    return rep.end({
                        result: {
                            "status": constant.label.ERROR,
                            "message": "Problem in Stock Level upload"
                        },
                        error: err
                    });
                }
            } else {
                return rep.end({
                    result: {
                        "status": constant.label.ERROR,
                        "error": 'No Data.'
                    }
                });
            }
            break;
        case 'receivingpurchasejson':
            var user = {};
            var uploadjson = function(data, err) {
                try {
                    var jsonData = JSON.parse(data);
                    var tempArr = []; 
                    if (jsonData.purchaseOrder) {
                        tempArr.push(jsonData);
                        var jsonData = tempArr;
                    }
                } catch (e) {
                    console.log(e);
                    return rep.end({
                        result: {
                            "status": constant.label.ERROR
                        },
                        error: constant.label.ERROR
                    });
                }
                var result = 'Successfully Completed';
                var error = '';
                
                //****JSON with all Prices for the item and order****//
                // function internalCallJson(poJson){
                getSkuprice(jsonData, function(err, priceObj){
                    async.forEach(jsonData, function(body, purchasejson_callback) {
                        if (body.hasOwnProperty('purchaseOrder')) {
                            // Check wheather that purchaseOrderNumber is already exists
                            var getfloat = function(f) {
                                return parseFloat(f).toFixed(2);
                            }
                            var tranData =   {};
                            var pushTranArr = [];
                            var createTran = true;
                            var CreateSKUstatusTran = function(purchaseOrder, packageStatus, statuscallback) {
                                var toLoc;
                                var asn_id = '';
                                var fromLocationId = '';
                                if (purchaseOrder.markForLocation == '' || purchaseOrder.markForLocation == undefined) {
                                    toLoc = purchaseOrder.shipToLocation;
                                } else {
                                    toLoc = purchaseOrder.markForLocation;
                                }
                                if (purchaseOrder.purchaseOrderAsn) {
                                    asn_id = purchaseOrder.purchaseOrderAsn.asnId
                                }
                                if (purchaseOrder.purchaseOrderType == 'MAN' || purchaseOrder.purchaseOrderType == 'RPL' || purchaseOrder.purchaseOrderType == 'ZFUT') {
                                    var directivetypeId =   Ordertype[purchaseOrder.purchaseOrderType][packageStatus.qtyStatus];
                                    var dataobj = {
                                        transtypeid: '',
                                        stocklocationid: '',
                                        asnid: asn_id,
                                        locationid: toLoc,
                                        stockUOM: packageStatus.uom,
                                        quantity: packageStatus.qty,
                                        purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
                                        purchaseOrderType: purchaseOrder.purchaseOrderType,
                                        cost: packageStatus.skuCost,
                                        warehouseid: toLoc,
                                        sku: packageStatus.sku,
                                        addTran: createTran ? 'true' : '',
                                        // user: user,
                                        directivetype: directivetypeId
                                    };
                                    // !tranData[directivetypeId] ?
                                    //     tranData[directivetypeId] = [] :
                                    //     '';

                                    // tranData[directivetypeId].push(dataobj);

                                    if (constant.orderConfirmingStatus.indexOf(packageStatus.qtyStatus) != -1) {
                                        if (!tranData[directivetypeId]) {
                                            tranData[directivetypeId] = [];
                                            dataobj.createTran = 'true'
                                        }
                                        tranData[directivetypeId].push(dataobj);
                                        statuscallback();
                                    }
                                    else {
                                        CreateTran(dataobj, statuscallback);
                                        createTran = false;
                                    }

                                } else if (purchaseOrder.purchaseOrderType == 'IBT_M') {
                                    var dataobj = {
                                        transtypeid: '',
                                        stocklocationid: '',
                                        asnid: asn_id,
                                        locationid: toLoc,
                                        stockUOM: packageStatus.uom,
                                        quantity: packageStatus.qty,
                                        purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
                                        purchaseOrderType: purchaseOrder.purchaseOrderType,
                                        cost: packageStatus.skuCost,
                                        warehouseid: toLoc,
                                        sku: packageStatus.sku,
                                        // user: user,
                                        directivetype: Ordertype[purchaseOrder.purchaseOrderType]['toStore'][packageStatus.qtyStatus]
                                    };
                                    CreateTran(dataobj, function(err, data) {
                                        var dataobj = {
                                            transtypeid: '',
                                            stocklocationid: '',
                                            asnid: asn_id,
                                            locationid: purchaseOrder.FromLocation,
                                            stockUOM: packageStatus.uom,
                                            quantity: packageStatus.qty,
                                            purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
                                            purchaseOrderType: purchaseOrder.purchaseOrderType,
                                            cost: packageStatus.skuCost,
                                            warehouseid: purchaseOrder.FromLocation,
                                            sku: packageStatus.sku,
                                            // user: user,
                                            directivetype: Ordertype[purchaseOrder.purchaseOrderType]['fromStore'][packageStatus.qtyStatus]
                                        };
                                        CreateTran(dataobj, statuscallback);
                                    });
                                } else if (purchaseOrder.purchaseOrderType == 'PUSH') {
                                    var dataobj = {
                                        transtypeid: '',
                                        stocklocationid: '',
                                        asnid: asn_id,
                                        locationid: toLoc,
                                        stockUOM: packageStatus.uom,
                                        quantity: packageStatus.qty,
                                        purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
                                        purchaseOrderType: purchaseOrder.purchaseOrderType,
                                        cost: packageStatus.skuCost,
                                        warehouseid: toLoc,
                                        sku: packageStatus.sku,
                                        // user: user,
                                        directivetype: Ordertype[purchaseOrder.purchaseOrderType]['toStore'][packageStatus.qtyStatus]
                                    };
                                    pushTranArr.push(dataobj);
                                    // CreateTran(dataobj, function(err, data) {
                                        if (purchaseOrder.orderStatus !== "draft") {
                                            var dataobj = {
                                                transtypeid: '',
                                                stocklocationid: '',
                                                asnid: asn_id,
                                                locationid: purchaseOrder.FromLocation,
                                                stockUOM: packageStatus.uom,
                                                quantity: packageStatus.qty,
                                                purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
                                                purchaseOrderType: purchaseOrder.purchaseOrderType,
                                                cost: packageStatus.skuCost,
                                                warehouseid: purchaseOrder.FromLocation,
                                                sku: packageStatus.sku,
                                                // user: user,
                                                directivetype: Ordertype[purchaseOrder.purchaseOrderType]['fromStore'][packageStatus.qtyStatus]
                                            };
                                            pushTranArr.push(dataobj);
                                            statuscallback();
                                            // CreateTran(dataobj, statuscallback);
                                        }
                                        else {
                                            statuscallback();
                                        }
                                    // });
                                } else {
                                    statuscallback();
                                }
                            };
                            shipmentManger.checkOrder(body.purchaseOrder.purchaseOrderNumber, function(err, order) {
                                var order_id = 0;
                                // || body.purchaseOrder.purchaseOrderType == 'ZFUT' || body.purchaseOrder.poType == 'ZFUT'
                                shipmentManger.checkErpOrder(body.purchaseOrder.erpPurchaseOrder, function(err, erporder) {
                                    if (erporder) {
                                        order = erporder;
                                    }
                                    if (order) {
                                        if (order) {
                                            order_id = order._id;
                                        }
                                        var purchaseOrder = body.purchaseOrder;
                                        var token;
                                        // if (body.purchaseOrder.hasOwnProperty('poType')) {
                                        //     purchaseOrder.purchaseOrderType = purchaseOrder.poType
                                        // }
                                        if (body.purchaseOrder.hasOwnProperty('orderType')) {
                                            purchaseOrder.purchaseOrderType = purchaseOrder.orderType
                                        }                                        // purchaseOrder.purchaseOrderNumber = token;
                                        // var purchaseOrder = body.purchaseOrder;

                                        var orderStatus = purchaseOrder.orderStatus ? purchaseOrder.orderStatus : constant.orderStatus.INPROGRESS;
                                        
                                        shipmentManger.createOrder(order_id, getjson({
                                            location: purchaseOrder.location,
                                            // purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
                                            purchaseOrderDate: purchaseOrder.purchaseOrderDate,
                                            erpPurchaseOrder: purchaseOrder.erpPurchaseOrder,
                                            purchaseOrderType: purchaseOrder.purchaseOrderType,
                                            vendorId: purchaseOrder.vendorId,
                                            erpNotes: purchaseOrder.erpNotes,
                                            shipToLocation: purchaseOrder.shipToLocation,
                                            toStreetName: purchaseOrder.toStreetName,
                                            toStreetNumber: purchaseOrder.toStreetNumber,
                                            toCity: purchaseOrder.toCity,
                                            markForLocation: purchaseOrder.markForLocation,
                                            toPostalCode: purchaseOrder.toPostalCode,
                                            toCountry: purchaseOrder.toCountry,
                                            numberOfSKU: purchaseOrder.numberOfSKU,
                                            orderStatus: orderStatus,
                                            user: user,
                                            totalPoTaxConfirm: purchaseOrder.totalPoTaxConfirm,
                                            totalPoVATConfirm: purchaseOrder.totalPoVATConfirm,
                                            PoSubtotalConfirm: purchaseOrder.PoSubtotalConfirm,
                                            totalPoCostConfirm: purchaseOrder.totalPoCostConfirm,
                                            totalPoCostAsn: purchaseOrder.totalPoCostAsn,
                                            PoSubtotalAsn: purchaseOrder.PoSubtotalAsn,
                                            totalPoVATAsn: purchaseOrder.totalPoVATAsn,
                                            totalPoTaxAsn: purchaseOrder.totalPoTaxAsn
                                        }), function(err, order) {
                                            if (err) {
                                                // return rep.end({
                                                //     result: err,
                                                //     error: err
                                                // });
                                                return result = error = err;
                                            }
                                            purchaseOrder = order;
                                            var toLoc;
                                            if (purchaseOrder.markForLocation) {
                                                toLoc = purchaseOrder.markForLocation;
                                            } else {
                                                toLoc = purchaseOrder.shipToLocation;
                                            }
                                            // purchaseOrder.location = purchaseOrder.shipToLocation;
                                            if (body.purchaseOrder.hasOwnProperty('purchaseOrderAsn')) {
                                                purchaseOrder.purchaseOrderAsn = body.purchaseOrder.purchaseOrderAsn;
                                                var asn_status = purchaseOrder.purchaseOrderAsn.asnStatus ? purchaseOrder.purchaseOrderAsn.asnStatus : constant.orderStatus.SHIPPED;

                                                var numberOfPackages    =   0;
                                                var asn_qty             =   0;
                                                var asn_cost            =   0;

                                                shipmentManger.createpoasn( getjson({
                                                    poId: purchaseOrder.purchaseOrderNumber,
                                                    asnId: purchaseOrder.purchaseOrderAsn.asnId,
                                                    asnDate: purchaseOrder.purchaseOrderAsn.asnDate,
                                                    asnStatus: asn_status,
                                                    shipDate: purchaseOrder.purchaseOrderAsn.shipDate,
                                                    billOfLadingId: body.purchaseOrder.purchaseOrderAsn.billOfLadingId,
                                                    wayBillnumber: null,
                                                    invoiceNumber: null,
                                                    user: user
                                                }), function(err, poasnsucess) {
                                                    if (err) {
                                                        // return res.end({
                                                        //     result: err,
                                                        //     error: err
                                                        // });
                                                        return result = error = err;
                                                    }
                                                    if (body.purchaseOrder.purchaseOrderAsn.hasOwnProperty('purchaseOrderPackage')) {
                                                        var purchaseOrderPackage = body.purchaseOrder.purchaseOrderAsn.purchaseOrderPackage;
                                                        // var purchse_order_pkg = function(x) {
                                                        // if (x < purchaseOrderPackage.length) {
                                                        // var pckg_details = purchaseOrderPackage[x];
                                                        async.eachSeries(purchaseOrderPackage, function(pckg_details, asynccallback) {

                                                            var package_status = pckg_details.packageStatus ? pckg_details.packageStatus : constant.orderStatus.SHIPPED;

                                                            var package_cost    =   0;

                                                            shipmentManger.checkpoasnpackage(getjson({
                                                                asnId: body.purchaseOrder.purchaseOrderAsn.asnId,
                                                                packageId: pckg_details.packageId,
                                                                // userId: user.clientId,
                                                                // packageBarCode: null,
                                                                trackingNumber: pckg_details.trackingNumber,
                                                                // packageStatus: null,
                                                                packageStatus: package_status,
                                                                shipDate: pckg_details.shipDate,
                                                                expectedDeliveryDate: pckg_details.expectedDeliveryDate,
                                                                fromLocation: pckg_details.fromLocation,
                                                                fromStreetName: pckg_details.fromStreetName,
                                                                fromStreetNumber: pckg_details.fromStreetNumber,
                                                                fromCity: pckg_details.fromCity,
                                                                fromPostalCode: pckg_details.fromPostalCode,
                                                                fromCountry: pckg_details.fromCountry,
                                                                toLocation: pckg_details.shipToLocation,
                                                                toStreetName: pckg_details.toStreetName,
                                                                toStreetNumber: pckg_details.toStreetNumber,
                                                                toCity: pckg_details.toCity,
                                                                toPostalCode: pckg_details.toPostalCode,
                                                                toCountry: pckg_details.toCountry,
                                                                toPhoneNumber: null,
                                                                receivedDate: null,
                                                                user: user
                                                            }), function(err, poasnpkgsuccess) {
                                                                if (err) {
                                                                    console.log("error_:",err);
                                                                    console.log(err);
                                                                    asynccallback();
                                                                    return callback(err);
                                                                }

                                                                numberOfPackages  = numberOfPackages + 1;

                                                                if (pckg_details.hasOwnProperty('purchaseOrderItem')) {
                                                                    var purchaseOrderitems = pckg_details.purchaseOrderItem;
                                                                    var pack_skus   =   [];
                                                                    async.eachSeries(purchaseOrderitems, function(purchaseOrderitm, skuasynccallback) {
                                                                        // var purchase_order_item = function(y) {
                                                                        //                if (y < purchaseOrderitems.length) {
                                                                        // var purchaseOrderitm = purchaseOrderitems[y];
                                                                        function GetItemUOM() {
                                                                            orderItem.getOrderItem({
                                                                                "purchaseordernumber": purchaseOrder.purchaseOrderNumber,
                                                                                "sku": purchaseOrderitm.sku
                                                                            }, function(err, itemdata) {
                                                                                if (err) {
                                                                                    return result = error = err;
                                                                                }
                                                                                product_uom = itemdata.producUom;
                                                                            });
                                                                        }
                                                                        po_item_quantity_statusModel.findOne({
                                                                            "poId": purchaseOrder.purchaseOrderNumber,
                                                                            "sku": purchaseOrderitm.sku,
                                                                            "qtyStatus": "submitted"
                                                                        }, function(err, data) {

                                                                            var cost;
                                                                            if (checkPriceValue(purchaseOrderitm.purPrices))
                                                                                cost = purchaseOrderitm.purPrices[0].value;
                                                                            else if (checkPriceValue(purchaseOrderitm.skuCost))
                                                                                cost = purchaseOrderitm.skuCost;

                                                                            if (data && checkPriceValue(data.purPrices))
                                                                                cost = data.purPrices[0].value;
                                                                            else if (data && checkPriceValue(data.skuCost))
                                                                                cost = data.skuCost;

                                                                            // console.log(cost);
                                                                            po_item_quantity_statusModel.findOne({
                                                                                "poId": purchaseOrder.purchaseOrderNumber,
                                                                                "sku": purchaseOrderitm.sku,
                                                                                "qtyStatus": constant.status.CONFIRMED
                                                                            }).sort({
                                                                                'lastModified': -1
                                                                            }).exec(function(err, data) {
                                                                                po_item_quantity_statusModel.findOne({
                                                                                    "poId": purchaseOrder.purchaseOrderNumber,
                                                                                    "sku": purchaseOrderitm.sku,
                                                                                    "qtyStatus": 'shipped'
                                                                                }).sort({
                                                                                    'lastModified': -1
                                                                                }).exec(function(err, dataAsn) {
                                                                                    var qty_cost;
                                                                                    // var cost    =   purchaseOrderitm.purPrices[0].value;
                                                                                    if ( (checkPriceValue(purchaseOrderitm.purPrices)) && (purchaseOrderitm.qtyStatus == constant.status.SHIPPED)) {
                                                                                        qty_cost = purchaseOrderitm.purPrices[0].value;
                                                                                    } else if (dataAsn && checkPriceValue(dataAsn.purPrices)) {
                                                                                        qty_cost = dataAsn.purPrices[0].value;
                                                                                    } else if ((checkPriceValue(purchaseOrderitm.purPrices)) && ( constant.confirmingStatus.indexOf(purchaseOrderitm.qtyStatus) != -1 )) {
                                                                                        qty_cost = purchaseOrderitm.purPrices[0].value ;
                                                                                    } else {
                                                                                        if (data && checkPriceValue(data.purPrices))
                                                                                            qty_cost = data.purPrices[0].value;
                                                                                        else
                                                                                            qty_cost = cost;
                                                                                    }

                                                                                    if ( !checkPriceValue(qty_cost) && (priceObj[toLoc] && priceObj[toLoc][purchaseOrderitm.sku]))
                                                                                        qty_cost = priceObj[toLoc][purchaseOrderitm.sku].Cost;

                                                                                    purchaseOrderitm.skuCost = qty_cost;
                                                                                    purchaseOrderitm.uom = product_uom ? product_uom : constant.stockUOM;

                                                                                    var item_qty_cost   =   parseFloat(purchaseOrderitm.qty) * (qty_cost ? qty_cost : 0);
                                                                                    package_cost    =   parseFloat(package_cost) + parseFloat(item_qty_cost);
                                                                                    asn_cost        =   parseFloat(asn_cost) + parseFloat(item_qty_cost);
                                                                                    asn_qty         =   parseFloat(asn_qty) + parseFloat(purchaseOrderitm.qty);
                                                                                    asn_status      =   purchaseOrderitm.qtyStatus;

                                                                                    if (pack_skus.indexOf(purchaseOrderitm.sku) == -1)
                                                                                        pack_skus.push(purchaseOrderitm.sku);

                                                                                    CreateSKUstatusTran(purchaseOrder, purchaseOrderitm, skuasynccallback);
                                                                                    shipmentManger.checkitmequantitystatus(getjson({
                                                                                        poId: purchaseOrder.purchaseOrderNumber,
                                                                                        packageId: pckg_details.packageId,
                                                                                        asnId: purchaseOrder.purchaseOrderAsn.asnId,
                                                                                        sku: purchaseOrderitm.sku,
                                                                                        qtyStatus: purchaseOrderitm.qtyStatus,
                                                                                        itemForceClosedReasonCode: null,
                                                                                        itemOnHoldReasonCode: null,
                                                                                        qty: purchaseOrderitm.qty,
                                                                                        location: toLoc,
                                                                                        // skuCostAsn: purchaseOrderitm.skuCostAsn,
                                                                                        skuCost: qty_cost,
                                                                                        purPrices: purchaseOrderitm.purPrices,
                                                                                        // skuCostConfirm: purchaseOrderitm.skuCostConfirm,
                                                                                        totalProductTaxConfirm: purchaseOrderitm.totalProductTaxConfirm,
                                                                                        totalProductVatConfirm: purchaseOrderitm.totalProductVatConfirm,
                                                                                        totalProductCostConfirm: purchaseOrderitm.totalProductCostConfirm,
                                                                                        lineNumber: purchaseOrderitm.lineNumber,
                                                                                        reasonCode: purchaseOrderitm.reasonCode,
                                                                                    }), function(err, itmqty) {
                                                                                        if (err) {
                                                                                            // return rep.send({
                                                                                            //     error: err
                                                                                            // });
                                                                                            return result = error = err;
                                                                                        }

                                                                                        // purchase_order_item(y + 1);
                                                                                    }, CreateSKUstatusTran, purchaseOrder);
                                                                                });
                                                                            });
                                                                        });
                                                                    }, function(purchase_order_item) {
                                                                        shipmentManger.checkpoasnpackage(getjson({
                                                                            asnId: purchaseOrder.purchaseOrderAsn.asnId,
                                                                            packageId: pckg_details.packageId,
                                                                            packageCost: package_cost,
                                                                            numberOfSKU: pack_skus ? pack_skus.length : 0,
                                                                            user: user
                                                                        }), function(err, poasnpkgsuccess) {
                                                                            if (err) {
                                                                                console.log(err);
                                                                                return callback(err);
                                                                            }
                                                                            asynccallback();
                                                                        });
                                                                    });
                                                                    //     }
                                                                    // };
                                                                    // purchase_order_item(0);
                                                                } else {
                                                                    asynccallback();
                                                                }
                                                                // purchse_order_pkg(x + 1);
                                                            });
                                                        }, function(err, poasnpkgsuccess) {
                                                            shipmentManger.createpoasn( getjson({
                                                                asnId: body.purchaseOrder.purchaseOrderAsn.asnId,
                                                                poId: purchaseOrder.purchaseOrderNumber,
                                                                asnCost: asn_cost,
                                                                numberOfPackages: numberOfPackages,
                                                                asnQty: asn_qty,
                                                                asnStatus: asn_status,
                                                                user: user
                                                            }), function(err, poasnsucess) {
                                                                if (err) {
                                                                    return result = error = err;
                                                                }
                                                               

                                                            });
                                                            if (pushTranArr && pushTranArr.length) {
                                                                CreateTranService(pushTranArr, function(err, tranResult){
                                                                    if (err)
                                                                        console.log(err);
                                                                    purchasejson_callback();
                                                                });
                                                            }
                                                            else
                                                                purchasejson_callback();
                                                        });
                                                        // }
                                                        // };
                                                        // purchse_order_pkg(0);
                                                    } else if (!body.purchaseOrder.purchaseOrderAsn.hasOwnProperty('purchaseOrderPackage')) {
                                                        if (body.purchaseOrder.purchaseOrderAsn.hasOwnProperty('purchaseOrderItem')) {
                                                            var purchaseOrderitems = purchaseOrder.purchaseOrderAsn.purchaseOrderItem;
                                                            async.eachSeries(purchaseOrderitems, function(purchaseOrderitm, skuasynccallback) {
                                                                function GetItemUOM() {
                                                                    orderItem.getOrderItem({
                                                                        "purchaseordernumber": purchaseOrder.purchaseOrderNumber,
                                                                        "sku": purchaseOrderitm.sku
                                                                    }, function(err, itemdata) {
                                                                        if (err) {
                                                                            return result = error = err;
                                                                        }
                                                                        product_uom = itemdata.producUom
                                                                    });
                                                                }
                                                                po_item_quantity_statusModel.findOne({
                                                                    "poId": purchaseOrder.purchaseOrderNumber,
                                                                    'sku': purchaseOrderitm.sku,
                                                                    "qtyStatus": "submitted"
                                                                }, function(err, data) {
                                                                    var cost;

                                                                    if (checkPriceValue(purchaseOrderitm.purPrices))
                                                                        cost = purchaseOrderitm.purPrices[0].value;
                                                                    else if (checkPriceValue(purchaseOrderitm.skuCost))
                                                                        cost = purchaseOrderitm.skuCost;

                                                                    if (data && checkPriceValue(data.purPrices))
                                                                        cost = data.purPrices[0].value;
                                                                    else if (data && checkPriceValue(data.skuCost))
                                                                        cost = data.skuCost;

                                                                    po_item_quantity_statusModel.findOne({
                                                                        "poId": purchaseOrder.purchaseOrderNumber,
                                                                        "sku": purchaseOrderitm.sku,
                                                                        "qtyStatus": constant.status.CONFIRMED
                                                                    }).sort({
                                                                        'lastModified': -1
                                                                    }).exec(function(err, data) {
                                                                        po_item_quantity_statusModel.findOne({
                                                                            "poId": purchaseOrder.purchaseOrderNumber,
                                                                            "sku": purchaseOrderitm.sku,
                                                                            "qtyStatus": 'shipped'
                                                                        }).sort({
                                                                            'lastModified': -1
                                                                        }).exec(function(err, dataAsn) {
                                                                            var qty_cost;
                                                                            // var cost    =   purchaseOrderitm.purPrices[0].value;
                                                                            if ((checkPriceValue(purchaseOrderitm.purPrices))
                                                                                && (purchaseOrderitm.qtyStatus == constant.status.SHIPPED))
                                                                            {
                                                                                qty_cost = purchaseOrderitm.purPrices[0].value;
                                                                            } else if (dataAsn && checkPriceValue(dataAsn.purPrices)) {
                                                                                qty_cost = dataAsn.purPrices[0].value;
                                                                            } else if ((checkPriceValue(purchaseOrderitm.purPrices))
                                                                                && (constant.confirmingStatus.indexOf(purchaseOrderitm.qtyStatus) != -1))
                                                                            {
                                                                                qty_cost = purchaseOrderitm.purPrices[0].value;
                                                                            } else {
                                                                                if ( data && checkPriceValue(data.purPrices)) {
                                                                                    qty_cost = data.purPrices[0].value;
                                                                                } else {
                                                                                    qty_cost = cost;
                                                                                }
                                                                            }
                                                                            if (!checkPriceValue(qty_cost) && (priceObj[toLoc] && priceObj[toLoc][purchaseOrderitm.sku])) {
                                                                                qty_cost = priceObj[toLoc][purchaseOrderitm.sku].Cost;
                                                                            }
                                                                            purchaseOrderitm.skuCost = qty_cost;
                                                                            purchaseOrderitm.uom = product_uom ? product_uom : constant.stockUOM;
                                                                            CreateSKUstatusTran(purchaseOrder, purchaseOrderitm, skuasynccallback);
                                                                            shipmentManger.checkitmequantitystatus(getjson({
                                                                                poId: purchaseOrder.purchaseOrderNumber,
                                                                                packageId: null,
                                                                                asnId: purchaseOrder.purchaseOrderAsn.asnId,
                                                                                sku: purchaseOrderitm.sku,
                                                                                qtyStatus: purchaseOrderitm.qtyStatus,
                                                                                itemForceClosedReasonCode: null,
                                                                                itemOnHoldReasonCode: null,
                                                                                qty: purchaseOrderitm.qty,
                                                                                location: toLoc,
                                                                                // skuCostAsn: purchaseOrderitm.skuCostAsn,
                                                                                skuCost: qty_cost,
                                                                                purPrices: purchaseOrderitm.purPrices,
                                                                                // skuCostConfirm: purchaseOrderitm.skuCostConfirm,
                                                                                totalProductTaxConfirm: purchaseOrderitm.totalProductTaxConfirm,
                                                                                totalProductVatConfirm: purchaseOrderitm.totalProductVatConfirm,
                                                                                totalProductCostConfirm: purchaseOrderitm.totalProductCostConfirm,
                                                                                lineNumber: purchaseOrderitm.lineNumber,
                                                                                reasonCode: purchaseOrderitm.reasonCode,
                                                                            }), function(err, itmqty) {
                                                                                if (err) {
                                                                                    return result = error = err;
                                                                                }

                                                                                var item_qty_cost   =   parseFloat(purchaseOrderitm.qty) * (qty_cost ? qty_cost : 0);
                                                                                asn_cost            =   parseFloat(asn_cost) + parseFloat(item_qty_cost);
                                                                                asn_qty             =   parseFloat(asn_qty) + parseFloat(purchaseOrderitm.qty);

                                                                            }, CreateSKUstatusTran, purchaseOrder);
                                                                        });
                                                                    });
                                                                });
                                                            }, function(purchase_order_item) {
                                                                shipmentManger.createpoasn( getjson({
                                                                    asnId: body.purchaseOrder.purchaseOrderAsn.asnId,
                                                                    poId: purchaseOrder.purchaseOrderNumber,
                                                                    asnCost: asn_cost,
                                                                    user: user,
                                                                    numberOfPackages: numberOfPackages,
                                                                    asnQty: asn_qty
                                                                }), function(err, poasnsucess) {
                                                                    if (err) {
                                                                        return result = error = err;
                                                                    }
                                                                });
                                                                if (pushTranArr && pushTranArr.length) {
                                                                    CreateTranService(pushTranArr, function(err, tranResult){
                                                                        if (err)
                                                                            console.log(err);
                                                                        purchasejson_callback();
                                                                    });
                                                                }
                                                                else {
                                                                    purchasejson_callback();
                                                                    // asynccallback();
                                                                }
                                                            });
                                                        }
                                                    }
                                                });

                                            } else if (body.purchaseOrder.hasOwnProperty('purchaseOrderItem')) {
                                                purchaseOrder.purchaseOrderItem = body.purchaseOrder.purchaseOrderItem;
                                                var purchaseOrderitems = purchaseOrder.purchaseOrderItem;
                                                var product_uom = '';
                                                async.eachSeries(purchaseOrderitems, function(purchaseOrderitm, asynccallback) {
                                                    function skuupdate() {
                                                        shipmentManger.checkitmequantitystatus({
                                                            poId: purchaseOrder.purchaseOrderNumber,
                                                            sku: purchaseOrderitm.sku,
                                                            // packageId: purchaseOrder.package,
                                                            qtyStatus: purchaseOrderitm.qtyStatus,
                                                            itemForceClosedReasonCode: null,
                                                            itemOnHoldReasonCode: null,
                                                            qty: purchaseOrderitm.qty,
                                                            location: toLoc,
                                                            skuCost: purchaseOrderitm.skuCost,
                                                            purPrices: purchaseOrderitm.purPrices,
                                                            // skuCostConfirm: purchaseOrderitm.skuCostConfirm,
                                                            totalProductTaxConfirm: purchaseOrderitm.totalProductTaxConfirm,
                                                            totalProductVatConfirm: purchaseOrderitm.totalProductVatConfirm,
                                                            totalProductCostConfirm: purchaseOrderitm.totalProductCostConfirm,
                                                            // skuCostAsn: purchaseOrderitm.skuCostAsn,
                                                            totalProductTaxAsn: purchaseOrderitm.totalProductTaxAsn,
                                                            totalProductVatAsn: purchaseOrderitm.totalProductVatAsn,
                                                            totalProductCostAsn: purchaseOrderitm.totalProductCostAsn,
                                                            // lineNumber: purchaseOrderitm.lineNumber,
                                                            reasonCode: purchaseOrderitm.reasonCode,
                                                        }, function(err, itmqty) {
                                                            if (err) {
                                                                console.log(err); // console.log(Ordertype[purchaseOrder.purchaseOrderType][purchaseOrderitm.qtyStatus]);
                                                            }
                                                            asynccallback();
                                                            // purchase_order_item(y + 1);
                                                        }, CreateSKUstatusTran, purchaseOrder);
                                                    }

                                                    function GetItemUOM() {
                                                        orderItem.getOrderItem({
                                                            "purchaseordernumber": body.purchaseOrder.purchaseOrderNumber,
                                                            "sku": purchaseOrderitm.sku
                                                        }, function(err, itemdata) {
                                                            if (err) {
                                                                return result = error = err;
                                                            }
                                                            product_uom = itemdata.producUom;
                                                        });
                                                    }
                                                    po_item_quantity_statusModel.findOne({
                                                        "poId": purchaseOrder.purchaseOrderNumber,
                                                        "sku": purchaseOrderitm.sku,
                                                        "qtyStatus": constant.status.CONFIRMED
                                                            // "qtyStatus": "submitted"
                                                    }).sort({
                                                        'lastModified': -1
                                                    }).exec(function(err, data) {
                                                        po_item_quantity_statusModel.findOne({
                                                            "poId": purchaseOrder.purchaseOrderNumber,
                                                            "sku": purchaseOrderitm.sku,
                                                            "qtyStatus": 'shipped'
                                                        }).sort({
                                                            'lastModified': -1
                                                        }).exec(function(err, dataAsn) {
                                                            var qty_cost;
                                                            // var cost = purchaseOrderitm.skuCost;
                                                            var cost;
                                                            if (checkPriceValue(purchaseOrderitm.purPrices))
                                                                cost = purchaseOrderitm.purPrices[0].value;
                                                            else if (checkPriceValue(purchaseOrderitm.skuCost))
                                                                cost = purchaseOrderitm.skuCost;

                                                            if ((checkPriceValue(purchaseOrderitm.purPrices))
                                                                && (purchaseOrderitm.qtyStatus == constant.status.SHIPPED))
                                                            {
                                                                qty_cost = purchaseOrderitm.purPrices[0].value;
                                                            } else if (dataAsn && checkPriceValue(dataAsn.purPrices)) {
                                                                qty_cost = dataAsn.purPrices[0].value;
                                                            } else if ((checkPriceValue(purchaseOrderitm.purPrices))
                                                                && ( constant.confirmingStatus.indexOf(purchaseOrderitm.qtyStatus) != -1 ))
                                                            {
                                                                qty_cost = purchaseOrderitm.purPrices[0].value;
                                                            } else {
                                                                if (data && checkPriceValue(data.purPrices)) {
                                                                    qty_cost = data.purPrices[0].value;
                                                                } else {
                                                                    po_item_quantity_statusModel.findOne({
                                                                        "poId": purchaseOrder.purchaseOrderNumber,
                                                                        "sku": purchaseOrderitm.sku,
                                                                        "qtyStatus": constant.status.SUBMITTED
                                                                            // "qtyStatus": "submitted"
                                                                    }).sort({
                                                                        'lastModified': -1
                                                                    }).exec(function(err, sub_data) {
                                                                        if (sub_data && checkPriceValue(sub_data.purPrices)) {
                                                                            qty_cost = sub_data.purPrices[0].value;
                                                                        }
                                                                        else if (sub_data && checkPriceValue(sub_data.skuCost)) {
                                                                            qty_cost = sub_data.skuCost;
                                                                        } else {
                                                                            qty_cost = cost;
                                                                        }
                                                                    });
                                                                }
                                                            }

                                                            if (!checkPriceValue(qty_cost) && (priceObj[toLoc] && priceObj[toLoc][purchaseOrderitm.sku]))
                                                                qty_cost = priceObj[toLoc][purchaseOrderitm.sku].Cost;

                                                            purchaseOrderitm.skuCost = qty_cost;
                                                            purchaseOrderitm.uom = product_uom ? product_uom : constant.stockUOM;
                                                            
                                                            CreateSKUstatusTran(purchaseOrder, purchaseOrderitm, skuupdate);
                                                        });
                                                    });
                                                }, function(err) {
                                                    try{
                                                        if (pushTranArr && pushTranArr.length) {
                                                            CreateTranService(pushTranArr, function(err, tranResult){
                                                                if (err)
                                                                    console.log(err);
                                                                purchasejson_callback();
                                                            });
                                                        }
                                                        else {
                                                            async.forEach(tranData, function(tranArr, tran_callback){
                                                                CreateTranService(tranArr);
                                                                tran_callback();
                                                            },function(result,err){
                                                               console.log("Successfully");
                                                               purchasejson_callback();
                                                            });
                                                        }
                                                   }catch(e){
                                                        console.log('TranData Error:'  + e);
                                                        purchasejson_callback();

                                                   }
                                                    
                                                    //metohd calls if the iteration complete
                                                    // var result = {
                                                    //     status: constant.label.SUCCESS,
                                                    //     message: constant.label.PACKAGE_UPDATE
                                                    // }
                                                    // callback(null, result);
                                                    // purchasejson_callback();
                                                });
                                            }
                                        });
                                    } else {
                                        
                                        var createOrder = function(y) {
                                            return constant.createPurchaseOrderType.hasOwnProperty(y);
                                        }
                                        if (createOrder(body.purchaseOrder.purchaseOrderType) || createOrder(body.purchaseOrder.orderType)) {
                                            order_id = 0;
                                            if (body.purchaseOrder.hasOwnProperty('purchaseOrderItem')) {
                                                var purchaseOrder = body.purchaseOrder;
                                                var token;
                                                token = utils.uid(6);
                                                // if (body.purchaseOrder.hasOwnProperty('poType')) {
                                                //     purchaseOrder.purchaseOrderType = purchaseOrder.poType
                                                // }
                                                if (body.purchaseOrder.hasOwnProperty('orderType')) {
                                                    purchaseOrder.purchaseOrderType = purchaseOrder.orderType
                                                }
                                                if (body.purchaseOrder.hasOwnProperty('afs')) {
                                                    purchaseOrder.location = purchaseOrder.afs
                                                }
                                                if (purchaseOrder.purchaseOrderNumber == null) {
                                                    purchaseOrder.purchaseOrderNumber = token;
                                                }
                                                shipmentManger.createOrder(order_id, getjson({
                                                    location: purchaseOrder.location,
                                                    purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
                                                    purchaseOrderDate: purchaseOrder.purchaseOrderDate,
                                                    erpPurchaseOrder: purchaseOrder.erpPurchaseOrder,
                                                    purchaseOrderType: purchaseOrder.purchaseOrderType,
                                                    vendorId: purchaseOrder.vendorId,
                                                    erpNotes: purchaseOrder.erpNotes,
                                                    shipToLocation: purchaseOrder.shipToLocation,
                                                    markForLocation: purchaseOrder.markForLocation,
                                                    FromLocation: purchaseOrder.FromLocation,
                                                    toStreetName: purchaseOrder.toStreetName,
                                                    toStreetNumber: purchaseOrder.toStreetNumber,
                                                    toCity: purchaseOrder.toCity,
                                                    toPostalCode: purchaseOrder.toPostalCode,
                                                    toCountry: purchaseOrder.toCountry,
                                                    shippingMethod: constant.shippingMethod,
                                                    vendorId: constant.vendor,
                                                    billTo: purchaseOrder.location,
                                                    numberOfSKU: purchaseOrder.numberOfSKU,
                                                    orderStatus: constant.status.INPROGRESS,
                                                    user: user,
                                                    totalPoTaxConfirm: purchaseOrder.totalPoTaxConfirm,
                                                    totalPoVATConfirm: purchaseOrder.totalPoVATConfirm,
                                                    PoSubtotalConfirm: purchaseOrder.PoSubtotalConfirm,
                                                    totalPoCostConfirm: purchaseOrder.totalPoCostConfirm,
                                                    totalPoTaxAsn: purchaseOrder.totalPoTaxAsn,
                                                    totalPoVATAsn: purchaseOrder.totalPoVATAsn,
                                                    PoSubtotalAsn: purchaseOrder.PoSubtotalAsn,
                                                    totalPoCostAsn: purchaseOrder.totalPoCostAsn
                                                }), function(err, order) {
                                                    if (err) {
                                                        // return rep.end({
                                                        //     result: err,
                                                        //     error: err
                                                        // });

                                                        return result = error = err;
                                                    }
                                                    order_id = order._id;
                                                    purchaseOrder = order;
                                                    var toLoc;
                                                    if (purchaseOrder.markForLocation) {
                                                        toLoc = purchaseOrder.markForLocation;
                                                    } else {
                                                        toLoc = purchaseOrder.shipToLocation;
                                                    }
                                                    if (body.purchaseOrder.hasOwnProperty('purchaseOrderItem')) {
                                                        var purchaseOrderitems = body.purchaseOrder.purchaseOrderItem;
                                                        var PoSubtotal = "0";
                                                        var totalPoCost = "0";
                                                        var totalPoVAT = "0";
                                                        var totalPoTax = "0";
                                                        var totalorder = 0;
                                                        var totalProducts = 0;
                                                        var Pototal = function(y, x) {
                                                            console.log('y' + y);
                                                            var totalPo = parseFloat(PoSubtotal) + parseFloat(totalPoTax);
                                                            totalPoCost = parseFloat(totalPo).toFixed(2);
                                                            totalPoTax = getfloat(totalPoTax);
                                                            totalPoVAT = getfloat(totalPoVAT);
                                                            PoSubtotal = getfloat(PoSubtotal);
                                                            shipmentManger.createOrder(order_id, {
                                                                PoSubtotal: PoSubtotal,
                                                                totalPoCost: totalPoCost,
                                                                totalPoVAT: totalPoVAT,
                                                                totalPoTax: totalPoTax,
                                                                user: user,
                                                                numberOfProducts: totalProducts,
                                                            }, function(err, order) {
                                                                if (err) {
                                                                    // return rep.end({
                                                                    //     result: err,
                                                                    //     error: err
                                                                    // });
                                                                    return result = error = err;
                                                                }
                                                                x(y);
                                                                if (y == purchaseOrderitems.length) {
                                                                    // return rep.end({
                                                                    //     result: 'Successfully Completed',
                                                                    //     error: err
                                                                    // });
                                                                    result = 'Successfully Completed';
                                                                    return error = err;
                                                                }
                                                            });
                                                        };
                                                        var purchase_order_item = function(y) {
                                                            if (y < purchaseOrderitems.length) {
                                                                var totalProductCost = 0;
                                                                var totalProductTax = 0;
                                                                var totalProductVat = 0;
                                                                var productCost = 0;
                                                                var Vat = 0;
                                                                var productTax = 0;
                                                                var productVat = 0;
                                                                var purchaseOrderitm = purchaseOrderitems[y];
                                                                var createqty = function() {
                                                                    // request(env_config.dashPath + constant.apis.GETPRODUCTCOST + '?sku=' + purchaseOrderitm.sku + '&loc=' + purchaseOrder.location, function(err, productCostObj) {
                                                                        request(env_config.dashPath + constant.apis.SRCHPRODUCT + purchaseOrderitm.sku, function(err, productObj) {
                                                                            // if (productCostObj.hasOwnProperty('body')) {
                                                                                var product = JSON.parse(productObj['body']);
                                                                                if (product[0]) {
                                                                                    product = product[0].ProductTbl;
                                                                                    // var dataArr = JSON.parse(productCostObj['body']);
                                                                                    var data    =   null;
                                                                                    if (priceObj[purchaseOrder.location] && priceObj[purchaseOrder.location][purchaseOrderitm.sku]) {
                                                                                        data = priceObj[purchaseOrder.location][purchaseOrderitm.sku];
                                                                                    }
                                                                                    if (data) {
                                                                                        Vat = data['isVAT'];

                                                                                        if ( (purchaseOrderitm.purPrices) && (purchaseOrderitm.purPrices[0]) ) {
                                                                                            productCost =   purchaseOrderitm.purPrices[0].value;  
                                                                                        }
                                                                                        else {
                                                                                            productCost =   parseFloat(data['Cost']).toFixed(2);
                                                                                        }
                                                                                        
                                                                                        if (data['isVAT'] == "0") {
                                                                                            productTax = data['percentage'];
                                                                                            totalProductCost = totalProductCost + parseFloat(productCost);
                                                                                            totalProductCost = getfloat(totalProductCost);
                                                                                            totalProductTax = parseFloat(totalProductCost) * parseFloat(productTax / 100);
                                                                                            totalProductTax = getfloat(totalProductTax);
                                                                                        }
                                                                                        if (data['isVAT'] == "1") {
                                                                                            productVat = data['percentage'];
                                                                                            totalProductCost = totalProductCost + parseFloat(productCost);
                                                                                            totalProductCost = getfloat(totalProductCost);
                                                                                            totalProductVat = parseFloat(totalProductCost) * parseFloat(productVat / 100);
                                                                                            totalProductVat = getfloat(totalProductVat);
                                                                                        }
                                                                                    }
                                                                                    PoSubtotal = parseFloat(PoSubtotal) + parseFloat(purchaseOrderitm.qty) * parseFloat(totalProductCost);
                                                                                    console.log('Subtotal' + PoSubtotal);
                                                                                    totalPoVAT = parseFloat(totalPoVAT) + parseFloat(totalProductVat);
                                                                                    totalPoTax = parseFloat(totalPoTax) + parseFloat(totalProductTax);
                                                                                    console.log('totalProducts' + (parseFloat(totalProducts) + parseFloat(purchaseOrderitm.qty)));
                                                                                    totalProducts = parseFloat(totalProducts) + parseFloat(purchaseOrderitm.qty);
                                                                                    console.log('y + 1' + y + 1);
                                                                                    Pototal(y + 1, function(y) {
                                                                                        purchase_order_item(y);
                                                                                    });
                                                                                    orderItem.createOrderItem(getjson({
                                                                                        purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
                                                                                        SKU: purchaseOrderitm.sku,
                                                                                        productName: product.name,
                                                                                        shipToLocation: purchaseOrder.location,
                                                                                        producUom: constant.stockUOM,
                                                                                        length: purchaseOrderitm.length,
                                                                                        waist: purchaseOrderitm.waist,
                                                                                        size: purchaseOrderitm.size,
                                                                                        styleColor: purchaseOrderitm.styleColor,
                                                                                        productCost: productCost,
                                                                                        productTax: productTax,
                                                                                        productVat: productVat,
                                                                                        isVat: Vat,
                                                                                        purPrices: purchaseOrderitm.purPrices,
                                                                                        lineNumber: purchaseOrderitm.lineNumber,
                                                                                        totalProductCost: totalProductCost,
                                                                                        totalProductTax: totalProductTax,
                                                                                        totalProductVat: totalProductVat,
                                                                                        qty: purchaseOrderitm.qty,
                                                                                        user: user
                                                                                    }), input.params.headers, function(err, itmqty) {
                                                                                        if (err) {
                                                                                            return console.log(err);
                                                                                        }
                                                                                        // purchase_order_item(y + 1);
                                                                                        // shipmentManger.checkitmequantitystatus({
                                                                                        //     poId: purchaseOrder.purchaseOrderNumber,
                                                                                        //     packageId: null,
                                                                                        //     sku: purchaseOrderitm.sku,
                                                                                        //     qtyStatus: "submitted",
                                                                                        //     itemForceClosedReasonCode: null,
                                                                                        //     itemOnHoldReasonCode: null,
                                                                                        // }, function(err, data) {
                                                                                        //     if (err) {
                                                                                        //         return rep.send({
                                                                                        //             error: err
                                                                                        //         });
                                                                                        //     }
                                                                                        //     var new_qty = parseInt(purchaseOrderitm.qty) + parseInt(data.qty ? data.qty : 0);
                                                                                        //     var cost = totalProductCost + parseFloat(data.skuCost ? data.skuCost : 0);
                                                                                        //     cost = cost.toString();
                                                                                        //     // var purchaseOrderqty = po_item_quantity_statusModel.findOne({
                                                                                        //     //     "poId": purchaseOrder.purchaseOrderNumber,
                                                                                        //     //     "sku": purchaseOrderitm.sku,
                                                                                        //     //     "qtyStatus": "submitted"
                                                                                        //     // });
                                                                                        //     // purchaseOrderqty.update({
                                                                                        //     //     qty: new_qty,
                                                                                        //     //     skuCost: cost
                                                                                        //     // }, function(err, data) {
                                                                                        //     //     if (err) {
                                                                                        //     //         console.log(err);
                                                                                        //     //     }
                                                                                        //     // });
                                                                                        //     // console.log("Bipin Cost");
                                                                                        //     // console.log(cost); , function(err, data) {
                                                                                        //     // var cost;
                                                                                        //     // console.log("Bipin Data");`
                                                                                        //     // console.log(data);
                                                                                        //     //     if (data) {
                                                                                        //     //         cost = data.skuCost;
                                                                                        //     //         totalProductCost = data.skuCost;
                                                                                        //     //     }
                                                                                        //     // }
                                                                                        // });
                                                                                        orderItem.getOrderItem({
                                                                                            purchaseordernumber: purchaseOrder.purchaseOrderNumber
                                                                                        }, function(err, itemData) {
                                                                                            if (err) {
                                                                                                // return rep.end({
                                                                                                //     result: err,
                                                                                                //     error: err
                                                                                                // });
                                                                                                return result = error = err;
                                                                                            }
                                                                                            shipmentManger.createOrder(order_id, {
                                                                                                user: user,
                                                                                                numberOfSKU: itemData.length
                                                                                            }, function(err, updatedOrder) {
                                                                                                if (err) {
                                                                                                    // return rep.end({
                                                                                                    //     result: err,
                                                                                                    //     error: err
                                                                                                    // });
                                                                                                    return result = error = err;
                                                                                                }
                                                                                                if (purchaseOrderitm.qty) {
                                                                                                    function skuupdate() {
                                                                                                        shipmentManger.checkitmequantitystatus({
                                                                                                            poId: purchaseOrder.purchaseOrderNumber,
                                                                                                            sku: purchaseOrderitm.sku,
                                                                                                            // packageId: purchaseOrder.package,
                                                                                                            lineNumber: purchaseOrderitm.lineNumber,
                                                                                                            qtyStatus: purchaseOrderitm.qtyStatus,
                                                                                                            itemForceClosedReasonCode: null,
                                                                                                            itemOnHoldReasonCode: null,
                                                                                                            qty: purchaseOrderitm.qty,
                                                                                                            location: toLoc,
                                                                                                            purPrices: purchaseOrderitm.purPrices,
                                                                                                            skuCostAsn: purchaseOrderitm.skuCostAsn,
                                                                                                            skuCost: totalProductCost,
                                                                                                            skuCostConfirm: purchaseOrderitm.skuCostConfirm,
                                                                                                            totalProductTaxConfirm: purchaseOrderitm.totalProductTaxConfirm,
                                                                                                            totalProductVatConfirm: purchaseOrderitm.totalProductVatConfirm,
                                                                                                            totalProductCostConfirm: purchaseOrderitm.totalProductCostConfirm,
                                                                                                            reasonCode: purchaseOrderitm.reasonCode,
                                                                                                        }, function(err, itmqty) {
                                                                                                            if (err) {
                                                                                                                console.log(err); // console.log(Ordertype[purchaseOrder.purchaseOrderType][purchaseOrderitm.qtyStatus]);
                                                                                                            }
                                                                                                            // asynccallback();
                                                                                                            // purchase_order_item(y + 1);
                                                                                                        }, CreateSKUstatusTran, purchaseOrder);
                                                                                                    }
                                                                                                    po_item_quantity_statusModel.findOne({
                                                                                                        "poId": purchaseOrder.purchaseOrderNumber,
                                                                                                        "sku": purchaseOrderitm.sku,
                                                                                                        "qtyStatus": constant.status.CONFIRMED
                                                                                                            // "qtyStatus": "submitted"
                                                                                                    }).sort({
                                                                                                        'lastModified': -1
                                                                                                    }).exec(function(err, data) {
                                                                                                        po_item_quantity_statusModel.findOne({
                                                                                                            "poId": purchaseOrder.purchaseOrderNumber,
                                                                                                            "sku": purchaseOrderitm.sku,
                                                                                                            "qtyStatus": 'shipped'
                                                                                                        }).sort({
                                                                                                            'lastModified': -1
                                                                                                        }).exec(function(err, dataAsn) {
                                                                                                            var qty_cost;
                                                                                                            var cost = productCost;
                                                                                                            if ((purchaseOrderitm.purPrices) && (purchaseOrderitm.purPrices[0]) && (purchaseOrderitm.qtyStatus == constant.status.SHIPPED)) {
                                                                                                                qty_cost = purchaseOrderitm.purPrices[0].value;
                                                                                                            } else if (dataAsn && dataAsn.purPrices && dataAsn.purPrices[0]) {
                                                                                                                qty_cost = dataAsn.purPrices[0].value;
                                                                                                            } else if ((purchaseOrderitm.purPrices) && (purchaseOrderitm.purPrices[0]) && ( constant.confirmingStatus.indexOf(purchaseOrderitm.qtyStatus) != -1 )) {
                                                                                                                qty_cost = purchaseOrderitm.purPrices[0].value;
                                                                                                            } else {
                                                                                                                if (data && data.purPrices && data.purPrices[0]) {
                                                                                                                    qty_cost = data.purPrices[0].value;
                                                                                                                } else {
                                                                                                                    po_item_quantity_statusModel.findOne({
                                                                                                                        "poId": purchaseOrder.purchaseOrderNumber,
                                                                                                                        "sku": purchaseOrderitm.sku,
                                                                                                                        "qtyStatus": constant.status.SUBMITTED
                                                                                                                            // "qtyStatus": "submitted"
                                                                                                                    }).sort({
                                                                                                                        'lastModified': -1
                                                                                                                    }).exec(function(err, sub_data) {
                                                                                                                        if (sub_data && sub_data.purPrices && sub_data.purPrices[0]) {
                                                                                                                            qty_cost = sub_data.purPrices[0].value;
                                                                                                                        }
                                                                                                                        else if (sub_data && sub_data.skuCost) {
                                                                                                                            qty_cost = sub_data.skuCost;
                                                                                                                        } else {
                                                                                                                            qty_cost = cost;
                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                            }
                                                                                                            purchaseOrderitm.skuCost = qty_cost;
                                                                                                            purchaseOrderitm.uom = constant.stockUOM;
                                                                                                            CreateSKUstatusTran(purchaseOrder, purchaseOrderitm, skuupdate);
                                                                                                        });
                                                                                                    });
                                                                                                }
                                                                                            });
                                                                                        });
                                                                                    });
                                                                                }
                                                                            // }
                                                                        });
                                                                    // });
                                                                };
                                                                createqty();
                                                            }if(y == purchaseOrderitems.length){
                                                                purchasejson_callback();
                                                            }
                                                            // shipmentManger.checkitmequantitystatus({
                                                            //     poId: purchaseOrder.purchaseOrderNumber,
                                                            //     sku: purchaseOrderitm.sku,
                                                            //     // packageId: purchaseOrder.package,
                                                            //     qtyStatus: purchaseOrderitm.qtyStatus,
                                                            //     itemForceClosedReasonCode: null,
                                                            //     itemOnHoldReasonCode: null,
                                                            //     qty: purchaseOrderitm.qty,
                                                            //     skuCost: purchaseOrderitm.skuCost
                                                            // }, function(err, itmqty) {
                                                            //     if (err) {
                                                            //         return rep.end({
                                                            //             result: err,
                                                            //             error: err
                                                            //         });
                                                            //     }
                                                            //     purchase_order_item(y + 1);
                                                            // });
                                                        };
                                                        purchase_order_item(0);
                                                    }
                                                });
                                            } else if (body.purchaseOrder.hasOwnProperty('purchaseOrderAsn')) {
                                                var purchaseOrder = body.purchaseOrder;
                                                var token;
                                                token = utils.uid(6);
                                                // if (body.purchaseOrder.hasOwnProperty('poType')) {
                                                //     purchaseOrder.purchaseOrderType = purchaseOrder.poType
                                                // }
                                                if (body.purchaseOrder.hasOwnProperty('orderType')) {
                                                    purchaseOrder.purchaseOrderType = purchaseOrder.orderType
                                                }
                                                if (body.purchaseOrder.hasOwnProperty('afs')) {
                                                    purchaseOrder.location = purchaseOrder.afs
                                                }
                                                purchaseOrder.purchaseOrderNumber = token;
                                                shipmentManger.createOrder(order_id, getjson({
                                                    location: purchaseOrder.location,
                                                    purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
                                                    purchaseOrderDate: purchaseOrder.purchaseOrderDate,
                                                    erpPurchaseOrder: purchaseOrder.erpPurchaseOrder,
                                                    purchaseOrderType: purchaseOrder.purchaseOrderType,
                                                    vendorId: purchaseOrder.vendorId,
                                                    erpNotes: purchaseOrder.erpNotes,
                                                    shipToLocation: purchaseOrder.shipToLocation,
                                                    markForLocation: purchaseOrder.markForLocation,
                                                    toStreetName: purchaseOrder.toStreetName,
                                                    toStreetNumber: purchaseOrder.toStreetNumber,
                                                    toCity: purchaseOrder.toCity,
                                                    toPostalCode: purchaseOrder.toPostalCode,
                                                    toCountry: purchaseOrder.toCountry,
                                                    shippingMethod: constant.shippingMethod,
                                                    vendorId: constant.vendor,
                                                    billTo: purchaseOrder.location,
                                                    numberOfSKU: purchaseOrder.numberOfSKU,
                                                    orderStatus: constant.status.INPROGRESS,
                                                    user: user,
                                                    totalPoTaxConfirm: purchaseOrder.totalPoTaxConfirm,
                                                    totalPoVATConfirm: purchaseOrder.totalPoVATConfirm,
                                                    PoSubtotalConfirm: purchaseOrder.PoSubtotalConfirm,
                                                    totalPoCostConfirm: purchaseOrder.totalPoCostConfirm,
                                                    totalPoTaxAsn: purchaseOrder.totalPoTaxAsn,
                                                    totalPoVATAsn: purchaseOrder.totalPoVATAsn,
                                                    PoSubtotalAsn: purchaseOrder.PoSubtotalAsn,
                                                    totalPoCostAsn: purchaseOrder.totalPoCostAsn
                                                }), function(err, order) {
                                                    if (err) {
                                                        // return rep.end({
                                                        //     result: err,
                                                        //     error: err
                                                        // });
                                                        return result = error = err;
                                                    }
                                                    order_id = order._id;
                                                    purchaseOrder = order;
                                                    var toLoc;
                                                    if (purchaseOrder.markForLocation) {
                                                        toLoc = purchaseOrder.markForLocation;
                                                    } else {
                                                        toLoc = purchaseOrder.shipToLocation;
                                                    }
                                                    // var purchaseOrderType = body.purchaseOrder.poType;
                                                    // if (body.purchaseOrder.hasOwnProperty('poType')) {
                                                    //     var purchaseOrderType  = body.purchaseOrder.poType
                                                    // }
                                                    if (body.purchaseOrder.hasOwnProperty('orderType')) {
                                                        var purchaseOrderType  = body.purchaseOrder.orderType
                                                    }
                                                    if (body.purchaseOrder.hasOwnProperty('purchaseOrderAsn')) {
                                                        purchaseOrder.purchaseOrderAsn = body.purchaseOrder.purchaseOrderAsn;

                                                        var asn_status = purchaseOrder.purchaseOrderAsn.asnStatus ? purchaseOrder.purchaseOrderAsn.asnStatus : constant.orderStatus.SHIPPED;

                                                        var numberOfPackages    =   0;
                                                        var asn_qty             =   0;
                                                        var asn_cost            =   0;

                                                        shipmentManger.createpoasn( getjson({
                                                            poId: purchaseOrder.purchaseOrderNumber,
                                                            asnId: purchaseOrder.purchaseOrderAsn.asnId,
                                                            asnDate: purchaseOrder.purchaseOrderAsn.asnDate,
                                                            billOfLadingId: body.purchaseOrder.purchaseOrderAsn.billOfLadingId,
                                                            asnStatus: asn_status,
                                                            shipDate: purchaseOrder.purchaseOrderAsn.shipDate,
                                                            wayBillnumber: null,
                                                            invoiceNumber: null,
                                                            user: user
                                                        }), function(err, poasnsucess) {
                                                            if (err) {
                                                                // return res.end({
                                                                //     result: err,
                                                                //     error: err
                                                                // });
                                                                return result = error = err;
                                                            }
                                                            if (body.purchaseOrder.purchaseOrderAsn.hasOwnProperty('purchaseOrderPackage')) {
                                                                var purchaseOrderPackage = body.purchaseOrder.purchaseOrderAsn.purchaseOrderPackage;
                                                                var numberOfSKU     =   0;
                                                                var package_cost     =   0;
                                                                var purchse_order_pkg = function(x) {
                                                                    if (x < purchaseOrderPackage.length) {
                                                                        var pckg_details = purchaseOrderPackage[x];
                                                                        shipmentManger.checkpoasnpackage(getjson({
                                                                            asnId: body.purchaseOrder.purchaseOrderAsn.asnId,
                                                                            packageId: pckg_details.packageId,
                                                                            // userId: user.clientId,
                                                                            packageBarCode: null,
                                                                            trackingNumber: pckg_details.trackingNumber,
                                                                            packageStatus: pckg_details.packageStatus,
                                                                            shipDate: pckg_details.shipDate,
                                                                            expectedDeliveryDate: pckg_details.expectedDeliveryDate,
                                                                            fromLocation: pckg_details.fromLocation,
                                                                            fromStreetName: pckg_details.fromStreetName,
                                                                            fromStreetNumber: pckg_details.fromStreetNumber,
                                                                            fromCity: pckg_details.fromCity,
                                                                            fromPostalCode: pckg_details.fromPostalCode,
                                                                            fromCountry: pckg_details.fromCountry,
                                                                            toLocation: pckg_details.shipToLocation,
                                                                            toStreetName: pckg_details.toStreetName,
                                                                            toStreetNumber: pckg_details.toStreetNumber,
                                                                            toCity: pckg_details.toCity,
                                                                            toPostalCode: pckg_details.toPostalCode,
                                                                            toCountry: pckg_details.toCountry,
                                                                            toPhoneNumber: null,
                                                                            receivedDate: null,
                                                                            user: user
                                                                        }), function(err, poasnpkgsuccess) {
                                                                            if (err) {
                                                                                // return rep.send({
                                                                                //     error: err
                                                                                // });
                                                                                return result = error = err;
                                                                            }
                                                                            if (pckg_details.hasOwnProperty('purchaseOrderItem')) {
                                                                                var purchaseOrderitems = pckg_details.purchaseOrderItem;
                                                                                var PoSubtotal = "0";
                                                                                var totalPoCost = "0";
                                                                                var totalPoVAT = "0";
                                                                                var totalPoTax = "0";
                                                                                var totalorder = 0;
                                                                                var totalProducts = 0;
                                                                                var purchasetotalProduct = 0;
                                                                                var pack_skus = [];
                                                                                var Pototal = function(total, x) {
                                                                                    console.log('cOrder');
                                                                                    console.log('y' + total);
                                                                                    console.log('cOrder');
                                                                                    // console.log('y' + total);
                                                                                    shipmentManger.checkOrder(purchaseOrder.purchaseOrderNumber, function(err, order) {
                                                                                        // var totalPo = parseFloat(order.totalPoCost ? order.totalPoCost : 0) + parseFloat(PoSubtotal) + parseFloat(totalPoTax);
                                                                                        // totalPoCost = parseFloat(totalPo).toFixed(2);
                                                                                        totalPoTax = parseFloat(totalPoTax);
                                                                                        totalPoVAT = parseFloat(totalPoVAT);
                                                                                        PoSubtotal = parseFloat(PoSubtotal);
                                                                                        totalProducts = parseFloat(totalProducts);
                                                                                        var totalPo = PoSubtotal + totalPoTax;
                                                                                        totalPoCost = parseFloat(totalPo).toFixed(2);
                                                                                        var noOfSKU = purchaseOrderitems.length;
                                                                                        shipmentManger.createOrder(order_id, {
                                                                                            PoSubtotal: PoSubtotal,
                                                                                            totalPoCost: totalPoCost,
                                                                                            totalPoVAT: totalPoVAT,
                                                                                            totalPoTax: totalPoTax,
                                                                                            user: user,
                                                                                            numberOfProducts: totalProducts,
                                                                                            numberOfSKU: noOfSKU
                                                                                        }, function(err, order) {
                                                                                            if (err) {
                                                                                                // return rep.end({
                                                                                                //     result: err,
                                                                                                //     error: err
                                                                                                return result = error = err;
                                                                                            }
                                                                                            // x(total);
                                                                                            if (total == purchaseOrderitems.length) {
                                                                                                /*rep.end({
                                                                                                            result: 'Successfully Completed',
                                                                                                            error: err
                                                                                                        });*/
                                                                                            } else {
                                                                                                x(total);
                                                                                            }
                                                                                        });
                                                                                    });
                                                                                };
                                                                                var purchase_order_item = function(y) {
                                                                                    if (y < purchaseOrderitems.length) {
                                                                                        var totalProductCost = 0;
                                                                                        var totalProductTax = 0;
                                                                                        var totalProductVat = 0;
                                                                                        var productCost = 0;
                                                                                        var Vat = 0;
                                                                                        var productTax = 0;
                                                                                        var productVat = 0;
                                                                                        var purchaseOrderitm = purchaseOrderitems[y];
                                                                                        var createqty = function() {
                                                                                            // request(env_config.dashPath + constant.apis.GETPRODUCTCOST + '?sku=' + purchaseOrderitm.sku + '&loc=' + purchaseOrder.location, function(err, productCostObj) {
                                                                                                request(env_config.dashPath + constant.apis.SRCHPRODUCT + purchaseOrderitm.sku, function(err, productObj) {
                                                                                                    console.log('SRCHPRODUCT ', env_config.dashPath + constant.apis.SRCHPRODUCT + purchaseOrderitm.sku, productObj['body']);
                                                                                                    // console.log('GETPRODUCTCOST ', env_config.dashPath + constant.apis.GETPRODUCTCOST + '?sku=' + purchaseOrderitm.sku + '&loc=' + purchaseOrder.location, productCostObj['body']);
                                                                                                    if (productObj['body'] != undefined) {
                                                                                                        var product = JSON.parse(productObj['body']);
                                                                                                        if (product.length >= 1) {
                                                                                                            // if (productCostObj.hasOwnProperty('body')) {
                                                                                                                var product = JSON.parse(productObj['body']);
                                                                                                                product = product[0].ProductTbl;
                                                                                                                var data = null;
                                                                                                                if (priceObj[purchaseOrder.location] && priceObj[purchaseOrder.location][purchaseOrderitm.sku]) {
                                                                                                                    data = priceObj[purchaseOrder.location][purchaseOrderitm.sku];
                                                                                                                }
                                                                                                                if (data) {
                                                                                                                    Vat = data['isVAT'];
                                                                                                                    productCost = parseFloat(data['Cost']).toFixed(2);
                                                                                                                    purchaseOrderitm.skuCost = productCost;
                                                                                                                    if (data['isVAT'] == "0") {
                                                                                                                        productTax = data['percentage'];
                                                                                                                        totalProductCost = totalProductCost + parseFloat(purchaseOrderitm.qty) * parseFloat(productCost);
                                                                                                                        totalProductCost = getfloat(totalProductCost);
                                                                                                                        totalProductTax = parseFloat(totalProductCost) * parseFloat(productTax / 100);
                                                                                                                        totalProductTax = getfloat(totalProductTax);
                                                                                                                    }
                                                                                                                    if (data['isVAT'] == "1") {
                                                                                                                        productVat = data['percentage'];
                                                                                                                        totalProductCost = totalProductCost + parseFloat(purchaseOrderitm.qty) * parseFloat(productCost);
                                                                                                                        totalProductCost = getfloat(totalProductCost);
                                                                                                                        totalProductVat = parseFloat(totalProductCost) * parseFloat(productVat / 100);
                                                                                                                        totalProductVat = getfloat(totalProductVat);
                                                                                                                    }
                                                                                                                }
                                                                                                                PoSubtotal = parseFloat(PoSubtotal) + parseFloat(totalProductCost);
                                                                                                                console.log('Subtotal' + PoSubtotal);
                                                                                                                totalPoVAT = parseFloat(totalPoVAT) + parseFloat(totalProductVat);
                                                                                                                totalPoTax = parseFloat(totalPoTax) + parseFloat(totalProductTax);
                                                                                                                console.log('totalProducts' + (parseFloat(totalProducts) + parseFloat(purchaseOrderitm.qty)));
                                                                                                                totalProducts = parseFloat(totalProducts) + parseFloat(purchaseOrderitm.qty);
                                                                                                                console.log('y + 1' + y + 1);
                                                                                                                Pototal(y + 1, function(y) {
                                                                                                                    purchase_order_item(y);
                                                                                                                });
                                                                                                                // purchase_order_item(y + 1);
                                                                                                                orderItem.createOrderItem(getjson({
                                                                                                                    purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
                                                                                                                    SKU: purchaseOrderitm.sku,
                                                                                                                    productName: product.name,
                                                                                                                    shipToLocation: purchaseOrder.location,
                                                                                                                    producUom: constant.stockUOM,
                                                                                                                    length: purchaseOrderitm.length,
                                                                                                                    waist: purchaseOrderitm.waist,
                                                                                                                    size: purchaseOrderitm.size,
                                                                                                                    styleColor: purchaseOrderitm.styleColor,
                                                                                                                    productCost: productCost,
                                                                                                                    productTax: productTax,
                                                                                                                    productVat: productVat,
                                                                                                                    isVat: Vat,
                                                                                                                    purPrices: purchaseOrderitm.purPrices,
                                                                                                                    lineNumber: purchaseOrderitm.lineNumber,
                                                                                                                    totalProductCost: totalProductCost,
                                                                                                                    totalProductTax: totalProductTax,
                                                                                                                    totalProductVat: totalProductVat,
                                                                                                                    qty: purchaseOrderitm.qty,
                                                                                                                    user: user
                                                                                                                }), input.params.headers, function(err, itmqty) {
                                                                                                                    if (err) {
                                                                                                                        return console.log(err);
                                                                                                                    }
                                                                                                                    if (purchaseOrderitm.qty) {
                                                                                                                        function skuupdate() {
                                                                                                                            shipmentManger.checkitmequantitystatus({
                                                                                                                                poId: purchaseOrder.purchaseOrderNumber,
                                                                                                                                sku: purchaseOrderitm.sku,
                                                                                                                                packageId: pckg_details.packageId,
                                                                                                                                asnId: purchaseOrder.purchaseOrderAsn.asnId,
                                                                                                                                qtyStatus: purchaseOrderitm.qtyStatus,
                                                                                                                                itemForceClosedReasonCode: null,
                                                                                                                                itemOnHoldReasonCode: null,
                                                                                                                                location: toLoc,
                                                                                                                                qty: purchaseOrderitm.qty,
                                                                                                                                lineNumber: purchaseOrderitm.lineNumber,
                                                                                                                                skuCost: productCost,
                                                                                                                                purPrices: purchaseOrderitm.purPrices,
                                                                                                                                skuCostAsn: purchaseOrderitm.skuCostAsn,
                                                                                                                                skuCostConfirm: purchaseOrderitm.skuCostConfirm,
                                                                                                                                totalProductTaxConfirm: purchaseOrderitm.totalProductTaxConfirm,
                                                                                                                                totalProductVatConfirm: purchaseOrderitm.totalProductVatConfirm,
                                                                                                                                totalProductCostConfirm: purchaseOrderitm.totalProductCostConfirm,
                                                                                                                                reasonCode: purchaseOrderitm.reasonCode,
                                                                                                                            }, function(err, itmqty) {
                                                                                                                                if (err) {
                                                                                                                                    console.log(err); // console.log(Ordertype[purchaseOrder.purchaseOrderType][purchaseOrderitm.qtyStatus]);
                                                                                                                                }
                                                                                                                                // purchase_order_item(y + 1);
                                                                                                                            }, CreateSKUstatusTran, purchaseOrder);
                                                                                                                        }
                                                                                                                        po_item_quantity_statusModel.findOne({
                                                                                                                            "poId": purchaseOrder.purchaseOrderNumber,
                                                                                                                            "sku": purchaseOrderitm.sku,
                                                                                                                            "qtyStatus": constant.status.CONFIRMED
                                                                                                                                // "qtyStatus": "submitted"
                                                                                                                        }).sort({
                                                                                                                            'lastModified': -1
                                                                                                                        }).exec(function(err, data) {
                                                                                                                            po_item_quantity_statusModel.findOne({
                                                                                                                                "poId": purchaseOrder.purchaseOrderNumber,
                                                                                                                                "sku": purchaseOrderitm.sku,
                                                                                                                                "qtyStatus": 'shipped'
                                                                                                                            }).sort({
                                                                                                                                'lastModified': -1
                                                                                                                            }).exec(function(err, dataAsn) {
                                                                                                                                var qty_cost;
                                                                                                                                var cost = productCost;
                                                                                                                                if ((purchaseOrderitm.purPrices) && (purchaseOrderitm.purPrices[0]) && (purchaseOrderitm.qtyStatus == constant.status.SHIPPED)) {
                                                                                                                                    qty_cost = purchaseOrderitm.purPrices[0].value;
                                                                                                                                } else if (dataAsn && dataAsn.purPrices && dataAsn.purPrices[0]) {
                                                                                                                                    qty_cost = dataAsn.purPrices[0].value;
                                                                                                                                } else if ((purchaseOrderitm.purPrices) && (purchaseOrderitm.purPrices[0]) && ( constant.confirmingStatus.indexOf(purchaseOrderitm.qtyStatus) != -1 )) {
                                                                                                                                    qty_cost = purchaseOrderitm.purPrices[0].value;
                                                                                                                                } else {
                                                                                                                                    if (data && data.purPrices && data.purPrices[0]) {
                                                                                                                                        qty_cost = data.purPrices[0].value;
                                                                                                                                    } else {
                                                                                                                                        po_item_quantity_statusModel.findOne({
                                                                                                                                            "poId": purchaseOrder.purchaseOrderNumber,
                                                                                                                                            "sku": purchaseOrderitm.sku,
                                                                                                                                            "qtyStatus": constant.status.SUBMITTED
                                                                                                                                                // "qtyStatus": "submitted"
                                                                                                                                        }).sort({
                                                                                                                                            'lastModified': -1
                                                                                                                                        }).exec(function(err, sub_data) {
                                                                                                                                            if (sub_data && sub_data.purPrices && sub_data.purPrices[0]) {
                                                                                                                                                qty_cost = sub_data.purPrices[0].value;
                                                                                                                                            }
                                                                                                                                            else if (sub_data && sub_data.skuCost) {
                                                                                                                                                qty_cost = sub_data.skuCost;
                                                                                                                                            } else {
                                                                                                                                                qty_cost = cost;
                                                                                                                                            }
                                                                                                                                        });
                                                                                                                                    }
                                                                                                                                }
                                                                                                                                purchaseOrderitm.skuCost = qty_cost;
                                                                                                                                purchaseOrderitm.uom = constant.stockUOM;

                                                                                                                                var item_qty_cost   =   parseFloat(purchaseOrderitm.qty) * parseFloat(qty_cost);
                                                                                                                                package_cost    =   parseFloat(package_cost) + parseFloat(item_qty_cost);
                                                                                                                                asn_cost        =   parseFloat(asn_cost) + parseFloat(item_qty_cost);
                                                                                                                                asn_qty         =   parseFloat(asn_qty) + parseFloat(purchaseOrderitm.qty);

                                                                                                                                if (pack_skus.indexOf(purchaseOrderitm.sku) == -1)
                                                                                                                                    pack_skus.push(purchaseOrderitm.sku);

                                                                                                                                CreateSKUstatusTran(purchaseOrder, purchaseOrderitm, skuupdate);
                                                                                                                            });
                                                                                                                        });
                                                                                                                    }
                                                                                                                });
                                                                                                            // }
                                                                                                        }
                                                                                                    } else {
                                                                                                        Pototal(y + 1, function(y) {
                                                                                                            purchase_order_item(y);
                                                                                                        });
                                                                                                    }
                                                                                                });
                                                                                            // });
                                                                                        };
                                                                                        createqty();
                                                                                    }
                                                                                    if (y == purchaseOrderitems.length) {
                                                                                        shipmentManger.checkpoasnpackage(getjson({
                                                                                            packageId: pckg_details.packageId,
                                                                                            asnId: body.purchaseOrder.purchaseOrderAsn.asnId,
                                                                                            packageCost: package_cost,
                                                                                            numberOfSKU: pack_skus ? pack_skus.length : 0,
                                                                                            user: user
                                                                                        }), function(err, poasnpkgsuccess) {

                                                                                        });
                                                                                    }
                                                                                };
                                                                                purchase_order_item(0);
                                                                            }
                                                                            numberOfPackages = numberOfPackages + 1;
                                                                            purchse_order_pkg(x + 1);
                                                                        });
                                                                    }
                                                              
                                                                    if(x == purchaseOrderPackage.length) {

                                                                        shipmentManger.createpoasn( getjson({
                                                                            poId: purchaseOrder.purchaseOrderNumber,
                                                                            asnId: body.purchaseOrder.purchaseOrderAsn.asnId,
                                                                            numberOfPackages: numberOfPackages,
                                                                            asnQty: asn_qty,
                                                                            asnCost: asn_cost,
                                                                            user: user
                                                                        }), function(err, poasnsucess) {
                                                                            purchasejson_callback();

                                                                        });

                                                                    }
                                                                };
                                                                purchse_order_pkg(0);
                                                            } else if (!body.purchaseOrder.purchaseOrderAsn.hasOwnProperty('purchaseOrderPackage')) {
                                                                if (body.purchaseOrder.purchaseOrderAsn.hasOwnProperty('purchaseOrderItem')) {
                                                                    var purchaseOrderitems = purchaseOrder.purchaseOrderAsn.purchaseOrderItem;
                                                                    var PoSubtotal = "0";
                                                                    var totalPoCost = "0";
                                                                    var totalPoVAT = "0";
                                                                    var totalPoTax = "0";
                                                                    var totalorder = 0;
                                                                    var totalProducts = 0;
                                                                    var purchasetotalProduct = 0;
                                                                    var Pototal = function(total, x) {
                                                                        console.log('cOrder');
                                                                        console.log('y' + total);
                                                                        console.log('cOrder');
                                                                        // console.log('y' + total);
                                                                        shipmentManger.checkOrder(purchaseOrder.purchaseOrderNumber, function(err, order) {
                                                                            var totalPo = parseFloat(order.totalPoCost ? order.totalPoCost : 0) + parseFloat(PoSubtotal) + parseFloat(totalPoTax);
                                                                            totalPoCost = parseFloat(totalPo).toFixed(2);
                                                                            totalPoTax = parseFloat(order.totalPoTax ? order.totalPoTax : 0) + getfloat(totalPoTax);
                                                                            totalPoVAT = parseFloat(order.totalPoVAT ? order.totalPoVAT : 0) + getfloat(totalPoVAT);
                                                                            PoSubtotal = parseFloat(order.PoSubtotal ? order.PoSubtotal : 0) + parseFloat(PoSubtotal);
                                                                            totalProducts = parseFloat(order.numberOfProducts ? order.numberOfProducts : 0) + parseFloat(totalProducts);
                                                                            shipmentManger.createOrder(order_id, {
                                                                                PoSubtotal: PoSubtotal,
                                                                                totalPoCost: totalPoCost,
                                                                                totalPoVAT: totalPoVAT,
                                                                                totalPoTax: totalPoTax,
                                                                                user: user,
                                                                                numberOfProducts: totalProducts,
                                                                                numberOfSKU: purchaseOrderitems.length,
                                                                            }, function(err, order) {
                                                                                if (err) {
                                                                                    // return rep.end({
                                                                                    //     result: err,
                                                                                    //     error: err
                                                                                    return result = error = err;
                                                                                }
                                                                                // x(total);
                                                                                if (total == purchaseOrderitems.length) {
                                                                                    /*rep.end({
                                                                                                result: 'Successfully Completed',
                                                                                                error: err
                                                                                            });*/
                                                                                } else {
                                                                                    x(total);
                                                                                }
                                                                            });
                                                                        });
                                                                    };
                                                                    var purchase_order_item = function(y) {
                                                                        if (y < purchaseOrderitems.length) {
                                                                            var totalProductCost = 0;
                                                                            var totalProductTax = 0;
                                                                            var totalProductVat = 0;
                                                                            var productCost = 0;
                                                                            var Vat = 0;
                                                                            var productTax = 0;
                                                                            var productVat = 0;
                                                                            var purchaseOrderitm = purchaseOrderitems[y];
                                                                            var createqty = function() {
                                                                                // request(env_config.dashPath + constant.apis.GETPRODUCTCOST + '?sku=' + purchaseOrderitm.sku + '&loc=' + purchaseOrder.location, function(err, productCostObj) {
                                                                                    request(env_config.dashPath + constant.apis.SRCHPRODUCT + purchaseOrderitm.sku, function(err, productObj) {
                                                                                        console.log('SRCHPRODUCT ', env_config.dashPath + constant.apis.SRCHPRODUCT + purchaseOrderitm.sku, productObj['body']);
                                                                                        // console.log('GETPRODUCTCOST ', env_config.dashPath + constant.apis.GETPRODUCTCOST + '?sku=' + purchaseOrderitm.sku + '&loc=' + purchaseOrder.location, productCostObj['body']);
                                                                                        if (productObj['body'] != undefined) {
                                                                                            var product = JSON.parse(productObj['body']);
                                                                                            if (product.length >= 1) {
                                                                                                // if (productCostObj.hasOwnProperty('body')) {
                                                                                                    var product = JSON.parse(productObj['body']);
                                                                                                    product = product[0].ProductTbl;
                                                                                                    var data = null;
                                                                                                    if (priceObj[purchaseOrder.location] && priceObj[purchaseOrder.location][purchaseOrderitm.sku]) {
                                                                                                        data = priceObj[purchaseOrder.location][purchaseOrderitm.sku];
                                                                                                    }
                                                                                                    if (data) {
                                                                                                        Vat = data['isVAT'];

                                                                                                        if ( (purchaseOrderitm.purPrices) && (purchaseOrderitm.purPrices[0]) ) {
                                                                                                            productCost =    purchaseOrderitm.purPrices[0].value;  
                                                                                                        }
                                                                                                        else {
                                                                                                            productCost = parseFloat(data['Cost']).toFixed(2);
                                                                                                        }
                                                                                    
                                                                                                        if (data['isVAT'] == "0") {
                                                                                                            productTax = data['percentage'];
                                                                                                            totalProductCost = totalProductCost + parseFloat(purchaseOrderitm.qty) * parseFloat(productCost);
                                                                                                            totalProductCost = getfloat(totalProductCost);
                                                                                                            totalProductTax = parseFloat(totalProductCost) * parseFloat(productTax / 100);
                                                                                                            totalProductTax = getfloat(totalProductTax);
                                                                                                        }
                                                                                                        if (data['isVAT'] == "1") {
                                                                                                            productVat = data['percentage'];
                                                                                                            totalProductCost = totalProductCost + parseFloat(purchaseOrderitm.qty) * parseFloat(productCost);
                                                                                                            totalProductCost = getfloat(totalProductCost);
                                                                                                            totalProductVat = parseFloat(totalProductCost) * parseFloat(productVat / 100);
                                                                                                            totalProductVat = getfloat(totalProductVat);
                                                                                                        }
                                                                                                    }
                                                                                                    PoSubtotal = parseFloat(PoSubtotal) + parseFloat(totalProductCost);
                                                                                                    console.log('Subtotal' + PoSubtotal);
                                                                                                    totalPoVAT = parseFloat(totalPoVAT) + parseFloat(totalProductVat);
                                                                                                    totalPoTax = parseFloat(totalPoTax) + parseFloat(totalProductTax);
                                                                                                    console.log('totalProducts' + (parseFloat(totalProducts) + parseFloat(purchaseOrderitm.qty)));
                                                                                                    totalProducts = parseFloat(totalProducts) + parseFloat(purchaseOrderitm.qty);
                                                                                                    console.log('y + 1' + y + 1);
                                                                                                    Pototal(y + 1, function(y) {
                                                                                                        purchase_order_item(y);
                                                                                                    });
                                                                                                    // purchase_order_item(y + 1);
                                                                                                    orderItem.createOrderItem(getjson({
                                                                                                        purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
                                                                                                        SKU: purchaseOrderitm.sku,
                                                                                                        productName: product.name,
                                                                                                        shipToLocation: purchaseOrder.location,
                                                                                                        producUom: constant.stockUOM,
                                                                                                        length: purchaseOrderitm.length,
                                                                                                        waist: purchaseOrderitm.waist,
                                                                                                        size: purchaseOrderitm.size,
                                                                                                        styleColor: purchaseOrderitm.styleColor,
                                                                                                        productCost: productCost,
                                                                                                        productTax: productTax,
                                                                                                        productVat: productVat,
                                                                                                        isVat: Vat,
                                                                                                        purPrices: purchaseOrderitm.purPrices,
                                                                                                        lineNumber: purchaseOrderitm.lineNumber,
                                                                                                        totalProductCost: totalProductCost,
                                                                                                        totalProductTax: totalProductTax,
                                                                                                        totalProductVat: totalProductVat,
                                                                                                        purPrices: purchaseOrderitm.purPrices,
                                                                                                        qty: purchaseOrderitm.qty,
                                                                                                        user: user
                                                                                                    }), input.params.headers, function(err, itmqty) {
                                                                                                        if (err) {
                                                                                                            return console.log(err);
                                                                                                        }
                                                                                                        if (purchaseOrderitm.qty) {
                                                                                                            function skuupdate() {
                                                                                                                shipmentManger.checkitmequantitystatus({
                                                                                                                    poId: purchaseOrder.purchaseOrderNumber,
                                                                                                                    sku: purchaseOrderitm.sku,
                                                                                                                    packageId: null,
                                                                                                                    asnId: purchaseOrder.purchaseOrderAsn.asnId,
                                                                                                                    qtyStatus: purchaseOrderitm.qtyStatus,
                                                                                                                    itemForceClosedReasonCode: null,
                                                                                                                    itemOnHoldReasonCode: null,
                                                                                                                    location: toLoc,
                                                                                                                    qty: purchaseOrderitm.qty,
                                                                                                                    lineNumber: purchaseOrderitm.lineNumber,
                                                                                                                    skuCost: productCost,
                                                                                                                    purPrices: purchaseOrderitm.purPrices,
                                                                                                                    skuCostAsn: purchaseOrderitm.skuCostAsn,
                                                                                                                    skuCostConfirm: purchaseOrderitm.skuCostConfirm,
                                                                                                                    totalProductTaxConfirm: purchaseOrderitm.totalProductTaxConfirm,
                                                                                                                    totalProductVatConfirm: purchaseOrderitm.totalProductVatConfirm,
                                                                                                                    totalProductCostConfirm: purchaseOrderitm.totalProductCostConfirm,
                                                                                                                    reasonCode: purchaseOrderitm.reasonCode,
                                                                                                                }, function(err, itmqty) {
                                                                                                                    if (err) {
                                                                                                                        console.log(err); // console.log(Ordertype[purchaseOrder.purchaseOrderType][purchaseOrderitm.qtyStatus]);
                                                                                                                    }
                                                                                                                    // purchase_order_item(y + 1);
                                                                                                                }, CreateSKUstatusTran, purchaseOrder);
                                                                                                            }
                                                                                                            po_item_quantity_statusModel.findOne({
                                                                                                                "poId": purchaseOrder.purchaseOrderNumber,
                                                                                                                "sku": purchaseOrderitm.sku,
                                                                                                                "qtyStatus": constant.status.CONFIRMED
                                                                                                                    // "qtyStatus": "submitted"
                                                                                                            }).sort({
                                                                                                                'lastModified': -1
                                                                                                            }).exec(function(err, data) {
                                                                                                                po_item_quantity_statusModel.findOne({
                                                                                                                    "poId": purchaseOrder.purchaseOrderNumber,
                                                                                                                    "sku": purchaseOrderitm.sku,
                                                                                                                    "qtyStatus": 'shipped'
                                                                                                                }).sort({
                                                                                                                    'lastModified': -1
                                                                                                                }).exec(function(err, dataAsn) {
                                                                                                                    var qty_cost;
                                                                                                                    var cost = productCost;
                                                                                                                    if ((purchaseOrderitm.purPrices) && (purchaseOrderitm.purPrices[0]) && (purchaseOrderitm.qtyStatus == constant.status.SHIPPED)) {
                                                                                                                        qty_cost = purchaseOrderitm.purPrices[0].value;
                                                                                                                    } else if (dataAsn && dataAsn.purPrices && dataAsn.purPrices[0]) {
                                                                                                                        qty_cost = dataAsn.purPrices[0].value;
                                                                                                                    } else if ((purchaseOrderitm.purPrices) && (purchaseOrderitm.purPrices[0]) && ( constant.confirmingStatus.indexOf(purchaseOrderitm.qtyStatus) != -1 )) {
                                                                                                                        qty_cost = purchaseOrderitm.purPrices[0].value;
                                                                                                                    } else {
                                                                                                                        if (data && data.purPrices && data.purPrices[0]) {
                                                                                                                            qty_cost = data.purPrices[0].value;
                                                                                                                        } else {
                                                                                                                            po_item_quantity_statusModel.findOne({
                                                                                                                                "poId": purchaseOrder.purchaseOrderNumber,
                                                                                                                                "sku": purchaseOrderitm.sku,
                                                                                                                                "qtyStatus": constant.status.SUBMITTED
                                                                                                                                    // "qtyStatus": "submitted"
                                                                                                                            }).sort({
                                                                                                                                'lastModified': -1
                                                                                                                            }).exec(function(err, sub_data) {
                                                                                                                                if (sub_data && sub_data.purPrices && sub_data.purPrices[0]) {
                                                                                                                                    qty_cost = sub_data.purPrices[0].value;
                                                                                                                                }
                                                                                                                                else if (sub_data && sub_data.skuCost) {
                                                                                                                                    qty_cost = sub_data.skuCost;
                                                                                                                                } else {
                                                                                                                                    qty_cost = cost;
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                    }
                                                                                                                    purchaseOrderitm.skuCost = qty_cost;
                                                                                                                    purchaseOrderitm.uom = constant.stockUOM;

                                                                                                                    var item_qty_cost   =   parseFloat(purchaseOrderitm.qty) * parseFloat(qty_cost);
                                                                                                                    asn_cost            =   parseFloat(asn_cost) + parseFloat(item_qty_cost);
                                                                                                                    asn_qty             =   parseFloat(asn_qty) + parseFloat(purchaseOrderitm.qty);

                                                                                                                    CreateSKUstatusTran(purchaseOrder, purchaseOrderitm, skuupdate);
                                                                                                                });
                                                                                                            });
                                                                                                        }
                                                                                                    });
                                                                                                // }
                                                                                            }
                                                                                        } else {
                                                                                            Pototal(y + 1, function(y) {
                                                                                                purchase_order_item(y);
                                                                                            });
                                                                                        }
                                                                                    });
                                                                                // });
                                                                            };
                                                                            createqty();
                                                                        }
                                                                        if (y == purchaseOrderitems.length) {
                                                                        
                                                                            shipmentManger.createpoasn( getjson({
                                                                                poId: purchaseOrder.purchaseOrderNumber,
                                                                                asnId: body.purchaseOrder.purchaseOrderAsn.asnId,
                                                                                numberOfPackages: numberOfPackages,
                                                                                asnQty: asn_qty,
                                                                                asnCost: asn_cost,
                                                                                user: user
                                                                            }), function(err, poasnsucess) {
                                                                                purchasejson_callback();
                                                                            });

                                                                        }
                                                                    };
                                                                    purchase_order_item(0);
                                                                }
                                                            }
                                                        });
                                                    }
                                                });
                                                // rep.end({
                                                //     result: 'Successfully Completed',
                                                //     error: err
                                                // });
                                                result = 'Successfully Completed';
                                                error = err;
                                            } else {
                                                // rep.end({
                                                //     result: 'This is not a Required Json format',
                                                //     error: err
                                                // });
                                                result = 'This is not a Required Json format';
                                                error = err;
                                            }
                                        } else {
                                            // rep.end({
                                            //     result: 'No order.',
                                            //     error: err
                                            // });
                                            result = 'No order.';
                                            error = err;
                                        }
                                        // purchasejson_callback();
                                    }
                                });
                                // purchasejson_callback();  mention
                             });
                            // });
                        } else {
                            error = 'This is not a Required Json format';
                            purchasejson_callback();
                        }
                    }, function() {
                        return rep.end({
                            result: {
                                "status": constant.label.SUCCESS
                            },
                            error: error
                        });
                    });
                });
                // }
                // ordertypechack(jsonData).then(function(data){
                    // if(data){
                        // getJsonWithAllprices(jsonData).then(function(orderwithPrices){
                        //     console.log("orderwithPrices____________:",JSON.stringify(orderwithPrices));
                        //     internalCallJson(orderwithPrices);
                        // }, function(error){
                        //     return rep.end({
                        //         result: {
                        //             "status": constant.label.ERROR
                        //         },
                        //         error: constant.label.ERROR
                        //     });
                        // });
                    // }else{
                    //     internalCallJson(jsonData);
                    // }
                // });
            };
            var type = input.params.receivingpurchasejsonData.type;
            user = input.params.receivingpurchasejsonData.user;
            if (type == 'json') {
                var data = input.params.receivingpurchasejsonData.uploaded_file;
                uploadjson(data);
            } else {
                fs.readFile(input.params.receivingpurchasejsonData.uploaded_file.path, function(err, data) {
                    var newPath = __dirname + "/files/" + new Date().getTime() + '.json';
                    var tmp_path = input.params.receivingpurchasejsonData.uploaded_file.path;
                    fs.writeFile(newPath, data, function(err) {
                        fs.unlink(tmp_path, function(err) {
                            if (err) {
                                return rep.end({
                                    error: err
                                });
                            }
                        });
                        fs.readFile(newPath, 'utf8', function(err, data) {
                            if (err) {
                                return console.log('Error ' + err);
                                uploadjson(err);
                            }
                            //console.log(data);
                            var response_count = 0;
                            uploadjson(data, err);
                        });
                    });
                });
            }
            break;
        case 'countsuploadjson':
            console.log(input.params);
            var uploadjson = function(data, err) {
                var body = JSON.parse(data);
                if (body.hasOwnProperty('count')) {
                    // Check wheather that count is already exists
                    var count_id = body.count.countId;
                    var countjson = body.count;
                    var repcountzone = [];
                    var repcount = [];
                    countManager.checkCounts(count_id, function(err, count) {
                        if (count) {
                            countManager.updateCount(count_id, getjson({
                                locationId: countjson.locationId,
                                directiveId: countjson.directiveId,
                                name: countjson.name,
                                description: countjson.description,
                                startDate: countjson.startDate,
                                endDate: countjson.endDate,
                                countType: countjson.countType,
                                // numberOfZones: countjson.numberOfZones,
                                countStatus: countjson.countStatus,
                                comment: countjson.comment,
                                user: user
                            }), function(err, count) {
                                if (err) {
                                    return rep.end({
                                        result: err,
                                        error: err
                                    });
                                }
                                count_id = count._id;
                                if (body.count.hasOwnProperty('countZone')) {
                                    var countZonejson = body.count.countZone;
                                    var createCountZone = function(x) {
                                        if (x < countZonejson.length) {
                                            var countzone = JSON.parse(JSON.stringify(countZonejson[x]));
                                            var zone_id = 0;
                                            // if (zone_id) {
                                            zone_id = countzone.id;
                                            // }
                                            console.log(zone_id);
                                            countManager.checkCountZone(count_id, zone_id, function(err, zone) {
                                                if (err) {
                                                    return rep.end({
                                                        result: err,
                                                        error: err
                                                    });
                                                }
                                                if (zone) {
                                                    countManager.updateCountZone(count_id, zone_id, {
                                                        // countId: count_id,
                                                        zoneBarcode: countzone.zoneBarcode,
                                                        operatorId: countzone.operatorId,
                                                        deviceId: countzone.deviceId,
                                                        recountType: countzone.recountType,
                                                        skuQty: countzone.skuQty,
                                                        handCountQty: countzone.handCountQty,
                                                        scanQty: countzone.scanQty,
                                                        countStatus: countzone.countStatus,
                                                        comment: countzone.comment,
                                                        user: user
                                                    }, function(err, zone) {
                                                        if (err) {
                                                            return rep.end({
                                                                result: err,
                                                                error: err
                                                            });
                                                        }
                                                        if (zone) {
                                                            // console.log(count_id, zone_id);
                                                            // console.log('zone updated.');
                                                            repcountzone[zone_id] = [];
                                                            repcountzone[zone_id][1] = zone;
                                                            if (countzone.hasOwnProperty('zoneItem')) {
                                                                var countqtyjson = countzone.zoneItem;
                                                                var createCountQty = function(y) {
                                                                    if (y < countqtyjson.length) {
                                                                        var countqty = JSON.parse(JSON.stringify(countqtyjson[y]));;
                                                                        var sku = countqty.sku;
                                                                        var countNo = countqty.countNumber;
                                                                        var qty = countqty.qty;
                                                                        countqty.qty = qty;
                                                                        countqty.countId = count_id;
                                                                        countqty.zoneId = zone_id;
                                                                        countManager.checkCount(count_id, zone_id, countNo, sku, function(err, data) {
                                                                            if (err) {
                                                                                return rep.end({
                                                                                    result: err,
                                                                                    error: err
                                                                                });
                                                                            }
                                                                            if (data) {
                                                                                console.log(count_id, zone_id, sku);
                                                                                console.log('countqty updated.');
                                                                                countManager.updateCountdata(data._id, countqty, function(err, data) {});
                                                                                // countManager.updateCountQty(data._id, countNo, qty, function(err, data) {});
                                                                            } else {
                                                                                console.log(count_id, zone_id, sku);
                                                                                console.log('countqty created.');
                                                                                Createcountitem(countqty, function(err, data) {
                                                                                    repcountzone[zone_id].push({
                                                                                        count_id: count_id,
                                                                                        zone_id: zone_id,
                                                                                        sku: sku,
                                                                                        countzone: 'processed'
                                                                                    });
                                                                                });
                                                                            }
                                                                        });
                                                                        createCountQty(y + 1);
                                                                    }
                                                                };
                                                                createCountQty(0);
                                                            }
                                                        }
                                                    });
                                                } else {
                                                    return rep.end({
                                                        error: 'No zone.',
                                                        error: err
                                                    });
                                                    err = 'No zone.';
                                                    console.log('No zone.');
                                                }
                                            });
                                            createCountZone(x + 1);
                                        }
                                    };
                                    createCountZone(0);
                                }
                            });
                            return rep.end({
                                result: 'Successfully Completed',
                                error: err
                            });
                        } else {
                            return rep.end({
                                result: 'No count.',
                                error: err
                            });
                        }
                    });
                } else {
                    return rep.end({
                        result: 'This is not a Required Json format',
                        error: err
                    });
                }
            };
            var type = input.params.jsonData.type;
            if (type == 'json') {
                var data = input.params.jsonData.uploaded_file;
                uploadjson(data);
            } else {
                fs.readFile(input.params.jsonData.uploaded_file.path, function(err, data) {
                    var newPath = __dirname + "/files/" + new Date().getTime() + '.json';
                    var tmp_path = input.params.jsonData.uploaded_file.path;
                    fs.writeFile(newPath, data, function(err) {
                        fs.unlink(tmp_path, function(err) {
                            if (err) {
                                return rep.end({
                                    error: err
                                });
                            }
                        });
                        fs.readFile(newPath, 'utf8', function(err, data) {
                            if (err) {
                                return console.log('Error ' + err);
                            }
                            //console.log(data);
                            var response_count = 0;
                            uploadjson(data, err);
                        });
                    });
                });
            }
            break;
        case 'receivedpackage':
            console.log(input.params.receivedpackageData.data);
            var user = {};
            if (input.params.receivedpackageData && input.params.receivedpackageData.data) {
                var jsonData = JSON.parse(input.params.receivedpackageData.data);
                user = input.params.receivedpackageData.user;
                var Createrecvtran = function(purchaseOrder, Status, x, packageStatus) {
                    var toLoc;
                    var fromLocationId = '';
                    if (purchaseOrder.markForLocation == ''|| purchaseOrder.markForLocation == undefined) {
                        toLoc = purchaseOrder.shipToLocation;
                    } else {
                        toLoc = purchaseOrder.markForLocation;
                    }
                    var ASNID;
                    if (packageStatus.asnid) {
                        ASNID = packageStatus.asnid;
                    } else {
                        ASNID = packageStatus.asnId;
                    }
                    if (purchaseOrder.purchaseOrderType == 'IBT_M' || purchaseOrder.purchaseOrderType == 'PUSH') {
                        var dataobj = {
                            transtypeid: '',
                            stocklocationid: '',
                            asnid: ASNID,
                            locationid: toLoc,
                            stockUOM: packageStatus.producUom,
                            quantity: packageStatus.qty,
                            purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
                            purchaseOrderType: purchaseOrder.purchaseOrderType,
                            cost: packageStatus.skuCost,
                            warehouseid: toLoc,
                            sku: packageStatus.sku,
                            // user: user,
                            directivetype: Ordertype[purchaseOrder.purchaseOrderType]['toStore'][packageStatus.qtyStatus]
                        };
                        CreateTran(dataobj, function(err, data) {
                            var dataobj = {
                                transtypeid: '',
                                stocklocationid: '',
                                asnid: ASNID,
                                locationid: purchaseOrder.FromLocation,
                                stockUOM: packageStatus.producUom,
                                quantity: packageStatus.qty,
                                purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
                                purchaseOrderType: purchaseOrder.purchaseOrderType,
                                cost: packageStatus.skuCost,
                                warehouseid: purchaseOrder.FromLocation,
                                sku: packageStatus.sku,
                                // user: user,
                                directivetype: Ordertype[purchaseOrder.purchaseOrderType]['fromStore'][packageStatus.qtyStatus]
                            };
                            CreateTran(dataobj , function(err, data){
                                Status(x);
                            });
                        });
                    } else {
                        var dataobj = {
                            transtypeid: '',
                            stocklocationid: '',
                            asnid: ASNID,
                            locationid: toLoc,
                            stockUOM: packageStatus.producUom,
                            quantity: packageStatus.qty,
                            purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
                            purchaseOrderType: purchaseOrder.purchaseOrderType,
                            cost: packageStatus.skuCost,
                            warehouseid: toLoc,
                            sku: packageStatus.sku,
                            // user: user,
                            directivetype: Ordertype[purchaseOrder.purchaseOrderType][packageStatus.qtyStatus]
                        };
                        CreateTran(dataobj , function(err , data){
                            Status(x);
                        });
                    }
                };
                shipmentManger.updatepackagestatus(jsonData, user, Createrecvtran, function(err, pkgstatus) {
                    return rep.end({
                        result: pkgstatus,
                        error: err
                    });
                });
            } else {
                var result = {
                    status: constant.label.ERROR,
                    message: constant.label.INPUT_MISSING
                }
                return rep.end({
                    result: result,
                    error: "error"
                });
            }
            break;
        case 'reverseReceiptPackage':
            var user = {};
            var Createrecvtran = function(purchaseOrder, Status, x, packageStatus) {
                var toLoc;
                var fromLocationId = '';
                if (purchaseOrder.markForLocation == '' || purchaseOrder.markForLocation == undefined) {
                    toLoc = purchaseOrder.shipToLocation;
                } else {
                    toLoc = purchaseOrder.markForLocation;
                }
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
                if (purchaseOrder.purchaseOrderType == 'IBT_M' || purchaseOrder.purchaseOrderType == 'PUSH') {
                    var dataobj = {
                        transtypeid: '',
                        stocklocationid: '',
                        asnid: ASNID,
                        locationid: toLoc,
                        stockUOM: UOM,
                        quantity: packageStatus.qty,
                        purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
                        purchaseOrderType: purchaseOrder.purchaseOrderType,
                        cost: packageStatus.skuCost,
                        warehouseid: toLoc,
                        sku: packageStatus.sku,
                        // user: user,
                        directivetype: Ordertype[purchaseOrder.purchaseOrderType]['toStore'][packageStatus.qtyStatus]
                    };
                    CreateTran(dataobj);
                    var dataobj = {
                        transtypeid: '',
                        stocklocationid: '',
                        asnid: ASNID,
                        locationid: purchaseOrder.FromLocation,
                        stockUOM: UOM,
                        quantity: packageStatus.qty,
                        purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
                        purchaseOrderType: purchaseOrder.purchaseOrderType,
                        cost: packageStatus.skuCost,
                        warehouseid: purchaseOrder.FromLocation,
                        sku: packageStatus.sku,
                        // user: user,
                        directivetype: Ordertype[purchaseOrder.purchaseOrderType]['fromStore'][packageStatus.qtyStatus]
                    };
                    CreateTran(dataobj);
                    Status(x);
                } else {
                    var dataobj = {
                        transtypeid: '',
                        stocklocationid: '',
                        asnid: ASNID,
                        locationid: toLoc,
                        stockUOM: UOM,
                        quantity: packageStatus.qty,
                        purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
                        purchaseOrderType: purchaseOrder.purchaseOrderType,
                        cost: packageStatus.skuCost,
                        warehouseid: toLoc,
                        sku: packageStatus.sku,
                        // user: user,
                        directivetype: Ordertype[purchaseOrder.purchaseOrderType][packageStatus.qtyStatus]
                    };
                    CreateTran(dataobj);
                    Status(x);
                }
            };
            if (input.params.reverseReceiptPackageData && input.params.reverseReceiptPackageData.data) {
                var jsonData = JSON.parse(input.params.reverseReceiptPackageData.data);
                user = input.params.reverseReceiptPackageData.user;
                shipmentManger.reverseReceiptPackageStatus(jsonData, user, Createrecvtran, function(err, pkgstatus) {
                    return rep.end({
                        result: pkgstatus,
                        error: err
                    });
                });
            } else {
                var result = {
                    status: constant.label.ERROR,
                    message: constant.label.INPUT_MISSING
                }
                return rep.end({
                    result: result,
                    error: "error"
                });
            }
            break;
        case 'closedAsnPackage':
            var user = {};
            var Createrecvtran = function(purchaseOrder, Status, x, packageStatus) {
                var toLoc;
                var fromLocationId = '';
                if (purchaseOrder.markForLocation == '' || purchaseOrder.markForLocation == undefined) {
                    toLoc = purchaseOrder.shipToLocation;
                } else {
                    toLoc = purchaseOrder.markForLocation;
                }
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
                if (purchaseOrder.purchaseOrderType == 'IBT_M' || purchaseOrder.purchaseOrderType == 'PUSH') {
                    var dataobj = {
                        transtypeid: '',
                        stocklocationid: '',
                        asnid: ASNID,
                        locationid: toLoc,
                        stockUOM: UOM,
                        quantity: packageStatus.qty,
                        purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
                        purchaseOrderType: purchaseOrder.purchaseOrderType,
                        cost: packageStatus.skuCost,
                        warehouseid: toLoc,
                        sku: packageStatus.sku,
                        // user: user,
                        directivetype: Ordertype[purchaseOrder.purchaseOrderType]['toStore'][packageStatus.qtyStatus]
                    };
                    CreateTran(dataobj);
                    var dataobj = {
                        transtypeid: '',
                        stocklocationid: '',
                        asnid: ASNID,
                        locationid: purchaseOrder.FromLocation,
                        stockUOM: UOM,
                        quantity: packageStatus.qty,
                        purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
                        purchaseOrderType: purchaseOrder.purchaseOrderType,
                        cost: packageStatus.skuCost,
                        warehouseid: purchaseOrder.FromLocation,
                        sku: packageStatus.sku,
                        // user: user,
                        directivetype: Ordertype[purchaseOrder.purchaseOrderType]['fromStore'][packageStatus.qtyStatus]
                    };
                    CreateTran(dataobj);
                } else {
                    var dataobj = {
                        transtypeid: '',
                        stocklocationid: '',
                        asnid: ASNID,
                        locationid: toLoc,
                        stockUOM: UOM,
                        quantity: packageStatus.qty,
                        purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
                        purchaseOrderType: purchaseOrder.purchaseOrderType,
                        cost: packageStatus.skuCost,
                        warehouseid: toLoc,
                        sku: packageStatus.sku,
                        // user: user,
                        directivetype: Ordertype[purchaseOrder.purchaseOrderType][packageStatus.qtyStatus]
                    };
                    CreateTran(dataobj);
                }
                Status(x);
            };
            if (input.params.closedAsnPackageData && input.params.closedAsnPackageData.data) {
                var jsonData = JSON.parse(input.params.closedAsnPackageData.data);
                user = input.params.closedAsnPackageData.user;
                shipmentManger.closeAsnPackageStatus(jsonData, user, Createrecvtran, function(err, pkgstatus) {
                    return rep.end({
                        result: pkgstatus,
                        error: err
                    });
                });
            } else {
                var result = {
                    status: constant.label.ERROR,
                    message: constant.label.INPUT_MISSING
                }
                return rep.end({
                    result: result,
                    error: "error"
                });
            }
            break;
        case 'createqtystatus':
            console.log('createqtystatus');
            log.info('Creating new Reord for Quantity Status...');
            var user = {};
            var tranArr = [];
            user = input.params.qtystatusdata.user;
            var createqtystatus = function(purchaseOrder, callback) {
                // var purchaseOrder = input.params.qtystatusdata;
                // var trancreate = input.params.qtystatusdata.trancreate == 'true';
                var trancreate = purchaseOrder.trancreate == 'true';
                shipmentManger.createitemqtystatus(purchaseOrder, function(err, vendor) {
                    var toLoc;
                    var callCallback = true;
                    var fromLocationId = '';
                    if (purchaseOrder.markForLocation == '' || purchaseOrder.markForLocation == undefined) {
                        toLoc = purchaseOrder.shipToLocation;
                    } else {
                        toLoc = purchaseOrder.markForLocation;
                    }
                    if (purchaseOrder.purchaseOrderType == 'IBT_M' || purchaseOrder.purchaseOrderType == 'PUSH') {
                        var dataobj = {
                            transtypeid: '',
                            stocklocationid: '',
                            asnid: purchaseOrder.asnid,
                            locationid: toLoc,
                            stockUOM: purchaseOrder.producUom,
                            quantity: purchaseOrder.qty,
                            purchaseOrderNumber: purchaseOrder.poId,
                            purchaseOrderType: purchaseOrder.purchaseOrderType,
                            cost: purchaseOrder.skuCost,
                            warehouseid: toLoc,
                            createTran: purchaseOrder.qtyStatus == constant.status.DRAFTORDER ? true : '',
                            addTran: purchaseOrder.qtyStatus == constant.status.DRAFTORDER && trancreate ? true : '',
                            sku: purchaseOrder.sku,
                            // user: user,
                            directivetype: Ordertype[purchaseOrder.purchaseOrderType]['toStore'][purchaseOrder.qtyStatus]
                        };
                        // CreateTran(dataobj);
                        tranArr.push(dataobj);
                        if (purchaseOrder.qtyStatus != constant.status.DRAFTORDER) {
                            var dataobj = {
                                transtypeid: '',
                                stocklocationid: '',
                                locationid: purchaseOrder.FromLocation,
                                stockUOM: purchaseOrder.producUom,
                                quantity: purchaseOrder.qty,
                                purchaseOrderNumber: purchaseOrder.poId,
                                purchaseOrderType: purchaseOrder.purchaseOrderType,
                                cost: purchaseOrder.skuCost,
                                warehouseid: purchaseOrder.FromLocation,
                                sku: purchaseOrder.sku,
                                // user: user,
                                directivetype: Ordertype[purchaseOrder.purchaseOrderType]['fromStore'][purchaseOrder.qtyStatus]
                            };
                            // CreateTran(dataobj);
                            tranArr.push(dataobj);
                        }
                    } else if (purchaseOrder.purchaseOrderType == 'DROP_SHIP') {
                        var dataobj = {
                            transtypeid: '',
                            stocklocationid: '',
                            locationid: purchaseOrder.location,
                            stockUOM: purchaseOrder.producUom,
                            quantity: purchaseOrder.qty,
                            purchaseOrderNumber: purchaseOrder.poId,
                            purchaseOrderType: purchaseOrder.purchaseOrderType,
                            cost: purchaseOrder.skuCost,
                            warehouseid: purchaseOrder.location,
                            createTran: purchaseOrder.qtyStatus == constant.status.DRAFTORDER,
                            addTran: purchaseOrder.qtyStatus == constant.status.DRAFTORDER && trancreate ? 'true' : '',
                            sku: purchaseOrder.sku,
                            // user: user,
                            directivetype: Ordertype[purchaseOrder.purchaseOrderType][purchaseOrder.qtyStatus]
                        };
                        // CreateTran(dataobj, callback);
                        tranArr.push(dataobj);
                    } else {
                        var dataobj = {
                            transtypeid: '',
                            stocklocationid: '',
                            locationid: toLoc,
                            stockUOM: purchaseOrder.producUom,
                            quantity: purchaseOrder.qty,
                            purchaseOrderNumber: purchaseOrder.poId,
                            purchaseOrderType: purchaseOrder.purchaseOrderType,
                            cost: purchaseOrder.skuCost,
                            warehouseid: toLoc,
                            createTran: purchaseOrder.qtyStatus == constant.status.DRAFTORDER ? 'true' : '',
                            addTran: purchaseOrder.qtyStatus == constant.status.DRAFTORDER && trancreate ? 'true' : '',
                            saveOnlyTran: (!purchaseOrder.sku && purchaseOrder.qtyStatus == constant.status.DRAFTORDER) ? 'true' : '',
                            sku: purchaseOrder.sku,
                            // user: user,
                            directivetype: Ordertype[purchaseOrder.purchaseOrderType][purchaseOrder.qtyStatus]
                        };
                        // CreateTran(dataobj);
                        tranArr.push(dataobj);
                    }
                    callback();
                });
            }
            if (input.params.qtystatusdata.data || input.params.qtystatusdata.arrData || input.params.qtystatusdata) {
                try {
                    if(input.params.qtystatusdata.arrData){
                        if (!(input.params.qtystatusdata.arrData.constructor === Array)) {
                            if (typeof input.params.qtystatusdata.arrData === 'string') {
                                var data = JSON.parse(input.params.qtystatusdata.arrData);
                            }
                            else {
                                var data = JSON.parse(JSON.stringify(input.params.qtystatusdata.arrData));
                            }
                        }
                        else {
                            var data = JSON.parse(JSON.stringify(input.params.qtystatusdata.arrData));
                        }
                    }
                    else if (input.params.qtystatusdata.data) {
                        var data = JSON.parse(JSON.stringify(input.params.qtystatusdata.data));
                    }
                    else {
                        var data = [];
                        data.push(input.params.qtystatusdata);
                    }
                } catch (e) {
                    var data = [];
                }
                // if(!data.length) {
                //     data = Object.keys(data).map(function (key) { return data[key]; });
                // }
                async.eachSeries(data, function(qtystatusObj, asynccallback) {
                    if (qtystatusObj.user) {
                         asynccallback();                        
                    }
                    else {
                        createqtystatus(qtystatusObj, function() {
                            asynccallback();
                        });
                    }
                }, function() {
                    CreateTranService(tranArr);
                    return rep.end({
                        result: data,
                        error: null
                    });
                });
            } else {
                var qtyDataArr = [];
                qtyDataArr.push(input.params.qtystatusdata);
                createqtystatus(qtyDataArr, function() {
                    return rep.end({
                        result: data,
                        error: null
                    });
                });
            }
            break;
        case 'shipmentdata':
            log.info('Getting Data from  po_item_quantity_statusModel[' + input.params.shipmentdata + ']...');
            var poid = input.params.shipmentdata.poId;
            shipmentManger.checkOrder(poid, function(err, order) {
                if (order) {
                    shipmentManger.getshipmentdata(poid, function(err, data) {
                        var return_data = {};
                        var return_qty = {};
                        if (data.length > 0) {
                            for (var n = 0; n < data.length; n++) {
                                if (data[n].sku in return_data) {
                                    if (data[n].qtyStatus in return_data[data[n].sku]['qtyStatus']) {
                                        return_data[data[n].sku]['qtyStatus'][data[n].qtyStatus] = parseInt(return_data[data[n].sku]['qtyStatus'][data[n].qtyStatus]) + parseInt(data[n].qty);
                                        //return_data[data[n].sku]['qty'] = parseInt(return_data[data[n].sku]['qty']) + parseInt(data[n].qty);
                                    } else {
                                        return_data[data[n].sku]['qtyStatus'][data[n].qtyStatus] = data[n].qty;
                                    }
                                } else {
                                    return_data[data[n].sku] = {};
                                    return_qty[data[n].sku] = {};
                                    return_data[data[n].sku]['qtyStatus'] = {};
                                    return_data[data[n].sku]['sku'] = data[n].sku;
                                    return_data[data[n].sku]['skuCost'] = data[n].skuCost;
                                    // return_data[data[n].sku]['skuCostAsn'] = data[n].skuCostAsn;
                                    // return_data[data[n].sku]['skuCostConfirm'] = data[n].skuCostConfirm;
                                    return_data[data[n].sku]['qtyStatus'][data[n].qtyStatus] = data[n].qty;
                                }
                                // if (data[n]['skuCostConfirm']) {
                                //     return_data[data[n].sku]['skuCostConfirm'] = data[n].skuCostConfirm;
                                // }
                                // if (data[n]['skuCostAsn']) {
                                //     return_data[data[n].sku]['skuCostAsn'] = data[n].skuCostAsn;
                                // }
                                if (data[n]['purPrices'] && data[n]['purPrices'][0] ) {
                                    return_data[data[n].sku]['skuCost'] = data[n]['purPrices'][0].value;
                                }
                                if (data[n]['totalProductTaxConfirm']) {
                                    return_data[data[n].sku]['totalProductTaxConfirm'] = data[n].totalProductTaxConfirm;
                                }
                                if (data[n]['totalProductVatConfirm']) {
                                    return_data[data[n].sku]['totalProductVatConfirmn'] = data[n].totalProductVatConfirm;
                                }
                                if (data[n]['totalProductCostConfirm']) {
                                    return_data[data[n].sku]['totalProductCostConfirm'] = data[n].totalProductCostConfirm;
                                }
                                if (data[n]['totalProductTaxAsn']) {
                                    return_data[data[n].sku]['totalProductTaxAsn'] = data[n].totalProductTaxAsn;
                                }
                                if (data[n]['totalProductVatAsn']) {
                                    return_data[data[n].sku]['totalProductVatAsn'] = data[n].totalProductVatAsn;
                                }
                                if (data[n]['totalProductCostAsn']) {
                                    return_data[data[n].sku]['totalProductCostAsn'] = data[n].totalProductCostAsn;
                                }
                                // if (constant.createPurchaseOrderType.hasOwnProperty(order.purchaseOrderType)) {
                                // return_data[data[n].sku]['qty'] = parseInt((return_data[data[n].sku]['qty'] ? return_data[data[n].sku]['qty'] : 0)) + parseInt(data[n].qty);
                                return_qty[data[n].sku]['qtydata'] = parseInt((return_qty[data[n].sku]['qtydata'] ? return_qty[data[n].sku]['qtydata'] : 0)) + parseInt(data[n].qty);
                                // }
                                // if (data[n].qtyStatus == 'submitted') {
                                //     return_data[data[n].sku]['qty'] = data[n].qty;
                                // }  
                                if (data[n].qtyStatus == 'submitted') {
                                    return_qty[data[n].sku]['qty'] = data[n].qty;
                                }
                                return_qty[data[n].sku][data[n].qtyStatus] = parseInt((return_qty[data[n].sku][data[n].qtyStatus] ? return_qty[data[n].sku][data[n].qtyStatus] : 0)) + parseInt(data[n].qty);
                            }
                            Object.keys(return_qty).forEach(function(n) {
                                // if (return_qty[n].hasOwnProperty('qty')) {
                                //     return_data[n]['qty'] = parseInt(return_qty[n]['qty']);
                                // } else {
                                //     return_data[n]['qty'] = parseInt(return_qty[n]['qtydata']);
                                // }
                                if (return_qty[n].hasOwnProperty('received')) {
                                    return_data[n]['qty'] = parseInt(return_qty[n]['received']);
                                } else if (return_qty[n].hasOwnProperty('receiveInProgress')) {
                                    return_data[n]['qty'] = parseInt(return_qty[n]['receiveInProgress']);
                                } else if (return_qty[n].hasOwnProperty('shipped')) {
                                    return_data[n]['qty'] = parseInt(return_qty[n]['shipped']);
                                } else if (return_qty[n].hasOwnProperty('confirmed')) {
                                    return_data[n]['qty'] = parseInt(return_qty[n]['confirmed']);
                                } else if (return_qty[n].hasOwnProperty('submitted')) {
                                    return_data[n]['qty'] = parseInt(return_qty[n]['submitted']);
                                } else {
                                    return_data[n]['qty'] = 0;
                                }
                            })
                        }
                        console.log(return_data);
                        return rep.end({
                            result: return_data,
                            error: err
                        });
                    });
                }
            });
            break;
        case 'getshipment':
            shipmentManger.getshipment(input.params.purchaseData, input.params.headers, function(err, data) {
                return rep.end({
                    result: data,
                    error: err
                });
            });
            break;
        case 'pomatrixdata':
    console.log('------------------------------');
        console.log('worker before pomatrixdata - ',JSON.stringify(input.params.jsonData));
    console.log('------------------------------');
            var json_data = input.params.jsonData.searchParams;
            var location = json_data['locid'];
            if (json_data['module'] == 'analytics') {
                var productCode = json_data['srch'];
            } else {
                var productCode = json_data['productCode'];
            }
            var header = input.params.headers;
            var return_data = {};
            log.info('Getting Data from  ' + env_config.dashPath + constant.apis.GETSTYLEMATRIXSERVICE + location + '&style_code=' + productCode);
            //requeststyle_code.
            console.time('dash');
            request(env_config.dashPath + constant.apis.GETSTYLEMATRIXSERVICE + location + '&style_code=' + productCode, function(err, res, productData) {
                console.timeEnd('dash');
                console.time('data');
                if (!err && res.statusCode == 200) {
                    try {
                        productData = JSON.parse(productData);
                    } catch (e) {
                        return rep.end({
                            error: err,
                            result: {
                                status: constant.label.ERROR,
                                message: 'No products.'
                            }
                        });
                    }
                    // console.log(productData);
                    if (productData.status == constant.label.ERROR) {
                        // console.log(err, productData);
                        return rep.end({
                            error: err,
                            result: {
                                status: constant.label.ERROR,
                                message: productData.message
                            }
                        });
                    } else {
                        if (json_data['mode']) {
                            if (!productData.skus) {
                                return rep.end({
                                    error: err,
                                    result: {
                                        status: constant.label.ERROR,
                                        message: constant.label.NO_SKUS
                                    }
                                });
                            }
                        }
                        var skus = [];
                        return_data.product = productData.product;
                        return_data.product['mode'] = json_data['mode'];
                        return_data.product['x-axis'] = productData['x-axis'];
                        return_data.product['y-axis'] = productData['y-axis'];
                        if (productData.skus) {
                            return_data.product.skus = JSON.parse(JSON.stringify(productData.skus));
                            skus = productData.skus;
                        }
                        console.time('skus');
                        console.log('skus', skus.length);
                        var resultskus = [];
                        skus.forEach(function(data, n) {
                            // resultskus = resultskus.concat(data.sku) + ',';
                            resultskus.push(data.sku);
                        });
                        var sku_misc = {};
                        var formData = querystring.stringify({
                            sku: resultskus.join(',')
                        });
                        var contentLength = formData.length;
                        var options = {
                            url: env_config.apiPath + constant.apis.INVENTORIESSERVICE + location,
                            method: 'POST',
                            body: formData,
                            headers: {
                                'authorization': input.params.headers,
                                'Content-Type': 'application/x-www-form-urlencoded',
                            }
                        };
                        console.log("url", env_config.apiPath + constant.apis.INVENTORIESSERVICE + location + "&sku=" + resultskus);
                        request(options, function(err, data) {
                            if (data && data['body']) {
                                sku_misc = JSON.parse(data['body']);
                                getSkuValue(0);
                            }
                        });

                        function getSKUDATA() {
                            var deffered = Q.defer();
                            // if(json_data['module'] == 'Analytics') {
                            var fromDate = json_data['fromdate'] || '';
                            var toDate = json_data['todate'] || '';
                            var location = json_data['childstore'];
                            var page = json_data['page'] || '';
                            var srch = json_data['srch'];
                            var sku = json_data['sku'] || '';
                            var properties = json_data['properties'] || '';
                            var obj = {};
                            obj['locid'] = location;
                            obj['srch'] = srch;
                            obj['properties'] = properties;
                            obj['sku'] = sku;
                            obj['fromdate'] = fromDate;
                            obj['todate'] = toDate;
                            obj['page'] = page;
                            var formData = querystring.stringify(obj);
                            var optionsData = {
                                url: env_config.apiPath + constant.apis.GETPRODUCTPERFORMANCE,
                                method: 'POST',
                                body: formData,
                                headers: {
                                    'authorization': input.params.headers,
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                }
                            };
                            request(optionsData, function(error, response, data) {
                                if (error) {
                                    deffered.reject(error);
                                } else {
                                    try {
                                        var returnData = JSON.parse(data);
                                        var skuObj = JSON.parse(JSON.stringify(returnData.result));
                                    } catch (ex) {
                                        console.log("ERROR_:", ex);
                                        return rep.end({
                                            result: '',
                                            error: constant.label.PRO_PERFORMANCE_ERROR
                                        });
                                    }

                                    var prodSku = [];
                                    for (var i = skuObj.products.length - 1; i >= 0; i--) {
                                        if(skuObj.products[i].hasOwnProperty('skus') && skuObj.products[i].skus != ''){
                                            prodSku = skuObj.products[i].skus;
                                        }
                                    }

                                    var skuData = new Array();
                                    var returnDataArray = return_data.product.skus;
                                    returnDataArray.forEach(function(dataObj) {
                                        prodSku.forEach(function(prodData) {
                                            if (dataObj.sku == prodData.sku) {
                                                dataObj.receiveddata = prodData.receiveddata;
                                                dataObj.Replenishment = prodData.Replenishment;
                                                dataObj.returneddata = prodData.returneddata;
                                                dataObj.solddata = prodData.solddata;
                                                dataObj.sold = prodData.totalsold;
                                                dataObj.returned = prodData.totalreturned;
                                                dataObj.received = prodData.totalreceived || 0;
                                            }
                                        });
                                    });
                                    return_data.product.skus = returnDataArray;
                                    deffered.resolve(return_data);
                                }
                            });
                            // }
                            // else
                            //     deffered.resolve({'status' : 'No Data'});
                            return deffered.promise;
                        }
                        var getSkuValue = function(y) {
                            if (skus.length > 0) {
                                var sku = skus[y];
                                // var options = {
                                //     url: env_config.apiPath + constant.apis.INVENTORIESSERVICE + location + "&sku=" + sku.sku,
                                //     headers: {
                                //         'authorization': header
                                //     }
                                // };
                                // console.log("url", env_config.apiPath + constant.apis.INVENTORIESSERVICE + location + "&sku=" + sku.sku);
                                // request(options, function(err, data) {
                                // console.log("data['body']", data['body']);
                                // data = JSON.parse(data['body']);
                                // if (data.length > 0) {
                                //     return_data.product.skus[y].oh = data[0].oh;
                                // } else {
                                // return_data.product.skus[y].oh = 0;
                                // } 
                                //return_data.product.skus[y].oh = result[sku.sku] ? result[sku.sku].oh.value : 0;
                                if (json_data['module'] == 'analytics') {
                                    var promise1 = getSKUDATA();
                                    promise1.then(function(return_data) {
                                        // return_data.product.skus[y].oh = (result[sku.sku] && result[sku.sku].oh) ? result[sku.sku].oh.value : 0;
                                        // if (y + 1 == skus.length) {
                                        console.timeEnd('skus');
                                        console.timeEnd('data');
                                        return rep.end({
                                            result: return_data,
                                            error: err
                                        });
                                        // } else {
                                        //     console.log("y + 1", y + 1);
                                        //     return getSkuValue(y + 1);
                                        // } 
                                    }).catch(function(error) {
                                        return rep.end({
                                            error: constant.label.ERROR
                                        });
                                    }).done();
                                } else {
                                    // for (var d = 0; d < sku_misc.length; d++) {
                                    //     if (return_data.product.skus[y].sku == sku_misc[d]['sku']) {
                                    //         return_data.product.skus[y].oh = (sku_misc[d]['oh']);
                                    //     } else {
                                    //         return_data.product.skus[y].oh = 0;
                                    //     }
                                    // }
                                    if (sku_misc[return_data.product.skus[y].sku] && sku_misc[return_data.product.skus[y].sku]['oh']) {
                                        return_data.product.skus[y].oh = sku_misc[return_data.product.skus[y].sku]['oh'].value ?
                                                                            sku_misc[return_data.product.skus[y].sku]['oh'].value :
                                                                            0;
                                    }
                                    // return_data.product.skus[y].oh = (result[sku.sku] && result[sku.sku].oh) ? result[sku.sku].oh.value : 0;
                                    if (y + 1 == skus.length) {
                                        console.timeEnd('skus');
                                        console.timeEnd('data');
                                        console.log('------------------------------');
                                            console.log('worker pomatrixdata done - ',JSON.stringify(return_data));
                                        console.log('------------------------------');
                                        return rep.end({
                                            result: return_data,
                                            error: err
                                        });
                                    } else {
                                        console.log("y + 1", y + 1);
                                        return getSkuValue(y + 1);
                                    }
                                }
                                // });
                                /*inventoryavailabilityManger.getSkuValue({
                                    loc: location,
                                    sku: sku.sku
                                }, function(err, data) {
                                    if (data.length > 0) {
                                        // for (var n = 0; n < data.length; n++) {
                                        //     if (data[n].sku in return_data) {
                                        //         return_data[data[n].sku]['qtyStatus'][data[n].qtyStatus] = data[n].qty;
                                        //     } else {}
                                        // }
                                        console.log(data);
                                        return_data.product.skus[y].oh = data[0].value;
                                    } else {
                                        return_data.product.skus[y].oh = 0;
                                    }
                                    if (y + 1 == skus.length) {
                                        return rep.end({
                                            result: return_data,
                                            error: err
                                        });
                                    } else {
                                        getSkuValue(y + 1);
                                    }
                                    //console.log(return_data);
                                });*/
                            } else {
                                return rep.end({
                                    result: '',
                                    error: constant.label.NO_SKUS
                                });
                            }
                        };
                        // });
                    }
                } else {
                    return rep.end({
                        result: {'status' : 'No Data'},
                        error: err
                    });
                }
            });
            break;
        case 'updatebalanceType':
            var json_data = JSON.parse(input.params.balanceTypeData);
            inventoryavailabilityManger.checkAvailability({
                "sku": json_data.sku,
                "locationId": json_data.location,
                "balanceType": balanceTypeData.balanceType,
                "value": balanceTypeData.value,
                "user": input.params.user
            }, function(err, data) {
                return rep.end({
                    result: 'Successfully Completed',
                    error: err
                });
            });
            break;
        case 'getPoAsn':
            shipmentManger.getPoAsn(input.params.searchData, input.params.headers, function(err, data) {
                return rep.end({
                    result: data,
                    error: err
                });
            });
            break;
        case 'reverseIBTOrders':
            shipmentManger.reverseIBTOrders(input.params.reverseData, input.params.headers, function(err, directiveData) {
                if (directiveData) {
                    async.eachSeries(directiveData, function(directiveObj, asynccallback) {
                        CreateTran(directiveObj, function(errr, success, data) {
                            asynccallback()
                        });
                    }, function() {
                        return rep.end({
                            result: directiveData,
                            error: err
                        });
                    });
                }
            });
            break;
        case 'getStatus':
            log.info('getStatus');
            mongodb.getreadystate(function(state) {
                po_asnModel.findOne(function(err, location) {
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
        case 'awsPublish':
                awsManager.sendMessage(input.params.Data, function(err, data) {
                    return rep.end({
                        result: data,
                        error: err
                    });
                });
           
            break;
        case 'awsReceive':
                awsManager.receiveMessage(input.params.Data, function(err, data) {
                    return rep.end({
                        result: data,
                        error: err
                    });
                });
            break;
        case 'uploadBalanceReport':
                awsManager.uploadBalanceReport(input.params.Data, function(err, data) {
                    return rep.end({
                        result: data,
                        error: err
                    });
                });
            break;
        case 'uploadStatusReport':
                awsManager.uploadStatusReport(input.params.Data, function(err, data) {
                    return rep.end({
                        result: data,
                        error: err
                    });
                });
            break;
        case 'getDownloads':
                downloadManager.getDownloads(input.params.Data, function(err, data) {
                    if(data &&input.params.Data.download){
                        try {
                            var pathKey=`${(data.result.data.downloadType)}/${data.result.data.userId}/${data.result.data.fileName}`;
                            awsManager.getDownload(pathKey, function(err, download) {
                                return rep.end({
                                    result: {fileName:data.result.data.fileName,data:download},
                                    error: err
                                });
                            });
                        } catch (e) {
                            console.log(e);
                            return rep.end({
                                error: 'Can not download.'
                            });
                        }
                        
                    }else {
                        console.log({
                            result: data,
                            error: err.errors
                        });
                        return rep.end({
                            result: data,
                            error: err.errors
                        });
                    }
                });
            break;
        case 'updateDownloads':
                downloadManager.updateDownloads(input.params.Data, function(err, data) {
                    return rep.end({
                        result: data,
                        error: err
                    });
                });
            break;
        case 'deleteDownloads':
            downloadManager.deleteDownloads(input.params.Data, function(err, data) {
                return rep.end({
                    result: data,
                    error: err
                });
            });
            break;
    }
});
module.exports = {
    start: function() {
        log.info('Starting worker, broker ' + env_config.brokerHost + '...');
        worker.start();
        erpManager.createCron();
    }
};