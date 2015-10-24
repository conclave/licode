#include "OneToManyProcessor.h"
#include "WebRtcConnection.h"
#include "ExternalInput.h"
#include "ExternalOutput.h"

using namespace v8;

Persistent<Function> OneToManyProcessor::constructor;
OneToManyProcessor::OneToManyProcessor(){};
OneToManyProcessor::~OneToManyProcessor(){};

void OneToManyProcessor::Init(Local<Object> exports)
{
    Isolate* isolate = Isolate::GetCurrent();
    // Prepare constructor template
    Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
    tpl->SetClassName(String::NewFromUtf8(isolate, "OneToManyProcessor"));
    tpl->InstanceTemplate()->SetInternalFieldCount(1);

    // Prototype
    NODE_SET_PROTOTYPE_METHOD(tpl, "close", close);
    NODE_SET_PROTOTYPE_METHOD(tpl, "setPublisher", setPublisher);
    NODE_SET_PROTOTYPE_METHOD(tpl, "addExternalOutput", addExternalOutput);
    NODE_SET_PROTOTYPE_METHOD(tpl, "setExternalPublisher", setExternalPublisher);
    NODE_SET_PROTOTYPE_METHOD(tpl, "getPublisherState", getPublisherState);
    NODE_SET_PROTOTYPE_METHOD(tpl, "hasPublisher", hasPublisher);
    NODE_SET_PROTOTYPE_METHOD(tpl, "addSubscriber", addSubscriber);
    NODE_SET_PROTOTYPE_METHOD(tpl, "removeSubscriber", removeSubscriber);
    constructor.Reset(isolate, tpl->GetFunction());
    exports->Set(String::NewFromUtf8(isolate, "OneToManyProcessor"), tpl->GetFunction());
}

void OneToManyProcessor::New(const v8::FunctionCallbackInfo<v8::Value>& args)
{
    Isolate* isolate = Isolate::GetCurrent();
    HandleScope scope(isolate);

    if (args.IsConstructCall()) {
        OneToManyProcessor* obj = new OneToManyProcessor();
        obj->me = new erizo::OneToManyProcessor();
        obj->msink = obj->me;
        obj->Wrap(args.This());
        args.GetReturnValue().Set(args.This());
    } else {
        const int argc = 1;
        Local<Value> argv[argc] = { args[0] };
        args.GetReturnValue().Set((Local<Function>::New(isolate, constructor))->NewInstance(argc, argv));
    }
}

void OneToManyProcessor::close(const v8::FunctionCallbackInfo<v8::Value>& args)
{
    Isolate* isolate = Isolate::GetCurrent();
    HandleScope scope(isolate);

    OneToManyProcessor* obj = ObjectWrap::Unwrap<OneToManyProcessor>(args.Holder());
    erizo::OneToManyProcessor* me = (erizo::OneToManyProcessor*)obj->me;
    delete me;
}

void OneToManyProcessor::setPublisher(const v8::FunctionCallbackInfo<v8::Value>& args)
{
    Isolate* isolate = Isolate::GetCurrent();
    HandleScope scope(isolate);

    OneToManyProcessor* obj = ObjectWrap::Unwrap<OneToManyProcessor>(args.Holder());
    erizo::OneToManyProcessor* me = (erizo::OneToManyProcessor*)obj->me;

    WebRtcConnection* param = ObjectWrap::Unwrap<WebRtcConnection>(args[0]->ToObject());
    erizo::WebRtcConnection* wr = (erizo::WebRtcConnection*)param->me;

    erizo::MediaSource* ms = dynamic_cast<erizo::MediaSource*>(wr);
    me->setPublisher(ms);
}
void OneToManyProcessor::setExternalPublisher(const v8::FunctionCallbackInfo<v8::Value>& args)
{
    Isolate* isolate = Isolate::GetCurrent();
    HandleScope scope(isolate);

    OneToManyProcessor* obj = ObjectWrap::Unwrap<OneToManyProcessor>(args.Holder());
    erizo::OneToManyProcessor* me = (erizo::OneToManyProcessor*)obj->me;

    ExternalInput* param = ObjectWrap::Unwrap<ExternalInput>(args[0]->ToObject());
    erizo::ExternalInput* wr = (erizo::ExternalInput*)param->me;

    erizo::MediaSource* ms = dynamic_cast<erizo::MediaSource*>(wr);
    me->setPublisher(ms);
}

