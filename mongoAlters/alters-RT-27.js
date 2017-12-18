//STOCK-3185

db.getCollection('config_tbl').remove({'featureId':'organizationStructure'});
db.getCollection("config_tbl").insert({"featureGroup":"admin","featureName":"Organization Structure","applicationId":"SAR","defaultValue":[{"name":"Corporate","value":"0"},{"name":"Franchise","value":"1"}],"featureType":"OrganizationStructureDropDown","moduleId":"stockModule","isPublic":1,"parentFeatureId":"","fileName":"posMClient/sar.ovccfg","visibilityExpression":"","displaySeqNumber":"","featureDescription":"","featureId":"organizationStructure","locationOrGroupId":"posMClient-grp-all","featureValue":"","__v":0,"isDeleted":false,"created":new Date(),"lastModified":new Date()});

db.getCollection('config_tbl').remove({'featureId':'replenishmentReorderType'});
db.getCollection("config_tbl").insert({"locationOrGroupId":"posMClient-grp-all","applicationId":"SAR","moduleId":"stockModule","featureGroup":"replenishment","featureId":"replenishmentReorderType","featureName":"Balance Type to be used in Reorder Amount Calculation","featureDescription":null,"featureType":"singleselectdropdown","featureListId":null,"featureValue":"","displaySeqNumber":null,"defaultValue":"atp","isPublic":"1","parentFeatureId":null,"fileName":"posMClient/sar.ovccfg","visibilityExpression":null,"isDeleted":false,"lastModified":new Date(),"created":new Date(),"__v":0.0});

//STOCK-3079
db.getCollection('config_tbl').remove({'featureId':'publishApprovedCounts'});
db.getCollection("config_tbl").insert({"locationOrGroupId":"posMClient-grp-all","applicationId":"SAR","moduleId":"stockModule","featureGroup":"counts","featureId":"publishApprovedCounts","featureName":"Publish Approved Counts","featureDescription":null,"featureType":"boolean","featureListId":null,"featureValue":"","displaySeqNumber":null,"defaultValue":"0","isPublic":"1","parentFeatureId":null,"fileName":"posMClient/sar.ovccfg","visibilityExpression":null,"isDeleted":false,"lastModified":new Date(),"created":new Date()});
