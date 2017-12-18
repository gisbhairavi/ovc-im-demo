var mongoose = require('mongoose');
var transactionSchema = new mongoose.Schema({ 
  tranTypeId: { type: String},
  directiveTypeId: { type: String},    
  asnid: { type: String},    

  postranNo: { type: String},    
  fromLocationId: { type: String },
  toLocationId: { type: String},
  markForId: { type: String},   
  purchaseOrderNumber: { type: String},   
  adjustmentNumber: { type: String},
  purchaseOrderType: { type: String},
  countType: { type: String},
  countNumber: { type: String},
  countName: { type: String},
  billOfLadingNumber: { type: String}, 
  vendorId: { type: String},
  comment: { type: String},
  tranType: { type: String},
  createdBy: { type: String},
  updatedBy: { type: String},
  sqsJson : {type :String},
  isDeleted: { type: Boolean , default : false },
  status:{type: Boolean , default : true},
  createdDate: { type: Date, default: Date.now  },
  lastModifiedDate: { type: Date, default: Date.now }
},{ collection: 'transaction' });
module.exports = mongoose.model('transaction', transactionSchema);
