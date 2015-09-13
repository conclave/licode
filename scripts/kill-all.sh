#!/usr/bin/env bash

OS=$(uname -s)
if [[ ${OS} == 'Darwin' ]]; then
  bin=$(cd $(dirname $0); pwd)
else
  bin=$(dirname $(readlink -f $0))
fi

${bin}/daemon.sh stop sample
${bin}/daemon.sh stop agent
${bin}/daemon.sh stop controller
${bin}/daemon.sh stop nuve
