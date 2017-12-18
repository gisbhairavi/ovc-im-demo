app.config(['$httpProvider', function($httpProvider) {
	$httpProvider.defaults.useXDomain = true;	
	delete $httpProvider.defaults.headers.common['X-Requested-With'];
	
	$httpProvider.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded; charset=utf-8";
    $httpProvider.defaults.headers.put["Content-Type"] = "application/x-www-form-urlencoded; charset=utf-8";
	}
]); 

// var app = angular.module('myApp', ['ngRoute', 'ngAnimate', 'toaster']);
app.factory("Data", ['$rootScope','$http', 'toaster','OVC_CONFIG','$location','$window',
    function ($rootScope,$http, toaster, OVC_CONFIG, $location,$window) { // This service connects to our REST API
		

		var transform = function(data){
			return $.param(data);
		}
				
        var obj = {};

        obj.toast = function (data) {
            toaster.pop(data.status, "", data.message, 3000, 'trustedHtml');
        }
        obj.get = function (q) {
            console.log($rootScope.URL,'FROMMMM=URL');

        	var serviceBase 	= 	$rootScope.serviceChange ? $rootScope.URL+'/cw/resources/partner': OVC_CONFIG.API_PATH;
        	var object 			=	{};
       		var ibmQuery    	=   !$rootScope.serviceChange ? '' : $rootScope.ibmQueryString ? '&'+ $rootScope.ibmQueryString : '';

			if ($rootScope.globals.currentUser) {
				$http.defaults.headers.common['Authorization'] = 'bearer ' + $rootScope.globals.currentUser.token; 
			}
			if($rootScope.serviceChange){
				delete $http.defaults.headers.common['Authorization'];
				object.withCredentials 	=	true;
			}
			console.log(object, '--Credentials');
			console.log(serviceBase + q + ibmQuery,'---SERVICECALL--');
			console.log(serviceBase + q + ibmQuery,object , '--Credentials--With service')
            return $http.get(serviceBase + q + ibmQuery,object).then(function (results) {
                return results.data;
            });
        };

        obj.post = function (q, object) {
            console.log($rootScope.URL,'FROMMMM=URL');

        	var serviceBase 	= 	$rootScope.serviceChange ? $rootScope.URL+'/cw/resources/partner': OVC_CONFIG.API_PATH;
			var ibmQuery    	=   !$rootScope.serviceChange ? '' : $rootScope.ibmQueryString ? '?'+ $rootScope.ibmQueryString : '';
			var configObj 			=	{};
			if ($rootScope.globals.currentUser) {
				$http.defaults.headers.common['Authorization'] = 'bearer ' + $rootScope.globals.currentUser.token; 
			}
			if($rootScope.serviceChange){
				delete $http.defaults.headers.common['Authorization'];
				configObj.withCredentials 	=	true;
				// $http.defaults.headers.post["Content-Type"] = "multipart/form-data; charset=utf-8";

			}
			console.log(configObj, '--Credentials'); 

			console.log(serviceBase + q + ibmQuery,'---POST--SERVICECALL--');
			console.log(serviceBase + q + ibmQuery, object.data,{transformRequest: transform,withCredentials:true}  , '--Credentials--With service');
            return $http.post(serviceBase + q + ibmQuery, object.data,{transformRequest: transform,withCredentials:true}).then(function (results) {
                return results.data;
            });
        };
        obj.download = function (q, object) {
            console.log($rootScope.URL,'FROMMMM=URL');

        	var serviceBase 	= 	$rootScope.serviceChange ? $rootScope.URL+'/cw/resources/partner': OVC_CONFIG.API_PATH;
			var ibmQuery    	=   !$rootScope.serviceChange ? '' : $rootScope.ibmQueryString ? '?'+ $rootScope.ibmQueryString : '';
			var configObj 			=	{};
			if ($rootScope.globals.currentUser) {
				$http.defaults.headers.common['Authorization'] = 'bearer ' + $rootScope.globals.currentUser.token; 
			}
			if($rootScope.serviceChange){
				delete $http.defaults.headers.common['Authorization'];
				configObj.withCredentials 	=	true;
				// $http.defaults.headers.post["Content-Type"] = "multipart/form-data; charset=utf-8";

			}
			console.log(configObj, '--Credentials'); 
			console.log(serviceBase + q + ibmQuery,'---POST--SERVICECALL--');
			console.log(serviceBase + q + ibmQuery, object.data,{transformRequest: transform,withCredentials:true}  , '--Credentials--With service');
            return $http.post(serviceBase + q + ibmQuery, object.data,{transformRequest: transform,withCredentials:true}).then(function (results) {
                return results.data;
            });
        };
        obj.postjsonupload = function (q, object) {
            console.log($rootScope.URL,'FROMMMM=URL');

        	var serviceBase 	= 	$rootScope.serviceChange ? $rootScope.URL+'/cw/resources/partner': OVC_CONFIG.API_PATH;
        	var ibmQuery    	=   !$rootScope.serviceChange ? '' : $rootScope.ibmQueryString ? '?'+ $rootScope.ibmQueryString : '';
        	var configObj 			=	{};
			if ($rootScope.globals.currentUser) {
				$http.defaults.headers.common['Authorization'] = 'bearer ' + $rootScope.globals.currentUser.token; 
			}
			if($rootScope.serviceChange){
				delete $http.defaults.headers.common['Authorization'];
				configObj.withCredentials 	=	true;
			}
			console.log(serviceBase + q + ibmQuery,'---SERVICECALL--');
			console.log(configObj, '--Credentials');
			console.log(serviceBase + q + ibmQuery,object  , '--Credentials--With service');

            return $http.post(serviceBase + q + ibmQuery,object, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        },configObj).then(function (results) {
                return results;
            });
        };
        obj.put = function (q, object) {
            console.log($rootScope.URL,'FROMMMM=URL');

        	var serviceBase 	= 	$rootScope.serviceChange ? $rootScope.URL+'/cw/resources/partner': OVC_CONFIG.API_PATH;
			var configObj 			=	{}
        	var ibmQuery    	=   !$rootScope.serviceChange ? '' : $rootScope.ibmQueryString ? '?'+ $rootScope.ibmQueryString : '';

			if ($rootScope.globals.currentUser) {
				$http.defaults.headers.common['Authorization'] = 'bearer ' + $rootScope.globals.currentUser.token; 
			}
			if($rootScope.serviceChange){
				// object.data.withCredentials 	=	true;
				configObj.withCredentials 			=	true;
				delete $http.defaults.headers.common['Authorization'];
			}

			console.log(serviceBase + q + ibmQuery,'---SERVICECALL--');
			console.log(configObj, '--Credentials');

			if(object != undefined){
			console.log(serviceBase + q + ibmQuery, object.data,{transformRequest: transform,withCredentials:true}, '--Credentials--With service');
				
				return $http.put(serviceBase + q + ibmQuery, object.data,{transformRequest: transform,withCredentials:true}).then(function (results) {
					return results.data;
				});
			}else{
			console.log(serviceBase + q + ibmQuery,configObj, '--Credentials--With service');
				
				return $http.put(serviceBase + q + ibmQuery,configObj).then(function (results) {
					return results.data;
				});
				
			}
        };
        obj.delete = function (q) {
            console.log($rootScope.URL,'FROMMMM=URL');
        	
        	var serviceBase 	= 	$rootScope.serviceChange ? $rootScope.URL+'/cw/resources/partner': OVC_CONFIG.API_PATH;
        	var object 			=	{};
        	var ibmQuery    	=   !$rootScope.serviceChange ? '' : $rootScope.ibmQueryString ? '?'+ $rootScope.ibmQueryString : '';
        	
			if ($rootScope.globals.currentUser) {
				$http.defaults.headers.common['Authorization'] = 'bearer ' + $rootScope.globals.currentUser.token; 
			}
			
			if($rootScope.serviceChange){
				delete $http.defaults.headers.common['Authorization'];
				object.withCredentials 	=	true;
			}
			console.log(serviceBase + q + ibmQuery,'---SERVICECALL--');
			console.log(serviceBase + q + ibmQuery, object, '--Credentials--With service');
			
            return $http.delete(serviceBase + q + ibmQuery, object).then(function (results) {
                return results.data;
            });
        };
        return obj;
}]);
