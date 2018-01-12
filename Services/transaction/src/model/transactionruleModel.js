var mongoose = require('mongoose');

// transaction table Schema
var transactionruleSchema = new mongoose.Schema({ 

  tranTypeId: { type: String, required: true },
  balanceType: { type: String},
  add: { type: Boolean , default : false  },
  subtract : { type: Boolean , default : false },
  recalculate: { type: Boolean , default : false },
  noAction: { type: Boolean , default : false },
  isDeleted: { type: Boolean , default : false },
  created: { type: Date, default: Date.now  },
  createdBy: { type: String},
  updatedBy: { type: String},
  lastModified: { type: Date, default: Date.now  },
  isActive: { type: Boolean , default : true } 
  
},{ collection: 'tran_rule_def' });

module.exports = mongoose.model('transactionrule', transactionruleSchema);



