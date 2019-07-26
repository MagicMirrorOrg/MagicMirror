const helpers = require("./global-setup");
const request = require("request");
const expect = require("chai").expect;

const describe = global.describe;
const it = global.it;
const beforeEach = global.beforeEach;
const afterEach = global.afterEach;

describe("port directive configuration", function () {
	helpers.setupTimeout(this);

	var app = null;

	beforeEach(function () {
		return helpers.startApplication({
			args: ["js/electron.js"]
		}).then(function (startedApp) { app = startedApp; });
	});

	afterEach(function () {
		return helpers.stopApplication(app);
	});

	describe("Set port 8090", function () {
		before(function () {
			// Set config sample for use in this test
			process.env.MM_CONFIG_FILE = "tests/configs/port_8090.js";
		});

		it("should return 200", function (done) {
			request.get("http://localhost:8090", function (err, res, body) {
				expect(res.statusCode).to.equal(200);
				done();
			});
		});
	});

	describe("Set port 8100 on environment variable MM_PORT", function () {
		before(function () {
			process.env.MM_PORT = 8100;
			// Set config sample for use in this test
			process.env.MM_CONFIG_FILE = "tests/configs/port_8090.js";
		});

		after(function () {
			delete process.env.MM_PORT;
		});

		it("should return 200", function (done) {
			request.get("http://localhost:8100", function (err, res, body) {
				expect(res.statusCode).to.equal(200);
				done();
			});
		});
	});
});
