#!/usr/bin/env node
'use strict';
var util = require('util');
var db = require('./db');
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

  setInterval(function () {
    nuve.getRooms(function (res) {
      var rooms = JSON.parse(res);
      util.log('Current Length: '+rooms.length);
    }, function (err) {
      util.log('Error!!', err);
    });
  }, 1000);

  nuve.getRooms(function (res) {
    var targets = [];
    var rooms = JSON.parse(res);
    if (rooms.length > 0) {
      for (var room in rooms) {
        if (rooms[room].name === 'TestingRoom') {
          targets.push(rooms[room]._id);
        }
      }
      deleteRoom(targets);
    } else {
      addRoom(20);
    }
  }, function(err) {
    console.log('Fail:', err);
  });
});


function deleteRoom (targets) {
  var delId = setInterval(function () {
    if (targets.length > 0) {
      var id = targets[0];
      nuve.deleteRoom(id, function (res) {
        console.log(res);
        targets.splice(0, 1);
        if (targets.length === 0) {
          clearInterval(delId);
        }
      }, function (status, err) {
        console.log('ERR:', status, err);
      });
    }
  }, 100);
}

function addRoom (capa) {
  var id = setInterval(function () {
    var room = {name:'TestingRoom'};
    nuve.createRoom(room, function (resp) {
      console.log(resp);
      capa--;
      if (capa < 0) {
        clearInterval(id);
      }
    }, function (status, err) {
      console.log('Error in creating room:', status, err);
    });
  }, 100);
}
