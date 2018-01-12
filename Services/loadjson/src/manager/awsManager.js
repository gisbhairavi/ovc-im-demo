// 'use strict';
// Created By : Ratheesh.
// Date : 12.6.2017.
var AWS = require('aws-sdk'),
    s3,
    sqs;
var constant = require('../../config/const.json');
var env_config = require('../../config/config');
var downloadManager = require("../manager/downloadManager")
var defer = require('q');
var Bucket = env_config['AWS']['AWS_BUCKET'];
try {
    AWS.config.getCredentials(function(err) {
        if (err) {
            console.log('credentials', err);
        }
        console.log('Found credentials.');
        // Create S3 service object
        s3 = new AWS.S3({
            apiVersion: '2012-10-17',
        });
        // Create the parameters for calling createBucket
        var bucketParams = {
            Bucket
        };
        s3.headBucket(bucketParams, function(err, data) {
            if (err) {
                // Call S3 to create the bucket
                s3.createBucket(bucketParams, function(err, data) {
                    if (err) {
                        console.log("Error", err);
                        console.log(bucketParams);
                    } else {
                        console.log("Success", data.Location);
                    }
                }, function(err) {
                    console.log('credentials', err);
                });
            }
        });
        s3.listBuckets(function(err, data) {
            console.log(data);
        });
    });
} catch (e) {
    return console.log('AWS Data Not Found.');
}
var region = env_config['AWS']['AWS_REGION'];
// Instantiate SQS client
sqs = new AWS.SQS({});
var receiveMessageResponse = function(data) {
    if (data) {
        // If there are any messages to get
        if (data.Messages) {
            console.log(data.Messages);
            var DataArr = [];
            // Get the first message (should be the only one since we said to only get one above)
            DataArr = data.Messages.map(function(v) {
                return v.Body;
            });
            return DataArr;
        } else {
            return constant['label']['EmptyJSONReceived'];
        }
    } else {
        return data;
    }
};
var getQueueUrl = function(sqstype, type) {
    try {
        var data = {};
        if (env_config['AWS']['SQS'][sqstype]) {
            if (type == 'send') {
                data = {
                    // QueueUrl: env_config['AWS']['SQS']['QUEUE_' + sqstype.toUpperCase()],
                    QueueUrl: env_config['AWS']['SQS'][sqstype],
                    // MaxNumberOfMessages: env_config['AWS']['AWS_MAXNUMBEROFMESSAGES'],
                    // WaitTimeSeconds: env_config['AWS']['AWS_WAITTIMESECONDS']
                };
            } else {
                data = {
                    // QueueUrl: env_config['AWS']['SQS']['QUEUE_' + sqstype.toUpperCase()],
                    QueueUrl: env_config['AWS']['SQS'][sqstype],
                    MaxNumberOfMessages: env_config['AWS']['AWS_MAXNUMBEROFMESSAGES'],
                    WaitTimeSeconds: env_config['AWS']['AWS_WAITTIMESECONDS']
                };
            }
        } else {
            console.log('AWS QUEUE Not Found.');
            return '';
        }
        return data;
    } catch (e) {
        console.log(e);
        console.log('AWS QUEUE Not Found.');
        return '';
    }
};
// sqs.deleteMessage({
//     QueueUrl: sqsQueueUrl,
//     ReceiptHandle: message.ReceiptHandle
// }, function(err, data) {
//     // If we errored, tell us that we did
//     err && console.log(err);
// });
var awsBucket = {
    checkBucket: function(Bucket) {
        var checkBucketdefer = defer.defer();
        var params = {
            Bucket: Bucket
        };
        s3.headBucket(params, function(err, data) {
            console.log(err, data);
            if (err) checkBucketdefer.resolve(err, err.stack); // an error occurred
            else checkBucketdefer.resolve(true); // successful response
        });
        return checkBucketdefer.promise;
    },
    getObject: function(Key) {
        var getBucketdefer = defer.defer();
        var params = {
            Bucket: Bucket,
            Key: Key
        };
        s3.getObject(params, function(err, data) {
            if (err) console.log(err, data); // an error occurred
            getBucketdefer.resolve(data);
        });
        return getBucketdefer.promise;
    },
    deleteObject: function(Key) {
        var deleteBucketdefer = defer.defer();
        var params = {
            Bucket: Bucket,
            Key: Key
        };
        s3.deleteObject(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            deleteBucketdefer.resolve(data);
        });
        return deleteBucketdefer.promise;
    },
    upload: function(uploadData) {
        var uploadBucketdefer = defer.defer();
        // call S3 to retrieve upload file to specified bucket
        var uploadParams = {
            Bucket: Bucket,
            Key: uploadData.Key,
            Body: uploadData.Body
        };
        // call S3 to retrieve upload file to specified bucket
        s3.upload(uploadParams, function(err, data) {
            if (err) {
                console.log("Error", err);
            }
            if (data) {
                console.log("Upload Success", data);
            }
            uploadBucketdefer.resolve(data);
        });
        return uploadBucketdefer.promise;
    },
    createBucket: function(Bucket) {
        var createBucketdefer = defer.defer();
        var bucketParams = {
            Bucket: Bucket
        };
        // Call S3 to create the bucket
        s3.createBucket(bucketParams, function(err, data) {
            if (err) {
                console.log("Error", err);
            } else {
                console.log("Success", data.Location);
            }
            createBucketdefer.resolve(data);
        });
        return createBucketdefer.promise;
    },
    deleteBucket: function(Bucket) {
        var deleteBucketdefer = defer.defer();
        var bucketParams = {
            Bucket: Bucket
        };
        // Call S3 to create the bucket
        s3.createBucket(bucketParams, function(err, data) {
            if (err) {
                console.log("Error", err);
            } else {
                console.log("Success", data.Location);
            }
            deleteBucketdefer.resolve(err, data);
        });
        return deleteBucketdefer.promise;
    }
};
module.exports = {
    sendMessage: function(data, success) {
        console.log('data', data);
        var awsurl = getQueueUrl(data.type, 'send');
        var testJSON = function(data) {
            try {
                console.log(data);
                var data = JSON.parse(data.toString());
            } catch (e) {
                console.log(e);
                return false;
            }
            return true;
        };
        if (!data.data) {
            return success(constant['label']['EmptyJSONReceived']);
        } else if (!testJSON(data.data)) {
            return success(constant['label']['NotJSON']);
        } else if (awsurl) {
            awsurl.MessageBody = data.data;
            awsurl.DelaySeconds = env_config['AWS']['AWS_DELAYSECONDS'];
            console.log(awsurl);
            sqs.sendMessage(awsurl, function(err, data) {
                if (err) {
                    success(err);
                } else {
                    success(null, constant['label']['SUCCESS']);
                }
            });
        } else {
            success("Empty Queue");
        }
    },
    receiveMessage: function(data, success) {
        console.log('data', data);
        var awsurl = getQueueUrl(data.type);
        if (awsurl) {
            sqs.receiveMessage(awsurl, function(err, data) {
                console.log(err);
                if (err) {
                    success(err);
                } else {
                    success(err, receiveMessageResponse(data));
                }
            });
        } else {
            success("Empty Queue");
        }
    },
    uploadBalanceReport: function(data, success) {
        var uploadData = function() {
            var BalanceReport = "BalanceReports/";
            data.Key = BalanceReport + data.Key;
            awsBucket.upload(data).then(function(uploaded) {
                if (uploaded) {
                    var upload = data;
                    upload.userId = data.user.clientId;
                    upload.src = uploaded.Location;
                    upload.downloadType = "BalanceReports";
                    console.log(upload);
                    downloadManager.create(upload, function(err, data) {
                        success(err, data);
                    });
                } else {
                    success('Can not upload.');
                }
            });
        };
        awsBucket.checkBucket(Bucket).then(function(result) {
            if (result == true) {
                uploadData();
            } else {
                awsBucket.createBucket(data.Bucket).then(function(result) {
                    uploadData();
                });
            }
        });
    },
    getDownload: function(Key, callback) {
        awsBucket.getObject(Key).then(function(uploaded) {
            console.log(uploaded);
            if (uploaded) {
                callback('', uploaded.Body.toString());
            } else {
                callback('Can not load StatusReport.');
            }
        });
    },
    deleteDownload: function(Key, callback) {
        awsBucket.deleteObject(Key).then(function(response) {
            console.log(response);
            if (response) {
                callback('', response.DeleteMarker);
            } else {
                callback('Can not delete StatusReport.');
            }
        });
    },
};