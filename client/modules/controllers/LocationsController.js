// var app = angular.module('OVCstockApp', ['AxelSoft','angularValidator']);
var app = angular.module('OVCstockApp', ['ngJsTree','angularValidator','ui.bootstrap.treeview']);

app.controller('getLocations',function ($rootScope,$scope, $state,$location, $http, $timeout,$controller, $stateParams, ovcDash, Data, Utils){  
	var user_detail=$rootScope.globals['currentUser'];
	var user_id=user_detail['username'];
	$scope.loc={};
	$scope.loc.locationId=[];

	$scope.search 				   =	'';
	sessionStorage.doSelectproduct =	'';
	/* get store or locations from mysql service */
	$scope.getStores = function () {
		Utils.userLocation().then(function(results){
			if(results.status=='error'){
				$scope.store_datas = [];
			}else{
				$scope.store_datas = results;
				if($scope.store_datas.length==1){
					$scope.loc.locationId=results[0].id;
				}
			}
		}, function(error){
			console.log('User Location :'+error);
		});
	};
	
	$scope.myCustomValidator = function(text){		
		return true;
	};
	
		/*****Enable and Disable based on Permission and Configuration  manager******/
	$scope.vlistklcn	=	true;
	$scope.molstklcn	=	true;
	$scope.servicefun2 = function() {
		 $rootScope.$watch('ROLES',function(){
			var role_det=$rootScope.ROLES;
			angular.forEach(role_det, function(roles,key) {
				if (key== 'stockingLocations'){

					var viewStockingLocations		=	roles.viewStockingLocations?roles.viewStockingLocations:0;
					var modifyStockingLocations	=	roles.modifyStockingLocations?roles.modifyStockingLocations:0;

					if(viewStockingLocations		==	1){
						$scope.vlistklcn	=	false;
					}

					if(modifyStockingLocations	==	1){
						$scope.vlistklcn	=	false;
						$scope.molstklcn	=	false;
					}
				}
			});
		});
	}
	$scope.servicefun2();
	
	if($stateParams.fullList){
        delete sessionStorage.locationSearchData;
        delete sessionStorage.locationPageLimit;
    }

    if(sessionStorage.locationSearchData){
    	$scope.search 	=	sessionStorage.locationSearchData;
    }

    $scope.entryLimit 	= 	sessionStorage.locationPageLimit ? sessionStorage.locationPageLimit : $rootScope.PAGE_SIZE; //max no of items to display in a page
	
	/* search the locations */
		$scope.applySearchFilter = function() {
		var values = sessionStorage.vals;
		if(values != '' && values != undefined){
			if($scope.search != ''){
				sessionStorage.locationSearchData 	=	$scope.search;
				sessionStorage.locationPageLimit    =   $scope.entryLimit;
				Data.get('/location?locationid='+encodeURIComponent(values)+'&key='+$scope.search).then(function (data) {
					$scope.list = data;
					angular.forEach($scope.list, function(value) {
						value.parentStockingLocationName = values;
						angular.forEach(data, function(values) {
								if(value.parentStockingLocationId == values._id){
									value.parentStockingLocationName = values.stockingLocationId;
								}
							});
						});
						// console.log($scope.list);
						$scope.currentPage = 1; //current page
						$scope.entryLimit = 10; //max no of items to display in a page
						$scope.filteredItems = $scope.list.length; //Initially for no filter  
						$scope.totalItems = $scope.list.length;
						
					});
			}
			else{
				$scope.getstore_lists(sessionStorage.vals);
			}	
		}
	};

    


    
	/* to get lists of stock locations added for the store */	
	$scope.getstore_lists = function (values) {
		if(values != '' && values != undefined){
			sessionStorage.vals = values;
			Data.get('/location?locationid='+encodeURIComponent(values)).then(function (data) {
				$scope.list = data;
				angular.forEach($scope.list, function(value) {
					value.parentStockingLocationName = values;
					angular.forEach(data, function(values) {
						if(value.parentStockingLocationId == values._id){
							value.parentStockingLocationName = values.stockingLocationId;
						}
					});
				});
				// console.log($scope.list);
				$scope.currentPage = 1; //current page
				$scope.entryLimit = $rootScope.PAGE_SIZE; //max no of items to display in a page
				$scope.filteredItems = $scope.list.length; //Initially for no filter  
				$scope.totalItems = $scope.list.length;
				
			});
		}	
	};
	

	/* reset the search options */
	$scope.restSearchFilter = function() {
		delete sessionStorage.locationSearchData;
		$scope.search 		=	'';
		$scope.entryLimit 	= 	$rootScope.PAGE_SIZE;
		$scope.applySearchFilter();
	};

	$scope.setPage = function(pageNo) {
        $scope.currentPage = pageNo;
    };
    
    $scope.filter = function() {
        $timeout(function() { 
            $scope.filteredItems = $scope.filtered.length;
        }, 10);
    };
    $scope.sort_by = function(predicate) {
        $scope.predicate = predicate;
        $scope.reverse = !$scope.reverse;
    };
   
	$scope.title = 'Add';
	$scope.getStores();
	
   if(sessionStorage.vals){
		var path = $location.path();
		// var paths = path.substring(0, path.lastIndexOf('#/'));
		var paths = path.substring(path.lastIndexOf("/") + 1, path.length);
		// console.log($location);
		// console.log(paths);
		$scope.loc = {locationId:sessionStorage.vals};
		if(paths != 'treeview'){
			$scope.applySearchFilter();
		}
   }

});

