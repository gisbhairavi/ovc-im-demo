/** load broker_host , dbConn from the system env **/
var apiPath = process.env.API_PATH ?  process.env.API_PATH : '';
var brokerHost = process.env.BROKER_PATH ? process.env.BROKER_PATH : "";
var dbConn = process.env.DB_CONN ? process.env.DB_CONN : "";
var dashPath = process.env.DASH_PATH ?  process.env.DASH_PATH : '';
var posPath = process.env.POS_PATH ?  process.env.POS_PATH : '';
var JMS_QUEUEPOCONFIRMED = process.env.JMS_QUEUE_PO_CONFIRMED ?  process.env.JMS_QUEUE_PO_CONFIRMED : '';
var JMS_QUEUEPOASN = process.env.JMS_QUEUE_PO_ASN ?  process.env.JMS_QUEUE_PO_ASN : '';
var JMS_QUEUEPOS = process.env.JMS_QUEUE_POS ?  process.env.JMS_QUEUE_POS : '';
var authPath = process.env.AUTH_PATH ? process.env.AUTH_PATH : "";



var getAWSSQS=function () {
	var SQS= {};
	Object.keys(process.env).forEach( function(env) {
		env.substring(0, 10)=="JMS_QUEUE_"? SQS[env]= process.env[env]: ""
	});
	console.log(SQS);
	return SQS;
};
var AWS = {
    "AWS_BUCKET": process.env.AWS_BUCKET || "ovc-stockteam",
    "AWS_MAXNUMBEROFMESSAGES": process.env.AWS_MAXNUMBEROFMESSAGES || 10,
    "AWS_WAITTIMESECONDS": process.env.AWS_WAITTIMESECONDS || 1,
    "AWS_DELAYSECONDS": process.env.AWS_DELAYSECONDS || 10,
    SQS: getAWSSQS()
};
module.exports = {
	apiPath : apiPath,
	dbConn : dbConn,
	authPath : authPath,
	brokerHost : brokerHost,
	dashPath : dashPath,
  	posPath : posPath,
  	JMS_QUEUEPOS : JMS_QUEUEPOS,
  	JMS_QUEUEPOCONFIRMED : JMS_QUEUEPOCONFIRMED,
  	JMS_QUEUEPOASN : JMS_QUEUEPOASN,
    AWS: AWS
}