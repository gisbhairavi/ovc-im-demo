var services = require('../services/clientservice.js');
var request = require('request');
var log = require('../log');
var config = require('../../config/app.json');
var env_config = require('../../config/config');

module.exports = {
  checkOauth: checkOauth
};

/*
 * checkOauth.
 */
function checkOauth(req, callback) {
    console.log(req.params);
    if (req.params.apiKey) {
        services.dashboard.getToken({
            code: req.params.apiKey
        }, function(err, data) {
            if (err) {
                callback(err);
            } else if (data.error) {
                callback(data);
            } else {
                req.headers["authorization"] = 'bearer ' + data.token;
                var options = {
                    url: env_config.authUrl + config.auth.verify_url,
                    headers: {
                        'authorization': req.headers["authorization"]
                    }
                };
                request(options, callback);
            }
        });
    } else {
        var options = {
            url: env_config.authUrl + config.auth.verify_url,
            headers: {
                'authorization': req.headers["authorization"]
            }
        };
        request(options, callback);
    }
}