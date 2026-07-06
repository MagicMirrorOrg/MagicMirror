const app = require("../js/app");
const Log = require("../js/logger");
const { getServerPort } = require("#server_functions");

app.start().then((config) => {
	const bindAddress = config.address ? config.address : "localhost";
	const httpType = config.useHttps ? "https" : "http";
	Log.info(`\n>>>   Ready to go! Please point your browser to: ${httpType}://${bindAddress}:${getServerPort(config)}   <<<`);
});
