import app from "../js/app";

const Log = require("../js/logger");

app.start().then((config: any) => {
	const bindAddress = config.address ? config.address : "localhost";
	const httpType = config.useHttps ? "https" : "http";
	Log.info(`\n>>>   Ready to go! Please point your browser to: ${httpType}://${bindAddress}:${(global as any).mmPort || config.port}   <<<`);
});

export {};
