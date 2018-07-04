# MagicMirror² Change Log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

---

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
- Allow to scroll in full page article view of default newsfeed module with gesture events from [MMM-Gestures](https://github.com/thobach/MMM-Gestures)
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
- Calender week is now handled with a variable translation in order to move number language specific.
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
- Add unit test the capitalizeFirstLetter function of newfeed module.
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
- Fixed issue with incorrect allignment of analog clock when displayed in the center column of the MM.
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
- Add support for writing translation fucntions to support flexible word order
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
- Made calendar.js respect config.timeFormat irrespecive of locale setting.
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
- Added some missing translaton strings in the sv.json file.
- Run task jsonlint to check translation files.
- Restructured Test Suite.

### Added
- Added Docker support (Pull Request [#673](https://github.com/MichMich/MagicMirror/pull/673)).
- Calendar-specific support for `maximumEntries`, and ` maximumNumberOfDays`.
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
- Add use a script to prevent when is run by SSH session set DISPLAY enviroment.
- Enable ability to set configuration file by the enviroment variable called MM_CONFIG_FILE.
- Option to give each calendar a different color.
- Option for colored min-temp and max-temp.
- Add test e2e helloworld.
- Add test e2e enviroment.
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
- Added test for calendar module: default, basic-auth, backward compability, fail-basic-auth.
- Added meta tags to support fullscreen mode on iOS (for server mode)
- Added `ignoreOldItems` and `ignoreOlderThan` options to the News Feed module
- Added test for MM_PORT enviroment variable.
- Added a configurable Week section to the clock module.

### Fixed
- Update .gitignore to not ignore default modules folder.
- Remove white flash on boot up.
- Added `update` in Raspberry Pi installation script.
- Fix an issue where the analog clock looked scrambled. ([#611](https://github.com/MichMich/MagicMirror/issues/611))
- If units is set to imperial, the showRainAmount option of weatherforecast will show the correct unit.
- Module currentWeather: check if temperature received from api is defined.
- Fix an issue with module hidden status changing to `true` although lock string prevented showing it.
- Fix newsfeed module bug (removeStartTags)
- Fix when is set MM_PORT enviroment variable.
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
- Possibility to use the the calendar feed as the source for the weather (currentweather & weatherforecast) location data. [See documentation](https://github.com/MichMich/MagicMirror/tree/develop/modules/default/weatherforecast) for more information.
- Added option to show rain amount in the weatherforecast default module
- Add module `updatenotification` to get an update whenever a new version is availabe. [See documentation](https://github.com/MichMich/MagicMirror/tree/develop/modules/default/updatenotification) for more information.
- Add the abilty to set timezone on the date display in the Clock Module
- Ability to set date format in calendar module
- Possibility to use currentweather for the compliments
- Added option `disabled` for modules.
- Added option `address` to set bind address.
- Added option `onlyTemp` for currentweather module to show show only current temperature and weather icon.
- Added option `remoteFile` to compliments module to load compliment array from filesystem.
- Added option `zoom` to scale the whole mirror display with a given factor.
- Added option `roundTemp` for currentweather and weatherforecast modules to display temperatures rounded to nearest integer.
- Added abilty set the classes option to compliments module for style and text size of compliments.
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
- Add the abilty to turn off and on the date display in the Clock Module

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
- Append endpoints of weather modules with `/` to retreive the correct data. (Issue [#337](https://github.com/MichMich/MagicMirror/issues/337))
- Corrected grammer in `module.js` from 'suspend' to 'suspended'.
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
This was part of the blogpost: [http://michaelteeuw.nl/post/83916869600/magic-mirror-part-vi-production-of-the](http://michaelteeuw.nl/post/83916869600/magic-mirror-part-vi-production-of-the)
