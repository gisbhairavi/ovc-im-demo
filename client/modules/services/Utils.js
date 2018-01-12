/*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module     :   Label Service
*
*    Developer  :   Sivaprakash
* 
*    Date       :   23/02/2017
*
*    Version    :   1.0   ** Common Factory Functions **
*    Version    :   2.0   ** Add the Common Services labels, hierarchyLocations , roles & Permisssion **
*
**********************************************************************/
angular.module('Utils',['roleConfig']).factory('Utils', ['$rootScope','$q','$http','Data','roleConfigService','ovcDash' , function($rootScope, $q, $http, Data, roleConfigService, ovcDash) {
	var factory 	    =	{};

    //****Common localStorage get ****//
    factory.checkLocalStorage   =   function(local){
        var deferred = $q.defer();
            var localData   =   localStorage.getItem(local);
            if(!localData){
                deferred.reject('rejected');
            }else{
                deferred.resolve(localData);
            }
        return deferred.promise;
    }

    //****For get label from sql****// 
    factory.getLabels   =   function(){
            var lang        =   $rootScope.globals.currentUser['language'];
            var location    =   $rootScope.globals.currentUser['location'];
            var deferred    =   $q.defer();
            // ovc-all
            // posMClient-grp-all
            var sendObj     =   {'applicationId':'IM','lang':lang,'locationOrGroupId':location}
            $http.post('http://192.168.1.28:8080/json/resources/getResourceLabel',sendObj).then(function(result) {
                var temp    =   {};
                if(result && result.data && !result.error){
                    if(result.data.ResourceLabels.ResourceLabel.length > 0){
                        angular.forEach(result.data.ResourceLabels.ResourceLabel, function(value){
                            if(!temp[value.ModuleId])
                                temp[value.ModuleId]    =   {};
                            if(value.ResourceId){
                                var labelarray     =   value.ResourceId.split('.');
                                if(labelarray.length == 1 )
                                temp[value.ModuleId][value.ResourceId]    =   value.NewDescription ? value.NewDescription : value.DefaultDescription;
                                if(labelarray.length == 2){
                                    if(!temp[value.ModuleId][labelarray[0]])
                                    temp[value.ModuleId][labelarray[0]]     =   {};

                                    temp[value.ModuleId][labelarray[0]][labelarray[1]]       =   value.NewDescription ? value.NewDescription : value.DefaultDescription;
                                }
                                if(labelarray.length == 3){
                                    if(!temp[value.ModuleId][labelarray[1]])
                                    temp[value.ModuleId][labelarray[1]]     =   {};

                                    temp[value.ModuleId][labelarray[1]][labelarray[2]] =   value.NewDescription ? value.NewDescription : value.DefaultDescription; 
                                }
                                if(labelarray.length == 4){
                                    if(!temp[value.ModuleId][labelarray[1]])
                                    temp[value.ModuleId][labelarray[1]]     =   {};

                                    if(!temp[value.ModuleId][labelarray[1]][labelarray[2]])
                                    temp[value.ModuleId][labelarray[1]][labelarray[2]]  =   {};

                                    temp[value.ModuleId][labelarray[1]][labelarray[2]][labelarray[3]]  =   value.NewDescription ? value.NewDescription : value.DefaultDescription;
                                }
                            }
                        });
                        deferred.resolve(temp);
                    }else{
                        deferred.reject(temp);
                    }
                }else{
                    deferred.reject('Label Service Got error / empty');

                }
            });
        return deferred.promise;
    }

	//****Resources call From controller****//
    factory.getResources   =   function(){
            var deferred = $q.defer();
                var local   =   factory.checkLocalStorage('labelObj');
                local.then(function(data){
                     data     =    JSON.parse(data);
                    deferred.resolve(data);
                }, function(data){
                     var serviceCall    =    factory.getLabels();
                     serviceCall.then(function(data) {
                        console.log('SERVICE--DATA');
                        localStorage.setItem('labelObj', JSON.stringify(data));

                        deferred.resolve(data);
                    },function(response){

                        console.log("Error : localeService");
                        console.log(response);
                        deferred.reject(response);
                    });
                });
        return deferred.promise;
    }

    //****Hierarchy location Factory****//
    factory.gethierarchy        =   function(){
        if(!$rootScope.serviceChange){
            var user_detail     =   $rootScope.globals['currentUser'];
            var id_user         =   user_detail['username'];
        }

        var deferred = $q.defer();
        ovcDash.get('apis/ang_hierarchy_locations?usid='+id_user+'&isStore=0').then(function (results) {
            if(results && !results.error){
                deferred.resolve(results);
            }else{
                deferred.reject('rejected'); 
            }
        });
        return deferred.promise;    
    }

    //****Hierarchy location Factory Without User****//
    factory.gethierarchyAll        =   function(){
        var deferred = $q.defer();
        ovcDash.get('apis/ang_hierarchy_locations?isAllLocations=true').then(function (results) {
            if(results && !results.error){
                deferred.resolve(results);
            }else{
                deferred.reject('rejected'); 
            }
        });
        return deferred.promise;    
    }

    //User Location Only (Internal Function)
    factory.getUserLocation        =   function(storeType){
         if(!$rootScope.serviceChange){
            var user_detail     =   $rootScope.globals['currentUser'];
            var id_user         =   user_detail['username'];
        }
        
        var store   =   storeType ? storeType : 0;
        var deferred = $q.defer();
        ovcDash.get('apis/ang_userlocations?usid='+id_user+'&isStore='+store).then(function (results) {
            if(results && !results.error){
                deferred.resolve(results);
            }else{
                deferred.reject('rejected'); 
            }
        });
        return deferred.promise;    
    }

    //All Location (Internal Function)
    factory.getLocation        =   function(){
        var deferred = $q.defer();
        ovcDash.get('apis/ang_getlocations').then(function (results) {
            if(results && !results.error){
                deferred.resolve(results);
            }else{
                deferred.reject('rejected'); 
            }
        });
        return deferred.promise;    
    }

    //****Hierarchy Factory call From Controller****//
    factory.hierarchylocation   =   function(){
        var deferred    =   $q.defer();

        var localStore    =   factory.checkLocalStorage('hierarchylocation');

        localStore.then(function(data){
            data     =    JSON.parse(data);
            deferred.resolve(data);
        }, function(data){
            var serviceCall    =    factory.gethierarchy();
            serviceCall.then(function(data) {
                if(data)
                localStorage.setItem('hierarchylocation', JSON.stringify(data));

                deferred.resolve(data);
            },function(response){

                console.log("Error : hierarchylocation");
                console.log(response);
                deferred.reject(response);
            });
        });
        return deferred.promise;
    }
    //hierarchy without user
    factory.hierarchylocationAll   =   function(){
        var deferred    =   $q.defer();

        var localStore    =   factory.checkLocalStorage('hierarchylocationAll');

        localStore.then(function(data){
            data     =    JSON.parse(data);
            deferred.resolve(data);
        }, function(data){
            var serviceCall    =    factory.gethierarchyAll();
            serviceCall.then(function(data) {
                if(data)
                localStorage.setItem('hierarchylocationAll', JSON.stringify(data));

                deferred.resolve(data);
            },function(response){

                console.log("Error : hierarchylocationAll");
                console.log(response);
                deferred.reject(response);
            });
        });
        return deferred.promise;
    }

    //User Location (Controller Function) 
    factory.userLocation        =   function(storeType){
        var deferred      =   $q.defer();
        var loc           =   storeType ? 'userLocation1' : 'userLocation0';
        var localStore    =   factory.checkLocalStorage(loc);
        localStore.then(function(data){
            data     =    JSON.parse(data);
            deferred.resolve(data);
        }, function(data){
            var serviceCall    =    factory.getUserLocation(storeType);
            serviceCall.then(function(data) {
                if(data)
                localStorage.setItem(loc, JSON.stringify(data));

                deferred.resolve(data);
            },function(response){

                console.log("Error : userLocation");
                console.log(response);
                deferred.reject(response);
            });
        });
        return deferred.promise;
    }

    //Location (Controller Function) 

    factory.location            =   function(){
        var deferred      =   $q.defer();

        var localStore    =   factory.checkLocalStorage('location');

        localStore.then(function(data){
            data     =    JSON.parse(data);
            deferred.resolve(data);
        }, function(data){
            var serviceCall    =    factory.getLocation();
            serviceCall.then(function(data) {
                if(data)
                localStorage.setItem('location', JSON.stringify(data));

                deferred.resolve(data);
            },function(response){

                console.log("Error : location");
                console.log(response);
                deferred.reject(response);
            });
        });
        return deferred.promise;
    }

    //****Roles & Permission Get****//
    factory.getRolesConfiguration     =   function(option){
        var deferred    =   $q.defer();

        //Get Configuration Service Data From RoleConiguration Factory
        if(option === 'config'){
            roleConfigService.getConfigurations (function(configData){
                // console.log('^^^^^^^^^^^^^^^^CONFIGDATA^^^^^^^^^^^^^^^^^^^^^');
                if(configData)
                deferred.resolve(configData);
            });
        }

        //Get Roles Service Data From RoleConiguration Factory
        if(option === 'roles'){
            roleConfigService.getRoles (function(roleData){
                // console.log('^^^^^^^^^^^^^^^ROLECONFIG^^^^^^^^^^^^^^^^^^^');
                if(roleData)
                deferred.resolve(roleData);
            });
        }

        return deferred.promise;
    }

    //****Get Configruation Factory From Controller****//
    factory.configurations     =   function(){
        var deferred      =   $q.defer();

        var localStore    =   factory.checkLocalStorage('configuration');

        localStore.then(function(data){
            // alert('LOCAL');
            data     =    JSON.parse(data);
            deferred.resolve(data);
        }, function(data){
            // alert('SERVICE');
            var serviceCall    =    factory.getRolesConfiguration('config');
            serviceCall.then(function(data) {
                if(data)
                localStorage.setItem('configuration', JSON.stringify(data));

                deferred.resolve(data);
            },function(response){

                console.log("Error : configuration");
                console.log(response);
                deferred.reject(response);
            });
        });
        return deferred.promise;
    }

    //****Get Roles Factory Form Controller****//
    factory.roles     =   function(option){
        var deferred      =   $q.defer();

        var localStore    =   factory.checkLocalStorage('Roles');

        localStore.then(function(data){
            // alert('LOCALSTORAGE');
            data     =    JSON.parse(data);
            deferred.resolve(data);
        }, function(data){
            // alert('SERVICE--ROLES');
            var serviceCall    =    factory.getRolesConfiguration('roles');
            serviceCall.then(function(data) {
                if(data)
                localStorage.setItem('Roles', JSON.stringify(data));

                deferred.resolve(data);
            },function(response){

                console.log("Error : Roles Service");
                console.log(response);
                deferred.reject(response);
            });
        });
        return deferred.promise;
    }

    factory.POCalculation   =   function(skus , upload , store, productDetails, changedSkus , uploadSkus, addedSkus){
        var deferred      =   $q.defer();
        var rejectedSkus  = [];
        ovcDash.get('apis/ang_skus_getproductprice?sku=' + skus + '&loc=' + store).then(function(result) {
            if(result && result.status != 'error' && productDetails){
                    angular.forEach(result,function(costitem){
                        var pridata=costitem.ProductPrice;
                        if(productDetails[pridata.sku]){
                            pridata.quantity= !upload ? changedSkus[pridata.sku] : uploadSkus[pridata.sku] ? uploadSkus[pridata.sku] : uploadSkus[pridata.barcode];
                            addedSkus.push(angular.extend(productDetails[pridata.sku], pridata));
                        }else{
                            rejectedSkus.push(pridata.sku);
                        }
                    });
                    if(rejectedSkus.length > 0){
                        var output = {
                            "status": "error",
                            "message": rejectedSkus.join(',') + "</br> Not available for this Location"
                        };
                        Data.toast(output);
                    }
                    deferred.resolve(addedSkus);
            }else{
                deferred.reject(result.status);  
            }
        }, function(error){
            console.log('ang_skus_getproductprice service Error :' + error);
            deferred.reject(error);  
        });
        return deferred.promise;
    }
    
    /*
        Get storeConfig
        Developer : Ratheesh
        Date: 9.6.2017
    */
    factory.storeConfig = function(loc) {
        var deferred = $q.defer();
        Data.get('/config?locationId=' + encodeURIComponent(loc)).then(function(data) {
            try {
                var config_arr = data;
                var config = {};
                config_arr.config_arr.forEach(function(data) {
                    if (data.featureValue != null && data.featureValue != "") {
                        var edetail = data.featureValue;
                    } else {
                        var edetail = data.defaultValue;
                    }
                    config[data.featureId] = {
                        featureName: data.featureName,
                        featureValue: edetail
                    };
                });
                deferred.resolve(config);
            } catch (err) {
                console.log(err);
                deferred.resolve();
            }
        }, function(response) {
            console.log("Error : Config Service");
            console.log(response);
            deferred.resolve();
        });
        return deferred.promise;
    }
    factory.loadingOn   =   function(){
        $rootScope.$broadcast('cfpLoadingBar:started');
    }
    
	return factory;
}]);