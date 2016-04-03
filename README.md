# MagicMirror V2
This version of the Magic Mirror software focusses on a modular plugin system. Besides that, the Magic Mirror software now also uses [Electron](http://electron.atom.io/), so no more webserver or browser installs necessary.

#WARNING: THIS VERSION IS IN A VERY EARLY STAGE. IT IS NOT COMPLETED YET. PLEASE USE THE MASTER BRANCH.

##Usage 
1. Download the latest node version:
`wget https://nodejs.org/dist/latest/node-v5.10.0-linux-armv6l.tar.gz` for Pi 1
`wget https://nodejs.org/dist/latest/node-v5.10.0-linux-armv7l.tar.gz` for Pi 2
2. Unpack file `tar -xvf filename`
3. Install `cd foldername && sudo cp -R * /usr/local/`
4. Set loglevel `npm config set loglevel info`
5. `npm install && npm start` (You may have to restart your terminal before this works)

**Important:** `npm start` does NOT work via SSH you have to execute it in a terminal session running in a window-manager.

##Configuration
1. Duplicate `config/config.js.sample` to `config/config.js`.
2. Modify your required settings.

##Todo
Things that still have to be implemented or changed.

####Main
- Allow show/hide animations to animate the height. This way the other modules won't jump around.

####Alert
- Vertical centering of alerts
- Rewrite the alert module in vanilla JavaScript

####Documentation
- Write all the documentation. :)

##Modules

### Default modules:
- [**Clock**](modules/default/clock)
- [**Calendar**](modules/default/calendar)
- [**Current Weather**](modules/default/currentweather)
- [**Weather Forecast**](modules/default/weatherforecast)
- [**News Feed**](modules/default/newsfeed)
- [**Compliments**](modules/default/compliments)
- [**Hello World**](modules/default/helloworld)
- [**Alert**](modules/default/alert)

### 3rd Party Modules:

- **[MMM-FRITZ-Box-Callmonitor by PaViRo](https://github.com/paviro/MMM-FRITZ-Box-Callmonitor)** <br> FRITZ!Box Callmonitor (Display an alert when someone is calling ...)

- **[MMM-Facial-Recognition by PaViRo](https://github.com/paviro/MMM-Facial-Recognition)** <br> Facial recognition and module swapping based on the current user ...

- **[MMM-Wunderlist by PaViRo](https://github.com/paviro/MMM-Wunderlist)** <br> Displays your Wunderlist todos on your mirror ...
