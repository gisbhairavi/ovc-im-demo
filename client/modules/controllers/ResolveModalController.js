app.controller('ModalController', function($rootScope,$scope, $state, $stateParams, $timeout, close,QTYREASONCODES, Data) {
	
	$scope.reasonform	 		=	{};
	$scope.reasonform.form	=	{};
	///////Quantity Discrepancies  from config 
    var reasoncodes   = $scope.translation.qty_reasons;
    var configreasons = QTYREASONCODES;
    var configcodes = [];
    angular.forEach(configreasons, function(item) {
        item.label = reasoncodes[ item.code];
        configcodes.push(item);
    });
	
	$scope.reasonform.reasons	=	configcodes;
	
	$scope.close = function(result) {
		close(result, 500); // close, but give 500ms for bootstrap to animate
	};
	
	$scope.resolve	=	function(result){
		var  asnpacks 	= $rootScope.resolvedasn.receivedpacks;
		var  allasns		= $rootScope.resolvedasn.receivedasns;
		var  asndetails	= $rootScope.asn_details['asns'];
		var resolvejson	=	[];
		var skus_to_resolve	=	0;
		
		angular.forEach(asndetails, function(selectedasn){
			var idx	=	allasns.indexOf(selectedasn.asnId);
			if(idx > -1){
				var newobj																=	{};
				newobj.purchaseOrder												=	{};
				newobj.purchaseOrder.purchaseOrderNumber				= 	selectedasn.poId;
				var tmp_obj	=	newobj.purchaseOrder.purchaseOrderAsn		=	{};
				tmp_obj.asnId	=	selectedasn.asnId;
				tmp_obj.purchaseOrderPackage			=	[];
				var asnpackages	=	selectedasn.poAsnpackage;
				angular.forEach(asnpackages, function(selectedpack,key){
					OrderPackage	=	{};
					OrderPackage.packageId						=	key;
					OrderPackage.packageStatus					=	selectedpack.packageStatus;
					OrderPackage.purchaseOrderItem		=	[];
					var pkid	=	asnpacks.indexOf(key);
					if(pkid > -1){	
						var stylelist	=	selectedpack.articles;
						angular.forEach(stylelist, function(selectedstyle){
							if(selectedstyle.receive_discrepancy	==	true){
								var skustoresolve	=	selectedstyle.skus;
								angular.forEach(skustoresolve, function(skudetail){
									if(skudetail.selected){
										skus_to_resolve++;
										var skuobj				=	{};
										skuobj.sku				=	skudetail.sku;
										skuobj.qtyStatus	=	$scope.reasonform.form.reasonCode; 
										if(skudetail.newQty >  skudetail.qty){
											skuobj.qty				=	skudetail.newQty - skudetail.qty ;
										}else{
											skuobj.qty				=	skudetail.qty - skudetail.newQty ;
										}
										skuobj.lineNumber	=	skudetail.lineNumber;
										OrderPackage.purchaseOrderItem.push(skuobj);
									}
									
								});
							}
						});
						
						tmp_obj.purchaseOrderPackage.push(OrderPackage);
					}
				});
				resolvejson.push(newobj);
			}
		});
		
		if(skus_to_resolve > 0){
				
			if($scope.reasonform.form.reasonCode){
				var jsonStr	=	JSON.stringify(resolvejson);
				$scope.resolveAsnPackage('/receivingpurchasejson', jsonStr);
			}else{
				var output = {
					"status": "error",
					"message": "Please Select Reason for the Missing Quantity"
				};
				Data.toast(output);
			
			}
		}else{
			var output = {
				"status": "error",
				"message": "Please Select atleast one Sku having Discrepancy to Resolve"
			};
			Data.toast(output);
		}
			
	};
	
	$scope.resolveAsnPackage	=	function(uploadUrl, jsonStr) {

		var obj = {"data" : {"uploaded_file" : jsonStr, "type" : "json"}};
		Data.post(uploadUrl, obj)
		.then(function(success){
			if(success){
				if (success.status == "success") {
					var output = {
						"status": "success",
						"message": "Selected Skus Resolved Successfully"
					};
					//$state.reload();
					$state.transitionTo($state.current, $stateParams, {
					    reload: true,
					    inherit: false,
					    notify: true
					});
					Data.toast(output);
				}
				else{
					var output = {
							"status": "error",
							"message": "Error with Resolving Skus"
					};
					Data.toast(output);
				}
			}
		},function(error){});
	}; 
	
}); 