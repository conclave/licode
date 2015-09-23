#include "WebRtcConnection.h"
#include "MediaDefinitions.h"

using namespace v8;

Persistent<Function> WebRtcConnection::constructor;
WebRtcConnection::WebRtcConnection(){};
WebRtcConnection::~WebRtcConnection(){};

void WebRtcConnection::Init(Handle<Object> exports)
{
  Isolate* isolate = Isolate::GetCurrent();
  // Prepare constructor template
  Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
  tpl->SetClassName(String::NewFromUtf8(isolate, "WebRtcConnection"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);
  // Prototype
  NODE_SET_PROTOTYPE_METHOD(tpl, "close", close);
  NODE_SET_PROTOTYPE_METHOD(tpl, "setRemoteSdp", setRemoteSdp);
  NODE_SET_PROTOTYPE_METHOD(tpl, "addRemoteCandidate", addRemoteCandidate);
  NODE_SET_PROTOTYPE_METHOD(tpl, "getLocalSdp", getLocalSdp);
  NODE_SET_PROTOTYPE_METHOD(tpl, "setAudioReceiver", setAudioReceiver);
  NODE_SET_PROTOTYPE_METHOD(tpl, "setVideoReceiver", setVideoReceiver);
  NODE_SET_PROTOTYPE_METHOD(tpl, "getCurrentState", getCurrentState);
  NODE_SET_PROTOTYPE_METHOD(tpl, "getStats", getStats);
  NODE_SET_PROTOTYPE_METHOD(tpl, "generatePLIPacket", generatePLIPacket);
  NODE_SET_PROTOTYPE_METHOD(tpl, "setFeedbackReports", setFeedbackReports);
  NODE_SET_PROTOTYPE_METHOD(tpl, "addEventListener", addEventListener);
  NODE_SET_PROTOTYPE_METHOD(tpl, "on", addEventListener);
  NODE_SET_PROTOTYPE_METHOD(tpl, "removeEventListener", removeEventListener);
  NODE_SET_PROTOTYPE_METHOD(tpl, "off", removeEventListener);
  NODE_SET_PROTOTYPE_METHOD(tpl, "clearEventListener", clearEventListener);

  constructor.Reset(isolate, tpl->GetFunction());
  exports->Set(String::NewFromUtf8(isolate, "WebRtcConnection"), tpl->GetFunction());
}

void WebRtcConnection::New(const v8::FunctionCallbackInfo<v8::Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  if (args.Length() < 7) {
    isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Wrong number of arguments")));
    return;
  }

  bool a = (args[0]->ToBoolean())->BooleanValue();
  bool v = (args[1]->ToBoolean())->BooleanValue();
  String::Utf8Value param(args[2]->ToString());
  std::string stunServer = std::string(*param);
  int stunPort = args[3]->IntegerValue();
  int minPort = args[4]->IntegerValue();
  int maxPort = args[5]->IntegerValue();
  bool t = (args[6]->ToBoolean())->BooleanValue();

  erizo::IceConfig iceConfig;
  if (args.Length() == 11) {
    String::Utf8Value param2(args[7]->ToString());
    std::string turnServer = std::string(*param2);
    int turnPort = args[8]->IntegerValue();
    String::Utf8Value param3(args[9]->ToString());
    std::string turnUsername = std::string(*param3);
    String::Utf8Value param4(args[10]->ToString());
    std::string turnPass = std::string(*param4);
    iceConfig.turnServer = turnServer;
    iceConfig.turnPort = turnPort;
    iceConfig.turnUsername = turnUsername;
    iceConfig.turnPass = turnPass;
  }

  iceConfig.stunServer = stunServer;
  iceConfig.stunPort = stunPort;
  iceConfig.minPort = minPort;
  iceConfig.maxPort = maxPort;

  WebRtcConnection* obj = new WebRtcConnection();
  obj->me = new erizo::WebRtcConnection(a, v, iceConfig, t, obj);
  obj->Wrap(args.This());
  args.GetReturnValue().Set(args.This());
}

void WebRtcConnection::close(const v8::FunctionCallbackInfo<v8::Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  WebRtcConnection* obj = ObjectWrap::Unwrap<WebRtcConnection>(args.Holder());
  obj->me = nullptr;
}

void WebRtcConnection::setRemoteSdp(const v8::FunctionCallbackInfo<v8::Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  WebRtcConnection* obj = ObjectWrap::Unwrap<WebRtcConnection>(args.Holder());
  erizo::WebRtcConnection* me = obj->me;

  String::Utf8Value param(args[0]->ToString());
  std::string sdp = std::string(*param);
  bool r = me->setRemoteSdp(sdp);
  args.GetReturnValue().Set(Boolean::New(isolate, r));
}

void WebRtcConnection::addRemoteCandidate(const v8::FunctionCallbackInfo<v8::Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  WebRtcConnection* obj = ObjectWrap::Unwrap<WebRtcConnection>(args.Holder());
  erizo::WebRtcConnection* me = obj->me;

  String::Utf8Value param(args[0]->ToString());
  std::string mid = std::string(*param);

  int sdpMLine = args[1]->IntegerValue();
  String::Utf8Value param2(args[2]->ToString());
  std::string sdp = std::string(*param2);
  bool r = me->addRemoteCandidate(mid, sdpMLine, sdp);
  args.GetReturnValue().Set(Boolean::New(isolate, r));
}

void WebRtcConnection::getLocalSdp(const v8::FunctionCallbackInfo<v8::Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  WebRtcConnection* obj = ObjectWrap::Unwrap<WebRtcConnection>(args.Holder());
  erizo::WebRtcConnection* me = obj->me;

  std::string sdp = me->getLocalSdp();
  args.GetReturnValue().Set(String::NewFromUtf8(isolate, sdp.c_str()));
}

void WebRtcConnection::setAudioReceiver(const v8::FunctionCallbackInfo<v8::Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  WebRtcConnection* obj = ObjectWrap::Unwrap<WebRtcConnection>(args.Holder());
  erizo::WebRtcConnection* me = obj->me;

  MediaSink* param = ObjectWrap::Unwrap<MediaSink>(args[0]->ToObject());
  erizo::MediaSink* mr = param->msink;
  me->setAudioSink(mr);
}

void WebRtcConnection::setVideoReceiver(const v8::FunctionCallbackInfo<v8::Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  WebRtcConnection* obj = ObjectWrap::Unwrap<WebRtcConnection>(args.Holder());
  erizo::WebRtcConnection* me = obj->me;

  MediaSink* param = ObjectWrap::Unwrap<MediaSink>(args[0]->ToObject());
  erizo::MediaSink* mr = param->msink;
  me->setVideoSink(mr);
}

void WebRtcConnection::getCurrentState(const v8::FunctionCallbackInfo<v8::Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  WebRtcConnection* obj = ObjectWrap::Unwrap<WebRtcConnection>(args.Holder());
  erizo::WebRtcConnection* me = obj->me;
  int state = me->getCurrentState();
  args.GetReturnValue().Set(Number::New(isolate, state));
}

void WebRtcConnection::getStats(const v8::FunctionCallbackInfo<v8::Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
  WebRtcConnection* obj = ObjectWrap::Unwrap<WebRtcConnection>(args.Holder());
  if (obj->me == nullptr) //Requesting stats when WebrtcConnection not available
    return;
  std::string lastStats = obj->me->getJSONStats();
  args.GetReturnValue().Set(String::NewFromUtf8(isolate, lastStats.c_str()));
}

void WebRtcConnection::addEventListener(const FunctionCallbackInfo<Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
  if (args.Length() < 2 || !args[0]->IsString() || !args[1]->IsFunction())
    return;
  WebRtcConnection* conn = ObjectWrap::Unwrap<WebRtcConnection>(args.Holder());
  Local<Object>::New(isolate, conn->mStore)->Set(args[0], args[1]);
}

void WebRtcConnection::removeEventListener(const FunctionCallbackInfo<Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
}

void WebRtcConnection::clearEventListener(const FunctionCallbackInfo<Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
}

void WebRtcConnection::generatePLIPacket(const v8::FunctionCallbackInfo<v8::Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  WebRtcConnection* obj = ObjectWrap::Unwrap<WebRtcConnection>(args.Holder());
  erizo::WebRtcConnection* me = obj->me;
  me->sendPLI();
}

void WebRtcConnection::setFeedbackReports(const v8::FunctionCallbackInfo<v8::Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  WebRtcConnection* obj = ObjectWrap::Unwrap<WebRtcConnection>(args.Holder());
  erizo::WebRtcConnection* me = obj->me;
  bool v = (args[0]->ToBoolean())->BooleanValue();
  int fbreps = args[1]->IntegerValue(); // From bps to Kbps
  me->setFeedbackReports(v, fbreps);
}
