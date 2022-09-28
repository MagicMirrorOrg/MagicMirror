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
					lon: 6.95,
					lat: 50.9333
				},
				weather: [
					{
						id: 500,
						main: "Rain",
						description: "Leichter Regen",
						icon: "10d"
					}
				],
				base: "stations",
				main: {
					temp: 12.18,
					feels_like: 11.33,
					temp_min: 9.9,
					temp_max: 14.21,
					pressure: 996,
					humidity: 72
				},
				visibility: 10000,
				wind: {
					speed: 5.14,
					deg: 240
				},
				rain: {
					"1h": 0.49
				},
				clouds: {
					all: 20
				},
				dt: 1664379654,
				sys: {
					type: 2,
					id: 2000227,
					country: "DE",
					sunrise: 1664342845,
					sunset: 1664385500
				},
				timezone: 7200,
				id: 2886242,
				name: "Köln",
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
				cod: "200",
				message: 0,
				cnt: 40,
				list: [
					{
						dt: 1664388000,
						main: {
							temp: 11.26,
							feels_like: 10.45,
							temp_min: 9.43,
							temp_max: 11.26,
							pressure: 997,
							sea_level: 997,
							grnd_level: 993,
							humidity: 77,
							temp_kf: 1.83
						},
						weather: [
							{
								id: 500,
								main: "Rain",
								description: "Leichter Regen",
								icon: "10n"
							}
						],
						clouds: {
							all: 42
						},
						wind: {
							speed: 1.94,
							deg: 239,
							gust: 3.05
						},
						visibility: 10000,
						pop: 0.8,
						rain: {
							"3h": 0.92
						},
						sys: {
							pod: "n"
						},
						dt_txt: "2022-09-28 18:00:00"
					},
					{
						dt: 1664398800,
						main: {
							temp: 9.33,
							feels_like: 8.55,
							temp_min: 7.91,
							temp_max: 9.33,
							pressure: 999,
							sea_level: 999,
							grnd_level: 994,
							humidity: 85,
							temp_kf: 1.42
						},
						weather: [
							{
								id: 802,
								main: "Clouds",
								description: "Mäßig bewölkt",
								icon: "03n"
							}
						],
						clouds: {
							all: 42
						},
						wind: {
							speed: 1.84,
							deg: 203,
							gust: 2.85
						},
						visibility: 10000,
						pop: 0.29,
						sys: {
							pod: "n"
						},
						dt_txt: "2022-09-28 21:00:00"
					},
					{
						dt: 1664409600,
						main: {
							temp: 6.99,
							feels_like: 6.03,
							temp_min: 6.99,
							temp_max: 6.99,
							pressure: 1001,
							sea_level: 1001,
							grnd_level: 994,
							humidity: 91,
							temp_kf: 0
						},
						weather: [
							{
								id: 802,
								main: "Clouds",
								description: "Mäßig bewölkt",
								icon: "03n"
							}
						],
						clouds: {
							all: 40
						},
						wind: {
							speed: 1.66,
							deg: 174,
							gust: 1.99
						},
						visibility: 10000,
						pop: 0.11,
						sys: {
							pod: "n"
						},
						dt_txt: "2022-09-29 00:00:00"
					},
					{
						dt: 1664420400,
						main: {
							temp: 6.35,
							feels_like: 5.26,
							temp_min: 6.35,
							temp_max: 6.35,
							pressure: 1001,
							sea_level: 1001,
							grnd_level: 994,
							humidity: 90,
							temp_kf: 0
						},
						weather: [
							{
								id: 803,
								main: "Clouds",
								description: "Überwiegend bewölkt",
								icon: "04n"
							}
						],
						clouds: {
							all: 71
						},
						wind: {
							speed: 1.69,
							deg: 136,
							gust: 2.21
						},
						visibility: 10000,
						pop: 0,
						sys: {
							pod: "n"
						},
						dt_txt: "2022-09-29 03:00:00"
					},
					{
						dt: 1664431200,
						main: {
							temp: 6.67,
							feels_like: 5.73,
							temp_min: 6.67,
							temp_max: 6.67,
							pressure: 1001,
							sea_level: 1001,
							grnd_level: 995,
							humidity: 89,
							temp_kf: 0
						},
						weather: [
							{
								id: 804,
								main: "Clouds",
								description: "Bedeckt",
								icon: "04d"
							}
						],
						clouds: {
							all: 85
						},
						wind: {
							speed: 1.6,
							deg: 118,
							gust: 2.27
						},
						visibility: 10000,
						pop: 0,
						sys: {
							pod: "d"
						},
						dt_txt: "2022-09-29 06:00:00"
					},
					{
						dt: 1664442000,
						main: {
							temp: 10.44,
							feels_like: 9.5,
							temp_min: 10.44,
							temp_max: 10.44,
							pressure: 1002,
							sea_level: 1002,
							grnd_level: 996,
							humidity: 75,
							temp_kf: 0
						},
						weather: [
							{
								id: 804,
								main: "Clouds",
								description: "Bedeckt",
								icon: "04d"
							}
						],
						clouds: {
							all: 100
						},
						wind: {
							speed: 1.74,
							deg: 124,
							gust: 2.61
						},
						visibility: 10000,
						pop: 0,
						sys: {
							pod: "d"
						},
						dt_txt: "2022-09-29 09:00:00"
					},
					{
						dt: 1664452800,
						main: {
							temp: 14.79,
							feels_like: 13.68,
							temp_min: 14.79,
							temp_max: 14.79,
							pressure: 1002,
							sea_level: 1002,
							grnd_level: 996,
							humidity: 52,
							temp_kf: 0
						},
						weather: [
							{
								id: 500,
								main: "Rain",
								description: "Leichter Regen",
								icon: "10d"
							}
						],
						clouds: {
							all: 99
						},
						wind: {
							speed: 0.78,
							deg: 117,
							gust: 1.1
						},
						visibility: 10000,
						pop: 0.21,
						rain: {
							"3h": 0.16
						},
						sys: {
							pod: "d"
						},
						dt_txt: "2022-09-29 12:00:00"
					},
					{
						dt: 1664463600,
						main: {
							temp: 14.85,
							feels_like: 13.62,
							temp_min: 14.85,
							temp_max: 14.85,
							pressure: 1003,
							sea_level: 1003,
							grnd_level: 996,
							humidity: 47,
							temp_kf: 0
						},
						weather: [
							{
								id: 804,
								main: "Clouds",
								description: "Bedeckt",
								icon: "04d"
							}
						],
						clouds: {
							all: 97
						},
						wind: {
							speed: 0.93,
							deg: 96,
							gust: 1.09
						},
						visibility: 10000,
						pop: 0.35,
						sys: {
							pod: "d"
						},
						dt_txt: "2022-09-29 15:00:00"
					},
					{
						dt: 1664474400,
						main: {
							temp: 11.05,
							feels_like: 9.99,
							temp_min: 11.05,
							temp_max: 11.05,
							pressure: 1005,
							sea_level: 1005,
							grnd_level: 998,
							humidity: 68,
							temp_kf: 0
						},
						weather: [
							{
								id: 804,
								main: "Clouds",
								description: "Bedeckt",
								icon: "04n"
							}
						],
						clouds: {
							all: 97
						},
						wind: {
							speed: 0.95,
							deg: 113,
							gust: 1.05
						},
						visibility: 10000,
						pop: 0.25,
						sys: {
							pod: "n"
						},
						dt_txt: "2022-09-29 18:00:00"
					},
					{
						dt: 1664485200,
						main: {
							temp: 9.89,
							feels_like: 9.89,
							temp_min: 9.89,
							temp_max: 9.89,
							pressure: 1006,
							sea_level: 1006,
							grnd_level: 1000,
							humidity: 73,
							temp_kf: 0
						},
						weather: [
							{
								id: 804,
								main: "Clouds",
								description: "Bedeckt",
								icon: "04n"
							}
						],
						clouds: {
							all: 99
						},
						wind: {
							speed: 0.9,
							deg: 139,
							gust: 1.09
						},
						visibility: 10000,
						pop: 0.02,
						sys: {
							pod: "n"
						},
						dt_txt: "2022-09-29 21:00:00"
					},
					{
						dt: 1664496000,
						main: {
							temp: 8.12,
							feels_like: 8.12,
							temp_min: 8.12,
							temp_max: 8.12,
							pressure: 1008,
							sea_level: 1008,
							grnd_level: 1001,
							humidity: 80,
							temp_kf: 0
						},
						weather: [
							{
								id: 803,
								main: "Clouds",
								description: "Überwiegend bewölkt",
								icon: "04n"
							}
						],
						clouds: {
							all: 76
						},
						wind: {
							speed: 1.31,
							deg: 158,
							gust: 1.56
						},
						visibility: 10000,
						pop: 0.02,
						sys: {
							pod: "n"
						},
						dt_txt: "2022-09-30 00:00:00"
					},
					{
						dt: 1664506800,
						main: {
							temp: 7.19,
							feels_like: 7.19,
							temp_min: 7.19,
							temp_max: 7.19,
							pressure: 1008,
							sea_level: 1008,
							grnd_level: 1002,
							humidity: 84,
							temp_kf: 0
						},
						weather: [
							{
								id: 800,
								main: "Clear",
								description: "Klarer Himmel",
								icon: "01n"
							}
						],
						clouds: {
							all: 9
						},
						wind: {
							speed: 1.07,
							deg: 156,
							gust: 1.38
						},
						visibility: 10000,
						pop: 0,
						sys: {
							pod: "n"
						},
						dt_txt: "2022-09-30 03:00:00"
					},
					{
						dt: 1664517600,
						main: {
							temp: 6.85,
							feels_like: 6.19,
							temp_min: 6.85,
							temp_max: 6.85,
							pressure: 1010,
							sea_level: 1010,
							grnd_level: 1003,
							humidity: 85,
							temp_kf: 0
						},
						weather: [
							{
								id: 800,
								main: "Clear",
								description: "Klarer Himmel",
								icon: "01d"
							}
						],
						clouds: {
							all: 10
						},
						wind: {
							speed: 1.39,
							deg: 143,
							gust: 1.76
						},
						visibility: 10000,
						pop: 0,
						sys: {
							pod: "d"
						},
						dt_txt: "2022-09-30 06:00:00"
					},
					{
						dt: 1664528400,
						main: {
							temp: 12.23,
							feels_like: 11.13,
							temp_min: 12.23,
							temp_max: 12.23,
							pressure: 1011,
							sea_level: 1011,
							grnd_level: 1004,
							humidity: 62,
							temp_kf: 0
						},
						weather: [
							{
								id: 800,
								main: "Clear",
								description: "Klarer Himmel",
								icon: "01d"
							}
						],
						clouds: {
							all: 8
						},
						wind: {
							speed: 1.12,
							deg: 196,
							gust: 1.47
						},
						visibility: 10000,
						pop: 0,
						sys: {
							pod: "d"
						},
						dt_txt: "2022-09-30 09:00:00"
					},
					{
						dt: 1664539200,
						main: {
							temp: 16.02,
							feels_like: 14.9,
							temp_min: 16.02,
							temp_max: 16.02,
							pressure: 1010,
							sea_level: 1010,
							grnd_level: 1003,
							humidity: 47,
							temp_kf: 0
						},
						weather: [
							{
								id: 800,
								main: "Clear",
								description: "Klarer Himmel",
								icon: "01d"
							}
						],
						clouds: {
							all: 8
						},
						wind: {
							speed: 1.35,
							deg: 206,
							gust: 2.4
						},
						visibility: 10000,
						pop: 0,
						sys: {
							pod: "d"
						},
						dt_txt: "2022-09-30 12:00:00"
					},
					{
						dt: 1664550000,
						main: {
							temp: 16.55,
							feels_like: 15.46,
							temp_min: 16.55,
							temp_max: 16.55,
							pressure: 1009,
							sea_level: 1009,
							grnd_level: 1003,
							humidity: 46,
							temp_kf: 0
						},
						weather: [
							{
								id: 802,
								main: "Clouds",
								description: "Mäßig bewölkt",
								icon: "03d"
							}
						],
						clouds: {
							all: 26
						},
						wind: {
							speed: 1.86,
							deg: 192,
							gust: 4
						},
						visibility: 10000,
						pop: 0,
						sys: {
							pod: "d"
						},
						dt_txt: "2022-09-30 15:00:00"
					},
					{
						dt: 1664560800,
						main: {
							temp: 12.59,
							feels_like: 11.5,
							temp_min: 12.59,
							temp_max: 12.59,
							pressure: 1010,
							sea_level: 1010,
							grnd_level: 1003,
							humidity: 61,
							temp_kf: 0
						},
						weather: [
							{
								id: 802,
								main: "Clouds",
								description: "Mäßig bewölkt",
								icon: "03n"
							}
						],
						clouds: {
							all: 42
						},
						wind: {
							speed: 2.11,
							deg: 212,
							gust: 3.83
						},
						visibility: 10000,
						pop: 0,
						sys: {
							pod: "n"
						},
						dt_txt: "2022-09-30 18:00:00"
					},
					{
						dt: 1664571600,
						main: {
							temp: 10.99,
							feels_like: 9.84,
							temp_min: 10.99,
							temp_max: 10.99,
							pressure: 1010,
							sea_level: 1010,
							grnd_level: 1003,
							humidity: 65,
							temp_kf: 0
						},
						weather: [
							{
								id: 803,
								main: "Clouds",
								description: "Überwiegend bewölkt",
								icon: "04n"
							}
						],
						clouds: {
							all: 51
						},
						wind: {
							speed: 3.59,
							deg: 184,
							gust: 10.24
						},
						visibility: 10000,
						pop: 0,
						sys: {
							pod: "n"
						},
						dt_txt: "2022-09-30 21:00:00"
					},
					{
						dt: 1664582400,
						main: {
							temp: 11.61,
							feels_like: 10.34,
							temp_min: 11.61,
							temp_max: 11.61,
							pressure: 1008,
							sea_level: 1008,
							grnd_level: 1001,
							humidity: 58,
							temp_kf: 0
						},
						weather: [
							{
								id: 803,
								main: "Clouds",
								description: "Überwiegend bewölkt",
								icon: "04n"
							}
						],
						clouds: {
							all: 71
						},
						wind: {
							speed: 5.03,
							deg: 175,
							gust: 13.69
						},
						visibility: 10000,
						pop: 0,
						sys: {
							pod: "n"
						},
						dt_txt: "2022-10-01 00:00:00"
					},
					{
						dt: 1664593200,
						main: {
							temp: 11.5,
							feels_like: 10.48,
							temp_min: 11.5,
							temp_max: 11.5,
							pressure: 1005,
							sea_level: 1005,
							grnd_level: 999,
							humidity: 68,
							temp_kf: 0
						},
						weather: [
							{
								id: 500,
								main: "Rain",
								description: "Leichter Regen",
								icon: "10n"
							}
						],
						clouds: {
							all: 100
						},
						wind: {
							speed: 5.65,
							deg: 187,
							gust: 14.36
						},
						visibility: 10000,
						pop: 0.39,
						rain: {
							"3h": 0.14
						},
						sys: {
							pod: "n"
						},
						dt_txt: "2022-10-01 03:00:00"
					},
					{
						dt: 1664604000,
						main: {
							temp: 10.39,
							feels_like: 9.73,
							temp_min: 10.39,
							temp_max: 10.39,
							pressure: 1003,
							sea_level: 1003,
							grnd_level: 996,
							humidity: 86,
							temp_kf: 0
						},
						weather: [
							{
								id: 501,
								main: "Rain",
								description: "Mäßiger Regen",
								icon: "10d"
							}
						],
						clouds: {
							all: 100
						},
						wind: {
							speed: 7.09,
							deg: 200,
							gust: 16.12
						},
						visibility: 10000,
						pop: 1,
						rain: {
							"3h": 5.69
						},
						sys: {
							pod: "d"
						},
						dt_txt: "2022-10-01 06:00:00"
					},
					{
						dt: 1664614800,
						main: {
							temp: 11.62,
							feels_like: 10.98,
							temp_min: 11.62,
							temp_max: 11.62,
							pressure: 1003,
							sea_level: 1003,
							grnd_level: 996,
							humidity: 82,
							temp_kf: 0
						},
						weather: [
							{
								id: 500,
								main: "Rain",
								description: "Leichter Regen",
								icon: "10d"
							}
						],
						clouds: {
							all: 100
						},
						wind: {
							speed: 6.59,
							deg: 217,
							gust: 13.18
						},
						visibility: 10000,
						pop: 0.74,
						rain: {
							"3h": 0.34
						},
						sys: {
							pod: "d"
						},
						dt_txt: "2022-10-01 09:00:00"
					},
					{
						dt: 1664625600,
						main: {
							temp: 14.91,
							feels_like: 14.44,
							temp_min: 14.91,
							temp_max: 14.91,
							pressure: 1004,
							sea_level: 1004,
							grnd_level: 997,
							humidity: 76,
							temp_kf: 0
						},
						weather: [
							{
								id: 500,
								main: "Rain",
								description: "Leichter Regen",
								icon: "10d"
							}
						],
						clouds: {
							all: 93
						},
						wind: {
							speed: 6.42,
							deg: 260,
							gust: 10.05
						},
						visibility: 10000,
						pop: 0.96,
						rain: {
							"3h": 1.17
						},
						sys: {
							pod: "d"
						},
						dt_txt: "2022-10-01 12:00:00"
					},
					{
						dt: 1664636400,
						main: {
							temp: 15.17,
							feels_like: 14.7,
							temp_min: 15.17,
							temp_max: 15.17,
							pressure: 1005,
							sea_level: 1005,
							grnd_level: 999,
							humidity: 75,
							temp_kf: 0
						},
						weather: [
							{
								id: 500,
								main: "Rain",
								description: "Leichter Regen",
								icon: "10d"
							}
						],
						clouds: {
							all: 68
						},
						wind: {
							speed: 5.5,
							deg: 268,
							gust: 10.38
						},
						visibility: 10000,
						pop: 0.94,
						rain: {
							"3h": 1.33
						},
						sys: {
							pod: "d"
						},
						dt_txt: "2022-10-01 15:00:00"
					},
					{
						dt: 1664647200,
						main: {
							temp: 12.1,
							feels_like: 11.66,
							temp_min: 12.1,
							temp_max: 12.1,
							pressure: 1008,
							sea_level: 1008,
							grnd_level: 1001,
							humidity: 88,
							temp_kf: 0
						},
						weather: [
							{
								id: 500,
								main: "Rain",
								description: "Leichter Regen",
								icon: "10n"
							}
						],
						clouds: {
							all: 51
						},
						wind: {
							speed: 3.54,
							deg: 256,
							gust: 10.67
						},
						visibility: 10000,
						pop: 0.88,
						rain: {
							"3h": 1.4
						},
						sys: {
							pod: "n"
						},
						dt_txt: "2022-10-01 18:00:00"
					},
					{
						dt: 1664658000,
						main: {
							temp: 11.17,
							feels_like: 10.74,
							temp_min: 11.17,
							temp_max: 11.17,
							pressure: 1011,
							sea_level: 1011,
							grnd_level: 1004,
							humidity: 92,
							temp_kf: 0
						},
						weather: [
							{
								id: 500,
								main: "Rain",
								description: "Leichter Regen",
								icon: "10n"
							}
						],
						clouds: {
							all: 6
						},
						wind: {
							speed: 3.25,
							deg: 242,
							gust: 10.24
						},
						visibility: 10000,
						pop: 0.41,
						rain: {
							"3h": 0.25
						},
						sys: {
							pod: "n"
						},
						dt_txt: "2022-10-01 21:00:00"
					},
					{
						dt: 1664668800,
						main: {
							temp: 11.03,
							feels_like: 10.67,
							temp_min: 11.03,
							temp_max: 11.03,
							pressure: 1012,
							sea_level: 1012,
							grnd_level: 1006,
							humidity: 95,
							temp_kf: 0
						},
						weather: [
							{
								id: 500,
								main: "Rain",
								description: "Leichter Regen",
								icon: "10n"
							}
						],
						clouds: {
							all: 45
						},
						wind: {
							speed: 4.37,
							deg: 249,
							gust: 11.38
						},
						visibility: 10000,
						pop: 0.68,
						rain: {
							"3h": 0.56
						},
						sys: {
							pod: "n"
						},
						dt_txt: "2022-10-02 00:00:00"
					},
					{
						dt: 1664679600,
						main: {
							temp: 11.29,
							feels_like: 10.88,
							temp_min: 11.29,
							temp_max: 11.29,
							pressure: 1014,
							sea_level: 1014,
							grnd_level: 1008,
							humidity: 92,
							temp_kf: 0
						},
						weather: [
							{
								id: 500,
								main: "Rain",
								description: "Leichter Regen",
								icon: "10n"
							}
						],
						clouds: {
							all: 84
						},
						wind: {
							speed: 5.54,
							deg: 263,
							gust: 13.28
						},
						visibility: 10000,
						pop: 0.79,
						rain: {
							"3h": 1.55
						},
						sys: {
							pod: "n"
						},
						dt_txt: "2022-10-02 03:00:00"
					},
					{
						dt: 1664690400,
						main: {
							temp: 10.64,
							feels_like: 10.19,
							temp_min: 10.64,
							temp_max: 10.64,
							pressure: 1017,
							sea_level: 1017,
							grnd_level: 1010,
							humidity: 93,
							temp_kf: 0
						},
						weather: [
							{
								id: 500,
								main: "Rain",
								description: "Leichter Regen",
								icon: "10d"
							}
						],
						clouds: {
							all: 66
						},
						wind: {
							speed: 5.13,
							deg: 258,
							gust: 12.19
						},
						visibility: 10000,
						pop: 0.77,
						rain: {
							"3h": 1.05
						},
						sys: {
							pod: "d"
						},
						dt_txt: "2022-10-02 06:00:00"
					},
					{
						dt: 1664701200,
						main: {
							temp: 13.43,
							feels_like: 12.94,
							temp_min: 13.43,
							temp_max: 13.43,
							pressure: 1018,
							sea_level: 1018,
							grnd_level: 1012,
							humidity: 81,
							temp_kf: 0
						},
						weather: [
							{
								id: 500,
								main: "Rain",
								description: "Leichter Regen",
								icon: "10d"
							}
						],
						clouds: {
							all: 45
						},
						wind: {
							speed: 6.1,
							deg: 263,
							gust: 10.56
						},
						visibility: 10000,
						pop: 0.41,
						rain: {
							"3h": 0.46
						},
						sys: {
							pod: "d"
						},
						dt_txt: "2022-10-02 09:00:00"
					},
					{
						dt: 1664712000,
						main: {
							temp: 15.23,
							feels_like: 14.51,
							temp_min: 15.23,
							temp_max: 15.23,
							pressure: 1019,
							sea_level: 1019,
							grnd_level: 1012,
							humidity: 65,
							temp_kf: 0
						},
						weather: [
							{
								id: 500,
								main: "Rain",
								description: "Leichter Regen",
								icon: "10d"
							}
						],
						clouds: {
							all: 35
						},
						wind: {
							speed: 7.28,
							deg: 271,
							gust: 10.89
						},
						visibility: 10000,
						pop: 0.65,
						rain: {
							"3h": 0.93
						},
						sys: {
							pod: "d"
						},
						dt_txt: "2022-10-02 12:00:00"
					},
					{
						dt: 1664722800,
						main: {
							temp: 14.58,
							feels_like: 13.87,
							temp_min: 14.58,
							temp_max: 14.58,
							pressure: 1020,
							sea_level: 1020,
							grnd_level: 1013,
							humidity: 68,
							temp_kf: 0
						},
						weather: [
							{
								id: 500,
								main: "Rain",
								description: "Leichter Regen",
								icon: "10d"
							}
						],
						clouds: {
							all: 44
						},
						wind: {
							speed: 6.48,
							deg: 279,
							gust: 11.92
						},
						visibility: 10000,
						pop: 0.62,
						rain: {
							"3h": 0.53
						},
						sys: {
							pod: "d"
						},
						dt_txt: "2022-10-02 15:00:00"
					},
					{
						dt: 1664733600,
						main: {
							temp: 12.29,
							feels_like: 11.51,
							temp_min: 12.29,
							temp_max: 12.29,
							pressure: 1022,
							sea_level: 1022,
							grnd_level: 1015,
							humidity: 74,
							temp_kf: 0
						},
						weather: [
							{
								id: 500,
								main: "Rain",
								description: "Leichter Regen",
								icon: "10n"
							}
						],
						clouds: {
							all: 53
						},
						wind: {
							speed: 5.06,
							deg: 285,
							gust: 11.51
						},
						visibility: 10000,
						pop: 0.45,
						rain: {
							"3h": 0.22
						},
						sys: {
							pod: "n"
						},
						dt_txt: "2022-10-02 18:00:00"
					},
					{
						dt: 1664744400,
						main: {
							temp: 12.38,
							feels_like: 11.61,
							temp_min: 12.38,
							temp_max: 12.38,
							pressure: 1022,
							sea_level: 1022,
							grnd_level: 1015,
							humidity: 74,
							temp_kf: 0
						},
						weather: [
							{
								id: 804,
								main: "Clouds",
								description: "Bedeckt",
								icon: "04n"
							}
						],
						clouds: {
							all: 100
						},
						wind: {
							speed: 4.42,
							deg: 265,
							gust: 10.5
						},
						visibility: 10000,
						pop: 0,
						sys: {
							pod: "n"
						},
						dt_txt: "2022-10-02 21:00:00"
					},
					{
						dt: 1664755200,
						main: {
							temp: 11.93,
							feels_like: 11.22,
							temp_min: 11.93,
							temp_max: 11.93,
							pressure: 1022,
							sea_level: 1022,
							grnd_level: 1015,
							humidity: 78,
							temp_kf: 0
						},
						weather: [
							{
								id: 500,
								main: "Rain",
								description: "Leichter Regen",
								icon: "10n"
							}
						],
						clouds: {
							all: 100
						},
						wind: {
							speed: 4.13,
							deg: 265,
							gust: 10.49
						},
						visibility: 10000,
						pop: 0.2,
						rain: {
							"3h": 0.23
						},
						sys: {
							pod: "n"
						},
						dt_txt: "2022-10-03 00:00:00"
					},
					{
						dt: 1664766000,
						main: {
							temp: 11.86,
							feels_like: 11.11,
							temp_min: 11.86,
							temp_max: 11.86,
							pressure: 1022,
							sea_level: 1022,
							grnd_level: 1015,
							humidity: 77,
							temp_kf: 0
						},
						weather: [
							{
								id: 500,
								main: "Rain",
								description: "Leichter Regen",
								icon: "10n"
							}
						],
						clouds: {
							all: 100
						},
						wind: {
							speed: 3.29,
							deg: 267,
							gust: 9.61
						},
						visibility: 10000,
						pop: 0.27,
						rain: {
							"3h": 0.11
						},
						sys: {
							pod: "n"
						},
						dt_txt: "2022-10-03 03:00:00"
					},
					{
						dt: 1664776800,
						main: {
							temp: 11.4,
							feels_like: 10.79,
							temp_min: 11.4,
							temp_max: 11.4,
							pressure: 1022,
							sea_level: 1022,
							grnd_level: 1016,
							humidity: 84,
							temp_kf: 0
						},
						weather: [
							{
								id: 500,
								main: "Rain",
								description: "Leichter Regen",
								icon: "10d"
							}
						],
						clouds: {
							all: 100
						},
						wind: {
							speed: 3.31,
							deg: 263,
							gust: 8.9
						},
						visibility: 10000,
						pop: 0.29,
						rain: {
							"3h": 0.23
						},
						sys: {
							pod: "d"
						},
						dt_txt: "2022-10-03 06:00:00"
					},
					{
						dt: 1664787600,
						main: {
							temp: 13.04,
							feels_like: 12.41,
							temp_min: 13.04,
							temp_max: 13.04,
							pressure: 1023,
							sea_level: 1023,
							grnd_level: 1017,
							humidity: 77,
							temp_kf: 0
						},
						weather: [
							{
								id: 500,
								main: "Rain",
								description: "Leichter Regen",
								icon: "10d"
							}
						],
						clouds: {
							all: 100
						},
						wind: {
							speed: 3.49,
							deg: 276,
							gust: 6.91
						},
						visibility: 10000,
						pop: 0.23,
						rain: {
							"3h": 0.1
						},
						sys: {
							pod: "d"
						},
						dt_txt: "2022-10-03 09:00:00"
					},
					{
						dt: 1664798400,
						main: {
							temp: 15.82,
							feels_like: 15.08,
							temp_min: 15.82,
							temp_max: 15.82,
							pressure: 1023,
							sea_level: 1023,
							grnd_level: 1016,
							humidity: 62,
							temp_kf: 0
						},
						weather: [
							{
								id: 500,
								main: "Rain",
								description: "Leichter Regen",
								icon: "10d"
							}
						],
						clouds: {
							all: 100
						},
						wind: {
							speed: 3.86,
							deg: 282,
							gust: 5.04
						},
						visibility: 10000,
						pop: 0.24,
						rain: {
							"3h": 0.17
						},
						sys: {
							pod: "d"
						},
						dt_txt: "2022-10-03 12:00:00"
					},
					{
						dt: 1664809200,
						main: {
							temp: 15.59,
							feels_like: 14.93,
							temp_min: 15.59,
							temp_max: 15.59,
							pressure: 1022,
							sea_level: 1022,
							grnd_level: 1016,
							humidity: 66,
							temp_kf: 0
						},
						weather: [
							{
								id: 500,
								main: "Rain",
								description: "Leichter Regen",
								icon: "10d"
							}
						],
						clouds: {
							all: 100
						},
						wind: {
							speed: 3.6,
							deg: 297,
							gust: 5.47
						},
						visibility: 10000,
						pop: 0.32,
						rain: {
							"3h": 0.14
						},
						sys: {
							pod: "d"
						},
						dt_txt: "2022-10-03 15:00:00"
					}
				],
				city: {
					id: 2886242,
					name: "Köln",
					coord: {
						lat: 50.9333,
						lon: 6.95
					},
					country: "DE",
					population: 0,
					timezone: 7200,
					sunrise: 1664342845,
					sunset: 1664385500
				}
			},
			extendedData
		)
	);
};

module.exports = { generateWeather, generateWeatherForecast };
