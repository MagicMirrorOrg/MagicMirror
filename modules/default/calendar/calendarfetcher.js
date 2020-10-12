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

			const data = ical.parseICS(requestData);
			const newEvents = [];

			// limitFunction doesn't do much limiting, see comment re: the dates array in rrule section below as to why we need to do the filtering ourselves
			const limitFunction = function (date, i) {
				return true;
			};

			const eventDate = function (event, time) {
				return event[time].length === 8 ? moment(event[time], "YYYYMMDD") : moment(new Date(event[time]));
			};

			Object.entries(data).forEach(([key, event]) => {
				const now = new Date();
				const today = moment().startOf("day").toDate();
				const future = moment().startOf("day").add(maximumNumberOfDays, "days").subtract(1, "seconds").toDate(); // Subtract 1 second so that events that start on the middle of the night will not repeat.
				let past = today;

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
					// console.log("\nevent="+JSON.stringify(event))
					if (typeof event.end !== "undefined") {
						endDate = eventDate(event, "end");
					} else if (typeof event.duration !== "undefined") {
						endDate = startDate.clone().add(moment.duration(event.duration));
					} else {
						if (!isFacebookBirthday) {
							endDate = startDate;
						} else {
							endDate = moment(startDate).add(1, "days");
						}
					}

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
							pastLocal = pastMoment.subtract(past.getTimezoneOffset(), "minutes").toDate();
							futureLocal = futureMoment.subtract(future.getTimezoneOffset(), "minutes").toDate();
						}

						const dates = rule.between(pastLocal, futureLocal, true, limitFunction);
						// console.log("title="+event.summary.val+" dates="+JSON.stringify(dates))
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
							const date = dates[d];
							// ical.js started returning recurrences and exdates as ISOStrings without time information.
							// .toISOString().substring(0,10) is the method they use to calculate keys, so we'll do the same
							// (see https://github.com/peterbraden/ical.js/pull/84 )
							const dateKey = date.toISOString().substring(0, 10);
							let curEvent = event;
							let showRecurrence = true;

							startDate = moment(date);
							// console.log("now timezone="+ moment.tz.guess());
							// whether we need to adjust for RRULE returning the wrong date, with the right time (forward of URC timezones)
							let adjustDays = 0;
							// if a timezone was specified
							if (!event.start.tz) {
								event.start.tz = moment.tz.guess();
							}
							// console.log("tz="+event.start.tz)
							if (event.start.tz) {
								// if this is a windows timezone
								if (event.start.tz.indexOf(" ") > 0) {
									// use the lookup table to get theIANA name as moment and date don't know MS timezones
									let tz = getIanaTZFromMS(event.start.tz);
									// watch out for unregistered windows timezone names
									// if we had a successfule lookup
									if (tz) {
										// change the timezone to the IANA name
										event.start.tz = getIanaTZFromMS(event.start.tz);
										// console.log("corrected timezone="+event.start.tz)
									}
								}
								// get the start time in that timezone
								let mms = moment.tz(moment(event.start), event.start.tz).utcOffset();
								// console.log("ms offset="+mms)
								// get the specified date in that timezone
								let mm = moment.tz(moment(date), event.start.tz);
								let mmo = mm.utcOffset();
								// console.log("mm ofset="+ mmo+" hour="+mm.format("H")+" event date="+mm.toDate())
								// if the offset is greater than 0, east of london
								if (mmo > 0) {
									let h = parseInt(mm.format("H"));
									// check if the event time is less than the offset
									if (h > 0 && h < mmo / 60) {
										// if so, rrule created a wrong date (utc day, oops, with utc yesterday adjusted time)
										// we need to fix that
										adjustDays = 24;
										// console.log("adjusting date")
									}
									if (mmo > mms) {
										adjustDays += 1;
										// console.log("adjust up 1 hour dst change")
									} else if (mmo < mms) {
										adjustDays -= 1;
										//console.log("adjust down 1 hour dst change")
									}
								}
							}

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

							//console.log("duration="+duration)

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
								addedEvents++;
								newEvents.push({
									title: recurrenceTitle,
									startDate: (adjustDays ? startDate.subtract(adjustDays, "hours") : startDate).format("x"),
									endDate: (adjustDays ? endDate.subtract(adjustDays, "hours") : endDate).format("x"),
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
						// console.log("full day event")
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
							//console.log("end same as start")
							endDate = endDate.endOf("day");
						}

						// Every thing is good. Add it to the list.
						newEvents.push({
							title: title,
							startDate: startDate.format("x"),
							endDate: endDate.format("x"),
							fullDayEvent: fullDayEvent,
							class: event.class,
							location: location,
							geo: geo,
							description: description
						});
					}
				}
			});

			// send all our events to upper to merge, sort and reduce for display
			events = newEvents;

			self.broadcastEvents();
			scheduleTimer();
		});
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
		if (event.start.length === 8 || event.start.dateOnly) {
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
