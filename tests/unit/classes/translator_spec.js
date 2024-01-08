const path = require("node:path");
const helmet = require("helmet");
const { JSDOM } = require("jsdom");
const express = require("express");

const sockets = new Set();

describe("Translator", () => {
	let server;

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

		it("should return custom module translation", () => {
			return new Promise((done) => {
				const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
				dom.window.onload = () => {
					const { Translator } = dom.window;
					setTranslations(Translator);
					let translation = Translator.translate({ name: "MMM-Module" }, "Hello");
					expect(translation).toBe("Hallo");
					translation = Translator.translate({ name: "MMM-Module" }, "Hello {username}", { username: "fewieden" });
					expect(translation).toBe("Hallo fewieden");
					done();
				};
			});
		});

		it("should return core translation", () => {
			return new Promise((done) => {
				const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
				dom.window.onload = () => {
					const { Translator } = dom.window;
					setTranslations(Translator);
					let translation = Translator.translate({ name: "MMM-Module" }, "FOO");
					expect(translation).toBe("Foo");
					translation = Translator.translate({ name: "MMM-Module" }, "BAR {something}", { something: "Lorem Ipsum" });
					expect(translation).toBe("Bar Lorem Ipsum");
					done();
				};
			});
		});

		it("should return custom module translation fallback", () => {
			return new Promise((done) => {
				const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
				dom.window.onload = () => {
					const { Translator } = dom.window;
					setTranslations(Translator);
					const translation = Translator.translate({ name: "MMM-Module" }, "A key");
					expect(translation).toBe("A translation");
					done();
				};
			});
		});

		it("should return core translation fallback", () => {
			return new Promise((done) => {
				const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
				dom.window.onload = () => {
					const { Translator } = dom.window;
					setTranslations(Translator);
					const translation = Translator.translate({ name: "MMM-Module" }, "Fallback");
					expect(translation).toBe("core fallback");
					done();
				};
			});
		});

		it("should return translation with placeholder for missing variables", () => {
			return new Promise((done) => {
				const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
				dom.window.onload = () => {
					const { Translator } = dom.window;
					setTranslations(Translator);
					const translation = Translator.translate({ name: "MMM-Module" }, "Hello {username}");
					expect(translation).toBe("Hallo {username}");
					done();
				};
			});
		});

		it("should return key if no translation was found", () => {
			return new Promise((done) => {
				const dom = new JSDOM(`<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
				dom.window.onload = () => {
					const { Translator } = dom.window;
					setTranslations(Translator);
					const translation = Translator.translate({ name: "MMM-Module" }, "MISSING");
					expect(translation).toBe("MISSING");
					done();
				};
			});
		});
	});

	describe("load", () => {
		const mmm = {
			name: "TranslationTest",
			file (file) {
				return `http://localhost:3000/translations/${file}`;
			}
		};

		it("should load translations", () => {
			return new Promise((done) => {
				const dom = new JSDOM(`<script>var Log = {log: () => {}};</script><script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
				dom.window.onload = async () => {
					const { Translator } = dom.window;
					const file = "translation_test.json";

					await Translator.load(mmm, file, false);
					const json = require(path.join(__dirname, "..", "..", "..", "tests", "mocks", file));
					expect(Translator.translations[mmm.name]).toEqual(json);
					done();
				};
			});
		});

		it("should load translation fallbacks", () => {
			return new Promise((done) => {
				const dom = new JSDOM(`<script>var Log = {log: () => {}};</script><script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
				dom.window.onload = async () => {
					const { Translator } = dom.window;
					const file = "translation_test.json";

					await Translator.load(mmm, file, true);
					const json = require(path.join(__dirname, "..", "..", "..", "tests", "mocks", file));
					expect(Translator.translationsFallback[mmm.name]).toEqual(json);
					done();
				};
			});
		});

		it("should not load translations, if module fallback exists", () => {
			return new Promise((done) => {
				const dom = new JSDOM(`<script>var Log = {log: () => {}};</script><script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously", resources: "usable" });
				dom.window.onload = async () => {
					const { Translator, XMLHttpRequest } = dom.window;
					const file = "translation_test.json";

					XMLHttpRequest.prototype.send = () => {
						throw new Error("Shouldn't load files");
					};

					Translator.translationsFallback[mmm.name] = {
						Hello: "Hallo"
					};

					await Translator.load(mmm, file, false);
					expect(Translator.translations[mmm.name]).toBeUndefined();
					expect(Translator.translationsFallback[mmm.name]).toEqual({
						Hello: "Hallo"
					});
					done();
				};
			});
		});
	});

	describe("loadCoreTranslations", () => {
		it("should load core translations and fallback", () => {
			return new Promise((done) => {
				const dom = new JSDOM(
					`<script>var translations = {en: "http://localhost:3000/translations/translation_test.json"}; var Log = {log: () => {}};</script>\
					<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`,
					{ runScripts: "dangerously", resources: "usable" }
				);
				dom.window.onload = async () => {
					const { Translator } = dom.window;
					await Translator.loadCoreTranslations("en");

					const en = require(path.join(__dirname, "..", "..", "..", "tests", "mocks", "translation_test.json"));
					setTimeout(() => {
						expect(Translator.coreTranslations).toEqual(en);
						expect(Translator.coreTranslationsFallback).toEqual(en);
						done();
					}, 500);
				};
			});
		});

		it("should load core fallback if language cannot be found", () => {
			return new Promise((done) => {
				const dom = new JSDOM(
					`<script>var translations = {en: "http://localhost:3000/translations/translation_test.json"}; var Log = {log: () => {}};</script>\
					<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`,
					{ runScripts: "dangerously", resources: "usable" }
				);
				dom.window.onload = async () => {
					const { Translator } = dom.window;
					await Translator.loadCoreTranslations("MISSINGLANG");

					const en = require(path.join(__dirname, "..", "..", "..", "tests", "mocks", "translation_test.json"));
					setTimeout(() => {
						expect(Translator.coreTranslations).toEqual({});
						expect(Translator.coreTranslationsFallback).toEqual(en);
						done();
					}, 500);
				};
			});
		});
	});

	describe("loadCoreTranslationsFallback", () => {
		it("should load core translations fallback", () => {
			return new Promise((done) => {
				const dom = new JSDOM(
					`<script>var translations = {en: "http://localhost:3000/translations/translation_test.json"}; var Log = {log: () => {}};</script>\
					<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`,
					{ runScripts: "dangerously", resources: "usable" }
				);
				dom.window.onload = async () => {
					const { Translator } = dom.window;
					await Translator.loadCoreTranslationsFallback();

					const en = require(path.join(__dirname, "..", "..", "..", "tests", "mocks", "translation_test.json"));
					setTimeout(() => {
						expect(Translator.coreTranslationsFallback).toEqual(en);
						done();
					}, 500);
				};
			});
		});

		it("should load core fallback if language cannot be found", () => {
			return new Promise((done) => {
				const dom = new JSDOM(
					`<script>var translations = {}; var Log = {log: () => {}};</script>\
					<script src="file://${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`,
					{ runScripts: "dangerously", resources: "usable" }
				);
				dom.window.onload = async () => {
					const { Translator } = dom.window;
					await Translator.loadCoreTranslations();

					setTimeout(() => {
						expect(Translator.coreTranslationsFallback).toEqual({});
						done();
					}, 500);
				};
			});
		});
	});
});
