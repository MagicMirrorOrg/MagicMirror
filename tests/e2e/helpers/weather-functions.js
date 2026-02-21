const fs = require("node:fs");
const path = require("node:path");
const helpers = require("./global-setup");

/**
 * Inject mock weather data directly via socket communication
 * This bypasses the weather provider and tests only client-side rendering
 * @param {object} page - Playwright page
 * @param {string} mockDataFile - Filename of mock data
 */
async function injectMockWeatherData (page, mockDataFile) {
	const rawData = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../mocks", mockDataFile)).toString());

	// Convert OpenWeatherMap icon codes to internal weather types
	const convertWeatherType = (weatherType) => {
		const weatherTypes = {
			"01d": "day-sunny",
			"02d": "day-cloudy",
			"03d": "cloudy",
			"04d": "cloudy-windy",
			"09d": "showers",
			"10d": "rain",
			"11d": "thunderstorm",
			"13d": "snow",
			"50d": "fog",
			"01n": "night-clear",
			"02n": "night-cloudy",
			"03n": "night-cloudy",
			"04n": "night-cloudy",
			"09n": "night-showers",
			"10n": "night-rain",
			"11n": "night-thunderstorm",
			"13n": "night-snow",
			"50n": "night-alt-cloudy-windy"
		};
		return weatherTypes[weatherType] || null;
	};

	// Determine weather type from the mock data structure
	let type = "current";
	let data = null;

	// Helper to apply timezone offset (mimics provider's #applyOffset method)
	const applyOffset = (date, offsetMinutes) => {
		// Apply timezone offset to date
		const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
		return new Date(utcTime + (offsetMinutes * 60000));
	};

	const timezoneOffset = rawData.timezone_offset ? rawData.timezone_offset / 60 : 0;

	if (rawData.current) {
		type = "current";
		// Mock what the provider would send for current weather
		data = {
			date: applyOffset(new Date(rawData.current.dt * 1000), timezoneOffset),
			windSpeed: rawData.current.wind_speed,
			windFromDirection: rawData.current.wind_deg,
			sunrise: applyOffset(new Date(rawData.current.sunrise * 1000), timezoneOffset),
			sunset: applyOffset(new Date(rawData.current.sunset * 1000), timezoneOffset),
			temperature: rawData.current.temp,
			weatherType: convertWeatherType(rawData.current.weather[0].icon),
			humidity: rawData.current.humidity,
			feelsLikeTemp: rawData.current.feels_like
		};
	} else if (rawData.daily) {
		type = "forecast";
		data = rawData.daily.map((day) => ({
			date: applyOffset(new Date(day.dt * 1000), timezoneOffset),
			minTemperature: day.temp.min,
			maxTemperature: day.temp.max,
			weatherType: convertWeatherType(day.weather[0].icon),
			rain: day.rain || 0,
			snow: day.snow || 0,
			precipitationAmount: (day.rain || 0) + (day.snow || 0)
		}));
	} else if (rawData.hourly) {
		type = "hourly";
		data = rawData.hourly.map((hour) => ({
			date: applyOffset(new Date(hour.dt * 1000), timezoneOffset),
			temperature: hour.temp,
			feelsLikeTemp: hour.feels_like,
			humidity: hour.humidity,
			windSpeed: hour.wind_speed,
			windFromDirection: hour.wind_deg,
			weatherType: convertWeatherType(hour.weather[0].icon),
			precipitationProbability: hour.pop ? hour.pop * 100 : undefined,
			precipitationAmount: (hour.rain?.["1h"] || 0) + (hour.snow?.["1h"] || 0)
		}));
	}

	// Inject weather data by evaluating code in the browser context
	await page.evaluate(({ type, data }) => {
		// Find the weather module instance
		const weatherModule = MM.getModules().find((m) => m.name === "weather");
		if (weatherModule) {
			// Send INITIALIZED first
			weatherModule.socketNotificationReceived("WEATHER_INITIALIZED", {
				instanceId: weatherModule.instanceId,
				locationName: "Munich"
			});
			// Then send the actual data
			weatherModule.socketNotificationReceived("WEATHER_DATA", {
				instanceId: weatherModule.instanceId,
				type: type,
				data: data
			});
		}
	}, { type, data });
}

exports.startApplication = async (configFileName, mockDataFile) => {
	await helpers.startApplication(configFileName);
	await helpers.getDocument();

	// If mock data file is provided, inject it
	if (mockDataFile) {
		const page = helpers.getPage();
		// Wait for modules to initialize
		await page.waitForTimeout(1000);
		await injectMockWeatherData(page, mockDataFile);
		// Wait for rendering
		await page.waitForTimeout(500);
	}
};

exports.stopApplication = async () => {
	await helpers.stopApplication();
};
