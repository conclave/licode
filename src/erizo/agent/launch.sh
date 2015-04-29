#!/bin/bash

DIR=$(dirname $(readlink -f $0))

export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:${DIR}/../../../local/lib
ulimit -c unlimited

node $*
