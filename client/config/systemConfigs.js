'use strict';

var config = angular.module('OVCstockApp.systemConfigs', []);

config.constant('OVC_LANGUAGE', {
	'default_lang': 'en'
});

config.constant('CONSTANTS_VAR', {
	'DATE_FORMAT': 'MM/DD/YYYY',
	'DATE_FORMAT_VAL': 'MM/dd/yyyy', 
	'MAX_PAGE_SIZE' : 100,
	'DELIVERIES_PAGE_LIMIT': 10,
	'ORDER_REVIEW_PAGE_LIMIT': 50,
	'TIME_FORMAT':'hh:mm:ss',
	'DATE_FORM_CALANDER':'mm/dd/yyyy'
});

config.constant('DATE_PICKER_FORM' , {
	'MMM dd, yyyy' : 'M dd, yyyy',
	'dd MMM, yyyy':'dd M, yyyy',
	'dd/MM/yyyy' :'dd/mm/yyyy',
	'MM/dd/yyyy' :'mm/dd/yyyy'
});

config.constant('MOMENT_FORMATS' , {
	'MMM dd, yyyy' : 'MMM DD, YYYY',
	'dd MMM, yyyy':'DD MMM, YYYY',
	'dd/MM/yyyy' :'DD/MM/YYYY',
	'MM/dd/yyyy' :'MM/DD/YYYY',
	'TIME' : 'h:mm A',
	'TIME_WITH_SS':'h:mm:ss A',
	'DEFAULT':'DD/MM/YYYY'
});

config.constant('ZCOUNT', {
	'POSITIVE': 'POSITIVECNTADJ', 'NEGATIVE': 'NEGATIVECNTADJ'
});

config.constant('VERSIONCON', {

	'version_control':'OneView Inventory Management v 2.13.1'
});

config.constant('CARRIERCODES',[
	{Id:1,Name:'FDEN',selected:false},
	{Id:2,Name:'USIT',selected:false},
	{Id:3,Name:'FOUR',selected:false},
	{Id:4,Name:'TEST',selected:false},
	{Id:5,Name:'VEND',selected:false},
	{Id:6,Name:'PRDT',selected:false},
	{Id:7,Name:'STCK',selected:false},
	{Id:8,Name:'LOCN',selected:false},
	{Id:9,Name:'MAPP',selected:false},
	{Id:10,Name:'STRE',selected:false},
	{Id:11,Name:'ACCT',selected:false},
	{Id:12,Name:'OVCJ',selected:false},
	{Id:13,Name:'ACLD',selected:false},
	{Id:14,Name:'CCOD',selected:false}
]);
config.constant('COUNTRIES',[
	{id:1,code:'FRA'},
	{id:2,code:'USA'},
	{id:3,code:'AUS'}  
]);
config.constant('STATES',[
	
	{id:1,country:'FRA',code:'maha'},
	{id:2,country:'FRA',code:'mady'},

	{id:3,country:'FRA',code:'raja'},
	{id:4,country:'FRA',code:'tndu'},
	{id:5,country:'FRA',code:'krla'},

	{id:6,country:'USA',code:'alab'},
	{id:7,country:'USA',code:'cali'},
	{id:8,country:'USA',code:'illi'},
	{id:9,country:'AUS',code:'nesw'},
	{id:10,country:'AUS',code:'vict'},
	{id:11,country:'IND',code:'raja'},
	{id:12,country:'IND',code:'tndu'},
	{id:13,country:'IND',code:'krla'}
]);
 config.constant('UOM',[
	{id:'Each',name:'Each'},
	{id:'Dozen',name:'Dozen'},
	{id:'Case',name:'Case'},
	{id:'Carton',name:'Carton'},
	{id:'Pound',name:'Pound'},
	{id:'Gram',name:'Gram'},
	{id:'Ounce',name:'Ounce'}
]);
config.constant('system_settings',{
	'currency':'$',	// HTML Code for Dollar Synmbol 
	'eurocurrency':'€',
	'percentage':'%'}
);


config.constant('TRANSTYPE',[
          {id:1,code:'USER'},
		  {id:2,code:'SYS'}
]);

config.constant('TRANSTATUS',[
          {id:1,code:'ONE'},
		  {id:2,code:'ZERO'}
]);

config.constant('TRANSCODE',[
          {id:1,code:'POS'},
		  {id:2,code:'NEG'},
		  {id:3,code:'TWO'}
]);

config.constant('SLPSTYLE',[
			{id:1,Name:'STY'}
		    
]);

