#!/usr/bin/env bash

this=$(readlink -f $0)
this_dir=$(dirname $this)

source ${this_dir}/env.sh
source ${SCRIPT_DIR}/install_funcs.sh

install_libnice
install_openssl
install_libsrtp
install_libuv
install_libav
