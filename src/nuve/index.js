/*global require, exports*/
'use strict';

var express = require('express');
var bodyParser = require('body-parser');

var rpc = require('../common/rpc');
rpc.connect(function () {
    rpc.bind('nuve', require('./rpcPublic'), function () {
      exports.rpc = rpc;
    });
});

var nuveAuthenticator = require('./auth/nuveAuthenticator');
var roomsResource = require('./resource/roomsResource');
var tokensResource = require('./resource/tokensResource');
var servicesResource = require('./resource/servicesResource');
var usersResource = require('./resource/usersResource');

var app = express();
// app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('view options', {
    layout: false
});

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE');
    res.header('Access-Control-Allow-Headers', 'origin, authorization, content-type');
    next();
});

app.options('*', function(req, res) {
    res.send(200);
});

app.get('*', nuveAuthenticator.authenticate);
app.post('*', nuveAuthenticator.authenticate);
app.delete('*', nuveAuthenticator.authenticate);
app.put('*', nuveAuthenticator.authenticate);

app.post('/rooms', roomsResource.createRoom);
app.get('/rooms', roomsResource.getList);
app.get('/rooms/:room', roomsResource.represent);
app.delete('/rooms/:room', roomsResource.deleteRoom);

app.post('/services', servicesResource.create);
app.get('/services', servicesResource.getList);
app.get('/services/:service', servicesResource.represent);
app.delete('/services/:service', servicesResource.deleteService);

app.post('/rooms/:room/tokens', tokensResource.create);
app.get('/rooms/:room/users', usersResource.getList);
app.get('/rooms/:room/users/:user', usersResource.getUser);
app.delete('/rooms/:room/users/:user', usersResource.deleteUser);

app.listen(3000);
