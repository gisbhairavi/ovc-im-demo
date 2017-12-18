
var app = angular.module('OVCstockApp', ['ui.asntable','styleGroup','skuMatrix', 'ovcdataExport','angularModalService','roleConfig','ui.bootstrap.treeview']);

app.controller('addManualShipment', function($rootScope, $scope, $state, $http, $stateParams,  $window, $cookieStore, $timeout, CARRIERCODES, system_currencies, 
STATES, Data, ovcDash, $compile, $filter,$location,$anchorScroll, MANUALSHIPMENT, ORGANIZATIONSTRUCTURE, StyleGroupService, jmsData, AsnTableService, ModalService, toaster, QTYREASONCODES, roleConfigService, $q, TreeViewService, Utils) {
    var pordercodes 	= 	[];
    $scope.action 		=	{};
    $scope.asnData		=	{};
	$rootScope.resolvedasn			= {};
	$rootScope.resolvedasn.receivedpacks			= [];
	$rootScope.resolvedasn.receivedasns				= [];
	// var currensymbs 	= 	$scope.translation.currencylist[0];
 //    var currcodes 		= 	system_currencies[0];
 //    $scope.currency 	= 	currensymbs[currcodes.code];
    var user_detail 	= 	$rootScope.globals['currentUser'];
    var user_id 		= 	user_detail['username'];

 	var ordercodes      =   $scope.ovcLabel.manualshipment.manualshipmenttype;
    var cordercodes     =   MANUALSHIPMENT;
    var sys_organization =	ORGANIZATIONSTRUCTURE;
    var status 			= 	'';
    var busy 			=	true;
    var count 			=	1;
    $scope.errormsgshow = 	false;
    $scope.list 		=	[];
    $scope.form 		=	{};
    $scope.ship 		=	{};
    $scope.UOM 			= 	[];
	$scope.UOMvalues	=	[];
	$scope.po_add 		=	{};
	$scope.tab          =   {};
    $scope.tab.page     =   1;
    $scope.tab.error    =   {};
    $scope.tab.errormsg =   {};
    $scope.skuslist 	=	{};
    $scope.ship.showtrack 	=	false;
    $scope.fromStoreDataArray 	=	'';
    $scope.action.ordertype="PUSH";
    $scope.disabled = 0;
    if($state.current.name		==	'ovc.manualShipment-copy'){
    	$scope.action.hidedrop 	=	true;
    	$scope.action.title		=   'copy';
    };
    if($state.current.name		==	'ovc.manualShipment-add'){
    	$scope.action.title		=   'add';
    };
    if($state.current.name		==	'ovc.manualShipment-edit'){
    	$scope.action.title		=   'edit';
    	//var status = $stateParams.shipmentstatus;
    	//$scope.ship.status = $scope.translation.mshipstatuslist[0][status];
    };
    if($state.current.name		==	'ovc.manualShipment-summary'){
    	$scope.action.title		=   'review';
    	//var reviewstatus = $stateParams.status;
    	//$scope.ship.status = $scope.translation.mshipstatuslist[0][reviewstatus];

    };
    $timeout(function(){
        angular.element('.prod_result').focus();
    },500);

    angular.forEach(cordercodes, function(item) {
        var purch 	= 	item.code;
        var porder 	= 	ordercodes[purch];
        item.label 	= 	porder;
        pordercodes.push(item);
      
     });
    $scope.ordertype = pordercodes;

    var organization_obj = {};
    angular.forEach(sys_organization,function(item){
    		organization_obj[item.id]= item.code;
    });
    $scope.organization_struct = organization_obj;
    /***Resolved Quantity status from config****/
	var ibtqtycodes = $scope.ovcLabel.manualshipment.qty_reasons;
    var ibtcqtycodes = QTYREASONCODES;
    var ibtallqtycodes = [];
    angular.forEach(ibtcqtycodes, function(item) {
        item.label  = ibtqtycodes[item.code];
        ibtallqtycodes.push(item);
    });

    $scope.endisable=function(){
        $scope.vwpuprice 	=	false;
        $scope.puprice 		=	true;
		$scope.shprice 		=	true;
		$scope.action.showasn	 =	false;
        $scope.shiptab  =   true;
        $scope.billtab  =   true;

			if($rootScope.ROLES !=''){
					var role_det=$rootScope.ROLES;
				angular.forEach(role_det, function(roles,key) {
	                if (key== 'purchasePrice'){
	                    if((roles.viewpurchasePrice == 1) ){
	                        $scope.vwpuprice    =   true;
	                    }  
	                }
					
				});
			}
			if($rootScope.POLIST !=''){
					var confg_det=$rootScope.POLIST;
				if(confg_det != undefined && confg_det != ""){
					angular.forEach(confg_det, function(corder,key) {
						if(corder.elementid == "hideTax"){
							if(corder.elementdetail == 1){
								$scope.puprice 	= 	false;
							}
						}
						if(corder.elementid == "hidePurchasePrice"){
							if(corder.elementdetail == 1){
								$scope.shprice	=	false;
							}
						}
						if(corder.elementid == "enableASNlevel"){
							if(corder.elementdetail == 0){
								$scope.action.showasn	=	false;
							}
						}
                        if(corder.elementid == "hideShippingTab"){
                            if(corder.elementdetail == 1){
                                $scope.shiptab  =   false;
                            }
                        }
                        if(corder.elementid == "hideBillingTab"){
                            if(corder.elementdetail == 1){
                                $scope.billtab  =   false;
                            }
                        }
					});
				}
			}

	}
	$scope.endisable();
	//once Done config service to call get order Data
	Utils.configurations().then(function(configData){
        $scope.config    =   configData;
        $scope.editShipment();
    });
    
    var currencylabel   =   $scope.ovcLabel.global.currency;
    var currencylist    =   [];

    /* get store or locations from mysql service */
    $scope.getStores = function() {
    	var deferred = $q.defer();
        Utils.hierarchylocation().then(function(results){
            $scope.storeLocData =   TreeViewService.getLocData(results);
            $scope.flatLocations = [];
            $scope.storeLocData.forEach(function (item) {
                $scope.recur(item, 0, $scope.flatLocations);
            });
        }, function(error){
            console.log('Hierarchy Location : ' + error);
        });

        var locationObj = {};
        Utils.location().then(function(locLabels){
            if(locLabels){
                angular.forEach(locLabels ,  function(locVal){
                    locationObj[locVal.id]     =     locVal.displayName;
                });
                $scope.storeNameObj       =   locationObj;
            }
            deferred.resolve(locationObj);
        });

        if($scope.config.organization_name == $scope.organization_struct['1']){
            Utils.hierarchylocationAll().then(function(hierarchyLocations){
                $scope.locationHierarchy     =   TreeViewService.getLocData(hierarchyLocations);
                $scope.tempLocationData =   [];
                $scope.locationHierarchy.forEach(function (item) {
                    $scope.recur(item, 0, $scope.tempLocationData);
                });
                if(hierarchyLocations.hierarchy){
                    angular.forEach(hierarchyLocations.hierarchy, function(loc){
                        currencylist[loc.id]    =     loc.currency;
                    });
                }
                $scope.corporateLocations = $scope.tempLocationData;
            }, function(err){
                console.log('Hierarchy Location Error : '+ err)
            });
        }

        Utils.userLocation(1).then(function(results){
            if(results && results != undefined && results.status != 'error' && results != ''){
        	 	$scope.store_datas 	= 	results;
	            if($scope.store_datas.length==1){
	            	$scope.form.orderstore 	= results[0].id;
	            	$scope.form.markforstore = results[0].id;
	            	$scope.ship.shipToStore 	= results[0].displayName;
	            	$scope.ship.markFromlocation = results[0].displayName;
	            	$scope.getstore_details($scope.store_datas[0].id);
	            }
        	}else{
				$scope.store_datas = [];
        	}
        }, function(error){
            console.log('User Location With Store 1: '+ error);
        });
        return deferred.promise;  
    };

    $scope.times = function (n, str) {
        var result = '';
        for (var i = 0; i < n; i++) {
            result += str;
        }
        return result;
    };

    $scope.recur = function (item, level, arr) {
        arr.push({
            displayName: item.name,
            id: item.id,
            level: level,
            indent: $scope.times(level, '\u00A0\u00A0'),
            type: (item.type === 'Store')?false:true
        });

        if (item.children) {
            item.children.forEach(function (item) {
                $scope.recur(item, level + 1, arr);
            });
        }
    };

    /***In Transaction History link tab***/
    var shiptab	= $stateParams.tranhistory;
    if(shiptab == 'shipment'){
    	$timeout(function() {
				angular.element('#manualtab2').trigger('click');
		}, 1);
    };


    var reviewtransfer	= $stateParams.transferfunc;
	if(reviewtransfer == 'resolve' ){
		$timeout(function() {
				angular.element('#manualtab2').trigger('click');
		}, 1);
	};

    /******Unique ID Generation*****/
    $scope.getUniqueID	=	function(length) {
		return Math.random().toString(36).substr(2, length).toUpperCase();
	};

    /*******************get uom **********/
    $scope.uomservice = function() {
        Data.get('/uom').then(function(results) {
            var uomdatas 	= 	[];
            angular.forEach(results, function(values) {
                if ((values.isActive) && (values.uomId != undefined) && (values.uomId != '') && (values.description != undefined) && (values.description != '')) {
                    var newobj = {
                        name: values.uomId,
                        id: values.uomId,
                        uid: values.uomId,
						value: values.uomId
                    }
                    uomdatas.push(newobj);
					$scope.UOMvalues[values.uomId]=values.uomId;
                }
            });
            $scope.UOM = uomdatas;
        });
    }

	$scope.uomservice();

	  /***For Default Select Store**/
    if($scope.ordertype.length == 1){
        $scope.form.pordercode = pordercodes[0].code;
    }
    /***Cancel function***/
    $scope.action.cancelbtn 	=	function(){
		$state.go('ovc.manualShipment-list');
	};

	$scope.action.cancel 	=	function(formData,skuData,manualStatus,tab){
    	$scope.saveManualShipment(formData,skuData,manualStatus,tab);
	};
    /***For Store Details***/
    $scope.getstore_details = function(shipstore) {
    	var storesel 							= 	shipstore;
		$scope.tab.error['orderselection'] 		=	false;
    	if($scope.config.organization_name == $scope.organization_struct['2']){
	        if(storesel)
	        {
		        ovcDash.get('apis/ang_getfromstore?locid=' + encodeURIComponent(storesel)).then(function(results) {
		                    
		            if((results.status !='error') && (results != undefined) ){
		                $scope.fromstore_datas 	=	results;
	             		if(results.length == 1){
	                    	$scope.form.shiptostore =  results[0].id;
	                    	$scope.tab.error['shipstore'] 	=	false;
	                        // $scope.getselected_store($scope.po_add.orderstore);
	                    }
		            }else{
		                $scope.fromstore_datas 	= 	[];
		            }
					if($scope.fromstore_datas != ''){
		           		 var fromstore 			=	{};
						angular.forEach($scope.fromstore_datas, function(dataFrom){
							if(! fromstore[dataFrom.id])
								fromstore[dataFrom.id] 	=	dataFrom.displayName;
						});
						$scope.fromStoreDataArray 	  = fromstore;
						$scope.ship.fromstorelocation =	$scope.fromStoreDataArray[$scope.form.shiptostore];
						$scope.ship.shipFromStore 	  = $scope.fromStoreDataArray[$scope.form.shiptostore];
					}
		        });
                $scope.ship.shipToStore =   $scope.storeNameObj[shipstore] ? $scope.storeNameObj[shipstore] : shipstore;
			}else{
				$scope.ship.shipFromStore       ='';
				$scope.form.shiptostore         =''; 
				$scope.ship.fromstorelocation   ='';
				$scope.ship.shipToStore         ='';
			}
		}
	 	if($scope.config.organization_name == $scope.organization_struct['1']){
            $scope.form.orderstore === $scope.form.shiptostore ?  $scope.form.shiptostore ='' : '';
             var allLocations = angular.copy($scope.tempLocationData);

                allLocations = allLocations.filter(
                 function(value){
                    return value.id !== storesel;
               });
               $scope.corporateLocations = allLocations;
               $scope.ship.shipToStore    =   $scope.storeNameObj[shipstore];
               //$scope.getselected_store($scope.po_add.orderstore);
		}
    }

    $scope.getSelectedStore 	=	function(id,label){
       $scope.tab.error['shipstore'] 	=	false;
       label === 'shipFromStore' ? $scope.ship.shipFromStore = $scope.storeNameObj[id] : '';
       label === 'markLocation' ? $scope.ship.markFromlocation = $scope.storeNameObj[id] : '';
    };

    $scope.allproducts 	= 	[];
	var addedskus 		=	[];
    $scope.changedSkus	=	[];
	$scope.prod_detail	=	[];
	var price_detail 	=	[];
	$scope.allproducts2 = 	[];
    $scope.oldpids 		= 	[];

    /******SKU Search Product******/
    $scope.dosrchproduct = function(typedthings) {
        if (typedthings != '...' && typedthings != '' && typedthings != undefined) {
			var loc_id = ($scope.form.markforstore != undefined && $scope.form.markforstore != '') ? $scope.form.markforstore : $scope.form.shiptostore;

    	  	if($scope.form.shiptostore != undefined  &&  $scope.form.shiptostore !=''){
				ovcDash.get('apis/ang_loc_products?srch=' + typedthings + '&locid=' + encodeURIComponent(loc_id)).then(function(data) {
					if (data.status != 'error') {
						$scope.errormsgshow 	= 	true;
						var rows 	= [];
						var allvals = [];
						var styleData = [];
                        var groupData = [];
                        var selectedbarcode = [];
                        var countbarcode = 0;
						angular.forEach(data, function(item) {
							if ($scope.config.showskugroup && styleData.indexOf(item.ProductTbl.productCode) == -1) {
                                var value = item.ProductTbl.productCode + '~' + item.ProductTbl.styleDescription;
                                rows.push({
                                    value: value,
                                    labelclass:"search_products_style",
                                    labeldata: 'Style'
                                });
                                styleData.push(item.ProductTbl.productCode);
                            } 
                            if (styleData.indexOf(item.ProductTbl.barCode) == -1) {
                                var value = item.ProductTbl.sku+ '~' + item.ProductTbl.name + '~' +item.ProductTbl.barCode;
                                rows.push({
                                    value: value,
                                    labelclass:"search_products_barcode",
                                    labeldata: 'Barcode'
                                });
                                styleData.push(item.ProductTbl.productCode);
                                countbarcode ++;
                                selectedbarcode[0] = value;
                            } 
                            var value = item.ProductTbl.sku + '~' + item.ProductTbl.name + '~' + item.ProductTbl.barCode
                            rows.push({
                                value: value,
                                labelclass:"search_products_sku",
                                labeldata: 'SKU'
                            });
                                 
                            allvals.push(item.ProductTbl);
						});
						$scope.addedproducts 	= 	rows;
						$scope.allproducts 		= 	allvals;
						$scope.scanproduct(rows,typedthings);
					}
					 else{
                        $scope.addedproducts       = [];  
                        if($scope.allproducts != '' && count == 1)
                            $scope.errormsgshow     =   false;
                            var output = {
                               "status": "error",
                               "message": $scope.ovcLabel.manualshipment.list.no_product
                           };
                           if(!$scope.errormsgshow && count == 1){
                                 Data.toast(output);
                                 $scope.po_add.prodresult   = '';
                                 count++;
                           }
                   }
				});
			}else{
					$scope.allproducts 		= 	[];
					$scope.addedproducts 	= 	[];
					$scope.errorSearch 		=	true;
					$scope.error_searchmsg 	= 	$scope.ovcLabel.manualshipment.error.from_store;
					$timeout(function() {
					   $scope.errorSearch 	= 	false;
					}, 3000);
					return false; 
			}
    	}
    };

    $scope.listPROD = 	[];
    var data 		=	[];
    var uomlist 	= 	[];
    $scope.scanproduct  =   function(rows,scanvalue){
    	busy 	=	true;
        if(rows.length == 1){
            $scope.po_add.prodresult = rows[0];
            var sku_array			=	rows[0].split('~');
            if(scanvalue == sku_array[2] || scanvalue == sku_array[0]){
            	$scope.ship.sku_select 	=	sku_array[0];
            	$scope.poAddSkus($scope.po_add, $scope.tab.page);
            }  
        }
    }

    /****sku / style Select Function*****/
    $scope.doSelectproduct 		= 	function(selected) {
    	$scope.tab.error['prodresult'] 	=	false;
    	busy 							=	true;
    	var sku_array					=	selected.split('~');
    	$scope.ship.sku_select 			=	sku_array[0];
        $scope.po_add.prodresult        =   selected;
    	$scope.poAddSkus($scope.po_add,1);
    };

    $scope.dostyleselect	=	function(selected){
    	var style_array 			=	selected.split('~');
    	$scope.ship.style_select 	=	style_array[0];
    };

    /***sku/Style Add Function***/
    $scope.poAddSkus	=	function(po_add){
    	if(busy){
    		busy  	=	false;
			if($scope.validation(po_add,'add')){
				if(($scope.form.orderstore == undefined) || ($scope.form.orderstore == ''))
		            throw{'id' : 'orderstore', 'message' : $scope.ovcLabel.manualshipment.error.order_from_store};
		        if(($scope.form.shiptostore == undefined) || ($scope.form.shiptostore == ''))
		            throw{'id': 'shiptostore', 'message' : $scope.ovcLabel.manualshipment.error.ship_to_store};
				if((po_add.prodresult != '') && (po_add.prodresult != undefined)){
					angular.element('.prod_result').focus();
					$scope.addedproducts	= [];
					var selectedpro     =   [];
	                selectedpro  =   $scope.po_add.prodresult.split('~');
	                if(selectedpro.length == 3){
	                    $scope.order_product(po_add);
	                }
	                else if(selectedpro.length == 2){
	                    if((po_add.prodresult != '') && (po_add.prodresult != undefined)){
	                         angular.element('.prod_result').focus();
	                        $scope.styleproducts    =   [];
	                        $scope.order_style(po_add);
	                    }
	                }
	                else{
	                    count   =   1;
	                }
				}
			}
    	}
    	$scope.addedproducts 		=	[];
    	$scope.po_add.prodresult 	=	'';
		
	};

	/**Add Sku in Style**/
	$scope.order_style	=	function(po_add){
		var seltstyle	=	po_add.prodresult;
		var loc 		=	$scope.form.orderstore;
		$scope.showstyle=true;
		$scope.styleitems = {locationId: loc,  result:'', styleresult:seltstyle, mode:"edit"};
			angular.element(document.getElementById('mspmatrix'))
			.html($compile('<style-matrix></style-matrix>')($scope));
	   	$scope.po_add.styleresult = '';
	}

	$scope.loadmat	=	false;

	/**Add Sku**/
	$scope.order_product 	= 	function() {
		var loc 	=	$scope.form.orderstore;
		var sku 	=	$scope.ship.sku_select;
		var alluom 	= 	$scope.UOM;

		angular.forEach(alluom, function(item) {
			uomlist[item.id] = item.name;
		});


		angular.forEach($scope.allproducts, function(value) {
			if(value.sku == sku)
			$scope.calculation(value, sku, loc);
		});
		$scope.po_add.prodresult =	'';
	};

	/**For All calculation at add/edit/copy**/
	$scope.calculation 	=	function(value, sku, location){
        var prtax = tax_tot = sptax = spvat = sptaxes = spvates = tot_wtax = 0;
        $scope.currency     =   currencylabel[currencylist[location]];
       
		ovcDash.get('apis/ang_getproductprice?sku=' + sku + '&loc=' + encodeURIComponent(location)).then(function(result) {

			var cost 	= 	parseFloat(result[0].ProductPrice.Cost).toFixed(2);
			var Tax 	= 	result[0].ProductPrice.isVAT;
			var vTax 	= 	result[0].ProductPrice.percentage;
			var totalc 	= 	povat 	= 	vat_total 	= 	0;
			var newprod = 	false;
				angular.forEach($scope.listPROD, function(lval, lindex) {
					if (lval.productCode == sku) {
						var qty 	= 	(lval.qty) + 1;
						newprod 	= 	true;
						$scope.listPROD[lindex].qty = qty;
						var to_tal 	=  	(cost * qty);
						var taxcal 	=	parseFloat(vTax / 100).toFixed(2);
						var prtax 	= 	(to_tal * taxcal);

						if (Tax == 0) {
							sptax 		= 	(cost * taxcal);
							tot_wtax 	= 	parseFloat(prtax + to_tal).toFixed(2);
							$scope.listPROD[lindex].total 			= 	tot_wtax;
							$scope.listPROD[lindex].totalnotax 		= 	to_tal
							$scope.listPROD[lindex].totalProductTax = 	prtax
							$scope.calcItems(lindex, qty, cost, to_tal, tot_wtax, prtax, value.productCode);
						} else if (Tax == 1) {
							povat 	= 	(to_tal * taxcal);
							spvat 	= 	(cost * taxcal);
							$scope.listPROD[lindex].total 			= 	to_tal
							$scope.listPROD[lindex].totalnotax 		= 	to_tal
							$scope.listPROD[lindex].totalProductVat = 	prtax
							$scope.calcItems(lindex, qty, cost, to_tal, to_tal, prtax, value.productCode);
						}
					}
				});

				if (!newprod) {
						var qty		=	1;
						var taxcal 	=	parseFloat(vTax / 100).toFixed(2);
						var to_tal 	= 	(cost * qty);
						if (Tax == 0) {
							tot_wtax 	= 	(to_tal * taxcal) + to_tal;
							sptax  		= 	(cost * taxcal);
							prtax 		= 	(to_tal * taxcal);
						} else if (Tax == 1) {
							tot_wtax 	= 	parseFloat(to_tal).toFixed(2);
							spvat 		= 	(cost * taxcal);
							povat 		= 	(to_tal * taxcal);
						}
						var sduom 		= 	uomlist['Each'];
						var skuwaist	=	((value.waist) 	&& (value.waist  !=	'' )) ? parseInt(value.waist) : null ;
						var skulength	=	((value.length) && (value.length !=	'' )) ? parseInt(value.length) : null ;
						var skusize		=	((value.size)	&& (value.size	 !=	'' )) ? (value.size) : '' ;
						$scope.listPROD.push({
							id:'', lineNumber : '', sku:value.sku, productCode: value.sku, name: value.name, description: value.description,
							cost: cost, productVat: spvat, totalProductVat: povat, productTax: sptax, totalProductTax: prtax,
							qty: qty, totalnotax: to_tal, total: tot_wtax, taxisVAT: Tax, percentage: vTax, selectedUOM: sduom,
							style:value.productCode, styleDescription:value.styleDescription, styleColor:value.color,
							waist:skuwaist, length:skulength, size:skusize, variants:value.variants
						});
						$scope.list = data = $scope.listPROD ;
        				$scope.ship.filteredItems 	= 	$scope.list.length; //Initially for no filter  

						angular.forEach($scope.listPROD, function(lval, lindex) {
							if (lval.productCode == value.sku) {
								if (lval.taxisVAT == 1) {
									$scope.calcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.vat_total,value.productCode);
								} else if (lval.taxisVAT == 0) {
									$scope.calcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.tax_tot,value.productCode);
								}
							}
						});
				}
		});
	};

	$scope.calcItems = function(pindex, qty, cost, ptotal, ptaxtot, vattax, style) {
		$scope.skuslist 	=	{};
		$scope.skuslist		=	StyleGroupService.getstylegroup($scope.list);
		var noitems2 = subtotal2 = ovtotal2 = iqty2 = itotal2 = iototal2 = itax2 = ivat2 =  noskus2 = taxvat2 = alltax2 = 0;
			angular.forEach($scope.skuslist[style]['skus'], function(item) {
			if ((item.qty != undefined) && (item.qty != '')) {
				iqty2 = item.qty;
			} else {
				iqty2 = 0;
			}
			if ((item.total != undefined) && (item.total != ''))
				iototal2 	= 	item.total;
			if ((item.totalProductTax != undefined) && (item.totalProductTax != ''))
				itax2 		= 	item.totalProductTax;
			if ((item.totalProductVat != undefined) && (item.totalProductVat != ''))
				ivat2 		= 	item.totalProductVat;
			if ((item.totalnotax != undefined) && (item.totalnotax != '')) 
				itotal2 	= 	item.totalnotax;

			noitems2 	= 	parseInt(noitems2) + parseInt(iqty2);
			subtotal2 	= 	parseFloat(subtotal2) + parseFloat(itotal2);
			taxvat2 	= 	parseFloat(taxvat2) + parseFloat(ivat2);
			alltax2 	= 	parseFloat(alltax2) + parseFloat(itax2);
			ovtotal2 	= 	parseFloat(ovtotal2) + parseFloat(iototal2);	
		});
		$scope.skuslist[style].qty 		=	noitems2;
		$scope.skuslist[style].total 	=	ovtotal2;
		$scope.skuslist[style].subtotal = 	subtotal2;
		$scope.skuslist[style].vat 		=	taxvat2;
		$scope.skuslist[style].tax 		=	alltax2;
		$scope.commoncalculation();
		
	};

	/**For Delete Skus**/
	$scope.deleteskus 	=	function(id){
		 var pqty 	= 	ptotal 	= 	alltotal 	=	 alltax  = 	allvat 	= 	0;
		 var style 	=	this.sku.style;
		 var idx=this.$index;
		if (idx != -1) {
		   if( this.sku.id != '' ) {
				var orditem_id= this.sku.id;
				$.confirm({
					title:'Delete Item from Order',
					content: 'Confirm delete?',
					confirmButtonClass: 'btn-primary',
					cancelButtonClass: 'btn-primary',
					confirmButton: 'Ok',
					cancelButton: 'Cancel',
					confirm: function() {
						Data.delete('/orderitem/' + orditem_id).then(function(data) {
							var output = {
								"status": "success",
								"message": $scope.ovcLabel.manualshipment.toast.product_delete_success
							};
							Data.toast(output);
							var whatIndex = null;
							angular.forEach($scope.list, function(item, index) {
								if (item.id === orditem_id) {
									whatIndex = index;
								}
							});
							$scope.list.splice(whatIndex, 1);
							$scope.skuslist[style]['skus'].splice(idx, 1);
							$scope.confirmdelete(id,style);
						});				
					},
					cancel: function() {
						return false;
					}
				});
				
			}else{
				$scope.skuslist[style]['skus'].splice(idx, 1);
				$scope.confirmdelete(id,style);
			}
		}
	};

	$scope.confirmdelete 	=	function(id,style){
		var pqty = ptotal = alltotal = alltax = allvat = noitems2 =  subtotal2 =  ovtotal2 = iqty2 = itotal2 = iototal2 =  itax2 = ivat2 =  noskus2 =  taxvat2 = alltax2 = 0;
		angular.forEach($scope.skuslist[style]['skus'], function(item) {
			if ((item.qty != undefined) && (item.qty != '')) {
				iqty2 = item.qty;
			} else {
				iqty2 = 0;
			}
			if ((item.total != undefined) && (item.total != '')) 
				iototal2 	= 	item.total;
			if ((item.totalProductTax != undefined) && (item.totalProductTax != ''))
				itax2 		= 	item.totalProductTax;
			if ((item.totalProductVat != undefined) && (item.totalProductVat != ''))
				ivat2 		= 	item.totalProductVat;
			if ((item.totalnotax != undefined) && (item.totalnotax != ''))
				itotal2 	= 	item.totalnotax;

			noitems2 	= 	parseInt(noitems2) 		+ 	parseInt(iqty2);
			subtotal2 	= 	parseFloat(subtotal2) 	+ 	parseFloat(itotal2);
			taxvat2 	= 	parseFloat(taxvat2) 	+ 	parseFloat(ivat2);
			alltax2 	= 	parseFloat(alltax2) 	+ 	parseFloat(itax2);
			ovtotal2 	= 	parseFloat(ovtotal2) 	+ 	parseFloat(iototal2);	
		});

		$scope.skuslist[style].qty 		= 	noitems2;
		$scope.skuslist[style].total 	= 	ovtotal2;
		$scope.skuslist[style].subtotal = 	subtotal2;
		$scope.skuslist[style].vat 		= 	taxvat2;
		$scope.skuslist[style].tax 		= 	alltax2;
		$scope.commoncalculation();
	};

	$scope.removeStyleGroup 	=	function(idx){
		if (idx != -1) {
			angular.forEach($scope.skuslist[idx]['skus'], function(item) {
				if(item.id !=''){
					var orditem_id=item.id;
					Data.delete('/orderitem/' + orditem_id).then(function(data) {
					});
				}
			});
			delete  $scope.skuslist[idx];
			$scope.commoncalculation();
		} 
	};

	$scope.commoncalculation 	=	function(){
		var newlist	=	[];
		var noitems = taxvat = alltax = subtotal =  ovtotal =  iqty = itotal = iototal =  itax = ivat =  noskus =  noskus = skuItem = 0;
		angular.forEach($scope.skuslist, function(pritem, key) {
			var stylenoitems = styletaxvat = stylealltax =  stylesubtotal =  styleovtotal =  styleiqty = styleitotal = styleiototal =  styleitax = styleivat = 0;
			noskus = noskus + pritem.skus.length;
			angular.forEach(pritem.skus, function(item) {
				newlist.push(item);
				if ((item.qty != undefined) && (item.qty != '')) {
					iqty = item.qty;
				} else {
					iqty = 0;
				}
				if ((item.total != undefined) && (item.total != ''))
					iototal 	= 	item.total;
				if ((item.totalProductTax != undefined) && (item.totalProductTax != '')) 
					itax 		= 	item.totalProductTax;
				if ((item.totalProductVat != undefined) && (item.totalProductVat != ''))
					ivat 		= 	item.totalProductVat;
				if ((item.totalnotax != undefined) && (item.totalnotax != '')) 
					itotal 		= 	item.totalnotax;
				noitems 		= 	parseInt(noitems) 			+ 	parseInt(iqty);
				subtotal 		= 	parseFloat(subtotal) 		+ 	parseFloat(itotal);
				taxvat 			= 	parseFloat(taxvat) 			+ 	parseFloat(ivat);
				alltax 			= 	parseFloat(alltax) 			+ 	parseFloat(itax);
				ovtotal 		= 	parseFloat(ovtotal) 		+ 	parseFloat(iototal);
				stylenoitems 	= 	parseInt(stylenoitems) 		+ 	parseInt(iqty);
				stylesubtotal 	= 	parseFloat(stylesubtotal) 	+ 	parseFloat(itotal);
				styletaxvat 	= 	parseFloat(styletaxvat) 	+ 	parseFloat(ivat);
				stylealltax 	= 	parseFloat(stylealltax) 	+ 	parseFloat(itax);
				styleovtotal 	= 	parseFloat(styleovtotal) 	+	parseFloat(iototal);
			});
			pritem.qty 			= 	parseInt(stylenoitems);
			pritem.total 		= 	parseFloat(styleovtotal).toFixed(2);
			pritem.subtotal 	= 	parseFloat(stylesubtotal).toFixed(2);
			pritem.vat 			=	parseFloat(styletaxvat).toFixed(2);
			pritem.tax 			=	parseFloat(stylealltax).toFixed(2);
		});
		
		$scope.form.allitems 		= 	parseFloat(noitems);
		var subtotals3 				= 	parseFloat(subtotal) ;
		$scope.form.allsubtotal 	= 	parseFloat(subtotals3).toFixed(2);
		$scope.form.allsubtaxes 	= 	parseFloat(alltax).toFixed(2);
		$scope.form.allsubvates 	= 	parseFloat(taxvat).toFixed(2);
		var alltotal 				= 	parseFloat($scope.form.allsubtotal) + parseFloat($scope.form.allsubtaxes);
		$scope.form.overtotal 		= 	parseFloat(alltotal).toFixed(2);

		angular.forEach($scope.skuslist, function(item){
	    		skuItem 	=	skuItem + item.skus.length;	
	    });
    	$scope.form.numberOfPackages = skuItem;
    	$scope.list	=	newlist;
		$scope.listPROD	=	newlist;
	};

	$scope.getmodifiedsku    =   function(styleskus,upload){
		busy 	=	true;
		$scope.changedSkus	 =	styleskus;
	 	var skulength 	= 	styleskus.length;
	 	var newskus  	= 	skulength ? $scope.changedSkus : Object.keys($scope.changedSkus);
    	var selectedskus=  	newskus.join(',');
		var stostore 	= 	($scope.form.markforstore != undefined && $scope.form.markforstore != '') ? $scope.form.markforstore : $scope.form.shiptostore;
		ovcDash.post('apis/ang_loc_skuproducts',{data:{srch:selectedskus,locid:stostore}}).then(function(data) {
			if ((data.status != 'error') && (data !='')) {
				$scope.prod_detail 	=	data;
				$scope.addnewskus(newskus,stostore,upload);
			}
		});
			
		var alluom = $scope.UOM;
		angular.forEach(alluom, function(item) {
			 uomlist[item.id] = item.name;
        }); 					
	};

	/*****SKU add In Style Matrix Add*****/
	$scope.addnewskus  =   function(newskus,stostore,upload){
		busy 	=	true;
		$scope.currency     =   currencylabel[currencylist[stostore]];
		var totalSkus 		=	newskus;
		ovcDash.get('apis/ang_skus_getproductprice?sku=' + newskus + '&loc=' + encodeURIComponent(stostore)).then(function(result) {
			if ((result.status != 'error') && (result !='')) {
				price_detail 	=	result;
				if($scope.prod_detail != []){
					angular.forEach($scope.prod_detail,function(item){
						var skudata 		=	item.ProductTbl;
                        var index       =   totalSkus.indexOf(skudata.sku); 
                        var barcodeIndex    =   totalSkus.indexOf(skudata.barcode);
                        if (index > -1) {
                            totalSkus.splice(index, 1);
                        }
                        if (barcodeIndex > -1) {
                            totalSkus.splice(index, 1);
                        }
                        
						angular.forEach(result,function(costitem){
							var pridata 	=	costitem.ProductPrice;
							

							if(skudata.sku ==pridata.sku ){
								pridata.quantity 	= 	!upload ? $scope.changedSkus[pridata.sku] : $scope.uploadSkus[pridata.sku] ? $scope.uploadSkus[pridata.sku] : $scope.uploadSkus[pridata.barcode];
								addedskus.push(angular.extend(skudata, pridata));
							}
						});
					});
					if(totalSkus.length > 0){
						var output = {
                            "status": "error",
                            "message": totalSkus.join(',') + $scope.ovcLabel.manualshipment.toast.not_available_location
                        };
						Data.toast(output);
					}
				}
				angular.forEach(addedskus,function(resultantsku){
					var cost 		= 	parseFloat(resultantsku.Cost).toFixed(2);
					var Tax   		= 	resultantsku.isVAT;
					var vTax  		= 	resultantsku.percentage;
					var qtyvalue 	=	resultantsku.quantity;
					var totalc 		= 	povat 		= 	vat_total 	=	0;
					var newprod 	= 	false;
					var prtax 		= 	tax_tot 	= 	sptax 	= 	spvat 	= 	sptaxes	 = 	spvates 	 =	 tot_wtax = 0;
					var newstyle 	= 	resultantsku.sku.toString();
					var idx  		= 	$scope.oldpids.indexOf(newstyle);
						angular.forEach($scope.listPROD, function(lval, lindex) {
							if (lval.productCode == resultantsku.sku) {
								var qty 	= 	(lval.qty) + qtyvalue;
								newprod 	= 	true;
								$scope.listPROD[lindex].qty = qty;
								var to_tal 	=  (cost * qty);
								var taxcal 	=	parseFloat(vTax / 100).toFixed(2);
								var prtax 	= (to_tal * taxcal);

								if (Tax == 0) {
									sptax 		= 	(cost * taxcal);
									tot_wtax 	= 	parseFloat(prtax + to_tal).toFixed(2);
									$scope.listPROD[lindex].total 			= 	tot_wtax;
									$scope.listPROD[lindex].totalnotax 		= 	to_tal
									$scope.listPROD[lindex].totalProductTax = 	prtax
									$scope.calcItems(lindex, qty, cost, to_tal, tot_wtax, prtax, lval.style);
								} else if (Tax == 1) {
									povat 	= 	(to_tal * taxcal);
									spvat 	= 	(cost * taxcal);
									$scope.listPROD[lindex].total 			= 	to_tal
									$scope.listPROD[lindex].totalnotax 		= 	to_tal
									$scope.listPROD[lindex].totalProductVat = 	prtax
									$scope.calcItems(lindex, qty, cost, to_tal, to_tal, prtax, lval.style);
								}
							}
						});

						if (!newprod) {
							var qty 	= 	qtyvalue;
							var taxcal 	=	parseFloat(vTax / 100).toFixed(2);
							var to_tal 	= 	(cost * qty);
							if (Tax == 0) {
								tot_wtax 	= 	(to_tal * taxcal) + to_tal;
								sptax 		= 	(cost * taxcal);
								prtax 		= 	(to_tal * taxcal);
							} else if (Tax == 1) {
								tot_wtax 	= 	parseFloat(to_tal).toFixed(2);
								spvat 		= 	(cost * taxcal);
								povat 		= 	(to_tal * taxcal);
							}
							var sduom 		= 	uomlist['Each'];
							var skuwaist	=	((resultantsku.waist) && (resultantsku.waist !=	'' )) ? parseInt(resultantsku.waist) : null ;
							var skulength	=	((resultantsku.length) && (resultantsku.length !=	'' ) )? parseInt(resultantsku.length) : null ;
							var skusize		=	((resultantsku.size)	&&	(resultantsku.size	!=	'')) ? (resultantsku.size) : '' ;
							$scope.listPROD.push({
								id:'', lineNumber : '', productCode: resultantsku.sku, sku:resultantsku.sku, name: resultantsku.name, description: resultantsku.description, 
								cost: cost, productVat: spvat, totalProductVat: povat, productTax: sptax, totalProductTax: prtax, qty: qty, totalnotax: to_tal, 
								total: tot_wtax, taxisVAT: Tax, percentage: vTax, selectedUOM: sduom, style:resultantsku.productCode, styleDescription:resultantsku.styleDescription, 
								styleColor:resultantsku.color, waist:skuwaist, length:skulength,size:skusize,variants:resultantsku.variants
							});
							$scope.list = $scope.listPROD;
							$scope.ship.filteredItems = $scope.list.length;
							angular.forEach($scope.listPROD, function(lval, lindex) {
								if (lval.productCode == resultantsku.sku) {
									if (lval.taxisVAT == 1) {
										$scope.calcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.totalProductVat, lval.style);
									} else if (lval.taxisVAT == 0) {
										$scope.calcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.totalProductTax,lval.style);
									}
								}
							});
						}
						$scope.list = $scope.listPROD;
				});
				price_detail			=	[];
				addedskus				=	[];
				$scope.prod_detail     	=   [];
				$scope.changedSkus     	=   [];
				if($scope.list.length > 0){
					$scope.tab.error['prodresult'] 		=	false;
				}
			}
		});
	};

    $scope.changeSkuCost = function($index,sku) {
        $scope.calcItems1($index,sku.qty, sku.cost,sku.total,sku.sku,sku.style); sku.changed = sku.originalQty == sku.qty ? false : true ;
    } 

	/****Quantity Change Calculation***/
	 $scope.calcItems1 = function(pindex, qty, cost, ptotal, prcode, style) {
		var stylecode 	=	style;
        var nindex 		= 	pindex;
        var quantity 	= 	qty;
        var eachcost 	= 	parseFloat(cost).toFixed(2);
       	var to_tal 		= 	(quantity * eachcost);
        var loc 		=	$scope.form.orderstore;

        var prtax1 = tax_tot1 = sptax1 = spvat1 = sptaxes1 = spvates1 = tot_wtax1 = totalitax= 0;
        ovcDash.get('apis/ang_getproductprice?sku=' + prcode + '&loc=' + encodeURIComponent(loc)).then(function(result) {
            $scope.product_price 	= 	result[0];
            var cost 	= 	parseFloat(result[0].ProductPrice.Cost).toFixed(2);
            var Tax1 	= 	result[0].ProductPrice.isVAT;
            var vTax1 	= 	result[0].ProductPrice.percentage;
            var totalc1 = 	povat1 = vat_total1 = tot_vat1 = 0;
            var vatTax1 = 	vTax1;
			var taxcal 	=	parseFloat(vatTax1 / 100).toFixed(2);

		  $scope.skuslist[style]['skus'][nindex].taxisVAT = Tax1;
            if (Tax1 == 0) {
                prtax1 		= 	parseFloat(to_tal * taxcal).toFixed(2);
                sptax1 		= 	parseFloat(cost * taxcal).toFixed(2);
				totalitax 	= 	(prtax1 + to_tal);
                totalc1 	= 	parseFloat(to_tal).toFixed(2);
				$scope.skuslist[style]['skus'][nindex].total 			= 	totalitax;
				$scope.skuslist[style]['skus'][nindex].totalnotax 		= 	totalc1;
                $scope.skuslist[style]['skus'][nindex].totalProductTax 	= 	prtax1;
				$scope.calcItems(nindex, qty, cost, totalc1, totalitax, prtax1, stylecode);
            } else if (Tax1 == 1) {
                tot_wtax1 	= 	parseFloat(to_tal).toFixed(2);
                povat1 		= 	parseFloat(to_tal * taxcal).toFixed(2);
                spvat1 		= 	(cost * taxcal);
                totalc1 	= 	parseFloat(to_tal).toFixed(2);
				$scope.skuslist[style]['skus'][nindex].total 			= 	tot_wtax1;
				$scope.skuslist[style]['skus'][nindex].totalnotax 		= 	totalc1;
                $scope.skuslist[style]['skus'][nindex].totalProductVat 	= 	povat1; 
				$scope.calcItems(nindex, qty, cost, totalc1, tot_wtax1, tax_tot1, stylecode);
            }

        });	
    };
    var checkingCount 	= 	0;
    var currentDate 	=   new Date();
    $scope.asnData.fromDate = $filter('dateForm')(currentDate); 

    $scope.ship.shipmentId 		=	$stateParams.porderid;
    $scope.ship.typeshipment 	=	$stateParams.transfertype;

    /******For show/hide detailfunctions*****/
    if($scope.ship.typeshipment == 'Outbound'){
    	$scope.action.receivepack	=	false;
		$scope.action.shippack		=	true;
    }else{
    	$scope.action.receivepack	=	true;
		$scope.action.shippack		=	false;
    }
    $scope.validation      	=   function(data,add){
        $scope.tab.error 	=	{};
        $scope.tab.errormsg =	{};
        var errorArray 		=	[];
    	if(($scope.form.orderstore == undefined) || ($scope.form.orderstore == ''))
            errorArray.push({'id' : 'orderselection', 'message' : $scope.ovcLabel.manualshipment.error.order_from_store});
        if(($scope.form.shiptostore == undefined) || ($scope.form.shiptostore == ''))
            errorArray.push({'id': 'shipstore', 'message' : $scope.ovcLabel.manualshipment.error.ship_to_store});
        if(add){
                if((data.prodresult) || (data.styleresult) || add == 'upload'){
                }else{
                    errorArray.push({'id' : 'prodresult', 'message' : $scope.ovcLabel.manualshipment.error.atleast_addSku});

                }
        }else{
        	 var objectKey   =   Object.keys($scope.skuslist);
        	 if($scope.skuslist && objectKey.length > 0){
        	 	if(objectKey && objectKey[0] && $scope.skuslist[objectKey[0]].skus.length == 0){
                    errorArray.push({'id': 'prodresult', 'message' : $scope.ovcLabel.manualshipment.error.atleast_addSku});
                }
            }else{
                    errorArray.push({'id': 'prodresult', 'message' : $scope.ovcLabel.manualshipment.error.atleast_addSku});
        	}
        }
        if(errorArray.length > 0){
            angular.forEach(errorArray,function(error){
                $scope.tab.error[error.id]=true;
                $scope.tab.errormsg[error.id]=error.message;
            });
            $scope.tab.page     =   1;
            return false;
        }
           
        return true;
    }

    $scope.saveShipment 		=	function(formData,skuData,manualStatus,tab){
    	$scope.ship.showtrack 	=	true;
    	
    	if(($scope.asnData.asnNumber == undefined  || $scope.asnData.asnNumber == '')
    			 && ($scope.asnData.packageId == undefined || $scope.asnData.packageId == '')) {
	    	var packageId 					=   Math.round(+new Date()/1000);
	        $scope.asnData.asnNumber        =   "ASN" + $scope.getUniqueID(9);
	        $scope.asnData.packageId        =   packageId;
	        $scope.asnData.billOfLadingId   =  	"BL" + $scope.asnData.asnNumber;
	    }
	    if($scope.validation(formData))
            $scope.tab.page = 4;
    }
    
    /****Save Manual Shipment product***/
    var newobj = {}
    $scope.saveManualShipment 		=	function(formData,skuData,manualStatus,tab){
    	if($scope.validation(formData)){
	    	$scope.disabled++;
			checkingCount++
			$scope.ship.showtrack 	=	true;

			if(($stateParams.porderid) && ($state.current.name	!=	'ovc.manualShipment-copy')){
					var shipmentCount 		=  1;
			}else{
				if(checkingCount == 1){
	    			var shipmentCount 		=  0;
	    			if(($scope.asnData.asnNumber == undefined  || $scope.asnData.asnNumber == '')
	    			 && ($scope.asnData.packageId == undefined || $scope.asnData.packageId == '')) {
	    				var packageId 					=   Math.round(+new Date()/1000);
				        $scope.asnData.asnNumber        =   "ASN" + $scope.getUniqueID(9);
				        $scope.asnData.packageId        =   packageId;
				        $scope.asnData.billOfLadingId   =  	"BL" + $scope.asnData.asnNumber;
	    			}
	    		}
			}
	    	var shipmentcode = markForLoc =  '';
	        if ((formData.pordercode != undefined) && (formData.pordercode != '')) {
	            shipmentcode = formData.pordercode;
	        }
	        if ((formData.markforstore != undefined) && (formData.markforstore != '')) {
	            markForLoc = formData.markforstore;
	        }
			// if ( ! ( $scope.validateShipment() )) {
			// 	$scope.disabled 	=	0;
			// 	checkingCount 		= 	0;
			// 	return false;
	       //       }
	       		var totalskus 					=	$scope.list.length;
	    		var shipOrderNumber 			=	'';
	    		var locationFromStore 			=	formData.orderstore;
	    		var locationToStore 			=	formData.shiptostore;
	    		shipment_status 				=	manualStatus;

	  		if (formData != undefined) {
	            	newobj.purchaseOrderType 	= 	shipmentcode; 						
	            	newobj.markForLocation 		= 	markForLoc; 			
	            	newobj.FromLocation 		= 	locationFromStore;
	            	newobj.shipToLocation 		= 	locationToStore; 
	            	newobj.numberOfProducts		= 	formData.allitems;
	            	newobj.comment 				= 	formData.comment;
					newobj.numberOfSKU 			=	totalskus;
	            	newobj.totalPoCost 			= 	formData.overtotal;
	            	newobj.totalPoVAT 			= 	formData.allsubvates;
	            	newobj.totalPoTax 			= 	formData.allsubtaxes;
	            	newobj.PoSubtotal 			= 	formData.allsubtotal;
	            	newobj.specialInstructions 	=	formData.comment;
	            	newobj.location 			= 	locationToStore;
	            	newobj.orderStatus 			= 	shipment_status;
	        }
      

        if((shipmentCount == 0) && ($scope.disabled == 1)){
        	Data.put('/order', {
                data: newobj
            }).then(function(results) {
            	tab.page = 4;
            	if (results.__v == 0) {
                    if ($scope.list != undefined) {
  						var generate 		=	{};

                    	$scope.ship.shipmentId 			=	results._id;
						var neworditems 				= 	$scope.list;
						shipOrderNumber 				=	results.purchaseOrderNumber;
						$scope.ship.shipOrderNumber 	=	results.purchaseOrderNumber;
						generate.orderNumber 			=	results.purchaseOrderNumber;
						/*****Random Generate For asn,track,packid*****/
						generate.asnNumber 				=	$scope.asnData.asnNumber;
		               	generate.packageid 				=	$scope.asnData.packageId;
		                generate.billofid 				=	$scope.asnData.billOfLadingId;
		                sessionStorage.ids 				=	JSON.stringify(generate);
		                var orderItemArray 				=	[];
						angular.forEach(neworditems, function(item,key) {
							var dataobj = {
                                lineNumber 			: 	item.lineNumber,	SKU 				: 	item.productCode,		productCode			: 	item.style,
								productName			: 	item.name,			productDescription 	: 	item.description,		producUom			: 	item.selectedUOM,
								productCost 		: 	item.cost,			productTax 			: 	item.productTax,		productVat 			: 	item.productVat,
								totalProductTax 	: 	item.totalProductTax,totalProductVat 	: 	item.totalProductVat,	isVat 				: 	item.taxisVAT,
								qty 				: 	item.qty,			totalProductCost 	: 	item.totalnotax,		waist 				: 	item.waist,
								length 				: 	item.length,		size 				: 	item.size,				purchaseOrderNumber : 	shipOrderNumber,
								styleColor 			: 	item.styleColor, 	styleDescription 	: 	item.styleDescription,  UOM 				: 	item.selectedUOM	
							}
							orderItemArray.push(dataobj);
						});

						//Arry of objects to save DB

						if(orderItemArray.length > 0)
                            var reqObj = { arrData: orderItemArray };
						Data.put('/orderitem', {data: {dataObj: JSON.stringify(reqObj)}}).then(function(result) {});

						$scope.shippush(shipment_status,$scope.ship.shipOrderNumber);
					}
				}
            });
        }else if($scope.disabled == 1){
        	Data.post('/order/' + $scope.ship.shipmentId, {
                data: newobj
            }).then(function(results) {
            	tab.page = 4;
            	if (results.ok == 1) {
                    if ($scope.list != undefined) {
						var neworditems = $scope.list;
						var orderItemArrayPut 	=	[];
						var orderItemArrayPost 	=	[];
						angular.forEach(neworditems, function(item,key){
							if(manualStatus != 'draft'){
								item.changed 	=	true;
							}
							var shipItemId 	=	item.id;
							if(item.id != ''){
								if(item.changed){
									var dataobj = {
										_id: item.id,
		                                lineNumber 			: 	item.lineNumber,	SKU 				: 	item.productCode,		productCode			: 	item.style,
										productName			: 	item.name,			productDescription 	: 	item.description,		producUom			: 	item.selectedUOM,
										productCost 		: 	item.cost,			productTax 			: 	item.productTax,		productVat 			: 	item.productVat,
										totalProductTax 	: 	item.totalProductTax,totalProductVat 	: 	item.totalProductVat,	isVat 				: 	item.taxisVAT,
										qty 				: 	item.qty,			totalProductCost 	: 	item.totalnotax,		waist 				: 	item.waist,
										length 				: 	item.length,		size 				: 	item.size,				purchaseOrderNumber : 	$scope.ship.orderNumber,
										styleColor 			: 	item.styleColor,	styleDescription  	: 	item.styleDescription, 	UOM 				: 	item.selectedUOM
									}
								}
							}else{
								var dataobjput = {

	                                lineNumber 			: 	item.lineNumber,	SKU 				: 	item.productCode,		productCode			: 	item.style,
									productName			: 	item.name,			productDescription 	: 	item.description,		producUom			: 	item.selectedUOM,
									productCost 		: 	item.cost,			productTax 			: 	item.productTax,		productVat 			: 	item.productVat,
									totalProductTax 	: 	item.totalProductTax,totalProductVat 	: 	item.totalProductVat,	isVat 				: 	item.taxisVAT,
									qty 				: 	item.qty,			totalProductCost 	: 	item.totalnotax,		waist 				: 	item.waist,
									length 				: 	item.length,		size 				: 	item.size,				purchaseOrderNumber : 	$scope.ship.orderNumber,
									styleColor 			: 	item.styleColor,	styleDescription  	: 	item.styleDescription, 	UOM 				: 	item.selectedUOM
								}
							}
							if(item.id != ''){
								if(item.changed)
								orderItemArrayPost.push(dataobj);
							}
							else{
								orderItemArrayPut.push(dataobjput);
							}
						});

						if(orderItemArrayPost.length > 0) {
				            Data.post('/orderitem/',{data: { arrData: orderItemArrayPost } }).then(function(result) {});
                        }
						if(orderItemArrayPut.length > 0) {
                            var reqObj = { arrData: orderItemArrayPut };
                            Data.put('/orderitem',{data: {dataObj: JSON.stringify(reqObj)}}).then(function(result) {if (result.__v == 0) {}});
                        }
						$scope.shippush(shipment_status, $scope.ship.orderNumber);
					}
				}
            });
	        newobj = {};
    	}else{
    		$scope.disabled 	=	0;
			checkingCount 		= 	0;
			return false;
    	}
    }
    	
    
    };

    $scope.shippush	=	function(shipment_status, orderNumber){
	 /****For Generate the ASN widget****/
       	var finaljson                                       =   [];
        $scope.finalData                                    =   {};
        $scope.finalData.purchaseOrder                      =   {};
        $scope.finalData.purchaseOrder.purchaseOrderNumber  =   orderNumber;  
       // $scope.finalData.purchaseOrder.orderStatus          =   "inProgress";
       	$scope.finalData.purchaseOrder.orderStatus          =  shipment_status;
        $scope.finalData.purchaseOrder.purchaseOrderAsn     =   {};
        var purchaseOrderAsn                                =   $scope.finalData.purchaseOrder.purchaseOrderAsn;
        purchaseOrderAsn.asnId                              =   $scope.asnData.asnNumber;
        purchaseOrderAsn.billLadingId                     =   $scope.asnData.billOfLadingId;
        purchaseOrderAsn.numberOfPackages                   =   "1";
        purchaseOrderAsn.purchaseOrderPackage               =   [];
        var packageDetails                                  =   {};
        if(shipment_status	==	'inProgress'){
        	packageDetails.packageStatus 					=   "shipped";
        }else{
        	packageDetails.packageStatus 					=   "shipInProgress";
        }
        packageDetails.packageId                            =   $scope.asnData.packageId;
        packageDetails.trackingNumber                       =   $scope.asnData.trackNumber;
        packageDetails.shipDate                             =   $filter('dateFormChange')($scope.asnData.fromDate);
        packageDetails.expectedDeliveryDate                 =   $filter('dateFormChange')( $scope.asnData.toDate);
        packageDetails.purchaseOrderItem                    =   [];
            angular.forEach($scope.list ,function(listData){
            	var skupack                                         =   {};
                skupack.sku         						=   listData.sku;
                if(shipment_status	==	'inProgress'){
                	skupack.qtyStatus   					=   "shipped";
                }else{
                	skupack.qtyStatus   					=   "shipInProgress";
                }
                skupack.qty         						=   listData.qty;
                skupack.lineNumber  						=   listData.lineNumber;
                skupack.totalProductTaxAsn 					=   listData.totalProductTax;
                skupack.totalProductVatAsn 					=   listData.totalProductVat;
                skupack.totalProductCostAsn 				=   listData.totalnotax;
               	skupack.uom									=	listData.selectedUOM;
               	skupack.skuCost 							=	listData.cost;
                packageDetails.purchaseOrderItem.push(skupack);
            });
        $scope.finalData.purchaseOrder.totalPoTaxAsn  		=   $scope.form.allsubtaxes;
        $scope.finalData.purchaseOrder.totalPoVATAsn  		=   $scope.form.allsubvates;
        $scope.finalData.purchaseOrder.PoSubtotalAsn  		=   $scope.form.allsubtotal;
        $scope.finalData.purchaseOrder.totalPoCostAsn 		=   $scope.form.overtotal; 
        $scope.finalData.purchaseOrder.purchaseOrderType    =   "PUSH";
        purchaseOrderAsn.purchaseOrderPackage.push(packageDetails);
        finaljson.push($scope.finalData);	       
        var DataAsn 	=	JSON.stringify(finaljson);
        Data.post('/receivingpurchasejson', {"data" : {"uploaded_file" : DataAsn, "type" : "json"}})
        .then(function(result) {
        	if(shipment_status	==	'inProgress'){
        		if(result && result.status == "error")
        			var output	=	{"status": "error", "message": $scope.ovcLabel.manualshipment.toast.update_manualshipment};
				if(result && result.status == "success")
					var output	=	{"status": "success", "message": $scope.ovcLabel.manualshipment.toast.shipment_create_success};
			}else{
				if(result && result.status == "error")
    				var output	=	{"status": "error", "message": $scope.ovcLabel.manualshipment.toast.error_save_manalshipment};
				if(result && result.status == "success")
					var output	=	{"status": "success", "message": $scope.ovcLabel.manualshipment.toast.save_manalshipment};
			}
			

			if((result.error == undefined) && (output.status === 'success') )
				Data.toast(output);
				$state.go('ovc.manualShipment-list');
		});
    };
 
	/*****For Edit and Draft Function****/
	$scope.editShipment 		=	function(){
		if($stateParams.porderid || $stateParams.summaryid){
	    	var shipmentId 	= 	$stateParams.porderid ? $stateParams.porderid : $stateParams.summaryid;
			if (shipmentId) {
				$scope.ship.showtrack 		=	true;
				Data.get('/order?id=' + shipmentId).then(function(output) {
					var results 	=	output.order_data;
					var displaystatus 	=	output.displayStatusObject;

					
					$scope.ship.copyid  		=	shipmentId;
					$scope.form.pordercode 		= 	results.purchaseOrderType;
					$scope.form.orderstore 		= 	results.FromLocation;
					$scope.form.shiptostore 	=	results.shipToLocation;
					$scope.form.markforstore 	= 	results.markForLocation;
					$scope.form.comment 		= 	results.specialInstructions;
					$scope.form.allsubtotal 	= 	results.PoSubtotalAsn;
					$scope.form.allsubtaxes 	= 	results.totalPoTaxAsn;
					$scope.form.allsubvates 	= 	results.totalPoVATAsn;
					var poOrderNumber 			=	results.purchaseOrderNumber;
					$scope.ship.orderNumber 	=	poOrderNumber;
					$scope.ship.create			=	results.createdBy;
					$scope.ship.totalsku 		=	results.numberOfSKU;
					// console.log($scope.shipmentstoreArray,'SHIPMENT-ARRAY');
					// $scope.ship.shipToStore		=	$scope.shipmentstoreArray[results.FromLocation];
    				$scope.ship.status = $scope.ovcLabel.global.orderStatus[displaystatus[poOrderNumber]];

					$scope.getStores().then(function(Stores){
                        $scope.getstore_details(results.FromLocation);
						$scope.ship.shipToStore		=	Stores[results.FromLocation];
						$scope.ship.shipFromStore   =   Stores[results.shipToLocation];
						$scope.ship.markFromlocation=	Stores[results.markForLocation];
                        $scope.ship.fromstorelocation = Stores[results.shipToLocation]
                        $scope.currency     =   currencylabel[currencylist[$scope.form.orderstore]];
					},function(){
						$scope.ship.shipToStore 	=	'';
					});

					$scope.currency     =   currencylabel[currencylist[$scope.form.orderstore]];
					if($stateParams.summaryid){
						$scope.transferView 	=	true;
						$scope.ship.shipmentview=	true;
						$scope.getAsnTable(poOrderNumber);
					}
					
					$scope.form.allsubvates 	=	results.totalPoVAT;
					$scope.form.allsubtaxes 	=   results.totalPoTax;
					$scope.form.allsubtotal 	=	results.PoSubtotal;
					// $scope.ship.fromstore 		=	$scope.fromstore_datas[results.FromLocation];
				
					$scope.form.allitems 		= 	results.numberOfProducts;
					$scope.ship.comment 		=	results.comment;
					$scope.form.overtotal 		=	(results.totalPoCostAsn ? results.totalPoCostAsn : results.totalPoCostConfirm ? results.totalPoCostConfirm : results.totalPoCost);

					Data.get('/orderitem?purchaseordernumber=' + poOrderNumber).then(function(skudatas) {
						var orditem 		=	skudatas.item_data;
						var orderitemlist 	= 	[];
						angular.forEach(orditem, function(item){
						  	var quantities 	= 	parseInt(item.qty);
	            		  	var prcost 		= 	parseFloat(item.productCost).toFixed(2);
	            		  	var prtcost 	= 	parseFloat(item.totalProductCost).toFixed(2);
							var prttax 		= 	parseFloat(item.totalProductTax).toFixed(2);
							var prttotal 	=	prtcost + prttax;
							var skuitem_id	=	item._id;

							if (item.isVat == '0' ) {
								var totwithtax = parseFloat(prttotal).toFixed(2);
							} else {
								var totwithtax = parseFloat(item.totalProductCost).toFixed(2);
							}
							if($state.current.name		==	'ovc.manualShipment-copy'){
	    						skuitem_id	= '';
	   						}
							var orderData = {
			                    lineNumber 		: 	item.lineNumber,
								sku 			: 	item.SKU,
								SKU 			: 	item.SKU,
								style 			: 	item.productCode,
								productCode 	: 	item.SKU,
								name 			: 	item.productName,
								description 	: 	item.productName,
								cost 			: 	prcost,
								skuCost 		: 	prcost,
								selectedUOM 	: 	item.producUom,
								qty 			: 	quantities,
								totalnotax 		: 	prtcost,
								producUom 		: 	item.producUom,
								totalProductTax : 	item.totalProductTax,
								taxisVAT 		: 	item.isVat,
								totalProductVat : 	item.totalProductVat,
								productTax 		: 	item.productTax,
								productVat 		: 	item.productVat,
								total 			: 	totwithtax,
								id 				: 	skuitem_id,
								styleDescription: 	item.styleDescription,
								// waist 			: 	item.waist,
								// length 			: 	item.length,
								// size 			: 	item.size,
								variants 			: 	item.variants,
								styleColor 		: 	item.styleColor
	                		};
	                		if(skuitem_id != '' && skuitem_id != undefined){
	                			orderData.originalQty 	=	quantities;
	                		}
	                		orderitemlist.push(orderData);


						});
						if(results.orderStatus	==	"inProgress"){
	                		Data.get('/shipmentdata/' + poOrderNumber).then(function(qtyresults) {
	                			if((qtyresults.error==	undefined) && (qtyresults != '')){
	                				var orderdata 	= 	qtyresults;
									var nrows 		=	[];
									var nrows2 		=	[];
									angular.forEach(orderdata, function(item) {					
										item.allqty		=	{};
										item.qtydetails	=	{};
										item.receivedqtys	=	{};
										item.receiveddetails	=	{};
										
										angular.forEach(ibtallqtycodes, function(data) {
											item.receiveddetails[data.label]	=	data.code;
											if((item.qtyStatus[data.code] != undefined)){
													item.receivedqtys[data.label]=item.qtyStatus[data.code];	
											}else{
													item.receivedqtys[data.label]=0;
											}
										});
										nrows.push(item.userId);
										nrows2.push(item);
									});	
									angular.forEach(orderitemlist,function(orderitem){
										angular.forEach(orderdata, function(nitem) {
											if(orderitem.SKU==nitem.sku  && $state.current.name != 'ovc.manualShipment-copy'){
												angular.extend(orderitem, nitem);
											}
										});
									}); 	
	                			}	
							});

	                	}
						$timeout(function() {
							$scope.list 	= orderitemlist;
							$scope.listPROD = $scope.list;
							$scope.ship.filteredItems = $scope.list.length;
							$scope.skuslist = StyleGroupService.getstylegroup($scope.list);
						},500);
					});
					ovcDash.get('apis/ang_username?user_id=' + $scope.ship.create).then(function(userdata) {
						var fname 	=	userdata.firstName;
						var lname 	=	userdata.lastName
						$scope.ship.createdby =	fname + ' ' + lname;
					});
					Data.get('/poasn?&poid='+results.purchaseOrderNumber).then(function(asnresults) {
			            if(asnresults && asnresults.status != 'error' && asnresults.error == undefined)
			            {
                            var asnData = asnresults.asnData;
			            	if($state.current.name		!=	'ovc.manualShipment-copy'){
                                var asnObj = _.values(asnData)[0];
                                var packageObj = _.values(asnObj.packages)[0];
			            		$scope.asnData.asnNumber        =   asnObj.asnId;
	        					$scope.asnData.packageId        = packageObj.packageId;
	        				}else{
	        					var packageId 					=   Math.round(+new Date()/1000);
						        $scope.asnData.asnNumber        =   "ASN" + $scope.getUniqueID(9);
						        $scope.asnData.packageId        =   packageId;
						        $scope.asnData.billOfLadingId   =  	"BL" + $scope.asnData.asnNumber;
	        				}
	        				//$scope.asnData.billOfLadingId   =  	asnData[0].billLadingId;
	        				$scope.asnData.trackNumber      =   packageObj.trackingNumber;
	        				$scope.asnData.fromDate			=	$filter('dateForm')(packageObj.shipDate);
	        				$scope.asnData.toDate			=   $filter('dateForm')(packageObj.expectedDeliveryDate);			
	        				
			            }
			        });

				});
			}
		}else{
			$scope.getStores();
		}
	};
	
	
	$scope.show = function() {
        ModalService.showModal({
            templateUrl: 'pushmodal.html',
			controller: "ModalController"
        }).then(function(modal) {
            modal.element.modal();
            modal.close.then(function(result) {
                //$scope.message = "You said " + result;
            });
        });
	};
	

	/****For Asn Table Service***/
	$scope.getAsnTable = function(prdrNo) {
        $scope.is_blind_receive     =   false;
        Data.get('/poasn?poid=' + prdrNo).then(function(results) {
                $scope.asn_records  =   true;
                $scope.asn_receive  =   false;
            if(results && results.status != 'error'){
                $scope.asn_records  =   false;
                $scope.asn_receive  =   true;
            }
            if(results && results.status != 'error')
            {
                var temp_obj = {  
                   "resolvebtn":false,
                   "showgroup":true,
                   "asns" : results.asnData,
                   "error":5,
                   "receivebtn":results.hasShippedPack

                }
                $rootScope.asn_details  =   temp_obj;
                // $rootScope.asn_details  =   AsnTableService.getFormattedData(results);
                angular.forEach($rootScope.POLIST, function(item){
                    if(item.elementid === "enableBlindReceiving" && item.elementdetail == 1)
                    {
                        $scope.is_blind_receive =   true;
                        return false;
                    }
                });
            }
        });
    };

    /***Hover popup for Received qty in summary****/
    $scope.hoverIn = function() {
		this.hoverEdit = true;
	};
	$scope.hoverOut = function() {
		this.hoverEdit = false;
	};

	$scope.notSorted = function(obj){
		if (!obj) {
			return [];
		}
		return Object.keys(obj);
	}

	$scope.deleteShipment    =   function(){
        $.confirm({
            title: 'Delete Manual Shipment',
            content: 'Confirm delete?',
            confirmButtonClass: 'btn-primary',
            cancelButtonClass: 'btn-primary',
            confirmButton: 'Ok',
            cancelButton: 'Cancel',
            confirm: function () {
                Data.delete('/order/'+ $stateParams.porderid + '?purchaseOrderNumber=' + $scope.ship.orderNumber).then(function (data) {
                    if(data.status == "success"){
                        var output={"status":"success","message":$scope.ovcLabel.manualshipment.toast.delete_shipment};
                       
							$state.go('ovc.manualShipment-list');
                    }else{
                        var output={"status":"error","message":$scope.ovcLabel.manualshipment.toast.delete_shipment_fail}; 
                    }
                    Data.toast(output);
                });  
            },
            cancel: function () {
                return false;
            }
        });
        return false;
    };

    // File Upload Functions

    //Chunk call Function For varient amount of SKUS

    function ChunkFunction(newskus){
        $scope.uploadSkus = newskus;
        var chunkObj = Object.keys(newskus);
        var chunk = function(arr, len) {
            var arrays = [], size = len;

            while (arr.length > 0)
                arrays.push(arr.splice(0, size));

            return arrays;
        }
        if(chunkObj.length > 100){
            var chunkeddata = chunk(chunkObj, 100);
            angular.forEach(chunkeddata, function(chunkitem){
                $scope.getmodifiedsku(chunkitem,'chunk');
            });
        } else {
            $scope.getmodifiedsku(newskus,'chunk');
        }
    }

    

    //.dat File Process
	$scope.processData 		=	function(allText){
		var allTextLines 	= 	allText.split(/\r\n|\n/);
        var headers 		= 	allTextLines[0].split('|');
        var lines 			= 	[];

        for ( var i = 0; i < allTextLines.length; i++) {
            // split content based on comma
            var data = allTextLines[i].split('|');
            if (data.length == headers.length) {
                var tarr = [];
                for ( var j = 0; j < headers.length; j++) {
                    tarr.push(data[j]);
                }
                lines.push(tarr);
            }
        }
        return lines;
	};

    //File upload Validation 
    $scope.shipmentFileupload = function(event){
    	if (! $scope.validation($scope.po_add,'upload')) {
 			event.preventDefault();
        	return false;
        }
    }

    //upload file Function
    $scope.uploadOrders         =   function($fileContent,$file){
        $scope.import           =   true;
        var zoneFile            =   $scope.orderfile;
        var adjustZoneRead      =   $scope.processData($fileContent);
        var adjustData          =   {};
        angular.forEach(adjustZoneRead, function (zoneContent) {
            if(adjustData[zoneContent[0]]){
                adjustData[zoneContent[0]]  =   parseFloat(adjustData[zoneContent[0]]) + parseFloat(zoneContent[1]);
            }else{
                adjustData[zoneContent[0]]  =   parseFloat(zoneContent[1]);
            }
        });
        ChunkFunction(adjustData);

    };

});