let config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	units: "imperial",

	modules: [
		{
			module: "weather",
			position: "bottom_bar",
			config: {
				location: "Munich",
				weatherProvider: "openweathermap",
				weatherEndpoint: "/weather",
				mockData: '"#####WEATHERDATA#####"',
				decimalSymbol: ",",
				showHumidity: "wind"
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
