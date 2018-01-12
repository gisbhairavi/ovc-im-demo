var Client = require('pigato').Client;
var config = require('../../config/app.json');
var env_config = require('../../config/config');

var client = new Client(env_config.brokerHost);
client.start();

client.on('error', function(e) {
  console.log('PIGATO CLIENT ERROR', e);
});

function getHealthCheckClientRequest(service, op, params, callback) {
  client.request(
    service,
    {op: op, params: params},
    null,
    function(err, data) {
      if (err) {
        console.error(err);
        return callback(err);
      }
      callback(data.error, data.result);
    }
    ,
    {timeout: 500}
  );
}
function clientRequest(service, op, params, callback) {
  client.request(
    service,
    {op: op, params: params},
    null,
    function(err, data) {
      if (err) {
        console.error(err);
        return callback(err);
      }
      callback(data.error, data.result);
    }
    ,
    {timeout: 1000000}
  );
}

module.exports = {
  vendor: {
    getVendor: function(vendorData, callback) {
      clientRequest('vendor', 'getVendor', {vendorData: vendorData}, callback);
    },
    createVendor: function(vendorData, callback) {
      clientRequest('vendor', 'createVendor', {vendorData: vendorData}, callback);
    },
    editVendor: function(id, vendorData, callback) {      
      clientRequest('vendor', 'editVendor', {id: id,vendorData: vendorData}, callback);
    },
    deleteVendor: function(id, callback) {
      clientRequest('vendor', 'deleteVendor', {id: id}, callback);
    }
  },


  vendorproduct: {
    getVendorProductByVendor: function(vendorProductData, callback) {
      clientRequest('vendorproduct', 'getVendorProductByVendor', {vendorProductData: vendorProductData }, callback);
    },
    addAllproduct: function(vendorProductData, callback) {
      clientRequest('vendorproduct', 'addAllproduct', {vendorProductData: vendorProductData }, callback);
    },
    editVendorproductByVendor: function(vendorid, vendorProductData, callback) {
      clientRequest('vendorproduct', 'editVendorproductByVendor', {vendorid: vendorid, vendorProductData: vendorProductData}, callback);
    },
    deleteVendorProduct: function(id, callback) {
      clientRequest('vendorproduct', 'deleteVendorProduct', {id: id}, callback);
    },
    activateVendorProduct: function(vendorProductData, callback) {
      clientRequest('vendorproduct', 'activateVendorProduct', {vendorProductData: vendorProductData}, callback);
    },
    getVendorByProduct: function(vendorProductData,headers, callback) {
      clientRequest('vendorproduct', 'getVendorByProduct', {vendorProductData: vendorProductData , headers: headers}, callback);
    }
  },

  location: {
    getLocation: function(locationData, callback) {
      clientRequest('location', 'getLocation', {locationData: locationData}, callback);
    },
    createLocation: function(locationData, callback) {
      clientRequest('location', 'createLocation', {locationData: locationData}, callback);
    },
    editLocation: function(id, locationData, callback) {      
      clientRequest('location', 'editLocation', {id: id,locationData: locationData}, callback);
    },
    deleteLocation: function(id, callback) {
      clientRequest('location', 'deleteLocation', {id: id}, callback);
    },
    getLocationitem: function(locationData, callback) {
      clientRequest('locationitem', 'getLocationitem', {locationData: locationData}, callback);
    },
    createLocationitem: function(locationData, callback) {
      clientRequest('locationitem', 'createLocationitem', {locationData: locationData}, callback);
    },
    editLocationitem: function(id, locationData, callback) {      
      clientRequest('locationitem', 'editLocationitem', {id: id,locationData: locationData}, callback);
    },
    deleteLocationitem: function(id, callback) {
      clientRequest('locationitem', 'deleteLocationitem', {id: id}, callback);
    },
    hierarchyLocations: function(data, callback) {
      clientRequest('location', 'hierarchyLocations', {data: data}, callback);
    }
  },

  transactiontype: {
    getTransactionType: function(transactiontypeData, callback) {
      clientRequest('transactiontype', 'getTransactionType', {transactiontypeData: transactiontypeData}, callback);
    },
    createTransactionType: function(transactiontypeData, callback) {
      clientRequest('transactiontype', 'createTransactionType', {transactiontypeData: transactiontypeData}, callback);
    },
    editTransactionType: function(id, transactiontypeData, callback) {      
      clientRequest('transactiontype', 'editTransactionType', {id: id,transactiontypeData: transactiontypeData}, callback);
    },
    deleteTransactionType: function(id, callback) {
      clientRequest('transactiontype', 'deleteTransactionType', {id: id}, callback);
    }
  },
  transactionrule: {
    getTransactionRule: function(transactionruleData, callback) {
      clientRequest('transactionrule', 'getTransactionRule', {transactionruleData: transactionruleData}, callback);
    },
    createTransactionRule: function(transactionruleData, callback) {
      clientRequest('transactionrule', 'createTransactionRule', {transactionruleData: transactionruleData}, callback);
    },
    editTransactionRule: function(id, transactionruleData, callback) {      
      clientRequest('transactionrule', 'editTransactionRule', {id: id,transactionruleData: transactionruleData}, callback);
    },
    deleteTransactionRule: function(id, callback) {
      clientRequest('transactionrule', 'deleteTransactionRule', {id: id}, callback);
    }
  },
  
  invtransactionservice: {    
    createInvtransactionservice: function(invtransactionserviceData, headers, callback) {      
      clientRequest('invtransactionservice', 'createInvtransactionservice', {invtransactionserviceData: invtransactionserviceData, headers:headers}, callback);
    },
    getInventories: function(invtransactionserviceData, callback) {      
      clientRequest('invtransactionservice', 'getInventories', {invtransactionserviceData: invtransactionserviceData}, callback);
    },
    getInventoryReports: function(invtransactionserviceData, callback) {      
      clientRequest('invtransactionservice', 'getInventoryReports', {invtransactionserviceData: invtransactionserviceData}, callback);
    },
    getOHSKU: function(Data, callback) {      
      clientRequest('invtransactionservice', 'getOHSKU', {Data: Data}, callback);
    }
  },
  // inventory: {    
  //   getInventories: function(inventoryData, callback) {      
  //     clientRequest('inventory', 'getInventories', {inventoryData: inventoryData}, callback);
  //   }
  // },
  uom: {
    getUom: function(uomData, callback) {
      clientRequest('uom', 'getUom', {uomData: uomData}, callback);
    },
    createUom: function(uomData, callback) {
      clientRequest('uom', 'createUom', {uomData: uomData}, callback);
    },
    editUom: function(id, uomData, callback) {      
      clientRequest('uom', 'editUom', {id: id,uomData: uomData}, callback);
    },
    deleteUom: function(id, callback) {
      clientRequest('uom', 'deleteUom', {id: id}, callback);
    }
  },

 documentrule: {
    getDocumentrule: function(documentruleData, callback) {
      clientRequest('documentrule', 'getDocumentrule', {documentruleData: documentruleData}, callback);
    },
    createDocumentrule: function(documentruleData, callback) {
      clientRequest('documentrule', 'createDocumentrule', {documentruleData: documentruleData}, callback);
    },
    editDocumentrule: function(id, documentruleData, callback) {      
      clientRequest('documentrule', 'editDocumentrule', {id: id,documentruleData: documentruleData}, callback);
    },
    deleteDocumentrule: function(id, callback) {
      clientRequest('documentrule', 'deleteDocumentrule', {id: id}, callback);
    }
  },

  documenttype: {
    getDocumenttype: function(documenttypeData, callback) {
      clientRequest('documenttype', 'getDocumenttype', {documenttypeData: documenttypeData}, callback);
    },
    createDocumenttype: function(documenttypeData, callback) {
      clientRequest('documenttype', 'createDocumenttype', {documenttypeData: documenttypeData}, callback);
    },
    editDocumenttype: function(id, documenttypeData, callback) {      
      clientRequest('documenttype', 'editDocumenttype', {id: id,documenttypeData: documenttypeData}, callback);
    },
    deleteDocumenttype: function(id, callback) {
      clientRequest('documenttype', 'deleteDocumenttype', {id: id}, callback);
    }
  },
 
  transaction: {
    getTransaction: function(transactionData, callback) {
      clientRequest('transaction', 'getTransaction', {transactionData: transactionData}, callback);
    },
    createTransaction: function(transactionData, callback) {
      clientRequest('transaction', 'createTransaction', {transactionData: transactionData}, callback);
    },
    editTransaction: function(id, transactionData, callback) {      
      clientRequest('transaction', 'editTransaction', {id: id,transactionData: transactionData}, callback);
    },
    deleteTransaction: function(id, callback) {
      clientRequest('transaction', 'deleteTransaction', {id: id}, callback);
    },
    getTrantypeqtyData: function(transactionData, callback) {
      clientRequest('transaction', 'getTrantypeqtyData', {transactionData: transactionData}, callback);
    },
    getBalanceReport: function(searchData, callback) {
      clientRequest('transaction', 'getBalanceReport', {searchData: searchData}, callback);
    },
    getStatusReport: function(searchData, callback) {
      clientRequest('transaction', 'getStatusReport', {searchData: searchData}, callback);
    },
    getBalanceReportExcel: function(searchData, callback) {
      clientRequest('transaction', 'getBalanceReportExcel', {searchData: searchData}, callback);
    }
  },
 
  transactionitem: {
    getTransactionitem: function(transactionitemData, callback) {
      clientRequest('transactionitem', 'getTransactionitem', {transactionitemData: transactionitemData}, callback);
    },
    createTransactionitem: function(transactionitemData, callback) {
      clientRequest('transactionitem', 'createTransactionitem', {transactionitemData: transactionitemData}, callback);
    },
    editTransactionitem: function(id, transactionitemData, callback) {      
      clientRequest('transactionitem', 'editTransactionitem', {id: id,transactionitemData: transactionitemData}, callback);
    },
    deleteTransactionitem: function(id, callback) {
      clientRequest('transactionitem', 'deleteTransactionitem', {id: id}, callback);
    }
  },
  
  transactioniteminventory: {
    getTransactioniteminventory: function(transactioniteminventoryData, callback) {
      clientRequest('transactioniteminventory', 'getTransactioniteminventory', {transactioniteminventoryData: transactioniteminventoryData}, callback);
    },
    createTransactioniteminventory: function(transactioniteminventoryData, callback) {
      clientRequest('transactioniteminventory', 'createTransactioniteminventory', {transactioniteminventoryData: transactioniteminventoryData}, callback);
    },
    editTransactioniteminventory: function(id, transactioniteminventoryData, callback) {      
      clientRequest('transactioniteminventory', 'editTransactioniteminventory', {id: id,transactioniteminventoryData: transactioniteminventoryData}, callback);
    },
    deleteTransactioniteminventory: function(id, callback) {
      clientRequest('transactioniteminventory', 'deleteTransactioniteminventory', {id: id}, callback);
    },
    getLocationItemInventory: function(locationiteminventoryData, callback) 
    {
      clientRequest('transactioniteminventory', 'getLocationItemInventory', {locationiteminventoryData: locationiteminventoryData}, callback);
    }
  },

  adjustment: {
    getAdjustment: function(adjustmentData, callback) {
      clientRequest('adjustment', 'getAdjustment', {adjustmentData: adjustmentData}, callback);
    },
    createAdjustment: function(adjustmentData, callback) {
      clientRequest('adjustment', 'createAdjustment', {adjustmentData: adjustmentData}, callback);
    },
    editAdjustment: function(id, adjustmentData, headers, callback) {      
      clientRequest('adjustment', 'editAdjustment', {id: id,adjustmentData: adjustmentData, headers:headers}, callback);
    },
    deleteAdjustment: function(id, callback) {
      clientRequest('adjustment', 'deleteAdjustment', {id: id}, callback);
    },
    adjustmentReverse: function(adjustmentData, callback) { 
      clientRequest('adjustment', 'adjustmentReverse', {adjustmentData: adjustmentData}, callback);
    },
    getAdjustmentData: function(adjustmentData, callback) {
      clientRequest('adjustment', 'getAdjustmentData', {adjustmentData: adjustmentData}, callback);
    },
    copyAdjustment: function(adjustmentData, callback) {
      clientRequest('adjustment', 'copyAdjustment', {adjustmentData: adjustmentData}, callback);
    },
  },
 
  adjustmentItem: {
    getAdjustmentItem: function(adjustmentItemData, callback) {
      clientRequest('adjustmentItem', 'getAdjustmentItem', {adjustmentItemData: adjustmentItemData}, callback);
    },
    createAdjustmentItem: function(adjustmentItemData, headers, callback) {
      clientRequest('adjustmentItem', 'createAdjustmentItem', {adjustmentItemData: adjustmentItemData, headers: headers}, callback);
    },
    editAdjustmentItem: function(id, adjustmentItemData, headers, callback) {      
      clientRequest('adjustmentItem', 'editAdjustmentItem', {id: id,adjustmentItemData: adjustmentItemData, headers: headers}, callback);
    },
    checkAdjustmentItem: function(adjustmentItemData, callback) {      
      clientRequest('adjustmentItem', 'checkAdjustmentItem', {adjustmentItemData: adjustmentItemData}, callback);
    },
    deleteAdjustmentItem: function(id, callback) {
      clientRequest('adjustmentItem', 'deleteAdjustmentItem', {id: id}, callback);
    }
  },

  order: {
    getOrder: function(orderData, callback) {
      clientRequest('order', 'getOrder', {orderData: orderData}, callback);
    },
    getStatusReport: function(orderData, headers, callback) {
      clientRequest('order', 'getStatusReport', {orderData: orderData, headers: headers}, callback);
    },
    getSKUCosts: function(orderData, callback) {
      clientRequest('order', 'getSKUCosts', {orderData: orderData}, callback);
    },
    getProductPerformance: function(orderData, callback) {
      clientRequest('order', 'getProductPerformance', {orderData: orderData}, callback);
    },
    createOrder: function(orderData, callback) {
      clientRequest('order', 'createOrder', {orderData: orderData}, callback);
    },
    editOrder: function(id, orderData, headers, callback) {      
      clientRequest('order', 'editOrder', {id: id, orderData: orderData, headers: headers}, callback);
    },
    copyOrder: function(orderData, callback) {
      clientRequest('order', 'copyOrder', {orderData: orderData}, callback);
    },
    deleteOrder: function(id, headers, callback) {
      clientRequest('order', 'deleteOrder', {id: id, headers:headers}, callback);
    },
    getOrderNumbers: function(orderData, callback) {
      clientRequest('order', 'getOrderNumbers', {orderData: orderData}, callback);
    },
    cancelDraftOrder: function(orderData, headers, callback) {
      clientRequest('order', 'cancelDraftOrder', {orderData: orderData, headers:headers}, callback);
    },
    forceCloseOrder: function(orderData, headers, callback) {
      clientRequest('order', 'forceCloseOrder', {orderData: orderData, headers:headers}, callback);
    },
    getScheduler: function(orderData, header, callback) {
      clientRequest('order', 'getScheduler', {orderData: orderData, header: header}, callback);
    },
    runReplenishment: function(replenishmentFilterData,header,callback){
      clientRequest('order', 'runReplenishment', {replenishmentFilterData: replenishmentFilterData, header: header}, callback);
    },
    getOrdersSummary: function(orderData, callback) {
      clientRequest('order', 'getOrdersSummary', {orderData: orderData}, callback);
    },
    addorderSKU: function(orderData, headers, callback) {
      clientRequest('order', 'addorderSKU', {orderData: orderData, headers:headers}, callback);
    },
    api_updateCompleted: function(orderData, headers, callback) {
      clientRequest('order', 'api_updateCompleted', {orderData: orderData, headers:headers}, callback);
    }
  },

  orderItem: {
    getOrderItem: function(orderItemData, callback) {
      clientRequest('orderItem', 'getOrderItem', {orderItemData: orderItemData}, callback);
    },
    createOrderItem: function(orderItemData, header, callback) {
      clientRequest('orderItem', 'createOrderItem', {orderItemData: orderItemData, header: header}, callback);
    },
    editOrderItem: function(id, orderItemData, header, callback) {      
      clientRequest('orderItem', 'editOrderItem', {id: id, orderItemData: orderItemData, header: header}, callback);
    },
    deleteOrderItem: function(id, callback) {
      clientRequest('orderItem', 'deleteOrderItem', {id: id}, callback);
    },
    checkOrderItem: function(orderItemData, callback) {      
      clientRequest('orderItem', 'checkOrderItem', {orderItemData: orderItemData}, callback);
    }
  },
  dashboard: {
    getModuleIds      :   function(permissionData, callback){
      clientRequest('permission', 'getModuleIds', {permissionData: permissionData}, callback);
    },
    getAllPermissions :   function(permissionData, callback) {
      clientRequest('permission', 'getAllPermissions', {permissionData: permissionData}, callback);
    },
    saveRolePermissions:  function(permissionData, callback){
      clientRequest('permission', 'saveRolePermissions', {permissionData: permissionData}, callback);
    },
    getReplenishmentRules   :   function(replenishmentRulesData,callback){
      clientRequest('replenishmentRules', 'getReplenishmentRules', {replenishmentRulesData: replenishmentRulesData}, callback);
    },
    getReplenishmentRulesSku   :   function(replenishmentRulesData,callback){
      clientRequest('replenishmentRules', 'getReplenishmentRulesSku', {replenishmentRulesData: replenishmentRulesData}, callback);
    },
    saveReplenishmentRules   :   function(replenishmentRulesData,callback){
      clientRequest('replenishmentRules', 'saveReplenishmentRules', {replenishmentRulesData: replenishmentRulesData}, callback);
    },
    replenishmentRulesUpload:function(replenishmentRulesUploadData,headers,callback){
       clientRequest('replenishmentRules','replenishmentRulesUpload',{replenishmentRulesUpload:replenishmentRulesUploadData,headers:headers},callback);
    },
    replenishmentRulesReset:function(replenishmentRulesResetData,headers,callback){
       clientRequest('replenishmentRules','replenishmentRulesReset',{replenishmentRulesResetData:replenishmentRulesResetData,headers:headers},callback);
    },
    getConfig: function(configData, callback) {
      clientRequest('dashboard', 'getConfig', {configData: configData}, callback);
    },
    editConfig: function(locationId, configData, callback) {      
      clientRequest('dashboard', 'editConfig', {locationId: locationId,configData: configData}, callback);
    },
    resetToDefaultConfig: function(configData, callback) {      
      clientRequest('dashboard', 'resetToDefaultConfig', {locationId: configData.locationId,configData: configData}, callback);
    },
    getConfigByUser: function(configData, callback) {
      clientRequest('dashboard', 'getConfigByUser', {configData: configData}, callback);
    },
    getReasonCode: function(reasonCodeData, callback) {
      clientRequest('reasonCode', 'getReasonCode', {reasonCodeData: reasonCodeData}, callback);
    },
    createReasonCode: function(reasonCodeData, callback) {
      clientRequest('reasonCode', 'createReasonCode', {reasonCodeData: reasonCodeData}, callback);
    },
    editReasonCode: function(id, reasonCodeData, callback) {      
      clientRequest('reasonCode', 'editReasonCode', {_id: id,reasonCodeData: reasonCodeData}, callback);
    },
    deleteReasonCode: function(id, callback) {
      clientRequest('reasonCode', 'deleteReasonCode', {id: id}, callback);
    },
    getToken: function(Data, callback) {
      clientRequest('token', 'getToken', {Data: Data}, callback);
    },
    getCode: function(Data, callback) {
      clientRequest('token', 'getCode', {Data: Data}, callback);
    }
  },

  count: {
    getCount: function(countData, callback) {
      clientRequest('count', 'getCount', {countData: countData}, callback);
    },
    createCount: function(countData, callback) {
      clientRequest('count', 'createCount', {countData: countData}, callback);
    },
    editCount: function(id, countData, callback) {      
      clientRequest('count', 'editCount', {id: id,countData: countData}, callback);
    },
    deleteCount: function(id, callback) {
      clientRequest('count', 'deleteCount', {id: id}, callback);
    },
    uploadCountZone: function(countZoneData,header, callback) {
      clientRequest('count', 'uploadCountZone', {countZoneData: countZoneData, header: header}, callback);
    },
    addCountZone: function(countZoneData,header, callback) {
      clientRequest('count', 'addCountZone', {countZoneData: countZoneData, header: header}, callback);
    },
    createCountSnapshot: function(countData,header, callback) {
      clientRequest('count', 'createCountSnapshot', {countData: countData, header: header}, callback);
    },
    getcountSnapshot: function(countData,header, callback) {
      clientRequest('count', 'getcountSnapshot', {countData: countData, header: header}, callback);
    },
    addNewZone: function(countData,header, callback) {
      clientRequest('count', 'addNewZone', {countData: countData, header: header}, callback);
    }
  },

  countItem: {
    getCountItem: function(countItemData, callback) {
      clientRequest('countItem', 'getCountItem', {countItemData: countItemData}, callback);
    },
    getCountItemStatus: function(countItemData, callback) {
      clientRequest('countItem', 'getCountItemStatus', {countItemData: countItemData}, callback);
    },
    createCountItem: function(countItemData, header, callback) {
      clientRequest('countItem', 'createCountItem', {countItemData: countItemData, header: header}, callback);
    },
    editCountItem: function(id, countItemData, callback) {
      clientRequest('countItem', 'editCountItem', {id: id, countItemData: countItemData}, callback);
    },
    deleteCountItem: function(id, callback) {
      clientRequest('countItem', 'deleteCountItem', {id: id}, callback);
    }
  },

  review: {
    getReview: function(reviewData, callback) {
      clientRequest('review', 'getReview', {reviewData: reviewData}, callback);
    },
    approveCount: function(id, reviewData, callback) {
      clientRequest('review', 'approveCount', {id: id, reviewData: reviewData}, callback);
    }
  },

  history: {
    getTransactionHistory: function(transactionhistoryData, callback) {
      clientRequest('transactionhistory', 'getTransactionHistory', {transactionhistoryData: transactionhistoryData}, callback);
    },
    getTransactionitemHistory: function(transactionhistoryData, callback) {
      clientRequest('transactionhistory', 'getTransactionitemHistory', {transactionhistoryData: transactionhistoryData}, callback);
    },
    getTransactioniteminventoryHistory: function(transactionhistoryData, callback) {
      clientRequest('transactionhistory', 'getTransactioniteminventoryHistory', {transactionhistoryData: transactionhistoryData}, callback);
    },
    getStockBalances: function(transactionhistoryData, loc, headers, callback) {
      clientRequest('transactionhistory', 'getStockBalances', {transactionhistoryData: transactionhistoryData,loc:loc, headers: headers}, callback);
    }
  },

  directive: {
    getDirectiveMaster: function(directiveMasterData, callback) {
      clientRequest('directiveMaster', 'getDirectiveMaster', {directiveMasterData: directiveMasterData}, callback);
    },
    createDirectiveMaster: function(directiveMasterData, callback) {
      clientRequest('directiveMaster', 'createDirectiveMaster', {directiveMasterData: directiveMasterData}, callback);
    },
    editDirectiveMaster: function(id, directiveMasterData, callback) {      
      clientRequest('directiveMaster', 'editDirectiveMaster', {id: id,directiveMasterData: directiveMasterData}, callback);
    },
    deleteDirectiveMaster: function(id, callback) {
      clientRequest('directiveMaster', 'deleteDirectiveMaster', {id: id}, callback);
    }
  },

  directiveitem: {
    getDirectiveItem: function(directiveItemData, callback) {
      clientRequest('directiveItem', 'getDirectiveItem', {directiveItemData: directiveItemData}, callback);
    },
    createDirectiveItem: function(directiveItemData, callback) {
      clientRequest('directiveItem', 'createDirectiveItem', {directiveItemData: directiveItemData}, callback);
    },
    editDirectiveItem: function(id, directiveItemData, callback) {      
      clientRequest('directiveItem', 'editDirectiveItem', {id: id,directiveItemData: directiveItemData}, callback);
    },
    deleteDirectiveItem: function(id, callback) {
      clientRequest('directiveItem', 'deleteDirectiveItem', {id: id}, callback);
    }
  },

   countZone: {
    getCountZone: function(countZoneData, callback) {
      clientRequest('countZone', 'getCountZone', {countZoneData: countZoneData}, callback);
    },
    createCountZone: function(countZoneData, callback) {
      clientRequest('countZone', 'createCountZone', {countZoneData: countZoneData}, callback);
    },
    editCountZone: function(id, countZoneData, callback) {      
      clientRequest('countZone', 'editCountZone', {id: id,countZoneData: countZoneData}, callback);
    },
    deleteCountZone: function(id, callback) {
      clientRequest('countZone', 'deleteCountZone', {id: id}, callback);
    }
  },

  countItemQty: {
    getCountItemQty: function(countItemQtyData, callback) {
      clientRequest('countItemQty', 'getCountItemQty', {countItemQtyData: countItemQtyData}, callback);
    },
    createCountItemQty: function(countItemQtyData, callback) {
      clientRequest('countItemQty', 'createCountItemQty', {countItemQtyData: countItemQtyData}, callback);
    },
    editCountItemQty: function(id, countItemQtyData, callback) {      
      clientRequest('countItemQty', 'editCountItemQty', {id: id,countItemQtyData: countItemQtyData}, callback);
    },
    deleteCountItemQty: function(id, callback) {
      clientRequest('countItemQty', 'deleteCountItemQty', {id: id}, callback);
    }
  },

  recount: {
    recount: function(recountData, callback) {
      clientRequest('recount', 'recount', {recountData: recountData}, callback);
    },
  },

  replenishmentRequest: {
    getReplenishmentRequest: function(replenishmentRequestData, callback) {
      clientRequest('replenishmentRequest', 'getReplenishmentRequest', {replenishmentRequestData: replenishmentRequestData}, callback);
    },
    createReplenishmentRequest: function(replenishmentRequestData, callback) {
      clientRequest('replenishmentRequest', 'createReplenishmentRequest', {replenishmentRequestData: replenishmentRequestData}, callback);
    },
    editReplenishmentRequest: function(id, replenishmentRequestData, callback) {      
      clientRequest('replenishmentRequest', 'editReplenishmentRequest', {id: id,replenishmentRequestData: replenishmentRequestData}, callback);
    },
    deleteReplenishmentRequest: function(id, callback) {
      clientRequest('replenishmentRequest', 'deleteReplenishmentRequest', {id: id}, callback);
    }
  },

  replenishmentFilter: {
    getReplenishmentFilter: function(replenishmentFilterData, callback) {
      clientRequest('replenishmentFilter', 'getReplenishmentFilter', {replenishmentFilterData: replenishmentFilterData}, callback);
    },
    apiGetReplenishmentFilter: function(replenishmentFilterData, callback) {
      clientRequest('replenishmentFilter', 'apiGetReplenishmentFilter', {replenishmentFilterData: replenishmentFilterData}, callback);
    },
    createReplenishmentFilter: function(replenishmentFilterData, callback) {
      clientRequest('replenishmentFilter', 'createReplenishmentFilter', {replenishmentFilterData: replenishmentFilterData}, callback);
    },
    editReplenishmentFilter: function(id, replenishmentFilterData, callback) {      
      clientRequest('replenishmentFilter', 'editReplenishmentFilter', {id: id,replenishmentFilterData: replenishmentFilterData}, callback);
    },
    deleteReplenishmentFilter: function(id, callback) {
      clientRequest('replenishmentFilter', 'deleteReplenishmentFilter', {id: id}, callback);
    },
    apiCreateReplenishmentOrder: function(orderData, header, callback) {
      clientRequest('replenishmentFilter', 'apiCreateReplenishmentOrder', {orderData: orderData, header:header}, callback);
    }
  },
  
  replenishmentRequestItem: {
    getReplenishmentRequestItem: function(replenishmentRequestItemData, callback) {
      clientRequest('replenishmentRequestItem', 'getReplenishmentRequestItem', {replenishmentRequestItemData: replenishmentRequestItemData}, callback);
    },
    createReplenishmentRequestItem: function(replenishmentRequestItemData, callback) {
      clientRequest('replenishmentRequestItem', 'createReplenishmentRequestItem', {replenishmentRequestItemData: replenishmentRequestItemData}, callback);
    },
    editReplenishmentRequestItem: function(id, replenishmentRequestItemData, callback) {      
      clientRequest('replenishmentRequestItem', 'editReplenishmentRequestItem', {id: id,replenishmentRequestItemData: replenishmentRequestItemData}, callback);
    },
    deleteReplenishmentRequestItem: function(id, callback) {
      clientRequest('replenishmentRequestItem', 'deleteReplenishmentRequestItem', {id: id}, callback);
    }
  },

  jsons:{    
    uploadjson:function(jsonData,headers,callback){
        clientRequest('loadjson','uploadjson',{jsonData:jsonData,headers:headers},callback)
    },
    receivingpurchasejson:function(receivingpurchasejsonData,headers,callback){
       clientRequest('loadjson','receivingpurchasejson',{receivingpurchasejsonData:receivingpurchasejsonData,headers:headers},callback);
    },
    getshipment:function(purchaseData, headers, callback){
        clientRequest('loadjson','getshipment',{purchaseData:purchaseData,headers:headers},callback)
    },
    shipmentdata:function(shipmentdata,callback){
        clientRequest('loadjson','shipmentdata',{shipmentdata:shipmentdata},callback);
    },
    receivedpackage:function(receivedpackageData,headers,callback){
       clientRequest('loadjson','receivedpackage',{receivedpackageData:receivedpackageData,headers:headers},callback);
    },
    closedAsnPackage:function(closedAsnPackageData,headers,callback){
       clientRequest('loadjson','closedAsnPackage',{closedAsnPackageData:closedAsnPackageData,headers:headers},callback);
    },
	 reverseReceiptPackage:function(reverseReceiptPackageData,headers,callback){
       clientRequest('loadjson','reverseReceiptPackage',{reverseReceiptPackageData:reverseReceiptPackageData,headers:headers},callback);
    },
    createqtystatus:function(qtystatusdata,headers,callback){
       clientRequest('loadjson','createqtystatus',{qtystatusdata:qtystatusdata,headers:headers},callback);
    },
    countsuploadjson:function(jsonData,headers,callback){
        clientRequest('loadjson','countsuploadjson',{jsonData:jsonData,headers:headers},callback)
    },
    pomatrixdata:function(jsonData,headers,callback){
        clientRequest('loadjson','pomatrixdata',{jsonData:jsonData,headers:headers},callback)
    },
    updatebalanceType:function(balanceTypeData,headers,callback){
        clientRequest('loadjson','updatebalanceType',{balanceTypeData:balanceTypeData,headers:headers},callback)
    },
    getPoAsn:function(searchData, headers, callback){
        clientRequest('loadjson','getPoAsn',{searchData:searchData,headers:headers},callback)
    }
  },

  return: {
    getReturn: function(returnData, headers, callback) {
      clientRequest('return', 'getReturn', {orderData: returnData,headers:headers}, callback);
    },
    createReturn: function(returnData, headers, callback) {
      clientRequest('return', 'createReturn', {orderData: returnData,headers:headers}, callback);
    },
    editReturn: function(id, returnData, headers, callback) {      
      clientRequest('return', 'editReturn', {id: id,orderData: returnData,headers:headers}, callback);
    },
    returnPackageJson: function(returnData, headers, callback) {
      clientRequest('return', 'returnPackageJson', {orderData: returnData,headers:headers}, callback);
    },
    getReturnPackage: function(returnData, headers, callback) {
      clientRequest('return', 'getReturnPackage', {orderData: returnData,headers:headers}, callback);
    },
    deleteReturn: function(id, headers, callback) {
      clientRequest('return', 'deleteReturn', {id:id,headers:headers}, callback);
    },
    deleteReturnOrderSKU: function(returnData, headers, callback) {
      clientRequest('return', 'deleteReturnOrderSKU', {returnData: returnData,headers:headers}, callback);
    },
    deleteReturnPackage: function(returnData, headers, callback) {
      clientRequest('return', 'deleteReturnPackage', {returnData: returnData,headers:headers}, callback);
    },
    checkReturnData: function(returnData, headers, callback) {
      clientRequest('return', 'checkReturnData', {returnData: returnData,headers:headers}, callback);
    }
  },

receipt: {
   getReceipt: function(receiptData, callback) {
     clientRequest('receipt', 'getReceipt', {receiptData: receiptData}, callback);
   },
   createReceipt: function(receiptData, callback) {
     clientRequest('receipt', 'createReceipt', {receiptData: receiptData}, callback);
   },
    editReturn: function(id, receiptData, headers, callback) {      
      clientRequest('return', 'editReturn', {id: id,orderData: receiptData,headers:headers}, callback);
    },
   deleteReceipt: function(id, headers, callback) {
     clientRequest('receipt', 'deleteReceipt', {id: id, headers:headers}, callback);
   },
   getReceiptPackage: function(receiptPackageData, headers, callback) {
     clientRequest('receipt', 'getReceiptPackage', {receiptPackageData: receiptPackageData, headers:headers}, callback);
   },
   createReceiptPackage: function(receiptPackageData, headers, callback) {
     clientRequest('receipt', 'createReceiptPackage', {receiptPackageData: receiptPackageData, headers:headers}, callback);
   },
    deleteReceiptOrderSKU: function(receiptData, headers, callback) {
      clientRequest('return', 'deleteReturnOrderSKU', {receiptData: receiptData,headers:headers}, callback);
    },
   reverseManualReceipt: function(receiptPackageData, headers, callback) {
      clientRequest('receipt', 'reverseManualReceipt', {receiptPackageData: receiptPackageData, headers: headers}, callback);
   }
 },
 reverseOrders : {
  reverseIBTOrders: function(reverseData, headers, callback) {
     clientRequest('loadjson', 'reverseIBTOrders', {reverseData: reverseData,headers:headers}, callback);
   }
 },
  dropship: {
    getDropship: function(orderData, callback) {
      clientRequest('dropship', 'getDropship', {orderData: orderData}, callback);
    },
    createDropship: function(orderData, callback) {
      clientRequest('dropship', 'createDropship', {orderData: orderData}, callback);
    },
    editDropship: function(id, orderData, callback) {      
      clientRequest('dropship', 'editDropship', {id: id,orderData: orderData}, callback);
    },
    deleteDropship: function(orderData, headers, callback) {
      clientRequest('dropship', 'deleteDropship', {orderData: orderData, headers:headers}, callback);
      },
    getdropshipSKUs: function(orderData, callback) {
      clientRequest('dropship', 'getdropshipSKUs', {orderData: orderData}, callback);
    },
    createdropshipSKUs: function(orderData,headers, callback) {
      clientRequest('dropship', 'createdropshipSKUs', {orderData: orderData, headers:headers}, callback);
    },
    deletedropshipSKUs: function(orderData, headers, callback) {
      clientRequest('dropship', 'deletedropshipSKUs', {orderData: orderData, headers:headers}, callback);
      }
  },
  getHealthCheck: function(worker, headers, callback) {
      getHealthCheckClientRequest(worker, 'getStatus', {
          headers: headers
      }, callback);
  },
  download: {
      getDownloads: function(Data, callback) {
          clientRequest('loadjson', 'getDownloads', {
              Data: Data
          }, callback);
      },
      updateDownloads: function(Data, callback) {
          clientRequest('loadjson', 'updateDownloads', {
              Data: Data
          }, callback);
      },
      deleteDownloads: function(Data, callback) {
          clientRequest('loadjson', 'deleteDownloads', {
              Data: Data
          }, callback);
      },
  },
  aws: {
      awsPublish: function(Data, callback) {
          clientRequest('loadjson', 'awsPublish', {
              Data: Data
          }, callback);
      },
      awsReceive: function(Data, callback) {
          clientRequest('loadjson', 'awsReceive', {
              Data: Data
          }, callback);
      },
      uploadBalanceReport: function(Data, callback) {
          clientRequest('loadjson', 'uploadBalanceReport', {
              Data: Data
          }, callback);
      }
  }

};
