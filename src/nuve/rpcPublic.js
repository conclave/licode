/* global exports, require */
'use strict';
var tokenRegistry = require('./mdb/tokenRegistry');
var cloudHandler = require('./cloudHandler');

// Logger
var log = require('../common/logger')('RPCPublic');

/*
 * This function is used to consume a token. Removes it from the data base and returns to erizoController.
 * Also it removes old tokens.
 */
exports.deleteToken = function (id, callback) {
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

exports.addNewErizoController = function (msg, callback) {
    cloudHandler.addNewErizoController(msg, function (id) {
        callback('callback', id);   
    });
};

exports.keepAlive = function (id, callback) {
    cloudHandler.keepAlive(id, function (result) {
        callback('callback', result);
    });
};

exports.setInfo = function (params, callback) {
    cloudHandler.setInfo(params);
    callback('callback');
};

exports.killMe = function (ip, callback) {
    cloudHandler.killMe(ip);
    callback('callback');
};

exports.getKey = function (id, callback) {
    callback('callback', cloudHandler.getKey(id));
};
