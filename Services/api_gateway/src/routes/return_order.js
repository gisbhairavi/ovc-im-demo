var services = require('../services/clientservice.js');
var authentication = require('../services/authentication.js');
module.exports = function(server) {
    server.get('/return', getReturn);
    server.put('/return', createReturn);
    server.post('/return/:id', editReturn);
    server.del('/return/:id', deleteReturn);
    server.get('/returnpackage', getReturnPackage);
    server.put('/returnpackage/:orderNumber', createReturnpackage);
    // server.post('/returnpackage/:id', editReturnpackage);
    server.post('/checkReturnData', checkReturnData);
    server.del('/returnOrderSKU/:id', deleteReturnOrderSKU);
    server.del('/deleteReturnPackage/:id', deleteReturnPackage);
};
Object.prototype.concat = function(o1, o2) {
    o2 = o2 ? o2 : this;
    for (var key in o2) {
        o1[key] = o2[key];
    }
    return o1;
};

function getReturn(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.return.getReturn(data, req.headers["authorization"], function(err, data) {
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

function createReturn(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.return.createReturn(data, req.headers["authorization"], function(err, data) {
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

function editReturn(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.return.editReturn(req.params.id, data, req.headers["authorization"], function(err, data) {
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

function deleteReturn(req, res, next) {
  
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
            var data = req.params.concat({user:clent});
            services.return.deleteReturn(data, req.headers["authorization"], function(err, data) {
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
function checkReturnData(req, res, next) {
  
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
            var data = req.params.concat({user:clent});
            services.return.checkReturnData(data, req.headers["authorization"], function(err, data) {
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

function createReturnpackage(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.return.returnPackageJson(data, req.headers["authorization"], function(err, data) {
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
function getReturnPackage(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            console.log(req.params);
            services.return.getReturnPackage(data, req.headers["authorization"], function(err, data) {
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
function deleteReturnOrderSKU(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.return.deleteReturnOrderSKU(data, req.headers["authorization"], function(err, data) {
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
function deleteReturnPackage(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.return.deleteReturnPackage(data, req.headers["authorization"], function(err, data) {
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