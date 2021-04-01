const app = require("../js/app.js");
const Log = require("logger");

app.start(function (config) {
	var bindAddress = config.address ? config.address : "localhost";
	var httpType = config.useHttps ? "https" : "http";
	Log.log("\nReady to go! Please point your browser to: " + httpType + "://" + bindAddress + ":" + config.port);
});
