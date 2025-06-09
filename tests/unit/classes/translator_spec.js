const fs = require("node:fs");
const path = require("node:path");
const helmet = require("helmet");
const { JSDOM } = require("jsdom");
const express = require("express");

describe("Translator", () => {
	let server;
	const sockets = new Set();
	const translatorJsPath = path.join(__dirname, "..", "..", "..", "js", "translator.js");
	const translatorJsScriptContent = fs.readFileSync(translatorJsPath, "utf8");
	const translationTestData = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "..", "tests", "mocks", "translation_test.json"), "utf8"));

	beforeAll(() => {
		const app = express();
		app.use(helmet());
		app.use((req, res, next) => {
			res.header("Access-Control-Allow-Origin", "*");
			next();
		});
		app.use("/translations", express.static(path.join(__dirname, "..", "..", "..", "tests", "mocks")));

		server = app.listen(3000);

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

		it("should return custom module translation", async () => {
			const dom = new JSDOM("", { runScripts: "outside-only" });
			dom.window.eval(translatorJsScriptContent);

			await new Promise((resolve) => dom.window.onload = resolve);

			const { Translator } = dom.window;
			setTranslations(Translator);

			let translation = Translator.translate({ name: "MMM-Module" }, "Hello");
			expect(translation).toBe("Hallo");

			translation = Translator.translate({ name: "MMM-Module" }, "Hello {username}", { username: "fewieden" });
			expect(translation).toBe("Hallo fewieden");
		});

		it("should return core translation", async () => {
			const dom = new JSDOM("", { runScripts: "outside-only" });
			dom.window.eval(translatorJsScriptContent);

			await new Promise((resolve) => dom.window.onload = resolve);

			const { Translator } = dom.window;
			setTranslations(Translator);
			let translation = Translator.translate({ name: "MMM-Module" }, "FOO");
			expect(translation).toBe("Foo");
			translation = Translator.translate({ name: "MMM-Module" }, "BAR {something}", { something: "Lorem Ipsum" });
			expect(translation).toBe("Bar Lorem Ipsum");
		});

		it("should return custom module translation fallback", async () => {
			const dom = new JSDOM("", { runScripts: "outside-only" });
			dom.window.eval(translatorJsScriptContent);

			await new Promise((resolve) => dom.window.onload = resolve);

			const { Translator } = dom.window;
			setTranslations(Translator);
			const translation = Translator.translate({ name: "MMM-Module" }, "A key");
			expect(translation).toBe("A translation");
		});

		it("should return core translation fallback", async () => {
			const dom = new JSDOM("", { runScripts: "outside-only" });
			dom.window.eval(translatorJsScriptContent);

			await new Promise((resolve) => dom.window.onload = resolve);

			const { Translator } = dom.window;
			setTranslations(Translator);
			const translation = Translator.translate({ name: "MMM-Module" }, "Fallback");
			expect(translation).toBe("core fallback");
		});

		it("should return translation with placeholder for missing variables", async () => {
			const dom = new JSDOM("", { runScripts: "outside-only" });
			dom.window.eval(translatorJsScriptContent);

			await new Promise((resolve) => dom.window.onload = resolve);

			const { Translator } = dom.window;
			setTranslations(Translator);
			const translation = Translator.translate({ name: "MMM-Module" }, "Hello {username}");
			expect(translation).toBe("Hallo {username}");
		});

		it("should return key if no translation was found", async () => {
			const dom = new JSDOM("", { runScripts: "outside-only" });
			dom.window.eval(translatorJsScriptContent);

			await new Promise((resolve) => dom.window.onload = resolve);

			const { Translator } = dom.window;
			setTranslations(Translator);
			const translation = Translator.translate({ name: "MMM-Module" }, "MISSING");
			expect(translation).toBe("MISSING");
		});
	});

	describe("load", () => {
		const mmm = {
			name: "TranslationTest",
			file (file) {
				return `http://localhost:3000/translations/${file}`;
			}
		};

		it("should load translations", async () => {
			const dom = new JSDOM("", { runScripts: "outside-only" });
			dom.window.eval(translatorJsScriptContent);
			dom.window.Log = { log: jest.fn() };
			await new Promise((resolve) => dom.window.onload = resolve);

			const { Translator } = dom.window;
			const file = "translation_test.json";

			await Translator.load(mmm, file, false);
			const json = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "..", "tests", "mocks", file), "utf8"));
			expect(Translator.translations[mmm.name]).toEqual(json);
		});

		it("should load translation fallbacks", async () => {
			const dom = new JSDOM("", { runScripts: "outside-only" });
			dom.window.eval(translatorJsScriptContent);

			await new Promise((resolve) => dom.window.onload = resolve);

			const { Translator } = dom.window;
			const file = "translation_test.json";

			dom.window.Log = { log: jest.fn() };
			await Translator.load(mmm, file, true);
			const json = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "..", "tests", "mocks", file), "utf8"));
			expect(Translator.translationsFallback[mmm.name]).toEqual(json);
		});

		it("should not load translations, if module fallback exists", async () => {
			const dom = new JSDOM("", { runScripts: "outside-only" });
			dom.window.eval(translatorJsScriptContent);
			await new Promise((resolve) => dom.window.onload = resolve);

			const { Translator } = dom.window;
			const file = "translation_test.json";


			dom.window.Log = { log: jest.fn() };
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
			const dom = new JSDOM("", { runScripts: "outside-only" });
			dom.window.eval(translatorJsScriptContent);
			dom.window.translations = { en: "http://localhost:3000/translations/translation_test.json" };
			dom.window.Log = { log: jest.fn() };
			await new Promise((resolve) => dom.window.onload = resolve);

			const { Translator } = dom.window;
			await Translator.loadCoreTranslations("en");

			const en = translationTestData;

			await new Promise((resolve) => setTimeout(resolve, 500));

			expect(Translator.coreTranslations).toEqual(en);
			expect(Translator.coreTranslationsFallback).toEqual(en);
		});

		it("should load core fallback if language cannot be found", async () => {
			const dom = new JSDOM("", { runScripts: "outside-only" });
			dom.window.eval(translatorJsScriptContent);
			dom.window.translations = { en: "http://localhost:3000/translations/translation_test.json" };
			dom.window.Log = { log: jest.fn() };
			await new Promise((resolve) => dom.window.onload = resolve);

			const { Translator } = dom.window;
			await Translator.loadCoreTranslations("MISSINGLANG");

			const en = translationTestData;

			await new Promise((resolve) => setTimeout(resolve, 500));

			expect(Translator.coreTranslations).toEqual({});
			expect(Translator.coreTranslationsFallback).toEqual(en);
		});
	});

	describe("loadCoreTranslationsFallback", () => {
		it("should load core translations fallback", async () => {
			const dom = new JSDOM("", { runScripts: "outside-only" });
			dom.window.eval(translatorJsScriptContent);
			dom.window.translations = { en: "http://localhost:3000/translations/translation_test.json" };
			dom.window.Log = { log: jest.fn() };
			await new Promise((resolve) => dom.window.onload = resolve);

			const { Translator } = dom.window;
			await Translator.loadCoreTranslationsFallback();

			const en = translationTestData;

			await new Promise((resolve) => setTimeout(resolve, 500));

			expect(Translator.coreTranslationsFallback).toEqual(en);
		});

		it("should load core fallback if language cannot be found", async () => {
			const dom = new JSDOM("", { runScripts: "outside-only" });
			dom.window.eval(translatorJsScriptContent);
			dom.window.translations = {};
			dom.window.Log = { log: jest.fn() };

			await new Promise((resolve) => dom.window.onload = resolve);

			const { Translator } = dom.window;
			await Translator.loadCoreTranslations();

			await new Promise((resolve) => setTimeout(resolve, 500));

			expect(Translator.coreTranslationsFallback).toEqual({});
		});
	});
});
