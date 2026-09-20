import { describe, it, expect, vi, beforeAll } from "vitest";

describe("FMIProvider", () => {
	let FMIProvider;

	beforeAll(async () => {
		const module = await import("../../../../../../defaultmodules/weather/providers/fmi");
		FMIProvider = module.default;
	});

	describe("Constructor & Configuration", () => {
		it("should set config values from params", () => {
			const provider = new FMIProvider({
				lat: 60.1699,
				lon: 24.9384
			});

			expect(provider.config.lat).toBe(60.1699);
			expect(provider.config.lon).toBe(24.9384);
			expect(provider.config.type).toBe("current");
			expect(provider.config.updateInterval).toBe(10 * 60 * 1000);
		});

		it("should allow overriding default config values", () => {
			const provider = new FMIProvider({
				type: "forecast",
				updateInterval: 15 * 60 * 1000
			});

			expect(provider.config.type).toBe("forecast");
			expect(provider.config.updateInterval).toBe(15 * 60 * 1000);
		});
	});

	describe("Coordinate Validation", () => {
		it("should report invalid coordinates", async () => {
			const provider = new FMIProvider({
				lat: Number.NaN,
				lon: 24.9384
			});

			const errorCallback = vi.fn();
			provider.setCallbacks(vi.fn(), errorCallback);

			await provider.initialize();

			expect(errorCallback).toHaveBeenCalledOnce();
			expect(errorCallback.mock.calls[0][0]).toHaveProperty("message");
		});
	});

	describe("URL Construction", () => {
		it("should build an observation URL using configured coordinates", () => {
			const provider = new FMIProvider({
				lat: 60.1699,
				lon: 24.9384
			});

			const url = new URL(provider.buildObservationUrl());

			expect(url.origin).toBe("https://opendata.fmi.fi");
			expect(url.pathname).toBe("/timeseries");
			expect(url.searchParams.get("producer")).toBe("observations_fmi");
			expect(url.searchParams.get("latlon")).toBe("60.1699,24.9384");
			expect(url.searchParams.get("format")).toBe("json");
			expect(url.searchParams.get("param")).toContain("t2m");
			expect(url.searchParams.get("param")).toContain("stationname");
		});

		it("should build a HARMONIE forecast URL using configured coordinates", () => {
			const provider = new FMIProvider({
				lat: 60.1699,
				lon: 24.9384
			});

			const url = new URL(provider.buildForecastUrl());

			expect(url.origin).toBe("https://opendata.fmi.fi");
			expect(url.pathname).toBe("/wfs");
			expect(url.searchParams.get("service")).toBe("WFS");
			expect(url.searchParams.get("version")).toBe("2.0.0");
			expect(url.searchParams.get("request")).toBe("getFeature");
			expect(url.searchParams.get("storedquery_id")).toBe(
				"fmi::forecast::harmonie::surface::point::timevaluepair"
			);
			expect(url.searchParams.get("latlon")).toBe("60.1699,24.9384");
			expect(url.searchParams.get("parameters")).toContain("Temperature");
			expect(url.searchParams.get("parameters")).toContain("WeatherSymbol3");
		});
	});
});
