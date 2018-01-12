#!/bin/sh

/***********************************************************************
 *
 * fallback.
 *
 * REVISION HISTORY:
 *
 *            Name          Date            Description
 *            ----          ----            -----------
 *            Ratheesh     17/06/2016      First Version
 *
 ***********************************************************************/
 try {
 	var env_config = require('../config/config');
	var error;
	var envArr={
		port:'API_PORT',
		brokerHost:'BROKER_PATH',
		broadcastHost:'BROADCAST_PATH',
		authUrl:'AUTH_PATH',
		dashPath:'DASH_PATH',
		posPath:'POS_PATH'
	};
	var env=Object.keys(envArr);
	for(var j = 0, length2 = env.length; j < length2; j++){
		var con= env[j];
		if(env_config[con]==''){
			console.log(''+envArr[con]+' - not found.');
			error=true;
		}
	}
	if(error){
		console.log('ERROR : app can not run - env_config not found');
		return;
	}
 } catch(e) {
 	console.log('ERROR : app can not run - env_config not found');
    return;
}
var config = require('../config/app');
var server = require('../src/server');
 	var env_config = require('../config/config');
var broker = require('../src/broker');
var log = require('../src/log');
broker.start(function() {
  log.info('Events broker server started on %s', env_config.brokerHost);

});

env_config.broker=broker;
server.listen(env_config.port, function() {
    log.info('%s listening at %s', server.name, env_config.port);
});