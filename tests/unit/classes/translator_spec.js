const fs = require("node:fs");
const path = require("node:path");
const helmet = require("helmet");
const { JSDOM } = require("jsdom");
const express = require("express");

/**
 * Helper function to create a fresh Translator instance with DOM environment.
 * @returns {object} Object containing window and Translator
 */
function createTranslationTestEnvironment () {
	const translatorJs = fs.readFileSync(path.join(__dirname, "..", "..", "..", "js", "translator.js"), "utf-8");
	const dom = new JSDOM("", { url: "http://localhost:3001", runScripts: "outside-only" });

	dom.window.Log = { log: vi.fn(), error: vi.fn() };
	dom.window.fetch = fetch;
	dom.window.eval(translatorJs);

	return { window: dom.window, Translator: dom.window.Translator };
}

describe("Translator", () => {
	let server;
	const sockets = new Set();
	const translationTestData = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "..", "tests", "mocks", "translation_test.json"), "utf8"));

	beforeAll(() => {
		const app = express();
		app.use(helmet());
		app.use((req, res, next) => {
			res.header("Access-Control-Allow-Origin", "*");
			next();
		});
		app.use("/translations", express.static(path.join(__dirname, "..", "..", "..", "tests", "mocks")));

		server = app.listen(3001);

		server.on("connection", (socket) => {
			sockets.add(socket);
		});
	});

	afterAll(async () => {
		for (const socket of sockets) {
			socket.destroy();
			sockets.delete(socket);
		}

		await server.close();
	});

	describe("translate", () => {
		const translations = {
			"MMM-Module": {
				Hello: "Hallo",
				"Hello {username}": "Hallo {username}"
			}
		};

		const coreTranslations = {
			Hello: "XXX",
			"Hello {username}": "XXX",
			FOO: "Foo",
			"BAR {something}": "Bar {something}"
		};

		const translationsFallback = {
			"MMM-Module": {
				Hello: "XXX",
				"Hello {username}": "XXX",
				FOO: "XXX",
				"BAR {something}": "XXX",
				"A key": "A translation"
			}
		};

		const coreTranslationsFallback = {
			FOO: "XXX",
			"BAR {something}": "XXX",
			Hello: "XXX",
			"Hello {username}": "XXX",
			"A key": "XXX",
			Fallback: "core fallback"
		};

		/**
		 * @param {object} Translator the global Translator object
		 */
		const setTranslations = (Translator) => {
			Translator.translations = translations;
			Translator.coreTranslations = coreTranslations;
			Translator.translationsFallback = translationsFallback;
			Translator.coreTranslationsFallback = coreTranslationsFallback;
		};

		it("should return custom module translation", () => {
			const { Translator } = createTranslationTestEnvironment();
			setTranslations(Translator);

			let translation = Translator.translate({ name: "MMM-Module" }, "Hello");
			expect(translation).toBe("Hallo");

			translation = Translator.translate({ name: "MMM-Module" }, "Hello {username}", { username: "fewieden" });
			expect(translation).toBe("Hallo fewieden");
		});

		it("should return core translation", () => {
			const { Translator } = createTranslationTestEnvironment();
			setTranslations(Translator);
			let translation = Translator.translate({ name: "MMM-Module" }, "FOO");
			expect(translation).toBe("Foo");
			translation = Translator.translate({ name: "MMM-Module" }, "BAR {something}", { something: "Lorem Ipsum" });
			expect(translation).toBe("Bar Lorem Ipsum");
		});

		it("should return custom module translation fallback", () => {
			const { Translator } = createTranslationTestEnvironment();
			setTranslations(Translator);
			const translation = Translator.translate({ name: "MMM-Module" }, "A key");
			expect(translation).toBe("A translation");
		});

		it("should return core translation fallback", () => {
			const { Translator } = createTranslationTestEnvironment();
			setTranslations(Translator);
			const translation = Translator.translate({ name: "MMM-Module" }, "Fallback");
			expect(translation).toBe("core fallback");
		});

		it("should return translation with placeholder for missing variables", () => {
			const { Translator } = createTranslationTestEnvironment();
			setTranslations(Translator);
			const translation = Translator.translate({ name: "MMM-Module" }, "Hello {username}");
			expect(translation).toBe("Hallo {username}");
		});

		it("should return key if no translation was found", () => {
			const { Translator } = createTranslationTestEnvironment();
			setTranslations(Translator);
			const translation = Translator.translate({ name: "MMM-Module" }, "MISSING");
			expect(translation).toBe("MISSING");
		});
	});

	describe("load", () => {
		const mmm = {
			name: "TranslationTest",
			file (file) {
				return `http://localhost:3001/translations/${file}`;
			}
		};

		it("should load translations", async () => {
			const { Translator } = createTranslationTestEnvironment();
			const file = "translation_test.json";

			await Translator.load(mmm, file, false);
			const json = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "..", "tests", "mocks", file), "utf8"));
			expect(Translator.translations[mmm.name]).toEqual(json);
		});

		it("should load translation fallbacks", async () => {
			const { Translator } = createTranslationTestEnvironment();
			const file = "translation_test.json";

			await Translator.load(mmm, file, true);
			const json = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "..", "tests", "mocks", file), "utf8"));
			expect(Translator.translationsFallback[mmm.name]).toEqual(json);
		});

		it("should not load translations, if module fallback exists", async () => {
			const { Translator } = createTranslationTestEnvironment();
			const file = "translation_test.json";

			Translator.translationsFallback[mmm.name] = {
				Hello: "Hallo"
			};

			await Translator.load(mmm, file, false);
			expect(Translator.translations[mmm.name]).toBeUndefined();
			expect(Translator.translationsFallback[mmm.name]).toEqual({
				Hello: "Hallo"
			});
		});
	});

	describe("loadCoreTranslations", () => {
		it("should load core translations and fallback", async () => {
			const { window, Translator } = createTranslationTestEnvironment();
			window.translations = { en: "http://localhost:3001/translations/translation_test.json" };
			await Translator.loadCoreTranslations("en");

			const en = translationTestData;

			expect(Translator.coreTranslations).toEqual(en);
			expect(Translator.coreTranslationsFallback).toEqual(en);
		});

		it("should load core fallback if language cannot be found", async () => {
			const { window, Translator } = createTranslationTestEnvironment();
			window.translations = { en: "http://localhost:3001/translations/translation_test.json" };
			await Translator.loadCoreTranslations("MISSINGLANG");

			const en = translationTestData;

			expect(Translator.coreTranslations).toEqual({});
			expect(Translator.coreTranslationsFallback).toEqual(en);
		});
	});

	describe("loadCoreTranslationsFallback", () => {
		it("should load core translations fallback", async () => {
			const { window, Translator } = createTranslationTestEnvironment();
			window.translations = { en: "http://localhost:3001/translations/translation_test.json" };
			await Translator.loadCoreTranslationsFallback();

			const en = translationTestData;

			expect(Translator.coreTranslationsFallback).toEqual(en);
		});

		it("should load core fallback if language cannot be found", async () => {
			const { window, Translator } = createTranslationTestEnvironment();
			window.translations = {};
			await Translator.loadCoreTranslations();

			expect(Translator.coreTranslationsFallback).toEqual({});
		});
	});
});
