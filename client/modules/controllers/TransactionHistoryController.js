var app=angular.module('OVCstockApp',['ui.bootstrap.treeview', 'ovcdataExport']);

app.controller('transactionhistorylistCtrl', function($rootScope, $scope,$state,  $timeout, $stateParams, ovcDash, Data,  DOCUMENTRULE, DOCREQFIELDS,TRANSTYPE, 
 TRANSTATUS , TRANSCODE, TRANTYPELIST, ADVANCESEARCHFIELDS,TreeViewService, ovcdataExportFactory, advancedPrint, Utils) {	 
		var user_detail = $rootScope.globals['currentUser'];
		var user_id = user_detail['username'];
    	$scope.offset       =   0;
		$scope.store_datas =	[];
		$scope.tranNameArr = 	[];
		$scope.action 	   =	{};
		$scope.currentPage      =   1; 
		$('.hidcal').datepicker({
		   autoclose: true,
		})
		$scope.location 	=	{};
		var listlocs 	=	[];
		$scope.getStores = function () {
			// ovcDash.get('apis/ang_userlocations?usid=' + user_id+'&isStore=1').then(function (results) {
			// 	if(results.status=='error'){
			// 		$scope.store_datas = [];
			// 	}else{
			// 		$scope.store_datas	=	results;
			// 		if($scope.store_datas.length==1){
			// 			$scope.ship.locationId 	=	results[0].id;
			// 		}
			// 	}
			// });
			/*For heirarical dropdown Filter*/
			$scope.searchLocation = function(location){
				$scope.action.filterLocation = location;
			}
			//For Hierarchy locations
			Utils.hierarchylocation().then(function(results){
				if(results){
					angular.forEach(results.hierarchy, function(item) {
						listlocs[item.id] = item.name;
					});
	           		$scope.storeLocData =   TreeViewService.getLocData(results);
	           		if(sessionStorage.tranhistoryLocation){
	                	$scope.checkBoxSelect($scope.storeLocData[0], true, sessionStorage.tranhistoryLocation);
	            		$scope.addSelectedClass($scope.storeLocData[0], true, sessionStorage.tranhistoryLocation);
	            		$timeout(function() {
			        		$scope.searchtransaction();
			        	}, 500);
	                }else{
	                	$scope.checkBoxSelect($scope.storeLocData[0], true);
	            		$scope.addSelectedClass($scope.storeLocData[0], true);
	            		$timeout(function() {
			        		$scope.searchtransaction();
			        	}, 500);
	                }
				}
	        }, function(error){
	        	console.log('hierarchy Location Error : '+ error);
	        })
		};
		$scope.getStores();

	/* get transaction types from micro service */
	$scope.serviceCalls = function () {

		var trantypes = [];
		var doctypes = [];
		var tranNameList  = [];

			Data.get('/transactiontype').then(function (results) {
				angular.forEach(results, function(values) {
					if((values.tranName != undefined) && (values.tranName != '') &&(values.tranTypeId !='') &&(values.tranTypeId != undefined)){
						// trantypes.push(values);
						tranNameList[values.tranTypeId]   =   values.tranName;
					}
				});
			});
			
			Data.get('/documenttype').then(function (results) {
				angular.forEach(results, function(values) {
					if((values.directiveName != undefined) && (values.directiveName != '') && (values.directiveTypeId != '') && (values.directiveTypeId != undefined)){
						// doctypes.push(values);
						tranNameList[values.directiveTypeId]   =   values.directiveName;
					}
				});
			});

        $scope.tranNameArr  =  tranNameList;

	}
	$scope.serviceCalls();
	// //$scope.getStores();
	// $scope.getTranType(); // get transaction type from micro service
	// $scope.getDocType(); // get Directive type from micro service
	$scope.advSearch   =   {};
    $scope.advSearch.advSrchFields = {};
   	$scope.advSearch.advSearchData   =   {};
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
        var advSearchFieldArr = ADVANCESEARCHFIELDS['transactionHistory'];
        var advSearchField = {};
        angular.forEach(advSearchFieldArr,function(itm){
            advSearchField[itm] = true;
        });
        $scope.advSearch.advSrchFields = advSearchField;
    }
    $scope.setAdvSearchField();

	$scope.transactions = [];
	/*****Select product using sku and name******/
	
  
	$scope.myCustomValidator = function(text){		
		return true;
	};

	$scope.trantypecodes 	= 	$scope.ovcLabel.transactionHistory.translist;
	 
	 var trtycodes 	= 	$scope.ovcLabel.transactionHistory.translist;
	 var trstatus 	= 	$scope.ovcLabel.transactionHistory.transtatus;
	 var trtype 	= 	$scope.ovcLabel.transactionHistory.transtype;
	 var transtype 	= 	$scope.ovcLabel.transactionHistory.trantypelist;
	 var ctrtycodes = 	TRANSCODE;
	 var ctrstatus 	= 	TRANSTATUS;
	 var ctrtype 	= 	TRANSTYPE;
	 var transtyp 	= 	TRANTYPELIST;
	 
		
		var trtypdata 	= 	[];
		angular.forEach(transtyp,function(item) {
						
			var abc 			=	item.code;
			var bcd 			= 	transtype[abc];
			item.label 			= 	bcd;	
			item.description 	= 	bcd;
				trtypdata.push(item);
		});
	 
		$scope.transactype 	= 	trtypdata;
		
		var ctrancodes 		= 	[];
		angular.forEach(ctrtycodes,function(item) {
						
			var abc 	= 	item.code;
			var bcd 	= 	trtycodes[abc];

			item.label 	= 	bcd;	
			ctrancodes.push(item);
		});
	 
		$scope.transcodes 	= 	ctrancodes;
		var ctrantype 		= 	[];
		angular.forEach(ctrtype,function(item) {
						
			var abc 	= 	item.code;
			var bcd 	= 	trtype[abc];

			item.label	= 	bcd;	
			ctrantype.push(item);
		});
	 
		$scope.transtype 		= 	ctrantype;
		$scope.fieldsrequired 	=	false;
		$scope.change_todate 	= 	function(){
			// $scope.action['errorToDate'] 	=	false;
			$scope.fieldsrequired 			=	false;
		}
		 
		$scope.change_frdate 		= 	function(){
			// $scope.action['errorFromDate'] 	=	false;
			$scope.fieldsrequired 			= 	false;
		};
		 
		 var transdatas 	= 	$scope.ovcLabel.transactionHistory.trantypelist;

		$scope.ship 		=	{};

		if($stateParams.fullList){
	        delete sessionStorage.transactionHistorySearchData;
	        delete sessionStorage.transactionHistoryPageLimit;
	        delete sessionStorage.tranhistoryLocation;
	        delete sessionStorage.currentPage;
	        delete sessionStorage.entryLimit;
	    }

	    if(sessionStorage.transactionHistorySearchData){
	        $scope.ship     =   JSON.parse(sessionStorage.transactionHistorySearchData);
	    }

	    $scope.entryLimit 		= 	sessionStorage.transactionHistoryPageLimit ? sessionStorage.transactionHistoryPageLimit : $rootScope.PAGE_SIZE; //max no of items to display in a page
		
		$scope.searchtransaction	=	function(){
				$scope.ship.advSearchData 	=	{};
				$scope.ship.advSearchData 	=	$scope.advSearch.advSearchData;
				var data 			=	$scope.ship;
				sessionStorage.transactionHistorySearchData 	=	JSON.stringify($scope.ship);
				sessionStorage.transactionHistoryPageLimit		=	$scope.entryLimit;
				$scope.submitted 		=	true;
				var countNumber 		= 	ponumber = transacttype = fromDate = toDate = '' ;

				countNumber  	=  data.countNumber ? data.countNumber : "";
				ponumber 		=  data.ponumber ? data.ponumber : "";
				transacttype 	=  data.transtype ? data.transtype : "";
				data.transcationType =	transtype[transacttype];
				fromDate 		=  data.fromdate ? $filter('dateFormChange')(data.fromdate) : "";
				toDate 			=  data.todate ? $filter('dateFormChange')(data.todate) : "";
				 
				if(data.fromdate && data.todate){
					if (fromDate <= toDate){
						$scope.fieldsrequired 	=	false;
					}else{
						
					 	$scope.fieldsrequired 	= 	true;
						return false;
					} 
				}
				
				var locData 	= 	$scope.location.id ? $scope.location.id : [];
				var fromlocation 	=	locData.join();
				sessionStorage.tranhistoryLocation 	=	fromlocation;

				/* if(data.transactionTypeId !=undefined){
					var trantype=data.transactionTypeId;
				}else{
					var trantype='';
				}if(data.documentTypeId !=undefined){
					var directivetype=data.documentTypeId;
				}else{
					var directivetype='';
				} */
				var sku_data		=	data.advSearchData.result?data.advSearchData.result.split('~'):'';
				var sku 			=	sku_data?sku_data[0]:'';
				var createdBy 		=	data.advSearchData.createdBy?data.advSearchData.createdBy:'';
				var fromQtyRange	=	data.advSearchData.fromQtyRange?data.advSearchData.fromQtyRange:'';
				var toQtyRange		=	data.advSearchData.toQtyRange?data.advSearchData.toQtyRange:'';
				var fromPriceRange 	=	data.advSearchData.fromPriceRange?data.advSearchData.fromPriceRange:'';
				var toPriceRange	=	data.advSearchData.toPriceRange?data.advSearchData.toPriceRange:'';
				data.locationTitle  = 	$scope.location.title;

				if((data.advSearchData.fromQtyRange != undefined) &&(data.advSearchData.toQtyRange != undefined )){
					if (fromQtyRange <= toQtyRange)
                    {
						$scope.rangeRequired 	=	false;
					}
					else
					{
					 	$scope.rangeRequired 	= 	true;
						return false;
					}
				}
				if((data.advSearchData.fromPriceRange != undefined) &&(data.advSearchData.toPriceRange != undefined )){
					if (fromPriceRange <= toPriceRange)
                    {
						$scope.rangeRequired 	=	false;
					}
					else
					{
					 	$scope.rangeRequired 	= 	true;
						return false;
					}
				}
				/*************PDF Export Search Data Fields******************/

				if(data.locationTitle || data.fromDate || data.toDate || data.advSearchData.createdBy || data.advSearchData.result || data.advSearchData.asnNo || data.advSearchData.fromQtyRange || data.advSearchData.toQtyRange || data.advSearchData.fromPriceRange || data.advSearchData.toPriceRange)
				advancedPrint.getAdvancedPrint(data);
				
			var user_detail1 	= 	$rootScope.globals['currentUser'];
			var user_id1 		= 	user_detail['username'];
			
				Data.get('/history?fromdate='+fromDate+'&todate='+toDate+'&fromLocationId='+ encodeURIComponent(fromlocation) +'&countNumber='+countNumber
				+'&purchaseordernumber='+ponumber+'&trantype='+transacttype+'&sku='+sku+'&createdBy='+createdBy+'&fromQtyRange='+fromQtyRange+'&toQtyRange='+toQtyRange+'&fromPriceRange='+fromPriceRange+'&toPriceRange='+toPriceRange+'&page_offset='+$scope.offset+'&page_lmt='+$scope.entryLimit).then(function (data) {
					var listdata 	= 	[];
					if(!data['error'])
					{
						angular.forEach(data.data,function(item1) {
							var ilocn 			= 	item1.fromLocationId;
							var tratype 		= 	item1.tranType;
							
							item1.transactionty =	transdatas[tratype];
							var ordertype 		=	item1.purchaseOrderType;
							var trtype 			=	item1.tranType;

							if(trtype == 'purchaseOrder' || trtype == 'manualShipment' || trtype == 'return' || trtype == 'DROP_SHIP' || trtype == 'transfer'|| trtype =='receipt' || trtype == 'ZFUT'){
								item1.document 	= 	item1.purchaseOrderNumber;
							}

							if(trtype == 'adjustment'){
								item1.document 	= 	item1.adjustmentNumber;	
								// ilocn 			= 	item1.fromLocationId;
							}
							if(trtype == 'count'){
								item1.document 	= 	item1.countNumber;
								// ilocn 			= 	item1.fromLocationId;
							}
							if(trtype == 'posTransaction'){
								item1.document 	= 	item1.postranNo;	
								// ilocn 			= 	item1.fromLocationId;
							}
							if(trtype == 'stockUpload'){
								item1.document 	= 	item1.tranTypeId;
							}
							item1.itslocation 		=	listlocs[ilocn];

							if(item1.tranTypeId && item1.tranTypeId != ''){
								item1.transactionName = $scope.tranNameArr[item1.tranTypeId]?$scope.tranNameArr[item1.tranTypeId]:item1.tranTypeId;
							}
							else if(item1.directiveTypeId && item1.directiveTypeId != ''){
								item1.transactionName = $scope.tranNameArr[item1.directiveTypeId]?$scope.tranNameArr[item1.directiveTypeId]:item1.directiveTypeId;
							}

							listdata.push(item1);

						});
					}

					$scope.list  			= 	listdata;
					$scope.filteredItems        =   data.total_count; //Initially for no filter  
                    $scope.itemsPerPage         =   $scope.list.length;
					// $scope.currentPage  	= 	1; //current page 
					// $scope.totalItems 		= 	$scope.list.length; 
					// $scope.currentPage = sessionStorage.currentPage ? sessionStorage.currentPage : 1;
					// if(sessionStorage.currentPage){
					// 	$scope.currentPage = sessionStorage.currentPage;
					// }
				});
				
			// });	
			
		}
		
		$scope.setPage = function(pageNo) {
			$scope.currentPage  = 	pageNo;
		};
		
		// $scope.pageChanged = function(){
		// 	sessionStorage.currentPage = $scope.currentPage;
			
		// };
		$scope.pageChanged  =   function(){
	       // $scope.offset = ($scope.currentPage - 1) * $scope.itemsPerPage;
	        $scope.offset = ($scope.currentPage - 1) * $scope.entryLimit;
	        $scope.searchtransaction();
	    };

		$scope.pageSizeChange = function(){
			sessionStorage.transactionHistoryPageLimit = $scope.entryLimit;
		}

		$scope.sort_by = function(predicate) {
			$scope.predicate 	= 	predicate;
			$scope.reverse 		= 	!$scope.reverse;
		};
		
		$scope.reset_transact=function(){
			/* var newcon=document.getElementById("search");
			newcon.value= "";	 */
			delete sessionStorage.transactionHistorySearchData;
			delete sessionStorage.transactionHistoryPageLimit;
			delete sessionStorage.tranhistoryLocation;
			delete sessionStorage.currentPage;
			delete sessionStorage.entryLimit;
			$scope.ship 	=	{};
    		$scope.advSearch.advSearchData   =   {};
			$scope.getStores();
		}
		
 });
 
 
