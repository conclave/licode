cmake_minimum_required(VERSION 2.8)

project (ERIZO)
option (COMPILE_EXAMPLES "COMPILE_EXAMPLES" OFF)
option (COMPILE_TEST "COMPILE_TEST" OFF)


set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CMAKE_CURRENT_SOURCE_DIR}/cmake/")
find_package (Doxygen)
if(DOXYGEN_FOUND)
  configure_file("${CMAKE_CURRENT_SOURCE_DIR}/Doxyfile.in" "${CMAKE_CURRENT_BINARY_DIR}/Doxyfile" @ONLY)
  add_custom_target(doc
    ${DOXYGEN_EXECUTABLE} "${CMAKE_CURRENT_BINARY_DIR}/Doxyfile"
    WORKING_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}"
    COMMENT "Generating API documentation with Doxygen" VERBATIM
  )
endif(DOXYGEN_FOUND)

#global variable
if(APPLE)
  set(THIRD_PARTY_INCLUDE "/usr/local/include/")
  set(THIRD_PARTY_LIB "/usr/local/lib/")
else()
  set(THIRD_PARTY_INCLUDE "${CMAKE_CURRENT_SOURCE_DIR}/../../local/include/")
  set(THIRD_PARTY_LIB "${CMAKE_CURRENT_SOURCE_DIR}/../../local/lib/")
endif()