app.controller('AddLocations',function ($rootScope,$scope,  $state, $http, $timeout,$controller, ovcDash, Data, Utils){  
	
	var user_detail=$rootScope.globals['currentUser'];
	var user_id=user_detail['username'];
	$scope.loc={};
	$scope.loc.locationId=[];
	/* get store or locations from mysql service */
	$scope.getStores = function () {
		Utils.userLocation().then(function(results){
			if(results.status=='error'){
				$scope.store_datas = [];
			}else{
			$scope.store_datas = results;
			if($scope.store_datas.length==1){
				$scope.loc.locationId=results[0].id;
			}
			}
		}, function(error){
			console.log('UserLocation : '+ error);
		});
	};
	
	$scope.myCustomValidator = function(text){		
		return true;
	};
	
	$scope.parent_loc_datas = [];
	
	/* get stock locations based on values  */
	$scope.getparent_datas = function (values) {
		if(values != '' && values != undefined){
			sessionStorage.vals = values;
			Data.get('/location?locationid='+ encodeURIComponent(values)).then(function (data) {
				$scope.parent_loc_datas = data;
				$scope.filteredItems = $scope.parent_loc_datas.length; //Initially for no filter  
			});
		}	
	};
	
	/* add location to micro service */
	$scope.addLocation = function (locs) {
		Data.put('/location', {
			data: locs
		}).then(function (results) {
			if (results.error) {
				var error = {"status":"error","message":"Failed to add, '"+locs.stockingLocationId+"' Stock Location Id is already exists."};
				Data.toast(error);
			}else{
				var succ = {"status":"success","message":$scope.ovcLabel.stockLocation.toast.location_add};
				Data.toast(succ);
				$state.go('ovc.location-list');
			}
		});
	};  
  
	$scope.title = 'Add';
	$scope.getStores();
	
   if(sessionStorage.vals){
		$scope.loc = {locationId:sessionStorage.vals};
		$scope.getparent_datas(sessionStorage.vals);
   }
});

