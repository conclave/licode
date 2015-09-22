// evloved from github.com/matzoe/libuv_ae
#ifndef AsyncCallback_h
#define AsyncCallback_h

#include <string>

namespace erizo {

class AsyncCallback {
  public:
  AsyncCallback(){};
  virtual ~AsyncCallback(){};
  virtual bool notify(const std::string& event, const std::string& data) = 0;
};

#endif // AsyncCallback_h

} // namespace erizo
