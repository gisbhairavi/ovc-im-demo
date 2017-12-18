
/*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module     :   Reverse Receipt
*
*    Developer  :   Sivaprakash
*
*    Date       :   03/02/2016
*
*    Version    :   1.0
*
**********************************************************************/
angular.module('OVCstockApp').directive('reverseReceipt', ['$compile', 'Data', '$filter', '$state', '$rootScope', 'REVERSEREASONS','Utils',  function ($compile, Data, $filter, $state, $rootScope, REVERSEREASONS,Utils) {

	return {
        restrict: 'EA',
        scope : false,
        replace:true,
        link: function (scope, elem, attrs) {
			
          var ordercodes  = scope.translation.reasonlist[0];
          var cordercodes = REVERSEREASONS;
          var pordercodes = [];
            angular.forEach(cordercodes, function(item) {
               var purch  = item.code;
               var porder = ordercodes[purch];
               item.id    = purch;
               item.name  = porder;
               pordercodes.push(item);
            });
          scope.reason_codedata = pordercodes;

            /**For First load the Directive**/
            // scope.pack_reverse  =   false;

        	  scope.cancelReverse     =	function() {
              scope.pack_reverse  =   false;
        	  };
            
            scope.date  =  new Date();

            /*User Details*/
            var fname   = $rootScope.globals.currentUser.firstname;
            var lname   = $rootScope.globals.currentUser.lastname;
            scope.reverse_user  = fname + ' ' + lname;
            scope.showreceive    = true;
            /*reverse Button Function*/
            scope.reverse_package   =   function(rev_pack){
                scope.showreceive   = false;
                scope.rev_packid    = rev_pack.packageid;
                scope.rev_data      = rev_pack.asn;
               
                if(rev_pack.asn &&  rev_pack.asn.packages && rev_pack.asn.packages[rev_pack.packageid] && 
                  rev_pack.asn.packages[rev_pack.packageid].receiveduser){
                  var fname   = rev_pack.asn.packages[rev_pack.packageid].receiveduser.firstName ? 
                                rev_pack.asn.packages[rev_pack.packageid].receiveduser.firstName : "";
                  var lname   = rev_pack.asn.packages[rev_pack.packageid].receiveduser.lastName ? 
                                rev_pack.asn.packages[rev_pack.packageid].receiveduser.lastName : "";
                  scope.received_user = fname + ' ' + lname;
                }else{
                  scope.received_user = "";
                }
                if(rev_pack.asn &&  rev_pack.asn.packages && rev_pack.asn.packages[rev_pack.packageid])
                  scope.receiptDate = (rev_pack.asn.packages[rev_pack.packageid].receivedDate) ? rev_pack.asn.packages[rev_pack.packageid].receivedDate : "";

                /*Data to reverse html*/
                scope.pack_reverse  =   true;
                scope.reverse_data	=	[];
				        scope.reverse_data.push(scope.rev_data);
            };

            //Style Group Config//
            var Congiguration   =   Utils.configurations();
            Congiguration.then(function(configuration){
                if(configuration){
                    scope.configData    =   configuration;
                }
            });

            /*save the reverse receipt*/
            scope.savereverse   =   function(save_reverse){
              if(scope.res_code_data){
                $.confirm({
                      title: scope.ovcLabel.asnPackage.popUp.reverseTitle,
                      content: scope.ovcLabel.asnPackage.popUp.reverseConent + '?',
                      confirmButtonClass: 'btn-primary',
                      cancelButtonClass: 'btn-primary',
                      confirmButton: scope.ovcLabel.asnPackage.popUp.Ok,
                      cancelButton: scope.ovcLabel.asnPackage.popUp.cancel,
                      confirm: function () {
                          var final_data  =  receipt_data  = [];
                             
                              angular.forEach(save_reverse, function(reverse_detail){
                               
                                if(reverse_detail.packages){
                                  angular.forEach(reverse_detail.packages, function(packages,packageId){
                                   if(scope.rev_packid  == packageId){
                                      var tmp_obj                 =   {};
                                      tmp_obj.reasonCode          =   scope.res_code_data;
                                      tmp_obj.packageId           =   packageId;
                                      tmp_obj.asnId               =   reverse_detail.asnId;
                                      tmp_obj.status              =   'shippedReversed';
                                      if(reverse_detail.purchaseOrderType == 'MR_MAN' || reverse_detail.purchaseOrderType == 'MR_IBT_M'){
                                        tmp_obj.status            =   'receiveInProgress';
                                      }
                                      tmp_obj.purchaseOrderType   =   reverse_detail.purchaseOrderType;
                                      tmp_obj.itemStatus          =   [];
                                      angular.forEach(packages.skus, function(styles){
                                          angular.forEach(styles.skuArr, function(skudatas){
                                              tmp_obj.itemStatus.push(skudatas);
                                          });
                                      });
                                      
                                        final_data.push(tmp_obj);
                                      
                                    }
                                  });
                                }else{
                                 
                                    var tmp_obj                 =   {};
                                    tmp_obj.reasonCode          =   scope.res_code_data;
                                    // tmp_obj.packageId           =   packageId;
                                    tmp_obj.asnId               =   reverse_detail.asnId;
                                    tmp_obj.status              =   'shippedReversed';
                                    if(reverse_detail.purchaseOrderType == 'MR_MAN' || reverse_detail.purchaseOrderType == 'MR_IBT_M'){
                                      tmp_obj.status            =   'receiveInProgress';
                                    }
                                    
                                    tmp_obj.purchaseOrderType   =   reverse_detail.purchaseOrderType;
                                    tmp_obj.itemStatus          =   [];
                                  angular.forEach(reverse_detail.skus, function(styles,stylesData){
                                
                                    if(styles.skuArr){
                                        angular.forEach(styles.skuArr, function(skudatas){
                                            tmp_obj.itemStatus.push(skudatas);
                                        });
                                    } 
                                  });
                                    final_data.push(tmp_obj);
                                }
                              });

                          if(final_data.length > 0)
                         {

                            var reverse_path = '/reversereceiptpackage';
                            if(save_reverse[0].purchaseOrderType == 'MR_MAN' || save_reverse[0].purchaseOrderType == 'MR_IBT_M'){
                              reverse_path = '/reversemanualreceipt';
                            }

                             var reverse_data  =   {"data":JSON.stringify(final_data)};
                            
                             Data.put(reverse_path, {
                                 data:reverse_data
                             }).then(function (results) {
                                  var output   =   {};
                                 if(results.status =='success'){
                                    scope.reloadBtn();
                                     var output = {
                                             "status": "success",
                                             "message": scope.ovcLabel.asnPackage.toast.receiptSuccess
                                         };
                                 }else{          
                                         var output = {
                                             "status": "error",
                                             "message": scope.ovcLabel.asnPackage.toast.receiptFail
                                         };
                                     }  
                                 Data.toast(output);                
                             });
                          }
                      },
                      cancel: function () {
                                return false;
                      }
                });
              }else{
                scope.showReverseReason   = true;
              }
            };
            scope.reloadBtn = function(){
              $state.reload();
            };  
        },
        templateUrl : '/modules/directives/reverse_receipt/reverse_receipt.html'
  };
}]);