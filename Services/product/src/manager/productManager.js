var express = require('express');
var log = require('../log');
var productModel = require('./../model/productModel');
var router = express.Router();
var constant = require('../../config/const.json');
var env_config = require('../../config/config.js');
var async = require('async');
var request = require('request');
module.exports = {
    getVendorProductByVendor: getVendorProductByVendor,
    addAllproduct: addAllproduct,
    editVendorproductByVendor: editVendorproductByVendor,
    deleteVendorProduct: deleteVendorProduct,
    activateVendorProduct: activateVendorProduct,
    getVendorByProduct: getVendorByProduct
};

function canParseJson(data) {
    if (data && /^[\],:{}\s]*$/.test(data.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
        //the json is ok
        return true;
    } else {
        //the json is not ok
        return false;
    }
}
/*
 * GET vendor product list by vendorId.
 */
function getVendorProductByVendor(userInput, callback) {
    var vendorid = userInput['vendorid'];
    var key = userInput['vendorSKU'];
    var srch_key = userInput['srch_key'];
    var productCode = userInput['productCode'];
    var isDropdown = userInput['isDropdown'];
    var condition = {};
    var result_data = [];

    var offset  =   0;
    var lmt     =   0;
    if (userInput['offset'] && userInput['lmt']) {
        offset  =   parseInt(userInput['offset']) || 0;
        lmt     =   parseInt(userInput['lmt']) || 100;
    }
    if( vendorid || key || productCode)
    {
        if (vendorid && !key && !isDropdown) {
            condition = {
                vendorId: vendorid,
                isDeleted: false
            }
        } else if (vendorid && key) {
            condition = {
                $and: [{
                    vendorId: vendorid
                }, {
                    isActive: true
                }, {
                    isDeleted: false
                }, {
                    $or: [{
                        vendorSKU: new RegExp('^.*?' + key + '.*?$', "i")
                    }, {
                        barCode: new RegExp('^.*?' + key + '.*?$', "i")
                    }]
                }]
            }
        } else if (vendorid && productCode) {
            condition = {
                $and: [{
                    vendorId: vendorid
                }, {
                    isDeleted: false
                }, {
                    isActive: true
                }, {
                    productCode: new RegExp('^.*?' + productCode + '.*?$', "i")
                }]
            }
        } else if (vendorid && srch_key) {
            condition = {
                $and: [{
                    vendorId: vendorid
                }, {
                    isDeleted: false
                }, {
                    isActive: true
                }, {
                    $or: [{
                        vendorSKU: new RegExp('^.*?' + srch_key + '.*?$', "i")
                    }, {
                        barCode: new RegExp('^.*?' + srch_key + '.*?$', "i")
                    }, {
                        productCode: new RegExp('^.*?' + srch_key + '.*?$', "i")
                    }]
                }]
            }
        }
        productModel.find(condition).count().exec(function(err, TotalCount){
            if(!err){
                if(isDropdown && ((isDropdown == "true") || (isDropdown == true))){
                    TotalCount = 0;
                    lmt        = 20; 
                }
                productModel.find(condition).sort({
                    'lastModified': -1
                }).skip(offset).limit(lmt).exec(function(err, ProductData) {
                    if(isDropdown && ((isDropdown == "true") || (isDropdown == true))){
                        callback(err, ProductData );
                    }
                    else {
                        callback(err, {
                            ProductData:  ProductData,
                            total_count: TotalCount
                        });
                    }
                });
                // chunkVendorProduct(condition, TotalCount, offset, lmt, function( err, allVendorProductData ){
                //     if(allVendorProductData){
                //         callback(err, allVendorProductData );
                //     }
                // });
            }
        })
            
    }
}

/***********************************************************************
 *
 * FUNCTION:    chunkVendorProduct
 *
 * DESCRIPTION: To chunk the products data.
 *
 * PARAMETERS:  query, TotalCount, offset, lmt and product_callback.
 *
 * RETURNED:    vendor product data.
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         22/09/2016    1.0.0       First Version
 *
 ***********************************************************************/
