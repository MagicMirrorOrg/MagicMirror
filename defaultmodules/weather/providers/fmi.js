const Log = require("logger");
const { validateCoordinates } = require("../provider-utils");
const WeatherProvider = require("../weatherprovider");

const FMI_WFS_URL = "https://opendata.fmi.fi/wfs";
const FMI_TIMESERIES_URL = "https://opendata.fmi.fi/timeseries";

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

const OBSERVATION_PARAMETERS = [
	"utctime",
	"fmisid",
	"stationname",
	"stationlat",
	"stationlon",
	"distance",
	"t2m",
	"rh",
	"ws_10min",
	"wd_10min",
	"wg_10min",
	"p_sea",
	"r_1h"
].join(",");

/**
 * Server-side weather provider for the Finnish Meteorological Institute (FMI).
 *
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

	/**
	 * Build the FMI Timeseries URL used for current observations.
	 * FMI resolves the configured coordinates to a nearby observation station.
	 * @returns {string} FMI Timeseries request URL.
	 */
	buildObservationUrl () {
		const url = new URL(FMI_TIMESERIES_URL);

		url.search = new URLSearchParams({
			producer: "observations_fmi",
			latlon: `${this.config.lat},${this.config.lon}`,
			param: OBSERVATION_PARAMETERS,
			format: "json"
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
}

module.exports = FMIProvider;
