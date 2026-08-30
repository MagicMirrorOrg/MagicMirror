let config = require(`${process.cwd()}/tests/configs/default.js`).configFactory({
	language: "${MM_LANGUAGE}",
	logLevel: ["${MM_LOG_ERROR}", "LOG", "WARN", "${MM_LOG_INFO}"],
	timeFormat: ${MM_TIME_FORMAT},
	hideConfigSecrets: true,
	ipWhitelist: ["${SECRET_IP2}", "::${SECRET_IP3}", "${SECRET_IP1}"]
});

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
