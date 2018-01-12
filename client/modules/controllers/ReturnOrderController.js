var app = angular.module('OVCstockApp', ['returnReceipt','skuMatrix', 'ovcdataExport', 'ovcdataExport']);

/*****Add Returns****/
app.controller('addReturnOrder', function($scope, $state, $http, $stateParams, $rootScope, $window, $cookieStore, $timeout, CARRIERCODES, system_currencies,
system_settings, STATES, Data, ovcDash, RETURNTYPELIST, $filter, $compile,$location,$anchorScroll,  ReturnReceiptService, ovcdataExportFactory, OVC_CONFIG , Utils) {
	
	$scope.action	=	{};

	$scope.action.page 	=	1;
	$scope.action.type	=	'return';
    $scope.action.labelMode     =   "returnReceipt";
    
	var creturnid = sessionStorage.creturnid;
	//$scope.action.data={};		
	$scope.action.formerror={};
	$scope.action.formerrormsg={};
	$scope.title = 'Add';
	$scope.action.title='add';
	$scope.titleadd = true;
	$scope.titleedit = false;
    $scope.action.status=true;
	var user_detail = $rootScope.globals['currentUser'];
	var user_id = user_detail['username'];
	var fname = $rootScope.globals.currentUser.firstname;
	var lname = $rootScope.globals.currentUser.lastname;
	var username = fname + ' ' + lname;
    var returnConfigs   =   {};
	
	var stateParamId = 0;
    $scope.action.disabled = 0;
	if ($stateParams.returnid != undefined) {
		stateParamId = $stateParams.returnid;
		$scope.return_id = $stateParams.returnid;
		$scope.title = 'Edit';
		$scope.titleadd = false;
		$scope.titleedit = true;
		$scope.action.title='edit';
	}
	if(creturnid != '' && creturnid !=undefined){
		$scope.title = 'Copy';
		$scope.action.title='copy';
	}
	else{
		
		$scope.action.data={};
	}// getRoleConfig by Ratheesh (15.7.2016).
    Utils.configurations().then(function(configData){
        $scope.roleConfig  =   {};
        $scope.roleConfig.CollectRMANumberUponReturn  =   configData['config_arr']['CollectRMANumberUponReturn']?configData['config_arr']['CollectRMANumberUponReturn']['featureValue']:'';
        $scope.roleConfig.CollectPOInformationUponReturn  =   configData['config_arr']['CollectPOInformationUponReturn']?configData['config_arr']['CollectPOInformationUponReturn']['featureValue']:'';
        returnConfigs.returnExportStatuses  =   !configData['config_arr']['returnExportStatuses'] ? []:
                                                    configData['config_arr']['returnExportStatuses']['featureValue'] ? configData['config_arr']['returnExportStatuses']['featureValue']: 
                                                    [];
    });

    //common function for publishing Return data to JMS queue
    var jmsPublishSevice    =   function(returnExportObj) {

        // var returnExportData    =   [];

        if (returnExportObj) {

            // returnExportData.push(returnExportObj);

            returnExportObj   =   JSON.stringify(returnExportObj);

            Data.post('/jmspublish/'+OVC_CONFIG.JMS_QUEUE_RETURN_EXPORT,{

                data: {
                        data:returnExportObj
                }

            }).then(
                function (data) {
                    if (data){
                        if (data.error) {
                            console.log("Failed to Publish Return Data");
                        }
                        else {
                            console.log("Sucessfully Published Return Data.\n",returnExportObj);
                        }
                    }
                },
                function (error) {
                    console.log("Failed to Publish Return Data");
                }
            );

        }

    }

	$scope.getreturnlist=function(){
		
		$state.go('ovc.returns-list');
	}
    var currencylabel  =   $scope.translation.currencylist[0];
    var currencylist   =   [];

    var id_user = $rootScope.globals['currentUser']['username'];
    $scope.currencyfunc=function(callback){
        ovcDash.get('apis/ang_userlocations?usid=' + id_user+'&isStore=0').then(function(resultsloc) {
            angular.forEach(resultsloc, function(item) {
                currencylist[item.id]    =   item.currency;
            });
        callback(currencylist);
        });
        
    }
	$scope.validatereturn=function(data){
		$scope.action.formerror       =   {};
		$scope.action.formerrormsg    =   {};
		var errorArray                =   [];
			if((data.rma_type == undefined ) || (data.rma_type == ''))
				errorArray.push({'id' : 'rma_type', 'message' : 'Please select RMA Type'});
			
			if((data.vendorId == '') || (data.vendorId == undefined))
				errorArray.push({'id' : 'vendorId', 'message' :'Please Select the Return To Vendor'});
			
			if((data.shipToLocation == '') || (data.shipToLocation == undefined))
				errorArray.push({'id' : 'shipToLocation', 'message' :'Please Select the Return From Store'});
			
            if(!data.reasoncode) {
                errorArray.push({'id' : 'reasoncode', 'message' :'Return reason code is required'});
            }
            
			if((data.packageData.length == 0 ))
				errorArray.push({'id' : 'skuData', 'message' :'Please add atleast one Package with SKU'});
            
			if(data.packageData && data.packageData[0]){
                if((data.packageData[0].skus == undefined ) || (data.packageData[0].skus == 0 ))
                    errorArray.push({'id' : 'skuData', 'message' :'Please add atleast one SKU'});
            }else{
                errorArray.push({'id' : 'skuData', 'message' :'Please add atleast one SKU'});
            }
		
            if(errorArray.length > 0){
                angular.forEach(errorArray,function(e){
                    $scope.action.formerror[e.id]=true;
                    $scope.action.formerrormsg[e.id]=e.message;
                });
                $scope.action.page  =   1;
                return false;
            }
		return true;
	}
	$scope.saveReturn = function(data, status, vendorData) {
        var findQty = $('.export_package_table tbody').find('.qtyZero');
        var qtyCheck = findQty.length;
        if(qtyCheck > 0){
            return false;
        }
        if (($scope.validatereturn(data)) && ($scope.action.disabled == 0)) {
            
        $scope.action.disabled++;
        $scope.VendorData   =   vendorData ? vendorData : {};
        newreturn = {
            purchaseOrderType: data.rma_type,
            shipToLocation: data.shipToLocation,
            vendorId: data.vendorId,
            purchaseOrderNumber: data.order_number,
            rmaNumber: data.rmaNumber,
            erpPurchaseOrder: data.erpOrderNumber,
            numberOfPackages: data.numberOfPackages,
            numberOfProducts: data.numberOfProducts,
            numberOfSKU: data.numberOfSKU,
            totalPoCost: data.totalPoCost,
            totalPoVAT: data.totalPoVAT,
            totalPoTax: data.totalPoTax,
            PoSubtotal: data.PoSubtotal,
            specialInstructions: data.specialInstructions,
            userId: data.created_by,
            createdBy: data.created_by,
            createdDate: data.createdDate,
            reasonCodeId:data.reasoncode,
            //orderStatus: 'draft'
            orderStatus: status,
            returnNum: data.returnNumber
        }
        var asnObj = data.packageData;
        var returnobj = {};
        var returnPackExp   =   [];
        returnobj.orderPackage = [];
        returnobj.location = newreturn.shipToLocation;
        var chksku=function(results){

            if(results.data){
                $scope.errorsaveReturn = {
                    sku: 0
                };
        	   angular.forEach(results.data, function(skusdata, sku) {
                    var skudata = JSON.parse(JSON.stringify(skusdata));
                    if (skudata.status == false) {
                        $scope.errorsaveReturn[sku] ? '' : $scope.errorsaveReturn[sku] = {};
                        ++$scope.errorsaveReturn.sku;
                        $scope.action.formerror[sku] = skudata.status;
                        $scope.action.formerrormsg[sku] = 'Return quantity exceeds current On Hand balance.\nCurrent OH balance : ' + skudata.oh + '';
                    }
               });
                if ($scope.errorsaveReturn.sku) {
                    var output = {
                        "status": "error",
                        "message": "Return quantity exceeds current On Hand balance for SKU."
                    };
                    Data.toast(output);
                    $scope.action.disabled = 0;
                }
            }
        };

        angular.forEach(data.packageData, function(item, pId) {
            var newObj = {};
            newObj.orderSKU = [];

            var packObjExp   =   {};
            packObjExp.returnItem    =   [];

            angular.forEach(item.productDetails, function(styleItem, styleId) {
                if (styleItem[0].skus !== undefined) {
                    angular.forEach(styleItem[0].skus, function(sItem, sId) {
                        var packageObj = {
                            SKU: sItem.sku,
                            lineNumber: parseInt(sItem.lineNumber),
                            //qtyStatus:sItem
                            qtyStatus: status,
                            qty: sItem.qty,
                            productName: sItem.name,
                            productDescription: sItem.description,
                            producUom: sItem.selectedUOM,
                            productCost: sItem.cost,
                            productTax: sItem.productTax,
                            productVat: sItem.productVat,
                            productCode: sItem.productCode,
                            //shipToLocation:sItem
                            isVat: sItem.taxisVAT,
                            totalProductCost: sItem.totalnotax,
                            totalProductTax: sItem.totalProductTax,
                            totalProductVat: sItem.totalProductVat,
                            variants: sItem.variants,
                            // waist: sItem.waist,
                            // length: sItem.length,
                            // size: sItem.size,
                            styleColor: sItem.styleColor
                        };
                        if($scope.action.title === 'edit' && status === 'draft'){
                            if(sItem.changed || packageObj.originalQty === undefined)
                            newObj.orderSKU.push(packageObj);
                        }else{
                            newObj.orderSKU.push(packageObj);
                        }

                        //Construct Export Return Item Data
                        var itmObjExp  =   {};
                        itmObjExp["lineNumber"]   =   parseInt(sItem.lineNumber),
                        itmObjExp["sku"]          =   sItem.sku,
                        itmObjExp["qty"]          =   sItem.qty

                        packObjExp.returnItem.push(itmObjExp);
                    });
                }
            });
            if (item.shipDate) {
                newObj.shipDate = $filter('dateFormChange')(item.shipDate);
                packObjExp.shipDate = moment(newObj.shipDate).format("YYYY-MM-DD");
            }
            newObj.packageId = item.packageId;
            newObj.trackingNumber = item.trackingNumber;
            returnobj.orderPackage.push(newObj);

            //Construct Export Return Package Data
            packObjExp.packageId    =   item.packageId;
            packObjExp.trackingNumber   =   item.trackingNumber;

            returnPackExp.push(packObjExp);

        });
        var saveReturnData = function() {
            /*****Save on Edit*****/
            if (stateParamId != 0) {
                if (data.deletedskudata != undefined) {
                    angular.forEach(data.deletedskudata, function(sku) {
                        Data.delete('/returnOrderSKU/' + sku).then(function(data) {});
                    });
                }
                if (data.deletedpackagedata != undefined) {
                    angular.forEach(data.deletedpackagedata, function(pkid) {
                        Data.delete('/deleteReturnPackage/' + pkid).then(function(data) {});
                    });
                }
                Data.post('/return/' + stateParamId, {
                    data: newreturn
                }).then(function(results) {
                    if (results.status === "success") {

                       //Construct Export Return Data
                       var returnExpObj =   {};

                       returnExpObj['returns']  =   {};
                       returnExpObj['returns']['returnNumber']  =   newreturn.returnNum;
                       returnExpObj['returns']['created']       =   newreturn.createdDate;
                       returnExpObj['returns']['vendor']        =   $scope.VendorData[newreturn.vendorId] ? $scope.VendorData[newreturn.vendorId] : '';
                       returnExpObj['returns']['storeId']       =   newreturn.shipToLocation;
                       returnExpObj['returns']['status']        =   status;
                       returnExpObj['returns']['returnPackage'] =   returnPackExp;
                        var returnOrder = data.returnNumber;
                        // var TempServiceObj = {returnobj: returnobj };
                        if (returnConfigs.returnExportStatuses.indexOf(status) != -1) {
                            returnobj['returnExpObj'] = JSON.stringify(returnExpObj);
                        }
                        // console.log(TempServiceObj , 'TEMP_SERV_OBJ')
                        Data.put('/returnpackage/' + returnOrder, {
                            data: returnobj
                        }).then(function(pkresult) {
                            if ((pkresult != undefined) && (pkresult.status == "success")) {

                                //Calling JMS push service based on return status config
                                // if (returnConfigs.returnExportStatuses.indexOf(status) != -1) {
                                //     jmsPublishSevice(returnExpObj);
                                // }

                                if (status == 'draft') {
                                    var output = {
                                        "status": "success",
                                        "message": "Return Updated Successfully"
                                    };
                                }
                                if (status == 'returned') {
                                    var output = {
                                        "status": "success",
                                        "message": "Order Returned Successfully"
                                    };
                                }
                                Data.toast(output);
                                $state.go('ovc.returns-list');
                            }else if (pkresult != undefined){
                                chksku(pkresult.error);
                            }
                        });
                    }
                });
            } else {
                /*****Save on Add Return*****/
                Data.put('/return', {
                    data: newreturn
                }).then(function(results) {
                    if ((results != '') && (results != undefined) && (results.status == "success") && (results.result != '')) {
                        var returnOrder = results.result.orderNumber;
                        returnobj.createTransaction = true;

                        //Export Return Data
                       var returnExpObj =   {};

                       returnExpObj['returns']  =   {};
                       returnExpObj['returns']['returnNumber']  =   results.result.orderNumber;
                       returnExpObj['returns']['created']       =   results.result.created;
                       returnExpObj['returns']['vendor']        =   $scope.VendorData[newreturn.vendorId] ? $scope.VendorData[newreturn.vendorId] : '';
                       returnExpObj['returns']['storeId']       =   results.result.shipToLocation;
                       returnExpObj['returns']['status']        =   results.result.orderStatus;
                       returnExpObj['returns']['returnPackage'] =   returnPackExp;
                       // var TempServiceObj = {returnobj: returnobj };
                        if (returnConfigs.returnExportStatuses.indexOf(status) != -1) {
                            returnobj['returnExpObj'] = JSON.stringify(returnExpObj);
                        }
                        Data.put('/returnpackage/' + returnOrder, {
                            data: returnobj
                        }).then(function(pkresult) {
                            if ((pkresult != undefined) && (pkresult.status == "success")) {

                                // //Calling JMS push service based on return status config
                                // if (returnConfigs.returnExportStatuses.indexOf(status) != -1) {
                                //     jmsPublishSevice(returnExpObj);
                                // }

                                if (status == 'draft') {
                                    var output = {
                                        "status": "success",
                                        "message": "Return Saved as Draft"
                                    };
                                }
                                if (status == 'returned') {
                                    var output = {
                                        "status": "success",
                                        "message": "Return is Created"
                                    };
                                }
                                Data.toast(output);
                                $state.go('ovc.returns-list');
                            }else if (pkresult != undefined){
                                chksku(pkresult.error);
                            }
                        });
                    }
                });
            }
        };
        if (status == 'returned') {
            Data.post('/checkReturnData', {
                data: returnobj
            }).then(function(results) {
                // var results = {
                //     "data": {
                //         "11665-098-F407-46": {
                //             "oh": -10,
                //             "qty": 10,
                //             "status": true
                //         }
                //     }
                // };
                if (results) {
                    // angular.forEach(results.data, function(skusdata, sku) {
                    //     var skudata = JSON.parse(JSON.stringify(skusdata));
                    //     if (skudata.status == false) {
                    //         $scope.errorsaveReturn[sku] ? '' : $scope.errorsaveReturn[sku] = {};
                    //         ++$scope.errorsaveReturn.sku;
                    //         $scope.action.formerror[sku] = skudata.status;
                    //         $scope.action.formerrormsg[sku] = 'Return quantity exceeds current On Hand balance.\nCurrent OH balance : ' + skudata.oh + '';
                    //     }
                    // });
                    chksku(results);
                    if ($scope.errorsaveReturn.sku) {
                        // var output = {
                        //     "status": "error",
                        //     "message": "Return quantity exceeds current On Hand balance for SKU."
                        // };
                        // Data.toast(output);
                        // delete $scope.errorsaveReturn;
                    } else {
                        saveReturnData();
                    }
                } else {
                    var output = {
                        "status": "error",
                        "message": "Can not create Return."
                    };
                    Data.toast(output);
                }
            });
        } else {
            saveReturnData();
        }
    } 
	}
	
	$scope.getDatetime = $scope.newDate = new Date();
	$scope.currentdate = $filter('date')($scope.getDatetime, "yyyy-MM-dd");
	$scope.getTimeStamp = function(dte) {
		var dte_obj = dte || new Date();
		return Date.parse(dte_obj);
	};

	
	/****Delete Return****/
	$scope.deleteReturn =	function(){
		var return_id 	=	$scope.returnOrder_id;
		  $.confirm({
            title: 'Delete Return Order',
            content: 'Confirm delete?',
            confirmButtonClass: 'btn-primary',
            cancelButtonClass: 'btn-primary',
            confirmButton: 'Ok',
            cancelButton: 'Cancel',
            confirm: function () {
                Data.delete('/return/'+return_id+'?returnOrderNumber='+$scope.return_orderno).then(function (data) {
                    if(data.ok == 1){
                        var output	=	{"status":"success","message":"Return Order Deleted Successfully"};
                        $state.go('ovc.returns-list');
                    }else{
                        var output	=	{"status":"error","message":"Return Order Delete Failed"}; 
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

	$scope.getreturn = function() { 
		$scope.showtab1=true;
           $timeout(function(){
        angular.element('.prod_result').focus();
    },6000);
		if (stateParamId != 0) {
			Data.get('/return?id=' + stateParamId).then(function(results) {
                 $scope.currencyfunc(function(currencyval){
                $scope.currency     =   currencylabel[currencylist[results.shipToLocation]];
                 });

				if ((results != '') && (results != undefined) && (results.status != "error")) {
					var packarray=[]; newpkgs=[];
					var orderno = results.orderNumber;
					$scope.return_orderno	=	results.orderNumber;
					$scope.returnOrder_id	=	results._id;
					if(results.orderStatus == "returned"){
						$scope.showtab1=false;
						$scope.action.page 	=	2;
                        $scope.action.status=false;
					}
					Data.get('/returnpackage?po_id=' + orderno).then(function(pkgresult) {
						if(pkgresult.status != "error"  && pkgresult != undefined){
							var newpkgs=pkgresult;
						}
						 angular.forEach(newpkgs, function(values) {
							var newobj={};var packproductcodes=[];
							var prodcodedesc=[];
							var packitems=packtotal=packsubtotal=packtax=packvat=packskus=0;
							newobj["packageId"] =values.packageId;
							newobj.id=values._id;
							newobj.productDetails={};
							newobj.sku = '';
							newobj["style"] = '';
							newobj["shipDate"] =$filter('dateForm')( values.shipDate);
							newobj["trackingNumber"] = values.trackingNumber;
							
							angular.forEach(values["orderSKU"], function(item) {
								var idx = packproductcodes.indexOf(item.productCode);
								// is currently selected
								if (idx > -1) {
								}
								// is newly selected
								else {
									packproductcodes.push(item.productCode);
									var describe={
										productCode:item.productCode,
										productDescription:item.styleDescription
									}
									prodcodedesc.push(describe);
									newobj.productDetails[item.productCode]=[];
									newobj.productDetails[item.productCode][0]={};
									newobj.productDetails[item.productCode][0]["skus"]=[];
									newobj.productDetails[item.productCode][0]["productDescription"]=item.styleDescription;
									newobj.productDetails[item.productCode][0]["styleColor"]=item.styleColor;
								}
								
								var pkitem={};
								pkitem.lineNumber=parseInt(item.lineNumber);
								pkitem.sku=item.SKU;
							    pkitem.productCode=item.productCode;
								pkitem.name=item.productName;
								pkitem.description=item.description,
								pkitem.cost=item.productCost;
								pkitem.productTax=item.productTax;
								pkitem.productVat=item.productVat;
								pkitem.qty=parseInt(item.qty);
                                pkitem.originalQty=parseInt(item.qty);
								pkitem.selectedUOM=item.producUom;
								pkitem.taxisVAT=item.isVat;
								pkitem.total=item.totalProductCost;
								pkitem.totalProductTax=item.totalProductTax;
								pkitem.totalProductVat=item.totalProductVat;
								pkitem.id=item._id;
								pkitem.waist	=	item.waist;
								pkitem.length	=	item.length;
                                pkitem.size =   item.size;
								pkitem.variants	=	item.variants;
								pkitem.styleColor	=	item.styleColor;
								pkitem.percentage=0;
								var subtotal1=(parseInt(item.qty)* parseFloat(item.productCost));
								var subtotal= parseFloat(subtotal1).toFixed(2);
								pkitem.totalnotax=subtotal;
								if(item.wac != undefined){
									pkitem.wac=item.wac;
								}else{
									pkitem.wac=0;
								}
								
								newobj.productDetails[item.productCode][0]["skus"].push(pkitem);
								//packitems=packtotal=packsubtotal=packtax=packvat=0;
								packitems= parseInt(packitems)+parseInt(item.qty);
								packtotal=parseFloat(packtotal)+parseFloat(item.totalProductCost);	
								packsubtotal=parseFloat(packsubtotal)+parseFloat(subtotal);	
								packtax=parseFloat(packtax)+parseFloat(item.totalProductTax);	
								packvat=parseFloat(packvat)+parseFloat(item.totalProductVat);	
								packskus++;
							});
						 
							newobj.total=parseFloat(packtotal).toFixed(2);
							newobj.subtotal=parseFloat(packsubtotal).toFixed(2);
							newobj.tax=parseFloat(packtax).toFixed(2);
							newobj.vat=parseFloat(packvat).toFixed(2);
							newobj.quantity=packitems;
							newobj.skus=packskus;
							
							angular.forEach(packproductcodes,function(item1) {
								var pcnoitems=pctotal=pcsubtotal=pctax=pcvat=0;
									angular.forEach(newobj.productDetails[item1][0]["skus"], function(item) {
									    if(item.productCode== item1){
										pcnoitems= parseInt(pcnoitems)+parseInt(item.qty);
										pctotal=parseFloat(pctotal)+parseFloat(item.total);	
										pcsubtotal=parseFloat(pcsubtotal)+parseFloat(item.totalnotax);	
										pctax=parseFloat(pctax)+parseFloat(item.totalProductTax);	
										pcvat=parseFloat(pcvat)+parseFloat(item.totalProductVat);	
										}
									 });
									 newobj.productDetails[item1][0].productCode=item1;
									 //newobj.productDetails[item1][0].productDescription =newobj.productDetails[item1][0].description;
									 newobj.productDetails[item1][0].qty = pcnoitems;
									 newobj.productDetails[item1][0].total = parseFloat(pctotal).toFixed(2);
									 newobj.productDetails[item1][0].subtotal = parseFloat(pcsubtotal).toFixed(2);
									 newobj.productDetails[item1][0].tax = parseFloat(pctax).toFixed(2);
									 newobj.productDetails[item1][0].vat = parseFloat(pcvat).toFixed(2);
							});		
									
							    packarray.push(newobj);
						});
						var deletedskus=[];
						var deletedpackages=[];
						var createduser=results.createdBy;
						ovcDash.get('apis/ang_username?user_id=' + createduser).then(function(userdata) {
							if((userdata != undefined) && (userdata != '')){
								var userdetail=userdata.firstName + ' ' + userdata.lastName;
								var finaljson={
									rma_type: results.purchaseOrderType,rmaNumber: results.rmaNumber,shipToLocation:results.shipToLocation,vendorId:results.vendorId,id:results._id,
									order_number:results.purchaseOrderNumber,erpOrderNumber:results.erpPurchaseOrder,
									numberOfPackages:results.numberOfPackages,reasoncode:results.reasonCodeId,
									numberOfProducts:results.numberOfProducts,numberOfSKU:results.numberOfSKU,totalPoCost:results.totalPoCost,
									totalPoVAT:results.totalPoVAT,totalPoTax:results.totalPoTax,PoSubtotal:results.PoSubtotal,
									specialInstructions:results.specialInstructions,returnStatus:results.orderStatus,
									created_by:results.userId,createdBy:userdetail,returnNumber:results.orderNumber,/* created_by:results.createdBy, */
									packageData:packarray, deletedskudata:deletedskus,deletedpackagedata:deletedpackages,createdDate:results.created
								};
								
								$scope.form=finaljson;
							}
						});
							
					});
				}
			});
		}
		
		if ((creturnid != undefined) && (creturnid != '')) {
			Data.get('/return?id=' + creturnid).then(function(results) {
				
				if ((results != '') && (results != undefined) && (results.status != "error")) {
					var packarray=[];
					var orderno = results.orderNumber;
                        $scope.currencyfunc(function(currencyval){
                            $scope.currency     =   currencylabel[currencylist[results.shipToLocation]];
                        });
					Data.get('/returnpackage?po_id=' + orderno).then(function(pkgresult) {
						var newpkgs=pkgresult;
						 angular.forEach(newpkgs, function(values) {
							 
							var newobj={};var packproductcodes=[];
							var prodcodedesc=[];
							var packitems=packtotal=packsubtotal=packtax=packvat=packskus=0;
							newobj["packageId"] =values.packageId;
							//newobj.id=values._id;
							newobj.productDetails={};
							newobj.sku = '';
							newobj["style"] = '';
							newobj["shipDate"] =$filter('dateForm')( values.shipDate);
							newobj["trackingNumber"] = values.trackingNumber;
							
							angular.forEach(values["orderSKU"], function(item) {
								var idx = packproductcodes.indexOf(item.productCode);
								// is currently selected
								if (idx > -1) {
								}
								// is newly selected
								else {
									packproductcodes.push(item.productCode);
									var describe={
										productCode:item.productCode,
										productDescription:item.styleDescription
									}
									prodcodedesc.push(describe);
									newobj.productDetails[item.productCode]=[];
									newobj.productDetails[item.productCode][0]={};
									newobj.productDetails[item.productCode][0]["skus"]=[];
									newobj.productDetails[item.productCode][0]["productDescription"]=item.styleDescription;
									newobj.productDetails[item.productCode][0]["styleColor"]=item.styleColor;
								}
								
								var pkitem={};
								pkitem.lineNumber=parseInt(item.lineNumber);
								pkitem.sku=item.SKU;
							    pkitem.productCode=item.productCode;
								pkitem.name=item.productName;
								pkitem.description=item.description,
								pkitem.cost=item.productCost;
								pkitem.productTax=item.productTax;
								pkitem.productVat=item.productVat;
								pkitem.qty=parseInt(item.qty);
								pkitem.selectedUOM=item.producUom;
								pkitem.taxisVAT=item.isVat;
								pkitem.total=item.totalProductCost;
								pkitem.totalProductTax=item.totalProductTax;
								pkitem.totalProductVat=item.totalProductVat;
								pkitem.waist	=	item.waist;
								pkitem.length	=	item.length;
                                pkitem.size =   item.size;
								pkitem.variants	=	item.variants;
								pkitem.styleColor	=	item.styleColor;
								//pkitem.id=item._id;
								pkitem.percentage=0;
								var subtotal1=(parseInt(item.qty)* parseFloat(item.productCost));
								var subtotal= parseFloat(subtotal1).toFixed(2);
								pkitem.totalnotax=subtotal;
								if(item.wac != undefined){
									pkitem.wac=item.wac;
								}else{
									pkitem.wac=0;
								}
								
								newobj.productDetails[item.productCode][0]["skus"].push(pkitem);
								//packitems=packtotal=packsubtotal=packtax=packvat=0;
								packitems= parseInt(packitems)+parseInt(item.qty);
								packtotal=parseFloat(packtotal)+parseFloat(item.totalProductCost);	
								packsubtotal=parseFloat(packsubtotal)+parseFloat(subtotal);	
								packtax=parseFloat(packtax)+parseFloat(item.totalProductTax);	
								packvat=parseFloat(packvat)+parseFloat(item.totalProductVat);	
								packskus++;
							});
							
							newobj.total=parseFloat(packtotal).toFixed(2);
							newobj.subtotal=parseFloat(packsubtotal).toFixed(2);
							newobj.tax=parseFloat(packtax).toFixed(2);
							newobj.vat=parseFloat(packvat).toFixed(2);
							newobj.quantity=packitems;
							newobj.skus=packskus;
							
							angular.forEach(packproductcodes,function(item1) {
								var pcnoitems=pctotal=pcsubtotal=pctax=pcvat=0;
									angular.forEach(newobj.productDetails[item1][0]["skus"], function(item) {
									    if(item.productCode== item1){
										pcnoitems= parseInt(pcnoitems)+parseInt(item.qty);
										pctotal=parseFloat(pctotal)+parseFloat(item.total);	
										pcsubtotal=parseFloat(pcsubtotal)+parseFloat(item.totalnotax);	
										pctax=parseFloat(pctax)+parseFloat(item.totalProductTax);	
										pcvat=parseFloat(pcvat)+parseFloat(item.totalProductVat);	
										}
									 });
									 newobj.productDetails[item1][0].productCode=item1;
									 //newobj.productDetails[item1][0].productDescription =newobj.productDetails[item1][0].description;
									 newobj.productDetails[item1][0].qty = pcnoitems;
									 newobj.productDetails[item1][0].total = parseFloat(pctotal).toFixed(2);
									 newobj.productDetails[item1][0].subtotal = parseFloat(pcsubtotal).toFixed(2);
									 newobj.productDetails[item1][0].tax = parseFloat(pctax).toFixed(2);
									 newobj.productDetails[item1][0].vat = parseFloat(pcvat).toFixed(2);
							});					
							    packarray.push(newobj);
								
						});
							
						var deletedskus=[];
						var deletedpackages=[];
						var createduser=results.createdBy;
						ovcDash.get('apis/ang_username?user_id=' + createduser).then(function(userdata) {
							if((userdata != undefined) && (userdata != '')){
								var userdetail=userdata.firstName + ' ' + userdata.lastName;
								var finaljson={
									rma_type: results.purchaseOrderType,rmaNumber: results.rmaNumber,shipToLocation:results.shipToLocation,vendorId:results.vendorId,id:results._id,
									order_number:results.purchaseOrderNumber,reasoncode:results.reasonCodeId,erpOrderNumber:results.erpPurchaseOrder,numberOfPackages:results.numberOfPackages,
									numberOfProducts:results.numberOfProducts,numberOfSKU:results.numberOfSKU,totalPoCost:results.totalPoCost,
									totalPoVAT:results.totalPoVAT,totalPoTax:results.totalPoTax,PoSubtotal:results.PoSubtotal,specialInstructions:results.specialInstructions,
									created_by:results.userId,createdBy:userdetail,returnNumber:results.orderNumber,/* created_by:results.createdBy, */
									packageData:packarray, deletedskudata:deletedskus,deletedpackagedata:deletedpackages 
								};
							
								$scope.form=finaljson;	
								delete  sessionStorage.creturnid;
							}
						});
					});
				}
			});
		}
	}

	$scope.getreturn();

    //Copy Return Orders 
    $scope.copyReturnReceipt    =   function(){
        sessionStorage.creturnid = stateParamId;
        $state.go('ovc.return-copy');
    }
            
	
});