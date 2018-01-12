var app = angular.module('OVCstockApp', ['ui.bootstrap.treeview','ovcdataExport','Utils']);
/*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module     :   Reports Common Controller
*
*    Developer  :   Sivaprakash
* 
*    Date       :   01/03/2017
*
*    Version    :   1.0
*
**********************************************************************/

app.controller('reportController', ['$rootScope','$scope', '$http', '$state', '$stateParams', 'Utils','TreeViewService','ovcDash','Data', 'ovcdataExportFactory', '$timeout','$filter', function ($rootScope, $scope, $http, $state, $stateParams, Utils, TreeViewService, ovcDash, Data, ovcdataExportFactory, $timeout, $filter) {
    var report 		    =	  this;
    report.dataSet 	  =	  {};
    report.form 	    =	  {};
    report.action 	  =	  {};
    report.error 	    =	  {};
    report.errorMsg   =	  {};
    $scope.action 	  =	  {};
    $scope.location   =   {};
    report.dataSet.entryLimit       =   $rootScope.PAGE_SIZE;
    report.dataSet.currentuser       =   $rootScope.globals.currentUser;
    report.dataSet.offset           =   0;
    report.form.product             =   '';
    report.form.selectedStatusBalance   = [];
    report.form.affectedBalance     = 1;
    ovcdataExportFactory.resetPdfHeaderData();
    if($stateParams){
      var stateParam  =   $stateParams;
    }
    //****Delete Session****//
    if($stateParams.fullList){
        delete sessionStorage.BalancereportSession;
    }

    $rootScope.$broadcast('cfpLoadingBar:completed');
    //****Label for Balance Report Controller Use****//
    var BalanceLabel 	=	$scope.ovcLabel.balanceReport;
    var pdfLabels     = $scope.ovcLabel.balanceReport.pdfLables;

    //****Data Set For Date Range Selection****//
    report.dataSet.date 	=	$scope.ovcLabel.balanceReport.dateSelection;
    var locNameObj  = {};
    //***** Get Hierarchy Locations From Utils****//
    function locationDefault (){
      var hierarchyLocations  = Utils.hierarchylocation();
      hierarchyLocations.then(function(locationData){
        report.dataSet.HierarchyLocation  = locationData;
        angular.forEach(locationData.hierarchy, function(loc){
          locNameObj[loc.id]  = loc.name;
        });
        report.dataSet.locNameObj   =  locNameObj;
        $scope.storeLocData   =   TreeViewService.getLocData(locationData);
          if(sessionStorage.BalancereportSession){
            $timeout(function() {
                $scope.checkBoxSelect($scope.storeLocData[0], true, report.form.location.join());
                $scope.addSelectedClass($scope.storeLocData[0], true, report.form.location.join());
              $timeout(function(){
                report.action.searchReport(report.form);
              }, 500);
            }, 300);
          }else{
              $scope.checkBoxSelect($scope.storeLocData[0]);
              $scope.addSelectedClass($scope.storeLocData[0]);
          }
      });
    }

    //****Get Configurartion From Utils****//
    var configuration	=	Utils.configurations();
    configuration.then(function(configData){
    	if(configData){
    		report.dataSet.config 	=	configData;
    	}
    });

    //****Get roles From Utils****//
    function  rolesDataLoad(){
      report.form.selectedBalance     =   [];
      //****TO Get The Role Data Process ****//
	    var Roles 		=	Utils.roles();
	    Roles.then(function(RolesData){
	    	report.dataSet.RolesData 	=	RolesData;
	    	if(RolesData && RolesData.permissionsData && RolesData.permissionsData.stockLookup){
	    		var balance 	  =	RolesData.permissionsData.stockLookup;
  				var tempArray 	=	[],selecttempArray = [];
  				angular.forEach(balance, function(value ,key){
  					if(value){
  						if(BalanceLabel.balanceTypeDrop[key]){
  							var tempObj	=	{};
  							tempObj.code 	=	key;
  							tempObj.id 		=	key;
  							tempObj.name 	=	BalanceLabel.balanceTypeDrop[key];
  							tempArray.push(tempObj);
  						}
  					}
  					if(value){
                if(BalanceLabel.balanceTypeDrop[key]){
    						var tempObj	=	{};
    						tempObj.code 	=	key;
    						tempObj.id 		=	key;
                tempObj.selected = true;
    						tempObj.name 	=	BalanceLabel.balanceTypeDrop[key];
    						selecttempArray.push(tempObj);
    					}
            }
  				});
  				report.dataSet.balanceType 	=	  tempArray;
          if(!sessionStorage.BalancereportSession){
  				  report.form.selectedBalance =   selecttempArray;
          }
	    	}
	    });
      
      if(stateParam.reportType != 'status'){
        var tranNameList  = [];

        Data.get('/transactiontype').then(function (tranResult) {
          angular.forEach(tranResult, function(tranvalues) {
            if(tranvalues.tranName != undefined){
              tranNameList[tranvalues.tranTypeId]   =   tranvalues.tranName;
            }
          });
        });
        
        Data.get('/documenttype').then(function (docResult) {
          angular.forEach(docResult, function(docvalues) {
            if(docvalues.directiveName){
              tranNameList[docvalues.directiveTypeId]   =   docvalues.directiveName;
            }
          });
        });

        report.dataSet.tranNameArray  =  tranNameList;
        //**** Having Session Storage To load ****//
        if(sessionStorage.BalancereportSession){
          var sessionBalance   = JSON.parse(sessionStorage.BalancereportSession);
          report.form          = sessionBalance;
        }
      }
	  };
    $scope.sort_by = function(predicate) {
        $scope.predicate        =   predicate;
        $scope.reverse          =   !$scope.reverse;
    };
    //****autoCompleted Typed Date****//
    report.action.typedData 	= function(typedData){
      var loc_id                =   $scope.location.id  ? $scope.location.id.join(',') : '';
      report.error['product']   =   false;
    	if(loc_id && typedData){
	    	ovcDash.get('apis/ang_search_products?srch='+typedData+'&locid='+ encodeURIComponent(loc_id)).then(function (data) {
	            if (data.status != 'error') {
	                var rows 		    = 	[];
	                var allvals 	  = 	[];
	                var styleData 	= 	[];
	                var groupData 	= 	[];
	                var selectedbarcode  = [];
	                var countbarcode 	   = 0;
	                angular.forEach(data, function(item) {
	                    if ((styleData.indexOf(item.ProductTbl.productCode) == -1) && (report.dataSet.config.showskugroup)) {
	                        var value = item.ProductTbl.productCode + '~' + item.ProductTbl.styleDescription;
	                        rows.push({
	                            value: value,
	                            labelclass:"search_products_style",
	                            labeldata: 'Style'
	                        });
	                        styleData.push(item.ProductTbl.productCode);
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
	                    } 
	                        var value = item.ProductTbl.sku + '~' + item.ProductTbl.name + '~' + item.ProductTbl.barCode
	                        rows.push({
	                            value: value,
	                            labelclass:"search_products_sku",
	                            labeldata: 'SKU'
	                        });
	                   
	                    allvals.push(item.ProductTbl);
	                });
	                report.dataSet.autoCompleted = rows;

	                //For empty the acto complete Data and proper error message
	                if(!report.form.product){

	                  	report.dataSet.autoCompleted = 	[];
	                }
	            }else{
	                var output = {
	                  "status": "error",
	                  "message": $scope.ovcLabel.balanceReport.toast.no_product
	                };
	                report.dataSet.autoCompleted 	= 	[];
	               	report.form.product 			=	'';
	               	Data.toast(output);
	            }
			  },function(error){
			  });
	    }else{
	    	report.dataSet.autoCompleted 	= 	[];
	        report.form.product 			  =	  '';
	    }
    };

    //****Validation of Form****//
    function validation(form){
        var errorArray  =   [];
            if($scope.location.id.length == 0){
                errorArray.push({'id': 'store', 'message' : $scope.ovcLabel.balanceReport.error.select_store});
            }
            if(!form.dateRange){
                errorArray.push({'id' : 'DateRange', 'message' : $scope.ovcLabel.balanceReport.error.select_dateRange});
            }else{
           		if(form.dateRange == 'custom' && !form.startDate && !form.endDate){
                errorArray.push({'id' : 'DateFilter', 'message' : $scope.ovcLabel.balanceReport.error.select_date});
           		}else if (form.dateRange == 'custom'){
           			if(!($filter('dateFormChange')(form.startDate) <= $filter('dateFormChange')(form.endDate))){
                	errorArray.push({'id' : 'DateCheck', 'message' : $scope.ovcLabel.balanceReport.error.date});
           			}
           		}
            }
            if(errorArray.length > 0){
              angular.forEach(errorArray,function(error){
                  report.error[error.id]=true;
                  report.errorMsg[error.id]=error.message;
              });
              return false;
            }
        return true;
    };

    //****Get Changed Date Range****//
    report.action.changedDateRange 	=	function(date){
    	report.error['DateRange']   =   false;
    };

    //****Common Search Function in Report****//
    report.action.searchReport 	=	function(formData){
    	if(validation(report.form)){
        var date = new Date();
        var fromDate,toDate;
        var loc           =   $scope.location.id.join(',');
        var skuvalue      =   formData.product.split('~');
        var search        =   skuvalue[0];
        var sku           =   skuvalue.length == 3 ? true : "";
        var balanceType   =   [];

        //only for Redirect Part
        formData.location       = $scope.location.id ? $scope.location.id : [];

        switch(formData.dateRange) {
            case 'today':
              fromdate  = new Date();
              fromdate.setHours(0,0,0,0);
              todate    = new Date();
              todate.setHours(23,59,59,999);
              break;
            case 'yesterday':
              todate = fromdate = new Date(new Date().setDate(new Date().getDate()-1));
              break;
            case 'month':
              fromdate = new Date(new Date().getFullYear(), new Date().getMonth()-1, new Date().getDate());
              todate   = new Date();
              break;
            case 'threemonth':
              fromdate = new Date(new Date().getFullYear(), new Date().getMonth()-3, new Date().getDate());
              todate   = new Date();
              break;
            case 'custom':
              fromdate = $filter('dateFormChange')(formData.startDate);
              todate   = $filter('dateFormChange')(formData.endDate);
              break;
        }
        if(formData.selectedBalance.length > 0){
          angular.forEach(formData.selectedBalance, function(value){
            balanceType.push(Balacekeys[value.id]);
          });
        }

        if(sessionStorage.BalancereportSession){
          delete sessionStorage.BalancereportSession;
        }

        var curDate         = new Date();
        var getTimeMilliSec = curDate.getTime();

        var serviceData   =   {"locations":loc,
                              "srch":search,
                              "sku":sku,
                              "todate":todate,
                              "affectedBalance" : formData.affectedBalance ? 1 : "",
                              "fromdate":fromdate,
                              "page_lmt":report.dataSet.entryLimit,
                              "page_offset":report.dataSet.offset,
                              "balanceType":balanceType.join(','),
                              // "fileName":getTimeMilliSec
                              };

        report.dataSet.balanceService  = serviceData;
        Data.post('/getBalanceReport',{data:serviceData}).then(function(result){
            if(result){
                report.dataSet.balanceData =  result.data;
                report.dataSet.totalItems  =  result.skustockcount;
                report.dataSet.showError   =  result.skustockcount > 0 ? true : false;
                report.dataSet.showtable   =  true;
                pdfDataSet(formData);
                if(!report.dataSet.showError){
                  formData.product  = '';
                }
            }else{
                var output = {"status": "error","message": $scope.ovcLabel.balanceReport.error.pblm_service};
                Data.toast(output);
            }
        });

        
    	}
    };

    $scope.exportExcelData1  = function(){
      $timeout(function(){
        $.LoadingOverlay("hide");
        $rootScope.progressdownload   = true;
      }, 1000);
      Data.post('/getBalanceReportExcel', {data:report.dataSet.balanceService}).then(function(result){
          console.log(result , 'RESULTDATA');
          $rootScope.progressdownload   = false;
        if(result.status == 'success'){
          $timeout(function(){
            $rootScope.$broadcast('Notify', {date:result.date});
          }, 0);
        }else {
            var output = {"status": "error","message": $scope.ovcLabel.balanceReport.error.pblm_service};
            Data.toast(output);
        }
      });
    }

    function selectedPropertyClear(){
      if(report.dataSet && report.dataSet.propertyvalue &&  Object.keys(report.dataSet.propertyvalue.productProperty).length > 0){
        angular.forEach(report.dataSet.propertyvalue.productProperty, function(provalue,prokey){
          if(provalue)
            provalue.reset  = true;
          });
      }
    }
    $scope.rangeValidation = function(){
      $scope.isInvalidRange = {};
      if ((report.form.toQuantity && report.form.fromQuantity) && (report.form.toQuantity < report.form.fromQuantity)){
          $scope.isInvalidRange.qty = true;return false;
      }
      return true;
    };

    //==========Status Report Search================//
    report.action.searchStatusReport    =    function(StatusData){
      if($scope.location.id && $scope.location.id.length > 0 || $scope.location.group && $scope.location.group.length > 0){
        var skuvalue      =   StatusData.product.split('~');
        var search        =   skuvalue[0];
        var sku           =   skuvalue.length == 3 ? true : "";
        // var merchandiseData   = $scope.location.storeId && $scope.location.storeId.length > 0 ? $scope.location.storeId.join(',') : '';
        
        //=====Slected balanceType Array=====//
        var balanceType   =   [];
        if(StatusData.selectedStatusBalance.length > 0){
          angular.forEach(StatusData.selectedStatusBalance, function(value){
            balanceType.push(Balacekeys[value.id]);
          });
        }
        if(balanceType.length == 0){
          var output = {"status": "error","message": $scope.ovcLabel.statusReport.error.selectBalanceType};
          Data.toast(output);
          return false;
        }
        if($scope.rangeValidation()){
          var serviceData   =   {
                                "locations":$scope.location.id && $scope.location.id.length > 0 ? $scope.location.id : [] ,
                                "srch":search,
                                "sku":sku,
                                "fromQuantity":StatusData.fromQuantity,
                                "toQuantity":StatusData.toQuantity,
                                "page_lmt":report.dataSet.entryLimit,
                                "page_offset":report.dataSet.offset,
                                "balanceType":balanceType};
          Data.post('/getStatusReport',{data:serviceData}).then(function(result){
            var finalData  = [];
            if(result.data && result.data.length > 0){
              StatusReportPdfSet(serviceData);
              report.dataSet.statusReport   = result.data;
              report.dataSet.showstatus     = true;
              report.dataSet.errorData      = false;
              report.dataSet.totalItems     = result.count;
              report.dataSet.showError      = result.count;
            }else{
              report.dataSet.showstatus     = false;
              report.dataSet.errorData      = true;
              report.dataSet.statusReport   = [];

            }
          }, function(error){
            console.log('getStatusReport Error :' + error);
          });
        }
      }else{
        var output = {"status": "error","message": $scope.ovcLabel.statusReport.error.selectLocation};
        Data.toast(output);
      }
    };

  //****Common Reset Function*****//
  report.action.reset 	=	function(){
  	report.form 		            =	 {};
    report.error                =  {};
  	$scope.locationDisplayName  =  '';
    $scope.locationId   		    =  '';
    report.dataSet.balanceData  =  [];
    report.dataSet.showError    =  false;
    report.dataSet.showtable    =  false;
    report.form.affectedBalance =  1;
    ovcdataExportFactory.resetPdfHeaderData();
    delete sessionStorage.BalancereportSession;
  	rolesDataLoad();
    locationDefault();
  };

  //****Reset Functionality For status Report****//
  report.action.resetStatusReport   = function(){
    report.form                     =  {};
    report.form.selectedStatusBalance   = [];
    $scope.isInvalidRange = {};
    report.error                    =  {};
    $scope.locationDisplayName      =  '';
    $scope.location                 =  {};
    report.dataSet.statusReport     =  [];
    $scope.basiclookup              =  false;
    report.dataSet.showstatus       =  false;
    report.dataSet.errorData        =  false;
    report.dataSet.showError        =  false;
    report.dataSet.entryLimit       =  $rootScope.PAGE_SIZE;
    report.dataSet.offset           =  0;
    selectedPropertyClear();
    rolesDataLoad();
    locationDefault();
  };

  //****location Filteration****//
  report.action.searchLocation = function(location){
    $scope.action.filterLocation    =   location;
  };

  //****Merchandise Filteration****//
  $scope.searchSecondLocation   =   function(merchandise){
    $scope.action.filter        =   merchandise;
  }
  //****Location Blur Function****//
  report.action.hideError   = function(){
    $timeout(function(){
      if($scope.locationId){
        report.error['store']           =   false;
      }
    }, 500);
  };

  //****Common Date Change Function****//
  report.action.ChangeData   =   function(){
    if(report.form.startDate || report.form.endDate){
      report.error['DateFilter']  = false;
    }
    if(report.form.startDate && report.form.endDate){
      report.error['DateRange']   = false;
    }
  };

  //****Get Selected Balance To tooltip****//
  report.action.getSelecteditem = function(item){
      var tempname =  [];
      angular.forEach(item,function(value,key){
          if(tempname.indexOf(value.name) == -1){
              tempname.push(value.name);
          }
      });
      var selectedname = tempname.join(",");
      return selectedname;
  };

  //****Page Changed Function****//
  report.action.pageChanged  =   function(){
    report.dataSet.offset    =   (report.dataSet.currentPage - 1) * report.dataSet.entryLimit;
    if(stateParam.reportType == 'status')
      report.action.searchStatusReport(report.form);
    else
      report.action.searchReport(report.form);
  };

  //****For Send Balance Keys TO Servcie****//
  var Balacekeys = {
    "viewOnHand":"oh",
    "viewAllocated":"allocated",
    "viewReserved":"reserved",
    "viewHeld":"held",
    "viewReturnToVendor":"returnToVendor",
    "viewAts":"ats",
    "viewAtp":"atp",
    "viewWac":"wac",
    "viewOpenOnOrderIn":"openOnOrderIn",
    "viewOpenOnOrderOut":"openOnOrderOut",
    "viewConfirmedIn":"confirmedOrdersIn",
    "viewConfirmedOut":"confirmedOrdersOut",
    "viewAsnIn":"asnIn",
    "viewAsnOut":"asnOut",
    "viewInTransitIn":"transferIn",
    "viewInTransitOut":"transferOut"
  };

  report.dataSet.balanceTable   = {
    "oh":"On Hand",
    "allocated":"Allocated",
    "reserved":"Reversed",
    "held":"Held",
    "returnToVendor":"Return To Vendor",
    "ats":"Available To Sell",
    "atp":"Available To Promise",
    "wac":"Wac",
    "openOnOrderIn":"Open On Order In",
    "openOnOrderOut":"Open On Order Out",
    "confirmedOrdersIn":"Confirmed In",
    "confirmedOrdersOut":"Confirmed Out",
    "asnIn":"Asn In",
    "asnOut":"Asn Out",
    "transferIn":"In Transit In",
    "transferOut":"In Transit Out"
  };

  //****For Redirection Action****//  
  report.action.redirect  = function(form, tranId){
    sessionStorage.setItem('BalancereportSession', JSON.stringify(form));
    $state.go('ovc.transaction-detail',{trannum:tranId});//tranDetails
  };


  function pdfDataSet(pdfData){
    /*************PDF Export******************/
        var pdf_data = [];

        if(pdfData.product)
        {
            var searchData  =   pdfData.product.split('~');
            var search      =   searchData[0];
            var obj     =   {};
            obj.label   =   pdfLabels.search || '';
            obj.value   =   search;
            pdf_data.push(obj);
        }

        if($scope.location.title)
        {
            var obj =   {};
            obj.label   =   pdfLabels.store || '';
            obj.value   =   $scope.location.title;
            pdf_data.push(obj);
        }

        if(pdfData.dateRange)
        {
            var obj     =   {};
            obj.label   =   pdfLabels.dateRange || '';
            obj.value   =   report.dataSet.date[pdfData.dateRange];
            pdf_data.push(obj);
        }

        if(pdfData.selectedBalance.length > 0)
        {
          var temp  = [];
          angular.forEach(pdfData.selectedBalance, function(value){
            temp.push(value.name);
          });
          var obj     =   {};
          obj.label   =   pdfLabels.balanceType || '';
          obj.value   =   temp.join(',');
          pdf_data.push(obj);
        }

        if(pdfData.startDate)
        {
            var obj     =   {};
            obj.label   =   pdfLabels.startDate || '';
            obj.value   =   pdfData.startDate;
            pdf_data.push(obj);
        }

         if(pdfData.endDate)
        {
            var obj     =   {};
            obj.label   =   pdfLabels.endDate || '';
            obj.value   =   pdfData.endDate;
            pdf_data.push(obj);
        }

         var obj     =   {};
         obj.label   =   pdfLabels.userId || '';
         obj.value   =   report.dataSet.currentuser.firstname;
         pdf_data.push(obj);

        if(pdf_data.length > 0)
            ovcdataExportFactory.setPdfHeaderData(pdf_data);
          
        /*************PDF Export******************/
  }

  function StatusReportPdfSet(statusData){

      /*************PDF Export******************/
        var pdf_data = [];

        if(statusData.srch)
        {
            var obj     =   {};
            obj.label   =   "SKU / Style" || '';
            obj.value   =   statusData.srch;
            pdf_data.push(obj);
        }

        if($scope.location.title)
        {
            var obj =   {};
            obj.label   =   "Store" || '';
            obj.value   =   $scope.location.title;
            pdf_data.push(obj);
        }

        if(statusData.fromQuantity)
        {
            var obj     =   {};
            obj.label   =   "From Quantity" || '';
            obj.value   =   statusData.fromQuantity;
            pdf_data.push(obj);
        }

         if(statusData.toQuantity)
        {
            var obj     =   {};
            obj.label   =   "To Quantity" || '';
            obj.value   =   statusData.toQuantity;
            pdf_data.push(obj);
        }

        if(statusData.balanceType.length > 0)
        {
          var temp  = [];
          angular.forEach(report.form.selectedStatusBalance, function(value){
            temp.push(value.name);
          });
          var obj     =   {};
          obj.label   =   "Balance Type" || '';
          obj.value   =   temp.join(',');
          pdf_data.push(obj);
        }
         var obj     =   {};
         obj.label   =   pdfLabels.dateTime || '';
         obj.value   =   new Date().toLocaleDateString();;
         pdf_data.push(obj);

         var obj     =   {};
         obj.label   =   pdfLabels.userId || '';
         obj.value   =   report.dataSet.currentuser.firstname;
         pdf_data.push(obj);
        
        if(pdf_data.length > 0)
            ovcdataExportFactory.setPdfHeaderData(pdf_data);
        /*************PDF Export******************/
  }

  //****Default Load Function****//
  rolesDataLoad();
  locationDefault();
}]);