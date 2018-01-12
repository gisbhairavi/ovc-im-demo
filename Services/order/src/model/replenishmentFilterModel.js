var mongoose = require('mongoose');

//replenishmentFilter schema
var replenishmentFilterSchema = new mongoose.Schema({
	filterName: { type: String},
	locName: mongoose.Schema.Types.Mixed,
	productVariants: mongoose.Schema.Types.Mixed,
	productProperties: mongoose.Schema.Types.Mixed,
	merchandiseGroup: mongoose.Schema.Types.Mixed,
	inventoryBalance: mongoose.Schema.Types.Mixed,
	excludedOrderType: mongoose.Schema.Types.Mixed,
	excludedOrderNo: mongoose.Schema.Types.Mixed,
	storeQuantities: mongoose.Schema.Types.Mixed,
	pricing: mongoose.Schema.Types.Mixed,
	isDeleted: { type: Boolean, default:false},
	created: { type: Date, default: Date.now  },
    createdBy: { type: String},
    updatedBy: { type: String},
    lastModified: { type: Date, default: Date.now  },
    numberOfSkus: {type: Number, default: 0},
    lastRun: { type: Date, default: null },
    isActive: { type: Boolean , default : true }
},{ collection: 'replenishment_filter',minimize: false });

module.exports = mongoose.model('replenishmentFilter', replenishmentFilterSchema);
