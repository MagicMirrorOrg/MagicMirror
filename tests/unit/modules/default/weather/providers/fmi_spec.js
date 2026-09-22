import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";

const FMI_WFS_PATTERN = "https://opendata.fmi.fi/wfs";

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
				type: "hourly",
				updateInterval: 15 * 60 * 1000
			});

			expect(provider.config.type).toBe("hourly");
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

			const now = new Date("2026-09-20T07:34:36.000Z");
			const url = new URL(provider.buildObservationUrl(now));

			expect(url.origin).toBe("https://opendata.fmi.fi");
			expect(url.pathname).toBe("/wfs");
			expect(url.searchParams.get("service")).toBe("WFS");
			expect(url.searchParams.get("version")).toBe("2.0.0");
			expect(url.searchParams.get("request")).toBe("getFeature");
			expect(url.searchParams.get("storedquery_id")).toBe(
				"fmi::observations::weather::timevaluepair"
			);
			expect(url.searchParams.get("bbox")).toBe("24.6884,59.9199,25.1884,60.4199");
			expect(url.searchParams.get("starttime")).toBe("2026-09-20T07:04:36.000Z");
			expect(url.searchParams.get("endtime")).toBe("2026-09-20T07:34:36.000Z");
			expect(url.searchParams.get("parameters")).toContain("t2m");
			expect(url.searchParams.get("parameters")).toContain("r_1h");
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
	describe("Observation Parsing", () => {
		it("should parse an FMI point time-series observation", () => {
			const provider = new FMIProvider({
				lat: 60.1699,
				lon: 24.9384
			});

			const xml = `
				<wfs:FeatureCollection>
					<wfs:member>
						<omso:PointTimeSeriesObservation>
							<om:observedProperty xlink:href="https://opendata.fmi.fi/meta?observableProperty=observation&amp;param=t2m&amp;language=eng" />
							<gml:identifier codeSpace="http://xml.fmi.fi/namespace/stationcode/fmisid">100968</gml:identifier>
							<gml:name codeSpace="http://xml.fmi.fi/namespace/locationcode/name">Vantaa Helsinki-Vantaan lentoasema</gml:name>
							<gml:pos>60.32937 24.97274 </gml:pos>
							<wml2:MeasurementTimeseries>
								<wml2:point>
									<wml2:MeasurementTVP>
										<wml2:time>2026-09-20T07:30:00Z</wml2:time>
										<wml2:value>14.0</wml2:value>
									</wml2:MeasurementTVP>
								</wml2:point>
								<wml2:point>
									<wml2:MeasurementTVP>
										<wml2:time>2026-09-20T07:40:00Z</wml2:time>
										<wml2:value>14.3</wml2:value>
									</wml2:MeasurementTVP>
								</wml2:point>
							</wml2:MeasurementTimeseries>
						</omso:PointTimeSeriesObservation>
					</wfs:member>
				</wfs:FeatureCollection>
			`;

			expect(provider.parseObservationXml(xml)).toEqual([
				{
					parameter: "t2m",
					station: {
						id: 100968,
						name: "Vantaa Helsinki-Vantaan lentoasema",
						lat: 60.32937,
						lon: 24.97274
					},
					measurements: [
						{
							time: "2026-09-20T07:30:00Z",
							value: 14
						},
						{
							time: "2026-09-20T07:40:00Z",
							value: 14.3
						}
					]
				}
			]);
		});
	});
	describe("Observation Station Selection", () => {
		it("should select the nearest station and latest measurements", () => {
			const provider = new FMIProvider({
				lat: 60.1699,
				lon: 24.9384
			});

			const observations = [
				{
					parameter: "t2m",
					station: {
						id: 100971,
						name: "Helsinki Kaisaniemi",
						lat: 60.17523,
						lon: 24.94459
					},
					measurements: [
						{
							time: "2026-09-20T07:30:00Z",
							value: 13.8
						},
						{
							time: "2026-09-20T07:40:00Z",
							value: 14.1
						}
					]
				},
				{
					parameter: "rh",
					station: {
						id: 100971,
						name: "Helsinki Kaisaniemi",
						lat: 60.17523,
						lon: 24.94459
					},
					measurements: [
						{
							time: "2026-09-20T07:30:00Z",
							value: 81
						},
						{
							time: "2026-09-20T07:40:00Z",
							value: 79
						}
					]
				},
				{
					parameter: "ws_10min",
					station: {
						id: 100971,
						name: "Helsinki Kaisaniemi",
						lat: 60.17523,
						lon: 24.94459
					},
					measurements: [
						{
							time: "2026-09-20T07:40:00Z",
							value: 3.2
						}
					]
				},
				{
					parameter: "wd_10min",
					station: {
						id: 100971,
						name: "Helsinki Kaisaniemi",
						lat: 60.17523,
						lon: 24.94459
					},
					measurements: [
						{
							time: "2026-09-20T07:40:00Z",
							value: 210
						}
					]
				},
				{
					parameter: "p_sea",
					station: {
						id: 100971,
						name: "Helsinki Kaisaniemi",
						lat: 60.17523,
						lon: 24.94459
					},
					measurements: [
						{
							time: "2026-09-20T07:40:00Z",
							value: 1013.2
						}
					]
				},
				{
					parameter: "t2m",
					station: {
						id: 100968,
						name: "Vantaa Helsinki-Vantaan lentoasema",
						lat: 60.32937,
						lon: 24.97274
					},
					measurements: [
						{
							time: "2026-09-20T07:40:00Z",
							value: 14.3
						}
					]
				}
			];

			const result = provider.selectNearestObservationStation(observations);

			expect(result.station.id).toBe(100971);
			expect(result.station.name).toBe("Helsinki Kaisaniemi");
			expect(result.station.distance).toBeGreaterThan(0);
			expect(result.station.distance).toBeLessThan(1);
			expect(result.values.t2m).toEqual({
				time: "2026-09-20T07:40:00Z",
				value: 14.1
			});
			expect(result.values.rh).toEqual({
				time: "2026-09-20T07:40:00Z",
				value: 79
			});
		});

		it("should return null when no observations are available", () => {
			const provider = new FMIProvider({
				lat: 60.1699,
				lon: 24.9384
			});

			expect(provider.selectNearestObservationStation([])).toBeNull();
		});
		it("should skip a nearer station when required observations are missing", () => {
			const provider = new FMIProvider({
				lat: 60.1699,
				lon: 24.9384
			});

			const createObservation = (parameter, station, value) => ({
				parameter,
				station,
				measurements: [
					{
						time: "2026-09-20T07:40:00Z",
						value
					}
				]
			});

			const nearerStation = {
				id: 1,
				name: "Near station",
				lat: 60.17,
				lon: 24.94
			};

			const completeStation = {
				id: 2,
				name: "Complete station",
				lat: 60.2,
				lon: 24.96
			};

			const observations = [
				createObservation("t2m", nearerStation, 14.1),
				createObservation("rh", nearerStation, 79),

				createObservation("t2m", completeStation, 14.0),
				createObservation("rh", completeStation, 80),
				createObservation("ws_10min", completeStation, 3.2),
				createObservation("wd_10min", completeStation, 210),
				createObservation("p_sea", completeStation, 1013.2)
			];

			const result = provider.selectNearestObservationStation(observations);

			expect(result.station.id).toBe(2);
			expect(result.station.name).toBe("Complete station");
		});
	});
	describe("Current Weather Generation", () => {
		it("should convert selected FMI observations to MagicMirror weather data", () => {
			const provider = new FMIProvider({
				lat: 60.1699,
				lon: 24.9384
			});

			const selectedStation = {
				station: {
					id: 100971,
					name: "Helsinki Kaisaniemi",
					lat: 60.17523,
					lon: 24.94459,
					distance: 0.8
				},
				values: {
					t2m: {
						time: "2026-09-20T07:40:00Z",
						value: 14.1
					},
					rh: {
						time: "2026-09-20T07:40:00Z",
						value: 79
					},
					ws_10min: {
						time: "2026-09-20T07:40:00Z",
						value: 3.2
					},
					wd_10min: {
						time: "2026-09-20T07:40:00Z",
						value: 210
					},
					wg_10min: {
						time: "2026-09-20T07:40:00Z",
						value: 5.6
					},
					p_sea: {
						time: "2026-09-20T07:40:00Z",
						value: 1013.2
					},
					r_1h: {
						time: "2026-09-20T07:40:00Z",
						value: 0.2
					}
				}
			};

			const result = provider.generateCurrentWeather(selectedStation);

			expect(result.date).toEqual(new Date("2026-09-20T07:40:00Z"));
			expect(result.temperature).toBe(14.1);
			expect(result.humidity).toBe(79);
			expect(result.windSpeed).toBe(3.2);
			expect(result.windFromDirection).toBe(210);
			expect(result.windGust).toBe(5.6);
			expect(result.pressure).toBe(1013.2);
			expect(result.precipitationAmount).toBe(0.2);
			expect(provider.locationName).toBe("Helsinki Kaisaniemi");
		});
	});
	describe("Forecast Parsing", () => {
		it("should combine FMI HARMONIE parameter time series by forecast time", () => {
			const provider = new FMIProvider({
				lat: 60.1699,
				lon: 24.9384
			});

			const xml = `
			<wfs:FeatureCollection
				xmlns:wfs="http://www.opengis.net/wfs/2.0"
				xmlns:gml="http://www.opengis.net/gml/3.2"
				xmlns:om="http://www.opengis.net/om/2.0"
				xmlns:omso="http://inspire.ec.europa.eu/schemas/omso/3.0"
				xmlns:wml2="http://www.opengis.net/waterml/2.0"
				xmlns:xlink="http://www.w3.org/1999/xlink">

				<wfs:member>
					<omso:PointTimeSeriesObservation>
						<om:observedProperty
							xlink:href="https://opendata.fmi.fi/meta?observableProperty=forecast&amp;param=Temperature&amp;language=eng"/>
						<om:result>
							<wml2:MeasurementTimeseries>
								<wml2:point>
									<wml2:MeasurementTVP>
										<wml2:time>2026-09-20T09:00:00Z</wml2:time>
										<wml2:value>15.1</wml2:value>
									</wml2:MeasurementTVP>
								</wml2:point>
								<wml2:point>
									<wml2:MeasurementTVP>
										<wml2:time>2026-09-20T10:00:00Z</wml2:time>
										<wml2:value>15.5</wml2:value>
									</wml2:MeasurementTVP>
								</wml2:point>
							</wml2:MeasurementTimeseries>
						</om:result>
					</omso:PointTimeSeriesObservation>
				</wfs:member>

				<wfs:member>
					<omso:PointTimeSeriesObservation>
						<om:observedProperty
							xlink:href="https://opendata.fmi.fi/meta?observableProperty=forecast&amp;param=Humidity&amp;language=eng"/>
						<om:result>
							<wml2:MeasurementTimeseries>
								<wml2:point>
									<wml2:MeasurementTVP>
										<wml2:time>2026-09-20T09:00:00Z</wml2:time>
										<wml2:value>72</wml2:value>
									</wml2:MeasurementTVP>
								</wml2:point>
								<wml2:point>
									<wml2:MeasurementTVP>
										<wml2:time>2026-09-20T10:00:00Z</wml2:time>
										<wml2:value>68</wml2:value>
									</wml2:MeasurementTVP>
								</wml2:point>
							</wml2:MeasurementTimeseries>
						</om:result>
					</omso:PointTimeSeriesObservation>
				</wfs:member>
			</wfs:FeatureCollection>
		`;

			const forecasts = provider.parseForecastXml(xml);

			expect(forecasts).toEqual([
				{
					time: "2026-09-20T09:00:00Z",
					Temperature: 15.1,
					Humidity: 72
				},
				{
					time: "2026-09-20T10:00:00Z",
					Temperature: 15.5,
					Humidity: 68
				}
			]);
		});
	});
	describe("Hourly Forecast Generation", () => {
		it("should convert parsed FMI forecasts to MagicMirror hourly weather data", () => {
			const provider = new FMIProvider({
				lat: 60.1699,
				lon: 24.9384
			});

			const forecasts = [
				{
					time: "2026-09-20T09:00:00Z",
					Temperature: 15.1,
					Humidity: 72,
					WindSpeedMS: 3.2,
					WindDirection: 210,
					WindGust: 5.1,
					Pressure: 1013.2,
					Precipitation1h: 0,
					WeatherSymbol3: 2
				}
			];

			const hourly = provider.generateHourlyForecast(forecasts);

			expect(hourly).toHaveLength(1);
			expect(hourly[0]).toEqual({
				date: new Date("2026-09-20T09:00:00Z"),
				temperature: 15.1,
				humidity: 72,
				windSpeed: 3.2,
				windFromDirection: 210,
				windGust: 5.1,
				pressure: 1013.2,
				precipitationAmount: 0,
				weatherType: "day-cloudy"
			});
		});

		it("should map FMI weather symbols to MagicMirror weather types", () => {
			const provider = new FMIProvider({
				lat: 60.1699,
				lon: 24.9384
			});

			const symbols = [
				[1, "day-sunny"],
				[2, "day-cloudy"],
				[3, "cloudy"],
				[22, "showers"],
				[32, "rain"],
				[42, "snow"],
				[52, "snow"],
				[61, "thunderstorm"],
				[72, "sleet"],
				[82, "sleet"],
				[92, "fog"]
			];

			for (const [symbol, expectedWeatherType] of symbols) {
				const hourly = provider.generateHourlyForecast([
					{
						time: "2026-09-20T09:00:00Z",
						Temperature: 15,
						Humidity: 70,
						WindSpeedMS: 3,
						WindDirection: 180,
						WindGust: 5,
						Pressure: 1013,
						Precipitation1h: 0,
						WeatherSymbol3: symbol
					}
				]);

				expect(hourly[0].weatherType).toBe(expectedWeatherType);
			}
		});

		it("should leave weather type undefined for an unknown FMI weather symbol", () => {
			const provider = new FMIProvider({
				lat: 60.1699,
				lon: 24.9384
			});

			const hourly = provider.generateHourlyForecast([
				{
					time: "2026-09-20T09:00:00Z",
					Temperature: 15,
					Humidity: 70,
					WindSpeedMS: 3,
					WindDirection: 180,
					WindGust: 5,
					Pressure: 1013,
					Precipitation1h: 0,
					WeatherSymbol3: 999
				}
			]);

			expect(hourly[0].weatherType).toBeUndefined();
		});
	});
	describe("Forecast Fetching", () => {
		it("should fetch and process an FMI hourly forecast", async () => {
			const provider = new FMIProvider({
				lat: 60.1699,
				lon: 24.9384,
				type: "hourly"
			});

			const xml = `
			<wfs:FeatureCollection>
				<wfs:member>
					<omso:PointTimeSeriesObservation>
						<om:observedProperty xlink:href="https://opendata.fmi.fi/meta?param=Temperature" />
						<wml2:MeasurementTimeseries>
							<wml2:point>
								<wml2:MeasurementTVP>
									<wml2:time>2026-09-20T09:00:00Z</wml2:time>
									<wml2:value>15.1</wml2:value>
								</wml2:MeasurementTVP>
							</wml2:point>
						</wml2:MeasurementTimeseries>
					</omso:PointTimeSeriesObservation>
				</wfs:member>
				<wfs:member>
					<omso:PointTimeSeriesObservation>
						<om:observedProperty xlink:href="https://opendata.fmi.fi/meta?param=Humidity" />
						<wml2:MeasurementTimeseries>
							<wml2:point>
								<wml2:MeasurementTVP>
									<wml2:time>2026-09-20T09:00:00Z</wml2:time>
									<wml2:value>72</wml2:value>
								</wml2:MeasurementTVP>
							</wml2:point>
						</wml2:MeasurementTimeseries>
					</omso:PointTimeSeriesObservation>
				</wfs:member>
			</wfs:FeatureCollection>
		`;

			const dataPromise = new Promise((resolve, reject) => {
				provider.setCallbacks(resolve, reject);
			});

			server.use(
				http.get(FMI_WFS_PATTERN, () => new HttpResponse(xml, {
					headers: { "Content-Type": "application/xml" }
				}))
			);

			provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(1);
			expect(result[0].date).toEqual(new Date("2026-09-20T09:00:00Z"));
			expect(result[0].temperature).toBe(15.1);
			expect(result[0].humidity).toBe(72);

			provider.stop();
		});
		it("should fetch and process an FMI daily forecast", async () => {
			const provider = new FMIProvider({
				lat: 60.1699,
				lon: 24.9384,
				type: "forecast"
			});

			const xml = `
		<wfs:FeatureCollection>
			<wfs:member>
				<omso:PointTimeSeriesObservation>
					<om:observedProperty xlink:href="https://opendata.fmi.fi/meta?param=Temperature" />
					<wml2:MeasurementTimeseries>
						<wml2:point>
							<wml2:MeasurementTVP>
								<wml2:time>2026-09-20T04:00:00Z</wml2:time>
								<wml2:value>8.2</wml2:value>
							</wml2:MeasurementTVP>
						</wml2:point>
						<wml2:point>
							<wml2:MeasurementTVP>
								<wml2:time>2026-09-20T09:00:00Z</wml2:time>
								<wml2:value>15.1</wml2:value>
							</wml2:MeasurementTVP>
						</wml2:point>
					</wml2:MeasurementTimeseries>
				</omso:PointTimeSeriesObservation>
			</wfs:member>
			<wfs:member>
				<omso:PointTimeSeriesObservation>
					<om:observedProperty xlink:href="https://opendata.fmi.fi/meta?param=Precipitation1h" />
					<wml2:MeasurementTimeseries>
						<wml2:point>
							<wml2:MeasurementTVP>
								<wml2:time>2026-09-20T04:00:00Z</wml2:time>
								<wml2:value>0</wml2:value>
							</wml2:MeasurementTVP>
						</wml2:point>
						<wml2:point>
							<wml2:MeasurementTVP>
								<wml2:time>2026-09-20T09:00:00Z</wml2:time>
								<wml2:value>0.4</wml2:value>
							</wml2:MeasurementTVP>
						</wml2:point>
					</wml2:MeasurementTimeseries>
				</omso:PointTimeSeriesObservation>
			</wfs:member>
			<wfs:member>
				<omso:PointTimeSeriesObservation>
					<om:observedProperty xlink:href="https://opendata.fmi.fi/meta?param=WeatherSymbol3" />
					<wml2:MeasurementTimeseries>
						<wml2:point>
							<wml2:MeasurementTVP>
								<wml2:time>2026-09-20T04:00:00Z</wml2:time>
								<wml2:value>1</wml2:value>
							</wml2:MeasurementTVP>
						</wml2:point>
						<wml2:point>
							<wml2:MeasurementTVP>
								<wml2:time>2026-09-20T09:00:00Z</wml2:time>
								<wml2:value>2</wml2:value>
							</wml2:MeasurementTVP>
						</wml2:point>
					</wml2:MeasurementTimeseries>
				</omso:PointTimeSeriesObservation>
			</wfs:member>
		</wfs:FeatureCollection>
	`;

			const dataPromise = new Promise((resolve, reject) => {
				provider.setCallbacks(resolve, reject);
			});

			server.use(
				http.get(FMI_WFS_PATTERN, () => new HttpResponse(xml, {
					headers: { "Content-Type": "application/xml" }
				}))
			);

			provider.initialize();
			provider.start();

			const result = await dataPromise;

			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({
				date: new Date("2026-09-20T04:00:00Z"),
				minTemperature: 8.2,
				maxTemperature: 15.1,
				weatherType: "day-cloudy"
			});
			expect(result[0].precipitationAmount).toBeCloseTo(0.4);

			provider.stop();
		});
	});
	describe("Daily Forecast Generation", () => {
		it("should aggregate FMI forecasts into Finnish local calendar days", () => {
			const provider = new FMIProvider({
				lat: 60.1699,
				lon: 24.9384,
				type: "forecast"
			});

			const forecasts = [
				{
					time: "2026-09-20T04:00:00Z",
					Temperature: 8.2,
					Precipitation1h: 0,
					WeatherSymbol3: 1
				},
				{
					time: "2026-09-20T09:00:00Z",
					Temperature: 15.1,
					Precipitation1h: 0.4,
					WeatherSymbol3: 2
				},
				{
					time: "2026-09-20T18:00:00Z",
					Temperature: 10.3,
					Precipitation1h: 0.2,
					WeatherSymbol3: 7
				}
			];

			const daily = provider.generateDailyForecast(forecasts);

			expect(daily).toHaveLength(1);
			expect(daily[0]).toMatchObject({
				date: new Date("2026-09-20T04:00:00Z"),
				minTemperature: 8.2,
				maxTemperature: 15.1,
				weatherType: "day-cloudy"
			});
			expect(daily[0].precipitationAmount).toBeCloseTo(0.6);
		});
	});
});
