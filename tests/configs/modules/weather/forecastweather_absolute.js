let config = {
	timeFormat: 12,

	modules: [
		{
			module: "weather",
			position: "bottom_bar",
			config: {
				type: "forecast",
				location: "Munich",
				mockData: '"#####WEATHERDATA#####"',
				weatherEndpoint: "/forecast/daily",
				absoluteDates: true
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
