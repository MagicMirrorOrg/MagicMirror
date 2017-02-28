const globalSetup = require("../global-setup");
const app = globalSetup.app;

describe("Clock set to spanish language module", function () {
	this.timeout(20000);

	describe("with default 24hr clock config", function() {
		before(function() {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/clock/es/clock_24hr.js";
		});

		beforeEach(function (done) {
			app.start().then(function() { done(); } );
		});

		afterEach(function (done) {
			app.stop().then(function() { done(); });
		});

		it("shows date with correct format", function () {
			const dateRegex = /^(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo), \d{1,2} de (?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) de \d{4}$/;
			return app.client.waitUntilWindowLoaded()
				.getText(".clock .date").should.eventually.match(dateRegex);
		});

		it("shows time in 24hr format", function() {
			const timeRegex = /^(?:2[0-3]|[01]\d):[0-5]\d[0-5]\d$/
			return app.client.waitUntilWindowLoaded()
				.getText(".clock .time").should.eventually.match(timeRegex);
		});
	});

	describe("with default 12hr clock config", function() {
		before(function() {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/clock/es/clock_12hr.js";
		});

		beforeEach(function (done) {
			app.start().then(function() { done(); } );
		});

		afterEach(function (done) {
			app.stop().then(function() { done(); });
		});

		it("shows date with correct format", function () {
			const dateRegex = /^(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo), \d{1,2} de (?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) de \d{4}$/;
			return app.client.waitUntilWindowLoaded()
				.getText(".clock .date").should.eventually.match(dateRegex);
		});

		it("shows time in 12hr format", function() {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[0-5]\d[ap]m$/;
			return app.client.waitUntilWindowLoaded()
				.getText(".clock .time").should.eventually.match(timeRegex);
		});
	});

	describe("with showPeriodUpper config enabled", function() {
		before(function() {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/clock/es/clock_showPeriodUpper.js";
		});

		beforeEach(function (done) {
			app.start().then(function() { done(); } );
		});

		afterEach(function (done) {
			app.stop().then(function() { done(); });
		});

		it("shows 12hr time with upper case AM/PM", function() {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[0-5]\d[AP]M$/;
			return app.client.waitUntilWindowLoaded()
				.getText(".clock .time").should.eventually.match(timeRegex);
		});
	});
});
