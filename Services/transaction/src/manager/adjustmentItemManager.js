var express =   require('express');
var async   =   require('async');
var lo = require('lodash');
var log  =  require('../log');
var adjustmentItemModel   =  require('./../model/adjustmentItemModel');
var adjustmentModel       =  require('./../model/adjustmentModel');
var adjustmentManager     =  require('./../manager/adjustmentManager');
var lo = require('lodash');
var router  =  express.Router();
var utils = require('./utils');

var env_config = require('../../config/config'); 
var constant  =  require('../../config/const.json');
var querystring = require('querystring');

lo.extend(module.exports, {
  getAdjustmentItem: getAdjustmentItem,
  createAdjustmentItem: createAdjustmentItem,
  editAdjustmentItem: editAdjustmentItem,
  deleteAdjustmentItem: deleteAdjustmentItem,
  updateDeletedAdjustItem: updateDeletedAdjustItem,
  checkAdjustmentItem: checkAdjustmentItem,
  copyAdjustmentItem: copyAdjustmentItem,
  jmsPublishCall: jmsPublishCall
});

/***********************************************************************
 *
 * FUNCTION:    getAdjustmentItem
 *
 * DESCRIPTION: To get AdjustmentItem for the userInput.
 *
 * PARAMETERS:  "userInput" and callback.
 *
 * RETURNED:    AdjustmentItem data
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         22/03/2016    1.0.0       First Version
 *
 ***********************************************************************/
function getAdjustmentItem(userInput, callback) {
    var id = userInput['id']; 
    var adjustmentNumber = userInput['adjustmentNumber'];
    var addOne  =   userInput['addOne'];
    var adjustment_data = userInput['adjustment_data'];
    var page_offset =   0;
    var page_lmt    =   0;

    if ((userInput['page_offset'] ||  userInput['page_offset'] === 0)&& (userInput['page_lmt'] || userInput['page_lmt'] === 0)) {
        page_offset =   parseInt(userInput['page_offset']) || 0;
        page_lmt    =   parseInt(userInput['page_lmt']) || 10;
    }

    var cond = {};
    cond['isDeleted'] = false;
    if(id) {
        adjustmentItemModel.findById(id).exec(callback);  
    }
    else if(adjustmentNumber) {
        cond['adjustmentNumber'] = adjustmentNumber;
        getPaginatedData(cond);
    }
    else {
        callback('No Adjustment Number Found');
    }

    function getPaginatedData(query) {
        adjustmentItemModel.find(query).count().exec(function(err, total_count) {
            adjustmentItemModel.find(query).sort({
                "lineNumber": 1
            }).skip(page_offset).limit(page_lmt).exec(function(err, itemData){
                callback(err, {
                    item_data: itemData,
                    total_count: total_count,
                    adjustment_data: adjustment_data,
                    current_offset: page_offset
                });
            });
        });
    }

}

// To check the no value and delete the non no value by Ratheesh.(23.8.2016).
var delNotNovalue = function(data, noArr) {
    for (var j = 0, length2 = noArr.length; j < length2; j++) {
        try {
            if (data[noArr[j]]) data[noArr[j]] = data[noArr[j]] || 0;
            else delete data[noArr[j]];
        } catch (e) {
            delete data[noArr[j]];
            console.log(e);
        }
    }
    return data;
};

function jmsPublishCall (adjustExportData, export_callback) {
    if (adjustExportData && adjustExportData.adjustmentNumber) {
        adjustmentItemModel.find({
            adjustmentNumber: adjustExportData.adjustmentNumber, 
            isDeleted: false
        },{
            _id: 0,
            lineNumber: 1,
            SKU: 1,
            qty: 1
        },function(err, itemData){

            if (itemData){

                try {
                    var strItemData = JSON.stringify(itemData);
                    strItemData = strItemData.replace(/SKU/g, 'sku');
                    itemData = JSON.parse(strItemData);
                }
                catch (ex) {
                    console.log("ERROR_:",ex);
                    return false;
                }
                if (adjustExportData.adjustment && adjustExportData.adjustment[0])
                    adjustExportData.adjustment[0].adjustmentItem   =   itemData;
            }
            export_callback(err, adjustExportData);

        });
    }
}

