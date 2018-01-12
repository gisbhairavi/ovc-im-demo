'use strict';

var app = angular.module('myApp', []);

var app_directives = angular.module('app.directives', []);

//var app_directives = angular.module('OVCstockApp', []);

app_directives.directive('dropdownMultiselect', function(){
   return {
       restrict: 'E',
       scope:{           
            model: '=',
            options: '=',
            pre_selected: '=preSelected'
            
       },
       replace:true,
       template: "<div class='btn-group col-md-12' data-ng-class='{open: open}' style = 'padding:0;'>"+
        "<button class='btn btn-large col-md-10' style = 'background: #fff;border-radius:5px;border: 1px solid #ccc;' data-ng-click='openDropdown()'>Select"+
                "<span class='caret' style = 'float: right;margin: 8px 0;'></span></button>"+
                "<ul class='dropdown-menu col-md-10' aria-labelledby='dropdownMenu' style = 'top: 95%;'>" + 
                    //"<li><a data-ng-click='selectAll()'><i class='icon-ok-sign'></i>  Check All</a></li>" +
                    //"<li><a data-ng-click='deselectAll();'><i class='icon-remove-sign'></i>  Uncheck All</a></li>" +                    
                    //"<li class='divider'></li>" +
                    "<li data-ng-repeat='option in options'><label style = 'font-weight:normal;cursor:pointer;padding:5px 10px;'><input type = 'checkbox' id='{{option.id}}' ng-model = 'option.selected' data-ng-click='setSelectedItem()' style = 'margin:0 5px 0 0;'/>{{option.name}}</label></li>"+
                "</ul>" +
            "</div>" ,
       controller: function($rootScope, $scope, $timeout){
           $scope.open = false;
           $scope.openDropdown = function(){        
                $scope.selected_items = [];
                for(var i=0; i<$scope.pre_selected.length; i++){                        
                  $scope.selected_items.push($scope.pre_selected[i].id);
                }
                $scope.open = !$scope.open;  
            };
           
            $scope.selectAll = function () {
                $scope.model = _.pluck($scope.options, 'id');
            };            
            $scope.deselectAll = function() {
                $scope.model=[];
            };
            $scope.setSelectedItem = function(){
             
                var id = this.option.id;
                if (_.contains($scope.model, id)) {
                    this.option.selected = false;
                    $scope.model = _.without($scope.model, id);
                } else {
                    this.option.selected = true;
                    $scope.model.push(id);
                }
                $scope.open = true;
                return false;
            };
            $scope.isChecked = function (id) {                 
                if (_.contains($scope.model, id)) {
                    return 'icon-ok pull-right';
                }
                return false;
            };   
            
            $rootScope.$on("resetdata", function() {
             
              var newfilter = $scope.model;
              angular.forEach($scope.options, function(data1) {
                angular.forEach(newfilter, function(data) {
                 
                  if(data1.id == data){

                      data1.selected = false;

                  }
                    
                });
              });
              $scope.model=[];
              $scope.open = false;
                 
            });

       }
   } 
});