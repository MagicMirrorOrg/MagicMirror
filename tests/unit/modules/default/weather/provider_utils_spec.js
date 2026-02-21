const defaults = require("../../../../../js/defaults");

const providerUtils = require(`../../../../../${defaults.defaultModulesDir}/weather/provider-utils`);

describe("Weather provider utils tests", () => {
	describe("convertWeatherType", () => {
		it("should convert OpenWeatherMap day icons correctly", () => {
			expect(providerUtils.convertWeatherType("01d")).toBe("day-sunny");
			expect(providerUtils.convertWeatherType("02d")).toBe("day-cloudy");
			expect(providerUtils.convertWeatherType("10d")).toBe("rain");
			expect(providerUtils.convertWeatherType("13d")).toBe("snow");
		});

		it("should convert OpenWeatherMap night icons correctly", () => {
			expect(providerUtils.convertWeatherType("01n")).toBe("night-clear");
			expect(providerUtils.convertWeatherType("02n")).toBe("night-cloudy");
			expect(providerUtils.convertWeatherType("10n")).toBe("night-rain");
		});

		it("should return null for unknown weather types", () => {
			expect(providerUtils.convertWeatherType("99x")).toBeNull();
			expect(providerUtils.convertWeatherType("")).toBeNull();
		});
	});

	describe("applyTimezoneOffset", () => {
		it("should apply positive offset correctly", () => {
			const date = new Date("2026-02-02T12:00:00Z");
			const result = providerUtils.applyTimezoneOffset(date, 120); // +2 hours
			// The function converts to UTC, then applies offset
			const expected = new Date(date.getTime() + date.getTimezoneOffset() * 60000 + 120 * 60000);
			expect(result.getTime()).toBe(expected.getTime());
		});

		it("should apply negative offset correctly", () => {
			const date = new Date("2026-02-02T12:00:00Z");
			const result = providerUtils.applyTimezoneOffset(date, -300); // -5 hours
			const expected = new Date(date.getTime() + date.getTimezoneOffset() * 60000 - 300 * 60000);
			expect(result.getTime()).toBe(expected.getTime());
		});

		it("should handle zero offset", () => {
			const date = new Date("2026-02-02T12:00:00Z");
			const result = providerUtils.applyTimezoneOffset(date, 0);
			const expected = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
			expect(result.getTime()).toBe(expected.getTime());
		});
	});

	describe("limitDecimals", () => {
		it("should truncate decimals correctly", () => {
			expect(providerUtils.limitDecimals(12.3456789, 4)).toBe(12.3456);
			expect(providerUtils.limitDecimals(12.3456789, 2)).toBe(12.34);
		});

		it("should handle values with fewer decimals than limit", () => {
			expect(providerUtils.limitDecimals(12.34, 6)).toBe(12.34);
			expect(providerUtils.limitDecimals(12, 4)).toBe(12);
		});

		it("should handle negative values", () => {
			expect(providerUtils.limitDecimals(-12.3456789, 2)).toBe(-12.34);
		});

		it("should truncate not round", () => {
			expect(providerUtils.limitDecimals(12.9999, 2)).toBe(12.99);
			expect(providerUtils.limitDecimals(12.9999, 0)).toBe(12);
		});
	});

	describe("getSunTimes", () => {
		it("should return sunrise and sunset times", () => {
			const date = new Date("2026-06-21T12:00:00Z"); // Summer solstice
			const lat = 52.52; // Berlin
			const lon = 13.405;

			const result = providerUtils.getSunTimes(date, lat, lon);

			expect(result).toHaveProperty("sunrise");
			expect(result).toHaveProperty("sunset");
			expect(result.sunrise).toBeInstanceOf(Date);
			expect(result.sunset).toBeInstanceOf(Date);
			expect(result.sunrise.getTime()).toBeLessThan(result.sunset.getTime());
		});

		it("should handle different locations", () => {
			const date = new Date("2026-06-21T12:00:00Z");

			// London
			const london = providerUtils.getSunTimes(date, 51.5074, -0.1278);
			// Tokyo
			const tokyo = providerUtils.getSunTimes(date, 35.6762, 139.6503);

			expect(london.sunrise.getTime()).not.toBe(tokyo.sunrise.getTime());
		});
	});

	describe("isDayTime", () => {
		it("should return true when time is between sunrise and sunset", () => {
			const sunrise = new Date("2026-02-02T07:00:00Z");
			const sunset = new Date("2026-02-02T17:00:00Z");
			const noon = new Date("2026-02-02T12:00:00Z");

			expect(providerUtils.isDayTime(noon, sunrise, sunset)).toBe(true);
		});

		it("should return false when time is before sunrise", () => {
			const sunrise = new Date("2026-02-02T07:00:00Z");
			const sunset = new Date("2026-02-02T17:00:00Z");
			const night = new Date("2026-02-02T03:00:00Z");

			expect(providerUtils.isDayTime(night, sunrise, sunset)).toBe(false);
		});

		it("should return false when time is after sunset", () => {
			const sunrise = new Date("2026-02-02T07:00:00Z");
			const sunset = new Date("2026-02-02T17:00:00Z");
			const night = new Date("2026-02-02T20:00:00Z");

			expect(providerUtils.isDayTime(night, sunrise, sunset)).toBe(false);
		});

		it("should return true if sunrise/sunset are null", () => {
			const noon = new Date("2026-02-02T12:00:00Z");
			expect(providerUtils.isDayTime(noon, null, null)).toBe(true);
		});
	});

	describe("formatTimezoneOffset", () => {
		it("should format positive offsets correctly", () => {
			expect(providerUtils.formatTimezoneOffset(60)).toBe("+01:00");
			expect(providerUtils.formatTimezoneOffset(120)).toBe("+02:00");
			expect(providerUtils.formatTimezoneOffset(330)).toBe("+05:30"); // India
		});

		it("should format negative offsets correctly", () => {
			expect(providerUtils.formatTimezoneOffset(-300)).toBe("-05:00"); // EST
			expect(providerUtils.formatTimezoneOffset(-480)).toBe("-08:00"); // PST
		});

		it("should format zero offset correctly", () => {
			expect(providerUtils.formatTimezoneOffset(0)).toBe("+00:00");
		});

		it("should pad single digits with zero", () => {
			expect(providerUtils.formatTimezoneOffset(5)).toBe("+00:05");
			expect(providerUtils.formatTimezoneOffset(-5)).toBe("-00:05");
		});
	});

	describe("getDateString", () => {
		it("should format date as YYYY-MM-DD", () => {
			const date = new Date("2026-02-02T12:34:56Z");
			expect(providerUtils.getDateString(date)).toBe("2026-02-02");
		});

		it("should handle single-digit months and days correctly", () => {
			const date = new Date("2026-01-05T12:00:00Z");
			expect(providerUtils.getDateString(date)).toBe("2026-01-05");
		});

		it("should handle end of year", () => {
			const date = new Date("2025-12-31T23:59:59Z");
			expect(providerUtils.getDateString(date)).toBe("2025-12-31");
		});
	});
});
