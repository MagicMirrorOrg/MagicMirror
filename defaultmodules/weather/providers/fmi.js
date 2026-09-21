const Log = require("logger");
const { validateCoordinates } = require("../provider-utils");
const WeatherProvider = require("../weatherprovider");

const FMI_WFS_URL = "https://opendata.fmi.fi/wfs";
const OBSERVATION_QUERY = "fmi::observations::weather::timevaluepair";
const HTTPFetcher = require("#http_fetcher");

const OBSERVATION_PARAMETERS = [
	"t2m",
	"rh",
	"ws_10min",
	"wd_10min",
	"wg_10min",
	"p_sea",
	"r_1h"
].join(",");

const REQUIRED_OBSERVATION_PARAMETERS = [
	"t2m",
	"rh",
	"ws_10min",
	"wd_10min",
	"p_sea"
];

const OBSERVATION_LOOKBACK_MINUTES = 30;
const OBSERVATION_BBOX_RADIUS = 0.25;

const HARMONIE_FORECAST_QUERY = "fmi::forecast::harmonie::surface::point::timevaluepair";

const HARMONIE_FORECAST_PARAMETERS = [
	"Temperature",
	"Humidity",
	"WindSpeedMS",
	"WindDirection",
	"WindGust",
	"Pressure",
	"Precipitation1h",
	"WeatherSymbol3"
].join(",");

const EARTH_RADIUS_KM = 6371;

const FMI_TIME_ZONE = "Europe/Helsinki";

/**
 * Convert degrees to radians.
 * @param {number} degrees Angle in degrees.
 * @returns {number} Angle in radians.
 */
const toRadians = (degrees) => degrees * (Math.PI / 180);

/**
 * Calculate the great-circle distance between two coordinates.
 * @param {number} lat1 First latitude.
 * @param {number} lon1 First longitude.
 * @param {number} lat2 Second latitude.
 * @param {number} lon2 Second longitude.
 * @returns {number} Distance in kilometres.
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
	const latDifference = toRadians(lat2 - lat1);
	const lonDifference = toRadians(lon2 - lon1);

	const a
		= Math.sin(latDifference / 2) ** 2
		  + Math.cos(toRadians(lat1))
		  * Math.cos(toRadians(lat2))
		  * Math.sin(lonDifference / 2) ** 2;

	return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const WEATHER_SYMBOL_MAP = {
	1: "day-sunny",
	2: "day-cloudy",
	3: "cloudy",
	21: "showers",
	22: "showers",
	23: "showers",
	31: "rain",
	32: "rain",
	33: "rain",
	41: "snow",
	42: "snow",
	43: "snow",
	51: "snow",
	52: "snow",
	53: "snow",
	61: "thunderstorm",
	62: "thunderstorm",
	63: "thunderstorm",
	64: "thunderstorm",
	71: "sleet",
	72: "sleet",
	73: "sleet",
	81: "sleet",
	82: "sleet",
	83: "sleet",
	91: "fog",
	92: "fog"
};

/**
 * Return date and hour components for an FMI timestamp in Finnish local time.
 * @param {string|Date} value Forecast timestamp.
 * @returns {{dateKey: string, hour: number}} Local date key and hour.
 */
const getFinnishLocalTime = (value) => {
	const date = new Date(value);
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: FMI_TIME_ZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		hourCycle: "h23"
	}).formatToParts(date);

	const getPart = (type) => parts.find((part) => part.type === type)?.value;

	return {
		dateKey: `${getPart("year")}-${getPart("month")}-${getPart("day")}`,
		hour: Number(getPart("hour"))
	};
};

/**
 * Server-side weather provider for the Finnish Meteorological Institute (FMI).
 * Uses FMI Open Data for weather observations and forecasts.
 */
class FMIProvider extends WeatherProvider {
	constructor (config) {
		super();

		this.config = {
			lat: 0,
			lon: 0,
			type: "current",
			updateInterval: 10 * 60 * 1000,
			...config
		};
	}

	initialize () {
		try {
			validateCoordinates(this.config);

			if (this.config.type === "current") {
				this.#initializeObservationFetcher();
			} else if (
				this.config.type === "hourly"
				|| this.config.type === "forecast"
				|| this.config.type === "daily"
			) {
				this.#initializeForecastFetcher();
			}
		} catch (error) {
			Log.error("[fmi] Initialization failed:", error);

			if (this.onErrorCallback) {
				this.onErrorCallback({
					message: error.message,
					translationKey: "MODULE_ERROR_UNSPECIFIED"
				});
			}
		}
	}

	#initializeObservationFetcher () {
		if (this.config.type !== "current") {
			return;
		}

