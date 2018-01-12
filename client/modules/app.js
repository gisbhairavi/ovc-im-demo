'use strict';
/**
 * @ngdoc overview
 * @name OVCstockApp
 * @description
 * # OVCstockApp
 *
 * Main module of the application.
 */


var app = angular
    .module('OVCstockApp', [
        'oc.lazyLoad',
        'ui.router',
        'ui.bootstrap',
        'angular-loading-bar',
        'ngRoute', 'ngAnimate', 'toaster', 'ngResource', 'ngCookies', 'OVCstockApp.environmentConfigs', 'OVCstockApp.systemConfigs','ngScrollbars','angular-click-outside','roleConfig', 'Utils', 'ui.bootstrap.treeview' , 'Helper' , 'angular.snackbar'
    ]);


app.config(['$stateProvider', '$urlRouterProvider', '$ocLazyLoadProvider', '$httpProvider', '$locationProvider', function($stateProvider, $urlRouterProvider, $ocLazyLoadProvider, $httpProvider, $locationProvider) {
        /*$httpProvider.defaults.cache = false;
        if (!$httpProvider.defaults.headers.get) {
          $httpProvider.defaults.headers.get = {};
        }*/
        // disable IE ajax request caching
        //$httpProvider.defaults.headers.get['If-Modified-Since'] = '0';
        
        //Enable cross domain calls
        $httpProvider.defaults.useXDomain = true;

        //Remove the header used to identify ajax call  that would prevent CORS from working
        delete $httpProvider.defaults.headers.common['X-Requested-With'];

        $ocLazyLoadProvider.config({
            debug: false,
            events: true,
        });

        $urlRouterProvider.otherwise('/ovc/dashboardreport');
        // $urlRouterProvider.otherwise('/dashboard/home');
        //$urlRouterProvider.otherwise("login");
        // $locationProvider.hashPrefix('ovc');



        $stateProvider
            .state('ovc', {
                url: '/ovc',
                templateUrl: 'views/dashboard/main.html',
                controller: function(roleConfigService, Utils, labelSource, $rootScope, $state) {
                     delete localStorage.Roles;
                         Utils.roles();

                    delete localStorage.configuration;
                        Utils.configurations();
                        if(labelSource &&  labelSource.status == "success"){
                            $rootScope.ovcLabel     =   labelSource.result;
                        }else{
                            $state.go('login');
                            $rootScope.labelError   =   true;
                        }
                    delete localStorage.userLocation1;
                    delete localStorage.userLocation0;
                },
                resolve: {
                    labelSource: function(labelService,$q){
                        var deferred = $q.defer();
                        labelService.getResources().then(function(res){
                            deferred.resolve({"status":"success", "result":res});
                        }, function(error){
                            deferred.resolve({"status":"error", "result":error});
                        });
                    return deferred.promise;
                    },
                    loadMyDirectives: function($$animateJs,$ocLazyLoad) {
						return $ocLazyLoad.load({
							name: 'OVCstockApp',
							files: [
								'modules/directives/angular-validator.js',
								'modules/directives/ngJsTree.js',
								'modules/directives/autocomplete.js',
								'modules/directives/calendar.js',
                                'bower_components/jstree/dist/themes/default/style.css',
							]
						}),
						$ocLazyLoad.load({
							name: 'toggle-switch',
							files: ["bower_components/angular/angular-toggle-switch/angular-toggle-switch.min.js",
								"bower_components/angular/angular-toggle-switch/angular-toggle-switch.css"
							]
						}),
						$ocLazyLoad.load({
							name: 'ngAnimate',
							files: ['bower_components/angular/angular-animate/angular-animate.js']
						})
						$ocLazyLoad.load({
							name: 'ngSanitize',
							files: ['bower_components/angular/angular-sanitize/angular-sanitize.js']
						})
						$ocLazyLoad.load({
							name: 'ngTouch',
							files: ['bower_components/angular/angular-touch/angular-touch.js']
						})
						
                    }
                }
            })

        .state('findItFrame', {
           url: '/findItPage?sku&locationId',
           controller: 'skuController',
           templateUrl: 'views/stocklookup/findit.html',
           resolve: {
               loadMyFiles: function($ocLazyLoad,Data) {
                   return $ocLazyLoad.load({
                       name: 'OVCstockApp',
                       files: [
                           'modules/controllers/skufinditController.js',
                           'styles/autocomplete/autocomplete.css',
                           'modules/directives/autocomplete.js',
                           'styles/stylematrix/style_matrix.css',
                            'modules/directives/style_matrix/tablesController.js',
                            'styles/findit/findit.css',
                        ]
                   })
               } 
           }
       })
    
        .state('ovc.vendor-add', {
            url: '/vendors/add',
            controller: 'addVendors',
            templateUrl: 'views/vendors/add.html',
            resolve: {
                loadMyFiles: function($ocLazyLoad , Utils) {
                    Utils.loadingOn();
                    return $ocLazyLoad.load({
                        name: 'OVCstockApp',
                        files: [
                            'modules/controllers/VendorController.js',
                        ]
                    })
                }
            }
        })

        .state('ovc.vendor-edit', {
                url: '/vendors/edit/?vendorid',
                controller: 'editVendor',
                templateUrl: 'views/vendors/add.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad , Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/VendorController.js',
                            ]
                        })
                    }
                }
            })
            .state('ovc.vendor-list', {
                url: '/vendors?fullList',
                controller: 'getVendors',
                templateUrl: 'views/vendors/list.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad , Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/VendorController.js',
                                // 'modules/services/configurationService.js',
                            ]
                        })
                    }
                }
            })

        .state('ovc.product-list', {
            url: '/vendorproducts',
            controller: 'getProducts',
            templateUrl: 'views/vendorproducts/list.html',
            resolve: {
                loadMyFiles: function($ocLazyLoad , Utils) {
                    Utils.loadingOn();
                    return $ocLazyLoad.load({
                        name: 'OVCstockApp',
                        files: [
                            'modules/controllers/VendorProductController.js'

                        ]
                    })
                }
            }
        })

        .state('ovc.product-add', {
                url: '/vendorproducts/add/?vendorid',
                controller: 'addProducts',
                templateUrl: 'views/vendorproducts/add.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad , Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/VendorProductController.js',
                            ]
                        })
                    }
                }
            })
            .state('ovc.location-list', {
                url: '/stock/locations?fullList',
                controller: 'getLocations',
                templateUrl: 'views/locations/list.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad , Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/LocationsController.js'

                            ]
                        })
                    }
                }
            })
            // Jegan Added
            .state('ovc.intransit', {
                url: '/orders/inTransit?fullList',
                controller: 'inTransitCtrl',
                templateUrl: 'views/orders/inTransit.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad , Utils) {
                        Utils.loadingOn();    
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/OrdersController.js',
                                'modules/directives/asn/asn_table.js',
                                'styles/autocomplete/autocomplete.css',
                                'styles/datepicker/bootstrap-datepicker.css',
                                'modules/directives/dropdown-multiselect.js',
                                // 'modules/directives/underscore-min.js',
                                // 'modules/directives/reverse_receipt/reverse_receipt.js'
                                // 'modules/services/configurationService.js'
                            ]
                        })
                    }
                }
            })
            .state('ovc.location-tree', {
                url: '/stock/locations/treeview',
                controller: 'getLocations',
                // controller: 'treeCtrl as vm',
                templateUrl: 'views/locations/treeview.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad) {
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/LocationsController.js',
                                'styles/autocomplete/autocomplete.css',
                                'styles/stylematrix/style_matrix.css',
                                'modules/directives/style_matrix/tablesController.js',
                            ]
                        })
                    }
                }
            })
            .state('ovc.location-add', {
                url: '/stock/add/locations',
                controller: 'AddLocations',
                // controller: 'treeCtrl as vm',
                templateUrl: 'views/locations/add.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad) {
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/LocationsController.js',
                                'bower_components/jstree/dist/themes/default/style.css',
                            ]
                        })
                    }
                }
            })
            .state('ovc.location-edit', {
                url: '/stock/edit/locations?locationid&parentName&productdetail',
                controller: 'editLocations',
                templateUrl: 'views/locations/edit.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad , Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/LocationsController.js',
                                'bower_components/jstree/dist/themes/default/style.css',
                                'styles/autocomplete/autocomplete.css',
                                'styles/stylematrix/style_matrix.css',
                                'modules/directives/style_matrix/tablesController.js',
                                
                            ]
                        })
                    }
                }
            })
            .state('ovc.transaction-code', {
                url: '/transaction/add',
                controller: 'transactionCtrl',
                templateUrl: 'views/transaction/add.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/transactionController.js',
                            ]
                        })
                    }
                }
            })
            .state('ovc.transaction-edit', {
                url: '/transaction/edit/?transid',
                controller: 'uptransactionCtrl',
                templateUrl: 'views/transaction/add.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/transactionController.js',
                            ]
                        })
                    }
                }
            })

        .state('ovc.transaction-type', {
                url: '/transaction/list?fullList',
                controller: 'transactionlistCtrl',
                templateUrl: 'views/transaction/list.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/transactionController.js',
                            ]
                        })
                    }
                }
            })
            .state('ovc.Replenishment', {
                url: '/Replenishment',
                controller: 'replenishmentCtrl',
                templateUrl: 'views/Replenishment/Replenishment.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad) {
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/replenishmentCtrl.js',
                            ]
                        })
                    }
                }
            })
            .state('ovc.ReplenishmentFilter', {
                url: '/ReplenishmentFilter',
                controller: 'replenishmentFilterCtrl',
                templateUrl: 'views/ReplenishmentFilter/replenishmentFilterLists.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad , Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/replenishmentFilterCtrl.js'
                                // 'modules/services/configurationService.js'
                                
                            ]
                        })
                    }
                }
            })
            .state('ovc.ReplenishmentFilter-add', {
                url: '/replenishmentFilter/add',
                controller: 'TabController as tab',
                templateUrl: 'views/ReplenishmentFilter/addFilter.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/replenishmentFilterCtrl.js',
                                'modules/directives/dropdown-multiselect.js',
                                'styles/autocomplete/autocomplete.css',
                                'modules/directives/dropdown-checkbox-multiselect.js',
                                'modules/directives/checkbox-multiselect.js'
                                // 'modules/services/configurationService.js'
                            ]
                        })
                    }
                }
            })
            .state('ovc.ReplenishmentFilter-edit', {
                url: '/replenishmentFilter/edit/?filterid',
                controller: 'TabController as tab',
                templateUrl: 'views/ReplenishmentFilter/addFilter.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/replenishmentFilterCtrl.js',
                                'modules/directives/dropdown-multiselect.js',
                                'styles/autocomplete/autocomplete.css',
                                'modules/directives/dropdown-checkbox-multiselect.js',
                                'modules/directives/checkbox-multiselect.js'
                                // 'modules/services/configurationService.js'
                            ]
                        })
                    }
                }
            })
            .state('ovc.shipments', {
                url: '/shipments',
                controller: 'getShipmentsCtrl',
                templateUrl: 'views/shipments/list.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad) {
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/ShipmentsController.js',
                                'styles/autocomplete/autocomplete.css',
                            ]
                        })
                    }
                }
            })
            .state('ovc.stocklookup-list', {
                url: '/stocklookup?fullList',
                controller: 'stockCtrl',
                templateUrl: 'views/stocklookup/list.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/StockLookupController.js',
                                'styles/autocomplete/autocomplete.css',
                                'styles/stylematrix/style_matrix.css',
                                'modules/directives/style_matrix/tablesController.js',
                                'modules/directives/advancedStocklookup/advancedStocklookupControl.js'
                                // 'modules/services/configurationService.js'
                            ]
                        })
                    }
                }
            })
            .state('ovc.stocklookup-findit', {
               url: '/stocklookup/findit?fullList',
               controller: 'skuController',
               templateUrl: 'views/stocklookup/findit.html',
               resolve: {
                   loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                       return $ocLazyLoad.load({
                           name: 'OVCstockApp',
                           files: [
                               'modules/controllers/skufinditController.js',
                               'styles/autocomplete/autocomplete.css',
                               'styles/stylematrix/style_matrix.css',
                                'modules/directives/style_matrix/tablesController.js',
                                'styles/findit/findit.css'
                                 // 'modules/services/configurationService.js'
                                
                               ]
                       })
                   }
               }
           })
            .state('ovc.stockbalances-export', {
                url: '/exportstockbalances',
                controller: 'stockbalancesCtrl',
                templateUrl: 'views/stockbalances/list.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad) {
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/StockBalancesController.js',
                                'styles/autocomplete/autocomplete.css',
                                'styles/stylematrix/style_matrix.css',
                                'modules/directives/style_matrix/tablesController.js'
                            ]
                        })
                    }
                }
            })
            .state('ovc.uom-add', {
                url: '/unitofmeasure',
                controller: 'unitCtrl',
                templateUrl: 'views/uom/add.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad) {
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/UomController.js',
                            ]
                        })
                    }
                }
            })

        .state('ovc.uom-edit', {
                url: '/unitofmeasure/edit/?uomid',
                controller: 'edituomCtrl',
                templateUrl: 'views/uom/add.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/UomController.js',
                            ]
                        })
                    }
                }
            })
            .state('ovc.uom-list', {
                url: '/uomlist?fullList',
                controller: 'unitsofmeasureCtrl',
                templateUrl: 'views/uom/list.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/UomController.js'

                            ]
                        })
                    }
                }
            })

        .state('ovc.document-add', {
                url: '/documents/add',
                controller: 'documentCtrl',
                templateUrl: 'views/documents/add.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad) {
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/DocumentController.js'

                            ]
                        })
                    }
                }
            })
            .state('ovc.document-edit', {
                url: '/documents/edit/?docid',
                controller: 'editdocumentCtrl',
                templateUrl: 'views/documents/add.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad ,Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/DocumentController.js'

                            ]
                        })
                    }
                }
            })
            .state('ovc.document-list', {
                url: '/documents/list?fullList',
                controller: 'documentlistCtrl',
                templateUrl: 'views/documents/list.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad) {
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/DocumentController.js',
                            ]
                        })
                    }
                }
            })
            .state('ovc.purchaseorder-add', {
                url: '/purchaseorders/add',
                controller: 'addPurchaseOrders',
                templateUrl: 'views/purchaseorders/add.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/PurchaseOrder/addController.js',
                                'styles/autocomplete/autocomplete.css',
                                'styles/stylematrix/style_matrix.css',
                                'modules/styleGroup/styleGroupController.js',
                                'modules/directives/style_matrix/tablesController.js',
                                'styles/datepicker/bootstrap-datepicker.css',
                                'modules/directives/readFile.js',
                            ]
                        })
                    }
                }
            })
            .state('ovc.purchaseorder-edit', {
                url: '/purchaseorders/edit/?porderid&pageFrom',
                controller: 'editPurchaseOrders',
                templateUrl: 'views/purchaseorders/edit.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/PurchaseOrder/editController.js',
                                'styles/autocomplete/autocomplete.css',
                                'modules/styleGroup/styleGroupController.js',
                                'modules/directives/style_matrix/tablesController.js',
                                'styles/datepicker/bootstrap-datepicker.css',
                                'modules/directives/readFile.js',

                            ]
                        })
                    }
                }
            })
            .state('ovc.purchaseorder-list', {
                url: '/purchaseorders/list?fullList',
                controller: 'listPurchaseOrders',
                templateUrl: 'views/purchaseorders/list.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad , Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/PurchaseOrder/listController.js',
                                'styles/datepicker/bootstrap-datepicker.css',
                                'styles/autocomplete/autocomplete.css'
                            ]
                        })
                    }
                }
            })
            .state('ovc.purchaseorder-copy', {
                url: '/purchaseorders/copy',
                controller: 'copyPurchaseOrders',
                templateUrl: 'views/purchaseorders/copy.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/PurchaseOrder/copyController.js',
                                'styles/autocomplete/autocomplete.css',
                                'modules/styleGroup/styleGroupController.js',
                                'modules/directives/style_matrix/tablesController.js',
                                'styles/datepicker/bootstrap-datepicker.css',
                                'modules/directives/readFile.js',

                            ]
                        })
                    }
                }
            })

            .state('ovc.adjustment-add', {
                url: '/adjustment/add',
                controller: 'addAdjustment',
                templateUrl: 'views/adjustments/add.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/adjustmentAddController.js',
                                'modules/directives/readFile.js',
                                'modules/directives/asn/asn_table.js',
                                'styles/stylematrix/style_matrix.css',
                                'styles/autocomplete/autocomplete.css',
                                // 'modules/services/configurationService.js',
                                'modules/styleGroup/styleGroupController.js',
                                'modules/directives/style_matrix/tablesController.js'
                            ]
                        })
                    }
                }
            })

            .state('ovc.adjustment-edit', {
                url: '/adjustment/edit/?adjust_id?isReversal',
                controller: 'addAdjustment',
                templateUrl: 'views/adjustments/add.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/adjustmentAddController.js',
                                'modules/directives/asn/asn_table.js',
                                'modules/directives/readFile.js',
                                'styles/stylematrix/style_matrix.css',
                                'styles/autocomplete/autocomplete.css',
                                // 'modules/services/configurationService.js',
                                'modules/styleGroup/styleGroupController.js',
                                'modules/directives/style_matrix/tablesController.js'
                                // 'modules/services/configurationService.js'
                            ]
                        })
                    }
                }
            })
            .state('ovc.adjustment-copy', {
                url: '/adjustment/copy',
                controller: 'addAdjustment',
                templateUrl: 'views/adjustments/add.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/adjustmentAddController.js',
                                'modules/directives/asn/asn_table.js',
                                'modules/directives/readFile.js',
                                'styles/stylematrix/style_matrix.css',
                                'styles/autocomplete/autocomplete.css',
                                // 'modules/services/configurationService.js',
                                'modules/styleGroup/styleGroupController.js',
                                'modules/directives/style_matrix/tablesController.js'
                                // 'modules/services/configurationService.js'
                            ]
                        })
                    }
                }
            })

            .state('ovc.adjustment-summary', {
                url: '/adjustment/edit/summary/?adjust_id&pageFrom',
                controller: 'addAdjustment',
                templateUrl: 'views/adjustments/summary.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad , Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/services/configurationService.js',
                                'modules/controllers/adjustmentAddController.js',
                                'modules/directives/asn/asn_table.js',
                                'styles/stylematrix/style_matrix.css',
                                'styles/autocomplete/autocomplete.css',
                                'modules/styleGroup/styleGroupController.js',
                                'modules/directives/style_matrix/tablesController.js'
                                // 'modules/services/configurationService.js'
                            ]
                        })
                    }
                }
            })

			.state('ovc.transfer-add', {
                url: '/transfers/add',
				controller: 'addPurchaseOrders',
                templateUrl: 'views/purchaseorders/add.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad , Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/PurchaseOrder/addController.js',
                                'modules/directives/asn/asn_table.js',
                                'styles/autocomplete/autocomplete.css',
                                'styles/stylematrix/style_matrix.css',
                                'modules/styleGroup/styleGroupController.js',
                                'modules/directives/style_matrix/tablesController.js',
                                'modules/directives/readFile.js'
                            ]
                        })
                    }
                }
            })
            .state('ovc.manualShipment-add', { 
                url: '/manualShipment/add',
                controller: 'addManualShipment',
                templateUrl: 'views/manualShipment/add.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad , Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/ManualShipmentController.js',
                                'modules/directives/asn/asn_table.js',
                                'styles/autocomplete/autocomplete.css',
                                'styles/stylematrix/style_matrix.css',
                                'modules/directives/readFile.js',
                                'styles/datepicker/bootstrap-datepicker.css',
                                'modules/styleGroup/styleGroupController.js',
                                'modules/directives/style_matrix/tablesController.js'
                                // 'modules/services/configurationService.js'
                            ]
                        })
                    }
                }
            })
             .state('ovc.manualShipment-edit', { 
                url: '/manualShipment/edit/?porderid&shipmentstatus&pageFrom',
                controller: 'addManualShipment',
                templateUrl: 'views/manualShipment/add.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/ManualShipmentController.js',
                                'modules/directives/asn/asn_table.js',
                                'styles/autocomplete/autocomplete.css',
                                'styles/stylematrix/style_matrix.css',
                                'modules/directives/readFile.js',
                                'styles/datepicker/bootstrap-datepicker.css',
                                'modules/styleGroup/styleGroupController.js',
                                'modules/directives/style_matrix/tablesController.js'
                                // 'modules/services/configurationService.js'
                            ]
                        })
                    }
                }
            })
            .state('ovc.manualShipment-copy', { 
                url: '/manualShipment/copy/?porderid',
                controller: 'addManualShipment',
                templateUrl: 'views/manualShipment/add.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad , Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/ManualShipmentController.js',
                                'modules/directives/asn/asn_table.js',
                                'styles/autocomplete/autocomplete.css',
                                'styles/stylematrix/style_matrix.css',
                                'modules/directives/readFile.js',
                                'styles/datepicker/bootstrap-datepicker.css',
                                'modules/styleGroup/styleGroupController.js',
                                'modules/directives/style_matrix/tablesController.js'
                                // 'modules/services/configurationService.js'
                            ]
                        })
                    }
                }
            })
            .state('ovc.manualShipment-summary', { 
                url: '/manualShipment/Summary/?summaryid&transfertype&transferfunc&status&pageFrom',
                controller: 'addManualShipment',
                templateUrl: 'views/ibt/manualShipmentSummary.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad , Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/ManualShipmentController.js',
                                'modules/directives/asn/asn_table.js',
                                'styles/autocomplete/autocomplete.css',
                                'styles/stylematrix/style_matrix.css',
                                'styles/datepicker/bootstrap-datepicker.css',
                                'modules/styleGroup/styleGroupController.js',
                                'modules/directives/style_matrix/tablesController.js'
                                // 'modules/services/configurationService.js'
                            ]
                        })
                    }
                }
            })
		   .state('ovc.transfer-edit', {
                url: '/transfers/edit/?porderid&transferstatus&pageFrom',
                 controller: 'editPurchaseOrders',
                templateUrl: 'views/purchaseorders/edit.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/PurchaseOrder/editController.js',
                                'styles/autocomplete/autocomplete.css',
                                'modules/styleGroup/styleGroupController.js',
                                'modules/directives/style_matrix/tablesController.js',
                                'modules/directives/readFile.js'
                            ]
                        })
                    }
                }
            })
			.state('ovc.transfer-copy', {
                url: '/transfers/copy',
                controller: 'copyPurchaseOrders',
                templateUrl: 'views/purchaseorders/copy.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/PurchaseOrder/copyController.js',
                                'styles/autocomplete/autocomplete.css',
                                'modules/styleGroup/styleGroupController.js',
                                'modules/directives/style_matrix/tablesController.js',
                                'modules/directives/readFile.js',
                            ]
                        })
                    }
                }
            })
			
			.state('ovc.product-perform', {
			   url: '/productperformance?fullList',
			   controller: 'productPerformance',
			   templateUrl: 'views/productPerformace/index.html',
			   resolve: {
				   loadMyFiles: function($ocLazyLoad) {
					   return $ocLazyLoad.load({
						   name: 'OVCstockApp',
						   files: [
							   'modules/controllers/PerformanceController.js',
                               // 'modules/services/configurationService.js',
							   'styles/autocomplete/autocomplete.css',
							   'styles/datepicker/bootstrap-datepicker.css',
                                'modules/directives/checkbox-multiselect.js'
						   ]
					   })

				   }
			   }
		   })

        .state('ovc.transaction-history', {
                url: '/transactionhistory/list?fullList',
                controller: 'transactionhistorylistCtrl',
                templateUrl: 'views/transactionhistory/list.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/TransactionHistoryController.js',
                                'styles/datepicker/bootstrap-datepicker.css',
                                'styles/autocomplete/autocomplete.css'
                            ]
                        })
                    }
                }
            })
            .state('ovc.transaction-detail', {
                url: '/transactionhistory/detail/?trannum',
                controller: 'transactiondetailCtrl',
                templateUrl: 'views/transactionhistory/detail.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/TransactionHistoryController.js',
                            ]
                        })
                    }
                }
            })
            // .state('ovc.transaction-balance', {
            //     url: '/transactionhistory/balances/?trannum',
            //     controller: 'transactionbalanceCtrl',
            //     templateUrl: 'views/transactionhistory/balance.html',
            //     resolve: {
            //         loadMyFiles: function($ocLazyLoad) {
            //             return $ocLazyLoad.load({
            //                 name: 'OVCstockApp',
            //                 files: [
            //                     'modules/controllers/TransactionHistoryController.js',
            //                 ]
            //             })
            //         }
            //     }
            // })
            .state('ovc.Counts-add', {
                url: '/counts/add',
                controller: 'countsAddCntrl',
                templateUrl: 'views/counts/add.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/CountsController.js',
                                'styles/autocomplete/autocomplete.css',
                                'styles/datepicker/bootstrap-datepicker.css',
                            ]
                        })
                    }
                }
            })
            .state('ovc.Counts-edit', {
                url: '/counts/edit?id&pageFrom',
                controller: 'countsAddCntrl',
                templateUrl: 'views/counts/editCount.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/CountsController.js',
                                'modules/directives/readFile.js',
                                'styles/autocomplete/autocomplete.css',
                                'styles/datepicker/bootstrap-datepicker.css',
                                'styles/stylematrix/style_matrix.css',
                                'modules/directives/style_matrix/tablesController.js'
                            ]
                        })
                    }
                }
            })
            .state('ovc.Counts-countsvalidate', {
                url: '/counts/countsvalidate',
                controller: 'countsvalidatecntrl',
                templateUrl: 'views/counts/countsvalidate.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad) {
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/CountsController.js',
                                'styles/autocomplete/autocomplete.css',
                            ]
                        })
                    }
                }
            })
            .state('ovc.Counts-list', {
                url: '/counts/list?fullList',
                controller: 'countslistcntrl',
                templateUrl: 'views/counts/list.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/CountsController.js',
                                "bower_components/nvd3/build/nv.d3.js",
                                "bower_components/angular-nvd3/dist/angular-nvd3.min.js",
                                "bower_components/nvd3/build/nv.d3.min.css",
                                'styles/datepicker/bootstrap-datepicker.css',
                            ]
                        })
                    }
                }
            })

        .state('ovc.interface-demo', {
            url: '/interface/demo',
            controller: 'demoInterface',
            templateUrl: 'views/interface/demo.html',
            resolve: {
                loadMyFiles: function($ocLazyLoad , Utils) {
                    Utils.loadingOn();
                    return $ocLazyLoad.load({
                        name: 'OVCstockApp',
                        files: [
                            "bower_components/bootsrap-dateTime-picker/bootstrap-datetimepicker.min.css",
                            "bower_components/bootsrap-dateTime-picker/bootstrap-datetimepicker.min.js",
                            'modules/controllers/InterfaceDemoController.js',
                            'styles/autocomplete/autocomplete.css',
                            'styles/datepicker/bootstrap-datepicker.css',
                            // 'modules/services/configurationService.js'
                        ]
                    })
                }
            }
        })


        .state('ovc.fileupload', {
                url: '/fileupload',
                controller: 'AppController',
                templateUrl: 'views/fileupload/fileupload.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad) {
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/FileuploadController.js',
                                'modules/directives/readFile.js'
                            ]
                        })
                    }
                }
            })
            .state('ovc.purchaseorderjson', {
                url: '/purchaseorderjson',
                controller: 'AppController',
                templateUrl: 'views/fileupload/fileupload.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad) {
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/FileuploadController.js',
                                'modules/directives/readFile.js'                          ]
                        })
                    }
                }
            })
            .state('ovc.countsjson', {
                url: '/countsjsonupload',
                controller: 'AppController',
                templateUrl: 'views/fileupload/fileupload.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad) {
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/FileuploadController.js',
                                'modules/directives/readFile.js'
                            ]
                        })
                    }
                }
            })

            .state('ovc.replenishmentRulesUpload', {
                url: '/replenishmentRulesUpload',
                controller: 'replenishmentRulesCtrl',
                templateUrl: 'views/fileupload/replenishmentRulesUpload.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/ReplenishmentRulesController.js',
                                'modules/directives/readFile.js',
                                'styles/stylematrix/style_matrix.css',
                                'styles/autocomplete/autocomplete.css',
                                'modules/directives/style_matrix/tablesController.js'
                                // 'modules/services/configurationService.js'
                            ]
                        })
                    }
                }
            })

        .state('login', {
                templateUrl: 'views/login.html',
                url: '/login',
                controller: 'authCtrl',
                data: { name : 'login' },
                resolve: {
                    loadMyFiles: function($ocLazyLoad) {
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'styles/themes/Admin.css',
                            ]
                        })
                    }
                }
            })
            .state('ovc.vieworders-list', {
                url: '/orders/list/?porderid&selectTab&pageFrom',
                controller: 'ordersCtrl',
                templateUrl: 'views/orders/list.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad , Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/ordersummaryController.js',
                                'modules/directives/asn/asn_table.js',
                                // 'modules/directives/reverse_receipt/reverse_receipt.js',
								'modules/styleGroup/styleGroupController.js'
                                // 'modules/services/configurationService.js'
                            ]
                        })
                    }
                }
            })

        .state('ovc.asn-detailview', {
            url: '/asn/asn-detailview?asnid&packageid&orderid&backTo',
            controller: 'asnDetailsController',
            templateUrl: 'modules/directives/asn/asn_details.html',
            resolve: {
                loadMyFiles: function($ocLazyLoad , Utils) {
                    Utils.loadingOn();
                    return $ocLazyLoad.load({
                        name: 'OVCstockApp',
                        files: [
                            'modules/controllers/asnDetailsController.js',
                            'modules/directives/readFile.js',
                            'modules/directives/asn/asn_table.js',
                            'styles/autocomplete/autocomplete.css',
                        ]
                    })
                }
            }
        })


            .state('ovc.viewtransfers-summary', {
               url: '/transfers/list/?transferid&transfertype&transferfunc&transferstatus&pageFrom',
               controller: 'TransferSummaryCtrl',
               templateUrl: 'views/ibt/reviewtransfer.html',
               resolve: {
                   loadMyFiles: function($ocLazyLoad, Utils) {
                    Utils.loadingOn();
                       return $ocLazyLoad.load({
                           name: 'OVCstockApp',
                           files: [
                             
                               'modules/directives/asn/asn_table.js',
							   'modules/controllers/TransferSummaryController.js',
                               'modules/styleGroup/styleGroupController.js',
                               // 'modules/services/configurationService.js',
							   'modules/asnIbt/asnIbt.js',
							   'modules/returnReceipt/returnReceipt.css',
							   'modules/directives/style_matrix/tablesController.js',
							   'styles/stylematrix/style_matrix.css',
							   'styles/datepicker/bootstrap-datepicker.css',
							   'styles/autocomplete/autocomplete.css',
                           ]
                        })
                    }
                }
            })

        .state('ovc.Counts-detailview', {
            url: '/counts/counts_detailview',
            controller: 'countslistcntrl',
            templateUrl: 'views/counts/counts_detailview.html',
            resolve: {
                loadMyFiles: function($ocLazyLoad, Utils) {
                    Utils.loadingOn();
                    return $ocLazyLoad.load({
                        name: 'OVCstockApp',
                        files: [
                            'modules/controllers/CountsController.js',
                        ]
                    })
                }
            }
        })

        .state('ovc.manualReceipt', {
            url: '/manualReceipt',
            controller: 'manualReceiptCtrl',
            templateUrl: 'views/manualReceipt/manualReceipt.html',
            resolve: {
                loadMyFiles: function($ocLazyLoad , Utils) {
                    Utils.loadingOn();
                    return $ocLazyLoad.load({
                        name: 'OVCstockApp',
                        files: [
                            'modules/returnReceipt/returnReceipt.css',
                            'modules/returnReceipt/returnReceipt.js',
                            'modules/controllers/ManualReceiptController.js',
                            'modules/directives/readFile.js',
                            'styles/autocomplete/autocomplete.css',
                            'styles/stylematrix/style_matrix.css',
                            'styles/datepicker/bootstrap-datepicker.css',
                            'modules/directives/style_matrix/tablesController.js',
                            // 'modules/services/configurationService.js'
                        ]
                    })
                }
            }
        })

        .state('ovc.manualReceipt-edit', {
            url: '/manualReceipt/edit/?manualid&pageFrom',
            controller: 'manualReceiptCtrl',
            templateUrl: 'views/manualReceipt/manualReceiptEdit.html',
            resolve: {
                loadMyFiles: function($ocLazyLoad , Utils) {
                    Utils.loadingOn();
                    return $ocLazyLoad.load({
                        name: 'OVCstockApp',
                        files: [
                            'modules/controllers/ManualReceiptController.js',
                            'modules/directives/readFile.js',
                            'modules/returnReceipt/returnReceipt.js',
                            'modules/returnReceipt/returnReceipt.css',
                            'styles/autocomplete/autocomplete.css',
                            'styles/stylematrix/style_matrix.css',
                            'styles/datepicker/bootstrap-datepicker.css',
                            'modules/directives/style_matrix/tablesController.js',
                            // 'modules/services/configurationService.js'
                        ]
                    })
                }
            }
        })


        .state('ovc.manualReceipt-copy', {
            url: '/manualReceipt/copy/?cmanualid&pageFrom',
            controller: 'manualReceiptCtrl',
            templateUrl: 'views/manualReceipt/manualReceiptCopy.html',
            resolve: {
                loadMyFiles: function($ocLazyLoad, Utils) {
                    Utils.loadingOn();
                    return $ocLazyLoad.load({
                        name: 'OVCstockApp',
                        files: [
                            'modules/returnReceipt/returnReceipt.css',
                            'modules/directives/readFile.js',
                            'modules/returnReceipt/returnReceipt.js',
                            'modules/controllers/ManualReceiptController.js',
                            'styles/autocomplete/autocomplete.css',
                            'styles/datepicker/bootstrap-datepicker.css',
                            'styles/stylematrix/style_matrix.css',
                            'modules/directives/style_matrix/tablesController.js',
                            // 'modules/services/configurationService.js'
                        ]
                    })
                }
            }
        })

        .state('ovc.returns-list', {
                url: '/returns/list?fullList',
                controller: 'listReturns',
                templateUrl: 'views/returns/list.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/ReturnsController.js',
                                'modules/directives/asn/asn_table.js',
                                'styles/datepicker/bootstrap-datepicker.css',
                                'styles/autocomplete/autocomplete.css'
                                // 'modules/services/configurationService.js'
                            ]
                        })
                    }
                }
            })
            .state('ovc.returns-add', {
                url: '/returns/add',
                controller: 'addReturnOrder',
                templateUrl: 'views/returns/addReturn.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad , Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/ReturnOrderController.js',
                                'modules/directives/readFile.js',
                                'modules/returnReceipt/returnReceipt.js',
                                'styles/datepicker/bootstrap-datepicker.css',
                                'styles/autocomplete/autocomplete.css',
                                'styles/stylematrix/style_matrix.css',
                                'modules/returnReceipt/returnReceipt.css',
                                'modules/directives/style_matrix/tablesController.js'
                                // 'modules/services/configurationService.js'
                            ]
                        })
                    }
                }
            })


        .state('ovc.returns-edit', {
            url: '/returns/edit/?returnid&pageFrom',
            controller: 'addReturnOrder',
            templateUrl: 'views/returns/editReturn.html',
            resolve: {
                loadMyFiles: function($ocLazyLoad, Utils) {
                    Utils.loadingOn();
                    return $ocLazyLoad.load({
                        name: 'OVCstockApp',
                        files: [
                            'modules/returnReceipt/returnReceipt.js',
                            'modules/controllers/ReturnOrderController.js',
                            'modules/directives/readFile.js',
                            'styles/datepicker/bootstrap-datepicker.css',
                            'styles/autocomplete/autocomplete.css',
                            'styles/stylematrix/style_matrix.css',
                            'modules/returnReceipt/returnReceipt.css',
                            'modules/directives/style_matrix/tablesController.js'
                            // 'modules/services/configurationService.js'
                        ]
                    })
                }
            }
        })

        .state('ovc.return-copy', {
            url: '/returns/copy',
            controller: 'addReturnOrder',
            templateUrl: 'views/returns/copyReturn.html',
            resolve: {
                loadMyFiles: function($ocLazyLoad, Utils) {
                    Utils.loadingOn();
                    return $ocLazyLoad.load({
                        name: 'OVCstockApp',
                        files: [
                            'modules/returnReceipt/returnReceipt.js',
                            'modules/controllers/ReturnOrderController.js',
                            'modules/directives/readFile.js',
                            'styles/datepicker/bootstrap-datepicker.css',
                            'styles/autocomplete/autocomplete.css',
                            'styles/stylematrix/style_matrix.css',
                            'modules/returnReceipt/returnReceipt.css',
                            'modules/directives/style_matrix/tablesController.js'
                            // 'modules/services/configurationService.js'
                        ]
                    })
                }
            }
        })

        .state('ovc.config-list', {
            url: '/configurations?group',
            controller: 'getConfig',
            templateUrl: 'views/configuration/configuration.html',
            resolve: {
                loadMyFiles: function($ocLazyLoad, Utils) {
                    Utils.loadingOn();
                    return $ocLazyLoad.load({
                        name: 'OVCstockApp',
                        files: [
                            'modules/controllers/ConfigurationController.js',
                        ]
                    })
                }
            }
        })

        //kr added
        .state('ovc.findit', {
            url: '/findit?locationId&sku&ovcdid&custEmail&custFName&custLName&loyaltyID',
            controller: 'authCtrl',
            templateUrl: 'views/findIt/index.html',
            resolve: {
                loadMyFiles: function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'OVCstockApp',
                        files: [
                            'modules/controllers/finditController.js',
                        ]
                    })
                }
            }
        })

        .state('ovc.ibt', {
            url: '/ibt?fullList',
            controller: 'ibtCtrl',
            templateUrl: 'views/ibt/index.html',
            resolve: {
                loadMyFiles: function($ocLazyLoad, Utils) {
                    Utils.loadingOn();
                    return $ocLazyLoad.load({
                        name: 'OVCstockApp',
                        files: [
                            'modules/controllers/ibtController.js',
                            'styles/datepicker/bootstrap-datepicker.css',
                            'styles/autocomplete/autocomplete.css',
                            'modules/directives/dropdown-multiselect.js',
                            // 'modules/directives/underscore-min.js',

                        ]
                    })
                }
            }
        })
        .state('ovc.manualShipment-list', {
            url: '/manualshipment?fullList',
            controller: 'ibtCtrl',
            templateUrl: 'views/manualShipment/index.html',
            resolve: {
                loadMyFiles: function($ocLazyLoad, Utils) {
                    Utils.loadingOn();
                    return $ocLazyLoad.load({
                        name: 'OVCstockApp',
                        files: [
                            'modules/controllers/ibtController.js',
                            'styles/datepicker/bootstrap-datepicker.css',
                            'modules/directives/dropdown-multiselect.js',
                            // 'modules/directives/underscore-min.js',
                        ]
                    })
                }
            }
        })
        .state('ovc.dashboard-report', {
            url: '/dashboardreport',
            controller: 'dashboardReport',
            templateUrl: 'views/dashboardReports/index.html',
            resolve: {
                loadMyFiles: function($ocLazyLoad) {
                    //setTimeout(function() {
                    return $ocLazyLoad.load({
                        name: 'OVCstockApp',
                        files: [
                            "bower_components/nvd3/build/nv.d3.js",
                            "bower_components/angular-nvd3/dist/angular-nvd3.min.js",
                            "bower_components/nvd3/build/nv.d3.min.css",
                            'styles/datepicker/bootstrap-datepicker.css',
                            'modules/controllers/dashboardReportController.js',
                            
                        ]
                    })

                }
            }
        })

        .state('ovc.rolePermissions', {
                url: '/settings/rolePermissions?roleId?moduleId',
                controller: 'rolePermissions',
                templateUrl: 'views/rolePermissions/index.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad , Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/RolePermissionsController.js',
                            ]
                        })
                    }
                }
            })
            .state('ovc.replenishmentRules', {
                url: '/settings/replenishmentRules',
                controller: 'replenishmentRulesController',
                templateUrl: 'views/Replenishment/replenishmentRules.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad , Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/replenishmentCtrl.js',
                            ]
                        })
                    }
                }
            })
			
		  .state('ovc.reasoncode-add', {
                url: '/reasoncode/add',
                controller: 'addReasonCtrl',
                templateUrl: 'views/reasonCode/add.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad) {
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/reasonCodeController.js',
                            ]
                        })
                    }
                }
            })

            .state('ovc.reasoncode-edit', {
                url: '/reasoncode/edit/?res_id',
                controller: 'editReasonCtrl',
                templateUrl: 'views/reasonCode/add.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad , Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/reasonCodeController.js',
                            ]
                        })
                    }
                }
            })
            .state('ovc.reasoncode-list', {
                url: '/reasoncode?fullList',
                controller: 'listReasonCtrl',
                templateUrl: 'views/reasonCode/list.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/reasonCodeController.js'

                            ]
                        })
                    }
                }
            })

            .state('ovc.adjustment-list', {
                url: '/adjustment?fullList',
                controller: 'listAdjustmentsCtrl',
                templateUrl: 'views/adjustments/list.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                // 'modules/services/configurationService.js',
                                'modules/controllers/adjustmentController.js',
                                'styles/autocomplete/autocomplete.css',
                                'styles/datepicker/bootstrap-datepicker.css'
                            ]
                        })
                    }
                }
            })
            .state('ovc.manualReceipt-list', {
                url: '/manualReceiptlist?fullList',
                controller: 'manualReceiptListCtrl',
                templateUrl: 'views/manualReceipt/manualReceiptList.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/ManualReceiptListController.js',
                                'styles/autocomplete/autocomplete.css',
                                'styles/datepicker/bootstrap-datepicker.css'
                            ]
                        })
                    }
                }
            })


            .state('ovc.customerorders-list', {
                url: '/customerorders/list?fullList',
                controller: 'listCustomerOrders',
                templateUrl: 'views/customerorders/list.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/customerOrderController.js',
                                'styles/autocomplete/autocomplete.css',
                                'styles/datepicker/bootstrap-datepicker.css'
                                // 'modules/services/configurationService.js'
                            ]
                        })
                    }
                }
            })

            
            .state('ovc.customerorders-add', {
                url: '/customerorders/add?ovcdid&ovcsid&ovclid&sku&fromPage',
                controller: 'addCustomerOrders',
                templateUrl: 'views/customerorders/customerOrder.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/CreateCustomerOrder.js',
                                'styles/autocomplete/autocomplete.css',
                                'modules/vendorGroup/vendorGroupController.js',
                                'styles/stylematrix/style_matrix.css',
                                'modules/directives/style_matrix/tablesController.js'
                                // 'modules/services/configurationService.js'
                            ]
                        })
                    }
                }
            })

            .state('ovc.customerorders-edit', {
                url: '/customerorders/edit/?orderid&pageFrom',
                controller: 'addCustomerOrders',
                templateUrl: 'views/customerorders/customerOrder.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad , Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/CreateCustomerOrder.js',
                                'styles/autocomplete/autocomplete.css',
                                'modules/vendorGroup/vendorGroupController.js',
                                'styles/stylematrix/style_matrix.css',
                                'modules/directives/style_matrix/tablesController.js'
                                // 'modules/services/configurationService.js'
                            ]
                        })
                    }
                }
            })

            .state('ovc.customerorders-copy', {
                url: '/customerorders/copy',
                controller: 'addCustomerOrders',
                templateUrl: 'views/customerorders/customerOrder.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/CreateCustomerOrder.js',
                                'styles/autocomplete/autocomplete.css',
                                'modules/vendorGroup/vendorGroupController.js',
                                'styles/stylematrix/style_matrix.css',
                                'modules/directives/style_matrix/tablesController.js'
                                // 'modules/services/configurationService.js'
                            ]
                        })
                    }
                }
            })

            .state('ovc.customerorders-summary', {
                url: '/customerorders/summary/?orderid&pageFrom',
                controller: 'reviewCustomerOrders',
                templateUrl: 'views/customerorders/reviewDropShip.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad , Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/ReviewCustomerOrder.js',
                                'styles/autocomplete/autocomplete.css',
                                'modules/vendorGroup/vendorGroupController.js'
                                // 'modules/services/configurationService.js'
                            ]
                        })
                    }
                }
            })
            .state('ovc.Analytics', {
                url: '/analytics/:type/?apiKey&tenantId&widgetDefinitionId&_auth',
                controller: 'analyticsController',
                templateUrl: 'views/analytics/index.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad) {
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/analyticsController.js',
                                'styles/autocomplete/autocomplete.css',
                                'styles/datepicker/bootstrap-datepicker.css',
                                'styles/analyticmatrix/analytic_matrix.css',
                                'styles/analytics/analytics.css',
                                'modules/directives/analytic_matrix/matrixController.js',
                            ]
                        })
                    }
                }
            })

            //******* SideBar Reports Coloumn States******//

            //********* For Balance Report*********//
            .state('ovc.balance-report', {
                url: '/reports/balance?fullList',
                controller: 'reportController',
                controllerAs: 'report',
                templateUrl: 'views/reports/balanceReport.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/reportController.js',
                                'styles/autocomplete/autocomplete.css',
                                'styles/datepicker/bootstrap-datepicker.css'
                                // 'modules/services/configurationService.js'
                            ]
                        })
                    }
                }
            })

            //********* For Status Report*********//
            .state('ovc.status-report', {
                url: '/reports/status?fullList&reportType',
                controller: 'reportController',
                controllerAs: 'report',
                templateUrl: 'views/reports/statusReport.html',
                resolve: {
                    loadMyFiles: function($ocLazyLoad, Utils) {
                        Utils.loadingOn();
                        return $ocLazyLoad.load({
                            name: 'OVCstockApp',
                            files: [
                                'modules/controllers/reportController.js',
                                'styles/autocomplete/autocomplete.css'                            ]
                        })
                    }
                }
            })

        .state('relogin', {
                templateUrl: '',
                url: '/relogin',
                controller: 'authCtrl'
            })
            .state('logout', {
                controller: 'LogoutCtrl',
                url: '/logout',
                templateUrl: 'views/login.html'
            })
            .state('dashlogin', {
                controller: 'dashloginCtrl',
                url: '/dashlogin',
                templateUrl: ''
            })
    }])
    .run(['$rootScope', '$state', '$cookieStore', '$http', 'CONSTANTS_VAR', 'ovcDash', 'OVC_CONFIG', 'VERSIONCON','labelService','$timeout','$location',
        function($rootScope, $state, $cookieStore, $http, CONSTANTS_VAR, ovcDash, OVC_CONFIG, VERSIONCON, labelService, $timeout,$location) {

            // keep user logged in after page refresh
            //load the env variable from server and save to the $cookieStore - check environmentConfigs.js 
            var tmp_obj              =   {};
            $rootScope.appVersion    =   VERSIONCON.version_control;
            tmp_obj.bootstraploader  =   '';

            getEnvironmentConfigs($cookieStore, OVC_CONFIG);

            tmp_obj.leftSidebar = true;
            tmp_obj.widgtWidth = '';
            $rootScope.globals = $cookieStore.get('AngUser') || {};
            $rootScope.displayCountChart = true;

            $rootScope.themeObject  =   tmp_obj;
            $rootScope.PAGE_SIZE = CONSTANTS_VAR.MAX_PAGE_SIZE;
            $rootScope.noskuRoundvalue = '0';
            if ($rootScope.globals.currentUser) {

                $http.defaults.headers.common['Authorization'] = 'bearer ' + $rootScope.globals.currentUser.token;

            }
            // loading Bar On
            $rootScope.$on('cfpLoadingBar:started', function(event, args) {
                // $.LoadingOverlay("show");

                document.getElementById("loaderImg").style.display = 'block';
                var domNode = document.getElementById("preloader");

                domNode.style.opacity = 0.5;
                domNode.style.display = "block";
            });
            //loading Bar Off
            $rootScope.$on('cfpLoadingBar:completed', function(event, args) {
                // $.LoadingOverlay("hide" , true);
                $("#preloader").css("display", "none");
            });
            // $http.get('<HOSTNAME>:8080/json/export/getResourceLabel/pos/en-us/posMClient-grp-all'
           
            $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {

                if(toState.url === '/login'){
                    document.getElementById("preloader").style.left = 0;
                    delete localStorage.labelObj;
                }

                if ($rootScope.asn_details)
                    $rootScope.asn_details = undefined;

                $rootScope.imSideScrollbarConfig = {
                   autoHideScrollbar: true,
                   theme: 'dark',
                   advanced:{
                     updateOnContentResize: true
                   },
                   setHeight: $('#page-wrapper').height(),
                   scrollInertia: 0,
                   axis: 'y',
                   scrollButtons: {
                   scrollAmount: 'auto', // scroll amount when button pressed
                   enable: true // enable scrolling buttons by default
                    },
                }; 



                function Dataload(){
                    $rootScope.themeObject.bootstraploader  =  'bootstrap/dist/css/bootstrap.min.css';
                    if(toParams.type == 'ibm'){
                        var userPermission   =   true;
                        $rootScope.globals  =   {};
                    }
                    // else{
                    //      if($rootScope.globals && $rootScope.globals.currentUser){
                    //         $rootScope.globals  =   {};
                    //     }
                    // }

                    var nxt_url = toState.url.substring(0, toState.url.indexOf('?'));
                    $rootScope.IMFromPos    =   false;
                    if($location.path() == '/findItPage') {
                        $rootScope.IMFromPos    =   true;
                    } 
                    if ((toState.url != '/login' && toState.url != '/relogin' && nxt_url != '/findit' && $location.path() != '/findItPage' && !$rootScope.globals.currentUser)) {

                        if(toParams.type != 'ibm'){
                            event.preventDefault();
                            $state.go("login", {});
                        }
                    }

                    if(toState.name == 'logout' || toState.name == 'login'){
                        delete localStorage.permissionsData;
                        delete localStorage.hierarchylocation;
                        delete localStorage.configuration;
                        delete localStorage.Roles;
                    }
                    if (nxt_url == '/findit') {
                        $rootScope.themeObject.leftSidebar = false;
                        $rootScope.themeObject.widgtWidth = 'margin:0px;';
                    }
                    else if($location.path() == '/findItPage'){
                        $rootScope.themeObject.leftSidebar = false;
                        $rootScope.themeObject.widgtWidth = 'margin:0px;'; 
                    }
                    else{
                        $rootScope.themeObject.leftSidebar = true;
                        $rootScope.themeObject.widgtWidth = '';
                    }
                    
                    $rootScope.serviceChange            =   false;
                    //For IBM Widget Dependencies
                    if(toState.name == 'ovc.Analytics' && toParams.type == 'ibm'){
                        $rootScope.themeObject.leftSidebar = false;
                        $rootScope.themeObject.widgtWidth = 'margin:0px;';
                        $rootScope.themeObject.bootstraploader  =  'ibmbootstrap/css/x1-ui-bootstrap.css';
                        $rootScope.themeObject.ibmstylesheet    =   'styles/analytics/ibmstyle.css';
                        $rootScope.serviceChange                =   true;
                    }
                    else{
                        $rootScope.themeObject.ibmstylesheet    =   '';
                    }

                    //Permisssion Checking
                    if(toState.name !== 'login' && toState.name !== 'logout' && toState.name !== 'ovc.dashboard-report'){

                        if(localStorage.permissionsData){
                            var Permission      =   JSON.parse(localStorage.permissionsData);
                            var accessVar       =   (Permission[toState.name]== undefined)? true : Permission[toState.name];
                            if(!accessVar){
                                event.preventDefault();
                                var output = {
                                    "status": "error",
                                    "message": "You need permission to perform </br>this action"
                                };
                                ovcDash.toast(output);
                                 $state.go('ovc.dashboard-report');
                            }
                        }
                    }

                    if(toState.name == 'logout' || toState.name == 'login'){
                        delete localStorage.permissionsData;
                        delete localStorage.hierarchylocationAll;
                        delete localStorage.hierarchylocation;
                        delete localStorage.userLocation1;
                        delete localStorage.userLocation0;
                        delete localStorage.location;
                        delete localStorage.configuration;
                        delete localStorage.Roles;
                        delete localStorage.configDateFormat;
                    }

                    if(toState.name != 'ovc.adjustment-add' && toState.name != 'ovc.product-perform' && toState.name != 'ovc.stocklookup-findit' && toState.name != 'ovc.stocklookup-list'){
                        delete sessionStorage.location;
                        delete sessionStorage.stocklookupsku;
                    }
                }
                Dataload(); 
            });
        }
    ]);