config.constant('SLPSIZE',[
			{id:1,Name:'SYZ'}
		    
]);
config.constant('SLPCOLOUR',[
			{id:1,Name:'CLR'}
		    
]);
config.constant('REQUIREDFIELDS',[
                              	{Id:1,Name:'FDEN',selected:false},
                              	{Id:2,Name:'USIT',selected:false},
                              	{Id:3,Name:'FOUR',selected:false},
                              	{Id:4,Name:'TEST',selected:false},
                              	{Id:5,Name:'VEND',selected:false},
                              	{Id:6,Name:'PRDT',selected:false},
                              	{Id:7,Name:'STCK',selected:false},
                              	{Id:8,Name:'LOCN',selected:false}
                              ]);

config.constant('RULEDEFN',[
	{
		'BALFIELDS':[
				  {id:'sonhand',Name:'OH',label:'oh'},
				  {id:'sallocated',Name:'ALLOC',label:'allocated'},
				  {id:'sreserved',Name:'RESER',label:'reserved'}
		]
	},
	{
		'HELDSTOCK':[
		  {id:'sheld',Name:'HEL',label:'held'},
		  {id:'srtv',Name:'RTV',label:'returnToVendor'}
		]	
	},
	{
		'CALCFIELDS':[
		   {id:'sats',Name:'ATS',label:'ats'},
		   {id:'satp',Name:'ATP',label:'atp'},
		   {id:'swac',Name:'WAC',label:'wac'}
		]
	} 
]);
config.constant('DOCUMENTRULE',[
	
	{
		'GOODSIN':[
			{id:'sorderin',Name:'ORDER',label:'openOnOrderIn', level : 0},
			{id:'sunconfirmin',Name:'UNCONFOR',label:'unConfirmedIn',level : 1},   
		    {id:'sconfirmin',Name:'CONFOR',label:'confirmedOrdersIn',level : 1},
		    {id:'sasnin',Name:'ASN',label:'asnIn',level : 2},
			{id:'srejin',Name:'REJ',label:'rejectedIn', level : 0}, 
			{id:'stransitin',Name:'TRANS',label:'transferIn', level : 0}   
		]
	},
	{
		'GOODSOUT':[
			{id:'sorderout',Name:'OPEN',label:'openOnOrderOut', level : 0},
			{id:'sunconfirmout',Name:'UNCONFO',label:'unConfirmedOut', level : 1},   
		    {id:'sconfirmout',Name:'CON',label:'confirmedOrdersOut', level : 1},
		    {id:'sasnout',Name:'ASNIN',label:'asnOut', level : 2},
			{id:'srejout',Name:'REJO',label:'rejectedOut', level : 0},   
			{id:'stransitout',Name:'TRANSIT',label:'transferOut', level : 0}   
		]
	}
]);

config.constant('REPLENISHMENTRULE',[
			{id:'reorder',Name:'REORDER',label:'reordertrigger'},
			{id:'maxorder',Name:'MAXORDER',label:'maximumorder'}   
]);

config.constant('PRODUCTPERFORM',[
	{
		'STYLEDETAILS':[
				  {id:'pcode',Name:'productCode'},
				  {id:'pdescription',Name:'Description'},
				  {id:'imgbydefault',Name:'ImageURL',type:'image'},
				  {id:'pproperties',Name:'properties'},
				  {id:'pgender',Name:'Gender'},
				  {id:'pgroup',Name:'Group'},

		]
	},
	{
		'SKUDETAILS':[
		  {id:'psku',Name:'sku'},
		  {id:'pdesc', Name:'description'},
		  {id:'pvariants',Name:'variants'},
		  {id:'ptotrec',Name:'totalreceived',hover:'totalreceived'},
		  {id:'ptotsold',Name:'totalsold',hover:'totalsold'},
		  {id:'ptotreturn',Name:'totalreturned',hover:'totalreturned'},
		  {id:'prepleinsh',Name:'Replenishment'},
		  {id:'pfrecdate',Name:'firstrecvdate',type:'Date'},
		  {id:'plrecdate',Name:'lastrecvdate',type:'Date'},
		  {id:'plsolddate',Name:'lastsolddate',type:'Date'},
		  {id:'plupdate',Name:'lastupdatedate',type:'Date'}
		]	
	}
]);

config.constant('DOCREQFIELDS',[
	{Id:1,Name:'ORNO',selected:false},
	{Id:2,Name:'ORDT',selected:false},
	{Id:3,Name:'EXDT',selected:false},
	{Id:4,Name:'PRID',selected:false},
	{Id:5,Name:'QNTY',selected:false}
]);

