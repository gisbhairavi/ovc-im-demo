var mongoose = require('mongoose');

// count_item_qty table Schema
var countItemQtySchema = new mongoose.Schema({
	
	countItemId: { type: String },
	countNumber: { type: String },
	qty: { type: Number },
	damagedQty: { type: Number },
	status: { type: Boolean , default : true},
	created: { type: Date, default: Date.now  },
	createdBy: { type: String},
    updatedBy: { type: String},
	lastModified: { type: Date, default: Date.now  },
	isDeleted: { type: Boolean , default : false }
	
},{ collection: 'count_item_qty' });

module.exports = mongoose.model('count_item_qty', countItemQtySchema);
