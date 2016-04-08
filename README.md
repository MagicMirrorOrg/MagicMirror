# MagicMirror²

[![Dependency Status](https://david-dm.org/MichMich/MagicMirror/v2-beta.svg)](https://david-dm.org/MichMich/MagicMirror/v2-beta)
[![devDependency Status](https://david-dm.org/MichMich/MagicMirror/v2-beta/dev-status.svg)](https://david-dm.org/MichMich/MagicMirror/v2-beta#info=devDependencies)

This version of the Magic Mirror software focusses on a modular plugin system. Besides that, the Magic Mirror software now also uses [Electron](http://electron.atom.io/), so no more webserver or browser installs necessary.

**WARNING!** This version is in a *very* early stage. It is **not** completed yet. **Please** use the master branch.

## Usage 

#### Automatic Installer (Raspberry Pi Only!)

1. Clone the repository: `git clone -b v2-beta https://github.com/MichMich/MagicMirror`
2. Enter the new directory: `cd MagicMirror`
3. Give the installer permission to run: `sudo chmod +x install.sh`
4. Start the installer: `sudo ./install.sh`


#### Manual Installation

1. Download the latest Node.js version:
  - `wget https://nodejs.org/dist/latest/node-v5.10.0-linux-armv6l.tar.gz` for Raspberry Pi
  - `wget https://nodejs.org/dist/latest/node-v5.10.0-linux-armv7l.tar.gz` for Raspberry Pi 2
  - `wget https://nodejs.org/dist/latest/node-v5.10.0-linux-arm64.tar.gz` for Raspberry Pi 3
2. Unpack the archive file: `tar -xvf filename.tar.gz`
3. Install Node.js: `cd foldername && sudo cp -R * /usr/local/`
4. Set loglevel `npm config set loglevel info`
5. Clone the repository and check out the beta branch: `git clone -b v2-beta https://github.com/MichMich/MagicMirror`
6. Enter the repository: `cd MagicMirror`
7. `npm install && npm start` (You may have to restart your terminal before this works!)

**Important:** `npm start` does **not** work via SSH, use `DISPLAY=:0 nohup npm start &` instead. This starts the mirror on the remote display.

## Configuration

1. Duplicate `config/config.js.sample` to `config/config.js`.
2. Modify your required settings.

## Todo List

Here is a list of various things that still have to be implemented or changed.

- [ ] Allow show/hide animations to animate the height. This way, the other modules won't jump around.
- [ ] Allow vertical centering of alerts.
- [ ] Rewrite the [alert](modules/default/alert) module in vanilla JavaScript.
- [ ] Write all the documentation.

## Modules

The following modules are installed by default.

- [**Clock**](modules/default/clock)
- [**Calendar**](modules/default/calendar)
- [**Current Weather**](modules/default/currentweather)
- [**Weather Forecast**](modules/default/weatherforecast)
- [**News Feed**](modules/default/newsfeed)
- [**Compliments**](modules/default/compliments)
- [**Hello World**](modules/default/helloworld)
- [**Alert**](modules/default/alert)

The following modules are created by their respective authors.

- **[MMM-FRITZ-Box-Callmonitor by PaViRo](https://github.com/paviro/MMM-FRITZ-Box-Callmonitor)** <br> FRITZ!Box Callmonitor (Display an alert when someone is calling ...)

- **[MMM-Facial-Recognition by PaViRo](https://github.com/paviro/MMM-Facial-Recognition)** <br> Facial recognition and module swapping based on the current user ...

- **[MMM-Wunderlist by PaViRo](https://github.com/paviro/MMM-Wunderlist)** <br> Displays your Wunderlist todos on your mirror ...
 
- **[MMM-wordnik by Vendittelli](https://github.com/SVendittelli/MMM-wordnik)** <br> Get the word of the day, its definition, and origin ...

## Contributing

Contributions of all kinds are welcome, not only in the form of code but also with regards bug reports and documentation.

Please keep the following in mind:

- **Bug Reports**:  Make sure you're running the latest version. If the issue(s) still persist: please open a clearly documented issue with a clear title. 
- **Minor Bug Fixes**: Please send a pull request with a clear explanation of the issue or a link to the isssue it solves.
- **Major Bug Fixes**: please discuss your approach in an GitHub issue before you start to alter a big part of the code.
- **New Features**: please please discuss in a GitHub issue before you start to alter a big part of the code. Without discussion upfront, the pull request will not be accepted / merged.

Thanks for your help in making Magic Mirror better! 
