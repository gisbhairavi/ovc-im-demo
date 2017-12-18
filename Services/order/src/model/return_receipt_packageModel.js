var mongoose = require('mongoose');

// po_asn_package table Schema
var return_receipt_packageSchema = new mongoose.Schema({ 
  asnId: { type: String },
  packageId: { type: String},
  packageBarCode: { type: String},
  trackingNumber: { type: String},  
  packageStatus: { type: String},  
  shipDate: { type: Date},
  expectedDeliveryDate: { type: Date},
  fromLocation: { type: String},
  fromStreetName: { type: String},
  fromStreetNumber: { type: String},
  fromCity: { type: String},
  fromPostalCode: { type: String},
  fromCountry: { type: String},
  toLocation: { type: String},
  toStreetName: { type: String},
  toStreetNumber: { type: String},
  toCity: { type: String},
  toPostalCode: { type: String},
  toCountry: { type: String},
  toPhoneNumber: { type: String},
  numberOfSKU : {type: Number},
  receivedDate: { type: Date},
  reversedDate: { type: Date},
  reversedBy: { type: String},
  reasonCode: { type: String},
  created: { type: Date, default: Date.now  },
  lastModified: { type: Date, default: Date.now },
  createdBy: {type: String },
  userId: { type: String},
  updatedBy: {type: String },
  isDeleted: { type: Boolean , default : false },
  lastModified: { type: Date, default: Date.now }  
},{ collection: 'po_asn_package' });

//po_asn_package

module.exports = mongoose.model('return_receipt_asn_package', return_receipt_packageSchema);



