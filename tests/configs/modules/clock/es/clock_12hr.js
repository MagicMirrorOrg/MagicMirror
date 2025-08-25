let config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	language: "es",
	timeFormat: 12,

	modules: [
		{
			module: "clock",
			position: "middle_center"
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
