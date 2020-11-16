const expect = require("chai").expect;
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
			args: ["js/electron.js"]
		});

		wdajaxstub.init(app.client, responses);

		app.client.setupStub();
	}

	afterEach(function () {
		return helpers.stopApplication(app);
	});

	describe("Current weather", function () {
		let template;

		before(function () {
			template = fs.readFileSync(path.join(__dirname, "..", "..", "..", "modules", "default", "weather", "current.njk"), "utf8");
		});

		describe("Default configuration", function () {
			before(function () {
				process.env.MM_CONFIG_FILE = "tests/configs/modules/weather/currentweather_default.js";
			});

			it("should render wind speed and wind direction", async function () {
				const weather = generateWeather();
				await setup({ template, data: weather });

				return app.client.waitUntilTextExists(".weather .normal.medium span:nth-child(2)", "6 WSW", 10000);
			});

			it("should render sunrise", async function () {
				const sunrise = moment().startOf("day").unix();
				const sunset = moment().startOf("day").unix();

				const weather = generateWeather({ sys: { sunrise, sunset } });
				await setup({ template, data: weather });

				await app.client.waitForExist(".weather .normal.medium span.wi.dimmed.wi-sunrise", 10000);

				return app.client.waitUntilTextExists(".weather .normal.medium span:nth-child(4)", "12:00 am", 10000);
			});

			it("should render sunset", async function () {
				const sunrise = moment().startOf("day").unix();
				const sunset = moment().endOf("day").unix();

				const weather = generateWeather({ sys: { sunrise, sunset } });
				await setup({ template, data: weather });

				await app.client.waitForExist(".weather .normal.medium span.wi.dimmed.wi-sunset", 10000);

				return app.client.waitUntilTextExists(".weather .normal.medium span:nth-child(4)", "11:59 pm", 10000);
			});

			it("should render temperature with icon", async function () {
				const weather = generateWeather();
				await setup({ template, data: weather });

				await app.client.waitForExist(".weather .large.light span.wi.weathericon.wi-snow", 10000);

				return app.client.waitUntilTextExists(".weather .large.light span.bright", "1.5°", 10000);
			});

			it("should render feels like temperature", async function () {
				const weather = generateWeather();
				await setup({ template, data: weather });

				return app.client.waitUntilTextExists(".weather .normal.medium span.dimmed", "Feels like -5.6°", 10000);
			});
		});

		describe("Configuration Options", function () {
			before(function () {
				process.env.MM_CONFIG_FILE = "tests/configs/modules/weather/currentweather_options.js";
			});

			it("should render useBeaufort = false", async function () {
				const weather = generateWeather();
				await setup({ template, data: weather });

				return app.client.waitUntilTextExists(".weather .normal.medium span:nth-child(2)", "12", 10000);
			});

			it("should render showWindDirectionAsArrow = true", async function () {
				const weather = generateWeather();
				await setup({ template, data: weather });

				await app.client.waitForExist(".weather .normal.medium sup i.fa-long-arrow-up", 10000);
				const element = await app.client.getHTML(".weather .normal.medium sup i.fa-long-arrow-up");

				expect(element).to.include("transform:rotate(250deg);");
			});

			it("should render showHumidity = true", async function () {
				const weather = generateWeather();
				await setup({ template, data: weather });

				await app.client.waitUntilTextExists(".weather .normal.medium span:nth-child(3)", "93", 10000);
				return app.client.waitForExist(".weather .normal.medium sup i.wi-humidity", 10000);
			});

			it("should render degreeLabel = true", async function () {
				const weather = generateWeather();
				await setup({ template, data: weather });

				await app.client.waitUntilTextExists(".weather .large.light span.bright", "1°C", 10000);

				return app.client.waitUntilTextExists(".weather .normal.medium span.dimmed", "Feels like -6°C", 10000);
			});
		});

		describe("Current weather units", function () {
			before(function () {
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

				await app.client.waitUntilTextExists(".weather .normal.medium span:nth-child(2)", "6 WSW", 10000);
				await app.client.waitUntilTextExists(".weather .large.light span.bright", "34,7°", 10000);
				return app.client.waitUntilTextExists(".weather .normal.medium span.dimmed", "22,0°", 10000);
			});

			it("should render decimalSymbol = ','", async function () {
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

				await app.client.waitUntilTextExists(".weather .normal.medium span:nth-child(3)", "93,7", 10000);
				await app.client.waitUntilTextExists(".weather .large.light span.bright", "34,7°", 10000);
				return app.client.waitUntilTextExists(".weather .normal.medium span.dimmed", "22,0°", 10000);
			});
		});
	});

	describe("Weather Forecast", function () {
		let template;

		before(function () {
			template = fs.readFileSync(path.join(__dirname, "..", "..", "..", "modules", "default", "weather", "forecast.njk"), "utf8");
		});

		describe("Default configuration", function () {
			before(function () {
				process.env.MM_CONFIG_FILE = "tests/configs/modules/weather/forecastweather_default.js";
			});

			it("should render days", async function () {
				const weather = generateWeatherForecast();
				await setup({ template, data: weather });

				const days = ["Today", "Tomorrow", "Sun", "Mon", "Tue"];

				for (const [index, day] of days.entries()) {
					await app.client.waitUntilTextExists(`.weather table.small tr:nth-child(${index + 1}) td:nth-child(1)`, day, 10000);
				}
			});

			it("should render icons", async function () {
				const weather = generateWeatherForecast();
				await setup({ template, data: weather });

				const icons = ["day-cloudy", "rain", "day-sunny", "day-sunny", "day-sunny"];

				for (const [index, icon] of icons.entries()) {
					await app.client.waitForExist(`.weather table.small tr:nth-child(${index + 1}) td:nth-child(2) span.wi-${icon}`, 10000);
				}
			});

			it("should render max temperatures", async function () {
				const weather = generateWeatherForecast();
				await setup({ template, data: weather });

				const temperatures = ["24.4°", "21.0°", "22.9°", "23.4°", "20.6°"];

				for (const [index, temp] of temperatures.entries()) {
					await app.client.waitUntilTextExists(`.weather table.small tr:nth-child(${index + 1}) td:nth-child(3)`, temp, 10000);
				}
			});

			it("should render min temperatures", async function () {
				const weather = generateWeatherForecast();
				await setup({ template, data: weather });

				const temperatures = ["15.3°", "13.6°", "13.8°", "13.9°", "10.9°"];

				for (const [index, temp] of temperatures.entries()) {
					await app.client.waitUntilTextExists(`.weather table.small tr:nth-child(${index + 1}) td:nth-child(4)`, temp, 10000);
				}
			});

			it("should render fading of rows", async function () {
				const weather = generateWeatherForecast();
				await setup({ template, data: weather });

				const opacities = [1, 1, 0.8, 0.5333333333333333, 0.2666666666666667];

				await app.client.waitForExist(".weather table.small", 10000);

				for (const [index, opacity] of opacities.entries()) {
					const html = await app.client.getHTML(`.weather table.small tr:nth-child(${index + 1})`);
					expect(html).to.includes(`<tr style="opacity: ${opacity};">`);
				}
			});
		});

		describe("Configuration Options", function () {
			before(function () {
				process.env.MM_CONFIG_FILE = "tests/configs/modules/weather/forecastweather_options.js";
			});

			it("should render custom table class", async function () {
				const weather = generateWeatherForecast();
				await setup({ template, data: weather });

				await app.client.waitForExist(".weather table.myTableClass", 10000);
			});

			it("should render colored rows", async function () {
				const weather = generateWeatherForecast();
				await setup({ template, data: weather });

				await app.client.waitForExist(".weather table.myTableClass", 10000);

				const rows = await app.client.$$(".weather table.myTableClass tr.colored");

				expect(rows.length).to.be.equal(5);
			});
		});
	});
});
