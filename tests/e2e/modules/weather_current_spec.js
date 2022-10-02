const moment = require("moment");
const helpers = require("../global-setup");
const weatherFunc = require("./weather-functions");

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
				await weatherFunc.getText(".weather .normal.medium span:nth-child(2)", "6 WSW"); // now "12"
			});

			it("should render temperature with icon", async () => {
				await weatherFunc.getText(".weather .large.light span.bright", "1.5°"); // now "1°C"
			});

			it("should render feels like temperature", async () => {
				await weatherFunc.getText(".weather .normal.medium.feelslike span.dimmed", "Feels like -5.6°"); // now "Feels like -6°C"
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
			await weatherFunc.getText(".weather .normal.medium span:nth-child(2)", "12");
		});

		it("should render showWindDirectionAsArrow = true", async () => {
			const elem = await helpers.waitForElement(".weather .normal.medium sup i.fa-long-arrow-alt-up");
			expect(elem).not.toBe(null);
			expect(elem.outerHTML).toContain("transform:rotate(250deg);");
		});

		it("should render showHumidity = true", async () => {
			await weatherFunc.getText(".weather .normal.medium span:nth-child(3)", "93.7");
		});

		it("should render degreeLabel = true for temp", async () => {
			await weatherFunc.getText(".weather .large.light span.bright", "1°C");
		});

		it("should render degreeLabel = true for feels like", async () => {
			await weatherFunc.getText(".weather .normal.medium.feelslike span.dimmed", "Feels like -6°C");
		});
	});

	describe("Current weather units", () => {
		beforeAll(async () => {
			await weatherFunc.startApp("tests/configs/modules/weather/currentweather_units.js", {
				main: {
					temp: (1.49 * 9) / 5 + 32,
					temp_min: (1 * 9) / 5 + 32,
					temp_max: (2 * 9) / 5 + 32
				},
				wind: {
					speed: 11.8 * 2.23694
				}
			});
		});

		it("should render imperial units for wind", async () => {
			await weatherFunc.getText(".weather .normal.medium span:nth-child(2)", "6 WSW");
		});

		it("should render imperial units for temp", async () => {
			await weatherFunc.getText(".weather .large.light span.bright", "34,7°");
		});

		it("should render imperial units for feels like", async () => {
			await weatherFunc.getText(".weather .normal.medium.feelslike span.dimmed", "Feels like 22,0°");
		});

		it("should render custom decimalSymbol = ',' for humidity", async () => {
			await weatherFunc.getText(".weather .normal.medium span:nth-child(3)", "93,7");
		});

		it("should render custom decimalSymbol = ',' for temp", async () => {
			await weatherFunc.getText(".weather .large.light span.bright", "34,7°");
		});

		it("should render custom decimalSymbol = ',' for feels like", async () => {
			await weatherFunc.getText(".weather .normal.medium.feelslike span.dimmed", "Feels like 22,0°");
		});
	});
});
