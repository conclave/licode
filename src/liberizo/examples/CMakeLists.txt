cmake_minimum_required(VERSION 2.8)
#functions
function(test_lib LIB_NAME)
 if (${LIB_NAME} MATCHES "^.*-NOTFOUND")
  message(FATAL_ERROR "lib not found: " ${LIB_NAME} " check README")
  return()
 endif(${LIB_NAME} MATCHES "^.*-NOTFOUND")
endfunction(test_lib)

project (ERIZO_EXAMPLES)

set(ERIZO_EXAMPLES_SOURCES
  "${ERIZO_EXAMPLES_SOURCE_DIR}/pc/Observer.cpp"
  "${ERIZO_EXAMPLES_SOURCE_DIR}/pc/PCSocket.cpp"
  "${ERIZO_EXAMPLES_SOURCE_DIR}/Test.cpp"
  "${ERIZO_EXAMPLES_SOURCE_DIR}/hsam.cpp"
)

add_executable(hsam ${ERIZO_EXAMPLES_SOURCES})
include_directories("${ERIZO_SOURCE_DIR}" "${THIRD_PARTY_INCLUDE}")
target_link_libraries(hsam erizo)

set (BOOST_LIBS thread regex system)
find_package(Boost COMPONENTS ${BOOST_LIBS} REQUIRED)
target_link_libraries(hsam ${Boost_LIBRARIES})
target_link_libraries(hsam ${EXTRA_LIBS})
