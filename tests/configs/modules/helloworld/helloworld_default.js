let config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	modules: [
		{
			module: "helloworld",
			position: "bottom_bar"
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
