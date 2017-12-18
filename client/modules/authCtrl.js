app.controller('authCtrl', function ($rootScope, $scope, $state, $routeParams,$window, $cookieStore, $location, $http,OVC_CONFIG, Data, ovcDash ) {

    //initially set those objects to null to avoid undefined error
    $scope.login = {};
    $scope.signup = {};
	ovcDash.ClearCredentials();

	$rootScope.$on("CallParentMethod", function(event,valObj){
       $scope.doLogin(valObj,true);
    });
	
    $scope.doLogin = function (customer,vars) {
        ovcDash.post('apis/ang_loginapi', {
            data: customer
        }).then(function (results) {
            if (results.status == "success") {
				var newObj = {
					clientId: results.userid,
					clientSecret: results.session_id,
					clientName:results.name,
					firstName:results.firstname,
					middleName:results.middlename,
					lastName:results.lastname,
					roles: results.roles,
					location:results.locations,
					language:results.language
				};

				try{
					localStorage.configDateFormat = results.config && results.config.dateformat ? results.config.dateformat : "";
				}catch(error){
					console.log('Dashboard Config Error :' + error );
				}
				
				var transform = function(data){
					return $.param(data);
				}
				
				$http.post(OVC_CONFIG.AUTH_PATH + '/oauth/code', newObj,{transformRequest: transform}).then(function (datas) {
					if(datas.status == 200){
						var authObj = {
							grant_type: "authorization_code",
							code: datas.data.code,
						};
						delete sessionStorage.values;
						
						$http.post(OVC_CONFIG.AUTH_PATH + '/oauth/token',authObj,{transformRequest: transform}).then(function (datas1) {
							ovcDash.SetCredentials(newObj.clientId, newObj.clientSecret,customer.psswrd, datas1.data.access_token.token, datas1.data.token_type,
							newObj.clientName,newObj.firstName,newObj.middleName,newObj.lastName,newObj.roles,newObj.location,newObj.language);
							var success = {"status":"success","message":"Logged in successfully."};
							//Data.toast(success);
							var path = $location.absUrl();
							var paths = path.substring(0, path.lastIndexOf('#/'));
							if(!vars){
								Data.toast(success);
								$window.location.href = paths;
							}
						});
					}else{
						var error = {"status":"error","message":"Your session timed out, please login again."};
						Data.toast(error);
					}
				});
            }else{
				Data.toast(results);
			}
        });
    };
	
	var path = $location.search();

	if($location.path() == '/ovc/findit'){
		var user_obj = {'username':'admin','psswrd':'nimda'};
        $scope.$emit("CallParentMethod", user_obj);
	}
	
	if((path.datastring != '' && path.datastring != undefined)){
		$location.url($location.path());
			
		var datastring = decodeURIComponent((path.datastring+'').replace(/\+/g, '%20'));
		var datalogin = ovcDash.GetCredentials(datastring);
		var dataval = {username:datalogin.split(':')[0],psswrd:datalogin.split(':')[1]};
		$scope.doLogin(dataval);
		
	}
	
	
});
app.controller('LogoutCtrl', function ($rootScope, $routeParams,$location,$window,$timeout,$http,OVC_CONFIG, Data, ovcDash) {
    //initially set those objects to null to avoid undefined error
	if ($rootScope.globals.currentUser) {
			$http.defaults.headers.common['Authorization'] = 'bearer ' + $rootScope.globals.currentUser.token; 
        }
	
	$http.delete(OVC_CONFIG.AUTH_PATH + '/oauth/token').then(function (results) {
		if(results.status == 200){
			var output={"status":"success","message":"Logged Out Successfully"};
			Data.toast(output);	
			ovcDash.ClearCredentials();
			
			$timeout(function() {
				var path = $location.absUrl();
				var paths = path.substring(0, path.lastIndexOf('#/'));
				$window.location.href = paths;	
			}, 300);
			
		}
	});
	
});
app.controller('dashloginCtrl', function ($rootScope, $scope, $routeParams, $window,OVC_CONFIG, ovcDash,Base64) {
	var cdata = $rootScope.globals.currentUser.authdata;
	var dec_data = Base64.decode(cdata);
	
	location.href = OVC_CONFIG.DASH_PATH+'apis/ang_rerd_login?userid='+dec_data.split(':')[0]+'&session_id='+dec_data.split(':')[1]+'&sessp='+dec_data.split(':')[2];
	
});