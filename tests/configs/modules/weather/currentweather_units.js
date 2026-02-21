let config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	units: "imperial",

	modules: [
		{
			module: "weather",
			position: "bottom_bar",
			config: {
				lat: 48.14,
				lon: 11.58,
				weatherProvider: "openweathermap",
				apiKey: "test-api-key",
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
