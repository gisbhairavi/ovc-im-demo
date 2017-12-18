'use strict';

var app     =   angular.module('OVCstockApp',['angularFileUpload']);

app.service('fileUpload', ['Data','$http', function (Data,$http) {
    this.uploadFileToUrl = function(content, uploadUrl){
        // var fd = new FormData();
        // fd.append('type', 'json');
        // fd.append('uploaded_file', content);
        // Data.postjsonupload(uploadUrl, fd)
        try {
            var jsonObject = JSON.parse(content); // verify that json is valid
            Data.post(uploadUrl, {data:{type:'json','uploaded_file': content}})
                .then(function(results){
                // if(results.data.status){
                if(results.status){
                    var output = {
                        "status": "success",
                        "message": $scope.ovcLabel.fileUpload.uploadSuccess
                    };
                }else{
                    var output = {
                        "status": "error",
                        "message": $scope.ovcLabel.fileUpload.error
                    };
                }
                Data.toast(output);
            });
        }
        catch (e) {
            console.log("This is not a valid JSON: " + e)
        }
    }
}]);

app.controller('AppController', ['$scope', 'fileUpload','Data','$state','$stateParams','RULEDEFN', function($scope, fileUpload,Data,$state,$stateParams,RULEDEFN){
    if($state.current.name == 'ovc.purchaseorderjson'){
        $scope.upload   =   $scope.ovcLabel.fileUpload.order;
        $scope.URL      =   '/receivingpurchasejson';
    }
    if($state.current.name == 'ovc.countsjson'){
        $scope.upload   =   $scope.ovcLabel.fileUpload.count;
        $scope.URL      =   '/countsuploadjson';
    }
     if($state.current.name == 'ovc.fileupload'){
        $scope.upload   =   $scope.ovcLabel.fileUpload.stocklevel;
        $scope.URL      =   '/uploadjson';
    }
    $scope.browse=function($fileContent){
        // $scope.content=$scope.myFile;
        $scope.content=$fileContent;
    };

    var STOCKUPDATE_LIMIT=1000;
    function uploadFileToUrl(content, uploadUrl) {
        try {
            var jsonObject = JSON.parse(content);
            Data.post(uploadUrl, {
                "data": {
                    type: 'json',
                    'uploaded_file': JSON.stringify(jsonObject)
                }
            }).then(function(results) {
                if ($.type(results) === "string") {
                    var output = {
                        "status": "error",
                        "message": $scope.ovcLabel.fileUpload.error
                    };
                } else {
                    if (results.status == 'success') {
                        var output = {
                            "status": "success",
                            "message": $scope.ovcLabel.fileUpload.uploadSuccess
                        };
                    }
                    if (results.status == 'error') {
                        var output = {
                            "status": "error",
                            "message": results.error ? results.error : $scope.ovcLabel.fileUpload.error
                        };
                        console.log(results.error);
                    }
                    if (results.error) {
                        var output = {
                            "status": "error",
                            "message": results.error ? results.error : $scope.ovcLabel.fileUpload.error
                        };
                        console.log(results.error);
                    }
                }
                Data.toast(output);
            });
        } catch (e) {
            var output = {
                "status": "error",
                "message": $scope.ovcLabel.fileUpload.validJsonError
            };
            Data.toast(output);
            console.log("This is not a valid JSON: " + e);
        }
    }
    function getbalanceType() {
        var data = {};
        if (RULEDEFN) {
            var allowed = ["BALFIELDS", "HELDSTOCK"];
            _.forEach(RULEDEFN, function(value, key) {
                var defn = _.keys(value)[0];
                if (allowed.indexOf(defn) >= 0)
                 _.forEach(value[defn], function(label) {
                    data[label.label] = label.Name;
                });
            });
        } else {
            console.log('No data.');
        }
        return data;
    }
            
    $scope.uploadFile = function() {
        // $scope.content=$scope.myFile;
        // var uploadUrl = "/receivingpurchasejson";
    if($state.current.name == 'ovc.purchaseorderjson'){
        uploadFileToUrl($scope.content, $scope.URL);
    }
    if($state.current.name == 'ovc.countsjson'){
        uploadFileToUrl($scope.content, $scope.URL);
    }
     if($state.current.name == 'ovc.fileupload'){
        try {
            var data = JSON.parse($scope.content);
            var error = [];
            if (data.stockUpdate) {
                var balanceType = getbalanceType();
                if(data.stockUpdate.length > STOCKUPDATE_LIMIT ){
                  var output = {
                    "status": "error",
                    "message": $scope.ovcLabel.fileUpload.error.stock_erromsg
                  };
                  Data.toast(output);
                	return false;
                }
                _.forEach(data.stockUpdate, function(value, key) {
                    if (value.sku && value.location) {
                        _.forEach(value.balanceTypeQty, function(skuvalue) {
                            if (balanceType[skuvalue.balanceType]) {
                                if (isNaN(parseFloat(skuvalue.value))) {
                                   error.push('File Upload Error: value not allowed for <span class="text-uppercase">' + skuvalue.balanceType + '</span> (sku: '+value.sku+ ', location: '+value.location+')');
                                 }
                            } else {
                                error.push('File Upload Error: not allowed to upload data for <span class="text-uppercase">' + skuvalue.balanceType + '</span> (sku: '+value.sku+ ', location: '+value.location+')');
                            }
                        });
                    } else {
                        error.push('File Upload Error: sku not found ' + key);
                    }
                });
                if(error.length){
                    var output = {
                        "status": "error",
                        "message": error.join('<br>')
                    };
                    Data.toast(output);
                }else {
                    uploadFileToUrl($scope.content, $scope.URL);
                }
            } else {
                var output = {
                    "status": "error",
                    "message": $scope.ovcLabel.fileUpload.validJsonError
                };
                Data.toast(output);
                console.log(data.stockUpdate);
            }
        } catch (e) {
            var output = {
                "status": "error",
                "message": $scope.ovcLabel.fileUpload.validJsonError
            };
            Data.toast(output);
            console.log("This is not a valid JSON: " + e);
        }
    }
        
    };
    
}]);