/****************************************************************************************
 *
 * FUNCTION:    createAdjustmentItem
 *
 * DESCRIPTION: To create AdjustmentItem for the userInput.
 *
 * PARAMETERS:  "userInput" and callback.
 *
 * RETURNED:    ""
 *
 * REVISION HISTORY:
 *
 *  Name        Date            Version     Description 
 *  ----        ----            -------     -----------
 *  Arun        22/03/2016      1.0.0       First Version
 *  Arun        09/02/2016      1.0.1       Modified to support inserting Array of data 
 *
 *****************************************************************************************/
function createAdjustmentItem(userInput, callback) {

    var adjustmentNumber    =   (userInput['arrData'] && userInput['arrData'][0])
                                    ? userInput['arrData'][0]['adjustmentNumber']
                                    : '';
    var adjustmentStatus    =   (userInput['arrData'] && userInput['arrData'][0])
                                    ? userInput['arrData'][0]['adjustmentStatus']
                                    : '';

    if (userInput['adjustmentNumber'])
        adjustmentNumber = userInput['adjustmentNumber'];

    if (userInput['adjustmentStatus'])
        adjustmentStatus = userInput['adjustmentStatus'];

    //checking for the availability for the adjustment
    adjustmentModel.findOne({
        adjustmentNumber: adjustmentNumber,
        isDeleted: false
    }, function(error, data) {
        if (!error) {
            if (!data) {
                callback({error:"No Adjustment Found"});
            }
            else {
                // var noArr = ['productCost', 'productTax', 'productVat', 'totalProductCost','totalProductTax','totalProductVat'];
                // delNotNovalue(userInput, noArr);
                var adjustSaveArr   =   [];

                async.forEach(userInput['arrData'], function(adjustObj, asynccallback) {
                    try {
                        var adjustmentItem  =  new adjustmentItemModel(adjustObj);
                        userInput['adjustmentNumber'] ? adjustmentItem['adjustmentNumber'] = userInput['adjustmentNumber'] : '';
                        adjustmentItem['createdBy']  =  userInput.user ? userInput.user.clientId : null;
                        adjustmentItem['updatedBy']  =  userInput.user ? userInput.user.clientId : null;

                        //using toObject() function to support collection.insert
                        adjustSaveArr.push(adjustmentItem.toObject());
                        asynccallback();
                    }
                    catch (e) {
                        console.log("Error_:",e);
                        return callback(e);
                    }
                }, function() {
                    adjustmentItemModel.collection.insert(adjustSaveArr, {}, afterInsert);
                });

                //Constructing transaction data after insert item data
                function afterInsert(err, savedData) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        var tranArr =   [];
                        if (savedData && savedData['ops']){
                            async.forEach(savedData['ops'], function(adjustItem, async_callback) {

                                var dataobj  =  {};

                                dataobj.sku                 =   adjustItem['SKU'];
                                dataobj.adjustmentNumber    =   adjustItem['adjustmentNumber'];
                                dataobj.locationid          =   data['storeId'];
                                dataobj.quantity            =   adjustItem['qty'];
                                dataobj.cost                =   adjustItem['productCost'];
                                dataobj.warehouseid         =   data['storeId'];
                                dataobj.transtypeid         =   data['adjustmentName'];
                                dataobj.stockUOM            =   adjustItem['producUom'];

                                tranArr.push(dataobj);
                                async_callback();

                            }, function() {
                                var resultObj = {};
                                resultObj.result    =   savedData['result'];
                                resultObj.adjustmentStatus  =    adjustmentStatus;
                                resultObj.tranArr   =   tranArr;
                                if (userInput['exportData']) {
                                    if (env_config.JMS_QUEUE_ADJUST_EXPORT) {
                                        jmsPublishCall(userInput['exportData'], function(err, exportData){
                                            resultObj.exportData   =   exportData;
                                            callback("", resultObj);
                                        });
                                    }
                                    else {
                                        console.log("Queue name undefined - JMS_QUEUE_ADJUST_EXPORT");
                                         callback("", resultObj);
                                    }
                                }
                                else
                                    callback("", resultObj);

                            });
                        }

                    }
                }

            }
        }
        else{
            callback(error);
        }
    });
}

/***********************************************************************
 *
 * FUNCTION:    editAdjustmentItem
 *
 * DESCRIPTION: To edit AdjustmentItem.
 *
 * PARAMETERS:  "id", "userInput" and callback.
 *
 * RETURNED:    "".
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         22/03/2016    1.0.0       First Version
 *
 ***********************************************************************/
