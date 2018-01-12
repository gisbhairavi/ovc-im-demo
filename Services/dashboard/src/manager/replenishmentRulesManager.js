var express					=	require('express');
var log 					= 	require('../log');
var replenishmentRulesSchema = 	require('./../model/replenishmentRulesModel');
var replenishmentRulesModel = 	replenishmentRulesSchema.replenishmentRules;
var rulesHistoryModel 		= 	replenishmentRulesSchema.replenishmentRulesHistory;
var constant 				= 	require('../../config/const.json');
var env_config 				= 	require('../../config/config.js');
var querystring 			= 	require('querystring');
var request 				= 	require('request');
var async   				=   require('async');
var router 					= 	express.Router();

module.exports	= {
	getReplenishmentRules			: 	getReplenishmentRules,
	getReplenishmentRulesSku		: 	getReplenishmentRulesSku,
 	saveReplenishmentRules			: 	saveReplenishmentRules,
 	saveReplenishmentRulesUpload	: 	saveReplenishmentRulesUpload,
 	replenishmentRulesReset			: 	replenishmentRulesReset
};



/* Getting Replenishment Rules for location */
function getReplenishmentRules(userInput, callback) {
	var locationId	=	userInput['locationId'];
	replenishmentRulesModel.find({isDeleted: false, locationId: locationId,sku: ''}).exec(callback);
}

/* Getting Replenishment Rules for SKU */
function getReplenishmentRulesSku(userInput, callback){
	var srchData 	=	JSON.parse(userInput['srchData']);
	var Query 	=	{};
	var projectionField = {};
	var skuArray 	=	[];
	Query['isDeleted'] 	=	false;
	Query['locationId'] =	{$in:srchData['locationId'].split(',')};
	Query['sku'] 		=	{ $exists: true, $ne: '' };

	var isRules 	=	(srchData.isRules === true || srchData.isRules === 'true');
	console.log('isRules:',isRules);
	
	if(srchData['sku']){
		skuArray 	= 	srchData['sku'].split(',');
		Query['sku']  	=	{ $in: skuArray };
	}

	if (srchData['minReorder'] && srchData['maxReorder']) {
		Query['reorder']  	=	{ $gte: srchData['minReorder'], $lte: srchData['maxReorder'] };
	}

	else {
		if(srchData['minReorder']){
			Query['reorder']  	=	{ $gte: srchData['minReorder'] };
		}

		if(srchData['maxReorder']){
			Query['reorder']  	=	{ $lte: srchData['maxReorder'] };
		}
	}

	if( srchData['isHistory'] && srchData['isHistory'] != '')
	{
		projectionField = { rulesHistory: 1 };
	}
	else
	{
		projectionField = { rulesHistory:0 };
	}
	replenishmentRulesModel.find(Query, projectionField).exec(function(err, data){
		if (data){

			var sku = srchData['sku'];

			getSkuArray(data, function(skuArr){

				getParentSkuData(skuArr, srchData['locationId'], sku, function(err, parentData){
					if (parentData) {
						var rulesData 	=	data.concat(parentData);
						callback('',rulesData);
					}
					else if (err) {
						return callback(err);
					}
				});

			});

		}

		else {
			callback(err);
		}

	});
}

function getSkuArray (data, sku_callback) {
	var skuArr 	=	[];
	var num 	=	data.length -1 ;
	for (num; num >= 0; num--) {
		skuArr.push(data[num].sku);
	}
	sku_callback( skuArr );
}

function getParentLoction(loc_id, loc_callback) {

	var locArray 	=	[];
	console.log("URL_",env_config.dashPath + constant.apis.GETPARENTLOC + loc_id);
	request(env_config.dashPath + constant.apis.GETPARENTLOC + loc_id, function(err, response, data) {

		try {
	        if (data) {
	            var loc = JSON.parse(data);
	        	Object.keys(loc).forEach(function(n) {
	        		locArray = locArray.concat(loc[n]);
	        	});
	        }
	    } catch (ex) {
	    	console.log("ERROR_:",ex);
	        return loc_callback( 1, constant.label.NO_USER_DATA);
	    }

    	loc_callback(0, locArray, loc);

	});

}

