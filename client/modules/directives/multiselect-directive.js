app.directive('multiselectCommon', function () {
    return {
        restrict: 'A',
        replace: 'true',
        scope: {
            items: "=",
            selectedItems: "=",
            naming: "@",
            dynamic:"=",
            content:"=",
            reset : "=",
            prodata: "=",
            functionCall: "&"
        },
        template: "<div class='dropdown offset0 margintLeft15 marginRigth5'  uib-dropdown is-open='status.isopen'>" +
                        "<a  id='multiselectcommon{{naming}}' class='btn btn-default col-md-12 uib-dropdown-toggle'  uib-dropdown-toggle  ng-click='openDropdown($event)' >" +
                            "{{naming}} <span class='caret'></span>" +
                        "</a>" +
                        "<div class='dropdown-menu col-md-12 expertDropList' style='position: absolute;min-width:195px;max-height: 240px;overflow-y: scroll;' >" +
                            "<div class='col-md-12 marginBottom15'>" +
                             "<div class='pull-left'>" +
									 "<input type='checkbox' style='margin:5px 6px;' ng-model='allselected' id='checkall' ng-click='selectAll($event)' ng-init='reset ? selectAll($event) : angular.noop'/>" +
                                "<label id='{{dynamic}}' style='padding-left:3px'>{{allselected ? 'Unselect All' : 'Select All'  }}</label>" +
                                "</div>" +
                            "</div>" +
                            "<div style='padding-left:10px;' data-ng-repeat='item in items track by $index' class='expertDropListBox' ng-click='handleClick($event)'>" +"<label style = 'font-weight:normal;cursor:pointer;' id='current{{item.label?item.label:item.name}}'>"+
                                "<input type='checkbox' style='margin:5px 10px;' ng-model='item.selected' ng-checked='{{item.selected}}' ng-click='clickItem($event)' ng-change='selectItem(item)'  />" +
                                "{{item.label?item.label:item.name}}" +"</label>"+
                            "</div>" +
                        "</div>" +"<div ng-if = '!content' class='col-md-12 expertDropSelectedList' ng-show='selectedItems.length' align='left'>"+
                        "<div class='multiselect_common_drop' ng-repeat='firstItem in selectedItems track by $index'>"+"<label>"+"{{firstItem.label?firstItem.label:firstItem.name}}</label>"+
                            "<a ng-click='removeFirstItem(firstItem)' class='btn expertDropSelectedListClose'>"+"<span class='fa fa-times'></span></a>"+
                        "</div>"+"</div>"+
                    "</div>",

        controller: function ($scope, $timeout,$attrs) {
            $scope.handleClick = function ($event) {
                $event.stopPropagation();

            };
            $scope.status = {
                isopen: false
            };

            
            $scope.status = { isopen: false };

            $scope.openDropdown = function ($event) {
                if ($scope.prodata){
                    $scope.items = $scope.prodata.propertyValue;
                    $scope.selectedItems = $scope.prodata.selectedProperty;
                }
                if ($scope.items != undefined && $scope.items.length > 0) {
                    for (var index = 0; index < $scope.items.length; index++) {
                        $scope.items[index].selected = false;
                    }
                    if ($scope.selectedItems != undefined && $scope.selectedItems.length > 0) {
                        for (var selectedItemIndex = 0; selectedItemIndex < $scope.selectedItems.length; selectedItemIndex++) {
                            for (var itemIndex = 0; itemIndex < $scope.items.length; itemIndex++) {
                                if ($scope.selectedItems[selectedItemIndex].id == $scope.items[itemIndex].id) {
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
                var selectedid=$scope.dynamic;
				if (item.selected == false) {
				    for (var index = 0; index < $scope.selectedItems.length; index++) {
                        if (item.id == $scope.selectedItems[index].id) {
                            item.selected = false;
                            $scope.selectedItems.splice(index, 1);
                            $scope.allselected=false;
                            // document.getElementById(selectedid).innerText = "Select All";
                            break;
                        }
                    }
                } else {
                    $scope.selectedItems.push(item);
                    if($scope.selectedItems.length==$scope.items.length){
                        $scope.allselected=true;
                        // document.getElementById(selectedid).innerText = "Unselect All";
                    }
                    
                }
            };

            $scope.clickItem = function ($event) {
                $event.stopPropagation();
            };

            $scope.closeDropDown = function () {
                $scope.status.isopen = false;
                $event.stopPropagation();
            };

            //For Removing items
            var removeItem = function (items, item) {
                for (var index = 0; index < items.length; index++) {
                    if (item.id == items[index].id) {
                        item.selected = false;
                        $scope.selectItem(item) ;
                        break;
                    }
                }
                if ($scope.dynamic === 'discFilter') {
                    $scope.functionCall();
                }
            };
            $scope.removeFirstItem = function (item) {
                removeItem($scope.selectedItems, item);
            };
			
			$scope.selectAll = function (event, item) {
                 var selectedid=$scope.dynamic;
				if($scope.allselected == true){
					// document.getElementById(selectedid).innerText = "Unselect All";
                    var abc=$scope.items;
                    angular.forEach(abc, function (item) {
                        if(item.selected==false){
                            item.selected = true;
                            $scope.selectItem(item) ;
                                
                        }else{
                        
                             for (var index = 0; index < $scope.selectedItems.length; index++) {
                                if (item.id == $scope.selectedItems[index].id) {
                                    item.selected = false;
                                    $scope.selectedItems.splice(index, 1);
                                    break;
                                }
                            }
                            item.selected = true;
                            $scope.selectItem(item) ;
                        }   
                    });
				}else{
                    $timeout(function(){
                        // document.getElementById(selectedid).innerText = "Select All";
                        var abc=$scope.items;
                        angular.forEach(abc, function (item) {
                            item.selected = false;
                            $scope.selectItem(item) ;
                        });     
                    });				
				}
            };
            $scope.$watch('items', function() {
                if( $scope.selectedItems && $scope.items && $scope.selectedItems.length == $scope.items.length){
                    $scope.allselected=true;
                } 
            });

            $scope.$watch('status.isopen', function(oldValue, newValue) {
                if ( ($scope.dynamic === 'discFilter') && (oldValue === false && newValue === true)) {
                    $scope.functionCall();
                }
            });
        }
    };
});

//Directive in use Html in this Format //

// <div dropdown-multiselect="" items="FirstItems" selected-items="FirstSelectedItems"></div>

//For show thw selected value and removed items //

// <div style="float: left;padding:5px 5px 0px 5px;border:2px solid #efefef; margin-right:2px;" ng-repeat="firstItem in FirstSelectedItems" >
//                                                             <label>
//                                                                         {{firstItem.Name}}</label>
//                                                             <a ng-click="removeFirstItem(firstItem)" ng-hide="moluom">
//                                                                         X</a>
//                                                             <a ng-click="" ng-show="moluom" >
//                                                                     X</a>
//                                                           </div>

// $scope.FirstItems=carrcodes;
//     $scope.FirstSelectedItems = [];

    // var removeItem = function (items, item) {
    //     for (var index = 0; index < items.length; index++) {
    //         if (item.Id == items[index].Id) {
    //             item.selected = false;
    //             items.splice(index, 1);
    //             break;
    //         }
    //     }
    // };
    // $scope.removeFirstItem = function (item) {
    //     removeItem($scope.FirstSelectedItems, item);
    // };