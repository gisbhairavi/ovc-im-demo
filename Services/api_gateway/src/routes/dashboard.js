var services = require('../services/clientservice.js');
var authentication = require('../services/authentication.js');
var async = require('async');
var env_config = require('../../config/config');

module.exports = function(server) {
  server.get('/getModuleIds', getModuleIds);
  server.get('/permissions', getAllPermissions);
  server.post('/saveRolePermissions', saveRolePermissions);
  server.get('/replenishmentRules/:locationId', getReplenishmentRules);
  server.get('/getReplenishmentRulesSku', getReplenishmentRulesSku);
  server.post('/saveReplenishmentRules', saveReplenishmentRules);
  server.post('/getToken', getToken);
  server.post('/getCode', getCode);

  server.get('/config', getConfig);
  server.post('/config/:locationId', editConfig);
  server.del('/resetToDefaultConfig/:locationId', resetToDefaultConfig);

  server.get('/configbyuser', getConfigByUser);

  server.post('/replenishmentRulesUpload', replenishmentRulesUpload);

  server.post('/replenishmentRulesReset', replenishmentRulesReset);

  server.get('/reasoncode', getReasonCode);
  server.put('/reasoncode', createReasonCode);
  server.post('/reasoncode/:id', editReasonCode);
  server.del('/reasoncode/:id', deleteReasonCode);
  server.get('/getHealthCheck', getHealthCheck);
};
Object.prototype.concat=function(o1, o2) {
   o2 = o2 ? o2 : this;
   for (var key in o2) {
       o1[key] = o2[key];
   }
   return o1;
};

/* Getting Module Ids */
function getModuleIds (req, res, next) {
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){
          return res.send(body);
        }
        var data = req.params.concat({user:clent});

        services.dashboard.getModuleIds(data, function(err, data) {
          if (err) { return res.send({error: err});}
          res.send(data);
        });
        return null;
      }else{
        res.send({error: "invalid_token"});
      }
  }
  authentication.checkOauth(req, callback);
}

/* Getting All Permissions based on the Role & Module */
function getAllPermissions(req, res, next) {
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){
          return res.send(body);
        }
        var data = req.params.concat({user:clent});

        services.dashboard.getAllPermissions(data, function(err, data) {
          if (err) { return res.send({error: err});}
          res.send(data);
        });
        return null;
      }else{
        res.send({error: "invalid_token"});
      }
  }
  authentication.checkOauth(req, callback);

  return next();
}

/* Save Role Permission for the Role */
function saveRolePermissions(req, res, next) {
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){
          return res.send(body);
        }
        var data = req.params.concat({user:clent});

        services.dashboard.saveRolePermissions(data, function(err, data) {
          if (err) { return res.send({error: err});}
          res.send(data);
        });
        return null;
      }else{
        res.send({error: "invalid_token"});
      }
  }
  authentication.checkOauth(req, callback);

  return next();
}

/* Getting Replenishment Rules for Location */
function getReplenishmentRules (req, res, next) {
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){
          return res.send(body);
        }
        var data = req.params.concat({user:clent});

        services.dashboard.getReplenishmentRules(data, function(err, data) {
          if (err) { return res.send({error: err});}
          res.send(data);
        });
        return null;
      }else{
        res.send({error: "invalid_token"});
      }
  }
  authentication.checkOauth(req, callback);
}

/* Getting all Replenishment Rules */
function getReplenishmentRulesSku (req, res, next) {
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){
          return res.send(body);
        }
        var data = req.params.concat({user:clent});

        services.dashboard.getReplenishmentRulesSku(data, function(err, data) {
          if (err) { return res.send({error: err});}
          res.send(data);
        });
        return null;
      }else{
        res.send({error: "invalid_token"});
      }
  }
  authentication.checkOauth(req, callback);
}



/* Save Replenishment Rules for Location */
function saveReplenishmentRules(req, res, next) {
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){
          return res.send(body);
        }
        var data = req.params.concat({user:clent});

        services.dashboard.saveReplenishmentRules(data, function(err, data) {
          if (err) { return res.send({error: err});}
          res.send(data);
        });
        return null;
      }else{
        res.send({error: "invalid_token"});
      }
  }
  authentication.checkOauth(req, callback);

  return next();
}

/* To get the configuration Data based on locationId */
function getConfig(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.dashboard.getConfig(data, function(err, data) {
              if (err) { return res.send({error: err});}
              res.send(data);
            });
        return null;
      }else{
        res.send({error: "invalid_token"});
      }
  }
  authentication.checkOauth(req, callback);

  return next();
}

/* To edit the insert new configurations for given location */
function editConfig(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.dashboard.editConfig(req.params.locationId, data, function(err, data) {
              if (err) { return res.send({error: err});}
              res.send(data);
            });
        return null;
      }else{
        res.send({error: "invalid_token"});
      }
  }
  authentication.checkOauth(req, callback);

  return next();
}

/* To reset the all configuration for the given location */
function resetToDefaultConfig(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
            var data = req.params.concat({user:clent});
            services.dashboard.resetToDefaultConfig( data, function(err, data) {
              if (err) { return res.send({error: err});}
              res.send(data);
            });
        return null;
      }else{
        res.send({error: "invalid_token"});
      }
  }
  authentication.checkOauth(req, callback);

  return next();
}

