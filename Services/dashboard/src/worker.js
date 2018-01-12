var log							=	require('./log');
var fs 							= 	require('fs');
var request 					= 	require('request');
var env_config 					= 	require('../config/config');
var constant 					= 	require('../config/const.json');
var Worker 						= 	require('pigato').Worker;
var reasonCodeModel				=	require('./model/reasonCodeModel');
var permissionManager 			= 	require('./manager/permissionManager');
var replenishmentRulesManager 	= 	require('./manager/replenishmentRulesManager');
var configurationManager 		= 	require('./manager/configurationManager');
var reasonCodeManager 		    =   require('./manager/reasonCodeManager');
var mongodb                     =   require('./mongodb');
var utils                       =   require('./utils');

var permissionWorker 			= 	new Worker(env_config.brokerHost, 'permission');
var replenishmentRulesWorker	= 	new Worker(env_config.brokerHost, 'replenishmentRules');

var configWorker = new Worker(env_config.brokerHost, 'dashboard');

var reasonCodeModel = require('./model/reasonCodeModel');
var accessTokens = require('./model/accessTokens');
var client = require('./model/client');
var authorizationCodes = require('./model/authorizationCodes');
var tokenWorker = new Worker(env_config.brokerHost, 'token');
var reasonCodeWorker	=	new Worker(env_config.brokerHost, 'reasonCode');

configWorker.on('error', function(e) {
  log.error('Worker error', e);
});

permissionWorker.on('error', function(e) {
	log.error('Worker error', e);
});

replenishmentRulesWorker.on('error', function(e) {
	log.error('Worker error', e);
});

reasonCodeWorker.on('error', function(e) {
  log.error('Worker error', e);
});

tokenWorker.on('error', function(e) {
    log.error('tokenWorker error', e);
});

/* Permission */
permissionWorker.on('request', function(input, rep) {
	log.info('Worker request', input);
	switch(input.op) {
		case 'getModuleIds':
			permissionManager.getModuleIds(input.params.permissionData, function(err, permissions) {
		        rep.end({result: permissions, error: err});
		    });
		    break;

		case 'getAllPermissions':
			permissionManager.getAllPermissions(input.params.permissionData, function(err, permissions) {
		        rep.end({result: permissions, error: err});
		    });
		    break; 

		case 'saveRolePermissions':
			permissionManager.saveRolePermissions(input.params.permissionData, function(err, permissions) {
		        var resultObject = {};
		        if(permissions){
		        	resultObject.success 	=	permissions;	
		        }
		         if(err){
		        	resultObject.error 		=	err;	
		        }
		        rep.end({result:resultObject});
		    });
		    break; 
	}
});


/* Replenishment Rules */

replenishmentRulesWorker.on('request', function(input, rep) {
	log.info('Worker request', input);
	switch(input.op) {
		case 'getReplenishmentRules':
			replenishmentRulesManager.getReplenishmentRules(input.params.replenishmentRulesData, function(err, replenishmentRules) {
		        rep.end({result: replenishmentRules, error: err});
		    });
		    break;

		case 'getReplenishmentRulesSku':
			replenishmentRulesManager.getReplenishmentRulesSku(input.params.replenishmentRulesData, function(err, replenishmentRulesSku) {
		        rep.end({result: replenishmentRulesSku, error: err});
		    });
		    break;

		case 'saveReplenishmentRules':
			replenishmentRulesManager.saveReplenishmentRules(input.params.replenishmentRulesData, function(err, replenishmentRules) {
		        var resultObject = {};
		        if(replenishmentRules){
		        	resultObject.success 	=	replenishmentRules;	
		        }
		         if(err){
		        	resultObject.error 		=	err;	
		        }
		        rep.end({result:resultObject});
		    });
		    break;

		case 'replenishmentRulesUpload':
			replenishmentRulesManager.saveReplenishmentRulesUpload(input.params.replenishmentRulesUpload, function(err, replenishmentRules) {
		        var resultObject = {};
		        if(replenishmentRules){
		        	resultObject.success 	=	replenishmentRules;	
		        }
		         if(err){
		        	resultObject.error 		=	err;	
		        }
		        rep.end({result:resultObject});
		    });
		    break;

        case 'replenishmentRulesReset':
            replenishmentRulesManager.replenishmentRulesReset(input.params.replenishmentRulesResetData, function(replenishmentRules) {
                
                    rep.end({result:replenishmentRules});
                
            });
            break;
	}
});

