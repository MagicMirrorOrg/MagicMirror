/**
 * Yr.no Weather Provider Tests
 *
 * Tests data parsing for current, forecast, and hourly weather types.
 * Yr.no is the Norwegian Meteorological Institute API.
 *
 * Uses fake timers to ensure deterministic timeseries selection.
 * The provider picks the closest past entry from timeseries based on new Date().
 * Fixed to 2026-02-06T21:30:00Z → selects timeseries[0] at 21:00 with T=-5.8°C.
 */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll, afterEach } from "vitest";

import yrData from "../../../../../mocks/weather_yr.json" with { type: "json" };

const YR_FORECAST_URL = "https://api.met.no/weatherapi/locationforecast/**";

// Fixed time: 30 minutes after the first timeseries entry (2026-02-06T21:00:00Z)
// This ensures timeseries[0] is always chosen as the closest past entry.
const FAKE_NOW = new Date("2026-02-06T21:30:00Z");

let server;

beforeAll(() => {
	server = setupServer(
		http.get(({ request }) => request.url.includes("/locationforecast/"), () => {
			return HttpResponse.json(yrData);
		}),
		http.get(({ request }) => request.url.includes("/sunrise/"), () => {
			return HttpResponse.json({
				when: { interval: ["2026-02-06T00:00:00+01:00"] },
				properties: {
					sunrise: { time: "2026-02-06T08:30:00+01:00" },
					sunset: { time: "2026-02-06T16:30:00+01:00" }
				}
			});
		})
	);
	server.listen({ onUnhandledRequest: "bypass" });
});

afterAll(() => {
	server.close();
});

beforeEach(() => {
	vi.useFakeTimers({ now: FAKE_NOW });
});

afterEach(() => {
	vi.useRealTimers();
	server.resetHandlers();
});

describe("YrProvider", () => {
	let YrProvider;

	beforeAll(async () => {
		const module = await import("../../../../../../defaultmodules/weather/providers/yr");
		YrProvider = module.default;
	});

	describe("Constructor & Configuration", () => {
		it("should set config values from params", () => {
			const provider = new YrProvider({
				lat: 59.91,
				lon: 10.72,
				altitude: 94
			});
			expect(provider.config.lat).toBe(59.91);
			expect(provider.config.lon).toBe(10.72);
			expect(provider.config.altitude).toBe(94);
		});

		it("should enforce minimum 10-minute update interval", () => {
			const provider = new YrProvider({
				updateInterval: 60000 // 1 minute - too short
			});
			expect(provider.config.updateInterval).toBe(600000);
		});

		it("should allow intervals >= 10 minutes", () => {
			const provider = new YrProvider({
				updateInterval: 900000 // 15 minutes
			});
			expect(provider.config.updateInterval).toBe(900000);
		});
	});

	describe("Coordinate Validation", () => {
		it("should limit coordinates to 4 decimal places", async () => {
			const provider = new YrProvider({
				lat: 59.91234567,
				lon: 10.72345678
			});
			provider.setCallbacks(vi.fn(), vi.fn());

			server.use(
				http.get(YR_FORECAST_URL, () => {
					return HttpResponse.json(yrData);
				})
			);

			await provider.initialize();

			expect(provider.config.lat.toString().split(".")[1]?.length).toBeLessThanOrEqual(4);
			expect(provider.config.lon.toString().split(".")[1]?.length).toBeLessThanOrEqual(4);
		});
	});

	describe("Current Weather Parsing", () => {
		it("should parse current weather from timeseries", async () => {
			const provider = new YrProvider({
				lat: 59.91,
				lon: 10.72,
				type: "current"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(YR_FORECAST_URL, () => {
					return HttpResponse.json(yrData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(result).toBeDefined();
			// With fake time at 21:30, provider selects timeseries[0] (21:00 UTC)
			expect(result.temperature).toBe(-5.8);
			expect(result.windSpeed).toBe(6.0);
			expect(result.windFromDirection).toBe(37.0);
			expect(result.humidity).toBe(66.5);
			// 21:00 is after sunset (16:30), symbol_code "snow" maps to "snow"
			expect(result.weatherType).toBe("snow");
		});

		it("should include sunrise/sunset from stellar data", async () => {
			const provider = new YrProvider({
				lat: 59.91,
				lon: 10.72,
				type: "current"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(result).toBeDefined();
			expect(result.sunrise).toBeInstanceOf(Date);
			expect(result.sunset).toBeInstanceOf(Date);
			expect(result.sunset.getTime()).toBeGreaterThan(result.sunrise.getTime());
		});
	});

	describe("Forecast Parsing", () => {
		it("should parse daily forecast data", async () => {
			const provider = new YrProvider({
				lat: 59.91,
				lon: 10.72,
				type: "forecast"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(YR_FORECAST_URL, () => {
					return HttpResponse.json(yrData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);

			const day = result[0];
			expect(day).toHaveProperty("date");
			expect(day).toHaveProperty("minTemperature");
			expect(day).toHaveProperty("maxTemperature");
			expect(day.minTemperature).toBeLessThanOrEqual(day.maxTemperature);
		});
	});

	describe("Hourly Parsing", () => {
		it("should parse hourly forecast data", async () => {
			const provider = new YrProvider({
				lat: 59.91,
				lon: 10.72,
				type: "hourly"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(YR_FORECAST_URL, () => {
					return HttpResponse.json(yrData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);

			const hour = result[0];
			expect(hour).toHaveProperty("temperature");
			expect(hour).toHaveProperty("windSpeed");
			expect(hour).toHaveProperty("precipitationAmount");
			expect(hour).toHaveProperty("weatherType");
		});
	});

	describe("Error Handling", () => {
		it("should call error callback on invalid data", async () => {
			const provider = new YrProvider({
				lat: 59.91,
				lon: 10.72,
				type: "current"
			});

			const errorPromise = new Promise((resolve) => {
				provider.setCallbacks(vi.fn(), resolve);
			});

			server.use(
				http.get(YR_FORECAST_URL, () => {
					return HttpResponse.json({ properties: {} });
				})
			);

			await provider.initialize();
			provider.start();

			const error = await errorPromise;
			expect(error).toHaveProperty("message");
		});
	});

	describe("Weather Type Conversion", () => {
		it("should convert yr symbol codes correctly", async () => {
			const provider = new YrProvider({
				lat: 59.91,
				lon: 10.72,
				type: "current",
				currentForecastHours: 1
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			// Uses yrData from beforeAll which has symbol_code "snow"

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			// 21:00 is after sunset (16:30), next_1_hours symbol_code is "snow"
			expect(result.weatherType).toBe("snow");
		});
	});
});