config.constant('TRANREQFIELDS',[
	{Id:1,Name:'ORNO',selected:false},
	{Id:2,Name:'DATE',selected:false},
	{Id:3,Name:'QNTY',selected:false},
	{Id:4,Name:'COST',selected:false}
]);

config.constant('PRICELIST',[
	{id:'purprice',Name:'PURPRICE',label:'purchaseprice',priceType:1,type:'purchase'},
	{id:'retailprice',Name:'RETPRICE',label:'retailprice',priceType:2},
	{id:'storeprice',Name:'STOREPRICE',label:'storeprice'},
	{id:'margin',Name:'MARGIN',label:'margin',percentageCalculation:"((retailPrice - purchasePrice) * 100)/retailPrice",currencyCalculation:"(retailPrice - purchasePrice)",marginFormat:'percentage',type:'purchase'}
]);

config.constant('REVERSEICON',[
	{id:1,reverselevel:'PACK'}
]);

config.constant('POSRULEDEFN',[
	{
		'BALFIELDS':[
				  {id:1,Name:'OH',label:'oh',noaction:'T',add:'T',subtract:'P',recalculate:'N'},
				  {id:2,Name:'ALLOC',label:'allocated',noaction:'T',add:'T',subtract:'P',recalculate:'N'},
				  {id:3,Name:'RESER',label:'reserved',noaction:'T',add:'T',subtract:'P',recalculate:'N'}
		]
	},
	{
		'HELDSTOCK':[
		  {id:1,Name:'HEL',label:'held',noaction:'T',add:'T',subtract:'P',recalculate:'N'},
		  {id:2,Name:'RTV',label:'returnToVendor',noaction:'T',add:'T',subtract:'P',recalculate:'N'}
		]	
	},
	{
		'CALCFIELDS':[
		   {id:1,Name:'ATS',label:'ats',noaction:'T',add:'N',subtract:'N',recalculate:'T'},
		   {id:2,Name:'ATP',label:'atp',noaction:'T',add:'N',subtract:'N',recalculate:'T'},
		   {id:3,Name:'WAC',label:'wac',noaction:'P',add:'N',subtract:'N',recalculate:'F'}
		]
	}
]);

config.constant('NEGRULEDEFN',[
	{
		'BALFIELDS':[
				  {id:1,Name:'OH',label:'oh',noaction:'T',add:'P',subtract:'T',recalculate:'N'},
				  {id:2,Name:'ALLOC',label:'allocated',noaction:'T',add:'P',subtract:'T',recalculate:'N'},
				  {id:3,Name:'RESER',label:'reserved',noaction:'T',add:'T',subtract:'T',recalculate:'N'}
		]
	},
	{
		'HELDSTOCK':[
		  {id:1,Name:'HEL',label:'held',noaction:'T',add:'P',subtract:'T',recalculate:'N'},
		  {id:2,Name:'RTV',label:'returnToVendor',noaction:'T',add:'T',subtract:'T',recalculate:'N'}
		]	
	},
	{
		'CALCFIELDS':[
		   {id:1,Name:'ATS',label:'ats',noaction:'T',add:'N',subtract:'N',recalculate:'T'},
		   {id:2,Name:'ATP',label:'atp',noaction:'T',add:'N',subtract:'N',recalculate:'T'},
		   {id:3,Name:'WAC',label:'wac',noaction:'T',add:'N',subtract:'N',recalculate:'T'}
		]
	}
]);

config.constant('TWORULEDEFN',[
	{
		'BALFIELDS':[
				  {id:1,Name:'OH',label:'oh',noaction:'T',add:'T',subtract:'T',recalculate:'N'},
				  {id:2,Name:'ALLOC',label:'allocated',noaction:'T',add:'T',subtract:'T',recalculate:'N'},
				  {id:3,Name:'RESER',label:'reserved',noaction:'T',add:'T',subtract:'T',recalculate:'N'}
		]
	},
	{
		'HELDSTOCK':[
		  {id:1,Name:'HEL',label:'held',noaction:'T',add:'T',subtract:'T',recalculate:'N'},
		  {id:2,Name:'RTV',label:'returnToVendor',noaction:'T',add:'T',subtract:'T',recalculate:'N'}
		]	
	},
	{
		'CALCFIELDS':[
		   {id:1,Name:'ATS',label:'ats',noaction:'T',add:'N',subtract:'N',recalculate:'T'},
		   {id:2,Name:'ATP',label:'atp',noaction:'T',add:'N',subtract:'N',recalculate:'T'},
		   {id:3,Name:'WAC',label:'wac',noaction:'T',add:'N',subtract:'N',recalculate:'T'}
		]
	}
]);

