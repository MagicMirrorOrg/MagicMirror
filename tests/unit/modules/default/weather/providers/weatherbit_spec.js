/**
 * Weatherbit Weather Provider Tests
 *
 * Tests data parsing for current, forecast, and hourly weather types.
 */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";

import currentData from "../../../../../mocks/weather_weatherbit.json" with { type: "json" };
import forecastData from "../../../../../mocks/weather_weatherbit_forecast.json" with { type: "json" };
import hourlyData from "../../../../../mocks/weather_weatherbit_hourly.json" with { type: "json" };

const WEATHERBIT_CURRENT_URL = "https://api.weatherbit.io/v2.0/current*";
const WEATHERBIT_FORECAST_URL = "https://api.weatherbit.io/v2.0/forecast/daily*";
const WEATHERBIT_HOURLY_URL = "https://api.weatherbit.io/v2.0/forecast/hourly*";

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

describe("WeatherbitProvider", () => {
	let WeatherbitProvider;

	beforeAll(async () => {
		const module = await import("../../../../../../defaultmodules/weather/providers/weatherbit");
		WeatherbitProvider = module.default || module;
	});

	describe("Constructor & Configuration", () => {
		it("should set config values from params", () => {
			const provider = new WeatherbitProvider({
				apiKey: "test-api-key",
				lat: 40.71,
				lon: -74.0,
				type: "current"
			});
			expect(provider.config.apiKey).toBe("test-api-key");
			expect(provider.config.lat).toBe(40.71);
			expect(provider.config.lon).toBe(-74.0);
		});

		it("should error if API key is missing", async () => {
			const provider = new WeatherbitProvider({
				lat: 40.71,
				lon: -74.0
			});

			const errorPromise = new Promise((resolve) => {
				provider.setCallbacks(vi.fn(), resolve);
			});

			await provider.initialize();

			const error = await errorPromise;
			expect(error.message).toContain("API key");
		});
	});

	describe("Current Weather Parsing", () => {
		it("should parse current weather data", async () => {
			const provider = new WeatherbitProvider({
				apiKey: "test-key",
				lat: 40.71,
				lon: -74.0,
				type: "current"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(WEATHERBIT_CURRENT_URL, () => {
					return HttpResponse.json(currentData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(result).toBeDefined();
			expect(result.temperature).toBe(1);
			expect(result.windSpeed).toBe(1.5);
			expect(result.windDirection).toBe(210);
			expect(result.humidity).toBe(47);
		});

		it("should parse sunrise/sunset from HH:mm format", async () => {
			const provider = new WeatherbitProvider({
				apiKey: "test-key",
				lat: 40.71,
				lon: -74.0,
				type: "current"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(WEATHERBIT_CURRENT_URL, () => {
					return HttpResponse.json(currentData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(result.sunrise).toBeInstanceOf(Date);
			expect(result.sunset).toBeInstanceOf(Date);
		});

		it("should convert icon code to weather type", async () => {
			const provider = new WeatherbitProvider({
				apiKey: "test-key",
				lat: 40.71,
				lon: -74.0,
				type: "current"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(WEATHERBIT_CURRENT_URL, () => {
					return HttpResponse.json(currentData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(result.weatherType).not.toBeNull();
		});
	});

	describe("Forecast Parsing", () => {
		it("should parse daily forecast data", async () => {
			const provider = new WeatherbitProvider({
				apiKey: "test-key",
				lat: 40.71,
				lon: -74.0,
				type: "forecast"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(WEATHERBIT_FORECAST_URL, () => {
					return HttpResponse.json(forecastData);
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
			expect(day).toHaveProperty("weatherType");
			expect(day).toHaveProperty("precipitationProbability");
		});
	});

	describe("Hourly Parsing", () => {
		it("should handle hourly API endpoint access error", async () => {
			const provider = new WeatherbitProvider({
				apiKey: "test-key",
				lat: 40.71,
				lon: -74.0,
				type: "hourly"
			});

			const errorPromise = new Promise((resolve) => {
				provider.setCallbacks(vi.fn(), resolve);
			});

			server.use(
				http.get(WEATHERBIT_HOURLY_URL, () => {
					return HttpResponse.json(hourlyData);
				})
			);

			await provider.initialize();
			provider.start();

			const error = await errorPromise;

			expect(error).toBeDefined();
			expect(error.message || error).toContain("No usable data");
		});
	});

	describe("Error Handling", () => {
		it("should handle invalid response", async () => {
			const provider = new WeatherbitProvider({
				apiKey: "test-key",
				lat: 40.71,
				lon: -74.0,
				type: "current"
			});

			const errorPromise = new Promise((resolve) => {
				provider.setCallbacks(vi.fn(), resolve);
			});

			server.use(
				http.get(WEATHERBIT_CURRENT_URL, () => {
					return HttpResponse.json({ data: [] });
				})
			);

			await provider.initialize();
			provider.start();

			const error = await errorPromise;
			expect(error).toHaveProperty("message");
		});
	});
});
