/* global module, require, __dirname */
'use strict';

var path = require('path');
var log4js = require('log4js');
var homeDir = path.resolve(__dirname, '../../local');
var config = require(path.join(homeDir, 'etc/logger'));
log4js.configure(config);
module.exports = function create (name) {
  return log4js.getLogger(name);
};
