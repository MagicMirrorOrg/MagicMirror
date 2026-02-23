/**
 * Weather Provider Smoke Tests
 *
 * Tests basic provider functionality: configuration, callbacks, and validation.
 * Parser logic with private methods (#) is validated through live testing.
 */
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";

// Mock global fetch for location lookup
const originalFetch = global.fetch;

global.fetch = vi.fn(() => Promise.resolve({
	ok: true,
	json: () => Promise.resolve({ city: "Munich", locality: "Munich" })
}));

// Restore original fetch after all tests
afterAll(() => {
	global.fetch = originalFetch;
});

describe("Weather Provider Smoke Tests", () => {
	describe("OpenMeteoProvider", () => {
		let OpenMeteoProvider;
		let provider;

		beforeAll(async () => {
			const module = await import("../../../../../defaultmodules/weather/providers/openmeteo");
			OpenMeteoProvider = module.default;
		});

		beforeEach(() => {
			provider = new OpenMeteoProvider({
				lat: 48.14,
				lon: 11.58,
				type: "current",
				updateInterval: 600000
			});
		});

		describe("Constructor & Configuration", () => {
			it("should set config values from params", () => {
				expect(provider.config.lat).toBe(48.14);
				expect(provider.config.lon).toBe(11.58);
				expect(provider.config.type).toBe("current");
				expect(provider.config.updateInterval).toBe(600000);
			});

			it("should have default values", () => {
				const defaultProvider = new OpenMeteoProvider({});
				expect(defaultProvider.config.lat).toBe(0);
				expect(defaultProvider.config.lon).toBe(0);
				expect(defaultProvider.config.type).toBe("current");
				expect(defaultProvider.config.maxNumberOfDays).toBe(5);
			});

			it("should accept all supported types", () => {
				expect(new OpenMeteoProvider({ type: "current" }).config.type).toBe("current");
				expect(new OpenMeteoProvider({ type: "forecast" }).config.type).toBe("forecast");
				expect(new OpenMeteoProvider({ type: "hourly" }).config.type).toBe("hourly");
			});
		});

		describe("Callback Interface", () => {
			it("should store callbacks via setCallbacks", () => {
				const onData = vi.fn();
				const onError = vi.fn();
				provider.setCallbacks(onData, onError);
				expect(provider.onDataCallback).toBe(onData);
				expect(provider.onErrorCallback).toBe(onError);
			});

			it("should initialize without callbacks", async () => {
				await expect(provider.initialize()).resolves.not.toThrow();
			});
		});

		describe("Public Methods", () => {
			it("should have start/stop methods", () => {
				expect(typeof provider.start).toBe("function");
				expect(typeof provider.stop).toBe("function");
			});

			it("should have initialize method", () => {
				expect(typeof provider.initialize).toBe("function");
			});

			it("should have setCallbacks method", () => {
				expect(typeof provider.setCallbacks).toBe("function");
			});
		});
	});

	describe("OpenWeatherMapProvider", () => {
		let OpenWeatherMapProvider;
		let provider;

		beforeAll(async () => {
			const module = await import("../../../../../defaultmodules/weather/providers/openweathermap");
			OpenWeatherMapProvider = module.default;
		});

		beforeEach(() => {
			provider = new OpenWeatherMapProvider({
				lat: 48.14,
				lon: 11.58,
				apiKey: "test-api-key",
				type: "current"
			});
		});

		describe("Constructor & Configuration", () => {
			it("should set config values from params", () => {
				expect(provider.config.lat).toBe(48.14);
				expect(provider.config.lon).toBe(11.58);
				expect(provider.config.apiKey).toBe("test-api-key");
				expect(provider.config.type).toBe("current");
			});

			it("should have default values", () => {
				const defaultProvider = new OpenWeatherMapProvider({ apiKey: "test" });
				expect(defaultProvider.config.apiVersion).toBe("3.0");
				expect(defaultProvider.config.weatherEndpoint).toBe("/onecall");
				expect(defaultProvider.config.apiBase).toBe("https://api.openweathermap.org/data/");
			});

			it("should accept all supported types", () => {
				expect(new OpenWeatherMapProvider({ apiKey: "test", type: "current" }).config.type).toBe("current");
				expect(new OpenWeatherMapProvider({ apiKey: "test", type: "forecast" }).config.type).toBe("forecast");
				expect(new OpenWeatherMapProvider({ apiKey: "test", type: "hourly" }).config.type).toBe("hourly");
			});
		});

		describe("API Key Validation", () => {
			it("should call onErrorCallback if no API key provided", async () => {
				const noKeyProvider = new OpenWeatherMapProvider({
					lat: 48.14,
					lon: 11.58,
					apiKey: ""
				});

				const onError = vi.fn();
				noKeyProvider.setCallbacks(vi.fn(), onError);
				await noKeyProvider.initialize();

				expect(onError).toHaveBeenCalledWith(
					expect.objectContaining({
						message: "API key is required"
					})
				);
			});

			it("should not create fetcher without API key", async () => {
				const noKeyProvider = new OpenWeatherMapProvider({
					apiKey: ""
				});
				noKeyProvider.setCallbacks(vi.fn(), vi.fn());
				await noKeyProvider.initialize();

				expect(noKeyProvider.fetcher).toBeNull();
			});
		});

		describe("Callback Interface", () => {
			it("should store callbacks via setCallbacks", () => {
				const onData = vi.fn();
				const onError = vi.fn();
				provider.setCallbacks(onData, onError);
				expect(provider.onDataCallback).toBe(onData);
				expect(provider.onErrorCallback).toBe(onError);
			});
		});

		describe("Public Methods", () => {
			it("should have start/stop methods", () => {
				expect(typeof provider.start).toBe("function");
				expect(typeof provider.stop).toBe("function");
			});

			it("should have initialize method", () => {
				expect(typeof provider.initialize).toBe("function");
			});

			it("should have setCallbacks method", () => {
				expect(typeof provider.setCallbacks).toBe("function");
			});
		});
	});
});
