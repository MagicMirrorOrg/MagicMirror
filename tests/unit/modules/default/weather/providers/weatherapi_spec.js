/**
 * WeatherAPI Provider Tests
 *
 * Tests data parsing for current, forecast, and hourly weather types.
 */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";

const WEATHER_API_URL = "https://api.weatherapi.com/v1/forecast.json*";

/**
 * Builds a stable WeatherAPI mock payload for current, daily, and hourly parsing tests.
 * @returns {object} WeatherAPI forecast response fixture.
 */
function buildWeatherApiResponse () {
	return {
		location: {
			name: "Toronto",
			region: "Ontario",
			country: "Canada"
		},
		current: {
			last_updated_epoch: 4102444800,
			temp_c: -2.5,
			feelslike_c: -7.1,
			humidity: 75,
			wind_kph: 18,
			wind_degree: 220,
			condition: { code: 1003 },
			is_day: 1,
			snow_cm: 0.2,
			precip_mm: 1.1,
			uv: 2
		},
		forecast: {
			forecastday: [
				{
					date: "2100-01-01",
					date_epoch: 4102444800,
					astro: {
						sunrise: "07:45 AM",
						sunset: "05:05 PM"
					},
					day: {
						mintemp_c: -8,
						maxtemp_c: -1,
						avgtemp_c: -4,
						avghumidity: 81,
						totalsnow_cm: 0.6,
						totalprecip_mm: 2,
						maxwind_kph: 22,
						uv: 1,
						condition: { code: 1183 }
					},
					hour: [
						{
							time: "2100-01-01 01:00",
							time_epoch: 4102448400,
							temp_c: -5,
							humidity: 85,
							wind_kph: 15,
							wind_degree: 210,
							wind_dir: "SSW",
							condition: { code: 1183 },
							is_day: 0,
							snow_cm: 0.1,
							precip_mm: 0.5,
							will_it_rain: 1,
							will_it_snow: 0,
							uv: 0
						},
						{
							time: "2100-01-01 02:00",
							time_epoch: 4102452000,
							temp_c: -4.5,
							humidity: 83,
							wind_kph: 13,
							wind_degree: 205,
							wind_dir: "SSW",
							condition: { code: 1003 },
							is_day: 0,
							snow_cm: 0,
							precip_mm: 0.2,
							will_it_rain: 0,
							will_it_snow: 0,
							uv: 0
						},
						{
							time: "2100-01-01 03:00",
							time_epoch: 4102455600,
							temp_c: -4,
							humidity: 80,
							wind_kph: 12,
							wind_degree: 200,
							wind_dir: "SSW",
							condition: { code: 1000 },
							is_day: 0,
							snow_cm: 0,
							precip_mm: 0,
							will_it_rain: 0,
							will_it_snow: 0,
							uv: 0
						}
					]
				},
				{
					date: "2100-01-02",
					date_epoch: 4102531200,
					astro: {
						sunrise: "07:44 AM",
						sunset: "05:06 PM"
					},
					day: {
						mintemp_c: -7,
						maxtemp_c: 0,
						avgtemp_c: -3.3,
						avghumidity: 78,
						totalsnow_cm: 0,
						totalprecip_mm: 0.4,
						maxwind_kph: 20,
						uv: 2,
						condition: { code: 1006 }
					},
					hour: []
				}
			]
		}
	};
}

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

