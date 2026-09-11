const { expect } = require("playwright/test");
const helpers = require("./helpers/global-setup");

describe("config with variables and secrets", () => {
	beforeAll(async () => {
		await helpers.startApplication("tests/configs/config_variables.js");
	});

	afterAll(async () => {
		await helpers.stopApplication();
	});

	it("config.language should be \"de\"", () => {
		expect(global.config.language).toBe("de");
	});

	it("config.loglevel should be [\"ERROR\", \"LOG\", \"WARN\", \"INFO\"]", () => {
		expect(global.config.logLevel).toStrictEqual(["ERROR", "LOG", "WARN", "INFO"]);
	});

	it("config.ipWhitelist should be [\"::ffff:127.0.0.1\", \"::1\", \"127.0.0.1\", \"192.168.0.0/16\", \"172.16.0.0/12\"]", () => {
		expect(global.config.ipWhitelist).toStrictEqual(["::ffff:127.0.0.1", "::1", "127.0.0.1", "192.168.0.0/16", "172.16.0.0/12"]);
	});

	it("config.timeFormat should be 12", () => {
		expect(global.config.timeFormat).toBe(12); // default is 24
	});

	it("/config endpoint should show redacted secrets", async () => {
		const res = await fetch(`http://localhost:${global.config.port}/config`);
		expect(res.status).toBe(200);
		const cfg = await res.json();
		expect(cfg.ipWhitelist).toStrictEqual(["**SECRET_IP2**", "::**SECRET_IP3**", "**SECRET_IP1**", "192.168.0.0/16", "172.16.0.0/12"]);
	});

	it("/config/config.env should deliver 404", async () => {
		const res = await fetch(`http://localhost:${global.config.port}/config/config.env`);
		expect(res.status).toBe(404);
	});

	it("/config/config.js should deliver 404", async () => {
		const res = await fetch(`http://localhost:${global.config.port}/config/config.js`);
		expect(res.status).toBe(404);
	});

	it("/config/basepath.js should deliver 200", async () => {
		const res = await fetch(`http://localhost:${global.config.port}/config/basepath.js`);
		expect(res.status).toBe(200);
	});
});

describe("calendar with secrets", () => {
	let page;

	beforeAll(async () => {
		await helpers.startApplication("tests/configs/config_variables.js");
		await helpers.getDocument();
		page = helpers.getPage();
	});

	afterAll(async () => {
		await helpers.stopApplication();
	});

	it("should have the default of 4 entries in both calendars (see issue #4264)", async () => {
		const locator = page.locator(".calendar .event");
		await expect(locator).toHaveCount(8);
	});

});
