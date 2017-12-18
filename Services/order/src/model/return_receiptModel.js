var mongoose = require('mongoose');

// order table Schema
var orderSchema = new mongoose.Schema({
	
	location: { type: String },
   	parentLocation: { type: String },
   	purchaseOrderNumber: { type: String },
   	orderNumber: { type: String },
   	rmaNumber: { type: String },
    erpPurchaseOrder: { type: String, default: null},
	purchaseOrderDate: { type: Date, default: Date.now  },
	purchaseOrderType: { type: String },
	directiveId: { type: String },
	vendorId: { type: String },
	FromLocation: { type: String },
	shipToLocation: { type: String },
    billTo: { type: String, default: null  },
    shippingMethod: { type: String, default: null  },
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
	numberOfPackages: { type: Number },
	numberOfSKU: { type: Number },
	PoSubtotal: { type: Number },
	totalPoCost: { type: Number },
	totalPoVAT: { type: Number },
	totalPoTax: { type: Number },
	specialInstructions: { type: String },
	orderType: { type: String , required: true},
	created: { type: Date, default: Date.now  },
	lastModified: { type: Date, default: Date.now  },
	isDeleted: { type: Boolean , default : false },
	createdBy: {type: String },
	updatedBy: {type: String } ,
	asnReferenceNumber: {type: String},
	reasonCodeId:{type:String}
},{ collection: 'purchase_order' });

module.exports = mongoose.model('return_receiptorder', orderSchema);
