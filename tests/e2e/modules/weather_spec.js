const fs = require("fs");
const moment = require("moment");
const path = require("path");
const wdajaxstub = require("webdriverajaxstub");

const helpers = require("../global-setup");

const { generateWeather, generateWeatherForecast } = require("./mocks");

describe("Weather module", function () {
	let app;

	helpers.setupTimeout(this);

	async function setup(responses) {
		app = await helpers.startApplication({
			args: ["js/electron.js"],
			waitTimeout: 100000
		});

		wdajaxstub.init(app.client, responses);

		app.client.setupStub();
	}

	async function getElement(element) {
		return await app.client.$(element);
	}

	async function getText(element, result) {
		const elem = await getElement(element);
		return await elem.getText(element).then(function (text) {
			expect(text.trim()).toBe(result);
		});
	}

	afterEach(function () {
		return helpers.stopApplication(app);
	});

	describe("Current weather", function () {
		let template;

		beforeAll(function () {
			template = fs.readFileSync(path.join(__dirname, "..", "..", "..", "modules", "default", "weather", "current.njk"), "utf8");
		});

		describe("Default configuration", function () {
			beforeAll(function () {
				process.env.MM_CONFIG_FILE = "tests/configs/modules/weather/currentweather_default.js";
			});

			it("should render wind speed and wind direction", async function () {
				const weather = generateWeather();
				await setup({ template, data: weather });

				return getText(".weather .normal.medium span:nth-child(2)", "6 WSW");
			});

			it("should render sunrise", async function () {
				const sunrise = moment().startOf("day").unix();
				const sunset = moment().startOf("day").unix();

				const weather = generateWeather({ sys: { sunrise, sunset } });
				await setup({ template, data: weather });

				return getText(".weather .normal.medium span:nth-child(4)", "12:00 am");
			});

			it("should render sunset", async function () {
				const sunrise = moment().startOf("day").unix();
				const sunset = moment().endOf("day").unix();

				const weather = generateWeather({ sys: { sunrise, sunset } });
				await setup({ template, data: weather });

				return getText(".weather .normal.medium span:nth-child(4)", "11:59 pm");
			});

			it("should render temperature with icon", async function () {
				const weather = generateWeather();
				await setup({ template, data: weather });

				return getText(".weather .large.light span.bright", "1.5°");
			});

			it("should render feels like temperature", async function () {
				const weather = generateWeather();
				await setup({ template, data: weather });

				return getText(".weather .normal.medium.feelslike span.dimmed", "Feels like -5.6°");
			});
		});

		describe("Compliments Integration", function () {
			beforeAll(function () {
				process.env.MM_CONFIG_FILE = "tests/configs/modules/weather/currentweather_compliments.js";
			});

			it("should render a compliment based on the current weather", async function () {
				const weather = generateWeather();
				await setup({ template, data: weather });

				return app.client.waitUntilTextExists(".compliments .module-content span", "snow");
			});
		});

		describe("Configuration Options", function () {
			beforeAll(function () {
				process.env.MM_CONFIG_FILE = "tests/configs/modules/weather/currentweather_options.js";
			});

			it("should render useBeaufort = false", async function () {
				const weather = generateWeather();
				await setup({ template, data: weather });

				return getText(".weather .normal.medium span:nth-child(2)", "12");
			});

			it("should render showWindDirectionAsArrow = true", async function () {
				const weather = generateWeather();
				await setup({ template, data: weather });

				const elem = await getElement(".weather .normal.medium sup i.fa-long-arrow-up");
				return elem.getHTML(".weather .normal.medium sup i.fa-long-arrow-up").then(function (text) {
					expect(text).toContain("transform:rotate(250deg);");
				});
			});

			it("should render showHumidity = true", async function () {
				const weather = generateWeather();
				await setup({ template, data: weather });

				return getText(".weather .normal.medium span:nth-child(3)", "93.7");
			});

			it("should render degreeLabel = true", async function () {
				const weather = generateWeather();
				await setup({ template, data: weather });

				return (await getText(".weather .large.light span.bright", "1°C")) && (await getText(".weather .normal.medium.feelslike span.dimmed", "Feels like -6°C"));
			});
		});

		describe("Current weather units", function () {
			beforeAll(function () {
				process.env.MM_CONFIG_FILE = "tests/configs/modules/weather/currentweather_units.js";
			});

			it("should render imperial units", async function () {
				const weather = generateWeather({
					main: {
						temp: (1.49 * 9) / 5 + 32,
						temp_min: (1 * 9) / 5 + 32,
						temp_max: (2 * 9) / 5 + 32
					},
					wind: {
						speed: 11.8 * 2.23694
					}
				});
				await setup({ template, data: weather });

				return (await getText(".weather .normal.medium span:nth-child(2)", "6 WSW")) && (await getText(".weather .large.light span.bright", "34,7°")) && getText(".weather .normal.medium.feelslike span.dimmed", "Feels like 22,0°");
			});

			it("should render custom decimalSymbol = ','", async function () {
				const weather = generateWeather({
					main: {
						temp: (1.49 * 9) / 5 + 32,
						temp_min: (1 * 9) / 5 + 32,
						temp_max: (2 * 9) / 5 + 32
					},
					wind: {
						speed: 11.8 * 2.23694
					}
				});
				await setup({ template, data: weather });

				return (await getText(".weather .normal.medium span:nth-child(3)", "93,7")) && (await getText(".weather .large.light span.bright", "34,7°")) && getText(".weather .normal.medium.feelslike span.dimmed", "Feels like 22,0°");
			});
		});
	});

	describe("Weather Forecast", function () {
		let template;

		beforeAll(function () {
			template = fs.readFileSync(path.join(__dirname, "..", "..", "..", "modules", "default", "weather", "forecast.njk"), "utf8");
		});

		describe("Default configuration", function () {
			beforeAll(function () {
				process.env.MM_CONFIG_FILE = "tests/configs/modules/weather/forecastweather_default.js";
			});

			it("should render days", async function () {
				const weather = generateWeatherForecast();
				await setup({ template, data: weather });

				const days = ["Today", "Tomorrow", "Sun", "Mon", "Tue"];

				for (const [index, day] of days.entries()) {
					await getText(`.weather table.small tr:nth-child(${index + 1}) td:nth-child(1)`, day);
				}
			});

			it("should render icons", async function () {
				const weather = generateWeatherForecast();
				await setup({ template, data: weather });

				const icons = ["day-cloudy", "rain", "day-sunny", "day-sunny", "day-sunny"];

				for (const [index, icon] of icons.entries()) {
					await getElement(`.weather table.small tr:nth-child(${index + 1}) td:nth-child(2) span.wi-${icon}`);
				}
			});

			it("should render max temperatures", async function () {
				const weather = generateWeatherForecast();
				await setup({ template, data: weather });

				const temperatures = ["24.4°", "21.0°", "22.9°", "23.4°", "20.6°"];

				for (const [index, temp] of temperatures.entries()) {
					await getText(`.weather table.small tr:nth-child(${index + 1}) td:nth-child(3)`, temp);
				}
			});

			it("should render min temperatures", async function () {
				const weather = generateWeatherForecast();
				await setup({ template, data: weather });

				const temperatures = ["15.3°", "13.6°", "13.8°", "13.9°", "10.9°"];

				for (const [index, temp] of temperatures.entries()) {
					await getText(`.weather table.small tr:nth-child(${index + 1}) td:nth-child(4)`, temp);
				}
			});

			it("should render fading of rows", async function () {
				const weather = generateWeatherForecast();
				await setup({ template, data: weather });

				const opacities = [1, 1, 0.8, 0.5333333333333333, 0.2666666666666667];

				const elem = await getElement(".weather table.small");

				for (const [index, opacity] of opacities.entries()) {
					const html = await elem.getHTML(`.weather table.small tr:nth-child(${index + 1})`);
					expect(html).toContain(`<tr style="opacity: ${opacity};">`);
				}
			});
		});

		describe("Configuration Options", function () {
			beforeAll(function () {
				process.env.MM_CONFIG_FILE = "tests/configs/modules/weather/forecastweather_options.js";
			});

			it("should render custom table class", async function () {
				const weather = generateWeatherForecast();
				await setup({ template, data: weather });

				await getElement(".weather table.myTableClass");
			});

			it("should render colored rows", async function () {
				const weather = generateWeatherForecast();
				await setup({ template, data: weather });

				const rows = await app.client.$$(".weather table.myTableClass tr.colored");

				expect(rows.length).toBe(5);
			});
		});

		describe("Forecast weather units", function () {
			beforeAll(function () {
				process.env.MM_CONFIG_FILE = "tests/configs/modules/weather/forecastweather_units.js";
			});

			it("should render custom decimalSymbol = '_'", async function () {
				const weather = generateWeatherForecast();
				await setup({ template, data: weather });

				const temperatures = ["24_4°", "21_0°", "22_9°", "23_4°", "20_6°"];

				for (const [index, temp] of temperatures.entries()) {
					await getText(`.weather table.small tr:nth-child(${index + 1}) td:nth-child(3)`, temp);
				}
			});
		});
	});
});
