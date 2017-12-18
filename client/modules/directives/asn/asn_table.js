
angular.module('ui.asntable', ['roleConfig']).factory('AsnTableService', function ($rootScope,ovcDash,Data) {
    var factory = {};
        // var currencylabel  =   $scope.translation.currencylist[0];
        var id_user = $rootScope.globals['currentUser']['username'];
        var currencylist   =   [];
        var locationlist   =   [];
        ovcDash.get('apis/ang_userlocations?usid=' + id_user+'&isStore=0').then(function(resultsloc) {
            if(resultsloc && resultsloc != '' && resultsloc != 'error'){
                angular.forEach(resultsloc, function(item) {
                    currencylist[item.id]    =   item.currency;
                    locationlist[item.id]    =   item.displayName;
                });
            }
        });
    factory.getFormattedData   =   function(results,selectedStatus) {
        var allowedStatuses = ["received","shipped","receiveInProgress","closed", "shippedReversed","shipInProgress"];
        if((selectedStatus) && (selectedStatus.length > 0)){
            if(selectedStatus.indexOf('shipped') >= 0 && selectedStatus.indexOf('shippedReversed') == -1 ){
                selectedStatus.push('shippedReversed');
            }
            allowedStatuses = selectedStatus;
        }
    
        if(results.length > 0){
            var formattedData   =  {};
			formattedData['resolvebtn']  =   false;
			formattedData['showgroup']   =   true;
            var shippedpacks             =   0;
            var inprogresscount          =   0;
            var receiveEnable            =   0;
            var allpackages              =   0;
            var packageCount             =   0;
            formattedData['asns']        =  {};
            angular.forEach(results, function(values){
                var asnData = {};
                if( ! formattedData['asns'][values.asnId] && (values.asnStatus?allowedStatuses.indexOf(values.asnStatus) >= 0 : true)) {

                    formattedData['asns'][values.asnId] = {};
                    asnData['asnId'] = values.asnId;
                    asnData['poId'] = values.poId;
                    asnData['numberOfPackage']   =  0;
                    asnData['purchaseOrderType'] =  values.purchaseOrderType;
                    asnData['erpPurchaseOrder']  =  values.erpPurchaseOrder;
                    asnData['totalOrderSKU']     =  values.totalOrderSKU;
                    asnData['shipToLocation']    =  locationlist[values.shipToLocation];
 
                    if(values.packages){
                        asnData['packages']  =  {};
                        asnData['packages']    =  true;
                    }else{
                        asnData['styles']         =   {};
                        asnData['packages']     =   false;
                        asnData['asnStatus']      =   values.asnStatus;
                        // asnData['reverseData']   =     {};
                        // formattedData['asns'][values.asnId]['status']
                        asnData['receiveduser']   =   values.receivedUser;
                        asnData['reverseduser']   =   values.reversedUser;
                        asnData['reasoncode']     =   values.reasonCode;
                        asnData['reversedate']    =   values.reversedDate;
                        asnData['receivedDate']   =   values.receivedDate;
                    }
                    formattedData['asns'][values.asnId]  =  asnData;

                    var packageQty = totalSkuQty = 0;
                }    
                var asnCost         =   0;
                var packcount       =   0;
                var noofpackage     =   0;
                var closedstatus    =   0;
                shippedpacks        =   0;
                var receivedpacks   =   0;
                inprogresscount     =   0;
                allpackages         =   0;
                // var closecount      =   0; 
                var receiveinprogress = 0;
                if(values.packages){
                    /*For Package Id and Package Formating*/
                    var packageDetails  =   values.packages;
                    angular.forEach(packageDetails, function(details) {
                        var packageStatus = (details.packageStatus == null) ? 'shipped' : details.packageStatus;
                        allpackages++;

                        if(allowedStatuses.indexOf(packageStatus) >= 0){
                                packageCount++
                                asnData["isPackage"]    =   true;
                                if(packageStatus == 'received' || packageStatus == 'closed'){
                                    packcount++;
                                }
                                if(packageStatus == 'shipInProgress'){
                                    inprogresscount++;
                                }
                                if(packageStatus == 'received'){
                                    receivedpacks++;
                                }
                                if(packageStatus == 'closed'){
                                    closedstatus++;
                                }
                                if((packageStatus == 'shipped') || (packageStatus == 'shippedReversed') ){
                                    shippedpacks++;
                                }
                                if(packageStatus=='receiveInProgress'){
                                    receiveinprogress++;
                                }


                            if(!formattedData['asns'][values.asnId]['packages'][details.packageId]){
                                formattedData['asns'][values.asnId]['packages'][details.packageId]                  =   {};
                                formattedData['asns'][values.asnId]['packages'][details.packageId]['packageid']     =   details.packageId;
                                formattedData['asns'][values.asnId]['packages'][details.packageId]['receive_discrepancy'] =  false;
                                formattedData['asns'][values.asnId]['packages'][details.packageId]['packageStatus'] =   packageStatus;
                                formattedData['asns'][values.asnId]['packages'][details.packageId]['shipDate']      =   details.shipDate;
                                formattedData['asns'][values.asnId]['packages'][details.packageId]['expectedDeliveryDate'] = details.expectedDeliveryDate;
                                //formattedData['asns'][values.asnId]['packages'][details.packageId]['numberOfSKU'] = details.numberOfSKU;
                                formattedData['asns'][values.asnId]['packages'][details.packageId]['receiveduser']  =   details.receivedUser;
                                formattedData['asns'][values.asnId]['packages'][details.packageId]['reverseduser']  =   details.reversedUser;
                                asnData['receiveduser']                                                         =   details.receivedUser;
                                formattedData['asns'][values.asnId]['packages'][details.packageId]['reversedate']   =   details.reversedDate;
                                formattedData['asns'][values.asnId]['packages'][details.packageId]['receivedDate']  =   details.receivedDate;
                                formattedData['asns'][values.asnId]['packages'][details.packageId]['reasoncode']    =   details.reasonCode;
                                formattedData['asns'][values.asnId]['packages'][details.packageId]['trackingNumber'] =  details.trackingNumber;
                                formattedData['asns'][values.asnId]['packages'][details.packageId]['skus']      = {};
                            }
                           
                            var skuDetails      =   _.sortBy(details.po_asn_status, 'lineNumber' );
                            var totalCost       =   0;
                            var noOfSKUInStyle  =  {};
                            var  shippedQty     =   0;
                            angular.forEach(skuDetails, function(skuData) {
                                if(!formattedData['asns'][values.asnId]['packages'][details.packageId]['skus'][skuData.productCode]){
                                    formattedData['asns'][values.asnId]['packages'][details.packageId]['skus'][skuData.productCode] = {};
                                    formattedData['asns'][values.asnId]['packages'][details.packageId]['skus'][skuData.productCode]['stylecode'] = skuData.productCode;

                                    formattedData['asns'][values.asnId]['packages'][details.packageId]['skus'][skuData.productCode]['receive_discrepancy'] =  false;
                                    formattedData['asns'][values.asnId]['packages'][details.packageId]['skus'][skuData.productCode]['selected'] =  false;
                                  //  formattedData['asns'][values.asnId]['packages'][details.packageId]['skus'][skuData.productCode]['styleDescription'] = skuData.styleDescription;
                                    formattedData['asns'][values.asnId]['packages'][details.packageId]['skus'][skuData.productCode]['skuArr'] = [];
                                }
                                if(packageStatus == skuData.qtyStatus || packageStatus == 'shippedReversed'|| packageStatus ==  'shipInProgress'){
                                    if(allowedStatuses.indexOf(skuData.qtyStatus) >= 0){
                                        var  totalSkuQty =  0;
                                        
                                        var skuDataDetails = {};
                                        skuDataDetails['lineNumber']    = parseInt(skuData.lineNumber);
                                        skuDataDetails['sku']           = skuData.sku;
                                        skuDataDetails['description']   = skuData.description;
                                        skuDataDetails['skuCost']       = skuData.skuCost;
                                        skuDataDetails['skuCostConfirm']= skuData.skuCostConfirm;
                                        skuDataDetails['skuCostAsn']    = skuData.skuCostAsn;
                                        skuDataDetails['producUom']     = skuData.producUom;
                                        skuDataDetails['resolved']      = false;
                                        skuDataDetails['originalOrder'] = skuData.originalOrder;
                                        // skuDataDetails['qty']   = skuData.qty;
                                        skuDataDetails['poId']          = values.poId;
                                        totalSkuQty = formattedData['asns'][values.asnId]['packages'][details.packageId]['skus'][skuData.productCode]['TotalQuantity'] || 0
                                        
                                        if(skuData.skuCost == undefined){
                                            skuDataDetails['skuCost']   =   0;
                                            skuData.skuCost             =   0;
                                        }
                                            skuDataDetails['qty'] = 0;
                                        
                                        if(skuData.resolvedstatus!='' && skuData.resolvedstatus!= undefined && skuData.resolvedstatus.length > 0){
                                            skuDataDetails['resolvedqty'] = skuData.resolvedstatus[0].qty;
                                            skuDataDetails['resolved']    = true;
                                        }     
                                        
                                        if(skuData.shippedstatus!='' && skuData.shippedstatus!= undefined && skuData.shippedstatus.length > 0){
                                            skuDataDetails['qty'] = skuData.shippedstatus[0].qty;
                                           // totalCost = totalCost+ parseInt(skuDataDetails['qty']) * parseFloat(skuData.skuCost);
                                         
                                            if(packageStatus == 'shipped' || packageStatus == 'shippedReversed'|| packageStatus ==  'shipInProgress'){
                                                totalSkuQty = totalSkuQty + (parseInt(skuDataDetails['qty']) || 0);

                                                if(skuData.skuCostAsn){
                                                    totalCost = parseInt(skuDataDetails['qty']) * parseFloat(skuData.skuCostAsn);
                                                }else if(skuData.skuCostConfirm){
                                                    totalCost = parseInt(skuData.qty) * parseFloat(skuData.skuCostConfirm);
                                                }else{
                                                    totalCost = parseInt(skuData.qty) * parseFloat(skuData.skuCost);
                                                }
                                            } 
                                            if(packageStatus == 'receiveInProgress'){
                                                totalSkuQty = totalSkuQty + (parseInt(skuDataDetails['qty']) || 0);

                                                if(skuData.skuCostAsn){
                                                    totalCost = parseInt(skuDataDetails['qty']) * parseFloat(skuData.skuCostAsn);
                                                }else if(skuData.skuCostConfirm){
                                                    totalCost = parseInt(skuData.qty) * parseFloat(skuData.skuCostConfirm);
                                                }else{
                                                    totalCost = parseInt(skuData.qty) * parseFloat(skuData.skuCost);
                                                }
                                            }   
                                            if(packageStatus == 'received'){
                                                totalSkuQty = totalSkuQty + (parseInt(skuData.qty) || 0);

                                                if(skuData.skuCostAsn){
                                                    totalCost = parseInt(skuDataDetails['qty']) * parseFloat(skuData.skuCostAsn);
                                                }else if(skuData.skuCostConfirm){
                                                    totalCost = parseInt(skuData.qty) * parseFloat(skuData.skuCostConfirm);
                                                }else{
                                                    totalCost = parseInt(skuData.qty) * parseFloat(skuData.skuCost);
                                                }
                                            }
                                            if(packageStatus == 'closed'){
                                                skuDataDetails['qty'] = skuData.qty;
                                                totalSkuQty = totalSkuQty + (parseInt(skuData.qty) || 0);

                                                if(skuData.skuCostAsn){
                                                    totalCost = parseInt(skuData.qty) * parseFloat(skuData.skuCostAsn);
                                                }else if(skuData.skuCostConfirm){
                                                    totalCost = parseInt(skuData.qty) * parseFloat(skuData.skuCostConfirm);
                                                }else{
                                                    totalCost = parseInt(skuData.qty) * parseFloat(skuData.skuCost);
                                                }
                                            }    
                                        }else{

                                            if(packageStatus == 'receiveInProgress'){

                                                totalSkuQty = totalSkuQty + (parseInt(skuDataDetails['qty']) || 0);

                                                if(skuData.skuCostAsn){
                                                    totalCost = parseInt(skuDataDetails['qty']) * parseFloat(skuData.skuCostAsn);
                                                }else if(skuData.skuCostConfirm){
                                                    totalCost = parseInt(skuData.qty) * parseFloat(skuData.skuCostConfirm);
                                                }else{
                                                    totalCost = parseInt(skuData.qty) * parseFloat(skuData.skuCost);
                                                }
                                            }   
                                            if(packageStatus == 'received'){
                                                totalSkuQty = totalSkuQty + (parseInt(skuData.qty) || 0);

                                                if(skuData.skuCostAsn){
                                                    totalCost = parseInt(skuDataDetails['qty']) * parseFloat(skuData.skuCostAsn);
                                                }else if(skuData.skuCostConfirm){
                                                    totalCost = parseInt(skuData.qty) * parseFloat(skuData.skuCostConfirm);
                                                }else{
                                                    totalCost = parseInt(skuData.qty) * parseFloat(skuData.skuCost);
                                                }
                                            }    
                                            
                                        }

                                       // skuDataDetails['newQty'] = skuData.qty;
                                        if(packageStatus == 'receiveInProgress' || packageStatus == 'received'){
                                            skuDataDetails['newQty']    =   skuData.qty;
                                        }else{
                                            skuDataDetails['newQty']    =  '';
                                        }

                                        shippedQty  =   shippedQty  +   parseInt(skuDataDetails.qty);


                                        skuDataDetails['qtyStatus'] = skuData.qtyStatus;
                                        
                                        skuDataDetails['selected'] = false;
                                        
                                        if(packageStatus == 'received'){
                                            formattedData['asns'][values.asnId]['packstatus']  =   1;
                                            
                                            if((skuDataDetails['qty'] !=skuDataDetails['newQty']) && (skuDataDetails['resolved'] == false)){
                                                //countresolve++;
                                                formattedData['resolvebtn']                 = true;
                                                formattedData['asns'][values.asnId]['packages'][details.packageId]['receive_discrepancy'] =   true;
                                                formattedData['asns'][values.asnId]['packages'][details.packageId]['skus'][skuData.productCode]['receive_discrepancy'] =  true;
                                            }
                                            
                                        }else{
                                            formattedData['asns'][values.asnId]['packstatus']  =   0;
                                        }

                                       /*  skuDataDetails['newQty'] = skuData.qty;

                                        skuDataDetails['qtyStatus'] = skuData.qtyStatus; */
                                   
                                        packageQty = packageQty + (parseInt(skuData.qty) || 0);

                                        asnCost = parseFloat(asnCost) + parseFloat(totalCost);
                                        if (! formattedData['asns'][values.asnId]['packages'][details.packageId]['skus'][skuData.productCode]['styleDescription']){
                                             formattedData['asns'][values.asnId]['packages'][details.packageId]['skus'][skuData.productCode]['styleDescription'] = skuData.styleDescription;
                                        }
                                        
                                        formattedData['asns'][values.asnId]['packages'][details.packageId]['skus'][skuData.productCode]['skuArr'].push(skuDataDetails);
                                        formattedData['asns'][values.asnId]['packages'][details.packageId]['skus'][skuData.productCode]['TotalQuantity'] = totalSkuQty; 
                                        formattedData['asns'][values.asnId]['packages'][details.packageId]['skus'][skuData.productCode]['shippedQty']  =   shippedQty; 
                                    }
                                }
                                asnData['packageQty'] = packageQty;
                                asnData['numberOfPackage'] = Object.keys(formattedData['asns'][values.asnId]['packages']).length;
                                formattedData['asns'][values.asnId]['packages'][details.packageId]['skus'][skuData.productCode]['productDescription'] = skuData.productDescription;
                                
                                noOfSKUInStyle[skuData.productCode] = formattedData['asns'][values.asnId]['packages'][details.packageId]['skus'][skuData.productCode]['skuArr'].length;
                                noofpackage     =   asnData['numberOfPackage'];
                            });


                            var noOfSKU = 0;
                                
                            for (var key in noOfSKUInStyle) {
                               noOfSKU += noOfSKUInStyle[key];
                            };
                            
                            formattedData['asns'][values.asnId]['asnCost'] = asnCost.toFixed(2);
                            formattedData['asns'][values.asnId]['currency']= currencylist[values.shipToLocation];
                            formattedData['asns'][values.asnId]['packages'][details.packageId]['numberOfSKU'] = noOfSKU;
                         } 
                         if(packcount    ==  noofpackage){
                            formattedData['asns'][values.asnId]['packcounts']   = 1;
                        }else{
                            formattedData['asns'][values.asnId]['packcounts']   = 0;
                        }

                        if(receivedpacks == noofpackage){
                            formattedData['asns'][values.asnId]['status']    =   "receivedfull";
                        }
                        if(receivedpacks != noofpackage){
                            formattedData['asns'][values.asnId]['status']    =   "partiallyreceived";
                            receiveEnable++
                        }
                        if(shippedpacks == noofpackage){
                            formattedData['asns'][values.asnId]['status']    =   "intransit";
                            receiveEnable++;
                        }

                        if(closedstatus == noofpackage){
                            formattedData['asns'][values.asnId]['status']    =   "closed";
                        }
                        if((receiveinprogress == noofpackage)||((receiveinprogress > 0)&&(receiveinprogress+shippedpacks) == noofpackage)){
                            formattedData['asns'][values.asnId]['status']    = "receivinginprogress";

                        }
                    });   
                }else{
                    var totalCost       =   0;
                    var noOfSKUInStyle  =   {};
                    var shippedQty      =   0;
                    var styleDetails    =   values.po_asn_status;
                    angular.forEach(styleDetails, function(skuData) {
                        if(!formattedData['asns'][values.asnId]['styles'][skuData.productCode]){
                            formattedData['asns'][values.asnId]['styles'][skuData.productCode]                          =   {};
                            formattedData['asns'][values.asnId]['styles'][skuData.productCode]['stylecode']             =   skuData.productCode;
                            formattedData['asns'][values.asnId]['styles'][skuData.productCode]['receive_discrepancy']   =   false;
                            formattedData['asns'][values.asnId]['styles'][skuData.productCode]['selected']              =   false;
                          //  formattedData['asns'][values.asnId]['packages'][details.packageId]['skus'][skuData.productCode]['styleDescription'] = skuData.styleDescription;
                            formattedData['asns'][values.asnId]['styles'][skuData.productCode]['skuArr']                  =   [];
                        }
                        if(values.asnStatus == skuData.qtyStatus || values.asnStatus == 'shippedReversed'|| values.asnStatus ==  'shipInProgress'){
                            if(allowedStatuses.indexOf(skuData.qtyStatus) >= 0){
                                packageCount++
                                var  totalSkuQty                =   0;
                                var skuDataDetails              =   {};
                                var qtyStatus                   =   skuData.qtyStatus;
                                skuDataDetails['lineNumber']    =   parseInt(skuData.lineNumber);
                                skuDataDetails['sku']           =   skuData.sku;
                                skuDataDetails['description']   =   skuData.description;
                                skuDataDetails['skuCost']       =   skuData.skuCost;
                                skuDataDetails['skuCostConfirm']=   skuData.skuCostConfirm;
                                skuDataDetails['skuCostAsn']    =   skuData.skuCostAsn;
                                skuDataDetails['producUom']     =   skuData.producUom;
                                skuDataDetails['resolved']      =   false;
                                skuDataDetails['poId']          =   values.poId;
                                totalSkuQty                     =   formattedData['asns'][values.asnId]['styles'][skuData.productCode]['TotalQuantity'] || 0
                                
                                if(skuData.skuCost    == undefined){
                                    skuDataDetails['skuCost']   =   0;
                                    skuData.skuCost             =   0;
                                }

                                skuDataDetails['qty']           =   0;

                                if(skuData.resolvedstatus!='' && skuData.resolvedstatus!= undefined && skuData.resolvedstatus.length > 0){
                                    skuDataDetails['resolvedqty']   =     skuData.resolvedstatus[0].qty;
                                    skuDataDetails['resolved']      =     true;
                                }
                                if((qtyStatus == 'shipped') || (qtyStatus == 'shippedReversed') ){
                                    shippedpacks++;
                                }   
                                if(skuData.shippedstatus!='' && skuData.shippedstatus!= undefined && skuData.shippedstatus.length > 0){
                                    skuDataDetails['qty']   =   skuData.shippedstatus[0].qty;
                                    if(qtyStatus == 'shipped' || qtyStatus == 'receiveInProgress'|| qtyStatus ==  'shipInProgress')
                                        totalSkuQty = totalSkuQty + (parseInt(skuDataDetails['qty']) || 0);
                                    if(qtyStatus == 'received')
                                        totalSkuQty = totalSkuQty + (parseInt(skuData.qty) || 0);
                                    if(qtyStatus == 'closed'){
                                        skuDataDetails['qty'] = skuData.qty;
                                        totalSkuQty = totalSkuQty + (parseInt(skuData.qty) || 0);
                                    }
                                    //*****Common For received,shipped,receiveInProgress,shipInProgress,closed**//
                                    if(skuData.skuCostAsn){
                                        totalCost = parseInt(skuDataDetails['qty']) * parseFloat(skuData.skuCostAsn);
                                    }else if(skuData.skuCostConfirm){
                                        totalCost = parseInt(skuData.qty) * parseFloat(skuData.skuCostConfirm);
                                    }else{
                                        totalCost = parseInt(skuData.qty) * parseFloat(skuData.skuCost);
                                    }
                                }else{
                                    if(qtyStatus == 'receiveInProgress')
                                        totalSkuQty = totalSkuQty + (parseInt(skuDataDetails['qty']) || 0);
                                    if(qtyStatus == 'received')
                                        totalSkuQty = totalSkuQty + (parseInt(skuData.qty) || 0);

                                    //***For Non Shipped Status***//
                                    if(skuData.skuCostAsn){
                                        totalCost = parseInt(skuDataDetails['qty']) * parseFloat(skuData.skuCostAsn);
                                    }else if(skuData.skuCostConfirm){
                                        totalCost = parseInt(skuData.qty) * parseFloat(skuData.skuCostConfirm);
                                    }else{
                                        totalCost = parseInt(skuData.qty) * parseFloat(skuData.skuCost);
                                    }
                                }
                                if(qtyStatus == 'receiveInProgress' || qtyStatus == 'received'){
                                    skuDataDetails['newQty']    =   skuData.qty;
                                }else{
                                    skuDataDetails['newQty']    =  '';
                                }
                               // skuDataDetails['newQty']    =   skuData.qty;
                                shippedQty                  =   shippedQty  +   parseInt(skuDataDetails.qty);
                                skuDataDetails['qtyStatus'] =   skuData.qtyStatus;
                                skuDataDetails['selected']  =   false;
                                if(qtyStatus == 'received'){
                                    formattedData['asns'][values.asnId]['packstatus']  =   1;

                                    if((skuDataDetails['qty'] !=skuDataDetails['newQty']) && (skuDataDetails['resolved'] == false)){
                                        //countresolve++;
                                        formattedData['resolvebtn']                                     =   true;
                                        formattedData['asns'][values.asnId]['styles']['receive_discrepancy']    =   true;
                                        formattedData['asns'][values.asnId]['styles'][skuData.productCode]['receive_discrepancy'] =  true;
                                    }
                                }else{
                                    formattedData['asns'][values.asnId]['packstatus']  =   0;
                                }
                                packageQty  =   packageQty + (parseInt(skuData.qty) || 0);
                                asnCost     =   parseFloat(asnCost) + parseFloat(totalCost);
                                if (! formattedData['asns'][values.asnId]['styles'][skuData.productCode]['styleDescription']){
                                     formattedData['asns'][values.asnId]['styles'][skuData.productCode]['styleDescription'] = skuData.styleDescription;
                                }

                                formattedData['asns'][values.asnId]['styles'][skuData.productCode]['skuArr'].push(skuDataDetails);
                                formattedData['asns'][values.asnId]['styles'][skuData.productCode]['TotalQuantity'] =   totalSkuQty; 
                                formattedData['asns'][values.asnId]['styles'][skuData.productCode]['shippedQty']    =   shippedQty; 
                            }
                        }
                        asnData['packageQty'] = packageQty;
                        asnData['numberOfStyles'] = Object.keys(formattedData['asns'][values.asnId]['styles']).length;
                        formattedData['asns'][values.asnId]['styles'][skuData.productCode]['productDescription'] = skuData.productDescription;
                        
                        noOfSKUInStyle[skuData.productCode] = formattedData['asns'][values.asnId]['styles'][skuData.productCode]['skuArr'].length;
                        // noofpackage     =   asnData['numberOfPackage'];
                    });
                    var noOfSKU = 0;
                
                    for (var key in noOfSKUInStyle) {
                       noOfSKU += noOfSKUInStyle[key];
                    };
                     formattedData['asns'][values.asnId]['asnCost'] = asnCost.toFixed(2);
                     formattedData['asns'][values.asnId]['currency']= currencylist[values.shipToLocation];
                     // formattedData['asns'][values.asnId]['styles']['numberOfSKU'] = noOfSKU;
                    // console.log(formattedData,'FORMATTEED DATA');
                    if(values.asnStatus == 'received'){
                        formattedData['asns'][values.asnId]['status']    =   "receivedfull";
                    }
                    if(values.asnStatus == 'receiveInProgress'){
                        formattedData['asns'][values.asnId]['status']    =   "receivinginprogress";
                    }
                    if(values.asnStatus == 'shipped'){
                        formattedData['asns'][values.asnId]['status']    =   "intransit";
                        receiveEnable++;
                    }

                    if(values.asnStatus == 'closed'){
                        formattedData['asns'][values.asnId]['status']    =   "closed";
                    }
                    // if((receiveinprogress == noofpackage)||((receiveinprogress > 0)&&(receiveinprogress+shippedpacks) == noofpackage)){
                    //     formattedData['asns'][values.asnId]['status']    = "receivinginprogress";

                    // }
                }  
            });
			formattedData['error']                          = packageCount;
			if(receiveEnable  == 0){
				formattedData['receivebtn']                 = false;
			}else{
				formattedData['receivebtn']                 = true;
			}	 
			
			if(inprogresscount	==	allpackages){
				formattedData['showgroup']                  = false;
			}
        }else{
            var formattedData   =   [];
        }
        return formattedData;
    };
    return factory;
});

