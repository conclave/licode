#include "ExternalOutput.h"

using namespace v8;

Persistent<Function> ExternalOutput::constructor;
ExternalOutput::ExternalOutput(){};
ExternalOutput::~ExternalOutput(){};

void ExternalOutput::Init(Local<Object> exports)
{
    Isolate* isolate = Isolate::GetCurrent();
    // Prepare constructor template
    Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
    tpl->SetClassName(String::NewFromUtf8(isolate, "ExternalOutput"));
    tpl->InstanceTemplate()->SetInternalFieldCount(1);
    // Prototype
    NODE_SET_PROTOTYPE_METHOD(tpl, "close", close);
    NODE_SET_PROTOTYPE_METHOD(tpl, "init", init);

    constructor.Reset(isolate, tpl->GetFunction());
    exports->Set(String::NewFromUtf8(isolate, "ExternalOutput"), tpl->GetFunction());
}

void ExternalOutput::New(const v8::FunctionCallbackInfo<v8::Value>& args)
{
    Isolate* isolate = Isolate::GetCurrent();
    HandleScope scope(isolate);

    if (args.IsConstructCall()) {
        v8::String::Utf8Value param(args[0]->ToString());
        std::string url = std::string(*param);
        ExternalOutput* obj = new ExternalOutput();
        obj->me = new erizo::ExternalOutput(url);
        obj->Wrap(args.This());
        args.GetReturnValue().Set(args.This());
    } else {
        const int argc = 1;
        Local<Value> argv[argc] = { args[0] };
        args.GetReturnValue().Set((Local<Function>::New(isolate, constructor))->NewInstance(argc, argv));
    }
}

void ExternalOutput::close(const v8::FunctionCallbackInfo<v8::Value>& args)
{
    Isolate* isolate = Isolate::GetCurrent();
    HandleScope scope(isolate);

    ExternalOutput* obj = ObjectWrap::Unwrap<ExternalOutput>(args.Holder());
    erizo::ExternalOutput* me = (erizo::ExternalOutput*)obj->me;
    delete me;
}

void ExternalOutput::init(const v8::FunctionCallbackInfo<v8::Value>& args)
{
    Isolate* isolate = Isolate::GetCurrent();
    HandleScope scope(isolate);

    ExternalOutput* obj = ObjectWrap::Unwrap<ExternalOutput>(args.Holder());
    erizo::ExternalOutput* me = (erizo::ExternalOutput*)obj->me;
    int r = me->init();
    args.GetReturnValue().Set(Integer::New(isolate, r));
}
