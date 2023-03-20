const WeatherObject = require("../../../modules/default/weather/weatherobject");
const WeatherUtils = require("../../../modules/default/weather/weatherutils");

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

describe("WeatherUtils", () => {
	it("should convert windspeed correctly from mps to beaufort", () => {
		expect(Math.round(WeatherUtils.convertWind(5, "beaufort"))).toBe(3);
		expect(Math.round(WeatherUtils.convertWind(300, "beaufort"))).toBe(12);
	});

	it("should convert windspeed correctly from mps to kmh", () => {
		expect(Math.round(WeatherUtils.convertWind(11.75, "kmh"))).toBe(42);
	});

	it("should convert windspeed correctly from mps to knots", () => {
		expect(Math.round(WeatherUtils.convertWind(10, "knots"))).toBe(19);
	});

	it("should convert windspeed correctly from mph to mps", () => {
		expect(Math.round(WeatherUtils.convertWindToMetric(93.951324266285))).toBe(42);
	});

	it("should convert windspeed correctly from kmh to mps", () => {
		expect(Math.round(WeatherUtils.convertWindToMs(151.2))).toBe(42);
	});

	it("should convert wind direction correctly from cardinal to value", () => {
		expect(WeatherUtils.convertWindDirection("SSE")).toBe(157);
	});

	it("should return a calculated feelsLike info", () => {
		expect(WeatherUtils.calculateFeelsLike(0, 20, 40)).toBe(-9.444444444444445);
	});

	it("should return a calculated feelsLike info", () => {
		expect(WeatherUtils.calculateFeelsLike(30, 0, 60)).toBe(32.8320322777777);
	});
});
