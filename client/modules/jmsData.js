/***********************************************************************
 *
 * factory:    jmsData.
 *
 * REVISION HISTORY:
 *
 *            Name          Date            Description
 *            ----          ----            -----------
 *            Ratheesh     04/03/2016      First Version
 *
 ***********************************************************************/
app.factory("jmsData", ['$rootScope','$http', 'toaster','Data','OVC_CONFIG',
    function ($rootScope,$http, toaster,Data, OVC_CONFIG) { // This service connects to our REST API
        // var httpbase = OVC_CONFIG.JMS_PATH;
		
		var transform = function(data){
			return $.param(data);
		}
				
        var obj = {};
        obj.get = function (q) {
            return $http.get(httpbase + q);
        };

        obj.post = function (q, object) {
			return Data.post(q, object)
      //       return $http({
						// 	url: httpbase + q,
						// 	method: "POST",
						// 	data: object.data,
						// 	headers: {'Content-Type': 'application/json'}
						// });
        };
		
		obj.publish= function (q, object) {
			return Data.post('/publish', object)
      //       return $http({
						// 	url: httpbase + q,
						// 	method: "POST",
						// 	data: object.data,
						// 	headers: {'Content-Type': 'application/json'}
						// }) 
        };
        return obj;
}]);