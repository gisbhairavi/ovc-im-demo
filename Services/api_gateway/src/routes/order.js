var services = require('../services/clientservice.js');
var authentication = require('../services/authentication.js');
module.exports = function(server) {
    server.get('/order', getOrder);
    server.put('/order', createOrder);
    server.post('/order/:id', editOrder);
    server.post('/copyorder', copyOrder);
    server.del('/order/:id', deleteOrder);
    server.post('/orderNumbers', getOrderNumbers);

    server.post('/cancelDraftOrder', cancelDraftOrder);
    server.post('/forceCloseOrder', forceCloseOrder);

    server.post('/getProductPerformance', getProductPerformance);
    server.get('/getNewSKUCosts/:purchaseOrderNumber', getSKUCosts);
    server.get('/getstatusreport', getStatusReport);
    server.post('/addorderSKU/:location', addorderSKU);


    server.get('/ordersSummary', getOrdersSummary);
    server.get('/scheduler', getscheduler);

    server.get('/orderitem', getOrderItem);
    server.put('/orderitem', createOrderItem);
    server.post('/orderitem/:id', editOrderItem);
    server.del('/orderitem/:id', deleteOrderItem);

    server.post('/checkOrderItem', checkOrderItem);

    server.get('/count', getCount);
    server.put('/count', createCount);
    server.post('/count/:id', editCount);
    server.del('/count/:id', deleteCount);

    server.get('/countitem', getCountItem);
    server.put('/countitem', createCountItem);
    server.post('/countitem/:id', editCountItem);
    server.del('/countitem/:id', deleteCountItem);

    server.get('/countitemstatus', getCountItemStatus);    

    server.get('/directive', getDirectiveMaster);
    server.put('/directive', createDirectiveMaster);
    server.post('/directive/:id', editDirectiveMaster);
    server.del('/directive/:id', deleteDirectiveMaster);

    server.get('/directiveitem', getDirectiveItem);
    server.put('/directiveitem', createDirectiveItem);
    server.post('/directiveitem/:id', editDirectiveItem);
    server.del('/directiveitem/:id', deleteDirectiveItem);

    server.get('/countzone', getCountZone);
    server.put('/countzone', createCountZone);
    server.post('/countzone/:id', editCountZone);
    server.del('/countzone/:id', deleteCountZone);
    server.post('/uploadCountZone/:countid', uploadCountZone);
    server.post('/saveCountZone/:countid', addCountZone);
    server.post('/createCountSnapshot/:countId', createCountSnapshot);
    server.post('/countSnapshot/:countId', countSnapshot);
    server.post('/addNewZone/:countId', addNewZone);

    server.get('/review', getReview);

    server.post('/review/:id', approveCount);
    server.get('/countitemqty', getCountItemQty);
    server.put('/countitemqty', createCountItemQty);
    server.post('/countitemqty/:id', editCountItemQty);
    server.del('/countitemqty/:id', deleteCountItemQty);

    server.get('/recount', recount);

    server.get('/replenishmentrequest', getReplenishmentRequest);
    server.put('/replenishmentrequest', createReplenishmentRequest);
    server.post('/replenishmentrequest/:id', editReplenishmentRequest);
    server.del('/replenishmentrequest/:id', deleteReplenishmentRequest);

    server.get('/replenishmentfilter', getReplenishmentFilter);
    server.put('/replenishmentfilter', createReplenishmentFilter);
    server.post('/replenishmentfilter/:id', editReplenishmentFilter);
    server.del('/replenishmentfilter/:id', deleteReplenishmentFilter);

    server.get('/api_replenishmentfilter', apiGetReplenishmentFilter);
    server.post('/api_createreplenishmentorder/:id', apiCreateReplenishmentOrder);
    server.get('/api_updateCompleted', api_updateCompleted);

    server.get('/replenishmentrequestitem', getReplenishmentRequestItem);
    server.put('/replenishmentrequestitem', createReplenishmentRequestItem);
    server.post('/replenishmentrequestitem/:id', editReplenishmentRequestItem);
    server.del('/replenishmentrequestitem/:id', deleteReplenishmentRequestItem);

    server.get('/dropship', getDropship);
    server.put('/dropship', createDropship);
    server.post('/dropship/:id', editDropship);
    server.del('/dropship/:id', deleteDropship);
    server.get('/dropshipSKUs/:purchaseordernumber', getdropshipSKUs);
    server.post('/dropshipSKUs', createdropshipSKUs);
    server.del('/dropshipSKUs', deletedropshipSKUs);

    server.post('runReplenishment',runReplenishment)

};
Object.prototype.concat = function(o1, o2) {
    o2 = o2 ? o2 : this;
    for (var key in o2) {
        o1[key] = o2[key];
    }
    return o1;
};
//Order

