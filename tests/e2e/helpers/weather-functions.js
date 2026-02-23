const fs = require("node:fs");
const path = require("node:path");
const weatherUtils = require("../../../defaultmodules/weather/provider-utils");
const helpers = require("./global-setup");

/**
 * Inject mock weather data directly via socket communication
 * This bypasses the weather provider and tests only client-side rendering
 * @param {object} page - Playwright page
 * @param {string} mockDataFile - Filename of mock data
 */
async function injectMockWeatherData (page, mockDataFile) {
	const rawData = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../mocks", mockDataFile)).toString());

	// Validate that the fixture has at least one expected weather data type
	if (!rawData.current && !rawData.daily && !rawData.hourly) {
		throw new Error(
			"Invalid weather fixture: missing current, daily, and hourly data. "
			+ `Available keys: ${Object.keys(rawData).join(", ")}`
		);
	}

	// Determine weather type from the mock data structure
	let type = "current";
	let data = null;

	const timezoneOffset = rawData.timezone_offset ? rawData.timezone_offset / 60 : 0;

	if (rawData.current) {
		type = "current";
		// Mock what the provider would send for current weather
		data = {
			date: weatherUtils.applyTimezoneOffset(new Date(rawData.current.dt * 1000), timezoneOffset),
			windSpeed: rawData.current.wind_speed,
			windFromDirection: rawData.current.wind_deg,
			sunrise: weatherUtils.applyTimezoneOffset(new Date(rawData.current.sunrise * 1000), timezoneOffset),
			sunset: weatherUtils.applyTimezoneOffset(new Date(rawData.current.sunset * 1000), timezoneOffset),
			temperature: rawData.current.temp,
			weatherType: weatherUtils.convertWeatherType(rawData.current.weather[0].icon),
			humidity: rawData.current.humidity,
			feelsLikeTemp: rawData.current.feels_like
		};
	} else if (rawData.daily) {
		type = "forecast";
		data = rawData.daily.map((day) => ({
			date: weatherUtils.applyTimezoneOffset(new Date(day.dt * 1000), timezoneOffset),
			minTemperature: day.temp.min,
			maxTemperature: day.temp.max,
			weatherType: weatherUtils.convertWeatherType(day.weather[0].icon),
			rain: day.rain || 0,
			snow: day.snow || 0,
			precipitationAmount: (day.rain || 0) + (day.snow || 0)
		}));
	} else if (rawData.hourly) {
		type = "hourly";
		data = rawData.hourly.map((hour) => ({
			date: weatherUtils.applyTimezoneOffset(new Date(hour.dt * 1000), timezoneOffset),
			temperature: hour.temp,
			feelsLikeTemp: hour.feels_like,
			humidity: hour.humidity,
			windSpeed: hour.wind_speed,
			windFromDirection: hour.wind_deg,
			weatherType: weatherUtils.convertWeatherType(hour.weather[0].icon),
			precipitationProbability: hour.pop != null ? hour.pop * 100 : undefined,
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
		// Wait for weather module to initialize
		// eslint-disable-next-line playwright/no-wait-for-selector
		await page.waitForSelector(".weather", { timeout: 5000 });
		await injectMockWeatherData(page, mockDataFile);
		// Wait for data to be rendered
		// eslint-disable-next-line playwright/no-wait-for-selector
		await page.waitForSelector(".weather .weathericon", { timeout: 2000 });
	}
};

exports.stopApplication = async () => {
	await helpers.stopApplication();
};
