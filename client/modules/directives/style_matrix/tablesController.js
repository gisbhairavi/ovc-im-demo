var app = angular.module('skuMatrix', []);

app.controller('stylematrixctrl', function($rootScope, $scope, $http, $element, $attrs, $timeout, Data) {
    $scope.skuitems = $scope.styleitems;
    $scope.reorderUpdated = $scope.reorderItems;
    $scope.translation = $rootScope.translation;
    $scope.getpro = {};
    $scope.selected_values = '';
    $scope.changedSkus = {};
    $scope.loadmat = false;
    $scope.hidestyletable   =   true;
    if($scope.reorderUpdated){
        angular.forEach($scope.reorderUpdated,function(value){
                $scope.changedSkus[value.skukey] = value.reordervalue;
        });
    }

    var watchcntrl = $scope.$watch('skuitems', function() {
        $scope.getpro = {};
        $scope.res = {};
        $scope.x_axis_name = '';
        $scope.x_is_color = '';
        $scope.x_axis_values = [];
        $scope.x_axis_length = '';
        $scope.y_axis_name = '';
        $scope.y_is_color = '';
        $scope.y_axis_values = [];
        $scope.y_axis_length = '';
        $scope.final_ar = [];
        $scope.tmp = [];
        if (($scope.skuitems != {}) && ($scope.skuitems != undefined)) {
            // alert($scope.skuitems);
            $scope.loadmat = true;
            $scope.getpro = $scope.skuitems;
            var loc_id = $scope.getpro.locationId;
            if($scope.getpro.page == 'stooklookup'){
                var prod_code = $scope.getpro.styleresult;
            }else{
                if($scope.getpro.styleresult && $scope.getpro.styleresult != undefined && $scope.getpro.styleresult != '')
                var prod_result = $scope.getpro.styleresult.split('~');
                // if($scope.getpro.styleresult && $scope.getpro.styleresult != undefined && $scope.getpro.styleresult != '')
                    // var prod_result = $scope.getpro.result.split('~');
                if($scope.getpro.result && $scope.getpro.result != undefined && $scope.getpro.result != '')
                    var prod_result = $scope.getpro.result.split('~');
                var prod_code = prod_result[0];
            }
            
            var sel_mode = $scope.getpro.mode;

            $scope.selected_values = '';
            //$scope.changedValues    = [];
            // $.LoadingOverlay("show");

            var searchParams    =   {
                locid          : loc_id || '',
                productCode    : prod_code || '',
                mode           : sel_mode || ''
            };

            Data.post('/pomatrixdata',{data:{searchParams:searchParams}}).then(function(response) {
                $timeout(function() {
                    $scope.loadmat = true;
                    if(response && response != ''){
                        if ((response.error == undefined) && ((response.status == undefined) || (response.status != 'error'))) {
                            // if (response.status == undefined ) {
                                var res = response.product;
                                $scope.res = res;

                                var productObj = {
                                    "name": res.name,
                                    "description": res.description,
                                    "img": res.mainImageId || 'http://dummyimage.com/144x285/'
                                };

                                $scope.product = productObj;


                                /***************************************/
                                if(angular.equals(res.productType, 'StyleSizeColor')){
                                    if (((res["x-axis"] != {}) && (res["x-axis"] != undefined)) && ((res["y-axis"] != {}) && (res["y-axis"] != undefined))) {
                                        if(res["x-axis"]["values"] && res["x-axis"]["values"].length > 0){
                                            var x_axis = res["x-axis"], y_axis = res["y-axis"];
                                        }
                                        else{
                                            var x_axis = res["x-axis"], y_axis = res["y-axis"];
                                            x_axis.values.push('Quantity');
                                        }

                                        $scope.x_axis_name = x_axis.name;
                                        $scope.x_is_color = x_axis.isColor;
                                        $scope.x_axis_values = x_axis.values;
                                        $scope.x_axis_length = (y_axis.values.length > 0) ? x_axis.values.length + 2 : x_axis.values.length;


                                        $scope.y_axis_name = y_axis.name;
                                        $scope.y_is_color = y_axis.isColor;
                                        $scope.y_axis_values = y_axis.values;
                                        $scope.y_axis_length = (y_axis.values.length > 0) ? y_axis.values.length + 2 : 0;

                                        var tmp = [],
                                            final_ar = [];
                                        angular.forEach(res.skus, function(value, key) {
                                            var y = (y_axis.values.length > 0) ? value["y-index"] : 0;
                                            if(value["x-index"]){
                                                var x = value["x-index"];
                                            }
                                            else{
                                                var x = 'Quantity';
                                            }

                                            if (!tmp[y])
                                                tmp[y] = [];

                                            value.editedAction = false;
                                            value.indexed_tmp = y + 'aaa' + x;
                                            tmp[y][x] = [];
                                            tmp[y][x].push(value);
                                            if($scope.selsku){
                                                if(value.sku==$scope.selsku){
                                                    $scope.selected_values =value.indexed_tmp;
                                                      if (sel_mode == 'readOnly'){
                                                          $scope.getselectedsku(value.sku,'true');
                                                      }
                                                      if(sel_mode == 'noOH'){
                                                          $scope.getselectedsku(value.sku,res.description);
                                                      }
                                                }
                                            }

                                        });

                                        angular.forEach(y_axis.values, function(y_value, y_key) {
                                            var row_values = [];

                                            if (typeof tmp[y_value] != undefined) {
                                                angular.forEach(x_axis.values, function(x_value, x_key) {

                                                    var oh_values = -1,
                                                        sku = '',
                                                        display = {};

                                                    if (tmp[y_value] != undefined && tmp[y_value][x_value] != undefined) {
                                                        oh_values = tmp[y_value][x_value][0].oh;
                                                        sku = tmp[y_value][x_value][0].sku;
                                                        display = tmp[y_value][x_value][0].display;

                                                    }

                                                    var t_obj = {};

                                                    t_obj.oh = oh_values;
                                                    t_obj.sku = sku;
                                                    t_obj.x_axis = x_value;
                                                    t_obj.display = display;
                                                    t_obj.editedAction = false;
                                                    t_obj.index_values = y_value + 'aaa' + x_value;

                                                    //$scope.changedValues[t_obj.sku].oh= t_obj.oh;
                                                    row_values.push(t_obj);
                                                });
                                            }

                                            final_ar[y_value] = row_values;
                                        });

                                         // $.LoadingOverlay("hide");

                                        $scope.final_ar = final_ar;
                                        $scope.tmp = tmp;

                                        tmp = final_ar = row_values = [];

                                        /***************************************/

                                        $scope.previewItems = function(y, x) {
                                            var tmp = $scope.tmp;
                                            if (tmp[y] != undefined && tmp[y][x] != undefined) {
                                                var res = tmp[y][x][0];

                                                $scope.selected_values = y + 'aaa' + x;

                                                var productObj = {
                                                    "sku": res.sku,
                                                    "name": res.name,
                                                    "description": res.description,
                                                    "img": res.imageURL || $scope.res.mainImageId || 'http://dummyimage.com/144x285/'
                                                };

                                                $scope.product = productObj;
                                                var selsku = {
                                                    sku: productObj.sku
                                                };
                                                $scope.skuitems.sku = selsku;

                                                if (sel_mode == 'readOnly')
                                                    $scope.getselectedsku(productObj.sku,'true');
                                                if(sel_mode == 'noOH')
                                                    $scope.getselectedsku(productObj.sku,productObj.description);

                                            }
                                        };

                                          

                                        // $scope.editItems = function(y, x, index) {

                                        //     // if (y_axis.values.length > 0) {
                                        //     //     $scope.final_ar[y][index].editedAction = !$scope.final_ar[y][index].editedAction || true;
                                        //     // } else {
                                        //     //     $scope.tmp[y][x][index].editedAction = !$scope.tmp[y][x][index].editedAction || true;
                                        //     // }

                                        //     window.setTimeout(function() {
                                        //        // document.getElementById('edit_' + y + '-' + x).focus();
                                        //         $scope.previewItems(y, x);

                                        //     }, 0);
                                        // };

                                        // $scope.hideItems = function(y, x, index, valsku, chanval) {

                                        //     if (y_axis.values.length > 0) {
                                        //         $scope.final_ar[y][index].editedAction = false;
                                        //     } else {
                                        //         $scope.tmp[y][x][index].editedAction = false;
                                        //     }

                                        // };

                                        // To assign Default Reorder Point for the SKUs in focus of the grid cell text box
                                        $scope.getDefaultReorder    =   function(sku){
                                            if($scope.data){
                                                if($scope.data.styleMatrix.styleId){
                                                    if($scope.data.setDefaultReorderStyleMtrixChkbx){
                                                        $scope.data.setDefaultReorderStyleMtrix   =   $scope.data.setDefaultReorderStyleMtrix || 0;
                                                        $scope.changedSkus[sku]     =   $scope.data.setDefaultReorderStyleMtrix;
                                                    }
                                                }
                                            }
                                        };  

                                        // To assign Default Reorder Point for the SKUs by select the default reorder point checkbox
                                        $scope.action.setDefaultReorderStyleMtrix   =   function(){
                                            if($scope.data){
                                                if($scope.data.setDefaultReorderStyleMtrixChkbx){
                                                    $scope.data.setDefaultReorderStyleMtrix   =   $scope.data.setDefaultReorderStyleMtrix || 0;
                                                    if(Object.keys($scope.changedSkus).length > 0){
                                                        angular.forEach($scope.changedSkus, function(reOrdervalue,sku) {
                                                            $scope.changedSkus[sku] =   $scope.data.setDefaultReorderStyleMtrix;
                                                        });
                                                    }
                                                    
                                                }
                                            }
                                        };


                                        $scope.saveVarients = function() {
                                            angular.forEach($scope.changedSkus, function(value, key){
                                                if(value == 0){
                                                    $scope.changedSkus[key]     =   1;
                                                }
                                            });
                                            if(angular.equals({}, $scope.changedSkus)){
                                                var output = {
                                                    "status": "error",
                                                    "message": $scope.ovcLabel.styleMatrix.error.qty_not_empty
                                                };
                                                Data.toast(output);
                                                return false;
                                            }
                                            if (($scope.action != undefined) && (($scope.action.type == 'return') || (($scope.action.type == 'manual') && ($scope.showdata)) )) {
                                                $scope.$parent.getmodifiedsku($scope.changedSkus, $scope.packageIndex);
                                                $scope.changedSkus = {};
                                            } 
                                            else if(($scope.action) && ($scope.action.type == 'manual') && (!$scope.showdata)) {
                                                $scope.$parent.asngetmodifiedsku($scope.changedSkus);
                                                $scope.changedSkus = {};
                                            }
                                            else {
                                                $scope.$parent.getmodifiedsku($scope.changedSkus);
                                                $scope.changedSkus = {};
                                            }

                                        };


                                        $scope.hoverIn = function() {
                                            this.hoverEdit = true;
                                        };
                                        $scope.hoverOut = function() {
                                            this.hoverEdit = false;
                                        };

                                        $scope.loadmat = false;

                                    } else {

                                        var allskus = res.skus;
                                        $scope.showstyle = false;
                                        angular.forEach(allskus, function(sku) {

                                            var selsku = {
                                                sku: sku.sku
                                            };
                                            $scope.skudata(selsku);
                                        });
                                        $scope.loadmat = false;
                                    }
                                }
                                else{
                                    // $.LoadingOverlay("hide");
                                    $scope.hidestyletable   =   false;
                                    var skus    =   {};

                                    //For non StyleSizeColor property type
                                    angular.forEach(res.skus, function(value,key){
                                        skus[value.sku]     =   1;
                                    }); 
                                   if(angular.equals({}, skus)){
                                        var output = {
                                            "status": "error",
                                            "message": $scope.ovcLabel.styleMatrix.error.qty_not_empty
                                        };
                                        Data.toast(output);
                                        return false;
                                    }else{
                                        console.log("skus",skus);
                                        if (($scope.action != undefined) && (($scope.action.type == 'return') || (($scope.action.type == 'manual') && ($scope.showdata)) )) {
                                            $scope.$parent.getmodifiedsku(skus, $scope.packageIndex);
                                            
                                        } 
                                        else if(($scope.action) && ($scope.action.type == 'manual') && (!$scope.showdata)) {
                                            $scope.$parent.asngetmodifiedsku(skus);
                                            
                                        }
                                        else if ($scope.action && $scope.action.type == 'replenishmentRules'){
                                            $scope.$parent.getmodifiedsku(skus, true);
                                        }
                                        else {
                                            $scope.$parent.getmodifiedsku(skus);
                                        }

                                        // var output = {
                                        //     "status": "error",
                                        //     "message": $scope.ovcLabel.styleMatrix.error.add_direct_sku
                                        // };
                                        // Data.toast(output);
                                    }
                                    
                                }
                            // }
                                
                        } else if (response.status && (response.status == 'error')) {
                            // $.LoadingOverlay("hide");
                            $scope.loadmat = false;
                            var output = {
                                "status": "error",
                                "message": response.message
                            };
                            Data.toast(output);
                            return false;
                        }
                        else {
                            // $.LoadingOverlay("hide");
                            $scope.loadmat = false;
                            var output = {
                                "status": "error",
                                "message": $scope.ovcLabel.styleMatrix.error.pomatrix_service
                            };
                            Data.toast(output);
                            return false;
                        }
                    }
                    else{
                        // $.LoadingOverlay("hide");
                        $scope.loadmat = false;
                        var output = {
                            "status": "error",
                            "message": $scope.ovcLabel.styleMatrix.error.pomatrix_service
                        };
                        Data.toast(output);
                        return false;
                    }
                        
                });
            },function(error){
                console.log(error);
                // $.LoadingOverlay("hide");
            });

            watchcntrl();
        }
    });

});

