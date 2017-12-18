var app = angular.module('OVCstockApp');

app.controller('dashboardReport', function($rootScope, $scope, $filter, Data, ovcDash, toaster, TreeViewService,$timeout, $state ,userRoleConfigService, labelSource, Utils) {

    Utils.roles().then( function ( roles_val ) {
        if(roles_val && !roles_val.viewDashboardReports){
            var output = {
                "status": "error",
                "message": "You need permission to perform </br>this action"
            };
            ovcDash.toast(output);
            $state.go('ovc');
        }
    });
    
    $scope.activeTab		         =	'confirmation';
    $scope.form                      =   $scope.ship =   {};
    $scope.action                    =   {};
    $scope.data                      =   [];
    $scope.multibar_data             =   [];
    $scope.count_item_data           =   [];
    $scope.ship.store_datas          =   [];
    $scope.action.manual_order       =   [];
    $scope.action.transfer_order     =   [];
    $scope.action.push_order         =   [];
    $scope.action.return_order       =   [];
    $scope.action.dropship_order     =   [];
    $scope.action.receipt_order      =   [];   
    $scope.action.active_order       =   ''; 
    $scope.ship.alllocations         =   {};
    $scope.action.currentpage        =    1;
    $scope.action.entrylimit         =    0;
    $scope.action.offset             =    0;   
    $scope.negativeInventory_data    =   [];  
    $scope.action.offset             =   0;
    $scope.show_more_btn             =  true;
    $scope.show_less_btn             =  false;
    $scope.y_axis_label     =   ['oh'];
    $scope.location         =   {};
    var lang            =   ($rootScope.ovcLabel && $rootScope.ovcLabel.dashboard) ? $rootScope.ovcLabel.dashboard : {};
    // var lang                =   ovcLabel.dashboard; 
    // var langfile   =  $scope.ovcLabel.dashboard;

    $scope.action.showFilter    =   true;
    $scope.action.maximize      =   false;
    delete sessionStorage.dashboard;
    $scope.getPieChartOptions =   function(cheight) {
        var pie_chart = {
            chart: {
                type: 'pieChart',
               // height: 300,
               height: cheight,
                x: function(d){return lang.status[d.key];},
                y: function(d){return d.y;},
                legendPosition:"right",
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
                pie:{
                        dispatch:{
                                elementClick: function(e){
                                    delete sessionStorage.ibtSearchData;
                                    delete sessionStorage.customerSearchData;
                                    delete sessionStorage.asnSearchData;
                                    delete sessionStorage.returnsSearchData;                                    
                                    if($scope.form.fromdate == '' || $scope.form.fromdate == undefined){
                                        delete sessionStorage.fromdate;
                                    }
                                    if($scope.form.todate == '' || $scope.form.todate == undefined){
                                        delete sessionStorage.todate;
                                    }
                                    if($scope.ship.locationId != '' && $scope.ship.locationId != undefined){
                                        sessionStorage.setItem("storeid",$scope.ship.locationId);      
                                        sessionStorage.setItem("storename", $scope.ship.alllocations[$scope.ship.locationId]);
                                    } 
                                    if($scope.ship.locationId == '' || $scope.ship.locationId == undefined){
                                        delete sessionStorage.storeid;
                                        delete sessionStorage.storename;
                                    }  
                                    sessionStorage.setItem("status",e.data.key);
                                    sessionStorage.setItem("dashboard",'dash');
                                    if($scope.action.active_order == 1){
                                                    $state.go('ovc.purchaseorder-list');                                               
                                    }
                                    if($scope.action.active_order == 2){
                                                    $state.go('ovc.ibt');
                                    }
                                    if($scope.action.active_order == 3){
                                                    $state.go('ovc.manualShipment-list');
                                    }
                                    if($scope.action.active_order == 4){
                                                    $state.go('ovc.returns-list');
                                    }
                                    if($scope.action.active_order == 5){
                                                    $state.go('ovc.customerorders-list');
                                    }
                                    if($scope.action.active_order == 6){
                                                    $state.go('ovc.manualReceipt-list'); 
                                    }
                                }
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
    $scope.options_pie      =   $scope.getPieChartOptions(280);


    //Multiple Bar Chart Options
    $scope.options_multibar = {
        chart: {
            zoom: {
                useNiceScale : true
            },
            type: 'multiBarChart',
            height: 320,
            x: function(d){return d.x;},
            y: function(d){return d.y_ax;},
            margin : {
                top: 20,
                right: 20,
                bottom: 45,
                left: 45
            },
            clipEdge: true,
            staggerLabels: true,
            transitionDuration: 1000,
            //tooltips: true,
            tooltip:{
                enabled : true,
                contentGenerator: function (res) {
                    var tmp =   '<table>';
                            tmp +=  '<thead>';
                                tmp +=  '<tr>';
                                    tmp +=  '<td class="legend-color-guide"><div style="background-color: '+res.color+';"></div></td>';
                                    tmp +=  '<th class="chart_uppercase">' +lang.sku+ '</th>';
                                    tmp +=  '<th class="chart_uppercase">'+res.data.label+'</th>';
                                tmp +=  '</tr>';
                            tmp +=  '</thead>';
                            tmp +=  '<tbody>';
                            tmp +=  '<tr>';
                                tmp +=  '<td></td>';
                                tmp +=  '<td class="key textC">'+res.data.sku+'</td>';
                                tmp +=  '<td class="chart_uppercase">'+res.data.y+'</td>';
                            tmp +=  '</tr>';
                            tmp +=  '</tbody>';
                        tmp +=  '</table>';

                    return tmp;
                }
            },
            stacked: true,
            showControls: false,
            xAxis: {
                axisLabel: lang.sku,
                showMaxMin: false,
                tickFormat: function(d){
                    return d3.format(',f')(d);
                }
            },
            yAxis: {
                axisLabel: $scope.y_axis_label.join('-').toUpperCase(),
                axisLabelDistance: -20,
                tickFormat: function(d){
                    return d3.format(',f')(d);
                }
            }
        }
    };

    //Discretebar Chart Option
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

    $scope.maximizeChart    =   function(id_item) {
        if( ! $scope.action.maximize)
            $scope.action.maximize  =   {};

        $scope.action.maximize[id_item]  =   ! $scope.action.maximize[id_item];

        switch(id_item) {
            
            case 'order_pie' :
                $timeout(function() {
                    $scope.options_pie.chart.height         =   $scope.action.maximize[id_item] ? 450 : 300;
                },100);
                break;
            
            case 'inventory' :
                $timeout(function() {
                    $scope.options_multibar.chart.height    =   $scope.action.maximize[id_item] ? 280 : 320;
                },100);
                break;
            
          case 'negative':
                $timeout(function() {
                    $scope.option_discrete.chart.height     =   $scope.action.maximize[id_item] ? 280 : 300;
                },100);
                break;
        };

        return;
    };

    $scope.searchLocation = function(location){
        $scope.action.filterLocation    =   location;
    };
    
    function location(callback){
        Utils.hierarchylocation().then(function(results){
          if(results){
                $scope.storeLocData =   TreeViewService.getLocData(results);
                TreeViewService.toggleAll($scope.storeLocData[0]);
                callback();
                if(results.hierarchy.length == 1){
                        $timeout(function() {
                    angular.element('#'+$scope.storeLocData[0].id).trigger('click');
                }, 1);
                }
            }
        },function(error){
            console.log('Hierarchy Location Error :' + error);
        });
    }
    function getLocation() {

        Utils.userLocation(1).then(function(results){
            if(results.status=='error'){
                $scope.ship.store_datas = [];
            }else{
                $scope.ship.store_datas = results;
                var locationlist ={};
                angular.forEach(results, function(item) {
                    locationlist[item.id]   =   item.displayName;
                });
                $scope.ship.alllocations=  locationlist;
                if(sessionStorage.redirect){
                    if('redirecttrue' === sessionStorage.redirect){
                        
                        if(sessionStorage.fromdate){
                            $scope.form.fromdate = sessionStorage.fromdate;
                        }

                        if(sessionStorage.todate){
                            $scope.form.todate = sessionStorage.todate;
                        }

                        if(sessionStorage.storeid){
                            $scope.ship.locationId = sessionStorage.storeid;
                            $scope.ship.locationDisplayName     =  locationlist[sessionStorage.storeid];
                        }
                        // else{
                        //     $scope.ship.locationId =  $scope.ship.store_datas[0].id;
                        // }
                    }
                    delete sessionStorage.redirect;
                }
                // else{
                //     $scope.ship.locationId =  $scope.ship.store_datas[0].id;
                // }
                $scope.$evalAsync(function() {
                    $scope.getOrderStatus();
                    $scope.NegativeInventory();
                    $scope.LowInventory();
                });
            }
        }, function(error){
            console.log('User Location Error :' + error);
        });
    };

    $scope.filterReports =   function() {
        var srchData                =   $scope.form;
        var fromDate                =   (srchData.fromdate) ? srchData.fromdate : '';
        var toDate                  =   (srchData.todate) ? srchData.todate : '';
        
        if(fromDate){
            sessionStorage.setItem("fromdate",fromDate);
         }
         else{
            delete sessionStorage.fromdate;
        }

        if(toDate){
            sessionStorage.setItem("todate",toDate);
        }
        else{
            delete sessionStorage.todate;
        }
        if (fromDate && toDate) {
            if ($filter('dateFormChange')(fromDate) <= $filter('dateFormChange')(toDate)) {
                $scope.fieldsRequired = false;                
            } else {
                $scope.fieldsRequired = true;
                return false;
            }
        }
        if($scope.ship.locationId != '' && $scope.ship.locationId != undefined){
            sessionStorage.setItem("storeid",$scope.ship.locationId);      
            sessionStorage.setItem("storename", $scope.ship.alllocations[$scope.ship.locationId]);
        }  
        else{
            delete sessionStorage.storeid;
            delete sessionStorage.storename;
        }  
        $scope.getOrderStatus();
        $scope.LowInventory(); 
        $scope.getNegativeInventoryReports('negativeInventory','search');
    };

    $scope.resetOrderStatus =   function() {
        $scope.form     =   {};
        $scope.data     =   [];
        $scope.location =   {};
         $scope.fieldsRequired = false; 
        $scope.ship.locationId  =   $scope.ship.locationDisplayName  =   '';
        delete sessionStorage.status;
        delete sessionStorage.storeid;
        delete sessionStorage.storename;
        delete sessionStorage.todate;
        delete sessionStorage.fromdate; 
        location(function() {
          getLocation(function() {
          });
        });
    };

    $scope.getQueryString =   function() {
        var qry_strng       =   [];
        $scope.ship.locationId ?  qry_strng.push('storeId=' + encodeURIComponent($scope.ship.locationId)) : '';
        
        $scope.form.fromdate ? qry_strng.push('fromdate=' + $filter('dateFormChange')($scope.form.fromdate)) : '';
        
        $scope.form.todate ? qry_strng.push('todate=' + $filter('dateFormChange')($scope.form.todate)) : '';
        return qry_strng;
    };

   $scope.getInventoryReports  =   function(action) {

        $scope.multibar_data    =   [];
        var qry_strng   =   $scope.getQueryString();
        qry_strng.push('report_action=' + action);

         if(qry_strng.length > 0)
            qry_strng  =   qry_strng.join('&');

        var inv_item    =   final_obj   =   y_labels    =   [];
        var tmp =   {};

         Data.get('/inventoryreports?'+qry_strng).then(function(data)
           {

            angular.forEach(data, function(item, index){

                angular.forEach($scope.y_axis_label, function(balance_type, i){
                    
                    var obj    =   item.inventory[i] || {};

                    if( ! tmp[balance_type])
                        tmp[balance_type] =   [];

                    var y_count =   0;

                    if(obj && balance_type === obj.balanceType)
                    {
                        angular.forEach(obj.count, function(y_item, key){

                            y_count =   y_count + parseInt(y_item);
                        });
                    }
                    
                    obj.x       =   index;
                    obj.sku     =   item._id;
                    obj.label   =   balance_type;
                    obj.y_ax    =   y_count

                    tmp[balance_type].push(obj);
                });
            });

            angular.forEach(tmp, function(value, key){
                var obj     =   {};

                obj.key =   key;
                obj.values  =   value;

                $scope.multibar_data.push(obj);
            });
        });
    };

    $scope.getNegativeInventoryReports  =   function(action,item) {
       
        Utils.configurations().then(function(configData){

           $scope.action.entrylimit   =   parseInt(configData.action.stockPr.negativestock);
           if(item === 'search'){
                $scope.negativeInventory_data = [];
                 $scope.action.offset        =   0;
           }

           if(item === 'showmore'){
            
                $scope.action.currentpage++;
                $scope.action.offset    =   ( $scope.action.currentpage - 1) * $scope.action.entrylimit;

               
           }
           
           if(item === 'showless'){
            
             $scope.negativeInventory_data =  [];
                 $scope.action.currentpage   =   1;
                 $scope.action.offset        =   0;
                  $scope.action.entrylimit   =   parseInt(configData.action.stockPr.negativestock);
                   $scope.show_less_btn =  false;
                   $scope.show_more_btn =  true;   
           }

          

            var qry_strng   =   $scope.getQueryString();
                qry_strng.push('report_action=' + action); 
                qry_strng.push('page_lmt='+$scope.action.entrylimit+'&page_offset='+$scope.action.offset);

             if(qry_strng.length > 0)
                qry_strng  =   qry_strng.join('&');

            var inv_item    =   final_obj   =   y_labels    =   [];
            var tmp =   {};

            Data.get('/inventoryreports?'+qry_strng).then(function(data)
            {
               
              $scope.negativeInventory_data = $scope.negativeInventory_data.concat(data.inventoryData);

               if((($scope.action.offset == 0) && (data.inventoryData.length == 0) && (data.totalCount <= $scope.action.entrylimit)) ||  ($scope.negativeInventory_data.length == 0) ){
                    $scope.show_less_btn =  false;
                    $scope.show_more_btn =  false; 
               }
               if(( data.totalCount > $scope.negativeInventory_data.length )) {
                    $scope.show_less_btn =  false;
                    $scope.show_more_btn =  true;   
                }
               
               if((data.totalCount == $scope.negativeInventory_data.length) && ($scope.action.offset > 0 ) && ($scope.negativeInventory_data.length > 0)){
                    $scope.show_less_btn =  true;
                    $scope.show_more_btn =  false;   
                }

                },function(error){
            });

         }); 
    };

    $scope.getStatusReports  =   function(action,ordertype) {

        var qry_strng   =   $scope.getQueryString();

        $scope.data     =       [];
        $scope.data.selected            =   [];
        $scope.action.manual_order      =   [];
        $scope.action.transfer_order    =   [];
        $scope.action.push_order        =   [];   
        $scope.action.return_order      =   []; 
        $scope.action.dropship_order    =   [];
        $scope.action.receipt_order     =   [];

        if(action === 'order')
           var order_type =  "order_type=" + ordertype;
           qry_strng.push(order_type);

        if(action === 'count')
            $scope.count_data   =   [];

        qry_strng.push('report_action=' + action);

         if(qry_strng.length > 0)
            qry_strng  =   qry_strng.join('&');

        Data.get('/getstatusreport?'+qry_strng).then(function(data) {

            if(!data.error)
            {  
                angular.forEach(data, function(value, item){
                    var tmp =   {};
                    tmp.y   =   value.count;

                    if(action === 'count')
                    {
                        if(item._id.countStatus === 'validate')
                            tmp.key =   lang.validated;
                        if(item._id.countStatus === 'recount')
                            tmp.key =   lang.in_progress;
                        else if(item._id.countStatus === 'approve')
                            tmp.key =   lang.order.approved;
                        else
                            tmp.key =   item._id.countStatus;
                        
                        $scope.count_data.push(tmp);
                    }
                    else
                    {
                        tmp.key =   item; 
                       if(ordertype == 'MAN')
                                $scope.action.manual_order.push(tmp);
                                $scope.data.selected = $scope.action.manual_order;
                                $scope.action.active_order = 1;
                        if(ordertype == 'IBT_M')
                                $scope.action.transfer_order.push(tmp);
                        if(ordertype == 'PUSH')
                                $scope.action.push_order.push(tmp);
                        if(ordertype == 'RTN')
                                $scope.action.return_order.push(tmp);
                        if(ordertype == 'DROP_SHIP')
                                $scope.action.dropship_order.push(tmp);
                        if(ordertype == 'RECEIPT') 
                                $scope.action.receipt_order.push(tmp);   
                    }
                });
            }
        });
    };


    $scope.getCountStatus   =   function() {
        $scope.getStatusReports('count');
    };

    $scope.getOrderStatus = function(){
        $scope.getStatusReports('order','MAN');
        $scope.getStatusReports('order','IBT_M');
        $scope.getStatusReports('order','PUSH');
        $scope.getStatusReports('order','RTN');
        $scope.getStatusReports('order','DROP_SHIP');
        $scope.getStatusReports('order','RECEIPT');
    }

    $scope.getstatus = function(order_status){
        if(order_status === 'MAN')
            $scope.data.selected = $scope.action.manual_order;
        if(order_status === 'IBT_M')
            $scope.data.selected =  $scope.action.transfer_order;
        if(order_status === 'PUSH')
            $scope.data.selected = $scope.action.push_order;
        if(order_status === 'RTN')
            $scope.data.selected = $scope.action.return_order;
        if(order_status === 'DROP_SHIP')
            $scope.data.selected =  $scope.action.dropship_order;
        if(order_status === 'RECEIPT')
            $scope.data.selected = $scope.action.receipt_order;

    }
     $scope.NegativeInventory = function(){
       $scope.getNegativeInventoryReports('negativeInventory','search');
   }

    $scope.LowInventory = function(){
       $scope.getInventoryReports('lowInventory');
    }

    $scope.show_more   = function(){
        
        $scope.getNegativeInventoryReports('negativeInventory','showmore');
    }

   $scope.show_less   = function(){
        $scope.getNegativeInventoryReports('negativeInventory','showless');  
   }   

   $scope.get_negative_val = function(item){
        var balances = {};
        balances.sku_value = item; 
        balances.fromdate = $scope.form.fromdate; 
        balances.todate = $scope.form.todate;
        balances.locationId = $scope.ship.locationId;  
        sessionStorage.negbalances =JSON.stringify(balances);
        $state.go('ovc.stocklookup-list');

   }     
    location(function() {
      getLocation(function() {
      });
    });
   
});
