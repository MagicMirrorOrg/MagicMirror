const helpers = require("./global-setup");
const fetch = require("node-fetch");

describe("port directive configuration", function () {
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

	describe("Set port 8090", function () {
		beforeAll(function () {
			// Set config sample for use in this test
			process.env.MM_CONFIG_FILE = "tests/configs/port_8090.js";
		});

		it("should return 200", function (done) {
			fetch("http://localhost:8090").then((res) => {
				expect(res.status).toBe(200);
				done();
			});
		});
	});

	describe("Set port 8100 on environment variable MM_PORT", function () {
		beforeAll(function () {
			process.env.MM_PORT = 8100;
			// Set config sample for use in this test
			process.env.MM_CONFIG_FILE = "tests/configs/port_8090.js";
		});

		afterAll(function () {
			delete process.env.MM_PORT;
		});

		it("should return 200", function (done) {
			fetch("http://localhost:8100").then((res) => {
				expect(res.status).toBe(200);
				done();
			});
		});
	});
});
