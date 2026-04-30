const fs = require("node:fs");
const path = require("node:path");
const helmet = require("helmet");
const { JSDOM } = require("jsdom");
const express = require("express");
const translations = require("../../translations/translations");

/**
 * Helper function to create a fresh Translator instance with DOM environment.
 * @returns {object} Object containing window and Translator
 */
function createTranslationTestEnvironment () {
	// Setup DOM environment with Translator
	const translatorJs = fs.readFileSync(path.join(__dirname, "..", "..", "js", "translator.js"), "utf-8");
	const dom = new JSDOM("", { url: "http://localhost:3000", runScripts: "outside-only" });

	dom.window.Log = { log: vi.fn(), error: vi.fn() };
	dom.window.translations = translations;
	dom.window.fetch = fetch;
	dom.window.eval(translatorJs);

	const window = dom.window;

	return { window, Translator: window.Translator };
}

describe("translations", () => {
	let server;

	beforeAll(() => {
		const app = express();
		app.use(helmet());
		app.use((req, res, next) => {
			res.header("Access-Control-Allow-Origin", "*");
			next();
		});
		app.use("/translations", express.static(path.join(__dirname, "..", "..", "translations")));

		server = app.listen(3000);
	});

	afterAll(async () => {
		await server.close();
	});

	it("should have a translation file in the specified path", () => {
		for (const language in translations) {
			const file = fs.statSync(translations[language]);

			expect(file.isFile()).toBe(true);
		}
	});

	describe("loadTranslations", () => {
		let dom;

		beforeEach(() => {
			// Create a new translation test environment for each test
			const env = createTranslationTestEnvironment();
			const window = env.window;

			// Load class.js and module.js content directly for loadTranslations tests
			const classJs = fs.readFileSync(path.join(__dirname, "..", "..", "js", "class.js"), "utf-8");
			const moduleJs = fs.readFileSync(path.join(__dirname, "..", "..", "js", "module.js"), "utf-8");

			// Execute the scripts in the JSDOM context
			window.eval(classJs);
			window.eval(moduleJs);

			// Additional setup for loadTranslations tests
			window.config = { language: "de" };

			dom = { window };
		});

		it("should load translation file", async () => {
			const { Translator, Module, config } = dom.window;
			config.language = "en";
			Translator.load = vi.fn().mockImplementation(() => null);

			Module.register("name", { getTranslations: () => translations });
			const MMM = Module.create("name");

			await MMM.loadTranslations();

			expect(Translator.load.mock.calls).toHaveLength(1);
			expect(Translator.load).toHaveBeenCalledWith(MMM, "translations/en.json", false);
		});

		it("should load translation + fallback file", async () => {
			const { Translator, Module } = dom.window;
			Translator.load = vi.fn().mockImplementation(() => null);

			Module.register("name", { getTranslations: () => translations });
			const MMM = Module.create("name");

			await MMM.loadTranslations();

			expect(Translator.load.mock.calls).toHaveLength(2);
			expect(Translator.load).toHaveBeenCalledWith(MMM, "translations/de.json", false);
			expect(Translator.load).toHaveBeenCalledWith(MMM, "translations/en.json", true);
		});

		it("should load translation fallback file", async () => {
			const { Translator, Module, config } = dom.window;
			config.language = "--";
			Translator.load = vi.fn().mockImplementation(() => null);

			Module.register("name", { getTranslations: () => translations });
			const MMM = Module.create("name");

			await MMM.loadTranslations();

			expect(Translator.load.mock.calls).toHaveLength(1);
			expect(Translator.load).toHaveBeenCalledWith(MMM, "translations/en.json", true);
		});

		it("should load no file", async () => {
			const { Translator, Module } = dom.window;
			Translator.load = vi.fn();

			Module.register("name", {});
			const MMM = Module.create("name");

			await MMM.loadTranslations();

			expect(Translator.load.mock.calls).toHaveLength(0);
		});
	});

	const mmm = {
		name: "TranslationTest",
		file (file) {
			return `http://localhost:3000/${file}`;
		}
	};

	describe("parsing language files through the Translator class", () => {
		for (const language in translations) {
			it(`should parse ${language}`, async () => {
				const { Translator } = createTranslationTestEnvironment();
				await Translator.load(mmm, translations[language], false);

				expect(typeof Translator.translations[mmm.name]).toBe("object");
				expect(Object.keys(Translator.translations[mmm.name]).length).toBeGreaterThanOrEqual(1);
			});
		}
	});

	describe("same keys", () => {
		let base;

		// Some expressions are not easy to translate automatically. For the sake of a working test, we filter them out.
		const COMMON_EXCEPTIONS = ["WEEK_SHORT"];

		// Some languages don't have certain words, so we need to filter those language specific exceptions.
		const LANGUAGE_EXCEPTIONS = {
			ca: ["DAYBEFOREYESTERDAY"],
			cv: ["DAYBEFOREYESTERDAY"],
			cy: ["DAYBEFOREYESTERDAY"],
			en: ["DAYAFTERTOMORROW", "DAYBEFOREYESTERDAY"],
			fy: ["DAYBEFOREYESTERDAY"],
			gl: ["DAYBEFOREYESTERDAY"],
			hu: ["DAYBEFOREYESTERDAY"],
			id: ["DAYBEFOREYESTERDAY"],
			it: ["DAYBEFOREYESTERDAY"],
			"pt-br": ["DAYAFTERTOMORROW"],
			tr: ["DAYBEFOREYESTERDAY"]
		};

		// Function to initialize JSDOM and load translations
		const initializeTranslationDOM = async (language) => {
			const { Translator } = createTranslationTestEnvironment();
			await Translator.load(mmm, translations[language], false);
			return Translator.translations[mmm.name];
		};

		beforeAll(async () => {
			// Using German as the base rather than English, since
			// some words do not have a direct translation in English.
			const germanTranslations = await initializeTranslationDOM("de");
			base = Object.keys(germanTranslations).sort();
		});

		for (const language in translations) {
			if (language === "de") continue;

			describe(`Translation keys of ${language}`, () => {
				let keys;

				beforeAll(async () => {
					const languageTranslations = await initializeTranslationDOM(language);
					keys = Object.keys(languageTranslations).sort();
				});

				it(`${language} should not contain keys that are not in base language`, () => {
					keys.forEach((key) => {
						expect(base).toContain(key, `Translation key '${key}' in language '${language}' is not present in base language`);
					});
				});

				it(`${language} should contain all base keys (excluding defined exceptions)`, () => {
					let filteredBase = base.filter((key) => !COMMON_EXCEPTIONS.includes(key));
					let filteredKeys = keys.filter((key) => !COMMON_EXCEPTIONS.includes(key));

					if (LANGUAGE_EXCEPTIONS[language]) {
						const exceptions = LANGUAGE_EXCEPTIONS[language];
						filteredBase = filteredBase.filter((key) => !exceptions.includes(key));
						filteredKeys = filteredKeys.filter((key) => !exceptions.includes(key));
					}

					filteredBase.forEach((baseKey) => {
						expect(filteredKeys).toContain(baseKey, `Translation key '${baseKey}' is missing in language '${language}'`);
					});
				});
			});
		}
	});
});
