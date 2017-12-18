var mongoose = require('mongoose');

// transaction table Schema
var uomSchema = new mongoose.Schema({
    
  uomId: { type: String, required: true },
  description: { type: String },  
  quantity:{type: Number},
  isDeleted: { type: Boolean , default : false },
  created: { type: Date, default: Date.now  },
  createdBy: { type: String},
  updatedBy: { type: String},
  lastModified: { type: Date, default: Date.now  },
  isActive: { type: Boolean , default : true }
});

module.exports = mongoose.model('uom', uomSchema);
