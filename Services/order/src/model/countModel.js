var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var env_config = require('../../config/config');

var connection = mongoose.createConnection(env_config.dbConn); 
autoIncrement.initialize(connection);

// count table Schema
var countSchema = new mongoose.Schema({

	_id: { type: String },
	directiveId: { type: String },
	name: { type: String },
	description: { type: String },
	locationId: { type: String },
	approvedDate: { type: Date  },
	startDate: { type: Date, default: Date.now  },
	endDate: { type: Date, default: Date.now  },
	countCreated: { type: Date },
	countType: { type: String ,enum: ['Z-Count', 'Physical', 'Cycle'],require:true},
	numberOfZones: { type: Number , default: 0},
	countStatus: { type: String },
	comment: { type: String },
	createdBy: { type: String},
    updatedBy: { type: String},
    zoneUpload: { type: mongoose.Schema.Types.Mixed, default:{} },
	created: { type: Date, default: Date.now  },
	lastModified: { type: Date, default: Date.now  },
	isDeleted: { type: Boolean , default : false }
	
},{ collection: 'count' });
// , default: Date.now 
countSchema.plugin(autoIncrement.plugin, {   
    model: 'count',
    field: '_id',
    startAt: 1000,
    incrementBy: 1
});

module.exports = mongoose.model('count', countSchema);
