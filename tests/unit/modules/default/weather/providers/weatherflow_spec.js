/**
 * WeatherFlow Weather Provider Tests
 *
 * Tests data parsing for current, forecast, and hourly weather types.
 */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";

import weatherflowData from "../../../../../mocks/weather_weatherflow.json" with { type: "json" };

const WEATHERFLOW_URL = "https://swd.weatherflow.com/swd/rest/better_forecast*";

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

describe("WeatherFlowProvider", () => {
	let WeatherFlowProvider;

	beforeAll(async () => {
		const module = await import("../../../../../../defaultmodules/weather/providers/weatherflow");
		WeatherFlowProvider = module.default || module;
	});

	describe("Constructor & Configuration", () => {
		it("should set config values from params", () => {
			const provider = new WeatherFlowProvider({
				token: "test-token",
				stationid: "12345",
				type: "current"
			});
			expect(provider.config.token).toBe("test-token");
			expect(provider.config.stationid).toBe("12345");
		});

		it("should error if token or stationid is missing", async () => {
			const provider = new WeatherFlowProvider({});

			const errorPromise = new Promise((resolve) => {
				provider.setCallbacks(vi.fn(), resolve);
			});

			await provider.initialize();

			const error = await errorPromise;
			expect(error.message).toContain("token");
		});
	});

	describe("Current Weather Parsing", () => {
		it("should parse current weather data", async () => {
			const provider = new WeatherFlowProvider({
				token: "test-token",
				stationid: "12345",
				type: "current"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(WEATHERFLOW_URL, () => {
					return HttpResponse.json(weatherflowData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(result).toBeDefined();
			expect(result.temperature).toBe(16);
			expect(result.humidity).toBe(28);
			expect(result.precipitationAmount).toBe(0);
			expect(result.precipitationUnits).toBe("mm");
			expect(result.precipitationProbability).toBe(0);
			expect(result.weatherType).not.toBeNull();
		});

		it("should convert wind speed from km/h to m/s", async () => {
			const provider = new WeatherFlowProvider({
				token: "test-token",
				stationid: "12345",
				type: "current"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(WEATHERFLOW_URL, () => {
					return HttpResponse.json(weatherflowData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			// Wind speed 15 km/h -> ~4.17 m/s
			expect(result.windSpeed).toBeCloseTo(4.17, 1);
		});

		it("should include sunrise/sunset", async () => {
			const provider = new WeatherFlowProvider({
				token: "test-token",
				stationid: "12345",
				type: "current"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(WEATHERFLOW_URL, () => {
					return HttpResponse.json(weatherflowData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(result.sunrise).toBeInstanceOf(Date);
			expect(result.sunset).toBeInstanceOf(Date);
		});
	});

	describe("Forecast Parsing", () => {
		it("should parse daily forecast data", async () => {
			const provider = new WeatherFlowProvider({
				token: "test-token",
				stationid: "12345",
				type: "forecast"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(WEATHERFLOW_URL, () => {
					return HttpResponse.json(weatherflowData);
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
		});
	});

	describe("Hourly Parsing", () => {
		it("should parse hourly forecast data", async () => {
			const provider = new WeatherFlowProvider({
				token: "test-token",
				stationid: "12345",
				type: "hourly"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(WEATHERFLOW_URL, () => {
					return HttpResponse.json(weatherflowData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);

			const hour = result[0];
			expect(hour).toHaveProperty("date");
			expect(hour).toHaveProperty("temperature");
			expect(hour).toHaveProperty("windSpeed");
		});

		it("should aggregate UV data from hourly forecasts", async () => {
			const provider = new WeatherFlowProvider({
				token: "test-token",
				stationid: "12345",
				type: "forecast"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(WEATHERFLOW_URL, () => {
					return HttpResponse.json(weatherflowData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			// First day should have UV from hourly data
			expect(result[0]).toHaveProperty("uvIndex");
			expect(result[0].uvIndex).toBeGreaterThanOrEqual(0);
		});
	});

	describe("Error Handling", () => {
		it("should handle invalid response", async () => {
			const provider = new WeatherFlowProvider({
				token: "test-token",
				stationid: "12345",
				type: "current"
			});

			// Invalid responses return null without calling error callback
			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(WEATHERFLOW_URL, () => {
					return HttpResponse.json({});
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;
			expect(result).toBeNull();
		});
	});
});
