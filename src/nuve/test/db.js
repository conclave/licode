'use strict';

var nuveConfig = require('../../../local/etc/nuve');
var dbURL = process.env.DB_URL || nuveConfig.dataBaseURL || 'localhost/nuvedb';
var mongojs = require('mongojs');
module.exports = mongojs.connect(dbURL, ['services']);
