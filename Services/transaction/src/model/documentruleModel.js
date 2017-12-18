var mongoose = require('mongoose');


var documentruleSchema = new mongoose.Schema({
    
  directiveTypeId: { type: String, required: true },
  balanceType: { type: String },  
  add: { type: Boolean , default : false },
  subtract: { type: Boolean , default : false },
  recalculate:{ type: Boolean , default : false },
  noAction : { type: Boolean , default : false },
  isActive: { type: Boolean , default : true }, 
  isDeleted: { type: Boolean , default : false },
  created: { type: Date, default: Date.now  },
  createdBy: { type: String},
  updatedBy: { type: String},
  lastModified: { type: Date, default: Date.now  },  

},{ collection: 'directive_rule_def' });

module.exports = mongoose.model('documentrule', documentruleSchema);
