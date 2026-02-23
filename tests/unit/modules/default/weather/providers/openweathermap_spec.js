/**
 * OpenWeatherMap Provider Tests
 *
 * Tests data parsing for current, forecast, and hourly weather types.
 */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";

import onecallData from "../../../../../mocks/weather_owm_onecall.json" with { type: "json" };

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

describe("OpenWeatherMapProvider", () => {
	let OpenWeatherMapProvider;

	beforeAll(async () => {
		const module = await import("../../../../../../defaultmodules/weather/providers/openweathermap");
		OpenWeatherMapProvider = module.default;
	});

	describe("Constructor & Configuration", () => {
		it("should set config values from params", () => {
			const provider = new OpenWeatherMapProvider({
				lat: 48.14,
				lon: 11.58,
				apiKey: "test-key"
			});
			expect(provider.config.lat).toBe(48.14);
			expect(provider.config.lon).toBe(11.58);
			expect(provider.config.apiKey).toBe("test-key");
		});

		it("should have default values", () => {
			const provider = new OpenWeatherMapProvider({ apiKey: "test" });
			expect(provider.config.apiVersion).toBe("3.0");
			expect(provider.config.weatherEndpoint).toBe("/onecall");
			expect(provider.config.apiBase).toBe("https://api.openweathermap.org/data/");
		});
	});

	describe("API Key Validation", () => {
		it("should call error callback without API key", async () => {
			const provider = new OpenWeatherMapProvider({ apiKey: "" });
			const onError = vi.fn();
			provider.setCallbacks(vi.fn(), onError);
			await provider.initialize();
			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ message: "API key is required" })
			);
		});

		it("should not create fetcher without API key", async () => {
			const provider = new OpenWeatherMapProvider({ apiKey: "" });
			provider.setCallbacks(vi.fn(), vi.fn());
			await provider.initialize();
			expect(provider.fetcher).toBeNull();
		});

		it("should throw if setCallbacks not called before initialize", async () => {
			const provider = new OpenWeatherMapProvider({ apiKey: "test" });
			await expect(provider.initialize()).rejects.toThrow("setCallbacks");
		});
	});

	describe("Current Weather Parsing", () => {
		it("should parse onecall current weather data", async () => {
			const provider = new OpenWeatherMapProvider({
				lat: 48.14,
				lon: 11.58,
				apiKey: "test-key",
				type: "current"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get("https://api.openweathermap.org/data/3.0/onecall", () => {
					return HttpResponse.json(onecallData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(result.temperature).toBe(-0.27);
			expect(result.windSpeed).toBe(3.09);
			expect(result.windFromDirection).toBe(220);
			expect(result.humidity).toBe(54);
			expect(result.uvIndex).toBe(0);
			expect(result.feelsLikeTemp).toBe(-3.9);
			expect(result.weatherType).toBe("cloudy-windy");
			expect(result.sunrise).toBeInstanceOf(Date);
			expect(result.sunset).toBeInstanceOf(Date);
		});

		it("should include precipitation data in current weather", async () => {
			const provider = new OpenWeatherMapProvider({
				lat: 48.14,
				lon: 11.58,
				apiKey: "test-key",
				type: "current"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get("https://api.openweathermap.org/data/3.0/onecall", () => {
					return HttpResponse.json(onecallData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			// Real data has no precipitation
			expect(result.rain).toBeUndefined();
			expect(result.snow).toBeUndefined();
		});
	});

	describe("Forecast Parsing", () => {
		it("should parse daily forecast data", async () => {
			const provider = new OpenWeatherMapProvider({
				lat: 48.14,
				lon: 11.58,
				apiKey: "test-key",
				type: "forecast"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get("https://api.openweathermap.org/data/3.0/onecall", () => {
					return HttpResponse.json(onecallData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(8);
			expect(result[0].minTemperature).toBe(-11.86);
			expect(result[0].maxTemperature).toBe(-0.27);
			expect(result[0].snow).toBe(0.69);
			expect(result[0].precipitationProbability).toBe(100);
		});
	});

	describe("Hourly Parsing", () => {
		it("should parse hourly forecast data", async () => {
			const provider = new OpenWeatherMapProvider({
				lat: 48.14,
				lon: 11.58,
				apiKey: "test-key",
				type: "hourly"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get("https://api.openweathermap.org/data/3.0/onecall", () => {
					return HttpResponse.json(onecallData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(48);
			expect(result[0].temperature).toBe(-0.66);
			expect(result[0].precipitationProbability).toBe(0);
			expect(result[0].rain).toBeUndefined();
		});
	});

	describe("Timezone Handling", () => {
		it("should set location name from timezone", async () => {
			const provider = new OpenWeatherMapProvider({
				lat: 48.14,
				lon: 11.58,
				apiKey: "test-key",
				type: "current"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get("https://api.openweathermap.org/data/3.0/onecall", () => {
					return HttpResponse.json(onecallData);
				})
			);

			await provider.initialize();
			provider.start();

			await dataPromise;

			expect(provider.locationName).toBe("America/New_York");
		});
	});
});
