#!/bin/bash
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$PWD/../../../local/lib
ulimit -c unlimited

node $*
