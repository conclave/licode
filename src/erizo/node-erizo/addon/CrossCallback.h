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
  virtual bool notify(const std::string& event, const std::string& data);
  virtual size_t size();

  protected:
  typedef struct {
    std::string event, message;
  } Data;
  virtual void operator()(const Data& data) = 0;

  private:
  uv_async_t* mUvHandle;
  std::mutex mLock;
  std::queue<Data> mBuffer;
  Data mData;

  void operator()();
  static void closeCallback(uv_handle_t*);
  static void callback(uv_async_t*);
};

class NodeAsyncCallback : public UvAsyncCallback {
  public:
  explicit NodeAsyncCallback();
  virtual ~NodeAsyncCallback();

  protected:
  void operator()(const Data& data);
  v8::Persistent<v8::Object> mStore;
};

class CrossNotification : public node::ObjectWrap, NodeAsyncCallback {
  public:
  static void Init(v8::Handle<v8::Object> exports);

  private:
  explicit CrossNotification();
  ~CrossNotification();

  static void New(const v8::FunctionCallbackInfo<v8::Value>& args);
  static void Emit(const v8::FunctionCallbackInfo<v8::Value>& args);
  static void On(const v8::FunctionCallbackInfo<v8::Value>& args);
  // static void Once(const v8::FunctionCallbackInfo<v8::Value>& args);
  // static void Off(const v8::FunctionCallbackInfo<v8::Value>& args);
  static v8::Persistent<v8::Function> constructor;
};

#endif // CrossCallback_h
