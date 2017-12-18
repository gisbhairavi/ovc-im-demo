var services = require('../services/clientservice.js');
var authentication = require('../services/authentication.js');
var dashboard = require('../services/dashboard.js');
var env_config = require('../../config/config');
var constant = require('../../config/const.json');
module.exports = function(server) {
    console.log("*****test1 loadjson***********");
    server.post('/uploadjson', uploadjson);
    server.post('/receivingpurchasejson', receivingpurchasejson);
    server.get('/purchaseOrderShipments/:po_id', shipment);
    server.get('/shipmentdata/:poId', shipmentdata);
    server.put('/receivedpackage', receivedpackage);
    server.post('/pomatrixdata', pomatrixdata);
    server.put('/createqtystatus', createqtystatus);
    server.get('/download', getDownloads);
    server.del('/download/:download_id', deleteDownloads);
    server.post('/download/:download_id', updateDownloads);
    server.get('/download/:download_id', getDownloads);
    server.post('/countsuploadjson', countsuploadjson);
    server.post('/updatebalanceType', updatebalanceType);
    server.get('/poasn', getPoAsn);
    server.get('/ovcdashboard/apis/:url', getovcdashboard);
    server.post('/ovcdashboard/apis/:url', getovcdashboard_post);
    server.get('/json/resources/:url', getPOSresources);
    server.post('/json/resources/:url', getPOSresources);
    server.post('/jmspublish/:type', jmspublish);
    server.post('/jmsreceive/:type', jmsreceive);
    server.post('/awspublish/:type', awspublish);
    server.post('/awsreceive/:type', awsreceive);
    server.put('/reversereceiptpackage', reverseReceiptPackage);
    server.put('/closedasnpackage', closedAsnPackage);
    server.post('/reverseIBTOrders', reverseIBTOrders);
};
Object.prototype.concat = function(o1, o2) {
    o2 = o2 ? o2 : this;
    for (var key in o2) {
        o1[key] = o2[key];
    }
    return o1;
};

function uploadjson(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.jsons.uploadjson(req.files ? req.files.concat({
                user: clent
            }) : data ,req.headers["authorization"], function(err, data) {
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
/***********************************************************************
 *
 * FUNCTION:    getOvcdashboard
 *
 * DESCRIPTION: get Ovcdashboard.
 *
 * PARAMETERS:     request and response and callback.
 *
 * RETURNED:    none.
 *
 * REVISION HISTORY:
 *
 *            Name    Date        Description
 *            ----    ----        -----------
 *            Ratheesh    4/02/2016    First Version
 *
 ***********************************************************************/
function getovcdashboard(req, res, next) {
  //  console.log("*********getovcdashboard req*******"+req.header);
    // var options = {
    //     url: env_config.dashPath +'apis/ang_loginapi'+ req.params.url
    // headers: { 'authorization': req.headers["authorization"] }
    // };
    // request(options,      function(err, data,result){
    //          res.end(data);
    // }    );
    function callback(error, response, data) {
        // res.send(response.statusCode);
        // res.writeHead(response.statusCode, response.headers);
        return res.end(response['body']);
    }
    if (req.params.url === constant.apis.GETDASHLOGINPATH) {
        dashboard.getOvcdashboard('GET', req, callback);
    } else if (req.params.url === constant.apis.GETDASHLOGIN) {
        console.log(env_config.dashPath + 'apis/' + req.params.url + '?' + require('qs').stringify(req.params));
        function getqs(data) {
            data.url = '';
            return data;
        };
        res.redirect(env_config.dashPath + 'apis/' + req.params.url + '?' + require('qs').stringify(getqs(req.params)), function() {});
    } else {
        function oauthcallback(error, response, body) {
            if (!error && response.statusCode == 200) {
                var clent = JSON.parse(body);
                if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                    return res.send({
                        error: "invalid_token"
                    });
                }
                dashboard.getOvcdashboard('GET', req, callback);
            } else {
                res.send({
                    error: "invalid_token"
                });
                return false;
            }
        }
        authentication.checkOauth(req, oauthcallback);
    }
console.log('From Load Json : ', 'origin : ' ,req.headers['origin'],'Origin : ',req.headers['Origin']);
    // res.header("Access-Control-Allow-Origin", req.headers['origin']);
    // res.header('Access-Control-Allow-Credentials', "true");




  //  console.log("********* aftergetovcdashboard res *******"+res.header);
  //console.log(res);

    return next();
}

function getovcdashboard_post(req, res, next) {
    // var options = {
    //     url: env_config.dashPath +'apis/ang_loginapi'+ req.params.url
    // headers: { 'authorization': req.headers["authorization"] }
    // };
    // request(options,      function(err, data,result){
    //          res.end(data);
    // }    );
    function callback(error, response, body) {
        // res.send(response.statusCode);
        // res.writeHead(response.statusCode, response.headers);
        return res.end(response['body']);
    }
    if (req.params.url === constant.apis.GETDASHLOGINPATH) {
        dashboard.getOvcdashboard('POST', req, callback);
    } else {
        function oauthcallback(error, response, body) {
            if (!error && response.statusCode == 200) {
                var clent = JSON.parse(body);
                if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                    return res.send({
                        error: "invalid_token"
                    });
                }
                dashboard.getOvcdashboard('POST', req, callback);
            } else {
                res.send({
                    error: "invalid_token"
                });
                return false;
            }
        }
        authentication.checkOauth(req, oauthcallback);
    }
    return next();
}

function pomatrixdata(req, res, next) {
    console.log('pomatrixdata - before auth check.');
    console.log('------------------------------');
    console.log('req.headers',req.headers);
    console.log('------------------------------');
    console.log('res.headers',res.headers());
    console.log('------------------------------');
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
    console.log('------------------------------');
    console.log('pomatrixdata - before pomatrixdata services.',JSON.stringify(data));
    console.log('req.headers',req.headers);
    console.log('------------------------------');
    console.log('res.headers',res.headers());
    console.log('------------------------------');
            services.jsons.pomatrixdata(data, req.headers["authorization"], function(err, data) {
                if (err) {
                    return res.send({
                        error: err
                    });
                }
    console.log('------------------------------');
    console.log('pomatrixdata - pomatrixdata services done.',JSON.stringify(data),res.headers());
    console.log('------------------------------');
    console.log('req.headers',req.headers);
    console.log('------------------------------');
    console.log('res.headers',res.headers());
    console.log('------------------------------');
                res.send(data);
    console.log('------------------------------');
    console.log('pomatrixdata - pomatrixdata services completed.',res.headers());
    console.log('------------------------------');
            });
            return null;
        } else {
            res.send({
                error: "invalid_token"
            });
        }
    res.header("Access-Control-Allow-Origin", req.headers['origin']);
    res.header('Access-Control-Allow-Credentials', "true");

    }
    authentication.checkOauth(req, callback);
    return next();
}

