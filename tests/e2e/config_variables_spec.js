const defaults = require("../../js/defaults");
const helpers = require("./helpers/global-setup");

describe("config with variables and secrets", () => {
	beforeAll(async () => {
		await helpers.startApplication("tests/configs/config_variables.js");
	});

	it("config.language should be \"de\"", async () => {
		expect(config.language).toBe("de");
	});

	it("config.loglevel should be default", async () => {
		expect(config.logLevel).toStrictEqual(defaults.logLevel);
	});

	it("config.ipWhitelist should be default", async () => {
		expect(config.ipWhitelist).toStrictEqual(defaults.ipWhitelist);
	});

	it("/config endpoint should show redacted secrets", async () => {
		const res = await fetch(`http://localhost:${config.port}/config`);
		expect(res.status).toBe(200);
		const cfg = await res.json();
		expect(cfg.ipWhitelist).toStrictEqual(["**SECRET_IP1**", "**SECRET_IP2**", "::**SECRET_IP3**"]);
	});
});
