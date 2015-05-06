/* global module, require */
'use strict';

var config = require('../../local/etc/common');

switch (config.rpc) {
  case 'nsq':
    var RPC = require('./rpc_nsq');
    module.exports = new RPC(config.nsq);
    break;
  case 'amqp':
    var RPC = require('./rpc_amqp');
    module.exports = new RPC(config.rabbit);
    break;
  case 'nats':
    var RPC = require('./rpc_nats');
    module.exports = new RPC(config.nats);
    break;
  default:
    throw 'Unsupported RPC module';
}
