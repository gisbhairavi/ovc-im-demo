var app = angular.module('OVCstockApp', ['ovcdataExport', 'roleConfig','ui.bootstrap.treeview']);

/****List  Orders***/
app.controller('listPurchaseOrders', function($rootScope, $scope, $state, $http, $stateParams, $cookieStore, $filter, $timeout, Data, ovcDash, 
MAN_STATUS, ORDERTYPELIST, ADVANCESEARCHFIELDS, ovcdataExportFactory, TreeViewService, advancedPrint, Utils) {
    // Getting Logged User Details 
    var userId = $rootScope.globals['currentUser']['username'];
    sessionStorage.pordernum        = '';
    sessionStorage.orderid          = '';
    sessionStorage.copordernum      = '';
    sessionStorage.coorderid        = '';
    $scope.molporder    =   true;
    $scope.vencol       =   true;
    $scope.storeDatas   =   [];
    $scope.offset       =   0;
    $scope.allLocations =   [];
    $scope.allVendors   =   [];
    $scope.advSearch    =   {};
    $scope.advSearch.advSearchData      =   {};
    $scope.advSearch.advSrchFields      =   {};
    $scope.advSearch.isAdvanceSearch    =   false;
    $scope.location         =   {};
    $scope.action           =   {};

    Utils.roles().then(function(RolesData){
        $scope.molporder    =   RolesData && RolesData.permissionsData && RolesData.permissionsData.order && 
                                    RolesData.permissionsData.order.modifyOrder ? 0 : 1;
    }, function(error){
        console.log('ROLES Error : ' + error);
    });
    Utils.configurations().then(function(configData){
        $scope.vencol = configData && configData.config_arr && configData.config_arr.hideVendorColumn && 
                        configData.config_arr.hideVendorColumn.featureValue ? 0 : 1;
    }, function(error){
        console.log('Configuration Error : ' + error);
    });
    
    //For dashboard session clear
    if($stateParams.fullList){
        delete sessionStorage.status;
        delete sessionStorage.storeid;
        delete sessionStorage.fromdate;
        delete sessionStorage.todate;
        delete sessionStorage.dashboard;
        $scope.dash = false;
    }

    $scope.setAdvSearchField = function(){
        var advSearchFieldArr = ADVANCESEARCHFIELDS['orders'];
        var advSearchField = {};
        angular.forEach(advSearchFieldArr,function(itm){
            advSearchField[itm] = true;
        });
        $scope.advSearch.advSrchFields = advSearchField;
    }
    $scope.setAdvSearchField();
    $scope.advanceSearch = function(){
        $scope.advanced = !$scope.advanced;
        if($scope.advSearch.isAdvanceSearch === undefined || $scope.advSearch.isAdvanceSearch === false){
            $scope.advSearch.isAdvanceSearch = true;
        }
        else if($scope.advSearch.isAdvanceSearch === true){
            $scope.advSearch.isAdvanceSearch = false
        }
    }

    var orderStatusList     =   $scope.translation.orderstatuslist[0];
    var orderStatus         =   [];

    angular.forEach(MAN_STATUS, function(item) {
        var purch = item.code;
        item.id = purch;
        item.label              =   orderStatusList[item.code];
        item.selected=false;
        orderStatus.push(item);
    });
    
    $scope.orderStatusList          =   orderStatus;
    $scope.statusData               =   {};
    $scope.statusData.statusList    =   {};
    $scope.statusData.statusList    =   orderStatus;
    $scope.statusData.statusSelected=   [];

    var ordersTypeList      =   $scope.translation.orderstypelist[0];
    var ordersType          =   [];

    angular.forEach(ORDERTYPELIST, function(item) {
        ordersType[item.code]  =   ordersTypeList[item.code];
    });

    $scope.orderTypeList    =   ordersType;

    if(sessionStorage.dashboard){
        if('dash' === sessionStorage.dashboard){
            $scope.dash = true;
        }
    }    

    $scope.redirect = function(){
            $state.go('ovc.dashboard-report');
            sessionStorage.setItem("redirect",'redirecttrue');
    };

    
    
    $scope.srchOrderData    =   {};
    var statusdata = [];
    if( sessionStorage.status){
        angular.forEach(orderStatus,function(item){
            if(sessionStorage.status == item.code){
                item.selected = true;
                statusdata.push(item);
            }
        });
        $scope.statusData.statusSelected = statusdata;
    }else{
        angular.forEach($scope.statusData.statusList , function(item){
            if(item.id == 'draft' || item.id == 'submitted' || item.id == 'inProgress'){
                item.selected = true;
                $scope.statusData.statusSelected.push(item);
            }
        });
    }
   
    if(sessionStorage.asnSearchData){
        $scope.srchOrderData    =   JSON.parse(sessionStorage.asnSearchData);
    }


    if( sessionStorage.storeid) {
        $scope.location.id    =     sessionStorage.storeid;
    }
    else
        $scope.location.id      =   '';
    
    if(sessionStorage.storename)
        $scope.location.title = sessionStorage.storename;

    if(sessionStorage.fromdate){
        $scope.srchOrderData.fromDate   =   sessionStorage.fromdate;
    }

    if(sessionStorage.todate){
        $scope.srchOrderData.toDate     =   sessionStorage.todate;
    }

    $scope.dashremove = function(){
        delete sessionStorage.status;
        delete sessionStorage.storeid;
        delete sessionStorage.fromdate;
        delete sessionStorage.todate;
        delete sessionStorage.dashboard;
        $scope.dash = false;
    };

    $scope.list             =   [];
    $scope.currentPage      =   1; //current page
    $scope.entryLimit       =   sessionStorage.ordersPageLimit ? sessionStorage.ordersPageLimit : $rootScope.PAGE_SIZE; //max no of items to display in a page  

    $scope.searchPurchaseOrder = function() { 
        $scope.orstatus                 =   [];
        $scope.srchOrderData.advSearchData = {};
        $scope.srchOrderData.advSearchData = $scope.advSearch.advSearchData;
        var srchData                    =   $scope.srchOrderData;
        sessionStorage.asnSearchData    =   JSON.stringify($scope.srchOrderData);
        sessionStorage.ordersPageLimit  =   $scope.entryLimit;
        if(Object.keys($scope.srchOrderData).length > 0){
            $scope.submitted    =   true;
        }
         angular.forEach($scope.statusData.statusSelected , function(item){
            if($scope.orstatus.indexOf(item.id) ==-1){
               $scope.orstatus.push(item.code);
            }        
        }); 

         var storeIds ='';
         if(angular.isArray($scope.location.id)){
            storeIds               = $scope.location.id.join() ;
         }else{
             storeIds               = $scope.location.id;
         }
        var purchaseOrderNumber     =   (srchData.purchaseOrderNumber) || '';
        var erpNumber               =   (srchData.erpNumber) || '';
        var shipToStore             =    storeIds;
        var orderStatus             =   ($scope.orstatus) || '';
        var fromDate                =   (srchData.fromDate) ? $filter('dateFormChange')(srchData.fromDate) : '';
        var toDate                  =   (srchData.toDate) ? $filter('dateFormChange')(srchData.toDate) : '';

        var sku_data    =   srchData.advSearchData.result?srchData.advSearchData.result.split('~'):'';
        var sku         =   sku_data?sku_data[0]:'';
        var asnNo       =   srchData.advSearchData.asnNo?srchData.advSearchData.asnNo:'';
        var frmQty      =   srchData.advSearchData.fromQtyRange?srchData.advSearchData.fromQtyRange:'';
        var toQty       =   srchData.advSearchData.toQtyRange?srchData.advSearchData.toQtyRange:'';
        var frmPrice    =   srchData.advSearchData.fromPriceRange?srchData.advSearchData.fromPriceRange:'';
        var toPrice     =   srchData.advSearchData.toPriceRange?srchData.advSearchData.toPriceRange:'';
        var toPrice     =   srchData.advSearchData.toPriceRange?srchData.advSearchData.toPriceRange:'';
        srchData.locationTitle = $scope.location.title;
        /*************PDF Export******************/
        
        if(srchData.locationTitle || srchData.fromDate || srchData.toDate || srchData.advSearchData.result || srchData.advSearchData.asnNo || srchData.advSearchData.fromQtyRange || srchData.advSearchData.toQtyRange || srchData.advSearchData.fromPriceRange || srchData.advSearchData.toPriceRange)
        advancedPrint.getAdvancedPrint(srchData);
            var currencylabel   =   $scope.translation.currencylist[0];
            Data.get('/vendor').then(function(vendorData) {
                if(vendorData){
                    var listVendors   =   [];  
                    angular.forEach(vendorData, function(item) {
                        listVendors[item._id] = item.companyName;
                    });
                    $scope.allVendors   =   listVendors;
                }
                var ordertype = ['MAN','RPL','ZFUT'];
                if ((srchData.fromDate != undefined) && (srchData.toDate != undefined) && (srchData.fromDate != '') && (srchData.toDate != '') ) {
                   if (fromDate <= toDate) {
                       $scope.fieldsrequired = false;                   
                    } else {                        
                        $scope.fieldsrequired = true;
                        return false;
                    }
                }
                Data.get('/order?order_type='+ ordertype +'&fromdate=' + fromDate + '&todate=' + toDate + '&shiptolocation=' + encodeURIComponent(shipToStore) + '&orderstatus=' + 
                        orderStatus + '&purchaseordernumber=' + purchaseOrderNumber+'&erpPurchaseOrder='+erpNumber+'&sku='+sku+'&asnNo='+asnNo+'&frmQty='+frmQty+'&toQty='+toQty+'&frmPrice='+frmPrice+'&toPrice='+toPrice+'&page_offset='+$scope.offset+'&page_lmt='+$scope.entryLimit).then(function(data) {
                    var purchaseOrderList   =   [];
                    if(data.order_data){
                        angular.forEach(data.order_data, function(orderData) {
                            var createdDate             =   $filter('datetimeForm')(orderData.created);
                            orderData.createdDate       =   createdDate;

                            orderData.vendorName        =   (orderData.vendorId) ? $scope.allVendors[orderData.vendorId]:'';
                            orderData.recipient         =   (orderData.shipToLocation) ? $scope.allLocations[orderData.shipToLocation]:'';
                            orderData.orderType         =   (orderData.purchaseOrderType) ? $scope.orderTypeList[orderData.purchaseOrderType]:'';
                            orderData.currency          =   currencylabel[currencylist[orderData.shipToLocation]];
                            orderData.orderStatusKey    =   (orderData.orderStatus) ? orderData.orderStatus:'';   
                            orderData.orderStatus       =   (orderData.orderStatus) ? orderStatusList[orderData.orderStatus]:'';
                            orderData.totalPoCost       =   (orderData.totalPoCostAsn) ? orderData.totalPoCostAsn : orderData.totalPoCostConfirm ? orderData.totalPoCostConfirm : orderData.totalPoCost;
                            // access = firstCheck ? "Access denied" : secondCheck ? "Access denied" : "Access granted";
                            if((orderData.purchaseOrderType !=  'IBT_M') && (orderData.purchaseOrderType    !=  'PUSH')){
                                purchaseOrderList.push(orderData);
                            }   
                        });
                        $scope.list                 =   purchaseOrderList;
                        $scope.filteredItems        =   data.total_count; //Initially for no filter  
                        $scope.itemsPerPage         =   $scope.list.length;
                    }
                });
            });
        // });
    };
    var locationsList , currencylist;
    $scope.getLocation  =   function() {
        var id_user        =    $rootScope.globals['currentUser']['username'];

            //For listview location service
            Utils.userLocation().then( function ( resultsloc ) {
                if(resultsloc && !resultsloc.status){
                    // var locationsList   =   [];
                     locationsList   =   {};
                     currencylist   =   {};
                    angular.forEach(resultsloc, function(item) {
                        currencylist[item.id]    =   item.currency;
                        locationsList[item.id]   =   item.displayName;
                    });
                    $scope.allLocations   =   locationsList;
                    $scope.storeDatas     =   resultsloc;
                    if($scope.storeDatas.length == 1){
                        $scope.locationDisplayName = resultsloc[0].id;
                    }
                }
            });
            //For hierarchy locations list
            Utils.hierarchylocation().then( function ( results ) {
                $scope.storeLocData =   TreeViewService.getLocData(results);  
                var selectedStore   =   $scope.storeLocData[0];
                    if(sessionStorage.storeid){
                        angular.forEach(results.hierarchy,function(item){
                            if(sessionStorage.storeid == item.id){
                                selectedStore   =   item;
                                $scope.location.displayName = selectedStore.name;
                                $scope.checkBoxSelect(selectedStore);
                                $scope.addSelectedClass(selectedStore);
                                return false;
                            }
                        });
                    }else{
                        $scope.checkBoxSelect($scope.storeLocData[0]);
                        $scope.addSelectedClass($scope.storeLocData[0]);
                    }  
            }).then(function(){
                $timeout(function() {
                    $scope.searchPurchaseOrder();
                }, 800);
            });
    };
    $scope.getLocation();
    $scope.sort_by = function(predicate) {
        $scope.predicate        =   predicate;
        $scope.reverse          =   !$scope.reverse;
    };

    $scope.fieldsrequired = false;

    $scope.change_todate = function() {
        $scope.fieldsrequired = false;
    };

    $scope.change_frdate = function() {
        $scope.fieldsrequired = false;
    };

    // Reset Search Filters
    $scope.purchaseOrderReset = function() {
        $scope.statusData.statusSelected = [];
        angular.forEach($scope.statusData.statusList , function(item){
            if(item.id == 'draft' || item.id == 'submitted' || item.id == 'inProgress'){
                item.selected = true;
                $scope.statusData.statusSelected.push(item);
            }
        });
        delete sessionStorage.status;
        delete sessionStorage.asnSearchData;
        delete sessionStorage.ordersPageLimit;
        delete sessionStorage.storeid;
        delete sessionStorage.fromdate;
        delete sessionStorage.todate;
        delete sessionStorage.dashboard;
        $scope.advSearch.advSearchData   =   {};
        $scope.dash = false;
        angular.element("#orstatus option:selected").removeAttr('selected');
        $scope.entryLimit       =   $rootScope.PAGE_SIZE; 
        $scope.location         =   {};
        $scope.srchOrderData    =   {};
        $scope.getLocation();

        ovcdataExportFactory.resetPdfHeaderData(); //Export Reset
    };

    /*For heirarical dropdown Filter*/
    $scope.searchLocation = function(location){
        $scope.action.filterLocation    =   location;
    };
    // Copy a Purchase order
    $scope.purchaseOrderCopy = function(orderId , PoNo) {
        sessionStorage.cpordid    =   orderId;
        sessionStorage.copyOrderNumber  =   PoNo;
        $state.go('ovc.purchaseorder-copy');
    };

    $scope.pageChanged  =   function(){
        $scope.offset = ($scope.currentPage - 1) * $scope.entryLimit;
        $scope.searchPurchaseOrder();
    };
});