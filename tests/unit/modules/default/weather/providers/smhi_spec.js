/**
 * SMHI Weather Provider Tests
 *
 * Tests data parsing for current, forecast, and hourly weather types.
 * SMHI provides data only for Sweden, uses metric system.
 *
 * Fixture: weather_smhi.json uses SNOW1gv1 format (replaced PMP3gv2 2026-03-31)
 */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";

import smhiData from "../../../../../mocks/weather_smhi.json" with { type: "json" };

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

describe("SMHIProvider", () => {
	let SMHIProvider;

	beforeAll(async () => {
		const module = await import("../../../../../../defaultmodules/weather/providers/smhi");
		SMHIProvider = module.default;
	});

	describe("Constructor & Configuration", () => {
		it("should set config values from params", () => {
			const provider = new SMHIProvider({
				lat: 59.3293,
				lon: 18.0686
			});
			expect(provider.config.lat).toBe(59.3293);
			expect(provider.config.lon).toBe(18.0686);
			expect(provider.config.precipitationValue).toBe("pmedian");
		});

		it("should fallback to pmedian for invalid precipitationValue", () => {
			const provider = new SMHIProvider({
				precipitationValue: "invalid"
			});
			expect(provider.config.precipitationValue).toBe("pmedian");
		});

		it("should accept valid precipitationValue options", () => {
			for (const value of ["pmin", "pmean", "pmedian", "pmax"]) {
				const provider = new SMHIProvider({ precipitationValue: value });
				expect(provider.config.precipitationValue).toBe(value);
			}
		});
	});

	describe("Coordinate Validation", () => {
		it("should limit coordinates to 6 decimal places", async () => {
			const provider = new SMHIProvider({
				lat: 59.32930123456789,
				lon: 18.06860123456789
			});
			provider.setCallbacks(vi.fn(), vi.fn());

			server.use(
				http.get("https://opendata-download-metfcst.smhi.se/*", () => {
					return HttpResponse.json(smhiData);
				})
			);

			await provider.initialize();

			// After validateCoordinates(config, 6), decimals should be truncated
			expect(provider.config.lat.toString().split(".")[1]?.length).toBeLessThanOrEqual(6);
			expect(provider.config.lon.toString().split(".")[1]?.length).toBeLessThanOrEqual(6);
		});
	});

	describe("Current Weather Parsing", () => {
		it("should parse current weather from timeSeries", async () => {
			const provider = new SMHIProvider({
				lat: 59.3293,
				lon: 18.0686,
				type: "current"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get("https://opendata-download-metfcst.smhi.se/*", () => {
					return HttpResponse.json(smhiData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(result).toBeDefined();
			expect(typeof result.temperature).toBe("number");
			expect(typeof result.windSpeed).toBe("number");
			expect(typeof result.humidity).toBe("number");
			expect(result.sunrise).toBeInstanceOf(Date);
			expect(result.sunset).toBeInstanceOf(Date);
		});

		it("should detect precipitation category correctly", async () => {
			const provider = new SMHIProvider({
				lat: 59.3293,
				lon: 18.0686,
				type: "current"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			// Use entry at index 2 which has ptype=5 (snow) but pmedian=0.0
			const rainData = JSON.parse(JSON.stringify(smhiData));
			rainData.timeSeries = [rainData.timeSeries[2]];
			rainData.timeSeries[0].time = new Date().toISOString();

			server.use(
				http.get("https://opendata-download-metfcst.smhi.se/*", () => {
					return HttpResponse.json(rainData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			// pmedian is 0.0 at this entry, so all precipitation amounts are 0
			expect(result.rain).toBe(0);
			expect(result.precipitationAmount).toBe(0.0);
			expect(result.snow).toBe(0);
		});
	});

	describe("Forecast Parsing", () => {
		it("should parse daily forecast data", async () => {
			const provider = new SMHIProvider({
				lat: 59.3293,
				lon: 18.0686,
				type: "forecast"
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get("https://opendata-download-metfcst.smhi.se/*", () => {
					return HttpResponse.json(smhiData);
				})
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);

			const firstDay = result[0];
			expect(firstDay).toHaveProperty("date");
			expect(firstDay).toHaveProperty("minTemperature");
			expect(firstDay).toHaveProperty("maxTemperature");
			expect(firstDay.minTemperature).toBeLessThanOrEqual(firstDay.maxTemperature);
		});
	});

	describe("Error Handling", () => {
		it("should call error callback on invalid data", async () => {
			const provider = new SMHIProvider({
				lat: 59.3293,
				lon: 18.0686,
				type: "current"
			});

			const errorPromise = new Promise((resolve) => {
				provider.setCallbacks(vi.fn(), resolve);
			});

			server.use(
				http.get("https://opendata-download-metfcst.smhi.se/*", () => {
					return HttpResponse.json({ invalid: true });
				})
			);

			await provider.initialize();
			provider.start();

			const error = await errorPromise;
			expect(error).toHaveProperty("message");
		});
	});
});
