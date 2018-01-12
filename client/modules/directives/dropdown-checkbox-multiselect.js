'use strict';

var app = angular.module('myApp', []);

var app_directives_checkbox = angular.module('app.checkboxdirectives', []);

app_directives_checkbox.directive('dropdownCheckboxMultiselect',['$document', function($document){
   return {
       restrict: 'E',
       scope:{           
            model: '=',
            options: '=',
            pre_selected: '=preSelected',
            place_holder:'=placeHolder',
            screen:'@'
       },
       link: function(scope, elem, attr, ctrl) {
    	   elem.bind('click', function(e) {
 	        e.stopPropagation();
	      });
    	   $document.bind('click', function(e) {   
    		 scope.open = false;
    		 scope.$apply(scope.open);
    	   })
    	 },
       template: "<div class='btn-group col-md-10 col-sm-12 col-xs-12' data-ng-class='{open: open}' style = 'padding:0;'>"+
        "<input class='form-control col-md-10' placeholder='{{place_holder}}' style = 'background: #fff;border-radius:5px;border: 1px solid #ccc;' ng-model='searchVal' ng-click='openDropdown(screen_type);'>"+
                "<span class='fa fa-caret-down' ng-class='{\"fa-caret-up\" : open, \"fa-caret-down\" : ! open}' style='position: absolute; right: 10px; top: 10px;'></span>"+
                "<ul class='dropdown-menu col-md-12' aria-labelledby='dropdownMenu' style = 'top: 95%;max-height:300px;overflow:auto;'>" + 
                    "<span ng-if='options.length>0'><li><label style = 'font-weight:normal;cursor:pointer;padding:5px 10px;'><input type = 'checkbox' ng-model = 'selectAllVal' ng-disabled='!options.length>0' data-ng-click='selectAllCheckBox(selectAllVal)' style = 'margin:0 5px 0 0;'/>Select All</label></li>" +                 
                    "<li class='divider'></li>" +
                    "<li data-ng-repeat='option in options | filter:searchVal'><label style = 'font-weight:normal;cursor:pointer;padding:5px 10px;'><input type = 'checkbox'  ng-model = 'option.selected' data-ng-click='setSelectedItem()' style = 'margin:0 5px 0 0;'/>{{option.name}}</label></li></span>"+
                    "<span ng-if='options.length==0'><li><label style = 'font-weight:normal;cursor:pointer;padding:5px 10px;'> No Records Found</label></li></span>" + 
                "</ul>" +
            "</div>" ,
       controller: function($scope){
           $scope.open = false;
           $scope.openDropdown = function(){   
               if($scope.screen == 'add'){
            	   $scope.selectAllVal = false;
               		$scope.screen = '';
               }else{
                    if ($scope.options && $scope.options.length > 0 && $scope.pre_selected&& $scope.pre_selected.length > 0) {
                        for (var selectedValueIndex = 0; selectedValueIndex < $scope.pre_selected.length; selectedValueIndex++) {
                            for (var valueIndex = 0; valueIndex < $scope.options.length; valueIndex++) {
                                if ($scope.pre_selected[selectedValueIndex].id == $scope.options[valueIndex].id) {
                                    $scope.options[valueIndex].selected = true;                                  
                                }
                            }
                        }
                    }
               }
                 
                $scope.open = !$scope.open;  
            };
           
            $scope.selectAllCheckBox = function (selected) {
            	angular.forEach($scope.options, function(item, key){
            		item.selected	=	selected;
            		 
            	});
                //$scope.model = _.pluck($scope.options, 'id');
            };     
             
            $scope.setSelectedItem = function(){
//                var id = this.option.id;
//                if (_.contains($scope.model, id)) {
//                    $scope.model = _.without($scope.model, id);
//                } else {
//                    $scope.model.push(id);
//                }
            	$scope.selectAllVal = false;
                $scope.open = true;
                return false;
            };
                                      
       }
   } 
}]);