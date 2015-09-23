#include "ExternalInput.h"
#include "MediaDefinitions.h"

using namespace v8;

Persistent<Function> ExternalInput::constructor;
ExternalInput::ExternalInput(){};
ExternalInput::~ExternalInput(){};

void ExternalInput::Init(Handle<Object> exports)
{
  Isolate* isolate = Isolate::GetCurrent();
  // Prepare constructor template
  Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
  tpl->SetClassName(String::NewFromUtf8(isolate, "ExternalInput"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);
  // Prototype
  NODE_SET_PROTOTYPE_METHOD(tpl, "close", close);
  NODE_SET_PROTOTYPE_METHOD(tpl, "init", init);
  NODE_SET_PROTOTYPE_METHOD(tpl, "setAudioReceiver", setAudioReceiver);
  NODE_SET_PROTOTYPE_METHOD(tpl, "setVideoReceiver", setVideoReceiver);

  constructor.Reset(isolate, tpl->GetFunction());
  exports->Set(String::NewFromUtf8(isolate, "ExternalInput"), tpl->GetFunction());
}

void ExternalInput::New(const v8::FunctionCallbackInfo<v8::Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  if (args.IsConstructCall()) {
    v8::String::Utf8Value param(args[0]->ToString());
    std::string url = std::string(*param);
    ExternalInput* obj = new ExternalInput();
    obj->me = new erizo::ExternalInput(url);
    obj->Wrap(args.This());
    args.GetReturnValue().Set(args.This());
  }
  else {
    const int argc = 1;
    Local<Value> argv[argc] = { args[0] };
    args.GetReturnValue().Set((Local<Function>::New(isolate, constructor))->NewInstance(argc, argv));
  }
}

void ExternalInput::close(const v8::FunctionCallbackInfo<v8::Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  ExternalInput* obj = ObjectWrap::Unwrap<ExternalInput>(args.Holder());
  erizo::ExternalInput* me = (erizo::ExternalInput*)obj->me;
  delete me;
}

void ExternalInput::init(const v8::FunctionCallbackInfo<v8::Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  ExternalInput* obj = ObjectWrap::Unwrap<ExternalInput>(args.Holder());
  erizo::ExternalInput* me = (erizo::ExternalInput*)obj->me;
  int r = me->init();
  args.GetReturnValue().Set(Integer::New(isolate, r));
}

void ExternalInput::setAudioReceiver(const v8::FunctionCallbackInfo<v8::Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  ExternalInput* obj = ObjectWrap::Unwrap<ExternalInput>(args.Holder());
  erizo::ExternalInput* me = (erizo::ExternalInput*)obj->me;

  MediaSink* param = ObjectWrap::Unwrap<MediaSink>(args[0]->ToObject());
  erizo::MediaSink* mr = param->msink;
  me->setAudioSink(mr);
}

void ExternalInput::setVideoReceiver(const v8::FunctionCallbackInfo<v8::Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  ExternalInput* obj = ObjectWrap::Unwrap<ExternalInput>(args.Holder());
  erizo::ExternalInput* me = (erizo::ExternalInput*)obj->me;

  MediaSink* param = ObjectWrap::Unwrap<MediaSink>(args[0]->ToObject());
  erizo::MediaSink* mr = param->msink;
  me->setVideoSink(mr);
}
