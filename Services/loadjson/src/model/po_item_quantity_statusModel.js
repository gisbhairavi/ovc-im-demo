var mongoose = require('mongoose');

// po_item_quantity_status table Schema
var po_item_quantity_statusSchema = new mongoose.Schema({ 
  poId: { type: String },
  asnId: { type: String },
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
  location: { type: String}, 
  skuCost:{type:Number},
  skuCostAsn: { type: Number },
  skuCostConfirm: { type: Number },
  totalProductTaxConfirm: { type: Number },
  totalProductVatConfirm: { type: Number },
  totalProductTaxAsn: { type: Number },
  totalProductVatAsn: { type: Number },
  totalProductCostAsn: { type: Number },
  totalProductCostConfirm: { type: Number },
  reasonCode: { type: String, default: null},
  lineNumber: { type: Number },
  created: { type: Date, default: Date.now  },
  createdBy: { type: String},
  updatedBy: { type: String},
  lastModified: { type: Date, default: Date.now },
  isDeleted: { type: Boolean , default : false }
},{ collection: 'po_item_quantity_status' });

//po_item_quantity_status, default: null

module.exports = mongoose.model('po_item_quantity_status', po_item_quantity_statusSchema);



