/**
 * Pirate Weather Provider Tests
 *
 * Tests data parsing for current, forecast, and hourly weather types.
 * Pirate Weather is a Dark Sky API compatible service.
 */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";

import pirateweatherData from "../../../../../mocks/weather_pirateweather.json" with { type: "json" };

const PIRATEWEATHER_URL = "https://api.pirateweather.net/forecast/*";

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

describe("PirateweatherProvider", () => {
	let PirateweatherProvider;

	beforeAll(async () => {
		const module = await import("../../../../../../defaultmodules/weather/providers/pirateweather");
		PirateweatherProvider = module.default || module;
	});

	describe("Constructor & Configuration", () => {
		it("should set config values from params", () => {
			const provider = new PirateweatherProvider({
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
			const provider = new PirateweatherProvider({
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
			const provider = new PirateweatherProvider({
				apiKey: "test-key",
				lat: 40.71,
				lon: -74.0,
				type: "current"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(PIRATEWEATHER_URL, () => {
					return HttpResponse.json(pirateweatherData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(result).toBeDefined();
			expect(result.temperature).toBe(-0.26);
			expect(result.feelsLikeTemp).toBe(-4.77);
			expect(result.windSpeed).toBe(2.32);
			expect(result.windDirection).toBe(166);
			expect(Math.round(result.humidity)).toBe(56); // 0.56 * 100 with rounding
		});

		it("should include sunrise/sunset from daily data", async () => {
			const provider = new PirateweatherProvider({
				apiKey: "test-key",
				lat: 40.71,
				lon: -74.0,
				type: "current"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(PIRATEWEATHER_URL, () => {
					return HttpResponse.json(pirateweatherData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(result.sunrise).toBeInstanceOf(Date);
			expect(result.sunset).toBeInstanceOf(Date);
		});

		it("should convert icon to weather type", async () => {
			const provider = new PirateweatherProvider({
				apiKey: "test-key",
				lat: 40.71,
				lon: -74.0,
				type: "current"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(PIRATEWEATHER_URL, () => {
					return HttpResponse.json(pirateweatherData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			// "cloudy" icon from real data
			expect(result.weatherType).toBe("cloudy");
		});
	});

	describe("Forecast Parsing", () => {
		it("should parse daily forecast data", async () => {
			const provider = new PirateweatherProvider({
				apiKey: "test-key",
				lat: 40.71,
				lon: -74.0,
				type: "forecast"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(PIRATEWEATHER_URL, () => {
					return HttpResponse.json(pirateweatherData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(8);
			const day = result[0];
			expect(day).toHaveProperty("date");
			expect(day).toHaveProperty("minTemperature");
			expect(day).toHaveProperty("maxTemperature");
			expect(day).toHaveProperty("weatherType");
			expect(day).toHaveProperty("precipitationProbability");
		});

		it("should convert precipitation accumulation from cm to mm", async () => {
			const provider = new PirateweatherProvider({
				apiKey: "test-key",
				lat: 40.71,
				lon: -74.0,
				type: "forecast"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(PIRATEWEATHER_URL, () => {
					return HttpResponse.json(pirateweatherData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			// First day has precipAccumulation: 0.0 cm
			expect(result[0].precipitation).toBe(0);
		});

		it("should categorize precipitation by type", async () => {
			const provider = new PirateweatherProvider({
				apiKey: "test-key",
				lat: 40.71,
				lon: -74.0,
				type: "forecast"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(PIRATEWEATHER_URL, () => {
					return HttpResponse.json(pirateweatherData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			// First day has precipType: "snow"
			expect(result[0].rain).toBe(0);
			expect(result[0].snow).toBe(0);

			// Second day has precipType: "snow" with 0.0 accumulation
			expect(result[1].rain).toBe(0);
			expect(result[1].snow).toBe(0);
		});

		it("should convert precipitation probability to percentage", async () => {
			const provider = new PirateweatherProvider({
				apiKey: "test-key",
				lat: 40.71,
				lon: -74.0,
				type: "forecast"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(PIRATEWEATHER_URL, () => {
					return HttpResponse.json(pirateweatherData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			// 0.33 -> 33%
			expect(result[0].precipitationProbability).toBe(33);
		});
	});

	describe("Hourly Parsing", () => {
		it("should parse hourly forecast data", async () => {
			const provider = new PirateweatherProvider({
				apiKey: "test-key",
				lat: 40.71,
				lon: -74.0,
				type: "hourly"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(PIRATEWEATHER_URL, () => {
					return HttpResponse.json(pirateweatherData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(48);

			const hour = result[0];
			expect(hour).toHaveProperty("date");
			expect(hour).toHaveProperty("temperature");
			expect(hour).toHaveProperty("feelsLikeTemp");
			expect(hour).toHaveProperty("windSpeed");
			expect(hour).toHaveProperty("weatherType");
		});

		it("should handle hourly precipitation", async () => {
			const provider = new PirateweatherProvider({
				apiKey: "test-key",
				lat: 40.71,
				lon: -74.0,
				type: "hourly"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(PIRATEWEATHER_URL, () => {
					return HttpResponse.json(pirateweatherData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			// First hour has 0.0 cm precipitation
			expect(result[0].precipitation).toBe(0);
			expect(result[0].rain).toBe(0);
		});
	});

	describe("Error Handling", () => {
		it("should handle invalid JSON response", async () => {
			const provider = new PirateweatherProvider({
				apiKey: "test-key",
				lat: 40.71,
				lon: -74.0,
				type: "current"
			});

			const errorPromise = new Promise((resolve) => {
				provider.setCallbacks(vi.fn(), resolve);
			});

			server.use(
				http.get(PIRATEWEATHER_URL, () => {
					return HttpResponse.json({});
				})
			);

			await provider.initialize();
			provider.start();

			const error = await errorPromise;
			expect(error.message).toContain("No usable data");
		});
	});
});
