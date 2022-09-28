const moment = require("moment");
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
				await weatherFunc.getText(".weather .normal.medium span:nth-child(2)", "5 WSW");
			});

			it("should render temperature", async () => {
				await weatherFunc.getText(".weather .large.light span.bright", "12.2°");
			});

			it("should render feels like temperature", async () => {
				await weatherFunc.getText(".weather .normal.medium.feelslike span.dimmed", "Feels like 11.3°");
			});
		});

		describe("Default configuration with sunrise", () => {
			beforeAll(async () => {
				const sunrise = moment().startOf("day").unix();
				const sunset = moment().startOf("day").unix();
				await weatherFunc.startApp("tests/configs/modules/weather/currentweather_default.js", { sys: { sunrise, sunset } });
			});

			it("should render sunrise", async () => {
				await weatherFunc.getText(".weather .normal.medium span:nth-child(4)", "12:00 am");
			});
		});

		describe("Default configuration with sunset", () => {
			beforeAll(async () => {
				const sunrise = moment().startOf("day").unix();
				const sunset = moment().endOf("day").unix();
				await weatherFunc.startApp("tests/configs/modules/weather/currentweather_default.js", { sys: { sunrise, sunset } });
			});

			it("should render sunset", async () => {
				await weatherFunc.getText(".weather .normal.medium span:nth-child(4)", "11:59 pm");
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

		it("should render useBeaufort = false", async () => {
			await weatherFunc.getText(".weather .normal.medium span:nth-child(2)", "5");
		});

		it("should render showWindDirectionAsArrow = true", async () => {
			const elem = await helpers.waitForElement(".weather .normal.medium sup i.fa-long-arrow-alt-up");
			expect(elem).not.toBe(null);
			expect(elem.outerHTML).toContain("transform:rotate(240deg);");
		});

		it("should render showHumidity = true", async () => {
			await weatherFunc.getText(".weather .normal.medium span:nth-child(3)", "72");
		});

		it("should render degreeLabel = true for temp", async () => {
			await weatherFunc.getText(".weather .large.light span.bright", "12°C");
		});

		it("should render degreeLabel = true for feels like", async () => {
			await weatherFunc.getText(".weather .normal.medium.feelslike span.dimmed", "Feels like 11°C");
		});
	});

	describe("Current weather with imperial units", () => {
		beforeAll(async () => {
			await weatherFunc.startApp("tests/configs/modules/weather/currentweather_units.js", {});
		});

		it("should render wind in mph", async () => {
			await weatherFunc.getText(".weather .normal.medium span:nth-child(2)", "11 WSW");
		});

		it("should render temperatures in fahrenheit", async () => {
			await weatherFunc.getText(".weather .large.light span.bright", "54,0°");
		});

		it("should render feels like in fahrenheit", async () => {
			await weatherFunc.getText(".weather .normal.medium.feelslike span.dimmed", "Feels like 52,3°");
		});
	});
});
