var log = require('./log');
var env_config = require('../config/config');
var constant = require('../config/const.json');
var Worker = require('pigato').Worker;
var productModel       = require('./model/productModel');
var productManager = require('./manager/productManager');
var mongodb = require('./mongodb');

var worker = new Worker(env_config.brokerHost, 'vendorproduct');

worker.on('error', function(e) {
  log.error('Worker error', e);
});

worker.on('request', function(input, rep) {
  log.info('Worker request', input);

  switch(input.op) {
    case 'getVendorProductByVendor':
      log.info('Find all Products by vendor');
      productManager.getVendorProductByVendor(input.params.vendorProductData, function(err, product) {
        rep.end({result: product, error: err});
      });
      break;
    case 'addAllproduct':
      log.info('add all Product');
      productManager.addAllproduct(input.params.vendorProductData.vendorid, function(err, product) {
        rep.end({result: product, error: err});
      });
      break;
    case 'editVendorproductByVendor':
      log.info('Editing a Product...');
      productManager.editVendorproductByVendor(input.params.vendorid, input.params.vendorProductData, function(err, product) {
        rep.end({result: product, error: err});
      });
      break;  
    case 'deleteVendorProduct':
      log.info('Delete a Product...');
      productManager.deleteVendorProduct(input.params.id, function(err, product) {
        rep.end({result: product, error: err});
      });
      break;
    case 'activateVendorProduct':
      log.info('Activate a Product...');
      productManager.activateVendorProduct(input.params.vendorProductData, function(err, product) {
        rep.end({result: product, error: err});
      });
      break;
    case 'getVendorByProduct':
      log.info('getVendorByProduct...');
      productManager.getVendorByProduct(input.params.vendorProductData, input.params.headers, function(err, product) {
        rep.end({result: {status:err?constant.label.ERROR:constant.label.SUCCESS,result:product}, error: err});
      });
      break;
        case 'getStatus':
            log.info('getStatus');
            mongodb.getreadystate(function(state) {
                productModel.findOne(function(err) {
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

