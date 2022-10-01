const helpers = require("../global-setup");

describe("Test helloworld module", () => {
	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("helloworld set config text", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/helloworld/helloworld.js");
			helpers.getDocument(done);
		});

		it("Test message helloworld module", (done) => {
			helpers.waitForElement(".helloworld").then((elem) => {
				done();
				expect(elem).not.toBe(null);
				expect(elem.textContent).toContain("Test HelloWorld Module");
			});
		});
	});

	describe("helloworld default config text", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/helloworld/helloworld_default.js");
			helpers.getDocument(done);
		});

		it("Test message helloworld module", (done) => {
			helpers.waitForElement(".helloworld").then((elem) => {
				done();
				expect(elem).not.toBe(null);
				expect(elem.textContent).toContain("Hello World!");
			});
		});
	});
});