/* To get the configuration for the logged User */
function getConfigByUser(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.dashboard.getConfigByUser(data, function(err, data) {
              if (err) { return res.send({error: err});}
              res.send(data);
            });
        return null;
      }else{
        res.send({error: "invalid_token"});
      }
  }
  authentication.checkOauth(req, callback);

  return next();
}

/* Upload Replenishment Rules */
function replenishmentRulesUpload(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.dashboard.replenishmentRulesUpload(data, req.headers["authorization"], function(err, data) {
                if (err) {
                    return res.send({
                        error: err
                    });
                }
                res.send(data);
            });
            return null;
        } else {
            res.send({
                error: "invalid_token"
            });
        }
    }
    authentication.checkOauth(req, callback);
    return next();
}

/* Reset Replenishment Rules */
function replenishmentRulesReset(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.dashboard.replenishmentRulesReset(data, req.headers["authorization"], function(err, data) {
                if (err) {
                    return res.send({
                        error: err
                    });
                }
                res.send(data);
            });
            return null;
        } else {
            res.send({
                error: "invalid_token"
            });
        }
    }
    authentication.checkOauth(req, callback);
    return next();
}

function getReasonCode(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.dashboard.getReasonCode(data, function(err, data) {
              if (err) { return res.send({error: err});}
              res.send(data);
            });
        return null;
      }else{
        res.send({error: "invalid_token"});
      }
  }
  authentication.checkOauth(req, callback);

  return next();
}

function createReasonCode(req, res, next) {
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.dashboard.createReasonCode(data, function(err, data) {
              if (err) { return res.send({error: err});}
              res.send(data);
            });
        return null;
      }else{
        res.send({error: "invalid_token"});
      }
  }
  authentication.checkOauth(req, callback);

  return next();
}

function editReasonCode(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.dashboard.editReasonCode(req.params.id, data, function(err, data) {
              if (err) { return res.send({error: err});}
              res.send(data);
            });
        return null;
      }else{
        res.send({error: "invalid_token"});
      }
  }
  authentication.checkOauth(req, callback);

  return next();
}

function deleteReasonCode(req, res, next) {
  
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.dashboard.deleteReasonCode(data, function(err, data) {
              if (err) { return res.send({error: err});}
              res.send(data);
            });
        return null;
      }else{
        res.send({error: "invalid_token"});
      }
  }
  authentication.checkOauth(req, callback);

  return next();
}

function getHealthCheck(req, res, next) {
    // function callback(error, response, body) {
    // if (!error && response.statusCode == 200) {
    //     var clent = JSON.parse(body);
    //     if (clent === null || clent.clientId === null && clent.clientId === undefined) {
    //         return res.send(body);
    //     }
    //     var data = req.params.concat({
    //         user: clent
    //     });
    if (req.params.server) {
        var result = {},
            Status = 200;
        if (env_config.broker.services[req.params.server]) {
            services.getHealthCheck(req.params.server, req.headers["authorization"], function(err, data) {
                if (err) {
                    result[req.params.server] = {
                        db: {
                            state: "notconnected",
                            test: "error"
                        },
                        AppServer: 'notconnected'
                    };
                    Status = 500;
                } else {
                    data.db.state == 'connected' && data.AppServer == 'connected' ? Status = 200 : Status = 500;
                    result[req.params.server] = data;
                }
                res.send(Status, result);
            });
        } else {
            result[req.params.server] = {
                db: {
                    state: "notconnected",
                    test: "error"
                },
                AppServer: 'notconnected'
            };
            Status = 500;
            res.send(Status, result);
            // res.send({
            //     error: "No server found."
            // });
        }
    } else {
        var result = {};
        var serverdata = ['dashboard', 'loadjson', 'location', 'order', 'vendorproduct', 'transaction', 'vendor'];
        async.forEach(serverdata, function(server, asynccallback) {
            services.getHealthCheck(server == 'product' ? 'vendorproduct' : server, req.headers["authorization"], function(err, data) {
                if (err) {
                    result[server] = {
                        db: {
                            state: "notconnected",
                            test: "error"
                        },
                        AppServer: 'notconnected'
                    };
                    Status = 500;
                    return asynccallback();
                }
                Status == 200 ? (data.db.state == 'connected' && data.AppServer == 'connected' ? Status = 200 : Status = 500) : '';
                result[server] = data;
                asynccallback();
            });
        }, function() {
            return res.send(Status, result);
        });
    }
    return null;
    // } else {
    //     console.log(response);
    //     if (!error) {
    //         result['oauth2'] = {
    //             db: "notconnected",
    //             AppServer: 'notconnected'
    //         };
    //     } else {
    //         res.send({
    //             error: "invalid_token"
    //         });
    //     }
    // }
    // }
    // authentication.checkOauth(req, callback);
    return next();
}
function getToken(req, res, next) {
    var data = req.params;
    services.dashboard.getToken(data, function(err, data) {
        if (err) {
            return res.send({
                error: err
            });
        }
        res.send(data);
    });
    return next();
}
function getCode(req, res, next) {
    var data = req.params;
    services.dashboard.getCode(data, function(err, data) {
        if (err) {
            return res.send({
                error: err
            });
        }
        res.send(data);
    });
    return next();
}