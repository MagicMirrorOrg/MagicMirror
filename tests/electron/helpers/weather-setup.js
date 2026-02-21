const fs = require("node:fs");
const path = require("node:path");
const weatherUtils = require("../../../defaultmodules/weather/utils");
const helpers = require("./global-setup");

/**
 * Inject mock weather data directly via socket communication
 * This bypasses the weather provider and tests only client-side rendering
 * @param {string} mockDataFile - Filename of mock data in tests/mocks
 */
async function injectMockWeatherData (mockDataFile) {
	const rawData = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../mocks", mockDataFile)).toString());

	const timezoneOffset = rawData.timezone_offset ? rawData.timezone_offset / 60 : 0;

	let type = "current";
	let data = null;

	if (rawData.current) {
		type = "current";
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
			precipitationProbability: hour.pop ? hour.pop * 100 : undefined,
			precipitationAmount: (hour.rain?.["1h"] || 0) + (hour.snow?.["1h"] || 0)
		}));
	}

	// Inject weather data by evaluating code in the browser context
	await global.page.evaluate(({ type, data }) => {
		const weatherModule = MM.getModules().find((m) => m.name === "weather");
		if (weatherModule) {
			weatherModule.socketNotificationReceived("WEATHER_INITIALIZED", {
				instanceId: weatherModule.instanceId,
				locationName: "Munich"
			});
			weatherModule.socketNotificationReceived("WEATHER_DATA", {
				instanceId: weatherModule.instanceId,
				type: type,
				data: data
			});
		}
	}, { type, data });
}

exports.getText = async (element, result) => {
	const elem = await helpers.getElement(element);
	await expect(elem).not.toBeNull();
	const text = await elem.textContent();
	await expect(
		text
			.trim()
			.replace(/(\r\n|\n|\r)/gm, "")
			.replace(/[ ]+/g, " ")
	).toBe(result);
	return true;
};

exports.startApp = async (configFileName, systemDate, mockDataFile = "weather_onecall_current.json") => {
	await helpers.startApplication(configFileName, systemDate);

	// Wait for modules to initialize
	await global.page.waitForTimeout(1000);

	// Inject mock weather data
	await injectMockWeatherData(mockDataFile);

	// Wait for rendering
	await global.page.waitForTimeout(500);
};