config.constant('system_currencies',[
	{id:'currency',code:'Euro'} // HTML Code for Dollar Synmbol 
]);


config.constant('ORDERTYPES',[
	{id:3,code:'MAN'},
	{id:2,code:'ZFUT'},
	{id:1,code:'RPL'}
	
]);

config.constant('TRANSFERTYPES',[
	{id:1,code:'IBT_M'}
]);

config.constant('MANUALSHIPMENT',[
	{id:1,code:'PUSH'}	
]);

config.constant('REVERSEREASONS',[

	{id:1,code:'FSL'},
	{id:2,code:'FZL'},
	{id:3,code:'FND'}
]);

config.constant('ZONECOUNT',[

	{id:1,code:'Cycle'},
	{id:2,code:'Physical'},
]);

config.constant('ORDERTYPELIST',[
{id:1,code:'RPL'},
{id:2,code:'IBT_M'},
{id:3,code:'MAN'},
{id:4,code:'ZFUT'},
{id:5,code:'PUSH'}
]);

config.constant('ORDERSTATUS',[
	{id:1,code:'draft'},
	{id:2,code:'forceclosed'},
	{id:3,code:'onhold'},
	{id:4,code:'received'},
	{id:5,code:'returned'},
	{id:6,code:'inProgress'},
	{id:7,code:'submitted'},
	{id:8,code:'partiallyShipped'},
	{id:9,code:'confirmed'},
	{id:10,code:'shipped'}
]);
config.constant('COUNTSTATUS',[
	{id:1,code:'approve'},
	{id:2,code:'inProgress'},
	{id:3,code:'open'},
	{id:4,code:'creatingSnapshot'}

]);
config.constant('DISCREPANCY_FILTER',[
	{id:1, code:'noDiscrepancy'},
	{id:2, code:'discrepancy'}
]);
config.constant('TRANTYPELIST',[
	{id:1,	code:'purchaseOrder'},
	{id:2,	code:'count'},
	{id:3,	code:'adjustment'},
	{id:4,	code:'transfer'},
	{id:5,	code:'manualShipment'},
	{id:6, 	code:'return'},
	{id:7,  code:'posTransaction'},
	{id:8,  code:'receipt'},
	{id:9,  code:'DROP_SHIP'},
	{id:10,  code:'ZFUT'},
	{id:11,  code:'stockUpload'}
]);

config.constant('QTYSTATUS',[
{id:1,code:'submitted'},
{id:2,code:'confirmed'},
{id:3,code:'unconfirmed'},
{id:4,code:'rejected'},
{id:5,code:'shipped'},
{id:6,code:'receiveInProgress'},
{id:6,code:'received'},
{id:7,code:'return'},
{id:8,code:'hold'}
]);

config.constant('TOTALEXPQUANTITY',{
	expQuantityCalculation: "(confirmed + unconfirmed) "
});


config.constant('RETURNTYPELIST',[
{id:1,code:'RA'},
{id:2,code:'QLTY'},
{id:3,code:'OTHER'}
]);

config.constant('RECEIPTTYPES',[
	{id:1,code:'MR_IBT_M'},
	{id:2,code:'MR_MAN'}
	
]);

config.constant('PACKAGESTATUS',[
	{id:1, code: 'shipped'},
   	{id:2, code: 'receiveInProgress'},
   	{id:3, code: 'partiallyReceived'},
   	{id:4, code: 'receivedInFull'},
   	{id:5, code: 'closed'}
]);

config.constant('ORDERTYPEDELIVERIES',[
	{id:1, code: 'MAN'},
   	{id:2, code: 'IBT_M'},
   	{id:3, code: 'PUSH'},
   	{id:4, code: 'RECEIPT'}
]);


config.constant('MAN_STATUS',[
	{id:1,code:'draft'},
	{id:2,code:'submitted'},
	{id:3,code:'inProgress'},
	{id:4,code:'cancelled'},
	{id:5,code:'Completed'},
	{id:6,code:'forceClosed'}
]);

config.constant('IBT_STATUS', [
	{id:1, 	code: 	"draft"},
	{id:2,	code: 	"submitted"},
	{id:3,	code: 	"confirmed"},
	{id:4,	code: 	"partiallyShipped"},
	{id:5,	code: 	"shippedFull"},
	{id:6,	code: 	"receivedFull"},
	{id:7,	code: 	"receivedWithDescrepancies"},
	{id:8,  code:   "rejected"},
	{id:9,  code:   "inProgress"}
]);