function chunkVendorProduct(query, TotalCount, offset, lmt, product_callback){
    var result_arr = [];
    var skip = 0;
    try{
        for (skip = offset; skip <= TotalCount; skip = skip + lmt) {
            productModel.find(query).sort({
                'lastModified': -1
            }).skip(skip).limit(lmt).exec(function(errr, product_data) {
                // var pushData = JSON.parse(JSON.stringify(product_data));
                result_arr = result_arr.concat(product_data);
                if (product_data.length == 0 || product_data.length <= lmt) {
                    product_callback('', result_arr);
                }
            });
        }
    }
    catch(e){
        return product_callback(e, {status : "error",message: "failed to get vendor product"});
    }
}
/*
 * add/remove product by vendorId.
 */
function editVendorproductByVendor(vendorid, userInput, callback) {
    var vendorproducts = userInput.vendorproducts;
    if (Array.isArray(vendorproducts)) {
        for (var n = 0; n < vendorproducts.length; n++) {
            vendorproducts[n]['createdBy'] = userInput.user.clientId;
            vendorproducts[n]['updatedBy'] = userInput.user.clientId;
            var product = new productModel(vendorproducts[n]);
            if (n == vendorproducts.length - 1) {
                product.save(callback);
            } else {
                product.save();
            }
        };
    } else {
        vendorproducts['createdBy'] = userInput.user.clientId;
        vendorproducts['updatedBy'] = userInput.user.clientId;
        var product = new productModel(vendorproducts);
        product.save(callback);
    }
}
/*
 * add/remove product by vendorId.
 */
function addAllproduct(vendorid, addcallback) {
    var productData = new Array();
    var jsonData = new Array();
    async.series([
        function(callback) {
            var products = [];
            var totalPage = 1;
            var totalProducts = 1;
            var pageLimit = 300;
            var pageArray = [];
            var url = env_config.dashPath + constant.apis.GETVENDORPRODUCTS + constant.pagination.PAGE + 1;
            log.debug("url : " + url + " products.lenght now : " + productData.length);
            request(url, function(error, response, data) {
                if (canParseJson(data)) {
                    var data = JSON.parse(data);
                    if (data.status == "error") {
                        //return if the response is empty or no products
                        callback(data, products);
                    }
                    if (data.TotalCount && data.TotalCount.TotalPages) {
                        totalPage = data.TotalCount.TotalPages;
                        totalProducts = data.TotalCount.TotalProducts;
                        getProducts(data);
                        for (var n = 2; n <= totalPage; n++) {
                            pageArray.push(n);
                        };
                        pageLimit = productData.length;
                        // log.debug('pageArray', pageArray);
                        // Return total records to be update as the response
                        addcallback(error, {
                            "ok": 1,
                            "n": totalProducts
                                // "n": totalPage * pageLimit
                        });
                        // Db update and other calculation will be doing as the background process.
                        // for (var n in pageArray) {
                        async.forEachLimit(pageArray, 5, function(n, asynccallback) {
                            var url2 = env_config.dashPath + constant.apis.GETVENDORPRODUCTS + constant.pagination.PAGE + n;
                            // var second = function(url2, data) {
                            request(url2, function(error, response, data) {
                                if (canParseJson(data)) {
                                    var data = JSON.parse(data);
                                    var allskus = [];
                                    getProducts(data);
                                    // if (n == totalPage) {
                                    asynccallback(error, products);
                                    // }
                                    // } else {
                                }
                            });
                            // }
                            console.log("url : " + url2 + " products.lenght now : " + productData.length);
                            log.debug("url : " + url2 + " products.lenght now : " + productData.length);
                            // second(url2, data);
                        }, function(err) {
                            callback(error, productData);
                        });
                        // };
                    } else {
                        callback(error, products);
                        addcallback('No Product Data Found');
                    }
                } else {
                    callback(error, products);
                    addcallback('No Product Data Found');
                }
            });
            var getProducts = function(data) {
                for (var n in data) {
                    if (n != "TotalCount") {
                        // console.log(data[n]);
                        var sku = data[n];
                        if (sku.ProductTbl) {
                            try {
                                prod_json = JSON.parse(sku.ProductTbl.prod_json);
                            } catch (e) {
                                prod_json = {};
                            }
                            var newsku = {
                                "vendorId": vendorid,
                                "productId": sku.ProductTbl.id,
                                "vendorSKU": sku.ProductTbl.sku,
                                "productCode": prod_json.productId
                            };
                            // new productModel(newsku).save();
                            productData.push(newsku);
                        }
                    }
                }
            }
        }
    ], function(err, result) {
        if (err) {
            console.log('err', err);
            return;
        }
        productData = result[0];
        if (productData.length > 0) {
            console.log('has :' + productData.length);
            productModel.remove({
                "vendorId": vendorid
            }, function(err, data) {
                productModel.create(productData, function(err, data) {
                    console.log(err);
                });
            });
        } else {}
    });
}
/*
 * active / inactive vendor product by id.
 */