app.controller('editLocations',function ($rootScope,$scope,  $state, $http, $stateParams, $timeout,$controller,
 $compile, ovcDash, Data/*, TreeViewService*/){ 
 	var user_detail				     	=	$rootScope.globals['currentUser'];
	var id_user					     	=	user_detail['username'];
	$scope.product_detail		     	=	{};
	$scope.loc_add				     	= 	{};
	$scope.action                    	= 	{};
	$scope.product_detail.uomvalues  	= 	{};
	$scope.product_detail.alluoms    	= 	{};
	//$scope.product_detail.locations   = {};
	var newline   					 	= 	0;
	var linedetails                     = 	[];
	$scope.product_detail.allproducts 	= 	[];
	$scope.product_detail.addedproducts = 	[];
	$scope.product_detail.list          = 	[];
	//var skuslist	=	[];
	var addedskus 		   				= 	[];
    $scope.changedSkus	  				= 	[];
	$scope.product_detail.prod_detail	= 	[];
	var price_detail 					=	[];
	$scope.product_detail.allproducts2  =	[];
    $scope.oldpids 						=	[];
    $scope.changedSkus					=	[];
    $scope.product_detail.styleskus		=	[];
    $scope.product_detail.locations		=	[];
    
  	if( $stateParams.productdetail ==	'true'){
  		$timeout(function() {
		angular.element('#locprod_detail').trigger('click');
		 }, 1);
  	}

	$scope.myCustomValidator = function(text){		
		return true;
	};

	$scope.searchLocation = function(location){
        $scope.action.filterLocation    =   location;
    };

	/*******************get uom **********/
    $scope.uomservice = function() {
        Data.get('/uom').then(function(results) {
            var uomdatas = [];
            angular.forEach(results, function(values) {
                if ((values.isActive) && (values.uomId != undefined) && (values.uomId != '') && (values.description != undefined) && (values.description != '')) {
                    var newobj = {
                        name: values.description,
                        id: values.uomId,
						value: values.uomId
                    }
                    uomdatas.push(newobj);
					$scope.product_detail.uomvalues[values.uomId]=values.description;
                }
            });
            $scope.product_detail.alluoms = uomdatas;
        });
    }
	$scope.uomservice();
	
		/*****Enable and Disable based on Permission and Configuration  manager******/
	$scope.vlistklcn	=	true;
	$scope.molstklcn	=	true;
	$scope.servicefun2 = function() {
		 $rootScope.$watch('ROLES',function(){
			var role_det=$rootScope.ROLES;
			angular.forEach(role_det, function(roles,key) {
				if (key== 'stockingLocations'){
					var viewStockingLocations		=	roles.viewStockingLocations?roles.viewStockingLocations:0;
					var modifyStockingLocations	=	roles.modifyStockingLocations?roles.modifyStockingLocations:0;

					if(viewStockingLocations		==	1){
						$scope.vlistklcn	=	false;
					}

					if(modifyStockingLocations	==	1){
						$scope.vlistklcn	=	false;
						$scope.molstklcn	=	false;
					}
				}
			});
		});
		
	}
	$scope.servicefun2();
	var locationid = $stateParams.locationid; 
	
	if(locationid != ''){
		var list_locations={};
		Data.get('/location?id='+ encodeURIComponent(locationid)).then(function (data) {
			if(data != ''){
				data.parentStockingLocationName = $stateParams.parentName;
				$scope.loc = data;
				$scope.isactive = data.isActive;
				$scope.editlocname=data.locationName;
				$scope.editloc_name=$scope.editlocname;
				Data.get('/hierarchyLocations?location='+encodeURIComponent($scope.loc.locationId)).then(function (response) {
		         	if((response.error ==undefined) && (response !='') ){
		         		var loc_array=[];
		         		angular.forEach(response, function(values) {
			            	list_locations[values.stockingLocationId]=values.name;
			            	var newobj={
			            		id:values.stockingLocationId,
			            		displayName:values.locationName
			            	};
			            	loc_array.push(newobj);
			            });

			            $scope.product_detail.locations	= loc_array;
		         	}
		            
					Data.get('/locationitem?locationid='+ encodeURIComponent($scope.loc.stockingLocationId)).then(function (locdetail) {
						if((locdetail.error == undefined) && (locdetail !='')){
							
							var allskuslist=[];
							angular.forEach(locdetail, function(value) {
								var newobj	=	{
										id:value._id,
		                                lineNumber : value.lineNumber,
										sku:value.SKU,
										//name: value.name,
										description: value.productDescription,
										restockFromLocation:value.restockingLocation,
										locationId:value.locationId,
										qty: value.qty,
										selectedUOM: value.productUom,
										style:value.productCode,
										styleDescription:value.styleDescription,
										styleColor:value.styleColor,
										waist:value.waist,
										length:value.length,
										size:value.size
									};
								allskuslist.push(newobj);	
							});

							$scope.product_detail.list=allskuslist;

						}
					});

				});
			}
		});
	}else{
		var succ = {"status":"error","message":$scope.ovcLabel.stockLocation.toast.locationId_missing};
		Data.toast(succ);
		$state.go('ovc.location-list');
	}
	$scope.title = 'Edit';
	
	/* edit the location in micro service */
	$scope.editLocNode = function (locs) {
		Data.post('/location/'+locs._id, {
			data: locs
		}).then(function (results) {
			if (!results.ok) {
				// console.log(results);
				var error = {"status":"error","message":"Failed to update, '"+locs.stockingLocationId+"' Stock Location Id is already exists."};
				Data.toast(error);
			}else{
				var succ = {"status":"success","message":$scope.ovcLabel.stockLocation.toast.location_update };
				Data.toast(succ);
				$state.go('ovc.location-list');
			}
		});  
	};  

    /******SKU Search Product******/
    $scope.dosrchproduct = function(typedthings) {
        if (typedthings != '...' && typedthings != '' && typedthings != undefined) {
        	ovcDash.get('apis/ang_loc_products?srch=' + typedthings + '&locid=' + encodeURIComponent($scope.loc.locationId)).then(function(data) {
				if (data.status != 'error') {
					var rows 	= [];
					var allvals = [];
					angular.forEach(data, function(item) {
						rows.push(item.ProductTbl.sku + '~' + item.ProductTbl.name+'~'+item.ProductTbl.barCode);
						allvals.push(item.ProductTbl);
					});
					$scope.product_detail.addedproducts 	= 	rows;
					$scope.product_detail.allproducts 		= 	allvals;
				}
			});
    	}
    };

    /******Search Style to add order item*****/
    $scope.dostylesrch = function(typedthings) {  
		if (typedthings != '...' && typedthings != '' && typedthings != undefined) {
			ovcDash.get('apis/ang_style_products?srch=' + typedthings + '&locid=' + encodeURIComponent($scope.loc.locationId)).then(function(data) {
				if (data.status != 'error') {
					var rows 		= 	[];
					var allvals2 	= 	[];
					angular.forEach(data, function(item) {
						rows.push(item.ProductTbl.productCode + '~' + item.ProductTbl.name);
						allvals2.push(item.ProductTbl);
					});
					$scope.product_detail.styleproducts 	= 	rows;
				}
			});	
    	}
    };

    /****sku / style Select Function*****/
    $scope.doSelectproduct 		= 	function(selected) {
    	var sku_array			=	selected.split('~');
    	$scope.loc_add.sku_select 	=	sku_array[0];
    };

    $scope.dostyleselect	=	function(selected){
    	var style_array 			=	selected.split('~');
    	$scope.loc_add.style_select 	=	style_array[0];
    };

    /***sku/Style Add Function***/
    $scope.addSkus	=	function(loc_add){
		if((loc_add.skuresult != '') && (loc_add.skuresult != undefined)){
			$scope.product_detail.addedproducts	= [];
			$scope.order_product();
		}
	
		if((loc_add.styleresult != '') && (loc_add.styleresult != undefined)){
			$scope.product_detail.styleproducts	=	[];
			$scope.order_style(loc_add);
		}
	};

	/**Add Sku in Style**/
	$scope.order_style	=	function(loc_add){
		var seltstyle	=	loc_add.styleresult;
		//var loc 		=	$scope.form.orderstore;
		$scope.showstyle=true;
		$scope.styleitems = {locationId: $scope.loc.locationId,  result:'', styleresult:seltstyle, mode:"edit"};
		angular.element(document.getElementById('locstylematrix'))
		.html($compile('<style-matrix></style-matrix>')($scope));
	   	$scope.loc_add.styleresult = '';
	}

	$scope.loadmat	=	false;

	var prod_detail=[];
	var price_detail=[];
	var addedskus=[];
	$scope.getmodifiedsku=function(styleskus){
		$scope.changedSkus	=	styleskus;
		var newskus	=	Object.keys($scope.changedSkus);
		var selectedskus=newskus.join(',');
		ovcDash.post('apis/ang_getvendorproducts',{data:{sku:selectedskus}}).then(function (results) {
				if ((results.status != 'error') && (results !='')) {
					var allvals = [];
					angular.forEach(results, function(item) {
						allvals.push(item.ProductTbl);
					});
					$scope.product_detail.styleskus		=	allvals;
					$scope.addskusfrommatrix(newskus);
				}
		});
	}		

	/**Add Sku**/
	$scope.order_product 	= 	function() {
		//var loc 	=	$scope.form.orderstore;
		var sku 		=	$scope.loc_add.sku_select;
		var uomlist 	= 	$scope.product_detail.uomvalues;
		var skuslist	=	$scope.product_detail.list;
		
		var productslist	=	$scope.product_detail.allproducts;
		angular.forEach(skuslist, function(values,key){
			if(values.lineNumber != ''){
				linedetails.push(values.lineNumber);
			}
		});
		var newline2=Math.max.apply(Math,linedetails);

		angular.forEach(productslist, function(value) {
			if(value.sku == sku){
				var newprod = false;
				var sduom = uomlist['Each'];
				angular.forEach(skuslist, function(lval, lindex) {
					if (lval.sku == sku) {
						var qty = (lval.qty) + 1;
						newprod = true;
						skuslist[lindex].qty = qty;
					}
				});
				var skuwaist	=	((value.waist) && (value.waist !=	'' )) ? parseInt(value.waist) : null ;
				var skulength	=	((value.length) && (value.length !=	'' ) )? parseInt(value.length) : null ;
				var skusize		=	((value.size)	&&	(value.size	!=	'')) ? (value.size) : '' ;
				if (!newprod) {
					var newobj	=	{
									id:'',
	                                lineNumber : '',
									sku:value.sku,
									description: value.description,
									restockFromLocation:'',
									locationId:$scope.loc.stockingLocationId,
									qty: 1,
									selectedUOM: sduom,
									style:value.productCode,
									styleDescription:value.styleDescription,
									styleColor:value.color,
									waist:skuwaist,
									length:skulength,
									size:skusize
								};
					skuslist.push(newobj);	
				}
			}
		});

		angular.forEach(skuslist, function(values,key){
			if(values.lineNumber == ''){
				if(key !=0){
					newline = newline2 + 1;
				}else{
					newline = 1;
				}			
				values.lineNumber = newline;
			} 
		});

		$scope.product_detail.list = skuslist;
	};

	/**Add Skus from Style Matrix *****/
	$scope.addskusfrommatrix = function(newskus){
		var uomlist 	= 	$scope.product_detail.uomvalues;
		var skuslist	=	$scope.product_detail.list;
		var styleskus		=	$scope.product_detail.styleskus;

		angular.forEach(styleskus,function(value){
				
			var newprod = false;
			var sduom = uomlist['Each'];
			if(skuslist.length > 0){
				angular.forEach(skuslist, function(lval, lindex) {
					if (lval.sku == value.sku) {
						var qty = (lval.qty) + $scope.changedSkus[value.sku];
						newprod = true;
						skuslist[lindex].qty = qty;
					}
				});
			}
			
			var skuwaist	=	((value.waist) && (value.waist !=	'' )) ? parseInt(value.waist) : null ;
			var skulength	=	((value.length) && (value.length !=	'' ) )? parseInt(value.length) : null ;
			var skusize		=	((value.size)	&&	(value.size	!=	'')) ? (value.size) : '' ;
			if (!newprod) {
				var new_qty	= $scope.changedSkus[value.sku];
				var newobj	=	{
								id:'',
								lineNumber : '',
								sku:value.sku,
								description: value.description,
								restockFromLocation:'',
								locationId:$scope.loc.stockingLocationId,
								qty: new_qty,
								selectedUOM: sduom,
								style:value.productCode,
								styleDescription:value.styleDescription,
								styleColor:value.color,
								waist:skuwaist,
								length:skulength,
								size:skusize
							};
				skuslist.push(newobj);	
			}
		});

		var linedetails = [];
		angular.forEach(skuslist, function(values,key){
			if(values.lineNumber != ''){
				linedetails.push(values.lineNumber);
			}
		});
			
		angular.forEach(skuslist, function(values,key){
			if(linedetails.length >0){
				var newline2=Math.max.apply(Math,linedetails);
			}else{
			 	var newline2=0;
			}
			if(values.lineNumber == ''){
				if(key !=0){
					newline = newline2 + 1;
				}else{
					newline = 1;
				}
				linedetails.push(newline);
				values.lineNumber = newline;
			} 
		});

		$scope.product_detail.list = skuslist;
	};

	$scope.product_detail.save = function(){
		var locationitems	=	[];
		var updateitems		=	[];	
		var listtosave		=	$scope.product_detail.list;
		angular.forEach(listtosave, function(value) {
			if(value.id == ''){
				var itemid = null;
			}else{
				var itemid = value.id;
				updateitems.push(value.id);
			}
			var itemobj	=	{
				_id:itemid,
				locationId:value.locationId,
			    productUom: value.selectedUOM,
			    productDescription: value.description,
			    SKU: value.sku, 
			    qty: value.qty,
			    restockingLocation: value.restockFromLocation,
			    length: value.length,
			    waist: value.waist,
			    size:value.size,
			    styleColor: value.styleColor,
			    lineNumber: value.lineNumber
			};
			locationitems.push(itemobj);
			
		});

		var jsonStr	=	JSON.stringify(locationitems);
		if(locationitems.length==0){
			var error = {"status":"error","message":$scope.ovcLabel.stockLocation.toast.select_sku };
			Data.toast(error);
		}else{
			Data.put("/locationitem/"+$scope.loc.stockingLocationId,{data:{skus:jsonStr}
			}).then(function (results) {
				
				if((results.error == undefined) && (results != '')){
					if(updateitems.length > 0){
						var succ = {"status":"success","message":$scope.ovcLabel.stockLocation.toast.skuLocationUpdate };
					}else{
						var succ = {"status":"success","message":$scope.ovcLabel.stockLocation.toast.skuLocationAdded };
					}
					
					Data.toast(succ);
					$state.go('ovc.location-list');

				}else{
					if(updateitems.length > 0){
						var error = {"status":"error","message":$scope.ovcLabel.stockLocation.toast.err_skuLocationUpdate};
					}else{
						var error = {"status":"error","message":$scope.ovcLabel.stockLocation.toast.err_skuLocationAdded };
					}
					Data.toast(error);
				}
			});
		}
	};

	$scope.canceledit	= function(){
		$state.go('ovc.location-list');
	}
	
});

