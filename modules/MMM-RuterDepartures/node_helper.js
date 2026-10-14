const NodeHelper = require("node_helper");

const ENTUR_URL = "https://api.entur.io/journey-planner/v3/graphql";
const CLIENT_NAME = "nrkno-magicmirror";

module.exports = NodeHelper.create({
	start() {
		this.timers = {};
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "RUTER_GET_DEPARTURES") {
			clearTimeout(this.timers[payload.identifier]);
			this.run(payload);
		}
	},

	async run(config) {
		const { lat, lon, maxStops, excludeStops = [], maxDepartures, updateInterval, identifier } = config;

		try {
			const allStops = await this.fetchNearbyStops(lat, lon, maxStops);
			const stops = allStops.filter(
				(s) => !excludeStops.some((ex) => s.name.toLowerCase().includes(ex.toLowerCase()))
			);
			const stopsWithDepartures = stops.length
				? await this.fetchDepartures(stops, maxDepartures)
				: [];
			this.sendSocketNotification("RUTER_DEPARTURES", { identifier, stops: stopsWithDepartures });
		} catch (err) {
			console.error("[MMM-RuterDepartures]", err.message);
		}

		this.timers[identifier] = setTimeout(() => this.run(config), updateInterval);
	},

	async fetchNearbyStops(lat, lon, maxStops) {
		const query = `{
			nearest(
				latitude: ${lat}
				longitude: ${lon}
				maximumDistance: 500
				maximumResults: ${maxStops}
				filterByPlaceTypes: [stopPlace]
			) {
				edges {
					node {
						place {
							... on StopPlace {
								id
								name
							}
						}
					}
				}
			}
		}`;

		const data = await this.graphql(query);
		return data.data.nearest.edges.map((e) => e.node.place);
	},

	async fetchDepartures(stops, maxDepartures) {
		// Busy hubs like Majorstuen have many lines departing within minutes, so a
		// small fetch count combined with a walk-time filter drops everything.
		// Fetch a generous pool so the window reaches well past typical walk times.
		const fetchCount = Math.max(maxDepartures * 15, 50);
		const fields = stops
			.map(
				(stop, i) => `
			stop${i}: stopPlace(id: "${stop.id}") {
				name
				estimatedCalls(timeRange: 72100, numberOfDepartures: ${fetchCount}) {
					realtime
					expectedDepartureTime
					cancellation
					destinationDisplay { frontText }
					serviceJourney {
						journeyPattern {
							line {
								publicCode
								transportMode
							}
						}
					}
				}
			}`
			)
			.join("\n");

		const data = await this.graphql(`{ ${fields} }`);

		return stops.map((stop, i) => {
			const s = data.data[`stop${i}`];
			const departures = (s ? s.estimatedCalls : [])
				.filter((c) => !c.cancellation)
				.map((c) => ({
					line: c.serviceJourney.journeyPattern.line.publicCode,
					mode: c.serviceJourney.journeyPattern.line.transportMode,
					destination: c.destinationDisplay.frontText,
					expectedTime: c.expectedDepartureTime,
					realtime: c.realtime,
				}))
				.sort((a, b) => new Date(a.expectedTime) - new Date(b.expectedTime));
			return { name: s ? s.name : stop.name, departures };
		});
	},

	async graphql(query) {
		const res = await fetch(ENTUR_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"ET-Client-Name": CLIENT_NAME,
			},
			body: JSON.stringify({ query }),
		});
		return res.json();
	},
});
