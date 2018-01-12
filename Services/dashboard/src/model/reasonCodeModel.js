var express = require('express');
var mongoose  = require('mongoose');

//configuration table Schema
var reasonCodeSchema = mongoose.Schema({
    id: { type: String, required: true },
    locationOrGroupId: { type: String},
    codeType : { type: String},
    description: { type: String },
    created: { type: Date, default: Date.now },
    lastModified: { type: Date, default: Date.now },
    isDeleted: {type: Boolean , default : false}
},{ collection: 'reason_code_tbl' });

module.exports = mongoose.model('reasonCode', reasonCodeSchema);


// db.getCollection('reason_code_tbl').insert( { 
//     locationOrGroupId: "test-all", 
//     id: "02010",
//     codeType: "3rdPartyCheck", 
//     description: "Travelers Check", 
//     created: ISODate("2016-02-26T14:12:44.292Z"), 
//     lastModified: ISODate("2016-02-26T14:12:44.292Z"), 
//     isDeleted: false
// } )