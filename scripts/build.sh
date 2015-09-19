#!/usr/bin/env bash

usage(){
  echo "
Building helper
  Usage:
      --liberizo                          build liberizo
      ,  --test                           build liberizo test
      --addon                             build addon for node-erizo
      --essential                         --liberizo --addon
      --help                              print this help
"
  exit $1
}

[[ $# -eq 0 ]] && usage 1

OS=$(uname -s)
if [[ ${OS} == 'Darwin' ]]; then
  this_dir=$(cd $(dirname $0); pwd)
else
  this_dir=$(dirname $(readlink -f $0))
fi

source ${this_dir}/env.sh
BUILD_LIBERIZO=false
# BUILD_LIBERIZO_EXAMPLE=false
BUILD_LIBERIZO_TEST=false
BUILD_ADDON=false

build_liberizo(){
  local DIR="${BUILD_DIR}/liberizo"
  local SRC_DIR="${ROOT_DIR}/src/liberizo"
  local EXAMPLE="OFF"
  local TEST="OFF"
  mkdir -p ${DIR} && pushd ${DIR}
  # ${BUILD_LIBERIZO_EXAMPLE} && EXAMPLE="ON"
  ${BUILD_LIBERIZO_TEST} && TEST="ON"
  cmake ${SRC_DIR} -DCMAKE_INSTALL_PREFIX=${PREFIX_DIR} -DCOMPILE_EXAMPLES=${EXAMPLE} -DCOMPILE_TEST=${TEST} && make && make install || echo "Failed to produce liberizo"
  popd
}

build_addon(){
  local SRC_DIR="${ROOT_DIR}/src/erizo/node-erizo/addon"
  pushd ${SRC_DIR}
  PREFIX_DIR=${PREFIX_DIR} node-gyp rebuild
  popd
}

build() {
  local DONE=0
  # Job
  ${BUILD_LIBERIZO} && build_liberizo && ((DONE++))
  ${BUILD_ADDON} && build_addon && ((DONE++))
  [[ ${DONE} -eq 0 ]] && usage 1
}

shopt -s extglob
while [[ $# -gt 0 ]]; do
  case $1 in
    *(-)liberizo )
      BUILD_LIBERIZO=true
      ;;
    # *(-)example )
    #   BUILD_LIBERIZO_EXAMPLE=true
    #   ;;
    *(-)test )
      BUILD_LIBERIZO_TEST=true
      ;;
    *(-)addon )
      BUILD_ADDON=true
      ;;
    *(-)essential )
      BUILD_LIBERIZO=true
      BUILD_ADDON=true
      ;;
    *(-)help )
      usage 0
      ;;
    * )
      echo -e "\x1b[33mUnknown argument\x1b[0m: $1"
      ;;
  esac
  shift
done

build

