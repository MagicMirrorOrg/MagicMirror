const helpers = require("./global-setup");

const describe = global.describe;
const it = global.it;

describe("Display of modules", function () {
	helpers.setupTimeout(this);

	var app = null;

	beforeEach(function () {
		return helpers
			.startApplication({
				args: ["js/electron.js"]
			})
			.then(function (startedApp) {
				app = startedApp;
			});
	});

	afterEach(function () {
		return helpers.stopApplication(app);
	});

	describe("Using helloworld", function () {
		before(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/display.js";
		});

		it("should show the test header", async () => {
			const elem = await app.client.$("#module_0_helloworld .module-header", 10000);
			return elem.getText("#module_0_helloworld .module-header").should.eventually.equal("TEST_HEADER");
		});

		it("should show no header if no header text is specified", async () => {
			const elem = await app.client.$("#module_1_helloworld .module-header", 10000);
			return elem.getText("#module_1_helloworld .module-header").should.eventually.equal(false);
		});
	});
});
