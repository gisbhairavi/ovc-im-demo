
/**
 fallback.
*/
try {
  var config = require('./config/config.js');
  var error;
  var envArr={
    apiPath:'API_PATH',
    port:'CLIENT_PORT',
    dashPath:'DASH_PATH',
    authUrl:'AUTH_PATH',
    IBM_CI_URL: 'IBM_CI_URL'
  };
  var env=Object.keys(envArr);
  var envCon=config.getEnvironmentConfig()
  for(var j = 0, length2 = env.length; j < length2; j++){
    var con= env[j];
    if(envCon[con]==''){
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

var app = module.exports = express.createServer();
var io = require('socket.io')(app);

app.configure(function() {
    app.use(express.static(__dirname + '/'));         // set the static files location
    app.use(express.logger('dev'));                         // log every request to the console
    app.use(express.bodyParser());                          // pull information from html in POST
    app.use(express.methodOverride());                      // simulate DELETE and PUT
});

//To support cross origin. 
function crossOrigin(req,res,next){ 
  var allowHeaders = ['Accept', 'Accept-Version', 'Content-Type', 'Content-MD5', 'Content-Length',
   'Response-Time', 'Api-Version', 'Origin', 'X-Requested-With', 'Authorization'];
  // res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Origin", req.headers['Origin'] || "*");
  res.header("Access-Control-Allow-Headers", allowHeaders.join(', '));
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  return next();
}
app.all('*', crossOrigin);

app.get('/', function(req, res) {
    res.sendfile('./index.html');
});

//Send the environment config info to the client page using socket io - check environmentConfigs.js
io.on('connection', function (socket) {
  socket.emit('OVC_CONFIG', config.getEnvironmentConfig());
});


app.listen(config.port, function(){
  console.log("Express server listening on port %d", app.address().port);
});
