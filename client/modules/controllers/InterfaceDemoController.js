var app = angular.module('OVCstockApp', ['roleConfig']);

app.controller('demoInterface', function($scope, $http, $rootScope, Data, $filter, $timeout, toaster, jmsData, ovcDash, Utils, TreeViewService, ORDERTYPES, Utils, MOMENT_FORMATS, CONSTANTS_VAR) {
	$scope.activeTab			=	'confirmation';
	$scope.packageId			=	0;
	$scope.oldPono				=	'';
	$scope.asn 					=	{};
	$scope.asnTmpObj		=	$scope.shipmentData 	=	{};
	$scope.confirmForm 		=	{};
	$scope.asnForm 			=	{};
	$scope.skusResults		=	$scope.noResults	=	false;
	$scope.purchaseOrders	=	[];
	$scope.finalJson			=	{};
	$scope.confirmedskus	=	{};
	$scope.confirmedskus.allskus	=	[]; 
	$scope.confirmedskus.skus_newprices	=	[];  $scope.allcost	=	{};
	$scope.orderSkus	=	$scope.tmpOrderSkus	=	$scope.packageOrderSkus	=	{};
	$scope.error    =   {};
    $scope.errormsg =   {};
    // $scope.selectedOrderId 	=	'Terent';

	var user_detail 	= 	$rootScope.globals['currentUser'];
    var user_id 		= 	user_detail['username'];

	//*******For Order Type Dropdown*******//
    var pordercodes 	= 	[];
	var cordercodes 	= 	ORDERTYPES;
    var ordercodes 		= 	$scope.translation.orderstypelist[0];
    angular.forEach(cordercodes, function(item) {
        var purch = item.code;
        var porder = ordercodes[purch];
        item.label = porder;
        pordercodes.push(item);
    });
    $scope.confirmForm.orderTypeData 	=	pordercodes;
    $scope.asnForm.orderTypeData 		=	pordercodes;
	//*******For Order Type Dropdown*******//

	//*****For Location DropData *****//
	var AFSData 		=	{};
	AFSData.parent 		=	{};
	function locationDefault(){
		Utils.hierarchylocation().then(function(results){
			AFSData.result 		= 	results;
		    var templocation 	=   TreeViewService.getLocData(results);
		    AFSData.result.hierarchy.forEach(function(resultitem){
		    	AFSData.parent[resultitem.id] 	=	resultitem.parent;
		    });
		    $scope.flatLocations = [];
		    templocation.forEach(function (item) {
		        recur(item, 0, $scope.flatLocations);
		    });
		}, function(error){
			console.log('Hierarchy Location Error:'+ error)
		});

		function times (n, str) {
	        var result = '';
	        for (var i = 0; i < n; i++) {
	            result += str;
	        }
	        return result;
	    };

	    function recur(item, level, arr) {
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
	};
	locationDefault()
	//*****For Location DropData *****//
$scope.confirmForm.AFSData 	=	[];
	//*****ShiptoLOcation Change*****//
	$scope.shiptoStoreChange 	=	function(shiptostore, TabData){
		 var listafs = [];
		 if(AFSData.result && AFSData.result.hierarchy && shiptostore){
		 	angular.forEach(AFSData.result.hierarchy, function(value) {
	            if (value.id == AFSData.parent[shiptostore]) {
	                var newafsobj = {
	                    AfsName: value.name,
	                    AfsId: value.id
	                }
	                listafs.push(newafsobj);
	            }
	        });
	        $scope.confirmForm.AFSData = listafs;
	        if($scope.confirmForm.AFSData){
	            if($scope.confirmForm.AFSData[0]){
	            	if(TabData == 'CONFIRM')
	        		$scope.confirmForm.AFS = $scope.confirmForm.AFSData[0].AfsId ? $scope.confirmForm.AFSData[0].AfsId : '';
	            	if(TabData == 'ASN')
	        		$scope.asnForm.AFS = $scope.confirmForm.AFSData[0].AfsId ? $scope.confirmForm.AFSData[0].AfsId : '';

	            }
	        }
		 }
	};
	
	$scope.switchTab	=	function(activeTab) {
		$scope.activeTab	=	activeTab;
	};

	$scope.getUniqueID	=	function(length) {
		return Math.random().toString(36).substr(2, length).toUpperCase();
	};

	$scope.calcScans= function(pindex,qty){
			var quantity=qty;
			var noitems=[];
			var subtotal=0;
			var newqty=0;

			angular.forEach($scope.prodlist, function(item) {
				if((item.qty =='') || (item.qty == null )){
					newqty=0;
				}else{
					newqty = item.qty[$scope.maxRecount-1].qty;
				}
				noitems[$scope.maxRecount] = ((parseInt(noitems[$scope.maxRecount]))?(parseInt(noitems[$scope.maxRecount])):0)+parseInt(newqty);
			});
			
			$scope.scanitems = noitems;
		}

	$scope.decreasehcq = function(index){
			$scope.handCountQty = $scope.handCountQty - 1;
			console.log("$scope.handCountQty",$scope.handCountQty);
		}

		$scope.increasehcq = function(index){
			$scope.handCountQty = $scope.list[index].handCountQty + 1;
			console.log("$scope.handCountQty1",$scope.handCountQty);

		}
		$scope.idminmax = function (value, min, index){

            if(parseInt(value) < min || isNaN(value)) {
                $scope.prodlist[index]['qty'][0]['qty'] = min;
            }
            else{
                $scope.prodlist[index]['qty'][0]['qty'] = value;
            }
	    };
	    
		/*****Style Group Configration*******/
		Utils.configurations().then(function(configData){
	    	$scope.config 	=	configData;
	    });

	$scope.servicefun = function() {
        Data.get('/order').then(function(data) {
        	if( data != undefined && data.order_data != undefined){
	        	angular.forEach(data.order_data,function(item) {
					if((item.orderStatus	!=	'draft')&& (item.orderStatus	!=	'cancelled')&&(item.purchaseOrderType =="MAN" || item.purchaseOrderType =="RPL" || item.purchaseOrderType =="ZFUT") ){
						$scope.purchaseOrders.push(item.purchaseOrderNumber);
					}
					//$scope.purchaseOrders.push(item.purchaseOrderNumber);
				});
	    	}
        });
    };

    $scope.padNumbers	=	function(num, size) {
		var s 	=	num + "";
		while (s.length < size) s 	=	"0" + s;

		return s;
    };

    $scope.getTimeStamp	=	function(dte) {
    	var dte_obj	=	dte || new Date();

    	return Date.parse(dte_obj);
    };

    $scope.getSkus	=	function(action, orderid) {

    	var pono	=	orderid;
    	//****Not submitted order rejection****//
    	if($scope.purchaseOrders.indexOf(pono) == -1){
    		var output 	= 	{"status":"error","message":"No orders found"};
    		Data.toast(output);
    		return false;
    	}

    	$scope.finalJson				=	{};
		$scope.finalJson.purchaseOrder	=	{};
		var dateForm = localStorage.configDateFormat ? MOMENT_FORMATS[localStorage.configDateFormat] : MOMENT_FORMATS.DEFAULT;
		$scope.confirmForm.dateTime 	=	moment().format(dateForm +' '+ MOMENT_FORMATS.TIME);
    	if(pono && pono.length > 0)
    	{
    		$scope.packageId	=	0;

    		$scope.oldPono	=	pono;
    		Data.get('/order?fromdate=' + "" + '&todate=' + "" + '&shiptolocation=' + "" + '&orderstatus=' +
            "" + '&purchaseordernumber=' + pono+'&purchaseOrderType='+"").then(function(data) {
				$scope.confirmedskus.tolocation	=	data.order_data[0].shipToLocation;
				angular.forEach(data.order_data,function(item){
					var poType = item.purchaseOrderType;
					
					if( (item.orderStatus	!=	'draft')&&(item.purchaseOrderType =="MAN" || item.purchaseOrderType =="RPL" || item.purchaseOrderType =="ZFUT") ){
						
						Data.get('/orderitem?purchaseordernumber=' + pono).then(function(result) {
							result = result.item_data;
							if(result.length > 0)
							{

								Data.get('/shipmentdata/' + pono).then(function(res) {
									$scope.shipmentData 	=	res;
								});

								$scope.asnTmpObj		=	{};

								angular.element(document.getElementById('package_content')).html('');

								//$scope.orderSkus	=	$scope.tmpOrderSkus	=	$scope.packageOrderSkus	=	{};
								var rows	=	rowsObj	=	{};
						
								$scope.skus 		=	result;
								var purchaseOrder 	=	{};
								$scope.confirmForm.erpNumber    	=  	'ERP'+pono;
								purchaseOrder.purchaseOrderNumber 	=	pono;
								purchaseOrder.erpPurchaseOrder 		=	$scope.confirmForm.erpNumber;
								purchaseOrder.orderStatus 			=	"inProgress";
								//purchaseOrder.location 				=	"OvcStore";

								if(action === 'asn')
								{
									rows	=	result;

									$scope.asnSkusResults	=	true;
									$scope.asnNoResults		=	false;

									//**** Assign The PrefilledData ****//
									$scope.asnForm.shipToLocation 		=	item.shipToLocation;
									$scope.asnForm.orderType 			=	item.purchaseOrderType;
									$scope.shiptoStoreChange($scope.asnForm.shipToLocation,'ASN');
									//**** Assign The PrefilledData ****//

									purchaseOrder.purchaseOrderAsn	=	{};

									var purchaseOrderAsnObj			=	{};
									$scope.asnForm.ERPorderNumber   =	'ERP'+pono;

									purchaseOrderAsnObj.asnId					=	$scope.asn.asnNumebr	=	"ASN" + pono + $scope.getUniqueID(3);
									$scope.asnForm.ASNid 						=	purchaseOrderAsnObj.asnId;
									$scope.asnForm.ASNDate 						=	$filter('dateForm')(new Date());
									purchaseOrderAsnObj.asnDate					=	$scope.getTimeStamp();
									purchaseOrderAsnObj.billOfLadingId			=	"BL" + purchaseOrderAsnObj.asnId;
									$scope.asnForm.billOfLadingId 				=	purchaseOrderAsnObj.billOfLadingId;
									
									purchaseOrderAsnObj.numberOfPackages		=	$scope.asnForm.numberOfPackages;
									purchaseOrderAsnObj.purchaseOrderPackage	=	[];

									purchaseOrder.purchaseOrderAsn 	=	purchaseOrderAsnObj;

									angular.forEach(result,function(item) {
										rowsObj[item.SKU]				=	item;
									});
								}
								else
								{

									//**** Assign The PrefilledData ****//
									$scope.confirmForm.shipToLocation 	=	item.shipToLocation;
									$scope.confirmForm.orderType 		=	item.purchaseOrderType;
									$scope.shiptoStoreChange($scope.confirmForm.shipToLocation,'CONFIRM');
									//**** Assign The PrefilledData ****//

									$scope.skusResults	=	true;
									$scope.noResults	=	false;

									purchaseOrder.purchaseOrderItem		=	[];

									angular.forEach(result,function(item) {
										var tmp	=	{
											"confirmed" 	: {'lineNumber':item.lineNumber, 'sku' : item.SKU, 'qty' : 0, 'qtyStatus' : 'confirmed'},
											"unconfirmed" 	: {'lineNumber':item.lineNumber, 'sku' : item.SKU, 'qty' : 0, 'qtyStatus' : 'unconfirmed'},
											"rejected" 		: {'lineNumber':item.lineNumber, 'sku' : item.SKU, 'qty' : 0, 'qtyStatus' : 'rejected'},
											"Originalqty" 	: item.qty
										};

										rows[item.SKU]				=	tmp;
									});
								}
						
								$scope.orderSkus				=	rows;
								$scope.tmpOrderSkus			=	rowsObj;
								$scope.finalJson.purchaseOrder	=	purchaseOrder;

									// angular.element(document.getElementById('createP')).trigger('click');
									$timeout(function() {
    									angular.element('#createP').triggerHandler('click');
  									});
							}
							else
							{

								$scope.skusResults	=	$scope.asnSkusResults	=	false;
								$scope.noResults	=	$scope.asnNoResults		=	true;
							}

						});	
						
					}else{
						
						if(item.purchaseOrderType !="MAN" || item.purchaseOrderType !="RPL" || item.purchaseOrderType !="ZFUT"){
							var output={"status":"error","message":"Select Purchase Order and try again! "};
						}else{
							var output={"status":"error","message":"Submit Selected Order and try again! "};
						}
						
						Data.toast(output);
					}
					
				});	
			});	
    	}
    };

    $scope.changeQty = function(sku, action) {
    	var skusObj 	=	$scope.orderSkus[sku],
    	confirmed 		=	skusObj.confirmed.qty ? parseInt(skusObj.confirmed.qty) : 0,
    	unconfirmed 	=	skusObj.unconfirmed.qty ? parseInt(skusObj.unconfirmed.qty) : 0,
    	rejected 		=	skusObj.rejected.qty ? parseInt(skusObj.rejected.qty) : 0,
    	OriginalQty 	=	parseInt(skusObj.Originalqty),
    	totalSkuQty		=	confirmed +  unconfirmed + rejected;
    	if(totalSkuQty > skusObj.Originalqty)
    	{
    		toaster.pop('error', 'Error!', 'You Entered more then the Order Quantity', 2000);

    		//Qty Update Case
    		switch(action) {
			    case 'confirmed':
			        skusObj.confirmed.qty 	=	OriginalQty - (unconfirmed + rejected);
			        break;
			    case 'unconfirmed':
			        skusObj.unconfirmed.qty =  	OriginalQty - (confirmed + rejected);
			        break;
			    case 'rejected':
			        skusObj.rejected.qty =  	OriginalQty - (confirmed + unconfirmed);
			        break;
			}
    	}
    };

    //****Validation Checking****//
    var validation      =   function(data, action){
        $scope.error    =   {};
        $scope.errormsg =   {};
        var ErrorArray  =   [];
        if(action == 'Confirmation'){
        	if( ! data.dateTime){
                ErrorArray.push( {'id' : 'datetime', 'message' : 'Select Date & time' });
            }
            if(! data.erpNumber){
                ErrorArray.push( {'id': 'erpNumber', 'message' : 'Enter ERP Number'});
            }
        }
        if(action == 'ASN'){
        	if(! data.ERPorderNumber){
                ErrorArray.push( {'id' : 'ERPorderNumber', 'message' : 'Enter ERP Number' });
        	}
        	if(! data.ASNid){
                ErrorArray.push( {'id' : 'ASNId', 'message' : 'Enter ASN Id' });
        	}
        	if(! data.ASNDate){
                ErrorArray.push( {'id' : 'ASNDate', 'message' : 'Select ASN Date' });
        	}
        	if(! data.numberOfPackages){
                ErrorArray.push( {'id' : 'noPackage', 'message' : 'Enter Package Count' });
        	}
        }

        if(ErrorArray.length > 0){
            angular.forEach(ErrorArray,function(error){
                $scope.error[error.id] 		= 	true;
                $scope.errormsg[error.id] 	= 	error.message;
            });
            return false;
        }
        return true;
    }

    //****IF the Filed changed hide error****//
    $scope.errorMessageCheck 	=	function(error){
    	switch(error){
			case 'dateTime':
				$scope.error.datetime  		= 	$scope.confirmForm.dateTime ? false : "";
				break;
			case 'erpNumber':
				$scope.error.erpNumber 		=	$scope.confirmForm.erpNumber ? false : "";
				break;
			case 'ERPorderNumber':
				$scope.error.ERPorderNumber =	$scope.asnForm.ERPorderNumber ? false : "";
				break;
			case 'ASNId':
				$scope.error.ASNId 			=	$scope.asnForm.ASNid ? false : "" ;
				break;
			case 'ASNDate':
				$scope.error.ASNDate 		=	$scope.asnForm.ASNDate ? false : "";
				break;
			case 'noPackage':
				$scope.error.noPackage 		=	$scope.asnForm.numberOfPackages ? false : "" ;
				break;
    	}
    }

    $scope.saveAsnJson		=	function() {
    	if(validation ($scope.asnForm, 'ASN')){
	    	var packageCount 	= 	Object.keys($scope.packageOrderSkus);
			if(packageCount.length > 0){
				if(Object.keys($scope.packageOrderSkus[packageCount[0]]).length > 0){
			    	$scope.finalJson.purchaseOrder.purchaseOrderAsn.purchaseOrderPackage	=	[];
			    	var asnObj 	=	$scope.asnTmpObj;
			    	var skuObj 	=	$scope.packageOrderSkus;
					var allskus=[];
					angular.forEach($scope.orderSkus, function(item,key){
							allskus.push(item.SKU);
					});
					var	total_subcost	=	0;
					var latest_prices	=	{};
					$scope.allcost.totaltaxasn	=	$scope.allcost.totalvatasn	=	$scope.allcost.subtotalasn	=	$scope.allcost.total_totcostasn	=	0;
					Data.get('/getNewSKUCosts/'+$scope.oldPono+'?costvalue=skuCostAsn').then(function(response) {
						if ((response) && (response.error == undefined)) {
							angular.forEach(response, function(item, key){
								//latest_prices[key]	=	item.skuCost;
								latest_prices[key]	=	item;
							});
						}
								
						ovcDash.get('apis/ang_skus_getproductprice?sku=' + allskus + '&loc=' + encodeURIComponent($scope.confirmedskus.tolocation)).then(function(result) {
							if ((result.status != 'error') && (result !='')) {
								angular.forEach(asnObj, function(item, pId){
									var tmp_obj	=	{};
									tmp_obj			=	item;
									tmp_obj.purchaseOrderItem	=	[];
									angular.forEach(skuObj[pId], function(sItem, sId){
										angular.forEach(sItem, function(skudata,key){
											if(key != 'styleDescription'){
												var skutax	=	skuvat	=	skutottax	=	skutotvat	=	subtotal_cost	=	total_cost	=	to_tal	=	0;
												angular.forEach(result, function(data){
													if((skudata.sku	==	data.ProductPrice.sku) && ($scope.tmpOrderSkus[skudata.sku]["qty"])){

															$scope.confirmedskus.skus_newprices[skudata.sku]	=	skudata.skuCostAsn ? skudata.skuCostAsn : data.ProductPrice.Cost;

															skudata.purPrices = [];

															var currencyObj = {};
															currencyObj.currencyIso = 	data.ProductPrice.currencyId;
															currencyObj.value 		=	skudata.skuCostAsn ? skudata.skuCostAsn : data.ProductPrice.Cost;

															skudata.purPrices.push(currencyObj);

															delete skudata.skuCostAsn;

														tmp_obj.purchaseOrderItem.push(skudata);
													}
												});
											}
										});
									});

									//*****For Assign json ASN*****//
									if($scope.asnForm[pId].packageId){
										tmp_obj.packageId 			 =	$scope.asnForm[pId].packageId;
									}else{
										delete tmp_obj.packageId;
									}

									tmp_obj.trackingNumber 	     =	$scope.asnForm[pId].trackingNumber;
									tmp_obj.expectedDeliveryDate =  $scope.getTimeStamp($filter('dateFormChange')($scope.asnForm[pId].expectedDeliveryDate));
									tmp_obj.shipDate 			 = 	$scope.getTimeStamp($filter('dateFormChange')($scope.asnForm[pId].shipDate));
									$scope.finalJson.purchaseOrder["erpPurchaseOrder"] 	=	$scope.asnForm.ERPorderNumber;
							        $scope.finalJson.purchaseOrder["orderType"]			= 	$scope.asnForm.orderType;
							        $scope.finalJson.purchaseOrder["afs"]				=	$scope.asnForm.AFS;
							        $scope.finalJson.purchaseOrder["shipToLocation"]	= 	$scope.asnForm.shipToLocation;
							        $scope.finalJson.purchaseOrder["markForLocation"]	= 	$scope.asnForm.markForLocation;

							        $scope.finalJson.purchaseOrder.purchaseOrderAsn["asnId"] 			= 	$scope.asnForm.ASNid;
						            $scope.finalJson.purchaseOrder.purchaseOrderAsn["asnDate"]			= 	$scope.getTimeStamp($filter('dateFormChange')($scope.asnForm.ASNDate));
						            $scope.finalJson.purchaseOrder.purchaseOrderAsn["billOfLadingId"]	= 	$scope.asnForm.billOfLadingId;
						            $scope.finalJson.purchaseOrder.purchaseOrderAsn["numberOfPackages"]	= 	$scope.asnForm.numberOfPackages;
							        //*****For Assign json ASN*****//

							        //*****For ASN With PAckage and Without PAckage*****//
										$scope.finalJson.purchaseOrder.purchaseOrderAsn.purchaseOrderPackage.push(tmp_obj);

										$scope.finalJson.purchaseOrder.purchaseOrderAsn.numberOfPackages	=	$scope.finalJson.purchaseOrder.purchaseOrderAsn.purchaseOrderPackage.length;
							        	
							        //*****For ASN With PAckage and Without PAckage*****//
								});	
								$scope.Json 	=	[];
								$scope.Json.push($scope.finalJson);
								//Call the ASN json service
								// var jsonStr	=	JSON.stringify($scope.finalJson);

								//New JSON Data ASN
								$scope.asnForm.JsonForm 	=	$scope.Json;

								var jsonStr	=	JSON.stringify($scope.Json);
								$scope.callService('/receivingpurchasejson', jsonStr);
							}
						});
					});
				}else{
					var output = {"status": "error","message": "Please add valid Package"};
			        Data.toast(output);
				}
			}else{
				var output = {"status": "error","message": "Please add valid Package"};
		        Data.toast(output);
			}
		}

    };

    $scope.saveConfirmJson	=	function() {
    	if(validation ($scope.confirmForm, 'Confirmation')){
			var allskus	=	[];
			angular.forEach($scope.orderSkus,function(item,key) {
				allskus.push(key);
			});

			ovcDash.get('apis/ang_skus_getproductprice?sku=' + allskus + '&loc=' + encodeURIComponent($scope.confirmedskus.tolocation)).then(function(result) {
				if ((result.status != 'error') && (result !='')) {
					var	total_subcost	=	0;
					$scope.allcost.totaltax	=	$scope.allcost.totalvat	=	$scope.allcost.subtotal	=	$scope.allcost.total_totcost	=	0;
					
					//*****Form Eelments push in json*****//
					$scope.finalJson.purchaseOrder["erpPurchaseOrder"]  	=	$scope.confirmForm.erpNumber;
					$scope.finalJson.purchaseOrder["orderType"] 			=	$scope.confirmForm.orderType;
					$scope.finalJson.purchaseOrder["afs"]  					=	$scope.confirmForm.AFS;
					$scope.finalJson.purchaseOrder["erpNotes"] 				=	$scope.confirmForm.ERPNotes;
					$scope.finalJson.purchaseOrder["shipToLocation"] 		=	$scope.confirmForm.shipToLocation;
					
					var dateFormat = localStorage.configDateFormat ? localStorage.configDateFormat : CONSTANTS_VAR.DATE_FORMAT_VAL;
					
					var date = moment($scope.confirmForm.dateTime, MOMENT_FORMATS[dateFormat] +' '+MOMENT_FORMATS.TIME).toISOString();

					$scope.finalJson.purchaseOrder["timestamp"]  			=	date;
					//*****Form Eelments push in json*****//

					angular.forEach($scope.orderSkus,function(confirmitem,key) {
						angular.forEach($scope.skus,function(skuitem) {
							var skutax	=	skuvat	=	skutottax	=	skutotvat	=	subtotal_cost	=	total_cost	=	to_tal	=	skucost	=	0;
							angular.forEach(result,function(item) {
								if((skuitem.SKU	==	item.ProductPrice.sku) && (skuitem.SKU	==	key) ){
									if(confirmitem.confirmed.skuCostConfirm){
										skucost	=	confirmitem.confirmed.skuCostConfirm;

										delete confirmitem.confirmed.skuCostConfirm;
									} else {
										skucost	=	skuitem.productCost;
									}

									if (skucost && skucost != 0) {
										confirmitem.confirmed.purPrices = [];
										confirmitem.unconfirmed.purPrices = [];
										confirmitem.rejected.purPrices = [];

										var currencyObj = {};
										currencyObj.currencyIso = 	item.ProductPrice.currencyId;
										currencyObj.value 		=	skucost;

										confirmitem.confirmed.purPrices.push(currencyObj);
										confirmitem.unconfirmed.purPrices.push(currencyObj);
										confirmitem.rejected.purPrices.push(currencyObj);
									}
								}
							});
						});
					});

					$scope.finalJson.purchaseOrder.purchaseOrderItem		=	[];
					
					var orderSkus	=	$scope.orderSkus;
					angular.forEach(orderSkus, function(item, key){
						$scope.finalJson.purchaseOrder.purchaseOrderItem.push(item.confirmed);
						$scope.finalJson.purchaseOrder.purchaseOrderItem.push(item.unconfirmed);
						$scope.finalJson.purchaseOrder.purchaseOrderItem.push(item.rejected);
					});
					$scope.Json=[];
					$scope.Json.push($scope.finalJson);

					var jsonStr						=	JSON.stringify($scope.Json);
					$scope.confirmForm.JsonForm 	=	$scope.Json;
					$scope.callService('/receivingpurchasejson', jsonStr);

				}
			});
		}
    };

    $scope.callService	=	function(uploadUrl, jsonStr) {

    	 var obj = {"data" : {"uploaded_file" : jsonStr, "type" : "json"}};

        Data.post(uploadUrl, obj)
        .then(function(success){
            // $scope.finalJson	=	{};
			// $scope.finalJson.purchaseOrder	=	{};
			// $scope.skus	=	[];
			if($scope.activeTab	==	'confirmation'){
				$timeout(function() {
					angular.element('#confirmation').trigger('click');
				}, 1);
			}else{
				$timeout(function() {
					angular.element('#asn').trigger('click');
				}, 1);
			}
          	if(success){
	       		if (success.status == "success") {
		            var output = {
		                "status": "success",
		                "message": "Order Updated Successfully"
		            };
		            Data.toast(output);
				}
				else{
					var output = {
			                "status": "error",
			                "message": "Error with Updating Order"
		            };
		            Data.toast(output);
				}
       		}
        });
    };

	$scope.getDatetime			=	$scope.newDate	=	new Date();
	$scope.currentdate			=	$filter('date')($scope.getDatetime, "yyyy-MM-dd");


	function addDays(theDate, days) {
		return new Date(theDate.getTime() + days*24*60*60*1000);
	};

	$scope.change_frdate = function(fdate){
		$scope.cfrom_date		=	$filter('date')(fdate, "yyyy-MM-dd");

		$scope.newDate			=	addDays(new Date(fdate), 2);
	};

	$scope.change_todate = function(odate){

		$scope.cto_date			=	odate;
	};

    $scope.servicefun();

    //***Reset Function For UpdateOrder ***//
    $scope.resetUpdateOrder 	=	function(){
    	$scope.packageOrderSkus	=	{};
		$scope.asnForm 			=	{};
		$scope.asnSkusResults	=	false;
		$scope.packageId 		= 	0;
    }
	
});

app.directive("createPackageButton", function($compile){
	return {
		scope: true,
		link: function(scope, element, attrs) {
			scope.addPackage  = function() {
				++scope.packageId;
				scope.$parent.packageId	=	scope.packageId;

				var pId	=	Math.round(+new Date()/1000);
				var tmpObj 	=	{};
				scope.asnForm[scope.packageId] 	=	{};
				tmpObj.packageId			=	pId;
				scope.asnForm[scope.packageId].packageId 	=	tmpObj.packageId;
				scope.tempPackageId 						=	tmpObj.packageId;
				scope.asnForm.numberOfPackages 				=	scope.packageId;
				tmpObj.trackingNumber		=	"FD" + scope.oldPono + pId;
				scope.asnForm[scope.packageId].trackingNumber 	=	tmpObj.trackingNumber;
				scope.asnForm[scope.packageId].showPackageDetail = true;
				tmpObj.shipDate				=	"";
				tmpObj.expectedDeliveryDate	=	"";
				tmpObj.purchaseOrderItem	=	[];
				scope.asn[scope.packageId]		=	{"show" : true, "shipDate" : "", "expectedDeliveryDate" : ""};
				scope.asnTmpObj[scope.packageId]	=	tmpObj;

				angular.element(document.getElementById('package_content'))
							.append($compile("<package-item></package-item>")(scope));
			};
        }
	};
});
	

app.directive('packageItem', function ($compile) {

	return {
        restrict: 'E',
        scope:true,
        templateUrl:'package.html',

		link: function(scope, element, attrs, controllers) {
			scope.packageId	=	scope.packageId;
		},

        controller: function($scope, $element) {

        	$scope.removePackage 		=	function(pId) {

        		$scope.asn[pId].show	=	false;

        		if(typeof $scope.$parent.packageOrderSkus[pId] != undefined)
        			delete $scope.$parent.packageOrderSkus[pId];

        		if(typeof $scope.$parent.asnTmpObj[pId] != undefined)
        			delete $scope.$parent.asnTmpObj[pId];

        	};

        	$scope.removePackageSkus	=	function(pId, pcode, skuId) {

        		/* if(typeof $scope.packageOrderSkus[pId][skuId] != undefined)
        			delete $scope.packageOrderSkus[pId][skuId]; */
				
					if(typeof $scope.packageOrderSkus[pId][pcode][skuId] != undefined)
        			delete $scope.packageOrderSkus[pId][pcode][skuId];
				
					var abc	=	Object.keys($scope.packageOrderSkus[pId][pcode]);
				 	if(abc.length == 1)
						delete $scope.packageOrderSkus[pId][pcode];
				
        	};

        	//****Tracking Field Error Clear****//
        	$scope.checkTrackingNo 	=	function(packId){
        		if($scope.asnForm[packId].trackingNumber){
        			$scope.asnForm[packId].trackingNumberError 	=	false;
        		}
        	}

        	$scope.addPackageSkus = function(packageId , selctedSku) {

        		//****Tracking Number Error ****//
        		if( ! $scope.asnForm[packageId].trackingNumber){
        			$scope.asnForm[packageId].trackingNumberError 	=	true;
        			return false
        		}

        		if(selctedSku == null)
        			return false;

        		var sku 	=	selctedSku.SKU;

        		var shipQty 	=	0;

        		if(typeof $scope.packageOrderSkus[packageId] === 'undefined')
        		{
        			$scope.packageOrderSkus[packageId]	=	{};
        		}
        		
				var lineno	=	0;
				 if(typeof $scope.packageOrderSkus[packageId][selctedSku.productCode] === 'undefined')
        		{
        			$scope.packageOrderSkus[packageId] [selctedSku.productCode]	=	{};
					$scope.packageOrderSkus[packageId] [selctedSku.productCode]['styleDescription']	=	selctedSku.styleDescription;
					
        		}
        		 else
        		{
        			shipQty 	=	($scope.packageOrderSkus[packageId][selctedSku.productCode][sku] != undefined) ? $scope.packageOrderSkus[packageId][selctedSku.productCode][sku].qty + 1 : 0;
					
        		}
				
				$scope.packageOrderSkus[packageId][selctedSku.productCode][sku] 	=	{"sku" : sku, "qtyStatus" : "shipped", "qty" : shipQty, "lineNumber":selctedSku.lineNumber};
        	};

        }
    };

});