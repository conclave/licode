/* global exports, require */
'use strict';
var serviceRegistry = require('./../mdb/serviceRegistry');

// Logger
var log = require('../../common/logger')('ServicesResource');

/*
 * Gets the service and checks if it is superservice. Only superservice can do actions about services.
 */
var doInit = function (targetService, callback) {
    var service = require('./../auth/nuveAuthenticator').service,
        superService = require('./../mdb/dataBase').superService;

    service._id = service._id + '';
    if (service._id !== superService) {
        log.info('Service', service._id, 'not authorized for this action');
        callback('error', undefined);
    } else {
        if (!targetService) {
            callback(null);
            return;
        }
        serviceRegistry.getService(targetService, function (ser) {
            callback(null, ser);
        });
    }
};

/*
 * Post Service. Creates a new service.
 */
exports.create = function (req, res) {
    doInit(null, function (err) {
        if (err) {
            res.status(401).send('Service not authorized for this action');
            return;
        }
        serviceRegistry.addService(req.body, function (result) {
            log.info('Service created: ', req.body.name);
            res.send(result);
        });
    });
};

/*
 * Get Service. Represents a determined service.
 */
exports.getList = function (req, res) {
    doInit(null, function (err) {
        if (err) {
            res.status(401).send('Service not authorized for this action');
            return;
        }
        serviceRegistry.getList(function (list) {
            log.info('Representing services');
            res.send(list);
        });
    });
};

/*
 * Get Service. Represents a determined service.
 */
exports.represent = function (req, res) {
    doInit(req.params.service, function (err, serv) {
        if (err) {
            res.status(401).send('Service not authorized for this action');
            return;
        }
        if (serv === undefined) {
            res.status(404).send('Service not found');
            return;
        }
        log.info('Representing service', serv._id);
        res.send(serv);
    });
};

/*
 * Delete Service. Removes a determined service from the data base.
 */
exports.deleteService = function (req, res) {
    doInit(req.params.service, function (err, serv) {
        if (err) {
            res.status(401).send('Service not authorized for this action');
            return;
        }
        if (serv === undefined) {
            res.status(404).send('Service not found');
            return;
        }
        var id = '';
        id += serv._id;
        serviceRegistry.removeService(id);
        log.info('Serveice', id, 'deleted');
        res.send('Service deleted');
    });
};
