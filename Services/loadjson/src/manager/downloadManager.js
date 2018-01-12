var constant = require('../../config/const.json');
var downloadModel = require('./../model/downloadModel');
module.exports = {
    getDownloads: getDownloads,
    create: create,
    updateDownloads: updateDownloads,
    deleteDownloads: deleteDownloads
};

function getDownloads(data, callback) {
    var page_offset = 0;
    var page_lmt = 0;
    if (data['page_offset'] && data['page_lmt']) {
        page_offset = parseInt(data['page_offset']) || 0;
        page_lmt = parseInt(data['page_lmt']) || 10;
    }
    if (data['download_id']) {
        downloadModel.findById(data['download_id']).exec(function(err, data) {
            if (err) {
                callback(err);
            } else {
                try {
                    callback('', {
                        result: {
                            data: data
                        }
                    });
                } catch (e) {
                    callback('Can not load data.');
                    console.log(e);
                }
            }
        });
    } else {
        downloadModel.count({
            userId: data.user.clientId,
        }).exec(function(err, total_count) {
            downloadModel.count({
                userId: data.user.clientId,
                status: 'NEW',
            }).exec(function(err, count) {
                downloadModel.find({
                    userId: data.user.clientId,
                }).sort({
                    created: -1,
                }).skip(page_offset).limit(page_lmt).exec(function(err, data) {
                    if (err) {
                        callback(err);
                    } else {
                        try {
                            callback('', {
                                result: {
                                    data: data,
                                    total_count: total_count,
                                    count: count
                                }
                            });
                        } catch (e) {
                            callback('Can not load data.');
                            console.log(e);
                        }
                    }
                });
            });
        });
    }
}

function create(data, callback) {
    try {
        data['createdBy'] = data.user.clientId;
        data['updatedBy'] = data.user.clientId;
        var download = new downloadModel(data);
        download.save(callback);
    } catch (e) {
        console.log(e);
        callback('Can not load data.');
    }
}

function updateDownloads(data, callback) {
    try {
        data['updatedBy'] = data.user.clientId;
        var download = downloadModel.findById(data.download_id);
        if (download) {
            download.update(data, function(err, data) {
                if (err) {
                    console.log('No Download Data.');
                    console.log(err);
                    callback('No Download Data.');
                } else {
                    data ? callback('', constant.label.SUCCESS) : callback('No Download Data.');
                }
            });
        } else {
            callback('No Download Data.');
        }
    } catch (e) {
        console.log(e);
        callback('Can load Data.');
    }
}

function deleteDownloads(data, callback) {
    try {
        downloadModel.findById(data.download_id, function(err, download) {
            if (download) {
                var awsManager = require('../manager/awsManager');
                var pathKey = `${(download.downloadType)}/${download.userId}/${download.fileName}`;
                awsManager.deleteDownload(pathKey, function(err, deleted) {
                if (err) {
                    console.log('Error');
                    console.log(err);
                    callback(err);
                } else {
                    console.log(data, deleted);
                    download.remove();
                    callback('', constant.label.SUCCESS);
                }
                });
            } else {
                callback('No Download Data.');
            }
        });
    } catch (e) {
        console.log(e);
        callback('Can not load Data.');
    }
};