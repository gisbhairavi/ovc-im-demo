'use strict';
/***********************************************************************
 *
 * Controller:    jmsController.
 *
 * REVISION HISTORY:
 *
 *            Name          Date            Description
 *            ----          ----            -----------
 *            Ratheesh     04/03/2016      First Version
 *
 ***********************************************************************/
// var app = angular.module('OVCstockApp', ['']);
app.controller('jmsController', function($scope, $http, Data, jmsData, toaster) {
    this.Json = '';
    var orders = [];

    function testReqJson(jsonStr) {
        orders = [];
        var reqJson = false;
        var json = angular.fromJson(jsonStr);
        for (var j = 0, length2 = json.length; j < length2; j++) {
            try {
                angular.fromJson(json[j]).hasOwnProperty('purchaseOrder') ? orders.push(angular.fromJson(json[j])) : '';
            } catch (e) {
            }
        }
        reqJson = orders.length >= 1 ? true : false;
        return reqJson;
    }
    this.getReceive = function() {
        Data.post('/jmsreceive/posubmit', {
            data: {
                data: ''
            }
        }).then(function(results) {
            console.log(results.data);
            // return;
            var jsonStr = results.data;
             try {var json = angular.fromJson(results.data);} catch (e) { toast('error', 'No data.') }
            testReqJson(jsonStr) ? callService('/receivingpurchasejson', angular.toJson(orders, true)) : toast('success', json ? json[0] : '');
        });
    };

    function callService(uploadUrl, jsonStr) {
        var obj = {
            "data": {
                "uploaded_file": jsonStr,
                "type": "json"
            }
        };
        toast('success', 'Found ' + orders.length + ' orders.');
        Data.post(uploadUrl, obj).then(function(result) {
            toast('success', result);
        });
    };

    function toast(status, result) {
        result ? toaster.pop(status, '', result, 3000) : '';
    };
});