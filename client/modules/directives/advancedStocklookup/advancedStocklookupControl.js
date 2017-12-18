var app 	= 	angular.module('OVCstockApp.advancedStock',[]);
/*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module			:       Advanced StockLookup Controller II
*
*    Developer		:       Sivaprakash
*
*    Date			:       27/07/2016
*
*    Version		:        1.0
*
**********************************************************************/
app.directive('advancedStocklookup',function(){

	return {
			restrict: 'E',
			scope:true,
			controller:'advancedlookupctrl',
			templateUrl: 'modules/directives/advancedStocklookup/stocklookup.html',

		};
})
.controller('advancedlookupctrl',function($rootScope, $scope, $state,  $stateParams,  $timeout,  Data, ovcDash, 
 RULEDEFN, PRICELIST, DOCUMENTRULE, $compile, TreeViewService, roleConfigService, $attrs, REPLENISHMENTRULE, Utils){
	var user_detail=$rootScope.globals['currentUser'];
	var id_user=user_detail['username'];
	$scope.label 	=	{};
	$scope.dropdown =	{};
	$scope.loadmat	=	false;
	$scope.action   =   {};
	$scope.ship 	=	{};
	$scope.action.alllocations = {};
	$scope.selSkuData 	= 	{};
	$scope.popup 		=	{};
	$scope.shipData 	=	$scope.ship;
  	$scope.shipData 	= 	$attrs.styleresult;
  	$scope.searchdata 	= 	$attrs.searchdata;
  	$scope.balance1 	=	false;
	$scope.balance2 	=	false;
	$scope.balance3		=	false;
	$scope.balance4 	=	false;
	$scope.balance5 	=	false;

  	if(sessionStorage.lookupsku){
  		var selectedsku  = JSON.parse(sessionStorage.lookupsku);
		$scope.selsku 	= 	selectedsku.sku;
  	}else{
  		$scope.selsku 	= 	$attrs.selsku;
  	}
  	
  	$scope.indexData  	= 	$attrs.index;
  	var skuconfiguration 	=	$attrs.skuconfig;
  	var childstore 	=	{};
  	$scope.ship 			= 	{locationId: $attrs.locationid,  result:'',styleresult:$scope.shipData,mode:"readOnly", page:'stooklookup'};
  	$scope.styleitems		= 	$scope.ship;
	$scope.action.showimage =	{};

  	//****Configration Service With LocalStorage****//
  	var configuration	=	Utils.configurations();
  	configuration.then(function(configData){
  		if(configData){
  			$scope.config_data 	= 	configData.action.stockPr;
	    	$scope.config 		=	configData;
  		}
  		if($scope.config.action.stockPr.imgbydefault){
        	$scope.action.showimage[$scope.indexData] 	=	true;
        }else{
        	$scope.action.showimage[$scope.indexData] 	=	false;
        }
        var findIt			  =   configData.config_arr.FindIt.featureValue;
        $scope.actiondropdown =	  [];
        angular.forEach($scope.ovcLabel.balanceInquiry.action,function(value,key) {
        	if(key === "findit") {
        		if (findIt === true) {
        			$scope.actiondropdown.push(value);
        		}
        	}
        	else {
        		$scope.actiondropdown.push(value);
        	}
        });
  	});


    $scope.showStockingLocationsWidget = false;
    //****Roles Permission With LocalStorage****//
    var lookupRole 		=	{};
	var Roles 		=	Utils.roles();
    Roles.then(function(RolesData){
    	if(RolesData && RolesData.permissionsData && RolesData.permissionsData.stockLookup){
    		lookupRole 	=	RolesData.permissionsData.stockLookup;
    		loadBalanceType();
    	}
    });

    /*****Select product using sku and name******/
	$scope.dosrchproduct = function(typedthings, callback){
		$scope.transactionstyles	=	[];
			var loc_id=$scope.ship.locationId;
	
		if(typedthings != '...'){

			var loc_id=$scope.ship.locationId;
			
			if((loc_id != undefined)){
				ovcDash.get('apis/ang_loc_allproducts?srch='+typedthings+'&locid='+ encodeURIComponent(loc_id)).then(function (data) {
					
					if(data.status != 'error'){
						var rows 		= [];
						var allvals 	= [];
						var styleData 	= [];
						angular.forEach(data,function(item) {
							
							allvals.push(item.ProductTbl);
						});
						$scope.allvalues 	= allvals;
						if($scope.allvalues.length == 1 && $scope.allvalues[0].sku != undefined){
							$scope.selSkuData = $scope.allvalues[0];
							callback($scope.selSkuData);
						}
					}	
				});
			}
		}
	};
    /* list the locations based on store selected */
	$scope.addShipments = function (values) {
		//For Loading Circle
         // $.LoadingOverlay("show");

		$(document).ready(function(){
    		$('[data-toggle="tooltip"]').tooltip();
		});
		$scope.listPROD = [];
		$scope.RpllLocSku 	= 	{};
		$scope.RpllLocSku.locationId 	=	$scope.ship.locationId;
		$scope.RpllLocSku.sku 	=	values;
		var replenishItem 	=	{};       
        if($scope.store_datas.indexOf($scope.ship.locationId) > -1){
        	$scope.ShowReplenishment 	=	true;
            Data.get('/getReplenishmentRulesSku?srchData='+JSON.stringify($scope.RpllLocSku)).then(function (resultsData) {
				if(resultsData){
					angular.forEach(resultsData, function(value, key){
						replenishItem.maximumorder 	=	value.maxOrder;
						replenishItem.reordertrigger 	= 	value.reorder;
					});
				}
			});
        }
        else{
        	$scope.ShowReplenishment 	=	false;
        }

		$scope.dosrchproduct(values,function(selSkuData){
			$scope.prData 	= 	{};
			$scope.prData	=	selSkuData;
		});

		var prcode 	= 	values;
		var locid 	=	$scope.ship.locationId;
		

			Data.get('/inventories?locationid='+encodeURIComponent(locid)+'&sku='+prcode).then(function (results) {
		            var item = {};
		            if((results !='') &&(results != undefined)){
						item = results[0];
					}
					item['maximumorder'] 	=	replenishItem.maximumorder;
					item['reordertrigger'] 	=	replenishItem.reordertrigger;
					var priceBalancFields = {};
				ovcDash.get('apis/ang_getproductprice?loc='+locid+'&sku='+prcode).then(function (margindata) {
				 	$scope.list 	=	[];

					if ((margindata != undefined) && (margindata != '')){
						angular.forEach(margindata,function(value){
							priceBalancFields[value.ProductPrice.priceType] = value.ProductPrice.Cost;
							priceBalancFields['storeprice'] 	=	value.ProductPrice.storePrice;

							//priceBalancFields[value.priceType] = value.Cost;
						});
					}
                     
					var newproducts=[];
					var newitem={};
					newitem.SKU=prcode;
					$scope.popup.sku 	=	prcode;
					// newitem.Names=prname;

					angular.forEach($scope.balancefields4,function(bdata) {

						newitem[bdata.Name] = (typeof priceBalancFields[bdata.priceType] === 'undefined') ? 0 : $scope.currency +' '+ parseFloat(priceBalancFields[bdata.priceType]).toFixed(2);
						if(bdata.label == 'margin'){
							var retailPrice = (typeof priceBalancFields[2] === 'undefined')? 0 : parseFloat(priceBalancFields[2]);
							var purchasePrice = (typeof priceBalancFields[1] === 'undefined')? 0 : parseFloat(priceBalancFields[1]);
							if(bdata.marginFormat == 'currency'){
								newitem[bdata.Name] =  $scope.currency +' '+ eval(bdata.currencyCalculation).toFixed(2);
							}else{
								var marginValue =  eval(bdata.percentageCalculation).toFixed(2);
								if((retailPrice	!=	0) ){
									newitem[bdata.Name] =	marginValue	+	 ' %';
								}else{
									newitem[bdata.Name] =	0	+	 ' %';
								}
								
							}

						}
						if(bdata.label == 'storeprice'){
							newitem[bdata.Name] =	(typeof priceBalancFields[bdata.label] === 'undefined')? 0: $scope.currency +' '+ parseFloat(priceBalancFields[bdata.label]).toFixed(2);
						}
					});


					angular.forEach($scope.balancefields2,function(bdata) {
							if(bdata.label == 'wac'){
							newitem[bdata.Name]=(typeof item[bdata.label] === 'undefined') ? 0 :  $scope.currency +' '+ parseFloat( item[bdata.label]).toFixed(2);
							}else{
							newitem[bdata.Name]=(typeof item[bdata.label] === 'undefined') ? 0 : item[bdata.label];
							}
					});
					angular.forEach($scope.balancefields1,function(bdata) {
							newitem[bdata.Name]=(typeof item[bdata.label] === 'undefined') ? 0 : item[bdata.label];
					});
					angular.forEach($scope.balancefields3,function(bdata) {
							newitem[bdata.Name]=(typeof item[bdata.label] === 'undefined') ? 0 : item[bdata.label];
					});
					angular.forEach($scope.balancefields5, function(bdata){
									newitem[bdata.Name] 	=	item[bdata.label];
					});
					
                    // $scope.listPROD.push(newitem);
                    $scope.list.push(newitem);
                    // $.LoadingOverlay("hide");
                    if($scope.list && $scope.list.length > 0){
                    	$rootScope.showExportFunction 	=	true;
                    }
				 	var inventoryDetailsdata = {};
				 	inventoryDetailsdata[prcode] = {};
				 	
				 	if (item.hasOwnProperty('storevalue')) {
				 		
				 		inventoryDetailsdata[item.sku] = {};
				 		var Obj = item['storevalue'];
						var noofstores=item['storevalue'].length;
						if(noofstores >1){
							$scope.showhover=true;
							
						}else{
							$scope.showhover=false;
							
						}
					 	for (var key in Obj) {
					 		var rq_data = Obj[key];
					 		for(var rq_key in rq_data){
					 			if(rq_key != 'locationid'){

					 				if(!(rq_key in inventoryDetailsdata[item.sku])){
					 					inventoryDetailsdata[item.sku][rq_key] = {};
					 				}
					 				inventoryDetailsdata[item.sku][rq_key][rq_data.locationdisplayName] = rq_data[rq_key];
					 			}
					 			
					 		}
					 	}
				 	}
				 	if (item.hasOwnProperty('storestockvalue')) {
						try {
							var noofstores=item['storestockvalue'].length;
							if(noofstores >0 && $scope.config.config_arr.displayStockingLocationsWidget.featureValue){
								$scope.showStockingLocationsWidget=true;
								$scope.stockingLocationsData=item['storestockvalue'];
							}
						} catch (e) {
						console.log(e);
						}
				 	}
					$scope.inventoryDetails = [];
					$scope.inventoryDetails.push(inventoryDetailsdata);
				});
				ovcDash.post('apis/ang_get_skudescription',{data:{srch:prcode}}).then(function (Data) {
					angular.forEach(Data, function(Skuimage){
						if(Skuimage.ProductTbl != undefined && Skuimage.ProductTbl != '')
						$scope.imageURl 	=	Skuimage.ProductTbl.imageURL;

					});
				});
			});
			$scope.transactions = [];
			$scope.ship = {locationId: $scope.ship.locationId, transactionTypeId: $scope.ship.transactionTypeId, result:'',styleresult:$scope.ship.styleresult};

			$scope.prod_result = "";
			
			$scope.allvalues = [];
			

			
			// $timeout(function () { $scope.fillTableElements($scope.listPROD); }, 500);	
  	};
  	Utils.userLocation(1).then(function(results){
  		var currencylabel  =   $scope.translation.currencylist[0];
    	var currencylist   =   [];
  		$scope.store_datas     =   [];
        if(!results.status){
        	angular.forEach(results, function(value){
            	$scope.store_datas.push(value.id);
            	 currencylist[value.id]    =   value.currency;
        	})
        	$scope.currency = currencylabel[currencylist[$scope.ship.locationId]];
        }
        if(skuconfiguration == 'STYLE'){
			 $timeout(function() {
		    	angular.element('.'+$scope.indexData+'style')
						.html($compile('<style-matrix></style-matrix>')($scope));
		    }, 10);
		}
		if(skuconfiguration == 'SKU'){
			$scope.addShipments($scope.shipData);	
		}
	}, function(error){
		console.log('')
	});
	var balanceComapare 	=	{
		"OH":"viewOnHand",
		"ALLOC":"viewAllocated",
		"RESER":"viewReserved",
		"HEL":"viewHeld",
		"RTV":"viewReturnToVendor",
		"ATS":"viewAts",
		"ATP":"viewAtp",
		"WAC":"viewWac",
		"ORDER":"viewOpenOnOrderIn",
		"UNCONFOR":"viewUnconfirmedIn",
		"CONFOR":"viewConfirmedIn",
		"REJ":"viewRejectedIn",   			
		"ASN":"viewAsnIn",
		"TRANS":"viewInTransitIn",
		"OPEN":"viewOpenOnOrderOut",
		"UNCONFO":"viewUnconfirmedOut",
		"CON":"viewConfirmedOut",
		"REJO":"viewRejectedOut",
		"ASNIN":"viewAsnOut",
		"TRANSIT":"viewInTransitOut"
	};
	function loadBalanceType (){
		/****from configuration******/
		var price_con	=	PRICELIST;
		var reple_con 	=	REPLENISHMENTRULE;
		var trule_con 	=	RULEDEFN;
		var drule_con 	=	DOCUMENTRULE;
		var tlab_bal  	= 	$scope.ovcLabel.balanceInquiry.balanceType||{};
		var bal_info 	= 	$scope.ovcLabel.balanceInquiry.balanceInfo||{};
			var balance1=[];var balance2=[];var balance3=[]; var balance31=[]; var balance32=[]; var balance4	=	[]; var balance5 	=	[];
			var balance1id=[];var balance2id=[];var balance3id=[];
			var trlist=[];
			var trdata={};
			var trinobj=[];
			angular.forEach(trule_con,function(trules,key) {
				angular.forEach(trules,function(trules2,key2) {
					angular.forEach(trules2,function(item) {
						if(lookupRole[balanceComapare[item.Name]]){
							item.title=tlab_bal[item.Name];
							item.info = bal_info[item.Name];
							item.parent2='slpall';
							if((key2=='BALFIELDS') || (key2== 'HELDSTOCK')){
							item.selected=true;
							item.parent1='slpbalance';
						 	balance1.push(item);
							balance1id.push(item.id);
							}
							if((key2=='CALCFIELDS')){
							item.selected=false;
							item.parent1='slpcalc';
						 	balance2.push(item);
							balance2id.push(item.id);
							}
						}
					});
				});
				
			});
			if(Object.keys(balance1).length == 0){
				$scope.balance1 			=	true;
				$scope.refineBalanceFields 	=	true;
			}
			if(Object.keys(balance2).length == 0){
				$scope.balance2 			=	true;
				$scope.refinecalcFields 	=	true;
			}
			$scope.balancefields1=balance1;
			$scope.balancefields2=balance2;
			$scope.balanceids1=balance1id;
			$scope.balanceids2=balance2id;

			angular.forEach(drule_con,function(drules,key) {
				angular.forEach(drules,function(drules2,key2) {
					angular.forEach(drules2,function(item) {
						if(lookupRole[balanceComapare[item.Name]]){
							item.title=tlab_bal[item.Name];
							item.info = bal_info[item.Name];
							item.parent1='slpdocs';
							item.parent2='slpall';
							item.selected=false;
							 if((key2=='GOODSIN')){
							balance31.push(item);
							}
							if((key2=='GOODSOUT')){
							
						 	balance32.push(item);
							} 
						 	balance3.push(item);
							balance3id.push(item.id);
						}
					});
				});
				
			});
			if(Object.keys(balance3).length == 0){
				$scope.balance3 			=	true;
				$scope.refineDirBalFields 	=	true;
			}
			$scope.balancefields31=balance31;
			$scope.balancefields32=balance32;
			$scope.balancefields3=balance3;
			$scope.balanceids3=balance3id;

			angular.forEach(price_con,function(item) {
				item.title =	tlab_bal[item.Name];
				item.selected =	false;
				item.parent1='slpprice';
				item.parent2='slpall';
				balance4.push(item);
			});
				$scope.balancefields4	=	balance4;
			angular.forEach(reple_con, function(item){
				item.title 	=	tlab_bal[item.Name];
				item.selected =	false;
				item.parent1='slpreple';
				item.parent2='slpall';
				if(item.id == 'maxorder'){
					if($scope.config && !$scope.config.showmaxAmount){
						balance5.push(item);
					}
				}
				else{
					balance5.push(item);
				}
			});
			
			$scope.balancefields5 	=	balance5;
	}
	
	$scope.typeddata='';
	$scope.refineselected=false;
	//$scope.listPROD = [];
	$scope.inventoryDetailsdata = {};
	$scope.inventoryDetails = [];


  
  	$scope.getselectedsku=function(skuval,skuAppend){
  		var skuobject = {};
  		skuobject.sku = skuval;
  		var skudata = JSON.stringify(skuobject);
   		sessionStorage.lookupsku = skudata;

  		//sessionStorage
  		//For loading Circle
         // $.LoadingOverlay("show"); 

		// $scope.listPROD = [];
		$scope.RpllLocSku 	= 	{};
		var locid 	=	$scope.ship.locationId;
		var selsku 	= 	skuval;
		// var prnames = 	$scope.ship.styleresult.split('~');
		var prname 	= 	skuval;
		$scope.RpllLocSku.locationId 	=	$scope.ship.locationId;
		$scope.RpllLocSku.sku 	=	skuval;
		var replenishItem 	=	{};   
		if(!skuAppend){
			$scope.list 	=	[];
		}    

        if($scope.store_datas.indexOf($scope.ship.locationId) > -1){
        	$scope.ShowReplenishment 	=	true;
            Data.get('/getReplenishmentRulesSku?srchData='+JSON.stringify($scope.RpllLocSku)).then(function (resultsData) {
				if(resultsData){
					angular.forEach(resultsData, function(value, key){
						replenishItem.maximumorder 	=	value.maxOrder;
						replenishItem.reordertrigger 	= 	value.reorder;
					});
				}
			});
        }
        else{
        	$scope.ShowReplenishment 	=	false;
        }
        

		if((skuval != '') && (skuval != undefined)){

			$scope.dosrchproduct(selsku,function(selSkuData){
				$scope.prData 	= 	{};
				$scope.prData	=	selSkuData;
			});


				Data.get('/inventories?locationid='+encodeURIComponent(locid)+'&sku='+selsku).then(function (results) {
					
	                $scope.popup.sku 	=	selsku;
					var item = [];
					if((results !='') &&(results != undefined) && (results.length > 0)){
						item = results[0];
						item['maximumorder'] 	=	replenishItem.maximumorder;
						item['reordertrigger'] 	=	replenishItem.reordertrigger;
					}
					var tempCurrency 	=	$scope.currency || '';
					if(results && results.length > 0){
						var newproducts=[];
						results[0]['maximumorder'] 		= replenishItem.maximumorder;
						results[0]['reordertrigger'] 	= replenishItem.reordertrigger;	
						angular.forEach(results,function(item) {
								var priceBalancFields = {};
							ovcDash.get('apis/ang_getproductprice?loc=' + encodeURIComponent(locid) + '&sku=' + item.sku).then(function(productresults) {
								if ((productresults != undefined) && (productresults != '')){
									angular.forEach(productresults, function(value) {
										priceBalancFields[value.ProductPrice.priceType] = value.ProductPrice.Cost;
										priceBalancFields['storeprice'] 	=	value.ProductPrice.storePrice;
										//priceBalancFields[value.priceType] = value.Cost;
									});
								}
	                            ovcDash.get('apis/ang_loc_products?srch=' + item.sku + '&locid=' + encodeURIComponent(locid)).then(function(data) {
									if(skuAppend){
										$scope.list 	=	[];
									}
	                             	
	                                if ((data.status != 'error') && (data != '') && (data[0].ProductTbl != '')) {
	                                    var prname1 = data[0].ProductTbl.name;
	                                } else {
	                                    var prname1 = prname;
	                                }
	                                var skudet = item.sku;
	                                var newitem = {};
	                                newitem.SKU = skudet;
	                                newitem.Names = prname1;

									angular.forEach($scope.balancefields4,function(bdata) {
										if(bdata.label == 'purchaseprice'){
	                                    	newitem[bdata.Name] = priceBalancFields[3] ? tempCurrency + ' ' + parseFloat(priceBalancFields[3]).toFixed(2) : priceBalancFields[1] ? tempCurrency + ' ' + parseFloat(priceBalancFields[1]).toFixed(2) : parseFloat(0).toFixed(2);
	                                	}else{
	                                    	newitem[bdata.Name] = (typeof priceBalancFields[bdata.priceType] === 'undefined') ? 0 : tempCurrency + ' ' + parseFloat(priceBalancFields[bdata.priceType]).toFixed(2);
	                                	}
										if(bdata.label == 'margin'){
											var retailPrice = (typeof priceBalancFields[2] === 'undefined')? 0 : parseFloat(priceBalancFields[2]);
											var purchasePrice = (typeof priceBalancFields[1] === 'undefined')? 0 : parseFloat(priceBalancFields[1]);
											
											if(bdata.marginFormat == 'currency'){
												newitem[bdata.Name] =  tempCurrency +' '+ eval(bdata.currencyCalculation).toFixed(2);
											}else{
												var marginValue =  eval(bdata.percentageCalculation).toFixed(2);
												if((retailPrice	!=	0) ){
													newitem[bdata.Name] =	marginValue	+	 ' %';
												}else{
													newitem[bdata.Name] =	0	+	 ' %';
												}	
											}
										}
										if(bdata.label == 'storeprice'){
											newitem[bdata.Name] =	(typeof priceBalancFields[bdata.label] === 'undefined')? 0: tempCurrency +' '+ parseFloat(priceBalancFields[bdata.label]).toFixed(2);
										}
									});
	                                angular.forEach($scope.balancefields1, function(bdata) {
	                                    if (bdata.label == 'wac') {
	                                        newitem[bdata.Name] = (typeof item[bdata.label] === 'undefined') ? 0 : parseFloat(item[bdata.label]).toFixed(2);
	                                    } else {
	                                        newitem[bdata.Name] = (typeof item[bdata.label] === 'undefined') ? 0 : item[bdata.label];
	                                    }
	                                });
	                                angular.forEach($scope.balancefields2, function(bdata) {
	                                    if (bdata.label == 'wac') {
	                                	newitem[bdata.Name]=(typeof item[bdata.label] === 'undefined') ? $ :  $scope.currency +' '+ parseFloat( item[bdata.label]).toFixed(2);
	                                	}else{
	                                    newitem[bdata.Name] = (typeof item[bdata.label] === 'undefined') ? 0 : item[bdata.label];
	                                	}
	                                });
	                                angular.forEach($scope.balancefields3, function(bdata) {
	                                    newitem[bdata.Name] = (typeof item[bdata.label] === 'undefined') ? 0 : item[bdata.label];
	                                });
									angular.forEach($scope.balancefields5, function(bdata){
										newitem[bdata.Name] 	=	item[bdata.label];
									});
	                                // $scope.listPROD.push(newitem);
	                                $scope.list.push(newitem);

	                             	// $.LoadingOverlay("hide");
	                            }, function(error){
	                            	console.log(error);
									// $.LoadingOverlay("hide");
	                            });
	                        }, function(error){
	                        	console.log(error);
								// $.LoadingOverlay("hide");
	                        });
						});
					}else{
					item['maximumorder'] 	=	replenishItem.maximumorder;
					item['reordertrigger'] 	=	replenishItem.reordertrigger;

                    var allskus = selsku.split(',');
                    angular.forEach(allskus, function(skudata) {
                        ovcDash.get('apis/ang_loc_products?srch=' + skudata + '&locid=' + locid).then(function(data) {
                            if ((data.status != 'error') && (data != '') && (data[0].ProductTbl != '')) {
                                var prname1 = data[0].ProductTbl.name;
                            } else {
                                var prname1 = prname;
                            }
                            var priceBalancFields = {};
                            var newitem = {};
                            newitem.SKU = skudata;
                            newitem.Names = prname1;
                            //newitem.Names=prname;
                            ovcDash.get('apis/ang_getproductprice?loc=' + locid + '&sku=' + skudata).then(function(productresults) {
								if(skuAppend){
									$scope.list 	=	[];
								}
								
								if ((productresults != undefined) && (productresults != '')){
									angular.forEach(productresults, function(value) {
										priceBalancFields[value.ProductPrice.priceType] = value.ProductPrice.Cost;
										priceBalancFields['storeprice'] 	=	value.ProductPrice.storePrice;
										//priceBalancFields[value.priceType] = value.Cost;
									});
								}
								
                                angular.forEach($scope.balancefields4, function(bdata) {
                                	if(bdata.label == 'purchaseprice'){
                                    	newitem[bdata.Name] = priceBalancFields[3] ? tempCurrency + ' ' + parseFloat(priceBalancFields[3]).toFixed(2) : priceBalancFields[1] ? tempCurrency + ' ' + parseFloat(priceBalancFields[1]).toFixed(2) : parseFloat(0).toFixed(2);
                                	}else{
                                    	newitem[bdata.Name] = (typeof priceBalancFields[bdata.priceType] === 'undefined') ? 0 : tempCurrency + ' ' + parseFloat(priceBalancFields[bdata.priceType]).toFixed(2);
                                	}
                                    if (bdata.label == 'margin') {
                                        var retailPrice = (typeof priceBalancFields[2] === 'undefined') ? 0 : parseFloat(priceBalancFields[2]);
                                        var purchasePrice = (typeof priceBalancFields[1] === 'undefined') ? 0 : parseFloat(priceBalancFields[1]);
										
                                        if (bdata.marginFormat == 'currency') {
                                            newitem[bdata.Name] = tempCurrency + ' ' + eval(bdata.currencyCalculation).toFixed(2);
                                        } else {
                                            var marginValue = eval(bdata.percentageCalculation).toFixed(2);
                                            if ((retailPrice != 0)) {
                                                newitem[bdata.Name] = marginValue + ' %';
                                            } else {
                                                newitem[bdata.Name] = 0 + ' %';
                                            }
                                        }
                                    }
                                    if(bdata.label == 'storeprice'){
										newitem[bdata.Name] =	(typeof priceBalancFields[bdata.label] === 'undefined')? 0: tempCurrency +' '+ parseFloat(priceBalancFields[bdata.label]).toFixed(2);
									}
                                });
                                angular.forEach($scope.balancefields1, function(bdata) {
                                    if (bdata.label == 'wac') {
                                        newitem[bdata.Name] = (typeof item[bdata.label] === 'undefined') ? 0 : parseFloat(item[bdata.label]).toFixed(2);
                                    } else {
                                        newitem[bdata.Name] = (typeof item[bdata.label] === 'undefined') ? 0 : item[bdata.label];
                                    }
                                });
                                angular.forEach($scope.balancefields2, function(bdata) {
                                    newitem[bdata.Name] = (typeof item[bdata.label] === 'undefined') ? 0 : item[bdata.label];
                                });
                                angular.forEach($scope.balancefields3, function(bdata) {
                                    newitem[bdata.Name] = (typeof item[bdata.label] === 'undefined') ? 0 : item[bdata.label];
                                });
								angular.forEach($scope.balancefields5, function(bdata){
									newitem[bdata.Name] 	=	item[bdata.label];
								});
                                // $scope.listPROD.push(newitem);
                                $scope.list.push(newitem);
                             	// $.LoadingOverlay("hide");
                            },function(error){
                            	console.log(error);
								// $.LoadingOverlay("hide");
                            });
                        },function(error){
                        	console.log(error);
							// $.LoadingOverlay("hide");
                        });
                    });
                    //$scope.listPROD.push(newitem);
					}

					var inventoryDetailsdata = {};
					inventoryDetailsdata[selsku] = {};

			 		if (item.hasOwnProperty('storevalue')) {
						 		
				 		inventoryDetailsdata[item.sku] = {};

				 		var Obj = item['storevalue'];
						var noofstores=item['storevalue'].length;
						if(noofstores >1){
							$scope.showhover=true;
						}else{
							$scope.showhover=false;
						}
					 	for (var key in Obj) {
					 		var rq_data = Obj[key];
					 		for(var rq_key in rq_data){
					 			if(rq_key != 'locationid'){

					 				if(!(rq_key in inventoryDetailsdata[item.sku])){
					 					inventoryDetailsdata[item.sku][rq_key] = {};
					 				}
					 				inventoryDetailsdata[item.sku][rq_key][rq_data.locationdisplayName] = rq_data[rq_key];
					 			}
					 			
					 		}
					 	}
				 	}
				 	if (item.hasOwnProperty('storestockvalue')) {
						try {
							var noofstores=item['storestockvalue'].length;
							if(noofstores >0 && $scope.config.config_arr.displayStockingLocationsWidget.featureValue){
								$scope.showStockingLocationsWidget=true;
								$scope.stockingLocationsData=item['storestockvalue'];
							}
						} catch (e) {
						console.log(e);
						}
				 	}
					$scope.inventoryDetails = [];
					$scope.inventoryDetails.push(inventoryDetailsdata);
				},function(error){
					console.log(error);
					// $.LoadingOverlay("hide");
				});
			//$scope.ship.styleresult='';
			$scope.transactionstyles	=	[];
			$scope.allvalues2=[];
			// $timeout(function () { $scope.fillTableElements($scope.listPROD); }, 500);	
			
			//$scope.transactionstyles='';
		}else{
			// $.LoadingOverlay("hide");
		}
    };

    //For not styleSizeColor Property (Function is Call From the Tables controller)//
  	$scope.getmodifiedsku 	=	function (skuObj){

  		function showError(){
  			var output = {"status": "error","message": "No Sku's Available ."};
            Data.toast(output);
  		}
	  	if(skuObj){
	  		var sku = Object.keys(skuObj);
	  		if(sku.length > 0){
	  			$scope.getselectedsku(sku[0], true);
	  		}else{
	  			showError();
	  			// $.LoadingOverlay("hide");
	  		}
	  	}else{
	  		showError();
	  		// $.LoadingOverlay("hide");
	  	}
  	};

	function childrenData(){
		ovcDash.get('apis/ang_children_location?locationId='+$scope.ship.locationId).then(function (results){
			if(results && results.location){
	            var resultData  	= 	results.location;
	            var childlocations 	= 	[];
	            angular.forEach(resultData, function(locationname){
	              childlocations.push(locationname.id);
	              childstore[locationname.name] 	=	0;
	             });
	            $scope.popup.locations = childlocations;
	        }
				sessionStorage.inventdata 	= JSON.stringify(childstore);
		});
	}	
	childrenData();	
  	$scope.SelectedInventory = '';
  	$scope.hoverIn = function(sku,val,productIndex) {

		$scope.SelectedInventory = val+productIndex;
		$scope.inventoryData1 = {};
		if ($scope.inventoryDetails[0][sku][val]) {
			$scope.inventoryData1 = $scope.inventoryDetails[0][sku][val];
   			sessionStorage.inventdata 	= JSON.stringify($scope.inventoryData1);

			//return $scope.inventoryDetails[0][sku][val];
		}
		else{
			$scope.showhover=true;
			if(sessionStorage.inventdata){
				$scope.inventoryData1	 =	JSON.parse(sessionStorage.inventdata);
				angular.forEach($scope.inventoryData1,function(item,key) {
					$scope.inventoryData1[key] = 0;
				});
			}
		}
		$scope.invavaillength = Object.keys($scope.inventoryData1).length;	
	};

	$scope.hoverOut = function() {	
		$scope.SelectedInventory = '';		                
	};						            
  
  
	$scope.fillTableElements = function (data) {
		// $scope.list 	=	[];
		// $scope.loadval = 0;
		

		// $scope.currentPages = 1; //current page
		// $scope.entryLimits = 10; //max no of items to display in a page
		// $scope.filteredItems = $scope.list.length; //Initially for no filter
		$timeout(function() { $scope.doneclick(); }, 1200);
	};
  
  	$scope.doneclick = function () {
  		
  		var elem = document.querySelector('table');
		for(i=0;i< $scope.selection.length;i++){
			var myEl1 = angular.element( document.querySelectorAll( '.'+$scope.selection[i] ) );
			myEl1.removeClass('ng-hide');
		}
		
		for(i=0;i< $scope.unselection.length;i++){
			var myEl = angular.element( document.querySelectorAll( '.'+$scope.unselection[i] ) );
			myEl.addClass('ng-hide');	
		}

  	};
  /* delete tr from table after adding products */
	$scope.removeRow = function (idx) {
		if(idx != -1) {
			$scope.list.splice(idx, 1);
		}
	};
  
	$scope.selection=[];
	$scope.unselection=[];
	
	
	
	$scope.refinechange=function(Data){
	 	
		var myEl = angular.element( document.querySelector( '#balance_pop-'+Data ) );
		myEl.addClass('open');
	 
	};
	$scope.refineopen=function(Data){		
		var myEl = angular.element( document.querySelector( '#balance_pop-'+Data) );
		//myEl.removeClass('open'); 
		myEl.toggleClass('open');
	};	
	$scope.refinecancel=function(Data){		
		
		$timeout(function() {
				angular.element('#cancel_btn-'+Data).trigger('click');
			}, 1);
	};	
	var count 	=	{};
	
	$scope.refineremove=function(Data){
		var elem = document.querySelector('#table'+Data);
		count.balance1 	=	0;
		count.balance2 	=	0;
		count.balance3 	=	0;
		count.balance4 	=	0;
		count.balance5 	=	0;
		/**BalanceFieldHeader Hide**/
		angular.forEach($scope.balancefields1, function(value){
			if(value.selected 	==	false){
				count.balance1++;
			}
		});
		if($scope.balancefields1.length == count.balance1){
			$scope.balance1 	=	true;
		}
		else{
			$scope.balance1 	=	false;
		}

		/**CalculateFieldHeader Hide**/
		angular.forEach($scope.balancefields2, function(value){
			if(value.selected 	==	false){
				count.balance2++;
			}
		});
		if($scope.balancefields2.length == count.balance2){
			$scope.balance2 	=	true;
		}
		else{
			$scope.balance2 	=	false;
		}

		/**DirectiveBalanceFieldHeader Hide**/
		angular.forEach($scope.balancefields3, function(value){
			if(value.selected 	==	false){
				count.balance3++;
			}
		});
		if($scope.balancefields3.length == count.balance3){
			$scope.balance3 	=	true;
		}
		else{
			$scope.balance3 	=	false;
		}

		/**PriceFieldHeader Hide**/
		angular.forEach($scope.balancefields4, function(value){
			if(value.selected 	==	false){
				count.balance4++;
			}
		});
		if($scope.balancefields4.length == count.balance4){
			$scope.balance4 	=	true;
		}
		else{
			$scope.balance4 	=	false;
		}
		
		/**ReplenishmentFieldHeader Hide**/
		angular.forEach($scope.balancefields5, function(value){
			if(value.selected 	==	false){
				count.balance5++;
			}
		});
		if($scope.balancefields5.length == count.balance5){
			$scope.balance5 	=	true;
		}
		else{
			$scope.balance5 	=	false;
		}
		
		for(i=0;i< $scope.selection.length;i++){
			var myEl1 = angular.element( document.querySelectorAll( '.'+$scope.selection[i] ) );
			myEl1.removeClass('ng-hide');
			myEl1.removeClass('hideExport'); //For hide the Data in Excel
			
		}
		
		for(i=0;i< $scope.unselection.length;i++){
			var myEl = angular.element( document.querySelectorAll( '.'+$scope.unselection[i] ) );
			myEl.addClass('ng-hide');	
			myEl.addClass('hideExport');
		}
		
		$scope.refinecancel(Data);
	};
	$scope.closerefine 	=	function(index){
		var myEl = angular.element( document.querySelector( '#balance_pop-'+index) );
		myEl.removeClass('open');
	}
	 
	$scope.toggleSelection = function(employeeName) {
		
		var idx = $scope.selection.indexOf(employeeName.id);
		var idxun = $scope.unselection.indexOf(employeeName.id);
		
		if(employeeName.selected	==	false){
			
			if($scope.unselection.indexOf(employeeName.id) == -1) {
			   $scope.unselection.push(employeeName.id);
			}
			$scope.selection.splice(idx, 1);
		}else{
			
			if($scope.selection.indexOf(employeeName.id) == -1) {
			   $scope.selection.push(employeeName.id);
			}
			$scope.unselection.splice(idxun, 1);
		}
		
		var bal1chk	=	true;
		angular.forEach($scope.balancefields1, function (value,key) {
			if( ! value.selected)
			{
				bal1chk	=	false;
			}
		});
		
		$scope.action.bal1checked = bal1chk;
		
		var bal2chk	=	true;
		angular.forEach($scope.balancefields2, function (value,key) {
			if( ! value.selected)
			{
				bal2chk	=	false;		  
			}
		});
		
		$scope.action.bal2checked = bal2chk;
		var bal3chk	=	true;
		angular.forEach($scope.balancefields3, function (value,key) {
			if( ! value.selected)
			{
				bal3chk	=	false;
			}
		});
		
		$scope.action.bal3checked = bal3chk;

		var bal4chk	=	true;
		angular.forEach($scope.balancefields4, function (value,key) {
			if( ! value.selected)
			{
				bal4chk	=	false;
			}
		});
		
		$scope.action.bal4checked = bal4chk;

		var bal5chk 	=	true;
		angular.forEach($scope.balancefields5, function(value,key){
			if( ! value.selected)
			{
				bal5chk	=	false;
			}
		});
		$scope.action.bal5checked = bal5chk;

	};
   
	$scope.selectAll = function(obj, objects){   
		obj	=	! obj;
		
		angular.forEach(objects, function (item) {
		   item.selected = ! obj;
			
			var idxs = $scope.selection.indexOf(item.id);
			var idxuns = $scope.unselection.indexOf(item.id);
			
			if(!item.selected){
				if($scope.unselection.indexOf(item.id) == -1) {
				   $scope.unselection.push(item.id);
				}
				$scope.selection.splice(idxs, 1);
			}else{
				if($scope.selection.indexOf(item.id) == -1) {
				   $scope.selection.push(item.id);
				}
				$scope.unselection.splice(idxuns, 1);
			}
        });
   };

    $scope.stckFind	= function(prodata, listdata, lookUpAction){
	   	sessionStorage.prodata 	= JSON.stringify(prodata);
	   	sessionStorage.listdata 	= JSON.stringify(listdata);
	   	var locationdata = {id:$scope.ship.locationId,
	   							name: $scope.action.alllocations[$scope.ship.locationId]};
	   	sessionStorage.location=JSON.stringify(locationdata);
	   	lookUpAction ? sessionStorage.lookUpAction	=	lookUpAction : '';

   };
   // Action Button//
   $scope.actionopen = function(item,ListData){
   		
	  	sessionStorage.locationname 	= 	$attrs.locationid;
	 	sessionStorage.skuid 			= 	ListData[0].SKU;
	 	
	  	if(item == "Find It"){	
		  $scope.stckFind($scope.prData,$scope.list,"FindIt");
		  $state.go('ovc.stocklookup-findit');
	  	}

		if (item == "Adjust") {
			$scope.stckFind($scope.prData,$scope.list);
	  		$state.go('ovc.adjustment-add');
		}

		if(item == "See Performance"){
			$scope.stckFind($scope.prData,$scope.list);
		  	$state.go('ovc.product-perform');
		};
	};
});