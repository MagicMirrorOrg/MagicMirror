let config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	modules: [
		{
			module: "alert",
			config: {
				display_time: 1000000,
				welcome_message: "Custom welcome message!"
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
