/* Magic Mirror
 * Calendar Util Methods
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */

/**
 * @external Moment
 */
const moment = require("moment");
const path = require("path");
const zoneTable = require(path.join(__dirname, "windowsZones.json"));
const Log = require("../../../js/logger.js");

const CalendarUtils = {
	/**
	 * Calculate the time correction, either dst/std or full day in cases where
	 * utc time is day before plus offset
	 *
	 * @param event
	 * @param date
	 * @returns {number} the necessary adjustment in hours
	 */
	calculateTimezoneAdjustment: function (event, date) {
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
				let tz = CalendarUtils.getIanaTZFromMS(event.start.tz);
				Log.debug("corrected TZ=" + tz);
				// watch out for unregistered windows timezone names
				// if we had a successful lookup
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
	},

	/**
	 * Lookup iana tz from windows
	 *
	 * @param msTZName
	 * @returns {*|null}
	 */
	getIanaTZFromMS: function (msTZName) {
		// Get hash entry
		const he = zoneTable[msTZName];
		// If found return iana name, else null
		return he ? he.iana[0] : null;
	},

	/**
	 * Gets the title from the event.
	 *
	 * @param {object} event The event object to check.
	 * @returns {string} The title of the event, or "Event" if no title is found.
	 */
	getTitleFromEvent: function (event) {
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
	 *
	 * @param {object} event The event object to check.
	 * @returns {boolean} True if the event is a fullday event, false otherwise
	 */
	isFullDayEvent: function (event) {
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
	 *
	 * @param {Date} now Date object using previously created object for consistency
	 * @param {Moment} endDate Moment object representing the event end date
	 * @param {string} filter The time to subtract from the end date to determine if an event should be shown
	 * @returns {boolean} True if the event should be filtered out, false otherwise
	 */
	timeFilterApplies: function (now, endDate, filter) {
		if (filter) {
			const until = filter.split(" "),
				value = parseInt(until[0]),
				increment = until[1].slice(-1) === "s" ? until[1] : until[1] + "s", // Massage the data for moment js
				filterUntil = moment(endDate.format()).subtract(value, increment);

			return now < filterUntil.format("x");
		}

		return false;
	},

	/**
	 *
	 * @param title
	 * @param filter
	 * @param useRegex
	 * @param regexFlags
	 * @returns {boolean|*}
	 */
	titleFilterApplies: function (title, filter, useRegex, regexFlags) {
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
	}
};

if (typeof module !== "undefined") {
	module.exports = CalendarUtils;
}
