const WeatherObject = require("../../../modules/default/weather/weatherobject.js");

global.moment = require("moment");
global.SunCalc = require("suncalc");

describe("WeatherObject", function () {
	let weatherobject;

	beforeAll(function () {
		weatherobject = new WeatherObject("metric", "metric", "metric", true);
	});

	it("should return true for daytime at noon", function () {
		weatherobject.date = moment(12, "HH");
		weatherobject.updateSunTime(-6.774877582342688, 37.63345667023327);
		expect(weatherobject.isDayTime()).toBe(true);
	});

	it("should return false for daytime at midnight", function () {
		weatherobject.date = moment(0, "HH");
		weatherobject.updateSunTime(-6.774877582342688, 37.63345667023327);
		expect(weatherobject.isDayTime()).toBe(false);
	});
});
