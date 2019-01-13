const fs = require("fs");
const _ = require("lodash");
const moment = require("moment");
const wdajaxstub = require("webdriverajaxstub");

const helpers = require("../global-setup");

describe("Weather module", function() {
	let app;

	helpers.setupTimeout(this);

	async function setup(responses) {
		app = await helpers.startApplication({
			args: ["js/electron.js"]
		});

		wdajaxstub.init(app.client, responses);

		app.client.setupStub();
	}

	afterEach(function() {
		return helpers.stopApplication(app);
	});

	describe("Current weather", function() {
		function generateWeather(extendedData = {}) {
			return JSON.stringify(_.merge({}, {
				coord:{
					lon: 11.58,
					lat: 48.14
				},
				weather:[
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
				main:{
					temp: 1.49,
					pressure: 1005,
					humidity: 93,
					temp_min: 1,
					temp_max: 2
				},
				visibility: 7000,
				wind:{
					speed: 11.8,
					deg: 250
				},
				clouds:{
					all: 75
				},
				dt: 1547387400,
				sys:{
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
			}, extendedData));
		}

		let template;

		before(function() {
			template = fs.readFileSync(__dirname + '../../../../modules/default/weather/current.njk', 'utf8');
		});

		describe("Default configuration", function() {
			before(function() {
				process.env.MM_CONFIG_FILE = "tests/configs/modules/weather/currentweather_default.js";
			});

			it("should render wind speed and wind direction", async function() {
				const weather = generateWeather();
				await setup([weather, template]);

				return app.client.waitUntilTextExists('.weather .normal.medium span:nth-child(2)', '6 WSW', 10000);
			});

			it("should render sunrise", async function() {
				const sunrise = moment().startOf('day').unix();
				const sunset = moment().startOf('day').unix();


				const weather = generateWeather({sys: {sunrise, sunset}});
				await setup([weather, template]);

				await app.client.waitForExist(".weather .normal.medium span.wi.dimmed.wi-sunrise", 10000);

				return app.client.waitUntilTextExists('.weather .normal.medium span:nth-child(4)', '12:00 am', 10000);
			});

			it("should render sunset", async function() {
				const sunrise = moment().startOf('day').unix();
				const sunset = moment().endOf('day').unix();


				const weather = generateWeather({sys: {sunrise, sunset}});
				await setup([weather, template]);

				await app.client.waitForExist(".weather .normal.medium span.wi.dimmed.wi-sunset", 10000);

				return app.client.waitUntilTextExists('.weather .normal.medium span:nth-child(4)', '11:59 pm', 10000);
			});

			it("should render temperature with icon", async function() {
				const weather = generateWeather();
				await setup([weather, template]);

				await app.client.waitForExist(".weather .large.light span.wi.weathericon.wi-snow", 10000);

				return app.client.waitUntilTextExists('.weather .large.light span.bright', '1.5°', 10000);
			});

			it("should render feels like temperature", async function() {
				const weather = generateWeather();
				await setup([weather, template]);

				await app.client.waitForExist(".weather .large.light span.wi.weathericon.wi-snow", 10000);

				return app.client.waitUntilTextExists('.weather .normal.medium span.dimmed', 'Feels -5.6°', 10000);
			});
		});
	});
});
