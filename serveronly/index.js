var app = require("../js/app.js");
app.start(function(config) {
	var bindAddress = config.address ? config.address : "localhost";
	var httpType = config.useHttps ? "https" : "http";
	console.log("\nReady to go! Please point your browser to: " + httpType + "://" + bindAddress + ":" + config.port);
});
