/* global require, exports */
'use strict';
var db = require('./dataBase').db;

// Logger
var log = require('../../common/logger')('RoomRegistry');

var getRoom = exports.getRoom = function (id, callback) {
    db.rooms.findOne({_id: db.ObjectId(id)}, function (err, room) {
        if (room === undefined) {
            log.warn('Room ', id, ' not found');
        }
        if (callback !== undefined) {
            callback(room);
        }
    });
};

/*
 * Adds a new room to the data base.
 */
exports.addRoom = function (room, callback) {
    db.rooms.save(room, function (error, saved) {
        if (error) {
            log.warn('MongoDB: Error adding room: ', error);
            return callback('adding room error');
        }
        callback(null, saved);
    });
};

/*
 * Updates a room in the data base.
 */
exports.updateRoom = function (id, content, callback) {
    getRoom(id, function (room) {
        if (room) {
            content._id = db.ObjectId(id);
            db.rooms.save(content, function (error, saved) {
                if (error) {
                    log.warn('MongoDB: Error adding room: ', error);
                    return callback('adding room error');
                }
                callback(null, saved);
            });
        } else {
            callback('no such room');
        }
    });
};

/*
 * Removes a determined room from the data base.
 */
exports.removeRoom = function (id, callback) {
    getRoom(id, function (room) {
        if (room) {
            db.rooms.remove({_id: db.ObjectId(id)}, function (error, removed) {
                if (error) {
                    log.warn('MongoDB: Error removing room: ', error);
                    return callback('removing room error');
                }
                if (removed.n === 1) {
                    callback(null);
                } else {
                    callback('room already removed');
                }
            });
        } else {
            callback('no such room');
        }
    });
};
