var app = angular.module('OVCstockApp', ['returnReceipt','skuMatrix', 'ovcdataExport','roleConfig']);

app.controller('manualReceiptCtrl', function($rootScope, $scope, $http, $timeout, $stateParams, $state,$window, $location,$anchorScroll,  Data, ovcDash, $filter, toaster, ReturnReceiptService, ovcdataExportFactory,Utils) {
	$scope.action	=	{};

	$scope.action.type	=	'manual';
	$scope.action.labelMode 	=	"manualReceipt";
	$scope.action.page 	=	1;
	$scope.title 		= 	'Add';
	$scope.action.title =	'add';
	$scope.titleadd 	= 	true;
	$scope.titleedit 	= 	false;
	var user_detail 	= 	$rootScope.globals['currentUser'];
	var user_id 		= 	user_detail['username'];
	var fname 			= 	$rootScope.globals.currentUser.firstname;
	var lname 			= 	$rootScope.globals.currentUser.lastname;
	var username 		= 	fname + ' ' + lname;
	$scope.action.user  =   username;
	var stateParamId 	=	0;
	$scope.showdata 	=	false;
	if($stateParams.manualid != undefined){
		stateParamId  		  = 	$stateParams.manualid;
		var creturnid 		  = 	sessionStorage.manualid;
		$scope.title  		  = 	'Edit';
		$scope.titleadd  	  =      false;
		$scope.titleedit      =      true;
		$scope.action.title   =  	'edit';
	}

	if($stateParams.cmanualid != undefined){
		stateParamId 		=	$stateParams.cmanualid;
		$scope.title 		= 	'Copy';
		$scope.action.title =	'copy';
	}
	$scope.asnnumber =function(){
		$scope.uniqNumber 	=	function(length){
			return Math.round(+new Date()/1000).toString().substr(2, length);
		};
		$scope.getUniqueID	=	function(length) {
			return Math.random().toString(36).substr(2, length).toUpperCase();
		};
		$scope.form.asnNumber        =   "ASN" + $scope.uniqNumber(5) + $scope.getUniqueID(4);
		$scope.form.receivedDate   	=	 $filter('date')(new Date(), 'MM/dd/yyyy');
	}

	Utils.configurations().then(function(configData){
		$scope.config = configData;
		if($scope.action.title == 'add'){
			$scope.showdata 	=	$scope.config.action.enablePackageatmanualreceipt;
		}
		$scope.action.withoutpackage = false;
	});

	$scope.getreceiptlist = function(){
		$state.go('ovc.manualReceipt-list');
	}
	$scope.action.formerror 	=	{};
	$scope.action.formerrormsg  =	{};

	var currencylabel  =   $scope.translation.currencylist[0];
    var currencylist   =   [];

    Utils.userLocation().then(function(resultsloc){
    	angular.forEach(resultsloc, function(item) {
            currencylist[item.id]    =   item.currency;
        });
    });
	
	$scope.validatereceipt=function(data){
		$scope.action.formerror 	=	{};
		$scope.action.formerrormsg 	=	{};
		var errorArray 				=	[];

			if((data.receiptType == undefined ) || (data.receiptType == ''))
				errorArray.push({'id' : 'receiptType', 'message' : 'Please select Receipt Type'});
			
			if((data.shipToLocation == '') || (data.shipToLocation == undefined))
				errorArray.push({'id' : 'shipToLocation', 'message' :'Please Select the Received In Store'});
			
			if((data.receiptType == 'MR_IBT_M')){
				if((data.FromLocation == '') || (data.FromLocation == undefined))
					errorArray.push({'id' : 'FromLocation', 'message' :'Please Select the Received From Store'});
			}
			if((data.receiptType == 'MR_MAN')){
				if((data.vendorId == '') || (data.vendorId == undefined))
					errorArray.push({'id' : 'vendorId', 'message' :'Please Select the Received From Vendor'});
			}
		  	if((data.numberOfSKU == 0)){
				errorArray.push({'id' : 'skuData' , 'message' : 'Please add atleast one SKU'});
		  	}
			if(errorArray.length > 0){
                angular.forEach(errorArray,function(e){
                  	$scope.action.formerror[e.id]=true;
					$scope.action.formerrormsg[e.id]=e.message;
                });
                $scope.action.page 	=	1;
                return false;
	        }
		return true;
	}

	$scope.saveReceipt=function(data,orderstatus,qtystatus){
		if (( $scope.validatereceipt(data) )){	
        	var orderReceiptNumber 	=	data.receiptNumber;
			var asnObj = data.packageData;
			var asnStatus = (qtystatus === 'received') ? 'receivedInFull' : (qtystatus === 'receiveInProgress') ? 'receiveInProgress' : "";
			var returnobj = {};
			returnobj.orderData={};
			//returnobj.orderPackage = [];
			orderPackages = [];
			angular.forEach(data.packageData, function(item, pId) {
				var newobj = {};
				var pkid = item.packageId;
				newobj.orderSKU = [];
				angular.forEach(item.productDetails, function(styleItem, styleId) {
					if(styleItem[0].skus != undefined){
						angular.forEach(styleItem[0].skus, function(sItem, sId) {
							var packageobj = {
								lineNumber: parseInt(sItem.lineNumber),
								SKU: sItem.sku,
								qtyStatus:qtystatus,
								//qtyStatus: status,
								qty: sItem.qty,
								productName: sItem.name,
								productDescription: sItem.description,
								producUom: sItem.selectedUOM,
								productCost: sItem.cost,
								productTax: sItem.productTax,
								productVat: sItem.productVat,
								productCode:sItem.productCode,
								//shipToLocation:sItem
								isVat: sItem.taxisVAT,
								totalProductCost: sItem.totalnotax,
								totalProductTax: sItem.totalProductTax,
								totalProductVat: sItem.totalProductVat,
								waist:sItem.waist,
								length:sItem.length,
								size:sItem.size,
								styleColor:sItem.styleColor
								
							};
							if(orderstatus == 'draft' && $scope.action.title   ==  	'edit'){
								if(sItem.changed || !sItem.id)
								newobj.orderSKU.push(packageobj);
							}else{
								newobj.orderSKU.push(packageobj);
							}
						});
					}
				});
				
			
				if(item.receivedDate!= '' && item.receivedDate != undefined){
					if(orderstatus == 'received'){
						newobj.receivedDate =$filter('dateFormChange')(item.receivedDate);
						$scope.asnCreated 	=	newobj.receivedDate;
						$scope.asnLastModified =	newobj.receivedDate;
					}else{
						newobj.expectedDeliveryDate =$filter('dateFormChange')(item.receivedDate);
						newobj.receivedDate =  newobj.receivedDate ? newobj.receivedDate : newobj.expectedDeliveryDate;
						$scope.asnCreated 	=	newobj.expectedDeliveryDate;
						$scope.asnLastModified =	newobj.expectedDeliveryDate;
					} 
				}

				if(item.shipDate!= '' && item.shipDate != undefined){
					newobj.shipDate =$filter('dateFormChange')(item.shipDate);
				}
				newobj.packageStatus	=	qtystatus;
				newobj.packageId = item.packageId;
				newobj.trackingNumber = item.trackingNumber;
				orderPackages.push(newobj);
			});
				if($scope.action.title == 'copy'){
					orderReceiptNumber 	=	'';
				}
			 returnobj.orderData = {purchaseOrderType: data.receiptType,
					shipToLocation: data.shipToLocation,
					FromLocation:data.FromLocation,
					vendorId:data.vendorId,
					purchaseOrderNumber: data.order_number,
					erpPurchaseOrder: data.erpOrderNumber,
					//asnId:data.asnId,
					asnReferenceNumber:data.asnId,
					asnId:data.asnNumber,			
					numberOfPackages: data.numberOfPackages,
					numberOfProducts: data.numberOfProducts,
					numberOfSKU: data.numberOfSKU,
					totalPoCost: data.totalPoCost,
					orderNumber: orderReceiptNumber,
					totalPoVAT: data.totalPoVAT,
					totalPoTax: data.totalPoTax,
					PoSubtotal: data.PoSubtotal,
					specialInstructions: data.specialInstructions,
					userId: data.created_by,
					createdBy: data.created_by,
					orderStatus:orderstatus,
					//orderStatus: status,
					orderPackage:orderPackages,
					asnCreated : $scope.asnCreated,
					asnLastModified : $scope.asnLastModified
				}
				if(asnStatus){
					returnobj.orderData['asnStatus'] = asnStatus;
				}
				returnobj.deletedData = data.deletedskudata;
				/*****Save on Add Return*****/
				var returnobj = JSON.stringify(returnobj);
			Data.put('/receiptpackage' , {
				data: {returnObj: returnobj}
			}).then(function(pkresult) {
				if((pkresult != undefined) && (pkresult.status == "success")){
					if(orderstatus =='draft')
						var output = {"status": "success","message": "Receipt Saved as Draft Successfully"	};
					else
						var output = {"status": "success","message": "Receipt Created Successfully"	};
						Data.toast(output);
						$state.go('ovc.manualReceipt-list');
				}
			});
		}	
	}

	$scope.deleteReceipt	= function(){

		var return_id 	=	$scope.returnOrder_id;
		  $.confirm({
            title: 'Delete Manual Receipt',
            content: 'Confirm delete?',
            confirmButtonClass: 'btn-primary',
            cancelButtonClass: 'btn-primary',
            confirmButton: 'Ok',
            cancelButton: 'Cancel',
            confirm: function () {
                Data.delete('/receipt/'+return_id+'?receiptNumber='+$scope.return_orderno).then(function (data) {
                    if(data.ok == 1){
                        var output	=	{"status":"success","message":"Manual Receipt Deleted Successfully"};
                        $state.go('ovc.manualReceipt-list');
                    }else{
                        var output	=	{"status":"error","message":"Manual Receipt Delete Failed"}; 
                    }
                    Data.toast(output);
                });
                
            },
            cancel: function () {
                return false;
            }
        
        });
        return false;

	};

	$scope.uniqNumber 	=	function(length){
		return Math.round(+new Date()/1000).toString().substr(2, length);
	};
	$scope.getUniqueID	=	function(length) {
		return Math.random().toString(36).substr(2, length).toUpperCase();
	};
	

	$scope.getmanualReceipt = function() {
		$scope.showtab1=true;
		$timeout(function(){
            angular.element('.prod_result').focus();
        },500);
			$scope.showtab1=true;
		if (stateParamId != 0) {
			Data.get('/receipt?id=' + stateParamId).then(function(results) {
				
				$scope.drop_change(results.purchaseOrderType);
				if ((results != '') && (results != undefined) && (results.status != "error")) {
					$scope.currency     =   currencylabel[currencylist[results.shipToLocation]];
					var packarray=[]; newpkgs=[];
					var skudata={};
					var orderno = results.orderNumber;
					$scope.return_orderno	=	results.orderNumber;
					$scope.returnOrder_id	=	results._id;
					if(results.orderStatus == "received"){
						$scope.showtab1 	= 	false;
						$scope.action.page 	=	2;
                        $scope.action.status= 	false;
                        $scope.action.received 	=	true;
                        $scope.action.receive_title 	=	true;
					}
					if($scope.action.title == 'copy'){
						$scope.action.received 	=	false;
						$scope.action.page 		=	1;
					}
					Data.get('/receiptpackage?po_id=' + orderno).then(function(pkgresult) {
						var shipDate = pkgresult.shipDate;
						var receivedDate = pkgresult.receivedDate;
						if(pkgresult.status != "error"  && pkgresult != undefined){
							var newpkgs=pkgresult;
						}
						angular.forEach(newpkgs, function(values){
							var newobj 	= 	{};
							var packproductcodes 	= 	[];
							var prodcodedesc 	= 	[];
							if(values.packageId){
								$scope.showdata 	=	true;
								var packitems 	= 	packtotal=packsubtotal=packtax=packvat=packskus=0;
								newobj.asnId 			=	values.asnId;
								newobj["packageId"] 	= 	values.packageId;
								newobj.id 				=	values._id;
								newobj.productDetails 	= 	{};
								newobj.sku  			= 	'';
								newobj["style"] 		= 	'';
								newobj["shipDate"] 		=	$filter('dateForm')( values.shipDate);
								newobj["receivedDate"] 	=	$filter('dateForm')(values.receivedDate);
								newobj["expectedDeliveryDate"] 	=	$filter('dateForm')(values.expectedDeliveryDate);
								newobj["trackingNumber"] = values.trackingNumber;
								newobj['packageStatus'] = values.packageStatus;
								//newobj['reversepackage'] = true;
								newobj['reversepackage'] = false;
								
								angular.forEach(values["orderSKU"], function(item) {
									var idx = packproductcodes.indexOf(item.productCode);
									// is currently selected
									if (idx > -1) {
									}
									// is newly selected
									else {
										packproductcodes.push(item.productCode);
										var describe={
											productCode:item.productCode,
											productDescription:item.styleDescription
										}
										prodcodedesc.push(describe);
										newobj.productDetails[item.productCode] 				= 	[];
										newobj.productDetails[item.productCode][0] 				= 	{};
										newobj.productDetails[item.productCode][0]["skus"] 		= 	[];
										newobj.productDetails[item.productCode][0]["productDescription"] 	= 	item.styleDescription;
										newobj.productDetails[item.productCode][0]["styleColor"] 			= 	item.styleColor;
									}
									
									var pkitem 			=	{};
									pkitem.lineNumber	=	parseInt(item.lineNumber);
									pkitem.sku 			= 	item.SKU;
								    pkitem.productCode 	= 	item.productCode;
									pkitem.name 		= 	item.productName;
									pkitem.description 	= 	item.description,
									pkitem.cost 		= 	item.productCost;
									pkitem.productTax 	= 	item.productTax;
									pkitem.productVat 	= 	item.productVat;
									pkitem.qty 			= 	parseInt(item.qty);
									pkitem.originalQty 	= 	parseInt(item.qty);
									pkitem.selectedUOM 	= 	item.producUom;
									pkitem.taxisVAT 	= 	item.isVat;
									pkitem.total 		= 	item.totalProductCost;
									pkitem.totalProductTax 	= 	item.totalProductTax;
									pkitem.totalProductVat 	= 	item.totalProductVat;
									pkitem.id 				= 	item._id;
									pkitem.waist			=	item.waist;
									pkitem.length			=	item.length;
									pkitem.size				=	item.size;
									pkitem.styleColor		=	item.styleColor;
									pkitem.percentage 		= 	0;
									var subtotal1 			= 	(parseInt(item.qty)* parseFloat(item.productCost));
									var subtotal 			= 	parseFloat(subtotal1).toFixed(2);
									pkitem.totalnotax 		= 	subtotal;
									if(item.wac != undefined){
										pkitem.wac 	= 	item.wac;
									}else{
										pkitem.wac 	=	0;
									}
									
									newobj.productDetails[item.productCode][0]["skus"].push(pkitem);
									//packitems=packtotal=packsubtotal=packtax=packvat=0;
									packitem 		= 	parseInt(packitems)+parseInt(item.qty);
									packtotal 		=	parseFloat(packtotal)+parseFloat(item.totalProductCost);	
									packsubtotal 	=	parseFloat(packsubtotal)+parseFloat(subtotal);	
									packtax 		=	parseFloat(packtax)+parseFloat(item.totalProductTax);	
									packvat			=	parseFloat(packvat)+parseFloat(item.totalProductVat);	
									packskus++;
								});
							 
								newobj.total 		=	parseFloat(packtotal).toFixed(2);
								newobj.subtotal 	=	parseFloat(packsubtotal).toFixed(2);
								newobj.tax 			=	parseFloat(packtax).toFixed(2);
								newobj.vat 			=	parseFloat(packvat).toFixed(2);
								newobj.quantity 	=	packitems;
								newobj.skus 		=	packskus;
								
								angular.forEach(packproductcodes,function(item1) {
									var pcnoitems=pctotal=pcsubtotal=pctax=pcvat=0;
										angular.forEach(newobj.productDetails[item1][0]["skus"], function(item) {
										    if(item.productCode== item1){
											pcnoitems 	= 	parseInt(pcnoitems)+parseInt(item.qty);
											pctotal 	=	parseFloat(pctotal)+parseFloat(item.total);	
											pcsubtotal 	=	parseFloat(pcsubtotal)+parseFloat(item.totalnotax);	
											pctax 		=	parseFloat(pctax)+parseFloat(item.totalProductTax);	
											pcvat 		=	parseFloat(pcvat)+parseFloat(item.totalProductVat);	
											}
										 });
										 newobj.productDetails[item1][0].productCode=item1;
										 //newobj.productDetails[item1][0].productDescription =newobj.productDetails[item1][0].description;
										 newobj.productDetails[item1][0].qty  		= 	pcnoitems;
										 newobj.productDetails[item1][0].total 		= 	parseFloat(pctotal).toFixed(2);
										 newobj.productDetails[item1][0].subtotal 	= 	parseFloat(pcsubtotal).toFixed(2);
										 newobj.productDetails[item1][0].tax 		= 	parseFloat(pctax).toFixed(2);
										 newobj.productDetails[item1][0].vat 		= 	parseFloat(pcvat).toFixed(2);
								});		
										
								    packarray.push(newobj);
							}
							else{
								$scope.showdata 	=	false;
								var packitems 			= 	packtotal=packsubtotal=packtax=packvat=packskus=0;
							// newobj["packageId"] 	= 	values.packageId;
							newobj.id 				=	values._id;
							$scope.numberofsku 		=	values.numberOfSKU;
							newobj.productDetails 	= 	{};
							newobj.sku  			= 	'';
							newobj["style"] 		= 	'';
							newobj["trackingNumber"] = values.trackingNumber;
							newobj.asnId			=	values.asnId;
							
							angular.forEach(values["orderSKU"], function(item) {
								var idx = packproductcodes.indexOf(item.productCode);
								// is currently selected
								if (idx > -1) {
								}
								// is newly selected
								else {
									packproductcodes.push(item.productCode);
									var describe={
										productCode:item.productCode,
										productDescription:item.styleDescription
									}
									prodcodedesc.push(describe);
									newobj.productDetails[item.productCode] 				= 	[];
									newobj.productDetails[item.productCode][0] 				= 	{};
									newobj.productDetails[item.productCode][0]["skus"] 		= 	[];
									newobj.productDetails[item.productCode][0]["productDescription"] 	= 	item.styleDescription;
									newobj.productDetails[item.productCode][0]["styleColor"] 			= 	item.styleColor;
								}
								
								var pkitem 			=	{};
								pkitem.lineNumber	=	parseInt(item.lineNumber);
								pkitem.sku 			= 	item.SKU;
							    pkitem.productCode 	= 	item.productCode;
								pkitem.name 		= 	item.productName;
								pkitem.description 	= 	item.description,
								pkitem.cost 		= 	item.productCost;
								pkitem.productTax 	= 	item.productTax;
								pkitem.productVat 	= 	item.productVat;
								pkitem.qty 			= 	parseInt(item.qty);
								pkitem.originalQty 	= 	parseInt(item.qty);
								pkitem.selectedUOM 	= 	item.producUom;
								pkitem.taxisVAT 	= 	item.isVat;
								pkitem.total 		= 	item.totalProductCost;
								pkitem.totalProductTax 	= 	item.totalProductTax;
								pkitem.totalProductVat 	= 	item.totalProductVat;
								pkitem.id 				= 	item._id;
								pkitem.waist			=	item.waist;
								pkitem.length			=	item.length;
								pkitem.size				=	item.size;
								pkitem.styleColor		=	item.styleColor;
								pkitem.percentage 		= 	0;
								$scope.ordernumber 		=	item.orderNumber;
								$scope.totalqty 		=	item.qty;
								$scope.asnId			=	item.asnId;
								$scope.totalcost 		= 	item.totalProductCost;
								var subtotal1 			= 	(parseInt(item.qty)* parseFloat(item.productCost));
								var subtotal 			= 	parseFloat(subtotal1).toFixed(2);
								pkitem.totalnotax 		= 	subtotal;
								if(item.wac != undefined){
									pkitem.wac 	= 	item.wac;
								}else{
									pkitem.wac 	=	0;
								}
								
								newobj.productDetails[item.productCode][0]["skus"].push(pkitem);
								//packitems=packtotal=packsubtotal=packtax=packvat=0;
								packitem 		= 	parseInt(packitems)+parseInt(item.qty);
								packtotal 		=	parseFloat(packtotal)+parseFloat(item.totalProductCost);	
								packsubtotal 	=	parseFloat(packsubtotal)+parseFloat(subtotal);	
								packtax 		=	parseFloat(packtax)+parseFloat(item.totalProductTax);	
								packvat			=	parseFloat(packvat)+parseFloat(item.totalProductVat);	
								packskus++;
							});
						 
							newobj.total 		=	parseFloat(packtotal).toFixed(2);
							newobj.subtotal 	=	parseFloat(packsubtotal).toFixed(2);
							newobj.tax 			=	parseFloat(packtax).toFixed(2);
							newobj.vat 			=	parseFloat(packvat).toFixed(2);
							newobj.quantity 	=	packitems;
							newobj.skus 		=	packskus;
							
							angular.forEach(packproductcodes,function(item1) {
								var pcnoitems=pctotal=pcsubtotal=pctax=pcvat=0;
									angular.forEach(newobj.productDetails[item1][0]["skus"], function(item) {
									    if(item.productCode== item1){
										pcnoitems 	= 	parseInt(pcnoitems)+parseInt(item.qty);
										pctotal 	=	parseFloat(pctotal)+parseFloat(item.total);	
										pcsubtotal 	=	parseFloat(pcsubtotal)+parseFloat(item.totalnotax);	
										pctax 		=	parseFloat(pctax)+parseFloat(item.totalProductTax);	
										pcvat 		=	parseFloat(pcvat)+parseFloat(item.totalProductVat);	
										}
									 });
									 newobj.productDetails[item1][0].productCode=item1;
									 //newobj.productDetails[item1][0].productDescription =newobj.productDetails[item1][0].description;
									 newobj.productDetails[item1][0].qty  		= 	pcnoitems;
									 newobj.productDetails[item1][0].total 		= 	parseFloat(pctotal).toFixed(2);
									 newobj.productDetails[item1][0].subtotal 	= 	parseFloat(pcsubtotal).toFixed(2);
									 newobj.productDetails[item1][0].tax 		= 	parseFloat(pctax).toFixed(2);
									 newobj.productDetails[item1][0].vat 		= 	parseFloat(pcvat).toFixed(2);
							});		
									
							    // packarray.push(newobj);
							     skudata=newobj;
							    // skudata=packarray;

							}

						});
						var deletedskus 		= 	[];
						var deletedpackages 	=	[];
						var createduser 		= 	results.createdBy;
						var shipDate     			=	$filter('dateForm')(pkgresult[0].shipDate);
						var receivedDate 			=	$filter('dateForm')(pkgresult[0].receivedDate);
						var expectedDeliveryDate 	=	$filter('dateForm')(pkgresult[0].expectedDeliveryDate);
						var asnno  					= 	pkgresult[0].asnId;
						ovcDash.get('apis/ang_username?user_id=' + createduser).then(function(userdata) {
							if((userdata != undefined) && (userdata != '')){
								var userdetail=userdata.firstName + ' ' + userdata.lastName;
								if(packarray.length >0)
									var asn 	=	packarray[0].asnId;
								else
									var asn 	=	asnno;
									
								var finaljson={
									receiptType: results.purchaseOrderType,
									shipToLocation:results.shipToLocation,
									FromLocation:results.FromLocation,
									vendorId:results.vendorId,
									id:results._id,
									order_number:results.purchaseOrderNumber,
									erpOrderNumber:results.erpPurchaseOrder,
									numberOfPackages:results.numberOfPackages,
									asnId:results.asnReferenceNumber,
									asnNumber:asn,
									numberOfProducts:results.numberOfProducts,
									numberOfSKU:results.numberOfSKU,
									totalPoCost:results.totalPoCost,
									totalPoVAT:results.totalPoVAT,
									totalPoTax:results.totalPoTax,
									PoSubtotal:results.PoSubtotal,
									specialInstructions:results.specialInstructions,
									receiptStatus:results.orderStatus,
									created_by:results.userId,
									createdBy:userdetail,
									shipDate:shipDate,
									receivedDate:receivedDate,
									receiptNumber:results.orderNumber,/* created_by:results.createdBy, */
									packageData:packarray, 
									addskuData:skudata,
									deletedskudata:deletedskus,deletedpackagedata:deletedpackages 
								};

								if($scope.action.title == 'copy'){
									finaljson.asnNumber        =   "ASN" + $scope.uniqNumber(5) + $scope.getUniqueID(4);
								}
								$scope.form 	= 	finaljson;
								$scope.$broadcast('ForLocation',$scope.form);
							}
						});						
					});
				}
			});
		}
	};

	//Copy Manual Receipt Functionality 
	$scope.copymanualShipment 	=	function(){
		$state.go('ovc.manualReceipt-copy',{cmanualid:stateParamId});
	}

	$scope.addsaveReceipt=function(data,orderstatus,qtystatus){
			var asnObj = [];
			$scope.newobj = {};
			$scope.newobj.orderSKU = [];
		if(	!($scope.validatereceipt(data))){
			return false;
		}else{
			var orderReceiptNumber 	=data.receiptNumber;
			var asnObj = data;
			var returnobj = {};
			returnobj.orderData={};
			returnobj.deletedData={};
			orderPackages = [];
			angular.forEach(data.addskuData.productDetails, function(item) {
				angular.forEach(item, function(styleItem, styleId) {
					if(styleItem.skus != undefined){
						angular.forEach(styleItem.skus, function(sItem, sId) {
							var asnobj = {
								lineNumber: parseInt(sItem.lineNumber),
								SKU: sItem.sku,
								qtyStatus:qtystatus,
								//qtyStatus: status,
								qty: sItem.qty,
								productName: sItem.name,
								productDescription: sItem.description,
								producUom: sItem.selectedUOM,
								productCost: sItem.cost,
								productTax: sItem.productTax,
								productVat: sItem.productVat,
								productCode:sItem.productCode,
								//shipToLocation:sItem
								isVat: sItem.taxisVAT,
								totalProductCost: sItem.totalnotax,
								totalProductTax: sItem.totalProductTax,
								totalProductVat: sItem.totalProductVat,
								waist:sItem.waist,
								length:sItem.length,
								size:sItem.size,
								styleColor:sItem.styleColor
								
							};
							if(orderstatus == 'draft' && $scope.action.title   ==  	'edit'){
								if(sItem.changed || !sItem.id){
									$scope.newobj.orderSKU.push(asnobj);
								}
							}else{
								$scope.newobj.orderSKU.push(asnobj);
							}
							var val = JSON.stringify(asnobj);
						});
					}
				});
			
				if(data.receivedDate!= '' && data.receivedDate != undefined){
					if(orderstatus == 'received'){
						$scope.newobj.receivedDate =$filter('dateFormChange')(data.receivedDate);
						$scope.newobj.asnCreated 	=	$scope.newobj.receivedDate;
						$scope.newobj.asnLastModified =	$scope.newobj.receivedDate;
					}else{
						$scope.newobj.expectedDeliveryDate =$filter('dateFormChange')(data.receivedDate);
						$scope.newobj.asnCreated 	=	$scope.newobj.expectedDeliveryDate;
						$scope.newobj.asnLastModified =	$scope.newobj.expectedDeliveryDate;
					} 
				}

				if(data.shipDate!= '' && data.shipDate != undefined){
					$scope.newobj.shipDate =$filter('dateFormChange')(data.shipDate);
				}
				//$scope.newobj.packageStatus	=	qtystatus;	
				orderPackages.push($scope.newobj);
			});
				if($scope.action.title == 'copy'){
					orderReceiptNumber 	=	'';
				}
			 returnobj.orderData = {purchaseOrderType: data.receiptType,
					shipToLocation: data.shipToLocation,
					FromLocation:data.FromLocation,
					vendorId:data.vendorId,
					purchaseOrderNumber: data.order_number,
					erpPurchaseOrder: data.erpOrderNumber,
					asnReferenceNumber:data.asnId,
					asnId:data.asnNumber,			
					numberOfProducts: data.numberOfProducts,
					numberOfSKU: data.numberOfSKU,
					totalPoCost: data.totalPoCost,
					orderNumber: orderReceiptNumber,
					totalPoVAT: data.totalPoVAT,
					totalPoTax: data.totalPoTax,
					PoSubtotal: data.PoSubtotal,
					specialInstructions: data.specialInstructions,
					userId: data.created_by,
					createdBy: data.created_by,
					orderStatus:orderstatus,
					asnStatus:qtystatus,
					orderSKU:$scope.newobj.orderSKU,
					shipDate:$scope.newobj.shipDate,
					receivedDate:$scope.newobj.receivedDate ? $scope.newobj.receivedDate : $scope.newobj.expectedDeliveryDate,
					expectedDeliveryDate:$scope.newobj.expectedDeliveryDate,
					asnCreated : $scope.newobj.asnCreated,
					asnLastModified : $scope.newobj.asnLastModified

				}
			returnobj.deletedData = data.deletedskudata;
				/*****Save on Add Return*****/
			Data.put('/receiptpackage' , {
				data: returnobj
			}).then(function(pkresult) {
					if((pkresult != undefined) && (pkresult.status == "success")){
						if(orderstatus =='draft')
							var output = {"status": "success","message": "Receipt Saved as Draft Successfully"	};
						else
							var output = {"status": "success","message": "Receipt Created Successfully"	};
							Data.toast(output);
							$state.go('ovc.manualReceipt-list');
					}
			});
		}
	};

	//--DraopDown Directive Hide And Show--//
	$scope.drop_change 	= 	function(drapData){
		if (drapData == 'MR_IBT_M') {
			$scope.vendorhide = true;
			$scope.orderfmstore = false;
		}
		if (drapData == 'MR_MAN') {
			$scope.vendorhide = false;
			$scope.orderfmstore = true;
		}
		if (drapData == null) {
			$scope.vendorhide = true;
			$scope.orderfmstore = true;
		}
	};

	$scope.getmanualReceipt();
});
