const helpers = require("./global-setup");
const path = require("path");
const request = require("request");

const expect = require("chai").expect;

const describe = global.describe;
const it = global.it;
const beforeEach = global.beforeEach;
const afterEach = global.afterEach;

describe("Electron app environment", function() {
	helpers.setupTimeout(this);

	var app = null;

	before(function() {
		// Set config sample for use in test
		process.env.MM_CONFIG_FILE = "tests/configs/env.js";
	});

	beforeEach(function() {
		return helpers
			.startApplication({
				args: ["js/electron.js"]
			})
			.then(function(startedApp) {
				app = startedApp;
			});
	});

	afterEach(function() {
		return helpers.stopApplication(app);
	});

	it("should open a browserwindow", function() {
		return app.client
			.waitUntilWindowLoaded()
			.browserWindow.focus()
			.getWindowCount()
			.should.eventually.equal(1)
			.browserWindow.isMinimized()
			.should.eventually.be.false.browserWindow.isDevToolsOpened()
			.should.eventually.be.false.browserWindow.isVisible()
			.should.eventually.be.true.browserWindow.isFocused()
			.should.eventually.be.true.browserWindow.getBounds()
			.should.eventually.have.property("width")
			.and.be.above(0)
			.browserWindow.getBounds()
			.should.eventually.have.property("height")
			.and.be.above(0)
			.browserWindow.getTitle()
			.should.eventually.equal("MagicMirror²");
	});

	it("get request from http://localhost:8080 should return 200", function(done) {
		request.get("http://localhost:8080", function(err, res, body) {
			expect(res.statusCode).to.equal(200);
			done();
		});
	});

	it("get request from http://localhost:8080/nothing should return 404", function(done) {
		request.get("http://localhost:8080/nothing", function(err, res, body) {
			expect(res.statusCode).to.equal(404);
			done();
		});
	});
});
