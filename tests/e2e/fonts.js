const helpers = require("./global-setup");
const request = require("request");
const expect = require("chai").expect;
const forEach = require("mocha-each");

const describe = global.describe;

describe("All font files from roboto.css should be downloadable", function () {
	helpers.setupTimeout(this);

	var app;
	var fontFiles = [];
	// Statements below filters out all 'url' lines in the CSS file
	var fileContent = require("fs").readFileSync(__dirname + "/../../fonts/roboto.css", "utf8");
	var regex = /\burl\(['"]([^'"]+)['"]\)/g;
	var match = regex.exec(fileContent);
	while (match !== null) {
		// Push 1st match group onto fontFiles stack
		fontFiles.push(match[1]);
		// Find the next one
		match = regex.exec(fileContent);
	}

	before(function () {
		// Set config sample for use in test
		process.env.MM_CONFIG_FILE = "tests/configs/without_modules.js";

		return helpers
			.startApplication({
				args: ["js/electron.js"]
			})
			.then(function (startedApp) {
				app = startedApp;
			});
	});

	after(function () {
		return helpers.stopApplication(app);
	});

	forEach(fontFiles).it("should return 200 HTTP code for file '%s'", (fontFile, done) => {
		var fontUrl = "http://localhost:8080/fonts/" + fontFile;
		request.get(fontUrl, function (err, res, body) {
			expect(res.statusCode).to.equal(200);
			done();
		});
	});
});
