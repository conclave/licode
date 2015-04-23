install_opus(){
  local VERSION="1.1"
  mkdir -p ${BUILD_DIR} && cd ${BUILD_DIR}
  curl -O http://downloads.xiph.org/releases/opus/opus-${VERSION}.tar.gz
  tar xf opus-${VERSION}.tar.gz
  cd opus-${VERSION}
  ./configure --prefix=${PREFIX_DIR}
  make -s V=0 && make install
}

install_libav(){
  local VERSION="11.1"
  local DIR="libav-${VERSION}"
  local SRC="${DIR}.tar.gz"
  local URL="https://www.libav.org/releases/${SRC}"
  local MD5SUM="ce788f04693d63ae168b696eac8ca888"
  mkdir -p ${BUILD_DIR} && cd ${BUILD_DIR}
  [[ ! -s ${SRC} ]] && curl -O ${URL}
  if ! (echo "${MD5SUM} ${SRC}" | md5sum --check) ; then
    rm -f ${SRC} && curl -O ${URL} # re-try
    (echo "${MD5SUM} ${SRC}" | md5sum --check) || (echo "${SRC} corrupted." && return 1)
  fi
  rm -rf ${DIR}
  tar xf ${SRC}
  cd ${DIR}
  [[ "${ENABLE_GPL}" == "true" ]] && \
  PKG_CONFIG_PATH=${PREFIX_DIR}/lib/pkgconfig ./configure --prefix=${PREFIX_DIR} --enable-shared --enable-libvpx --enable-libopus --enable-gpl --enable-libx264 || \
  PKG_CONFIG_PATH=${PREFIX_DIR}/lib/pkgconfig ./configure --prefix=${PREFIX_DIR} --enable-shared --enable-libvpx --enable-libopus && \
  make -j4 -s V=0 && make install
}

install_libnice(){
  mkdir -p ${BUILD_DIR} && cd ${BUILD_DIR}
  curl -O http://nice.freedesktop.org/releases/libnice-0.1.4.tar.gz
  tar xf libnice-0.1.4.tar.gz
  cd libnice-0.1.4
  patch -R ./agent/conncheck.c < ${ROOT_DIR}/etc/libnice-014.patch0
  PKG_CONFIG_PATH=${PREFIX_DIR}/lib/pkgconfig:${PREFIX_DIR}/lib64/pkgconfig:${PKG_CONFIG_PATH} ./configure --prefix=${PREFIX_DIR} && \
  make -s V= && make install
}

install_openssl(){
  local SSL_VERSION="1.0.2a"
  mkdir -p ${BUILD_DIR} && cd ${BUILD_DIR}
  curl -O http://www.openssl.org/source/openssl-${SSL_VERSION}.tar.gz
  tar xf openssl-${SSL_VERSION}.tar.gz
  cd openssl-${SSL_VERSION}
  ./config no-ssl3 --prefix=$PREFIX_DIR -fPIC && \
  make depend && \
  make -s V=0 && \
  make install
}

install_libsrtp(){
  cd ${ROOT_DIR}/third_party/srtp
  CFLAGS="-fPIC" ./configure --prefix=$PREFIX_DIR && \
  make clean && \
  make -s V=0 && \
  make uninstall && \
  make install
}

install_libuv(){
  local UV_VERSION="0.10.36"
  local UV_SRC="https://github.com/libuv/libuv/archive/v${UV_VERSION}.tar.gz"
  local UV_DST="libuv-${UV_VERSION}.tar.gz"
  mkdir -p ${BUILD_DIR} && cd ${BUILD_DIR}
  [[ ! -s ${UV_DST} ]] && wget -c ${UV_SRC} -O ${UV_DST}
  tar xf ${UV_DST}
  cd libuv-${UV_VERSION} && make
  ##make_install:
  cp -av include/* ${PREFIX_DIR}/include
  local symbol=$(readelf -d ./libuv.so | grep soname | sed 's/.*\[\(.*\)\]/\1/g')
  ln -s libuv.so ${symbol}
  cp -dv libuv.so ${symbol} ${PREFIX_DIR}/lib
}
