'use strict';

/**
 * @ngdoc directive
 * @name izzyposWebApp.directive:adminPosHeader
 * @description
 * # adminPosHeader
 */

angular.module('OVCstockApp')
  .directive('ovcSidebar',['$location',function() {
		return {
		  templateUrl:'modules/directives/sidebar/sidebar.html',
		  restrict: 'E',
		  replace: true,
		 // scope: {
		 // },
		  controller:function($scope){   
			$scope.selectedMenu = 'dashboard';
			$scope.collapseVar = 0;
			$scope.collapseVar1 = 0;
			$scope.multiCollapseVar = 0;
			$scope.collapseVarset=0;
			
			$scope.check1 = function(x){
			  if(x==$scope.collapseVar1)
				$scope.collapseVar1 = 0;
			  else
				$scope.collapseVar1 = x;
			};
			
			 $scope.check_settings = function(x){
			   if(x==$scope.collapseVarset)
				$scope.collapseVarset = 0;
			  else
				$scope.collapseVarset = x;
			}; 
			
			$scope.multiCheck = function(y){
			  
			  if(y==$scope.multiCollapseVar)
				$scope.multiCollapseVar = 0;
			  else
				$scope.multiCollapseVar = y;
			};
			
		  }
		}
	}])
	.directive('filterList', function($timeout) {
    return {
        link: function(scope, element, attrs, $scope) {
            //console.log(element.find('ul'));
            var li = Array.prototype.slice.call(element[0].children);
            var li1 = Array.prototype.slice.call(element.find('ul')[0].children);
            function filterBy(value) {
                li.forEach(function(el) {
                    el.className = el.textContent.toLowerCase().indexOf(value.toLowerCase()) !== -1 ? '' : 'ng-hide';
                });
				li1.forEach(function(el) {
                    el.className = el.textContent.toLowerCase().indexOf(value.toLowerCase()) !== -1 ? '' : 'ng-hide';
					if(el.className == ''){scope.collapseVar = 1; scope.collapseVar1 = 1;
					// angular.element(el.target).parent().addClass('active');
					// el.parent().addClass('active');
					}
                });
            }
			
			
            scope.$watch(attrs.filterList, function(newVal, oldVal) {
                if (newVal !== oldVal) {
                    filterBy(newVal);
                }
            });
        }
    };
})
	.controller('sidebarctrl',function($rootScope,$scope,userRoleConfigService,$window ){
		$scope.sidebardata = {};
		$scope.hover_po    = true;
		$scope.menu_toggle1 = function() {
			//console.log($scope.hover_po);
			var abc=$scope.hover_po;
			if(abc == true){
				$scope.hover_po = !$scope.hover_po;
				document.getElementById('page-wrapper').setAttribute("style","margin:0px;");
			}else{
				$scope.hover_po = !$scope.hover_po;
				document.getElementById('page-wrapper').setAttribute("style","margin:0px 0px 0px 220px;");
			}
		}
		userRoleConfigService.getConfigurations(function(configData){
	        $scope.sidebardata.Config  =   configData;
	    });
	    if($window.width  <= 780){
            $scope.menu_toggle1();
        }
	}); 
 