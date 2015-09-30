#ifndef ONETOMANYPROCESSOR_H
#define ONETOMANYPROCESSOR_H

#include <node.h>
#include <OneToManyProcessor.h>
#include "MediaDefinitions.h"

/*
 * Wrapper class of erizo::OneToManyProcessor
 *
 * Represents a OneToMany connection.
 * Receives media from one publisher and retransmits it to every subscriber.
 */
class OneToManyProcessor : public MediaSink {
  public:
  static void Init(v8::Local<v8::Object> target);
  erizo::OneToManyProcessor* me;

  private:
  OneToManyProcessor();
  ~OneToManyProcessor();
  static v8::Persistent<v8::Function> constructor;

  /*
   * Constructor.
   * Constructs a OneToManyProcessor
   */
  static void New(const v8::FunctionCallbackInfo<v8::Value>& args);
  /*
   * Closes the OneToManyProcessor.
   * The object cannot be used after this call
   */
  static void close(const v8::FunctionCallbackInfo<v8::Value>& args);
  /*
   * Sets the Publisher
   * Param: the WebRtcConnection of the Publisher
   */
  static void setPublisher(const v8::FunctionCallbackInfo<v8::Value>& args);
  /*
   * Adds an ExternalOutput
   * Param: The ExternalOutput   
   */
  static void addExternalOutput(const v8::FunctionCallbackInfo<v8::Value>& args);
  /*
   * Sets an External Publisher
   * Param: the ExternalInput of the Publisher
   */
  static void setExternalPublisher(const v8::FunctionCallbackInfo<v8::Value>& args);
  /*
   * Gets the Publisher state
   * Param: none
   */
  static void getPublisherState(const v8::FunctionCallbackInfo<v8::Value>& args);
  /*
   * Returns true if OneToManyProcessor has a publisher
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
