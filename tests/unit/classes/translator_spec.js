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
			HELLO: "Hello (module)",
			ONLY_EXIST_MODULE_EN: "only exists in module(en)"
		},
		"de.json": {
			TEST: "test(module/de)",
			HELLO: "Hallo (module)",
			TEST_VARIABLES: "{number}, {obj.some.thing}, {arr.0}, {arr.1.value}",
			TEST_PLURALRULES: "{number.0}{number.0@PLURAL_SELECT}, {number.1}{number.1@PLURAL_SELECT}, {number.2}{number.2@PLURAL_SELECT}",
			TEST_NUMBERFORMAT: "{number@CURRENCY}",
			TEST_LISTFORMAT: "{colors@LIST}",
			TEST_DATETIMEFORMAT: "{date@DATE}",
			TEST_RELATIVEFORMAT: "{target@RELATIVE_DAY}",
			TEST_AUTOSCALEFORMAT: "{target@AUTOSCALE}",
			TEST_SELECT: "{condition@GREETING}, {user}!",
			TEST_CUSTOM: "Temp: {roomTemperature@TEMPERATURE}",

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
			"@TEMPERATURE": {
				format: "TemperatureConverter",
				options: { convert: "c2f", unit: "°F" }
			}
		}
	}
};

const fetch = async (url) => {
	// fake fetch
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

class FakeModule {
	constructor(name) {
		this.name = name;
		this._translator = null;
	}

	file(filePath) {
		return "/" + this.name + "/" + filePath;
	}

	translate(key, ...rest) {
		const isBoolean = (val) => "boolean" === typeof val;
		var fallbackOrVariables,
			fallback,
			asObject = false;
		if (rest.length > 0) {
			asObject = isBoolean(rest[rest.length - 1]) ? rest[rest.length - 1] : false;
			if ("object" === typeof rest[0]) {
				fallbackOrVariables = !isBoolean(rest[0]) ? rest[0] : null;
				fallback = !isBoolean(rest[1]) ? (rest[1] ? rest[1] : "") : null;
			} else {
				fallback = !isBoolean(rest[0]) ? rest[0] : "";
			}
		}
		return this._translator.translate({
			moduleName: this.name,
			key,
			fallback,
			asObject,
			variables: fallbackOrVariables
		});
	}

	async loadTranslations() {
		return await this._translator.loadTranslations(this);
	}

	_injectTranslator(translator) {
		this._translator = translator;
	}
}

describe("Translator", function () {
	describe("init", function () {
		let dom;
		let isLoaded = false;
		let Translator;
		beforeEach((done) => {
			dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = async function () {
				dom.window.fetch = fetch;
				dom.window.Log = log;
				Translator = dom.window.Translator;
				isLoaded = true;
			};
			var waitLoading = setTimeout(() => {
				if (isLoaded) {
					clearTimeout(waitLoading);
					done();
				} else {
					waitLoading();
				}
			}, 10);
		});
		afterEach((done) => {
			isLoaded = false;
			done();
		});

		it("initialize without parameter", async function () {
			expect(isLoaded).toBe(true);
			await Translator.init();
			let locale = Translator.getLocale();
			let language = Translator.getLanguages();
			expect(locale).toBe("default");
			expect(language.toString()).toBe(["en"].toString());
			var text = Translator.translate({ moduleName: "core", key: "HELLO" });
			expect(text).toBe("Hello");
		});

		it("initialize with only config.language", async function () {
			expect(isLoaded).toBe(true);
			await Translator.init({ language: "de" });
			let locale = Translator.getLocale();
			let language = Translator.getLanguages();
			expect(locale).toBe("default");
			expect(language.toString()).toBe(["de", "en"].toString());
			var text = Translator.translate({ moduleName: "core", key: "HELLO" });
			expect(text).toBe("Hallo");
		});

		it("initialize with only config.languages (array)", async function () {
			expect(isLoaded).toBe(true);
			await Translator.init({ languages: ["de", "en-US"] });
			let locale = Translator.getLocale();
			let language = Translator.getLanguages();
			expect(locale).toBe("default");
			expect(language.join(",")).toBe(["de", "en-US", "en"].join(","));
			var text = Translator.translate({ moduleName: "core", key: "HELLO" });
			expect(text).toBe("Hallo");
		});

		it("initialize with only config.languages (string)", async function () {
			expect(isLoaded).toBe(true);
			await Translator.init({ languages: "de, en-US" });
			let locale = Translator.getLocale();
			let language = Translator.getLanguages();
			expect(locale).toBe("default");
			expect(language.join(",")).toBe(["de", "en-US", "en"].join(","));
			var text = Translator.translate({ moduleName: "core", key: "HELLO" });
			expect(text).toBe("Hallo");
		});

		it("initialize with config.languages and config.language together", async function () {
			expect(isLoaded).toBe(true);
			await Translator.init({ languages: ["en", "nl", "de"], language: "nl" });
			let locale = Translator.getLocale();
			let language = Translator.getLanguages();
			expect(locale).toBe("default");
			expect(language.join(",")).toBe(["nl", "en", "de"].join(","));
			var text = Translator.translate({ moduleName: "core", key: "HELLO" });
			expect(text).toBe("Hello");
		});

		it("initialize with invalid locale format", async function () {
			expect(isLoaded).toBe(true);
			await Translator.init({ locale: "en_US" });
			let locale = Translator.getLocale();
			expect(locale).toBe("default");
			var text = Translator.translate({ moduleName: "core", key: "HELLO" });
			expect(text).toBe("Hello");
		});
	}); // end of init test

	describe("module translate", function () {
		let dom;
		let isLoaded = false;
		let Translator;
		const mmModule = new FakeModule("MMM-Module");

		beforeAll((done) => {
			dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = async function () {
				dom.window.fetch = fetch;
				dom.window.Log = log;
				Translator = dom.window.Translator;
				await Translator.init({ languages: "de-DE, en-US", locale: "de-DE" });
				mmModule._injectTranslator(Translator);
				await mmModule.loadTranslations();
				isLoaded = true;
			};
			var waitLoading = setTimeout(() => {
				if (isLoaded) {
					clearTimeout(waitLoading);
					done();
				} else {
					waitLoading();
				}
			}, 10);
		});

		afterAll((done) => {
			isLoaded = false;
			done();
		});

		it("should load proper translations. (de.json, en.json)", async function () {
			expect(isLoaded).toBe(true);
			var text = mmModule.translate("ONLY_EXIST_MODULE_EN");
			expect(text).toBe("only exists in module(en)");
		});

		it("should return 'null' when not found in dictionaries and no 'fallback' parameter.", async function () {
			expect(isLoaded).toBe(true);
			var text = mmModule.translate("WEIRD");
			expect(text).toBe(null);
		});

		it("should return fallback when not found in dictionaries with fallback message", async function () {
			expect(isLoaded).toBe(true);
			var text = mmModule.translate("WEIRD", "blah blah");
			expect(text).toBe("blah blah");
			text = mmModule.translate("WEIRD", { obj: 1 }, "blah blah");
			expect(text).toBe("blah blah");
		});

		it("should return text from `de (as fallback of 'de-DE')` for module.", async function () {
			expect(isLoaded).toBe(true);
			var text = mmModule.translate("HELLO");
			expect(text).toBe("Hallo (module)");
		});

		it("should return object with 'asObject' parameter", async function () {
			expect(isLoaded).toBe(true);
			var text = mmModule.translate("HELLO", true);
			expect(text.toString()).toBe("Hallo (module)");
			text = mmModule.translate("HELLO", { obj: 1 }, true);
			expect(text.toString()).toBe("Hallo (module)");
			text = mmModule.translate("HELLO", { obj: 1 }, "blah blah", true);
			expect(text.toString()).toBe("Hallo (module)");
		});

		it(`test translation with variables (scalar variable, nested object property, array)
	> "{number}, {obj.some.thing}, {arr.0}, {arr.1.value}" => "1234, something, index0, value of index1"`, async function () {
			expect(isLoaded).toBe(true);
			const testData = {
				number: 1234,
				obj: {
					some: {
						thing: "something"
					}
				},
				arr: ["index0", { value: "value of index1" }]
			};
			var text = mmModule.translate("TEST_VARIABLES", testData);
			expect(text).toBe("1234, something, index0, value of index1");
		});

		it(`test translation formatter(PluralRules) by force-locale in translation(en-US).
	>  "{number.0}{number.0@PLURAL_SELECT}, {number.1}{number.1@PLURAL_SELECT}, {number.2}{number.2@PLURAL_SELECT}" => "1st, 2nd, 3rd"`, async function () {
			expect(isLoaded).toBe(true);
			const testData = {
				number: [1, 2, 3]
			};
			var text = mmModule.translate("TEST_PLURALRULES", testData);
			expect(text).toBe("1st, 2nd, 3rd");
		});

		it(`test translation formatter(NumberFormat) by config locale(de-DE).
	> "{number@CURRENCY}" => "1.234.567,89 €"`, async function () {
			expect(isLoaded).toBe(true);
			const testData = {
				number: 1234567.89
			};
			var text = mmModule.translate("TEST_NUMBERFORMAT", testData);
			expect(text).toBe("1.234.567,89 €");
		});

		it(`test translation formatter(ListFormat) by config locale(de-DE).
	> "{colors@LIST}" => "Red, Blue, Gold oder Silver"`, async function () {
			expect(isLoaded).toBe(true);
			const testData = { colors: ["Red", "Blue", "Gold", "Silver"] };
			var text = mmModule.translate("TEST_LISTFORMAT", testData);
			expect(text).toBe("Red, Blue, Gold oder Silver");
		});

		it(`test translation formatter(DateTimeFormat) by config locale(de-DE).
	> "{date@DATE}" => "15. August 2021 um 12:34"`, async function () {
			expect(isLoaded).toBe(true);
			const date = "2021-08-15 12:34:56";
			var text = mmModule.translate("TEST_DATETIMEFORMAT", { date });
			expect(text).toBe("15. August 2021 um 12:34");
		});

		it(`test translation formatter(RelativeTimeFormat) by config locale(de-DE).
	> "{target@RELATIVE_DAY}" => "vor 3 Tagen"`, async function () {
			expect(isLoaded).toBe(true);
			var text = mmModule.translate("TEST_RELATIVEFORMAT", { target: -3 });
			expect(text).toBe("vor 3 Tagen");
		});

		it(`test translation formatter(AutoScaledRelativeTimeFormat) by force-locale(en-US).
	> "{target@AUTOSCALE}" => "next week"`, async function () {
			expect(isLoaded).toBe(true);
			var text = mmModule.translate("TEST_AUTOSCALEFORMAT", { target: new Date(Date.now() + 60 * 60 * 24 * 10 * 1000) });
			expect(text).toBe("next week");
		});

		it(`test translation formatter(Select).
	> "{condition@GREETING}, {user}!" => "Good afternoon, Tom!"`, async function () {
			expect(isLoaded).toBe(true);
			var text = mmModule.translate("TEST_SELECT", { condition: "afternoon", user: "Tom" });
			expect(text).toBe("Good afternoon, Tom!");
		});

		it(`register custom formatter and test it.
	> "Temp: {roomTemperature@TEMPERATURE}" => "Temp: 71.6°F"`, async function () {
			expect(isLoaded).toBe(true);
			Translator.registerFormatter("TemperatureConverter", function ({ value, options } = {}) {
				if (isNaN(value)) return value;
				var unit = options.unit ? options.unit : "";
				if (options.convert) {
					if (options.convert.toLowerCase() === "c2f") return Math.round((value * 9 * 10) / 5) / 10 + 32 + unit;
					if (options.convert.toLowerCase() === "f2c") return Math.round(((value - 32) / 9) * 5 * 10) / 10 + unit;
				}
				return value + unit;
			});

			const testData = {
				roomTemperature: 22
			};
			var text = mmModule.translate("TEST_CUSTOM", testData);
			expect(text).toBe("Temp: 71.6°F");
		});
	}); // end of module translate test
}); // End of Translator test