/*
@name dateForm
@Description Angular custom filter for Date only
@params  any variables (or) releated scopes
@return  proper date form
*/
app.filter('dateForm', function($filter, CONSTANTS_VAR) {
    return function(input) {
        if (!input) {
            return "";
        }
        var date = new Date(input);
        try{
            var dateFormat = localStorage.configDateFormat ? localStorage.configDateFormat : CONSTANTS_VAR.DATE_FORMAT_VAL;
        }catch(err){
            console.log('ERROR in Parse the seesionStorage :'+ err )
        }

        return $filter('date')(date, dateFormat);
    };
});
/*
@name datetimeForm
@Description Angular custom filter for Date & time 
@params  any variables (or) releated scopes
@return  proper date form
*/
app.filter('datetimeForm', function($filter, $cookieStore, CONSTANTS_VAR) {
    return function(input) {
        if (!input) {
            return "";
        }
        var date = new Date(input);
        try{
            var dateFormat = localStorage.configDateFormat ? localStorage.configDateFormat : CONSTANTS_VAR.DATE_FORMAT_VAL;
        }catch(err){
            console.log('ERROR in Parse the seesionStorage :'+ err )
        }

        return $filter('date')(date, dateFormat +' '+ CONSTANTS_VAR.TIME_FORMAT);
    };
});
/*
@name startFrom
@Description Angular custom filter for UI pagination.
*/
app.filter('startFrom', function() {
    return function(input, start) {
        if(!input || !input.length){
            return;
        }
        if (input) {
            start = +start; //parse to int
            return input.slice(start);
        }
        return [];
    }
});
/*
@name getarray
@Description Angular custom filter convert obj to array
@input  object
@return  Array
*/
app.filter('getarray', function() {
    return function(items) {
       var filtered = [];
       angular.forEach(items, function(item) {
         filtered.push(item);
       });
      return filtered;
    };
});
/*
@name dateFormatChange
@Description change the dateFormat to moment format
@params  any variables (or) releated scopes
@return  proper date form
*/
app.filter('dateFormChange', function(MOMENT_FORMATS,CONSTANTS_VAR) {
    return function(input) {
        if (!input) {
            return "";
        }
        var dateFormat = localStorage.configDateFormat ? localStorage.configDateFormat : CONSTANTS_VAR.DATE_FORMAT_VAL;
        try{
            var date = moment(input, MOMENT_FORMATS[dateFormat]).format('MM/DD/YYYY');
            date = new Date(date);
        }catch(e){
            date = "";
        }
        return date;
    };
});
/*
@name advancedPrint
@Description Angular custom service for print
@input  print object
@return  print Array to print Factory
*/
app.service('advancedPrint', function(ovcdataExportFactory) {
    this.getAdvancedPrint = function(data) {
        if(data){
            /*************PDF Export******************/
            var pdfData             = [];

            if(data.locationTitle)
            {
                var obj              =   {};
                obj.label            =   "Store";
                obj.value            =   data.locationTitle;
                pdfData.push(obj);
            }

            if(data.fromDate && data.toDate)
            {
                var obj              =   {};
                obj.label            =   "Date Range";
                obj.value            =   data.fromDate +' '+'-' +' '+data.toDate;
                pdfData.push(obj);
            }

            if(data.ponumber){
                var obj     =   {};
                obj.label   =   "Document Number";
                obj.value   =   data.ponumber;
                pdfData.push(obj);
            }
            
            if(data.countNumber){
                var obj     =   {};
                obj.label   =   "Count Number";
                obj.value   =   data.countNumber;
                pdfData.push(obj);
            }
            
            if(data.transtype){
                var obj     =   {};
                obj.label   =   "Transaction Type";
                obj.value   =   data.transcationType;
                pdfData.push(obj);
            }

            if(data.advSearchData.createdBy)
            {
                var obj =   {};
                obj.label   =   "Createdby";
                obj.value   =   data.advSearchData.createdBy;
                pdfData.push(obj);
            }

            if(data.fromdate && data.todate)
            {
                var obj              =   {};
                obj.label            =   "Date Range";
                obj.value            =   data.fromdate +'  -  ' + data.todate;
                pdfData.push(obj);
            }

            if(data.advSearchData.result)
            {
                var obj =   {};
                obj.label   =   "Sku/Barcode";
                obj.value   =   data.advSearchData.result;
                pdfData.push(obj);
            }

            if(data.advSearchData.asnNo)
            {
                var obj =   {};
                obj.label   =   "ASN Number";
                obj.value   =   data.advSearchData.asnNo;
                pdfData.push(obj);
            }

            if(data.advSearchData.fromQtyRange && data.advSearchData.toQtyRange)
            {
                var obj =   {};
                obj.label   =   "Qty Range";
                obj.value   =   data.advSearchData.fromQtyRange+' ' +'-'+' '+ data.advSearchData.toQtyRange;
                pdfData.push(obj);
            }

            if(data.advSearchData.fromPriceRange && data.advSearchData.toPriceRange)
            {
                var obj =   {};
                obj.label   =   "Price Range";
                obj.value   =   data.advSearchData.fromPriceRange+' ' +'-'+' '+ data.advSearchData.toPriceRange;
                pdfData.push(obj);
            }
            if(data.manualReceiptNumber){
                pdfData.push({
                    label : "Manual Receipt Number",
                    value : data.manualReceiptNumber
                })
            }
            if(data.printStatus){
                pdfData.push({
                    label : "Status",
                    value : data.printStatus
                })
            }

            if(pdfData.length > 0)
                ovcdataExportFactory.setPdfHeaderData(pdfData);
            /*************PDF Export******************/
        }
    }
});
