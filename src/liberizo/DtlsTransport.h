#ifndef DTLSCONNECTION_H_
#define DTLSCONNECTION_H_

#include "dtls/DtlsSocket.h"
#include "logger.h"
#include "NiceConnection.h"
#include "Transport.h"

#include <boost/thread/mutex.hpp>
#include <boost/asio/deadline_timer.hpp>
#include <boost/asio.hpp>
#include <boost/scoped_ptr.hpp>
#include <string>

namespace erizo {
class SrtpChannel;
class Resender;
class DtlsTransport : dtls::DtlsReceiver, public Transport {
  DECLARE_LOGGER();

  public:
  DtlsTransport(MediaType med, const std::string& transport_name, bool bundle, bool rtcp_mux, TransportListener* transportListener, const IceConfig& iceConfig, std::string username, std::string password);
  virtual ~DtlsTransport();
  void connectionStateChanged(IceState newState);
  std::string getMyFingerprint();
  static bool isDtlsPacket(const char* buf, int len);
  void onNiceData(unsigned int component_id, char* data, int len, NiceConnection* nice);
  void onCandidate(const CandidateInfo& candidate, NiceConnection* conn);
  void write(char* data, int len);
  void writeDtls(dtls::DtlsSocketContext* ctx, const unsigned char* data, unsigned int len);
  void onHandshakeCompleted(dtls::DtlsSocketContext* ctx, std::string clientKey, std::string serverKey, std::string srtp_profile);
  void updateIceState(IceState state, NiceConnection* conn);
  void processLocalSdp(SdpInfo*);

  private:
  char protectBuf_[5000];
  char unprotectBuf_[5000];
  boost::shared_ptr<dtls::DtlsSocketContext> dtlsRtp_, dtlsRtcp_;
  boost::mutex writeMutex_, sessionMutex_;
  boost::scoped_ptr<SrtpChannel> srtp_, srtcp_;
  bool readyRtp_, readyRtcp_;
  bool running_;
  boost::scoped_ptr<Resender> rtcpResender_, rtpResender_;
  boost::thread getNice_Thread_;
  packetPtr p_;

  void getNiceDataLoop();
};

class Resender {
  DECLARE_LOGGER();

  public:
  Resender(boost::shared_ptr<NiceConnection> nice, unsigned int comp, const unsigned char* data, unsigned int len);
  virtual ~Resender();
  void start();
  void run();
  void cancel();
  int getStatus();
  void resend(const boost::system::error_code& ec);

  private:
  boost::shared_ptr<NiceConnection> nice_;
  unsigned int comp_;
  int sent_;
  const unsigned char* data_;
  unsigned int len_;
  boost::asio::io_service service_;
  boost::asio::deadline_timer timer_;
  boost::scoped_ptr<boost::thread> thread_;
};
}
#endif
