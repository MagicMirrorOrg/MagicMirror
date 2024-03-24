/**
 * @external Moment
 */
const path = require("node:path");
const moment = require("moment");

const zoneTable = require(path.join(__dirname, "windowsZones.json"));
const Log = require("../../../js/logger");

const CalendarFetcherUtils = {

	/**
	 * Calculate the time correction, either dst/std or full day in cases where
	 * utc time is day before plus offset
	 * @param {object} event the event which needs adjustment
	 * @param {Date} date the date on which this event happens
	 * @returns {number} the necessary adjustment in hours
	 */
	calculateTimezoneAdjustment (event, date) {
		let adjustHours = 0;
		// if a timezone was specified
		if (!event.start.tz) {
			Log.debug(" if no tz, guess based on now");
			event.start.tz = moment.tz.guess();
		}
		Log.debug(`initial tz=${event.start.tz}`);

		// if there is a start date specified
		if (event.start.tz) {
			// if this is a windows timezone
			if (event.start.tz.includes(" ")) {
				// use the lookup table to get theIANA name as moment and date don't know MS timezones
				let tz = CalendarFetcherUtils.getIanaTZFromMS(event.start.tz);
				Log.debug(`corrected TZ=${tz}`);
				// watch out for unregistered windows timezone names
				// if we had a successful lookup
				if (tz) {
					// change the timezone to the IANA name
					event.start.tz = tz;
					// Log.debug("corrected timezone="+event.start.tz)
				}
			}
			Log.debug(`corrected tz=${event.start.tz}`);
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
				Log.debug(`defined offset=${start_offset} hours`);
				current_offset = start_offset;
				event.start.tz = "";
				Log.debug(`ical offset=${current_offset} date=${date}`);
				mm = moment(date);
				let x = moment(new Date()).utcOffset();
				Log.debug(`net mins=${current_offset * 60 - x}`);

				mm = mm.add(x - current_offset * 60, "minutes");
				adjustHours = (current_offset * 60 - x) / 60;
				event.start = mm.toDate();
				Log.debug(`adjusted date=${event.start}`);
			} else {
				// get the start time in that timezone
				let es = moment(event.start);
				// check for start date prior to start of daylight changing date
				if (es.format("YYYY") < 2007) {
					es.set("year", 2013); // if so, use a closer date
				}
				Log.debug(`start date/time=${es.toDate()}`);
				start_offset = moment.tz(es, event.start.tz).utcOffset();
				Log.debug(`start offset=${start_offset}`);

				Log.debug(`start date/time w tz =${moment.tz(moment(event.start), event.start.tz).toDate()}`);

				// get the specified date in that timezone
				mm = moment.tz(moment(date), event.start.tz);
				Log.debug(`event date=${mm.toDate()}`);
				current_offset = mm.utcOffset();
			}
			Log.debug(`event offset=${current_offset} hour=${mm.format("H")} event date=${mm.toDate()}`);

			// if the offset is greater than 0, east of london
			if (current_offset !== start_offset) {
				// big offset
				Log.debug("offset");
				let h = parseInt(mm.format("H"));
				// check if the event time is less than the offset
				if (h > 0 && h < Math.abs(current_offset) / 60) {
					// if so, rrule created a wrong date (utc day, oops, with utc yesterday adjusted time)
					// we need to fix that
					//adjustHours = 24;
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
		Log.debug(`adjustHours=${adjustHours}`);
		return adjustHours;
	},

	/**
	 * Filter the events from ical according to the given config
	 * @param {object} data the calendar data from ical
	 * @param {object} config The configuration object
	 * @returns {string[]} the filtered events
	 */
	filterEvents (data, config) {
		const newEvents = [];

		// limitFunction doesn't do much limiting, see comment re: the dates
		// array in rrule section below as to why we need to do the filtering
		// ourselves
		const limitFunction = function (date, i) {
			return true;
		};

		const eventDate = function (event, time) {
			return CalendarFetcherUtils.isFullDayEvent(event) ? moment(event[time]).startOf("day") : moment(event[time]);
		};

		Log.debug(`There are ${Object.entries(data).length} calendar entries.`);

		const now = new Date(Date.now());
		const todayLocal = moment(now).startOf("day").toDate();
		const futureLocalDate
			= moment(now)
				.startOf("day")
				.add(config.maximumNumberOfDays, "days")
				.subtract(1, "seconds") // Subtract 1 second so that events that start on the middle of the night will not repeat.
				.toDate();

		Object.entries(data).forEach(([key, event]) => {
			Log.debug("Processing entry...");
			let pastLocalDate = todayLocal;

			if (config.includePastEvents) {
				pastLocalDate = moment(now).startOf("day").subtract(config.maximumNumberOfDays, "days").toDate();
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
				Log.debug(`Event:\n${JSON.stringify(event)}`);
				let startMoment = eventDate(event, "start");
				let endMoment;

				if (typeof event.end !== "undefined") {
					endMoment = eventDate(event, "end");
				} else if (typeof event.duration !== "undefined") {
					endMoment = startMoment.clone().add(moment.duration(event.duration));
				} else {
					if (!isFacebookBirthday) {
						// make copy of start date, separate storage area
						endMoment = moment(startMoment.valueOf());
					} else {
						endMoment = moment(startMoment).add(1, "days");
					}
				}

				Log.debug(`start: ${startMoment.toDate()}`);
				Log.debug(`end:: ${endMoment.toDate()}`);

				// Calculate the duration of the event for use with recurring events.
				const durationMs = endMoment.valueOf() - startMoment.valueOf();
				Log.debug(`duration: ${durationMs}`);

				// FIXME: Since the parsed json object from node-ical comes with time information
				// this check could be removed (?)
				if (event.start.length === 8) {
					startMoment = startMoment.startOf("day");
				}

				const title = CalendarFetcherUtils.getTitleFromEvent(event);
				Log.debug(`title: ${title}`);

				let excluded = false,
					dateFilter = null;

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

				if (event.rrule && typeof event.rrule !== "undefined" && !isFacebookBirthday) {
					const rule = event.rrule;

					const pastMoment = moment(pastLocalDate);
					const futureMoment = moment(futureLocalDate);

					// can cause problems with e.g. birthdays before 1900
					if ((rule.options && rule.origOptions && rule.origOptions.dtstart && rule.origOptions.dtstart.getFullYear() < 1900) || (rule.options && rule.options.dtstart && rule.options.dtstart.getFullYear() < 1900)) {
						rule.origOptions.dtstart.setYear(1900);
						rule.options.dtstart.setYear(1900);
					}

					// For recurring events, get the set of start dates that fall within the range
					// of dates we're looking for.
					// kblankenship1989 - to fix issue #1798, converting all dates to locale time first, then converting back to UTC time
					let pastLocal;
					let futureLocal;
					if (CalendarFetcherUtils.isFullDayEvent(event)) {
						Log.debug("fullday");
						// if full day event, only use the date part of the ranges
						pastLocal = pastMoment.toDate();
						futureLocal = futureMoment.toDate();

						Log.debug(`pastLocal: ${pastLocal}`);
						Log.debug(`futureLocal: ${futureLocal}`);
					} else {
						// if we want past events
						if (config.includePastEvents) {
							// use the calculated past time for the between from
							pastLocal = pastMoment.toDate();
						} else {
							// otherwise use NOW.. cause we shouldn't use any before now
							pastLocal = moment(now).toDate(); //now
						}
						futureLocal = futureMoment.toDate(); // future
					}
					Log.debug(`Search for recurring events between: ${pastLocal} and ${futureLocal}`);
					const hasByWeekdayRule = rule.options.byweekday !== undefined && rule.options.byweekday !== null;
					const oneDayInMs = 24 * 60 * 60 * 1000;
					Log.debug(`RRule: ${rule.toString()}`);
					rule.options.tzid = null; // RRule gets *very* confused with timezones
					let dates = rule.between(new Date(pastLocal.valueOf() - oneDayInMs), new Date(futureLocal.valueOf() + oneDayInMs), true, () => { return true; });
					Log.debug(`Title: ${event.summary}, with dates: ${JSON.stringify(dates)}`);
					dates = dates.filter((d) => {
						if (JSON.stringify(d) === "null") return false;
						else return true;
					});

					// RRule can generate dates with an incorrect recurrence date. Process the array here and apply date correction.
					if (hasByWeekdayRule) {
						Log.debug("Rule has byweekday, checking for correction");
						dates.forEach((date, index, arr) => {
							// NOTE: getTimezoneOffset() is negative of the expected value. For America/Los_Angeles under DST (GMT-7),
							// this value is +420. For Australia/Sydney under DST (GMT+11), this value is -660.
							const tzOffset = date.getTimezoneOffset() / 60;
							const hour = date.getHours();
							if ((tzOffset < 0) && (hour < -tzOffset)) { // east of GMT
								Log.debug(`East of GMT (tzOffset: ${tzOffset}) and hour=${hour} < ${-tzOffset}, Subtracting 1 day from ${date}`);
								arr[index] = new Date(date.valueOf() - oneDayInMs);
							} else if ((tzOffset > 0) && (hour >= (24 - tzOffset))) { // west of GMT
								Log.debug(`West of GMT (tzOffset: ${tzOffset}) and hour=${hour} >= 24-${tzOffset}, Adding 1 day to ${date}`);
								arr[index] = new Date(date.valueOf() + oneDayInMs);
							}
						});
						// Adjusting the dates could push it beyond the 'until' date, so filter those out here.
						if (rule.options.until !== null) {
							dates = dates.filter((date) => {
								return date.valueOf() <= rule.options.until.valueOf();
							});
						}
					}

					// The dates array from rrule can be confused by DST. If the event was created during DST and we
					// are querying a date range during non-DST, rrule can have the incorrect time for the date range.
					// Reprocess the array here computing and applying the time offset.
					dates.forEach((date, index, arr) => {
						let adjustHours = CalendarFetcherUtils.calculateTimezoneAdjustment(event, date);
						if (adjustHours !== 0) {
							Log.debug(`Applying timezone adjustment hours=${adjustHours} to ${date}`);
							arr[index] = new Date(date.valueOf() + (adjustHours * 60 * 60 * 1000));
						}
					});

					// The "dates" array contains the set of dates within our desired date range range that are valid
					// for the recurrence rule. *However*, it's possible for us to have a specific recurrence that
					// had its date changed from outside the range to inside the range.  For the time being,
					// we'll handle this by adding *all* recurrence entries into the set of dates that we check,
					// because the logic below will filter out any recurrences that don't actually belong within
					// our display range.
					// Would be great if there was a better way to handle this.
					Log.debug(`event.recurrences: ${event.recurrences}`);
					if (event.recurrences !== undefined) {
						for (let dateKey in event.recurrences) {
							// Only add dates that weren't already in the range we added from the rrule so that
							// we don't double-add those events.
							let d = new Date(dateKey);
							if (!moment(d).isBetween(pastMoment, futureMoment)) {
								dates.push(d);
							}
						}
					}

					// Lastly, sometimes rrule doesn't include the event.start even if it is in the requested range. Ensure
					// inclusion here. Unfortunately dates.includes() doesn't find it so we have to do forEach().
					{
						let found = false;
						dates.forEach((d) => { if (d.valueOf() === event.start.valueOf()) found = true; });
						if (!found) {
							Log.debug(`event.start=${event.start} was not included in results from rrule; adding`);
							dates.splice(0, 0, event.start);
						}
					}

					// Loop through the set of date entries to see which recurrences should be added to our event list.
					for (let d in dates) {
						let date = dates[d];
						let curEvent = event;
						let curDurationMs = durationMs;
						let showRecurrence = true;

						startMoment = moment(date);

						// Remove the time information of each date by using its substring, using the following method:
						// .toISOString().substring(0,10).
						// since the date is given as ISOString with YYYY-MM-DDTHH:MM:SS.SSSZ
						// (see https://momentjs.com/docs/#/displaying/as-iso-string/).
						// This must be done after `date` is adjusted
						const dateKey = date.toISOString().substring(0, 10);

						// For each date that we're checking, it's possible that there is a recurrence override for that one day.
						if (curEvent.recurrences !== undefined && curEvent.recurrences[dateKey] !== undefined) {
							// We found an override, so for this recurrence, use a potentially different title, start date, and duration.
							curEvent = curEvent.recurrences[dateKey];
							startMoment = moment(curEvent.start);
							curDurationMs = curEvent.end.valueOf() - startMoment.valueOf();
						}
						// If there's no recurrence override, check for an exception date.  Exception dates represent exceptions to the rule.
						else if (curEvent.exdate !== undefined && curEvent.exdate[dateKey] !== undefined) {
							// This date is an exception date, which means we should skip it in the recurrence pattern.
							showRecurrence = false;
						}
						Log.debug(`duration: ${curDurationMs}`);

						endMoment = moment(startMoment.valueOf() + curDurationMs);
						if (startMoment.valueOf() === endMoment.valueOf()) {
							endMoment = endMoment.endOf("day");
						}

						const recurrenceTitle = CalendarFetcherUtils.getTitleFromEvent(curEvent);

						// If this recurrence ends before the start of the date range, or starts after the end of the date range, don"t add
						// it to the event list.
						if (endMoment.isBefore(pastLocal) || startMoment.isAfter(futureLocal)) {
							showRecurrence = false;
						}

						if (CalendarFetcherUtils.timeFilterApplies(now, endMoment, dateFilter)) {
							showRecurrence = false;
						}

						if (showRecurrence === true) {
							Log.debug(`saving event: ${description}`);
							newEvents.push({
								title: recurrenceTitle,
								startDate: startMoment.format("x"),
								endDate: endMoment.format("x"),
								fullDayEvent: CalendarFetcherUtils.isFullDayEvent(event),
								recurringEvent: true,
								class: event.class,
								firstYear: event.start.getFullYear(),
								location: location,
								geo: geo,
								description: description
							});
						}
					}
					// End recurring event parsing.
				} else {
					// Single event.
					const fullDayEvent = isFacebookBirthday ? true : CalendarFetcherUtils.isFullDayEvent(event);
					// Log.debug("full day event")

					// if the start and end are the same, then make end the 'end of day' value (start is at 00:00:00)
					if (fullDayEvent && startMoment.valueOf() === endMoment.valueOf()) {
						endMoment = endMoment.endOf("day");
					}

					if (config.includePastEvents) {
						// Past event is too far in the past, so skip.
						if (endMoment < pastLocalDate) {
							return;
						}
					} else {
						// It's not a fullday event, and it is in the past, so skip.
						if (!fullDayEvent && endMoment < now) {
							return;
						}

						// It's a fullday event, and it is before today, So skip.
						if (fullDayEvent && endMoment <= todayLocal) {
							return;
						}
					}

					// It exceeds the maximumNumberOfDays limit, so skip.
					if (startMoment > futureLocalDate) {
						return;
					}

					if (CalendarFetcherUtils.timeFilterApplies(now, endMoment, dateFilter)) {
						return;
					}

					// get correction for date saving and dst change between now and then
					let adjustHours = CalendarFetcherUtils.calculateTimezoneAdjustment(event, startMoment.toDate());
					// This shouldn't happen
					if (adjustHours) {
						Log.warn(`Unexpected timezone adjustment of ${adjustHours} hours on non-recurring event`);
					}
					// Every thing is good. Add it to the list.
					newEvents.push({
						title: title,
						startDate: startMoment.add(adjustHours, "hours").format("x"),
						endDate: endMoment.add(adjustHours, "hours").format("x"),
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

		return newEvents;
	},

	/**
	 * Lookup iana tz from windows
	 * @param {string} msTZName the timezone name to lookup
	 * @returns {string|null} the iana name or null of none is found
	 */
	getIanaTZFromMS (msTZName) {
		// Get hash entry
		const he = zoneTable[msTZName];
		// If found return iana name, else null
		return he ? he.iana[0] : null;
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
	 * @param {Date} now Date object using previously created object for consistency
	 * @param {Moment} endDate Moment object representing the event end date
	 * @param {string} filter The time to subtract from the end date to determine if an event should be shown
	 * @returns {boolean} True if the event should be filtered out, false otherwise
	 */
	timeFilterApplies (now, endDate, filter) {
		if (filter) {
			const until = filter.split(" "),
				value = parseInt(until[0]),
				increment = until[1].slice(-1) === "s" ? until[1] : `${until[1]}s`, // Massage the data for moment js
				filterUntil = moment(endDate.format()).subtract(value, increment);

			return now < filterUntil.toDate();
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
