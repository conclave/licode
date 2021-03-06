/*global require, process, setInterval, clearInterval, Buffer, exports, GLOBAL*/
'use strict';

var crypto = require('crypto');
var rpcPublic = require('./rpcPublic');
var Stream = require('./Stream');
var http = require('http');
var server = http.createServer().listen(8080);
var io = require('socket.io').listen(server);
var Permission = require('./permission');
var Getopt = require('node-getopt');

// Configuration default values
GLOBAL.config = {};
GLOBAL.config.erizoController = require('../../../local/etc/erizoController');
GLOBAL.config.rabbit = require('../../../local/etc/common').rabbit;
GLOBAL.config.cloudProvider = require('../../../local/etc/common').cloudProvider;

// Parse command line arguments
var getopt = new Getopt([
  ['r' , 'rabbit-host=ARG'            , 'RabbitMQ Host'],
  ['g' , 'rabbit-port=ARG'            , 'RabbitMQ Port'],
  ['t' , 'stunServerUrl=ARG'          , 'Stun Server URL'],
  ['b' , 'defaultVideoBW=ARG'         , 'Default video Bandwidth'],
  ['M' , 'maxVideoBW=ARG'             , 'Max video bandwidth'],
  ['i' , 'publicIP=ARG'               , 'Erizo Controller\'s public IP'],
  ['H' , 'hostname=ARG'               , 'Erizo Controller\'s hostname'],
  ['p' , 'port'                       , 'Port where Erizo Controller will listen to new connections.'],
  ['S' , 'ssl'                        , 'Erizo Controller\'s hostname'],
  ['T' , 'turn-url'                   , 'Turn server\'s URL.'],
  ['U' , 'turn-username'              , 'Turn server\'s username.'],
  ['P' , 'turn-password'              , 'Turn server\'s password.'],
  ['R' , 'recording_path'             , 'Recording path.'],
  ['h' , 'help'                       , 'display this help']
]);

var PUBLISHER_INITAL = 101, PUBLISHER_READY = 104;


var opt = getopt.parse(process.argv.slice(2));

for (var prop in opt.options) {
    if (opt.options.hasOwnProperty(prop)) {
        var value = opt.options[prop];
        switch (prop) {
            case 'help':
                getopt.showHelp();
                process.exit(0);
                break;
            case 'rabbit-host':
                GLOBAL.config.rabbit = GLOBAL.config.rabbit || {};
                GLOBAL.config.rabbit.host = value;
                break;
            case 'rabbit-port':
                GLOBAL.config.rabbit = GLOBAL.config.rabbit || {};
                GLOBAL.config.rabbit.port = value;
                break;
            default:
                GLOBAL.config.erizoController[prop] = value;
                break;
        }
    }
}

// Load submodules with updated config
var rpc = require('../../common/rpc');
var controller = require('./roomController');

// Logger
var log = require('../../common/logger')('ErizoController');

var nuveKey;

var WARNING_N_ROOMS = GLOBAL.config.erizoController.warning_n_rooms;
var LIMIT_N_ROOMS = GLOBAL.config.erizoController.limit_n_rooms;

var INTERVAL_TIME_KEEPALIVE = GLOBAL.config.erizoController.interval_time_keepAlive;

var BINDED_INTERFACE_NAME = GLOBAL.config.erizoController.networkInterface;

var myId;
var rooms = {};
var myState;

var calculateSignature = function (token, key) {
    var toSign = token.tokenId + ',' + token.host,
        signed = crypto.createHmac('sha1', key).update(toSign).digest('hex');
    return (new Buffer(signed)).toString('base64');
};

var checkSignature = function (token, key) {
    var calculatedSignature = calculateSignature(token, key);
    if (calculatedSignature !== token.signature) {
        log.info('Auth fail. Invalid signature.');
        return false;
    } else {
        return true;
    }
};

/*
 * Sends a message of type 'type' to all sockets in a determined room.
 */
