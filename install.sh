#!/usr/bin/env bash
# $$\      $$\                     $$\           $$\      $$\ $$\                                          $$$$$$\
# $$$\    $$$ |                    \__|          $$$\    $$$ |\__|                                        $$  __$$\
# $$$$\  $$$$ | $$$$$$\   $$$$$$\  $$\  $$$$$$$\ $$$$\  $$$$ |$$\  $$$$$$\   $$$$$$\   $$$$$$\   $$$$$$\  \__/  $$ |
# $$\$$\$$ $$ | \____$$\ $$  __$$\ $$ |$$  _____|$$\$$\$$ $$ |$$ |$$  __$$\ $$  __$$\ $$  __$$\ $$  __$$\  $$$$$$  |
# $$ \$$$  $$ | $$$$$$$ |$$ /  $$ |$$ |$$ /      $$ \$$$  $$ |$$ |$$ |  \__|$$ |  \__|$$ /  $$ |$$ |  \__|$$  ____/
# $$ |\$  /$$ |$$  __$$ |$$ |  $$ |$$ |$$ |      $$ |\$  /$$ |$$ |$$ |      $$ |      $$ |  $$ |$$ |      $$ |
# $$ | \_/ $$ |\$$$$$$$ |\$$$$$$$ |$$ |\$$$$$$$\ $$ | \_/ $$ |$$ |$$ |      $$ |      \$$$$$$  |$$ |      $$$$$$$$\
# \__|     \__| \_______| \____$$ |\__| \_______|\__|     \__|\__|\__|      \__|       \______/ \__|      \________|
#                        $$\   $$ |
#                        \$$$$$$  |
#                         \______/
#
# This is an installer script for MagicMirror2. It works well enough
# that it can detect if you have Node installed, run a binary script
# and then download and run MagicMirror2.
sudo apt-get install curl wget build-essential unzip
ARM=$(uname -m) # Determine which Pi is running.
NODE_LATEST="v5.10.0" # Set the latest version here.
6L_HASH="019a257faa5eebf6304686dfeffdbcb4c22f0547aa366f6e563aad39ab1b1ab1" # Set the armv6l hash here.
7L_HASH="3f7524d3db60175c2323bb2a0a13ad1ca7d47d4ede6f42834b6b8425be70e0a2" # Set the armv7l hash here.
8_HASH="df88803bda234b32240906b620315c8f6d6200332047a88cb0ec83009cf25dd5" # Set the arm64 hash here.
DOWNLOAD_URL="https://nodejs.org/dist/latest/node-$NODE_LATEST-linux-$ARM.tar.gz" # Construct the download URL.
wget $DOWNLOAD_URL # Download the file given.
if [ $ARM = "armv6l" ]; then
	if [ -f "node-$NODE_LATEST-linux-armv6l.tar.gz"]; then
		COMMAND256="sha256sum node-$NODE_LATEST-linux-armv6l.tar.gz"
		if [ $($COMMAND256) = "019a257faa5eebf6304686dfeffdbcb4c22f0547aa366f6e563aad39ab1b1ab1" ]; then
			echo "Node.js was downloaded and verified successfully."
		else
			echo "Node.js was downloaded, but verification failed. Make sure sha256sum works."
			exit 1
		fi
	fi
elif [ $ARM = "armv7l" ]; then
	if [ -f "node-$NODE_LATEST-linux-armv7l.tar.gz" ]; then
		COMMAND256="sha256sum node-$NODE_LATEST-linux-armv7l.tar.gz"
		if [ $($COMMAND256) = "3f7524d3db60175c2323bb2a0a13ad1ca7d47d4ede6f42834b6b8425be70e0a2" ]; then
			echo "Node.js was downloaded and verified successfully."
		else
			echo "Node.js was downloaded, but verification failed. Make sure sha256sum works."
			exit 1
		fi
	fi
elif [ $ARM = "arm64" ]; then
	if [ -f "node-$NODE_LATEST-linux-arm64.tar.gz" ]; then
		COMMAND256="sha256sum node-$NODE_LATEST-linux-arm64.tar.gz"
		if [ $($COMMAND256) = "df88803bda234b32240906b620315c8f6d6200332047a88cb0ec83009cf25dd5" ]; then
			echo "Node.js was downloaded and verified successfully."
		else
			echo "Node.js was downloaded, but verification failed. Make sure sha256sum works."
			exit 1
		fi
	fi
fi
tar xvf node-$NODE_LATEST-linux-$ARM.tar.gz
cd node*
sudo cp -R * /usr/local
cd ..
rm -rf node*
# Run Node checks to make sure Node works properly.
curl -sL https://deb.nodesource.com/test | bash -
npm config set loglevel info
if [ ! -f package.json ]; then
	wget https://github.com/nhubbard/MagicMirror/archive/v2-beta.zip
	unzip v2-beta.zip
	cd MagicMirror-2-beta
fi
npm install
echo "We're ready! Run `npm start` from the MagicMirror-2-beta directory (not over SSH) and enjoy MagicMirror2!"