function activateVendorProduct(userInput, callback) {
    var id = userInput['id'];
    var ids = id.split(',');
    var isactive = userInput['isactive'] == '1';
    for (var i = 0; i < ids.length; i++) {
        editVendorProduct(ids[i], {
            isActive: isactive,
            user: userInput.user
        }, callback, i == ids.length - 1);
    };
};
/*
 * delete product by productId.
 */
function deleteVendorProduct(data, callback) {
    var ids = data.id.split(',');
    for (var i = 0; i < ids.length; i++) {
        editVendorProduct(ids[i], {
            isDeleted: true,
            user: data.user
        }, callback, i == ids.length - 1);
    };
};
/*
 * edit product by productId.
 */
function editVendorProduct(id, userInput, callback, flag) {
    userInput['updatedBy'] = userInput.user.clientId;
    var product = productModel.findById(id);
    if (product) {
        product.update(userInput, function(err, product) {
            if (err) {
                callback(err);
                return;
            }
            if (flag) {
                callback(product);
            }
        });
    }
}
/*
 * GET vendor product list by vendorId.
 */
function getVendorByProduct(userInput, headers, callback) {
    var key = userInput['vendorSKUs'];
    if (key) {
        productModel.find({
            vendorSKU: {
                $in: key.split(',')
            },
            isDeleted: false,
            isActive: true
        }).exec(function(err, data) {
            if (err) {
                return callback('');
            }
            var vendordata = {};
            var vendorsarr = [];
            var vendorsdata = [];
            for (var j = 0, length2 = data.length; j < length2; j++) {
                vendordata[data[j].vendorSKU] = [];
                vendorsarr.push(data[j].vendorId);
                vendorsdata[data[j].vendorSKU] ? [] : vendorsdata[data[j].vendorSKU] = [];
                vendorsdata[data[j].vendorSKU].push(data[j].vendorId);
            }
            var dataobj = {};
            dataobj['vendors'] = vendorsarr;
            console.log(vendorsarr.length);
            if (Object.keys(vendordata).length) {
                var formData = require('querystring').stringify(dataobj);
                var contentLength = formData.length;
                var options = {
                    url: env_config.apiPath + constant.apis.GETVENDOR,
                    method: 'POST',
                    body: formData,
                    headers: {
                        'authorization': headers,
                        'Content-Length': contentLength,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }
                };
                // console.log('authorization' + input.params.headers);
                request(options, function(err, response, data) {
                    console.log(env_config.apiPath + constant.apis.GETVENDOR, dataobj);
                    console.log(err, data);
                    console.log('asynccallback', options, data);
                    try {
                        var vendors = JSON.parse(data);
                    } catch (e) {
                        var vendors = [];
                    }
                    for (var j = 0; j < vendors.length; j++) {
                        Object.keys(vendorsdata).forEach(function(vendorSKU) {
                            for (var vendor = 0; vendor < vendorsdata[vendorSKU].length; vendor++) {
                                if (vendorsdata[vendorSKU][vendor] == vendors[j]['_id']) {
                                    if (vendordata[vendorSKU].indexOf( vendors[j] ) == -1)
                                        vendordata[vendorSKU].push(vendors[j]);
                                }
                            }
                        });
                    }
                    callback ? callback(err, vendordata) : '';
                });
            } else {
                callback('No SKUs.')
            }
        });
    } else {
        callback('No SKUs.')
    }
}
/*
 * delete vendor product by vendorId.
 */
/*function deleteVendorproductByVendor(vendorid){
  productModel.find({ vendorId: vendorid }, function (err, productArray) {
        productArray.forEach( function ( product ) {
        product.remove({});
        });
  });
};*/