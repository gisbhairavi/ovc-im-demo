var mongoose = require('mongoose');

// po_item_quantity_status table Schema
var return_receipt_quantity_statusSchema = new mongoose.Schema({ 
  asnId: { type: String },
  poId: { type: String },
  packageId: { type: String, default: null},
  sku: { type: String, default: null},  
  qtyStatus: { type: String, default: null},
  // itemForceClosedReasonCode: { type: String, default: null},  
  // itemOnHoldReasonCode: { type: String, default: null},
  qty: { type: Number}, 
  purPrices: [
    {
    "currencyIso": { type: String },
    "value":{ type: Number }
    }
  ],
  orderNumber: {type: String},
  skuCost:{type:Number},   
  skuCostConfirm: { type: Number },
  skuCostAsn: { type: Number },
  reasonCode: { type: String, default: null},
  lineNumber: { type: Number },
  created: { type: Date, default: Date.now  },
  lastModified: { type: Date, default: Date.now },
  createdBy: {type: String },
  updatedBy: {type: String },
  isDeleted: { type: Boolean , default : false },
  location: {type: String} 
},{ collection: 'po_item_quantity_status' });

//po_item_quantity_status, default: null

module.exports = mongoose.model('return_receipt_item_quantity_status', return_receipt_quantity_statusSchema);



