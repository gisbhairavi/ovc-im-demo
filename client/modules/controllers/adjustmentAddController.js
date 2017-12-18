var app 	= 	angular.module('OVCstockApp', ['ui.asntable','styleGroup','skuMatrix', 'ovcdataExport', 'roleConfig', 'ui.bootstrap.treeview']);
/*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module     :   IBT list
*
*    Developer  :   Sivaprakash
* 
*    Date       :   30/03/2016
*
*    Version    :   1.0
*
**********************************************************************/

app.controller('addAdjustment', function($rootScope, $scope, $state, $http,  $cookieStore, $window, $filter, $timeout,$location,$anchorScroll, Data, ovcDash,  system_settings, TRANSCODE, system_currencies, AsnTableService, $compile, StyleGroupService, REASONCODETYPE, ADJUSTMENTTRANSACTIONMAPPING,
    $stateParams, roleConfigService, TreeViewService, OVC_CONFIG, jmsData, Utils , helper, snackbar) {
	$scope.adjustmentTitle			=	$scope.ovcLabel.adjustments.list.createadjustment;
	// $scope.adjumentnum              = 	$scope.translation.adjustments.adjust_num_lab;
	
	$scope.form 	= 	{};
	$scope.action  	=	{};
	$scope.ship 	=	{};
	$scope.UOM 		=	[];
	$scope.UOMvalues	=	{};
	$scope.adjuststyleGroup =	true;
	$scope.action.editable 	=	true;
	$scope.action.adjustment= 	true;
	$scope.action.show_rev  = 	false;
	$scope.TranTypeData		=	{};
	$scope.listTranType		=	{};
	$scope.revTranArr 	 	=	[];
	$scope.po_add			=	{};
    $scope.ReasonCodeData 	= 	[];
    var uomlist 			=	[]; 
    var skuItem  			= 	0;
    var adjust_status 		= 	'';
	$scope.errorSearch 		=	false;
	$scope.locationArray 	=	{};
	$scope.purchaseOrders	=	[];
	$scope.tab          =   {};
    $scope.tab.page     =   1;
    $scope.tab.error    =   {};
    $scope.tab.errormsg =   {};
	$scope.revTran 		=	{};
	$scope.revTranName	=	[];
	var sampledraft		='';
	var deletesku_header	=	'Delete Item from Adjustment';
    var delete_header       =   'Delete Adjustment';
    var delete_adjustment   =   'Adjustment deleted successfully';
    var delete_fail         =   'Adjustment delete failed';
	$scope.disabled = 0;
    var count       =   1;
    var configStatus = [];
    var exportConfig = false;
    var userStores = [];
    $scope.form.entryLimit  =   100;
    $scope.form.currentPage =   1;
    $scope.form.offset      =   0;
	/*Getting Role Permission*/
    Utils.roles().then( function ( roles_val ) {
        if( roles_val ){
            $scope.permission = roles_val;
        }
    });
    var GroupByStyle    =   true;
    Utils.configurations().then (function(configData){

        $scope.config    =   configData;
        //assinging vaules for selected export adjustment status from configuration
        if (configData.config_arr) {

            configData.config_arr.adjustmentExportStatuses ? 
                (configData.config_arr.adjustmentExportStatuses.featureValue ? 
                    (configStatus    =   configData.config_arr.adjustmentExportStatuses.featureValue) : 
                    '') : 
                '';

            configData.config_arr.exportAdjustments ? 
                exportConfig    =  configData.config_arr.exportAdjustments.featureValue : 
                '';
                GroupByStyle = configData.config_arr && configData.config_arr.allGroupingByStyle ?
                                configData.config_arr.allGroupingByStyle.featureValue : true;
            if(!GroupByStyle){
                $scope.withPagination   =   true;
            }
            $scope.getLocation();
        }else{
            $scope.getLocation();
        }
    });
    $timeout(function(){
        angular.element('.prod_result').focus();
    },500);	

    $scope.focustosku 	=	function(){
    	$timeout(function(){
            angular.element('.prod_result').focus();
        },500);	
        $scope.tab.error['res_code'] = false;
    }

    //Parse Float common Method
    function float(val){
        return parseFloat(val).toFixed(2);
    }
    /**For Current User*/
	var userDetail 		= 	$rootScope.globals['currentUser'];
	var userId 			= 	userDetail['username'];
	var fname 				= 	$rootScope.globals.currentUser.firstname;
	var lname 				= 	$rootScope.globals.currentUser.lastname;

	if(($state.current.name		==	'ovc.adjustment-add') || ($state.current.name		==	'ovc.adjustment-copy')){
		$scope.form.createdby 	= 	fname + ' ' + lname;

	}

    var state_adjustId		=	0;

	if ($stateParams.adjust_id != undefined) {
		$scope.isReversed 	=	true;
		state_adjustId 		=	$stateParams.adjust_id;
		$scope.ship.copyid	=	$stateParams.adjust_id;
	}

	//Back to Stocklookup Function //
	 $scope.back=function(){
       var SessionproData   =   JSON.parse(sessionStorage.prodata);
       sessionStorage.commonSku    =   SessionproData.sku+'~'+SessionproData.description+'~'+SessionproData.barCode;
       $state.go('ovc.stocklookup-list');
	}

    /*****For Adjustment Code******/
    var pordercodes 	= 	[];
	var cordercodes 	= 	TRANSCODE;
	var ordercodes 		= 	$scope.ovcLabel.adjustments.translist;
	angular.forEach(cordercodes, function(item) {
        item.label 	= ordercodes[item.code];
        pordercodes.push(item);
    });

    $scope.adjustmentcode = pordercodes;

    var asjustmentTransactionMapping 	=	[];
    angular.forEach(ADJUSTMENTTRANSACTIONMAPPING[0], function(item,key) {    	
    	asjustmentTransactionMapping[key] 	=	item;
    	asjustmentTransactionMapping[item] 	=	key;
    });

    $scope.asjustmentTransactionMapping		=	asjustmentTransactionMapping;
    var currencylabel   =   $scope.ovcLabel.global.currency;
    var currencylist    =   [];

    $scope.getLocation  =   function() {
        var id_user = $rootScope.globals['currentUser']['username'];
        Utils.userLocation(1).then(function(results){
            if(results.status=='error'){
				$scope.store_datas 	= 	[];
			}else{
            $scope.store_datas	=	results;
	            angular.forEach(results, function(item){
	                currencylist[item.id]    =   item.currency;
	            });
            if($scope.store_datas.length==1){
            	$scope.form.shiptostore = results[0].id;
            }
			}
            var data 				=	{};
			angular.forEach(results, function(shipmentstore){
				if(!data[shipmentstore.id])
					data[shipmentstore.id] 	=	shipmentstore.displayName;
			});
			$scope.locationArray 			=	data;
        }, function(error){
            console.log('User location Error: ' + error);
        });
       
        Data.get('/transactiontype').then(function(response){
    		
    		var listTranType 	= 	{};
    		var revTranArr		=	{};
    		var rev_tran_typeArr = 	[];
    		var allTranType 		=	{};
    		angular.forEach(response, function(tran_type) {
    			var newobj = {
                    tranTypeId: tran_type.tranTypeId,
                    tranName: tran_type.tranName
                }
                if(!listTranType[tran_type.tranCode]){
                	listTranType[tran_type.tranCode]	=	{};
                }
                if(!allTranType[tran_type.tranCode]){
                	allTranType[tran_type.tranCode]	=	{};
                }
                if( tran_type.isManualTransaction ){
                	listTranType[tran_type.tranCode][tran_type.tranTypeId] 	=	newobj;
                }
                if (tran_type.isAllowReversal === true) {
                	rev_tran_typeArr.push(tran_type.tranName);
                }
                if(tran_type.reversalTranTypeId){
                	var revTranObj = {
	                    tranTypeId: tran_type.tranTypeId,
	                    tranName: tran_type.tranName,
	                    isManualTransaction: tran_type.isManualTransaction
	                }
                	  
                	revTranArr[tran_type.reversalTranTypeId] 	=	revTranObj;
                }
                if( tran_type ){
                	allTranType[tran_type.tranCode][tran_type.tranTypeId] 	=	newobj;
                }
    		});
    		$scope.listTranType 	=	listTranType;
    		$scope.revTran 			=	revTranArr;
    		$scope.revTranName		=	rev_tran_typeArr;
    		$scope.allTranType 		= 	allTranType;

            if($state.current.name == 'ovc.adjustment-copy' || $state.current.name == 'ovc.adjustment-edit' || $state.current.name =='ovc.adjustment-summary')
    		$scope.editAdjustment();
    	});
        Utils.hierarchylocation().then(function(results){
            angular.forEach(results.hierarchy, function(storedata){
                userStores.push(storedata.id);
            });
            $scope.storeLocData  =   TreeViewService.getLocData(results);
            $scope.flatLocations = [];
            $scope.storeLocData.forEach(function (item) {
                $scope.recur(item, 0, $scope.flatLocations);
            });
            
        }, function(error){
            console.log('hierarchy Location Error : '+ error);
        });
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
    
    $scope.adjustmentname = function(){
    	$timeout(function(){
            angular.element('.prod_result').focus();
        },500);	
        $scope.tab.error['adj_name'] = false;
    }
    /* get transaction types from micro service */
    $scope.getAdjustName 		= 	function(tranCode) {
        $scope.tab.error['prcode']    =   false;
    	$timeout(function(){
            angular.element('.prod_result').focus();
        },500);	
    	$scope.TranTypeData 	= 	$scope.listTranType[tranCode];
    	$scope.allTranTypeData 	= 	$scope.allTranType[tranCode];
    };

    var resCodeTypeList   =   $scope.translation.code_type;
   // var resCodeType  =   [];
    var resCodeType  =   {};

    angular.forEach( REASONCODETYPE, function( item ) {
        resCodeType[ item.code ]  =   resCodeTypeList[ item.code ];
    });

    $scope.codeTypeList  =   resCodeType;

    /**For Reason Code**/
    $scope.GetReasonCode = function( ) {
        Data.get('/reasoncode?code_type=MAN_ADJS').then(function(results) {
            var listCodeType = [];
            var data 	=	{};
            angular.forEach(results, function(res_code_type) {
                if ((res_code_type.codeType && res_code_type.codeType != '')) {
                    var newobj = {
                        resId: res_code_type.id,
                        resDesc: res_code_type.description
                    }
                    listCodeType.push(newobj);
                }
                if(!data[res_code_type.id]){
        			data[res_code_type.id] 	=	{};
        		}
            	data[res_code_type.id]     	= 	res_code_type.description;
            });
            $scope.ReasonCodeData 	= 	listCodeType;
            $scope.resCodeArray 	=	data;

        });
    };

    $scope.GetReasonCode();

    $scope.orderServiceFun = function(typedthings) {
        $scope.purchaseOrders = [];
        if (typedthings && typedthings != '') {
            Data.post('/orderNumbers',{data: { userStores: userStores, key: typedthings}}).then(function(data) {
                if( data.status == 'success' && data.result != undefined){
                    var purchaseOrders = [];
                    angular.forEach(data.result,function(item) {
                        if (item.orderStatus != 'draft'){
                            if (item.orderNumber) {
                                purchaseOrders.push(item.orderNumber);
                            }
                            else if (item.purchaseOrderNumber) {
                                purchaseOrders.push(item.purchaseOrderNumber);
                            }
                        }
                    });
                    $scope.purchaseOrders = purchaseOrders;
                }
            });
        }
    };

    // $scope.orderServiceFun();

     /*******************get uom **********/
    $scope.uomservice 	= 	function() {
        Data.get('/uom').then(function(results) {
            var uomdatas = [];
            angular.forEach(results, function(values) {
                if ((values.isActive) && (values.uomId != undefined) && (values.uomId != '') && (values.description != undefined) && (values.description != '')) {
                    var newobj = {
                        name 	: 	values.uomId,
                        id 		: 	values.uomId,
                        uid 	: 	values.uomId,
						value 	: 	values.uomId
                    }
                    uomdatas.push(newobj);
					$scope.UOMvalues[values.uomId]=values.uomId;
                }
            });
            $scope.UOM = uomdatas;
            angular.forEach($scope.UOM, function(item) {
                uomlist[item.id] = item.name;
            }); 
        });
    }
	$scope.uomservice();

	$scope.allproducts 	= 	[];
	var addedskus 		=	[];
    $scope.changedSkus	=	[];
	$scope.prod_detail	=	{};
	var price_detail 	=	[];
	$scope.allproducts2 = 	[];
    $scope.oldpids 		= 	[];

	/******SKU Search******/
    $scope.dosrchproduct = function(typedthings, callback) {
    	var locId 	=	$scope.form.shiptostore;
    	if(locId != undefined && locId !=''){
			if (typedthings != '...' && typedthings != '' && typedthings != undefined) {
				ovcDash.get('apis/ang_loc_products?srch=' + typedthings + '&locid=' + encodeURIComponent(locId)).then(function(result) {
                    helper.multiDropDown(result , $scope.config.showskugroup).then(function(data){
                        $scope.addedproducts    =   data.rows;
                        $scope.allproducts      =   data.allvals;
                        $scope.allSKUobj        =   data.skuObj;
                        $scope.scanproduct(data.rows,typedthings);
                    }, function(error){
                        var output = {"status": "error","message": $scope.ovcLabel.adjustments.error.no_products};
                        $scope.po_add.prodresult  = '';
                        Data.toast(output);
                    });
					if(sessionStorage.locationname && sessionStorage.skuid){
						if(allvals.length >0)
							callback(true);
						else
							callback(false);
					}	
				});
			}
		}else{
			$scope.allproducts 		= 	[];
			$scope.addedproducts 	= 	[];
			$scope.errorSearch 		=	true;
			$scope.error_searchmsg 	= 	$scope.ovcLabel.adjustments.error.selct_store;
			return false; 
		}
    };

    $scope.listPROD = 	[];
    var data 		=	[];
    $scope.scanproduct  =   function(rows,scanvalue){
        if(rows.length == 1){
            $scope.po_add.prodresult = rows[0];
            var sku_array           =   rows[0].split('~');
            if(scanvalue == sku_array[2] || scanvalue == sku_array[0]){
                $scope.ship.sku_select  =   sku_array[0];
                $scope.poAddSkus($scope.po_add, $scope.tab.page);
            }
        }
    }

    $scope.doSelectproduct 		= 	function(selected) {
        $scope.tab.error['skusearch']        =   false;
    	var sku_array			=	selected.split('~');
    	$scope.ship.sku_select 	=	sku_array[0];
        $scope.po_add.prodresult    =   selected;
        $scope.poAddSkus($scope.po_add);
    };
    $scope.selectstore 	=	function(){
    	$timeout(function(){
            angular.element('.prod_result').focus();
        },500);	
        $scope.tab.error['storelocation'] = false;
    }
    $scope.poAddSkus	=	function(po_add){
        $scope.searchParam   =   '';
        if($scope.add_validation(po_add) && po_add.prodresult){
            $scope.addedproducts    = [];
            $timeout(function(){
                angular.element('.prod_result').focus();
            },500); 
            var selectedpro     =   [];
            selectedpro  =   $scope.po_add.prodresult.split('~');
            
            if(!$scope.withPagination){
                if(selectedpro.length == 3){
                    $scope.order_product(po_add);
                }else if(selectedpro.length == 2){
                        $scope.styleproducts    =   [];
                        $scope.order_style(po_add);
                }
            }else{
                skuGroupAssign(selectedpro);
            }
   
        } 
        $scope.addedproducts    = [];
    	$scope.po_add.prodresult = '';
	};

	/**Add Sku in Style**/
	$scope.order_style	=	function(po_add){
		var seltstyle	=	po_add.prodresult;
		var sku 		= 	$scope.po_add.pordercode;
		var loc 		=	$scope.form.shiptostore;
		$scope.showstyle=true;
		$scope.styleitems = {locationId: loc,  result:'', styleresult:seltstyle, mode:"edit"};
			angular.element(document.getElementById('adjustmentmatrix')).html($compile('<style-matrix></style-matrix>')($scope));
	   	$scope.po_add.styleresult = '';
	}

	$scope.loadmat	=	false;

	/**Add Sku**/
	$scope.order_product 	= 	function() {
		var loc 	=	$scope.form.shiptostore;
		var sku 	=	$scope.ship.sku_select ? $scope.ship.sku_select : $scope.po_add.prodresult;
		var alluom 	= 	$scope.UOM;
		$scope.flag	=	false;
		angular.forEach(alluom, function(item) {
			uomlist[item.id] = item.name;
		});
		angular.forEach($scope.allproducts, function(value) {
			if(value.sku == sku){
				$scope.flag=true;
				$scope.calculation(value, sku, loc);
			}
		});
		$scope.po_add.prodresult 	=	'';
		$scope.addedproducts	= [];

	};

	/**For All calculation at add/edit/copy**/
	$scope.calculation 	=	function(value, sku, location){
        
        var prtax = tax_tot = sptax = spvat = sptaxes = spvates = tot_wtax = 0;
        Data.get('/inventories?locationid='+encodeURIComponent(location)+'&sku='+sku).then(function (results) {
        	if(results != '' && results != undefined){
        	var wacSku	= results[0].wac;
	        }else{
	        	wacSku 		=	0;
	        }
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
							var qty		=	parseInt("1");
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
								variants:value.variants, Wac :wacSku
							});
							$scope.list  = $scope.listPROD ;
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
					if(result.status=='error'){
						var output = {
                    		"status": "error",
                    		"message": $scope.ovcLabel.adjustments.error.sku_notavlb_store
                		};
                		 Data.toast(output);
					}

			});

		});
	};

	$scope.calcItems = function(pindex, qty, cost, ptotal, ptaxtot, vattax, style) {
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
		 var idx    =   this.$index;
		if (idx != -1) {
		   if( this.sku.id != '' ) {
				var adjustid= this.sku.id;
				$.confirm({
					title:deletesku_header,
					content: 'Confirm delete?',
					confirmButtonClass: 'btn-primary',
					cancelButtonClass: 'btn-primary',
					confirmButton: 'Ok',
					cancelButton: 'Cancel',
					confirm: function() {
                        // if($scope.withPagination && $scope.skuslist.length == 1){
                        //     var output = {"status": "error",
                        //         "message":"Need alteast one SKU<br>So we could't delete that SKU"}
                        //     Data.toast(output);
                        //     return false;
                        // }
                        var adjust_no = $scope.form.adjustmentNumber;
                        var paginationData = $scope.withPagination ? '?adjustmentNumber=' + adjust_no +'&page_offset='+ $scope.form.offset + '&page_lmt='+$scope.form.entryLimit : "";
						Data.delete('/adjustmentitem/' + adjustid + paginationData).then(function(data) {
							var output = {
								"status": "success",
								"message": $scope.ovcLabel.adjustments.error.product_delete
							};
							Data.toast(output);
                            if($scope.withPagination){
                                SKUListUpdate(data);
                            }else{
                                var whatIndex = null;
                                angular.forEach($scope.list, function(item, index) {
                                    if (item.id === adjustid) {
                                        whatIndex = index;
                                    }
                                });
                                $scope.list.splice(whatIndex, 1);
                                $scope.skuslist[style]['skus'].splice(idx, 1);
                                $scope.confirmdelete(id,style);
                            }
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

		$scope.skuslist[style].qty=noitems2;
		$scope.skuslist[style].total=ovtotal2;
		$scope.skuslist[style].subtotal=subtotal2;
		$scope.skuslist[style].vat=taxvat2;
		$scope.skuslist[style].tax=alltax2;
		$scope.commoncalculation();
	};

	$scope.removeStyleGroup 	=	function(idx){
		if (idx != -1) {
			angular.forEach($scope.skuslist[idx]['skus'], function(item) {
				if(item.id !=''){
					var orditem_id=item.id;
					Data.delete('/adjustmentitem/' + orditem_id).then(function(data) {
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
				noitems 		= 	parseInt(noitems) 		+ 	parseInt(iqty);
				subtotal 		= 	parseFloat(subtotal) 	+ 	parseFloat(itotal);
				taxvat 			= 	parseFloat(taxvat) 		+ 	parseFloat(ivat);
				alltax 			= 	parseFloat(alltax) 		+ 	parseFloat(itax);
				ovtotal 		= 	parseFloat(ovtotal) 	+ 	parseFloat(iototal);
				stylenoitems 	= 	parseInt(stylenoitems) 	+ 	parseInt(iqty);
				stylesubtotal 	= 	parseFloat(stylesubtotal) 	+ 	parseFloat(itotal);
				styletaxvat 	= 	parseFloat(styletaxvat) 	+ 	parseFloat(ivat);
				stylealltax 	= 	parseFloat(stylealltax) 	+ 	parseFloat(itax);
				styleovtotal 	= 	parseFloat(styleovtotal) 	+	parseFloat(iototal);
			});
			pritem.qty 		= 	parseInt(stylenoitems);
			pritem.total 	= 	parseFloat(styleovtotal).toFixed(2);
			pritem.subtotal = 	parseFloat(stylesubtotal).toFixed(2);
			pritem.vat 		=	parseFloat(styletaxvat).toFixed(2);
			pritem.tax 		=	parseFloat(stylealltax).toFixed(2);
		});
		
		$scope.form.numberOfSKU 	= 	parseFloat(noitems);
		var subtotals3 				= 	parseFloat(subtotal) ;
		$scope.allsubtotal 			= 	parseFloat(subtotals3).toFixed(2);
		$scope.allsubtaxes 			= 	parseFloat(alltax).toFixed(2);
		$scope.allsubvates 			= 	parseFloat(taxvat).toFixed(2);
		var alltotal 				= 	parseFloat($scope.allsubtotal) + parseFloat($scope.allsubtaxes);
		$scope.form.totalPurchaseCost 	= 	parseFloat(alltotal).toFixed(2);

		angular.forEach($scope.skuslist, function(item){
	    		skuItem 	=	skuItem + item.skus.length;	
	    });
    	$scope.form.numberOfPackages = skuItem;
    	$scope.list	=	newlist;
		$scope.listPROD	=	newlist;

		//--Stocklookup Session Delete--//
		if(sessionStorage.locationname && sessionStorage.skuid){
			delete sessionStorage.locationname; 
			delete sessionStorage.skuid;
		}
	};

	$scope.getmodifiedsku    =   function(styleskus, upload){
        $scope.changedSkus   =  styleskus;
        var skulength   =   styleskus.length;
        var newskus     =   skulength ? $scope.changedSkus : Object.keys($scope.changedSkus);
        var selectedskus=   newskus.join(',');
		var stostore = $scope.form.shiptostore;
		var locSkus  = [];
		ovcDash.get('apis/ang_loc_skuproducts?srch=' + selectedskus + '&locid=' + encodeURIComponent(stostore)).then(function(data) {
			if (data && data.status != 'error') {
                if(!upload)
                $scope.prod_detail = {};

				angular.forEach(data , function(val, key){
                    if(val.ProductTbl && val.ProductTbl.sku)
                    $scope.prod_detail[val.ProductTbl.sku] = val.ProductTbl;
                });

                if($scope.withPagination){
                    skuGroupAssign(selectedskus , 'fileUpload')
                }else{
                    $scope.addnewskus(newskus,stostore,upload);
                }
			}else{
                var output  =   {"status": "error","message":$scope.ovcLabel.adjustments.error.no_products};
                if($scope.withPagination)
                chunkDataCall('upload')
            }
		});	
	};

	$scope.addnewskus  =   function(newskus,stostore,upload){
        $scope.currency     =   currencylabel[currencylist[stostore]];
        var priceService = Utils.POCalculation(newskus , upload, stostore , $scope.prod_detail , $scope.changedSkus , $scope.uploadSkus, addedskus);
        priceService.then(function(skus){
			angular.forEach(skus,function(resultantsku){
				var cost 		= 	parseFloat(resultantsku.Cost).toFixed(2);
				var Tax   		= 	resultantsku.isVAT;
				var vTax  		= 	resultantsku.percentage;
				var qtyvalue 	=	parseInt(resultantsku.quantity);
				var totalc 		= 	povat 		= 	vat_total 	=	0;
				var newprod 	= 	false;
				var prtax 		= 	tax_tot 	= 	sptax 	= 	spvat 	= 	sptaxes	 = 	spvates 	 =	 tot_wtax = 0;
				var newstyle 	= 	resultantsku.sku.toString();
				var idx  		= 	$scope.oldpids.indexOf(newstyle);
				
					angular.forEach($scope.listPROD, function(lval, lindex) {
						if (lval.productCode == resultantsku.sku) {
							var qty 	= 	parseInt(lval.qty) + qtyvalue;
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
						var qty 	= 	parseInt(qtyvalue);
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
							variants:resultantsku.variants,styleColor:resultantsku.color
						});
						$scope.list = $scope.listPROD;
					 
						angular.forEach($scope.listPROD, function(lval, lindex) {
							if (lval.productCode == resultantsku.sku) {
								if (lval.taxisVAT == 1) {
									$scope.calcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.totalProductVat, lval.style);
								} else if (lval.taxisVAT == 0) {
									$scope.calcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.totalProductTax,lval.style );
								}
							}
						});
					}

					$scope.list = $scope.listPROD;
                    if($scope.list.length > 0){
                        $scope.tab.error['skusearch']   =   false;
                    }
			});
			price_detail			=	[];
			addedskus				=	[];
            if(!upload)
			$scope.prod_detail     	=   {};
			$scope.changedSkus     	=   [];
	    });
	};
	
	/****Quantity Change Calculation***/
	 $scope.calcItems1 = function(pindex, qty, cost, ptotal, prcode, style) {
		var stylecode 	=	style;
        var nindex 		= 	pindex;
        var quantity 	= 	parseInt(qty);
        var eachcost    = cost;
        var eachcost 	= 	parseFloat(cost).toFixed(2);
       	var to_tal 		= 	(quantity * eachcost);
        var loc 		= 	$scope.form.shiptostore;
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
                tot_wtax1   = parseFloat(to_tal).toFixed(2);
                povat1      = 	parseFloat(to_tal * taxcal).toFixed(2);
                spvat1      = 	(cost * taxcal);
                totalc1     = 	parseFloat(to_tal).toFixed(2);
				$scope.skuslist[style]['skus'][nindex].total 			= 	tot_wtax1;
				$scope.skuslist[style]['skus'][nindex].totalnotax 		= 	totalc1;
                $scope.skuslist[style]['skus'][nindex].totalProductVat 	= 	povat1; 
				$scope.calcItems(nindex, qty, cost, totalc1, tot_wtax1, tax_tot1, stylecode);
            }

        });	
    };

	$scope.skuslist = [];	


    $scope.add_validation   =   function(data,upload , saveFun){
        $scope.tab.error        =   {};
        $scope.tab.errormsg     =   {};
        var errorArray          =   [];
             if(!$scope.form.shiptostore){
                errorArray.push({'id' : 'storelocation', 'message' : $scope.ovcLabel.adjustments.error.select_store });
            }
            if(!$scope.form.adjustCode){
                errorArray.push({'id': 'prcode', 'message' : $scope.ovcLabel.adjustments.error.slct_adjustment_code });
            }
            if(!$scope.form.adjustName){
                errorArray.push({'id' : 'adj_name', 'message' : $scope.ovcLabel.adjustments.error.slct_adjustment_name });
            }
            if(!$scope.form.reasonCode){
                errorArray.push({'id' : 'res_code', 'message' : $scope.ovcLabel.adjustments.error.slct_reason_code });
            }
            if(!saveFun){
                if(!(data.prodresult || data.styleresult || upload)) {
                    errorArray.push({'id' : 'skusearch', 'message' : $scope.ovcLabel.adjustments.error.atleast_onesku });
                }
            }
            if(saveFun &&  saveFun === 'Adjusted') {
                var objectKey   =   Object.keys($scope.skuslist);
                if(!$scope.withPagination){
                    if($scope.skuslist && objectKey.length > 0){
                        if( objectKey && $scope.skuslist[objectKey[0]].skus.length == 0){
                            errorArray.push({'id': 'skusearch', 'message' : $scope.ovcLabel.adjustments.error.atleast_onesku });
                        }
                    }else{
                        errorArray.push({'id': 'skusearch', 'message' : $scope.ovcLabel.adjustments.error.atleast_onesku });
                    }
                }else{
                    if($scope.skuslist.length == 0)
                        errorArray.push({'id': 'skusearch', 'message' : $scope.ovcLabel.adjustments.error.atleast_onesku });
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

    /****Save / Adjust The Adjustment product***/
    $scope.save_adjustment 		=	function(formData,skuData,adjstatus){
        var findQty = $('.sku_config_head tbody').find('.qtyZero');
        var qtyCheck = findQty.length;
        if(qtyCheck > 0 && adjstatus === "Adjusted"){
            var output = {"status": "error","message": "Quantity should be greater than 0."};
            Data.toast(output);
            return false;
        }
        if($scope.add_validation($scope.po_add,'upload', adjstatus)){
        	$scope.disabled++;
        	if($stateParams['isReversal']){

    			state_adjustId 	=  0;
    			if(adjstatus == "Adjusted"){
    				adjstatus = "adjusted_rvs";
    			}
    		}
    		if ($scope.form.adjustStatus){
    			if((adjstatus == "Draft") && ($scope.form.adjustStatus == $scope.ovcLabel.adjustments.list.draft_reversed)){
    				adjstatus = "rvs_draft";
    			}
    			if((adjstatus == "Adjusted") && ($scope.form.adjustStatus == $scope.ovcLabel.adjustments.list.draft_reversed)){
    				adjstatus = "adjusted_rvs";
    			}

    		}

            if(sessionStorage.copyadj && !$scope.withPagination){
                state_adjustId  =  0;
            }

    		
        	var location 		=	$scope.form.shiptostore;
        	var adjust_status   =	adjstatus;
        	var	 adjustedit_no	=	$scope.adjustment_no  ? $scope.adjustment_no : "";
            var  adjust_code = formData.adjustCode ? formData.adjustCode : "";
            var  adjust_name = formData.adjustName ? formData.adjustName : "";
            var  reason_code = formData.reasonCode ? formData.reasonCode : "";
            if($scope.form.adjustmentNumber){
                var  adjustedit_no  =   $scope.form.adjustmentNumber;

            }

      		if (formData != undefined) {

                var newobj = {
                	adjustmentCode 	: 	adjust_code,
                    adjustmentName 	: 	adjust_name,
                    storeId 		: 	location,
                	createdBy 		: 	userId,
                    adjustmentStatus:  	adjust_status,
                    ReasonCodeID 	: 	reason_code,
                	numberOfProducts: 	formData.numberOfPackages ? formData.numberOfPackages : 0,
                    numberOfSKU 	: 	formData.numberOfSKU ? formData.numberOfSKU : 0,
                    comment 		: 	formData.comment,
                	totalAdjustmentCost : 	formData.totalPurchaseCost ? formData.totalPurchaseCost : 0,
                    orderNumber 	: 	formData.orderNumber,
                    adjustmentNumber: 	adjustedit_no
                }

                if($stateParams['isReversal']){
    				newobj.isReversal 	=  $stateParams['isReversal'];
    				newobj.isReversed 	=  true;
    			}
            }
            if(!$scope.withPagination || !$scope.list || $scope.list.length === 0 || newobj.isReversal){
                if((state_adjustId == 0) && ($scope.disabled == 1)){
                	Data.put('/adjustment', {
                        data: newobj
                    }).then(function(results) {
                    	if (results.__v == 0) {
                            var adjust_status   =   results.adjustmentStatus;
                            if ($scope.list != undefined) {

                                //construcuting adjustment data object to publish to JMS
                                var adjustExportObj     =   {};

                                adjustExportObj.adjustmentNumber   =   results.adjustmentNumber;
                                // adjustExportObj.adjustmentCode     =   results.adjustmentCode;
                                // adjustExportObj.adjustmentName     =   results.adjustmentName;
                                // adjustExportObj.reasonCode         =   results.ReasonCodeID;
                                adjustExportObj.status             =   results.adjustmentStatus;
                                adjustExportObj.storeId            =   results.storeId;
                                adjustExportObj.created            =   results.created;
                                adjustExportObj.createdBy          =   results.createdBy;
                                adjustExportObj.updatedBy          =   results.updatedBy;
                                adjustExportObj.adjustment        =   [];

                                adjustExportObj.adjustment.push({
                                    adjustmentCode: results.adjustmentCode,
                                    reasonCode: results.ReasonCodeID,
                                    adjustmentName: results.adjustmentName
                                });

                                // adjustExportObj.adjustment.adjustmentItem   =   [];

        						var neworditems = $scope.list;
        						var adjust_number 	=	results.adjustmentNumber;
        						var store_id		= 	results.storeId;
        						var transtype_id	=  	results.adjustmentName;
                                var putArray        =   [];
        						angular.forEach(neworditems, function(item,key) {
        							var dataobj = {
                                        lineNumber 			: 	item.lineNumber,	SKU 				: 	item.productCode,		productCode			: 	item.style,
        								productName			: 	item.name,			productDescription 	: 	item.description,		producUom			: 	item.selectedUOM,
        								isVat 				: 	item.taxisVAT,      qty 				: 	item.qty,			    adjustmentNumber 	: 	adjust_number,
        								styleColor 			: 	item.styleColor, 	styleDescription 	: 	item.styleDescription,  Wac					: 	item.Wac, UOM :item.selectedUOM,		
            							storeId				: 	store_id,			transtypeid			: 	transtype_id,			adjustmentStatus	: 	adjust_status,
                                        variants            :   item.variants
        							}
                                    dataobj.productCost         =   item.cost ? float(item.cost) : float(0);
                                    dataobj.productTax          =   item.productTax ? float(item.cost) : float(0);
                                    dataobj.productVat          =   item.productVat ? float(item.productVat): float(0);
                                    dataobj.totalProductTax     =   item.totalProductTax ? float(item.totalProductTax) : float(0);
                                    dataobj.totalProductVat     =   item.totalProductVat ? float(item.totalProductVat) : float(0);
                                    dataobj.totalProductCost    =   item.totalnotax ? float(item.totalnotax) : float(0);
                                    putArray.push(dataobj);
        						});
                                
                                //===============Agjustment saved as a Draft insert================//
                                if(putArray.length > 0){
                                    var service_data    =   {};
                                    service_data.arrData    =   putArray;
                                    
                                    if ((exportConfig && configStatus.indexOf(adjustExportObj.status) != -1) && (OVC_CONFIG.JMS_QUEUEADJUSTEXPORT && OVC_CONFIG.JMS_QUEUEADJUSTEXPORT != '') )
                                        service_data.exportData =   adjustExportObj;
          
                                    Data.put('/adjustmentitem', { data: service_data}).then(function(result) {
                            
                                    });
                                }
        					}
        				}
        				if (results.__v == 0) {
        					if((adjust_status 	==	'Draft')||(adjust_status 	==	'rvs_draft'))
        						if($stateParams['isReversal']){
        							state_adjustId 	=  0;
        							var output = {"status": "success","message": $scope.ovcLabel.adjustments.list.addAdjust};
        						}
        				        else {
        							var output = {"status": "success","message": $scope.ovcLabel.adjustments.list.draft_adjust};
        						}
        					if(adjust_status 	==	'Adjusted')
        					var output = {"status": "success","message": $scope.ovcLabel.adjustments.list.adjust_success};
        					//adjusted_rvs
        					if(adjust_status 	==	'adjusted_rvs')
        					var output = {"status": "success","message": $scope.ovcLabel.adjustments.list.adjust_reverse_success};
        				}
        				Data.toast(output);
        				$state.go('ovc.adjustment-list');
                    });
                }else if($scope.disabled == 1){
                	Data.post('/adjustment/' + state_adjustId, {
                        data: newobj
                    }).then(function(results) {
                        
                    	if (results.ok == 1) {
                            if ($scope.list != undefined) {

                                //construcuting adjustment data object to publish to JMS
                                var resultObj   =   results.dataObj;
                                var adjustExportObj     =   {};

                                adjustExportObj.adjustmentNumber   =   resultObj.adjustmentNumber;
                                // adjustExportObj.adjustmentCode     =   resultObj.adjustmentCode;
                                // adjustExportObj.adjustmentName     =   resultObj.adjustmentName;
                                // adjustExportObj.reasonCode         =   resultObj.ReasonCodeID;
                                adjustExportObj.status             =   resultObj.adjustmentStatus;
                                adjustExportObj.storeId            =   resultObj.storeId;
                                adjustExportObj.created            =   $scope.ship.created;
                                adjustExportObj.createdBy          =   $scope.ship.createdby;
                                adjustExportObj.updatedBy          =   resultObj.updatedBy;
                                adjustExportObj.adjustment         =   [];

                                adjustExportObj.adjustment.push({
                                    adjustmentCode: resultObj.adjustmentCode,
                                    reasonCode: resultObj.ReasonCodeID,
                                    adjustmentName: resultObj.adjustmentName
                                });

        						var neworditems = $scope.list;
                                var putArrayEdit        =   [];
                                var postArrayEdit       =   [];
        						angular.forEach(neworditems, function(item,key){
        							var adjItemId 	=	item.id;
                                    var changed     =   true;
                                    if(item.id !=''){
                                        changed     =   item.changed;
                                    }
                                    if(changed){
                                        var dataobj = {
                                            lineNumber          :   item.lineNumber,    SKU                 :   item.productCode,       productCode         :   item.style,
                                            productName         :   item.name,          productDescription  :   item.description,       producUom           :   item.selectedUOM,
                                            isVat               :   item.taxisVAT,      qty                 :   item.qty,               adjustmentNumber    :   adjustedit_no,
                                            styleColor          :   item.styleColor,    styleDescription    :   item.styleDescription,  WAC                 :   item.Wac, UOM :item.selectedUOM,
                                            adjustmentStatus    :   adjust_status,      storeId             :   location,               transtypeid         :   adjust_name,
                                            variants            :   item.variants
                                        }
                                        dataobj.productCost         =   item.cost ? float(item.cost) : float(0);
                                        dataobj.productTax          =   item.productTax ? float(item.cost) : float(0);
                                        dataobj.productVat          =   item.productVat ? float(item.productVat): float(0);
                                        dataobj.totalProductTax     =   item.totalProductTax ? float(item.totalProductTax) : float(0);
                                        dataobj.totalProductVat     =   item.totalProductVat ? float(item.totalProductVat) : float(0);
                                        dataobj.totalProductCost    =   item.totalnotax ? float(item.totalnotax) : float(0);
                                    }
        							
                                    if(item.id !=''){
                                        if(item.changed && dataobj){
                                            dataobj._id     =    item.id
                                            postArrayEdit.push(dataobj);
                                        }
                                    }
                                    if(item.id =='' && dataobj){
                                        putArrayEdit.push(dataobj);
                                    }
        						});

                                var service_flag     =   false;
                                //========== Post Service For adjustment item update==========//
                                if(postArrayEdit.length > 0){
                                    service_flag = true;
                                    var service_data    =   {};
                                    service_data.arrData    =   postArrayEdit;

                                    if ((exportConfig && configStatus.indexOf(adjustExportObj.status) != -1) && (OVC_CONFIG.JMS_QUEUEADJUSTEXPORT && OVC_CONFIG.JMS_QUEUEADJUSTEXPORT != '') )
                                        service_data.exportData =   adjustExportObj;

                                    Data.post('/adjustmentitem/', { data: service_data}).then(function(result) {
                                    
                                    });
                                }

                                //============Put Service for adjustment item insert==============//
                                if(putArrayEdit.length > 0){

                                    var service_data    =   {};
                                    service_data.arrData    =   putArrayEdit;

                                    if (!service_flag && exportConfig && configStatus.indexOf(adjustExportObj.status) != -1) {
                                        service_data.exportData =   adjustExportObj;
                                    }

                                    Data.put('/adjustmentitem',{ data: service_data}).then(function(result) {
                                
                                    });
                                }   
        					}
        				}
        				if (results.ok == 1) {
        					if(adjust_status 	==	'rvs_draft')
        					var output = {"status": "success","message": $scope.ovcLabel.adjustments.list.save_reversal_draft};
        					if(adjust_status 	==	'Draft')
        					var output = {"status": "success","message": $scope.ovcLabel.adjustments.list.draft_adjust};
        					if(adjust_status 	==	'Adjusted')
        					var output = {"status": "success","message": $scope.ovcLabel.adjustments.list.adjust_success};
        					if(adjust_status 	==	'adjusted_rvs')
        					var output = {"status": "success","message": $scope.ovcLabel.adjustments.list.adjust_success};
        				}
        				Data.toast(output);
        				$state.go('ovc.adjustment-list');
        			});
                }
            }else{
                if($scope.disabled == 1){
                    newobj.export_config = {status:configStatus, isPublish: exportConfig};
                    Data.post('/adjustment/' + state_adjustId, {
                        data: newobj
                    }).then(function(results) {
                        if (results.ok == 1) {
                            if(adjust_status    ==  'rvs_draft')
                            var output = {"status": "success","message": $scope.ovcLabel.adjustments.list.save_reversal_draft};
                            if(adjust_status    ==  'Draft')
                            var output = {"status": "success","message": $scope.ovcLabel.adjustments.list.draft_adjust};
                            if(adjust_status    ==  'Adjusted')
                            var output = {"status": "success","message": $scope.ovcLabel.adjustments.list.adjust_success};
                            if(adjust_status    ==  'adjusted_rvs')
                            var output = {"status": "success","message": $scope.ovcLabel.adjustments.list.adjust_success};
                            
                            Data.toast(output);
                            $state.go('ovc.adjustment-list');
                        }
                        
                    });
                }
            }
        }else{
            console.log('Save Adjustment Validation Error');
        }
    };


	$scope.error_calling 	=	function(){
		$scope.errorSearch = true;
	};

	$scope.editAdjustment 		=	function(){
		if($stateParams['isReversal']){
			$scope.isReversal 	=	true;
			$('#ordersearch :input').attr('disabled', true);
		}
        if( !$scope.withPagination && sessionStorage.copyadj){
            state_adjustId  =   sessionStorage.copyadj;
        }

		if(state_adjustId != 0 || sessionStorage.copyadj || sessionStorage.copyAdjustNumber) {
			$scope.adjustmentTitle			=	$scope.ovcLabel.adjustments.labels.editAdjustment
            if($scope.withPagination && $state.current.name == "ovc.adjustment-copy"){
                var obj     =   {data:{adjustmentNumber : sessionStorage.copyAdjustNumber,
                                        page_lmt:$scope.form.entryLimit,
                                        }};
                Data.post('/copyadjustment', obj).then(function(adjustData){
                    if(!adjustData.error && adjustData.adjustment_data){
                        getResult(adjustData.adjustment_data);
                    }else{
                        console.info('CopyAdjustment Failed');
                    }
                }, function(error){
                    console.info('CopyAdjustment Failed');
                });
            }else{
                Data.get('/adjustment?id=' + state_adjustId).then(function(adjustData) {
                    if(adjustData){
                        getResult(adjustData);
                    }
                }, function(error){
                    console.info('Adjustment?id Failed');
                });
            }
			
            function getResult(results){
				$scope.isReversed			=	results.isReversed;
                $scope.tempAdjustData       =   results;
				var currentId 				=	results.storeId;
				$scope.form.shiptostore 	=	results.storeId;	
				$scope.currency     		=   currencylabel[currencylist[$scope.form.shiptostore]];
				$scope.adjustment_no 		=	results.adjustmentNumber;
				var adjust_no 				=	results.adjustmentNumber;
                $scope.form.adjustNumber    =   adjust_no;
				$scope.action.tostore 		=	$scope.locationArray[currentId];
				$scope.form.numberOfSKU 	=	results.numberOfSKU;
				$scope.form.adjustCode 		=	results.adjustmentCode;
				$scope.form.adjustName 		=	results.adjustmentName;
				$scope.form.adjustNumber	=	results.adjustmentNumber;
				$scope.form.adjustStatus 	=	$scope.ovcLabel.adjustments.adjstatuslist[results.adjustmentStatus];
				$scope.form.reasonCode 		=	results.ReasonCodeID;
				$scope.ship.createdby 		=	results.createdBy;
                $scope.ship.created         =   results.created;
				$scope.form.orderNumber	 	=	results.orderNumber;
				$scope.form.comment			=	results.comment;
				$scope.form.numberOfPackages= 	results.numberOfProducts;
				$scope.action.adjustCode 	=	$scope.translation.translist[0][results.adjustmentCode];
				$scope.action.reasonCode 	=	$scope.resCodeArray[results.ReasonCodeID];
				$scope.action.show_rev		=	$scope.revTran[results.adjustmentName]?true:false;
				$scope.ship.adjustCode 		=	results.adjustmentName;
				$scope.action.adjustName 	= 	$scope.allTranType[results.adjustmentCode][results.adjustmentName]['tranName'];
				$scope.isManualTransaction  = 	results.isManualTransaction;

				if(results.adjustmentStatus == 'reversed'){
					$scope.form.reversedetail	 	=	results.reversalAdjustmentNumber;
					
				}
				if(results.originalAdjustmentNumber){
					$scope.form.originaladjust      =  true;
					$scope.form.originaldetail	 	=	results.originalAdjustmentNumber;
					
				}

				if(sessionStorage.copyadj){
    				$scope.adjustmentTitle			=	$scope.ovcLabel.adjustments.labels.copyAdjustment;
    				!$scope.withPagination ? $scope.form.adjustNumber =	'' : '';
    				!$scope.withPagination ? $scope.form.adjustStatus =	'' : '';
    			}
				if($scope.isReversal){ 
					$scope.adjustmentTitle			=	$scope.ovcLabel.adjustments.labels.reverseadjustment;
					$scope.form.adjustStatus 		= 	$scope.ovcLabel.adjustments.list.draft_reversed;
					//$scope.form.adjustStatus 		= 	"rvs_draft";
					//$scope.translation.adjustments.rvs_draft;
					try{
						$scope.form.adjustName 	= 	$scope.revTran[results.adjustmentName]['tranTypeId'];
					}
					catch(ex){
						var output = {
							"status": "error",
							"message": "No reversal Transaction found"
						};
						Data.toast(output);
					}
				}

				angular.forEach(Object.keys($scope.allTranType), function(key){
					var tranTypes 	=	Object.keys($scope.allTranType[key]);
					if(tranTypes.indexOf($scope.form.adjustName) > -1){
						$scope.form.adjustCode 		=	key;
						$scope.getAdjustName(key);
					}
				});

                //For Qty Filed Edit
                if($state.current.name == 'ovc.adjustment-copy' || $state.current.name == 'ovc.adjustment-edit')
                    $scope.action.editable  =  true; 
                if($state.current.name =='ovc.adjustment-summary')
					$scope.action.editable 		=	false;
					
				groupingSkuCall(adjust_no , results);
				
				if(results.adjustmentStatus == 'reversed'){
				   var users = $scope.ship.createdby+','+results.reversedBy;
			    }else{
			    	var users = $scope.ship.createdby;
			    }
				
				ovcDash.get('apis/ang_usernameall?user_id=' + users).then(function(userdata) {
					
					if(userdata){
						if(results.adjustmentStatus == 'reversed'){
							$scope.form.createdby = $scope.action.createdby 	=	userdata[$scope.ship.createdby].firstName + ' ' + userdata[$scope.ship.createdby].lastName;
							$scope.form.reversedby= $scope.action.reversedby 	=	userdata[results.reversedBy].firstName + ' ' + userdata[results.reversedBy].lastName;
						}else{
							var fname 	=	userdata[$scope.ship.createdby].firstName;
							var lname 	=	userdata[$scope.ship.createdby].lastName
							$scope.form.createdby = $scope.action.createdby 	=	fname + ' ' + lname;
						}
					}
				});
            }
			// });
		}
	};
    
	$scope.adjustmentCopy 	=	function(copyId , adjust_no){
		sessionStorage.copyadj 	=	copyId;
        sessionStorage.copyAdjustNumber     =   adjust_no;
		$state.go('ovc.adjustment-copy');
	}

	/* Reverse Adjustment */
	$scope.reverseAdjustment 	=	function(adjust_id, adjustName){
		var revTranName_indexVal = $scope.revTranName.indexOf(adjustName);
        var has_rev_tran 		 = $scope.revTran[$scope.form.adjustName];
        var is_man_tran 	= 	false;
        
        if(has_rev_tran){
        	is_man_tran = $scope.revTran[$scope.form.adjustName]['isManualTransaction'];
        }

        if( adjustName && revTranName_indexVal != -1 && has_rev_tran && is_man_tran){
        	// $scope.sample=0;
        	// var sampledraft=$scope.sample;
           	$state.go('ovc.adjustment-edit', {adjust_id:adjust_id,isReversal:adjust_id});

        }

        else{
        	var output = {
				"status": "error",
				"message": "No reversal Transaction found"
			};
			Data.toast(output);
        }

        

	};	
	$scope.cancelBtn 	=	function(){
		$state.go('ovc.adjustment-list');		
	};

    $scope.deleteBtn    =   function(){
        $.confirm({
            title: delete_header,
            content: 'Confirm Delete?',
            confirmButtonClass: 'btn-primary',
            cancelButtonClass: 'btn-primary',
            confirmButton: 'Ok',
            cancelButton: 'Cancel',
            confirm: function () {
                Data.delete('/adjustment/' + $stateParams.adjust_id + '?adjustmentNumber=' + $scope.form.adjustNumber).then(function (data) {
                    if(data.ok == 1){
                        var output={"status":"success","message":delete_adjustment};
                        $state.go('ovc.adjustment-list');
                    } else {
                        var output={"status":"error","message":delete_fail};
                    }
                    Data.toast(output);
                });
            },
            cancel: function() {
                return false;
            }
        });
        return false;
    };


	$scope.saveadjustment=function(formData,skuData,adjstatus){

		if($stateParams['isReversal']){
			//$scope.save_as_draft(formData,skuData,"rvs_draft");
			$scope.save_adjustment(formData,skuData,"rvs_draft");
		}
		else{
			$scope.save_adjustment(formData,skuData,adjstatus);
		}
	}
	//ReDirection of Stocklookup
	if(sessionStorage.locationname && sessionStorage.skuid){
			$scope.stocklookup 			=	true;
			$scope.form.shiptostore 	= 	sessionStorage.locationname;
			$scope.selected_sku 		= 	sessionStorage.skuid;
			$scope.po_add.prodresult 	= 	sessionStorage.skuid;
			$scope.ship.sku_select 		= 	$scope.selected_sku;
	        ovcDash.get('apis/ang_children_location?locationId=' + encodeURIComponent($scope.form.shiptostore)).then(function(data) {
	            if ((data.status != 'error')) {
	                $scope.form.shiptostore = data.location[0].id;
					$scope.dosrchproduct($scope.selected_sku,function(result){
						if(result){
							$scope.order_product();
						}else {
							// Ratheesh (29.7.2016)
			                var output = {
			                    "status": "error",
			                    "message": "The sku is not available in the store."
			                };
			                Data.toast(output);
						}
					});
	            } else {
	                var output = {
	                    "status": "success",
	                    "message": "location not found."
	                };
	                Data.toast(output);
	                $scope.back();
	            }
	        });
	}

    function ChunkFunction(newskus){
        $scope.uploadSkus = newskus;
        $scope.prod_detail= {};
        var chunkObj = Object.keys(newskus);
        var chunk = function(arr, len) {
            var arrays = [], size = len;

            while (arr.length > 0)
                arrays.push(arr.splice(0, size));

            return arrays;
        }
        var chunkeddata = chunk(chunkObj, 100);
        $scope.ChunkedData  =   chunkeddata;
        uploadCount  = 0;
        if($scope.withPagination){
            $scope.getmodifiedsku(chunkeddata[0],'chunk');
        }else{
            angular.forEach(chunkeddata, function(chunkitem){
                $scope.getmodifiedsku(chunkitem,'chunk');
            });
        }
        
    }

	//upload file Function
	$scope.uploadAdjust 		=	function($fileContent,$file){
		$scope.import 			=	true;
		var zoneFile 			=	$scope.adjustfile;
        helper.datSplitup($fileContent).then(function(datData){
            ChunkFunction(datData);
        });
	};

    //File Upload Validation
    $scope.adjustFileupload = function(event){
        if (! $scope.add_validation($scope.po_add,'upload')) {
            event.preventDefault();
            return false;
        }
    }

    function groupingSkuCall (adjust_no , results){
        
        if(adjust_no){
            var paginationData = $scope.withPagination ? '&page_offset='+ $scope.form.offset + '&page_lmt='+$scope.form.entryLimit : "";
            Data.get('/adjustmentitem?adjustmentNumber=' + adjust_no + paginationData).then(function(skudatas) {
                if(skudatas){
                    SKUListUpdate(skudatas , results);
                }else{
                    console.info('Adjustment Item Failed');
                }
            });
        }else{
            console.info('Adjustment no Is not passed');
        }
    }

    //QTY Change 
    $scope.SKUQTYChange     =   function(skuData){
        var tempObj = {"item_data":[{
                "SKU" : skuData.productCode,
                "productCode" : skuData.style || "",
                "productName" : skuData.description || "",
                "isVat" : skuData.taxisVAT || 0,
                "adjustmentNumber" : $scope.form.adjustNumber || "",
                "styleColor" : skuData.styleColor,
                "producUom": skuData.selectedUOM,
                "styleDescription" : skuData.description,
                "storeId" : $scope.form.shiptostore,
                "purchasePrice":skuData.cost,
                "variants" : skuData.variants || [],
                "vatPercentage":skuData.percentage || 0,
                "qty":skuData.qty
            }],
            "page_offset" : $scope.form.offset,
            "page_lmt":$scope.form.entryLimit,
            "item_count" : $scope.form.total_count,
            "adjustmentNumber" : $scope.form.adjustNumber || ""
        };
        UpdateOrderItem(tempObj);
    }

    //Manual SKU Add  
    function skuGroupAssign(selectedData , upload){
        if(selectedData){
            var sku         =   upload ? selectedData : selectedData[0]
            var location    =   $scope.form.shiptostore;
            $scope.currency =   currencylabel[currencylist[location]];
            var newobj      =   "";
            if(($state.current.name     ==  'ovc.adjustment-add') &&  ($scope.skuslist.length == 0)){
                var formData    =   $scope.form;
                newobj = {
                    adjustmentCode  :   formData.adjustCode ? formData.adjustCode : "",  adjustmentName  :   formData.adjustName ? formData.adjustName : "",            storeId         :   location,
                    createdby       :   userId,                 adjustmentStatus:   'Draft',                ReasonCodeID    :   formData.reasonCode ? formData.reasonCode : "",
                    numberOfProducts:   formData.numberOfPackages,          numberOfSKU     :   formData.numberOfSKU,   comment         :   formData.comment,
                    totalAdjustmentCost :   formData.totalPurchaseCost,     orderNumber     :   formData.orderNumber,   adjustmentNumber:   $scope.adjustment_no  ? $scope.adjustment_no : ""
                }
            }

            ovcDash.get('apis/ang_skus_getproductprice?sku=' + sku + '&loc=' + encodeURIComponent(location)).then(function(result) {
                var tempArray   =   [];

                angular.forEach(result, function(value){
                    var skuDetail   =   upload ? $scope.prod_detail[value.ProductPrice.sku] : $scope.allSKUobj[value.ProductPrice.sku];
                    if(result && skuDetail){
                        var temp   =    {
                            "SKU" : value.ProductPrice.sku,
                            "productCode" : skuDetail.productCode || "",
                            "productName" : skuDetail.name || "",
                            "isVat" : value.ProductPrice.isVAT || 0,
                            "adjustmentNumber" : $scope.form.adjustNumber || "",
                            "styleColor" : skuDetail.color,
                            "styleDescription" : skuDetail.styleDescription,
                            "storeId" : location,
                            "purchasePrice":value.ProductPrice.Cost,
                            "producUom": uomlist['Each'] || '',
                            "variants" : skuDetail.variants || [],
                            "vatPercentage":value.ProductPrice.percentage
                        }
                        if(upload && $scope.uploadSkus){
                            temp.qty = ($scope.uploadSkus[value.ProductPrice.sku]||$scope.uploadSkus[value.ProductPrice.barcode]);
                        }
                        tempArray.push(temp);
                    }
                });
                var tempObj     =   {
                    "item_data":tempArray,
                    "page_offset" : $scope.form.offset,
                    "page_lmt":$scope.form.entryLimit,
                    "item_count" : $scope.form.total_count,
                    "adjustmentNumber" : $scope.form.adjustNumber || ""
                }
                if(newobj){
                    tempObj.adjustment_data = newobj;
                }
                tempObj.fileUpload = upload ? true : false;

                UpdateOrderItem(tempObj , upload);
            });
        }
    }

    //Qty Change Update order item //Common
    function UpdateOrderItem (itemObj , upload){
        if(itemObj){
            var obj     =   {data:{"adjustmentItem":JSON.stringify(itemObj)}} ;
            Data.post('/checkAdjustmentItem', obj).then(function(result){
                if(!result.error){
                    snackbar.create("Changes Saved Successfully !");
                    SKUListUpdate(result , '', upload)
                }
            });
        }
    }
    //For upload Data Set
    var uploadCount  = 0;
    //SKU List Update //Common
    function SKUListUpdate (skudatas , results , upload){
        if(upload)
            uploadCount++;

        var adjitem         =   skudatas.item_data;
        var adjustitemlist  =   [];
        var tempcost   =  0;
        angular.forEach(adjitem, function(item){
            var quantities  =   parseInt(item.qty);
            var prcost      =   parseFloat(item.productCost).toFixed(2);
            var prtcost     =   parseFloat(item.totalProductCost).toFixed(2);
            var prttax      =   parseFloat(item.totalProductTax).toFixed(2);
            var prttotal    =   prtcost + prttax;
            if (item.isVat == '0' ) {
                var totwithtax = parseFloat(prttotal).toFixed(2);
            } else {
                var totwithtax = parseFloat(item.totalProductCost).toFixed(2);
            }
            tempcost           =    parseFloat(tempcost) + parseFloat(totwithtax);

            var adjustData = {
                lineNumber      :   item.lineNumber,
                sku             :   item.SKU,
                style           :   item.productCode,
                productCode     :   item.SKU,
                name            :   item.productName,
                description     :   item.productName,
                cost            :   prcost,
                selectedUOM     :   item.producUom,
                qty             :   quantities,
                originalQty     :   quantities,
                totalnotax      :   prtcost,
                totalProductTax :   item.totalProductTax,
                taxisVAT        :   item.isVat,
                totalProductVat :   item.totalProductVat,
                productTax      :   item.productTax,
                productVat      :   item.productVat,
                total           :   totwithtax,
                id              :   item._id,
                styleDescription:   item.styleDescription,
                styleColor      :   item.color,
                variants        :   item.variants
            };
            adjustitemlist.push(adjustData);
        });
        $scope.list     = adjustitemlist;
        if($scope.withPagination){
            $scope.skuslist = $scope.list;
        }else{
            $scope.listPROD = $scope.list;
            $scope.skuslist = StyleGroupService.getstylegroup($scope.list);
        }
        if(skudatas.adjustment_data){
            $scope.form.adjustNumber    =   skudatas.adjustment_data.adjustmentNumber;
        }
        skudatas.adjustment_data ? $scope.tempAdjustData = skudatas.adjustment_data : "";
        $scope.form.adjustmentNumber    =   results ? results.adjustmentNumber : skudatas.adjustment_data.adjustmentNumber;
        $scope.form.total_count         =   skudatas.total_count;
        if ($scope.list.length) {
            $scope.form.totalPurchaseCost   =   results ? results.totalAdjustmentCost : skudatas.adjustment_data.totalAdjustmentCost.toFixed(2);
            $scope.form.numberOfSKU         =   results ? results.numberOfSKU : skudatas.adjustment_data.numberOfSKU;
            $scope.form.numberOfPackages    =   results ? results.numberOfProducts : skudatas.adjustment_data.numberOfProducts;
        }
        else
            $scope.form.totalPurchaseCost = $scope.form.numberOfSKU = $scope.form.numberOfPackages = 0;

        //For First sku add in add page 
        state_adjustId  =  results ? results._id :  skudatas.adjustment_data._id ? skudatas.adjustment_data._id : 0;
        $scope.form.currentPage         =  (parseInt(skudatas.current_offset) /$scope.form.entryLimit) + 1;

        if($scope.ChunkedData && $scope.ChunkedData[uploadCount])
        chunkDataCall();
    };

    function chunkDataCall(upload){
        if(upload)
            uploadCount++;

        if($scope.ChunkedData && $scope.ChunkedData[uploadCount])
        $scope.getmodifiedsku($scope.ChunkedData[uploadCount],'chunk');
    }


    /**Page change function**/
    $scope.pageChanged  =   function(){
        $scope.form.offset = ($scope.form.currentPage - 1) * $scope.form.entryLimit;
        groupingSkuCall($scope.form.adjustNumber , $scope.tempAdjustData);
    };
});