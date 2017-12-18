
/** load port , broker_host , broadcast_host , auth_url from the system env **/
var port = process.env.API_PORT ? process.env.API_PORT : '';
var brokerHost = process.env.BROKER_PATH ? process.env.BROKER_PATH : "";
var broadcastHost = process.env.BROADCAST_PATH ? process.env.BROADCAST_PATH : "";
var authUrl = process.env.AUTH_PATH ? process.env.AUTH_PATH : "";
var dashPath = process.env.DASH_PATH ?  process.env.DASH_PATH : '';
var posPath = process.env.POS_PATH ?  process.env.POS_PATH : '';


module.exports = {
  port: port,
  brokerHost : brokerHost,
  broadcastHost : broadcastHost,
  authUrl : authUrl,
  posPath : posPath,
  dashPath : dashPath
}
