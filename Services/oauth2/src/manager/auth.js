/**
 * Module dependencies.
 */
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var clients = require('./../model/client');
var accessTokens = require('./../model/accessTokens');
var authorizationCodes = require('./../model/authorizationCodes');



/**
 * BasicStrategy & ClientPasswordStrategy
 *
 * These strategies are used to authenticate registered OAuth clients.  They are
 * employed to protect the `token` endpoint, which consumers use to obtain
 * access tokens.  The OAuth 2.0 specification suggests that clients use the
 * HTTP Basic scheme to authenticate.  Use of the client password strategy
 * allows clients to send the same credentials in the request body (as opposed
 * to the `Authorization` header).  While this approach is not recommended by
 * the specification, in practice it is quite common.
 */
passport.use(new BasicStrategy(
  function(username, password, done) {
    clients.findOne({clientId: username, clientSecret : password}, function(err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      return done(null, client);
    });
  }
));

passport.use(new ClientPasswordStrategy(
  function(clientId, clientSecret, done) {
    clients.findOne({clientId: clientId, clientSecret : password}, function(err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      return done(null, client);
    });
  }
));

/**
 * BearerStrategy
 *
 * This strategy is used to authenticate users based on an access token (aka a
 * bearer token).  The user must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 */
passport.use(new BearerStrategy(
  function(accessToken, done) {
    accessTokens.findOne({token: accessToken}, function(err, token) {
      if (err) { return done(err); }
      if (!token) { return done(null, false); }
      clients.findById(token.userId, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        // to keep this example simple, restricted scopes are not implemented,
        // and this is just for illustrative purposes
        var info = { scope: '*' }
        return done(null, user, info);
      });
    });
  }
));

exports.isBearerAuthenticated = passport.authenticate('bearer', { session: false });

