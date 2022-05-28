const helpers = require("./global-setup");

describe("Display of modules", function () {
	beforeAll(function (done) {
		helpers.startApplication("tests/configs/modules/display.js");
		helpers.getDocument(done);
	});
	afterAll(async function () {
		await helpers.stopApplication();
	});

	it("should show the test header", function () {
		helpers.waitForElement("#module_0_helloworld .module-header").then((elem) => {
			expect(elem).not.toBe(null);
			// textContent gibt hier lowercase zurück, das uppercase wird durch css realisiert, was daher nicht in textContent landet
			expect(elem.textContent).toBe("test_header");
		});
	});

	it("should show no header if no header text is specified", function () {
		helpers.waitForElement("#module_1_helloworld .module-header").then((elem) => {
			expect(elem).not.toBe(null);
			expect(elem.textContent).toBe("undefined");
		});
	});
});
