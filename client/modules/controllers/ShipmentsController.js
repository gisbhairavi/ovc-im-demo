var app = angular.module('OVCstockApp', ['angularValidator','autocomplete']);

app.controller('MyCtrl', function($scope,$state,$timeout,ovcDash,UOM,system_settings,Data,system_currencies){

  $scope.doSomething = function(typedthings){
	
	if(typedthings != '...'){
		var loc_id=$scope.ship.locationId;
				ovcDash.get('apis/ang_loc_products?srch='+typedthings+'&locid='+encodeURIComponent(loc_id)).then(function (data) {
					
					if(data.status != 'error'){
						var rows = [];
						var allvals = [];
						angular.forEach(data,function(item) {
							rows.push(item.ProductTbl.sku+'~'+item.ProductTbl.name+'~'+item.ProductTbl.barCode);
							allvals.push(item.ProductTbl);
						});
						
						$scope.transactions = rows;
						$scope.allvalues = allvals;
					
					}	
				});
	}
  }
  
	$scope.myCustomValidator = function(text){		
		return true;
	};

  $scope.doSomethingElse = function(suggestion){
	var selects = suggestion.split('~');
	$scope.ship = {locationId: $scope.ship.locationId, transactionTypeId: $scope.ship.transactionTypeId, documentTypeId: $scope.ship.documentTypeId,
	result:suggestion};
	
  }
  
	$scope.listPROD = [];$scope.list=[];
	/* list the locations based on store selected */
	$scope.addShipments = function (values) {
		
		if((($scope.ship.transactionTypeId == undefined) ||($scope.ship.transactionTypeId == '')) &&
		(($scope.ship.documentTypeId ==  undefined) || ($scope.ship.documentTypeId == ''))){
			$scope.fieldsrequired=true;
		
		}else{
		
				if($scope.allvalues != undefined){
						
					angular.forEach($scope.allvalues, function(sval,index) {
						var vresult=values.result.split('~');
						if(sval.sku == vresult[0]){
							$scope.listPROD.push({
								productCode : sval.sku, name : sval.name, productid:sval.id,
								locationid: $scope.ship.locationId, transtypeid: $scope.ship.transactionTypeId,
								docutypeid: $scope.ship.documentTypeId
							});
						}
					});
					
					$scope.transactions = [];
					$scope.ship = {locationId: $scope.ship.locationId, transactionTypeId: $scope.ship.transactionTypeId,documentTypeId: $scope.ship.documentTypeId, result:''};
					$scope.prod_result = "";
					$timeout(function () { $scope.fillTableElements($scope.listPROD); }, 500);	
				}else{
					return false;
				}
				
		}
	};
	
	$scope.fillTableElements = function (data) {
		$scope.loadval = 0;
		$scope.list = data;
		$scope.currentPages = 1; //current page
		$scope.entryLimits = 10; //max no of items to display in a page
		$scope.filteredItems = $scope.list.length; //Initially for no filter  
    }
	
	
	$scope.cancel_transaction=function(){
		$state.reload();
	}
	
	/* delete tr from table after adding products */
	$scope.removeRow = function (idx) {
		if(idx != -1) {
			$scope.list.splice(idx, 1);
		}
	};
	
	$scope.shipm = $scope.listPROD;
	/* delete tr from table after adding products */
	$scope.moveShipments = function (datas) {
		
	    var newshipments=[];
		angular.forEach(datas, function(item) {
			
			if(item.StockingLocationId != undefined){
				var stklid=item.StockingLocationId;
			}else{
				var stklid='';
			}
			
			var dataobj={
				transtypeid:item.transtypeid,
				stocklocationid:stklid,
				locationid:item.locationid,
				stockUOM:item.selectedUOM,
				quantity:item.qty,
				cost:item.cost,
				warehouseid :item.locationid,
				sku:item.productCode,
				directivetype:item.docutypeid
			}
			
			newshipments.push(dataobj);
		});
		
		
		var newobj=JSON.stringify(newshipments);
		
		if(newshipments != undefined){
			for(i=0;i<newshipments.length;i++){
				
				Data.put('/invtransactionservice', {
					data:newshipments[i]
				}).then(function (results) { 
					
					if((results[0] != undefined) && (results[0].__v ==0)){
						
						var output={"status":"success","message":"Transaction Completed Successfully"};
						Data.toast(output);
					}else if((results!= undefined) && (results.ok ==1)){
						
						var output={"status":"success","message":"Transaction Completed Successfully"};
						Data.toast(output);
					}else if((results!= undefined) && (results.error !=undefined)){
						
						var output={"status":"error","message":"Transaction Failed"};
						Data.toast(output);
					}
					else{
						
						var output={"status":"success","message":"Transaction Completed Successfully"};
						Data.toast(output);
					}
					
				});
			}  
		
			$state.reload();
			
		}
		
	};
	
	$scope.uomservice=function(){
			Data.get('/uom').then(function (results) {
					var uomdatas = [];
				angular.forEach(results, function(values) {
					if((values.isActive) && (values.uomId != undefined) &&(values.uomId != '') && (values.description != undefined) &&(values.description != '')){
						var newobj={
						name:values.description,
						id:values.uomId
						} 
						uomdatas.push(newobj);
							
					}
				});
				
				$scope.UOM= uomdatas;
			});
	}
	
	$scope.uomservice();
	
	
	var currensymbs= $scope.translation.currencylist[0];
	var currcodes=system_currencies[0];
	
	$scope.currency = currensymbs[currcodes.code];
	
	
	$scope.getdirective=function(){
	
		$scope.ship.transactionTypeId="";
		 $scope.fieldsrequired=false;
	}
	
	$scope.gettransaction=function(){
	
		$scope.ship.documentTypeId="";
		$scope.fieldsrequired=false;
	}
	
	$scope.parent_loc_datas = [];
	$scope.getparent_datas = function (values) {
			
			if(values != '' && values != undefined){
				sessionStorage.vals = values;
				Data.get('/location?locationid='+ encodeURIComponent(values)).then(function (data) {
					$scope.parent_loc_datas = data;
					
				});
			}	
			
			
			$scope.ship.transactionTypeId="";
			$scope.ship.documentTypeId="";
			
			 $timeout(function() {
				angular.element('.removbtn').trigger('click');
			  }, 100);
			$scope.filteredItems=0;
	}
	
});

