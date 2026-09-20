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
});
