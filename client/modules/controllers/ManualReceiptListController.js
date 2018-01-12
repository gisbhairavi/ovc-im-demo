var app = angular.module('OVCstockApp',['ui.bootstrap.treeview', 'ovcdataExport']);
/*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module     :   Manual Receipt list
*
*    Developer  :   Sivaprakash
* 
*    Date       :   10/05/2016
*
*    Version    :   1.0
*
**********************************************************************/

app.controller('manualReceiptListCtrl', function($rootScope,$scope, $http, $state, $stateParams, Data, ovcDash, $filter,$timeout, toaster, IBT_STATUS, MSHIP_STSTUS, TreeViewService, 
system_currencies, ORDERSTATUS, RECEIPTTYPES, ovcdataExportFactory, QTYSTATUS,MANUALRECEIPTSTATUS, ADVANCESEARCHFIELDS, advancedPrint, Utils) {
    $scope.resetdata = false;
    $scope.form                 =   {}
    $scope.ship                 =   {};
    $scope.action               =   {};
    $scope.action.currentPage   =   1;
    $scope.ship.offset          =   0;
    $scope.ship.entryLimit      =   $rootScope.PAGE_SIZE;
    $scope.location             =   {};
    $scope.advSearch            =   {};
    $scope.advSearch.advSearchData   =   {};
    $scope.advSearch.advSrchFields = {};
    $scope.advSearch.isAdvanceSearch = false;
    $scope.location                 =   {};
     //For dashboard session clear
    if($stateParams.fullList){
        delete sessionStorage.status;
        delete sessionStorage.storeid;
        delete sessionStorage.fromdate;
        delete sessionStorage.todate;
        delete sessionStorage.dashboard;
        $scope.dash = false;
    }
    
    $scope.advanceSearch = function(){
         $scope.advanced = !$scope.advanced;
        if($scope.advSearch.isAdvanceSearch === undefined || $scope.advSearch.isAdvanceSearch === false){
            $scope.advSearch.isAdvanceSearch = true;
        }
        else if($scope.advSearch.isAdvanceSearch === true){
            $scope.advSearch.isAdvanceSearch = false
        }
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

    /*For heirarical dropdown*/
    $scope.searchLocation = function(location){
        $scope.action.filterLocation    =   location;
    };
    var currencylabel  =   $scope.translation.currencylist[0];
    var currencylist   =   [];

    $scope.getLocation  =   function() {
        Utils.hierarchylocation().then(function(results){
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
                    }
                    else{
                        $scope.checkBoxSelect($scope.storeLocData[0]);
                        $scope.addSelectedClass($scope.storeLocData[0]);
                    }

                //For Location Currency And Names
                var locationsList   =   [];
                angular.forEach(results.hierarchy, function(item) {
                    currencylist[item.id]    =   item.currency;
                    locationsList[item.id]   =   item.name;
                 });
                $scope.allLocations   =   locationsList;
                $scope.storeDatas     =   results.hierarchy;
                if($scope.storeDatas.length==1){
                    $scope.locationDisplayName = results.hierarchy[0].id;
                }
                $scope.manualReceiptSearch();
            }, function(error){
                console.log('hierarchy Location : '+ error);
            });
        // });
    };
    $scope.getLocation();

    // var userId = $rootScope.globals['currentUser']['username'];

    /***** Enable and Disable based on Permission and Configuration  Manager ******/

    $scope.viewPurchasePrice        =   true;
    $scope.viewListPurchaseOrder    =   true;
    $scope.ModifyListPurchaseOrder  =   true;
    $scope.hideVendorColumn         =   true;
    $scope.showPurchasePrice        =   true; 
    $scope.storeDatas               =   [];
	$scope.allLocations             =   [];
	$scope.allVendors               =   [];

    if(sessionStorage.storeid && sessionStorage.storename) {
            $timeout(function() {
                angular.element('#'+sessionStorage.storeid).trigger('click');
            }, 1);
            $scope.form.locationId     = sessionStorage.storeid;
            $scope.locationDisplayName = sessionStorage.storename;
    } 
    else
        $scope.form.locationId      =   '';

    if(sessionStorage.fromdate){
        $scope.form.fromdate   =   sessionStorage.fromdate;
    }

    if(sessionStorage.todate){
        $scope.form.todate     =   sessionStorage.todate;
    }
	
	/***Quantity status from config****/
	var qtycodes1 = $scope.translation.qtystatuslist[0];
    var cqtycodes1 = QTYSTATUS;
    var pqtycodes1 = [];
    angular.forEach(cqtycodes1, function(item) {
        var purch1 = item.code;
        var pqty1 = qtycodes1[purch1];
        item.label = pqty1;
		//pqtycodes1[item.code]= item.label ;
        pqtycodes1.push(item);
    });


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
        delete sessionStorage.storename;

        $scope.dash = false;
    };

    if($stateParams.fullList){
        delete sessionStorage.status;
        delete sessionStorage.storeid;
        delete sessionStorage.fromdate;
        delete sessionStorage.todate;
        delete sessionStorage.storename;
        delete sessionStorage.dashboard;

        $scope.dash = false;
    }
    /* Get Store or Locations from MYSQL Service */

    // var currencySymbols     =   $scope.translation.currencylist[0];
    // var currencyCodes       =   system_currencies[0];
    // $scope.currency         =   currencySymbols[currencyCodes.code];
    var orderStatusList     =   $scope.translation.manualrcptstatuslist[0];
    var orderStatus         =   [];
	

    angular.forEach(MANUALRECEIPTSTATUS, function(item) {
        item.label          =   orderStatusList[item.code];
        orderStatus.push(item);

		// if(item.code != 'draft'){
		// 	$scope.action.alltransferstatus.push(item.code);
		// }
		
    });
    $scope.statusData                =  {};
    $scope.Status                    =  "status";
    $scope.statusData .orderStatusList           =   orderStatus;
    $scope.statusData .manualrptStatusList       =   {};
    $scope.statusData .manualrptStatusList       =   orderStatus;
    $scope.statusData .manualrptStatusSelected   =   [];


    var ordersTypeList      =   $scope.translation.orderstypelist[0];
    var ordersType          =   [];

    angular.forEach(RECEIPTTYPES, function(item) {
        ordersType[item.code] =   ordersTypeList[item.code];
    });
        $scope.orderTypeList  =   ordersType;

    var statusdata = [];
    if( sessionStorage.status){
        angular.forEach(orderStatus,function(item){
            if(sessionStorage.status == item.code){
                item.selected = true;
                statusdata.push(item);
            }
        });
       $scope.statusData .manualrptStatusSelected = statusdata;
    }

    /**Search function for Ibt order**/
    $scope.srchOrderData    =   {};
    $scope.list             =   []
    $scope.manualReceiptSearch = function() {
        $scope.form.advSearchData = {};
        $scope.form.advSearchData = $scope.advSearch.advSearchData;
        var srchData        =   $scope.form;
        $scope.searchingstatus  = [];
        var printStatus =[];
        // if($scope.form.status){
        //      var searchingstatus =   $scope.form.status.toString();
        // }else{
        //      var searchingstatus = '';
        // }
         angular.forEach($scope.statusData.manualrptStatusSelected , function(item){
            if($scope.searchingstatus.indexOf(item.id) ==-1){
               $scope.searchingstatus.push(item.code);
               printStatus.push(item.label);
            }        
        });

        if(Object.keys($scope.form).length > 0){
            $scope.action.submitted    =   true;
        }
        var storeIds ='';
        if(angular.isArray($scope.location.id)){
            storeIds                = $scope.location.id.join() ;
        }else{
             storeIds               = '';
        }
        var shipToStore             =   storeIds;
        var orderStatus             =   ($scope.searchingstatus) || '';
        var fromDate                =   (srchData.fromdate) ? $filter('dateFormChange')(srchData.fromdate) : '';
        var toDate                  =   (srchData.todate) ? $filter('dateFormChange')(srchData.todate) : '';
        var receiptNumber           =   (srchData.manualReceiptNumber) || '';

        var sku_data    =   srchData.advSearchData.result?srchData.advSearchData.result.split('~'):'';
        var sku         =   sku_data?sku_data[0]:'';
        var asnNo       =   srchData.advSearchData.asnNo?srchData.advSearchData.asnNo:'';
        var frmQty      =   srchData.advSearchData.fromQtyRange?srchData.advSearchData.fromQtyRange:'';
        var toQty       =   srchData.advSearchData.toQtyRange?srchData.advSearchData.toQtyRange:'';
        var frmPrice    =   srchData.advSearchData.fromPriceRange?srchData.advSearchData.fromPriceRange:'';
        var toPrice     =   srchData.advSearchData.toPriceRange?srchData.advSearchData.toPriceRange:'';
        
        /*************PDF Export******************/
        

        /*var pdf_data = [];

        if($scope.locationDisplayName && $scope.locationDisplayName.length > 0)
        {
            var obj =   {};
            obj.label   =   "Store";
            obj.value   =   $scope.locationDisplayName;
            pdf_data.push(obj);
        }

        if(srchData.fromdate && srchData.fromdate.length > 0 && srchData.todate && srchData.todate.length > 0)
        {
            var obj =   {};
            obj.label   =   "Date Range";
            obj.value   =   srchData.fromdate +'-' + srchData.todate;
            pdf_data.push(obj);
        }

        if(pdf_data.length > 0)
            ovcdataExportFactory.setPdfHeaderData(pdf_data);*/
        /*************PDF Export******************/
		//Getting All Locations 
			 // Getting Vendor Datas 
			Data.get('/vendor').then(function(vendorData) {
				if(vendorData){
					var listVendors   =   [];  
					angular.forEach(vendorData, function(item) {
						listVendors[item._id] = item.companyName;
					});
					$scope.allVendors   =   listVendors;
				}

                if ((srchData.fromdate != undefined) && (srchData.todate != undefined) && (srchData.fromdate != '') && (srchData.todate != '') ) {
                    if (fromDate <= toDate) {
                        $scope.action.fieldsrequired = false;
                    } else {
                        $scope.action.fieldsrequired = true;
                        return false;
                    }
                }
				Data.get('/receipt?fromdate=' + fromDate + '&todate=' + toDate + '&shiptolocation=' + encodeURIComponent(shipToStore) + '&orderstatus=' + 
						orderStatus +'&orderNumber=' +receiptNumber +'&sku='+sku+'&asnNo='+asnNo+'&frmQty='+frmQty+'&toQty='+toQty+'&frmPrice='+frmPrice+'&toPrice='+toPrice+ '&page_offset=' + $scope.ship.offset + '&page_lmt=' + $scope.ship.entryLimit).then(function(data) {
					var manualReceiptList   =   [];
					if(data.order_data){
						angular.forEach(data.order_data, function(orderData) {
							var createdDate             =   $filter('datetimeForm')(orderData.created);
							orderData.createdDate       =   createdDate;
							orderData.vendorName        =   (orderData.vendorId) ? $scope.allVendors[orderData.vendorId]:'';
							orderData.ship_to_location  =   (orderData.shipToLocation) ? $scope.allLocations[orderData.shipToLocation]:$scope.allLocations[orderData.ship_to_location];
							orderData.from_location     =   (orderData.FromLocation) ? $scope.allLocations[orderData.FromLocation]:'';
							orderData.orderType         =   (orderData.purchaseOrderType) ? $scope.orderTypeList[orderData.purchaseOrderType]:'';
							orderData.orderStatusKey    =   (orderData.orderStatus) ? orderData.orderStatus:'';
                            orderData.currency          =   currencylabel[currencylist[orderData.shipToLocation]];   
							orderData.orderStatus       =   (orderData.orderStatus) ? orderStatusList[orderData.orderStatus]:'';
							orderData.allqty={};

							angular.forEach(data.qty_data, function(qty_status) {
								if(orderData.orderNumber === qty_status._id){
									angular.forEach(qty_status.orderQty, function(qtyData){
                                    if(qtyData.qtyStatus == 'received')
										orderData.receivedQty	=	qtyData.count;
									});
								}
							});
							
					       manualReceiptList.push(orderData);
						});
			
						$scope.list                        =   manualReceiptList;
						$scope.action.totalItems           =   data.total_count;
                        $scope.action.itemsPerPage         =   data.total_count;
						$scope.action.products             =   false;
						if($scope.list.length == 0){
							$scope.action.products         =   true;
						}
					} 
				});
                srchData.locationTitle = $scope.location.title;
                srchData.printStatus    =   printStatus.join(',');
                if(srchData.locationTitle || srchData.fromDate || srchData.toDate || srchData.advSearchData.result || srchData.advSearchData.asnNo || srchData.advSearchData.fromQtyRange || srchData.advSearchData.toQtyRange || srchData.advSearchData.fromPriceRange || srchData.advSearchData.toPriceRange)
                    advancedPrint.getAdvancedPrint(srchData);      
			});
    };

    /**sorting list**/
    $scope.reverse      =   ''; 
    $scope.predicate    =   '';
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

    /** Reset Search Filters **/
    $scope.resetOrderStatus = function() {
        delete sessionStorage.storeid;
        delete sessionStorage.fromdate;
        delete sessionStorage.todate;
        delete sessionStorage.dashboard;
        delete sessionStorage.status;

        $scope.dash = false;
        $scope.statusData .manualrptStatusSelected   =   [];
        $scope.location             =   {};
        $scope.form                 =   {};
        $scope.advSearch.advSearchData = {};
        $rootScope.$broadcast('resetdata');
        $scope.getLocation();
        
        // $scope.form.status          =   [];
        // $scope.locationDisplayName  =   '';

        ovcdataExportFactory.resetPdfHeaderData(); //Export Reset
    };

    //Copy a Purchase order
    $scope.purchaseOrderCopy = function(orderId) {
        //sessionStorage.copiedOrderid    =   orderId;
		sessionStorage.cpordid = orderId;
        $state.go('ovc.transfer-copy');
    };

    /**Page change function**/
    $scope.pageChanged  =   function(){
        $scope.ship.offset = ($scope.action.currentPage - 1) * $scope.ship.entryLimit;
        $scope.manualReceiptSearch();
    };

    // $scope.inbound();
    // $scope.manualReceiptSearch();
	
});
