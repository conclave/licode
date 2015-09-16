#!/usr/bin/env bash

OS=$(uname -s)
if [[ ${OS} == 'Darwin' ]]; then
  this_dir=$(cd $(dirname $0); pwd)
  source ${this_dir}/env.sh
  source ${SCRIPT_DIR}/install_funcs.sh
  install_libnice
  brew install srtp
  brew install openssl
  brew install opus
  brew install ffmpeg
else
  this_dir=$(dirname $(readlink -f $0))
  source ${this_dir}/env.sh
  source ${SCRIPT_DIR}/install_funcs.sh
  mkdir -p ${PREFIX_DIR}
  (uname -a | grep [Uu]buntu -q -s) && install_opus
  install_libnice
  install_openssl
  install_libsrtp
  install_ffmpeg
fi
