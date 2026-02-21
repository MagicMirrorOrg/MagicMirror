/**
 * UK Met Office DataHub Weather Provider Tests
 *
 * Tests data parsing for current, forecast, and hourly weather types.
 */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";

import hourlyData from "../../../../../mocks/weather_ukmetoffice.json" with { type: "json" };
import dailyData from "../../../../../mocks/weather_ukmetoffice_daily.json" with { type: "json" };

const UKMETOFFICE_HOURLY_URL = "https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point/hourly*";
const UKMETOFFICE_THREE_HOURLY_URL = "https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point/three-hourly*";
const UKMETOFFICE_DAILY_URL = "https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point/daily*";

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

describe("UKMetOfficeDataHubProvider", () => {
	let UKMetOfficeDataHubProvider;

	beforeAll(async () => {
		const module = await import("../../../../../../defaultmodules/weather/providers/ukmetofficedatahub");
		UKMetOfficeDataHubProvider = module.default || module;
	});

	describe("Constructor & Configuration", () => {
		it("should set config values from params", () => {
			const provider = new UKMetOfficeDataHubProvider({
				apiKey: "test-api-key",
				lat: 51.5,
				lon: -0.12,
				type: "current"
			});
			expect(provider.config.apiKey).toBe("test-api-key");
			expect(provider.config.lat).toBe(51.5);
			expect(provider.config.lon).toBe(-0.12);
		});

		it("should error if API key is missing", async () => {
			const provider = new UKMetOfficeDataHubProvider({
				lat: 51.5,
				lon: -0.12
			});

			const errorPromise = new Promise((resolve) => {
				provider.setCallbacks(vi.fn(), resolve);
			});

			await provider.initialize();

			const error = await errorPromise;
			expect(error.message).toContain("API key");
		});
	});

	describe("Forecast Type Mapping", () => {
		it("should use hourly endpoint for current type", async () => {
			const provider = new UKMetOfficeDataHubProvider({
				apiKey: "test-key",
				lat: 51.5,
				lon: -0.12,
				type: "current"
			});

			let requestedUrl = null;
			server.use(
				http.get(UKMETOFFICE_HOURLY_URL, ({ request }) => {
					requestedUrl = request.url;
					return HttpResponse.json(hourlyData);
				})
			);

			provider.setCallbacks(vi.fn(), vi.fn());
			await provider.initialize();
			provider.start();

			await new Promise((resolve) => setTimeout(resolve, 100));
			expect(requestedUrl).toContain("/hourly?");
		});

		it("should use daily endpoint for forecast type", async () => {
			const provider = new UKMetOfficeDataHubProvider({
				apiKey: "test-key",
				lat: 51.5,
				lon: -0.12,
				type: "forecast"
			});

			let requestedUrl = null;
			server.use(
				http.get(UKMETOFFICE_DAILY_URL, ({ request }) => {
					requestedUrl = request.url;
					return HttpResponse.json(dailyData);
				})
			);

			provider.setCallbacks(vi.fn(), vi.fn());
			await provider.initialize();
			provider.start();

			await new Promise((resolve) => setTimeout(resolve, 100));
			expect(requestedUrl).toContain("/daily?");
		});

		it("should use three-hourly endpoint for hourly type", async () => {
			const provider = new UKMetOfficeDataHubProvider({
				apiKey: "test-key",
				lat: 51.5,
				lon: -0.12,
				type: "hourly"
			});

			let requestedUrl = null;
			server.use(
				http.get(UKMETOFFICE_THREE_HOURLY_URL, ({ request }) => {
					requestedUrl = request.url;
					return HttpResponse.json(hourlyData);
				})
			);

			provider.setCallbacks(vi.fn(), vi.fn());
			await provider.initialize();
			provider.start();

			await new Promise((resolve) => setTimeout(resolve, 100));
			expect(requestedUrl).toContain("/three-hourly?");
		});
	});

	describe("Current Weather Parsing", () => {
		it("should parse current weather from hourly data", async () => {
			const provider = new UKMetOfficeDataHubProvider({
				apiKey: "test-key",
				lat: 51.5,
				lon: -0.12,
				type: "current"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(UKMETOFFICE_HOURLY_URL, () => {
					return HttpResponse.json(hourlyData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(result).toBeDefined();
			expect(result.temperature).toBeDefined();
			expect(result.windSpeed).toBeDefined();
			expect(result.humidity).toBeDefined();
			expect(result.weatherType).not.toBeNull();
		});

		it("should include sunrise/sunset from SunCalc", async () => {
			const provider = new UKMetOfficeDataHubProvider({
				apiKey: "test-key",
				lat: 51.5,
				lon: -0.12,
				type: "current"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(UKMETOFFICE_HOURLY_URL, () => {
					return HttpResponse.json(hourlyData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(result.sunrise).toBeInstanceOf(Date);
			expect(result.sunset).toBeInstanceOf(Date);
		});

		it("should convert weather code to weather type", async () => {
			const provider = new UKMetOfficeDataHubProvider({
				apiKey: "test-key",
				lat: 51.5,
				lon: -0.12,
				type: "current"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(UKMETOFFICE_HOURLY_URL, () => {
					return HttpResponse.json(hourlyData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(result.weatherType).toBeTruthy();
		});
	});

	describe("Forecast Parsing", () => {
		it("should parse daily forecast data", async () => {
			const provider = new UKMetOfficeDataHubProvider({
				apiKey: "test-key",
				lat: 51.5,
				lon: -0.12,
				type: "forecast"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(UKMETOFFICE_DAILY_URL, () => {
					return HttpResponse.json(dailyData);
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
			const provider = new UKMetOfficeDataHubProvider({
				apiKey: "test-key",
				lat: 51.5,
				lon: -0.12,
				type: "hourly"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(UKMETOFFICE_THREE_HOURLY_URL, () => {
					return HttpResponse.json(hourlyData);
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
			expect(hour).toHaveProperty("weatherType");
		});
	});

	describe("Error Handling", () => {
		it("should handle invalid response", async () => {
			const provider = new UKMetOfficeDataHubProvider({
				apiKey: "test-key",
				lat: 51.5,
				lon: -0.12,
				type: "current"
			});

			const errorPromise = new Promise((resolve) => {
				provider.setCallbacks(vi.fn(), resolve);
			});

			server.use(
				http.get(UKMETOFFICE_HOURLY_URL, () => {
					return HttpResponse.json({});
				})
			);

			await provider.initialize();
			provider.start();

			const error = await errorPromise;
			expect(error).toHaveProperty("message");
		});
	});
});
