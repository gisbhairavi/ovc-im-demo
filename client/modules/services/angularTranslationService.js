app.service('translationService', function( $rootScope,$resource) {
	this.getTranslation = function($scope, language) {
		var languageFilePath = 'resources/locales_' + language + '.json';
		
		$resource(languageFilePath).get(function (data) {
			
			$rootScope.translation = data;
		});
	};
});