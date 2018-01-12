var mongoose = require('mongoose');

// Permission Table Schema
var permissionSchema = new mongoose.Schema({
   	applicationId: { type: String },
   	moduleId: { type: String },
   	permGroup: { type: String },
   	permId: { type: String },
   	permName: { type: String },
    URLState: { type: mongoose.Schema.Types.Mixed },
   	permDescription: { type: String },
   	created: { type: Date, default: Date.now },
   	lastModified: { type: Date, default: Date.now },
   	isDeleted: { type: Boolean , default : false }
},{ collection: 'permission_tbl' });

module.exports = mongoose.model('permission', permissionSchema);
