#!/usr/bin/env node

'use strict';

var path = require('path');
process.chdir(path.resolve(__dirname, '../../agent/')); // resolve log4cxx.properties
var addon = require('../addon');
var conn = new addon.WebRtcConnection(
  true,
  true,
  '',
  0,
  0,
  0,
  false,
  '',
  0,
  '',
  ''
);
conn.init();
console.log(conn.getLocalSdp());

var evt = new addon.CrossNotification();
evt.on('abc', function(v) {
  console.log(v);
});

setInterval(function() {
  evt.emit('abc', Math.random());
}, 100);

setTimeout(function() {
  process.exit();
}, 2000);
