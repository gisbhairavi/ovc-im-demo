app.controller('TabController', function ($scope,  $cookieStore, COUNTRIES, STATES) {
	// alert('sfsf');
	
	
	
		this.tab = 1;

	this.setTab = function (tabId) {
		this.tab = tabId;
	};

	this.isSet = function (tabId) {
		return this.tab === tabId;
	};
	  
	var counts=COUNTRIES;
	var labcounts=$scope.ovcLabel.vendors.countrycodes;
	
	var countslist=[];
	angular.forEach(counts,function(item) {
					
		var abc=item.code;
	
		var bcd= labcounts[abc];
		var newitem={
			label:item.code,
			countryname:bcd,
		}; 
			countslist.push(newitem);	
	});
	  
	  $scope.countries=countslist;
	  
	

	$scope.add_company=function(){
		
		$cookieStore.put('co_detail','true');
		
		$cookieStore.remove('vpr_detail');
		$cookieStore.remove('acc_detail');
	}
	 
	$scope.add_account=function(){
		
		$cookieStore.put('acc_detail','true');
		//this.tab = 2;
		$cookieStore.remove('vpr_detail');
		$cookieStore.remove('co_detail');
	}
	
	$scope.add_venproduct=function(){
		
		$cookieStore.put('vpr_detail','true');
		$cookieStore.remove('co_detail');
		$cookieStore.remove('acc_detail');
	}
	
	var codt=$cookieStore.get('co_detail');
	
	
	if((codt=="true")){
				this.tab = 1;
		
		$cookieStore.remove('co_detail');
		
	} 
	
	var acdt=$cookieStore.get('acc_detail');
	
	
	
	if((acdt=="true")){
		
				this.tab = 2;
		
		$cookieStore.remove('acc_detail');
		
	} 
	
	var vpdt=$cookieStore.get('vpr_detail');
	var msg = $cookieStore.get('prodtab');
	
	
	
	if((vpdt=="true") ||((msg !="")&&(msg != undefined))){
		
				this.tab = 3;
		$cookieStore.remove('vpr_detail');
		$cookieStore.remove('prodtab');
		
	} 
	
	
	var msg1 = $cookieStore.get('product_vendor');
	
	
	
	if((msg1 !="")&&(msg1 != undefined)){
		
		this.tab = 3;
		$cookieStore.remove('product_vendor');
		
	}
	
	var msg2 = $cookieStore.get('editab');
	
	if((msg2 !="")&&(msg2 != undefined)){
		
		this.tab = 1;
		$cookieStore.remove('editab');
		
	}
	
	 
});


app.controller('TranstabCntrl', function ($scope,  $cookieStore) {
	// alert('sfsf');
	
	
	
		this.tab = 1;

	this.setTab = function (tabId) {
		this.tab = tabId;
	};

	this.isSet = function (tabId) {
		return this.tab === tabId;
	};
	  
	  
});

app.controller('OrdertabCntrl', function ($scope,  $cookieStore,$timeout, COUNTRIES) {
	// alert('sfsf');
	
	$scope.errorSearch=false;
	
		this.tab = 1;

	this.setTab = function (tabId) {
		this.tab = tabId;
			};

	this.isSet = function (tabId) {
		return this.tab === tabId;
	};
	
	//$cookieStore.get('rplorder');
	var counts=COUNTRIES;
	var labcounts=$scope.translation.countries[0];
	
	var countslist=[];
	angular.forEach(counts,function(item) {
					
		var abc=item.code;
	
		var bcd= labcounts[abc];
		var newitem={
			label:item.code,
			countryname:bcd,
		}; 
			countslist.push(newitem);	
	});
	   $scope.countries=countslist;
	   
	   var rporder=$cookieStore.get('rplorder');
	   if((rporder=="true") &&(rporder != undefined)){
		
				this.tab = 4;
		$cookieStore.remove('rplorder');
		
		} 
	  
});