var app = require("../js/app.js");
app.start(function(config) {
	var bindAddress = config.address ? config.address : "localhost";
	console.log("\nReady to go! Please point your browser to: http://" + bindAddress + ":" + config.port);
});
