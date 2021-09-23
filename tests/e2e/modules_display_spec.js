const helpers = require("./global-setup");
let app = null;

describe("Display of modules", function () {
	beforeAll(function (done) {
		app = helpers.startApplication("tests/configs/modules/display.js");
		helpers.getDocument("http://localhost:8080", done);
	});
	afterAll(function () {
		helpers.stopApplication(app);
	});

	it("should show the test header", function () {
		elem = document.querySelector("#module_0_helloworld .module-header");
		expect(elem).not.toBe(null);
		expect(elem.textContent).toBe("test_header");
		//result ist leider lowercase wegen fehlendem css, siehe https://stackoverflow.com/questions/10318330/how-do-you-add-stylesheets-to-jsdom
	});

	it("should show no header if no header text is specified", function () {
		elem = document.querySelector("#module_1_helloworld .module-header");
		expect(elem).not.toBe(null);
		expect(elem.textContent).toBe("undefined");
	});
});
