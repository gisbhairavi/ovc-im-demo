var app 	=	angular.module('OVCstockApp',['ui.bootstrap.treeview','roleConfig']);
 
app.controller('replenishmentFilterCtrl',function ($rootScope, $scope, $state, $http, Data, ovcDash, roleConfigService, Utils){  
	
	$scope.offset        =  0;
	$scope.entryLimit	 =	$rootScope.PAGE_SIZE; //max no of items to display in a page
	$scope.currentPage   =  1; //current page 
    $scope.search        =  ''; 
    $scope.filteredItems =  '';
    $scope.location         =   {};
    $scope.hideDelete = true;

	
	$('[data-toggle="tooltip"]').tooltip();
	
	$scope.reasonServiceFunc = function(){ 
        $scope.list             =    [];
		Data.get('/replenishmentfilter?page_offset='+$scope.offset+'&page_lmt='+$scope.entryLimit).then(function(data) {
	        if( data != undefined ){ 
	        	$scope.list             =   data.filter_data;  
				$scope.filteredItems    =   $scope.list.length; //Initially for no filter   
				$scope.totalItems       =   data.total_count;
	        }
	    });  
    };
    
    $scope.reasonServiceFunc(); 

    // Reset Search Filters
    $scope.replenishmentFilterReset = function() {
        $scope.reasonServiceFunc(); 
        $scope.search    =   ''; 
    };

    Utils.configurations().then(function ( config ){
        if(config){
            $scope.repleinshConfig  =   config.action;
        }
    });
     
    $scope.searchReplenishmentFilter = function(){ 
       
         Data.get('/replenishmentfilter?filterName='+$scope.search).then(function(data) {
                if( data != undefined ){ 
                    $scope.list       =   []; 
                    $scope.list = data.filter_data;
                    $scope.filteredItems = $scope.list.length; //Initially for no filter  
                    $scope.totalItems = data.total_count;
                }
            }); 
 
    };
	 
	$scope.setPage = function(pageNo) {
        $scope.currentPage  =   pageNo;
    };
    
    $scope.sort_by = function(predicate) {
        $scope.predicate    =   predicate;
        $scope.reverse      =   !$scope.reverse;
    };
    
    $scope.pageChanged  =   function(){
        // $scope.offset = ($scope.currentPage - 1) * $scope.itemsPerPage;
 	   $scope.offset         =    ($scope.currentPage - 1) * $scope.entryLimit;
       $scope.reasonServiceFunc();
     };
     
     var delete_filter        =	$scope.ovcLabel.replenishmentFilters.toast.FilterDeleteSuccess;
 	 var delete_filter_fail   =	$scope.ovcLabel.replenishmentFilters.toast.FilterDeleteFail;
 	 
     
    $scope.deleteFilter    =   function(filter_id){
         $.confirm({
             title: 'Delete Filter',
             content: 'Confirm delete?',
             confirmButtonClass: 'btn-primary',
             cancelButtonClass: 'btn-primary',
             confirmButton: 'Ok',
             cancelButton: 'Cancel',
             confirm: function () {
                 Data.delete('/replenishmentfilter/'+ filter_id).then(function (data) {
                     if(data.ok == 1 && data.n > 0){
                         var output={"status":"success","message":delete_filter};
                         $state.go('ovc.ReplenishmentFilter',{},{reload : true});
                     }else{
                         var output={"status":"error","message":delete_filter_fail}; 
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

    $scope.convertToArray = function(val){
	   var tempVal = [];
        angular.forEach(val, function(item,key) {
            if(tempVal.indexOf(item.name) == -1){
                tempVal.push(item.name);
            }
	    });
	    var tempfinal  =  tempVal.join(", ");
	    return tempfinal;
	};


    // Run Replenishment Engine Based on Filter Criteria

    $scope.runReplenishment     =   function(filterId){

        var selectedFilterData;
        if($scope.list.length > 0){
            angular.forEach($scope.list, function(filterRecords,kyy) {
                if(filterRecords._id == filterId){
                    selectedFilterData      =   $scope.list[kyy];
                }
            });
        }
        if(typeof(selectedFilterData) == 'object'){
            var acceptedKeys    =   ['locName','productProperties','productVariants','merchandiseGroup','pricing','purchasePrice','retailPrice','storeQuantities'];
            var URLObject       =   {};
            var replenishmentRulesObj   =   {};
            angular.forEach(selectedFilterData, function(filterItem,kyy) {
                if(typeof(filterItem) == 'object'){
                    if(acceptedKeys.indexOf(kyy) > -1){
                        var dummyArray2 = [];
                        var dummyArray1 = [];
                        angular.forEach(filterItem, function(item,key) {
                            if(key == 'reorderPoint'){
                                if(item.from){
                                    replenishmentRulesObj['minReorder']     =   item.from;
                                }
                                if(item.to){
                                    replenishmentRulesObj['maxReorder']     =   item.to;
                                }
                            }

                            if(acceptedKeys.indexOf(key) > -1){
                                var dummyArray  =   [];
                                angular.forEach(item, function(value) {
                                    if(kyy == 'pricing'){
                                        dummyArray.push(value);
                                    }else{
                                    if(key != "locName" && key != "merchandiseGroup")
                                        dummyArray.push(value.id);
                                    }
                                });
                                URLObject[key]  = dummyArray.toString();
                            }

                            if(key == "locName" || key == "merchandiseGroup" ){
                                URLObject[key]  =    item.toString();
                            }

                            if(kyy == 'productProperties'){
                                var dummyArray  =   [];
                                
                                angular.forEach(item,function(value){
                                    
                                    dummyArray.push(value);

                                });
                                dummyArray1.push(dummyArray);
                                URLObject[kyy]  = dummyArray1.toString();
                            }
                            if(kyy == 'productVariants')
                            {
                                var dummyArray  =   [];
                                
                                angular.forEach(item,function(value){
                                    
                                    dummyArray.push(value);

                                });
                                dummyArray2.push(dummyArray);
                                URLObject[kyy]  = dummyArray2.toString();
                            }
                        });
                    }
                }
            });
            replenishmentRulesObj['locationId'] =   URLObject['locName'];

            Data.get('/getReplenishmentRulesSku?srchData='+JSON.stringify(replenishmentRulesObj)).then(function (resultsData) {
                if(resultsData.length > 0){
                    var skuWithRules    =   {};
                    angular.forEach(resultsData,function(item) {
                        if(!skuWithRules[item.locationId]){
                            skuWithRules[item.locationId]   =   [];
                        }
                        skuWithRules[item.locationId].push(item.sku);
                    });

                    Data.post('/runReplenishment', {data:{URLObject:URLObject,skuObject:skuWithRules,enableReview:$scope.repleinshConfig.enanbleReview}}).then(function (response) { 
                        if(response.error){
                            var output={"status":"error","message":response.error};
                        }else{
                            var output={"status":"success","message":response.message};
                        }
                        Data.toast(output);
                        Data.post('/replenishmentfilter/'+filterId, {
                            data:{data:{numberOfSkus:response.numberOfSKUs,lastRun:Date.now()}}
                        }).then(function (results) {
                            $state.reload();
                        }); 
                    });     
                }else{
                    var output={"status":"error","message":$scope.ovcLabel.replenishmentFilters.toast.NoRulesFoundTheFilter};
                    Data.toast(output);
                }

            });

                   
        }
    };
});

app.controller('addReplenishmentFilter', function($rootScope, $scope, $state, $http, $stateParams,  $cookieStore, $timeout,$parse, ovcDash, TreeViewService,roleConfigService, Data, ORDERTYPELIST , Utils) {

	$scope.content     = true;
	var productsArray	=	['Merchandise']; 
	 
	var userId			=	$rootScope.globals['currentUser']['username'];
	var filter_Id		=	$stateParams.filterid;
    var dataCopy        =   {};
    $scope.titleadd     =   true;
    $scope.titleedit    =   false; 
    $scope.data			=	{};
    $scope.action		=	{};  
    $scope.screenValue	=	'add';
    $scope.location         =   {};
    
    
 // Variable declaration for Advanced Criteria  
    
    $scope.storeQuantities						=	{};
    $scope.storeQuantities.reorderPoint 		=	{};
    $scope.storeQuantities.currentOnHandQty		=	{};
    $scope.storeQuantities.storeTransferInQty	=	{};
    $scope.storeQuantities.storeTransferOutQty	=	{};
    
    $scope.pricing					=	{};
    $scope.pricing.purchasePrice	=	{};
    $scope.pricing.retailPrice		=	{};
    $scope.pricing.margin			=	{};
    
 // Variable declaration for products Screen
    
    $scope.data.location_datas	=	[]; 
    $scope.data.store_datas		=	[]; 
    $scope.F_edit				=	{};
    $scope.F_edit.FilterName	=	'';
    $scope.dropdownDashCall     =   {};

 // Variable declaration for protocol Screen
    	
    $scope.excludeTypeSelectedItems		=	[];
    $scope.selectedExcludeOrderNumber	=	[];
    $scope.selectedpackageStatus		=	[];
    $scope.excludeOrderNumber			=	[]; 
    $scope.data.selectedOrderId			= 	''; 
    sessionStorage.carrierall           =   true;



    
    if ((filter_Id != null) && (filter_Id != '') && (filter_Id != undefined)) {
    	
    	$scope.titleadd     =   false;
        $scope.titleedit    =   true; 
        $scope.screenValue	=	'edit'; 
        
        Data.get('/replenishmentfilter?id=' + filter_Id).then(function(data) {
            $scope.selectedpackageStatus    =   data[0].merchandiseGroup.merchandiseGroup;
             dataCopy = data[0];
             $timeout(function() {
            	 $scope.F_edit.FilterName = dataCopy.filterName; 
         	}, 1);
            editFilterLoadSelectedVal(dataCopy);
            getProductProperties();
        });
    }else{
        getProductProperties();
    }  
    
   //Load the default value for Consider inventory balance check boxes
    $scope.rfp = {};
    $scope.rfp.currentOnHold = true;
    $scope.rfp.openOnOrder = true;
    $scope.rfp.inTransitIn = true;
    $scope.rfp.inTransferOut = true;
    $scope.rfp.allocated = true;
    $scope.rfp.reserverd = true;
     
    Data.get('/order').then(function(data) {
        if( data != undefined && data.order_data != undefined){
            angular.forEach(data.order_data,function(item) {
                $scope.excludeOrderNumber.push(item.purchaseOrderNumber);
            });
        }
    });   
    
     
    if ((filter_Id == null) || (filter_Id == '') || (filter_Id == undefined)) { 
        //================= Hierarchy Location Add Page ===============//
    	Utils.hierarchylocation().then(function(results){
            if(results && results.hierarchy){
                $scope.storeLocData     =    $scope.data.location_datas  =   TreeViewService.getLocData(results);
            }
        },function(error){
            console.log('Hierarchy locations Service Faild')
        }); 

        //================= Merchandise Group Hierarchy Add Page ===============//
        ovcDash.get('apis/ang_getMerchandiseHierarchy').then(function(merchandise){
            if(merchandise && merchandise.hierarchy){
                $scope.MerchandiseData =   TreeViewService.getLocDataMerchandise(merchandise);
            }
        },function(error){
            console.log('Merchandise Hierarchy Service Faild');
        });
    }

    function getProductProperties(){

        Utils.configurations().then( function ( config ) {
            if( config ){
                $scope.config_data  =   config.action.stockPr;
                $scope.config       =   config;
                 var property    =   $scope.config.productProperty ? $scope.config.productProperty.join():'';
                 var attribute   =   $scope.config.productAttribute ? $scope.config.productAttribute.join():'';
                ovcDash.get('apis/ang_config_properties?type='+'value'+'&propertyvalue='+property+'&variantstype='+attribute).then(function (results) {
                    if(results.status == 'error'){
                        $scope.dropdownDashCall        =   [];
                    }else{
                          $scope.dropdownDashCall        =   results;
                          if ((filter_Id != null) && (filter_Id != '') && (filter_Id != undefined)) {
                           
                                $scope.loadEditPropertyDropDownVal($scope.dropdownDashCall.productProperty);

                                $scope.loadEditAttributeDropDownVal($scope.dropdownDashCall.productAttribute);

                          }else{
                            $scope.dropdownDashCall        =   results;
                          } 
                    }
                });
            }
        });
    }

    
    
    var ordersTypeList      =   $scope.ovcLabel.replenishmentFilters.orderstypelist;
    var ordersType          =   [];
    angular.forEach(ORDERTYPELIST, function(item) {
    	var tempOBJ		=	{};
    	tempOBJ.Id		=	item.id;
    	tempOBJ.Name	=	item.code;
    	
        ordersType.push(tempOBJ) ;  
    });
    $scope.data.excludeOrderType  =   ordersType;
    
    $scope.getSelecteditem = function(item){
        var tempname =[];
        angular.forEach(item,function(value,key){
            if(tempname.indexOf(value.name) == -1){
                tempname.push(value.name);
            }
        });
        var selectedname = tempname.join(",");
        return selectedname;
    };

    $scope.selectedname={};
    $scope.selectednameAttribute={};
    $scope.getSelectedPropertyReview = function(item){
        if(item.selectedProperty.length == 0){
            // var tempname ={};
             $scope.selectedname[item.propertyId]="There is no selection";
             return $scope.selectedname[item.propertyId];
        }
        else{
                  var tempname = [];
            angular.forEach(item.selectedProperty,function(value,key){
                if(tempname.indexOf(value.name) == -1){
                 tempname.push(value.name);
                }
            });
            $scope.selectedname[item.propertyId] = tempname.toString();
            return $scope.selectedname[item.propertyId];  
        }


    };
    $scope.getSelectedAttributeReview = function(item){
        if(item.selectedProperty.length == 0){
            $scope.selectednameAttribute[item.id]="There is no selection";
            return $scope.selectednameAttribute[item.id]; 
        }
        else{
           var tempname = [];
            angular.forEach(item.selectedProperty,function(value,key){
                if(tempname.indexOf(value.name) == -1){
                    tempname.push(value.name);
                }
            });
            $scope.selectednameAttribute[item.id] = tempname.toString();
            return $scope.selectednameAttribute[item.id];  
        }
        

    };
    /******common function to create the multiselect checkbox value******/ 


    $scope.loadEditPropertyDropDownVal      =   function(data){

        angular.forEach(data,function(item,propertykey){

            angular.forEach(dataCopy.productProperties,function(value,responsekey){
                if(propertykey == responsekey ){

                        angular.forEach(value,function(responseValue){
                        var tempobj = {};
                                tempobj.id      =   responseValue;
                                tempobj.name    =   responseValue;
                                tempobj.selected=   true;
                        $scope.dropdownDashCall.productProperty[propertykey].selectedProperty.push(tempobj);

                        });    
                }
            });
        });
    };

    $scope.loadEditAttributeDropDownVal     =   function(data){
         angular.forEach(data,function(item,propertykey){

            angular.forEach(dataCopy.productVariants,function(value,responsekey){
                if(propertykey == responsekey ){

                        angular.forEach(value,function(responseValue){
                        var tempobj = {};
                                tempobj.id      =   responseValue;
                                tempobj.name    =   responseValue;
                                tempobj.selected=   true;
                        $scope.dropdownDashCall.productAttribute[propertykey].selectedProperty.push(tempobj);

                        });
                    
                }
            });
        });

    };
	
    $scope.data.selectedOrderId = ''
	$scope.addOrderNumber = function (val) {
		var item = angular.copy(val);

        $scope.data.orderNumberErrorMessage = '';
		if(item != ''){ 
             if($scope.excludeOrderNumber.indexOf(val) == -1){ 
                $scope.data.orderNumberErrorMessage = $scope.ovcLabel.replenishmentFilters.toast.orderNotExist;
             }else{ 
                if($scope.selectedExcludeOrderNumber.indexOf(val) == -1)
                $scope.selectedExcludeOrderNumber.push(item);  
             } 

			$scope.data.selectedOrderId = ''
			$timeout(function() {
				var classs = $("#excludeOrderNumbersearch").next('ul').addClass('ng-hide');
                $scope.data.selectedOrderId = ''
		    }, 50);
		} 
    };
     
    $scope.removeExcludeOrderNumber = function (index) {
        $scope.data.orderNumberErrorMessage = '';
		 $scope.selectedExcludeOrderNumber.splice(index, 1);
    };
    
	$scope.removeExcludeType = function (index) {
		 $scope.excludeTypeSelectedItems.splice(index, 1);
    };
    
	$scope.searchLocation = function(location){
        $scope.action.filterLocation	=	location;
    };
    $scope.searchSecondLocation = function(loc){
        $scope.action.filter   =    loc;
    }
 
    $scope.productfilterNextBtn = function(id){ 

        $scope.loadSelectedLocationValue();
        $scope.loadpropertvalue();
        $scope.loadattributevalue();
        $scope.loadselectedmerchandiseValue();
        var error = false;
         
    	if($scope.F_edit.FilterName == '' || !$scope.F_edit.FilterName){ 
            $scope.data.filterNameErrorMessage     =   true;
    		error = true; 
    	}
        if($scope.countLoc){
            $scope.data.locationErrorMessage      =   true;
            error = true; 
        }

        if(error)
            return false; 

    	$timeout(function() {
    		angular.element('#'+id).trigger('click');
    	}, 1); 
    };
    
    $scope.filterCancelAndNextBtn = function(id){
    	$timeout(function() {
    		angular.element('#'+id).trigger('click');
    	}, 1);
    };
    
    $scope.selectedLocationVal = [];
    $scope.selectedmerchandiseVal = [];
    $scope.selectedLocationValCopy = [];
    $scope.rediectToReviewPage = function(id){ 
    	$timeout(function() {
    		angular.element('#'+id).trigger('click');
    	}, 1); 
    };
    
     $scope.saveReplenishmentFilter  = function(ScreenType){
    	var productVariants ={};
    	var productProperties ={};
    	var merchandiseGroup ={};
        var excludedOrderType = '';
    	var locName ={};
        var error = false; 
     	
    	if($scope.F_edit.FilterName == '' || !$scope.F_edit.FilterName){ 
            $scope.data.filterNameErrorMessage      =   true;
    		error = true; 
    		
    	}

        if($scope.selectedLocationVal.length == 0){ 
            $scope.data.locationErrorMessage      =   true;
            error = true; 
            
        }

        if(error){
            $timeout(function() {
                angular.element('#products').trigger('click');
                
            }, 1);
            return false; 
        }
        
        
        var selectedObjectProperty={};
        var selectedObjectAttribute ={};;

        if($scope.dropdownDashCall){
            angular.forEach($scope.dropdownDashCall.productProperty, function(provalue,prokey){
                var selectedArray =[];

                if(provalue.selectedProperty && provalue.selectedProperty.length > 0){
                    angular.forEach(provalue.selectedProperty, function(selvalue,selkey){
                        if(selectedArray.indexOf(selvalue.id) == -1)
                        { 
                            selectedArray.push(selvalue.id);
                        }
                    });

                    selectedObjectProperty[prokey] = selectedArray;
                }
            });
            angular.forEach($scope.dropdownDashCall.productAttribute, function(provalue,prokey){
                var selectedArrayVarient   =   [];
                if(provalue.selectedProperty && provalue.selectedProperty.length > 0){
                    angular.forEach(provalue.selectedProperty, function(selvalue,selkey){
                        if(selectedArrayVarient.indexOf(selvalue.id) == -1)
                            selectedArrayVarient.push(selvalue.id);
                    });
                    selectedObjectAttribute[prokey] = selectedArrayVarient;
                }
            });
        }
    	 
        merchandiseGroup['merchandiseGroup']    =   $scope.location.storeId ? $scope.location.storeId : []; 
        excludedOrderType       =   iterateExcludeOrederType($scope.excludeTypeSelectedItems);
        locName['locName']      =   $scope.location.id;
    	var dataObj = {
    			filterName : $scope.F_edit.FilterName,
    			locName : JSON.stringify(locName),
    			productVariants : JSON.stringify(selectedObjectAttribute),
    			productProperties : JSON.stringify(selectedObjectProperty),
    			merchandiseGroup : JSON.stringify(merchandiseGroup),
    			inventoryBalance : JSON.stringify($scope.rfp),
    			excludedOrderType : JSON.stringify(excludedOrderType),
    			excludedOrderNo : JSON.stringify($scope.selectedExcludeOrderNumber), 
    			storeQuantities : JSON.stringify($scope.storeQuantities) ,
    			pricing : JSON.stringify($scope.pricing)
			}; 

    	if(ScreenType == 'ADD'){
    		Data.put('/replenishmentfilter', {
				data:{data:dataObj}
			}).then(function (results) {
				
				if((results!= undefined) && (results.success !=undefined)){
					var output={"status":"success","message":$scope.ovcLabel.replenishmentFilters.toast.filterCreateSuccess};
	                $state.go('ovc.ReplenishmentFilter',{},{reload : true});
				} else{
					var output={"status":"error","message":results.error};
				}
				Data.toast(output);
			}); 
    	}else{
    		Data.post('/replenishmentfilter/'+filter_Id, {
				data:{data:dataObj}
			}).then(function (results) { 
				if(results.ok == 1 && results.n > 0){
                    var output={"status":"success","message":$scope.ovcLabel.replenishmentFilters.toast.filterUpdateSuccess};
                    $state.go('ovc.ReplenishmentFilter',{},{reload : true});
                }else{
                    var output={"status":"error","message":results.error};
                }  
				Data.toast(output);
				 
			});
    		
    	}
    }; 
    $scope.emptyvalue =     {}; 
    $scope.countLoc =   false;
    $scope.countMer =   false;
    /******common function to create the multiselect checkbox value******/ 
    $scope.loadSelectedLocationValue = function () {
        var emptycheck  =   $scope.location.title ? $scope.location.title.split(', ') : 0;

        if(emptycheck == 0){
            $scope.countLoc     =   true;
            $scope.selectedLocationVal  =   $scope.ovcLabel.replenishmentFilters.toast.noSelection;
        }
        else{
            $scope.countLoc     =   false;
            $scope.selectedLocationVal = emptycheck;
            $scope.selectedLocationValCopy = angular.copy(emptycheck);   
        }
    }; 

    $scope.loadselectedmerchandiseValue     =   function(){
        var emptyvaluecheck     =  $scope.location.storeTitle ? $scope.location.storeTitle : 0;

        if(emptyvaluecheck == 0){
            $scope.countMer = true;
            $scope.selectedmerchandiseVal   =  $scope.ovcLabel.replenishmentFilters.toast.noSelection;
        }
        else{
            $scope.countMer = false;
            $scope.selectedmerchandiseVal   =   emptyvaluecheck;
        }
    };
    $scope.selectedpropertyvalue={};
    $scope.loadpropertvalue     =   function(){
            angular.forEach($scope.dropdownDashCall.productProperty,function(value,key){
                $scope.selectedpropertyvalue[key]    =   $scope.getSelectedPropertyReview(value);
            });
    };
    $scope.selectedattributevalue={};
    $scope.loadattributevalue   =   function(){
        angular.forEach($scope.dropdownDashCall.productAttribute,function(value){
                $scope.selectedattributevalue[value.id]   =   $scope.getSelectedAttributeReview(value);
        });
    };

    
    /******common function to iterate the selectbox values******/ 
    var iterateMultiSelectBoxValue = function(data) {
    	var tempArray = []
    	var tempOBJ = {};
    	angular.forEach(data, function(item,key) {
    		tempOBJ = {};
    		if(item.selected == true){
    			tempOBJ.id = item.id 
    			tempOBJ.name = item.name
    			tempArray.push(tempOBJ);
    			
    		} 
	   });
    	
    	return tempArray;
    };


     var iterateExcludeOrederType = function(data) {
        var tempArray = []
        var tempOBJ = {};
        angular.forEach(data, function(item,key) {
            tempOBJ = {};
            if(item.selected == true){
                tempOBJ.Id = item.Id ;
                tempOBJ.Name = item.Name;
                tempArray.push(tempOBJ);
                
            } 
       });
        
        return tempArray;
    };

    /******code for load the value in edit screen******/ 
    var editFilterLoadSelectedVal = function(data) {
        if(data){
            //================= Hierarchy Location Edit Page ===============//

            Utils.hierarchylocation().then(function(results){ 
                if(results && results.hierarchy){
                    $scope.storeLocData     =   $scope.data.location_datas    =   TreeViewService.getLocData(results);

                    $scope.checkBoxSelect($scope.storeLocData[0], true, data.locName.locName.join());
                    $scope.addSelectedClass($scope.storeLocData[0], true, data.locName.locName.join());
                }
            }, function(error){
                console.log('Hierarchy Location Error :' + error);
            }); 

            //================= Merchandise Group Hierarchy Edit Page ===============//
            ovcDash.get('apis/ang_getMerchandiseHierarchy').then(function(merchandise){
                if(merchandise && merchandise.hierarchy){
                    $scope.MerchandiseData =   TreeViewService.getLocDataMerchandise(merchandise);

                    if(data.merchandiseGroup.merchandiseGroup.length > 0){
                        $timeout(function(){
                            $scope.checkBoxSelectMerchandise($scope.MerchandiseData[0], true, data.merchandiseGroup.merchandiseGroup.join());
                            $scope.addSelectedClassMerchandise($scope.MerchandiseData[0], true, data.merchandiseGroup.merchandiseGroup.join());
                        },1000)
                    }
                }

            },function(error){
                console.log('Merchandise Hierarchy Service Faild');
            });

            $scope.rfp =   data.inventoryBalance;
            $scope.excludeTypeSelectedItems =  data.excludedOrderType;
            $scope.selectedExcludeOrderNumber =  data.excludedOrderNo;
            $scope.storeQuantities =  data.storeQuantities;
            $scope.pricing = data.pricing; 
        }
    }; 
});