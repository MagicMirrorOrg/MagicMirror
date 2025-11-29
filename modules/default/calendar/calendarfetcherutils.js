/**
 * @external Moment
 */
const moment = require("moment-timezone");

const Log = require("logger");

const CalendarFetcherUtils = {

	/**
	 * Determine based on the title of an event if it should be excluded from the list of events
	 * @param {object} config the global config
	 * @param {string} title the title of the event
	 * @returns {object} excluded: true if the event should be excluded, false otherwise
	 * until: the date until the event should be excluded.
	 */
	shouldEventBeExcluded (config, title) {
		for (const filterConfig of config.excludedEvents) {
			const match = CalendarFetcherUtils.checkEventAgainstFilter(title, filterConfig);
			if (match) {
				return {
					excluded: !match.until,
					until: match.until
				};
			}
		}

		return {
			excluded: false,
			until: null
		};
	},

	/**
	 * Get local timezone.
	 * This method makes it easier to test if different timezones cause problems by changing this implementation.
	 * @returns {string} timezone
	 */
	getLocalTimezone () {
		return moment.tz.guess();
	},

	/**
	 * This function returns a list of moments for a recurring event.
	 * @param {object} event the current event which is a recurring event
	 * @param {moment.Moment} pastLocalMoment The past date to search for recurring events
	 * @param {moment.Moment} futureLocalMoment The future date to search for recurring events
	 * @param {number} durationInMs the duration of the event, this is used to take into account currently running events
	 * @returns {moment.Moment[]} All moments for the recurring event
	 */
	getMomentsFromRecurringEvent (event, pastLocalMoment, futureLocalMoment, durationInMs) {
		const rule = event.rrule;
		const isFullDayEvent = CalendarFetcherUtils.isFullDayEvent(event);
		const eventTimezone = event.start.tz || CalendarFetcherUtils.getLocalTimezone();

		// rrule.js interprets years < 1900 as offsets from 1900, causing issues with some birthday calendars
		if (rule.origOptions?.dtstart?.getFullYear() < 1900) {
			rule.origOptions.dtstart.setFullYear(1900);
		}
		if (rule.options?.dtstart?.getFullYear() < 1900) {
			rule.options.dtstart.setFullYear(1900);
		}

		// Expand search window to include ongoing events
		const oneDayInMs = 24 * 60 * 60 * 1000;
		const searchFromDate = pastLocalMoment.clone().subtract(Math.max(durationInMs, oneDayInMs), "milliseconds").toDate();
		const searchToDate = futureLocalMoment.clone().add(1, "days").toDate();

		// For all-day events, extend "until" to end of day to include the final occurrence
		if (isFullDayEvent && rule.options?.until) {
			rule.options.until = moment(rule.options.until).endOf("day").toDate();
		}

		// Clear tzid to prevent rrule.js from double-adjusting times
		if (rule.options) {
			rule.options.tzid = null;
		}

		const dates = rule.between(searchFromDate, searchToDate, true) || [];

		// Convert dates to moments in the appropriate timezone
		// rrule.js returns UTC dates with tzid cleared, so we interpret them in the event's original timezone
		return dates.map((date) => {
			if (isFullDayEvent) {
				// For all-day events, anchor to calendar day in event's timezone
				return moment.tz(date, eventTimezone).startOf("day");
			}
			// For timed events, preserve the time in the event's original timezone
			return moment.tz(date, "UTC").tz(eventTimezone, true);
		});
	},

	/**
	 * Filter the events from ical according to the given config
	 * @param {object} data the calendar data from ical
	 * @param {object} config The configuration object
	 * @returns {string[]} the filtered events
	 */
	filterEvents (data, config) {
		const newEvents = [];

		const eventDate = function (event, time) {
			const startMoment = event[time].tz ? moment.tz(event[time], event[time].tz) : moment.tz(event[time], CalendarFetcherUtils.getLocalTimezone());
			return CalendarFetcherUtils.isFullDayEvent(event) ? startMoment.startOf("day") : startMoment;
		};

		Log.debug(`There are ${Object.entries(data).length} calendar entries.`);

		const now = moment();
		const pastLocalMoment = config.includePastEvents ? now.clone().startOf("day").subtract(config.maximumNumberOfDays, "days") : now;
		const futureLocalMoment
			= now
				.clone()
				.startOf("day")
				.add(config.maximumNumberOfDays, "days")
				// Subtract 1 second so that events that start on the middle of the night will not repeat.
				.subtract(1, "seconds");

		Object.entries(data).forEach(([key, event]) => {
			Log.debug("Processing entry...");

			const title = CalendarFetcherUtils.getTitleFromEvent(event);
			Log.debug(`title: ${title}`);

			// Return quickly if event should be excluded.
			let { excluded, eventFilterUntil } = this.shouldEventBeExcluded(config, title);
			if (excluded) {
				return;
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
				Log.debug(`Event:\n${JSON.stringify(event, null, 2)}`);
				let eventStartMoment = eventDate(event, "start");
				let eventEndMoment;

				if (typeof event.end !== "undefined") {
					eventEndMoment = eventDate(event, "end");
				} else if (typeof event.duration !== "undefined") {
					eventEndMoment = eventStartMoment.clone().add(moment.duration(event.duration));
				} else {
					if (!isFacebookBirthday) {
						// make copy of start date, separate storage area
						eventEndMoment = eventStartMoment.clone();
					} else {
						eventEndMoment = eventStartMoment.clone().add(1, "days");
					}
				}

				Log.debug(`start: ${eventStartMoment.toDate()}`);
				Log.debug(`end:   ${eventEndMoment.toDate()}`);

				// Calculate the duration of the event for use with recurring events.
				const durationMs = eventEndMoment.valueOf() - eventStartMoment.valueOf();
				Log.debug(`duration: ${durationMs}`);

				const location = event.location || false;
				const geo = event.geo || false;
				const description = event.description || false;

				let instances = [];
				if (event.rrule && typeof event.rrule !== "undefined" && !isFacebookBirthday) {
					instances = CalendarFetcherUtils.expandRecurringEvent(event, pastLocalMoment, futureLocalMoment, durationMs);
				} else {
					const fullDayEvent = isFacebookBirthday ? true : CalendarFetcherUtils.isFullDayEvent(event);
					let end = eventEndMoment;
					if (fullDayEvent && eventStartMoment.valueOf() === end.valueOf()) {
						end = end.endOf("day");
					}

					instances.push({
						event: event,
						startMoment: eventStartMoment,
						endMoment: end,
						isRecurring: false
					});
				}

				for (const instance of instances) {
					const { event: instanceEvent, startMoment, endMoment, isRecurring } = instance;

					// Filter logic
					if (endMoment.isBefore(pastLocalMoment) || startMoment.isAfter(futureLocalMoment)) {
						continue;
					}

					if (CalendarFetcherUtils.timeFilterApplies(now, endMoment, eventFilterUntil)) {
						continue;
					}

					const title = CalendarFetcherUtils.getTitleFromEvent(instanceEvent);
					const fullDay = isFacebookBirthday ? true : CalendarFetcherUtils.isFullDayEvent(event);

					Log.debug(`saving event: ${title}`);
					newEvents.push({
						title: title,
						startDate: startMoment.format("x"),
						endDate: endMoment.format("x"),
						fullDayEvent: fullDay,
						recurringEvent: isRecurring,
						class: event.class,
						firstYear: event.start.getFullYear(),
						location: instanceEvent.location || location,
						geo: instanceEvent.geo || geo,
						description: instanceEvent.description || description
					});
				}
			}
		});

		newEvents.sort(function (a, b) {
			return a.startDate - b.startDate;
		});

		return newEvents;
	},

	/**
	 * Gets the title from the event.
	 * @param {object} event The event object to check.
	 * @returns {string} The title of the event, or "Event" if no title is found.
	 */
	getTitleFromEvent (event) {
		let title = "Event";
		if (event.summary) {
			title = typeof event.summary.val !== "undefined" ? event.summary.val : event.summary;
		} else if (event.description) {
			title = event.description;
		}

		return title;
	},

	/**
	 * Checks if an event is a fullday event.
	 * @param {object} event The event object to check.
	 * @returns {boolean} True if the event is a fullday event, false otherwise
	 */
	isFullDayEvent (event) {
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
	},

	/**
	 * Determines if the user defined time filter should apply
	 * @param {moment.Moment} now Date object using previously created object for consistency
	 * @param {moment.Moment} endDate Moment object representing the event end date
	 * @param {string} filter The time to subtract from the end date to determine if an event should be shown
	 * @returns {boolean} True if the event should be filtered out, false otherwise
	 */
	timeFilterApplies (now, endDate, filter) {
		if (filter) {
			const until = filter.split(" "),
				value = parseInt(until[0]),
				increment = until[1].slice(-1) === "s" ? until[1] : `${until[1]}s`, // Massage the data for moment js
				filterUntil = moment(endDate.format()).subtract(value, increment);

			return now < filterUntil;
		}

		return false;
	},

	/**
	 * Determines if the user defined title filter should apply
	 * @param {string} title the title of the event
	 * @param {string} filter the string to look for, can be a regex also
	 * @param {boolean} useRegex true if a regex should be used, otherwise it just looks for the filter as a string
	 * @param {string} regexFlags flags that should be applied to the regex
	 * @returns {boolean} True if the title should be filtered out, false otherwise
	 */
	titleFilterApplies (title, filter, useRegex, regexFlags) {
		if (useRegex) {
			let regexFilter = filter;
			// Assume if leading slash, there is also trailing slash
			if (filter[0] === "/") {
				// Strip leading and trailing slashes
				regexFilter = filter.substr(1).slice(0, -1);
			}
			return new RegExp(regexFilter, regexFlags).test(title);
		} else {
			return title.includes(filter);
		}
	},

	/**
	 * Expands a recurring event into individual event instances.
	 * @param {object} event The recurring event object
	 * @param {moment.Moment} pastLocalMoment The past date limit
	 * @param {moment.Moment} futureLocalMoment The future date limit
	 * @param {number} durationMs The duration of the event in milliseconds
	 * @returns {object[]} Array of event instances
	 */
	expandRecurringEvent (event, pastLocalMoment, futureLocalMoment, durationMs) {
		const moments = CalendarFetcherUtils.getMomentsFromRecurringEvent(event, pastLocalMoment, futureLocalMoment, durationMs);
		const instances = [];

		for (const startMoment of moments) {
			let curEvent = event;
			let showRecurrence = true;
			let recurringEventStartMoment = startMoment.clone().tz(CalendarFetcherUtils.getLocalTimezone());
			let recurringEventEndMoment = recurringEventStartMoment.clone().add(durationMs, "ms");

			const dateKey = recurringEventStartMoment.tz("UTC").format("YYYY-MM-DD");

			// Check for overrides
			if (curEvent.recurrences !== undefined) {
				if (curEvent.recurrences[dateKey] !== undefined) {
					curEvent = curEvent.recurrences[dateKey];
					// Re-calculate start/end based on override
					const start = curEvent.start;
					const end = curEvent.end;
					const localTimezone = CalendarFetcherUtils.getLocalTimezone();

					recurringEventStartMoment = (start.tz ? moment(start).tz(start.tz) : moment(start)).tz(localTimezone);
					recurringEventEndMoment = (end.tz ? moment(end).tz(end.tz) : moment(end)).tz(localTimezone);
				}
			}

			// Check for exceptions
			if (curEvent.exdate !== undefined) {
				if (curEvent.exdate[dateKey] !== undefined) {
					showRecurrence = false;
				}
			}

			if (recurringEventStartMoment.valueOf() === recurringEventEndMoment.valueOf()) {
				recurringEventEndMoment = recurringEventEndMoment.endOf("day");
			}

			if (showRecurrence) {
				instances.push({
					event: curEvent,
					startMoment: recurringEventStartMoment,
					endMoment: recurringEventEndMoment,
					isRecurring: true
				});
			}
		}
		return instances;
	},

	/**
	 * Checks if an event title matches a specific filter configuration.
	 * @param {string} title The event title to check
	 * @param {string|object} filterConfig The filter configuration (string or object)
	 * @returns {object|null} Object with {until: string|null} if matched, null otherwise
	 */
	checkEventAgainstFilter (title, filterConfig) {
		let filter = filterConfig;
		let testTitle = title.toLowerCase();
		let until = null;
		let useRegex = false;
		let regexFlags = "g";

		if (filter instanceof Object) {
			if (typeof filter.until !== "undefined") {
				until = filter.until;
			}

			if (typeof filter.regex !== "undefined") {
				useRegex = filter.regex;
			}

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

		if (CalendarFetcherUtils.titleFilterApplies(testTitle, filter, useRegex, regexFlags)) {
			return { until };
		}

		return null;
	}
};

if (typeof module !== "undefined") {
	module.exports = CalendarFetcherUtils;
}
