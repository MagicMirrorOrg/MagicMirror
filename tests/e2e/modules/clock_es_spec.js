const helpers = require("../global-setup");

describe("Clock set to spanish language module", function () {
	helpers.setupTimeout(this);

	let app = null;

	testMatch = async function (element, regex) {
		await app.client.waitUntilWindowLoaded();
		const elem = await app.client.$(element);
		const txt = await elem.getText(element);
		return expect(txt).toMatch(regex);
	};

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

	describe("with default 24hr clock config", function () {
		beforeAll(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/clock/es/clock_24hr.js";
		});

		it("shows date with correct format", async function () {
			const dateRegex = /^(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo), \d{1,2} de (?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) de \d{4}$/;
			return testMatch(".clock .date", dateRegex);
		});

		it("shows time in 24hr format", async function () {
			const timeRegex = /^(?:2[0-3]|[01]\d):[0-5]\d[0-5]\d$/;
			return testMatch(".clock .time", timeRegex);
		});
	});

	describe("with default 12hr clock config", function () {
		beforeAll(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/clock/es/clock_12hr.js";
		});

		it("shows date with correct format", async function () {
			const dateRegex = /^(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo), \d{1,2} de (?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) de \d{4}$/;
			return testMatch(".clock .date", dateRegex);
		});

		it("shows time in 12hr format", async function () {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[0-5]\d[ap]m$/;
			return testMatch(".clock .time", timeRegex);
		});
	});

	describe("with showPeriodUpper config enabled", function () {
		beforeAll(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/clock/es/clock_showPeriodUpper.js";
		});

		it("shows 12hr time with upper case AM/PM", async function () {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[0-5]\d[AP]M$/;
			return testMatch(".clock .time", timeRegex);
		});
	});

	describe("with showWeek config enabled", function () {
		beforeAll(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/clock/es/clock_showWeek.js";
		});

		it("shows week with correct format", async function () {
			const weekRegex = /^Semana [0-9]{1,2}$/;
			return testMatch(".clock .week", weekRegex);
		});
	});
});
