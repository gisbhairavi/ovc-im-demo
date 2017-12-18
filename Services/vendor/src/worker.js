var log = require('./log');
var mongodb = require('./mongodb');
var env_config = require('../config/config');
var Worker = require('pigato').Worker;
var constant          =   require('../config/const.json');
var vendorModel       = require('./model/vendorModel');
var vendorManager = require('./manager/vendorManager');
var worker = new Worker(env_config.brokerHost, 'vendor');
worker.on('error', function(e) {
    log.error('Worker error', e);
});
worker.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getVendor':
            log.info('Finding vendor[' + input.params.vendorData + ']...');
            vendorManager.getVendor(input.params.vendorData, function(err, vendor) {
                rep.end({
                    result: vendor,
                    error: err
                });
            });
            break;
        case 'createVendor':
            log.info('Creating a new vendor...');
            vendorManager.createVendor(input.params.vendorData, function(err, vendor) {
                rep.end({
                    result: vendor,
                    error: err
                });
            });
            break;
        case 'editVendor':
            log.info('Editing a vendor...');
            vendorManager.editVendor(input.params.id, input.params.vendorData, function(err, vendor) {
                rep.end({
                    result: vendor,
                    error: err
                });
            });
            break;
        case 'deleteVendor':
            log.info('Deleting a vendor...');
            vendorManager.deleteVendor(input.params.id, function(err, vendor) {
                rep.end({
                    result: vendor,
                    error: err
                });
            });
            break;
        case 'getStatus':
            log.info('getStatus');
            mongodb.getreadystate(function(state) {
                vendorModel.findOne(function(err) {
                    var test = constant.label.SUCCESS;
                    if (err) {
                        test = constant.label.ERROR;
                    }
                    var result = {
                        db: {
                            state: state,
                            test: test
                        },
                        appServer: 'connected'
                    };
                    rep.end({
                        result: result
                    });
                });
            });
            break;
    }
});
module.exports = {
    start: function() {
        log.info('Starting worker, broker ' + env_config.brokerHost + '...');
        worker.start();
    }
};