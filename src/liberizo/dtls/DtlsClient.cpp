#include "DtlsSocket.h"
#include "DtlsTimer.h"
#include "bf_dwrap.h"

#include <cassert>
#include <nice/nice.h>
#include <string>

extern "C" {
#include <srtp/srtp.h>
#include <srtp/srtp_priv.h>
}

using namespace std;

namespace dtls {

DEFINE_LOGGER(DtlsSocketContext, "dtls.DtlsSocketContext");

//memory is only valid for duration of callback; must be copied if queueing
//is required
DtlsSocketContext::DtlsSocketContext()
{
    started = false;
}

DtlsSocketContext::~DtlsSocketContext()
{
    delete mSocket;
    mSocket = nullptr;
}

std::string DtlsSocketContext::getFingerprint()
{
    char fprint[100];
    mSocket->getMyCertFingerprint(fprint);
    return std::string(fprint, strlen(fprint));
}

void DtlsSocketContext::start()
{
    started = true;
    mSocket->startClient();
}

void DtlsSocketContext::read(const unsigned char* data, unsigned int len)
{
    mSocket->handlePacketMaybe(data, len);
}

void DtlsSocketContext::setDtlsReceiver(DtlsReceiver* recv)
{
    receiver = recv;
}

void DtlsSocketContext::write(const unsigned char* data, unsigned int len)
{
    if (receiver != nullptr) {
        receiver->writeDtls(this, data, len);
    }
}

void DtlsSocketContext::handshakeCompleted()
{
    char fprint[100];
    SRTP_PROTECTION_PROFILE* srtp_profile;

    if (mSocket->getRemoteFingerprint(fprint)) {
        ELOG_TRACE("Remote fingerprint == %s", fprint);

        bool check = mSocket->checkFingerprint(fprint, strlen(fprint));
        ELOG_DEBUG("Fingerprint check == %d", check);

        SrtpSessionKeys* keys = mSocket->getSrtpSessionKeys();

        unsigned char* cKey = (unsigned char*)malloc(keys->clientMasterKeyLen + keys->clientMasterSaltLen);
        unsigned char* sKey = (unsigned char*)malloc(keys->serverMasterKeyLen + keys->serverMasterSaltLen);

        memcpy(cKey, keys->clientMasterKey, keys->clientMasterKeyLen);
        memcpy(cKey + keys->clientMasterKeyLen, keys->clientMasterSalt, keys->clientMasterSaltLen);

        memcpy(sKey, keys->serverMasterKey, keys->serverMasterKeyLen);
        memcpy(sKey + keys->serverMasterKeyLen, keys->serverMasterSalt, keys->serverMasterSaltLen);

        // g_base64_encode must be free'd with g_free.  Also, std::string's assignment operator does *not* take
        // ownership of the passed in ptr; under the hood it copies up to the first nullptr character.
        gchar* temp = g_base64_encode((const guchar*)cKey, keys->clientMasterKeyLen + keys->clientMasterSaltLen);
        std::string clientKey = temp;
        g_free(temp);
        temp = nullptr;

        temp = g_base64_encode((const guchar*)sKey, keys->serverMasterKeyLen + keys->serverMasterSaltLen);
        std::string serverKey = temp;
        g_free(temp);
        temp = nullptr;

        ELOG_DEBUG("ClientKey: %s", clientKey.c_str());
        ELOG_DEBUG("ServerKey: %s", serverKey.c_str());

        free(cKey);
        free(sKey);
        delete keys;

        srtp_profile = mSocket->getSrtpProfile();

        if (srtp_profile) {
            ELOG_DEBUG("SRTP Extension negotiated profile=%s", srtp_profile->name);
        }

        if (receiver != nullptr) {
            receiver->onHandshakeCompleted(this, clientKey, serverKey, srtp_profile->name);
        }
    }
    else {
        ELOG_DEBUG("Peer did not authenticate");
    }
}

void DtlsSocketContext::handshakeFailed(const char* err)
{
    ELOG_WARN("DTLS Handshake Failure");
}
}
