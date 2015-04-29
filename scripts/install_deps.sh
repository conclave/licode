#!/usr/bin/env bash

this=$(readlink -f $0)
this_dir=$(dirname $this)

source ${this_dir}/env.sh
source ${SCRIPT_DIR}/install_funcs.sh

mkdir -p ${PREFIX_DIR}

(uname -a | grep [Uu]buntu -q -s) && install_opus
install_libnice
install_openssl
install_libsrtp
install_libuv
install_libav
