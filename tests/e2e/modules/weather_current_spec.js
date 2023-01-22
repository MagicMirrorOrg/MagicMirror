const helpers = require("../helpers/global-setup");
const weatherFunc = require("../helpers/weather-functions");

describe("Weather module", () => {
	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("Current weather", () => {
		describe("Default configuration", () => {
			beforeAll(async () => {
				await weatherFunc.startApp("tests/configs/modules/weather/currentweather_default.js", {});
			});

			it("should render wind speed and wind direction", async () => {
				await weatherFunc.getText(".weather .normal.medium span:nth-child(2)", "12 WSW");
			});

			it("should render temperature with icon", async () => {
				await weatherFunc.getText(".weather .large.light span.bright", "1.5°");
			});

			it("should render feels like temperature", async () => {
				await weatherFunc.getText(".weather .normal.medium.feelslike span.dimmed", "Feels like -5.6°");
			});
		});
	});

	describe("Compliments Integration", () => {
		beforeAll(async () => {
			await weatherFunc.startApp("tests/configs/modules/weather/currentweather_compliments.js", {});
		});

		it("should render a compliment based on the current weather", async () => {
			await weatherFunc.getText(".compliments .module-content span", "snow");
		});
	});

	describe("Configuration Options", () => {
		beforeAll(async () => {
			await weatherFunc.startApp("tests/configs/modules/weather/currentweather_options.js", {});
		});

		it("should render windUnits in beaufort", async () => {
			await weatherFunc.getText(".weather .normal.medium span:nth-child(2)", "6");
		});

		it("should render windDirection with an arrow", async () => {
			const elem = await helpers.waitForElement(".weather .normal.medium sup i.fa-long-arrow-alt-down");
			expect(elem).not.toBe(null);
			expect(elem.outerHTML).toContain("transform:rotate(250deg);");
		});

		it("should render humidity", async () => {
			await weatherFunc.getText(".weather .normal.medium span:nth-child(3)", "93.7");
		});

		it("should render degreeLabel for temp", async () => {
			await weatherFunc.getText(".weather .large.light span.bright", "1°C");
		});

		it("should render degreeLabel for feels like", async () => {
			await weatherFunc.getText(".weather .normal.medium.feelslike span.dimmed", "Feels like -6°C");
		});
	});

	describe("Current weather with imperial units", () => {
		beforeAll(async () => {
			await weatherFunc.startApp("tests/configs/modules/weather/currentweather_units.js", {});
		});

		it("should render wind in imperial units", async () => {
			await weatherFunc.getText(".weather .normal.medium span:nth-child(2)", "26 WSW");
		});

		it("should render temperatures in fahrenheit", async () => {
			await weatherFunc.getText(".weather .large.light span.bright", "34,7°");
		});

		it("should render 'feels like' in fahrenheit", async () => {
			await weatherFunc.getText(".weather .normal.medium.feelslike span.dimmed", "Feels like 21,9°");
		});
	});
});
