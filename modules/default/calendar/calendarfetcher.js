/* Magic Mirror
 * Node Helper: Calendar - CalendarFetcher
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var ical = require("./vendor/ical.js");
var moment = require("moment");

var CalendarFetcher = function(url, reloadInterval, maximumEntries, maximumNumberOfDays, fetchStartDate) {
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

		var opts = {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Node.js 6.0.0) MagicMirror/v2 (https://github.com/MichMich/MagicMirror/)'
			}
		}
		ical.fromURL(url, opts, function(err, data) {
			if (err) {
				fetchFailedCallback(self, err);
				scheduleTimer();
				return;
			}

			//console.log(data);
			newEvents = [];

			var limitFunction = function(date, i) {return i < maximumEntries;};

			// Normally "now" will be today, but allow for start date overrides.
			var now = new Date(fetchStartDate);

			var today = moment(now).startOf("day").toDate();
			var future = moment(now).startOf("day").add(maximumNumberOfDays, "days").subtract(1, "seconds").toDate(); // Subtract 1 second so that events that start on the middle of the night will not repeat.

			for (var e in data) {
			    var event = data[e];

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
					var endDate;
					if (typeof event.end !== "undefined") {
						endDate = (event.end.length === 8) ? moment(event.end, "YYYYMMDD") : moment(new Date(event.end));
					} else {
						if (!isFacebookBirthday) {
							endDate = startDate;
						} else {
							endDate = moment(startDate).add(1, 'days');
						}
					}

					// calculate the duration of the event for use with recurring events.
					var duration = parseInt(endDate.format("x")) - parseInt(startDate.format("x"));

					if (event.start.length === 8) {
						startDate = startDate.startOf("day");
					}

					if (typeof event.rrule != "undefined" && !isFacebookBirthday) {
					    // console.log("Recurring event ...");
					    var rule = event.rrule;
						var dates = rule.between(today, future, true, limitFunction);

						// The "dates" array contains the set of dates within our today-to-future range that are valid
						// for the recurrence rule.  *However*, it's possible for us to have a specific recurrence that
						// had its date changed from outside the range to inside the range.  For the time being,
						// we'll handle this by adding *all* recurrence entries into the set of dates that we check,
						// because the logic below will filter out any recurrences that don't actually belong within
						// our display range.
						// TODO: Find a better way to handle this.
						if (event.recurrences != undefined)
						{
							var todayMoment = moment(today);
							var futureMoment = moment(future);
							
							for (var r in event.recurrences)
							{
								// Skip the dates that were already in the range so that we don't double-add those events.
								if (moment(new Date(r)).isBetween(todayMoment, futureMoment) != true)
								{
									dates.push(new Date(r));
								}
							}
						}

						for (var d in dates) {

							var curEvent = event;
						    var showRecurrence = true;

						    ruleDate = new Date(dates[d]);
							startDate = moment(ruleDate);

						    // Check for specific recurrence overrides
							if ((curEvent.recurrences != undefined) && (curEvent.recurrences[ruleDate.toISOString()] != undefined))
							{
								// We found an override, so for this recurrence, use a potentially different title, start date, and duration.
							    curEvent = curEvent.recurrences[ruleDate.toISOString()];
							    startDate = moment(curEvent.start);
							    duration = parseInt(moment(curEvent.end).format("x")) - parseInt(startDate.format("x"));
							}
    					    // If there's no recurrence override, check for an exception date
							else if ((curEvent.exdate != undefined) && (curEvent.exdate[ruleDate.toISOString()] != undefined))
							{
								// This date is an exception date, which means we should skip it in the recurrence pattern.
							    //console.log("Exception date found: " + ruleDate.toISOString());
							    showRecurrence = false;
							}

							endDate = moment(parseInt(startDate.format("x")) + duration, 'x');
							var recurrenceTitle = getTitleFromEvent(curEvent);

							if ((showRecurrence === true) && (endDate.format("x") > now)) {

								//console.log("Adding recurrence " + startDate.format("x") + " of event: " + recurrenceTitle);

								newEvents.push({
							        title: recurrenceTitle,
									startDate: startDate.format("x"),
									endDate: endDate.format("x"),
									fullDayEvent: isFullDayEvent(curEvent),
									firstYear: curEvent.start.getFullYear()
								});
							}
							else
							{
							    //console.log("Skipping recurrence " + startDate.format("x") + " of event: " + recurrenceTitle);
							}
						}
					} else {
						// console.log("Single event ...");
						// Single event.
						var title = getTitleFromEvent(event);
						var fullDayEvent = (isFacebookBirthday) ? true : isFullDayEvent(event);

						if (!fullDayEvent && endDate < now) {
							//console.log("It's not a fullday event, and it is in the past. So skip: " + title);
							continue;
						}

						if (fullDayEvent && endDate <= today) {
							//console.log("It's a fullday event, and it is before today. So skip: " + title);
							continue;
						}

						if (startDate > future) {
							//console.log("It exceeds the maximumNumberOfDays limit. So skip: " + title);
							continue;
						}

						// Every thing is good. Add it to the list.					
						newEvents.push({
							title: title,
							startDate: startDate.format("x"),
							endDate: endDate.format("x"),
							fullDayEvent: fullDayEvent
						});
						
					}
				}
			}

			newEvents.sort(function(a, b) {
				return a.startDate - b.startDate;
			});

			//console.log(newEvents);

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

    /* getTitleFromEvent(event)
	 * Gets the title from the event.
	 *
	 * argument event object - The event object to check.
	 *
	 * return string - The title of the event, or "Event" if no title is found.
	 */
	var getTitleFromEvent = function (event) {
	    var title = "Event";
	    if (event.summary) {
	        title = (typeof event.summary.val !== "undefined") ? event.summary.val : event.summary;
	    } else if (event.description) {
	        title = event.description;
	    }

	    return title;
	}

	/* isFullDayEvent(event)
	 * Checks if an event is a fullday event.
	 *
	 * argument event obejct - The event object to check.
	 *
	 * return bool - The event is a fullday event.
	 */
	var isFullDayEvent = function(event) {
		if (event.start.length === 8) {
			return true;
		}

		var start = event.start || 0;
		var startDate = new Date(start);
		var end = event.end || 0;

		if (end - start === 24 * 60 * 60 * 1000 && startDate.getHours() === 0 && startDate.getMinutes() === 0) {
			// Is 24 hours, and starts on the middle of the night.
			return true;			
		}

		return false;
	};

	/* public methods */

	/* startFetch()
	 * Initiate fetchCalendar();
	 */
	this.startFetch = function() {
		fetchCalendar();
	};

	/* broadcastItems()
	 * Broadcast the existing events.
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