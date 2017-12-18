app.controller('languageController',['$scope', 'translationService', 'OVC_LANGUAGE',
function ($scope, translationService, OVC_LANGUAGE){
	
	$scope.translate = function(){
       translationService.getTranslation($scope, $scope.selectedLanguage);
	};
   
   //Init
   $scope.selectedLanguage = OVC_LANGUAGE.default_lang;
   $scope.translate();
  
  	$scope.check = function(x){
	  if(x==$scope.collapseVar)
		$scope.collapseVar = 0;
	  else
		$scope.collapseVar = x;
	};
}]);