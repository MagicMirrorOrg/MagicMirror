/* Magic Mirror
 * Node Helper: Calendar - CalendarFetcher
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var moment = require("moment");
const request = require("request");
//"https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/Taipei?$filter=StopName%2FZh_tw%20eq%20'%E5%85%89%E8%8F%AF%E5%95%86%E5%A0%B4'&$top=30&$format=JSON"
var BusFetcher = function (url, reloadInterval = 10) {
	var self = this;

	var reloadTimer = null;
	var events = [];

	var fetchFailedCallback = function () {};
	var eventsReceivedCallback = function () {};

	/* fetchCalendar()
	 * Initiates calendar fetch.
	 */
	var fetchBusInfo = function () {
		clearTimeout(reloadTimer);
		reloadTimer = null;
		nodeVersion = Number(process.version.match(/^v(\d+\.\d+)/)[1]);
		request.get({
			url: url,
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36",
				"Content-Type": "application/x-www-form-urlencoded",
				"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
				"X-Compress": "null",
			}
		}, (err, res, body) => {
			//console.log("A")
			jsonData = JSON.parse(body)
			var cutData = []
			for (var i in jsonData) {
				if (jsonData[i].EstimateTime) {
					cutData.push(jsonData[i])
				}
			}
			cutData.sort([(a, b) => {
				if (!a.EstimateTime) {
					return 1;
				}
				if (!b.EstimateTime) {
					return 0;
				}
				return a.EstimateTime < b.EstimateTime
			}])
			events = cutData.slice(0, 5)
			self.broadcastEvents();
		})
		scheduleTimer()
	};

	/* scheduleTimer()
	 * Schedule the timer for the next update.
	 */
	var scheduleTimer = function () {
		//console.log('Schedule update timer.');
		clearTimeout(reloadTimer);
		reloadTimer = setTimeout(function () {
			fetchBusInfo();
		}, reloadInterval);
	};

	/* public methods */

	/* startFetch()
	 * Initiate fetchCalendar();
	 */
	this.startFetch = function () {
		fetchBusInfo();
	};

	/* broadcastItems()
	 * Broadcast the existing events.
	 */
	this.broadcastEvents = function () {
		//console.log('Broadcasting ' + events.length + ' events.');
		eventsReceivedCallback(self);
	};

	/* onReceive(callback)
	 * Sets the on success callback
	 *
	 * argument callback function - The on success callback.
	 */
	this.onReceive = function (callback) {
		eventsReceivedCallback = callback;
	};

	/* onError(callback)
	 * Sets the on error callback
	 *
	 * argument callback function - The on error callback.
	 */
	this.onError = function (callback) {
		fetchFailedCallback = callback;
	};

	/* url()
	 * Returns the url of this fetcher.
	 *
	 * return string - The url of this fetcher.
	 */
	this.url = function () {
		return url;
	};

	/* events()
	 * Returns current available events for this fetcher.
	 *
	 * return array - The current available events for this fetcher.
	 */
	this.events = function () {
		return events;
	};

};


module.exports = BusFetcher;