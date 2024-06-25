let config = {
	modules: [
		{
			module: "compliments",
			position: "middle_center",
			config: {
				updateInterval: 1000 * 5, // Update every 5 secs
				specialDayUnique: true,
				compliments: {
					anytime: ["just a test"],
					"00-10 16-19 * * fri": ["just pub time"]
				}
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") { module.exports = config; }
