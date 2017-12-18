var services = require('../services/clientservice.js');
var authentication = require('../services/authentication.js');

module.exports = function(server) {
  server.get('/documentrule', getDocumentrule);
  server.put('/documentrule', createDocumentrule);
  server.post('/documentrule/:id', editDocumentrule);
  server.del('/documentrule/:id', deleteDocumentrule);
};
Object.prototype.concat=function(o1, o2) {
   o2 = o2 ? o2 : this;
   for (var key in o2) {
       o1[key] = o2[key];
   }
   return o1;
};


function getDocumentrule(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.documentrule.getDocumentrule(data, function(err, data) {
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

function createDocumentrule(req, res, next) {
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.documentrule.createDocumentrule(data, function(err, data) {
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

function editDocumentrule(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.documentrule.editDocumentrule(req.params.id, data, function(err, data) {
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

function deleteDocumentrule(req, res, next) {
  
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.documentrule.deleteDocumentrule(data, function(err, data) {
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

