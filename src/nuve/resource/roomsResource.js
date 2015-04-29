/* global exports, require */
'use strict';
var roomRegistry = require('./../mdb/roomRegistry');
var serviceRegistry = require('./../mdb/serviceRegistry');
var cloudHandler = require('../cloudHandler');

// Logger
var log = require('../../common/logger')('RoomsResource');

/*
 * Gets the service for the proccess of the request.
 */
var doInit = function (roomId, callback) {
    var currentService = require('./../auth/nuveAuthenticator').service;
    if (!roomId) {
        callback(currentService);
        return;
    }
    serviceRegistry.getRoomForService(roomId, currentService, function (room) {
        callback(currentService, room);
    });
};

/*
 * Post Room. Creates a new room for a determined service.
 */
exports.createRoom = function (req, res) {
    doInit(null, function (service) {
        if (service === undefined) {
            return res.status(404).send('Service not found');
        }
        if (req.body.name === undefined) {
            log.info('Invalid room');
            return res.status(404).send('Invalid room');
        }

        req.body.options = req.body.options || {};

        var room = {name: req.body.name};
        if (req.body.options.p2p) {
            room.p2p = true;
        }
        if (req.body.options.data) {
            room.data = req.body.options.data;
        }
        roomRegistry.addRoom(room, function (err, result) {
            if (err) {
                return res.status(500).send(err);
            }
            service.rooms.push(result);
            serviceRegistry.updateService(service);
            log.info('Room created:', req.body.name, 'for service', service.name, 'p2p = ', room.p2p);
            res.send(result);
        });
    });
};

/*
 * Get Rooms. Represent a list of rooms for a determined service.
 */
exports.getList = function (req, res) {
    doInit(null, function (service) {
        if (service === undefined) {
            return res.status(404).send('Service not found');
        }
        log.info('Representing rooms for service', service._id);
        res.send(service.rooms);
    });
};

/*
 * Get Room. Represents a determined room.
 */
exports.represent = function (req, res) {
    doInit(req.params.room, function (service, room) {
        if (service === undefined) {
            res.status(401).send('Client unathorized');
        } else if (room === undefined) {
            log.info('Room', req.params.room, 'does not exist');
            res.status(404).send('Room does not exist');
        } else {
            log.info('Representing room', room._id, 'of service', service._id);
            res.send(room);
        }
    });
};

/*
 * Delete Room. Removes a determined room from the data base and asks cloudHandler to remove it from erizoController.
 */
exports.deleteRoom = function (req, res) {
    doInit(req.params.room, function (service, room) {
        if (service === undefined) {
            res.status(401).send('Client unathorized');
        } else if (room === undefined) {
            log.info('Room', req.params.room, 'does not exist');
            res.status(404).send('Room does not exist');
        } else {
            var array = service.rooms,
                index = -1;

            var id = '' + room._id;
            roomRegistry.removeRoom(id, function (err) {
                if (err) {
                    return res.status(500).send(err);
                }
                for (var i = 0; i < array.length; i += 1) {
                    if (array[i]._id === room._id) {
                        index = i;
                        break;
                    }
                }
                if (index !== -1) {
                    service.rooms.splice(index, 1);
                    serviceRegistry.updateService(service);
                    log.info('Room', id, 'deleted for service', service._id);
                    cloudHandler.deleteRoom(id, function () {});
                    res.send('Room deleted');
                }
            });
        }
    });
};
