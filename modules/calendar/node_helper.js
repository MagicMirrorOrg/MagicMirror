/* Magic Mirror
 * Node Helper: Calendar
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var NodeHelper = require('node_helper');
var ical = require('ical');
var moment = require('moment');
var validUrl = require('valid-url');

var CalendarFetcher = function(url, reloadInterval, maximumEntries) {
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

			var limitFunction = function (date, i){return i < maximumEntries;};

			for (var e in data) {
				var event = data[e];
	
				if (event.type === 'VEVENT') {
					var startDate = (event.start.length === 8) ? moment(event.start, 'YYYYMMDD') : moment(new Date(event.start));

					if (typeof event.rrule != 'undefined') {
						var rule = event.rrule;

						// Check if the timeset is set to this current time.
						// If so, the RRULE line does not contain any BYHOUR, BYMINUTE, BYSECOND params.
						// This causes the times of the recurring event to be incorrect.
						// By adjusting the timeset property, this issue is solved.
						var now = new Date();
						if (rule.timeset[0].hour == now.getHours(),
							rule.timeset[0].minute == now.getMinutes(),
							rule.timeset[0].second == now.getSeconds()) {

							rule.timeset[0].hour = startDate.format('H');
							rule.timeset[0].minute = startDate.format('m');
							rule.timeset[0].second = startDate.format('s');
						}
						
						var oneYear = new Date();
						oneYear.setFullYear(oneYear.getFullYear() + 1);

						var dates = rule.between(new Date(), oneYear, true, limitFunction);
						//console.log(dates);
						for (var d in dates) {
							startDate = moment(new Date(dates[d]));
							newEvents.push({
								title: event.summary,
								startDate: startDate.format('x')
							});
						}
					} else {
						// Single event.

						var today = moment().startOf('day');
						if (startDate > today) {
							newEvents.push({
								title: event.summary,
								startDate: startDate.format('x')
							});
						}
					}
				}
			}

			newEvents.sort(function(a,b) {
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
		if (events.length <= 0) {
			//console.log('No events to broadcast yet.');
			return;
		}
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

module.exports = NodeHelper.create({
	// Override start method.
	start: function() {
		var self = this;
		var events = [];

		this.fetchers = [];

		console.log('Starting node helper for: ' + this.name);

		
	},

	// Override socketNotificationReceived method.
	socketNotificationReceived: function(notification, payload) {
		if (notification === 'ADD_CALENDAR') {
			//console.log('ADD_CALENDAR: ');
			this.createFetcher(payload.url, payload.fetchInterval, payload.maximumEntries);
		}
	},

	/* createFetcher(url, reloadInterval)
	 * Creates a fetcher for a new url if it doesn't exsist yet.
	 * Otherwise it reuses the exsisting one.
	 *
	 * attribute url string - URL of the news feed.
	 * attribute reloadInterval number - Reload interval in milliseconds.
	 */

	createFetcher: function(url, fetchInterval, maximumEntries) {
		var self = this;

		if (!validUrl.isUri(url)){
			self.sendSocketNotification('INCORRECT_URL', {url:url});
			return;
		}

		var fetcher;
		if (typeof self.fetchers[url] === 'undefined') {
			console.log('Create new calendar fetcher for url: ' + url + ' - Interval: ' + fetchInterval);
			fetcher = new CalendarFetcher(url, fetchInterval, maximumEntries);
			
			fetcher.onReceive(function(fetcher) {
				//console.log('Broadcast events.');
				//console.log(fetcher.events());

				self.sendSocketNotification('CALENDAR_EVENTS', {
					url: fetcher.url(),
					events: fetcher.events()
				});
			});

			fetcher.onError(function(fetcher, error) {
				self.sendSocketNotification('FETCH_ERROR', {
					url: fetcher.url(),
					error: error
				});
			});

			self.fetchers[url] = fetcher;
		} else {
			//console.log('Use exsisting news fetcher for url: ' + url);
			fetcher = self.fetchers[url];
			fetcher.broadcastEvents();
		}

		fetcher.startFetch();
	}
});

