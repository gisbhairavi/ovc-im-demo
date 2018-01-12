// STOCK-4185
db.getCollection('config_tbl').remove({'featureId':'daysForNeedbydate'});
db.getCollection('config_tbl').insert({"locationOrGroupId":"posMClient-grp-all","applicationId":"SAR","moduleId":"stockModule","featureGroup":"replenishment","featureId":"daysForNeedbydate","featureName":"Number of days in which an auto-replenishment order should be fulfilled","featureDescription":null,"featureType":"numeric","featureListId":null,"featureValue":"","displaySeqNumber":null,"defaultValue":"10","isPublic":"1","parentFeatureId":null,"fileName":"posMClient/sar.ovccfg","visibilityExpression":null,"isDeleted":false,"lastModified":new Date(),"created":new Date(),"__v":0});

// STOCK-4161
db.getCollection('config_tbl').remove({'featureId':'enableASNlevel'});
db.getCollection('config_tbl').insert([{"locationOrGroupId":"posMClient-grp-all","applicationId":"SAR","moduleId":"stockModule","featureGroup":"manualShipment","featureId":"enableASNlevel","featureName":"Enable ASN/Package levels","featureDescription":null,"featureType":"boolean","featureListId":null,"featureValue":"","displaySeqNumber":null,"defaultValue":"0","isPublic":"1","parentFeatureId":null,"fileName":"posMClient/sar.ovccfg","visibilityExpression":null,"isDeleted":false,"lastModified":new Date(),"created":new Date()}]);

// STOCK-4155
db.getCollection('config_tbl').remove({'featureId':'matchReorderPointToMaximumOrderAmount'});
db.getCollection('config_tbl').insert({"locationOrGroupId":"posMClient-grp-all","applicationId":"SAR","moduleId":"stockModule","featureGroup":"replenishment","featureId":"matchReorderPointToMaximumOrderAmount","featureName":"Match Reorder Point to Maximum Order Amount","featureDescription":null,"featureType":"boolean","featureListId":null,"displaySeqNumber":null,"defaultValue":"1","isPublic":"1","parentFeatureId":null,"fileName":"posMClient/sar.ovccfg","visibilityExpression":null,"isDeleted":false,"featureValue":"","lastModified":new Date(),"created":new Date()});

// STOCK-4213
db.getCollection('config_tbl').remove({'featureId':'enableDROPSHIP'});
db.getCollection('config_tbl').insert({"locationOrGroupId":"posMClient-grp-all","applicationId":"SAR","moduleId":"stockModule","featureGroup":"dropShip","featureId":"enableDROPSHIP","featureName":"Enable Drop-Ship Order","featureDescription":null,"featureType":"boolean","featureListId":null,"featureValue":"","displaySeqNumber":null,"defaultValue":"0","isPublic":"1","parentFeatureId":null,"fileName":"posMClient/sar.ovccfg","visibilityExpression":null,"isDeleted":false,"lastModified":new Date(),"created":new Date()});

