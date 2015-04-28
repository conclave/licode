/* global exports, require */
'use strict';
var roomRegistry = require('./../mdb/roomRegistry');
var serviceRegistry = require('./../mdb/serviceRegistry');
var cloudHandler = require('../cloudHandler');

// Logger
var log = require('../../common/logger')('RoomResource');

var currentService;
var currentRoom;

/*
 * Gets the service and the room for the proccess of the request.
 */
var doInit = function (roomId, callback) {
    currentService = require('./../auth/nuveAuthenticator').service;

    serviceRegistry.getRoomForService(roomId, currentService, function (room) {
        currentRoom = room;
        callback();
    });
};

/*
 * Get Room. Represents a determined room.
 */
exports.represent = function (req, res) {
    doInit(req.params.room, function () {
        if (currentService === undefined) {
            res.status(401).send('Client unathorized');
        } else if (currentRoom === undefined) {
            log.info('Room ', req.params.room, ' does not exist');
            res.status(404).send('Room does not exist');
        } else {
            log.info('Representing room ', currentRoom._id, 'of service ', currentService._id);
            res.send(currentRoom);
        }
    });
};

/*
 * Delete Room. Removes a determined room from the data base and asks cloudHandler to remove it from erizoController.
 */
exports.deleteRoom = function (req, res) {
    doInit(req.params.room, function () {
        if (currentService === undefined) {
            res.status(401).send('Client unathorized');
        } else if (currentRoom === undefined) {
            log.info('Room ', req.params.room, ' does not exist');
            res.status(404).send('Room does not exist');
        } else {
            var id = '',
                array = currentService.rooms,
                index = -1,
                i;

            id += currentRoom._id;
            roomRegistry.removeRoom(id);

            for (i = 0; i < array.length; i += 1) {
                if (array[i]._id === currentRoom._id) {
                    index = i;
                    break;
                }
            }
            if (index !== -1) {
                currentService.rooms.splice(index, 1);
                serviceRegistry.updateService(currentService);
                log.info('Room ', id, ' deleted for service ', currentService._id);
                cloudHandler.deleteRoom(id, function () {});
                res.send('Room deleted');
            }
        }
    });
};