app.controller('treeCtrl',function ($rootScope,$scope, $log,$timeout,$controller, $compile,toaster, ovcDash, Data){ 	
		
	$scope.product_detail		     	=	{};
	$scope.loc_add				     	= 	{};
	$scope.action                    	= 	{};
	$scope.product_detail.uomvalues  	= 	{};
	$scope.product_detail.alluoms    	= 	{};
	var newline   					 	= 	0;
	var linedetails                     = 	[];
	$scope.product_detail.allproducts 	= 	[];
	$scope.product_detail.addedproducts = 	[];
	$scope.product_detail.list          = 	[];
	var addedskus 		   				= 	[];
    $scope.changedSkus	  				= 	[];
	$scope.product_detail.prod_detail	= 	[];
	var price_detail 					=	[];
	$scope.product_detail.allproducts2  =	[];
    $scope.oldpids 						=	[];
    $scope.changedSkus					=	[];
    $scope.product_detail.styleskus		=	[];
    $scope.product_detail.locations		=	[];
    /*******************get uom **********/
    $scope.uomservice = function() {
        Data.get('/uom').then(function(results) {
            var uomdatas = [];
            angular.forEach(results, function(values) {
                if ((values.isActive) && (values.uomId != undefined) && (values.uomId != '') && (values.description != undefined) && (values.description != '')) {
                    var newobj = {
                        name: values.description,
                        id: values.uomId,
						value: values.uomId
                    }
                    uomdatas.push(newobj);
					$scope.product_detail.uomvalues[values.uomId]=values.description;
                }
            });
            $scope.product_detail.alluoms = uomdatas;
        });
    }
	$scope.uomservice();

	/*****Enable and Disable based on Permission and Configuration  manager******/
	$scope.vlistklcn	=	true;
	$scope.molstklcn	=	true;
	$scope.servicefun2 = function() {
		 $rootScope.$watch('ROLES',function(){
			var role_det=$rootScope.ROLES;
			angular.forEach(role_det, function(roles,key) {
				if (key== 'stockingLocations'){

					var viewStockingLocations		=	roles.viewStockingLocations?roles.viewStockingLocations:0;
					var modifyStockingLocations	=	roles.modifyStockingLocations?roles.modifyStockingLocations:0;

					if(viewStockingLocations		==	1){
						$scope.vlistklcn	=	false;
						$('.plus_btn_ic').attr('disabled', true);
					}

					if(modifyStockingLocations	==	1){
						$scope.vlistklcn	=	false;
						$scope.molstklcn	=	false;
						$('.plus_btn_ic').removeAttr('disabled'); 
					}
				}
			});
		});
		
	}
	//$scope.servicefun2();
	$timeout(function() {
       $scope.servicefun2();
    }, 1000);
	var list_locations={};
	/* to get lists of stock locations added for the store */	
	$scope.getstore_lists = function (values,statuss) {
		if(values != '' && values != undefined){
			sessionStorage.vals = values;
			Data.get('/location?locationid='+ encodeURIComponent(values)).then(function (results) {
				$scope.closediv();
				$scope.myMethod(results,statuss);
				
				document.getElementsByClassName('treecolap')[0].style.display = 'block'; // we chnaged prev value none
				document.getElementsByClassName('treeexpnd')[0].style.display = 'none'; // we chnaged prev value block
			});
		}
		else{
			var results = [];
			$scope.myMethod(results,statuss);
		}
	};
	
	if(sessionStorage.vals){		
		$scope.getstore_lists(sessionStorage.vals,true); // now changed to true for default expand all
	}

	/****Add new Location****/
	$scope.addNewLocation=function(data){
		$scope.action.detail="add";
	}

	/****Edit and Update Location****/
	$scope.callFromJquery = function (data) {
        $scope.action.detail="edit";
        if((data !='')){
			var locationid=data.original.id;	
			var list_locations={};
			Data.get('/location?id='+encodeURIComponent(locationid)).then(function (results) {
				if((results != '') && (results.error==undefined)){
					$scope.action.treeloc = results;
					
					$scope.editloc_name=results.locationName;
					Data.get('/hierarchyLocations?location='+ encodeURIComponent($scope.action.treeloc.locationId)).then(function (response) {
			         	if((response.error ==undefined) && (response !='') ){
			         		var loc_array=[];
			         		angular.forEach(response, function(values) {
				            	list_locations[values.stockingLocationId]=values.name;
				            	var newobj={
				            		id:values.stockingLocationId,
				            		displayName:values.locationName
				            	};
				            	loc_array.push(newobj);
				            });

				            $scope.product_detail.locations	= loc_array;
			         	}
			            
						Data.get('/locationitem?locationid='+ encodeURIComponent($scope.action.treeloc.stockingLocationId)).then(function (locdetail) {
							if((locdetail.error == undefined) && (locdetail !='')){
								
								var allskuslist=[];
								angular.forEach(locdetail, function(value) {
									var newobj	=	{
											id:value._id,
			                                lineNumber : value.lineNumber,
											sku:value.SKU,
											//name: value.name,
											description: value.productDescription,
											restockFromLocation:value.restockingLocation,
											locationId:value.locationId,
											qty: value.qty,
											selectedUOM: value.productUom,
											style:value.productCode,
											styleDescription:value.styleDescription,
											styleColor:value.styleColor,
											waist:value.waist,
											length:value.length,
											size:value.size
										};
									allskuslist.push(newobj);	
								});

								$scope.product_detail.list=allskuslist;

							}
						});

					});
				}
			});
		}
    };
	
	/* tree view structure creation */
	var vm = this;
	$scope.myMethod = function (datass,statuss) {
		$scope.datas1 = [];
		angular.forEach(datass, function(child,index) {
		  //here I'd like to get name of children
			if(child.parentStockingLocationId){
			var prnt = child.parentStockingLocationId;
			}else{var prnt = '#';
			}
			if(!child.isActive){var active_clss = 'jstree-anchor_inactive';}else{var active_clss = 'jstree-anchor_active';}
			$scope.datas1.push({
				id : child._id, 
				parent : prnt, 
				text : child.stockingLocationId+'-'+child.locationName,
				state: { opened: statuss},
				desc:child.stockingLocationDescription,
				Inactive:active_clss,isactive:child.isActive,
				locationName:child.locationName,
				SlocationId:child.stockingLocationId,
				locationId:child.locationId
			});
		});
			var newId = 1;
			vm.ignoreChanges = false;
			// vm.ignoreChanges = true; // kr changed // it willrecreate the tree for every instance.
			vm.newNode = {};
			vm.originalData = $scope.datas1;
			// alert('rrr');
			vm.treeData = [];
			angular.copy(vm.originalData,vm.treeData);
			vm.treeConfig = {
				core : {
					multiple : true,
					animation: false,
					error : function(error) {
						$log.error('treeCtrl: error from js tree - ' + angular.toJson(error));
					},
					check_callback : true,
					worker : true
				},
				types : {
					default : {
						icon : 'glyphicon glyphicon-flash'
					},
					star : {
						icon : 'glyphicon glyphicon-star'
					},
					cloud : {
						icon : 'glyphicon glyphicon-cloud'
					}
				},
				version : 1,
				// plugins : ['types','checkbox']
				plugins : ['unique','json_data', 'ui','dnd']
			};
			
			vm.reCreateTree = function() {
				vm.ignoreChanges = true;
				angular.copy(this.originalData,this.treeData);
				vm.treeConfig.version++;
			};
			$scope.reCreateTree = function() {
				vm.ignoreChanges = true;
				angular.copy(this.originalData,this.treeData);
				vm.treeConfig.version++;
				
				document.getElementsByClassName('top_menu')[0].style.display = 'block';
				
			};
			
			vm.toggle_status = function(state) {
			  vm.treeData.forEach(function(e) {
				e.state.opened = state;
			  });
			  if(state){
				document.getElementsByClassName('treecolap')[0].style.display = 'block';
				document.getElementsByClassName('treeexpnd')[0].style.display = 'none';
			  }else{
				document.getElementsByClassName('treecolap')[0].style.display = 'none';
				document.getElementsByClassName('treeexpnd')[0].style.display = 'block';
			  }
			  $scope.reCreateTree();
			  //$scope.servicefun2();
			}
			vm.addNewNode = function(locs) {
					var reassignparent	=	locs.parentStockingLocationId;
					var locid = document.getElementsByName('loc_id')[0].value;
					var _id_key = document.getElementsByName('_id')[0].value;
					if(locs.parentStockingLocationId && locs.parentStockingLocationId != undefined && locs.parentStockingLocationId !=sessionStorage.vals){
						locs.parentStockingLocationId = locid;
					}
					if(locs.parentStockingLocationId ==sessionStorage.vals){
						delete  locs["parentStockingLocationId"];
					}
					
					if(_id_key != ''){
						$("#"+_id_key+"_anchor .jstree-anchor-span").text(locs.stockingLocationId+'-'+locs.locationName);
						Data.post('/location/'+_id_key, {
							data: locs
						}).then(function (results) {
							if (!results.ok) {
								var error = {
									"status":"error",
									"message":"Failed to update, '"+locs.stockingLocationId+"' Stock Location Id is already exists."
								};
								Data.toast(error);
								$scope.reCreateTree();
							}
							else{
								var succ = {"status":"success","message":$scope.ovcLabel.stockLocation.toast.location_update};
								Data.toast(succ);
								$scope.closediv();
								angular.forEach(vm.treeData, function(value) {
									if(value.id == _id_key){
										value.isactive = locs.isActive;
									}
								});
								$scope.getstore_lists(locs.locationId,true);
							}
						});  
					}
					else{
						Data.put('/location', {
							data: locs
						}).then(function (results) {
							if (results.error) {
								var error = {
									"status":"error",
									"message":" Failed to add, '"+locs.stockingLocationId+"' Stock Location Id is already exists."
								};
								Data.toast(error);
								locs.parentStockingLocationId	=	reassignparent;
							}
							else{
								var succ = {"status":"success","message":$scope.ovcLabel.stockLocation.toast.location_add};
								Data.toast(succ);
								$scope.closediv();
								if(results.parentStockingLocationId){
									var prnts = results.parentStockingLocationId;
								}
								else{
									var prnts = '#';
								}
								if(!results.isActive){
									var ac_clss = 'jstree-anchor_inactive';
								}
								else{
									var ac_clss = 'jstree-anchor_active';
								}
								vm.treeData.push({ 
												   id 			: 	results._id,
												   parent 		: 	prnts, 
												   text 		: 	locs.stockingLocationId+'-'+results.locationName,
												   desc 		: 	results.stockingLocationDescription,
												   Inactive 	: 	ac_clss,isactive:results.isActive,
												   locationName : 	results.locationName,
												   SlocationId  : 	results.stockingLocationId,
												   locationId   : 	locs.locationId
												   });
								$scope.getstore_lists(locs.locationId,true);
							}
						});  

					}
			};
			$scope.submitform	=	function(form){
				$scope.action.formerror={};
				$scope.action.formerrormsg={};
				//console.log(form);
			
					try{
						//console.log($scope.loc.stockingLocationId);
						if( $scope.loc.stockingLocationId == '' || $scope.loc.stockingLocationId == undefined ){
							throw {'id' : 'stockid', 'message' : $scope.ovcLabel.stockLocation.toast.stock_locationId };
						}
						if( $scope.loc.locationName == '' || $scope.loc.locationName == undefined ){
							throw {'id' : 'stockname', 'message' : $scope.ovcLabel.stockLocation.toast.location_required };
						}
					}
					catch(e){
							$scope.action.formerror[e.id]=true;
							$scope.action.formerrormsg[e.id]=e.message;
							$timeout(function() {
							   $scope.action.formerror[e.id]	=	false;
							}, 3000);
							
							return false;
					}
					return true;			
			}
			$scope.pattern= function(e){
					var k = e.which || e.keyCode;
					var k1 = e.key;
					if((k > 64 && k < 91) || (k > 96 && k < 123) || k == 8 || (k >= 48 && k <= 57) || ( k >= 37 && k<= 40) || k1 == 'Delete' || k == 13){
						return;
					}
					else{
						e.preventDefault();
					}
			}


			this.readyCB = function() {
				$timeout(function() {
					vm.ignoreChanges = false;
					toaster.pop('success', 'JS Tree Ready', 'Js Tree issued the ready event')
				});
			};

			this.createCB  = function(e,item) {
				$timeout(function() {toaster.pop('success', 'Node Added', 'Added new node with the text ' + item.node.text)});
			};
			
			this.applyModelChanges = function() {
				return !vm.ignoreChanges;
			};
			
			$timeout(function() {
				// alert('rrr');
				$scope.reCreateTree();
			}, 300);
			
	}

	
	$scope.openpop = function(loc) {
		$scope.action.detail="add";
		var loc_at = this.loc;

		try{
		
			if(loc_at.locationId != undefined){
				var st_locid = $('.stockingLocationId');
				st_locid.removeAttr('readonly');
				var locid = this.loc.locationId;
				// $(".add_loc").show();
				$(".tree_loc").fadeOut();
				var input_prnt = $('.parentStockingLocationId');
				input_prnt.val(locid);
				input_prnt.trigger('input');
				setTimeout(function () { $(".add_loc").fadeIn(); }, 300);			
			}
		}
		catch(e){
			var error = {
				"status":"error",
				"message":$scope.ovcLabel.stockLocation.toast.select_store
			};
			Data.toast(error);
		}
	}
	
	$scope.closediv = function() {
		// $(".add_loc").hide();
		$(".add_loc").fadeOut();
		setTimeout(function () { $(".tree_loc").fadeIn(); }, 300);			
		var input = $('input');
		input.val('');
		var textarea = $('textarea');
		textarea.val('');
		textarea.text('');
		$scope.loc.stockingLocationId='';
		$scope.loc.stockingLocationDescription='';
		$scope.loc.locationName='';
	}

	 /******SKU Search Product******/
    $scope.dosrchproduct = function(typedthings) {
        if (typedthings != '...' && typedthings != '' && typedthings != undefined) {
        	ovcDash.get('apis/ang_loc_products?srch=' + typedthings + '&locid=' + encodeURIComponent($scope.action.treeloc.locationId)).then(function(data) {
				if (data.status != 'error') {
					var rows 	= [];
					var allvals = [];
					angular.forEach(data, function(item) {
						rows.push(item.ProductTbl.sku + '~' + item.ProductTbl.name+'~'+item.ProductTbl.barCode);
						allvals.push(item.ProductTbl);
					});
					$scope.product_detail.addedproducts 	= 	rows;
					$scope.product_detail.allproducts 		= 	allvals;
				}
			});
    	}
    };

    /******Search Style to add order item*****/
    $scope.dostylesrch = function(typedthings) {  
		if (typedthings != '...' && typedthings != '' && typedthings != undefined) {
			ovcDash.get('apis/ang_style_products?srch=' + typedthings + '&locid=' + encodeURIComponent($scope.action.treeloc.locationId)).then(function(data) {
				if (data.status != 'error') {
					var rows 		= 	[];
					var allvals2 	= 	[];
					angular.forEach(data, function(item) {
						rows.push(item.ProductTbl.productCode + '~' + item.ProductTbl.name);
						allvals2.push(item.ProductTbl);
					});
					$scope.product_detail.styleproducts 	= 	rows;
				}
			});	
    	}
    };

    /****sku / style Select Function*****/
    $scope.doSelectproduct 		= 	function(selected) {
    	var sku_array			=	selected.split('~');
    	$scope.loc_add.sku_select 	=	sku_array[0];
    };

    $scope.dostyleselect	=	function(selected){
    	var style_array 			=	selected.split('~');
    	$scope.loc_add.style_select 	=	style_array[0];
    };

    /***sku/Style Add Function***/
    $scope.addSkus	=	function(loc_add){
		if((loc_add.skuresult != '') && (loc_add.skuresult != undefined)){
			$scope.product_detail.addedproducts	= [];
			$scope.order_product();
		}
	
		if((loc_add.styleresult != '') && (loc_add.styleresult != undefined)){
			$scope.product_detail.styleproducts	=	[];
			$scope.order_style(loc_add);
		}
	};

	/**Add Sku in Style**/
	$scope.order_style	=	function(loc_add){
		var seltstyle	=	loc_add.styleresult;
		//var loc 		=	$scope.form.orderstore;
		$scope.showstyle=true;
		$scope.styleitems = {locationId: $scope.action.treeloc.locationId,  result:'', styleresult:seltstyle, mode:"edit"};
		angular.element(document.getElementById('locstylematrix'))
		.html($compile('<style-matrix></style-matrix>')($scope));
	   	$scope.loc_add.styleresult = '';
	}

	$scope.loadmat	=	false;

	var prod_detail=[];
	var price_detail=[];
	var addedskus=[];
	$scope.getmodifiedsku=function(styleskus){
		$scope.changedSkus	=	styleskus;
		var newskus	=	Object.keys($scope.changedSkus);
		var selectedskus=newskus.join(',');
		ovcDash.post('apis/ang_getvendorproducts',{data:{sku:selectedskus}}).then(function (results) {
				if ((results.status != 'error') && (results !='')) {
					var allvals = [];
					angular.forEach(results, function(item) {
						allvals.push(item.ProductTbl);
					});
					$scope.product_detail.styleskus		=	allvals;
					$scope.addskusfrommatrix(newskus);
				}
		});
	}		

	/**Add Sku**/
	$scope.order_product 	= 	function() {
		//var loc 	=	$scope.form.orderstore;
		var sku 		=	$scope.loc_add.sku_select;
		var uomlist 	= 	$scope.product_detail.uomvalues;
		var skuslist	=	$scope.product_detail.list;
		
		var productslist	=	$scope.product_detail.allproducts;
		angular.forEach(skuslist, function(values,key){
			if(values.lineNumber != ''){
				linedetails.push(values.lineNumber);
			}
		});
		var newline2=Math.max.apply(Math,linedetails);

		angular.forEach(productslist, function(value) {
			if(value.sku == sku){
				var newprod = false;
				var sduom = uomlist['Each'];
				angular.forEach(skuslist, function(lval, lindex) {
					if (lval.sku == sku) {
						var qty = (lval.qty) + 1;
						newprod = true;
						skuslist[lindex].qty = qty;
					}
				});
				var skuwaist	=	((value.waist) && (value.waist !=	'' )) ? parseInt(value.waist) : null ;
				var skulength	=	((value.length) && (value.length !=	'' ) )? parseInt(value.length) : null ;
				var skusize		=	((value.size)	&&	(value.size	!=	'')) ? (value.size) : '' ;
				if (!newprod) {
					var newobj	=	{
									id:'',
	                                lineNumber : '',
									sku:value.sku,
									description: value.description,
									restockFromLocation:'',
									locationId:$scope.action.treeloc.stockingLocationId,
									qty: 1,
									selectedUOM: sduom,
									style:value.productCode,
									styleDescription:value.styleDescription,
									styleColor:value.color,
									waist:skuwaist,
									length:skulength,
									size:skusize
								};
					skuslist.push(newobj);	
				}
			}
		});

		angular.forEach(skuslist, function(values,key){
			if(values.lineNumber == ''){
				if(key !=0){
					newline = newline2 + 1;
				}else{
					newline = 1;
				}			
				values.lineNumber = newline;
			} 
		});

		$scope.product_detail.list = skuslist;
	};

	/**Add Skus from Style Matrix *****/
	$scope.addskusfrommatrix = function(newskus){
		var uomlist 	= 	$scope.product_detail.uomvalues;
		var skuslist	=	$scope.product_detail.list;
		var styleskus		=	$scope.product_detail.styleskus;

		angular.forEach(styleskus,function(value){
				
			var newprod = false;
			var sduom = uomlist['Each'];
			if(skuslist.length > 0){
				angular.forEach(skuslist, function(lval, lindex) {
					if (lval.sku == value.sku) {
						var qty = (lval.qty) + $scope.changedSkus[value.sku];
						newprod = true;
						skuslist[lindex].qty = qty;
					}
				});
			}
			
			var skuwaist	=	((value.waist) && (value.waist !=	'' )) ? parseInt(value.waist) : null ;
			var skulength	=	((value.length) && (value.length !=	'' ) )? parseInt(value.length) : null ;
			var skusize		=	((value.size)	&&	(value.size	!=	'')) ? (value.size) : '' ;
			if (!newprod) {
				var new_qty	= $scope.changedSkus[value.sku];
				var newobj	=	{
								id:'',
								lineNumber : '',
								sku:value.sku,
								description: value.description,
								restockFromLocation:'',
								locationId:$scope.action.treeloc.stockingLocationId,
								qty: new_qty,
								selectedUOM: sduom,
								style:value.productCode,
								styleDescription:value.styleDescription,
								styleColor:value.color,
								waist:skuwaist,
								length:skulength,
								size:skusize
							};
				skuslist.push(newobj);	
			}
		});

		var linedetails = [];
		angular.forEach(skuslist, function(values,key){
			if(values.lineNumber != ''){
				linedetails.push(values.lineNumber);
			}
		});
			
		angular.forEach(skuslist, function(values,key){
			if(linedetails.length >0){
				var newline2=Math.max.apply(Math,linedetails);
			}else{
			 	var newline2=0;
			}
			if(values.lineNumber == ''){
				if(key !=0){
					newline = newline2 + 1;
				}else{
					newline = 1;
				}
				linedetails.push(newline);
				values.lineNumber = newline;
			} 
		});

		$scope.product_detail.list = skuslist;
	};

	$scope.product_detail.save = function(){
		var locationitems	=	[];
		var updateitems		=	[];	
		var listtosave		=	$scope.product_detail.list;
		angular.forEach(listtosave, function(value) {
			if(value.id == ''){
				var itemid = null;
			}else{
				var itemid = value.id;
				updateitems.push(value.id);
			}
			var itemobj	=	{
				_id:itemid,
				locationId:value.locationId,
			    productUom: value.selectedUOM,
			    productDescription: value.description,
			    SKU: value.sku, 
			    qty: value.qty,
			    restockingLocation: value.restockFromLocation,
			    length: value.length,
			    waist: value.waist,
			    size:value.size,
			    styleColor: value.styleColor,
			    lineNumber: value.lineNumber
			};
			locationitems.push(itemobj);
			
		});

		var jsonStr	=	JSON.stringify(locationitems);
		if(locationitems.length==0){
			var error = {"status":"error","message":$scope.ovcLabel.stockLocation.toast.select_sku_add };
			Data.toast(error);
		}else{
			Data.put("/locationitem/"+$scope.action.treeloc.stockingLocationId,{data:{skus:jsonStr}
			}).then(function (results) {
				if((results.error == undefined) && (results != '')){
					if(updateitems.length > 0){
						var succ = {"status":"success","message":$scope.ovcLabel.stockLocation.toast.skuLocationUpdate };
					}else{
						var succ = {"status":"success","message":$scope.ovcLabel.stockLocation.toast.skuLocationAdded };
					}
					
					Data.toast(succ);

				}else{
					if(updateitems.length > 0){
						var error = {"status":"error","message":$scope.ovcLabel.stockLocation.toast.err_skuLocationUpdate };
					}else{
						var error = {"status":"error","message":$scope.ovcLabel.stockLocation.toast.err_skuLocationAdded };
					}
					Data.toast(error);
				}
			});
		}
	};

	$scope.canceledit	= function(){
		$scope.closediv();
		$scope.product_detail.list =[];
	}
});	