//STOCK-4411
db.getCollection('tran_type').remove({"tranTypeId" : {"$in":["INITIAL_STOCK_UPLOAD_OH","INITIAL_STOCK_UPLOAD_RESERVED","INITIAL_STOCK_UPLOAD_ALLOCATED","INITIAL_STOCK_UPLOAD_HELD","INITIAL_STOCK_UPLOAD_VENDOR_RETURN"]}});
db.getCollection('tran_type').insert([{"tranTypeId":"INITIAL_STOCK_UPLOAD_VENDOR_RETURN","tranName":"INITIAL_STOCK_UPLOAD_VENDOR_RETURN TT","description":"INITIAL_STOCK_UPLOAD_VENDOR_RETURN Transaction Type","tranCode":"POS","reversalTranTypeId":"","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"updateGl":false,"isManualTransaction":false,"isAllowReversal":false,"isSystemDefined":false,"isCostRequired":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_HELD","tranName":"INITIAL_STOCK_UPLOAD_HELD TT","description":"INITIAL_STOCK_UPLOAD_HELD Transaction Type","tranCode":"POS","reversalTranTypeId":"","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"updateGl":false,"isManualTransaction":false,"isAllowReversal":false,"isSystemDefined":false,"isCostRequired":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_ALLOCATED","tranName":"INITIAL_STOCK_UPLOAD_ALLOCATED TT","description":"INITIAL_STOCK_UPLOAD_ALLOCATED Transaction Type","tranCode":"POS","reversalTranTypeId":"","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"updateGl":false,"isManualTransaction":false,"isAllowReversal":false,"isSystemDefined":false,"isCostRequired":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_RESERVED","tranName":"INITIAL_STOCK_UPLOAD_RESERVED TT","description":"INITIAL_STOCK_UPLOAD_RESERVED Transaction Type","tranCode":"POS","reversalTranTypeId":"","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"updateGl":false,"isManualTransaction":false,"isAllowReversal":false,"isSystemDefined":false,"isCostRequired":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_OH","tranName":"INITIAL_STOCK_UPLOAD_OH TT","description":"INITIAL_STOCK_UPLOAD_OH Transaction Type","tranCode":"POS","reversalTranTypeId":"","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"updateGl":false,"isManualTransaction":false,"isAllowReversal":false,"isSystemDefined":false,"isCostRequired":false,"__v":0,"created":new Date(),"lastModified":new Date()}]);

db.getCollection('tran_rule_def').remove({"tranTypeId" : {"$in":["INITIAL_STOCK_UPLOAD_OH","INITIAL_STOCK_UPLOAD_RESERVED","INITIAL_STOCK_UPLOAD_ALLOCATED","INITIAL_STOCK_UPLOAD_HELD","INITIAL_STOCK_UPLOAD_VENDOR_RETURN"]}});
db.getCollection('tran_rule_def').insert([{"tranTypeId":"INITIAL_STOCK_UPLOAD_VENDOR_RETURN","balanceType":"wac","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":false,"recalculate":true,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_VENDOR_RETURN","balanceType":"atp","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":false,"recalculate":true,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_VENDOR_RETURN","balanceType":"ats","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":false,"recalculate":true,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_VENDOR_RETURN","balanceType":"held","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_VENDOR_RETURN","balanceType":"returnToVendor","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":false,"recalculate":false,"subtract":false,"add":true,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_VENDOR_RETURN","balanceType":"reserved","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_VENDOR_RETURN","balanceType":"allocated","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_VENDOR_RETURN","balanceType":"oh","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_HELD","balanceType":"atp","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":false,"recalculate":true,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_HELD","balanceType":"wac","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":false,"recalculate":true,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_HELD","balanceType":"ats","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":false,"recalculate":true,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_HELD","balanceType":"reserved","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_HELD","balanceType":"returnToVendor","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_HELD","balanceType":"allocated","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_HELD","balanceType":"held","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":false,"recalculate":false,"subtract":false,"add":true,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_HELD","balanceType":"oh","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_ALLOCATED","balanceType":"atp","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":false,"recalculate":true,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_ALLOCATED","balanceType":"ats","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":false,"recalculate":true,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_ALLOCATED","balanceType":"held","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_ALLOCATED","balanceType":"returnToVendor","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_ALLOCATED","balanceType":"wac","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":false,"recalculate":true,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_ALLOCATED","balanceType":"reserved","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_ALLOCATED","balanceType":"allocated","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":false,"recalculate":false,"subtract":false,"add":true,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_ALLOCATED","balanceType":"oh","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_RESERVED","balanceType":"wac","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":false,"recalculate":true,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_RESERVED","balanceType":"returnToVendor","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_RESERVED","balanceType":"atp","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":false,"recalculate":true,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_RESERVED","balanceType":"held","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_RESERVED","balanceType":"ats","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":false,"recalculate":true,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_RESERVED","balanceType":"allocated","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_RESERVED","balanceType":"reserved","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":false,"recalculate":false,"subtract":false,"add":true,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_RESERVED","balanceType":"oh","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_OH","balanceType":"wac","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":false,"recalculate":true,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_OH","balanceType":"returnToVendor","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_OH","balanceType":"atp","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":false,"recalculate":true,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_OH","balanceType":"ats","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":false,"recalculate":true,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_OH","balanceType":"held","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_OH","balanceType":"reserved","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_OH","balanceType":"allocated","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false,"__v":0,"created":new Date(),"lastModified":new Date()},{"tranTypeId":"INITIAL_STOCK_UPLOAD_OH","balanceType":"oh","createdBy":"oneview","updatedBy":"oneview","isActive":true,"isDeleted":false,"noAction":false,"recalculate":false,"subtract":false,"add":true,"__v":0,"created":new Date(),"lastModified":new Date()}]);

// STOCK-4334
db.getCollection('tran_type').remove({'tranTypeId':'INITIAL_STOCK_UPLOAD_RETURNTOVENDOR'});
db.getCollection('tran_type').insert({"tranTypeId":"INITIAL_STOCK_UPLOAD_RETURNTOVENDOR","tranName":"INITIAL_STOCK_UPLOAD_RETURNTOVENDOR TT","description":"INITIAL_STOCK_UPLOAD_RETURNTOVENDOR Transaction Type","tranCode":"TWO","reversalTranTypeId":"","createdBy":"oneview","updatedBy":"oneview","isActive":true,"lastModified":new Date(),"created":new Date(),"isDeleted":false,"updateGl":false,"isManualTransaction":false,"isAllowReversal":false,"isSystemDefined":false,"isCostRequired":false});
db.getCollection('tran_rule_def').remove({'tranTypeId':'INITIAL_STOCK_UPLOAD_RETURNTOVENDOR'});
db.getCollection('tran_rule_def').insert([{"tranTypeId":"INITIAL_STOCK_UPLOAD_RETURNTOVENDOR","balanceType":"oh","createdBy":"oneview","updatedBy":"oneview","isActive":true,"lastModified":new Date(),"created":new Date(),"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false},{"tranTypeId":"INITIAL_STOCK_UPLOAD_RETURNTOVENDOR","balanceType":"reserved","createdBy":"oneview","updatedBy":"oneview","isActive":true,"lastModified":new Date(),"created":new Date(),"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false},{"tranTypeId":"INITIAL_STOCK_UPLOAD_RETURNTOVENDOR","balanceType":"allocated","createdBy":"oneview","updatedBy":"oneview","isActive":true,"lastModified":new Date(),"created":new Date(),"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false},{"tranTypeId":"INITIAL_STOCK_UPLOAD_RETURNTOVENDOR","balanceType":"held","createdBy":"oneview","updatedBy":"oneview","isActive":true,"lastModified":new Date(),"created":new Date(),"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false},{"tranTypeId":"INITIAL_STOCK_UPLOAD_RETURNTOVENDOR","balanceType":"atp","createdBy":"oneview","updatedBy":"oneview","isActive":true,"lastModified":new Date(),"created":new Date(),"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false},{"tranTypeId":"INITIAL_STOCK_UPLOAD_RETURNTOVENDOR","balanceType":"returnToVendor","createdBy":"oneview","updatedBy":"oneview","isActive":true,"lastModified":new Date(),"created":new Date(),"isDeleted":false,"noAction":false,"recalculate":false,"subtract":false,"add":true},{"tranTypeId":"INITIAL_STOCK_UPLOAD_RETURNTOVENDOR","balanceType":"wac","createdBy":"oneview","updatedBy":"oneview","isActive":true,"lastModified":new Date(),"created":new Date(),"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false},{"tranTypeId":"INITIAL_STOCK_UPLOAD_RETURNTOVENDOR","balanceType":"ats","createdBy":"oneview","updatedBy":"oneview","isActive":true,"lastModified":new Date(),"created":new Date(),"isDeleted":false,"noAction":true,"recalculate":false,"subtract":false,"add":false}]);