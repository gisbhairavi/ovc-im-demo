var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var env_config = require('../../config/config');

var connection = mongoose.createConnection(env_config.dbConn); 
autoIncrement.initialize(connection);

// Count Item Discrepancy  Schema
var countItemDiscrepancy = new mongoose.Schema({

	lineNumber: { type: Number },
	countId: { type: Number },
	sku: { type: String},
	zoneData: { type: mongoose.Schema.Types.Mixed, default:{} },
	qty: { type: Number },
	oh: { type: Number },
	discrepancy: { type: Number },
	created: { type: Date },
	lastModified: { type: Date },
	isDeleted: { type: Boolean , default : false }
	
}, { timestamps: { createdAt: 'created', updatedAt: 'lastModified' } });

// Count Sanpshot Schema
var countSnapshot = new mongoose.Schema({ 
  warehouseId: { type: String },
  locationId: { type: String, required: true},
  stockLocation: { type: String, default: ''},
  sku: { type: String, required: true},  
  stockUOM: { type: String},  
  balanceType: { type: String},
  value: { type: Number},
  created: { type: Date, default: Date.now  },
  createdBy: { type: String},
  updatedBy: { type: String},
  lastModified: { type: Date, default: Date.now },
  isActive: { type: Boolean , default : true }   
});

// count table Schema
var countsnapshotSchema = new mongoose.Schema({

	countId: { type: Number },
	// locationId: { type: String },
	count_snapshot: [countSnapshot],
	createdBy: { type: String},
  updatedBy: { type: String},
  // zoneUpload: { type: mongoose.Schema.Types.Mixed, default:{} },
  count_item_discrepancy: [countItemDiscrepancy],
	created: { type: Date, default: Date.now },
	lastModified: { type: Date, default: Date.now },
	isDeleted: { type: Boolean , default : false }
	
}, { collection: 'count_snapshot'});

countsnapshotSchema.plugin(autoIncrement.plugin, {   
    model: 'count_snapshot',
    field: '_id',
    startAt: 1000,
    incrementBy: 1
});

var countsnapshotSchema = mongoose.model('countsnapshotSchema', countsnapshotSchema, 'count_snapshot');
var countItemDiscrepancy = mongoose.model('countItemDiscrepancy', countItemDiscrepancy, 'count_snapshot');
var countSnapshot = mongoose.model('countSnapshot', countSnapshot, 'count_snapshot');

module.exports = {
    countItemDiscrepancy: countItemDiscrepancy,
    countsnapshotSchema: countsnapshotSchema,
    countSnapshot: countSnapshot
};
