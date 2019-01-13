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
});
