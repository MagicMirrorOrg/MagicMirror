var app = require("../js/app.js");
app.start(function(config) {
	console.log("");
	var bindAddress = config.address ? config.address : "localhost";
	console.log("Ready to go! Please point your browser to: http://" + bindAddress + ":" + config.port);
});
