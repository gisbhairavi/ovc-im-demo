/*********************************************************************
 *
 *   Great Innovus Solutions Private Limited
 *
 *    Module:            Ovcdashboard
 *
 *    Developer:        Ratheesh
 *
 *    Date:            4/02/2016
 *
 *    Version:        1.2
 *
 **********************************************************************/
var services = require('../services/clientservice.js');
var request = require('request');
var log = require('../log');
var config = require('../../config/app.json');
var env_config = require('../../config/config');
var qs = require('qs');
module.exports = {
    getOvcdashboard: getOvcdashboard
};
/*
 * get Ovcdashboard.
 */
/***********************************************************************
 *
 * FUNCTION:    getOvcdashboard
 *
 * DESCRIPTION: get Ovcdashboard.
 *
 * PARAMETERS:     reqest and callback.
 *
 * RETURNED:    none.
 *
 * REVISION HISTORY:
 *
 *            Name    Date        Description
 *            ----    ----        -----------
 *            Ratheesh    4/02/2016    First Version
 *            Ratheesh    5/02/2016    2 Version
 *            Ratheesh    5/07/2016    3 Version
 *
 ***********************************************************************/
function getOvcdashboard(t, req, callback) {
    
    var query = JSON.parse(JSON.stringify(req.params));
    // delete query.url
    var options = {
        url: env_config.dashPath + 'apis/' + req.params.url,
        // url: env_config.dashPath + 'apis/' + req.params.url + '?' + qs.stringify(query),
        headers: { 'authorization': req.headers["authorization"] }
        // headers: req.headers
    };
    if (t && t == 'POST') {
        options['method'] = 'POST';
        options['body'] = qs.stringify(query);
        options['headers']['Content-Length'] = qs.stringify(query).length;
        options['headers']['Content-Type'] = 'application/x-www-form-urlencoded';
        // var formData = ;
    } else {
        options['method'] = 'GET';
        options['url'] = options['url'] + '?' + qs.stringify(query);
    };
    console.log("llllllll",options)
    request(options, callback);
}