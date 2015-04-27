/* global require, exports */
'use strict';
var db = require('./dataBase').db;

// Logger
var log = require('../../common/logger')('TokenRegistry');

/*
 * Gets a list of the tokens in the data base.
 */
exports.getList = function getList (callback) {
    db.tokens.find({}).toArray(function (err, tokens) {
        if (err || !tokens) {
            log.info('Empty list');
        } else {
            callback(tokens);
        }
    });
};

var getToken = exports.getToken = function (id, callback) {
    db.tokens.findOne({_id: db.ObjectId(id)}, function (err, token) {
        if (!token) {
            token = undefined;
            log.info('Token ', id, ' not found');
        }
        if (callback !== undefined) {
            callback(token);
        }
    });
};

var hasToken = exports.hasToken = function (id, callback) {
    getToken(id, function (token) {
        if (token === undefined) {
            callback(false);
        } else {
            callback(true);
        }
    });

};

/*
 * Adds a new token to the data base.
 */
exports.addToken = function (token, callback) {
    db.tokens.save(token, function (error, saved) {
        if (error) log.info('MongoDB: Error adding token: ', error);
        callback(saved._id);
    });
};

/*
 * Removes a token from the data base.
 */
var removeToken = exports.removeToken = function (id, callback) {
    hasToken(id, function (hasT) {
        if (hasT) {
            db.tokens.remove({_id: db.ObjectId(id)}, function (error, removed) {
                if (error) log.info('MongoDB: Error removing token: ', error);
                callback();
            });
            
        }
    });
};

/*
 * Updates a determined token in the data base.
 */
exports.updateToken = function (token) {
    db.tokens.save(token, function (error, saved) {
        if (error) log.info('MongoDB: Error updating token: ', error);
    });
};

exports.removeOldTokens = function () {
    var i, token, time, tokenTime, dif;

    db.tokens.find({'use':{$exists:false}}).toArray(function (err, tokens) {
        if (err || !tokens) {
            
        } else {
            for (i in tokens) {
                token = tokens[i];
                time = (new Date()).getTime();
                tokenTime = token.creationDate.getTime();
                dif = time - tokenTime;

                if (dif > 3*60*1000) {
                    log.info('Removing old token ', token._id, 'from room ', token.room, ' of service ', token.service);
                    removeToken(token._id + '', function() {});
                }
            }
        }
    });
};
