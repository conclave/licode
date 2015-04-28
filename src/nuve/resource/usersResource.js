/* global exports, require */
'use strict';
var serviceRegistry = require('./../mdb/serviceRegistry');
var cloudHandler = require('../cloudHandler');

// Logger
var log = require('../../common/logger')('UsersResource');

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
 * Get Users. Represent a list of users of a determined room. This is consulted to cloudHandler.
 */
exports.getList = function (req, res) {
    doInit(req.params.room, function () {

        if (currentService === undefined) {
            res.status(404).send('Service not found');
            return;
        } else if (currentRoom === undefined) {
            log.info('Room ', req.params.room, ' does not exist');
            res.status(404).send('Room does not exist');
            return;
        }

        log.info('Representing users for room ', currentRoom._id, 'and service', currentService._id);
        cloudHandler.getUsersInRoom (currentRoom._id, function (users) {
            if (users === 'error') {
                res.status(401).send('CloudHandler does not respond');
                return;
            }
            res.send(users);
        });
    });
};