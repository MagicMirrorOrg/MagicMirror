const helpers = require("../helpers/global-setup");

describe("Clock set to spanish language module", () => {
	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("with default 24hr clock config", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/es/clock_24hr.js");
			await helpers.getDocument();
		});

		it("shows date with correct format", async () => {
			const dateRegex = /^(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo), \d{1,2} de (?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) de \d{4}$/;
			await expect(helpers.testMatch(".clock .date", dateRegex)).resolves.toBe(true);
		});

		it("shows time in 24hr format", async () => {
			const timeRegex = /^(?:2[0-3]|[01]\d):[0-5]\d[0-5]\d$/;
			await expect(helpers.testMatch(".clock .time", timeRegex)).resolves.toBe(true);
		});
	});

	describe("with default 12hr clock config", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/es/clock_12hr.js");
			await helpers.getDocument();
		});

		it("shows date with correct format", async () => {
			const dateRegex = /^(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo), \d{1,2} de (?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) de \d{4}$/;
			await expect(helpers.testMatch(".clock .date", dateRegex)).resolves.toBe(true);
		});

		it("shows time in 12hr format", async () => {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[0-5]\d[ap]m$/;
			await expect(helpers.testMatch(".clock .time", timeRegex)).resolves.toBe(true);
		});
	});

	describe("with showPeriodUpper config enabled", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/es/clock_showPeriodUpper.js");
			await helpers.getDocument();
		});

		it("shows 12hr time with upper case AM/PM", async () => {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[0-5]\d[AP]M$/;
			await expect(helpers.testMatch(".clock .time", timeRegex)).resolves.toBe(true);
		});
	});

	describe("with showWeek config enabled", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/es/clock_showWeek.js");
			await helpers.getDocument();
		});

		it("shows week with correct format", async () => {
			const weekRegex = /^Semana [0-9]{1,2}$/;
			await expect(helpers.testMatch(".clock .week", weekRegex)).resolves.toBe(true);
		});
	});
});
