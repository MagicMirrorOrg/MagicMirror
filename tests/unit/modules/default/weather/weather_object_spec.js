const WeatherObject = require("../../../../../modules/default/weather/weatherobject");

global.moment = require("moment-timezone");
global.SunCalc = require("suncalc");

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
		let midnight = moment("00:00", "HH:mm");
		expect(weatherobject.nextSunAction(midnight)).toBe("sunrise");
	});

	it("should return sunset as the next sunaction", () => {
		weatherobject.updateSunTime(-6.774877582342688, 37.63345667023327);
		let noon = moment(weatherobject.sunrise).hour(14);
		expect(weatherobject.nextSunAction(noon)).toBe("sunset");
	});

	it("should return an already defined feelsLike info", () => {
		weatherobject.feelsLikeTemp = "feelsLikeTempValue";
		expect(weatherobject.feelsLike()).toBe("feelsLikeTempValue");
	});

	afterAll(() => {
		moment.tz.setDefault(originalTimeZone);
	});
});
