var fs = require('fs');
var path = require('path');
var restify = require('restify');
var log = require('./log');
var packageJson = require('../package.json');
var static = require('node-static');
var cors = require('cors');
var qs = require('qs');

console.log("*****test 0 server start***********");

const ROUTES_FOLDER = './routes/';

var server = restify.createServer({
  name: packageJson.name,
  version: packageJson.version,
  log: log
});

server.use(restify.requestLogger());
server.on('after', function(request, response, route, error) {
  request.log.info({req: request, res: response, error: error}, 'Request');
});


 //server.get('/muthu', getVendorproducts);
// Code has been chaged by muthu on 2nd June
var file = new static.Server('../../client');

/*require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        //
        // Serve files!
        //
        file.serve(request, response);
    }).resume();
}).listen(8080);*/


function optionsRoute(req, res, next) {

    res.send(200);
    return next();
}

function crossOrigin(req,res,next){
  var allowHeaders = ['Accept', 'Accept-Version', 'Content-Type', 'Content-MD5', 'Content-Length',
   'Response-Time', 'Api-Version', 'Origin', 'X-Requested-With', 'Authorization'];
  if (res.methods.indexOf('OPTIONS') === -1) res.methods.push('OPTIONS');
  // res.header("Access-Control-Allow-Origin", "*");
//  res.header("Access-Control-Allow-Origin", req.header['Origin']);
console.log('req.headers[origin] lowwer : ',req.headers['origin']);
console.log('req.headers[Origin] : ',req.headers['Origin']);
  res.header("Access-Control-Allow-Origin", req.headers['origin']);
  res.header("Access-Control-Allow-Headers", allowHeaders.join(', '));
  // res.header('Access-Control-Allow-Methods', res.methods.join(', '));
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header("Accept","application/x-www-form-urlencoded,text/html,application/json,multipart/form-data,text/plain");

 res.header('Access-Control-Allow-Headers', req.header['access-control-request-headers']);
 res.header('Access-Control-Allow-Credentials', "true");
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", 0);

  return next();
}

server.use(crossOrigin);
server.opts('/\.*/',  optionsRoute);


server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.fullResponse());


server.use(function(req, res, next){
 if(req._contentType ==  'application/x-www-form-urlencoded'){
   req.body = qs.parse(req.body)
 }
 next();
});



fs.readdirSync(path.join(__dirname, ROUTES_FOLDER)).forEach(function loadRoutes(file) {

  if (~file.indexOf('.js')) {
    require(ROUTES_FOLDER + file)(server);
    log.info('Router ' + file + ' loaded');
  }

});

module.exports = server;
