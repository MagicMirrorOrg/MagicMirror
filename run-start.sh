#!/bin/bash
  # use bash instead of sh
./untrack-css.sh

if [ -z "$DISPLAY" ]; then #If not set DISPLAY is SSH remote or tty
	export DISPLAY=:0 # Set by default display
fi
# get the processor architecture
arch=$(uname -m)
false='false'

# get the config option, if any
# only check non comment lines
serveronly=$(grep -v '^\s//'  config/config.js | grep -i serveronly: | awk '{print tolower($2)}' | tr -d ,\"\')
# set default if not defined in config
serveronly=${serveronly:-false}
# check for xwindows running
xorg=$(pgrep Xorg)
#check for macOS
mac=$(uname)
#
# if the user requested serveronly OR 
#    electron support for armv6l has been dropped OR
#    system is in text mode
#
if [ "$serveronly." != "false." -o  "$arch" == "armv6l" ] ||  [ "$xorg." == "." -a $mac != 'Darwin' ]; then

	# if user explicitly configured to run server only (no ui local)
	# OR there is no xwindows running, so no support for browser graphics
	if [ "$serveronly." == "true." -o "$xorg." == "." ]; then
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
		exec 3<&-	

		# lets use chrome to display here now
		# get the server port address from the ready message
		port=$(echo $line | awk -F\: '{print $4}')	
		# start chromium 
		echo "Starting chromium browser now, have patience, it takes a minute"
		chromium-browser -noerrdialogs -kiosk -start_maximized  --disable-infobars --app=http://localhost:$port  --ignore-certificate-errors-spki-list --ignore-ssl-errors --ignore-certificate-errors 2>/dev/null
		exit		  
	fi 
else  
	# we can use electron directly	
	electron js/electron.js $1;
fi
