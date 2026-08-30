/**
 * Buienradar Provider Tests
 *
 * Tests data parsing for current, forecast, and hourly weather types.
 * Buienradar covers NL/BE only, metric system, no API key required.
 */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";

const BUIENRADAR_URL = "https://forecast.buienradar.nl/2.0/forecast/*";

/**
 * Builds a stable Buienradar mock payload for parsing tests.
 * @returns {object} Buienradar forecast response fixture.
 */
function buildBuienradarResponse () {
	const today = "2100-01-01";
	const tomorrow = "2100-01-02";

	const makeHour = (datetime, overrides = {}) => ({
		datetime,
		temperature: 5,
		feeltemperature: 3,
		humidity: 80,
		windspeedms: 4,
		winddirectiondegrees: 180,
		precipitationmm: 0.5,
		precipitation: 60,
		iconcode: "a",
		...overrides
	});

	return {
		location: {
			name: "Rotterdam",
			lat: 51.92,
			lon: 4.48
		},
		days: [
			{
				date: today,
				sunrise: `${today}T07:00:00`,
				sunset: `${today}T17:00:00`,
				mintemp: 1,
				maxtemp: 8,
				humidity: 75,
				windspeedms: 5,
				winddirectiondegrees: 200,
				precipitationmm: 2.5,
				precipitation: 70,
				iconcode: "b",
				hours: [
					makeHour(`${today}T12:00:00`, { temperature: 6, iconcode: "a" }),
					makeHour(`${today}T13:00:00`, { temperature: 7, iconcode: "b" }),
					makeHour(`${today}T14:00:00`, { temperature: 7.5, iconcode: "c" })
				]
			},
			{
				date: tomorrow,
				sunrise: `${tomorrow}T07:01:00`,
				sunset: `${tomorrow}T17:02:00`,
				mintemp: 0,
				maxtemp: 6,
				windspeedms: 6,
				winddirectiondegrees: 220,
				precipitationmm: 1.0,
				precipitation: 40,
				iconcode: "f",
				hours: []
			}
		]
	};
}

let server;

beforeAll(() => {
	server = setupServer();
	server.listen({ onUnhandledRequest: "bypass" });
});

afterAll(() => {
	server.close();
});

afterEach(() => {
	server.resetHandlers();
});

describe("BuienradarProvider", () => {
	let BuienradarProvider;

	beforeAll(async () => {
		const module = await import("../../../../../../defaultmodules/weather/providers/buienradar");
		BuienradarProvider = module.default;
	});

	describe("Constructor & Configuration", () => {
		it("should apply defaults and merge params", () => {
			const provider = new BuienradarProvider({ locationId: 6275, type: "hourly" });
			expect(provider.config.apiBase).toBe("https://forecast.buienradar.nl/2.0/forecast");
			expect(provider.config.locationId).toBe(6275);
			expect(provider.config.type).toBe("hourly");
			expect(provider.config.updateInterval).toBe(10 * 60 * 1000);
		});

		it("should call error callback when locationId is missing", () => {
			const provider = new BuienradarProvider({});
			const onError = vi.fn();
			provider.setCallbacks(vi.fn(), onError);
			provider.initialize();
			expect(onError).toHaveBeenCalledWith(expect.objectContaining({
				translationKey: "MODULE_ERROR_UNSPECIFIED"
			}));
			expect(provider.fetcher).toBeNull();
		});
	});

	describe("Current Weather Parsing", () => {
		it("should parse current weather, set locationName, and merge day metadata", async () => {
			const provider = new BuienradarProvider({ locationId: 6275, type: "current" });

			const dataPromise = new Promise((resolve, reject) => {
				provider.setCallbacks(resolve, reject);
			});

			server.use(
				http.get(BUIENRADAR_URL, () => HttpResponse.json(buildBuienradarResponse()))
			);

			provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(provider.locationName).toBe("Rotterdam");
			expect(typeof result.temperature).toBe("number");
			expect(result.humidity).toBe(80);
			expect(result.windSpeed).toBe(4);
			expect(result.windFromDirection).toBe(180);
			expect(result.minTemperature).toBe(1);
			expect(result.maxTemperature).toBe(8);
			expect(result.precipitationAmount).toBe(0.5);
			expect(result.precipitationProbability).toBe(60);
			expect(result.precipitationUnits).toBe("mm");
			expect(result.sunrise).toBeInstanceOf(Date);
			expect(result.sunset).toBeInstanceOf(Date);
			expect(typeof result.weatherType).toBe("string");
		});
	});

	describe("Forecast Parsing", () => {
		it("should parse daily forecast data", async () => {
			const provider = new BuienradarProvider({ locationId: 6275, type: "forecast", maxEntries: 2 });

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(BUIENRADAR_URL, () => HttpResponse.json(buildBuienradarResponse()))
			);

			provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(2);

			expect(result[0].minTemperature).toBe(1);
			expect(result[0].maxTemperature).toBe(8);
			expect(result[0].humidity).toBe(75);
			expect(result[0].windSpeed).toBe(5);
			expect(result[0].windFromDirection).toBe(200);
			expect(result[0].precipitationAmount).toBe(2.5);
			expect(result[0].precipitationProbability).toBe(70);
			expect(result[0].sunrise).toBeInstanceOf(Date);
			expect(result[0].sunset).toBeInstanceOf(Date);
			expect(result[0].weatherType).toBe("day-cloudy");

			expect(result[1].minTemperature).toBe(0);
			expect(result[1].maxTemperature).toBe(6);
		});
	});

	describe("Hourly Parsing", () => {
		it("should parse hourly forecast data", async () => {
			const provider = new BuienradarProvider({ locationId: 6275, type: "hourly", maxEntries: 3 });

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(BUIENRADAR_URL, () => HttpResponse.json(buildBuienradarResponse()))
			);

			provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(3);
			expect(result[0].temperature).toBe(6);
			expect(result[0].feelsLikeTemp).toBe(3);
			expect(result[0].humidity).toBe(80);
			expect(result[0].windSpeed).toBe(4);
			expect(result[0].windFromDirection).toBe(180);
			expect(result[0].precipitationAmount).toBe(0.5);
			expect(result[0].precipitationProbability).toBe(60);
			expect(result[0].weatherType).toBe("day-sunny");
			expect(result[0].date).toBeInstanceOf(Date);

			expect(result[1].weatherType).toBe("day-cloudy");
			expect(result[2].weatherType).toBe("cloudy");
		});
	});

	describe("Error Handling", () => {
		it("should call error callback on invalid API response", async () => {
			const provider = new BuienradarProvider({ locationId: 6275, type: "current" });

			const errorPromise = new Promise((resolve) => {
				provider.setCallbacks(vi.fn(), resolve);
			});

			server.use(
				http.get(BUIENRADAR_URL, () => HttpResponse.json({ days: [] }))
			);

			provider.initialize();
			provider.start();

			const error = await errorPromise;
			expect(error).toHaveProperty("message");
			expect(error).toHaveProperty("translationKey");
		});
	});
});
