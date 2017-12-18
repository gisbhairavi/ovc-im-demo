var express = require('express');
var log = require('../log');
var vendorModel  = require('./../model/vendorModel');
var router = express.Router();

module.exports = {
  getVendor: getVendor,
  createVendor: createVendor,
  editVendor: editVendor,
  deleteVendor: deleteVendor
};


/*
 * GET vendor by vendorId or serachkey.
 */
function getVendor(userInput, callback) {
  var id = userInput['id'];
  var vendors = userInput['vendors'];
  var key = userInput['name'];
  var isPrimaryVendor = userInput['isPrimaryVendor'];
  if(id) {
    vendorModel.findById(id).exec(callback);
  }else if(key) {    
    vendorModel.find({ $or: [ { companyName: new RegExp('^.*?'+key+'.*?$', "i") }, 
    { companyCode: new RegExp('^.*?'+key+'.*?$', "i") }, { accountNumber: new RegExp('^.*?'+key+'.*?$', "i") },
    { address1: new RegExp('^.*?'+key+'.*?$', "i") }, { address2: new RegExp('^.*?'+key+'.*?$', "i") }, 
    { purchasingDepartment: new RegExp('^.*?'+key+'.*?$', "i") } ] , isDeleted: false }).exec(callback);   
  
  }else if(vendors) {    
    console.log(vendors);
    vendorModel.find({ _id:  { $in: vendors }, isDeleted: false }).exec(callback);

  }else if(isPrimaryVendor && ((isPrimaryVendor == true) || (isPrimaryVendor == 'true'))) {
    vendorModel.find({ "primarysupplier" : true, isDeleted: false }).exec(callback);   
 
  }else {
    vendorModel.find({isDeleted: false}).exec(callback);
  }
}

/*
 * create vendor.
 */
function createVendor(userInput, callback) {
  userInput['createdBy']=userInput.user.clientId;
  userInput['updatedBy']=userInput.user.clientId;
  var companyName = userInput['companyName'];
  var companyCode = userInput['companyCode'];
  vendorModel.find({isDeleted:false, companyName:companyName}, function(error, vendorData) {
    if (vendorData) {
      if (vendorData.length > 0) {
        return callback('Vendor Name should be unique', null)
      } else {
        var vendor = new vendorModel(userInput);
        vendor.save(callback);
      }
    }
  });
}


/*
 * edit vendor by vendorId.
 */
function editVendor(id, userInput, callback) {
  userInput['updatedBy']=userInput.user.clientId;
  vendorModel.findById(id).exec(function(err, data) {
    if(data) {
      vendorModel.find({isDeleted: false, _id : {"$ne": data._id}}).exec(function(error, vendorData) {
        var isDuplicate = false;
        for(var i in vendorData) {
          if(userInput.companyName == vendorData[i]['companyName']) {
            isDuplicate =true;
          } 
        }
        if(isDuplicate) {return callback('Vendor Name should be unique', null);}
          else {
            var vendor = vendorModel.findById(id);
            vendor.update(userInput, callback);
          }
      });
    }
  });
}

/*
 * delete vendor by vendorId.
 */
function deleteVendor(data, callback){  
  var vendor = vendorModel.findById(data.id);
    vendor.update({
      isDeleted: true,
      user: data.user
    }, callback);  
};

