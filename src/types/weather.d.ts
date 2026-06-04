/*
 * Ambient types for the weather subsystem (providers, node_helper, weather module).
 * Included by both the browser and server tsconfig.
 *
 * Providers parse external APIs (those raw payloads stay `any`) and emit arrays of
 * WeatherDataPoint via their data callback; the browser weather module turns them into
 * WeatherObject instances. Fields are optional and an index signature allows
 * provider-specific extras (rain, snow, uvIndex, ...), so applying these types is a
 * safe refinement of the previous `any`.
 */

interface WeatherDataPoint {
	date?: any;
	windSpeed?: number | null;
	windFromDirection?: number | null;
	sunrise?: any;
	sunset?: any;
	temperature?: number | null;
	minTemperature?: number | null;
	maxTemperature?: number | null;
	weatherType?: string | null;
	humidity?: number | null;
	precipitationAmount?: number | null;
	precipitationUnits?: string | null;
	precipitationProbability?: number | null;
	feelsLikeTemp?: number | null;
	[key: string]: any;
}

interface WeatherConfig {
	lat?: number;
	lon?: number;
	location?: string;
	locationID?: string | number;
	type?: string;
	weatherProvider?: string;
	apiKey?: string;
	apiBase?: string;
	units?: string;
	tempUnits?: string;
	windUnits?: string;
	lang?: string;
	instanceId?: string;
	reloadInterval?: number;
	updateInterval?: number;
	[key: string]: any;
}

interface WeatherError {
	message: string;
	translationKey?: string;
	status?: number | null;
	errorType?: string;
	[key: string]: any;
}

type WeatherDataCallback = (data: WeatherDataPoint[]) => void;
type WeatherErrorCallback = (error: WeatherError) => void;
