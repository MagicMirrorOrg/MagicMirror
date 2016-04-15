/* Magic Mirror
 * Node Helper: Calendar - CalendarFetcher
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var ical = require("ical");
var moment = require("moment");

var CalendarFetcher = function(url, reloadInterval, maximumEntries, maximumNumberOfDays) {
	var self = this;

	var reloadTimer = null;
	var events = [];

	var fetchFailedCallback = function() {};
	var eventsReceivedCallback = function() {};

	/* fetchCalendar()
	 * Initiates calendar fetch.
	 */
	var fetchCalendar = function() {

		clearTimeout(reloadTimer);
		reloadTimer = null;

		ical.fromURL(url, {}, function(err, data) {
			if (err) {
				fetchFailedCallback(self, err);
				scheduleTimer();
				return;
			}

			//console.log(data);
			newEvents = [];

			var limitFunction = function(date, i) {return i < maximumEntries;};

			for (var e in data) {
				var event = data[e];
				var now = new Date();
				var today = moment().startOf("day").toDate();
				var future = moment().startOf("day").add(maximumNumberOfDays, "days").toDate();

				

				// FIXME:
				// Ugly fix to solve the facebook birthday issue.
				// Otherwise, the recurring events only show the birthday for next year.
				var isFacebookBirthday = false;
				if (typeof event.uid !== "undefined") {
					if (event.uid.indexOf("@facebook.com") !== -1) {
						isFacebookBirthday = true;
					}
				}

				if (event.type === "VEVENT") {

					var startDate = (event.start.length === 8) ? moment(event.start, "YYYYMMDD") : moment(new Date(event.start));
					if (event.start.length === 8) {
						startDate = startDate.startOf("day");
					}

					if (typeof event.rrule != "undefined" && !isFacebookBirthday) {
						var rule = event.rrule;
						// console.log("Repeating event ...");
						
						// Check if the timeset is set to this current time.
						// If so, the RRULE line does not contain any BYHOUR, BYMINUTE, BYSECOND params.
						// This causes the times of the recurring event to be incorrect.
						// By adjusting the timeset property, this issue is solved.

						
						if (rule.timeset[0].hour == now.getHours(),
							rule.timeset[0].minute == now.getMinutes(),
							rule.timeset[0].second == now.getSeconds()) {

							rule.timeset[0].hour = startDate.format("H");
							rule.timeset[0].minute = startDate.format("m");
							rule.timeset[0].second = startDate.format("s");
						}

						var dates = rule.between(today, future, true, limitFunction);
						
						for (var d in dates) {
							startDate = moment(new Date(dates[d]));
							newEvents.push({
								title: (typeof event.summary.val !== "undefined") ? event.summary.val : event.summary,
								startDate: startDate.format("x"),
								fullDayEvent: (event.start.length === 8)

							});
						}
					} else {
						// console.log("Single event ...");
						// Single event.
						if (startDate >= today && startDate <= future) {
							newEvents.push({
								title: (typeof event.summary.val !== "undefined") ? event.summary.val : event.summary,
								startDate: startDate.format("x"),
								fullDayEvent: (event.start.length === 8)
							});
						}
					}
				}
			}

			newEvents.sort(function(a, b) {
				return a.startDate - b.startDate;
			});

			events = newEvents.slice(0, maximumEntries);

			self.broadcastEvents();
			scheduleTimer();
		});
	};

	/* scheduleTimer()
	 * Schedule the timer for the next update.
	 */
	var scheduleTimer = function() {
		//console.log('Schedule update timer.');
		clearTimeout(reloadTimer);
		reloadTimer = setTimeout(function() {
			fetchCalendar();
		}, reloadInterval);
	};

	/* public methods */

	/* startFetch()
	 * Initiate fetchCalendar();
	 */
	this.startFetch = function() {
		fetchCalendar();
	};

	/* broadcastItems()
	 * Broadcast the exsisting events.
	 */
	this.broadcastEvents = function() {
		//console.log('Broadcasting ' + events.length + ' events.');
		eventsReceivedCallback(self);
	};

	/* onReceive(callback)
	 * Sets the on success callback
	 *
	 * argument callback function - The on success callback.
	 */
	this.onReceive = function(callback) {
		eventsReceivedCallback = callback;
	};

	/* onError(callback)
	 * Sets the on error callback
	 *
	 * argument callback function - The on error callback.
	 */
	this.onError = function(callback) {
		fetchFailedCallback = callback;
	};

	/* url()
	 * Returns the url of this fetcher.
	 *
	 * return string - The url of this fetcher.
	 */
	this.url = function() {
		return url;
	};

	/* events()
	 * Returns current available events for this fetcher.
	 *
	 * return array - The current available events for this fetcher.
	 */
	this.events = function() {
		return events;
	};

};


module.exports = CalendarFetcher;