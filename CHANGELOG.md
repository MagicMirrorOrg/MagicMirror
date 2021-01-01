# MagicMirror² Change Log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](https://semver.org/).

❤️ **Donate:** Enjoying MagicMirror²? [Please consider a donation!](https://magicmirror.builders/donate) With your help we can continue to improve the MagicMirror²

## [2.14.0] - 2021-01-01

Special thanks to the following contributors: @Alvinger, @AndyPoms, @ashishtank, @bluemanos, @flopp999, @jakemulley, @jakobsarwary1, @marvai-vgtu, @mirontoli, @rejas, @sdetweil, @Snille & @Sub028.

ℹ️ **Note:** This update uses new dependencies. Please update using the following command: `git pull && npm install`.

### Added

- Added new log level "debug" to the logger.
- Added new parameter "useKmh" to weather module for displaying wind speed as kmh.
- Chuvash translation.
- Added Weatherbit as a provider to Weather module.
- Added SMHI as a provider to Weather module.
- Added Hindi & Gujarati translation.
- Added optional support for DEGREE position in Feels like translation.
- Added support for variables in nunjucks templates for translate filter.
- Added Chuvash translation.
- Calendar: new options "limitDays" and "coloredEvents".
- Added new option "limitDays" - limit the number of discreet days displayed.
- Added new option "customEvents" - use custom symbol/color based on keyword in event title.
- Added GitHub workflows for automated testing and changelog enforcement.

### Updated

- Merging .gitignore in the config-folder with the .gitignore in the root-folder.
- Weather module - forecast now show TODAY and TOMORROW instead of weekday, to make it easier to understand.
- Update dependencies to latest versions.
- Update dependencies eslint, feedme, simple-git and socket.io to latest versions.
- Update lithuanian translation.
- Update config sample.
- Highlight required version mismatch.
- No select Text for TouchScreen use.
- Corrected logic for timeFormat "relative" and "absolute".
- Added missing function call in module.show()
- Translator variables can have falsy values (e.g. empty string)
- Fix issue with weather module with DEGREE label in FEELS like

### Deleted

- Removed Travis CI intergration.

### Fixed

- JSON Parse translation files with comments crashing UI. (#2149)
- Calendar parsing where RRULE bug returns wrong date, add Windows timezone name support. (#2145, #2151)
- Wrong node-ical version installed (package.json) requested version. (#2153)
- Fix calendar fetcher subsequent timing. (#2160)
- Rename Greek translation to correct ISO 639-1 alpha-2 code (gr > el). (#2155)
- Add a space after icons of sunrise and sunset. (#2169)
- Fix calendar when no DTEND record found in event, startDate overlay when endDate set. (#2177)
- Fix windspeed convertion error in ukmetoffice weather provider. (#2189)
- Fix console.debug not having timestamps. (#2199)
- Fix calendar full day event east of UTC start time. (#2200)
- Fix non-fullday recurring rule processing. (#2216)
- Catch errors when parsing calendar data with ical. (#2022)
- Fix Default Alert Module does not hide black overlay when alert is dismissed manually. (#2228)
- Weather module - Always displays night icons when local is other then English. (#2221)
- Update Node-ical 0.12.4 , fix invalid RRULE format in cal entries
- Fix package.json for optional electron dependency (2378)
- Update node-ical version again, 0.12.5, change RRULE fix (#2371, #2379)
- Remove undefined objects from modules array (#2382)
- Update node-ical version again, 0.12.7, change RRULE fix (#2371, #2379), node-ical now throws error (which we catch)
- Update simple-git version to 2.31 unhandled promise rejection (#2383)

## [2.13.0] - 2020-10-01

Special thanks to the following contributors: @bryanzzhu, @bugsounet, @chamakura, @cjbrunner, @easyas314, @larryare, @oemel09, @rejas, @sdetweil & @sthuber90.

ℹ️ **Note:** This update uses new dependencies. Please update using the following command: `git pull && npm install`.

### Added

- `--dry-run` option adde in fetch call within updatenotification node_helper. This is to prevent
  MagicMirror from consuming any fetch result. Causes conflict with MMPM when attempting to check
  for updates to MagicMirror and/or MagicMirror modules.
- Test coverage with Istanbul, run it with `npm run test:coverage`.
- Add lithuanian language.
- Added support in weatherforecast for OpenWeather onecall API.
- Added config option to calendar-icons for recurring- and fullday-events.
- Added current, hourly (max 48), and daily (max 7) weather forecasts to weather module via OpenWeatherMap One Call API.
- Added eslint-plugin for jsdoc comments.
- Added new configDeepMerge option for module developers.

### Updated

- Change incorrect weather.js default properties.
- Cleaned up newsfeed module.
- Cleaned up jsdoc comments.
- Cleaned up clock tests.
- Move lodash into devDependencies, update other dependencies.
- Switch from ical to node-ical library.

### Fixed

- Fix backward compatibility issues for Safari < 11.
- Fix the use of "maxNumberOfDays" in the module "weatherforecast depending on the endpoint (forecast/daily or forecast)". [#2018](https://github.com/MichMich/MagicMirror/issues/2018)
- Fix calendar display. Account for current timezone. [#2068](https://github.com/MichMich/MagicMirror/issues/2068)
- Fix logLevel being set before loading config.
- Fix incorrect namespace links in svg clockfaces. [#2072](https://github.com/MichMich/MagicMirror/issues/2072)
- Fix weather/providers/weathergov for API guidelines. [#2045](https://github.com/MichMich/MagicMirror/issues/2045)
- Fix "undefined" in weather modules header. [#1985](https://github.com/MichMich/MagicMirror/issues/1985)
- Fix #2110, #2111, #2118: Recurring full day events should not use timezone adjustment. Just compare month/day.

## [2.12.0] - 2020-07-01

Special thanks to the following contributors: @AndreKoepke, @andrezibaia, @bryanzzhu, @chamakura, @DarthBrento, @Ekristoffe, @khassel, @Legion2, @ndom91, @radokristof, @rejas, @XBCreepinJesus & @ZoneMR.

ℹ️ **Note:** This update uses new dependencies. Please update using the following command: `git pull && npm install`.

### Added

- Added option to config the level of logging.
- Added prettier for an even cleaner codebase.
- Hide Sunrise/Sunset in Weather module.
- Hide Sunrise/Sunset in Current Weather module.
- Added Met Office DataHub (UK) provider.

### Updated

- Cleaned up alert module code.
- Cleaned up check_config code.
- Replaced grunt-based linters with their non-grunt equivalents.
- Switch to most of the eslint:recommended rules and fix warnings.
- Replaced insecure links with https ones.
- Cleaned up all "no-undef" warnings from eslint.
- Added location title wrapping for calendar module.
- Updated the BG translation.

### Deleted

- Removed truetype (ttf) fonts.

### Fixed

- The broken modules due to Socket.io change from last release. [#1973](https://github.com/MichMich/MagicMirror/issues/1973)
- Add backward compatibility for old module code in socketclient.js. [#1973](https://github.com/MichMich/MagicMirror/issues/1973)
- Support multiple instances of calendar module with different config. [#1109](https://github.com/MichMich/MagicMirror/issues/1109)
- Fix the use of "maxNumberOfDays" in the module "weatherforecast". [#2018](https://github.com/MichMich/MagicMirror/issues/2018)
- Throw error when check_config fails. [#1928](https://github.com/MichMich/MagicMirror/issues/1928)
- Bug fix related to 'maxEntries' not displaying Calendar events. [#2050](https://github.com/MichMich/MagicMirror/issues/2050)
- Updated ical library to latest version. [#1926](https://github.com/MichMich/MagicMirror/issues/1926)
- Fix config check after merge of prettier [#2109](https://github.com/MichMich/MagicMirror/issues/2109)

## [2.11.0] - 2020-04-01

🚨 READ THIS BEFORE UPDATING 🚨

In the past years the project has grown a lot. This came with a huge downside: poor maintainability. If I let the project continue the way it was, it would eventually crash and burn. More important: I would completely lose the drive and interest to continue the project. Because of this the decision was made to simplify the core by removing all side features like automatic installers and support for exotic platforms. This release (2.11.0) is the first real release that will reflect (parts) of these changes. As a result of this, some things might break. So before you continue make sure to backup your installation. Your config, your modules or better yet: your full MagicMirror folder. In other words: update at your own risk.

For more information regarding this major change, please check issue [#1860](https://github.com/MichMich/MagicMirror/issues/1860).

### Deleted

- Remove installers.
- Remove externalized scripts.
- Remove jshint dependency, instead eslint checks your config file now

### Added

- Brazilian translation for "FEELS".
- Ukrainian translation.
- Finnish translation for "PRECIP", "UPDATE_INFO_MULTIPLE" and "UPDATE_INFO_SINGLE".
- Added the ability to hide the temp label and weather icon in the `currentweather` module to allow showing only information such as wind and sunset/rise.
- The `clock` module now optionally displays sun and moon data, including rise/set times, remaining daylight, and percent of moon illumination.
- Added Hebrew translation.
- Add HTTPS support and update config.js.sample
- Run tests on long term support and latest stable version of nodejs
- Added the ability to configure a list of modules that shouldn't be update checked.
- Run linters on git commits
- Added date functionality to compliments: display birthday wishes or celebrate an anniversary
- Add HTTPS support for clientonly-mode.

### Fixed

- Force declaration of public ip address in config file (ISSUE #1852)
- Fixes `run-start.sh`: If running in docker-container, don't check the environment, just start electron (ISSUE #1859)
- Fix calendar time offset for recurring events crossing Daylight Savings Time (ISSUE #1798)
- Fix regression in currentweather module causing 'undefined' to show up when config.hideTemp is false
- Fix FEELS translation for Croatian
- Fixed weather tests [#1840](https://github.com/MichMich/MagicMirror/issues/1840)
- Fixed Socket.io can't be used with Reverse Proxy in serveronly mode [#1934](https://github.com/MichMich/MagicMirror/issues/1934)
- Fix update checking skipping 3rd party modules the first time

### Changed

- Remove documentation from core repository and link to new dedicated docs site: [docs.magicmirror.builders](https://docs.magicmirror.builders).
- Updated config.js.sample: Corrected some grammar on `config.js.sample` comment section.
- Removed `run-start.sh` script and update start commands:
  - To start using electron, use `npm run start`.
  - To start in server only mode, use `npm run server`.
- Remove redundant logging from modules.
- Timestamp in log output now also contains the date
- Turkish translation.
- Option to configure the size of the currentweather module.
- Changed "Gevoelstemperatuur" to "Voelt als" shorter text.

## [2.10.1] - 2020-01-10

### Changed

- Updated README.md: Added links to the official documentation website and remove links to broken installer.

## [2.10.0] - 2020-01-01

Special thanks to @sdetweil for all his great contributions!

ℹ️ **Note:** This update uses new dependencies. Please update using the following command: `git pull && npm install`.

### Added

- Timestamps in log output.
- Padding in dateheader mode of the calendar module.
- New upgrade script to help users consume regular updates installers/upgrade-script.sh.
- New script to help setup pm2, without install installers/fixuppm2.sh.

### Updated

- Updated lower bound of `lodash` and `helmet` dependencies for security patches.
- Updated compliments.js to handle newline in text, as textfields to not interpolate contents.
- Updated raspberry.sh installer script to handle new platform issues, split node/npm, pm2, and screen saver changes.
- Improve handling for armv6l devices, where electron support has gone away, add optional serveronly config option.
- Improved run-start.sh to handle for serveronly mode, by choice, or when electron not available.
- Only check for xwindows running if not on macOS.

### Fixed

- Fixed issue in weatherforecast module where predicted amount of rain was not using the decimal symbol specified in config.js.
- Module header now updates correctly, if a module need to dynamically show/hide its header based on a condition.
- Fix handling of config.js for serverOnly mode commented out.
- Fixed issue in calendar module where the debug script didn't work correctly with authentication.
- Fixed issue that some full day events were not correctly recognized as such.
- Display full day events lasting multiple days as happening today instead of some days ago if they are still ongoing.

## [2.9.0] - 2019-10-01

ℹ️ **Note:** This update uses new dependencies. Please update using the following command: `git pull && npm install`. If you are having issues running Electron, make sure your [Raspbian is up to date](https://www.raspberrypi.org/documentation/raspbian/updating.md).

### Added

- Spanish translation for "PRECIP".
- Adding a Malay (Malaysian) translation for MagicMirror².
- Add test check URLs of vendors 200 and 404 HTTP CODE.
- Add tests for new weather module and helper to stub ajax requests.

### Updated

- Updatenotification module: Display update notification for a limited (configurable) time.
- Enabled e2e/vendor_spec.js tests.
- The css/custom.css will be renamed after the next release. We've added into `run-start.sh` an instruction by GIT to ignore with `--skip-worktree` and `rm --cached`. [#1540](https://github.com/MichMich/MagicMirror/issues/1540)
- Disable sending of notification CLOCK_SECOND when displaySeconds is false.

### Fixed

- Updatenotification module: Properly handle race conditions, prevent crash.
- Send `NEWS_FEED` notification also for the first news messages which are shown.
- Fixed issue where weather module would not refresh data after a network or API outage. [#1722](https://github.com/MichMich/MagicMirror/issues/1722)
- Fixed weatherforecast module not displaying rain amount on fallback endpoint.
- Notifications CLOCK_SECOND & CLOCK_MINUTE being from startup instead of matched against the clock and avoid drifting.

## [2.8.0] - 2019-07-01

ℹ️ **Note:** This update uses new dependencies. Please update using the following command: `git pull && npm install`. If you are having issues running Electron, make sure your [Raspbian is up to date](https://www.raspberrypi.org/documentation/raspbian/updating.md).

### Added

- Option to show event location in calendar
- Finnish translation for "Feels" and "Weeks"
- Russian translation for “Feels”
- Calendar module: added `nextDaysRelative` config option
- Add `broadcastPastEvents` config option for calendars to include events from the past `maximumNumberOfDays` in event broadcasts
- Added feature to broadcast news feed items `NEWS_FEED` and updated news items `NEWS_FEED_UPDATED` in default [newsfeed](https://github.com/MichMich/MagicMirror/tree/develop/modules/default/newsfeed) module (when news is updated) with documented default and `config.js` options in [README.md](https://github.com/MichMich/MagicMirror/blob/develop/modules/default/newsfeed/README.md)
- Added notifications to default `clock` module broadcasting `CLOCK_SECOND` and `CLOCK_MINUTE` for the respective time elapsed.
- Added UK Met Office Datapoint feed as a provider in the default weather module.
- Added new provider class
- Added suncalc.js dependency to calculate sun times (not provided in UK Met Office feed)
- Added "tempUnits" and "windUnits" to allow, for example, temp in metric (i.e. celsius) and wind in imperial (i.e. mph). These will override "units" if specified, otherwise the "units" value will be used.
- Use Feels Like temp from feed if present
- Optionally display probability of precipitation (PoP) in current weather (UK Met Office data)
- Automatically try to fix eslint errors by passing `--fix` option to it
- Added sunrise and sunset times to weathergov weather provider [#1705](https://github.com/MichMich/MagicMirror/issues/1705)
- Added "useLocationAsHeader" to display "location" in `config.js` as header when location name is not returned
- Added to `newsfeed.js`: in order to design the news article better with css, three more class-names were introduced: newsfeed-desc, newsfeed-desc, newsfeed-desc

### Updated

- English translation for "Feels" to "Feels like"
- Fixed the example calendar url in `config.js.sample`
- Update `ical.js` to solve various calendar issues.
- Update weather city list url [#1676](https://github.com/MichMich/MagicMirror/issues/1676)
- Only update clock once per minute when seconds aren't shown

### Fixed

- Fixed uncaught exception, race condition on module update
- Fixed issue [#1696](https://github.com/MichMich/MagicMirror/issues/1696), some ical files start date to not parse to date type
- Allowance HTML5 autoplay-policy (policy is changed from Chrome 66 updates)
- Handle SIGTERM messages
- Fixes sliceMultiDayEvents so it respects maximumNumberOfDays
- Minor types in default NewsFeed [README.md](https://github.com/MichMich/MagicMirror/blob/develop/modules/default/newsfeed/README.md)
- Fix typos and small syntax errors, cleanup dependencies, remove multiple-empty-lines, add semi-rule
- Fixed issues with calendar not displaying one-time changes to repeating events
- Updated the fetchedLocationName variable in currentweather.js so that city shows up in the header

### Updated installer

- give non-pi2+ users (pi0, odroid, jetson nano, mac, windows, ...) option to continue install
- use current username vs hardcoded 'pi' to support non-pi install
- check for npm installed. node install doesn't do npm anymore
- check for mac as part of PM2 install, add install option string
- update pm2 config with current username instead of hard coded 'pi'
- check for screen saver config, "/etc/xdg/lxsession", bypass if not setup

## [2.7.1] - 2019-04-02

Fixed `package.json` version number.

## [2.7.0] - 2019-04-01

ℹ️ **Note:** This update uses new dependencies. Please update using the following command: `git pull && npm install`. If you are having issues running Electron, make sure your [Raspbian is up to date](https://www.raspberrypi.org/documentation/raspbian/updating.md).

### Added

- Italian translation for "Feels"
- Basic Klingon (tlhIngan Hol) translations
- Disabled the screensaver on raspbian with installation script
- Added option to truncate the number of vertical lines a calendar item can span if `wrapEvents` is enabled.
- Danish translation for "Feels" and "Weeks"
- Added option to split multiple day events in calendar to separate numbered events
- Slovakian translation
- Alerts now can contain Font Awesome icons
- Notifications display time can be set in request
- Newsfeed: added support for `ARTICLE_INFO_REQUEST` notification
- Add `name` config option for calendars to be sent along with event broadcasts

### Updated

- Bumped the Electron dependency to v3.0.13 to support the most recent Raspbian. [#1500](https://github.com/MichMich/MagicMirror/issues/1500)
- Updated modernizr code in alert module, fixed a small typo there too
- More verbose error message on console if the config is malformed
- Updated installer script to install Node.js version 10.x

### Fixed

- Fixed temperature displays in currentweather and weatherforecast modules [#1503](https://github.com/MichMich/MagicMirror/issues/1503), [#1511](https://github.com/MichMich/MagicMirror/issues/1511).
- Fixed unhandled error on bad git data in updatenotification module [#1285](https://github.com/MichMich/MagicMirror/issues/1285).
- Weather forecast now works with openweathermap in new weather module. Daily data are displayed, see issue [#1504](https://github.com/MichMich/MagicMirror/issues/1504).
- Fixed analogue clock border display issue where non-black backgrounds used (previous fix for issue 611)
- Fixed compatibility issues caused when modules request different versions of Font Awesome, see issue [#1522](https://github.com/MichMich/MagicMirror/issues/1522). MagicMirror now uses [Font Awesome 5 with v4 shims included for backwards compatibility](https://fontawesome.com/how-to-use/on-the-web/setup/upgrading-from-version-4#shims).
- Installation script problems with raspbian
- Calendar: only show repeating count if the event is actually repeating [#1534](https://github.com/MichMich/MagicMirror/pull/1534)
- Calendar: Fix exdate handling when multiple values are specified (comma separated)
- Calendar: Fix relative date handling for fulldate events, calculate difference always from start of day [#1572](https://github.com/MichMich/MagicMirror/issues/1572)
- Fix null dereference in moduleNeedsUpdate when the module isn't visible
- Calendar: Fixed event end times by setting default calendarEndTime to "LT" (Local time format). [#1479]
- Calendar: Fixed missing calendar fetchers after server process restarts [#1589](https://github.com/MichMich/MagicMirror/issues/1589)
- Notification: fixed background color (was white text on white background)
- Use getHeader instead of data.header when creating the DOM so overwriting the function also propagates into it
- Fix documentation of `useKMPHwind` option in currentweather

### New weather module

- Fixed weather forecast table display [#1499](https://github.com/MichMich/MagicMirror/issues/1499).
- Dimmed loading indicator for weather forecast.
- Implemented config option `decimalSymbol` [#1499](https://github.com/MichMich/MagicMirror/issues/1499).
- Aligned indoor values in current weather vertical [#1499](https://github.com/MichMich/MagicMirror/issues/1499).
- Added humidity support to nunjuck unit filter.
- Do not display degree symbol for temperature in Kelvin [#1503](https://github.com/MichMich/MagicMirror/issues/1503).
- Weather forecast now works with openweathermap for both, `/forecast` and `/forecast/daily`, in new weather module. If you use the `/forecast`-weatherEndpoint, the hourly data are converted to daily data, see issues [#1504](https://github.com/MichMich/MagicMirror/issues/1504), [#1513](https://github.com/MichMich/MagicMirror/issues/1513).
- Added fade, fadePoint and maxNumberOfDays properties to the forecast mode [#1516](https://github.com/MichMich/MagicMirror/issues/1516)
- Fixed Loading string and decimalSymbol string replace [#1538](https://github.com/MichMich/MagicMirror/issues/1538)
- Show Snow amounts in new weather module [#1545](https://github.com/MichMich/MagicMirror/issues/1545)
- Added weather.gov as a new weather provider for US locations

## [2.6.0] - 2019-01-01

ℹ️ **Note:** This update uses new dependencies. Please update using the following command: `git pull && npm install`. If you are having issues updating, make sure you are running the latest version of Node.

### ✨ Experimental ✨

- New default [module weather](modules/default/weather). This module will eventually replace the current `currentweather` and `weatherforecast` modules. The new module is still pretty experimental, but it's included so you can give it a try and help us improve this module. Please give us you feedback using [this forum post](https://forum.magicmirror.builders/topic/9335/default-weather-module-refactoring).

A huge, huge, huge thanks to user @fewieden for all his hard work on the new `weather` module!

### Added

- Possibility to add classes to the cell of symbol, title and time of the events of calendar.
- Font-awesome 5, still has 4 for backwards compatibility.
- Missing `showEnd` in calendar documentation
- Screenshot for the new feed module
- Screenshot for the compliments module
- Screenshot for the clock module
- Screenshot for the current weather
- Screenshot for the weather forecast module
- Portuguese translation for "Feels"
- Croatian translation
- Fading for dateheaders timeFormat in Calendar [#1464](https://github.com/MichMich/MagicMirror/issues/1464)
- Documentation for the existing `scale` option in the Weather Forecast module.

### Fixed

- Allow parsing recurring calendar events where the start date is before 1900
- Fixed Polish translation for Single Update Info
- Ignore entries with unparseable details in the calendar module
- Bug showing FullDayEvents one day too long in calendar fixed
- Bug in newsfeed when `removeStartTags` is used on the description [#1478](https://github.com/MichMich/MagicMirror/issues/1478)

### Updated

- The default calendar setting `showEnd` is changed to `false`.

### Changed

- The Weather Forecast module by default displays the &deg; symbol after every numeric value to be consistent with the Current Weather module.

## [2.5.0] - 2018-10-01

### Added

- Romanian translation for "Feels"
- Support multi-line compliments
- Simplified Chinese translation for "Feels"
- Polish translate for "Feels"
- French translate for "Feels"
- Translations for newsfeed module
- Support for toggling news article in fullscreen
- Hungarian translation for "Feels" and "Week"
- Spanish translation for "Feels"
- Add classes instead of inline style to the message from the module Alert
- Support for events having a duration instead of an end
- Support for showing end of events through config parameters showEnd and dateEndFormat

### Fixed

- Fixed gzip encoded calendar loading issue #1400.
- Mixup between german and spanish translation for newsfeed.
- Fixed close dates to be absolute, if no configured in the config.js - module Calendar
- Fixed the updatenotification module message about new commits in the repository, so they can be correctly localized in singular and plural form.
- Fix for weatherforecast rainfall rounding [#1374](https://github.com/MichMich/MagicMirror/issues/1374)
- Fix calendar parsing issue for Midori on RasperryPi Zero w, related to issue #694.
- Fix weather city ID link in sample config
- Fixed issue with clientonly not updating with IP address and port provided on command line.

### Updated

- Updated Simplified Chinese translation
- Swedish translations
- Hungarian translations for the updatenotification module
- Updated Norsk bokmål translation
- Updated Norsk nynorsk translation
- Consider multi days event as full day events

## [2.4.1] - 2018-07-04

### Fixed

- Fix weather parsing issue #1332.

## [2.4.0] - 2018-07-01

⚠️ **Warning:** This release includes an updated version of Electron. This requires a Raspberry Pi configuration change to allow the best performance and prevent the CPU from overheating. Please read the information on the [MagicMirror Wiki](https://github.com/michmich/magicmirror/wiki/configuring-the-raspberry-pi#enable-the-open-gl-driver-to-decrease-electrons-cpu-usage).

ℹ️ **Note:** This update uses new dependencies. Please update using the following command: `git pull && npm install`

### Added

- Enabled translation of feelsLike for module currentweather
- Added support for on-going calendar events
- Added scroll up in fullscreen newsfeed article view
- Changed fullscreen newsfeed width from 100% to 100vw (better results)
- Added option to calendar module that colors only the symbol instead of the whole line
- Added option for new display format in the calendar module with date headers with times/events below.
- Ability to fetch compliments from a remote server
- Add regex filtering to calendar module
- Customize classes for table
- Added option to newsfeed module to only log error parsing a news article if enabled
- Add update translations for Português Brasileiro

### Changed

- Upgrade to Electron 2.0.0.
- Remove yarn-or-npm which breaks production builds.
- Invoke module suspend even if no dom content. [#1308](https://github.com/MichMich/MagicMirror/issues/1308)

### Fixed

- Fixed issue where wind chill could not be displayed in Fahrenheit. [#1247](https://github.com/MichMich/MagicMirror/issues/1247)
- Fixed issues where a module crashes when it tries to dismiss a non existing alert. [#1240](https://github.com/MichMich/MagicMirror/issues/1240)
- In default module currentWeather/currentWeather.js line 296, 300, self.config.animationSpeed can not be found because the notificationReceived function does not have "self" variable.
- Fixed browser-side code to work on the Midori browser.
- Fixed issue where heat index was reporting incorrect values in Celsius and Fahrenheit. [#1263](https://github.com/MichMich/MagicMirror/issues/1263)
- Fixed weatherforecast to use dt_txt field instead of dt to handle timezones better
- Newsfeed now remembers to show the description when `"ARTICLE_LESS_DETAILS"` is called if the user wants to always show the description. [#1282](https://github.com/MichMich/MagicMirror/issues/1282)
- `clientonly/*.js` is now linted, and one linting error is fixed
- Fix issue #1196 by changing underscore to hyphen in locale id, in align with momentjs.
- Fixed issue where heat index and wind chill were reporting incorrect values in Kelvin. [#1263](https://github.com/MichMich/MagicMirror/issues/1263)

### Updated

- Updated Italian translation
- Updated German translation
- Updated Dutch translation

## [2.3.1] - 2018-04-01

### Fixed

- Downgrade electron to 1.4.15 to solve the black screen issue.[#1243](https://github.com/MichMich/MagicMirror/issues/1243)

## [2.3.0] - 2018-04-01

### Added

- Add new settings in compliments module: setting time intervals for morning and afternoon
- Add system notification `MODULE_DOM_CREATED` for notifying each module when their Dom has been fully loaded.
- Add types for module.
- Implement Danger.js to notify contributors when CHANGELOG.md is missing in PR.
- Allow scrolling in full page article view of default newsfeed module with gesture events from [MMM-Gestures](https://github.com/thobach/MMM-Gestures)
- Changed 'compliments.js' - update DOM if remote compliments are loaded instead of waiting one updateInterval to show custom compliments
- Automated unit tests utils, deprecated, translator, cloneObject(lockstrings)
- Automated integration tests translations
- Add advanced filtering to the excludedEvents configuration of the default calendar module
- New currentweather module config option: `showFeelsLike`: Shows how it actually feels like. (wind chill or heat index)
- New currentweather module config option: `useKMPHwind`: adds an option to see wind speed in Kmph instead of just m/s or Beaufort.
- Add dc:date to parsing in newsfeed module, which allows parsing of more rss feeds.

### Changed

- Add link to GitHub repository which contains the respective Dockerfile.
- Optimized automated unit tests cloneObject, cmpVersions
- Update notifications use now translation templates instead of normal strings.
- Yarn can be used now as an installation tool
- Changed Electron dependency to v1.7.13.

### Fixed

- News article in fullscreen (iframe) is now shown in front of modules.
- Forecast respects maxNumberOfDays regardless of endpoint.
- Fix exception on translation of objects.

## [2.2.2] - 2018-01-02

### Added

- Add missing `package-lock.json`.

### Changed

- Changed Electron dependency to v1.7.10.

## [2.2.1] - 2018-01-01

### Fixed

- Fixed linting errors.

## [2.2.0] - 2018-01-01

**Note:** This update uses new dependencies. Please update using the following command: `git pull && npm install`

### Changed

- Calendar week is now handled with a variable translation in order to move number language specific.
- Reverted the Electron dependency back to 1.4.15 since newer version don't seem to work on the Raspberry Pi very well.

### Added

- Add option to use [Nunjucks](https://mozilla.github.io/nunjucks/) templates in modules. (See `helloworld` module as an example.)
- Add Bulgarian translations for MagicMirror² and Alert module.
- Add graceful shutdown of modules by calling `stop` function of each `node_helper` on SIGINT before exiting.
- Link update subtext to Github diff of current version versus tracking branch.
- Add Catalan translation.
- Add ability to filter out newsfeed items based on prohibited words found in title (resolves #1071)
- Add options to truncate description support of a feed in newsfeed module
- Add reloadInterval option for particular feed in newsfeed module
- Add no-cache entries of HTTP headers in newsfeed module (fetcher)
- Add Czech translation.
- Add option for decimal symbols other than the decimal point for temperature values in both default weather modules: WeatherForecast and CurrentWeather.

### Fixed

- Fixed issue with calendar module showing more than `maximumEntries` allows
- WeatherForecast and CurrentWeather are now using HTTPS instead of HTTP
- Correcting translation for Indonesian language
- Fix issue where calendar icons wouldn't align correctly

## [2.1.3] - 2017-10-01

**Note:** This update uses new dependencies. Please update using the following command: `git pull && npm install`

### Changed

- Remove Roboto fonts files inside `fonts` and these are installed by npm install command.

### Added

- Add `clientonly` script to start only the electron client for a remote server.
- Add symbol and color properties of event when `CALENDAR_EVENTS` notification is broadcasted from `default/calendar` module.
- Add `.vscode/` folder to `.gitignore` to keep custom Visual Studio Code config out of git.
- Add unit test the capitalizeFirstLetter function of newsfeed module.
- Add new unit tests for function `shorten` in calendar module.
- Add new unit tests for function `getLocaleSpecification` in calendar module.
- Add unit test for js/class.js.
- Add unit tests for function `roundValue` in currentweather module.
- Add test e2e showWeek feature in spanish language.
- Add warning Log when is used old authentication method in the calendar module.
- Add test e2e for helloworld module with default config text.
- Add ability for `currentweather` module to display indoor humidity via INDOOR_HUMIDITY notification.
- Add Welsh (Cymraeg) translation.
- Add Slack badge to Readme.

### Updated

- Changed 'default.js' - listen on all attached interfaces by default.
- Add execution of `npm list` after the test are ran in Travis CI.
- Change hooks for the vendors e2e tests.
- Add log when clientonly failed on starting.
- Add warning color when are using full ip whitelist.
- Set version of the `express-ipfilter` on 0.3.1.

### Fixed

- Fixed issue with incorrect alignment of analog clock when displayed in the center column of the MM.
- Fixed ipWhitelist behaviour to make empty whitelist ([]) allow any and all hosts access to the MM.
- Fixed issue with calendar module where 'excludedEvents' count towards 'maximumEntries'.
- Fixed issue with calendar module where global configuration of maximumEntries was not overridden by calendar specific config (see module doc).
- Fixed issue where `this.file(filename)` returns a path with two hashes.
- Workaround for the WeatherForecast API limitation.

## [2.1.2] - 2017-07-01

### Changed

- Revert Docker related changes in favor of [docker-MagicMirror](https://github.com/bastilimbach/docker-MagicMirror). All Docker images are outsourced. ([#856](https://github.com/MichMich/MagicMirror/pull/856))
- Change Docker base image (Debian + Node) to an arm based distro (AlpineARM + Node) ([#846](https://github.com/MichMich/MagicMirror/pull/846))
- Fix the dockerfile to have it running from the first time.

### Added

- Add in option to wrap long calendar events to multiple lines using `wrapEvents` configuration option.
- Add test e2e `show title newsfeed` for newsfeed module.
- Add task to check configuration file.
- Add test check URLs of vendors.
- Add test of match current week number on clock module with showWeek configuration.
- Add test default modules present modules/default/defaultmodules.js.
- Add unit test calendar_modules function capFirst.
- Add test for check if exists the directories present in defaults modules.
- Add support for showing wind direction as an arrow instead of abbreviation in currentWeather module.
- Add support for writing translation functions to support flexible word order
- Add test for check if exits the directories present in defaults modules.
- Add calendar option to set a separate date format for full day events.
- Add ability for `currentweather` module to display indoor temperature via INDOOR_TEMPERATURE notification
- Add ability to change the path of the `custom.css`.
- Add translation Dutch to Alert module.
- Added Romanian translation.

### Updated

- Added missing keys to Polish translation.
- Added missing key to German translation.
- Added better translation with flexible word order to Finnish translation.

### Fixed

- Fix instruction in README for using automatically installer script.
- Bug of duplicated compliments as described in [here](https://forum.magicmirror.builders/topic/2381/compliments-module-stops-cycling-compliments).
- Fix double message about port when server is starting
- Corrected Swedish translations for TODAY/TOMORROW/DAYAFTERTOMORROW.
- Removed unused import from js/electron.js
- Made calendar.js respect config.timeFormat irrespective of locale setting.
- Fixed alignment of analog clock when a large calendar is displayed in the same side bar.

## [2.1.1] - 2017-04-01

**Note:** This update uses new dependencies. Please update using the following command: `git pull && npm install`

### Changed

- Add `anytime` group for Compliments module.
- Compliments module can use remoteFile without default daytime arrays defined.
- Installer: Use init config.js from config.js.sample.
- Switched out `rrule` package for `rrule-alt` and fixes in `ical.js` in order to fix calendar issues. ([#565](https://github.com/MichMich/MagicMirror/issues/565))
- Make mouse events pass through the region fullscreen_above to modules below.
- Scaled the splash screen down to make it a bit more subtle.
- Replace HTML tables with markdown tables in README files.
- Added `DAYAFTERTOMORROW`, `UPDATE_NOTIFICATION` and `UPDATE_NOTIFICATION_MODULE` to Finnish translations.
- Run `npm test` on Travis automatically.
- Show the splash screen image even when is reboot or halted.
- Added some missing translation strings in the sv.json file.
- Run task jsonlint to check translation files.
- Restructured Test Suite.

### Added

- Added Docker support (Pull Request [#673](https://github.com/MichMich/MagicMirror/pull/673)).
- Calendar-specific support for `maximumEntries`, and `maximumNumberOfDays`.
- Add loaded function to modules, providing an async callback.
- Made default newsfeed module aware of gesture events from [MMM-Gestures](https://github.com/thobach/MMM-Gestures)
- Add use pm2 for manager process into Installer RaspberryPi script.
- Russian Translation.
- Afrikaans Translation.
- Add postinstall script to notify user that MagicMirror installed successfully despite warnings from NPM.
- Init tests using mocha.
- Option to use RegExp in Calendar's titleReplace.
- Hungarian Translation.
- Icelandic Translation.
- Add use a script to prevent when is run by SSH session set DISPLAY environment.
- Enable ability to set configuration file by the environment variable called MM_CONFIG_FILE.
- Option to give each calendar a different color.
- Option for colored min-temp and max-temp.
- Add test e2e helloworld.
- Add test e2e environment.
- Add `chai-as-promised` npm module to devDependencies.
- Basic set of tests for clock module.
- Run e2e test in Travis.
- Estonian Translation.
- Add test for compliments module for parts of day.
- Korean Translation.
- Added console warning on startup when deprecated config options are used.
- Add option to display temperature unit label to the current weather module.
- Added ability to disable wrapping of news items.
- Added in the ability to hide events in the calendar module based on simple string filters.
- Updated Norwegian translation.
- Added hideLoading option for News Feed module.
- Added configurable dateFormat to clock module.
- Added multiple calendar icon support.
- Added tests for Translations, dev argument, version, dev console.
- Added test anytime feature compliments module.
- Added test ipwhitelist configuration directive.
- Added test for calendar module: default, basic-auth, backward compatibility, fail-basic-auth.
- Added meta tags to support fullscreen mode on iOS (for server mode)
- Added `ignoreOldItems` and `ignoreOlderThan` options to the News Feed module
- Added test for MM_PORT environment variable.
- Added a configurable Week section to the clock module.

### Fixed

- Update .gitignore to not ignore default modules folder.
- Remove white flash on boot up.
- Added `update` in Raspberry Pi installation script.
- Fix an issue where the analog clock looked scrambled. ([#611](https://github.com/MichMich/MagicMirror/issues/611))
- If units are set to imperial, the showRainAmount option of weatherforecast will show the correct unit.
- Module currentWeather: check if temperature received from api is defined.
- Fix an issue with module hidden status changing to `true` although lock string prevented showing it.
- Fix newsfeed module bug (removeStartTags)
- Fix when is set MM_PORT environment variable.
- Fixed missing animation on `this.show(speed)` when module is alone in a region.

## [2.1.0] - 2016-12-31

**Note:** This update uses new dependencies. Please update using the following command: `git pull && npm install`

### Added

- Finnish translation.
- Danish translation.
- Turkish translation.
- Option to limit access to certain IP addresses based on the value of `ipWhitelist` in the `config.js`, default is access from localhost only (Issue [#456](https://github.com/MichMich/MagicMirror/issues/456)).
- Added ability to change the point of time when calendar events get relative.
- Add Splash screen on boot.
- Add option to show humidity in currentWeather module.
- Add VSCode IntelliSense support.
- Module API: Add Visibility locking to module system. [See documentation](https://github.com/MichMich/MagicMirror/tree/develop/modules#visibility-locking) for more information.
- Module API: Method to overwrite the module's header. [See documentation](https://github.com/MichMich/MagicMirror/tree/develop/modules#getheader) for more information.
- Module API: Option to define the minimum MagicMirror version to run a module. [See documentation](https://github.com/MichMich/MagicMirror/tree/develop/modules#requiresversion) for more information.
- Calendar module now broadcasts the event list to all other modules using the notification system. [See documentation](https://github.com/MichMich/MagicMirror/tree/develop/modules/default/calendar) for more information.
- Possibility to use the calendar feed as the source for the weather (currentweather & weatherforecast) location data. [See documentation](https://github.com/MichMich/MagicMirror/tree/develop/modules/default/weatherforecast) for more information.
- Added option to show rain amount in the weatherforecast default module
- Add module `updatenotification` to get an update whenever a new version is available. [See documentation](https://github.com/MichMich/MagicMirror/tree/develop/modules/default/updatenotification) for more information.
- Add the ability to set timezone on the date display in the Clock Module
- Ability to set date format in calendar module
- Possibility to use currentweather for the compliments
- Added option `disabled` for modules.
- Added option `address` to set bind address.
- Added option `onlyTemp` for currentweather module to show only current temperature and weather icon.
- Added option `remoteFile` to compliments module to load compliment array from filesystem.
- Added option `zoom` to scale the whole mirror display with a given factor.
- Added option `roundTemp` for currentweather and weatherforecast modules to display temperatures rounded to nearest integer.
- Added ability set the classes option to compliments module for style and text size of compliments.
- Added ability to configure electronOptions
- Calendar module: option to hide private events
- Add root_path for global vars

### Updated

- Modified translations for Frysk.
- Modified core English translations.
- Updated package.json as a result of Snyk security update.
- Improve object instantiation to prevent reference errors.
- Improve logger. `Log.log()` now accepts multiple arguments.
- Remove extensive logging in newsfeed node helper.
- Calendar times are now uniformly capitalized.
- Modules are now secure, and Helmet is now used to prevent abuse of the Mirror's API.

### Fixed

- Solve an issue where module margins would appear when the first module of a section was hidden.
- Solved visual display errors on chrome, if all modules in one of the right sections are hidden.
- Global and Module default config values are no longer modified when setting config values.
- Hide a region if all modules in a region are hidden. Prevention unwanted margins.
- Replaced `electron-prebuilt` package with `electron` in order to fix issues that would happen after 2017.
- Documentation of alert module

## [2.0.5] - 2016-09-20

### Added

- Added ability to remove tags from the beginning or end of newsfeed items in 'newsfeed.js'.
- Added ability to define "the day after tomorrow" for calendar events (Definition for German and Dutch already included).
- Added CII Badge (we are compliant with the CII Best Practices)
- Add support for doing http basic auth when loading calendars
- Add the ability to turn off and on the date display in the Clock Module

### Fixed

- Fix typo in installer.
- Add message to unsupported Pi error to mention that Pi Zeros must use server only mode, as ARMv6 is unsupported. Closes #374.
- Fix API url for weather API.

### Updated

- Force fullscreen when kioskmode is active.
- Update the .github templates and information with more modern information.
- Update the Gruntfile with a more functional StyleLint implementation.

## [2.0.4] - 2016-08-07

### Added

- Brazilian Portuguese Translation.
- Option to enable Kiosk mode.
- Added ability to start the app with Dev Tools.
- Added ability to turn off the date display in `clock.js` when in analog mode.
- Greek Translation

### Fixed

- Prevent `getModules()` selectors from returning duplicate entries.
- Append endpoints of weather modules with `/` to retrieve the correct data. (Issue [#337](https://github.com/MichMich/MagicMirror/issues/337))
- Corrected grammar in `module.js` from 'suspend' to 'suspended'.
- Fixed openweathermap.org URL in config sample.
- Prevent currentweather module from crashing when received data object is incorrect.
- Fix issue where translation loading prevented the UI start-up when the language was set to 'en'. (Issue [#388](https://github.com/MichMich/MagicMirror/issues/388))

### Updated

- Updated package.json to fix possible vulnerabilities. (Using Snyk)
- Updated weathericons
- Updated default weatherforecast to work with the new icons.
- More detailed error message in case config file couldn't be loaded.

## [2.0.3] - 2016-07-12

### Added

- Add max newsitems parameter to the newsfeed module.
- Translations for Simplified Chinese, Traditional Chinese and Japanese.
- Polish Translation
- Add an analog clock in addition to the digital one.

### Fixed

- Edit Alert Module to display title & message if they are provided in the notification (Issue [#300](https://github.com/MichMich/MagicMirror/issues/300))
- Removed 'null' reference from updateModuleContent(). This fixes recent Edge and Internet Explorer browser displays (Issue [#319](https://github.com/MichMich/MagicMirror/issues/319))

### Changed

- Added default string to calendar titleReplace.

## [2.0.2] - 2016-06-05

### Added

- Norwegian Translations (nb and nn)
- Portuguese Translation
- Swedish Translation

### Fixed

- Added reference to Italian Translation.
- Added the missing NE translation to all languages. [#344](https://github.com/MichMich/MagicMirror/issues/344)
- Added proper User-Agent string to calendar call.

### Changed

- Add option to use locationID in weather modules.

## [2.0.1] - 2016-05-18

### Added

- Changelog
- Italian Translation

### Changed

- Improve the installer by fetching the latest Node.js without any 3rd party interferences.

## [2.0.0] - 2016-05-03

### Initial release of MagicMirror²

It includes (but is not limited to) the following features:

- Modular system allowing 3rd party plugins.
- An Node/Electron based application taking away the need for external servers or browsers.
- A complete development API documentation.
- Small cute fairies that kiss you while you sleep.

## [1.0.0] - 2014-02-16

### Initial release of MagicMirror.

This was part of the blogpost: [https://michaelteeuw.nl/post/83916869600/magic-mirror-part-vi-production-of-the](https://michaelteeuw.nl/post/83916869600/magic-mirror-part-vi-production-of-the)
