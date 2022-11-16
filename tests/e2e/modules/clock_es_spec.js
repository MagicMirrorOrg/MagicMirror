const helpers = require("../global-setup");

describe("Clock set to spanish language module", () => {
	afterAll(async () => {
		await helpers.stopApplication();
	});

	const testMatch = (done, element, regex) => {
		helpers.waitForElement(element).then((elem) => {
			done();
			expect(elem).not.toBe(null);
			expect(elem.textContent).toMatch(regex);
		});
	};

	describe("with default 24hr clock config", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/clock/es/clock_24hr.js");
			helpers.getDocument(done);
		});

		it("shows date with correct format", (done) => {
			const dateRegex = /^(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo), \d{1,2} de (?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) de \d{4}$/;
			testMatch(done, ".clock .date", dateRegex);
		});

		it("shows time in 24hr format", (done) => {
			const timeRegex = /^(?:2[0-3]|[01]\d):[0-5]\d[0-5]\d$/;
			testMatch(done, ".clock .time", timeRegex);
		});
	});

	describe("with default 12hr clock config", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/clock/es/clock_12hr.js");
			helpers.getDocument(done);
		});

		it("shows date with correct format", (done) => {
			const dateRegex = /^(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo), \d{1,2} de (?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) de \d{4}$/;
			testMatch(done, ".clock .date", dateRegex);
		});

		it("shows time in 12hr format", (done) => {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[0-5]\d[ap]m$/;
			testMatch(done, ".clock .time", timeRegex);
		});
	});

	describe("with showPeriodUpper config enabled", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/clock/es/clock_showPeriodUpper.js");
			helpers.getDocument(done);
		});

		it("shows 12hr time with upper case AM/PM", (done) => {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[0-5]\d[AP]M$/;
			testMatch(done, ".clock .time", timeRegex);
		});
	});

	describe("with showWeek config enabled", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/clock/es/clock_showWeek.js");
			helpers.getDocument(done);
		});

		it("shows week with correct format", (done) => {
			const weekRegex = /^Semana [0-9]{1,2}$/;
			testMatch(done, ".clock .week", weekRegex);
		});
	});
});
