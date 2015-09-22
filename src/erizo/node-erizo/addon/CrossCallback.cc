#include "CrossCallback.h"

using namespace v8;

Persistent<Function> CrossNotification::constructor;
CrossNotification::CrossNotification()
    : NodeAsyncCallback{}
{
}
CrossNotification::~CrossNotification() {}

void CrossNotification::Init(Handle<Object> exports)
{
  Isolate* isolate = Isolate::GetCurrent();

  // Prepare constructor template
  Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
  tpl->SetClassName(String::NewFromUtf8(isolate, "CrossNotification"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // Prototype
  NODE_SET_PROTOTYPE_METHOD(tpl, "emit", Emit);
  NODE_SET_PROTOTYPE_METHOD(tpl, "on", On);

  constructor.Reset(isolate, tpl->GetFunction());
  exports->Set(String::NewFromUtf8(isolate, "CrossNotification"), tpl->GetFunction());
}

void CrossNotification::New(const FunctionCallbackInfo<Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  if (args.IsConstructCall()) {
    CrossNotification* n = new CrossNotification();
    n->Wrap(args.This());
    args.GetReturnValue().Set(args.This());
  }
  else {
    const int argc = 1;
    Local<Value> argv[argc] = { args[0] };
    Local<Function> cons = Local<Function>::New(isolate, constructor);
    args.GetReturnValue().Set(cons->NewInstance(argc, argv));
  }
}

void CrossNotification::Emit(const FunctionCallbackInfo<Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
  if (args.Length() < 2 || !args[0]->IsString())
    return;
  CrossNotification* n = ObjectWrap::Unwrap<CrossNotification>(args.Holder());
  std::string event = std::string(*String::Utf8Value(args[0]->ToString()));
  std::string data = std::string(*String::Utf8Value(args[1]->ToString()));
  n->notify(event, data);
}

void CrossNotification::On(const FunctionCallbackInfo<Value>& args)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
  if (args.Length() < 2 || !args[0]->IsString() || !args[1]->IsFunction())
    return;
  CrossNotification* n = ObjectWrap::Unwrap<CrossNotification>(args.Holder());
  Local<Object>::New(isolate, n->mStore)->Set(args[0], args[1]);
}

// ------------------------NodeAsyncCallback-----------------------------------

void NodeAsyncCallback::operator()(const Data& data)
{
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
  auto store = Local<Object>::New(isolate, mStore);
  if (store.IsEmpty())
    return;

  auto val = store->Get(String::NewFromUtf8(isolate, data.event.c_str()));
  if (!val->IsFunction())
    return;
  const unsigned argc = 1;
  Local<Value> argv[argc] = {
    String::NewFromUtf8(isolate, data.message.c_str())
  };
  TryCatch try_catch;
  Local<Function>::Cast(val)->Call(isolate->GetCurrentContext()->Global(), argc, argv);
  if (try_catch.HasCaught()) {
    node::FatalException(isolate, try_catch);
  }
}

NodeAsyncCallback::NodeAsyncCallback()
    : UvAsyncCallback{ uv_default_loop() }
    , mStore{ Isolate::GetCurrent(), Object::New(Isolate::GetCurrent()) }
{
}

NodeAsyncCallback::~NodeAsyncCallback(){};

// ------------------------UvAsyncCallback-------------------------------------

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
bool UvAsyncCallback::notify(const std::string& event, const std::string& data)
{
  if (uv_is_active(reinterpret_cast<uv_handle_t*>(mUvHandle))) {
    {
      std::lock_guard<std::mutex> lock(mLock);
      mBuffer.push(Data{ event, data });
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
