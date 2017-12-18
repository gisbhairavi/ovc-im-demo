var express = require('express');
var mongoose  = require('mongoose');

//vendor table Schema
var vendorSchema = mongoose.Schema({
    companyName: { type: String, required: true },
    companyCode: { type: String, required: true },
    accountNumber: { type: String, required: true },
    purchasingDepartment: { type: String},
    address1: { type: String },
    address2: { type: String },
    city: { type: String },
    state: { type: String },
    zipcode: { type: String },
    country: { type: String },
    phoneNumber: { type: String },
    carrierAlphaCode: { type: String },
    primarysupplier: { type: Boolean , default : false},
    isActive: { type: Boolean , default : true }, 
    created: { type: Date, default: Date.now  },
    createdBy: { type: String},
    updatedBy: { type: String},
    lastModified: { type: Date, default: Date.now },
    isDeleted: {type: Boolean , default : false},
    status: {type: Boolean , default : true}
});

module.exports = mongoose.model('vendor', vendorSchema);