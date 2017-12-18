/*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module     :   Review Customer Order
*
*    Developer  :   Sivaraman
* 
*    Date       :   22/06/2016
*
*    Version    :   1.0
*
**********************************************************************/
var app = angular.module('OVCstockApp', [ 'ovcdataExport','vendorGroup']);

app.controller('reviewCustomerOrders', function($rootScope, $scope, $state, $http, $timeout, $controller,  $stateParams,  $filter,ovcDash, 
Data, CARRIERCODES, ORDERTYPELIST, ORDERSTATUS, system_settings, system_currencies, 
ovcdataExportFactory,VendorGroupService , Utils) {

	var reviewCustomer					= $stateParams.orderid;
	$scope.customerorders 				= {};
	$scope.customerorders.shippings		= {};
	$scope.newmodule					= {};
    $scope.newmodule.title              = "review";
	$scope.newmodule.ordertypes     	= [];
    $scope.newmodule.store_datas    	= [];
    $scope.newmodule.allstores      	= {};
    $scope.newmodule.uomvalues      	= {};
    $scope.newmodule.alluoms        	= {};
    var user_id                         = $rootScope.globals['currentUser']['username'];
    var currensymbs                     = $scope.ovcLabel.global.currency;
    var currcodes                       = system_currencies[0];
    var currencylist                    =   [];
    $scope.newmodule.currency           = currensymbs[currcodes.code];

	$scope.getcarriercodes = function(vendorid){
        var cardesc                     =   $scope.ovcLabel.customerOrder.carrier;
        var selected_vendor_carriers    =   $scope.customerorders.shippings[vendorid].carriercode;
        alphacodes                      =   [];
        angular.forEach(selected_vendor_carriers,function(citem,key) {
            angular.forEach(CARRIERCODES,function(item) {
                if(item.Name == citem){
                    var newobj         = {};
                    newobj.id          = item.Name; 
                    newobj.description = cardesc[item.Name];
                    alphacodes.push(newobj);   
                }     
                
            });
        });
        $scope.customerorders.shippings[vendorid].alphacodes = alphacodes;
    }

	$scope.getorderdata=function (){
        Utils.userLocation(1).then(function(results){
            if((results != '') && (results.status!='error')){
                $scope.newmodule.store_datas = results;
                var allstores                =   {};
                angular.forEach(results, function(item){
                    allstores[item.id]=  item.displayName;
                    currencylist[item.id]    =   item.currency;
                });

                $scope.newmodule.allstores  =   allstores;
            }
        });

        Data.get('/uom').then(function(results) {
            var uomdatas = [];
            angular.forEach(results, function(values) {
                if ((values.isActive) && (values.uomId != undefined) && (values.uomId != '') && (values.description != undefined) && (values.description != '')) {
                    var newobj = {
                        name: values.uomId,
                        id: values.uomId,
                        value: values.uomId
                    }
                    uomdatas.push(newobj);
                    $scope.newmodule.uomvalues[values.uomId]=values.uomId;
                }
            });
            $scope.newmodule.alluoms = uomdatas;
        },function(error){});

        if((reviewCustomer != undefined)){

            var orderresult =  {};
            
            Data.get('/dropship?id=' + reviewCustomer).then(function(data) {
                var orderno                              = data.purchaseOrderNumber;
                $scope.customerorders.ordertype          = data.purchaseOrderType;
                $scope.customerorders.contactName        = data.contactName;
                $scope.customerorders.toStreetName       = data.toStreetName;
                $scope.customerorders.toStreetNumber     = data.toStreetNumber;
                $scope.customerorders.toCity             = data.toCity;
                $scope.customerorders.toPostalCode       = data.toPostalCode;
                $scope.customerorders.toCountry          = data.toCountry;
                $scope.customerorders.toPhoneNumber      = data.toPhoneNumber;
                $scope.customerorders.allitems           = data.numberOfProducts;
                $scope.customerorders.allskus            = data.numberOfSKU;
                $scope.customerorders.allvendors         = data.numberOfVendors;
                $scope.customerorders.allstyles          = data.numberOfStyles,
                $scope.customerorders.alltotal           = data.totalPoCost;
                $scope.customerorders.allvat             = data.totalPoVAT;
                $scope.customerorders.alltax             = data.totalPoTax;
                $scope.customerorders.allsubtotal        = data.PoSubtotal;
                $scope.customerorders.specialInstructions= data.specialInstructions;
                $scope.customerorders.location           = data.location;
                $scope.customerorders.email              = data.email;
                $scope.customerorders.created            = data.created;
                $scope.customerorders.orderStatus        = data.orderStatus;
                $scope.customerorders.shippingaddress    = data.contactName+','+data.toStreetNumber+','+data.toStreetName+','+data.toCity+','+data.toPostalCode;
                $scope.customerorders.ordertype_label    = $scope.ovcLabel.customerOrder.customerorderslist[data.purchaseOrderType];
                $scope.customerorders.purchaseOrderNumber= data.purchaseOrderNumber;
                $scope.customerorders.originatedfrom     = $scope.newmodule.allstores[data.location];

                var selectedvendors                      = {};
                var vendorids                            = [];
                $scope.currency     =   currensymbs[currencylist[$scope.customerorders.location]];
                Data.get('/dropshipSKUs/' + orderno).then(function(results) {

                    var productlist = [];

                    angular.forEach(results, function(item,key) {
                   
                        var itemid      = item._id;
                        var quantities  = parseInt(item.qty);
                        var prcost      = parseFloat(item.productCost).toFixed(2);
                        var prtcost     = parseFloat(item.totalProductCost).toFixed(2);
                        var prttax      = parseFloat(item.totalProductTax).toFixed(2);
                        var prttotal    = prtcost+prttax;
                        if (item.isVat == '0' ) {
                            var totwithtax = parseFloat(prttotal).toFixed(2);
                        } else {
                            var totwithtax = parseFloat(item.totalProductCost).toFixed(2);
                        }
                        vendorids.push(item.vendorData['vendorId']);
                        selectedvendors[item.vendorData['vendorId']]=item.vendorData['carrierCode'];
                        var dataobj = {
                            lineNumber:item.lineNumber,
                            sku:item.SKU,
                            style:item.productCode,
                            description:item.productName,
                            selectedUOM:item.producUom,
                            cost:item.productCost,
                            productTax:    item.productTax,
                            productVat:item.productVat,
                            totalProductTax:  item.totalProductTax,
                            totalProductVat:  item.totalProductVat,
                            taxisVAT:  item.isVat,
                            qty: quantities,
                            totalnotax: prtcost,
                            variants: item.variants,
                            // waist: item.waist,
                            // length: item.length,
                            // size: item.size,
                            styleColor: item.styleColor,
                            styleDescription:item.styleDescription,
                            vendorid:item.vendorData['vendorId'],
                            vendor:item.vendorData['vendorId'],
                            vendorname:item.vendorData['vendorId'],
                            vendorOrderNumber:item.vendorData['vendorOrderNumber'],
                            carrierCode:item.vendorData['carrierCode'],
                            id:itemid,
                            styleDescription:item.styleDescription,
                            total: totwithtax
                           
                            }
                            productlist.push(dataobj);
                    });

                    $scope.customerorders.selectedvendors = selectedvendors;

                    $scope.newmodule.list                 = productlist;
                    $scope.newmodule.skuslist             = VendorGroupService.getvendorstylegroup( $scope.newmodule.list);
                    var vendorgroups                      = [];
                    $scope.customerorders.shippings       = {};
                    Data.post('/vendor',{
                            data:{
                                vendors:vendorids
                            }   
                    }).then(function (response) {

                        angular.forEach(response, function(values,key) {
                            var carrierdata   = [];
                            var carriers      = values.carrierAlphaCode;
                            carrierdata       = carriers.split(',');
                            var newobj        =  {
                                vendorid:values._id,
                                vendorname:values.companyName,
                                carriercode:carrierdata
                            }
                            $scope.customerorders.shippings[values._id] = newobj;
                            $scope.getcarriercodes(values._id);

                        });
                       
                    });

                    var createduser = data.createdBy;
                    ovcDash.get('apis/ang_username?user_id=' + createduser).then(function(userdata) {
                        if((userdata != undefined) && (userdata != '')){
                            var userdetail =    userdata.firstName + ' ' + userdata.lastName;
                        }
                        $scope.customerorders.createduser =   userdetail;
                    });
                     
                });
            });
        }

    }

    $scope.getorderdata();

});