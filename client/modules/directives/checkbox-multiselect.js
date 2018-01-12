'use strict';

var app_checkbox_dropdown_Multiselect = angular.module('checkboxDropdownMultiselect', []); 
	
app_checkbox_dropdown_Multiselect.directive('checkboxDropdownMultiselect', function () {
	  return {
	      restrict: 'A',
	      scope: {
	          items: "=",
	          selectedItems: "="
	      },
	      template: "<div class='dropdown col-md-1 col-xs-2 col-sm-2 offset0 margintLeft15 marginRigth5'  uib-dropdown is-open='status.isopen'>" +
	                      "<a  class='btn btn-primary uib-dropdown-toggle'  uib-dropdown-toggle  ng-click='openDropdown($event)' >" +
	                          "Add <span class='caret'></span>" +
	                      "</a>" +
	                      "<div class='dropdown-menu expertDropList' style='position: relative;min-width:220px;' >" +
	                          "<div class='col-md-12 marginBottom15'>" +
	                             "<div class='pull-left'>" +
										 "<input type='checkbox' style='margin:5px 6px;' ng-model='allselected' id='checkall' ng-click='selectAll($event)' />" +
	                              "<label id='selectall' style='padding-left:3px'>Select All</label>" +
	                              "</div>" +
	                          "</div>" +
	                          "<div style='padding-left:10px;' data-ng-repeat='item in items' class='expertDropListBox' ng-click='handleClick($event)'>" +
	                              "<input type='checkbox' style='margin:5px 10px;' ng-model='item.selected' ng-checked='{{item.selected}}' ng-click='clickItem($event)' ng-change='selectItem(item)'  />" +
	                              "{{item.Name}}" +
	                          "</div>" +
	                      "</div>" +
	                  "</div>",
	      controller: function ($scope, $timeout) {
	          $scope.handleClick = function ($event) {
	              $event.stopPropagation();
	          };
	          $scope.status = {
	              isopen: false
	          };
	          $scope.status = { isopen: false };
	          $scope.openDropdown = function ($event) {
	              if ($scope.items != undefined && $scope.items.length > 0) {
	                  for (var index = 0; index < $scope.items.length; index++) {
	                      $scope.items[index].selected = false;
	                  }
	                   
	                  if ($scope.selectedItems != undefined && $scope.selectedItems.length > 0) {
	                      for (var selectedItemIndex = 0; selectedItemIndex < $scope.selectedItems.length; selectedItemIndex++) {
	                          for (var itemIndex = 0; itemIndex < $scope.items.length; itemIndex++) {
	                              if ($scope.selectedItems[selectedItemIndex].Id == $scope.items[itemIndex].Id) {
	                                  $scope.items[itemIndex].selected = true;
	                                  break;                                    
	                              }
	                          }
	                      }
	                  }
	              }
	              $event.stopPropagation();
	              $scope.status.isopen = true;
	          };

	          $scope.selectItem = function (item) {
					if (item.selected == false) {
					
	                  for (var index = 0; index < $scope.selectedItems.length; index++) {
	                      if (item.Id == $scope.selectedItems[index].Id) {
	                          item.selected = false;
	                          $scope.selectedItems.splice(index, 1);
	                          break;
	                      }
	                  }
	              } else {
	                  $scope.selectedItems.push(item);
	              }
	          };

	          $scope.clickItem = function ($event) {
	              $event.stopPropagation();
	          };

	          $scope.closeDropDown = function () {
	              $scope.status.isopen = false;
	              $event.stopPropagation();
	          };
				
				$scope.selectAll = function ($event) {
					
					 
					var checksel= document.getElementById("checkall").checked;

					if(checksel){
						document.getElementById("selectall").innerText = "Unselect All";
						var abc=$scope.items;
						 
						 if(sessionStorage.carrierall=="true"){
							  
						   angular.forEach(abc, function (item) {
								if(item.selected==false){
								item.selected = true;
								$scope.selectItem(item) ;
								
								}
								
							});
						} 
						else{
								
								angular.forEach(abc, function (item) {
									if(item.selected==false){
										item.selected = true;
										$scope.selectItem(item) ;
											
									}else{
									
										 for (var index = 0; index < $scope.selectedItems.length; index++) {
											if (item.Id == $scope.selectedItems[index].Id) {
												item.selected = false;
												$scope.selectedItems.splice(index, 1);
												break;
											}
										}
										item.selected = true;
										$scope.selectItem(item) ;
									}	
								});
							
									$timeout(function() {
										angular.element('#carr_detail').trigger('click');
									}, 1);
							
						}
						
						if(sessionStorage.carrierall){
							$timeout(function() {
								angular.element('#carr_detail').trigger('click');
							}, 1);
							
							delete sessionStorage.carrierall;
							
						} 
					
					}else{
						
						document.getElementById("selectall").innerText = "Select All";
						var abc=$scope.items;
						angular.forEach(abc, function (item) {
							item.selected = false;
							$scope.selectItem(item) ;
						});
						
					}
	          };

	      }
	  };
}); 