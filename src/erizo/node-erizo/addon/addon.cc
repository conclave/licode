#include "WebRtcConnection.h"
#include "OneToManyProcessor.h"
#include "OneToManyTranscoder.h"
#include "ExternalInput.h"
#include "ExternalOutput.h"
#include "CrossCallback.h"

using namespace v8;

void InitAll(Handle<Object> exports)
{
  WebRtcConnection::Init(exports);
  OneToManyProcessor::Init(exports);
  OneToManyTranscoder::Init(exports);
  ExternalInput::Init(exports);
  ExternalOutput::Init(exports);
  CrossEvent::Init(exports);
}

NODE_MODULE(addon, InitAll)
