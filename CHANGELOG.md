# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

❤️ **Donate:** Enjoying MagicMirror²? [Please consider a donation!](https://magicmirror.builders/#donate) With your help we can continue to improve the MagicMirror².

## [2.31.0-develop] - unreleased

planned for 2025-04-01

> ⚠️ This release needs nodejs version `v20` or `v22 or higher`, minimum version is `v20.18.1`

### Added

### Changed

- [core] starting clientonly now checks for needed env var `WAYLAND_DISPLAY` or `DISPLAY` and starts electron with needed parameters (if both are set wayland is used) (#3677)
- [core] Optimize systeminformation calls and output

### Removed

### Updated

- [core] Update dependencies and formatting including electron to v34

### Fixed

- [calendar] Fix clipping events being broadcast (#3678)
- [tests] Electron tests: Fixes for running under new github image ubuntu-24.04, replace xserver with labwc, running under xserver and labwc depending on env variable WAYLAND_DISPLAY is set (#3676)
- [calendar] Fix arrayed symbols, #3267, again, add testcase, add testcase for #3678
- [weather] Fix wrong weatherCondition name in openmeteo provider which lead to n/a icon
- [core] Fix wrong port in log message when starting server only (#3696)

## [2.30.0] - 2025-01-01

Thanks to: @xsorifc28, @HeikoGr, @bugsounet, @khassel, @KristjanESPERANTO, @rejas, @sdetweil.

> ⚠️ This release needs nodejs version `v20` or `v22 or higher`, minimum version is `v20.18.1`

### Added

- [core] Add wayland and windows start options to `package.json` (#3594)
- [docs] Add step for npm publishing in release process (#3595)
- [core] Add GitHub workflow to run spellcheck a few days before each release (#3623)
- [core] Add test flag to `index.html` to pass to module js for test mode detection (needed by #3630)
- [core] Add export on animation names (#3644)
- [compliments] Add support for refreshing remote compliments file, and test cases (#3630)
- [linter] Re-add `eslint-plugin-import`now that it supports ESLint v9 (#3586)
- [linter] Re-activate `eslint-plugin-package-json` to lint `package.json` (#3643)
- [linter] Add linting for markdown files (#3646)
- [linter] Add some handy ESLint rules (#3665)
- [calendar] Add ability to display end date for full date events, where end is not same day (showEnd=true) (#3650)
- [core] Add text to the config.js.sample file about the locale variable (#3654, #3655)
- [core] Add fetch timeout for all node_helpers (thru undici, forces node 20.18.1 minimum) to help on slower systems. (#3660) (3661)

### Changed

- [core] Run code style checks in workflow only once (#3648)
- [core] Fix animations export #3644 only on server side (#3649)
- [core] Use project URL in fallback config (#3656)
- [core] Fix Access Denied crash writing js/positions.js (on synology nas) #3651. new message, MM starts, but no modules showing (#3652)
- [linter] Switch to 'npx' for lint-staged in pre-commit hook (#3658)

### Removed

- [tests] Remove `node-pty` and `drivelist` from rebuilded test (#3575)
- [deps] Remove `@eslint/js` dependency. Already installed with `eslint` in deep (#3636)

### Updated

- [repo] Reactivate `stale.yaml` as GitHub action to mark issues as stale after 60 days and close them 7 days later (if no activity) (#3577, #3580, #3581)
- [core] Update electron dependency to v32 (test electron rebuild) and all other dependencies too (#3657)
- [tests] All test configs have been updated to allow full external access, allowing for easier debugging (especially when running as a container)
- [core] Run and test with node 23 (#3588)
- [workflow] delete exception `allow-ghsas: GHSA-8hc4-vh64-cxmj` in `dep-review.yaml` (#3659)

### Fixed

- [updatenotification] Fix pm2 using detection when pm2 script is inside or outside MagicMirror root folder (#3576) (#3605) (#3626) (#3628)
- [core] Fix loading node_helper of modules: avoid black screen, display errors and continue loading with next module (#3578)
- [weather] Change default value for weatherEndpoint of provider openweathermap to "/onecall" (#3574)
- [tests] Fix electron tests with mock dates, the mock on server side was missing (#3597)
- [tests] Fix testcases with hard coded Date.now (#3597)
- [core] Fix missing `basePath` where `location.host` is used (#3613)
- [compliments] croner library changed filenames used in latest version (#3624)
- [linter] Fix ESLint ignore pattern which caused that default modules not to be linted (#3632)
- [core] Fix module path in case of sub/sub folder is used and use path.resolve for resolve `moduleFolder` and `defaultModuleFolder` in app.js (#3653)
- [calendar] Update to resolve issues #3098 #3144 #3351 #3422 #3443 #3467 #3537 related to timezone changes
- [calendar] Fix #3267 (styles array), also fixes event with both exdate AND recurrence(and testcase)
- [calendar] Fix showEndsOnlyWithDuration not working, #3598, applies ONLY to full day events
- [calendar] Fix showEnd for Full Day events (#3602)
- [tests] Suppress "module is not defined" in e2e tests (#3647)
- [calendar] Fix #3267 (styles array, really this time!)
- [core] Fix #3662 js/positions.js created incorrectly

## [2.29.0] - 2024-10-01

Thanks to: @bugsounet, @dkallen78, @jargordon, @khassel, @KristjanESPERANTO, @MarcLandis, @rejas, @ryan-d-williams, @sdetweil, @skpanagiotis.

> ⚠️ This release needs nodejs version `v20` or `v22`, minimum version is `v20.9.0`

### Added

- [compliments] Added support for cron type date/time format entries mm hh DD MM dow (minutes/hours/days/months and day of week) see <https://crontab.cronhub.io> for construction (#3481)
- [core] Check config at every start of MagicMirror² (#3450)
- [core] Add spelling check (cspell): `npm run test:spelling` and handle spelling issues (#3544)
- [core] removed `config.paths.vendor` (could not work because `vendor` is hardcoded in `index.html`), renamed `config.paths.modules` to `config.foreignModulesDir`, added variable `MM_CUSTOMCSS_FILE` which - if set - overrides `config.customCss`, added variable `MM_MODULES_DIR` which - if set - overrides `config.foreignModulesDir`, added test for `MM_MODULES_DIR` (#3530)
- [core] elements are now removed from `index.html` when loading script or stylesheet files fails
- [core] Added `MODULE_DOM_UPDATED` notification each time the DOM is re-rendered via `updateDom` (#3534)
- [tests] added minimal needed node version to tests (currently v20.9.0) to avoid releases with wrong node version info
- [tests] Added `node-libgpiod` library to electron-rebuild tests (#3563)

### Removed

- [core] removed installer only files (#3492)
- [core] removed raspberry object from systeminformation (#3505)
- [linter] removed `eslint-plugin-import`, because it doesn't support ESLint v9. We will reenter it later when it does.
- [tests] removed `onoff` library from electron-rebuild tests (#3563)

### Updated

- [weather] Updated `apiVersion` default from 2.5 to 3.0 (#3424)
- [core] Updated dependencies including stylistic-eslint
- [core] nail down `node-ical` version to `0.18.0` with exception `allow-ghsas: GHSA-8hc4-vh64-cxmj` in `dep-review.yaml` (which should removed after next `node-ical` update)
- [core] Updated SocketIO catch all to new API
- [core] Allow custom modules positions by scanning index.html for the defined regions, instead of hard coded (PR #3518 fixes issue #3504)
- [core] Detail optimizations in `config_check.js`
- [core] Updated minimal needed node version in `package.json` (currently v20.9.0) (#3559) and except for v21 (no security updates) (#3561)
- [linter] Switch to ESLint v9 and flat config and replace `eslint-plugin-unicorn` by `@eslint/js`
- [core] fix discovering module positions twice after #3450

### Fixed

- [docs] Fixed `checks` badge in README.md
- [weather] Fixed issue with the UK Met Office provider following a change in their API paths and header info.
- [core] Add check for node_helper loading for multiple instances of same module (#3502)
- [weather] Fixed issue for respecting unit config on broadcasted notifications
- [tests] Fixes calendar test by moving it from e2e to electron with fixed date (#3532)
- [calendar] fixed sliceMultiDayEvents getting wrong count and displaying incorrect entries, Europe/Berlin (#3542)
- [tests] ignore `js/positions.js` when linting (this file is created at runtime)
- [calendar] fixed sliceMultiDayEvents showing previous day without config enabled

## [2.28.0] - 2024-07-01

Thanks to: @btoconnor, @bugsounet, @JasonStieber, @khassel, @kleinmantara and @WallysWellies.

> ⚠️ This release needs nodejs version >= v20.9.0

### Added

- [calendar] Added config option "showEndsOnlyWithDuration" for default calendar
- [compliments] Added `specialDayUnique` config option, defaults to `false` (#3465)
- [weather] Provider weathergov: Use `precipitationLast3Hours` if `precipitationLastHour` is `null` (#3124)

### Removed

- [tests] delete node v18 support (#3462)

### Updated

- [core] Update dependencies including electron to v31
- [core] use node >= v20 (#3462)
- [core] Update `config.js.sample` to use openmeteo as weather provider which needs no api key
- [tests] Use latest@version of node for `automated-tests.yaml` (#3483)
- [updatenotification] Avoid using pm2 when running in docker container

### Fixed

- [core] Fixed crash possibility if `module: <name>` is not defined and on `position: <position>` mistake (#3445)
- [weather] Fixed precipitationProbability in forecast for provider openmeteo (#3446)
- [weather] Fixed type=daily for provider openmeteo having no data when running after 23:00 (#3449)
- [weather] Fixed type=daily for provider openmeteo showing nightly icons in forecast when current time is "nightly" (#3458)
- [weather] Fixed forecast and hourly weather for provider openmeteo to use real temperatures, not apparent temperatures (#3466)
- [tests] Fixed e2e tests running in docker container which needs `address: "0.0.0.0"` (#3479)

## [2.27.0] - 2024-04-01

Thanks to: @bugsounet, @crazyscot, @illimarkangur, @jkriegshauser, @khassel, @KristjanESPERANTO, @Paranoid93, @rejas, @sdetweil and @vppencilsharpener.

This release marks the first release without Michael Teeuw (@michmich). A very special thanks to him for creating MagicMirror and leading the project for so many years.

For more info, please read the following post: [A New Chapter for MagicMirror: The Community Takes the Lead](https://forum.magicmirror.builders/topic/18329/a-new-chapter-for-magicmirror-the-community-takes-the-lead).

### Added

- Output of system information to the console for troubleshooting (#3328 and #3337), ignore errors under aarch64 (#3349)
- [core] Add `eslint-plugin-package-json` to lint the `package.json` files (#3368)
- [weather] `showHumidity` config is now a string describing where to show this element. Supported values: "wind", "temp", "feelslike", "below", "none". (#3330)
- electron-rebuild test suite for electron and 3rd party modules compatibility (#3392)
- Create MM² icon and attach it to electron process (#3407)

### Updated

- Update updatenotification (update_helper.js): Recode with pm2 library (#3332)
- Removing lodash dependency by replacing merge by spread operator (#3339)
- Use node prefix for build-in modules (#3340)
- Rework logging colors (#3350)
- Update pm2 to v5.3.1 with no allow-ghsas (#3364)
- [core] Update husky and let lint-staged fix ESLint issues
- [core] Update dependencies including electron to v29 (#3357) and node-ical
- Update translations for estonian (#3371)
- Update electron to v29 and update other dependencies
- [calendar] fullDay events over several days now show the left days from the first day on and 'today' on the last day
- Update layout of current weather indoor values

### Fixed

- [weather] Correct apiBase of weathergov weatherProvider to match documentation (#2926)
- Worked around several issues in the RRULE library that were causing deleted calender events to still show, some
  initial and recurring events to not show, and some event times to be off an hour. (#3291)
- Skip changelog requirement when running tests for dependency updates (#3320)
- Display precipitation probability when it is 0% instead of blank/empty (#3345)
- [newsfeed] Suppress unsightly animation cases when there are 0 or 1 active news items (#3336)
- [newsfeed] Always compute the feed item URL using the same helper function (#3336)
- Ignore all custom css files (#3359)
- [newsfeed] Fix newsfeed stall issue introduced by #3336 (#3361)
- Changed `log.debug` to `log.log` in `app.js` where logLevel is not set because config is not loaded at this time (#3353)
- [calendar] deny fetch interval < 60000 and set 60000 in this case (prevent fetch loop failed) (#3382)
- added message in case where config.js is missing the module.export line PR #3383
- Fixed an issue where recurring events could extend past their recurrence end date (#3393)
- Don't display any `npm WARN <....>` on install (#3399)
- [core] Moved suncalc dependency to production from dev, as it is used by clock module
- [compliments] Fix mirror not responding anymore when no compliments are to be shown (#3385)
- [core] Fixed mastermerge workflow (#3415)

### Deleted

- Unneeded file headers (#3358)
- Removed codecov.yaml

## [2.26.0] - 2024-01-01

Thanks to: @bnitkin, @bugsounet, @dependabot, @jkriegshauser, @kaennchenstruggle, @KristjanESPERANTO and @Ybbet.

Special thanks to @khassel, @rejas and @sdetweil for taking over most (if not all) of the work on this release as project collaborators. This version would not be there without their effort. Thank you guys! You are awesome!

This release also marks the latest release by Michael Teeuw. For more info, please read the following post: [A New Chapter for MagicMirror: The Community Takes the Lead](https://forum.magicmirror.builders/topic/18329/a-new-chapter-for-magicmirror-the-community-takes-the-lead).

### Added

- Added update notification updater (for 3rd party modules)
- Added node 21 to the test matrix
- Added transform object to calendar:customEvents
- Added ESLint rules for jest (including jest/expect-expect and jest/no-done-callback)

### Removed

- Removed Codecov workflow (not working anymore, other workflow required) (#3107)
- Removed titleReplace from calendar, replaced + extended by customEvents (backward compatibility included) (#3249)
- Removed failing unit test (#3254)
- Removed some unused variables

### Updated

- Update electron to v27 and update other dependencies as well as github actions
- Update newsfeed: Use `html-to-text` instead of regex for transform description
- Review ESLint config (#3269)
- Update dependencies
- Clock module: optionally display current moon phase in addition to rise/set times
- electron is now per default started without gpu, if needed it must be enabled with new env var `ELECTRON_ENABLE_GPU=1` on startup (#3226)
- Replace prettier by stylistic in ESLint config to lint JavaScript (and disable some rules for `config/config.js*` files)
- Update node-ical to v0.17.1 and fix tests

### Fixed

- Avoid fade out/in on updateDom when many calendars are used
- Fix the option eventClass on customEvents.
- Fix yr API version in locationforecast and sunrise call (#3227)
- Fix cloneObject() function to respect RegExp (#3237)
- Fix newsfeed module for feeds using "a10:updated" tag (#3238)
- Fix issue template (#3167)
- Fix #3256 filter out bad results from rrule.between
- Fix calendar events sometimes not respecting deleted events (#3250)
- Fix electron loadURL locally on Windows when address "0.0.0.0" (#2550)
- Fix updatenotification (update_helper.js): catch error if response is not an JSON format (check PM2)
- Fix missing typeof in calendar module
- Fix style issues after prettier update
- Fix calendar test (#3291) by moving "Exdate check" from e2e to electron to run on a Thursday
- Fix calendar config params `fetchInterval` and `excludedEvents` were never used from single calendar config (#3297)
- Fix MM_PORT variable not used in electron and allow full path for MM_CONFIG_FILE variable (#3302)

## [2.25.0] - 2023-10-01

Thanks to: @bugsounet, @dgoth, @dependabot, @kenzal, @Knapoc, @KristjanESPERANTO, @martingron, @NolanKingdon, @Paranoid93, @TeddyStarinvest and @Ybbet.

Special thanks to @khassel, @rejas and @sdetweil for taking over most (if not all) of the work on this release as project collaborators. This version would not be there without their effort. Thank you guys! You are awesome!

> ⚠️ This release needs nodejs version >= `v18`, older releases have reached end of life and will not work!

### Added

- Added UV Index support to OpenWeatherMap
- Added 'hideDuplicates' flag to the calendar module
- Added `allowOverrideNotification` to weather module to enable sending current weather objects with the `CURRENT_WEATHER_OVERRIDE` notification to supplement/replace the current weather displayed
- Added optional AnimateCSS animate for `hide()`, `show()`, `updateDom()`
- Added AnimateIn and animateOut in module config definition
- Apply AnimateIn rules on the first start
- Added automatic client page reload when server was restarted by setting `reloadAfterServerRestart: true` in `config.js`, per default `false` (#3105)
- Added eventClass option for customEvents on the default calendar
- Added AnimateCSS integration in tests suite (#3206)
- Added npm dependabot [Reserved to developer] (#3210)
- Added improved logging for calendar (#3110)

### Removed

- **Breaking Change**: Removed `digest` authentication method from calendar module (which was already broken since release `2.15.0`)

### Updated

- Update roboto fonts to version v5
- Update issue template
- Update dev/dependencies incl. electron to v26
- Replace pretty-quick by lint-staged (<https://github.com/azz/pretty-quick/issues/164>)
- Update engine node >=18. v16 reached its end of life. (#3170)
- Update typescript definition for modules
- Cleaned up nunjuck templates
- Replace `node-fetch` with internal fetch (#2649) and remove `digest-fetch`
- Update the French translation according to the English file.
- Update dependabot incl. vendor/fonts (monthly check)
- Renew `package-lock.json` for release

### Fixed

- Fix engine check on npm install (#3135)
- Fix undefined formatTime method in clock module (#3143)
- Fix clientonly startup fails after async added (#3151)
- Fix electron width/height when using xrandr under bullseye
- Fix time issue with certain recurring events in calendar module
- Fix ipWhiteList test (#3179)
- Fix newsfeed: Convert HTML entities, codes and tag in description (#3191)
- Respect width/height (no fullscreen) if set in electronOptions (together with `fullscreen: false`) in `config.js` (#3174)
- Fix: AnimateCSS merge hide() and show() animated css class when we do multiple call
- Fix `Uncaught SyntaxError: Identifier 'getCorsUrl' has already been declared (at utils.js:1:1)` when using `clock` and `weather` module (#3204)
- Fix overriding `config.js` when running tests (#3201)
- Fix issue in weathergov provider with probability of precipitation not showing up on hourly or daily forecast
- Fix yr weather provider after changes in yr API (#3189)

## [2.24.0] - 2023-07-01

Thanks to: @angeldeejay, @bugsounet, @buxxi, @CarJem, @dariom, @DaveChild, @dWoolridge, @eddiehung, @grenagit, @Hirschberger, @ismarslomic, @JakeBinney, @KristjanESPERANTO, @MagMar94, @naveensrinivasan, @nfogal, @oscarb, @OWL4C, @psieg, @rajniszp, @retroflex, @SkySails and @tomzt

Special thanks to @khassel, @rejas and @sdetweil for taking over most (if not all) of the work on this release as project collaborators. This version would not be there without their effort. Thank you guys! You are awesome!

### Added

- Added UV Index to hourly and current Weather, with support for Openmeteo
- Added tests for serveronly
- Set Timezone `Europe/Berlin` in unit tests (needed for new formatTime tests)
- Added no-param-reassign eslint rule and fix warnings
- [updatenotification] Added `sendUpdatesNotifications` feature. Broadcast update with `UPDATES` notification to other modules
- [updatenotification] Allow force scanning with `SCAN_UPDATES` notification from other modules
- Added per-calendar fetchInterval

### Removed

- Removed unneeded (and unwanted) '.' after the year in calendar repeatingCountTitle (#2896, second attempt ...)

### Updated

- [weather] Added support for precipitation probability with openmeteo weather-provider
- Update electron to v25.2 and other dependencies
- Use node v20 in github workflow (replacing v14)
- Refactor formatTime into common util function for default modules
- Refactor some calendar methods into own class and added tests for them
- Split install and run commands in github actions
- Changed `fetchInterval` of calendar in `config.js.sample` to 7 days so we not to request example calendar too frequently
- Changed default calendar fetchInterval to one hour
- Changed calendar url in sample config

### Fixed

- Fix envcanada hourly forecast time (#3080)
- Fix electron not running under windows after async changes (#3083)
- Fix style issues after eslint-plugin-jsdoc update
- Fix don't filter out ongoing full day events (#3095)
- Fix date not shown when clock in analog mode (#3100)
- Fix envcanada today percentage-of-precipitation (#3106)
- Fix updatenotification where no branch is checked out but e.g. a version tag (#3130)

## [2.23.0] - 2023-04-04

Thanks to: @angeldeejay, @buxxi, @CarJem, @dariom, @DaveChild, @dWoolridge, @grenagit, @Hirschberger, @KristjanESPERANTO, @MagMar94, @naveensrinivasan, @nfogal, @psieg, @rajniszp, @retroflex, @SkySails and @tomzt.

Special thanks to @khassel, @rejas and @sdetweil for taking over most (if not all) of the work on this release as project collaborators. This version would not be there without their effort. Thank you guys! You are awesome!

### Added

- Added increments for hourly forecasts in weather module (#2996)
- Added tests for hourly weather forecast
- Added possibility to ignore MagicMirror repo in updatenotification module
- Added Pirate Weather as new weather-provider (#3005)
- Added possibility to use your own templates in Alert module
- Added error message if `<modulename>.js` file is missing in module folder to get a hint in the logs (#2403)
- Added possibility to use environment variables in `config.js` (#1756)
- Added option `pastDaysCount` to default calendar module to control of how many days past events should be displayed
- Added thai language to alert module
- Added option `sendNotifications` in clock module (#3056)
- Added tests for some weather utils

### Removed

- Removed darksky weather-provider
- Removed unneeded (and unwanted) '.' after the year in calendar repeatingCountTitle (#2896)

### Updated

- Use develop as target branch for dependabot
- Update issue template, contributing doc and sample config
- The weather modules clearly separates precipitation amount and probability (risk of rain/snow)
  - This requires all providers that only supports probability to change the config from `showPrecipitationAmount` to `showPrecipitationProbability`.
- Update tests for weather and calendar module
- Changed updatenotification module for MagicMirror repo only: Send only notifications for `master` if there is a tag on a newer commit
- Update dates in Calendar widgets every minute
- Cleanup jest coverage for patches
- Update `stylelint` dependencies, switch to `stylelint-config-standard` and handle `stylelint` issues, update `main.css` matching new rules
- Update Eslint config, add new rule and handle issue
- Convert lots of callbacks to async/await
- Revise require imports (#3071 and #3072)
- Use `config.js-old` instead of file with timestamp suffix when backing up config with a `config.template` in use (#3104)

### Fixed

- Fix wrong day labels in envcanada forecast (#2987)
- Fix for missing default class name prefix for customEvents in calendar
- Fix electron flashing white screen on startup (#1919)
- Fix weathergov provider hourly forecast (#3008)
- Fix message display with HTML code into alert module (#2828)
- Fix typo in french translation
- Yr wind direction is no longer inverted
- Fix async node_helper stopping electron start (#2487)
- The wind direction arrow now points in the direction the wind is flowing, not into the wind (#3019)
- Fix precipitation css styles and rounding value
- Fix wrong vertical alignment of calendar title column when wrapEvents is true (#3053)
- Fix empty news feed stopping the reload forever
- Fix e2e tests (failed after async changes) by running calendar and newsfeed tests last
- Lint: Use template literals instead of string concatenation
- Fix default alert module to render HTML for title and message
- Fix Open-Meteo wind speed units

## [2.22.0] - 2023-01-01

Thanks to: @angeldeejay, @buxxi, @dariom, @dWoolridge, @KristjanESPERANTO, @MagMar94, @naveensrinivasan, @retroflex, @SkySails and @Tom.

Special thanks to @khassel, @rejas and @sdetweil for taking over most (if not all) of the work on this release as project collaborators. This version would not be there without their effort. Thank you!

### Added

- Added new calendar options for colored entries and improved styling (#3033)
- Added test for remoteFile option in compliments module
- Added hourlyWeather functionality to Weather.gov weather-provider
- Added css class names "today" and "tomorrow" for default calendar
- Added Collaboration.md
- Added new github action for dependency review (#2862)
- Added a WeatherProvider for Open-Meteo
- Added Yr as a weather-provider
- Added config options "ignoreXOriginHeader" and "ignoreContentSecurityPolicy"
- Added thai language
- Added workflow rule to make sure PRs are based against develop

### Removed

- Removed usage of internal fetch function of node until it is more stable
- Removed weatherEndpoint definition from weathergov.js (not used)

### Updated

- Cleaned up test directory (#2937) and jest config (#2959)
- Wait for all modules to start before declaring the system ready (#2487)
- Updated e2e tests (moved `done()` in helper functions) and use es6 syntax in all tests
- Updated da translation
- Rework weather module
  - Make sure smhi provider api only gets a maximum of 6 digits coordinates (#2955)
  - Use fetch instead of XMLHttpRequest in weather-provider (#2935)
  - Reworked how weather-providers handle units (#2849)
  - Use unix() method for parsing times, fix suntimes on the way (#2950)
  - Refactor conversion functions into utils class (#2958)
- The `cors`-method in `server.js` now supports sending and receiving HTTP headers
- Replace `&hellip;` by `…`
- Cleanup compliments module
- Updated dependencies including electron to v22 (#2903)

### Fixed

- Correctly show apparent temperature in SMHI weather-provider
- Ensure updatenotification module isn't shown when local is _ahead_ of remote
- Handle node_helper errors during startup (#2944)
- Possibility to change FontAwesome class in calendar, so icons like `fab fa-facebook-square` works.
- Fix cors problems with newsfeed articles (as far as possible), allow disabling cors per feed with option `useCorsProxy: false` (#2840)
- Tests not waiting for the application to start and stop before starting the next test
- Fix electron tests failing sometimes in github workflow
- Fixed gap in clock module when displayed on the left side with displayType=digital
- Fixed playwright issue by upgrading to v1.29.1 (#2969)

## [2.21.0] - 2022-10-01

Special thanks to: @BKeyport, @buxxi, @davide125, @khassel, @kolbyjack, @krukle, @MikeBishop, @rejas, @sdetweil, @SkySails and @veeck

### Added

- Added possibility to fetch calendars through socket notifications.
- New scripts `install-mm` (and `install-mm:dev`) for simplifying mm installation (now: `npm run install-mm`) and adding params `--no-audit --no-fund --no-update-notifier` for less noise.
- New `showTimeToday` option in calendar module shows time for current-day events even if `timeFormat` is `"relative"`.
- Added hourly forecasts, apparent temperature & custom location name to SMHI weather-provider.
- Added new electron tests for calendar and moved some compliments tests from `e2e` to `electron` because of date mocking, removed mock stuff from compliments module.

### Removed

- Removed old and deprecated weather modules `currentweather` and `weatherforecast`.
- Removed `DAYAFTERTOMORROW` from English.

### Updated

- Updated dependencies.
- Updated jsdoc.
- Updated font tree to use variables consistently.
- Removed deprecated Docker Repository from issue template.

### Fixed

- Broadcast all calendar events while still honoring global and per-calendar maximumEntries.
- Respect rss ttl provided by newsfeed (#2883).
- Fix multi day calendar events always presented as "(1/X)" instead of the amount of days the event has progressed.
- Fix weatherbit provider to use type config value instead of endpoint.
- Fix calendar events which DO NOT specify rrule byday adjusted incorrectly (#2885).
- Fix e2e tests not failing on errors (#2911).

## [2.20.0] - 2022-07-02

Special thanks to the following contributors: @eouia, @khassel, @kolbyjack, @KristjanESPERANTO, @nathannaveen, @naveensrinivasan, @rejas, @rohitdharavath and @sdetweil.

### Added

- Added a new config option `httpHeaders` used by helmet (see <https://helmetjs.github.io/>). You can now set own httpHeaders which will override the defaults in `js/defaults.js` which is useful e.g. if you want to embed MagicMirror into another website (solves #2847).
- Show endDate for calendar events when dateHeader is enabled and showEnd is set to true (#2192).
- Added the notification emitting from the weather module on information updated.
- Use recommended file extension for YAML files (#2864).

### Updated

- Use latest node 18 when running tests on github actions.
- Updated `electron` to v19 and other dependencies.
- Use internal fetch function of node instead external `node-fetch` library if used node version >= `v18`.
- Include duplicate events in broadcasts.

### Fixed

- Fix problems with non latin fonds caused by updating to fontsource (fixes #2835).

## [2.19.0] - 2022-04-01

Special thanks to the following contributors: @10bias, @CFenner, @JHWelch, @k1rd3rf, @khassel, @kolbyjack, @krekos, @KristjanESPERANTO, @Nerfzooka, @oraclesean, @oscarb, @philnagel, @rejas, @sdetweil, @shin10, @SiderealArt and @Tom-Hirschberger.

### Added

- Added a config option under the weather module, `absoluteDates`, providing an option to format weather forecast date output with either absolute or relative dates.
- Added test for new weather forecast `absoluteDates` property.
- The modules get a class hidden added/removed if they get hidden/shown which will also toggle pointer-events.
- Added new config option `showTitleAsUrl` to newsfeed module. If set, the displayed title is a link to the article which is useful when running in a browser and you want to read this article.
- Added internal cors proxy to get weather-providers working without public proxies (fixes #2714). The new url `http(s)://address:port/cors?url=https://whatever-to-proxy` can be used in other modules too.
- Added a WeatherProvider for Weatherflow.
- Added new env var `ELECTRON_DISABLE_GPU` which disable gpu under electron if set (fixes #2831).
- Added missing Czech translations.

### Updated

- Deprecated roboto fonts package `roboto-fontface-bower` replaced with `fontsource`.
- Updated `electron` to v17, `helmet` to v5 (use defaults of v4) and other dependencies
- Updated Font Awesome css class to new default style (fixes #2768)
- Replaced deprecated modules `currentweather` and `weatherforecast` with dummy modules only displaying that they have to be replaced.
- Include all calendar events from the configured date range when broadcasting.
- Updated Danish and German translation.
- Updated `node-ical` to v0.15 and added `luxon` as dependency for not breaking the "no-optional" install (see #2718 and #2824).

### Fixed

- Improved and speedup e2e tests, artificial wait after mm start removed.
- Improved husky setup not blocking `git commit` if `husky` or `npm` is not installed.
- Using a consistent spelling of MagicMirror².
- Fix minor console output issue for loading translations (#2814).
- Don't adjust startDate for full day events if endDate is in the past.
- Fix windspeed conversion error in openweathermap provider. (#2812)
- Fix conflicting parameter turning off showEnd for full day events. (#2629)
- Fix regression, calendar.maximumEntries not used to filter calendar level entries (#2868)

## [2.18.0] - 2022-01-01

Special thanks to the following contributors: @AmpioRosso, @eouia, @fewieden, @jupadin, @khassel, @kolbyjack, @KristjanESPERANTO, @MariusVaice, @rejas, @rico24 and @sdetweil.

### Added

- Added test for calendar recurring event with checks the correct date displayed (related to #2752).

### Updated

- ESLint version supports now ECMAScript 2018.
- Cleaned up `updatenotification` module and switched to nunjuck template.
- Moved calendar tests from category `electron` to `e2e`.
- Updated missed translations for Korean language (ko.json).
- Updated missed translations for Dutch language (nl.json).
- Cleaned up `alert` module and switched to nunjuck template.
- Moved weather tests from category `electron` to `e2e`.
- Updated github actions.
- Replace spectron with playwright, update dependencies including electron update to v16.
- Added lithuanian language to translations.js.
- Show info message if newsfeed is empty (fixes #2731).
- Added dangerouslyDisableAutoEscaping config option for newsfeed templates (fixes #2712).
- Added missing shebang to `installers/mm.sh`.
- Node versions in templates and github workflows.
- Updated translations for Traditional Chinese (Taiwan) (zh-tw.json).

### Fixed

- Fixed wrong file `kr.json` to `ko.json`. Use language code 'ko' instead of 'kr' for Korean language.
- Fixed `feels_like` data from openweathermap's current weather being ignored (#2678).
- Fixed chaotic newsfeed display after network connection loss thanks to @jalibu (#2638).
- Fixed incorrect time zone correction of recurring full day events (#2632 and #2634).
- Fixed e2e tests by increasing testTimeout.
- Revert node-ical update due to missing luxon package.
- Fixed User-Agent-Header for newsfeed and calendar module (#2729).
- Replace broken shields in Readme and use https for links.
- Fixed electron tests with retry.
- Fixed Calendar recurring cross timezone error (add/subtract a day, not just offset hours) (#2632).
- Fixed Calendar showEnd and Full Date overlay (#2629).
- Fixed regression on #2632, #2752.
- Broadcast custom symbols in CALENDAR_EVENTS.

## [2.17.1] - 2021-10-01

### Fixed

- Fixed error when accessing letsencrypt certificates
- Fixed Calendar module enhancement: displaying full events without time (#2424)

## [2.17.0] - 2021-10-01

Special thanks to the following contributors: @apiontek, @eouia, @jupadin, @khassel and @rejas.

### Added

- Added showTime parameter to clock module for enabling/disabling time display in analog clock.
- Added custom electron switches from user config (`config.electronSwitches`).
- Added unit tests for updatenotification module.

### Updated

- Bump electron to v13 (and spectron to v15) and update other dependencies in package.json.
- Refactor test configs, use default test config for all tests.
- Updated github templates.
- Actually test all js and css files when lint script is run.
- Updated jsdocs and print warnings during testing too.
- Updated weathergov provider to try fetching not just current, but also forecast, when API URLs available.
- Refactored clock layout.
- Refactored methods from weather-providers into weatherobject (isDaytime, updateSunTime).
- Use of `logger.js` in jest tests.
- Run prettier over all relevant files.
- Move tests needing electron in new category `electron`, use `server only` mode in `e2e` tests.
- Updated dependencies in package.json.

### Fixed

- Fix undefined error with ignoreToday option in weather module (#2620).
- Fix time zone correction in calendar module when the date hour is equal to the time zone correction value (#2632).
- Fix black cursor on startup when using electron.
- Fix update notification not working for own repository (#2644).

## [2.16.0] - 2021-07-01

Special thanks to the following contributors: @210954, @B1gG, @codac, @Crazylegstoo, @daniel, @earlman, @ezeholz, @FrancoisRmn, @jupadin, @khassel, @KristjanESPERANTO, @njwilliams, @oemel09, @r3wald, @rejas, @rico24, Faizan Ahmed.

### Added

- Added French translations for "MODULE_CONFIG_ERROR" and "PRECIP".
- Added German translation for "PRECIP".
- Added Dutch translation for "WEEK", "PRECIP", "MODULE_CONFIG_CHANGED" and "MODULE_CONFIG_ERROR".
- Added first test for Alert module.
- Added support for `dateFormat` when not using `timeFormat: "absolute"`.
- Added custom-properties for colors and fonts for improved styling experience, see `custom.css.sample` file.
- Added custom-properties for gaps around body and between modules.
- Added test case for recurring calendar events.
- Added new Environment Canada provider for default WEATHER module (weather data for Canadian locations only).
- Added list view for newsfeed module.
- Added dev dependency jest, switching from mocha to jest.

### Updated

- Bump node-ical to v0.13.0 (now last runtime dependency using deprecated `request` package is removed).
- Use codecov in informational mode.
- Refactor code into es6 where possible (e.g. var -> let/const).
- Use node v16 in github workflow (replacing node v10).
- Moved some files into better suited directories.
- Updated dependencies in package.json, require node >= v12, remove `rrule-alt` and `rrule`.
- Updated dependencies in package.json and migrate husky to v6, fix husky setup in prod environment.
- Cleaned up error handling in newsfeed and calendar modules for real.
- Updated default WEATHER module such that a provider can optionally set a custom unit-of-measure for precipitation (`weatherObject.precipitationUnits`).
- Updated documentation.
- Updated jest tests: Reset changes on js/logger.js, mock logger.js in global_vars tests.
- Updated dependencies in package.json.

### Removed

- Switching from mocha to jest so removed following dev dependencies: chai, chai-as-promised, mocha, mocha-each, mocha-logger.

### Fixed

- Fix calendar start function logging inconsistency.
- Fix updatenotification start function logging inconsistency.
- Checks and applies the showDescription setting for the newsfeed module again.
- Fix issue with openweathermap not showing current or forecast info when using onecall API.
- Fix tests in weather module and add one for decimalPoint in forecast.
- Fix decimalSymbol in the forecast part of the new weather module (#2530).
- Fix wrong treatment of `appendLocationNameToHeader` when using `ukmetofficedatahub`.
- Fix alert not recognizing multiple alerts (#2522).
- Fix fetch option httpsAgent to agent in calendar module (#466).
- Fix module updatenotification which did not work for repos with many refs (#1907).
- Fix config check failing when encountering let syntax ("Parsing error: Unexpected token config").
- Fix calendar debug check.
- Really run prettier over all files.
- Fix logger.js after jest changes, use --forceExit running jest.
- Workaround for dev_console test using getWindowCount.

## [2.15.0] - 2021-04-01

Special thanks to the following contributors: @EdgardosReis, @MystaraTheGreat, @TheDuffman85, @ashishtank, @buxxi, @codac, @fewieden, @khassel, @klaernie, @qu1que, @rejas, @sdetweil & @thomasrockhu.

ℹ️ **Note:** This update uses new dependencies. Please update using the following command: `git pull && npm install`.

### Added

- Added Galician language.
- Added GitHub workflows for automated testing and changelog enforcement.
- Added CodeCov badge to Readme.
- Added CURRENTWEATHER_TYPE notification to currentweather and weather module, use it in compliments module.
- Added `start:dev` command to the npm scripts for starting electron with devTools open.
- Added logging when using deprecated modules weatherforecast or currentweather.
- Added Portuguese translations for "MODULE_CONFIG_CHANGED" and "PRECIP".
- Respect parameter ColoredSymbolOnly also for custom events.
- Added a new parameter to hide time portion on relative times.
- `module.show` has now the option for a callback on error.
- Added locale to sample config file.
- Added support for self-signed certificates for the default calendar module (#466).
- Added hiddenOnStartup flag to module config (#2475).

### Updated

- Updated markdown files for github.
- Cleaned up old code on server side.
- Convert `-0` to `0` when displaying temperature.
- Code cleanup for FEELS like and added {DEGREE} placeholder for FEELSLIKE for each language.
- Converted newsfeed module to use templates.
- Updated documentation and help screen about invalid config files.
- Moving weather-provider specific code and configuration into each provider and making hourly part of the interface.
- Bump electron to v11 and enable contextIsolation.
- Don't update the DOM when a module is not displayed.
- Cleaned up jsdoc and tests.
- Exposed logger as node module for easier access for 3rd party modules.
- Replaced deprecated `request` package with `node-fetch` and `digest-fetch`.
- Refactored calendar fetcher.
- Cleaned up newsfeed module.
- Cleaned up translations and translator code.

### Removed

- Removed danger.js library.
- Removed `ical` which was substituted by `node-ical` in release `v2.13.0`. Module developers must install this dependency themselves in the module folder if needed.
- Removed valid-url library.

### Fixed

- Added default log levels to stop calendar log spamming.
- Fix socket.io cors errors, see [breaking change since socket.io v3](https://socket.io/docs/v3/handling-cors/).
- Fix Issue with weather forecast icons due to fixed day start and end time (#2221).
- Fix empty directory for each module's main javascript file in the inspector.
- Fix Issue with weather forecast icons unit tests with different timezones (#2221).
- Fix issue with unencoded characters in translated strings when using nunjuck template (`Loading &hellip;` as an example).
- Fix socket.io backward compatibility with socket v2 clients.
- Fix 3rd party module language loading if language is English.
- Fix e2e tests after spectron update.
- Fix updatenotification creating zombie processes by setting a timeout for the git process.
- Fix weather module openweathermap not loading if lat and lon set without onecall.
- Fix calendar daylight savings offset calculation if recurring start date before 2007.
- Fix calendar time/date adjustment when time with GMT offset is different day (#2488).
- Fix calendar daylight savings offset calculation if recurring FULL DAY start date before 2007 (#2483).
- Fix newsreaders template, for wrong test for nowrap in 2 places (should be if not).

## [2.14.0] - 2021-01-01

Special thanks to the following contributors: @Alvinger, @AndyPoms, @ashishtank, @bluemanos, @flopp999, @jakemulley, @jakobsarwary1, @marvai-vgtu, @mirontoli, @rejas, @sdetweil, @Snille & @Sub028.

ℹ️ **Note:** This update uses new dependencies. Please update using the following command: `git pull && npm install`.

### Added

- Added new log level "debug" to the logger.
- Added new parameter "useKmh" to weather module for displaying wind speed as kmh.
- Added Chuvash translation.
- Added Weatherbit as a provider to Weather module.
- Added SMHI as a provider to Weather module.
- Added Hindi & Gujarati translation.
- Added optional support for DEGREE position in Feels like translation.
- Added support for variables in nunjucks templates for translate filter.
- Added Chuvash translation.
- Added new option "limitDays" - limit the number of discreet days displayed.
- Added new option "customEvents" - use custom symbol/color based on keyword in event title.

### Updated

- Merging .gitignore in the config-folder with the .gitignore in the root-folder.
- Weather module - forecast now show TODAY and TOMORROW instead of weekday, to make it easier to understand.
- Updated dependencies to latest versions.
- Updated dependencies eslint, feedme, simple-git and socket.io to latest versions.
- Updated lithuanian translation.
- Updated config sample.
- Highlight required version mismatch.
- No select Text for TouchScreen use.
- Corrected logic for timeFormat "relative" and "absolute".
- Added missing function call in module.show()
- Translator variables can have falsy values (e.g. empty string)
- Fix issue with weather module with DEGREE label in FEELS like

### Deleted

- Removed Travis CI integration.

### Fixed

- JSON Parse translation files with comments crashing UI. (#2149)
- Calendar parsing where RRULE bug returns wrong date, add Windows timezone name support. (#2145, #2151)
- Wrong node-ical version installed (package.json) requested version. (#2153)
- Fix calendar fetcher subsequent timing. (#2160)
- Rename Greek translation to correct ISO 639-1 alpha-2 code (gr > el). (#2155)
- Add a space after icons of sunrise and sunset. (#2169)
- Fix calendar when no DTEND record found in event, startDate overlay when endDate set. (#2177)
- Fix windspeed conversion error in ukmetoffice weather-provider. (#2189)
- Fix console.debug not having timestamps. (#2199)
- Fix calendar full day event east of UTC start time. (#2200)
- Fix non-fullday recurring rule processing. (#2216)
- Catch errors when parsing calendar data with ical. (#2022)
- Fix Default Alert Module does not hide black overlay when alert is dismissed manually. (#2228)
- Weather module - Always displays night icons when local is other than English. (#2221)
- Updated node-ical 0.12.4, fix invalid RRULE format in cal entries
- Fix package.json for optional electron dependency (2378)
- Updated node-ical version again, 0.12.5, change RRULE fix (#2371, #2379)
- Remove undefined objects from modules array (#2382)
- Updated node-ical version again, 0.12.7, change RRULE fix (#2371, #2379), node-ical now throws error (which we catch)
- Updated simple-git version to 2.31 unhandled promise rejection (#2383)

## [2.13.0] - 2020-10-01

Special thanks to the following contributors: @bryanzzhu, @bugsounet, @chamakura, @cjbrunner, @easyas314, @larryare, @oemel09, @rejas, @sdetweil & @sthuber90.

ℹ️ **Note:** This update uses new dependencies. Please update using the following command: `git pull && npm install`.

### Added

- `--dry-run` Added option in fetch call within updatenotification node_helper. This is to prevent
  MagicMirror² from consuming any fetch result. Causes conflict with MMPM when attempting to check
  for updates to MagicMirror² and/or MagicMirror² modules.
- Test coverage with Istanbul, run it with `npm run test:coverage`.
- Added lithuanian language.
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
- Fix the use of "maxNumberOfDays" in the module "weatherforecast depending on the endpoint (forecast/daily or forecast)". [#2018](https://github.com/MagicMirrorOrg/MagicMirror/issues/2018)
- Fix calendar display. Account for current timezone. [#2068](https://github.com/MagicMirrorOrg/MagicMirror/issues/2068)
- Fix logLevel being set before loading config.
- Fix incorrect namespace links in svg clockfaces. [#2072](https://github.com/MagicMirrorOrg/MagicMirror/issues/2072)
- Fix weather/providers/weathergov for API guidelines. [#2045](https://github.com/MagicMirrorOrg/MagicMirror/issues/2045)
- Fix "undefined" in weather modules header. [#1985](https://github.com/MagicMirrorOrg/MagicMirror/issues/1985)
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

- The broken modules due to Socket.io change from last release. [#1973](https://github.com/MagicMirrorOrg/MagicMirror/issues/1973)
- Add backward compatibility for old module code in socketclient.js. [#1973](https://github.com/MagicMirrorOrg/MagicMirror/issues/1973)
- Support multiple instances of calendar module with different config. [#1109](https://github.com/MagicMirrorOrg/MagicMirror/issues/1109)
- Fix the use of "maxNumberOfDays" in the module "weatherforecast". [#2018](https://github.com/MagicMirrorOrg/MagicMirror/issues/2018)
- Throw error when check_config fails. [#1928](https://github.com/MagicMirrorOrg/MagicMirror/issues/1928)
- Bug fix related to 'maxEntries' not displaying Calendar events. [#2050](https://github.com/MagicMirrorOrg/MagicMirror/issues/2050)
- Updated ical library to the latest version. [#1926](https://github.com/MagicMirrorOrg/MagicMirror/issues/1926)
- Fix config check after merge of prettier [#2109](https://github.com/MagicMirrorOrg/MagicMirror/issues/2109)

## [2.11.0] - 2020-04-01

🚨 READ THIS BEFORE UPDATING 🚨

In the past years the project has grown a lot. This came with a huge downside: poor maintainability. If I let the project continue the way it was, it would eventually crash and burn. More important: I would completely lose the drive and interest to continue the project. Because of this the decision was made to simplify the core by removing all side features like automatic installers and support for exotic platforms. This release (2.11.0) is the first real release that will reflect (parts) of these changes. As a result of this, some things might break. So before you continue make sure to backup your installation. Your config, your modules or better yet: your full MagicMirror² folder. In other words: update at your own risk.

For more information regarding this major change, please check issue [#1860](https://github.com/MagicMirrorOrg/MagicMirror/issues/1860).

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
- Fixed weather tests [#1840](https://github.com/MagicMirrorOrg/MagicMirror/issues/1840)
- Fixed Socket.io can't be used with Reverse Proxy in serveronly mode [#1934](https://github.com/MagicMirrorOrg/MagicMirror/issues/1934)
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
- Updated compliments.js to handle newline in text, as text fields to not interpolate contents.
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
- The css/custom.css will be renamed after the next release. We've added into `run-start.sh` an instruction by GIT to ignore with `--skip-worktree` and `rm --cached`. [#1540](https://github.com/MagicMirrorOrg/MagicMirror/issues/1540)
- Disable sending of notification CLOCK_SECOND when displaySeconds is false.

### Fixed

- Updatenotification module: Properly handle race conditions, prevent crash.
- Send `NEWS_FEED` notification also for the first news messages which are shown.
- Fixed issue where weather module would not refresh data after a network or API outage. [#1722](https://github.com/MagicMirrorOrg/MagicMirror/issues/1722)
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
- Added feature to broadcast news feed items `NEWS_FEED` and updated news items `NEWS_FEED_UPDATED` in default [newsfeed](https://github.com/MagicMirrorOrg/MagicMirror/tree/develop/modules/default/newsfeed) module (when news is updated) with documented default and `config.js` options in [README.md](https://github.com/MagicMirrorOrg/MagicMirror/blob/develop/modules/default/newsfeed/README.md)
- Added notifications to default `clock` module broadcasting `CLOCK_SECOND` and `CLOCK_MINUTE` for the respective time elapsed.
- Added UK Met Office Datapoint feed as a provider in the default weather module.
- Added new provider class
- Added suncalc.js dependency to calculate sun times (not provided in UK Met Office feed)
- Added "tempUnits" and "windUnits" to allow, for example, temp in metric (i.e. celsius) and wind in imperial (i.e. mph). These will override "units" if specified, otherwise the "units" value will be used.
- Use Feels Like temp from feed if present
- Optionally display probability of precipitation (PoP) in current weather (UK Met Office data)
- Automatically try to fix eslint errors by passing `--fix` option to it
- Added sunrise and sunset times to weathergov weather-provider [#1705](https://github.com/MagicMirrorOrg/MagicMirror/issues/1705)
- Added "useLocationAsHeader" to display "location" in `config.js` as header when location name is not returned
- Added to `newsfeed.js`: in order to design the news article better with css, three more class-names were introduced: newsfeed-desc, newsfeed-desc, newsfeed-desc

### Updated

- English translation for "Feels" to "Feels like"
- Fixed the example calendar url in `config.js.sample`
- Updated `ical.js` to solve various calendar issues.
- Updated weather city list url [#1676](https://github.com/MagicMirrorOrg/MagicMirror/issues/1676)
- Only update clock once per minute when seconds aren't shown
- Updated weather-provider documentation.

### Fixed

- Fixed uncaught exception, race condition on module update
- Fixed issue [#1696](https://github.com/MagicMirrorOrg/MagicMirror/issues/1696), some ical files start date to not parse to date type
- Allowance HTML5 autoplay-policy (policy is changed from Chrome 66 updates)
- Handle SIGTERM messages
- Fixes sliceMultiDayEvents so it respects maximumNumberOfDays
- Minor types in default NewsFeed [README.md](https://github.com/MagicMirrorOrg/MagicMirror/blob/develop/modules/default/newsfeed/README.md)
- Fix typos and small syntax errors, cleanup dependencies, remove multiple-empty-lines, add semi-rule
- Fixed issues with calendar not displaying one-time changes to repeating events
- Updated the fetchedLocationName variable in currentweather.js so that city shows up in the header

### Updated installer

- give non-pi2+ users (pi0, odroid, jetson nano, mac, windows, ...) option to continue install
- use current username vs hardcoded 'pi' to support non-pi install
- check for npm installed. node install doesn't do npm anymore
- check for mac as part of PM2 install, add install option string
- Updated pm2 config with current username instead of hard coded 'pi'
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

- Bumped the Electron dependency to v3.0.13 to support the most recent Raspbian. [#1500](https://github.com/MagicMirrorOrg/MagicMirror/issues/1500)
- Updated modernizr code in alert module, fixed a small typo there too
- More verbose error message on console if the config is malformed
- Updated installer script to install Node.js version 10.x

### Fixed

- Fixed temperature displays in currentweather and weatherforecast modules [#1503](https://github.com/MagicMirrorOrg/MagicMirror/issues/1503), [#1511](https://github.com/MagicMirrorOrg/MagicMirror/issues/1511).
- Fixed unhandled error on bad git data in updatenotification module [#1285](https://github.com/MagicMirrorOrg/MagicMirror/issues/1285).
- Weather forecast now works with openweathermap in new weather module. Daily data are displayed, see issue [#1504](https://github.com/MagicMirrorOrg/MagicMirror/issues/1504).
- Fixed analogue clock border display issue where non-black backgrounds used (previous fix for issue 611)
- Fixed compatibility issues caused when modules request different versions of Font Awesome, see issue [#1522](https://github.com/MagicMirrorOrg/MagicMirror/issues/1522). MagicMirror² now uses [Font Awesome 5 with v4 shims included for backwards compatibility](https://fontawesome.com/how-to-use/on-the-web/setup/upgrading-from-version-4#shims).
- Installation script problems with raspbian
- Calendar: only show repeating count if the event is actually repeating [#1534](https://github.com/MagicMirrorOrg/MagicMirror/pull/1534)
- Calendar: Fix exdate handling when multiple values are specified (comma separated)
- Calendar: Fix relative date handling for fulldate events, calculate difference always from start of day [#1572](https://github.com/MagicMirrorOrg/MagicMirror/issues/1572)
- Fix null dereference in moduleNeedsUpdate when the module isn't visible
- Calendar: Fixed event end times by setting default calendarEndTime to "LT" (Local time format). [#1479]
- Calendar: Fixed missing calendar fetchers after server process restarts [#1589](https://github.com/MagicMirrorOrg/MagicMirror/issues/1589)
- Notification: fixed background color (was white text on white background)
- Use getHeader instead of data.header when creating the DOM so overwriting the function also propagates into it
- Fix documentation of `useKMPHwind` option in currentweather

### New weather module

- Fixed weather forecast table display [#1499](https://github.com/MagicMirrorOrg/MagicMirror/issues/1499).
- Dimmed loading indicator for weather forecast.
- Implemented config option `decimalSymbol` [#1499](https://github.com/MagicMirrorOrg/MagicMirror/issues/1499).
- Aligned indoor values in current weather vertical [#1499](https://github.com/MagicMirrorOrg/MagicMirror/issues/1499).
- Added humidity support to nunjuck unit filter.
- Do not display degree symbol for temperature in Kelvin [#1503](https://github.com/MagicMirrorOrg/MagicMirror/issues/1503).
- Weather forecast now works with openweathermap for both, `/forecast` and `/forecast/daily`, in new weather module. If you use the `/forecast`-weatherEndpoint, the hourly data are converted to daily data, see issues [#1504](https://github.com/MagicMirrorOrg/MagicMirror/issues/1504), [#1513](https://github.com/MagicMirrorOrg/MagicMirror/issues/1513).
- Added fade, fadePoint and maxNumberOfDays properties to the forecast mode [#1516](https://github.com/MagicMirrorOrg/MagicMirror/issues/1516)
- Fixed Loading string and decimalSymbol string replace [#1538](https://github.com/MagicMirrorOrg/MagicMirror/issues/1538)
- Show Snow amounts in new weather module [#1545](https://github.com/MagicMirrorOrg/MagicMirror/issues/1545)
- Added weather.gov as a new weather-provider for US locations

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
- Fading for dateheaders timeFormat in Calendar [#1464](https://github.com/MagicMirrorOrg/MagicMirror/issues/1464)
- Documentation for the existing `scale` option in the Weather Forecast module.

### Fixed

- Allow parsing recurring calendar events where the start date is before 1900
- Fixed Polish translation for Single Update Info
- Ignore entries with unparseable details in the calendar module
- Bug showing FullDayEvents one day too long in calendar fixed
- Bug in newsfeed when `removeStartTags` is used on the description [#1478](https://github.com/MagicMirrorOrg/MagicMirror/issues/1478)

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
- Fixed mixup between german and spanish translation for newsfeed.
- Fixed close dates to be absolute, if no configured in the config.js - module Calendar
- Fixed the updatenotification module message about new commits in the repository, so they can be correctly localized in singular and plural form.
- Fix for weatherforecast rainfall rounding [#1374](https://github.com/MagicMirrorOrg/MagicMirror/issues/1374)
- Fix calendar parsing issue for Midori on Raspberry Pi Zero w, related to issue #694.
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

⚠️ **Warning:** This release includes an updated version of Electron. This requires a Raspberry Pi configuration change to allow the best performance and prevent the CPU from overheating. Please read the information on the [MagicMirror² Wiki](https://github.com/MagicMirrorOrg/MagicMirror/wiki/configuring-the-raspberry-pi#enable-the-open-gl-driver-to-decrease-electrons-cpu-usage).

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
- Invoke module suspend even if no dom content. [#1308](https://github.com/MagicMirrorOrg/MagicMirror/issues/1308)

### Fixed

- Fixed issue where wind chill could not be displayed in Fahrenheit. [#1247](https://github.com/MagicMirrorOrg/MagicMirror/issues/1247)
- Fixed issues where a module crashes when it tries to dismiss a non existing alert. [#1240](https://github.com/MagicMirrorOrg/MagicMirror/issues/1240)
- In default module currentWeather/currentWeather.js line 296, 300, self.config.animationSpeed can not be found because the notificationReceived function does not have "self" variable.
- Fixed browser-side code to work on the Midori browser.
- Fixed issue where heat index was reporting incorrect values in Celsius and Fahrenheit. [#1263](https://github.com/MagicMirrorOrg/MagicMirror/issues/1263)
- Fixed weatherforecast to use dt_txt field instead of dt to handle timezones better
- Newsfeed now remembers to show the description when `"ARTICLE_LESS_DETAILS"` is called if the user wants to always show the description. [#1282](https://github.com/MagicMirrorOrg/MagicMirror/issues/1282)
- `clientonly/*.js` is now linted, and one linting error is fixed
- Fix issue #1196 by changing underscore to hyphen in locale id, in align with moment.js.
- Fixed issue where heat index and wind chill were reporting incorrect values in Kelvin. [#1263](https://github.com/MagicMirrorOrg/MagicMirror/issues/1263)

### Updated

- Updated Italian translation
- Updated German translation
- Updated Dutch translation

## [2.3.1] - 2018-04-01

### Fixed

- Downgrade electron to 1.4.15 to solve the black screen issue.[#1243](https://github.com/MagicMirrorOrg/MagicMirror/issues/1243)

## [2.3.0] - 2018-04-01

### Added

- Add new settings in compliments module: setting time intervals for morning and afternoon
- Add system notification `MODULE_DOM_CREATED` for notifying each module when their Dom has been fully loaded.
- Add types for module.
- Implement Danger.js to notify contributors when CHANGELOG.md is missing in PR.
- Allow scrolling in full page article view of default newsfeed module with gesture events from [MMM-Gestures](https://github.com/thobach/MMM-Gestures)
- Changed 'compliments.js' - Updated DOM if remote compliments are loaded instead of waiting one updateInterval to show custom compliments
- Automated unit tests utils, deprecated, translator, cloneObject(lockStrings)
- Automated integration tests translations
- Add advanced filtering to the excludedEvents configuration of the default calendar module
- New currentweather module config option: `showFeelsLike`: Shows how it actually feels like. (wind chill or heat index)
- New currentweather module config option: `useKMPHwind`: adds an option to see wind speed in Kmph instead of just m/s or Beaufort.
- Add dc:date to parsing in newsfeed module, which allows parsing of more rss feeds.

### Changed

- Add link to GitHub repository which contains the respective Dockerfile.
- Optimized automated unit tests cloneObject, cmpVersions
- Updated notifications use now translation templates instead of normal strings.
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
- Fixed ipWhitelist behavior to make empty whitelist ([]) allow any and all hosts access to the MM.
- Fixed issue with calendar module where 'excludedEvents' count towards 'maximumEntries'.
- Fixed issue with calendar module where global configuration of maximumEntries was not overridden by calendar specific config (see module doc).
- Fixed issue where `this.file(filename)` returns a path with two hashes.
- Workaround for the WeatherForecast API limitation.

## [2.1.2] - 2017-07-01

### Changed

- Revert Docker related changes in favor of [docker-MagicMirror](https://github.com/bastilimbach/docker-MagicMirror). All Docker images are outsourced. ([#856](https://github.com/MagicMirrorOrg/MagicMirror/pull/856))
- Change Docker base image (Debian + Node) to an arm based distro (AlpineARM + Node) ([#846](https://github.com/MagicMirrorOrg/MagicMirror/pull/846))
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
- Switched out `rrule` package for `rrule-alt` and fixes in `ical.js` in order to fix calendar issues. ([#565](https://github.com/MagicMirrorOrg/MagicMirror/issues/565))
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

- Added Docker support (Pull Request [#673](https://github.com/MagicMirrorOrg/MagicMirror/pull/673)).
- Calendar-specific support for `maximumEntries`, and `maximumNumberOfDays`.
- Add loaded function to modules, providing an async callback.
- Made default newsfeed module aware of gesture events from [MMM-Gestures](https://github.com/thobach/MMM-Gestures)
- Add use pm2 for manager process into Installer RaspberryPi script.
- Russian Translation.
- Afrikaans Translation.
- Add postinstall script to notify user that MagicMirror² installed successfully despite warnings from NPM.
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
- Added test ipWhitelist configuration directive.
- Added test for calendar module: default, basic-auth, backward compatibility, fail-basic-auth.
- Added meta tags to support fullscreen mode on iOS (for server mode)
- Added `ignoreOldItems` and `ignoreOlderThan` options to the News Feed module
- Added test for MM_PORT environment variable.
- Added a configurable Week section to the clock module.

### Fixed

- Updated .gitignore to not ignore default modules folder.
- Remove white flash on boot up.
- Added `update` in Raspberry Pi installation script.
- Fix an issue where the analog clock looked scrambled. ([#611](https://github.com/MagicMirrorOrg/MagicMirror/issues/611))
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
- Option to limit access to certain IP addresses based on the value of `ipWhitelist` in the `config.js`, default is access from localhost only (Issue [#456](https://github.com/MagicMirrorOrg/MagicMirror/issues/456)).
- Added ability to change the point of time when calendar events get relative.
- Add Splash screen on boot.
- Add option to show humidity in currentWeather module.
- Add VSCode IntelliSense support.
- Module API: Add Visibility locking to module system. [See documentation](https://github.com/MagicMirrorOrg/MagicMirror/tree/develop/modules#visibility-locking) for more information.
- Module API: Method to overwrite the module's header. [See documentation](https://github.com/MagicMirrorOrg/MagicMirror/tree/develop/modules#getheader) for more information.
- Module API: Option to define the minimum MagicMirror² version to run a module. [See documentation](https://github.com/MagicMirrorOrg/MagicMirror/tree/develop/modules#requiresversion) for more information.
- Calendar module now broadcasts the event list to all other modules using the notification system. [See documentation](https://github.com/MagicMirrorOrg/MagicMirror/tree/develop/modules/default/calendar) for more information.
- Possibility to use the calendar feed as the source for the weather (currentweather & weatherforecast) location data. [See documentation](https://github.com/MagicMirrorOrg/MagicMirror/tree/develop/modules/default/weatherforecast) for more information.
- Added option to show rain amount in the weatherforecast default module
- Add module `updatenotification` to get an update whenever a new version is available. [See documentation](https://github.com/MagicMirrorOrg/MagicMirror/tree/develop/modules/default/updatenotification) for more information.
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
- Updated the .github templates and information with more modern information.
- Updated the Gruntfile with a more functional StyleLint implementation.

## [2.0.4] - 2016-08-07

### Added

- Brazilian Portuguese Translation.
- Option to enable Kiosk mode.
- Added ability to start the app with Dev Tools.
- Added ability to turn off the date display in `clock.js` when in analog mode.
- Greek Translation

### Fixed

- Prevent `getModules()` selectors from returning duplicate entries.
- Append endpoints of weather modules with `/` to retrieve the correct data. (Issue [#337](https://github.com/MagicMirrorOrg/MagicMirror/issues/337))
- Corrected grammar in `module.js` from 'suspend' to 'suspended'.
- Fixed openweathermap.org URL in config sample.
- Prevent currentweather module from crashing when received data object is incorrect.
- Fix issue where translation loading prevented the UI start-up when the language was set to 'en'. (Issue [#388](https://github.com/MagicMirrorOrg/MagicMirror/issues/388))

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

- Edit Alert Module to display title & message if they are provided in the notification (Issue [#300](https://github.com/MagicMirrorOrg/MagicMirror/issues/300))
- Removed 'null' reference from updateModuleContent(). This fixes recent Edge and Internet Explorer browser displays (Issue [#319](https://github.com/MagicMirrorOrg/MagicMirror/issues/319))

### Changed

- Added default string to calendar titleReplace.

## [2.0.2] - 2016-06-05

### Added

- Norwegian Translations (nb and nn)
- Portuguese Translation
- Swedish Translation

### Fixed

- Added reference to Italian Translation.
- Added the missing NE translation to all languages. [#344](https://github.com/MagicMirrorOrg/MagicMirror/issues/344)
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

### Initial release of MagicMirror

This was part of the blogpost: [https://michaelteeuw.nl/post/83916869600/magic-mirror-part-vi-production-of-the](https://michaelteeuw.nl/post/83916869600/magic-mirror-part-vi-production-of-the)

[2.30.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.29.0...v2.30.0
[2.29.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.28.0...v2.29.0
[2.28.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.27.0...v2.28.0
[2.27.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.26.0...v2.27.0
[2.26.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.25.0...v2.26.0
[2.25.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.24.0...v2.25.0
[2.24.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.23.0...v2.24.0
[2.23.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.22.0...v2.23.0
[2.22.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.21.0...v2.22.0
[2.21.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.20.0...v2.21.0
[2.20.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.19.0...v2.20.0
[2.19.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.18.0...v2.19.0
[2.18.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.17.1...v2.18.0
[2.17.1]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.17.0...v2.17.1
[2.17.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.16.0...v2.17.0
[2.16.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.15.0...v2.16.0
[2.15.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.14.0...v2.15.0
[2.14.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.13.0...v2.14.0
[2.13.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.12.0...v2.13.0
[2.12.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.11.0...v2.12.0
[2.11.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.10.1...v2.11.0
[2.10.1]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.10.0...v2.10.1
[2.10.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.9.0...v2.10.0
[2.9.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.8.0...v2.9.0
[2.8.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.7.1...v2.8.0
[2.7.1]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.7.0...v2.7.1
[2.7.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.6.0...v2.7.0
[2.6.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.5.0...v2.6.0
[2.5.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.4.1...v2.5.0
[2.4.1]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.4.0...v2.4.1
[2.4.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.3.1...v2.4.0
[2.3.1]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.3.0...v2.3.1
[2.3.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.2.2...v2.3.0
[2.2.2]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.2.1...v2.2.2
[2.2.1]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.1.3...v2.2.0
[2.1.3]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.1.2...v2.1.3
[2.1.2]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.1.1...v2.1.2
[2.1.1]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.0.5...v2.1.0
[2.0.5]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.0.4...v2.0.5
[2.0.4]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.0.3...v2.0.4
[2.0.3]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.0.2...v2.0.3
[2.0.2]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/MagicMirrorOrg/MagicMirror/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/MagicMirrorOrg/MagicMirror/releases/tag/v2.0.0
