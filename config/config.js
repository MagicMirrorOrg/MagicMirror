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
			module: "MMM-PortraitBoard",
			position: "fullscreen_above",
			config: {
				timezone: "Europe/Oslo",
				homeHour: 14,
				homeMinute: 30,
				walkMinutes: { Marienlyst: 5, Majorstuen: 10 }
			}
		},
		{
			module: "calendar",
			// Data source only. Add the shared Google Calendar's public/private iCal URL when available.
			config: {
				calendars: []
			}
		},
		{
			module: "MMM-RuterDepartures",
			// Data source only. The portrait module renders the departures.
			config: {
				lat: 59.932267,
				lon: 10.724083,
				maxStops: 3,
				maxDepartures: 16,
				updateInterval: 30 * 1000,
				excludeStops: ["Vestre Aker kirke"],
				walkMinutes: { Marienlyst: 5, Majorstuen: 10 }
			}
		},
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") { module.exports = config; }
