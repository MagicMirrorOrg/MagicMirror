#!/bin/bash
# Define the tested version of Node.js.
NODE_TESTED="v10.1.0"
NPM_TESTED="V6.0.0"
USER=`whoami`
PM2_FILE=pm2_MagicMirror.json
mac=$(uname -s)
if [ $mac == 'Darwin' ]; then
	cmd=greadlink
else
	cmd=readlink
fi

if [ -d ~/MagicMirror ]; then
	# put the log where the script is located
	logdir=$(dirname $($cmd -f "$0"))
	# if the script was execute from the web
	if [[ $logdir != *"MagicMirror/installers"* ]]; then
		# use the MagicMirror/installers folder
		cd ~/MagicMirror/installers >/dev/null
		logdir=$(pwd)
		cd - >/dev/null
	fi
	logfile=$logdir/pm2_setup.log
	echo the log will be saved in $logfile
	date +"pm2 setup starting - %a %b %e %H:%M:%S %Z %Y" >>$logfile	  
			echo system is $(uname -a) >> $logfile
			if [ "$mac"  == "Darwin" ]; then				
			  echo the os is macOS $(sw_vers -productVersion) >> $logfile				
			else 
				echo the os is $(lsb_release -a 2>/dev/null) >> $logfile
			fi 
			node_installed=$(which node)
			if [ "$node_installed." == "." ]; then 
				 # node not installed
				echo Installing node >>$logfile
				if [ $mac == 'Darwin' ]; then
					brew install node
				else	
					NODE_STABLE_BRANCH="10.x"
					curl -sL https://deb.nodesource.com/setup_$NODE_STABLE_BRANCH | sudo -E bash -
					sudo apt-get install -y nodejs
				fi 			 
			fi 
			node_version=$(node -v)
			echo node version $node_version >>$logfile
			npm_installed=$(which npm)
			if [ "$npm_installed." == "." ]; then 
				 # npm not installed
				echo Installing npm >>$logfile
				if [ $mac != 'Darwin' ]; then
					sudo apt-get install -y npm
				fi 			 
			fi 		
			# get latest 
			echo force installing latest npm version via npm >>$logfile
			#sudo npm i -g npm 		
			npm_version=$(npm -v)
			echo npm version $npm_version >>$logfile		
			# assume pm2 will be found on the path
			pm2cmd=pm2		
			up=""
			if [ $mac == 'Darwin' ]; then 
				 up="--unsafe-perm"
				 launchctl=launchctl
				 launchctl_path=$(which $launchctl)
				 `export PATH=$PATH:${launchctl_path%/$launchctl}`
			fi			
			# check to see if already installed
			pm2_installed=$(which $pm2cmd)
			if [  "$pm2_installed." != "." ]; then
			    # does it work?
					echo pm2 installed >> $logfile					
					pm2_fails=$(pm2 list | grep -i -m 1 "App Name" | wc -l )
					if [ $pm2_fails != 1 ]; then
					   # uninstall it
						 echo pm2 installed, but does not work, uninstalling >> $logfile
					   sudo npm uninstall $up -g pm2
						 # force reinstall
				     pm2_installed=
					fi
			fi
			# in not installed
			if [  "$pm2_installed." == "." ]; then 
				# install it. 			
				echo pm2 not installed, installing >>$logfile			
				result=$(sudo npm install $up -g pm2)
				# if this is a mac
				if [ $mac == 'Darwin' ]; then 
					echo this is a mac, fixup for path >>$logfile
					# get the location of pm2 install
					# parse the npm install output to get the command
					pm2cmd=`echo $result | awk -F -  '{print $1}' | tr -d '[:space:]'`
					c='/pm2'		
					# get the path only
					echo ${pm2cmd%$c} >installers/pm2path				
				fi	
			fi
	    # remove MagicMirror if defined
			$pm2cmd delete MagicMirror >/dev/null 2>&1
			cd ~/MagicMirror 			
			echo get the pm2 platform specific startup command >>$logfile
			# get the platform specific pm2 startup command
			v=$($pm2cmd startup | tail -n 1)
			if [ $mac != 'Darwin' ]; then
				# check to see if we can get the OS package name (Ubuntu)
				if [ $(which lsb_release| wc -l) >0 ]; then 
					# fix command
					# if ubuntu 18.04, pm2 startup gets something wrong				
					if [ $(lsb_release  -r | grep -m1 18.04 | wc -l) > 0 ]; then
						 v=$(echo $v | sed 's/\/bin/\/bin:\/bin/')
					fi 
				fi
			fi 
			echo startup command = $v >>$logfile
			# execute the command returned				
		  $v 2>&1 >>$logfile
			echo pm2 startup command done >>$logfile
			# is this is mac 
			# need to fix pm2 startup, only on catalina
			if [ $mac == 'Darwin' ]; then 
				if [ $(sw_vers -productVersion | head -c 6) == '10.15.' ]; then
					# only do if the faulty tag is present (pm2 may fix this, before the script is fixed)
					if [ $(grep -m 1 UserName /Users/$USER/Library/LaunchAgents/pm2.$USER.plist | wc -l) -eq 1 ]; then 
						# copy the pm2 startup file config
						cp  /Users/$USER/Library/LaunchAgents/pm2.$USER.plist .
						# edit out the UserName key/value strings
						sed -e '/UserName/{N;d;}' pm2.$USER.plist > pm2.$USER.plist.new
						# copy the file back 
						sudo cp pm2.$USER.plist.new /Users/$USER/Library/LaunchAgents/pm2.$USER.plist
					fi 
				fi
			fi
			
		# if the user is no pi, we have to fixup the pm2 json file 
		echo configure the pm2 config file for MagicMirror >>$logfile
		if [ "$USER"  != "pi" ]; then 
			echo the user is not pi >>$logfile
			# go to the installers folder`
			cd installers
			# edit the startup script for the right user		
			echo change mm.sh >>$logfile
			 if [ ! -e mm_temp.sh ]; then
			   echo save copy of mm.sh >> $logfile
			   cp mm.sh mm_temp.sh
			 fi 
			 if [ $(grep pi mm_temp.sh | wc -l) -gt 0 ]; then
			  echo change hard coded pi username  >> $logfile
				sed 's/pi/'$USER'/g' mm_temp.sh >mm.sh
			 else
			  echo change relative home path to hard coded path >> $logfile
			  hf=$(echo $HOME |sed 's/\//\\\//g')
			  sed 's/\~/'$hf'/g' mm_temp.sh >mm.sh
			 fi			
			# edit the pms config file for the right user
			echo change $PM2_FILE >>$logfile
			sed 's/pi/'$USER'/g' $PM2_FILE > pm2_MagicMirror_new.json
			# make sure to use the updated file
			PM2_FILE=pm2_MagicMirror_new.json
			# if this is a mac
			if [ $mac == 'Darwin' ]; then 
				 # copy the path file to the system paths list
				 sudo cp ./pm2path /etc/paths.d
				 # change the name of the home path for mac
				 sed 's/home/Users/g' $PM2_FILE > pm2_MagicMirror_new1.json
				 # make sure to use the updated file
				 PM2_FILE=pm2_MagicMirror_new1.json
			fi
			echo now using this config file $PM2_FILE >>$logfile
			# go back one cd level
			cd - >/dev/null
		fi
		echo start MagicMirror via pm2 now >>$logfile
		# tell pm2 to start the app defined in the config file
		$pm2cmd start $HOME/MagicMirror/installers/$PM2_FILE  
		# tell pm2 to save that configuration, for start at boot
		echo save MagicMirror pm2 config now  >>$logfile
		$pm2cmd save
		date +"pm2 setup completed - %a %b %e %H:%M:%S %Z %Y" >>$logfile
else
	echo It appears MagicMirror has not been installed on this system  
	echo please run the installer, "raspberry.sh" first  
fi