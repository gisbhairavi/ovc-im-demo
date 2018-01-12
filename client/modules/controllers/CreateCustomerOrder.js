/*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module     :   Create and Update Customer Orders
*
*    Developer  :   Sivaraman
* 
*    Date       :   22/06/2016
*
*    Version    :   1.0
*
**********************************************************************/
var app = angular.module('OVCstockApp',[ 'ovcdataExport','vendorGroup','roleConfig','angularModalService','ui.bootstrap.treeview']);

app.controller('addCustomerOrders', function($rootScope,$scope,
 $state, $stateParams,$http,$timeout,$compile,$controller,$location,$anchorScroll,CUSTOMERORDERS ,roleConfigService,
 QTYREASONCODES, ModalService,CARRIERCODES,VendorGroupService,ovcDash, Data,TreeViewService, Utils, labelService, OVC_CONFIG){
    debugger;

    if($state.params.fromPage   ==  "pos") {
        $rootScope.themeObject.leftSidebar = false;
        $rootScope.themeObject.widgtWidth = 'margin:0px;'; 
    }
    
    if($location.path() == '/ovc/customerorders/add'){
        var userObj = {'username':'oneview','psswrd':'0n3v13w905'};
        customerOrderFromPOS(userObj,true);
        $scope.userObj=true;
    }

        function customerOrderFromPOS(customer,vars){
          ovcDash.post('apis/ang_loginapi', {
            data: customer
        }).then(function (results) {
            if (results.status == "success") {
                var newObj = {
                    clientId: results.userid,
                    clientSecret: results.session_id,
                    clientName:results.name,
                    firstName:results.firstname,
                    middleName:results.middlename,
                    lastName:results.lastname,
                    roles: results.roles,
                    location:results.locations,
                    language:results.language
                };

                try{
                    localStorage.configDateFormat = results.config && results.config.dateformat ? results.config.dateformat : "";
                }catch(error){
                    console.log('Dashboard Config Error :' + error );
                }
                
                var transform = function(data){
                    return $.param(data);
                }
                
                $http.post(OVC_CONFIG.AUTH_PATH + '/oauth/code', newObj,{transformRequest: transform}).then(function (datas) {
                    if(datas.status == 200){
                        var authObj = {
                            grant_type: "authorization_code",
                            code: datas.data.code,
                        };
                        delete sessionStorage.values;
                        
                        $http.post(OVC_CONFIG.AUTH_PATH + '/oauth/token',authObj,{transformRequest: transform}).then(function (datas1) {
                            ovcDash.SetCredentials(newObj.clientId, newObj.clientSecret,customer.psswrd, datas1.data.access_token.token, datas1.data.token_type,
                            newObj.clientName,newObj.firstName,newObj.middleName,newObj.lastName,newObj.roles,newObj.location,newObj.language);
                            var success = {"status":"success","message":"Logged in successfully."};
                            var findItPage = "customerOrder";

                            labelService.getResources(findItPage).then(function(res){
                                debugger;
                                $rootScope.ovcLabel = res;
                                delete localStorage.Roles; 
                                Utils.roles();
                                customerOrderFromIM();
                            });     
                            var path = $location.absUrl();
                            var paths = path.substring(0, path.lastIndexOf('#/'));
                            if(!vars){
                                Data.toast(success);
                                $window.location.href = paths;
                            }
                        });
                    }else{
                        var error = {"status":"error","message":"Your session timed out, please login again."};
                        Data.toast(error);
                    }
                });
            }else{
                Data.toast(results);
            }
        });
           
    }

    if($location.path() !== '/ovc/customerorders/add'){ customerOrderFromIM();} 

    function customerOrderFromIM(){

        $scope.newmodule                        =   {};
        $scope.customerorders                   =   {};
        $scope.customerorders.shippings         =   {};
        $scope.customerorders.selectedvendors   =   {};
        $scope.action                           =   {};
        $scope.newmodule.orderfunction          =   'create';
        $scope.newmodule.ordertypes             =   [];
        $scope.newmodule.store_datas            =   [];
        $scope.newmodule.allstores              =   {};
        $scope.newmodule.uomvalues              =   {};
        $scope.newmodule.alluoms                =   {};
        var newline                             =   0;
        var linedetails                         =   [];
        $scope.newmodule.allproducts            =   [];
        $scope.newmodule.addedproducts          =   [];
        $scope.newmodule.list                   =   [];
        var addedskus                           =   [];
        $scope.changedSkus                      =   [];
        $scope.newmodule.prod_detail            =   [];
        var price_detail                        =   [];
        $scope.newmodule.allproducts2           =   [];
        $scope.newmodule.styleskus              =   [];
        $scope.newmodule.locations              =   [];
        $scope.newmodule.skuslist               =   [];
        $rootScope.dropship                     =   {};
        $rootScope.dropship.skuvendors          =   {};
        $rootScope.dropship.selectedskuvendors  =   {};
        $rootScope.dropship.styleskusvendors    =   [];
        $scope.tab          =   {};
        $scope.tab.page     =   1;
        $scope.tab.error    =   {};
        var customer_orderid                    =   0;
        var copy_customer                       =   0;
        var ordercodes                          =   $scope.ovcLabel.customerOrder.customerorderslist;
        var customertypes                       =   [];
        var user_id                             =   $rootScope.globals['currentUser']['username'];
        var count                               =   1;
        roleConfigService.getConfigurations(function(configData){
            $scope.newmodule.roleConfig  =   configData;
        });
        angular.forEach(CUSTOMERORDERS, function(item) {
            item.label= ordercodes[item.code];
            customertypes.push(item);
        });
    
    /* get Order Types */
    
    $timeout(function(){
        angular.element('.sku_result').focus();
    },500);
    $scope.newmodule.ordertypes = customertypes;

    if ($stateParams.orderid != undefined) {
        customer_orderid    =   $stateParams.orderid;
    }
    if($state.current.name      ==  'ovc.customerorders-add'){
        $scope.newmodule.title  =   $scope.ovcLabel.customerOrder.createNew;
         /***For Default Select Order Type**/
        if($scope.newmodule.ordertypes.length == 1){
            $scope.customerorders.ordertype = customertypes[0].code;
            $timeout(function() {
                $scope.getOrdertype(customertypes[0].code);
            }, 1800);
        } 
    }
    if($state.current.name      ==  'ovc.customerorders-edit'){
        $scope.newmodule.title  =   $scope.ovcLabel.customerOrder.edit;
    }
    if($state.current.name      ==  'ovc.customerorders-copy'){
        $scope.newmodule.title  =   $scope.ovcLabel.customerOrder.copy;
        if((sessionStorage.dropshipid != undefined)&&(sessionStorage.dropshipid !='') ){
            copy_customer =  sessionStorage.dropshipid;
            customer_orderid = sessionStorage.dropshipid;
        }
    }    

    var currencylabel   =   $scope.ovcLabel.global.currency;
    var currencylist    =   [];
     /* get store or locations from mysql service */
    $scope.getStores = function() {
        Data.get('/uom').then(function(results) {
            var uomdatas = [];
            angular.forEach(results, function(values) {
                if ((values.isActive) && (values.uomId != undefined) && (values.uomId != '') && (values.description != undefined) && (values.description != '')) {
                    var newobj = {
                        name: values.uomId,
                        id: values.uomId,
                        value: values.uomId
                    }
                    uomdatas.push(newobj);
                    $scope.newmodule.uomvalues[values.uomId]=values.uomId;
                }
            });
            $scope.newmodule.alluoms = uomdatas;
        },function(error){
        });
        Utils.hierarchylocation().then(function(results){
            $scope.storeLocData =   TreeViewService.getLocData(results);
            $scope.flatLocations = [];
            $scope.storeLocData.forEach(function (item) {
                $scope.recur(item, 0, $scope.flatLocations);
            });
            var allstores   =   {};
            angular.forEach(results.hierarchy, function(item){
                allstores[item.id]=  item.name;
                currencylist[item.id]    =   item.currency;
            });
            $scope.newmodule.allstores  =   allstores;
            if($scope.newmodule.store_datas.length==1){
                $scope.customerorders.location=results.hierarchy[0].id;

            }
            
        });

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
   
    $scope.getStores();
    /*****Vendor Select Popup****/
    $scope.show = function() {
        ModalService.showModal({
        templateUrl: 'vendormodal.html',
        controller:['$scope','close',function(scope,close){
            
            scope.close = function(result){
                close(result, 500);
            }
           }
          
        ]}).then(function(modal) {
            modal.element.modal();
            modal.close.then(function(result) { 
                if((result =='Cancel') || (result =='No')){
                    $rootScope.dropship                     =   {};
                    $rootScope.dropship.skuvendors          =   {};
                    $rootScope.dropship.selectedskuvendors  =   {};
                }else{
                    $scope.getselected_vendordata(result);
                }
            });
        });
    };

    $scope.getlocation_details=function(loc){
        $scope.tab.error    =   false;
        $scope.newmodule.orderstore     =$scope.newmodule.allstores[loc];
        $timeout(function(){
            angular.element('.sku_result').focus();
        },500);
    };

    $scope.getOrdertype=function(order){
        $scope.newmodule.ordertype     = ordercodes[order];
    };

    $scope.addProduct   =   function(){
    }

    $scope.cancelorder   =   function(){
        $state.go('ovc.customerorders-list');
    }

     /******SKU Search Product******/
    $scope.dosrchproduct = function(typedthings) {
        if (typedthings != '...' && typedthings != '' && typedthings != undefined) {
            ovcDash.get('apis/ang_loc_products?srch=' + typedthings + '&locid=' + encodeURIComponent($scope.customerorders.location)).then(function(data) {
                if (data.status != 'error') {
                    var rows    = [];
                    var allvals = {};
                    var styleData = [];
                    var groupData = [];
                    var selectedbarcode = [];
                    var countbarcode = 0;
                    angular.forEach(data, function(item) {
                        if (styleData.indexOf(item.ProductTbl.productCode) == -1) {
                            var value = item.ProductTbl.productCode + '~' + item.ProductTbl.styleDescription;
                            rows.push({
                                value: value,
                                labelclass:"search_products_style",
                                labeldata: 'Style'
                            });
                            styleData.push(item.ProductTbl.productCode);
                        } 
                        if (styleData.indexOf(item.ProductTbl.barCode) == -1) {
                            var value = item.ProductTbl.sku+ '~' + item.ProductTbl.name + '~' +item.ProductTbl.barCode;
                            rows.push({
                                value: value,
                                labelclass:"search_products_barcode",
                                labeldata: 'Barcode'
                            });
                            styleData.push(item.ProductTbl.productCode);
                            countbarcode ++;
                            selectedbarcode[0] = value;
                        } 
                        var value = item.ProductTbl.sku + '~' + item.ProductTbl.name + '~' + item.ProductTbl.barCode
                        rows.push({
                            value: value,
                            labelclass:"search_products_sku",
                            labeldata: 'SKU'
                        });
                        allvals[item.ProductTbl.sku] = item.ProductTbl;
                    });
                    $scope.newmodule.addedproducts     =   rows;
                    $scope.newmodule.allproducts       =   allvals;
                }
                else{
                   if(count    ==  1 && typedthings != ''){
                       var output = {
                          "status": "error",
                          "message": $scope.ovcLabel.customerOrder.toast.no_product
                      };
                      Data.toast(output);
                       count++;
                   }
               }
            });
        }
    };

    /******Search Style to add order item*****/
    $scope.dostylesrch = function(typedthings) {  
        /*if($scope.customerorders.styleresult != ""){
            $scope.customerorders.skuresult  =   "";
        }*/
        if (typedthings != '...' && typedthings != '' && typedthings != undefined) {
            ovcDash.get('apis/ang_style_products?srch=' + typedthings + '&locid=' + encodeURIComponent($scope.customerorders.location)).then(function(data) {
                if (data.status != 'error') {
                    var rows        =   [];
                    var allvals2    =   [];
                    angular.forEach(data, function(item) {
                        rows.push(item.ProductTbl.productCode + '~' + item.ProductTbl.name);
                        allvals2.push(item.ProductTbl);
                    });
                    $scope.newmodule.styleproducts     =   rows;
                }
            }); 
        }
    };

    /****sku / style Select Function*****/
    $scope.doSelectproduct      =   function(selected) {
        var sku_array           =   selected.split('~');
        $scope.selresult        =   selected;
        $scope.customerorders.sku_select   =   sku_array[0];
        $scope.addSkus($scope.customerorders,1);
    };

    $scope.dostyleselect    =   function(selected){
        var style_array             =   selected.split('~');
        $scope.customerorders.style_select     =   style_array[0];
    };

    /***sku/Style Add Function***/
    $scope.addSkus  =   function(customerorders){
        if($scope.validation(customerorders,'add')){
            if((customerorders.skuresult != '') && (customerorders.skuresult != undefined)){
                var selectedpro     =   [];
                selectedpro  =   $scope.selresult.split('~');
                if(selectedpro.length == 3){
                    $scope.order_product();
                }
                else if(selectedpro.length == 2){
                    $scope.order_style(customerorders);
                }
            }
        }
        //$scope.customerorders.skuresult     =   '';
        $scope.newmodule.addedproducts      =   [];
    };

    /**Add Sku in Style**/
    $scope.order_style  =   function(customerorders){
        var seltstyle   =   customerorders.skuresult;
        $scope.showstyle=true;
        $scope.styleitems = {locationId: $scope.customerorders.location,  result:'', styleresult:seltstyle, mode:"edit"};
        angular.element(document.getElementById('dropstylematrix'))
        .html($compile('<style-matrix></style-matrix>')($scope));
        $scope.customerorders.styleresult = '';
    }

    $scope.loadmat      =   false;
    var prod_detail     =   [];
    var price_detail    =   [];
    var addedskus       =   [];
    $scope.getmodifiedsku=function(styleskus){
        $scope.changedSkus  =   styleskus;
        var newskus =   Object.keys($scope.changedSkus);
        var selectedskus=newskus.join(',');
        ovcDash.post('apis/ang_getvendorproducts',{data:{sku:selectedskus}}).then(function (results) {
            if ((results.status != 'error') && (results !='')) {
                var allvals = [];
                angular.forEach(results, function(item) {
                    allvals.push(item.ProductTbl);
                });
                $scope.newmodule.styleskus     =   allvals;
                $scope.addskusfrommatrix(newskus);
            }
        });
    }       

    /**Add Sku**/
    $scope.order_product    =   function() {
        var sku                           =   $scope.customerorders.sku_select;
        var uomlist                       =   $scope.newmodule.uomvalues;
        var vendorgroups                  =   [];
        var prtax  =  tax_tot =  sptax    =   spvat = sptaxes = spvates = tot_wtax = 0;
       
        Data.post('/vendorByProduct',{data:{vendorSKUs:sku}}).then(function(results) {
            if(results.error == "No SKUs."){
                    var output = {
                        "status" : "error",
                        "message": $scope.ovcLabel.customerOrder.toast.not_vendor_sku
                    };
                    Data.toast(output);
                    return false;
            }
            if((results !='') && (results.error == undefined) && (results.status == 'success')){
                var vendor_datas=results.result;
                var no_of_vendors   =  vendor_datas[$scope.customerorders.sku_select].length;
                if(no_of_vendors == 0){
                    var output = {
                        "status" : "error",
                        "message": $scope.ovcLabel.customerOrder.toast.not_vendor_sku
                    };
                    Data.toast(output);
                    return false;
                }else{

                    angular.forEach(vendor_datas, function(data,key1){
                        angular.forEach(data, function(values,key){
                            var carrierdata =   [];
                            var carriercodes=   values.carrierAlphaCode;
                            carrierdata     =   carriercodes.split(',');
                            var newobj      =   {
                                    vendorid:values._id,
                                    vendorname:values.companyName,
                                    carriercode:carrierdata
                                }
                            vendorgroups.push(newobj);
                            if(no_of_vendors == 1){
                                $rootScope.dropship.selectedskuvendors[$scope.customerorders.sku_select]=values._id;
                            }
                        });
                    });
                    
                    $rootScope.dropship.skuvendors[$scope.customerorders.sku_select] = vendorgroups;
                    $rootScope.dropship.skuvendors['skutype'] = 'sku';

                    if(no_of_vendors == 1){
                        $scope.getselected_vendordata($rootScope.dropship);     
                    }
                    if(no_of_vendors >1){
                        $scope.show();
                    }
                }
            }
        },function(error){
            console.log(error);
        });
    };

    /**Add Skus from Style Matrix *****/
    $scope.addskusfrommatrix = function(newskus){
        var uomlist     =   $scope.newmodule.uomvalues;
        var styleskus   =   $scope.newmodule.styleskus;
        var allskus     = newskus.join(',');
        
        Data.post('/vendorByProduct',{data:{vendorSKUs:allskus}}).then(function(results) {
            if(results.error == "No SKUs."){
                var output = {
                    "status" : "error",
                    "message": $scope.ovcLabel.customerOrder.toast.not_vendor_skus
                };
                Data.toast(output);
                return false;
            }
            if((results !='') && (results.error == undefined) && (results.status == 'success')){
                var allvendors      =   results.result;
                var no_of_vendors   =   Object.keys(allvendors).length;
                var vendor_arrays  = [];
                var skus_novendors = [];
                angular.forEach(allvendors, function(data,keycode){
                    if((data.length > 0)){
                        angular.forEach(data, function(values,key){
                            vendor_arrays.push(values);
                        });
                    }else{
                        skus_novendors.push(keycode);
                    }
                });
                if((vendor_arrays.length == 0) && (no_of_vendors == 0)){
                    if(skus_novendors.length == 1){
                        var output = {
                            "status" : "error",
                            "message": "Selected Sku "+skus_novendors + " is not a Vendor sku"
                        };
                    }else{
                        var output = {
                            "status" : "error",
                            "message": "Selected Skus "+skus_novendors + " are not Vendor skus"
                        };
                    }
                    
                    Data.toast(output);
                    return false;
                }if(no_of_vendors == 1){
                    var onevendor = false;
                    angular.forEach(allvendors, function(data,keycode){
                        var vendorgroups=[];
                        if((data.length > 0)){
                            angular.forEach(data, function(values,key){
                                var carrierdata =   [];
                                var carriercodes=   values.carrierAlphaCode;
                                carrierdata     =   carriercodes.split(',');
                                var newobj      =  {
                                    vendorid:values._id,
                                    vendorname:values.companyName,
                                    carriercode:carrierdata
                                }
                                vendorgroups.push(newobj);
                                if((data.length==1)){
                                    onevendor = true;
                                    $rootScope.dropship.selectedskuvendors[keycode]=values._id;
                                }
                                
                            });
                            $rootScope.dropship.skuvendors[keycode] = vendorgroups;
                            $rootScope.dropship.skuvendors['skutype'] = 'styleskus';

                        }
                    });

                    if(onevendor == true){
                        $scope.getselected_vendordata();
                    }else{
                        $scope.show();
                    }
                }else{
                    var vendorcount = 0;
                    angular.forEach(allvendors, function(data,keycode){
                        var vendorgroups=[];
                        if(data.length > 0){
                            angular.forEach(data, function(values,key){
                                var carrierdata =   [];
                                var carriercodes=   values.carrierAlphaCode;
                                carrierdata     =   carriercodes.split(',');
                                var newobj      =  {
                                    vendorid:values._id,
                                    vendorname:values.companyName,
                                    carriercode:carrierdata
                                }
                                vendorgroups.push(newobj);
                                if((data.length==1)){
                                    vendorcount++;
                                    $rootScope.dropship.selectedskuvendors[keycode]=values._id;
                                }
                            });
                            
                            $rootScope.dropship.skuvendors[keycode] = vendorgroups;
                            $rootScope.dropship.skuvendors['skutype'] = 'styleskus';
                        }
                    
                    });
                    if(vendorcount != no_of_vendors){
                        $scope.show();
                    }
                    else{
                        $scope.getselected_vendordata();
                    }
                }             
            }
        },function(error){
        });
    };
    var price_detail =  [];
    var addedskus    =  [];
    $scope.getselected_vendordata = function(message) {
        var uomlist     =   $scope.newmodule.uomvalues;
        var location    =   $scope.customerorders.location;
        if( $rootScope.dropship.skuvendors['skutype'] == 'sku'){
            var sku           =   $scope.customerorders.sku_select;
            var thisskuvendor = {};
            angular.forEach(  $rootScope.dropship.skuvendors[sku], function(lval, lindex) {
                if (lval.vendorid ==  $rootScope.dropship.selectedskuvendors[sku]) {
                    thisskuvendor   =   lval;
                    if(!$scope.customerorders.shippings.hasOwnProperty(lval.vendorid)){
                        $scope.customerorders.shippings[lval.vendorid] = lval;
                        $scope.getcarriercodes(thisskuvendor.vendorid);
                    }
                }
            });

            var vendorgroups =  [];
            var prtax = tax_tot = sptax = spvat = sptaxes = spvates = tot_wtax = 0;
            ovcDash.get('apis/ang_getproductprice?sku=' + sku + '&loc=' + encodeURIComponent(location)).then(function(response) {

                var cost    =   parseFloat(response[0].ProductPrice.Cost).toFixed(2);
                var Tax     =   response[0].ProductPrice.isVAT;
                var vTax    =   response[0].ProductPrice.percentage;
                var totalc  =   povat   =   vat_total   =   0;
                var productslist    =   $scope.newmodule.allproducts;
                var value=productslist[sku];
                var newprod = false;
                var sduom = uomlist['Each'];
                angular.forEach(  $scope.newmodule.list, function(lval, lindex) {
                    if ((lval.sku == sku) && (lval.vendorid == thisskuvendor.vendorid)) {
                        var qty = (lval.qty) + 1;
                        newprod = true;
                        $scope.newmodule.list[lindex].qty = qty;
                        var to_tal  =  (cost * qty);
                        var taxcal  =   parseFloat(vTax / 100).toFixed(2);
                        var prtax   = (to_tal * taxcal);

                        if (Tax == 0) {
                            sptax       =   (cost * taxcal);
                            tot_wtax    =   parseFloat(prtax + to_tal).toFixed(2);
                            $scope.newmodule.list[lindex].total           =   tot_wtax;
                            $scope.newmodule.list[lindex].totalnotax      =   to_tal;
                            $scope.newmodule.list[lindex].totalProductTax =   prtax;
                            $scope.calcItems(lindex, qty, cost, to_tal, tot_wtax, prtax, value.productCode,thisskuvendor.vendorid);
                        } else if (Tax == 1) {
                            povat   =   (to_tal * taxcal);
                            spvat   =   (cost * taxcal);
                            $scope.newmodule.list[lindex].total           =   to_tal;
                            $scope.newmodule.list[lindex].totalnotax      =   to_tal;
                            $scope.newmodule.list[lindex].totalProductVat =   prtax;
                            $scope.calcItems(lindex, qty, cost, to_tal, to_tal, prtax, value.productCode,thisskuvendor.vendorid);
                        }
                    }
                });


                var skuwaist    =   ((value.waist) && (value.waist !=   '' )) ? parseInt(value.waist) : null ;
                var skulength   =   ((value.length) && (value.length != '' ) )? parseInt(value.length) : null ;
                var skusize     =   ((value.size)   &&  (value.size !=  '')) ? (value.size) : '' ;
                if (!newprod) {
                    var qty     =   1;
                    var taxcal  =   parseFloat(vTax / 100).toFixed(2);
                    var to_tal  =   (cost * qty);
                    if (Tax == 0) {
                        tot_wtax    =   (to_tal * taxcal) + to_tal;
                        sptax       =   (cost * taxcal);
                        prtax       =   (to_tal * taxcal);
                    } else if (Tax == 1) {
                        tot_wtax    =   parseFloat(to_tal).toFixed(2);
                        spvat       =   (cost * taxcal);
                        povat       =   (to_tal * taxcal);
                    }
                    var newobj  =   {
                            id:'',
                            lineNumber : '',
                            sku:value.sku,
                            description: value.description,
                            qty: 1,
                            selectedUOM: sduom,
                            style:value.productCode,
                            styleDescription:value.styleDescription,
                            variants:value.variants,
                            styleColor:value.color,
                            // waist:skuwaist,
                            // length:skulength,
                            // size:skusize,
                            cost: cost, 
                            productVat: spvat, 
                            totalProductVat: povat, 
                            productTax: sptax, 
                            totalProductTax: prtax,
                            totalnotax: to_tal, 
                            total: tot_wtax, 
                            taxisVAT: Tax, 
                            percentage: vTax,
                            vendorid: thisskuvendor.vendorid,
                            vendor:thisskuvendor.vendorid,
                            vendorname:thisskuvendor.vendorname,
                            vendorOrderNumber:'',
                            carrierCode:''
                        };
                    $scope.newmodule.list.push(newobj); 
                    $scope.newmodule.skuslist=VendorGroupService.getvendorstylegroup( $scope.newmodule.list); 
                    $scope.currency     =   currencylabel[currencylist[$scope.customerorders.location]];
                    var newindex=($scope.newmodule.list.length) - 1;
                    if (Tax == 1) {
                         $scope.calcItems(newindex, qty, cost, to_tal, tot_wtax, povat,value.productCode,thisskuvendor.vendorid);
                    } else if (Tax == 0) {
                         $scope.calcItems(newindex, qty, cost, to_tal, tot_wtax, prtax,value.productCode,thisskuvendor.vendorid);
                    }
                    
                }else{
                     $scope.newmodule.skuslist=VendorGroupService.getvendorstylegroup( $scope.newmodule.list);
         
                }
                $rootScope.dropship                     =   {};
                $rootScope.dropship.skuvendors          =   {};
                $rootScope.dropship.selectedskuvendors  =   {};
            });
            $scope.customerorders.sku_select   =   '';
       }else{
           
            var newskus =   Object.keys($scope.changedSkus);
            var selectedskus=newskus.join(',');

            ovcDash.get('apis/ang_skus_getproductprice?sku=' + selectedskus + '&loc=' + encodeURIComponent(location)).then(function(result) {
                if ((result.status != 'error') && (result !='')) {
                    var price_detail = result;
                    if($scope.newmodule.styleskus  != []){
                        angular.forEach($scope.newmodule.styleskus ,function(item){
                            var skudata = item;
                            angular.forEach(result,function(costitem){
                                var pridata = costitem.ProductPrice;
                                
                                if(skudata.sku ==pridata.sku ){
                                
                                    pridata.quantity = $scope.changedSkus[pridata.sku];
                                    addedskus.push(angular.extend(skudata, pridata));
                                }
                               
                            });
                        });
                    }
                    angular.forEach(addedskus,function(value){
                        var prtax   = tax_tot = sptax = spvat = sptaxes = spvates = tot_wtax = 0;
                        var cost    =   parseFloat(value.Cost).toFixed(2);
                        var Tax     =   value.isVAT;
                        var vTax    =  value.percentage;
                        var totalc  =   povat   =   vat_total   =   0;
                        var newprod = false;
                        var thisskuvendor = {};
                        angular.forEach(  $rootScope.dropship.skuvendors[value.sku], function(lval, lindex) {
                            if (lval.vendorid ==  $rootScope.dropship.selectedskuvendors[value.sku]) {
                                thisskuvendor   =   lval;
                                if(!$scope.customerorders.shippings.hasOwnProperty(lval.vendorid)){
                                    $scope.customerorders.shippings[lval.vendorid] = lval;
                                    $scope.getcarriercodes(thisskuvendor.vendorid);
                                }
                            }
                        });
                        
                        angular.forEach(  $scope.newmodule.list, function(lval, lindex) {
                            if ((lval.sku == value.sku) && (lval.vendorid == thisskuvendor.vendorid)) {
                                var qty = (lval.qty) +value.quantity;
                                newprod = true;
                                $scope.newmodule.list[lindex].qty = qty;
                                var to_tal  =  (cost * qty);
                                var taxcal  =   parseFloat(vTax / 100).toFixed(2);
                                var prtax   = (to_tal * taxcal);

                                if (Tax == 0) {
                                    sptax       =   (cost * taxcal);
                                    tot_wtax    =   parseFloat(prtax + to_tal).toFixed(2);
                                    $scope.newmodule.list[lindex].total           =   tot_wtax;
                                    $scope.newmodule.list[lindex].totalnotax      =   to_tal;
                                    $scope.newmodule.list[lindex].totalProductTax =   prtax;
                                    $scope.calcItems(lindex, qty, cost, to_tal, tot_wtax, prtax, value.productCode,thisskuvendor.vendorid);
                                } else if (Tax == 1) {
                                    povat   =   (to_tal * taxcal);
                                    spvat   =   (cost * taxcal);
                                    $scope.newmodule.list[lindex].total           =   to_tal;
                                    $scope.newmodule.list[lindex].totalnotax      =   to_tal;
                                    $scope.newmodule.list[lindex].totalProductVat =   prtax;
                                    $scope.calcItems(lindex, qty, cost, to_tal, to_tal, prtax, value.productCode,thisskuvendor.vendorid);
                                }
                            }
                        });
                       
                        var sduom = uomlist['Each'];
                        var skuwaist    =   ((value.waist) && (value.waist !=   '' )) ? parseInt(value.waist) : null ;
                        var skulength   =   ((value.length) && (value.length != '' ) )? parseInt(value.length) : null ;
                        var skusize     =   ((value.size)   &&  (value.size !=  '')) ? (value.size) : '' ;
                        if ((!newprod) && (thisskuvendor.vendorid) ) {
                            var qty     =   value.quantity;
                            var taxcal  =   parseFloat(vTax / 100).toFixed(2);
                            var to_tal  =   (cost * qty);
                            if (Tax == 0) {
                                tot_wtax    =   (to_tal * taxcal) + to_tal;
                                sptax       =   (cost * taxcal);
                                prtax       =   (to_tal * taxcal);
                            } else if (Tax == 1) {
                                tot_wtax    =   parseFloat(to_tal).toFixed(2);
                                spvat       =   (cost * taxcal);
                                povat       =   (to_tal * taxcal);
                            }
                            var newobj  =   {
                                    id:'',
                                    lineNumber : '',
                                    sku:value.sku,
                                    description: value.description,
                                    qty:value.quantity,
                                    selectedUOM: sduom,
                                    style:value.productCode,
                                    styleDescription:value.styleDescription,
                                    variants:value.variants,
                                    styleColor:value.color,
                                    // waist:skuwaist,
                                    // length:skulength,
                                    // size:skusize,
                                    cost: cost,
                                    productVat: spvat, 
                                    totalProductVat: povat, 
                                    productTax: sptax, 
                                    totalProductTax: prtax,
                                    totalnotax: to_tal,
                                    total: tot_wtax, 
                                    taxisVAT: Tax, 
                                    percentage: vTax,
                                    vendorid: thisskuvendor.vendorid,
                                    vendor:thisskuvendor.vendorid,
                                    vendorname:thisskuvendor.vendorname,
                                    vendorOrderNumber:'',
                                    carrierCode:''
                                };
                            $scope.newmodule.list.push(newobj);
                            $scope.newmodule.skuslist=VendorGroupService.getvendorstylegroup( $scope.newmodule.list);  
                            $scope.currency     =   currencylabel[currencylist[$scope.customerorders.location]];
                            var newindex=($scope.newmodule.list.length) - 1;
                            if (Tax == 1) {
                                 $scope.calcItems(newindex, qty, cost, to_tal, tot_wtax, povat,value.productCode,thisskuvendor.vendorid);
                            } else if (Tax == 0) {
                                 $scope.calcItems(newindex, qty, cost, to_tal, tot_wtax, prtax,value.productCode,thisskuvendor.vendorid);
                            }
                        }else{
                             $scope.newmodule.skuslist=VendorGroupService.getvendorstylegroup( $scope.newmodule.list);
                 
                        }
                    });
                    price_detail                            =   [];
                    addedskus                               =   [];
                    $scope.prod_detail                      =   [];
                    $scope.newmodule.styleskus              =   [];
                    $rootScope.dropship                     =   {};
                    $rootScope.dropship.skuvendors          =   {};
                    $rootScope.dropship.selectedskuvendors  =   {};
                }else{
                
                }
            });
       }
    };

    $scope.getcarriercodes = function(vendorid){
        var cardesc                     =   $scope.ovcLabel.customerOrder.carrier;
        var selected_vendor_carriers    =   $scope.customerorders.shippings[vendorid].carriercode;
        alphacodes                      =   [];
        angular.forEach(selected_vendor_carriers,function(citem,key) {
            angular.forEach(CARRIERCODES,function(item) {
                if(item.Name == citem){
                    var newobj         = {};
                    newobj.id          = item.Name; 
                    newobj.description = cardesc[item.Name];
                    alphacodes.push(newobj);   
                }     
                
            });
        });
        $scope.customerorders.shippings[vendorid].alphacodes = alphacodes;
    }

    /****Calculation for SKU Quantity Change***/
     $scope.calcqtychange = function(pindex, qty, cost, ptotal, skucode, style,vendorid) {
        var skusarray   =   $scope.newmodule.skuslist[vendorid]['styles'][style]['skus']
        var stylecode   =   style;
        var nindex      =   pindex;
        var quantity    =   qty;
        var eachcost    =   parseFloat(cost).toFixed(2);
        var to_tal      =   (quantity * eachcost);
        var loc         =   $scope.customerorders.location;
        var prtax1 = tax_tot1 = sptax1 = spvat1 = sptaxes1 = spvates1 = tot_wtax1 = totalitax= 0;
        ovcDash.get('apis/ang_getproductprice?sku=' + skucode + '&loc=' + encodeURIComponent(loc)).then(function(result) {
            if ((result.status != 'error') && (result !='')) {
                var cost    =   parseFloat(result[0].ProductPrice.Cost).toFixed(2);
                var Tax1    =   result[0].ProductPrice.isVAT;
                var vTax1   =   result[0].ProductPrice.percentage;
                var totalc1 =   povat1 = vat_total1 = tot_vat1 = 0;
                var vatTax1 =   vTax1;
                var taxcal  =   parseFloat(vatTax1 / 100).toFixed(2);

              skusarray[nindex].taxisVAT = Tax1;
                if (Tax1 == 0) {
                    prtax1      =   parseFloat(to_tal * taxcal).toFixed(2);
                    sptax1      =   parseFloat(cost * taxcal).toFixed(2);
                    totalitax   =   parseFloat(prtax1) + parseFloat(to_tal);
                    totalc1     =   parseFloat(to_tal).toFixed(2);
                    skusarray[nindex].total            =   parseFloat(totalitax).toFixed(2);
                    skusarray[nindex].totalnotax       =   totalc1;
                    skusarray[nindex].totalProductTax  =   prtax1;
                    $scope.calcItems(nindex, qty, cost, totalc1, totalitax, prtax1, stylecode, vendorid);
                } else if (Tax1 == 1) {
                    tot_wtax1 = parseFloat(to_tal).toFixed(2);
                    povat1  =   parseFloat(to_tal * taxcal).toFixed(2);
                    spvat1  =   (cost * taxcal);
                    totalc1 =   parseFloat(to_tal).toFixed(2);
                    skusarray[nindex].total            =   tot_wtax1;
                    skusarray[nindex].totalnotax       =   totalc1;
                    skusarray[nindex].totalProductVat  =   povat1; 
                    $scope.calcItems(nindex, qty, pcost, totalc1, tot_wtax1, tax_tot1, stylecode, vendorid);
                }
            }
        }); 
    };

    $scope.decrease = function(index,skuqty,style,vendorid){

            $scope.newmodule.skuslist[vendorid]['styles'][style]['skus'][index].qty = $scope.newmodule.skuslist[vendorid]['styles'][style]['skus'][index].qty - 1;

    };

    $scope.increase = function(index,skuqty,style,vendorid){

            $scope.newmodule.skuslist[vendorid]['styles'][style]['skus'][index].qty = $scope.newmodule.skuslist[vendorid]['styles'][style]['skus'][index].qty + 1;

    };

    $scope.idminmax = function (value, min, index, style, vendorid){

            if(parseInt(value) < min || isNaN(value)) {
                $scope.newmodule.skuslist[vendorid]['styles'][style]['skus'][index].qty = min;
            }
            else{
                $scope.newmodule.skuslist[vendorid]['styles'][style]['skus'][index].qty = value;
            }
    };

    $scope.checkqtyempty    =   function(skuqty){

            if(skuqty == '' || skuqty == undefined){
                var output = {
                    "status": "error",
                    "message": $scope.ovcLabel.customerOrder.toast.qtyEmpty
                };
                Data.toast(output);
            }
    };


    /****Calculation for new SKU addition***/

    $scope.calcItems = function(pindex, qty, cost, ptotal, ptaxtot, vattax, style, vendorid) {
        
        var noitems2 = subtotal2 = ovtotal2 = iqty2 = itotal2 = iototal2 = itax2 = ivat2 =  noskus2 = taxvat2 = alltax2 = 0;
        angular.forEach($scope.newmodule.skuslist[vendorid]['styles'][style]['skus'], function(item) {
            if ((item.qty != undefined) && (item.qty != '')) {
                iqty2 = item.qty;
            } else {
                iqty2 = 0;
            }
            if ((item.total != undefined) && (item.total != ''))
                iototal2    =   item.total;
            if ((item.totalProductTax != undefined) && (item.totalProductTax != ''))
                itax2       =   item.totalProductTax;
            if ((item.totalProductVat != undefined) && (item.totalProductVat != ''))
                ivat2       =   item.totalProductVat;
            if ((item.totalnotax != undefined) && (item.totalnotax != '')) 
                itotal2     =   item.totalnotax;

            noitems2    =   parseInt(noitems2) + parseInt(iqty2);
            subtotal2   =   parseFloat(subtotal2) + parseFloat(itotal2);
            taxvat2     =   parseFloat(taxvat2) + parseFloat(ivat2);
            alltax2     =   parseFloat(alltax2) + parseFloat(itax2);
            ovtotal2    =   parseFloat(ovtotal2) + parseFloat(iototal2);    
        });
        $scope.newmodule.skuslist[vendorid]['styles'][style].qty      =   noitems2;
        $scope.newmodule.skuslist[vendorid]['styles'][style].total    =   ovtotal2;
        $scope.newmodule.skuslist[vendorid]['styles'][style].subtotal =   subtotal2;
        $scope.newmodule.skuslist[vendorid]['styles'][style].vat      =   taxvat2;
        $scope.newmodule.skuslist[vendorid]['styles'][style].tax      =   alltax2;
        $scope.updateprices();
    };

    /****Calculation for getting Overall Tax and Prices***/
    $scope.updateprices    =   function(){

        var allitems = allvat = alltax = allsubtotal =  alltotal =  allskus = allstyles= allvendors= 0;   
        angular.forEach( $scope.newmodule.skuslist,function(vendor,vendorid){
            allvendors++;
            var noskus = 0;
            var vendoritems = vendorvat = vendortax = vendorsubtotal =  vendortotal =  vendorskus =  0;
            var noitems = taxvat = alltax = subtotal =  ovtotal =  iqty = itotal = iototal =  itax = ivat =  noskus =  noskus = skuItem = 0;
            angular.forEach(vendor.styles, function(pritem, key) {
                allstyles++;
                var stylenoitems = styletaxvat = stylealltax =  stylesubtotal =  styleovtotal =  styleiqty = styleitotal = styleiototal =  styleitax = styleivat = 0;
                angular.forEach(pritem.skus, function(item) {
                    allskus++;
                    noskus++;
                    if ((item.qty != undefined) && (item.qty != '')) {
                        iqty = item.qty;
                    } else {
                        iqty = 0;
                    }
                    if ((item.total != undefined) && (item.total != ''))
                        iototal     =   item.total;
                    if ((item.totalProductTax != undefined) && (item.totalProductTax != '')) 
                        itax        =   item.totalProductTax;
                    if ((item.totalProductVat != undefined) && (item.totalProductVat != ''))
                        ivat        =   item.totalProductVat;
                    if ((item.totalnotax != undefined) && (item.totalnotax != '')) 
                        itotal      =   item.totalnotax;
                    noitems         =   parseInt(noitems)           +   parseInt(iqty);
                    subtotal        =   parseFloat(subtotal)        +   parseFloat(itotal);
                    taxvat          =   parseFloat(taxvat)          +   parseFloat(ivat);
                    alltax          =   parseFloat(alltax)          +   parseFloat(itax);
                    ovtotal         =   parseFloat(ovtotal)         +   parseFloat(iototal);
                    stylenoitems    =   parseInt(stylenoitems)      +   parseInt(iqty);
                    stylesubtotal   =   parseFloat(stylesubtotal)   +   parseFloat(itotal);
                    styletaxvat     =   parseFloat(styletaxvat)     +   parseFloat(ivat);
                    stylealltax     =   parseFloat(stylealltax)     +   parseFloat(itax);
                    styleovtotal    =   parseFloat(styleovtotal)    +   parseFloat(iototal);
                });
                pritem.qty          =   parseInt(stylenoitems);
                pritem.total        =   parseFloat(styleovtotal).toFixed(2);
                pritem.subtotal     =   parseFloat(stylesubtotal).toFixed(2);
                pritem.vat          =   parseFloat(styletaxvat).toFixed(2);
                pritem.tax          =   parseFloat(stylealltax).toFixed(2);

                vendoritems         =   parseInt(vendoritems)       +   parseInt(pritem.qty) 
                vendorvat           =   parseFloat(vendorvat)       +   parseFloat(pritem.vat) 
                vendortax           =   parseFloat(vendortax)       +   parseFloat(pritem.tax)
                vendorsubtotal      =   parseFloat(vendorsubtotal)  +   parseFloat(pritem.subtotal)
                vendortotal         =   parseFloat(vendortotal)     +   parseFloat(pritem.total)
            });

            vendor.no_of_skus   =   parseInt(noskus);
            vendor.qty          =   parseInt(vendoritems);
            vendor.total        =   parseFloat(vendortotal).toFixed(2);
            vendor.subtotal     =   parseFloat(vendorsubtotal).toFixed(2);
            vendor.vat          =   parseFloat(vendorvat).toFixed(2);
            vendor.tax          =   parseFloat(vendortax).toFixed(2);

            allitems            =   parseInt(allitems)       +   parseInt(vendor.qty);
            allvat              =   parseFloat(allvat)       +   parseFloat(vendor.vat); 
            alltax              =   parseFloat(alltax)       +   parseFloat(vendor.tax); 
            allsubtotal         =   parseFloat(allsubtotal)  +   parseFloat(vendor.subtotal); 
            alltotal            =   parseFloat(alltotal)     +   parseFloat(vendor.total);

        });

        $scope.customerorders.allstyles     =   parseInt(allstyles) ;
        $scope.customerorders.allskus       =   parseInt(allskus) ;
        $scope.customerorders.allvendors    =   parseInt(allvendors) ;
        $scope.customerorders.allitems      =   parseInt(allitems);
        $scope.customerorders.allvat        =  parseFloat(allvat).toFixed(2);
        $scope.customerorders.alltax        =  parseFloat(alltax).toFixed(2);
        $scope.customerorders.allsubtotal   =  parseFloat(allsubtotal).toFixed(2);
        $scope.customerorders.alltotal      =  parseFloat(alltotal).toFixed(2);
    };

    /**Delete Skus from Drop Ship**/
    $scope.deleteskus   =   function(id,style,vendor,vendorid){
       
        var pqty        =   ptotal  =   alltotal    =    alltax  =  allvat  =   0;
        var style       =   this.sku.style;
        var selsku      =   this.sku.sku;
        var idx         =   this.$index;
        var vendorgroup = {};
        
        if (idx != -1) {
           if( this.sku.id != '' ) {
    
                var dropsku = this.sku.id;
                $.confirm({
                    title:$scope.ovcLabel.customerOrder.delete,
                    content: $scope.ovcLabel.customerOrder.actions.delete+'?',
                    confirmButtonClass: 'btn-primary',
                    cancelButtonClass: 'btn-primary',
                    confirmButton: 'Ok',
                    cancelButton: 'Cancel',
                    confirm: function() {
                        Data.delete('/dropshipSKUs?id=' + dropsku).then(function(data) {
                            if(data.error==undefined ){
                                var output = {
                                    "status": "success",
                                    "message": $scope.ovcLabel.customerOrder.toast.sku_deleted
                                };
                                Data.toast(output);
                                var whatIndex = null;
                                angular.forEach($scope.newmodule.list, function(item, index) {
                                    if (item.id === dropsku) {
                                        whatIndex = index;
                                        vendorgroup["vendor"]=item.vendorid;
                                    }
                                }); 
                                $scope.newmodule.list.splice(whatIndex, 1);
                                $scope.newmodule.skuslist=VendorGroupService.getvendorstylegroup( $scope.newmodule.list);
                                if($scope.newmodule.skuslist[vendorgroup.vendor]==undefined){
                                    
                                    delete $scope.customerorders.shippings[vendorgroup.vendor];
                                }
                                $scope.updateprices();

                            }
                        },function(error){
                        });             
                    },
                    cancel: function() {
                        return false;
                    }
                });
                
            }else{
                
               var skuIndex = null;
               angular.forEach($scope.newmodule.list, function(item, index) {
                    if ((item.sku ==selsku ) && (item.vendorid == vendorid)) {
                        skuIndex = index;
                        vendorgroup["vendor"]=item.vendorid;
                    }
               });
               $scope.newmodule.list.splice(skuIndex, 1);
               $scope.newmodule.skuslist=VendorGroupService.getvendorstylegroup( $scope.newmodule.list);
                if($scope.newmodule.skuslist[vendorgroup.vendor]==undefined){
                    
                    delete $scope.customerorders.shippings[vendorgroup.vendor];
                }
               $scope.updateprices();
            }
        }
    };

    /**Delete StyleGroup from Drop Ship**/
    $scope.deleteStyleGroup     =   function(idx,vendor,vendorid){
        if (idx != -1) {
            
            var vendorgroup         = {};
            vendorgroup.styleitems  = [];
            angular.forEach($scope.newmodule.list, function(item, index) {
                
                if ((item.style ==idx ) && (item.vendorid == vendorid)) {
                    if(item.id !=''){
                        var orditem_id = item.id;
                        Data.delete('/dropshipSKUs?id=' + orditem_id).then(function(data) {

                        },function(error){
                        });
                    }
                    vendorgroup.styleitems.push(index);
                    vendorgroup["vendor"]=item.vendorid;
                }
            });
            angular.forEach(vendorgroup.styleitems.reverse(), function(item) {
                $scope.newmodule.list.splice(item, 1);
            });
            $scope.newmodule.skuslist=VendorGroupService.getvendorstylegroup( $scope.newmodule.list);
            if($scope.newmodule.skuslist[vendorgroup.vendor]==undefined){
                delete $scope.customerorders.shippings[vendorgroup.vendor];
            }

            $scope.updateprices();
        } 
    };
    $scope.validation      =   function(data,add){
        $scope.tab.error={};
        $scope.tab.errormsg={};
        try{
            if(data.location  ==  undefined || data.location == ''){
                throw {'id' : 'location', 'message' : $scope.ovcLabel.customerOrder.error.originated_from_store};
            }
            if(add){
                    if((data.skuresult) || (data.styleresult)){
                    }else{
                        throw {'id' : 'skuresult', 'message' : $scope.ovcLabel.customerOrder.error.add_sku };

                    }
            }else{
                if(Object.keys($scope.newmodule.skuslist).length == 0){
                    throw {'id': 'skuresult', 'message' : $scope.ovcLabel.customerOrder.error.add_sku}
                }
            }
        }
            catch(error){
                console.log(error,'ERROR');
                if(data.location  ==  undefined || data.location == '')
                    angular.element('.selectstore').focus();
                else if(Object.keys($scope.newmodule.skuslist).length == 0)
                    angular.element('.sku_result').focus();
            $scope.tab.error[error.id]=true;
            $scope.tab.errormsg[error.id]=error.message;
            $scope.tab.page     =   1;
            $location.hash('top');
            $anchorScroll();
            return false;
        }
        return true;
    }
    $scope.nextpage    =   function(data,page){
        if($scope.validation(data) && page)
            $scope.tab.page = page+1;
    }

    $scope.moveNextPreviousBtn = function(id){
        $timeout(function() {
            angular.element('#'+id).trigger('click');
        }, 1);
    };

    /*****Delete Customer Order********/
    $scope.deleteorder    =   function(){
        
        $.confirm({
            title: $scope.ovcLabel.customerOrder.title_delete,
            content: $scope.ovcLabel.customerOrder.actions.delete+'?',
            confirmButtonClass: 'btn-primary',
            cancelButtonClass: 'btn-primary',
            confirmButton: 'Ok',
            cancelButton: 'Cancel',
            confirm: function () {
                Data.delete('/dropship/'+ customer_orderid).then(function (data) {
                    if(data.ok == 1){
                        var output={"status":"success","message":$scope.ovcLabel.customerOrder.order_deleted};
                       
                        $state.go('ovc.customerorders-list');
                    }else{
                        var output={"status":"error","message":$scope.ovcLabel.customerOrder.order_dfailed}; 
                    }
                    Data.toast(output);
                },function(error){
                });  
            },
            cancel: function () {
                return false;
            }
        });
        return false;
    };
//do
    $scope.submit_dropship = function(status,qtystatus){
       
        var orderdata = $scope.customerorders;
        if($scope.validation(orderdata)){
             var newobj    = {
            purchaseOrderType: orderdata.ordertype,
            contactName: orderdata.contactName,
            toStreetName: orderdata.toStreetName,
            toStreetNumber: orderdata.toStreetNumber,
            toCity: orderdata.toCity,
            toPostalCode: orderdata.toPostalCode,
            toCountry: orderdata.toCountry,
            toPhoneNumber: orderdata.toPhoneNumber,
            numberOfProducts: orderdata.allitems,
            numberOfSKU:orderdata.allskus,
            numberOfVendors:orderdata.allvendors,
            numberOfStyles:orderdata.allstyles,
            totalPoCost: orderdata.alltotal,
            totalPoVAT: orderdata.allvat,
            totalPoTax: orderdata.alltax,
            PoSubtotal: orderdata.allsubtotal,
            specialInstructions: orderdata.specialInstructions,
            location: orderdata.location,
            email:orderdata.email,
            orderStatus: status
        }
        if(status == 'draft'){
            var opmessage = $scope.ovcLabel.customerOrder.toast.order_saved;
        }else if(status == 'submitted'){
            var opmessage = $scope.ovcLabel.customerOrder.toast.order_created;
        }
        

       if($scope.newmodule.title  ==   "Edit"){
            if(status == 'draft'){
                 var opmessage = $scope.ovcLabel.customerOrder.toast.order_updated;
             }

            Data.post('/dropship/'+ customer_orderid, {
                data: newobj
            }).then(function(results) {
                
                if ((results.ok == 1) && (results.ok != undefined)) {
                    var porderno      = orderdata.purchaseOrderNumber;
                    var prodlist      = [];
                    var itemqtylist   = [];
                    var productorders = $scope.newmodule.list;
                    var trancreate=true;
                
                    angular.forEach(productorders, function(item,key) {
                        
                        var dataobj = {
                                //_id:item.id,
                                lineNumber : item.lineNumber,
                                SKU: item.sku,
                                productCode:item.style,
                                productName: item.description,
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
                                contactName: orderdata.contactName,
                                toStreetName: orderdata.toStreetName,
                                toStreetNumber: orderdata.toStreetNumber,
                                toCity: orderdata.toCity,
                                toPostalCode:orderdata.toPostalCode,
                                toCountry: orderdata.toCountry,
                                toPhoneNumber:  orderdata.toPhoneNumber,
                                location: orderdata.location,
                                variants: item.variants,
                                // waist:item.waist,
                                // length:item.length,
                                // size:item.size,
                                styleColor:item.styleColor,
                                vendorId:item.vendorid,
                                vendorData:{
                                    vendorId:item.vendorid,
                                    carrierCode:orderdata.selectedvendors[item.vendorid],
                                    vendorOrderNumber:$scope.newmodule.skuslist[item.vendorid]['vendorOrderNumber']
                                }
                            }

                            if(item.id != ''){
                                dataobj['_id']=item.id;
                            }
                            prodlist.push(dataobj);

                             var nqtyobj = {
                                    purchaseOrderType: orderdata.ordertype,
                                    location: orderdata.location,
                                    producUom: item.selectedUOM,
                                    skuCost: item.cost,
                                    sku: item.sku,
                                    qty: item.qty,
                                    poId: porderno,
                                    qtyStatus: qtystatus,
                                    trancreate:trancreate
                                }
                            itemqtylist.push(nqtyobj)
                                trancreate?trancreate=false:'';
                                
                    });
                    var  orderdetails   =   JSON.stringify(prodlist);

                    var alldata={
                        purchaseOrderNumber: porderno,
                        skus:orderdetails
                    }
                    
                    Data.post('/dropshipSKUs', {
                        data:alldata
                    }).then(function(data) {
                        Data.put('/createqtystatus', {
                            data:{
                                data:itemqtylist
                            }
                        }).then(function(result) {
                            var output={"status":"success","message":opmessage}; 
                            Data.toast(output);
                            // point
                            $state.go('ovc.customerorders-list');

                        },function(error){
                        }); 
                    },function(error){
                    });
                }   
            },function(error){
            });

       }else{

            Data.put('/dropship', {
                data: newobj
            }).then(function(results) {
                if ((results.__v == 0) && (results.__v != undefined)) {
                    var orderid       = results._id;
                    var porderno      = results.purchaseOrderNumber;
                    var prodlist      = [];
                    var itemqtylist   = [];
                    var productorders = $scope.newmodule.list;
                    var trancreate=true;
                    angular.forEach(productorders, function(item,key) {
                        var dataobj = {
                                lineNumber : item.lineNumber,
                                SKU: item.sku,
                                productCode:item.style,
                                productName: item.description,
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
                                contactName: orderdata.contactName,
                                toStreetName: orderdata.toStreetName,
                                toStreetNumber: orderdata.toStreetNumber,
                                toCity: orderdata.toCity,
                                toPostalCode:orderdata.toPostalCode,
                                toCountry: orderdata.toCountry,
                                toPhoneNumber:  orderdata.toPhoneNumber,
                                variants:item.variants,
                                // waist:item.waist,
                                // length:item.length,
                                // size:item.size,
                                styleColor:item.styleColor,
                                vendorId:item.vendorid,
                                location: orderdata.location,
                                vendorData:{
                                    vendorId:item.vendorid,
                                    carrierCode:orderdata.selectedvendors[item.vendorid],
                                    vendorOrderNumber:$scope.newmodule.skuslist[item.vendorid]['vendorOrderNumber']
                                }
                            }
                            prodlist.push(dataobj);

                            var nqtyobj = {
                                    purchaseOrderType: orderdata.ordertype,
                                    location: orderdata.location,
                                    producUom: item.selectedUOM,
                                    skuCost: item.cost,
                                    sku: item.sku,
                                    qty: item.qty,
                                    poId: porderno,
                                    qtyStatus: qtystatus,
                                    trancreate:trancreate
                                }
                            itemqtylist.push(nqtyobj)
                                trancreate?trancreate=false:'';
                                
                    });
                    
                    var  orderdetails   =   JSON.stringify(prodlist);
                    var alldata         =   {
                        purchaseOrderNumber: porderno,
                        skus:orderdetails
                    }
                   
                    Data.post('/dropshipSKUs', {
                        data:alldata
                    }).then(function(data) {
                        Data.put('/createqtystatus', {
                            data:{
                                data:itemqtylist
                            }
                        }).then(function(result) {
                            var output={"status":"success","message":opmessage};
                            Data.toast(output);
                            var fromPage    =   $scope.getUrlParameter('fromPage');

                            if(fromPage != "pos") {
                                $state.go('ovc.customerorders-list');
                            } else {
                                debugger;
                                var ovcdid = $scope.getUrlParameter("ovcdid");;
                                var ovcsid = $scope.getUrlParameter("ovcsid");;
                                var ovclid = $scope.getUrlParameter("ovclid");
                                var sku    =   $scope.getUrlParameter("sku"); 
                                var productQty  =   "1";

                                var xhr = new XMLHttpRequest();
                                var url = 'https://dev.ovcdemo.com:4443/json/process/execute/AddToReceipt';
                                xhr.open('POST', url, true);
                                xhr.setRequestHeader('Content-type', 'application/json');
                                var params = {
                                    "retailerId": "defaultRetailer",
                                    "ovcdid": ovcdid,
                                    "ovcsid": ovcsid,
                                    "ovclid": ovclid,
                                    "payload": {
                                        "listItems": [{
                                            "productId":sku,
                                            "productQty": productQty,
                                            "findItType": "ship_home",
                                            "pickupStoreId": $scope.customerorders.location,
                                            "findItOrder": "Ship To Home",
                                            "name": ""
                                        }]
                                    }
                                };
                                xhr.send(JSON.stringify(params));  
                            }
                        },function(error){
                        }); 
                    },function(error){
                    });        
                }  
            },function(error){
            });
       }

        }  
    }

    $scope.getUrlParameter = function (name) {

        var url_string = window.location.href;
        var queryString = url_string.substring(url_string.indexOf('?'));

        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(queryString);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    };

    $scope.getorderdata=function (){

        if((customer_orderid != 0) ||(copy_customer !=0)){
            var orderresult = $scope.customerorders = {};
            $scope.customerorders.shippings         = {};
            Data.get('/dropship?id=' + customer_orderid).then(function(data) {
                var orderno= data.purchaseOrderNumber;
                $scope.getOrdertype(data.purchaseOrderType);
                $scope.getlocation_details(data.location);
                $scope.customerorders.ordertype          = data.purchaseOrderType;
                $scope.customerorders.contactName        = data.contactName;
                $scope.customerorders.toStreetName       = data.toStreetName;
                $scope.customerorders.toStreetNumber     = data.toStreetNumber;
                $scope.customerorders.toCity             = data.toCity;
                $scope.customerorders.toPostalCode       = data.toPostalCode;
                $scope.customerorders.toCountry          = data.toCountry;
                $scope.customerorders.toPhoneNumber      = data.toPhoneNumber;
                $scope.customerorders.allitems           = data.numberOfProducts;
                $scope.customerorders.allskus            = data.numberOfSKU;
                $scope.customerorders.allvendors         = data.numberOfVendors;
                $scope.customerorders.allstyles          = data.numberOfStyles,
                $scope.customerorders.alltotal           = data.totalPoCost;
                $scope.customerorders.allvat             = data.totalPoVAT;
                $scope.customerorders.alltax             = data.totalPoTax;
                $scope.customerorders.allsubtotal        = data.PoSubtotal;
                $scope.customerorders.specialInstructions= data.specialInstructions;
                $scope.customerorders.location           = data.location;
                $scope.customerorders.email              = data.email;
                $scope.customerorders.orderStatus        = data.orderStatus;

                if(copy_customer == 0)
                $scope.customerorders.purchaseOrderNumber= data.purchaseOrderNumber;

                var selectedvendors = {};
                var vendorids       =   [];
                
                Data.get('/dropshipSKUs/' + orderno).then(function(results) {

                    var productlist=[];
                    angular.forEach(results, function(item,key) {                   
                        if(copy_customer == 0){
                            var itemid = item._id;
                        }else{
                            var itemid = '';
                        }
                        var quantities = parseInt(item.qty);
                        var prcost = parseFloat(item.productCost).toFixed(2);
                        var prtcost = parseFloat(item.totalProductCost).toFixed(2);
                        var prttax= parseFloat(item.totalProductTax).toFixed(2);
                        var prttotal=prtcost+prttax;
                        if (item.isVat == '0' ) {
                            var totwithtax = parseFloat(prttotal).toFixed(2);
                        } else {
                            var totwithtax = parseFloat(item.totalProductCost).toFixed(2);
                        }
                        vendorids.push(item.vendorData['vendorId']);
                        selectedvendors[item.vendorData['vendorId']]=item.vendorData['carrierCode'];
                        var dataobj = {
                            lineNumber:item.lineNumber,
                            sku:item.SKU,
                            style:item.productCode,
                            description:item.productName,
                            selectedUOM:item.producUom,
                            cost:item.productCost,
                            productTax:    item.productTax,
                            productVat:item.productVat,
                            totalProductTax:  item.totalProductTax,
                            totalProductVat:  item.totalProductVat,
                            taxisVAT:  item.isVat,
                            qty: quantities,
                            totalnotax: prtcost,
                            variants: item.variants,
                            // waist: item.waist,
                            // length: item.length,
                            // size: item.size,
                            styleColor: item.styleColor,
                            styleDescription:item.styleDescription,
                            vendorid:item.vendorData['vendorId'],
                            vendor:item.vendorData['vendorId'],
                            vendorname:item.vendorData['vendorId'],
                            vendorOrderNumber:item.vendorData['vendorOrderNumber'],
                            carrierCode:item.vendorData['carrierCode'],
                            id:itemid,
                            styleDescription:item.styleDescription,
                            total: totwithtax
                           
                            }
                            productlist.push(dataobj);
                    });

                    $scope.customerorders.selectedvendors = selectedvendors;
                    $scope.newmodule.list                 = productlist;
                    $scope.newmodule.skuslist             = VendorGroupService.getvendorstylegroup( $scope.newmodule.list);
                    var vendorgroups                      = [];
                    $scope.customerorders.shippings       = {};
                    Data.post('/vendor',{
                        data:{
                            vendors:vendorids
                        }   
                    }).then(function (response) {

                        angular.forEach(response, function(values,key) {

                            var carrierdata  = [];
                            var carriercodes = values.carrierAlphaCode;
                            carrierdata      = carriercodes.split(',');
                            var newobj       =  {
                                vendorid:values._id,
                                vendorname:values.companyName,
                                carriercode:carrierdata
                            }
                           
                            $scope.customerorders.shippings[values._id]=newobj;
                            $scope.getcarriercodes(values._id);

                        });
                    },function(error){
                    });      
                },function(error){
                });
            },function(error){
            });
        }
    }
    $scope.getorderdata();
}
});


