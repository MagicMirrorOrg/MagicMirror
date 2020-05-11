const _ = require("lodash");

function generateWeatherForecast(extendedData = {}) {
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
}

module.exports = generateWeatherForecast;
