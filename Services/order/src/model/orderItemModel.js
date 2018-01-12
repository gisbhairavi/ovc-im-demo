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
	qty: { type: Number },
	qtyType: { type: String },	
	receiptNumber: { type: String },
	receiptReleaseNumber: { type: String },
	productStatus: { type: String },
	productCode: { type: String },
	// length: { type: Number},
	// waist: { type: Number},
	// size: { type: String},
	styleColor: { type: String},
	lineNumber: { type: Number },
	purPrices: [
		{
		"currencyIso": { type: String },
		"value":{ type: Number }
		}
	],
	originalOrder: { type: Boolean , default : true },
	created: { type: Date, default: Date.now  },
	createdBy: { type: String},
	updatedBy: { type: String},
	lastModified: { type: Date, default: Date.now  },
	isDeleted: { type: Boolean , default : false }

},{ collection: 'purchase_order_item' });

module.exports = mongoose.model('orderItem', orderItemSchema);
