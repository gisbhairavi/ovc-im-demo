/*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module     :   Transfers Summery
*
*    Developer  :   Sivaprakash
* 
*    Date       :   18/03/2016
*
*    Version    :   1.0
*
**********************************************************************/
var app = angular.module('OVCstockApp', ['ui.asntable','styleGroup','skuMatrix', 'ovcdataExport','ibtTransferAsn','angularModalService','roleConfig']);

app.controller('TransferSummaryCtrl', function($rootScope, $scope, $state, $http, $timeout, $controller,  $stateParams,  $filter,ovcDash, 
Data, CARRIERCODES, ORDERTYPELIST, ORDERSTATUS, system_settings, system_currencies, 
QTYSTATUS, AsnTableService, StyleGroupService, TOTALEXPQUANTITY, ovcdataExportFactory,ModalService,QTYREASONCODES, roleConfigService, Utils) {
   
	$scope.action						=	{};
	$scope.action.title					=	"summary";
	$scope.action.orderSkus		=	{};
	$scope.action.pricedata			=	{};

	$scope.action.UOMvalues		=	[];
	$rootScope.asn_details          = 	{};
	//$rootScope.asn_details.asns     =  {};
	$rootScope.resolvedasn			= {};
	$rootScope.resolvedasn.receivedpacks			= [];
	$rootScope.resolvedasn.receivedasns				= [];
    $scope.skuslist                      = [];
	$scope.action.shippingasns	=	{};
    var typeofibt	=	$scope.transferType    			=	$stateParams.transfertype;
    var transferstatus  = $stateParams.transferstatus;
    $scope.pagefrom 	=	$stateParams.pageFrom;
   // $rootScope.orstatus = 
	/*****Enable and Disable based on Permission******/
	

	var listlocs1 = [];
	$scope.qtyStatus					=	{};
	$scope.qtyStatus.allstatus		=	[];
    $scope.vliporder    				=	true;
    $scope.molporder    				= 	true;
    $scope.vwpuprice   			    =  false;
    $scope.tab          =   {};
    $scope.tab.page     =   1;
	$scope.ordetils 						=	[];
	var skuprices	=	{};
	var reviewtransfer	= $stateParams.transferfunc;
	if(reviewtransfer == 'resolve' ){
		$timeout(function() {
				angular.element('#rule_detail').trigger('click');
		}, 1);
	}

	Utils.roles().then(function(rolesData){
		$rootScope.rolePerm 	=	rolesData;
	});

	$scope.endisable=function(){
        $scope.vwpuprice 	= 	false;
		$rootScope.$watch('ROLES',function(){
			var role_det=$rootScope.ROLES;
			angular.forEach(role_det, function(roles,key) {
                if (key== 'order'){
                    var viewOrder       =   roles.viewOrder?roles.viewOrder:0;
                    var modifyOrder     =   roles.modifyOrder?roles.modifyOrder:0;

                    if(viewOrder       ==  1){
                        $scope.vliporder    =   false;
                        $('#eposearch :input').attr('disabled', true);
                    }

                    if(modifyOrder  ==  1){
                        $scope.vliporder    =   false;
                        $scope.molporder    =   false;
                        $('#eposearch :input').removeAttr('disabled'); 
                    }
                }
                if (key== 'purchasePrice'){
                    if((roles.viewpurchasePrice == 1) ){
                        $scope.vwpuprice    =   true;
                    }
                    
                }
				
			});
		
		});

		$scope.puprice 	=	true;
		$scope.action.showasn	 =	true;
		Utils.configurations().then(function(configData) {
        	$scope.puprice = configData.puprice ? configData.puprice : true;
        	$scope.blindReceive 	=	configData.config_arr && configData.config_arr.enableBlindReceiving
        								&& configData.config_arr.enableBlindReceiving.featureValue ? 
        								configData.config_arr.enableBlindReceiving.featureValue : false;
		});
	}
	$scope.endisable();
	
	/*******************get uom **********/
    $scope.uomservice = function() {
        Data.get('/uom').then(function(results) {
            var uomdatas = [];
            angular.forEach(results, function(values) {
                if ((values.isActive) && (values.uomId != undefined) && (values.uomId != '') && (values.description != undefined) && (values.description != '')) {
                   
					uomdatas[values.uomId]=values.description;
                }
            });
            $scope.action.UOMvalues = uomdatas;
        });
    }
    $scope.uomservice();

	/***Currency from config****/

    //$scope.currency = system_settings.eurocurrency;
    // var currensymbs = $scope.translation.currencylist[0];
    // var currcodes = system_currencies[0];
    // $scope.currency = currensymbs[currcodes.code];

	/***Carrier alpha from config****/
    var cardesc = $scope.translation.carrier[0];
    var ccodes = CARRIERCODES;
    var carrcodes = [];
    angular.forEach(ccodes, function(item) {
        var abc = item.Name;
        var bcd = cardesc[abc];
        item.description = bcd;
        carrcodes.push(item);
    });

	/***Order status from config****/
    var ordercodes = $scope.translation.orderstatuslist[0];
    var cordercodes = ORDERSTATUS;
    var pordercodes = [];
    angular.forEach(cordercodes, function(item) {
        var purch = item.code;
        var porder = ordercodes[purch];
        item.label = porder;
        pordercodes.push(item);
    });
	/***Order type from config****/
    var ordercodes1 = $scope.translation.orderstypelist[0];
    var cordercodes1 = ORDERTYPELIST;
    var pordercodes1 = [];
    angular.forEach(cordercodes1, function(item) {
        var purch1 = item.code;
        var porder1 = ordercodes1[purch1];
        item.label = porder1;
        pordercodes1.push(item);
    });
	/***Quantity status from config****/
	var qtycodes1 = $scope.translation.qtystatuslist[0];
    var cqtycodes1 = QTYSTATUS;
    var pqtycodes1 = [];
    angular.forEach(cqtycodes1, function(item) {
        var purch1 = item.code;
        var pqty1 = qtycodes1[purch1];
        item.label = pqty1;
        pqtycodes1.push(item);
    });
	
	/***Resolved Quantity status from config****/
	var ibtqtycodes = $scope.translation.qty_reasons;
    var ibtcqtycodes = QTYREASONCODES;
    var ibtallqtycodes = [];
    angular.forEach(ibtcqtycodes, function(item) {
        item.label  = ibtqtycodes[item.code];
        ibtallqtycodes.push(item);
    });
	
    $scope.prdrNo = '';

    /*******Summery View For IBT Order ********/
    $scope.getsummary = function() {
        var purorder_id 		= 	$stateParams.transferid;
        var user_detail 		= 	$rootScope.globals['currentUser'];
        var user_id 			= 	user_detail['username'];
        var currencylabel  =   $scope.translation.currencylist[0];
    	var currencylist   =   [];
    	Utils.userLocation().then(function(results){
    		angular.forEach(results, function(item) {
                currencylist[item.id]    =   item.currency;
                listlocs1[item.id] 		 = 	 item.displayName;
            });
        }, function(error){
        	console.log('User location Error :' + error);
        });
        Data.get('/order?id=' + purorder_id).then(function(output) {
			if(output){
				var results 		=	output.order_data;
				var displaystatus	=	output.displayStatusObject;
				var createduser		=	results.createdBy;
				var userdetail		=	'';
				ovcDash.get('apis/ang_username?user_id=' + createduser).then(function(userdata) {
					if((userdata != undefined) && (userdata != '')){
						var userdetail =	userdata.firstName + ' ' + userdata.lastName;
					}
					results.createduser	=	userdetail;
					$scope.orderdetails = results;
					var prdrNo = $scope.orderdetails.purchaseOrderNumber;
					$scope.action.orderNumber	=	$scope.orderdetails.purchaseOrderNumber;
					var vendrid = $scope.orderdetails.vendorId;
					var fromloc = $scope.orderdetails.FromLocation;
					$scope.action.fromlocation	=	$scope.orderdetails.FromLocation;
					var shipstore = $scope.orderdetails.shipToLocation;
					var markforloc = $scope.orderdetails.markForLocation;
					$scope.currency 	=	currencylabel[currencylist[shipstore]];
					$scope.prdrNo = prdrNo;
					if((typeofibt == 'Outbound') && ($scope.orderdetails.orderStatus != 'submitted') ){
						$scope.action.receivepack	=	false;
						$scope.action.shippack		=	true;
					}else{
						$scope.action.receivepack	=	true;
						$scope.action.shippack		=	false;
					}
					if((typeofibt == 'Outbound') && ($scope.orderdetails.orderStatus == 'rejected')){
						$scope.action.shippack		=	false;
					}
					var orderlist = []
					angular.forEach(pordercodes1, function(item) {
						orderlist[item.code] = item.label;
					});
					var purchaseordertype 	= $scope.orderdetails.purchaseOrderType;
					$scope.purchasetype 	= orderlist[purchaseordertype];
					var status = []
					angular.forEach(pordercodes, function(item) {
						status[item.code] = item.label;
					});
					//var purchaseorderstatus = $scope.orderdetails.orderStatus;
					$scope.ordrstatus = $scope.translation.ibtstatuslist[0][displaystatus[prdrNo]];
					$scope.rplorder = false;
					if (purchaseordertype == 'MAN') {
						$scope.showbill = true;
						var spmethod1 = $scope.orderdetails.shippingMethod;
						Data.get('/vendor?id=' + vendrid).then(function(data) {
							$scope.orderFrom = data.companyName;
							angular.forEach(carrcodes, function(item) {
								if (item.Name == spmethod1) {
									$scope.spmethod = item.description;
								}
							});
						});

					} else {
						$scope.showbill = false;
					}

					if (purchaseordertype == 'RPL') {
						$scope.rplorder = true;
					}
					Utils.hierarchylocation().then(function(results){
						var listlocs1 = [];
						var alllocs = results.hierarchy;
						angular.forEach(alllocs, function(item) {
							listlocs1[item.id] = item.name;
						});
						$scope.orderFrom = listlocs1[fromloc];
						$scope.shiptoloc = listlocs1[shipstore];
						$scope.markforloc = listlocs1[markforloc];
					}, function(error){
						console.log('location Error :' + error);
					});
					$scope.hoverIn = function() {
						if(!$scope.blindReceive)
						this.hoverEdit = true;
					};
					$scope.hoverOut = function() {
						this.hoverEdit = false;
					};
					var loc = $scope.orderdetails.shipToLocation;
					Data.get('/shipmentdata/' + prdrNo).then(function(results) {
						
						$scope.QtyDetails  	= 	angular.copy(results);
						$scope.summary_data =   results;

						var orderdata 	= 	$scope.summary_data;
						var nrows 		=	[];
						var nrows2 		=	[];
						
						angular.forEach($scope.summary_data, function(item) {
							nrows.push(item.userId);
							nrows2.push(item);
							
							item.allqty		=	{};
							item.qtydetails	=	{};
							item.receivedqtys	=	{};
							item.receiveddetails	=	{};
							var confirmed	=	0;
							var unconfirmed	=	0;
							var qties 		=	item.qtyStatus;
							angular.forEach(pqtycodes1, function(data) {
								item.qtydetails[data.label]	=	data.code;
								if((data.code	!==	'submitted') && (data.code	!==	'received')){
									if((item.qtyStatus[data.code] != undefined)){
											item.allqty[data.label]=item.qtyStatus[data.code];
											if(data.code	==	'confirmed'){
												confirmed	=	item.qtyStatus[data.code];
											}
											if(data.code	==	'unconfirmed'){
												unconfirmed	=	item.qtyStatus[data.code];
											}
										
									}else{
											item.allqty[data.label]=0;
									}
								}
							});
							item.expected	=	parseInt(eval(TOTALEXPQUANTITY.expQuantityCalculation));
							
							angular.forEach(ibtallqtycodes, function(data) {
								item.receiveddetails[data.label]	=	data.code;
								if((item.qtyStatus[data.code] != undefined)){
										item.receivedqtys[data.label]=item.qtyStatus[data.code];	
								}else{
										item.receivedqtys[data.label]=0;
								}
							});
						});
						
						
						Data.get('/orderitem?purchaseordernumber=' + prdrNo).then(function(costresults) {
							if((costresults) && (costresults.status != 'error')){
								$scope.ordetils      = costresults.item_data;
							}
							
							var allskus	=	[];
							var loc = ($scope.orderdetails.markForLocation != undefined && $scope.orderdetails.markForLocation != '') ? $scope.orderdetails.markForLocation : $scope.orderdetails.shipToLocation;
							angular.forEach($scope.ordetils, function(item) {
								allskus.push(item.SKU);
							});
							ovcDash.get('apis/ang_skus_getproductprice?sku=' + allskus + '&loc=' + encodeURIComponent(loc)).then(function(ovcdata) {
								if((ovcdata != undefined ) && (!ovcdata.status)){
									$scope.action.pricedata	=	ovcdata;
									/**** For Summery Screen Style Grouping******/
									var styleGroupData 		= 	[]; var rows = [];
									angular.forEach(costresults.item_data, function(skuitem) {
										skuitem.orderType 	=	$scope.orderdetails.purchaseOrderType;
										skuitem.fromStore 	=	$scope.orderdetails.FromLocation;
										skuitem.toStore 	=	$scope.orderdetails.shipToLocation;
										var totalskucost 	= 	0;
										
										angular.forEach(ovcdata,function(costitem){
											var pricedata=costitem.ProductPrice;
											if(skuitem.SKU==pricedata.sku){
												angular.forEach(nrows2, function(nitem) {
													skuitem.confirm_qty 		= 	nitem.qtyStatus.confirmed;
													var QtyforPrice 			=	nitem.qtyStatus.confirmed ? nitem.qtyStatus.confirmed:nitem.qtyStatus.submitted?nitem.qtyStatus.submitted:nitem.qtyStatus.received?nitem.qtyStatus.received:0;
													if(typeofibt == 'Outbound'){
														skuitem.confirm_qty 	= 	nitem.qtyStatus.confirmed;
													}
													if($scope.transferType == 'Outbound' && $scope.orderdetails.orderStatus == 'submitted'){
															skuitem.confirm_qty 		= 	skuitem.qty;	
													}
													skuitem.rejectedQty		=	nitem.qtyStatus.rejected;
													totalskucost			= 	(parseInt(QtyforPrice) * parseFloat(nitem.skuCost)).toFixed(2);
													skuitem.totalnotax		=	parseFloat(totalskucost).toFixed(2);
													if (skuitem.SKU == nitem.sku) {
													  styleGroupData.push(angular.extend({}, nitem, skuitem, costitem));
													}
												});
											}
										}); 	

										var iqty = parseInt(skuitem.qty);
										var newobj = {
											id: skuitem._id,
											productName: skuitem.productName,
											// price : skuitem.productCost,
											icost: skuitem.productCost,
											sku: skuitem.SKU,
											//qty:iqty,
										}
										rows.push(newobj);									
									});
									$scope.skuslist 				= 	StyleGroupService.getstylegroup(styleGroupData);
									$scope.action.orderSkus	=	styleGroupData;
									$scope.orderdetails.styleLength	=	Object.keys($scope.skuslist).length;
							
									angular.forEach($scope.skuslist, function(listData){
							            $scope.action.inoutFrom    =   listData.styleats.stlinOutBoundFrom;
							            $scope.action.inoutTo      =   listData.styleats.stlinOutBoundTo;
									});

									var skulistno = 0;
									angular.forEach($scope.skuslist, function(datalist){
										 skulistno = (skulistno + datalist.skus.length);
									});
									$scope.orderdetails.totalSkus = skulistno;
									$scope.transferView = 	true;
									
									$scope.summary_details = costresults;
									var Cost = [];
									var newrows = [];
									angular.forEach(rows, function(n, row2) {
										var abc = n.id;
										var row1 = n;
										angular.forEach(nrows2, function(nitem) {
											if (n.sku == nitem.sku) {
												var row4 = angular.extend({}, nitem, row1);
												var scost = parseFloat(nitem.skuCost).toFixed(2);
												var oicost = parseFloat(n.icost).toFixed(2);
												if ((scost == oicost) || (scost == "") || (scost == undefined)) {
													row4.price = oicost;
												} else {
													row4.price = scost;
												}
												newrows.push(row4);
											}
										});
									});
									$scope.getShipped_intapi(prdrNo);
								}
							});
						});
					});
				});
			}
        });
        $scope.porder_copy = function(prdrNo) {
            var corderid = prdrNo;
            sessionStorage.cpordid = corderid;
            $state.go('ovc.transfer-copy');
        }
        $scope.setPage = function(pageNo) {
            $scope.currentPage = pageNo;
        };
        //$scope.reverse=false;
        $scope.sort_by = function(predicate) {
            $scope.predicate = predicate;
            $scope.reverse = !$scope.reverse;
        };
    };
    $scope.getsummary();
	
	
	
	$scope.getibtlist	=	function(){
		$state.go('ovc.ibt');
	}

	/*****Qty/cost Calculation in Change Qty******/
	$scope.calcItems1 	=	function(items, index, style){
		 var styletotal 	= 	0;	var styleAll  = 0; 
		 var tonotax 		=	0;  var ovtotal2 = 0; 
		 var proindex 		=	index;
		 var styleTotal 	=	parseFloat(items.totalnotax).toFixed(2);
		 var skuCost 		=	parseFloat(items.skuCost).toFixed(2);
		 var confirmQty 	=	items.confirm_qty;
		 var submittedQty	=	items.qtyStatus.submitted;
		 var styleTotalAll  =   parseFloat(styleTotal + items.totalnotax).toFixed(2);
		 items.rejectedQty 	=	(submittedQty - confirmQty);
		 var total_cost		=	parseFloat(confirmQty * skuCost).toFixed(2);
		 var skuTax 		= 	items.ProductPrice.isVAT;
		 var skuTaxPer		=	items.ProductPrice.percentage;
		 var proTax 		= 	parseFloat(total_cost * parseFloat(skuTaxPer / 100)).toFixed(2);
		 $scope.skuslist[style].styleTotal = styleTotalAll;
		if (skuTax == 0) {
		 	var siProTax	=	parseFloat(skuCost * parseFloat(skuTaxPer / 100)).toFixed(2);
		 	var totalTax 	=   parseFloat(proTax + total_cost).toFixed(2);

		 	$scope.skuslist[style]['skus'][proindex].total 				=	totalTax;
			$scope.skuslist[style]['skus'][proindex].totalnotax 		=	total_cost;
			$scope.skuslist[style]['skus'][proindex].totalProductTax 	=	proTax;
		}
		if (skuTax == 1) {
		 	$scope.skuslist[style]['skus'][nindex].total 				= 	total_cost;
		 	$scope.skuslist[style]['skus'][nindex].totalProductVat 		=	proTax;
		 	$scope.skuslist[style]['skus'][nindex].totalnotax 			=	proTax;
		}


		angular.forEach($scope.skuslist[style]['skus'], function(item) {
		 	tonotax 	= 	item.totalnotax;
		 	ovtotal2 	= 	parseFloat(ovtotal2) + parseFloat(tonotax);
		});
		$scope.skuslist[style].total = parseFloat(ovtotal2).toFixed(2);

		angular.forEach($scope.skuslist, function(styleitem){
		 	styletotal 	   = styleitem.total;
		 		styleAll  = parseFloat(styleAll) + parseFloat(styletotal);
		});
		$scope.orderdetails.totalPoCost = parseFloat(styleAll).toFixed(2);
		
	};
	/******* Confirm The IBT Order ******/
	$scope.confirm_transfer  = function(){

		var finalJson		=	[];
		$scope.finalData 	=	{};
		var orderDetails 	=	{};
		var rows 			=	{};
		var pono 			=	$scope.orderdetails.purchaseOrderNumber;
		orderDetails.purchaseOrder 							=	{};
		orderDetails.purchaseOrder.purchaseOrderItem 		=	[];
		orderDetails.purchaseOrder.purchaseOrderNumber 		= 	pono;
		angular.forEach($scope.skuslist, function(orderData){
			angular.forEach(orderData.skus, function(orderskuData){
				if(orderskuData.confirm_qty){
					$scope.checkconfirmed = true;
				}
			});
		});
		if($scope.checkconfirmed){
			orderDetails.purchaseOrder.orderStatus 				=	"confirmed";
		}
		else{
			orderDetails.purchaseOrder.orderStatus 				=	"rejected";
		}
			
		$scope.finalData	=	orderDetails;

		var skuDetails 	=	{};
		angular.forEach($scope.skuslist, function(orderData){
			angular.forEach(orderData.skus, function(orderskuData){
				var tmp	=	{
					"confirmed" 	: {'sku' : orderskuData.SKU, 'qty' : orderskuData.confirm_qty, 'qtyStatus' : 'confirmed', 'skuCost' : orderskuData.skuCost, 'uom' : orderskuData.producUom,  'totalProductCostConfirm' : orderskuData.totalnotax, 'totalProductTaxConfirm' : orderskuData.totalProductTax , 'totalProductVatConfirm' : orderskuData.totalProductVat},
					"rejected" 		: {'sku' : orderskuData.SKU, 'qty' : (orderskuData.rejectedQty || '0'), 'qtyStatus' : 'rejected', 	'skuCost' : orderskuData.skuCost, 'uom' : orderskuData.producUom, 'totalProductCostConfirm' : orderskuData.totalnotax, 'totalProductTaxConfirm' : orderskuData.totalProductTax , 'totalProductVatConfirm' : orderskuData.totalProductVat}
				};
				rows[orderskuData.SKU] 		=	tmp;
			});

		});
		$scope.skusdatas	=	rows;

		var allskusdata	=	[];
		angular.forEach($scope.skusdatas,function(item,key) {
			angular.forEach(item, function(skuitem,key2){
				allskusdata.push(skuitem);
			});
		});
		orderDetails.purchaseOrder.purchaseOrderItem 	=	allskusdata;
		orderDetails.purchaseOrder.totalPoCostConfirm	=	$scope.orderdetails.totalPoCost;
		finalJson.push($scope.finalData);
		if(finalJson.length > 0){
		    var pkgdata = JSON.stringify(finalJson);
		    var obj = {"data" : {"uploaded_file" : pkgdata, "type" : "json"}};
		    Data.post('/receivingpurchasejson', obj).then(function (success) {
		       	if(success){
		       		if (success.status == "success") {
			 
		       			if(orderDetails.purchaseOrder.orderStatus == "rejected"){
					            var output = {
					                "status": "error",
					                "message": "Transfer Rejected Successfully"
					            };
					            Data.toast(output);
					     }
					     else{
					     		var output = {
					                "status": "success",
					                "message": "Transfer Confirmed Successfully"
					            };
					            Data.toast(output);
					     }
						$state.reload();
					}
					else{
						var output = {
			                "status": "error",
			                "message": "Error with Confirming Transfer"
			            };
			            Data.toast(output);
					}
		       	}else{          
		           return false;
		       	}                   
		   });
		}
	};

	 $scope.notSorted = function(obj){
		if (!obj) {
			return [];
		}
		return Object.keys(obj);
	}

    $scope.isShow = true;
    // $scope.store_datas =[];
    $scope.getStores = function() {
        ovcDash.get('apis/ang_getlocations').then(function(results) {
            $scope.store_datas = results;
        });
    };
    $scope.getStores();
    $scope.InTransit = [];
    $scope.InReceived = [];
	
	$scope.saveshippingAsns = function() {
		var shipinprogress_asns	=	{};
		var allprices	=	$scope.action.orderSkus;
		var alluoms	=	$scope.action.UOMvalues;
		angular.forEach(allprices, function(skudetail,key){
			skuprices[skudetail.SKU]	=	skudetail;
		});
		angular.forEach($rootScope.asn_details.asns, function(asnitem, asnid){
			
			if((asnitem.packages != undefined)){
				var asnpackages	=	asnitem.packages;
				angular.forEach(asnpackages, function(packitem, packid){
					if(packitem.packageStatus =='shipInProgress'){
						var selectedpackage = packitem;
						var newobj = {};
						var packageId = asnitem.asnId;
						newobj[packageId]	=	{};
						newobj[packageId].purchaseOrder	=	{};
						newobj[packageId].purchaseOrder.purchaseOrderNumber	=	asnitem.poId;
						newobj[packageId].purchaseOrder.totalPoTaxAsn	= 0;
						newobj[packageId].purchaseOrder.totalPoVATAsn	=	0,
						newobj[packageId].purchaseOrder.PoSubtotalAsn	=	0;
						newobj[packageId].purchaseOrder.totalPoCostAsn	=	0;
						newobj[packageId].purchaseOrder.purchaseOrderAsn	=	{};
						newobj[packageId].purchaseOrder.purchaseOrderAsn.productDetails	=	{};
						newobj[packageId].purchaseOrder.purchaseOrderAsn.purchaseOrderPackage	=	[];
						newobj[packageId].purchaseOrder.purchaseOrderAsn.purchaseOrderPackage[0]	=	{};
						newobj[packageId].purchaseOrder.purchaseOrderAsn.purchaseOrderPackage[0].packageStatus	=	selectedpackage.packageStatus;
						newobj[packageId].purchaseOrder.purchaseOrderAsn.purchaseOrderPackage[0].packageId			=	packid;
						newobj[packageId].purchaseOrder.purchaseOrderAsn.purchaseOrderPackage[0].shipDate			=	$filter('dateForm')(selectedpackage.shipDate);
						newobj[packageId].purchaseOrder.purchaseOrderAsn.purchaseOrderPackage[0].receivedDate		=	$filter('dateForm')(selectedpackage.expectedDeliveryDate);
						newobj[packageId].purchaseOrder.purchaseOrderAsn.purchaseOrderPackage[0].trackingNumber	=	selectedpackage.trackingNumber;
						newobj[packageId].purchaseOrder.purchaseOrderAsn.asnId	=	packageId;
						newobj[packageId].purchaseOrder.purchaseOrderAsn.billOfLadingId				=	"BL" + packageId;
						newobj[packageId].purchaseOrder.purchaseOrderAsn.productDetails	=	{};
						var packagestyles	=	selectedpackage.skus;
						
						angular.forEach(packagestyles, function(stylegroup,style){
							newobj[packageId].purchaseOrder.purchaseOrderAsn.productDetails[style]	           =	[];
							var  selectedstyle	=	newobj[packageId].purchaseOrder.purchaseOrderAsn.productDetails[style][0]	       =	{};
							newobj[packageId].purchaseOrder.purchaseOrderAsn.productDetails[style][0].skus = [];
							selectedstyle['productCode'] = style;
							selectedstyle['qty'] = 0;
							selectedstyle['total'] = 0;
							selectedstyle['subtotal'] = 0;
							selectedstyle['vat'] = 0;
							selectedstyle['tax'] = 0;
							var styleskus	=	stylegroup.skuArr;
							angular.forEach(styleskus, function(skudata){
								var skuobj					={};
								var uom	=	skuprices[skudata.sku].producUom;
								skuobj.sku					=	skudata.sku;
								skuobj.description		=	skudata.description;
								skuobj.cost				=	skudata.skuCost;
								skuobj.qty					=	skudata.qty;
								skuobj.lineNumber		=	skudata.lineNumber;
								skuobj.selectedUOM	=	uom;
								skuobj.waist				=	skuprices[skudata.sku].waist;
								skuobj.length				=	skuprices[skudata.sku].length;
								skuobj.size				=	skuprices[skudata.sku].size;
								skuobj.confirmedqty	=	skuprices[skudata.sku].qtyStatus['confirmed'];
								skuobj.shippedqty		=	skudata.qty;
								selectedstyle.skus.push(skuobj);
							});
							selectedstyle['styleColor'] = skuprices[styleskus[0].sku].styleColor;
							selectedstyle['productDescription'] = skuprices[styleskus[0].sku].styleDescription;
						});
						shipinprogress_asns[packageId]=newobj[packageId];
					}
				});
			}
		});
		$scope.action.shippingasns	=	shipinprogress_asns;
		$scope.$broadcast('update_asn_data',$scope.action.shippingasns);
	};

    $scope.getShipped_intapi = function(prdrNo) {
        
        $scope.is_blind_receive     =   false;
      
        Data.get('/poasn?poid=' + prdrNo).then(function(results) {
                $scope.asn_records  =   true;
                $scope.asn_receive  =   false;
            if(results != '' && results != undefined && results.status != 'error'){
                $scope.asn_records  =   false;
                $scope.asn_receive  =   true;
            }
            if(results && results.asnData)
            {
                angular.forEach($rootScope.POLIST, function(item){
                    if(item.elementid === "enableBlindReceiving" && item.elementdetail == 1)
                    {
                        $scope.is_blind_receive =   true;
                        return false;
                    }   
                });
                var temp_obj = {  
                   "resolvebtn":false,
                   "showgroup":true,
                   "asns" : results.asnData,
                   "error":5,
                   "receivebtn":results.hasShippedPack

                }
                $rootScope.asn_details  =   temp_obj;
                if($rootScope.asn_details.length > 0){
                    $scope.asn_records  = true;
                }
				$scope.saveshippingAsns();  
            }
        });
    };

    $scope.fillTableElements = function(data) {
        $scope.list = data;
        // $scope.entryLimits = $rootScope.PAGE_SIZE; //max no of items to display in a page
        $scope.filteredItems = $scope.prodlist.length; //Initially for no filter  
    }
    $scope.ShowHideTd = function(status) {
        $scope.isShow = status;
    };
    $scope.selection = [];
    $scope.toggleSelection = function toggleSelection(chkbxs) {
        var i = $scope.selection.indexOf(chkbxs);
        if (i != -1) {
            $scope.selection.splice(i, 1);
        } else {
            $scope.selection.push(chkbxs);
        }
        
    };
    $scope.receiveUpdate = function() {
        if ($scope.selection != undefined) {
            var values = $scope.selection.join(',');
            Data.get('/receivedpackage/' + values).then(function(results) {
				
               // if (results[0].__v== 0) {
                    var output = {
                        "status": "success",
                        "message": "Package Received Successfully."
                    };
                    Data.toast(output);
                    $scope.InTransit = [];
                    $scope.InReceived = [];
                    $scope.getShipped_intapi();
               // }
            });
        }
    }
	
	$scope.show = function() {
        ModalService.showModal({
            templateUrl: 'modal.html',
			controller: "ModalController"
        }).then(function(modal) {
            modal.element.modal();
            modal.close.then(function(result) {
                //$scope.message = "You said " + result;
            });
        });
	};
	
    /* Jegan Added  Reverse IBT Orders */
    $scope.action.reverseIBT 	=	function(){
    	var orderNumber 		=	$scope.orderdetails.purchaseOrderNumber;
    	var transferType 		=	$scope.transferType;
    	var orderStatus 		=	$scope.orderdetails.orderStatus;
    	var itmeQtyStatusDelete	=	['submitted'];
    	var statusToSave 		=	'draft';
    	if(orderStatus == 'inProgress' || orderStatus == 'confirmed' || orderStatus == 'rejected'){
    		statusToSave 		=	'submitted';
    		itmeQtyStatusDelete	=	['confirmed','rejected'];
    	}

    	var obj = {"data" : {"orderNumber" : orderNumber,"orderStatus" : orderStatus,"statusToSave":statusToSave,"itmeQtyStatusDelete":itmeQtyStatusDelete}};


	    Data.post('/reverseIBTOrders', obj).then(function (response) {
	  		if(!response.error){
	  			var output = {
                	"status": "success",
                	"message": "Transfer Reversed Successfully."
            	};
	  		}else{
	  			var output = {
                	"status": "error",
                	"message": "Problem in Transfer Reversing."
            	};
	  		}
	  		Data.toast(output);
	  		$state.go('ovc.ibt');
	  	});
    };
	
});

