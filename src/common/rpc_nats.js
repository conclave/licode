/*global require, module*/
'use strict';

(function () {
  var TIMEOUT = 5000;
  module.exports = function Endpoint (spec) {
    var url = 'nats://' + spec.host + ':' + spec.port;
    var nats = require('nats').connect(url);
    this.connect = function connect (cb) {
      if (typeof cb === 'function') cb();
    };
    this.callRpc = function callRpc (to, method, args, callbacks) {
      var timeout = setTimeout(function callbackError () {
        for (var i in callbacks) {
          callbacks[i]('timeout');
        }
      }, TIMEOUT);
      nats.request(to, JSON.stringify({
        method: method,
        args: args
      }), function (type, message) {
        clearTimeout(timeout);
        if (type === 'onReady') callbacks[type].call({});
        else callbacks[type].call({}, message);
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
          nats.publish(replyTo, type, result);
        });
        if (typeof rpcPublic[method] === 'function') {
          rpcPublic[method].apply(rpcPublic, args);
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
