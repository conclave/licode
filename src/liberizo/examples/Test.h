#include <media/MediaProcessor.h>
#include <rtp/RtpVP8Parser.h>
#include <boost/asio.hpp>

#ifndef TEST_H_
#define TEST_H_
namespace erizo{
class Test: public RawDataReceiver {
public:
	Test();
	virtual ~Test();
	void receiveRawData(RawDataPacket& packet);

	void rec();
	void send(char *buff, int buffSize);
private:

	boost::asio::ip::udp::socket* socket_;
	boost::asio::ip::udp::resolver* resolver_;

	boost::asio::ip::udp::resolver::query* query_;
	boost::asio::io_service* ioservice_;
	InputProcessor* ip;
	erizo::RtpVP8Parser pars;

};

}
#endif /* TEST_H_ */
