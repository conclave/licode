/*global require, process, GLOBAL*/
'use strict';

var Getopt = require('node-getopt');

GLOBAL.config = {};
GLOBAL.config.erizo = require('../../../local/etc/erizo');
GLOBAL.config.rabbit = require('../../../local/etc/common').rabbit;

// Parse command line arguments
var getopt = new Getopt([
  ['r' , 'rabbit-host=ARG'            , 'RabbitMQ Host'],
  ['g' , 'rabbit-port=ARG'            , 'RabbitMQ Port'],
  ['s' , 'stunserver=ARG'             , 'Stun Server hostname'],
  ['p' , 'stunport=ARG'               , 'Stun Server port'],
  ['m' , 'minport=ARG'                , 'Minimum port'],
  ['M' , 'maxport=ARG'                , 'Maximum port'],
  ['h' , 'help'                       , 'display this help']
]);

var opt = getopt.parse(process.argv.slice(2));

for (var prop in opt.options) {
    if (opt.options.hasOwnProperty(prop)) {
        var value = opt.options[prop];
        switch (prop) {
            case 'help':
                getopt.showHelp();
                process.exit(0);
                break;
            case 'rabbit-host':
                GLOBAL.config.rabbit = GLOBAL.config.rabbit || {};
                GLOBAL.config.rabbit.host = value;
                break;
            case 'rabbit-port':
                GLOBAL.config.rabbit = GLOBAL.config.rabbit || {};
                GLOBAL.config.rabbit.port = value;
                break;
            default:
                GLOBAL.config.erizo[prop] = value;
                break;
        }
    }
}

var rpc = require('../../common/rpc');

// Logger
var log = require('../../common/logger')('Erizo.node');

var rpcPublic = require('./rpcPublic')();

rpcPublic.keepAlive = function (callback) {
    log.debug('KeepAlive from ErizoController');
    callback('callback', true);
};

rpcPublic.privateRegexp = new RegExp(process.argv[3], 'g');
rpcPublic.publicIP = process.argv[4];

rpc.connect(function () {
    try {
        var rpcID = process.argv[2];
        log.info('ID: Erizo.node_' + rpcID);
        rpc.bind('Erizo.node_' + rpcID, rpcPublic, function () {
            log.info('Erizo.node started');
        });
    } catch (err) {
        log.error('Error', err);
    }
});

['SIGINT', 'SIGTERM'].map(function (sig) {
    process.on(sig, function () {
        log.warn('Exiting on', sig);
        process.exit();
    });
});

['SIGHUP', 'SIGPIPE'].map(function (sig) {
    process.on(sig, function () {
        log.warn(sig, 'caught and ignored');
    });
});
