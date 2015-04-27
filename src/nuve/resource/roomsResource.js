/* global exports, require */
'use strict';
var roomRegistry = require('./../mdb/roomRegistry');
var serviceRegistry = require('./../mdb/serviceRegistry');

// Logger
var log = require('../../common/logger')('RoomsResource');

var currentService;

/*
 * Gets the service for the proccess of the request.
 */
var doInit = function () {
    currentService = require('./../auth/nuveAuthenticator').service;
};

/*
 * Post Room. Creates a new room for a determined service.
 */
exports.createRoom = function (req, res) {
    var room;

    doInit();

    if (currentService === undefined) {
        res.send('Service not found', 404);
        return;
    }
    if (req.body.name === undefined) {
        log.info('Invalid room');
        res.send('Invalid room', 404);
        return;
    }

    req.body.options = req.body.options || {};

    if (req.body.options.test) {
        if (currentService.testRoom !== undefined) {
            log.info('TestRoom already exists for service', currentService.name);
            res.send(currentService.testRoom);
        } else {
            room = {name: 'testRoom'};
            roomRegistry.addRoom(room, function (result) {
                currentService.testRoom = result;
                currentService.rooms.push(result);
                serviceRegistry.updateService(currentService);
                log.info('TestRoom created for service', currentService.name);
                res.send(result);
            });
        }
    } else {
        room = {name: req.body.name};
        
        if (req.body.options.p2p) {
            room.p2p = true;
        }
        if (req.body.options.data) {
            room.data = req.body.options.data;
        }
        roomRegistry.addRoom(room, function (result) {
            currentService.rooms.push(result);
            serviceRegistry.updateService(currentService);
            log.info('Room created:', req.body.name, 'for service', currentService.name, 'p2p = ', room.p2p);
            res.send(result);
        });
    }
};

/*
 * Get Rooms. Represent a list of rooms for a determined service.
 */
exports.represent = function (req, res) {
    doInit();
    if (currentService === undefined) {
        res.send('Service not found', 404);
        return;
    }
    log.info('Representing rooms for service ', currentService._id);

    res.send(currentService.rooms);
};
