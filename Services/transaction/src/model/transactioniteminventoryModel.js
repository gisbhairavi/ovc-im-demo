var mongoose = require('mongoose');

// inventory availability table Schema
var transactioniteminventoryModel = new mongoose.Schema({ 
  tranId: { type: String },
  tranitemId: { type: String },
  productCode: { type: String },
  sku: { type: String },
  balanceType: { type: String},
  prevValue: { type: Number},
  newValue: { type: Number},    
  created: { type: Date, default: Date.now  },
  createdBy: { type: String},
  updatedBy: { type: String},
  lastModified: { type: Date, default: Date.now },
  isDeleted: { type: Boolean , default : false }
},{ collection: 'tran_item_inventory' });

module.exports = mongoose.model('transactioniteminventory', transactioniteminventoryModel);
