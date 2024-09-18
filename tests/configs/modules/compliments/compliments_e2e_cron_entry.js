let config = {
	modules: [
		{
			module: "compliments",
			position: "middle_center",
			config: {
				specialDayUnique: true,
				compliments: {
					anytime: ["just a test"],
					"* * * * *": ["anytime cron"]
				}
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") { module.exports = config; }