set(LIBNICE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/../../local/lib/")
set(CROSSCALLBACK_DIR ../../node_modules/crosscallback)

find_package(PkgConfig)
#functions
function(test_lib LIB_NAME)
  if (${LIB_NAME} MATCHES "^.*-NOTFOUND")
    message(FATAL_ERROR "lib not found: " ${LIB_NAME} " check README")
    return()
  endif(${LIB_NAME} MATCHES "^.*-NOTFOUND")
endfunction(test_lib)

set(ERIZO_VERSION_MAJOR 0)
set(ERIZO_VERSION_MINOR 1)
set(CMAKE_CXX_FLAGS "-g -Wall -std=c++11")

include_directories("${ERIZO_SOURCE_DIR}" "${THIRD_PARTY_INCLUDE}" "${CROSSCALLBACK_DIR}")

set(ERIZO_SOURCES 
  "${CROSSCALLBACK_DIR}/AsyncCallback.cc"
  "${ERIZO_SOURCE_DIR}/SdpInfo.cpp"
  "${ERIZO_SOURCE_DIR}/SrtpChannel.cpp"
  "${ERIZO_SOURCE_DIR}/DtlsTransport.cpp"
  "${ERIZO_SOURCE_DIR}/StringUtil.cpp"
  "${ERIZO_SOURCE_DIR}/WebRtcConnection.cpp"
  "${ERIZO_SOURCE_DIR}/dtls/bf_dwrap.c"
  "${ERIZO_SOURCE_DIR}/dtls/DtlsClient.cpp"
  "${ERIZO_SOURCE_DIR}/dtls/DtlsTimer.cpp"
  "${ERIZO_SOURCE_DIR}/dtls/DtlsFactory.cpp"
  "${ERIZO_SOURCE_DIR}/dtls/DtlsSocket.cpp"
  "${ERIZO_SOURCE_DIR}/dtls/OpenSSLInit.cpp"
  "${ERIZO_SOURCE_DIR}/media/codecs/AudioCodec.cpp"
  "${ERIZO_SOURCE_DIR}/media/codecs/VideoCodec.cpp"
  "${ERIZO_SOURCE_DIR}/media/mixers/VideoMixer.cpp"
  "${ERIZO_SOURCE_DIR}/media/mixers/VideoUtils.cpp"
  "${ERIZO_SOURCE_DIR}/media/MediaProcessor.cpp"
  "${ERIZO_SOURCE_DIR}/media/ExternalInput.cpp"
  "${ERIZO_SOURCE_DIR}/media/OneToManyTranscoder.cpp"
  "${ERIZO_SOURCE_DIR}/media/ExternalOutput.cpp"
  "${ERIZO_SOURCE_DIR}/rtp/RtcpProcessor.cpp"
  "${ERIZO_SOURCE_DIR}/rtp/RtpPacketQueue.cpp"
  "${ERIZO_SOURCE_DIR}/rtp/RtpSource.cpp"
  "${ERIZO_SOURCE_DIR}/rtp/webrtc/fec_receiver_impl.cc"
  "${ERIZO_SOURCE_DIR}/rtp/webrtc/rtp_utility.cc"
  "${ERIZO_SOURCE_DIR}/rtp/webrtc/forward_error_correction.cc"
  "${ERIZO_SOURCE_DIR}/rtp/webrtc/forward_error_correction_internal.cc"
  "${ERIZO_SOURCE_DIR}/rtp/RtpVP8Parser.cpp"
  "${ERIZO_SOURCE_DIR}/rtp/RtpSink.cpp"
  "${ERIZO_SOURCE_DIR}/rtp/RtpVP8Fragmenter.cpp"
  "${ERIZO_SOURCE_DIR}/OneToManyProcessor.cpp"
  "${ERIZO_SOURCE_DIR}/Stats.cpp"
  "${ERIZO_SOURCE_DIR}/NiceConnection.cpp"
)

set(LIBRARY_INSTALL_DIR ${CMAKE_INSTALL_PREFIX}/${CMAKE_SHARED_LIBRARY_PREFIX})
set(CMAKE_INSTALL_NAME_DIR ${LIBRARY_INSTALL_DIR})
add_library(erizo SHARED ${ERIZO_SOURCES})

set_target_properties(
  erizo
  PROPERTIES
    VERSION
      ${ERIZO_VERSION_MAJOR}.${ERIZO_VERSION_MINOR}.0
    SOVERSION
      ${ERIZO_VERSION_MAJOR}.${ERIZO_VERSION_MINOR}.0
)

# GLIB
find_package(Glib REQUIRED)
include_directories(${GLIB_INCLUDE_DIRS})
target_link_libraries(erizo ${GLIB_LIBRARIES})

# BOOST
set (BOOST_LIBS thread regex system)
find_package(Boost COMPONENTS ${BOOST_LIBS} REQUIRED)
target_link_libraries(erizo ${Boost_LIBRARIES})

# GTHREAD
find_library(GTHREAD gthread-2.0 HINTS "${THIRD_PARTY_LIB}")
test_lib(${GTHREAD})

# SRTP
find_library(SRTP srtp HINTS "${THIRD_PARTY_LIB}")
test_lib(${SRTP})

# NICE
find_library(NICE nice HINTS "${LIBNICE_PATH}")
test_lib(${NICE})

# OPENSSL
if(APPLE)
  find_library(SSL ssl HINTS "/usr/local/opt/openssl/lib")
  find_library(CRYPTO crypto HINTS "/usr/local/opt/openssl/lib")
  include_directories("/usr/local/opt/openssl/include")
else()
  find_library(SSL ssl HINTS "${THIRD_PARTY_LIB}")
  find_library(CRYPTO crypto HINTS "${THIRD_PARTY_LIB}")
endif()
test_lib(${SSL})
test_lib(${CRYPTO})

# FFMepg/Libav
find_library(AVUTIL avutil HINTS "${THIRD_PARTY_LIB}")
test_lib(${AVUTIL})
set (LIBS ${AVUTIL})
find_library(AVCODEC avcodec HINTS "${THIRD_PARTY_LIB}")
test_lib(${AVCODEC})
set (LIBS ${LIBS} ${AVCODEC})
find_library(AVFORMAT avformat HINTS "${THIRD_PARTY_LIB}")
test_lib(${AVFORMAT})
set (LIBS ${LIBS} ${AVFORMAT})

# LOG4CXX
find_library(LOG log4cxx)
test_lib(${LOG})

target_link_libraries(erizo ${SRTP} ${NICE} ${GTHREAD} ${SSL} ${CRYPTO} ${LIBS} ${LOG})

install(
  TARGETS
    erizo
  LIBRARY DESTINATION
    "${LIBRARY_INSTALL_DIR}"
)

#examples
if(COMPILE_EXAMPLES)
  add_subdirectory("${ERIZO_ALL_SOURCES}examples")
endif(COMPILE_EXAMPLES)

#tests
if(COMPILE_TEST)
  add_subdirectory("${ERIZO_ALL_SOURCES}test")
endif(COMPILE_TEST)
