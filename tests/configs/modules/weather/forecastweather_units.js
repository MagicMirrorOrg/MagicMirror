let config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	units: "imperial",

	modules: [
		{
			module: "weather",
			position: "bottom_bar",
			config: {
				type: "forecast",
				location: "Munich",
				weatherProvider: "openweathermap",
				weatherEndpoint: "/forecast/daily",
				mockData: '"#####WEATHERDATA#####"',
				decimalSymbol: "_",
				showPrecipitationAmount: true
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
