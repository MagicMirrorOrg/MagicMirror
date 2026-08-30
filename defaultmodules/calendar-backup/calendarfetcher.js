const https = require("node:https");
const ical = require("node-ical");
const Log = require("logger");
const NodeHelper = require("node_helper");
const CalendarFetcherUtils = require("./calendarfetcherutils");
const { getUserAgent } = require("#server_functions");
const { scheduleTimer } = require("#module_functions");

/**
 *
 * @param {string} url The url of the calendar to fetch
 * @param {number} reloadInterval Time in ms the calendar is fetched again
 * @param {string[]} excludedEvents An array of words / phrases from event titles that will be excluded from being shown.
 * @param {number} maximumEntries The maximum number of events fetched.
 * @param {number} maximumNumberOfDays The maximum number of days an event should be in the future.
 * @param {object} auth The object containing options for authentication against the calendar.
 * @param {boolean} includePastEvents If true events from the past maximumNumberOfDays will be fetched too
 * @param {boolean} selfSignedCert If true, the server certificate is not verified against the list of supplied CAs.
 * @class
 */
const CalendarFetcher = function (url, reloadInterval, excludedEvents, maximumEntries, maximumNumberOfDays, auth, includePastEvents, selfSignedCert) {
	let reloadTimer = null;
	let events = [];

	let fetchFailedCallback = function () {};
	let eventsReceivedCallback = function () {};

	/**
	 * Initiates calendar fetch.
	 */
	const fetchCalendar = () => {
		clearTimeout(reloadTimer);
		reloadTimer = null;
		let httpsAgent = null;
		let headers = {
			"User-Agent": getUserAgent()
		};

		if (selfSignedCert) {
			httpsAgent = new https.Agent({
				rejectUnauthorized: false
			});
		}
		if (auth) {
			if (auth.method === "bearer") {
				headers.Authorization = `Bearer ${auth.pass}`;
			} else {
				headers.Authorization = `Basic ${Buffer.from(`${auth.user}:${auth.pass}`).toString("base64")}`;
			}
		}

		fetch(url, { headers: headers, agent: httpsAgent })
			.then(NodeHelper.checkFetchStatus)
			.then((response) => response.text())
			.then((responseData) => {
				let data = [];

				try {
					data = ical.parseICS(responseData);
					Log.debug(`parsed data=${JSON.stringify(data, null, 2)}`);
					events = CalendarFetcherUtils.filterEvents(data, {
						excludedEvents,
						includePastEvents,
						maximumEntries,
						maximumNumberOfDays
					});
				} catch (error) {
					fetchFailedCallback(this, error);
					scheduleTimer(reloadTimer, reloadInterval, fetchCalendar);
					return;
				}
				this.broadcastEvents();
				scheduleTimer(reloadTimer, reloadInterval, fetchCalendar);
			})
			.catch((error) => {
				fetchFailedCallback(this, error);
				scheduleTimer(reloadTimer, reloadInterval, fetchCalendar);
			});
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
		Log.info(`Calendar-Fetcher: Broadcasting ${events.length} events from ${url}.`);
		eventsReceivedCallback(this);
	};

	/**
	 * Sets the on success callback
	 * @param {eventsReceivedCallback} callback The on success callback.
	 */
	this.onReceive = function (callback) {
		eventsReceivedCallback = callback;
	};

	/**
	 * Sets the on error callback
	 * @param {fetchFailedCallback} callback The on error callback.
	 */
	this.onError = function (callback) {
		fetchFailedCallback = callback;
	};

	/**
	 * Returns the url of this fetcher.
	 * @returns {string} The url of this fetcher.
	 */
	this.url = function () {
		return url;
	};

	/**
	 * Returns current available events for this fetcher.
	 * @returns {object[]} The current available events for this fetcher.
	 */
	this.events = function () {
		return events;
	};
};

module.exports = CalendarFetcher;
