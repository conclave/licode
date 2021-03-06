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
  '');

conn.on('connection', function (data) {
  console.log(JSON.parse(data).status);
});

conn.on('stats', function (data) {
  console.log(data);
});

console.log(conn.getLocalSdp());

var evt = new addon.CrossCallback();
var abcHandler = function(v) {
  console.log('1:', v);
};
evt.on('abc', abcHandler);

evt.on('abc', function(v) {
  console.log('2:', v);
});

console.log(evt.self());

setInterval(function() {
  evt.emit('abc', Math.random());
}, 100);

setTimeout(function() {
  evt.removeEventListener('abc', abcHandler);
  console.log(evt.self());
  evt.on('abc', abcHandler);
  console.log(evt.self());
  evt.removeEventListener('abc', abcHandler);
  console.log(evt.self());
  evt.on('bcd', abcHandler);
}, 1000);

setTimeout(function() {
  evt.clearEventListener('abc');
  console.log(evt.self());
  evt.clearEventListener();
  console.log(evt.self());
}, 1500);

setTimeout(function() {
  process.exit();
}, 2000);
