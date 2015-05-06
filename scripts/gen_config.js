#!/usr/bin/env node

'use strict';

var fs = require('fs');
var path = require('path');
var homeDir = path.resolve(__dirname, '../local');
var config = require('../contrib/licode_default');
config.logger = require('../contrib/log4js_configuration');

fs.writeFileSync(path.join(homeDir, 'etc/common.json'), JSON.stringify({
  rabbit: config.rabbit,
  nats: config.nats,
  nsq: config.nsq,
  rpc: config.rpc,
  cloudProvider: config.cloudProvider
}, null, '  '));
fs.writeFileSync(path.join(homeDir, 'etc/log4js_configuration.json'), JSON.stringify(config.logger, null, '  '));
fs.writeFileSync(path.join(homeDir, 'etc/nuve.json'), JSON.stringify(config.nuve, null, '  '));
fs.writeFileSync(path.join(homeDir, 'etc/erizoController.json'), JSON.stringify(config.erizoController, null, '  '));
fs.writeFileSync(path.join(homeDir, 'etc/erizoAgent.json'), JSON.stringify(config.erizoAgent, null, '  '));
fs.writeFileSync(path.join(homeDir, 'etc/erizo.json'), JSON.stringify(config.erizo, null, '  '));

console.log('done.');
