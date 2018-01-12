var services = require('../services/clientservice.js');
var authentication = require('../services/authentication.js');

module.exports = function(server) {
  server.get('/location', getLocation);

  server.put('/location', createLocation);
  server.post('/location/:id', editLocation);
  server.del('/location/:id', deleteLocation);

  server.get('/locationitem', getLocationitem);
  server.put('/locationitem/:locationid', createLocationitem);
  server.post('/locationitem/:id', editLocationitem);
  server.del('/locationitem/:id', deleteLocationitem);

  server.get('/hierarchyLocations', hierarchyLocations);
};
Object.prototype.concat=function(o1, o2) {
   o2 = o2 ? o2 : this;
   for (var key in o2) {
       o1[key] = o2[key];
   }
   return o1;
};


function getLocation(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.location.getLocation(data, function(err, data) {
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

function createLocation(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.location.createLocation(data, function(err, data) {
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

function editLocation(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.location.editLocation(req.params.id, data, function(err, data) {
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

function deleteLocation(req, res, next) {
  
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.location.deleteLocation(data, function(err, data) {
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

function getLocationitem(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.location.getLocationitem(data, function(err, data) {
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
function createLocationitem(req, res, next) {
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.location.createLocationitem(data, function(err, data) {
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

function editLocationitem(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.location.editLocationitem(req.params.id, data, function(err, data) {
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
function checkOauth(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            next(data);
        } else {
            res.send({
                error: "invalid_token"
            });
        }
    }
    authentication.checkOauth(req, callback);
}

function hierarchyLocations(req, res, next) {
    checkOauth(req, res, function(data) {
        if (data) {
            services.location.hierarchyLocations(data, function(err, data) {
                if (err) {
                    return res.send({
                        error: err
                    });
                }
                res.send(data);
            });
        }
    });
    return next();
}


function deleteLocationitem(req, res, next) {
  
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.location.deleteLocationitem(data, function(err, data) {
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
/*
function getLocation(req, res, next) {

  services.location.getLocation(req.params, function(err, data) {
    if (err) {
      return res.send({error: err});
    }
    res.send(data);
  });

  return next();
}

function createLocation(req, res, next) {
  services.location.createLocation(req.body, function(err, data) {
    if (err) {
      return res.send({error: err});
    }
    res.send(data);
  });

  return next();
}

function editLocation(req, res, next) {  
  services.location.editLocation(req.params.id, req.body, function(err, data) {
    if (err) {
      return res.send({error: err});
    }
    res.send(data);
  });

  return next();
}

function deleteLocation(req, res, next) {
  services.location.deleteLocation(req.params.id, function(err, data) {
    if (err) {
      return res.send({error: err});
    }
    res.send(data);
  });

  return next();
}
*/
