var app = angular.module('OVCstockApp', ['ui.bootstrap.treeview', 'skuMatrix']);
/* Popover for Inventory Details  By Jegan*/
app.directive('invetoryDetails', function() {
    return {
        restrict: 'E',
        scope: true,
        templateUrl: 'invDetails.html'
    };
})
app.controller('stockbalancesCtrl', function($rootScope, $scope, $state, $http, $stateParams, $timeout, Data, ovcDash, SLPSTYLE, SLPSIZE, SLPCOLOUR, RULEDEFN, PRICELIST, DOCUMENTRULE, system_currencies, $compile, TreeViewService, jmsData, OVC_CONFIG, Utils) {
    var user_detail = $rootScope.globals['currentUser'];
    var id_user = user_detail['username'];
    $scope.loadmat = false;
    $scope.action = {};
    $scope.ship = {};
    /****from configuration******/
    var price_con = PRICELIST;
    var trule_con = RULEDEFN;
    var drule_con = DOCUMENTRULE;
    var tlab_bal = $scope.ovcLabel.stockBalance.transrules;
    var balance1 = [];
    var balance2 = [];
    var balance3 = [];
    var balance31 = [];
    var balance32 = [];
    var balance4 = [];
    var balance1id = [];
    var balance2id = [];
    var balance3id = [];
    var trlist = [];
    var trdata = {};
    var trinobj = [];
    var stockbalanceselected = [];
    $scope.stockbalanceselected = [];
    angular.forEach(trule_con, function(trules, key) {
        angular.forEach(trules, function(trules2, key2) {
            angular.forEach(trules2, function(item) {
                item.title = tlab_bal[item.Name];
                item.parent2 = 'slpall';
                if ((key2 == 'BALFIELDS') || (key2 == 'HELDSTOCK')) {
                    item.selected = true;
                    item.parent1 = 'slpbalance';
                    stockbalanceselected.push(item);
                    balance1.push(item);
                    balance1id.push(item.id);
                }
                if ((key2 == 'CALCFIELDS')) {
                    item.selected = false;
                    item.parent1 = 'slpcalc';
                    stockbalanceselected.push(item);
                    balance2.push(item);
                    balance2id.push(item.id);
                }
            });
        });
    });
    $scope.stockbalanceselected = stockbalanceselected;
    $scope.balancefields1 = balance1;
    $scope.balancefields2 = balance2;
    $scope.balanceids1 = balance1id;
    $scope.balanceids2 = balance2id;
    angular.forEach(drule_con, function(drules, key) {
        angular.forEach(drules, function(drules2, key2) {
            angular.forEach(drules2, function(item) {
                item.title = tlab_bal[item.Name];
                item.parent1 = 'slpdocs';
                item.parent2 = 'slpall';
                item.selected = false;
                if ((key2 == 'GOODSIN')) {
                    balance31.push(item);
                }
                if ((key2 == 'GOODSOUT')) {
                    balance32.push(item);
                }
                balance3.push(item);
                balance3id.push(item.id);
            });
        });
    });
    $scope.balancefields31 = balance31;
    $scope.balancefields32 = balance32;
    $scope.balancefields3 = balance3;
    $scope.balanceids3 = balance3id;
    var currensymbs = $scope.ovcLabel.global.currency;
    var currcodes = system_currencies[0];
    $scope.currency = currensymbs[currcodes.code];
    angular.forEach(price_con, function(item) {
        item.title = tlab_bal[item.Name];
        item.selected = true;
        balance4.push(item);
    });
    console.log($scope);
    $scope.storeData = {};
    $scope.balancefields4 = balance4;
    $scope.open = false;
    $scope.openDropdown = function() {
        $scope.open = !$scope.open;
    };
    $scope.getStores = function() {
        Utils.hierarchylocation().then(function(results){
            $scope.storeLocData = TreeViewService.getLocData(results);
            TreeViewService.toggleAll($scope.storeLocData[0]);
            TreeViewService.selectNode($scope.storeLocData[0]);
            $scope.locationDisplayName  =   $scope.storeLocData[0].name;
            $scope.ship.locationId      =   $scope.storeLocData[0].id;
            $scope.stock_product($scope.storeLocData[0].id);
            var loc = {};
            if (results) {
                if (results.hierarchy) {
                    for (var j = 0, length2 = results.hierarchy.length; j < length2; j++) {
                        loc[results.hierarchy[j].id] = results.hierarchy[j].name;
                    }
                }
            }
            $timeout(function() {
                $scope.storeData = loc;
            });
        }, function(error){
            console.log('Hierarchy Location Error : '+ error);
        });
    };
    $scope.getStores();
    $scope.stockbalancesData = [];
    $scope.stockbalances = function(stockExport) {
        var selectedSku = '';
        var prName = '';
        if ($scope.ship.result) {
            var selects = $scope.ship.result.split('~');
            prName = selects[1];
            selectedSku = selects[0];
        }
        if ($scope.ship.styleresult) {
            var selects = $scope.ship.styleresult.split('~');
            prName = selects[1];
            selectedSku = selects[0];
        }
        var stockExport = {
            balanceType: [],
            locations: [],
            sku: selectedSku
        };
        for (var j = 0, length2 = $scope.stockbalanceselected.length; j < length2; j++) {
            $scope.stockbalanceselected[j].selected ? stockExport.balanceType.push($scope.stockbalanceselected[j].label) : '';
        }
        stockExport.locations.push($scope.ship.locationId);
        Data.post('/stockbalances', {
            data: stockExport
        }).then(function(results) {
            if (results.status === 'success') {
                var stockbalancesData = results.result;
                if (stockbalancesData && stockbalancesData.stockUpdate && stockbalancesData.stockUpdate.length) {
                    var result = JSON.stringify(stockbalancesData);
                    if (stockExport) {
                        if (!OVC_CONFIG.JMS_QUEUESTOCKEXPORT) {
                            console.log("******Queue name undefined - Stock Export");
                        }
                        else {
                            Data.post('/jmspublish/' + OVC_CONFIG.JMS_QUEUESTOCKEXPORT, {
                                data: {
                                    data: result
                                }
                            }).then(function(data) {
                                if (data.data) {
                                    try {
                                        data.data = JSON.parse(data.data);
                                        var output = {
                                            "status": "success",
                                            "message": data.data[0] == 'Success' ? "Export Successful" : data.data[0]
                                        };
                                    } catch (e) {
                                        var output = {
                                            "status": "success",
                                            "message": data.data
                                        };
                                    }
                                    return Data.toast(output);
                                }
                                var output = {
                                    "status": "error",
                                    "message": $scope.ovcLabel.stockBalance.toast.exportError
                                };
                                Data.toast(output);
                            });
                        }
                    }
                    var data = [];
                    for (var j = 0, length2 = stockbalancesData.length; j < length2; j++) {
                        var balancesData = {};
                        balancesData.SKU = stockbalancesData[j].sku;
                        balancesData.location = $scope.storeData[stockbalancesData[j].locationId];
                        stockbalancesData[j].balanceTypeQty.forEach(function(balanceTypeQty, n) {
                            // balancesData[balanceTypeQty.balanceType.toUpperCase()] = balanceTypeQty.value;
                            balancesData[balanceTypeQty.balanceType] = balanceTypeQty.value;
                        });
                        data.push(balancesData);
                    }
                    $scope.stockbalancesData = stockbalancesData;
                    $scope.fillTableElements(data);
                }
                // if ($scope.stockbalancesData.length) {
                //     var result = JSON.stringify($scope.stockbalancesData);
                //     if (stockexport) {
                //         Data.post('/jmspublish/' + OVC_CONFIG.JMS_QUEUESTOCKEXPORT, {
                //             data: {
                //                 data: result
                //             }
                //         }).then(function(data) {
                //             if (data.data) {
                //                 var output = {
                //                     "status": "success",
                //                     "message": data.data[0] == 'Success' ? "Export Successful" : data.data[0]
                //                 };
                //               return  Data.toast(output);
                //             }
                //             var output = {
                //                 "status": "error",
                //                 "message": "Export Error"
                //             };
                //             Data.toast(output);
                //         });
                //     }
                //     var data = [];
                //     for (var j = 0, length2 = $scope.stockbalancesData.length; j < length2; j++) {
                //         var balancesData = {};
                //         balancesData.SKU = $scope.stockbalancesData[j].sku;
                //         balancesData.location = $scope.stockbalancesData[j].locationId;
                //         $scope.stockbalancesData[j].balanceTypeQty.forEach(function(balanceTypeQty, n) {
                //             // balancesData[balanceTypeQty.balanceType.toUpperCase()] = balanceTypeQty.value;
                //             balancesData[balanceTypeQty.balanceType] = balanceTypeQty.value;
                //         });
                //         data.push(balancesData);
                //     }
                //     $scope.fillTableElements(data);
                // } 
                else {
                    var output = {
                        "status": "error",
                        "message": $scope.ovcLabel.stockBalance.toast.error
                    };
                    Data.toast(output);
                }
            } else {
                var output = {
                    "status": "error",
                    "message": $scope.ovcLabel.stockBalance.toast.error
                };
                Data.toast(output);
            }
        });
    };
    $scope.searchLocation = function(location) {
        $scope.action.filterLocation = location;
    };
    $('#slpsearch :input').attr('disabled', true);
    $('#stylsearch :input').attr('disabled', true);
    $scope.stock_product = function(data) {
        if ((data != undefined) && (data != "")) {
            $('#slpsearch :input').removeAttr('disabled');
            $('#stylsearch :input').removeAttr('disabled');
            document.getElementById('looksearch').focus()
        } else {
            $('#slpsearch :input').attr('disabled', true);
            $('#stylsearch :input').attr('disabled', true);
        }
    };
    $scope.typeddata = '';
    $scope.refineselected = false;
    //$scope.listPROD = [];
    $scope.inventoryDetailsdata = {};
    $scope.inventoryDetails = [];
    //$scope.inventoryKeys = ["ats","wac","atp","oh","openOnOrderIn","confirmedOrdersIn","asnIn","transferIn","transferOut","allocated","reserved","ccv","iv","held","returnToVendor","openOnOrderOut","confirmedOrdersOut","asnOut"];
    /*****Select product using product code *****/
    $scope.srchprstyle = function(typedthings) {
        $scope.transactions = [];
        if (typedthings != '...' && typedthings != '' && typedthings != undefined) {
            $timeout(function() {
                $scope.firstitems = {};
            }, 0);
            var loc_id = $scope.ship.locationId;
            var selects2 = typedthings.split('~');
            if ((loc_id != undefined) && (selects2[1] == undefined)) {
                ovcDash.get('apis/ang_style_allproducts?srch=' + typedthings + '&locid=' + loc_id).then(function(data) {
                    if ((data.status != 'error')) {
                        var rows = [];
                        var allvals2 = [];
                        angular.forEach(data, function(item) {
                            rows.push(item.ProductTbl.productCode + '~' + item.ProductTbl.name);
                            allvals2.push(item.ProductTbl);
                        });
                        $scope.transactionstyles = rows;
                        $scope.allvalues2 = allvals2;
                    } else {}
                });
            } else if ((selects2[1] != undefined) && (selects2[1] != '')) {
                var newship = $scope.ship;
                $scope.ship = {
                    locationId: $scope.ship.locationId,
                    result: $scope.ship.result,
                    styleresult: $scope.ship.styleresult,
                    mode: "readOnly"
                };
            }
        }
    };
    $scope.Selectprstyle = function(suggestion) {
        //$scope.showstyle=true;
        var selects = suggestion.split('~');
        var selectedpr = suggestion;
        $scope.ship = {
            locationId: $scope.ship.locationId,
            result: '',
            styleresult: selectedpr,
            mode: "readOnly"
        };
    };
    $scope.addprstyles = function(ship) {
        $timeout(function() {
            $scope.firstitems = ship;
            $scope.styleitems = ship;
        }, 0);
        $scope.showstyle = true;
        angular.element(document.getElementById('stlkpmatrix')).html($compile('<style-matrix></style-matrix>')($scope));
        /* angular.element(document.getElementById('stlkpmatrix'))
                        .html($compile('<stylematrix  skuitems="firstitems"   skudata="getselectedsku(sku)"   changed-skus="changedSkus" updatedskus="getmodifiedsku()" showstyle="showstyle"  loadmat ="loadmat"></stylematrix>')($scope)); */
        /* $timeout(function() {
          $scope.firstitems =   ship;
          $scope.styleitems =   ship;
        }, 0); */
        //$scope.showstyle=true;
    };
    /*****Select product using sku and name******/
    $scope.dosrchproduct = function(typedthings) {
        $scope.transactionstyles = [];
        var loc_id = $scope.ship.locationId;
        if (typedthings != '...') {
            var loc_id = $scope.ship.locationId;
            if ((loc_id != undefined)) {
                //ovcDash.get('apis/ang_loc_products?srch='+typedthings+'&locid='+loc_id).then(function (data) {barCode
                ovcDash.get('apis/ang_loc_allproducts?srch=' + typedthings + '&locid=' + loc_id).then(function(data) {
                    if (data.status != 'error') {
                        var rows = [];
                        var allvals = [];
                        angular.forEach(data, function(item) {
                            rows.push(item.ProductTbl.sku + '~' + item.ProductTbl.name + '~' + item.ProductTbl.barCode);
                            allvals.push(item.ProductTbl);
                        });
                        $scope.transactions = rows;
                        $scope.allvalues = allvals;
                    }
                });
            } else {
                $timeout(function() {
                    angular.element('#loclookup').trigger('click');
                }, 1);
            }
        }
    };
    $scope.myCustomValidator = function(text) {
        return true;
    };
    $scope.doSelectproduct = function(suggestion) {
        //$scope.firstitems='';
        $scope.showstyle = false;
        var selects = suggestion.split('~');
        var selectedpr = suggestion;
        $scope.ship = {
            locationId: $scope.ship.locationId,
            result: selectedpr,
            styleresult: '',
            mode: "readOnly"
        };
    };
    // Jegan Added
    $scope.getFunctions = function(shipmentData) {
        if (shipmentData.result) {
            $scope.addShipments(shipmentData);
        }
        if (shipmentData.styleresult) {
            $scope.addShipments(shipmentData);
            // $scope.addprstyles(shipmentData);
        }
    };
    $scope.SelectedInventory = '';
    $scope.hoverIn = function(sku, val, productIndex) {
        $scope.SelectedInventory = val + productIndex;
        $scope.inventoryData1 = {};
        if ($scope.inventoryDetails.length) {
            if ($scope.inventoryDetails[0][sku][val]) {
                $scope.inventoryData1 = $scope.inventoryDetails[0][sku][val];
                //return $scope.inventoryDetails[0][sku][val];
            }
        }
        $scope.invavaillength = Object.keys($scope.inventoryData1).length;
    };
    $scope.hoverOut = function() {
        $scope.SelectedInventory = '';
    };
    $scope.fillTableElements = function(data) {
        $scope.loadval = 0;
        $scope.list = data;
        $scope.currentPages = 1; //current page
        $scope.entryLimits = 10; //max no of items to display in a page
        $scope.filteredItems = $scope.list.length; //Initially for no filter 
        console.log(data);
    };
    /* delete tr from table after adding products */
    $scope.removeRow = function(idx) {
        if (idx != -1) {
            $scope.list.splice(idx, 1);
        }
    };
    var styes = SLPSTYLE;
    var labstyes = $scope.ovcLabel.global.lookupstyles;
    var styleslist = [];
    angular.forEach(styes, function(item) {
        var abc = item.Name;
        var bcd = labstyes[abc];
        var newitem = {
            newstyle: bcd,
            newname: item.Name
        };
        styleslist.push(newitem);
    });
    $scope.setstyles = styleslist;
    var sizes = SLPSIZE;
    var sizeslist = [];
    angular.forEach(sizes, function(item) {
        var stocksize = item.Name;
        var stksize = labstyes[stocksize];
        var newitem = {
            newsize: stksize,
            newname: item.Name
        };
        sizeslist.push(newitem);
    });
    $scope.setsizes = sizeslist;
    var colours = SLPCOLOUR;
    var clrslist = [];
    angular.forEach(colours, function(item) {
        var clrstype = item.Name;
        var color = labstyes[clrstype];
        var newitem = {
            newcolour: color,
            newname: item.Name
        };
        clrslist.push(newitem);
    });
    $scope.setcolours = clrslist;
    $scope.selection = [];
    $scope.unselection = [];
    $scope.refinechange = function() {
        var myEl = angular.element(document.querySelector('#balance_pop'));
        myEl.addClass('open');
    };
    $scope.refineopen = function() {
        var myEl = angular.element(document.querySelector('#balance_pop'));
        //myEl.removeClass('open'); 
        myEl.toggleClass('open');
    };
    $scope.refinecancel = function() {
        $timeout(function() {
            angular.element('#cancel_btn').trigger('click');
        }, 1);
    };
    $scope.refineremove = function() {
        var elem = document.querySelector('table');
        for (i = 0; i < $scope.selection.length; i++) {
            var myEl1 = angular.element(document.querySelectorAll('.' + $scope.selection[i]));
            myEl1.removeClass('ng-hide');
        }
        for (i = 0; i < $scope.unselection.length; i++) {
            var myEl = angular.element(document.querySelectorAll('.' + $scope.unselection[i]));
            myEl.addClass('ng-hide');
        }
        $scope.refinecancel();
    };
    $scope.toggleSelection = function(employeeName) {
        var idx = $scope.selection.indexOf(employeeName.id);
        var idxun = $scope.unselection.indexOf(employeeName.id);
        if (employeeName.selected == false) {
            if ($scope.unselection.indexOf(employeeName.id) == -1) {
                $scope.unselection.push(employeeName.id);
            }
            $scope.selection.splice(idx, 1);
        } else {
            if ($scope.selection.indexOf(employeeName.id) == -1) {
                $scope.selection.push(employeeName.id);
            }
            $scope.unselection.splice(idxun, 1);
        }
        var bal1chk = true;
        angular.forEach($scope.balancefields1, function(value, key) {
            if (!value.selected) {
                bal1chk = false;
            }
        });
        $scope.action.bal1checked = bal1chk;
        var bal2chk = true;
        angular.forEach($scope.balancefields2, function(value, key) {
            if (!value.selected) {
                bal2chk = false;
            }
        });
        $scope.action.bal2checked = bal2chk;
        var bal3chk = true;
        angular.forEach($scope.balancefields3, function(value, key) {
            if (!value.selected) {
                bal3chk = false;
            }
        });
        $scope.action.bal3checked = bal3chk;
    };
    $scope.selectAll = function(obj, objects) {
        obj = !obj;
        angular.forEach(objects, function(item) {
            item.selected = !obj;
            var idxs = $scope.selection.indexOf(item.id);
            var idxuns = $scope.unselection.indexOf(item.id);
            if (!item.selected) {
                if ($scope.unselection.indexOf(item.id) == -1) {
                    $scope.unselection.push(item.id);
                }
                $scope.selection.splice(idxs, 1);
            } else {
                if ($scope.selection.indexOf(item.id) == -1) {
                    $scope.selection.push(item.id);
                }
                $scope.unselection.splice(idxuns, 1);
            }
        });
    };
});