var app 	=	angular.module('OVCstockApp',[]);

app.controller('replenishmentCtrl',function ($rootScope, $scope,  $state, $http,   $timeout,$controller, ovcDash, Data , Utils){  
	
	var userId 	=	$rootScope.globals['currentUser']['username'];
	
	/* get store or locations from mysql service */
	$scope.getStores = function () {
		//ovcDash.get('apis/ang_getlocations').then(function (results) {	
		Utils.userLocation(1).then(function(results){
			if(results.status=='error'){
				$scope.store_datas = [];
			}else{
				$scope.store_datas = results;
			}
		}, function(error){
			console.log('usernameer Location Error :' + error);
		});
	};
	$scope.getStores();
	$scope.loc='';
	$scope.getlocation = function(loc){
		$scope.loc=loc;
	};
	$scope.scheduler = function(){
		Data.get('/scheduler?location='+$scope.loc).then(function (data) {
			var output={"status":"success","message":"Replenishment job ran successfully..."};
			Data.toast(output);
		});
	};

});


/* Replenishment Rules */

app.controller('replenishmentRulesController',function ($scope,  $state, $http,  $rootScope,  $timeout,$controller, ovcDash, Data, Utils){  
	
	var userId 	=	$rootScope.globals['currentUser']['username'];
	
	$scope.data 		=	{};
	$scope.formData		=	{};
	$scope.showError	=	false;

	/* Get Stores for Store DropDown */
	$scope.getStores = function () {
		//ovcDash.get('apis/ang_getlocations').then(function (results) {	
		Utils.userLocation(1).then(function(results){
			if( ! results.status ){
				$scope.data.store_datas = results;
			}
		}, function(error){
			console.log('User Location Error :' + error);
		});
	};

	$scope.getStores();

	/* Checking Replenishment Rules for Selected Location */

	$scope.getReplenishmentRules	=	function(){
		var locationId				=	$scope.formData.locationId;
		if(locationId != null){
			Data.get('/replenishmentRules/'+locationId).then(function (resultsData) {
				if(resultsData.length > 0){
					$scope.formData				=	resultsData[0];
				}else{
					$scope.formData				=	{};
					$scope.formData.locationId	=	locationId;	
					$scope.formData.backgroundReplenishment	=	true;
				}
			});
		}else{
			$scope.showError	=	true;
		}
		
	};

	/* Saving Replenishment Rules for the Particular Location */
	$scope.saveReplenishmentRules	=	function(){
		if($scope.formData.locationId != null && $scope.formData.backgroundReplenishment){
			$scope.formData['sku']	=	'';
			Data.post('/saveReplenishmentRules', {
                data: {replenishmentRulesData:$scope.formData,locationId:$scope.formData.locationId}
            }).then(function(results) {
            	if(!results.error){
            		var output = {
	                    "status": "success",
	                    "message": "Successfully Saved"
	                };
	                Data.toast(output);
            	}
            });
		}
	};
});