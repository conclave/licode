#!/usr/bin/env bash

OS=$(uname -s)
if [[ ${OS} == 'Darwin' ]]; then
  bin=$(cd $(dirname $0); pwd)
else
  bin=$(dirname $(readlink -f $0))
fi

${bin}/daemon.sh start nuve && sleep 4
${bin}/daemon.sh start controller
${bin}/daemon.sh start agent
${bin}/daemon.sh start sample
