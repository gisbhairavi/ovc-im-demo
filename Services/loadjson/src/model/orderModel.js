var mongoose = require('mongoose');

// order table Schema
var orderSchema = new mongoose.Schema({
    
    location: { type: String },
    parentLocation: { type: String },       
    purchaseOrderNumber: { type: String },
    erpPurchaseOrder: { type: String, default: null},
    purchaseOrderDate: { type: Date, default: Date.now  },
    purchaseOrderType: { type: String },
    directiveId: { type: String },
    vendorId: { type: String },
    FromLocation: { type: String },
    shipToLocation: { type: String },
    billTo: { type: String, default: null  },
    shippingMethod: { type: String, default: null  },
    markForLocation: { type: String },
    contactName: { type: String },
    toStreetName: { type: String },
    toStreetNumber: { type: String },
    toCity: { type: String },
    toPostalCode: { type: String },
    toCountry: { type: String },
    toPhoneNumber: { type: String },
    consolidatedOrderId: { type: String },
    userId: { type: String },
    orderStatus: { type: String },
    numberOfProducts: { type: Number },
    numberOfSKU: { type: Number },
    PoSubtotal: { type: Number },
    PoSubtotalConfirm: { type: Number },
    PoSubtotalAsn: { type: Number },
    erpNotes: { type: String },
    totalPoCost: { type: Number },
    totalPoCostConfirm: { type: Number },
    totalPoCostAsn: { type: Number },
    totalPoVAT: { type: Number },
    totalPoTax: { type: Number },
    totalPoVATConfirm: { type: Number },
    totalPoTaxConfirm: { type: Number },
    totalPoVATAsn: { type: Number },
    totalPoTaxAsn: { type: Number },
    specialInstructions: { type: String },
    needByDate: { type: Number },
    created: { type: Date, default: Date.now  },
    createdBy: { type: String},
    updatedBy: { type: String},
    lastModified: { type: Date, default: Date.now  },
    isDeleted: { type: Boolean , default : false }
    
},{ collection: 'purchase_order' });

module.exports = mongoose.model('order', orderSchema);
