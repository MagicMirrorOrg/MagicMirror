let config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	modules: [
		{
			module: "weather",
			position: "bottom_bar",
			config: {
				location: "Munich",
				weatherProvider: "openweathermap",
				weatherEndpoint: "/weather",
				mockData: '"#####WEATHERDATA#####"',
				windUnits: "beaufort",
				showWindDirectionAsArrow: true,
				showSun: false,
				showHumidity: "wind",
				roundTemp: true,
				degreeLabel: true
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