		this.fetcher = new HTTPFetcher(() => this.buildObservationUrl(), {
			reloadInterval: this.config.updateInterval,
			logContext: "weatherprovider.fmi"
		});

		this.fetcher.on("response", async (response) => {
			if (response.status === 304) {
				return;
			}

			try {
				const xml = await response.text();
				const observations = this.parseObservationXml(xml);
				const selectedStation = this.selectNearestObservationStation(observations);

				if (!selectedStation) {
					throw new Error("No suitable FMI observation station found");
				}

				const weatherData = this.generateCurrentWeather(selectedStation);

				if (this.onDataCallback) {
					this.onDataCallback(weatherData);
				}
			} catch (error) {
				Log.error("[fmi] Failed to process observation data:", error);

				if (this.onErrorCallback) {
					this.onErrorCallback({
						message: error.message,
						translationKey: "MODULE_ERROR_UNSPECIFIED"
					});
				}
			}
		});

		this.fetcher.on("error", (errorInfo) => {
			if (this.onErrorCallback) {
				this.onErrorCallback(errorInfo);
			}
		});
	}

	#initializeForecastFetcher () {
		this.fetcher = new HTTPFetcher(() => this.buildForecastUrl(), {
			reloadInterval: this.config.updateInterval,
			logContext: "weatherprovider.fmi"
		});

		this.fetcher.on("response", async (response) => {
			if (response.status === 304) {
				return;
			}

			try {
				const xml = await response.text();
				const forecasts = this.parseForecastXml(xml);
				const weatherData
					= this.config.type === "hourly"
						? this.generateHourlyForecast(forecasts)
						: this.generateDailyForecast(forecasts);

				if (this.onDataCallback) {
					this.onDataCallback(weatherData);
				}
			} catch (error) {
				Log.error("[fmi] Failed to process forecast data:", error);

				if (this.onErrorCallback) {
					this.onErrorCallback({
						message: error.message,
						translationKey: "MODULE_ERROR_UNSPECIFIED"
					});
				}
			}
		});

		this.fetcher.on("error", (errorInfo) => {
			if (this.onErrorCallback) {
				this.onErrorCallback(errorInfo);
			}
		});
	}

	generateCurrentWeather (selectedStation) {
		const { values } = selectedStation;

		const dates = Object.values(values)
			.map((measurement) => measurement.time)
			.filter(Boolean)
			.map((time) => new Date(time));

		const current = {
			date: dates.length > 0
				? new Date(Math.max(...dates.map((date) => date.getTime())))
				: new Date(),
			temperature: values.t2m.value,
			humidity: values.rh.value,
			windSpeed: values.ws_10min.value,
			windFromDirection: values.wd_10min.value,
			pressure: values.p_sea.value
		};

		if (values.wg_10min) {
			current.windGust = values.wg_10min.value;
		}

		if (values.r_1h) {
			current.precipitationAmount = values.r_1h.value;
		}

		this.locationName = selectedStation.station.name;

		return current;
	}

	/**
	 * Build the FMI WFS URL used for current weather observations.
	 * The bounding box allows FMI to return nearby observation stations so the
	 * provider can select the station closest to the configured coordinates.
	 * @param {Date} [now] Current time used to build the observation window.
	 * @returns {string} FMI WFS observation request URL.
	 */
	buildObservationUrl (now = new Date()) {
		const startTime = new Date(now.getTime() - OBSERVATION_LOOKBACK_MINUTES * 60 * 1000);

		const minLon = this.config.lon - OBSERVATION_BBOX_RADIUS;
		const minLat = this.config.lat - OBSERVATION_BBOX_RADIUS;
		const maxLon = this.config.lon + OBSERVATION_BBOX_RADIUS;
		const maxLat = this.config.lat + OBSERVATION_BBOX_RADIUS;

		const url = new URL(FMI_WFS_URL);

		url.search = new URLSearchParams({
			service: "WFS",
			version: "2.0.0",
			request: "getFeature",
			storedquery_id: OBSERVATION_QUERY,
			bbox: `${minLon},${minLat},${maxLon},${maxLat}`,
			starttime: startTime.toISOString(),
			endtime: now.toISOString(),
			parameters: OBSERVATION_PARAMETERS
		}).toString();

		return url.toString();
	}

	/**
	 * Build the FMI WFS URL used for HARMONIE point forecasts.
	 * @returns {string} FMI WFS forecast request URL.
	 */
	buildForecastUrl () {
		const url = new URL(FMI_WFS_URL);

		url.search = new URLSearchParams({
			service: "WFS",
			version: "2.0.0",
			request: "getFeature",
			storedquery_id: HARMONIE_FORECAST_QUERY,
			latlon: `${this.config.lat},${this.config.lon}`,
			parameters: HARMONIE_FORECAST_PARAMETERS
		}).toString();

		return url.toString();
	}


	/**
	 * Parse FMI WFS point time-series observations.
	 * @param {string} xml FMI WFS response body.
	 * @returns {object[]} Parsed observations.
	 */
	parseObservationXml (xml) {
		const observations = [];
		const observationPattern = /<omso:PointTimeSeriesObservation\b[^>]*>(.*?)<\/omso:PointTimeSeriesObservation>/gs;

		for (const match of xml.matchAll(observationPattern)) {
			const observation = this.#parseObservation(match[1]);

			if (observation) {
				observations.push(observation);
			}
		}

		return observations;
	}

	parseForecastXml (xml) {
		const forecastsByTime = new Map();
		const observationPattern
			= /<omso:PointTimeSeriesObservation\b[^>]*>(.*?)<\/omso:PointTimeSeriesObservation>/gs;

		for (const match of xml.matchAll(observationPattern)) {
			const observation = this.#parseForecastObservation(match[1]);

			if (!observation) {
				continue;
			}

			for (const measurement of observation.measurements) {
				if (!forecastsByTime.has(measurement.time)) {
					forecastsByTime.set(measurement.time, {
						time: measurement.time
					});
				}

				forecastsByTime.get(measurement.time)[observation.parameter] = measurement.value;
			}
		}

		return [...forecastsByTime.values()].sort(
			(a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
		);
	}

	generateHourlyForecast (forecasts) {
		return forecasts.map((forecast) => ({
			date: new Date(forecast.time),
			temperature: forecast.Temperature,
			humidity: forecast.Humidity,
			windSpeed: forecast.WindSpeedMS,
			windFromDirection: forecast.WindDirection,
			windGust: forecast.WindGust,
			pressure: forecast.Pressure,
			precipitationAmount: forecast.Precipitation1h,
			weatherType: WEATHER_SYMBOL_MAP[forecast.WeatherSymbol3]
		}));
	}

	generateDailyForecast (forecasts) {
		const dayMap = new Map();

		for (const forecast of forecasts) {
			const { dateKey, hour } = getFinnishLocalTime(forecast.time);

			if (!dayMap.has(dateKey)) {
				dayMap.set(dateKey, {
					date: new Date(forecast.time),
					temperatures: [],
					precipitationAmount: 0,
					weatherType: WEATHER_SYMBOL_MAP[forecast.WeatherSymbol3]
				});
			}

			const day = dayMap.get(dateKey);

			if (Number.isFinite(forecast.Temperature)) {
				day.temperatures.push(forecast.Temperature);
			}

			if (Number.isFinite(forecast.Precipitation1h)) {
				day.precipitationAmount += forecast.Precipitation1h;
			}

			if (hour >= 8 && hour <= 17 && Number.isFinite(forecast.WeatherSymbol3)) {
				day.weatherType = WEATHER_SYMBOL_MAP[forecast.WeatherSymbol3];
			}
		}

		return Array.from(dayMap.values())
			.filter((day) => day.temperatures.length > 0)
			.map((day) => ({
				date: day.date,
				minTemperature: Math.min(...day.temperatures),
				maxTemperature: Math.max(...day.temperatures),
				weatherType: day.weatherType,
				precipitationAmount: day.precipitationAmount
			}));
	}

	/**
	 * Group parsed observations by station and select the station nearest to
	 * the configured coordinates.
	 * @param {object[]} observations Parsed FMI observations.
	 * @returns {object|null} Normalized data for the nearest station.
	 */
	selectNearestObservationStation (observations) {
		const stations = new Map();

		for (const observation of observations) {
			const { station, parameter, measurements } = observation;

			if (!stations.has(station.id)) {
				stations.set(station.id, {
					station: {
						...station,
						distance: calculateDistance(
							this.config.lat,
							this.config.lon,
							station.lat,
							station.lon
						)
					},
					values: {}
				});
			}

			const latestMeasurement = this.#getLatestMeasurement(measurements);

			if (latestMeasurement) {
				stations.get(station.id).values[parameter] = latestMeasurement;
			}
		}

		if (stations.size === 0) {
			return null;
		}

		const completeStations = [...stations.values()].filter((station) => REQUIRED_OBSERVATION_PARAMETERS.every((parameter) => Object.hasOwn(station.values, parameter)));

		if (completeStations.length === 0) {
			return null;
		}

		return completeStations.reduce((nearest, station) => (station.station.distance < nearest.station.distance ? station : nearest));
	}

	/**
	 * Select the newest valid measurement from a parameter time series.
	 * @param {object[]} measurements Parsed measurements.
	 * @returns {object|null} Latest measurement.
	 */
	#getLatestMeasurement (measurements) {
		let latest = null;

		for (const measurement of measurements) {
			const timestamp = Date.parse(measurement.time);

			if (!Number.isFinite(timestamp) || !Number.isFinite(measurement.value)) {
				continue;
			}

			if (!latest || timestamp > latest.timestamp) {
				latest = {
					time: measurement.time,
					value: measurement.value,
					timestamp
				};
			}
		}

		if (!latest) {
			return null;
		}

		return {
			time: latest.time,
			value: latest.value
		};
	}

	/**
	 * Parse one FMI point time-series observation.
	 * @param {string} xml Observation XML.
	 * @returns {object|null} Parsed observation, or null when required metadata is missing.
	 */
	#parseObservation (xml) {
		const parameter = this.#extractAttributeQueryParameter(xml, "observedProperty", "param");
		const stationId = this.#extract(
			xml,
			/<gml:identifier[^>]*codeSpace="http:\/\/xml\.fmi\.fi\/namespace\/stationcode\/fmisid"[^>]*>([^<]+)<\/gml:identifier>/
		);
		const stationName = this.#extract(
			xml,
			/<gml:name[^>]*codeSpace="http:\/\/xml\.fmi\.fi\/namespace\/locationcode\/name"[^>]*>([^<]+)<\/gml:name>/
		);
		const position = this.#extract(xml, /<gml:pos[^>]*>([^<]+)<\/gml:pos>/);

		if (!parameter || !stationId || !stationName || !position) {
			return null;
		}

		const coordinates = position
			.trim()
			.split(/\s+/)
			.map(Number);

		if (coordinates.length !== 2 || coordinates.some((coordinate) => !Number.isFinite(coordinate))) {
			return null;
		}

		const measurements = [];
		const measurementPattern = /<wml2:MeasurementTVP>(.*?)<\/wml2:MeasurementTVP>/gs;

		for (const match of xml.matchAll(measurementPattern)) {
			const time = this.#extract(match[1], /<wml2:time>([^<]+)<\/wml2:time>/);
			const value = this.#extract(match[1], /<wml2:value>([^<]+)<\/wml2:value>/);

			if (!time || value === null) {
				continue;
			}

			const numericValue = Number(value);

			if (!Number.isFinite(numericValue)) {
				continue;
			}

			measurements.push({
				time,
				value: numericValue
			});
		}

		return {
			parameter,
			station: {
				id: Number(stationId),
				name: stationName,
				lat: coordinates[0],
				lon: coordinates[1]
			},
			measurements
		};
	}

	/**
	 * Parse one FMI forecast point time-series observation.
	 * Forecast data does not contain observation-station metadata.
	 * @param {string} xml Forecast observation XML.
	 * @returns {object|null} Parsed forecast observation.
	 */
	#parseForecastObservation (xml) {
		const parameter = this.#extractAttributeQueryParameter(xml, "observedProperty", "param");

		if (!parameter) {
			return null;
		}

		const measurements = [];
		const measurementPattern = /<wml2:MeasurementTVP>(.*?)<\/wml2:MeasurementTVP>/gs;

		for (const match of xml.matchAll(measurementPattern)) {
			const time = this.#extract(match[1], /<wml2:time>([^<]+)<\/wml2:time>/);
			const value = this.#extract(match[1], /<wml2:value>([^<]+)<\/wml2:value>/);

			if (!time || value === null) {
				continue;
			}

			const numericValue = Number(value);

			if (!Number.isFinite(numericValue)) {
				continue;
			}

			measurements.push({
				time,
				value: numericValue
			});
		}

		return {
			parameter,
			measurements
		};
	}

	/**
	 * Extract text captured by a regular expression.
	 * @param {string} value Source string.
	 * @param {RegExp} pattern Pattern containing one capture group.
	 * @returns {string|null} Captured value.
	 */
	#extract (value, pattern) {
		const match = value.match(pattern);
		return match ? match[1].trim() : null;
	}

	/**
	 * Extract a query parameter from an FMI xlink:href attribute.
	 * @param {string} xml Observation XML.
	 * @param {string} elementName Element containing the xlink:href attribute.
	 * @param {string} parameterName Query parameter to extract.
	 * @returns {string|null} Query parameter value.
	 */
	#extractAttributeQueryParameter (xml, elementName, parameterName) {
		const pattern = new RegExp(`<om:${elementName}\\b[^>]*xlink:href="([^"]+)"`);
		const href = this.#extract(xml, pattern);

		if (!href) {
			return null;
		}

		const decodedHref = href.replaceAll("&amp;", "&");

		try {
			return new URL(decodedHref).searchParams.get(parameterName);
		} catch {
			return null;
		}
	}
}

module.exports = FMIProvider;
