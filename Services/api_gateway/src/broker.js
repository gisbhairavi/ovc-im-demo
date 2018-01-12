var config = require('../config/app.json');
var env_config = require('../config/config');
var log = require('./log');
var Broker = require('pigato').Broker;

var broker = new Broker(env_config.broadcastHost);

broker.on('error', function(err) {
  log.error('broker', err);
});

module.exports = broker;
