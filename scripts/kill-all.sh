#!/usr/bin/env bash

this=$(readlink -f $0)
bin=$(dirname $this)

${bin}/daemon.sh stop sample
${bin}/daemon.sh stop agent
${bin}/daemon.sh stop controller
${bin}/daemon.sh stop nuve
