/*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module     :   Helper Service
*
*    Developer  :   Sivaprakash
* 
*    Date       :   04/07/2017
*
*    Version    :   1.0   ** Common Helper Functions **
**********************************************************************/
angular.module('Helper', []).factory('helper', ['$q','Data', 'ovcDash' , function( $q, Data, ovcDash) {
	var factory  = {};


    factory.multiDropDown 	=	function(loaddata , config){
        var deferred = $q.defer();
    	if(loaddata && loaddata.status != 'error'){
            var rows = [], allvals = [], styleData    = [];
            var temskuObj = {};
            
            angular.forEach(loaddata, function(item) {
                if (config && styleData.indexOf(item.ProductTbl.productCode) == -1) {
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
                } 
                var value = item.ProductTbl.sku + '~' + item.ProductTbl.name + '~' + item.ProductTbl.barCode
                rows.push({
                    value: value,
                    labelclass:"search_products_sku",
                    labeldata: 'SKU'
                });
               
                allvals.push(item.ProductTbl);
                temskuObj[item.ProductTbl.sku] = item.ProductTbl;
            });
            deferred.resolve({allvals : allvals , rows:rows , skuObj : temskuObj});
        }else{
            deferred.reject('Error');
        }
        return deferred.promise;
    }

    factory.datSplitup = function(allText){
        var deferred = $q.defer();
        var allTextLines = allText.split(/\r\n|\n/);
        var headers = allTextLines[0].split('|');
        var lines = [];

        for (var i = 0; i < allTextLines.length; i++) {
            // split content based on comma
            var data = allTextLines[i].split('|');
            if (data.length == headers.length) {
                var tarr = [];
                for (var j = 0; j < headers.length; j++) {
                    tarr.push(data[j]);
                }
                lines.push(tarr);
            }
        }
        var objData          =   {};
        angular.forEach(lines, function (content) {
            if(objData[content[0]]){
                objData[content[0]]  =   parseFloat(objData[content[0]]) + parseFloat(content[1]);
            }else{
                objData[content[0]]  =   parseFloat(content[1]);
            }
        });
        deferred.resolve(objData);
        return deferred.promise;
    };

	return factory;
}]);
