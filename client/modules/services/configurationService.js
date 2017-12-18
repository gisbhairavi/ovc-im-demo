/*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module     :   Config/Roles Factory Service
*
*    Developer  :   Sivaprakash
* 
*    Date       :   19/04/2016
*
*    Version    :   1.0
*
**********************************************************************/
angular.module('roleConfig', []).factory('roleConfigService', function ($rootScope, Data, ovcDash) {
	var factory 	=	{};
	var config 		=	{};
	var roles 		=	{};
	var poconfig
	
	factory.getConfigurations = function(callback) {
        Data.get('/configbyuser').then(function(results) {
                // config_arr for all config, by Ratheesh (15.7.2016).
                config.config_arr = {};
                poconfig = [];
                if ((results != '') && (results.config_arr != undefined)) {
                    angular.forEach(results.config_arr, function(data) {
                    	if(data.featureType !='dropdown'){
                    		if (data.featureValue != null && data.featureValue != "") {
	                            var edetail = data.featureValue;
	                        } else {
	                            var edetail = data.defaultValue;
	                        }
                    	}else{
                    		var edetail 	=	(data.featureValue)? data.featureValue : null;
                    	}
                        var newobj = {
                            elementid 		: 	data.featureId,
                            elementname 	: 	data.featureName,
                            elementdetail	: 	edetail
                        }
	                   if(data.featureType != 'dropdown' && data.featureType!='OrganizationStructureDropDown'){
		                   	config.config_arr[data.featureId] = {
		                        featureId: data.featureId,
		                        featureName: data.featureName,
		                        featureValue: edetail == 0 ? false : true
		                    }
	                   }else {
	                   		if(data.featureId == 'qtyStatusAtPoReviewScreen'){
	                   			if(data.lastModified != data.created){
	                   				edetail 	=	(data.featureValue)? data.featureValue : [];
	                   			}else{
	                   				edetail 	=	(data.featureValue)? data.featureValue : data.defaultValue;
	                   			}
	                   		}

		                   	config.config_arr[data.featureId] = {
		                        featureId: data.featureId,
		                        featureName: data.featureName,
		                        featureValue: edetail
		                    }
	                   }
	                   if(data.featureType == 'OrganizationStructureDropDown'){
	                   		config.config_arr[data.featureId] = {
		                        featureId: data.featureId,
		                        featureName: data.featureName,
		                        featureValue: edetail
		                    }
	                   }
                    
                        poconfig.push(newobj);
                    });
                    $rootScope.POLIST = poconfig;
                }
	            var configData 	=	poconfig;
				config.action 	=	{};
				config.action.stockPr  =  {};
				if(configData != undefined && configData != ""){
					angular.forEach(configData, function(corder,key) {
						if(corder.elementid == "hideTax"){
							if(corder.elementdetail == 0){
							 config.puprice 	= 	true;
							}else{
							 config.puprice 	= 	false;
							}
						}
						if(corder.elementid == "hidePurchasePrice"){
							if(corder.elementdetail == 0){
							 config.shprice 	= 	true;
							}else{
							 config.shprice 	= 	false;
							}
						}
						if(corder.elementid == "enableASNlevel"){
							if(corder.elementdetail == 0){
								config.action.showasn	 =	false;
							}else{
								config.action.showasn	 = 	true;
							}
						}
						if(corder.elementid == "matchReorderPointToMaximumOrderAmount"){
							if(corder.elementdetail == 0){						
								config.showmaxAmount  = false;
							}
							else{
								config.showmaxAmount  = true;
							}
						}
						if(corder.elementid == "allGroupingByStyle"){
							if(corder.elementdetail == 1){
								config.showskugroup 	=	true;
							}else{
								config.showskugroup 	=	false;
							}
						}
						if(corder.elementid == "FindIt"){
							if(corder.elementdetail == 0){
								config.action.stockPr.pfind	=	false;
							}
							else{
								config.action.stockPr.pfind	=	true;
							}
						}
						if(corder.elementid == "productSize"){
							if(corder.elementdetail == 0){
								config.action.stockPr.psize	=	false;
							}
							else{
								config.action.stockPr.psize	=	true;
							}
						}
						if(corder.elementid == "productLength"){
							if(corder.elementdetail == 0){
								config.action.stockPr.plength	=	false;
							}
							else{
								config.action.stockPr.plength	=	true;
							}
						}
						if(corder.elementid == "productWaist"){
							if(corder.elementdetail == 0){
								config.action.stockPr.pwaist	=	false;
							}
							else{
								config.action.stockPr.pwaist	=	true;
							}
						}
						if(corder.elementid == "productColor"){
							if(corder.elementdetail == 0){
								config.action.stockPr.pcolor	=	false;
							}
							else{
								config.action.stockPr.pcolor	=	true;
							}
						}
						if(corder.elementid == "productMaterialGroup"){
							if(corder.elementdetail == 0){
								config.action.stockPr.pgroup	=	false;
							}
							else{
								config.action.stockPr.pgroup	=	true;
							}
						}
						if(corder.elementid == "productFabric"){
							if(corder.elementdetail == 0){
								config.action.stockPr.pfabric	=	false;
							}
							else{
								config.action.stockPr.pfabric	=	true;
							}
						}
						if(corder.elementid == "productSleave"){
							if(corder.elementdetail == 0){
								config.action.stockPr.psleave	=	false;
							}
							else{
								config.action.stockPr.psleave	=	true;
							}
						}
						if(corder.elementid == "productFit"){
							if(corder.elementdetail == 0){
								config.action.stockPr.pfit	=	false;
							}
							else{
								config.action.stockPr.pfit	=	true;
							}
						}
						if(corder.elementid == "productFirstSeason"){
							if(corder.elementdetail == 0){
								config.action.stockPr.pfseason	=	false;
							}
							else{
								config.action.stockPr.pfseason	=	true;
							}
						}
						if(corder.elementid == "productLastSeason"){
							if(corder.elementdetail == 0){
								config.action.stockPr.plseason	=	false;
							}
							else{
								config.action.stockPr.plseason	=	true;
							}
						}
						if(corder.elementid == "showImageByDefault"){
                            if(corder.elementdetail == 0){
                                config.action.stockPr.imgbydefault    =    false;
                            }
                            else{
                                config.action.stockPr.imgbydefault    =    true;
                            }
                        }

                        if(corder.elementid == "enablePackageatmanualreceipt"){
                        	if(corder.elementdetail == 0){
                        		config.action.enablePackageatmanualreceipt 	=	false;
                        	}else{
                        		config.action.enablePackageatmanualreceipt 	=	true;
                         	}
                        }
                        if(corder.elementid == "enableReviewForReplenishmentOrders"){
                        	if(corder.elementdetail == 0){
                        		config.action.enanbleReview 	=	false;
                        	}else{
                        		config.action.enanbleReview 	=	true;
                         	}
                        }
                        if(corder.elementid == "productProperty"){
                        	config.productProperty 		=	corder.elementdetail;
                        }
                        if(corder.elementid == "productAttribute"){
                        	config.productAttribute 		=	corder.elementdetail;
                        }
                        if(corder.elementid == "organizationStructure"){
                        	angular.forEach(corder.elementdetail,function(key){
                        		if(key.value == 1){
                        			config.organization_name = key.name;
                        		}
                        	})
                        }
                        if (corder.elementid == "numberOfSKUByDefaultInNegativeStockBalance") {

	                        config.action.stockPr.negativestock = corder.elementdetail;
	                    }
                        // if(corder.elementid == "manualShipmentOrganizationStructure"){
                        // 	angular.forEach(corder.elementdetail,function(key){
                        // 		if(key.value == 0){
                        // 			config.organization_Structure.manualShiptment = key.name;
                        // 		}
                        // 	})
                        // }
                        // if(corder.elementid == "manualReceiptOrganizationStructure"){
                        // 	angular.forEach(corder.elementdetail,function(key){
                        // 		if(key.value == 0){
                        // 			config.organization_Structure.manualReceipt = key.name;
                        // 		}
                        // 	})
                        // }

					});
				}else{
						config.puprice 	= 	true;
						config.shprice 	= 	true;
						config.action.showasn	 =	false;
						config.showskugroup 	 = 	true;
				}
				callback(config);
            },function(error){
            	console.log('configration service Failed');
        });
    };


    factory.getRoles 	=	function(callback){
        var rolesPermissions = {};
	    var roles_val 	=	{};
    	if (($rootScope.globals.currentUser != undefined) && ($rootScope.globals.currentUser.roles != undefined))
        var roleIds = Object.keys($rootScope.globals.currentUser.roles).toString();

    	Data.get('/permissions?roleId=' + roleIds).then(function(resultsData) {
                 rolesPermissions = {};
                 rolesPermissions.URLPermission  =   {};
            if ((resultsData) && (resultsData.rolePermissions) && (resultsData.rolePermissions.length > 0)) {
                angular.forEach(resultsData.rolePermissions, function(permissionsData) {
                    if (!rolesPermissions[permissionsData.permGroup]) {
                        rolesPermissions[permissionsData.permGroup] = {};
                    }
                    if(permissionsData.URLState && permissionsData.URLState.length){
                        angular.forEach(permissionsData.URLState, function(item){
                            rolesPermissions.URLPermission[item]    =   permissionsData.access ? true : false;
                        });
                    }
                    rolesPermissions[permissionsData.permGroup][permissionsData.permId] = permissionsData.access ? 1 : 0;
                });
                roles_val.permissionsData	=	rolesPermissions;

                $rootScope.ROLES = rolesPermissions;
                localStorage.permissionsData  =   JSON.stringify(rolesPermissions.URLPermission);

                
                var userRolePermissions                     =   {};

                userRolePermissions.dashboardPermissions    =   {};
                userRolePermissions.stockLookupPermissions  =   {};
                userRolePermissions.orderPermissions        =   {};
                userRolePermissions.reportPermission        =   {};
                userRolePermissions.settings                =   {};
                userRolePermissions.permissions             =   {};
                if($rootScope.ROLES){
                    angular.forEach($rootScope.ROLES, function(roles,key) {
                        if(key == 'dashboardReports'){
                            var viewDashboardReports    =   roles.viewDashboardReports?roles.viewDashboardReports:0;
                            if(viewDashboardReports == 1){
                                userRolePermissions.dashboardPermissions.viewDashboardReports    =   true;
                            }
                        }
                        if(key == 'stockLookup'){
                            var viewBalanceInquiry      =   roles.viewBalanceInquiry?roles.viewBalanceInquiry:0;
                            if(viewBalanceInquiry == 1){
                                userRolePermissions.stockLookupPermissions.viewBalanceInquiry    =   true;
                            }

                            var viewProductPerformance  =   roles.viewProductPerformance?roles.viewProductPerformance:0;
                            if(viewProductPerformance == 1){
                                userRolePermissions.stockLookupPermissions.viewProductPerformance =  true;
                            }

                            var viewReplenishmentInformation    =   roles.viewReplenishmentInformation?roles.viewReplenishmentInformation:0;
                            if(viewReplenishmentInformation == 1){
                                userRolePermissions.stockLookupPermissions.viewReplenishmentInformation =  true;                                
                            }
                        }


                        if (key== 'order'){
                           var viewOrder   =   roles.viewOrder?roles.viewOrder:0;
                           var modifyOrder =   roles.modifyOrder?roles.modifyOrder:0;
                           var copyOrder   =   roles.copyOrder ? roles.copyOrder: 0;

                           if(viewOrder == 1 ){
                               userRolePermissions.orderPermissions.viewOrder          =   true;
                           }
                           if(modifyOrder == 1){
                                userRolePermissions.orderPermissions.modifyOrder        =   true;
                           }
                           if(copyOrder == 1){
                                userRolePermissions.orderPermissions.copyOrder        =   true;
                           }
                       }

                       if(key == 'inTransit'){
                           var viewInTransit   =   roles.viewInTransit?roles.viewInTransit:0;
                           var modifyInTransit =   roles.modifyInTransit?roles.modifyInTransit:0;

                           if(viewInTransit == 1){
                               userRolePermissions.orderPermissions.inTransit          =   true;
                           }

                           if(modifyInTransit == 1){
                               userRolePermissions.orderPermissions.modifyInTransit    =   true;
                           }

                       }
                       if(key   ==  'manualReceipt'){
                            var viewmanualReceipt       =   roles.viewmanualReceipt?roles.viewmanualReceipt:0;
                            var executemanualReceipt    =   roles.executemanualReceipt?roles.executemanualReceipt:0;
                            var reverseManualReceipt    =   roles.reverseManualReceipt?roles.reverseManualReceipt:0;
                            var copyManualReceipt       =   roles.copyManualReceipt ? roles.copyManualReceipt : 0;

                            if(viewmanualReceipt    ==  1){
                                userRolePermissions.orderPermissions.viewmanualReceipt      =   true;
                            }

                            if(executemanualReceipt  ==  1){
                                userRolePermissions.orderPermissions.executemanualReceipt    =   true;
                            }

                            if(reverseManualReceipt  ==  1){
                                userRolePermissions.orderPermissions.reverseManualReceipt    =   true;
                            }
                            if(copyManualReceipt == 1){
                                userRolePermissions.orderPermissions.copyManualReceipt      =   true;
                            }
                        }
                          
                       if(key == 'returns'){
                           var viewReturns     =   roles.viewReturns?roles.viewReturns:0;
                           var modifyReturns   =   roles.modifyReturns?roles.modifyReturns:0;
                           var copyReturns     =   roles.copyReturns ? roles.copyReturns:0;

                           if(viewReturns == 1 || modifyReturns == 1){
                               userRolePermissions.orderPermissions.returns            =   true;
                           }

                           if(modifyReturns == 1){
                               userRolePermissions.orderPermissions.modifyReturns      =   true;
                           }

                            if(copyReturns == 1){
                               userRolePermissions.orderPermissions.copyReturns      =   true;
                           }
                       } 

                       if(key == 'transfers'){
                           var viewTransfer    =   roles.viewTransfer?roles.viewTransfer:0;
                           var modifyTransfer  =   roles.modifyTransfer?roles.modifyTransfer:0;
                           var copyTransfer    =   roles.copyTransfer ? roles.copyTransfer :0;

                           if(viewTransfer == 1 ){
                               userRolePermissions.orderPermissions.transfer           =   true;
                           }

                           if(modifyTransfer == 1){
                               userRolePermissions.orderPermissions.modifyTransfer     =   true;
                           }
                           if(copyTransfer == 1){
                               userRolePermissions.orderPermissions.copyTransfer       =   true;
                           }
                       }
                        if (key== 'zCounts'){
                            var viewZcounts     =   roles.viewZcounts?roles.viewZcounts:0;
                            var modifyZcounts   =   roles.modifyZcounts?roles.modifyZcounts:0;
                            if(viewZcounts == 1 || modifyZcounts == 1){
                                userRolePermissions.vcount                              =   true;
                            }
                        }

                        if (key== 'transactionTypes'){
                            var viewTransactionTypes    =   roles.viewTransactionTypes?roles.viewTransactionTypes:0;
                            var modifyTransactionTypes  =   roles.modifyTransactionTypes?roles.modifyTransactionTypes:0;
                            if(viewTransactionTypes == 1 || modifyZcounts == 1){
                                userRolePermissions.settings.viewTransactionTypes       =   true;
                            }
                        }


                        if (key== 'directiveTypes'){
                            var viewDirectiveTypes  =   roles.viewDirectiveTypes?roles.viewDirectiveTypes:0;
                            var modifyDirectiveTypes    =   roles.modifyDirectiveTypes?roles.modifyDirectiveTypes:0;
                            if(viewDirectiveTypes == 1 || modifyDirectiveTypes == 1){
                                userRolePermissions.settings.viewDirectiveTypes         =   true;
                            }       
                        }
                         if (key== 'UOM'){
                            var viewUOM     =   roles.viewUOM?roles.viewUOM:0;
                            var modifyUOM   =   roles.modifyUOM?roles.modifyUOM:0;
                            if(viewUOM == 1 || modifyUOM == 1){
                                userRolePermissions.settings.viewUOM                    =   true;
                            }
                        } 
                        if (key== 'stockingLocations'){
                            var viewStockingLocations   =   roles.viewStockingLocations?roles.viewStockingLocations:0;
                            var modifyStockingLocations =   roles.modifyStockingLocations?roles.modifyStockingLocations:0;
                            if(viewStockingLocations == 1 || modifyStockingLocations == 1){
                                userRolePermissions.settings.viewStockingLocations      =   true;
                            }
                        } 
                        if (key== 'vendors'){
                            var viewVendors =   roles.viewVendors?roles.viewVendors:0;
                            var modifyVendors   =   roles.modifyVendors?roles.modifyVendors:0;
                            if(viewVendors == 1 || modifyVendors == 1){
                                userRolePermissions.settings.viewVendors                =   true;
                            }
                        }

                        if (key== 'replenishmentRules'){
                            var modifyReplenishmentRules    =   roles.modifyReplenishmentRules?roles.modifyReplenishmentRules:0;
                            if(modifyReplenishmentRules == 1){
                                userRolePermissions.settings.modifyReplenishmentRules   =   true;
                            }
                        }

                        if (key== 'reasonCode'){
                            var viewReasonCode              =   roles.viewReasonCode?roles.viewReasonCode:0;
                            var modifyReasonCode            =   roles.modifyReasonCode?roles.modifyReasonCode:0;
                            if(viewReasonCode == 1 || modifyReasonCode == 1){
                                userRolePermissions.settings.viewReasonCode             =   true;
                            }
                        }
                        
                        if (key== 'transactionHistory'){
                            var viewTransactionHistory  =   roles.viewTransactionHistory?roles.viewTransactionHistory:0;
                            if(viewTransactionHistory == 1){
                                userRolePermissions.vlitranhist                         =   true;
                            }
                        }

                        if (key== 'configurations'){
                            var viewConfigurations      =   roles.viewConfigurations?roles.viewConfigurations:0;
                            var modifyConfigurations    =   roles.modifyConfigurations?roles.modifyConfigurations:0;
                            if(viewConfigurations == 1 || modifyConfigurations == 1){
                                userRolePermissions.settings.viewConfigurations         =   true;
                            }
                        }

                        if (key== 'rolePermissions'){
                            var viewRolePermissions     =   roles.viewRolePermissions?roles.viewRolePermissions:0;
                            var modifyRolePermissions   =   roles.modifyRolePermissions?roles.modifyRolePermissions:0;
                            if(viewRolePermissions == 1 || modifyRolePermissions == 1){
                                userRolePermissions.settings.viewRolePermissions         =   true;
                            }
                        }


                        if (key== 'createTransaction'){
                            var modifyCreateTransaction =   roles.modifyCreateTransaction?roles.modifyCreateTransaction:0;
                            if(modifyCreateTransaction == 1){
                                userRolePermissions.vcrtrans                            =   true;
                            }
                        }
                        
                        if (key== 'replenishmentRules'){
                            var modifyReplenishment     =   roles.modifyReplenishment?roles.modifyReplenishment:0;
                            if(modifyReplenishment == 1){
                                userRolePermissions.vreplish                            =   true;
                            }

                            var viewReorderPoint        =   roles.viewReorderPoint?roles.viewReorderPoint:0;
                            var importReplenishmentRules      =   roles.importReplenishmentRules?roles.importReplenishmentRules:0;
                            var changeReplenishmentRules =  roles.changeReplenishmentRules?roles.changeReplenishmentRules:0;
                            if(viewReorderPoint == 1 || (importReplenishmentRules == 1 && changeReplenishmentRules == 1)){
                                userRolePermissions.viewReorderPoint                    =   true;
                            }

                            if(importReplenishmentRules == 1){
                                userRolePermissions.importReplenishmentRules                  =   true;
                            }

                            if(changeReplenishmentRules == 1){
                                userRolePermissions.changeReplenishmentRules                  =   true;
                            }

                            var viewReplenishmentRules  =   roles.viewReplenishmentRules?roles.viewReplenishmentRules:0;
                            if(viewReplenishmentRules == 1 || viewReorderPoint == 1 || importReplenishmentRules == 1 || changeReplenishmentRules == 1){
                                userRolePermissions.viewReplenishmentRules              =   true;
                            }
                            userRolePermissions.restoreRuleDefaultAtStore   =   roles.restoreRuleDefaultAtStore ? roles.restoreRuleDefaultAtStore : 0;
                        }
                        if (key== 'replenishmentFilters'){
                            
                            var runReplenishmentFilters         =   roles.runReplenishmentFilters?roles.runReplenishmentFilters:0;
                            var viewReplenishmentFilters        =   roles.viewReplenishmentFilters?roles.viewReplenishmentFilters:0;
                            var modifyReplenishmentFilters      =   roles.modifyReplenishmentFilters?roles.modifyReplenishmentFilters:0;
                            var createReplenishmentFilters      =   roles.createReplenishmentFilters?roles.createReplenishmentFilters:0;

                            if(viewReplenishmentFilters == 1 || modifyReplenishmentFilters == 1 || createReplenishmentFilters == 1 || runReplenishmentFilters == 1){
                                userRolePermissions.viewReplenishmentFilters            =   true;
                            }

                            if(runReplenishmentFilters == 1){
                                userRolePermissions.runReplenishmentFilters              =   true;
                            }

                            if(modifyReplenishmentFilters == 1){
                                userRolePermissions.modifyReplenishmentFilters          =   true;
                            }

                            if (createReplenishmentFilters == 1) {
                                userRolePermissions.createReplenishmentFilters          =   true;
                            }
                        }
                        if (key== 'reverseReceipt'){
                            var reverseReceipt =   roles.reverseReceipt?roles.reverseReceipt:0;
                            if(reverseReceipt == 1){
                                userRolePermissions.orderPermissions.vreverseReceipt   =   true;
                            }
                        }
                        if (key== 'manualAdjustments'){
                            var viewAdjustments             =   roles.viewAdjustments?roles.viewAdjustments:0;
                            var modifyCreateAdjustments     =   roles.modifyCreateAdjustments?roles.modifyCreateAdjustments:0;
                            var modifyCopyAdjustments       =   roles.modifyCopyAdjustments?roles.modifyCopyAdjustments:0;
                            var modifyReverseAdjustments       =   roles.modifyReverseAdjustments?roles.modifyReverseAdjustments:0;
                           
                            if(viewAdjustments == 1 || modifyCreateAdjustments == 1 ||  modifyReverseAdjustments == 1 ){
                                userRolePermissions.viewAdjust  =   true;
                            }
                            if(modifyCopyAdjustments == 1 ){
                                userRolePermissions.copyAdjustment  =   true;
                            }
                        }
                        
                        if(key== 'purchasePrice'){
                            var purchasePrice   =   roles.viewPurchasePrice ? roles.viewPurchasePrice : 0;
                            if(purchasePrice == 1){
                                userRolePermissions.permissions.viewPurchasePrice    =   true;
                            }
                        }

                        if(key== 'customerOrder'){
                            var viewCustomer        =   roles.viewCustomerOrder ? roles.viewCustomerOrder : 0;
                            var executeCustomer     =   roles.modifyCustomerOrder ? roles.modifyCustomerOrder : 0;
                            var copyCustomer        =   roles.copyCustomerOrder ? roles.copyCustomerOrder : 0;
                            
                            if(viewCustomer == 1 ){
                                userRolePermissions.orderPermissions.viewCustomer    =   true;
                            }
                            if(executeCustomer == 1){
                                userRolePermissions.orderPermissions.executeCustomer    =   true;
                            }
                            if(copyCustomer == 1){
                                userRolePermissions.orderPermissions.copyCustomer    =   true;
                            }
                        }

                        if(key== 'manualShipment'){
                            var viewManualShipment        =   roles.viewManualShipment ? roles.viewManualShipment : 0;
                            var executeManualShipment     =   roles.modifyManualShipment ? roles.modifyManualShipment : 0;
                            var copyManualShipment        =   roles.copyManualShipment ? roles.copyManualShipment : 0;
                           
                            if(viewManualShipment == 1){
                                userRolePermissions.orderPermissions.viewManualShipment    =   true;
                            }
                            if(executeManualShipment == 1){
                                userRolePermissions.orderPermissions.executeManualShipment    =   true;
                            }

                            if(copyManualShipment == 1){
                                userRolePermissions.orderPermissions.copymanualShipment      =   true;
                            }
                        }
                        if(key== 'stockStatusReport'){
                            var viewStockStatusReport        =   roles.viewStockStatusReport ? roles.viewStockStatusReport : 0;
                            if(viewStockStatusReport == 1){
                                userRolePermissions.reportPermission.viewStockStatusReport    =   true;
                            }
                        }
                        if(key== 'balanceReport'){
                            var viewBalanceReport        =   roles.viewBalanceReport ? roles.viewBalanceReport : 0;
                            if(viewBalanceReport == 1){
                                userRolePermissions.reportPermission.viewBalanceReport    =   true;
                            }
                        }
                    });
                    $rootScope.userRolePermissions  =   userRolePermissions;
                }
            }
	    	if(rolesPermissions != {} ){
		 		var role_det 	= 	rolesPermissions;
	    	 		roles_val.vwpuprice 	=	true;

				angular.forEach(role_det, function(roles,key) {
	                if (key== 'purchasePrice'){
	                    if((roles.viewpurchasePrice == 1) ){
	                        roles_val.vwpuprice    =   true;
	                    }  
	                }
	                if ( key  ==  'manualAdjustments' ){
						if( roles.modifyCreateAdjustments == 1 ){
							roles_val.crtAdjust  =  true;
						}
						if( roles.modifyCopyAdjustments == 1 ){
							roles_val.cpyAdjust  =  true;
						}
						if( roles.modifyReverseAdjustments == 1 ){
							roles_val.revAdjust  =  true;
						}
						if( roles.viewAdjustments == 1 ){
							roles_val.viewAdjust  =  true;
						}
					}
					if(key 	==	'transfers'){
						if(roles.ATSFromLocation 	==	1){
							roles_val.viewFrom 	=	true;
						}else{
							roles_val.viewFrom 	=	false;
						}

						if(roles.ATSToLocation 	==	1){
							roles_val.viewTo 	=	true;
						}else{
							roles_val.viewTo 	=	false;
						}
					}
					if(key == 'dashboardReports'){
                        var viewDashboardReports    =   roles.viewDashboardReports?roles.viewDashboardReports:0;
                        if(viewDashboardReports == 1){
                            roles_val.viewDashboardReports    =   true;
                        }else{
                            roles_val.viewDashboardReports    =   false;
                        }
                    }
                    if (key == 'zCounts'){
                        var viewZcounts     =   roles.viewZcounts?roles.viewZcounts:0;
                        var modifyZcounts   =   roles.modifyZcounts?roles.modifyZcounts:0;
                        var validateZones   =   roles.validateZones?roles.validateZones:0;
                        var approveZcounts   =   roles.approveZcounts?roles.approveZcounts:0;
                        if(viewZcounts == 1){
                            roles_val.viewZcounts  =   true;
                        }
                        if(modifyZcounts == 1){
                            roles_val.modifyZcounts  =   true;
                        }
                        if(validateZones == 1){
                            roles_val.validateZones  =   true;
                        }
                        if (approveZcounts) {
                             roles_val.approveZcounts  =   true;
                        }
                    }
				});
				callback(roles_val);

	    	}
        },function(error){
        	console.log('Roles Service Failed');
        });
    	 // roles.crtAdjust  =  true;
    	 // roles.cpyAdjust  =  true;
    	 // roles.revAdjust  =  true;			
    }

    return factory;
});


/**********for Controller use This*********/

// $scope.roles 	=	roleConfigService.getRoles();
// $scope.config 	=	roleConfigService.getConfigurations();

// dependencies 	---- roleConfigService
// module 		 	---- roleConfig