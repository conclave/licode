#!/usr/bin/env bash

this=$(readlink -f $0)
bin=$(dirname $this)

${bin}/daemon.sh start nuve && sleep 4
${bin}/daemon.sh start controller
${bin}/daemon.sh start agent
${bin}/daemon.sh start sample
