var mongoose = require('mongoose');

// order table Schema
var orderSchema = new mongoose.Schema({
    
    location: { type: String },
    parentLocation: { type: String },       
    purchaseOrderNumber: { type: String },
    sourceNumber: { type: String },
    erpPurchaseOrder: { type: String, default: null},
    purchaseOrderDate: { type: Date, default: Date.now  },
    purchaseOrderType: { type: String },
    email: { type: String ,
    validate: function(email) {
      return /^[a-zA-Z0-9.!#$%&’*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email)|| email==''
    }
    },
    childOrder: { type: String },
    directiveId: { type: String },
    vendorId: { type: String },
    numberOfVendors: { type: String },
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
    numberOfStyles: { type: Number },
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
    created: { type: Date, default: Date.now  },
    createdBy: { type: String},
    updatedBy: { type: String},
    lastModified: { type: Date, default: Date.now  },
    orderType: { type: String , required: true},
    isDeleted: { type: Boolean , default : false }
    
},{ collection: 'purchase_order' });

module.exports = mongoose.model('dropship', orderSchema);
