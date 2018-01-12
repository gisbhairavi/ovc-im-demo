
/** load apiPath , dashPath , authPath , hybrsPath  and port from the system env **/
var apiPath                 =   process.env.API_PATH ?  process.env.API_PATH : '';
var serverPath              =   process.env.OVC_SERV_PATH ?  process.env.OVC_SERV_PATH : apiPath;
var dashPath                =   apiPath+'/ovcdashboard/';
var authPath                =   process.env.AUTH_PATH ?  process.env.AUTH_PATH : '';
var port                    =   process.env.CLIENT_PORT ? process.env.CLIENT_PORT : '';
var JMS_QUEUEPOSUBMIT       =   process.env.JMS_QUEUE_PO_SUBMIT ?  process.env.JMS_QUEUE_PO_SUBMIT : '';
var JMS_QUEUESTOCKEXPORT    =   process.env.JMS_QUEUE_STOCK_EXPORT ?  process.env.JMS_QUEUE_STOCK_EXPORT : '';
var IBM_CI_URL              =   process.env.IBM_CI_URL ? process.env.IBM_CI_URL : "https://commerceinsights.ibmcloud.com/cw/resources/partner/";
var JMS_QUEUEADJUSTEXPORT   =   process.env.JMS_QUEUE_ADJUST_EXPORT ?  process.env.JMS_QUEUE_ADJUST_EXPORT : '';
var JMS_QUEUECOUNTEXPORT    =   process.env.JMS_QUEUE_COUNT_EXPORT ?  process.env.JMS_QUEUE_COUNT_EXPORT : '';
var JMS_QUEUE_RETURN_EXPORT =    process.env.JMS_QUEUE_RETURN_EXPORT ?  process.env.JMS_QUEUE_RETURN_EXPORT : '';

function getEnvironmentConfig(){
	return {
        API_PATH: apiPath,
        DASH_PATH: dashPath,
        port : port,
        OVC_SERV_PATH: serverPath,
        AUTH_PATH: authPath,
        JMS_QUEUESTOCKEXPORT: JMS_QUEUESTOCKEXPORT,
        JMS_QUEUEPOSUBMIT: JMS_QUEUEPOSUBMIT,
        IBM_CI_URL: IBM_CI_URL,
        JMS_QUEUEADJUSTEXPORT: JMS_QUEUEADJUSTEXPORT,
        JMS_QUEUECOUNTEXPORT: JMS_QUEUECOUNTEXPORT,
        JMS_QUEUE_RETURN_EXPORT: JMS_QUEUE_RETURN_EXPORT
    }
}


module.exports  =   {
	port : port,
	getEnvironmentConfig: getEnvironmentConfig
}
