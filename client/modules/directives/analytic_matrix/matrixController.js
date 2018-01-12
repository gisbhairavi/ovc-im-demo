var app = angular.module('analyticMatrix', []);

app.controller('analyticmatrixctrl', function($rootScope, $scope, $http, $state, $element, $attrs, $timeout, Data) {
    
    $scope.analyticmatrix =   $scope.$parent.matrixdata;
    $scope.matrix = {};
    $scope.matrix.product = {};
    $scope.matrix.selected_values = '';
    $scope.changedSkus = {};
    $scope.matrix.loadmat = false;
    $scope.matrix.hidestyletable   =   true;
    $scope.matrix.showimage = true;
    $scope.matrix.cellValue = 'sold';
    $scope.matrix.quantities = {};
    $scope.matrix.topquantities = [];

    if($state.current.name      ==  'ovc.Analytics'){
        $scope.matrix.showimage = false;
    }
    $scope.$on("get_analyticmatrix", function(event, message) {
        getstylematrix();
    });

    function getstylematrix(){

        $scope.matrix.res = {};
        $scope.matrix.x_axis_name = '';
        $scope.matrix.x_is_color = '';
        $scope.matrix.x_axis_values = [];
        $scope.matrix.x_axis_length = '';
        $scope.matrix.y_axis_name = '';
        $scope.matrix.y_is_color = '';
        $scope.matrix.y_axis_values = [];
        $scope.matrix.y_axis_length = '';
        $scope.matrix.final_ar = [];
        $scope.matrix.tmp = [];
        if (($scope.$parent.matrixdata.styleitems  && $scope.$parent.matrixdata.styleitems.locationId
            && ($scope.$parent.matrixdata.styleitems.styleresult ||  $scope.$parent.matrixdata.styleitems.result))) {
            $scope.matrix.loadmat = true;
            var prod_result =[];
            if($scope.$parent.matrixdata.styleitems.styleresult ){
                prod_result = $scope.$parent.matrixdata.styleitems.styleresult.split('~');
            }
            if($scope.$parent.matrixdata.styleitems.result ){
                prod_result = $scope.$parent.matrixdata.styleitems.result.split('~');
            }

            var prod_code       = prod_result[0];
            var sel_mode        = $scope.$parent.matrixdata.styleitems.mode;
            var childStore      = $scope.$parent.matrixdata.childStore;

            var searchParams    =   {
                locid       : $scope.$parent.matrixdata.styleitems.locationId || '',
                srch        : prod_code || '',
                mode        : sel_mode || '',
                fromdate    : $scope.$parent.matrixdata.styleitems.startDate || '',
                todate      : $scope.$parent.matrixdata.styleitems.endDate || '',
                module      : 'analytics',
                childstore  : childStore.join(',') || ''
            };

            $scope.matrix.selected_values = '';
            // $.LoadingOverlay("show");
           Data.post('/pomatrixdata',{data:{searchParams:searchParams}}).then(function(response) {

                    $scope.matrix.loadmat = true;

                    if(response && response != ''){
                        if ((response.error == undefined) && ((response.status == undefined) || (response.status != 'error'))) {
                                var quantities = {};
                                quantities.oh = {};
                                quantities.sold = {};
                                quantities.returned = {};
                                quantities.received = {};
                                var res = response.product;
                                $scope.matrix.res = res;
                               
                                var productObj = {
                                    "name": res.name,
                                    "description": res.description,
                                    "img": res.mainImageId || 'http://dummyimage.com/144x285/'
                                };

                                $scope.matrix.product = productObj;

                                if($state.current.name      ==  'ovc.Analytics'){
                                    $scope.$parent.action.product = productObj;
                                }
                               
                                /***************************************/
                                if(angular.equals(res.productType, 'StyleSizeColor')){
                                    if (((res["x-axis"] != {}) && (res["x-axis"] != undefined)) && ((res["y-axis"] != {}) && (res["y-axis"] != undefined))) {
                                        if(res["x-axis"]["values"].length > 0){
                                            var x_axis = res["x-axis"], y_axis = res["y-axis"];
                                        }
                                        else{
                                            var x_axis = res["x-axis"], y_axis = res["y-axis"];
                                            x_axis.values.push(res.description);
                                        }

                                        $scope.matrix.x_axis_name = x_axis.name;
                                        $scope.matrix.x_is_color = x_axis.isColor;
                                        $scope.matrix.x_axis_values = x_axis.values;
                                        $scope.matrix.x_axis_length = (y_axis.values.length > 0) ? x_axis.values.length + 2 : x_axis.values.length;

                                        $scope.matrix.y_axis_name = y_axis.name;
                                        $scope.matrix.y_is_color = y_axis.isColor;
                                        $scope.matrix.y_axis_values = y_axis.values;
                                        $scope.matrix.y_axis_length = (y_axis.values.length > 0) ? y_axis.values.length + 2 : 0;

                                        var tmp = [],
                                            final_ar = [];
                                        var receivedstorevalue = {};
                                        var soldStorevalue =   {};
                                        var returnStorevalue    =   {};
                                        $scope.matrix.returnStore   =   [];
                                        $scope.matrix.soldStore     =   [];
                                        $scope.matrix.receivedStore =   [];

                                        angular.forEach(res.skus, function(value, key) {
                                            var sku     =   value.sku;

                                            var y = (y_axis.values.length > 0) ? value["y-index"] : 0;
                                            if(value["x-index"]){
                                                var x = value["x-index"];
                                            }
                                            else{
                                                var x = res.description;
                                            }

                                            if (!tmp[y])
                                                tmp[y] = [];

                                            value.editedAction = false;
                                            value.indexed_tmp = y + 'aaa' + x;
                                            tmp[y][x] = [];
                                            tmp[y][x].push(value);
                                            if($scope.$parent.matrixdata.styleitems.isSKU){
                                                if(value.sku==$scope.$parent.matrixdata.styleitems.sku){
                                                    $scope.matrix.selected_values =value.indexed_tmp;
                                                      if (sel_mode == 'readOnly'){
                                                          $scope.$parent.matrixdata.getselectedskudata(value);
                                                      }
                                                }
                                            }else{
                                                if(key ==0 ){
                                                    $scope.matrix.selected_values =value.indexed_tmp;
                                                      if (sel_mode == 'readOnly'){
                                                          $scope.$parent.matrixdata.getselectedskudata(value);
                                                      }
                                                }
                                            }

                                            if(value.receiveddata){
                                                receivedstorevalue[sku] = value.receiveddata;
                                            }
                                            if(value.solddata){
                                                soldStorevalue[sku]  =   value.solddata;
                                            }
                                            if(value.returneddata){
                                                returnStorevalue[sku]    = value.returneddata;
                                            }

                                        });

                                        $scope.matrix.receivedStore.push(receivedstorevalue);
                                        $scope.matrix.soldStore.push(soldStorevalue);
                                        $scope.matrix.returnStore.push(returnStorevalue);

                                        angular.forEach(y_axis.values, function(y_value, y_key) {
                                            var row_values = [];

                                            if (typeof tmp[y_value] != undefined) {
                                                angular.forEach(x_axis.values, function(x_value, x_key) {

                                                    var oh_values = -1,sold = returned = received =  0,
                                                        sku = '',
                                                        display = {};

                                                    if (tmp[y_value] != undefined && tmp[y_value][x_value] != undefined) {
                                                        oh_values = tmp[y_value][x_value][0].oh;
                                                        sku = tmp[y_value][x_value][0].sku;
                                                        display = tmp[y_value][x_value][0].display;
                                                        sold = tmp[y_value][x_value][0].sold;
                                                        returned = tmp[y_value][x_value][0].returned;
                                                        received =  tmp[y_value][x_value][0].received;

                                                    }

                                                    var t_obj = {};

                                                    t_obj.oh = oh_values;
                                                    t_obj.sold = sold;
                                                    t_obj.returned = returned;
                                                    t_obj.received = received;
                                                    t_obj.sku = sku;
                                                    t_obj.x_axis = x_value;
                                                    t_obj.display = display;
                                                    t_obj.editedAction = false;
                                                    t_obj.index_values = y_value + 'aaa' + x_value;

                                                    quantities.sold[sku] = sold;
                                                    quantities.oh[sku] =  oh_values;
                                                    quantities.sold[sku] = sold;
                                                    quantities.returned[sku]=returned;
                                                    quantities.received[sku] = received;

                                                    //$scope.changedValues[t_obj.sku].oh= t_obj.oh;
                                                    row_values.push(t_obj);
                                                });
                                            }

                                            final_ar[y_value] = row_values;
                                        });

                                        // $.LoadingOverlay("hide");

                                        $scope.matrix.final_ar = final_ar;
                                        $scope.matrix.tmp = tmp;

                                        tmp = final_ar = row_values = [];

                                       $scope.matrix.quantities = quantities;
                                       $scope.gettopquantities('sold');
                                       $scope.gettopquantities('returned');
                                       $scope.gettopquantities('received');

                                        /***************************************/

                                        $scope.previewItems = function(y, x) {
                                            var tmp = $scope.matrix.tmp;
                                            if (tmp[y] != undefined && tmp[y][x] != undefined) {
                                                var res = tmp[y][x][0];
                                                $scope.matrix.selected_values = y + 'aaa' + x;

                                                var productObj = {
                                                    "sku": res.sku,
                                                    "name": res.name,
                                                    "description": res.description,
                                                    "img": res.imageURL || $scope.matrix.res.mainImageId || 'http://dummyimage.com/144x285/'
                                                };

                                                $scope.matrix.product = productObj;
                                                var selsku = {
                                                    sku: productObj.sku
                                                };
                                                $scope.$parent.matrixdata.styleitems.sku = selsku;

                                                if($state.current.name      ==  'ovc.Analytics'){
                                                    $scope.$parent.action.product = productObj;
                                                }

                                                if (sel_mode == 'readOnly')
                                                    $scope.$parent.matrixdata.getselectedskudata(res);

                                            }
                                        };

                                        $scope.matrix.SelectedInventory = '';

                                        $scope.hoverIn = function(sku) {
                                            $scope.matrix.SelectedInventory = sku;
                                            $scope.matrix.inventoryData1 = {};

                                            if(sku){
                                                if($scope.matrix.cellValue == 'sold') {
                                                    $scope.matrix.showhover=true;

                                                    $scope.matrix.inventoryData1 = $scope.matrix.soldStore[0][sku];
                                                }
                                                else if($scope.matrix.cellValue == 'received') {
                                                    $scope.matrix.showhover=true;

                                                    $scope.matrix.inventoryData1 =  $scope.matrix.receivedStore[0][sku];
                                                 }
                                                else if($scope.matrix.cellValue == 'returned') {
                                                    $scope.matrix.showhover=true;

                                                    $scope.matrix.inventoryData1 =  $scope.matrix.returnStore[0][sku];
                                                 }

                                                $scope.matrix.invavaillength = Object.keys($scope.matrix.inventoryData1).length;  
                                            }
                                        };

                                        $scope.hoverOut = function() {
                                            $scope.matrix.SelectedInventory = '';
                                        };

                                        $scope.matrix.loadmat = false;

                                    } else {

                                        var allskus = res.skus;
                                        $scope.showstyle = false;
                                        angular.forEach(allskus, function(sku) {

                                            var selsku = {
                                                sku: sku.sku
                                            };
                                            $scope.skudata(selsku);
                                        });
                                        $scope.matrix.loadmat = false;
                                    }
                                }
                                else{
                                    // $.LoadingOverlay("hide");
                                    $scope.matrix.hidestyletable   =   false;
                                    angular.forEach(res.skus, function(value,key){
                                        $scope.$parent.matrixdata.getselectedskudata(value);
                                    }); 
                                }

                        } 
                        else if (response.status && (response.status == 'error')) {
                            // $.LoadingOverlay("hide");
                            $scope.matrix.loadmat = false;
                            var output = {
                                "status": "error",
                                "message": response.message
                            };
                            Data.toast(output);
                            return false;
                        }
                        else {
                            // $.LoadingOverlay("hide");
                            $scope.matrix.loadmat = false;
                            var output = {
                                "status": "error",
                                "message": "Unable to Find the  pomatrixdata Service "
                            };
                            Data.toast(output);
                            return false;
                        }
                    }
                    else{
                        // $.LoadingOverlay("hide");
                        $scope.matrix.loadmat = false;
                        var output = {
                            "status": "error",
                            "message": "Unable to Find the  pomatrixdata Service "
                        };
                        Data.toast(output);
                        return false;
                    }
                        
            },function(error){
                console.log(error);
                // $.LoadingOverlay("hide");
            });
        }
    };

    $scope.gettopquantities = function(balance){

        var quantities    = $scope.matrix.quantities;
        var topquantities = [];
        var newarray      = [];
        angular.forEach(quantities[balance], function(value, key) {
            if(newarray.indexOf(value) < 0){
               newarray.push(value);
            }
        });
        newarray.sort(function(a, b){return b-a});

        var topfive =  newarray.slice(0,5);
        var index = topfive.indexOf(0);
        if (index > -1) {
            topfive.splice(index, 1);
        }
        $scope.matrix.topquantities = topfive;
    };

});

app.directive('analyticMatrix', ['$compile', function($compile) {
    return {
        restrict: 'E',
        scope:true,
        controller:'analyticmatrixctrl',
        templateUrl: 'modules/directives/analytic_matrix/matrix.html',

    };
}]);

app.directive('skuCell', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            changedValues: '=',
            changedSkus: '=',
            hoverEdit: '=',
            gridValue: '=',
            gridBalance:'=',
            gridX: '=',
            gridY: '=',
            gridIndex: '=',
            gridMode: '=',
            gridSku: '=',
            previewItems: '&'
        },
        templateUrl: 'modules/directives/analytic_matrix/template/cells.html',
        controller: function($rootScope, $scope, $http, $element, $attrs) { 
           // $scope.translation = $rootScope.translation;
			$scope.changeoh	=	function(sku){
				if($scope.changedSkus[sku]	==	undefined){
					delete $scope.changedSkus[sku];
				}
			}
        }

    };
});