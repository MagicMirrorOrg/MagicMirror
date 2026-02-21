/**
 * OpenMeteo Weather Provider Tests
 *
 * Tests data parsing for current, forecast, and hourly weather types.
 * Uses MSW to mock HTTP responses from the Open-Meteo API.
 */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { describe, it, expect, vi, beforeAll, afterAll, afterEach, beforeEach } from "vitest";

import openMeteoData from "../../../../../mocks/weather_openmeteo_current.json" with { type: "json" };
import openMeteoCurrentWeatherData from "../../../../../mocks/weather_openmeteo_current_weather.json" with { type: "json" };
// Real API returns current + forecast in one response
const currentData = openMeteoCurrentWeatherData;
const forecastData = openMeteoData;

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast*";
const GEOCODE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client*";

let server;

beforeAll(() => {
	// Mock global fetch for geocoding (used by provider's #fetchLocation)
	server = setupServer(
		http.get(GEOCODE_URL, () => {
			return HttpResponse.json({
				city: "Munich",
				locality: "Munich",
				principalSubdivisionCode: "BY"
			});
		})
	);
	server.listen({ onUnhandledRequest: "bypass" });
});

afterAll(() => {
	server.close();
});

afterEach(() => {
	server.resetHandlers();
});

describe("OpenMeteoProvider", () => {
	let OpenMeteoProvider;

	beforeAll(async () => {
		const module = await import("../../../../../../defaultmodules/weather/providers/openmeteo");
		OpenMeteoProvider = module.default;
	});

	describe("Constructor & Configuration", () => {
		it("should set config values from params", () => {
			const provider = new OpenMeteoProvider({
				lat: 48.14,
				lon: 11.58,
				type: "current"
			});
			expect(provider.config.lat).toBe(48.14);
			expect(provider.config.lon).toBe(11.58);
			expect(provider.config.type).toBe("current");
		});

		it("should have default values", () => {
			const provider = new OpenMeteoProvider({});
			expect(provider.config.lat).toBe(0);
			expect(provider.config.lon).toBe(0);
			expect(provider.config.type).toBe("current");
			expect(provider.config.maxNumberOfDays).toBe(5);
			expect(provider.config.apiBase).toBe("https://api.open-meteo.com/v1");
		});

		it("should initialize without callbacks", async () => {
			const provider = new OpenMeteoProvider({ lat: 48.14, lon: 11.58 });
			await expect(provider.initialize()).resolves.not.toThrow();
		});

		it("should resolve location name via geocoding", async () => {
			const provider = new OpenMeteoProvider({ lat: 48.14, lon: 11.58 });
			await provider.initialize();
			expect(provider.locationName).toBe("Munich, BY");
		});
	});

	describe("Current Weather Parsing", () => {
		it("should parse current weather data correctly", async () => {
			const provider = new OpenMeteoProvider({
				lat: 48.14,
				lon: 11.58,
				type: "current"
			});

			const dataPromise = new Promise((resolve, reject) => {
				provider.setCallbacks(
					(data) => {
						resolve(data);
					},
					(error) => {
						reject(error);
					}
				);
			});

			server.use(
				http.get("https://api.open-meteo.com/v1/forecast*", () => {
					return HttpResponse.json(currentData);
				})
			);
			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(result).toBeDefined();
			expect(result.temperature).toBe(8.5);
			expect(result.windSpeed).toBeCloseTo(4.7, 1);
			expect(result.windFromDirection).toBe(9);
			expect(result.humidity).toBe(83);
		});

		it("should include sunrise and sunset from daily data", async () => {
			const provider = new OpenMeteoProvider({
				lat: 48.14,
				lon: 11.58,
				type: "current"
			});

			const dataPromise = new Promise((resolve, reject) => {
				provider.setCallbacks(
					(data) => {
						resolve(data);
					},
					(error) => {
						reject(error);
					}
				);
			});

			server.use(
				http.get("https://api.open-meteo.com/v1/forecast*", () => {
					return HttpResponse.json(currentData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(result.sunrise).toBeInstanceOf(Date);
			expect(result.sunset).toBeInstanceOf(Date);
			expect(result.minTemperature).toBe(4.7);
			expect(result.maxTemperature).toBe(9.5);
		});
	});

	describe("Forecast Parsing", () => {
		it("should parse daily forecast data correctly", async () => {
			const provider = new OpenMeteoProvider({
				lat: 48.14,
				lon: 11.58,
				type: "forecast"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get("https://api.open-meteo.com/v1/forecast*", () => {
					return HttpResponse.json(forecastData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(7);
			const firstDay = result[0];
			expect(firstDay.minTemperature).toBe(-9.2);
			expect(firstDay.maxTemperature).toBe(-0.2);
			expect(firstDay.temperature).toBeCloseTo(-4.7, 0); // (-0.2+-9.2)/2

			expect(firstDay.sunrise).toBeInstanceOf(Date);
			expect(firstDay.sunset).toBeInstanceOf(Date);
		});

		it("should include precipitation data in forecast", async () => {
			const provider = new OpenMeteoProvider({
				lat: 48.14,
				lon: 11.58,
				type: "forecast"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get("https://api.open-meteo.com/v1/forecast*", () => {
					return HttpResponse.json(forecastData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			// Mock data has no rain_sum field - provider returns null for missing data
			expect(result[0].rain).toBeNull();
			// precipitation_sum has value 0.0 in mock data
			expect(result[0].precipitationAmount).toBe(0.0);
		});
	});

	describe("Error Handling", () => {
		it("should call error callback on invalid API response", async () => {
			const provider = new OpenMeteoProvider({
				lat: 48.14,
				lon: 11.58,
				type: "current"
			});

			const errorPromise = new Promise((resolve) => {
				provider.setCallbacks(vi.fn(), resolve);
			});

			server.use(
				http.get("https://api.open-meteo.com/v1/forecast*", () => {
					return HttpResponse.json({});
				})
			);

			await provider.initialize();
			provider.start();

			const error = await errorPromise;
			expect(error).toHaveProperty("message");
			expect(error).toHaveProperty("translationKey");
		});

		it("should call error callback on network failure", async () => {
			const provider = new OpenMeteoProvider({
				lat: 48.14,
				lon: 11.58,
				type: "current"
			});

			const errorPromise = new Promise((resolve) => {
				provider.setCallbacks(vi.fn(), resolve);
			});

			server.use(
				http.get("https://api.open-meteo.com/v1/forecast*", () => {
					return HttpResponse.error();
				})
			);

			await provider.initialize();
			provider.start();

			const error = await errorPromise;
			expect(error).toHaveProperty("url");
		});
	});

	describe("Callback Interface", () => {
		it("should store callbacks via setCallbacks", () => {
			const provider = new OpenMeteoProvider({});
			const onData = vi.fn();
			const onError = vi.fn();
			provider.setCallbacks(onData, onError);
			expect(provider.onDataCallback).toBe(onData);
			expect(provider.onErrorCallback).toBe(onError);
		});
	});

	describe("Lifecycle", () => {
		it("should have start/stop methods", () => {
			const provider = new OpenMeteoProvider({});
			expect(typeof provider.start).toBe("function");
			expect(typeof provider.stop).toBe("function");
		});

		it("should clear timer on stop", async () => {
			const provider = new OpenMeteoProvider({ lat: 48.14, lon: 11.58 });
			provider.setCallbacks(vi.fn(), vi.fn());

			server.use(
				http.get("https://api.open-meteo.com/v1/forecast*", () => {
					return HttpResponse.json(currentData);
				})
			);

			await provider.initialize();
			provider.stop();

			// Should not throw
			expect(provider.fetcher).not.toBeNull();
		});
	});
});
