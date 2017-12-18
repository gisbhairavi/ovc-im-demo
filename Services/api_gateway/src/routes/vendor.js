var services = require('../services/clientservice.js');
var authentication = require('../services/authentication.js');
var async = require('async');
var env_config = require('../../config/config');
module.exports = function(server) {
    server.get('/vendor', getVendor);
    server.post('/vendor', getVendor);
    server.put('/vendor', createVendor);
    server.post('/vendor/:id', editVendor);
    server.del('/vendor/:id', deleteVendor);
};
Object.prototype.concat = function(o1, o2) {
    o2 = o2 ? o2 : this;
    for (var key in o2) {
        o1[key] = o2[key];
    }
    return o1;
};

function getVendor(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.vendor.getVendor(data, function(err, data) {
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

function createVendor(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.vendor.createVendor(data, function(err, data) {
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

function editVendor(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.vendor.editVendor(req.params.id, data, function(err, data) {
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

function deleteVendor(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.vendor.deleteVendor(data, function(err, data) {
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
/*
function getVendor(req, res, next) {

  services.vendor.getVendor(req.params, function(err, data) {
    if (err) {
      return res.send({error: err});
    }
    res.send(data);
  });

  return next();
}

function createVendor(req, res, next) {
  services.vendor.createVendor(req.body, function(err, data) {
    if (err) {
      return res.send({error: err});
    }
    res.send(data);
  });

  return next();
}

function editVendor(req, res, next) {  
  services.vendor.editVendor(req.params.id, req.body, function(err, data) {
    if (err) {
      return res.send({error: err});
    }
    res.send(data);
  });

  return next();
}

function deleteVendor(req, res, next) {
  services.vendor.deleteVendor(req.params.id, function(err, data) {
    if (err) {
      return res.send({error: err});
    }
    res.send(data);
  });

  return next();
}
*/