#ifndef EXTERNALOUTPUT_H
#define EXTERNALOUTPUT_H

#include <node.h>
#include <node_object_wrap.h>
#include <media/ExternalOutput.h>

/*
 * Wrapper class of erizo::ExternalOutput
 *
 * Represents a OneToMany connection.
 * Receives media from one publisher and retransmits it to every subscriber.
 */
class ExternalOutput : public node::ObjectWrap {
  public:
  static void Init(v8::Local<v8::Object> exports);
  erizo::ExternalOutput* me;

  private:
  ExternalOutput();
  ~ExternalOutput();
  static v8::Persistent<v8::Function> constructor;

  /*
   * Constructor.
   * Constructs a ExternalOutput
   */
  static void New(const v8::FunctionCallbackInfo<v8::Value>& args);
  /*
   * Closes the ExternalOutput.
   * The object cannot be used after this call
   */
  static void close(const v8::FunctionCallbackInfo<v8::Value>& args);
  /*
   * Inits the ExternalOutput 
   * Returns true ready
   */
  static void init(const v8::FunctionCallbackInfo<v8::Value>& args);
};

#endif