var sendMsgToRoom = function (room, type, arg) {
    var sockets = room.sockets,
        id;
    for (id in sockets) {
        if (sockets.hasOwnProperty(id)) {
            log.info('Sending message to', sockets[id], 'in room ', room.id);
            io.sockets.to(sockets[id]).emit(type, arg);
        }
    }
};

var privateRegexp;
var publicIP;

var addToCloudHandler = function (callback) {
    var privateIP = require('../../common/util').getPrivateIP(BINDED_INTERFACE_NAME);
    privateRegexp = new RegExp(privateIP, 'g');
    publicIP = GLOBAL.config.erizoController.publicIP || privateIP;

    var addECToCloudHandler = function(attempt) {
        if (attempt <= 0) {
            return;
        }

        rpc.callRpc('nuve', 'addNewErizoController', {
            cloudProvider: GLOBAL.config.cloudProvider.name,
            ip: publicIP,
            hostname: GLOBAL.config.erizoController.hostname,
            port: GLOBAL.config.erizoController.port,
            ssl: GLOBAL.config.erizoController.ssl
        }, {
            callback: function (msg) {
                if (msg === 'timeout') {
                    log.info('CloudHandler does not respond');

                    // We'll try it more!
                    setTimeout(function() {
                        attempt = attempt - 1;
                        addECToCloudHandler(attempt);
                    }, 3000);
                    return;
                }
                if (msg == 'error') {
                    log.info('Error in communication with cloudProvider');
                }

                publicIP = msg.publicIP;
                myId = msg.id;
                myState = 2;

                var intervarId = setInterval(function () {

                    rpc.callRpc('nuve', 'keepAlive', myId, {callback: function (result) {
                        if (result === 'whoareyou') {
                            // TODO: It should try to register again in Cloud Handler. But taking into account current rooms, users, ...
                            log.info('I don`t exist in cloudHandler. I`m going to be killed');
                            clearInterval(intervarId);
                            rpc.callRpc('nuve', 'killMe', publicIP, {callback: function () {}});
                        }
                    }});

                }, INTERVAL_TIME_KEEPALIVE);

                rpc.callRpc('nuve', 'getKey', myId, {
                    callback: function (key) {
                        if (key === 'error' || key === 'timeout') {
                            rpc.callRpc('nuve', 'killMe', publicIP, {callback: function () {}});
                            log.warn('Failed to join nuve network.');
                            return process.exit();
                        }
                        nuveKey = key;
                        callback();
                    }
                });
            }
        });
    };
    addECToCloudHandler(5);
};

//*******************************************************************
//       When adding or removing rooms we use an algorithm to check the state
//       If there is a state change we send a message to cloudHandler
//
//       States:
//            0: Not available
//            1: Warning
//            2: Available
//*******************************************************************
var updateMyState = function () {
    var nRooms = 0, newState, i, info;

    for (i in rooms) {
        if (rooms.hasOwnProperty(i)) {
            nRooms += 1;
        }
    }

    if (nRooms < WARNING_N_ROOMS) {
        newState = 2;
    } else if (nRooms > LIMIT_N_ROOMS) {
        newState = 0;
    } else {
        newState = 1;
    }

    if (newState === myState) {
        return;
    }

    myState = newState;

    info = {id: myId, state: myState};
    rpc.callRpc('nuve', 'setInfo', info, {callback: function () {}});
};

