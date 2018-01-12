var app=angular.module('OVCstockApp',[]);


var serviceCallFuncs = function( Data, selectedTranType , callback ) {
	var tranRevData  =  [];
	var tranTypeList = [];
    Data.get('/transactiontype').then(function(results) {
       if( results ){
            
            tranRevData	=   [];

            angular.forEach(results, function(item) {
            	if( item.tranTypeId !== selectedTranType && item.isAllowReversal == true)
            	{
            		tranRevData[item.tranTypeId]   =   item.tranName;
            	}
            	if( item.tranTypeId != selectedTranType )
                	tranTypeList.push(item.tranTypeId);
            });
        }
		callback(tranRevData, tranTypeList);
    });
}

 app.controller('transactionCtrl', function($rootScope, $scope, $state , $timeout, Data, RULEDEFN, POSRULEDEFN, NEGRULEDEFN, TWORULEDEFN,
 TRANSCODE, REQUIREDFIELDS, TRANREQFIELDS ) {	 
 
	$scope.title="Add";
	$scope.titleadd =true;
	$scope.titleedit=false;
	$scope.vlitrantyp=false;
	$scope.moltrantyp=false;
			
	$scope.newclass1="selected_radio";
	$scope.newclass2="";
	$scope.status=1;
	$scope.check = {};
	$scope.check.tranTypeLs = [];
	var fullTranList = [];
	
	$scope.changeclass1=function(){
		$scope.newclass1="selected_radio";
		$scope.newclass2="";
	}
	
	$scope.changeclass2=function(){
		$scope.newclass1="";
		$scope.newclass2="selected_radio";
	}
	
	var cardesc=$scope.ovcLabel.transactionType.tranreqfields;
	var ccodes=TRANREQFIELDS ;
	var carrcodes=[];
	angular.forEach(ccodes,function(item) {
					
		var abc=item.Name;
		
			var bcd= cardesc[abc];
				item.description=bcd;	
			carrcodes.push(item);	
	});
	
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


	serviceCallFuncs(Data, null ,function( returnTranData, fullTranData ){
		$scope.check.tranTypeLs = returnTranData;
		fullTranList = fullTranData;
	});

	 var trtycodes=$scope.ovcLabel.transactionType.translist;
	 var ctrtycodes=TRANSCODE;
		
		var ctrancodes=[];
		angular.forEach(ctrtycodes,function(item) {
						
			var abc=item.code;
			var bcd= trtycodes[abc];

					item.label=bcd;	
				ctrancodes.push(item);
		});
	 
		$scope.transtypes=ctrancodes;  
					  			  
		var trule_con=RULEDEFN;
		//var trule_con=TWORULEDEFN;
		var lab_bal=$scope.ovcLabel.transactionType.transrules;
		var trulelist=[];
		var trlist=[];
		var trdata={};
		var ptrdata=[];
		var trinobj=[];
		angular.forEach(trule_con,function(trules,key) {
				
			angular.forEach(trules,function(trules2,key2) {
				trinobj[key2]=[];
				angular.forEach(trules2,function(item) {
				
					var abc=item.Name;
					var bcd= lab_bal[abc];
					var lmodel='Erule.'+item.label;
					var newitem={
						rulename:bcd,
						rulemodel:lmodel,
						rulelabel:item.label,
						ruleid:item.id
					}; 
				 	trlist.push(newitem);
					trinobj[key2].push(newitem);
					trdata[item.label]=lmodel;
				});
			});
			
		});
		$scope.translist=trinobj;
		$scope.balancemodels=trdata;
		$scope.balanlist = $scope.balancemodels;
		
		$scope.change_trancode=function(trcode){
			
			if(trcode=='POS'){		  
						var trule_con=POSRULEDEFN;
			}else 	if(trcode=='NEG'){
						var trule_con=NEGRULEDEFN;
			}else 	if(trcode=='TWO'){
						var trule_con=TWORULEDEFN;
			}else{
						var trule_con=TWORULEDEFN;
			}
						
						var lab_bal=$scope.ovcLabel.transactionType.transrules;
						
						var trulelist=[];
						var trlist=[];
						var trdata={};
						var trinobj=[];
						angular.forEach(trule_con,function(trules,key) {
								
							angular.forEach(trules,function(trules2,key2) {
								trinobj[key2]=[];
								angular.forEach(trules2,function(item) {
							
									var abc=item.Name;
									var bcd= lab_bal[abc];
									var lmodel='Erule.'+item.label;
									var nocheck=nodisable=addcheck=adddisable=subcheck=subdisable=recalcheck=recaldisable='';
									if((item.noaction=='T') || (item.noaction=='N')){
											nocheck=false;
											 nodisable=false;
									}else if(item.noaction=='F'){
										 nocheck=true;
											 nodisable=true;
									
									}else if(item.noaction=='P'){
										 nocheck=false;
										  nodisable=true;
									}
									if((item.add=='T') || (item.add=='N')){
											 addcheck=false;
											adddisable=false;
									}else if(item.add=='F'){
										 addcheck=true;
											 adddisable=true;
									
									}else if(item.add=='P'){
										 addcheck=false;
											 adddisable=true;
									}
									if((item.subtract=='T') || (item.subtract=='N')){
											subcheck=false;
											 subdisable=false;
									}else if(item.subtract=='F'){
										 subcheck=true;
											subdisable=true;
									
									}else if(item.subtract=='P'){
										subcheck=false;
										 subdisable=true;
									}
									if((item.recalculate=='T') || (item.recalculate=='N')){
											 recalcheck=false;
											 recaldisable=false;
									}else if(item.recalculate=='F'){
										 recalcheck=true;
											 recaldisable=true;
									
									}else if(item.recalculate=='P'){
										recalcheck=false;
											recaldisable=true;
									}
									var newitem={
										rulename:bcd,
										rulemodel:lmodel,
										rulelabel:item.label,
										ruleid:item.id,
										rulenoact:nocheck,
										rulenostatus:nodisable,
										ruleadd:addcheck,
										ruleaddstatus:adddisable,
										rulesub:subcheck,
										rulesubstatus:subdisable,
										rulerecal:recalcheck,
										rulerecalstatus:recaldisable,
									}; 							
									trinobj[key2].push(newitem);
								
									if(nocheck==true){
											trdata[item.label]="Noaction";
									}else if(addcheck==true){
											trdata[item.label]="Add";
									}else if(subcheck==true){
											trdata[item.label]="Subtract";
									}else if(recalcheck==true){
											trdata[item.label]="Recalculate";
									}else{
										trdata[item.label]=lmodel;
									}
								});
							});
							
						});
						
						$scope.translist=trinobj;
						$scope.balancemodels=trdata;
						$scope.balanlist = $scope.balancemodels;
		}
		
		$scope.select_alltrans=function(){
				var newrows = []; 
				var selectedrows=[];
				var abc=$scope.FirstItems;
				
				angular.forEach(abc,function(item) {
						 item.selected=true;
								selectedrows.push(item);	 
				});
				
				$scope.FirstSelectedItems=selectedrows; 
		} 
		
		$scope.select_treqs=function(){
			if($scope.fieldsrequired==true){
				$scope.fieldsrequired=false;
			}
		}
	
	$scope.transaction_add=function(t_add,Erule){
		$scope.submitted='true';
		var newreq=$scope.FirstSelectedItems;
		$scope.check.checkUnique = true;
			if(newreq.length==0){
				$scope.fieldsrequired=true;
			}else if (newreq.length >= 1){
			$scope.fieldsrequired=false;
			}

		if(t_add.transid && t_add.transid != '')
			(fullTranList.indexOf(t_add.transid) == -1) ? $scope.check.checkUnique = false : $scope.check.checkUnique = true;
		
		if((t_add != undefined) &&(t_add.transid != undefined ) && ( $scope.check.checkUnique === false) /*&&($scope.fieldsrequired == false)*/){
			
			var trans=t_add;

			if(trans.allow_rvs  ===  undefined || trans.allow_rvs  ===  false)
			{
				var allow_rvs  =  false;
			}
			else
			{
				var allow_rvs  =  true;
			}

			/*if((trans.requiredcost== undefined)){
				var reqcost=false;
			}else{
				
				var reqcost=trans.requiredcost;
			}
			
			if((trans.glupdate== undefined)){
				
				var upgl=false;
			}else{
				
				var upgl=trans.glupdate;
			}*/
				if((trans.status== undefined)){
				
				var trstatus=true;
			}else{
				
				var trstatus=trans.status;
			}
			var carows = []; 
						
				var newcarrier=$scope.FirstSelectedItems;
				angular.forEach(newcarrier,function(item) {
					
					carows.push(item.description);
				});
							
			// var reqfields=carows.toString();
			
			
			var dataObj = {
				tranTypeId 			: 	trans.transid,
				tranName  			: 	trans.trname,
				description 		: 	trans.trdesc,
				tranCode 			: 	trans.transactioncode,
				// isCostRequired 	: 	reqcost,
				isActive 			: 	trstatus,
				// requiredFields 	: 	reqfields,
				// updateGl 		: 	upgl,
				isAllowReversal 	: 	allow_rvs,
				reversalTranTypeId 	: 	trans.revTranType,
				isManualTransaction : 	trans.man_tran
				// exportOH			: 	trans.exportOH
			};
			
			$scope.transactid=trans.transid;
			//return false;
		
		    Data.put('/transactiontype', {
				data:dataObj
			}).then(function (results) { 
				if(results.__v==0){ 
					
					if(Erule != undefined){
						var tranrulelist=[];
						angular.forEach(Erule,function(item,key) {
							
							if(item=="Noaction"){
								var tr_noact="true";
								var tr_subt="false";
								var tr_recalc="false";
								var tr_add="false";
							}else if(item=="Add"){
								var tr_noact="false";
								var tr_subt="false";
								var tr_recalc="false";
								var tr_add="true";
							}else if(item=="Subtract"){
								var tr_noact="false";
								var tr_subt="true";
								var tr_recalc="false";
								var tr_add="false";
							}
							else if(item=="Recalculate"){
								var tr_noact="false";
								var tr_subt="false";
								var tr_recalc="true";
								var tr_add="false";
								
							}
							else{
								var tr_noact="true";
								var tr_subt="false";
								var tr_recalc="false";
								var tr_add="false";
							}
							var dataObj2 = {
								tranTypeId: $scope.transactid,
								noAction : tr_noact,
								recalculate: tr_recalc,
								subtract: tr_subt,
								add :tr_add,
								balanceType:key
							};
							tranrulelist.push(dataObj2);
						});
								
							var myJsonString = JSON.stringify(tranrulelist);
							var trulelist=myJsonString;
							
							for(i=0;i<tranrulelist.length;i++){ 
							
								Data.put('/transactionrule', {
									data:tranrulelist[i]
								}).then(function (results) {
									
								});

							}
							
							var output={"status":"success","message":$scope.ovcLabel.transactionType.list.transaction_add_success};
									Data.toast(output);
									$state.go('ovc.transaction-type');
					}		
					
				}
			});
		}else{
			$timeout(function() {
				angular.element('#desc_detail').trigger('click');
			}, 1);
		}
	}
	
	$scope.transaction_cancel=function(){
		
		$state.go('ovc.transaction-type');	
	}
	
		
 });	  
	 
	 
