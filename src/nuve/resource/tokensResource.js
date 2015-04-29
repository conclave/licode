/* global exports, require, Buffer */
'use strict';
var tokenRegistry = require('./../mdb/tokenRegistry');
var serviceRegistry = require('./../mdb/serviceRegistry');
var dataBase = require('./../mdb/dataBase');
var crypto = require('crypto');
var cloudHandler = require('../cloudHandler');

// Logger
var log = require('../../common/logger')('TokensResource');

/*
 * Gets the service and the room for the proccess of the request.
 */
var doInit = function (roomId, callback) {
    var currentService = require('./../auth/nuveAuthenticator').service;
    serviceRegistry.getRoomForService(roomId, currentService, function (room) {
        callback(currentService, room);
    });
};

var getTokenString = function (id, token) {
    var toSign = id + ',' + token.host,
        hex = crypto.createHmac('sha1', dataBase.nuveKey).update(toSign).digest('hex'),
        signed = (new Buffer(hex)).toString('base64'),

        tokenJ = {
            tokenId: id,
            host: token.host,
            secure: token.secure,
            signature: signed
        },
        tokenS = (new Buffer(JSON.stringify(tokenJ))).toString('base64');

    return tokenS;
};

/*
 * Generates new token. 
 * The format of a token is:
 * {tokenId: id, host: erizoController host, signature: signature of the token};
 */
var generateToken = function (service, room, callback) {
    var user = require('./../auth/nuveAuthenticator').user,
        role = require('./../auth/nuveAuthenticator').role,
        token;

    if (user === undefined || user === '') {
        callback(undefined);
        return;
    }

    token = {};
    token.userName = user;
    token.room = room._id;
    token.role = role;
    token.service = service._id;
    token.creationDate = new Date();

    // Values to be filled from the erizoController
    token.secure = false;

    if (room.p2p) {
        token.p2p = true;
    }

    cloudHandler.getErizoControllerForRoom(room._id, function (ec) {
        if (ec === 'timeout') {
            callback('error');
            return;
        }

        token.secure = ec.ssl;
        if (ec.hostname !== '') {
            token.host = ec.hostname;
        } else {
            token.host = ec.ip;
        }

        token.host += ':' + ec.port;

        tokenRegistry.addToken(token, function (id) {
            callback(getTokenString(id, token));
        });
    });
};

/*
 * Post Token. Creates a new token for a determined room of a service.
 */
exports.create = function (req, res) {
    doInit(req.params.room, function (service, room) {
        if (service === undefined) {
            log.info('Service not found');
            res.status(404).send('Service not found');
            return;
        } else if (room === undefined) {
            log.info('Room', req.params.room, 'does not exist');
            res.status(404).send('Room does not exist');
            return;
        }

        generateToken(service, room, function (tokenS) {
            if (tokenS === undefined) {
                res.status(401).send('Name and role?');
                return;
            }
            if (tokenS === 'error') {
                res.status(401).send('CloudHandler does not respond');
                return;
            }
            log.info('Created token for room ', room._id, 'and service ', service._id);
            res.send(tokenS);
        });
    });
};
