
var app=angular.module('OVCstockApp',['ui.bootstrap.treeview','ovcdataExport']);
/* Add/Edit count and count related things */
app.controller('countsAddCntrl',function ($rootScope, $scope,  $state, $http, $stateParams, $cookieStore, $timeout, $filter, $q, $compile, Data, ovcDash, ZCOUNT, ZONECOUNT,ovcdataExportFactory,COUNTFILEHEADER, TreeViewService, OVC_CONFIG, jmsData, userRoleConfigService, Utils, helper, COUNT_STATUS_OBJ, COUNT_ZONE_STATUS_OBJ, DISCREPANCY_FILTER){  
	$scope.action 	=	{};
	$scope.offset 	=	0;
	$scope.activePage = 1;
	var stateParamId = 0;
	$scope.selection=[];
	var countArr = [];
	if($stateParams.id !== undefined){
		stateParamId = $stateParams.id;
		$scope.count_id=$stateParams.id;
	}
	else {
		 Data.get('/count').then(function (data) {
			var results = data;
			countArr = [];
			angular.forEach(results,function(item){
				countArr.push(
		            item.name
		        );
			});
			return countArr;
		});
	}
	
	var user_detail=$rootScope.globals['currentUser'];
	var user_id=user_detail['username'];
	$scope.count 	=	{};
	$scope.count.entryLimit = 	$rootScope.PAGE_SIZE;
	$scope.count.reviewentryLimit	=	$rootScope.PAGE_SIZE;
	$scope.count.offset 			=	0;
	$scope.count.reviewoffset		=	0;
	var countDataExp	=	{};
	$scope.customtab 			=	{};
    $scope.customtab.error 		=	{};
    $scope.customtab.errormsg 	=	{};
    $scope.checksel=$scope.ovcLabel.count.labels.select_all;
    $scope.countprod 	=	{};
    $scope.startRecount = false;
    $scope.curentZone = {};
	// $scope.selchk=false;
	
	//$scope.store_locs=[];
	Utils.configurations().then (function(configData){
			$scope.config      =   configData;
	        $scope.roleConfig  =   {};
	        $scope.showStyle  = configData.showskugroup;
	        $scope.roleConfig.publishApprovedCounts 		= 	configData['config_arr'] && configData['config_arr']['publishApprovedCounts'] ?
	        													configData['config_arr']['publishApprovedCounts']['featureValue'] : "";
	}, function(error){
		console.log('Utils Configurations Error :'+ error);
	});

    Utils.roles().then( function ( roles_val ) {
        $scope.rolePerm     =   roles_val;
    }, function (error){
    	console.log('Utils Roles Error :' + error);
    });

    $scope.count.discrepancyFilter = [];
    $scope.count.selectedDiscrepancyFilter = [];
   	angular.forEach(DISCREPANCY_FILTER, function(item) {
   		try {
	        item.label = $scope.ovcLabel.count.filter[item.code];
	        $scope.count.discrepancyFilter.push(item);
	        if (item.code === 'discrepancy') {
	        	$scope.count.selectedDiscrepancyFilter.push(item);
	        }
	    }
	    catch (ex) {
	    	console.error(ex);
	    	console.error('Label resources not found for discrepancy filter');
	    }
    });
	
	$scope.times = function (n, str) {
        var result = '';
        for (var i = 0; i < n; i++) {
            result += str;
        }
        return result;
    };


	//For Popup
    var modal = document.getElementById('myModal');
    $scope.CloseModel = function(){
    	modal.style.display = "none";
    }

    //popup Table Data
    $scope.ZoneTable = function(Sku , Qty){
    	var  popupData = $scope.count.CountItemPopup[Sku];
    	$scope.count.popupData = popupData;
    	$scope.count.popupTotal = Qty;
    	$scope.count.Sku = Sku;
    	modal.style.display = "block";
    }
    
    //popup close 
    window.onclick = function(event) {
	    if (event.target === modal) {
	        modal.style.display = "none";
	    }
	}


    var countTypevalues = [];
    var rcountTypes = ZONECOUNT;
    try{
	    var countTypes	= $scope.ovcLabel.count.list.countType || $scope.translation.zonecount[0] ;
	    
	    if(countTypes){
	    	angular.forEach(rcountTypes, function(item) {
		        item.label = countTypes[item.code];
		        countTypevalues.push(item);
		    });
	    }else{
	    	var output 	=	{"status":"error", "message":"label Resources Not Found For Count Type"};
	    	Data.toast(output);
	    }
	}catch(error){
		var output 	=	{"status":"error", "message":"label Resources Not Found For Count Type"};
	    Data.toast(output);
	}
	
  	$scope.countType = countTypevalues;
   //Recursive Function For hierarchy view
	$scope.recur = function (item, level, arr) {
        arr.push({
            displayName: item.name,
            id: item.id,
            level: level,
            indent: $scope.times(level, '\u00A0\u00A0'),
            type: (item.type === 'Store')?false:true
        });

        if (item.children) {
            item.children.forEach(function (item) {
                $scope.recur(item, level + 1, arr);
            });
        }
    };

    //For Hierarchy locations in Count Add Page
    Utils.hierarchylocation().then(function(results){
   		if (results) {
	        $scope.storeLocData = TreeViewService.getLocData(results);
	        $scope.flatLocations = [];
	        $scope.storeLocData.forEach(function(item) {
	            $scope.recur(item, 0, $scope.flatLocations);
	        });
	    }
    });
	$('.hidcal').datepicker({
	    autoclose: true,
	});
	function getSKUs(skusArray){
		var deferred 			= 	$q.defer();
		if(skusArray.length > 0){
			ovcDash.post('apis/ang_skus_getproductprice',{data:{sku:skusArray.join(','),
				loc:$scope.ncount.locationId}}).then(function(skuVal){
				if( skuVal && !skuVal.error){
					var tempSkuObj = {};
					angular.forEach(skuVal, function (value,key){
						if(value.ProductPrice.barcode){
							tempSkuObj[value.ProductPrice.barcode]  = value.ProductPrice.sku
						}else{
							tempSkuObj[value.ProductPrice.sku]  = value.ProductPrice.sku
						}
					})
					deferred.resolve(tempSkuObj);
				}
			});
		}
		return deferred.promise;
	}

	$scope.vlicount			=	true;
	$scope.molcount			=	true; 
	$scope.myFile 			=	{};
	$scope.action1 	=	{};

	$scope.uploadZones         =    function($fileContent,$file){
        var zoneFile         =    $scope.zoneFile;
        var zoneRead         =    $scope.processData($fileContent);
        var zoneData         =    {};
        var uploadSkus         =    [];

        var updateQty = function (zoneItemData, zoneSku, qty) {
            for (var i = zoneItemData.length - 1; i >= 0; i--) {
                if(zoneItemData[i].SKU === zoneSku) {
                    zoneItemData[i].qty = parseFloat(zoneItemData[i].qty) + parseFloat(qty);
                    break;
                }
            }
            return zoneItemData;
        };
        if(zoneRead){
            if(zoneRead.skus.length === 0 ){
                var output     =    {"status":"error","message":$scope.ovcLabel.count.error.uploadfile_emptymsg};
                Data.toast(output);
            }else{
                var getSkusData     =    getSKUs(zoneRead.skus);
                getSkusData.then(function(skuObj){
                    var rejectedBarcodes     =    [];
                    if(zoneRead.lines.length > 0){
                        angular.forEach(zoneRead.lines, function (zoneContent) {
                            if(skuObj[zoneContent[0]]){
                                var temSku     =    skuObj[zoneContent[0]];
                                uploadSkus.push(temSku);
                                if(!zoneData[zoneContent[2]]){
                                    zoneData[zoneContent[2]]     =    [];
                                }

                                if(zoneData[zoneContent[2]] && !zoneData[zoneContent[2]].skuList) {
                                    zoneData[zoneContent[2]].skuList    =    [];
                                }

                                if (zoneData[zoneContent[2]].skuList.indexOf(temSku) != -1 ) {
                                    var newQtyData = updateQty(zoneData[zoneContent[2]], temSku, zoneContent[1]);
                                    zoneData[zoneContent[2]] = newQtyData;
                                    zoneData[zoneContent[2]].skuList.push(temSku);
                                }
                                else {
                                    var skuData     =    {};
                                    skuData['SKU']    =     temSku;
                                    skuData['qty']     =    zoneContent[1];
                                    zoneData[zoneContent[2]].push(skuData);
                                    zoneData[zoneContent[2]].skuList.push(temSku);
                                }
                            }else{
                                rejectedBarcodes.push(zoneContent[0])
                            }
                        });
                        Data.post('/uploadCountZone/'+$scope.count_id,{data:{zoneData:JSON.stringify(zoneData), zoneUpload :$file.name,SKUS:uploadSkus.toString()}}).then(function (zoneResults) {
                            if (zoneResults.status === 'success'){
                                var output     =    {"status":"success","message":$scope.ovcLabel.count.toast.zone_update_success};
                                    Data.toast(output);
                                    if($scope.curentZone && !$scope.curentZone._id){
                                    	$scope.getcount_intapi();
                                    }
                                    else {
                                    	$scope.getcount_intapi(null, $scope.curentZone);
                                    }
                                    
                                   
                                    if(rejectedBarcodes.length > 0){
                                        var barcodeToast =    {"status":"error","message":rejectedBarcodes.join(',')+'</br>'+'Are not Available'};
                                        Data.toast(barcodeToast);
                                    }
                            }else{
                                var output     =    {"status":"error","message":zoneResults.error};
                                    Data.toast(output);
                            };
                        },function(error){
                            console.log('uploadCountZone ',error);
                        });
                    }else{
                        var output     =    {"status":"error","message":$scope.ovcLabel.count.error.dat_notvalid};
                        Data.toast(output);
                    }
                });
            }
        }else{
            var output     =    {"status":"error","message":$scope.ovcLabel.count.error.uploadfile_erromsg};
            Data.toast(output);
        }
        
    }

    $scope.reverse =''; $scope.predicate = '';
    $scope.sort_by = function(predicate) {
        $scope.predicate 	= 	predicate;
        $scope.reverse 		= 	!$scope.reverse;
    };
	
	$scope.processData 		=	function(allText){
		var allTextLines 	= 	allText.split(/\r\n|\n/);
        var headers 		= 	allTextLines[0].split('|');
        var temp 			=	{};
        temp.skus 			=	[];
        temp.lines 			= 	[];
        if(headers.length === 3){
        	for ( var i = 0; i < allTextLines.length; i++) {
	            // split content based on comma
	            var data = allTextLines[i].split('|');
	            if (data.length === headers.length) {
	                var tarr = [];
	                for ( var j = 0; j < headers.length; j++) {
	                    tarr.push(data[j]);
	                    if(temp.skus.indexOf(data[0]) === -1){
	                    	temp.skus.push(data[0]);
	                    }	                
	                }
	                temp.lines.push(tarr);
	            }
	        }
        }
        
        if(temp.skus && temp.skus.length > 1000 )
        	return false;
        else
        	return temp;
	};

	if((stateParamId !== 0) && (stateParamId !== undefined) ){	
		/*****Enable and Disable based on Permission******/
		$scope.endisable=function(){
			$rootScope.$watch('ROLES',function(){
				var role_det=$rootScope.ROLES;
				angular.forEach(role_det, function(roles,key) {
					if (key === 'zCounts'){

						var viewZcounts		=	roles.viewZcounts?roles.viewZcounts:0;
						var modifyZcounts	=	roles.modifyZcounts?roles.modifyZcounts:0;

						if(viewZcounts		===	1){
							$scope.vlicount	=	false;
							$('#copsearch :input').attr('disabled', true);
							$('#ctpsearch :input').attr('disabled', true); 
						}

						if(modifyZcounts	===	1){
							$scope.vlicount	=	false;
							$scope.molcount	=	false;
							$('#copsearch :input').removeAttr('disabled');
							$('#ctpsearch :input').removeAttr('disabled');
						}

					}
				});
			
			});
		}
		
		$scope.endisable();
	}
	
	$scope.getDatetime = $scope.newDate = new Date();
	$scope.currentdate = $filter('date')($scope.getDatetime, "yyyy-MM-dd");
	
	$scope.fieldsrequired=false;
	
	var fname = $rootScope.globals.currentUser.firstname;
	var lname = $rootScope.globals.currentUser.lastname;
	var username=fname+' '+lname; 
	
	$scope.ncount = {createdby:username};
		
	$scope.allzones=[];

	//Custom validation For Count add/ Edit Page 
	var countValidation      =   function(ncount){
		$scope.customtab 			=	{};
        $scope.customtab.error 	=	{};
        $scope.customtab.errormsg =	{};
        var ErrorArray  =   [];
            if(!ncount.locationId){
                ErrorArray.push( {'id' : 'storelocation', 'message' : $scope.ovcLabel.count.error.slct_store });
            }
            if(!ncount.countname){
                ErrorArray.push( {'id': 'countname', 'message' : $scope.ovcLabel.count.error.slct_countName });
            }
            if(!ncount.countType){
                ErrorArray.push( {'id': 'countType', 'message' : $scope.ovcLabel.count.error.count_type || "Please Select Count Type" });
            }
          
            if(ErrorArray.length > 0){
                angular.forEach(ErrorArray,function(error){
                    $scope.customtab.error[error.id]=true;
                    $scope.customtab.errormsg[error.id]=error.message;
                });
                
                return false;
            }
        return true;
    }

    //Error Change Common Function
    $scope.commonErrorChange 		=	function(error,checkcountname){
    	switch(error) {
		    case "store":
		        $scope.customtab.error['storelocation'] 		=	false;
		        break;
		    case "countType":
		        $scope.customtab.error['countType'] 		=	false;
		        break;
		    case "countname":
		    	if(countArr.indexOf(checkcountname) == -1){
		    		$scope.checkcountname 	=	false;
		    	}else{
		    		$scope.checkcountname 	=	true;
		    		$scope.checkcounterror 	=   $scope.ovcLabel.count.error.exist_countName;
		    	}
		    	$scope.customtab.error['countname'] 		=	false;
		        break;
		}

    }
	$scope.add_zone = function(ncount){
				var dataObjs = {};
				Data.post('/addNewZone/'+stateParamId, {
					data:dataObjs
				}).then(function (results) {
					if (results.status === 'success'){
					var output 	=	{"status":"success","message":$scope.ovcLabel.count.toast.zone_update_success};
	    				Data.toast(output);
	    				$state.reload();
	    				$timeout(function() {
			                angular.element('#z_detail').trigger('click');
			            }, 1);
			        }else{
						var output 	=	{"status":"error","message":$scope.ovcLabel.count.toast.not_addZone};
	    				Data.toast(output);
					};
				});
	};
	$scope.newcount_add = function(ncount){
		if(countValidation(ncount) && (!$scope.checkcountname)){
			$scope.submitted=true;
			if(stateParamId !== 0){		
				$scope.cstatus = ncount.countStatus;			
				$scope.ctype = ncount.countType;			
			}else{			
				$scope.cstatus = 'open';			
				$scope.ctype = ncount.countType;	
			}
			var selbox= ncount.locationId;	
				var	fromDate=toDate='';	
				if((selbox!==undefined)||(value!==undefined)){
					$scope.selectreq=false;
				}else{
					$scope.selectreq=true;
				}				
				if (fromDate <= toDate){
					$scope.fieldsrequired=false;
				}else{				
					$scope.fieldsrequired=true;
					return false;
				} 	
			var newcnt=ncount;		
			var dataObj = {
				createdBy :  $rootScope.globals.currentUser.username,
				locationId :  newcnt.locationId,
				warehouseId :  newcnt.locationId,
				comment :  newcnt.comment,
				numberOfZones : newcnt.numberOfZones,
				name: newcnt.countname,
				description: newcnt.description,
				countType:$scope.ctype,
				countStatus:$scope.cstatus
			}	
		
			if(stateParamId !== 0){
				
				var dataObj = {
					createdBy :  $rootScope.globals.currentUser.username,
					comment :  newcnt.comment,
					numberOfZones : newcnt.numberOfZones,
					name: newcnt.countname,
					description: newcnt.description,
					countType:$scope.ctype,
					countStatus:$scope.cstatus
				}	
				Data.post('/count/'+stateParamId, { data:dataObj }).then(function (results) {
				
					if(results.ok === 1){
						sessionStorage.zonesCounts  = JSON.stringify(dataObj);
						
						$timeout(function() {
							angular.element('#z_detail').trigger('click');
						}, 1);
						
					$state.reload();
					}else{			
						var output={"status":"error","message":$scope.ovcLabel.count.toast.count_update_failed};
						Data.toast(output);
							return false;
					}					
				});
			}else{
				Data.put('/count', {
					data:dataObj
				}).then(function (results) {
					if(results.__v === 0){
							
						sessionStorage.zonesCounts  = JSON.stringify(results);
						var output={"status":"success","message":$scope.ovcLabel.count.toast.count_create_success};
						Data.toast(output);
						
						$state.go('ovc.Counts-list');				
					}else{			
						return false;
					}					
				});
			}	
		}
	}
	
	$scope.list=[];
	$scope.action1.currentPage      =   1;
	$scope.action1.zoneEntryLimit		=	sessionStorage.zoneentrylimit ? sessionStorage.zoneentrylimit : $rootScope.PAGE_SIZE;
	$scope.activeEntryLimit  = $scope.action1.zoneEntryLimit;
	$scope.isOPen = 0;
	$scope.beCreate = 0;
	$scope.isRecount = 0;
	
	if(stateParamId !== 0){

		$scope.getcount_intapi = function(confirm, curentZone){
			$scope.ncount 	=	{};
			$scope.ncount.noSkuData = false;
			$scope.ncount.countCreated =	true;
			sessionStorage.zoneentrylimit 	=	$scope.action1.zoneEntryLimit;
			$scope.activeEntryLimit  = $scope.action1.zoneEntryLimit;
			$scope.checksel = $scope.ovcLabel.count.labels.select_all;
			Data.get('/count?id='+stateParamId).then(function (results) {
				if(results.__v === 0){
					ovcDash.get('apis/ang_username?user_id=' + results.createdBy).then(function(userData) {
							if(userData){
								results.createdby = userData.firstName + ' ' + userData.lastName;
							}else{
								results.createdby = " ";
							}
							var langObj = $scope.ovcLabel.count.buttontypes;
							var countStatusLabel = $scope.ovcLabel.count.countStatus;
							$scope.created = results.created;
							$scope.countCreated = results.countCreated;
							$scope.approvedDate = results.approvedDate;
							
							try{
								results.cstatus = countStatusLabel[results.countStatus];
							}
							catch(error){
								console.error(error);
							}
							
							if(results.countStatus === COUNT_STATUS_OBJ.RECOUNT){
								$scope.isRecount = 1;
							}else{
								$scope.isRecount = 0;
							}
							if(results.countStatus === COUNT_STATUS_OBJ.BEING_CREATED)
								{
									$scope.isOPen=0;
									$scope.beCreate=1;
								}
							if(results.countStatus === COUNT_STATUS_OBJ.OPEN)
								{
									$scope.isOPen = 1;
									$scope.beCreate = 0;
								}

							if (results.countStatus === COUNT_STATUS_OBJ.CREATING_SNAPSHOT) {
								$scope.creatingSnapshot = true;
							}
							else {
								$scope.creatingSnapshot = false;
							}
			
							Utils.userLocation().then(function(locData){
								var  allLocs = locData; 
								var currency = [];
								var listLocs = [];
								angular.forEach(allLocs,function(item) {
									listLocs[item.id] = item.displayName;
									currency[item.id] = item.currency;
								}); 
								$scope.currency = currency;
								$scope.activePage = ($scope.offset / $scope.action1.zoneEntryLimit) + 1;

							   var locName = listLocs[results.locationId];
								$scope.ncount = {locationId:results.locationId,comment:results.comment,numberOfZones:results.numberOfZones,
								countname:results.name,description:results.description,fromdate:results.fromdate,enddate:results.todate,
								createdby:results.createdby,countType:results.countType,countCreated:results.countCreated,countStatus:results.countStatus,cstatus:results.cstatus,locationname:locName};		
								Data.get('/countzone?countid='+stateParamId+'&page_offset='+$scope.offset+'&page_lmt='+$scope.action1.zoneEntryLimit).then(function (data) {
									var sessionZoneValues 	= 	data.zone_data;
									$scope.allzones1 = [];
										$scope.countNames 	=	(data.zone_names) ? data.zone_names : [];
									if(sessionZoneValues){						
										var rowCounts 		= 	sessionZoneValues.numberOfZones;
										var validatedCount 	=	0;
										var recounted		=	0;
										var increaseVal 	=	0;
										var checkTrue	=	0;
										angular.forEach(sessionZoneValues, function (item) {
											if (curentZone && curentZone.id === item.id ) {
												$scope.curentZone = item;
		                                    	$scope.getZoneDetail(null, $scope.curentZone);
											}
											if(item.skuQty > 0){
												$scope.ncount.noSkuData = true;
											}
											var cstatus  		= 	item.countStatus ? item.countStatus : 'open';
											item.checkId 		=	item.id ? item.id : '';
											item.operatorId 	= 	item.operatorId ? item.operatorId : '';
											item.handCountQty	= 	item.handCountQty ? parseInt(item.handCountQty) : 0;
											item.scanQty 		= 	item.scanQty ? item.scanQty : 0;
											item.skuQty 		= 	item.skuQty ? item.skuQty : 0;
											item.countStatus  	= 	cstatus;
											item.comment  		= 	item.comment ? item.comment : '';
											try {
												item.czstatus = langObj[cstatus];
											}
											catch (e){
												console.error(e);
											}
											if(item.skuQty){
												$scope.selectallChkBox =	true;
											}
											if(item.countStatus === COUNT_STATUS_OBJ.VALIDATE){
												$scope.startRecount  = true;
												validatedCount++;
											}

											if(item.countStatus === COUNT_STATUS_OBJ.APPROVE){
												validatedCount++;
												recounted++;
											}
											
											if(item.countStatus === COUNT_STATUS_OBJ.RECOUNT){
												$scope.isOPen = 0;
												$scope.isRecount = 1;
												recounted++;
											}
											if(item.countStatus === COUNT_STATUS_OBJ.BEING_CREATED){
												$scope.isOPen = 0;
											}
											if((item.countStatus === COUNT_STATUS_OBJ.OPEN) && ($scope.isRecount !== 1)){
												$scope.isOPen = 1;
												var proSkuQty = item.skuQty>0;
												if(proSkuQty)
													increaseVal++;
											}
											
											$scope.allzones1.push(item);
										});
										$scope.checkVal = increaseVal;
										$scope.totCount = data.total_count;
										if($scope.totCount===0 || $scope.checkVal===0){
											$scope.bannerMsgEmp = true;
										}
										else if($scope.checkVal!==$scope.totCount){
											$scope.bannerMsgNotAll = true;
											$scope.bannerMsgEmp = false;
											$scope.bannerMsgAll = false;
										}
										else if($scope.totCount === $scope.checkVal){
											$scope.bannerMsgAll = true;
											$scope.bannerMsgNotAll = false;
											$scope.bannerMsgEmp = false;
										}
										$scope.validateTotal 	=	validatedCount;
										$scope.recountTotal		=	recounted;
										
										$scope.allzones2=$scope.allzones1;
										var porderlist=$scope.allzones1;
										$scope.selall='false';
										$scope.selectAll = function () {		
											var checksel= document.getElementById("checkall").checked;
											if((checksel === true)){
												$scope.selectedItems = [];
												$scope.selection=[];
												
												var srows= porderlist;
												angular.forEach(srows, function (item) {
													if(item.skuQty){
														item.selected=true;
														item.changed=true;
														$scope.selection.push({zoneid:item.id,zid:item._id,countStatus:item.countStatus});
													}
												}); 
												$scope.selall='true';
												$scope.checksel=$scope.ovcLabel.count.labels.unselect_all;
												
											}if ((checksel === false)) {
												$scope.selall='false';
												$scope.checksel=$scope.ovcLabel.count.labels.select_all;
												$scope.selectedItems = [];
												var srows= porderlist;
												angular.forEach(srows, function (item) {	
													if(item.skuQty){								
														item.selected = false;
														item.changed=false;
														for (var i = $scope.selection.length - 1; i >= 0; i--) {
															if ($scope.selection[i].zoneid) {
																$scope.selection.splice(i, 1);
															}
														}
													}
												}); 
											}
										};	
										$scope.list = $scope.allzones2;
										$scope.action1.filteredItems        =   data.total_count; 
										$scope.itemsPerPage         =   $scope.list.length;
									}else{
										
									}
								}); 
							});
							countDataExp 	=	results;
						});
					
				}else{			
					return false;
				}					
			});	
		};	
		
		$scope.getcount_intapi();
		
		$scope.toggleSelection = function toggleSelection(chkbxs) {
			var sellen = $scope.list.length;
			var countcheck  = 0 ;
			angular.forEach($scope.list,function(datas){
				if(datas.selected){
					countcheck++;
				}
			});
			if(sellen === countcheck){
				$scope.selectedcheck = true;
				$scope.checksel = $scope.ovcLabel.count.labels.unselect_all;
			}else{
				$scope.selectedcheck  = false;
				$scope.checksel = $scope.ovcLabel.count.labels.select_all;
			}
			if(chkbxs.selected){
				$scope.selection.push({zoneid:chkbxs.id,zid:chkbxs._id,countStatus:chkbxs.countStatus});
			}else{
				chkbxs && chkbxs.skuResultError ? chkbxs.skuResultError 	=	false : '';
				for (var i = $scope.selection.length-1; i >= 0; i--) {
					if ($scope.selection[i].zoneid === chkbxs.id) {
						$scope.selection.splice(i, 1);
					}
				}
			}
		};

	    $scope.pageChanged  =   function(count,list,action,page){
	    	$scope.nextpage 	=	page;
	        $scope.offset = ($scope.action1.currentPage - 1) * $scope.action1.zoneEntryLimit;
	         	$.confirm({
                    title: 'Save Zones',
                    content: 'If you go next Page Please Save Zones',
                    confirmButtonClass: 'btn-primary',
                    cancelButtonClass: 'btn-primary',
                    confirmButton: 'Ok',
                    cancelButton: 'Cancel',
                    confirm: function () {
                    	$scope.addzones(count,list,action);
                    },
                    cancel: function () {
                    	$scope.action1.currentPage = $scope.activePage;
                    	$scope.action1.zoneEntryLimit = $scope.activeEntryLimit;
                        return false;
                	}
                });
	    };
		
		$scope.transaction_cancel=function(){
			$state.go('ovc.Counts-list');
		}
		$scope.transaction_itemcancel=function(){
			$scope.enableZoneDetailView=true;
			//Reset the Print Header 
			$scope.curentZone = {};
			ovcdataExportFactory.resetPdfHeaderData();
		}

		var validateCheck 	= 0;
		var zoneStatusCheck = 0;
		var recountNo 		= 0;
		$scope.ZonechangeStatus 	= 	function(status){
			var selectionitems 		= 	$scope.selection;
			var total_zones 		= 	$scope.allzones1.length;
			var selection_length 	= 	selectionitems.length;
			var zstatus  			= 	'recount';
			var selectZone			=	[];
			var retVal = true;
			var validateCount 	=	0;
			 validateCheck 		=	0;
			 zoneStatusCheck 	= 	0;
			if((selectionitems != undefined) && (selectionitems !== '')){
				angular.forEach(selectionitems, function(items,index) {
					angular.forEach($scope.allzones1, function(itemSku){
						if(itemSku._id === items.zid){
							var skuResult   =  itemSku.skuQty;
							if(skuResult === 0 || skuResult === ''){
								itemSku.skuResultError   =   true;
								validateCount++;
								retVal = false;
							}
							selectZone.push(items);
						}
					});
				});
					if(!retVal){
						return false;
					}
					if(validateCount){
						return false;
					}
					if(status === 'validate'){
						$scope.showPopupVal(status,selection_length,total_zones,selectZone);
					}
					else if(status !== 'validate'){

						document.getElementById("checkall").checked = false;
						$scope.selectedRecountZones = selectZone;
						$scope.tempStatus = status;
						recountNo = 0
						recountWithCallBack(recountNo);
					}
					
				
			}else{
				$scope.selchk = true;
				$timeout(function() {
					$scope.selchk = false;
				}, 3000);
			}
		};

//Recount common method
 		function recountWithCallBack(zoneNo){
 			if($scope.selectedRecountZones[zoneNo]){
 				if($scope.selectedRecountZones[zoneNo].countStatus === 'validate'){
 					$scope.zonestatus_func($scope.tempStatus, $scope.selectedRecountZones[zoneNo].zid, '', function(data){
 						if(data){
 							recountNo++;
 							recountWithCallBack(recountNo);
 						}
 					});
 					var output={"status":"success","message":$scope.ovcLabel.count.toast.request_recount_success};
 										Data.toast(output);
 				}else{
 					var output={"status":"error","message":$scope.ovcLabel.count.toast.request_recount_error};
 								Data.toast(output);
 				}
 			}
 		}
                
                function zonePopup(title, content, contentCheck, callback) {
                var selectedZone = $scope.selection[0].zoneid;
                var showLength = $scope.selection.length - 1;
                var contentDisplay = content + ' Zone ' + '<b>' + selectedZone + '</b>';
                if (contentCheck === true) {
                    contentDisplay = content;
                } else {
                    if (showLength === 1) {
                        contentDisplay += ($scope.ovcLabel.count.labels.and || ' and ') + showLength + ($scope.ovcLabel.count.labels.otherZone || ' other zone');
                    } else if (showLength > 1) {
                        contentDisplay += ($scope.ovcLabel.count.labels.and || ' and ') + showLength + ($scope.ovcLabel.count.labels.otherZones || ' other zones');
                    }
                }
                $.confirm({
                    title: title,
                    content: contentDisplay,
                    confirmButtonClass: 'btn-primary popupBtn',
                    cancelButtonClass: 'btn-primary popupBtn',
                    cancelButton: $scope.ovcLabel.count.buttontypes.cancel || 'Cancel',
                    confirmButton: $scope.ovcLabel.count.buttontypes.confirm || 'Confirm',
                    confirm: function () {
                        callback();
                    },
                    cancel: function () {
                        return false;
                    }
                });
        }
		$scope.showPopupVal 	= 	function(status,selectionLength,totalZones,selectZone){
		if(status === 'validate'){
                    var contentCheck = false;
                    var selectedZone = $scope.selection[0].zoneid;
                    var showLength = $scope.selection.length - 1;
                if ($scope.ncount.countType === 'Z-Count') {
                    document.getElementById("checkall").checked = false;
                    validateCheck++;
                    var title = $scope.ovcLabel.count.validateZone || 'Validate Zone';
                    var content = $scope.ovcLabel.count.validateMessage || 'You are about to Validate';
                    zonePopup(title, content,contentCheck, function (data) {
                        $scope.zonestatus_func(status, selectZone);
                        if (($scope.validateTotal + selectionLength) >= totalZones) {
                            zstatus = 'validate';
                        }
                        $scope.allzones1 = [];
                        $scope.selection = [];
                        $scope.list = [];
                        $scope.ncount = [];
                    });
                }
                if ($scope.ncount.countType === 'Physical' || $scope.ncount.countType === 'Cycle') {
                    Data.get('/countitem?countId=' + stateParamId + '&noScan=true').then(function (results) {
                        var total_count = results ? Object.keys(results).length : 0;
                        if (total_count > 0) {
                            var title = $scope.ovcLabel.count.validateZone || 'Validate Zone';
                            var content = $scope.ovcLabel.count.bannerMsg.confirm || 'Several SKUs have not been scanned. Validating the Zone will update scanned quantity with 0. Please confirm.';
                            contentCheck = true;
                            zonePopup(title, content, contentCheck, function (data) {
                                Data.put('/countitem?countId=' + stateParamId + '&updateDefaultQty=true').then(function (data) {
                                    if (results !== undefined) {
                                        document.getElementById("checkall").checked = false;
                                        $scope.zonestatus_func(status, selectZone);
                                        var output = {"status": "success", "message": $scope.ovcLabel.count.toast.validate_success};
                                        if (($scope.validateTotal + selectionLength) >= totalZones) {
                                            zstatus = 'validate';
                                        }
                                    }
                                    $scope.allzones1 = [];
                                    $scope.selection = [];
                                    $scope.list = [];
                                    $scope.ncount = [];

                                })
                            })
                            return false;
                        } else if (total_count === 0) {
                            var title = $scope.ovcLabel.count.validateZone || 'Validate Zone';
                            var content =  $scope.ovcLabel.count.validateMessage || 'You are about to Validate'; 
                            zonePopup(title, content, contentCheck, function (data) {
                                 Data.put('/countitem?countId=' + stateParamId + '&updateDefaultQty=true').then(function (data) {
                                     if (results !== undefined) {
                                         document.getElementById("checkall").checked = false;
                                         $scope.zonestatus_func(status, selectZone);
                                         var output = {"status": "success", "message": $scope.ovcLabel.count.toast.validate_success};
                                         Data.toast(output);
                                         if (($scope.validateTotal + selectionLength) >= totalZones) {
                                             zstatus = 'validate';
                                         }
                                     }
                                     $scope.allzones1 = [];
                                     $scope.selection = [];
                                     $scope.list = [];
                                     $scope.ncount = [];

                                 })
                             })
                            return false;
                        }
                        else
                        {
                            var output = {"status": "error", "message": "Cannot validate now ,Try again"};
                            Data.toast(output);
                        }
                    });
                }
            }
        };

		/* recount or validate  */
		$scope.zonestatus_api = function(status,zoneid){
			var totalitemsval 	=	$scope.dataVal;
			$scope.ncount.validated = true;
			if($scope.prodlist &&  $scope.prodlist.length > 0){
				$scope.selectedskus 		=	false;
			}else{
				$scope.selectedskus 		=	true;
					$timeout(function(){
            		$scope.selectedskus 	=	false;
        		}, 3000);
            	return false;	
			}
			var total_zones = $scope.allzones1.length;
			var zstatus 	= 'recount';
			if(status === 'validate'){
				if($scope.ncount.countType === 'Z-Count'){
					var ncount = $scope.ncount.countCreated;
					if(!ncount){
						var output={"status":"success","message":"Please trigger begin count"};
						Data.toast(output);
						return false;
					}
					$scope.zonestatus_func(status,zoneid,'individualZone');
				}
				if($scope.ncount.countType === 'Physical' || $scope.ncount.countType === 'Cycle'){
					Data.get('/countitem?countId='+stateParamId+'&noScan=true').then(function(results){
						var total_count=results?Object.keys(results).length:0;
						if(total_count>0) {
							$.confirm({
								title: $scope.ovcLabel.count.validateZone || 'Validate Zone',
								content: $scope.ovcLabel.count.bannerMsg.confirm || 'Several SKUs have not been scanned. Validating the Zone will update scanned quantity with 0. Please confirm.',
								confirmButtonClass: 'btn-primary popupBtn',
								cancelButtonClass: 'btn-primary popupBtn',
								confirmButton: 'Ok',
								cancelButton: 'Cancel',
								confirm: function () {
									Data.put('/countitem?countId='+stateParamId+'updateDefaultQty=true').then(function(data){
										if(results !== undefined){
											$scope.zonestatus_func(status,zoneid,'individualZone');
											if(($scope.validateTotal+1) >= total_zones){
												zstatus = 'validate';
											}
										}
									})
								},
								cancel: function () {
									return false;
								}
							});
							return false;
						}else if(total_count === 0){
							$.confirm({
								title: $scope.ovcLabel.count.validateZone || 'Validate Zone',
								content: $scope.ovcLabel.count.validateMessage ||'You are about to validate',
								confirmButtonClass: 'btn-primary popupBtn',
								cancelButtonClass: 'btn-primary popupBtn',
								confirmButton: 'Ok',
								cancelButton: 'Cancel',
								confirm: function () {
									Data.put('/countitem?countId='+stateParamId+'&updateDefaultQty=true').then(function(data){
										if(results !== undefined){
											$scope.zonestatus_func(status,zoneid,'individualZone');
											if(($scope.validateTotal+1) >= total_zones){
												zstatus = 'validate';
											}
										}
									})
								},
								cancel: function () {
									return false;
								}
							});
							return false;
						}
						else
						{
							var output={"status":"error","message":"Cannot validate now ,Try again"};	
							Data.toast(output);
						}
					});
				}
			}else{
				$scope.zonestatus_func(status,zoneid);
				angular.element(document.querySelector('#ReElement')).hide();
				var output={"status":"success","message":$scope.ovcLabel.count.toast.request_recount_success};
				Data.toast(output);
				$scope.allzones1=[];
				$scope.selection=[];
				$scope.list=[];
				$scope.ncount = [];
				$scope.getcount_intapi();
			}
		};

		$scope.zonestatus_func = function(status,zone , individual, callback){
			var zones=[];
			_.isArray(zone) ? zones = zone : zones.push({zid:zone})
			zones.forEach(function(zoneid){
				if(status === 'validate'){
					var datazoneObjs = {
						countId : stateParamId,
						countStatus : status
					}
					Data.post('/countzone/'+zoneid.zid, {
						data:datazoneObjs
					}).then(function (results) {

						if(individual && results.ok){
							var output={"status":"success","message":$scope.ovcLabel.count.toast.validate_success};
							Data.toast(output);
							$scope.allzones1=[];
							$scope.selection=[];
							$scope.list=[];
							$scope.ncount = [];
							$scope.getcount_intapi();
							$scope.transaction_itemcancel();
						}else{
							zoneStatusCheck++;
							if(zone && zone.length === zoneStatusCheck){
								var output={"status":"success","message":$scope.ovcLabel.count.toast.validate_success};
								Data.toast(output);
								$scope.getcount_intapi();
							}

						}
					});
				}else{ 
					angular.forEach($scope.allzones2,function(item){
						if((zoneid.zid)===item._id){ 
							$scope.recountValue=item.recountNumber;
						}
					})
						$scope.recountNumber = $scope.recountValue;console.log($scope.recountNumber);
						if($scope.recountNumber>=5){
							var output={"status":"error","message":"You exceeded the number of allowed recounts (5)"};
							Data.toast(output);
						}
						else{ 
							var recount = $scope.recountNumber+1;
							var countType = $scope.ncount.countType;
							Data.get('/recount?countId='+stateParamId+'&zoneId='+zoneid.zid+'&countType='+countType+'&recountNumber='+recount).then(function (results) {
								if(results.error){
									var output={"status":"error","message":results.error};
									Data.toast(output);
								}
								if(callback){
 									callback('success');
 								}
								if($scope.curentZone && $scope.curentZone._id){ 
									$scope.curentZone.recountNumber++;
									$scope.curentZone.countStatus="recount";
									$scope.ncount.countType = countType;
									$scope.getZoneDetail(null,$scope.curentZone);
								}
								else{  
									$scope.getcount_intapi();
								}
							});
						}
				}
			});		
		};
		$scope.getInventTransactionData 	=	function(){
			var deferred 			= 	$q.defer();

			if($scope.approvelist && $scope.approvelist.length > 0){
				var skus 				=	$scope.approveskulist.join();
				var loc_id 				= 	$scope.ncount.locationId;
				var approvelist 	=	$scope.approvelist;
				var invFinalArray 	=	[];
				ovcDash.post('apis/ang_getproductprice',{data:{sku:skus,loc:loc_id}}).then(function (ovcdata) {
					if(ovcdata){
						angular.forEach(approvelist,function(aprovesku,skukey){
							angular.forEach(ovcdata,function(priceval,pricekey){
							
								var OHsku 	=	priceval['ProductPrice'].SKU
								if(aprovesku.sku === OHsku){
									aprovesku.cost 	=	(priceval.status == 'error') ? 0 : priceval.ProductPrice.Cost;
			
								}
							});
						});
						deferred.resolve(approvelist);
					}else {
						var output={"status":"error","message":$scope.ovcLabel.count.toast.approve_cost_failed};
						Data.toast(output);
					}
				});

			}else{
				deferred.reject('false');
			}
			
			return deferred.promise;
		};

		function count_approve_zone(data){
			Data.post('/review/'+stateParamId, {
				data:data
				}).then(function (results) {
				var error = false;
					if(results.status === "success"){
						var output = {"status":"success","message":$scope.ovcLabel.count.toast.approve_success};
						Data.toast(output);
		                countDataExp 	=	{}; $scope.allzones1 = [];$scope.list=[];
						$state.go('ovc.Counts-list');
					}else {
						var output={"status":"error","message":$scope.ovcLabel.count.toast.approve_failed};
						Data.toast(output);
					}
			});
		}

		$scope.transaction_approve=function(status){
			var reviewObj = [];
			var countData = {
				locId : $scope.ncount.locationId ,
				countType : $scope.ncount.countType ,
				countName : $scope.ncount.countname,
				queueConfig : $scope.roleConfig.publishApprovedCounts
			}

			//Construct Count export data
			var countExportData	=	[];
			var countExportObj	=	{};
			var countObj 		= 	{};
			//Count Obj 
			countObj.countId 		=	countDataExp._id;
			countObj.created 		=	countDataExp.created;
			countObj.storeId 		=	countDataExp.locationId;
			countObj.comment 		=	countDataExp.comment;
			countObj.numberOfZones 	=	countDataExp.numberOfZones;
			countObj.name 			=	countDataExp.name;
			countObj.description 	=	countDataExp.description;
			countObj.startDate 		=	countDataExp.startDate;
			countObj.endDate 		=	countDataExp.endDate;
			countObj.status 		=	'approve';
			countObj.countItems		=	[];

			countExportObj['counts']	=	countObj;
			countExportData.push(countExportObj);
			//JMS publishing service
			var countExportData   =   JSON.stringify(countExportData);
			if(countData){
				if($scope.ncount.countType === 'Physical'){ 
					$.confirm({
						title: $scope.ovcLabel.count.approve,
						content: $scope.ovcLabel.count.approvemessage,
						confirmButtonClass: 'btn-primary popupBtn',
						cancelButtonClass: 'btn-primary popupBtn',
						confirmButton: 'Ok',
						cancelButton: 'Cancel',
						confirm: function () {
							var data={"countData" : countData , "countExportData" : countExportData };
							count_approve_zone(data);
						},
						cancel: function () {
										return false;
						}
					});
				}
				else{ 
					var data={"countData" : countData , "countExportData" : countExportData };
					count_approve_zone(data);
				}
			}
		}
		
		/* to show/hide approve button in review and aprrove page */
		$scope.editingAllowed = function(){
			var status = false;
			
			if($scope.ncount.countStatus === 'validate'){
				status = true;
			}
			
			return status;
		}
		
		$scope.removeRow = function (key,zoneid) {	
			if(key !== -1) {
				$.confirm({
					title: $scope.ovcLabel.count.deleteCountZone||'Delete Count Zone',
					content: $scope.ovcLabel.count.deleteCountZoneContent+' '+$scope.list[key].id,
					confirmButtonClass: 'btn-primary popupBtn',
					cancelButtonClass: 'btn-primary popupBtn',
					confirmButton: 'Ok',
					cancelButton: 'Cancel',
					confirm: function () {
						Data.delete('/countzone/'+zoneid).then(function (data) {						
							var output={"status":"success","message":$scope.ovcLabel.count.toast.countzone_delete_success};
							Data.toast(output);
							$scope.list.splice(key, 1);
							$scope.action1.filteredItems--;
							$state.reload();
							$timeout(function() {
			                	angular.element('#z_detail').trigger('click');
			            	}, 1);
						});
						
					},
					cancel: function () {
						return false;
					}
				
				});
				return false;
			}
		};
		
		$scope.enableZoneDetailView=true;
		
		$scope.allvalues = {};	
		function zoneTagPrintDataSet(){
			ovcdataExportFactory.resetPdfHeaderData();
			var countLabel = $scope.ovcLabel && $scope.ovcLabel.count && $scope.ovcLabel.count.labels  ? $scope.ovcLabel.count.labels : {};
			var coloumnData  = [{
				label : countLabel.store_name || "",
			    value : $scope.ncount && $scope.ncount.locationname ? $scope.ncount.locationname : ""
			},{
				label : countLabel.countName || "",
			    value : $scope.ncount && $scope.ncount.countname ? $scope.ncount.countname : ""
			},{
				label : countLabel.zoneName || "",
			    value : $scope.zoneTitle || ""
			},{
				label : countLabel.operator,
			    value : $scope.curentZone && $scope.curentZone.operatorId ? $scope.curentZone.operatorId : ""
			},{
				label : countLabel.hand_count || "",
			    value : $scope.curentZone && $scope.curentZone.handCountQty ? $scope.curentZone.handCountQty : ""
			}];
			var pdfData = {
				barcodeData : $scope.zoneTitle || "",
				content : coloumnData
			}
			ovcdataExportFactory.setPdfHeaderData(pdfData);

		}	
		$scope.getZoneDetail=function(recount,zone){
			//Reset the Print header
			ovcdataExportFactory.resetPdfHeaderData();
			var prod_result   = angular.element('.prod_result')
			prod_result.val('');
            $scope.styleitems = {};
			$scope.listPROD   = [];$scope.prodlist=[]; 
			$scope.curentZone = zone;
			$scope.originalScanQty = zone.scanQty;
			$scope.originalSkuQty  = zone.skuQty;
			if (recount === null) {
				$scope.workSpaces =[];
				$scope.recountNumber   = zone.recountNumber;
				$scope.maxRecount=$scope.recountNumber;
				if($scope.maxRecount > 1){
					for (var i=0; i<$scope.maxRecount; i++){
						var actv = false;
						if(($scope.maxRecount-1) === i){
							actv = true;
						}
						$scope.workSpaces.push({id:i,active:actv});
					}	
				}
			}
			var tot_scan      = 0;  
				Data.get('/countitem?countId='+stateParamId+'&zoneId='+zone._id+'&page_offset='+$scope.count.offset+'&page_lmt='+$scope.count.entryLimit+'&countType='+$scope.ncount.countType+'&countNumber='+$scope.recountNumber).then(function (data) {
					var qts_ar = [];
					$scope.dataVal = data;
					if(!data.error){
						var skuArray 	=	[];
						var loc_id 		= 	$scope.ncount.locationId;
						$scope.count.totalItems 	=	data.total_count ? data.total_count : 0;
						if(data.zone_data){
							angular.forEach(data.zone_data, function(sval,index) {
								skuArray.push(sval.sku);
							});
						}else{
							angular.forEach(data, function(sval,index) {
									skuArray.push(sval.sku);
							});
						}
						var skuObj 	=	{};
						ovcDash.post('apis/ang_loc_skuproducts',{data:{srch:skuArray.toString(),locid:encodeURIComponent(loc_id), isRules: true}}).then(function (skuDatas) {
							if(skuDatas && skuDatas.length > 0){
								angular.forEach(skuDatas, function(mdatas) {
									var sku 	=	mdatas['ProductTbl']['sku'];
									if( ! skuObj[sku]){
										skuObj[sku] 	=	{};
									}
									skuObj[sku]['name'] 		=	mdatas['ProductTbl']['name'];
									skuObj[sku]['productId'] 	=	mdatas['ProductTbl']['productId'];
									skuObj[sku]['description'] 	=	mdatas['ProductTbl']['description'];
								});
							}

							if(data && data.zone_data && data.zone_data.length){
								angular.forEach(data.zone_data, function(sval,index) {
									$scope.maxRecount = sval.maxRecount;
									// for (var i = 0; i <= ((sval.qty.length) - 1); i++) {
										qts_ar[sval.countNumber] = qts_ar[sval.countNumber]?(qts_ar[sval.countNumber]+parseInt(sval.qty)):parseInt(sval.qty);
									// }

									if(skuObj[sval.sku]){
										sval.name 	=	skuObj[sval.sku]['name'];
										sval.prodid = skuObj[sval.sku]['productId'];
										sval.description = skuObj[sval.sku]['description'];
									}
										sval.changedColor = false;
									if(sval.noApproval && $scope.ncount.countType === 'Cycle'){
										sval.changedColor = true;
									}

									$scope.listPROD.push({_id:sval._id, productCode : sval.sku, name : sval.name, productid:sval.prodid,locationid: $scope.ncount.locationId, description:sval.description, qty:sval.qty, comments:sval.comment,countStatus:sval.countStatus,lineNumber:sval.lineNumber,changedColor:sval.changedColor});
								});
							}else{
								$scope.maxRecount = 1;
								qts_ar[1] = 0;
								$scope.scanitems = qts_ar;
							}
							$timeout(function () { $scope.fillTableElements($scope.listPROD); $scope.endisable();}, 300);	
						});	
						
						$scope.scanitems = qts_ar;
					}else{
						$scope.maxRecount = 1;
						var qts_ar = [];
						qts_ar[1]=0;
						$scope.scanitems = qts_ar;
						$scope.count.totalItems  = 0;
						$scope.zskuqty = 0;
						return false;
					}
				});
				
			$scope.zoneTitle=zone.id;
			$scope.enableZoneDetailView=false;
			zoneTagPrintDataSet();
		}
		$scope.tabSelected = function (recountNumber,resetOffSet) {
			$scope.recountNumber	=	recountNumber;
			ovcdataExportFactory.resetPdfHeaderData();
			var prod_result   = angular.element('.prod_result')
			prod_result.val('');
            $scope.styleitems = {};
			$scope.listPROD   = [];$scope.prodlist=[];
			if(resetOffSet===true){$scope.count.offset=0;}
			var tot_scan      = 0;
			Data.get('/countitem?countId='+stateParamId+'&zoneId='+$scope.curentZone._id+'&page_offset='+$scope.count.offset+'&page_lmt='+$scope.count.entryLimit+'&countType='+$scope.ncount.countType+'&countNumber='+$scope.recountNumber).then(function (data) {
				var qts_ar = [];
				$scope.dataVal = data;
				if(!data.error){
					var skuArray 	=	[];
					var loc_id 		= 	$scope.ncount.locationId;
					$scope.count.totalItems 	=	data.total_count ? data.total_count : 0;
					if(data.zone_data){
						angular.forEach(data.zone_data, function(sval,index) {
							skuArray.push(sval.sku);
						});
					}else{
						angular.forEach(data, function(sval,index) {
								skuArray.push(sval.sku);
						});
					}
					
					
					// $scope.listPROD 	=	[];
					var skuObj 	=	{};
					ovcDash.get('apis/ang_barcode_datas?code='+skuArray.toString()+'&locid='+encodeURIComponent(loc_id)).then(function (skuDatas) {
						if(skuDatas && skuDatas.length > 0){
							angular.forEach(skuDatas, function(mdatas) {
								var sku 	=	mdatas['ProductTbl']['sku'];
								if( ! skuObj[sku]){
									skuObj[sku] 	=	{};
								}
								skuObj[sku]['name'] 		=	mdatas['ProductTbl']['name'];
								skuObj[sku]['productId'] 	=	mdatas['ProductTbl']['productId'];
								skuObj[sku]['description'] 	=	mdatas['ProductTbl']['description'];
							});
						}

						if(data && data.zone_data && data.zone_data.length){
							angular.forEach(data.zone_data, function(sval,index) {
								$scope.maxRecount = sval.maxRecount;
								// for (var i = 0; i <= ((sval.qty.length) - 1); i++) {
									qts_ar[sval.countNumber] = qts_ar[sval.countNumber]?(qts_ar[sval.countNumber]+parseInt(sval.qty)):parseInt(sval.qty);
								// }

								if(skuObj[sval.sku]){
									sval.name 	=	skuObj[sval.sku]['name'];
									sval.prodid = skuObj[sval.sku]['productId'];
									sval.description = skuObj[sval.sku]['description'];
								}
									sval.changedColor = false;
								if(sval.noApproval && $scope.ncount.countType === 'Cycle'){
									sval.changedColor = true;
								}

								$scope.listPROD.push({_id:sval._id, productCode : sval.sku, name : sval.name, productid:sval.prodid,locationid: $scope.ncount.locationId, description:sval.description, qty:sval.qty, comments:sval.comment,countStatus:sval.countStatus,lineNumber:sval.lineNumber,changedColor:sval.changedColor});
							});
						}else{
							$scope.maxRecount = 1;
							qts_ar[1] = 0;
							$scope.scanitems = qts_ar;
						}
						$timeout(function () { $scope.fillTableElements($scope.listPROD); $scope.endisable();}, 300);	
					});		
					$scope.maxRecount=$scope.recountNumber;				
					$scope.scanitems = qts_ar;
				}else{
					$scope.maxRecount = 1;
					var qts_ar = [];
					qts_ar[1]=0;
					$scope.scanitems = qts_ar;
					$scope.count.totalItems  = 0;
					$scope.zskuqty = 0;
					return false;
				}
			});
			$scope.enableZoneDetailView=false;
			zoneTagPrintDataSet();
		}
		
		$scope.count_details=function(){
			$scope.enableZoneDetailView=true;
			$scope.curentZone = {};
		}
		
		// 1 Differed method for Review Service (Review Page)
		$scope.skuProducts 	=	function(reviewData){
			var deferred 			= 	$q.defer();
			$scope.reviewData 		=	angular.copy(reviewData);
			if($scope.reviewData){
				var skuArray 		= 	[];
				$scope.resultArray 	=	[];
				$scope.inventoryArray 	=	[];
				var tmpSkuArray 	=	[];
				var loc_id 			= 	$scope.ncount.locationId;
				var ohdata 	=	$scope.snapshotdata?$scope.snapshotdata:$scope.snapshotdata={};
				angular.forEach($scope.reviewData, function(value){
					if(value.sku && skuArray.indexOf(value.sku) === -1){
						skuArray.push(value.sku);
					}

					if(value.countStatus !== 'approve' && $scope.inventoryArray.indexOf(value.sku) === -1){
						$scope.inventoryArray.push(value.sku);
					}

					if(value.countStatus === 'approve'){

						value.OH			=	value.oh;
						var discrep 		= 	value.discrepancy ? parseFloat(value.discrepancy) : 0;
						value.discrepancy 	= 	Math.abs(discrep);
					}
					
					if (value.zoneData) {
						var zone_tmp_arr = [];
						angular.forEach(value.zoneData,function(zone_id){
							zone_tmp_arr.push($scope.zone_obj[zone_id]);
						});
						zone_tmp_arr = zone_tmp_arr.join();
						value['zoneId'] = zone_tmp_arr;
					}
					value.countItemId 	=  	value.id,
					value.productCode 	= 	value.sku,
					value.locationId  	=  	$scope.ncount.locationId;
					value.countStatus  	=  value.countStatus ||	$scope.ncount.countStatus;
					var langObj = $scope.ovcLabel.count.buttontypes;
					try{
						value.cstatus = langObj[value.countStatus];
					}
					catch(error){
						console.error(error);
					}
					value.currency = $scope.currency[loc_id]; 
					tmpSkuArray.push(value);
				});
				var skus 	=	skuArray.join();
				/* For getting a purchase price*/
				ovcDash.post('apis/ang_getproductprice',{data:{sku:skus,loc:loc_id}}).then(function (ovcdata) {
					var currencylabel   =   $scope.ovcLabel.global.currency;
					if(ovcdata){
						angular.forEach(tmpSkuArray,function(skuval,skukey){
							angular.forEach(ovcdata,function(priceval,pricekey){
								var OHsku 	=	priceval['ProductPrice'].SKU
								if(skuval.sku === OHsku){
									skuval.priceCost 		= (priceval.ProductPrice.priceType == 1) ? priceval.ProductPrice.Cost : 0;
								}
							});
						});
					}
				});
				ovcDash.post('apis/ang_loc_products',{data:{srch:skus,locid:loc_id,skuConfig:true}}).then(function (temService) {
					if(temService && temService.status !== 'error'){
						angular.forEach(tmpSkuArray,function(skuitem,skukey){
							angular.forEach(temService,function(item,key){
								var sku 	=	item.ProductTbl.sku;
								if(skuitem.sku === sku){
									skuitem.name 		= item.ProductTbl.name;
									skuitem.prodid 		= item.ProductTbl.productId;
									skuitem.description = item.ProductTbl.description;
								}
							});
							$scope.resultArray.push(skuitem);
							deferred.resolve($scope.resultArray);
						});
					}else{
						angular.forEach(tmpSkuArray,function(skuitem,skukey){
							$scope.resultArray.push(skuitem);
						});
						deferred.resolve($scope.resultArray);
					}
				},function(error){
					console.log("locationproducts Service Failed");
				});
				// deferred.resolve($scope.resultArray);
				return deferred.promise;
			}
		};

		//2nd Differed method for Review Service (Review Page)
		$scope.finalProduct 	=	function(resultArray){
			var deferred 			= 	$q.defer();
				$scope.reviewlist 	=	[];
				var loc_id 			= 	$scope.ncount.locationId;
				if($scope.inventoryArray.length > 0){
					var inventryskus 	=	$scope.inventoryArray.join();
					$scope.approvelist 	=	[];
					$scope.approveskulist 	=	[];
					var ohdata 	=	$scope.snapshotdata?$scope.snapshotdata:$scope.snapshotdata={};
					angular.forEach($scope.resultArray,function(revalue,rekey){
						var approvesku 		=	{};

						var discrep 		= 	0;
						revalue.OH 			=	revalue.oh ? isNaN(parseFloat(revalue.oh)) ? 0 :  parseFloat(revalue.oh): 0 ;

						approvesku['quantity'] 	=	revalue.OH;
                        revalue.qty = parseFloat(revalue.qty||0).toFixed(0);
                                                discrep = ((revalue.discrepancy === '' || revalue.discrepancy === null || revalue.discrepancy === 'undefined') ? -revalue.OH : revalue.discrepancy).toFixed(0) ;
						revalue.discrepancy 	  = 	Math.abs(discrep);
						//For approveSku
						approvesku['discrepancy'] =		Math.abs(discrep);
						approvesku['quantity'] 	  =		approvesku['discrepancy'];
						approvesku['transtypeid'] =		revalue.transtypeid;	
						approvesku['locationid']  = 	loc_id;
						approvesku['cost']	  	  =		0
						approvesku['stockUOM']	  =		'';
						approvesku['stocklocationid']	  =		'';
						approvesku['warehouseid']	  	  =		loc_id;
						approvesku['directivetype']	      =		'';
						approvesku['sku']	              =		revalue.sku;
						approvesku['lineNumber']	      =		revalue.lineNumber;
						approvesku['countType']	          =		$scope.ncount.countType;
						approvesku['countNumber']	      =		stateParamId;
						approvesku['countName']	          =		$scope.ncount.countname;
						if(discrep !== 0){
							if(discrep > 0){
								approvesku['type']			=	'positive';
								approvesku['transtypeid']	=	ZCOUNT.POSITIVE;
							}else{
								approvesku['type']			=	'negative';
								approvesku['transtypeid']   =	ZCOUNT.NEGATIVE;
							}
						}
						$scope.reviewlist.push(revalue);
						$scope.approvelist.push(approvesku);
						if($scope.approveskulist.indexOf(revalue.sku) === -1){
							$scope.approveskulist.push(revalue.sku);
						}
					});
					deferred.resolve($scope.reviewlist);
				}else{
					$scope.reviewlist 	=	$scope.resultArray;
					deferred.resolve($scope.reviewlist);
				}
			return deferred.promise;
		};
		
		
		$scope.review_details=function(){
			//Reset Header Data in Print
			$scope.curentZone = {};

			if ($scope.creatingSnapshot === true) {
				return false;
			}

			ovcdataExportFactory.resetPdfHeaderData();
			$scope.enableZoneDetailView = true;
			$scope.reviewlist = [];

			var discrepancyFilter = [];
			angular.forEach($scope.count.selectedDiscrepancyFilter, function(item){
	            if(discrepancyFilter.indexOf(item.id) === -1){
	               discrepancyFilter.push(item.code);
	            }        
	        });

			Data.get('/review?countId='+stateParamId+'&page_offset='+$scope.count.reviewoffset+'&page_lmt='+$scope.count.reviewentryLimit+'&discrepancy='+discrepancyFilter).then(function (data) {
				if(data && data.result && data.result.review_data && data.result.review_data.length){
					if(data.result.total_count)
						$scope.count.reviewtotalitems 	=	data.result.total_count;
					var skudata=[];

					if(data && data.result && data.result.countItemData){
						$scope.count.CountItemPopup = data.result.countItemData;
					}
					if(data && data.result && data.result.zone_data)
						$scope.count.countZoneData = data.result.zone_data;

					$scope.disValidate = false;
					if (data.result.zone_data) {
						$scope.zone_obj = {};
						angular.forEach(data.result.zone_data, function(zone){
							// skudata.push(sku.sku);
							$scope.zone_obj[zone._id] = zone.id;
							if (!zone.countStatus || (!zone.countStatus === 'validate') || (zone.countStatus === 'approve')){
								$scope.disValidate = true;
							}
						});
					}
						var sku_products 	=	$scope.skuProducts(data.result.review_data);
						sku_products.then(function(sku_products_data){
							if(sku_products_data){
								var final_product	=	$scope.finalProduct(sku_products_data);
								final_product.then(function(final_product_data){
									console.log("$scope.reviewlist________:",$scope.reviewlist);
								});
							};
						});
				}
			},function(error){
				console.log("review Service Failed");

			});	
		}
		
		$scope.doSomething = function(typedthings){
			if(typedthings && typedthings != '...'){		
				var loc_id=$scope.ncount.locationId;
				ovcDash.get('apis/ang_loc_products?srch='+typedthings+'&locid='+ encodeURIComponent(loc_id)).then(function (result) {			
					if(result.status != 'error'){
	                    helper.multiDropDown(result , $scope.config.showskugroup).then(function(data){
	                    	$scope.transactions     =   data.rows;
	                        $scope.allvalues        =   data.allvals;
	                        $scope.allSKUobj        =   data.skuObj;
						}, function(error){
							console.log('MultiDropdown Error : '+ error);
						});				
					}	
				});
			}
		}

		//Zone Detail Page change Functionality
		$scope.count.pagechanged  =   function(){
	        $scope.count.offset = ($scope.count.currentPage - 1) * $scope.count.entryLimit;
	        $scope.getZoneDetail($scope.recountNumber,$scope.curentZone);
	    };

	    //Zone Review Page change Functionality
		$scope.count.reviewpagechanged  =   function(){
	        $scope.count.reviewoffset 	= ($scope.count.reviewcurrentPage - 1) * $scope.count.reviewentryLimit;
	        $scope.review_details();
	    };

		//For Only StyleGroup Enable
		function StyleMatrix(style){
			var loc = $scope.ncount.locationId;
            $scope.styleitems = {locationId: loc,  result:'',styleresult:style,mode:"edit"};
            angular.element(document.getElementById('lkpmatrix'))
                .html($compile('<style-matrix></style-matrix>')($scope));
		}

		//Receiving SKU From Stylematrix
		$scope.getmodifiedsku = function(SKUs){
			$scope.StyleData = {SKUsObj : SKUs , product : {}};
			var selectedskus = Object.keys(SKUs).join(',');
			var loc = $scope.ncount.locationId;
			ovcDash.post('apis/ang_loc_skuproducts',{data:{srch:selectedskus,locid:loc, isRules: true}}).then(function(data){
				if(data && data.status !== 'error'){
					angular.forEach(data , function(val, key){
                        if(val.ProductTbl && val.ProductTbl.sku)
                        	$scope.StyleData.product[val.ProductTbl.sku] = val.ProductTbl;
                    });
                    styleMatrixSKUAdd();
				}else{
					var output = {"status": "error", "message": "SKU's not available for this store."};
                    Data.toast(output);
				}
			});
		}

		//Style Matrix SKU add
		function styleMatrixSKUAdd (){
			var styleSkuObj = $scope.StyleData.SKUsObj;
			var update = false;var linedetails = [0];
			$scope.count.totalItems =  $scope.count.totalItems ? $scope.count.totalItems : 0;
			angular.forEach(styleSkuObj , function(styleqty, SKU){
				var update = false;
				var sval = $scope.StyleData.product[SKU];
				angular.forEach($scope.listPROD, function(lval,lindex) {
					if(lval.productCode === SKU){
						// var length_q = lval.qty.length;
						var qty 	 = (lval.qty)+styleqty;
						update  	 = true;
						$scope.listPROD[lindex].qty = qty;
					}
					if(lval.lineNumber !== ''){
						$scope.originalSkuQty++;
			           linedetails.push(lval.lineNumber);
					}
				});
				var newline=Math.max.apply(Math,linedetails);
				if($scope.ncount.countType === 'Z-Count')
				$scope.maxRecount = 1;
				if(!update){
					var qty;
					if($scope.ncount.countType === 'Z-Count'){
						qty = 0;
					}	
					newline = newline + 1;
					if($scope.StyleData.product[SKU])
					$scope.listPROD.push({productCode : sval.sku, name : sval.name, productid:sval.id,locationid: $scope.ncount.locationId, description:sval.description, qty:qty, countStatus:$scope.curentZone.countStatus,lineNumber:newline});
					$scope.count.totalItems++;
				}
				if($scope.ncount.countType === 'Z-Count' && qty!==0){
					$scope.originalScanQty += styleqty;
				}
				$scope.scanitems[$scope.maxRecount] += styleqty;		
				document.querySelector('.prod_result').value =  '';
			});
			$scope.countprod.result  = "";
			$scope.transactions 	= [];
			$timeout(function () { $scope.allvalues = [];$scope.fillTableElements($scope.listPROD); }, 500);
		}

		//SKU/Style Select
		$scope.doSomethingElse = function(suggestion){
			var temp 	=	{result : suggestion};
			$scope.addZoneitems(temp);
		}

		function SKUGroupAdd(values){
			if($scope.allvalues && $scope.allSKUobj){
				var selects2 		= 	values.result;
				var selectedprod 	=	angular.isArray(selects2) ? selects2 : selects2.split('~');
				var newline = 0;

				$scope.count.totalItems =  $scope.count.totalItems ? $scope.count.totalItems : 0;
				if($scope.allSKUobj[selectedprod[0]]){
					var update = false;var linedetails = [0];
					var sval   = $scope.allSKUobj[selectedprod[0]];
					if($scope.listPROD.length){
						angular.forEach($scope.listPROD, function(lval,lindex) {
								if(lval.productCode === selectedprod[0]){
									update  	 = true;
									if(lval.qty){ 	
										// var length_q = lval.qty.length;
										var qty 	 = (lval.qty)+1;
										$scope.listPROD[lindex].qty = qty;
									}

								}
							if(lval.lineNumber !== ''){
								$scope.originalSkuQty++;
					           linedetails.push(lval.lineNumber);
							}	
						});

					}
					var newline=Math.max.apply(Math,linedetails);
					if(!update){
					if($scope.ncount.countType === 'Z-Count'){ 
						var qty = 0;
					}
						newline = newline + 1;
						$scope.listPROD.push({productCode : sval.sku, name : sval.name, productid:sval.id,locationid: $scope.ncount.locationId, description:sval.description, qty:qty, countStatus:$scope.curentZone.countStatus,lineNumber:newline});
						$scope.count.totalItems++
					}
					if($scope.ncount.countType === 'Z-Count'){
						$scope.scanitems[$scope.maxRecount] += 1;	
					}
					document.querySelector('.prod_result').value =  '';
				}
				$scope.countprod.result  = "";
				$scope.transactions 	= [];
				$scope.prod_result = "";
				if($scope.ncount.countType === 'Z-Count' && qty!==0){
					$scope.originalScanQty++;
				}
				$timeout(function () { $scope.allvalues = [];$scope.fillTableElements($scope.listPROD); }, 500);	
			}else{
				
				return false;
			}
		}
		$scope.addZoneitems = function (formvalue) {
			if(formvalue.result){
				var suggestArray 	=	formvalue.result.split('~');
				var sku 	= 	suggestArray.length == 3 ? true : false;
				// var temp 	=	{result : suggestion};
				if(sku){
					SKUGroupAdd(formvalue);
				}
				else{
					StyleMatrix(formvalue.result);
				}

			}else{
				return false;
			}

		};
		
		$scope.fillTableElements = function (data) {
			$scope.loadval = 0;
			$scope.prodlist = data;
			$scope.currentPages = 1; //current page
			$scope.entryLimits = $rootScope.PAGE_SIZE; //max no of items to display in a page
			$scope.filteredItems = $scope.prodlist.length; //Initially for no filter  
			$scope.zskuqty = data.length;
			// $scope.count.totalitems 	=	data.length;
		}		
		
		$scope.cancel_transaction=function(){			
			$state.reload();			
		}
		
		/* delete tr from table after adding products */
		$scope.removeprRow = function (idx,countid) {	
			if(idx !== -1) {
				var delZone = {};
				$.confirm({
					title: 'Delete Count Item',
					content: 'Confirm delete?',
					confirmButtonClass: 'btn-primary popupBtn',
					cancelButtonClass: 'btn-primary popupBtn',
					confirmButton: 'Ok',
					cancelButton: 'Cancel',
					confirm: function () {
						if(countid !== undefined){
							Data.delete('/countitem/'+countid+'?countId='+stateParamId+'&zoneId='+$scope.curentZone._id).then(function (data) {						
								var output={"status":"success","message":$scope.ovcLabel.count.toast.sku_delete_success};
								Data.toast(output);
								delZone = $scope.curentZone;
								var dataObjs = {
									skuQty :  $scope.count.totalItems,
									scanQty :  $scope.originalScanQty
								}
								countZoneUpdate(dataObjs);
							});
						}else{
							
							var output={"status":"error","message":$scope.ovcLabel.count.toast.sku_delete_success};
							Data.toast(output);
						}	
						var noitems=[];

						var productQty = $scope.prodlist[idx].qty;
						if(productQty && $scope.scanitems && $scope.scanitems[$scope.maxRecount]){
							noitems[$scope.maxRecount] = parseInt($scope.scanitems[$scope.maxRecount])- parseInt(productQty);
						}

						if($scope.originalScanQty && productQty){
							$scope.originalScanQty = parseInt($scope.originalScanQty) - parseInt(productQty);
						}
						$scope.prodlist.splice(idx, 1);
						$scope.count.totalItems = $scope.count.totalItems - 1;
						$scope.scanitems = noitems;
						$scope.zskuqty = $scope.prodlist.length;
						function countZoneUpdate(dataObjs){
							Data.post('/countzone/'+delZone._id, {
								data:dataObjs
							}).then(function (results) {
								error = results.ok;
							});
						}
						

						var qtyCheck = 0;
						angular.forEach($scope.allzones1, function(allzne,indxq) {
							if(allzne._id === delZone._id){
								$scope.allzones1[indxq].skuQty = $scope.count.totalItems;
								$scope.allzones1[indxq].scanQty = $scope.originalScanQty;
							}
							if(!allzne.skuQty){
								qtyCheck++;
							}
						});
						if($scope.allzones1.length === qtyCheck)
							$scope.selectallChkBox = false;
						$scope.list = $scope.allzones1;
					},
					cancel: function () {
						return false;
					}
				
				});
				return false;
			}
		};
		$scope.checkvalue 		=	[];

		//Check the count names are unique
		$scope.checkZonenames 	=	function(zoneName,data,checkId){
			var increase 	=	0;
			angular.forEach($scope.list,function(zonevalue,zonekey){
				if(zonevalue.id === zoneName){
					increase++;
				}
				if(increase > 1){
					data.errorcheck 	=	'+Q-red0(id)';
					if($scope.checkvalue.indexOf(checkId) === -1){
						$scope.checkvalue.push(checkId);
					}
				}else{
					data.errorcheck 	=	'correct';
					if($scope.checkvalue.indexOf(checkId) !== -1){
						var checkval 	= $scope.checkvalue.indexOf(checkId);
						$scope.checkvalue.splice(checkval, 1);
					}
				}
			});
		};
		$scope.checkempty 	=	function(data,actualId){
			if(data.id === ''){
				data.id = actualId;
			} 
		}
		$scope.totalSkuQtyCalculation = function(){
			$scope.originalScanQty  = $scope.finalQty;
		}

		// $scope.scanitems=0;
		$scope.calcScans= function(pindex,qty,oldvalue,newValue){
			var quantity=qty;
			var noitems=[];
			var subtotal=0;
			var newqty=0;
			if(oldvalue && newValue){
				var diff = parseInt(newValue) - parseInt(oldvalue);
				$scope.finalQty = $scope.originalScanQty + diff;
			}
			
			angular.forEach($scope.prodlist, function(item) {
				if(_.isNumber(item.qty)!==true){
					newqty=0;
				}else{
					newqty = item.qty;
				}
				noitems[$scope.maxRecount] = ((parseInt(noitems[$scope.maxRecount]))?(parseInt(noitems[$scope.maxRecount])):0)+parseInt(newqty);
			});
			$scope.scanitems = noitems;
		}

		$scope.decreasehcq = function(index){

			$scope.list[index].handCountQty = $scope.list[index].handCountQty - 1;

		}

		$scope.increasehcq = function(index){

			$scope.list[index].handCountQty = $scope.list[index].handCountQty + 1;

		}

		$scope.minmaxhcq = function(value, min, index){

			  if(parseInt(value) < min || isNaN(value)) {
	                $scope.list[index].handCountQty = min;
	          }
	          else{
	                $scope.list[index].handCountQty = value;
	           }
		}

		$scope.decreasehq = function(){

				$scope.curentZone.handCountQty = $scope.curentZone.handCountQty - 1;

		}

		$scope.increasehq = function(){

				$scope.curentZone.handCountQty = $scope.curentZone.handCountQty + 1;

		}

		$scope.idminmaxhq = function(value, min){

			  if(parseInt(value) < min || isNaN(value)) {
	                $scope.curentZone.handCountQty = min;
	            }
	            else{
	                $scope.curentZone.handCountQty = value;
	            }

		}
	    $scope.decrease = function(index){
				var productDecreaseQty  =  $scope.prodlist[index]['qty'];
	            productDecreaseQty  	=  productDecreaseQty - 1;
				if(productDecreaseQty >= 0){
					$scope.originalScanQty--;
				}
				$scope.prodlist[index]['qty'] = productDecreaseQty;

	    };

	    $scope.increase = function(index){
	    	var productIncreaseQty = $scope.prodlist[index]['qty'];
	            productIncreaseQty = productIncreaseQty + 1;
	            $scope.prodlist[index]['qty'] = productIncreaseQty;
	            $scope.originalScanQty++;
	    };

	    $scope.idminmax = function (value, min, index){

	            if(parseInt(value) < min || isNaN(value)) {
	                $scope.prodlist[index]['qty'] = min;
	            }
	            else{
	                $scope.prodlist[index]['qty'] = value;

	            }
	    };
		
        /* delete tr from table after adding products */
        $scope.zoneProducts = function(cdatas, prods, zone_id) {
        	var zone_dtl = $scope.curentZone;
            var prodslength = prods.length;
            var errors = 0;
            if (prodslength > 0) {
                var post = [];
                var put = [];
                var products_dataobj=function () {
                	var deferred 	=	$q.defer();
                        var data = {};
                        data.zoneupdateData =angular.toJson(post) ;
                        data.zonecreateData = angular.toJson(put);
                        Data.post('/saveCountZone/' + zone_dtl.countId, {
                            data: data
                        }).then(function(results) {
                        	if(results && results.status === 'success'){
                        		deferred.resolve(results);
                        	}
                        });
                        post = [];
                        put = [];
                   	return deferred.promise;
                };
                angular.forEach(prods, function(items, indx) {
                	var productsObj = {
                        countId: parseInt(zone_dtl.countId),
                        zoneId: zone_dtl._id,
                        operatorId: zone_dtl.operatorId,
                        deviceId: '',
                        recountType: '',
                        countStatus: (items.countStatus != undefined) ? items.countStatus : 'open',
                        productCode: items.productCode,
                        sku: items.productCode,
                        lineNumber: items.lineNumber,
                        uom: '',
                        comment: items.comments,
                        badScan: ''
                    	}

                   	if(cdatas.countType === 'Z-Count'){	
                    	productsObj.qty = parseInt(items.qty);
                    }
                    if (items._id !== undefined) {
                      	productsObj['_id'] = items._id
                        post.push(productsObj)
                    }
                    else {
                        put.push(productsObj)
                    }
                    if (post.length + put.length === 1000) {
                   		products_dataobj().then(function(tempData){
                   		}); 
               		}
                    if ((prods.length - 1) === indx) {
                     products_dataobj().then(function(zoneSave){
                     	$scope.curentZone = {};
                     	zone_dtl.scanQty = $scope.originalScanQty;
                        $scope.getZoneDetail(zone_id, zone_dtl);
                     });   
                     
                    }
                });
            }
            // return false;
            var error = 0;
            if($scope.ncount.countType === 'Z-Count'){
	            var dataObjs = {
	                comment: $scope.curentZone.comment,
	                handCountQty: zone_dtl.handCountQty,
	                operatorId: zone_dtl.operatorId,
	                skuQty: $scope.count.totalItems,
	                scanQty: $scope.originalScanQty
	            }
        	}else{
        		var dataObjs = {
	                comment: $scope.curentZone.comment,
	                handCountQty: zone_dtl.handCountQty,
	                operatorId: zone_dtl.operatorId,
	                skuQty: $scope.count.totalItems
	            }
            }
            if(prodslength > 0){
            	$scope.getcount_intapi();
            	Data.post('/countzone/' + zone_dtl._id, {
	                data: dataObjs
	            }).then(function(results) {
	                if (results && results.ok === 1) {
	                    var output = {
	                        "status": "success",
	                        "message": $scope.ovcLabel.count.toast.zone_update_success
	                    };
	                    Data.toast(output);
	                }
	            });
            }else{
            	$scope.selectedskus 		=	true;
				$timeout(function(){
            		$scope.selectedskus 	=	false;
        		}, 3000);
            	return false;
            }
            angular.forEach($scope.allzones1, function(allzne, indxq) {
                if (allzne._id === zone_dtl._id) {
                    $scope.allzones1[indxq].skuQty = $scope.zskuqty;
                    $scope.allzones1[indxq].scanQty = $scope.scanitems[$scope.maxRecount];
                }
            });
        }
        $scope.countSnapshot = function() {
        	if($scope.ncount.countType === 'Cycle'){
	        		$.confirm({
					title: $scope.ovcLabel.count.startCount || 'Start Count',
					content: $scope.ovcLabel.count.bannerMsg.startCountConfirm || 'Please note this action cannot be reversed and new products cannot be added to the zones once the snapshot is taken.',
					confirmButtonClass: 'btn-primary popupBtn',
					cancelButtonClass: 'btn-primary popupBtn',
					confirmButton: 'Ok',
					cancelButton: 'Cancel',
					confirm: function () {
						Data.post('/createCountSnapshot/' + stateParamId, {
	                	data: {}
			            }).then(function(results) {
			                if (results.status === "success") {
			                	$scope.creatingSnapshot = true;
			                    $scope.ncount.countCreated = results.result.countCreated;
			                    $scope.ncount.cstatus = $scope.ovcLabel.count.countStatus[results.result.countStatus];
			                    var output = {
			                        "status": "success",
			                        "message": $scope.ovcLabel.count.toast.snapshot_update_success
			                    };
			                    Data.toast(output);
			                } else {
			                    console.log(results);
			                }
			            });
					},
					cancel: function () {
						return false;
					}
	            });
				return false;
        	} else {
	            Data.post('/createCountSnapshot/' + stateParamId, {
	                data: {}
	            }).then(function(results) {
	                if (results.status === "success") {
	                	$scope.creatingSnapshot = true;
	                    $scope.ncount.countCreated=results.result.countCreated;
	                    $scope.ncount.cstatus = $scope.ovcLabel.count.countStatus[results.result.countStatus];
	                    var output = {
	                        "status": "success",
	                        "message": $scope.ovcLabel.count.toast.snapshot_update_success
	                    };
	                    Data.toast(output);
	                } else {
	                    console.log(results);
	                }
	            });
	        }
        }
		$scope.zoneUpdate 	=	function(nzones,cdatas){
			var deferred 			= 	$q.defer();
			angular.forEach(nzones, function(items,indx) {
				var datazoneObjs = {
					zoneId:items.id,
					handCountQty :  items.handCountQty,
					operatorId :  items.operatorId,
					skuQty :  (items.skuQty != undefined)?parseInt(items.skuQty):0,
					scanQty :  (items.scanQty != undefined)?parseInt(items.scanQty):0
				}
				Data.post('/countzone/'+items._id, {
					data:datazoneObjs
				}).then(function (results) {
					if((nzones.length-1) === indx){
						var output={"status":"success","message":$scope.ovcLabel.count.toast.countzone_update_success};
						Data.toast(output);
					} 
				});
			});	
			if(cdatas.numberOfZones !== $scope.action1.filteredItems){
				var dataObjs = {
					numberOfZones :  $scope.action1.filteredItems
				}
				Data.post('/count/'+stateParamId, {
					data:dataObjs
				}).then(function (results) {					
				});
			}	

			deferred.resolve('true');

			return deferred.promise;
		}

		$scope.addzones = function (cdatas, nzones,action) {
			var error = 0;
			if($scope.checkvalue.length === 0){
				var zoneUpdate 	=	$scope.zoneUpdate(nzones,cdatas);
				zoneUpdate.then(function(returnData){
					if(returnData && action === 'pageChanged'){
						$scope.storepage	=	$scope.action1.currentPage;
						$scope.getcount_intapi();
					}
				});
			}else{
		 		angular.element('#'+$scope.checkvalue[0]+'error').focus();
				$scope.action1.currentPage  = ($scope.storepage) ? $scope.storepage : 1 ;
			}				
		} 
	}
});

