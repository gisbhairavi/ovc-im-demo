
/** load dbConn, authPort from the system env **/
var authPort = process.env.AUTH_PORT ? process.env.AUTH_PORT : "";
var dbConn   = process.env.DB_CONN ? process.env.DB_CONN : "";
var dashPath = process.env.DASH_PATH ?  process.env.DASH_PATH : '';

module.exports = {
	authPort : authPort,
	dbConn : dbConn,
	dashPath : dashPath
}