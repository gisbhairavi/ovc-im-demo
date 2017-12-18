var express				=	require('express');
var log 				= 	require('../log');
var permissionModel  	= 	require('./../model/permissionModel');
var rolePermissionModel = 	require('./../model/rolePermissionModel');
var router 				= 	express.Router();

module.exports	= {
	getModuleIds		: getModuleIds,
 	getAllPermissions	: getAllPermissions,
 	saveRolePermissions	: saveRolePermissions,
};




// Get ModuleIds from Permission Table by Grouping

function getModuleIds(userInput, callback){
	permissionModel.aggregate([{$match : {isDeleted: false}},{ $group : { _id : "$moduleId" } }]).exec(callback);
}

// GET all Permissions from Permission Table

function getAllPermissions(userInput, callback) {
	var moduleId	=	userInput['moduleId'] || '';
	var roleId 		=	userInput['roleId'] || '';
	var resultObj	=	{};
	if(moduleId !== ''){
		permissionModel.find({isDeleted: false, moduleId: moduleId}).exec(function(e,permissions){
			resultObj.permissions 	=	permissions;
			rolePermissionModel.find({isDeleted: false, moduleId: moduleId,roleId: roleId}).exec(function(e,rolePermissions){
				resultObj.rolePermissions 	=	rolePermissions;
				callback(null,resultObj);
			});
		});
	}else{
		var roleIds 	=	roleId.split(",");
		rolePermissionModel.find({isDeleted: false, roleId: { $in: roleIds}}).exec(function(e,rolePermissions){
			resultObj.rolePermissions 	=	rolePermissions;
			callback(null,resultObj);
		});
	}
	
}

// Save Role Permission Records

function saveRolePermissions(userInput, callback){
	var moduleId 	=	userInput['moduleId'];
	var roleId 		=	userInput['roleId'];
	rolePermissionModel.remove({moduleId: moduleId,roleId:roleId}).exec(function(e,s){
		rolePermissionModel.create(JSON.parse(userInput['rolesPermissionData']),callback);
	});
	
}
