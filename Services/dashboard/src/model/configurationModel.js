var express = require('express');
var mongoose  = require('mongoose');
var Schema  =   mongoose.Schema;

//configuration table Schema
var configurationSchema = mongoose.Schema({
    locationOrGroupId: { type: String, required: true },
    applicationId: { type: String, required: true },
    moduleId: { type: String},
    featureGroup: { type: String },
    featureId: { type: String },
    featureName: { type: String },
    featureDescription: { type: String },
    featureType: { type: String },
    featureListId: { type: String },
    featureValue: { type: Schema.Types.Mixed },
    displaySeqNumber: { type: String },
    defaultValue: { type: Schema.Types.Mixed}, 
    isPublic:{ type: Number },
    parentFeatureId: { type: String},
    fileName: { type: String},
    visibilityExpression: { type: String},
    created: { type: Date, default: Date.now },
    lastModified: { type: Date, default: Date.now },
    isDeleted: {type: Boolean , default : false}
},{ collection: 'config_tbl' });

module.exports = mongoose.model('dashboard', configurationSchema);