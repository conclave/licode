#!/usr/bin/env node
'use strict';
var db = require('./db');
var rpc = require('../../common/rpc');
var log = require('../../common/logger')('TokenTest');
var nuve;

db.services.findOne({name: 'superService'}, function cb (err, service) {
  if (err || !service) {
    console.log('Error in retrieving superService', err);
    process.exit(1);
  }
  var id = service._id + '';
  nuve = require('../../client/nuve/nodejs').create({
    service: id,
    key: service.key,
    url: 'http://localhost:3000'
  });

  rpc.connect(function () {
    log.info('rpc connected');
    nuve.getRooms(function getRooms (rooms) {
      var room = JSON.parse(rooms)[0]; // make sure room is available!
      log.info('room:', room._id);
      nuve.createToken(room._id, 'tokenRemoveTester', 'viewer', function (token) {
        log.info('token:', token);
        token = new Buffer(token, 'base64').toString('ascii');
        token = JSON.parse(token);
        [0,1,2,3,4,5,6,7,8,9].map(function (i) {
          rpc.callRpc('nuve', 'deleteToken', token.tokenId, {callback: function (resp) {
            log.info('response'+i+':', resp);
          }});
        });
      });
    });
  });
});