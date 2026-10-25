const config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	foreignModulesDir: "tests/mocks",
	modules: [
		{
			module: "esmHelper",
			position: "bottom_bar"
		},
		{
			module: "calendar",
			position: "bottom_bar",
			config: {
				calendars: []
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
