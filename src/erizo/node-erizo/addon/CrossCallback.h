#ifndef CrossCallback_h
#define CrossCallback_h

#include <AsyncCallback.h>

#include <memory>
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
  virtual bool operator()(const std::string& data) { return notify("", data); }
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

  void process();
  static void closeCallback(uv_handle_t*);
  static void callback(uv_async_t*);
};

class NodeAsyncCallback : public UvAsyncCallback {
  public:
  static std::shared_ptr<NodeAsyncCallback> New(v8::Isolate*, const v8::Local<v8::Function>&);
  static std::shared_ptr<NodeAsyncCallback> New(const v8::Local<v8::Function>&);
  virtual ~NodeAsyncCallback();

  protected:
  explicit NodeAsyncCallback();
  explicit NodeAsyncCallback(v8::Isolate*, const v8::Local<v8::Function>&);
  void operator()(const Data& data);
  v8::Persistent<v8::Object> mStore;
};

class CrossCallbackWrap : public node::ObjectWrap, public NodeAsyncCallback {
  public:
  static void Init(v8::Local<v8::Object> exports);
  inline static void SETUP_CROSSCALLBACK_PROTOTYPE_METHODS(v8::Local<v8::FunctionTemplate> tmpl)
  {
    NODE_SET_PROTOTYPE_METHOD(tmpl, "on", On);
    NODE_SET_PROTOTYPE_METHOD(tmpl, "addEventListener", On);
    NODE_SET_PROTOTYPE_METHOD(tmpl, "off", Off);
    NODE_SET_PROTOTYPE_METHOD(tmpl, "removeEventListener", Off);
    NODE_SET_PROTOTYPE_METHOD(tmpl, "removeAllEventListeners", Clear);
    NODE_SET_PROTOTYPE_METHOD(tmpl, "clearEventListener", Clear);
  }

  protected:
  explicit CrossCallbackWrap();
  virtual ~CrossCallbackWrap();

  private:
  static void New(const v8::FunctionCallbackInfo<v8::Value>& args);
  static void Self(const v8::FunctionCallbackInfo<v8::Value>& args);
  static void Emit(const v8::FunctionCallbackInfo<v8::Value>& args);
  static void On(const v8::FunctionCallbackInfo<v8::Value>& args);
  static void Off(const v8::FunctionCallbackInfo<v8::Value>& args);
  static void Clear(const v8::FunctionCallbackInfo<v8::Value>& args);

  static v8::Persistent<v8::Function> constructor;
};

#endif // CrossCallback_h
