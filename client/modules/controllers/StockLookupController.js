
var app =	angular.module('OVCstockApp',['ui.bootstrap.treeview','roleConfig','OVCstockApp.advancedStock','ovcdataExport']);
/*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module			:       Advanced StockLookup controller I
*
*    Developer		:       Sivaprakash
*
*    Date			:       27/07/2016
*
*    Version		:        1.0
*
**********************************************************************/

/* Popover for Inventory Details  By Jegan*/
app.directive('invetoryDetails', ['$compile', function($compile){
	return {
        restrict: 'E',
        scope : true,
        templateUrl: 'invDetails.html',
        link: function(scope,elem,attrs){
        	if(attrs.tabid){
        	scope.tableid = attrs.tabid;
        	}
        }
    };
}]);

app.controller('stockCtrl',function ($rootScope, $scope, $state,$stateParams,  $timeout,  Data, ovcDash, 
 PRICELIST, $compile, TreeViewService, roleConfigService,$window , Utils){  

	var user_detail 	=	$rootScope.globals['currentUser'];
	var id_user 		=	user_detail['username'];
	$scope.label 		=	{};
	$scope.dropdown 	=	{};
	$scope.loadmat		=	false;
	$scope.action   	=   {};
	$scope.ship 		=	{};
	$scope.action.alllocations = {};
	$scope.selSkuData 	= 	{};
	$scope.lookup 		=	{};
	$scope.action.negative_balance = {};
	$scope.action.skutoselect  = '';
	$scope.pagination 	=	{};
	$scope.errormsg 	=	false;
	$rootScope.showExportFunction 	=	false;
	var count 			=	1;
	$scope.shipData 	=	{};
	//For Findit Redirection
	if(sessionStorage.stocksku || sessionStorage.commonSku){

		if(sessionStorage.stocksku){
			$scope.findit = true;
		}
		if(sessionStorage.location){
			var locationlist  = JSON.parse(sessionStorage.location);
		}
		// if(sessionStorage.selectedresult){
		// 	$scope.ship.result = sessionStorage.selectedresult;
		// }
	}

	if(sessionStorage.negbalances){
	        $scope.dash = true;
	}
	
	//=============Print The Balance Table ============== //RSP Added
	 $scope.printStocklookup 	= 	function(printSectionId) {

	 	//If popup is opened To check this
	 	if($('pop-up').length  > 0){
	 		$('.custom-popover').popover('hide');
	 	}

        var innerContents 		= 	document.getElementById(printSectionId).innerHTML;
        var popupWinindow 		= 	window.open();
        popupWinindow.document.write('<html><head><link rel="stylesheet" type="text/css" href="bower_components/bootstrap/dist/css/bootstrap.min.css" /><link rel="stylesheet" type="text/css" href="styles/print.css" /></head><div><h2>Stock Lookup <img class="pull-right" src="images/logo_innerpage.png" style="margin-bottom:15px;"></h2> </div><body onload="window.focus();window.print();">' + innerContents + '</html>');
        popupWinindow.document.close();
      }
		function configruation (){
			/*Getting configuration*/
		    Utils.configurations().then( function ( config ) {
		        if( config ){
		            $scope.config_data 	= 	config.action.stockPr;
			    	$scope.config 		=	config;

				    //Configration Property For Stocklookup//
			        var property 	=	$scope.config.productProperty ? $scope.config.productProperty.join():null;
			        $scope.propertyval = property;
			        //Get Propert value Dynamic//
			         ovcDash.get('apis/ang_config_properties?type='+'value'+'&propertyvalue='+property+'&variantstype=&productProperty=true&productAttribute=false').then(function (results) {
			         	if(results != undefined && results != ''){
			          	     $scope.dropdownDashCall 		=	results;
			         	}
			         }).then(function(){
		    			$scope.getStores();
			         });
			        
		        }
		    });
		}

	$scope.back=function(){
		$state.go('ovc.stocklookup-findit');
	}

	$scope.backtodash=function(){
		$state.go('ovc.dashboard-report');
	}


	//--Hierarchy Locations --//
	$scope.getStores = function() {
		Utils.hierarchylocation().then(function(results){
			var locationlist ={};
			var locationobject = results.hierarchy;
            angular.forEach(locationobject, function(item) {
                locationlist[item.id]   =   item.name;
            });
            $scope.action.alllocations=  locationlist;
            $scope.storeLocData	=	TreeViewService.getLocData(results);
            TreeViewService.toggleAll($scope.storeLocData[0]);

            if(sessionStorage.negbalances){
           	  	$scope.action.negative_balance  = JSON.parse(sessionStorage.negbalances);
           	  	if($scope.action.negative_balance.locationId){
           			$scope.ship.locationId 		=  $scope.action.negative_balance.locationId;
           			$scope.locationDisplayName	=  locationlist[$scope.action.negative_balance.locationId];
           		}else{
           			$scope.selectNode($scope.storeLocData[0]);
           		}
	           	if( $scope.action.negative_balance.sku_value != ''){
					$scope.ship.result =  $scope.action.negative_balance.sku_value;
				}
				$scope.startsearch();
				
           }else if(sessionStorage.location){
			   	var locdata=JSON.parse(sessionStorage.location);
			    $scope.ship.locationId= locdata.id;
			   	$scope.locationDisplayName=	locationlist[locdata.id];
			   	if(sessionStorage.stocksku || sessionStorage.commonSku){
					 $scope.ship.result 	 =	sessionStorage.stocksku ? sessionStorage.stocksku : sessionStorage.commonSku;
		    	}
			}else{
	            $scope.selectNode($scope.storeLocData[0]);
			}
			$scope.stock_product($scope.ship.locationId);	
        });
	};
	// $scope.getStores();

	$scope.startsearch = function(){
		$timeout(function() {
			angular.element('#'+$scope.ship.locationId).trigger('click');
			$scope.searchStocklookup($scope.ship);
		}, 500);
	}
	
	$scope.searchLocation = function(location){
        $scope.action.filterLocation    =   location;

    };

	$timeout(function(){
		 angular.element('#looksearch').focus();
	},2000);

	$('#slpsearch :input').attr('disabled', true);
	$('#stylsearch :input').attr('disabled', true);
	
	$scope.stock_product=function(data){
		$timeout(function(){
		 	angular.element('#looksearch').focus();
		},500);
		if((data !=undefined) &&(data !="")){
			 $('#slpsearch :input').removeAttr('disabled');
			 $('#stylsearch :input').removeAttr('disabled');
			 // document.getElementById('looksearch').focus()
		}else{
			$('#slpsearch :input').attr('disabled', true);
			$('#stylsearch :input').attr('disabled', true);
		}
	};

	$scope.typeddata='';
	$scope.refineselected=false;
	//$scope.listPROD = [];
	$scope.inventoryDetailsdata = {};
	$scope.inventoryDetails = [];
	
	$scope.addprstyles=function(shipData,index,searchData,skuselection){
	  	$scope.shipData = {locationId: $scope.ship.locationId,  result:$scope.ship.result,styleresult:shipData,mode:"readOnly",selectedresult:$scope.ship.result };
			$timeout(function() {
			  $scope.styleitems	=	$scope.shipData;
			}, 0);

			var selsku='';
			$scope.showstyle 	= 	true;


			if(skuselection == 'SKU'){
				var skuconfig 	=	'SKU';
			}else{
				var skuconfig 	=	'STYLE';
				selsku=$scope.action.skutoselect;
			}
			$scope.errormsg 	=	false;
			count 				=	1;
			angular.element(document.getElementById(index))
					.html($compile('<advanced-stocklookup locationId="'+$scope.ship.locationId+'" selsku="'+selsku+'" styleresult="'+shipData+'" index="'+index+'" skuconfig="'+skuconfig+'" searchdata="'+searchData+'"></advanced-stocklookup>')($scope));
			$scope.ship.result  = '';
	};
  
	/*****Select product using sku and name******/
	$scope.dosrchproduct = function(typedthings){
		$scope.transactionstyles	=	[];
			var loc_id=$scope.ship.locationId;
		if(typedthings != '...' && typedthings != '' && typedthings != undefined){
			var loc_id=$scope.ship.locationId;
			
			if((loc_id != undefined)){
				var sku =	typedthings.split('~').length==3 ? true:'';
	  			 var skuvaluetyping      =   typedthings.split('~');
	             var skutyped            =   skuvaluetyping[0];
				ovcDash.get('apis/ang_search_products?srch='+skutyped+'&locid='+encodeURIComponent(loc_id)).then(function (data) {
                    if (data.status != 'error') {
                    	$scope.errormsg 	=	true;
                        var rows = [];
                        var allvals = [];
                        var styleData = [];
                        var groupData = [];
                        var selectedbarcode = [];
                        var countbarcode = 0;
                        angular.forEach(data, function(item) {
                               if (item.ProductTbl.mmGroupId && groupData.indexOf(item.ProductTbl.mmGroupId) == -1 && ($scope.config.showskugroup)) {
                                var value = item.ProductTbl.mmGroupName;
                                rows.push({
                                    value: value,
                                    labelclass: 'search_products_group',
                                    labeldata:'Merchandise Group'
                                });
                                groupData.push(item.ProductTbl.mmGroupId);
                            } 
                            if ((styleData.indexOf(item.ProductTbl.productCode) == -1) && ($scope.config.showskugroup)) {
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
                        $scope.transactions = rows;
                        $scope.allvalues    = allvals;
             
                        if($scope.allvalues.length == 1 && countbarcode == 1 ){
                        	$scope.shipData.result  = selectedbarcode[0];
                        	$scope.transactions = [];
                        	$scope.doSelectproduct(selectedbarcode[0]);
                        }

                        //For empty the acto complete Data and proper error message
                        if(!$scope.ship.result){

                          	$scope.transactions = 	[];
                        }
                    }
                    else{
                        var output = {
                          "status": "error",
                          "message": $scope.ovcLabel.balanceInquiry.list.no_product
                        };
                        $scope.transactions = 	[];
                       	$scope.ship.result 	=	'';
                       	Data.toast(output);
                    }

				},function(error){

				});
			}else{
			
				$timeout(function() {
					angular.element('#loclookup').trigger('click');
				}, 1);
			
			}
		}
	};
  
	$scope.myCustomValidator = function(text){		
		return true;
	};
	
	$scope.doSelectproduct = function(suggestion){
		var selects = suggestion.split('~');
		var selectedpr=suggestion;
		if(selects.length == '3'){
			$scope.action.skutoselect = selects[0];
		}
		$scope.action.count ++;
		delete sessionStorage.lookupdata;
		searchSessions 	   		=	{};
		$scope.pageExisting 	=	'';
	   	delete sessionStorage.lookupsku;
		$scope.shipData = {locationId: $scope.ship.locationId,  result:selectedpr,styleresult:'',mode:"readOnly",selectedresult:selectedpr};
		$scope.searchStocklookup($scope.shipData);
	};
	$scope.onclickproduct 	=	function(ship){
		var selects = ship.result.split('~');
		var selectedpr=ship.result;
		if(selects.length == '3'){
			$scope.action.skutoselect = selects[0];
		}
		$scope.action.count ++;
		delete sessionStorage.lookupdata;
		searchSessions 	   		=	{};
		$scope.pageExisting 	=	'';
	   	delete sessionStorage.lookupsku;
		$scope.shipData = {locationId: $scope.ship.locationId,  result:selectedpr,styleresult:'',mode:"readOnly",selectedresult:selectedpr};
		
		if(selects.length > 1	){

			$scope.searchStocklookup($scope.shipData);
		}
	}
	// Jegan Added
	$scope.getFunctions = function(shipmentData,Data, configData){
		$scope.showStylesData[Data] 		=	! $scope.showStylesData[Data] ;
		if (shipmentData && shipmentData != '' && shipmentData != undefined) {

			var searchDatas  	=	$scope.shipData.result ? $scope.shipData.result.split('~') : [];

			var   searchData	='';
			if(searchDatas.length == '3' || $scope.action.negative_balance.sku_values){ 
				searchData	='SKU';
				$scope.showStylesData[Data] 		=	true ;
			}else if(searchDatas.length == '2'){ 
				searchData='style';
			}

			if($scope.config.showskugroup){
				$scope.showError = false;
				if($scope.showStylesData[Data])
				$scope.addprstyles(shipmentData, Data,searchData);
			}
			
			if(configData == 'SKU'){
				$scope.showError = false;
				if($scope.showStylesData[Data])
				$scope.addprstyles(shipmentData, Data,searchData, configData);
			}
			
			//For empty search result 
			if(searchDatas.length == '3' || $scope.action.negative_balance.sku_values){ 
				$scope.ship.result  =	'';
				$scope.transactions =	[];
			}
		}
	};
  
	//For Pagination
	$scope.pagination.currentPage	=	1;
	$scope.pagination.entryLimit	=	$rootScope.PAGE_SIZE;

	$scope.searchStocklookup 	=	function(Datastklookup){
		
		if( !Datastklookup.result){
			sessionStorage.selectedresult = '';
		}else{
			sessionStorage.selectedresult = Datastklookup.result;
		}
		
		$scope.ship.selectedresult =	Datastklookup.result;
		$scope.showStylesData 	=	{};
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
			if($scope.ship.locationId == '' || $scope.ship.locationId == undefined){
				var output = {
	        		"status": "error",
	         		"message": $scope.ovcLabel.balanceInquiry.error.location_not_empty
	         	};
	            Data.toast(output);
	 		}


			$scope.divheight 	=	$("#searchboxstklook").height();

			//Get Values From the Properties value //

			var searchResult 	=	Datastklookup.result ? Datastklookup.result.split('~') : '';

			var datasrchsku 	=	'';
			var sku 			=	'';
			var style 			=	'';
			$scope.showError 	= 	false;

			if(searchResult != undefined) 
				sku	=	searchResult[0] ? searchResult[0] : '';

			var locid 			= 	$scope.ship.locationId;

			if(searchResult != undefined){ 
				var datasrchsku =	searchResult.length==3?true:'';
				$scope.SKUtrue	=	datasrchsku;
			}
			if(!$scope.config.showskugroup){
				if(!Datastklookup.result && !datasrchsku){
					var output = {
		        		"status": "error",
		         		"message": $scope.ovcLabel.balanceInquiry.error.slct_sku
		         	};
		            Data.toast(output);
		            return false;
				}
			}

			if(datasrchsku 	!= true){
				localStorage.srchValue	=	sku;
			}
			else{
				$scope.action.skutoselect 	=	sku;
				delete localStorage.srchValue;
			}

			if($scope.config.showskugroup)
				var configvalue 	=	"style";

			if(!$scope.config.showskugroup)
				var configvalue 	=	"sku";

			if($scope.propertyval){
				$scope.header 			= 	$scope.propertyval.split(',');
				$scope.propertyArray 	=	$scope.propertyval.split(',');
			}

			if($scope.config.showskugroup)
				$scope.headervalue 	=	['Style','description'];
			if(!$scope.config.showskugroup)
				$scope.headervalue 	=	['SKU','description'];

			$scope.header 	=	$scope.headervalue.concat($scope.header);
			$scope.skuValues= 	'';
			var datasrch	=	{
		        	srch		:sku + style,
	                properties	:selectedArray.join(),
	                skuValues	:$scope.skuValues,
		        	sku			:datasrchsku,
		        	locationId 	:locid,
		        	config 		:configvalue,
		        	propertyName:$scope.propertyval,
			        limit		:$scope.pagination.entryLimit
			        //page		:$scope.pagination.currentPage
		    }
		    if($scope.findSameDataSrch) {
		    	delete $scope.findSameDataSrch.page;
		    	if(angular.equals(datasrch, $scope.findSameDataSrch)) {
		    		datasrch['page'] = $scope.pagination.currentPage;
		    	} else {
		    		datasrch['page'] = 1;
		    	}
		    }

		    $scope.findSameDataSrch = datasrch;
		       
			ovcDash.post('apis/ang_stocklookup_service',{data:datasrch}).then(function (ReportData) {
				$scope.StyleArray 	=	[];
				$scope.pagination.filteredItems 	=	ReportData.TotalCount;
				if(ReportData && ReportData.status != "error"){
					$scope.StyleArray 	= ReportData.products;
					$timeout(function() {
						if($scope.config.showskugroup && datasrchsku && $scope.StyleArray.length >0){
							angular.forEach($scope.StyleArray, function(value,key){
								$scope.getFunctions(value.Style,key);
							});
						}
						if(!$scope.config.showskugroup && datasrchsku && $scope.StyleArray.length >0){
							angular.forEach($scope.StyleArray, function(value,key){

								$scope.getFunctions(value.SKU,key,'SKU');
							});
						}
						//*** For saved style in pagination condition to reopened ***//
						if(sessionStorage.lookupdata){
			        		var styleslist  = JSON.parse(sessionStorage.lookupdata);
			        		if(styleslist[$scope.pagination.currentPage]){
			        			angular.forEach(styleslist[$scope.pagination.currentPage],function(style,index){
				        			$timeout(function(){
				        				$scope.getFunctions(style,index);
				        			}, 100);
				        		});
			        		}
			        	}
					}, 500);
				}else{
					$scope.lookup.showtable 	=	false;
					var output = {
		        		"status": "error",
		         		"message": $scope.ovcLabel.balanceInquiry.error.no_result
		         	};
	            	Data.toast(output);
				}
				if($scope.StyleArray.length != 0 && ReportData.status != "error"){
					$scope.lookup.showtable 	=	true;
				}
				else{
	                	count 	=	1;
				}
				if(sessionStorage.negbalances){
				$timeout(function() {
							$scope.getFunctions($scope.StyleArray[0].style,0);
						}, 500);	
				}
			},function(error){
			}).then(function(){
				$timeout(function() {
					$scope.tableWidth = $("#table_width").width();
					angular.element('#looksearch').focus();
				});
			});
			
			delete sessionStorage.negbalances;
			if(datasrchsku == ''){
				$scope.ship.result 	=	'';
				$scope.transactions = [];
			}
			$scope.transactions = [];
	};

  	$scope.SelectedInventory = '';
  					        
	$scope.fillTableElements = function (data) {
		// busy 	=	true;
		$scope.loadval = 0;
		$scope.list = data;
		$scope.currentPages = 1; //current page
		$scope.entryLimits = 10; //max no of items to display in a page
		$scope.filteredItems = $scope.list.length; //Initially for no filter 
		$timeout(function() { $scope.doneclick(); }, 1200);
	};
	
  /* delete tr from table after adding products */
	$scope.removeRow = function (idx) {
		if(idx != -1) {
			$scope.list.splice(idx, 1);
		}
	};

	//** For pagination opened Style save Function **//
	var searchSessions 	=	{};
	$scope.pageExisting =   '';
	$scope.setsessions  = function(data,index,type,page){
		if(page){
			if($scope.pageExisting != page)
			searchSessions[page] 		=	{};

			searchSessions[page][index] =	data;
			$scope.pageExisting 		=	page;
		}
		var styledata = JSON.stringify(searchSessions);
   		sessionStorage.lookupdata = styledata;
	}
  
	$scope.selection 	=	[];
	$scope.unselection 	=	[];

   $scope.pageChanged  =   function(shipped){
       //$scope.offset = ($scope.pagination.currentPage - 1) * $scope.pagination.entryLimit;
       // busy 		=	true;
       if(!$scope.SKUtrue){
       	shipped.result	=	localStorage.srchValue;
       }
       $scope.searchStocklookup(shipped);
   };
	
   $scope.clearsessionsku=function(){
	   	delete sessionStorage.listdata; 	
	   	delete sessionStorage.prodata; 	
	   	delete sessionStorage.location;
	   	delete sessionStorage.stocklookupsku;
	   	delete sessionStorage.skuid;
	   	delete sessionStorage.locationname;
	   	delete sessionStorage.commonSku;
	   	delete sessionStorage.stocksku;
   };

   //clear SessionStorage
	if($stateParams.fullList){
		delete sessionStorage.lookupdata;
	   	delete sessionStorage.lookupsku;
		$scope.clearsessionsku();
		$scope.ship.result 	=	'';
	}

	$scope.lookupsubmit = function(){
		delete sessionStorage.lookupdata;
	   	delete sessionStorage.lookupsku;
	}


	//========Product Property Empty==========//
	function selectedPropertyClear(){
		if($scope.dropdownDashCall && $scope.dropdownDashCall.productProperty &&  Object.keys($scope.dropdownDashCall.productProperty).length > 0){
			angular.forEach($scope.dropdownDashCall.productProperty, function(provalue,prokey){
				if(provalue)
		   	 	provalue.reset 	=	true;
		   	});
		}
	}

	$scope.reset_balinquiry=function(){
		searchSessions 	   		=	{};
		$scope.pageExisting 	=	'';
		delete sessionStorage.lookupdata;
	   	delete sessionStorage.lookupsku;
	   	delete sessionStorage.negbalances;
	   	$scope.propertyReset 	=	true;
	   	$rootScope.showExportFunction 	=	false;
	   	$scope.clearsessionsku();
	   	$scope.basiclookup = false;
	   	selectedPropertyClear();
	   	$scope.locationDisplayName                   =   '';
	   	$scope.ship.locationId                       =   '';
	   	$scope.SKUtrue 				=	true;
		$scope.StyleArray 			=	[];
		$scope.lookup.showtable 	=	false;
		$timeout(function() {$scope.getStores()}, 10);
	}
	configruation();
	
	//Export Stocklookup Table //RSP Added
	$scope.exportStocklookupExport 	=	function(selectionClasses){
		var tableClasses 	=	selectionClasses.split('|');
		var exportData 		=	[];
		var finalObj 		=	{};
		// Dynamically Get SKU & Location
		var firstColoumn 	=	['SKU','Store'];
		var firstrow 		=	[];
		firstrow.push($('.getSku').text().trim());
		firstrow.push($scope.locationDisplayName);

		//Temp Variables
		 var columns 		= 	[];
		 var rows			=	[];
		     rows[0]		=	[];
		if(tableClasses.length > 0){
			angular.forEach(tableClasses,function(value){
				//Get the Table to print
				var tableData	=	$('.'+value);
				//Remove the hided elements 
				$(tableData).find('.hideExport').remove(); 
				//Find the Th and Td values 
				$.each($(tableData).find('tr'), function(j, th_data){
		          columns.push($(th_data).find("td:first").text().trim());
		          rows[0].push($(th_data).find("td:nth-child(2)").text().trim() == '-' ? '' : $(th_data).find("td:nth-child(2)").text().trim());
		        });
			});
			//Coloumn merge
			finalObj.columns = firstColoumn.concat(columns);
			finalObj.rows 	=	[]; 	
			finalObj.rows[0]= firstrow.concat(rows[0]);
			exportData.push(finalObj);
			// Export Excel Function
			$('#ExportTablesStocklookup').table2excel({
	            exclude: ".hideExport",
	            name: 'EXPORTEXCEL',
	            filename: $('.getSku').text().trim() + ' Stocklookup', 
	            data_obj : exportData,
	            external : true,
	            exclude_img: true,
	            exclude_links: true,
	            exclude_inputs: true
	      	});
		}
	}
});