void OneToManyProcessor::getPublisherState(const v8::FunctionCallbackInfo<v8::Value>& args)
{
    Isolate* isolate = Isolate::GetCurrent();
    HandleScope scope(isolate);

    OneToManyProcessor* obj = ObjectWrap::Unwrap<OneToManyProcessor>(args.Holder());
    erizo::OneToManyProcessor* me = (erizo::OneToManyProcessor*)obj->me;

    erizo::MediaSource* ms = me->publisher.get();

    erizo::WebRtcConnection* wr = (erizo::WebRtcConnection*)ms;

    int state = wr->getCurrentState();

    args.GetReturnValue().Set(Number::New(isolate, state));
}

void OneToManyProcessor::hasPublisher(const v8::FunctionCallbackInfo<v8::Value>& args)
{
    Isolate* isolate = Isolate::GetCurrent();
    HandleScope scope(isolate);

    OneToManyProcessor* obj = ObjectWrap::Unwrap<OneToManyProcessor>(args.Holder());
    erizo::OneToManyProcessor* me = (erizo::OneToManyProcessor*)obj->me;

    args.GetReturnValue().Set(Boolean::New(isolate, (me->publisher != nullptr)));
}

void OneToManyProcessor::addSubscriber(const v8::FunctionCallbackInfo<v8::Value>& args)
{
    Isolate* isolate = Isolate::GetCurrent();
    HandleScope scope(isolate);

    OneToManyProcessor* obj = ObjectWrap::Unwrap<OneToManyProcessor>(args.Holder());
    erizo::OneToManyProcessor* me = (erizo::OneToManyProcessor*)obj->me;

    WebRtcConnection* param = ObjectWrap::Unwrap<WebRtcConnection>(args[0]->ToObject());
    erizo::WebRtcConnection* wr = param->me;

    erizo::MediaSink* ms = dynamic_cast<erizo::MediaSink*>(wr);

    v8::String::Utf8Value param1(args[1]->ToString());
    std::string peerId = std::string(*param1);
    me->addSubscriber(ms, peerId);
}

void OneToManyProcessor::addExternalOutput(const v8::FunctionCallbackInfo<v8::Value>& args)
{
    Isolate* isolate = Isolate::GetCurrent();
    HandleScope scope(isolate);

    OneToManyProcessor* obj = ObjectWrap::Unwrap<OneToManyProcessor>(args.Holder());
    erizo::OneToManyProcessor* me = (erizo::OneToManyProcessor*)obj->me;

    ExternalOutput* param = ObjectWrap::Unwrap<ExternalOutput>(args[0]->ToObject());
    erizo::ExternalOutput* wr = param->me;

    erizo::MediaSink* ms = dynamic_cast<erizo::MediaSink*>(wr);

    v8::String::Utf8Value param1(args[1]->ToString());
    std::string peerId = std::string(*param1);
    me->addSubscriber(ms, peerId);
}

void OneToManyProcessor::removeSubscriber(const v8::FunctionCallbackInfo<v8::Value>& args)
{
    Isolate* isolate = Isolate::GetCurrent();
    HandleScope scope(isolate);

    OneToManyProcessor* obj = ObjectWrap::Unwrap<OneToManyProcessor>(args.Holder());
    erizo::OneToManyProcessor* me = (erizo::OneToManyProcessor*)obj->me;

    v8::String::Utf8Value param1(args[0]->ToString());

    std::string peerId = std::string(*param1);
    me->removeSubscriber(peerId);
}
