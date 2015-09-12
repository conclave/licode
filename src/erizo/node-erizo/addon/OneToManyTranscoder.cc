#ifndef BUILDING_NODE_EXTENSION
#define BUILDING_NODE_EXTENSION
#endif
#include <node.h>
#include "OneToManyTranscoder.h"


using namespace v8;

Persistent<Function> OneToManyTranscoder::constructor;
OneToManyTranscoder::OneToManyTranscoder() {};
OneToManyTranscoder::~OneToManyTranscoder() {};

void OneToManyTranscoder::Init(Handle<Object> exports) {
  Isolate* isolate = Isolate::GetCurrent();
  // Prepare constructor template
  Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
  tpl->SetClassName(String::NewFromUtf8(isolate, "OneToManyTranscoder"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);
  // Prototype
  NODE_SET_PROTOTYPE_METHOD(tpl, "close", close);
  NODE_SET_PROTOTYPE_METHOD(tpl, "setPublisher", setPublisher);
  NODE_SET_PROTOTYPE_METHOD(tpl, "hasPublisher", hasPublisher);
  NODE_SET_PROTOTYPE_METHOD(tpl, "addSubscriber", addSubscriber);
  NODE_SET_PROTOTYPE_METHOD(tpl, "removeSubscriber", removeSubscriber);

  constructor.Reset(isolate, tpl->GetFunction());
  exports->Set(String::NewFromUtf8(isolate, "OneToManyTranscoder"), tpl->GetFunction());
}

void OneToManyTranscoder::New(const v8::FunctionCallbackInfo<v8::Value>& args) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  if (args.IsConstructCall()) {
    OneToManyTranscoder* obj = new OneToManyTranscoder();
    obj->me = new erizo::OneToManyTranscoder();
    obj->msink = obj->me;
    obj->Wrap(args.This());
    args.GetReturnValue().Set(args.This());
  } else {
    const int argc = 1;
    Local<Value> argv[argc] = { args[0] };
    args.GetReturnValue().Set((Local<Function>::New(isolate, constructor))->NewInstance(argc, argv));
  }
}

void OneToManyTranscoder::close(const v8::FunctionCallbackInfo<v8::Value>& args) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  OneToManyTranscoder* obj = ObjectWrap::Unwrap<OneToManyTranscoder>(args.Holder());
  erizo::OneToManyTranscoder *me = (erizo::OneToManyTranscoder*)obj->me;
  delete me;
}

void OneToManyTranscoder::setPublisher(const v8::FunctionCallbackInfo<v8::Value>& args) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  OneToManyTranscoder* obj = ObjectWrap::Unwrap<OneToManyTranscoder>(args.Holder());
  erizo::OneToManyTranscoder *me = (erizo::OneToManyTranscoder*)obj->me;

  WebRtcConnection* param = ObjectWrap::Unwrap<WebRtcConnection>(args[0]->ToObject());
  erizo::WebRtcConnection* wr = (erizo::WebRtcConnection*)param->me;

  erizo::MediaSource* ms = dynamic_cast<erizo::MediaSource*>(wr);
  me->setPublisher(ms);
}

void OneToManyTranscoder::hasPublisher(const v8::FunctionCallbackInfo<v8::Value>& args) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  OneToManyTranscoder* obj = ObjectWrap::Unwrap<OneToManyTranscoder>(args.Holder());
  erizo::OneToManyTranscoder *me = (erizo::OneToManyTranscoder*)obj->me;
  args.GetReturnValue().Set(Boolean::New(isolate, (me->publisher != NULL)));
}

void OneToManyTranscoder::addSubscriber(const v8::FunctionCallbackInfo<v8::Value>& args) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  OneToManyTranscoder* obj = ObjectWrap::Unwrap<OneToManyTranscoder>(args.Holder());
  erizo::OneToManyTranscoder *me = (erizo::OneToManyTranscoder*)obj->me;

  WebRtcConnection* param = ObjectWrap::Unwrap<WebRtcConnection>(args[0]->ToObject());
  erizo::WebRtcConnection* wr = param->me;

  v8::String::Utf8Value param1(args[1]->ToString());
  std::string peerId = std::string(*param1);
  me->addSubscriber(wr, peerId);
}

void OneToManyTranscoder::removeSubscriber(const v8::FunctionCallbackInfo<v8::Value>& args) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  OneToManyTranscoder* obj = ObjectWrap::Unwrap<OneToManyTranscoder>(args.Holder());
  erizo::OneToManyTranscoder *me = (erizo::OneToManyTranscoder*)obj->me;

  v8::String::Utf8Value param1(args[0]->ToString());
  std::string peerId = std::string(*param1);
  me->removeSubscriber(peerId);
}

