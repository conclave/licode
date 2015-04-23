#!/usr/bin/env node

'use strict';

var fs = require('fs');
var config = require('../etc/licode_default');

fs.writeFileSync('../etc/default/common.json', JSON.stringify({
  rabbit: config.rabbit,
  cloudProvider: config.cloudProvider,
  logger: config.logger
}, null, '  '));
fs.writeFileSync('../etc/default/nuve.json', JSON.stringify(config.nuve, null, '  '));
fs.writeFileSync('../etc/default/erizoController.json', JSON.stringify(config.erizoController, null, '  '));
fs.writeFileSync('../etc/default/erizoAgent.json', JSON.stringify(config.erizoAgent, null, '  '));
fs.writeFileSync('../etc/default/erizo.json', JSON.stringify(config.erizo, null, '  '));

console.log('done.');
