const _ = require("lodash");

/**
 * @param {object} extendedData extra data to add to the default mock data
 * @returns {string} mocked current weather data
 */
const generateWeather = (extendedData = {}) => {
	return JSON.stringify(
		_.merge(
			{},
			{
				coord: {
					lon: 11.58,
					lat: 48.14
				},
				weather: [
					{
						id: 615,
						main: "Snow",
						description: "light rain and snow",
						icon: "13d"
					},
					{
						id: 500,
						main: "Rain",
						description: "light rain",
						icon: "10d"
					}
				],
				base: "stations",
				main: {
					temp: 1.49,
					pressure: 1005,
					humidity: 93.7,
					temp_min: 1,
					temp_max: 2
				},
				visibility: 7000,
				wind: {
					speed: 11.8,
					deg: 250
				},
				clouds: {
					all: 75
				},
				dt: 1547387400,
				sys: {
					type: 1,
					id: 1267,
					message: 0.0031,
					country: "DE",
					sunrise: 1547362817,
					sunset: 1547394301
				},
				id: 2867714,
				name: "Munich",
				cod: 200
			},
			extendedData
		)
	);
};

/**
 * @param {object} extendedData extra data to add to the default mock data
 * @returns {string} mocked forecast weather data
 */
const generateWeatherForecast = (extendedData = {}) => {
	return JSON.stringify(
		_.merge(
			{},
			{
				city: {
					id: 2867714,
					name: "Munich",
					coord: { lon: 11.5754, lat: 48.1371 },
					country: "DE",
					population: 1260391,
					timezone: 7200
				},
				cod: "200",
				message: 0.9653487,
				cnt: 7,
				list: [
					{
						dt: 1568372400,
						sunrise: 1568350044,
						sunset: 1568395948,
						temp: { day: 24.44, min: 15.35, max: 24.44, night: 15.35, eve: 18, morn: 23.03 },
						pressure: 1031.65,
						humidity: 70,
						weather: [{ id: 801, main: "Clouds", description: "few clouds", icon: "02d" }],
						speed: 3.35,
						deg: 314,
						clouds: 21
					},
					{
						dt: 1568458800,
						sunrise: 1568436525,
						sunset: 1568482223,
						temp: { day: 20.81, min: 13.56, max: 21.02, night: 13.56, eve: 16.6, morn: 15.88 },
						pressure: 1028.81,
						humidity: 72,
						weather: [{ id: 500, main: "Rain", description: "light rain", icon: "10d" }],
						speed: 2.21,
						deg: 81,
						clouds: 100
					},
					{
						dt: 1568545200,
						sunrise: 1568523007,
						sunset: 1568568497,
						temp: { day: 22.65, min: 13.76, max: 22.88, night: 15.27, eve: 17.45, morn: 13.76 },
						pressure: 1023.75,
						humidity: 64,
						weather: [{ id: 800, main: "Clear", description: "sky is clear", icon: "01d" }],
						speed: 1.15,
						deg: 7,
						clouds: 0
					},
					{
						dt: 1568631600,
						sunrise: 1568609489,
						sunset: 1568654771,
						temp: { day: 23.45, min: 13.95, max: 23.45, night: 13.95, eve: 17.75, morn: 15.21 },
						pressure: 1020.41,
						humidity: 64,
						weather: [{ id: 800, main: "Clear", description: "sky is clear", icon: "01d" }],
						speed: 3.07,
						deg: 298,
						clouds: 7
					},
					{
						dt: 1568718000,
						sunrise: 1568695970,
						sunset: 1568741045,
						temp: { day: 20.55, min: 10.95, max: 20.55, night: 10.95, eve: 14.82, morn: 13.24 },
						pressure: 1019.4,
						humidity: 66,
						weather: [{ id: 800, main: "Clear", description: "sky is clear", icon: "01d" }],
						speed: 2.8,
						deg: 333,
						clouds: 2
					},
					{
						dt: 1568804400,
						sunrise: 1568782452,
						sunset: 1568827319,
						temp: { day: 18.15, min: 7.75, max: 18.15, night: 7.75, eve: 12.45, morn: 9.41 },
						pressure: 1017.56,
						humidity: 52,
						weather: [{ id: 800, main: "Clear", description: "sky is clear", icon: "01d" }],
						speed: 2.92,
						deg: 34,
						clouds: 0
					},
					{
						dt: 1568890800,
						sunrise: 1568868934,
						sunset: 1568913593,
						temp: { day: 14.85, min: 5.56, max: 15.05, night: 5.56, eve: 9.56, morn: 6.25 },
						pressure: 1022.7,
						humidity: 59,
						weather: [{ id: 800, main: "Clear", description: "sky is clear", icon: "01d" }],
						speed: 2.89,
						deg: 51,
						clouds: 1
					}
				]
			},
			extendedData
		)
	);
};

