/* eslint no-multi-spaces: 0 */
const moment = require("moment-timezone");
const data = require("../../configs/data/weatherforecast_data.json");

describe("Functions module weatherforecast", function () {
	beforeAll(function () {
		Module = {};
		config = {};
		Module.definitions = {};
		Module.register = function (name, moduleDefinition) {
			Module.definitions[name] = moduleDefinition;
		};
		require("../../../modules/default/weatherforecast/weatherforecast.js");
		Module.definitions.weatherforecast.config = {};
	});

	describe("roundValue", function () {
		describe("this.config.roundTemp is true", function () {
			beforeAll(function () {
				Module.definitions.weatherforecast.config.roundTemp = true;
			});

			const values = [
				// index 0 value
				// index 1 expect
				[1, "1"],
				[1.0, "1"],
				[1.02, "1"],
				[10.12, "10"],
				[2.0, "2"],
				["2.12", "2"],
				[10.1, "10"]
			];

			values.forEach((value) => {
				it(`for ${value[0]} should be return ${value[1]}`, function () {
					expect(Module.definitions.weatherforecast.roundValue(value[0])).toBe(value[1]);
				});
			});
		});

		describe("this.config.roundTemp is false", function () {
			beforeAll(function () {
				Module.definitions.weatherforecast.config.roundTemp = false;
			});

			const values = [
				// index 0 value
				// index 1 expect
				[1, "1.0"],
				[1.0, "1.0"],
				[1.02, "1.0"],
				[10.12, "10.1"],
				[2.0, "2.0"],
				["2.12", "2.1"],
				[10.1, "10.1"],
				[10.1, "10.1"]
			];

			values.forEach((value) => {
				it(`for ${value[0]} should be return ${value[1]}`, function () {
					expect(Module.definitions.weatherforecast.roundValue(value[0])).toBe(value[1]);
				});
			});
		});
	});

	describe("forecastIcons", function () {
		Log = {
			error: function () {}
		};

		let originalLocale;
		let originalTimeZone;
		beforeAll(function () {
			originalLocale = moment.locale();
			originalTimeZone = moment.tz.guess();
			moment.locale("hi");
			moment.tz.setDefault("Europe/Warsaw");
		});

		describe("forecastIcons sunset specified", function () {
			beforeAll(function () {
				Module.definitions.weatherforecast.Log = {};
				Module.definitions.weatherforecast.forecast = [];
				Module.definitions.weatherforecast.show = Module.definitions.weatherforecast.updateDom = function () {};
				Module.definitions.weatherforecast.config = Module.definitions.weatherforecast.defaults;
			});

			it(`returns correct icons with sunset time`, function () {
				Module.definitions.weatherforecast.processWeather(data.withSunset, moment);
				let forecastData = Module.definitions.weatherforecast.forecast;
				expect(forecastData.length).toBe(4);
				expect(forecastData[2].icon).toBe("wi-rain");
			});
		});

		describe("forecastIcons sunset not specified", function () {
			beforeAll(function () {
				Module.definitions.weatherforecast.forecast = [];
			});

			it(`returns correct icons with out sunset time`, function () {
				Module.definitions.weatherforecast.processWeather(data.withoutSunset, moment);
				let forecastData = Module.definitions.weatherforecast.forecast;
				expect(forecastData.length).toBe(4);
				expect(forecastData[2].icon).toBe("wi-rain");
			});
		});

		afterAll(function () {
			moment.locale(originalLocale);
			moment.tz.setDefault(originalTimeZone);
		});
	});
});
