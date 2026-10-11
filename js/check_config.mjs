import "./alias-resolver.js";
import Log from "./logger.js";
import Utils from "./utils.js";

try {
	Utils.checkConfigFile();
} catch (error) {
	if (error instanceof Utils.ConfigError) {
		Log.error(error.message);
	} else {
		const message = error?.message ?? error;
		Log.error(`Unexpected error: ${message}`);
	}
	process.exit(1);
}
