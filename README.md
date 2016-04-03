# MagicMirror V2
This version of the Magic Mirror software focusses on a modular plugin system. Besides that, the Magic Mirror software now also uses [Electron](http://electron.atom.io/), so no more webserver or browser installs necessary. 

#WARNING: THIS VERSION IS IN A VERY EARLY STAGE. IT IS NOT COMPLETED YET. PLEASE USE THE MASTER BRANCH.

##Usage 
1. Install [Node.js](https://nodejs.org/en/)
2. Execute `npm install && npm start`.

##Configuration
1. Duplicate `config/config.js.sample` to `config/config.js`.
2. Modify your required settings.

##Todo
Things that still have to be implemented or changed.

####Main
- Allow show/hide animations to animate the height. This way the other modules won't jump around.
- Unified alerts (Blocking overlay & slide in notification) maybe using this [library](http://tympanus.net/Development/NotificationStyles/js/notificationFx.js) (from [this](http://tympanus.net/Development/NotificationStyles/growl-jelly.html) example) and [sweetalert](https://github.com/t4t5/sweetalert) for blocking?

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



