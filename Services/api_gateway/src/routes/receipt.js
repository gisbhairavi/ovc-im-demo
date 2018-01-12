var services = require('../services/clientservice.js');
var authentication = require('../services/authentication.js');

module.exports = function(server) {
    server.get('/receipt', getReceipt);
    server.put('/receipt', createReceipt);
    server.del('/receipt/:id', deleteReceipt)

    server.get('/receiptpackage', getReceiptPackage);
    // server.put('/receiptpackage/:id', createReceiptPackage);
    server.put('/receiptpackage', createReceiptPackage);
    server.put('/reversemanualreceipt', reverseManualReceipt);

};
Object.prototype.concat=function(o1, o2) {
    o2 = o2 ? o2 : this;
    for (var key in o2) {
        o1[key] = o2[key];
    }
    return o1;
};

function getReceipt(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){
            return res.send(body);
        }
        var data = req.params.concat({user:clent});
        services.receipt.getReceipt(data, function(err, data) {
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

function createReceipt(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
            var data = req.params.concat({user:clent});
            services.receipt.createReceipt(req.body, function(err, data) {
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

// function editReceipt(req, res, next) {

//   function callback(error, response, body) {
//       if (!error && response.statusCode == 200) {
//         var clent = JSON.parse(body);
//         if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
//             var data = req.params.concat({user:clent});
//             services.receipt.editReceipt(req.params.id, req.body, function(err, data) {
//               if (err) { return res.send({error: err});}
//               res.send(data);
//             });
//         return null;
//       }else{
//         res.send({error: "invalid_token"});
//       }
//   }
//   authentication.checkOauth(req, callback);

//   return next();
// }

function deleteReceipt(req, res, next) {
  
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
            var data = req.params.concat({user:clent});
            services.receipt.deleteReceipt(data, req.headers["authorization"], function(err, data) {
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

function createReceiptPackage(req, res, next) {

        
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
            var data = req.params.concat({user:clent});
            services.receipt.createReceiptPackage(data, req.headers["authorization"], function(err, data) {
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

function getReceiptPackage(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
            var data = req.params.concat({user:clent});
            services.receipt.getReceiptPackage({orderData:data}, req.headers["authorization"], function(err, data) {
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

function reverseManualReceipt(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
            var data = req.params.concat({user:clent});
            services.receipt.reverseManualReceipt({orderData:data}, req.headers["authorization"], function(err, data) {
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