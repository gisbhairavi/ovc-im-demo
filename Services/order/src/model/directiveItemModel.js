var mongoose = require('mongoose');

// directiveItem table Schema
var directiveItemSchema = new mongoose.Schema({

lineNumber: { type: String },
lineReleaseNumber: { type: String },
customsCodeNumber: { type: String },
lineStatus: { type: String },
orderQuantity: { type: String },
productID: { type: String },
productDescription: { type: String },
productImage: { type: String },
countryOfOrigin: { type: String },
productIDUnitOfMeasure: { type: String },
unitWeight: { type: String },
receivedQuantity: { type: String },
receivedUnitOfMeasure: { type: String },
receivingPhysical: { type: String },
unitprice: { type: String },
currencyCode: { type: String },
eurValue: { type: String },
totalPrice: { type: String },
vat: { type: String },
totalLinePrice: { type: String },
heldQuarantineQTY: { type: String },
receivingHoldQuarantineLocation: { type: String },
rejectedQTY: { type: String },
rejectReasonCodes: { type: String },
createdBy: { type: String},
updatedBy: { type: String},
isDeleted: { type: Boolean , default : false }

},{ collection: 'directive_item' });

module.exports = mongoose.model('directiveItem', directiveItemSchema);
