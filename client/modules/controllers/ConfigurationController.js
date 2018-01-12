var app = angular.module('OVCstockApp', ['ui.bootstrap.treeview','roleConfig', 'Utils']);

 /*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module		:       IM Configurations   
*
*    Developer	:       Sivaraman
*
*    Date			:       03/02/2016
*
*    Version		:        1.0
*
**********************************************************************/

app.controller('getConfig', function($rootScope, $scope, $state, $http,  $timeout, Data, ovcDash, TreeViewService, ADVANCESEARCHFIELDS, ADJUSTMENTSTATUS, REPLENISHMENTREORDERTYPE, RETURN_STATUS_TO_EXPORT, Utils, INV_BLNC_EXPORT, $stateParams,REPLENISHMENTROUNDING) {
	
	var user_detail								=	$rootScope.globals['currentUser'];
	var id_user									=	user_detail['username'];
	$scope.action								=	{};
	$scope.ship									=	{};
	$scope.configdata							=	{};
	$scope.configdata.config_arr				=	[];
	$scope.configdata.feature_group				=	[];
	$scope.form									=	{};
	$scope.configdata.dropData 					=	{};
	$scope.getStores = function() {
		Utils.hierarchylocation().then(function(results){
			$scope.storeLocData	=	TreeViewService.getLocData(results);
            TreeViewService.toggleAll($scope.storeLocData[0]);
			TreeViewService.selectNode($scope.storeLocData[0]);
			$scope.locationDisplayName	=	$scope.storeLocData[0].name;
			$scope.ship.locationId		=	$scope.storeLocData[0].id;
			$scope.getconfig();
		});
	};
	
	$scope.getStores();
	var params 	=	[];
	if($stateParams && $stateParams.group){
		params 	=	$stateParams.group.split(',');
	}
	//Constructing adjustment status dropdown data from config
	var statusObj	=	{};
	var adjStatusList     =   $scope.translation.adjstatuslist[0];
	if (adjStatusList) {
		angular.forEach(ADJUSTMENTSTATUS, function(item) {
			statusObj[item.code] = adjStatusList[item.code];
	    });
	}

	Utils.roles().then(function(rolesData){
        $scope.rolePerm     =   rolesData;
    });

	//Constructing export balance type dropdown data from config
	var balanceObj	=	{};
	var expBalanceList	=   $scope.ovcLabel.configurations.exportBalanceTypes
								? $scope.ovcLabel.configurations.exportBalanceTypes
								: $scope.translation.exportBalanceTypes;
	if (expBalanceList) {
		angular.forEach(INV_BLNC_EXPORT, function(item) {
			balanceObj[item.code] = expBalanceList[item.code];
	    });
	}

    $scope.configdata.dropData['adjustmentExportStatuses'] = statusObj;
    $scope.configdata.dropData['exportBalanceTypes'] = balanceObj;
    $scope.configdata.dropData['replenishmentReorderType'] = REPLENISHMENTREORDERTYPE;
    $scope.configdata.dropData['returnExportStatuses'] = RETURN_STATUS_TO_EXPORT;
    $scope.configdata.dropData['replenishmentRoundingQty'] = REPLENISHMENTROUNDING;


	var featureGroup 	=	[];
	$scope.dashConfigCall 		=	function(callback){
		$scope.lookuparray 			=	[];
		var property 		=	'';
		var paramCondition 	=	_.indexOf(params, "globals") > -1 || _.indexOf(params, "stockBalanceReport") > -1 || _.indexOf(params, "stockLookUpProductAttribute") > -1 || _.indexOf(params, "stockLookUpProductProperty") > -1
		if(paramCondition){
			ovcDash.get('apis/ang_config_properties?type='+'valuess'+'&propertyvalue='+property+'&variantstype='+'&productProperty='+true+'&productAttribute='+true).then(function (results) {
	         	if(results && results.status != "error"){
	          	    var configrationData  		=	results;
					angular.forEach(configrationData,function(value,key){
						var lookupProductProperty 			=	{};
						var stockbalanceReport 				=	{};
						if(key == 'productAttribute'){

							lookupProductProperty.featureGroup 	=	'stockLookUpProductAttribute';
							lookupProductProperty.featureName 	=	'Stock LookUp Product Attribute'
						}
						if(key == 'productProperty'){
								lookupProductProperty.featureGroup 	=	'stockLookUpProductProperty';
								lookupProductProperty.featureName 	=	'Stock LookUp Product Property';
								if(_.indexOf(params, "stockBalanceReport") > -1){
									stockbalanceReport.featureGroup 	=	'stockBalanceReport';
									stockbalanceReport.featureName 		=	'Stock Balance Report Product Property';
									featureGroup.push(stockbalanceReport.featureGroup);
								}
								
								

						}
						if(_.indexOf(params, "stockLookUpProductAttribute") > -1 || _.indexOf(params, "stockLookUpProductProperty") > -1)
						featureGroup.push(lookupProductProperty.featureGroup);
						lookupProductProperty.applicationId 		=	'SAR';
						lookupProductProperty.defaultValue 			=	[];
						lookupProductProperty.featureType 			=	'dropdown';
						lookupProductProperty.moduleId 				=	'stockModule';
						lookupProductProperty.isPublic				=  	'1',
			       		lookupProductProperty.parentFeatureId		=  	'',
			       		lookupProductProperty.fileName 				=	'posMClient/sar.ovccfg',
			       		lookupProductProperty.visibilityExpression 	=	'',
						lookupProductProperty.displaySeqNumber 		=	'',
						lookupProductProperty.featureDescription 	= 	'',
						lookupProductProperty.featureId 			=	key;
						lookupProductProperty.locationOrGroupId 	=	$scope.ship.locationId;
						if(key == 'productProperty'){
							if(_.indexOf(params, "stockBalanceReport") > -1){
								stockbalanceReport.applicationId 			=	'SAR';
								stockbalanceReport.defaultValue 			=	[];
								stockbalanceReport.featureType 				=	'dropdown';
								stockbalanceReport.moduleId 				=	'stockModule';
								stockbalanceReport.isPublic					=  	'1',
					       		stockbalanceReport.parentFeatureId			=  	'',
					       		stockbalanceReport.fileName 				=	'posMClient/sar.ovccfg',
					       		stockbalanceReport.visibilityExpression 	=	'',
								stockbalanceReport.displaySeqNumber 		=	'',
								stockbalanceReport.featureDescription 		= 	'',
								stockbalanceReport.featureId 				=	'Balance' + key;
								stockbalanceReport.locationOrGroupId 		=	$scope.ship.locationId;
								var temp 	=	[];
								angular.forEach(value, function(provalue,prokey){
									// $scope.configdata.dropData[key][provalue.propertyId] 	=	provalue.propertyName;
									temp.push(provalue.propertyId);
								});
								stockbalanceReport.defaultValue 	=	temp;
							}
						}
						$scope.configdata.dropData[key] 			=	{};
						$scope.configdata.dropData['BalanceproductProperty'] =	{};

						var featurevalue 							=	[];
						angular.forEach(value, function(provalue,prokey){
							$scope.configdata.dropData[key][provalue.propertyId] 	=	provalue.propertyName;
							featurevalue.push(provalue.propertyId);
						});
						lookupProductProperty.defaultValue 	=	featurevalue;
						// stockbalanceReport.defaultValue 	=	featurevalue;

						$scope.lookuparray.push(lookupProductProperty);
						$scope.lookuparray.push(stockbalanceReport);
					});
					$scope.configdata.dropData['selectedProductVariants'] 	=	$scope.configdata.dropData['productAttribute'] ;
					$scope.configdata.dropData['BalanceproductProperty'] 	=   $scope.configdata.dropData['productProperty'];

					if($scope.lookuparray.length > 0){
						callback(true);
					}
				}else{
					callback(true);
				}
	     	});
		}else{
			callback(true);
		}
	};

	

	$scope.getconfig	=	function(){
		$scope.dashConfigCall(function(retunCall){
			if(retunCall){
				Data.get('/config?locationId=' + encodeURIComponent($scope.ship.locationId)+'&featureGroup='+params).then(function(data) {
					if((data.config_arr != undefined) && (data.featureGroup != undefined)){
						var featureIdArray 	=	data['featureId'];
						var config_Array 	=	data['config_arr'] ;
						var Group_Array 	=	data['featureGroup'];
						angular.forEach($scope.lookuparray, function(lookupData,key){
							if(featureIdArray.indexOf(lookupData.featureId)==-1){
								config_Array.push(lookupData);
							}
						});
						angular.forEach(featureGroup, function(groupData){
							if(Group_Array.indexOf(groupData)==-1){
								Group_Array.push(groupData);
							}
						});
						$scope.configdata.config_arr			=	config_Array;
						if($scope.configdata.config_arr.length == 0){
							$scope.showError 			=	true;
						}
						$scope.configdata.feature_group			=	Group_Array;
						$timeout(function() {
					        	$('.example-getting-started').multiselect({numberDisplayed:1});
						}, 5);
					}
					var obj 	=	{};
						angular.forEach($scope.configdata.feature_group, function(group){
							// obj[group] 	=	{};
							angular.forEach($scope.configdata.config_arr, function(val,key){
								var temp 	=	'"'+group+'.'+val.featureId+'"'
								if(val.featureGroup == group){
								obj[temp] 	=	val.featureName;

								}
							});
						});

				});
			}	
		});
	} 
	$scope.modifiedValueUpdate 	=	function(config){
		var tempData 	=	config.featureValue ? config.featureValue : config.defaultValue;
		if(Array.isArray(tempData)){
			if(tempData.length != config.modifiedValue.length){
				config.modified 	=	true;
			}else{
				config.modified 	=	false;
			}
		}else{
			if(tempData != config.modifiedValue){
				config.modified 	=	true;
			}else{
				config.modified 	=	true;
			}
		}
	};
	$scope.DataConstruct 	=	function(qtyPo){
		// detail.modifiedValue = detail.featureValue ? detail.featureValue : detail.defaultValue;
		if(qtyPo.lastModified != qtyPo.created){
			qtyPo.modifiedValue 	=	(qtyPo.featureValue)? qtyPo.featureValue : [];
		}else{
			qtyPo.modifiedValue 	=	(qtyPo.featureValue)? qtyPo.featureValue : qtyPo.defaultValue;
		}

	}

	$scope.searchLocation = function(){
        $scope.action.filterLocation    =   $scope.locationDisplayName;
    };
	
	$scope.saveConfig	=	function(){
		Data.post('/config/'+ $scope.ship.locationId,{data:{configData:$scope.configdata.config_arr}}).then(function(data) {
			if(data.status	==	"success"){
				$scope.getconfig();
				var output={"status":"success","message":"Configuration Updated Successfully"};
				Data.toast(output);
                localStorage.removeItem('configuration');
                $timeout(function(){
                	Utils.configurations();
                }, 500);
				// $state.reload();
			}
		});
	};
	
	$scope.resetConfig	=	function(){
		
		$.confirm({
			title: 'Confirm Reset!',
			content: 'Are you sure you want to reset to default values?',
			confirmButtonClass: 'btn-primary',
			cancelButtonClass: 'btn-primary',
			confirmButton: 'Ok',
			cancelButton: 'Cancel',
			confirm: function () {
				Data.delete('/resetToDefaultConfig/'+ $scope.ship.locationId).then(function(data) {
					if(data.status	==	"success"){
						var output={"status":"success","message":"Configuration values Reset to Default Successfully"};
						Data.toast(output);
						$scope.getconfig();
					}
				});
			},
			cancel: function () {
				return false;
			}
		
		});
		return false;
	};
	
	var def_val 	= 	[];
	var fet_val 	= 	[];

	var removeHash 	=	function (arrData) {
		arrData = angular.fromJson(angular.toJson(arrData));
		return arrData;
	}

	$scope.initValue = function (modifiedValue, seletedValue, index) {
		var seleted_val	= 	seletedValue || $scope.defaultValue;
		if (seletedValue == '') {

			angular.copy($scope.configdata.config_arr[index].defaultValue, def_val);
			angular.copy($scope.configdata.config_arr[index].featureValue, fet_val);

			angular.forEach(modifiedValue, function(obj){

				if (obj.value == '1') {
					$scope.defaultValue 	= 	obj.name;
					// $scope.selected = obj.name;
					$scope.modifiedValue1 	= 	modifiedValue;
				}

			});

			$scope.configdata.config_arr[index].modifiedValue 	= 	removeHash(modifiedValue);
			$scope.configdata.config_arr[index].defaultValue 	=	removeHash(def_val);
			$scope.configdata.config_arr[index].featureValue 	=	(fet_val.length != 0) ? removeHash(fet_val) : '';
		}
		else {
			angular.forEach(modifiedValue, function(obj){

				if (obj.name == seleted_val) {
					obj.value 	= 	'1';
				}

				else {
					obj.value 	= 	'0';
				}

			})
			$scope.configdata.config_arr[index].modifiedValue 	= 	removeHash(modifiedValue);
			$scope.configdata.config_arr[index].defaultValue 	=	removeHash(def_val);
			$scope.configdata.config_arr[index].featureValue 	=	(fet_val.length != 0) ? removeHash(fet_val) : '';
			$scope.modifiedValue1 	= 	modifiedValue;
		}
	}

});