app.controller('transactionlistCtrl', function($rootScope,$scope, $state, $stateParams, Data, TRANSTYPE, TRANSTATUS , TRANSCODE) {	 
 
		delete sessionStorage.truleids;
					  
	 $scope.trantypecodes=$scope.ovcLabel.transactionType.translist;
	 
	 var trtycodes=$scope.ovcLabel.transactionType.translist;
	 var trstatus=$scope.ovcLabel.transactionType.transtatus;
	 var trtype=$scope.ovcLabel.transactionType.transtype;
	 var ctrtycodes=TRANSCODE;
	 var ctrstatus=TRANSTATUS;
	 var ctrtype=TRANSTYPE;
	 
	 /*****Enable and Disable based on Permission******/
	$scope.vlitrantyp    =   true;
    $scope.moltrantyp    =   true;
	$scope.endisable = function() {
		$rootScope.$watch('ROLES',function(){
			var role_det=$rootScope.ROLES;
			angular.forEach(role_det, function(roles,key) {
				if (key== 'transactionTypes'){

					var viewTransactionTypes    =   roles.viewTransactionTypes?roles.viewTransactionTypes:0;
                    var modifyTransactionTypes 	=   roles.modifyTransactionTypes?roles.modifyTransactionTypes:0;

                    if(viewTransactionTypes    ==  1){
                        $scope.vlitrantyp    =   false;
                    }

                    if(modifyTransactionTypes  	==  1){
                        $scope.vlitrantyp    =   false;
                        $scope.moltrantyp    =   false;
                    }
				}
			});
		
		}); 
	}
	$scope.endisable();
		
		var ctrancodes=[];
		angular.forEach(ctrtycodes,function(item) {
						
			var abc=item.code;
			var bcd= trtycodes[abc];

					item.label=bcd;	
				ctrancodes.push(item);
		});
	 
		$scope.transcodes=ctrancodes;
		var ctranstatus=[];
		angular.forEach(ctrstatus,function(item) {
			var abc=item.code;
			var bcd= trstatus[abc];
					item.label=bcd;	
				ctranstatus.push(item);
		});
	 
		$scope.transstatus=ctranstatus;
		var ctrantype=[];
		angular.forEach(ctrtype,function(item) {	
			var abc=item.code;
			var bcd= trtype[abc];
					item.label=bcd;	
				ctrantype.push(item);
		});
	 
		$scope.transtype=ctrantype;
	 
	
	
    $scope.setPage = function(pageNo) {
        $scope.currentPage = pageNo;
    };
    
    $scope.sort_by = function(predicate) {
        $scope.predicate = predicate;
        $scope.reverse = !$scope.reverse;
    };

    $scope.search 		=	'';

    if($stateParams.fullList){
        delete sessionStorage.transactionTypeSearchData;
        delete sessionStorage.transactionTypePageLimit;
    }

    if(sessionStorage.transactionTypeSearchData){
    	$scope.search 	=	sessionStorage.transactionTypeSearchData;
    }

    $scope.entryLimit 	= 	sessionStorage.transactionTypePageLimit ? sessionStorage.transactionTypePageLimit : $rootScope.PAGE_SIZE; //max no of items to display in a page
	
	
		 
	 /***Search Transaction*****/
	 
	  $scope.transtype_search=function(){
			var search_data	=	$scope.search;
			sessionStorage.transactionTypeSearchData 	=	$scope.search;
			sessionStorage.transactionTypePageLimit    	=   $scope.entryLimit;
			Data.get('/transactiontype?key='+search_data).then(function (data) {
				var transtypelist=[];
				$scope.list1=data;
				angular.forEach($scope.list1,function(item) {
					var abc=item.tranCode;
					if(abc != ""){
						var bcd= $scope.trantypecodes[abc];
						item.transcodedesc=bcd;
					}else{
						item.transcodedesc="";
					}
					transtypelist.push(item);
				});
				$scope.list = transtypelist;
				$scope.currentPage = 1; //current page
				$scope.filteredItems = $scope.list.length; //Initially for no filter  
				$scope.totalItems = $scope.list.length;
				
			});
	  }
	 
	 /***Reset Search****/
	$scope.trans_reset= function(){
		delete sessionStorage.transactionTypeSearchData;
		$scope.search 		=	'';
		$scope.entryLimit 	= 	$rootScope.PAGE_SIZE;
		$scope.transtype_search();	
	}

	$scope.transtype_search();
	 
	 
	 
	/*****Delete Transaction****/
	$scope.trans_delete = function (id,trantyid) {
		
		 var trans_id = id ;
		 var trantypid= trantyid;
		 
		$.confirm({
			title: 'Delete Transaction',
			content: 'Confirm delete?',
			confirmButtonClass: 'btn-primary',
			cancelButtonClass: 'btn-primary',
			confirmButton: 'Ok',
			cancelButton: 'Cancel',
			confirm: function () {
				Data.delete('/transactiontype/'+trans_id).then(function (data) {
					Data.get('/transactionrule?trantypeid='+trantypid).then(function (results) {
							
							var truleids=[];
							if((results != '')&&(results != undefined)){
								
								angular.forEach(results,function(item) {
									truleids.push(item._id);
								});
								
							}
							
							for(i=0;i<truleids.length;i++){
								
								var ruldefid=truleids[i];
								Data.delete('/transactionrule/'+ruldefid).then(function (data) {
									
								});
							}
							
							var output={"status":"success","message":$scope.ovcLabel.transactionType.list.transaction_delete_success};
							Data.toast(output);
							$scope.transtype_search();
					});
								
				});
			},
			cancel: function () {
				return false;
			}
		
		});
		return false;
	}
	 
});
			

