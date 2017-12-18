var vendorGroup = angular.module('vendorGroup', ['roleConfig']);

vendorGroup.factory('VendorGroupService', function($rootScope, Data, ovcDash, roleConfigService, Utils) {
	var factory 	= 	{};
	var loc 		= 	{};
	var user_detail 	= 	$rootScope.globals['currentUser'];
	var id_user 		= 	user_detail['username'];
	var rolePerm 		= 	{};
	var styleInOut 	 	=	{};
	Utils.hierarchylocation().then(function(results){
		angular.forEach(results.hierarchy, function (hierarchydata){
            if(hierarchydata.id){
                loc[hierarchydata.id]     =   hierarchydata.name;
            }
        });
	}, function(error){
		console.log('Hierarchy Location Error', error);
	});
	Utils.roles().then(function(rolesData){
		console.log(rolesData);
		rolePerm 	=	rolesData;
	});
	
	factory.getUniqueID	=	function(length) {
		return Math.random().toString(36).substr(2, length).toUpperCase();
	};

	factory.getvendorstylegroup= function(data){

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
					
				values.totalPrice = 0;
 				if(!productDetails[values.vendor]){

 					productDetails[values.vendor] ={};
					productDetails[values.vendor]['vendorid'] = values.vendorid;
					productDetails[values.vendor]['vendorname'] =values.vendorname;
					productDetails[values.vendor]['carrierCode']=values.carrierCode;
					productDetails[values.vendor]['styles'] ={};
					productDetails[values.vendor]['qty'] = 0;
					productDetails[values.vendor]['no_of_skus'] = 0;
					productDetails[values.vendor]['total'] = 0;
					productDetails[values.vendor]['subtotal'] = 0;
					productDetails[values.vendor]['vat'] = 0;
					productDetails[values.vendor]['tax'] = 0;
					if((values.vendorOrderNumber == '') ||(values.vendorOrderNumber ==undefined) ){
						productDetails[values.vendor]['vendorOrderNumber'] =factory.getUniqueID(10);
					}else{
						productDetails[values.vendor]['vendorOrderNumber'] =values.vendorOrderNumber;
					}
				}

				if ( !productDetails[values.vendor]['styles'][values.style]) {
					productDetails[values.vendor]['styles'][values.style] ={};
					productDetails[values.vendor]['styles'][values.style]['skus'] = [];
					productDetails[values.vendor]['styles'][values.style]['productCode'] = values.style;
					productDetails[values.vendor]['styles'][values.style]['styleDescription'] = values.styleDescription;
					productDetails[values.vendor]['styles'][values.style]['styleColor'] = values.styleColor;
					productDetails[values.vendor]['styles'][values.style]['qty'] = 0;
					productDetails[values.vendor]['styles'][values.style]['total'] = 0;
					productDetails[values.vendor]['styles'][values.style]['subtotal'] = 0;
					productDetails[values.vendor]['styles'][values.style]['vat'] = 0;
					productDetails[values.vendor]['styles'][values.style]['tax'] = 0;
						
				}

				if(values.lineNumber == ''){
					if(key !=0){
						newline = newline2 + 1;
					}else{
						newline = 1;
					}
					values.lineNumber = newline;
				} 
					
				productDetails[values.vendor]['styles'][values.style]['skus'].push(values);
					
			});
			
			angular.forEach(productDetails, function(vendor,vkey){

				var noitems1 = subtotal1 = ovtotal1 = taxvat1 = alltax1 = nosku1=0;
				angular.forEach(vendor["styles"], function(values){
						var noitems2 = subtotal2 = ovtotal2 = taxvat2 = alltax2 = nosku2=0;
					angular.forEach(values.skus, function(value){
						nosku2++;
						noitems2	= 	parseInt(noitems2) 		+	parseInt(value.qty);
						ovtotal2	= 	parseFloat(ovtotal2) 	+ 	parseFloat(value.totalnotax);
						subtotal2	=	parseFloat(subtotal2)	+	parseFloat(value.totalnotax);
						taxvat2		=  	parseFloat(taxvat2)		+	parseFloat(value.totalProductVat);
						alltax2		= 	parseFloat(alltax2)		+	parseFloat(value.totalProductTax);
					});
					values.no_of_skus = 	parseInt(nosku2);
					values.qty		= 	parseInt(noitems2);
					values.total	=	parseFloat(ovtotal2).toFixed(2);
					values.subtotal	=	parseFloat(subtotal2).toFixed(2);
					values.vat		=	parseFloat(taxvat2).toFixed(2);
					values.tax		=	parseFloat(alltax2).toFixed(2);

					nosku1      =   parseInt(nosku1) + parseInt(values.no_of_skus);
					noitems1	= 	parseInt(noitems1) 		+	parseInt(values.qty);
					ovtotal1	= 	parseFloat(ovtotal1) 	+ 	parseFloat(values.total);
					subtotal1	=	parseFloat(subtotal1)	+	parseFloat(values.subtotal);
					taxvat1		=  	parseFloat(taxvat1)		+	parseFloat(values.vat);
					alltax1		= 	parseFloat(alltax1)		+	parseFloat(values.tax);
				});
				vendor.no_of_skus	=	parseInt(nosku1);
				vendor.qty 			=   parseInt(noitems1);
				vendor.total 		=   parseFloat(ovtotal1).toFixed(2);
				vendor.subtotal 	=   parseFloat(subtotal1).toFixed(2);
				vendor.vat   		=   parseFloat(taxvat1).toFixed(2);
				vendor.tax 			=   parseFloat(alltax1).toFixed(2);
			});
		}
		return productDetails;
	};

	factory.getvendordata= function(data){
		var results=data.join(',');
		var  vendorDetails   =  {};
		Data.post('/vendor',{
			data:{
				vendors:results
			}	
		}).then(function (response) {
			vendorDetails.vendors=response;
			return vendorDetails;
		});
	};
	return factory;
});

vendorGroup.controller('vendorGroupCtrl', function($scope, $http, $timeout, $stateParams, $rootScope, Data, ovcDash, $filter, toaster,
ORDERSTATUS, $compile,VendorGroupService) {
	
	if (($scope.vendorhide == true)) {
		var stostore = $scope.shippingstr;
	} else {
		var loc = $scope.po_add.shiptostore;
	}

	
});

vendorGroup.directive('vendorGroup', ['$compile', 'VendorGroupService',  '$rootScope','roleConfigService','$state','Utils', function($compile,VendorGroupService,
$rootScope, roleConfigService, $state, Utils) {
	return {
		restrict: 'E',
		replace: true,
		// scope: false,
		templateUrl: 'modules/vendorGroup/vendorGroup.html',
		link: function (scope, element, attrs) {

			scope.groupdata = {};
			if(attrs.status){
				if(attrs.status 	==	"draft"){
					scope.withoutprint 	=	false;
				}
			}
			else{
				scope.withoutprint 	=	true;
			}
			scope.minmax	=	function (value, min, max){
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

			Utils.configurations().then(function(configData){
				console.log(configData);
				scope.config	=	configData;
				scope.groupdata.roleConfig 	=	configData;
			});
			
        } 	
	};
}]);