const generateWeatherHourly = (extendedData = {}) => {
	return JSON.stringify(
		_.merge(
			{},
			{
				hourly: [
					{
						dt: 1673204400,
						temp: 27.31,
						feels_like: 29.59,
						pressure: 1013,
						humidity: 72,
						dew_point: 21.82,
						uvi: 0,
						clouds: 31,
						visibility: 10000,
						wind_speed: 2.05,
						wind_deg: 200,
						wind_gust: 1.91,
						weather: [
							{
								id: 802,
								main: "Clouds",
								description: "Mäßig bewölkt",
								icon: "03n"
							}
						],
						pop: 0
					},
					{
						dt: 1673208000,
						temp: 27.31,
						feels_like: 29.69,
						pressure: 1013,
						humidity: 73,
						dew_point: 22.04,
						uvi: 0,
						clouds: 30,
						visibility: 10000,
						wind_speed: 2.14,
						wind_deg: 186,
						wind_gust: 1.9,
						weather: [
							{
								id: 802,
								main: "Clouds",
								description: "Mäßig bewölkt",
								icon: "03n"
							}
						],
						pop: 0
					},
					{
						dt: 1673211600,
						temp: 27.29,
						feels_like: 29.65,
						pressure: 1013,
						humidity: 73,
						dew_point: 22.03,
						uvi: 0,
						clouds: 31,
						visibility: 10000,
						wind_speed: 2.16,
						wind_deg: 193,
						wind_gust: 1.91,
						weather: [
							{
								id: 802,
								main: "Clouds",
								description: "Mäßig bewölkt",
								icon: "03n"
							}
						],
						pop: 0.12
					},
					{
						dt: 1673215200,
						temp: 27.21,
						feels_like: 29.6,
						pressure: 1013,
						humidity: 74,
						dew_point: 22.17,
						uvi: 0,
						clouds: 32,
						visibility: 10000,
						wind_speed: 2.13,
						wind_deg: 206,
						wind_gust: 1.91,
						weather: [
							{
								id: 500,
								main: "Rain",
								description: "Leichter Regen",
								icon: "10n"
							}
						],
						pop: 0.36,
						rain: {
							"1h": 0.13
						}
					},
					{
						dt: 1673218800,
						temp: 27.1,
						feels_like: 29.39,
						pressure: 1014,
						humidity: 74,
						dew_point: 22.07,
						uvi: 0,
						clouds: 38,
						visibility: 10000,
						wind_speed: 1.41,
						wind_deg: 227,
						wind_gust: 1.3,
						weather: [
							{
								id: 500,
								main: "Rain",
								description: "Leichter Regen",
								icon: "10n"
							}
						],
						pop: 0.44,
						rain: {
							"1h": 0.13
						}
					},
					{
						dt: 1673222400,
						temp: 26.95,
						feels_like: 29.19,
						pressure: 1013,
						humidity: 75,
						dew_point: 22.14,
						uvi: 0,
						clouds: 41,
						visibility: 10000,
						wind_speed: 1.65,
						wind_deg: 227,
						wind_gust: 1.5,
						weather: [
							{
								id: 802,
								main: "Clouds",
								description: "Mäßig bewölkt",
								icon: "03n"
							}
						],
						pop: 0.52
					},
					{
						dt: 1673226000,
						temp: 26.72,
						feels_like: 28.83,
						pressure: 1012,
						humidity: 76,
						dew_point: 22.15,
						uvi: 0,
						clouds: 22,
						visibility: 10000,
						wind_speed: 1.88,
						wind_deg: 218,
						wind_gust: 1.71,
						weather: [
							{
								id: 801,
								main: "Clouds",
								description: "Ein paar Wolken",
								icon: "02n"
							}
						],
						pop: 0.08
					},
					{
						dt: 1673229600,
						temp: 26.57,
						feels_like: 26.57,
						pressure: 1012,
						humidity: 76,
						dew_point: 22.05,
						uvi: 0,
						clouds: 20,
						visibility: 10000,
						wind_speed: 1.51,
						wind_deg: 221,
						wind_gust: 1.3,
						weather: [
							{
								id: 801,
								main: "Clouds",
								description: "Ein paar Wolken",
								icon: "02n"
							}
						],
						pop: 0.08
					},
					{
						dt: 1673233200,
						temp: 26.46,
						feels_like: 26.46,
						pressure: 1011,
						humidity: 77,
						dew_point: 22.12,
						uvi: 0,
						clouds: 32,
						visibility: 10000,
						wind_speed: 1.71,
						wind_deg: 210,
						wind_gust: 1.52,
						weather: [
							{
								id: 802,
								main: "Clouds",
								description: "Mäßig bewölkt",
								icon: "03n"
							}
						],
						pop: 0.04
					},
					{
						dt: 1673236800,
						temp: 26.38,
						feels_like: 26.38,
						pressure: 1011,
						humidity: 78,
						dew_point: 22.22,
						uvi: 0,
						clouds: 49,
						visibility: 10000,
						wind_speed: 1.84,
						wind_deg: 213,
						wind_gust: 1.61,
						weather: [
							{
								id: 802,
								main: "Clouds",
								description: "Mäßig bewölkt",
								icon: "03n"
							}
						],
						pop: 0
					},
					{
						dt: 1673240400,
						temp: 26.32,
						feels_like: 26.32,
						pressure: 1012,
						humidity: 78,
						dew_point: 22.12,
						uvi: 0,
						clouds: 48,
						visibility: 10000,
						wind_speed: 1.83,
						wind_deg: 216,
						wind_gust: 1.6,
						weather: [
							{
								id: 802,
								main: "Clouds",
								description: "Mäßig bewölkt",
								icon: "03n"
							}
						],
						pop: 0
					},
					{
						dt: 1673244000,
						temp: 26.32,
						feels_like: 26.32,
						pressure: 1012,
						humidity: 78,
						dew_point: 22.26,
						uvi: 0,
						clouds: 43,
						visibility: 10000,
						wind_speed: 2.11,
						wind_deg: 205,
						wind_gust: 1.72,
						weather: [
							{
								id: 802,
								main: "Clouds",
								description: "Mäßig bewölkt",
								icon: "03n"
							}
						],
						pop: 0
					},
					{
						dt: 1673247600,
						temp: 26.44,
						feels_like: 26.44,
						pressure: 1013,
						humidity: 79,
						dew_point: 22.44,
						uvi: 0.53,
						clouds: 90,
						visibility: 10000,
						wind_speed: 2.78,
						wind_deg: 207,
						wind_gust: 2.51,
						weather: [
							{
								id: 804,
								main: "Clouds",
								description: "Bedeckt",
								icon: "04d"
							}
						],
						pop: 0
					},
					{
						dt: 1673251200,
						temp: 26.45,
						feels_like: 26.45,
						pressure: 1013,
						humidity: 78,
						dew_point: 22.22,
						uvi: 2.13,
						clouds: 93,
						visibility: 10000,
						wind_speed: 2.43,
						wind_deg: 190,
						wind_gust: 2.21,
						weather: [
							{
								id: 804,
								main: "Clouds",
								description: "Bedeckt",
								icon: "04d"
							}
						],
						pop: 0
					},
					{
						dt: 1673254800,
						temp: 26.54,
						feels_like: 26.54,
						pressure: 1014,
						humidity: 78,
						dew_point: 22.32,
						uvi: 4.92,
						clouds: 68,
						visibility: 10000,
						wind_speed: 3.04,
						wind_deg: 188,
						wind_gust: 2.91,
						weather: [
							{
								id: 803,
								main: "Clouds",
								description: "Überwiegend bewölkt",
								icon: "04d"
							}
						],
						pop: 0
					},
					{
						dt: 1673258400,
						temp: 26.61,
						feels_like: 26.61,
						pressure: 1013,
						humidity: 77,
						dew_point: 22.28,
						uvi: 8.04,
						clouds: 56,
						visibility: 10000,
						wind_speed: 3.37,
						wind_deg: 183,
						wind_gust: 3.22,
						weather: [
							{
								id: 803,
								main: "Clouds",
								description: "Überwiegend bewölkt",
								icon: "04d"
							}
						],
						pop: 0
					},
					{
						dt: 1673262000,
						temp: 26.76,
						feels_like: 28.9,
						pressure: 1013,
						humidity: 76,
						dew_point: 22.24,
						uvi: 10.6,
						clouds: 62,
						visibility: 10000,
						wind_speed: 3.51,
						wind_deg: 175,
						wind_gust: 3.4,
						weather: [
							{
								id: 803,
								main: "Clouds",
								description: "Überwiegend bewölkt",
								icon: "04d"
							}
						],
						pop: 0
					},
					{
						dt: 1673265600,
						temp: 26.91,
						feels_like: 29.11,
						pressure: 1012,
						humidity: 75,
						dew_point: 22.24,
						uvi: 11.58,
						clouds: 54,
						visibility: 10000,
						wind_speed: 3.82,
						wind_deg: 174,
						wind_gust: 3.8,
						weather: [
							{
								id: 803,
								main: "Clouds",
								description: "Überwiegend bewölkt",
								icon: "04d"
							}
						],
						pop: 0
					},
					{
						dt: 1673269200,
						temp: 27.04,
						feels_like: 29.27,
						pressure: 1011,
						humidity: 74,
						dew_point: 22.02,
						uvi: 10.65,
						clouds: 84,
						visibility: 10000,
						wind_speed: 4.06,
						wind_deg: 177,
						wind_gust: 4.02,
						weather: [
							{
								id: 803,
								main: "Clouds",
								description: "Überwiegend bewölkt",
								icon: "04d"
							}
						],
						pop: 0
					},
					{
						dt: 1673272800,
						temp: 27.12,
						feels_like: 29.33,
						pressure: 1011,
						humidity: 73,
						dew_point: 21.94,
						uvi: 8.07,
						clouds: 81,
						visibility: 10000,
						wind_speed: 3.75,
						wind_deg: 187,
						wind_gust: 3.6,
						weather: [
							{
								id: 803,
								main: "Clouds",
								description: "Überwiegend bewölkt",
								icon: "04d"
							}
						],
						pop: 0
					},
					{
						dt: 1673276400,
						temp: 27.17,
						feels_like: 29.33,
						pressure: 1010,
						humidity: 72,
						dew_point: 21.8,
						uvi: 4.84,
						clouds: 87,
						visibility: 10000,
						wind_speed: 3.35,
						wind_deg: 177,
						wind_gust: 3.2,
						weather: [
							{
								id: 804,
								main: "Clouds",
								description: "Bedeckt",
								icon: "04d"
							}
						],
						pop: 0
					},
					{
						dt: 1673280000,
						temp: 27.28,
						feels_like: 29.43,
						pressure: 1011,
						humidity: 71,
						dew_point: 21.56,
						uvi: 2.16,
						clouds: 90,
						visibility: 10000,
						wind_speed: 2.35,
						wind_deg: 177,
						wind_gust: 2.21,
						weather: [
							{
								id: 804,
								main: "Clouds",
								description: "Bedeckt",
								icon: "04d"
							}
						],
						pop: 0
					},
					{
						dt: 1673283600,
						temp: 27.28,
						feels_like: 29.43,
						pressure: 1011,
						humidity: 71,
						dew_point: 21.52,
						uvi: 0.54,
						clouds: 88,
						visibility: 10000,
						wind_speed: 2.36,
						wind_deg: 173,
						wind_gust: 2.22,
						weather: [
							{
								id: 804,
								main: "Clouds",
								description: "Bedeckt",
								icon: "04d"
							}
						],
						pop: 0
					},
					{
						dt: 1673287200,
						temp: 27.34,
						feels_like: 29.54,
						pressure: 1012,
						humidity: 71,
						dew_point: 21.62,
						uvi: 0,
						clouds: 77,
						visibility: 10000,
						wind_speed: 2.14,
						wind_deg: 172,
						wind_gust: 2.01,
						weather: [
							{
								id: 803,
								main: "Clouds",
								description: "Überwiegend bewölkt",
								icon: "04d"
							}
						],
						pop: 0
					},
					{
						dt: 1673290800,
						temp: 27.25,
						feels_like: 29.38,
						pressure: 1013,
						humidity: 71,
						dew_point: 21.55,
						uvi: 0,
						clouds: 47,
						visibility: 10000,
						wind_speed: 1.62,
						wind_deg: 158,
						wind_gust: 1.51,
						weather: [
							{
								id: 802,
								main: "Clouds",
								description: "Mäßig bewölkt",
								icon: "03n"
							}
						],
						pop: 0
					},
					{
						dt: 1673294400,
						temp: 27.25,
						feels_like: 29.38,
						pressure: 1014,
						humidity: 71,
						dew_point: 21.52,
						uvi: 0,
						clouds: 29,
						visibility: 10000,
						wind_speed: 1.53,
						wind_deg: 126,
						wind_gust: 1.41,
						weather: [
							{
								id: 802,
								main: "Clouds",
								description: "Mäßig bewölkt",
								icon: "03n"
							}
						],
						pop: 0
					},
					{
						dt: 1673298000,
						temp: 27.17,
						feels_like: 29.24,
						pressure: 1015,
						humidity: 71,
						dew_point: 21.55,
						uvi: 0,
						clouds: 24,
						visibility: 10000,
						wind_speed: 1.16,
						wind_deg: 115,
						wind_gust: 1,
						weather: [
							{
								id: 801,
								main: "Clouds",
								description: "Ein paar Wolken",
								icon: "02n"
							}
						],
						pop: 0
					},
					{
						dt: 1673301600,
						temp: 27.07,
						feels_like: 29.06,
						pressure: 1015,
						humidity: 71,
						dew_point: 21.45,
						uvi: 0,
						clouds: 21,
						visibility: 10000,
						wind_speed: 1.13,
						wind_deg: 164,
						wind_gust: 1,
						weather: [
							{
								id: 801,
								main: "Clouds",
								description: "Ein paar Wolken",
								icon: "02n"
							}
						],
						pop: 0
					},
					{
						dt: 1673305200,
						temp: 26.99,
						feels_like: 29.09,
						pressure: 1014,
						humidity: 73,
						dew_point: 21.77,
						uvi: 0,
						clouds: 19,
						visibility: 10000,
						wind_speed: 1.85,
						wind_deg: 173,
						wind_gust: 1.72,
						weather: [
							{
								id: 801,
								main: "Clouds",
								description: "Ein paar Wolken",
								icon: "02n"
							}
						],
						pop: 0
					},
					{
						dt: 1673308800,
						temp: 26.83,
						feels_like: 28.8,
						pressure: 1014,
						humidity: 73,
						dew_point: 21.66,
						uvi: 0,
						clouds: 26,
						visibility: 10000,
						wind_speed: 1.83,
						wind_deg: 170,
						wind_gust: 1.71,
						weather: [
							{
								id: 802,
								main: "Clouds",
								description: "Mäßig bewölkt",
								icon: "03n"
							}
						],
						pop: 0
					},
					{
						dt: 1673312400,
						temp: 26.68,
						feels_like: 28.54,
						pressure: 1013,
						humidity: 73,
						dew_point: 21.52,
						uvi: 0,
						clouds: 80,
						visibility: 10000,
						wind_speed: 0.93,
						wind_deg: 164,
						wind_gust: 0.9,
						weather: [
							{
								id: 803,
								main: "Clouds",
								description: "Überwiegend bewölkt",
								icon: "04n"
							}
						],
						pop: 0
					},
					{
						dt: 1673316000,
						temp: 26.54,
						feels_like: 26.54,
						pressure: 1013,
						humidity: 74,
						dew_point: 21.46,
						uvi: 0,
						clouds: 70,
						visibility: 10000,
						wind_speed: 0.98,
						wind_deg: 156,
						wind_gust: 0.91,
						weather: [
							{
								id: 803,
								main: "Clouds",
								description: "Überwiegend bewölkt",
								icon: "04n"
							}
						],
						pop: 0
					},
					{
						dt: 1673319600,
						temp: 26.54,
						feels_like: 26.54,
						pressure: 1012,
						humidity: 75,
						dew_point: 21.8,
						uvi: 0,
						clouds: 52,
						visibility: 10000,
						wind_speed: 2.26,
						wind_deg: 173,
						wind_gust: 2.2,
						weather: [
							{
								id: 803,
								main: "Clouds",
								description: "Überwiegend bewölkt",
								icon: "04n"
							}
						],
						pop: 0
					},
					{
						dt: 1673323200,
						temp: 26.43,
						feels_like: 26.43,
						pressure: 1012,
						humidity: 75,
						dew_point: 21.75,
						uvi: 0,
						clouds: 43,
						visibility: 10000,
						wind_speed: 2.12,
						wind_deg: 173,
						wind_gust: 2,
						weather: [
							{
								id: 802,
								main: "Clouds",
								description: "Mäßig bewölkt",
								icon: "03n"
							}
						],
						pop: 0
					},
					{
						dt: 1673326800,
						temp: 26.38,
						feels_like: 26.38,
						pressure: 1013,
						humidity: 76,
						dew_point: 21.91,
						uvi: 0,
						clouds: 42,
						visibility: 10000,
						wind_speed: 2.57,
						wind_deg: 165,
						wind_gust: 2.5,
						weather: [
							{
								id: 802,
								main: "Clouds",
								description: "Mäßig bewölkt",
								icon: "03n"
							}
						],
						pop: 0
					},
					{
						dt: 1673330400,
						temp: 26.36,
						feels_like: 26.36,
						pressure: 1013,
						humidity: 77,
						dew_point: 21.97,
						uvi: 0,
						clouds: 42,
						visibility: 10000,
						wind_speed: 2.92,
						wind_deg: 167,
						wind_gust: 2.91,
						weather: [
							{
								id: 802,
								main: "Clouds",
								description: "Mäßig bewölkt",
								icon: "03n"
							}
						],
						pop: 0
					},
					{
						dt: 1673334000,
						temp: 26.45,
						feels_like: 26.45,
						pressure: 1014,
						humidity: 77,
						dew_point: 22.06,
						uvi: 0.52,
						clouds: 96,
						visibility: 10000,
						wind_speed: 3.09,
						wind_deg: 185,
						wind_gust: 3.1,
						weather: [
							{
								id: 804,
								main: "Clouds",
								description: "Bedeckt",
								icon: "04d"
							}
						],
						pop: 0
					},
					{
						dt: 1673337600,
						temp: 26.54,
						feels_like: 26.54,
						pressure: 1014,
						humidity: 77,
						dew_point: 22.14,
						uvi: 2.1,
						clouds: 87,
						visibility: 10000,
						wind_speed: 3.38,
						wind_deg: 176,
						wind_gust: 3.4,
						weather: [
							{
								id: 804,
								main: "Clouds",
								description: "Bedeckt",
								icon: "04d"
							}
						],
						pop: 0
					},
					{
						dt: 1673341200,
						temp: 26.63,
						feels_like: 26.63,
						pressure: 1014,
						humidity: 77,
						dew_point: 22.24,
						uvi: 4.86,
						clouds: 83,
						visibility: 10000,
						wind_speed: 3.4,
						wind_deg: 179,
						wind_gust: 3.4,
						weather: [
							{
								id: 803,
								main: "Clouds",
								description: "Überwiegend bewölkt",
								icon: "04d"
							}
						],
						pop: 0
					},
					{
						dt: 1673344800,
						temp: 26.62,
						feels_like: 26.62,
						pressure: 1014,
						humidity: 77,
						dew_point: 22.23,
						uvi: 8.38,
						clouds: 72,
						visibility: 10000,
						wind_speed: 3.47,
						wind_deg: 178,
						wind_gust: 3.5,
						weather: [
							{
								id: 803,
								main: "Clouds",
								description: "Überwiegend bewölkt",
								icon: "04d"
							}
						],
						pop: 0
					},
					{
						dt: 1673348400,
						temp: 26.71,
						feels_like: 28.81,
						pressure: 1014,
						humidity: 76,
						dew_point: 22.32,
						uvi: 11.06,
						clouds: 62,
						visibility: 10000,
						wind_speed: 3.82,
						wind_deg: 178,
						wind_gust: 3.81,
						weather: [
							{
								id: 803,
								main: "Clouds",
								description: "Überwiegend bewölkt",
								icon: "04d"
							}
						],
						pop: 0
					},
					{
						dt: 1673352000,
						temp: 26.81,
						feels_like: 29,
						pressure: 1013,
						humidity: 76,
						dew_point: 22.32,
						uvi: 12.08,
						clouds: 57,
						visibility: 10000,
						wind_speed: 4.38,
						wind_deg: 181,
						wind_gust: 4.42,
						weather: [
							{
								id: 803,
								main: "Clouds",
								description: "Überwiegend bewölkt",
								icon: "04d"
							}
						],
						pop: 0
					},
					{
						dt: 1673355600,
						temp: 26.91,
						feels_like: 29.19,
						pressure: 1012,
						humidity: 76,
						dew_point: 22.32,
						uvi: 11.21,
						clouds: 14,
						visibility: 10000,
						wind_speed: 4.96,
						wind_deg: 183,
						wind_gust: 5.01,
						weather: [
							{
								id: 801,
								main: "Clouds",
								description: "Ein paar Wolken",
								icon: "02d"
							}
						],
						pop: 0
					},
					{
						dt: 1673359200,
						temp: 27.02,
						feels_like: 29.32,
						pressure: 1012,
						humidity: 75,
						dew_point: 22.23,
						uvi: 8.49,
						clouds: 13,
						visibility: 10000,
						wind_speed: 4.72,
						wind_deg: 179,
						wind_gust: 4.82,
						weather: [
							{
								id: 801,
								main: "Clouds",
								description: "Ein paar Wolken",
								icon: "02d"
							}
						],
						pop: 0
					},
					{
						dt: 1673362800,
						temp: 27.03,
						feels_like: 29.25,
						pressure: 1011,
						humidity: 74,
						dew_point: 22.14,
						uvi: 5.1,
						clouds: 14,
						visibility: 10000,
						wind_speed: 4.15,
						wind_deg: 180,
						wind_gust: 4.22,
						weather: [
							{
								id: 801,
								main: "Clouds",
								description: "Ein paar Wolken",
								icon: "02d"
							}
						],
						pop: 0
					},
					{
						dt: 1673366400,
						temp: 27.12,
						feels_like: 29.42,
						pressure: 1011,
						humidity: 74,
						dew_point: 22.03,
						uvi: 2.21,
						clouds: 13,
						visibility: 10000,
						wind_speed: 3.61,
						wind_deg: 174,
						wind_gust: 3.71,
						weather: [
							{
								id: 801,
								main: "Clouds",
								description: "Ein paar Wolken",
								icon: "02d"
							}
						],
						pop: 0
					},
					{
						dt: 1673370000,
						temp: 27.1,
						feels_like: 29.29,
						pressure: 1012,
						humidity: 73,
						dew_point: 21.92,
						uvi: 0.55,
						clouds: 11,
						visibility: 10000,
						wind_speed: 3.48,
						wind_deg: 171,
						wind_gust: 3.5,
						weather: [
							{
								id: 801,
								main: "Clouds",
								description: "Ein paar Wolken",
								icon: "02d"
							}
						],
						pop: 0
					},
					{
						dt: 1673373600,
						temp: 27.18,
						feels_like: 29.54,
						pressure: 1012,
						humidity: 74,
						dew_point: 22.05,
						uvi: 0,
						clouds: 9,
						visibility: 10000,
						wind_speed: 3.39,
						wind_deg: 170,
						wind_gust: 3.51,
						weather: [
							{
								id: 800,
								main: "Clear",
								description: "Klarer Himmel",
								icon: "01d"
							}
						],
						pop: 0
					}
				]
			},
			extendedData
		)
	);
};

module.exports = { generateWeather, generateWeatherForecast, generateWeatherHourly };
