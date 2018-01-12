//STOCK-1645.

db.getCollection('config_tbl').remove({'featureId':'enableDROPSHIP'});
db.getCollection("config_tbl").insert({"id" : "330","locationOrGroupId" : "posMClient-grp-all","applicationId" : "SAR","moduleId" : "stockModule","featureGroup" : "purchaseOrder","featureId" : "enableDROPSHIP","featureName" : "enableDROPSHIP","featureDescription" : null,"featureType" : "boolean","featureListId" : null,"featureValue" : "1","displaySeqNumber" : null,"defaultValue" : "0","isPublic" : "1","parentFeatureId" : null,"fileName" : "posMClient/sar.ovccfg","visibilityExpression" : null,"isDeleted" : false,"lastModified" : ISODate("2016-01-28T07:19:16.000Z"),"created" : new Date()});

db.getCollection('directive_type').remove({directiveTypeId : "DROP_SHIP_DRAFT_CREATE"});
db.getCollection('directive_type').insert({"directiveTypeId" : "DROP_SHIP_DRAFT_CREATE","directiveName" : "DROP_SHIP_DRAFT_CREATE","description" : "DROP_SHIP_DRAFT_CREATE","tranTypeId" : "BALANCESTATUSCHANGEONLY","createdBy" : "8796093054980","updatedBy" : "8796093054980","isActive" : true,"isDeleted" : false,"__v" : 0});

db.getCollection('directive_type').remove({directiveTypeId : "DROP_SHIP_DRAFT_DELETE"});
db.getCollection('directive_type').insert({"directiveTypeId" : "DROP_SHIP_DRAFT_DELETE","directiveName" : "DROP_SHIP_DRAFT_DELETE","description" : "DROP_SHIP_DRAFT_DELETE","tranTypeId" : "BALANCESTATUSCHANGEONLY","createdBy" : "8796093054980","updatedBy" : "8796093054980","isActive" : true,"isDeleted" : false,"__v" : 0});

db.getCollection('directive_type').remove({directiveTypeId : "DROP_SHIP_SUBMITTED"});
db.getCollection('directive_type').insert({"directiveTypeId" : "DROP_SHIP_SUBMITTED","directiveName" : "DROP_SHIP_SUBMITTED","description" : "DROP_SHIP_SUBMITTED","tranTypeId" : "BALANCESTATUSCHANGEONLY","createdBy" : "8796093054980","updatedBy" : "8796093054980","isActive" : true,"isDeleted" : false,"__v" : 0});

//STOCK-1801.
db.getCollection('config_tbl').remove({'featureId':'FindIt'});
db.getCollection("config_tbl").insert({"id" : "333","locationOrGroupId" : "posMClient-grp-all","applicationId" : "SAR","moduleId" : "stockModule","featureGroup" : "stockLookUpProductAttribute","featureId" : "FindIt","featureName" : "Find It","featureDescription" : null,"featureType" : "boolean","featureListId" : null,"featureValue" : "","displaySeqNumber" : null,"defaultValue" : "1","isPublic" : "1","parentFeatureId" : null,"fileName" : "posMClient/sar.ovccfg","visibilityExpression" : null,"isDeleted" : false,"lastModified" : ISODate("2016-01-28T07:19:16.000Z"),"created" : new Date()});
// STOCK-1770
db.getCollection('directive_type').remove({directiveTypeId : "MAN_RECEIPT_DRAFT_CREATE"});
db.getCollection('directive_type').insert({"directiveTypeId" : "MAN_RECEIPT_DRAFT_CREATE","directiveName" : "MAN_RECEIPT_DRAFT_CREATE","description" : "MAN_RECEIPT_DRAFT_CREATE","tranTypeId" : "BALANCESTATUSCHANGEONLY","createdBy" : "8796093054980","updatedBy" : "8796093054980","isActive" : true,"isDeleted" : false,"__v" : 0});

db.getCollection('directive_type').remove({directiveTypeId : "MAN_RECEIPT_DRAFT_DELETE"});
db.getCollection('directive_type').insert({"directiveTypeId" : "MAN_RECEIPT_DRAFT_DELETE","directiveName" : "MAN_RECEIPT_DRAFT_DELETE","description" : "MAN_RECEIPT_DRAFT_DELETE","tranTypeId" : "BALANCESTATUSCHANGEONLY","createdBy" : "8796093054980","updatedBy" : "8796093054980","isActive" : true,"isDeleted" : false,"__v" : 0});
