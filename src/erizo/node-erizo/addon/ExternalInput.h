#ifndef EXTERNALINPUT_H
#define EXTERNALINPUT_H

#include <node.h>
#include <node_object_wrap.h>
#include <media/ExternalInput.h>

/*
 * Wrapper class of erizo::ExternalInput
 *
 * Represents a OneToMany connection.
 * Receives media from one publisher and retransmits it to every subscriber.
 */
class ExternalInput : public node::ObjectWrap {
  public:
  static void Init(v8::Handle<v8::Object> exports);
  erizo::ExternalInput* me;

  private:
  ExternalInput();
  ~ExternalInput();
  static v8::Persistent<v8::Function> constructor;

  /*
   * Constructor.
   * Constructs a ExternalInput
   */
  static void New(const v8::FunctionCallbackInfo<v8::Value>& args);
  /*
   * Closes the ExternalInput.
   * The object cannot be used after this call
   */
  static void close(const v8::FunctionCallbackInfo<v8::Value>& args);
  /*
   * Inits the ExternalInput 
   * Returns true ready
   */
  static void init(const v8::FunctionCallbackInfo<v8::Value>& args);
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
};

#endif
