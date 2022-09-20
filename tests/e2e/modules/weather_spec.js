const moment = require("moment");
const helpers = require("../global-setup");
const path = require("path");
const fs = require("fs");
const { generateWeather, generateWeatherForecast } = require("./mocks");

describe("Weather module", () => {
	/**
	 * @param {string} done test done
	 * @param {string} element css selector
	 * @param {string} result Expected text in given selector
	 */
	const getText = (done, element, result) => {
		helpers.waitForElement(element).then((elem) => {
			done();
			expect(elem).not.toBe(null);
			expect(
				elem.textContent
					.trim()
					.replace(/(\r\n|\n|\r)/gm, "")
					.replace(/[ ]+/g, " ")
			).toBe(result);
		});
	};

	/**
	 * @param {string} configFile path to configuration file
	 * @param {string} additionalMockData special data for mocking
	 * @param {string} callback callback
	 */
	const startApp = (configFile, additionalMockData, callback) => {
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
	};

	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("Current weather", () => {
		describe("Default configuration", () => {
			beforeAll((done) => {
				startApp("tests/configs/modules/weather/currentweather_default.js", {}, done);
			});

			it("should render wind speed and wind direction", (done) => {
				getText(done, ".weather .normal.medium span:nth-child(2)", "6 WSW"); // now "12"
			});

			it("should render temperature with icon", (done) => {
				getText(done, ".weather .large.light span.bright", "1.5°"); // now "1°C"
			});

			it("should render feels like temperature", (done) => {
				getText(done, ".weather .normal.medium.feelslike span.dimmed", "Feels like -5.6°"); // now "Feels like -6°C"
			});
		});

		describe("Default configuration with sunrise", () => {
			beforeAll((done) => {
				const sunrise = moment().startOf("day").unix();
				const sunset = moment().startOf("day").unix();
				startApp("tests/configs/modules/weather/currentweather_default.js", { sys: { sunrise, sunset } }, done);
			});

			it("should render sunrise", (done) => {
				getText(done, ".weather .normal.medium span:nth-child(4)", "12:00 am");
			});
		});

		describe("Default configuration with sunset", () => {
			beforeAll((done) => {
				const sunrise = moment().startOf("day").unix();
				const sunset = moment().endOf("day").unix();
				startApp("tests/configs/modules/weather/currentweather_default.js", { sys: { sunrise, sunset } }, done);
			});

			it("should render sunset", (done) => {
				getText(done, ".weather .normal.medium span:nth-child(4)", "11:59 pm");
			});
		});
	});

	describe("Compliments Integration", () => {
		beforeAll((done) => {
			startApp("tests/configs/modules/weather/currentweather_compliments.js", {}, done);
		});

		it("should render a compliment based on the current weather", (done) => {
			getText(done, ".compliments .module-content span", "snow");
		});
	});

	describe("Configuration Options", () => {
		beforeAll((done) => {
			startApp("tests/configs/modules/weather/currentweather_options.js", {}, done);
		});

		it("should render useBeaufort = false", (done) => {
			getText(done, ".weather .normal.medium span:nth-child(2)", "12");
		});

		it("should render showWindDirectionAsArrow = true", (done) => {
			helpers.waitForElement(".weather .normal.medium sup i.fa-long-arrow-alt-up").then((elem) => {
				done();
				expect(elem).not.toBe(null);
				expect(elem.outerHTML).toContain("transform:rotate(250deg);");
			});
		});

		it("should render showHumidity = true", (done) => {
			getText(done, ".weather .normal.medium span:nth-child(3)", "93.7");
		});

		it("should render degreeLabel = true for temp", (done) => {
			getText(done, ".weather .large.light span.bright", "1°C");
		});

		it("should render degreeLabel = true for feels like", (done) => {
			getText(done, ".weather .normal.medium.feelslike span.dimmed", "Feels like -6°C");
		});
	});

	describe("Current weather units", () => {
		beforeAll((done) => {
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

		it("should render imperial units for wind", (done) => {
			getText(done, ".weather .normal.medium span:nth-child(2)", "6 WSW");
		});

		it("should render imperial units for temp", (done) => {
			getText(done, ".weather .large.light span.bright", "34,7°");
		});

		it("should render imperial units for feels like", (done) => {
			getText(done, ".weather .normal.medium.feelslike span.dimmed", "Feels like 22,0°");
		});

		it("should render custom decimalSymbol = ',' for humidity", (done) => {
			getText(done, ".weather .normal.medium span:nth-child(3)", "93,7");
		});

		it("should render custom decimalSymbol = ',' for temp", (done) => {
			getText(done, ".weather .large.light span.bright", "34,7°");
		});

		it("should render custom decimalSymbol = ',' for feels like", (done) => {
			getText(done, ".weather .normal.medium.feelslike span.dimmed", "Feels like 22,0°");
		});
	});

	describe("Weather Forecast", () => {
		describe("Default configuration", () => {
			beforeAll((done) => {
				startApp("tests/configs/modules/weather/forecastweather_default.js", {}, done);
			});

			const days = ["Today", "Tomorrow", "Sun", "Mon", "Tue"];
			for (const [index, day] of days.entries()) {
				it("should render day " + day, (done) => {
					getText(done, `.weather table.small tr:nth-child(${index + 1}) td:nth-child(1)`, day);
				});
			}

			const icons = ["day-cloudy", "rain", "day-sunny", "day-sunny", "day-sunny"];
			for (const [index, icon] of icons.entries()) {
				it("should render icon " + icon, (done) => {
					helpers.waitForElement(`.weather table.small tr:nth-child(${index + 1}) td:nth-child(2) span.wi-${icon}`).then((elem) => {
						done();
						expect(elem).not.toBe(null);
					});
				});
			}

			const maxTemps = ["24.4°", "21.0°", "22.9°", "23.4°", "20.6°"];
			for (const [index, temp] of maxTemps.entries()) {
				it("should render max temperature " + temp, (done) => {
					getText(done, `.weather table.small tr:nth-child(${index + 1}) td:nth-child(3)`, temp);
				});
			}

			const minTemps = ["15.3°", "13.6°", "13.8°", "13.9°", "10.9°"];
			for (const [index, temp] of minTemps.entries()) {
				it("should render min temperature " + temp, (done) => {
					getText(done, `.weather table.small tr:nth-child(${index + 1}) td:nth-child(4)`, temp);
				});
			}

			const opacities = [1, 1, 0.8, 0.5333333333333333, 0.2666666666666667];
			for (const [index, opacity] of opacities.entries()) {
				it("should render fading of rows with opacity=" + opacity, (done) => {
					helpers.waitForElement(`.weather table.small tr:nth-child(${index + 1})`).then((elem) => {
						done();
						expect(elem).not.toBe(null);
						expect(elem.outerHTML).toContain(`<tr style="opacity: ${opacity};">`);
					});
				});
			}
		});

		describe("Absolute configuration", () => {
			beforeAll((done) => {
				startApp("tests/configs/modules/weather/forecastweather_absolute.js", {}, done);
			});

			const days = ["Fri", "Sat", "Sun", "Mon", "Tue"];
			for (const [index, day] of days.entries()) {
				it("should render day " + day, (done) => {
					getText(done, `.weather table.small tr:nth-child(${index + 1}) td:nth-child(1)`, day);
				});
			}
		});

		describe("Configuration Options", () => {
			beforeAll((done) => {
				startApp("tests/configs/modules/weather/forecastweather_options.js", {}, done);
			});

			it("should render custom table class", (done) => {
				helpers.waitForElement(".weather table.myTableClass").then((elem) => {
					done();
					expect(elem).not.toBe(null);
				});
			});

			it("should render colored rows", (done) => {
				helpers.waitForElement(".weather table.myTableClass").then((table) => {
					done();
					expect(table).not.toBe(null);
					expect(table.rows).not.toBe(null);
					expect(table.rows.length).toBe(5);
				});
			});
		});

		describe("Forecast weather units", () => {
			beforeAll((done) => {
				startApp("tests/configs/modules/weather/forecastweather_units.js", {}, done);
			});

			const temperatures = ["24_4°", "21_0°", "22_9°", "23_4°", "20_6°"];
			for (const [index, temp] of temperatures.entries()) {
				it("should render custom decimalSymbol = '_' for temp " + temp, (done) => {
					getText(done, `.weather table.small tr:nth-child(${index + 1}) td:nth-child(3)`, temp);
				});
			}
		});
	});
});
