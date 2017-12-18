var express = require('express');
var log = require('../log');
var orderModel  = require('./../model/orderModel');
var orderItemModel  = require('./../model/orderItemModel');
var constant = require('../../config/const.json');
var router = express.Router();
var request = require('request');
module.exports = {
  getOrderItem: getOrderItem,
  createOrderItem: createOrderItem,
  editOrderItem:editOrderItem,
  deleteOrderItem: deleteOrderItem
};


/*
 * GET orderItem by id.
 */
function getOrderItem(userInput, callback) {
  var id = userInput['id'];
  var purchaseOrderNumber      = userInput['purchaseordernumber'];
  var productStatus            = userInput['productStatus'];
  var sku                      = userInput['sku'];

  if(id) {
    orderItemModel.findById(id).exec(callback);      
   }else if(purchaseOrderNumber || productStatus){

    var query = JSON.parse('{"isDeleted" : false}');  
    if(purchaseOrderNumber){
    query['purchaseOrderNumber'] = purchaseOrderNumber;     
    }
    if( sku )
    {
      query['sku'] = sku;
    }
    if(productStatus){
    query['productStatus'] = new RegExp('^'+productStatus+'$', "i"); 
    }
    orderItemModel.find(query).exec(callback);
      
  }else{
     orderItemModel.find({isDeleted: false}).exec(callback);
   } 
}

/*
 * create orderItem.
 */
function createOrderItem(userInput, header, callback) {
 userInput['purchaseOrderNumber'] = userInput['purchaseOrderNumber'];
 userInput['createdBy']=userInput.user.clientId;
 userInput['updatedBy']=userInput.user.clientId;
   var orderItem = new orderItemModel(userInput);
   var purchaseOrderNumber = userInput['purchaseOrderNumber'];  
     orderModel.find({purchaseOrderNumber:purchaseOrderNumber ,isDeleted: false}, function(error,data){
        if(!error){
            var sku = userInput['SKU'];
            console.log("Query");
            orderItemModel.findOne({
                purchaseOrderNumber: purchaseOrderNumber,
                SKU: sku,
                isDeleted: false
            }, function( error, data){
                if (data) 
                {   
                    userInput['qty']                =   parseFloat(userInput['qty']) + parseFloat(data['qty']);
                    // userInput['productTax']         =   parseFloat(userInput['productTax']) + parseFloat(data['productTax']);
                    // userInput['productVat']         =   parseFloat(userInput['productVat']) + parseFloat(data['productVat']);
                    // userInput['productCost']        =   parseFloat(userInput['productCost']) + parseFloat(data['productCost']);
                    userInput['totalProductTax']    =   parseFloat(userInput['totalProductTax']) + parseFloat(data['totalProductTax']);
                    userInput['totalProductVat']    =   parseFloat(userInput['totalProductVat']) + parseFloat(data['totalProductVat']);
                    userInput['totalProductCost']   =   parseFloat(userInput['totalProductCost']) + parseFloat(data['totalProductCost']);
                    orderItemModel.update({
                        purchaseOrderNumber: purchaseOrderNumber,
                        SKU: sku,
                        isDeleted: false
                    }, userInput).exec( function( err, result ){
                        callback(err, result);
                    });
                }
                else
                {
                   orderItem.save(function(err,result){

                        // var dir = data[0]['directiveId'];
                        // var loc = data[0]['location'];
                        // var cost=userInput['productCost'];
                        // var qty=userInput['qty'];

                        callback(err,result);

                        /*var options = {
                          url: 'http://devsar.ovcdemo.com:3000/invtransactionservice',
                          headers: { 'authorization': header},
                          method: 'PUT',
                          form:  {'directivetype':dir,'locationid':loc,'sku':sku,'cost':cost,'quantity':qty}
                        };

                        request(options, function (err, response, body) {         
                          
                          if (!err && response.statusCode == 200) {
                            body = JSON.parse(body);
                            if(body["status"] == 'error'){
                             callback(err,null);
                            }else{
                             callback(err,body); 
                           }
                          }else {
                            console.log(err);
                          }

                    }) */// Request Call Ends.

                    });
                }
                
            });
        }else{
            console.log(error);
        }
    });   
}

/*
 * edit orderItem by id.
 */
function editOrderItem(id, userInput, callback) {
  var orderItem = orderItemModel.findById(id);
  var orderConfirmed = 0;
  var orderShipped = 0;
  var orderReceived = 0;
  var orderStatus = null;

  if(orderItem){
    orderItem.update(userInput,function(err, data){
      callback(err,data);
      orderItemModel.find({purchaseOrderNumber:userInput['purchaseOrderNumber'] ,isDeleted: false}, function(error, records){
        
        if(records.length > 0){

          for(var i=0; i<records.length; i++){
            if(records[i]['productStatus']){
              if(records[i]['productStatus'] == constant.status.CONFIRMEDQTY){
                orderConfirmed = orderConfirmed + 1;
              }else if(records[i]['productStatus'] == constant.status.SHIPPEDQTY){
                orderShipped = orderShipped + 1;
              }else if(records[i]['productStatus'] == constant.status.RECEIVEDQTY){
                orderReceived = orderReceived + 1;
              }
            }
          }
         
          if(orderConfirmed > 0 || orderShipped > 0 || orderReceived > 0){

           if(records.length == (orderConfirmed+orderShipped+orderReceived)) {
              orderStatus = constant.status.CONFIRMEDQTY;
            } 
            if(records.length == (orderShipped+orderReceived)) {
              orderStatus = constant.status.SHIPPEDQTY;
            }
            if(records.length == orderReceived) {
              orderStatus = constant.status.RECEIVEDQTY;
            }
            
            if(orderStatus != null){

              var query                  = {purchaseOrderNumber:userInput['purchaseOrderNumber']};
              var dataToInsert           = {orderStatus:orderStatus};

              orderModel.findOneAndUpdate(query, dataToInsert, {upsert:true},function(er,data2){
               
              });

            }
            
          }
        }
        
        
      });
    });
  }  
}

/*
 * delete orderItem by id.
 */
function deleteOrderItem(data, callback){  
  var orderItem = orderItemModel.findById(data.id);
  orderItem.update({isDeleted:true,user: data.user},callback);
};