describe("WeatherAPIProvider", () => {
	let WeatherAPIProvider;

	beforeAll(async () => {
		const module = await import("../../../../../../defaultmodules/weather/providers/weatherapi");
		WeatherAPIProvider = module.default;
	});

	describe("Constructor & Configuration", () => {
		it("should set config values from params", () => {
			const provider = new WeatherAPIProvider({
				lat: 43.65,
				lon: -79.38,
				apiKey: "test-key",
				type: "current"
			});
			expect(provider.config.lat).toBe(43.65);
			expect(provider.config.lon).toBe(-79.38);
			expect(provider.config.apiKey).toBe("test-key");
			expect(provider.config.type).toBe("current");
		});

		it("should have default values", () => {
			const provider = new WeatherAPIProvider({ apiKey: "test-key" });
			expect(provider.config.apiBase).toBe("https://api.weatherapi.com/v1");
			expect(provider.config.type).toBe("current");
			expect(provider.config.maxEntries).toBe(5);
			expect(provider.config.updateInterval).toBe(10 * 60 * 1000);
		});
	});

	describe("Current Weather Parsing", () => {
		it("should parse current weather data correctly", async () => {
			const provider = new WeatherAPIProvider({
				lat: 43.65,
				lon: -79.38,
				apiKey: "test-key",
				type: "current"
			});

			const dataPromise = new Promise((resolve, reject) => {
				provider.setCallbacks(resolve, reject);
			});

			server.use(
				http.get(WEATHER_API_URL, () => HttpResponse.json(buildWeatherApiResponse()))
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(result).toBeDefined();
			expect(result.temperature).toBe(-2.5);
			expect(result.feelsLikeTemp).toBe(-7.1);
			expect(result.humidity).toBe(75);
			expect(result.windSpeed).toBeCloseTo(5, 1);
			expect(result.windFromDirection).toBe(220);
			expect(result.weatherType).toBe("day-cloudy");
			expect(result.sunrise).toBeInstanceOf(Date);
			expect(result.sunset).toBeInstanceOf(Date);
			expect(result.minTemperature).toBe(-8);
			expect(result.maxTemperature).toBe(-1);
		});
	});

	describe("Forecast Parsing", () => {
		it("should parse daily forecast data correctly", async () => {
			const provider = new WeatherAPIProvider({
				lat: 43.65,
				lon: -79.38,
				apiKey: "test-key",
				type: "forecast",
				maxEntries: 2,
				maxNumberOfDays: 2
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(WEATHER_API_URL, () => HttpResponse.json(buildWeatherApiResponse()))
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(2);
			expect(result[0].minTemperature).toBe(-8);
			expect(result[0].maxTemperature).toBe(-1);
			expect(result[0].weatherType).toBe("day-sprinkle");
			expect(result[0].sunrise).toBeInstanceOf(Date);
			expect(result[0].sunset).toBeInstanceOf(Date);
		});
	});

	describe("Hourly Parsing", () => {
		it("should parse hourly forecast data correctly", async () => {
			const provider = new WeatherAPIProvider({
				lat: 43.65,
				lon: -79.38,
				apiKey: "test-key",
				type: "hourly",
				maxEntries: 3,
				maxNumberOfDays: 1
			});

			const dataPromise = new Promise((resolve) => {
				provider.setCallbacks(resolve, vi.fn());
			});

			server.use(
				http.get(WEATHER_API_URL, () => HttpResponse.json(buildWeatherApiResponse()))
			);

			await provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(3);
			expect(result[0].temperature).toBe(-5);
			expect(result[0].humidity).toBe(85);
			expect(result[0].windFromDirection).toBe(210);
			expect(result[0].weatherType).toBe("night-sprinkle");
			expect(result[0].precipitationProbability).toBe(50);
		});
	});

	describe("Error Handling", () => {
		it("should call error callback on invalid API response", async () => {
			const provider = new WeatherAPIProvider({
				lat: 43.65,
				lon: -79.38,
				apiKey: "test-key",
				type: "current"
			});

			const errorPromise = new Promise((resolve) => {
				provider.setCallbacks(vi.fn(), resolve);
			});

			server.use(
				http.get(WEATHER_API_URL, () => HttpResponse.json({
					location: {},
					current: {},
					forecast: { forecastday: "invalid" }
				}))
			);

			await provider.initialize();
			provider.start();

			const error = await errorPromise;
			expect(error).toHaveProperty("message");
			expect(error).toHaveProperty("translationKey");
		});
	});
});
