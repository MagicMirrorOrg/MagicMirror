/* eslint no-multi-spaces: 0 */
const expect = require("chai").expect;
const moment = require("moment-timezone");
var data = require("../functions/weatherforecast_data.json");

describe("Functions module weatherforecast", function () {
	before(function () {
		Module = {};
		config = {};
		Module.definitions = {};
		Module.register = function (name, moduleDefinition) {
			Module.definitions[name] = moduleDefinition;
		};
		require("../../../modules/default/weatherforecast/weatherforecast.js");
		Module.definitions.weatherforecast.config = {};
	});

	describe("forecastIcons", function () {
		Log = {
			error: function () {}
		};

		var originalLocale;
		var originalTimeZone;
		before(function () {
			originalLocale = moment.locale();
			originalTimeZone = moment.tz.guess();
			moment.locale("hi");
			moment.tz.setDefault("Europe/Warsaw");
		});

		describe("forecastIcons sunset specified", function () {
			before(function () {
				Module.definitions.weatherforecast.Log = {};
				Module.definitions.weatherforecast.forecast = [];
				Module.definitions.weatherforecast.show = Module.definitions.weatherforecast.updateDom = function () {};
				Module.definitions.weatherforecast.config = Module.definitions.weatherforecast.defaults;
			});

			it(`returns correct icons with sunset time`, function () {
				Module.definitions.weatherforecast.processWeather(data.withSunset);
				let forecastData = Module.definitions.weatherforecast.forecast;
				expect(forecastData.length).to.equal(4);
				expect(forecastData[2].icon).to.equal("wi-rain");
			});
		});

		describe("forecastIcons sunset not specified", function () {
			before(function () {
				Module.definitions.weatherforecast.forecast = [];
			});

			it(`returns correct icons with out sunset time`, function () {
				Module.definitions.weatherforecast.processWeather(data.withoutSunset);
				let forecastData = Module.definitions.weatherforecast.forecast;
				expect(forecastData.length).to.equal(4);
				expect(forecastData[2].icon).to.equal("wi-rain");
			});
		});

		after(function () {
			moment.locale(originalLocale);
			moment.tz.setDefault(originalTimeZone);
		});
	});
});
