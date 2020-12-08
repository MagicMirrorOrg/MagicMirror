/* Magic Mirror
 * Node Helper: Calendar - CalendarFetcher
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
const Log = require("../../../js/logger.js");
const ical = require("node-ical");
const request = require("request");

/**
 * Moment date
 *
 * @external Moment
 * @see {@link http://momentjs.com}
 */
const moment = require("moment");

/**
 *
 * @param {string} url The url of the calendar to fetch
 * @param {number} reloadInterval Time in ms the calendar is fetched again
 * @param {string[]} excludedEvents An array of words / phrases from event titles that will be excluded from being shown.
 * @param {number} maximumEntries The maximum number of events fetched.
 * @param {number} maximumNumberOfDays The maximum number of days an event should be in the future.
 * @param {object} auth The object containing options for authentication against the calendar.
 * @param {boolean} includePastEvents If true events from the past maximumNumberOfDays will be fetched too
 * @class
 */
const CalendarFetcher = function (url, reloadInterval, excludedEvents, maximumEntries, maximumNumberOfDays, auth, includePastEvents) {
	const self = this;

	let reloadTimer = null;
	let events = [];

	let fetchFailedCallback = function () {};
	let eventsReceivedCallback = function () {};

	/**
	 * Initiates calendar fetch.
	 */
	const fetchCalendar = function () {
		clearTimeout(reloadTimer);
		reloadTimer = null;

		const nodeVersion = Number(process.version.match(/^v(\d+\.\d+)/)[1]);
		const opts = {
			headers: {
				"User-Agent": "Mozilla/5.0 (Node.js " + nodeVersion + ") MagicMirror/" + global.version + " (https://github.com/MichMich/MagicMirror/)"
			},
			gzip: true
		};

		if (auth) {
			if (auth.method === "bearer") {
				opts.auth = {
					bearer: auth.pass
				};
			} else {
				opts.auth = {
					user: auth.user,
					pass: auth.pass,
					sendImmediately: auth.method !== "digest"
				};
			}
		}

		request(url, opts, function (err, r, requestData) {
			if (err) {
				fetchFailedCallback(self, err);
				scheduleTimer();
				return;
			} else if (r.statusCode !== 200) {
				fetchFailedCallback(self, r.statusCode + ": " + r.statusMessage);
				scheduleTimer();
				return;
			}

			let data = [];

			try {
				data = ical.parseICS(requestData);
			} catch (error) {
				fetchFailedCallback(self, error.message);
				scheduleTimer();
				return;
			}

			Log.debug(" parsed data=" + JSON.stringify(data));

			const newEvents = [];

			// limitFunction doesn't do much limiting, see comment re: the dates array in rrule section below as to why we need to do the filtering ourselves
			const limitFunction = function (date, i) {
				return true;
			};

			const eventDate = function (event, time) {
				return isFullDayEvent(event) ? moment(event[time], "YYYYMMDD") : moment(new Date(event[time]));
			};
			Log.debug("there are " + Object.entries(data).length + " calendar entries");
			Object.entries(data).forEach(([key, event]) => {
				const now = new Date();
				const today = moment().startOf("day").toDate();
				const future = moment().startOf("day").add(maximumNumberOfDays, "days").subtract(1, "seconds").toDate(); // Subtract 1 second so that events that start on the middle of the night will not repeat.
				let past = today;
				Log.debug("have entries ");
				if (includePastEvents) {
					past = moment().startOf("day").subtract(maximumNumberOfDays, "days").toDate();
				}

				// FIXME: Ugly fix to solve the facebook birthday issue.
				// Otherwise, the recurring events only show the birthday for next year.
				let isFacebookBirthday = false;
				if (typeof event.uid !== "undefined") {
					if (event.uid.indexOf("@facebook.com") !== -1) {
						isFacebookBirthday = true;
					}
				}

				if (event.type === "VEVENT") {
					let startDate = eventDate(event, "start");
					let endDate;

					Log.debug("\nevent=" + JSON.stringify(event));
					if (typeof event.end !== "undefined") {
						endDate = eventDate(event, "end");
					} else if (typeof event.duration !== "undefined") {
						endDate = startDate.clone().add(moment.duration(event.duration));
					} else {
						if (!isFacebookBirthday) {
							// make copy of start date, separate storage area
							endDate = moment(startDate.format("x"), "x");
						} else {
							endDate = moment(startDate).add(1, "days");
						}
					}

					Log.debug(" start=" + startDate.toDate() + " end=" + endDate.toDate());

					// calculate the duration of the event for use with recurring events.
					let duration = parseInt(endDate.format("x")) - parseInt(startDate.format("x"));

					if (event.start.length === 8) {
						startDate = startDate.startOf("day");
					}

					const title = getTitleFromEvent(event);

					let excluded = false,
						dateFilter = null;

					for (let f in excludedEvents) {
						let filter = excludedEvents[f],
							testTitle = title.toLowerCase(),
							until = null,
							useRegex = false,
							regexFlags = "g";

						if (filter instanceof Object) {
							if (typeof filter.until !== "undefined") {
								until = filter.until;
							}

							if (typeof filter.regex !== "undefined") {
								useRegex = filter.regex;
							}

							// If additional advanced filtering is added in, this section
							// must remain last as we overwrite the filter object with the
							// filterBy string
							if (filter.caseSensitive) {
								filter = filter.filterBy;
								testTitle = title;
							} else if (useRegex) {
								filter = filter.filterBy;
								testTitle = title;
								regexFlags += "i";
							} else {
								filter = filter.filterBy.toLowerCase();
							}
						} else {
							filter = filter.toLowerCase();
						}

						if (testTitleByFilter(testTitle, filter, useRegex, regexFlags)) {
							if (until) {
								dateFilter = until;
							} else {
								excluded = true;
							}
							break;
						}
					}

					if (excluded) {
						return;
					}

					const location = event.location || false;
					const geo = event.geo || false;
					const description = event.description || false;

					if (typeof event.rrule !== "undefined" && event.rrule !== null && !isFacebookBirthday) {
						const rule = event.rrule;
						let addedEvents = 0;

						const pastMoment = moment(past);
						const futureMoment = moment(future);

						// can cause problems with e.g. birthdays before 1900
						if ((rule.options && rule.origOptions && rule.origOptions.dtstart && rule.origOptions.dtstart.getFullYear() < 1900) || (rule.options && rule.options.dtstart && rule.options.dtstart.getFullYear() < 1900)) {
							rule.origOptions.dtstart.setYear(1900);
							rule.options.dtstart.setYear(1900);
						}

						// For recurring events, get the set of start dates that fall within the range
						// of dates we're looking for.
						// kblankenship1989 - to fix issue #1798, converting all dates to locale time first, then converting back to UTC time
						let pastLocal = 0;
						let futureLocal = 0;
						if (isFullDayEvent(event)) {
							// if full day event, only use the date part of the ranges
							pastLocal = pastMoment.toDate();
							futureLocal = futureMoment.toDate();
						} else {
							// if we want past events
							if (includePastEvents) {
								// use the calculated past time for the between from
								pastLocal = pastMoment.toDate();
							} else {
								// otherwise use NOW.. cause we shouldnt use any before now
								pastLocal = moment().toDate(); //now
							}
							futureLocal = futureMoment.toDate(); // future
						}
						Log.debug(" between=" + pastLocal + " to " + futureLocal);
						const dates = rule.between(pastLocal, futureLocal, true, limitFunction);
						Log.debug("title=" + event.summary + " dates=" + JSON.stringify(dates));
						// The "dates" array contains the set of dates within our desired date range range that are valid
						// for the recurrence rule. *However*, it's possible for us to have a specific recurrence that
						// had its date changed from outside the range to inside the range.  For the time being,
						// we'll handle this by adding *all* recurrence entries into the set of dates that we check,
						// because the logic below will filter out any recurrences that don't actually belong within
						// our display range.
						// Would be great if there was a better way to handle this.
						if (event.recurrences !== undefined) {
							for (let r in event.recurrences) {
								// Only add dates that weren't already in the range we added from the rrule so that
								// we don"t double-add those events.
								if (moment(new Date(r)).isBetween(pastMoment, futureMoment) !== true) {
									dates.push(new Date(r));
								}
							}
						}
						// Loop through the set of date entries to see which recurrences should be added to our event list.
						for (let d in dates) {
							let date = dates[d];
							// ical.js started returning recurrences and exdates as ISOStrings without time information.
							// .toISOString().substring(0,10) is the method they use to calculate keys, so we'll do the same
							// (see https://github.com/peterbraden/ical.js/pull/84 )
							const dateKey = date.toISOString().substring(0, 10);
							let curEvent = event;
							let showRecurrence = true;

							// for full day events, the time might be off from RRULE/Luxon problem
							if (isFullDayEvent(event)) {
								Log.debug("fullday");
								// if the offset is  negative, east of GMT where the problem is
								if (date.getTimezoneOffset() < 0) {
									// get the offset of today where we are processing
									// this will be the correction we need to apply
									let nowOffset = new Date().getTimezoneOffset();
									Log.debug("now offset is " + nowOffset);
									// reduce the time by the offset
									Log.debug(" recurring date is " + date + " offset is " + date.getTimezoneOffset());
									// apply the correction to the date/time to get it UTC relative
									date = new Date(date.getTime() - Math.abs(nowOffset) * 60000);
									// the duration was calculated way back at the top before we could correct the start time..
									// fix it for this event entry
									duration = 24 * 60 * 60 * 1000;
									Log.debug("new recurring date is " + date);
								}
							}
							startDate = moment(date);

							let adjustDays = getCorrection(event, date);

							// For each date that we're checking, it's possible that there is a recurrence override for that one day.
							if (curEvent.recurrences !== undefined && curEvent.recurrences[dateKey] !== undefined) {
								// We found an override, so for this recurrence, use a potentially different title, start date, and duration.
								curEvent = curEvent.recurrences[dateKey];
								startDate = moment(curEvent.start);
								duration = parseInt(moment(curEvent.end).format("x")) - parseInt(startDate.format("x"));
							}
							// If there's no recurrence override, check for an exception date.  Exception dates represent exceptions to the rule.
							else if (curEvent.exdate !== undefined && curEvent.exdate[dateKey] !== undefined) {
								// This date is an exception date, which means we should skip it in the recurrence pattern.
								showRecurrence = false;
							}
							Log.debug("duration=" + duration);

							endDate = moment(parseInt(startDate.format("x")) + duration, "x");
							if (startDate.format("x") === endDate.format("x")) {
								endDate = endDate.endOf("day");
							}

							const recurrenceTitle = getTitleFromEvent(curEvent);

							// If this recurrence ends before the start of the date range, or starts after the end of the date range, don"t add
							// it to the event list.
							if (endDate.isBefore(past) || startDate.isAfter(future)) {
								showRecurrence = false;
							}

							if (timeFilterApplies(now, endDate, dateFilter)) {
								showRecurrence = false;
							}

							if (showRecurrence === true) {
								Log.debug("saving event =" + description);
								addedEvents++;
								newEvents.push({
									title: recurrenceTitle,
									startDate: (adjustDays ? (adjustDays > 0 ? startDate.add(adjustDays, "hours") : startDate.subtract(Math.abs(adjustDays), "hours")) : startDate).format("x"),
									endDate: (adjustDays ? (adjustDays > 0 ? endDate.add(adjustDays, "hours") : endDate.subtract(Math.abs(adjustDays), "hours")) : endDate).format("x"),
									fullDayEvent: isFullDayEvent(event),
									recurringEvent: true,
									class: event.class,
									firstYear: event.start.getFullYear(),
									location: location,
									geo: geo,
									description: description
								});
							}
						}
						// end recurring event parsing
					} else {
						// Single event.
						const fullDayEvent = isFacebookBirthday ? true : isFullDayEvent(event);
						// Log.debug("full day event")

						if (includePastEvents) {
							// Past event is too far in the past, so skip.
							if (endDate < past) {
								return;
							}
						} else {
							// It's not a fullday event, and it is in the past, so skip.
							if (!fullDayEvent && endDate < new Date()) {
								return;
							}

							// It's a fullday event, and it is before today, So skip.
							if (fullDayEvent && endDate <= today) {
								return;
							}
						}

						// It exceeds the maximumNumberOfDays limit, so skip.
						if (startDate > future) {
							return;
						}

						if (timeFilterApplies(now, endDate, dateFilter)) {
							return;
						}

						// Adjust start date so multiple day events will be displayed as happening today even though they started some days ago already
						if (fullDayEvent && startDate <= today) {
							startDate = moment(today);
						}
						// if the start and end are the same, then make end the 'end of day' value (start is at 00:00:00)
						if (fullDayEvent && startDate.format("x") === endDate.format("x")) {
							endDate = endDate.endOf("day");
						}
						// get correction for date saving and dst change between now and then
						let adjustDays = getCorrection(event, startDate.toDate());
						// Every thing is good. Add it to the list.
						newEvents.push({
							title: title,
							startDate: (adjustDays ? (adjustDays > 0 ? startDate.add(adjustDays, "hours") : startDate.subtract(Math.abs(adjustDays), "hours")) : startDate).format("x"),
							endDate: (adjustDays ? (adjustDays > 0 ? endDate.add(adjustDays, "hours") : endDate.subtract(Math.abs(adjustDays), "hours")) : endDate).format("x"),
							fullDayEvent: fullDayEvent,
							class: event.class,
							location: location,
							geo: geo,
							description: description
						});
					}
				}
			});

			newEvents.sort(function (a, b) {
				return a.startDate - b.startDate;
			});

			// include up to maximumEntries current or upcoming events
			// If past events should be included, include all past events
			const now = moment();
			var entries = 0;
			events = [];
			for (let ne of newEvents) {
				if (moment(ne.endDate, "x").isBefore(now)) {
					if (includePastEvents) events.push(ne);
					continue;
				}
				entries++;
				// If max events has been saved, skip the rest
				if (entries > maximumEntries) break;
				events.push(ne);
			}

			self.broadcastEvents();
			scheduleTimer();
		});
	};

	/*
	 *
	 *	get the time correction, either dst/std or full day in cases where utc time is day before plus offset
	 *
	 */
	const getCorrection = function (event, date) {
		let adjustHours = 0;
		// if a timezone was specified
		if (!event.start.tz) {
			Log.debug(" if no tz, guess based on now");
			event.start.tz = moment.tz.guess();
		}
		Log.debug("initial tz=" + event.start.tz);

		// if there is a start date specified
		if (event.start.tz) {
			// if this is a windows timezone
			if (event.start.tz.includes(" ")) {
				// use the lookup table to get theIANA name as moment and date don't know MS timezones
				let tz = getIanaTZFromMS(event.start.tz);
				Log.debug("corrected TZ=" + tz);
				// watch out for unregistered windows timezone names
				// if we had a successfule lookup
				if (tz) {
					// change the timezone to the IANA name
					event.start.tz = tz;
					// Log.debug("corrected timezone="+event.start.tz)
				}
			}
			Log.debug("corrected tz=" + event.start.tz);
			let current_offset = 0; // offset  from TZ string or calculated
			let mm = 0; // date with tz or offset
			let start_offset = 0; // utc offset of created with tz
			// if there is still an offset, lookup failed, use it
			if (event.start.tz.startsWith("(")) {
				const regex = /[+|-]\d*:\d*/;
				const start_offsetString = event.start.tz.match(regex).toString().split(":");
				let start_offset = parseInt(start_offsetString[0]);
				start_offset *= event.start.tz[1] === "-" ? -1 : 1;
				adjustHours = start_offset;
				Log.debug("defined offset=" + start_offset + " hours");
				current_offset = start_offset;
				event.start.tz = "";
				Log.debug("ical offset=" + current_offset + " date=" + date);
				mm = moment(date);
				let x = parseInt(moment(new Date()).utcOffset());
				Log.debug("net mins=" + (current_offset * 60 - x));

				mm = mm.add(x - current_offset * 60, "minutes");
				adjustHours = (current_offset * 60 - x) / 60;
				event.start = mm.toDate();
				Log.debug("adjusted date=" + event.start);
			} else {
				// get the start time in that timezone
				Log.debug("start date/time=" + moment(event.start).toDate());
				start_offset = moment.tz(moment(event.start), event.start.tz).utcOffset();
				Log.debug("start offset=" + start_offset);

				Log.debug("start date/time w tz =" + moment.tz(moment(event.start), event.start.tz).toDate());

				// get the specified date in that timezone
				mm = moment.tz(moment(date), event.start.tz);
				Log.debug("event date=" + mm.toDate());
				current_offset = mm.utcOffset();
			}
			Log.debug("event offset=" + current_offset + " hour=" + mm.format("H") + " event date=" + mm.toDate());

			// if the offset is greater than 0, east of london
			if (current_offset !== start_offset) {
				// big offset
				Log.debug("offset");
				let h = parseInt(mm.format("H"));
				// check if the event time is less than the offset
				if (h > 0 && h < Math.abs(current_offset) / 60) {
					// if so, rrule created a wrong date (utc day, oops, with utc yesterday adjusted time)
					// we need to fix that
					adjustHours = 24;
					// Log.debug("adjusting date")
				}
				//-300 > -240
				//if (Math.abs(current_offset) > Math.abs(start_offset)){
				if (current_offset > start_offset) {
					adjustHours -= 1;
					Log.debug("adjust down 1 hour dst change");
					//} else if (Math.abs(current_offset) < Math.abs(start_offset)) {
				} else if (current_offset < start_offset) {
					adjustHours += 1;
					Log.debug("adjust up 1 hour dst change");
				}
			}
		}
		Log.debug("adjustHours=" + adjustHours);
		return adjustHours;
	};

	/**
	 *
	 *  lookup iana tz from windows
	 */
	let zoneTable = null;
	const getIanaTZFromMS = function (msTZName) {
		if (!zoneTable) {
			const p = require("path");
			zoneTable = require(p.join(__dirname, "windowsZones.json"));
		}
		// Get hash entry
		const he = zoneTable[msTZName];
		// If found return iana name, else null
		return he ? he.iana[0] : null;
	};

	/**
	 * Schedule the timer for the next update.
	 */
	const scheduleTimer = function () {
		clearTimeout(reloadTimer);
		reloadTimer = setTimeout(function () {
			fetchCalendar();
		}, reloadInterval);
	};

	/**
	 * Checks if an event is a fullday event.
	 *
	 * @param {object} event The event object to check.
	 * @returns {boolean} True if the event is a fullday event, false otherwise
	 */
	const isFullDayEvent = function (event) {
		if (event.start.length === 8 || event.start.dateOnly || event.datetype === "date") {
			return true;
		}

		const start = event.start || 0;
		const startDate = new Date(start);
		const end = event.end || 0;
		if ((end - start) % (24 * 60 * 60 * 1000) === 0 && startDate.getHours() === 0 && startDate.getMinutes() === 0) {
			// Is 24 hours, and starts on the middle of the night.
			return true;
		}

		return false;
	};

	/**
	 * Determines if the user defined time filter should apply
	 *
	 * @param {Date} now Date object using previously created object for consistency
	 * @param {Moment} endDate Moment object representing the event end date
	 * @param {string} filter The time to subtract from the end date to determine if an event should be shown
	 * @returns {boolean} True if the event should be filtered out, false otherwise
	 */
	const timeFilterApplies = function (now, endDate, filter) {
		if (filter) {
			const until = filter.split(" "),
				value = parseInt(until[0]),
				increment = until[1].slice(-1) === "s" ? until[1] : until[1] + "s", // Massage the data for moment js
				filterUntil = moment(endDate.format()).subtract(value, increment);

			return now < filterUntil.format("x");
		}

		return false;
	};

	/**
	 * Gets the title from the event.
	 *
	 * @param {object} event The event object to check.
	 * @returns {string} The title of the event, or "Event" if no title is found.
	 */
	const getTitleFromEvent = function (event) {
		let title = "Event";
		if (event.summary) {
			title = typeof event.summary.val !== "undefined" ? event.summary.val : event.summary;
		} else if (event.description) {
			title = event.description;
		}

		return title;
	};

	const testTitleByFilter = function (title, filter, useRegex, regexFlags) {
		if (useRegex) {
			// Assume if leading slash, there is also trailing slash
			if (filter[0] === "/") {
				// Strip leading and trailing slashes
				filter = filter.substr(1).slice(0, -1);
			}

			filter = new RegExp(filter, regexFlags);

			return filter.test(title);
		} else {
			return title.includes(filter);
		}
	};

	/* public methods */

	/**
	 * Initiate fetchCalendar();
	 */
	this.startFetch = function () {
		fetchCalendar();
	};

	/**
	 * Broadcast the existing events.
	 */
	this.broadcastEvents = function () {
		Log.info("Calendar-Fetcher: Broadcasting " + events.length + " events.");
		eventsReceivedCallback(self);
	};

	/**
	 * Sets the on success callback
	 *
	 * @param {Function} callback The on success callback.
	 */
	this.onReceive = function (callback) {
		eventsReceivedCallback = callback;
	};

	/**
	 * Sets the on error callback
	 *
	 * @param {Function} callback The on error callback.
	 */
	this.onError = function (callback) {
		fetchFailedCallback = callback;
	};

	/**
	 * Returns the url of this fetcher.
	 *
	 * @returns {string} The url of this fetcher.
	 */
	this.url = function () {
		return url;
	};

	/**
	 * Returns current available events for this fetcher.
	 *
	 * @returns {object[]} The current available events for this fetcher.
	 */
	this.events = function () {
		return events;
	};
};

module.exports = CalendarFetcher;
