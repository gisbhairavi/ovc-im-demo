var app = angular.module('OVCstockApp', ['styleGroup','skuMatrix', 'ovcdataExport', 'roleConfig','ui.bootstrap.treeview']);


/*****Add  Purchase Orders****/
app.controller('addPurchaseOrders', function($rootScope, $scope, $state, $http, $stateParams, $window, $cookieStore, $timeout, CARRIERCODES, $filter, system_currencies, 
system_settings, STATES, Data, ovcDash,$window, ORDERTYPES, TRANSFERTYPES, ORGANIZATIONSTRUCTURE, $compile, $location, $anchorScroll, StyleGroupService, jmsData, OVC_CONFIG, toaster, roleConfigService,TreeViewService, $q, Utils, helper, snackbar) {

    $scope.title        =   'Add';
    $scope.titleadd     =   true;
    $scope.titleedit    =   false;
    $scope.hidepayment  =   false;
    $scope.list         =   [];
    $scope.errorSearch  =   false;
    $scope.action       =   {};
    $scope.action.primevendors = [];
    $scope.action.state =   'order';
    $scope.tab          =   {};
    $scope.tab.page     =   1;
    $scope.tab.error    =   {};
    $scope.tab.errormsg =   {};
    var submitjson      =   {};
    var allLocData      =   {};
    $scope.skuslist     =   [];
    submitjson.purchaseOrder    =   {};
    submitjson.purchaseOrder.purchaseOrderItem  =   [];
    $scope.disabled         =   0;
    $scope.errormsgshow     =   false;
    $scope.purchaseorders   =   true;
    var count               =   1;

    //Pagination scope
    $scope.POform             =   {};
    $scope.POform.entryLimit  =   50;
    $scope.POform.currentPage =   1;
    $scope.POform.offset      =   0;

    var purorder_id     =   "";
    var sys_organization =  ORGANIZATIONSTRUCTURE;

    //Common Button Actions
    $scope.tabName  =   function(hidepayment , billtab , shiptab){
          if((hidepayment && billtab && shiptab) || (!hidepayment && !billtab && shiptab) || 
            (hidepayment && !billtab && shiptab) || (!hidepayment && billtab && !shiptab))
            var num     =   "3";
          if((!hidepayment && !billtab && !shiptab) || (hidepayment && !billtab && !shiptab) || (hidepayment && billtab && !shiptab))
            var num     =   "2";
          if(!hidepayment && billtab && shiptab)
            var num     =   "4";
        return num;
    };

    $scope.nextBtn  =   function(po_add, shiptab, billtab, hidepayment){
        var page = 1;
        if(shiptab)
            page = 1;
        if(!hidepayment && billtab && !shiptab)
            page = 2;
        if(((hidepayment || !billtab) && !shiptab) ||(hidepayment && billtab  && !shiptab)
            || (!hidepayment &&  !billtab  && !shiptab))
            page = 3;

        $scope.tabreturn(po_add,page);
    };

    $scope.previousBtn  =   function(billtab, shiptab, hidepayment){
        if((hidepayment || !billtab) && !shiptab)
            $scope.tab.page  =  1;
        if(!hidepayment && billtab)
            $scope.tab.page  = 3;
        if((hidepayment || !billtab) && shiptab)
            $scope.tab.page  = 2;
    }
    //Common Button Actions

    $scope.storeConfig = {};
    $timeout(function(){
        angular.element('.prod_result').focus();
    },500);

    var organization_obj = {};
    angular.forEach(sys_organization,function(item){
            organization_obj[item.id]= item.code;
    });
    $scope.organization_struct = organization_obj;


    $scope.shiptab  =   true;
    $scope.puprice  =   true;
    $scope.billtab  =   true;
    var locConfig = true;
    var GroupByStyle    =   true;
   

    $scope.validation      =   function(data, add, upload , submit,status){
        $scope.tab.error    =   {};
        $scope.tab.errormsg =   {};
        var errorArray      =   [];
            if(  $scope.action.state === 'order' && (!data.vendorName) ){
                errorArray.push( {'id' : 'vendorName', 'message' : 'Please select Vendor Store' });
            }
            if(!data.shiptostore){
                errorArray.push( {'id': 'shiptostore', 'message' : 'Please select the Ship to Store'});
            }
            if( $scope.action.state === 'transfer' && (!data.orderstore) ){
                errorArray.push( {'id' : 'orderselect1', 'message' : 'Please select Order from Store'});
            }

            if(submit && $scope.action.state === 'order' && $scope.action.enableNeedByDate && ! $scope.O_add.need_by_date){
                errorArray.push( {'id' : 'needByDate', 'message' : 'Please provide the Need by Date'});
            }
            if(add){
                    if((data.prodresult) || (data.styleresult) || (upload === "upload")){
                    }else{
                        errorArray.push( {'id' : 'prodresult', 'message' : 'Please Add At Least One SKU'});

                    }
            } else if($scope.skuslist) {
                if(!$scope.withPagination) {
                    if(Object.keys($scope.skuslist).length === 0 && submit) {
                        errorArray.push( {'id': 'prodresult', 'message' : 'Please Add At Least One SKU'});
                    }
                }else{
                    if($scope.skuslist.length === 0  && submit){
                        errorArray.push( {'id': 'prodresult', 'message' : 'Please Add At Least One SKU'});
                    }
                }
               
                if($scope.skuslist.length){
                                    
                    try {
                        var skuErrorArray =   [];
                        var skuZeroCheck  = [];
                        if(!$scope.withPagination){
                            _.keys($scope.skuslist).forEach(function(styledata) {
                                $scope.skuslist[styledata].skus.forEach(function(SKUdata) {
                                    $scope.checkReorderqty(SKUdata)?skuErrorArray.push( {'message' : 'SKU Qty should be the Qty of Pack Size'}):'';
                                    (SKUdata.qty === 0 && !data.nextBtn) ?skuZeroCheck.push({'message':'Quantity should be greater than 0.'}) : '';
                                    data.nextBtn = '';
                                });
                            });
                        }else{
                            if($scope.skuslist.length > 0){
                                _.forEach($scope.skuslist , function(SKUdata){
                                    $scope.checkReorderqty(SKUdata) ? skuErrorArray.push( {'message' : 'SKU Qty should be the Qty of Pack Size'}):'';
                                    (SKUdata.qty === 0 && !data.nextBtn) ?skuZeroCheck.push({'message':'Quantity should be greater than 0.'}) : '';
                                    data.nextBtn = '';
                                });
                            }
                        }
                        if(skuErrorArray.length > 0){
                            var output = {
                                "status": "error",
                                "message": "SKU Qty should be the Qty of Pack Size"
                            };
                            Data.toast(output);
                            skuErrorArray =   [];
                            return false;
                        }
                        if(skuZeroCheck.length > 0 && status !== 'draft'){
                             var output = {
                                 "status": "error",
                                 "message": "Quantity should be greater than 0."
                             };
                             Data.toast(output);
                             skuZeroCheck =   [];
                             $scope.tab.page     =   1;
                             return false;
                         }
                    } catch (e) {
                        console.log(e);
                    }
                }
            }
            if(errorArray.length > 0){
                angular.forEach(errorArray,function(error){
                    $scope.tab.error[error.id]=true;
                    $scope.tab.errormsg[error.id]=error.message;
                });
                $scope.tab.page     =   1;
                return false;
            }
        return true;
    }

    $scope.tabreturn    =   function(data,page){
        data.nextBtn = "next";
        if($scope.validation(data) && page)
            $scope.tab.page = page+1;
    }
    $scope.vendor_datas =   [];
    // var currensymbs = $scope.translation.currencylist[0];
    // var currcodes = system_currencies[0];
    // $scope.currency = currensymbs[currcodes.code];
    var curr_settings       = system_currencies;
    $scope.currencytypes    = curr_settings;
    $scope.store_datas      = [];
    $scope.fromstore_datas  = [];
    var pordercodes         = [];
    var user_detail         = $rootScope.globals['currentUser'];
    var user_id             = user_detail['username'];
    var cordercodes         = ORDERTYPES;
    var ordercodes          = $scope.translation.orderstypelist[0];
    var deletesku_header    =   'Delete Item from Order';
    var add_success     =   "Order Added Successfully";
    angular.forEach(cordercodes, function(item) {
        var purch       = item.code;
        var porder      = ordercodes[purch];
        item.label      = porder;
        if(item.code=='MAN')
        pordercodes.push(item);
    });
    if($state.current.name      ==  'ovc.transfer-add'){
        ordercodes      = $scope.translation.transferstypelist;
        cordercodes     = TRANSFERTYPES;
        $scope.action.state     =   'transfer';
        var deletesku_header    =   'Delete Item from Transfer';
        var add_success =   "Transfer Added Successfully";
        var pordercodes = [];
        angular.forEach(cordercodes, function(item) {
            var purch   = item.code;
            var porder  = ordercodes[purch];
            item.label  = porder;
            pordercodes.push(item);
            
        });

        Utils.roles().then(function(rolesData){
            $rootScope.rolePerm     =   rolesData;
        });
    } 
    $scope.action.cancelBtn =   function(){
        if($state.current.name      ==  'ovc.transfer-add'){
            $state.go('ovc.ibt');
        }else{
            $state.go('ovc.purchaseorder-list');
        }
    };

    $scope.action.cancel    =   function(poadd,oadd){
        $scope.order_adsub(poadd,oadd, 'draft');
    };
    var vendorIdObj  =   {};
     /* get transaction types from micro service */
    $scope.getVendors = function() {
        Data.get('/vendor').then(function(results) {
            var listvendors     = [];
            var primevendors    = [];
            angular.forEach(results, function(values) {
                if ((values.status) && (values.companyName != undefined) && (values.companyName != '')) {
                    var newobj = {
                        companyName: values.companyName,
                        vendorName: values._id,
                        vendorId: values._id
                    }
                    listvendors.push(newobj);
                    if(values.primarysupplier){
                        primevendors.push(values._id);
                    }
                    vendorIdObj[values._id]     =   values.companyName;
                }
            });
            $scope.vendorIdObj  =   vendorIdObj;
            $scope.vendor_datas = listvendors;
            $scope.action.primevendors = primevendors;
        });
    };
   
    $scope.po_add = {};
     //$scope.O_add={};
    $scope.ordertype    = pordercodes;
    $scope.vendorhide   = true;
    $scope.orderfmstore = true;
    
    $scope.Getordertype = function(pordercode) {

        if(pordercode == null){
                $scope.hidepayment  =   false; $scope.vendorhide = true;
                $scope.orderfmstore =   true;
                $scope.po_add       =   {}; $scope.shippingstr1='';$scope.billstore1='';
                $scope.smethods     =   '';
                $scope.O_add        =   {};
                $scope.spmethod     =   '';
                $scope.selvendor    =   '';
                var newshipto       =   '';
                $scope.getstore_details (newshipto);
        
        }
        if (pordercode == 'IBT_M') {
            $scope.vendorhide   = true;
            $scope.orderfmstore = false;
            $scope.hidepayment  = true;
            if (($scope.vendor_datas != undefined) &&    ($scope.vendor_datas.length == 1)){
            $scope.po_add.vendorName    =   '';
            } 
            $scope.po_add.orderstore    =   '';
            $scope.po_add.shiptostore   =   ''; 
            $scope.po_add.markforstore  =   ''; 
            $scope.shippingstr1     =   '';$scope.billstore1='';
                $scope.smethods     =   '';
                $scope.O_add        =   {};
                $scope.spmethod     =   '';
                $scope.selvendor    =   '';
                $scope.getStores();
                 var newshipto='';
                $scope.getstore_details (newshipto);
                
        } 
        if (pordercode == 'MAN') {
            if ($scope.vendor_datas.length == 1) {
                $scope.GetSelectedVendor( $scope.vendor_datas[0].vendorName);
            } 
            $scope.vendorhide = false;
            $scope.orderfmstore = true;
            $scope.hidepayment = false;  
            $scope.po_add.orderstore='';
            // $scope.po_add.shiptostore=''; 
            $scope.po_add.markforstore=''; 
            $scope.shippingstr1='';$scope.billstore1='';
            $scope.O_add={};
            $scope.getStores();
            var newshipto='';
            $scope.getstore_details (newshipto);
        }
    }
    $scope.UOM          =   [];
    $scope.UOMvalues    =   [];
    var currencylabel   =   $scope.translation.currencylist[0];
    var currencylist    =   [];

    $scope.needByDateChange     =   function(){
        if($scope.O_add.need_by_date){
            $scope.tab.error['needByDate']  =   false;
        }
    }

    /* get store or locations from mysql service */
    $scope.getStores = function() {
        Utils.userLocation(1).then(function(results){
            if(results.status=='error'){
                    $scope.store_datas = [];
            }else{
                $scope.store_datas = results;
                if($scope.store_datas.length==1){
                    $scope.po_add.shiptostore = results[0].id;
                    $scope.po_add.markforstore = results[0].id;
                    $scope.O_add.billtostore=results[0].parentLocation;
                   // $scope.O_add.markforloc= results[0].id;
                    $scope.markforstr= results[0].displayName;
                    $scope.shippingstr1 = results[0].displayName;
                    $scope.billstore1= results[0].displayName;
                }
                 if(($scope.store_datas.length==1)  && ( $scope.po_add.pordercode == 'MAN') ){
                    $scope.po_add.shiptostore = $scope.store_datas[0].id;
                    $scope.po_add.markforstore = $scope.store_datas[0].id;
                    $scope.O_add.billtostore=$scope.store_datas[0].parentLocation;
                   // $scope.O_add.markforloc= results[0].id;
                    $scope.markforstr= $scope.store_datas[0].displayName;
                    $scope.shippingstr1 = $scope.store_datas[0].displayName;
                    $scope.billstore1= $scope.store_datas[0].displayName;
                    $scope.getstore_details($scope.store_datas[0].id,"shiptostore");
                 }
               
                angular.forEach(results, function(item){
                    currencylist[item.id]    =   item.currency;
                });
            }
        }, function(error){
            console.log('User Location with Store 1 : '+ error);
        });

        Utils.hierarchylocation().then(function(results){
            $scope.orderAfs         =   results;
            $scope.storeLocData     =   TreeViewService.getLocData(results);
            $scope.flatLocations    =   [];
            $scope.storeLocData.forEach(function (item) {
                $scope.recur(item, 0, $scope.flatLocations);
            });
        }, function(error){
            console.log('hierarchylocation Error :' + error);
        });
        if($scope.config.organization_name == $scope.organization_struct['1'] && $state.current.name == 'ovc.transfer-add'){
            Utils.hierarchylocationAll().then(function(hieLocAll){
                $scope.allhierarchy     =   TreeViewService.getLocData(hieLocAll);
                $scope.CorparateLocationData    =   [];
                $scope.allhierarchy.forEach(function (item) {
                    $scope.recur(item, 0, $scope.CorparateLocationData);
                });
                if(($scope.store_datas.length==1)  && ( $scope.po_add.pordercode == 'IBT_M') ){
                    $scope.po_add.shiptostore = $scope.store_datas[0].id;
                    $scope.po_add.markforstore = $scope.store_datas[0].id;
                    $scope.O_add.billtostore=$scope.store_datas[0].parentLocation;
                    $scope.markforstr= $scope.store_datas[0].displayName;
                    $scope.shippingstr1 = $scope.store_datas[0].displayName;
                    $scope.getstore_details($scope.store_datas[0].id,"shiptostore");
                }
            });
        }else{
            if(($scope.store_datas.length==1)  && ( $scope.po_add.pordercode == 'IBT_M') ){
                $scope.po_add.shiptostore = $scope.store_datas[0].id;
                $scope.po_add.markforstore = $scope.store_datas[0].id;
                $scope.O_add.billtostore=$scope.store_datas[0].parentLocation;
                $scope.markforstr= $scope.store_datas[0].displayName;
                $scope.shippingstr1 = $scope.store_datas[0].displayName;
                $scope.getstore_details($scope.store_datas[0].id,"shiptostore");
            }
        }
    };

    $scope.times = function (n, str) {
        var result = '';
        for (var i = 0; i < n; i++) {
            result += str;
        }
        return result;
    };

    $scope.recur = function (item, level, arr) {
        arr.push({
            displayName: item.name,
            id: item.id,
            level: level,
            indent: $scope.times(level, '\u00A0\u00A0'),
            type: (item.type === 'Store')?false:true
        });

        if (item.children) {
            item.children.forEach(function (item) {
                $scope.recur(item, level + 1, arr);
            });
        }
    };
   
    /*******************get uom **********/
    $scope.uomservice = function() {
        Data.get('/uom').then(function(results) {
            var uomdatas = [];
            angular.forEach(results, function(values) {
                if ((values.isActive) && (values.uomId != undefined) && (values.uomId != '') && (values.description != undefined) && (values.description != '')) {
                    var newobj = {
                        name: values.uomId,
                        id: values.uomId,
                        uid: values.uomId,
                        value: values.uomId
                    }
                    uomdatas.push(newobj);
                    $scope.UOMvalues[values.uomId]=values.uomId;
                }
            });
            $scope.UOM = uomdatas;
            angular.forEach($scope.UOM, function(item) {
                uomlist[item.id] = item.name;
            });
        });
    }
    $scope.uomservice();
    $scope.getVendors();
    // $scope.getStores(); 
    
    


    var cardesc = $scope.translation.carrier[0];
    var ccodes = CARRIERCODES;
    var carrcodes = [];
    angular.forEach(ccodes, function(item) {
        var abc = item.Name;
        var bcd = cardesc[abc];
        item.description = bcd;
        carrcodes.push(item);
    });
    $scope.O_add = {};
    $scope.smethods = '';
    $scope.getselected_store = function(newstore) {
        $scope.tab.error['orderselect1']    =   false;
        $timeout(function(){
            angular.element('.prod_result').focus();
        },500);
            $scope.po_add.orderstore =   newstore;  

        if($scope.config.organization_name == $scope.organization_struct['2'])
           var allstores = $scope.fromstore_datas;
        if($scope.config.organization_name == $scope.organization_struct['1'])
            var allstores = $scope.CorparateLocation;
        angular.forEach(allstores, function(item) {
            if (item.id == newstore) {
                $scope.fromstr = item.displayName;
            }
        });
            //$scope.fromstore_datas = [];
    }


        /*****Get Shipping method based on Vendor  $scope.po_add = {
                orderstore: newstore
            };******/
    $scope.GetSelectedVendor = function(value) {

        $scope.tab.error['vendorName']    =   false;
        $timeout(function(){
            angular.element('.prod_result').focus();
        },500);

        if (($scope.list != undefined) && ($scope.list != '')) {
            $.confirm({
                title: 'Change Vendor',
                content: 'Do you like to change Vendor?',
                confirmButtonClass: 'btn-primary',
                cancelButtonClass: 'btn-primary',
                confirmButton: 'Ok',
                cancelButton: 'Cancel',
                confirm: function() {
                    $state.reload();
                },
                cancel: function() {
                    return false;
                }
            });
        } else {}
        var vendor = value;
       $scope.po_add.vendorName =   vendor;  $scope.allproducts = [];
        $scope.addedproducts = [];
        if ((vendor != null) && (vendor != '') && (vendor != undefined)) {
            Data.get('/vendor?id=' + vendor).then(function(data) {
                var exccodes = data.carrierAlphaCode;
                if (exccodes != '') {
                    var vcarrier = new Array();
                    vcarrier = exccodes.split(',');
                    var newships = [];
                    angular.forEach(carrcodes, function(item) {
                        if (vcarrier.indexOf(item.Name) != -1) {
                            newships.push(item);
                        } else {}
                    });
                    $scope.smethods = newships;
                    $scope.O_add.shipmethod = $scope.smethods[0].Name;
                    $scope.spmethod = $scope.smethods[0].description;
                } else {
                    $scope.smethods = [];
                }
                $scope.selvendor = data.companyName;
               
            });
        }else{
                $scope.selvendor = '';
        }
    }
    $scope.oldlist = [];
    $scope.allproducts = [];
    $scope.oldpids = [];
    $scope.allproducts2 = [];
    $scope.loadmat=false;
    $scope.changedSkus=[];
    //$scope.changedSkus={};
    $scope.prod_detail = {};
    //var prod_detail=[];
    var price_detail=[];
    var addedskus=[];
    // var count      =   1;

     Utils.configurations().then(function(configData){
        $scope.config    =   configData;
        if((configData.config_arr && configData.config_arr.validateProductAndLocationMapping && configData.config_arr.validateProductAndLocationMapping.featureValue ==  false) 
            || (!configData.config_arr.validateProductAndLocationMapping && !configData.config_arr.validateProductAndLocationMapping.featureValue) ){
                locConfig = false
        }

        $scope.puprice = configData.puprice ? configData.puprice : true;
        $scope.shiptab = configData.config_arr && configData.config_arr.hideShippingTab &&
                            configData.config_arr.hideShippingTab.featureValue ? false : true;

        $scope.billtab = configData.config_arr && configData.config_arr.hideBillingTab &&
                            configData.config_arr.hideBillingTab.featureValue ? false : true;

        $scope.billto = configData.config_arr && configData.config_arr.enableBillTofield &&
                            configData.config_arr.enableBillTofield.featureValue ? true: false;

        $scope.action.enableNeedByDate  = ($state.current.name  ==  'ovc.purchaseorder-add') && configData.config_arr && configData.config_arr.enableNeedByDate &&
                                        configData.config_arr.enableNeedByDate.featureValue ?  true : false;  

        GroupByStyle = configData.config_arr && configData.config_arr.allGroupingByStyle ?
                                configData.config_arr.allGroupingByStyle.featureValue : true;
        if(!GroupByStyle && $state.current.name == 'ovc.purchaseorder-add'){
            $scope.withPagination   =   true;
        }

          /***For Default Select Store**/
        if($scope.ordertype.length == 1){
            $scope.po_add.pordercode = pordercodes[0].code;
            $timeout(function() {
                $scope.Getordertype(pordercodes[0].code);
            }, 1800);
        } 
    });
    /******Search product to add order item*****/
    $scope.dosrchproduct = function(typedthings)  {
        $scope.styleproducts  =  [];
        if(typedthings && typedthings != '...'){
            var URL = $scope.vendorhide || $scope.action.primevendors.indexOf($scope.po_add.vendorName) > -1 ? 
                        'apis/ang_loc_products?srch=' : '/vendorproduct/' ;
            if($scope.po_add.orderstore || $scope.po_add.shiptostore){
                var loc_id = $scope.vendorhide ? $scope.po_add.orderstore : $scope.po_add.markforstore ? $scope.po_add.markforstore : $scope.po_add.shiptostore;
                var vendorid = $scope.po_add.vendorName ? $scope.po_add.vendorName : '';
                var sku = typedthings.indexOf('~') ? typedthings.split('~')[0] : typedthings;

                if($scope.vendorhide)
                    var query   =   typedthings + '&locid=' + encodeURIComponent(loc_id);
                else if($scope.action.primevendors.indexOf($scope.po_add.vendorName) > -1)
                    var query   =   typedthings + '&locid=' + encodeURIComponent(loc_id) + '&config=' + locConfig;
                else
                    var query   =    vendorid + '?vendorSKU=' + sku + '&isDropdown=' + true;

                if(URL == '/vendorproduct/'){
                    var nrows = [];
                    Data.get(URL + query).then(function(data){
                        if(data){
                            angular.forEach(data, function(item) {
                                nrows.push(item.vendorSKU);
                            });
                            if(nrows.length){
                                ovcDash.post('apis/ang_getvendorproducts',{data:{sku:nrows.join(','),config:locConfig}}).then(function (results) {
                                    loadsearchData(results, typedthings);
                                }, function(error){
                                    console.log(error + 'getvendorProduct-Dash');
                                });
                            }else{
                                showerror('noproduct');
                            }
                        }else{
                            showerror('noproduct');
                        }
                    }, function(error){
                        console.log(error + 'vendorProduct-Mango');
                    });
                }else{
                    ovcDash.get(URL + query).then(function(results){
                        loadsearchData(results, typedthings);
                    }, function(error){
                        console.log(error + 'loc product-Dash')
                    });
                }
            }else{
                $scope.allproducts = [];$scope.addedproducts = [];
                $scope.errorSearch = true;
                $scope.error_searchmsg = !$scope.po_add.orderstore ? 'Please Select the From Store' :'Please Select the Ship to Store';
                $timeout(function() {$scope.errorSearch = false;}, 3000);
                return false;
            }
        }
    };

    function loadsearchData(loaddata , typedthings){
        helper.multiDropDown(loaddata , $scope.config.showskugroup).then(function(data){
            $scope.addedproducts = data.rows;
            $scope.allproducts   = data.allvals;
            $scope.allSKUobj     = data.skuObj;
            $scope.scanproduct(data.rows, typedthings);
        }, function(error){
            showerror('noproduct');
        });
    }

    function showerror(error){
        if(error == 'noproduct'){
            $scope.addedproducts   = [];
            $scope.errormsgshow    = false;
            $scope.po_add.prodresult = '';
            var output = {"status": "error","message": "No products Found"};
            Data.toast(output);
            return false;
        }
    }
        // var selectedpr ='';
    $scope.scanproduct  =   function(rows,scanvalue){
         if(rows.length == 1 ){
            var rowValues = rows[0].split('~');
            if(scanvalue == rowValues[2] || scanvalue == rowValues[0]){
                $scope.po_add.prodresult = rows[0];
                $scope.poAddSkus($scope.po_add, $scope.tab.page);
            }
        }
    }

    $scope.doSelectproduct = function(suggestion) {
        $scope.po_add.prodresult=suggestion;
        $scope.tab.error['prodresult']    =   false;
        $scope.poAddSkus($scope.po_add,1);
    }
    $scope.listPROD = [];
    var explist = [];
    var uomlist = {};
    var busy    =   true;  
    $scope.skuRoundvalue = {};

    $scope.checkReorderqty = function(skuData) {
        var skuRound = false;
        if ($scope.storeConfig.replenishmentRoundingQty) {
            if ($scope.storeConfig.replenishmentRoundingQty.featureValue && $scope.storeConfig.replenishmentRoundingQty.featureValue !== $rootScope.noskuRoundvalue) {
                skuRound = $scope.skuRoundvalue[skuData.sku] && ((skuData.qty % $scope.skuRoundvalue[skuData.sku]) != 0);
           }
        }
        return skuRound;
    };
    
    $scope.changeToBaseqty = function (skuData) { 
        if ($scope.storeConfig.replenishmentRoundingQty && $scope.storeConfig.replenishmentRoundingQty.featureValue != $rootScope.noskuRoundvalue) {
            var ext =parseFloat(skuData.qty)  % parseFloat($scope.skuRoundvalue[skuData.sku]);
        if (ext > 0) {
            if ($scope.storeConfig.replenishmentRoundingQty.featureValue === 'up') {
                skuData.qty = parseFloat(skuData.qty) + (parseFloat($scope.skuRoundvalue[skuData.sku]) - ext);
            } else {
                skuData.qty = parseFloat(skuData.qty) - ext;
            }
        }else{
            if(skuData.qty <= 0){
                var output = {
                    "status": "error",
                    "message": "Quantity should be greater than 0."
                };
                Data.toast(output);
            }
                skuData.qty = parseFloat(skuData.qty);
        }

       return skuData.qty;
        }
    };
    function getskuRules(sku) {
        var deferred = $q.defer();
        if ($scope.storeConfig.replenishmentRoundingQty && $scope.storeConfig.replenishmentRoundingQty.featureValue !== $scope.noskuRoundvalue && $state.current.name === 'ovc.purchaseorder-add') {
            if ($scope.skuRoundvalue[sku]) {
                deferred.resolve($scope.skuRoundvalue[sku]);
            }else {
                if(Array.isArray(sku) && !sku.length){
                    deferred.resolve();
                }else{
                    var srchData = {};
                    srchData.locationId = $scope.po_add.shiptostore;
                    srchData.sku = sku.toString();
                    Data.get('/getReplenishmentRulesSku?srchData=' + JSON.stringify(srchData)).then(function(data) {
                        if (data.status != 'error' && data.length) {
                            data.forEach(function(skuRoundvalue) {
                                $scope.skuRoundvalue[skuRoundvalue.sku]= skuRoundvalue.roundingValue;
                            });
                            deferred.resolve(data[0].roundingValue);
                        } else {
                            deferred.resolve();
                        }
                    });
                }                
            }
        } else {
            deferred.resolve();
        }
        return deferred.promise;
    }
    $scope.poAddSkus = function(po_add, page){
        if($scope.validation(po_add,'add') && page){
            if((po_add.shiptostore == undefined) || (po_add.shiptostore == ''))
                angular.element('.shipstoreval').focus();
            if((po_add.prodresult != '') && (po_add.prodresult != undefined)){
                 angular.element('.prod_result').focus();
            $scope.addedproducts    =   [];
            var selectedpro     =   [];
            selectedpro  =   $scope.po_add.prodresult.split('~');
            if(!$scope.withPagination){
                if(selectedpro.length == 3){
                    $scope.order_product(po_add);
                }else if(selectedpro.length == 2){
                    if((po_add.prodresult != '') && (po_add.prodresult != undefined)){
                         angular.element('.prod_result').focus();
                        $scope.styleproducts    =   [];
                        $scope.order_style(po_add);
                    }
                }
            }else{
                skuGroupAssign(selectedpro);
            }
        }
        $scope.addedproducts    =   [];
        }
        $scope.addedproducts    =   []; 
    }
    $scope.changeSkuCost = function($index,sku) {
        $scope.calcItems1($index,sku.qty, sku.cost,sku.total,sku.sku,sku.style); sku.changed = sku.originalQty == sku.qty ? false : true ;
    } 
    $scope.orderAddSkus = function(event){
            if(!$scope.validation($scope.po_add,1,"upload")){
                event.preventDefault();
                return false;
            }
         $scope.addedproducts    =   []; 
    }

    $scope.order_product = function(po_add) {
        var seltedpr = po_add.prodresult.split('~');
        var loc = $scope.po_add.orderstore;
        var sku = $scope.po_add.pordercode;
        //var stostore = $scope.shippingstr;
        var stostore = ($scope.po_add.markforstore != undefined && $scope.po_add.markforstore != '') ? $scope.po_add.markforstore : $scope.po_add.shiptostore;
        $scope.currency     =   currencylabel[currencylist[$scope.po_add.shiptostore]];
        
        if ($scope.allproducts != undefined) {
            angular.forEach($scope.allproducts, function(sval, index) {
                var prtax = tax_tot = sptax = spvat = sptaxes = spvates = tot_wtax = 0;
                if (($scope.vendorhide == true)) {
                    if (sval.sku == seltedpr[0] ) {
                            ovcDash.get('apis/ang_getproductprice?sku=' + sval.sku + '&loc=' + encodeURIComponent(stostore)).then(function(result) {
                                $scope.product_price = result[0];
                                var cost = result[0].ProductPrice.Cost;
                                var Tax = result[0].ProductPrice.isVAT;
                                var vTax = result[0].ProductPrice.percentage;
                                var totalc = 0;
                                var povat = vat_total = 0;
                                //var prtax=prvat=0;
                                var newprod = false;
                                angular.forEach($scope.listPROD, function(lval, lindex) {
                                    if (lval.productCode == seltedpr[0]) {
                                        var qty = (lval.qty) + (1);
                                        // var qays = lval.qty[lindex].push(qty);
                                        newprod = true;
                                        $scope.listPROD[lindex].qty = qty;
                                        var pcost = parseFloat(cost).toFixed(2);
                                        var to_tal = parseFloat(pcost) * parseFloat(qty);
                                        var vatTax = vTax;
                                        var vnTax = Tax;
                                        if (Tax == 0) {
                                            prtax = (to_tal * parseFloat(vatTax / 100));
                                            tax_tot = parseFloat(prtax).toFixed(2);
                                            sptax = (parseFloat(pcost) * parseFloat(vatTax / 100));
                                            sptaxes = parseFloat(sptax).toFixed(2);
                                            tot_wtax = (to_tal * parseFloat(vatTax / 100)) + to_tal;
                                            totalc = parseFloat(to_tal).toFixed(2);
                                            $scope.listPROD[lindex].total = tot_wtax;
                                            $scope.listPROD[lindex].totalnotax = totalc;
                                            $scope.listPROD[lindex].totalProductTax = tax_tot;
                                            $scope.calcItems(lindex, qty, pcost, totalc, tot_wtax, tax_tot,sval.productCode);
                                        } else if (Tax == 1) {
                                            //tot_wtax=( to_tal*parseFloat(vatTax/100))+to_tal;
                                            tot_wtax = parseFloat(to_tal).toFixed(2);
                                            povat = (to_tal * parseFloat(vatTax / 100));
                                            vat_total = parseFloat(povat).toFixed(2);
                                            spvat = (parseFloat(pcost) * parseFloat(vatTax / 100));
                                            spvates = parseFloat(spvat).toFixed(2);
                                            //totalc =to_tal;
                                            totalc = parseFloat(to_tal).toFixed(2);
                                            $scope.listPROD[lindex].total = tot_wtax;
                                            $scope.listPROD[lindex].totalnotax = totalc;
                                            $scope.listPROD[lindex].totalProductVat = vat_total;
                                            $scope.calcItems(lindex, qty, pcost, totalc, tot_wtax, vat_total,sval.productCode);
                                        }
                                    }
                                });

                                if (!newprod) {                             //var qty = []; parseFloat
                                    var qty =   1;
                                    var pcost = parseFloat(cost).toFixed(2);
                                    var vatTax = vTax;
                                    var vnTax = Tax;
                                    var to_tal = parseFloat(pcost) * parseFloat(qty);
                                    if (Tax == 0) {
                                        totalc = parseFloat(to_tal).toFixed(2);
                                        tot_wtax = (to_tal * parseFloat(vatTax / 100)) + to_tal;
                                        sptax = (parseFloat(pcost) * parseFloat(vatTax / 100));
                                        sptaxes = parseFloat(sptax).toFixed(2);
                                        prtax = (to_tal * parseFloat(vatTax / 100));
                                        tax_tot = parseFloat(prtax).toFixed(2);
                                    } else if (Tax == 1) {
                                        totalc = parseFloat(to_tal).toFixed(2);
                                        //tot_wtax=( to_tal*parseFloat(vatTax/100))+to_tal;
                                        tot_wtax = parseFloat(to_tal).toFixed(2);
                                        spvat = (parseFloat(pcost) * parseFloat(vatTax / 100));
                                        spvates = parseFloat(spvat).toFixed(2);
                                        povat = (to_tal * parseFloat(vatTax / 100));
                                        vat_total = parseFloat(povat).toFixed(2);
                                    }
                                    var sduom = uomlist['Each'];
                                    var skuwaist    =   ((sval.waist) && (sval.waist != '' )) ? parseInt(sval.waist) : null ;
                                    var skulength   =   ((sval.length) && (sval.length !=   '' ) )? parseInt(sval.length) : null ;
                                    var skusize =   ((sval.size)    &&  (sval.size  !=  '')) ? (sval.size) :    '' ;
                                    $scope.listPROD.push({
                                        id:'',
                                        lineNumber:'',
                                        sku:sval.sku,
                                        productCode: sval.sku,
                                        name: sval.name,
                                        description: sval.description,
                                        vendorName: $scope.po_add.vendorName,
                                        cost: pcost,
                                        productVat: spvates,
                                        totalProductVat: vat_total,
                                        productTax: sptaxes,
                                        totalProductTax: tax_tot,
                                        qty: qty,
                                        orderType:$scope.po_add.pordercode,
                                        fromStore:$scope.po_add.orderstore,
                                        toStore:$scope.po_add.shiptostore,
                                        totalnotax: totalc,
                                        total: tot_wtax,
                                        taxisVAT: Tax,
                                        percentage: vTax,
                                        selectedUOM: sduom,
                                        style:sval.productCode,
                                        styleDescription:sval.styleDescription,
                                        variants:sval.variants,
                                        styleColor:sval.color,
                                        // waist:skuwaist,
                                        // length:skulength,
                                        // size:skusize
                                    });
                                    //$scope.list=$scope.listPROD;
                                    $timeout(function() {
                                        $scope.fillTableElements($scope.listPROD);
                                    }, 500);
                                    $scope.prod_result = "";
                                    $scope.po_add.prodresult = '';

                                    $scope.list = $scope.listPROD;
                                    angular.forEach($scope.listPROD, function(lval, lindex) {
                                        if (lval.productCode == sval.sku) {
                                            if (lval.taxisVAT == 1) {
                                                $scope.calcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.vat_total,sval.productCode);
                                            } else if (lval.taxisVAT == 0) {
                                                $scope.calcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.tax_tot,sval.productCode);
                                            }
                                        }
                                    });
                                }
                            });
                    }
                } else {
                    if (sval.sku == seltedpr[0]) {
                        getskuRules(sval.sku).then(function (skuRoundvalue) {
                            ovcDash.get('apis/ang_getproductprice?sku=' + sval.sku + '&loc=' + encodeURIComponent(stostore)).then(function(result) {
                                $scope.product_price = result[0];
                                var cost = result[0].ProductPrice.Cost;
                                var Tax = result[0].ProductPrice.isVAT;
                                var vTax = result[0].ProductPrice.percentage;
                                var baseqty = (skuRoundvalue?skuRoundvalue:1);
                                var totalc = 0;
                                var povat = vat_total = 0;
                                var newprod = false;
                                angular.forEach($scope.listPROD, function(lval, lindex) {
                                    if (lval.productCode == seltedpr[0]) {
                                        var qty = (lval.qty) + baseqty;
                                        newprod = true;
                                        $scope.listPROD[lindex].qty = qty;
                                        var pcost = parseFloat(cost).toFixed(2);
                                        var to_tal = parseFloat(pcost) * parseFloat(qty);
                                        var vatTax = vTax;
                                        var vnTax = Tax;
                                        if (Tax == 0) {
                                            prtax = (to_tal * parseFloat(vatTax / 100));
                                            tax_tot = parseFloat(prtax).toFixed(2);
                                            sptax = (parseFloat(pcost) * parseFloat(vatTax / 100));
                                            sptaxes = parseFloat(sptax).toFixed(2);
                                            tot_wtax = (to_tal * parseFloat(vatTax / 100)) + to_tal;
                                            totalc = parseFloat(to_tal).toFixed(2);
                                            $scope.listPROD[lindex].total = tot_wtax;
                                            $scope.listPROD[lindex].totalnotax = totalc;
                                            $scope.listPROD[lindex].totalProductTax = tax_tot;
                                            $scope.calcItems(lindex, qty, pcost, totalc, tot_wtax, tax_tot,sval.productCode);
                                        } else if (Tax == 1) {
                                            povat = (to_tal * parseFloat(vatTax / 100));
                                            vat_total = parseFloat(povat).toFixed(2);
                                            spvat = (parseFloat(pcost) * parseFloat(vatTax / 100));
                                            spvates = parseFloat(spvat).toFixed(2);
                                            totalc = parseFloat(to_tal).toFixed(2);
                                            tot_wtax = parseFloat(to_tal).toFixed(2);
                                            $scope.listPROD[lindex].total = tot_wtax;
                                            $scope.listPROD[lindex].totalnotax = totalc;
                                            $scope.listPROD[lindex].totalProductVat = vat_total;
                                            $scope.calcItems(lindex, qty, pcost, totalc, tot_wtax, vat_total,sval.productCode);
                                        }
                                    }
                                });
                                if (!newprod) {
                                    //var qty = [];
                                    var qty = baseqty;
                                    var pcost = parseFloat(cost).toFixed(2);
                                    var vatTax = vTax;
                                    var vnTax = Tax;
                                    var to_tal = parseFloat(pcost) * parseFloat(qty);
                                    if (Tax == 1) {
                                        totalc = parseFloat(to_tal).toFixed(2);
                                        //tot_wtax=( to_tal*parseFloat(vatTax/100))+to_tal;
                                        tot_wtax = parseFloat(to_tal).toFixed(2);
                                        spvat = (parseFloat(pcost) * parseFloat(vatTax / 100));
                                        spvates = parseFloat(spvat).toFixed(2);
                                        povat = (to_tal * parseFloat(vatTax / 100));
                                        vat_total = parseFloat(povat).toFixed(2);
                                    } else if (Tax == 0) {
                                        totalc = parseFloat(to_tal).toFixed(2);
                                        tot_wtax = (to_tal * parseFloat(vatTax / 100)) + to_tal;
                                        sptax = (parseFloat(pcost) * parseFloat(vatTax / 100));
                                        sptaxes = parseFloat(sptax).toFixed(2);
                                        prtax = (to_tal * parseFloat(vatTax / 100));
                                        tax_tot = parseFloat(prtax).toFixed(2);
                                    }
                                    var sduom = uomlist['Each'];
                                    var skuwaist    =   ((sval.waist) && (sval.waist != '' )) ? parseInt(sval.waist) : null ;
                                    var skulength   =   ((sval.length) && (sval.length !=   '' ) )? parseInt(sval.length) : null ;
                                    var skusize =   ((sval.size)    &&  (sval.size  !=  '')) ? (sval.size) : '' ;
                                    $scope.listPROD.push({
                                        id:'',
                                        lineNumber:'',
                                        sku:sval.sku,
                                        productCode:sval.sku,
                                        name: sval.name,
                                        description: sval.description,
                                        vendorName: $scope.po_add.vendorName,
                                        cost: pcost,
                                        productVat: spvates,
                                        totalProductVat: vat_total,
                                        productTax: sptaxes,
                                        totalProductTax: tax_tot,
                                        qty: qty,
                                        totalnotax: totalc,
                                        total: tot_wtax,
                                        taxisVAT: Tax,
                                        percentage: vTax,
                                        selectedUOM: sduom,
                                        style:sval.productCode,
                                        styleDescription:sval.styleDescription,
                                        variants:sval.variants,
                                        styleColor:sval.color,
                                        // waist:skuwaist,
                                        // length:skulength,
                                        // size:skusize
                                    });
                                    $timeout(function() {
                                        $scope.fillTableElements($scope.listPROD);
                                        //$scope.$broadcast("myEvent", {username: $scope.listPROD });
                                    }, 500);
                                    $scope.prod_result = "";
                                    // $scope.po_add.prodresult = '';
                                    $scope.list = $scope.listPROD;
                                    
                                    angular.forEach($scope.listPROD, function(lval, lindex) {
                                       
                                        if (lval.productCode == sval.sku) {
                                            if (lval.taxisVAT == 1) {
                                                $scope.calcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.vat_total,sval.productCode);
                                            } else if (lval.taxisVAT == 0) {
                                                $scope.calcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.tax_tot,sval.productCode);
                                            }
                                            //$scope.calcItems(lindex,lval.qty,lval.cost,lval.total,lval.totalnotax);
                                        }
                                    });
                                }
                            }); 
                        });
                    }
                }
            });
            
            //var abc='';
            if (($scope.vendorhide == true)) {
                $scope.po_add = {
                    orderstore: $scope.po_add.orderstore,
                    prodresult: '',
                    pordercode: $scope.po_add.pordercode,
                    shiptostore:$scope.po_add.shiptostore,
                    markforstore:$scope.po_add.markforstore,
                    //afsstore:$scope.po_add.afsstore
                };
            } else {
                $scope.po_add = {
                    vendorName: $scope.po_add.vendorName,
                    prodresult: '',
                    pordercode: $scope.po_add.pordercode,
                    shiptostore:$scope.po_add.shiptostore,
                    markforstore:$scope.po_add.markforstore,
                    //afsstore:$scope.po_add.afsstore
                };
            }
            
            $timeout(function() {
                $scope.fillTableElements($scope.listPROD);
            }, 500);
        } else {
            return false;
        }
         $scope.po_add.prodresult = '';
         $scope.addedproducts   =   [];
        
    }
        
    $scope.order_style=function(po_add){
            var seltstyle = po_add.prodresult;
            var sku = $scope.po_add.pordercode;
           if (($scope.vendorhide == true)) {
               var loc = $scope.po_add.orderstore;
                //var stostore = $scope.shippingstr;
                var stostore = $scope.po_add.shiptostore;
            } else {
                var loc = ($scope.po_add.markforstore != undefined && $scope.po_add.markforstore != '') ? $scope.po_add.markforstore : $scope.po_add.shiptostore;
            }
            $scope.showstyle=true;
            $scope.styleitems={locationId: loc,  result:'',styleresult:seltstyle,mode:"edit"};
            angular.element(document.getElementById('lkpmatrix'))
                .html($compile('<style-matrix></style-matrix>')($scope));
            
             //$scope.po_add.styleresult = ''; prodresult
             $scope.po_add.prodresult = '';
    }
    
    $scope.getmodifiedsku=function(styleskus,upload){
        $scope.changedSkus  =   styleskus;
        var skulength       =   styleskus.length;
        var stostore        =   $scope.po_add.orderstore;
        var newskus         =   skulength ? $scope.changedSkus : Object.keys($scope.changedSkus);
        var selectedskus=   newskus.join(',');
        var url         =   $scope.vendorhide ? 'apis/ang_loc_skuproducts' : 'apis/ang_getvendorproducts';
        var dataSet     =   $scope.vendorhide ? {data:{srch:selectedskus,locid:stostore, isRules: true}} : {data:{sku:selectedskus,config:locConfig}};
        if(!upload)
            $scope.prod_detail = {};

        ovcDash.post(url,dataSet).then(function (data) {
            if(data && data.status != 'error'){
                var skuArr = [];
                angular.forEach(data , function(val, key){
                    if(val.ProductTbl && val.ProductTbl.sku){
                        $scope.prod_detail[val.ProductTbl.sku] = val.ProductTbl;
                        skuArr.push(val.ProductTbl.sku);
                    }
                    if($scope.withPagination){
                        if(newskus.indexOf(val.ProductTbl.barCode) >= 0){
                            newskus.splice(newskus.indexOf(val.ProductTbl.barCode), 1);
                        }
                        if(newskus.indexOf(val.ProductTbl.sku) >= 0){
                            newskus.splice(newskus.indexOf(val.ProductTbl.sku), 1);
                        }
                    }
                });
                if($scope.withPagination){
                    skuGroupAssign(selectedskus , 'fileUpload', skuArr)
                    var output = {
                        "status": "error",
                        "message": newskus.join(',') + "</br> Not available for this Location"
                    };
                    Data.toast(output);
                }
                else if($state.current.name      ==  'ovc.transfer-add'){
                    var storeSkuData = {};
                    storeSkuData.toStore = $scope.po_add.shiptostore;
                    storeSkuData.fromStore = $scope.po_add.orderstore;
                    storeSkuData.skus = newskus;
                    StyleGroupService.getInvData(storeSkuData).then(function(){
                        $scope.addnewskus(selectedskus,upload);
                    });
                }
                else{
                    $scope.addnewskus(selectedskus,upload);
                }
            }else{
                var output = {"status": "error", "message": "SKU's not available for this store."};
                Data.toast(output);
                if($scope.withPagination)
                chunkDataCall('upload')
            }
        });                    
    }     

    function ChunkFunction(newskus){
        $scope.prod_detail = {};
        $scope.uploadSkus  = newskus;
        var chunkObj = Object.keys(newskus);
        var chunk = function(arr, len) {
            var arrays = [], size = len;

            while (arr.length > 0)
                arrays.push(arr.splice(0, size));

            return arrays;
        }
        var chunkeddata = chunk(chunkObj, 100);
        $scope.ChunkedData  =   chunkeddata;
        uploadCount  = 0;
        if($scope.withPagination){
            $scope.getmodifiedsku(chunkeddata[0],'chunk');
        }else{
            angular.forEach(chunkeddata, function(chunkitem){
                $scope.getmodifiedsku(chunkitem,'chunk');
            });
        }
    }
    $scope.addnewskus   =   function(newskus,upload){
        var rejectedSkus=   [];
        var stostore    = $scope.po_add.markforstore ? $scope.po_add.markforstore : $scope.po_add.shiptostore;
        $scope.currency =   currencylabel[currencylist[$scope.po_add.shiptostore]];
        var priceService = Utils.POCalculation(newskus , upload, stostore , $scope.prod_detail , $scope.changedSkus , $scope.uploadSkus, addedskus);
        priceService.then(function(skus){
            var ordesku= [];
            skus.forEach(function(sku) {
                ordesku.push(sku.sku);
            });
            getskuRules(ordesku).then(function () {
            angular.forEach(skus,function(resultantsku){
                var cost = resultantsku.Cost;
                var Tax = resultantsku.isVAT;
                var vTax = resultantsku.percentage;
                var qtyvalue=resultantsku.quantity;
                var totalc = 0;
                var povat = vat_total = 0;
                var newprod = false;
                var prtax = tax_tot = sptax = spvat = sptaxes = spvates = tot_wtax = 0;
                var newstyle=resultantsku.sku.toString();
                    angular.forEach($scope.listPROD, function(lval, lindex) {
                        if (lval.productCode == resultantsku.sku) {
                            var qty = (lval.qty) + qtyvalue;
                            newprod = true;
                            $scope.listPROD[lindex].qty = qty;
                            var pcost = parseFloat(cost).toFixed(2);
                            var to_tal = parseFloat(pcost) * parseFloat(qty);
                            var vatTax = vTax;
                            var vnTax = Tax;
                            if (Tax == 0) {
                                prtax = (to_tal * parseFloat(vatTax / 100));
                                tax_tot = parseFloat(prtax).toFixed(2);
                                sptax = (parseFloat(pcost) * parseFloat(vatTax / 100));
                                sptaxes = parseFloat(sptax).toFixed(2);
                                tot_wtax = (to_tal * parseFloat(vatTax / 100)) + to_tal;
                                totalc = parseFloat(to_tal).toFixed(2);
                                $scope.listPROD[lindex].total = tot_wtax;
                                $scope.listPROD[lindex].totalnotax = totalc;
                                $scope.listPROD[lindex].totalProductTax = tax_tot;
                                $scope.calcItems(lindex, qty, pcost, totalc, tot_wtax, tax_tot, lval.style, upload);
                            } else if (Tax == 1) {
                                
                                tot_wtax = parseFloat(to_tal).toFixed(2);
                                povat = (to_tal * parseFloat(vatTax / 100));
                                vat_total = parseFloat(povat).toFixed(2);
                                spvat = (parseFloat(pcost) * parseFloat(vatTax / 100));
                                spvates = parseFloat(spvat).toFixed(2);
                                //totalc =to_tal;
                                totalc = parseFloat(to_tal).toFixed(2);
                                
                                $scope.listPROD[lindex].total = tot_wtax;
                                $scope.listPROD[lindex].totalnotax = totalc;
                                $scope.listPROD[lindex].totalProductVat = vat_total;
                                $scope.calcItems(lindex, qty, pcost, totalc, tot_wtax, vat_total,lval.style, upload);
                            }
                        }
                    });
                    if (!newprod) {
                        var qty = qtyvalue;
                        var pcost = parseFloat(cost).toFixed(2);
                        var vatTax = vTax;
                        var vnTax = Tax;
                        var to_tal = parseFloat(pcost) * parseFloat(qty);
                        if (Tax == 0) {
                            totalc = parseFloat(to_tal).toFixed(2);
                            tot_wtax = (to_tal * parseFloat(vatTax / 100)) + to_tal;
                            sptax = (parseFloat(pcost) * parseFloat(vatTax / 100));
                            sptaxes = parseFloat(sptax).toFixed(2);
                            prtax = (to_tal * parseFloat(vatTax / 100));
                            tax_tot = parseFloat(prtax).toFixed(2);
                        } else if (Tax == 1) {
                            totalc = parseFloat(to_tal).toFixed(2);
                            //tot_wtax=( to_tal*parseFloat(vatTax/100))+to_tal;
                            tot_wtax = parseFloat(to_tal).toFixed(2);
                            spvat = (parseFloat(pcost) * parseFloat(vatTax / 100));
                            spvates = parseFloat(spvat).toFixed(2);
                            povat = (to_tal * parseFloat(vatTax / 100));
                            vat_total = parseFloat(povat).toFixed(2);
                        }
                        var sduom = uomlist['Each'];
                        var skuwaist    =   ((resultantsku.waist) && (resultantsku.waist != '' )) ? parseInt(resultantsku.waist) : null ;
                        var skulength   =   ((resultantsku.length) && (resultantsku.length !=   '' ) )? parseInt(resultantsku.length) : null ;
                        var skusize =   ((resultantsku.size)    &&  (resultantsku.size  !=  '')) ? (resultantsku.size) : '' ;
                        $scope.listPROD.push({
                            id:'',
                            lineNumber : '',
                            productCode: resultantsku.sku,
                            sku:resultantsku.sku,
                            //.productCode: newstyle,
                            name: resultantsku.name,
                            description: resultantsku.description,
                            vendorName: $scope.po_add.vendorName,
                            cost: pcost,
                            productVat: spvates,
                            totalProductVat: vat_total,
                            productTax: sptaxes,
                            totalProductTax: tax_tot,
                            qty: qty,
                            orderType:$scope.po_add.pordercode,
                            fromStore:$scope.po_add.orderstore,
                            toStore:$scope.po_add.shiptostore,
                            totalnotax: totalc,
                            total: tot_wtax,
                            taxisVAT: Tax,
                            percentage: vTax,
                            selectedUOM: sduom,
                            style:resultantsku.productCode,
                            styleDescription:resultantsku.styleDescription,
                            variants:resultantsku.variants,
                            styleColor:resultantsku.color,
                            // waist:skuwaist,
                            // length:skulength,
                            // size:skusize
                        });
                        
                        $timeout(function() {
                            $scope.fillTableElements($scope.listPROD);
                        }, 500);
                        $scope.list = $scope.listPROD;
                        angular.forEach($scope.listPROD, function(lval, lindex) {
                            if (lval.productCode == resultantsku.sku) {
                                if (lval.taxisVAT == 1) {
                                    
                                    $scope.calcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.totalProductVat, lval.style, upload);
                                } else if (lval.taxisVAT == 0) {
                                    
                                    $scope.calcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.totalProductTax,lval.style, upload );
                                }
                            }
                        });
                    }
                    $timeout(function() {
                        $scope.fillTableElements($scope.listPROD);
                        //$scope.changedSkus=[];
                    }, 500);
                    if($scope.listPROD.length > 0){
                        $scope.tab.error['prodresult']  =   false;
                    }
                    //}
            });
            price_detail=[];
            addedskus=[];
            if(!upload){
                $scope.prod_detail = {};
            }
            $scope.changedSkus=[];
            });
        }, function(error){
            console.log(error, 'ERROR');

        });
    }
    

    $scope.dostyleselect = function(suggestion){
        $scope.showstyle=true;
    }
    $scope.fillTableElements = function(data) {
            $scope.errormsgshow     =   false;
            count                   =   1;
            $scope.addedproducts    =   [];
            $scope.loadval = 0;
            $scope.list = data;
            $scope.currentPages = 1; //current page
            $scope.entryLimits = 10; //max no of items to display in a page
            $scope.filteredItems = $scope.list.length; //Initially for no filter  
        }
        /* delete tr from table after adding products */
    $scope.removeRow = function(idx, qty, total, total_notax, prodtax, prodvat) {
        var pqty = ptotal = alltotal = alltax = allvat = 0;
        if (idx != -1) {
            $scope.list.splice(idx, 1);
            if ((qty != undefined) && (qty != '')) {
                pqty = qty;
            }
            if ((total != undefined) && (total != '')) {
                ptotal = total;
            }
            if ((total_notax != undefined) && (total_notax != '')) {
                alltotal = total_notax;
            }
            if ((prodtax != undefined) && (prodtax != '')) {
                alltax = prodtax;
            }
            if ((prodvat != undefined) && (prodvat != '')) {
                allvat = prodvat;
            }
            $scope.allitems = parseInt($scope.allitems) - parseInt(pqty);
            var allsubtot = parseFloat($scope.allsubtotal) - parseFloat(alltotal);
            $scope.allsubtotal = parseFloat(allsubtot).toFixed(2);
            var alltaxes = parseFloat($scope.allsubtaxes) - parseFloat(alltax);
            $scope.allsubtaxes = parseFloat(alltaxes).toFixed(2);
            var allvates = parseFloat($scope.allsubvates) - parseFloat(allvat);
            $scope.allsubvates = parseFloat(allvates).toFixed(2);
            var alltotal = parseFloat($scope.allsubtotal) + parseFloat($scope.allsubtaxes);
            $scope.overtotal = parseFloat(alltotal).toFixed(2);
        }
    };
    $scope.newprods = $scope.listPROD;
    $scope.getstore_details = function(shipstore,type) {
        $scope.tab.error['shiptostore']   =   false;
        $timeout(function(){
            angular.element('.prod_result').focus();
        },500);

        var storesel = shipstore;
        if(type == 'shiptostore'){
            $scope.shippingstr = shipstore;
        }
       // 
        var allstores = $scope.store_datas;

            angular.forEach(allstores, function(item) {
                if (item.id == shipstore && type == 'shiptostore' ) {
                   $scope.shippingstr1 = item.displayName;
                    if($scope.billtab== false){
                        $scope.O_add.billtostore=shipstore;
                        $scope.billstore1= item.displayName;
                        
                    }
                }
                if (item.id == shipstore && type == 'markforstore' ) {
                    $scope.markforstr = item.displayName;
                   
                    if($scope.billtab== false){
                        $scope.O_add.markforloc=shipstore;
                        $scope.markforloc= item.displayName;
                        
                    }
                }
            });

        var allAfsstores = $scope.orderAfs;
        if(allAfsstores && allAfsstores.hierarchy && type == 'shiptostore'){
            var parentId    =   '';
            angular.forEach(allAfsstores.hierarchy, function(item) {
                if(item.id == shipstore) {
                   $scope.parentId = item.parent;
                }
            });
            var listafs = [];
            angular.forEach(allAfsstores.hierarchy, function(value) {
                if (value.id == $scope.parentId) {
                    var newafsobj = {
                        AfsName: value.name,
                        AfsId: value.id
                    }
                    listafs.push(newafsobj);
                }
            });
            $scope.afsDatas = listafs;
            if($scope.afsDatas)
                if($scope.afsDatas[0])
            $scope.O_add.billtostore = $scope.afsDatas[0].AfsId ? $scope.afsDatas[0].AfsId : '';
        }

        if(type == 'shiptostore' ){        
        if(shipstore){
            
            ovcDash.get('apis/ang_loc_details?locid=' + encodeURIComponent(storesel)).then(function(results) {
                if(results.status != "error"){
                    var data = results[0];
                    document.getElementById("shipcountry").value = data.country;
                    document.getElementById("street_name").value = data.streetName;
                    document.getElementById("street_number").value = data.streetNumber;
                    document.getElementById("shipcity").value = data.town;
                    document.getElementById("shipzipcode").value = data.postalCode;
                    document.getElementById("shipphone").value = data.phoneNumber;
                }else{
                    console.log('Location Details Failed')
                } 
            });
           Utils.storeConfig(storesel).then(function  (data) {
                if(data){
                    $scope.storeConfig=data;
                }else {
                    $scope.storeConfig= {};
                }
           });
        }else{
                if($scope.billtab== false){
                        $scope.O_add.billtostore='';
                        $scope.billstore1='';
                }
                    $scope.shippingstr1 ='';
                document.getElementById("shipcountry").value = '';
                document.getElementById("street_name").value = '';
                document.getElementById("street_number").value = '';
                document.getElementById("shipcity").value = '';
                document.getElementById("shipzipcode").value = '';
                document.getElementById("shipphone").value = '';
                $scope.fromstore_datas = [];
        }
               
             // $scope.po_add.orderstore='';
             // $scope.fromstr='';
            if($scope.config.organization_name == $scope.organization_struct['2'] && $state.current.name == 'ovc.transfer-add'){
                ovcDash.get('apis/ang_getfromstore?locid=' + encodeURIComponent(storesel)).then(function(results) {
                            
                        if((results.status !='error') && (results != undefined) ){
                            $scope.fromstore_datas =results;
                            if((results.length == 1) && ($state.current.name == 'ovc.transfer-add')){
                                $scope.po_add.orderstore =  results[0].id;
                                $scope.getselected_store($scope.po_add.orderstore);
                            }
                        }else{
                            $scope.fromstore_datas = [];
                        }
                });
            }if($scope.config.organization_name == $scope.organization_struct['1'] && $state.current.name == 'ovc.transfer-add'){
                var allLocations = angular.copy($scope.CorparateLocationData);

                allLocations = allLocations.filter(
                 function(value){
                    return value.id !== storesel;
               });
               $scope.CorparateLocation = allLocations;
               $scope.getselected_store($scope.po_add.orderstore);
            }
        }
    }  

    $scope.getbill_stores = function(billstr) {
        $scope.billstore = billstr;
        var allstores = $scope.store_datas;
        if(billstr!=null && billstr!="" && billstr!=undefined){
            angular.forEach(allstores, function(item) {
                if (item.id == billstr) {
                    $scope.billstore1 = item.displayName;
                }
            });
        }else{
                    $scope.billstore1 ='';
        }
    }
    $scope.getship_method = function(shipmtd) {
        var shipmths = $scope.smethods;
        if ((shipmtd != null)&& (shipmtd!="") && (shipmtd!=undefined)) {
            angular.forEach(shipmths, function(item) {
                if (item.Name == shipmtd) {
                    $scope.spmethod = item.description;
                }
            });
        }else{
             $scope.spmethod = '';
        }
    }
    
    $scope.calcItems = function(pindex, qty, cost, ptotal, ptaxtot, vattax, style, upload) {
    
        $scope.skuslist=StyleGroupService.getstylegroup($scope.list, upload);
        var noitems2 = 0;
        var subtotal2 = 0;
        var ovtotal2 = 0;
        var iqty2 = itotal2 = iototal2 = 0;
        var itax2 = ivat2 = 0;
        var noskus2 = 0;
        var taxvat2 = alltax2 = 0;
        
        if($state.current.name == 'ovc.transfer-add'){
            // $scope.action.inoutbound   =   $scope.skuslist[style]['styleats']['stlinOutBound'];
            $scope.action.inoutFrom    =   $scope.skuslist[style]['styleats']['stlinOutBoundFrom'];
            $scope.action.inoutTo      =   $scope.skuslist[style]['styleats']['stlinOutBoundTo'];
        }

        angular.forEach($scope.skuslist[style]['skus'], function(item) {
            if ((item.qty != undefined) && (item.qty != '')) {
                iqty2 = item.qty;
            } else {
                iqty2 = 0;
            }
            if ((item.total != undefined) && (item.total != '')) {
                //itotal=item.total;
                iototal2 = item.total;
            }
            if ((item.totalProductTax != undefined) && (item.totalProductTax != '')) {
                itax2 = item.totalProductTax;
            }
            if ((item.totalProductVat != undefined) && (item.totalProductVat != '')) {
                ivat2 = item.totalProductVat;
            }
            if ((item.totalnotax != undefined) && (item.totalnotax != '')) {
                itotal2 = item.totalnotax;
            }
            noitems2 = parseInt(noitems2) + parseInt(iqty2);
            subtotal2 = parseFloat(subtotal2) + parseFloat(itotal2);
            taxvat2 = parseFloat(taxvat2) + parseFloat(ivat2);
            alltax2 = parseFloat(alltax2) + parseFloat(itax2);
            ovtotal2 = parseFloat(ovtotal2) + parseFloat(iototal2); 
        });
        $scope.skuslist[style].qty=noitems2;
        $scope.skuslist[style].total=ovtotal2;
        $scope.skuslist[style].subtotal=subtotal2;
        $scope.skuslist[style].vat=taxvat2;
        $scope.skuslist[style].tax=alltax2;
        var noitems = taxvat = alltax = 0;
        var subtotal = 0;
        var ovtotal = 0;
        var iqty = itotal = iototal = 0;
        var itax = ivat = 0;
        var noskus = 0;
        var noskus = 0;
        angular.forEach($scope.skuslist, function(pritem, key) {
                var stylenoitems = styletaxvat = stylealltax = 0;
                var stylesubtotal = 0;
                var styleovtotal = 0;
                var styleiqty = styleitotal = styleiototal = 0;
                var styleitax = styleivat = 0;
                noskus = noskus + pritem.skus.length;
                angular.forEach(pritem.skus, function(item) {
                    if ((item.qty != undefined) && (item.qty != '')) {
                        iqty = item.qty;
                    } else {
                        iqty = 0;
                    }
                    if ((item.total != undefined) && (item.total != '')) {
                        //itotal=item.total;
                        iototal = item.total;
                    }
                    if ((item.totalProductTax != undefined) && (item.totalProductTax != '')) {
                        itax = item.totalProductTax;
                    }
                    if ((item.totalProductVat != undefined) && (item.totalProductVat != '')) {
                        ivat = item.totalProductVat;
                    }
                    if ((item.totalnotax != undefined) && (item.totalnotax != '')) {
                        itotal = item.totalnotax;
                    }
                    noitems = parseInt(noitems) + parseInt(iqty);
                    subtotal = parseFloat(subtotal) + parseFloat(itotal);
                    taxvat = parseFloat(taxvat) + parseFloat(ivat);
                    alltax = parseFloat(alltax) + parseFloat(itax);
                    ovtotal = parseFloat(ovtotal) + parseFloat(iototal);
                    stylenoitems = parseInt(stylenoitems) + parseInt(iqty);
                    stylesubtotal = parseFloat(stylesubtotal) + parseFloat(itotal);
                    styletaxvat = parseFloat(styletaxvat) + parseFloat(ivat);
                    stylealltax = parseFloat(stylealltax) + parseFloat(itax);
                    styleovtotal = parseFloat(styleovtotal) + parseFloat(iototal);
                });
                pritem.qty = parseInt(stylenoitems);
                pritem.total = parseFloat(styleovtotal).toFixed(2);
                pritem.subtotal = parseFloat(stylesubtotal).toFixed(2);
                pritem.vat =parseFloat(styletaxvat).toFixed(2);
                pritem.tax =parseFloat(stylealltax).toFixed(2);
        });
        
        $scope.allitems = parseFloat(noitems);
        var subtotals3 = parseFloat(subtotal) ;
        $scope.allsubtotal = parseFloat(subtotals3).toFixed(2);
        $scope.allsubtaxes = parseFloat(alltax).toFixed(2);
        $scope.allsubvates = parseFloat(taxvat).toFixed(2);
        var alltotal = parseFloat($scope.allsubtotal) + parseFloat($scope.allsubtaxes);
        $scope.overtotal = parseFloat(alltotal).toFixed(2);
    }
    
    $scope.deleteskus=function(id){
         var pqty = ptotal = alltotal = alltax = allvat = 0;
         var style=this.sku.style;
         var idx=this.$index;
        if (idx != -1) {
           if( this.sku.id != '' ) {
                var orditem_id= this.sku.id;
                $.confirm({
                    title:deletesku_header,
                    content: 'Confirm delete?',
                    confirmButtonClass: 'btn-primary',
                    cancelButtonClass: 'btn-primary',
                    confirmButton: 'Ok',
                    cancelButton: 'Cancel',
                    confirm: function() {
                        var orderNo     =   $scope.POform.orderNumber || '';
                        var paginationData = $scope.withPagination ? '?purchaseordernumber=' + orderNo +'&page_offset='+ $scope.POform.offset + '&page_lmt='+$scope.POform.entryLimit : "";

                        Data.delete('/orderitem/' + orditem_id + paginationData).then(function(data) {
                            var output = {
                                "status": "success",
                                "message": "Product  Deleted Successfully"
                            };
                            Data.toast(output);
                            if($scope.withPagination){
                                SKUListUpdate(data);
                            }else{
                                var whatIndex = null;
                                angular.forEach($scope.list, function(item, index) {
                                    if (item.id === orditem_id) {
                                        whatIndex = index;
                                    }
                                });
                                $scope.list.splice(whatIndex, 1);
                                $scope.skuslist[style]['skus'].splice(idx, 1);
                                $scope.confirmdelete(id,style);
                            }
                        });             
                    },
                    cancel: function() {
                        return false;
                    }
                });
                
            }else{
                $scope.skuslist[style]['skus'].splice(idx, 1);
                $scope.confirmdelete(id,style);
            }
        }
    }
    
    $scope.confirmdelete=function(id,style){
        var pqty = ptotal = alltotal = alltax = allvat = 0;
        var noitems2 = 0;
        var subtotal2 = 0;
        var ovtotal2 = 0;
        var iqty2 = itotal2 = iototal2 = 0;
        var itax2 = ivat2 = 0;
        var noskus2 = 0;
        var taxvat2 = alltax2 = 0;
        angular.forEach($scope.skuslist[style]['skus'], function(item) {
            if ((item.qty != undefined) && (item.qty != '')) {
                iqty2 = item.qty;
            } else {
                iqty2 = 0;
            }
            if ((item.total != undefined) && (item.total != '')) {
                //itotal=item.total;
                iototal2 = item.total;
            }
            if ((item.totalProductTax != undefined) && (item.totalProductTax != '')) {
                itax2 = item.totalProductTax;
            }
            if ((item.totalProductVat != undefined) && (item.totalProductVat != '')) {
                ivat2 = item.totalProductVat;
            }
            if ((item.totalnotax != undefined) && (item.totalnotax != '')) {
                itotal2 = item.totalnotax;
            }
            noitems2 = parseInt(noitems2) + parseInt(iqty2);
            subtotal2 = parseFloat(subtotal2) + parseFloat(itotal2);
            taxvat2 = parseFloat(taxvat2) + parseFloat(ivat2);
            alltax2 = parseFloat(alltax2) + parseFloat(itax2);
            ovtotal2 = parseFloat(ovtotal2) + parseFloat(iototal2); 
        });
        $scope.skuslist[style].qty=noitems2;
        $scope.skuslist[style].total=ovtotal2;
        $scope.skuslist[style].subtotal=subtotal2;
        $scope.skuslist[style].vat=taxvat2;
        $scope.skuslist[style].tax=alltax2;
        
        $scope.getcalcs();
    }
    
    $scope.getcalcs=function(){
        var noitems = taxvat = alltax = 0;
        var subtotal = 0;
        var ovtotal = 0;
        var iqty = itotal = iototal = 0;
        var itax = ivat = 0;
        var noskus = 0;
        var newlist =   [];
        angular.forEach($scope.skuslist, function(pritem, key) {
            var stylenoitems = styletaxvat = stylealltax = 0;
            var stylesubtotal = 0;
            var styleovtotal = 0;
            var styleiqty = styleitotal = styleiototal = 0;
            var styleitax = styleivat = 0;
            noskus = noskus + pritem.skus.length;
            angular.forEach(pritem.skus, function(item) {
                newlist.push(item);
                if ((item.qty != undefined) && (item.qty != '')) {
                    iqty = item.qty;
                } else {
                    iqty = 0;
                }
                if ((item.total != undefined) && (item.total != '')) {
                    //itotal=item.total;
                    iototal = item.total;
                }
                if ((item.totalProductTax != undefined) && (item.totalProductTax != '')) {
                    itax = item.totalProductTax;
                }
                if ((item.totalProductVat != undefined) && (item.totalProductVat != '')) {
                    ivat = item.totalProductVat;
                }
                if ((item.totalnotax != undefined) && (item.totalnotax != '')) {
                    itotal = item.totalnotax;
                }
                noitems = parseInt(noitems) + parseInt(iqty);
                subtotal = parseFloat(subtotal) + parseFloat(itotal);
                taxvat = parseFloat(taxvat) + parseFloat(ivat);
                alltax = parseFloat(alltax) + parseFloat(itax);
                ovtotal = parseFloat(ovtotal) + parseFloat(iototal);
                stylenoitems = parseInt(stylenoitems) + parseInt(iqty);
                stylesubtotal = parseFloat(stylesubtotal) + parseFloat(itotal);
                styletaxvat = parseFloat(styletaxvat) + parseFloat(ivat);
                stylealltax = parseFloat(stylealltax) + parseFloat(itax);
                //styleovtotal = parseFloat(styleovtotal) + parseFloat(iototal);
                styleovtotal = parseFloat(stylesubtotal) + parseFloat(stylealltax);
            });
            pritem.qty = parseInt(stylenoitems);
            pritem.total = parseFloat(styleovtotal).toFixed(2);
            pritem.subtotal = parseFloat(stylesubtotal).toFixed(2);
            pritem.vat =parseFloat(styletaxvat).toFixed(2);
            pritem.tax =parseFloat(stylealltax).toFixed(2);
        });
        
        $scope.allitems = parseInt(noitems);
        var subtotals3 = parseFloat(subtotal) ;
        $scope.allsubtotal = parseFloat(subtotals3).toFixed(2);
        $scope.allsubtaxes = parseFloat(alltax).toFixed(2);
        $scope.allsubvates = parseFloat(taxvat).toFixed(2);
        var alltotal = parseFloat($scope.allsubtotal) + parseFloat($scope.allsubtaxes);
        $scope.overtotal = parseFloat(alltotal).toFixed(2);
        $scope.list =   newlist;
        $scope.listPROD =   newlist;
    
    }
    
    $scope.removeStyleGroup=function(idx){
        if (idx != -1) {
            angular.forEach($scope.skuslist[idx]['skus'], function(item) {
                if(item.id !=''){
                    var orditem_id=item.id;
                    Data.delete('/orderitem/' + orditem_id).then(function(data) {
                    });
                }
            });
            delete  $scope.skuslist[idx];
            $scope.getcalcs();
        } 
    }
    $scope.calcItems1 = function(pindex, qty, cost, ptotal, prcode, style) {
        var stylecode=style;
        var nindex = pindex;
        var quantity = qty;
        var eachcost = cost;
        //var total_cost=(quantity *eachcost);
       var to_tal = parseFloat(quantity * eachcost).toFixed(2);
        var loc = $scope.shippingstr;
        var prtax1 = tax_tot1 = sptax1 = spvat1 = sptaxes1 = spvates1 = tot_wtax1 = totalitax= 0;
        ovcDash.get('apis/ang_getproductprice?sku=' + prcode + '&loc=' + encodeURIComponent(loc)).then(function(result) {
            $scope.product_price = result[0];
            var cost = result[0].ProductPrice.Cost;
            var Tax1 = result[0].ProductPrice.isVAT;
            var vTax1 = result[0].ProductPrice.percentage;
            var pcost = parseFloat(cost).toFixed(2);
            var totalc1 = 0;
            var povat1 = vat_total1 = tot_vat1 = 0;
            var vatTax1 = vTax1;
            var vnTax1 = Tax1;
          $scope.skuslist[style]['skus'][nindex].taxisVAT = Tax1;
            if (Tax1 == 0) {
                prtax1 = (to_tal * parseFloat(vatTax1 / 100));
                tax_tot1 = parseFloat((prtax1).toFixed(2));
                sptax1 = (parseFloat(pcost) * parseFloat(vatTax1 / 100));
                sptaxes1 = parseFloat(sptax1).toFixed(2);
                totalitax = (parseFloat(tax_tot1)+parseFloat(to_tal));
                tot_wtax1 = parseFloat(totalitax).toFixed(2);
                totalc1 = parseFloat(to_tal).toFixed(2);
                $scope.skuslist[style]['skus'][nindex].total = tot_wtax1;
                $scope.skuslist[style]['skus'][nindex].totalnotax = totalc1;
                $scope.skuslist[style]['skus'][nindex].totalProductTax = tax_tot1;
                $scope.calcItems(nindex, qty, pcost, totalc1, tot_wtax1, tax_tot1, stylecode);
            } else if (Tax1 == 1) {
                tot_wtax1 = parseFloat(to_tal).toFixed(2);
                povat1 = (to_tal * parseFloat(vatTax1 / 100));
                vat_total1 = parseFloat(povat1).toFixed(2);
                spvat1 = (parseFloat(pcost) * parseFloat(vatTax1 / 100));
                spvates1 = parseFloat(spvat1).toFixed(2);
                //totalc =to_tal;
                totalc1 = parseFloat(to_tal).toFixed(2);
                $scope.skuslist[style]['skus'][nindex].total = tot_wtax1;
                $scope.skuslist[style]['skus'][nindex].totalnotax = totalc1;
                $scope.skuslist[style]['skus'][nindex].totalProductVat = vat_total1; 
                $scope.calcItems(nindex, qty, pcost, totalc1, tot_wtax1, tax_tot1, stylecode);
            }
        }); 
    }
   
    $scope.GetSelectedCountry2 = function() {
        $scope.strCountry = document.getElementById("country").value;
    }
   
    $scope.order_adsub = function(po_add, oadd, status , valStatus) {
        if ($scope.validation(po_add , 0, 0 , valStatus,status)) {
            $scope.disabled++;

            $scope.errorShow = false;
            var list1 = list2 = 0;
            if ($scope.list != undefined) {
                var list1 = $scope.list.length;
            }
            var totalskus       = list1;
            // $scope.shipcout     = document.getElementById("shipcountry").value;  /*oadd.shipping_country*/
            // $scope.shipstname   = document.getElementById("street_name").value;  /*oadd.street_name*/
            // $scope.shipstnumber = document.getElementById("street_number").value; /*oadd.street_number*/
            // $scope.shipcity     = document.getElementById("shipcity").value;        /*oadd.shipping_city*/
            // $scope.shipzip      = document.getElementById("shipzipcode").value;     /*oadd.shipping_zipcode*/
            // $scope.shipphone    = document.getElementById("shipphone").value;      //oadd.shipping_phone

            var shiptostore     = '';
            var purordertype    = po_add.pordercode ? po_add.pordercode : "";
            var vendname        = po_add.vendorName ? po_add.vendorName : "";
            var fromlocn        = po_add.orderstore ? po_add.orderstore : "";

            var newobj = {
                shippingMethod: oadd ? oadd.shipmethod : "",
                purchaseOrderType: purordertype,
                FromLocation: fromlocn,
                FromAddress: $scope.shipadd,
                shipToLocation: po_add.shiptostore,
                markForLocation: po_add.markforstore,
                shipToAddress: oadd ? oadd.address : "",
                numberOfProducts: $scope.allitems ? $scope.allitems : 0,
                totalPoCost: $scope.overtotal ? $scope.overtotal : 0,
                totalPoVAT: $scope.allsubvates ? $scope.allsubvates: 0,
                totalPoTax: $scope.allsubtaxes ? $scope.allsubtaxes: 0,
                PoSubtotal: $scope.allsubtotal ? $scope.allsubtotal: 0,
                specialInstructions: oadd ? oadd.shipping_special : "",
                location: po_add.shiptostore,
                vendorId: vendname,
                userId: user_id,
                contactName: oadd ? oadd.shipping_contact : "",
                toStreetName: oadd.street_name ? oadd.street_name : "",
                toStreetNumber: oadd.street_number ? oadd.street_number : "",
                toCity: oadd.shipping_city ? oadd.shipping_city : "",
                toPostalCode: oadd.shipping_zipcode ? oadd.shipping_zipcode : "",
                toCountry: oadd.shipping_country ? oadd.shipping_country : "",
                toPhoneNumber: oadd.shipping_phone ? oadd.shipping_phone : "",
                orderStatus: status ? 'draft' : 'submitted',
                vendorName: $scope.selvendor
            }
            if((status || valStatus) && $scope.withPagination)
                newobj.createTran   =   true;

            if($scope.withPagination){
                newobj.purchaseOrderNumber  =   $scope.POform.orderNumber || "";
                newobj.numberOfSKU ? newobj.numberOfSKU  =   $scope.numberOfSKU : '';
            }
            else {
                newobj.numberOfSKU  =   totalskus; 
            }

            if (!status) {
                var nsubdate = new Date().getTime();
                submitjson.purchaseOrder.purchaseOrderDate = nsubdate;
                submitjson.purchaseOrder.specialInstructions = oadd.shipping_special;
                submitjson.purchaseOrder.shipToLocation = po_add.shiptostore;
                submitjson.purchaseOrder.markForLocation = po_add.markforstore;
                submitjson.purchaseOrder.vendorId = $scope.vendorIdObj[vendname];
                submitjson.purchaseOrder.poType = purordertype;
            }

            if ($scope.action.enableNeedByDate && $state.current.name == 'ovc.purchaseorder-add' && oadd.need_by_date) {
                var needByDate = $filter('dateFormChange')(oadd.need_by_date);
                var tempDate =  moment(Date.UTC(needByDate.getFullYear(), needByDate.getMonth(), needByDate.getDate())).utc().valueOf();

                if (tempDate) {
                    newobj['needByDate'] = tempDate;
                    submitjson.purchaseOrder.needByDate = tempDate;
                }
            }
            // submitjson.purchaseOrder.afsstore                 =   $scope.po_add.afsstore;
            if ($scope.action.state == 'order') {
                newobj.billTo = $scope.O_add.billtostore;
                submitjson.purchaseOrder.afs = $scope.O_add.billtostore;
            }

            // function publishOrder(orderData) {
            //     var orderdetails = JSON.stringify(orderData);
            //     Data.post('/jmspublish/' + OVC_CONFIG.JMS_QUEUEPOSUBMIT, {
            //         data: {
            //             data: orderdetails
            //         }
            //     }).then(function(data) {

            //     });
            // }
            if ($scope.disabled == 1 && (!$scope.withPagination || ($scope.list && $scope.list.length === 0))) {
                //For STYLE GROUP Order SAVE/UPDATE 
                Data.put('/order', {
                    data: newobj
                }).then(function(results) {
                    if ((results.__v == 0) && (results.__v != undefined)) {
                        var orderid = results._id;
                        var porderno = results.purchaseOrderNumber;
                        submitjson.purchaseOrder.purchaseOrderNumber = porderno;
                        sessionStorage.pordernum = porderno;
                        sessionStorage.orderid = orderid;
                        var prodlist = [];
                        var productorders = $scope.list;
                        var shiptoloc, ship_contact;

                        shiptoloc = oadd && po_add.shiptostore ? po_add.shiptostore : '';
                        ship_contact = oadd && oadd.shipping_contact ? oadd.shipping_contact : '';

                        var putArr = [];
                        var qtyArr = [];
                        var trancreate = true;
                        if (productorders && productorders.length) {
                            angular.forEach(productorders, function(item) {
                                var dataobj = {
                                    lineNumber: item.lineNumber,
                                    SKU: item.productCode,
                                    productCode: item.style,
                                    productName: item.name,
                                    productDescription: item.description,
                                    producUom: item.selectedUOM,
                                    productCost: item.cost,
                                    productTax: item.productTax,
                                    productVat: item.productVat,
                                    totalProductTax: item.totalProductTax,
                                    totalProductVat: item.totalProductVat,
                                    isVat: item.taxisVAT,
                                    qty: item.qty,
                                    totalProductCost: item.totalnotax,
                                    purchaseOrderNumber: porderno,
                                    shipToLocation: shiptoloc,
                                    contactName: ship_contact,
                                    toStreetName: oadd.street_name ? oadd.street_name : "",
                                    toStreetNumber: oadd.street_number ? oadd.street_number : "",
                                    toCity: oadd.shipping_city ? oadd.shipping_city : "",
                                    toPostalCode: oadd.shipping_zipcode ? oadd.shipping_zipcode : "",
                                    toCountry: oadd.shipping_country ? oadd.shipping_country : "",
                                    toPhoneNumber: oadd.shipping_phone ? oadd.shipping_phone : "",
                                    variants: item.variants,
                                    styleColor: item.styleColor
                                }

                                putArr.push(dataobj);
                                var nqtyobj = {
                                    purchaseOrderType: purordertype,
                                    FromLocation: fromlocn,
                                    shipToLocation: po_add.shiptostore,
                                    markForLocation: po_add.markforstore,
                                    producUom: item.selectedUOM,
                                    skuCost: item.cost,
                                    sku: item.productCode,
                                    qty: item.qty,
                                    poId: porderno,
                                    qtyStatus: status ? "draftOrder" : "submitted"
                                }

                                if (status)
                                nqtyobj.trancreate = trancreate;

                                qtyArr.push(nqtyobj);
                                trancreate = false;

                                if (!status) {
                                    var subqtyobj = {
                                        lineNumber: item.lineNumber,
                                        sku: item.productCode,
                                        qty: item.qty,
                                        qtyStatus: 'submitted'
                                    }
                                    submitjson.purchaseOrder.purchaseOrderItem.push(subqtyobj);
                                }
                            });
                        }
                        else {
                            var nqtyobj = {
                                purchaseOrderType: purordertype,
                                FromLocation: fromlocn,
                                shipToLocation: po_add.shiptostore,
                                markForLocation: po_add.markforstore,
                                poId: porderno,
                                qtyStatus: status ? "draftOrder" : "submitted"
                            }

                            if (status)
                            nqtyobj.trancreate = trancreate;

                            qtyArr.push(nqtyobj);
                            trancreate = false;
                        }

                        if (putArr.length) {

                            var data_obj        =   {};
                            data_obj.arrData    =   putArr;
                            data_obj.storeConfig    =   $scope.storeConfig;
                            data_obj.skuRoundvalue  =   $scope.skuRoundvalue;

                            if (!status && (purordertype === 'MAN') && submitjson)
                                data_obj.submitjson  =   JSON.stringify(submitjson);

                            Data.put('/orderitem', { 
                                data: {dataObj: JSON.stringify(data_obj)}
                            }).then(function(result) {});

                        }

                        if (status) 
                            add_success = ($state.current.name == 'ovc.transfer-add') ? "Transfer Saved as Draft" : "Order Saved as Draft";

                        if (qtyArr.length) {
                            Data.put('/createqtystatus', { data: { arrData: qtyArr } }).then(function(result) {
                                // if (!status && purordertype === 'MAN') {
                                //     publishOrder(submitjson);
                                // }
                                $scope.list = $scope.listPROD = [];
                                var output = { "status": "success", "message": add_success};
                                Data.toast(output);
                                $state.current.name == 'ovc.transfer-add' ? $state.go('ovc.ibt') : $state.go('ovc.purchaseorder-list');
                            });
                        }
                    }
                });
            }else if($scope.disabled == 1){

                //For SKU GROUP Order Data Update
                Data.post('/order/' + purorder_id, {
                    data: newobj
                }).then(function(results) {
                    if (status) 
                        add_success =  "Order Saved as Draft";

                    var output = { "status": "success", "message": add_success};
                    Data.toast(output);
                    $state.go('ovc.purchaseorder-list');
                });
            }
        }else{
          $scope.disabled     =   0;
          return false;  
        }
    }
        
    //upload file Function
    $scope.uploadOrders         =   function($fileContent,$file){
        $scope.import           =   true;
        var zoneFile            =   $scope.orderfile;
        helper.datSplitup($fileContent).then(function(datData){
            ChunkFunction(datData);
        });
    };

    //Sivapraksh Added //12.07.2017

    //QTY Change 
    $scope.SKUQTYChange     =   function(skuData){
        var location    = ($scope.po_add.markforstore != undefined && $scope.po_add.markforstore != '') ? $scope.po_add.markforstore : $scope.po_add.shiptostore;

        var tempobj = {"item_data":[{
                "SKU" : skuData.productCode,
                "productCode" : skuData.style || "",
                "productName" : skuData.description || "",
                "isVat" : skuData.taxisVAT || 0,
                "purchaseOrderNumber" : $scope.POform.orderNumber || "",
                "styleColor" : skuData.styleColor,
                "producUom": skuData.selectedUOM,
                "styleDescription" : skuData.description,
                "storeId" : location,
                "purchasePrice":skuData.cost,
                "variants" : skuData.variants || [],
                "vatPercentage":skuData.percentage || 0,
                "qty":skuData.qty
            }],
            "page_offset" : $scope.POform.offset,
            "page_lmt":$scope.POform.entryLimit,  // need to change
            "item_count" : $scope.POform.total_count,  // need to change
            "purchaseOrderNumber" : $scope.POform.orderNumber || "" // need to change
        };
        UpdateOrderItem(tempobj);
    }

    //Qty Change Update order item //Common
    function UpdateOrderItem (itemObj , upload){
        if(itemObj){
            var po_add  =   $scope.po_add;
            //For QTYSTATUS TRIGGER TO SERVICE
            var tempQtyObj  =   {
                purchaseOrderType : po_add.pordercode ? po_add.pordercode : "",
                FromLocation : po_add.orderstore ? po_add.orderstore : "",
                shipToLocation: po_add.shiptostore ? po_add.shiptostore : "",
                markForLocation: po_add.markforstore ? po_add.markforstore : "",
            }
            itemObj.qty_status_obj = tempQtyObj;
            itemObj.storeConfig = $scope.storeConfig;
            itemObj.skuRoundvalue = $scope.skuRoundvalue;

            var obj     =   {data: {data: JSON.stringify(itemObj)}};

            Data.post('/checkOrderItem', obj).then(function(result){
                snackbar.create("Changes Saved Successfully !");
                SKUListUpdate(result , upload)
            });
        }
    }

    //Manual SKU Add  
    function skuGroupAssign(selectedData , upload, skuArr){
        if(selectedData){
            var sku         =   upload ? skuArr : selectedData[0];
            var getSkuPrice =   upload ? selectedData : selectedData[0];
            var location    = ($scope.po_add.markforstore != undefined && $scope.po_add.markforstore != '') ? $scope.po_add.markforstore : $scope.po_add.shiptostore;
            var newobj  =   "";
            $scope.currency     =   currencylabel[currencylist[$scope.po_add.shiptostore]];
            if($scope.skuslist.length == 0){
                var oadd    =   $scope.O_add;
                var po_add  =   $scope.po_add;
                newobj = {
                    shippingMethod: oadd ? oadd.shipmethod : "",
                    purchaseOrderType: po_add.pordercode ? po_add.pordercode : "",
                    FromLocation: po_add.orderstore ? po_add.orderstore : "",
                    shipToLocation: po_add.shiptostore ? po_add.shiptostore : "",
                    markForLocation: po_add.markforstore ? po_add.markforstore : "",
                    shipToAddress: oadd ? oadd.address : "",
                    specialInstructions: oadd ? oadd.shipping_special : "",
                    location: po_add.shiptostore ? po_add.shiptostore : "",
                    vendorId: po_add.vendorName ? po_add.vendorName : "",
                    contactName: oadd ? oadd.shipping_contact : "",
                    toStreetName: oadd.street_name ? oadd.street_name : "",
                    toStreetNumber: oadd.street_number ? oadd.street_number : "",
                    toCity: oadd.shipping_city ? oadd.shipping_city : "",
                    toPostalCode: oadd.shipping_zipcode ? oadd.shipping_zipcode : "",
                    toCountry: oadd.shipping_country ? oadd.shipping_country : "",
                    toPhoneNumber: oadd.shipping_phone ? oadd.shipping_phone : "",
                    orderStatus: 'draft'
                }
            }
              
            getskuRules(sku).then(function(data){
               priceCall();
            });  
       function priceCall (dataQty){
            ovcDash.get('apis/ang_skus_getproductprice?sku=' + getSkuPrice + '&loc=' + encodeURIComponent(location)).then(function(result) {
                var tempArray   =   [];
                angular.forEach(result, function(value){
                    var skuDetail   =   upload ? $scope.prod_detail[value.ProductPrice.sku] : $scope.allSKUobj[value.ProductPrice.sku];
                    if(result && skuDetail){
                        var temp   =    {
                            "SKU" : value.ProductPrice.sku,
                            "productCode" : skuDetail.productCode || "",
                            "productName" : skuDetail.name || "",
                            "isVat" : value.ProductPrice.isVAT || 0,
                            "purchaseOrderNumber" : $scope.POform.orderNumber || "",
                            "styleColor" : skuDetail.color,
                            "producUom": uomlist['Each'] || '',
                            "styleDescription" : skuDetail.styleDescription,
                            "storeId" : location,
                            "purchasePrice":value.ProductPrice.Cost,
                            "variants" : skuDetail.variants || [],
                            "vatPercentage":value.ProductPrice.percentage
                        }
                        if(dataQty){
                            temp['qty']     =   dataQty;
                        }
                        if(upload && $scope.uploadSkus[value.ProductPrice.sku] || upload && $scope.uploadSkus[value.ProductPrice.barcode]){
                            temp['qty'] = $scope.uploadSkus[value.ProductPrice.sku] ? $scope.uploadSkus[value.ProductPrice.sku] : $scope.uploadSkus[value.ProductPrice.barcode];
                        }
                        tempArray.push(temp);
                    }
                });
                var tempObj     =   {
                    "item_data":tempArray,
                    "page_offset" : $scope.POform.offset,
                    "page_lmt":$scope.POform.entryLimit,
                    "item_count" : $scope.POform.total_count,
                    "purchaseOrderNumber" : $scope.POform.orderNumber || "",
                    "fileUpload" : upload ? true : undefined
                }
                if(newobj){
                    tempObj.order_data = newobj;
                }
                UpdateOrderItem(tempObj , upload);
            });
        }
            
        }
    }

    //SKU List Update //Common
    function SKUListUpdate (skudatas , upload){
        if(upload)
            uploadCount++;

        var orderItem         =   skudatas.item_data;
        var orderItemlist  =   [];
        var tempcost   =  0;
        if(skudatas.order_data){
            $scope.tempOrderData      =   skudatas.order_data;
            $scope.POform.orderNumber =   skudatas.order_data.purchaseOrderNumber;
            $scope.allitems    =  skudatas.order_data.numberOfProducts;
            $scope.allsubtotal =  skudatas.order_data.PoSubtotal;
            $scope.allsubtaxes =  skudatas.order_data.totalPoTax;
            $scope.allsubvates =  skudatas.order_data.totalPoVAT;
            $scope.overtotal   =  skudatas.order_data.totalPoCost;
            purorder_id        =  skudatas.order_data._id;
            $scope.numberOfSKU =  skudatas.order_data.numberOfSKU;
        }
        angular.forEach(orderItem, function(item){
            var quantities = item.qty ? parseInt(item.qty) : 0;
            var prcost     = item.productCost ? parseFloat(item.productCost).toFixed(2)  : 0;
            var prtcost    = item.totalProductCost ? parseFloat(item.totalProductCost).toFixed(2) : 0;
            var prttax     = item.totalProductTax ? parseFloat(item.totalProductTax).toFixed(2) : 0;
            var prttotal   = prtcost + prttax;
            if (item.isVat == '0') {
                var totwithtax = parseFloat(prttotal).toFixed(2);
            } else {
                var totwithtax = item.totalProductCost ? parseFloat(item.totalProductCost).toFixed(2) : 0;
            }
            var orderData = {
                lineNumber: item.lineNumber,
                sku: item.SKU,
                style: item.productCode,
                productCode: item.SKU,
                name: item.productName,
                description: item.productName,
                cost: prcost,
                selectedUOM: item.producUom,
                qty: quantities,
                originalQty: quantities,
                orderType: $scope.po_add.pordercode,
                fromStore: $scope.po_add.orderstore,
                toStore: $scope.po_add.shiptostore,
                totalnotax: prtcost,
                totalProductTax: item.totalProductTax,
                taxisVAT: item.isVat,
                totalProductVat: item.totalProductVat,
                productTax: item.productTax,
                productVat: item.productVat,
                total: totwithtax,
                id: item._id,
                styleDescription: item.styleDescription,
                variants: item.variants,
                styleColor: item.styleColor
            };
            orderItemlist.push(orderData);
        });
        $scope.list     = orderItemlist;
        if($scope.withPagination){
            $scope.skuslist = $scope.list;
        }

        $scope.POform.total_count         =   skudatas.total_count;
        if(skudatas && skudatas.current_offset)
        $scope.POform.currentPage         =  (parseInt(skudatas.current_offset) /$scope.POform.entryLimit) + 1;
        $scope.po_add.prodresult = "";
        if($scope.ChunkedData && $scope.ChunkedData[uploadCount])
        chunkDataCall();
    };

    //For upload Data Set
    var uploadCount  = 0;
    //Pagination Data
    function groupingSkuCall (orderNo){
        if(orderNo){
            var paginationData = '&page_offset='+ $scope.POform.offset + '&page_lmt='+$scope.POform.entryLimit;
            Data.get('/orderitem?purchaseordernumber='  + orderNo + paginationData).then(function(skudatas) {
                if(skudatas){
                    SKUListUpdate(skudatas);
                }else{
                    console.info('Order Item Failed');
                }
            });
        }else{
            console.info('Order no Is not passed');
        }
    }

    function chunkDataCall(upload){
        if(upload)
            uploadCount++;

        if($scope.ChunkedData && $scope.ChunkedData[uploadCount])
        $scope.getmodifiedsku($scope.ChunkedData[uploadCount],'chunk');
    }

    //Page change function
    $scope.pageChangedSKUGroup  =   function(){
        $scope.POform.offset = ($scope.POform.currentPage - 1) * $scope.POform.entryLimit;
        groupingSkuCall($scope.POform.orderNumber , $scope.tempOrderData);
    };
});
