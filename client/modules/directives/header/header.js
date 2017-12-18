'use strict';

/**
 * @ngdoc directive
 * @name izzyposWebApp.directive:adminPosHeader
 * @description
 * # adminPosHeader
 */
angular.module('OVCstockApp')
	.directive('ovcHeader',function(){
		
		return {
        templateUrl:'modules/directives/header/header.html',
        restrict: 'E',
        replace: true,
    	}
	})
	.controller('headerctrl',function($rootScope, $scope, Data, $state, OVC_CONFIG , $timeout){
		$scope.action 	=	{};
		$scope.dashpath =	OVC_CONFIG.DASH_PATH;
		$scope.action.downloadsPage 	=	2;
		$scope.action.currentPage 	=	1;
		$scope.action.entryLimit 	=	10;
		$scope.action.offset 		=	0;
		$scope.downloadData 		=	{data:[]};
		$rootScope.progressdownload 	=	false;
		$scope.menu_toggle = function() {
			$scope.hover_mini_po = !$scope.hover_mini_po;
		}
		
		var user_detail 		= 	$rootScope.globals['currentUser'];

		if(user_detail)
		{	
			var user_id			=	user_detail['username'];
			
			$scope.username 	=	user_detail['name'];
			$scope.username1	=	$scope.username.toUpperCase();	
		}

		//**load more Button Action**//
		$scope.loadData 			=	function(Dataload){
			$scope.action.currentPage++;
			$scope.action.offset 	= 	($scope.action.currentPage - 1) * $scope.action.entryLimit;
			alertDataCall(Dataload, 'append');
		}
		
		//timer callback
		$scope.notifyOnNumber = 0;
        $timeout(function(){
           $rootScope.getdownloads();
        }, 1000);

		$rootScope.$on('Notify', function(event, args) {
			console.log(args,'ARGUMENTS');
			$scope.notifyDate 	=	args.date;
			$rootScope.getdownloads();
        });
        $rootScope.getdownloads=function(downloadsPage){
		      $timeout(function(){
		        $.LoadingOverlay("hide");
		      }, 1000);
		     	if(downloadsPage) 
		    		var offset=(downloadsPage - 1) * $scope.action.entryLimit;
	            Data.get('/download?page_lmt='+$scope.action.entryLimit+'&page_offset='+offset).then(function (downloadRes) {
            	console.log("downloadRes",downloadRes);
            	if(downloadRes.error){
	                var output = {
	                    "status": "error",
	                    "message": data.error
	                };
	                Data.toast(output);
            	}else {
					if(downloadsPage&&downloadRes.result.data)
					{
						$scope.action.downloadsPage=++downloadsPage;
						$scope.downloadData.data=$scope.downloadData.data.concat(downloadRes.result.data);
	            		$scope.downloadData.total_count = downloadRes.result.total_count;
					}else {
						$scope.action.downloadsPage 	=	2;
						$scope.downloadData = downloadRes.result;
					}
	            	$scope.notifyOnNumber = downloadRes.result.count;
            	}
            });
        };
        $scope.notifyUpdate 	=	function(){
			$scope.notifyOn 	    =	true;
			if($scope.notifyOnNumber)
			$scope.notifyOnNumber--;
        }
	    $scope.download = function(download) {
	    	function s2ab(s) {
			  var buf = new ArrayBuffer(s.length);
			  var view = new Uint8Array(buf);
			  for (var a=0; a!=s.length; ++a) view[a] = s.charCodeAt(a) & 0xFF;
			  return buf;
			}
		    $timeout(function(){
		      $.LoadingOverlay("hide");
		    }, 1000);
		    $('.download.' + download ).LoadingOverlay("show");
	        Data.get('/download/' + download + '?download=true').then(function(data) {
	            $('.download.' + download ).LoadingOverlay("hide");
	            if (data.error) {
	                var output = {
	                    "status": "error",
	                    "message": data.error
	                };
	                Data.toast(output);
	            }else{
	                var file = new Blob([s2ab((data.data))], {
	                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
	                });
	                saveAs(file, 'Balance Report.xlsx');
	                Data.post('/download/' + download, {
	                    data: {
	                        status: 'DOWNLOADED'
	                    }
	                }).then(function(data) {console.log(data);$rootScope.getdownloads();});
	            }
	        });
	    }
	    $scope.deletedownload = function(download) {
		    $('.download.' + download ).LoadingOverlay("show");
	        Data.delete('/download/' + download).then(function(data) {
	                $('.download.' + download ).LoadingOverlay("hide");
	            if (data.error) {
	                var output = {
	                    "status": "error",
	                    "message": data.error
	                };
	                Data.toast(output);
	            }else{
	                var output = {
	                    "status": "success",
	                    "message": $scope.ovcLabel.directiveType.directive_delete_success || 'Deleted successfully.'
	                };
	                Data.toast(output);
	                $rootScope.getdownloads();
	            }
	        });
	    }
	    $scope.downloadClass = function(download) {
	    	return download.status== 'DOWNLOADED'?'downloaded':'';
	    }
		//****Alert Center Service Call Initial***//
		$scope.loadActionCenter 	=	function () {
			if ($scope.action.collapsedAlert){
				$scope.action.inboundDatas 	=	[];
				$scope.action.outboundDatas	=	[];
				alertDataCall('all');
			}
		}

		
		var count 	=  0;	
		$scope.action.page = 1 ;
		$scope.action.inboundLoad  = false;
		$scope.action.outboundLoad = false;

		var alertDataCall 	=	function(alerttype, isAppend){
			if (!isAppend)
				$scope.action.getAlertData 	=	false;
			Data.get('/ordersSummary?page_lmt='+$scope.action.entryLimit+'&page_offset='+$scope.action.offset).then(function(alertData){
				$scope.action.getAlertData 	=	true;
				if (!isAppend) {
					$scope.action.inboundDatas 	=	[];
					$scope.action.outboundDatas	=	[];
				}
				if(alertData && alertData != ''){
					if(alerttype == 'all'){
						angular.forEach(alertData.inBoundOrder, function(inbound){
							inbound.type 	=	"Inbound";
							$scope.action.inboundDatas.push(inbound);
						});
						angular.forEach(alertData.outBoundOrder, function(outbound){
							outbound.type = "Outbound";
							$scope.action.outboundDatas.push(outbound);
						});
					}
					if(alerttype == 'inbound'){
						angular.forEach(alertData.inBoundOrder, function(inbound){
							inbound.type 	=	"Inbound";
							$scope.action.inboundDatas.push(inbound);
						});
					}
					if(alerttype == 'outbound'){
						angular.forEach(alertData.outBoundOrder, function(outbound){
							outbound.type = "Outbound";
							$scope.action.outboundDatas.push(outbound);
						});
					}
					
					if((!alertData.outBoundOrder && alertData.outBoundOrder == '') || (alertData.outBoundOrder && (alertData.outBoundOrder.length < $scope.action.entryLimit)))
						$scope.action.outboundLoad 	=	true;
					if((!alertData.inBoundOrder && alertData.inBoundOrder =='') || (alertData.inBoundOrder && (alertData.inBoundOrder.length < $scope.action.entryLimit)))
						$scope.action.inboundLoad 	=	true;
					
				}
			},function(error){
				console.log('Alert Service Faild');
			});
		};
		//**Order To Redirect that States**//
		$scope.changeState 	=	function(data,type,boundType){
			if(data != undefined && data != ''){
				if(type == 'MAN')
					$state.go('ovc.vieworders-list',{porderid:data, selectTab:'summary'});
				if(type == 'IBT_M' && boundType == 'Inbound')
					$state.go('ovc.viewtransfers-summary',{transferid:data, transfertype:'Inbound', transferfunc:'summary'});//summary for second tab
				if(type == 'IBT_M' && boundType == 'Outbound')
					$state.go('ovc.viewtransfers-summary',{transferid:data, transfertype:'Outbound', transferfunc:'summary'});//summary for second tab
				if(type == 'PUSH' && boundType == 'Inbound')
					$state.go('ovc.manualShipment-summary', {summaryid:data,transfertype:'Inbound', transferfunc:'summary'});//summary for second tab
				if(type == 'PUSH' && boundType == 'Outbound')
					$state.go('ovc.manualShipment-summary', {summaryid:data,transfertype:'Outbound', transferfunc:'summary'});//summary for second tab
				$scope.action.collapsedAlert	=	false;
			}
		};

       // ****alert Center Function Call in App.js***//
		// $rootScope.$on('alertCenterCall', function () {
		// 	$scope.action.inboundDatas 	=	[];
		// 	$scope.action.outboundDatas	=	[];
  //           alertDataCall('all');
		// 	$scope.action.collapsedAlert 	=	false;
  //       });
  //       $rootScope.$on('alertCenterHide', function () {
		// 	$scope.action.collapsedAlert 	=	false;

  //       });

       /*$scope.action.collapsed 	=	function(){
			$scope.action.collapsedAlert 	=	!$scope.action.collapsedAlert;
        };*/

        //****Directive parameter*****//
        $scope.action.close 	=	function(){
			$scope.action.collapsedAlert 	=	false;
        };
        $scope.action.notify 	=	function(){
        	$scope.action.collapsednotify 	=	false;
        }
		
		// alertDataCall('all');
	});
	
	
	
