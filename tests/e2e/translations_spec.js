const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const helmet = require("helmet");
const express = require("express");
const translations = require("../../translations/translations");
const {
	setupTranslationTestEnvironment,
	TRANSLATOR_MODULE_URL,
	resetTranslatorState
} = require("../utils/translation_test_environment");

/**
 * Create a fresh Translator state for each test.
 * @returns {Promise<object>} Shared Translator singleton with cleared state
 */
async function getFreshTranslator () {
	setupTranslationTestEnvironment(3000);
	const { Translator } = await import(TRANSLATOR_MODULE_URL);
	resetTranslatorState(Translator);
	return Translator;
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

	afterEach(() => {
		vi.restoreAllMocks();
		delete global.document;
		delete global.Log;
		delete global.config;
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
		let Translator;
		let Module;
		let config;

		beforeEach(async () => {
			global.Log = { log: vi.fn(), error: vi.fn(), warn: vi.fn() };
			config = { language: "de" };
			global.config = config;

			// module.js and translator.js are ES modules that read these globals at call time.
			Translator = await getFreshTranslator();

			const modulePath = pathToFileURL(path.join(__dirname, "..", "..", "js", "module.js")).href;
			({ Module } = await import(modulePath));
		});

		it("should load translation file", async () => {
			config.language = "en";
			const loadSpy = vi.spyOn(Translator, "load").mockResolvedValue(null);

			Module.register("name", { getTranslations: () => translations });
			const MMM = Module.create("name");

			await MMM.loadTranslations();

			expect(loadSpy.mock.calls).toHaveLength(1);
			expect(loadSpy).toHaveBeenCalledWith(MMM, "translations/en.json", false);
		});

		it("should load translation + fallback file", async () => {
			const loadSpy = vi.spyOn(Translator, "load").mockResolvedValue(null);

			Module.register("name", { getTranslations: () => translations });
			const MMM = Module.create("name");

			await MMM.loadTranslations();

			expect(loadSpy.mock.calls).toHaveLength(2);
			expect(loadSpy).toHaveBeenCalledWith(MMM, "translations/de.json", false);
			expect(loadSpy).toHaveBeenCalledWith(MMM, "translations/en.json", true);
		});

		it("should load translation fallback file", async () => {
			config.language = "--";
			const loadSpy = vi.spyOn(Translator, "load").mockResolvedValue(null);

			Module.register("name", { getTranslations: () => translations });
			const MMM = Module.create("name");

			await MMM.loadTranslations();

			expect(loadSpy.mock.calls).toHaveLength(1);
			expect(loadSpy).toHaveBeenCalledWith(MMM, "translations/en.json", true);
		});

		it("should load no file", async () => {
			const loadSpy = vi.spyOn(Translator, "load").mockResolvedValue(null);

			Module.register("name", {});
			const MMM = Module.create("name");

			await MMM.loadTranslations();

			expect(loadSpy.mock.calls).toHaveLength(0);
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
				const Translator = await getFreshTranslator();
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
			const Translator = await getFreshTranslator();
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
