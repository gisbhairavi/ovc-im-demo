angular.module('calendar', ['OVCstockApp.environmentConfigs']);

angular.module('calendar').directive('calendar', function (DATE_PICKER_FORM, CONSTANTS_VAR) {
	return {
		require: 'ngModel',
		link: function (scope, el, attr, ngModel) {
			var dateForm = localStorage.configDateFormat ? DATE_PICKER_FORM[localStorage.configDateFormat] : CONSTANTS_VAR.DATE_FORM_CALANDER;
			$(el).datepicker({
				format:dateForm,
				autoclose: true,
				onSelect: function (dateText) {
					scope.$apply(function () {
						ngModel.$setViewValue(dateText);
					});
				}
			});
		}
	};
});

angular.module('calendar').directive('calendarDateTime', function (MOMENT_FORMATS) {
    return {
        restrict: "A",
        require: "ngModel",
        link: function (scope, element, attrs, ngModel) {
			var dateForm = localStorage.configDateFormat ? MOMENT_FORMATS[localStorage.configDateFormat] : MOMENT_FORMATS.DEFAULT;

            var parent = $(element);
            var dtp = parent.datetimepicker({
                showTodayButton: true,
                focusOnShow:false,
                format: dateForm +'  ' +MOMENT_FORMATS.TIME
            });

            dtp.on("dp.change", function (e) {
            	if(e.date){
            		var changedDate 			= 	moment(e.date).format(dateForm +' ' + MOMENT_FORMATS.TIME);
            	}else{
            		var changedDate = "";
            	}
                scope.$apply(function(){
                	ngModel.$setViewValue(changedDate);
                });
            });
        }
    };
});

angular.module('calendar').directive('calendar1', function (DATE_PICKER_FORM, CONSTANTS_VAR) {
	return {
		require: 'ngModel',
		link: function (scope, el, attr, ngModel) {
			var dateForm = localStorage.configDateFormat ? DATE_PICKER_FORM[localStorage.configDateFormat] : CONSTANTS_VAR.DATE_FORM_CALANDER;
			$(el).datepicker({
				format:dateForm,
				startDate: attr.minDate,
				autoclose: true,
				onSelect: function (dateText) {
					scope.$apply(function () {
						ngModel.$setViewValue(dateText);
					});
				}
			});
		}
	};
});

angular.module('calendar').directive('needByDate', function (DATE_PICKER_FORM,CONSTANTS_VAR) {
	return {
		require: 'ngModel',
		link: function (scope, el, attr, ngModel) {
			var dateForm = localStorage.configDateFormat ? DATE_PICKER_FORM[localStorage.configDateFormat] : CONSTANTS_VAR.DATE_FORM_CALANDER;

			var nowTemp = new Date();
			nowTemp.setDate(nowTemp.getDate()+1);
			var now = new Date(nowTemp.getFullYear(), nowTemp.getMonth(), nowTemp.getDate(), 0, 0, 0, 0);

			$(el).datepicker({
				format:dateForm,
				autoclose: true,
				startDate: nowTemp,
				onRender: function(dateText){
					return dateText.valueOf() < now.valueOf() ? 'disabled' : '';
				},
				onSelect: function (dateText) {
					scope.$apply(function () {
						ngModel.$setViewValue(dateText);
					});
				}
			});
		}
	};
});