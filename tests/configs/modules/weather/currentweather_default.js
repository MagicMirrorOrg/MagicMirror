let config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	timeFormat: 12,

	modules: [
		{
			module: "weather",
			position: "bottom_bar",
			config: {
				location: "Munich",
				showHumidity: "feelslike",
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
