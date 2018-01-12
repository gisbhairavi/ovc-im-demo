var mongoose = require('mongoose');

// transaction table Schema
var transactiontypeSchema = new mongoose.Schema({
    
  tranTypeId: { type: String, required: true },
  requiredFields: { type: String/*, required: true */},  
  tranName: { type: String },  
  description: { type: String },
  tranCode: { type: String },
  isCostRequired:{ type: Boolean , default : false },
  isSystemDefined : { type: Boolean , default : false },
  isAllowReversal: { type: Boolean , default : false },
  reversalTranTypeId:{ type: String },
  isManualTransaction: { type: Boolean , default : false },
  // exportOH: { type: Boolean , default : false },
  updateGl: { type: Boolean , default : false },  
  isDeleted: { type: Boolean , default : false },
  created: { type: Date, default: Date.now  },
  createdBy: { type: String},
  updatedBy: { type: String},
  lastModified: { type: Date, default: Date.now  },
  isActive: { type: Boolean , default : true }
},{ collection: 'tran_type' });

module.exports = mongoose.model('transactiontype', transactiontypeSchema);
