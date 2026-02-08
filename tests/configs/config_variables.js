let config = require(`${process.cwd()}/tests/configs/default.js`).configFactory({
	language: "${MM_LANGUAGE}",
	logLevel: ["${MM_LOG_INFO}", "LOG", "WARN", "${MM_LOG_ERROR}"], // Add "DEBUG" for even more logging
	timeFormat: ${MM_TIME_FORMAT},
	hideConfigSecrets: true,
	ipWhitelist: ["${SECRET_IP1}", "${SECRET_IP2}", "::${SECRET_IP3}"]
});

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
