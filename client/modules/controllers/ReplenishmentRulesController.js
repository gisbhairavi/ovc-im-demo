/* Replenishment Rules Controller */

var app     =   angular.module('OVCstockApp',['ovcdataExport','ui.bootstrap.treeview','angularFileUpload','skuMatrix']);

app.controller('replenishmentRulesCtrl', ['$scope', '$rootScope','Data','ovcDash', 'REPLENISHMENTRULESHEADER', '$timeout','$compile', '$state','$window', 'TreeViewService', 'Utils','ovcdataExportFactory', function($scope, $rootScope, Data, ovcDash, REPLENISHMENTRULESHEADER, $timeout, $compile, $state, $window, TreeViewService, Utils, ovcdataExportFactory){

    $scope.action                       =   {};
    $scope.data                         =   {};
    $scope.formData                     =   {};
    $scope.data.error                   =   {};
    $scope.drop_proper      =   {};
    var styledata           =   skudata  =  [];
    $scope.ship             =   {};
    var userId              =   $rootScope.globals['currentUser']['username'];
    var currencylabel   =   $scope.ovcLabel.global.currency;
    var currencylist    =   [];
    var locationList    =   [];
    var styleArr        =   [];
    var withRulesArr    =   [];
    var locRulesArr     =   [];
    var resultCount     =   0;
    $scope.action.type      =   'replenishmentRules';
    //For hide the Description and Productcode
    $scope.replinshmentStyleMatrix  =   true;
    
    $rootScope.$watch('ROLES',function(){
        $scope.vwpuprice =  false;
        $scope.action.rolePermission=$rootScope.ROLES;
    });
    $scope.action.getStores = function () {
        Utils.userLocation(1).then(function(results){
            $scope.data.store_datas     =   [];
            if(!results.status){
                $scope.data.store_datas =   results;
                if($scope.data.store_datas.length==1){
                    $scope.formData.locationId  =   results[0].id;
                }
                angular.forEach(results, function(item) {
                    currencylist[item.id]    =   item.currency;
                    locationList[item.id]    =   item.displayName;  
                });
            }
        }, function(error){
            console.log('User Location :' + error);
        });
        Utils.hierarchylocation().then(function(results){
            var locGroup    =   [];
            if(results && results.hierarchy){
                angular.forEach(results.hierarchy,function(storevalue){
                    if(storevalue.type != 'Store'){
                        if(locGroup.indexOf(storevalue.id) == -1)
                        locGroup.push(storevalue.id);
                    }
                });
                $scope.locGroup     =   locGroup;
            }

            if(results){
                $scope.storeLocData =   TreeViewService.getLocData(results);
                TreeViewService.toggleAll($scope.storeLocData[0]);
                
            }
           
        },function(error){
            console.log('Hierarchy Service Faild' + error);
        });
    };

    //check location error condition
    $scope.action.checklocation     =   function(){
        $timeout(function(){
            if($scope.ship.locationId){
                $scope.data.error.locationId    =   false;
            }
        }, 100);
    }
    
    //Hierarchy location Filter Function
    $scope.searchLocation = function(location){
        $scope.action.filterLocation    =   location;
        if(location){
            $scope.data.error.locationId    =   false;
        }else{
            $scope.ship.locationId          =   '';
        }
    };

    Utils.configurations().then( function ( config ) {
        if( config ){
            var config_data = config.action.stockPr;
            $scope.config_data  =  config_data;
            $scope.config   =   config;
            angular.forEach( styledata, function( item ) {
                if (!(config_data.hasOwnProperty(item.id))){ 
                    $scope.config_data[ item.id ]  =   true;
                }
            });
            
            angular.forEach( skudata, function( item )  {
                if (!(config_data.hasOwnProperty(item.id))){
                    $scope.config_data[ item.id ]   =   true;
                }
            });
            
            //Configration Property //
            var property    =   $scope.config.productProperty ? $scope.config.productProperty.join():null;
            $scope.propertyval = property;

            //Get Propert value Dynamic//
            ovcDash.get('apis/ang_config_properties?type='+'value'+'&propertyvalue='+property+'&variantstype=&productProperty=true&productAttribute=false').then(function (results) {
                 
                if(results != undefined && results != ''){
                    $scope.dropdownDashCall         =   results;
                }

            });
            if(sessionStorage.replenishmentReset){
                    var replenish   =   JSON.parse(sessionStorage.replenishmentReset);
                    $scope.locationDisplayName  =   replenish.displayName ? replenish.displayName : '';
                    $scope.ship.locationId      =   replenish.locationid ? replenish.locationid : '';
                    $scope.formData.skuresult   =   replenish.sku ? replenish.sku : '';
                    $scope.action.filterReplenishmentRules();
                }
        
        }
    });

    Utils.roles().then( function( permissions ) {
        $scope.action.permissionsData    =   permissions.permissionsData.replenishmentRules;
    });

    $scope.action.getStores();

    //For  RPL Location Group Level Popup // moved to RT-25
    $scope.corparateModelHistory   =   function(sku){
        $scope.ship.corparateSKU    =   sku;
        $scope.ship.showmodel       =   true;
    };

    $scope.corparateHistory        =   function(){
        $scope.ship.showmodel   =   false;
        $scope.ship.corparateHistory    =   true;
    }
    $scope.backButtoncorparate  =   function(){
        $scope.ship.corparateHistory    =   false;
        $scope.ship.showmodel           =   true;
    }

    /*****Select product using sku and name******/
    $scope.dosrchproduct = function(typedthings){
        var loc_id  =   $scope.ship.locationId;
        $scope.action.paginationDefault     =   true;

        if(typedthings != '...' &&  typedthings != '' && typedthings != undefined && loc_id != undefined){
            ovcDash.get('apis/ang_search_products?srch='+typedthings+'&locid='+encodeURIComponent(loc_id)).then(function (data) {
                    
                if(data.status != 'error'){
                        var rows = [];
                        var allvals = [];
                        var styleData = [];
                        var groupData = [];
                    
                        angular.forEach(data, function(item) {
                               if (item.ProductTbl.mmGroupId && groupData.indexOf(item.ProductTbl.mmGroupId) == -1) {
                                var value = item.ProductTbl.mmGroupName;
                                rows.push({
                                    value: value,
                                    labelclass: 'search_products_group',
                                    labeldata:'Merchandise Group'
                                });
                                groupData.push(item.ProductTbl.mmGroupId);
                            } 
                            if ($scope.config.showskugroup && styleData.indexOf(item.ProductTbl.productCode) == -1) {
                                var value = item.ProductTbl.productCode + '~' + item.ProductTbl.styleDescription;
                                rows.push({
                                    value: value,
                                    labelclass:"search_products_style",
                                    labeldata: 'Style'
                                });
                                styleData.push(item.ProductTbl.productCode);
                            } 
                            if (styleData.indexOf(item.ProductTbl.barCode) == -1) {
                                var value = item.ProductTbl.sku  + '~' + item.ProductTbl.name + '~' +item.ProductTbl.barCode;
                                rows.push({
                                    value: value,
                                    labelclass:"search_products_barcode",
                                    labeldata: 'Barcode'
                                });
                                styleData.push(item.ProductTbl.productCode);
                            } 
                                var value = item.ProductTbl.sku + '~' + item.ProductTbl.name + '~' + item.ProductTbl.barCode
                                rows.push({
                                    value: value,
                                    labelclass:"search_products_sku",
                                    labeldata: 'SKU'
                                });
                           
                            allvals.push(item.ProductTbl);
                        });
                    $scope.formData.productsku      =   rows;   
                }   
            });
        }else{
            $scope.formData.selectedSku =   '';
        }
    };

    $scope.doSelectproduct = function(suggestion){
        var sku_select              =   suggestion.split('~');
        $scope.formData.selectedSku     =   sku_select[0];
        $scope.formData.styleresult     =   '';
    };

    // roleConfigService.getConfigurations (function(configData){
    //     $scope.config    =   configData;
    // });

    $scope.action.resetRplFilter        =   function(){
        var replenish = {locationid:$scope.ship.locationId , displayName : $scope.locationDisplayName, sku :$scope.formData.skuresult};
        sessionStorage.setItem('replenishmentReset', JSON.stringify(replenish));
        $scope.formData                 =   {};
        $scope.data.skuData             =   [];
        $state.reload();
    };

    //For Pagination
    $scope.action.currentPage   =   1;
    $scope.action.entryLimit    =   10;

    $scope.action.filterReplenishmentRules      =   function(){
        $scope.showDetails  =   {};

        var shipToStore                         =    $scope.ship.locationId  || '';
        
        $scope.data.srchConditions              =   {};
        $scope.data.error.locationId            =   false;
        
        if($scope.ship.locationId){
            $scope.data.srchConditions.locationId   =   $scope.ship.locationId;
        }else{
            $scope.data.error.locationId            =   true;
            return false;
        }

        if($scope.formData.minReorder){
            $scope.data.srchConditions.minReorder   =   $scope.formData.minReorder;
        }

        if($scope.formData.maxReorder){
            $scope.data.srchConditions.maxReorder   =   $scope.formData.maxReorder;
        }

        var dropData        =   $scope.drop_proper;
        var datasrchsku     =   '';

        if(sessionStorage.replenishmentReset)
            delete sessionStorage.replenishmentReset;

        // For Replenishment Config
        $scope.data.srchConditions.withReplenishment       =   $scope.formData.withReplenish;
        $scope.data.srchConditions.withoutReplenishment    =   $scope.formData.withoutReplenish;

       //Get Values From the Properties value //
        var selectedArray     =   [];
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

        //Reset to default Btn Condition 
        if($scope.ship.locationId && $scope.locGroup.indexOf($scope.ship.locationId) == -1){
            $scope.ship.resetDefault    =   true;
        }
        var configvalue  =  $scope.config.showskugroup ? "style" : "sku";
        $scope.header    =  $scope.propertyval ? $scope.propertyval.split(',') : [];
        var tempHeader   =  $scope.config.showskugroup ? ['Style','description'] : ['SKU','description'];
        $scope.header    =  _.concat(tempHeader, $scope.header);

        if($scope.formData.skuresult){
            $scope.selected_sku =   $scope.formData.skuresult.split('~')[0]; 
            var searchResult    =   $scope.formData.skuresult.split('~');
            if(searchResult != undefined){
                var datasrchsku     =   searchResult.length==3?true:'';
                if(datasrchsku){
                    $scope.action.hidePagination    =   false;
                }
                else{
                    $scope.action.hidePagination    =   true;
                }
            }
            $scope.skuValues='';
            $scope.noSkuValues  =   '';
            $scope.action.searchProducts(selectedArray,datasrchsku,shipToStore,configvalue);
        } 
        else{
            var datasrchsku=false;
            $scope.data.srchConditions.isRules = true;
            $scope.action.hidePagination    =   true;
            $scope.selected_sku =   '';

            $scope.skuValues='';
            $scope.noSkuValues  =   '';

            if($scope.data.srchConditions.minReorder || $scope.data.srchConditions.maxReorder ||
                ($scope.formData.withReplenish && !$scope.formData.withoutReplenish) || (!$scope.formData.withReplenish && $scope.formData.withoutReplenish)) {
                Data.get('/getReplenishmentRulesSku?srchData='+JSON.stringify($scope.data.srchConditions)).then(function (resultsData) {
                    if(resultsData.length > 0){
                        var skuArray        =   [];
                        angular.forEach(resultsData, function(ruleItem, index){
                            var sku_obj_key     =   ruleItem.sku.trim();
                            if(skuArray.indexOf(sku_obj_key) == -1)
                                skuArray.push(sku_obj_key);
                        });
                        if (!$scope.formData.withReplenish && $scope.formData.withoutReplenish)
                            $scope.noSkuValues = skuArray.join(',');
                        else 
                            $scope.skuValues = skuArray.join(',');
                        $scope.action.searchProducts(selectedArray,datasrchsku,shipToStore,configvalue);
                    }
                });
            }
            else{
                $scope.skuValues='';
                $scope.action.searchProducts(selectedArray,datasrchsku,shipToStore,configvalue);
            }
        }

    };
    $scope.action.searchProducts    =   function(selectedArray,datasrchsku,shipToStore,configvalue){
        var datasrch={
            srch:$scope.selected_sku,
            skuValues:$scope.skuValues,
            noSkuValues: $scope.noSkuValues,
            properties:selectedArray.join(),
            locationId:shipToStore,
            config:configvalue,
            propertyName:$scope.propertyval,
            isRules: true,
            limit:$scope.action.entryLimit
        }
        if ($scope.selected_sku && $scope.selected_sku != '') {
            datasrch.sku  =   datasrchsku;
        }

        if($scope.action.paginationDefault){
            datasrch['page']    =  $scope.action.currentPage    =   1;
        }
        else{
            datasrch['page']    =   $scope.action.currentPage;
        }

        $scope.currency     =   currencylabel[currencylist[shipToStore]];
    
        ovcDash.post('apis/ang_stocklookup_service',{data:datasrch}).then(function (ReportData) {
            
            if(ReportData.status == "error"){
                var output = {
                    "status": "error",
                    "message": $scope.ovcLabel.replenishmentRules.toast.noSku
                };
                Data.toast(output);
                $scope.data.error.resultError           =   $scope.ovcLabel.replenishmentRules.toast.noResult;
                $scope.styleArray = [];
                $scope.data.skuData = [];
            }
            else{
                var performancelist = [];
                // $scope.styleArray = ReportData.products;
                styleArr    =   ReportData.products;

                angular.forEach(ReportData.products, function(value,key){

                    if(value.allSkus){
                        var skuArr = [];
                        angular.forEach(value.allSkus, function(obj){
                            var itmSku  =   Object.keys(obj)[0];
                            skuArr.push(itmSku);
                            performancelist.push(itmSku);
                        });
                        value.skuArr    =   skuArr;
                        // performancelist.push(value.allSkus)
                    }else{
                        performancelist.push(value.SKU);
                    } 

                });
                $scope.data.srchConditions.allSkus = performancelist;

                $scope.data.srchConditions.sku = performancelist.toString();
                resultCount                    = ReportData.TotalCount;
                $scope.action.getAllReplenishmentRulesSku();
            }
        },function(error){
            console.log(error,'ERROR');
        });
  
    }

    $scope.action.showContent   =   function($fileContent){
        //For Dropdown close 
        $(".custom-remove-open").removeClass("open");

        $scope.data.replenishmentRulesCSV    =   $scope.action.processData($fileContent);
        $scope.action.uploadFile();
            
    };
    //Start Updated By Ratheesh. 12.6.2017
    $scope.action.processData = function(allText) {
        // split content based on new line
        var allTextLines = allText.split(/\r\n|\n/);
        var headers = REPLENISHMENTRULESHEADER;
        var lines = [];
        var error = "";
        function checkSKUValue(SKU) {
            SKU[3]?angular.noop():SKU[3]=SKU[2];
           return SKU[2]> 0&&(SKU[3]> 0)&&SKU[4]> 0? true:false;
        }
        for (var SKU = 0; SKU < allTextLines.length; SKU++) {
            // split content based on comma
            var data = allTextLines[SKU].split(',');
            if (data.length == headers.length) {
                var tarr = [];
                checkSKUValue(data)? tarr=data:error += 'ERROR: Values should be > 0 at Line '+(SKU+1)+'<br clear="all">';
                lines.push(tarr);
            } else {
                error += 'ERROR: Header Length at Line '+(SKU+1);
                error += '<br clear="all">';
            }
        }
        if (error) {
            var output = {
                "status": "error",
                "message": error
            };
            Data.toast(output);
        }
        return lines;
    };
    // Stop.
    
    $scope.action.uploadFile    =   function(){
        var finalCSV    =   [];
        var userId      =   $rootScope.globals.currentUser.username;
        Utils.hierarchylocation().then(function(results){
            if (results.hierarchy) {
                var accessibleLocations =   [];
                Object.keys(results.hierarchy).forEach(function(n) {
                    accessibleLocations.push(results.hierarchy[n].id);
                });

                angular.forEach($scope.data.replenishmentRulesCSV, function (csvData) {
                    var csvObject   =   {};
                    angular.forEach(REPLENISHMENTRULESHEADER, function (headerValue,key) {
                        csvObject[headerValue]   =   csvData[key];
                    });
                    if (accessibleLocations.indexOf(csvObject.locationId) >= 0) {
                        finalCSV.push(csvObject);
                    }
                    
                });
                if(finalCSV.length > 0){
                    Data.post('/replenishmentRulesUpload', {
                        data: {replenishmentRulesData:JSON.stringify(finalCSV) }
                    }).then(function(results) {
                       if(results.success){
                            var output = {
                                "status"    :   "success",
                                "message"   :   $scope.ovcLabel.replenishmentRules.toast.fileUploadSuccess
                            };                            
                        }else{
                            var output = {
                                "status"    :   "error",
                                "message"   :   $scope.ovcLabel.replenishmentRules.toast.ErrorFileUpload
                            };
                        }
                        Data.toast(output);
                    });
                }else{
                    var output = {
                        "status"    :   "error",
                        "message"   :   $scope.ovcLabel.replenishmentRules.toast.noUserAccess
                    };
                    Data.toast(output);
                }
            }
        });
        
    };


    /* Replenishment Rules Update */

    $scope.action.setDefaultReorder =   function(style){
       if($scope.data.skuData[style].setDefaultReorder){
           $scope.data.skuData[style].DefaultReOrder     =   $scope.data.skuData[style].DefaultReOrder ? $scope.data.skuData[style].DefaultReOrder:0;
           angular.forEach($scope.data.skuData[style].sku, function(skuDetails, index){
               $scope.data.rulesData[skuDetails.sku].reorder   =   $scope.data.skuData[style].DefaultReOrder;
           });
       }
       
    };

    $scope.action.getAllReplenishmentRulesSku   =   function(){
        $scope.data.rulesData                   =   {};
        $scope.action.rulesValues               =   {};
        $scope.data.skuData                     =   []; 
        var locationId     =  $scope.data.srchConditions.locationId;
        $scope.data.srchConditions.isRules = true;
        
        var withReplenishment = $scope.formData.withReplenish;
        var withoutReplenishment = $scope.formData.withoutReplenish;
        var srch    =   $scope.data.srchConditions.allSkus;

        Data.get('/getReplenishmentRulesSku?srchData='+JSON.stringify($scope.data.srchConditions)).then(function (resultsData) {
            var skuArray    =   [];
            locRulesArr     =   [];
            if (resultsData.length === 0 && ($scope.selected_sku && $scope.selected_sku != '') && (withReplenishment && !withoutReplenishment)) {
                $scope.styleArray  =   [];
                var output = {
                    "status": "error",
                    "message": $scope.ovcLabel.replenishmentRules.toast.noSku
                };
                Data.toast(output);
                $scope.data.error.resultError           =   $scope.ovcLabel.replenishmentRules.noResult;
            }
            else {
                if(resultsData.length > 0){
                    var newResultData   =   {};
                    angular.forEach(resultsData, function(ruleItem, index){
                        var sku_obj_key     =   ruleItem.sku.trim();
                        if(skuArray.indexOf(sku_obj_key) == -1)
                            skuArray.push(sku_obj_key);
                        if( ! newResultData[sku_obj_key]){
                            newResultData[sku_obj_key] =   {};
                        }

                        newResultData[sku_obj_key]['locationId']               =   ruleItem.locationId;
                        newResultData[sku_obj_key]['sku']                      =   ruleItem.sku;
                        newResultData[sku_obj_key]['maxOrder']                 =   ruleItem.maxOrder;
                        newResultData[sku_obj_key]['minOrder']                 =   ruleItem.minOrder;
                        newResultData[sku_obj_key]['orderQuantityRounding']    =   ruleItem.orderQuantityRounding;
                        newResultData[sku_obj_key]['reorder']                  =   ruleItem.reorder;
                        newResultData[sku_obj_key]['roundingValue']            =   ruleItem.roundingValue;

                        if (ruleItem.locationId === $scope.data.srchConditions.locationId) {
                            locRulesArr.push(ruleItem.sku);
                        }
                        
                        withRulesArr.push(ruleItem.sku);

                    });
                    $scope.data.rulesData       =   newResultData;
                    angular.copy(newResultData,$scope.action.rulesValues);
                }

                var postDatas   =   {
                    srch    :   srch.join(','),
                    locid   :   locationId,
                    isRules :   true
                }

                ovcDash.post('apis/ang_loc_skuproducts',{data:postDatas}).then(function(results) {
                    if(results.status == 'error'){
                        $scope.data.error.resultError           =   'No Results Found';
                        return false;
                    }
                    if(results.length > 0){

                        $scope.data.error.resultError   =   '';

                        var skuData     =   {};
                        var showStyle   =   true;
                        var withStylArr =   [];
                        var locStylArr =   [];

                        $scope.styleArray  =   [];
                        angular.forEach(results, function(skuItem, index){

                            if (withRulesArr.indexOf(skuItem['ProductTbl']['sku']) > -1) {

                                withStylArr.indexOf(skuItem['ProductTbl']['productCode']) == -1 ? 
                                    withStylArr.push(skuItem['ProductTbl']['productCode']) : 
                                    '';

                            }

                            if (locRulesArr.indexOf(skuItem['ProductTbl']['sku']) > -1) {

                                locStylArr.indexOf(skuItem['ProductTbl']['productCode']) == -1 ? 
                                    locStylArr.push(skuItem['ProductTbl']['productCode']) : 
                                    '';

                            }

                            if( ! skuData[skuItem['ProductTbl']['productCode']]){
                                skuData[skuItem['ProductTbl']['productCode']]                       =   {};
                                skuData[skuItem['ProductTbl']['productCode']]['image']              =   skuItem['ProductTbl']['mainImageId'] || 'http://dummyimage.com/144x285/';
                                skuData[skuItem['ProductTbl']['productCode']]['styleDescription']   =   skuItem['ProductTbl']['styleDescription'];
                                skuData[skuItem['ProductTbl']['productCode']]['color']              =   skuItem['ProductTbl']['color'];
                                skuData[skuItem['ProductTbl']['productCode']]['DefaultReOrder']     =   0;
                                skuData[skuItem['ProductTbl']['productCode']]['showStyle']          =   showStyle;
                                skuData[skuItem['ProductTbl']['productCode']]['sku']                =   [];
                                if($scope.data.rulesData[skuItem['ProductTbl']['sku']]){
                                   skuData[skuItem['ProductTbl']['productCode']]['locationId'] = $scope.data.rulesData[skuItem['ProductTbl']['sku']]['locationId'];
                                   skuData[skuItem['ProductTbl']['productCode']]['maxOrder']   = $scope.data.rulesData[skuItem['ProductTbl']['sku']]['maxOrder'];
                                }
                                else{
                                   skuData[skuItem['ProductTbl']['productCode']]['locationId'] = $scope.ship.locationId;
                                   skuData[skuItem['ProductTbl']['productCode']]['maxOrder']   = '';
                                }
                            }
                            if(!$scope.config.showskugroup || $scope.data.rulesData[skuItem['ProductTbl']['sku']]){
                                var skuObj  =   {};
                                var tempSku = skuItem['ProductTbl']['sku'];
                                skuObj['sku']                        =   tempSku;
                                skuObj['price']                      =   {};
                                skuObj['price']['purchasePrice']     =   parseFloat(skuItem['ProductTbl']['Cost']).toFixed(2);
                                skuObj['price']['retailPrice']       =   parseFloat(skuItem['ProductTbl']['retailPrice']).toFixed(2);
                                skuObj['price']['storePrice']        =   parseFloat(skuItem['ProductTbl']['storePrice']).toFixed(2);
                                var margin                           =   eval(((skuItem['ProductTbl']['retailPrice'] - skuItem['ProductTbl']['purchasePrice'])* 100)/skuItem['ProductTbl']['retailPrice']).toFixed(2);
                                skuObj['price']['margin']            =   (skuItem['ProductTbl']['retailPrice'] != 0) ? (margin + ' ' +  ' %') : (0 + ' '+'%'); 
                                skuObj['description']                =   skuItem['ProductTbl']['description'];
                                // skuObj['size']                       =   skuItem['ProductTbl']['size'];
                                // skuObj['length']                     =   skuItem['ProductTbl']['length'];
                                // skuObj['waist']                      =   skuItem['ProductTbl']['waist'];
                                skuObj['variants']                      =   skuItem['ProductTbl']['variants'];

                                skuObj['replenishable']              =   skuItem['ProductTbl']['replenishable'];

                                if ((withoutReplenishment && withReplenishment) || (!withoutReplenishment && !withReplenishment)) {
                                    skuObj['showSKU']   =   true;
                                }

                                else {

                                    if (withoutReplenishment) {
                                        if (withRulesArr.indexOf(tempSku) == -1) {
                                            skuObj['showSKU']   =   true;
                                        }
                                    }
                                    if (withReplenishment) {
                                        if (withRulesArr.indexOf(tempSku) > -1) {
                                            skuObj['showSKU']   =   true;
                                        }
                                    }

                                }

                                if($scope.data.rulesData[tempSku]){
                                    skuObj['history']  =   false;
                                }
                                else{
                                    skuObj['history']  =   true;
                                }
                                if(withRulesArr.indexOf(tempSku) > -1 && locRulesArr.indexOf(tempSku) > -1){
                                    skuObj.showReset = true;
                                }
                                //skuObj['reorder']       =   $scope.data.rulesData[skuItem['ProductTbl']['sku']]['reorder'];
                                skuData[skuItem['ProductTbl']['productCode']]['sku'].push(skuObj);
                            }
                        });

                        angular.forEach(styleArr, function(stylItm){

                            if ((withoutReplenishment && withReplenishment) || (!withoutReplenishment && !withReplenishment)) {
                                stylItm.showStyle   =   true;
                            }

                            else {

                                if (withoutReplenishment) {
                                    if (withStylArr.indexOf(stylItm.Style) == -1) {
                                        stylItm.showStyle   =   true;
                                    }
                                }
                                if (withReplenishment) {
                                    if (withStylArr.indexOf(stylItm.Style) > -1) {
                                        stylItm.showStyle   =   true;
                                    }
                                }

                            }

                            if ((withStylArr.indexOf(stylItm.Style) > -1) && (locStylArr.indexOf(stylItm.Style) > -1)) {
                                stylItm.showReset   =   true;
                            }

                        });

                        withRulesArr = [];
                        locStylArr  =   [];
                        $scope.action.filteredItems  =   resultCount;
                        $scope.styleArray = styleArr;
                        $scope.data.skuData         =   skuData;

                    }
                });
            }
        });


    };

    $scope.action.getStyleMatrix    =   function(styleId){
        var reorderValues = [];
        var locationId  =   $scope.data.skuData[styleId]['locationId'];

        $scope.data.styleMatrix             =   {};
        $scope.data.styleMatrix.styleId     =   styleId;
        $scope.data.styleMatrix.locationId  =   locationId;

        $scope.data.setDefaultReorderStyleMtrixChkbx    =   false;
        $scope.data.setDefaultReorderStyleMtrix         =   0;
        angular.forEach($scope.data.rulesData,function(value,sku){
                reorderValues.push({'skukey':sku, 'reordervalue':value.reorder});
        });
        $scope.reorderItems = reorderValues;
        var skuItems                =   {};
        skuItems['locationId']      =   locationId;
        skuItems['styleresult']     =   styleId;
        if($scope.action.rolePermission.replenishmentRules.changeReplenishmentRules){
            skuItems['mode']            =   'edit';
        }
        else{
            skuItems['mode']            =   'readOnly';
        }
        $scope.styleitems           =   skuItems;

        $timeout(function() {
            angular.element(document.getElementById('stlkpmatrix'+styleId)).html($compile('<style-matrix></style-matrix>')($scope));
            $scope.data.showStryleMatrix    =   true;
        });
    };
    $scope.getmodifiedsku   =   function(styleMatrixSkus, noreorder){
        var locationId      =   $scope.data.styleMatrix.locationId; 
        var skuArray        =   Object.keys(styleMatrixSkus);
        if(skuArray.length > 0){
            ovcDash.get('apis/ang_loc_skuproducts?srch=' + skuArray.join(',') + '&locid=' + encodeURIComponent(locationId)  + '&isRules=true').then(function(results) {
                if(results.length > 0){
                    var skuData =   {};
                    angular.forEach(results, function(skuItem, index){
                        // Check wheather the sku has data already. if yes means just update the Reorder Point
                        if (Object.keys($scope.data.rulesData).indexOf(skuItem['ProductTbl']['sku']) < 0) {
                            var skuObj              =   {};
                            skuObj['sku']           =   skuItem['ProductTbl']['sku'];
                            skuObj['description']   =   skuItem['ProductTbl']['description'];
                            skuObj['price']  =   {};
                            skuObj['price']['purchasePrice']     =   parseFloat(skuItem['ProductTbl']['Cost']).toFixed(2);
                            skuObj['price']['retailPrice']       =   parseFloat(skuItem['ProductTbl']['retailPrice']).toFixed(2);
                            skuObj['price']['storePrice']        =   parseFloat(skuItem['ProductTbl']['storePrice']).toFixed(2);
                            var margin                           =  eval(((skuItem['ProductTbl']['retailPrice'] - skuItem['ProductTbl']['purchasePrice'])* 100)/skuItem['ProductTbl']['retailPrice']).toFixed(2);
                            skuObj['price']['margin']  =   (skuItem['ProductTbl']['retailPrice'] != 0) ? (margin + ' ' +  ' %') : (0 + ' '+'%');  
                            // skuObj['size']          =   skuItem['ProductTbl']['size'];
                            // skuObj['length']        =   skuItem['ProductTbl']['length'];
                            // skuObj['waist']         =   skuItem['ProductTbl']['waist'];
                            skuObj['variants']         =   skuItem['ProductTbl']['variants'];
                            skuObj['history']       =   true;
                            skuObj['replenishable'] =   skuItem['ProductTbl']['replenishable'];
                            
                            $scope.data.skuData[skuItem['ProductTbl']['productCode']]['sku'].push(skuObj);

                            var rulesData           =   {};
                
                            rulesData['locationId'] =   locationId;
                            rulesData['maxOrder']   =   $scope.data.skuData[skuItem['ProductTbl']['productCode']]['maxOrder'];
                            rulesData['minOrder']   =   1;
                            rulesData['reorder']    =   styleMatrixSkus[skuItem['ProductTbl']['sku']];
                            rulesData['sku']        =   skuItem['ProductTbl']['sku'];
                            
                            $scope.data.rulesData[skuItem['ProductTbl']['sku']] = rulesData;
                        }else{
                            $scope.data.rulesData[skuItem['ProductTbl']['sku']]['reorder'] = noreorder ? $scope.data.rulesData[skuItem['ProductTbl']['sku']]['reorder'] : styleMatrixSkus[skuItem['ProductTbl']['sku']];
                        }
                    });
                    $scope.action.closeStyleMatrix();
                }
            });
        }
    };

    $scope.updateRulesSku   =   function(sku){
        if(Object.keys($scope.action.rulesValues).indexOf(sku) < 0) {
            $scope.data.rulesData[sku]['locationId'] =   $scope.ship.locationId;
            $scope.data.rulesData[sku]['minOrder']   =   1;
            $scope.data.rulesData[sku]['sku']        =   sku;
        }   
    };

    $scope.action.closeStyleMatrix      =   function(){
        $scope.data.showStryleMatrix    =   false;
    };

    $scope.action.checkconfirm      =   function(){
        if(!$scope.ship.locationId){
                $scope.data.error.locationId    =   true;
                return false;
        }else{
            $.confirm({
                title: $scope.ovcLabel.replenishmentRules.storeResetHeader || 'Replenishment Reset Default',
                content: $scope.ovcLabel.replenishmentRules.storeResetContent || 'You are about to reset replenishment rules back to default for the entire location. Please confirm.',
                confirmButtonClass: 'btn-primary',
                cancelButtonClass: 'btn-primary',
                confirmButton: 'Ok',
                cancelButton: 'Cancel',
                confirm: function () {
                        Data.post('/replenishmentRulesReset',{data: {locationId:$scope.ship.locationId,action:'storeReset'}}).then(function(result){
                            if(result && result.status == 'success'){
                                 var output = {
                                    "status"    :   "success",
                                    "message"   :   $scope.ovcLabel.replenishmentRules.toast.rplResetSuccess
                                };
                                $scope.action.resetRplFilter();
                            }else{
                                  var output = {
                                    "status"    :   "error",
                                    "message"   :   $scope.ovcLabel.replenishmentRules.toast.resetPblm
                                };
                            }
                            Data.toast(output);
                        });
                },
                cancel: function () {
                        return false;
                }
            });
        }
    }

    /* Save Updated Replenishment Rules */

    $scope.action.saveUpdatedRules  =   function(actionData){
       var resultsData              =    [];
       var matchReorderPointToMaximumOrderAmount    =   false;

        angular.forEach($rootScope.POLIST,function(configList){
            if(configList['elementid'] == 'matchReorderPointToMaximumOrderAmount'){
                if(configList['elementdetail'] == 1){
                    matchReorderPointToMaximumOrderAmount    =   true;
                }
            }
        });
        if (actionData === "productReset") {
            var resetSkuArr =   [];
            var resetValidation =   false
            if(!$scope.config.showskugroup){
                angular.forEach($scope.data.skuData, function(value){
                    
                    if(value.sku[0].toReset && value.sku[0].toReset === true){
                        resetValidation =   true;
                        if(resetSkuArr.indexOf(value.sku[0].sku) === -1){
                            resetSkuArr.push(value.sku[0].sku);
                        }
                    }
                });
            }
            if($scope.config.showskugroup){
                angular.forEach($scope.styleArray,function(data){
                    if (data.toRest && data.toRest === true) {
                        resetValidation =   true
                        resetSkuArr =   resetSkuArr.concat(data.skuArr);
                    }
                });
            }
            if (resetValidation) {
                $.confirm({
                    title: $scope.ovcLabel.replenishmentRules.resetHeader || 'Reset Replenishment rules',
                    content: $scope.ovcLabel.replenishmentRules.resetSelectedContent || 'Confirm to reset Replenishment rules for the selected Styles/SKUs?',
                    confirmButtonClass: 'btn-primary',
                    cancelButtonClass: 'btn-primary',
                    confirmButton: 'Ok',
                    cancelButton: 'Cancel',
                    confirm: function () {
                        Data.post('/replenishmentRulesReset', {
                            data: {skuData:resetSkuArr.join(),locationId:$scope.ship.locationId,action:actionData}
                        }).then(function(results) {
                            if (results.status === "success") {
                                var output = {
                                    "status"    :   "success",
                                    "message"   :   $scope.ovcLabel.replenishmentRules.toast.resetSuccess
                                };                            
                            } else {
                                var output = {
                                    "status"    :   "error",
                                    "message"   :   $scope.ovcLabel.replenishmentRules.toast.resetFailed
                                };
                            }
                            Data.toast(output);
                            $scope.action.filterReplenishmentRules();
                        });
                    },
                    cancel: function () {
                        return false;
                    }
                
                });
                        
            }
            else {
                var output = {
                    "status"    :   "error",
                    "message"   :   $scope.ovcLabel.replenishmentRules.toast.selectStyle
                };
                Data.toast(output);
            }
        }
        else{
            angular.forEach($scope.data.rulesData,function(data){
                if(matchReorderPointToMaximumOrderAmount){
                    data['maxOrder']    =   data['reorder'];
                }
                resultsData.push(data);
            });

           if(resultsData.length > 0) {
                Data.post('/replenishmentRulesUpload', {
                data: {replenishmentRulesData:JSON.stringify(resultsData),locationId:$scope.ship.locationId,action:actionData}
                }).then(function(results) {
                    if(results.success){
                        var output = {
                            "status"    :   "success",
                            "message"   :   $scope.ovcLabel.replenishmentRules.toast.fileUploadSuccess
                        };                            
                    }else{
                        var output = {
                            "status"    :   "error",
                            "message"   :   $scope.ovcLabel.replenishmentRules.toast.ErrorFileUpload
                        };
                    }
                    Data.toast(output);
                    $scope.action.filterReplenishmentRules();
                });
           }
           else{
                var output = {
                    "status"    :   "error",
                    "message"   :   $scope.ovcLabel.replenishmentRules.toast.noRules
                };
                Data.toast(output);
           }
       }

    };

    $scope.action.replenishmentCancel    =   function(){
        $state.reload(); 
        $window.scrollTo(0, 0);  
    };

    $scope.isEmpty = function(obj) {
        var skuscount   =   0;
        angular.forEach(obj, function(values,key){
            angular.forEach(values.sku, function(value){
                    skuscount++;
            });
        });

        if(skuscount >0){
            return false;
        }


      return true;
    };
    // $scope.showDetails  =   {};
    $scope.callstyle    =   function(values){

        if( ! values.hasStyleData)
        {
            var styleData   =   values.Style;
            $scope.showDetails[styleData]   =   !$scope.showDetails[styleData]; 
            if($scope.showDetails[styleData]){
               $scope.action.getStyleMatrix(styleData);

               values.hasStyleData  =   true;
            }
        }

        values.showDetails  =   ! values.showDetails;
    };

    // Reset Search Filters
    $scope.action.resetRplFilter = function() {
        $scope.data.skuData           = [];
        $scope.locationDisplayName    = '';
        $scope.searchParam            = '';
        $scope.formData               = {};
        $scope.ship.locationId        = '';
        $scope.data.error.resultError = '';
        };
    
    //For History View (Replinshment Rules)
    $scope.history  =   function(sku,location){
        $scope.showError           =   false;
        var serviceData            =   {};
        serviceData.locationId     =   location;
        serviceData.sku            =   sku;
        serviceData.isHistory      =   true;


        Data.get('/getReplenishmentRulesSku?srchData='+JSON.stringify(serviceData)).then(function (resultsData) {
            if(resultsData && resultsData[0].rulesHistory){
                $scope.historyData  =   resultsData[0].rulesHistory;
                if($scope.historyData.length == 0){
                    $scope.showError    =   true;
                }
            }else{
                $scope.showError    =   true;
            }
        },function(error){
            console.log(error);
        });

        $scope.data.sku             =   sku;
        $scope.data.location        =   locationList[location];
        $scope.showHisory           =   true;
        $(document).load().scrollTop(0);
    }

    $scope.backButton = function(){
        $scope.showHisory   =   false;
        $scope.historyData  =   [];
        var id =    $scope.data.sku;
        $timeout(function() {
            document.getElementById(id).scrollIntoView("true");
        }, 500);
    }
    
}]);



