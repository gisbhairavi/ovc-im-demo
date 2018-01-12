/*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module     :   widget Authorization Service
*
*    Developer  :   Sivaprakash
* 
*    Date       :   30/11/2016
*
*    Version    :   1.0
*
**********************************************************************/

angular.module('widgetAuth', []).factory('widgetAuthService', ['$rootScope','$q','OVC_CONFIG','$http', function($rootScope, $q, OVC_CONFIG, $http) {
	var factory 	=	{};
    //For IBM widget ouside check Service
	factory.getIbmAuth 	=	function(token){
        	var deferred = $q.defer();
            var transform = function(data){
                return $.param(data);
            }
            $http.post(OVC_CONFIG.API_PATH +'/getToken',{code:token},{transformRequest: transform}).success(function(data) {
                    deferred.resolve(data);
            });
    	return deferred.promise;
	}
    return factory;
}]);
