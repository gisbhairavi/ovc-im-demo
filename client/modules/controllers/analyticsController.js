var app = angular.module('OVCstockApp',['ui.bootstrap.treeview', 'angular-circular-progress', 'widgetAuth']);


/* Popover for Inventory Details*/
app.directive('inventoryData', ['$compile', function($compile){
  return {
        restrict: 'E',
        scope : true,
        templateUrl: 'inventoryData.html',
        link: function(scope,elem,attrs){
          if(attrs.tabid){
          scope.tableid = attrs.tabid;
          }
        }
    };
}]);

app.controller('analyticsController', function($rootScope, $scope, $timeout, $window, $compile, $q, ovcDash,  Data,
  ANAYLTICSDATE, TreeViewService,CONSTANTS_VAR, RULEDEFN, DOCUMENTRULE,$stateParams,widgetAuthService, Utils){
  console.log($stateParams,'Query Parameter - controller');
  //IBM AUTH FUNCTIONS
    if($stateParams.type == 'ibm'){
      console.log($stateParams.tenantId ,'--Terentid-');
      console.log($stateParams.widgetDefinitionId ,'-widgetId-');
      console.log($stateParams._auth,'auth')
      var Query   = [];
          var tenantId            =   $stateParams.tenantId ? $stateParams.tenantId : '';
          var widgetDefinitionId  =   $stateParams.widgetDefinitionId ? $stateParams.widgetDefinitionId : '' ;
          var auth                =   $stateParams._auth ? $stateParams._auth : '';
          function getQueryStrings() { 
             var assoc  = {};
             var decode = function (s) { return decodeURIComponent(s.replace(/\+/g, " ")); };
             var queryString = location.hash.split('?')[1]; 
             var keyValues = queryString.split('&');
             for(var i in keyValues) { 
               var key = keyValues[i].split('=');
               if (key.length > 1) {
                 assoc[decode(key[0])] = decode(key[1]);
               }
             } 

             return assoc; 
          }
          var queryURL  = getQueryStrings();
          console.log(queryURL,'QUERYURLLLLLLLLLLLLLL');
           $rootScope.URL          =   queryURL.from ? queryURL.from: '';

          if(tenantId)
            Query.push('tenantId='+tenantId);
          if(widgetDefinitionId)
            Query.push('widgetDefinitionId='+widgetDefinitionId);
          if(auth)
            Query.push('_auth='+auth);

         

          $rootScope.ibmQueryString   = Query.length > 0 ?  Query.join('&') : '' ;

          console.log($rootScope.ibmQueryString,'IBMQUERY - Controller Construction');

      // if($stateParams.apiKey){
      //   widgetAuthService.getIbmAuth($stateParams.apiKey).then(function(userData){
      //     var deferred = $q.defer();
      //     if(!userData.error){
      //        $rootScope.globals.currentUser  = userData;
      //         deferred.resolve(
      //         analyticsConreoller());
      //     }else{
      //       $scope.noAuth   = true;
      //     }
      //   // });
      // }
      $rootScope.globals = {currentUser:{username:'oneview'}};
      analyticsConreoller();
    }else{
      $scope.noAuth   = false;
      analyticsConreoller();
    }
    
  function analyticsConreoller(){
    var userId                            = $rootScope.globals['currentUser']['username'];
  	$scope.analyticsControl 	            = {};
    $scope.analyticsControl.getresults    = {};
  	$scope.analyticsView 		              = {};
    $scope.analyticsView.searcheditems    = {};
    $scope.analyticsView.error            = {};
    $scope.analyticsView.fromDate         = '';
    $scope.analyticsView.toDate           = '';
    $scope.analyticsView.balancefields1   = [];
    $scope.analyticsView.balancefields2   = [];
    $scope.analyticsView.balancefields3   = [];
    $scope.analyticsView.balancefields31  = [];
    $scope.analyticsView.balancefields32  = [];
    $scope.analyticsView.balanceids1      = [];
    $scope.analyticsView.balanceids2      = [];
    $scope.analyticsView.balanceids3      = [];
    $scope.analyticsView.inventorydata    = {};
    $scope.analyticsView.inventoryDetails = [];
    $scope.analyticsView.showRoundBar     = false;
    $scope.analyticsView.showCaret        = true;
    $scope.analyticsView.analyticHeader   = true;
    $scope.analyticsView.displayDate      = $scope.translation.counts[0].start_date;
    $scope.analyticsView.currencylabel    = $scope.translation.currencylist[0];
    $scope.analyticsView.currencylist     = [];
    //$scope.analyticsView.showhover        = '';

  	$scope.controlFunction 		            = {};
    
    $scope.action                         = {};
    $scope.action.product                 = {};
    $scope.action.page                    = 1;
    
    $scope.matrixdata                     = {};
    $scope.matrixdata.styleitems          = {};
    $scope.matrixdata.skuitems            = {};
    $scope.matrixdata.skudetail           = {};
    $scope.matrixdata.showbalances        = false;
    $scope.matrixdata.childStore          = [];

    /**sorting list**/
    $scope.analyticsView.reverse      =   ''; 
    $scope.analyticsView.predicate    =   '';
    $scope.sort_by = function(predicate) {
        $scope.analyticsView.predicate        =   predicate;
        $scope.analyticsView.reverse          =   !$scope.analyticsView.reverse;
    };

    if($stateParams.type == 'ibm'){
      var analyticsBodyElement = angular.element( document.querySelector( '#analyticsbody' ) );
      analyticsBodyElement.removeClass('stk_sear').removeClass('product_padd'); 
      $scope.analyticsView.showCaret        = false;
      $scope.analyticsView.analyticHeader   = false;
    } 

	  //For User assigned location
  	function location(){
          Utils.userLocation(1).then(function(results){
            if(results && results.status!='error'){
                      $scope.analyticsControl.location = results;
      			}else{
      				$scope.analyticsControl.location = [];
                  }
      	    },function(error){
      	    	console.log('user location service Failed')
    	    });

          Utils.hierarchylocation().then(function(results){
              var locationlist ={};
              var locationobject = results.hierarchy;
              angular.forEach(locationobject, function(item) {
                  locationlist[item.id]   =   item.name;
                  $scope.analyticsView.currencylist[item.id]   = item.currency;
              });
              $scope.action.alllocations =  locationlist;
              $scope.storeLocData =   TreeViewService.getLocData(results);
              TreeViewService.toggleAll($scope.storeLocData[0]);
              TreeViewService.selectNode($scope.storeLocData[0]);
              $scope.analyticsView.locationDisplayName  =   $scope.storeLocData[0].name;
              $scope.analyticsView.locationId      =   $scope.storeLocData[0].id;
          },function(error){
              console.log('Hierarchy Location Error' + error);
          });
  	};
  	location();

    function getchildstores (callback){
      ovcDash.get('apis/ang_children_location?locationId='+ encodeURIComponent($scope.analyticsView.locationId)).then(function (results){
          if(results){
            var resultData  = results.location;
            var childstore  = {};
            var childlocations = [];

            angular.forEach(resultData, function(locationname){
              childlocations.push(locationname.id);
              childstore[locationname.name]   = 0;
             });

            $scope.matrixdata.childStore = childlocations;
            sessionStorage.analyticsinventdata   = JSON.stringify(childstore);
            callback();
          } 
      }); 
    }

    $scope.searchLocation = function(location){
        $scope.action.filterLocation    =   location;
        //getchildstores(location);
    };

    /******  Create Balance Table ********/

    var trule_con=RULEDEFN;
    var drule_con=DOCUMENTRULE;
    var tlab_bal=$scope.translation.transrules[0];
    var bal_info = $scope.translation.balanceinquiryinfo[0];
    var balance1=[];var balance2=[];var balance3=[]; var balance31=[]; var balance32=[]; var balance4 = []; var balance5  = [];
    var balance1id=[];var balance2id=[];var balance3id=[];
    var trlist=[];
    var trdata={};
    var trinobj=[];
    angular.forEach(trule_con,function(trules,key) {
      angular.forEach(trules,function(trules2,key2) {
        angular.forEach(trules2,function(item) {
          item.title=tlab_bal[item.Name];
          item.info = bal_info[item.Name];
          item.parent2='slpall';
          if(((key2=='BALFIELDS') || (key2== 'HELDSTOCK')) && (item.id != 'sonhand') ){
             item.selected=true;
             item.parent1='slpbalance';
             balance1.push(item);
             balance1id.push(item.id);
          }
          if((key2=='CALCFIELDS') || (item.id == 'sonhand')){
             item.selected=false;
             item.parent1='slpcalc';
             balance2.push(item);
             balance2id.push(item.id);
          }
        });
      });
      
    });
    $scope.analyticsView.balancefields1=balance1;
    $scope.analyticsView.balancefields2=balance2;
    $scope.analyticsView.balanceids1=balance1id;
    $scope.analyticsView.balanceids2=balance2id;
    
    angular.forEach(drule_con,function(drules,key) {
      angular.forEach(drules,function(drules2,key2) {
        angular.forEach(drules2,function(item) {
          item.title=tlab_bal[item.Name];
          item.info = bal_info[item.Name];
          item.parent1='slpdocs';
          item.parent2='slpall';
          item.selected=false;
           if((key2=='GOODSIN')){
          balance31.push(item);
          }
          if((key2=='GOODSOUT')){
          
          balance32.push(item);
          } 
          balance3.push(item);
          balance3id.push(item.id);
        });
      });
      
    });
    $scope.analyticsView.balancefields31=balance31;
    $scope.analyticsView.balancefields32=balance32;
    $scope.analyticsView.balancefields3=balance3;
    $scope.analyticsView.balanceids3=balance3id;

  	//Date Selection
  	var dateCodes 		= 	ANAYLTICSDATE;
  	var dateNames 		= 	$scope.translation.analyticsdatelist[0];
    var datelistData 	= 	[];

	  angular.forEach(dateCodes, function(item) {
        var purch 	= 	item.code;
        var porder 	= 	dateNames[purch];
        item.label 	= 	porder;
        datelistData.push(item);
    });

	  $scope.analyticsControl.Dateselection 		=	datelistData;


    $scope.controlFunction.dateLevelChange   = function(datelevel){

      $scope.analyticsView.datelevel  = datelevel;
      var fromDate,toDate;
       var currentdate          = new Date();
       if(datelevel)
           switch (datelevel) 
           {
               case 'Today':

                   fromDate = currentdate;
                   toDate   = currentdate;
                   break;

               case 'yesterday':

                   var d = new Date();
                   d.setDate(d.getDate() - 1);
                  
                   fromDate = d;
                   toDate   = currentdate;

                   break;
               case 'ThisWeek':

                   var first = currentdate.getDate() - currentdate.getDay(); // First day is the day of the month - the day of the week
                   var last = first + 6; // last day is the first day + 6

                   var fromDate  = new Date(currentdate.setDate(first));
                   var toDate    = new Date(currentdate.setDate(last));

                   break;
               case 'lastweek':

                   var  nextWeek  =  new Date (currentdate.setTime(currentdate.getTime() - 7 * 24 * 60 * 60 * 1000));

                   var firstDay        =   nextWeek.getDate() - nextWeek.getDay(); // First day is the day of the month - the day of the week
                   var lastDay         =   firstDay + 6;

                    var fromDate       =   new Date(nextWeek.setDate(firstDay));
                    var toDate        =   new Date(nextWeek.setDate(lastDay));
                  
                   break;
               case 'ThisMonth':
  
                   var fromDate = new Date(currentdate.getFullYear(), currentdate.getMonth(), 1);
                   var toDate   = new Date(currentdate.getFullYear(), currentdate.getMonth() + 1, 0);

                   break;
               case 'lastmonth':

                   var fromDate = new Date(currentdate.getFullYear(), currentdate.getMonth()-1, 1);
                   var toDate = new Date(currentdate.getFullYear(), currentdate.getMonth(), 0);

                   break;
               
           }  

           $scope.analyticsView.fromDate    = formatDate(fromDate);
           $scope.analyticsView.toDate      = formatDate(toDate);

    }

	  //Select product using sku and name
  	$scope.controlFunction.srchproduct = function(typedthings){
  		
  		var loc_id=$scope.analyticsView.locationId;
  	
  		if(typedthings != '...'){

  			var loc_id=$scope.analyticsView.locationId;
  			
  			if((loc_id != undefined)){
  				var sku=typedthings.split('~').length==3?true:'';
  				
  				ovcDash.get('apis/ang_search_products?srch='+typedthings+'&locid='+encodeURIComponent(loc_id)).then(function (data) {
  					
                      if (data.status != 'error') {
                          var rows = [];
                          var allvals = [];
                          var styleData = [];
                          var groupData = [];
                          var selectedbarcode = [];
                          var countbarcode = 0;
                          angular.forEach(data, function(item) {
                                 if (item.ProductTbl.mmGroupId && groupData.indexOf(item.ProductTbl.mmGroupId) == -1) {
                                  var value = item.ProductTbl.mmGroupName;
                                  rows.push({
                                      value: value,
                                      labelclass: 'search_products_group',
                                      labeldata:'Merchandise Group'
                                  });
                                  groupData.push(item.ProductTbl.mmGroupId);
                                  $scope.analyticsView.searcheditems[item.ProductTbl.mmGroupId] = item.ProductTbl;
                              } 
                              if (styleData.indexOf(item.ProductTbl.productCode) == -1) {
                                  var value = item.ProductTbl.productCode + '~' + item.ProductTbl.styleDescription;
                                  rows.push({
                                      value: value,
                                      labelclass:"search_products_style",
                                      labeldata: 'Style'
                                  });
                                  styleData.push(item.ProductTbl.productCode);
                                  $scope.analyticsView.searcheditems[item.ProductTbl.productCode] = item.ProductTbl;
                              } 
                              if (styleData.indexOf(item.ProductTbl.barCode) == -1) {
                                  var value = item.ProductTbl.sku+ '~' + item.ProductTbl.name + '~' +item.ProductTbl.barCode;
                                  rows.push({
                                      value: value,
                                      labelclass:"search_products_barcode",
                                      labeldata: 'Barcode'
                                  });
                                  styleData.push(item.ProductTbl.productCode);
                                  countbarcode ++;
                                  selectedbarcode[0] = value;
                                  $scope.analyticsView.searcheditems[item.ProductTbl.barCode] = item.ProductTbl;
                              } 
                                  var value = item.ProductTbl.sku + '~' + item.ProductTbl.name + '~' + item.ProductTbl.barCode
                                  rows.push({
                                      value: value,
                                      labelclass:"search_products_sku",
                                      labeldata: 'SKU'
                                  });
                                   $scope.analyticsView.searcheditems[item.ProductTbl.sku] = item.ProductTbl;
                             
                              
                          });
                          $scope.analyticsControl.autocomplete = rows;
                          
                      }
  				});
              }
  		}
  	};

  	//validation
  	$scope.validation      =   function(){
        var startdate, enddate;

        if($scope.analyticsView.datelevel == 'custom'){
            startdate = formatDate($scope.analyticsView.startDate) ;
            enddate   = formatDate($scope.analyticsView.endDate) ;
        }

        $scope.analyticsView.error  = {};
        $scope.analyticsView.errormsg={};
        try{
           
            if(($scope.analyticsView.locationId == undefined) || ($scope.analyticsView.locationId == '')){
                throw{'id': 'locationId', 'message' : 'Please select the Store'}
            }
            if( ($scope.analyticsView.product == undefined) || ($scope.analyticsView.product == '')) {
                throw{'id' : 'product', 'message' : 'Please select atleast one  Style or SKU or Barcode'};
            }
            if(startdate > enddate){
                throw{'id' : 'datevalid', 'message' : 'From Date must be smaller than or equal to To Date'};
            }
            
        }catch(error){
            
            $scope.analyticsView.error[error.id]=true;
            $scope.analyticsView.errormsg[error.id]=error.message;
            if(error.id){
                var id = error.id;
                 $window.document.getElementById(id).focus();
                document.getElementById(id).scrollIntoView("true");
            }
            // $location.hash('top');
            // $anchorScroll();
            $timeout(function(){$scope.analyticsView.error[error.id]  = false;},3000);
            return false;
        }
        return true;
    };

    function formatDate(date) {
        var d = '';
        if(CONSTANTS_VAR.DATE_FORMAT_VAL  == 'dd/MM/yyyy'){
            var codate = date.split("/");
            d = new Date(codate[1]+'/'+codate[0]+'/'+codate[2]);
        }else{
            d = new Date(date);
        }
        
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }

    $scope.analyticsControl.getresults  = function(){
        if ($scope.validation()) {
          getchildstores(function(){
             var startdate, enddate;

             if($scope.analyticsView.datelevel == 'custom'){
                if($scope.analyticsView.startDate && $scope.analyticsView.endDate){
                    startdate = formatDate($scope.analyticsView.startDate) ;
                    enddate   = formatDate($scope.analyticsView.endDate) ;
                }
                else{
                  startdate   = enddate = '';
                }
              }else{
                  startdate = $scope.analyticsView.fromDate ;
                  enddate   = $scope.analyticsView.toDate ;
              }
              var sku=$scope.analyticsView.product.split('~').length==3?true:'';
              var selecteditem = $scope.analyticsView.product.split('~');
              var selecteddata = {};
              $scope.matrixdata.showstyle=true;
              if(sku){
                  selecteddata = $scope.analyticsView.searcheditems[selecteditem[0]];
                 // $scope.matrixdata.styleitems = {locationId: $scope.analyticsView.locationId,  result: $scope.analyticsView.product, styleresult:selecteddata.productCode, mode:"readOnly"};
                  $scope.matrixdata.styleitems = {locationId: $scope.analyticsView.locationId,  result:'', styleresult:selecteddata.productCode, 
                  mode:"readOnly",isSKU : true , sku:selecteddata.sku,startDate:startdate,endDate:enddate};
              }else{
                  $scope.matrixdata.styleitems = {locationId: $scope.analyticsView.locationId,  result:'', styleresult:$scope.analyticsView.product,
                   mode:"readOnly",isSKU : false , sku:'',startDate:startdate,endDate:enddate};
              }
            
              $scope.$broadcast('get_analyticmatrix',$scope.matrixdata);
              $scope.analyticsView.product = '';
          });
        }
    }

    $scope.matrixdata.getselectedskudata   = function(values){

          $scope.analyticsView.sold     = values.sold;
          $scope.analyticsView.received = values.received;
          $scope.analyticsView.returned = values.returned;

          $scope.analyticsView.skuVarients      = {};
          $scope.analyticsView.priceDetails     = [];

          $scope.analyticsView.showRoundBar   = true;

          var locid = $scope.analyticsView.locationId;
          $scope.analyticsView.currency = $scope.analyticsView.currencylabel[$scope.analyticsView.currencylist[locid]]; 
          var skudetail = {};
          skudetail.skudata = {};
          ovcDash.get('apis/ang_loc_products?srch=' + values.sku + '&locid=' + encodeURIComponent(locid)).then(function(skudata) {
             if(skudata && skudata[0]  && skudata[0].ProductTbl){
                  var locskudata = skudata[0].ProductTbl;
                  skudetail.skudata.sku               = locskudata.sku || "";
                  skudetail.skudata.barCode           = locskudata.barCode  || "";
                  skudetail.skudata.length            = locskudata.length  || "";
                  skudetail.skudata.waist             = locskudata.waist|| "";
                  skudetail.skudata.size              = locskudata.size || "";
                  skudetail.skudata.color             = locskudata.color || "";
                  skudetail.skudata.description       = locskudata.description || "";
                  //skudetail.skudata.productCode       = locskudata.productCode|| "";
                 // skudetail.skudata.styleDescription  = locskudata.styleDescription|| "";
                  skudetail.invdata = {};
                  var newitem = {};
                  var item = {};
                  Data.get('/inventories?locationid='+encodeURIComponent(locid)+'&sku='+values.sku+'&fromdate='+$scope.matrixdata.styleitems.startDate+'&todate='+$scope.matrixdata.styleitems.endDate).then(function (invdata) {
                      if(invdata){
                          if(invdata[0]){
                            item = invdata[0];
                          }
                
                          angular.forEach($scope.analyticsView.balancefields2,function(bdata) {
                              if(bdata.label == 'wac'){
                                newitem[bdata.Name]=(typeof item[bdata.label] === 'undefined') ? 0 :  '$'+ parseFloat( item[bdata.label]).toFixed(2);
                              //newitem[bdata.Name]=(typeof item[bdata.label] === 'undefined') ? 0 :  $scope.currency +' '+ parseFloat( item[bdata.label]).toFixed(2);
                              }else{
                              newitem[bdata.Name]=(typeof item[bdata.label] === 'undefined') ? 0 : item[bdata.label];
                              }
                          });
                          angular.forEach($scope.analyticsView.balancefields1,function(bdata) {
                              newitem[bdata.Name]=(typeof item[bdata.label] === 'undefined') ? 0 : item[bdata.label];
                          });
                          angular.forEach($scope.analyticsView.balancefields3,function(bdata) {
                              newitem[bdata.Name]=(typeof item[bdata.label] === 'undefined') ? 0 : item[bdata.label];
                          });

                          skudetail.invdata = newitem;
                          //$scope.data  = 
                          $scope.matrixdata.skudetail   = skudetail;
                          if(Object.keys($scope.matrixdata.skudetail.invdata).length > 0){
                              $scope.matrixdata.showbalances = true;
                          }

                          var inventoryDetailsdata = {};
                          inventoryDetailsdata[values.sku] = {};

                          if (item.hasOwnProperty('storevalue')) {
                                
                            inventoryDetailsdata[item.sku] = {};

                            var Obj = item['storevalue'];
                            var noofstores=item['storevalue'].length;
                            if(noofstores >1){
                              $scope.analyticsView.showhover=true;
                            }else{
                              $scope.analyticsView.showhover=false;
                            }
                            for (var key in Obj) {
                              var rq_data = Obj[key];
                              for(var rq_key in rq_data){
                                if(rq_key != 'locationid'){

                                  if(!(rq_key in inventoryDetailsdata[item.sku])){
                                    inventoryDetailsdata[item.sku][rq_key] = {};
                                  }
                                  inventoryDetailsdata[item.sku][rq_key][rq_data.locationdisplayName] = rq_data[rq_key];
                                }
                                
                              }
                            }
                          }
                          $scope.analyticsView.inventoryDetails = [];
                          $scope.analyticsView.inventoryDetails.push(inventoryDetailsdata);
                      }
                  },function(error){

                  });

                  var startdate, enddate;
                  if($scope.analyticsView.datelevel == 'custom'){
                      startdate = formatDate($scope.analyticsView.startDate) ;
                      enddate   = formatDate($scope.analyticsView.endDate) ;
                  }else{
                      startdate = $scope.analyticsView.fromDate ;
                      enddate   = $scope.analyticsView.toDate ;
                  }

                  var searchobject = {
                    "sku"     :values.sku,
                    "loc"     :locid,
                    "fromDate":startdate,
                    "toDate"  :enddate,
                    "config"  :'active'
                  };

                  ovcDash.post('apis/ang_getproductprice',{data:searchobject}).then(function(pricelist) {
                      if(pricelist.status == 'error'){
                        var output = {
                            "status": "error",
                            "message": "No product price for this SKU"
                        };
                        Data.toast(output);
                        return false;
                      }
                      if (pricelist){
                         var pricedetails = [];
                         angular.forEach(pricelist,function(item) {
                            pricedetails.push(item.ProductPrice);
                         });
                         $scope.analyticsView.priceDetails =  pricedetails;   
                      }
                  },function(error){

                  });

                  ovcDash.get('apis/ang_getSkuProperties?srch=' + values.sku).then(function(skuvarients) {
                      if(skuvarients.status == 'error'){
                        var output = {
                            "status": "error",
                            "message": "No sku properties found"
                        };
                        $scope.matrixdata.showskuVarients = true;
                        $scope.analyticsView.skuVarients  = {};
                        $scope.analyticsView.skuVarients['SKU']      = values.sku;
                        Data.toast(output);
                        return false;
                      }
                      if(skuvarients){
                        if(skuvarients[0]){
                          var skuVarients   = skuvarients[0].properties ? skuvarients[0].properties : {};
                        }else{
                          var skuVarients   =  {};
                        }
                        $scope.matrixdata.showskuVarients = true;
                        $scope.analyticsView.skuVarients = skuVarients;
                        $scope.analyticsView.skuVarients['SKU']      = values.sku;
                      }
                  },function(error){

                  });
             }
          },function(error){

          }); 

    };

    $scope.analyticsView.SelectedInventory = '';
    $scope.hoverIn = function(sku,val) {
      $scope.analyticsView.SelectedInventory = val;
      $scope.analyticsView.inventoryData1 = {};
      $scope.analyticsView.showhover=true;
      if ($scope.analyticsView.inventoryDetails[0][sku][val]) {
        $scope.analyticsView.inventoryData1 = $scope.analyticsView.inventoryDetails[0][sku][val];
        sessionStorage.analyticsinventdata   = JSON.stringify($scope.analyticsView.inventoryData1);
      }
      else{
        if(sessionStorage.analyticsinventdata){
          $scope.analyticsView.inventoryData1  =  JSON.parse(sessionStorage.analyticsinventdata);
        }
      }
      $scope.analyticsView.invavaillength = Object.keys($scope.analyticsView.inventoryData1).length;  
    };

    $scope.hoverOut = function() {  
      $scope.analyticsView.SelectedInventory = '';                    
    };                       
  }
});