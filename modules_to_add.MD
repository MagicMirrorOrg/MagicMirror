Think about running on RPI-Lite: https://github.com/MichMich/MagicMirror/wiki/Jessie-Lite-Installation-Guide


Module: MMM-SystemStats (https://github.com/BenRoe/MMM-SystemStats)
- shows the processor temperature, system load and available RAM.

Steps to install:
  1. git clone https://github.com/BenRoe/MMM-SystemStats
  2. cd MMM-SystemStats
  3. npm install
  4. configure the module (config/config.js)

Add the follow in front of a  },
  {
        module: 'MMM-SystemStats',
        position: 'bottom_right',
        classes: 'small dimmed',
        config: {
            updateInterval: 100000,
            animationSpeed: 0,
        },
    },
