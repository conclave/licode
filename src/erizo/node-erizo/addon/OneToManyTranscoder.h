#ifndef ONETOMANYTRANSCODER_H
#define ONETOMANYTRANSCODER_H

#include <node.h>
#include <media/OneToManyTranscoder.h>
#include "MediaDefinitions.h"


/*
 * Wrapper class of erizo::OneToManyTranscoder
 *
 * Represents a OneToMany connection.
 * Receives media from one publisher and retransmits it to every subscriber.
 */
class OneToManyTranscoder : public MediaSink {
 public:
  static void Init(v8::Handle<v8::Object> exports);
  erizo::OneToManyTranscoder* me;

 private:
  OneToManyTranscoder();
  ~OneToManyTranscoder();
  static v8::Persistent<v8::Function> constructor;

  /*
   * Constructor.
   * Constructs a OneToManyTranscoder
   */
  static void New(const v8::FunctionCallbackInfo<v8::Value>& args);
  /*
   * Closes the OneToManyTranscoder.
   * The object cannot be used after this call
   */
  static void close(const v8::FunctionCallbackInfo<v8::Value>& args);
  /*
   * Sets the Publisher
   * Param: the WebRtcConnection of the Publisher
   */
  static void setPublisher(const v8::FunctionCallbackInfo<v8::Value>& args);
   /*
   * Returns true if OneToManyTranscoder has a publisher
   */
  static void hasPublisher(const v8::FunctionCallbackInfo<v8::Value>& args);
  /*
   * Sets the subscriber
   * Param1: the WebRtcConnection of the subscriber
   * Param2: an unique Id for the subscriber
   */
  static void addSubscriber(const v8::FunctionCallbackInfo<v8::Value>& args);
  /*
   * Removes a subscriber given its peer id
   * Param: the peerId
   */
  static void removeSubscriber(const v8::FunctionCallbackInfo<v8::Value>& args);
};

#endif
