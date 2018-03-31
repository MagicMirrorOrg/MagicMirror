/* Magic Mirror
 * Module: mmm-mtatracker
 *
 * By mchlljy
 * MIT Licensed
 */

const request = require("request");
const rp = require('request-promise');
const async = require('async');
const GtfsRealtimeBinding = require("gtfs-realtime-bindings");
const fs = require("fs");
const NodeHelper = require("node_helper");
const date = require('date-and-time');

module.exports = NodeHelper.create({

	start: function () {
		console.log("Starting node helper for ", this.name);
	},

	getParams: function (key, feedId) {
		let params = `http://datamine.mta.info/mta_esi.php?key=${key}&feed_id=${feedId}`;
		return params;
	},

	socketNotificationReceived: function (notification, payload) {

		if (notification === "CONFIG") {
			const {
				trains,
				stopIds,
				apiKey
			} = payload;

			this.STOP_IDS = stopIds; // set global
			const urls = [];
			Object.keys(trains).forEach(train => {
				const mtaURL = this.getParams(apiKey, trains[train].code);
				urls.push(mtaURL);
			});

			this.getData(urls);
		}
	},

	getData: function (urls) {
		let departureTimes = [];

		async.forEachOf(urls, (url, index, callback) => {
			const requestOptions = {
				method: "GET",
				url: url,
				encoding: null,
			};

			rp(requestOptions).then((body) => {
				const FeedMessage = GtfsRealtimeBinding.FeedMessage;
				const feed = FeedMessage.decode(body);
				const currentTime = new Date(Date.now());
				this.STOP_IDS.forEach(stop => {
					feed.entity.forEach(entity => {
						if (entity.trip_update) {
							entity.trip_update.stop_time_update.forEach(update => {
								
								if (update.stop_id === stop) {
									const arrivalTime = update.arrival.time.low*1000;
									const departureTime = update.departure.time.low*1000;
									const time = arrivalTime <= 0 ? arrivalTime : departureTime;
									const departureDiffInMin = date.subtract(new Date(time), currentTime).toMinutes();
									
									if (departureDiffInMin <= 30) {
										departureTimes.push({
											stop,
											departureTime: departureDiffInMin,
										});
									}
								}
							});
						}
					});
				});
				// process result
				callback();
			})
			.catch(err => {
				console.log('there was an error: ', err);
			});


		}, err => {
			if (err) console.error(err.message);
			let filteredKeys = new Set;
			departureTimes = departureTimes.sort();
			let finalDepartures = departureTimes.filter((obj) => {
					const key = obj.stop;
					const isNew = !filteredKeys.has(key);
					if (isNew) filteredKeys.add(key);
					return isNew;
			});

			this.sendSocketNotification('ON_DEPARTURE_TIME', finalDepartures)
		});	
	},
});

