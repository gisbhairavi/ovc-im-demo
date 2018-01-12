/** load broker_host , dbConn from the system env **/
var apiPath = process.env.API_PATH ?  process.env.API_PATH : '';
var brokerHost = process.env.BROKER_PATH ? process.env.BROKER_PATH : "";
var dbConn = process.env.DB_CONN ? process.env.DB_CONN : "";
var dashPath = process.env.DASH_PATH ?  process.env.DASH_PATH : '';
var JMS_QUEUESTOCKBALANCEEXPORT = process.env.JMS_QUEUE_INV_BAL_EXPORT ?  process.env.JMS_QUEUE_INV_BAL_EXPORT : '';
var JMS_QUEUE_ADJUST_EXPORT   =   process.env.JMS_QUEUE_ADJUST_EXPORT ?  process.env.JMS_QUEUE_ADJUST_EXPORT : '';
var JMS_QUEUE_STOCK_EXPORT    =   process.env.JMS_QUEUE_STOCK_EXPORT ?  process.env.JMS_QUEUE_STOCK_EXPORT : '';
// for get status.
// Ratheesh
var constant = require('./const.json');

var getstatus=function (err) {
	return err?constant['label']['ERROR']:constant['label']['SUCCESS'];
}

module.exports = {
	apiPath : apiPath,
  	dbConn : dbConn,
  	getstatus : getstatus,
  	brokerHost : brokerHost,
  	dashPath : dashPath,
  	JMS_QUEUESTOCKBALANCEEXPORT: JMS_QUEUESTOCKBALANCEEXPORT,
  	JMS_QUEUE_ADJUST_EXPORT: JMS_QUEUE_ADJUST_EXPORT,
  	JMS_QUEUE_STOCK_EXPORT: JMS_QUEUE_STOCK_EXPORT
}