/* global require, module, Buffer */
'use strict';

(function () {
  var crypto = require('crypto');
  var http = require('http');
  var https = require('https');
  var URL = require('url');
  var hmacMethod = 'sha1';

  function calculateSignature (toSign, key) {
    return (new Buffer(crypto.createHmac(hmacMethod, key).update(toSign).digest('hex'))).toString('base64');
  }

  function formatString (s) {
    return (new Buffer(s, 'utf8')).toString('base64');
  }

  function NuveClient (spec) {
    var dest = URL.parse(spec.url);
    var request;
    var params = {
      service: spec.service,
      key: spec.key,
      host: dest.hostname,
      port: dest.port,
      protocol: dest.protocol
    };

    switch (params.protocol) {
      case undefined:
      case '':
      case 'http:':
        request = http.request;
        break;
      case 'https:':
        request = https.request;
        break;
      default:
        throw 'Protocol not supported.';
    }

    this.send = function send (callback, callbackError, method, body, url, username, role) {
      var timestamp = new Date().getTime();
      var cnounce = Math.floor(Math.random() * 99999);
      var toSign = timestamp + ',' + cnounce;
      var header = 'MAuth realm=http://marte3.dit.upm.es,mauth_signature_method=HMAC_SHA1';

      if (username && role) {
        username = formatString(username);
        header += ',mauth_username=';
        header +=  username;
        header += ',mauth_role=';
        header +=  role;
        toSign += ',' + username + ',' + role;
      }

      header += ',mauth_serviceid=';
      header +=  params.service;
      header += ',mauth_cnonce=';
      header += cnounce;
      header += ',mauth_timestamp=';
      header +=  timestamp;
      header += ',mauth_signature=';
      header +=  calculateSignature(toSign, params.key);

      var opt = {
        host: params.host,
        port: params.port,
        path: url,
        method: method,
        headers: {
          'Host': params.host,
          'Connection': 'keep-alive',
          'Origin': params.host,
          'User-Agent': 'Node.js',
          'Authorization': header,
          'Accept': '*/*'
        }
      };

      if (body) {
        if (typeof body === 'object') {
          body = JSON.stringify(body);
        }
        opt.headers['Content-type'] = 'application/json';
        opt.headers['Content-Length'] = Buffer.byteLength(body);
      }

      var req = request(opt, function (response) {
        response.setEncoding('utf8');
        var data = '';
        response.on('data', function (chunk) {
          data += chunk;
        });
        response.on('end', function() {
          switch (response.statusCode) {
            case 100:
            case 200:
            case 201:
            case 202:
            case 203:
            case 204:
            case 205:
                callback(data);
                break;
            default:
              if (typeof callbackError === 'function') {
                callbackError(response.statusCode, data);
              }
              return;
          }
        });
      });
      if (body) {
        req.write(body);
      }
      req.end();
    };
  }

  NuveClient.prototype.createRoom = function createRoom (room, callback, callbackError) {
    this.send(callback, callbackError, 'POST', {name: room.name, options: room.options || {}}, '/rooms');
  };

  NuveClient.prototype.getRooms = function getRooms (callback, callbackError) {
    this.send(callback, callbackError, 'GET', undefined, '/rooms');
  };

  NuveClient.prototype.getRoom = function getRoom (room, callback, callbackError) {
    this.send(callback, callbackError, 'GET', undefined, '/rooms/' + room);
  };

  NuveClient.prototype.deleteRoom = function deleteRoom (room, callback, callbackError) {
    this.send(callback, callbackError, 'DELETE', undefined, '/rooms/' + room);
  };

  NuveClient.prototype.createToken = function createToken (room, username, role, callback, callbackError) {
    this.send(callback, callbackError, 'POST', undefined, '/rooms/' + room + '/tokens', username, role);
  };

  NuveClient.prototype.createService = function createService (name, key, callback, callbackError) {
    this.send(callback, callbackError, 'POST', {name: name, key: key}, '/services/');
  };

  NuveClient.prototype.getServices = function getServices (callback, callbackError) {
    this.send(callback, callbackError, 'GET', undefined, '/services/');
  };

  NuveClient.prototype.getService = function getService (service, callback, callbackError) {
    this.send(callback, callbackError, 'GET', undefined, '/services/' + service);
  };

  NuveClient.prototype.deleteService = function deleteService (service, callback, callbackError) {
    this.send(callback, callbackError, 'DELETE', undefined, '/services/' + service);
  };

  NuveClient.prototype.getUsers = function getUsers (room, callback, callbackError) {
    this.send(callback, callbackError, 'GET', undefined, '/rooms/' + room + '/users/');
  };

  NuveClient.prototype.getUser = function getUser (room, user, callback, callbackError) {
    this.send(callback, callbackError, 'GET', undefined, '/rooms/' + room + '/users/' + user);
  };

  NuveClient.prototype.deleteUser = function deleteUser (room, user, callback, callbackError) {
    this.send(callback, callbackError, 'DELETE', undefined, '/rooms/' + room + '/users/' + user);
  };

  NuveClient.create = function create (spec) {
    return new NuveClient(spec);
  };

  module.exports = NuveClient;
}());