function getParentSkuData(sku_arr, loc_id, sku, sku_callback) {

	getParentLoction(loc_id, function(err, loc_arr, loc){

		if (err) {
			return sku_callback(loc_arr);
		}

		var cond = 	{};
		cond['isDeleted']	= 	false
		// cond['locationId'] 	= 	{ '$in': loc_arr };

		cond['$and'] = [];

		cond['$and'].push( {'locationId' : { '$nin': loc_id.split(',') }} );
		cond['$and'].push( {'locationId' : { '$in': loc_arr }} );

		if (sku ) {
			cond['$and'].push( {'sku' : { '$nin': sku_arr }} );
			cond['$and'].push( {'sku' : { '$in': sku.split(',') }} );
		}
		else {
			cond['sku'] =	{ '$nin': sku_arr };
		}
		// sku ? cond['sku'] =	{ '$in': sku.split(',') } : '';
		var projectionField = 	{ rulesHistory: 0 };

		replenishmentRulesModel.find(cond, projectionField).exec(function(err, rules_data){
			if (err) {
				return sku_callback(err);
			}
			else if (rules_data && rules_data.length) {

				var resultData 	=	{};
				resultData.rule_data 	= 	[];

				async.forEachOf(loc, function(loc_itms, child_loc ,async_callback){

					resultData.skuArr 	= 	[];
					var temp_rules_data 	=	{};
					var loc_itmsLength = 	loc_itms.length;
					for (var num = 0; num < loc_itmsLength; num++) {
						for (var rule_idx = rules_data.length - 1; rule_idx >= 0; rule_idx--) {
							if (rules_data[rule_idx].locationId === loc_itms[num] && resultData.skuArr.indexOf(rules_data[rule_idx].sku) === -1 ) {
								temp_rules_data = JSON.parse(JSON.stringify(rules_data[rule_idx]));
								temp_rules_data.locationId 	=	child_loc;
								resultData.skuArr.push(temp_rules_data.sku);
								resultData.rule_data.push(temp_rules_data);
								temp_rules_data = {};
							}
						}
					}

					async_callback();
					
				}, function () {

					sku_callback(null, resultData.rule_data);

				});

			}
			else {
				sku_callback(null, []);
			}
		})

	});
}

