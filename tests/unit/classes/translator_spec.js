const path = require("path");
const helmet = require("helmet");
const { JSDOM } = require("jsdom");
const express = require("express");
const sockets = new Set();

describe("Translator", function () {
	let server;

	beforeAll(function () {
		const app = express();
		app.use(helmet());
		app.use(function (req, res, next) {
			res.header("Access-Control-Allow-Origin", "*");
			next();
		});
		app.use("/translations", express.static(path.join(__dirname, "..", "..", "..", "tests", "configs", "data")));

		server = app.listen(3000);

		server.on("connection", (socket) => {
			sockets.add(socket);
		});
	});

	afterAll(function () {
		for (const socket of sockets) {
			socket.destroy();

			sockets.delete(socket);
		}

		server.close();
	});

	describe("translate", function () {
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
		function setTranslations(Translator) {
			Translator.translations = translations;
			Translator.coreTranslations = coreTranslations;
			Translator.translationsFallback = translationsFallback;
			Translator.coreTranslationsFallback = coreTranslationsFallback;
		}

		it("should return custom module translation", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = function () {
				const { Translator } = dom.window;
				setTranslations(Translator);
				let translation = Translator.translate({ name: "MMM-Module" }, "Hello");
				expect(translation).toBe("Hallo");
				translation = Translator.translate({ name: "MMM-Module" }, "Hello {username}", { username: "fewieden" });
				expect(translation).toBe("Hallo fewieden");
				done();
			};
		});

		it("should return core translation", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = function () {
				const { Translator } = dom.window;
				setTranslations(Translator);
				let translation = Translator.translate({ name: "MMM-Module" }, "FOO");
				expect(translation).toBe("Foo");
				translation = Translator.translate({ name: "MMM-Module" }, "BAR {something}", { something: "Lorem Ipsum" });
				expect(translation).toBe("Bar Lorem Ipsum");
				done();
			};
		});

		it("should return custom module translation fallback", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = function () {
				const { Translator } = dom.window;
				setTranslations(Translator);
				const translation = Translator.translate({ name: "MMM-Module" }, "A key");
				expect(translation).toBe("A translation");
				done();
			};
		});

		it("should return core translation fallback", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = function () {
				const { Translator } = dom.window;
				setTranslations(Translator);
				const translation = Translator.translate({ name: "MMM-Module" }, "Fallback");
				expect(translation).toBe("core fallback");
				done();
			};
		});

		it("should return translation with placeholder for missing variables", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = function () {
				const { Translator } = dom.window;
				setTranslations(Translator);
				const translation = Translator.translate({ name: "MMM-Module" }, "Hello {username}");
				expect(translation).toBe("Hallo {username}");
				done();
			};
		});

		it("should return key if no translation was found", function (done) {
			const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = function () {
				const { Translator } = dom.window;
				setTranslations(Translator);
				const translation = Translator.translate({ name: "MMM-Module" }, "MISSING");
				expect(translation).toBe("MISSING");
				done();
			};
		});
	});

	describe("load", function () {
		const mmm = {
			name: "TranslationTest",
			file(file) {
				return `http://localhost:3000/translations/${file}`;
			}
		};

		it("should load translations", function (done) {
			const dom = new JSDOM(`<script>var Log = {log: function(){}};</script><script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = function () {
				const { Translator } = dom.window;
				const file = "TranslationTest.json";

				Translator.load(mmm, file, false, function () {
					const json = require(path.join(__dirname, "..", "..", "..", "tests", "configs", "data", file));
					expect(Translator.translations[mmm.name]).toEqual(json);
					done();
				});
			};
		});

		it("should load translation fallbacks", function (done) {
			const dom = new JSDOM(`<script>var Log = {log: function(){}};</script><script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = function () {
				const { Translator } = dom.window;
				const file = "TranslationTest.json";

				Translator.load(mmm, file, true, function () {
					const json = require(path.join(__dirname, "..", "..", "..", "tests", "configs", "data", file));
					expect(Translator.translationsFallback[mmm.name]).toEqual(json);
					done();
				});
			};
		});

		it("should not load translations, if module fallback exists", function (done) {
			const dom = new JSDOM(`<script>var Log = {log: function(){}};</script><script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
			dom.window.onload = function () {
				const { Translator, XMLHttpRequest } = dom.window;
				const file = "TranslationTest.json";

				XMLHttpRequest.prototype.send = function () {
					throw "Shouldn't load files";
				};

				Translator.translationsFallback[mmm.name] = {
					Hello: "Hallo"
				};

				Translator.load(mmm, file, false, function () {
					expect(Translator.translations[mmm.name]).toBe(undefined);
					expect(Translator.translationsFallback[mmm.name]).toEqual({
						Hello: "Hallo"
					});
					done();
				});
			};
		});
	});

	describe("loadCoreTranslations", function () {
		it("should load core translations and fallback", function (done) {
			const dom = new JSDOM(
				`<script>var translations = {en: "http://localhost:3000/translations/en.json"}; var Log = {log: function(){}};</script>\
					<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`,
				{ runScripts: "dangerously", resources: "usable" }
			);
			dom.window.onload = function () {
				const { Translator } = dom.window;
				Translator.loadCoreTranslations("en");

				const en = require(path.join(__dirname, "..", "..", "..", "tests", "configs", "data", "en.json"));
				setTimeout(function () {
					expect(Translator.coreTranslations).toEqual(en);
					expect(Translator.coreTranslationsFallback).toEqual(en);
					done();
				}, 500);
			};
		});

		it("should load core fallback if language cannot be found", function (done) {
			const dom = new JSDOM(
				`<script>var translations = {en: "http://localhost:3000/translations/en.json"}; var Log = {log: function(){}};</script>\
					<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`,
				{ runScripts: "dangerously", resources: "usable" }
			);
			dom.window.onload = function () {
				const { Translator } = dom.window;
				Translator.loadCoreTranslations("MISSINGLANG");

				const en = require(path.join(__dirname, "..", "..", "..", "tests", "configs", "data", "en.json"));
				setTimeout(function () {
					expect(Translator.coreTranslations).toEqual({});
					expect(Translator.coreTranslationsFallback).toEqual(en);
					done();
				}, 500);
			};
		});
	});

	describe("loadCoreTranslationsFallback", function () {
		it("should load core translations fallback", function (done) {
			const dom = new JSDOM(
				`<script>var translations = {en: "http://localhost:3000/translations/en.json"}; var Log = {log: function(){}};</script>\
					<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`,
				{ runScripts: "dangerously", resources: "usable" }
			);
			dom.window.onload = function () {
				const { Translator } = dom.window;
				Translator.loadCoreTranslationsFallback();

				const en = require(path.join(__dirname, "..", "..", "..", "tests", "configs", "data", "en.json"));
				setTimeout(function () {
					expect(Translator.coreTranslationsFallback).toEqual(en);
					done();
				}, 500);
			};
		});

		it("should load core fallback if language cannot be found", function (done) {
			const dom = new JSDOM(
				`<script>var translations = {}; var Log = {log: function(){}};</script>\
					<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`,
				{ runScripts: "dangerously", resources: "usable" }
			);
			dom.window.onload = function () {
				const { Translator } = dom.window;
				Translator.loadCoreTranslations();

				setTimeout(function () {
					expect(Translator.coreTranslationsFallback).toEqual({});
					done();
				}, 500);
			};
		});
	});
});
