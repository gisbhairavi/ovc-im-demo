var app = angular.module('OVCstockApp',['ui.bootstrap.treeview', 'ovcdataExport']);
/*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module     :   IBT list
*
*    Developer  :   Sivaprakash
* 
*    Date       :   08/02/2016
*
*    Version    :   1.0
*
**********************************************************************/

app.controller('ibtCtrl', function($rootScope,$scope, $http, $state, $location, Data, ovcDash, $filter,$timeout, $stateParams, toaster, IBT_STATUS, MSHIP_STSTUS, TreeViewService, 
system_currencies, ORDERSTATUS, ORDERTYPELIST, ovcdataExportFactory, QTYSTATUS, ADVANCESEARCHFIELDS, advancedPrint, Utils) {
    $scope.resetdata            =   false;
    $scope.form                 =   $scope.ship =   {};
    $scope.action               =   {};
    $scope.location             =   {};
    $scope.action.currentPage   =   1;
    $scope.action.offset        =   0;
    sessionStorage.cpordid	=	'';
	sessionStorage.pordernum = '';
    sessionStorage.orderid = '';
    sessionStorage.copordernum = '';
    sessionStorage.coorderid = '';
	sessionStorage.resolvetransfer = '';
	$scope.action.alltransferstatus	=[];
    delete sessionStorage.ids;
    $scope.advSearch   =   {};
    $scope.advSearch.advSearchData   =   {};
    $scope.advSearch.advSrchFields = {};
    $scope.advSearch.isAdvanceSearch = false;
    $scope.viewPurchasePrice        =   true;
    $scope.storeDatas               =   [];
    $scope.allLocations             =   [];
    $scope.allVendors               =   [];

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
        var location = $location;
        if( location.path() == '/ovc/manualshipment')
            var advSearchFieldArr = ADVANCESEARCHFIELDS['orders'];
        else if ( location.path() == '/ovc/ibt')
            var advSearchFieldArr = ADVANCESEARCHFIELDS['orders'];
        else
            var advSearchFieldArr = ADVANCESEARCHFIELDS['deliveries'];
        var advSearchField = {};
        angular.forEach(advSearchFieldArr,function(itm){
            advSearchField[itm] = true;
        });
        $scope.advSearch.advSrchFields = advSearchField;
    }
    $scope.setAdvSearchField();

    if($state.current.name == "ovc.manualShipment-list"){
        var ordertype = 'PUSH';
        $scope.action.ordertype='PUSH';
    }
    if($state.current.name == "ovc.ibt"){
        var ordertype = 'IBT_M';
         $scope.action.ordertype='IBT_M';
    }

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

    /*if($stateParams.fullList){
        delete sessionStorage.ibtSearchData;
        delete sessionStorage.ibtPageLimit;
        delete sessionStorage.typeIBT;
        delete sessionStorage.status;
        delete sessionStorage.storeid;
        delete sessionStorage.fromdate;
        delete sessionStorage.todate;
        delete sessionStorage.storename;
        delete sessionStorage.dashboard;

        $scope.dash = false;
    }*/

    var selectedStatus  =   [];

    if(sessionStorage.ibtSearchData){
        $scope.form    =   JSON.parse(sessionStorage.ibtSearchData);
        $scope.type_ibt=    sessionStorage.typeIBT;
        selectedStatus  =   $scope.form.status;
    }
  

    $scope.action.entryLimit    =   sessionStorage.ibtPageLimit ? sessionStorage.ibtPageLimit : $rootScope.PAGE_SIZE;
    $scope.type_ibt             =   sessionStorage.typeIBT ? sessionStorage.typeIBT : "Inbound";

    /**Manual Shipment status list**/
    
    var mshipstatuscodes            =   [];
    var transferstatusdrop          =   [];

    if($state.current.name == "ovc.manualShipment-list"){
            var mshipconfigcodes    =   MSHIP_STSTUS;
            var ordercodes          =   $scope.translation.mshipstatuslist[0];
        angular.forEach(mshipconfigcodes, function(item) {
            var purch   =   item.code;
            var porder  =   ordercodes[purch];
            item.id     =   purch;
            item.label   =   porder;
            item.selected=  false;
            if(selectedStatus.indexOf(purch) > -1){
                item.selected =  true;
            }
            mshipstatuscodes.push(item);
        });
    }
        /**IBT status list**/
    if($state.current.name == "ovc.ibt"){
        var ibtconfigcodes          =   IBT_STATUS;
        var ordercodes              =   $scope.translation.ibtstatuslist[0];
        angular.forEach(ibtconfigcodes, function(item) {
            var purch   =   item.code;
            var porder  =   ordercodes[purch];
            item.id     =   purch;
            item.label   =   porder;
            item.selected=  false;
            if(selectedStatus.indexOf(purch) > -1){
                item.selected =  true;
            }
            if(item.code!='inProgress'){
                transferstatusdrop.push(item);
            }
        });
    }
     

    $scope.form.status              =   selectedStatus;
    $scope.manualshipmentstatus     =   mshipstatuscodes;
    $scope.transferstatus           =   transferstatusdrop;
    $scope.statusData                =  {};
    $scope.statusData .transferStatusList       =   {};
    $scope.statusData .transferStatusList       =   transferstatusdrop;
     $scope.statusData .transferStatusSelected   =   [];
     $scope.statusData .manualshpmtStatus        = {};
     $scope.statusData .manualshpmtStatus       =  mshipstatuscodes;
     $scope.statusData .manualshpmtStatusSelected   =   [];

   var statusdata = [];
   $scope.Status  = "status";
   if( sessionStorage.status){
        if($state.current.name == "ovc.ibt"){
            angular.forEach(transferstatusdrop,function(item){
                if(sessionStorage.status == item.code){
                    item.selected = true;
                    statusdata.push(item);
                }
            });
            $scope.statusData.transferStatusSelected = statusdata;
        }
         if($state.current.name == "ovc.manualShipment-list"){
            angular.forEach(mshipstatuscodes,function(item){
                if(sessionStorage.status == item.code){
                    item.selected = true;
                    statusdata.push(item);
                }
            });
            $scope.statusData.manualshpmtStatusSelected = statusdata;
        }
    } 


    $scope.selectedmshipmentStatus  =   [];
    /*For heirarical dropdown*/
    $scope.searchLocation = function(){
        $scope.form.filterLocation    =   $scope.locationDisplayName;
    };
    var currencylabel  =   $scope.translation.currencylist[0];
    var currencylist   =   [];

    $scope.getLocation  =   function() {
        //For listview location service
        Utils.userLocation(1).then(function(resultsloc){
            if(resultsloc && !resultsloc.status){
                angular.forEach(resultsloc, function(item) {
                    currencylist[item.id]    =   item.currency;
                });
            }
        }, function(error){
            console.log('Location Error :' + error);
        });

        Utils.location().then(function(allLoc){
            var locationsList   =   [];
            angular.forEach(allLoc , function(locDetails){
                locationsList[locDetails.id]   =   locDetails.displayName;
            });
            $scope.allLocations   =   locationsList;
        }, function(error){
            console.log('AllLocation Error :' + error);
        });
        
        //For hierarchy locations list
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
                        }
                    });
                    $timeout(function() {
                        $scope.searchPurchaseOrder();
                    }, 800);
                }
                else{
                    $scope.checkBoxSelect($scope.storeLocData[0]);
                    $scope.addSelectedClass($scope.storeLocData[0]);
                    $timeout(function() {
                        $scope.searchPurchaseOrder();
                    }, 800);
                }
        }, function(error){
            console.log('Hierarchy Location Error' + error);
        });
    };
    $scope.getLocation();

    var userId = $rootScope.globals['currentUser']['username'];
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


    /* Get Store or Locations from MYSQL Service */

    // var currencySymbols     =   $scope.translation.currencylist[0];
    // var currencyCodes       =   system_currencies[0];
    // $scope.currency         =   currencySymbols[currencyCodes.code];
    var orderStatusList     =   $scope.translation.ibtstatuslist[0];
    var orderStatus         =   [];
	

    angular.forEach(IBT_STATUS, function(item) {
        item.label          =   orderStatusList[item.code];
        orderStatus.push(item);
		if(item.code != 'draft'){
			$scope.action.alltransferstatus.push(item.code);
		}
		
    });

    $scope.orderStatusList  =   orderStatus;

    var ordersTypeList      =   $scope.translation.orderstypelist[0];
    var ordersType          =   [];

    angular.forEach(ORDERTYPELIST, function(item) {
        ordersType[item.code] =   ordersTypeList[item.code];
    });
    $scope.orderTypeList  =   ordersType;

    /**Search function for Ibt order**/
    $scope.srchOrderData    =   {};
    $scope.list             =   [];

    if(sessionStorage.fromdate){
        $scope.form.fromdate   =   sessionStorage.fromdate;
    }

    if(sessionStorage.todate){
        $scope.form.todate     =   sessionStorage.todate;
    }

    if(sessionStorage.storeid && sessionStorage.storename) {
            $scope.form.locationId     = sessionStorage.storeid;
            $scope.locationDisplayName = sessionStorage.storename;
    }
    else
        $scope.form.locationId  =   '';

    $scope.searchPurchaseOrder = function() {
        $scope.form.advSearchData = {};
        $scope.form.advSearchData = $scope.advSearch.advSearchData;
        var srchData        =   $scope.form;
        $scope.searchingstatus = [];
        sessionStorage.ibtSearchData    =   JSON.stringify($scope.form);
        sessionStorage.ibtPageLimit        =   $scope.action.entryLimit;
        sessionStorage.typeIBT          =   $scope.type_ibt;
         if($state.current.name == "ovc.manualShipment-list"){
            angular.forEach($scope.statusData .manualshpmtStatusSelected , function(item){
                    if($scope.searchingstatus.indexOf(item.id) ==-1){
                       $scope.searchingstatus.push(item.code);
                    }        
            });
         } 
          if($state.current.name == "ovc.ibt"){
                 angular.forEach($scope.statusData .transferStatusSelected , function(item){
                    if($scope.searchingstatus.indexOf(item.id) ==-1){
                       $scope.searchingstatus.push(item.code);
                    }        
                });
        }
        if(Object.keys($scope.form).length > 0){
            $scope.action.submitted    =   true;
        }
        var storeIds ='';
         if(angular.isArray($scope.form.locationId)){
            storeIds               = $scope.location.id.join() ;
         }else{
             storeIds               = $scope.location.id;
         }
        var shipToStore             =   storeIds;
        var orderStatus             =   ($scope.searchingstatus) || '';
        var fromDate                =   (srchData.fromdate) ? $filter('dateFormChange')( srchData.fromdate) : '';
        var toDate                  =   (srchData.todate) ? $filter('dateFormChange')( srchData.todate) : '';
        var order_number            =   (srchData.transfer_number) || '';
        
        var sku_data    =   srchData.advSearchData.result?srchData.advSearchData.result.split('~'):'';
        var sku         =   sku_data?sku_data[0]:'';
        var asnNo       =   srchData.advSearchData.asnNo?srchData.advSearchData.asnNo:'';
        var frmQty      =   srchData.advSearchData.fromQtyRange?srchData.advSearchData.fromQtyRange:'';
        var toQty       =   srchData.advSearchData.toQtyRange?srchData.advSearchData.toQtyRange:'';
        var frmPrice    =   srchData.advSearchData.fromPriceRange?srchData.advSearchData.fromPriceRange:'';
        var toPrice     =   srchData.advSearchData.toPriceRange?srchData.advSearchData.toPriceRange:'';
        srchData.locationTitle = $scope.location.title;

        /*************PDF Export******************/
        if(srchData.locationTitle || srchData.fromDate || srchData.toDate || srchData.advSearchData.result || srchData.advSearchData.asnNo || srchData.advSearchData.fromQtyRange || srchData.advSearchData.toQtyRange || srchData.advSearchData.fromPriceRange || srchData.advSearchData.toPriceRange)
            advancedPrint.getAdvancedPrint(srchData);
           
			 // Getting Vendor Datas 
			Data.get('/vendor').then(function(vendorData) {
				if(vendorData){
					var listVendors   =   [];  
					angular.forEach(vendorData, function(item) {
						listVendors[item._id] = item.companyName;
					});
					$scope.allVendors   =   listVendors;
				}
		  
				Data.get('/order?order_type='+ ordertype + '&fromdate=' + fromDate + '&todate=' + toDate + '&shiptolocation=' + encodeURIComponent(shipToStore) + '&orderFulfillment=' + 
						orderStatus +'&purchaseordernumber=' +order_number + '&bound=' + $scope.type_ibt +'&sku='+sku+'&asnNo='+asnNo+'&frmQty='+frmQty+'&toQty='+toQty+'&frmPrice='+frmPrice+'&toPrice='+toPrice+ '&page_offset=' + $scope.action.offset + '&page_lmt=' + $scope.action.entryLimit).then(function(data) {
					var purchaseOrderList   =   [];
					if(data.order_data){
						angular.forEach(data.order_data, function(orderData) {
							var createdDate             =   $filter('datetimeForm')(orderData.created);
							orderData.createdDate       =   createdDate;
							orderData.vendorName        =   (orderData.vendorId) ? orderData.vendorId:'';
							orderData.ship_to_location  =   (orderData.shipToLocation) ? $scope.allLocations[orderData.shipToLocation]:'';
							orderData.from_location     =   (orderData.FromLocation) ? $scope.allLocations[orderData.FromLocation]:'';
							orderData.orderType         =   (orderData.purchaseOrderType) ? $scope.orderTypeList[orderData.purchaseOrderType]:'';
							orderData.orderStatusKey    =   (orderData.orderStatus) ? orderData.orderStatus:'';
                            orderData.currency          =   currencylabel[currencylist[orderData.shipToLocation]];
							orderData.orderStatus       =   (orderData.orderStatus) ? orderStatusList[orderData.orderStatus]:'';
							orderData.allqty            =    {};
							
							angular.forEach(pqtycodes1, function(data) {
								orderData.allqty[data.code]	=	0;
							});

							angular.forEach(data.qty_data, function(qty_status) {
								if(orderData.purchaseOrderNumber === qty_status._id){
									angular.forEach(qty_status.orderQty, function(qtyData){
										orderData[qtyData.qtyStatus]     =   qtyData.count;
										orderData.allqty[qtyData.qtyStatus]	=	qtyData.count;
									});
								}
							});
							
							orderData["showdiscrepancy"]	= false;
                            if(data['descrepanciesList'].length > 0){
                                if(data['descrepanciesList'].indexOf(orderData.purchaseOrderNumber) != -1){
                                    orderData["showdiscrepancy"]    =   true;
                                }
                            }

                            $scope.displayStatusObject  =   data['displayStatusObject'];
							purchaseOrderList.push(orderData);
						});
			
						$scope.list                        =   purchaseOrderList;
						$scope.action.totalItems           =   data.total_count;
						$scope.action.products             =   false;
						if($scope.list.length == 0){
							$scope.action.products         =   true;
						}
					}

                    
				});
			});
        if ((srchData.fromdate != undefined) && (srchData.todate != undefined) && (srchData.fromdate != '') && (srchData.todate != '') ) {
            if (fromDate <= toDate) {
                $scope.action.fieldsrequired = false;
            } else {
                $scope.action.fieldsrequired = true;
                return false;
            }
        }
    };

    /**Inbound list**/
    $scope.inbound  =   function(){
        $scope.type_ibt =   "Inbound";
        $scope.searchPurchaseOrder();
    };

    /**Outbound list**/
    $scope.outbound =   function(){
        $scope.type_ibt =   "Outbound";
        $scope.searchPurchaseOrder();
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

        angular.element("#"+sessionStorage.status).attr('checked', false);

        delete sessionStorage.ibtSearchData;
        delete sessionStorage.ibtPageLimit;
        delete sessionStorage.typeIBT;
        delete sessionStorage.status;
        delete sessionStorage.storeid;
        delete sessionStorage.fromdate;
        delete sessionStorage.todate;
        delete sessionStorage.storename;
        delete sessionStorage.dashboard;
        $scope.dash = false;
        $scope.statusData.manualshpmtStatusSelected   =   [];
        $scope.statusData.transferStatusSelected   =   [];
        $scope.location             =   {};
        $scope.action.entryLimit    =   $rootScope.PAGE_SIZE;
        $scope.form    =   {};
        $rootScope.$broadcast('resetdata');
        $scope.form.status = [];
        $scope.locationDisplayName  =   '';
        $scope.advSearch.advSearchData = {};
        $scope.getLocation();
        
        // $scope.getLocation();
        // $scope.searchPurchaseOrder();

        ovcdataExportFactory.resetPdfHeaderData(); //Export Reset
    };

    //Copy a Purchase order
    $scope.purchaseOrderCopy = function(orderId) {
        //sessionStorage.copiedOrderid    =   orderId;
		sessionStorage.cpordid = orderId;
        $state.go('ovc.transfer-copy');
    };
    //For hierarchy location filter
    $scope.searchLocation = function(location){
        $scope.action.filterLocation    =   location;
    };
    /**Page change function**/
    $scope.pageChanged  =   function(){
        $scope.action.offset = ($scope.action.currentPage - 1) * $scope.action.entryLimit;
        $scope.searchPurchaseOrder();
    };

    //$scope.searchPurchaseOrder();
	
});
