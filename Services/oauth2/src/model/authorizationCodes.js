// Load required packages
var mongoose = require('mongoose');

// Define our token schema
var CodeSchema   = new mongoose.Schema({
  code: { type: String, required: true },
  redirectUri: { type: String},
  userId: { type: String, required: true },
  clientId: { type: String, required: true }
});

// Export the Mongoose model
module.exports = mongoose.model('Code', CodeSchema);
