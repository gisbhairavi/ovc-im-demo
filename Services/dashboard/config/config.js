
/** load broker_host , dbConn from the system env **/
var apiPath = process.env.API_PATH ?  process.env.API_PATH : '';
var brokerHost = process.env.BROKER_PATH ? process.env.BROKER_PATH : "";
var dbConn = process.env.DB_CONN ? process.env.DB_CONN : "";
var dashPath = process.env.DASH_PATH ?  process.env.DASH_PATH : '';

var constant = require('./const.json');

var getstatus=function (err) {
	return err?constant['label']['ERROR']:constant['label']['SUCCESS'];
}

module.exports = {
  apiPath : apiPath,
  getstatus : getstatus,
  dbConn : dbConn,
  brokerHost : brokerHost,
  dashPath : dashPath
}