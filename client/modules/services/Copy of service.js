app.config(['$httpProvider', function($httpProvider) {
	console.log('rest');
	$httpProvider.defaults.useXDomain = true;	
	 $httpProvider.defaults.withCredentials = true;
	delete $httpProvider.defaults.headers.common['X-Requested-With'];
	$httpProvider.defaults.headers.common["Accept"] = "application/json";
    $httpProvider.defaults.headers.common["Content-Type"] = "application/json";
	
	}
]); 

app.factory('ApiService', function($http) {

  	var OVCstockAPI = {};

    OVCstockAPI.getVendors = function() {
      return $http({
      	method: 'POST', 
      	// url: 'http://demo.greatinnovus.com/ovcdashboard/apis/getall_kedevices',
      	url: 'http://devsar.ovcdemo.com:3000/vendor',
		headers: {
			'Content-Type': 'application/json' , 'Access-Control-Allow-Origin': '*'
		}
      	// url: 'http://ergast.com/api/f1/2013/constructorStandings.json?callback=JSON_CALLBACK'
      });
	 
    }

    OVCstockAPI.getUserDetails = function(id) {
      return $http({
      	method: 'POST', 
      	url: 'http://demo.greatinnovus.com/ovcdashboard/apis/getall_kusers',
		headers: {
			'Content-Type': 'application/json' , 'Access-Control-Allow-Origin': '*'
		}
      	// url: 'http://ergast.com/api/f1/2013/constructorStandings.json?callback=JSON_CALLBACK'
      });
    }
	
	/* OVCstockAPI.TabController = function() {
      return $http({
      	method: 'POST', 
      	// url: 'http://demo.greatinnovus.com/ovcdashboard/apis/getall_kedevices',
      	url: 'http://devsar.ovcdemo.com:3000/vendor/create',
		headers: {
			'Content-Type': 'application/json' , 'Access-Control-Allow-Origin': '*'
		}
      	// url: 'http://ergast.com/api/f1/2013/constructorStandings.json?callback=JSON_CALLBACK'
      });
	 
    } */
	
	

    return OVCstockAPI;
  });