var request     =   require('request');
var querystring =   require('querystring');

var Ajv         =   require('ajv');
var ajv         =   new Ajv(); ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));

var constant    =   require('../../config/const.json');
var envConfig  =   require('../../config/config.js');
var poSubmitSchema =   require('../../config/json_schemas/PO_SUBMIT.json');
var countAdjustmentSchema =   require('../../config/json_schemas/COUNT_ADJUSTMENT.json');
module.exports  =   {
    uid: uid,
    errorTrace: errorTrace,
    publishMessage: publishMessage,
    arrayToKeyValueObj: arrayToKeyValueObj,
    arrayToKeyValueArray : arrayToKeyValueArray
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

/**********************************************************************************
 *
 * FUNCTION:    publishMessage.
 *
 * DESCRIPTION: Generic function to publish PO messages to JMS.
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun       14.07.2017       1.0        Initial version.
 *
 **********************************************************************************/
function publishMessage (input) {
    if (input.jsonData && input.type && input.tranType) {
        try {

            var validSchema = false;
            if (input.tranType === 'count_adjustment') {
                validSchema = ajv.validate(countAdjustmentSchema, input.jsonData);
            }
            else if (input.tranType === 'return') {
                validSchema = true;
            }
            else if (input.tranType === 'PurchaseOrder') {
                validSchema = ajv.validate(poSubmitSchema, input.jsonData);
            }
            else {
                errorTrace (new Error('No suitable Transaction found'));
                return;
            }

            if (!validSchema) {
                errorTrace(ajv);
                return;
            }
            else {
                var dataObj         =   JSON.stringify(input.jsonData);
                var formData        =   querystring.stringify({data: dataObj});
                var contentLength   =   formData.length;
                var options     =   {
                    url: envConfig.apiPath + constant.apis.JMS_PUBLISH + input.type,
                    method: 'POST',
                    body: formData,
                    headers: {
                        'authorization': input.header,
                        'Content-Length': contentLength,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }
                };
                console.log(envConfig.apiPath + constant.apis.JMS_PUBLISH);
                request(options, function(err, response, data) {
                    if (err) {
                        errorTrace (err);
                    }
                });
            }
        }
        catch(e) {
            errorTrace (e);
            return false;
        }
    } else {
        var error = new Error('missed argument');
        errorTrace (error);
        console.log('publishMessage :: arguments', Object.keys(input));
    }
}

/**********************************************************************************
 *
 * FUNCTION:    arrayToKeyValueObj.
 *
 * DESCRIPTION: Generic function to map array_val as key value pair.
 *
 * REVISION HISTORY:
 *
 *   Name         Date          Version     Description 
 *   ----         ----          -------     -----------
 *   Arun       15.09.2017       1.0        Initial version.
 *
 **********************************************************************************/
function arrayToKeyValueObj (pay_load) {
    var array_val = pay_load.array_val,
        key_1 = pay_load.key,
        key_2 = pay_load.key_2,
        value = pay_load.value;
    var result_obj = {};
    if (array_val) {
        for (var i = array_val.length - 1; i >= 0; i--) {
            try {
                if (key_1 && !key_2)
                    result_obj[array_val[i][key_1]] =  value ? array_val[i][value] : array_val[i];
                if (key_1 && key_2)
                    result_obj[array_val[i][key_1][key_2]] =  value ? array_val[i][value] : array_val[i];
            }
            catch (ex) {
                errorTrace(ex);
            }
        }
    }
    return result_obj;
}

function arrayToKeyValueArray (payload){
    var Data = payload && payload.array ? payload.array : [], 
    key = payload && payload.key ? payload.key : "",
    tempObj = {};
    if(Data.length){
        for( var i = 0; i < Data.length;i++){
            if(!tempObj[Data[i][key]]){
                tempObj[Data[i][key]] = [];
            }
            tempObj[Data[i][key]].push(Data[i]);

        }
    }
    return tempObj;
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