function updatebalanceType(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.jsons.updatebalanceType(data, req.headers["authorization"], function(err, data) {
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

function countsuploadjson(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            services.jsons.countsuploadjson(req.files ? req.files.concat({
                user: clent
            }) : req.params.concat({
                user: clent
            }), req.headers["authorization"], function(err, data) {
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

function receivingpurchasejson(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            services.jsons.receivingpurchasejson(req.files ? req.files.concat({
                user: clent
            }) : req.params.concat({
                user: clent
            }), req.headers["authorization"], function(err, data) {
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

function shipment(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.jsons.getshipment(data, req.headers["authorization"], function(err, data) {
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

function shipmentdata(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.jsons.shipmentdata(data, function(err, data) {
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

function receivedpackage(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.jsons.receivedpackage(data, req.headers["authorization"], function(err, data) {
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

function createqtystatus(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.jsons.createqtystatus(data, req.headers["authorization"], function(err, data) {
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

function getPoAsn(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.jsons.getPoAsn(data, req.headers["authorization"], function(err, data) {
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

function closedAsnPackage(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.jsons.closedAsnPackage(data, req.headers["authorization"], function(err, data) {
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

function reverseReceiptPackage(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.jsons.reverseReceiptPackage(data, req.headers["authorization"], function(err, data) {
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

function reverseIBTOrders(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var data = req.params.concat({
                user: clent
            });
            services.reverseOrders.reverseIBTOrders(data, req.headers["authorization"], function(err, data) {
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

function jmspublish(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var request = require('request');
            var options = {
                url: env_config.posPath + constant.apis.JMS_POSTDATA + req.params.type,
                // url: env_config.dashPath + 'apis/' + req.params.url + '?' + qs.stringify(query),
                method: 'POST',
                body: req.params.data
            };console.log(options);
            request(options, function(err, response, data) {
                res.send({
                    data: data,
                    json: req.params.data
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

function jmsreceive(req, res, next) {
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var clent = JSON.parse(body);
            if (clent === null || clent.clientId === null && clent.clientId === undefined) {
                return res.send(body);
            }
            var request = require('request');
            var options = {
                url: env_config.posPath + constant.apis.JMS_GETDATA + req.params.type,
                // url: env_config.dashPath + 'apis/' + req.params.url + '?' + qs.stringify(query),
                method: 'POST',
                body: req.params.data
            };console.log(options);
            request(options, function(err, response, data) {
                res.send({
                    data: data
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
function awspublish(req, res, next) {
    checkOauth(req, res, function(data) {
        if (data) {
            services.aws.awsPublish(data, function(err, data) {
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

function awsreceive(req, res, next) {
    checkOauth(req, res, function(data) {
        if (data) {
            services.aws.awsReceive(data, function(err, data) {
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

function getPOSresources(req, res, next) {
    checkOauth(req, res, function(data) {
        if (data) {
            var request = require('request');
            var query = JSON.parse(JSON.stringify(req.params));
            delete query.url;
            var options = {
                url: env_config.posPath + '/resources/' + req.params.url,
            };
            if (req.method == 'GET') {
                options['method'] = 'GET';
                options['url'] = options['url'] + '?' + qs.stringify(query);
            } else {
                options['method'] = 'POST';
                options['body'] = JSON.stringify(query);
            };
            console.log(options);
            request(options, function(err, response, data) {
                try {
                    return res.send({
                        data:JSON.parse(data) 
                    });
                } catch (e) {
                    console.log(e);
                    return res.send({
                        data: 'error'
                    });
                }
            });
        }
    });
    return next();
}
function getDownloads(req, res, next){
    checkOauth(req, res, function(data) {
        if (data) {
            services.download.getDownloads(data, function(err, download) {
                if (err) {
                    return res.send({
                        error: err
                    });
                }
                if (data.download) {
                    return res.send(download);
                }else {
                     res.send(download);
                }

            });
        }
    });
}
function updateDownloads(req, res, next){
    checkOauth(req, res, function(data) {
        if (data) {
            services.download.updateDownloads(data, function(err, data) {
                if (err) {
                    return res.send({
                        error: err
                    });
                }
                res.send(data);
            });
        }
    });
}
function deleteDownloads(req, res, next){
    checkOauth(req, res, function(data) {
        if (data) {
            services.download.deleteDownloads(data, function(err, data) {
                if (err) {
                    return res.send({
                        error: err
                    });
                }
                res.send(data);
            });
        }
    });
}