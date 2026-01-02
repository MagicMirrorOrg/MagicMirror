const mmVersion = require("../package").version;
const { logSystemInformation } = require("./utils");

logSystemInformation(`v${mmVersion}`);
