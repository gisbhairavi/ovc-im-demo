var app = angular.module('OVCstockApp',['skuMatrix','roleConfig']);
app.controller('skuController',function ($rootScope, $scope, $state, $http,$compile, $stateParams,  $timeout,  Data, ovcDash, system_currencies,Utils,ORGANIZATIONSTRUCTURE,TreeViewService,$location,OVC_CONFIG,labelService){
    var widgetFrame = $state.current.name;
    if($location.path() == '/findItPage'){
        var userObj = {'username':'oneview','psswrd':'0n3v13w905'};
        userFindIt(userObj,true);
        $scope.userObj=true;
    }
    function userFindIt(customer,vars){
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
                            var findItPage = true;
                            
                            labelService.getResources(findItPage).then(function(res){
                                $rootScope.ovcLabel = res;
                                delete localStorage.Roles; 
                                Utils.roles();
                                skuFindIT();
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
     
     if($location.path() !== '/findItPage'){ skuFindIT();}   

function skuFindIT(){ 
	$scope.findit1                = [];
	$scope.findstore              = {};
    $scope.findstore.ordernumbers = [];
    $scope.findstore.transfername = {};
    $scope.selectedstores         = {};
    $scope.findstore.searchvalue  = [];
    $scope.findstore.saveasdraft  = false;
    $scope.findstore.addtoexist   = true;
    $scope.findstore.productprice = {};
    $scope.action                 = {};
    $scope.limit                  = 3;
    $scope.ship                   =   {};
    $scope.findstore.locid = '';
    $scope.showStylesData  =   {};
    $scope.loadmat      =   true;
    var user_detail     =   $rootScope.globals['currentUser'];
    var user_id         =   user_detail['username'];
    $scope.user_stores  =   [];
    $scope.selectedstores.locations = [];
    $scope.showstores   =   false;
    $scope.user_assigned=   [];
    $scope.purchase     =   false;
    $scope.errormsg     =   false;
    var count           =   1;
    $scope.collapse_franchies   =   true;
    $scope.collapse_vendor      =   true;
    var user_detail=$rootScope.globals['currentUser'];
    var id_user=user_detail['username'];
    $scope.ovcLabel.global?$scope.currencylabel  =   $scope.ovcLabel.global.currency:$scope.currencylabel  =   $scope.ovcLabel.findit.currency;
    $scope.currencylist   =   [];
    var sysOrganization =  ORGANIZATIONSTRUCTURE;
    $scope.findstore.showError  =   false;

    //for strating Delete the session on this page 
    if($stateParams.fullList){
        delete sessionStorage.stocksku;
        delete sessionStorage.finditsku;
        delete sessionStorage.prodata;
        delete sessionStorage.lookUpAction;
    }
    
    Utils.hierarchylocationAll().then(function(hieLocAll){
        $scope.allhierarchy     =   TreeViewService.getLocData(hieLocAll);
        $scope.CorparateLocationData    =   [];
        $scope.allhierarchy.forEach(function (item) {
            recur(item, 0, $scope.CorparateLocationData);
        });
    });

    Utils.configurations().then(function(configData){
        $scope.config    =   configData;
    });    

     var organizationObj = {};
    angular.forEach(sysOrganization,function(item){
            organizationObj[item.id]= item.code;
    });
    $scope.organizationStruct = organizationObj;

     var times = function (n, str) {
        var result = '';
        for (var i = 0; i < n; i++) {
            result += str;
        }
        return result;
    };

    var recur = function (item, level, arr) {
        arr.push({
            displayName: item.name,
            id: item.id,
            level: level,
            indent: times(level, '\u00A0\u00A0'),
            type: (item.type === 'Store')?false:true
        });

        if (item.children) {
            item.children.forEach(function (item) {
                recur(item, level + 1, arr);
            });
        }
    };

    $scope.back=function(){
        $state.go('ovc.stocklookup-list');
	}
    
    //For Focus Defaultly 
    $timeout(function(){
        angular.element('#looksearchfindit').focus();
    });

    function configuration(){
        Utils.configurations().then(function(config){
            if( config ){
                $scope.config_data  =   config.action.stockPr;
                $scope.config       =   config;
            }
            userLocation();
        }, function(error){
            console.log('Configuaration Error :' + error);
            userLocation();
        });
    }
    configuration();
    function userLocation(){
        Utils.userLocation(1).then(function(stores){
            angular.forEach(stores,function(value){
                if($scope.selectedstores.locations.indexOf(value.id)==-1){
                    $scope.selectedstores.locations.push(value.id);
                }
                $scope.currencylist[value.id]    =   value.currency;
            });
            if(stores.status=='error'){
                $scope.findstore.storedatas = [];
            }else{
                $scope.findstore.storedatas = stores;
            }

            if($stateParams.sku !== undefined ){ 
                ovcDash.get('apis/ang_search_products?srch='+$stateParams.sku+'&locid='+$stateParams.location).then(function(data){
                    if(data.status!=="error"){
                        $scope.searchfindit(data[0].ProductTbl.sku);
                    }     
                    else{
                        var output = {"status": "error","message": "Selected SKU is not available in the store."};
                        Data.toast(output);
                    }
                });
            }

            //FOR STOCKLOOKUP TO REDIRECT
            if(sessionStorage.prodata){
                $scope.stocklookup  =   true;
                var storedData      =   JSON.parse(sessionStorage.prodata);
                $scope.ship.result  =   storedData.sku+'~'+storedData.description+'~'+storedData.barCode;
                sessionStorage.commonSku     =   $scope.ship.result;
                $scope.searchfindit($scope.ship);
            }
        }, function(error){
            console.log('User Location Error :' + error);
        });
        console.log($scope.selectedstores.locations,'LOCATIONS');
    }
    


    /****Get Location Details ******/
	$scope.getLocation  =   function() {

        Utils.hierarchylocation().then(function(results){
            $scope.userHierarchyLoc     =   TreeViewService.getLocData(results);
            $scope.userHierarchyLocData    =   [];
            $scope.userHierarchyLoc.forEach(function (item) {
                recur(item, 0, $scope.userHierarchyLocData);
            });
            $scope.orderAfs = results;
        }, function(error){
            console.log('Hierarchy Location Error :' + error);
        });
    };
    $scope.getLocation();
    $scope.storevalue={};
    $scope.storevalue.siblingstores=[];
    $scope.dosrchproduct = function(typedthings, callback){
        if (sessionStorage.lookUpAction && sessionStorage.lookUpAction === "FindIt")
            return false;

        $scope.transactionstyles    =   [];

            var loc_id=$scope.findstore.locid;

        if(typedthings != '...'  && typedthings != '' && typedthings != undefined){

            var loc_id=$scope.findstore.locid;
            
            if((loc_id != undefined)){
            var sku=typedthings.split('~').length==3?true:'';
            var skutyped     =   [];
            var skuvaluetyping  =   [];
            if(typedthings.indexOf('~')){
                skuvaluetyping      =   typedthings.split('~');
                skutyped            =   skuvaluetyping[0];
            }
            else
                skutyped         =   typedthings;
                //ovcDash.get('apis/ang_loc_products?srch='+typedthings+'&locid='+loc_id).then(function (data) {barCode
                ovcDash.get('apis/ang_search_products?srch='+skutyped+'&locid='+ encodeURIComponent(loc_id)).then(function (data) {
                    
                    if (data.status != 'error') {
                        $scope.errormsg     =   true;
                        var rows = [];
                        var allvals = [];
                        var styleData = [];
                        var groupData = [];
                        var selectedbarcode = [];
                        var countbarcode = 0;
                        angular.forEach(data, function(item) {
                           
                            if ($scope.config.showskugroup && styleData.indexOf(item.ProductTbl.productCode) == -1) {
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
                           
                            allvals.push(item.ProductTbl);
                        });
                        $scope.transactions = rows;
                        $scope.allvalues = allvals;
                        if ($scope.allvalues.length == 1 && $scope.allvalues[0].sku != undefined) {
                            $scope.selSkuData = $scope.allvalues[0];
                            // callback($scope.selSkuData);
                        }
                        if($scope.allvalues.length == 1 && countbarcode == 1 ){
                            // $scope.ship.result  = selectedbarcode[0];
                            $scope.transactions = [];
                            $scope.searchfindit($scope.ship);
                        }
                        //For empty the acto complete Data and proper error message
                        if(!$scope.ship.result){
                            $scope.transactions =   [];
                        }
                    }
                    else{
                        var output = {
                          "status": "error",
                          "message": $scope.ovcLabel.findit.list.no_product
                        };
                        $scope.transactions =   [];
                        $scope.ship.result  =   '';
                        Data.toast(output);
                    }
                });
            }else{
            
                $timeout(function() {
                    angular.element('#loclookup').trigger('click');
                }, 1);
            
            }
        }
    };
  
    $scope.doSelectproduct = function(suggestion){
        var selects = suggestion.split('~');
        var selectedpr=suggestion;
        $scope.ship = { locationId: $scope.ship.locationId, result:selectedpr,styleresult:'',mode:"readOnly"};
        $scope.searchfindit($scope.ship);
    };
    $scope.searchfindit=function(data){
        if($scope.ship.result || data){
            if(sessionStorage.stocksku){
                var searchResult    =   sessionStorage.stocksku.split('~');
            }else{
                if(data.result && data.result != ''){
                     var searchResult    =   data.result.split('~');
                }
                if($stateParams.sku !== undefined){
                    var selectedData    =   data;
                    // return false;
                }

            }
            var datasrchsku     =   '';
            $scope.showError    =   false;
            if(searchResult != undefined) 
            var selectedData    =   searchResult[0];
            if(searchResult != undefined) 
            $scope.SKUtrue      =   searchResult.length==3?true:false;
            if($scope.config.showskugroup)
            var configvalue     =   "style";
            if(!$scope.config.showskugroup)
            var configvalue     =   "sku";
            $scope.skuValues    =   '';
            $scope.srch         =   selectedData;
            ovcDash.get('apis/ang_getProductDetails?srch='+$scope.srch+'&config='+configvalue).then(function (ReportData) {
                $scope.StyleArray   =   [];
                if(ReportData && ReportData.status != "error"){
                    $scope.StyleArray   = ReportData;
                    if($scope.StyleArray){
                            $scope.styleconfig($scope.StyleArray.Style,configvalue);
                    }
                    $scope.transactions =   [];
                }
                else{
                    count   =   1;
                    $scope.transactions =   [];
                }
            },function(error){
                console.log(error,'ERROR');

            });
        }else{
            var output = {"status": "error","message": $scope.ovcLabel.findit.error.srch_field};
            Data.toast(output);
        }
    };
    $scope.styleconfig = function(style,config){
        if(config == "style"){
            if($scope.SKUtrue){
                $scope.searchdata   = 'SKU';
                // $scope.selsku       =   $scope.srch;
            }
            $scope.styleitems={locationId:$scope.selectedstores.locations,styleresult:style,mode:"noOH"};
            angular.element(document.getElementById('finditstylematrix'))
                .html($compile('<style-matrix></style-matrix>')($scope));
        }if(config == "sku"){
            $scope.getselectedsku($scope.srch);
        }
        $scope.errormsg     =   false;
        count               =   1;
    };
    $scope.getselectedsku = function(sku){

        $scope.showstores               =   true;
        var location                    =   $scope.selectedstores.locations;
        $scope.action.selecetedSku      =   sku;
        $scope.action.skuDescription    =   $scope.StyleArray.description;
        $scope.srchavailable(location,$scope.action.selecetedSku);
        $scope.ship.result = '';
    };

    if(sessionStorage.stocksku){
        $scope.ship.result = sessionStorage.stocksku;
        $scope.searchfindit($scope.ship.result);
    }
        
    $scope.srchvendordetail=function(selsku){
        $scope.storevalue.vendorsvalue = [];
        $scope.storevalue.vendorsvalue1 = [];
        $scope.storevalue.vendorsvalue2 = [];
        var data                       = {vendorSKUs:selsku};
        var datavalue                  = {data:data};
    	Data.post('/vendorByProduct',datavalue).then(function(response){
    		if( (response.error=="No SKUs.") ){
    			 $scope.storevalue.vendorsvalue1 = [];
    		}
    		else{
                angular.forEach(response.result[selsku],function(value){
                    $scope.storevalue.vendorsvalue.push(value);
                })
                $scope.storevalue.vendorsvalue1.push(response.result[selsku]);
                 // $scope.storevalue.vendorsvalue.push(response.result[selsku]);
            }
        },function(error){});
        Data.get('/vendor?isPrimaryVendor='+true).then(function (data) {
            angular.forEach(data,function(value){
                 $scope.storevalue.vendorsvalue2.push(value);
                 $scope.storevalue.vendorsvalue.push(value);
            });
        });
        $scope.storevalue.vendorsvalue = $scope.storevalue.vendorsvalue1.concat($scope.storevalue.vendorsvalue2);
    }

    $scope.sample={};
    $scope.srchavailable=function(loc,selsku){
        ovcDash.get('apis/ang_getsibilingdata?locid='+ encodeURIComponent(loc) +'&sku='+selsku).then(function(results){
            var user = {};   
            var userLocationSingle  =   [];
            angular.forEach(results,function(value){
                if($scope.selectedstores.locations.indexOf(value.id) >= 0){
                    user[value.id] = true;
                }
                //Hotfix for NRF
                ovcDash.post('apis/ang_getproductprice',{data:{sku:selsku,loc:value.id}}).then(function (ovcdata) {
                    if(ovcdata.status != 'error')
                    value.cost  =   ovcdata[0].ProductPrice.Cost;
                });
            });
            $scope.sample = user;
            if(results.status=='error'){
                    $scope.storevalue.siblingstores = [];
            }
            else{
                //if the user is assigned to one store 
                if(loc.length == 1){
                    angular.forEach(results,function(store,storekey){
                        if(loc[0] != store.id){
                            userLocationSingle.push(store);
                        }
                    });
                    $scope.storevalue.siblingstores     =   userLocationSingle;
                }else{
                    $scope.storevalue.siblingstores=results;
                }
            }
                
        });
        
        $timeout(function(){
            Data.get('/locationiteminventory?locationId='+encodeURIComponent(loc)+'&sku='+selsku).then(function(results){
            var franchisestores = $scope.storevalue.siblingstores;
            $scope.franchies1 = [];
            angular.forEach(franchisestores,function(frstores){
                frstores.atsvalue = 0;
                if((results[frstores.id] != undefined) && (results[frstores.id] != '') ){
                    var balances = results[frstores.id][selsku];
                    angular.forEach(balances,function(data){ 
                        if(data.balanceType == 'ats'){
                            frstores.atsvalue = parseInt(data.value) ;
                        }
                    });                    
                }
                if(frstores.atsvalue > 0){
                    if(widgetFrame === 'findItFrame'){
                        if($state.params.locationId !== frstores.id){
                            $scope.franchies1.push(frstores);
                        }
                    }
                    else{
                        $scope.franchies1.push(frstores);
                    }
                }
            });     
        },function(error){});
                },1000);
        $scope.srchvendordetail(selsku);
        if(sessionStorage.stocksku){
            delete sessionStorage.stocksku;
        }

    }
    var purchaseOrdernumber=[];
    
    $scope.redirect = function(sku,locId,locName){
        var location    =   {};
        location.id  = locId;
        location.name = locId;
        sessionStorage.location     =   JSON.stringify(location);
        ovcDash.get('apis/ang_search_products?srch='+sku+'&locid='+ encodeURIComponent($scope.selectedstores.locations)).then(function (data) {
            if(data && data[0].ProductTbl){
                sessionStorage.stocksku     =   data[0].ProductTbl.sku+'~'+data[0].ProductTbl.description+'~'+data[0].ProductTbl.barCode;
            }
        }).then(function(){
            $state.go('ovc.stocklookup-list');
        });
    }

    $scope.loadmore=function(){
           $scope.limit = $scope.franchies1.length;
    }
    $scope.loadless=function(){
        $scope.limit = 3;
    }
    $scope.storevalue.popupLoc=[];

    //For max Qty Checking with ATS
    $scope.getskuqty    =   function(orderType,locationId,changedQty){
        if($scope.findstore.checkQty < changedQty){
            var output={"status":"error","message":$scope.ovcLabel.findit.error.qty_exceed};
            Data.toast(output);
            $scope.findstore.skuqty    =   $scope.findstore.checkQty;
            if(locationId && $scope.findstore.skuqty)
            $scope.getprice(orderType,locationId);
        }
    };

    $scope.getUrlParameter = function (name) {

        var url_string = window.location.href;
        var queryString = url_string.substring(url_string.indexOf('?'));

        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(queryString);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    };

    $scope.ovcdid   =   $scope.getUrlParameter("ovcdid");
    $scope.ovcsid   =   $scope.getUrlParameter("ovcsid");
    $scope.ovclid   =   $scope.getUrlParameter("ovclid");
    $scope.sku =   $scope.getUrlParameter("sku");

    $scope.posFindItClass   =   function(findItType, jsonObj) {

        var productQty  =   $scope.findstore.skuqty ? $scope.findstore.skuqty : "1";

        var xhr = new XMLHttpRequest();
        var url = 'https://dev.ovcdemo.com:4443/json/process/execute/AddToReceipt';
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-type', 'application/json');
        var params = {
            "retailerId": "defaultRetailer",
            "ovcdid": $scope.ovcdid,
            "ovcsid": $scope.ovcsid,
            "ovclid": $scope.ovclid,
            "payload": {
                "listItems": [{
                    "productId":$scope.sku,
                    "productQty": productQty,
                    "findItType": findItType,
                    "pickupStoreId": jsonObj.pickupStoreId,
                    "findItOrder": jsonObj.findItOrder,
                    "name": $scope.action.skuDescription
                }]
            }
        };
        xhr.send(JSON.stringify(params));  
    }

    $scope.ship_home = function(ibt) {
        var fromPage    =   $scope.getUrlParameter('fromPage');
        if(ibt == "ship_home"){
            $state.go('ovc.customerorders-add' ,{ovcdid: $scope.ovcdid,ovcsid:$scope.ovcsid,ovclid:$scope.ovclid,sku:$scope.sku,fromPage: fromPage});
            // $scope.posFindItClass('ship_home');
        }
    }

    $scope.pickUp = function (type, keyObj) { 

            var pickupJson    =   {
                "pickupStoreId": keyObj.id,
                "findItOrder": "PickUp Order" 
            };

            $.confirm({
                title: 'Confirmation',
                content: 'Would you like to ',
                confirmButtonClass: 'btn-primary',
                cancelButtonClass: 'btn-primary',
                confirmButton: 'Pay Now',
                cancelButton: 'Pay Later',
                // closeIcon: true,
                // closeIconClass: 'fa fa-close',
                confirm: function () {
                    $scope.posFindItClass('pickup_payNow', pickupJson);
                            
                },
                cancel: function () {
                    $scope.posFindItClass('pickup_payLater', pickupJson);
                }
            
            });
            // return false;
        };

    
    //Click Transfer/Purchse Button
    $scope.draftordernumber=function(ibt,vendorId,atsQty){
        $scope.count    =   0;
        $scope.posWidget = true;
        $scope.findstore.saveasdraft  = false;
        $scope.findstore.addtoexist   = true;
        $scope.findstore.FromLocation = vendorId;
        if(ibt=="MAN"){
            $scope.findstore.transferName="Purchase Order";
            $scope.findstore.ordertype  =  ibt;
            $scope.purchase = true;
            $scope.vendorname = vendorId;
            $scope.findstore.skuqty    =   1;
            if(widgetFrame === "findItFrame"){
            $scope.posWidget = true;     
            }
        }
        else{
            $scope.findstore.checkQty   =   atsQty;
            $scope.findstore.transferName ="Transfer";
            $scope.findstore.ordertype  =  ibt;
            $scope.purchase = false;
            $scope.vendorname='';
            $scope.findstore.skuqty   =   '';
            if(widgetFrame === "findItFrame"){
                $scope.posWidget = false;
            }
        }
        var vendorName = '';
        if(ibt == "IBT_M"){
            if($scope.config.organization_name === $scope.organizationStruct['2']){
                ovcDash.get('apis/ang_getfromstore?locid=' + encodeURIComponent(storesel)).then(function(results) {
                        if((results.status !== 'error') && (results !== undefined) ){
                            $scope.storevalue.popupLoc =results;
                            $scope.findstore.locationId = results[0].id;
                        }else{
                            $scope.storevalue.popupLoc = [];
                        }
                });
            }
            if($scope.config.organization_name === $scope.organizationStruct['1'] ){
                var allLocations = angular.copy($scope.CorparateLocationData);
                 $scope.CorparateLocation = allLocations;
                  $scope.findstore.locationId = allLocations[0].id;
            }
            $scope.get_draft(ibt,vendorId);

                $scope.findstore.locationId = $state.params.locationId;
        }

        else{

            vendorName = vendorId;
            // ovcDash.get('apis/ang_userlocations?usid='+user_id+'&isStore=1').then(function (results){
            //     if(results.status=='error'){
            //         $scope.storevalue.popupLoc = [];
            //     }
            //     else{
                        var hierarchylocation = JSON.parse(localStorage.hierarchylocation)
                        $scope.storevalue.popupLoc=$scope.userHierarchyLocData;
                        $scope.findstore.locationId = $state.params.locationId;
            //         $scope.findstore.locationId = results[0].id;
            //     }
            // });  
            /*******************get uom **********/
            
            Data.get('/uom').then(function(results) {
                var uomdatas = {};
                angular.forEach(results, function(values) {
                    if ((values.isActive) && (values.uomId != undefined) && (values.uomId != '') && (values.description != undefined) && (values.description != '')) {
                        uomdatas[values.uomId] = values.uomId;  
                    }
                });
                $scope.UOM = uomdatas;
            });
            
             loc_id = $scope.findstore.locationId; 
             $scope.get_draft(ibt,vendorId);
        }
    }

    $scope.get_draft=function(ibt,selLoc){
        if($scope.findstore.locationId){
            $scope.findstore.showError  =   false;
        }
        $scope.getprice(ibt,selLoc); 
        Data.get('/order?order_type='+ibt + '&shiptolocation=' + encodeURIComponent(selLoc) + '&orderstatus=draft&purchaseordernumber='
         +'' + '&bound=' +'' + '&page_offset=' + '' + '&page_lmt=' + ''+'&vendors='+$scope.vendorname).then(function(data){
            if(data.error==undefined && data!=''){
                if(data.order_data){
                angular.forEach(data.order_data,function(orderData){
                    if(purchaseOrdernumber.indexOf(orderData.purchaseOrderNumber) == -1) {
                    purchaseOrdernumber.push(orderData.purchaseOrderNumber);
                    }
                    
                })
            }
            }
            $scope.findstore.searchvalue='';
            $scope.findstore.ordernumbers   =   purchaseOrdernumber;
            var allAfsstores = $scope.orderAfs;
            if(allAfsstores && allAfsstores.hierarchy){
                var parentId    =   '';
                angular.forEach(allAfsstores.hierarchy, function(item) {
                    if(item.id == selLoc) {
                       $scope.parentId = item.parent;
                    }
                });
                angular.forEach(allAfsstores.hierarchy, function(value) {
                    if (value.id == $scope.parentId) {
                        $scope.AfsName = value.id;
                    }
                });
            //$scope.O_add.billtostore = $scope.afsDatas[0].AfsId;
            }

            
        //     if(ibt == "IBT_M"){
        // ovcDash.get('apis/ang_getfromstore?locid=' + vendorid).then(function(results){
        //         if(results.status=='error'){
        //             $scope.storevalue.popupLoc = [];
        //         }
        //         else{
        //             $scope.storevalue.popupLoc=results;
        //         }
        //     });   
        //  $scope.findit1.vendorid = vendorid;
        //         $scope.getprice(ibt,vendorid);
        //  }
        //  else{
        //     ovcDash.get('apis/ang_userlocations?usid='+user_id+'&isStore=1').then(function (results){
        //         if(results.status=='error'){
        //             $scope.storevalue.popupLoc = [];
        //         }
        //         else{
        //             $scope.storevalue.popupLoc=results;
        //         }
        //     });  
        //     $scope.findstore.fromLocationId = vendorid;
        //         $scope.getprice(ibt,vendorid); 
        //  }

        },function(error){

        });
    }
    $scope.ordernumberdraft=function(){
        $scope.findstore.saveasdraft=true;
        $scope.findstore.addtoexist=false;
    }
    $scope.reset=function(){
        $scope.findstore.saveasdraft=true;
        $scope.findstore.addtoexist=true;
        $scope.findstore.searchvalue='';

    }
    $scope.ordernumbernew=function(orderNumber){
        $scope.findstore.errorloc       =   false;
        if(!$scope.findstore.locationId){
            $scope.findstore.showError   =   true;
        }else{
            if(purchaseOrdernumber.indexOf(orderNumber) == -1){
                $scope.findstore.saveasdraft    = false;
                $scope.findstore.addtoexist     = true;
            }else{
                $scope.findstore.saveasdraft    = true;
                $scope.findstore.addtoexist     = false;
            }
        }
        
    }
    $scope.locConfirm   =   function(){
        if($scope.findstore.locationId){
            $scope.findstore.showError   =   false;
        }
    }
    $scope.getprice=function(ibt,vendorid){

        // if(ibt == 'IBT_M'){
        //     var locid = vendorid;
        // }else{
        //     var locid = $scope.storevalue.popupLoc;
        // }
        ovcDash.get('apis/ang_getproductprice?sku=' + $scope.StyleArray.SKU + '&loc=' +vendorid ).then(function(results){
            if(results.status != "error"){
                var pricedata = results[0].ProductPrice; 
                var prtax   = tax_tot = sptax = spvat = sptaxes = spvates = tot_wtax = 0;
                var totalc  =   povat   =   vat_total   =   0;
               // var qty       =   1;
                var qty       = $scope.findstore.skuqty;
                var prcost    = parseFloat(pricedata.Cost).toFixed(2);
                var isVat     = pricedata.isVAT;
                var percent   = pricedata.percentage;
                var taxcal  =   parseFloat(percent / 100).toFixed(2);
                var to_tal  =   (prcost * qty);
                if (isVat == 0) {
                    tot_wtax    =   (to_tal * taxcal) + to_tal;
                    sptax       =   (prcost * taxcal);
                    prtax       =   (to_tal * taxcal);
                } else if (isVat == 1) {
                    tot_wtax    =   parseFloat(to_tal).toFixed(2);
                    spvat       =   (prcost * taxcal);
                    povat       =   (to_tal * taxcal);
                }
                // var sduom = uomlist['Each'];
                // var skuwaist    =   ((sval.waist) && (sval.waist != '' )) ? parseInt(sval.waist) : null ;
                // var skulength   =   ((sval.length) && (sval.length !=   '' ) )? parseInt(sval.length) : null ;
                // var skusize =   ((sval.size)    &&  (sval.size  !=  '')) ? (sval.size) :    '' ;
                $scope.findit1["qty"]             =  qty;
                $scope.findit1["cost"]            =  prcost;
                $scope.findit1["productVat"]      =  spvat;
                $scope.findit1["totalProductVat"] =  povat;
                $scope.findit1["productTax"]      =  sptax;
                $scope.findit1["totalProductTax"] =  prtax;
                $scope.findit1["totalnotax"]      =  to_tal;
                $scope.findit1["total"]           =  tot_wtax;
                $scope.findit1["taxisVAT"]        =  isVat;
                $scope.findit1["percentage"]      =  percent;
                $scope.findit1["ordertype"]       =  ibt;
            }
        });
    }
    $scope.saveasdraft=function(orderlevel,status){
        $scope.count++
        if($scope.findstore.locationId){
            // Search value Check
            // if(!$scope.findstore.searchvalue){
            //     $scope.findstore.errorloc   =   true;
            //     return false;
            // }
            if(!$scope.findstore.skuqty){
               try{
                   var output={"status":"error","message":"Quantity is required."};
                   Data.toast(output);
               }catch(err){
                   console.error(err);
               }
               return false;
           }
            var skuItem = $scope.findit1;
                var newObj  = {
                    SKU: $scope.StyleArray.SKU,
                    productCode:$scope.StyleArray.Style,
                    productName: $scope.StyleArray.description,
                    productDescription: $scope.StyleArray.description,
                    // producUom: item.selectedUOM,
                    productCost: skuItem.cost,
                    productTax: skuItem.productTax,
                    productVat: skuItem.productVat,
                    totalProductTax: skuItem.totalProductTax,
                    totalProductVat: skuItem.totalProductVat,
                    isVat: skuItem.taxisVAT,
                    qty: $scope.findstore.skuqty,
                    totalProductCost: skuItem.totalnotax,
                    waist:skuItem.waist,
                    length:skuItem.length,
                    size:skuItem.size,
                    styleColor:skuItem.color
                }
                var orderData={
                   // purchaseOrderType:'MAN',
                    orderSKU:newObj,
                    shipToLocation:$scope.findstore.locationId

                }
                if($scope.findit1.ordertype === 'MAN'){
                    if($scope.AfsName){
                        orderData["billTo"] = $scope.AfsName;
                    }
                    newObj["vendorId"]             = $scope.vendorname;
                    newObj["producUom"]            = $scope.UOM['Each'];
                    orderData["purchaseOrderType"] = 'MAN';
                    orderData["vendorId"]          = $scope.vendorname;
                }
                 if($scope.findit1.ordertype === 'IBT_M'){
                    orderData["purchaseOrderType"] = 'IBT_M';
                    orderData["FromLocation"]     =  $scope.findstore.FromLocation;

                }
                if(orderlevel === 'existingorder'){
                    orderData["purchaseOrderNumber"] = $scope.findstore.searchvalue;
                    newObj["purchaseOrderNumber"]    = $scope.findstore.searchvalue;
                }else{
                    orderData["newOrderNumber"] = $scope.findstore.searchvalue;
                    newObj["purchaseOrderNumber"]    = $scope.findstore.searchvalue;
                }
                orderData["status"] = status;
            Data.post('/addorderSKU/' + $scope.findstore.locationId, {
                data: orderData
            }).then(function(results) {
                var fromPage    =   $scope.getUrlParameter('fromPage');

                if(results.result === "success"){
                    if(orderlevel === 'existingorder'){
                        if($scope.findit1.ordertype === 'IBT_M'){
                            var output={"status":"success","message":$scope.ovcLabel.findit.list.transfer_update_success};
                        }else{
                            var output={"status":"success","message":$scope.ovcLabel.findit.list.order_update_success};
                        }
                    }else{
                        if($scope.findit1.ordertype === 'IBT_M'){
                            var output={"status":"success","message":$scope.ovcLabel.findit.list.transfer_create_success};
                        }else{
                            var output={"status":"success","message":$scope.ovcLabel.findit.list.order_create_success};
                        }
                    }
                    Data.toast(output);
                    //$scope.findstore.searchvalue = '';
                    angular.element('#myModal').modal('hide');
                    $scope.reset();
                    if(fromPage == 'pos') {

                        var transferJson    =   {
                            "pickupStoreId": $scope.findstore.locationId,
                            "findItOrder": "Transfers Order" 
                        };

                        $.confirm({
                            title: 'Confirmation',
                            content: 'Would you like to ',
                            confirmButtonClass: 'btn-primary',
                            cancelButtonClass: 'btn-primary',
                            confirmButton: 'Pay Now',
                            cancelButton: 'Pay Later',
                            // closeIcon: true,
                            // closeIconClass: 'fa fa-close',
                            confirm: function () {
                                $scope.posFindItClass('transfers_payNow', transferJson);
                                        
                            },
                            cancel: function () {
                                $scope.posFindItClass('transfers_payLater', transferJson);
                            }
                        
                        });
                    }
                }
                if(results.error === "No purchaseOrder found." ){
                    if($scope.findit1.ordertype === 'IBT_M'){
                        var output={"status":"error","message":$scope.ovcLabel.findit.error.no_transfer};
                    }else{
                        var output={"status":"error","message":$scope.ovcLabel.findit.error.no_purchaseorder};
                    }
                    Data.toast(output);
                }

            },function(error){});
        }else{
            $scope.findstore.showError  =   true;
        }
    }

    //For ATS Qty Checking
    $scope.checkAtsQty  =   function(orderType,locationId,skuQty){

        // For Empty Check 
        if(skuQty === null){
            $timeout(function(){
                $scope.findstore.skuqty = 1;
            }, 2000);
        } 

        // For less then 1 
        if(skuQty != null && skuQty < 1){
            $scope.findstore.skuqty = 1;
        }  

        if($scope.purchase){
            $scope.getprice(orderType,locationId);
        }else{
            $scope.getskuqty(orderType,locationId,skuQty);
        }
    };
}
});
