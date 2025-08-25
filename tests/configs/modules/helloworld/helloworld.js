let config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	modules: [
		{
			module: "helloworld",
			position: "bottom_bar",
			config: {
				text: "Test HelloWorld Module"
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
