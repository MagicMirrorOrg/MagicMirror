const moment = require("moment");
const helpers = require("../global-setup");
const path = require("path");
const fs = require("fs");
const { generateWeather, generateWeatherForecast } = require("./mocks");

describe("Weather module", function () {
	/**
	 * @param {string} element css selector
	 * @param {string} result Expected text in given selector
	 */
	function getText(element, result) {
		helpers.waitForElement(element).then((elem) => {
			expect(elem).not.toBe(null);
			expect(
				elem.textContent
					.trim()
					.replace(/(\r\n|\n|\r)/gm, "")
					.replace(/[ ]+/g, " ")
			).toBe(result);
		});
	}

	/**
	 * @param {string} configFile path to configuration file
	 * @param {string} additionalMockData special data for mocking
	 * @param {string} callback callback
	 */
	function startApp(configFile, additionalMockData, callback) {
		let mockWeather;
		if (configFile.includes("forecast")) {
			mockWeather = generateWeatherForecast(additionalMockData);
		} else {
			mockWeather = generateWeather(additionalMockData);
		}
		let content = fs.readFileSync(path.resolve(__dirname + "../../../../" + configFile)).toString();
		content = content.replace("#####WEATHERDATA#####", mockWeather);
		fs.writeFileSync(path.resolve(__dirname + "../../../../config/config.js"), content);
		helpers.startApplication("");
		helpers.getDocument(callback);
	}

	afterAll(async function () {
		await helpers.stopApplication();
	});

	describe("Current weather", function () {
		describe("Default configuration", function () {
			beforeAll(function (done) {
				startApp("tests/configs/modules/weather/currentweather_default.js", {}, done);
			});

			it("should render wind speed and wind direction", function () {
				getText(".weather .normal.medium span:nth-child(2)", "6 WSW");
			});

			it("should render temperature with icon", function () {
				getText(".weather .large.light span.bright", "1.5°");
			});

			it("should render feels like temperature", function () {
				getText(".weather .normal.medium.feelslike span.dimmed", "Feels like -5.6°");
			});
		});

		describe("Default configuration with sunrise", function () {
			beforeAll(function (done) {
				const sunrise = moment().startOf("day").unix();
				const sunset = moment().startOf("day").unix();
				startApp("tests/configs/modules/weather/currentweather_default.js", { sys: { sunrise, sunset } }, done);
			});

			it("should render sunrise", function () {
				getText(".weather .normal.medium span:nth-child(4)", "12:00 am");
			});
		});

		describe("Default configuration with sunset", function () {
			beforeAll(function (done) {
				const sunrise = moment().startOf("day").unix();
				const sunset = moment().endOf("day").unix();
				startApp("tests/configs/modules/weather/currentweather_default.js", { sys: { sunrise, sunset } }, done);
			});

			it("should render sunset", function () {
				getText(".weather .normal.medium span:nth-child(4)", "11:59 pm");
			});
		});
	});

	describe("Compliments Integration", function () {
		beforeAll(function (done) {
			startApp("tests/configs/modules/weather/currentweather_compliments.js", {}, done);
		});

		it("should render a compliment based on the current weather", function () {
			getText(".compliments .module-content span", "snow");
		});
	});

	describe("Configuration Options", function () {
		beforeAll(function (done) {
			startApp("tests/configs/modules/weather/currentweather_options.js", {}, done);
		});

		it("should render useBeaufort = false", function () {
			getText(".weather .normal.medium span:nth-child(2)", "12");
		});

		it("should render showWindDirectionAsArrow = true", function () {
			helpers.waitForElement(".weather .normal.medium sup i.fa-long-arrow-alt-up").then((elem) => {
				expect(elem).not.toBe(null);
				expect(elem.outerHTML).toContain("transform:rotate(250deg);");
			});
		});

		it("should render showHumidity = true", function () {
			getText(".weather .normal.medium span:nth-child(3)", "93.7");
		});

		it("should render degreeLabel = true", function () {
			getText(".weather .large.light span.bright", "1°C");
			getText(".weather .normal.medium.feelslike span.dimmed", "Feels like -6°C");
		});
	});

	describe("Current weather units", function () {
		beforeAll(function (done) {
			startApp(
				"tests/configs/modules/weather/currentweather_units.js",
				{
					main: {
						temp: (1.49 * 9) / 5 + 32,
						temp_min: (1 * 9) / 5 + 32,
						temp_max: (2 * 9) / 5 + 32
					},
					wind: {
						speed: 11.8 * 2.23694
					}
				},
				done
			);
		});

		it("should render imperial units", function () {
			getText(".weather .normal.medium span:nth-child(2)", "6 WSW");
			getText(".weather .large.light span.bright", "34,7°");
			getText(".weather .normal.medium.feelslike span.dimmed", "Feels like 22,0°");
		});

		it("should render custom decimalSymbol = ','", function () {
			getText(".weather .normal.medium span:nth-child(3)", "93,7");
			getText(".weather .large.light span.bright", "34,7°");
			getText(".weather .normal.medium.feelslike span.dimmed", "Feels like 22,0°");
		});
	});

	describe("Weather Forecast", function () {
		describe("Default configuration", function () {
			beforeAll(function (done) {
				startApp("tests/configs/modules/weather/forecastweather_default.js", {}, done);
			});

			it("should render days", function () {
				const days = ["Today", "Tomorrow", "Sun", "Mon", "Tue"];

				for (const [index, day] of days.entries()) {
					getText(`.weather table.small tr:nth-child(${index + 1}) td:nth-child(1)`, day);
				}
			});

			it("should render icons", function () {
				const icons = ["day-cloudy", "rain", "day-sunny", "day-sunny", "day-sunny"];

				for (const [index, icon] of icons.entries()) {
					helpers.waitForElement(`.weather table.small tr:nth-child(${index + 1}) td:nth-child(2) span.wi-${icon}`).then((elem) => {
						expect(elem).not.toBe(null);
					});
				}
			});

			it("should render max temperatures", function () {
				const temperatures = ["24.4°", "21.0°", "22.9°", "23.4°", "20.6°"];

				for (const [index, temp] of temperatures.entries()) {
					getText(`.weather table.small tr:nth-child(${index + 1}) td:nth-child(3)`, temp);
				}
			});

			it("should render min temperatures", function () {
				const temperatures = ["15.3°", "13.6°", "13.8°", "13.9°", "10.9°"];

				for (const [index, temp] of temperatures.entries()) {
					getText(`.weather table.small tr:nth-child(${index + 1}) td:nth-child(4)`, temp);
				}
			});

			it("should render fading of rows", function () {
				const opacities = [1, 1, 0.8, 0.5333333333333333, 0.2666666666666667];

				for (const [index, opacity] of opacities.entries()) {
					helpers.waitForElement(`.weather table.small tr:nth-child(${index + 1})`).then((elem) => {
						expect(elem).not.toBe(null);
						expect(elem.outerHTML).toContain(`<tr style="opacity: ${opacity};">`);
					});
				}
			});
		});

		describe("Absolute configuration", function () {
			beforeAll(function (done) {
				startApp("tests/configs/modules/weather/forecastweather_absolute.js", {}, done);
			});

			it("should render days", function () {
				const days = ["Fri", "Sat", "Sun", "Mon", "Tue"];

				for (const [index, day] of days.entries()) {
					getText(`.weather table.small tr:nth-child(${index + 1}) td:nth-child(1)`, day);
				}
			});
		});

		describe("Configuration Options", function () {
			beforeAll(function (done) {
				startApp("tests/configs/modules/weather/forecastweather_options.js", {}, done);
			});

			it("should render custom table class", function () {
				helpers.waitForElement(".weather table.myTableClass").then((elem) => {
					expect(elem).not.toBe(null);
				});
			});

			it("should render colored rows", function () {
				helpers.waitForElement(".weather table.myTableClass").then((table) => {
					expect(table).not.toBe(null);
					expect(table.rows).not.toBe(null);
					expect(table.rows.length).toBe(5);
				});
			});
		});

		describe("Forecast weather units", function () {
			beforeAll(function (done) {
				startApp("tests/configs/modules/weather/forecastweather_units.js", {}, done);
			});

			it("should render custom decimalSymbol = '_'", function () {
				const temperatures = ["24_4°", "21_0°", "22_9°", "23_4°", "20_6°"];

				for (const [index, temp] of temperatures.entries()) {
					getText(`.weather table.small tr:nth-child(${index + 1}) td:nth-child(3)`, temp);
				}
			});
		});
	});
});
