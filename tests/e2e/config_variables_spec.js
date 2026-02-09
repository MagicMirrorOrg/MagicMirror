const helpers = require("./helpers/global-setup");

describe("config with variables and secrets", () => {
	beforeAll(async () => {
		await helpers.startApplication("tests/configs/config_variables.js");
	});

	afterAll(async () => {
		await helpers.stopApplication();
	});

	it("config.language should be \"de\"", async () => {
		expect(config.language).toBe("de");
	});

	it("config.loglevel should be [\"ERROR\", \"LOG\", \"WARN\", \"INFO\"]", async () => {
		expect(config.logLevel).toStrictEqual(["ERROR", "LOG", "WARN", "INFO"]);
	});

	it("config.ipWhitelist should be [\"::ffff:127.0.0.1\", \"::1\", \"127.0.0.1\"]", async () => {
		expect(config.ipWhitelist).toStrictEqual(["::ffff:127.0.0.1", "::1", "127.0.0.1"]);
	});

	it("config.timeFormat should be 12", async () => {
		expect(config.timeFormat).toBe(12); // default is 24
	});

	it("/config endpoint should show redacted secrets", async () => {
		const res = await fetch(`http://localhost:${config.port}/config`);
		expect(res.status).toBe(200);
		const cfg = await res.json();
		expect(cfg.ipWhitelist).toStrictEqual(["**SECRET_IP2**", "::**SECRET_IP3**", "**SECRET_IP1**"]);
	});
});
