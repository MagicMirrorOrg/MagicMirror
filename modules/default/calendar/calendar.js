/* global cloneObject */

/* Magic Mirror
 * Module: Calendar
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
Module.register("calendar", {
	// Define module defaults
	defaults: {
		maximumEntries: 10, // Total Maximum Entries
		maximumNumberOfDays: 365,
		limitDays: 0, // Limit the number of days shown, 0 = no limit
		displaySymbol: true,
		defaultSymbol: "calendar", // Fontawesome Symbol see https://fontawesome.com/cheatsheet?from=io
		showLocation: false,
		displayRepeatingCountTitle: false,
		defaultRepeatingCountTitle: "",
		maxTitleLength: 25,
		maxLocationTitleLength: 25,
		wrapEvents: false, // wrap events to multiple lines breaking at maxTitleLength
		wrapLocationEvents: false,
		maxTitleLines: 3,
		maxEventTitleLines: 3,
		fetchInterval: 5 * 60 * 1000, // Update every 5 minutes.
		animationSpeed: 2000,
		fade: true,
		urgency: 7,
		timeFormat: "relative",
		dateFormat: "MMM Do",
		dateEndFormat: "LT",
		fullDayEventDateFormat: "MMM Do",
		showEnd: false,
		getRelative: 6,
		fadePoint: 0.25, // Start on 1/4th of the list.
		hidePrivate: false,
		hideOngoing: false,
		colored: false,
		coloredSymbolOnly: false,
		customEvents: [], // Array of {keyword: "", symbol: "", color: ""} where Keyword is a regexp and symbol/color are to be applied for matched
		tableClass: "small",
		calendars: [
			{
				symbol: "calendar",
				url: "https://www.calendarlabs.com/templates/ical/US-Holidays.ics"
			}
		],
		titleReplace: {
			"De verjaardag van ": "",
			"'s birthday": ""
		},
		locationTitleReplace: {
			"street ": ""
		},
		broadcastEvents: true,
		excludedEvents: [],
		sliceMultiDayEvents: false,
		broadcastPastEvents: false,
		nextDaysRelative: false
	},

	requiresVersion: "2.1.0",

	// Define required scripts.
	getStyles: function () {
		return ["calendar.css", "font-awesome.css"];
	},

	// Define required scripts.
	getScripts: function () {
		return ["moment.js"];
	},

	// Define required translations.
	getTranslations: function () {
		// The translations for the default modules are defined in the core translation files.
		// Therefor we can just return false. Otherwise we should have returned a dictionary.
		// If you're trying to build your own module including translations, check out the documentation.
		return false;
	},

	// Override start method.
	start: function () {
		Log.log("Starting module: " + this.name);

		// Set locale.
		moment.updateLocale(config.language, this.getLocaleSpecification(config.timeFormat));

		// clear data holder before start
		this.calendarData = {};

		// indicate no data available yet
		this.loaded = false;

		for (var c in this.config.calendars) {
			var calendar = this.config.calendars[c];
			calendar.url = calendar.url.replace("webcal://", "http://");

			var calendarConfig = {
				maximumEntries: calendar.maximumEntries,
				maximumNumberOfDays: calendar.maximumNumberOfDays,
				broadcastPastEvents: calendar.broadcastPastEvents
			};
			if (calendar.symbolClass === "undefined" || calendar.symbolClass === null) {
				calendarConfig.symbolClass = "";
			}
			if (calendar.titleClass === "undefined" || calendar.titleClass === null) {
				calendarConfig.titleClass = "";
			}
			if (calendar.timeClass === "undefined" || calendar.timeClass === null) {
				calendarConfig.timeClass = "";
			}

			// we check user and password here for backwards compatibility with old configs
			if (calendar.user && calendar.pass) {
				Log.warn("Deprecation warning: Please update your calendar authentication configuration.");
				Log.warn("https://github.com/MichMich/MagicMirror/tree/v2.1.2/modules/default/calendar#calendar-authentication-options");
				calendar.auth = {
					user: calendar.user,
					pass: calendar.pass
				};
			}

			// tell helper to start a fetcher for this calendar
			// fetcher till cycle
			this.addCalendar(calendar.url, calendar.auth, calendarConfig);
		}
	},

	// Override socket notification handler.
	socketNotificationReceived: function (notification, payload) {
		if (this.identifier !== payload.id) {
			return;
		}

		if (notification === "CALENDAR_EVENTS") {
			if (this.hasCalendarURL(payload.url)) {
				this.calendarData[payload.url] = payload.events;
				this.loaded = true;

				if (this.config.broadcastEvents) {
					this.broadcastEvents();
				}
			}
		} else if (notification === "FETCH_ERROR") {
			Log.error("Calendar Error. Could not fetch calendar: " + payload.url);
			this.loaded = true;
		} else if (notification === "INCORRECT_URL") {
			Log.error("Calendar Error. Incorrect url: " + payload.url);
		}

		this.updateDom(this.config.animationSpeed);
	},

	// Override dom generator.
	getDom: function () {
		// Define second, minute, hour, and day constants
		const oneSecond = 1000; // 1,000 milliseconds
		const oneMinute = oneSecond * 60;
		const oneHour = oneMinute * 60;
		const oneDay = oneHour * 24;

		var events = this.createEventList();
		var wrapper = document.createElement("table");
		wrapper.className = this.config.tableClass;

		if (events.length === 0) {
			wrapper.innerHTML = this.loaded ? this.translate("EMPTY") : this.translate("LOADING");
			wrapper.className = this.config.tableClass + " dimmed";
			return wrapper;
		}

		if (this.config.fade && this.config.fadePoint < 1) {
			if (this.config.fadePoint < 0) {
				this.config.fadePoint = 0;
			}
			var startFade = events.length * this.config.fadePoint;
			var fadeSteps = events.length - startFade;
		}

		var currentFadeStep = 0;
		var lastSeenDate = "";
		var ev;
		var needle;

		for (var e in events) {
			var event = events[e];
			var dateAsString = moment(event.startDate, "x").format(this.config.dateFormat);
			if (this.config.timeFormat === "dateheaders") {
				if (lastSeenDate !== dateAsString) {
					var dateRow = document.createElement("tr");
					dateRow.className = "normal";
					var dateCell = document.createElement("td");

					dateCell.colSpan = "3";
					dateCell.innerHTML = dateAsString;
					dateCell.style.paddingTop = "10px";
					dateRow.appendChild(dateCell);
					wrapper.appendChild(dateRow);

					if (e >= startFade) {
						//fading
						currentFadeStep = e - startFade;
						dateRow.style.opacity = 1 - (1 / fadeSteps) * currentFadeStep;
					}

					lastSeenDate = dateAsString;
				}
			}

			var eventWrapper = document.createElement("tr");

			if (this.config.colored && !this.config.coloredSymbolOnly) {
				eventWrapper.style.cssText = "color:" + this.colorForUrl(event.url);
			}

			eventWrapper.className = "normal event";

			if (this.config.displaySymbol) {
				var symbolWrapper = document.createElement("td");

				if (this.config.colored && this.config.coloredSymbolOnly) {
					symbolWrapper.style.cssText = "color:" + this.colorForUrl(event.url);
				}

				var symbolClass = this.symbolClassForUrl(event.url);
				symbolWrapper.className = "symbol align-right " + symbolClass;

				var symbols = this.symbolsForEvent(event);
				// If symbols are displayed and custom symbol is set, replace event symbol
				if (this.config.displaySymbol && this.config.customEvents.length > 0) {
					for (ev in this.config.customEvents) {
						if (typeof this.config.customEvents[ev].symbol !== "undefined" && this.config.customEvents[ev].symbol !== "") {
							needle = new RegExp(this.config.customEvents[ev].keyword, "gi");
							if (needle.test(event.title)) {
								symbols[0] = this.config.customEvents[ev].symbol;
								break;
							}
						}
					}
				}

				for (var i = 0; i < symbols.length; i++) {
					var symbol = document.createElement("span");
					symbol.className = "fa fa-fw fa-" + symbols[i];
					if (i > 0) {
						symbol.style.paddingLeft = "5px";
					}
					symbolWrapper.appendChild(symbol);
				}

				eventWrapper.appendChild(symbolWrapper);
			} else if (this.config.timeFormat === "dateheaders") {
				var blankCell = document.createElement("td");
				blankCell.innerHTML = "&nbsp;&nbsp;&nbsp;";
				eventWrapper.appendChild(blankCell);
			}

			var titleWrapper = document.createElement("td"),
				repeatingCountTitle = "";

			if (this.config.displayRepeatingCountTitle && event.firstYear !== undefined) {
				repeatingCountTitle = this.countTitleForUrl(event.url);

				if (repeatingCountTitle !== "") {
					var thisYear = new Date(parseInt(event.startDate)).getFullYear(),
						yearDiff = thisYear - event.firstYear;

					repeatingCountTitle = ", " + yearDiff + ". " + repeatingCountTitle;
				}
			}

			// Color events if custom color is specified
			if (this.config.customEvents.length > 0) {
				for (ev in this.config.customEvents) {
					if (typeof this.config.customEvents[ev].color !== "undefined" && this.config.customEvents[ev].color !== "") {
						needle = new RegExp(this.config.customEvents[ev].keyword, "gi");
						if (needle.test(event.title)) {
							eventWrapper.style.cssText = "color:" + this.config.customEvents[ev].color;
							titleWrapper.style.cssText = "color:" + this.config.customEvents[ev].color;
							if (this.config.displaySymbol) {
								symbolWrapper.style.cssText = "color:" + this.config.customEvents[ev].color;
							}
							break;
						}
					}
				}
			}

			titleWrapper.innerHTML = this.titleTransform(event.title, this.config.titleReplace, this.config.wrapEvents, this.config.maxTitleLength, this.config.maxTitleLines) + repeatingCountTitle;

			var titleClass = this.titleClassForUrl(event.url);

			if (!this.config.colored) {
				titleWrapper.className = "title bright " + titleClass;
			} else {
				titleWrapper.className = "title " + titleClass;
			}

			var timeWrapper;

			if (this.config.timeFormat === "dateheaders") {
				if (event.fullDayEvent) {
					titleWrapper.colSpan = "2";
					titleWrapper.align = "left";
				} else {
					timeWrapper = document.createElement("td");
					timeWrapper.className = "time light " + this.timeClassForUrl(event.url);
					timeWrapper.align = "left";
					timeWrapper.style.paddingLeft = "2px";
					timeWrapper.innerHTML = moment(event.startDate, "x").format("LT");
					eventWrapper.appendChild(timeWrapper);
					titleWrapper.align = "right";
				}

				eventWrapper.appendChild(titleWrapper);
			} else {
				timeWrapper = document.createElement("td");

				eventWrapper.appendChild(titleWrapper);
				var now = new Date();

				if (this.config.timeFormat === "absolute") {
					// Use dateFormat
					timeWrapper.innerHTML = this.capFirst(moment(event.startDate, "x").format(this.config.dateFormat));
					// Add end time if showEnd
					if (this.config.showEnd) {
						timeWrapper.innerHTML += "-";
						timeWrapper.innerHTML += this.capFirst(moment(event.endDate, "x").format(this.config.dateEndFormat));
					}
					// For full day events we use the fullDayEventDateFormat
					if (event.fullDayEvent) {
						//subtract one second so that fullDayEvents end at 23:59:59, and not at 0:00:00 one the next day
						event.endDate -= oneSecond;
						timeWrapper.innerHTML = this.capFirst(moment(event.startDate, "x").format(this.config.fullDayEventDateFormat));
					}
					if (this.config.getRelative > 0 && event.startDate < now) {
						// Ongoing and getRelative is set
						timeWrapper.innerHTML = this.capFirst(
							this.translate("RUNNING", {
								fallback: this.translate("RUNNING") + " {timeUntilEnd}",
								timeUntilEnd: moment(event.endDate, "x").fromNow(true)
							})
						);
					} else if (this.config.urgency > 0 && event.startDate - now < this.config.urgency * oneDay) {
						// Within urgency days
						timeWrapper.innerHTML = this.capFirst(moment(event.startDate, "x").fromNow());
					}
					if (event.fullDayEvent && this.config.nextDaysRelative) {
						// Full days events within the next two days
						if (event.today) {
							timeWrapper.innerHTML = this.capFirst(this.translate("TODAY"));
						} else if (event.startDate - now < oneDay && event.startDate - now > 0) {
							timeWrapper.innerHTML = this.capFirst(this.translate("TOMORROW"));
						} else if (event.startDate - now < 2 * oneDay && event.startDate - now > 0) {
							if (this.translate("DAYAFTERTOMORROW") !== "DAYAFTERTOMORROW") {
								timeWrapper.innerHTML = this.capFirst(this.translate("DAYAFTERTOMORROW"));
							}
						}
					}
				} else {
					// Show relative times
					if (event.startDate >= now) {
						// Use relative  time
						timeWrapper.innerHTML = this.capFirst(moment(event.startDate, "x").calendar());
						if (event.startDate - now < this.config.getRelative * oneHour) {
							// If event is within getRelative  hours, display 'in xxx' time format or moment.fromNow()
							timeWrapper.innerHTML = this.capFirst(moment(event.startDate, "x").fromNow());
						}
					} else {
						// Ongoing event
						timeWrapper.innerHTML = this.capFirst(
							this.translate("RUNNING", {
								fallback: this.translate("RUNNING") + " {timeUntilEnd}",
								timeUntilEnd: moment(event.endDate, "x").fromNow(true)
							})
						);
					}
				}
				timeWrapper.className = "time light " + this.timeClassForUrl(event.url);
				eventWrapper.appendChild(timeWrapper);
			}

			wrapper.appendChild(eventWrapper);

			// Create fade effect.
			if (e >= startFade) {
				currentFadeStep = e - startFade;
				eventWrapper.style.opacity = 1 - (1 / fadeSteps) * currentFadeStep;
			}

			if (this.config.showLocation) {
				if (event.location !== false) {
					var locationRow = document.createElement("tr");
					locationRow.className = "normal xsmall light";

					if (this.config.displaySymbol) {
						var symbolCell = document.createElement("td");
						locationRow.appendChild(symbolCell);
					}

					var descCell = document.createElement("td");
					descCell.className = "location";
					descCell.colSpan = "2";
					descCell.innerHTML = this.titleTransform(event.location, this.config.locationTitleReplace, this.config.wrapLocationEvents, this.config.maxLocationTitleLength, this.config.maxEventTitleLines);
					locationRow.appendChild(descCell);

					wrapper.appendChild(locationRow);

					if (e >= startFade) {
						currentFadeStep = e - startFade;
						locationRow.style.opacity = 1 - (1 / fadeSteps) * currentFadeStep;
					}
				}
			}
		}

		return wrapper;
	},

	/**
	 * This function accepts a number (either 12 or 24) and returns a moment.js LocaleSpecification with the
	 * corresponding timeformat to be used in the calendar display. If no number is given (or otherwise invalid input)
	 * it will a localeSpecification object with the system locale time format.
	 *
	 * @param {number} timeFormat Specifies either 12 or 24 hour time format
	 * @returns {moment.LocaleSpecification} formatted time
	 */
	getLocaleSpecification: function (timeFormat) {
		switch (timeFormat) {
			case 12: {
				return { longDateFormat: { LT: "h:mm A" } };
			}
			case 24: {
				return { longDateFormat: { LT: "HH:mm" } };
			}
			default: {
				return { longDateFormat: { LT: moment.localeData().longDateFormat("LT") } };
			}
		}
	},

	/**
	 * Checks if this config contains the calendar url.
	 *
	 * @param {string} url The calendar url
	 * @returns {boolean} True if the calendar config contains the url, False otherwise
	 */
	hasCalendarURL: function (url) {
		for (var c in this.config.calendars) {
			var calendar = this.config.calendars[c];
			if (calendar.url === url) {
				return true;
			}
		}

		return false;
	},

	/**
	 * Creates the sorted list of all events.
	 *
	 * @returns {object[]} Array with events.
	 */
	createEventList: function () {
		var events = [];
		var today = moment().startOf("day");
		var now = new Date();
		var future = moment().startOf("day").add(this.config.maximumNumberOfDays, "days").toDate();
		for (var c in this.calendarData) {
			var calendar = this.calendarData[c];
			for (var e in calendar) {
				var event = JSON.parse(JSON.stringify(calendar[e])); // clone object

				if (event.endDate < now) {
					continue;
				}
				if (this.config.hidePrivate) {
					if (event.class === "PRIVATE") {
						// do not add the current event, skip it
						continue;
					}
				}
				if (this.config.hideOngoing) {
					if (event.startDate < now) {
						continue;
					}
				}
				if (this.listContainsEvent(events, event)) {
					continue;
				}
				event.url = c;
				event.today = event.startDate >= today && event.startDate < today + 24 * 60 * 60 * 1000;

				/* if sliceMultiDayEvents is set to true, multiday events (events exceeding at least one midnight) are sliced into days,
				 * otherwise, esp. in dateheaders mode it is not clear how long these events are.
				 */
				var maxCount = Math.ceil((event.endDate - 1 - moment(event.startDate, "x").endOf("day").format("x")) / (1000 * 60 * 60 * 24)) + 1;
				if (this.config.sliceMultiDayEvents && maxCount > 1) {
					var splitEvents = [];
					var midnight = moment(event.startDate, "x").clone().startOf("day").add(1, "day").format("x");
					var count = 1;
					while (event.endDate > midnight) {
						var thisEvent = JSON.parse(JSON.stringify(event)); // clone object
						thisEvent.today = thisEvent.startDate >= today && thisEvent.startDate < today + 24 * 60 * 60 * 1000;
						thisEvent.endDate = midnight;
						thisEvent.title += " (" + count + "/" + maxCount + ")";
						splitEvents.push(thisEvent);

						event.startDate = midnight;
						count += 1;
						midnight = moment(midnight, "x").add(1, "day").format("x"); // next day
					}
					// Last day
					event.title += " (" + count + "/" + maxCount + ")";
					splitEvents.push(event);

					for (event of splitEvents) {
						if (event.endDate > now && event.endDate <= future) {
							events.push(event);
						}
					}
				} else {
					events.push(event);
				}
			}
		}

		events.sort(function (a, b) {
			return a.startDate - b.startDate;
		});

		// Limit the number of days displayed
		// If limitDays is set > 0, limit display to that number of days
		if (this.config.limitDays > 0) {
			var newEvents = [];
			var lastDate = today.clone().subtract(1, "days").format("YYYYMMDD");
			var days = 0;
			var eventDate;
			for (var ev of events) {
				eventDate = moment(ev.startDate, "x").format("YYYYMMDD");
				// if date of event is later than lastdate
				// check if we already are showing max unique days
				if (eventDate > lastDate) {
					// if the only entry in the first day is a full day event that day is not counted as unique
					if (newEvents.length === 1 && days === 1 && newEvents[0].fullDayEvent) {
						days--;
					}
					days++;
					if (days > this.config.limitDays) {
						continue;
					} else {
						lastDate = eventDate;
					}
				}
				newEvents.push(ev);
			}
			events = newEvents;
		}

		return events.slice(0, this.config.maximumEntries);
	},

	listContainsEvent: function (eventList, event) {
		for (var evt of eventList) {
			if (evt.title === event.title && parseInt(evt.startDate) === parseInt(event.startDate)) {
				return true;
			}
		}
		return false;
	},

	/**
	 * Requests node helper to add calendar url.
	 *
	 * @param {string} url The calendar url to add
	 * @param {object} auth The authentication method and credentials
	 * @param {object} calendarConfig The config of the specific calendar
	 */
	addCalendar: function (url, auth, calendarConfig) {
		var self = this;

		this.sendSocketNotification("ADD_CALENDAR", {
			id: this.identifier,
			url: url,
			excludedEvents: calendarConfig.excludedEvents || this.config.excludedEvents,
			maximumEntries: calendarConfig.maximumEntries || this.config.maximumEntries,
			maximumNumberOfDays: calendarConfig.maximumNumberOfDays || this.config.maximumNumberOfDays,
			fetchInterval: this.config.fetchInterval,
			symbolClass: calendarConfig.symbolClass,
			titleClass: calendarConfig.titleClass,
			timeClass: calendarConfig.timeClass,
			auth: auth,
			broadcastPastEvents: calendarConfig.broadcastPastEvents || this.config.broadcastPastEvents
		});
	},

	/**
	 * Retrieves the symbols for a specific event.
	 *
	 * @param {object} event Event to look for.
	 * @returns {string[]} The symbols
	 */
	symbolsForEvent: function (event) {
		let symbols = this.getCalendarPropertyAsArray(event.url, "symbol", this.config.defaultSymbol);

		if (event.recurringEvent === true && this.hasCalendarProperty(event.url, "recurringSymbol")) {
			symbols = this.mergeUnique(this.getCalendarPropertyAsArray(event.url, "recurringSymbol", this.config.defaultSymbol), symbols);
		}

		if (event.fullDayEvent === true && this.hasCalendarProperty(event.url, "fullDaySymbol")) {
			symbols = this.mergeUnique(this.getCalendarPropertyAsArray(event.url, "fullDaySymbol", this.config.defaultSymbol), symbols);
		}

		return symbols;
	},

	mergeUnique: function (arr1, arr2) {
		return arr1.concat(
			arr2.filter(function (item) {
				return arr1.indexOf(item) === -1;
			})
		);
	},

	/**
	 * Retrieves the symbolClass for a specific calendar url.
	 *
	 * @param {string} url The calendar url
	 * @returns {string} The class to be used for the symbols of the calendar
	 */
	symbolClassForUrl: function (url) {
		return this.getCalendarProperty(url, "symbolClass", "");
	},

	/**
	 * Retrieves the titleClass for a specific calendar url.
	 *
	 * @param {string} url The calendar url
	 * @returns {string} The class to be used for the title of the calendar
	 */
	titleClassForUrl: function (url) {
		return this.getCalendarProperty(url, "titleClass", "");
	},

	/**
	 * Retrieves the timeClass for a specific calendar url.
	 *
	 * @param {string} url The calendar url
	 * @returns {string} The class to be used for the time of the calendar
	 */
	timeClassForUrl: function (url) {
		return this.getCalendarProperty(url, "timeClass", "");
	},

	/**
	 * Retrieves the calendar name for a specific calendar url.
	 *
	 * @param {string} url The calendar url
	 * @returns {string} The name of the calendar
	 */
	calendarNameForUrl: function (url) {
		return this.getCalendarProperty(url, "name", "");
	},

	/**
	 * Retrieves the color for a specific calendar url.
	 *
	 * @param {string} url The calendar url
	 * @returns {string} The color
	 */
	colorForUrl: function (url) {
		return this.getCalendarProperty(url, "color", "#fff");
	},

	/**
	 * Retrieves the count title for a specific calendar url.
	 *
	 * @param {string} url The calendar url
	 * @returns {string} The title
	 */
	countTitleForUrl: function (url) {
		return this.getCalendarProperty(url, "repeatingCountTitle", this.config.defaultRepeatingCountTitle);
	},

	/**
	 * Helper method to retrieve the property for a specific calendar url.
	 *
	 * @param {string} url The calendar url
	 * @param {string} property The property to look for
	 * @param {string} defaultValue The value if the property is not found
	 * @returns {*} The property
	 */
	getCalendarProperty: function (url, property, defaultValue) {
		for (var c in this.config.calendars) {
			var calendar = this.config.calendars[c];
			if (calendar.url === url && calendar.hasOwnProperty(property)) {
				return calendar[property];
			}
		}

		return defaultValue;
	},

	getCalendarPropertyAsArray: function (url, property, defaultValue) {
		let p = this.getCalendarProperty(url, property, defaultValue);
		if (!(p instanceof Array)) p = [p];
		return p;
	},

	hasCalendarProperty: function (url, property) {
		return !!this.getCalendarProperty(url, property, undefined);
	},

	/**
	 * Shortens a string if it's longer than maxLength and add a ellipsis to the end
	 *
	 * @param {string} string Text string to shorten
	 * @param {number} maxLength The max length of the string
	 * @param {boolean} wrapEvents Wrap the text after the line has reached maxLength
	 * @param {number} maxTitleLines The max number of vertical lines before cutting event title
	 * @returns {string} The shortened string
	 */
	shorten: function (string, maxLength, wrapEvents, maxTitleLines) {
		if (typeof string !== "string") {
			return "";
		}

		if (wrapEvents === true) {
			var temp = "";
			var currentLine = "";
			var words = string.split(" ");
			var line = 0;

			for (var i = 0; i < words.length; i++) {
				var word = words[i];
				if (currentLine.length + word.length < (typeof maxLength === "number" ? maxLength : 25) - 1) {
					// max - 1 to account for a space
					currentLine += word + " ";
				} else {
					line++;
					if (line > maxTitleLines - 1) {
						if (i < words.length) {
							currentLine += "&hellip;";
						}
						break;
					}

					if (currentLine.length > 0) {
						temp += currentLine + "<br>" + word + " ";
					} else {
						temp += word + "<br>";
					}
					currentLine = "";
				}
			}

			return (temp + currentLine).trim();
		} else {
			if (maxLength && typeof maxLength === "number" && string.length > maxLength) {
				return string.trim().slice(0, maxLength) + "&hellip;";
			} else {
				return string.trim();
			}
		}
	},

	/**
	 * Capitalize the first letter of a string
	 *
	 * @param {string} string The string to capitalize
	 * @returns {string} The capitalized string
	 */
	capFirst: function (string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	},

	/**
	 * Transforms the title of an event for usage.
	 * Replaces parts of the text as defined in config.titleReplace.
	 * Shortens title based on config.maxTitleLength and config.wrapEvents
	 *
	 * @param {string} title The title to transform.
	 * @param {object} titleReplace Pairs of strings to be replaced in the title
	 * @param {boolean} wrapEvents Wrap the text after the line has reached maxLength
	 * @param {number} maxTitleLength The max length of the string
	 * @param {number} maxTitleLines The max number of vertical lines before cutting event title
	 * @returns {string} The transformed title.
	 */
	titleTransform: function (title, titleReplace, wrapEvents, maxTitleLength, maxTitleLines) {
		for (var needle in titleReplace) {
			var replacement = titleReplace[needle];

			var regParts = needle.match(/^\/(.+)\/([gim]*)$/);
			if (regParts) {
				// the parsed pattern is a regexp.
				needle = new RegExp(regParts[1], regParts[2]);
			}

			title = title.replace(needle, replacement);
		}

		title = this.shorten(title, maxTitleLength, wrapEvents, maxTitleLines);
		return title;
	},

	/**
	 * Broadcasts the events to all other modules for reuse.
	 * The all events available in one array, sorted on startdate.
	 */
	broadcastEvents: function () {
		var eventList = [];
		for (var url in this.calendarData) {
			var calendar = this.calendarData[url];
			for (var e in calendar) {
				var event = cloneObject(calendar[e]);
				event.symbol = this.symbolsForEvent(event);
				event.calendarName = this.calendarNameForUrl(url);
				event.color = this.colorForUrl(url);
				delete event.url;
				eventList.push(event);
			}
		}

		eventList.sort(function (a, b) {
			return a.startDate - b.startDate;
		});

		this.sendNotification("CALENDAR_EVENTS", eventList);
	}
});
