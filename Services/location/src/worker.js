var log = require('./log');
var env_config = require('../config/config');
var mongodb = require('./mongodb');
var Worker = require('pigato').Worker;
var constant = require('../config/const.json');
var locationModel = require('./model/locationModel');
var locationManager = require('./manager/locationManager');
var locationitemManager = require('./manager/locationitemManager');
var worker = new Worker(env_config.brokerHost, 'location');
var worker_locationitem = new Worker(env_config.brokerHost, 'locationitem');
worker.on('error', function(e) {
    log.error('Worker error', e);
});
worker_locationitem.on('error', function(e) {
    log.error('Worker error', e);
});
worker.on('request', function(input, rep) {
    log.info('Worker request', input);
    switch (input.op) {
        case 'getLocation':
            log.info('Find all Locations');
            locationManager.getLocation(input.params.locationData, function(err, location) {
                rep.end({
                    result: location,
                    error: err
                });
            });
            break;
        case 'createLocation':
            log.info('Creating a new location...');
            locationManager.createLocation(input.params.locationData, function(err, location) {
                if (location) {
                    var successMessage = {
                        success: 'Successfully Saved'
                    };
                }
                return rep.end({
                    result: successMessage,
                    error: err
                });
                if (err && err.code == 11000) {
                    err.message = 'Invalid Combination of locationId & stockingLocationId';
                    return rep.end({
                        result: location,
                        error: err
                    })
                }
            });
            break;
        case 'editLocation':
            log.info('Editing a Location...');
            locationManager.editLocation(input.params.id, input.params.locationData, function(err, location) {
                if (err && err.code == 11000) {
                    err.message = 'Invalid Combination of locationId & stockingLocationId';
                    return rep.end({
                        result: location,
                        error: err
                    })
                }
                rep.end({
                    result: location,
                    error: err
                });
            });
            break;
        case 'deleteLocation':
            log.info('Delete a Location...');
            locationManager.deleteLocation(input.params.id, function(err, location) {
                rep.end({
                    result: location,
                    error: err
                });
            });
            break;
        case 'hierarchyLocations':
            log.info('hierarchy Locations...');
            locationManager.hierarchyLocations(input.params.data, function(err, location) {
                rep.end({
                    result: location,
                    error: err
                });
            });
            break;
        case 'getStatus':
            log.info('getStatus');
            mongodb.getreadystate(function(state) {
                locationModel.findOne(function(err) {
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
worker_locationitem.on('request', function(input, rep) {
    switch (input.op) {
        case 'getLocationitem':
            log.info('Find all Locationitems');
            locationitemManager.getLocationitem(input.params.locationData, function(err, location) {
                rep.end({
                    result: location,
                    error: err
                });
            });
            break;
        case 'createLocationitem':
            log.info('Creating a new locationitem...');
            locationitemManager.createLocationitem(input.params.locationData, function(err, location) {
                rep.end({
                    result: location,
                    error: err
                });
            });
            break;
        case 'editLocationitem':
            log.info('Editing a Locationitem...');
            locationitemManager.editLocationitem(input.params.id, input.params.locationData, function(err, location) {
                if (err && err.code == 11000) {
                    err.message = 'Invalid Combination of locationId & stockingLocationId';
                    return rep.end({
                        result: location,
                        error: err
                    })
                }
                rep.end({
                    result: location,
                    error: err
                });
            });
            break;
        case 'deleteLocationitem':
            log.info('Delete a Locationitem...');
            locationitemManager.deleteLocation(input.params.id, function(err, location) {
                rep.end({
                    result: location,
                    error: err
                });
            });
            break;
    }
});
module.exports = {
    start: function() {
        log.info('Starting worker, broker ' + env_config.brokerHost + '...');
        worker.start();
        worker_locationitem.start();
    }
};