var request     =   require('request');
var querystring =   require('querystring');
var constant    =   require('../../config/const.json');
var env_config  =   require('../../config/config.js');
var transactionUpdate = require('./transactionManager')

module.exports  =   {
    uid: uid,
    errorTrace: errorTrace,
    trascationschema: transcationSchemaSave,
    jmsPublish: jmsPublish,
    getUserConfig : getUserConfig
}
/**
 * Return a unique identifier with the given `len`.
 *
 *     utils.uid(10);
 *     // => "FDaS435D2z"
 *
 * @param {Number} len
 * @return {String}
 * @api private
 */

function uid (len) {
  var buf = []
    , chars = '0123456789'
    , charlen = chars.length;

  for (var i = 0; i < len; ++i) {
    buf.push(chars[getRandomInt(0, charlen - 1)]);
  }

  return buf.join('');
};
/**********************************************************************************
 *
 * FUNCTION:    errorTrace.
 *
 * DESCRIPTION: Generic function to log error message.
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun       14.07.2017        1.0        Initial version.
 *
 **********************************************************************************/
function errorTrace (err) {
  if (typeof err === 'object') {
    if (err.message) console.log('\nError Message: ' + err.message);
    console.log('\nError Trace:');
    console.log('=================================================================');
    if (err.errors) console.log(err.errors);
    if (err.stack) console.log(err.stack);
    console.log('=================================================================');
  } else {
    console.log('errorTrace :: argument is not an object', err);
  }
}
/**
 * Return a random int, used by `utils.uid()`
 *
 * @param {Number} min
 * @param {Number} max
 * @return {Number}
 * @api private
 */

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function transcationSchemaSave (tranId ,input){
    console.log(tranId , 'TRAN_ID')
    if(tranId && input){
        transactionUpdate.editTransaction(tranId , input , function(result){
            console.log(result , 'TRANSCATION_SCHEMA_UPDATE_LOG');
        });
    }else{
        console.log('No transaction Id || Json Found');
    }

}

function jmsPublish(input, dataObj, type, callback) {
    if (!type)
        return callback('No queue type defined');
    dataObj     =   JSON.stringify(dataObj);
    var formData    =   querystring.stringify({data: dataObj});
    var contentLength   =   formData.length;
    var options     =   {
        url: env_config.apiPath + constant.apis.JMS_PUBLISH + type,
        method: 'POST',
        body: formData,
        headers: {
            'authorization': input.params.headers,
            'Content-Length': contentLength,
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    };
    request(options, function(err, response, data) {
        console.log(env_config.apiPath + constant.apis.JMS_PUBLISH, type, dataObj);
        console.log(err, data);
        callback ? callback(err, data) : '';
    });
}

function getUserConfig(featureId, header, callback) {

   var options = {
        url: env_config.apiPath + constant.apis.GET_USER_CONFIG + featureId,
        method: 'GET',
        headers: {
            'authorization': header
        }
    };

   request(options, function(err, response, data) {
        console.log(env_config.apiPath + constant.apis.GET_USER_CONFIG + featureId);
        console.log(err, data);
        console.log('asynccallback', data);
        try {
            data    =   JSON.parse(data);
            callback(err, data);
        }
        catch (ex) {
            // errorTrace(ex);
            callback(ex, null)
        }
    });
}
