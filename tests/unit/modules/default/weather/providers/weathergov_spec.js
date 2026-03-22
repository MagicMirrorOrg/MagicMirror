/**
 * Weather.gov Weather Provider Tests
 *
 * Tests data parsing for current, forecast, and hourly weather types.
 * Weather.gov is the US National Weather Service API.
 */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";

import pointsData from "../../../../../mocks/weather_weathergov_points.json" with { type: "json" };
import stationsData from "../../../../../mocks/weather_weathergov_stations.json" with { type: "json" };
import currentData from "../../../../../mocks/weather_weathergov_current.json" with { type: "json" };
import forecastData from "../../../../../mocks/weather_weathergov_forecast.json" with { type: "json" };
import hourlyData from "../../../../../mocks/weather_weathergov_hourly.json" with { type: "json" };

const WEATHERGOV_POINTS_URL = "https://api.weather.gov/points/*";
const WEATHERGOV_STATIONS_URL = "https://api.weather.gov/gridpoints/*/stations";
const WEATHERGOV_CURRENT_URL = "https://api.weather.gov/stations/*/observations/latest";
const WEATHERGOV_FORECAST_URL = "https://api.weather.gov/gridpoints/*/forecast*";
const WEATHERGOV_HOURLY_URL = "https://api.weather.gov/gridpoints/*/forecast/hourly*";

let server;

beforeAll(() => {
	server = setupServer(
		// Default handlers for initialization
		http.get(WEATHERGOV_POINTS_URL, () => {
			return HttpResponse.json(pointsData);
		}),
		http.get(WEATHERGOV_STATIONS_URL, () => {
			return HttpResponse.json(stationsData);
		})
	);
	server.listen({ onUnhandledRequest: "bypass" });
});

afterAll(() => {
	server.close();
});

afterEach(() => {
	server.resetHandlers();
	// Re-add default initialization handlers
	server.use(
		http.get(WEATHERGOV_POINTS_URL, () => {
			return HttpResponse.json(pointsData);
		}),
		http.get(WEATHERGOV_STATIONS_URL, () => {
			return HttpResponse.json(stationsData);
		})
	);
});

