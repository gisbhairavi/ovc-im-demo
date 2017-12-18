/**
 * Module dependencies.
 */
var oauth2orize = require('oauth2orize');
var passport = require('passport');
//var login = require('connect-ensure-login');
var client = require('./../model/client');
var accessTokens = require('./../model/accessTokens');
var authorizationCodes = require('./../model/authorizationCodes');
var utils = require('./utils');
var log = require('./../log');

// create OAuth 2.0 server
var server = oauth2orize.createServer();

// Register serialialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated.  To complete the transaction, the
// user must authenticate and approve the authorization request.  Because this
// may involve multiple HTTP request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session.  Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.

server.serializeClient(function(client, done) {
  return done(null, client.id);
});

server.deserializeClient(function(id, done) {
  client.find(id, function(err, client) {
    if (err) { return done(err); }
    return done(null, client);
  });
});

// Register supported grant types.
//
// OAuth 2.0 specifies a framework that allows users to grant client
// applications limited access to their protected resources.  It does this
// through a process of the user granting access, and the client exchanging
// the grant for an access token.

// Grant authorization codes.  The callback takes the `client` requesting
// authorization, the `redirectURI` (which is used as a verifier in the
// subsequent exchange), the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application.  The application issues a code, which is bound to these
// values, and will be exchanged for an access token.

server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
  var code = utils.uid(16)
  var codeobj = new authorizationCodes({ code: code, userId: user, clientId: client });
  codeobj.save(function(err) {
    if (err) { return done(err); }
    done(null, code);
  });
}));

// Exchange authorization codes for access tokens.  The callback accepts the
// `client`, which is exchanging `code` and any `redirectURI` from the
// authorization request for verification.  If these values are validated, the
// application issues an access token on behalf of the user who authorized the
// code.

server.exchange(oauth2orize.exchange.code(function(client, code, redirectURI, done) {
  authorizationCodes.findOne({code: code}, function(err, authCode) {
    if (err) { return done(err); }
    if (authCode === null || authCode === undefined) { return done(null, false); }
    //if (client.id !== authCode.userId) { return done(null, false); }
      authCode.remove({code: code}, function(err) {
        if(err) { return done(err); }
        var token = utils.uid(256);
        var tokenobj = new accessTokens({ token: token, userId: authCode.userId, clientId: authCode.clientId });
        tokenobj.save(function(err, token) {
          if (err) { return done(err); }
            done(null, token);
        });
      });
  });
}));


//save a client with the clientSecret. 
exports.saveClient = function(request, response, done){
  log.info("save client info");
  var clientobj = new client({ clientId: request.body.clientId, clientSecret: request.body.clientSecret});
  clientobj.save(function(err, user) {
    if (err) {
      log.error({err: err}, "oauth db connecction clientobj");
      return done(err); 
    }
    var code = utils.uid(16);
    log.info("code "+code);
    var codeobj = new authorizationCodes({ code: code, userId: user.id, clientId: user.clientId });
    codeobj.save(function(err, codeResult) {
      if (err) {
        log.error({err: err}, "oauth db connecction codeobj"); 
        return done(err); 
      }
      log.info("codeResult "+codeResult);
      response.json(codeResult);
    });
  });
}

//remove the client with the clientSecret combination.
//remove the auccess token for this client
exports.removeToken = function(request, response, done){
  var val = request.headers["authorization"];
  val = val.substring(6).trim();
  accessTokens.findOne({token: val}, function(err, token) {
    if (err) { return err; }
    if (!token) { return done(null, false); }
    client.remove({_id: token.userId}, function(err) {
      if(err) { return done(err); }
      accessTokens.remove({_id: token.id}, function(err, result) {
        if(err) { return done(err); }
        response.json(result);
      });
    });
  });
}
// getToken
exports.oauthtoken = function(requestobj, response, done) {
    var obj = requestobj.body;
    if (obj.username && obj.psswrd) {
        var request = require('request');
        var constant = require('../../config/const.json');
        var env_config = require('../../config/config');
        var querystring = require('querystring');
        var data = querystring.stringify(obj);
        var options = {
            url: env_config.dashPath + constant.apis.GETDASHLOGINPATH,
            method: 'POST',
            body: data,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
        console.log(options);
        request(options, function(err, res, results) {
            try {
                console.log(results);
                results = JSON.parse(results);
                if (results) {
                    var sendCodes = function(clientdata) {
                        console.log(clientdata);
                        var code = utils.uid(16);
                        authorizationCodes.remove({
                            userId: clientdata.id
                        }, function(err, data) {
                            var codeobj = new authorizationCodes({
                                code: code,
                                userId: clientdata.id,
                                clientId: clientdata.clientId
                            });
                            codeobj.save(function(err, codeResult) {
                                var token = utils.uid(256);
                                var tokenobj = new accessTokens({
                                    token: token,
                                    userId: codeResult.userId,
                                    clientId: codeResult.clientId
                                });
                                tokenobj.save(function(err, token) {
                                    if (err) {
                                        response.json({
                                            // result: results,
                                            error: err
                                        });
                                        return err;
                                    }
                                    console.log(codeResult);
                                    response.json({
                                        result: token,
                                        error: err
                                    });
                                });
                            });
                        });
                    };
                    console.log(results.status);
                    if (results.status == "success") {
                        var newObj = {
                            clientId: results.userid,
                            clientSecret: results.session_id,
                            clientName: results.name,
                            username: results.name,
                            firstName: results.firstname,
                            middleName: results.middlename,
                            lastName: results.lastname,
                            roles: results.roles
                        };
                        var clientobj = new client({
                            clientId: results.userid,
                            clientSecret: newObj.clientSecret
                        });
                        clientobj.save(function(err, client) {
                            console.log(err, client);
                            sendCodes(client);
                        });
                    } else {
                        response.json({
                            // result: Data,
                            error: results
                        });
                    }
                }
            } catch (ex) {
                response.json({
                    // result: Data,
                    error: 'user load error.'
                });
                console.log(ex);
            }
        });
    } else {
        response.json({
            // result: results,
            error: 'username and psswrd required.'
        });
    }
}

exports.token = [
  //passport.authenticate(['basic'], { session: false }),
  server.token(),
  server.errorHandler()
]

