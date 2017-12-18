var mongoose = require('mongoose');

// adjustment_item table Schema
var adjustmentItemSchema = new mongoose.Schema({
	
	adjustmentNumber: { type: String },
	SKU: { type: String },	
	productName: { type: String },	
	producUom: { type: String },
	productCost: { type: Number },
	productTax: { type: Number },
	productVat: { type: Number },
    storeId: { type: String },
	isVat: { type: String },
	toPhoneNumber: { type: String },
	totalProductCost: { type: Number },
	totalProductTax: { type: Number },
	totalProductVat: { type: Number },
	qty: { type: Number },
	qtyType: { type: String },
	productStatus: { type: String },
	productCode: { type: String },
	length: { type: Number},
	waist: { type: Number},
	size: { type: String},
	styleColor: { type: String},
	styleDescription: { type: String},
	lineNumber: { type: Number },
	purPrices: [
		{
		"currencyIso": { type: String },
		"value":{ type: Number }
		}
	],
	WAC: {type: String},
	created: { type: Date, default: Date.now  },
	createdBy: { type: String},
	updatedBy: { type: String},
	lastModified: { type: Date, default: Date.now  },
	isDeleted: { type: Boolean , default : false }

},{ collection: 'adjustment_item' });

module.exports = mongoose.model('adjustmentItem', adjustmentItemSchema);
