var mongoose = require('mongoose');

// orderItem table Schema
var orderItemSchema = new mongoose.Schema({
	
	purchaseOrderNumber: { type: String },
	SKU: { type: String },	
	productName: { type: String },	
	producUom: { type: String },
	productCost: { type: Number },
	productTax: { type: Number },
	productVat: { type: Number },
	shipToLocation: { type: String },
	contactName: { type: String },
	toStreetName: { type: String },
	toStreetNumber: { type: String },
	toCity: { type: String },
	toPostalCode: { type: String },
	isVat: { type: String },
	toCountry: { type: String },
	toPhoneNumber: { type: String },
	totalProductCost: { type: Number },
	totalProductTax: { type: Number },
	totalProductVat: { type: Number },
	qty: { type: String },
	wac: { type: String },
	qtyType: { type: String },	
	receiptNumber: { type: String },
	receiptReleaseNumber: { type: String },
	lineNumber: { type: Number },
	orderNumber: {type: String},
	productStatus: { type: String },
	// length: { type: Number},
	// waist: { type: Number},
	// size: { type: String},
	styleColor: { type: String},
	productCode: { type: String },
	created: { type: Date, default: Date.now  },
	lastModified: { type: Date, default: Date.now  },
	isDeleted: { type: Boolean , default : false },
	createdBy: {type: String },
	updatedBy: {type: String }

},{ collection: 'purchase_order_item' });

module.exports = mongoose.model('return_receiptorderItem', orderItemSchema);
