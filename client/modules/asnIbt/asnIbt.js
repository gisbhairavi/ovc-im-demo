/*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module			:        Shipping IBT 
*
*    Developer		:        Sivaraman
*
*    Date				:        18/03/2016
*
**********************************************************************/
var asnIbt = angular.module('ibtTransferAsn', ['roleConfig']);

asnIbt.directive('asnTransfer', ['$compile',  function($compile) {
	return {
		restrict: 'E',
		//replace: true,
		scope:true,
		templateUrl: 'modules/asnIbt/asnIbt.html',
	};
}]);

asnIbt.controller('ibtTransferAsnCtrl', function($rootScope,$scope, $http, $state, $timeout, $stateParams,  Data, ovcDash, $filter, toaster,
ORDERSTATUS, RETURNTYPELIST, RECEIPTTYPES, system_settings, system_currencies, $compile, roleConfigService) {
	
	$scope.addedProducts = [];
	$scope.formData = {};
	if (($scope.action.title == 'summary')) {
		$scope.form = {};
		$scope.form.packageData = [];
		$scope.form.asnData = {};
		$scope.form.numberOfPackages = 0;
		$scope.form.numberOfProducts = 0;
		$scope.form.numberOfSKU = 0;
		$scope.form.totalPoCost = 0;
		$scope.form.totalPoVAT = 0;
		$scope.form.totalPoTax   = 0;
		$scope.form.PoSubtotal	 = 0;
		$scope.form.returnNumber = '';
		$scope.form.order_number = '';
	}
	
	if($state.current.name  == 'ovc.viewtransfers-summary'){
		$scope.action.showasn 		=	true;
	}

	$scope.lang = $scope.translation[$scope.action.type];
	$scope.formData.purchaseOrders = [];
	
	$scope.$on("update_asn_data", function(event, message) {
		$scope.form.asnData = message;
	});

	$scope.getProductDetails = function(packageIndex,skuselect) {
		if(skuselect == '' || skuselect == undefined){
				$scope.form.asnData[packageIndex].errormessage 		=	true;
			$timeout(function() {
				$scope.form.asnData[packageIndex].errormessage 	=	false;
			}, 3000);
			return false;
		}

		$scope.currentPackageIndex 	= 	packageIndex;
		var productResult 			= 	{};
		var loc_id 					= 	$scope.action.fromlocation;
		if($scope.action.showasn	==	true){
			var sltdPrdt 			= 	$scope.form.asnData[packageIndex].sku;
			if($scope.QtyDetails && $scope.QtyDetails[skuselect] && $scope.QtyDetails[skuselect].qtyStatus){
				if($scope.QtyDetails[skuselect].qtyStatus.shipped)
				$scope.QtyDetails[skuselect].qtyStatus.ShippedQTY 	=	$scope.QtyDetails[skuselect].qtyStatus.shipped;

			confirmQtyData 	=	$scope.QtyDetails[skuselect].qtyStatus.ShippedQTY ? ($scope.QtyDetails[skuselect].qtyStatus.confirmed - $scope.QtyDetails[skuselect].qtyStatus.ShippedQTY) : $scope.QtyDetails[skuselect].qtyStatus.confirmed;

			}
			
			if(!confirmQtyData){
				var output = { "status": "error", "message": "Shipped quantity cannot exceed confirmed quantity"};
				Data.toast(output);
				return false;
			}
			$scope.getAsnSkuDetails(sltdPrdt, loc_id, packageIndex);
		}else{

			if ($scope.form.packageData[packageIndex].sku != '' && $scope.form.packageData[packageIndex].sku != undefined) {
				var sltdPrdt = $scope.form.packageData[packageIndex].sku;
				$scope.getProductSkuDetails(sltdPrdt, loc_id, packageIndex);				
			}
		}
	}
	
	//Cofigration Common//
	roleConfigService.getConfigurations (function(configData){
		$scope.config 	=	configData;
	});

	//var lineNumber = 1;
	$scope.getProductSkuDetails = function(sltdPrdt, loc_id, packageIndex) {
		var allskus				=	$scope.action.orderSkus;
		var selected_sku		=	{};
		angular.forEach(allskus, function(value, key) {
			if(value.SKU		==	sltdPrdt){
				selected_sku	=	value;
			}
		});
		var skuwac = 0;
		var existingskus = [];
		var prtax = tax_tot = sptax = spvat = sptaxes = spvates = tot_wtax = prwac = 0;
		ovcDash.get('apis/ang_skus_getproductprice?sku=' + sltdPrdt + '&loc=' + encodeURIComponent(loc_id)).then(function(result) {
			if ((result.status != 'error') && (result != '')) {
				var cost 	= selected_sku.skuCost;
				var Tax 	= parseInt(selected_sku.isVat);
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

						if (!$scope.form.packageData[packageIndex].productDetails[selected_sku.productCode]) {
							$scope.form.packageData[packageIndex].productDetails[selected_sku.productCode] = [];

							productDetails['productCode'] = selected_sku.productCode;
							productDetails['productDescription'] = selected_sku.styleDescription;
							productDetails['styleColor'] = selected_sku.color;
							productDetails['qty'] = 0;
							productDetails['total'] = 0;
							productDetails['subtotal'] = 0;
							productDetails['vat'] = 0;
							productDetails['tax'] = 0;
							productDetails['skus'] = [];
							$scope.form.packageData[packageIndex].productDetails[selected_sku.productCode].push(productDetails);
						} else {
							angular.forEach($scope.form.packageData[packageIndex].productDetails[selected_sku.productCode][0]['skus'], function(lval, lindex) {
								existingskus.push(lval.sku);
							});
						}
						var i = existingskus.indexOf(selected_sku.sku);
						if (i != -1) {
							angular.forEach($scope.form.packageData[packageIndex].productDetails[selected_sku.productCode][0]['skus'], function(lval, lindex) {
								if (lval.sku == sltdPrdt) {
									var qty = (lval.qty) + 1;
									var shippedqty	=	(lval.shippedqty) + 1;
									newprod = true;
									$scope.form.packageData[packageIndex].productDetails[selected_sku.productCode][0]['skus'][lindex].qty = qty;
									$scope.form.packageData[packageIndex].productDetails[selected_sku.productCode][0]['skus'][lindex].shippedqty = shippedqty;
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
										
										$scope.form.packageData[packageIndex].productDetails[selected_sku.productCode][0]['skus'][lindex].totalProductTax = tax_tot;
										
									} else if (Tax == 1) {

										tot_wtax = parseFloat(to_tal).toFixed(2);
										povat = (to_tal * parseFloat(vatTax / 100));
										vat_total = parseFloat(povat).toFixed(2);
										spvat = (parseFloat(pcost) * parseFloat(vatTax / 100));
										spvates = parseFloat(spvat).toFixed(2);
										totalc = parseFloat(to_tal).toFixed(2);
										var tmp_product_tax	=	vat_total;
										
										$scope.form.packageData[packageIndex].productDetails[selected_sku.productCode][0]['skus'][lindex].totalProductVat = vat_total;
									}
									
									$scope.form.packageData[packageIndex].productDetails[selected_sku.productCode][0]['skus'][lindex].total = tot_wtax;
									$scope.form.packageData[packageIndex].productDetails[selected_sku.productCode][0]['skus'][lindex].totalnotax = totalc;
									$scope.form.packageData[packageIndex].productDetails[selected_sku.productCode][0]['skus'][lindex].wac = prwac;
									$scope.form.packageData[packageIndex].productDetails[selected_sku.productCode][0].qty = +qty;
									$scope.form.packageData[packageIndex].productDetails[selected_sku.productCode][0].shippedqty += shippedqty;
									$scope.form.packageData[packageIndex].productDetails[selected_sku.productCode][0].total = +tot_wtax;
									$scope.form.packageData[packageIndex].productDetails[selected_sku.productCode][0].subtotal = +totalc;
									$scope.form.packageData[packageIndex].productDetails[selected_sku.productCode][0].vat = +vat_total;
									$scope.form.packageData[packageIndex].productDetails[selected_sku.productCode][0].tax = +tax_tot;

									$scope.calcItems(lindex, qty, pcost, totalc, tot_wtax, tmp_product_tax, selected_sku.productCode, packageIndex);
															
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
							var sduom = $scope.uomlist['Each'];
							var skuwaist	=	((selected_sku.waist) && (selected_sku.waist !=	'' )) ? parseInt(selected_sku.waist) : null ;
							var skulength	=	((selected_sku.length) && (selected_sku.length !=	'' ) )? parseInt(selected_sku.length) : null ;
							var skusize	=	((selected_sku.size)	&&	(selected_sku.size	!=	'')) ? (selected_sku.size) :	'' ; 

							var confirmqty	=	((selected_sku.qtyStatus.confirmed) &&  (selected_sku.qtyStatus.confirmed != null))	 ? (selected_sku.qtyStatus.confirmed) : 0;
							var shipqty	=	((selected_sku.qtyStatus.shipped) &&  (selected_sku.qtyStatus.shipped != null))	 ? (selected_sku.qtyStatus.shipped) : 0;
							$scope.form.packageData[packageIndex].productDetails[selected_sku.productCode][0]['skus'].push({
								sku: selected_sku.SKU,
								name: selected_sku.productName,
								productCode: selected_sku.productCode,
								description: selected_sku.description,
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
								styleColor:selected_sku.color,
								// waist:skuwaist,
								// length:skulength,
								// size:skusize,
								variants:selected_sku.variants,
								confirmedqty:confirmqty,
								shippedqty:shipqty,
								lineNumber : selected_sku.lineNumber
							});
							
							$scope.form.packageData[packageIndex].productDetails[selected_sku.productCode][0].qty = +qty;
							$scope.form.packageData[packageIndex].productDetails[selected_sku.productCode][0].total = +tot_wtax;
							$scope.form.packageData[packageIndex].productDetails[selected_sku.productCode][0].subtotal = +totalc;
							$scope.form.packageData[packageIndex].productDetails[selected_sku.productCode][0].vat = +vat_total;
							$scope.form.packageData[packageIndex].productDetails[selected_sku.productCode][0].tax = +tax_tot;
							existingskus.push(selected_sku.SKU);
							$timeout(function() {
								$scope.fillTableElements($scope.form.packageData[packageIndex], packageIndex);
							}, 500);
							angular.forEach($scope.form.packageData[packageIndex].productDetails[selected_sku.productCode][0]['skus'], function(lval, lindex) {
								if (lval.sku == selected_sku.SKU) {
									if (lval.taxisVAT == 1) {

										$scope.calcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.vat_total, selected_sku.productCode, packageIndex);
									} else if (lval.taxisVAT == 0) {

										$scope.calcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.tax_tot, selected_sku.productCode, packageIndex);
									}
								}
							});
						}
					}
				});
			}
		});	
	} 
	/*****Calculation of total while changing the quantity******/
	$scope.calcItems1 = function(pindex, qty, cost, ptotal, prsku, productcode, packid) {
		var pkid = packid;
		if ($scope.action.type == 'manual' && $scope.form.receiptType == 'IBT_M') {
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

	/*********Calculation of tax,vat, total for package and style group while adding sku **********/
	$scope.calcItems = function(pindex, qty, cost, ptotal, ptaxtot, vattax, productcode, pkid) {
		var quantity = qty;
		var eachcost = cost;
		var total_cost = (quantity * eachcost);
		var taxvat = alltax = 0;
		$scope.form.packageData[pkid].productDetails[productcode][0]['skus'][pindex].total = parseFloat(ptaxtot).toFixed(2);
		var noitems =	subtotal = ovtotal =  iqty = itotal = iototal =  itax = ivat =  noskus = 0;
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
		var noitems2 = subtotal2 = ovtotal2 =  iqty2 = itotal2 = iototal2 =  itax2 = ivat2 =  noskus2 =  taxvat2 = alltax2 = 0;
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

		$scope.getreturncalcs();
	}

	$scope.fillTableElements = function(data, packageIndex) {
		$scope.loadval = 0;
		//$scope.list = data;
		if($scope.action.showasn	==	true){
			$scope.form.asnData[packageIndex] = data;
		}else{
			$scope.form.packageData[packageIndex] = data;
		}
	}

	$scope.decreasepkgshipqty 	=	function (style, asnIndex, skuindex){
		if($scope.form.packageData[asnIndex].productDetails[style][0].skus[skuindex].shippedqty == undefined || $scope.form.packageData[asnIndex].productDetails[style][0].skus[skuindex].shippedqty == ''){
			$scope.form.packageData[asnIndex].productDetails[style][0].skus[skuindex].shippedqty = 0;
		}

		$scope.form.packageData[asnIndex].productDetails[style][0].skus[skuindex].shippedqty 	=	$scope.form.packageData[asnIndex].productDetails[style][0].skus[skuindex].shippedqty - 1;

	};

	$scope.increasepkgshipqty 	=	function (style, asnIndex, skuindex){
		if($scope.form.packageData[asnIndex].productDetails[style][0].skus[skuindex].shippedqty == undefined || $scope.form.packageData[asnIndex].productDetails[style][0].skus[skuindex].shippedqty == ''){
			$scope.form.packageData[asnIndex].productDetails[style][0].skus[skuindex].shippedqty = 0;
		}

		$scope.form.packageData[asnIndex].productDetails[style][0].skus[skuindex].shippedqty 	=	$scope.form.packageData[asnIndex].productDetails[style][0].skus[skuindex].shippedqty + 1;

	};

	$scope.limitofpkgsku 	=	function (min, value, style, asnIndex, skuindex){

		if(min > value){
			$scope.form.packageData[asnIndex].productDetails[style][0].skus[skuindex].shippedqty 	=	min;
		}
		else{
			$scope.form.packageData[asnIndex].productDetails[style][0].skus[skuindex].shippedqty 	=	value;
		}
	};
	/********Start of Delete Functions for Skus,Styles and Packages*************/

	/******* Delete Sku from table after adding Skus ********/
	$scope.removePackageSkus = function(idx, qty, total, total_notax, prodtax, prodvat, productcode, pkid) {
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

			$scope.getreturncalcs();
		}
	}

	/******Delete Style group from Package******/
	$scope.removePackageStyle = function(packageIndex, styleIndex) {
		angular.forEach($scope.form.packageData[packageIndex].productDetails[styleIndex], function(item) {

			if ($scope.action.title == 'edit' && $scope.action.type == 'return') {
				angular.forEach(item.skus, function(skitem) {
					if (skitem.id != undefined) {
						var skuid = skitem.id;
						$scope.form.deletedskudata.push(skuid);
					}
				});
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

		$scope.getreturncalcs();
	}

	/******Delete Package from Package Group******/
	$scope.removePackage = function(pId) {
		if ($scope.action.title == 'edit' && $scope.action.type == 'return') {
			var packid = $scope.form.packageData[pId].packageId;
			$scope.form.deletedpackagedata.push(packid);
		}
		if (typeof $scope.form.packageData[pId] != undefined) $scope.form.packageData.splice(pId, 1);

		$scope.getreturncalcs();
	};

	/********End of Delete Functions for Skus,Styles and Packages*************/

	/******Updating Overall calculation for Return*******/
	$scope.getreturncalcs = function() {

		var allreturns1 = {
			allqty: 0,
			allsubtotal: 0,
			allvates: 0,
			alltaxes: 0,
			alltotal: 0,
			allpackages: 0,
			allskus: 0,
			allstyles: 0,
			allwac: 0
		};

		allreturns1.allpackages = $scope.form.packageData.length;
		angular.forEach($scope.form.packageData, function(results) {
			if ((results.quantity != undefined) && (results.quantity != '')) {
				allreturns1.allqty = parseInt(allreturns1.allqty + results.quantity);
			} else {
				allreturns1.allqty = parseInt(allreturns1.allqty);
			}
			if ((results.subtotal != undefined) && (results.subtotal != '')) {
				var subtotals = (parseFloat(allreturns1.allsubtotal) + parseFloat(results.subtotal));
			} else {
				var subtotals = (parseFloat(allreturns1.allsubtotal));
			}
			allreturns1.allsubtotal = parseFloat(subtotals).toFixed(2);
			if ((results.vat != undefined) && (results.vat != '')) {
				allreturns1.allvates = parseFloat(allreturns1.allvates + parseFloat(results.vat)).toFixed(2);
			} else {
				allreturns1.allvates = parseFloat(allreturns1.allvates).toFixed(2);
			}
			if ((results.tax != undefined) && (results.tax != '')) {
				var alltaxes = (parseFloat(allreturns1.alltaxes) + parseFloat(results.tax));
			} else {
				var alltaxes = (parseFloat(allreturns1.alltaxes));
			}
			allreturns1.alltaxes = parseFloat(alltaxes).toFixed(2);
			if ((results.total != undefined) && (results.total != '')) {
				var alltotal = (parseFloat(allreturns1.alltotal) + parseFloat(results.total));
			} else {
				var alltotal = (parseFloat(allreturns1.alltotal));
			}
			allreturns1.alltotal = parseFloat(alltotal).toFixed(2);
			if ((results.skus != undefined) && (results.skus != '')) {
				allreturns1.allskus = parseInt(allreturns1.allskus + results.skus);
			} else {
				allreturns1.allskus = parseInt(allreturns1.allskus);
			}

		});

		$scope.form.numberOfPackages = allreturns1.allpackages;
		$scope.form.numberOfProducts = allreturns1.allqty;
		$scope.form.numberOfSKU = allreturns1.allskus;
		$scope.form.totalPoCost = allreturns1.alltotal;
		$scope.form.totalPoVAT = allreturns1.allvates;
		$scope.form.totalPoTax = allreturns1.alltaxes;
		$scope.form.PoSubtotal = allreturns1.allsubtotal;
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

	/***Get Currency Details****/
	var currensymbs = $scope.translation.currencylist[0];
	var currcodes = system_currencies[0];
	$scope.currency = currensymbs[currcodes.code];


	$scope.getAsnSkuDetails	=	function(sltdPrdt, loc_id, asnIndex){
		var allskus			=	$scope.action.orderSkus;
		var selected_sku	=	{};
		angular.forEach(allskus, function(value, key) {
			if(value.SKU	==	sltdPrdt){
				selected_sku	=	value;
			}
		});
		var skuwac = 0;
		var existingskus = [];
		var prtax = tax_tot = sptax = spvat = sptaxes = spvates = tot_wtax = prwac = 0;
		ovcDash.get('apis/ang_skus_getproductprice?sku=' + sltdPrdt + '&loc=' + encodeURIComponent(loc_id)).then(function(result) {
			if ((result.status != 'error') && (result != '')) {
				var cost 	= selected_sku.skuCost;
				var Tax 	= parseInt(selected_sku.isVat);
				var vTax = result[0].ProductPrice.percentage;
				var totalc = 0;
				var povat = vat_total = 0;
				Data.get('/inventories?locationid=' + encodeURIComponent(loc_id) + '&sku=' + sltdPrdt).then(function(wdata) {

					if ((wdata != '') && (wdata != undefined) && (wdata.status != "error")&& (wdata.error == undefined)) {
						if ((wdata[0].wac != undefined) && (wdata[0].wac != '' )) {
							skuwac = wdata[0].wac;
						}else{
							skuwac = 0;
						}
					}
					var totalLength = Object.keys($scope.form.asnData).length;
					var productDetails = {};
					if (totalLength > 0) {
						if (!$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails) {
							$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails = {};
						}

						if (!$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode]) {
							$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode] = [];

							productDetails['productCode'] = selected_sku.productCode;
							productDetails['productDescription'] = selected_sku.styleDescription;
							//productDetails['styleColor'] = selected_sku.color;styleColor
							productDetails['styleColor'] = selected_sku.styleColor;
							productDetails['qty'] = 0;
							productDetails['total'] = 0;
							productDetails['subtotal'] = 0;
							productDetails['vat'] = 0;
							productDetails['tax'] = 0;
							productDetails['skus'] = [];
							$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode].push(productDetails);
						} else {
							angular.forEach($scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode][0]['skus'], function(lval, lindex) {
								existingskus.push(lval.sku);
							});
						}
						var i = existingskus.indexOf(selected_sku.sku);
						if (i != -1) {
							angular.forEach($scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode][0]['skus'], function(lval, lindex) {
								if (lval.sku == sltdPrdt) {
									var qty = (lval.qty) + 1;
									var shippedqty	=	(lval.shippedqty) + 1;
									newprod = true;
									$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode][0]['skus'][lindex].qty = qty;
									$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode][0]['skus'][lindex].shippedqty = shippedqty;
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
										
										$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode][0]['skus'][lindex].totalProductTax = tax_tot;
										
									} else if (Tax == 1) {

										tot_wtax = parseFloat(to_tal).toFixed(2);
										povat = (to_tal * parseFloat(vatTax / 100));
										vat_total = parseFloat(povat).toFixed(2);
										spvat = (parseFloat(pcost) * parseFloat(vatTax / 100));
										spvates = parseFloat(spvat).toFixed(2);
										totalc = parseFloat(to_tal).toFixed(2);
										var tmp_product_tax	=	vat_total;
										
										$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode][0]['skus'][lindex].totalProductVat = vat_total;
									}
									
									$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode][0]['skus'][lindex].total = tot_wtax;
									$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode][0]['skus'][lindex].totalnotax = totalc;
									$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode][0]['skus'][lindex].wac = prwac;
									$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode][0].qty = +qty;
									$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode][0].shippedqty += shippedqty;
									$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode][0].total = +tot_wtax;
									$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode][0].subtotal = +totalc;
									$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode][0].vat = +vat_total;
									$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode][0].tax = +tax_tot;

									//$scope.calcItems(lindex, qty, pcost, totalc, tot_wtax, tmp_product_tax, selected_sku.productCode, packageIndex);
															
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
							var sduom = $scope.uomlist['Each'];
							var skuwaist	=	((selected_sku.waist) && (selected_sku.waist !=	'' )) ? parseInt(selected_sku.waist) : null ;
							var skulength	=	((selected_sku.length) && (selected_sku.length !=	'' ) )? parseInt(selected_sku.length) : null ;
							var skusize	=	((selected_sku.size)	&&	(selected_sku.size	!=	'')) ? (selected_sku.size) :	'' ; 

							var confirmqty	=	((selected_sku.qtyStatus.confirmed) &&  (selected_sku.qtyStatus.confirmed != null))	 ? (selected_sku.qtyStatus.confirmed) : 0;
							//var shipqty	=	((selected_sku.qtyStatus.shipped) &&  (selected_sku.qtyStatus.shipped != null))	 ? (selected_sku.qtyStatus.shipped) : 0;
							var shipqty	= 0;
							$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode][0]['skus'].push({
								sku: selected_sku.SKU,
								name: selected_sku.productName,
								productCode: selected_sku.productCode,
								description: selected_sku.description,
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
								styleColor:selected_sku.color,
								// waist:skuwaist,
								// length:skulength,
								// size:skusize,
								variants:selected_sku.variants,
								confirmedqty:confirmqty,
								shippedqty:shipqty,
								lineNumber : selected_sku.lineNumber
							});
							
							$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode][0].qty = +qty;
							$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode][0].total = +tot_wtax;
							$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode][0].subtotal = +totalc;
							$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode][0].vat = +vat_total;
							$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[selected_sku.productCode][0].tax = +tax_tot;
							existingskus.push(selected_sku.SKU);
							$timeout(function() {
								$scope.fillTableElements($scope.form.asnData[asnIndex], asnIndex);
							}, 500);
							
							/* angular.forEach($scope.form.packageData[asnIndex].productDetails[selected_sku.productCode][0]['skus'], function(lval, lindex) {
								if (lval.sku == selected_sku.SKU) {
									if (lval.taxisVAT == 1) {

										$scope.calcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.vat_total, selected_sku.productCode, packageIndex);
									} else if (lval.taxisVAT == 0) {

										$scope.calcItems(lindex, lval.qty, lval.cost, lval.totalnotax, lval.total, lval.tax_tot, selected_sku.productCode, packageIndex);
									}
								}
							}); */
						}
					}
				});
			}
		});
	}
	
	$scope.UOM = [];
	$scope.UOMvalues = [];
	$scope.uomlist = []; 
	/*******************get uom **********/
	$scope.uomservice = function() {
		Data.get('/uom').then(function(results) {
			var uomdatas = [];
			angular.forEach(results, function(values) {
				if ((values.isActive) && (values.uomId != undefined) && (values.uomId != '') && (values.description != undefined) && (values.description != '')) {
					var newobj = {
						name: values.description,
						id: values.uomId,
						value: values.uomId,
						uid: values.uomId
					}
					uomdatas.push(newobj);
					$scope.UOMvalues[values.uomId] = values.description;
				}
			});
			$scope.UOM = uomdatas;
			angular.forEach($scope.UOM, function(item) {
				$scope.uomlist[item.name] = item.value;
			});
		});
	}
	$scope.uomservice();
 
	/****Add New Packages to an ASN*******/
	$scope.addPackages = function() {
		var newobj = {};
		newobj.packageId = Math.round(+new Date() / 1000);
		$scope.form.packageData.push(newobj);
	};
	
	/****Add New ASN*******/
	$scope.addAsns = function() {
		var newobj = {};
		var packageId = "ASN" + $scope.action.orderNumber + $scope.getUniqueID(3);
		newobj[packageId]	=	{};
		newobj[packageId].purchaseOrder	=	{};
		newobj[packageId].purchaseOrder.purchaseOrderNumber	=	$scope.action.orderNumber;
		newobj[packageId].purchaseOrder.totalPoTaxAsn	= 0;
		newobj[packageId].purchaseOrder.totalPoVATAsn	=	0,
		newobj[packageId].purchaseOrder.PoSubtotalAsn	=	0;
		newobj[packageId].purchaseOrder.totalPoCostAsn	=	0;
		newobj[packageId].purchaseOrder.purchaseOrderAsn	=	{};
		newobj[packageId].purchaseOrder.purchaseOrderAsn.purchaseOrderPackage	=	[];
		newobj[packageId].purchaseOrder.purchaseOrderAsn.purchaseOrderPackage[0]	=	{};
		newobj[packageId].purchaseOrder.purchaseOrderAsn.purchaseOrderPackage[0].packageId = Math.round(+new Date() / 1000);
		newobj[packageId].purchaseOrder.purchaseOrderAsn.asnId	=	packageId;
		newobj[packageId].purchaseOrder.purchaseOrderAsn.asnDate						=	$scope.getTimeStamp();
		newobj[packageId].purchaseOrder.purchaseOrderAsn.billOfLadingId				=	"BL" + packageId;
		$scope.form.asnData[packageId]=newobj[packageId];
	}
	$scope.getDatetime			=	$scope.newDate	=	new Date();
	
	$scope.getTimeStamp	=	function(dte) {
    	var dte_obj	=	dte || new Date();

    	return Date.parse(dte_obj);
    };
	
	$scope.getUniqueID	=	function(length) {
		return Math.random().toString(36).substr(2, length).toUpperCase();
	};
	
	$scope.shipAsn	=	function(data, asnstatus ,asnIndex, skulength){
		if(skulength == undefined || skulength == ''){
				$scope.form.asnData[asnIndex].errormessage 	=	true;
			$timeout(function() {
				$scope.form.asnData[asnIndex].errormessage 	=	false;
			}, 3000);
			return false;
		}

		var asnjson	=	[];
		var newobj	=	{};
		var srcobj	=	data.asnData[asnIndex].purchaseOrder;
		newobj.purchaseOrder												=	{};
		newobj.purchaseOrder.purchaseOrderNumber				= 	srcobj.purchaseOrderNumber;
		if(asnstatus == 'shipped'){
			newobj.purchaseOrder.orderStatus								= 	"partiallyShipped";
		}
		/* newobj.purchaseOrder.totalPoTaxAsn							= 	srcobj.totalPoTaxAsn;
		newobj.purchaseOrder.totalPoVATAsn						= 	srcobj.totalPoVATAsn;
		newobj.purchaseOrder.PoSubtotalAsn							= 	srcobj.PoSubtotalAsn;
		newobj.purchaseOrder.totalPoCostAsn						= 	srcobj.totalPoCostAsn; */
		var tmp_obj	=	newobj.purchaseOrder.purchaseOrderAsn		=	{};
		var data_obj	=	data.asnData[asnIndex].purchaseOrder.purchaseOrderAsn;
		var pkg_obj	=	data_obj.purchaseOrderPackage[0];
		tmp_obj.asnDate								=	data_obj.asnDate;
		tmp_obj.asnId									=	data_obj.asnId;
		//tmp_obj.billOfLadingId						=	data_obj.billOfLadingId;
		tmp_obj.billLadingId							=	data_obj.billOfLadingId;
		tmp_obj.numberOfPackages				=	1;
		tmp_obj.purchaseOrderPackage			=	[];
		tmp_obj.purchaseOrderPackage[0]		=	{};
		tmp_obj.purchaseOrderPackage[0].packageId						=	pkg_obj.packageId;
		tmp_obj.purchaseOrderPackage[0].trackingNumber				=	pkg_obj.trackingNumber;
		tmp_obj.purchaseOrderPackage[0].packageStatus				=	asnstatus;
		tmp_obj.purchaseOrderPackage[0].shipDate						=	$filter('dateFormChange')(pkg_obj.shipDate);
		tmp_obj.purchaseOrderPackage[0].expectedDeliveryDate	=	$filter('dateFormChange')(pkg_obj.receivedDate);
		tmp_obj.purchaseOrderPackage[0]	.purchaseOrderItem		=	[];
		
		angular.forEach(data_obj.productDetails, function(sItem, sId){
			angular.forEach(sItem[0].skus, function(skudata,key){
				var skuobj				=	{};
				skuobj.sku				=	skudata.sku;
				//skuobj.qtyStatus	=	'shipped';
				skuobj.qtyStatus	=	asnstatus;
				skuobj.qty				=	skudata.shippedqty;
				skuobj.lineNumber	=	skudata.lineNumber;
               	skuobj.uom			=	skudata.selectedUOM;
			// skuobj.totalProductTaxAsn		=	skudata.totalProductTax
			//	skuobj.totalProductVatAsn		=	skudata.totalProductVat
			//	skuobj.totalProductCostAsn	=	skudata.totalProductCost 
				tmp_obj.purchaseOrderPackage[0]	.purchaseOrderItem.push(skuobj);
			});
		});

		asnjson.push(newobj);
		var jsonStr	=	JSON.stringify(asnjson);
		$scope.callService('/receivingpurchasejson', jsonStr,asnIndex,asnstatus);
	}
	
	$scope.shipAsnPacks	=	function(data){
		
	}
	
	$scope.callService	=	function(uploadUrl, jsonStr,asnIndex,asnstatus) {

    	 var obj = {"data" : {"uploaded_file" : jsonStr, "type" : "json"}};
        Data.post(uploadUrl, obj)
        .then(function(success){
				delete $scope.form.asnData[asnIndex];
				if(success){
					if (success.status == "success") {
						if(asnstatus == 'shipInProgress'){
							var output = {"status": "success","message": "Package Saved Successfully"};
						}else{
							var output = {"status": "success","message": "Package Shipped Successfully"};
						}			
						Data.toast(output);
						$state.reload();
					}
					else{
						var output = {
								"status": "error",
								"message": "Error with Shipping Package"
						};
						Data.toast(output);
					}
				}
				//$state.reload();
        });
    }; 
	
	var confirmQtyData = ''
	$scope.limitofsku 	=	function (min, value, style, asnIndex, skuindex , SKU , action){
		if($scope.QtyDetails && $scope.QtyDetails[SKU] && $scope.QtyDetails[SKU].qtyStatus && $scope.QtyDetails[SKU].qtyStatus.confirmed){
			if(confirmQtyData == ''){
				confirmQtyData 	=	$scope.QtyDetails[SKU].qtyStatus.ShippedQTY ? ($scope.QtyDetails[SKU].qtyStatus.confirmed - $scope.QtyDetails[SKU].qtyStatus.ShippedQTY) : $scope.QtyDetails[SKU].qtyStatus.confirmed;
				
			}
			if(value <= confirmQtyData){
				if(value < min){
					$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[style][0].skus[skuindex].shippedqty 	=	min;
					return false;
				}else{
					$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[style][0].skus[skuindex].shippedqty 	=	value;
					$scope.QtyDetails[SKU].qtyStatus.ShippedQTY = value;
				}
			}else if(confirmQtyData == 0){
				$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[style][0].skus[skuindex].shippedqty 	=	0;
				$scope.QtyDetails[SKU].qtyStatus.ShippedQTY = 0;
				var output = { "status": "error", "message": "Shipped quantity cannot exceed confirmed quantity"};
				Data.toast(output);
			}else{
				var qty = confirmQtyData;
				$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[style][0].skus[skuindex].shippedqty 	=	qty;
				$scope.QtyDetails[SKU].qtyStatus.ShippedQTY = qty;
				var output = { "status": "error", "message": "Shipped quantity cannot exceed confirmed quantity"};
				Data.toast(output);
			}
		}else{
			$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[style][0].skus[skuindex].shippedqty 	=	min;
			$scope.QtyDetails[SKU].qtyStatus.ShippedQTY = min;
		}
	};

	$scope.decreaseshipqty 	=	function (style, asnIndex, skuindex){

		if($scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[style][0].skus[skuindex].shippedqty == undefined || $scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[style][0].skus[skuindex].shippedqty == ''){
			$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[style][0].skus[skuindex].shippedqty = 0;
		}

		$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[style][0].skus[skuindex].shippedqty 	=	$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[style][0].skus[skuindex].shippedqty - 1;
	};

	$scope.increaseshipqty 	=	function (style, asnIndex, skuindex){

		if($scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[style][0].skus[skuindex].shippedqty == undefined || $scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[style][0].skus[skuindex].shippedqty == ''){
			$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[style][0].skus[skuindex].shippedqty = 0;
		}

		$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[style][0].skus[skuindex].shippedqty 	=	$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[style][0].skus[skuindex].shippedqty + 1;
	};

	$scope.removeAsnSkus	=	function(skuindex, style, asnIndex){
		
		$scope.form.asnData[asnIndex].purchaseOrder.purchaseOrderAsn.productDetails[style][0].skus.splice(skuindex, 1);
	};
	
	$scope.removeAsn	=	function(asnIndex){
		delete $scope.form.asnData[asnIndex];
	};
	
	/* $scope.saveshippingAsns(); */
	
});
