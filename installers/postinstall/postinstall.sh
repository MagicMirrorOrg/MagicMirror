#!/bin/sh

echo "\033[32mPrepare bower components ..."
npm install -g bower
bower install

echo "\033[32mMagicMirror installation successful!"
exit 0