var listen = function () {
    io.sockets.on('connection', function (socket) {
        log.info('Socket connect', socket.id);

        // Gets 'token' messages on the socket. Checks the signature and ask nuve if it is valid.
        // Then registers it in the room and callback to the client.
        socket.on('token', function (token, callback) {

            //log.debug("New token", token);

            var tokenDB, user, streamList = [], index;

            if (checkSignature(token, nuveKey)) {

                rpc.callRpc('nuve', 'deleteToken', token.tokenId, {callback: function (resp) {
                    if (resp === 'error') {
                        log.info('Token does not exist');
                        callback('error', 'Token does not exist');
                        socket.disconnect();

                    } else if (resp === 'timeout') {
                        log.warn('Nuve does not respond');
                        callback('error', 'Nuve does not respond');
                        socket.disconnect();

                    } else if (token.host === resp.host) {
                        tokenDB = resp;
                        if (rooms[tokenDB.room] === undefined) {
                            var room = {};

                            room.id = tokenDB.room;
                            room.sockets = [];
                            room.sockets.push(socket.id);
                            room.streams = {}; //streamId: Stream
                            if (tokenDB.p2p) {
                                log.debug('Token of p2p room');
                                room.p2p = true;
                            } else {
                                room.controller = controller({rpc: rpc});
                                room.controller.addEventListener(function(type, event) {
                                    // TODO Send message to room? Handle ErizoJS disconnection.
                                    if (type === 'unpublish') {
                                        var streamId = parseInt(event); // It's supposed to be an integer.
                                        log.info('ErizoJS stopped', streamId);
                                        sendMsgToRoom(room, 'onRemoveStream', {id: streamId});
                                        room.controller.removePublisher(streamId);

                                        var index = socket.streams.indexOf(streamId);
                                        if (index !== -1) {
                                            socket.streams.splice(index, 1);
                                        } // FIXME: is it necessary to traverse io.sockets?

                                        if (room.streams[streamId]) {
                                            delete room.streams[streamId];
                                        }
                                    }

                                });
                            }
                            rooms[tokenDB.room] = room;
                            updateMyState();
                        } else {
                            rooms[tokenDB.room].sockets.push(socket.id);
                        }
                        user = {name: tokenDB.userName, role: tokenDB.role};
                        socket.user = user;
                        var permissions = GLOBAL.config.erizoController.roles[tokenDB.role] || [];
                        socket.user.permissions = {};
                        for (var right in permissions) {
                            socket.user.permissions[right] = permissions[right];
                        }
                        socket.room = rooms[tokenDB.room];
                        socket.streams = []; //[list of streamIds]
                        socket.state = 'sleeping';

                        log.debug('OK, Valid token');

                        if (!tokenDB.p2p && GLOBAL.config.erizoController.report.session_events) {
                            var timeStamp = new Date();
                            rpc.broadcast('event', {room: tokenDB.room, user: socket.id, type: 'user_connection', timestamp:timeStamp.getTime()});
                        }

                        for (index in socket.room.streams) {
                            if (socket.room.streams.hasOwnProperty(index)) {
                                if (socket.room.streams[index].status == PUBLISHER_READY){
                                    streamList.push(socket.room.streams[index].getPublicStream());
                                }
                            }
                        }

                        callback('success', {streams: streamList,
                                            id: socket.room.id,
                                            p2p: socket.room.p2p,
                                            defaultVideoBW: GLOBAL.config.erizoController.defaultVideoBW,
                                            maxVideoBW: GLOBAL.config.erizoController.maxVideoBW,
                                            stunServerUrl: GLOBAL.config.erizoController.stunServerUrl,
                                            turnServer: GLOBAL.config.erizoController.turnServer
                                            });

                    } else {
                        log.warn('Invalid host');
                        callback('error', 'Invalid host');
                        socket.disconnect();
                    }
                }});

            } else {
                log.warn('Authentication error');
                callback('error', 'Authentication error');
                socket.disconnect();
            }
        });

        //Gets 'sendDataStream' messages on the socket in order to write a message in a dataStream.
        socket.on('sendDataStream', function (msg) {
            if  (socket.room.streams[msg.id] === undefined){
              log.warn('Trying to send Data from a non-initialized stream ', msg);
              return;
            }
            var sockets = socket.room.streams[msg.id].getDataSubscribers(), id;
            for (id in sockets) {
                if (sockets.hasOwnProperty(id)) {
                    log.info('Sending dataStream to', sockets[id], 'in stream ', msg.id);
                    io.sockets.to(sockets[id]).emit('onDataStream', msg);
                }
            }
        });

        socket.on('signaling_message', function (msg) {
            if (socket.room.p2p) {
                io.sockets.to(msg.peerSocket).emit('signaling_message_peer', {streamId: msg.streamId, peerSocket: socket.id, msg: msg.msg});
            } else {
                socket.room.controller.processSignaling(msg.streamId, socket.id, msg.msg);
            }
        });

        //Gets 'updateStreamAttributes' messages on the socket in order to update attributes from the stream.
        socket.on('updateStreamAttributes', function (msg) {
            if  (socket.room.streams[msg.id] === undefined){
              log.warn('Trying to update atributes from a non-initialized stream ', msg);
              return;
            }
            var sockets = socket.room.streams[msg.id].getDataSubscribers(), id;
            socket.room.streams[msg.id].setAttributes(msg.attrs);
            for (id in sockets) {
                if (sockets.hasOwnProperty(id)) {
                    log.info('Sending new attributes to', sockets[id], 'in stream ', msg.id);
                    io.sockets.to(sockets[id]).emit('onUpdateAttributeStream', msg);
                }
            }
        });

        // Gets 'publish' messages on the socket in order to add new stream to the room.
        // Returns callback(id, error)
        socket.on('publish', function (options, sdp, callback) {
            var id, st;
            if (socket.user === undefined || !socket.user.permissions[Permission.PUBLISH]) {
                callback(null, 'Unauthorized');
                return;
            }
            if (socket.user.permissions[Permission.PUBLISH] !== true) {
                var permissions = socket.user.permissions[Permission.PUBLISH];
                for (var right in permissions) {
                    if ((options[right] === true) && (permissions[right] === false))
                        return callback(null, 'Unauthorized');
                }
            } 
            id = Math.random() * 1000000000000000000;

            if (options.state === 'url' || options.state === 'recording') {
                var url = sdp;
                if (options.state === 'recording') {
                    var recordingId = sdp;
                    if (GLOBAL.config.erizoController.recording_path) {
                        url = GLOBAL.config.erizoController.recording_path + recordingId + '.mkv';
                    } else {
                        url = '/tmp/' + recordingId + '.mkv';
                    }
                }
                socket.room.controller.addExternalInput(id, url, function (result) {
                    if (result === 'success') {
                        st = new Stream({id: id, socket: socket.id, audio: options.audio, video: options.video, data: options.data, attributes: options.attributes});
                        socket.streams.push(id);
                        socket.room.streams[id] = st;
                        callback(id);
                        sendMsgToRoom(socket.room, 'onAddStream', st.getPublicStream());
                    } else {
                        callback(null, 'Error adding External Input');
                    }
                });
            } else if (options.state === 'erizo') {
                log.info('New publisher');
                
                socket.room.controller.addPublisher(id, options, function (signMess) {

                    if (signMess.type === 'initializing') {
                        callback(id);
                        st = new Stream({id: id, socket: socket.id, audio: options.audio, video: options.video, data: options.data, screen: options.screen, attributes: options.attributes});
                        socket.streams.push(id);
                        socket.room.streams[id] = st;
                        st.status = PUBLISHER_INITAL;

                        if (GLOBAL.config.erizoController.report.session_events) {
                            rpc.broadcast('event', {room: socket.room.id, user: socket.id, name: socket.user.name, type: 'publish', stream: id, timestamp: (new Date()).getTime()});
                        }
                        return;
                    } else if (signMess.type ==='failed'){
                        log.info('IceConnection Failed on publisher, removing ' , id);
                        socket.emit('connection_failed',{});
                        socket.state = 'sleeping';
                        if (!socket.room.p2p) {
                            socket.room.controller.removePublisher(id);
                            if (GLOBAL.config.erizoController.report.session_events) {
                                rpc.broadcast('event', {room: socket.room.id, user: socket.id, type: 'failed', stream: id, sdp: signMess.sdp, timestamp: (new Date()).getTime()});
                            }
                        }

                        var index = socket.streams.indexOf(id);
                        if (index !== -1) {
                            socket.streams.splice(index, 1);
                        }
                        return;
                    } else if (signMess.type === 'ready') {
                        st.status = PUBLISHER_READY;
                        sendMsgToRoom(socket.room, 'onAddStream', st.getPublicStream());
                    } else if (signMess === 'timeout') {
                        callback(undefined, 'No ErizoAgents available');
                    }

                    socket.emit('signaling_message_erizo', {mess: signMess, streamId: id});
                });
            } else {
                st = new Stream({id: id, socket: socket.id, audio: options.audio, video: options.video, data: options.data, screen: options.screen, attributes: options.attributes});
                socket.streams.push(id);
                socket.room.streams[id] = st;
                st.status = PUBLISHER_READY;
                callback(id);
                sendMsgToRoom(socket.room, 'onAddStream', st.getPublicStream());
            }
        });

        //Gets 'subscribe' messages on the socket in order to add new subscriber to a determined stream (options.streamId).
        // Returns callback(result, error)
        socket.on('subscribe', function (options, sdp, callback) {
            //log.info("Subscribing", options, callback);
            if (socket.user === undefined || !socket.user.permissions[Permission.SUBSCRIBE]) {
                callback(null, 'Unauthorized');
                return;
            }

            if (socket.user.permissions[Permission.SUBSCRIBE] !== true) {
                var permissions = socket.user.permissions[Permission.SUBSCRIBE];
                for (var right in permissions) {
                    if ((options[right] === true) && (permissions[right] === false))
                        return callback(null, 'Unauthorized');
                }
            }

            var stream = socket.room.streams[options.streamId];

            if (stream === undefined) {
                return;
            }

            if (stream.hasData() && options.data !== false) {
                stream.addDataSubscriber(socket.id);
            }

            if (stream.hasAudio() || stream.hasVideo() || stream.hasScreen()) {

                if (socket.room.p2p) {
                    var s = stream.getSocket();
                    io.sockets.to(s).emit('publish_me', {streamId: options.streamId, peerSocket: socket.id});

                } else {
                    socket.room.controller.addSubscriber(socket.id, options.streamId, options, function (signMess) {

                        if (signMess.type === 'initializing') {
                            log.info('Initializing subscriber');
                            callback(true);

                            if (GLOBAL.config.erizoController.report.session_events) {
                                var timeStamp = new Date();
                                rpc.broadcast('event', {room: socket.room.id, user: socket.id, name: socket.user.name, type: 'subscribe', stream: options.streamId, timestamp: timeStamp.getTime()});
                            }
                            return;
                        }
                        if(signMess.type==='bandwidthAlert'){
                          socket.emit('onBandwidthAlert', {streamID:options.streamId, message:signMess.message, bandwidth: signMess.bandwidth});
                        }

                        // if (signMess.type === 'candidate') {
                        //     signMess.candidate = signMess.candidate.replace(privateRegexp, publicIP);
                        // }
                        socket.emit('signaling_message_erizo', {mess: signMess, peerId: options.streamId});
                    });

                    log.info('Subscriber added');
                }
            } else {
                callback(true);
            }

        });

        // Gets 'startRecorder' messages
        // Returns callback(id, error)
        socket.on('startRecorder', function (options, callback) {
            if (socket.user === undefined || !socket.user.permissions[Permission.RECORD]) {
                callback(null, 'Unauthorized');
                return;
            }
            var streamId = options.to;
            var recordingId = Math.random() * 1000000000000000000;
            var url;

            if (GLOBAL.config.erizoController.recording_path) {
                url = GLOBAL.config.erizoController.recording_path + recordingId + '.mkv';
            } else {
                url = '/tmp/' + recordingId + '.mkv';
            }

            log.info('Starting recorder streamID ' + streamId + 'url ', url);

            if (socket.room.streams[streamId].hasAudio() || socket.room.streams[streamId].hasVideo() || socket.room.streams[streamId].hasScreen()) {
                socket.room.controller.addExternalOutput(streamId, url, function (result) {
                    if (result === 'success') {
                        log.info('Recorder Started');
                        callback(recordingId);
                    } else {
                        callback(null, 'This stream is not published in this room');
                    }
                });

            } else {
                callback(null, 'Stream can not be recorded');
            }
        });
        
        // Gets 'stopRecorder' messages
        // Returns callback(result, error)
        socket.on('stopRecorder', function (options, callback) {
            if (socket.user === undefined || !socket.user.permissions[Permission.RECORD]) {
                if (callback) callback(null, 'Unauthorized');
                return;
            }
            var recordingId = options.id;
            var url;

            if (GLOBAL.config.erizoController.recording_path) {
                url = GLOBAL.config.erizoController.recording_path + recordingId + '.mkv';
            } else {
                url = '/tmp/' + recordingId + '.mkv';
            }

            log.info('Stoping recording  ' + recordingId + ' url ' + url);
            socket.room.controller.removeExternalOutput(url, callback);
        });

        //Gets 'unpublish' messages on the socket in order to remove a stream from the room.
        // Returns callback(result, error)
        socket.on('unpublish', function (streamId, callback) {
            if (socket.user === undefined || !socket.user.permissions[Permission.PUBLISH]) {
                if (callback) callback(null, 'Unauthorized');
                return;
            }

            // Stream has been already deleted or it does not exist
            if (socket.room.streams[streamId] === undefined) {
                return;
            }
            sendMsgToRoom(socket.room, 'onRemoveStream', {id: streamId});

            if (socket.room.streams[streamId].hasAudio() || socket.room.streams[streamId].hasVideo() || socket.room.streams[streamId].hasScreen()) {
                socket.state = 'sleeping';
                if (!socket.room.p2p) {
                    socket.room.controller.removePublisher(streamId);
                    if (GLOBAL.config.erizoController.report.session_events) {
                        var timeStamp = new Date();
                        rpc.broadcast('event', {room: socket.room.id, user: socket.id, type: 'unpublish', stream: streamId, timestamp: timeStamp.getTime()});
                    }
                }
            }

            var index = socket.streams.indexOf(streamId);
            if (index !== -1) {
                socket.streams.splice(index, 1);
            }
            if (socket.room.streams[streamId]) {
                delete socket.room.streams[streamId];
            }
            callback(true);
        });

        //Gets 'unsubscribe' messages on the socket in order to remove a subscriber from a determined stream (to).
        // Returns callback(result, error)
        socket.on('unsubscribe', function (to, callback) {
            if (!socket.user.permissions[Permission.SUBSCRIBE]) {
                if (callback) callback(null, 'unauthorized');
                return;
            }
            if (socket.room.streams[to] === undefined) {
                return;
            }

            socket.room.streams[to].removeDataSubscriber(socket.id);

            if (socket.room.streams[to].hasAudio() || socket.room.streams[to].hasVideo() || socket.room.streams[to].hasScreen()) {
                if (!socket.room.p2p) {
                    socket.room.controller.removeSubscriber(socket.id, to);
                    if (GLOBAL.config.erizoController.report.session_events) {
                        var timeStamp = new Date();
                        rpc.broadcast('event', {room: socket.room.id, user: socket.id, type: 'unsubscribe', stream: to, timestamp:timeStamp.getTime()});
                    }
                }
            }
            callback(true);
        });

        //When a client leaves the room erizoController removes its streams from the room if exists.
        socket.on('disconnect', function () {
            var i, index, id;

            log.info('Socket disconnect ', socket.id);

            for (i in socket.streams) {
                if (socket.streams.hasOwnProperty(i)) {
                    sendMsgToRoom(socket.room, 'onRemoveStream', {id: socket.streams[i]});
                }
            }

            if (socket.room !== undefined) {

                for (i in socket.room.streams) {
                    if (socket.room.streams.hasOwnProperty(i)) {
                        socket.room.streams[i].removeDataSubscriber(socket.id);
                    }
                }

                index = socket.room.sockets.indexOf(socket.id);
                if (index !== -1) {
                    socket.room.sockets.splice(index, 1);
                }

                if (socket.room.controller) {
                    socket.room.controller.removeSubscriptions(socket.id);
                }

                for (i in socket.streams) {
                    if (socket.streams.hasOwnProperty(i)) {
                        id = socket.streams[i];
                        if( socket.room.streams[id]) {
                            if (socket.room.streams[id].hasAudio() || socket.room.streams[id].hasVideo() || socket.room.streams[id].hasScreen()) {
                                if (!socket.room.p2p) {
                                    socket.room.controller.removePublisher(id);
                                    if (GLOBAL.config.erizoController.report.session_events) {
                                        var timeStamp = new Date();
                                        rpc.broadcast('event', {room: socket.room.id, user: socket.id, type: 'unpublish', stream: id, timestamp: timeStamp.getTime()});
                                    }
                                }
                            }
                            delete socket.room.streams[id];
                        }
                    }
                }
            }

            if (socket.room !== undefined && !socket.room.p2p && GLOBAL.config.erizoController.report.session_events) {
                rpc.broadcast('event', {room: socket.room.id, user: socket.id, type: 'user_disconnection', timestamp: (new Date()).getTime()});
            }

            if (socket.room !== undefined && socket.room.sockets.length === 0) {
                log.info('Empty room ', socket.room.id, '. Deleting it');
                delete rooms[socket.room.id];
                updateMyState();
            }
        });
    });
};


