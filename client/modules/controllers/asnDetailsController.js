var app = angular.module('OVCstockApp', []);


app.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            
            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);

app.controller('asnDetailsController',function($scope, $http, $timeout, $stateParams, $rootScope, Data, ovcDash, $filter,$compile,toaster, AsnTableService, ORDERTYPELIST, system_currencies,ASNFILEHEADER) {
	
	var currensymbs = $scope.translation.currencylist[0];
    var currcodes 	= system_currencies[0];
    $scope.currency = currensymbs[currcodes.code];
	$scope.transactions	=[];
	$scope.asn_details_obj			=	{};
	$scope.orderdetail					= {};
	$scope.orderdetail.orderdata	=	{};
	$scope.orderdetail.skuData	=	{};
	$scope.UOMvalues			=	[];
	$scope.form				= 	{};
	$scope.skus 			=  {};
	// $scope.action = {};

	$scope.dosrchproduct	=	function(typedthings) {
		var rows			= 	{};
		var orderdata 		=   $scope.orderdetail.orderdata;
		rows.searchdetail	=	[];
		rows.skudata		=	{};
		if((orderdata.purchaseOrderType	== "IBT_M") || (orderdata.purchaseOrderType	== "PUSH") || (orderdata.purchaseOrderType    == "RPL")){
			var loc_id  =   orderdata.FromLocation;
            if(orderdata.purchaseOrderType  == "RPL"){
              var loc_id  =  orderdata.shipToLocation;
            }
            if (typedthings != '...' && typedthings != '' && typedthings != undefined) {
				ovcDash.get('apis/ang_loc_products?srch=' + typedthings + '&locid=' + encodeURIComponent(loc_id)).then(function(data) {
					if (data.status != 'error') {
						angular.forEach(data,function(item) {
	                        if (!(item.ProductTbl.sku in rows.skudata)){
	    						rows.searchdetail.push(item.ProductTbl.sku+'~'+item.ProductTbl.name+'~'+item.ProductTbl.barCode);
	    						rows.skudata[item.ProductTbl.sku]	=	item;
	                        }
						});
						$scope.transactions				=	rows.searchdetail;
						$scope.orderdetail.skuData		=	rows.skudata;
						if(Object.keys(rows.skudata).length == 1){
							// $scope.asn_details_obj.searchText = rows.searchdetail[0];
							$scope.asn_details_obj.sku 		  =	rows.searchdetail[0].split('~')[0];
							$scope.asn_details_obj.skudata	  =	$scope.orderdetail.skuData[$scope.asn_details_obj.sku];
							$scope.addSkus();
						}
					}
					else{
						if($scope.transactions 	!= '')
	                       var output = {
	                          "status": "error",
	                          "message": "No products Found"
	                      };
                  		Data.toast(output);
                  		$scope.asn_details_obj.searchText = '';
                  		$scope.transactions 	=	[];
	               }
				},function(data){});
			}	
		}
		
		if(orderdata.purchaseOrderType	== "MAN"){
            if (typedthings != '...' && typedthings != '' && typedthings != undefined) {
                if(orderdata.primarysupplier){
                    var loc_id  =   orderdata.shipToLocation;
                    ovcDash.get('apis/ang_loc_products?srch=' + typedthings + '&locid=' + encodeURIComponent(loc_id)).then(function(data) {
                        if (data.status != 'error') {
                            angular.forEach(data,function(item) {
                                if (!(item.ProductTbl.sku in rows.skudata)){
                                    rows.searchdetail.push(item.ProductTbl.sku+'~'+item.ProductTbl.name+'~'+item.ProductTbl.barCode);
                                    rows.skudata[item.ProductTbl.sku]   =   item;
                                }
                            });
                            $scope.transactions				=	rows.searchdetail;
							$scope.orderdetail.skuData		=	rows.skudata;
							if(Object.keys(rows.skudata).length == 1){
								// $scope.asn_details_obj.searchText = rows.searchdetail[0];
								$scope.asn_details_obj.sku 		  =	rows.searchdetail[0].split('~')[0];
								$scope.asn_details_obj.skudata	  =	$scope.orderdetail.skuData[$scope.asn_details_obj.sku];
								$scope.addSkus();
							}
                        }
                       else{
							if($scope.transactions 	!= '')
		                       var output = {
		                          "status": "error",
		                          "message": "No products Found"
		                      };
                      		Data.toast(output);
                      		$scope.asn_details_obj.searchText = '';
                  			$scope.transactions 	=	[];                      
		               }
                    },function(error){});
                }
                else{
                	var sku     =   [];
                    if(typedthings.indexOf('~')){
                        var skuvalue     =   typedthings.split('~');
                        sku             =   skuvalue[0];
                    }
                    else{
                        sku         =   typedthings;
                    }

        			Data.get('/vendorproduct/' + orderdata.vendorId + '?vendorSKU=' + sku).then(function(data) {
        				if (data.ProductData != '') {
        					var nrows = [];
        					angular.forEach(data.ProductData, function(item) {
        						nrows.push(item.vendorSKU);
        					});
        					if (nrows != '') {
        						ovcDash.post('apis/ang_getvendorproducts',{data:{sku:nrows.join(',')}}).then(function (results) {
        							
                                    if (results.status != 'error') {
        								angular.forEach(results,function(newitem) {
                                            if (!(newitem.ProductTbl.sku in rows.skudata)){
                                                rows.searchdetail.push(newitem.ProductTbl.sku+'~'+newitem.ProductTbl.name+'~'+newitem.ProductTbl.barCode);
                                                rows.skudata[newitem.ProductTbl.sku]    =   newitem;
                                                
                                            }
        									
        								});
        								$scope.transactions				=	rows.searchdetail;
										$scope.orderdetail.skuData		=	rows.skudata;
										if(Object.keys(rows.skudata).length == 1){
											// $scope.asn_details_obj.searchText = rows.searchdetail[0];
											$scope.asn_details_obj.sku 		  =	rows.searchdetail[0].split('~')[0];
											$scope.asn_details_obj.skudata	  =	$scope.orderdetail.skuData[$scope.asn_details_obj.sku];
											$scope.addSkus();
										}
        							}
        						},function(error){});
        					}
        				}
        				else{
							if($scope.transactions 	!= '')
		                       var output = {
		                          "status": "error",
		                          "message": "No products Found"
		                      };
                      		Data.toast(output);
                      		$scope.asn_details_obj.searchText = '';
                  			$scope.transactions 	=	[];
		               }
        			},function(error){});
                }
            }
		}
	};

	$scope.doSelectproduct	=	function(sku_obj) {
		$scope.asn_details_obj.sku 		=	sku_obj.split('~')[0];
		$scope.asn_details_obj.skudata	=	$scope.orderdetail.skuData[$scope.asn_details_obj.sku];
		$scope.addSkus();
	};
	$timeout(function(){
        angular.element('#looksearch').focus();
   	},500);
	$scope.showContent 		=	function($fileContent,file){
		// $scope.importedASNFileData 	=	[];
		 //var file    =     $scope.myFile;
		 //nsole.log(file);
		var ext       =     file.name.substr(file.name.lastIndexOf('.') + 1);
        if(ext == 'dat'){
        	
        	var readedContent 	=	$scope.processData($fileContent);
			$scope.importedASNFileData	=	[];
			var convertedFileObject 	=	[];
	        var barcodeList 			=	[];
	        angular.forEach(readedContent, function (content) {
	        	var countItemObj 	=	{};
	        	angular.forEach(ASNFILEHEADER, function (headerValue,key) {
	        		if(content[key]){
	        			countItemObj[headerValue] 	=	content[key];
	        		}
	        		
	    		});
	    		if(barcodeList.indexOf(countItemObj['barcode']) == -1){
	    			barcodeList.push(countItemObj['barcode']);
	    		}

	    		if(!convertedFileObject[countItemObj['barcode']]){
	    			convertedFileObject[countItemObj['barcode']] 	=	countItemObj;
	    		}
	    		//convertedFileObject.push(countItemObj);
	        });

	        $scope.importedASNFileData 	=	convertedFileObject;
	        
	        
	        var barcodeSKUDetails 		=	[];

	        if(barcodeList.length > 0){
	        	var locationId  	=	$scope.ship_to_location;
	        	if(($scope.orderdetail.orderdata.purchaseOrderType	== "IBT_M") || ($scope.orderdetail.orderdata.purchaseOrderType	== "PUSH") || ($scope.orderdetail.orderdata.purchaseOrderType    == "RPL") || ($scope.orderdetail.orderdata.purchaseOrderType	== "MAN" && $scope.orderdetail.orderdata.primarysupplier)){
	        		if($scope.orderdetail.orderdata.purchaseOrderType  == "RPL"){
		              locationId  =  $scope.orderdetail.orderdata.shipToLocation;
		            }
		        	ovcDash.get('apis/ang_barcode_datas?code='+barcodeList.toString()+'&locid='+ encodeURIComponent(locationId)).then(function (skuDatas) {
		        		var skuList 	=	[];
		        		var availableBarcodesList 	=	[];
		        		if(skuDatas && skuDatas.length > 0){
		        			
		        			angular.forEach(skuDatas, function(skuDetails,key){
		        				skuList.push(skuDetails['ProductTbl']['sku']);
		        				if(!barcodeSKUDetails[skuDetails['ProductTbl']['sku']]){
		        					barcodeSKUDetails[skuDetails['ProductTbl']['sku']] 	= 	convertedFileObject[skuDetails['ProductTbl']['sku']] ? convertedFileObject[skuDetails['ProductTbl']['sku']] : convertedFileObject[skuDetails['ProductTbl']['barcode']]; 
		        					var availableBarcode 	=	convertedFileObject[skuDetails['ProductTbl']['sku']] ? skuDetails['ProductTbl']['sku'] : skuDetails['ProductTbl']['barcode'];
		        					availableBarcodesList.push(availableBarcode);
		        				}
		        			});

		        			$scope.importedASNFileData 	=	barcodeSKUDetails;

		        			var skuPrice 		=	[];

		        			ovcDash.get('apis/ang_skus_getproductprice?sku=' + skuList.toString()+'&loc='+ encodeURIComponent($scope.ship_to_location)).then(function(skuInfo) {
		        				if(skuInfo && skuInfo.length > 0){
		        					angular.forEach(skuInfo, function(priceDetails,key){
		        						if(!skuPrice[priceDetails['ProductPrice']['sku']]){
		        							skuPrice[priceDetails['ProductPrice']['sku']] 	=	{};
		        						}
		        						skuPrice[priceDetails['ProductPrice']['sku']]['cost']  = priceDetails['ProductPrice']['Cost'];
				        			});
		        				}
		        				
		        				angular.forEach(skuDatas, function(skuDetails,key){
		        					skuDetails['ProductTbl']['cost'] 	=	skuPrice[skuDetails['ProductTbl']['sku']]['cost'];
			        				$scope.formatResult(skuDetails,'fromFile'); 
			        			});
		        			});
		        		}

		    			if(availableBarcodesList.length != barcodeList.length){
		    				var errorMessage 	=	'';
		    				angular.forEach(barcodeList, function (barcode) {
			    				if(availableBarcodesList.indexOf(barcode) == -1) {
			    					errorMessage 	+=	barcode+' - Barcode or SKU was not found <br />';
			    				}
			    			});
			    			var output 	=	{"status":"error","message":errorMessage};
		    				Data.toast(output);
		    			}        		
		        	});
		        }
		        if($scope.orderdetail.orderdata.purchaseOrderType	== "MAN" && !$scope.orderdetail.orderdata.primarysupplier){

	        		Data.get('/vendorproduct/' + $scope.orderdetail.orderdata.vendorId).then(function(data) {
	        			if (data.ProductData != '') {
        					var nrows = [];
        					var nrows1	=	[];
        					var notinvendor =	[];
						    var availableBarcodesList 	=	[];
        					angular.forEach(data.ProductData, function(item) {
        						nrows.push(item.vendorSKU);
        					});
        					angular.forEach(barcodeList, function(vendorsku){
        						if(nrows.indexOf(vendorsku) > -1){
				    			 	nrows1.push(vendorsku);
	        					}
	        					else{
	        						notinvendor.push(vendorsku);
	        					}
        					});

        					if(notinvendor.length > -1){
			    				var errorMessage 	=	'';
			    				angular.forEach(notinvendor, function (barcodesku) {
				    					errorMessage 	+=	barcodesku +' - Barcode or SKU was not found <br />';
				    			});
				    			var output 	=	{"status":"error","message":errorMessage};
			    				Data.toast(output);
			    			}

        					if (nrows1 != '') {
        						ovcDash.post('apis/ang_getvendorproducts',{data:{sku:nrows1.join(',')}}).then(function (skuDatas) {
        							
                                    if (skuDatas.status != 'error') {
                                    	var skuList 	=	[];
						        		if(skuDatas && skuDatas.length > 0){
						        			
						        			angular.forEach(skuDatas, function(skuDetails,key){
						        				skuList.push(skuDetails['ProductTbl']['sku']);
						        				if(!barcodeSKUDetails[skuDetails['ProductTbl']['sku']]){
						        					barcodeSKUDetails[skuDetails['ProductTbl']['sku']] 	= 	convertedFileObject[skuDetails['ProductTbl']['sku']] ? convertedFileObject[skuDetails['ProductTbl']['sku']] : convertedFileObject[skuDetails['ProductTbl']['barcode']]; 
						        					var availableBarcode 	=	convertedFileObject[skuDetails['ProductTbl']['sku']] ? skuDetails['ProductTbl']['sku'] : skuDetails['ProductTbl']['barcode'];
						        					availableBarcodesList.push(availableBarcode);
						        				}
						        			});

						        			$scope.importedASNFileData 	=	barcodeSKUDetails;

						        			var skuPrice 		=	[];

						        			ovcDash.get('apis/ang_skus_getproductprice?sku=' + skuList.toString()+'&loc='+ encodeURIComponent($scope.ship_to_location)).then(function(skuInfo) {
						        				if(skuInfo && skuInfo.length > 0){
						        					angular.forEach(skuInfo, function(priceDetails,key){
						        						if(!skuPrice[priceDetails['ProductPrice']['sku']]){
						        							skuPrice[priceDetails['ProductPrice']['sku']] 	=	{};
						        						}
						        						skuPrice[priceDetails['ProductPrice']['sku']]['cost']  = priceDetails['ProductPrice']['Cost'];
								        			});
						        				}
						        				
						        				angular.forEach(skuDatas, function(skuDetails,key){
						        					skuDetails['ProductTbl']['cost'] 	=	skuPrice[skuDetails['ProductTbl']['sku']]['cost'];
							        				$scope.formatResult(skuDetails,'fromFile'); 
							        			});
						        			});
						        		}
        							}
        						});
        					}
        				}
        				else{
        					var output = {
	                          "status": "error",
	                          "message": "No products Found"
	                    	};
		                    Data.toast(output);
		                    return false;
        				}
	        		});
		        }
	        }
        }else{
            var output = {
                "status": "error",
                "message": $scope.translation.fileupload[0].upload_dat
            };
            Data.toast(output);
        }
		
	};

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

    /*******************get uom **********/
	$scope.getUomService 	= 	function() {
        Data.get('/uom').then(function(results) {
            var uomdatas = [];
            angular.forEach(results, function(values) {
                if ((values.isActive) && (values.uomId != undefined) && (values.uomId != '') && (values.description != undefined) && (values.description != '')) {
					$scope.UOMvalues[values.uomId]=values.uomId;
                }
            });
        });
    }

	$scope.getUomService();

	$scope.formatResult	=	function(results,isFile) {
		// count 		=	1; 
		var product_details	=	{};
		var product_obj	=	(typeof results['ProductTbl'] != undefined) ?results['ProductTbl'] : null;
		
		if(product_obj != null) {
			var asn_details 	=	$rootScope.asn_details.asns;
			var tmp	=	{};
			
			var sduom 		= 	$scope.UOMvalues['Each'];
			tmp.skuCost		=	0;
			tmp.description	=	product_obj.description
			tmp.qty 		=	0;
			tmp.qtyStatus	=	'shipped';
			tmp.productCode	=	product_obj.productCode;
			//tmp.styleDescription	=	product_obj.styleDescription;
			tmp.poId	=	$stateParams.orderid;
			tmp.sku 	=	product_obj.sku;
			tmp.is_new	=	$scope.form.is_new   =   true;
			tmp.newQty	=	1;
			tmp.producUom	=	sduom;
			if($scope.importedASNFileData){
				if($scope.importedASNFileData[product_obj['sku']]){
					tmp.newQty	=	parseInt($scope.importedASNFileData[product_obj['sku']]['quantity']);
				}
			}

			
			tmp.skuCost 		=	parseFloat(product_obj.cost).toFixed(2);

			//ovcDash.get('apis/ang_getproductprice?sku=' + product_obj.sku+'&loc='+$scope.ship_to_location).then(function(skuInfo) {
				/*if(skuInfo != undefined) {
					tmp.skuCost 	=	parseFloat(skuInfo.ProductPrice.Cost).toFixed(2);
				}*/
				
			var asn_details_key 	=	$stateParams['asnid'];

			if(asn_details[asn_details_key]['packages']){
				//***With PackageId Formating ***//
			 	var product_details_obj	=	asn_details[asn_details_key]['packages'];

			 	var packageId = Object.keys(product_details_obj);
			 	packageId = packageId[0];

			 	if( ! asn_details[asn_details_key]['packages'][packageId])
					asn_details[asn_details_key]['packages'][packageId]	=	[];

			 	var product_codes 	=	Object.keys(asn_details[asn_details_key]['packages'][packageId]['skus']);
				
				if( ! asn_details[asn_details_key]['packages'][packageId]['skus'][product_obj.productCode])
					asn_details[asn_details_key]['packages'][packageId]['skus'][product_obj.productCode]	=	{};

				if( ! asn_details[asn_details_key]['packages'][packageId]['skus'][product_obj.productCode]['skuArr'])
				    asn_details[asn_details_key]['packages'][packageId]['skus'][product_obj.productCode]['skuArr'] 	=	[];

				var total_qty 	=	0;
				var productDetails = asn_details[asn_details_key]['packages'][packageId]['skus'];
				var total_cost 	=	tmp.skuCost;
			 	var groupedSkus = asn_details[asn_details_key]['packages'][packageId]['skus'][product_obj.productCode]['skuArr'];
				// var lineNumber = 1;
				// if(groupedSkus.length > 0){
				// 	lineNumber = groupedSkus[(groupedSkus.length) - 1]['lineNumber'] + 1;
				// }
				// tmp.lineNumber = lineNumber;
				var linedetails = [];

				angular.forEach(asn_details[asn_details_key]['packages'], function(packageData,key){
				
		            if (packageData.skus) {
						angular.forEach(packageData.skus, function(values,key){
				                var groupedSkus = values['skuArr'];
				                angular.forEach(groupedSkus,function(exstdata, n) {
									if(exstdata.lineNumber != ''){
										linedetails.push(exstdata.lineNumber);
									}
								});
						});
					}
				});
				
			 	lineNumber 	= 	Math.max.apply(Math,linedetails)+ 1;

				tmp.lineNumber = +lineNumber;

			 	if(product_codes.indexOf(product_obj.productCode) >= 0) {
			 		var key = -1;
			 		angular.forEach(productDetails[product_obj.productCode].skuArr, function(item,skuIndex) {
			 			if(product_obj.sku === item.sku){
			 				key = skuIndex;
			 			}
			 		});

			 		if(key >= 0){
			 			var skuDetails = productDetails[product_obj.productCode].skuArr;
			 			
			 			if(!skuDetails[key].newQty){
			 				skuDetails[key].newQty = 0;
			 			}
			 			
			 			
			 			skuDetails[key].newQty		=	parseInt(skuDetails[key].newQty) + tmp.newQty;

			 			if(isFile){
			 				skuDetails[key].newQty	=	tmp.newQty;
			 			}

			 		}else{
			 			asn_details[asn_details_key]['packages'][packageId]['skus'][product_obj.productCode]['skuArr'].push(tmp);
			 		}
			 	}
			 	else
			 	{
			 		total_qty 	=	1;
			 		asn_details[asn_details_key]['packages'][packageId]['skus'][product_obj.productCode]['skuArr'].push(tmp);
			 	}
			 	
			 	asn_details[asn_details_key]['packages'][packageId]['skus'][product_obj.productCode].totalQty 	=	total_qty;
			 	asn_details[asn_details_key]['packages'][packageId]['skus'][product_obj.productCode].totalCost	=	total_cost;
			 	asn_details[asn_details_key]['packages'][packageId]['skus'][product_obj.productCode].styleDescription	=	product_obj.styleDescription;
			 	asn_details[asn_details_key]['packages'][packageId]['skus'][product_obj.productCode].stylecode 	=	product_obj.productCode;

			 	var packageQty = numberofSku = asnCost = 0;
				angular.forEach(asn_details[asn_details_key]['packages'][packageId]['skus'],function(packages){
					var skuLength		= packages.skuArr.length;
					var TotalQuantity	= totalCost = 0;
					angular.forEach(packages.skuArr,function(skuData){
						
						var qty = skuData.qty;
						TotalQuantity = parseInt(TotalQuantity) + parseInt(qty);
						
						if(skuData.skuCostAsn){
							totalCost = parseInt(qty) * parseFloat(skuData.skuCostAsn);
						}else if(skuData.skuCostConfirm){
							totalCost = parseInt(qty) * parseFloat(skuData.skuCostConfirm);
						}else{
							totalCost = parseInt(qty) * parseFloat(skuData.skuCost);
						}
					});
					packages.TotalQuantity = TotalQuantity;

					packageQty 	= parseInt(packageQty) + parseInt(TotalQuantity);
					numberofSku = parseInt(numberofSku) + parseInt(skuLength);
					asnCost 	= parseFloat(asnCost) + parseFloat(totalCost);
				});

				asn_details[asn_details_key]['packageQty'] = packageQty;
				asn_details[asn_details_key]['asnCost'] = asnCost.toFixed(2);
				asn_details[asn_details_key]['packages'][packageId]['numberOfSKU'] = numberofSku;

			 	$scope.asn_details_obj.searchText 	=	"";
			 	$scope.asn_details_obj				=	{};
				$scope.transactions					=	[];
				$rootScope.asn_details.asns 		=	asn_details;

			}else{
				//***With Out PackageId Formating ***//

				//****New SKU Adding Formatting****//
			 	var product_codes 	=	Object.keys(asn_details[asn_details_key]['styles']);
			 	if( ! asn_details[asn_details_key]['styles'][product_obj.productCode])
					asn_details[asn_details_key]['styles'][product_obj.productCode]	=	{};

				if( ! asn_details[asn_details_key]['styles'][product_obj.productCode]['skuArr'])
				    asn_details[asn_details_key]['styles'][product_obj.productCode]['skuArr'] 	=	[];

				var total_qty 		=	0;
				var productDetails 	= 	asn_details[asn_details_key]['styles'];
				var total_cost 		=	tmp.skuCost;
			 	var groupedSkus 	= 	asn_details[asn_details_key]['styles'][product_obj.productCode]['skuArr'];
				var linedetails 	= 	[];

				//***New Style, Exsiting Style Push***//
				angular.forEach(asn_details, function(styleData,key){
		            if (styleData.styles) {
						angular.forEach(styleData.styles, function(values,key){
				                var groupedSkus = values['skuArr'];
				                angular.forEach(groupedSkus,function(exstdata, n) {
									if(exstdata.lineNumber != ''){
										linedetails.push(exstdata.lineNumber);
									}
								});
						});
					}
				});

				//**Line Details & No.of.Sku COunting***//
				
				lineNumber 	= 	Math.max.apply(Math,linedetails)+ 1;
				tmp.lineNumber 	= +lineNumber;

				//*****Style New Quanity add Calculation*****//
				if(product_codes.indexOf(product_obj.productCode) >= 0) {
			 		var key = -1;
			 		angular.forEach(productDetails[product_obj.productCode].skuArr, function(item,skuIndex) {
			 			if(product_obj.sku === item.sku){
			 				key = skuIndex;
			 			}
			 		});

			 		if(key >= 0){
			 			var skuDetails = productDetails[product_obj.productCode].skuArr;
			 			if(!skuDetails[key].newQty){
			 				skuDetails[key].newQty 	= 	skuDetails[key].qty;
			 				
			 			}
			 			
			 			skuDetails[key].newQty		=	parseInt(skuDetails[key].newQty) + tmp.newQty;
			 			
			 			if(isFile)
			 				skuDetails[key].newQty	=	tmp.newQty;
			 		}else{
			 			asn_details[asn_details_key]['styles'][product_obj.productCode]['skuArr'].push(tmp);
			 		}
			 	}else{
			 		total_qty 	=	1;
			 		asn_details[asn_details_key]['styles'][product_obj.productCode]['skuArr'].push(tmp);
			 	}
			 	asn_details[asn_details_key]['styles'][product_obj.productCode].totalQty 		=	total_qty;
			 	asn_details[asn_details_key]['styles'][product_obj.productCode].totalCost		=	total_cost;
			 	asn_details[asn_details_key]['styles'][product_obj.productCode].styleDescription	=	product_obj.styleDescription;
			 	asn_details[asn_details_key]['styles'][product_obj.productCode].stylecode 	=	product_obj.productCode;

			 	var packageQty = numberofSku = asnCost = 0;

			 	//****Exisiting Sku add Calculation****//
				angular.forEach(asn_details[asn_details_key]['styles'],function(styles,value){
					
					if(value != 'numberOfSKU'){
						var skuLength		= styles.skuArr.length;
						var TotalQuantity	= totalCost = 0;
						angular.forEach(styles.skuArr,function(skuData){
							var qty = skuData.qty;
							TotalQuantity = parseInt(TotalQuantity) + parseInt(qty);
							
							if(skuData.skuCostAsn){
								totalCost = parseInt(qty) * parseFloat(skuData.skuCostAsn);
							}else if(skuData.skuCostConfirm){
								totalCost = parseInt(qty) * parseFloat(skuData.skuCostConfirm);
							}else{
								totalCost = parseInt(qty) * parseFloat(skuData.skuCost);
							}
						});
						styles.TotalQuantity = TotalQuantity;

						packageQty 	= parseInt(packageQty) + parseInt(TotalQuantity);
						numberofSku = parseInt(numberofSku) + parseInt(skuLength);
						asnCost 	= parseFloat(asnCost) + parseFloat(totalCost);
					}
				});
				asn_details[asn_details_key]['packageQty'] 				= 	packageQty;
				asn_details[asn_details_key]['asnCost'] 				= 	asnCost.toFixed(2);
				asn_details[asn_details_key]['styles']['numberOfSKU']	= 	numberofSku;

			 	$scope.asn_details_obj.searchText 	=	"";
			 	$scope.asn_details_obj				=	{};
				$scope.transactions					=	[];
				$rootScope.asn_details.asns			=	asn_details;
			}
		}
	};

	$scope.addSkus	=	function() {			
		if (($scope.asn_details_obj.skudata)) {
			var sku 	=	$scope.asn_details_obj.skudata['ProductTbl']['sku'];
			ovcDash.get('apis/ang_getproductprice?sku=' + sku+'&loc='+ encodeURIComponent($scope.ship_to_location)).then(function(costInfo) {
				$scope.asn_details_obj.skudata['ProductTbl']['cost'] 	= 	costInfo[0]['ProductPrice'] ? costInfo[0]['ProductPrice']['Cost']:0;
				$scope.formatResult($scope.asn_details_obj.skudata);
			});
		}
		$scope.transactions 	=	[];
	};

	$scope.asnDetailsData	=	function() {
		//For empty tha ASN DAtas
		$rootScope.asn_details 	=	'';
		
		var po_id 		=	$stateParams.orderid;
		var	asn_id		=	$stateParams.asnid;
			if($stateParams.packageid)
				var	package_id	=	$stateParams.packageid;
			else
				package_id		=	null;


		Data.get('/poasn?asnid='+asn_id+'&poid='+po_id+'&package_id='+package_id).then(function(results) {
            if(results && results.asnData)
            {
            	Data.get('/order?purchaseordernumber=' + po_id).then(function(res) {
            		console.log("res_______:",res);
            		var order_data	=	res.order_data;
            		if(order_data != '' && order_data != undefined){
            			results.asnData[asn_id]['purchaseOrderType']  	= 	order_data[0].purchaseOrderType;
            			$scope.ship_to_location					=	order_data[0].shipToLocation;
						$scope.orderdetail.orderdata			=	order_data[0];
						$scope.vendorid 						=	order_data[0].vendorId;
						if (($scope.vendorid  != null) && ($scope.vendorid  != '') && ($scope.vendorid  != undefined)) {
							Data.get('/vendor?id=' + $scope.vendorid ).then(function(data) {
								$scope.orderdetail.orderdata.primarysupplier 	=	data.primarysupplier;
							});
						}
            		}
    			});
    			var temp_obj = {  
                   "resolvebtn":false,
                   "showgroup":true,
                   "asns" : results.asnData,
                   "error":5,
                   "receivebtn":true

                }
                $rootScope.asn_details  =   temp_obj;
                // $rootScope.asn_details  =   AsnTableService.getFormattedData(results);
            }
        });       
	};
	$scope.asnDetailsData();
});
