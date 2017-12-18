var app=angular.module('OVCstockApp',[]);

/***********UOM Add **************/
app.controller("unitCtrl", function($scope, $state , Data) {

	$scope.title="Add";
	$scope.vliuom=false;
	$scope.moluom=false;

	$scope.newclass1="selected_radio";
	$scope.newclass2="";
	$scope.status=1;
	
	$scope.changeclass1=function()
	{
		$scope.newclass1="selected_radio";
		$scope.newclass2="";
	}
	
	$scope.changeclass2=function()
	{
		$scope.newclass1="";
		$scope.newclass2="selected_radio";
	}

	$scope.uom_add = function (u_add) {
		$scope.submitted="true";
			
		var unit=u_add;
		
		if(unit.unitofmeasureid && unit.basequantity && unit.description){
		
				if((unit.status== undefined)){
					
					var uomstatus=true;
				}else{
					
					var uomstatus=unit.status;
				}
		
			var uomObj = {
					uomId:  unit.unitofmeasureid,
					description: unit.description,
					quantity : unit.basequantity,
					isActive: uomstatus

					 };
			
			Data.put('/uom',{
				data:uomObj
			}).then(function (results) { 
					
				if(results.__v==0){ 
						
						var output={"status":"success","message":$scope.ovcLabel.unitOfMeasure.toast.add};
						Data.toast(output);
						$state.go('ovc.uom-list');
	 
				};
			});	
		}
	}

	$scope.unit_cancel=function(){

		 $state.go('ovc.uom-list');
	}
	
});


app.controller('unitsofmeasureCtrl', function($rootScope, $scope, $state, $stateParams, Data) {

	/*****Enable and Disable based on Permission******/
	$scope.vliuom    =   true;
    $scope.moluom    =   true;
	$scope.servicefun2 = function() {
		$rootScope.$watch('ROLES',function(){
			var role_det=$rootScope.ROLES;
			
			angular.forEach(role_det, function(roles,key) {
				if (key== 'UOM'){

					var viewUOM     =   roles.viewUOM?roles.viewUOM:0;
                    var modifyUOM 	=   roles.modifyUOM?roles.modifyUOM:0;

                    if(viewUOM    ==  1){
                        $scope.vliuom    =   false;
                    }

                    if(modifyUOM  	==  1){
                        $scope.vliuom    =   false;
                        $scope.moluom    =   false;
                    }
				}
			});
		
		}); 
	}
	$scope.servicefun2();
    
	
    $scope.setPage = function(pageNo) {
        $scope.currentPage = pageNo;
    };
    
    $scope.sort_by = function(predicate) {
        $scope.predicate = predicate;
        $scope.reverse = !$scope.reverse;
    };

    $scope.search 		=	'';

    if($stateParams.fullList){
        delete sessionStorage.uomSearchData;
        delete sessionStorage.uomPageLimit;
    }

    if(sessionStorage.uomSearchData){
    	$scope.search 	=	sessionStorage.uomSearchData;
    }

    $scope.entryLimit 	= 	sessionStorage.uomPageLimit ? sessionStorage.uomPageLimit : $rootScope.PAGE_SIZE; //max no of items to display in a page


	$scope.uom_search = function() {
		var search_data	=	$scope.search;
		sessionStorage.uomSearchData 	=	$scope.search;
		sessionStorage.uomPageLimit   	=   $scope.entryLimit;
				
		Data.get('/uom?uomId='+search_data).then(function (data) {
			$scope.list =data;
			$scope.currentPage = 1; //current page
			$scope.filteredItems = $scope.list.length; //Initially for no filter  
			$scope.totalItems = $scope.list.length;
		});
   	 };

	$scope.uom_reset=function(){
		delete sessionStorage.uomSearchData;
        delete sessionStorage.uomPageLimit;
        $scope.search 		=	'';
        $scope.entryLimit 	= 	$rootScope.PAGE_SIZE;									  
    	$scope.uom_search();
	}

	$scope.uom_search();
	 
	/*****Delete Vendor****/
	$scope.uom_delete = function (id) {
		
		 var uom_id = id ;
		
		$.confirm({
			title: $scope.ovcLabel.unitOfMeasure.popup.title,
			content: $scope.ovcLabel.unitOfMeasure.popup.content+ '?',
			confirmButtonClass: 'btn-primary okUom',
			cancelButtonClass: 'btn-primary cancelUom',
			confirmButton: $scope.ovcLabel.unitOfMeasure.popup.ok,
			cancelButton: $scope.ovcLabel.unitOfMeasure.popup.cancel,
			confirm: function () {
				Data.delete('/uom/'+uom_id).then(function (data) {
				
					var output={"status":"success","message":$scope.ovcLabel.unitOfMeasure.toast.delete};
					Data.toast(output);
					$scope.uom_search();
					
				});
			},
			cancel: function () {
				return false;
			}
		
		});
		return false;
	}
		
});

