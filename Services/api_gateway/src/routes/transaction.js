var services = require('../services/clientservice.js');
var authentication = require('../services/authentication.js');
var fs  = require('fs');
module.exports = function(server) {
  
  server.get('/transactiontype', getTransactionType);
  server.put('/transactiontype', createTransactionType);
  server.post('/transactiontype/:id', editTransactionType);
  server.del('/transactiontype/:id', deleteTransactionType);

  server.get('/transactionrule', getTransactionRule);
  server.put('/transactionrule', createTransactionRule);
  server.post('/transactionrule/:id', editTransactionRule);
  server.del('/transactionrule/:id', deleteTransactionRule);


  server.get('/transaction', getTransaction);
  server.put('/transaction', createTransaction);
  server.post('/transaction/:id', editTransaction);
  server.del('/transaction/:id', deleteTransaction);

  server.get('/transactionitem', getTransactionitem);
  server.put('/transactionitem', createTransactionitem);
  server.post('/transactionitem/:id', editTransactionitem);
  server.del('/transactionitem/:id', deleteTransactionitem);

  server.get('/transactioniteminventory', getTransactioniteminventory);
  server.put('/transactioniteminventory', createTransactioniteminventory);
  server.post('/transactioniteminventory/:id', editTransactioniteminventory);
  server.del('/transactioniteminventory/:id', deleteTransactioniteminventory);

  server.get('/locationiteminventory', getLocationItemInventory);

  server.get('/history', getTransactionHistory);
  server.get('/trantypeqtyData', getTrantypeqtyData);
  server.get('/historyitem', getTransactionitemHistory);
  server.post('/historyinventory', getTransactioniteminventoryHistory);

  server.post('/stockbalances', getStockBalances);
  server.post('/getBalanceReport', getBalanceReport);
  server.post('/getStatusReport', getStatusReport);
  server.post('/getBalanceReportExcel', getBalanceReportExcel);
 
 
  server.get('/adjustment', getAdjustment);
  server.put('/adjustment', createAdjustment);
  server.post('/adjustment/:id', editAdjustment);
  server.del('/adjustment/:id', deleteAdjustment);
  server.get('/adjustmentData', getAdjustmentData);
  server.post('/copyadjustment', copyAdjustment);

  server.get('/adjustmentitem', getAdjustmentItem);
  server.put('/adjustmentitem', createAdjustmentItem);
  server.post('/adjustmentitem/:id', editAdjustmentItem);
  server.del('/adjustmentitem/:id', deleteAdjustmentItem);

  server.post('/checkAdjustmentItem', checkAdjustmentItem);

};
Object.prototype.concat=function(o1, o2) {
   o2 = o2 ? o2 : this;
   for (var key in o2) {
       o1[key] = o2[key];
   }
   return o1;
};

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

