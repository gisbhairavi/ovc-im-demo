var app = angular.module('OVCstockApp', ['ui.bootstrap.treeview','roleConfig', 'ovcdataExport']);
 /*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module			:       Product Performance   
*
*    Developer		:       Sivaprakash
*
*    Date			:       29/02/2016
*
*    Version		:        1.0
*
**********************************************************************/
app.controller('productPerformance', function($rootScope, $scope, $state, $http,  $timeout, $stateParams, $filter, Data, ovcDash, PRODUCTPERFORM, TreeViewService, roleConfigService, ovcdataExportFactory, Utils) {
	$scope.form	=	$scope.ship	=	$scope.action 	=	{};
	$scope.ship.showtable	=	false;
	$scope.action.showrefine=	false;
	$scope.drop_proper 		=	{};
	$scope.loaded_style		=	'';
	var Pro_perform 		=	PRODUCTPERFORM;
	// var refine_perform		=	$scope.translation.productperformlabel;
	var styledata 			= 	skudata  =  [];
	$scope.storevalues		=	[];
    $scope.selectedstores   =   [];
    $scope.stores           =   [];
    $scope.locationlist 	=	[];
    var count 				=	1;
    $scope.form.productsku 	= 	[];
    // $scope.locationidArray 	=	[];
    // $scope.locationnameArray=   [];
    $scope.location 	=	{};
	var property 	=	[];
	var variants 	=	[];
	/*Getting configuration*/
    Utils.configurations().then( function ( config ) {
        if( config ){
            var config_data = config.action.stockPr;
            $scope.config_data  =  config_data;
            $scope.config 	=	config;
			angular.forEach( styledata, function( item ) {
				if (!(config_data.hasOwnProperty(item.id))){ 
		        	$scope.config_data[ item.id ]  =   true;
		    	}
		    });
		    
		    angular.forEach( skudata, function( item )  {
		    	if (!(config_data.hasOwnProperty(item.id))){
		    		$scope.config_data[ item.id ]	=	true;
		    	}
		    });
		    if(!$scope.config.showskugroup){
	    		$scope.style_details 	=	true;
	    	};
			//Configration Property //
	         property 	=	$scope.config.productProperty ? $scope.config.productProperty.join() : null;
	         variants 	=	$scope.config.productAttribute ? $scope.config.productAttribute.join() : null;

	        //Get Propert value Dynamic//
	         ovcDash.get('apis/ang_config_properties?type='+'value'+'&propertyvalue='+property+'&variantstype=&productProperty=true&productAttribute=true').then(function (results) {
	         	if(results != undefined && results != ''){
	          	 $scope.dropdownDashCall 		=	results;
	         	}
	         });
        }
    });
	    $scope.stylehideshow   	=	function(){
	    	if($scope.config.showskugroup){
	    		$scope.style_details = !$scope.style_details;
	    	}
	    };

    	var storenamecode=[];
    	//
        $scope.getLocation  =   function() {
        var id_user = $rootScope.globals['currentUser']['username'];
		Utils.hierarchylocation().then( function ( results ) {
		 $scope.storeLocData =   TreeViewService.getLocData(results);
            var selectedStore 	=	$scope.storeLocData[0];
            if(sessionStorage.locationname){
            	angular.forEach(results.hierarchy,function(item){
            		if(sessionStorage.locationname == item.id){
            			selectedStore 	=	item;
            			$scope.location.displayName = selectedStore.name;
            			$scope.checkBoxSelect(selectedStore);
            			$scope.addSelectedClass(selectedStore);
            			return false;
            		}
            	});
            }
            else{
            	$scope.checkBoxSelect($scope.storeLocData[0]);
            	$scope.addSelectedClass($scope.storeLocData[0]);
            }
            $scope.stock_product(selectedStore.id);
        }, function(errot){

        }).then(function(){
        	if(sessionStorage.prodata){
        		$scope.stocklookup = true;
        		var SessionproData   =   JSON.parse(sessionStorage.prodata);
    			$scope.ship.skuresult    =   SessionproData.sku+'~'+SessionproData.description+'~'+SessionproData.barCode;
    			$timeout(function(){
					$scope.searchproduct_perform();
				},800);
        	}
        });
       	Utils.userLocation().then( function ( resultsloc ) {
       		angular.forEach(resultsloc, function(item) {
                $scope.locationlist[item.id]    =   item.displayName;
            });
        }, function(error){
        	console.log('User Location Error  :' + error);
        });
    };
    
    $scope.getLocation();
    $scope.searchLocation = function(location){
        $scope.action.filterLocation	=	location;
    };

    /***Enable / Disable sku,Style Search**/

    $('#skusearch :input').attr('disabled', true);
	$('#stylesearch :input').attr('disabled', true);

    $scope.stock_product=function(data){
		if((data !=undefined) &&(data !="")){
			 $('#skusearch :input').removeAttr('disabled');
			 $('#stylesearch :input').removeAttr('disabled');
		}else{
			$('#skusearch :input').attr('disabled', true);
			$('#stylesearch :input').attr('disabled', true);
		}
	};

  	/***Search productPerformance Function***/
	$scope.searchproduct_perform	=	function(){
		$timeout(function() { $scope.form.productsku = []; }, 10);
		

     	if( ! $scope.form.skuresult && ! $scope.loadall){
			angular.element('#looksearch').focus();
				var output = {
	                		"status": "error",
	                		"message": $scope.ovcLabel.performance.toast.skumandatory
	            			};
	            Data.toast(output);
		}
		else{
			var SelectedSku='';
        	var selectedArray 	=	[];
        	if($scope.dropdownDashCall){
        		angular.forEach($scope.dropdownDashCall.productProperty, function(provalue,prokey){
	        		if(provalue.selectedProperty && provalue.selectedProperty.length > 0){
	        			angular.forEach(provalue.selectedProperty, function(selvalue,selkey){
	        				if(selectedArray.indexOf(selvalue.id) == -1)
	        					selectedArray.push(selvalue.id);
	        			});
	        		}
	        	});
        	}
			angular.element('#looksearch').focus();
        	var locationIdArray 	= ($scope.location.id) ? $scope.location.id : []; 
        	

			if(locationIdArray.length > 0){
				$scope.action.loadsku 		=	false;
				var productPerformanceList	=	[];
				var SearchingData			=	$scope.form;
				if(Object.keys($scope.form).length > 0){
		            $scope.ship.showtable   =   true;
		        }
				var shipToStore             =   ($scope.location.id) || '';
		        var selected_sku            =   SearchingData.skuresult.split('~');
	            var SelectedSku             =   $scope.loaded_style ? $scope.loaded_style : selected_sku[0];

		        if($scope.ship.skuresult)
					var sku 	=	$scope.ship.skuresult.split('~').length==3?true:'';
				else
					var sku 	=	selected_sku.length == 3 ? true : '';

		        var offset	=	$scope.action.offset || '';

		        /*************PDF Export******************/
        		var pdf_data = [];
		        if($scope.location.title)
		        {
		            var obj =   {};
		            obj.label   =   "Store";
		            obj.value   =   $scope.location.title;
		            pdf_data.push(obj);
		        }

		        if(SearchingData.fromdate && SearchingData.todate)
		        {
		            var obj =   {};
		            obj.label   =   "Date Range";
		            obj.value   =   SearchingData.fromdate+' ' +'-'+' '+ SearchingData.todate;
		            pdf_data.push(obj);
		        }
		        
		        if(pdf_data.length > 0)
		            ovcdataExportFactory.setPdfHeaderData(pdf_data);
		        /*************PDF Export******************/

		        /**Date Filter Error Message**/
		        if (SearchingData.fromdate && SearchingData.todate ) {
		        	
		            if ($filter('dateFormChange')(SearchingData.fromdate) <= $filter('dateFormChange')(SearchingData.todate)) {
		                $scope.ship.fieldsrequired = false;
		            } else {
		                $scope.ship.fieldsrequired = true;
		                return false;
		            }
		        }
		        
		        var datasrch={
		        	srch:SelectedSku,
	                properties:selectedArray.join(),
	                productProperty:property,
	                productVariants:variants,
		        	sku:sku,
		        	fromdate:$filter('dateFormChange')(SearchingData.fromdate),
		        	todate:$filter('dateFormChange')(SearchingData.todate),
		        	locid:shipToStore.join(),
		        	page:offset
		        }
		        Data.post('/getProductPerformance', {data:datasrch}).then(function(data) {
		            if(sku){
		            	$scope.action.loadsku 	= true;
		            }
		            if(data.error){
		        		var output = {
		                    "status": data.error.status,
		                    "message": data.error.message
		                };
		                Data.toast(output);
		        	}
		        	if(data.result){
		        		productPerformanceList.push(data.result.products);
		        	}
		        	$scope.performancelist 	=	productPerformanceList;
		        	if($scope.performancelist.length > 0)
		        		$scope.action.showrefine	=	true;
		        });

		        

		        
		        $scope.loaded_style    = '';

		        $scope.form.skuresult  = '';

		        if(sessionStorage.skuid && sessionStorage.locationname){
		        	delete sessionStorage.skuid;
		        	delete sessionStorage.locationname;
		        }
		    }else{
		    	var output = {"status": "error","message": $scope.ovcLabel.performance.toast.location};
		        Data.toast(output);
		    }
			$scope.form.skuresult  		= 	''; 	
		}

	};

	$scope.showtablehover 	=	function(index,name,listData){
		if(listData != undefined && listData != '' && listData != {}){
			$scope.storelength 	=	Object.keys(listData).length;
		}else{
			$scope.storelength 	=	0;
		}
		$scope.showlist 	=	index+name;
		$scope.showtable 	=	true;
	}
	$scope.showtableout 	=	function(){
		$scope.showtable 	=	false;
		$scope.showlist 	=	'';
		$scope.storelength 	=	0;
	}

	$timeout(function(){
		 angular.element('#looksearch').focus();
	},2100);


    /*****Select product using sku and name******/
	$scope.dosrchproduct = function(typedthings){
		var storevalue             =   ($scope.store) || '';
		var loc_id	=	storevalue;
		if(typedthings != '...' &&  typedthings != '' && typedthings != undefined && loc_id != undefined){

		if(typedthings.indexOf('~')){
                skuvaluetyping      =   typedthings.split('~');
                skutyped            =   skuvaluetyping[0];
            }
            else{
                skutyped         =   typedthings;
            }
		
		if(!$scope.form.skuresult){
			$scope.form.productsku  = 	[];
		}
			ovcDash.get('apis/ang_search_products?srch='+skutyped+'&locid='+encodeURIComponent(loc_id)).then(function (data) {
					
				if(data.status != 'error'){
                        var rows = [];
                        var allvals = [];
                        var styleData = [];
                        var groupData = [];
                        var selectedbarcode = [];
                        var countbarcode = 0;
					
                        angular.forEach(data, function(item) {
                               if (item.ProductTbl.mmGroupId && groupData.indexOf(item.ProductTbl.mmGroupId) == -1) {
                                var value = item.ProductTbl.mmGroupName;
                                rows.push({
                                    value: value,
                                    labelclass: 'search_products_group',
                                    labeldata:'Merchandise Group'
                                });
                                groupData.push(item.ProductTbl.mmGroupId);
                            } 
                            if (styleData.indexOf(item.ProductTbl.productCode) == -1 && ($scope.config.showskugroup)) {
                                var value = item.ProductTbl.productCode + '~' + item.ProductTbl.styleDescription;
                                rows.push({
                                    value: value,
                                    labelclass:"search_products_style",
                                    labeldata: 'Style'
                                });
                                styleData.push(item.ProductTbl.productCode);
                            } 
                            if (styleData.indexOf(item.ProductTbl.barCode) == -1) {
                                var value = item.ProductTbl.sku  + '~' + item.ProductTbl.name + '~' +item.ProductTbl.barCode;
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
					$scope.form.productsku 		=	rows;

					if(allvals.length == 1 && countbarcode == 1 ){
                    	$scope.form.skuresult  = selectedbarcode[0];
                    	$scope.ship  =  $scope.form 
                    	$scope.searchproduct_perform();
                    }	
				}
				else{
                  var output = {
                      "status": "error",
                      "message": $scope.ovcLabel.performance.toast.noproducts
                  };
                  Data.toast(output);
                  $scope.form.skuresult 	=	'';
                  $scope.form.productsku 	=	[];
               }	
			});
		}else{
			$scope.form.selectedSku	=	'';
		}
	};

	/***Selected sku Function***/
	$scope.doSelectproduct = function(suggestion){
		var sku_select 				= 	suggestion.split('~');
		$scope.form.selectedSku		=	sku_select[0];
		$scope.form.skuresult 		=	suggestion;
		$scope.searchproduct_perform();
	};

	/*****Select product using product code *****/
	$scope.srchprstyle = function(typedthings){
		var storevalue             =   ($scope.store) || '';
		var loc_id	=	storevalue;
		if(typedthings != '...' && typedthings != '' && typedthings != undefined && loc_id != undefined){
			ovcDash.get('apis/ang_style_allproducts?srch='+typedthings+'&locid='+encodeURIComponent(loc_id)).then(function (data) {	
				if((data.status != 'error')){
					var rows = [];
					angular.forEach(data,function(item) {
						rows.push(item.ProductTbl.productCode+'~'+item.ProductTbl.name);
					});
					$scope.form.productstyles 	= rows;
				}
			});
		}else{
			$scope.form.selectedStyle		=		'';
		}
  	};

  	/***Selected Style Function***/
  	$scope.Selectprstyle = function(suggestion){
		var style_select 			= suggestion.split('~');
		$scope.form.selectedStyle 	=	style_select[0];
	//$scope.form.skuresult		=	'';
  	};
  		var SearchingData 	=	[];



	/****load all sku***/
    $scope.loadallsku 	=	function(stylecode){
	 	$scope.loaded_style 		=	stylecode.productCode;
	 	$scope.loadall 				=	true;
	 	$scope.searchproduct_perform();
	};

	/***For Refine Data Hide/show and Data for table**/
	angular.forEach(Pro_perform,function(trules,key) {
		angular.forEach(trules,function(trules2,key2) {
				if(key2 === "STYLEDETAILS")
					styledata 	=	trules2;

				if(key2 === "SKUDETAILS")
					skudata 	=	trules2;
		});
	});

	angular.forEach(styledata,function(item) {
		item.parent1='slpcalc';
	});
	angular.forEach(skudata,function(item) {
		item.parent1='slpcalc';
	});
	$scope.ship.style 	=	styledata;
	$scope.ship.sku 	=	skudata;

	$scope.action.selection		=	[];
	$scope.action.unselection	=	[];

	/**For Refine Done**/
	$scope.refineremove	=	function(){
		var elem = document.querySelector('table');

		for(i=0;i< $scope.action.selection.length;i++){
			var myEl1 = angular.element( document.querySelectorAll( '.'+$scope.action.selection[i] ) );
			myEl1.removeClass('ng-hide');
			myEl1.removeAttr( "data-hidePdf"); //For hide the Data in PDF
			myEl1.removeClass('hideExport'); //For hide the Data in Excel

		}
		
		for(i=0;i< $scope.action.unselection.length;i++){
			var myEl = angular.element( document.querySelectorAll( '.'+$scope.action.unselection[i] ) );
			myEl.addClass('ng-hide');
			myEl.addClass('hideExport'); //For hide the Data in Excel 
			$(myEl).attr("data-hidePdf",true);  //For hide the Data in PDF 
		}
		
		$scope.refinecancel();
	};

	/**Refine Cansel Function**/
	$scope.refinecancel	=	function(){
		$timeout(function() {
				angular.element('#cancel_btn').trigger('click');
			}, 1);
	};	

	/**For Toggle the all Details**/
	$scope.toggleSelection = function(ckecked) {
		var idx = $scope.action.selection.indexOf(ckecked.id);
		var idxun = $scope.action.unselection.indexOf(ckecked.id);
		
		if(ckecked.selected	==	false){
			
			if($scope.action.unselection.indexOf(ckecked.id) == -1) {
			   $scope.action.unselection.push(ckecked.id);
			}
			$scope.action.selection.splice(idx, 1);
		}else{
			
			if($scope.action.selection.indexOf(ckecked.id) == -1) {
			   $scope.action.selection.push(ckecked.id);
			}
			$scope.action.unselection.splice(idxun, 1);
		}
		
		var bal1chk	=	true;
		angular.forEach($scope.ship.style, function (value,key) {
			if( ! value.selected)
			{
				bal1chk	=	false;
			}
		});
		$scope.action.bal1checked = bal1chk;

		var bal2chk	=	true;
		angular.forEach($scope.ship.sku, function (value,key) {
			if( ! value.selected)
			{
				bal2chk	=	false;		  
			}
		});
		
		$scope.action.bal2checked = bal2chk;
	};

	/**For Select All The Details**/
	$scope.selectAll = function(obj, objects){   
		obj	=	! obj;
		
		angular.forEach(objects, function (item) {
		   item.selected = ! obj;
			
			var idxs = $scope.action.selection.indexOf(item.id);
			var idxuns = $scope.action.unselection.indexOf(item.id);
			
			if(!item.selected){
				if($scope.action.unselection.indexOf(item.id) == -1) {
				   $scope.action.unselection.push(item.id);
				}
				$scope.action.selection.splice(idxs, 1);
			}else{
				if($scope.action.selection.indexOf(item.id) == -1) {
				   $scope.action.selection.push(item.id);
				}
				$scope.action.unselection.splice(idxuns, 1);
			}
        });
   };

	/**Date Filter Error msg Shown**/
	$scope.change_todate = function() {
        $scope.ship.fieldsrequired = false;
    };

    $scope.change_frdate = function() {
        $scope.ship.fieldsrequired = false;
    };
    
    //Back to Stocklookup Function //
	 $scope.back=function(){
       var SessionproData   =   JSON.parse(sessionStorage.prodata);
       sessionStorage.commonSku    =   SessionproData.sku+'~'+SessionproData.description+'~'+SessionproData.barCode;
       $state.go('ovc.stocklookup-list');
	}
    /**Refine open/close**/
    $scope.refineopen=function(){		
		var myEl = angular.element( document.querySelector( '#balance_pop' ) ); 
		myEl.toggleClass('open');
	};	
	var storesession=[];
	
	//FOR CLEAR SESSION 
	if($stateParams.fullList){
		delete sessionStorage.prodata;
	}
});
