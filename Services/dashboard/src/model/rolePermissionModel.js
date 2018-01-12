var mongoose = require('mongoose');

// Role Permission Table Schema
var rolePermissionSchema = new mongoose.Schema({
      roleId: { type: String },
   	applicationId: { type: String },
   	moduleId: { type: String },
   	permGroup: { type: String },
   	permId: { type: String },
   	permValue: { type: String, default: null},
   	access: { type: Boolean , default : false },
      URLState: { type: mongoose.Schema.Types.Mixed },
   	created: { type: Date, default: Date.now },
   	lastModified: { type: Date, default: Date.now },
   	isDeleted: { type: Boolean , default : false }
},{ collection: 'role_permission_tbl' });

module.exports = mongoose.model('rolePermission', rolePermissionSchema);
