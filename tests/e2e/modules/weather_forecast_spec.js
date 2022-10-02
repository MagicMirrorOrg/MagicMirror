const helpers = require("../global-setup");
const weatherFunc = require("./weather-functions");

describe("Weather module: Weather Forecast", () => {
	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("Default configuration", () => {
		beforeAll((done) => {
			weatherFunc.startApp("tests/configs/modules/weather/forecastweather_default.js", {}, done);
		});

		const days = ["Today", "Tomorrow", "Sun", "Mon", "Tue"];
		for (const [index, day] of days.entries()) {
			it("should render day " + day, (done) => {
				weatherFunc.getText(done, `.weather table.small tr:nth-child(${index + 1}) td:nth-child(1)`, day);
			});
		}

		const icons = ["day-cloudy", "rain", "day-sunny", "day-sunny", "day-sunny"];
		for (const [index, icon] of icons.entries()) {
			it("should render icon " + icon, (done) => {
				helpers.waitForElement(done, `.weather table.small tr:nth-child(${index + 1}) td:nth-child(2) span.wi-${icon}`).then((elem) => {
					expect(elem).not.toBe(null);
				});
			});
		}

		const maxTemps = ["24.4°", "21.0°", "22.9°", "23.4°", "20.6°"];
		for (const [index, temp] of maxTemps.entries()) {
			it("should render max temperature " + temp, (done) => {
				weatherFunc.getText(done, `.weather table.small tr:nth-child(${index + 1}) td:nth-child(3)`, temp);
			});
		}

		const minTemps = ["15.3°", "13.6°", "13.8°", "13.9°", "10.9°"];
		for (const [index, temp] of minTemps.entries()) {
			it("should render min temperature " + temp, (done) => {
				weatherFunc.getText(done, `.weather table.small tr:nth-child(${index + 1}) td:nth-child(4)`, temp);
			});
		}

		const opacities = [1, 1, 0.8, 0.5333333333333333, 0.2666666666666667];
		for (const [index, opacity] of opacities.entries()) {
			it("should render fading of rows with opacity=" + opacity, (done) => {
				helpers.waitForElement(done, `.weather table.small tr:nth-child(${index + 1})`).then((elem) => {
					expect(elem).not.toBe(null);
					expect(elem.outerHTML).toContain(`<tr style="opacity: ${opacity};">`);
				});
			});
		}
	});

	describe("Absolute configuration", () => {
		beforeAll((done) => {
			weatherFunc.startApp("tests/configs/modules/weather/forecastweather_absolute.js", {}, done);
		});

		const days = ["Fri", "Sat", "Sun", "Mon", "Tue"];
		for (const [index, day] of days.entries()) {
			it("should render day " + day, (done) => {
				weatherFunc.getText(done, `.weather table.small tr:nth-child(${index + 1}) td:nth-child(1)`, day);
			});
		}
	});

	describe("Configuration Options", () => {
		beforeAll((done) => {
			weatherFunc.startApp("tests/configs/modules/weather/forecastweather_options.js", {}, done);
		});

		it("should render custom table class", (done) => {
			helpers.waitForElement(done, ".weather table.myTableClass").then((elem) => {
				expect(elem).not.toBe(null);
			});
		});

		it("should render colored rows", (done) => {
			helpers.waitForElement(done, ".weather table.myTableClass").then((table) => {
				expect(table).not.toBe(null);
				expect(table.rows).not.toBe(null);
				expect(table.rows.length).toBe(5);
			});
		});
	});

	describe("Forecast weather units", () => {
		beforeAll((done) => {
			weatherFunc.startApp("tests/configs/modules/weather/forecastweather_units.js", {}, done);
		});

		const temperatures = ["24_4°", "21_0°", "22_9°", "23_4°", "20_6°"];
		for (const [index, temp] of temperatures.entries()) {
			it("should render custom decimalSymbol = '_' for temp " + temp, (done) => {
				weatherFunc.getText(done, `.weather table.small tr:nth-child(${index + 1}) td:nth-child(3)`, temp);
			});
		}
	});
});
