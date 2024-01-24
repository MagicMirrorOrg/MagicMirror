let config = {
	modules: [
		{
			module: "compliments",
			position: "lower_third",
			animateIn: "foo",
			animateOut: "bar",
			config: {
				compliments: {
					anytime: ["AnimateCSS Testing..."]
				},
				updateInterval: 2000,
				fadeSpeed: 1000
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
