#!/usr/bin/env bash

OS=$(uname -s)
if [[ ${OS} == 'Darwin' ]]; then
  this_dir=$(cd $(dirname $0); pwd)
else
  this_dir=$(dirname $(readlink -f $0))
fi

SCRIPT_DIR=${this_dir}
unset this_dir

ROOT_DIR=$(dirname ${SCRIPT_DIR})
PREFIX_DIR="${ROOT_DIR}/local"
BUILD_DIR="${ROOT_DIR}/build"
