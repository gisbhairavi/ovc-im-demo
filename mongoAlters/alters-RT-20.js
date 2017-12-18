// STOCK-2292
db.getCollection("permission_tbl").remove( { permId: "modifyReplenishmentRules" } );
db.getCollection("role_permission_tbl").remove( { permId: "modifyReplenishmentRules" } );

db.getCollection("permission_tbl").remove( { permId: "modifyReplenishment" } );
db.getCollection("role_permission_tbl").remove( { permId: "modifyReplenishment" } );

db.getCollection("permission_tbl").remove( { permId: "viewReplenishmentRules" } );
db.getCollection("permission_tbl").insert({"applicationId":"SAR","moduleId":"inventory","permGroup":"replenishment","permId":"viewReplenishmentRules","permName":"View Replenishment Rules","permDescription":"View Replenishment Rules","isDeleted":false,"lastModified":new Date(),"created":new Date()});

db.getCollection("role_permission_tbl").remove( { permId: "viewReplenishmentRules" } );
db.getCollection("role_permission_tbl").insert({"roleId":"5","applicationId":"SAR","moduleId":"inventory","permGroup":"replenishment","permId":"viewReplenishmentRules","isDeleted":false,"lastModified":new Date(),"created":new Date(),"access":true,"permValue":null,"__v":0});

// STOCK-1805
db.getCollection('config_tbl').remove({'$and':[{"featureType" : "boolean"},{'featureId': {'$in' : ['productMaterialGroup','productFit', 'productSleave', 'productFabric', 'productColor', 'productLastSeason', 'productFirstSeason', 'productWaist', 'productLength', 'productSize']}}]});

//Role permission for Replensihment
db.getCollection("permission_tbl").remove({'permId':{$in:['modifyReplenishmentFilters','createReplenishmentFilters']}});
db.getCollection("permission_tbl").insert([{"applicationId":"SAR","moduleId":"inventory","permGroup":"replenishment","permId":"modifyReplenishmentFilters","permName":"Modify Replenishment Filters","permDescription":"Modify Replenishment Filters","isDeleted":false,"lastModified":new Date(),"created":new Date()},{"applicationId":"SAR","moduleId":"inventory","permGroup":"replenishment","permId":"createReplenishmentFilters","permName":"Create Replenishment Filters","permDescription":"Create Replenishment Filters","isDeleted":false,"lastModified":new Date(),"created":new Date()}]);

db.getCollection("role_permission_tbl").remove({'permId':{$in:['modifyReplenishmentFilters','createReplenishmentFilters']}});
db.getCollection("role_permission_tbl").insert([{"roleId":"5","applicationId":"SAR","moduleId":"inventory","permGroup":"replenishment","permId":"modifyReplenishmentFilters","isDeleted":false,"lastModified":new Date(),"created":new Date(),"access":false,"permValue":null,"__v":0},{"roleId":"5","applicationId":"SAR","moduleId":"inventory","permGroup":"replenishment","permId":"createReplenishmentFilters","isDeleted":false,"lastModified":new Date(),"created":new Date(),"access":false,"permValue":null,"__v":0}]);