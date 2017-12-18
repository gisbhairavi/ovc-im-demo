var mongoose = require('mongoose');

// location table Schema
var locationSchema = new mongoose.Schema({
    
	locationId: { type: String, required: true },
    locationName: { type: String, required: true},
	stockingLocationId: { type: String, required: true},
	parentStockingLocationId: { type: String },
	stockingLocationDescription: { type: String },
	created: { type: Date, default: Date.now  },
	createdBy: { type: String},
        updatedBy: { type: String},
	lastModified: { type: Date, default: Date.now },
	isActive: { type: Boolean , default : true },
	isDeleted: { type: Boolean , default : false }

},{ collection: 'stocking_location' });

locationSchema.index({ locationId: 1, stockingLocationId: 1 }, { unique: true });

module.exports = mongoose.model('location', locationSchema);

