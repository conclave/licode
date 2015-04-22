#!/usr/bin/env bash

this=$(readlink -f $0)
this_dir=$(dirname $this)

SCRIPT_DIR=${this_dir}
unset this
unset this_dir

ROOT_DIR=$(dirname ${SCRIPT_DIR})
PREFIX_DIR="${ROOT_DIR}/local"
BUILD_DIR="${ROOT_DIR}/build"
