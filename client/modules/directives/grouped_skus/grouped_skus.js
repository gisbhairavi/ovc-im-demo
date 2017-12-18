
angular.module('OVCstockApp')

.directive('onlyDigits', function () {
    return {
      require: 'ngModel',
      restrict: 'A',
      link: function (scope, element, attr, ctrl) {
        function inputValue(val) {
          if (val) {
            var digits = val.replace(/[^0-9]/g, '');
            if (digits !== val) {
              ctrl.$setViewValue(digits);
              ctrl.$render();
            }
            return parseInt(digits,10);
          }
          return undefined;
        }            
        ctrl.$parsers.push(inputValue);
      }
    };
})

.directive('groupedSkus', ['$compile', function ($compile) {
    return {
        restrict: 'EA',
        scope : false,
        replace:true,
        //require: '?parent',
        templateUrl : '/modules/directives/grouped_skus/grouped_skus.html',

        link: function (scope, elem, attrs) {

            //console.log(elem);
            //debugger;
            scope.productDetails	=   JSON.parse(attrs.productDetails);
            scope.productDetails.totalCost			=	attrs.totalCost;
            scope.productDetails.totalQty			=	attrs.totalQty;


            scope.updateParent  =   function(sku_key, product_code) {
                var obj     =   this
                //console.log(this.skus);
                //console.log(scope.asn_details);
                //console.log('**********');
                var asn_details_key     =   Object.keys(scope.asn_details)[0];

                //console.log(product_code);

                scope.asn_details[asn_details_key][0]['po_asn_status'][product_code][sku_key]   =   this.skus;

                //console.log(scope.asn_details);
                //scope.$apply();
            };

            //angular.element(elem.context).focus();
            //scope.$apply();
           // scope.asn_details        =   attrs.asn_details;
        },
    };
}]);
