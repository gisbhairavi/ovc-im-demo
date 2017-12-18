
var app = angular.module('OVCstockApp',[]);

/*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module     :   Reason Code List
*
*    Developer  :   Arun
* 
*    Date       :   03/03/2016
*
*    Version    :   1.0
*
**********************************************************************/
app.controller('listReasonCtrl', function( $rootScope, $scope, $state, $stateParams, Data, REASONCODETYPE ) {

	/*****Enable and Disable based on Permission******/
	$scope.vliuom    =   true;
    $scope.moluom    =   true;
	$scope.reasonServicefun = function() {

		$rootScope.$watch('ROLES',function(){
			var role_data = $rootScope.ROLES;
			
			angular.forEach(role_data, function( roles, key ) {
				if (key == 'reasonCode'){

					var view_reason_code =   roles.viewReasonCode?roles.viewReasonCode:0;
                    var modify_reason_code =   roles.modifyReasonCode?roles.modifyReasonCode:0;

                    if(view_reason_code    ==  1){
                        $scope.vliuom    =   false;
                    }

                    if(modify_reason_code  	==  1){
                        $scope.vliuom    =   false;
                        $scope.moluom    =   false;
                    }
				
				}
			});
		
		}); 
	}

	$scope.reasonServicefun();
    
	/***Get All Reason Code Service Function***/
	
	
    $scope.setPage = function(pageNo) {
        $scope.currentPage = pageNo;
    };
    
    $scope.sort_by = function(predicate) {
        $scope.predicate = predicate;
        $scope.reverse = !$scope.reverse;
    };
					  
    

    var resCodeTypeList   =   $scope.ovcLabel.reasoncodes.codeType;
    var resCodeType  =   [];

    angular.forEach( REASONCODETYPE, function( item ) {
        resCodeType[ item.code ]  =   resCodeTypeList[ item.code ];
    });

    $scope.codeTypeList  =   resCodeType;


    $scope.search 		=	'';

    if($stateParams.fullList){
        delete sessionStorage.reasonCodeSearchData;
        delete sessionStorage.reasonCodePageLimit;
    }

    if(sessionStorage.reasonCodeSearchData){
    	$scope.search 	=	sessionStorage.reasonCodeSearchData;
    }

    $scope.entryLimit 	= 	sessionStorage.reasonCodePageLimit ? sessionStorage.reasonCodePageLimit : 10; //max no of items to display in a page


    /***Search Reason Code***/
	$scope.reason_search  =  function() {
		var search_data	=	$scope.search;
		sessionStorage.reasonCodeSearchData 	=	$scope.search;
		sessionStorage.reasonCodePageLimit   	=   $scope.entryLimit;

		Data.get( '/reasoncode?key=' + search_data ).then( function ( data ) {
			var res_data_list   =   [];
			if(data){
                angular.forEach(data, function(reasonData) {
                    reasonData._id  =  (reasonData._id) ? reasonData._id:'';
                    reasonData.res_id  =  (reasonData.id) ? reasonData.id:'';
                    reasonData.description  =  (reasonData.description) ? reasonData.description:'';
                    reasonData.rescodeType  =  (reasonData.codeType) ? $scope.codeTypeList[reasonData.codeType]:''; 
                    res_data_list.push(reasonData);
                });

				$scope.list  =  res_data_list;
				$scope.currentPage  =  1; //current page
				$scope.filteredItems  =  $scope.list.length; //Initially for no filter  
				$scope.totalItems  =  $scope.list.length;
			}
		});
   	};

   	/*** Reset Search ***/
	$scope.search_reset  =  function(){
		delete sessionStorage.reasonCodeSearchData;
        delete sessionStorage.reasonCodePageLimit;
        $scope.search 		=	'';
        $scope.entryLimit 	= 	10;
    	$scope.reason_search();	
	};

	$scope.reason_search();
	 
	/*****Delete reason code****/
	$scope.reason_delete  =  function (id) {
		
		 var reason_id  =  id ;
		
		$.confirm({
			title: 'Delete Reason Code',
			content: 'Confirm delete?',
			confirmButtonClass: 'btn-primary',
			cancelButtonClass: 'btn-primary',
			confirmButton: 'Ok',
			cancelButton: 'Cancel',
			confirm: function () {
				Data.delete( '/reasoncode/' + reason_id ).then( function ( data ) {
				
					var output  =  { "status":"success", "message":$scope.ovcLabel.reasoncodes.toast.reasoncodedelete};
					Data.toast( output );
					$scope.reason_search();
					
				});
			},
			cancel: function () {
				return false;
			}
		
		});
		return false;
	}
		
});