function getTrantypeqtyData(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
           var data = req.params.concat({user:clent});  
           services.transaction.getTrantypeqtyData(data,function(err, data) {
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

function getBalanceReport(req, res, next) {

    checkOauth(req, res, function(data) 
    {
        if (data) 
        {
            services.transaction.getBalanceReport(data, function(err, data) {
                if (err) 
                {
                    return res.send({
                        error: err
                    });
                }
                res.send(data);
            });
            return null;
        } 
    });
    return next();
}

//****Get Status Report****// 
function getStatusReport(req, res, next) {

    checkOauth(req, res, function(data) 
    {
        if (data) 
        {
            services.transaction.getStatusReport(data, function(err, data) {
                if (err) 
                {
                    return res.send({
                        error: err
                    });
                }
                res.send(data);
            });
            return null;
        } 
    });
    return next();
}

function getBalanceReportExcel(req, res, next) {

    checkOauth(req, res, function(data) 
    {
        if (data) 
        {
            services.transaction.getBalanceReportExcel(data, function(err, balanceReportData) {
                if (err) 
                { 
                  return res.send({
                        error: err
                    });
                }
                try{
                    var uploadData = {};
                    uploadData.Body = balanceReportData;
                    uploadData.user = data.user;
                    var date = new Date();
                    uploadData.fileName = data.fileName||'balanceReport'+date.getTime();
                    uploadData.fileName +='.xlsx';
                    uploadData.Key =data.user.clientId + '/' + uploadData.fileName;
                    services.aws.uploadBalanceReport(uploadData, function(err, data) {
                        if (err) 
                        { 
                          return res.send({
                                error: err
                            });
                        }else {
                                res.send({
                                    status: "success",
                                    url: data.url,
                                });
                        }
                    });
                }catch(error){
                  console.log(error , 'File Write Error Check');
                  res.send({status:"Failed",message:error});
                }
            });
            return null;
        } 
    });
    return next();
}

function getTransactionType(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.transactiontype.getTransactionType(data, function(err, data) {
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

function createTransactionType(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.transactiontype.createTransactionType(data, function(err, data) {
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

function editTransactionType(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.transactiontype.editTransactionType(req.params.id, data, function(err, data) {
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

function deleteTransactionType(req, res, next) {
  
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.transactiontype.deleteTransactionType(data, function(err, data) {
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

function getTransactionRule(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.transactionrule.getTransactionRule(data, function(err, data) {
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

function createTransactionRule(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.transactionrule.createTransactionRule(data, function(err, data) {
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

function editTransactionRule(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.transactionrule.editTransactionRule(req.params.id, data, function(err, data) {
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

function deleteTransactionRule(req, res, next) {
  
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.transactionrule.deleteTransactionRule(data, function(err, data) {
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

/* Transaction */

function getTransaction(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.transaction.getTransaction(data, function(err, data) {
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

function createTransaction(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.transaction.createTransaction(data, function(err, data) {
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

function editTransaction(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.transaction.editTransaction(req.params.id, data, function(err, data) {
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

function deleteTransaction(req, res, next) {
  
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.transaction.deleteTransaction(data, function(err, data) {
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

/* Transaction Item */

function getTransactionitem(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.transactionitem.getTransactionitem(data, function(err, data) {
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

function createTransactionitem(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.transactionitem.createTransactionitem(data, function(err, data) {
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

function editTransactionitem(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.transactionitem.editTransactionitem(req.params.id, data, function(err, data) {
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

function deleteTransactionitem(req, res, next) {
  
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.transactionitem.deleteTransactionitem(data, function(err, data) {
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


/*Transaction item Inventory */

function getTransactioniteminventory(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.transactioniteminventory.getTransactioniteminventory(data, function(err, data) {
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

function createTransactioniteminventory(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.transactioniteminventory.createTransactioniteminventory(data, function(err, data) {
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

function editTransactioniteminventory(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.transactioniteminventory.editTransactioniteminventory(req.params.id,data, function(err, data) {
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

function deleteTransactioniteminventory(req, res, next) {
  
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.transactioniteminventory.deleteTransactioniteminventory(data, function(err, data) {
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

function getStockBalances(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
           var data = req.params.concat({user:clent});  
           services.history.getStockBalances(data,req.params.loc, req.headers["authorization"], function(err, data) {
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
//History
function getTransactionHistory(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
           var data = req.params.concat({user:clent});  
           services.history.getTransactionHistory(data, function(err, data) {
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
function getTransactionitemHistory(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.history.getTransactionitemHistory(data, function(err, data) {
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
function getTransactioniteminventoryHistory(req, res, next) {
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.history.getTransactioniteminventoryHistory(data, function(err, data) {
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


/* Adjustment */

function getAdjustment(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.adjustment.getAdjustment(data, function(err, data) {
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

function createAdjustment(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.adjustment.createAdjustment(data, function(err, data) {
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

function editAdjustment(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.adjustment.editAdjustment(req.params.id, data, req.headers["authorization"], function(err, data) {
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

function copyAdjustment(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.adjustment.copyAdjustment(data, function(err, data) {
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

function deleteAdjustment(req, res, next) {
  
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.adjustment.deleteAdjustment(data, function(err, data) {
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

function getAdjustmentData(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.adjustment.getAdjustmentData(data, function(err, data) {
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

/* Adjustment Item */

function getAdjustmentItem(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.adjustmentItem.getAdjustmentItem(data, function(err, data) {
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

function createAdjustmentItem(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.adjustmentItem.createAdjustmentItem(data, req.headers["authorization"], function(err, data) {
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

function editAdjustmentItem(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.adjustmentItem.editAdjustmentItem(req.params.id, data,req.headers["authorization"], function(err, data) {
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

function checkAdjustmentItem(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.adjustmentItem.checkAdjustmentItem(data, function(err, data) {
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

function deleteAdjustmentItem(req, res, next) {
  
  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.adjustmentItem.deleteAdjustmentItem(data, function(err, data) {
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
    Service to get all Inventory Items Based on Location.
*/
function getLocationItemInventory(req, res, next) {
    checkOauth(req, res, function(data) 
    {
        if (data) 
        {
            services.transactioniteminventory.getLocationItemInventory(data, function(err, data) {
                if (err) 
                {
                    return res.send({
                        error: err
                    });
                }
                res.send(data);
            });
            return null;
        } 
    });
    return next();
}