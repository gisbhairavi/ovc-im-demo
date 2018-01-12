//STOCK-1287
db.getCollection('config_tbl').update({'featureId': {$in:['hideBillingTab','hideShippingTab','hideVendorColumn','hideTax','enableBlindReceiving','enableASNlevel','enableDROPSHIP','showImageByDefault']}},{$set:{"featureValue":""}},{multi:true});

// STOCK-1809
db.getCollection("permission_tbl").remove( { permId: "viewReplenishmentInformation" } );

db.getCollection("permission_tbl").insert({"applicationId":"SAR","moduleId":"inventory","permGroup":"stockLookup","permId":"viewReplenishmentInformation","permName":"View Replenishment Information","permDescription":"View Replenishment Information","isDeleted":false,"lastModified":new Date(),"created":new Date(),"__v":0.0});

db.getCollection("role_permission_tbl").remove( { permId: "viewReplenishmentInformation" } );

db.getCollection("role_permission_tbl").insert({"roleId":"5","applicationId":"SAR","moduleId":"inventory","permGroup":"stockLookup","permId":"viewReplenishmentInformation","isDeleted":false,"lastModified":new Date(),"created":new Date(),"access":true,"permValue":null,"__v":0});

//STOCK-2501
db.getCollection('config_tbl').remove({'featureId':'validateProductAndLocationMapping'});
db.getCollection("config_tbl").insert({"locationOrGroupId":"posMClient-grp-all","applicationId":"SAR","moduleId":"stockModule","featureGroup":"purchaseOrder","featureId":"validateProductAndLocationMapping","featureName":"Validate Product and Location mapping while adding an item to a PO","featureDescription":"","featureType":"boolean","featureListId":"","featureValue":"","displaySeqNumber":"","defaultValue":"0","isPublic":1,"parentFeatureId":"","fileName":"posMClient/sar.ovccfg","visibilityExpression":"","isDeleted":false,"lastModified":new Date(),"created":new Date(),"__v":0});

// STOCK-2560
db.getCollection("permission_tbl").remove( { permId: "viewReplenishmentRules" } );
db.getCollection("role_permission_tbl").remove( { permId: "viewReplenishmentRules" } );

db.getCollection("permission_tbl").remove( { permId: "viewReplenishmentInformation" } );
db.getCollection("role_permission_tbl").remove( { permId: "viewReplenishmentInformation" } );

db.getCollection("permission_tbl").remove( { permId: "viewReorderPoint" } );
db.getCollection("permission_tbl").insert({"_id":ObjectId("57dac4064a48d467e9b07c2d"),"applicationId":"SAR","moduleId":"inventory","permGroup":"replenishment","permId":"viewReorderPoint","permName":"View Replenishment Rules","permDescription":"View Replenishment Rules","isDeleted":false,"lastModified":new Date(),"created":new Date()});

