/*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module     :   Label Service
*
*    Developer  :   Sivaprakash
* 
*    Date       :   09/02/2017
*
*    Version    :   1.0
*
**********************************************************************/

angular.module('OVCstockApp').factory('labelService', ['$rootScope','$q','$http','Data' , function($rootScope, $q, $http,Data) {

	var factory 	=	{};

    //For get label from sql 
    factory.getLabels   =   function(findItPage){
            var lang        =   $rootScope.globals.currentUser['language'];
            var location    =   $rootScope.globals.currentUser['location'];
        	var deferred    =   $q.defer();
            debugger;
            // ovc-all
            // posMClient-grp-all
            // console.log(Data,'DATTTTTTTTTTTTTTTTTTTTTTTTA');
            // console.log(location,'LOCATION');
            var sendObj     =   {'applicationId':'IM','lang':lang,'locationOrGroupId':location};
            debugger;
           if (findItPage===true) {
                sendObj.ModuleId="'findit','customerOrder'";
           }

            Data.post('/json/resources/getResourceLabel',{data:sendObj}).then(function(result) {
                var temp    =   {};
                if(result.data != "error"){
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
                    deferred.reject(temp);
                }
            });
    	return deferred.promise;
	}

    //Resources call From controller 
    factory.getResources   =   function(findItPage){
            var deferred = $q.defer();
                var local   =   factory.getlocal();
                local.then(function(data){
                     data     =    JSON.parse(data);
                    deferred.resolve(data);
                }, function(data){
                    var serviceCall    =    factory.getLabels(findItPage);
                    serviceCall.then(function(data) {
                        data.asnPackage?data.asnPackage.asnStatus['shipped'] = "In Transit":'';
                        console.log('SERVICE--DATA');
                        localStorage.setItem('labelObj', JSON.stringify(data));

                        deferred.resolve(data);
                    },function(response){

                        console.log("Error : localeService");
                        console.log(response);
                        deferred.reject(response.data);
                    });
                });
        return deferred.promise;
    }
    
    //Get LocalStorage factory 
    factory.getlocal    =   function(){
            var deferred = $q.defer();
                var storage     =   localStorage.getItem('labelObj');
                if(!storage){
                    console.log('NOTSTORAGE');
                     deferred.reject('rejected');
                }else{
                    console.log('HAVESTORAGE');
                    deferred.resolve(storage);
                }
        return deferred.promise;
    }
    return factory;
}]);