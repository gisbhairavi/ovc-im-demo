var styleGroup = angular.module('styleGroup', ['roleConfig']);

styleGroup.factory('StyleGroupService', function($rootScope, $q, Data, ovcDash, roleConfigService , Utils) {
	var factory 	= 	{};
	var loc 		= 	{};
	var user_detail 	= 	$rootScope.globals['currentUser'];
	var id_user 		= 	user_detail['username'];
	var rolePerm 		= 	{};
	var styleInOut 	 	=	{};
	var storeInvDataIBM =	{};
	Utils.hierarchylocation().then(function(results){
		angular.forEach(results.hierarchy, function (hierarchydata){
            if(hierarchydata.id){
                loc[hierarchydata.id]     =   hierarchydata.name;
            }
        });
	}, function(error){
		console.log('Hierarchy Location Error :' + error);
	});

	factory.getInvData= function(data){

		var deferred = $q.defer();
		var storeInvData = {};

		storeInvData[data.toStore] = {};
		storeInvData[data.fromStore] = {};

		Data.get('/inventories?locationid='+ encodeURIComponent(data.toStore)+'&sku='+data.skus.join()).then(function (inventryData) {

            if(inventryData != '' && inventryData.error == undefined){
                angular.forEach(inventryData,function(instore){
                    angular.forEach(instore.storevalue,function(store){
                        if(data.toStore in loc){
                            storeInvData[data.toStore][instore.sku]  =    store.ats;
                        }else{
                        	storeInvData[data.toStore][instore.sku]  =    0;
                        }
                    });
                });
            }else{
            	storeInvData[data.toStore][data.sku]  =    0;
            }

            Data.get('/inventories?locationid='+ encodeURIComponent(data.fromStore)+'&sku='+data.skus.join()).then(function (inventryData) {

                if(inventryData != '' && inventryData.error == undefined){
                    angular.forEach(inventryData,function(instore){
                        angular.forEach(instore.storevalue,function(store){
                            if(data.fromStore in loc){
                                storeInvData[data.fromStore][instore.sku]  =    store.ats;
                            }else{
                				storeInvData[data.fromStore][instore.sku]  =    0;
            				}
                        });
                    });
            	}else{
                	storeInvData[data.fromStore][data.sku]  =    0;
            	}
            	storeInvDataIBM = storeInvData;
            	deferred.resolve();
        	});   
        });
        return deferred.promise;
	}

	factory.getstylegroup= function(data, upload){

			var  productDetails   =  {};
			var newline=0;
			
			var userLocation 	=	{};
			
		if(data != undefined){
				var linedetails = [];
			angular.forEach(data, function(values,key){
				if(values.lineNumber != ''){
					linedetails.push(values.lineNumber);
				}
			});

			var newline2=Math.max.apply(Math,linedetails);
			angular.forEach(data, function(values,key){
					// values.totalPrice = 0;
					if(!values.style){
						values.style 	=	values.productCode;
						values.description 	=	values.productName;
						/**For shipped quantity shown in qty field**/
						var qty 	=	values.qty;

						// if(values.qtyStatus){
						// 	if(values.qtyStatus.shipped){
						// 		qty 	=	values.qtyStatus.shipped;
						// 	}
						// }
						
						/*for cost changes*/
						if(values.skuCostAsn){
							values.totalPrice	=	parseFloat((qty) * parseFloat(values.skuCostAsn)).toFixed(2);
						}else if(values.skuCostConfirm){
							values.totalPrice	=	parseFloat((qty) * parseFloat(values.skuCostConfirm)).toFixed(2);
						}else{
							values.totalPrice	=	parseFloat((qty) * parseFloat(values.skuCost)).toFixed(2);
						}
					}
					if(values.orderType      ==  'IBT_M'){
						if (upload) {
							if (storeInvDataIBM && storeInvDataIBM[values.toStore] && storeInvDataIBM[values.toStore][values.sku])
								values.to_store_ats = storeInvDataIBM[values.toStore][values.sku];
							else
								values.to_store_ats = 0;
							if (storeInvDataIBM && storeInvDataIBM[values.fromStore] && storeInvDataIBM[values.fromStore][values.sku])
								values.from_store_ats = storeInvDataIBM[values.fromStore][values.sku];
							else
								values.from_store_ats = 0;
						}
						else {
	                        Data.get('/inventories?locationid='+ encodeURIComponent(values.toStore) +'&sku='+values.sku).then(function (inventryData) {
	                            if(inventryData != '' && inventryData.error == undefined){
	                                angular.forEach(inventryData,function(instore){
	                                    angular.forEach(instore.storevalue,function(store){
	                                        if(values.toStore in loc){
	                                            values.to_store_ats  =    store.ats;
	                                        }else{
				                            	values.to_store_ats  =    0;
				                            }
	                                    });
	                                });
	                            }else{
	                            	values.to_store_ats  =    0;
	                            }

	                            Data.get('/inventories?locationid='+ encodeURIComponent(values.fromStore) +'&sku='+values.sku).then(function (inventryData) {
	                                if(inventryData != '' && inventryData.error == undefined){
	                                    angular.forEach(inventryData,function(instore){
	                                        angular.forEach(instore.storevalue,function(store){
	                                            if(values.fromStore in loc){
	                                                values.from_store_ats    =   store.ats;
	                                            }else{
	                                				values.from_store_ats  =    0;
	                            				}
	                                        });
	                                    });
	                            	}else{
	                                	values.from_store_ats  =    0;
	                            	}
	                        	});   
	                        });
	                    }
                        if((values.fromStore in loc) && (values.toStore in loc)){
                        	if($rootScope.rolePerm.viewFrom == true){
                        		values.inOutBoundFrom 			=	true;
                        		styleInOut.stlinOutBoundFrom 	= 	true;

                        	}else{
                        		values.inOutBoundFrom 			=	false;
                        		styleInOut.stlinOutBoundFrom 	= 	false;
                        	}
                        	if($rootScope.rolePerm.viewTo 	==	true){
                        		values.inOutBoundTo 		=	true;
                        		styleInOut.stlinOutBoundTo 	= 	true;

                        	}else{
                        		values.inOutBoundTo 		=	false;
                        		styleInOut.stlinOutBoundTo 	= 	false;
                        	}
                        }
                        if((values.toStore in loc) && !(values.fromStore in loc)){
                        	if($rootScope.rolePerm.viewFrom == true){
                        		values.inOutBoundFrom 			=	true;
                        		styleInOut.stlinOutBoundFrom 	= 	true;
                        	}else{
                        		values.inOutBoundFrom 			=	false;
                        		styleInOut.stlinOutBoundFrom 	= 	false;
                        	}
                        	if($rootScope.rolePerm.viewTo 	==	true){
                        		values.inOutBoundTo 		=	true;
                        		styleInOut.stlinOutBoundTo 	= 	true;
                        	}else{
                        		values.inOutBoundTo 		=	false;
                        		styleInOut.stlinOutBoundTo 	= 	false;
                        	}
                        }
                    }
					if ( !productDetails[values.style]) {
						productDetails[values.style] ={};
						productDetails[values.style]['styleId']=values.style;
						productDetails[values.style]['skus'] = [];
						productDetails[values.style]['styleats'] ={};
						productDetails[values.style]['productCode'] = values.style;
						productDetails[values.style]['styleDescription'] = values.styleDescription;
						productDetails[values.style]['styleColor'] = values.styleColor;
						productDetails[values.style]['qty'] = 0;
						productDetails[values.style]['total'] = 0;
						productDetails[values.style]['subtotal'] = 0;
						productDetails[values.style]['vat'] = 0;
						productDetails[values.style]['tax'] = 0;
							
					}
	

					if(values.lineNumber == ''){
						if(key !=0){
							newline = newline2 + 1;
						}else{
							newline = 1;
						}
						
						values.lineNumber = newline;
					} 
					
					productDetails[values.style]['skus'].push(values);
					if(styleInOut){
						productDetails[values.style]['styleats'] 	=	styleInOut;
					}
					
			});
			
			angular.forEach(productDetails, function(values){
					var noitems2 = subtotal2 = ovtotal2 = taxvat2 = alltax2 = 0;
				angular.forEach(values.skus, function(value){
					
					noitems2	= 	parseInt(noitems2) 		+	parseInt(value.qty);
					ovtotal2	= 	parseFloat(ovtotal2) 	+ 	parseFloat(value.totalnotax);
					subtotal2	=	parseFloat(subtotal2)	+	parseFloat(value.totalnotax);
					taxvat2		=  	parseFloat(taxvat2)		+	parseFloat(value.totalProductVat);
					alltax2		= 	parseFloat(alltax2)		+	parseFloat(value.totalProductTax);
				});
				values.qty		= 	parseInt(noitems2);
				values.total	=	parseFloat(ovtotal2).toFixed(2);
				values.subtotal	=	parseFloat(subtotal2).toFixed(2);
				values.vat		=	parseFloat(taxvat2).toFixed(2);
				values.tax		=	parseFloat(alltax2).toFixed(2);
			});

		// });
		}
		return productDetails;
	};


	factory.getrplstylegroup= function(data){

		var productDetails = factory.getstylegroup(data);
		var stylegroup = [];
		// var skugroup = [];
		
		angular.forEach(productDetails, function(values,key){
			stylegroup.push(values);
		});
			return stylegroup;
	};

	factory.getrplskugroup= function(data){

		var productDetails = factory.getstylegroup(data);	
		var skugroup = [];
		
		angular.forEach(productDetails, function(values,key){

				var noitems2 = subtotal2 = ovtotal2 = taxvat2 = alltax2 = 0;
			angular.forEach(values.skus, function(skudata){
				skugroup.push(skudata);
			});

		});
			return skugroup;
	};

	return factory;
});

