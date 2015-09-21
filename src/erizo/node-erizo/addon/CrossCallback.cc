#include "CrossCallback.h"

using namespace v8;

Persistent<Function> CrossEvent::constructor;
CrossEvent::CrossEvent(const Persistent<Function>& f)
    : NodeAsyncCallback{ f }
{
}
CrossEvent::~CrossEvent() {}

void CrossEvent::Init(Handle<Object> exports)
{
  Isolate* isolate = Isolate::GetCurrent();

  // Prepare constructor template
  Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
  tpl->SetClassName(String::NewFromUtf8(isolate, "CrossEvent"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // Prototype
  NODE_SET_PROTOTYPE_METHOD(tpl, "emit", Emit);

  constructor.Reset(isolate, tpl->GetFunction());
  exports->Set(String::NewFromUtf8(isolate, "CrossEvent"), tpl->GetFunction());
}

void CrossEvent::New(const FunctionCallbackInfo<Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  if (args.Length() == 0 || !args[0]->IsFunction())
    return;

  if (args.IsConstructCall()) {
    Persistent<Function> cb(isolate, Local<Function>::Cast(args[0]));
    CrossEvent* evt = new CrossEvent(cb);
    evt->Wrap(args.This());
    args.GetReturnValue().Set(args.This());
  }
  else {
    const int argc = 1;
    Local<Value> argv[argc] = { args[0] };
    Local<Function> cons = Local<Function>::New(isolate, constructor);
    args.GetReturnValue().Set(cons->NewInstance(argc, argv));
  }
}

void CrossEvent::Emit(const FunctionCallbackInfo<Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
  if (args.Length() == 0 || !args[0]->IsString())
    return;
  CrossEvent* event = ObjectWrap::Unwrap<CrossEvent>(args.Holder());
  std::string data = std::string(*String::Utf8Value(args[0]->ToString()));
  event->notify(data);
}

NodeAsyncCallback::NodeAsyncCallback(const Persistent<Function>& f)
    : UvAsyncCallback(uv_default_loop())
{
  mFunc.Reset(Isolate::GetCurrent(), f);
}

NodeAsyncCallback::~NodeAsyncCallback(){};

void NodeAsyncCallback::operator()(const std::string& data)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
  const unsigned argc = 1;
  Local<Value> argv[argc] = {
    String::NewFromUtf8(isolate, data.c_str())
  };
  TryCatch try_catch;
  Local<Function>::New(isolate, mFunc)->Call(isolate->GetCurrentContext()->Global(), argc, argv);
  if (try_catch.HasCaught()) {
    node::FatalException(isolate, try_catch);
  }
}

UvAsyncCallback::UvAsyncCallback()
{
  mUvHandle = reinterpret_cast<uv_async_t*>(malloc(sizeof(uv_async_t)));
  mUvHandle->data = this;
  uv_async_init(uv_default_loop(), mUvHandle, UvAsyncCallback::callback);
}

UvAsyncCallback::UvAsyncCallback(uv_loop_t* loop)
{
  mUvHandle = reinterpret_cast<uv_async_t*>(malloc(sizeof(uv_async_t)));
  mUvHandle->data = this;
  uv_async_init(loop, mUvHandle, UvAsyncCallback::callback);
}

UvAsyncCallback::~UvAsyncCallback()
{
  uv_close(reinterpret_cast<uv_handle_t*>(mUvHandle), UvAsyncCallback::closeCallback);
}

// main thread
void UvAsyncCallback::operator()()
{
  while (!mBuffer.empty()) {
    {
      std::lock_guard<std::mutex> lock(mLock);
      mData = mBuffer.front();
      mBuffer.pop();
    }
    (*this)(mData);
  }
}

size_t UvAsyncCallback::size()
{
  return mBuffer.size();
}

// other thread
bool UvAsyncCallback::notify(const std::string& data)
{
  if (uv_is_active(reinterpret_cast<uv_handle_t*>(mUvHandle))) {
    {
      std::lock_guard<std::mutex> lock(mLock);
      mBuffer.push(data);
    }
    uv_async_send(mUvHandle);
    return true;
  }
  return false;
}

void UvAsyncCallback::closeCallback(uv_handle_t* handle)
{
  free(handle);
}

void UvAsyncCallback::callback(uv_async_t* handle)
{ // libuv <HEAD>
  (*reinterpret_cast<UvAsyncCallback*>(handle->data))();
}
