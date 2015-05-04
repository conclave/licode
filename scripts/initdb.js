#!/usr/bin/env node
'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var defaultConfigFile = path.resolve(__dirname, '../contrib/licode_default.js');
var nuveConfigFile = path.resolve(__dirname, '../local/etc/nuve.json');
var nuveConfig = require(defaultConfigFile).nuve;
try {
  nuveConfig = require(nuveConfigFile);
} catch (e) {
  console.log(e);
}
var dbURL = process.env.DB_URL || nuveConfig.dataBaseURL;
var mongojs = require('mongojs');
var db = mongojs.connect(dbURL, ['services']);

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
  nuveConfig.dataBaseURL = dbURL;
  nuveConfig.superserviceID = superServiceId;
  fs.writeFile(nuveConfigFile, JSON.stringify(nuveConfig, null, '  '), 'utf8', function (err) {
    if (err) return console.log('Error in saving nuve.json:', err);
    console.log(nuveConfigFile, 'configured.');
  });
});