var mongoose = require('mongoose');

var transactionitemSchema = new mongoose.Schema({ 
  tranId: { type: String },
  productCode: { type: String},
  sku: { type: String},    

  partnerProductCode: { type: String },

  qty: { type: Number},
  cost: { type: Number},
  comment: { type: String},
  uom: { type: String},

  fromStockingLocation: { type: String},
  toStockingLocation: { type: String},

  isDeleted: { type: Boolean , default : false },
  created: { type: Date, default: Date.now  },
  createdBy: { type: String},
  updatedBy: { type: String},
  lastModified: { type: Date, default: Date.now } 
},{ collection: 'tran_item' });

module.exports = mongoose.model('transactionitem', transactionitemSchema);