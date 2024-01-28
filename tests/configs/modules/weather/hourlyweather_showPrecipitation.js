let config = {
	timeFormat: 12,

	modules: [
		{
			module: "weather",
			position: "bottom_bar",
			config: {
				type: "hourly",
				location: "Berlin",
				mockData: '"#####WEATHERDATA#####"',
				showPrecipitationAmount: true,
				showPrecipitationProbability: true
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
