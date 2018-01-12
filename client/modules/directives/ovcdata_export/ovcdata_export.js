/*********************************************************************
*
*   Great Innovus Solutions Private Limited
*
*    Module     :   Exporting Data PDF / EXCEL
*
*    Developer  :   Jagir
*
*    Date       :   03/02/2016
*
*    Version    :   1.0
*
**********************************************************************/
angular.module('ovcdataExport', []).factory('ovcdataExportFactory', ['$rootScope','$filter',  function ($rootScope,$filter) {

  var factory   = {};


  factory.getPdfHeader  = null;
  factory.counter       = 0;
  factory.export_data   = [];

  factory.getImageFromUrl = function(url) {
    var img   = new Image();

    img.onError = function() {
      alert('Cannot load image: "'+url+'"');
    };
    // img.onload = function() {
    //  callback(img);
    // };
    img.src = url;

    return img;
  };

  factory.getPdfHeaderColumns = function () {
      return [
          {title: "Store", dataKey: "label"},
          {title: "DateRange", dataKey: "value"}
      ];
  };
  factory.resetPdfHeaderData  = function() {
    factory.getPdfHeader  = null;
  };

  factory.setPdfHeaderData  = function(data_obj) {
      // console.log(data_obj);

      factory.getPdfHeader  = data_obj;
  };

  factory.getPdfHeaderData  = function() {

      return factory.getPdfHeader;
  };

  factory.exportReturnNestedExcel = function(obj) {
      var export_data = factory.exportExcelReturnNestedData(); 
        
       $('#'+obj.sourceId).table2excel({
          exclude: ".hideExport",
          name: obj.heading,
          filename: obj.heading,
          data_obj : export_data,
          external : true,
          exclude_img: true,
          exclude_links: true,
          exclude_inputs: true
      });
      return false;

  };

  factory.exportNestedExcel = function(obj) {

      if(obj.type === 'summary')
      { 
        var data_obj  = this.getExcelSummaryTables(obj);
      }
      else
      {
        var data_obj  = this.getExcelNestedTableData(obj); 
      }

      $('#'+obj.sourceId).table2excel({
            exclude: ".hideExport",
            name: obj.heading,
            filename: obj.heading,
            data_obj : data_obj,
            external : true,
            exclude_img: true,
            exclude_links: true,
            exclude_inputs: true
      });
        return false; 
  };

  factory.exportExcelData = function(obj) {
    $('#'+obj.sourceId).table2excel({
          exclude: ".hideExport",
          name: obj.heading,
          filename: obj.heading,
          exclude_img: true,
          exclude_links: true,
          exclude_inputs: true
    });
  };

  factory.getSummaryTables  = function() {

    var table = $('.export_table');

    var export_data = [];

    $.each(table, function(i, table_data){
        var obj = {};
        obj.th  = [];
        obj.td  = [];

		var table_data = $(table_data).clone(); 
		$(table_data).find('.hide_pdf').remove(); 

        $.each($(table_data).find('thead th'), function(j, th_data){
          obj.th.push($(th_data).text().trim());
        });
        $.each($(table_data).find('tbody tr'), function(j, tr_data){
          var tds   = [];
          $.each($(tr_data).find('td'), function(j, td_data){
            tds.push($(td_data).text().trim());
          });
          obj.td.push(tds);
        });
        // console.log(table_data)
        export_data.push(obj);
    });

    return export_data;
  };


  factory.getExcelSummaryTables  = function(obj) {
    var doc    = new jsPDF('l', 'pt');
    var table = $('#'+obj.sourceId).find('>thead > tr');

    var export_data = [];  
    $.each(table, function(i, table_data){
      var final_obj = {};

    final_obj.columns   = [];
    final_obj.rows      = [];
    var tmp   = [];

    var table_data = $(table_data).clone();
    $(table_data).find('.hide_pdf').remove();

      var first_obj   = doc.autoTableHtmlToJson($(table_data).find('table:eq(0)')[0]);
      var second_obj  = doc.autoTableHtmlToJson($(table_data).find('table:eq(1)')[0]);

      if(first_obj.columns.length > 0 && i == 0)
        final_obj.columns   = $.merge(final_obj.columns, first_obj.columns);

      if(first_obj.rows.length > 0)
        tmp   = $.merge(tmp, first_obj.rows);

      if(second_obj.columns.length > 0 && i == 0)
        final_obj.columns   = $.merge(final_obj.columns, second_obj.columns);

      if(second_obj.rows.length > 0) {
        $.each(second_obj.rows, function(i, item) {
          var temp = angular.copy(tmp[0]); 
          var final_tmp  =  $.merge(temp, item); 
          final_obj.rows.push(final_tmp);
          temp  = [];
        });
      }

      export_data.push(final_obj);
        
    }); 
    doc = null;
    return export_data;
  };


  factory.getSummaryHeaderData  = function() {
    var header = $('.export_pre_header').clone();

    $(header).find('.hide_pdf').remove(); 

    var export_data = [];

    $.each(header, function(i, item) {
      var item  = $(item);
      var obj   = {};

        obj.th  = [];
        obj.td  = [];
        var tds   = [];
        $.each(item.find('p'), function(j, p_item){
            var label = $(p_item).find('label:first').text().trim().replace(':', '');
            var value = $(p_item).find('span').text().trim().replace(':', '');
            obj.th.push(label);
            tds.push(value);
        });

        obj.td.push(tds);
 
        export_data.push(obj);
    });

    return export_data;
  };

factory.getTheadValues  = function(thead_obj) {
    // console.log("*******thead_obj html*******"); 
    var obj   = {};
    obj.th    = [];
    obj.td    = [];

    thead_obj   = $(thead_obj);
    // console.log(thead_obj);
    // debugger;
    // console.log("thead_obj.next('tr').length", thead_obj.next('tr').length);
    // console.log('***********TRTRTR****');
    // console.log(thead_obj.find('tr').length);
    if(thead_obj.find('tr').length > 1)
    {
      $.each(thead_obj.find('tr'), function(i, tr_data){
        var tds   = [];

        $.each($(tr_data).find('th'), function(j, th_data){
            obj.th.push($(th_data).text().trim());  
        })
        $.each($(tr_data).find('td'), function(j, th_data){
            tds.push($(th_data).text().trim()); 
        });

        obj.td.push(tds);

      });
    }
    else
    {
      // console.log($(thead_obj).html());
      var tds  = [];
      $.each(thead_obj.find('th'), function(i, th_data){
        var t_label_data  = $(th_data).find('.export_label').text().trim();
        var t_value_data  = $(th_data).find('.export_value').text().trim();
        // var tds  = [];
        if($(th_data).find('.export_label') && t_label_data != '')
        {
          obj.th.push(t_label_data);
        }

        if($(th_data).find('.export_value') && t_value_data != '')
        {
          tds.push(t_value_data);
        }

      }); 

      obj.td.push(tds);
    }
 
    factory.export_data.push(obj);
  }; 

  factory.iterateSelectedRecordCount  = function(obj) { 
    var recordCount  = 0 ; 
    if(obj.exportContentType == 'Outbound'){
        $.each($rootScope.asn_details.asns, function(i, asnData){ 
          if(typeof asnData == 'object' && asnData.selectedASN &&  asnData.selectedASN == true)
            recordCount++; 
        });
      }
      return recordCount;
  };

  factory.getExcelNestedTableData  = function(obj) { 
    
     factory.export_data  = [];
     var final_obj        = {};   
     //Load header values
     final_obj.columns    = ["ASN","PO","ASN Value","Order Type","Total package Qty","Total Asn Quantity","Package","Number Of SKUs","Shipped Date","Expected Delivery Date","Style","Description","SKU Shipped","Total Quantity Shipped","Line Number","SKU","Description","Purchase Price","Expected Qty"];
     final_obj.rows       = [];

      var selectedRecordCount  = this.iterateSelectedRecordCount(obj); 
      var selected = false; 

      $.each($rootScope.asn_details.asns, function(i, asnData){
        var asnArray =  [];
        var poAsnpackageArray = [];
        var asnStatusArray = [];
        var shpstatusArray = [];
        var tmp = [];
         
        asnArray.push(asnData.asnId)
        asnArray.push(asnData.poId)
        asnArray.push(asnData.asnCost) 
        asnArray.push($rootScope.translation.orderstypelist[0][asnData.purchaseOrderType])
        asnArray.push(asnData.numberOfPackages)
        asnArray.push(asnData.asnQty)

        if(selectedRecordCount>0){ 
          if(typeof asnData == 'object' && asnData.selectedASN &&  asnData.selectedASN == true)
            selected = true; 
        }

         $.each(asnData.packages, function(j, poAsnpackage){
              poAsnpackageArray = []; 
              poAsnpackageArray.push(j)
              poAsnpackageArray.push(poAsnpackage.numberOfSKU)
              poAsnpackageArray.push($filter('dateForm')(poAsnpackage.shipDate))
              poAsnpackageArray.push($filter('dateForm')(poAsnpackage.expectedDeliveryDate))
              
              $.each(poAsnpackage.skus, function(key, po_asn_status){
                asnStatusArray = []; 
                asnStatusArray.push(((key).toString() != 'undefined')?key:'')
                asnStatusArray.push(po_asn_status.styleDescription)
                asnStatusArray.push(po_asn_status.skuArr.length)
                asnStatusArray.push(po_asn_status.totalShippedQty)

                $.each(po_asn_status.skuArr, function(p, skus){ 
                  shpstatusArray = [];
                  var asnCost = '';

                  shpstatusArray.push(skus.lineNumber);
                  shpstatusArray.push(skus.sku);
                  shpstatusArray.push(skus.description);
                  asnCost = (skus.skuCostAsn) ? skus.skuCostAsn : (skus.skuCostConfirm) ? skus.skuCostConfirm : skus.skuCost;
                  shpstatusArray.push(asnCost);
                  shpstatusArray.push(skus.qty); 
                  $.merge($.merge($.merge($.merge(tmp, asnArray), poAsnpackageArray), asnStatusArray), shpstatusArray);
                  if(obj.exportContentType == 'Outbound' && selectedRecordCount>0){
                    if(selected == true){
                      final_obj.rows.push(angular.copy(tmp));
                      tmp = []; 
                    }
                  }else{
                    final_obj.rows.push(angular.copy(tmp));
                    tmp = []; 
                  }
                   
                });
              }); 
          });
         selected = false;
      }); 
      factory.export_data.push(final_obj);
      final_obj = {};  
      return factory.export_data; 
  }; 

  factory.getTbodyParser  = function(tbody_obj) {

      tbody_obj = $(tbody_obj);

    $.each(tbody_obj.find('tr'), function(i, tbody_tbl){
		tbody_tbl = $(tbody_tbl);


      if(tbody_tbl.find('table thead:first').length > 0){ 
        factory.getTheadValues(tbody_tbl.find('table thead:first'));
      }

    //  if(tbody_tbl.find('table tbody:first').length > 0 && factory.counter == 0)
        //factory.getTbodyParser(tbody_tbl.find('table tbody:first'), factory.counter);

    });

    factory.counter++;
  };

  factory.getNestedTableData  = function(obj) {
  
    var table_master_data = $('.master_table');

    var selectedRecordCount = this.iterateSelectedRecordCount(obj); 
    $.each(table_master_data, function(k, table){  
      var table_data = $(table).clone();  
      $(table_data).find('.hide_pdf').remove(); 
      if(obj.exportContentType == 'Outbound' && selectedRecordCount>0){
        if($(table_data).find('tbody:first').hasClass('checkedASN')){
          factory.getTheadValues(table_data.find('thead:first')); 
          factory.getTbodyParser(table_data.find('tbody:nth-child(2)'), factory.counter); 
        }  
      }else{
        factory.getTheadValues(table_data.find('thead:first')); 
        factory.getTbodyParser(table_data.find('tbody:nth-child(2)'), factory.counter); 
      } 
    });

    // console.log("factory.export_data");
    // console.log(factory.export_data);
    return factory.export_data;
  };

  factory.exportExcelReturnNestedData  = function() { 

    var doc         = new jsPDF('l', 'pt'); 
    var table_obj   = $('.export_package_table');  
    var export_data = [];
    var header_Count_Val = 0;
    
    $.each(table_obj, function(i, table){

      var copyObj = {}; 
      copyObj.th = [];
      copyObj.td = [];
      $.each($(table).find('th'), function(n, th_data){
        var t_label_data  = $(th_data).find('.export_label').text().trim();
        var t_value_data  = $(th_data).find('.export_value').text().trim(); 

        $.each($(th_data).find('.export_label'), function(n, t_label_data){
          copyObj.th.push($(t_label_data).text().trim());
         }); 
        $.each($(th_data).find('.export_value'), function(n, t_value_data){
          copyObj.td.push($(t_value_data).text().trim());
        }); 

      });
    
      var table = $(table).find('>tbody > tr');

      $.each(table, function(j, table_data){
        
        var final_obj = {};
        final_obj.columns   = [];
        final_obj.rows      = [];
        var tmp   = [];

        var table_data = $(table_data).clone();
        $(table_data).find('.hide_pdf').remove(); 
          if($(table_data).find('table:eq(0)').length>0){

            var first_obj   = $(table_data).find('table:eq(0)')[0] ? doc.autoTableHtmlToJson($(table_data).find('table:eq(0)')[0]) : "";
            var second_obj  = $(table_data).find('table:eq(1)')[0] ? doc.autoTableHtmlToJson($(table_data).find('table:eq(1)')[0]) : ""; 
            
            if(first_obj && header_Count_Val == 0)
              final_obj.columns   = $.merge(copyObj.th, first_obj.columns); 
            
            if(first_obj && first_obj.rows.length > 0)
              tmp   = $.merge(angular.copy(copyObj.td), first_obj.rows[0]);

            if(second_obj && header_Count_Val == 0){ 
              final_obj.columns   = $.merge(final_obj.columns, second_obj.columns); 
              header_Count_Val++;
            }

            if( second_obj && second_obj.rows.length > 0) {
              $.each(second_obj.rows, function(k, item) {
                var temp = angular.copy(tmp); 
                var final_tmp  =  $.merge(temp, item); 
                final_obj.rows.push(final_tmp);
                temp  = [];
              });
            }

            //Second Object Empty
            if(!second_obj){
              var temp = angular.copy(tmp); 
              final_obj.rows.push(temp);
            }  
            export_data.push(final_obj);
            }
        }); 
      }); 
    doc = null;
    return export_data; 
  };

  factory.exportReturnNestedData  = function() {
    var doc = null;

    doc    = new jsPDF('l', 'pt');
    doc.setPage(2);
    var export_data = [];

   var table_obj   = $('.export_package_table');

    $.each(table_obj, function(i, table_data) {
        var obj   = {};
        obj.columns   =  [];
        obj.rows      =  [];
        var tds   = [];

        var table_data = $(table_data).clone(); 
        $(table_data).find('.hide_pdf').remove();
        
        $.each($(table_data).find('.export_header .export_header_item'), function(j, head_item){
          //console.log($(head_item).find('.export_header_label').text(), $(head_item).find('.export_header_value').text());
            obj.columns.push($(head_item).find('.export_header_label').text().trim());
            tds.push($(head_item).find('.export_header_value').text().trim());
        });

 
        obj.rows.push(tds);

        export_data.push(obj)
        $.each($(table_data).find('tbody .export_table_data'), function(k, tbody_item){
            var tmp = doc.autoTableHtmlToJson($(tbody_item)[0]);
            export_data.push(tmp)
        });
    });

    return export_data;
  };

  factory.exportReturnNestedPdf = function(obj) {
    var doc = null;
    doc     = new jsPDF('l', 'pt');
    //Heading 
    doc.text(obj.heading, 350, 45);
    //Image
    var imgData   = this.getImageFromUrl('images/logo_innerpage.png');

    //Image Alignment
    doc.addImage(imgData, 'JPEG', 650, 20, 150, 45, 'logo'); // Cache the image using the alias 'logo'
    //Summary Data
    var head_data   = this.getSummaryHeaderData();
    //Table Data 
    var export_data = factory.exportReturnNestedData();
    //For autoTable cursor initiation
    doc.autoTable([],[] , {});
    // cursor position 0
    doc.resetPosY();
    //Summary Tables
    if(head_data != null)
    {
      angular.forEach(head_data, function(item, key) {
         doc.autoTable(item.th, item.td, {
            "styles"  :   {
              "overflow"  :   "linebreak",
              halign: 'center'
            },
            theme: 'grid_plain',
            
            startY: (doc.autoTableEndPosY() >= 0 && doc.autoTableEndPosY() < 90) ? doc.autoTableEndPosY() + 90 : doc.autoTableEndPosY() + 10
        });
        /**/
      });
      returnTypeTableData();
    }
    //Style/SKU Group Table
    function returnTypeTableData(){
      if(export_data.length > 0)
      {
        
        var totalPagesExp = "{total_pages_count_string}";
        var counter = 0;
        var footer = function (data) {
          // debugger;
          var str   = "Page " + data.pageCount;
          // Total page number plugin only available in jspdf v1.0+
          if (typeof doc.putTotalPages === 'function') {
            str   = str + " of " + totalPagesExp;
          }
          doc.text(str, data.settings.margin.left + 670, doc.internal.pageSize.height - 20);
        };

        angular.forEach(export_data, function(item, key_x){
          if(item.columns.length != 0 && item.rows.length != 0){
            doc.autoTable(item.columns, item.rows, {
              theme: item.columns[1]==  "SKU" ?'grid_sku':item.columns[0]==  "ASN"?'grid_asn' :item.columns[0]==  "Style"?'grid_skutable':'grid_package',
              "styles"  :   {
                  overflow  :   "linebreak",
                  columnWidth: 'auto',
                  halign: 'center'
              },
              startY: doc.autoTableEndPosY() + 10,
              afterPageContent  :   footer
           });
          };
        });

          if (typeof doc.putTotalPages === 'function') {
            doc.putTotalPages(totalPagesExp);
          }
          
          if((navigator.userAgent.indexOf("MSIE") != -1 ) || (!!document.documentMode == true )){
            doc.save(obj.heading+'.pdf');
          }else{
            // doc.output('dataurlnewwindow');
            window.open(doc.output('bloburl'), obj.heading);
          }
      }
    }
  };

  factory.exportNestedPdf = function(obj) {
    factory.export_data = [];
    factory.counter     = 0;
    //Doc Setup
    var doc = null;
    //Js Pdf Creation
    doc    = new jsPDF('l', 'pt');
    //Heading
    doc.text(obj.heading, 350, 45);
    //Img URL
    var imgData   = this.getImageFromUrl('images/logo_innerpage.png');
    //Img Alignment
    doc.addImage(imgData, 'JPEG', 650, 20, 150, 45, 'logo'); 
    //For autoTable cursor initiation
    doc.autoTable([],[] , {});
    // cursor position 0
    doc.resetPosY();
    //Summary Data
    if(obj.type === 'summary' || obj.type === 'tranDetail')
    {
      var data_obj  = this.getSummaryTables();
    }
    else
    {
      var data_obj  = this.getNestedTableData(obj);
    }
    
    var head_data = this.getSummaryHeaderData();

    if(head_data != null && obj.type !== 'in_transit'){
      angular.forEach(head_data, function(item, key) {
         doc.autoTable(item.th, item.td, {
              styles  :   {
              overflow  :   "linebreak",
              halign    :   'center',
              columnWidth: '60'
            },
            columnStyles: {
                1: {columnWidth: '10'}
              },
            theme: 'grid_plain',
            
            startY: (doc.autoTableEndPosY() >= 0 && doc.autoTableEndPosY() < 90) ? doc.autoTableEndPosY() + 90 : doc.autoTableEndPosY() + 10
        });
      });
      nestedPdf();
    }else{
        if(this.getPdfHeaderData() != null){
          doc.autoTable(this.getPdfHeaderColumns().slice(0, 3), this.getPdfHeaderData(), {
            startY: 90,
             margin: {right: 305},
            theme: 'plain',
            drawHeaderRow: function() {
                  // Don't draw header row
                  return false;
              },
              columnStyles: {
                  label: {fontStyle: 'bold'/*, halign : 'right'*/}
              },
            styles: {overflow: 'linebreak', columnWidth: '50'}
          }); 
          nestedPdf();
        }else{
          doc.autoTable([], [], {
            startY: 90,
            theme: 'plain',
            drawHeaderRow: function() {
                  // Don't draw header row
                  return false;
              },
              columnStyles: {
                  label: {fontStyle: 'bold'/*, halign : 'right'*/}
              },
            styles: {overflow: 'linebreak'}
          }); 
          nestedPdf();
        }
    }


    function nestedPdf (){
      if(data_obj){
        
        var totalPagesExp = "{total_pages_count_string}";
        var counter = 0;
        var footer = function (data) {
          var str   = "Page " + doc.internal.getNumberOfPages();
          // Total page number plugin only available in jspdf v1.0+
          if (typeof doc.putTotalPages === 'function') {
            str   = str + " of " + totalPagesExp;
          }
          doc.text(str, data.settings.margin.left + 670, doc.internal.pageSize.height - 20);  
        };

       //For neglect the empty row in Print//
        var print_table =   [];
        angular.forEach(data_obj, function(dataitem, key_x){
          var rowcol    =   {};
           rowcol.td    =   [];
           rowcol.th    =   [];
           rowcol.th    =   dataitem.th;

          angular.forEach(dataitem.td, function(value,index){
            if(value.length != 0){
              rowcol.td.push(value);
            }
          });

        if(rowcol.td.length != 0 && rowcol.th.length)
          print_table.push(rowcol);

        });

        angular.forEach(print_table,function(item,key_x){
          if(item.td.length != 0 && item.th.length != 0){
            doc.autoTable(item.th, item.td, {
                theme: item.th[1]==  "SKU" ?'grid_sku':item.th[0]==  "ASN"?'grid_asn' :item.th[0]==  "Style"?'grid_skutable':'grid_package',
                styles  :   {
                  overflow  :   "linebreak",
                  columnWidth: 'auto',
                  halign: 'center'
                },
                
                startY: doc.autoTableEndPosY() + 10,
                afterPageContent  :   footer
            });
          }
        });
        
        if (typeof doc.putTotalPages === 'function') {
          doc.putTotalPages(totalPagesExp);
        }
        if((navigator.userAgent.indexOf("MSIE") != -1 ) || (!!document.documentMode == true )){
          doc.save(obj.heading+'.pdf');
        }else{
          // doc.output('dataurlnewwindow');
          window.open(doc.output('bloburl'), obj.heading);
        }
      }
    }
    
  };

  factory.exportPdf  = function(obj) {
    var doc = null;
    var head_body_data  = [];
    var add_header  = false;
    //Js Pdf creation
    doc    = new jsPDF('l', 'pt');
    //Heading Data
    doc.text(obj.heading, 350, 45);
    //Img Url
    var imgData   = this.getImageFromUrl('images/logo_innerpage.png');
    //Img add to Pdf
    doc.addImage(imgData, 'JPEG', 650, 20, 150, 45, 'logo');
    //For autoTable cursor initiation
    doc.autoTable([],[] , {});
    // cursor position 0
    doc.resetPosY();

      if(this.getPdfHeaderData() != null)
      {
        add_header  = true;
        head_body_data  = this.getPdfHeaderData();
      }

      if(obj.type === 'count_discrepency')
      {
          add_header  = true;
          
          $.each($('.export_head_data'), function(i, span_data){
            span_data = $(span_data);


            var obj =   {};
            obj.label   =   span_data.find('.export_head_label').text() || '';
            obj.value   =   span_data.find('.export_head_value').text() || '';

            head_body_data.push(obj);
          });
      }

      if(obj.type === 'ZoneDetails')
      {
          add_header  = true;
          
          $.each($('.export_DATA'), function(i, span_data){
            span_data = $(span_data);
            var obj =   {};
            obj.label   =   span_data.find('.export_head_label').text() || '';
            obj.value   =   span_data.find('.export_head_value').text() || '';

            head_body_data.push(obj);
          });
      }
      //For Balance Report Coloumn width change
      if(add_header && head_body_data.length > 0 && obj.type == 'BalanceReport')
      {
        doc.autoTable(this.getPdfHeaderColumns().slice(0, 3), head_body_data, {
            startY: 90,
            margin: {right: 305},
            theme: 'grid',
            
                  
            drawHeaderRow: function() {
                  // Don't draw header row
                  return false;
              },
              columnStyles: {
                  label: {fontStyle: 'bold'}
              },
              "styles": {overflow: 'linebreak',
                        columnWidth: 200,
                        halign: 'left'}
          }); 
        PrintListview();
      }else if(add_header && head_body_data.length > 0){
        doc.autoTable(this.getPdfHeaderColumns().slice(0, 3), head_body_data, {
            startY: 90,
            margin: {right: 305},
            theme: 'grid',
            
                  
            drawHeaderRow: function() {
                  // Don't draw header row
                  return false;
              },
              columnStyles: {
                  label: {fontStyle: 'bold'}
              },
              "styles": {overflow: 'linebreak',
                        halign: 'left'}
          }); 
        PrintListview();
      }else{
         doc.autoTable([],[] , {
          startY: 90
         });
        PrintListview();
      }
    function PrintListview(){
        /***********************Table Added**********************/
        var source  = $('#'+obj.sourceId)[0];

        var tmp = doc.autoTableHtmlToJson(source);

        if(tmp.columns.length > 0 && tmp.data.length > 0)
        {

          var totalPagesExp = "{total_pages_count_string}";
          var footer = function (data) {
            var str   = "Page " + data.pageCount;
            // Total page number plugin only available in jspdf v1.0+
            if (typeof doc.putTotalPages === 'function') {
              str   = str + " of " + totalPagesExp;
            }
            doc.text(str, data.settings.margin.left + 670, doc.internal.pageSize.height - 20);
          };

          // console.log("doc.autoTableEndPosY() ", doc.autoTableEndPosY() );
          var option  = {
            styles  :   {
              overflow  :   "linebreak",
              halign: 'center'
            },
            margin: {top: doc.autoTableEndPosY() + 10},
            afterPageContent  :   footer
          };


          doc.autoTable(tmp.columns, tmp.data, option);


          if (typeof doc.putTotalPages === 'function') {
            doc.putTotalPages(totalPagesExp);
          }

          if((navigator.userAgent.indexOf("MSIE") != -1 ) || (!!document.documentMode == true )){
            doc.save(obj.heading+'.pdf');
          }else{
            window.open(doc.output('bloburl'), obj.heading);
          }
        }

      return false;
    }
  };

  //For Zonetag Export
  factory.exportZoneTag = function(obj){
    var head_body_data  = [];
    var add_header  = false;
    //Js Pdf creation
    var doc    = new jsPDF('p', 'pt');
    //Heading Data
    doc.text(obj.heading, 350, 45);
    //Img Url
    var imgData   = this.getImageFromUrl('images/logo_innerpage.png');
    //Img add to Pdf
    doc.addImage(imgData, 'JPEG', 380, 20, 200, 60, 'logo');
    //For autoTable cursor initiation
    doc.autoTable([],[] , {});
    // cursor position 0
    doc.resetPosY();

    var pdfData =  this.getPdfHeaderData();

    //Js pdf Content 
    if(pdfData && pdfData.content && pdfData.content.length){
      doc.autoTable(this.getPdfHeaderColumns(),pdfData.content, {
        startY: 90,
        margin: {right: 305},
        theme: 'plain',
        drawHeaderRow: function() {
              // Don't draw header row
              return false;
          },
          columnStyles: {
              label: {fontStyle: 'bold'/*, halign : 'right'*/}
          },
        styles: {overflow: 'linebreak', columnWidth: '80', fontSize: 13,}
      });
    }

    //barCode Generation & insert to JS pdf
    if(pdfData && pdfData.barcodeData){
      $("#barcode").JsBarcode(pdfData.barcodeData);
      var barcodeData = $("#barcode").attr("src");
      var height = $("#barcode").height() || 60;
      var width = $("#barcode").outerWidth() || 150;
      if(barcodeData){
        doc.addImage(barcodeData, 'JPEG', 150, doc.autoTableEndPosY()+50, width, height, 'barcode');
      }
    }
    //new window for print
    window.open(doc.output('bloburl'), obj.heading);
  };

  return factory;
}]);