/***********************************************************************
 *
 * FUNCTION:    configWorker
 *
 * DESCRIPTION: Configurations services.
 *
 * REVISION HISTORY:
 *
 *        Name         Date            Description
 *        ----         ----            -----------
 *        Arun         15/02/2016      First Version
 *
 ***********************************************************************/
configWorker.on('request', function(input, rep) {
  log.info('Worker request', input);

  switch(input.op) {
    case 'getConfig':
      log.info('Finding configuration[' + input.params.configData + ']...');
      configurationManager.getConfig(input.params.configData, function(err, configuration) {
        rep.end({result: configuration, error: err});
      });
      break;  
    case 'editConfig':
      log.info('Editing a configuration...');
      log.info('*************locationId',input.params.locationId)      
      configurationManager.editConfig(input.params.locationId, input.params.configData, function(err, configuration) {
        rep.end({result: {result: configuration, status: env_config.getstatus(err)}, error: err});
      });
      break; 
    case 'resetToDefaultConfig':
      log.info('resetToDefault configuration...');
      log.info('*************locationId',input.params.locationId)      
      configurationManager.resetToDefaultConfig(input.params.locationId, input.params.configData, function(err, configuration) {
        rep.end({result: {result: configuration, status: env_config.getstatus(err)}, error: err});
      });
      break; 
      case 'getConfigByUser':
      log.info('Finding configuration based on UserId[' + input.params.configData + ']...');
      configurationManager.getConfigByUser(input.params.configData, function(err, configuration) {
        rep.end({result: configuration, error: err});
      });
      break;
        case 'getStatus':
            log.info('getStatus');
            mongodb.getreadystate(function(state) {
                reasonCodeModel.findOne(function(err) {
                    var test = constant.label.SUCCESS;
                    if (err) {
                        test = constant.label.ERROR;
                    }
                    var result = {
                        db: {
                            state: state,
                            test: test
                        },
                        appServer: 'connected'
                    };
                    rep.end({
                        result: result
                    });
                });
            });
            break;
  }
});

/***********************************************************************
 *
 * FUNCTION:    reasonCodeWorker
 *
 * DESCRIPTION: reason Code services.
 *
 * REVISION HISTORY:
 *
 *        Name         Date            Description
 *        ----         ----            -----------
 *        Arun         4/03/2016      First Version
 *
 ***********************************************************************/
reasonCodeWorker.on('request', function(input, rep) {
  log.info('Worker request', input);
  	switch(input.op) {
	    case 'getReasonCode':
	      log.info('Finding reason code[' + input.params.reasonCodeData + ']...');
	      reasonCodeManager.getReasonCode(input.params.reasonCodeData, function(err, reasonCode) {
	        rep.end({result: reasonCode, error: err});
	      });
	      break;  
	    case 'createReasonCode':
	      log.info('Creating a new reason code...');
	      reasonCodeManager.createReasonCode(input.params.reasonCodeData, function(err, reasonCode) {
	        rep.end({result: reasonCode, error: err});
	      });
	      break;
	    case 'editReasonCode':
	      log.info('Editing a reason code...');      
	      reasonCodeManager.editReasonCode(input.params.id, input.params.reasonCodeData, function(err, reasonCode) {
	        rep.end({result: reasonCode, error: err});
	      });
	      break;
	    case 'deleteReasonCode':
	      log.info('Deleting a reason code...');
	      reasonCodeManager.deleteReasonCode(input.params.id, function(err, reasonCode) {
	        rep.end({result: reasonCode, error: err});
	      });
	      break;      
  	}
});
/***********************************************************************
 *
 * FUNCTION:    tokenWorker
 *
 * DESCRIPTION: Access token services.
 *
 * REVISION HISTORY:
 *
 *        Name        			Date            Description
 *        ----         			----            -----------
 *        Ratheesh         		30/11/2016      First Version
 *
 ***********************************************************************/
