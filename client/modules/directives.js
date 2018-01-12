/*
 @directive
 @name focus
 @descrption for focusing the element
*/
app.directive('focus', function() {
    return function(scope, element) {
        element[0].focus();
    }
});
/*
 @directive
 @name analytics popup
 @descrption analytics popup link
*/
app.directive('popUp', function() {
    return {
        restrict: 'EA',
        templateUrl: 'views/analytics/popup.html',
        controller: 'popupConreoller',
    };
});
/*
 @directive
 @name stockingLocationsWidget
 @descrption stockingLocationsWidget link to external html
*/
app.directive('stockingLocationsWidget', function() {
    return {
        restrict: 'EA',
        templateUrl: 'modules/directives/advancedStocklookup/stockingLocationsWidget.html',
        link: function(scope, element, attrs) {
            $(element).find('fa').remove();
            
        }
    };
});
 
/*
 @directive
 @name customPopover
 @descrption customPopover with auto hide
*/
app.directive('customPopover', function($compile) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            //For SKU POPOVER
            $('[custom-popover]').popover({
                placement: 'right',
                html: true,
                title: '<a class="close" data-dismiss="alert" style="color:white;opacity: 0.8;">X</a>',
                content: function() {
                    return $compile('<pop-up></pop-up>')(scope);
                }
            }).on('shown.bs.popover', function() {
                var $popup = $(this);
                $(this).next('.popover').find('.close').click(function(e) {
                    $popup.popover('hide');
                });
            });
        }
    };
});
/*
 @directive
 @name stockinglocationsPopover
 @descrption popover for stocking locations
*/
app.directive('stockinglocationsPopover', function($compile,$timeout) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            //For SKU POPOVER
            var CreateTreePopUp = function(data) {
                var stockingLocationsWidgetData = [];
                angular.forEach(data, function(child, index) {
                    //here I'd like to get name of children
                    if (child.parentStockingLocationId) {
                        var prnt = child.parentStockingLocationId;
                    } else {
                        var prnt = '#';
                    }
                    if (!child.isActive) {
                        var active_clss = 'jstree-anchor_inactive';
                    } else {
                        var active_clss = 'jstree-anchor_active';
                    }
                    stockingLocationsWidgetData.push({
                        id: child._id,
                        parent: prnt,
                        text: child.stockingLocationId + ' = ' + child.oh,
                        state: {
                            opened: true
                        },
                        desc: child.stockingLocationDescription,
                        Inactive: active_clss,
                        isactive: child.isActive,
                        locationName: child.locationName,
                        SlocationId: child.stockingLocationId,
                        locationId: child.locationId
                    });
                });
                scope.stockingLocationsWidgetData = [];
                angular.copy(stockingLocationsWidgetData, scope.stockingLocationsWidgetData);
                scope.treeConfig = {
                    core: {
                        multiple: true,
                        animation: false,
                        error: function(error) {
                            $log.error('treeCtrl: error from js tree - ' + angular.toJson(error));
                        },
                        check_callback: true,
                        worker: true
                    },
                    types: {
                        default: {
                            icon: 'glyphicon glyphicon-flash'
                        },
                        star: {
                            icon: 'glyphicon glyphicon-star'
                        },
                        cloud: {
                            icon: 'glyphicon glyphicon-cloud'
                        }
                    },
                    version: 1,
                    // plugins : ['types','checkbox']
                    plugins: ['unique', 'json_data', 'ui', 'dnd']
                };
                scope.reCreateTree = function() {
                    angular.copy(stockingLocationsWidgetData, scope.stockingLocationsWidgetData);
                    scope.treeConfig.version++;
                };
                scope.reCreateTree = function() {
                    angular.copy(stockingLocationsWidgetData, scope.stockingLocationsWidgetData);
                    scope.treeConfig.version++;
                };
                scope.toggle_status = function(state) {
                    scope.stockingLocationsWidgetData.forEach(function(e) {
                        e.state.opened = state;
                    });
                    if (state) {
                        document.getElementsByClassName('treecolap')[0].style.display = 'block';
                        document.getElementsByClassName('treeexpnd')[0].style.display = 'none';
                    } else {
                        document.getElementsByClassName('treecolap')[0].style.display = 'none';
                        document.getElementsByClassName('treeexpnd')[0].style.display = 'block';
                    }
                    scope.reCreateTree();
                }
                scope.pattern = function(e) {
                    var k = e.which || e.keyCode;
                    var k1 = e.key;
                    if ((k > 64 && k < 91) || (k > 96 && k < 123) || k == 8 || (k >= 48 && k <= 57) || (k >= 37 && k <= 40) || k1 == 'Delete' || k == 13) {
                        return;
                    } else {
                        e.preventDefault();
                    }
                }
                $timeout(function() {
                    scope.reCreateTree();
                }, 300);
            }
            CreateTreePopUp(scope.stockingLocationsData);
            var arrowPos    =   {};
            scope.addOnClick = function(event) {
                arrowPos.y_pos  =   event.offsetY
            }
            $(element).popover({
                placement: 'right',
                html: true,
                title: '<span class="text-center">' + scope.ovcLabel.balanceInquiry.treePopover.header + '</span><a class="close" data-dismiss="alert" style="color:white;opacity: 0.8;">X</a>',
                content: function() {
                    return $compile('<stocking-locations-widget></stocking-locations-widget>')(scope);
                }
            }).on('shown.bs.popover', function() {
                $('div.arrow').css('top',parseInt(arrowPos.y_pos) + 64 + 'px')
                var $popup = $(this);
                $(this).next('.popover').find('.close').click(function(e) {
                    $popup.popover('hide');
                });
            });
        }
    };
});
/*
 @controller
 @name popupConreoller
 @descrption popover connected with ng-controller
*/
app.controller('popupConreoller', function($scope, Data, $q) {
    function productService() {
        var differ = $q.defer();
        $scope.popData = {};
        var locArray = [];
        var popupData = $scope.$parent.popup;
        var datasrch = {
            srch: popupData.sku,
            sku: true,
            locid: popupData.locations.join(),
        }
        Data.post('/getProductPerformance', {
            data: datasrch
        }).then(function(SKUdata) {
            if (SKUdata.result) {
                $scope.popData.imgData = SKUdata.result.products[0];
                $scope.popData.qtyData = $scope.popData.imgData.skus[0]
                var received = [{
                    name: "sold",
                    value: $scope.popData.qtyData.totalsold
                }, {
                    name: "reveived",
                    value: $scope.popData.qtyData.totalreceived
                }, {
                    name: "returned",
                    value: $scope.popData.qtyData.totalreturned
                }]
            }
            differ.resolve(received);
        });
        return differ.promise;
    }
    var peoductData = productService();
    peoductData.then(function(CommonData) {
        if (CommonData) {
            var data = CommonData;
            var margin = {
                top: 10,
                right: 20,
                bottom: 10,
                left: 10
            };
            width = 150 - margin.left - margin.right;
            height = width - margin.top - margin.bottom;
            var chart = d3.select("#circularpieChart").html('').append('svg').attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + ((width / 2) + margin.left) + "," + ((height / 2) + margin.top) + ")");
            var radius = Math.min(width, height) / 2;
            var color = d3.scale.ordinal().range(["#1da363", "#4b8bf5", "#dc4933"]);
            var arc = d3.svg.arc().outerRadius(radius).innerRadius(radius - 20);
            var pie = d3.layout.pie().sort(null).startAngle(1.1 * Math.PI).endAngle(3.1 * Math.PI).value(function(d) {
                return d.value;
            });
            var g = chart.selectAll(".arc").data(pie(data)).enter().append("g").attr("class", "arc");
            g.append("path").style("fill", function(d) {
                return color(d.data.name);
            }).transition().delay(function(d, i) {
                return i * 500;
            }).duration(500).attrTween('d', function(d) {
                var i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
                return function(t) {
                    d.endAngle = i(t);
                    return arc(d);
                }
            });
        }
    });
});
/*
 @directive
 @name iphoneView
 @descrption change the html view for adopting iphone
*/
app.directive('iphoneView', function($timeout, $window) {
    return {
        restrict: 'EA',
        controller: function($scope, $element) {
            if ($window.width <= 399 && $element) {
                $($element).addClass('iPhoneViewTable');
                $timeout(function() {
                    var headertext = [],
                        headers = $($element).find("th"),
                        tablerows = $($element).find("th"),
                        tablebody = $($element).first("tbody");
                    for (var i = 0; i < headers.length; i++) {
                        var current = $(headers[i]);
                        headertext.push(' ' + current.text().trim().replace(/\r?\n|\r/, "") + ':');
                    }
                    for (var i = 0, row; row = tablebody.find('tr')[i]; i++) {
                        for (var j = 0, col; col = $(row).find('td')[j]; j++) {
                            col.setAttribute("data-th", headertext[j]);
                            $(col).addClass('iPhoneViewTabledata');
                        }
                    }
                });
            }
        }
    };
});
/*
 @directive
 @name numberConverter
 @descrption parse int the number
*/
app.directive('numberConverter', function() {
    return {
        priority: 1,
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attr, ngModel) {
            function toModel(value) {
                return "" + value; // convert to string
            }

            function toView(value) {
                return parseInt(value); // convert to number
            }

            ngModel.$formatters.push(toView);
            ngModel.$parsers.push(toModel);
        }
    };
});
/*
 @directive
 @name convertToNumber
 @descrption string restriction
*/
app.directive('convertToNumber', function() {
    return {
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
            ngModel.$parsers.push(function(val) {
                return parseInt(val, 10);
            });
            ngModel.$formatters.push(function(val) {
                return '' + val;
            });
        }
    };
});
/*
 @directive
 @name tooltip
 @descrption show hide the tooltip
*/
app.directive('tooltip', function(){
    return {
        restrict: 'A',
        link: function(scope, element, attrs){
            $(element).hover(function(){
                // on mouseenter
                $(element).tooltip('show');
            }, function(){
                // on mouseleave
                $(element).tooltip('hide');
            });
        }
    };
});
/*
 @directive
 @name transactionHistory
 @descrption transaction history view return Button
*/
app.directive('transactionHistory', function($stateParams){
    return{
        restrict:'EA',
        template:"<button class = 'col-md-12 text-left' style = 'padding:10px 15px;' ng-if = 'pageFrom' ng-click = 'backtoTransactionHistory();'>"+
                        "<i class = 'fa fa-arrow-left'></i>"+"  {{translation.buttontypes[0].backtoTransactionHistory}}"+
                    "</button>",
        controller: function($scope){
            $scope.pageFrom =   $stateParams.pageFrom ? true:false;
            $scope.backtoTransactionHistory     = function(){
                window.history.back();
            }
        }
    }
});
/*
 @directive
 @name onlyDigits
 @descrption restrict the string 
*/
app.directive('onlyDigits', function () {
    return {
      require: 'ngModel',
      restrict: 'A',
      link: function (scope, element, attr, ctrl) {
        function inputValue(val) {
          if (val || val == 0) {
            var digits = val.toString().replace(/[^0-9]/g, '');
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
});
/*
 @directive
 @name resize
 @descrption Window resize alignment
*/
app.directive('resize', function ($window) {
   return function (scope, element, attr) {
    var sizeHeight = parseInt(attr.size) + 240;
       var w = angular.element($window);
       scope.getWindowDimensions = function () {
           return {
               'h': w.height(),
           };
       };
       scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
           scope.windowHeight = newValue.h;
           var advancedWidgetHeight = $('#advanced').innerHeight();
           scope.style = function () {
               return {
                   'height': ((newValue.h - sizeHeight) + advancedWidgetHeight) + 'px'
               };
           };

       }, true);

       w.bind('resize', function () {
           scope.$apply();
       });
   }
});
/*
 @directive
 @name ngBlur
 @descrption ngBlur function link with scope function
*/
app.directive('ngBlur', function() {
    return function(scope, elem, attrs) {
        elem.bind('blur', function() {
            scope.$apply(attrs.ngBlur);
        });
    };
});
/*
 @directive
 @name resizeanalytics
 @descrption analytics page resize 
*/
app.directive('resizeanalytics', function ($window) {
    return function (scope, element) {
        var w = angular.element($window);
        scope.getWindowDimensions = function () {
            return {
                'h': w.height(),
                'w': w.width()
            };
        };
        scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
            scope.windowHeight = newValue.h;
            scope.windowWidth = newValue.w;

            scope.style = function () {
                return {
                    'height': (newValue.h - 50) + 'px',
                        // 'width': (newValue.w - 100) + 'px'
                };
            };

        }, true);

        w.bind('resizeanalytics', function () {
            scope.$apply();
        });
    }
});
/*
 @directive
 @name toTop
 @descrption scrollbar movement to top (button) 
*/
app.directive('toTop', function($window) {
    return {
        template: "<button class = 'back-to-top' >&#9650;" + "</button>" + 
        `
            <style>
            to-top{
              position: fixed;
              right: 20px;
              bottom: 20px;
              border-radius: 50%;
              width: 51px;
              height: 51px;
              background-color: #336699;
              color: #ffffff;
              z-index:5;
              opacity: .5;
            }
            to-top .back-to-top{
              background-color: transparent;
              width: 100%;
              height: 100%;
              border: none;
              outline: none;
              color: #ffffff;
            }
            to-top:focus , to-top:hover {
              opacity: 1;
            }
            to-top:active{
              border: none;
              outline: none;
              opacity: 1;
            }
            </style>
        `,
        link: function(scope, element, attr, ctrl) {
            var scrolled = +attr.scrolled||500;
            $(window).scroll(function() {
                if ($(window).scrollTop() > scrolled) {
                    $(element).fadeIn('slow');
                } else {
                    $(element).fadeOut('slow');
                }
            });
            $(element).hide();
            $(element, 'button.back-to-top').click(function() {
                $('html, body').animate({
                    scrollTop: 0
                }, 700);
                return false;
            });
        }
    };
});
/*
 @directive
 @name clickOut
 @descrption out side the click to close the div in html 
*/
app.directive('clickOut', function($document) {
    return {
        restrict: 'A',
        link: function(scope, elem, attr, ctrl) {
            elem.bind('click', function(e) {
                e.stopPropagation();
            });
            $document.bind('click', function() {
                scope.$apply(attr.clickOut);
            })
        }
    }
});