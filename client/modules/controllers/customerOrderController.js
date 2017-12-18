var app = angular.module('OVCstockApp',['ovcdataExport','roleConfig','ui.bootstrap.treeview']);
/*********************************************************************
*   Great Innovus Solutions Private Limited
*
*    Module     :   Customer Order Controller
*
*    Developer  :   Sivaraman
* 
*    Date       :   21/06/2016
*
*    Version    :   1.0
**********************************************************************/
/****List  Customer Orders***/
app.controller('listCustomerOrders', function($rootScope, $scope, $state, $http,  $cookieStore, $filter, $timeout, $stateParams, Data, ovcDash, 
ORDERTYPELIST, DROPSHIPSTATUS,system_settings, system_currencies, ovcdataExportFactory, ADVANCESEARCHFIELDS, TreeViewService, advancedPrint, Utils) {
   
    // Getting Logged User Details 
    var userId                              =   $rootScope.globals['currentUser']['username'];
    $scope.offset                           =   0;
	$scope.allLocations                     =   [];
	$scope.allVendors                       =   [];
    $scope.customerorders                   =   {};
    $scope.customerorders.orderStatusList   =   [];
    $scope.customerorders.allVendors        =   [];
    $scope.customerorders.allVendorNames    =   {};
    $scope.customerorders.allLocations      =   [];
    sessionStorage.dropshipid               =   '';
    $scope.location                         =   {};
    $scope.action                           =   {};
    
    var orderStatusList     =   $scope.translation.dropship_statuses;
    var orderStatus         =   [];
    
     //For dashboard session clear
    if($stateParams.fullList){
        delete sessionStorage.status;
        delete sessionStorage.storeid;
        delete sessionStorage.fromdate;
        delete sessionStorage.todate;
        delete sessionStorage.dashboard;
        $scope.dash = false;
    }

    $scope.Status  = "status";
    /***Drop Ship Statuses from Config ****/
    angular.forEach(DROPSHIPSTATUS, function(item) {
        item.label         =   orderStatusList[item.code];
        orderStatus.push(item);
    });

    $scope.customerorders.orderStatusList  = orderStatus;
    $scope.statusData                      ={};
    $scope.srchOrderData                   =   {};
    $scope.statusData.dropshipStatusList              = {};
    $scope.statusData.dropshipStatusList              = orderStatus;
    $scope.statusData.dropshipStatusSelected          =   [];

    if(sessionStorage.dashboard){
        if('dash' === sessionStorage.dashboard){
            $scope.dash = true;
        }
    }

    $scope.redirect = function(){
            $state.go('ovc.dashboard-report');
            sessionStorage.setItem("redirect",'redirecttrue');
    };

    $scope.dashremove = function(){
        delete sessionStorage.status;
        delete sessionStorage.storeid;
        delete sessionStorage.fromdate;
        delete sessionStorage.todate;
        delete sessionStorage.dashboard;

        $scope.dash = false;
    };
    
    if(sessionStorage.customerSearchData){
        $scope.srchOrderData           =   JSON.parse(sessionStorage.customerSearchData);
    }
    $scope.customerorders.list         =   [];
    $scope.customerorders.currentPage  =   1; //current page
    $scope.customerorders.entryLimit   =    sessionStorage.ordersPageLimit ? sessionStorage.ordersPageLimit : $rootScope.PAGE_SIZE; //max no of items to display in a page	
    var statusdata = [];

    if( sessionStorage.status){
        angular.forEach(orderStatus,function(item){
            if(sessionStorage.status == item.code){
                item.selected = true;
                statusdata.push(item);
            }
        });
        $scope.statusData.dropshipStatusSelected    =    sessionStorage.status;
    }

    if( sessionStorage.storeid) {
        $scope.srchOrderData.shipToStore    =     sessionStorage.storeid;
    }
    else
        $scope.srchOrderData.shipToStore    =   '';

    if(sessionStorage.fromdate){
        $scope.srchOrderData.fromDate   =   sessionStorage.fromdate;
    }

    if(sessionStorage.todate){
        $scope.srchOrderData.toDate     =   sessionStorage.todate;
    }    

    $scope.advSearch   =   {};
    $scope.advSearch.advSrchFields = {};
    $scope.advSearch.advSearchData = {}
    $scope.advSearch.isAdvanceSearch = false;
    $scope.advanceSearch = function(){
        $scope.advanced = !$scope.advanced;
        if($scope.advSearch.isAdvanceSearch === undefined || $scope.advSearch.isAdvanceSearch === false){
            $scope.advSearch.isAdvanceSearch = true;
        }
        else if($scope.advSearch.isAdvanceSearch === true){
            $scope.advSearch.isAdvanceSearch = false
        }
    }
     /*For heirarical dropdown Filter*/
    $scope.searchLocation = function(location){
        $scope.action.filterLocation = location;
    }
    function hierarchylocation(){
        Utils.hierarchylocation().then(function(results){$scope.storeLocData =   TreeViewService.getLocData(results);
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
                        $timeout(function() {
                            $scope.searchCustomerOrder();
                        }, 800);
                    }
                    else{
                        $scope.checkBoxSelect($scope.storeLocData[0]);
                        $scope.addSelectedClass($scope.storeLocData[0]);
                        $timeout(function() {
                            $scope.searchCustomerOrder();
                        }, 800);
                    }
            
        }, function(error){
            console.log('Hierarchy Location Error :' + error);
        });
    }
    hierarchylocation();

    $scope.setAdvSearchField = function(){
        var advSearchFieldArr = ADVANCESEARCHFIELDS['orders'];
        var advSearchField = {};
        angular.forEach(advSearchFieldArr,function(itm){
            advSearchField[itm] = true;
        });
        $scope.advSearch.advSrchFields = advSearchField;
    }
    $scope.setAdvSearchField();

    $scope.searchCustomerOrder = function() {
        $scope.srchOrderData.advSearchData  =   $scope.advSearch.advSearchData;
        var srchData                        =   $scope.srchOrderData;
        $scope.searchingStatus              =   [];
        sessionStorage.customerSearchData   =   JSON.stringify($scope.srchOrderData);
        sessionStorage.ordersPageLimit      =   $scope.customerorders.entryLimit;
        if(Object.keys($scope.srchOrderData).length > 0){
            $scope.customerorders.submitted =   true;
        }
        angular.forEach($scope.statusData.dropshipStatusSelected , function(item){
            if($scope.searchingStatus.indexOf(item.id) ==-1){
               $scope.searchingStatus.push(item.code);
            }        
        });
        var storeIds ='';
         if(angular.isArray($scope.location.id)){
            storeIds                = $scope.location.id.join() ;
         }

        var vendorId             =   (srchData.vendorName) || '';
        var contactName          =   (srchData.customerName) || '';
        var purchaseOrderNumber  =   (srchData.purchaseOrderNumber) || '';
        var erpNumber            =   (srchData.erpNumber) || '';
        var shipToStore          =   storeIds;
        var orderStatus          =   ($scope.searchingStatus) || '';
        var fromDate             =   (srchData.fromDate) ? new Date (srchData.fromDate) : '';
        var toDate               =   (srchData.toDate) ? new Date (srchData.toDate) : '';

        var sku_data    =   srchData.advSearchData.result?srchData.advSearchData.result.split('~'):'';
        var sku         =   sku_data?sku_data[0]:'';
        var asnNo       =   srchData.advSearchData.asnNo?srchData.advSearchData.asnNo:'';
        var frmQty      =   srchData.advSearchData.fromQtyRange?srchData.advSearchData.fromQtyRange:'';
        var toQty       =   srchData.advSearchData.toQtyRange?srchData.advSearchData.toQtyRange:'';
        var frmPrice    =   srchData.advSearchData.fromPriceRange?srchData.advSearchData.fromPriceRange:'';
        var toPrice     =   srchData.advSearchData.toPriceRange?srchData.advSearchData.toPriceRange:'';
        srchData.locationTitle = $scope.srchOrderData.shipToStore;
        
        /*************PDF Export******************/

        if(srchData.locationTitle || srchData.fromDate || srchData.toDate || srchData.advSearchData.result || srchData.advSearchData.asnNo || srchData.advSearchData.fromQtyRange || srchData.advSearchData.toQtyRange || srchData.advSearchData.fromPriceRange || srchData.advSearchData.toPriceRange)
        advancedPrint.getAdvancedPrint(srchData);

        /*var pdf_data             = [];

        if($scope.srchOrderData.shipToStore && $scope.srchOrderData.shipToStore.length > 0)
        {
            var obj              =   {};
            obj.label            =   "Store";
            obj.value            =   $scope.srchOrderData.shipToStore;
            pdf_data.push(obj);
        }

        if(srchData.fromDate && srchData.fromDate.length > 0 && srchData.toDate && srchData.toDate.length > 0)
        {
            var obj              =   {};
            obj.label            =   "Date Range";
            obj.value            =   srchData.fromDate +'-' + srchData.toDate;
            pdf_data.push(obj);
        }

        if(pdf_data.length > 0)
            ovcdataExportFactory.setPdfHeaderData(pdf_data);*/

		// Getting Store Datas based on the Logged in User
        Utils.userLocation(1).then(function(results){
            var currencylabel       =   $scope.translation.currencylist[0];
			if(results && !results.status){
				var locationsList   =   [];
                var currencylist    =   [];

				angular.forEach(results, function(item) {
					locationsList[item.id]   =   item.displayName;
                    currencylist[item.id]    =   item.currency;
				});
				$scope.customerorders.allLocations   =   locationsList;
                $scope.customerorders.storeDatas     =   results;
                if( $scope.customerorders.storeDatas.length==1){
                    $scope.srchOrderData.shipToStore =   results[0].id;
                }
			}
			// Getting Vendor Datas
			Data.get('/vendor').then(function(vendorData) {
				if(vendorData){
					var listVendors       =   [];
                    var listVendorNames   =   {};    
					angular.forEach(vendorData, function(item) {
						listVendorNames[item._id] = item.companyName
                        var newobj={
                            id:item._id,
                            name:item.companyName
                        }
                        listVendors.push(newobj);
					});
					//$scope.allVendors   =   listVendorNames;
                    $scope.customerorders.allVendorNames  =   listVendorNames;
                    $scope.customerorders.allVendors      =   listVendors;
				}
                var ordertype = ['DROP_SHIP'];
                if ((srchData.fromDate != undefined) && (srchData.toDate != undefined) && (srchData.fromDate != '') && (srchData.toDate != '') ) {
                   if (fromDate <= toDate) {
                       $scope.customerorders.fieldsrequired = false;                   
                    } else {                        
                        $scope.customerorders.fieldsrequired = true;
                        return false;
                    }
                }
    
				Data.get('/dropship?order_type='+ ordertype +'&fromdate=' + fromDate + '&todate=' + toDate + '&location=' + encodeURIComponent(shipToStore) + '&orderstatus=' + 
						orderStatus + '&purchaseordernumber=' + purchaseOrderNumber+'&erpcustomerOrder='+erpNumber+'&vendors='+vendorId+'&contactName='+contactName
                        +'&sku='+sku+'&asnNo='+asnNo+'&frmQty='+frmQty+'&toQty='+toQty+'&frmPrice='+frmPrice+'&toPrice='+toPrice
                        +'&page_offset='+$scope.customerorders.offset+'&page_lmt='+$scope.customerorders.entryLimit).then(function(data) {
                	var customerOrderList   =   [];
					if(data.order_data){
						angular.forEach(data.order_data, function(orderData) {
							var createdDate             =   $filter('datetimeForm')(orderData.created);
							orderData.createdDate       =   createdDate;

							orderData.vendorName        =   (orderData.vendorId) ? $scope.allVendors[orderData.vendorId]:'';
							orderData.recipient         =   (orderData.shipToLocation) ? $scope.allLocations[orderData.shipToLocation]:'';
							orderData.orderType         =   (orderData.customerOrderType) ? $scope.orderTypeList[orderData.customerOrderType]:'';
                            orderData.currency          =   currencylabel[currencylist[orderData.location]];
							orderData.orderStatusKey    =   (orderData.orderStatus) ? orderData.orderStatus:'';   
							orderData.orderStatus       =   (orderData.orderStatus) ? orderStatusList[orderData.orderStatus]:'';
							orderData.totalPoCost       =   (orderData.totalPoCostAsn) ? orderData.totalPoCostAsn : orderData.totalPoCostConfirm ? orderData.totalPoCostConfirm : orderData.totalPoCost;
							// access = firstCheck ? "Access denied" : secondCheck ? "Access denied" : "Access granted";
							if((orderData.customerOrderType	!=	'IBT_M') && (orderData.customerOrderType	!=	'PUSH')){
								customerOrderList.push(orderData);
							}
							
						});
						$scope.customerorders.list            =   customerOrderList;
						$scope.customerorders.filteredItems   =   data.total_count; //Initially for no filter  
						$scope.customerorders.itemsPerPage    =   $scope.customerorders.list.length;
					   
					}
				});
			});
		}, function(error){
            console.log('User Location Error :' + error);
        });
    };

    $scope.sort_by = function(predicate) {
        $scope.predicate     =   predicate;
        $scope.reverse       =   !$scope.reverse;
    };

    $scope.customerorders.fieldsrequired = false;

    $scope.change_todate = function() {
        $scope.customerorders.fieldsrequired = false;
    };

    $scope.change_frdate = function() {
        $scope.customerorders.fieldsrequired = false;
    };

    // Reset Search Filters
    $scope.customerOrderReset = function() {
        delete sessionStorage.customerSearchData;
        delete sessionStorage.ordersPageLimit;
        delete sessionStorage.status;
        delete sessionStorage.storeid;
        delete sessionStorage.fromdate;
        delete sessionStorage.todate;

        delete sessionStorage.dashboard;

        $scope.dash = false;
        $scope.statusData.dropshipStatusSelected          =   [];


        angular.element("#orstatus option:selected").removeAttr('selected');

        $scope.customerorders.entryLimit  =   $rootScope.PAGE_SIZE; 
        $scope.srchOrderData              =   {};
        $scope.advSearch.advSearchData    =   {};
        $scope.location                   =   {};
        hierarchylocation();
        // $scope.searchCustomerOrder();
        ovcdataExportFactory.resetPdfHeaderData(); //Export Reset
        // $scope.location.displayName  =   [];
        
    };

     // Copy a Customer order
    $scope.customerOrderCopy = function(orderId) {
        sessionStorage.dropshipid    =   orderId;
        $state.go('ovc.customerorders-copy');
    };

    $scope.pageChanged  =   function(){
       // $scope.offset = ($scope.currentPage - 1) * $scope.itemsPerPage;
        $scope.customerorders.offset = ($scope.customerorders.currentPage - 1) * $scope.customerorders.entryLimit;
        $scope.searchCustomerOrder();
    };
	
	/* $scope.set_list_size	=	function(){
		$scope.list_size				=		$scope.entryLimit;	
	} */
    //$scope.searchCustomerOrder();
});