/* list count details */
app.controller('countslistcntrl',function ($rootScope, $scope, $state, $http, $stateParams, $cookieStore, $timeout, Data,ovcDash,COUNTSTATUS,ZONECOUNT, TreeViewService, userRoleConfigService, Utils){ 
	var langObj = $scope.ovcLabel.count.buttontypes;
	var lang    =  $scope.ovcLabel.count.reports;
	var countStatusLabel = $scope.ovcLabel.count.countStatus;

	$scope.countsearch 					=	{};
	$scope.countsearch.searchCountName 	=	'';
	$scope.countsearch.searchCountNumber=	'';
	$scope.countsearch.status 			=	'';
	$scope.countsearch.todate 			=	'';
	$scope.countsearch.fromdate 		=	'';
	$scope.countsearch.displayName 		=	'';
	$scope.location 	=	{};
	$scope.action 		=	{};
	$scope.action.maximize      =   false;

	/*****Enable and Disable based on Permission******/
	$scope.vlicount		=	true;
	$scope.molcount		=	true; 
    var countStatus     =   [];

    angular.forEach(COUNTSTATUS, function(item) {
        item.label              =   $scope.ovcLabel.count.countstatuslist[item.code];
        countStatus.push(item);
    });

    userRoleConfigService.getRoles(function(rolesData){
        $scope.rolePerm     =   rolesData;
    });

    $scope.countstatusname  =   countStatus;
    $scope.statusData 		=	{};
	$scope.statusData.countStatusList = {};
    $scope.statusData.countStatusList =countStatus;
    $scope.statusData.countStatusSelected=[];

     /*For heirarical dropdown Filter*/
    $scope.searchLocation = function(location){
        $scope.action.filterLocation    =   location;
    };
    $scope.allstores = {};
    	function locationDefault(){
        	Utils.hierarchylocation().then(function(results){
	            if(results){
	                $scope.storeLocData =   TreeViewService.getLocData(results);
	                if(sessionStorage.locationArray){
	                	$scope.checkBoxSelect($scope.storeLocData[0], true, sessionStorage.locationArray);
	            		$scope.addSelectedClass($scope.storeLocData[0], true, sessionStorage.locationArray);
	            		$scope.zcount_search();
	                }else{
	                	$scope.checkBoxSelect($scope.storeLocData[0], true);
	            		$scope.addSelectedClass($scope.storeLocData[0], true);
	            		$scope.zcount_search();
	                }
	                if(results.status==='error'){
		                $scope.store_datas = [];
		             }
		             else{
		                $scope.store_datas =	results.hierarchy;
		                if($scope.store_datas.length===1){

		                	$scope.countsearch.displayName	=	results.hierarchy[0].id;
		                }
		               	angular.forEach(results.hierarchy,function(storename){
		                	$scope.allstores[storename.id] = storename.name;
		                });
		            }
	            }
	        },function(error){
	            
	        });
        }
        locationDefault();

	$scope.getPieChartOptions =   function() {
        var pie_chart = {
            chart: {
                type: 'pieChart',
                height: 300,
                x: function(d){return d.key;},
                y: function(d){return d.y;},
                showLabels: false,
                duration: 500,
                labelThreshold: 0.01,
                labelSunbeamLayout: true,
                tooltip:{
                  contentGenerator: function (res) {
                    var tmp =   '<table><tbody><tr><td class="legend-color-guide">';
                        tmp +=  '<div style="background-color: '+res.color+';"></div></td>';
                        tmp +=  '<td class="key textC">'+res.data.key+'</td>';
                        tmp +=  '<td class="value">'+res.data.y+'</td>';
                        tmp +=  '</tr></tbody></table>';
                    return tmp;
                  }
                },
                legend: {
                    margin: {
                        top: 5,
                        right: 35,
                        bottom: 5,
                        left: 0
                    }
                }
            },

            "title": {
                "enable": false
            }
        };

        return pie_chart;
    };

    $scope.showHideChart	=	function(){
    	var tmp	 =  $rootScope.displayCountChart;
    	if( tmp === true ){
    		tmp = false;
    	}
    	else{
    		tmp = true;
    	} 
    	$rootScope.displayCountChart	=	tmp;
    }

    $scope.option_discrete = {
        chart: {
            type: 'discreteBarChart',
            height: 300,
            margin : {
                top: 20,
                right: 20,
                bottom: 50,
                left: 55
            },
            x: function(d){return d.label;},
            y: function(d){return d.value;},
            //tooltips: true,
            tooltip:{
                enabled : true,
                contentGenerator: function (res) {
                    var tmp =   '<table>';
                            tmp +=  '<thead>';
                                tmp +=  '<tr>';
                                    tmp +=  '<td class="legend-color-guide"><div style="background-color: '+res.color+';"></div></td>';
                                    tmp +=  '<th class="chart_uppercase">' +lang.count_name+ '</th>';
                                    tmp +=  '<th class="chart_uppercase">' +lang.sku+ '</th>';
                                    tmp +=  '<th class="chart_uppercase">' +lang.discrepency+ '</th>';
                                tmp +=  '</tr>';
                            tmp +=  '</thead>';
                            tmp +=  '<tbody>';
                            tmp +=  '<tr>';
                                tmp +=  '<td></td>';
                                tmp +=  '<td>'+res.data.countName+'</td>';
                                tmp +=  '<td class="key textC">'+res.data.sku+'</td>';
                                tmp +=  '<td class="chart_uppercase">'+res.data.value+'</td>';
                            tmp +=  '</tr>';
                            tmp +=  '</tbody>';
                        tmp +=  '</table>';

                    return tmp;
                }
            },
            showValues: false,
            valueFormat: function(d){
                return d3.format(',.d')(d);
            },
            duration: 500,
            xAxis: {
                axisLabel: lang.sku
            },
            yAxis: {
                axisLabel: lang.discrepency,
                axisLabelDistance: -10
            }
        }
    };

    //Pie Chart Options
    $scope.count_option_pie =   $scope.getPieChartOptions();
    $scope.getQueryString =   function() {
    	var locationData    =   $scope.location.id ? $scope.location.id : [];
        var locationArray   =   locationData.join();
        var qry_strng   =   [];

        if($scope.location.id && $scope.location.id.length){
            qry_strng.push('storeId=' + encodeURIComponent(locationArray));
        }
        if( $scope.cntStatus &&  $scope.cntStatus !== ''){
            qry_strng.push('countStatus=' + $scope.cntStatus);
        }
        if($scope.countsearch.searchCountName && $scope.countsearch.searchCountName!== ''){
            qry_strng.push('name=' + $scope.countsearch.searchCountName);
        }
        if($scope.countsearch.searchCountNumber && $scope.countsearch.searchCountNumber!==''){
        	qry_strng.push('countNumber='+$scope.countsearch.searchCountNumber);
        }

        return qry_strng;
    };



	$scope.getStatusReports   =   function(action) {

       var qry_strng   =   $scope.getQueryString();

       $scope.data     =       [];

       if(action === 'count'){
           $scope.count_data   =   [];
       }

       qry_strng.push('report_action=' + action);

        if(qry_strng.length > 0){
           qry_strng  =   qry_strng.join('&');
        }
       $scope.count_item_data     =       [];

       Data.get('/getstatusreport?'+qry_strng).then(function(data) {

           if(!data.error)
           { 
           	if(data.countStatusData) 
        		 {     
        		 		 angular.forEach(data.countStatusData, function(item){
                            var tmp =   {};
         
                            tmp.y   =   item.count;
         
                            if(action === 'count')
                            {
                                if(item._id.countStatus === 'validate'){
                                    tmp.key =   lang.validated;
                                }
                                if(item._id.countStatus === 'recount'){
                                    tmp.key =   lang.in_progress;
                                }
                                else if(item._id.countStatus === 'approve'){
                                    tmp.key =   lang.approved;
                                }
                                else{
                                    tmp.key =   item._id.countStatus;
                                }
                                
                                $scope.count_data.push(tmp);
                            }
                            else
                            {
                                tmp.key =   item._id.orderStatus;
                                $scope.data.push(tmp);   
                            }
                        });
 			}
 			var obj     =   {};
 			if(data.itemStatusData){

 				       obj.values  =   [];
                angular.forEach(data.itemStatusData, function(item, index) {

                    var tmp     =   {};

                    tmp.label       =   index;
                    tmp.sku         =   item._id.sku;
                    tmp.countId     =   item._id.countId;
                    tmp.countName   =   item.countId.name;
                    tmp.oh          =   (item.oh && item.oh.length > 0) ? eval(item.oh.join('+')) : 0;
                    tmp.qty         =   (item.qty && item.qty.length > 0) ? eval(item.qty.join('+')) : 0;
                    tmp.value       =   tmp.qty - tmp.oh;

                    obj.values.push(tmp);
                });
                $scope.count_item_data.push(obj);
 			}
 			 
           }
       });  
   	};

    $scope.maximizeChart    =   function(id_item) {
        if( ! $scope.action.maximize){
            $scope.action.maximize  =   {};
        }

        $scope.action.maximize[id_item]  =   ! $scope.action.maximize[id_item];

        switch(id_item) {
        	case 'count_item' :
                $timeout(function() {
                    $scope.option_discrete.chart.height     =   $scope.action.maximize[id_item] ? 280 : 300;
                },100);
                break;
            case 'count_pie' :
                $timeout(function() {
                    $scope.count_option_pie.chart.height    =   $scope.action.maximize[id_item] ? 450 : 300;
                },100);
                break;
        };

        return;
    };

    $scope.getCountStatus   =   function() {
        $scope.getStatusReports('count');
    };

	$scope.servicefun2 = function() {
		$rootScope.$watch('ROLES',function(){
			var role_det=$rootScope.ROLES;
			angular.forEach(role_det, function(roles,key) {

				if (key === 'zCounts'){
					var viewZcounts		=	roles.viewZcounts?roles.viewZcounts:0;
					var modifyZcounts	=	roles.modifyZcounts?roles.modifyZcounts:0;

					if(viewZcounts		===	1){
						$scope.vlicount	=	false;
					}

					if(modifyZcounts	===	1){
						$scope.vlicount	=	false;
						$scope.molcount	=	false;
					}
				}
			});
		
		}); 
	}
	$scope.servicefun2();
	
    $scope.setPage = function(pageNo) {
        $scope.currentPage = pageNo;
    };
    $scope.reverse =''; $scope.predicate = '';
    $scope.sort_by = function(predicate) {
        $scope.predicate 	= 	predicate;
        $scope.reverse 		= 	!$scope.reverse;
    };
	

	$scope.countsearch 		=	{};

    if(sessionStorage.countsSearchData){
        $scope.countsearch     =   JSON.parse(sessionStorage.countsSearchData);
    }
	
	$scope.entryLimit 		= 	sessionStorage.countsPageLimit ? sessionStorage.countsPageLimit : $rootScope.PAGE_SIZE; //max no of items to display in a page
	$scope.currentPage         =    1;

	/*****Count Search*****/

	$scope.zcount_search= function(){
		$scope.cntStatus=[];
		sessionStorage.countsSearchData 	=	JSON.stringify($scope.countsearch);
		sessionStorage.countsPageLimit		=	$scope.entryLimit;
		angular.forEach($scope.statusData.countStatusSelected , function(item){
            if($scope.cntStatus.indexOf(item.id) === -1){
               $scope.cntStatus.push(item.code);
            }        
        });
        var locationData     			=   $scope.location.id ? $scope.location.id : [];
        var locationArray    			=   locationData.join();
        sessionStorage.locationArray 	=	locationArray;
		// if(search_data != 'undefined'){
		var searchData 					=	$scope.countsearch;
		var count_name 					=  	searchData.searchCountName?searchData.searchCountName:'';
		var count_number 				=	searchData.searchCountNumber?searchData.searchCountNumber:'';
		var from_date 					=	searchData.fromdate?searchData.fromdate:'';
		var to_date 					=	searchData.todate?searchData.todate:'';
		var store 						=  	locationArray;
		var count_status 				=	$scope.cntStatus;
		var tmp 						=	false;
		$scope.timeGreater 				= 	false;

		if( from_date && to_date ) {
			var start 	= new Date(from_date);
			var end 	= new Date(to_date);

			if( start > end ){
				$scope.timeGreater = true;
			}
		}

		if(!$scope.timeGreater) {
			angular.forEach(searchData,function(key){
				if ( key && key !== null) {
					tmp = true;
				}
			});
			if(tmp === true){
				$state.go('ovc.Counts-list',{fullList:false});
			}
			else{
				$state.go('ovc.Counts-list',{fullList:true});
			}

			Data.get('/count?name='+count_name+'&countNumber='+count_number+'&startDate='+from_date+'&endDate='+to_date+'&store='+encodeURIComponent(store)+'&countStatus='+count_status).then(function (data) {
				
				var allcounts 	= 	data;
				// var cenddate 	= countdate= '';
				angular.forEach(allcounts,function(item,index) {
					try{
						data[index].cstatus = countStatusLabel[item.countStatus];
					}
					catch(error){
						console.log(error);
					}
				});
				$scope.list  			=  	data;
				$scope.currentPages 	= 	1; //current page
				$scope.filteredItems 	= 	$scope.list.length; //Initially for no filter  
				$scope.totalItems  		= 	$scope.list.length;
			});
			$scope.getCountStatus();
		}		
	}
	
	/***Reset Search****/
	 $scope.zcount_reset= function(){
		delete sessionStorage.countsSearchData;
        delete sessionStorage.countsPageLimit;
        delete sessionStorage.locationArray;
        $scope.countsearch.searchCountName='';
		$scope.countsearch.searchCountNumber='';
		$scope.countsearch.status='';
		$scope.countsearch.todate='';
		$scope.countsearch.fromdate='';
		$scope.countsearch.displayName='';
		$scope.statusData.countStatusSelected = [];
		locationDefault();
	}
	$scope.zcount_reload=function(){
		$state.reload();
	}
	/*****Delete Counts****/
	$scope.zcount_delete = function (id) {
		
		var countid = id ;
		
		$.confirm({
			title: 'Delete Count',
			content: 'Confirm delete?',
			confirmButtonClass: 'btn-primary',
			cancelButtonClass: 'btn-primary',
			confirmButton: 'Ok',
			cancelButton: 'Cancel',
			confirm: function () {
				Data.delete('/count/'+countid).then(function (data) {
				
					var output={"status":"success","message":$scope.ovcLabel.count.toast.count_delete_success};
					Data.toast(output);
					locationDefault();
				});
				
			},
			cancel: function () {
				return false;
			}
		
		});
		return false;
	}

});


app.directive('resize', function ($window) {
   return function (scope, element) {
       var w = angular.element($window);
       scope.getWindowDimensions = function () {
           return {
               'h': w.height(),
               'w': w.width()
           };
       };
       scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
           scope.windowHeight = newValue.h;
           scope.windowWidth = newValue.w;

           scope.style = function () {
               return {
                   'height': (newValue.h - 400) + 'px'
               };
           };

       }, true);

       w.bind('resize', function () {
           scope.$apply();
       });
   }
});
app.controller ("TabsChildController", function($scope, $log){
  
})