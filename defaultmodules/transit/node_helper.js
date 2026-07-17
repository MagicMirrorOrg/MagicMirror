const NodeHelper = require("node_helper");
const Log = require("logger");
const { fetch } = require("undici");
const GtfsRealtimeBindings = require("gtfs-realtime-bindings");

const FEED_URL = "https://gtfs.halifax.ca/realtime/TripUpdate/TripUpdates.pb";

module.exports = NodeHelper.create({
	start () {
		Log.log(`Starting node helper for: ${this.name}`);
		this.config = null;
		this.timer = null;
	},

	stop () {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	},

	socketNotificationReceived (notification, payload) {
		if (notification === "CONFIG") {
			this.config = payload;
			this.startFetching();
		}
	},

	startFetching () {
		this.fetchArrivals();
	},

	async fetchArrivals () {
		try {
			const response = await fetch(FEED_URL);
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			const buffer = Buffer.from(await response.arrayBuffer());
			const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer);

			const now = Date.now() / 1000;
			const arrivals = [];

			for (const entity of feed.entity) {
				const tripUpdate = entity.tripUpdate;
				if (!tripUpdate) continue;

				const routeId = tripUpdate.trip && tripUpdate.trip.routeId;
				if (!routeId || !this.config.routes.includes(routeId)) continue;

				for (const stu of tripUpdate.stopTimeUpdate) {
					if (stu.stopId !== this.config.stopId) continue;

					const departureTime = stu.departure && stu.departure.time
						? Number(stu.departure.time)
						: stu.arrival && stu.arrival.time
							? Number(stu.arrival.time)
							: null;

					if (departureTime === null) continue;

					const minutesAway = Math.round((departureTime - now) / 60);
					if (minutesAway < 0) continue;

					arrivals.push({ route: routeId, minutesAway });
					break; // only first matching stop per trip
				}
			}

			arrivals.sort((a, b) => a.minutesAway - b.minutesAway);
			const top = arrivals.slice(0, this.config.maxArrivals);

			this.sendSocketNotification("TRANSIT_DATA", { arrivals: top });
			Log.log(`Transit: sent ${top.length} arrivals`);
		} catch (err) {
			Log.error("Transit: fetch/parse error:", err.message);
			this.sendSocketNotification("TRANSIT_DATA", { arrivals: [] });
		}

		this.timer = setTimeout(() => this.fetchArrivals(), this.config.updateInterval);
	}
});