styleGroup.controller('styleGroupCtrl', function($scope, $http, $timeout, $stateParams, $rootScope, Data, ovcDash, $filter, toaster,
ORDERSTATUS, $compile,StyleGroupService) {
	
	if (($scope.vendorhide == true)) {
		var stostore = $scope.shippingstr;
	} else {
		var loc = $scope.po_add.shiptostore;
	}
	
});

styleGroup.directive('groupedStyle', ['$compile', 'StyleGroupService',  '$rootScope','roleConfigService','$state','Data','Utils', function($compile,StyleGroupService,
$rootScope, roleConfigService, $state, Data , Utils) {
	return {
		restrict: 'E',
		replace: true,
		// scope: false,
		// templateUrl: 'modules/styleGroup/styleGroup.html',
		link: function (scope, element, attrs) {
			/*****Enable and Disable based on Permission******/
			if(attrs.status){
				if(attrs.status ==	'draft'){
					scope.printclass 	=	false;
				}
			}else{
				scope.printclass 	=	true;
			}
			
			scope.endisable=function(){
				scope.vwpuprice 	=	false;
				$rootScope.$watch('ROLES',function(){
					var role_det=$rootScope.ROLES;
					angular.forEach(role_det, function(roles,key) {
						if (key== 'purchasePrice'){
							if((roles.viewpurchasePrice == 1) ){
								scope.vwpuprice 	=	true;
							}
						}
					});
				});
				scope.puprice 	=	true;
				scope.shprice 	=	true;
				$rootScope.$watch('POLIST',function(){
					var confg_det=$rootScope.POLIST;
					if(confg_det != undefined && confg_det != ""){
						angular.forEach(confg_det, function(corder,key) {
							if(corder.elementid == "hideTax"){
								if(corder.elementdetail == 1){
									scope.puprice 	=	false;
								}
							}
							if(corder.elementid == "hidePurchasePrice"){
								if(corder.elementdetail == 1){
									scope.shprice 	=	false;
								}
							}
						});
					}
				});
			}
			scope.endisable();
			Utils.configurations().then(function(configData){
				scope.config 	=	configData;
			});

			var stateName 	=	$state.current.name;
			if(stateName ==	'ovc.transfer-add'|| stateName == 'ovc.viewtransfers-summary' || stateName == 'ovc.transfer-edit' || stateName == 'ovc.transfer-copy'){
				scope.viewstorestyle 	=	true;
				scope.transfers 	=	true;
				scope.purchaseorders 	=	false;
			}
			if($state.current.name == 'ovc.adjustment-summary'){
				scope.adjsummary= true;
				scope.getarrayif= true;
			}
			else{
				scope.getarrayif= false;
			}

			scope.minmax    =   function (value, min, max){

	            if(parseInt(value) > parseInt(max)){
	                return max;  
	            }else{
	                return value;
	            }
		    };

			scope.isEmpty = function(obj) {
			  	var skuscount	=	0;
			  	angular.forEach(obj, function(values,key){
					angular.forEach(values.skus, function(value){
							skuscount++;
					});
				});

			  	if(skuscount >0){
			  		return false;
			  	}
			  return true;
			};
			scope.isEmptypagination = function(arr){
				if(arr.length > 0)
					return false;
				return true;
			};

		    scope.decrease = function(index,skuqty,skustyle){
		    		
                    var baseqty = (scope.skuRoundvalue && scope.skuRoundvalue[scope.skuslist[skustyle].skus[index].sku]?scope.skuRoundvalue[scope.skuslist[skustyle].skus[index].sku]:1);
		            scope.skuslist[skustyle].skus[index].qty = scope.skuslist[skustyle].skus[index].qty - baseqty;

		    };

		    scope.increase = function(index,skuqty,skustyle){
                    var baseqty = (scope.skuRoundvalue && scope.skuRoundvalue[scope.skuslist[skustyle].skus[index].sku]?scope.skuRoundvalue[scope.skuslist[skustyle].skus[index].sku]:1);
		            scope.skuslist[skustyle].skus[index].qty = scope.skuslist[skustyle].skus[index].qty + baseqty;
		    };

		    scope.idminmax = function (value, min, index, skustyle){

		            if(parseInt(value) < min || isNaN(value)) {
		                scope.skuslist[skustyle].skus[index].qty = min;
		            }
		            else{
		                scope.skuslist[skustyle].skus[index].qty = value;
		            }
		    };

		    scope.checkqtyempty    =   function(skuqty){

		            if(skuqty == '' || skuqty == undefined){
		                var output = {
		                    "status": "error",
		                    "message": "Quantity is empty. Please enter the value."
		                };
		                Data.toast(output);
		            }
		    };

		    scope.outdecrease  = function(index,skustyle){

		    	if(scope.skuslist[skustyle].skus[index].confirm_qty == undefined){

		    		scope.skuslist[skustyle].skus[index].confirm_qty = 0;
		    	}

		    	scope.skuslist[skustyle].skus[index].confirm_qty = scope.skuslist[skustyle].skus[index].confirm_qty - 1;


		    };


		    scope.outincrease  = function(index,skustyle){

		    	if(scope.skuslist[skustyle].skus[index].confirm_qty == undefined){

		    		scope.skuslist[skustyle].skus[index].confirm_qty = 0;

		    	}
		    		scope.skuslist[skustyle].skus[index].confirm_qty = scope.skuslist[skustyle].skus[index].confirm_qty + 1;
		    };

		    scope.outboundminmax = function(value, min, max, index,skustyle){

		    	if(parseInt(value) < min || isNaN(value)){

					scope.skuslist[skustyle].skus[index].confirm_qty = min;
		    	}
		    	else if(parseInt(value) > parseInt(max)){

		             scope.skuslist[skustyle].skus[index].confirm_qty = max;  
		        }
		        else{

		            scope.skuslist[skustyle].skus[index].confirm_qty = value;
		        }
		    };
			
        },
        templateUrl: function(elem, attrs) {
           return attrs.templateUrl ? attrs.templateUrl : 'modules/styleGroup/styleGroup.html'
       }
		
	};
}]);
