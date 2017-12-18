/** load broker_host , dbConn from the system env **/
var brokerHost = process.env.BROKER_PATH ? process.env.BROKER_PATH : "";
var dbConn = process.env.DB_CONN ? process.env.DB_CONN : "";
var dashPath = process.env.DASH_PATH ?  process.env.DASH_PATH : '';
var apiPath = process.env.API_PATH ?  process.env.API_PATH : '';


module.exports = {
    dbConn: dbConn,
    brokerHost: brokerHost,
    dashPath: dashPath,
    apiPath: apiPath
}