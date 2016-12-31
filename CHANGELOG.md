# MagicMirror² Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

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
- Added the missing NE translation to all languages. [#334](https://github.com/MichMich/MagicMirror/issues/344)
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
