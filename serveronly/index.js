const Log = require("logger");
const app = require("../js/app");

app.start().then((config) => {
	const bindAddress = config.address ? config.address : "localhost";
	const httpType = config.useHttps ? "https" : "http";
	Log.log(`\nReady to go! Please point your browser to: ${httpType}://${bindAddress}:${config.port}`);
});
