#ifndef CrossCallback_h
#define CrossCallback_h

#include <AsyncCallback.h>

#include <mutex>
#include <node.h>
#include <node_object_wrap.h>
#include <queue>
#include <uv.h>

class UvAsyncCallback : public erizo::AsyncCallback {
  public:
  explicit UvAsyncCallback();
  explicit UvAsyncCallback(uv_loop_t*);
  virtual ~UvAsyncCallback();
  virtual bool notify(const std::string& data);
  virtual void operator()();
  virtual void operator()(const std::string& data) = 0;
  virtual size_t size();

  private:
  uv_async_t* mUvHandle;
  std::mutex mLock;
  std::queue<std::string> mBuffer;
  std::string mData;
  static void closeCallback(uv_handle_t*);
  static void callback(uv_async_t*);
};

class NodeAsyncCallback : public UvAsyncCallback {
  public:
  explicit NodeAsyncCallback(const v8::Persistent<v8::Function>& f);
  ~NodeAsyncCallback();
  void operator()(const std::string& data);

  private:
  v8::Persistent<v8::Function> mFunc;
};

class CrossEvent : public node::ObjectWrap {
  public:
  static void Init(v8::Handle<v8::Object> exports);
  // static void NewInstance(const v8::FunctionCallbackInfo<v8::Value>& args);

  private:
  explicit CrossEvent();
  ~CrossEvent();

  static void New(const v8::FunctionCallbackInfo<v8::Value>& args);
  // static void On(const v8::FunctionCallbackInfo<v8::Value>& args);
  // static void Off(const v8::FunctionCallbackInfo<v8::Value>& args);
  // static void Emit(const v8::FunctionCallbackInfo<v8::Value>& args);
  static v8::Persistent<v8::Function> constructor;
};

#endif // CrossCallback_h