/*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module     :   Reason Code Add
*
*    Developer  :   Arun
* 
*    Date       :   03/03/2016
*
*    Version    :   1.0
*
**********************************************************************/
app.controller("addReasonCtrl", function( $rootScope, $scope, $state , Data, REASONCODETYPE, ovcDash, Utils ) {
	
	$scope.reason 	=	{}; 
	$scope.code_type  =  [];
	$scope.store_datas  =  [];
	$scope.title	=	"Add";
	$scope.vliuom	=	false;
	$scope.moluom	=	false;

	var user_detail  =  $rootScope.globals['currentUser'];
	var user_id  =  user_detail['username'];

	var lab_code_type  =  $scope.ovcLabel.reasoncodes.codeType;
	var code_type_ls  =  REASONCODETYPE;
	var code_ls_arr  =  [];

	angular.forEach(code_type_ls, function(item) {
		var newitem  =  {};
		newitem.value  =  item.code;
		var porder  =  lab_code_type[item.code];
		newitem.name  =  porder;
		code_ls_arr.push(newitem);
	});

	$scope.code_type  =  code_ls_arr;
	$scope.res_add ={};
	$scope.res_add.loc_Grp_id =[];


	/*** Get User Stores ***/
	$scope.getStores  =  function() {
		Utils.userLocation(1).then(function(results){
			if(results.status  ==  'error'){
				$scope.store_datas  =  [];
			}else{
            	$scope.store_datas 	=	results;
            if( $scope.store_datas.length==1){
            	$scope.res_add.loc_Grp_id 	=	results[0].id;
            }
			}
        }, function(error){
        	console.log('User Location Error :' + error);
        });
    };

    $scope.getStores();
	
	$scope.getselected_store  =  function(newstore) {

        $scope.po_add.orderstore  =  newstore;  
	   	
	   	var allstores  =  $scope.fromstore_datas;
        
        angular.forEach(allstores, function( item ) {
            if (item.id  ==  newstore) {
                $scope.fromstr  =  item.displayName;
            }
        });

    }

    /*** Add New Reason Code ***/
	$scope.reason_add = function (res_add) {

		$scope.submitted="true";
		if(res_add.loc_Grp_id == undefined){
			$scope.res_add.loc_Grp_id = '';
		}
		var res_data = res_add;
		
		if(( res_data != undefined ) && (res_data.res_id != undefined) && ( res_data.description != undefined ) && ( res_data.rescodeType != undefined )){

			var res_Obj = {
				id :  res_data.res_id,
				description: res_data.description,
				codeType : res_data.rescodeType,
				locationOrGroupId: $scope.res_add.loc_Grp_id,
			};
			
			Data.put('/reasoncode',{
				data:res_Obj
			}).then( function ( results ) { 
					
				if( results.__v  ==  0 ){ 
						
					var output  =  {"status":"success","message":$scope.ovcLabel.reasoncodes.toast.reasoncodeadd};
					Data.toast(output);
					$state.go('ovc.reasoncode-list');
	 
				}
				else if(results.status  ==  "error"){
					console.log(results);
					Data.toast(results);
				}
			});	
		}
	}

	$scope.reason_cancel  =  function(){

		 $state.go('ovc.reasoncode-list');
	}
	
});

