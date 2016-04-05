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
sudo apt-get install curl wget build-essential unzip || exit
ARM=$(uname -m) # Determine which Pi is running.
NODE_LATEST="v5.10.0" # Set the latest version here.
DOWNLOAD_URL="https://nodejs.org/dist/latest/node-$NODE_LATEST-linux-$ARM.tar.gz" # Construct the download URL.
wget $DOWNLOAD_URL || exit # Download the file given.
tar xvf node-$NODE_LATEST-linux-$ARM.tar.gz || exit
cd node* || exit
sudo cp -R * /usr/local || exit
cd .. || exit
rm -rf node* || exit
# Run Node checks to make sure Node works properly.
(curl -sL https://deb.nodesource.com/test | bash -) || exit
npm config set loglevel info
if [ ! -f package.json ]; then
	wget https://github.com/nhubbard/MagicMirror/archive/v2-beta.zip
	unzip v2-beta.zip
	cd MagicMirror-2-beta
fi
npm install || exit
echo "We're ready! Run `npm start` from the MagicMirror-2-beta directory (not over SSH) and enjoy MagicMirror2!"
