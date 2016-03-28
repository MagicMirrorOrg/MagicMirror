# MagicMirror V2
This version of the Magic Mirror software focusses on a modular plugin system. Besides that, the Magic Mirror software now also uses [Electron](http://electron.atom.io/), so no more webserver or browser installs necessary. 

##Usage 
1. Install [Node.js](https://nodejs.org/en/)
2. Execute `npm install && npm start`.

##Todo
Things that still have to be implemented or changed.
###Helper scripts
- Only start helper scripts of modules that are actually loaded in the UI (config.js)
- Notification system, so that not every helper scripts needs it's own socket to the UI.

#WARNING: THIS VERSION IS IN A VERY EARLY STAGE. IT IS NOT COMPLETED YET. PLEASE USE THE MASTER BRANCH.
