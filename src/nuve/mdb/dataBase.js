/*global require, exports*/
'use strict';
var config = require('../../../local/etc/nuve');

var databaseUrl = config.dataBaseURL;

/*
 * Data base collections and its fields are:
 * 
 * room {name: '', [p2p: bool], [data: {}], _id: ObjectId}
 *
 * service {name: '', key: '', rooms: Array[room], testRoom: room, testToken: token, _id: ObjectId}
 *
 * token {host: '', userName: '', room: '', role: '', service: '', creationDate: Date(), [use: int], [p2p: bool], _id: ObjectId}
 *
 */
var collections = ['rooms', 'tokens', 'services'];
exports.db = require('mongojs').connect(databaseUrl, collections);

// Superservice ID
exports.superService = config.superserviceID;
// token key
exports.nuveKey = require('crypto').randomBytes(64).toString('hex');
