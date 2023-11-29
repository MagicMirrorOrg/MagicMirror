let config = {
	modules: [
		{
			module: "weather",
			position: "bottom_bar",
			config: {
				location: "Munich",
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
