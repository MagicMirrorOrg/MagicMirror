#!/bin/bash

# This is an installer script for MagicMirror2. It works well enough
# that it can detect if you have Node installed, run a binary script
# and then download and run MagicMirror2.

echo -e "\e[0m"
echo '$$\      $$\                     $$\           $$\      $$\ $$\                                          $$$$$$\'
echo '$$$\    $$$ |                    \__|          $$$\    $$$ |\__|                                        $$  __$$\'
echo '$$$$\  $$$$ | $$$$$$\   $$$$$$\  $$\  $$$$$$$\ $$$$\  $$$$ |$$\  $$$$$$\   $$$$$$\   $$$$$$\   $$$$$$\  \__/  $$ |'
echo '$$\$$\$$ $$ | \____$$\ $$  __$$\ $$ |$$  _____|$$\$$\$$ $$ |$$ |$$  __$$\ $$  __$$\ $$  __$$\ $$  __$$\  $$$$$$  |'
echo '$$ \$$$  $$ | $$$$$$$ |$$ /  $$ |$$ |$$ /      $$ \$$$  $$ |$$ |$$ |  \__|$$ |  \__|$$ /  $$ |$$ |  \__|$$  ____/'
echo '$$ |\$  /$$ |$$  __$$ |$$ |  $$ |$$ |$$ |      $$ |\$  /$$ |$$ |$$ |      $$ |      $$ |  $$ |$$ |      $$ |'
echo '$$ | \_/ $$ |\$$$$$$$ |\$$$$$$$ |$$ |\$$$$$$$\ $$ | \_/ $$ |$$ |$$ |      $$ |      \$$$$$$  |$$ |      $$$$$$$$\'
echo '\__|     \__| \_______| \____$$ |\__| \_______|\__|     \__|\__|\__|      \__|       \______/ \__|      \________|'
echo '                       $$\   $$ |'
echo '                       \$$$$$$  |'
echo '                        \______/'
echo -e "\e[0m"

# Define the tested version of Node.js.
NODE_TESTED="v5.1.0"
NPM_TESTED="V6.0.0"
USER=`whoami`
PM2_FILE=~/MagicMirror/installers/pm2_MagicMirror.json

# Determine which Pi is running.
ARM=$(uname -m) 

# Check the Raspberry Pi version.
if [ "$ARM" != "armv7l" ]; then
  read -p "this appears not to be a Raspberry Pi 2 or 3, do you want to continue installtion (y/N)?" choice 
	if [[ $choice =~ ^[Nn]$ ]]; then 
		echo -e "\e[91mSorry, your Raspberry Pi is not supported."
		echo -e "\e[91mPlease run MagicMirror on a Raspberry Pi 2 or 3."
		echo -e "\e[91mIf this is a Pi Zero, you are in the same boat as the original Raspberry Pi. You must run in server only mode."
	exit;
	fi
fi

    
# Define helper methods.
function command_exists () { type "$1" &> /dev/null ;}
function verlte() {  [ "$1" = "`echo -e "$1\n$2" | sort -V | head -n1`" ];}
function verlt() { [ "$1" = "$2" ] && return 1 || verlte $1 $2 ;}

# Update before first apt-get
echo -e "\e[96mUpdating packages ...\e[90m"
sudo apt-get update || echo -e "\e[91mUpdate failed, carrying on installation ...\e[90m"

# Installing helper tools
echo -e "\e[96mInstalling helper tools ...\e[90m"
sudo apt-get --assume-yes install curl wget git build-essential unzip || exit

# Check if we need to install or upgrade Node.js.
echo -e "\e[96mCheck current Node installation ...\e[0m"
NODE_INSTALL=false
if command_exists node; then
	echo -e "\e[0mNode currently installed. Checking version number.";
	NODE_CURRENT=$(node -v)
	echo -e "\e[0mMinimum Node version: \e[1m$NODE_TESTED\e[0m"
	echo -e "\e[0mInstalled Node version: \e[1m$NODE_CURRENT\e[0m"
	if verlte $NODE_CURRENT $NODE_TESTED; then
		echo -e "\e[96mNode should be upgraded.\e[0m"
		NODE_INSTALL=true

		# Check if a node process is currenlty running.
		# If so abort installation.
		if pgrep "node" > /dev/null; then
			echo -e "\e[91mA Node process is currently running. Can't upgrade."
			echo "Please quit all Node processes and restart the installer."
			exit;
		fi

	else
		echo -e "\e[92mNo Node.js upgrade necessary.\e[0m"
	fi

else
	echo -e "\e[93mNode.js is not installed.\e[0m";
	NODE_INSTALL=true
fi

# Install or upgrade node if necessary.
if $NODE_INSTALL; then
	
	echo -e "\e[96mInstalling Node.js ...\e[90m"

	# Fetch the latest version of Node.js from the selected branch
	# The NODE_STABLE_BRANCH variable will need to be manually adjusted when a new branch is released. (e.g. 7.x)
	# Only tested (stable) versions are recommended as newer versions could break MagicMirror.
	
	NODE_STABLE_BRANCH="10.x"
 	curl -sL https://deb.nodesource.com/setup_$NODE_STABLE_BRANCH | sudo -E bash -
 	sudo apt-get install -y nodejs
	echo -e "\e[92mNode.js installation Done!\e[0m"
fi

