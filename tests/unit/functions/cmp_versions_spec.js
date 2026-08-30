const path = require("node:path");
const { pathToFileURL } = require("node:url");

describe("Test function cmpVersions in js/module.js", () => {
	let cmp;
	let originalWindow;
	let originalLog;
	let originalConfig;
	let originalMM;
	let originalTranslator;
	let originalNunjucks;

	beforeAll(async () => {
		originalWindow = global.window;
		originalLog = global.Log;
		originalConfig = global.config;
		originalMM = global.MM;
		originalTranslator = global.Translator;
		originalNunjucks = global.nunjucks;

		global.window = { mmVersion: "2.0.0" };
		global.Log = { log: () => {}, info: () => {}, warn: () => {}, error: () => {}, debug: () => {} };
		global.config = { language: "en" };
		global.MM = {
			hideModule: () => {},
			showModule: () => {},
			sendNotification: () => {},
			updateDom: () => {}
		};
		global.Translator = {
			load: () => Promise.resolve(),
			translate: () => ""
		};
		global.nunjucks = {
			Environment () {
				this.addFilter = () => {};
				this.renderString = () => "";
				this.render = (_template, _data, callback) => callback(null, "");
			},
			WebLoader () {},
			runtime: {
				markSafe: (str) => str
			}
		};

		const modulePath = pathToFileURL(path.join(__dirname, "..", "..", "..", "js", "module.js")).href;
		const loaded = await import(`${modulePath}?test=${Date.now()}`);
		cmp = loaded.cmpVersions;
	});

	afterAll(() => {
		global.window = originalWindow;
		global.Log = originalLog;
		global.config = originalConfig;
		global.MM = originalMM;
		global.Translator = originalTranslator;
		global.nunjucks = originalNunjucks;
	});

	it("should return -1 when comparing 2.1 to 2.2", () => {
		expect(cmp("2.1", "2.2")).toBe(-1);
	});

	it("should be return 0 when comparing 2.2 to 2.2", () => {
		expect(cmp("2.2", "2.2")).toBe(0);
	});

	it("should be return 1 when comparing 1.1 to 1.0", () => {
		expect(cmp("1.1", "1.0")).toBe(1);
	});
});
