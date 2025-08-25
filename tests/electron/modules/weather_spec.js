const helpers = require("../helpers/global-setup");
const weatherHelper = require("../helpers/weather-setup");
const { cleanupMockData } = require("../../utils/weather_mocker");

const CURRENT_WEATHER_CONFIG = "tests/configs/modules/weather/currentweather_default.js";
const SUNRISE_DATE = "13 Jan 2019 00:30:00 GMT";
const SUNSET_DATE = "13 Jan 2019 12:30:00 GMT";
const SUN_EVENT_SELECTOR = ".weather .normal.medium span:nth-child(4)";
const EXPECTED_SUNRISE_TEXT = "7:00 am";
const EXPECTED_SUNSET_TEXT = "3:45 pm";

describe("Weather module", () => {
	afterEach(async () => {
		await helpers.stopApplication();
		cleanupMockData();
	});

	describe("Current weather with sunrise", () => {
		beforeAll(async () => {
			await weatherHelper.startApp(CURRENT_WEATHER_CONFIG, SUNRISE_DATE);
		});

		it("should render sunrise", async () => {
			const isSunriseRendered = await weatherHelper.getText(SUN_EVENT_SELECTOR, EXPECTED_SUNRISE_TEXT);
			expect(isSunriseRendered).toBe(true);
		});
	});

	describe("Current weather with sunset", () => {
		beforeAll(async () => {
			await weatherHelper.startApp(CURRENT_WEATHER_CONFIG, SUNSET_DATE);
		});

		it("should render sunset", async () => {
			const isSunsetRendered = await weatherHelper.getText(SUN_EVENT_SELECTOR, EXPECTED_SUNSET_TEXT);
			expect(isSunsetRendered).toBe(true);
		});
	});
});
