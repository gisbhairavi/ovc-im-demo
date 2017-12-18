var mongoose = require('mongoose');


var documenttypeSchema = new mongoose.Schema({
    
  directiveTypeId: { type: String, required: true },
  directiveName: { type: String, required: true  },  
  tranTypeId: { type: String, required: true  },  
  description: { type: String },
  isDeleted: { type: Boolean , default : false },
  created: { type: Date, default: Date.now  },
  createdBy: { type: String},
  updatedBy: { type: String},
  lastModified: { type: Date, default: Date.now  },
  isActive: { type: Boolean , default : true }
},{ collection: 'directive_type' });

module.exports = mongoose.model('documenttype', documenttypeSchema);
