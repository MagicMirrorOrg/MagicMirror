const helpers = require("../global-setup");

describe("Test helloworld module", function () {
	afterAll(function () {
		helpers.stopApplication();
	});

	describe("helloworld set config text", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/helloworld/helloworld.js");
			helpers.getDocument(done);
		});

		it("Test message helloworld module", function () {
			helpers.waitForElement(".helloworld").then((elem) => {
				expect(elem).not.toBe(null);
				expect(elem.textContent).toContain("Test HelloWorld Module");
			});
		});
	});

	describe("helloworld default config text", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/helloworld/helloworld_default.js");
			helpers.getDocument(done);
		});

		it("Test message helloworld module", function () {
			helpers.waitForElement(".helloworld").then((elem) => {
				expect(elem).not.toBe(null);
				expect(elem.textContent).toContain("Hello World!");
			});
		});
	});
});