# Check if we need to install or upgrade npm.
echo -e "\e[96mCheck current NPM installation ...\e[0m"
NPM_INSTALL=false
if command_exists npm; then
	echo -e "\e[0mNPM currently installed. Checking version number.";
	NPM_CURRENT='V'$(npm -v)
	echo -e "\e[0mMinimum npm version: \e[1m$NPM_TESTED\e[0m"
	echo -e "\e[0mInstalled npm version: \e[1m$NPM_CURRENT\e[0m"
	if verlte $NPM_CURRENT $NPM_TESTED; then
		echo -e "\e[96mnpm should be upgraded.\e[0m"
		NPM_INSTALL=true

		# Check if a node process is currently running.
		# If so abort installation.
		if pgrep "npm" > /dev/null; then
			echo -e "\e[91mA npm process is currently running. Can't upgrade."
			echo "Please quit all npm processes and restart the installer."
			exit;
		fi

	else
		echo -e "\e[92mNo npm upgrade necessary.\e[0m"
	fi

else
	echo -e "\e[93mnpm is not installed.\e[0m";
	NPM_INSTALL=true
fi

# Install or upgrade node if necessary.
if $NPM_INSTALL; then
	
	echo -e "\e[96mInstalling npm ...\e[90m"

  sudo apt-get install -y npm
	echo -e "\e[92mnpm installation Done!\e[0m"
fi

# Install MagicMirror
cd ~
if [ -d "$HOME/MagicMirror" ] ; then
	echo -e "\e[93mIt seems like MagicMirror is already installed."
	echo -e "To prevent overwriting, the installer will be aborted."
	echo -e "Please rename the \e[1m~/MagicMirror\e[0m\e[93m folder and try again.\e[0m"
	echo ""
	echo -e "If you want to upgrade your installation run \e[1m\e[97mgit pull\e[0m from the ~/MagicMirror directory."
	echo ""
	exit;
fi

echo -e "\e[96mCloning MagicMirror ...\e[90m"
if git clone --depth=1 https://github.com/MichMich/MagicMirror.git; then 
	echo -e "\e[92mCloning MagicMirror Done!\e[0m"
else
	echo -e "\e[91mUnable to clone MagicMirror."
	exit;
fi

cd ~/MagicMirror  || exit
echo -e "\e[96mInstalling dependencies ...\e[90m"
if npm install; then 
	echo -e "\e[92mDependencies installation Done!\e[0m"
else
	echo -e "\e[91mUnable to install dependencies!"
	exit;
fi

# Use sample config for start MagicMirror
cp config/config.js.sample config/config.js

# Check if plymouth is installed (default with PIXEL desktop environment), then install custom splashscreen.
echo -e "\e[96mCheck plymouth installation ...\e[0m"
if command_exists plymouth; then
	THEME_DIR="/usr/share/plymouth/themes"
	echo -e "\e[90mSplashscreen: Checking themes directory.\e[0m"
	if [ -d $THEME_DIR ]; then
		echo -e "\e[90mSplashscreen: Create theme directory if not exists.\e[0m"
		if [ ! -d $THEME_DIR/MagicMirror ]; then
			sudo mkdir $THEME_DIR/MagicMirror
		fi

		if sudo cp ~/MagicMirror/splashscreen/splash.png $THEME_DIR/MagicMirror/splash.png && sudo cp ~/MagicMirror/splashscreen/MagicMirror.plymouth $THEME_DIR/MagicMirror/MagicMirror.plymouth && sudo cp ~/MagicMirror/splashscreen/MagicMirror.script $THEME_DIR/MagicMirror/MagicMirror.script; then
			echo -e "\e[90mSplashscreen: Theme copied successfully.\e[0m"
			if sudo plymouth-set-default-theme -R MagicMirror; then
				echo -e "\e[92mSplashscreen: Changed theme to MagicMirror successfully.\e[0m"
			else
				echo -e "\e[91mSplashscreen: Couldn't change theme to MagicMirror!\e[0m"
			fi
		else
			echo -e "\e[91mSplashscreen: Copying theme failed!\e[0m"
		fi
	else
		echo -e "\e[91mSplashscreen: Themes folder doesn't exist!\e[0m"
	fi
else
	echo -e "\e[93mplymouth is not installed.\e[0m";
fi

# Use pm2 control like a service MagicMirror
read -p "Do you want use pm2 for auto starting of your MagicMirror (y/N)?" choice
if [[ $choice =~ ^[Yy]$ ]]; then
    #
    #  check if this is a mac
    #
    mac=$(uname -s)
    up=""
    if [ $mac == 'Darwin' ]; then 
       up="--unsafe-perm"
    fi
    sudo npm install $up -g pm2
	if [[ "$(ps --no-headers -o comm 1)" =~ systemd ]]; then #Checking for systemd
		pm2 startup systemd -u $USER --hp /home/$USER
	else
		sudo su -c "env PATH=$PATH:/usr/bin pm2 startup linux -u $USER --hp /home/$USER"
	fi
  if [ "USER"  != "pi" ]; then 
		sed 's/pi/'$USER'/g' mm.sh >mm.sh
    sed 's/pi/'$USER'/g' $PM2_FILE > ~/MagicMirror/installers/pm2_MagicMirror_new.json
    PM2_FILE=~/MagicMirror/installers/pm2_MagicMirror_new.json
  fi
	pm2 start $PM2_FILE 
	pm2 save
fi
# Disable Screensaver
if [ -d "/etc/xdg/lxsession" ]; then
	read -p "Do you want to disable the screen saver? (y/N)?" choice
	if [[ $choice =~ ^[Yy]$ ]]; then
		sudo su -c "echo -e '@xset s noblank\n@xset s off\n@xset -dpms' >> /etc/xdg/lxsession/LXDE-pi/autostart"
		export DISPLAY=:0; xset s noblank;xset s off;xset -dpms
	fi
else
	echo " "
	echo -e "unable to disable screen saver, /etc/xdg/lxsession does not exist"
fi

echo " "
echo -e "\e[92mWe're ready! Run \e[1m\e[97mDISPLAY=:0 npm start\e[0m\e[92m from the ~/MagicMirror directory to start your MagicMirror.\e[0m"
echo " "
echo " "
