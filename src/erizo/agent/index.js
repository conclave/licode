/*global require, process, __dirname, GLOBAL*/
'use strict';

var Getopt = require('node-getopt');
var spawn = require('child_process').spawn;
var path = require('path');

// Configuration default values
GLOBAL.config = {};
GLOBAL.config.erizoAgent = require('../../../local/etc/erizoAgent');
GLOBAL.config.rabbit = require('../../../local/etc/common').rabbit;

var BINDED_INTERFACE_NAME = GLOBAL.config.erizoAgent.networkInterface;
var LD_LIBRARY_PATH = path.resolve(__dirname, '../../../local/lib');

// Parse command line arguments
var getopt = new Getopt([
  ['r' , 'rabbit-host=ARG'            , 'RabbitMQ Host'],
  ['g' , 'rabbit-port=ARG'            , 'RabbitMQ Port'],
  ['M' , 'maxProcesses=ARG'          , 'Stun Server URL'],
  ['P' , 'prerunProcesses=ARG'         , 'Default video Bandwidth'],
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
                GLOBAL.config.erizoAgent[prop] = value;
                break;
        }
    }
}

var rpc = require('../../common/rpc');

// Logger
var log = require('../../common/logger')('ErizoAgent');

var privateIP = require('../../common/util').getPrivateIP(BINDED_INTERFACE_NAME);
var publicIP = GLOBAL.config.erizoAgent.publicIP || privateIP;

// var SEARCH_INTERVAL = 5000;

var idle_erizos = [];

var erizos = [];

var children = {};

var guid = (function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
    }
    return function() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
    };
})();

var launchErizoJS = function () {
    log.info('Running process');
    var id = guid();
    var fs = require('fs');
    var output = path.resolve(process.env.RUN_DIR || '', './erizo-' + id + '.log');
    var out = fs.openSync(output, 'a');
    var err = fs.openSync(output, 'a');
    var env = process.env;
    if (env.LD_LIBRARY_PATH) {
        env.LD_LIBRARY_PATH += ':'+LD_LIBRARY_PATH;
    } else {
        env.LD_LIBRARY_PATH = LD_LIBRARY_PATH;
    }
    var child = spawn('node', [path.resolve(__dirname, '../node-erizo'), id, privateIP, publicIP], {
        detached: true,
        stdio: [ 'ignore', out, err ],
        env: env
    });
    child.unref();
    child.on('close', function () {
        var index = idle_erizos.indexOf(id);
        var index2 = erizos.indexOf(id);
        if (index > -1) {
            idle_erizos.splice(index, 1);
        } else if (index2 > -1) {
            erizos.splice(index2, 1);
        }
        delete children[id];
        fillErizos();
    });

    log.info('Launched new Erizo.node ', id);
    children[id] = child;
    idle_erizos.push(id);
};

var dropErizoJS = function (erizo_id, callback) {
    if (children.hasOwnProperty(erizo_id)) {
        var process = children[erizo_id];
        process.kill();
        delete children[erizo_id];
        callback('callback', 'ok');
    } else {
        callback('callback', 'none');
    }
};

var fillErizos = function () {
    if (erizos.length + idle_erizos.length < GLOBAL.config.erizoAgent.maxProcesses) {
        if (idle_erizos.length < GLOBAL.config.erizoAgent.prerunProcesses) {
            launchErizoJS();
            fillErizos();
        }
    }
};

var getErizo = function () {
    var erizo_id = idle_erizos.shift();
    if (!erizo_id) {
        if (erizos.length < GLOBAL.config.erizoAgent.maxProcesses) {
            launchErizoJS();
            return getErizo();
        } else {
            erizo_id = erizos.shift();
        }
    }
    return erizo_id;
};

var rpcPublic = {
    createErizoJS: function (callback) {
        try {
            var erizo_id = getErizo(); 
            callback('callback', erizo_id);
            erizos.push(erizo_id);
            fillErizos();
        } catch (error) {
            log.error('Error in ErizoAgent:', error);
        }
    },
    deleteErizoJS: function (id, callback) {
        try {
            dropErizoJS(id, callback);
        } catch (err) {
            log.error('Error stopping Erizo.node');
        }
    }
};

fillErizos();

rpc.connect(function () {
    var rpcID = 'ErizoAgent'; //FIXME: register to NUVE and get rpcID from it.
    rpc.bind(rpcID, rpcPublic, function () {});
});

['SIGINT', 'SIGTERM'].map(function (sig) {
    process.on(sig, function () {
        log.warn('Exiting on', sig);
        process.exit();
    });
});

process.on('exit', function () {
    log.info('Killing', Object.keys(children));
    Object.keys(children).map(function (k) {
        children[k].kill();
        delete children[k];
        log.info('Erizo.node', k, 'terminated.');
    });
});
