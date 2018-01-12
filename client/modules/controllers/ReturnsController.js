var app = angular.module('OVCstockApp', ['ovcdataExport','ui.bootstrap.treeview']);
/****List  Orders***/
app.controller('listReturns', function($rootScope, $scope, $state, $http,  $cookieStore, $filter, $timeout, $stateParams, Data, ovcDash, ORDERSTATUS, RETURNTYPELIST,
system_settings, system_currencies, AsnTableService, ovcdataExportFactory,RETURNSTATUS, ADVANCESEARCHFIELDS,TreeViewService, advancedPrint , Utils) {
	var user_detail = $rootScope.globals['currentUser'];
	var user_id = user_detail['username'];
	sessionStorage.creturnid = '';
	$scope.selection = [];
	$scope.action 	=	{};
	$scope.location =	{};

	$('.hidcal').datepicker({
		//format: "mm/dd/yyyy",
		autoclose: true,
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
    

	/*if($stateParams.fullList){
        delete sessionStorage.returnsSearchData;
        delete sessionStorage.returnsPageLimit;
        delete sessionStorage.fromdate;
        delete sessionStorage.todate;
        delete sessionStorage.storeid;
        delete sessionStorage.dashboard;

        $scope.dash = false;
    }*/

	$scope.lorders	=	{};
    
    if(sessionStorage.returnsSearchData){
        $scope.lorders    =   JSON.parse(sessionStorage.returnsSearchData);
    }

	/* get store or locations from mysql service */
	// var currensymbs = $scope.translation.currencylist[0];
	// var currcodes = system_currencies[0];
	// $scope.currency = currensymbs[currcodes.code];
	var ordercodes = $scope.translation.orderstatuslist[0];
	var cordercodes = ORDERSTATUS;
	var pordercodes = [];
	angular.forEach(cordercodes, function(item) {
		var purch = item.code;
		var porder = ordercodes[purch];
		item.label = porder;
		pordercodes.push(item);
	});
	$scope.order_datas = pordercodes;
	
	var ordercodes1 = $scope.translation.returnstypelist;
	var cordercodes1 = RETURNTYPELIST;
	var pordercodes1 = [];
	angular.forEach(cordercodes1, function(item) {
		var purch1 = item.code;
		var porder1 = ordercodes1[purch1];
		item.label = porder1;
		pordercodes1.push(item);
	});
	var orderStatusList     =   $scope.translation.returnstatuslist[0];
    var orderStatus         =   [];
	$scope.Status 			=	"status";

    angular.forEach(RETURNSTATUS, function(item) {
        item.label          =   orderStatusList[item.code];
        orderStatus.push(item);
    });
    $scope.statusData                =  {};
    $scope.statusData.orderStatusList           =   orderStatus;
    $scope.statusData.returnStatusList       =   {};
    $scope.statusData.returnStatusList       =   orderStatus;
    $scope.statusData.returnStatusSelected   =   [];
    $scope.lorders.shiptostore				 =	 [];

    var statusdata = [];
    if( sessionStorage.status){
        angular.forEach(orderStatus,function(item){
            if(sessionStorage.status == item.code){
                item.selected = true;
                statusdata.push(item);
            }
        });
        $scope.statusData.returnStatusSelected = statusdata;
    }
    var currencylabel  =   $scope.translation.currencylist[0];
    var currencylist   =   [];
	Utils.userLocation(1).then(function(results){
		if (results.status == 'error') {
			$scope.store_datas = [];
		} else {
			$scope.store_datas = results;
			angular.forEach(results, function(item) {
				currencylist[item.id]    =   item.currency;
			});
			if($scope.store_datas.length==1){
				$scope.lorders.shiptostore	=	results[0].id;
			}
		}
	}, function(error){
		console.log('User Location error :' + error);
	});
	 /*For heirarical dropdown Filter*/
	$scope.searchLocation = function(location){
		$scope.action.filterLocation = location;
	}
	var listlocs = [];
	function hierarcylocation(){
		Utils.hierarchylocation().then(function(results){
		 $scope.storeLocData =   TreeViewService.getLocData(results);  
		 angular.forEach(results.hierarchy, function(item){
		 	listlocs[item.id] = item.name;
		 });
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
			                $scope.porder_search();
			        	}, 800);
                    }
                    else{
                        $scope.checkBoxSelect($scope.storeLocData[0]);
                        $scope.addSelectedClass($scope.storeLocData[0]);
                        $timeout(function() {
			                $scope.porder_search();
			        	}, 800);
                }    
	    }, function(error){
	    	console.log('hierarcylocation Error : '+ error);
	    });
	}
	hierarcylocation();
	
	$scope.setPage = function(pageNo) {
		$scope.currentPage = pageNo;
	};
	
	$scope.reverse = '';
	$scope.predicate = '';
	$scope.sort_by = function(predicate) {
		$scope.predicate = predicate;

		$scope.reverse = !$scope.reverse;

	}; 

	$scope.entryLimit 	= sessionStorage.returnsPageLimit ? sessionStorage.returnsPageLimit : $rootScope.PAGE_SIZE; //max no of items to display in a page

	if(sessionStorage.fromdate){
        $scope.lorders.fromdate   =   sessionStorage.fromdate;
    }

    if(sessionStorage.todate){
        $scope.lorders.todate     =   sessionStorage.todate;
    }

    if( sessionStorage.storeid) {
        $scope.lorders.shiptostore    =     sessionStorage.storeid;
    }
    else
    	$scope.lorders.shiptostore 	= '';
    
    $scope.advSearch   =   {};
    $scope.advSearch.advSearchData   =   {};
    $scope.advSearch.advSrchFields = {};
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

    $scope.setAdvSearchField = function(){
        var advSearchFieldArr = ADVANCESEARCHFIELDS['orders'];
        var advSearchField = {};
        angular.forEach(advSearchFieldArr,function(itm){
            advSearchField[itm] = true;
        });
        $scope.advSearch.advSrchFields = advSearchField;
    }
    $scope.setAdvSearchField();

	/*****Vendor Search*****/
	$scope.porder_search = function() {
		$scope.submitted = true;
		$scope.lorders.advSearchData = {};
		$scope.lorders.advSearchData = $scope.advSearch.advSearchData;
		sessionStorage.returnsSearchData    =   JSON.stringify($scope.lorders);
		sessionStorage.returnsPageLimit		=	$scope.entryLimit;
		$scope.searchingstatus  = [];

		angular.forEach($scope.statusData.returnStatusSelected , function(item){
            if($scope.searchingstatus.indexOf(item.id) ==-1){
               $scope.searchingstatus.push(item.code);
            }        
        });
		 var orderStatus             =   ($scope.searchingstatus) || '';

		var data = $scope.lorders;
		var pordernumber = '';
		var erpno = '';
		if (data.ponumber != undefined) {
			pordernumber = data.ponumber;
		}
		if (data.erpnumber != undefined) {
			erpno = data.erpnumber;
		}
		if ((data.fromdate != undefined) && (data.fromdate != '')) {
			var fromDate = $filter('dateFormChange')(data.fromdate);
		} else {
			var fromDate = '';
		}
		if ((data.todate != undefined) && (data.todate != '')) {
			var toDate = $filter('dateFormChange')(data.todate);
		} else {
			var toDate = '';
		}
		if ((data.fromdate != undefined) && (data.todate != undefined) && (data.fromdate != '') && (data.todate != '')) {
			if (fromDate <= toDate) {
				$scope.fieldsrequired = false;
			} else {
				$scope.fieldsrequired = true;
				$timeout(function() {
					$scope.fieldsrequired = false;
				}, 3000);
				return false;
			}
		}
		// if (data.shiptostore != undefined) {
		// 	var shipToLocation = data.shiptostore;
		// } else {
		// 	var shipToLocation = '';
		// }
		var storeIds ='';
         if(angular.isArray($scope.location.id)){
            storeIds                = $scope.location.id.join() ;
         }
        
		var shipToLocation 		=	storeIds;

		if (data.orstatus != undefined) {
			var ostatus = data.orstatus;
		} else {
			var ostatus = '';
		}

		var sku_data    =   data.advSearchData.result?data.advSearchData.result.split('~'):'';
        var sku         =   sku_data?sku_data[0]:'';
        var asnNo       =   data.advSearchData.asnNo?data.advSearchData.asnNo:'';
        var frmQty      =   data.advSearchData.fromQtyRange?data.advSearchData.fromQtyRange:'';
        var toQty       =   data.advSearchData.toQtyRange?data.advSearchData.toQtyRange:'';
        var frmPrice    =   data.advSearchData.fromPriceRange?data.advSearchData.fromPriceRange:'';
        var toPrice     =   data.advSearchData.toPriceRange?data.advSearchData.toPriceRange:'';
        data.locationTitle = $scope.location.title;
		/*************PDF Export******************/
		if(data.locationTitle || data.fromDate || data.toDate || data.advSearchData.result || data.advSearchData.asnNo || data.advSearchData.fromQtyRange || data.advSearchData.toQtyRange || data.advSearchData.fromPriceRange || data.advSearchData.toPriceRange)
		advancedPrint.getAdvancedPrint(data);

        /*var pdf_data = [];

        if($scope.lorders.shiptostore && $scope.lorders.shiptostore.length > 0)
        {
            var obj =   {};
            obj.label   =   "Store";
            obj.value   =   $scope.lorders.shiptostore;
            pdf_data.push(obj);
        }

        if(data.fromdate && data.fromdate.length > 0 && data.todate && data.todate.length > 0)
        {
            var obj =   {};
            obj.label   =   "Date Range";
            obj.value   =   data.fromdate +'-' + data.todate;
            pdf_data.push(obj);
        }
        
        if(pdf_data.length > 0)
            ovcdataExportFactory.setPdfHeaderData(pdf_data);*/
        /*************PDF Export******************/
			Data.get('/vendor').then(function(data) {
				var allvendors = [];
				var exvendors = data;
				angular.forEach(exvendors, function(item) {
					var newobj = {
						id: item._id,
						companyname: item.companyName
					}
					allvendors.push(newobj);
				});
				var listvendors = [];
				var lvendors = allvendors;
				angular.forEach(lvendors, function(item) {
					listvendors[item.id] = item.companyname;
				});
				var allorders = [];
				angular.forEach(pordercodes1, function(item) {
					allorders[item.code] = item.label;
				});
				var orderstats = [];
				angular.forEach(pordercodes, function(item) {
					orderstats[item.code] = item.label;
				});
				Data.get('/return?fromdate=' + fromDate + '&todate=' + toDate + '&shiptolocation=' + encodeURIComponent(shipToLocation) +
					'&purchaseordernumber=' + pordernumber + '&orderNumber=' + erpno + '&orderstatus=' + orderStatus + '&sku='+sku+'&asnNo='+asnNo+'&frmQty='+frmQty+'&toQty='+toQty+'&frmPrice='+frmPrice+'&toPrice='+toPrice).then(function(data) {
					var porderlist = [];
					$scope.list1 = data;
					angular.forEach($scope.list1, function(item) {
						var abc = item.vendorId;
						var ordloc = item.shipToLocation;
						var otype = item.purchaseOrderType;
						var ordrstatus = item.orderStatus;
						var createdate = $filter('datetimeForm')(item.created);
						item.createddate = createdate;
						if (abc != "") {
							var bcd = listvendors[abc];
							item.vendorname = bcd;
						} else {
							item.vendorname = "";
						}
						if (ordloc != "") {
							var locname = listlocs[ordloc];
							item.recipient 	= 	 locname;
							item.currency 	=	 currencylabel[currencylist[ordloc]];
						} else {
							item.recipient = "";
						}
						if (otype != "") {
							item.ordertype = allorders[otype];
						} else {
							item.ordertype = "";
						}
						if (ordrstatus != "") {
							item.orderstus = orderstats[ordrstatus];
						} else {
							item.orderstus = "";
						}
						porderlist.push(item);
					});
					$scope.list2 = porderlist;

					$scope.list = $scope.list2;
					$scope.currentPage = 1; //current page
					$scope.filteredItems = $scope.list.length; //Initially for no filter  
					$scope.totalItems = $scope.list.length;
				});
			}, function(error){
				console.log('vendor Service Error :' + error);
			});
	}
	$scope.fieldsrequired = false;
	$scope.change_todate = function() {
		$scope.fieldsrequired = false;
	}
	$scope.change_frdate = function() {
		$scope.fieldsrequired = false;
	}
	/***Reset Search****/
	$scope.porder_reset = function() {
		delete sessionStorage.returnsSearchData;
        delete sessionStorage.fromdate;
        delete sessionStorage.todate;
        delete sessionStorage.storeid;
        delete sessionStorage.dashboard;

        $scope.dash = false;
    	$scope.statusData.returnStatusSelected   =   [];
		$scope.lorders = {};
		$scope.location 	=	{};
		hierarcylocation();
		$scope.advSearch.advSearchData = {};
		//$scope.porder_search();
		ovcdataExportFactory.resetPdfHeaderData(); //Export Reset
	}
	/******Copy Return*******/
	 $scope.porder_copy = function(returnid) {
           // var corderid = returnid;
            sessionStorage.creturnid = returnid;
            $state.go('ovc.return-copy');
    }
	/*****Delete Purchase Order****/
	$scope.porder_delete = function(id) {
		var puorderid = id;
		$.confirm({
			title: 'Delete Purchase Order',
			content: 'Confirm delete?',
			confirmButtonClass: 'btn-primary',
			cancelButtonClass: 'btn-primary',
			confirmButton: 'Ok',
			cancelButton: 'Cancel',
			confirm: function() {
				/* Data.delete('/order/'+puorderid).then(function (data) {
				
                    	var output={"status":"success","message":"Purchase Order Deleted Successfully"};
                    	Data.toast(output);
                    	$scope.servicefun();
                    	
                    }); */
				return false;
			},
			cancel: function() {
				return false;
			}
		});
		return false;
	}
	//Init
	// $scope.selectedLanguage = OVC_CONFIG.default_lang;
	//$scope.servicefun();
	// $scope.porder_search();
	$scope.toggleSelection = function toggleSelection(employeeName) {
		var idx = $scope.selection.indexOf(employeeName);
		// is currently selected
		if (idx > -1) {
			$scope.selection.splice(idx, 1);
		}
		// is newly selected
		else {
			$scope.selection.push(employeeName);
		}
	};
});

