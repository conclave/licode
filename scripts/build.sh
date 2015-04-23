#!/usr/bin/env bash

usage(){
  echo "
Building helper
  Usage:
      --liberizo                          build liberizo.so
      --addon                             build erizo addon for nodejs
      --help                              print this help
"
  exit $1
}

[[ $# -eq 0 ]] && usage 1

this=$(readlink -f $0)
this_dir=$(dirname $this)
source ${this_dir}/env.sh
BUILD_LIBERIZO=false
BUILD_ADDON=false

build_liberizo(){
  local DIR="${BUILD_DIR}/liberizo"
  local SRC_DIR="${ROOT_DIR}/src/erizo/liberizo/src"
  mkdir -p ${DIR} && pushd ${DIR}
  cmake ${SRC_DIR} && make
  popd
}

build_addon(){
  echo "${FUNCNAME}: not completed"
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
    *(-)addon )
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

