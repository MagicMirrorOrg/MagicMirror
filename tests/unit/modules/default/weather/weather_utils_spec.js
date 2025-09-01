const weather = require("../../../../../modules/default/weather/weatherutils");
const WeatherUtils = require("../../../../../modules/default/weather/weatherutils");

describe("Weather utils tests", () => {
	describe("temperature conversion to imperial", () => {
		it("should convert temp correctly from Celsius to Celsius", () => {
			expect(Math.round(WeatherUtils.convertTemp(10, "metric"))).toBe(10);
		});

		it("should convert temp correctly from Celsius to Fahrenheit", () => {
			expect(Math.round(WeatherUtils.convertTemp(10, "imperial"))).toBe(50);
		});

		it("should convert temp correctly from Fahrenheit to Celsius", () => {
			expect(Math.round(WeatherUtils.convertTempToMetric(10))).toBe(-12);
		});
	});

	describe("windspeed conversion to beaufort", () => {
		it("should convert windspeed correctly from mps to beaufort", () => {
			expect(Math.round(WeatherUtils.convertWind(5, "beaufort"))).toBe(3);
			expect(Math.round(WeatherUtils.convertWind(300, "beaufort"))).toBe(12);
		});

		it("should convert windspeed correctly from mps to mps", () => {
			expect(WeatherUtils.convertWind(11.75, "FOOBAR")).toBe(11.75);
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
	});

	describe("wind direction conversion", () => {
		it("should convert wind direction correctly from cardinal to value", () => {
			expect(WeatherUtils.convertWindDirection("SSE")).toBe(157);
			expect(WeatherUtils.convertWindDirection("XXX")).toBeNull();
		});
	});

	describe("feelsLike calculation", () => {
		it("should return a calculated feelsLike info (negative value)", () => {
			expect(WeatherUtils.calculateFeelsLike(0, 20, 40)).toBe(-9.397005931555448);
		});

		it("should return a calculated feelsLike info (positive value)", () => {
			expect(WeatherUtils.calculateFeelsLike(30, 0, 60)).toBe(32.832032277777756);
		});
	});

	describe("precipitationUnit conversion", () => {
		it("should keep value and unit if outputUnit is undefined", () => {
			const values = [1, 2];
			const units = ["mm", "cm"];

			for (let i = 0; i < values.length; i++) {
				const result = weather.convertPrecipitationUnit(values[i], units[i], undefined);
				expect(result).toBe(`${values[i].toFixed(2)} ${units[i]}`);
			}
		});

		it("should keep value and unit if outputUnit is metric", () => {
			const values = [1, 2];
			const units = ["mm", "cm"];

			for (let i = 0; i < values.length; i++) {
				const result = weather.convertPrecipitationUnit(values[i], units[i], "metric");
				expect(result).toBe(`${values[i].toFixed(2)} ${units[i]}`);
			}
		});

		it("should use mm unit if input unit is undefined", () => {
			const values = [1, 2];

			for (let i = 0; i < values.length; i++) {
				const result = weather.convertPrecipitationUnit(values[i], undefined, "metric");
				expect(result).toBe(`${values[i].toFixed(2)} mm`);
			}
		});

		it("should convert value and unit if outputUnit is imperial", () => {
			const values = [1, 2];
			const units = ["mm", "cm"];
			const expectedValues = [0.04, 0.79];

			for (let i = 0; i < values.length; i++) {
				const result = weather.convertPrecipitationUnit(values[i], units[i], "imperial");
				expect(result).toBe(`${expectedValues[i]} in`);
			}
		});

		it("should round percentage values regardless of output units", () => {
			const values = [0.1, 2.22, 9.999];
			const output = [undefined, "imperial", "metric"];
			const result = ["0 %", "2 %", "10 %"];

			for (let i = 0; i < values.length; i++) {
				expect(weather.convertPrecipitationUnit(values[i], "%", output[i])).toBe(result[i]);
			}
		});
	});
});
