let config = require(`${process.cwd()}/tests/configs/default.js`).configFactory({
	ipWhitelist: [],
	port: 8282
});

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
