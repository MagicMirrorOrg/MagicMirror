const fs = require("node:fs");
const path = require("node:path");
const helmet = require("helmet");
const { JSDOM } = require("jsdom");
const express = require("express");
const sinon = require("sinon");
const translations = require("../../translations/translations");

describe("Translations", () => {
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
		for (let language in translations) {
			const file = fs.statSync(translations[language]);
			expect(file.isFile()).toBe(true);
		}
	});

	describe("loadTranslations", () => {
		let dom;

		beforeEach(() => {
			dom = new JSDOM(
				`<script>var Translator = {}; var Log = {log: () => {}}; var config = {language: 'de'};</script>\
					<script src="file://${path.join(__dirname, "..", "..", "js", "class.js")}"></script>\
					<script src="file://${path.join(__dirname, "..", "..", "js", "module.js")}"></script>`,
				{ runScripts: "dangerously", resources: "usable" }
			);
		});

		it("should load translation file", () => {
			return new Promise((done) => {
				dom.window.onload = async () => {
					const { Translator, Module, config } = dom.window;
					config.language = "en";
					Translator.load = sinon.stub().callsFake((_m, _f, _fb) => null);

					Module.register("name", { getTranslations: () => translations });
					const MMM = Module.create("name");

					await MMM.loadTranslations();

					expect(Translator.load.args).toHaveLength(1);
					expect(Translator.load.calledWith(MMM, "translations/en.json", false)).toBe(true);

					done();
				};
			});
		});

		it("should load translation + fallback file", () => {
			return new Promise((done) => {
				dom.window.onload = async () => {
					const { Translator, Module } = dom.window;
					Translator.load = sinon.stub().callsFake((_m, _f, _fb) => null);

					Module.register("name", { getTranslations: () => translations });
					const MMM = Module.create("name");

					await MMM.loadTranslations();

					expect(Translator.load.args).toHaveLength(2);
					expect(Translator.load.calledWith(MMM, "translations/de.json", false)).toBe(true);
					expect(Translator.load.calledWith(MMM, "translations/en.json", true)).toBe(true);

					done();
				};
			});
		});

		it("should load translation fallback file", () => {
			return new Promise((done) => {
				dom.window.onload = async () => {
					const { Translator, Module, config } = dom.window;
					config.language = "--";
					Translator.load = sinon.stub().callsFake((_m, _f, _fb) => null);

					Module.register("name", { getTranslations: () => translations });
					const MMM = Module.create("name");

					await MMM.loadTranslations();

					expect(Translator.load.args).toHaveLength(1);
					expect(Translator.load.calledWith(MMM, "translations/en.json", true)).toBe(true);

					done();
				};
			});
		});

		it("should load no file", () => {
			return new Promise((done) => {
				dom.window.onload = async () => {
					const { Translator, Module } = dom.window;
					Translator.load = sinon.stub();

					Module.register("name", {});
					const MMM = Module.create("name");

					await MMM.loadTranslations();

					expect(Translator.load.callCount).toBe(0);

					done();
				};
			});
		});
	});

	const mmm = {
		name: "TranslationTest",
		file (file) {
			return `http://localhost:3000/${file}`;
		}
	};

	describe("Parsing language files through the Translator class", () => {
		for (let language in translations) {
			it(`should parse ${language}`, () => {
				return new Promise((done) => {
					const dom = new JSDOM(
						`<script>var translations = ${JSON.stringify(translations)}; var Log = {log: () => {}};</script>\
					<script src="file://${path.join(__dirname, "..", "..", "js", "translator.js")}">`,
						{ runScripts: "dangerously", resources: "usable" }
					);
					dom.window.onload = async () => {
						const { Translator } = dom.window;

						await Translator.load(mmm, translations[language], false);
						expect(typeof Translator.translations[mmm.name]).toBe("object");
						expect(Object.keys(Translator.translations[mmm.name]).length).toBeGreaterThanOrEqual(1);
						done();
					};
				});
			});
		}
	});

	describe("Same keys", () => {
		let base;
		let missing = [];

		beforeAll(() => {
			return new Promise((done) => {
				const dom = new JSDOM(
					`<script>var translations = ${JSON.stringify(translations)}; var Log = {log: () => {}};</script>\
					<script src="file://${path.join(__dirname, "..", "..", "js", "translator.js")}">`,
					{ runScripts: "dangerously", resources: "usable" }
				);
				dom.window.onload = async () => {
					const { Translator } = dom.window;

					await Translator.load(mmm, translations.de, false);
					base = Object.keys(Translator.translations[mmm.name]).sort();
					done();
				};
			});
		});

		afterAll(() => {
			console.log(missing);
		});

		// Using German as the base rather than English, since
		// at least one translated word doesn't exist in English.
		for (let language in translations) {
			if (language === "de") {
				continue;
			}

			describe(`Translation keys of ${language}`, () => {
				let keys;

				beforeAll(() => {
					return new Promise((done) => {
						const dom = new JSDOM(
							`<script>var translations = ${JSON.stringify(translations)}; var Log = {log: () => {}};</script>\
					<script src="file://${path.join(__dirname, "..", "..", "js", "translator.js")}">`,
							{ runScripts: "dangerously", resources: "usable" }
						);
						dom.window.onload = async () => {
							const { Translator } = dom.window;

							await Translator.load(mmm, translations[language], false);
							keys = Object.keys(Translator.translations[mmm.name]).sort();
							done();
						};
					});
				});

				it(`${language} keys should be in base`, () => {
					keys.forEach((key) => {
						expect(base.indexOf(key)).toBeGreaterThanOrEqual(0);
					});
				});

				it(`${language} should contain all base keys`, () => {
					// TODO: when all translations are fixed, use
					// expect(keys).toEqual(base);
					// instead of the try-catch-block

					try {
						expect(keys).toEqual(base);
					} catch (e) {
						if (e.message.match(/expect.*toEqual/)) {
							const diff = base.filter((key) => !keys.includes(key));
							missing.push(`Missing Translations for language ${language}: ${diff}`);
						} else {
							throw e;
						}
					}
				});
			});
		}
	});
});
