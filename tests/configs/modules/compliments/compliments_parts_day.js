let config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	timeFormat: 12,

	modules: [
		{
			module: "compliments",
			position: "middle_center",
			config: {
				updateInterval: 1000,
				compliments: {
					morning: ["Hi", "Good Morning", "Morning test"],
					afternoon: ["Hello", "Good Afternoon", "Afternoon test"],
					evening: ["Hello There", "Good Evening", "Evening test"]
				}
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
