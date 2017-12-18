var express = require('express');
var mongoose  = require('mongoose');

// Define our client schema
var ClientSchema = new mongoose.Schema({
  clientSecret: { type: String, required: true },
  clientId: { type: String, required: true }
});

// Export the Mongoose model
module.exports = mongoose.model('Client', ClientSchema);
