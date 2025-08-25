let config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	modules: [
		{
			module: "compliments",
			position: "top_bar",
			config: {
				compliments: {
					snow: ["snow"]
				},
				updateInterval: 3000
			}
		},
		{
			module: "weather",
			position: "bottom_bar",
			config: {
				location: "Munich",
				weatherProvider: "openweathermap",
				weatherEndpoint: "/weather",
				mockData: '"#####WEATHERDATA#####"'
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
