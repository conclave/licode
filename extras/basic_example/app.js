/* global require, __dirname, console */
'use strict';

var express = require('express'),
    bodyParser = require('body-parser'),
    errorhandler = require('errorhandler'),
    morgan = require('morgan'),
    fs = require('fs'),
    https = require('https');


var nuve = require('../../src/client/nuve/nodejs').create({
    service: '__auto_generated_service_id__',
    key: '__auto_generated_service_key__',
    url: 'http://localhost:3000/'
});

var myRoomId;

nuve.getRooms(function(roomlist) {
    var rooms = JSON.parse(roomlist);
    console.log(rooms.length); //check and see if one of these rooms is 'basicExampleRoom'
    for (var room in rooms) {
        if (rooms[room].name === 'basicExampleRoom'){
            myRoomId = rooms[room]._id;
            break;
        }
    }
    if (!myRoomId) {
        nuve.createRoom({name: 'basicExampleRoom'}, function(roomID) {
            myRoomId = roomID._id;
            console.log('Created room ', myRoomId);
        });
    } else {
        console.log('Using room', myRoomId);
    }
});

var app = express();

// app.configure ya no existe
app.use(errorhandler({
    dumpExceptions: true,
    showStack: true
}));
app.use(morgan('dev'));
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE');
    res.header('Access-Control-Allow-Headers', 'origin, content-type');
    if (req.method == 'OPTIONS') {
        res.send(200);
    } else {
        next();
    }
});

app.get('/getRooms/', function(req, res) {
    nuve.getRooms(function(rooms) {
        res.send(rooms);
    });
});

app.get('/getUsers/:room', function(req, res) {
    var room = req.params.room;
    nuve.getUsers(room, function(users) {
        res.send(users);
    });
});


app.post('/createToken/', function(req, res) {
    var room = myRoomId,
        username = req.body.username,
        role = req.body.role;
    nuve.createToken(room, username, role, function(token) {
        console.log(token);
        res.send(token);
    });
});


app.listen(3001);
https.createServer({
    key: fs.readFileSync('cert/key.pem').toString(),
    cert: fs.readFileSync('cert/cert.pem').toString()
}, app).listen(3004);
