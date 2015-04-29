/* global exports, require */
'use strict';
var serviceRegistry = require('./../mdb/serviceRegistry');
var cloudHandler = require('../cloudHandler');

// Logger
var log = require('../../common/logger')('UsersResource');

/*
 * Gets the service and the room for the proccess of the request.
 */
var doInit = function (roomId, callback) {
    var currentService = require('./../auth/nuveAuthenticator').service;
    serviceRegistry.getRoomForService(roomId, currentService, function (room) {
        callback(currentService, room);
    });
};

/*
 * Get Users. Represent a list of users of a determined room. This is consulted to cloudHandler.
 */
exports.getList = function (req, res) {
    doInit(req.params.room, function (service, room) {
        if (service === undefined) {
            res.status(404).send('Service not found');
            return;
        } else if (room === undefined) {
            log.info('Room ', req.params.room, ' does not exist');
            res.status(404).send('Room does not exist');
            return;
        }

        log.info('Representing users for room ', room._id, 'and service', service._id);
        cloudHandler.getUsersInRoom (room._id, function (users) {
            if (users === 'error') {
                res.status(401).send('CloudHandler does not respond');
                return;
            }
            res.send(users);
        });
    });
};

/*
 * Get User. Represent a determined user of a room. This is consulted to erizoController using RabbitMQ RPC call.
 */
exports.getUser = function (req, res) {
    doInit(req.params.room, function (service, room) {
        if (service === undefined) {
            res.status(404).send('Service not found');
            return;
        } else if (room === undefined) {
            log.info('Room ', req.params.room, ' does not exist');
            res.status(404).send('Room does not exist');
            return;
        }

        var user = req.params.user;
        cloudHandler.getUsersInRoom(room._id, function (users) {
            if (users === 'error') {
                res.status(401).send('CloudHandler does not respond');
                return;
            }
            for (var index in users) {
                if (users[index].name === user) {
                    log.info('Found user', user);
                    res.send(users[index]);
                    return;
                }
            }
            log.error('User', req.params.user, 'does not exist');
            res.status(404).send('User does not exist');
            return;
        });
    });
};

/*
 * Delete User. Removes a determined user from a room. This order is sent to erizoController using RabbitMQ RPC call.
 */
exports.deleteUser = function (req, res) {
    doInit(req.params.room, function (service, room) {
        if (service === undefined) {
            res.status(404).send('Service not found');
            return;
        } else if (room === undefined) {
            log.info('Room ', req.params.room, ' does not exist');
            res.status(404).send('Room does not exist');
            return;
        }

        var user = req.params.user;
        cloudHandler.deleteUser(user, room._id, function(result){
            if (result === 'User does not exist'){
                res.status(404).send(result);
            } else {
                res.send(result);
                return;
            }
        });
    });
};
