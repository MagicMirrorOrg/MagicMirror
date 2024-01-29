let config = {
	units: "imperial",

	modules: [
		{
			module: "weather",
			position: "bottom_bar",
			config: {
				location: "Munich",
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
