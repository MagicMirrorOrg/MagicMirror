const helpers = require("./global-setup");
const fetch = require("node-fetch");
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
		expect(await app.client.getWindowCount()).to.equal(1);
		expect(await app.browserWindow.isMinimized()).to.be.false;
		expect(await app.browserWindow.isDevToolsOpened()).to.be.false;
		expect(await app.browserWindow.isVisible()).to.be.true;
		expect(await app.browserWindow.isFocused()).to.be.true;
		const bounds = await app.browserWindow.getBounds();
		expect(bounds.width).to.be.above(0);
		expect(bounds.height).to.be.above(0);
		expect(await app.browserWindow.getTitle()).to.equal("MagicMirror²");
	});

	it("get request from http://localhost:8080 should return 200", function (done) {
		fetch("http://localhost:8080").then((res) => {
			expect(res.status).to.equal(200);
			done();
		});
	});

	it("get request from http://localhost:8080/nothing should return 404", function (done) {
		fetch("http://localhost:8080/nothing").then((res) => {
			expect(res.status).to.equal(404);
			done();
		});
	});
});