/***********UOM Edit **************/

app.controller("edituomCtrl", function($rootScope,$scope, $state , $stateParams,Data) {

	$scope.title="Edit";
	var uom_id = $stateParams.uomid; 
	$scope.uomid=uom_id;
	
	/*****Enable and Disable based on Permission******/
	$scope.vliuom    =   true;
    $scope.moluom    =   true;
	$scope.servicefun2 = function() {
		$rootScope.$watch('ROLES',function(){
			var role_det=$rootScope.ROLES;
			
			angular.forEach(role_det, function(roles,key) {
				if (key== 'UOM'){

					var viewUOM     =   roles.viewUOM?roles.viewUOM:0;
                    var modifyUOM 	=   roles.modifyUOM?roles.modifyUOM:0;

                    if(viewUOM    ==  1){
                        $scope.vliuom    =   false;
                    }

                    if(modifyUOM  	==  1){
                        $scope.vliuom    =   false;
                        $scope.moluom    =   false;
                    }
				}
			});
		
		}); 
	}
	$scope.servicefun2();

	$scope.changeclass1=function(){
		$scope.newclass1="selected_radio";
		$scope.newclass2="";
	}
	
	$scope.changeclass2=function(){
		$scope.newclass1="";
		$scope.newclass2="selected_radio";
	}
	
	
	Data.get('/uom?id='+uom_id).then(function (data) {

			if(data.isActive == true){
				$scope.newclass1="selected_radio";
				$scope.newclass2="";
				
			}else if(data.isActive == false){
				$scope.newclass1="";
				$scope.newclass2="selected_radio";
				
			}
			
				var exquantity=data.quantity;
			var nquantity=parseFloat(exquantity);
			
			
			$scope.u_add={};
			$scope.u_add.id = data._id,
			$scope.u_add.unitofmeasureid = data.uomId,
			$scope.u_add.description = data.description,
			$scope.u_add.basequantity = nquantity,
			$scope.u_add.status=data.isActive 

				
	});

	$scope.uom_add=function(u_add){
		
		$scope.submitted="true";
		var u_data=u_add;

		
		if((u_data != '') && (u_data != undefined)){
			
			if(u_data.unitofmeasureid && u_data.basequantity && u_data.description){

				var dataObj = {
					uomId:  u_data.unitofmeasureid,
					description: u_data.description,
					quantity : u_data.basequantity,
					isActive: u_data.status,
				};
				
				Data.post('/uom/'+uom_id , {
					data:dataObj
				}).then(function (results) {
					
					if(results.ok==1){
						
						var output={"status":"success","message":$scope.ovcLabel.unitOfMeasure.toast.update};
						Data.toast(output);
						 $state.go('ovc.uom-list');
							
					}
				});
				
			}else{
				return false;
			}
		}

	}

	$scope.unit_cancel=function(){

		 $state.go('ovc.uom-list');
	}
	
});













