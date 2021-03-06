/*global require, setInterval, clearInterval, exports*/
'use strict';
var rpc = require('../common/rpc');
var config = require('../../local/etc/common');

// Logger
var log = require('../common/logger')('CloudHandler');
var nuveKey = require('./mdb/dataBase').nuveKey;

var ec2;

var INTERVAL_TIME_EC_READY = 100;
var INTERVAL_TIME_CHECK_KA = 1000;
var MAX_KA_COUNT = 10;

var erizoControllers = {};
var rooms = {}; // roomId: erizoControllerId
var ecQueue = [];
var idIndex = 0;

var recalculatePriority = function () {
    //*******************************************************************
    // States: 
    //  0: Not available
    //  1: Warning
    //  2: Available 
    //*******************************************************************

    var newEcQueue = [],
        available = 0,
        warnings = 0,
        ec;

    for (ec in erizoControllers) {
        if (erizoControllers.hasOwnProperty(ec)) {
            if (erizoControllers[ec].state === 2) {
                newEcQueue.push(ec);
                available += 1;
            }
        }
    }

    for (ec in erizoControllers) {
        if (erizoControllers.hasOwnProperty(ec)) {
            if (erizoControllers[ec].state === 1) {
                newEcQueue.push(ec);
                warnings += 1;
            }
        }
    }

    ecQueue = newEcQueue;

    if (ecQueue.length === 0 || (available === 0 && warnings < 2)) {
        log.info('Warning! No erizoController is available.');
    }
};

setInterval(function checkKA () {
    for (var ec in erizoControllers) {
        if (erizoControllers.hasOwnProperty(ec)) {
            erizoControllers[ec].keepAlive += 1;
            if (erizoControllers[ec].keepAlive > MAX_KA_COUNT) {
                log.info('ErizoController', ec, ' in ', erizoControllers[ec].ip, 'does not respond. Deleting it.');
                delete erizoControllers[ec];
                for (var room in rooms) {
                    if (rooms.hasOwnProperty(room)) {
                        if (rooms[room] === ec) {
                            delete rooms[room];
                        }
                    }
                }
                recalculatePriority();
            }
        }
    }
}, INTERVAL_TIME_CHECK_KA);

var getErizoController;

if (config.cloudHandlerPolicy) {
    getErizoController = require('./ch_policies/' + config.cloudHandlerPolicy).getErizoController;
}

var addNewErizoController = function (msg, callback) {
    if (msg.cloudProvider === '') {
        addNewPrivateErizoController(msg.ip, msg.hostname, msg.port, msg.ssl, callback);
    } else if (msg.cloudProvider === 'amazon') {
        addNewAmazonErizoController(msg.ip, msg.hostname, msg.port, msg.ssl, callback);
    }
};

var addNewAmazonErizoController = function (privateIP, hostname, port, ssl, callback) {
    
    var publicIP;

    if (ec2 === undefined) {
        var opt = {version: '2012-12-01'};
        if (config.cloudProvider.host !== '') {
            opt.host = config.cloudProvider.host;
        }
        ec2 = require('aws-lib').createEC2Client(config.cloudProvider.accessKey, config.cloudProvider.secretAccessKey, opt);
    }
    log.info('private ip ', privateIP);

    ec2.call('DescribeInstances', {'Filter.1.Name':'private-ip-address', 'Filter.1.Value':privateIP}, function (err, response) {

        if (err) {
            log.info('Error: ', err);
            callback('error');
        } else if (response) {
            publicIP = response.reservationSet.item.instancesSet.item.ipAddress;
            log.info('public IP: ', publicIP);
            addNewPrivateErizoController(publicIP, hostname, port, ssl, callback);
        }
    });
};

var addNewPrivateErizoController = function (ip, hostname, port, ssl, callback) {
    idIndex += 1;
    var id = idIndex,
        rpcID = 'erizoController_' + id;
    erizoControllers[id] = {
        ip: ip,
        rpcID: rpcID,
        state: 2,
        keepAlive: 0,
        hostname: hostname,
        port: port,
        ssl: ssl
    };
    log.info('New erizocontroller (', id, ') in: ', erizoControllers[id].ip);
    recalculatePriority();
    callback({id: id, publicIP: ip, hostname: hostname, port: port, ssl: ssl});
};

exports.getErizoControllerForRoom = function (roomId, callback) {
    if (rooms[roomId] !== undefined) {
        callback(erizoControllers[rooms[roomId]]);
        return;
    }

    var id,
        intervarId = setInterval(function () {
            if (getErizoController) {
                id = getErizoController(roomId, erizoControllers, ecQueue);
            } else {
                id = ecQueue[0];
            }
            if (id !== undefined) {
                rooms[roomId] = id;
                callback(erizoControllers[id]);

                recalculatePriority();
                clearInterval(intervarId);
            }
        }, INTERVAL_TIME_EC_READY);
};

exports.getUsersInRoom = function (roomId, callback) {
    if (rooms[roomId] === undefined) {
        callback([]);
        return;
    }

    var rpcID = erizoControllers[rooms[roomId]].rpcID;
    rpc.callRpc(rpcID, 'getUsersInRoom', [roomId], {callback: function (users) {
        if (users === 'timeout') {
            users = '?';
        }
        callback(users);
    }});
};

exports.deleteRoom = function (roomId, callback) {
    if (rooms[roomId] === undefined) {
        callback('Success');
        return;
    }

    var rpcID = erizoControllers[rooms[roomId]].rpcID;
    rpc.callRpc(rpcID, 'deleteRoom', [roomId], {callback: function (result) {
        callback(result);
    }});
};

exports.deleteUser = function (user, roomId, callback) {
    var rpcID = erizoControllers[rooms[roomId]].rpcID;
    rpc.callRpc(rpcID, 'deleteUser', [{user: user, roomId:roomId}], {callback: function (result) {
        callback(result);
    }});
};

var rpcPublic = function rpcPublic () {
    var tokenRegistry = require('./mdb/tokenRegistry');
    var log = require('../common/logger')('RPCPublic');
    var that = {};
    that.deleteToken = function (id, callback) {
        tokenRegistry.removeOldTokens();
        tokenRegistry.removeToken(id, function (err, token) {
            if (!err) {
                log.info('Consumed token', token._id, 'from room', token.room, 'of service', token.service);
                callback('callback', token);
            } else {
                log.info('Consume token error:', err, id);
                callback('callback', 'error');
            }
        });
    };

    that.addNewErizoController = function (msg, callback) {
        addNewErizoController(msg, function (id) {
            callback('callback', id);   
        });
    };

    that.keepAlive = function (id, callback) {
        var result;
        if (erizoControllers[id] === undefined) {
            result = 'whoareyou';
            log.info('I received a keepAlive mess from a removed erizoController');
        } else {
            erizoControllers[id].keepAlive = 0;
            result = 'ok';
        }
        callback('callback', result);
    };

    that.setInfo = function (params, callback) {
        log.info('Received info ', params,    '.Recalculating erizoControllers priority');
        erizoControllers[params.id].state = params.state;
        recalculatePriority();
        callback('callback');
    };

    that.killMe = function (ip, callback) {
        log.info('[CLOUD HANDLER]: ErizoController in host ', ip, 'does not respond.');
        callback('callback');
    };

    that.getKey = function (id, callback) {
        if (erizoControllers[id]) {
            return callback('callback', nuveKey);
        }
        callback('callback', 'error');
    };
    return that;
};

exports.setupRpc = function setupRpc () {
    rpc.connect(function () {
        rpc.bind('nuve', rpcPublic(), function () {});
    });
};
