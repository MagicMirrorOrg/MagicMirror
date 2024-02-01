let config = {
	language: "es",
	timeFormat: 12,

	modules: [
		{
			module: "clock",
			position: "middle_center",
			config: {
				showWeek: true
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