app.controller('uptransactionCtrl', function($rootScope, $scope, $state , $cookieStore, $stateParams, $timeout, Data, RULEDEFN,  POSRULEDEFN, NEGRULEDEFN,
TWORULEDEFN, TRANSCODE, TRANREQFIELDS) {	 
	
	$scope.title="Edit";
	$scope.titleadd = false;
	$scope.titleedit=true;
	
	 var trtycodes=$scope.ovcLabel.transactionType.translist;
	 var ctrtycodes=TRANSCODE;
	  /*****Enable and Disable based on Permission******/
	$scope.vlitrantyp    =   true;
    $scope.moltrantyp    =   true;
    $scope.check = {};
	$scope.check.tranTypeLs = [];

	$scope.endisable = function() {
		$rootScope.$watch('ROLES',function(){
			var role_det=$rootScope.ROLES;
			angular.forEach(role_det, function(roles,key) {
				if (key== 'transactionTypes'){

					var viewTransactionTypes    =   roles.viewTransactionTypes?roles.viewTransactionTypes:0;
                    var modifyTransactionTypes 	=   roles.modifyTransactionTypes?roles.modifyTransactionTypes:0;

                    if(viewTransactionTypes    ==  1){
                        $scope.vlitrantyp    =   false;
                    }

                    if(modifyTransactionTypes  	==  1){
                        $scope.vlitrantyp    =   false;
                        $scope.moltrantyp    =   false;
                    }
				}
			});
		
		}); 
	}
	$scope.endisable();
		
		var ctrancodes=[];
		angular.forEach(ctrtycodes,function(item) {
						
			var abc=item.code;
			var bcd= trtycodes[abc];

					item.label=bcd;	
				ctrancodes.push(item);
		});
	 
		$scope.transtypes=ctrancodes;				  
	
	
	var transact_id = $stateParams.transid; 
	
	$scope.tranid=transact_id;

	
	$scope.changeclass1=function(){
		$scope.newclass1="selected_radio";
		$scope.newclass2="";
	}
	
	$scope.changeclass2=function(){
		$scope.newclass1="";
		$scope.newclass2="selected_radio";
	}
	
	
	var cardesc=$scope.ovcLabel.transactionType.tranreqfields;
	var ccodes=TRANREQFIELDS ;
	var carrcodes=[];
	angular.forEach(ccodes,function(item) {
					
		var abc=item.Name;
		
			var bcd= cardesc[abc];
				item.description=bcd;	
			carrcodes.push(item);	
	});
	
	var trule_con=RULEDEFN;
		var lab_bal=$scope.ovcLabel.transactionType.transrules;
		var trulelist=[];
		var trlist=[];
		var trdata={};
		var trinobj=[];
		angular.forEach(trule_con,function(trules) {
		
			angular.forEach(trules,function(trules2,key2) {
				 trinobj[key2]=[];
				angular.forEach(trules2,function(item) {
					
					var abc=item.Name;
					var bcd= lab_bal[abc];
					var lmodel='Erule.'+item.label;
					var newitem={
						rulename:bcd,
						rulemodel:lmodel,
						rulelabel:item.label,
						ruleid:item.id
					}; 
				 	trlist.push(newitem);
					trdata[item.label]=lmodel;
					trinobj[key2].push(newitem);
				});
			});
		});
		
		$scope.translist=trinobj;
		//$scope.translist=trlist;
		$scope.newbalances=trdata;
		
		$scope.change_trancode=function(trcode){
			
			if(trcode=='POS'){		  
						var trule_con=POSRULEDEFN;
			}else 	if(trcode=='NEG'){
						var trule_con=NEGRULEDEFN;
			}else 	if(trcode=='TWO'){
						var trule_con=TWORULEDEFN;
			}else{
						var trule_con=TWORULEDEFN;
			}
						
						var lab_bal=$scope.ovcLabel.transactionType.transrules;
						
						var trulelist=[];
						var trlist=[];
						var trdata={};
						var  trinobj=[];
						angular.forEach(trule_con,function(trules,key) {
								
							angular.forEach(trules,function(trules2,key2) {
								 trinobj[key2]=[];
								angular.forEach(trules2,function(item) {
									
									var abc=item.Name;
									var bcd= lab_bal[abc];
									var lmodel='Erule.'+item.label;
									var nocheck=nodisable=addcheck=adddisable=subcheck=subdisable=recalcheck=recaldisable='';
									if((item.noaction=='T') || (item.noaction=='N')){
											nocheck=false;
											 nodisable=false;
									}else if(item.noaction=='F'){
										 nocheck=true;
											 nodisable=true;
									
									}else if(item.noaction=='P'){
										 nocheck=false;
											 nodisable=true;
									}
									if((item.add=='T') || (item.add=='N')){
											 addcheck=false;
											adddisable=false;
									}else if(item.add=='F'){
										 addcheck=true;
											 adddisable=true;
									
									}else if(item.add=='P'){
										 addcheck=false;
											 adddisable=true;
									}
										if((item.subtract=='T') || (item.subtract=='N')){
											subcheck=false;
											 subdisable=false;
									}else if(item.subtract=='F'){
										 subcheck=true;
											subdisable=true;
									
									}else if(item.subtract=='P'){
										subcheck=false;
										 subdisable=true;
									}
										if((item.recalculate=='T') || (item.recalculate=='N')){
											 recalcheck=false;
											 recaldisable=false;
									}else if(item.recalculate=='F'){
										 recalcheck=true;
											 recaldisable=true;
									
									}else if(item.recalculate=='P'){
										recalcheck=false;
											recaldisable=true;
									}
									var newitem={
										rulename:bcd,
										rulemodel:lmodel,
										rulelabel:item.label,
										ruleid:item.id,
										rulenoact:nocheck,
										rulenostatus:nodisable,
										ruleadd:addcheck,
										ruleaddstatus:adddisable,
										rulesub:subcheck,
										rulesubstatus:subdisable,
										rulerecal:recalcheck,
										rulerecalstatus:recaldisable,
									}; 
									//trlist.push(newitem);
									trinobj[key2].push(newitem);
									
									if(nocheck==true){
											trdata[item.label]="Noaction";
									}else if(addcheck==true){
											trdata[item.label]="Add";
									}else if(subcheck==true){
											trdata[item.label]="Subtract";
									}else if(recalcheck==true){
											trdata[item.label]="Recalculate";
									}else{
										trdata[item.label]=lmodel;
									}
								});
							});
							
						});
						
			$scope.translist=trinobj;
			//$scope.translist=trlist;
			$scope.newbalances=trdata;
			$scope.balanlist =$scope.newbalances;
			
		}

	/*$scope.serviceCallFuncs = function( ) {

        Data.get('/transactiontype?isAllowReversal=true').then(function(results) {
           if( results ){
                
                var tranData   =   [];

                angular.forEach(results, function(item) {
                    tranData[item.tranTypeId]   =   item.tranName;
                });
               
                $scope.check.tranTypeLs   =   tranData;
            }
        });

    }
    $scope.serviceCallFuncs();*/
		
	Data.get('/transactiontype?id='+transact_id).then(function (data) {
			if(data.isActive == true){
				$scope.newclass1="selected_radio";
				$scope.newclass2="";
				
			}else if(data.isActive == false){
				$scope.newclass1="";
				$scope.newclass2="selected_radio";
				
			}
			
			serviceCallFuncs(Data, data.tranTypeId ,function( returnTranData, fullTranData ){
				$scope.check.tranTypeLs = returnTranData;
				fullTranList = fullTranData;
			});

			$scope.t_add 					= 	{};
			$scope.t_add.id 				= 	data._id,
			$scope.t_add.transactioncode 	= 	data.tranCode,
			$scope.t_add.transid 			= 	data.tranTypeId,
			$scope.t_add.trname 			= 	data.tranName,
			$scope.t_add.trdesc 			= 	data.description,
			$scope.t_add.requiredcost 		= 	data.isCostRequired,
			$scope.t_add.crossupdate 		=  	data.updateCrossChannel,
			$scope.t_add.glupdate 			= 	data.updateGl,
			$scope.t_add.status 			= 	data.isActive,
			$scope.t_add.allow_rvs  		=  	data.isAllowReversal,
			$scope.t_add.man_tran			=	data.isManualTransaction,
			$scope.t_add.revTranType 		=	data.reversalTranTypeId,
			
			$scope.transation_nam=$scope.t_add.trname;
			if(data.reversalTranTypeId){
				$scope.t_add.rvs_of_exst		= 	true;
			}

			if(data.requiredFields !=undefined){
				$scope.newfields=data.requiredFields;
				var alexistfield=$scope.newfields;
				var exitfields=[];
				var datas= JSON.parse(alexistfield);

				for (var key in datas)
				{
					exitfields.push(key);
				}
				var reqefields=exitfields.toString(); 
		
				$scope.items=carrcodes;
				var newrows = []; 
				var selectedrows=[];
				$scope.SecondItems=[];
				$scope.SecondSelectedItems=[];
						
		
				angular.forEach($scope.items,function(item) {
					
					var existdata=new Array();
					var abc= reqefields;
					
					existdata = abc.split(',');
					  if(existdata.indexOf(item.description)!= -1){
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
			}else{
			    var newrows = []; 
				$scope.SecondItems=[];
				$scope.items=carrcodes;
					angular.forEach($scope.items,function(item) {
								item.selected=false;
									 newrows.push(item);
					});
				
				$scope.SecondItems=newrows;
			}
			
			var trantypid= data.tranTypeId;
			
			
			/************tranrule based on trancode************/
			
				if(data.tranCode=='POS'){		  
						var trule_con=POSRULEDEFN;
			}else 	if(data.tranCode=='NEG'){
						var trule_con=NEGRULEDEFN;
			}else 	if(data.tranCode=='TWO'){
						var trule_con=TWORULEDEFN;
			}else{
					var trule_con=TWORULEDEFN;
			}
						
						var lab_bal=$scope.ovcLabel.transactionType.transrules;
						
						var trulelist=[];
						var trlist=[];
						var trdata={};
						var trinobj=[];
						angular.forEach(trule_con,function(trules,key) {
								
							angular.forEach(trules,function(trules2,key2) {
								trinobj[key2]=[];
								angular.forEach(trules2,function(item) {

									var abc=item.Name;
									var bcd= lab_bal[abc];
									var lmodel='Erule.'+item.label;
									var nocheck=nodisable=addcheck=adddisable=subcheck=subdisable=recalcheck=recaldisable='';
									if((item.noaction=='T') || (item.noaction=='N')){
											nocheck=false;
											 nodisable=false;
									}else if(item.noaction=='F'){
										 nocheck=true;
											 nodisable=true;
									
									}else if(item.noaction=='P'){
										 nocheck=false;
											 nodisable=true;
									}
									if((item.add=='T') || (item.add=='N')){
											 addcheck=false;
											adddisable=false;
									}else if(item.add=='F'){
										 addcheck=true;
											 adddisable=true;
									
									}else if(item.add=='P'){
										 addcheck=false;
											 adddisable=true;
									}
										if((item.subtract=='T') || (item.subtract=='N')){
											subcheck=false;
											 subdisable=false;
									}else if(item.subtract=='F'){
										 subcheck=true;
											subdisable=true;
									
									}else if(item.subtract=='P'){
										subcheck=false;
										 subdisable=true;
									}
										if((item.recalculate=='T') || (item.recalculate=='N')){
											 recalcheck=false;
											 recaldisable=false;
									}else if(item.recalculate=='F'){
										 recalcheck=true;
											 recaldisable=true;
									
									}else if(item.recalculate=='P'){
										recalcheck=false;
											recaldisable=true;
									}
									var newitem={
										rulename:bcd,
										rulemodel:lmodel,
										rulelabel:item.label,
										ruleid:item.id,
										rulenoact:nocheck,
										rulenostatus:nodisable,
										ruleadd:addcheck,
										ruleaddstatus:adddisable,
										rulesub:subcheck,
										rulesubstatus:subdisable,
										rulerecal:recalcheck,
										rulerecalstatus:recaldisable,
									}; 
									//trlist.push(newitem);
									trinobj[key2].push(newitem);
								
									if(nocheck==true){
											trdata[item.label]="Noaction";
									}else if(addcheck==true){
											trdata[item.label]="Add";
									}else if(subcheck==true){
											trdata[item.label]="Subtract";
									}else if(recalcheck==true){
											trdata[item.label]="Recalculate";
									}else{
										trdata[item.label]=lmodel;
									}
								});
							});
							
						});
						
			$scope.translist=trinobj;
			//$scope.translist=trlist;
			$scope.newbalances=trdata;
		
			$scope.balanlist = [];
			Data.get('/transactionrule?trantypeid='+trantypid).then(function (data) {			
		
				if((data !='' ) && (data != undefined) &&(data.length != 0 )){
					
					$scope.balanlist =$scope.newbalances;
					$scope.tranruleids=[];
					$scope.tranruleids=data;
					sessionStorage.truleids= JSON.stringify(data);
					
					angular.forEach(data,function(item) {
						
						if((item.noAction)==true){
							$scope.balanlist[item.balanceType]="Noaction";
						}
						else if((item.add)==true){
							$scope.balanlist[item.balanceType]="Add";
						}
						else if((item.subtract)==true){
							$scope.balanlist[item.balanceType]="Subtract";
						}
						else if((item.recalculate)==true){
							$scope.balanlist[item.balanceType]="Recalculate";
						}
						
					});
					
				}else{
					
					$scope.balanlist=$scope.newbalances;
				} 
				
			}); 		
	});
	
	sessionStorage.tranreqall = "true";
	
	
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
	
	
		$scope.select_treqs=function(){
			if($scope.fieldsrequired==true){
				$scope.fieldsrequired=false;
			}
		}
	

	$scope.transaction_add=function(t_add,trrule){
		
		$scope.submitted="true";
		$scope.check.checkUnique = true;
		var newreq=$scope.SecondSelectedItems;
			if(newreq.length==0){
				$scope.fieldsrequired=true;
			}else if (newreq.length >= 1){
			$scope.fieldsrequired=false;
			}

		if(t_add.transid && t_add.transid != '')
			(fullTranList.indexOf(t_add.transid) == -1) ? $scope.check.checkUnique = false : $scope.check.checkUnique = true;
		
		if((t_add != undefined)&&(t_add.transid != undefined) && $scope.check.checkUnique === false/*&&($scope.fieldsrequired== false)*/){
			
			var trans=t_add;
			
			if(trans.allow_rvs  ===  undefined || trans.allow_rvs  ===  false)
			{
				var allow_rvs  =  false;
			}
			else
			{
				var allow_rvs  =  true;
			}

			/*if((trans.requiredcost== undefined)){
				
				var reqcost=false;
			}else{
				
				var reqcost=trans.requiredcost;
			}
		
			if((trans.glupdate== undefined)){
				
				//var upgl=true;
				var upgl=false;
			}else{
				
				var upgl=trans.glupdate;
			}*/
			
			var trstatus=trans.status;
			var carows = []; 
						
				var newcarrier=$scope.SecondSelectedItems;
				angular.forEach(newcarrier,function(item) {
					
					carows.push(item.description);
				});
							
			var reqfields=carows.toString();
			
			
			var dataObj = {
				tranTypeId 			: 	trans.transid,
				tranName 			: 	trans.trname,
				description 		: 	trans.trdesc,
				tranCode 			: 	trans.transactioncode,
				// isCostRequired 	: 	reqcost,
				isActive 			: 	trstatus,
				// requiredFields 	: 	reqfields,
				// updateGl 		: 	upgl,
				isAllowReversal 	: 	trans.rvs_of_exst?false:allow_rvs,
				reversalTranTypeId 	: 	trans.rvs_of_exst?trans.revTranType:'',
				isManualTransaction : 	trans.man_tran
				// exportOH			: 	trans.exportOH
			};
			
			$scope.transactid 	= 	trans.transid;
			
			Data.post('/transactiontype/'+transact_id, {
				data:dataObj
			}).then(function (results) {
				
				if(results.ok==1){
					
					if((sessionStorage.truleids !='') &&(sessionStorage.truleids !=undefined)){
						$scope.updtids = JSON.parse(sessionStorage.truleids);
					}
					
					if(trrule != undefined){
						var tranrulelist=[];
						var newtranlist=[];
						var getoldrule=[];
						angular.forEach(trrule,function(item,key) {
							
							if(item=="Noaction"){
								var tr_noact="true";
								var tr_subt="false";
								var tr_recalc="false";
								var tr_add="false";
							}else if(item=="Add"){
								var tr_noact="false";
								var tr_subt="false";
								var tr_recalc="false";
								var tr_add="true";
							}else if(item=="Subtract"){
								var tr_noact="false";
								var tr_subt="true";
								var tr_recalc="false";
								var tr_add="false";
							}
							else if(item=="Recalculate"){
								var tr_noact="false";
								var tr_subt="false";
								var tr_recalc="true";
								var tr_add="false";
								
							}
							else{
								var tr_noact="true";
								var tr_subt="false";
								var tr_recalc="false";
								var tr_add="false";
							}
							
							
							if(($scope.updtids !='')&&($scope.updtids != undefined)){
								
								angular.forEach($scope.updtids,function(iditem) {
									
									if(iditem.balanceType==key){
										var trule_id=iditem._id;
										var dataObj2 = {
											id:trule_id,
											tranTypeId: $scope.transactid,
											noAction : tr_noact,
											recalculate: tr_recalc,
											subtract: tr_subt,
											add :tr_add,
											balanceType:key
										};
										tranrulelist.push(dataObj2);
										getoldrule.push(iditem.balanceType);
									}
								});
							
							}else{
								
								var dataObj3 = {
									tranTypeId: $scope.transactid,
									noAction : tr_noact,
									recalculate: tr_recalc,
									subtract: tr_subt,
									add :tr_add,
									balanceType:key
								};
								newtranlist.push(dataObj3);								
							}
							
						});
						
						angular.forEach(trrule,function(item,key) {
							
							if(item=="Noaction"){
								var tr_noact="true";
								var tr_subt="false";
								var tr_recalc="false";
								var tr_add="false";
							}else if(item=="Add"){
								var tr_noact="false";
								var tr_subt="false";
								var tr_recalc="false";
								var tr_add="true";
							}else if(item=="Subtract"){
								var tr_noact="false";
								var tr_subt="true";
								var tr_recalc="false";
								var tr_add="false";
							}
							else if(item=="Recalculate"){
								var tr_noact="false";
								var tr_subt="false";
								var tr_recalc="true";
								var tr_add="false";
								
							}
							else{
								var tr_noact="true";
								var tr_subt="false";
								var tr_recalc="false";
								var tr_add="false";
							}
							if(getoldrule.indexOf(key) > -1){
										return false;
										
							}else{
								var dataObj3 = {
									tranTypeId: $scope.transactid,
									noAction : tr_noact,
									recalculate: tr_recalc,
									subtract: tr_subt,
									add :tr_add,
									balanceType:key
								};
								newtranlist.push(dataObj3);		
							
							}
							
						});
							
						for(i=0;i<tranrulelist.length;i++){ 
							  
							  var trid=tranrulelist[i].id;
							
								Data.post('/transactionrule/'+trid, {
									data:tranrulelist[i]
								}).then(function (results) {
									
								});
						}
						
						for(i=0;i<newtranlist.length;i++){ 
							
								Data.put('/transactionrule', {
									data:newtranlist[i]
								}).then(function (results) {
									
								});

						}
					
					}
						$scope.updtids='';
					delete sessionStorage.truleids;
					var output={"status":"success","message":$scope.ovcLabel.transactionType.list.transaction_update_success};
					Data.toast(output);
					
					$state.go('ovc.transaction-type');	
						
				}else{
					
					delete sessionStorage.truleids;
				}
			});	
		}else{
					$timeout(function() {
						angular.element('#desc_detail').trigger('click');
					}, 1);
		}
		
	}
	
	$scope.transaction_cancel=function(){
		
		delete sessionStorage.truleids;
		$state.go('ovc.transaction-type');	
	}
	
	
});	


app.directive('dropdownMultiselecttrans', function () {
    return {
        restrict: 'A',
        scope: {
            items: "=",
            selectedItems: "="//,
			//moltrantyp:"="
			//$scope.moltrantyp=true;isopenuib-
        },
        template: "<div class='dropdown col-md-1 offset0 margintLeft15 marginRigth5'  uib-dropdown is-open='status.isopen'  ng-hide='moltrantyp'>" +
						 "<a  class='btn btn-primary uib-dropdown-toggle'    uib-dropdown-toggle ng-click='openDropdown($event)' >" +
                            "Add <span class='caret'></span>" +
                        "</a>"+
                        "<div class='dropdown-menu expertDropList' style='position: relative;min-width:220px;' >" +
                            "<div class='col-md-12 marginBottom15'>" +
                               "<div class='pull-left'>" +
									 "<input type='checkbox' style='margin:5px 6px;' ng-model='allselected' id='checkall' ng-click='selectAll($event)'  />" +
                                "<label id='selectall' style='padding-left:3px'>Select All</label>" +
                                "</div>" +
                            "</div>" +
                            "<div style='padding-left:10px;' data-ng-repeat='item in items' class='expertDropListBox  expDropList2' ng-click='handleClick($event)'>" +
                                "<input type='checkbox' style='margin:5px 10px;' ng-model='item.selected' ng-checked='{{item.selected}}' ng-click='clickItem($event)' ng-change='selectItem(item)'  />" +
                                "{{item.description}}" +
                            "</div>" +
                        "</div>" +
                    "</div>",
					/* "<div class='dropdown col-md-1 offset0 margintLeft15 marginRigth5' is_open='status.open' ng-hide='moltrantyp'>" +
						 "<a    class='btn btn-primary dropdown-toggle'    ng-click='openDropdown($event)' >" +
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
                                "<input type='checkbox' style='margin:5px 10px;' ng-model='item.selected' ng-checked='{{item.selected}}' ng-click='clickItem($event)' ng-change='selectItem(item)'  />" +
                                "{{item.description}}" +
                            "</div>" +
                        "</div>" +
                    "</div>", */
        controller: function ($scope, $timeout) {
			
            $scope.handleClick = function ($event) {
                $event.stopPropagation();
            };
            $scope.status = {
                isopen: false
            };
            $scope.status = { isopen: false };
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
                $event.stopPropagation();
                $scope.status.isopen = true;
            };

            $scope.selectItem = function (item) {
				
				$timeout(function() {
									angular.element('#selectreq_detail').trigger('click');
								}, 1);
		
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
					 if(sessionStorage.tranreqall=="true"){
					
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
									angular.element('#tranreq_detail').trigger('click');
								}, 1);
						
					}
					
					if(sessionStorage.tranreqall){
						$timeout(function() {
							angular.element('#tranreq_detail').trigger('click');
						}, 1);
						
						delete sessionStorage.tranreqall;
						
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
