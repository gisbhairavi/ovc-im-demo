/** load broker_host , dbConn from the system env **/
var apiPath = process.env.API_PATH ?  process.env.API_PATH : '';
var brokerHost = process.env.BROKER_PATH ? process.env.BROKER_PATH : "";
var dbConn = process.env.DB_CONN ? process.env.DB_CONN : "";
var dashPath = process.env.DASH_PATH ?  process.env.DASH_PATH : '';
var JMS_QUEUEPOSUBMIT = process.env.JMS_QUEUE_PO_SUBMIT ?  process.env.JMS_QUEUE_PO_SUBMIT : '';
var JMS_QUEUERETURNEXPORT = process.env.JMS_QUEUE_RETURN_EXPORT ?  process.env.JMS_QUEUE_RETURN_EXPORT : '';
var JMS_QUEUE_ADJUST_EXPORT = process.env.JMS_QUEUE_ADJUST_EXPORT ?  process.env.JMS_QUEUE_ADJUST_EXPORT : '';
// Ratheesh
// for get status.
var constant = require('./const.json');

var getstatus = function (err) {
	return err ? constant['label']['ERROR'] : constant['label']['SUCCESS'];
}

module.exports = {
	apiPath : apiPath,
  	getstatus : getstatus,
  	dbConn : dbConn,
  	brokerHost : brokerHost,
  	JMS_QUEUEPOSUBMIT : JMS_QUEUEPOSUBMIT,
  	JMS_QUEUERETURNEXPORT : JMS_QUEUERETURNEXPORT,
  	JMS_QUEUE_ADJUST_EXPORT: JMS_QUEUE_ADJUST_EXPORT,
  	dashPath : dashPath
}