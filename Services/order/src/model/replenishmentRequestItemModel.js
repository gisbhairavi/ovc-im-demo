var mongoose = require('mongoose');

// replenishmentRequestItem table Schema
var replenishmentRequestItemSchema = new mongoose.Schema({
	
	sku: { type: String },
	cost: { type: String },
	qty: { type: String },
	vat: { type: String },
	status: { type: String },	
	created: { type: Date, default: Date.now  },
	createdBy: { type: String},
    updatedBy: { type: String},
	lastModified: { type: Date, default: Date.now  },
	isDeleted: { type: Boolean , default : false }
	
},{ collection: 'replenishment_request_item' });

module.exports = mongoose.model('replenishmentRequestItem', replenishmentRequestItemSchema);