tokenWorker.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getCode':
            var obj = input.params.Data;
            log.info('Creating a getToken...');
            if (obj.username && obj.psswrd) {
                var querystring = require('querystring');
                var data = querystring.stringify(obj);
                var options = {
                    url: env_config.dashPath + constant.apis.LOGIN,
                    method: 'POST',
                    body: data,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                };
                request(options, function(err, response, results) {
                    try {
                        results = JSON.parse(results);
                        if (results) {
                            var sendCodes = function(clientdata) {
                                console.log(clientdata);
                                var code = utils.uid(16);
                                authorizationCodes.remove({
                                    userId: clientdata.id
                                }, function(err, data) {
                                    var codeobj = new authorizationCodes({
                                        code: code,
                                        userId: clientdata.id,
                                        clientId: clientdata.clientId
                                    });
                                    codeobj.save(function(err, codeResult) {
                                        if (err) {
                                            rep.end({
                                                // result: results,
                                                error: err
                                            });
                                            return err;
                                        }
                                        rep.end({
                                            result: codeResult.code,
                                            error: err
                                        });
                                    });
                                });
                            };
                            console.log(results.status);
                            if (results.status == "success") {
                                client.findOne({
                                    clientType: 'widget'
                                }, function(err, clientdata) {
                                    if (err) {
                                        rep.end({
                                            // result: results,
                                            error: err
                                        });
                                        return err;
                                    }
                                    var newObj = {
                                        clientId: results.userid,
                                        clientSecret: results.session_id,
                                        clientName: results.name,
                                        username: results.name,
                                        firstName: results.firstname,
                                        middleName: results.middlename,
                                        lastName: results.lastname,
                                        roles: results.roles
                                    };
                                    if (clientdata) {
                                        clientdata.clientData = JSON.stringify(newObj);
                                        clientdata.clientSecret = newObj.clientSecret;
                                        clientdata.clientId = results.userid;
                                        clientdata.save(function(err, client) {
                                            sendCodes(client);
                                        });
                                    } else {
                                        var clientobj = new client({
                                            clientId: results.userid,
                                            clientSecret: newObj.clientSecret,
                                            clientType: 'widget',
                                            clientData: JSON.stringify(newObj)
                                        });
                                        clientobj.save(function(err, client) {
                                            console.log(err, client);
                                            sendCodes(client);
                                        });
                                    }
                                });
                            } else {
                                rep.end({
                                    // result: Data,
                                    error: results
                                });
                            }
                        }
                    } catch (ex) {
                        rep.end({
                            // result: Data,
                            error: ex
                        });
                    }
                });
            } else {
                rep.end({
                    // result: results,
                    error: 'username and psswrd required.'
                });
            }
            break;
        case 'getToken':
            var obj = input.params.Data;
            authorizationCodes.findOne({
                code: obj.code
            }, function(err, authCode) {
                if (err) {
                    rep.end({
                        // result: results,
                        error: err
                    });
                    return err;
                }
                if (authCode) {
                    var token = utils.uid(256);
                    var tokenobj = new accessTokens({
                        token: token,
                        userId: authCode.userId,
                        clientId: authCode.clientId
                    });
                    tokenobj.save(function(err, token) {
                        if (err) {
                            rep.end({
                                // result: results,
                                error: err
                            });
                            return err;
                        }
                        console.log(authCode);
                        client.findOne({
                            clientType: 'widget',
                            _id: authCode.userId
                        }, function(err, clientdata) {
                            try {
                                if (clientdata) {
                                    var clientData = JSON.parse(clientdata.clientData);
                                    clientData.token = token.token;
                                    clientData.widget = true;
                                    rep.end({
                                        result: clientData,
                                        error: err
                                    });
                                } else {
                                    rep.end({
                                        // result: results,
                                        error: 'No client.'
                                    });
                                    tokenobj.remove();
                                    return err;
                                }
                            } catch (e) {
                                tokenobj.remove();
                                rep.end({
                                    // result: results,
                                    error: 'No client.'
                                });
                            }
                        });
                    });
                } else {
                    rep.end({
                        // result: results,
                        error: 'No Code.'
                    });
                }
            });
            break;
    }
});

module.exports = {
	start: function() {
    	log.info('Starting worker, broker ' + env_config.brokerHost + '...');
   		permissionWorker.start();
   		replenishmentRulesWorker.start();
   		configWorker.start();
   		reasonCodeWorker.start();
        tokenWorker.start();
  	}
};