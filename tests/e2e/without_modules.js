const helpers = require("./global-setup");

describe("Check configuration without modules", () => {
	beforeAll((done) => {
		helpers.startApplication("tests/configs/without_modules.js");
		helpers.getDocument(done);
	});
	afterAll(async () => {
		await helpers.stopApplication();
	});

	it("Show the message MagicMirror² title", (done) => {
		helpers.waitForElement("#module_1_helloworld .module-content").then((elem) => {
			done();
			expect(elem).not.toBe(null);
			expect(elem.textContent).toContain("MagicMirror²");
		});
	});

	it("Show the text Michael's website", (done) => {
		helpers.waitForElement("#module_5_helloworld .module-content").then((elem) => {
			done();
			expect(elem).not.toBe(null);
			expect(elem.textContent).toContain("www.michaelteeuw.nl");
		});
	});
});
