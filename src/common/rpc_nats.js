/*global require, module*/
'use strict';

(function () {
  var TIMEOUT = 5000;
  var log = require('./logger')('RPC-NATS');
  module.exports = function Endpoint (spec) {
    var url = (typeof spec === 'object')? 'nats://' + spec.host + ':' + spec.port : undefined;
    var nats = require('nats').connect(url);
    this.connect = function connect (cb) {
      if (typeof cb === 'function') cb();
    };
    this.callRpc = function callRpc (to, method, args, callbacks) {
      var timeout = setTimeout(function callbackError () {
        log.info('callRpc timeout:', to, method);
        for (var i in callbacks) {
          callbacks[i]('timeout');
        }
      }, TIMEOUT);
      nats.request(to, JSON.stringify({
        method: method,
        args: args
      }), function (result) {
        clearTimeout(timeout);
        var message = JSON.parse(result);
        var type = message.type;
        if (type === 'onReady') callbacks[type].call({});
        else callbacks[type].call({}, message.data);
      });
    };
    this.bind = function bind (id, rpcPublic, callback) {
      nats.subscribe(id, function (request, replyTo) {
        var message = JSON.parse(request);
        var method = message.method;
        var args = message.args || [];
        if (!(args instanceof Array)) {
          args = [args];
        }
        args.push(function (type, result) {
          nats.publish(replyTo, JSON.stringify({type:type, data:result}));
        });
        if (typeof rpcPublic[method] === 'function') {
          rpcPublic[method].apply(rpcPublic, args);
        } else {
          log.warn('Unsupported method call [', method, '] from', replyTo);
        }
      });
      if (typeof callback === 'function') callback();
    };
    this.broadcast = function broadcast (topic, message) {
      if (typeof message === 'object') message = JSON.stringify(message);
      nats.publish(topic, message);
    };
  };
}());