angular.module('ui.asntable').filter('array', function() {
  return function(items) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
   return filtered;
  };
});


angular.module('ui.asntable').directive('asnTable', ['$compile', 'AsnTableService', '$rootScope', '$state', '$stateParams','Data', '$timeout', '$filter', 'REVERSEICON','Utils', function ($compile, AsnTableService, $rootScope, $state, $stateParams, Data, $timeout, $filter, REVERSEICON,Utils) {
    return {
        restrict: 'EA',
        scope : false,
        replace:true,
        link: function (scope, elem, attrs) {
            var asn_obj              =   {};
            asn_obj.mode             =   attrs.mode;
            asn_obj.backTo           =   attrs.backto;
			scope.asngroups	         =   {};
			scope.asnaction          =   {};
            scope.asnaction.ibt      =   false;
            scope.vwcloseasn         =   false;
			scope.showreceive        =   true;
			scope.asngroups.changedpacks	=	[];
            scope.asn_obj           =   asn_obj;
            scope.total_ship_qty    =   0;

            var Congiguration   =   Utils.configurations();
            Congiguration.then(function(configuration){
                if(configuration){
                    scope.config    =   configuration;
                    scope.shasn     =  configuration.config_arr && configuration.config_arr.enableASNlevel && 
                                       configuration.config_arr.enableASNlevel.featureValue ? configuration.config_arr.enableASNlevel.featureValue : true;
                }
            }).then(function(){
                transferExec();
            }, function(error){
                console.log(error, 'error: Configuration Service');
                transferExec();
            });

            Utils.roles().then(function(rolesData){
                if(rolesData){
                    scope.vwcloseasn = rolesData.permissionsData && rolesData.permissionsData.closeASN 
                                    && rolesData.permissionsData.closeASN.closeASN ? 
                                    rolesData.permissionsData.closeASN.closeASN : false
                }
            }, function(error){
                console.log(error , 'error : Roles Service');
            });
            Utils.location().then(function(results){
                if(results){
                    var listlocation = {};
                    angular.forEach(results, function(item) {
                    listlocation[item.id] = item.displayName;
                });
                scope.all_locations = listlocation;
               }
            });
            scope.changeQty =   function(sku_key, product_code) {
                
                // var asn_details_key     =   Object.keys(scope.asn_details)[0];

                // var total_qty   =   total_cost  =   0;
                // angular.forEach(scope.asn_details[asn_details_key][0]['po_asn_status'][product_code], function(skus){
                //     var new_qty =   parseInt(skus.newQty) | 0;
                //     total_qty   =   total_qty + new_qty;
                //     total_cost   =   total_cost + (new_qty * parseFloat(skus.cost));
                // });

                // scope.asn_details[asn_details_key][0]['po_asn_status'][product_code].totalQty   =   total_qty || 0;
                // scope.asn_details[asn_details_key][0]['po_asn_status'][product_code].totalCost  =   total_cost || 0;
                
                
            };

            scope.limitreceivedqty  =   function(min, current, asnid,packageid,styleid,lnno){

                if(parseInt(current) < min || isNaN(current)){

                    scope.asn_details['asns'][asnid]['packages'][packageid]['skus'][styleid]['skuArr'][lnno]['newQty'] = min;

                }
            };

            scope.decreaseqty = function(asnid,packageid,styleid,lnno){
                if(scope.asn_details['asns'][asnid]['packages'][packageid]['skus'][styleid]['skuArr'][lnno]['newQty'])
                    scope.asn_details['asns'][asnid]['packages'][packageid]['skus'][styleid]['skuArr'][lnno]['newQty']    =   scope.asn_details['asns'][asnid]['packages'][packageid]['skus'][styleid]['skuArr'][lnno]['newQty']    -   1;
            };
            
            scope.increaseqty   =   function(asnid,packageid,styleid,lnno){
                var num = scope.asn_details['asns'][asnid]['packages'][packageid]['skus'][styleid]['skuArr'][lnno]['newQty'];
                if(isNaN(num) || num == ''){
                    scope.asn_details['asns'][asnid]['packages'][packageid]['skus'][styleid]['skuArr'][lnno]['newQty']    =  1;
                }else{
                    scope.asn_details['asns'][asnid]['packages'][packageid]['skus'][styleid]['skuArr'][lnno]['newQty']    =   parseInt(scope.asn_details['asns'][asnid]['packages'][packageid]['skus'][styleid]['skuArr'][lnno]['newQty'])    +   1;
                }
            };

            scope.nopkgdecreaseqty  =   function(asnid, styleid, lnno){
                
                scope.asn_details['asns'][asnid]['styles'][styleid]['skuArr'][lnno]['newQty']     =   scope.asn_details['asns'][asnid]['styles'][styleid]['skuArr'][lnno]['newQty']     -   1;

            };

            scope.nopkgincreaseqty  =   function(asnid, styleid, lnno){
               
                scope.asn_details['asns'][asnid]['styles'][styleid]['skuArr'][lnno]['newQty']     =   scope.asn_details['asns'][asnid]['styles'][styleid]['skuArr'][lnno]['newQty']     +   1;
            };

            scope.limitnopkg    =   function(min, current, asnid, styleid, lnno){

                if(parseInt(current) < min || isNaN(current)){

                    scope.asn_details['asns'][asnid]['styles'][styleid]['skuArr'][lnno]['newQty'] = min;
                }

            };

            scope.asn_details_storage  = function(){
                        
                if(scope.asn_data_search)
                sessionStorage.asn_details =  JSON.stringify(scope.asn_data_search);
            console.log(sessionStorage.asn_details);
            };

            /**For reverse in configration**/
            angular.forEach(REVERSEICON, function(pack){
              if(pack.reverselevel  ==  'ASN'){
                scope.showreverse   = true;
              }else{
                scope.showreverse   = false;
              }
            });

			/***Shipping package which are in ShippingInProgress Status****/
			scope.shipPackages	= function(asndata){
				var final_obj   =   [];
				var selected_package	=	$rootScope.asn_details[asndata.asnid]['packages'][asndata.packageid];
             
				if(selected_package){
					var asnjson	=	[];
					var newobj					                =	{};
					newobj.purchaseOrder		 =	{};
					newobj.purchaseOrder.purchaseOrderNumber				   = 	asndata.orderid;
					newobj.purchaseOrder.orderStatus		 =   "partiallyShipped";
					var tmp_obj	=	newobj.purchaseOrder.purchaseOrderAsn    =	{};
					tmp_obj.asnId	=	asndata.asnid;
					tmp_obj.purchaseOrderPackage			                    =	[];
					tmp_obj.purchaseOrderPackage[0]		                          =	{};
					tmp_obj.purchaseOrderPackage[0].packageId  =	asndata.packageid;
					tmp_obj.purchaseOrderPackage[0].packageStatus		    =	asndata.status;
					tmp_obj.purchaseOrderPackage[0].shipDate   =	$filter('date')(new Date(), 'yyyy-MM-dd');
					tmp_obj.purchaseOrderPackage[0]	.purchaseOrderItem		   =	[];
					
					 angular.forEach(selected_package.skus, function(styles){
						angular.forEach(styles.skuArr, function(skudata){
							var skuobj				=	{};
							skuobj.sku				=	skudata.sku;
							skuobj.qtyStatus	    =	asndata.status;
							skuobj.qty				=	skudata.newQty;
							skuobj.lineNumber	    =	skudata.lineNumber;
							tmp_obj.purchaseOrderPackage[0]	.purchaseOrderItem.push(skuobj);
						});
					});
					
					asnjson.push(newobj);
					var jsonStr	=	JSON.stringify(asnjson);
					scope.shipAsnPackage('/receivingpurchasejson', jsonStr);
				}

			};
			
			scope.shipAsnPackage	=	function(uploadUrl, jsonStr) {

				 var obj = {"data" : {"uploaded_file" : jsonStr, "type" : "json"}};
				Data.post(uploadUrl, obj)
				.then(function(success){
						if(success){
							if (success.status == "success") {
								var output = {
									"status": "success",
									"message": "Package Shipped Successfully"
								};
								$state.reload();
								Data.toast(output);
							}
							else{
								var output = {
										"status": "error",
										"message": "Error with Shipping Package"
								};
								Data.toast(output);
							}
						}
						//$state.reload();
				});
			}; 
			
			scope.selectstyleskus	=	function(asn,packid,style,data){
		       
                var styleskus   =   scope.asn_details['asns'][asn.asnId]['packages'][packid]['skus'][style]['skuArr'];
				if(data == false){
				
					$rootScope.resolvedasn.receivedpacks.push(packid);
					$rootScope.resolvedasn.receivedasns.push(asn.asnId);
					scope.asn_details['asns'][asn.asnId]['packages'][packid]['skus'][style].selected= true;
				}else{
					scope.asn_details['asns'][asn.asnId]['packages'][packid]['skus'][style].selected= false;
				}
				
				angular.forEach(styleskus, function(item){
					if((item.newQty != item.qty) && (item.resolved == false)){
						item.selected =  !data;
					}
				});
			
			}
			
			scope.selectresolveskus	=	function(asn,packid,style,data, skuselected, selects){
				
				if(selects == false){
					
					$rootScope.resolvedasn.receivedpacks.push(packid);
					$rootScope.resolvedasn.receivedasns.push(asn.asnId);
				}
				scope.asn_details['asns'][asn.asnId]['packages'][packid]['skus'][style]['skuArr'][skuselected].selected= !selects;
			}
			
			scope.resolvePackages	=	function(status){
	
			};

            /* For Receive the Package*/
            scope.receivePackages   =   function(status) {
                var final_obj   =   [];
                var newQtyety;
                angular.forEach($rootScope.asn_details.asns, function(asn_detail){
                    if(asn_detail.packages){
                        angular.forEach(asn_detail.packages, function(packages,packageId){
                            var tmp_obj =   {};
                            if(scope.is_blind_receive && packages.checkBox || ( ! scope.is_blind_receive && ! packages.checkBox)){
                                tmp_obj.packageId   =   packageId;
                                tmp_obj.asnId       =   asn_detail.asnId;
                                tmp_obj.status      =   status;
                                tmp_obj.itemStatus  =   [];
                                angular.forEach(packages.skus, function(styles){
                                    angular.forEach(styles.skuArr, function(skudatas){

                                        if(scope.is_blind_receive && packages.checkBox){
                                            skudatas.newQty =   skudatas.qty;
                                        }

                                        if(skudatas.newQty === ''){ 
                                            newQtyety   =   true;
                                        }

                                        tmp_obj.itemStatus.push(skudatas);
                                    });
                                });
                                final_obj.push(tmp_obj);
                            }
                        });
                    }else{
                        
                        angular.forEach(asn_detail.skus, function(styles,stylesData){
                            var temp_obj    =   {};
                            if(scope.is_blind_receive && asn_detail.checkBox || ( ! scope.is_blind_receive && ! asn_detail.checkBox)){
                                temp_obj.asnId       =   asn_detail.asnId;
                                temp_obj.status      =   status;
                                temp_obj.itemStatus  =   [];
                                angular.forEach(styles.skuArr, function(skudatas){

                                    if(scope.is_blind_receive && asn_detail.checkBox){
                                        skudatas.newQty =   skudatas.qty;
                                    }
                                    
                                    if(skudatas.newQty === ''){ 
                                        newQtyety   =   true;
                                    }

                                    temp_obj.itemStatus.push(skudatas);
                                });
                                final_obj.push(temp_obj);
                            }
                        });
                    }    
                });
                
                if(newQtyety){
                    var outputs = {
                       "status": "error",
                       "message": "Received Quantity Should not be Empty"
                    };
                    Data.toast(outputs); 
                    return false;
                }

               if(final_obj.length > 0)
               {
                   var pkgdata = {"data":JSON.stringify(final_obj)};

                   Data.put('/receivedpackage', {
                       data:pkgdata
                   }).then(function (results) {
                        var output = {};
                        if(results.status =='success'){
                            if(scope.is_blind_receive){
                                scope.reloadBtn(); 
                            }
                            if(! scope.is_blind_receive){
                                scope.backBtn();
                            }
                           if(status == 'received'){
                               var output = {
                                   "status": "success",
                                   "message": "Package Received Successfully."
                                };
                            }
                           else{
                               var output = {
                                   "status": "success",
                                   "message": "Receiving Progress Saved."
                               };
                            }
                        }else{          
                               var output = {
                                   "status": "error",
                                   "message": "Receiving Progress Failed to Save."
                               };
                            }  
                        Data.toast(output);                
                    });
                }else{
                        var output = {
                            "status": "error",
                            "message": "Please Select Any Package"
                        };
                        Data.toast(output);  
                }    
            };

            scope.closeBtn  =   function(asn){
                $.confirm({
                    title: 'Close ASN',
                    content: 'Are you sure you want to close ASN # '+asn.asnId+'?',
                    confirmButtonClass: 'btn-primary',
                    cancelButtonClass: 'btn-primary',
                    confirmButton: 'Ok',
                    cancelButton: 'Cancel',
                    confirm: function () {
                        
                    var final_obj =   [];

                // angular.forEach($rootScope.asn_details, function(asn_detail){
                    if(asn && asn.packages){
                        angular.forEach(asn.packages, function(packages,packageKey){
                            var tmp_obj =   {};
                            if(scope.is_blind_receive  || ( ! scope.is_blind_receive )){
                                tmp_obj.packageId   =   packageKey;
                                tmp_obj.asnId       =   asn.asnId;
                                tmp_obj.asnStatus   =   "closed";
                                tmp_obj.itemStatus  =   [];

                                angular.forEach(packages.skus, function(styles){
                                        angular.forEach(styles.skuArr, function(skudatas){
                                            tmp_obj.itemStatus.push(skudatas);
                                            
                                        });
                                    });
                                    final_obj.push(tmp_obj);
                            }
                        });
                    }else{
                        angular.forEach(asn.styles, function(styles,stylesData){
                            var tmp_obj =   {};
                            if(scope.is_blind_receive  || ( ! scope.is_blind_receive )){
                                // tmp_obj.packageId   =   packageKey;
                                tmp_obj.asnId       =   asn.asnId;
                                tmp_obj.asnStatus   =   "closed";
                                tmp_obj.itemStatus  =   [];

                                    angular.forEach(styles.skuArr, function(skudatas){
                                        tmp_obj.itemStatus.push(skudatas);
                                        
                                    });
                                final_obj.push(tmp_obj);
                            }
                        });

                    }
                     // return false;
                        if(final_obj.length > 0){
                            var pkgdata = {"data":JSON.stringify(final_obj)};
                            Data.put('/closedasnpackage', {
                               data:pkgdata
                            }).then(function (results) {
                               if(results.status =='success'){
                                    // scope.reloadBtn();
                                    scope.asnSearch();
                                    var output = {
                                        "status": "success",
                                        "message": "Package Closed Successfully"
                                    };
                                    Data.toast(output);
                               }else{          
                                   return false;
                               }                   
                           });
                         
                        };
                        $state.reload();
                },
                cancel: function () {
                        return false;
                }
                
                });      
            };

            scope.reloadBtn = function(){
                $state.reload();
            };

            scope.backBtn = function(){
                if($stateParams.backTo){
                    $state.go('ovc.intransit');
                }else{
                    window.history.back();
                }
            };

            scope.deleteskus=function(id,asnid,packageid,styleid){
                var idx=this.$index;
                scope.asn_details['asns'][asnid]['packages'][packageid]['skus'][styleid]['skuArr'].splice(idx, 1);
            }
            
            function transferExec(){
				scope.shasn         =   true;
				if(($state.current.name == "ovc.viewtransfers-summary") || ($state.current.name == "ovc.manualShipment-summary")){
					 scope.asnaction.ibt	=	true;
                     scope.shasn            =   ($state.current.name == "ovc.viewtransfers-summary") ? true : false;
				}
            }
        },
        templateUrl : '/modules/directives/asn/asn_table.html'
    };
}]);

