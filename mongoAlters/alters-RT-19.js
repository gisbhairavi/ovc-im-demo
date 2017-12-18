//STOCK-2194 -- Adjustment Permission
db.getCollection("permission_tbl").remove( { permId: "viewAdjustments" } );
db.getCollection("permission_tbl").insert({"applicationId":"SAR","moduleId":"adjustments","permGroup":"manualAdjustments","permId":"viewAdjustments","permName":"View Manual Adjustment","permDescription":"View Manual Adjustment","isDeleted":false,"lastModified":new Date(),"created":new Date(),"__v":0.0});

db.getCollection("role_permission_tbl").remove( { permId: "viewAdjustments" } );
db.getCollection("role_permission_tbl").insert({"roleId":"5","applicationId":"SAR","moduleId":"adjustments","permGroup":"manualAdjustments","permId":"viewAdjustments","isDeleted":false,"lastModified":new Date(),"created":new Date(),"access":true,"permValue":null,"__v":0.0});
// STOCK-2273. 
db.getCollection("permission_tbl").remove( { permId: "viewmanualReceipt" } );
db.getCollection("permission_tbl").insert({"applicationId":"SAR","moduleId":"purchaseOrder","permGroup":"manualReceipt","permId":"viewmanualReceipt","permName":"View Manual Receipt","permDescription":"View Manual Receipt","isDeleted":false,"lastModified":new Date(),"created":new Date(),"__v":0.0});
db.getCollection("role_permission_tbl").remove( { permId: "viewmanualReceipt" } );
db.getCollection("role_permission_tbl").insert({"roleId":"5","applicationId":"SAR","moduleId":"purchaseOrder","permGroup":"manualReceipt","permId":"viewmanualReceipt","permName":"View Manual Receipt","permDescription":"View Manual Receipt","isDeleted":false,"lastModified":new Date(),"created":new Date(),"access":true,"permValue":null,"__v":0.0});

db.getCollection("permission_tbl").remove( { permGroup: "executemanualReceipt" } );
db.getCollection("permission_tbl").insert({"applicationId":"SAR","moduleId":"purchaseOrder","permGroup":"manualReceipt","permId":"executemanualReceipt","permName":"Execute Manual Receipt","permDescription":"Execute Manual Receipt","isDeleted":false,"lastModified":new Date(),"created":new Date(),"__v":0.0});
db.getCollection("role_permission_tbl").remove( { permId: "executemanualReceipt" } );
db.getCollection("role_permission_tbl").insert({"roleId":"5","applicationId":"SAR","moduleId":"purchaseOrder","permGroup":"manualReceipt","permId":"executemanualReceipt","permName":"Execute Manual Receipt","permDescription":"Execute Manual Receipt","isDeleted":false,"lastModified":new Date(),"created":new Date(),"access":true,"permValue":null,"__v":0.0});
// STOCK-2140.
db.getCollection('config_tbl').remove({"featureId" : "vendorColumn"});
