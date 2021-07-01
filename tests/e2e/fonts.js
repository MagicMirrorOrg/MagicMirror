const helpers = require("./global-setup");
const fetch = require("node-fetch");

describe("All font files from roboto.css should be downloadable", function () {
	helpers.setupTimeout(this);

	let app;
	const fontFiles = [];
	// Statements below filters out all 'url' lines in the CSS file
	const fileContent = require("fs").readFileSync(__dirname + "/../../fonts/roboto.css", "utf8");
	const regex = /\burl\(['"]([^'"]+)['"]\)/g;
	let match = regex.exec(fileContent);
	while (match !== null) {
		// Push 1st match group onto fontFiles stack
		fontFiles.push(match[1]);
		// Find the next one
		match = regex.exec(fileContent);
	}

	beforeAll(function () {
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

	afterAll(function () {
		return helpers.stopApplication(app);
	});

	test.each(fontFiles)("should return 200 HTTP code for file '%s'", (fontFile, done) => {
		const fontUrl = "http://localhost:8080/fonts/" + fontFile;
		fetch(fontUrl).then((res) => {
			expect(res.status).toBe(200);
			done();
		});
	});
});
