var app=angular.module('OVCstockApp',[]);

app.controller('finditController',function ($rootScope,$scope, $state, $http, $stateParams,  $window, $timeout,$controller,toaster, ovcDash, Data, OVC_CONFIG, FindItConfig, seriveType){  
	
	$scope.getTimes=function(n){
     	return new Array(n);
	};


	//var user_detail=$rootScope.globals['currentUser'];
	//var user_id=user_detail['username'];
	
	$scope.loc = $stateParams.locationId || '';
	$scope.sku = $stateParams.sku || '';
	$scope.deviceId = $stateParams.ovcdid || '';

	//customer details
	$scope.custEmail = $stateParams.custEmail || 'linda.palaza@gmail.com';
	$scope.custFName = $stateParams.custFName || 'Linda';
	$scope.custLName = $stateParams.custLName || 'Palanza';
	$scope.loyaltyID = $stateParams.loyaltyID || 'linda.palaza@gmail.com';

	
	$scope.init = function(){
		
		ovcDash.get('apis/ang_loc_findit?locid='+encodeURIComponent($scope.loc)+'&sku='+$scope.sku).then(function (data) {
			//console.log(data.products);
			$scope.tot_loc_items = 0;

			angular.forEach(data.products, function(pval,pindx) {
				Data.get('/inventories?locationid='+$scope.loc+'&sku='+$scope.sku).then(function (pdata) {
					//console.log(ohdata[0].oh);
					var discrep = pOHval = 'OUT OF STOCK';
					if(pdata[0] != undefined){
						pOHval = pdata[0].oh+' Available';
					}
					pval.OH = pOHval;
				});
			});	

			if(data.locations != undefined || data.locations != ''){
				angular.forEach(data.locations, function(dval,index) {
					Data.get('/inventories?locationid='+dval.locationId+'&sku='+$scope.sku).then(function (ohdata) {
						//console.log(ohdata);
						var discrep = OHval = 'OUT OF STOCK';
						if(ohdata[0] != undefined){
							OHval = ohdata[0].oh+' Available';
						}

						dval.OH = OHval;
						
					});
				});	

				$scope.tot_loc_items = 1;
			}	
			$scope.list = data;
			$timeout(function () {
				$scope.AddtoRecpt = 
				{"retailerId":"defaultRetailer","ovcdid":$scope.deviceId,"ovcsid":$scope.loc,"payload":{"listItems":[{"productId":$scope.sku,"productDesc":$scope.list.products[0].name,"productQty":"1"}]},"ovclid":null};

			}, 1000);
		});

	};

	$scope.closeIpadPop = function(){
		$window.close();
	}

	$timeout(function () {
		$scope.init();
	}, 1000);

	$scope.change_loc = 'none';

	$scope.modalShown = false;

	$scope.toggleModal = function() {
	    $scope.modalShown = !$scope.modalShown;
	  };
	

	// while clicking on pay now will need to call two webservices add to receipt and pickup
	$scope.paynow = function(values){
		var jsonForms = $scope.Pickups(values);
		$scope.postFunction(seriveType.CreatePickup_SERVICE,jsonForms,'ship');

	};

	$scope.paylater = function(values){
		$scope.change_loc = values;

		$(".store_id").text(values);

		var jsonForms = $scope.Pickups(values);
		//console.log(jsonForms); return false;

		$scope.postFunction(seriveType.CreatePickup_SERVICE,jsonForms,'pick');
		
	};

	$scope.Pickups = function(locationId){
		var orderId = Math.random().toString(36).substring(7);
		var consignmentId = orderId+Math.floor((Math.random()*6)+1);

		$scope.customers = {"loyaltyLName":$scope.custLName,"status":"New","email":$scope.custEmail,"retailerId":"defaultRetailer","description":"create a pickup email","locationId":locationId,"loyaltyId":$scope.loyaltyID,"consignmentId":consignmentId,"orderId":orderId,"loyaltyFName":$scope.custFName,"pickupType":2};
	

		var shipJson = {"ovclid":$scope.custEmail,"pickupObj":$scope.customers,"ovcdid":$scope.deviceId,"pickupItemList":[{"quantity":1,"sku":$scope.list.products[0].sku,"basePrice":$scope.list.products[0].price,"totalPrice":$scope.list.products[0].price}],"ovcsid":$scope.loc};

		return shipJson;
	}

	$scope.postFunction = function(serivcePath,obj,type){
		$http.defaults.headers.common['Authorization'] = 'bearer ' + FindItConfig.Authorization;
		
		$http({
		    method: 'POST',
			url: OVC_CONFIG.OVC_SERV_PATH+'json/process/execute/' + serivcePath,
		    data: obj,
		    headers: {
		        'Content-Type': 'application/json'
	    	}}).then(function(result) {
	    		if(type == 'ship'){
	    			var output = {"status":"success","message":"Product added to Receipt"};
	    			Data.toast(output);
					$scope.postFunction(seriveType.AddReceipt_SERVICE,$scope.AddtoRecpt);
	    		}
	    		if(type == 'pick'){var output = {"status":"success","message":"Pickup created successfully"}; $scope.toggleModal(); Data.toast(output);}
				

		          return true;
	       	}, function(error) {
		          //console.log(error);

	           	var output = {"status":"error","message":error.data.message};
				Data.toast(output);

				return false;
	   		});

	    
	}


});

app.directive('resize', function ($window) {

	var iOS = /iPad|iPhone|iPod/.test(navigator.platform);

   return function (scope, element) {
       var w = angular.element($window);
       scope.getWindowDimensions = function () {
           return {
               'h': w.height(),
               'w': w.width()
           };
       };
       scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
           scope.windowHeight = newValue.h;
           scope.windowWidth = newValue.w;

           scope.iOS = iOS;

           var minus_h = 180;
           if(iOS){
           	 minus_h = 150;
           }
           scope.style = function () {
               return {
                   'height': (newValue.h - minus_h) + 'px'
               };
           };

       }, true);

       w.bind('resize', function () {
           scope.$apply();
       });
   }
});

app.directive('modalDialog', function() {
  return {
    restrict: 'E',
    scope: {
      show: '='
      //skus: '='
    },
    replace: true, // Replace with the template below
    transclude: true, // we want to insert custom content inside the directive
    link: function(scope, element, attrs) {
      scope.dialogStyle = {};
      if (attrs.width)
        scope.dialogStyle.width = attrs.width;
      if (attrs.height)
        scope.dialogStyle.height = attrs.height;

      scope.hideModal = function(){
      	scope.show = false;
      }

      scope.$watch('change_loc',function(){
      });
     
    },
    template: "<div class='ng-modal' ng-show='show'><div class='ng-modal-overlay' ng-click='hideModal()'></div><div class='ng-modal-dialog' ng-style='dialogStyle'><div class='ng-modal-close' ng-click='hideModal()'>X</div><div class='ng-modal-dialog-header pop_header'><p>Pick up in <b class='store_id'></b></p></div><div class='ng-modal-dialog-content' ng-transclude></div></div></div>"
    //templateUrl: "views/pop.html"
  };
});