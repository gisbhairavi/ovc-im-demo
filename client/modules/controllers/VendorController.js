var app = angular.module('OVCstockApp', []);
  
  /****List vendors***/
app.controller('getVendors',function ($rootScope,$scope, $state, $http, $cookieStore, $timeout, $stateParams, Data){  

	$scope.vliuom	=	true;
	$scope.moluom	=	true;
	$scope.hideprimarysupplier 	=	true;
	
	$scope.vendorfun1 = function() {
		$rootScope.$watch('ROLES',function(){
			var role_det=$rootScope.ROLES;
			angular.forEach(role_det, function(roles,key) {
				if (key== 'vendors'){

					var viewVendors     =   roles.viewVendors?roles.viewVendors:0;
                    var modifyVendors 	=   roles.modifyVendors?roles.modifyVendors:0;

                    if(viewVendors    ==  1){
                        $scope.vliuom    =   false;
                    }

                    if(modifyVendors  	==  1){
                        $scope.vliuom    =   false;
                        $scope.moluom    =   false;
                    }
				}
			});
		
		}); 
	}
	$scope.vendorfun1();



	
    $scope.setPage = function(pageNo) {
        $scope.currentPage = pageNo;
    };
    
    $scope.sort_by = function(predicate) {
        $scope.predicate = predicate;
        $scope.reverse = !$scope.reverse;
    };

    $scope.search 		=	'';

    if($stateParams.fullList){
        delete sessionStorage.vendorSearchData;
        delete sessionStorage.vendorPageLimit;
    }

    if(sessionStorage.vendorSearchData){
    	$scope.search 	=	sessionStorage.vendorSearchData;
    }

    $scope.entryLimit 	= 	sessionStorage.vendorPageLimit ? sessionStorage.vendorPageLimit : $rootScope.PAGE_SIZE; //max no of items to display in a page


	/*****Vendor Search*****/
	$scope.vendor_search= function(){
		var search_data	=	$scope.search;
		sessionStorage.vendorSearchData 	=	$scope.search;
		sessionStorage.vendorPageLimit   	=   $scope.entryLimit;
		Data.get('/vendor?name='+search_data).then(function (data) {
			$scope.list = data;
			$scope.currentPages = 1; //current page
			$scope.filteredItems = $scope.list.length; //Initially for no filter  
			$scope.totalItems = $scope.list.length;
		
		});
	};
	
	/***Reset Search****/
	$scope.vendor_reset= function(){
		delete sessionStorage.vendorSearchData;
        delete sessionStorage.vendorPageLimit;
        $scope.search 		=	'';
        $scope.entryLimit 	= 	$rootScope.PAGE_SIZE;
		$scope.vendor_search();
	};
	
	/*****Delete Vendor****/
	$scope.vendor_delete = function (id) {
		
		 var vendorid = id ;
		
		$.confirm({
			title: 'Delete Vendor',
			content: 'Confirm delete?',
			confirmButtonClass: 'btn-primary',
			cancelButtonClass: 'btn-primary',
			confirmButton: 'Ok',
			cancelButton: 'Cancel',
			confirm: function () {
				Data.delete('/vendor/'+vendorid).then(function (data) {
				
					var output={"status":"success","message":$scope.ovcLabel.vendors.toast.vendordelete};
					Data.toast(output);
					$scope.vendor_search();
					
				});
			},
			cancel: function () {
				return false;
			}
		
		});
		return false;
	}
	
	$scope.vendor_editprd=function(id){
		var vproduct=id;
		if(id != undefined){
			$cookieStore.remove('editab');
			$cookieStore.put('prodtab',vproduct);
		}
	}
	
	
	$scope.vendor_edt=function(id){
		var vproduct=id;
		if(id != undefined){
		$cookieStore.remove('prodtab');
		$cookieStore.put('editab',vproduct);
		}
	}
	

   //Init
   // $scope.selectedLanguage = OVC_CONFIG.default_lang;
   $scope.vendor_search();
  
});

app.config(['$httpProvider', function($httpProvider) {
	
	$httpProvider.defaults.useXDomain = true;	
	 $httpProvider.defaults.withCredentials = true;
	delete $httpProvider.defaults.headers.common['X-Requested-With'];
	$httpProvider.defaults.headers.common["Accept"] = "application/json";
    $httpProvider.defaults.headers.common["Content-Type"] = "application/json";
	
	}
]); 

/*****Add Vendors****/

