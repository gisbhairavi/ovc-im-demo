'use strict';

/**
 * @ngdoc directive
 * @name izzyposWebApp.directive:adminPosHeader
 * @description
 * # adminPosHeader
 */

angular.module('OVCstockApp')
    .directive('advancedSearch',function() {
        return {
            templateUrl:'modules/directives/advancedSearch/advancedSearch.html',
            // template: "<h2>HAIIIIIII</h2>",
            restrict: 'E',
            controller:'advancedlookupctrl'
        }
    })
    .controller('advancedlookupctrl',function($scope, $state, $http, $stateParams,  $timeout,  Data, ovcDash){
        $scope.dosrchproduct = function(typedthings){
            if(typedthings != '...'){

                var loc_id=null;

                //ovcDash.get('apis/ang_loc_products?srch='+typedthings+'&locid='+loc_id).then(function (data) {barCode
                ovcDash.get('apis/ang_loc_allproducts?srch='+typedthings+'&locid='+ loc_id).then(function (data) {
          
                    if(data.status != 'error'){
                        var rows = [];
                        var allvals = [];
                        angular.forEach(data,function(item) {
                            rows.push(item.ProductTbl.sku+'~'+item.ProductTbl.name+'~'+item.ProductTbl.barCode);
                            if(rows.indexOf(item.ProductTbl.productCode+'~'+item.ProductTbl.styleDescription) == -1)
                                rows.push(item.ProductTbl.productCode+'~'+item.ProductTbl.styleDescription);
                            allvals.push(item.ProductTbl);
                        });
                        $scope.transactions = rows;
                        $scope.allvalues = allvals;
                        if($scope.allvalues[0].sku != undefined){
                            $scope.prData = {};
                            $scope.prData = $scope.allvalues[0];
                        }
                    }

                });
            }
        };
        $scope.rangeValidation = function(){
            $scope.isInvalidRange = {};
            var advancedSearch = $scope.advSearch.advSearchData;
            if ((advancedSearch.toQtyRange && advancedSearch.fromQtyRange) && (advancedSearch.toQtyRange < advancedSearch.fromQtyRange)){
                $scope.isInvalidRange.qty = true;
            }
            else if ((advancedSearch.toQtyRange && advancedSearch.fromQtyRange == null && advancedSearch.fromQtyRange == undefined)) {
                $scope.isInvalidRange.qty = true;
            }
            if ((advancedSearch.toPriceRange && advancedSearch.fromPriceRange) && (advancedSearch.toPriceRange < advancedSearch.fromPriceRange)){
                $scope.isInvalidRange.price = true;
            }
            else if ((advancedSearch.toPriceRange && advancedSearch.fromPriceRange == null && advancedSearch.fromPriceRange == undefined)) {
                $scope.isInvalidRange.price = true;
            }
        };
    });
