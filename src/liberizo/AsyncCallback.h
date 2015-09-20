// evloved from github.com/matzoe/libuv_ae
#ifndef AsyncCallback_h
#define AsyncCallback_h

#include <string>

namespace erizo {

class AsyncCallback {
  public:
  AsyncCallback(){};
  virtual ~AsyncCallback(){};
  virtual bool notify(const std::string& data) = 0;
  virtual void operator()() = 0;
  virtual void operator()(const std::string& data) = 0;
  virtual size_t size() = 0;
};

#endif // AsyncCallback_h

} // namespace erizo
