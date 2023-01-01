const helpers = require("./helpers/global-setup");

describe("Check configuration without modules", () => {
	beforeAll(async () => {
		await helpers.startApplication("tests/configs/without_modules.js");
		await helpers.getDocument();
	});
	afterAll(async () => {
		await helpers.stopApplication();
	});

	it("Show the message MagicMirror² title", async () => {
		const elem = await helpers.waitForElement("#module_1_helloworld .module-content");
		expect(elem).not.toBe(null);
		expect(elem.textContent).toContain("MagicMirror²");
	});

	it("Show the url of michael's website", async () => {
		const elem = await helpers.waitForElement("#module_5_helloworld .module-content");
		expect(elem).not.toBe(null);
		expect(elem.textContent).toContain("www.michaelteeuw.nl");
	});
});
