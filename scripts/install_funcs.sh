install_opus(){
  local VERSION="1.1"
  mkdir -p ${BUILD_DIR} && pushd ${BUILD_DIR}
  curl -O http://downloads.xiph.org/releases/opus/opus-${VERSION}.tar.gz
  tar xf opus-${VERSION}.tar.gz
  pushd opus-${VERSION}
  ./configure --prefix=${PREFIX_DIR}
  make -s V=0 && make install
  popd
  popd
}

install_libav(){
  local VERSION="11.3"
  local DIR="libav-${VERSION}"
  local SRC="${DIR}.tar.gz"
  local URL="https://www.libav.org/releases/${SRC}"
  local MD5SUM="1a2eb461b98e0f1d1d6c4d892d51ac9b"
  mkdir -p ${BUILD_DIR} && pushd ${BUILD_DIR}
  [[ ! -s ${SRC} ]] && curl -O ${URL}
  if ! (echo "${MD5SUM} ${SRC}" | md5sum --check) ; then
    rm -f ${SRC} && curl -O ${URL} # re-try
    (echo "${MD5SUM} ${SRC}" | md5sum --check) || (echo "${SRC} corrupted." && return 1)
  fi
  rm -rf ${DIR}
  tar xf ${SRC}
  pushd ${DIR}
  [[ "${ENABLE_GPL}" == "true" ]] && \
  PKG_CONFIG_PATH=${PREFIX_DIR}/lib/pkgconfig ./configure --prefix=${PREFIX_DIR} --enable-shared --enable-libvpx --enable-libopus --enable-gpl --enable-libx264 || \
  PKG_CONFIG_PATH=${PREFIX_DIR}/lib/pkgconfig ./configure --prefix=${PREFIX_DIR} --enable-shared --enable-libvpx --enable-libopus && \
  make -j4 -s V=0 && make install
  popd
  popd
}

install_libnice(){
  mkdir -p ${BUILD_DIR} && pushd ${BUILD_DIR}
  curl -O http://nice.freedesktop.org/releases/libnice-0.1.4.tar.gz
  tar xf libnice-0.1.4.tar.gz
  pushd libnice-0.1.4
  patch -R ./agent/conncheck.c < ${ROOT_DIR}/contrib/libnice-014.patch0
  PKG_CONFIG_PATH=${PREFIX_DIR}/lib/pkgconfig:${PREFIX_DIR}/lib64/pkgconfig:${PKG_CONFIG_PATH} ./configure --prefix=${PREFIX_DIR} && \
  make -s V= && make install
  popd
  popd
}

install_openssl(){
  local SSL_VERSION="1.0.2a"
  mkdir -p ${BUILD_DIR} && pushd ${BUILD_DIR}
  curl -O http://www.openssl.org/source/openssl-${SSL_VERSION}.tar.gz
  tar xf openssl-${SSL_VERSION}.tar.gz
  pushd openssl-${SSL_VERSION}
  ./config no-ssl3 --prefix=$PREFIX_DIR -fPIC && \
  make depend && \
  make -s V=0 && \
  make install
  popd
  popd
}

install_libsrtp(){
  local VERSION="1.5.2"
  local DIR="libsrtp-${VERSION}"
  local SRC="${DIR}.tar.gz"
  local URL="https://github.com/cisco/libsrtp/archive/v${VERSION}.tar.gz"
  mkdir -p ${BUILD_DIR} && pushd ${BUILD_DIR}
  wget -c ${URL} -O ${SRC}
  rm -rf ${DIR}
  tar xf ${SRC}
  pushd ${DIR}
  CFLAGS="-fPIC" ./configure --prefix=$PREFIX_DIR && \
  make clean && \
  make -s V=0 && \
  make uninstall && \
  make install
  popd
  popd
}

install_libuv(){
  local UV_VERSION="0.10.36"
  local UV_SRC="https://github.com/libuv/libuv/archive/v${UV_VERSION}.tar.gz"
  local UV_DST="libuv-${UV_VERSION}.tar.gz"
  mkdir -p ${BUILD_DIR} && pushd ${BUILD_DIR}
  [[ ! -s ${UV_DST} ]] && wget -c ${UV_SRC} -O ${UV_DST}
  tar xf ${UV_DST}
  pushd libuv-${UV_VERSION} && make
  ##make_install:
  cp -av include/* ${PREFIX_DIR}/include
  local symbol=$(readelf -d ./libuv.so | grep soname | sed 's/.*\[\(.*\)\]/\1/g')
  ln -s libuv.so ${symbol}
  cp -dv libuv.so ${symbol} ${PREFIX_DIR}/lib
  popd
  popd
}