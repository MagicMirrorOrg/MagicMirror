/**
 * @external Moment
 */
const moment = require("moment-timezone");
const ical = require("node-ical");

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
	 * Filter the events from ical according to the given config
	 * @param {object} data the calendar data from ical
	 * @param {object} config The configuration object
	 * @returns {object[]} the filtered events
	 */
	filterEvents (data, config) {
		const newEvents = [];

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

			if (event.type !== "VEVENT") {
				return;
			}

			const title = CalendarFetcherUtils.getTitleFromEvent(event);
			Log.debug(`title: ${title}`);

			// Return quickly if event should be excluded.
			const { excluded, until: eventFilterUntil } = CalendarFetcherUtils.shouldEventBeExcluded(config, title);
			if (excluded) {
				return;
			}

			Log.debug(`Event:\n${JSON.stringify(event, null, 2)}`);

			const location = CalendarFetcherUtils.unwrapParameterValue(event.location) || false;
			const geo = event.geo || false;
			const description = CalendarFetcherUtils.unwrapParameterValue(event.description) || false;

			let instances;
			try {
				instances = CalendarFetcherUtils.expandRecurringEvent(event, pastLocalMoment, futureLocalMoment);
			} catch (error) {
				Log.error(`Could not expand event "${title}": ${error.message}`);
				return;
			}

			for (const instance of instances) {
				const { event: instanceEvent, startMoment, endMoment, isRecurring, isFullDay } = instance;

				// Filter logic
				if (endMoment.isBefore(pastLocalMoment) || startMoment.isAfter(futureLocalMoment)) {
					continue;
				}

				if (CalendarFetcherUtils.timeFilterApplies(now, endMoment, eventFilterUntil)) {
					continue;
				}

				const instanceTitle = CalendarFetcherUtils.getTitleFromEvent(instanceEvent);

				Log.debug(`saving event: ${instanceTitle}, start: ${startMoment.toDate()}, end: ${endMoment.toDate()}`);
				newEvents.push({
					title: instanceTitle,
					startDate: startMoment.format("x"),
					endDate: endMoment.format("x"),
					fullDayEvent: isFullDay,
					recurringEvent: isRecurring,
					class: event.class,
					firstYear: event.start.getFullYear(),
					location: CalendarFetcherUtils.unwrapParameterValue(instanceEvent.location) || location,
					geo: instanceEvent.geo || geo,
					description: CalendarFetcherUtils.unwrapParameterValue(instanceEvent.description) || description
				});
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
		return CalendarFetcherUtils.unwrapParameterValue(event.summary || event.description) || "Event";
	},

	/**
	 * Extracts the string value from a node-ical ParameterValue object ({val, params})
	 * or returns the value as-is if it is already a plain string.
	 * This handles ICS properties with parameters, e.g. DESCRIPTION;LANGUAGE=de:Text.
	 * @param {string|object} value The raw value from node-ical
	 * @returns {string|object} The unwrapped string value, or the original value if not a ParameterValue
	 */
	unwrapParameterValue (value) {
		if (value && typeof value === "object" && typeof value.val !== "undefined") {
			return value.val;
		}
		return value;
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

			return now.isBefore(filterUntil);
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
				regexFilter = filter.slice(1, -1);
			}
			return new RegExp(regexFilter, regexFlags).test(title);
		} else {
			return title.includes(filter);
		}
	},

	/**
	 * Expands a recurring event into individual event instances using node-ical.
	 * Handles RRULE expansion, EXDATE filtering, RECURRENCE-ID overrides, and ongoing events.
	 * @param {object} event The recurring event object
	 * @param {moment.Moment} pastLocalMoment The past date limit
	 * @param {moment.Moment} futureLocalMoment The future date limit
	 * @returns {object[]} Array of event instances with startMoment/endMoment in the local timezone
	 */
	expandRecurringEvent (event, pastLocalMoment, futureLocalMoment) {
		const localTimezone = CalendarFetcherUtils.getLocalTimezone();

		return ical
			.expandRecurringEvent(event, {
				from: pastLocalMoment.toDate(),
				to: futureLocalMoment.toDate(),
				includeOverrides: true,
				excludeExdates: true,
				expandOngoing: true
			})
			.map((inst) => {
				let startMoment, endMoment;
				if (inst.isFullDay) {
					startMoment = moment.tz([inst.start.getFullYear(), inst.start.getMonth(), inst.start.getDate()], localTimezone);
					endMoment = moment.tz([inst.end.getFullYear(), inst.end.getMonth(), inst.end.getDate()], localTimezone);
				} else {
					startMoment = moment(inst.start).tz(localTimezone);
					endMoment = moment(inst.end).tz(localTimezone);
				}
				if (startMoment.valueOf() === endMoment.valueOf()) endMoment = endMoment.endOf("day");
				return { event: inst.event, startMoment, endMoment, isRecurring: inst.isRecurring, isFullDay: inst.isFullDay };
			});
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
