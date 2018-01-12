var app = angular.module('OVCstockApp',['ui.bootstrap.treeview', 'ovcdataExport', 'roleConfig']);
/*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module     :   Adjustment list
*
*    Developer  :   Arun
* 
*    Date       :   22/03/2016
*
*    Version    :   1.0
*
**********************************************************************/

app.controller('listAdjustmentsCtrl', function($rootScope,$scope, $state, Data, ovcDash, $filter, $stateParams, $timeout, TRANSCODE, TreeViewService, ORDERTYPELIST, ovcdataExportFactory, REASONCODETYPE, roleConfigService,system_currencies,ADJUSTMENTSTATUS, ADVANCESEARCHFIELDS, Utils) {

    $scope.form                  =      $scope.ship =   {};
    $scope.action                =      {};
    $scope.action2               =      {};
    $scope.action2.currentPage   =      1;
    $scope.action2.offset        =      0;
    sessionStorage.cpordid	     =	    '';  
    sessionStorage.copyadj       =      '';  
    $scope.purchaseOrders        =      [];
    $scope.adjust_code           =      [];
    sessionStorage.adjust_id     =      '';
    $scope.searchParam           =      {};
    $scope.location              =      {};


    /*Getting Role Permission*/
    Utils.roles().then( function ( roles_val ) {
        if( roles_val ){
            $scope.permission = roles_val;
        }
    });

    var currencySymbols     =   $scope.ovcLabel.global.currency;
    var currencyCodes       =   system_currencies[0];
    $scope.currency         =   currencySymbols[currencyCodes.code];
    var adjStatusList       =   $scope.ovcLabel.adjustments.adjstatuslist;
    var orderStatus         =   [];
     /***Adjustment Statuses from Config ****/
    angular.forEach(ADJUSTMENTSTATUS, function(item) {
        item.label         =   adjStatusList[item.code];
        orderStatus.push(item);
    });
    $scope.Status           =   "status"
    $scope.statusData       =   {};
    $scope.statusData.adjmntStatusList       =   {};
    $scope.statusData.adjmntStatusList       =   orderStatus;
    $scope.statusData.adjmntStatusSelected   =   [];


    /*if($stateParams.fullList){
        delete sessionStorage.adjustmentSearchData;
        delete sessionStorage.adjustmentPageLimit;
        delete sessionStorage.locationname; 
        delete sessionStorage.skuid;
    }*/

    if(sessionStorage.adjustmentSearchData){
        $scope.form    =   JSON.parse(sessionStorage.adjustmentSearchData);
    }

    $scope.action2.entryLimit    =   sessionStorage.adjustmentPageLimit ? sessionStorage.adjustmentPageLimit : $rootScope.PAGE_SIZE;

    /* Getting adjustment Code type */
    var lab_adjust_code  =  $scope.ovcLabel.adjustments.translist;
    var adjust_code_ls  =  TRANSCODE;
    var code_ls_arr  =  [];

    angular.forEach(adjust_code_ls, function(item) {
        var newitem  =  {};
        newitem.value  =  item.code;
        var ad_code  =  lab_adjust_code[item.code];
        newitem.name  =  ad_code;
        code_ls_arr.push(newitem);
    });

    $scope.adjust_code  =  code_ls_arr;

    var adjustCodeList   =   $scope.ovcLabel.adjustments.translist;
    var adjustCode  =   [];

    angular.forEach( TRANSCODE, function( item ) {
        adjustCode[ item.code ]  =   adjustCodeList[ item.code ];
    });

    $scope.adjustCodeList  =   adjustCode;

    /*service call functions for search parameters.*/
    $scope.serviceCallFuncs = function(callback ) {
        var tranTypeList  =  [];
        var directTypeList  =  [];

        Data.get('/reasoncode?code_type=MAN_ADJS').then(function(results) {
           if( results ){
                var reasonCodeList   =   [];
                angular.forEach(results, function(item) {
                    reasonCodeList[item.id]   =   item.description;
                });
                $scope.searchParam.reasonCodeData   =   reasonCodeList;
            }
            Data.get('/transactiontype').then( function( results ){
                if( results ){
                    angular.forEach( results, function( item ){
                        tranTypeList[item.tranTypeId]  =  item.tranName;
                    });
                    $scope.searchParam.tranTypeData  =  tranTypeList;
                }
                Data.get('/adjustmentData').then(function( data ){
                    if(data.status == "success" && data.adjustmentData != ''){

                        var purchaseOrderArr   =   [];
                        var adjustmentNumArr   =   [];
                        var orderNum = '';
                        var indexVal  =  '';

                        angular.forEach( data.adjustmentData, function( adjustmentData ) {

                            orderNum  = adjustmentData.orderNumber;
                            indexVal = purchaseOrderArr.indexOf("orderNum");

                            if( orderNum && indexVal == -1 ){
                                purchaseOrderArr.push( orderNum );
                            }

                            if(adjustmentData.adjustmentNumber && adjustmentData.adjustmentNumber != '') {
                                adjustmentNumArr.push(adjustmentData.adjustmentNumber);
                            }
            
                        });

                        $scope.searchParam.purchaseOrders  =  purchaseOrderArr;
                        $scope.searchParam.adjustmentNumArr  =  adjustmentNumArr;
                        callback();
                    }else{
                        callback();
                    }
                });
            });
        });
    };

    $scope.serviceCallFuncs(function(){
        $scope.getLocation();
    });

    /*For heirarical dropdown Filter*/
    $scope.searchLocation = function(location){
        $scope.action.filterLocation    =   location;
    };

    var currencylabel  =   $scope.ovcLabel.global.currency;
    var currencylist   =   [];

    $scope.getLocation  =   function() {
        Utils.hierarchylocation().then(function(results){
            $scope.storeLocData =   TreeViewService.getLocData(results);  
            var selectedStore   =   $scope.storeLocData[0];
            var locationsList   =   [];
             angular.forEach(results.hierarchy, function(item) {
                currencylist[item.id]    =   item.currency;
                locationsList[item.id]   =   item.name;
             });
             $scope.allLocations   =   locationsList;
                if(sessionStorage.storeid){
                    angular.forEach(results.hierarchy,function(item){
                        if(sessionStorage.storeid == item.id){
                            selectedStore   =   item;
                            $scope.location.displayName = selectedStore.name;
                            $scope.checkBoxSelect(selectedStore);
                            $scope.addSelectedClass(selectedStore);
                            return false;
                        }
                    });
                    $timeout(function() {
                        $scope.searchAdjustment();
                    }, 800);
                }
                else{
                    $scope.checkBoxSelect($scope.storeLocData[0]);
                    $scope.addSelectedClass($scope.storeLocData[0]);
                    $timeout(function() {
                        $scope.searchAdjustment();
                    }, 800);
                }    
        }, function (error){
            console.log('Hierarchy Location Error :' + error);
        });
    };


    var userId = $rootScope.globals['currentUser']['username'];

    /***** Enable and Disable based on Permission and Configuration  Manager ******/

    $scope.storeDatas               =   [];
	$scope.allLocations   =   [];

    $scope.getConfigurations    =   function() {
        
        $rootScope.$watch('ROLES',function(){
            
            var roleDetails             =   $rootScope.ROLES;
            
            angular.forEach(roleDetails, function(roles,key) {
                
                if (key== 'purchasePrice'){
                    if((roles.viewpurchasePrice != 1) ){
                        $scope.viewPurchasePrice        =   false;
                    }
                }
            
            });
        });
    }

    $scope.advSearch   =   {};
    $scope.advSearch.advSrchFields = {};
    $scope.advSearch.advSearchData = {};
    $scope.advSearch.isAdvanceSearch = false;
    $scope.advanceSearch = function(){
        $scope.advanced = !$scope.advanced;
        if($scope.advSearch.isAdvanceSearch === undefined || $scope.advSearch.isAdvanceSearch === false){
            $scope.advSearch.isAdvanceSearch = true;
        }
        else if($scope.advSearch.isAdvanceSearch === true){
            $scope.advSearch.isAdvanceSearch = false
        }
    }

    $scope.setAdvSearchField = function(){
        var advSearchFieldArr = ADVANCESEARCHFIELDS['adjustments'];
        var advSearchField = {};
        angular.forEach(advSearchFieldArr,function(itm){
            advSearchField[itm] = true;
        });
        $scope.advSearch.advSrchFields = advSearchField;
    }
    $scope.setAdvSearchField();
    
    /**Search function for Adjustment**/
    $scope.srchAdjustmentData    =   {};
    $scope.list             =   []
    $scope.searchAdjustment = function() {
        $scope.form.advSearchData = {};
        $scope.form.advSearchData = $scope.advSearch.advSearchData;
        sessionStorage.adjustmentSearchData     =   JSON.stringify($scope.form);
        sessionStorage.adjustmentPageLimit      =   $scope.action2.entryLimit;
        var srchData        =   $scope.form;
        $scope.searchingstatus  =   [];
        
        if(Object.keys($scope.form).length > 0){
            $scope.action2.submitted    =   true;
        }
         angular.forEach($scope.statusData.adjmntStatusSelected , function(item){
            if($scope.searchingstatus.indexOf(item.id) ==-1){
               $scope.searchingstatus.push(item.code);
            }        
        });

        //this is the location where selected hierarchy
        var storeIds                =   $scope.location.id;
        var store                   =   (storeIds) ? storeIds.join(): '';
        var orderNumber             =   (srchData.orderNumber) || '';
        var orderStatus             =   ($scope.searchingstatus) || '';
        var fromDate                =   (srchData.fromdate) ? $filter('dateFormChange')(srchData.fromdate) : '';
        var toDate                  =   (srchData.todate) ? $filter('dateFormChange')(srchData.todate) : '';
        var adjustment_name         =   (srchData.adjustment_name) || '';
        var adjustment_code         =   (srchData.adjustment_code) || '';
        var adjustment_Number       =   (srchData.adjustmentNum) || '';

        var sku_data    =   srchData.advSearchData.result?srchData.advSearchData.result.split('~'):'';
        var sku         =   sku_data?sku_data[0]:'';
        var asnNo       =   srchData.advSearchData.asnNo?srchData.advSearchData.asnNo:'';
        var frmQty      =   srchData.advSearchData.fromQtyRange?srchData.advSearchData.fromQtyRange:'';
        var toQty       =   srchData.advSearchData.toQtyRange?srchData.advSearchData.toQtyRange:'';
        var frmPrice    =   srchData.advSearchData.fromPriceRange?srchData.advSearchData.fromPriceRange:'';
        var toPrice     =   srchData.advSearchData.toPriceRange?srchData.advSearchData.toPriceRange:'';

		Data.get('/adjustment?fromdate=' + fromDate + '&todate=' + toDate + '&store=' + encodeURIComponent(store) + '&orderNumber=' + orderNumber + '&adjustmentName=' + adjustment_name + '&adjustmentCode=' + adjustment_code + '&page_offset=' + $scope.action2.offset + '&page_lmt=' + $scope.action2.entryLimit + '&adjustmentStatus=' + orderStatus +'&sku='+sku+'&asnNo='+asnNo+'&frmQty='+frmQty+'&toQty='+toQty+'&frmPrice='+frmPrice+'&toPrice='+toPrice + '&adjustmentNumber=' + adjustment_Number).then(function(data) {
			
            var adjust_arr   =   [];
            if(data.adjustment_data){
				angular.forEach(data.adjustment_data, function(adjustmentData) {
					
                    var createdDate             =   $filter('datetimeForm')(adjustmentData.created);
					
                    adjustmentData.ReasonCodeID   =   (adjustmentData.ReasonCodeID) ? $scope.searchParam.reasonCodeData[adjustmentData.ReasonCodeID]:'';
                    adjustmentData.currency       =   currencylabel[currencylist[adjustmentData.storeId]];
                    adjustmentData.storeId        =   (adjustmentData.storeId) ? $scope.allLocations[adjustmentData.storeId]:'';
                    adjustmentData.adjustmentCode =   (adjustmentData.adjustmentCode) ? $scope.adjustCodeList[adjustmentData.adjustmentCode]:''; 
                    adjustmentData.adjustmentName =   (adjustmentData.adjustmentName) ? ($scope.searchParam.tranTypeData[adjustmentData.adjustmentName]?$scope.searchParam.tranTypeData[adjustmentData.adjustmentName]:(adjustmentData.adjustmentName)):'';
                    adjustmentData.orderStatus    =   (adjustmentData.orderStatus) ? adjStatusList[adjustmentData.orderStatus]:'';
                    adjust_arr.push(adjustmentData);
                    
                });
				
                $scope.list                        =   adjust_arr;
				$scope.action2.totalItems           =   data.total_count;
				$scope.action2.products             =   false;
				
                if($scope.list.length == 0){
					$scope.action2.products         =   true;
				}
			}
		});
        
        if ((srchData.fromdate != undefined) && (srchData.todate != undefined) && (srchData.fromdate != '') && (srchData.todate != '') ) {
            if (fromDate <= toDate) {
                $scope.action2.fieldsrequired = false;
            } else {
                $scope.action2.fieldsrequired = true;
                return false;
            }
        }
    };

    /**sorting list**/
    $scope.reverse      =   ''; 
    $scope.predicate    =   '';
    
    $scope.sort_by = function(predicate) {
        $scope.predicate        =   predicate;
        $scope.reverse          =   !$scope.reverse;
    };

    $scope.fieldsrequired = false;

    $scope.change_todate = function() {
        $scope.fieldsrequired = false;
    };

    $scope.change_frdate = function() {
        $scope.fieldsrequired = false;
    };

    /** Reset Search Filters **/
    $scope.resetAdjustmentStatus = function() {
        delete sessionStorage.adjustmentSearchData;
        delete sessionStorage.adjustmentPageLimit;
        $scope.form    =   {};
        $scope.advSearch.advSearchData = {};
        $scope.locationDisplayName  =   '';
        $scope.location             =   {};
        $scope.statusData.adjmntStatusSelected  =   [];
        $scope.getLocation();
        // $scope.searchAdjustment();

        ovcdataExportFactory.resetPdfHeaderData(); //Export Reset
    };

    /**Page change function**/
    $scope.pageChanged  =   function(){
        $scope.action2.offset = ($scope.action2.currentPage - 1) * $scope.action2.entryLimit;
        $scope.searchAdjustment();
    };

    $scope.adjustmentCopy   =   function(copyId , copyNo){
        sessionStorage.copyadj  =   copyId;
        sessionStorage.copyAdjustNumber = copyNo;
        $state.go('ovc.adjustment-copy');
    }

    //$scope.searchAdjustment();
    $scope.getConfigurations();
    
	
});