app.controller('getShipmentsCtrl',function ($rootScope, $scope,  $state, $http,  $timeout,$controller, ovcDash, Data, Utils){  
	
	var user_detail=$rootScope.globals['currentUser'];
	var user_id=user_detail['username'];
	/* get store or locations from mysql service */
	$scope.getStores = function () {
		Utils.userLocation(1).then(function(results){
			if(results.status=='error'){
				$scope.store_datas = [];
			}else{
			$scope.store_datas = results;
			}
		}, function(error){
			console.log('User Location Error :' + error);
		});
	};
	
	/* get transaction types from micro service */
	$scope.getTranType = function () {
		Data.get('/transactiontype').then(function (results) {
			var trantypes = [];
			angular.forEach(results, function(values) {
				if((values.isActive) && (values.tranName != undefined) && (values.tranName != '') &&(values.tranTypeId !='') &&(values.tranTypeId != undefined)){
					trantypes.push(values);
				}
			});
			$scope.tran_type_datas = trantypes;
		});
	};
	
	/* get directive types from micro service   docTypeId */
	$scope.getDocType = function () {
		Data.get('/documenttype').then(function (results) {
			var doctypes = [];
			angular.forEach(results, function(values) {
			
				 if((values.isActive) && (values.directiveName != undefined) && (values.directiveName != '') && (values.directiveTypeId != '') && (values.directiveTypeId != undefined)){
					doctypes.push(values);
				}
			});
			$scope.doc_type_datas = doctypes;
		});
	};
	
	
	//$scope.parent_loc_datas = [];
	
	/* get stock locations based on values  */
	/* $scope.getparent_datas = function (values) {
		// alert(values);
		if(values != '' && values != undefined){
			sessionStorage.vals = values;
			Data.get('/location?locationid='+values).then(function (data) {
				$scope.parent_loc_datas = data;
			});
		}	
	}; */
	
	$scope.myCustomValidator = function(text){		
		return true;
	};
	
	
	/* search the locations */
	$scope.applySearchFilter = function() {
		var values = sessionStorage.vals;
		if(values != '' && values != undefined){
			if($scope.search != ''){
				Data.get('/location?locationid='+encodeURIComponent(values)+'&key='+$scope.search).then(function (data) {
					$scope.list = data;
					angular.forEach($scope.list, function(value) {
						value.parentStockingLocationName = '#';
						angular.forEach(data, function(values) {
							if(value.parentStockingLocationId == values._id){
								value.parentStockingLocationName = values.stockingLocationId;
							}
						});
					});
					$scope.currentPage = 1; //current page
					$scope.entryLimit = 10; //max no of items to display in a page
					$scope.filteredItems = $scope.list.length; //Initially for no filter  
					$scope.totalItems = $scope.list.length;
					
				});
			}else{
				$scope.getstore_lists(sessionStorage.vals);
			}	
		}
    }
	
	$scope.setPage = function(pageNo) {
        $scope.currentPage = pageNo;
    };
    
    $scope.filter = function() {
        $timeout(function() { 
            $scope.filteredItems = $scope.filtered.length;
        }, 10);
    };
    $scope.sort_by = function(predicate) {
        $scope.predicate = predicate;
        $scope.reverse = !$scope.reverse;
    };
   
	$scope.getStores(); // get stores from mysql service
	$scope.getTranType(); // get transaction type from micro service
	$scope.getDocType(); // get Directive type from micro service
	
});
