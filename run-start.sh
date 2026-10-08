#!/bin/bash
# use bash instead of sh
# get the folder  for this file
DIR=$(dirname "$0")
# make sure we are running in that folder
cd "$DIR" >/dev/null

# check for the old untrack css script
[ -f ./untrack-css.sh ] && ./untrack-css.sh

# if running under docker
if grep docker /proc/1/cgroup -qa; then
  #  only start electron
  electron js/electron.js $1;
else
  # not running in docker
  if [ -z "$DISPLAY" ]; then #If not set DISPLAY is SSH remote or tty
    export DISPLAY=:0 # Set by default display
  fi
  # get the processor architecture
  arch=$(uname -m)
  false='false'
  true='true'

  # get the config option, if any
  # only check non comment lines
  serveronly=$(grep -v '^[[:blank:]]*//' config/config.js | grep -i serveronly: | tr -d ',"'\''\r' | tr -d ' ' | awk -F/ '{print $1}'  |  awk -F: '{print $2}')
  # set default if not defined in config
  serveronly=${serveronly:-false}
  # check for xwindows running
  while [ 1 -eq 1 ];
  do
    xorg=$(pgrep Xorg)

    if [ "$xorg." == "." ]; then
       # check for x on Lubuntu
       xorg=$(pgrep X)
    fi
    # if user set wait_for_x to some value (ANY value)
    if [ "$wait_for_x." != "." ]; then
      if [ "$xorg." != "." ]; then
        # then break from loop
        break;
      else
        # sleep for 1 second
        sleep 1
      fi
    else
      # exit loop, not waiting, default
      break;
    fi
  done
  #check for macOS
  mac=$(uname)
  el_installed=$true
  if [ ! -d node_modules/electron ]; then
    el_installed=$false
  fi
  #
  # if the user requested serveronly OR
  #    electron support for armv6l has been dropped OR
  #    system is in text mode
  #
  if [ "$serveronly." != "$false." -o  "$arch" == "armv6l" -o "$arch" == "i686" -o $el_installed == $false  ]  ||  [ "$xorg." == "." -a $mac != 'Darwin' -a "$wait_for_x." != "." ]; then

      t=$(ps -ef | grep  "node serveronly" | grep -m1 -v color | awk '{print $2}')
      if [ "$t." != '.' ]; then
        sudo kill -9 $t >/dev/null 2>&1
      fi
    # if user explicitly configured to run server only (no ui local)
    # OR there is no xwindows running, so no support for browser graphics
    if [ "$serveronly." == "$true." ] || [ "$xorg." == "." -a $mac != 'Darwin' -a "$wait_for_x." != "." ]; then
      # start server mode,
      node serveronly
    else
      # start the server in the background
      # wait for server to be ready
      # need bash for this
      exec 3< <(node serveronly)

      # Read the output of server line by line until one line 'point your browser'
      while read line; do
         case "$line" in
         *point\ your\ browser*)
            echo $line
            break
            ;;
         *)
            echo $line
            #sleep .25
            ;;
         esac
      done <&3

      # Close the file descriptor
      #exec 3<&-

      # lets use chrome to display here now
      # get the server port address from the ready message
      port=$(echo $line | awk -F\: '{print $4}')
      # start chromium
      echo "Starting chromium browser now, have patience, it takes a minute"
      # continue to spool stdout to console
      tee <&3 &
      if [ "$external_browser." == "." ]; then
      	if [ $mac != 'Darwin' ]; then
          	b="chromium"
            if [ $(which $b). == '.' -o $arch == 'armv6l' ]; then
              b='chromium-browser'
            fi
          	if [ $(which $b). != '.' ]; then
              rm -rf ~/.config/$b 2>/dev/null
              r=$(mktemp -d "${TMPDIR:-/tmp}"/tmp.XXXXXXXX)
              "$b" -noerrdialogs -kiosk -start_maximized --new-window --site-per-process --no-zygote --no-sandbox --disable-infobars --app=http://localhost:$port  --ignore-certificate-errors-spki-list --ignore-ssl-errors --ignore-certificate-errors --user-data-dir=$r 2>/dev/null
              rm -rf $r >/dev/null
            else
              echo "Chromium_browser not installed"
              # if we can't start chrome,
              # get the server process id
              ns=$(ps -ef | grep  "node serveronly" | grep -m1 -v color | awk '{print $2}')
              # if we have the process id
              if [ "$ns". != "." ]; then
                  # kill server for restart
                  sudo kill -9 $ns >/dev/null 2>&1
              fi
          	fi
      	else
      	  open -a "Google Chrome" http://localhost:$port --args -noerrdialogs -kiosk -start_maximized  --disable-infobars --ignore-certificate-errors-spki-list --ignore-ssl-errors --ignore-certificate-errors 2>/dev/null
      	fi
      else
        if [ "$(which $external_browser)." !=  "." ]; then
          if [ "$external_browser" == "midori" ]; then
            "$external_browser" http://localhost:$port -e Fullscreen Navigationbar  >/dev/null 2>&1
          else
            echo "don't know how to launch $external_browser"
          fi
        else
          echo "couldn't locate $external_browser from the command shell,. check the PATH environment variable"
        fi
      fi
      exit
    fi
  else
    # we can use electron directly
    node_modules/.bin/electron js/electron.js $1;
  fi
fi
