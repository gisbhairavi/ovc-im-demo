var express = require('express');
var mongoose    = require('mongoose');
var env_config = require('../config/config');
var log = require('./log');

mongoose.set('debug', true);

module.exports = {
  connect: function(done) {
    log.info('Connecting to MongoDB...');

    mongoose.connect(env_config.dbConn, function(err) {
      if (err) throw err;
      log.info('Connected to MongoDB');

      mongoose.connection.on('error', function(err) {
        log.error(err);
      });
    });

    done();
  }
};