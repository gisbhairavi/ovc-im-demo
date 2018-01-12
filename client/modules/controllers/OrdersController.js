var app=angular.module('OVCstockApp',['ovcdataExport']);

app.controller('inTransitCtrl', function($rootScope, $scope, $state, $httpParamSerializerJQLike, $http, $timeout, $cookieStore, $filter, $stateParams, Data, ovcDash, AsnTableService, system_currencies,PACKAGESTATUS, ORDERTYPEDELIVERIES, ovcdataExportFactory, ADVANCESEARCHFIELDS, TreeViewService, Utils, advancedPrint, CONSTANTS_VAR) {
	$scope.store_datas    = [];
	$scope.purchaseOrders = [];
	$scope.asnNumbers   =  [];
	$scope.allSkus      =  [];
    $scope.location     =  {};
    $scope.error        =  {};
    $scope.page_action  =   {};
    $scope.page_action.offset   =   0;
    $scope.currentPage  =   1; //current page
    $scope.page_action.entryLimit   =  CONSTANTS_VAR.DELIVERIES_PAGE_LIMIT; //max no of items to display in a page  
	var user_detail = $rootScope.globals['currentUser'];
    var user_id = user_detail['username'];
    var SearchCount     =   0;
    $scope.asn_data_search = {};
    var currensymbs = $scope.ovcLabel.global.currency;
    var currcodes = system_currencies[0];
    $scope.currency = currensymbs[currcodes.code];

    var ordercodes = $scope.ovcLabel.deliveries.statusList;
    var cordercodes = PACKAGESTATUS;
    var ordertypelabel   =   $scope.ovcLabel.deliveries.ordertypedeliverieslist;
    var ordertypecodes   =   ORDERTYPEDELIVERIES;
    var pordercodes = [];
    var userStores = [];
    angular.forEach(cordercodes, function(item) {
       var purch = item.code;
       var porder = ordercodes[purch];
       item.id = purch;
       item.label = porder;
       item.selected=false;
       pordercodes.push(item);
    });

    var deliveryordertype = [];
    angular.forEach(ordertypecodes, function(item) {
       var purch = item.code;
       var porder = ordertypelabel[purch];
       item.id = purch;
       item.label = porder;
       item.selected=false;
       deliveryordertype.push(item);
    });

    $timeout(function(){
         angular.element('#asnNumberSearch').focus();
    },500);

    $scope.firstseasonitems= {};
    $scope.firstseasonitems = pordercodes;
    $scope.firstseasonselected = [];

    // For Deliveries ordertype
    $scope.delTypeData = deliveryordertype;
    $scope.delTypeDataSelected = [];
     // $scope.selectedpackageStatus = [];
    $scope.asnSearchData = {};
    $scope.currencylist = {};
    $scope.asnSearchData.status =[];
    $scope.Status="status";
    //$scope.asnSearchData.shiptostore =[];

    // angular.forEach($rootScope.POLIST, function(item){
    //     console.log(item,'ROOTSCOPEDATA***********************');
    //     if(item.elementid === "enableBlindReceiving" && item.elementdetail == 1) {
    //         $scope.is_blind_receive =   true;
    //         $scope.asn_receive      =   true; 
    //         return false;
    //     }   
    // });
    var Congiguration   =   Utils.configurations();
    Congiguration.then(function(configuration){
        if(configuration && configuration.config_arr && configuration.config_arr.enableBlindReceiving){
            $scope.is_blind_receive     =   configuration.config_arr.enableBlindReceiving.featureValue ? configuration.config_arr.enableBlindReceiving.featureValue : false;
            $scope.asn_receive          =   true; 
        }
    });

     /*For heirarical dropdown Filter*/
    $scope.searchLocation = function(location){
        $scope.action.filterLocation = location;
    }
    
    $scope.getLocation     =   function(callback){
        //For hierarchy locations list
        Utils.hierarchylocation().then(function(results){
            if(results){
                $scope.storeLocData =   TreeViewService.getLocData(results);  
                $scope.checkBoxSelect($scope.storeLocData[0]);
                $scope.addSelectedClass($scope.storeLocData[0]);
                angular.forEach(results.hierarchy, function(storedata){
                    userStores.push(storedata.id);
                    $scope.currencylist[storedata.id]    =   storedata.currency;
                });
            }
        },function(error){
            $scope.asnSearch(); 
        }).then(function(){
            callback();
        });
    }
    $scope.getLocation(function(){
        $scope.getStores(function(){
            $scope.asnSearch();
        });
    });

    $scope.searchOrderNumber = function (typedthings) {
        $scope.purchaseOrders = [];
        if (typedthings && typedthings != '') {
            Data.post('/orderNumbers',{data: { userStores: userStores, orderStatus: 'inProgress,received', key: typedthings}}).then(function(data) {
                if( data.status == 'success' && data.result != undefined){
                    var purchaseOrders = [];
                    angular.forEach(data.result,function(item) {
                        if((item.orderStatus != 'draft')&&(item.orderStatus != 'submitted')&&(item.orderStatus != 'confirmed')){
                            if (item.orderNumber) {
                                purchaseOrders.push(item.orderNumber);
                            }
                            else if (item.purchaseOrderNumber) {
                                purchaseOrders.push(item.purchaseOrderNumber);
                            }
                        }
                    });
                    $scope.purchaseOrders = purchaseOrders;
                }
            });
        }
    }

	$scope.getStores = function(callback) {

        if(sessionStorage.asn_details){
            // $scope.asnSearchData = {};
            $scope.firstseasonselected = [];
            var asnSearchData = JSON.parse(sessionStorage.asn_details);
            $scope.asnSearchData.status = asnSearchData.status;
              // var asn_details = {};
                            // asn_details.status = []; 
                    $scope.asnSearchData.selectedAsnId    =         asnSearchData.selectedAsnId; 
                    $scope.asnSearchData.selectedOrderId  =         asnSearchData.selectedOrderId; 
                    $scope.asnSearchData.fromdate         =         asnSearchData.fromdate ;
                    $scope.asnSearchData.todate           =         asnSearchData.todate;
                    $scope.asnSearchData.selectedSku      =         asnSearchData.selectedSku; 
                    $scope.asnSearchData.status           =         asnSearchData.status;
                    $scope.asnSearchData.order_type       =         asnSearchData.order_type;
                    // $scope.asnSearchData.shiptostore      =         asnSearchData.shiptostore;
                     angular.forEach($scope.firstseasonitems , function(item){
                         if( asnSearchData.status.indexOf(item.id) != -1){
                            item.selected = true;
                            $scope.firstseasonselected.push(item);
                        }
                    });
                    angular.forEach($scope.delTypeData , function(item){
                         if( asnSearchData.order_type.indexOf(item.id) != -1){
                            item.selected = true;
                            $scope.delTypeDataSelected.push(item);
                        }
                    });
                     
        } else{
             angular.forEach($scope.firstseasonitems , function(item){
                if(item.id == 'shipped' || item.id == 'receiveInProgress' ){
                    item.selected = true;
                    $scope.firstseasonselected.push(item);
                }
            });
        }
        callback();
    };

    $scope.asnSearchReset = function() {
        delete sessionStorage.inTransitSearchData;
        delete sessionStorage.asn_details;
        $scope.asnSearchData = {};
        $scope.advSearch.advSearchData   =   {};
        $rootScope.asn_details  =   [];
        $scope.firstseasonselected = [];
        $scope.delTypeDataSelected = [];
        $scope.asnSearchData.status = ['shipped', 'receiveInProgress'];
        $scope.location     =   {};
        $scope.getLocation(function(){
            $scope.getStores(function(){
                $scope.asnSearch();
            });
        });
        // $scope.asnSearch();
    }

    /*if($stateParams.fullList){
        delete sessionStorage.inTransitSearchData;
        delete sessionStorage.asn_details;
    }*/

    if(sessionStorage.inTransitSearchData){
        $scope.asnSearchData            =   sessionStorage.inTransitSearchData;
        var selectedStatuses            =   [];
        angular.forEach(PACKAGESTATUS, function(item){
            if($scope.asnSearchData.status.indexOf(item.id) > -1){
                item.selected    =   true;
                selectedStatuses.push(item);
            }
        });
        $scope.firstseasonselected    =   selectedStatuses;
    }

    $scope.advSearch   =   {};
    $scope.advSearch.advSrchFields = {};
    $scope.advSearch.advSearchData   =   {};
    $scope.advSearch.isAdvanceSearch = false;
    $scope.advanceSearch = function(){
        $scope.advsearch = !$scope.advsearch;
        if($scope.advSearch.isAdvanceSearch === undefined || $scope.advSearch.isAdvanceSearch === false){
            $scope.advSearch.isAdvanceSearch = true;
        }
        else if($scope.advSearch.isAdvanceSearch === true){
            $scope.advSearch.isAdvanceSearch = false
        }
    }
    $scope.storeselect=function(){
            angular.element('#asnNumberSearch').focus();
    }

    $scope.setAdvSearchField = function(){
        var advSearchFieldArr = ADVANCESEARCHFIELDS['deliveries'];
        var advSearchField = {};
        angular.forEach(advSearchFieldArr,function(itm){
            advSearchField[itm] = true;
        });
        $scope.advSearch.advSrchFields = advSearchField;
    }
    $scope.setAdvSearchField();

    $scope.asnSearch = function(){
        $timeout(function(){
         angular.element('#asnNumberSearch').focus();
         },500);
        $scope.asnSearchData.status     =   [];
        angular.forEach($scope.firstseasonselected , function(item){
            if($scope.asnSearchData.status.indexOf(item.id) == -1){
               $scope.asnSearchData.status.push(item.id);
            }        
        });

        sessionStorage.intransitPageLimit  =   $scope.page_action.entryLimit;
        $scope.asnSearchData.order_type     =   [];
        angular.forEach($scope.delTypeDataSelected , function(item){
            if($scope.asnSearchData.order_type.indexOf(item.id) == -1){
               $scope.asnSearchData.order_type.push(item.id);
            }        
        });

    	$scope.submitted    = true;
        $scope.asnSearchData.advSearchData = {};
        $scope.asnSearchData.advSearchData = $scope.advSearch.advSearchData;
        // sessionStorage.inTransitSearchData     =   JSON.stringify($scope.asnSearchData);
        var asnSearchData   =   $scope.asnSearchData; 
         

          
        
        if( asnSearchData != undefined){  
            var locationIdArray     = ($scope.location.id) ? $scope.location.id : [];
            var storeIds            =   locationIdArray.join();

            var fromDate = toDate = shiptostore = poIds = asnId = sku = '';

            if((asnSearchData.fromdate != undefined) && (asnSearchData.fromdate != '')) {
                fromDate = $filter('dateFormChange') (asnSearchData.fromdate);
            } 
            if ((asnSearchData.todate != undefined) && (asnSearchData.todate != '') ){
                toDate = $filter('dateFormChange') (asnSearchData.todate);
            } 
            if ((asnSearchData.fromdate != undefined) && (asnSearchData.todate != undefined) && (asnSearchData.fromdate != '') && (asnSearchData.todate != '') ) {
                if (fromDate <= toDate) {
                    $scope.fieldsrequired = false;
                } else {
                    $scope.fieldsrequired = true;
                    return false;
                }
            }
            if(asnSearchData.selectedOrderId != undefined && asnSearchData.selectedOrderId != ''){
                poIds = asnSearchData.selectedOrderId;
            }
            if(asnSearchData.selectedAsnId != undefined && asnSearchData.selectedAsnId != ''){
                asnId = asnSearchData.selectedAsnId;
            }
            if(asnSearchData.selectedSku != undefined && asnSearchData.selectedSku != ''){
                sku = asnSearchData.selectedSku;
            }

            // if(locationIdArray){
            //     shiptostore = asnSearchData.shiptostore;
            // }

            var frmQty      =   asnSearchData.advSearchData.fromQtyRange?asnSearchData.advSearchData.fromQtyRange:'';
            var toQty       =   asnSearchData.advSearchData.toQtyRange?asnSearchData.advSearchData.toQtyRange:'';
            var frmPrice    =   asnSearchData.advSearchData.fromPriceRange?asnSearchData.advSearchData.fromPriceRange:'';
            var toPrice     =   asnSearchData.advSearchData.toPriceRange?asnSearchData.advSearchData.toPriceRange:'';
            asnSearchData.locationTitle = $scope.location.title;
            
            /*************PDF Export******************/

            if(asnSearchData.locationTitle || asnSearchData.fromDate || asnSearchData.toDate || asnSearchData.advSearchData.result || asnSearchData.advSearchData.asnNo || asnSearchData.advSearchData.fromQtyRange || asnSearchData.advSearchData.toQtyRange || asnSearchData.advSearchData.fromPriceRange || asnSearchData.advSearchData.toPriceRange)
            advancedPrint.getAdvancedPrint(asnSearchData);

            /*var pdf_data = [];

            if($scope.location.title)
            {
                var obj =   {};
                obj.label   =   "Store";
                obj.value   =   $scope.location.title;
                pdf_data.push(obj);
            }

            if(asnSearchData.fromdate && asnSearchData.fromdate.length > 0 && asnSearchData.todate && asnSearchData.todate.length > 0)
            {
                var obj =   {};
                obj.label   =   "Date Range";
                obj.value   =   asnSearchData.fromdate +'-' + asnSearchData.todate;
                pdf_data.push(obj);
            }

            if(pdf_data.length > 0)
                ovcdataExportFactory.setPdfHeaderData(pdf_data);*/
            /*************PDF Export******************/
            if($scope.location.id  && poIds){
                var loc_poids = [];
                Data.get('/order?shiptolocation='+ encodeURIComponent(storeIds)).then(function(data) {
                    if( data != undefined && data.order_data != undefined){
                        angular.forEach(data.order_data,function(item) {
                            loc_poids.push(item.purchaseOrderNumber);
                        });
                    }
                    if(poIds == ''){
                        poIds = loc_poids.toString();
                    }
                }).then(function(e){
                    $scope.asnLocData(asnId,poIds,fromDate,toDate,sku,asnSearchData.status, frmQty, toQty, frmPrice, toPrice);
                });

            }else{
                $scope.asnLocData(asnId,poIds,fromDate,toDate,sku,asnSearchData.status, frmQty, toQty, frmPrice, toPrice);
            }
        }
    }

    $scope.asnLocData = function(asnId,poIds,fromDate,toDate,sku,selectedStatus, frmQty, toQty, frmPrice, toPrice) {
        // $.LoadingOverlay("show");
        $scope.error        =   {};
        var srchStatus      =   [];
        SearchCount++;
        var ordertype       =   [];
        if($scope.delTypeDataSelected.length > 0){
            angular.forEach($scope.delTypeDataSelected, function(item){
                 if(ordertype.indexOf(item.id) == -1){
                    ordertype.push(item.id);
                 }
            });
        }
        if(sessionStorage.asn_details){
            delete sessionStorage.asn_details; 
        }
      
        //Status Search Coditions//
        if(selectedStatus.length > 0){
            srchStatus  =   selectedStatus;
        } 
        if(selectedStatus.length == 0 && ($scope.asnSearchData.selectedAsnId || $scope.asnSearchData.selectedOrderId || $scope.asnSearchData.selectedSku) ){
            srchStatus[0]   =   'shippedReversed';
            angular.forEach(PACKAGESTATUS, function(item) {
                srchStatus.push(item.code);
            });
        }

        if(selectedStatus.indexOf('shipped') != -1){
            if(srchStatus.indexOf('shippedReversed') == -1){
                srchStatus.push('shippedReversed');
            }
        }

        if(selectedStatus.indexOf('shipped') == -1){
            var i = $scope.asnSearchData.status.indexOf('shippedReversed');
            if(i != -1) {
                selectedStatus.splice(i, 1);
            }
        }
        $scope.asn_data_search = $scope.asnSearchData;
        var locationIdArray     = ($scope.location.id) ? $scope.location.id : [];
        var storeIds            =   locationIdArray.join();
        // if(selectedStatus.length == 0 && (!$scope.asnSearchData.selectedAsnId && !$scope.asnSearchData.selectedOrderId && !$scope.asnSearchData.selectedSku)){
        //     srchStatus      =   ['shippedReversed','shipped'];
        // }
        selectedSrchStatus = srchStatus.toString();
        var ordertypearray  =   ordertype.join();
        var qryObj = {
            'status': selectedSrchStatus,
            'asnid':asnId,
            'poid':poIds,
            'fromdate':fromDate,
            'todate':toDate,
            'sku':sku,
            'frmQty':frmQty,
            'toQty':toQty,
            'frmPrice':frmPrice,
            'toPrice':toPrice,
            'locationId': storeIds,
            'orderType': ordertypearray,
            'page_offset' : $scope.page_action.offset,
            'page_lmt' : $scope.page_action.entryLimit
        }
        Data.get('/poasn?'+$httpParamSerializerJQLike(qryObj)).then(function(results) {
            $rootScope.asn_details = [];
            if(results && !results.error){
                // results     =   [];
                if(results.asnData){
                    var temp_obj = {  
                       "resolvebtn":false,
                       "showgroup":true,
                       "asns" : results.asnData,
                       "error":5,
                       "receivebtn":results.hasShippedPack

                    }
                    $rootScope.asn_details  =   temp_obj;
                    $scope.page_action.filteredItems = results.total_count ? results.total_count : 0;
                    if($rootScope.asn_details.length > 0){
                        $scope.asn_records  = true;
                    }
                }else{
                    if($scope.asnSearchData.selectedOrderId || $scope.asnSearchData.selectedAsnId || $scope.asnSearchData.selectedSku){
                        $scope.error.message       =   $scope.ovcLabel.deliveries.toast.no_result;
                        $scope.error.combination   =   true;
                    }else{
                        $scope.error.message       =   $scope.ovcLabel.deliveries.toast.no_records;
                        $scope.error.empty         =   true;
                    }
                    $scope.page_action.filteredItems = results.total_count ? results.total_count : 0;

                }  
            }else{
                var output = {"status": "error","message": $scope.ovcLabel.deliveries.toast.notFindPoasn };
                Data.toast(output);
            }  
            // $.LoadingOverlay("hide");      
        },function(error){
             // $.LoadingOverlay("hide");
            var output = {"status": "error","message": error };
            Data.toast(output);
        });
                   // $scope.asnSearchData.status
                  
        if(SearchCount == 1){
            $scope.asnSearchData.status = [];
        }
    };
    $scope.pageChanged  =   function(){
        $scope.page_action.offset = ($scope.page_action.currentPage - 1) * $scope.page_action.entryLimit;
        $scope.asnSearch();
    };
});
