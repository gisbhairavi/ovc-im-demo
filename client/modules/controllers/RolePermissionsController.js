/*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    module         :    Role Permissions
*
*    Developer      :    Jegan
*
*    Date           :    02/02/2016
*
*    Version        :    1.0
*
**********************************************************************/

var app = angular.module('OVCstockApp');

app.controller('rolePermissions',function ($scope,  $state, $stateParams, $http, $timeout, $cookieStore, ovcDash, Data, Utils){
	$scope.formData						=	{};
	$scope.data 						=	{};
	$scope.settings						=	{};
	$scope.action 						=	{};

	$scope.formData.applicationId		=	'SAR';
	//$scope.formData.moduleId			=	'inventory';
	$scope.formData.permissions 		=	{};
	$scope.settings.showPermissions		=	false;
	$scope.action.label					=	$scope.ovcLabel.rolePermissions.selectedAll;

	$scope.formData.permissionsLength	=	0;

	$scope.item = {};
	var activeParentIndex		        =	[];
	
	$scope.action.expandAll 			=	false;
	$scope.action.expandCollapseAllLabel=	$scope.ovcLabel.rolePermissions.buttons.expandAll;
	

    var rolePermissionRecords           =   [];
    var viewPermissionArray             =   ["viewOrder","viewInTransit","viewTransfer","viewReturns","viewmanualReceipt","viewAdjustments","viewStockingLocations","viewTransactionTypes","viewDirectiveTypes","viewVendors","viewUOM","viewConfigurations","viewRolePermissions","viewReasonCode","viewZcounts",]


	// Get all Roles Permission form Mysql Service
	$scope.getAllRoles	= 	function(){
		ovcDash.get('apis/getAllRoles').then(function(results) {
	    	if(results) {
	    		$scope.data.roles 			= 	results;
	    	}
            Data.get('/getModuleIds').then(function(results){
                if(results.length > 0){
                    angular.forEach(results, function (moduleIds,key) {
                        results[key].label          =   $scope.translation.rolePermissionsModules[0][moduleIds._id] ? $scope.translation.rolePermissionsModules[0][moduleIds._id] : moduleIds._id;
                    });
                    $scope.data.moduleIds           =   results;
                }

                if($stateParams['roleId']){
                    $scope.formData.roleId          =   $stateParams['roleId'];
                }

                if($stateParams['moduleId']){
                    $scope.formData.moduleId        =   $stateParams['moduleId'];
                }


                $scope.getRolesPermissions();
            });
	    });
	};


    $scope.formatPermissionData     =   function(permissionsData){
        var resultData              =   {};
        angular.forEach(permissionsData, function (records) {
            if(!resultData[records.permGroup]){
                resultData[records.permGroup]   =   [];
            }
            resultData[records.permGroup].push(records);
        });   
        return resultData;
    };

    $scope.getRolesPermissions   =   function() {
        $scope.data.permissions             =   {};
        $scope.settings.showPermissions     =   false;
        $scope.action.selectedAll           =   false;
        $scope.action.label                 =   $scope.ovcLabel.rolePermissions.selectedAll;

        if($scope.formData.roleId && $scope.formData.moduleId) {
            // Get all Permissions by Selected Module Id form Micro Service
            var selectedModuleId    =   $scope.formData.moduleId;
            var roleId              =   $scope.formData.roleId;
            Data.get('/permissions?moduleId='+selectedModuleId+'&roleId='+roleId).then(function (resultsData) {
                $scope.formData.permissions             =   {};
                $scope.formData.URlPermission           =   {};
                $scope.formData.Description             =   {};
                var permissionRecords                   =   resultsData.permissions;
                $scope.permissionRecordData             =   resultsData.permissions;
                rolePermissionRecords                   =   [];

                if(permissionRecords.length > 0){
                    var expandAllData                   =   [];
                    $scope.settings.showPermissions     =   true;
                    $scope.formData.permissionsLength   =   permissionRecords.length;
                    $scope.data.permissions             =   $scope.formatPermissionData(permissionRecords);
                        var refObj  =   {};

                    angular.forEach(permissionRecords, function (permissionsData) {
                        var Obj     =   '"'+permissionsData.moduleId+'.'+permissionsData.permGroup+'.'+permissionsData.permId+ '"';
                        refObj[Obj] =   permissionsData.permDescription;
                        $scope.formData.Description[permissionsData.permId]     =   permissionsData.permDescription;
                        if(expandAllData.indexOf(permissionsData.permGroup) == -1){
                            expandAllData.push(permissionsData.permGroup);
                        }
                        $scope.formData.permissions[permissionsData.permGroup]  =   {};
                        if(permissionsData.URLState && permissionsData.URLState.length){
                            $scope.formData.URlPermission[permissionsData.permId]    =  permissionsData.URLState;
                        }
                    });

                    sessionStorage.allPermGroups        =   JSON.stringify(expandAllData);
                }

                if(resultsData.rolePermissions.length > 0){
                    angular.forEach(resultsData.rolePermissions, function (rolePermissionData) {
                        if(rolePermissionData.access){
                            rolePermissionRecords.push(rolePermissionData.permId);
                        }
                        $scope.formData.permissions[rolePermissionData.permGroup][rolePermissionData.permId]  =   rolePermissionData.access;
                    });
                   
                    $scope.isLabelChecked();
                }
                $scope.action.expandAll             =   false;
                $scope.expandCollapseAll();
            });
        }
    };

	$scope.isLabelChecked = function() {
		var selectedPermissionsCount	=	0;
		angular.forEach($scope.data.permissions, function (permissionData) {
            angular.forEach(permissionData, function (permissionValues) {
            	if($scope.formData.permissions[permissionValues.permGroup][permissionValues.permId]){
            		selectedPermissionsCount++;
            	}
        	});
        });

        if($scope.formData.permissionsLength == selectedPermissionsCount){
        	$scope.action.selectedAll	= 	true;
            $scope.action.label			=	$scope.ovcLabel.rolePermissions.unselectAll;
        }else{
        	$scope.action.selectedAll 	=   false;
            $scope.action.label			=	$scope.ovcLabel.rolePermissions.selectedAll;
        }
	}; 

    //For Changing the Permisiion access 
    $scope.checkPermission = function(permData,ckeckAction){

        //For Unchecking Releative PermIDs in the Perm Group
        if(!ckeckAction && permData.parentId || !ckeckAction && permData.parentId == ''){
            angular.forEach($scope.permissionRecordData, function(value,key){
                if(value.parentId && permData.permGroup == value.permGroup){
                    if(permData.permId == value.parentId){
                        $scope.formData.permissions[permData.permGroup][value.permId] = ckeckAction;
                        $scope.checkPermission(value,ckeckAction);
                    }
                }
            });
        }
        //For Checking Parent PermId access
        if(ckeckAction && permData.parentId){
             if($scope.formData.permissions[permData.permGroup][permData.parentId]){
                $scope.formData.permissions[permData.permGroup][permData.permId] = ckeckAction;
            }else{
                $scope.formData.permissions[permData.permGroup][permData.permId]    =   false;
                var output = {
                        "status": "error",
                        "message": "Please select the"+' '+$scope.formData.Description[permData.parentId] +'</br>'+'first'
                };
                Data.toast(output);
            }
        }
    };

	$scope.checkAll = function () {
        if (!$scope.action.selectedAll) {
            $scope.action.label			=	$scope.ovcLabel.rolePermissions.selectedAll;
        } else {
            $scope.action.label			=	$scope.ovcLabel.rolePermissions.unselectAll;
        }
        angular.forEach($scope.data.permissions, function (permissionData) {
            angular.forEach(permissionData, function (permissionValues) {
            	$scope.formData.permissions[permissionValues.permGroup][permissionValues.permId] 	=	$scope.action.selectedAll;
        	});
        });
    };

    $scope.showChildElements	=	function(permGroup) {
    	if(activeParentIndex.indexOf(permGroup) !== -1) {
    		activeParentIndex.splice(activeParentIndex.indexOf(permGroup),1);
    	}else{
    		activeParentIndex.push(permGroup);
    	}    	 
    };

    $scope.isShowing			=	function(permGroup) {
    	if(activeParentIndex.indexOf(permGroup) !== -1) {
		  return true;
		}
    };

    $scope.isExist              =   function(permId){
        if(rolePermissionRecords.indexOf(permId) !== -1) {
          return true;
        }
    };

    $scope.expandCollapseAll	=	function() {
    	$scope.action.expandAll = 	!$scope.action.expandAll;
    	$scope.action.expandCollapseAllLabel	=	$scope.action.expandAll ? $scope.ovcLabel.rolePermissions.buttons.collapseAll : $scope.ovcLabel.rolePermissions.buttons.expandAll;
    	activeParentIndex	=	[];
    	if($scope.action.expandAll){
    		activeParentIndex	=	JSON.parse(sessionStorage.allPermGroups);
    	}

    	if(activeParentIndex.length > 0){
    		angular.forEach(activeParentIndex, function (permGroup) {
    			$scope.isShowing(permGroup);
    		});
    	}
    };

    $scope.cancelPermissions    =   function(){
        $state.reload();
    };

    $scope.savePermissions      =   function() {
        if($scope.settings.showPermissions){
            var dataToSave      =   [];
            angular.forEach($scope.formData.permissions, function (permissionRecords,permGroup) {
                if(Object.keys(permissionRecords).length){
                    var viewaccess = false;
                    angular.forEach(permissionRecords, function (access,permId) {
                        var rolePermissionObj   =   {};
                            rolePermissionObj.roleId        =   $scope.formData.roleId;
                            rolePermissionObj.applicationId =   $scope.formData.applicationId;
                            rolePermissionObj.moduleId      =   $scope.formData.moduleId;
                            rolePermissionObj.permGroup     =   permGroup;
                            rolePermissionObj.permId        =   permId;
                            rolePermissionObj.access        =   access;
                            if(Object.keys($scope.formData.URlPermission).length && $scope.formData.URlPermission[permId]){
                                rolePermissionObj.URLState    =   $scope.formData.URlPermission[permId];
                            }
                       
                        dataToSave.push(rolePermissionObj);
                    });
                }
            });

            if(dataToSave.length > 0){
                Data.post('/saveRolePermissions', {
                    data: {rolesPermissionData:JSON.stringify(dataToSave),roleId:$scope.formData.roleId, moduleId:$scope.formData.moduleId}
                }).then(function(results) {
                    if(!results.error){
                        var output = {
                            "status": "success",
                            "message": "Successfully Saved"
                        };
                        Data.toast(output);


                        // if($stateParams['roleId'] ==  $scope.formData.roleId && $stateParams['moduleId'] == $scope.formData.moduleId){

                            // Remove Item  From local
                            localStorage.removeItem('Roles');
                            //Role Service Call to Util
                            $timeout(function(){
                                Utils.roles();
                                document.body.scrollTop = document.documentElement.scrollTop = 0;
                            }, 500);
                            
                        // }else{
                        //     console.log('ELSE');
                        //     $state.go('ovc.rolePermissions',{roleId:$scope.formData.roleId,moduleId:$scope.formData.moduleId},{ reload: true });
                        // }                        
                    }
                });
            }
        }
    };

	$scope.getAllRoles();

});



