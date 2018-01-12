app.config(['$httpProvider', function($httpProvider) {
	
	$httpProvider.defaults.useXDomain = true;	
	delete $httpProvider.defaults.headers.common['X-Requested-With'];
	
		// $httpProvider.defaults.headers.common["Accept"] = "text/plain";
		$httpProvider.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded; charset=utf-8";
		$httpProvider.defaults.headers.put["Content-Type"] = "application/x-www-form-urlencoded; charset=utf-8";
	}
]); 

// var app = angular.module('myApp', ['ngRoute', 'ngAnimate', 'toaster']);
app.factory("ovcDash", ['$rootScope','Base64', '$http', '$cookieStore',  '$timeout', 'toaster','OVC_CONFIG',
    function ($rootScope, Base64, $http, $cookieStore,  $timeout, toaster, OVC_CONFIG) { // This service connects to our REST API

		var transform = function(data){
			return $.param(data);
		}

        var obj = {};
        obj.toast = function (data) {
            toaster.pop(data.status, "", data.message, 10000, 'trustedHtml');
        }
        obj.get = function (q) {
            console.log($rootScope.URL,'FROMMMM=URL');

            var object  =   {};
            var serviceBase =   $rootScope.serviceChange ? $rootScope.URL+'/cw/resources/partner/'+'ovcdashboard/' : OVC_CONFIG.DASH_PATH;
            var ibmQuery    =   !$rootScope.serviceChange ? '' : $rootScope.ibmQueryString ? '&'+ $rootScope.ibmQueryString : '';

			if ($rootScope.globals.currentUser) {
				$http.defaults.headers.common['Authorization'] = 'bearer ' + $rootScope.globals.currentUser.token; 
			} 
            if($rootScope.serviceChange){
                delete $http.defaults.headers.common['Authorization'];
                object.withCredentials  =   true;
            }
            console.log(object, '--Credentials');

            console.log(serviceBase + q + ibmQuery,'---SERVICE--');
            console.log(serviceBase + q + ibmQuery, object, '--Credentials--With service');

            return $http.get(serviceBase + q + ibmQuery, object).then(function (results) {
                return results.data;
            });
        };
        obj.post = function (q, object) {
            console.log($rootScope.URL,'FROMMMM=URL');

            var serviceBase =   $rootScope.serviceChange ? $rootScope.URL+'/cw/resources/partner/'+'ovcdashboard/' : OVC_CONFIG.DASH_PATH;
            var ibmQuery    =   !$rootScope.serviceChange ? '' : $rootScope.ibmQueryString ? '?'+ $rootScope.ibmQueryString : '';
            var configObj      =   {};
		 	if ($rootScope.globals.currentUser) {
				$http.defaults.headers.common['Authorization'] = 'bearer ' + $rootScope.globals.currentUser.token; 
			} 
            if($rootScope.serviceChange){
                delete $http.defaults.headers.common['Authorization'];
                configObj.withCredentials  =   true;
            }

            console.log(configObj, '--Credentials');

            console.log(serviceBase + q + ibmQuery,'---SERVICE--');

            console.log(serviceBase + q + ibmQuery, object.data,{transformRequest: transform,withCredentials:true}, '--Credentials--With service');
    

            return $http.post(serviceBase + q + ibmQuery, object.data,{transformRequest: transform,withCredentials:true}).then(function (results) {
                return results.data;
            });
        };
        obj.put = function (q, object) {
            console.log($rootScope.URL,'FROMMMM=URL');

            var serviceBase =   $rootScope.serviceChange ? $rootScope.URL+'/cw/resources/partner/'+'ovcdashboard/' : OVC_CONFIG.DASH_PATH;
            var ibmQuery    =   !$rootScope.serviceChange ? '' : $rootScope.ibmQueryString ? '?'+ $rootScope.ibmQueryString : '';

			if ($rootScope.globals.currentUser) {
				$http.defaults.headers.common['Authorization'] = 'bearer ' + $rootScope.globals.currentUser.token; 
			}
            if($rootScope.serviceChange){
                delete $http.defaults.headers.common['Authorization'];
                object.withCredentials  =   true;
            }
            console.log(object, '--Credentials');

            console.log(serviceBase + q + ibmQuery,'---SERVICE--');

            console.log(serviceBase + q + ibmQuery, object, '--Credentials--With service');
            

            return $http.put(serviceBase + q + ibmQuery, object).then(function (results) {
                return results.data;
            });
        };
        obj.delete = function (q) {
            console.log($rootScope.URL,'FROMMMM=URL');
            
            var object  =   {};
            var serviceBase =   $rootScope.serviceChange ? $rootScope.URL+'/cw/resources/partner/'+'ovcdashboard/' : OVC_CONFIG.DASH_PATH;
            var ibmQuery    =   !$rootScope.serviceChange ? '' : $rootScope.ibmQueryString ? '?'+ $rootScope.ibmQueryString : '';

			if ($rootScope.globals.currentUser) {
				$http.defaults.headers.common['Authorization'] = 'bearer ' + $rootScope.globals.currentUser.token; 
			}
            if($rootScope.serviceChange){
                delete $http.defaults.headers.common['Authorization'];
                object.withCredentials  =   true;
            }
            console.log(object, '--Credentials');
            
            console.log(serviceBase + q + ibmQuery,'---SERVICE--');
            console.log(serviceBase + q + ibmQuery,object, '--Credentials--With service');
            
            return $http.delete(serviceBase + q + ibmQuery,object ).then(function (results) {
                return results.data;
            });
        };
		
		obj.SetCredentials = function (username, secret, passwrd, token, token_type,clname,fname,mname,lname,roles,location,language) {
            var authdata = Base64.encode(username + ':' + secret + ':' + passwrd);
            $rootScope.globals = {
                currentUser: {
                    username: username,
					name:clname,
                    authdata: authdata,
                    token: token,
					firstname:fname,
					middlename:mname,
					lastname:lname,
                    roles:roles,
                    location:location,
                    language:language
                }
            };

            $http.defaults.headers.common['Authorization'] = 'bearer ' + token; // jshint ignore:line
            $cookieStore.put('AngUser', $rootScope.globals);
        };
		obj.GetCredentials = function (datastring) {
            var decode_data = Base64.decode(datastring);
			return decode_data;
        };

        obj.ClearCredentials = function () {
            $rootScope.globals = {};
            $cookieStore.remove('AngUser');
            // $http.defaults.headers.common.Authorization = '';
        };

        return obj;
}])
.factory('Base64', function () {
    /* jshint ignore:start */

    var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

    return {
        encode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;

            do {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output +
                    keyStr.charAt(enc1) +
                    keyStr.charAt(enc2) +
                    keyStr.charAt(enc3) +
                    keyStr.charAt(enc4);
                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";
            } while (i < input.length);

            return output;
        },

        decode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;

            // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
            var base64test = /[^A-Za-z0-9\+\/\=]/g;
            if (base64test.exec(input)) {
                window.alert("There were invalid base64 characters in the input text.\n" +
                    "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                    "Expect errors in decoding.");
            }
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            do {
                enc1 = keyStr.indexOf(input.charAt(i++));
                enc2 = keyStr.indexOf(input.charAt(i++));
                enc3 = keyStr.indexOf(input.charAt(i++));
                enc4 = keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }

                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";

            } while (i < input.length);

            return output;
        }
    };

    /* jshint ignore:end */
});