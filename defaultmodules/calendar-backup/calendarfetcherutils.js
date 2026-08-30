/**
 * @external Moment
 */
const moment = require("moment-timezone");

const Log = require("logger");

const CalendarFetcherUtils = {

	/**
	 * Determine based on the title of an event if it should be excluded from the list of events
	 * TODO This seems like an overly complicated way to exclude events based on the title.
	 * @param {object} config the global config
	 * @param {string} title the title of the event
	 * @returns {object} excluded: true if the event should be excluded, false otherwise
	 * until: the date until the event should be excluded.
	 */
	shouldEventBeExcluded (config, title) {
		let result = {
			excluded: false,
			until: null
		};
		for (let f in config.excludedEvents) {
			let filter = config.excludedEvents[f],
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

			if (CalendarFetcherUtils.titleFilterApplies(testTitle, filter, useRegex, regexFlags)) {
				if (until) {
					result.until = until;
				} else {
					result.excluded = true;
				}
				break;
			}
		}
		return result;
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

		// can cause problems with e.g. birthdays before 1900
		if ((rule.options && rule.origOptions && rule.origOptions.dtstart && rule.origOptions.dtstart.getFullYear() < 1900) || (rule.options && rule.options.dtstart && rule.options.dtstart.getFullYear() < 1900)) {
			rule.origOptions.dtstart.setYear(1900);
			rule.options.dtstart.setYear(1900);
		}

		// subtract the max of the duration of this event or 1 day to find events in the past that are currently still running and should therefor be displayed.
		const oneDayInMs = 24 * 60 * 60000;
		let searchFromDate = pastLocalMoment.clone().subtract(Math.max(durationInMs, oneDayInMs), "milliseconds").toDate();
		let searchToDate = futureLocalMoment.clone().add(1, "days").toDate();
		Log.debug(`Search for recurring events between: ${searchFromDate} and ${searchToDate}`);

		// if until is set, and its a full day event, force the time to midnight. rrule gets confused with non-00 offset
		// looks like MS Outlook sets the until time incorrectly for fullday events
		if ((rule.options.until !== undefined) && CalendarFetcherUtils.isFullDayEvent(event)) {
			Log.debug("fixup rrule until");
			rule.options.until = moment(rule.options.until).clone().startOf("day").add(1, "day")
				.toDate();
		}

		Log.debug("fix rrule start=", rule.options.dtstart);
		Log.debug("event before rrule.between=", JSON.stringify(event, null, 2), "exdates=", event.exdate);

		Log.debug(`RRule: ${rule.toString()}`);
		rule.options.tzid = null; // RRule gets *very* confused with timezones

		let dates = rule.between(searchFromDate, searchToDate, true, () => {
			return true;
		});

		Log.debug(`Title: ${event.summary}, with dates: \n\n${JSON.stringify(dates)}\n`);

		// shouldn't need this  anymore, as RRULE not passed junk
		dates = dates.filter((d) => {
			return JSON.stringify(d) !== "null";
		});

		// Dates are returned in UTC timezone but with localdatetime because tzid is null.
		// So we map the date to a moment using the original timezone of the event.
		return dates.map((d) => (event.start.tz ? moment.tz(d, "UTC").tz(event.start.tz, true) : moment.tz(d, "UTC").tz(CalendarFetcherUtils.getLocalTimezone(), true)));
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
				Log.debug(`end:: ${eventEndMoment.toDate()}`);

				// Calculate the duration of the event for use with recurring events.
				const durationMs = eventEndMoment.valueOf() - eventStartMoment.valueOf();
				Log.debug(`duration: ${durationMs}`);

				const location = event.location || false;
				const geo = event.geo || false;
				const description = event.description || false;

				// TODO This should be a seperate function.
				if (event.rrule && typeof event.rrule !== "undefined" && !isFacebookBirthday) {
					// Recurring event.
					let moments = CalendarFetcherUtils.getMomentsFromRecurringEvent(event, pastLocalMoment, futureLocalMoment, durationMs);

					// Loop through the set of moment entries to see which recurrences should be added to our event list.
					// TODO This should create an event per moment so we can change anything we want.
					for (let m in moments) {
						let curEvent = event;
						let showRecurrence = true;
						let recurringEventStartMoment = moments[m].tz(CalendarFetcherUtils.getLocalTimezone()).clone();
						let recurringEventEndMoment = recurringEventStartMoment.clone().add(durationMs, "ms");

						let dateKey = recurringEventStartMoment.tz("UTC").format("YYYY-MM-DD");

						Log.debug("event date dateKey=", dateKey);
						// For each date that we're checking, it's possible that there is a recurrence override for that one day.
						if (curEvent.recurrences !== undefined) {
							Log.debug("have recurrences=", curEvent.recurrences);
							if (curEvent.recurrences[dateKey] !== undefined) {
								Log.debug("have a recurrence match for dateKey=", dateKey);
								// We found an override, so for this recurrence, use a potentially different title, start date, and duration.
								curEvent = curEvent.recurrences[dateKey];
								// Some event start/end dates don't have timezones
								if (curEvent.start.tz) {
									recurringEventStartMoment = moment(curEvent.start).tz(curEvent.start.tz).tz(CalendarFetcherUtils.getLocalTimezone());
								} else {
									recurringEventStartMoment = moment(curEvent.start).tz(CalendarFetcherUtils.getLocalTimezone());
								}
								if (curEvent.end.tz) {
									recurringEventEndMoment = moment(curEvent.end).tz(curEvent.end.tz).tz(CalendarFetcherUtils.getLocalTimezone());
								} else {
									recurringEventEndMoment = moment(curEvent.end).tz(CalendarFetcherUtils.getLocalTimezone());
								}
							} else {
								Log.debug("recurrence key ", dateKey, " doesn't match");
							}
						}
						// If there's no recurrence override, check for an exception date.  Exception dates represent exceptions to the rule.
						if (curEvent.exdate !== undefined) {
							Log.debug("have datekey=", dateKey, " exdates=", curEvent.exdate);
							if (curEvent.exdate[dateKey] !== undefined) {
								// This date is an exception date, which means we should skip it in the recurrence pattern.
								showRecurrence = false;
							}
						}

						if (recurringEventStartMoment.valueOf() === recurringEventEndMoment.valueOf()) {
							recurringEventEndMoment = recurringEventEndMoment.endOf("day");
						}

						const recurrenceTitle = CalendarFetcherUtils.getTitleFromEvent(curEvent);

						// If this recurrence ends before the start of the date range, or starts after the end of the date range, don"t add
						// it to the event list.
						if (recurringEventEndMoment.isBefore(pastLocalMoment) || recurringEventStartMoment.isAfter(futureLocalMoment)) {
							showRecurrence = false;
						}

						if (CalendarFetcherUtils.timeFilterApplies(now, recurringEventEndMoment, eventFilterUntil)) {
							showRecurrence = false;
						}

						if (showRecurrence === true) {
							Log.debug(`saving event: ${recurrenceTitle}`);
							newEvents.push({
								title: recurrenceTitle,
								startDate: recurringEventStartMoment.format("x"),
								endDate: recurringEventEndMoment.format("x"),
								fullDayEvent: CalendarFetcherUtils.isFullDayEvent(event),
								recurringEvent: true,
								class: event.class,
								firstYear: event.start.getFullYear(),
								location: location,
								geo: geo,
								description: description
							});
						} else {
							Log.debug("not saving event ", recurrenceTitle, eventStartMoment);
						}
						Log.debug(" ");
					}
					// End recurring event parsing.
				} else {
					// Single event.
					const fullDayEvent = isFacebookBirthday ? true : CalendarFetcherUtils.isFullDayEvent(event);
					// Log.debug("full day event")

					// if the start and end are the same, then make end the 'end of day' value (start is at 00:00:00)
					if (fullDayEvent && eventStartMoment.valueOf() === eventEndMoment.valueOf()) {
						eventEndMoment = eventEndMoment.endOf("day");
					}

					if (config.includePastEvents) {
						// Past event is too far in the past, so skip.
						if (eventEndMoment < pastLocalMoment) {
							return;
						}
					} else {
						// It's not a fullday event, and it is in the past, so skip.
						if (!fullDayEvent && eventEndMoment < now) {
							return;
						}

						// It's a fullday event, and it is before today, So skip.
						if (fullDayEvent && eventEndMoment <= now.startOf("day")) {
							return;
						}
					}

					// It exceeds the maximumNumberOfDays limit, so skip.
					if (eventStartMoment > futureLocalMoment) {
						return;
					}

					if (CalendarFetcherUtils.timeFilterApplies(now, eventEndMoment, eventFilterUntil)) {
						return;
					}

					// Every thing is good. Add it to the list.
					newEvents.push({
						title: title,
						startDate: eventStartMoment.format("x"),
						endDate: eventEndMoment.format("x"),
						fullDayEvent: fullDayEvent,
						recurringEvent: false,
						class: event.class,
						firstYear: event.start.getFullYear(),
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
	}
};

if (typeof module !== "undefined") {
	module.exports = CalendarFetcherUtils;
}
