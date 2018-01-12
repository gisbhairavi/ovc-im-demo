var returnReceipt = angular.module('returnReceipt', ['roleConfig','ui.bootstrap.treeview']);

returnReceipt.factory('ReturnReceiptService', function() {
	var factory = {};


	factory.testing = function() {
		//alert('good');
	};
	return factory;
});

returnReceipt.controller('returnReceiptCtrl', function($rootScope,$scope, $http, $window, $timeout, $stateParams, $state, Data, ovcDash, $filter, toaster,
ORDERSTATUS, RETURNTYPELIST, RECEIPTTYPES, REVERSEREASONS, ORGANIZATIONSTRUCTURE, system_settings, system_currencies, $compile, $location, $anchorScroll, roleConfigService, TreeViewService , Utils) {
	$scope.addedProducts = [];
	$scope.formData = {};

	if (($scope.action.title == 'add')) {
		$scope.form = {};
		$scope.form.packageData = [];
		// $scope.form.addskuData	= [];
		$scope.form.addskuData	= {};
		$scope.form.numberOfPackages = 0;
		$scope.form.numberOfProducts = 0;
		$scope.form.numberOfSKU = 0;
		$scope.form.totalPoCost = 0;
		$scope.form.totalPoVAT = 0;
		$scope.form.totalPoTax   = 0;
		$scope.form.PoSubtotal	 = 0;
		$scope.form.returnNumber = '';
		$scope.form.order_number = '';
		$scope.form.currentpackage = '';
	}
	$scope.allvendorvalues 	=	[];
	$scope.allskusvalues 	=	[];
	$scope.lang = $scope.ovcLabel[$scope.action.labelMode];
	$scope.formData.purchaseOrders = [];
	$scope.srchedSkuProducts = [];
	$scope.srchedStyleProducts = [];
	$scope.formData.reverse_package	 = false;
	$scope.formData.selected_package = '';
	$scope.formData.reverse_data     = {};
	$scope.formData.reason           = '';
	$scope.formData.reverse_date  	 =  new Date();
	var sys_organization =	ORGANIZATIONSTRUCTURE;

	var labelcodes  = $scope.translation.reasonlist[0];
  	var reasoncodes = [];
    angular.forEach(REVERSEREASONS, function(item) {
       item.id    = item.code;
       item.name  = labelcodes[item.code];
       reasoncodes.push(item);
    });
  	$scope.formData.reason_codes = reasoncodes;
  	    
    var organization_obj = {};
    angular.forEach(sys_organization,function(item){
    		organization_obj[item.id]= item.code;
    });
    $scope.organization_struct = organization_obj;

	$scope.clearStyle = function(packageIndex,obj) {
		$scope.getProductDetails(packageIndex,obj);
		$scope.action.formerror['skuData'] =	false;
		$scope.form.packageData[packageIndex].sku = '';
		$scope.srchedStyleProducts = [];
	}
	$scope.addclearStyle = function(addskuData){
		if(addskuData.sku != '')
		$scope.addgetProductDetails(addskuData);
		$scope.action.formerror['skuData'] =	false;
		$scope.form.addskuData.style='';
		$scope.srchedStyleProducts = [];
	}
	$scope.clearSku = function(packageIndex) {
		$scope.action.formerror['skuData'] =	false;
		$scope.form.packageData[packageIndex].sku = '';
		$scope.srchedSkuProducts = [];
	}
	$scope.addclearSku = function(){
		$scope.action.formerror['skuData'] =	false;
		$scope.form.addskuData.sku='';
		$scope.srchedSkuProducts = [];
	}
	$scope.getpackagedata = function(index){
		$scope.form.currentpackage = index;
	}
	$timeout(function(){
        angular.element('.prod_result').focus();
    },500);
    $scope.receivedstore 	=	function(droptype){
    	if(droptype == 'rma_type'){
    		$scope.action.formerror['rma_type'] =	false;
    	}if(droptype == 'vendorId'){
    		$scope.action.formerror['vendorId']	=	false;
    	}

    	$timeout(function(){
        angular.element('.prod_result').focus();
    },500);
    }
	//For ASN Number in Manual Receipt//
	$scope.asnnumber =function(){
		$scope.uniqNumber 	=	function(length){
			return Math.round(+new Date()/1000).toString().substr(2, length);
		};
		$scope.getUniqueID	=	function(length) {
			return Math.random().toString(36).substr(2, length).toUpperCase();
		};
		$scope.form.asnNumber        =   "ASN" + $scope.uniqNumber(5) + $scope.getUniqueID(4);
		$scope.form.receivedDate   	=	 $filter('date')(new Date(), 'MM/dd/yyyy');
	}

	$scope.srchSkuProduct = function(typedthings) {
		if (typedthings != '' && typedthings != undefined) {
			if ($scope.action.type == 'manual' && $scope.form.receiptType == 'MR_MAN') {
				var vendorid = $scope.form.vendorId;

                if($scope.action.primevendors.indexOf($scope.form.vendorId) > -1){
					var loc_id = $scope.form.shipToLocation;
					var sku     =   [];
                    if(typedthings.indexOf('~')){
                        var skuvalue     =   typedthings.split('~');
                        sku             =   skuvalue[0];
                    }
                    else
                        sku         =   typedthings;
	                if(loc_id != undefined && loc_id != ''){
						ovcDash.get('apis/ang_loc_products?srch=' + sku + '&locid=' + encodeURIComponent(loc_id)).then(function(data) {
							if (data.status != 'error') {
								$scope.errormsg 	=	true;
								var rows = [];
								var allvals = {};
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
                                 	allvals[item.ProductTbl.sku] = item;
								});
								$scope.srchedSkuProducts = rows;
								$scope.allskusvalues 	 = 	allvals;
								if(rows.length == 1){
		                        	$scope.doSelectproduct(rows[0],typedthings);
		                        }
							}
							 else{
		                        var output = {
		                          "status": "error",
		                          "message": "No products Found"
		                        };
		                        $scope.transactions = 	[];
		                       	$scope.ship.result 	=	'';
		                       	Data.toast(output);
		                    }
						});
					}
				}
				else{
					var sku     =   [];
                    if(typedthings.indexOf('~')){
                        var skuvalue     =   typedthings.split('~');
                        sku             =   skuvalue[0];
                    }
                    else
                        sku         =   typedthings;
					if(vendorid != undefined && vendorid != ''){
						Data.get('/vendorproduct/' + vendorid + '?vendorSKU=' + sku + '&isDropdown=' + true).then(function(data) {
							if (data != '') {
								$scope.errormsg 	=	true;
								var rows = [];
								var nrows = [];
								var allvals = {};
								angular.forEach(data, function(item) {
									nrows.push(item.vendorSKU);
								});
								if (nrows != '') {
									ovcDash.post('apis/ang_getvendorproducts', {
										data: {
											sku: nrows.join(',')
										}
									}).then(function(results) {
										if (results.status != 'error') {
											$scope.errormsg = true;
											var rows = [];
											var allvals = {};
											var styleData = [];
			                            	var groupData = [];
			                            	var selectedbarcode = [];
			                            	var countbarcode = 0;
											angular.forEach(results, function(item) {
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
			                                 	allvals[item.ProductTbl.sku] = item;
											});
											$scope.srchedSkuProducts = rows;
											$scope.allskusvalues 	 = 	allvals;
											if(rows.length == 1){
					                        	$scope.doSelectproduct(rows[0],typedthings);
					                        }
										}
										 else{
					                        var output = {
					                          "status": "error",
					                          "message": "No products Found"
					                        };
					                        $scope.transactions = 	[];
					                       	$scope.ship.result 	=	'';
					                       	Data.toast(output);
					                    }
									});
								}
							}
						});
					}
				}
			}
			else {
				if ($scope.action.type == 'manual' && $scope.form.receiptType == 'MR_IBT_M') {
					var loc_id = $scope.form.FromLocation;
				} else {
					var loc_id = $scope.form.shipToLocation;
				}
				var sku     =   [];
                    if(typedthings.indexOf('~')){
                        var skuvalue     =   typedthings.split('~');
                        sku             =   skuvalue[0];
                    }
                    else
                        sku         =   typedthings;
				if(loc_id != undefined && loc_id != ''){
					ovcDash.get('apis/ang_loc_products?srch=' + sku + '&locid=' + encodeURIComponent(loc_id)).then(function(data) {
						if (data.status != 'error') {
							$scope.errormsg 	=	true;
							var rows = [];
							var allvals = {};
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
                                allvals[item.ProductTbl.sku] = item;
							});
							$scope.srchedSkuProducts = rows;
							$scope.allskusvalues 	 = 	allvals;
							if(rows.length == 1){
	                        	$scope.doSelectproduct(rows[0],typedthings);
	                        }
						}
						 else{
	                        var output = {
	                          "status": "error",
	                          "message": "No products Found"
	                        };
	                        $scope.transactions = 	[];
	                       	$scope.ship.result 	=	'';
	                       	Data.toast(output);
	                    }
					});
				}
			}
		}
	}
	$scope.doSelectproduct = function(suggestion,scanvalue){
			var sltdPrdt = [];
		if ($scope.action.type == 'manual' && $scope.form.receiptType == 'MR_IBT_M') {
			var loc_id = $scope.form.FromLocation;
		} else {
			var loc_id = $scope.form.shipToLocation;
		}
    		if(($scope.action.type == 'manual') && (!$scope.showdata)){
    			var obj       			= 	$scope.form.addskuData;
    			if($scope.validating($scope.form,obj)){
	    			$scope.form.addskuData.sku 	=	suggestion;
	            	sltdPrdt					=	suggestion.split('~');
	            	if(scanvalue == sltdPrdt[2] || scanvalue == sltdPrdt[0])
					$scope.addgetProductSkuDetails(sltdPrdt[0], loc_id);
				}
			}else{
            	var packageIndex  		=   $scope.form.currentpackage;
            	var obj       			= 	$scope.form.packageData[packageIndex];
            	if($scope.validating($scope.form,obj)){
	            	$scope.form.packageData[packageIndex].sku = suggestion;
	            	sltdPrdt				=	suggestion.split('~');
	            	if(scanvalue == sltdPrdt[2] || scanvalue == sltdPrdt[0])
					$scope.getProductSkuDetails(sltdPrdt[0], loc_id, packageIndex);
				}
			}
			$scope.srchedSkuProducts 	= 	[];
	};


	$scope.srchStyleProduct = function(typedthings) {
		if (typedthings != '' && typedthings != undefined) {
			$timeout(function() {
				$scope.styleitems = {};
			}, 0);
			if ($scope.action.type == 'manual' && $scope.form.receiptType == 'MR_MAN') {
				var vendorid = $scope.form.vendorId;

                if($scope.action.primevendors.indexOf($scope.form.vendorId) > -1){
					var loc_id = $scope.form.shipToLocation;

					if(loc_id != undefined && loc_id != undefined && loc_id != null){
						ovcDash.get('apis/ang_style_products?srch=' + typedthings + '&locid=' + encodeURIComponent(loc_id)).then(function(data) {
							if (data.status != 'error') {
								var rows = [];
								angular.forEach(data, function(item) {
									rows.push(item.ProductTbl.productCode + '~' + item.ProductTbl.name);
								});
								$scope.srchedStyleProducts = rows;
							}
						});
					}

				}
				else{

					if (vendorid != undefined && vendorid != '' && vendorid != null) {
						Data.get('/vendorproduct/' + vendorid + '?productCode=' + typedthings + '&isDropdown=' + true).then(function(data) {
							if (data.status != 'error') {
								var rows = [];
								var nrows = [];
								angular.forEach(data, function(item) {
									nrows.push(item.vendorSKU);
								});
								if (nrows != '') {
									ovcDash.post('apis/ang_getproductcodes', {
										data: {
											sku: nrows.join(',')
										}
									}).then(function(results) {
										if (results.status != 'error') {
											angular.forEach(results, function(newitem) {
												var prodetails = newitem.ProductTbl;
												rows.push(prodetails.productCode + '~' + prodetails.name);
											});
											$scope.srchedStyleProducts = rows;
										}
									});
								}
							}
						});
					}

				}
			} 
			else {
				if ($scope.action.type == 'manual' && $scope.form.receiptType == 'MR_IBT_M') {
					var loc_id = $scope.form.FromLocation;
				} else {
					var loc_id = $scope.form.shipToLocation;
				}
				if(loc_id != undefined && loc_id != undefined && loc_id != null){
					ovcDash.get('apis/ang_style_products?srch=' + typedthings + '&locid=' + encodeURIComponent(loc_id)).then(function(data) {
						if (data.status != 'error') {
							var rows = [];
							angular.forEach(data, function(item) {
								rows.push(item.ProductTbl.productCode + '~' + item.ProductTbl.name);
							});
							$scope.srchedStyleProducts = rows;
						}
					});
				}
			}
		}
	}
	$scope.getStyleMatrix = function(packageIndex) {
		var sltdPrdt = $scope.form.packageData[packageIndex].sku;
		if ($scope.action.type == 'manual' && $scope.form.receiptType == 'MR_IBT_M') {
			var loc_id = $scope.form.FromLocation;
		} else {
			var loc_id = $scope.form.shipToLocation;
		}
		$scope.styleitems = {
			locationId: loc_id,
			result: '',
			styleresult: sltdPrdt,
			mode: "edit"
		};
		$scope.changedSkus	=	$scope.form.packageData[packageIndex].changedSkus = {};
		$scope.packageIndex	=	packageIndex;
		angular.element(document.getElementById('package_style_' + packageIndex))
			.html($compile('<style-matrix></style-matrix>')($scope));
		/* angular.element(document.getElementById('package_style_' + packageIndex))
			.html($compile('<stylematrix  skuitems="styleitems"   skudata="getselectedsku(sku)"  changed-skus="form.packageData[' + packageIndex + '].changedSkus"    updatedskus="getmodifiedsku(' + packageIndex + ')"    loadmat ="loadmat"  ></stylematrix>')($scope)); */

		$scope.form.packageData[packageIndex].sku = '';
	}
	$scope.addgetStyleMatrix = function(addskuData) {
		var sltdPrdt = addskuData;
		if ($scope.action.type == 'manual' && $scope.form.receiptType == 'MR_IBT_M') {
			var loc_id = $scope.form.FromLocation;
		} else {
			var loc_id = $scope.form.shipToLocation;
		}
		$scope.styleitems = {
			locationId: loc_id,
			result: '',
			styleresult: sltdPrdt.sku,
			mode: "edit"
		};
		$scope.changedSkus	=	$scope.form.addskuData.changedSkus = {};
		angular.element(document.getElementById('asn_style_matrix'))
			.html($compile('<style-matrix></style-matrix>')($scope));
		$scope.form.addskuData.sku = '';
	}

	function ChunkFunction(newskus,index){
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
                        $scope.getmodifiedsku(chunkitem,index,"chunk");
                    });
                }else if (chunkObj.length < 100){
                    var chunkeddata = chunk(chunkObj, 100);
                    angular.forEach(chunkeddata, function(chunkitem){
                        $scope.getmodifiedsku(chunkitem,index,"chunk");
                    });
                }else{
                    $scope.getmodifiedsku(newskus,index,'chunk');
                }
    }

    function asnchunk(newskus){
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
                        $scope.asngetmodifiedsku(chunkitem,"chunk");
                    });
                }else if (chunkObj.length < 100 && chunkObj.length > 10){
                    var chunkeddata = chunk(chunkObj, 10);
                    angular.forEach(chunkeddata, function(chunkitem){
                        $scope.asngetmodifiedsku(chunkitem,"chunk");
                    });
                }else{
                    $scope.asngetmodifiedsku(newskus,'chunk');
                }
    
	}
	/*****Getting onhand changed skus from Stylematrix *****/
	$scope.getmodifiedsku = function(newskus,packageIndex,upload) {
		if($scope.form.packageData[packageIndex])
		$scope.form.packageData[packageIndex].changedSkus	=	newskus;
		//var styleMatrixSkus = Object.keys($scope.form.packageData[packageIndex].changedSkus);
		var skulength = newskus.length;
        var styleMatrixSkus  = skulength ? $scope.form.packageData[packageIndex].changedSkus : Object.keys($scope.form.packageData[packageIndex].changedSkus);
		if ($scope.action.type == 'manual' && $scope.form.receiptType == 'MR_IBT_M') {
			var loc_id = $scope.form.FromLocation;
		} else {
			var loc_id = $scope.form.shipToLocation;
		}
		if (styleMatrixSkus.length > 0) {
			$scope.getStyleSkuDetails(styleMatrixSkus, loc_id, packageIndex,upload);
		}
	}
	$scope.asngetmodifiedsku = function(newskus,upload) {
		$scope.form.addskuData.changedSkus	=	newskus;
		//var styleMatrixSkus = Object.keys($scope.form.addskuData.changedSkus);
		var skulength = newskus.length;
        var styleMatrixSkus  = skulength ? $scope.form.addskuData.changedSkus : Object.keys($scope.form.addskuData.changedSkus);
		if ($scope.action.type == 'manual' && $scope.form.receiptType == 'MR_IBT_M') {
			var loc_id = $scope.form.FromLocation;
		} else {
			var loc_id = $scope.form.shipToLocation;
		}
		if (styleMatrixSkus.length > 0) {
			$scope.addgetStyleSkuDetails(styleMatrixSkus, loc_id,upload);
		}
	}
																																																																																																																																																																																																																																																																																																											
	$scope.getProductDetails = function(packageIndex,obj) {
		// $timeout(function(){
  //           angular.element('.prod_result').focus();
  //       },500);
		$scope.currentPackageIndex = packageIndex;
		var productResult = {};
		if($scope.validating($scope.form,obj)){
			if ($scope.action.type == 'manual' && $scope.form.receiptType == 'MR_IBT_M') {																		
				var loc_id = $scope.form.FromLocation;
			} else {
				var loc_id = $scope.form.shipToLocation;
			}
			if ($scope.form.packageData[packageIndex].sku != '' && $scope.form.packageData[packageIndex].sku != undefined) {
				var selectedpro = $scope.form.packageData[packageIndex].sku.split('~');
			if(selectedpro.length == 3){
                $scope.getProductSkuDetails(selectedpro[0], loc_id, packageIndex);
            }
            else if(selectedpro.length == 2){
                var productResult = {};
                $scope.getStyleMatrix(packageIndex);
            }
        	}
			$scope.srchedSkuProducts 	= 	[];
			$scope.srchedStyleProducts 	=	[];
		}
		$scope.srchedSkuProducts = [];
	}

	$scope.returnSkus = function(obj){
		if(!$scope.validating($scope.form,obj,"upload")){
            event.preventDefault();
            return false;
        }
    }
    $scope.noPackageFileupload 		=	function(){
    	var obj 	=	{};
		obj.sku 	=	$scope.form.addskuData.sku;
		obj.style 	=	$scope.form.addskuData.style;
    	if(!$scope.validating($scope.form,obj,"upload")){
            event.preventDefault();
            return false;
        }
    }

	$scope.addgetProductDetails = function(addskuData){
		var obj 	=	{};
		obj.sku 	=	$scope.form.addskuData.sku;
		obj.style 	=	$scope.form.addskuData.style;
		if($scope.validating($scope.form,obj)){
			$scope.form.addskuData=addskuData;
			$timeout(function(){
	            angular.element('.prod_result').focus();
	        },500);
			var productResult = {};
			if ($scope.action.type == 'manual' && $scope.form.receiptType == 'MR_IBT_M') {
				var loc_id = $scope.form.FromLocation;
			} else {
				var loc_id = $scope.form.shipToLocation;
			}
			if ($scope.form.addskuData.sku != '' && $scope.form.addskuData.sku != undefined) {
				var sltdPrdt = $scope.form.addskuData.sku.split('~');
				/*$timeout(function() {
					$scope.addgetProductSkuDetails(sltdPrdt[0], loc_id);
				}, 1000);*/
				if(sltdPrdt.length == 3){
              		$scope.addgetProductSkuDetails(sltdPrdt[0], loc_id);
            	}
            	else if(sltdPrdt.length == 2){
                	var productResult = {};
                	$scope.addgetStyleMatrix($scope.form.addskuData);
            	}
			}
			/*if ($scope.form.addskuData.style != '' && $scope.form.addskuData.style != undefined) {
				var productResult = {};
				$scope.addgetStyleMatrix($scope.form.addskuData);
			}*/
			$scope.srchedSkuProducts = [];
		}
	}
	
	$scope.minmax	=	function (value, min, max){
			if(parseInt(value) > parseInt(max)){
						return max;  
			}
			else{
					return value;
			}
	};

	var lineNumber = 1;
	$scope.getProductSkuDetails = function(sltdPrdt, loc_id, packageIndex) {
		var skuwac = 0;
		var existingskus = [];
		var prtax = tax_tot = sptax = spvat = sptaxes = spvates = tot_wtax = prwac = 0;
		var data 	=	[];
		if($scope.allskusvalues)
		data[0]		=	$scope.allskusvalues[sltdPrdt];
		// ovcDash.get('apis/ang_loc_skuproducts?srch=' + sltdPrdt + '&locid=' + loc_id).then(function(data) {
			if ((data != '') && data.length > 0) {
				ovcDash.get('apis/ang_skus_getproductprice?sku=' + sltdPrdt + '&loc=' + encodeURIComponent(loc_id)).then(function(result) {
					if ((result.status != 'error') && (result != '')) {
						var cost = result[0].ProductPrice.Cost;
						var Tax = result[0].ProductPrice.isVAT;
						var vTax = result[0].ProductPrice.percentage;
						var totalc = 0;
						var povat = vat_total = 0;
						Data.get('/inventories?locationid=' + encodeURIComponent(loc_id) + '&sku=' + sltdPrdt).then(function(wdata) {
							if ((wdata != '') && (wdata != undefined) && (wdata.status != "error") && (wdata.error == undefined)) {
								if ((wdata[0].wac != undefined) && (wdata[0].wac != '' )) {
									skuwac = wdata[0].wac;
								}else{
									skuwac = 0;
								}
							}

							var totalLength = $scope.form.packageData.length;
							var productDetails = {};
							if (totalLength > 0) {
								if (!$scope.form.packageData[packageIndex].productDetails) {
									$scope.form.packageData[packageIndex].productDetails = {};
								}
								if (!$scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode]) {
									$scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode] = [];

									//var productDetails = {};
									productDetails['productCode'] = data[0].ProductTbl.productCode;
									//productDetails['productDescription'] = data[0].ProductTbl.productDescription;
									productDetails['productDescription'] = data[0].ProductTbl.styleDescription;
									productDetails['styleColor'] = data[0].ProductTbl.color;
									productDetails['qty'] = 0;
									productDetails['total'] = 0;
									productDetails['subtotal'] = 0;
									productDetails['vat'] = 0;
									productDetails['tax'] = 0;
									//productDetails['total']=0;
									productDetails['skus'] = [];
									$scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode].push(productDetails);
								} else {
									angular.forEach($scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode][0]['skus'], function(lval, lindex) {
										existingskus.push(lval.sku);
									});
								}
								var i = existingskus.indexOf(data[0].ProductTbl.sku);
								if (i != -1) {
									angular.forEach($scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode][0]['skus'], function(lval, lindex) {
										if (lval.sku == sltdPrdt) {
											var qty = (lval.qty) + 1;
											newprod = true;
											$scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode][0]['skus'][lindex].qty = qty;
											var pcost = parseFloat(cost).toFixed(2);
											var to_tal = parseFloat(pcost) * parseFloat(qty);
											var vatTax = vTax;
											var vnTax = Tax;
											if (Tax == 0) {
												prtax = (to_tal * parseFloat(vatTax / 100));
												tax_tot = parseFloat(prtax).toFixed(2);
												sptax = (parseFloat(pcost) * parseFloat(vatTax / 100));
												sptaxes = parseFloat(sptax).toFixed(2);
												tot_wtax = (to_tal * parseFloat(vatTax / 100)) + to_tal;
												totalc = parseFloat(to_tal).toFixed(2);
												var tmp_product_tax	=	tax_tot;
												
												$scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode][0]['skus'][lindex].totalProductTax = tax_tot;
												
											} else if (Tax == 1) {

												tot_wtax = parseFloat(to_tal).toFixed(2);
												povat = (to_tal * parseFloat(vatTax / 100));
												vat_total = parseFloat(povat).toFixed(2);
												spvat = (parseFloat(pcost) * parseFloat(vatTax / 100));
												spvates = parseFloat(spvat).toFixed(2);
												totalc = parseFloat(to_tal).toFixed(2);
												var tmp_product_tax	=	vat_total;
												
												$scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode][0]['skus'][lindex].totalProductVat = vat_total;
											}
											
											$scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode][0]['skus'][lindex].total = tot_wtax;
											$scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode][0]['skus'][lindex].totalnotax = totalc;
											$scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode][0]['skus'][lindex].wac = prwac;
											$scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode][0].qty = +qty;
											$scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode][0].total = +tot_wtax;
											$scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode][0].subtotal = +totalc;
											$scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode][0].vat = +vat_total;
											$scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode][0].tax = +tax_tot;
											$scope.calcItems(lindex, qty, pcost, totalc, tot_wtax, tmp_product_tax, data[0].ProductTbl.productCode, packageIndex);
																	
										}
									});
								} else if (i == -1) {
									var qty = 1;
									var pcost = parseFloat(cost).toFixed(2);
									var vatTax = vTax;
									var vnTax = Tax;
									var to_tal = parseFloat(pcost) * parseFloat(qty);
									if (Tax == 0) {
										totalc = parseFloat(to_tal).toFixed(2);
										tot_wtax = (to_tal * parseFloat(vatTax / 100)) + to_tal;
										sptax = (parseFloat(pcost) * parseFloat(vatTax / 100));
										sptaxes = parseFloat(sptax).toFixed(2);
										prtax = (to_tal * parseFloat(vatTax / 100));
										tax_tot = parseFloat(prtax).toFixed(2);
									} else if (Tax == 1) {
										totalc = parseFloat(to_tal).toFixed(2);
										tot_wtax = parseFloat(to_tal).toFixed(2);
										spvat = (parseFloat(pcost) * parseFloat(vatTax / 100));
										spvates = parseFloat(spvat).toFixed(2);
										povat = (to_tal * parseFloat(vatTax / 100));
										vat_total = parseFloat(povat).toFixed(2);
									}
									var sduom 		= 	$scope.uomlist['Each'];
									var skuwaist	=	((data[0].ProductTbl.waist) && (data[0].ProductTbl.waist !=	'' )) ? parseInt(data[0].ProductTbl.waist) : null ;
									var skulength	=	((data[0].ProductTbl.length) && (data[0].ProductTbl.length !=	'' ) )? parseInt(data[0].ProductTbl.length) : null ;
									var skusize		=	((data[0].ProductTbl.size)	&&	(data[0].ProductTbl.size	!=	'')) ? (data[0].ProductTbl.size) :	'' ; 

									// var lineNumber = 1;
									// var groupedSkus = $scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode][0]['skus'];
									// if(groupedSkus.length > 0){
									// 	lineNumber = groupedSkus[(groupedSkus.length) - 1]['lineNumber'] + 1;
									// }
									
									$scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode][0]['skus'].push({
										sku: data[0].ProductTbl.sku,
										name: data[0].ProductTbl.name,
										productCode: data[0].ProductTbl.productCode,
										description: data[0].ProductTbl.description,
										variants: data[0].ProductTbl.variants,
										cost: pcost,
										productVat: spvates,
										totalProductVat: vat_total,
										productTax: sptaxes,
										totalProductTax: tax_tot,
										qty: qty,
										totalnotax: totalc,
										total: tot_wtax,
										taxisVAT: Tax,
										percentage: vTax,
										selectedUOM: sduom,
										wac:skuwac,
										lineNumber : getLn(data[0].ProductTbl),
										styleColor:data[0].ProductTbl.color,
										// waist:skuwaist,
										// length:skulength,
										// size:skusize
										// lineNumber : lineNumber
									});

									$scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode][0].qty = +qty;
									$scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode][0].total = +tot_wtax;
									$scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode][0].subtotal = +totalc;
									$scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode][0].vat = +vat_total;
									$scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode][0].tax = +tax_tot;
									existingskus.push(data[0].ProductTbl.sku);
									$timeout(function() {
										$scope.fillTableElements($scope.form.packageData[packageIndex], packageIndex);
									}, 500);
									
									angular.forEach($scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode][0]['skus'], function(lval, lindex) {
										if (lval.sku == data[0].ProductTbl.sku) {
											if (lval.taxisVAT == 1) {
												$scope.calcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.vat_total, data[0].ProductTbl.productCode, packageIndex);
											} else if (lval.taxisVAT == 0) {
												$scope.calcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.tax_tot, data[0].ProductTbl.productCode, packageIndex);
											}
										}
									});
								}
								$scope.form.packageData[packageIndex].sku = '';
							}
						});
					}
				});
			}

	}
	var lineNumber=1;
	$scope.addgetProductSkuDetails = function(sltdPrdt, loc_id) {
		var skuwac = 0;
		var existingskus = [];
		var prtax = tax_tot = sptax = spvat = sptaxes = spvates = tot_wtax = prwac = 0;
		ovcDash.get('apis/ang_loc_skuproducts?srch=' + sltdPrdt + '&locid=' +encodeURIComponent( loc_id)).then(function(data) {
			if ((data.status != 'error') && (data != '')) {
				ovcDash.get('apis/ang_skus_getproductprice?sku=' + sltdPrdt + '&loc=' + encodeURIComponent(loc_id)).then(function(result) {
					if ((result.status != 'error') && (result != '')) {
						var cost = result[0].ProductPrice.Cost;
				

						var Tax = result[0].ProductPrice.isVAT;
						var vTax = result[0].ProductPrice.percentage;
						var totalc = 0;
						var povat = vat_total = 0;
						Data.get('/inventories?locationid=' + encodeURIComponent(loc_id) + '&sku=' + sltdPrdt).then(function(wdata) {

							if ((wdata != '') && (wdata != undefined) && (wdata.status != "error")) {
								if ((wdata[0].wac != undefined) && (wdata[0].wac != '' )) {
									skuwac = wdata[0].wac;
								}else{
									skuwac = 0;
								}
							}
							//var totalLength = $scope.form.addskuData.length;
							var productDetails = {};
								if (!$scope.form.addskuData.productDetails) {
									$scope.form.addskuData.productDetails = {};
								}
								if (!$scope.form.addskuData.productDetails[data[0].ProductTbl.productCode]) {
									$scope.form.addskuData.productDetails[data[0].ProductTbl.productCode] = [];
									productDetails['productCode'] = data[0].ProductTbl.productCode;
									productDetails['productDescription'] = data[0].ProductTbl.styleDescription;
									productDetails['styleColor'] = data[0].ProductTbl.color;
									productDetails['qty'] = 0;
									productDetails['total'] = 0;
									productDetails['subtotal'] = 0;
									productDetails['vat'] = 0;
									productDetails['tax'] = 0;
									productDetails['skus'] = [];
									$scope.form.addskuData.productDetails[data[0].ProductTbl.productCode].push(productDetails);
								} else {
									angular.forEach($scope.form.addskuData.productDetails[data[0].ProductTbl.productCode][0]['skus'], function(lval, lindex) {
										existingskus.push(lval.sku);
									});
								}
								var i = existingskus.indexOf(data[0].ProductTbl.sku);
								if (i != -1) {
									angular.forEach($scope.form.addskuData.productDetails[data[0].ProductTbl.productCode][0]['skus'], function(lval, lindex) {
										if (lval.sku == sltdPrdt) {
											var qty = (lval.qty) + 1;
											newprod = true;
											$scope.form.addskuData.productDetails[data[0].ProductTbl.productCode][0]['skus'][lindex].qty = qty;
											var pcost = parseFloat(cost).toFixed(2);
											var to_tal = parseFloat(pcost) * parseFloat(qty);
											var vatTax = vTax;
											var vnTax = Tax;
											if (Tax == 0) {
												prtax = (to_tal * parseFloat(vatTax / 100));
												tax_tot = parseFloat(prtax).toFixed(2);
												sptax = (parseFloat(pcost) * parseFloat(vatTax / 100));
												sptaxes = parseFloat(sptax).toFixed(2);
												tot_wtax = (to_tal * parseFloat(vatTax / 100)) + to_tal;
												totalc = parseFloat(to_tal).toFixed(2);
												var tmp_product_tax	=	tax_tot;
												
												$scope.form.addskuData.productDetails[data[0].ProductTbl.productCode][0]['skus'][lindex].totalProductTax = tax_tot;
												
											} else if (Tax == 1) {

												tot_wtax = parseFloat(to_tal).toFixed(2);
												povat = (to_tal * parseFloat(vatTax / 100));
												vat_total = parseFloat(povat).toFixed(2);
												spvat = (parseFloat(pcost) * parseFloat(vatTax / 100));
												spvates = parseFloat(spvat).toFixed(2);
												totalc = parseFloat(to_tal).toFixed(2);
												var tmp_product_tax	=	vat_total;
												
												$scope.form.addskuData.productDetails[data[0].ProductTbl.productCode][0]['skus'][lindex].totalProductVat = vat_total;
											}
											
											$scope.form.addskuData.productDetails[data[0].ProductTbl.productCode][0]['skus'][lindex].total = tot_wtax;
											$scope.form.addskuData.productDetails[data[0].ProductTbl.productCode][0]['skus'][lindex].totalnotax = totalc;
											$scope.form.addskuData.productDetails[data[0].ProductTbl.productCode][0]['skus'][lindex].wac = prwac;
											$scope.form.addskuData.productDetails[data[0].ProductTbl.productCode][0].qty = +qty;
											$scope.form.addskuData.productDetails[data[0].ProductTbl.productCode][0].total = +tot_wtax;
											$scope.form.addskuData.productDetails[data[0].ProductTbl.productCode][0].subtotal = +totalc;
											$scope.form.addskuData.productDetails[data[0].ProductTbl.productCode][0].vat = +vat_total;
											$scope.form.addskuData.productDetails[data[0].ProductTbl.productCode][0].tax = +tax_tot;

											$scope.addcalcItems(lindex, qty, pcost, totalc, tot_wtax, tmp_product_tax, data[0].ProductTbl.productCode);
																	
										}
									});
								} else if (i == -1) {
									var qty = 1;
									var pcost = parseFloat(cost).toFixed(2);
									var vatTax = vTax;
									var vnTax = Tax;
									var to_tal = parseFloat(pcost) * parseFloat(qty);
									if (Tax == 0) {
										totalc = parseFloat(to_tal).toFixed(2);
										tot_wtax = (to_tal * parseFloat(vatTax / 100)) + to_tal;
										sptax = (parseFloat(pcost) * parseFloat(vatTax / 100));
										sptaxes = parseFloat(sptax).toFixed(2);
										prtax = (to_tal * parseFloat(vatTax / 100));
										tax_tot = parseFloat(prtax).toFixed(2);
									} else if (Tax == 1) {
										totalc = parseFloat(to_tal).toFixed(2);
										tot_wtax = parseFloat(to_tal).toFixed(2);
										spvat = (parseFloat(pcost) * parseFloat(vatTax / 100));
										spvates = parseFloat(spvat).toFixed(2);
										povat = (to_tal * parseFloat(vatTax / 100));
										vat_total = parseFloat(povat).toFixed(2);
									}
									var sduom 		= 	$scope.uomlist['Each'];
									var skuwaist	=	((data[0].ProductTbl.waist) && (data[0].ProductTbl.waist !=	'' )) ? parseInt(data[0].ProductTbl.waist) : null ;
									var skulength	=	((data[0].ProductTbl.length) && (data[0].ProductTbl.length !=	'' ) )? parseInt(data[0].ProductTbl.length) : null ;
									var skusize		=	((data[0].ProductTbl.size)	&&	(data[0].ProductTbl.size	!=	'')) ? (data[0].ProductTbl.size) :	'' ; 

							
									$scope.form.addskuData.productDetails[data[0].ProductTbl.productCode][0]['skus'].push({
										sku: data[0].ProductTbl.sku,
										name: data[0].ProductTbl.name,
										productCode: data[0].ProductTbl.productCode,
										description: data[0].ProductTbl.description,
										variants: data[0].ProductTbl.variants,
										cost: pcost,
										productVat: spvates,
										totalProductVat: vat_total,
										productTax: sptaxes,
										totalProductTax: tax_tot,
										qty: qty,
										totalnotax: totalc,
										total: tot_wtax,
										taxisVAT: Tax,
										percentage: vTax,
										selectedUOM: sduom,
										wac:skuwac,
										lineNumber : addgetLn(data[0].ProductTbl),
										styleColor:data[0].ProductTbl.color,
										// waist:skuwaist,
										// length:skulength,
										// size:skusize
										// lineNumber : lineNumber
									});
									$scope.form.addskuData.productDetails[data[0].ProductTbl.productCode][0].qty = +qty;
									$scope.form.addskuData.productDetails[data[0].ProductTbl.productCode][0].total = +tot_wtax;
									$scope.form.addskuData.productDetails[data[0].ProductTbl.productCode][0].subtotal = +totalc;
									$scope.form.addskuData.productDetails[data[0].ProductTbl.productCode][0].vat = +vat_total;
									$scope.form.addskuData.productDetails[data[0].ProductTbl.productCode][0].tax = +tax_tot;
									existingskus.push(data[0].ProductTbl.sku);
									$timeout(function() {
										$scope.addfillTableElements($scope.form.addskuData);
									}, 500);
									angular.forEach($scope.form.addskuData.productDetails[data[0].ProductTbl.productCode][0]['skus'], function(lval, lindex) {
										if (lval.sku == data[0].ProductTbl.sku) {
											if (lval.taxisVAT == 1) {

												$scope.addcalcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.vat_total, data[0].ProductTbl.productCode);
											} else if (lval.taxisVAT == 0) {

												$scope.addcalcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.tax_tot, data[0].ProductTbl.productCode);
											}	
										}
									});
								}
						});
						$scope.form.addskuData.sku = '';
					}
				});
			}
			else{
                   var output = {
                      "status": "error",
                      "message": "No products Found"
                  };
                  	Data.toast(output);
                  	$scope.form.addskuData.sku 	=	'';
           }
		});
	}
	/*********************************************************************
	*
	*   Great Innovus Solutions Private Limited
	*
	*    Module:            getLn
	*
	*    Developer:        Ratheesh
	*
	*    Date:            22/01/2016
	*
	*
	**********************************************************************/
    function getLn(data, sku, StyleSku) {
        // body...  
				var linedetails = [];
			angular.forEach($scope.form.packageData, function(packageData,key){
				
            if (packageData.productDetails) {
			angular.forEach(packageData.productDetails, function(values,key){
                var groupedSkus = values[0]['skus'];
                groupedSkus.forEach(function(exstdata, n) {if(exstdata.lineNumber != ''){
					linedetails.push(exstdata.lineNumber);
				}
			});
			});
			linedetails.length? lineNumber=Math.max.apply(Math,linedetails)+ 1:'';
				}
			});

        var exstsku = true,ln = lineNumber;
        sku = data.sku;
        StyleSku = data.productCode;
            // var groupedSkus = $scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode][0]['skus'];
            // if(groupedSkus.length > 0){
            // 	lineNumber = groupedSkus[(groupedSkus.length) - 1]['lineNumber'] + 1;
            // }
        $scope.form.packageData.forEach(function(packageData, packageCode) {
            if (packageData.productDetails && packageData.productDetails[StyleSku]) {
                var groupedSkus = packageData.productDetails[StyleSku][0]['skus'];
                groupedSkus.forEach(function(exstdata, n) {
                    if (exstdata.sku == sku) {
                        ln = +exstdata['lineNumber'];
                        exstsku = false;
                    }
                })
            }
        })
        exstsku ? lineNumber++ : '';
        return ln;
    }
    function addgetLn(data, sku, StyleSku) {
        // body...  
				var linedetails = [];
			angular.forEach($scope.form.addskuData, function(addskuData,key){
				
	            if ($scope.form.addskuData) {
					angular.forEach($scope.form.addskuData.productDetails, function(values,key){
		                var groupedSkus = values[0]['skus'];
		                angular.forEach(groupedSkus,function(exstdata) {
			               	if(exstdata != ''){
								linedetails.push(exstdata.lineNumber);
							}
						});
				 	});
					linedetails.length? lineNumber=Math.max.apply(Math,linedetails)+ 1:'';
				}
			});
        var exstsku = true,ln = lineNumber;
        sku = data.sku;
        StyleSku = data.productCode;
            // var groupedSkus = $scope.form.packageData[packageIndex].productDetails[data[0].ProductTbl.productCode][0]['skus'];
            // if(groupedSkus.length > 0){
            // 	lineNumber = groupedSkus[(groupedSkus.length) - 1]['lineNumber'] + 1;
            // }
        angular.forEach(function(addskuData) {
            if (addskuData && addskuData[StyleSku]) {
                var groupedSkus = addskuData[StyleSku][0]['skus'];
                groupedSkus.forEach(function(exstdata, n) {
                    if (exstdata.sku == sku) {
                        ln = +exstdata['lineNumber'];
                        exstsku = false;
                    }
                })
            }
        })
        exstsku ? lineNumber++ : '';
        return ln;
    }
	$scope.prod_detail = [];
	var addedskus = [];
	var wacofskus = [];
	$scope.getStyleSkuDetails = function(sltdPrdt, loc_id, packageIndex,upload) {
		var locSkus  = [];
		ovcDash.get('apis/ang_loc_skuproducts?srch=' + sltdPrdt + '&locid=' + encodeURIComponent(loc_id)).then(function(prdata) {
			if((prdata.status != 'error') && (prdata != '')) {
				$scope.prod_detail = prdata;
				if($scope.importreturn){
					angular.forEach(prdata, function(product){
						if(!(product.ProductTbl.sku in locSkus) && !(product.ProductTbl.barcode in locSkus)){
							locSkus.push(product.ProductTbl.sku);
							locSkus.push(product.ProductTbl.barcode);
						}
					});
					var rejectskus 	=	[]; var errorMessage 	=	'';
					
					angular.forEach(sltdPrdt,function(importData){
						if(locSkus.indexOf(importData) == -1){
							rejectskus.push(importData);
							errorMessage 	+=	importData+' - is not available for this location <br />';
						}
					});
					if(rejectskus.length > 0){
						var output = {"status": "error","message":errorMessage};
						Data.toast(output);
					}
				}

				ovcDash.get('apis/ang_skus_getproductprice?sku=' + sltdPrdt + '&loc=' + encodeURIComponent(loc_id)).then(function(result) {
					if ((result.status != 'error') && (result != '')) {
						var tempSkus 	=	[];
						angular.forEach(result, function(priceValue){
							if(tempSkus.indexOf(priceValue.ProductPrice.sku) == -1){
								tempSkus.push(priceValue.ProductPrice.sku);
							}
						});
						inventoryCall();
						function inventoryCall (){
							Data.get('/inventories?locationid=' + encodeURIComponent(loc_id) + '&sku=' + tempSkus.join(',')).then(function(data) {
							
								if ((data != '') && (data != undefined) && (data.status != "error")) {
									wacofskus = data;
									angular.forEach(data, function(item) {
										if((item.wac != undefined) && (item.wac != '')){
											wacofskus[item.sku] = parseFloat(item.wac).toFixed(2);
										}else{
											wacofskus[item.sku] = 0;
										}
									});
								}

								price_detail = result;
								if ($scope.prod_detail != []) {
									angular.forEach($scope.prod_detail, function(item) {
										var skudata = item.ProductTbl;
										angular.forEach(result, function(costitem) {
											var pridata = costitem.ProductPrice;

											if (skudata.sku == pridata.sku) {
												pridata.quantity= upload ? $scope.uploadSkus[pridata.sku]  ||  $scope.uploadSkus[pridata.barcode] : $scope.form.packageData[packageIndex].changedSkus[pridata.sku];
												//pridata.quantity = $scope.form.packageData[packageIndex].changedSkus[pridata.sku];
												addedskus.push(angular.extend(skudata, pridata));
											}

										});
									});
								}

								var totalLength = $scope.form.packageData.length;
								//var productDetails = {};
								if (totalLength > 0) {
									if (!$scope.form.packageData[packageIndex].productDetails) {
										$scope.form.packageData[packageIndex].productDetails = {};
									}
									var articleskus = [];
									angular.forEach(addedskus, function(resultantsku) {
										var cost = resultantsku.Cost || 0;
										var Tax = resultantsku.isVAT || 0;
										var vTax = resultantsku.percentage || 0;
										var qtyvalue = resultantsku.quantity || 0;
										var totalc = 0;
										var povat = vat_total = 0;
										//var prtax=prvat=0;
										var newprod = false;
										var prtax = tax_tot = sptax = spvat = sptaxes = spvates = tot_wtax = 0;
										var newstyle = resultantsku.sku.toString();
										var prwac = (typeof wacofskus[resultantsku.sku] === 'undefined') ? 0 : wacofskus[resultantsku.sku];
										var articlearray = false;


										if (!$scope.form.packageData[packageIndex].productDetails[resultantsku.productCode]) {
											var articlearray = true;
											$scope.form.packageData[packageIndex].productDetails[resultantsku.productCode] = [];
											var productDetails = {};
											productDetails['productCode'] = resultantsku.productCode ;
											productDetails['productDescription'] = resultantsku.styleDescription;
											productDetails['styleColor'] = resultantsku.color;
											//productDetails['productDescription'] = resultantsku.productDescription;
											productDetails['qty'] = parseInt("0");
											productDetails['total'] = 0;
											productDetails['subtotal'] = 0;
											productDetails['vat'] = 0;
											productDetails['tax'] = 0;
											productDetails['skus'] = [];
											$scope.form.packageData[packageIndex].productDetails[resultantsku.productCode].push(productDetails);

										} else {
											angular.forEach($scope.form.packageData[packageIndex].productDetails[resultantsku.productCode][0]['skus'], function(lval, lindex) {
												articleskus.push(lval.sku);
											});
										}

										var i = articleskus.indexOf(resultantsku.sku);

										if (i != -1) {
											//articleskus.splice(i, 1);
											angular.forEach($scope.form.packageData[packageIndex].productDetails[resultantsku.productCode][0]['skus'], function(lval, lindex) {
												if (lval.sku == resultantsku.sku) {
													var qty = (lval.qty) + parseInt(qtyvalue);
													newprod = true;
													//$scope.$parent.packageOrderSkus[pkid][lindex].qty = qty;
													$scope.form.packageData[packageIndex].productDetails[resultantsku.productCode][0]['skus'][lindex].qty = qty;
													var pcost = parseFloat(cost).toFixed(2);
													var to_tal = parseFloat(pcost) * parseFloat(qty);
													var vatTax = vTax;
													var vnTax = Tax;
													if (Tax == 0) {
														prtax = (to_tal * parseFloat(vatTax / 100));
														tax_tot = parseFloat(prtax).toFixed(2);
														sptax = (parseFloat(pcost) * parseFloat(vatTax / 100));
														sptaxes = parseFloat(sptax).toFixed(2);
														tot_wtax = (to_tal * parseFloat(vatTax / 100)) + to_tal;
														totalc = parseFloat(to_tal).toFixed(2);
														var tmp_product_tax	=	tax_tot;
														
														$scope.form.packageData[packageIndex].productDetails[resultantsku.productCode][0]['skus'][lindex].totalProductTax = tax_tot;
														
													} else if (Tax == 1) {

														tot_wtax = parseFloat(to_tal).toFixed(2);
														povat = (to_tal * parseFloat(vatTax / 100));
														vat_total = parseFloat(povat).toFixed(2);
														spvat = (parseFloat(pcost) * parseFloat(vatTax / 100));
														spvates = parseFloat(spvat).toFixed(2);
														totalc = parseFloat(to_tal).toFixed(2);
														var tmp_product_tax	=	vat_total;
														
														$scope.form.packageData[packageIndex].productDetails[resultantsku.productCode][0]['skus'][lindex].totalProductVat = vat_total;
														
													}
													$scope.form.packageData[packageIndex].productDetails[resultantsku.productCode][0]['skus'][lindex].total = tot_wtax;
													$scope.form.packageData[packageIndex].productDetails[resultantsku.productCode][0]['skus'][lindex].totalnotax = totalc;
													$scope.form.packageData[packageIndex].productDetails[resultantsku.productCode][0]['skus'][lindex].wac = prwac;
													$scope.form.packageData[packageIndex].productDetails[resultantsku.productCode][0].qty = +qty;
													$scope.form.packageData[packageIndex].productDetails[resultantsku.productCode][0].total = +tot_wtax;
													$scope.form.packageData[packageIndex].productDetails[resultantsku.productCode][0].subtotal = +totalc;
													$scope.form.packageData[packageIndex].productDetails[resultantsku.productCode][0].vat = +vat_total;
													$scope.form.packageData[packageIndex].productDetails[resultantsku.productCode][0].tax = +tax_tot;

													$scope.calcItems(lindex, qty, pcost, totalc, tot_wtax, tmp_product_tax, resultantsku.productCode, packageIndex); 
												}
											});
										} else if (i == -1) {

											var qty = parseInt(qtyvalue);
											var pcost = parseFloat(cost).toFixed(2);
											var vatTax = vTax;
											var vnTax = Tax;
											var to_tal = parseFloat(pcost) * parseFloat(qty);
											if (Tax == 0) {
												totalc = parseFloat(to_tal).toFixed(2);
												tot_wtax = (to_tal * parseFloat(vatTax / 100)) + to_tal;
												sptax = (parseFloat(pcost) * parseFloat(vatTax / 100));
												sptaxes = parseFloat(sptax).toFixed(2);
												prtax = (to_tal * parseFloat(vatTax / 100));
												tax_tot = parseFloat(prtax).toFixed(2);
											} else if (Tax == 1) {
												totalc = parseFloat(to_tal).toFixed(2);
												//tot_wtax=( to_tal*parseFloat(vatTax/100))+to_tal;
												tot_wtax = parseFloat(to_tal).toFixed(2);
												spvat = (parseFloat(pcost) * parseFloat(vatTax / 100));
												spvates = parseFloat(spvat).toFixed(2);
												povat = (to_tal * parseFloat(vatTax / 100));
												vat_total = parseFloat(povat).toFixed(2);
											}
											var sduom = $scope.uomlist['Each'];
											var skuwaist	=	((resultantsku.waist) && (resultantsku.waist !=	'' )) ? parseInt(resultantsku.waist) : null ;
											var skulength	=	((resultantsku.length) && (resultantsku.length !=	'' ) )? parseInt(resultantsku.length) : null ;
											var skusize	=	((resultantsku.size)	&&	(resultantsku.size	!=	'')) ? (resultantsku.size) :	'' ; 
											$scope.form.packageData[packageIndex].productDetails[resultantsku.productCode][0]['skus'].push({
												sku: resultantsku.sku,
												name: resultantsku.name,
												productCode: resultantsku.productCode,
												description: resultantsku.description,
												variants: resultantsku.variants,
												cost: pcost,
												productVat: spvates,
												totalProductVat: vat_total,
												productTax: sptaxes,
												totalProductTax: tax_tot,
												qty: qty,
												totalnotax: totalc,
												total: tot_wtax,
												taxisVAT: Tax,
												percentage: vTax,
												selectedUOM: sduom,
												lineNumber : getLn(resultantsku),
												wac: prwac,
												styleColor:resultantsku.color,
												// waist:skuwaist,
												// length:skulength,
												// size:skusize

											});
											$scope.form.packageData[packageIndex].productDetails[resultantsku.productCode][0].qty = +qty;
											$scope.form.packageData[packageIndex].productDetails[resultantsku.productCode][0].total = +tot_wtax;
											$scope.form.packageData[packageIndex].productDetails[resultantsku.productCode][0].subtotal = +totalc;
											$scope.form.packageData[packageIndex].productDetails[resultantsku.productCode][0].vat = +vat_total;
											$scope.form.packageData[packageIndex].productDetails[resultantsku.productCode][0].tax = +tax_tot;
											articleskus.push(resultantsku.sku);
											$timeout(function() {
												$scope.fillTableElements($scope.form.packageData[packageIndex], packageIndex);
											}, 500);
											angular.forEach($scope.form.packageData[packageIndex].productDetails[resultantsku.productCode][0]['skus'], function(lval, lindex) {
												if (lval.sku == resultantsku.sku) {
													if (lval.taxisVAT == 1) {													
														$scope.calcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.vat_total, resultantsku.productCode, packageIndex);
													} else if (lval.taxisVAT == 0) {
														$scope.calcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.tax_tot, resultantsku.productCode, packageIndex);
													}
												}
											});
										}
										$timeout(function() {
											$scope.fillTableElements($scope.form.packageData[packageIndex], packageIndex);
										}, 500);

									});
									price_detail = [];
									addedskus = [];
									$scope.prod_detail = [];
									$scope.changedSkus = {}; 
									$scope.form.packageData[packageIndex].changedSkus = {};
									//$scope.form.packageData[packageIndex].changedSkus = [];
									if( $scope.form.packageData && $scope.form.packageData.length > 0){
										$scope.action.formerror['skuData']		=	false;
									}
								}
							});
						}
					}
				});
			}
			if(prdata.status == 'error'){
				var output = {"status": "error","message":"No products Found"};
				Data.toast(output);
			}
		},function(error){

        });
	}
	$scope.addgetStyleSkuDetails = function(sltdPrdt, loc_id, upload) {
		var locSkus  = [];
		ovcDash.get('apis/ang_loc_skuproducts?srch=' + sltdPrdt + '&locid=' + encodeURIComponent(loc_id)).then(function(prdata) {
			if ((prdata.status != 'error') && (prdata != '')) {
				$scope.prod_detail = prdata;

				if($scope.importreturn){
					angular.forEach(prdata, function(product){
						if(!(product.ProductTbl.sku in locSkus) && !(product.ProductTbl.barcode in locSkus)){
							locSkus.push(product.ProductTbl.sku);
							locSkus.push(product.ProductTbl.barcode);
						}
					});
					var rejectskus 	=	[]; var errorMessage 	=	'';
					angular.forEach(sltdPrdt,function(importData){
						if(locSkus.indexOf(importData) == -1){
							rejectskus.push(importData);
							errorMessage 	+=	importData+' - is not available for this location <br />';
						}
					});
					if(rejectskus.length > 0){
						var output = {"status": "error","message":errorMessage};
						Data.toast(output);
					}
				}

				ovcDash.get('apis/ang_skus_getproductprice?sku=' + sltdPrdt + '&loc=' + encodeURIComponent(loc_id)).then(function(result) {
					if ((result.status != 'error') && (result != '')) {
						var tempSkusAsn 	=	[];
						angular.forEach(result, function(priceValue){
							if(tempSkus.indexOf(priceValue.ProductPrice.sku) == -1){
								tempSkusAsn.push(priceValue.ProductPrice.sku);
							}
						});
						asnInventoryDetails();
						function asnInventoryDetails(){
							Data.get('/inventories?locationid=' + encodeURIComponent(loc_id) + '&sku=' + tempSkusAsn.join(',')).then(function(data) {
							
								if ((data != '') && (data != undefined) && (data.status != "error")) {
									wacofskus = data;
									angular.forEach(data, function(item) {
										if((item.wac != undefined) && (item.wac != '')){
											wacofskus[item.sku] = parseFloat(item.wac).toFixed(2);
										}else{
											wacofskus[item.sku] = 0;
										}
									});
								}

								price_detail = result;
								if ($scope.prod_detail != []) {
									angular.forEach($scope.prod_detail, function(item) {
										var skudata = item.ProductTbl;
										angular.forEach(result, function(costitem) {
											var pridata = costitem.ProductPrice;

											if (skudata.sku == pridata.sku) {
												//pridata.quantity = $scope.form.addskuData.changedSkus[pridata.sku];
												pridata.quantity= upload ? $scope.uploadSkus[pridata.sku] : $scope.form.addskuData.changedSkus[pridata.sku];
												addedskus.push(angular.extend(skudata, pridata));
											}

										});
									});
								}
								//var totalLength = $scope.form.addskuData.length;
								var productDetails = {};
								//if (totalLength > 0) {
									if (!$scope.form.addskuData.productDetails) {
										$scope.form.addskuData.productDetails = {};
									}
									var articleskus = [];
									angular.forEach(addedskus, function(resultantsku) {
										var cost = resultantsku.Cost;
										var Tax = resultantsku.isVAT;
										var vTax = resultantsku.percentage;
										var qtyvalue = resultantsku.quantity;
										var totalc = 0;
										var povat = vat_total = 0;
										//var prtax=prvat=0;
										var newprod = false;
										var prtax = tax_tot = sptax = spvat = sptaxes = spvates = tot_wtax = 0;
										var newstyle = resultantsku.sku.toString();
										var prwac = (typeof wacofskus[resultantsku.sku] === 'undefined') ? 0 : wacofskus[resultantsku.sku];
										var articlearray = false;


										if (!$scope.form.addskuData.productDetails[resultantsku.productCode]) {
											var articlearray = true;
											$scope.form.addskuData.productDetails[resultantsku.productCode] = [];
											var productDetails = {};
											productDetails['productCode'] = resultantsku.productCode;
											productDetails['productDescription'] = resultantsku.styleDescription;
											productDetails['styleColor'] = resultantsku.color;
											//productDetails['productDescription'] = resultantsku.productDescription;
											productDetails['qty'] = parseInt("0");
											productDetails['total'] = 0;
											productDetails['subtotal'] = 0;
											productDetails['vat'] = 0;
											productDetails['tax'] = 0;
											productDetails['skus'] = [];
											$scope.form.addskuData.productDetails[resultantsku.productCode].push(productDetails);

										} else {
											angular.forEach($scope.form.addskuData.productDetails[resultantsku.productCode][0]['skus'], function(lval, lindex) {
												articleskus.push(lval.sku);
											});
										}

										var i = articleskus.indexOf(resultantsku.sku);

										if (i != -1) {
											//articleskus.splice(i, 1);
											angular.forEach($scope.form.addskuData.productDetails[resultantsku.productCode][0]['skus'], function(lval, lindex) {
												if (lval.sku == resultantsku.sku) {
													var qty = (lval.qty) + parseInt(qtyvalue);
													newprod = true;
													//$scope.$parent.packageOrderSkus[pkid][lindex].qty = qty;
													$scope.form.addskuData.productDetails[resultantsku.productCode][0]['skus'][lindex].qty = qty;
													var pcost = parseFloat(cost).toFixed(2);
													var to_tal = parseFloat(pcost) * parseFloat(qty);
													var vatTax = vTax;
													var vnTax = Tax;
													if (Tax == 0) {
														prtax = (to_tal * parseFloat(vatTax / 100));
														tax_tot = parseFloat(prtax).toFixed(2);
														sptax = (parseFloat(pcost) * parseFloat(vatTax / 100));
														sptaxes = parseFloat(sptax).toFixed(2);
														tot_wtax = (to_tal * parseFloat(vatTax / 100)) + to_tal;
														totalc = parseFloat(to_tal).toFixed(2);
														var tmp_product_tax	=	tax_tot;
														
														$scope.form.addskuData.productDetails[resultantsku.productCode][0]['skus'][lindex].totalProductTax = tax_tot;
														
													} else if (Tax == 1) {

														tot_wtax = parseFloat(to_tal).toFixed(2);
														povat = (to_tal * parseFloat(vatTax / 100));
														vat_total = parseFloat(povat).toFixed(2);
														spvat = (parseFloat(pcost) * parseFloat(vatTax / 100));
														spvates = parseFloat(spvat).toFixed(2);
														totalc = parseFloat(to_tal).toFixed(2);
														var tmp_product_tax	=	vat_total;
														
														$scope.form.addskuData.productDetails[resultantsku.productCode][0]['skus'][lindex].totalProductVat = vat_total;
														
													}
													$scope.form.addskuData.productDetails[resultantsku.productCode][0]['skus'][lindex].total = tot_wtax;
													$scope.form.addskuData.productDetails[resultantsku.productCode][0]['skus'][lindex].totalnotax = totalc;
													$scope.form.addskuData.productDetails[resultantsku.productCode][0]['skus'][lindex].wac = prwac;
													$scope.form.addskuData.productDetails[resultantsku.productCode][0].qty = +qty;
													$scope.form.addskuData.productDetails[resultantsku.productCode][0].total = +tot_wtax;
													$scope.form.addskuData.productDetails[resultantsku.productCode][0].subtotal = +totalc;
													$scope.form.addskuData.productDetails[resultantsku.productCode][0].vat = +vat_total;
													$scope.form.addskuData.productDetails[resultantsku.productCode][0].tax = +tax_tot;

													$scope.addcalcItems(lindex, qty, pcost, totalc, tot_wtax, tmp_product_tax, resultantsku.productCode); 
												}
											});
										} else if (i == -1) {

											var qty = parseInt(qtyvalue);
											var pcost = parseFloat(cost).toFixed(2);
											var vatTax = vTax;
											var vnTax = Tax;
											var to_tal = parseFloat(pcost) * parseFloat(qty);
											if (Tax == 0) {
												totalc = parseFloat(to_tal).toFixed(2);
												tot_wtax = (to_tal * parseFloat(vatTax / 100)) + to_tal;
												sptax = (parseFloat(pcost) * parseFloat(vatTax / 100));
												sptaxes = parseFloat(sptax).toFixed(2);
												prtax = (to_tal * parseFloat(vatTax / 100));
												tax_tot = parseFloat(prtax).toFixed(2);
											} else if (Tax == 1) {
												totalc = parseFloat(to_tal).toFixed(2);
												//tot_wtax=( to_tal*parseFloat(vatTax/100))+to_tal;
												tot_wtax = parseFloat(to_tal).toFixed(2);
												spvat = (parseFloat(pcost) * parseFloat(vatTax / 100));
												spvates = parseFloat(spvat).toFixed(2);
												povat = (to_tal * parseFloat(vatTax / 100));
												vat_total = parseFloat(povat).toFixed(2);
											}
											var sduom = $scope.uomlist['Each'];
											var skuwaist	=	((resultantsku.waist) && (resultantsku.waist !=	'' )) ? parseInt(resultantsku.waist) : null ;
											var skulength	=	((resultantsku.length) && (resultantsku.length !=	'' ) )? parseInt(resultantsku.length) : null ;
											var skusize	=	((resultantsku.size)	&&	(resultantsku.size	!=	'')) ? (resultantsku.size) :	'' ; 
											$scope.form.addskuData.productDetails[resultantsku.productCode][0]['skus'].push({
												sku: resultantsku.sku,
												name: resultantsku.name,
												productCode: resultantsku.productCode,
												description: resultantsku.description,
												variants: resultantsku.variants,
												cost: pcost,
												productVat: spvates,
												totalProductVat: vat_total,
												productTax: sptaxes,
												totalProductTax: tax_tot,
												qty: qty,
												totalnotax: totalc,
												total: tot_wtax,
												taxisVAT: Tax,
												percentage: vTax,
												selectedUOM: sduom,
												lineNumber : addgetLn(resultantsku),
												wac: prwac,
												styleColor:resultantsku.color,
												// waist:skuwaist,
												// length:skulength,
												// size:skusize

											});
											$scope.form.addskuData.productDetails[resultantsku.productCode][0].qty = +qty;
											$scope.form.addskuData.productDetails[resultantsku.productCode][0].total = +tot_wtax;
											$scope.form.addskuData.productDetails[resultantsku.productCode][0].subtotal = +totalc;
											$scope.form.addskuData.productDetails[resultantsku.productCode][0].vat = +vat_total;
											$scope.form.addskuData.productDetails[resultantsku.productCode][0].tax = +tax_tot;
											articleskus.push(resultantsku.sku);

											$timeout(function() {
												$scope.addfillTableElements($scope.form.addskuData);
											}, 500);
											angular.forEach($scope.form.addskuData.productDetails[resultantsku.productCode][0]['skus'], function(lval, lindex) {
												if (lval.sku == resultantsku.sku) {
													if (lval.taxisVAT == 1) {													
														$scope.addcalcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.vat_total, resultantsku.productCode);
													} else if (lval.taxisVAT == 0) {
														$scope.addcalcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.tax_tot, resultantsku.productCode);
													}
												}
											});
										}
										$timeout(function() {
											$scope.addfillTableElements($scope.form.addskuData);
										}, 500);

									});
									price_detail = [];
									addedskus = [];
									$scope.prod_detail = [];
									$scope.changedSkus = {}; 
									$scope.form.addskuData.changedSkus = {};
									if($scope.form.addskuData.productDetails instanceof Object && Object.keys($scope.form.addskuData.productDetails).length > 0){
										$scope.action.formerror['skuData']	=	false;
									}
									//$scope.form.packageData[packageIndex].changedSkus = [];
								//}
							});
						}
					}
				});
			}
			if(prdata.status == 'error'){
				var output = {"status": "error","message":"No products Found"};
				Data.toast(output);
			}
		},function(error){

        });
	}


    $scope.decrease = function(index,skuqty,productcode,skustyle){

            $scope.form.packageData[skustyle].productDetails[productcode][0]['skus'][index].qty = $scope.form.packageData[skustyle].productDetails[productcode][0]['skus'][index].qty - 1;

    };
    $scope.adddecrease = function(index,skuqty,productcode){

            $scope.form.addskuData.productDetails[productcode][0]['skus'][index].qty = $scope.form.addskuData.productDetails[productcode][0]['skus'][index].qty - 1;

    };

    $scope.increase = function(index,skuqty,productcode,skustyle){

            $scope.form.packageData[skustyle].productDetails[productcode][0]['skus'][index].qty = $scope.form.packageData[skustyle].productDetails[productcode][0]['skus'][index].qty + 1;
    };
    $scope.addincrease = function(index,skuqty,productcode){

            $scope.form.addskuData.productDetails[productcode][0]['skus'][index].qty = $scope.form.addskuData.productDetails[productcode][0]['skus'][index].qty + 1;
    };

    $scope.idminmax = function (value, min, index, productcode, skustyle){

            if(parseInt(value) < min || isNaN(value)) {
                $scope.form.packageData[skustyle].productDetails[productcode][0]['skus'][index].qty = min;
            }
            else{
                $scope.form.packageData[skustyle].productDetails[productcode][0]['skus'][index].qty = value;
            }
    };
    $scope.addidminmax = function (value, min, index, productcode){

            if(parseInt(value) < min || isNaN(value)) {
                $scope.form.addskuData.productDetails[productcode][0]['skus'][index].qty = min;
            }
            else{
                $scope.form.addskuData.productDetails[productcode][0]['skus'][index].qty = value;
            }
    };

    $scope.minmax    =   function (value, min, max){

            if(parseInt(value) > parseInt(max)){
                return max;  
            }else{
                return value;
            }
    };

    $scope.checkqtyempty    =   function(skuqty ,skuData){

            if(skuqty === '' || skuqty == undefined){
                var output = {
                    "status": "error",
                    "message": "Quantity is empty. Please enter the value."
                };
                if(skuqty === 0){
                	skuData.qtyValidation = true;
             		skuData.qtyClass = 'qtycls';
             		return false;
                }
                Data.toast(output);
            }
    };




	/*****Calculation of total while changing the quantity******/
	$scope.calcItems1 = function(pindex, qty, cost, ptotal, prsku, productcode, packid , skuData) {
		if(skuData.qty !== 0){
 		skuData.qtyValidation = false;
         skuData.qtyClass = '';
     	}else if(skuData.qty === 0){
     		skuData.qtyValidation = true;
     		skuData.qtyClass = 'qtycls';
     		return false; 
     	}
		var pkid = packid;
		if ($scope.action.type == 'manual' && $scope.form.receiptType == 'MR_IBT_M') {
			var loc = $scope.form.FromLocation;
		} else {
			var loc = $scope.form.shipToLocation;
		}
		var nindex = pindex;
		var quantity = qty;
		var eachcost = cost;
		var to_tal = parseFloat(quantity * eachcost).toFixed(2);
		var prtax1 = tax_tot1 = sptax1 = spvat1 = sptaxes1 = spvates1 = tot_wtax1 = 0;
		ovcDash.get('apis/ang_getproductprice?sku=' + prsku + '&loc=' + encodeURIComponent(loc)).then(function(result) {

			$scope.product_price = result[0];
			var cost = result[0].ProductPrice.Cost;
			var Tax1 = result[0].ProductPrice.isVAT;
			var vTax1 = result[0].ProductPrice.percentage;
			var pcost = parseFloat(cost).toFixed(2);
			var totalc1 = 0;
			var povat1 = vat_total1 = tot_vat1 = 0;
			var vatTax1 = vTax1;
			var vnTax1 = Tax1;
			$scope.form.packageData[packid].productDetails[productcode][0]['skus'][pindex].taxisVAT = Tax1;
			if (Tax1 == 0) {
				prtax1 = (to_tal * parseFloat(vatTax1 / 100));
				tax_tot1 = parseFloat(prtax1).toFixed(2);
				sptax1 = (parseFloat(pcost) * parseFloat(vatTax1 / 100));
				sptaxes1 = parseFloat(sptax1).toFixed(2);
				tot_wtax1 = (to_tal * parseFloat(vatTax1 / 100)) + to_tal;
				totalc1 = parseFloat(to_tal).toFixed(2);
				$scope.form.packageData[packid].productDetails[productcode][0]['skus'][pindex].total = tot_wtax1;
				$scope.form.packageData[packid].productDetails[productcode][0]['skus'][pindex].totalnotax = totalc1;
				$scope.form.packageData[packid].productDetails[productcode][0]['skus'][pindex].totalProductTax = tax_tot1;
				$scope.calcItems(nindex, qty, pcost, totalc1, tot_wtax1, tax_tot1, productcode, pkid);
			} else if (Tax1 == 1) {
				tot_wtax1 = parseFloat(to_tal).toFixed(2);
				povat1 = (to_tal * parseFloat(vatTax1 / 100));
				vat_total1 = parseFloat(povat1).toFixed(2);
				spvat1 = (parseFloat(pcost) * parseFloat(vatTax1 / 100));
				spvates1 = parseFloat(spvat1).toFixed(2);
				//totalc =to_tal;
				totalc1 = parseFloat(to_tal).toFixed(2);
				$scope.form.packageData[packid].productDetails[productcode][0]['skus'][pindex].total = tot_wtax1;
				$scope.form.packageData[packid].productDetails[productcode][0]['skus'][pindex].totalnotax = totalc1;
				$scope.form.packageData[packid].productDetails[productcode][0]['skus'][pindex].totalProductVat = vat_total1;
				$scope.calcItems(nindex, qty, pcost, totalc1, tot_wtax1, vat_total1, productcode, pkid);
			}
		});
	}
	$scope.addcalcItems1 = function(pindex, qty, cost, ptotal, prsku, productcode) {
		if ($scope.action.type == 'manual' && $scope.form.receiptType == 'MR_IBT_M') {
			var loc = $scope.form.FromLocation;
		} else {
			var loc = $scope.form.shipToLocation;
		}
		var nindex = pindex;
		var quantity = qty;
		var eachcost = cost;
		var to_tal = parseFloat(quantity * eachcost).toFixed(2);
		var prtax1 = tax_tot1 = sptax1 = spvat1 = sptaxes1 = spvates1 = tot_wtax1 = 0;
		ovcDash.get('apis/ang_getproductprice?sku=' + prsku + '&loc=' + encodeURIComponent(loc)).then(function(result) {

			$scope.product_price = result[0];
			var cost = result[0].ProductPrice.Cost;
			var Tax1 = result[0].ProductPrice.isVAT;
			var vTax1 = result[0].ProductPrice.percentage;
			var pcost = parseFloat(cost).toFixed(2);
			var totalc1 = 0;
			var povat1 = vat_total1 = tot_vat1 = 0;
			var vatTax1 = vTax1;
			var vnTax1 = Tax1;
			$scope.form.addskuData.productDetails[productcode][0]['skus'][pindex].taxisVAT = Tax1;
			if (Tax1 == 0) {
				prtax1 = (to_tal * parseFloat(vatTax1 / 100));
				tax_tot1 = parseFloat(prtax1).toFixed(2);
				sptax1 = (parseFloat(pcost) * parseFloat(vatTax1 / 100));
				sptaxes1 = parseFloat(sptax1).toFixed(2);
				tot_wtax1 = (parseFloat(tax_tot1) + parseFloat(to_tal));
				//tot_wtax1 = (to_tal * parseFloat(vatTax1 / 100)) + to_tal;
				totalc1 = parseFloat(to_tal).toFixed(2);
				$scope.form.addskuData.productDetails[productcode][0]['skus'][pindex].total = parseFloat(tot_wtax1).toFixed(2);
				$scope.form.addskuData.productDetails[productcode][0]['skus'][pindex].totalnotax = totalc1;
				$scope.form.addskuData.productDetails[productcode][0]['skus'][pindex].totalProductTax = tax_tot1;
				$scope.addcalcItems(nindex, qty, pcost, totalc1, tot_wtax1, tax_tot1, productcode);
			} else if (Tax1 == 1) {
				tot_wtax1 = parseFloat(to_tal).toFixed(2);
				povat1 = (to_tal * parseFloat(vatTax1 / 100));
				vat_total1 = parseFloat(povat1).toFixed(2);
				spvat1 = (parseFloat(pcost) * parseFloat(vatTax1 / 100));
				spvates1 = parseFloat(spvat1).toFixed(2);
				//totalc =to_tal;
				totalc1 = parseFloat(to_tal).toFixed(2);
				$scope.form.addskuData.productDetails[productcode][0]['skus'][pindex].total = tot_wtax1;
				$scope.form.addskuData.productDetails[productcode][0]['skus'][pindex].totalnotax = totalc1;
				$scope.form.addskuData.productDetails[productcode][0]['skus'][pindex].totalProductVat = vat_total1;
				$scope.addcalcItems(nindex, qty, pcost, totalc1, tot_wtax1, vat_total1, productcode);
			}
		});
	}

	/*********Calculation of tax,vat, total for package and style group while adding sku **********/
	$scope.calcItems = function(pindex, qty, cost, ptotal, ptaxtot, vattax, productcode, pkid) {
		var quantity = qty;
		var eachcost = cost;
		var total_cost = (quantity * eachcost);
		var taxvat = alltax = 0;
		$scope.form.packageData[pkid].productDetails[productcode][0]['skus'][pindex].total = parseFloat(ptaxtot).toFixed(2);
		var noitems = 0;
		var subtotal = 0;
		var ovtotal = 0;
		var iqty = itotal = iototal = 0;
		var itax = ivat = 0;
		var noskus = 0;
		/****** Calc for package  group*******/
		angular.forEach($scope.form.packageData[pkid].productDetails, function(newitem) {
			angular.forEach(newitem, function(pritem, key) {
				noskus = noskus + pritem.skus.length;
				angular.forEach(pritem.skus, function(item) {
					if ((item.qty != undefined) && (item.qty != '')) {
						iqty = item.qty;
					} else {
						iqty = 0;
					}
					if ((item.total != undefined) && (item.total != '')) {
						//itotal=item.total;
						iototal = item.total;
					}
					if ((item.totalProductTax != undefined) && (item.totalProductTax != '')) {
						itax = item.totalProductTax;
					}
					if ((item.totalProductVat != undefined) && (item.totalProductVat != '')) {
						ivat = item.totalProductVat;
					}
					if ((item.totalnotax != undefined) && (item.totalnotax != '')) {
						itotal = item.totalnotax;
					}
					noitems = parseInt(noitems) + parseInt(iqty);
					subtotal = parseFloat(subtotal) + parseFloat(itotal);
					taxvat = parseFloat(taxvat) + parseFloat(ivat);
					alltax = parseFloat(alltax) + parseFloat(itax);
					ovtotal = parseFloat(ovtotal) + parseFloat(iototal);
				});
			});
		});

		var allitems = parseFloat(noitems);
		//var subtotals3 = parseFloat(subtotal) + parseFloat(subtotal3);
		var allsubtotal = parseFloat(subtotal).toFixed(2);
		var allsubtaxes = parseFloat(alltax).toFixed(2);
		var allsubvates = parseFloat(taxvat).toFixed(2);
		var alltotal = parseFloat(allsubtotal) + parseFloat(allsubtaxes);
		var overtotal = parseFloat(alltotal).toFixed(2);
		$scope.form.packageData[pkid].total = overtotal;
		$scope.form.packageData[pkid].quantity = allitems;
		$scope.form.packageData[pkid].subtotal = allsubtotal;
		$scope.form.packageData[pkid].tax = allsubtaxes;
		$scope.form.packageData[pkid].vat = allsubvates;
		$scope.form.packageData[pkid].skus = noskus;
		var noitems2 = 0;
		var subtotal2 = 0;
		var ovtotal2 = 0;
		var iqty2 = itotal2 = iototal2 = 0;
		var itax2 = ivat2 = 0;
		var noskus2 = 0;
		var taxvat2 = alltax2 = 0;
		/******Calc for style group*****/
		angular.forEach($scope.form.packageData[pkid].productDetails[productcode][0]['skus'], function(item) {
			if ((item.qty != undefined) && (item.qty != '')) {
				iqty2 = item.qty;
			} else {
				iqty2 = 0;
			}
			if ((item.total != undefined) && (item.total != '')) {
				//itotal=item.total;
				iototal2 = item.total;
			}
			if ((item.totalProductTax != undefined) && (item.totalProductTax != '')) {
				itax2 = item.totalProductTax;
			}
			if ((item.totalProductVat != undefined) && (item.totalProductVat != '')) {
				ivat2 = item.totalProductVat;
			}
			if ((item.totalnotax != undefined) && (item.totalnotax != '')) {
				itotal2 = item.totalnotax;
			}
			noitems2 = parseInt(noitems2) + parseInt(iqty2);
			subtotal2 = parseFloat(subtotal2) + parseFloat(itotal2);
			taxvat2 = parseFloat(taxvat2) + parseFloat(ivat2);
			alltax2 = parseFloat(alltax2) + parseFloat(itax2);
			ovtotal2 = parseFloat(ovtotal2) + parseFloat(iototal2);
		});
		$scope.form.packageData[pkid].productDetails[productcode][0].qty = noitems2;
		$scope.form.packageData[pkid].productDetails[productcode][0].total = ovtotal2;
		$scope.form.packageData[pkid].productDetails[productcode][0].subtotal = subtotal2;
		$scope.form.packageData[pkid].productDetails[productcode][0].vat = taxvat2;
		$scope.form.packageData[pkid].productDetails[productcode][0].tax = alltax2
		$scope.withPackageCalculation();
	}
	$scope.addcalcItems = function(pindex, qty, cost, ptotal, ptaxtot, vattax, productcode) {
		var quantity = qty;
		var eachcost = cost;
		var total_cost = (quantity * eachcost);
		var taxvat = alltax = 0;
		$scope.form.addskuData.productDetails[productcode][0]['skus'][pindex].total = parseFloat(ptaxtot).toFixed(2);
		var noitems = 0;
		var subtotal = 0;
		var ovtotal = 0;
		var iqty = itotal = iototal = 0;
		var itax = ivat = 0;
		var noskus = 0;
		/****** Calc for package  group*******/
		angular.forEach($scope.form.addskuData.productDetails, function(newitem) {
			angular.forEach(newitem, function(pritem, key) {
				noskus = noskus + pritem.skus.length;
				angular.forEach(pritem.skus, function(item) {
					if ((item.qty != undefined) && (item.qty != '')) {
						iqty = item.qty;
					} else {
						iqty = 0;
					}
					if ((item.total != undefined) && (item.total != '')) {
						//itotal=item.total;
						iototal = item.total;
					}
					if ((item.totalProductTax != undefined) && (item.totalProductTax != '')) {
						itax = item.totalProductTax;
					}
					if ((item.totalProductVat != undefined) && (item.totalProductVat != '')) {
						ivat = item.totalProductVat;
					}
					if ((item.totalnotax != undefined) && (item.totalnotax != '')) {
						itotal = item.totalnotax;
					}
					noitems = parseInt(noitems) + parseInt(iqty);
					subtotal = parseFloat(subtotal) + parseFloat(itotal);
					taxvat = parseFloat(taxvat) + parseFloat(ivat);
					alltax = parseFloat(alltax) + parseFloat(itax);
					ovtotal = parseFloat(ovtotal) + parseFloat(iototal);
				});
			});
		});

		var allitems = parseFloat(noitems);
		//var subtotals3 = parseFloat(subtotal) + parseFloat(subtotal3);
		var allsubtotal = parseFloat(subtotal).toFixed(2);
		var allsubtaxes = parseFloat(alltax).toFixed(2);
		var allsubvates = parseFloat(taxvat).toFixed(2);
		var alltotal = parseFloat(allsubtotal) + parseFloat(allsubtaxes);
		var overtotal = parseFloat(alltotal).toFixed(2);
		
		$scope.form.addskuData.total = overtotal;
		$scope.form.addskuData.quantity = allitems;
		$scope.form.addskuData.subtotal = allsubtotal;
		$scope.form.addskuData.tax = allsubtaxes;
		$scope.form.addskuData.vat = allsubvates;
		$scope.form.addskuData.skus = noskus;
		var noitems2 = 0;
		var subtotal2 = 0;
		var ovtotal2 = 0;
		var iqty2 = itotal2 = iototal2 = 0;
		var itax2 = ivat2 = 0;
		var noskus2 = 0;
		var taxvat2 = alltax2 = 0;
		/******Calc for style group*****/
		angular.forEach($scope.form.addskuData.productDetails[productcode][0]['skus'], function(item) {
			if ((item.qty != undefined) && (item.qty != '')) {
				iqty2 = item.qty;
			} else {
				iqty2 = 0;
			}
			if ((item.total != undefined) && (item.total != '')) {
				//itotal=item.total;
				iototal2 = item.total;
			}
			if ((item.totalProductTax != undefined) && (item.totalProductTax != '')) {
				itax2 = item.totalProductTax;
			}
			if ((item.totalProductVat != undefined) && (item.totalProductVat != '')) {
				ivat2 = item.totalProductVat;
			}
			if ((item.totalnotax != undefined) && (item.totalnotax != '')) {
				itotal2 = item.totalnotax;
			}
			noitems2 = parseInt(noitems2) + parseInt(iqty2);
			subtotal2 = parseFloat(subtotal2) + parseFloat(itotal2);
			taxvat2 = parseFloat(taxvat2) + parseFloat(ivat2);
			alltax2 = parseFloat(alltax2) + parseFloat(itax2);
			ovtotal2 = parseFloat(ovtotal2) + parseFloat(iototal2);
		});
		$scope.form.addskuData.productDetails[productcode][0].qty = noitems2;
		$scope.form.addskuData.productDetails[productcode][0].total = ovtotal2;
		$scope.form.addskuData.productDetails[productcode][0].subtotal = subtotal2;
		$scope.form.addskuData.productDetails[productcode][0].vat = taxvat2;
		$scope.form.addskuData.productDetails[productcode][0].tax = alltax2;

		$scope.withOutPackageCalculation();
	}

	$scope.fillTableElements = function(data, packageIndex) {
		$scope.loadval = 0;
		//$scope.list = data;
		
		$scope.form.packageData[packageIndex] = data;

	}
	$scope.addfillTableElements = function(data) {
		$scope.loadval = 0;
		//$scope.list = data;
		$scope.form.addskuData = data;

	}

	/********Start of Delete Functions for Skus,Styles and Packages*************/

	/******* Delete Sku from table after adding Skus ********/
	$scope.removePackageSkus = function(idx, qty, total, total_notax, prodtax, prodvat, productcode, pkid) {
		if ($scope.action.title == 'edit'){
		// if ($scope.action.title == 'edit' && $scope.action.type == 'return') {
			if ($scope.form.packageData[pkid].productDetails[productcode][0]['skus'][idx].id != undefined) {
				var skuid = $scope.form.packageData[pkid].productDetails[productcode][0]['skus'][idx].id;
				$scope.form.deletedskudata.push(skuid);
			}
		// }
		}
		var pqty = ptotal = alltotal = alltax = allvat = 0;
		if (idx != -1) {

			$scope.form.packageData[pkid].productDetails[productcode][0]['skus'].splice(idx, 1);

			if ((qty != undefined) && (qty != '')) {
				pqty = qty;
			}
			if ((total != undefined) && (total != '')) {
				ptotal = total;
			}
			if ((total_notax != undefined) && (total_notax != '')) {
				alltotal = total_notax;
			}
			if ((prodtax != undefined) && (prodtax != '')) {
				alltax = prodtax;
			}
			if ((prodvat != undefined) && (prodvat != '')) {
				allvat = prodvat;
			}
			$scope.form.packageData[pkid].quantity = parseInt($scope.form.packageData[pkid].quantity) - parseInt(pqty);
			var allsubtot = parseFloat($scope.form.packageData[pkid].subtotal) - parseFloat(alltotal);
			$scope.form.packageData[pkid].subtotal = parseFloat(allsubtot).toFixed(2);
			var alltaxes = parseFloat($scope.form.packageData[pkid].tax) - parseFloat(alltax);
			$scope.form.packageData[pkid].tax = parseFloat(alltaxes).toFixed(2);
			var allvates = parseFloat($scope.form.packageData[pkid].vat) - parseFloat(allvat);
			$scope.form.packageData[pkid].vat = parseFloat(allvates).toFixed(2);
			var alltotal = parseFloat($scope.form.packageData[pkid].subtotal) + parseFloat($scope.form.packageData[pkid].tax);
			$scope.form.packageData[pkid].total = parseFloat(alltotal).toFixed(2);

			$scope.form.packageData[pkid].skus = parseInt($scope.form.packageData[pkid].skus) - 1;

			var stylegroupdata = $scope.form.packageData[pkid].productDetails[productcode][0];
			var styleqty = parseInt(stylegroupdata.qty) - parseInt(pqty);
			var stylesubtot = parseFloat(stylegroupdata.subtotal) - parseFloat(alltotal);
			var styletaxes = parseFloat(stylegroupdata.tax) - parseFloat(alltax);
			var stylevates = parseFloat(stylegroupdata.vat) - parseFloat(allvat);
			var styletotal = parseFloat(stylegroupdata.total) - parseFloat(ptotal);
			$scope.form.packageData[pkid].productDetails[productcode][0].qty = styleqty;
			$scope.form.packageData[pkid].productDetails[productcode][0].total = parseFloat(styletotal).toFixed(2);
			$scope.form.packageData[pkid].productDetails[productcode][0].subtotal = parseFloat(stylesubtot).toFixed(2);
			$scope.form.packageData[pkid].productDetails[productcode][0].vat = parseFloat(stylevates).toFixed(2);
			$scope.form.packageData[pkid].productDetails[productcode][0].tax = parseFloat(styletaxes).toFixed(2);

			$scope.withPackageCalculation();
		}
	}
	$scope.addremovePackageSkus = function(idx, qty, total, total_notax, prodtax, prodvat, productcode) {
		if ($scope.action.title == 'edit'){
		// if ($scope.action.title == 'edit' && $scope.action.type == 'return') {
			if ($scope.form.addskuData.productDetails[productcode][0]['skus'][idx].id != undefined) {
				var skuid = $scope.form.addskuData.productDetails[productcode][0]['skus'][idx].id;
				$scope.form.deletedskudata.push(skuid);
			}
		// }
		}
		var pqty = ptotal = alltotal = alltax = allvat = 0;
		if (idx != -1) {

			$scope.form.addskuData.productDetails[productcode][0]['skus'].splice(idx, 1);

			if ((qty != undefined) && (qty != '')) {
				pqty = qty;
			}
			if ((total != undefined) && (total != '')) {
				ptotal = total;
			}
			if ((total_notax != undefined) && (total_notax != '')) {
				alltotal = total_notax;
			}
			if ((prodtax != undefined) && (prodtax != '')) {
				alltax = prodtax;
			}
			if ((prodvat != undefined) && (prodvat != '')) {
				allvat = prodvat;
			}
			$scope.form.addskuData.quantity = parseInt($scope.form.addskuData.quantity) - parseInt(pqty);
			var allsubtot = parseFloat($scope.form.addskuData.subtotal) - parseFloat(alltotal);
			$scope.form.addskuData.subtotal = parseFloat(allsubtot).toFixed(2);
			var alltaxes = parseFloat($scope.form.addskuData.tax) - parseFloat(alltax);
			$scope.form.addskuData.tax = parseFloat(alltaxes).toFixed(2);
			var allvates = parseFloat($scope.form.addskuData.vat) - parseFloat(allvat);
			$scope.form.addskuData.vat = parseFloat(allvates).toFixed(2);
			var alltotal = parseFloat($scope.form.addskuData.subtotal) + parseFloat($scope.form.addskuData.tax);
			$scope.form.addskuData.total = parseFloat(alltotal).toFixed(2);

			$scope.form.addskuData.skus = parseInt($scope.form.addskuData.skus) - 1;

			var stylegroupdata = $scope.form.addskuData.productDetails[productcode][0];
			var styleqty = parseInt(stylegroupdata.qty) - parseInt(pqty);
			var stylesubtot = parseFloat(stylegroupdata.subtotal) - parseFloat(alltotal);
			var styletaxes = parseFloat(stylegroupdata.tax) - parseFloat(alltax);
			var stylevates = parseFloat(stylegroupdata.vat) - parseFloat(allvat);
			var styletotal = parseFloat(stylegroupdata.total) - parseFloat(ptotal);
			$scope.form.addskuData.productDetails[productcode][0].qty = styleqty;
			$scope.form.addskuData.productDetails[productcode][0].total = parseFloat(styletotal).toFixed(2);
			$scope.form.addskuData.productDetails[productcode][0].subtotal = parseFloat(stylesubtot).toFixed(2);
			$scope.form.addskuData.productDetails[productcode][0].vat = parseFloat(stylevates).toFixed(2);
			$scope.form.addskuData.productDetails[productcode][0].tax = parseFloat(styletaxes).toFixed(2);

			$scope.withOutPackageCalculation();
			if ($scope.action.title === 'edit'){
				if($scope.form.addskuData.productDetails[productcode][0]['skus'].length === 0)
					$scope.addremovePackageStyle(productcode);
			}
		}
	}

	/******Delete Style group from Package******/
	$scope.removePackageStyle = function(packageIndex, styleIndex) {
		angular.forEach($scope.form.packageData[packageIndex].productDetails[styleIndex], function(item) {
			if ($scope.action.title == 'edit'){
			// if ($scope.action.title == 'edit' && $scope.action.type == 'return') {
				angular.forEach(item.skus, function(skitem) {
					if (skitem.id != undefined) {
						var skuid = skitem.id;
						$scope.form.deletedskudata.push(skuid);
					}
				});
			// }
			}
		});
		var pqty = ptotal = allsubtotal = alltax = allvat = allskus = 0;
		delete $scope.form.packageData[packageIndex].productDetails[styleIndex];
		angular.forEach($scope.form.packageData[packageIndex].productDetails, function(results1, key1) {
			angular.forEach(results1, function(item) {

				pqty = parseInt(pqty) + parseInt(item.qty);
				allsubtotal = parseFloat(allsubtotal) + parseFloat(item.subtotal);
				alltax = parseFloat(alltax) + parseFloat(item.tax);
				allvat = parseFloat(allvat) + parseFloat(item.vat);
				ptotal = parseFloat(ptotal) + parseFloat(item.total);
				allskus = parseInt(allskus) + (item.skus.length);

			});
		});

		$scope.form.packageData[packageIndex].quantity = parseInt(pqty);
		$scope.form.packageData[packageIndex].subtotal = parseFloat(allsubtotal).toFixed(2);
		$scope.form.packageData[packageIndex].total = parseFloat(ptotal).toFixed(2);
		$scope.form.packageData[packageIndex].tax = parseFloat(alltax).toFixed(2);
		$scope.form.packageData[packageIndex].vat = parseFloat(allvat).toFixed(2);
		$scope.form.packageData[packageIndex].skus = parseInt(allskus);

		$scope.withPackageCalculation();
	}
	$scope.addremovePackageStyle = function(styleIndex) {
		angular.forEach($scope.form.addskuData.productDetails[styleIndex], function(item) {
			if ($scope.action.title == 'edit'){
			// if ($scope.action.title == 'edit' && $scope.action.type == 'return') {
				angular.forEach(item.skus, function(skitem) {
					if (skitem.id != undefined) {
						var skuid = skitem.id;
						$scope.form.deletedskudata.push(skuid);
					}
				})
			// }
			}
		});
		var pqty = ptotal = allsubtotal = alltax = allvat = allskus = 0;
		delete $scope.form.addskuData.productDetails[styleIndex];
		angular.forEach($scope.form.addskuData.productDetails, function(results1, key1) {
			angular.forEach(results1, function(item) {

				pqty = parseInt(pqty) + parseInt(item.qty);
				allsubtotal = parseFloat(allsubtotal) + parseFloat(item.subtotal);
				alltax = parseFloat(alltax) + parseFloat(item.tax);
				allvat = parseFloat(allvat) + parseFloat(item.vat);
				ptotal = parseFloat(ptotal) + parseFloat(item.total);
				allskus = parseInt(allskus) + (item.skus.length);

			});
		});

		$scope.form.addskuData.quantity = parseInt(pqty);
		$scope.form.addskuData.subtotal = parseFloat(allsubtotal).toFixed(2);
		$scope.form.addskuData.total = parseFloat(ptotal).toFixed(2);
		$scope.form.addskuData.tax = parseFloat(alltax).toFixed(2);
		$scope.form.addskuData.vat = parseFloat(allvat).toFixed(2);
		$scope.form.addskuData.skus = parseInt(allskus);

		$scope.withOutPackageCalculation();
	}

	/******Delete Package from Package Group******/
	$scope.removePackage = function(pId) {
		if ($scope.action.title === 'edit' && $scope.action.type === 'return') {
			var packid = $scope.form.packageData[pId].packageId;
			$scope.form.deletedpackagedata.push(packid);
		}
		if (typeof $scope.form.packageData[pId] != undefined) $scope.form.packageData.splice(pId, 1);

		$scope.withPackageCalculation();
	};
	/*
	@name formValueAssign
	@Description assign the values to scope
	@input object
	*/
	function formValueAssign (tempObj){
		$scope.form.numberOfProducts = tempObj.qty;
		$scope.form.numberOfSKU = tempObj.numberOfSku;
		$scope.form.totalPoCost = tempObj.total;
		$scope.form.totalPoVAT = tempObj.vat;
		$scope.form.totalPoTax = tempObj.tax;
		$scope.form.PoSubtotal = tempObj.subtotal;
	}
	/*
	@name withPackageCalculation
	@Description Updating the overall values of Return/ Manual Receipt with package
	*/
	$scope.withPackageCalculation = function() {

		var tempObj = {
			qty: 0,
			subtotal: 0,
			vat: 0,
			tax: 0,
			total: 0,
			numberOfSku: 0
		};

		tempObj.numberOfPackages = $scope.form.packageData.length;
		angular.forEach($scope.form.packageData, function(skuObj) {
			skuObj.quantity ? tempObj.qty = parseInt(tempObj.qty + skuObj.quantity) : "";
			skuObj.subtotal ? tempObj.subtotal = parseFloat(parseFloat(tempObj.subtotal) + parseFloat(skuObj.subtotal)).toFixed(2) : "";
			skuObj.vat ? tempObj.vat = parseFloat(parseFloat(tempObj.vat) + parseFloat(skuObj.vat)).toFixed(2) : "";
			skuObj.tax ? tempObj.tax = parseFloat(parseFloat(tempObj.tax) + parseFloat(skuObj.tax)).toFixed(2) : "";
			skuObj.total ? tempObj.total = parseFloat(parseFloat(tempObj.total) + parseFloat(skuObj.total)).toFixed(2) : "";
			skuObj.skus ? tempObj.numberOfSku = parseInt(tempObj.numberOfSku + skuObj.skus) : "";
		});
		
		$scope.form.numberOfPackages = $scope.form.packageData.length;
		formValueAssign(tempObj);
	}
	/*
	@name withOutPackageCalculation
	@Description Updating the overall values of Return/ Manual Receipt withOut package
	*/
	$scope.withOutPackageCalculation = function() {

		var tempObj = {
			qty: 0,
			subtotal: 0,
			vat: 0,
			tax: 0,
			total: 0,
			numberOfSku: 0
		};
		
		angular.forEach($scope.form.addskuData.productDetails, function(results,productCode) {
			angular.forEach(results[0].skus,function(skuObj){
				tempObj.numberOfSku++;

				skuObj.qty ? tempObj.qty = parseInt(tempObj.qty + skuObj.qty) : "";
				skuObj.totalnotax ?  tempObj.subtotal =  parseFloat(parseFloat(tempObj.subtotal) + parseFloat(skuObj.totalnotax)).toFixed(2) : "";
				skuObj.totalProductVat ? tempObj.vat = parseFloat(parseFloat(tempObj.vat) + parseFloat(skuObj.totalProductVat)).toFixed(2) : "";
				skuObj.totalProductTax ? tempObj.tax = parseFloat(parseFloat(tempObj.tax) + parseFloat(skuObj.totalProductTax)).toFixed(2) : "";
				skuObj.total ? tempObj.total = parseFloat(parseFloat(tempObj.total) + parseFloat(skuObj.total)).toFixed(2) : "";
				skuObj.skus ? tempObj.numberOfSku = parseInt(tempObj.numberOfSku + skuObj.skus) : "";
			});
		});
		$scope.form.numberOfPackages = $scope.form.addskuData.productDetails.length;
		formValueAssign(tempObj);
	}

	/***User Details***/
	var user_id = $rootScope.globals['currentUser']['username'];
	var fname = $rootScope.globals.currentUser.firstname;
	var lname = $rootScope.globals.currentUser.lastname;
	var username = fname + ' ' + lname;
	$scope.formData.FromLocation = [];

	if ($scope.action.title == 'add') {
		$scope.form.createdBy = username;
		$scope.form.created_by = user_id;
	}
	if ($scope.action.title == 'add' && $scope.action.type == 'manual') {
		$scope.vendorhide = true;
		$scope.orderfmstore = true;
	}
	
	$scope.$on("ForLocation", function(event, message) {
		if(message.receiptType == 'MR_IBT_M'){
			$scope.getstore_details(message.shipToLocation);
        }
	});

	/****Return type********/
	var ordercodes = $scope.translation.returnstypelist;
	var cordercodes = RETURNTYPELIST;
	var pordercodes = [];
	angular.forEach(cordercodes, function(item) {
		var newitem = {};
		newitem.value = item.code;
		var porder = ordercodes[item.code];
		newitem.name = porder;
		pordercodes.push(newitem);
	});
	$scope.formData.rma_type = pordercodes;

	/****Receipt Type********/
	var receiptcodes = $scope.translation.manual.receipttype;
	var creceiptcodes = RECEIPTTYPES;
	var preceiptcodes = [];
	angular.forEach(creceiptcodes, function(item) {
		var newitem = {};
		newitem.value = item.code;
		var porder = receiptcodes[item.code];
		newitem.name = porder;
		preceiptcodes.push(newitem);
	});
	$scope.formData.receiptType = preceiptcodes;
	$scope.getreceipttype = function(data) {
		$scope.action.formerror['receiptType'] 	=	false;
		if (data == 'MR_IBT_M') {
			$scope.vendorhide = true;
			$scope.orderfmstore = false;
		}
		if (data == 'MR_MAN') {
			$scope.vendorhide = false;
			$scope.orderfmstore = true;
		}
		if (data == null) {
			$scope.vendorhide = true;
			$scope.orderfmstore = true;
		}
	}
	$scope.action.primevendors = [];
	/**** get vendors for Return to from micro service******/
	$scope.formData.vendordata = {};
	$scope.getVendors = function() {
		Data.get('/vendor').then(function(results) {
			var listvendors = [];
			var primevendors = [];
			angular.forEach(results, function(values) {
				if ((values.status) && (values.companyName != undefined) && (values.companyName != '')) {
					var newobj = {
						name: values.companyName,
						value: values._id
					}
					listvendors.push(newobj);
					if(values.primarysupplier){
                        primevendors.push(values._id);
                    }
					$scope.formData.vendordata[values._id] = values.companyName;
				}
			});
			$scope.formData.vendorId = listvendors;
			$scope.action.primevendors = primevendors;
			if ($scope.formData.vendorId.length == 1) {
				$scope.GetSelectedVendor($scope.formData.vendorId[0].value);
			}
		});
	};

	/**For Get Retun Reason Code**/
	if($scope.action.type == 'return'){
		function getReasonCode() {
	        Data.get('/reasoncode?code_type=RTN').then(function(results) {
	            var ReturnReasonCode = [];
	            var data 	=	{};
	            angular.forEach(results, function(res_code_type) {
	                if ((res_code_type.codeType && res_code_type.codeType != '')) {
	                    var temp = {
	                        resId: res_code_type.id,
	                        resDesc: res_code_type.description
	                    }
	                    ReturnReasonCode.push(temp);
	                }
	                if(!data[res_code_type.id]){
	        			data[res_code_type.id] 	=	{};
	        		}
	            	data[res_code_type.id]     	= 	res_code_type.description;
	            });
	            $scope.formData.reasoncode 	= 	ReturnReasonCode;
	            $scope.resCodeArray 	=	data;
	        });
	    };
	    getReasonCode();
	}
    

 	$scope.change_frdate=function(){
 		$timeout(function(){
            angular.element('.prod_result').focus();
        },500);
 	};
	$scope.getVendors();
	$scope.GetSelectedVendor = function(value) {
		var vendor = value;
		if ((vendor != null) && (vendor != '') && (vendor != undefined)) {
			Data.get('/vendor?id=' + vendor).then(function(data) {
				/* 	var exccodes = data.carrierAlphaCode;
				if (exccodes != '') {
					var vcarrier = new Array();
					vcarrier = exccodes.split(',');
					var newships = [];
					angular.forEach(carrcodes, function(item) {
						if (vcarrier.indexOf(item.Name) != -1) {
							newships.push(item);
						} else {}
					});
					$scope.smethods = newships;
				} else {
					$scope.smethods = '';
				} */
				$scope.selvendor = data.companyName;

			});
		} else {
			$scope.selvendor = '';
		}
	}
	var currencylabel  =   $scope.translation.currencylist[0];
    var currencylist   =   [];

	/* get store or locations from mysql service */
	$scope.formData.tostoredata = {};
	var userStores = [];
	$scope.getStores = function() {
		Utils.userLocation(1).then(function(results){
			if (results.status == 'error') {
				$scope.store_datas = [];
			} else {
				var allstores = [];
				angular.forEach(results, function(item) {
					var newobj = {
						name: item.displayName,
						value: item.id
					};
					currencylist[item.id]    =   item.currency;
					allstores.push(newobj);
					$scope.formData.tostoredata[item.id] = item.displayName;
				});
				if(allstores.length==1){
					if($scope.form)
					$scope.form.shipToLocation = allstores[0].value;

					$scope.getstore_details(allstores[0].value);
				}

				$scope.formData.shipToLocation = allstores;
			}
		}, function(error){
			console.log('User Location Error :' + error);
		});
		Utils.hierarchylocation().then(function(results){
			angular.forEach(results.hierarchy, function(storedata){
                userStores.push(storedata.id);
            });
            $scope.storeLocData =   TreeViewService.getLocData(results);
            //TreeViewService.toggleAll($scope.storeLocData[0]);
            $scope.flatLocations = [];
            $scope.storeLocData.forEach(function (item) {
                $scope.recur(item, 0, $scope.flatLocations);
            });
            
        }, function (error){
        	console.log('Hierarchy Location Error : ' + error);
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

    $scope.getReasonCode = function(reasonCode){
	    $scope.action.formerror['reasoncode']	=	false;
	}

	/* get  selected  To store  or Received In details from mysql service */
	$scope.formData.fromstoredata = {};
	$scope.getstore_details = function(shipstore) {
		$scope.action.formerror['shipToLocation']	=	false;
		$scope.currency     =   currencylabel[currencylist[shipstore]];
		var storesel = shipstore;
		$scope.shippingstr = shipstore;
		var allstores = $scope.formData.shipToLocation;
		if (shipstore != null && shipstore != "" && shipstore != undefined) {
			angular.forEach(allstores, function(item) {
				if (item.value == shipstore) {
					$scope.shippingstr1 = item.name;

				}
			});
		} else {
			$scope.shippingstr1 = '';
		}
		var allfromstores = [];
    	if($scope.config.organization_name == $scope.organization_struct['2']){
			ovcDash.get('apis/ang_getfromstore?locid=' + encodeURIComponent(shipstore)).then(function(results) {

				if ((results.status != 'error') && (results != undefined)) {
					angular.forEach(results, function(item) {
						var newobj = {
							name: item.displayName,
							value: item.id
						};
						allfromstores.push(newobj);
						$scope.formData.fromstoredata[item.id] = item.displayName;
					});
					$scope.formData.FromLocation = allfromstores;


				} else {
					$scope.formData.FromLocation = [];
				}
			});
		}
		if($scope.config.organization_name == $scope.organization_struct['1']){
			angular.forEach($scope.flatLocations,function(item){
				$scope.formData.fromstoredata[item.id] = item.displayName;
			})
		}
		$timeout(function(){
            angular.element('.prod_result').focus();
        },500);
	}

	/* get  selected  From store  or Received From details from mysql service */
	$scope.getselected_store = function(newstore) {
		$timeout(function(){
        	angular.element('.prod_result').focus();
    	},500);
    	$scope.action.formerror['FromLocation']	=	false;
		if (newstore != null && newstore != "" && newstore != undefined) {
			var allstores = $scope.formData.FromLocation;
			angular.forEach(allstores, function(item) {
				if (item.id == newstore) {
					$scope.fromstore = item.displayName;
				}
			});
		} else {
			$scope.fromstore = '';
		}
	};
	$scope.UOM = [];
	$scope.UOMvalues = [];
	//var uomlist = [];
	$scope.uomlist = [];
	/*******************get uom **********/
	$scope.uomservice = function() {
		Data.get('/uom').then(function(results) {
			var uomdatas = [];
			angular.forEach(results, function(values) {
				if ((values.isActive) && (values.uomId != undefined) && (values.uomId != '') && (values.description != undefined) && (values.description != '')) {
					var newobj = {
						name: values.uomId,
						id: values.uomId,
						value: values.uomId,
						uid: values.uomId
					}
					uomdatas.push(newobj);
					$scope.UOMvalues[values.uomId] = values.uomId;
				}
			});
			$scope.UOM = uomdatas;
			angular.forEach($scope.UOM, function(item) {
				$scope.uomlist[item.name] = item.value;
			});
		});
	};
	$scope.uomservice();

	$scope.addPackages = function() {
		var newobj = {};
		newobj.packageId = Math.round(+new Date() / 1000);
		$timeout(function(){
            angular.element('.prod_result').focus();
        },500);
		$scope.form.packageData.push(newobj);
		// $scope.form.addskuData.push(newobj)
	};

	$scope.orderServiceFun = function(typedthings) {
        $scope.formData.purchaseOrders = [];
        if (typedthings && typedthings != '') {
            Data.post('/orderNumbers',{
            	data: {
            		userStores: userStores,
            		key: typedthings,
            		orderTypes: 'MR_IBT_M,MR_MAN,MAN,IBT_M,DROP_SHIP,PUSH'
            	}
            }).then(function(data) {
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
                    $scope.formData.purchaseOrders = purchaseOrders;
                }
            });
        }
	};

	$scope.erpNumServiceFun = function(typedthings) {
        $scope.formData.erpOrders = [];
        if (typedthings && typedthings != '') {
            Data.post('/orderNumbers',{
            	data: {
            		userStores: userStores,
            		key: typedthings,
            		orderTypes: 'MR_IBT_M,MR_MAN,MAN,IBT_M,DROP_SHIP,PUSH',
            		isErp : true
            	}
            }).then(function(data) {
                if( data.status == 'success' && data.result != undefined){
                    var erpOrders = [];
                    angular.forEach(data.result,function(item) {
                        if (item.orderStatus != 'draft'){
                            if (item.erpPurchaseOrder) {
                                erpOrders.push(item.erpPurchaseOrder);
                            }
                        }
                    });
                    $scope.formData.erpOrders = erpOrders;
                }
            });
        }
	};

	/*******Enable and Disable based on config and Role permission *******/
	$scope.getconfig = function() {
		$rootScope.$watch('POLIST', function() {
			$scope.puprice 	= 	true;
			$scope.shprice	=	true;
			var confg_det = $rootScope.POLIST;
			if (confg_det != undefined && confg_det != "") {
				angular.forEach(confg_det, function(corder, key) {
					if (corder.elementid == "hideTax") {
						if (corder.elementdetail == 1) {
							$scope.puprice = false;
						}
					}
					if(corder.elementid == "hidePurchasePrice"){
						if(corder.elementdetail == 1){
							$scope.shprice	=	false;
						}
					}
				});
			}
		});

		$scope.vwpuprice = true;
		$rootScope.$watch('ROLES', function() {
			var role_det = $rootScope.ROLES;
			angular.forEach(role_det, function(roles, key) {
				if (key == 'purchasePrice') {
					if ((roles.viewpurchasePrice == 0)) {
						$scope.vwpuprice = false;
					}
				}
			});
		});
	}

	$scope.getconfig();
	
	Utils.configurations().then (function(configData){
		$scope.config 	=	configData;
		$scope.action.withoutpackage = false;

		if (($scope.action.type == 'manual') && (($scope.action.title == 'add'))){
			$scope.asnnumber();
		}
		//For Manual Receipt No Packages //
		if(($scope.action.type == 'manual') && (!$scope.config.action.enablePackageatmanualreceipt)){
			// $scope.addPackages();
			$scope.showSkuDetails 	=	true;
			if (($scope.action.title == 'add')){
				$scope.action.withoutpackage = true;
			} 
			
		}
		$scope.getStores();
	});

	$scope.validating=function(data,obj,upload){
		$scope.action.formerror 	=	{};
		$scope.action.formerrormsg 	=	{};
		var errorArray 				=	[];
			if($scope.action.type == 'manual'){
				if((data.receiptType == undefined ) || (data.receiptType == ''))
					errorArray.push({'id' : 'receiptType', 'message' : 'Please select Receipt Type'});
				
				if((data.shipToLocation == '') || (data.shipToLocation == undefined))
					errorArray.push({'id' : 'shipToLocation', 'message' :'Please select the Received In Store'});
				
				if((data.receiptType == 'MR_IBT_M')){
					if((data.FromLocation == '') || (data.FromLocation == undefined))
						errorArray.push({'id' : 'FromLocation', 'message' :'Please select the Received From Store'});
				}
				if((data.receiptType == 'MR_MAN')){
					if((data.vendorId == '') || (data.vendorId == undefined))
						errorArray.push({'id' : 'vendorId', 'message' :'Please select the Received from Vendor'});
				}
			}else{
				if(!data.rma_type)
					errorArray.push({'id' : 'rma_type', 'message' : 'Please select RMA Type'});
				
				if(!data.vendorId)
					errorArray.push({'id' : 'vendorId', 'message' :'Please select the Return to Vendor'});
				
				if(!data.shipToLocation)
					errorArray.push({'id' : 'shipToLocation', 'message' :'Please select the Return from Store'});

				if(!data.reasoncode){
					errorArray.push({'id' : 'reasoncode', 'message' :'Return reason code is required'});
				}

			}
			if((obj.sku) || (obj.style ) || upload){
			}else{
				errorArray.push({'id' : 'skuData', 'message' :'Please Add At Least One SKU'});
			}
			if(errorArray.length > 0){
                angular.forEach(errorArray,function(e){
                  	$scope.action.formerror[e.id]=true;
					$scope.action.formerrormsg[e.id]=e.message;
                });
                $scope.action.page 	=	1;
                return false;
            }
               
		return true;
	}

	//For Show the sku heading properly
	$scope.isEmpty = function(obj) {
	  	var skuscount	=	0;
	  	angular.forEach(obj, function(values,key){
	  		angular.forEach(values, function(skuarray,skukey){
		  		angular.forEach(skuarray.skus, function(value){
						skuscount++;
				});
	  		})
		});

	  	if(skuscount >0){
	  		return false;
	  	}
	  return true;
	};

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


	//upload file Function
	$scope.uploadreturn 		=	function($fileContent,$file,index){
		$scope.importreturn 	=	true;
		var zoneFile 			=	$scope.retunfile;
		var adjustZoneRead 		=	$scope.processData($fileContent);
		var returndata 			=	{};
		var file 				= 	$file;
		var fileName, fileExtension, errorMessage;
        fileName = file['name'];
        fileExtension = fileName.replace(/^.*\./, '');
        if(fileExtension == "dat"){
		angular.forEach(adjustZoneRead, function (zoneContent) {
			//returndata[zoneContent[0]] 	=	zoneContent[1];
			if(returndata[zoneContent[0]]){
                returndata[zoneContent[0]]  =   parseFloat(returndata[zoneContent[0]]) + parseFloat(zoneContent[1]);
            }else{
                returndata[zoneContent[0]]  =   parseFloat(zoneContent[1]);
            }
		});
		if(index || index == 0){
			//$scope.getmodifiedsku(returndata, index);
			ChunkFunction(returndata,index);
		}
		else{
            //$scope.asngetmodifiedsku(returndata);
            asnchunk(returndata);
		}
		}else{
	        switch (fileExtension) {
	            case 'png': case 'jpeg': case 'jpg': case 'pdf': case 'html': case 'htm': case 'xls': case 'xlsx': case 'JPEG': case 'gif': case 'GIF': case 'doc': case 'DOC':
	                errorMessage 		=	"Invalid File Format";
	                var output = {"status": "error","message":errorMessage};
					Data.toast(output);
	                break;
        	}
		}
	};

	// Reverse call Function
	// $scope.reverse_package = function(index,row){
	// 	console.log($scope.formData.reverse_package);
	// 	$scope.formData.reverse_package	 = true;
	// 	console.log(index,row,$scope.formData.reverse_package);

	// 	// $scope.formData.selected_package = index;
	// 	// $scope.formData.reverse_data = row;
	// 	// angular.forEach($scope.form.packageData, function(item,key) {
	// 	// 	if (key != index) {
	// 	// 		item.reversepackage = !item.reversepackage;
	// 	// 	}
	// 	// });
		
	// };

	$scope.cancelReverse = function (){
		$scope.formData.reverse_package	 = false;
		$scope.formData.selected_package = '';
		$scope.formData.reverse_data = {};
		angular.forEach($scope.form.packageData, function(item,key) {
			item.reversepackage = false;
		});
	};

	// Reverse call Function
	$scope.savereverse  = function(data){
	  $.confirm({
	        title: 'Reverse Package',
	        content: 'Are you sure you want to reverse the Receipt?',
	        confirmButtonClass: 'btn-primary',
	        cancelButtonClass: 'btn-primary',
	        confirmButton: 'Ok',
	        cancelButton: 'Cancel',
	        confirm: function () {
				var final_data  =   [];
				if(!$scope.showdata){
		 			var tmp_obj                 =   {};
	                tmp_obj.reasonCode          =   $scope.formData.reason;
	                tmp_obj.asnId               =   data.asnId;
	                tmp_obj.status              =   'receiveInProgress';
	                tmp_obj.purchaseOrderType   =   $scope.form.receiptType;
	                tmp_obj.itemStatus          =   [];
	                angular.forEach(data.productDetails, function(styledetail,style){
	                	angular.forEach(styledetail[0].skus,function(skudatas){
	            			var skuObject 	=	{};

	                		skuObject.description 	=	skudatas.description;
	                		skuObject.lineNumber 	=	skudatas.lineNumber;
	                		skuObject.newQty 		=	skudatas.qty;
	                		skuObject.poId 			=	$scope.form.receiptNumber;
	                		skuObject.producUom 	=	skudatas.selectedUOM;
	                		skuObject.qtyStatus 	=	$scope.form.receiptStatus;
	                		skuObject.sku 			=	skudatas.sku;
	                		skuObject.skuCost 		=	skudatas.cost;

	                    	tmp_obj.itemStatus.push(skuObject);
	                	});
	                });
	                final_data.push(tmp_obj);
				}
				if($scope.showdata){
					angular.forEach(data,function(value, key){
						var tmp_obj                 =   {};
						tmp_obj.reasonCode          =   $scope.formData.reason;
				        tmp_obj.asnId               =   value.asnId;
				        tmp_obj.status              =   'receiveInProgress';
				        tmp_obj.purchaseOrderType   =   $scope.form.receiptType;
				        tmp_obj.packageId 			=	value.packageId;
				        tmp_obj.itemStatus          =   [];
				        angular.forEach(value.productDetails, function(styledetail,style){
				        	angular.forEach(styledetail[0].skus,function(skudatas){
				        		var skuObject 	=	{};

				        		skuObject.description 	=	skudatas.description;
				        		skuObject.lineNumber 	=	skudatas.lineNumber;
				        		skuObject.newQty 		=	skudatas.qty;
				        		skuObject.poId 			=	$scope.form.receiptNumber;
				        		skuObject.producUom 	=	skudatas.selectedUOM;
				        		skuObject.qtyStatus 	=	$scope.form.receiptStatus;
				        		skuObject.sku 			=	skudatas.sku;
				        		skuObject.skuCost 		=	skudatas.cost;
				                tmp_obj.itemStatus.push(skuObject);
				        	});
				        });
				        final_data.push(tmp_obj);
					});
				}

			    if(final_data.length > 0){
			       var reverse_data  =   {"data":JSON.stringify(final_data)};
			       Data.put('/reversemanualreceipt', {
			           data:reverse_data
			       }).then(function (results) {
			            var output   =   {};
			           if(results.status =='success'){
			             $state.reload();
			                var output = {
		                       "status": "success",
		                       "message": "Receipt Reversed Sucessfully."
		                    };
			           }else{          
		                   var output = {
		                       "status": "error",
		                       "message": "Receipt Reversed Failed."
		                   };
			            }  
			           Data.toast(output);                
			       });
			    }
		    },
            cancel: function () {
                      return false;
            }
	   });
	};

});




