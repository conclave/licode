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

var childs = [];

var SEARCH_INTERVAL = 5000;

var idle_erizos = [];

var erizos = [];

var processes = {};

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

var saveChild = function(id) {
    childs.push(id);
};

var removeChild = function(id) {
    childs.push(id);
};

var launchErizoJS = function() {
    log.info('Running process');
    var id = guid();
    var fs = require('fs');
    var out = fs.openSync('./erizo-' + id + '.log', 'a');
    var err = fs.openSync('./erizo-' + id + '.log', 'a');
    var erizoProcess = spawn(path.resolve(__dirname, './launch.sh'), [path.resolve(__dirname, '../node-erizo'), id, privateIP, publicIP], { detached: true, stdio: [ 'ignore', out, err ] });
    erizoProcess.unref();
    erizoProcess.on('close', function (code) {
        var index = idle_erizos.indexOf(id);
        var index2 = erizos.indexOf(id);
        if (index > -1) {
            idle_erizos.splice(index, 1);
        } else if (index2 > -1) {
            erizos.splice(index2, 1);
        }
        delete processes[id];
        fillErizos();
    });

    log.info('Launched new ErizoJS ', id);
    processes[id] = erizoProcess;
    idle_erizos.push(id);
};

var dropErizoJS = function(erizo_id, callback) {
   if (processes.hasOwnProperty(erizo_id)) {
      var process = processes[erizo_id];
      process.kill();
      delete processes[erizo_id];
      callback('callback', 'ok');
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

var api = {
    createErizoJS: function(callback) {
        try {
            var erizo_id = getErizo(); 
            callback('callback', erizo_id);
            erizos.push(erizo_id);
            fillErizos();
        } catch (error) {
            log.error('Error in ErizoAgent:', error);
        }
    },
    deleteErizoJS: function(id, callback) {
        try {
            dropErizoJS(id, callback);
        } catch(err) {
            log.error('Error stopping ErizoJS');
        }
    }
};

fillErizos();

rpc.connect(function () {
    rpc.setPublicRPC(api);
    var rpcID = 'ErizoAgent'; //FIXME: register to NUVE and get rpcID from it.
    rpc.bind(rpcID);
});

['SIGINT', 'SIGTERM'].map(function (sig) {
    process.on(sig, function () {
        log.warn('Exiting on', sig);
        process.exit();
    });
});

process.on('exit', function () {
    Object.keys(processes).map(function (k) {
        dropErizoJS(k, function(status){
            log.info('Terminate ErizoJS', k, status);
        });
    });
});