app.controller('addVendors',function ($scope, $state, $http, $stateParams, $cookieStore, $timeout, CARRIERCODES, 
STATES, Data, ovcDash ){  
	$cookieStore.remove('prodtab');
	$cookieStore.remove('vpr_detail');
	$cookieStore.remove('product_vendor');
	$cookieStore.remove('acc_detail');
	$cookieStore.remove('product_status');
	
	$scope.title = 'Add';
	$scope.titleadd =true;
	$scope.titleedit=false;
	$scope.hideprimarysupplier 	=	true;
	$scope.vendor_add = {};
	var cardesc=$scope.ovcLabel.vendors.carrierCode;
	var ccodes=CARRIERCODES;
	var carrcodes=[];
	angular.forEach(ccodes,function(item) {
					
		var abc=item.Name;
		
			var bcd= cardesc[abc];
				item.description=bcd;	
			carrcodes.push(item);	
	});

	$scope.newclass1="selected_radio";
	$scope.newclass2="";
	$scope.status=1;
	
	$scope.changeclass1=function(){
		$scope.newclass1="selected_radio";
		$scope.newclass2="";
	}
	
	$scope.hideproducttab 	=	function(hideprimary){
		if(hideprimary){
			$scope.hideprimarysupplier 	=	false;
		}
		else{
			$scope.hideprimarysupplier 	=	true;
		}
	}

	$scope.changeclass2=function(){
		$scope.newclass1="";
		$scope.newclass2="selected_radio";
	}
			 
		var stes=STATES;
		var labstes=$scope.ovcLabel.vendors.statecodes;
		var stateslist=[];
		angular.forEach(stes,function(item) {
						
			var abc=item.code;
			var bcd= labstes[abc];
			var newitem={
				countryid:item.country,
				stateid:item.code,
				statename:bcd
			}; 
				stateslist.push(newitem);	
		});
	
		$scope.allstates=stateslist;
			 
			 
		$scope.GetSelectedCountry = function () {
                $scope.strCountry = document.getElementById("country").value;
					
				var selstates=[];
				angular.forEach($scope.allstates,function(item) {
					
					if(item.countryid==$scope.strCountry){
						selstates.push(item); 
					}
				});
				$scope.states= selstates;
        };
				
	$scope.items=carrcodes;
	 
	$scope.status = {
        isopen: false
    };

	
	$scope.FirstItems=carrcodes;
    $scope.FirstSelectedItems = [];

    var removeItem = function (items, item) {
        for (var index = 0; index < items.length; index++) {
            if (item.Id == items[index].Id) {
                item.selected = false;
                items.splice(index, 1);
                break;
            }
        }
    };
    $scope.removeFirstItem = function (item) {
        removeItem($scope.FirstSelectedItems, item);
    };
	
	$scope.select_allcar=function(){
			var newrows = []; 
			var selectedrows=[];
			var abc=$scope.FirstItems;
			
			angular.forEach(abc,function(item) {
					 item.selected=true;
							selectedrows.push(item);	 
			});
			$scope.FirstSelectedItems=selectedrows; 
	} 
	
	
	$scope.countdisable 	=	0;
  
    $scope.vendor_add = function (E_add) {
		$scope.submitted="true";
		 if( !E_add || !E_add.companyName ){
		 	$timeout(function() {
				angular.element('#co_detail').trigger('click');
			}, 1);
			$scope.countdisable 	=	0;
		 }
		 else if( !E_add.companyCode || !E_add.accountNumber ){
		 		
			$timeout(function() {
				angular.element('#acc_detail').trigger('click');
			}, 1);
			$scope.countdisable 	=	0;
		}
		else if( !E_add.companyName && E_add.companyCode && E_add.accountNumber ){
			
			$timeout(function() {
				angular.element('#co_detail').trigger('click');
			}, 1);
			$scope.countdisable 	=	0;
		}
		else{
			$scope.countdisable++;
			 var vendors=E_add; 
			 console.log(E_add);
				var carows = []; 
						
				var newcarrier=$scope.FirstSelectedItems;
				angular.forEach(newcarrier,function(item) {
					
					carows.push(item.Name);
				});
							
			var carrier=carows.toString();
			  $scope.strCountry = document.getElementById("country").value;
			  
			  if((vendors.status== undefined)){
					
					var vendstatus=true;
				}else{
					
					var vendstatus=vendors.status;
				}
			
			 var dataObj = {
				companyName : vendors.companyName,
				companyCode : vendors.companyCode,
				accountNumber : vendors.accountNumber,
				address1 : vendors.address1,
				purchasingDepartment :vendors.purchasingDepartment,
				phoneNumber: vendors.phoneNumber,
				carrierAlphaCode:carrier,
				address2: vendors.address2,
				city:vendors.city,
				state: vendors.state,
				status:vendstatus,
				zipcode: vendors.zipcode,
				country:$scope.strCountry,
				primarysupplier:vendors.primarysupplier
			};
			if($scope.countdisable == 1){
				Data.put('/vendor', {
					data:dataObj
				}).then(function (results) {
					
					if(results.__v==0){
						
						$cookieStore.put('vendor_id',results._id);
						$cookieStore.put('vendoradd_id',results._id);
		
						var output={"status":"success","message":$scope.ovcLabel.vendors.toast.vendorcreate};
						Data.toast(output);
						
						$state.go('ovc.vendor-list');
						
					}
					else if(results.error.message == 'vendor validation failed'){
						
						var errors=results.error.errors;
						var message=[];
						angular.forEach(errors,function(item) {
							message.push(item.path);
						});
						$scope.countdisable 	=	0;
						var carrier=message.toString();
						var err_add=$cookieStore.get('add_count',count);	
						
					} 
					else if(results.error == 'Vendor Name should be unique') {
						var output={"status":"error","message":results.error};
						Data.toast(output);
						$scope.countdisable 	=	0;
					}
				});
			}
		};

	}
	
	$scope.vendor_update=function(){
		$cookieStore.remove('product_status');
	}

    // $scope.add_all = function() {
    //     // var output = {
    //     //     "status": "success",
    //     //     "message": data.n + " Product(s) Added Soon."
    //     // };
    //     // Data.toast(output);
    //     Data.get('/addAllproduct' + $stateParams.vendorid).then(function(data) {
    //         // $scope.list = data;
    //         // $scope.currentPage = 1; //current page
    //         // $scope.entryLimit = 10; //max no of items to display in a page
    //         // $scope.filteredItems = $scope.list.length; //Initially for no filter  
    //         // $scope.totalItems = $scope.list.length;
    //         if (data !== undefined) {
    //             if (data.ok) {
    //                 var output = {
    //                     "status": "success",
    //                     "message": data.n + " Product(s) Added Soon."
    //                 };
    //                 Data.toast(output);
    //             } else {
    //                 var output = {
    //                     "status": "error",
    //                     "message": "Server error"
    //                 };
    //                 Data.toast(output);
    //             }
    //         } else {
    //             var output = {
    //                 "status": "error",
    //                 "message": "Server error"
    //             };
    //             Data.toast(output);
    //         }
    //     });
    // }
	
});