/* Save Replenishment Rules */
function saveReplenishmentRules(userInput, callback){
	var locationId 	=	userInput['locationId'];
	replenishmentRulesModel.remove({locationId: locationId,sku: ''}).exec(function(e,s){
		replenishmentRulesModel.create(userInput['replenishmentRulesData'],callback);
	});
}
/* Save Replenishment Rules from File*/
function saveReplenishmentRulesUpload(userInput, main_callback){

	try {
		var CSVData		=	JSON.parse(userInput['replenishmentRulesData']);
	} catch(e) {
		var CSVData		={};
		console.log(e);
	}
	
	var location_id =	userInput['replenishmentRulesData'][0]['locationId'];
	var sku_arr		=	[];
	var result_arr	=	[];

	var getBarcodeSKU = function(skuData, callback) {
        var obj = {};
        var barCodeData = {};
        obj['srch'] = skuData
        var sku_data = querystring.stringify(obj);
        var options = {
            url: env_config.dashPath + constant.apis.GETBARCODESKU,
            method: 'POST',
            body: sku_data,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
        request(options, function(err, response, barCodeResData) {

            console.log(env_config.dashPath + constant.apis.GETBARCODESKU, obj);
            if(err){
				return main_callback(err);
			}
			try{
				if (barCodeResData.length == 0) {
		            var result = {
		                status: constant.label.ERROR,
		                message: constant.label.NO_DATA
		            }
		            return main_callback(null, result);
		        }
		        else if(barCodeResData.length){
		        	if (barCodeResData && barCodeResData != '') {
	                    barCodeData = JSON.parse(barCodeResData);
	                } else {
	                    barCodeData = {};
	                }
			      	Object.keys(barCodeData).forEach(function(reqData) {
			      		for (var i = CSVData.length - 1; i >= 0; i--) {
			      			if(CSVData[i].sku == reqData)
			      			{
			      				CSVData[i].sku = barCodeData[reqData];
			      				result_arr.push(CSVData[i]);
			      			}
			      		}
			      	});
			    }
			}
			catch(err){
				console.log("Error:",err);
				var result = {
	                status: constant.label.ERROR,
	                message: constant.label.SKUSERVICEFAILS
	            }
	            return main_callback(null, result);
			}
            callback ? callback(err, result_arr) : '';
        });
    };

    var saveRulesHistory = function( RPLData, history_callback ) {

    	var RPLDataLength = RPLData.length;
    	var RPLDataLocation = [];
    	var RPLDataSKU = [];
    	var newRPLdata	=	[];

    	for (var num = RPLDataLength - 1; num >= 0; num--) {
    		RPLDataLocation.push( RPLData[num].locationId );
    		RPLDataSKU.push( RPLData[num].sku );
    	}

    	replenishmentRulesModel.find({
			'$and': [
				{ locationId: {'$in': RPLDataLocation} },
				{ sku: {'$in': RPLDataSKU} }	
			]
		}).exec(function(err, rpl_data) {
			if( err ){
				return main_callback(err, '');
			}

	    	var rpl_data_sku = [];
	    	// var rpl_data_loc = [];
	    	var check_sku_arr = [];

			var rpl_data_length = rpl_data.length;
	    	
	    	for (var s_itm = rpl_data_length - 1; s_itm >= 0; s_itm--) {
	    		rpl_data_sku.push( rpl_data[s_itm].sku );
	    		// rpl_data_loc.push( rpl_data[s_itm].locationId );
	    	}

	    	var RPLDataLength = RPLData.length;

			for (var item = RPLDataLength - 1; item >= 0; item--) {
				if(rpl_data_sku.indexOf(RPLData[item].sku) == -1){
					check_sku_arr.push(RPLData[item].sku);
				}
			}

			if( rpl_data.length != 0 ) {

				var rpl_data_length = rpl_data.length;
				var RPLDataLength = RPLData.length;
				var rpl_data_sku  = [];

				for (var i = RPLDataLength - 1; i >= 0; i--) {

					for(var itm = rpl_data_length - 1; itm >= 0; itm--) {

						if((RPLData[i].sku == rpl_data[itm].sku) && (RPLData[i].locationId == rpl_data[itm].locationId)) {

							var rpl_data_his_len = rpl_data[itm].rulesHistory ? rpl_data[itm].rulesHistory.length : 0;
							var setflag = false;

							if(rpl_data[itm].maxOrder != RPLData[i].maxOrder)
								setflag = true;
							if(rpl_data[itm].minOrder != RPLData[i].minOrder)
								setflag = true;
							if(rpl_data[itm].reorder != RPLData[i].reorder)
								setflag = true;
							if(rpl_data[itm].roundingValue != RPLData[i].roundingValue)
								setflag = true;

							if((setflag == true) && (RPLData[i]['locationId'] == location_id || !location_id))
							{
								if( rpl_data[itm].rulesHistory && rpl_data_his_len > 0 )
								{
									var history_obj = new rulesHistoryModel(RPLData[i]);
									history_obj['modifiedBy'] = userInput.user.clientId;
									RPLData[i]['rulesHistory'] = rpl_data[itm].rulesHistory.concat(history_obj);
								}
								else {
									var history_obj = new rulesHistoryModel(RPLData[i]);
									history_obj['modifiedBy'] = userInput.user.clientId;
									RPLData[i]['rulesHistory'] = history_obj;
								}

							}
							else if (setflag == true && RPLData[i]['locationId'] != location_id) {

								var new_rule	=	new rulesHistoryModel(RPLData[i]);
								new_rule['locationId'] = location_id;

								delete new_rule.rulesHistory;
								var history_obj = new rulesHistoryModel(new_rule);
								history_obj['modifiedBy'] = userInput.user.clientId;
								new_rule['rulesHistory'] = history_obj;

								newRPLdata.push(new_rule);
								RPLData[i]	=	rpl_data[itm];

							} else {
								RPLData[i]['rulesHistory'] = rpl_data[itm].rulesHistory ? rpl_data[itm].rulesHistory : [];
							}

							if (userInput['action'] == 'reset' && RPLData[i]['locationId'] == location_id){
								RPLData[i]['isDeleted'] = true;
							}

						}

						else if ( (check_sku_arr != '') && (check_sku_arr.indexOf(RPLData[i].sku) != -1) ) 
						{ 
							var history_obj = new rulesHistoryModel(RPLData[i]);
							history_obj['modifiedBy'] = userInput.user.clientId;
							RPLData[i]['rulesHistory'] = history_obj;
						}

					}

				}

				history_callback( err, RPLData.concat(newRPLdata) );

			}
			else {

    			var RPLDataLength = RPLData.length;
				
				for (var i = RPLDataLength - 1; i >= 0; i--) {
					var history_obj = new rulesHistoryModel(RPLData[i]);
					history_obj['modifiedBy'] = userInput.user.clientId;
					RPLData[i]['rulesHistory'] = history_obj;
				}

				history_callback( err, RPLData );
			}
		});

    }

    var createSkuArr = function(SKUData, sku_callback )
    {
    	var CSV_length = SKUData.length;

    	if(!CSV_length) {
    		CSVData = Object.keys(SKUData).map(function (key) { return SKUData[key]; });
    		CSV_length = CSVData.length;
    	}

    	for(var i = 0; i < CSV_length; i++){
			sku_arr.push(SKUData[i].sku);
		}

		sku_callback(sku_arr);
    }

	createSkuArr(CSVData, function(skuArr){

		getBarcodeSKU(skuArr.join(),function(err, barCodeRPLData){

			saveRulesHistory( barCodeRPLData, function( err, resultRPLData ){

				var resultRPLDataLoc = [];
				var resultRPLDataSKU = [];
				var resultRPLDataLen = resultRPLData.length;

				for (var count = resultRPLDataLen - 1; count >= 0; count--) {
					resultRPLDataLoc.push( resultRPLData[count].locationId );
					resultRPLDataSKU.push( resultRPLData[count].sku );
				}

				replenishmentRulesModel.remove({
					'$and': [
						{ locationId: {'$in': resultRPLDataLoc} },
						{ sku: {'$in': resultRPLDataSKU} }	
					]
				}).exec(function(){
					replenishmentRulesModel.create(resultRPLData, function(err, reultData){
						if(!err){
							main_callback(null, {success: "success"})
						}else {
							main_callback(null, {status: "error", result: err})
						}
					});
				});
				// replenishmentRulesModel.remove({locationId: resultRPLData[i]['locationId'],sku: resultRPLData[i]['sku']}).exec();
				

			});
				
		});
	})
}


/*****************************************************************************************
 *
 * FUNCTION:    replenishmentRulesReset
 *
 * DESCRIPTION: To Reset replenishment Rules setup.
 *
 * PARAMETERS:  "skuData", "locationId" and "Action" 
 *
 * RETURNED:    Status message.
 *
 * REVISION HISTORY:
 *
 *            Name          Date            Description
 *            ----          ----            -----------
 *            Arun          16/02/2017      First Version
 *
 ******************************************************************************************/
function replenishmentRulesReset (userInput, callback) {
	var skuData 	=	userInput['skuData'];
	var locationId 	=	userInput['locationId'];
	var action 	=	userInput['action'];

	var query 	=	{};

	//Common update service to set isDeleted flag as true
	var updateData = function() {
		replenishmentRulesModel.update(query, {isDeleted: true}, {multi: true}, function(err, data){
			if (err) {
				callback({status: "error", result: err});
			}
			else {
				callback({status: "success", result: data});
			}
		});
	}

	if (locationId) {
		query['locationId']	=	locationId;
	}

	if (action === "productReset") {

		if (skuData) {
			query['sku']	=	{'$in':skuData.split(',')}
		}

		updateData();

	}	
	else if (action === "storeReset") {
		
		updateData();

	}
	else {
		callback({status: "error", result: "Invalid Action"});
	}

}