'use strict';

/**
 * @ngdoc directive
 * @name izzyposWebApp.directive:adminPosHeader
 * @description
 * # adminPosHeader
 */
angular.module('OVCstockApp')
	.directive('headerNotification',function(){
		return {
        templateUrl:'modules/directives/header/header-notification/header-notification.html',
        restrict: 'E',
        replace: true,
    	}
	});	
