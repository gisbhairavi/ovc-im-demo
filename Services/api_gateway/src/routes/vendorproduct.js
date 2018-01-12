var services = require('../services/clientservice.js');
var authentication = require('../services/authentication.js');
module.exports = function(server) {
    server.get('/vendorproduct/:vendorid', getVendorProductByVendor);
    server.post('/vendorByProduct', getVendorByProduct);
    server.post('/vendorproduct/:vendorid', editVendorproductByVendor);
    server.del('/vendorproduct/:id', deleteVendorProduct);
    server.put('/vendorproduct/:id', activateVendorProduct);
    server.get('/addAllproduct/:vendorid', addAllproduct);
};
Object.prototype.concat = function(o1, o2) {
    o2 = o2 ? o2 : this;
    for (var key in o2) {
        o1[key] = o2[key];
    }
    return o1;
};

function getVendorByProduct(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
           var data = req.params.concat({user:clent});
            services.vendorproduct.getVendorByProduct(data, req.headers["authorization"], function(err, data) {
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
function getVendorProductByVendor(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            services.vendorproduct.getVendorProductByVendor(req.params, function(err, data) {
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

function addAllproduct(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user: clent});
            services.vendorproduct.addAllproduct(data, function(err, data) {
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

function editVendorproductByVendor(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user: clent});
            services.vendorproduct.editVendorproductByVendor(req.params.vendorid, data, function(err, data) {
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

function deleteVendorProduct(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user: clent});
            services.vendorproduct.deleteVendorProduct(data, function(err, data) {
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

function activateVendorProduct(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user: clent});
            services.vendorproduct.activateVendorProduct(data, function(err, data) {
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
function getVendorProductByVendor(req, res, next) {

  services.vendorproduct.getVendorProductByVendor(req.params, function(err, data) {
    if (err) {
      return res.send({error: err});
    }
    res.send(data);
  });

  return next();
}

function editVendorproductByVendor(req, res, next) {
  services.vendorproduct.editVendorproductByVendor(req.params.vendorid, req.body, function(err, data) {
    if (err) {
      return res.send({error: err});
    }
    res.send(data);
  });

  return next();
}

function deleteVendorProduct(req, res, next) {
  services.vendorproduct.deleteVendorProduct(req.params.id, function(err, data) {
    if (err) {
      return res.send({error: err});
    }
    res.send(data);
  });

  return next();
}

function activateVendorProduct(req, res, next) {
  services.vendorproduct.activateVendorProduct(req.params, function(err, data) {
    if (err) {
      return res.send({error: err});
    }
    res.send(data);
  });

  return next();
}
*/