/*
 *Gets a list of users in a determined room.
 */
exports.getUsersInRoom = function (room, callback) {
    var users = [], sockets, id;
    if (rooms[room] === undefined) {
        callback(users);
        return;
    }

    sockets = rooms[room].sockets;

    for (id in sockets) {
        if (sockets.hasOwnProperty(id)) {
            users.push(io.sockets.to(sockets[id]).user);
        } // FIXME: socket.user
    }

    callback(users);
};

/*
 *Gets a list of users in a determined room.
 */
exports.deleteUser = function (user, room, callback) {
     if (rooms[room] === undefined) {
         callback('Success');
         return;
     }

    var sockets = rooms[room].sockets;
    var sockets_to_delete = [];

    for (var id in sockets) {
        if (sockets.hasOwnProperty(id)) {
            if (io.sockets.to(sockets[id]).user.name === user) {
                sockets_to_delete.push(sockets[id]);
            } // FIXME: socket.user
        }
    }

    for (var s in sockets_to_delete) {
        log.info('Deleted user', io.sockets.to(sockets_to_delete[s]).user.name);
        io.sockets.to(sockets_to_delete[s]).disconnect();
    }

    if (sockets_to_delete.length !== 0) {
        callback('Success');
        return;
    }
    else {
        log.error('User', user, 'does not exist');
        callback('User does not exist', 404);
        return;
    }
};


/*
 * Delete a determined room.
 */
exports.deleteRoom = function (room, callback) {
    log.info('Deleting room ', room);

    if (rooms[room] === undefined) {
        callback('Success');
        return;
    }
    var sockets = rooms[room].sockets;

    for (var id in sockets) {
        if (sockets.hasOwnProperty(id)) {
            rooms[room].roomController.removeSubscriptions(sockets[id]);
        }
    }

    var streams = rooms[room].streams;

    for (var j in streams) {
        if (streams[j].hasAudio() || streams[j].hasVideo() || streams[j].hasScreen()) {
            if (!room.p2p) {
                rooms[room].roomController.removePublisher(j);
            }
        }
    }

    delete rooms[room];
    updateMyState();
    log.info('Deleted room ', room, rooms);
    callback('Success');
};

rpc.connect(function () {
    try {
        addToCloudHandler(function () {
            var rpcID = 'erizoController_' + myId;
            rpc.bind(rpcID, rpcPublic, listen);
        });
    } catch (error) {
        log.info('Error in Erizo Controller: ', error);
    }
});

['SIGINT', 'SIGTERM'].map(function (sig) {
    process.on(sig, function () {
        log.warn('Exiting on', sig);
        process.exit();
    });
});