angular.module('ovcdataExport').directive('ovcdataExport', ['$compile', 'ovcdataExportFactory', function ($compile, ovcdataExportFactory) {

	return {
        restrict: 'EA',
        scope : false,
        replace:true,
        link: function (scope, elem, attrs) {
          if(attrs.hideExcel){
            scope.excelshow   = true;
          }
          if(attrs.labelData){
            scope.zoneTagLabel = attrs.labelData;
          }
          if(attrs.zoneTag){
            scope.zoneTag = true;
          }
             
            var obj = {};
            obj.sourceId = attrs.pdfId;
            obj.heading  = attrs.heading;
            obj.type     = attrs.type || '';
            obj.exportContentType     = attrs.exportContentType || '';



          scope.exportData  = function() {
            if(obj.type === 'summary' || obj.type === 'shipment' || obj.type === 'in_transit' || obj.type === 'tranDetail'){
              ovcdataExportFactory.exportNestedPdf(obj);
            }
            else if(obj.type === 'return'){
              ovcdataExportFactory.exportReturnNestedPdf(obj);
            }
            else if(obj.type === 'ZoneTag'){
              ovcdataExportFactory.exportZoneTag(obj);
            }
            else{
              ovcdataExportFactory.exportPdf(obj);
            }
          };

          scope.exportExcelData = function() {
            if(obj.type === 'summary' || obj.type === 'shipment' || obj.type === 'in_transit'){
              ovcdataExportFactory.exportNestedExcel(obj);
            }
            else if(obj.type === 'return'){
              ovcdataExportFactory.exportReturnNestedExcel(obj);
            }
            else if(obj.type === 'tranDetail'){
              ovcdataExportFactory.exportExcelData(obj);
            }
            else{
              ovcdataExportFactory.exportExcelData(obj);
            }
          };
        },
        templateUrl : '/modules/directives/ovcdata_export/ovcdata_export.html'
  };
}]);