function editAdjustmentItem(id, userInput, callback) {

    var result = {};
    result.tranArr =   [];
    result.adjustmentStatus    =   (userInput['arrData'] && userInput['arrData'][0])
                                    ? userInput['arrData'][0]['adjustmentStatus']
                                    : '';
    async.forEach(userInput['arrData'], function(adjustObj, asynccallback) {
        var adjustmentStatus  =  userInput['adjustmentStatus'];

        //constructing data object to push in response data
        var dataobj  =  {};

        dataobj.sku                 =   adjustObj['SKU'];
        dataobj.adjustmentNumber    =   adjustObj['adjustmentNumber'];
        dataobj.locationid          =   adjustObj['storeId'];
        dataobj.quantity            =   parseFloat(adjustObj['qty']);
        dataobj.cost                =   adjustObj['productCost'];
        dataobj.warehouseid         =   adjustObj['storeId'];
        dataobj.transtypeid         =   adjustObj['transtypeid'];
        dataobj.lineNumber          =   adjustObj['lineNumber'];

        adjustObj['updatedBy']  =   userInput.user ? userInput.user.clientId : undefined;
        var adjustmentItem      =   adjustmentItemModel.findById(adjustObj._id);
        if(adjustmentItem){
        
            var noArr   =   ['productCost', 'productTax', 'productVat', 'totalProductCost','totalProductTax','totalProductVat'];
            delNotNovalue(adjustObj, noArr);
            adjustmentItem.update(adjustObj, function(err, data){
                if (err)
                    return callback(err);
                result.tranArr.push(dataobj);
                asynccallback();
            });
            
        }
    }, function () {
        if (userInput['exportData']) {
            if (env_config.JMS_QUEUE_ADJUST_EXPORT) {
                jmsPublishCall(userInput['exportData'], function(err, exportData){
                    result.exportData   =   exportData;
                    callback(err, result);
                });
            }
            else {
                console.log("Queue name undefined - JMS_QUEUE_ADJUST_EXPORT");
                callback(null, result);
            }
        }
        else {
            callback(null, result);
        }
    });
}

/***********************************************************************
 *
 * FUNCTION:    deleteAdjustmentItem
 *
 * DESCRIPTION: To delete AdjustmentItem.
 *
 * PARAMETERS:  data" and callback.
 *
 * RETURNED:    "".
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         22/03/2016    1.0.0       First Version
 *
 ***********************************************************************/
function updateDeletedAdjustItem(data, callback){
  adjustmentModel.find({
    adjustmentNumber: data.adjustmentNumber,
    adjustmentStatus: 'Draft' || 'rvs_draft'
  }).exec(function(err, adjustment) {
    adjustmentItemModel.update({
        adjustmentNumber: data.adjustmentNumber,
        isDeleted: false
    }, {
        isDeleted: true,
        updatedBy: data.user.clientId
    }, {
        multi: true
    }).exec(function(e, s) {
        adjustmentModel.update({
            reversalAdjustmentNumber: data.id,
        }, {
            $set: {
                adjustmentStatus: 'Adjusted',
                isReversed: false
            }
        },callback);
    });
  });   
};

function deleteAdjustmentItem(data, callback){    
    // editAdjustmentItem(data.id, {isDeleted:true, user: data.user}, callback);
    var adjustmentItem      =   adjustmentItemModel.findById(data.id);
    var set = {};
    set['isDeleted'] = true;
    if (data.user)
        set['updatedBy']  =   data.user ? data.user.clientId : undefined;
    if(adjustmentItem){
        adjustmentItem.update(set, function(err, item_data){
            if (err)
                return callback(err);
            if (data['page_lmt'] && (data['page_offset'] !== null || ata['page_offset'] !== undefined) && data['adjustmentNumber']) {
                recalcAdjustmentData(data, callback);
            }
            else {
                callback(err, item_data);
            }
        });
    }
}

/**********************************************************************************
 *
 * FUNCTION:    checkAdjustmentItem
 *
 * DESCRIPTION: Save item changes automaticlly.
 *
 * PARAMETERS:  page_offset, page_limit, item_data, adjustment_data and callback.
 *
 * RETURNED:    current_offset, page_limit, item_data, adjustment_data.
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         17/07/2017    1.0.0       First Version
 *
 **********************************************************************************/