config.constant('MSHIP_STSTUS', [
	{id:1, 	code: 	"draft"},
	{id:2,	code: 	"shipped"},
	{id:3,	code: 	"received"},
	{id:4,	code: 	"receivedWithDescrepancies"}
]);


config.constant('FindItConfig', {
'Authorization' :'YWRtaW46bmltZGE=',
'X-Ovc-Duuid' : 'posMClient-web'
});

config.constant('seriveType',{
'AddReceipt_SERVICE' : 'AddToReceipt',
'CreatePickup_SERVICE' : 'CreatePickup'
});

config.constant('REASONCODETYPE',[
	{id:1,code:'RTN'},
	{id:2,code:'RCPT_RVS'},
	{id:3,code:'RCV_DISPCY'},
	{id:4,code:'MAN_ADJS'}
]);

config.constant('REPLENISHMENTRULESHEADER',["locationId","sku","reorder","maxOrder","roundingValue"]);
config.constant('COUNTFILEHEADER',["barcode","quantity","zoneId"]);
config.constant('ASNFILEHEADER',["barcode","quantity"]);

config.constant('QTYREASONCODES',[
	{id:1,code:'shippedLess'},
	{id:2,code:'shippedMore'},
	{id:2,code:'lost'}
]);


config.constant('ADJUSTMENTTRANSACTIONMAPPING',[{
	MISCISSUE		: 	'MISCISSUERV',
	MISCRECEIPT		: 	'MISCRECEIPTRV',
	LOSSBYTHEFT		: 	'LOSSBYTHEFTRV',
	CARRIERLOSS		: 	'CARRIERLOSSRV',
	DAMAGEHELD		: 	'HELDTOSELL',
	HELDTOSELL		: 	'DAMAGEHELD'
}]);

config.constant('DROPSHIPSTATUS',[
	{id:1,code:'draft'},
	{id:3,code:'submitted'},
	{id:2,code:'inProgress'}
]);

config.constant('CUSTOMERORDERS',[
	{id:1,code:'DROP_SHIP'}
]);
config.constant('MANUALRECEIPTSTATUS',[
	{id:1,code:'draft'},
	{id:2,code:'received'},
]);

config.constant('RETURNSTATUS',[
	{id:1,code:'draft'},
	{id:2,code:'returned'},
]);
config.constant('REPLENISHMENTREORDERTYPE',{
'atp':'Available to Promise','oh':'On Hand',
	
});
config.constant('ADJUSTMENTSTATUS',[
	{id:1,code:'Draft'},
	{id:2,code:'Adjusted'},
	{id:3,code:'reversed'},
	{id:4,code:'reversed_draft'},
	{id:5,code:'rvs_draft'},
	{id:6,code:'adjusted_rvs'}
]);

config.constant('ADVANCESEARCHFIELDS',{
	orders:['sku','asn','price','quantity'],
	deliveries:['price','quantity'],
	transactionHistory:['sku','createdBy','price','quantity'],
	adjustments:['sku','price','quantity']
});

config.constant('ANAYLTICSDATE',[
	{id:1,code:'yesterday'},
	{id:2,code:'lastweek'},
	{id:3,code:'lastmonth'},
	{id:4,code:'custom'}
]);
config.constant('ORGANIZATIONSTRUCTURE',[
	{id:1,code:'Corporate'},
	{id:2,code:'Franchise'}
]);

config.constant('RETURN_STATUS_TO_EXPORT',{
	'returned':'Returned',
	'draft':'Draft'
});

config.constant('INV_BLNC_EXPORT',[
	{id:1,code:'oh'},
	{id:2,code:'ats'}
]);
config.constant('REPLENISHMENTROUNDING',{
'0':'No Rounding',
'up':'Round Up',
'down':'Round Down'
});

config.constant('COUNT_STATUS_OBJ',{
	"APPROVE": "approve",
	"INPROGRESS": "inProgress",
	"OPEN": "open",
	"BEING_CREATED": "beingCreated",
	"CREATING_SNAPSHOT": "creatingSnapshot",
	"VALIDATE": "validate",
	"RECOUNT": "recount"
});

config.constant('COUNT_ZONE_STATUS_OBJ',{
	"APPROVE": "approve",
	"RECOUNT": "recount",
	"OPEN": "open",
	"VALIDATE": "validate"
});