app.directive('ngBlur', function() {
    return function(scope, elem, attrs) {
        elem.bind('blur', function() {
            scope.$apply(attrs.ngBlur);
        });
    };
});

app.directive('onlyDigits', function() {
    return {
        require: 'ngModel',
        restrict: 'A',
        link: function(scope, element, attr, ctrl) {
            function inputValue(val) {
                if (val) {
                    var digits      =   val;
                    if(typeof str == 'string') {
                        digits = val.replace(/[^0-9]/g, '');
                    }
                    if (digits !== val) {
                        ctrl.$setViewValue(digits);
                        ctrl.$render();
                    }
                    return parseInt(digits, 10);
                }
                return undefined;
            }
            ctrl.$parsers.push(inputValue);
        }
    };
});

app.directive('styleMatrix', ['$compile', function($compile) {
    return {
        restrict: 'E',
        //replace: true,
        scope: false,

        templateUrl: 'modules/directives/style_matrix/tables.html',

    };
}]);

app.directive('gridCell', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            changedValues: '=',
            changedSkus: '=',
            hoverEdit: '=',
            gridValue: '=',
            gridX: '=',
            gridY: '=',
            gridIndex: '=',
            gridMode: '=',
            gridSku: '=',
            previewItems: '&',
            hideItems: '&',
            editItems: '&',
            getDefaultReorder: '&'

        },
        templateUrl: 'modules/directives/style_matrix/template/grid.html',
        controller: function($rootScope, $scope, $http, $element, $attrs) { 
            $scope.translation = $rootScope.translation;
			$scope.changeoh	=	function(sku){
				if($scope.changedSkus[sku]	==	undefined){
					delete $scope.changedSkus[sku];
				}
			}
        }

    };
});