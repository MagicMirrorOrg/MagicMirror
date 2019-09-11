const expect = require("chai").expect;
const fs = require("fs");
const _ = require("lodash");
const moment = require("moment");
const path = require("path");
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
					humidity: 93.7,
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
			template = fs.readFileSync(path.join(__dirname, "..", "..", "..", "modules", "default", "weather", "current.njk"), "utf8");
		});

		describe("Default configuration", function() {
			before(function() {
				process.env.MM_CONFIG_FILE = "tests/configs/modules/weather/currentweather_default.js";
			});

			it("should render wind speed and wind direction", async function() {
				const weather = generateWeather();
				await setup([weather, template]);

				return app.client.waitUntilTextExists(".weather .normal.medium span:nth-child(2)", "6 WSW", 10000);
			});

			it("should render sunrise", async function() {
				const sunrise = moment().startOf("day").unix();
				const sunset = moment().startOf("day").unix();

				const weather = generateWeather({sys: {sunrise, sunset}});
				await setup([weather, template]);

				await app.client.waitForExist(".weather .normal.medium span.wi.dimmed.wi-sunrise", 10000);

				return app.client.waitUntilTextExists(".weather .normal.medium span:nth-child(4)", "12:00 am", 10000);
			});

			it("should render sunset", async function() {
				const sunrise = moment().startOf("day").unix();
				const sunset = moment().endOf("day").unix();

				const weather = generateWeather({sys: {sunrise, sunset}});
				await setup([weather, template]);

				await app.client.waitForExist(".weather .normal.medium span.wi.dimmed.wi-sunset", 10000);

				return app.client.waitUntilTextExists(".weather .normal.medium span:nth-child(4)", "11:59 pm", 10000);
			});

			it("should render temperature with icon", async function() {
				const weather = generateWeather();
				await setup([weather, template]);

				await app.client.waitForExist(".weather .large.light span.wi.weathericon.wi-snow", 10000);

				return app.client.waitUntilTextExists(".weather .large.light span.bright", "1.5°", 10000);
			});

			it("should render feels like temperature", async function() {
				const weather = generateWeather();
				await setup([weather, template]);

				return app.client.waitUntilTextExists(".weather .normal.medium span.dimmed", "Feels like -5.6°", 10000);
			});
		});

		const wait = () => new Promise(res => setTimeout(res, 3000));

		describe("Configuration Options", function() {
			before(function() {
				process.env.MM_CONFIG_FILE = "tests/configs/modules/weather/currentweather_options.js";
			});

			it("should render useBeaufort = false", async function() {
				const weather = generateWeather();
				await setup([weather, template]);

				return app.client.waitUntilTextExists(".weather .normal.medium span:nth-child(2)", "12", 10000);
			});

			it("should render showWindDirectionAsArrow = true", async function() {
				const weather = generateWeather();
				await setup([weather, template]);

				await app.client.waitForExist(".weather .normal.medium sup i.fa-long-arrow-up", 10000);
				const element = await app.client.getHTML(".weather .normal.medium sup i.fa-long-arrow-up");

				expect(element).to.include("transform:rotate(250deg);");
			});

			it("should render showHumidity = true", async function() {
				const weather = generateWeather();
				await setup([weather, template]);

				await app.client.waitUntilTextExists(".weather .normal.medium span:nth-child(3)", "93", 10000);
				return app.client.waitForExist(".weather .normal.medium sup i.wi-humidity", 10000);
			});

			it("should render degreeLabel = true", async function() {
				const weather = generateWeather();
				await setup([weather, template]);

				await app.client.waitUntilTextExists(".weather .large.light span.bright", "1°C", 10000);

				return app.client.waitUntilTextExists(".weather .normal.medium span.dimmed", "Feels like -6°C", 10000);
			});
		});

		describe("Current weather units", function() {
			before(function() {
				process.env.MM_CONFIG_FILE = "tests/configs/modules/weather/currentweather_units.js";
			});

			it("should render imperial units", async function() {
				const weather = generateWeather({
					main:{
						temp: 1.49 * 9 / 5 + 32,
						temp_min: 1 * 9 / 5 + 32,
						temp_max: 2 * 9 / 5 + 32
					},
					wind:{
						speed: 11.8 * 2.23694
					},
				});
				await setup([weather, template]);

				await app.client.waitUntilTextExists(".weather .normal.medium span:nth-child(2)", "6 WSW", 10000);
				await app.client.waitUntilTextExists(".weather .large.light span.bright", "34,7°", 10000);
				return app.client.waitUntilTextExists(".weather .normal.medium span.dimmed", "22,0°", 10000);
			});

			it("should render decimalSymbol = ','", async function() {
				const weather = generateWeather({
					main:{
						temp: 1.49 * 9 / 5 + 32,
						temp_min: 1 * 9 / 5 + 32,
						temp_max: 2 * 9 / 5 + 32
					},
					wind:{
						speed: 11.8 * 2.23694
					},
				});
				await setup([weather, template]);

				await app.client.waitUntilTextExists(".weather .normal.medium span:nth-child(3)", "93,7", 10000);
				await app.client.waitUntilTextExists(".weather .large.light span.bright", "34,7°", 10000);
				return app.client.waitUntilTextExists(".weather .normal.medium span.dimmed", "22,0°", 10000);
			});
		});
	});
});
