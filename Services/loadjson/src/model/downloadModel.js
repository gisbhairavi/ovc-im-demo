var mongoose = require('mongoose');


// download table Schema
var downloadSchema = new mongoose.Schema({
    userId: { type: String },
    src: { type: String },
    downloadType: { type: String },
    fileName: { type: String },
    status: { type: String,enum : ['NEW','DOWNLOADED'], default: 'NEW' },
    created: { type: Date, default: Date.now  },
    createdBy: { type: String},
    updatedBy: { type: String},
    lastModified: { type: Date, default: Date.now  },
    isDeleted: { type: Boolean , default : false }
},{ collection: 'download' });
downloadSchema.pre('update', function() {
  this.update({},{ $set: { lastModified: new Date() } });
});

module.exports = mongoose.model('download', downloadSchema);
