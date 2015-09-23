#ifndef WEBRTCCONNECTION_H
#define WEBRTCCONNECTION_H

#include "CrossCallback.h"
#include <node.h>
#include <node_object_wrap.h>
#include <uv.h>
#include <WebRtcConnection.h>

/*
 * Wrapper class of erizo::WebRtcConnection
 *
 * A WebRTC Connection. This class represents a WebRtcConnection that can be established with other peers via a SDP negotiation
 * it comprises all the necessary ICE and SRTP components.
 */
class WebRtcConnection : public node::ObjectWrap, NodeAsyncCallback {
  public:
  static void Init(v8::Handle<v8::Object> exports);
  erizo::WebRtcConnection* me;

  private:
  WebRtcConnection();
  ~WebRtcConnection();
  static v8::Persistent<v8::Function> constructor;

  /*
   * Constructor.
   * Constructs an empty WebRtcConnection without any configuration.
   */
  static void New(const v8::FunctionCallbackInfo<v8::Value>& args);
  /*
   * Closes the webRTC connection.
   * The object cannot be used after this call.
   */
  static void close(const v8::FunctionCallbackInfo<v8::Value>& args);

  /*
   * Sets the SDP of the remote peer.
   * Param: the SDP.
   * Returns true if the SDP was received correctly.
   */
  static void setRemoteSdp(const v8::FunctionCallbackInfo<v8::Value>& args);
  /**
     * Add new remote candidate (from remote peer).
     * @param sdp The candidate in SDP format.
     * @return true if the SDP was received correctly.
     */
  static void addRemoteCandidate(const v8::FunctionCallbackInfo<v8::Value>& args);
  /*
   * Obtains the local SDP.
   * Returns the SDP as a string.
   */
  static void getLocalSdp(const v8::FunctionCallbackInfo<v8::Value>& args);
  /*
   * Sets a MediaReceiver that is going to receive Audio Data
   * Param: the MediaReceiver to send audio to.
   */
  static void setAudioReceiver(const v8::FunctionCallbackInfo<v8::Value>& args);
  /*
   * Sets a MediaReceiver that is going to receive Video Data
   * Param: the MediaReceiver
   */
  static void setVideoReceiver(const v8::FunctionCallbackInfo<v8::Value>& args);
  /*
   * Gets the current state of the Ice Connection
   * Returns the state.
   */
  static void getCurrentState(const v8::FunctionCallbackInfo<v8::Value>& args);
  /*
   * Request a PLI packet from this WRTCConn
   */
  static void generatePLIPacket(const v8::FunctionCallbackInfo<v8::Value>& args);

  static void setFeedbackReports(const v8::FunctionCallbackInfo<v8::Value>& args);

  static void getStats(const v8::FunctionCallbackInfo<v8::Value>& args);
  static void addEventListener(const v8::FunctionCallbackInfo<v8::Value>& args);
  static void removeEventListener(const v8::FunctionCallbackInfo<v8::Value>& args);
  static void clearEventListener(const v8::FunctionCallbackInfo<v8::Value>& args);
};

#endif
