/**
 * Module dependencies.
 */
/**
 fallback.
*/
try {
  var env_config = require('./config/config');
  var error;
  var envArr={
    dbConn:'DB_CONN',
    authPort:'AUTH_PORT'
  };
  var env=Object.keys(envArr);
  for(var j = 0, length2 = env.length; j < length2; j++){
    var con= env[j];
    if(env_config[con]==''){
      console.log(''+envArr[con]+' - not found.');
      error=true;
    }
  }
  if(error){
    console.log('ERROR : app can not run - env_config not found');
    return;
  }
 } catch(e) {
    console.log('ERROR : app can not run - env_config not found');
    return;
}
var express = require('express')
  , passport = require('passport')
  , oauth2 = require('./src/manager/oauth2')
  , auth = require('./src/manager/auth')
  , util = require('./src/manager/utils')
  var mongodb = require('./src/mongodb');
  var env_config = require('./config/config');

require('./src/manager/auth');
  
// Express configuration
  
// var app = express.createServer();
var app = express();

// var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
mongodb.connect(function() {
});

app.set('view engine', 'ejs');
// app.use(express.logger());
// app.use(express.cookieParser());
// app.use(express.bodyParser());
// app.use(express.session({ secret: 'keyboard cat' }));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());
// app.use(app.router);
// app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

function optionsRoute(req, res, next) {
    res.send(200);
    return next();
}

//To support cross origin. 
function crossOrigin(req,res,next){ 
  var allowHeaders = ['Accept', 'Accept-Version', 'Content-Type', 'Content-MD5', 'Content-Length',
   'Response-Time', 'Api-Version', 'Origin', 'X-Requested-With', 'Authorization'];
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", allowHeaders.join(', '));
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  return next();
}
app.all('*', crossOrigin);

//get code
app.post('/oauth/code', oauth2.saveClient);
//get token
app.post('/oauth/token', oauth2.token);
//delete token
app.delete('/oauth/token', oauth2.removeToken);
//verify token
app.get('/oauth/token/verify', 
  passport.authenticate('bearer', { session: false }),
  function(req, res) {
    res.json(req.user);
  });

app.post('/oauthtoken', oauth2.oauthtoken);
app.listen(env_config.authPort);
