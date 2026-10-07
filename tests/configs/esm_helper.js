const config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	foreignModulesDir: "tests/mocks",
	modules: [
		{
			module: "esmHelper",
			position: "bottom_bar"
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