/*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module     :   Reason Code Edit
*
*    Developer  :   Arun
* 
*    Date       :   03/03/2016
*
*    Version    :   1.0
*
**********************************************************************/
app.controller("editReasonCtrl", function( $rootScope, $scope, $state , $stateParams, Data, REASONCODETYPE, ovcDash, Utils) {
	$scope.code_type 	=	[]; 
	$scope.title  =  "Edit";

	var res_id  =  $stateParams.res_id;

	$scope.r_id  =  res_id;
	
	var user_detail  =  $rootScope.globals['currentUser'];
	var user_id  =  user_detail['username'];

	var lab_code_type  =  $scope.ovcLabel.reasoncodes.codeType;
	var code_type_ls  =  REASONCODETYPE;
	var code_ls_arr  =  [];

	angular.forEach(code_type_ls, function(item) {
		var newitem  =  {};
		newitem.value  =  item.code;
		var porder  =  lab_code_type[item.code];
		newitem.name  =  porder;
		code_ls_arr.push(newitem);
	});

	$scope.code_type  =  code_ls_arr;

	/*** Get User Stores ***/
	$scope.getStores = function() {
        Utils.userLocation(1).then(function(results){
			if(results.status == 'error'){
				$scope.store_datas = [];
			}else{
            $scope.store_datas = results;
			}
        }, function(error){
        	console.log('User Location Error' +  error);
        });
    };

    $scope.getStores();
	
	$scope.getselected_store  =  function( newstore ) {
        $scope.po_add.orderstore  =   newstore;  
      //  var allstores = $scope.store_datas;
	   var allstores  =  $scope.fromstore_datas;
        angular.forEach(allstores, function( item ) {
            if ( item.id  ==  newstore ) {
                $scope.fromstr  =  item.displayName;
            }
        });
    }

	/*****Enable and Disable based on Permission******/
	$scope.vliuom    =   true;
    $scope.moluom    =   true;

	$scope.servicefun2  =  function() {
		$rootScope.$watch('ROLES',function(){
			var role_data=$rootScope.ROLES;
			
			angular.forEach(role_data, function(roles,key) {
				if (key == 'reasonCode'){

					var view_reason_code     =   roles.viewReasonCode?roles.viewReasonCode:0;
                    var modify_reason_code 	=   roles.modifyReasonCode?roles.modifyReasonCode:0;

                    if(view_reason_code    ==  1){
                        $scope.vliuom    =   false;
                    }

                    if(modify_reason_code  	==  1){
                        $scope.vliuom    =   false;
                        $scope.moluom    =   false;
                    }
				}
			});
		
		}); 
	}

	$scope.servicefun2();

	Data.get( '/reasoncode?res_id=' + res_id ).then( function ( data ) {

		if( data ){
 			$scope.res_add  =  {};
            $scope.res_add.res_id  =  ( data.id ) ? data.id : '';
            $scope.res_add.description  =  ( data.description ) ? data.description : '';
            $scope.res_add.rescodeType  =  ( data.codeType ) ? data.codeType : ''; 
            $scope.res_add.loc_Grp_id  =  ( data.locationOrGroupId ) ? data.locationOrGroupId : '';
         
		}

	});

	/*** Add New Reason Code ***/
	$scope.reason_add  =  function(res_add){
		
		$scope.submitted  =  "true";

		var res_data  =  res_add;

		if(( res_data != undefined ) && (res_data.res_id != undefined) && ( res_data.description != undefined ) && ( res_data.rescodeType != undefined ) && ( res_data.loc_Grp_id != undefined )){
			
			if((res_data.res_id !='') && (res_data.res_id != undefined )){

				var dataObj = {
					id:  res_data.res_id,
					description: res_data.description,
					codeType : res_data.rescodeType,
					locationOrGroupId: res_data.loc_Grp_id
				};

				Data.post( '/reasoncode/' + res_id , {
					data:{code_data : dataObj}
				}).then(function (results) {
					if(results.ok  ==  1){
						var output  =  {"status":"success","message":$scope.ovcLabel.reasoncodes.toast.reasoncodeupdate};
						Data.toast(output);
						$state.go('ovc.reasoncode-list');	
					}
					else if(results.status == "error"){
						Data.toast(results);
					}
				});
				
			}else{
				return false;
			}
		}

	}

	$scope.reason_cancel  =  function(){

		 $state.go('ovc.reasoncode-list');
	}
	
});

