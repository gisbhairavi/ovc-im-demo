var mongoose = require('mongoose');

// replenishmentRequest table Schema
var replenishmentRequestSchema = new mongoose.Schema({

	requestNumber: { type: String },
	locationId: { type: String },
	fromLocation: { type: String },
	numberOfProducts: { type: String },
	totalRequestCost: { type: String },
	totalRequestVat: { type: String },
	status: { type: String },
	created: { type: Date, default: Date.now  },
	createdBy: { type: String},
    updatedBy: { type: String},
	lastModified: { type: Date, default: Date.now  },
	isDeleted: { type: Boolean , default : false }
	
},{ collection: 'replenishment_request' });

module.exports = mongoose.model('replenishmentRequest', replenishmentRequestSchema);
