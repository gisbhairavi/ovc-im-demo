
/** load broker_host , dbConn from the system env **/
var brokerHost = process.env.BROKER_PATH ? process.env.BROKER_PATH : "";
var dbConn = process.env.DB_CONN ? process.env.DB_CONN : "";


module.exports = {
  dbConn : dbConn,
  brokerHost : brokerHost
}