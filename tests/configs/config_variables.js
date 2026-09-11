const config = require(`${process.cwd()}/tests/configs/default.js`).configFactory({
	language: "${MM_LANGUAGE}",
	logLevel: ["${MM_LOG_ERROR}", "LOG", "WARN", "${MM_LOG_INFO}"],
	timeFormat: ${MM_TIME_FORMAT},
	hideConfigSecrets: true,
	ipWhitelist: ["${SECRET_IP2}", "::${SECRET_IP3}", "${SECRET_IP1}", "192.168.0.0/16", "172.16.0.0/12"],
	address: "0.0.0.0",

	modules: [
		{
			module: "calendar",
			position: "top_left",
			config: {
				calendars: [
					{
						name: "Cal1",
						url: "${SECRET_CAL_URL1}"
					}
				]
			}
		},
		{
			module: "calendar",
			position: "top_right",
			config: {
				calendars: [
					{
						name: "Cal2",
						url: "${SECRET_CAL_URL2}"
					}
				]
			}
		}
	]
});

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
