const helpers = require("./global-setup");
const request = require("request");
const expect = require("chai").expect;

const describe = global.describe;
const it = global.it;
const beforeEach = global.beforeEach;
const afterEach = global.afterEach;

describe("Electron app environment", function () {
	helpers.setupTimeout(this);

	var app = null;

	before(function () {
		// Set config sample for use in test
		process.env.MM_CONFIG_FILE = "tests/configs/env.js";
	});

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

	it("should open a browserwindow", async function () {
		await app.client.waitUntilWindowLoaded();
		app.browserWindow.focus();
		const cnt = await app.client.getWindowCount();
		const min = await app.browserWindow.isMinimized();
		const dev = await app.browserWindow.isDevToolsOpened();
		const vis = await app.browserWindow.isVisible();
		const foc = await app.browserWindow.isFocused();
		const bounds = await app.browserWindow.getBounds();
		const title = await app.browserWindow.getTitle();
		return (
			cnt.should.equal(1) &&
			min.should.be.false &&
			dev.should.be.false &&
			vis.should.be.true &&
			foc.should.be.true &&
			bounds.should.have.property("width").and.be.above(0) &&
			bounds.should.have.property("height").and.be.above(0) &&
			title.should.equal("MagicMirror²")
		);
	});

	it("get request from http://localhost:8080 should return 200", function (done) {
		request.get("http://localhost:8080", function (err, res, body) {
			expect(res.statusCode).to.equal(200);
			done();
		});
	});

	it("get request from http://localhost:8080/nothing should return 404", function (done) {
		request.get("http://localhost:8080/nothing", function (err, res, body) {
			expect(res.statusCode).to.equal(404);
			done();
		});
	});
});
