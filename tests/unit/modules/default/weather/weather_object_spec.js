const defaults = require("../../../../../js/defaults");

const WeatherObject = require(`../../../../../${defaults.defaultModulesDir}/weather/weatherobject`);

global.moment = require("moment-timezone");
global.SunCalc = require("suncalc");

global.WeatherUtils = require(`../../../../../${defaults.defaultModulesDir}/weather/weatherutils`);

describe("WeatherObject", () => {
	let originalTimeZone;
	let weatherobject;

	beforeAll(() => {
		originalTimeZone = moment.tz.guess();
		moment.tz.setDefault("Africa/Dar_es_Salaam");
		weatherobject = new WeatherObject();
	});

	it("should return true for daytime at noon", () => {
		weatherobject.date = moment("12:00", "HH:mm");
		weatherobject.updateSunTime(-6.774877582342688, 37.63345667023327);
		expect(weatherobject.isDayTime()).toBe(true);
	});

	it("should return false for daytime at midnight", () => {
		weatherobject.date = moment("00:00", "HH:mm");
		weatherobject.updateSunTime(-6.774877582342688, 37.63345667023327);
		expect(weatherobject.isDayTime()).toBe(false);
	});

	it("should return sunrise as the next sunaction", () => {
		weatherobject.updateSunTime(-6.774877582342688, 37.63345667023327);
		const midnight = moment("00:00", "HH:mm");
		expect(weatherobject.nextSunAction(midnight)).toBe("sunrise");
	});

	it("should return sunset as the next sunaction", () => {
		weatherobject.updateSunTime(-6.774877582342688, 37.63345667023327);
		const noon = moment(weatherobject.sunrise).hour(14);
		expect(weatherobject.nextSunAction(noon)).toBe("sunset");
	});

	it("should return an already defined feelsLike info", () => {
		weatherobject.feelsLikeTemp = "feelsLikeTempValue";
		expect(weatherobject.feelsLike()).toBe("feelsLikeTempValue");
	});

	it("should preserve a provider's zero feels-like temperature", () => {
		const current = Object.assign(new WeatherObject(), {
			temperature: 12,
			windSpeed: 0,
			humidity: 50,
			feelsLikeTemp: 0
		});
		expect(current.feelsLike()).toBe(0);
	});

	it.each([null, undefined, NaN])("should calculate a fallback for %s", (feelsLikeTemp) => {
		const current = Object.assign(new WeatherObject(), {
			temperature: 12,
			windSpeed: 0,
			humidity: 50,
			feelsLikeTemp
		});
		expect(current.feelsLike()).toBeCloseTo(11.741);
	});

	afterAll(() => {
		moment.tz.setDefault(originalTimeZone);
	});
});
