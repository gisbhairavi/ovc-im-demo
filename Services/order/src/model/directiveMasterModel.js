var mongoose = require('mongoose');

// directiveMaster table Schema
var directiveMasterSchema = new mongoose.Schema({
	
sourceCode: { type: String },
directiveId: { type: String },
directiveType: { type: String },
directiveName: { type: String },
DirectiveEffectiveDate: { type: Date, default: Date.now  },
DirectiveExpirationDate: { type: Date, default: Date.now  },
storeId: { type: String },
userId: { type: String },
directiveStatus: { type: String },
orderType: { type: String },
orderNumber: { type: String },
dateReceived: { type: Date, default: Date.now  },
dateExecuted: { type: Date, default: Date.now  },
numberOfItems: { type: String },
created: { type: Date, default: Date.now  },
createdBy: { type: String},
updatedBy: { type: String},
lastModified: { type: Date, default: Date.now  },
isDeleted: { type: Boolean , default : false }
	
},{ collection: 'directive_master' });

module.exports = mongoose.model('directiveMaster', directiveMasterSchema);
