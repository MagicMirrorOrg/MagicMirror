let config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	modules: [
		{
			module: "compliments",
			position: "middle_center",
			config: {
				specialDayUnique: false,
				compliments: {
					anytime: [
						"Typical message 1",
						"Typical message 2",
						"Typical message 3"
					],
					"....-..-..": ["Special day message"]
				}
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") { module.exports = config; }
