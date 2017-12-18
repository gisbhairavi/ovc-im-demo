/*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module        :   Config/Roles Factory Service
*
*    Developer v1  :   Sivaprakash  

	 Developer v2   : Sivaraman   v2
* 
*    Date          :   19/04/2016
*
**********************************************************************/
app.factory('userRoleConfigService', function($rootScope, Data, ovcDash) {
    var factory = {};
    var config = {};
    var roles = {};
    var poconfig
    var user_detail = $rootScope.globals['currentUser'];
    var id_user = user_detail['username'];
    factory.getConfigurations = function(callback) {
        Data.get('/configbyuser').then(function(results) {
            poconfig = [];
            if ((results != '') && (results.config_arr != undefined)) {
                // config_arr for all config, by Ratheesh (15.7.2016).
                config.config_arr = {};
                
                angular.forEach(results.config_arr, function(data) {
                    if (data.featureValue != null && data.featureValue != "") {
                        var edetail = data.featureValue;
                    } else {
                        var edetail = data.defaultValue;
                    }
                    var newobj = {
                        elementid: data.featureId,
                        elementname: data.featureName,
                        elementdetail: edetail
                    }
                    if ((data.featureType != 'dropdown' && data.featureType!='OrganizationStructureDropDown')) {
                        config.config_arr[data.featureId] = {
                            featureId: data.featureId,
                            featureName: data.featureName,
                            featureValue: edetail == 0 ? false : true
                        }
                    }
                    else {
                         config.config_arr[data.featureId] = {
                            featureId: data.featureId,
                            featureName: data.featureName,
                            featureValue: edetail
                        }
                    }
                    poconfig.push(newobj);
                });
            }
            var configData = poconfig;
            config.action = {};
            config.action.stockPr = {};
            if (configData != undefined && configData != "") {
                angular.forEach(configData, function(corder, key) {
                    if (corder.elementid == "hideTax") {
                        if (corder.elementdetail == 0) {
                            config.puprice = true;
                        } else {
                            config.puprice = false;
                        }
                    }
                    if (corder.elementid == "enableDROPSHIP") {
                        if (corder.elementdetail == 0) {
                            config.action.shdropship = false;
                        } else {
                            config.action.shdropship = true;
                        }
                    }
                    if (corder.elementid == "enableInsights") {
                        if (corder.elementdetail == 0) {
                            config.action.showanalytics = false;
                        } else {
                            config.action.showanalytics = true;
                        }
                    }
                    if (corder.elementid == "hidePurchasePrice") {
                        if (corder.elementdetail == 0) {
                            config.shprice = true;
                        } else {
                            config.shprice = false;
                        }
                    }
                    if (corder.elementid == "enableASNlevel") {
                        if (corder.elementdetail == 0) {
                            config.action.showasn = false;
                        } else {
                            config.action.showasn = true;
                        }
                    }
                    if (corder.elementid == "allGroupingByStyle") {
                        if (corder.elementdetail == 1) {
                            config.showskugroup = true;
                        } else {
                            config.showskugroup = false;
                        }
                    }
                    if (corder.elementid == "productSize") {
                        if (corder.elementdetail == 0) {
                            config.action.stockPr.psize = false;
                        } else {
                            config.action.stockPr.psize = true;
                        }
                    }
                    if (corder.elementid == "productLength") {
                        if (corder.elementdetail == 0) {
                            config.action.stockPr.plength = false;
                        } else {
                            config.action.stockPr.plength = true;
                        }
                    }
                    if (corder.elementid == "productWaist") {
                        if (corder.elementdetail == 0) {
                            config.action.stockPr.pwaist = false;
                        } else {
                            config.action.stockPr.pwaist = true;
                        }
                    }
                    if (corder.elementid == "productColor") {
                        if (corder.elementdetail == 0) {
                            config.action.stockPr.pcolor = false;
                        } else {
                            config.action.stockPr.pcolor = true;
                        }
                    }
                    if (corder.elementid == "productFabric") {
                        if (corder.elementdetail == 0) {
                            config.action.stockPr.pfabric = false;
                        } else {
                            config.action.stockPr.pfabric = true;
                        }
                    }
                    if (corder.elementid == "productSleave") {
                        if (corder.elementdetail == 0) {
                            config.action.stockPr.psleave = false;
                        } else {
                            config.action.stockPr.psleave = true;
                        }
                    }
                    if (corder.elementid == "productFit") {
                        if (corder.elementdetail == 0) {
                            config.action.stockPr.pfit = false;
                        } else {
                            config.action.stockPr.pfit = true;
                        }
                    }
                    if (corder.elementid == "productFirstSeason") {
                        if (corder.elementdetail == 0) {
                            config.action.stockPr.pfseason = false;
                        } else {
                            config.action.stockPr.pfseason = true;
                        }
                    }
                    if (corder.elementid == "productLastSeason") {
                        if (corder.elementdetail == 0) {
                            config.action.stockPr.plseason = false;
                        } else {
                            config.action.stockPr.plseason = true;
                        }
                    }
                         if (corder.elementid == "numberOfSKUByDefaultInNegativeStockBalance") {

                            config.action.stockPr.negativestock = corder.elementdetail;
                    }
                });
            } else {
                config.puprice = true;
                config.shprice = true;
                config.action.showasn = false;
                config.showskugroup = true;
            }
            callback(config);
        }, function(error) {
            console.log('configration service Failed');
        });
    };
    factory.getRoles = function(callback) {
        var rolesPermissions = {};
        if (($rootScope.globals.currentUser != undefined) && ($rootScope.globals.currentUser.roles != undefined)) var roleIds = Object.keys($rootScope.globals.currentUser.roles).toString();
        Data.get('/permissions?roleId=' + roleIds).then(function(resultsData) {
            rolesPermissions = {};
            if ((resultsData) && (resultsData.rolePermissions) && (resultsData.rolePermissions.length > 0)) {
                angular.forEach(resultsData.rolePermissions, function(permissionsData) {
                    if (!rolesPermissions[permissionsData.permGroup]) {
                        rolesPermissions[permissionsData.permGroup] = {};
                    }
                    rolesPermissions[permissionsData.permGroup][permissionsData.permId] = permissionsData.access ? 1 : 0;
                    // console.log(rolesPermissions);
                });
            }
            if (rolesPermissions != {}) {
                var role_det = rolesPermissions;
                // console.log("role_det",role_det);
                var roles_val = {};
                roles_val.vwpuprice = true;
                angular.forEach(role_det, function(roles, key) {
                    if (key == 'purchasePrice') {
                        if ((roles.viewpurchasePrice == 1)) {
                            roles_val.vwpuprice = true;
                        }
                    }
                    if (key == 'manualAdjustments') {
                        if (roles.modifyCreateAdjustments == 1) {
                            roles_val.crtAdjust = true;
                        }
                        if (roles.modifyCopyAdjustments == 1) {
                            roles_val.cpyAdjust = true;
                        }
                        if (roles.modifyReverseAdjustments == 1) {
                            roles_val.revAdjust = true;
                        }
                    }
                    if (key == 'transfers') {
                        if (roles.ATSFromLocation == 1) {
                            roles_val.viewFrom = true;
                        }
                        if (roles.ATSToLocation == 1) {
                            roles_val.viewTo = true;
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
                    if (key== 'zCounts'){
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
        }, function(error) {
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