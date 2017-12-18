var app = angular.module('OVCstockApp', ['ui.asntable','styleGroup', 'ovcdataExport', 'roleConfig']);

app.controller('ordersCtrl', function($rootScope, $scope, $state, $http, $timeout, $controller,  $stateParams, ovcDash, Data, CARRIERCODES, ORDERTYPELIST, 
ORDERSTATUS, system_settings, system_currencies, QTYSTATUS, AsnTableService, StyleGroupService, TOTALEXPQUANTITY, ovcdataExportFactory, roleConfigService, Utils, CONSTANTS_VAR) {
    $rootScope.asn_details = [];
    
    if($stateParams.selectTab 	==	'shipment'){
    	$timeout(function() {
				angular.element('#rule_detail').trigger('click');
		}, 1);
    }
    $scope.action 	=	{};
	/*****Enable and Disable based on Permission******/
	$scope.qtyStatus	=	{};
	$scope.qtyStatus.allstatus	=	[];
    $scope.vliporder    =   true;
    $scope.molporder    =   true;
    //Pagination scope
    $scope.POform             =   {};
    $scope.POform.entryLimit  =   50;
    $scope.POform.currentPage =   1;
    $scope.POform.offset      =   0;
	
	$scope.shiptab  =   true;
    $scope.puprice  =   true;
    $scope.billtab  =   true;
	Utils.configurations().then(function(configData) {
		$scope.config 	=	configData;
    	var qtyStatusConfig 	=	configData.config_arr.qtyStatusAtPoReviewScreen.featureValue ? configData.config_arr.qtyStatusAtPoReviewScreen.featureValue : [];
    	angular.forEach(qtyStatusConfig, function(item) {
    		var temp 	=	{};
	        temp.code 	=	item;
	        var tempLabel 	= 	qtycodes1[temp.code];
	        temp.label 		= 	tempLabel;
			if(item  != 'return'){
	        	pqtycodes1.push(temp);
			}
	    });

        $scope.puprice = configData.puprice ? configData.puprice : true;

        $scope.billto = configData.config_arr && configData.config_arr.enableBillTofield &&
                            configData.config_arr.enableBillTofield.featureValue ? true: false;

        $scope.enableNeedByDate  =  configData.config_arr && configData.config_arr.enableNeedByDate &&
                                        configData.config_arr.enableNeedByDate.featureValue ?  true : false;
        GroupByStyle = configData.config_arr && configData.config_arr.allGroupingByStyle ?
                                configData.config_arr.allGroupingByStyle.featureValue : true;
        if(!GroupByStyle)
        $scope.withPagination   =   true;

        $scope.getsummary();
    });
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
    var qtystatusData 	=	[];

    angular.forEach(cqtycodes1 , function(item){
    	item.label = qtycodes1[item.code];
    	qtystatusData.push(item);
    });

    $scope.prdrNo = '';
    $scope.getsummary = function() {
        var purorder_id = $stateParams.porderid;
        var user_detail = $rootScope.globals['currentUser'];
        var user_id = user_detail['username'];
        var currencylabel  =   $scope.translation.currencylist[0];
    	var currencylist   =   [];
    	Utils.userLocation().then(function(resultsloc){
    		angular.forEach(resultsloc, function(item) {
                currencylist[item.id]    =   item.currency;
            });
        }, function(error){
        	console.log('user Location Error :' + error);
        });
        Data.get('/order?id=' + purorder_id).then(function(output) {
			if(output){
				var results 		=	output.order_data ? output.order_data : {};
				var displaystatus 	=	output.displayStatusObject ? output.displayStatusObject : "";
				var createduser 	=  results.createdBy ? results.createdBy : "";
				var userdetail	=	'';
				ovcDash.get('apis/ang_username?user_id=' + createduser).then(function(userdata) {
					if((userdata != undefined) && (userdata != '')){
						var userdetail=userdata.firstName + ' ' + userdata.lastName;
					}
					results.createduser	=	userdetail;
					$scope.orderdetails = results;
					var prdrNo = $scope.orderdetails.purchaseOrderNumber;
					$scope.getShipped_intapi(prdrNo);
					var vendrid = $scope.orderdetails.vendorId;
					var fromloc = $scope.orderdetails.FromLocation;
					var shipstore = $scope.orderdetails.shipToLocation;
					var markforloc = $scope.orderdetails.markForLocation;
					if((+$scope.orderdetails.needByDate)){
						var temp_date =  moment(+($scope.orderdetails.needByDate)).utc();
						$scope.needByDate 	=	 temp_date.format(CONSTANTS_VAR.DATE_FORMAT);
					}
					$scope.currency 	=	currencylabel[currencylist[$scope.orderdetails.shipToLocation]];
					$scope.prdrNo = prdrNo;
					var orderlist = []
					angular.forEach(pordercodes1, function(item) {
						orderlist[item.code] = item.label;
					});
					var purchaseordertype = $scope.orderdetails.purchaseOrderType;
					$scope.purchasetype = orderlist[purchaseordertype];
					var status = []
					angular.forEach(pordercodes, function(item) {
						status[item.code] = item.label;
					});
					var purchaseorderstatus = $scope.orderdetails.orderStatus;
					$scope.ordrstatus = displaystatus ? status[displaystatus[prdrNo]] : $scope.translation.orderstatuslist[0][purchaseorderstatus] || purchaseorderstatus;
					$scope.rplorder = false;
					if (purchaseordertype == 'MAN') {
						$scope.showbill = true;
						$scope.enableNeedByDate = true;
						var spmethod1 = $scope.orderdetails.shippingMethod;
						Data.get('/vendor?id=' + vendrid).then(function(data) {
							//$scope.compyname = data;
							$scope.orderFrom = data.companyName;
							angular.forEach(carrcodes, function(item) {
								if (item.Name == spmethod1) {
									$scope.spmethod = item.description;
								}
							});
						});
					} else {
						$scope.showbill = false;
						$scope.enableNeedByDate = false;
					}
					if (purchaseordertype == 'RPL') {
						$scope.rplorder = true;
						$scope.enableNeedByDate = true;
						$scope.showbill = true;
						var spmethod1 = $scope.orderdetails.shippingMethod;
						Data.get('/vendor?id=' + vendrid).then(function(data) {
							//$scope.compyname = data;
							$scope.orderFrom = data.companyName;
							angular.forEach(carrcodes, function(item) {
								if (item.Name == spmethod1) {
									$scope.spmethod = item.description;
								}
							});
						});
					}
					
					Utils.hierarchylocation().then(function(results){
						var allAfsstores = results;
				        if(allAfsstores && allAfsstores.hierarchy){
				            var listafs = [];
				            angular.forEach(allAfsstores.hierarchy, function(value) {
				                if (value.id == $scope.orderdetails.billTo) {
				                    var newafsobj = {
				                        AfsName: value.name,
				                        AfsId: value.id
				                    }
				                    listafs.push(newafsobj);
				                    $scope.afsDatas = listafs;
				                }
				            });
				            if($scope.afsDatas)
				            	if($scope.afsDatas[0])
				        			$scope.billtostoreId = $scope.afsDatas[0].AfsName ? $scope.afsDatas[0].AfsName : '' ;
				        }
					}, function(error){
						console.log('Hierarchy Location Error' +error)
					});
					Utils.location().then(function(results){
						var listlocs1 = [];
						var alllocs = results;
						angular.forEach(alllocs, function(item) {
							listlocs1[item.id] = item.displayName;
						});
						if (purchaseordertype != 'MAN') {
							$scope.orderFrom = listlocs1[fromloc];
						}
						if (purchaseordertype == 'MAN'|| purchaseordertype == 'RPL') {
							var billstore = $scope.orderdetails.billTo;
							$scope.billtoStore = listlocs1[billstore];
						}

						$scope.shiptoloc = listlocs1[shipstore];
						$scope.markforloc = listlocs1[markforloc];
					});
					$scope.hoverIn = function(qtyData) {
						if(Object.keys(qtyData).length > 0){
							this.hoverEdit = true;
						}else{
							this.hoverEdit = false;
						}
					};
					$scope.hoverOut = function() {
						this.hoverEdit = false;
					};
					var loc = ($scope.orderdetails.markForLocation != undefined && $scope.orderdetails.markForLocation != '') ? $scope.orderdetails.markForLocation : $scope.orderdetails.shipToLocation;
					Data.get('/shipmentdata/' + prdrNo).then(function(results) {
						$scope.summary_data = results;
						
						var orderdata = $scope.summary_data;
						var nrows = [];
						$scope.NRows = [];
						
						angular.forEach($scope.summary_data, function(item) {
							nrows.push(item.userId);
							$scope.NRows.push(item);
							item.allqty={};
							item.qtydetails	=	{};
							var confirmed	=	0;
							var unconfirmed	=	0;
							var qties=item.qtyStatus;
							angular.forEach(qtystatusData, function(data) {
								item.qtydetails[data.label]	=	data.code;
								if((data.code	!==	'submitted') && (data.code	!==	'received')){
									if((item.qtyStatus[data.code] != undefined)){
										if(data.code	==	'confirmed'){
											confirmed	=	item.qtyStatus[data.code];
										}
										if(data.code	==	'unconfirmed'){
											unconfirmed	=	item.qtyStatus[data.code];
										}
									}
								}
							});
							angular.forEach(pqtycodes1 ,  function(statusConfig){
								if((statusConfig.code	!==	'submitted') && (statusConfig.code	!==	'received')){
									if(item.qtyStatus[statusConfig.code]){
											item.allqty[statusConfig.label]=item.qtyStatus[statusConfig.code];
									}else{
										item.allqty[statusConfig.label]=0;
									}
								}
							});
							item.expected	=	parseInt(eval(TOTALEXPQUANTITY.expQuantityCalculation));
						});
						// $scope.NRows = 	nrows2;
						
						// if($scope.withPagination){
							$scope.summaryView = true;
							PaginationCall(prdrNo)
						// }else{
							
						// }
					});
				});
			}
        });


        $scope.porder_copy = function(prdrNo , PoNo) {
            var corderid = prdrNo;
            sessionStorage.cpordid = corderid;
            sessionStorage.copyOrderNumber  =   PoNo;
            $state.go('ovc.purchaseorder-copy');
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
    
	
	 $scope.notSorted = function(obj){
		if (!obj) {
			return [];
		}
		return Object.keys(obj);
	}

    $scope.isShow  		= true;
    $scope.InTransit 	= [];
    $scope.InReceived 	= [];
    $scope.getShipped_intapi = function(prdrNo) {
        
        $scope.is_blind_receive     =   false;
      
        Data.get('/poasn?poid=' + prdrNo).then(function(results) {
                $scope.asn_records  =   true;
                $scope.asn_receive  =   false;
            if(results != '' && results != undefined){
                $scope.asn_records  =   false;
                $scope.asn_receive  =   true;
            }
           $rootScope.asn_details = [];
            if(results)
            {
                if(results.asnData){
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
                }
                //console.log('**********2*********');
                angular.forEach($rootScope.POLIST, function(item){
                    if(item.elementid === "enableBlindReceiving" && item.elementdetail == 1)
                    {
                        $scope.is_blind_receive =   true;
                        return false;
                    }   
                });
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
                    $timeout(function() {
                        $scope.getShipped_intapi();
                    }, 1000);
               // }
            });
        }
    }

    //for only RPL order page change
    $scope.pageChanged 	=	function(page){
    	$scope.currentPage 	=	page;
    }

    //Page change function
    $scope.pageChangedSKUGroup  =   function(){
        $scope.POform.offset = ($scope.POform.currentPage - 1) * $scope.POform.entryLimit;
        PaginationCall($scope.POform.orderNumber);
    };
   		function PaginationCall(PoNo){
			$scope.POform.orderNumber = PoNo;
			var paginationData = $scope.withPagination ? '&page_offset='+ $scope.POform.offset + '&page_lmt='+$scope.POform.entryLimit : "";
			Data.get('/orderitem?purchaseordernumber=' + PoNo + paginationData).then(function(costresults) {
				$scope.ordetils = costresults.item_data;
				var styleGroupData = [];
				var rows = [];

				angular.forEach($scope.ordetils, function(item) {
					var sku = {
						sku: item.SKU
					}
					var sku = item.SKU;
					var loc = ($scope.orderdetails.markForLocation != undefined && $scope.orderdetails.markForLocation != '') ? $scope.orderdetails.markForLocation : $scope.orderdetails.shipToLocation;
					if (item.productCost != undefined && item.productCost != '') {
						var cost = item.productCost;
					} else {
						var cost = $scope.currency + "0";
					}
						
				    $scope.summary_details = costresults.item_data;
					/**** For Summery Screen Style Grouping******/
					console.log($scope.NRows , 'NROWSSSS');
					if($scope.NRows.length > 0){
						angular.forEach($scope.NRows, function(nitem) {
							if (item.SKU == nitem.sku) {
							   styleGroupData.push(angular.extend({}, nitem, item));
							}
						});
					}else{
						styleGroupData.push(item);
					}
					
					

					var Cost = [];
					var iqty = parseInt(item.qty);
					var newobj = {
						id: item._id,
						productName: item.productName,
						// price : item.productCost,
						icost: item.productCost,
						sku: item.SKU,
						//qty:iqty,
					}
					rows.push(newobj);
				});
				$scope.summaryView = true;
				if($scope.withPagination){
					$scope.skuslist 	=	styleGroupData;
					$scope.POform.total_count = costresults.total_count;
					if($scope.orderdetails.purchaseOrderType == 'RPL'){
						$scope.skuslist = styleGroupData;
						$scope.printEnable = $scope.skuslist.length > 0 ? true : false;
					}
				}else{
					if ($scope.orderdetails.purchaseOrderType == 'RPL') {
					 	$scope.rpl_skus = StyleGroupService.getrplskugroup(styleGroupData);
	                    $scope.currentPage = 1; //current page
	                    $scope.action.entryLimit = $rootScope.PAGE_SIZE; //max no of items to display in a page
	                    $scope.filteredItems = styleGroupData.length; //Initially for no filter
	                    $scope.itemslength 	 = $scope.skuslist.length;
	                    $scope.totalItems = styleGroupData.length;
	                }else{
						$scope.skuslist=StyleGroupService.getstylegroup(styleGroupData);
	                }
					
					var newrows = [];
					angular.forEach(rows, function(n, row2) {
						var abc = n.id;
						var row1 = n;
						angular.forEach($scope.NRows, function(nitem) {
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
					$scope.creatdata = newrows;
					$scope.currentPage = 1; //current page
					$scope.entryLimit = $rootScope.PAGE_SIZE; //max no of items to display in a page
					$scope.filteredItems = $scope.creatdata.length; //Initially for no filter  
					$scope.totalItems = $scope.creatdata.length;
				}
			});
		}
});