app.controller('transactiondetailCtrl', function($rootScope, $scope, $state, $stateParams,  $timeout , ovcDash, Data, RULEDEFN, DOCUMENTRULE,
 TRANTYPELIST,DOCREQFIELDS,TRANSTYPE, TRANSTATUS , TRANSCODE, $location, Utils) {	 
 
			var trannumber 		= 	$stateParams.trannum; 

			$scope.action		=	{};
			var passingId 		=	'';
			var user_detail 	= 	$rootScope.globals['currentUser'];
			var user_id 		= 	user_detail['username'];
			$scope.action.entryLimit   =   50;
			$scope.action.currentPage  =   1;
			$scope.action.offset       =   0; 
		//	$scope.tranpo = $scope.trancount =$scope.tranman = false;//tranId
		/****from configuration******/
	var trule_con 	= 	RULEDEFN;
	var drule_con 	= 	DOCUMENTRULE;
	var tlab_bal 	= 	$scope.ovcLabel.transactionHistory.transrules;
		var balance1 	=	[];var balance2 	=[];var balance3 	=[];var balance31 	=[]; var balance32 	=[];
		var balance1id 	=	[];var balance2id 	=[];var balance3id 	=[];var allbalances =[];
		var trlist 		= 	[];
		var trdata 		= 	{};
		var trinobj 	= 	[];
		
		// var currensymbs 	= 	$scope.translation.currencylist[0];
    	// var currcodes 		= 	system_currencies[0];
    	// $scope.currency 	= 	currensymbs[currcodes.code];
		angular.forEach(trule_con,function(trules,key) {
			angular.forEach(trules,function(trules2,key2) {
				angular.forEach(trules2,function(item) {
					item.title 		= 	tlab_bal[item.Name];
					item.parent2 	= 	'tlpall';
					item.id 		= 	't'+item.id;
					item.oldvalue 	= 	0;
					item.newvalue 	= 	0;
					if((key2=='BALFIELDS') || (key2== 'HELDSTOCK')){
					item.selected 	= 	true;
					item.parent1 	= 	'tlpbalance';
				 	balance1.push(item);
					balance1id.push(item.id);
					}
					if((key2=='CALCFIELDS')){
					item.selected 	= 	false;
					item.parent1 	= 	'tlpcalc';
				 	balance2.push(item);
					balance2id.push(item.id);
					}
					allbalances.push(item);
				});
			});
		});
		$scope.balancefields1 		=	balance1;
		$scope.balancefields2 		=	balance2;
		$scope.balanceids1 			=	balance1id;
		$scope.balanceids2 			=	balance2id;
		
		angular.forEach(drule_con,function(drules,key) {
			angular.forEach(drules,function(drules2,key2) {
				angular.forEach(drules2,function(item) {
					item.title 		=	tlab_bal[item.Name];
					item.id 		=	't'+item.id;
					item.parent1	=	'tlpdocs';
					item.parent2 	=	'tlpall';
					item.selected	=	false;
					 if((key2=='GOODSIN')){
					balance31.push(item);
					}
					if((key2=='GOODSOUT')){
					
				 	balance32.push(item);
					} 
				 	balance3.push(item);
					balance3id.push(item.id);
					allbalances.push(item);
				});
			});
			
		});
		$scope.balancefields31 	=	balance31;
		$scope.balancefields32 	=	balance32;
		$scope.balancefields3  	=	balance3;
		$scope.balanceids3 		=	balance3id;
		$scope.totbalances 		=	allbalances;
		
			 var transtype 		= 	$scope.ovcLabel.transactionHistory.trantypelist;
			 var transtyp 		= 	TRANTYPELIST;
			 
				
			var trtypdata 		= 	[];
			var transactionData =	{};
			angular.forEach(transtyp,function(item) {
							
				var abc 		= 	item.code;
				var bcd 		= 	transtype[abc];

					item.label			=	bcd;	
					item.description	=	bcd;
					trtypdata.push(item);
			});
		 
			$scope.transactype 			= 	trtypdata;
		   
			var transdatas 				=	$scope.ovcLabel.transactionHistory.trantypelist;

		function TansactionHistoryItem (){
			//Get History Item with pagination
		    Data.get('/historyitem?tranId='+trannumber +'&page_offset='+$scope.action.offset+'&page_lmt='+$scope.action.entryLimit).then(function (historyData) {
				if(historyData && historyData.count){
					var  hitems 		 = 	historyData.data;
					$scope.filteredItems =  historyData.count;
					var IdArray 	= 	[];
					//For Getiing TranscationId
					angular.forEach(hitems , function(value){
						IdArray.indexOf(value._id) == -1  ? IdArray.push(value._id) : '';
					});
					//Get Inventory Data for hover Table 
					Data.post('/historyinventory',{data:{tranitemIdArray :IdArray}}).then(function (data) {
						$scope.list1 	  = hitems;
						if(data)
						$scope.InventData = data;
					});
					$scope.trannumber 	=	trannumber;
				}else{
					$scope.list1 = [];
				}
			});
		}
		TansactionHistoryItem();
			
				var trantype = directtype 	= frmlocid 	= tolocid = trcode 		= trandate = tranreason= '';
				var ponum 	 = asnum 		= packnum 	= cntname = cntreason 	= adjustNumber = countnumber = '';
				
				Data.get('/history?id='+ trannumber).then(function (data) {
					adjustNumber 			= 	data.adjustmentNumber;
					countnumber 			=	data.countNumber;
					$scope.statetype		=	data.tranType;
					var currencylabel   	=   $scope.ovcLabel.global.currency;
                	var currencylist    	=   [];
					Utils.userLocation().then(function(userLoc){
							var listlocation 	= 	[];
							if(userLoc.status=='error'){
							var alllocs 		= 	[];
							}else{
							var alllocs 		= 	userLoc;
							}
							angular.forEach(alllocs, function(item) {
								listlocation[item.id] 	 = 	 item.displayName;
								currencylist[item.id]    =   item.currency;
							});
							$scope.location  	=	listlocation[data.fromLocationId];
						
							$scope.currency     =   currencylabel[currencylist[data.fromLocationId]];

							var createdbyid 	=	data.createdBy;

						if(data.createdBy=='batchuser'){
							$scope.createdby 	=data.createdBy;}else{
							ovcDash.get('apis/ang_username?user_id=' + createdbyid).then(function(userdata) {
									var fname 	=	userdata.firstName;
									var lname 	=	userdata.lastName
									$scope.createdby 	=	fname + ' ' + lname;
							});
						}

						$scope.ordertype 		=	data.purchaseOrderType;


						if(data.tranType == 'purchaseOrder' || data.tranType == 'transfer' || data.tranType == 'manualShipment' || data.tranType == 'return' || data.tranType == 'DROP_SHIP' || data.tranType == 'ZFUT'){
							$scope.tranpo 		=	true;
							$scope.trancount 	= 	false;
							$scope.tranman 		= 	false;
							$scope.tranReceipt 	=	false;
							tranreason 			= 	transdatas[data.tranType];
							ponum 				= 	data.purchaseOrderNumber;
							if((data.asnid != '') && (data.asnid != undefined)) {
								asnum 			= 	data.asnid;
								$scope.asndet 	= 	true;
							}else{
								$scope.asndet 	= 	false;
							}
						}
						if(data.tranType =='receipt'){
							$scope.tranpo 		=	false;
							$scope.trancount 	= 	false;
							$scope.tranman 		= 	false;
							$scope.tranReceipt 	=	true;
							tranreason 			= 	transdatas[data.tranType];
							ponum 				= 	data.purchaseOrderNumber;
							if((data.asnid != '') && (data.asnid != undefined)) {
								asnum 			= 	data.asnid;
								$scope.asndet 	= 	true;
							}else{
								$scope.asndet 	= 	false;
							}
						}
						if(data.tranType == 'stockUpload'){
							$scope.tranpo 		=	false;
							$scope.tranUpload 	= 	true;
							$scope.trancount 	= 	false;
							$scope.tranman 		= 	false;
							$scope.tranReceipt 	=	false;
							$scope.asndet 	    = 	false;
						}
						$scope.orderlinkChange 	=	false;
						if($scope.statetype == 'purchaseOrder' || data.tranType == 'transfer' || data.tranType == 'manualShipment' || data.tranType == 'ZFUT'){

							Data.get('/order?purchaseordernumber='+ponum+'&order_type='+$scope.ordertype).then(function(response) {
								angular.forEach(response.order_data,function(order){
									passingId 		=	order._id;
									$scope.orderId 	=	passingId;
									$scope.statustype 	=	order.orderStatus;
									if(data.tranType == 'transfer' || data.tranType == 'manualShipment'){
									$scope.displaystatus = response.displayStatusObject[order.purchaseOrderNumber];
									}
								});
								$scope.changeorders(passingId);
							},function(error){
							console.log('orderservice faild');
							});
						}
						if($scope.statetype == 'DROP_SHIP'){
							Data.get('/dropship?purchaseordernumber='+ponum).then(function(data) {
								angular.forEach(data.order_data,function(order){
									passingId 		=	order._id;
									$scope.orderId 	=	passingId;
									$scope.statustype 	=	order.orderStatus;
								});
								$scope.changeorders(passingId);
							},function(error){
							console.log('orderservice faild');
							});
						}

						if($scope.statetype == 'receipt'){
							Data.get('/receipt?orderNumber='+ponum).then(function(data) {
								angular.forEach(data.order_data,function(order){
									passingId 		=	order._id;
									$scope.orderId 	=	passingId;
									$scope.statustype 	=	order.orderStatus;
								});
								$scope.changeorders(passingId);
							},function(error){
							console.log('orderservice faild');
							});
						}

						if($scope.statetype == 'return'){
							Data.get('/return?orderNumber='+ ponum).then(function(data) {
								angular.forEach(data,function(order){
									passingId 		=	order._id;
								});
								$scope.changeorders(passingId);
							},function(error){
							console.log('return service faild');
							});
						}

						if((adjustNumber) &&  (adjustNumber != '')){
							Data.get('/adjustment?adjustmentNumber='+ adjustNumber).then(function(data) {
								angular.forEach(data.adjustment_data,function(order){
									$scope.orderId 	=	order._id;
									passingId 		=	order._id;
								});
								$scope.changeorders(passingId);
							},function(error){
								console.log('Adjustmnet Service faild');
							});
						}
						
						$scope.tranPOS 	= 	false;
						if(data.tranType == 'count'){
							$scope.trancount 	= 	true;
							$scope.tranpo  		= 	false;
							$scope.tranman  	= 	false;
							tranreason 			=	transdatas[data.tranType];
							$scope.location 	=	listlocation[data.fromLocationId];
							cntreason 			=	data.countType;
							cntname 			=	data.countName;
						}

						if(data.tranType == 'posTransaction'){
							$scope.tranman 		= 	false;
							$scope.tranpo 		= 	false;
							$scope.tranPOS 		= 	true;
							$scope.trancount 	= 	false;
							$scope.location 	=	listlocation[data.fromLocationId];
							tranreason 			=	transdatas[data.tranType];
						}
						if(data.tranType == 'adjustment'){
							$scope.tranman 		= 	true;
							$scope.tranpo 		= 	false;
							$scope.trancount 	= 	false;
							$scope.location 	=	listlocation[data.fromLocationId];
							tranreason 			=	transdatas[data.tranType];
						}

						if((data.tranTypeId != undefined) && (data.tranTypeId != '')){
							 trantype 			=	data.tranTypeId;
							 $scope.trntype 	=	true;
						}else{
							 $scope.trntype 	=	false;
						}

						if((data.directiveTypeId != undefined) && (data.directiveTypeId != '')){
							directtype 			= 	data.directiveTypeId;
							 $scope.dirtype 	= 	true;
						}else{
							 $scope.dirtype 	= 	false;
						}

						if(data.fromLocationId != undefined){
							frmlocid 			= 	data.fromLocationId;
						}

						if(data.toLocationId != undefined){
							 tolocid 		  = 	data.toLocationId;
						}

						if(data.transcode != undefined){
							 trcode 	  	= 	data.transcode;
						}

						if(data.createdDate != undefined){
								var crdate 	=	data.createdDate;
								var date  	= 	new Date(crdate);

								var day 	= 	('0' + date.getDate()).slice(-2);
								var month 	= 	('0' + (date.getMonth() + 1)).slice(-2);
								var year 	= 	date.getFullYear();

								trandate 	=  	year + '-' + month + '-' + day;
						}
						$scope.changeorders  	=	function(pass){
							if(pass && pass !='' && pass != undefined){
							}else{
								$scope.orderlinkChange 	=	true;
							}
						}
						if(data.tranType != undefined){
						}
						$scope.transdet 	= 	{tranactionname:data.transactionname,transdate:trandate,transtypeName:trantype,transcode:trcode,
						directivetype:directtype,directiveName:data.directiveName,transactiondate:data.createdDate,transactionreason:tranreason,
						expirationdate:data.expirationdate,fromloc:frmlocid,ponumber:ponum,asnnumber:asnum,packnumber:packnum,countreason:cntreason,
						countname:cntname,toloc:tolocid,vendorno:data.vendornumber,ladbill:data.billoflading,
						comment:data.comments,postranNo:data.postranNo,adjnumber:adjustNumber,countno:countnumber
						};
					}, function(error){
						console.log(error + 'User Location Fails');
					});
				});
				/****For Order Changes To the Review Screen****/
				$scope.orderstatechange 	=	function(){
					if(passingId && passingId !='' && passingId != undefined){
						if($scope.ordertype == 'PUSH' && $scope.statustype == 'draft'){
							$state.go('ovc.manualShipment-edit',{porderid:passingId,shipmentstatus:$scope.displaystatus,pageFrom:'transactionHistory'});//For Draft order 
						}
						if($scope.ordertype == 'PUSH' && $scope.statustype != 'draft'){
							$state.go('ovc.manualShipment-summary', {summaryid:passingId,transfertype:'Inbound', transferfunc:'summary',status:$scope.displaystatus,pageFrom:'transactionHistory'});//summary for second tab
						}
						if($scope.ordertype == 'IBT_M' && $scope.statustype == 'draft'){
							$state.go('ovc.transfer-edit',{porderid:passingId,transferstatus:$scope.displaystatus,pageFrom:'transactionHistory'});//For Draft Order
						}
						if($scope.ordertype == 'IBT_M' && $scope.statustype != 'draft'){
							$state.go('ovc.viewtransfers-summary',{transferid:passingId,ordertransfertype:'Inbound', transferfunc:'summary',transferstatus:$scope.displaystatus,pageFrom:'transactionHistory'});//summary for second tab
						}
						if($scope.statetype == 'return'){
							$state.go('ovc.returns-edit',{returnid:passingId,pageFrom:'transactionHistory'});
						}
						if($scope.statustype == 'draft' && ($scope.ordertype == 'MAN' || $scope.ordertype == 'ZFUT' || $scope.ordertype == 'RPL')){
							$state.go('ovc.purchaseorder-edit',{porderid:passingId, pageFrom:'transactionHistory'});
						}
						if($scope.statustype != 'draft' && ($scope.ordertype == 'MAN' || $scope.ordertype == 'ZFUT' || $scope.ordertype == 'RPL')){
							$state.go('ovc.vieworders-list',{porderid:passingId, selectTab:'summary',pageFrom:'transactionHistory'});
						}
						if($scope.ordertype == 'MR_MAN' || $scope.ordertype == 'MR_IBT_M'){
							$state.go('ovc.manualReceipt-edit',{manualid:passingId, pageFrom:'transactionHistory'});
						}
						if($scope.statustype == 'draft' && $scope.ordertype == 'DROP_SHIP'){
							$state.go('ovc.customerorders-edit',{orderid:passingId, pageFrom:'transactionHistory'});
						}
						if($scope.statustype != 'draft' && $scope.ordertype == 'DROP_SHIP'){
							$state.go('ovc.customerorders-summary',{orderid:passingId, selectTab:'summary',pageFrom:'transactionHistory'}); 
						}
					}else{
						console.log('passingId is empty');
					}
					
				};

				$scope.asnstateChange 	=	function(){
					if(passingId && passingId !='' && passingId != undefined){
						if($scope.ordertype == 'PUSH'){
							$state.go('ovc.manualShipment-summary', {summaryid:passingId,transfertype:'Inbound', transferfunc:'resolve',pageFrom:'transactionHistory'});//resolve for second tab
						}
						if($scope.ordertype == 'IBT_M'){
							$state.go('ovc.viewtransfers-summary',{transferid:passingId, transfertype:'Inbound', transferfunc:'resolve',pageFrom:'transactionHistory'});//resolve for second tab
						}
						if($scope.ordertype == 'MAN' || $scope.ordertype == 'ZFUT'){
							$state.go('ovc.vieworders-list',{porderid:passingId, selectTab:'shipment',pageFrom:'transactionHistory'}); 
						}
						if($scope.ordertype == 'MR_MAN' || $scope.ordertype == 'MR_IBT_M'){
							$state.go('ovc.manualReceipt-edit',{manualid:passingId, pageFrom:'transactionHistory'});
						}
					}else{
						console.log('passingId is empty');
					}
				};

				$scope.hoverIn = function(){
                    this.hoverEdit 	= true;
            	};

            	$scope.hoverOut = function(){
                	this.hoverEdit  	= false;
            	};	
				$scope.move_detail=function(){
		
				}
		
	$scope.selection 	= 	[];
	$scope.unselection 	= 	[];
	
		$scope.trefineopen=function(){		
			var myEl = angular.element( document.querySelector( '#tbalance_pop' ) );
			//myEl.removeClass('open'); 
			myEl.toggleClass('open');
		};
		
		$scope.trefinecancel=function(){		
			$timeout(function() {
					angular.element('#tcancel_btn').trigger('click');
				}, 1);
		};
		
		$scope.refineremove=function(){
			var elem = document.querySelector('table');
			
			for(i=0;i< $scope.selection.length;i++){
				var myEl1 = angular.element( document.querySelectorAll( '.'+$scope.selection[i] ) );
			
				myEl1.removeClass('ng-hide');
				
			}
			
			for(i=0;i< $scope.unselection.length;i++){
				var myEl = angular.element( document.querySelectorAll( '.'+$scope.unselection[i] ) );
				myEl.addClass('ng-hide');	
				
			}
			$scope.trefinecancel();
		}
		
		
		
	$scope.toggleSelection = function(employeeName) {
		var idx 	= 	$scope.selection.indexOf(employeeName.id);
		var idxun 	= 	$scope.unselection.indexOf(employeeName.id);
		
		if(employeeName.selected ==	false){
			if($scope.unselection.indexOf(employeeName.id) == -1) {
			   $scope.unselection.push(employeeName.id);
			}
			$scope.selection.splice(idx, 1);
		}else{
			if($scope.selection.indexOf(employeeName.id) == -1) {
			   $scope.selection.push(employeeName.id);
			}
			$scope.unselection.splice(idxun, 1);
		}
		
		var bal1chk	=	true;
		angular.forEach($scope.balancefields1, function (value,key) {
			if( ! value.selected)
			{
				bal1chk	=	false;
			}
		});
		
		$scope.action.bal1checked = bal1chk;
		
		var bal2chk		=	true;
		angular.forEach($scope.balancefields2, function (value,key) {
			if( ! value.selected)
			{
				bal2chk	=	false;		  
			}
		});
		
		$scope.action.bal2checked 	= 	bal2chk;
		var bal3chk					=	true;
		angular.forEach($scope.balancefields3, function (value,key) {
			if( ! value.selected)
			{
				bal3chk	=	false;
			}
		});
		
		$scope.action.bal3checked = bal3chk;	
	};

	
	$scope.selectAll = function(obj, objects){   
		obj		=	! obj;
		angular.forEach(objects, function (item) {
            item.selected = !obj;
			
			var idxs 	=	 $scope.selection.indexOf(item.id);
			var idxuns 	= 	 $scope.unselection.indexOf(item.id);
			
			if(!item.selected){
				if($scope.unselection.indexOf(item.id) == -1) {
				   $scope.unselection.push(item.id);
				}
				$scope.selection.splice(idxs, 1);
			}else{
				if($scope.selection.indexOf(item.id) == -1) {
				   $scope.selection.push(item.id);
				}
				$scope.unselection.splice(idxuns, 1);
			}
        });	
   	} 
   	if(sessionStorage.BalancereportSession){
   		$scope.balanceReport 	=	true;
   	}

   	$scope.backToReport 	=	function(){
        $state.go('ovc.balance-report');
   	}

   	$scope.pageChanged  =   function(){
        $scope.action.offset = ($scope.action.currentPage - 1) * $scope.action.entryLimit;
        TansactionHistoryItem();
    };

    $scope.CheckOldValue = function(id , blanceType){
    	return $scope.InventData[id] && $scope.InventData[id][blanceType] && $scope.InventData[id][blanceType]['oldvalue'] ? $scope.InventData[id][blanceType]['oldvalue'] : 0 ; 
    }

    $scope.CheckNewValue = function(id , blanceType){
    	return $scope.InventData[id] && $scope.InventData[id][blanceType] && $scope.InventData[id][blanceType]['newvalue'] ? $scope.InventData[id][blanceType]['newvalue'] : 0 ; 
    }
   	     				
});
 
 /****************Balance view*******************/
 app.controller('transactionbalanceCtrl', function($scope,$state, $stateParams, $timeout , ovcDash, Data, DOCUMENTRULE,
 DOCREQFIELDS,TRANSTYPE,TRANSTATUS , TRANSCODE) {	 
 
		var trannumber = $stateParams.trannum; 
			
			$scope.trannumber=trannumber;
				Data.get('/historyitem?tranId='+trannumber).then(function (data) {
				
				var ndata=data[0];
				$scope.trbalances={transactionname:ndata.transactionname, productid:ndata.productId};
				
			});
		
			Data.get('/historyinventory?tranId='+trannumber).then(function (data) {
				
			 	var traninv 	=	data;
				var toh 		=	[];
				var tallocated	=	[];
				var treserved 	=	[];
				var theld 		=	[];
				var treturntovendor	 	=[];
				var tats 		= 	[];
				var tatp 		=	[];
				var twac 		=	[];
				var torderin 	=	[];
				var tconfirmin	=	[];
				var tasnin 		=	[];
				var ttransitin 	=	[];
				var torderout 	=	[];
				var tconfirmout =	[];
				var tasnout 	=	[];
				var ttransitout =	[];
					
			var ohold=allold= resold= helold = rtvold=atsold=atpold=wacold = oinold=cinold=ainold=tinold= ooutold=coutold=aoutold=toutold=0;
			var ohnew=allnew= resnew= helnew = rtvnew=atsnew=atpnew=wacnew = oinnew=cinnew=ainnew=tinnew= ooutnew=coutnew=aoutnew=toutnew=0;
					
					angular.forEach(traninv,function(item) {
					
							var newobj 	= 	{oldvalue:item.prevValue,newvalue:item.newValue,balancetype:item.balanceType};
					
							if(item.balanceType=='oh'){
							
								toh 		= 	newobj;
							}
							if(item.balanceType=='allocated'){
								
								tallocated 	= 	newobj;
							}
							if(item.balanceType=='reserved'){
								
								treserved 	= 	newobj;
							}
							if(item.balanceType=='held'){
								
								theld 		=	newobj;
							}
							if(item.balanceType=='returnToVendor'){
								
								treturntovendor 	= 	newobj;
							}
							if(item.balanceType=='ats'){
								
								tats 	= 	newobj;
							}
							if(item.balanceType=='atp'){
								
								tatp 	= 	newobj;
							}
							if(item.balanceType=='wac'){
								
								twac 	= 	newobj;
							}
							if(item.balanceType=='openOnOrderIn'){
								
								torderin 	= 	newobj;
							}
							if(item.balanceType=='confirmedOrdersIn'){
								
								tconfirmin 	= 	newobj;
							}
							if(item.balanceType=='asnIn'){
							
								  tasnin 	= 	newobj;
							}
							if(item.balanceType=='transferIn'){
								
								 ttransitin = 	newobj;
							}
							if(item.balanceType=='openOnOrderOut'){
								
								 torderout = 	newobj;
							}
							if(item.balanceType=='confirmedOrdersOut'){
								
								tconfirmout 	= 	newobj;
							}
							if(item.balanceType=='asnOut'){
								
								 tasnout 		= 	newobj;
							}
							if(item.balanceType=='transferOut'){
							
								ttransitout 	= 	newobj;
							}
					
					});
					
					
					if(toh.oldvalue != undefined){
						ohold=toh.oldvalue;
					}
					if(tallocated.oldvalue != undefined){
						 allold=tallocated.oldvalue;
					}
					if(treserved.oldvalue != undefined){
						 resold=treserved.oldvalue;
					}
					if(theld.oldvalue != undefined){
							helold=theld.oldvalue;
					}
					if(treturntovendor.oldvalue != undefined){
						 rtvold=treturntovendor.oldvalue;
					}
					if(tats.oldvalue != undefined){
						 atsold=tats.oldvalue;
					}
					if(tatp.oldvalue != undefined){
						 atpold=tatp.oldvalue;
					}
					if(twac.oldvalue != undefined){
						 wacold=twac.oldvalue;
					}
					
					if(torderin.oldvalue != undefined){
						 oinold=torderin.oldvalue;
					}
					if(tconfirmin.oldvalue != undefined){
						 cinold=tconfirmin.oldvalue;
					}
					if( tasnin.oldvalue != undefined){
						 ainold= tasnin.oldvalue;
					}
					if( ttransitin.oldvalue != undefined){
						 tinold= ttransitin.oldvalue;
					}
					if(torderout.oldvalue != undefined){
					    ooutold=torderout.oldvalue;
					}
					if(tconfirmout.oldvalue != undefined){
						 coutold=tconfirmout.oldvalue;
					}
					if( tasnout.oldvalue != undefined){
						aoutold= tasnout.oldvalue;
					}
					if(ttransitout.oldvalue != undefined){
						 toutold=ttransitout.oldvalue;
					}
					
					if(toh.newvalue != undefined){
						 ohnew=toh.newvalue;
					}
					if(tallocated.newvalue != undefined){
						 allnew=tallocated.newvalue;
					}
					if(treserved.newvalue != undefined){
					    resnew=treserved.newvalue;
					}
					if(theld.newvalue != undefined){
						helnew=theld.newvalue;
					}
					if(treturntovendor.newvalue != undefined){
						 rtvnew=treturntovendor.newvalue;
					}
					if(tats.newvalue != undefined){
					    atsnew=tats.newvalue;
					}
					if(tatp.newvalue != undefined){
						 atpnew=tatp.newvalue;
					}
					if(twac.newvalue != undefined){
						wacnew=twac.newvalue;
					}
					
					if(torderin.newvalue != undefined){
						oinnew=torderin.newvalue;
					}
					if(tconfirmin.newvalue != undefined){
						 cinnew=tconfirmin.newvalue;
					}
					if( tasnin.newvalue != undefined){
						 ainnew= tasnin.newvalue;
					}
					if( ttransitin.newvalue != undefined){
						 tinnew= ttransitin.newvalue;
					}
					
					if(torderout.newvalue != undefined){
						ooutnew=torderout.newvalue;
					}
					if(tconfirmout.newvalue != undefined){
						 coutnew=tconfirmout.newvalue;
					}
					if( tasnout.newvalue != undefined){
						 aoutnew= tasnout.newvalue;
					}
					if(ttransitout.newvalue != undefined){
						 toutnew=ttransitout.newvalue;
					}
					
					
					Data.get('/historyitem?tranId='+trannumber).then(function (results) {
						
						var ndata=results[0];
						$scope.trbalances={transactionname:ndata.transactionname, productid:ndata.productCode};
						
						$scope.list=[{sku:ndata.productCode,name:'',price_old:'',price_new:'',old_oh:ohold,old_alloc:allold,old_reser:resold,
					old_held:helold,old_rtv:rtvold,old_ats:atsold,old_atp:atpold,old_wac:wacold,old_orderin:oinold,old_confirmin:cinold,
					old_asnin:ainold,old_transitin:tinold,old_orderout:ooutold,old_confirmout:coutold,old_asnout:aoutold,old_transitout:toutold,
					new_oh:ohnew,new_alloc:allnew,new_reser:resnew,new_held:helnew,new_rtv:rtvnew,
					new_ats:atsnew,new_atp:atpnew,new_wac:wacnew,new_orderin:oinnew,new_confirmin:cinnew,new_asnin:ainnew,new_transitin:tinnew,
					new_orderout:ooutnew,new_confirmout:coutnew,new_asnout:aoutnew,new_transitout:toutnew}];		
				});
			});
			
			
		 $scope.move_detail=function(){
		
		}
		
	$scope.selection 	= 	[];
	$scope.unselection 	= 	[];
	
		$scope.balancefields1=[
		{'id':'tonhand','type':'On Hand','selected':'true' },
		{'id':'tallocated','type':'Allocated','selected':'true' },
		{'id':'treserved','type':'Reserved','selected':'true' },
		{'id':'theld','type':'Held','selected':'true' },
		{'id':'trtv','type':'Return to Vendor','selected':'true' }
	];
	
	 $scope.balancefields2=[ 
		{'id':'tats','type':'ATS','selected':'false' },
		{'id':'tatp','type':'ATP','selected':'false' },
		{'id':'twac','type':'WAC','selected':'false' }
	];
	
	$scope.balancefields3=[
		{'id':'torderin','type':'Open On-Order In','selected':'false' },
		{'id':'tconfirmin','type':'Confirmed In','selected':'false' },
		{'id':'tasnin','type':'ASN In','selected':'false' },
		{'id':'ttransitin','type':'In-Transit In','selected':'false' },
		{'id':'torderout','type':'Open On-Order Out','selected':'false' },
		{'id':'tconfirmout','type':'Confirmed Out','selected':'false' },
		{'id':'tasnout','type':'ASN Out','selected':'false' },
		{'id':'ttransitout','type':'In-Transit Out','selected':'false' }
	];
	
	$scope.balanceids1=['tonhand','tallocated','treserved','theld','trtv'];
	$scope.balanceids2=[ 'tats','tatp','twac' ];
	$scope.balanceids3=['torderin','tconfirmin','tasnin','ttransitin','torderout','tconfirmout','tasnout','ttransitout'];
	
	
	
	$scope.trefineopen=function(){		
		var myEl = angular.element( document.querySelector( '#tbalance_pop' ) );
		//myEl.removeClass('open'); 
		myEl.toggleClass('open');
	};
		
	$scope.trefinecancel=function(){		
		$timeout(function() {
				angular.element('#tcancel_btn').trigger('click');
			}, 1);
	};
		
		$scope.refineremove=function(){
			var elem = document.querySelector('table');
			
			for(i=0;i< $scope.selection.length;i++){
				var myEl1 = angular.element( document.querySelectorAll( '.'+$scope.selection[i] ) );
			
				myEl1.removeClass('ng-hide');
				
			}
			
			for(i=0;i< $scope.unselection.length;i++){
				var myEl = angular.element( document.querySelectorAll( '.'+$scope.unselection[i] ) );
				myEl.addClass('ng-hide');	
				
			}		
		}
		
		
		
		$scope.toggleSelection = function(employeeName) {
			var idx = $scope.selection.indexOf(employeeName.id);
			var idxun = $scope.unselection.indexOf(employeeName.id);
			
			if(employeeName.selected){
				if($scope.unselection.indexOf(employeeName.id) == -1) {
				   $scope.unselection.push(employeeName.id);
				}
				$scope.selection.splice(idx, 1);
			}else{
				if($scope.selection.indexOf(employeeName.id) == -1) {
				   $scope.selection.push(employeeName.id);
				}
				$scope.unselection.splice(idxun, 1);
			}
			
	        angular.forEach($scope.balancefields1, function (value,key) {
				if((value.id == employeeName.id) && !(employeeName.selected))
				{
	              $scope.bal1checked = true;
				}
			});
			angular.forEach($scope.balancefields2, function (value,key) {
				if((value.id == employeeName.id) && !(employeeName.selected))
				{
	               $scope.bal2checked = true;
				}
			});
			angular.forEach($scope.balancefields3, function (value,key) {
				if((value.id == employeeName.id) && !(employeeName.selected))
				{
	               $scope.bal3checked = true;
				}
			});
		};

   
    $scope.balancefields=[{'id':'tlpbalance','type':'Balance Fields','selected':'false' },
	{'id':'tonhand','type':'On Hand','selected':'false' },
	{'id':'tallocated','type':'Allocated','selected':'false' },
	{'id':'treserved','type':'Reserved','selected':'false' },
	{'id':'theld','type':'Held','selected':'false' },
	{'id':'trtv','type':'Return to Vendor','selected':'false' },
	{'id':'tlpcalc','type':'Calculated Fields','selected':'false' },
	{'id':'tats','type':'ATS','selected':'false' },
	{'id':'tatp','type':'ATP','selected':'false' },
	{'id':'twac','type':'WAC','selected':'false' },
	{'id':'tlpdocs','type':'Directive Fields','selected':'false' },
	{'id':'torderin','type':'Open On-Order In','selected':'false' },
	{'id':'tconfirmin','type':'Confirmed In','selected':'false' },
	{'id':'tasnin','type':'ASN In','selected':'false' },
	{'id':'ttransitin','type':'In-Transit In','selected':'false' },
	{'id':'torderout','type':'Open On-Order Out','selected':'false' },
	{'id':'tconfirmout','type':'Confirmed Out','selected':'false' },
	{'id':'tasnout','type':'ASN Out','selected':'false' },
	{'id':'ttransitout','type':'In-Transit Out','selected':'false' },
   ];
   

	$scope.selectAll = function(checkval,objects,val){   
		
		if(val == 1){
			$scope.bal1checked = !checkval;
		}
		if(val == 2){
			$scope.bal2checked = !checkval;
		}
		if(val == 3){
			$scope.bal3checked = !checkval;
		}
		
		angular.forEach(objects, function (item) {
            item.selected = !checkval;
			
			var idxs = $scope.selection.indexOf(item.id);
			var idxuns = $scope.unselection.indexOf(item.id);
			
			if(!item.selected){
				if($scope.unselection.indexOf(item.id) == -1) {
				   $scope.unselection.push(item.id);
				}
				$scope.selection.splice(idxs, 1);
			}else{
				if($scope.selection.indexOf(item.id) == -1) {
				   $scope.selection.push(item.id);
				}
				$scope.unselection.splice(idxuns, 1);
			}
        });
		
   }      
 });
 
