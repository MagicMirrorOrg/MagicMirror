const helpers = require("./global-setup");

describe("Check configuration without modules", function () {
	helpers.setupTimeout(this);

	let app = null;

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

	beforeAll(function () {
		// Set config sample for use in test
		process.env.MM_CONFIG_FILE = "tests/configs/without_modules.js";
	});

	it("Show the message MagicMirror title", async function () {
		const elem = await app.client.$("#module_1_helloworld .module-content");
		return expect(await elem.getText("#module_1_helloworld .module-content")).toBe("Magic Mirror2");
	});

	it("Show the text Michael's website", async function () {
		const elem = await app.client.$("#module_5_helloworld .module-content");
		return expect(await elem.getText("#module_5_helloworld .module-content")).toBe("www.michaelteeuw.nl");
	});
});