function checkAdjustmentItem(adjustmentValue, callback) {

    if(adjustmentValue.adjustmentItem){
        try{
            var payload  = JSON.parse(adjustmentValue.adjustmentItem);
        }catch(err){
            utils.errorTrace(err);
            return callback(err);
        }
    }else{
        return callback('No item data found');
    }
    

    var adjustNumber    =   null;
    var page_offset     =   0;
    var page_lmt        =   0;
    var itemCount      =   payload['item_count'] ? parseInt(payload['item_count']) : 0;
    var isFileUpload    =   (payload['fileUpload'] === 'true' || payload['fileUpload'] === true);
    if (payload['page_offset'] && payload['page_lmt']) {
        page_lmt    =   parseInt(payload['page_lmt']) || 10;
    }

    //SKU price calculations
    function doItemCalc (itemData) {
        var proPrice    =   parseFloat(itemData.purchasePrice);
        var taxVal     =   parseFloat(itemData.vatPercentage) / 100;
        var totProCost  =   parseFloat(itemData.qty) * proPrice;
        var proTax      =   proPrice * taxVal;
        var totProTax   =   totProCost * taxVal;

        itemData.isVat              =   itemData.isVat;
        itemData.productCost        =   proPrice;
        itemData.totalProductCost   =   totProCost;
        itemData.productTax         =   itemData.isVat === '0' ? proTax : 0;
        itemData.productVat         =   itemData.isVat === '1' ? proTax : 0;
        itemData.totalProductTax    =   itemData.isVat === '0' ? totProTax: 0;
        itemData.totalProductVat    =   itemData.isVat === '1' ? totProTax: 0;
    }

    //updates the existing SKU valuse for the input
    function updateItemData(itemData, newItem, callback) {

        if(newItem.qty < 0){
            newItem.qty    =   0;
        } //adding 1 qty for adding sku manualy
        else if (isFileUpload){
            newItem.qty    =   itemData.qty + parseFloat(newItem.qty); //updating with the existing SKU qty for fileUpload
        }

        //saving the adjustment item data
        itemData    =   lo.extend(itemData, newItem);
        doItemCalc (itemData);
        itemData.save(callback);
    }

    // Update the existing items with the input values 
    function updateExistingItem (offset, newItem, itemCallback) {

        //Recursion function for find the given SKU's offset
        function checkSKUoffset(offset, newItem) {
            adjustmentItemModel.find({
                adjustmentNumber: newItem.adjustmentNumber ? newItem.adjustmentNumber : adjustNumber,
                isDeleted: false
            }).skip(offset).limit(page_lmt).exec(function(err, itemData) {

                if (err)
                    return callback(err);

                var hasSKU   =  false;
                var skuFound =  null;
                for (var i = itemData.length - 1; i >= 0; i--) {
                    if (itemData[i].SKU === newItem.SKU){
                        hasSKU      =   true;
                        skuFound    =   itemData[i];
                    }
                }
                if (hasSKU){

                    if (!isFileUpload)
                        page_offset = offset; //Setting the SKU's offset

                    updateItemData(skuFound, newItem, function(){
                        itemCallback();
                    });
                }
                else
                    checkSKUoffset(offset+page_lmt, newItem)
            });
        }
        checkSKUoffset(offset, newItem);

    }

    //Saves new adjustment item
    function saveAdjustItem(itemData, itemCallback) {
        adjustmentItemModel.findOne({
            adjustmentNumber: itemData.adjustmentNumber ? itemData.adjustmentNumber : adjustNumber,
            isDeleted: false
        }).sort({lineNumber: -1}).exec(function(err,data){
            if (data) {
                itemData['lineNumber']  =   data.lineNumber + 1; //Setting the lineNumber +1 with existing max lineNumber
            }
            else {
                itemData['lineNumber']  =   1; //Setting the lineNumber as 1 for for first SKU
            }
            if (!itemData['qty'])
                itemData['qty'] = 1;  //Setting the dfault qty as 1
            if (!itemData['adjustmentNumber'])
                itemData['adjustmentNumber'] = adjustNumber;
            doItemCalc (itemData);
            var itemDataToSave  =   new adjustmentItemModel(itemData);
            itemDataToSave.save(function(err, savedData){
                if (err)
                    return callback(err);
                if (!isFileUpload)
                    page_offset     =   Math.floor(itemCount/page_lmt) * page_lmt; //calculate page_offset ffor the added SKU
                itemCallback();
            });
        })
    }

    //Iterates through all adjustment items
    function iterateItemData () {
        async.eachSeries(payload.item_data, function(adjustItem, asyncCallback){
            var sku                 =   adjustItem['SKU'];
            var adjustmentNumber    =   adjustItem['adjustmentNumber'] ? adjustItem['adjustmentNumber'] : adjustNumber;

            adjustmentItemModel.findOne({
                adjustmentNumber: adjustmentNumber,
                SKU: sku,
                isDeleted: false
            }, function(err, itemData) {
                if (err)
                    return callback(err);
                if (itemData) {
                    updateExistingItem(page_offset, adjustItem, function(){
                        asyncCallback();
                    });
                }
                else {
                    saveAdjustItem(adjustItem, function(){
                        asyncCallback();
                    });
                }
            });

        }, function(){
            if (!payload.adjustmentNumber)
                payload.adjustmentNumber    =   adjustNumber;
            payload.page_offset         =   page_offset;
            recalcAdjustmentData(payload, callback);
        });
    }

    //Insert new adjustment and iterates item data
    if (payload.adjustment_data) {
        payload.adjustment_data.user = payload.user;
        adjustmentManager.createAdjustment(payload.adjustment_data, function(err, adjustData){

            if (err)
                return callback(err);

            adjustNumber = adjustData.adjustmentNumber
            iterateItemData();
        });
    }
    //just iterates the Item data
    else if (payload.item_data) {
        iterateItemData();
    }
}

