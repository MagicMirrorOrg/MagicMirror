const path = require("path");
const { JSDOM } = require("jsdom");

const silence = {
	log: () => {},
	info: () => {},
	warn: () => {},
	error: () => {}
};

const log = silence;
// const log = console;

const dictionaries = {
	translations: {
		"en.json": {
			TEST: "test(en)",
			HELLO: "Hello",
			ONLY_EXIST_CORE_EN: "only exists in core (en)"
		},
		"de.json": {
			TEST: "test(de)",
			HELLO: "Hallo"
		},
		"ko.json": {
			TEST: "test(ko)",
			HELLO: "안녕"
		}
	},
	"MMM-Module": {
		"en.json": {
			TEST: "test(module/en)",
			HELLO: "Hello (module)"
		},
		"de.json": {
			TEST: "test(module/de)",
			HELLO: "Hallo (module)",
			TEST_VARIABLES: "{number}, {obj.some.thing}, {arr.0}, {arr.1.value}",
			TEST_PLURALRULES: "{number.0}{number.0@PLURAL_SELECT}, {number.1}{number.1@PLURAL_SELECT}, {number.2}{number.2@PLURAL_SELECT}",
			TEST_NUMBERFORMAT: "{number@CURRENCY}",
			TEST_LISTFORMAT: "{arr@LIST}",
			TEST_DATETIMEFORMAT: "{date@DATE}",
			TEST_RELATIVEFORMAT: "{target@RELATIVE_DAY}",
			TEST_AUTOSCALEFORMAT: "{target@AUTOSCALE}",
			TEST_SELECT: "{condition@GREETING}, {user}!",
			TEST_CUSTOM: "Temp: {roomTemperature@TEMP_C2F}",

			"@PLURAL_SELECT": {
				locale: "en-US",
				format: "PluralRules",
				options: {
					type: "ordinal"
				},
				rules: {
					one: "st",
					two: "nd",
					few: "rd",
					other: "th"
				}
			},
			"@CURRENCY": {
				format: "NumberFormat",
				options: {
					style: "currency",
					currency: "EUR"
				}
			},
			"@LIST": {
				format: "ListFormat",
				options: { style: "long", type: "disjunction" }
			},
			"@DATE": {
				format: "DateTimeFormat",
				options: {
					dateStyle: "long",
					timeStyle: "short"
				}
			},
			"@RELATIVE_DAY": {
				format: "RelativeTimeFormat",
				unit: "day",
				options: {
					numeric: "auto",
					style: "long"
				}
			},
			"@AUTOSCALE": {
				format: "AutoScaledRelativeTimeFormat",
				locale: "en-US",
				options: {
					numeric: "auto",
					style: "long"
				}
			},
			"@GREETING": {
				format: "Select",
				locale: "en-US",
				rules: {
					morning: "Good morning",
					afternoon: "Good afternoon",
					evening: "Good evening",
					other: "Hi"
				}
			},
			"@TEMP_C2F": {
				format: "Temperature",
				options: { unit: "farenheit" }
			}
		}
	}
};

const fetch = async (url) => {
	var response = {};
	let dict = path.parse(url).base;
	var directory = path.parse(url).dir.split("/")[1];

	if (dictionaries[directory][dict]) {
		response.ok = true;
		response.json = () => {
			return dictionaries[directory][dict];
		};
	}
	return response;
};

const MM_Module = {
	name: "MMM-Module",
	file: (filePath) => {
		return "/MMM-Module" + "/" + filePath;
	}
};

