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

echo "Installing helper tools ..."
sudo apt-get install curl wget build-essential unzip || exit
ARM=$(uname -m) # Determine which Pi is running.
NODE_LATEST=$(curl -l http://api.jordidepoortere.com/nodejs-latest/) # Fetch the latest version of Node.js.
DOWNLOAD_URL="https://nodejs.org/dist/latest/node-$NODE_LATEST-linux-$ARM.tar.gz" # Construct the download URL.

echo "Installing Latest Node.js ..."
mkdir ~/.MagicMirrorInstaller || exit
cd  ~/.MagicMirrorInstaller || exit
wget $DOWNLOAD_URL || exit # Download the file given.
tar xvf node-$NODE_LATEST-linux-$ARM.tar.gz || exit
cd node* || exit
sudo cp -R * /usr/local || exit
cd ~ || exit
rm -Rf ~/.MagicMirrorInstaller || exit

echo "Cloning MagicMirror ..."
git clone -b v2-beta https://github.com/MichMich/MagicMirror.git || exit
cd ~/MagicMirror  || exit
npm install || exit
echo "We're ready! Run [DISPLAY=:0 npm start] from the MagicMirror directory."
