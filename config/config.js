let config = {
	address: "localhost",
	port: 8080,
	basePath: "/",
	ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"],

	useHttps: false,
	httpsPrivateKey: "",
	httpsCertificate: "",

	language: "nb",
	locale: "nb-NO",

	logLevel: ["INFO", "LOG", "WARN", "ERROR"],
	timeFormat: 24,
	units: "metric",

	modules: [
		{
			module: "alert",
		},
		{
			module: "updatenotification",
			position: "top_bar"
		},
		{
			module: "clock",
			position: "top_left",
			config: {
				timezone: "Europe/Oslo"
			}
		},
		{
			module: "calendar",
			header: "Norske helligdager",
			position: "top_left",
			config: {
				calendars: [
					{
						fetchInterval: 7 * 24 * 60 * 60 * 1000,
						symbol: "calendar-check",
						url: "https://calendar.google.com/calendar/ical/nb.norwegian%23holiday%40group.v.calendar.google.com/public/basic.ics"
					}
				]
			}
		},
		{
			module: "weather",
			position: "top_right",
			config: {
				weatherProvider: "openmeteo",
				type: "current",
				lat: 59.9139,
				lon: 10.7522
			}
		},
		{
			module: "weather",
			position: "top_right",
			header: "Værmelding",
			config: {
				weatherProvider: "openmeteo",
				type: "forecast",
				lat: 59.9139,
				lon: 10.7522
			}
		},
		{
			module: "MMM-YrMeteogram",
			position: "bottom_center",
			config: {
				locationId: "1-72837",
				lang: "nb",
				width: "700px",
			}
		},
		{
			module: "MMM-RuterDepartures",
			position: "top_right",
			header: "Avganger Marienlyst / Majorstuen",
			config: {
				lat: 59.932267,
				lon: 10.724083,
				maxStops: 3,
				maxDepartures: 4,
				updateInterval: 30 * 1000,
				excludeStops: ["Vestre Aker kirke"],
				walkMinutes: {
					"Marienlyst": 5,
					"Majorstuen": 10,
				},
			}
		},
		{
			module: "newsfeed",
			position: "bottom_bar",
			config: {
				feeds: [
					{
						title: "NRK Nyheter",
						url: "https://www.nrk.no/toppsaker.rss"
					}
				],
				showSourceTitle: true,
				showPublishDate: true,
				broadcastNewsFeeds: true,
				broadcastNewsUpdates: true
			}
		},
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") { module.exports = config; }
