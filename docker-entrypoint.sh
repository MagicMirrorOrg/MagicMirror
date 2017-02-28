#!/bin/bash

if [ ! -f /opt/magic_mirror/modules ]; then
    cp -R /opt/magic_mirror/unmount_modules/. /opt/magic_mirror/modules
fi

if [ ! -f /opt/magic_mirror/config ]; then
    cp -R /opt/magic_mirror/unmount_config/. /opt/magic_mirror/config
fi

node serveronly
