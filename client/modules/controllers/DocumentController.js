var app=angular.module('OVCstockApp',[]);
 app.controller('documentlistCtrl', function($rootScope, $scope,$state,  $timeout, $stateParams, ovcDash, Data, DOCUMENTRULE, DOCREQFIELDS,TRANSTYPE, 
 TRANSTATUS , TRANSCODE) {	 
 
	delete sessionStorage.druleids;
	
  $scope.trantypecodes=$scope.ovcLabel.directiveType.translist;
	 
	 var trtycodes=$scope.ovcLabel.directiveType.translist;
	 var trstatus=$scope.ovcLabel.directiveType.transtatus;
	 var trtype=$scope.ovcLabel.directiveType.transtype;
	 var ctrtycodes=TRANSCODE;
	 var ctrstatus=TRANSTATUS;
	 var ctrtype=TRANSTYPE;
	 
	 /*****Enable and Disable based on Permission******/
	$scope.vlidirtyp	=	true;
	$scope.moldirtyp	=	true;
	$scope.servicefun2 = function() {
		$rootScope.$watch('ROLES',function(){
			var role_det=$rootScope.ROLES;
			angular.forEach(role_det, function(roles,key) {
				if (key== 'directiveTypes'){

					var viewDirectiveTypes		=	roles.viewDirectiveTypes?roles.viewDirectiveTypes:0;
					var modifyDirectiveTypes	=	roles.modifyDirectiveTypes?roles.modifyDirectiveTypes:0;

					if(viewDirectiveTypes		==	1){
						$scope.vlidirtyp	=	false;
					}

					if(modifyDirectiveTypes	==	1){
						$scope.vlidirtyp	=	false;
						$scope.moldirtyp	=	false;
					}
				}
			});
		
		}); 
	}
	$scope.servicefun2();
		
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
		
		/* get store or locations from mysql service */
	$scope.getStores = function () {
		ovcDash.get('apis/ang_getlocations').then(function (results) {
			$scope.store_datas = results;
		});
	};
	 
	
    $scope.setPage = function(pageNo) {
        $scope.currentPage = pageNo;
    };
    
    $scope.sort_by = function(predicate) {
        $scope.predicate = predicate;
        $scope.reverse = !$scope.reverse;
    };
					  
	
	 
	$scope.getStores(); // get stores from mysql service

	$scope.search 		=	'';

    if($stateParams.fullList){
        delete sessionStorage.directiveTypeSearchData;
        delete sessionStorage.directiveTypePageLimit;
    }

    if(sessionStorage.directiveTypeSearchData){
    	$scope.search 	=	sessionStorage.directiveTypeSearchData;
    }

    $scope.entryLimit 	= 	sessionStorage.directiveTypePageLimit ? sessionStorage.directiveTypePageLimit : $rootScope.PAGE_SIZE; //max no of items to display in a page
	
	 
	$scope.doctype_search=function(){
	  	var search_data	=	$scope.search;
		sessionStorage.directiveTypeSearchData 	=	$scope.search;
		sessionStorage.directiveTypePageLimit   =   $scope.entryLimit;
		
		Data.get('/documenttype?key='+search_data).then(function (data) {
			var transtypelist=data;
			$scope.list = transtypelist;
			$scope.currentPage = 1; //current page
			$scope.filteredItems = $scope.list.length; //Initially for no filter  
			$scope.totalItems = $scope.list.length;
		});
				
	};

	$scope.doctype_search();
	 
	 /***Reset Search****/
	$scope.docu_reset= function(){
		delete sessionStorage.directiveTypeSearchData;
        delete sessionStorage.directiveTypePageLimit;
        $scope.search 		=	'';
        $scope.entryLimit 	= 	$rootScope.PAGE_SIZE; //max no of items to display in a page
		$scope.doctype_search();
	}
	
	
	/*****Delete Transaction****/
	$scope.docs_delete = function (id,doctyid) {
		
		 var docs_id = id ;
		 var docutypid= doctyid;
		 
		$.confirm({
			title: 'Delete Directive Type',
			content: 'Confirm delete?',
			confirmButtonClass: 'btn-primary',
			cancelButtonClass: 'btn-primary',
			confirmButton: 'Ok',
			cancelButton: 'Cancel',
			confirm: function () {
				Data.delete('/documenttype/'+docs_id).then(function (data) {
					Data.get('/documentrule?directivetypeid='+docutypid).then(function (results) {
							
							var truleids=[];
							if((results != '')&&(results != undefined)){
								
								angular.forEach(results,function(item) {
									truleids.push(item._id);
								});
								
							}
							
							for(i=0;i<truleids.length;i++){
								
								var ruldefid=truleids[i];
								Data.delete('/documentrule/'+ruldefid).then(function (data) {
									
								});
							}
							
							var output={"status":"success","message":$scope.ovcLabel.directiveType.directive_delete_success};
							Data.toast(output);
							$scope.doctype_search();
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


/******Add Directive type ********/
 app.controller('documentCtrl', function($rootScope,$scope,$state, $timeout, DOCUMENTRULE, Data, RULEDEFN, POSRULEDEFN, NEGRULEDEFN, TWORULEDEFN, 
 TRANSCODE,DOCREQFIELDS,TRANREQFIELDS) {	 
 
	$scope.title="Add";
	$scope.titleadd =true;
	$scope.titleedit=false;
	//$scope.codedirect=[];
	$scope.vlidirtyp=false;
	$scope.moldirtyp=false;
	
	/* get transaction types from micro service */
	$scope.getTranType = function () {
		Data.get('/transactiontype').then(function (results) {
			
			var trantypes = [];
			var trancodedirect=[];
			angular.forEach(results, function(values) {
				if((values.isActive) && (values.tranName != undefined)&&(values.tranName != '') && (values.tranTypeId != undefined) &&(values.tranTypeId != '')){
					var newobj={
					tranName:values.tranName,
					tranTypeId:values.tranTypeId
					}
					trantypes.push(newobj);
				}
			});
			$scope.tran_datas = trantypes;
			
		});
	};
		
	$scope.getTranType();
			
	$scope.newclass1="selected_radio";
	$scope.newclass2="";
	$scope.status=1;
	
	$scope.changeclass1=function(){
		$scope.newclass1="selected_radio";
		$scope.newclass2="";
	}
	
	$scope.changeclass2=function(){
		$scope.newclass1="";
		$scope.newclass2="selected_radio";
	}
	
	
	var docdesc=$scope.ovcLabel.directiveType.tranreqfields;
	var ccodes=TRANREQFIELDS ;
	var docreqs=[];
	angular.forEach(ccodes,function(item) {
					
		var abc=item.Name;
		
			var bcd= docdesc[abc];
				item.description=bcd;	
			docreqs.push(item);	
	});
	

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
	
	$scope.select_alldocs=function(){
			var newrows = []; 
			var selectedrows=[];
			var abc=$scope.FirstItems;
			
			angular.forEach(abc,function(item) {
					 item.selected=true;
							selectedrows.push(item);	 
			});
			$scope.FirstSelectedItems=selectedrows; 
	} 
	
	
	$scope.select_reqs=function(){
		if($scope.fieldsrequired==true){
				$scope.fieldsrequired=false;
			}
	
	}
	
		var trule_con=RULEDEFN;
		var lab_bal=$scope.ovcLabel.directiveType.transrules;
		
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
					var lmodel='Drule.'+item.label;
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
		$scope.balancemodels=trdata;
	
		$scope.balanlist = $scope.balancemodels;
			var docrule_con=DOCUMENTRULE;
		var lab_bal=$scope.ovcLabel.directiveType.transrules;
		
		var drulelist=[];
		var drlist=[];
		var drdata={};
		var drtinobj=[];
		angular.forEach(docrule_con,function(drules,key) {
			angular.forEach(drules,function(drules2,key2) {
				drtinobj[key2]=[];
				angular.forEach(drules2,function(item) {
				
					var abc=item.Name;
					var bcd= lab_bal[abc];
					var lmodel='Drule.'+item.label;
					var newitem={
						rulename:bcd,
						rulemodel:lmodel,
						rulelabel:item.label,
						ruleid:item.id
					}; 
				 	drlist.push(newitem);
					drdata[item.label]=lmodel;
					drtinobj[key2].push(newitem);
				});
			});
			
		});
		$scope.dranslist=drtinobj;
		//$scope.dranslist=drlist;
		$scope.docmodels=drdata;
	
		$scope.doclist = $scope.docmodels;
	
	$scope.GetSelectedTransaction=function(value){
	
			var trantypid= value;
			
			$scope.balanlist = [];
			Data.get('/transactionrule?trantypeid='+trantypid).then(function (data) {			
				
						if((data !='' ) && (data != undefined) &&(data.length != 0 )){
							
							$scope.balanlist =$scope.balancemodels;
							$scope.tranruleids=[];
							$scope.tranruleids=data;
							
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
							
							$scope.balanlist=$scope.balancemodels;
						} 	
			});
			
			$scope.FirstItems=[];
			$scope.FirstSelectedItems=[];
			
				Data.get('/transactiontype?trantypeid='+trantypid).then(function (data) {	
				
					var trandata=data[0];
				
						if(data[0].requiredFields !=undefined){
							$scope.newfields=data[0].requiredFields;
							var alexistfield=$scope.newfields;
							 var exitfields=[];
							var datas= JSON.parse(alexistfield);

							for (var key in datas)
							{
								exitfields.push(key);
							}
							var reqefields=exitfields.toString();  
					
							$scope.items=docreqs;
							var newrows = []; 
							var selectedrows=[];
							
									
					
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
							
							$scope.FirstItems=newrows;
							$scope.FirstSelectedItems=selectedrows; 
						}

				});
	}
	
	$scope.document_add = function (D_add,Drule)
	 {
		$scope.submitted="true";
	
				 if( (D_add != undefined) &&(D_add.docid != undefined ) &&(D_add.docname!= undefined ) &&(D_add.transactionTypeId != undefined)){
					$scope.doctranid =D_add.transactionTypeId;
				
				
				if((D_add.status== undefined)){
					
					var docstatus=true;
				}else{
					
					var docstatus=D_add.status;
				}
		
				
				var dataObj = {
					directiveTypeId:D_add.docid,
					directiveName: D_add.docname,
					description:D_add.docdesc,
					tranTypeId:$scope.doctranid,
					isActive: docstatus
				};
					$scope.documentid=D_add.docid;
					
					Data.put('/documenttype', {
						data:dataObj
					}).then(function (results) { 
					
						if(results.__v==0){ 
							 
							if(Drule != undefined){
								var tranrulelist=[];
								angular.forEach(Drule,function(item,key) {
									
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
										
										directiveTypeId:$scope.documentid,
										balanceType: key, 
										add: tr_add,
										subtract:  tr_subt,
										recalculate:tr_recalc,
										noAction :  tr_noact
									};
									tranrulelist.push(dataObj2);
								});
									
									
									for(i=0;i<tranrulelist.length;i++){ 
									
										Data.put('/documentrule', {
											data:tranrulelist[i]
										}).then(function (results) {
											
										});

									}
									
									var output={"status":"success","message":$scope.ovcLabel.directiveType.directive_add_success};
											Data.toast(output);
											$state.go('ovc.document-list');
							}		
							
					 	}
					}); 
			
			}else{
						$timeout(function() {
							angular.element('#desc_detail').trigger('click');
						}, 1);
			} 

	 }
	 
	$scope.document_cancel=function(){

			 $state.go('ovc.document-list');
		}

});


/************Edit Document Type ************/
app.controller('editdocumentCtrl', function($rootScope, $scope,$state,  $cookieStore, $stateParams, $timeout, DOCUMENTRULE, Data, RULEDEFN,
TRANSCODE,DOCREQFIELDS,TRANREQFIELDS) {	

		$scope.title="Edit";
		$scope.titleadd = false;
	$scope.titleedit=true;
		$scope.vlidirtyp='';
		$scope.moldirtyp=''; 
		var docu_id = $stateParams.docid; 
	
		$scope.document_id=docu_id ;
		
		$scope.changeclass1=function(){
			$scope.newclass1="selected_radio";
			$scope.newclass2="";
		}
		
		$scope.changeclass2=function(){
			$scope.newclass1="";
			$scope.newclass2="selected_radio";
		}
		/*****Enable and Disable based on Permission******/
	$scope.vlidirtyp	=	true;
	$scope.moldirtyp	=	true;
	$scope.endisable = function() {
		$rootScope.$watch('ROLES',function(){
			var role_det=$rootScope.ROLES;
			angular.forEach(role_det, function(roles,key) {
				if (key== 'directiveTypes'){

					var viewDirectiveTypes		=	roles.viewDirectiveTypes?roles.viewDirectiveTypes:0;
					var modifyDirectiveTypes	=	roles.modifyDirectiveTypes?roles.modifyDirectiveTypes:0;

					if(viewDirectiveTypes		==	1){
						$scope.vlidirtyp	=	false;
					}

					if(modifyDirectiveTypes	==	1){
						$scope.vlidirtyp	=	false;
						$scope.moldirtyp	=	false;
					}
				}
			});
		
		}); 
	}
	$scope.endisable();
	
		/* get transaction types from micro service */
	$scope.getTranType = function () {
		Data.get('/transactiontype').then(function (results) {
			var trantypes = [];
			angular.forEach(results, function(values) {
				if((values.isActive) && (values.tranName != undefined) &&(values.tranName != '') && (values.tranTypeId != undefined) &&(values.tranTypeId != '')){
					var newobj={
					tranName:values.tranName,
					tranTypeId:values.tranTypeId
					} 
					trantypes.push(newobj);
						
				}
			});
			$scope.tran_datas = trantypes;
		});
		
	};
	
	$scope.getTranType();
	
	var docdesc=$scope.ovcLabel.directiveType.tranreqfields;
	var ccodes=TRANREQFIELDS ;
	var docreqs=[];
	angular.forEach(ccodes,function(item) {
					
		var abc=item.Name;
		
			var bcd= docdesc[abc];
				item.description=bcd;	
			docreqs.push(item);	
	});
	
		var trule_con=RULEDEFN;
		var lab_bal=$scope.ovcLabel.directiveType.transrules;
		
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
					var lmodel='Drule.'+item.label;
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
		$scope.balancemodels=trdata;
			var docrule_con=DOCUMENTRULE;
		var lab_bal=$scope.ovcLabel.directiveType.transrules;
		
		var drulelist=[];
		var drlist=[];
		var drdata={};
		var drtinobj=[];
		angular.forEach(docrule_con,function(drules,key) {
			angular.forEach(drules,function(drules2,key2) {
				drtinobj[key2]=[];
				angular.forEach(drules2,function(item) {
				
					var abc=item.Name;
					var bcd= lab_bal[abc];
					var lmodel='Drule.'+item.label;
					var newitem={
						rulename:bcd,
						rulemodel:lmodel,
						rulelabel:item.label,
						ruleid:item.id
					}; 
				 	drlist.push(newitem);
					drdata[item.label]=lmodel;
					drtinobj[key2].push(newitem);
				});
			});
		});
		
		$scope.dranslist=drtinobj;
		//$scope.dranslist=drlist;
		$scope.docmodels=drdata;
	
	$scope.GetSelectedTransaction=function(value){
			
			var trantypid=value;
			$scope.balanlist = [];
			Data.get('/transactionrule?trantypeid='+trantypid).then(function (data) {			
				
						if((data !='' ) && (data != undefined) &&(data.length != 0 )){
							
							$scope.balanlist =$scope.balancemodels;
							$scope.tranruleids=[];
							$scope.tranruleids=data;
							
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
							
							$scope.balanlist=$scope.balancemodels;
						} 
			});
			
					$scope.SecondItems=[];
				$scope.SecondSelectedItems=[];
			
				Data.get('/transactiontype?trantypeid='+trantypid).then(function (data) {	
					var trandata=data[0];
			
						if(data[0].requiredFields !=undefined){
							$scope.newfields=data[0].requiredFields;
							var alexistfield=$scope.newfields;
							 var exitfields=[];
							var datas= JSON.parse(alexistfield);

							for (var key in datas)
							{
								exitfields.push(key);
							}
							var reqefields=exitfields.toString();  
					
							$scope.items=docreqs;
							var newrows = []; 
							var selectedrows=[];
							
									
					
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
						}
							
			
			});
	}
	
	sessionStorage.docuall="true";

		$scope.select_alldocs=function(){
				var newrows = []; 
				var selectedrows=[];
				$scope.SecondItems=[];
				$scope.SecondSelectedItems=[];
				var abc=docreqs;
				
				angular.forEach(abc,function(item) {
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
		
		Data.get('/documenttype?id='+docu_id).then(function (data) {
					var docs=data;
					
				if(data.isActive == true){
					$scope.newclass1="selected_radio";
					$scope.newclass2="";
					
				}else if(data.isActive == false){
					$scope.newclass1="";
					$scope.newclass2="selected_radio";
				}
				
				$scope.d_add={};
				$scope.d_add.id = data._id,
				$scope.d_add.docid = data.directiveTypeId,
				$scope.d_add.docname = data.directiveName,
				$scope.d_add.docdesc = data.description,
				$scope.d_add.transactionTypeId = data.tranTypeId,
				$scope.d_add.status=data.isActive
				
				$scope.direct_nam=$scope.d_add.docname;
				var trantypid= data.tranTypeId;
				
				$scope.balanlist = [];
				Data.get('/transactionrule?trantypeid='+trantypid).then(function (data) {			
					
					if((data !='' ) && (data != undefined) &&(data.length != 0 )){
						
						$scope.balanlist =$scope.balancemodels;
						$scope.tranruleids=[];
						$scope.tranruleids=data;
						
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
						
						$scope.balanlist =$scope.balancemodels;
					} 
					
				}); 	
				
				//var doctyid=data.docTypeId;
				var doctyid=docs.directiveTypeId;
				$scope.doclist = [];
				
				Data.get('/documentrule?directivetypeid='+doctyid).then(function (data) {	
					
					if((data !='' ) && (data != undefined) &&(data.length != 0 )){
						
						$scope.doclist =$scope.docmodels;
						$scope.docruleids=[];
						$scope.docruleids=data;
						sessionStorage.druleids= JSON.stringify(data);
						
						
						angular.forEach(data,function(item) {
							
							if((item.noAction==true) || ( item.noAction=="true")){
								$scope.doclist[item.balanceType]="Noaction";
							}
							else if(((item.add)==true) || (item.add=="true")){
								$scope.doclist[item.balanceType]="Add";
							}
							else if((item.subtract==true) || (item.subtract=="true")){
								$scope.doclist [item.balanceType]="Subtract";
							}
							else if((item.recalculate==true) || (item.recalculate=="true")){
								$scope.doclist[item.balanceType]="Recalculate";
							}
							
						});
						
					}else{
						
						$scope.doclist  =$scope.docmodels;
					} 
					
				}); 
				
				Data.get('/transactiontype?trantypeid='+trantypid).then(function (data) {	
					var trandata=data[0];
					
						if(data[0].requiredFields !=undefined){
							$scope.newfields=data[0].requiredFields;
							var alexistfield=$scope.newfields;
							 var exitfields=[];
							var datas= JSON.parse(alexistfield);

							for (var key in datas)
							{
								exitfields.push(key);
							}
							var reqefields=exitfields.toString();  
					
							$scope.items=docreqs;
							var newrows = []; 
							var selectedrows=[];
							
									
					
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
						}
						
				});
				
		});
		
		
		$scope.document_add = function (D_add,Drule)
		 {
			$scope.submitted="true";
		
						var newreq=$scope.SecondSelectedItems;
					if(newreq.length==0){
						$scope.fieldsrequired=true;
					}else if (newreq.length >= 1){
					$scope.fieldsrequired=false;
					}
			
		
			if( (D_add != undefined) &&(D_add.docid != undefined ) &&(D_add.docname!= undefined ) &&( D_add.transactionTypeId != undefined)){
					$scope.doctranid = D_add.transactionTypeId;
				
				
				var dataObj = {
					directiveTypeId:D_add.docid,
					directiveName: D_add.docname,
					description:D_add.docdesc,
					tranTypeId:$scope.doctranid,
					isActive: D_add.status
				};
				
					$scope.documentid=D_add.docid;
					
					Data.post('/documenttype/'+docu_id, {
						data:dataObj
					}).then(function (results) {
						if(results.ok==1){
							
							if((sessionStorage.druleids !='') &&(sessionStorage.druleids !=undefined)){
								$scope.updtids = JSON.parse(sessionStorage.druleids);
								
							}
							
							if(Drule != undefined){
								var docrulelist=[];
								var newdoclist=[];
								var getoldrule=[];
								angular.forEach(Drule,function(item,key) {
									
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
										directiveTypeId:$scope.documentid,
										noAction : tr_noact,
										recalculate: tr_recalc,
										subtract: tr_subt,
										add :tr_add,
										balanceType:key
									};
									docrulelist.push(dataObj2);
								});
									
								for(i=0;i<docrulelist.length;i++){
									Data.put('/documentrule', {
										data:docrulelist[i]
									}).then(function (results) {
										
									});
								}
							
							}
								$scope.updtids='';
							delete sessionStorage.druleids;
							var output={"status":"success","message":$scope.ovcLabel.directiveType.directive_update_success};
							Data.toast(output);
							
							$state.go('ovc.document-list');	
								
						}else{
							
							delete sessionStorage.druleids;
						}
					});		
			}else{
						$timeout(function() {
							angular.element('#desc_detail').trigger('click');
						}, 1);
			} 
		}
		
		$scope.document_cancel=function(){
		
			delete sessionStorage.druleids;
			$state.go('ovc.document-list');	
		}
}); 


	/*********Required fields***********/
app.directive('dropdownMultiselectdoc', function () {
    return {
        restrict: 'A',
        scope: {
            items: "=",
            selectedItems: "="
        },
        template: "<div class='dropdown col-md-1 offset0 margintLeft15 marginRigth5' is_open='status.open'>" +
                        "<a  class='btn btn-primary dropdown-toggle' ng-click='openDropdown($event)'>" +
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
                    "</div>",
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
									angular.element('#selreq_detail').trigger('click');
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
					 if(sessionStorage.docuall=="true"){
					
					   angular.forEach(abc, function (item) {
							if(item.selected==false){
							item.selected = true;
							$scope.selectItem(item) ;
							}
							
						});
					} 
					else{
					
								/* $timeout(function() {
									angular.element('#selreq_detail').trigger('click');
								}, 1); */
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
									angular.element('#docs_detail').trigger('click');
								}, 1);
							
					}
					
					if(sessionStorage.docuall){
						$timeout(function() {
							angular.element('#docs_detail').trigger('click');
						}, 1);
						
						delete sessionStorage.docuall;
						
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


