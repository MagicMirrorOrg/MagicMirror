const moment = require("moment");
const helpers = require("../global-setup");
const weatherFunc = require("./weather-functions");

describe("Weather module", () => {
	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("Current weather", () => {
		describe("Default configuration", () => {
			beforeAll((done) => {
				weatherFunc.startApp("tests/configs/modules/weather/currentweather_default.js", {}, done);
			});

			it("should render wind speed and wind direction", (done) => {
				weatherFunc.getText(done, ".weather .normal.medium span:nth-child(2)", "6 WSW"); // now "12"
			});

			it("should render temperature with icon", (done) => {
				weatherFunc.getText(done, ".weather .large.light span.bright", "1.5°"); // now "1°C"
			});

			it("should render feels like temperature", (done) => {
				weatherFunc.getText(done, ".weather .normal.medium.feelslike span.dimmed", "Feels like -5.6°"); // now "Feels like -6°C"
			});
		});

		describe("Default configuration with sunrise", () => {
			beforeAll((done) => {
				const sunrise = moment().startOf("day").unix();
				const sunset = moment().startOf("day").unix();
				weatherFunc.startApp("tests/configs/modules/weather/currentweather_default.js", { sys: { sunrise, sunset } }, done);
			});

			it("should render sunrise", (done) => {
				weatherFunc.getText(done, ".weather .normal.medium span:nth-child(4)", "12:00 am");
			});
		});

		describe("Default configuration with sunset", () => {
			beforeAll((done) => {
				const sunrise = moment().startOf("day").unix();
				const sunset = moment().endOf("day").unix();
				weatherFunc.startApp("tests/configs/modules/weather/currentweather_default.js", { sys: { sunrise, sunset } }, done);
			});

			it("should render sunset", (done) => {
				weatherFunc.getText(done, ".weather .normal.medium span:nth-child(4)", "11:59 pm");
			});
		});
	});

	describe("Compliments Integration", () => {
		beforeAll((done) => {
			weatherFunc.startApp("tests/configs/modules/weather/currentweather_compliments.js", {}, done);
		});

		it("should render a compliment based on the current weather", (done) => {
			weatherFunc.getText(done, ".compliments .module-content span", "snow");
		});
	});

	describe("Configuration Options", () => {
		beforeAll((done) => {
			weatherFunc.startApp("tests/configs/modules/weather/currentweather_options.js", {}, done);
		});

		it("should render useBeaufort = false", (done) => {
			weatherFunc.getText(done, ".weather .normal.medium span:nth-child(2)", "12");
		});

		it("should render showWindDirectionAsArrow = true", (done) => {
			helpers.waitForElement(done, ".weather .normal.medium sup i.fa-long-arrow-alt-up").then((elem) => {
				expect(elem).not.toBe(null);
				expect(elem.outerHTML).toContain("transform:rotate(250deg);");
			});
		});

		it("should render showHumidity = true", (done) => {
			weatherFunc.getText(done, ".weather .normal.medium span:nth-child(3)", "93.7");
		});

		it("should render degreeLabel = true for temp", (done) => {
			weatherFunc.getText(done, ".weather .large.light span.bright", "1°C");
		});

		it("should render degreeLabel = true for feels like", (done) => {
			weatherFunc.getText(done, ".weather .normal.medium.feelslike span.dimmed", "Feels like -6°C");
		});
	});

	describe("Current weather units", () => {
		beforeAll((done) => {
			weatherFunc.startApp(
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
			weatherFunc.getText(done, ".weather .normal.medium span:nth-child(2)", "6 WSW");
		});

		it("should render imperial units for temp", (done) => {
			weatherFunc.getText(done, ".weather .large.light span.bright", "34,7°");
		});

		it("should render imperial units for feels like", (done) => {
			weatherFunc.getText(done, ".weather .normal.medium.feelslike span.dimmed", "Feels like 22,0°");
		});

		it("should render custom decimalSymbol = ',' for humidity", (done) => {
			weatherFunc.getText(done, ".weather .normal.medium span:nth-child(3)", "93,7");
		});

		it("should render custom decimalSymbol = ',' for temp", (done) => {
			weatherFunc.getText(done, ".weather .large.light span.bright", "34,7°");
		});

		it("should render custom decimalSymbol = ',' for feels like", (done) => {
			weatherFunc.getText(done, ".weather .normal.medium.feelslike span.dimmed", "Feels like 22,0°");
		});
	});
});
