var mongoose = require('mongoose');

// inventory availability table Schema
var inventoryavailabilitySchema = new mongoose.Schema({ 
  warehouseId: { type: String },
  locationId: { type: String, required: true},
  stockLocation: { type: String},
  sku: { type: String, required: true},  
  stockUOM: { type: String},  
  balanceType: { type: String},
  value: { type: Number},
  created: { type: Date, default: Date.now  },
  createdBy: { type: String},
  updatedBy: { type: String},
  lastModified: { type: Date, default: Date.now },
  isActive: { type: Boolean , default : true }   
},{ collection: 'inv_availability' });

//inv_availability

module.exports = mongoose.model('inventoryavailability', inventoryavailabilitySchema);



