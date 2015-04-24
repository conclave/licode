#!/usr/bin/env node
'use strict';

var HOME = process.env.ROOT_DIR;
if (!HOME) {
  throw 'ROOT_DIR not found';
}

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var defaultConfigFile = path.join(HOME, 'etc/licode_default.js');
var nuveConfig = require(defaultConfigFile).nuve;
var dbURL = process.env.DB_URL || nuveConfig.dataBaseURL;
var mongojs = require('mongojs');
var db = mongojs.connect(dbURL, ['services']);
var nuveConfigFile = path.join(HOME, 'etc/default/nuve.json');

function prepareService (serviceName, next) {
  db.services.findOne({name: serviceName}, function cb (err, service) {
    if (err || !service) {
      service = {name: serviceName, key: crypto.randomBytes(32).toString('base64'), rooms: []};
      db.services.save(service, function cb (err, saved) {
        if (err) {
          console.log('mongodb: error in adding', serviceName);
          return db.close();
        }
        next(saved);
      });
    } else {
      next(service);
    }
  });
}

prepareService('superService', function (service) {
  db.close();
  var superServiceId = service._id+'';
  var superServiceKey = service.key;
  console.log('superServiceId:', superServiceId);
  console.log('superServiceKey:', superServiceKey);
  try {
    fs.statSync(nuveConfigFile);
    nuveConfig = require(nuveConfigFile);
  } catch (e) {}
  nuveConfig.dataBaseURL = dbURL;
  nuveConfig.superserviceID = superServiceId;
  fs.writeFile(nuveConfigFile, JSON.stringify(nuveConfig, null, '  '), 'utf8', function (err) {
    if (err) return console.log('Error in saving nuve.json:', err);
    console.log(nuveConfigFile, 'configured.');
  });
});