app.controller('editVendor',function ($rootScope, $scope, $state, $http, $cookieStore, $stateParams, $timeout, 
COUNTRIES, CARRIERCODES, STATES, Data){  
	$scope.vliuom	=	true;
	$scope.moluom	=	true;
	$('#edit_vendors').find('button,a, input,div').attr("disabled", true);
	$scope.hideprimarysupplier 	=	true;

	$scope.vendorfun2 = function() {
		$rootScope.$watch('ROLES',function(){
			var role_det=$rootScope.ROLES;
			angular.forEach(role_det, function(roles,key) {
				if (key== 'vendors'){

					var viewVendors     =   roles.viewVendors?roles.viewVendors:0;
                    var modifyVendors 	=   roles.modifyVendors?roles.modifyVendors:0;

                    if(viewVendors    ==  1){
                        $scope.vliuom    =   false;
                        $('#edit_vendors').find('button,a, input,div').attr("disabled", true);
                    }

                    if(modifyVendors  	==  1){
                        $scope.vliuom    =   false;
                        $scope.moluom    =   false;
                        $('#edit_vendors').find('button,a, input,div').removeAttr('disabled');
                    }
				}
			});
	
		}); 
	}
	$scope.vendorfun2();



	$scope.vendor_edit = {};
	$scope.title = 'Edit';
	
	$scope.titleadd = false;
	$scope.titleedit=true;
	
	$scope.changeclass1=function(){
		$scope.newclass1="selected_radio";
		$scope.newclass2="";
	}
	
	$scope.changeclass2=function(){
		$scope.newclass1="";
		$scope.newclass2="selected_radio";
	}
	
	var vendorid = $stateParams.vendorid; 
	
	$scope.vendid=vendorid;
	
	var cardesc=$scope.ovcLabel.vendors.carrierCode;
	
	var ccodes=CARRIERCODES;
	var carrcodes=[];
	angular.forEach(ccodes,function(item) {
					
			var abc=item.Name;
			var bcd= cardesc[abc];
				item.description=bcd;	
			carrcodes.push(item);
	});
	
		
		var stes=STATES;
		  var labstes=$scope.ovcLabel.vendors.statecodes;
		  var stateslist=[];
		angular.forEach(stes,function(item) {
						
			var abc=item.code;
			var bcd= labstes[abc];
			var newitem={
				countryid:item.country,
				stateid:item.code,
				statename:bcd
			}; 
				stateslist.push(newitem);	
		});
	
		$scope.allstates=stateslist;
	   
			
		$scope.GetSelectedCountry = function () {
				
                $scope.strCountry = document.getElementById("country").value;
				var selstates=[];
				angular.forEach($scope.allstates,function(item) {
					
					if(item.countryid==$scope.strCountry){
						selstates.push(item);
						 
					}
					
				});
				$scope.states= selstates;
            };

    $scope.hideproducttab 	=	function(hideprimary){
		if(hideprimary){
			$scope.hideprimarysupplier 	=	false;
		}
		else{
			$scope.hideprimarysupplier 	=	true;
		}
	}
	
	Data.get('/vendor?id='+vendorid).then(function (data) {
			
			if(data.status == 1){
				$scope.newclass1="selected_radio";
				$scope.newclass2="";
				
			}else if(data.status == 0){
				$scope.newclass1="";
				$scope.newclass2="selected_radio";
				
			}
			
		/* 	var newcon=document.getElementById("country");
			newcon.value=data.country; 
			console.log(newcon); */
			/* var myEl = angular.element( document.querySelector( '#country' ) );
			myEl.val(data.country);
			console.log(myEl); */
			
			var selstates=[];
			angular.forEach($scope.allstates,function(item) {
				
				if(item.countryid==data.country){
					selstates.push(item);
				}
				
			});
			if(data.primarysupplier){
				$scope.hideprimarysupplier 	=	false;
			}
			else{
				$scope.hideprimarysupplier 	=	true;
			}
			$scope.states= selstates;
						
			$scope.E_add={};
			$scope.E_add.id = data._id,
			$scope.E_add.companyName = data.companyName,
			$scope.E_add.companyCode = data.companyCode,
			$scope.E_add.accountNumber = data.accountNumber,
			$scope.E_add.address1 = data.address1,
			$scope.E_add.purchasingDepartment =data.purchasingDepartment,
			$scope.E_add.phoneNumber= data.phoneNumber,
			$scope.E_add.carrierAlphaCode=data.carrierAlphaCode,
			$scope.E_add.address2= data.address2,
			$scope.E_add.city=data.city,
			$scope.E_add.state= data.state,
			$scope.E_add.status=data.status,
			$scope.E_add.zipcode=data.zipcode,
			//$scope.E_add.country=newcon.value
			$scope.E_add.country=data.country
			$scope.E_add.primarysupplier 	=	data.primarysupplier;
			$scope.vendorname=$scope.E_add.companyName;
			
			$scope.newcodes=data.carrierAlphaCode;
		$scope.items=carrcodes;
			var newrows = []; 
			var selectedrows=[];
			$scope.SecondItems=[];
			$scope.SecondSelectedItems=[];
					
	
			angular.forEach($scope.items,function(item) {
				
				var existdata=new Array();
				var abc=$scope.E_add.carrierAlphaCode;
				
				
				existdata = abc.split(',');
				
				 if(existdata.indexOf(item.Name)!= -1){
					 item.selected=true;
						 
							 newrows.push(item);
							selectedrows.push(item);
				 }else{
						item.selected=false;
						 
							 newrows.push(item);		
				 } 
				 
			});
			
			$scope.SecondItems=newrows;
			$scope.SecondSelectedItems=selectedrows;
	});
	
	sessionStorage.carrierall="true";
	
	
	$scope.select_allcar=function(){
	
		$scope.items=carrcodes;
			var newrows = []; 
			var selectedrows=[];
			$scope.SecondItems=[];
			$scope.SecondSelectedItems=[];
			angular.forEach($scope.items,function(item) {
					 item.selected=true;
						 
							 newrows.push(item);
							selectedrows.push(item);	 
			});
			
			$scope.SecondItems=newrows;
			$scope.SecondSelectedItems=selectedrows;
	}
	
	 $scope.SecondSelectedItems = []; 

    var removeItem = function (items, item) {
        for (var index = 0; index < items.length; index++) {
            if (item.Id == items[index].Id) {
                item.selected = false;
                items.splice(index, 1);
                break;
            }
        }
    };
    $scope.removeFirstItem = function (item) {
        removeItem($scope.SecondSelectedItems, item);
		
    };
	$scope.countdisable 	=	0;
	
	$scope.vendor_add = function (vendors) {
		$scope.submitted="true";
		
		var ncarows = []; 
					
			var newcarrier=$scope.SecondSelectedItems;
			angular.forEach(newcarrier,function(item) {
				
				ncarows.push(item.Name);
			});
			
			
		var carrier=ncarows.toString();
		
		 $scope.strCountry = document.getElementById("country").value;
		 var newObj = {
			id:vendors.id,
			companyName : vendors.companyName,
			companyCode : vendors.companyCode,
			accountNumber : vendors.accountNumber,
			address1 : vendors.address1,
			purchasingDepartment :vendors.purchasingDepartment,
			phoneNumber: vendors.phoneNumber,
			carrierAlphaCode:carrier,
			address2: vendors.address2,
			city:vendors.city,
			state: vendors.state,
			status:vendors.status,
			zipcode: vendors.zipcode,
			country: $scope.strCountry,
			primarysupplier:vendors.primarysupplier
		};
		
		var vendorid = vendors.id ;
		
		if((vendors.companyName != undefined) &&(vendors.companyCode != undefined) &&(vendors.accountNumber != undefined)){
			$scope.countdisable++;
			if($scope.countdisable == 1){
				Data.post('/vendor/'+vendorid, {
					data:newObj
				}).then(function (results) {
					if(results.error == 'Vendor Name should be unique') {
						var output={"status":"error","message":results.error};
						Data.toast(output);
						$scope.countdisable 	=	0;
					}
					else {
						var chpro=$cookieStore.get('product_status');
					    
					    if((chpro !='')&&(chpro != undefined)){
						
							angular.forEach(chpro,function(item) {
										var vendorid = item.vendorid ;
										var cstatus =item.changestatus;
										
								Data.put('/vendorproduct/'+vendorid+'?isactive='+cstatus).then(function (data) {
									
								});
							});
							
							$cookieStore.remove('product_status');
						}
						
						var newvendor=$cookieStore.get('vendoradd_id');
						if((newvendor != undefined)&&(newvendor != '')){
							
							var output={"status":"success","message":$scope.ovcLabel.vendors.toast.vendorupdate};
							Data.toast(output);
							$cookieStore.remove('vendoradd_id');
						}
						
						else{
							
							var output={"status":"success","message":$scope.ovcLabel.vendors.toast.vendorupdate};
							Data.toast(output);
						}

						$state.go('ovc.vendor-list');
					}
				});
			}
		}else if((vendors.companyCode == undefined) || (vendors.accountNumber == undefined)){
			$timeout(function() {
				angular.element('#acc_detail').trigger('click');
			}, 1);
			
		}else if((vendors.companyName == undefined)&&((vendors.companyCode != undefined) && (vendors.accountNumber != undefined))){
			
			$timeout(function() {
				angular.element('#co_detail').trigger('click');
			}, 1);
			
		}
	}

	$scope.vendor_update=function(){
		$cookieStore.remove('product_status');
	}
	
	
	
    // $scope.add_all = function() {
    // 	// console.log($state);
    //  //    var output = {
    //  //        "status": "success",
    //  //        "message":JSON.stringify($state)  + " Product(s) Added Soon."
    //  //    };
    //  //    Data.toast(output);
    //  //    return;
    //     Data.get('/addAllproduct/' + $stateParams.vendorid).then(function(data) {
    //         // $scope.list = data;
    //         // $scope.currentPage = 1; //current page
    //         // $scope.entryLimit = 10; //max no of items to display in a page
    //         // $scope.filteredItems = $scope.list.length; //Initially for no filter  
    //         // $scope.totalItems = $scope.list.length;
    //         if (data !== undefined) {
    //             if (data.ok) {
    //                 var output = {
    //                     "status": "success",
    //                     "message": data.n + " Product(s) Will be Added Soon."
    //                 };
    //                 Data.toast(output);
    //             } else {
    //                 var output = {
    //                     "status": "error",
    //                     "message": "Server error"
    //                 };
    //                 Data.toast(output);
    //             }
    //         } else {
    //             var output = {
    //                 "status": "error",
    //                 "message": "Server error"
    //             };
    //             Data.toast(output);
    //         }
    //     });
    // }
});


