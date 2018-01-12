
var mongoose = require('mongoose');

// adjustment table Schema
var adjustmentSchema = new mongoose.Schema({
    adjustmentNumber: { type: String },
    adjustmentCode: { type: String },
    adjustmentName: { type: String },
    storeId: { type: String },
    ReasonCodeID: { type: String },
    orderNumber: { type: String },
    adjustmentDate: { type: Date, default: Date.now  },
    userId: { type: String },
    adjustmentStatus: { type: String },
    numberOfProducts: { type: Number },
    numberOfSKU: { type: Number },
    adjustmentSubtotal: { type: Number },
    totalAdjustmentCost: { type: Number },
    totalAdjustmentVAT: { type: Number },
    totalAdjustmentTax: { type: Number },
    created: { type: Date, default: Date.now  },
    createdBy: { type: String},
    updatedBy: { type: String},
    reversedBy: { type: String},
    reversalAdjustmentNumber: { type: mongoose.Schema.ObjectId},
    originalAdjustmentNumber: { type: mongoose.Schema.ObjectId},
    lastModified: { type: Date, default: Date.now  },
    isDeleted: { type: Boolean , default : false },
    isReversed: { type: Boolean , default : false },
    comment:{ type: String}

    
},{ collection: 'adjustment' });

module.exports = mongoose.model('adjusment', adjustmentSchema);

