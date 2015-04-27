#!/usr/bin/env node

'use strict';

var fs = require('fs');
var path = require('path');
var homeDir = path.resolve(__dirname, '../local');
console.log(homeDir);
var config = require('../etc/licode_default');

fs.writeFileSync(path.join(homeDir, 'etc/common.json'), JSON.stringify({
  rabbit: config.rabbit,
  cloudProvider: config.cloudProvider
}, null, '  '));
fs.writeFileSync(path.join(homeDir, 'etc/logger.json'), JSON.stringify(config.logger, null, '  '));
fs.writeFileSync(path.join(homeDir, 'etc/nuve.json'), JSON.stringify(config.nuve, null, '  '));
fs.writeFileSync(path.join(homeDir, 'etc/erizoController.json'), JSON.stringify(config.erizoController, null, '  '));
fs.writeFileSync(path.join(homeDir, 'etc/erizoAgent.json'), JSON.stringify(config.erizoAgent, null, '  '));
fs.writeFileSync(path.join(homeDir, 'etc/erizo.json'), JSON.stringify(config.erizo, null, '  '));

console.log('done.');
