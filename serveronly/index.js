require("../js/alias-resolver");

const Log = require("../js/logger");
const { getServerPort } = require("#server_functions");


const startServer = async () => {
	const { default: app } = await import("../js/app.mjs");
	const config = await app.start();
	const bindAddress = config.address ? config.address : "localhost";
	const httpType = config.useHttps ? "https" : "http";
	Log.info(`\n>>>   Ready to go! Please point your browser to: ${httpType}://${bindAddress}:${getServerPort(config)}   <<<`);
};

startServer();
