var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var env_config = require('../../config/config');

var connection = mongoose.createConnection(env_config.dbConn); 
autoIncrement.initialize(connection);

// countItem table Schema
var countItemSchema = new mongoose.Schema({
	
	_id: { type: String },
	countId: { type: Number },
	zoneId: { type: String },
	operatorId: { type: String },
	deviceId: { type: String },
	recountType: { type: String },
	countStatus: { type: String },
	productCode: { type: String },
	sku: { type: String },
	partnerProductId: { type: String },
	uom: { type: String },
	qty: { type: Number },
	oh: { type: Number },
	damagedQty: { type: Number },
	prevCountQty: { type: Number },
	lineNumber: { type: Number },
	comment: { type: String },
	badScan: { type: Number },
	noApproval: { type: Boolean, default : false },
	created: { type: Date, default: Date.now  },
	createdBy: { type: String},
    updatedBy: { type: String},
	lastModified: { type: Date, default: Date.now  },
	isDeleted: { type: Boolean , default : false }

},{ collection: 'count_item' });

countItemSchema.plugin(autoIncrement.plugin, {   
    model: 'count_item',
    field: '_id',
    startAt: 10000,
    incrementBy: 1
});

module.exports = mongoose.model('countItem', countItemSchema);
