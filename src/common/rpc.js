/* global module, require */
'use strict';

var config = require('../../local/etc/common');

switch (config.rpc) {
  case 'nats':
    var RPC = require('./rpc_nats');
    module.exports = new RPC(config.nats);
    break;
  case 'nsq':
    var RPC = require('./rpc_nsq');
    module.exports = new RPC(config.nsq);
    break;
  case 'amqp':
    var RPC = require('./rpc_amqp');
    module.exports = new RPC(config.rabbit);
    break;
  default:
    var RPC = require('./rpc_'+config.rpc);
    module.exports = new RPC(config[config.rpc]);
    // throw 'Unsupported RPC module';
}
