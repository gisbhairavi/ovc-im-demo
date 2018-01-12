var version = '4.0.0';

app.controller('MyCtrl', [ '$scope', '$state','$rootScope', '$routeParams', '$stateParams', '$http', '$timeout', '$compile', 'Upload', 'Data', function($scope, $state, $rootScope, $routeParams, $stateParams, $http, $timeout, $compile, Upload, Data) {
	$scope.usingFlash = FileAPI && FileAPI.upload != null;
	$scope.fileReaderSupported = window.FileReader != null && (window.FileAPI == null || FileAPI.html5 != false);

	$scope.changeAngularVersion = function() {
		window.location.hash = $scope.angularVersion;
		window.location.reload(true);
	};
	
	$scope.angularVersion = window.location.hash.length > 1 ? (window.location.hash.indexOf('/') === 1 ? 
			window.location.hash.substring(2): window.location.hash.substring(1)) : '1.2.20';

	$scope.$watch('files', function(files) {
		$scope.formUpload = false;
		if (files != null) {
			for (var i = 0; i < files.length; i++) {
				$scope.errorMsg = null;
				(function(file) {
					generateThumbAndUpload(file);
				})(files[i]);
			}
		}
	});
	
	$scope.uploadPic = function(files,extraval) {
		// alert(extraval);
		// return false;
		// console.log("zero");
		// console.log(files);
		$scope.formUpload = true;
		if (files != null) {
			generateThumbAndUpload1(files[0],extraval)
		}
	};
	
	$scope.uploadPic1 = function(files) {
		// console.log("one");
		// console.log(files);
		$scope.formUpload = true;
		if (files != null) {
			generateThumbAndUpload2(files[0])
		}
	};
	
	function generateThumbAndUpload1(file,extraval) {
		$scope.errorMsg = null;
		$scope.generateThumb(file);
		if ($scope.howToSend === 1) {
			uploadUsingUpload(file,extraval);
		} else if ($scope.howToSend == 2) {
			uploadUsing$http(file);
		} else {
			uploadS3(file);
		}
	}
	
	function generateThumbAndUpload2(file) {
		$scope.errorMsg = null;
		$scope.generateThumb1(file);
		if ($scope.howToSend === 1) {
			uploadUsingUpload1(file);
		} else if ($scope.howToSend == 2) {
			uploadUsing$http(file);
		} else {
			uploadS3(file);
		}
	}
	
	$scope.generateThumb = function(file) {
		if (file != null) {
			if ($scope.fileReaderSupported && file.type.indexOf('image') > -1) {
				$timeout(function() {
					var fileReader = new FileReader();
					fileReader.readAsDataURL(file);
					fileReader.onload = function(e) {
						$timeout(function() {
							file.dataUrl = e.target.result;
						});
					}
				});
			}
		}
	};
	$scope.generateThumb1 = function(file) {
		if (file != null) {
			if ($scope.fileReaderSupported && file.type.indexOf('image') > -1) {
				$timeout(function() {
					var fileReader = new FileReader();
					fileReader.readAsDataURL(file);
					fileReader.onload = function(e) {
						$timeout(function() {
							file.dataUrl = e.target.result;
						});
					}
				});
			}
		}
	};
	
	function uploadUsingUpload(file,extraval) {
		// console.log(extraval);return false;
		file.upload = Upload.upload({
			// url: 'https://angular-file-upload-cors-srv.appspot.com/upload' + $scope.getReqParams(),
			url: 'api/fileupload/upload.php' + $scope.getReqParams(),
			method: 'POST',
			/* headers: {
				'my-header' : 'my-header-value'
			}, */
			data: {uptype: extraval},
			file: file,
			fileFormDataName: 'file'
		}).success(function(data, status, headers, config) {
			// file is uploaded successfully
			// console.log(data);
			
		  });

		file.upload.then(function(response) {
			// console.log(file);
			// console.log($scope);
			// console.log(response.data);
			if(response.status == 200){
				$scope.status = 0;
				// $("#exbh_image").val(response.data);
				$scope.E_adds = {image:response.data};
				// this.E_adds.image = response.data;
				
				// console.log($scope.E_adds);
			}
			$timeout(function() {
				file.result = response.data;
			});
		}, function(response) {
			if (response.status > 0)
				$scope.errorMsg = response.status + ': ' + response.data;
		});

		file.upload.progress(function(evt) {
			// Math.min is to fix IE which reports 200% sometimes
			file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
		});

		file.upload.xhr(function(xhr) {
			//alert('sdsf');
			// xhr.upload.addEventListener('abort', function(){console.log('abort complete')}, false);
		});
	}
	function uploadUsingUpload1(file) {
		file.upload = Upload.upload({
			// url: 'https://angular-file-upload-cors-srv.appspot.com/upload' + $scope.getReqParams(),
			url: 'api/fileupload/upload.php' + $scope.getReqParams(),
			method: 'POST',
			/* headers: {
				'my-header' : 'my-header-value'
			}, */
			data: {uptype: 'map_image'},
			file: file,
			fileFormDataName: 'file'
		}).success(function(data, status, headers, config) {
			// file is uploaded successfully
			// console.log(data);
			
		  });

		file.upload.then(function(response) {
			// console.log(file);
			// console.log($scope);
			// console.log(response.data);
			if(response.status == 200){
				$scope.status = 0;
				$scope.E_addss = {imagess:response.data};
				// console.log($scope.E_addss);
			}
			$timeout(function() {
				file.result = response.data;
			});
		}, function(response) {
			if (response.status > 0)
				$scope.errorMsg = response.status + ': ' + response.data;
		});

		file.upload.progress(function(evt) {
			// Math.min is to fix IE which reports 200% sometimes
			file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
		});

		file.upload.xhr(function(xhr) {
			//alert('sdsf');
			// xhr.upload.addEventListener('abort', function(){console.log('abort complete')}, false);
		});
	}
	
	function uploadUsing$http(file) {
		file.upload = Upload.http({
			// url: 'https://angular-file-upload-cors-srv.appspot.com/upload' + $scope.getReqParams(),
			url: 'api/fileupload' + $scope.getReqParams(),
			method: 'POST',
			headers : {
				'Content-Type': file.type
			},
			data: file
		});
	
		file.upload.then(function(response) {
			file.result = response.data;
		}, function(response) {
			if (response.status > 0)
				$scope.errorMsg = response.status + ': ' + response.data;
		});
	
		file.upload.progress(function(evt) {
			file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
		});
	}
	
	function uploadS3(file) {
		file.upload = Upload.upload({
			url : $scope.s3url,
			method : 'POST',
			fields : {
				key : file.name,
				AWSAccessKeyId : $scope.AWSAccessKeyId,
				acl : $scope.acl,
				policy : $scope.policy,
				signature : $scope.signature,
				'Content-Type' : file.type === null || file.type === '' ? 'application/octet-stream' : file.type,
				filename : file.name
			},
			file : file
		});

		file.upload.then(function(response) {
			$timeout(function() {
				file.result = response.data;
			});
		}, function(response) {
			if (response.status > 0)
				$scope.errorMsg = response.status + ': ' + response.data;
		});
		
		file.upload.progress(function(evt) {
			file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
		});
		storeS3UploadConfigInLocalStore();
	}
	
	$scope.generateSignature = function() {
		$http.post('/s3sign?aws-secret-key=' + encodeURIComponent($scope.AWSSecretKey), $scope.jsonPolicy).
			success(function(data) {
				$scope.policy = data.policy;
				$scope.signature = data.signature;
			});
	};
	
	if (localStorage) {
		$scope.s3url = localStorage.getItem('s3url');
		$scope.AWSAccessKeyId = localStorage.getItem('AWSAccessKeyId');
		$scope.acl = localStorage.getItem('acl');
		$scope.success_action_redirect = localStorage.getItem('success_action_redirect');
		$scope.policy = localStorage.getItem('policy');
		$scope.signature = localStorage.getItem('signature');
	}
	
	$scope.success_action_redirect = $scope.success_action_redirect || window.location.protocol + '//' + window.location.host;
	$scope.jsonPolicy = $scope.jsonPolicy || '{\n  "expiration": "2020-01-01T00:00:00Z",\n  "conditions": [\n    {"bucket": "angular-file-upload"},\n    ["starts-with", "$key", ""],\n    {"acl": "private"},\n    ["starts-with", "$Content-Type", ""],\n    ["starts-with", "$filename", ""],\n    ["content-length-range", 0, 524288000]\n  ]\n}';
	$scope.acl = $scope.acl || 'private';
	
	function storeS3UploadConfigInLocalStore() {
		if ($scope.howToSend === 3 && localStorage) {
			localStorage.setItem('s3url', $scope.s3url);
			localStorage.setItem('AWSAccessKeyId', $scope.AWSAccessKeyId);
			localStorage.setItem('acl', $scope.acl);
			localStorage.setItem('success_action_redirect', $scope.success_action_redirect);
			localStorage.setItem('policy', $scope.policy);
			localStorage.setItem('signature', $scope.signature);
		}
	}
	
	/* (function handleDynamicEditingOfScriptsAndHtml($scope) {
		$scope.defaultHtml = document.getElementById('editArea').innerHTML.replace(/\t\t\t\t/g, '');
		
		$scope.editHtml = (localStorage && localStorage.getItem('editHtml' + version)) || $scope.defaultHtml;
		function htmlEdit() {
			document.getElementById('editArea').innerHTML = $scope.editHtml;
			$compile(document.getElementById('editArea'))($scope);
			$scope.editHtml && localStorage && localStorage.setItem('editHtml' + version, $scope.editHtml);
			if ($scope.editHtml != $scope.htmlEditor.getValue()) $scope.htmlEditor.setValue($scope.editHtml);
		}
		$scope.$watch('editHtml', htmlEdit);
		
		$scope.htmlEditor = CodeMirror(document.getElementById('htmlEdit'), {
			lineNumbers: true, indentUnit: 4,
			mode:  'htmlmixed'
		});
		$scope.htmlEditor.on('change', function() {
			if ($scope.editHtml != $scope.htmlEditor.getValue()) {
				$scope.editHtml = $scope.htmlEditor.getValue();
				htmlEdit();
			}
		});
	})($scope, $http); */
	
	$scope.confirm = function() {
		return confirm('Are you sure? Your local changes will be lost.');
	};
	
	$scope.getReqParams = function() {
		return $scope.generateErrorOnServer ? '?errorCode=' + $scope.serverErrorCode +
				'&errorMessage=' + $scope.serverErrorMsg : '';
	};

	angular.element(window).bind('dragover', function(e) {
		e.preventDefault();
	});
	angular.element(window).bind('drop', function(e) {
		e.preventDefault();
	});

	$timeout(function(){
		$scope.capture = localStorage.getItem('capture'+ version) || 'camera';
		$scope.accept = localStorage.getItem('accept'+ version) || 'image/*';
		$scope.acceptSelect = localStorage.getItem('acceptSelect'+ version) || 'image/*';
		$scope.disabled = localStorage.getItem('disabled'+ version) == 'true' || false;
		$scope.multiple = localStorage.getItem('multiple'+ version) == 'true' || false;
		$scope.allowDir = localStorage.getItem('allowDir'+ version) == 'true' || true;
		$scope.$watch('capture+accept+acceptSelect+disabled+capture+multiple+allowDir', function() {
			localStorage.setItem('capture'+ version, $scope.capture);
			localStorage.setItem('accept'+ version, $scope.accept);
			localStorage.setItem('acceptSelect'+ version, $scope.acceptSelect);
			localStorage.setItem('disabled'+ version, $scope.disabled);
			localStorage.setItem('multiple'+ version, $scope.multiple);
			localStorage.setItem('allowDir'+ version, $scope.allowDir);
		});
	});
	
	// console.log($routeParams);
	// console.log($stateParams);
	var catid = $stateParams.catid; //getting fooVal
	var cntrl_type = $stateParams.type; //getting fooVal
	
	$scope.Exbit_add = {};
	
	$scope.Exbit_add = {exhibitor_name:'',stall_no:'',hall_no:'',description:'',address:'',category_id:''};
    $scope.Exbit_add = function (customer,image,images) {
		// console.log($scope.E_adds);
		// console.log(images);
		// console.log(image);return false;
        Data.post('Exbit_add', {
            customer: customer,e_image: image,map_image: images, 'tablename' : 'TBLE_EXHIBITOR', 'alais' : 'exhibitor'
        }).then(function (results) {
			// console.log(results);return false;
            Data.toast(results);
            if (results.status == "success") {
                $state.go('dashboard.exhibitors');
            }
        });
    };
	
	$scope.FloorAdd = {};
	
	$scope.FloorAdd = {image:''};
    $scope.FloorAdd = function (image) {
		// console.log(image);return false;
       
		$http.post('api/ajax/functions.php?action=FloorAdd', 
			{
				e_image: image,'tablename' : 'FLOORPLAN'
			}
		  )
		.success(function (data, status, headers, config) {                 
			Data.toast(data);
		  if(data.status == 'success'){
			$state.go('dashboard.floor');
		  } 
		})
		.error(function(data, status, headers, config){
		   
		});
    };
	
	$scope.title = 'Add';
	
	$scope.prod_categ = function() {
		// $scope.E_add = {category_id: 'Select Category'};
		$http.get('api/ajax/functions.php?action=getDetails').success(function(data){
			// console.log(data);return false;
			$scope.list = data;
			
		});
	}
	
	$scope.prod_exhibit_edit = function(index) {
      $scope.update_prod = true;
      $scope.add_prod = false;
	  $scope.title = 'Edit';
      $http.post('api/ajax/functions.php?action=edit_product', 
            {
                'prod_index'     : index, 'tablename' : 'TBLE_EXHIBITOR'
            }
        )      
        .success(function (data, status, headers, config) {
			// console.log(data[0]);
			$scope.E_add = {id:data[0]['id'],category_id:''+data[0]['category_id']+'',exhibitor_name:''+data[0]['exhibitor_name']+'', stall_no:data[0]['stall_no'], hall_no:data[0]['hall_no'], description:data[0]['description'], email:data[0]['email'], ph_no:data[0]['ph_no'], website:data[0]['website'], address:data[0]['address']};
			// $scope.E_add = data[0];
			
			$scope.prev_picFile = 'api/fileupload/exhibitor_images/thumb600/'+data[0]['image'];
			$scope.prev_picFiles = 'api/fileupload/map_stall_images/thumb600/'+data[0]['map_image'];
			$scope.E_adds = {image: data[0]['image']};
			$scope.E_addss = {imagess: data[0]['map_image']};
			// console.log($scope.prev_picFile);
        })
        .error(function(data, status, headers, config){
           
        });
    }
	
	$scope.Exbit_edit = function (exhibitor,image,images) {
		// console.log($scope.E_adds);
		// console.log($scope.E_adds.image);
		// console.log(image);
		// console.log(images);
		// return false;
        $http.post('api/ajax/functions.php?action=update_product', 
			{
				exhibitor: exhibitor,e_image: image,map_image: images, 'tablename' : 'TBLE_EXHIBITOR', 'alais' : 'exhibitor'
			}
		  )
		.success(function (data, status, headers, config) {                 
			Data.toast(data);
		  if(data.status == 'success'){
			$state.go('dashboard.exhibitors');
		  } 
		})
		.error(function(data, status, headers, config){
		   
		});
    } 
	
	if(cntrl_type == 'exhibitor'){
		$scope.title = 'Edit';
		$scope.status = 1;
		$scope.prod_categ();
		$scope.prod_exhibit_edit(catid);
	}

} ]);