/**********************************************************************************
 *
 * FUNCTION:    copyAdjustmentItem
 *
 * DESCRIPTION: copy and saves AdjustmentItems.
 *
 * PARAMETERS:  adjustmentNumber, page_offset, page_limit and callback.
 *
 * RETURNED:    current_offset, page_limit, item_data, adjustment_data.
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun         17/07/2017    1.0.0       First Version
 *
 **********************************************************************************/
function copyAdjustmentItem(payload, callback) {
    adjustmentItemModel.find({
        adjustmentNumber: payload.existAdjustment,
        isDeleted: false
    }, {
        _id: 0,
        adjustmentNumber: 0,
        createdBy: 0,
        updatedBy: 0,
        created: 0,
        lastModified: 0,
        __v: 0
    }, function (err, itemDataFound){
        if (err)
            return callback(err);
        if (itemDataFound && itemDataFound.length) {
            createAdjustmentItem({
                arrData: itemDataFound,
                user: payload.user,
                adjustmentNumber: payload.newAdjustment,
                adjustmentStatus: 'Draft'
            }, callback);
        } else {
            return callback(null, []);
        }
    });
}

function recalcAdjustmentData(payload, callback) {
    var data_to_set = {};
    data_to_set.updatedBy = payload.user ? payload.user.clientId : undefined;
    adjustmentItemModel.aggregate([
        {
            "$match": {
                adjustmentNumber: payload.adjustmentNumber,
                isDeleted: false
            }
        }, {
            $group: {
                _id: {
                    adjustmentNumber: "$adjustmentNumber"
                },
                "numberOfSKU": {
                    $sum: "$qty"
                },
                "totalAdjustmentCost": {
                    $sum: "$totalProductCost"
                },
                count: {
                    $sum: 1
                }
            }
        }
    ]).exec(function(err, item_data){
        if (err)
            return callback(err);
        if (item_data && item_data.length){
            data_to_set.numberOfProducts    =   item_data[0].count;
            data_to_set.numberOfSKU         =   item_data[0].numberOfSKU;
            data_to_set.totalAdjustmentCost =   item_data[0].totalAdjustmentCost;
        }
        else {
            data_to_set.numberOfProducts    =   0;
            data_to_set.numberOfSKU         =   0;
            data_to_set.totalAdjustmentCost =   0;
        }
        adjustmentModel.findOneAndUpdate({
            adjustmentNumber: payload.adjustmentNumber,
            isDeleted: false
        }, {
            $set: data_to_set
        },
        {
            new: true
        }, function(err, doc){
            if (err)
                return callback(err);
            getAdjustmentItem({
                adjustmentNumber: payload.adjustmentNumber,
                page_offset: payload.page_offset,
                page_lmt: payload.page_lmt,
                adjustment_data : doc,
                isFileUpload: payload.fileUpload
            }, callback);
        });
    });
}