returnReceipt.directive('packageInfo', ['$compile', 'ReturnReceiptService', function($compile, ReturnReceiptService) {
	return {
		restrict: 'E',
		//replace: true,
		scope: false,

		templateUrl: 'modules/returnReceipt/returnReceipt.html',

	};
}]);

returnReceipt.directive('dropDown', ['$compile', function($compile) {
	return {
		restrict: 'E',
		//replace     :   true,
		scope: true,
		templateUrl: 'dropDown.html',
		link: function(scope, elem, attrs) {
			scope.label = attrs.label;
			scope.dataRequired = attrs.require;
			scope.dataObj = attrs.dropData;
		}
	};
}]);

returnReceipt.directive('textBox', ['$compile', function($compile) {
	return {
		restrict: 'E',
		//replace     :   true,
		scope: true,
		templateUrl: 'textBox.html',
		link: function(scope, elem, attrs) {
			scope.label = attrs.label;
			scope.dataRequired = attrs.require;
			scope.dataObj = attrs.dropData;
		}
	};
}]);

returnReceipt.directive('textArea', ['$compile', function($compile) {
	return {
		restrict: 'E',
		//replace     :   true,
		scope: true,
		templateUrl: 'textArea.html',
		link: function(scope, elem, attrs) {
			scope.label = attrs.label;
			scope.dataObj = attrs.dropData;
		}
	};

}]);