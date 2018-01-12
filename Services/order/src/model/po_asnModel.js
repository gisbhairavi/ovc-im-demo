var mongoose = require('mongoose');

// po_asn table Schema
var po_asnSchema = new mongoose.Schema({ 
  poId: { type: String },
  asnId: { type: String, required: true},
  stockLocation: { type: String},
  asnStatus: { type: String},
  asnCost: { type: Number},
  shipDate: { type: Date},
  expectedDeliveryDate: { type: Date},
  receivedDate: { type: Date},
  numberOfPackages: { type: Number },  
  asnQty: { type: Number },
  reversedDate: { type: Date},
  reversedBy: { type: String},
  asnDate:{ type: Date, default: Date.now  },  
  billLadingId: { type: String},  
  wayBillnumber: { type: String},
  invoiceNumber: { type: String},
  created: { type: Date, default: Date.now  },
  createdBy: { type: String},
  updatedBy: { type: String},
  userId: { type: String},
  lastModified: { type: Date, default: Date.now },
  isDeleted: { type: Boolean , default : false }
},{ collection: 'po_asn' });

//po_asn

module.exports = mongoose.model('po_asn', po_asnSchema);



