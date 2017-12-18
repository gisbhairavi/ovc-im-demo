var mongoose = require('mongoose');

// Replenishment Rules Table Schema
var replenishmentRulesSchema = new mongoose.Schema({
   locationId: { type: String },
   sku: {type: String},
   backgroundReplenishment : { type: Boolean, default : false },
   reorder: { type: Number },
   minOrder: { type: Number, default : 1 },
   maxOrder: { type: Number },
   roundingValue: { type: Number },
   orderQuantityRounding: { type: String, default : "up"},
   allowPush : { type: Boolean , default : false },
   managerApproval : { type: Boolean , default : false },
   windowChange: { type: Number},
   created: { type: Date, default: Date.now },
   lastModified: { type: Date, default: Date.now },
   isDeleted: { type: Boolean, default : false }
},{ collection: 'replenishment_rules_tbl' });

module.exports = mongoose.model('replenishmentRules', replenishmentRulesSchema);
