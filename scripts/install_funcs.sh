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

install_ffmpeg(){
  local VERSION="2.7.2"
  local DIR="ffmpeg-${VERSION}"
  local SRC="${DIR}.tar.bz2"
  local URL="http://ffmpeg.org/releases/${SRC}"
  local MD5SUM="7eb2140bab9f0a8669b65b50c8e4cfb5"
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
  PKG_CONFIG_PATH=${PREFIX_DIR}/lib/pkgconfig CFLAGS=-fPIC ./configure --prefix=${PREFIX_DIR} --enable-shared --enable-libvpx --disable-vaapi --enable-libopus --enable-gpl --enable-libx264 || \
  PKG_CONFIG_PATH=${PREFIX_DIR}/lib/pkgconfig CFLAGS=-fPIC ./configure --prefix=${PREFIX_DIR} --enable-shared --enable-libvpx --disable-vaapi --enable-libopus && \
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
  patch ./agent/conncheck.c < ${ROOT_DIR}/contrib/libnice-014.patch2
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
