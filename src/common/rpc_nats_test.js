#!/usr/bin/env node

'use strict';

var RPC = require('./rpc_nats');
var rpc = new RPC();

var apis = {
  one: function (callback) {
    callback('callback', 1);
  },
  ping: function (callback) {
    callback('callback', {data:'pong\n\np'});
  },
  ok: function (callback) {
    callback('callback', '{ok}');
  },
  sdp: function (callback) {
    callback('callback', {type:'answer',sdp:'v=0\no=- 0 0 IN IP4 127.0.0.1\ns=LicodeMCU\nt=0 0\na=group:BUNDLE audio video\na=msid-semantic: WMS pkGaZib8Zw\nm=audio 1 RTP/SAVPF 0 126\nc=IN IP4 0.0.0.0\na=rtcp:1 IN IP4 0.0.0.0\na=candidate:1 1 udp 2013266431 10.239.158.60 44823 typ host generation 0\na=ice-ufrag:p0Ee\na=ice-pwd:XTehWi48jZtPBT3X/fhtD1\na=fingerprint:sha-256 CB:7F:01:27:6A:78:52:F5:44:E4:8E:5C:DD:42:EA:86:82:BA:F0:AF:E6:5C:DA:5D:D6:54:29:4D:4C:F8:8F:00\na=sendrecv\na=mid:audio\na=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\na=rtcp-mux\na=rtpmap:0 PCMU/8000\na=rtpmap:126 telephone-event/8000\na=maxptime:60\na=ssrc:44444 cname:o/i14u9pJrxRKAsu\na=ssrc:44444 msid:pkGaZib8Zw a0\na=ssrc:44444 mslabel:pkGaZib8Zw\na=ssrc:44444 label:pkGaZib8Zwa0\nm=video 1 RTP/SAVPF 100 116 117\nc=IN IP4 0.0.0.0\na=rtcp:1 IN IP4 0.0.0.0\na=candidate:1 1 udp 2013266431 10.239.158.60 44823 typ host generation 0\na=ice-ufrag:p0Ee\na=ice-pwd:XTehWi48jZtPBT3X/fhtD1\na=extmap:2 urn:ietf:params:rtp-hdrext:toffset\na=extmap:3 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\na=fingerprint:sha-256 CB:7F:01:27:6A:78:52:F5:44:E4:8E:5C:DD:42:EA:86:82:BA:F0:AF:E6:5C:DA:5D:D6:54:29:4D:4C:F8:8F:00\na=sendrecv\na=mid:video\na=rtcp-mux\na=rtpmap:100 VP8/90000\na=rtcp-fb:100 ccm fir\r\na=rtcp-fb:100 nack\r\na=rtcp-fb:100 nack pli\r\na=rtcp-fb:100 goog-remb\r\na=rtpmap:116 red/90000\na=rtpmap:117 ulpfec/90000\na=ssrc:55543 cname:o/i14u9pJrxRKAsu\na=ssrc:55543 msid:pkGaZib8Zw v0\na=ssrc:55543 mslabel:pkGaZib8Zw\na=ssrc:55543 label:pkGaZib8Zwv0\na=ssrc:55555 cname:o/i14u9pJrxRKAsu\na=ssrc:55555 msid:pkGaZib8Zw v0\na=ssrc:55555 mslabel:pkGaZib8Zw\na=ssrc:55555 label:pkGaZib8Zwv0\n'});
  }
};

rpc.bind('dictator', apis, function (){
  var rpc2 = new RPC();
  setInterval(function () {
    rpc2.callRpc('dictator', 'sdp', null, {
      callback: function (result) {
        console.log(result);
      }
    });
  }, 1000);
});
