const helpers = require("./global-setup");
const path = require("path");
const request = require("request");

const expect = require("chai").expect;

const describe = global.describe;
const it = global.it;
const beforeEach = global.beforeEach;
const afterEach = global.afterEach;

describe("ipWhitelist directive configuration", function () {
	helpers.setupTimeout(this);

	var app = null;

	beforeEach(function () {
		return helpers.startApplication({
			args: ["js/electron.js"]
		}).then(function (startedApp) { app = startedApp; })
	});

	afterEach(function () {
		return helpers.stopApplication(app);
	});

	describe("Set ipWhitelist without access", function () {
		before(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/noIpWhiteList.js";
		});
		it("should return 403", function (done) {
			request.get("http://localhost:8080", function (err, res, body) {
				expect(res.statusCode).to.equal(403);
				done();
			});
		});
	});

	describe("Set ipWhitelist []", function () {
		before(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/empty_ipWhiteList.js";
		});
		it("should return 200", function (done) {
			request.get("http://localhost:8080", function (err, res, body) {
				expect(res.statusCode).to.equal(200);
				done();
			});
		});
	});

});
