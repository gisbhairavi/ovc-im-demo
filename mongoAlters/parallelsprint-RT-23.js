//STOCK-2907
db.getCollection('config_tbl').remove({'featureId':'enableInsights'});
db.getCollection("config_tbl").insert({"locationOrGroupId" : "posMClient-grp-all","applicationId" : "SAR","moduleId" : "stockModule","featureGroup" : "analytics","featureId" : "enableInsights","featureName" : "Enable Insights","featureDescription" : null,"featureType" : "boolean","featureListId" : null,"featureValue" : null,"displaySeqNumber" : null,"defaultValue" : "0","isPublic" : "1","parentFeatureId" : null,"fileName" : "posMClient/sar.ovccfg","visibilityExpression" : null,"isDeleted" : false,"lastModified" : new Date(),"created" : new Date()});
