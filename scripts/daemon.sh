#!/usr/bin/env bash

usage="Usage: daemon.sh (start|stop|status) (nuve|controller|agent|sample)"

# if no args specified, show usage
if [ $# -le 1 ]; then
  echo $usage
  exit 1
fi

this=$(readlink -f $0)
bin=$(dirname $this)
ROOT=$(dirname ${bin})
RUN="${ROOT}/local/run"

# get arguments
action=$1
shift

component=$1
shift

umask 0000

rotate_log ()
{
  local logfile=$1;
  local num=5;
  if [ -n "$2" ]; then
  num=$2
  fi
  if [ -f "$logfile" ]; then # rotate logs
  while [ $num -gt 1 ]; do
    prev=`expr $num - 1`
    [ -f "$logfile.$prev" ] && mv "$logfile.$prev" "$logfile.$num"
    num=$prev
  done
  mv "$logfile" "$logfile.$num";
  fi
}

mkdir -p "${RUN}"

stdout="${RUN}/${component}.stdout"
pid="${RUN}/${component}.pid"

# Set default scheduling priority
if [ "$NICENESS" = "" ]; then
  export NICENESS=0
fi

case $action in

  (start)
    if [ -f $pid ]; then
      PID=$(cat ${pid})
      if ps -p ${PID} > /dev/null 2>&1; then
        echo $component running as process ${PID}.
        exit 1
      fi
    fi

    rotate_log $stdout
    echo "starting $component, stdout -> $stdout"
    case ${component} in
      nuve )
        if ! pgrep -f rabbitmq; then
          sudo echo
          sudo rabbitmq-server > ${RUN}/rabbit.log &
        fi
        TARGET=${ROOT}/src/nuve
        ;;
      controller )
        TARGET=${ROOT}/src/erizo/controller
        ;;
      agent )
        TARGET=${ROOT}/src/erizo/agent
        ;;
      sample )
        TARGET=${ROOT}/extras/basic_example/app.js
        ;;
      * )
        echo $usage
        exit 1
        ;;
    esac

    nohup nice -n ${NICENESS} node ${TARGET} \
      > "${stdout}" 2>&1 </dev/null &
    echo $! > ${pid}

    sleep 1; [[ -f ${stdout} ]] && head "$stdout"
    ;;

  (stop)
    if [ -f $pid ]; then
      PID=$(cat ${pid})
      if ps -p ${PID} > /dev/null 2>&1; then
        if ! kill -0 ${PID} > /dev/null 2>&1; then
          echo cannot stop $component with pid ${PID} - permission denied
        else
          echo -n stopping $component
          kill ${PID} > /dev/null 2>&1
          while ps -p ${PID} > /dev/null 2>&1; do
            echo -n "."
            sleep 1;
          done
          echo
        fi
        if ! ps -p ${PID} > /dev/null 2>&1; then
          rm $pid
        fi
      else
        echo no $component to stop
      fi
    else
      echo no $component to stop
    fi
    ;;

  (status)
    if [ -f $pid ]; then
      PID=$(cat ${pid})
      if ps -p ${PID} > /dev/null 2>&1; then
        echo $component running as process ${PID}.
      else
        echo $component not running.
      fi
    else
      echo $component not running.
    fi
    ;;

  (*)
    echo $usage
    exit 1
    ;;

esac
