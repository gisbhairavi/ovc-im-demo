var mongoose = require('mongoose');

// count_zone table Schema
var countZoneSchema = new mongoose.Schema({
	id:{type: String},
	countId: { type: String },
	zoneBarcode: { type: String },
	operatorId: { type: String },
	deviceId: { type: String },
	comment: { type: String },
	recountType: { type: String },
	countStatus: { type: String },
	skuQty: { type: Number },
	recountNumber:{type: Number,default : 1},
    noApproval: { type: Boolean , default : false},
	handCountQty: { type: Number },
	scanQty: { type: Number },
	createdBy: { type: String},
	updatedBy: { type: String},
	created: { type: Date, default: Date.now  },
	lastModified: { type: Date, default: Date.now  },
	isDeleted: { type: Boolean , default : false }
	
},{ collection: 'count_zone' });

module.exports = mongoose.model('count_zone', countZoneSchema);
