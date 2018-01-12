var app = angular.module('OVCstockApp', []);

app.controller('getProducts',function ($scope, $http,  $timeout, Data){  
	$scope.servicefun = function() {
		Data.get('/product').then(function (data) {
			$scope.list = data;
			$scope.currentPage = 1; //current page
			$scope.entryLimit = 10; //max no of items to display in a page
			$scope.filteredItems = $scope.list.length; //Initially for no filter  
			$scope.totalItems = $scope.list.length;
		});
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
   
   //Init
   // $scope.selectedLanguage = OVC_CONFIG.default_lang;
   $scope.servicefun();
  
});


app.controller('addProducts',function ($scope,  $state, $http, $stateParams, $timeout, $cookieStore, ovcDash, Data){  
	// $scope.product_add = {};
	$scope.title = 'Add';
	$scope.showselect=false;
	var vendorid=$stateParams.vendorid; 
	var favorite= $cookieStore.get('vendor_id');
	$scope.vendorname='';
	
	if((vendorid != '')&&(vendorid != undefined)){
	
	$scope.vendid=$stateParams.vendorid;
	$scope.vendoradd='false';
	$scope.title='Edit';
	Data.get('/vendor?id='+vendorid).then(function(data){
		//console.log(data);
		if((data != undefined)&&(data != '')){
			$scope.vendorname=data.companyName;
		}
	})
	
	}
	else if((favorite != '')&&(favorite != undefined)){
		$scope.addedvendor=favorite;
		$scope.vendid=favorite;
		$scope.vendoradd='false';
		$cookieStore.remove('vendor_id');
			
	}else if((vendorid == undefined)&&(favorite == undefined)){
		
		$scope.vendoradd='true';
	}
	 
	$scope.selection=[];
	   
	$scope.loadItems = function(val){
		
		if(val != ''){
			$scope.loadval = 1;
			ovcDash.get('apis/ang_getproducts?srch='+val).then(function (data) {
				
				$timeout(function () { $scope.assignmentsLoaded(data); }, 500);				
			});
			
		}
	}
	
	
	$scope.assignmentsLoaded = function (data, status) {
		var checksel= document.getElementById("checkall").checked;
				
			if(checksel== true){
				$timeout(function() {
					angular.element('#checkall').trigger('click');
				}, 1)
			
			}
	
		if(data.status == 'error'){
			$scope.filteredItemss = 0;
			$scope.loadval = 0;
			$scope.showselect=false;
		}else{
			$scope.PRODlist = data;
			var rows = []; 
			
			$scope.showselect=true;

			angular.forEach($scope.PRODlist,function(item) {

				rows.push(item.ProductTbl);
			});
			$scope.loadval = 0;
			
			$scope.PRlist1 = rows;
			
			$scope.exlist=[];
			var vendorid=$scope.vendid;
		
				Data.get('/vendorproduct/'+vendorid).then(function (data) {
					$scope.exlist = data;
					
					if($scope.exlist !=""){
							var nrows = []; 

							angular.forEach($scope.PRlist1,function(item) {

								nrows.push(item.sku);
							});
							
							var erows = []; 

							angular.forEach($scope.exlist,function(item) {

								erows.push(item.vendorSKU);
							});
							
							var newrows = []; 
									
							angular.forEach($scope.PRlist1,function(item) {							
								
								var existdata=new Array();
								var abc=erows;
								
								existdata = erows;
								//console.log(item);
								if(existdata.indexOf(item.sku)!= -1){
									item.selected=true;										 
									newrows.push(item);
											
								}
								else{
										item.selected=false;
										 
											 newrows.push(item);				 
								} 
								 
							});
							
							$scope.PRlist3=newrows;
							$scope.selall='false';
							$scope.PRlist=newrows;
							$scope.currentPage = 1; //current page
							$scope.entryLimit = 10; //max no of items to display in a page
							$scope.filteredItemss = $scope.PRlist.length; 
							
							$scope.selectAll = function () {
		
								var checksel= document.getElementById("checkall").checked;
								var newsearch=document.getElementById("addpro_srch").value;
								
								if((checksel==true)&&(newsearch !='')){
									
									document.getElementById("selectall").innerText = "Unselect All";
									$scope.selectedItems = [];
									var srows=$scope.PRlist3;
									angular.forEach(srows, function (item) {
										if(item.selected ==false){
											item.selected=true;
											item.changed=true;
											$scope.selectedItems.push(item);
											$scope.selection.push(item.sku);
										}else{
											item.changed=false;
											$scope.selectedItems.push(item);
										}
									}); 
									
									$scope.selall='true';
									$scope.PRlist=$scope.selectedItems;
									
								
								}if ((checksel==false)&&(newsearch !='')){
									
									document.getElementById("selectall").innerText = "Select All";
									$scope.selall='false';
									
									$scope.selectedItems = [];
									var srows=$scope.PRlist3;
									angular.forEach(srows, function (item) {
										if(item.changed==true){
										item.selected = false;
										item.changed=false;
										$scope.selectedItems.push(item);
										var i = $scope.selection.indexOf(item.sku);
										if(i != -1) {
											$scope.selection.splice(i, 1);
										}
										}else{
											item.selected=true;
											item.changed=false;
											$scope.selectedItems.push(item);
										}
									}); 
									$scope.PRlist=$scope.selectedItems;
									
								}
							};	
							
							
							
					}else{
						$scope.selall='false';
					 	$scope.PRlist = rows;
						$scope.PRlist3=rows;
						$scope.currentPage = 1; //current page
						$scope.entryLimit = 10; //max no of items to display in a page
						$scope.filteredItemss = $scope.PRlist.length; //Initially for no filter 
						
						$scope.selectAll = function () {
	
							var checksel= document.getElementById("checkall").checked;
							var newsearch=document.getElementById("addpro_srch").value;
							
							
							if((checksel==true)&&(newsearch !='')){
								
								document.getElementById("selectall").innerText = "Unselect All";
								$scope.selectedItems = [];
								var srows=$scope.PRlist3;
								angular.forEach(srows, function (item) {
										item.selected=true;
										item.changed=true;
										$scope.selectedItems.push(item);
										$scope.selection.push(item.sku);
									
								}); 
								
								$scope.selall='true';
								$scope.PRlist=$scope.selectedItems;
								
							
							}if ((checksel==false)&&(newsearch !='')){
							
								document.getElementById("selectall").innerText = "Select All";
								$scope.selall='false';
								
								$scope.selectedItems = [];
								var srows=$scope.PRlist3;
								angular.forEach(srows, function (item) {
									
									item.selected = false;
									item.changed=false;
									$scope.selectedItems.push(item);
									var i = $scope.selection.indexOf(item.sku);
									if(i != -1) {
										$scope.selection.splice(i, 1);
									}
									
									
								}); 
								$scope.PRlist=$scope.selectedItems;
							   			
							}
						};	
						
					}												
										
				});	
			
		}	
    }
	
	
	$scope.list = [{
        isSelected: true,
        desc: "Donkey"
    }, {
        isSelected: false,
        desc: "Horse"
    }];
    
    $scope.getSelectionState = function(){
      var selectionState = true;
      for( var i =0;i < $scope.list.length;i++){
        selectionState = selectionState && $scope.list[i].isSelected;
      }
      return selectionState;
    };
    
    $scope.areAllSelected = false;
    
    $scope.$watch('getSelectionState()',function(val){
		
      if(val !== undefined){
        $scope.areAllSelected = val;
      }    
    });
    
    $scope.onAllSelected = function(){
		
      for( var i =0;i < $scope.list.length;i++){
        $scope.list[i].isSelected = $scope.areAllSelected;
      }
    };
	
	$scope.clear = function() {		  
		$('#inputImage').val('');
		
		$scope.image = '';
	 };
	 

  $scope.toggleSelection = function toggleSelection(employeeName) {

     var idx = $scope.selection.indexOf(employeeName);
     // is currently selected
     if (idx > -1) {

       $scope.selection.splice(idx, 1);
     }
     // is newly selected
     else {

       $scope.selection.push(employeeName);
     }

   };

	  
	$scope.product_add = function (products) { 
		var prodlist=$scope.PRlist;
		var selprods=$scope.selection;
		var vendorid=products;
		var rows = []; 	
			angular.forEach(prodlist,function(item) {
			
				var existdata=selprods;		
				
				 if(existdata.indexOf(item.sku)!= -1){
					var newitem={"vendorId":vendorid,
					//"productId":item.id,
					"productCode":item.productCode,
					"vendorSKU":item.sku,
					"barCode":item.barCode}; 
							
							 rows.push(newitem);	 
				 }else{
										 
				 } 	 
			});	
			
			if(rows!=""){
         /*Ratheesh.
         vendorproducts json array.
         */
				// for(n=0;n<rows.length;n++){ 
					 Data.post('/vendorproduct/'+vendorid, {
						 data:{
						vendorproducts:rows
					}
					//data:[{vendorproducts:rows}]
					}).then(function (results) {
						
						if (results.status == "success") {
							
						}
					});
				// }
	
				var output={"status":"success","message":"Vendor Product Added Successfully"};
				Data.toast(output);
			}else{
				var output={"status":"success","message":"Please Select Atleast One Sku"};
				Data.toast(output);
				return false;
			}
			
		 $cookieStore.put('product_vendor',vendorid);
    }; 
	
	$scope.venproduct_reset=function(){
		
		$state.reload();
	}
	
  
});


