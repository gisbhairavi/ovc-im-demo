var mongoose = require('mongoose');

// location table Schema
var stocking_location_itemsSchema = new mongoose.Schema({
    
	locationId: { type: String, required: true },
	productUom: { type: String },
	productDescription: { type: String },
	SKU: { type: String , required: true},	
	qty: { type: Number },
	restockingLocation: { type: String },
	length: { type: String},
	waist: { type: String},
	size: { type: String},
	styleColor: { type: String},
	lineNumber: { type: Number },
	created: { type: Date, default: Date.now  },
	createdBy: { type: String},
        updatedBy: { type: String},
	lastModified: { type: Date, default: Date.now },
	isDeleted: { type: Boolean , default : false }

},{ collection: 'stocking_location_items' });


module.exports = mongoose.model('stocking_location_items', stocking_location_itemsSchema);

