import app from "../js/app";

// eslint-disable-next-line @typescript-eslint/no-require-imports -- dual-world browser script (logger); no static TS export
const Log = require("../js/logger");

app.start().then((config: any) => {
	const bindAddress = config.address ? config.address : "localhost";
	const httpType = config.useHttps ? "https" : "http";
	Log.info(`\n>>>   Ready to go! Please point your browser to: ${httpType}://${bindAddress}:${(global as any).mmPort || config.port}   <<<`);
});

export {};
