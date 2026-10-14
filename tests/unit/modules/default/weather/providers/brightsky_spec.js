/**
 * Bright Sky Provider Tests
 *
 * Tests data parsing for current, forecast, and hourly weather types.
 * Bright Sky serves DWD data, no API key required.
 */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import currentFixture from "../../../../../mocks/weather_brightsky_current.json" with { type: "json" };
import weatherFixture from "../../../../../mocks/weather_brightsky_weather.json" with { type: "json" };

const BRIGHTSKY_CURRENT_URL = "https://api.brightsky.dev/current_weather";
const BRIGHTSKY_WEATHER_URL = "https://api.brightsky.dev/weather";
const GEOCODE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

/**
 * Formats a local date as an ISO timestamp with offset, like Bright Sky does.
 * @param {Date} date The date to format
 * @returns {string} ISO 8601 timestamp with UTC offset
 */
const toIsoWithOffset = (date) => {
	const pad = (value) => String(Math.abs(value)).padStart(2, "0");
	const offset = -date.getTimezoneOffset();
	const sign = offset >= 0 ? "+" : "-";
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:00:00${sign}${pad(Math.trunc(offset / 60))}:${pad(offset % 60)}`;
};

/**
 * Builds hourly Bright Sky records for consecutive hours.
 * @param {Date} start Timestamp of the first record
 * @param {number} hours Number of records
 * @param {(index: number) => object} [overrides] Per-record field overrides
 * @returns {object[]} Weather records
 */
const buildRecords = (start, hours, overrides = () => ({})) => Array.from({ length: hours }, (_, index) => {
	const date = new Date(start);
	date.setHours(start.getHours() + index);
	return {
		timestamp: toIsoWithOffset(date),
		temperature: 10 + index * 0.1,
		relative_humidity: 70,
		precipitation: 0.2,
		precipitation_probability: 10,
		wind_speed: 18,
		wind_direction: 200,
		icon: "cloudy",
		...overrides(index)
	};
});

/**
 * Starts a provider and resolves with the first data delivered.
 * @param {object} provider The provider instance
 * @returns {Promise<object>} The weather data
 */
const fetchOnce = async (provider) => {
	const dataPromise = new Promise((resolve, reject) => {
		provider.setCallbacks(resolve, reject);
	});
	await provider.initialize();
	provider.start();
	return dataPromise;
};

let server;
let requestedUrls;

beforeAll(() => {
	server = setupServer();
	server.listen({ onUnhandledRequest: "bypass" });
});

afterAll(() => {
	server.close();
});

afterEach(() => {
	server.resetHandlers();
	vi.useRealTimers();
});

describe("BrightSkyProvider", () => {
	let BrightSkyProvider;

	beforeAll(async () => {
		const module = await import("../../../../../../defaultmodules/weather/providers/brightsky");
		BrightSkyProvider = module.default;
	});

	/**
	 * Registers Bright Sky and geocoding mock handlers.
	 * @param {object} weatherResponse Body for /weather
	 * @param {object} [currentResponse] Body for /current_weather
	 */
	const mockApi = (weatherResponse, currentResponse = {}) => {
		requestedUrls = [];
		server.use(
			http.get(GEOCODE_URL, () => HttpResponse.json({ city: "Berlin", principalSubdivisionCode: "DE-BE" })),
			http.get(BRIGHTSKY_WEATHER_URL, ({ request }) => {
				requestedUrls.push(new URL(request.url));
				return HttpResponse.json(weatherResponse);
			}),
			http.get(BRIGHTSKY_CURRENT_URL, ({ request }) => {
				requestedUrls.push(new URL(request.url));
				return HttpResponse.json(currentResponse);
			})
		);
	};

	describe("Constructor & Configuration", () => {
		it("should apply defaults and merge params", () => {
			const provider = new BrightSkyProvider({ lat: 48.83, lon: 9.07, type: "hourly" });
			expect(provider.config.apiBase).toBe("https://api.brightsky.dev");
			expect(provider.config.lat).toBe(48.83);
			expect(provider.config.type).toBe("hourly");
			expect(provider.config.updateInterval).toBe(10 * 60 * 1000);
		});

		it("should call the error callback when coordinates are missing", async () => {
			const provider = new BrightSkyProvider({ lat: null, lon: null });
			const onError = vi.fn();
			provider.setCallbacks(vi.fn(), onError);
			await provider.initialize();
			expect(onError).toHaveBeenCalledWith(expect.objectContaining({ translationKey: "MODULE_ERROR_UNSPECIFIED" }));
			expect(provider.fetcher).toBeNull();
		});
	});

	describe("Current Weather Parsing", () => {
		it("should parse current weather and set the location name", async () => {
			mockApi({}, {
				weather: {
					timestamp: toIsoWithOffset(new Date()),
					temperature: 15.1,
					relative_humidity: 83,
					precipitation_10: 0,
					precipitation_60: 0.4,
					wind_speed_10: 3.2,
					wind_speed_60: 7.2,
					wind_direction_10: 50,
					wind_direction_60: 10,
					icon: "rain"
				}
			});
			const provider = new BrightSkyProvider({ lat: 48.83, lon: 9.07, type: "current" });
			const result = await fetchOnce(provider);

			expect(provider.locationName).toBe("Berlin, DE-BE");
			expect(requestedUrls[0].pathname).toBe("/current_weather");
			expect(result.temperature).toBe(15.1);
			expect(result.humidity).toBe(83);
			expect(result.windSpeed).toBeCloseTo(2, 5);
			expect(result.windFromDirection).toBe(10);
			expect(result.precipitationAmount).toBe(0.4);
			expect(result.precipitationUnits).toBe("mm");
			expect(result.sunrise).toBeInstanceOf(Date);
			expect(["day-rain", "night-alt-rain"]).toContain(result.weatherType);
		});
	});

	describe("Hourly Parsing", () => {
		it("should skip past hours and convert units", async () => {
			const start = new Date();
			start.setMinutes(0, 0, 0);
			start.setHours(start.getHours() - 2);
			mockApi({ weather: buildRecords(start, 6) });

			const provider = new BrightSkyProvider({ lat: 48.83, lon: 9.07, type: "hourly", maxEntries: 12 });
			const result = await fetchOnce(provider);

			expect(result).toHaveLength(3);
			expect(result.every((hour) => hour.date > new Date())).toBe(true);
			expect(result[0].windSpeed).toBeCloseTo(5, 5);
			expect(result[0].precipitationProbability).toBe(10);
			expect(result[0].precipitationUnits).toBe("mm");
		});

		it("should request today's records from local midnight", async () => {
			mockApi({ weather: [] });
			const provider = new BrightSkyProvider({ lat: 48.83, lon: 9.07, type: "hourly", maxEntries: 24 });
			await fetchOnce(provider);

			const midnight = new Date();
			midnight.setHours(0, 0, 0, 0);
			expect(new Date(requestedUrls[0].searchParams.get("date")).getTime()).toBe(midnight.getTime());
			expect(new Date(requestedUrls[0].searchParams.get("last_date")).getTime()).toBeGreaterThan(Date.now() + 23 * 60 * 60 * 1000);
		});

		it("should request enough days for maxEntries beyond 48", async () => {
			vi.useFakeTimers({ toFake: ["Date"] });
			vi.setSystemTime(new Date(2026, 9, 3, 8));
			mockApi({ weather: [] });

			const provider = new BrightSkyProvider({ lat: 48.83, lon: 9.07, type: "hourly", maxEntries: 72 });
			await fetchOnce(provider);

			expect(new Date(requestedUrls[0].searchParams.get("last_date")).getTime()).toBe(new Date(2026, 9, 7).getTime());
		});
	});

	describe("Daily Forecast Parsing", () => {
		it("should aggregate complete days and keep today even late in the evening", async () => {
			vi.useFakeTimers({ toFake: ["Date"] });
			const now = new Date(2026, 9, 3, 23, 30);
			vi.setSystemTime(now);
			const midnight = new Date(2026, 9, 3, 1);
			mockApi({
				weather: buildRecords(midnight, 48, (index) => ({
					temperature: index < 24 ? 10 + index : 30 + index,
					precipitation: index < 24 ? 0.5 : 0,
					icon: index < 24 ? "rain" : "clear-day"
				}))
			});

			const provider = new BrightSkyProvider({ lat: 48.83, lon: 9.07, type: "forecast", maxNumberOfDays: 2 });
			const result = await fetchOnce(provider);

			expect(result).toHaveLength(2);
			expect(result[0].date.getDate()).toBe(3);
			expect(result[0].minTemperature).toBe(10);
			expect(result[0].maxTemperature).toBe(33);
			expect(result[0].precipitationAmount).toBeCloseTo(12, 5);
			expect(result[0].weatherType).toBe("day-rain");
			expect(result[1].date.getDate()).toBe(4);
			expect(result[1].weatherType).toBe("day-sunny");
		});

		it("should assign the midnight record to the previous day", async () => {
			vi.useFakeTimers({ toFake: ["Date"] });
			vi.setSystemTime(new Date(2026, 9, 3, 8));
			mockApi({
				weather: [
					...buildRecords(new Date(2026, 9, 3, 23), 1, () => ({ precipitation: 1 })),
					...buildRecords(new Date(2026, 9, 4, 0), 1, () => ({ precipitation: 2 })),
					...buildRecords(new Date(2026, 9, 4, 1), 1, () => ({ precipitation: 4 }))
				]
			});

			const provider = new BrightSkyProvider({ lat: 48.83, lon: 9.07, type: "forecast", maxNumberOfDays: 2 });
			const result = await fetchOnce(provider);

			expect(result.map((day) => day.precipitationAmount)).toEqual([3, 4]);
		});

		it("should request exactly maxNumberOfDays days from local midnight", async () => {
			vi.useFakeTimers({ toFake: ["Date"] });
			vi.setSystemTime(new Date(2026, 9, 3, 8));
			mockApi({ weather: [] });

			const provider = new BrightSkyProvider({ lat: 48.83, lon: 9.07, type: "forecast", maxNumberOfDays: 3 });
			await fetchOnce(provider);

			expect(new Date(requestedUrls[0].searchParams.get("date")).getTime()).toBe(new Date(2026, 9, 3).getTime());
			expect(new Date(requestedUrls[0].searchParams.get("last_date")).getTime()).toBe(new Date(2026, 9, 6).getTime());
		});

		it("should pick the most severe icon when daytime icons are tied", async () => {
			vi.useFakeTimers({ toFake: ["Date"] });
			vi.setSystemTime(new Date(2026, 9, 3, 8));
			mockApi({
				weather: buildRecords(new Date(2026, 9, 3, 11), 4, (index) => ({ icon: index < 2 ? "cloudy" : "rain" }))
			});

			const provider = new BrightSkyProvider({ lat: 48.83, lon: 9.07, type: "forecast", maxNumberOfDays: 1 });
			const result = await fetchOnce(provider);

			expect(result[0].weatherType).toBe("day-rain");
		});
	});

	describe("Real API responses", () => {
		// Fixtures use selected real Bright Sky records for Berlin (2026-10-12, UTC+2)
		const originalTz = process.env.TZ;
		const berlin = { lat: 52.52, lon: 13.41 };

		beforeAll(() => {
			process.env.TZ = "Europe/Berlin";
		});

		afterAll(() => {
			if (originalTz === undefined) {
				delete process.env.TZ;
			} else {
				process.env.TZ = originalTz;
			}
		});

		it("should parse a current_weather response", async () => {
			mockApi({}, currentFixture);
			const result = await fetchOnce(new BrightSkyProvider({ ...berlin, type: "current" }));

			expect(result.date.toISOString()).toBe("2026-10-11T22:30:00.000Z");
			expect(result.temperature).toBe(9.7);
			expect(result.humidity).toBe(91);
			expect(result.windSpeed).toBeCloseTo(15.1 / 3.6, 5);
			expect(result.windFromDirection).toBe(263);
			expect(result.precipitationAmount).toBe(0);
			expect(result.precipitationUnits).toBe("mm");
			expect(result.weatherType).toBe("cloudy");
		});

		it("should parse an hourly weather response", async () => {
			vi.useFakeTimers({ toFake: ["Date"] });
			vi.setSystemTime(new Date("2026-10-12T08:30:00+02:00"));
			mockApi(weatherFixture);
			const result = await fetchOnce(new BrightSkyProvider({ ...berlin, type: "hourly" }));

			expect(result).toHaveLength(5);
			expect(result[0].date.toISOString()).toBe("2026-10-12T07:00:00.000Z");
			expect(result[0].temperature).toBe(7.8);
			expect(result[0].humidity).toBeNull();
			expect(result[0].windSpeed).toBeCloseTo(14.8 / 3.6, 5);
			expect(result[0].precipitationProbability).toBe(2);
			expect(result[0].weatherType).toBe("day-cloudy");
		});

		it("should aggregate a weather response into two days", async () => {
			vi.useFakeTimers({ toFake: ["Date"] });
			vi.setSystemTime(new Date("2026-10-12T08:30:00+02:00"));
			mockApi(weatherFixture);
			const result = await fetchOnce(new BrightSkyProvider({ ...berlin, type: "forecast", maxNumberOfDays: 5 }));

			expect(result).toHaveLength(2);

			expect(result[0].date.getDate()).toBe(12);
			expect(result[0].minTemperature).toBe(5.1);
			expect(result[0].maxTemperature).toBe(11.2);
			expect(result[0].precipitationAmount).toBe(0);
			expect(result[0].precipitationProbability).toBe(2);
			expect(result[0].windSpeed).toBeCloseTo(14.8 / 3.6, 5);
			expect(result[0].weatherType).toBe("day-cloudy");

			expect(result[1].date.getDate()).toBe(13);
			expect(result[1].minTemperature).toBe(4.5);
			expect(result[1].maxTemperature).toBe(4.6);
			expect(result[1].precipitationAmount).toBe(0);
			expect(result[1].precipitationProbability).toBe(2);
			expect(result[1].windSpeed).toBeCloseTo(7.4 / 3.6, 5);
			expect(result[1].weatherType).toBe("day-cloudy");
		});
	});

	describe("Error Handling", () => {
		it("should call the error callback on an invalid API response", async () => {
			mockApi({ unexpected: true });
			const provider = new BrightSkyProvider({ lat: 48.83, lon: 9.07, type: "forecast" });

			const errorPromise = new Promise((resolve) => {
				provider.setCallbacks(vi.fn(), resolve);
			});
			await provider.initialize();
			provider.start();

			const error = await errorPromise;
			expect(error).toHaveProperty("message");
			expect(error).toHaveProperty("translationKey");
		});
	});
});
