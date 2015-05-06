/* global module, require */
'use strict';

(function () {
  var crypto = require('crypto');
  var nsq = require('nsqjs');
  var log = require('./logger')('RPC-NSQ');

  var TIMEOUT = 5000;
  var REMOVAL_TIMEOUT = 30000;

  function Endpoint (spec) {
    var host = spec.host;
    var port = spec.port;
    var self = this;
    var id = crypto.randomBytes(12).toString('hex');
    var channel = 'channel_' + id;
    var addr = {
      nsqdTCPAddresses: host + ':' + port
    };
    var map = {};
    var corrId = 0;
    self.w = new nsq.Writer(host, port);
    self.r = new nsq.Reader(id, channel, addr);
    self.r.connect();
    self.r.on('message', function cb (msg) {
      var payload = msg.json();
      log.info('callRpc', payload.corrId, 'done.');
      clearTimeout(map[payload.corrId].timeout);
      if (typeof map[payload.corrId].fn[payload.type] === 'function') {
        map[payload.corrId].fn[payload.type].call({}, payload.data);
      } else {
        log.warn('A mess corrId [', payload.corrId, '] received.');
      }
      setTimeout(function() {
        if (map[payload.corrId] !== undefined) delete map[payload.corrId];
      }, REMOVAL_TIMEOUT);
    });
    self.connect = function (cb) {
      self.w.connect();
      self.w.on('ready', function () {
        log.info(id, 'is open.');
        if (typeof cb === 'function') cb();
      });
    };
    self.bind = function (topic, rpcPublic, cb) {
      self.r2 = new nsq.Reader(topic, channel+1, addr);
      self.r2.connect();
      log.info('bind to', topic);
      self.r2.on('message', function (msg) {
        var payload = msg.json();
        var method = payload.method;
        var args = payload.args || [];
        if (!(args instanceof Array)) {
          args = [args];
        }
        args.push(function(type, result) {
          log.info('Executed callRpc:', payload.from, payload.corrId, method, type);
          self.w.publish(payload.from, {data: result, corrId: payload.corrId, type: type}, function (err) {
            if (err) log.error(err);
          });
        });
        if (typeof rpcPublic[method] === 'function') {
          rpcPublic[method].apply(rpcPublic, args);
        } else {
          log.warn('Unsupported method call [', method, '] from', payload.from);
        }
        msg.finish();
      });
      if (typeof cb === 'function') cb();
    };
    self.callRpc = function (to, method, args, callbacks) {
      corrId ++;
      map[corrId] = {};
      map[corrId].fn = callbacks;
      map[corrId].timeout = setTimeout(function callbackError (corrId) {
        log.warn('corrId [',corrId, '] timeout');
        for (var i in map[corrId].fn) {
          map[corrId].fn[i]('timeout');
        }
        delete map[corrId];
      }, TIMEOUT, corrId);
      log.info('callRpc:', corrId, to, method);
      this.w.publish(to, {
        from: id,
        corrId: corrId,
        method: method,
        args: args
      }, function (err) {
        if (err) {
          clearTimeout(map[corrId].timeout);
          delete map[corrId];
          log.error('callRpc:', corrId, to, method, err);
          for (var i in callbacks) {
            callbacks[i]('error');
          }
          return;
        }
      });
    };
  }

  Endpoint.prototype.broadcast = function (topic, message) {
    this.w.publish(topic, message);
  };

  Endpoint.prototype.onClose = function (cb) {
    this.w.on('closed', cb);
  };

  Endpoint.prototype.close = function () {
    this.w.close();
    this.r.close();
    if (this.r2) this.r2.close();
  };

  module.exports = Endpoint;
}());