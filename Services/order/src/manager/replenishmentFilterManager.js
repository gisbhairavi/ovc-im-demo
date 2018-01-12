var express = require('express');
var log = require('../log');
var replenishmentFilterModel  = require('./../model/replenishmentFilterModel');
var constant = require('../../config/const.json');
var env_config = require('../../config/config.js');
var router = express.Router();

var request = require('request');

module.exports = {
	getReplenishmentFilter: getReplenishmentFilter,
	createReplenishmentFilter: createReplenishmentFilter,
	editReplenishmentFilter: editReplenishmentFilter,
	deleteReplenishmentFilter: deleteReplenishmentFilter
};

function getReplenishmentFilter(userInput, callback){

    var id = userInput['id'];
    var filterName = userInput['filterName'];
    var locName = userInput['locName'];
    var fromDate = userInput['fromDate'];
    var toDate = userInput['toDate'];
    var page_offset         =   parseInt(userInput['page_offset']) || 0;
    var page_lmt            =   parseInt(userInput['page_lmt']) || 20;
    var condition = {};
    var locArray = [];
    condition["$and"] = [];
    condition["$and"].push({
        isDeleted: false
    });
    console.log('url', env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId);
    request(env_config.dashPath + constant.apis.GETUSERHIERARCHYLOCATION + userInput.user.clientId, function(err, response, data) {

    try
        {
            if (data) {
                var loc =JSON.parse(data);
                Object.keys(loc.hierarchy).forEach(function(n) {
                    // console.log('loc', loc.hierarchy[n]);
                    locArray.push(loc.hierarchy[n].id);
                });
                // condition["$and"].push({'locName.locName.id': {$in:locArray}});
                condition["$and"].push({'locName.locName': {$in:locArray}});
            }
        }
    catch(ex)
        {
            return callback('can not load user data.');
        }
    if(id) {
        condition["$and"].push({
                "_id": id
            });
        replenishmentFilterModel.find(condition).exec(callback);      
   
    } else if(filterName || fromDate || toDate){
        var query = JSON.parse('{"isDeleted" : false}'); 

    if(filterName){
        query['filterName'] = new RegExp('^.*?'+filterName+'.*?$', "i"); 
    }
    if (fromDate || toDate) {
            if (fromDate && toDate) {
                toDate = new Date(toDate);
                toDate = toDate.toISOString();
                fromDate = new Date(fromDate);
                fromDate = fromDate.toISOString();
                if (fromDate != toDate) {
                    query['filterDate'] = {
                        '$gte': new Date(fromDate),
                        '$lte': new Date(toDate)
                    };
                } else {
                    fromDate = new Date(fromDate);
                    fromDate.setSeconds(0);
                    fromDate.setHours(0);
                    fromDate.setMinutes(0);
                    fromDate = fromDate.toISOString();
                    toDate = new Date(toDate);
                    toDate.setHours(23);
                    toDate.setMinutes(59);
                    toDate.setSeconds(59);
                    toDate = toDate.toISOString();
                    query['filterDate'] = {
                        '$gte': new Date(fromDate),
                        '$lte': new Date(toDate)
                    };
                }
            } else if (toDate) {
                toDate = new Date(toDate);
                toDate = toDate.toISOString();
                query['filterDate'] = {
                    '$lte': new Date(toDate)
                };
            } else {
                query['filterDate'] = {
                    '$gte': new Date(fromDate)
                };
            }
        }

        condition["$and"].push(query);

        replenishmentFilterModel.find(condition).sort({
            'lastModified': -1
        }).skip(page_offset).limit(page_lmt).exec(function(err,filter_data){

            var filter_arr = [];
            for(var num = filter_data.length - 1;num >= 0;num--){
                filter_arr.push(filter_data[num].filterName);
            }
            replenishmentFilterModel.find(condition).count().exec(function(err, total_count){
                callback( err, {filter_data:filter_data, total_count:total_count });
            });
        });

    } else  {

            replenishmentFilterModel.find(condition).sort({
                'lastModified': -1
            }).skip(page_offset).limit(page_lmt).exec(function(err,filter_data){
                var filter_arr = [];
                for(var num = filter_data.length - 1;num >= 0;num--){
                    filter_arr.push(filter_data[num].filterName);
                }
                replenishmentFilterModel.find(condition).count().exec(function(err, total_count){
                    callback( err, {filter_data:filter_data, total_count:total_count });
                })
            });
        }

    });

}


function createReplenishmentFilter(userInput, callback) {
 	userInput['createdBy']=userInput.user.clientId;
    userInput['updatedBy']=userInput.user.clientId;
    var filterName 	=	userInput['data']['filterName'];
    replenishmentFilterModel.find({isDeleted: false, filterName: filterName}, function(error, success){
    	if(success){
    		if(success.length > 0){
    			return callback('Filter Name Must be Unique',null);
    		}else{
                var dataToSave   =   {};
                Object.keys(userInput['data']).forEach(function(key) {
                    dataToSave[key]    =   IsJsonString(userInput['data'][key]);
                });
    			var replenishmentFilter = new replenishmentFilterModel(dataToSave);
    			replenishmentFilter.save(callback);
    		}
    	}
    });
}

function IsJsonString(str) {
    try {
        return JSON.parse(str);
    } catch (e) {
        return str;
    }
}

function editReplenishmentFilter(id, userInput, callback) {
	userInput['updatedBy']     =   userInput.user.clientId;
	var replenishmentFilter    =   replenishmentFilterModel.findById(id);
	if(replenishmentFilter){
        var dataToSave   =   {};
        Object.keys(userInput['data']).forEach(function(key) {
            dataToSave[key]    =   IsJsonString(userInput['data'][key]);
        });
        replenishmentFilter.update(dataToSave,callback);
	}  
}


function deleteReplenishmentFilter(data, id, callback){  
    var replenishmentFilter    =   replenishmentFilterModel.findById(data.id);
    replenishmentFilter.update({
        isDeleted: true,
        updatedBy: data.user.clientId
    },callback);
};