function getStatusReport(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.order.getStatusReport(data, req.headers["authorization"], function(err, data) {
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

function getOrder(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.order.getOrder(data, function(err, data) {
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
function getSKUCosts(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.order.getSKUCosts(data, function(err, data) {
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

function getProductPerformance(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            data['headers']=req.headers["authorization"];
            services.order.getProductPerformance(data, function(err, data) {
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
function createOrder(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.order.createOrder(data, function(err, data) {
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

function editOrder(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.order.editOrder(req.params.id, data, req.headers["authorization"], function(err, data) {
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

function copyOrder(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.order.copyOrder(data, function(err, data) {
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

function deleteOrder(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.order.deleteOrder(data, req.headers["authorization"], function(err, data) {
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

function getOrderNumbers(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.order.getOrderNumbers(data, function(err, data) {
                if (err) {
                    return res.send({
                        status: 'error',
                        result: err
                    });
                }
                res.send({
                    status: 'success',
                    result: data
                });
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

function cancelDraftOrder(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.order.cancelDraftOrder(data, req.headers["authorization"], function(err, data) {
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

function forceCloseOrder(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.order.forceCloseOrder(data, req.headers["authorization"], function(err, data) {
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

function getscheduler(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.order.getScheduler(data, req.headers["authorization"], function(err, data) {
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

function runReplenishment(req, res, next){
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.order.runReplenishment(data, req.headers["authorization"], function(err, data) {
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


//orderitem
function getOrderItem(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.orderItem.getOrderItem(data, function(err, data) {
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

function createOrderItem(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.orderItem.createOrderItem(data, req.headers["authorization"], function(err, data) {
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

function editOrderItem(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.orderItem.editOrderItem(req.params.id, data, req.headers["authorization"], function(err, data) {
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

function checkOrderItem(req, res, next) {

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var clent = JSON.parse(body);
        if(clent === null || clent.clientId === null && clent.clientId === undefined){return res.send(body);}
        var data = req.params.concat({user:clent});
            services.orderItem.checkOrderItem(data, function(err, data) {
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

function deleteOrderItem(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.orderItem.deleteOrderItem(data, function(err, data) {
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

function getCount(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.count.getCount(data, function(err, data) {
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

function createCount(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.count.createCount(data, function(err, data) {
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

function editCount(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.count.editCount(req.params.id, data, function(err, data) {
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

function deleteCount(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.count.deleteCount(data, function(err, data) {
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
//countitem
function getCountItem(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.countItem.getCountItem(data, function(err, data) {
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

function getCountItemStatus(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.countItem.getCountItemStatus(data, function(err, data) {
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


function createCountItem(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.countItem.createCountItem(data, req.headers["authorization"], function(err, data) {
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

function editCountItem(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.countItem.editCountItem(req.params.id, data, function(err, data) {
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

function deleteCountItem(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.countItem.deleteCountItem(data, function(err, data) {
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

function getDirectiveMaster(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.directive.getDirectiveMaster(data, function(err, data) {
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

function createDirectiveMaster(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.directive.createDirectiveMaster(data, function(err, data) {
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

function editDirectiveMaster(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.directive.editDirectiveMaster(req.params.id,data, function(err, data) {
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

function deleteDirectiveMaster(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.directive.deleteDirectiveMaster(data, function(err, data) {
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
//DirectiveItem
function getDirectiveItem(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.directiveitem.getDirectiveItem(data, function(err, data) {
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

function createDirectiveItem(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.directiveitem.createDirectiveItem(data, function(err, data) {
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

function editDirectiveItem(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.directiveitem.editDirectiveItem(req.params.id, data, function(err, data) {
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

function deleteDirectiveItem(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.directiveitem.deleteDirectiveItem(data, function(err, data) {
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
//CountZone
function getCountZone(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.countZone.getCountZone(data, function(err, data) {
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

function createCountZone(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.countZone.createCountZone(data, function(err, data) {
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

function editCountZone(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.countZone.editCountZone(req.params.id, data, function(err, data) {
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

function deleteCountZone(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.countZone.deleteCountZone(data, function(err, data) {
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
//Review
function getReview(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.review.getReview(data, function(err, data) {
                if (err) {
                    return res.send({
                        error: err
                    });
                }
                console.log(data);
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

function approveCount(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            data.headers = req.headers["authorization"];
            services.review.approveCount(req.params.id, data, function(err, data) {
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
//countItemQty
function getCountItemQty(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.countItemQty.getCountItemQty(data, function(err, data) {
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

function createCountItemQty(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.countItemQty.createCountItemQty(data, function(err, data) {
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

function editCountItemQty(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.countItemQty.editCountItemQty(req.params.id,data, function(err, data) {
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

function deleteCountItemQty(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.countItemQty.deleteCountItemQty(data, function(err, data) {
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
//recount
function recount(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.recount.recount(data, function(err, data) {
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
//replenishmentRequest
function getReplenishmentRequest(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.replenishmentRequest.getReplenishmentRequest(data, function(err, data) {
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

function createReplenishmentRequest(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.replenishmentRequest.createReplenishmentRequest(data, function(err, data) {
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

function editReplenishmentRequest(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.replenishmentRequest.editReplenishmentRequest(req.params.id, data, function(err, data) {
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

function deleteReplenishmentRequest(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.replenishmentRequest.deleteReplenishmentRequest(data, function(err, data) {
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
//replenishmentFilter
function getReplenishmentFilter(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.replenishmentFilter.getReplenishmentFilter(data, function(err, data) {
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

function createReplenishmentFilter(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.replenishmentFilter.createReplenishmentFilter(data, function(err, data) {
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

function editReplenishmentFilter(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.replenishmentFilter.editReplenishmentFilter(req.params.id, data, function(err, data) {
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

function deleteReplenishmentFilter(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.replenishmentFilter.deleteReplenishmentFilter(data, function(err, data) {
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
//replenishmentRequestItem
function getReplenishmentRequestItem(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.replenishmentRequestItem.getReplenishmentRequestItem(data, function(err, data) {
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

function createReplenishmentRequestItem(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.replenishmentRequestItem.createReplenishmentRequestItem(data, function(err, data) {
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

function editReplenishmentRequestItem(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.replenishmentRequestItem.editReplenishmentRequestItem(req.params.id, data, function(err, data) {
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
// checkOauth updated by Ratheesh.
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
function getDropship(req, res, next) {
    checkOauth(req, res, function(data) {
        if (data) {
            services.dropship.getDropship(data, function(err, data) {
                if (err) {
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
function createDropship(req, res, next) {
    checkOauth(req, res, function(data) {
        if (data) {
            services.dropship.createDropship(data, function(err, data) {
                if (err) {
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
function editDropship(req, res, next) {
    checkOauth(req, res, function(data) {
        if (data) {
            services.dropship.editDropship(req.params.id,data, function(err, data) {
                if (err) {
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
function deleteDropship(req, res, next) {
    checkOauth(req, res, function(data) {
        if (data) {
            services.dropship.deleteDropship(data, req.headers["authorization"], function(err, data) {
                if (err) {
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
function getdropshipSKUs(req, res, next) {
    checkOauth(req, res, function(data) {
        if (data) {
            services.dropship.getdropshipSKUs(data, function(err, data) {
                if (err) {
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
function createdropshipSKUs(req, res, next) {
    checkOauth(req, res, function(data) {
        if (data) {
            services.dropship.createdropshipSKUs(data, req.headers["authorization"], function(err, data) {
                if (err) {
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
function deletedropshipSKUs(req, res, next) {
    checkOauth(req, res, function(data) {
        if (data) {
            services.dropship.deletedropshipSKUs(data, req.headers["authorization"], function(err, data) {
                if (err) {
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
function addorderSKU(req, res, next) {
    checkOauth(req, res, function(data) {
        if (data) {
            services.order.addorderSKU(data, req.headers["authorization"], function(err, data) {
                if (err) {
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
function createCountSnapshot(req, res, next) {
    checkOauth(req, res, function(data) {
        if (data) {
            services.count.createCountSnapshot(data, req.headers["authorization"], function(err, data) {
                if (err) {
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
function countSnapshot(req, res, next) {
    checkOauth(req, res, function(data) {
        if (data) {
            services.count.getcountSnapshot(data, req.headers["authorization"], function(err, data) {
                if (err) {
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
function addNewZone(req, res, next) {
    checkOauth(req, res, function(data) {
        if (data) {
            services.count.addNewZone(data, req.headers["authorization"], function(err, data) {
                if (err) {
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
function addCountZone(req, res, next) {
    checkOauth(req, res, function(data) {
        if (data) {
            services.count.addCountZone(data, req.headers["authorization"], function(err, data) {
                if (err) {
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
function uploadCountZone(req, res, next) {
    checkOauth(req, res, function(data) {
        if (data) {
            services.count.uploadCountZone(data, req.headers["authorization"], function(err, data) {
                if (err) {
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
function deleteReplenishmentRequestItem(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.replenishmentRequestItem.deleteReplenishmentRequestItem(data, function(err, data) {
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

function getOrdersSummary(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.order.getOrdersSummary(data, function(err, data) {
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

//replenishmentFilter api
function apiGetReplenishmentFilter(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({user:clent});
            services.replenishmentFilter.apiGetReplenishmentFilter(data, function(err, data) {
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
//create replenishment api
function apiCreateReplenishmentOrder(req, res, next) {
    checkOauth(req, res, function(data) {
        if (data) {
            services.replenishmentFilter.apiCreateReplenishmentOrder(data, req.headers["authorization"], function(err, data) {
                if (err) {
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

//create replenishment api
function api_updateCompleted(req, res, next) {
    checkOauth(req, res, function(data) {
        if (data) {
            services.order.api_updateCompleted(data, req.headers["authorization"], function(err, data) {
                if (err) {
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