describe("Translator", function () {
	describe("init", function () {
		it("initialize without parameter", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = async function () {
				dom.window.fetch = fetch;
				dom.window.Log = log;
				const { Translator } = dom.window;
				await Translator.init();
				let locale = Translator.getLocale();
				let language = Translator.getLanguages();
				expect(locale).toBe("default");
				expect(language.toString()).toBe(["en"].toString());
				var text = Translator.translate("core", "HELLO");
				expect(text).toBe("Hello");
				done();
			};
		});

		it("initialize with only config.language", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = async function () {
				dom.window.fetch = fetch;
				dom.window.Log = log;
				const { Translator } = dom.window;
				var config = { language: "de" };
				await Translator.init(config);
				let locale = Translator.getLocale();
				let language = Translator.getLanguages();
				expect(locale).toBe("default");
				expect(language.toString()).toBe(["de", "en"].toString());
				var text = Translator.translate("core", "HELLO");
				expect(text).toBe("Hallo");
				done();
			};
		});

		it("initialize with only config.languages (array)", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = async function () {
				dom.window.fetch = fetch;
				dom.window.Log = log;
				const { Translator } = dom.window;
				var config = { languages: ["de", "en-US"] };
				await Translator.init(config);
				let locale = Translator.getLocale();
				let language = Translator.getLanguages();
				expect(locale).toBe("default");
				expect(language.join(",")).toBe(["de", "en-US", "en"].join(","));
				var text = Translator.translate("core", "HELLO");
				expect(text).toBe("Hallo");
				done();
			};
		});

		it("initialize with only config.languages (string)", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = async function () {
				dom.window.fetch = fetch;
				dom.window.Log = log;
				const { Translator } = dom.window;
				var config = { languages: "de, en-US" };
				await Translator.init(config);
				let locale = Translator.getLocale();
				let language = Translator.getLanguages();
				expect(locale).toBe("default");
				expect(language.join(",")).toBe(["de", "en-US", "en"].join(","));
				var text = Translator.translate("core", "HELLO");
				expect(text).toBe("Hallo");
				done();
			};
		});

		it("initialize with config.languages and config.language together", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = async function () {
				dom.window.fetch = fetch;
				dom.window.Log = log;
				const { Translator } = dom.window;
				var config = { languages: ["en", "nl", "de"], language: "nl" };
				await Translator.init(config);
				let locale = Translator.getLocale();
				let language = Translator.getLanguages();
				expect(locale).toBe("default");
				expect(language.join(",")).toBe(["nl", "en", "de"].join(","));
				var text = Translator.translate("core", "HELLO");
				expect(text).toBe("Hello");
				done();
			};
		});

		it("initialize with invalid locale format", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = async function () {
				dom.window.fetch = fetch;
				dom.window.Log = log;
				const { Translator } = dom.window;
				var config = { locale: "en_US" };
				await Translator.init(config);
				let locale = Translator.getLocale();
				expect(locale).toBe("default");
				var text = Translator.translate("core", "HELLO");
				expect(text).toBe("Hello");
				done();
			};
		});
	});

	describe("loadTranslations", function () {
		it("load core translations and test fallback", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = async function () {
				dom.window.fetch = fetch;
				dom.window.Log = log;
				const { Translator } = dom.window;
				var config = { languages: "de, en-US" };
				await Translator.init(config);
				var text = Translator.translate("core", "HELLO");
				expect(text).toBe("Hallo");
				text = Translator.translate("core", "ONLY_EXIST_CORE_EN");
				expect(text).toBe("only exists in core (en)");
				done();
			};
		});

		it("load module translations and test fallback", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = async function () {
				dom.window.fetch = fetch;
				dom.window.Log = log;
				const { Translator } = dom.window;
				var config = { languages: "de-DE, en-US" };
				await Translator.init(config);
				await Translator.loadTranslations(MM_Module);
				var text = Translator.translate(MM_Module, "HELLO");
				expect(text).toBe("Hallo (module)");
				text = Translator.translate(MM_Module, "ONLY_EXIST_CORE_EN");
				expect(text).toBe("only exists in core (en)");
				done();
			};
		});
	});

	describe("translate", function () {
		it("should return 'null' when not found in dictionaries", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = async function () {
				dom.window.fetch = fetch;
				dom.window.Log = log;
				const { Translator } = dom.window;
				var config = { languages: "de-DE, en-US" };
				await Translator.init(config);
				await Translator.loadTranslations(MM_Module);
				var text = Translator.translate(MM_Module, "WEIRD");
				expect(text).toBe(null);
				done();
			};
		});

		it("test simple translation without variables.", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = async function () {
				dom.window.fetch = fetch;
				dom.window.Log = log;
				const { Translator } = dom.window;
				var config = { languages: "de-DE, en-US" };
				await Translator.init(config);
				await Translator.loadTranslations(MM_Module);
				var text = Translator.translate(MM_Module, "TEST");
				expect(text).toBe("test(module/de)");
				done();
			};
		});

		it("test translation with variables (scalar variable, nested object property, array)", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = async function () {
				dom.window.fetch = fetch;
				dom.window.Log = log;
				const { Translator } = dom.window;
				var config = { languages: "de-DE, en-US" };
				await Translator.init(config);
				await Translator.loadTranslations(MM_Module);
				const testData = {
					number: 1234,
					obj: {
						some: {
							thing: "something"
						}
					},
					arr: ["index0", { value: "value of index1" }]
				};
				var text = Translator.translate(MM_Module, "TEST_VARIABLES", testData);
				expect(text).toBe("1234, something, index0, value of index1");
				done();
			};
		});

		it("test translation formatter(PluralRules) by force-locale in translation(en-US).", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = async function () {
				dom.window.fetch = fetch;
				dom.window.Log = log;
				const { Translator } = dom.window;
				var config = { languages: "de-DE, en-US", locale: "de-DE" };
				await Translator.init(config);
				await Translator.loadTranslations(MM_Module);
				const testData = {
					number: [1, 2, 3]
				};
				var text = Translator.translate(MM_Module, "TEST_PLURALRULES", testData);
				expect(text).toBe("1st, 2nd, 3rd");
				done();
			};
		});

		it("test translation formatter(NumberFormat) by config locale(de-DE).", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = async function () {
				dom.window.fetch = fetch;
				dom.window.Log = log;
				const { Translator } = dom.window;
				var config = { languages: "de-DE, en-US", locale: "de-DE" };
				await Translator.init(config);
				await Translator.loadTranslations(MM_Module);
				const testData = { number: 1234567 };
				var text = Translator.translate(MM_Module, "TEST_NUMBERFORMAT", testData);
				expect(text).toBe("1.234.567,00 €");
				done();
			};
		});

		it("test translation formatter(ListFormat) by config locale(de-DE).", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = async function () {
				dom.window.fetch = fetch;
				dom.window.Log = log;
				const { Translator } = dom.window;
				var config = { languages: "de-DE, en-US", locale: "de-DE" };
				await Translator.init(config);
				await Translator.loadTranslations(MM_Module);
				const testData = { arr: ["Red", "Blue", "Gold", "Silver"] };
				var text = Translator.translate(MM_Module, "TEST_LISTFORMAT", testData);
				expect(text).toBe("Red, Blue, Gold oder Silver");
				done();
			};
		});

		it("test translation formatter(DateTimeFormat) by config locale(de-DE).", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = async function () {
				dom.window.fetch = fetch;
				dom.window.Log = log;
				const { Translator } = dom.window;
				var config = { languages: "de-DE, en-US", locale: "de-DE" };
				await Translator.init(config);
				await Translator.loadTranslations(MM_Module);
				const date = "2021-08-15 12:34:56";
				var text = Translator.translate(MM_Module, "TEST_DATETIMEFORMAT", { date });
				expect(text).toBe("15. August 2021 um 12:34");
				done();
			};
		});

		it("test translation formatter(RelativeTimeFormat) by config locale(de-DE).", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = async function () {
				dom.window.fetch = fetch;
				dom.window.Log = log;
				const { Translator } = dom.window;
				var config = { languages: "de-DE, en-US", locale: "de-DE" };
				await Translator.init(config);
				await Translator.loadTranslations(MM_Module);
				const testData = {
					target: -3
				};
				var text = Translator.translate(MM_Module, "TEST_RELATIVEFORMAT", testData);
				expect(text).toBe("vor 3 Tagen");
				done();
			};
		});

		it("test translation formatter(AutoScaledRelativeTimeFormat) by force-locale(en-US).", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = async function () {
				dom.window.fetch = fetch;
				dom.window.Log = log;
				const { Translator } = dom.window;
				var config = { languages: "de-DE, en-US", locale: "de-DE" };
				await Translator.init(config);
				await Translator.loadTranslations(MM_Module);
				const testData = {
					target: new Date(Date.now() + 60 * 60 * 24 * 10 * 1000)
				};
				var text = Translator.translate(MM_Module, "TEST_AUTOSCALEFORMAT", testData);
				expect(text).toBe("next week");
				done();
			};
		});

		it("test translation formatter(Select) by force-locale(en-US).", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = async function () {
				dom.window.fetch = fetch;
				dom.window.Log = log;
				const { Translator } = dom.window;
				var config = { languages: "de-DE, en-US", locale: "de-DE" };
				await Translator.init(config);
				await Translator.loadTranslations(MM_Module);
				const testData = {
					condition: "afternoon",
					user: "Tom"
				};
				var text = Translator.translate(MM_Module, "TEST_SELECT", testData);
				expect(text).toBe("Good afternoon, Tom!");
				done();
			};
		});
	});

	describe("custom formatter", function () {
		it("register custom formatter and test it.", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = async function () {
				dom.window.fetch = fetch;
				dom.window.Log = log;
				const { Translator } = dom.window;
				var config = { languages: "de-DE, en-US", locale: "de-DE" };
				await Translator.init(config);
				await Translator.loadTranslations(MM_Module);

				Translator.registerFormatter("Temperature", function ({ value, options } = {}) {
					if (isNaN(value)) return value;
					if (options.unit === "farenheit") return (value * 9) / 5 + 32 + "°F";
					return value + "°C";
				});

				const testData = {
					roomTemperature: 22
				};
				var text = Translator.translate(MM_Module, "TEST_CUSTOM", testData);
				expect(text).toBe("Temp: 71.6°F");
				done();
			};
		});
	});
});