/* modal popup controller */


app.controller('ModalCtrl', function ($rootScope,$scope, $state, $http, $stateParams, $cookieStore, ovcDash, Data){  
    $scope.showModal = false;
    $scope.offset    =   0;
    $scope.toggleModal = function(){
        $scope.showModal = !$scope.showModal;
    };
	$scope.hideprimarysupplier 	=	true;
	
	var vendorid=$stateParams.vendorid;
	
	$scope.loadItems = function(val){
		if(val != '' && val.length > 3){
			ovcDash.get('apis/ang_getproducts?srch='+val).then(function (data) {
				
				$scope.PRODlist = data;
				var rows = []; 
					
				angular.forEach($scope.PRODlist,function(item) {
					
					rows.push(item.ProductTbl);
				});
				
				$scope.PRlist = rows;
				$scope.currentPages = 1; //current page
				$scope.entryLimit = 10; 
				$scope.filteredItemss =$scope.PRlist.length;
				
				
			});
			
			 $scope.setPage = function(pageNo) {
				 $scope.currentPage = pageNo;
			};
			
			 $scope.sort_by = function(predicate) {
				$scope.predicate = predicate;
				 $scope.reverse = !$scope.reverse;
			 };		
		}
	}
	
/*
 * Changes by Ratheesh.
 */


	$scope.currentPage   = 1; //current page
	$scope.entryLimit    = sessionStorage.vendorProductPageLimit ? sessionStorage.vendorProductPageLimit : $rootScope.PAGE_SIZE; //max no of items to display in a page	

	$scope.productFun = function() {
		var srch_key =  $scope.search ? $scope.search : '';
		Data.get('/vendorproduct/'+vendorid + '?srch_key=' + srch_key + '&offset=' + $scope.offset + '&lmt=' + $scope.entryLimit).then(function (data) {
			if((data != "" )&&(data != undefined)){
				// $scope.PRlist1 = [];
				var skudata    = {};
				var nrows      = []; 
				var nrows2     = []; 
				var ven_pro    = [];
				// $scope.nrows2  = [];
				sessionStorage.vendorProductPageLimit  =   $scope.entryLimit;
				$scope.filteredItems        =   data.total_count; //Initially for no filter  
				angular.forEach(data.ProductData,function(item) {
					if(nrows.indexOf(item.vendorSKU)== -1){
						nrows.push(item.vendorSKU);
						skudata[item.vendorSKU] = item;
						nrows2.push(item);
					}
				});

				ovcDash.post('apis/ang_getvendorproducts',{data:{sku:($scope.search?($scope.search):nrows.join(','))}}).then(function (vproducts) {

					if((vproducts) && (vproducts.status != "error")){

						angular.forEach(vproducts,function(item) {
							angular.forEach(nrows2,function(ven_item) {
								if (ven_item.vendorSKU == item.ProductTbl.sku) {
									item.ProductTbl._id =  	ven_item._id;
									item.ProductTbl.isActive 		=	ven_item.isActive;
									ven_pro.push(item.ProductTbl); 
								}
								// if(nrows.indexOf(item.ProductTbl.sku) != -1){
								// 	ven_pro.push(item.ProductTbl); 
								// }
							});
						});
						$scope.list   		= ven_pro;
						// $scope.PRlist1 		 = ven_pro;
						// $scope.nrows2		 = nrows2;
						$scope.vendorSKU     = ven_pro;
						$scope.filteredItems = data.total_count; //Initially for no filter  
						$scope.totalItems    = ven_pro.length;
						
						// $scope.getvendorproducts($scope.vendorSKU.slice(($scope.currentPage-1)*$scope.entryLimit,$scope.entryLimit));

					}
					
				},function(error){});
			}
		},function(error){});
    };

    $scope.productFunReset = function(){
    	$scope.search = '';
    	delete sessionStorage.vendorProductPageLimit;
    } 

    $scope.pageChanged  =   function(){
       // $scope.offset = ($scope.currentPage - 1) * $scope.itemsPerPage;
        $scope.offset = ($scope.currentPage - 1) * $scope.entryLimit;
        $scope.productFun();
    };
	
			// $scope.getvendorproducts=function(nrows){
				
			// // ovcDash.get('apis/ang_getvendorproducts?sku='+nrows).then(function (data) {
			// 	ovcDash.post('apis/ang_getvendorproducts',{data:{sku:($scope.search?($scope.search):nrows.join(','))}}).then(function (data) {
			// 		$scope.VPRODlist = data;
			// 		var rows = []; 
			// 		angular.forEach($scope.VPRODlist,function(item) {
						
			// 			rows.push(item.ProductTbl);
			// 		});
					
			// 		var newrows=[];
			// 		angular.forEach(rows,function(item) {
						
			// 			//var abc=item.productCode;
			// 			var abc=item.sku;
			// 			var row1=item;
			// 			angular.forEach($scope.nrows2,function(item) {
			// 				var bcd=item.vendorSKU;
			// 				var row2=item;
			// 				if(abc==bcd){
			// 					 var row3=angular.extend({}, row1, row2);
			// 					newrows.push(row3); 
			// 				}
			// 			});
			// 		});
					
			// 		$scope.list = newrows;
			// 		$scope.product_search=function(){
					
			// 			var newsearch=document.getElementById("searchpro");
			// 			var search=newsearch.value;
			// 			var searchedrows=[];
			// 			angular.forEach(newrows,function(item) {
			// 				  var bcd=item.name;
			// 				  var testsku=item.sku;
			// 					var re = new RegExp(search, 'gi');
			// 					bcd.match(re);
			// 					var res_str =bcd.match(re);
			// 					var res_str2=testsku.match(re);
			// 				  if((res_str != null)){
			// 					  searchedrows.push(item);
			// 				  }else if((res_str2 != null)){
			// 					  searchedrows.push(item);
			// 				  }
			// 			});
						
			// 			$scope.list = searchedrows;
			// 			 $scope.currentPage = 1; //current page
			// 			$scope.filteredItems = $scope.list.length; //Initially for no filter  
			// 			$scope.totalItems = $scope.list.length;  
			// 		}
					
			// 	},function(error){});
			// };
    $scope.setPage = function(pageNo) {
        $scope.currentPage = pageNo;
    };
    
    $scope.sort_by = function(predicate) {
        $scope.predicate = predicate;
        $scope.reverse = !$scope.reverse;
    };
	
	if(vendorid != undefined){
		$scope.productFun();
	}
	
	$scope.vproduct_reset=function(){
			
		var newsearch=document.getElementById("searchpro");
		
		newsearch.value= "";	
		$scope.productFun();

        delete sessionStorage.vendorProductPageLimit;
		
	}
	
	$scope.product_delete=function(id){
		
		var vendorid = id ;
		
		$.confirm({
			title: $scope.ovcLabel.vendors.confirmPopup.vendordeletetitle,
			content: $scope.ovcLabel.vendors.confirmPopup.vendordeletecontent +'?',
			confirmButtonClass: 'btn-primary',
			cancelButtonClass: 'btn-primary',
			confirmButton: $scope.ovcLabel.vendors.confirmPopup.ok,
			cancelButton: $scope.ovcLabel.vendors.confirmPopup.cancel,
			confirm: function () {
				Data.delete('/vendorproduct/'+vendorid).then(function (data) {
				
					var output={"status":"success","message":$scope.ovcLabel.vendors.toast.vendorproductdelete};
					Data.toast(output);
					$scope.productFun();
					
				});
			},
			cancel: function () {
				return false;
			}
		
		});
		return false;
		
	}
	
	$scope.prodstatus=[];
	$scope.prodids=[];
	
	$scope.changestatus=function(id,status){
		
		
		
		if(status==true){
			
			var cstatus=0;
			
		}else if(status==false){
			
			var cstatus=1;
			
		}
		
		var newitem={
				vendorid:id,
				changestatus:cstatus
				
			}; 
			
			if($scope.prodids==""){
				$scope.prodids.push(id);
				$scope.prodstatus.push(newitem);
				
			}else{
			
				
				var idx=$scope.prodids.indexOf(id);
					
					if(idx > -1){	
						if(cstatus == 0){
							var nstatus=1;
							
						}else if(cstatus == 1){
							var nstatus=0;
						}
						  
						 var newitem2={
								vendorid:id,
								changestatus:nstatus
								
						}; 
						 $scope.prodstatus.push(newitem2); 
						
					}else {
						$scope.prodids.push(id);
						$scope.prodstatus.push(newitem);
					}
			}
			
			var updatepro=$scope.prodstatus;
			$cookieStore.put('product_status',updatepro);
			var chpro=$cookieStore.get('product_status');
			
	}

		
});

  
  /******Carrier Multiselect******/
  
  app.directive('dropdownMultiselect', function () {
    return {
        restrict: 'A',
        scope: {
            items: "=",
            selectedItems: "="
        },
        template: "<div class='dropdown col-md-1 col-sm-1 col-xs-1 offset0 margintLeft15 marginRigth5'  uib-dropdown is-open='status.isopen' >" +
                        "<a  class='btn btn-primary uib-dropdown-toggle'  uib-dropdown-toggle  ng-click='openDropdown($event)' >" +

                            "Add <span class='caret'></span>" +
                        "</a>" +
                        "<div class='dropdown-menu expertDropList' style='position: relative;min-width:220px;' >" +
                            "<div class='col-md-12 marginBottom15'>" +
                               "<div class='pull-left'>" +
									 "<input type='checkbox' style='margin:5px 6px;' ng-model='allselected' id='checkall' ng-click='selectAll($event)' />" +
                                "<label id='selectall' style='padding-left:3px'>Select All</label>" +
                                "</div>" +
                            "</div>" +
                            "<div style='padding-left:10px;' data-ng-repeat='item in items' class='expertDropListBox' ng-click='handleClick($event)'>" +
                                "<input id='{{item.Name}}' type='checkbox' style='margin:5px 10px;' ng-model='item.selected' ng-checked='{{item.selected}}' ng-click='clickItem($event)' ng-change='selectItem(item)'  />" +
                                "{{item.Name}} - {{item.description}}" +
                            "</div>" +
                        "</div>" +
                    "</div>",
        controller: function ($scope, $timeout) {
            $scope.handleClick = function ($event) {
                $event.stopPropagation();
            };
            // $scope.status = {
            //     isopen: false
            // };
            $scope.openDropdown = function ($event) {
                if ($scope.items != undefined && $scope.items.length > 0) {
                    for (var index = 0; index < $scope.items.length; index++) {
                        $scope.items[index].selected = false;
                    }
                    if ($scope.selectedItems != undefined && $scope.selectedItems.length > 0) {
                        for (var selectedItemIndex = 0; selectedItemIndex < $scope.selectedItems.length; selectedItemIndex++) {
                            for (var itemIndex = 0; itemIndex < $scope.items.length; itemIndex++) {
                                if ($scope.selectedItems[selectedItemIndex].Id == $scope.items[itemIndex].Id) {
                                    $scope.items[itemIndex].selected = true;
                                    break;                                    
                                }
                            }
                        }
                    }
                }
                //console.log($scope.status.isopen,"isopen");
                $event.stopPropagation();
                //$scope.status.isopen = true;
            };

            $scope.selectItem = function (item) {
				if (item.selected == false) {
				
                    for (var index = 0; index < $scope.selectedItems.length; index++) {
                        if (item.Id == $scope.selectedItems[index].Id) {
                            item.selected = false;
                            $scope.selectedItems.splice(index, 1);
                            break;
                        }
                    }
                } else {
                    $scope.selectedItems.push(item);
                }
            };

            $scope.clickItem = function ($event) {
                $event.stopPropagation();
            };

            $scope.closeDropDown = function () {
                $scope.status.isopen = false;
                $event.stopPropagation();
            };
			
			$scope.selectAll = function ($event) {
				
				var checksel= document.getElementById("checkall").checked;

				if(checksel){
					document.getElementById("selectall").innerText = "Unselect All";
					var abc=$scope.items;
					 if(sessionStorage.carrierall=="true"){
					
					   angular.forEach(abc, function (item) {
							if(item.selected==false){
							item.selected = true;
							$scope.selectItem(item) ;
							}
							
						});
					} 
					else{
							
							angular.forEach(abc, function (item) {
								if(item.selected==false){
									item.selected = true;
									$scope.selectItem(item) ;
										
								}else{
								
									 for (var index = 0; index < $scope.selectedItems.length; index++) {
										if (item.Id == $scope.selectedItems[index].Id) {
											item.selected = false;
											$scope.selectedItems.splice(index, 1);
											break;
										}
									}
									item.selected = true;
									$scope.selectItem(item) ;
								}	
							});
						
								$timeout(function() {
									angular.element('#carr_detail').trigger('click');
								}, 1);
						
					}
					
					if(sessionStorage.carrierall){
						$timeout(function() {
							angular.element('#carr_detail').trigger('click');
						}, 1);
						
						delete sessionStorage.carrierall;
						
					} 
				
				}else{
					
					document.getElementById("selectall").innerText = "Select All";
					var abc=$scope.items;
					angular.forEach(abc, function (item) {
						item.selected = false;
						$scope.selectItem(item) ;
					});
					
				}
            };
            	

        }
    };
});