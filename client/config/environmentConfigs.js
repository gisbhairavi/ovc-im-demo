"use strict";

var app = angular.module('OVCstockApp.environmentConfigs', [])

app.value('OVC_CONFIG', {
    API_PATH: "",
    DASH_PATH: "",
    OVC_SERV_PATH: "",
    AUTH_PATH: "",
    JMS_QUEUEPOSUBMIT: "",
    JMS_QUEUESTOCKEXPORT: "",
    IBM_CI_URL:"",
    JMS_QUEUEADJUSTEXPORT: "",
    JMS_QUEUECOUNTEXPORT: "",
    JMS_QUEUE_RETURN_EXPORT: ""
  });

/**
get the config info from the sever using socket io. ( check server.js)
and update into the cookieStore as well as the app.value
*/
function getEnvironmentConfigs($cookieStore, OVC_CONFIG){
  var configCookie  =   $cookieStore.get('OVC_CONFIG');
  if(!configCookie){
    io.connect(location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '')).on('OVC_CONFIG', function (data) {
       console.log(data);
        $cookieStore.put('OVC_CONFIG', data);

        OVC_CONFIG.API_PATH               =   data.API_PATH;
        OVC_CONFIG.DASH_PATH              =   data.DASH_PATH;
        OVC_CONFIG.OVC_SERV_PATH          =   data.OVC_SERV_PATH;
        OVC_CONFIG.AUTH_PATH              =   data.AUTH_PATH;
        OVC_CONFIG.JMS_QUEUEPOSUBMIT      =   data.JMS_QUEUEPOSUBMIT;
        OVC_CONFIG.JMS_QUEUESTOCKEXPORT   =   data.JMS_QUEUESTOCKEXPORT;
        OVC_CONFIG.IBM_CI_URL             =   data.IBM_CI_URL;
        OVC_CONFIG.JMS_QUEUEADJUSTEXPORT  =   data.JMS_QUEUEADJUSTEXPORT;
        OVC_CONFIG.JMS_QUEUECOUNTEXPORT   =   data.JMS_QUEUECOUNTEXPORT;
        OVC_CONFIG.JMS_QUEUE_RETURN_EXPORT   =   data.JMS_QUEUE_RETURN_EXPORT;
    });
  }
  else{
    OVC_CONFIG.API_PATH               =   configCookie.API_PATH;
    OVC_CONFIG.DASH_PATH              =   configCookie.DASH_PATH;
    OVC_CONFIG.OVC_SERV_PATH          =   configCookie.OVC_SERV_PATH;
    OVC_CONFIG.AUTH_PATH              =   configCookie.AUTH_PATH;
    OVC_CONFIG.JMS_QUEUEPOSUBMIT      =   configCookie.JMS_QUEUEPOSUBMIT;
    OVC_CONFIG.JMS_QUEUESTOCKEXPORT   =   configCookie.JMS_QUEUESTOCKEXPORT;
    OVC_CONFIG.IBM_CI_URL             =   configCookie.IBM_CI_URL;
    OVC_CONFIG.JMS_QUEUEADJUSTEXPORT  =   configCookie.JMS_QUEUEADJUSTEXPORT;
    OVC_CONFIG.JMS_QUEUECOUNTEXPORT   =   configCookie.JMS_QUEUECOUNTEXPORT;
    OVC_CONFIG.JMS_QUEUE_RETURN_EXPORT   =   configCookie.JMS_QUEUE_RETURN_EXPORT;
  }
}
