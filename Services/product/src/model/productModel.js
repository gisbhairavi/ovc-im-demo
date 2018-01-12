var mongoose = require('mongoose');

// vendoproduct table Schema
var productSchema = new mongoose.Schema({
    
	vendorId: { type: String, required: true },
	productCode: { type: String, required: true },
	vendorSKU: { type: String },
    barCode: { type: String},
	created: { type: Date, default: Date.now  },
	createdBy: { type: String},
	updatedBy: { type: String},
	lastModified: { type: Date, default: Date.now },
	isActive: { type: Boolean , default : true },
	isDeleted: { type: Boolean , default : false }

},{ collection: 'vendor_product' });

module.exports = mongoose.model('product', productSchema);