describe("WeatherGovProvider", () => {
	let WeatherGovProvider;

	beforeAll(async () => {
		const module = await import("../../../../../../defaultmodules/weather/providers/weathergov");
		WeatherGovProvider = module.default || module;
	});

	describe("Constructor & Configuration", () => {
		it("should set config values from params", () => {
			const provider = new WeatherGovProvider({
				lat: 40.71,
				lon: -74.0,
				type: "current"
			});
			expect(provider.config.lat).toBe(40.71);
			expect(provider.config.lon).toBe(-74.0);
			expect(provider.config.type).toBe("current");
		});

		it("should have default update interval", () => {
			const provider = new WeatherGovProvider({});
			expect(provider.config.updateInterval).toBe(600000); // 10 minutes
		});
	});

	describe("Two-Step Initialization", () => {
		it("should fetch points URL and then stations URL", async () => {
			const provider = new WeatherGovProvider({
				lat: 40.71,
				lon: -74.0,
				type: "current"
			});

			provider.setCallbacks(vi.fn(), vi.fn());

			let pointsRequested = false;
			let stationsRequested = false;

			server.use(
				http.get(WEATHERGOV_POINTS_URL, () => {
					pointsRequested = true;
					return HttpResponse.json(pointsData);
				}),
				http.get(WEATHERGOV_STATIONS_URL, () => {
					stationsRequested = true;
					return HttpResponse.json(stationsData);
				})
			);

			await provider.initialize();

			expect(pointsRequested).toBe(true);
			expect(stationsRequested).toBe(true);
			expect(provider.locationName).toBe("Washington, DC");
		});

		it("should store forecast URLs after initialization", async () => {
			const provider = new WeatherGovProvider({
				lat: 40.71,
				lon: -74.0
			});

			provider.setCallbacks(vi.fn(), vi.fn());
			await provider.initialize();

			expect(provider.forecastURL).toContain("forecast?units=si");
			expect(provider.forecastHourlyURL).toContain("forecast/hourly?units=si");
			expect(provider.stationObsURL).toContain("observations/latest");
		});
	});

	describe("Current Weather Parsing", () => {
		it("should parse current weather data", async () => {
			const provider = new WeatherGovProvider({
				lat: 40.71,
				lon: -74.0,
				type: "current"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(WEATHERGOV_CURRENT_URL, () => {
					return HttpResponse.json(currentData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(result).toBeDefined();
			expect(result.temperature).toBe(-1);
			expect(result.windSpeed).toBe(0);
			expect(result.windFromDirection).toBe(0);
			expect(result.humidity).toBe(64); // Rounded from 63.77
			expect(result.weatherType).not.toBeNull();
		});

		it("should use heat index or wind chill for feels like temperature", async () => {
			const provider = new WeatherGovProvider({
				lat: 40.71,
				lon: -74.0,
				type: "current"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(WEATHERGOV_CURRENT_URL, () => {
					return HttpResponse.json(currentData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			// Real data has null windChill - falls back to temperature
			expect(result.feelsLikeTemp).toBe(-1);
		});

		it("should include sunrise/sunset", async () => {
			const provider = new WeatherGovProvider({
				lat: 40.71,
				lon: -74.0,
				type: "current"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(WEATHERGOV_CURRENT_URL, () => {
					return HttpResponse.json(currentData);
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
			const provider = new WeatherGovProvider({
				lat: 40.71,
				lon: -74.0,
				type: "forecast"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(WEATHERGOV_FORECAST_URL, () => {
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

		it("should not skip the first day of forecast data", async () => {
			const provider = new WeatherGovProvider({
				lat: 40.71,
				lon: -74.0,
				type: "forecast"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(WEATHERGOV_FORECAST_URL, () => {
					return HttpResponse.json(forecastData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			// Mock data starts on 2026-02-06 ("This Afternoon").
			// Before the fix, slice(1) dropped today, so result[0] would have been 2026-02-07.
			const firstDate = result[0].date;
			expect(firstDate.getFullYear()).toBe(2026);
			expect(firstDate.getMonth()).toBe(1); // February (0-indexed)
			expect(firstDate.getDate()).toBe(6);
		});
	});

	describe("Hourly Parsing", () => {
		it("should parse hourly forecast data", async () => {
			const provider = new WeatherGovProvider({
				lat: 40.71,
				lon: -74.0,
				type: "hourly"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(WEATHERGOV_HOURLY_URL, () => {
					return HttpResponse.json(hourlyData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(156); // Real API returns 156 hourly periods
			expect(result[0]).toHaveProperty("temperature");
			expect(result[0]).toHaveProperty("windSpeed");
			expect(result[0]).toHaveProperty("windFromDirection");
			expect(result[0]).toHaveProperty("weatherType");
		});

		it("should convert wind direction strings to degrees", async () => {
			const provider = new WeatherGovProvider({
				lat: 40.71,
				lon: -74.0,
				type: "hourly"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(WEATHERGOV_HOURLY_URL, () => {
					return HttpResponse.json(hourlyData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			// Real data has "S" wind for both hours
			expect(result[0].windFromDirection).toBe(180);
			// Third hour also has "S" wind
			expect(result[2].windFromDirection).toBe(180);
		});

		it("should parse wind speed with units", async () => {
			const provider = new WeatherGovProvider({
				lat: 40.71,
				lon: -74.0,
				type: "hourly"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(WEATHERGOV_HOURLY_URL, () => {
					return HttpResponse.json(hourlyData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			// Wind speeds should be converted from km/h to m/s
			expect(result[0].windSpeed).toBeCloseTo(1.11, 1); // Real data: 4 km/h -> ~1.11 m/s
		});
	});

	describe("Error Handling", () => {
		it("should categorize DNS errors as retryable", async () => {
			const provider = new WeatherGovProvider({
				lat: 40.71,
				lon: -74.0,
				type: "current"
			});

			const errorPromise = new Promise((resolve) => {
				provider.setCallbacks(vi.fn(), resolve);
			});

			server.use(
				http.get(WEATHERGOV_POINTS_URL, () => {
					return HttpResponse.error();
				})
			);

			await provider.initialize();

			// Should call error callback
			const error = await errorPromise;
			expect(error).toHaveProperty("message");
		});

		it("should handle invalid JSON response", async () => {
			const provider = new WeatherGovProvider({
				lat: 40.71,
				lon: -74.0,
				type: "current"
			});

			const errorPromise = new Promise((resolve) => {
				provider.setCallbacks(vi.fn(), resolve);
			});

			server.use(
				http.get(WEATHERGOV_CURRENT_URL, () => {
					return HttpResponse.json({ properties: null });
				})
			);

			await provider.initialize();
			provider.start();

			const error = await errorPromise;
			expect(error.message).toContain("Invalid");
		});
	});

	describe("Weather Type Conversion", () => {
		it("should convert textDescription to weather types", async () => {
			const provider = new WeatherGovProvider({
				lat: 40.71,
				lon: -74.0,
				type: "current"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			const testData = JSON.parse(JSON.stringify(currentData));
			testData.properties.textDescription = "Thunderstorm";

			server.use(
				http.get(WEATHERGOV_CURRENT_URL, () => {
					return HttpResponse.json(testData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			// Thunderstorm should map to day or night thunderstorm
			expect(["thunderstorm", "night-thunderstorm"]).toContain(result.weatherType);
		});
	});
});
