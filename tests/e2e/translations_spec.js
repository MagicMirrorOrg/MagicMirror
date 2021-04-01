const fs = require("fs");
const path = require("path");
const chai = require("chai");
const expect = chai.expect;
const mlog = require("mocha-logger");
const translations = require("../../translations/translations.js");
const helmet = require("helmet");
const { JSDOM } = require("jsdom");
const express = require("express");
const sinon = require("sinon");

describe("Translations", function () {
	let server;

	before(function () {
		const app = express();
		app.use(helmet());
		app.use(function (req, res, next) {
			res.header("Access-Control-Allow-Origin", "*");
			next();
		});
		app.use("/translations", express.static(path.join(__dirname, "..", "..", "translations")));

		server = app.listen(3000);
	});

	after(function () {
		server.close();
	});

	it("should have a translation file in the specified path", function () {
		for (let language in translations) {
			const file = fs.statSync(translations[language]);
			expect(file.isFile()).to.be.equal(true);
		}
	});

	describe("loadTranslations", () => {
		let dom;

		beforeEach(() => {
			dom = new JSDOM(
				`<script>var Translator = {}; var Log = {log: function(){}}; var config = {language: 'de'};</script>\
					<script src="file://${path.join(__dirname, "..", "..", "js", "class.js")}"></script>\
					<script src="file://${path.join(__dirname, "..", "..", "js", "module.js")}"></script>`,
				{ runScripts: "dangerously", resources: "usable" }
			);
		});

		it("should load translation file", (done) => {
			dom.window.onload = async function () {
				const { Translator, Module, config } = dom.window;
				config.language = "en";
				Translator.load = sinon.stub().callsFake((_m, _f, _fb, callback) => callback());

				Module.register("name", { getTranslations: () => translations });
				const MMM = Module.create("name");

				const loaded = sinon.stub();
				MMM.loadTranslations(loaded);

				expect(loaded.callCount).to.equal(1);
				expect(Translator.load.args.length).to.equal(1);
				expect(Translator.load.calledWith(MMM, "translations/en.json", false, sinon.match.func)).to.be.true;

				done();
			};
		});

		it("should load translation + fallback file", (done) => {
			dom.window.onload = async function () {
				const { Translator, Module } = dom.window;
				Translator.load = sinon.stub().callsFake((_m, _f, _fb, callback) => callback());

				Module.register("name", { getTranslations: () => translations });
				const MMM = Module.create("name");

				const loaded = sinon.stub();
				MMM.loadTranslations(loaded);

				expect(loaded.callCount).to.equal(1);
				expect(Translator.load.args.length).to.equal(2);
				expect(Translator.load.calledWith(MMM, "translations/de.json", false, sinon.match.func)).to.be.true;
				expect(Translator.load.calledWith(MMM, "translations/en.json", true, sinon.match.func)).to.be.true;

				done();
			};
		});

		it("should load translation fallback file", (done) => {
			dom.window.onload = async function () {
				const { Translator, Module, config } = dom.window;
				config.language = "--";
				Translator.load = sinon.stub().callsFake((_m, _f, _fb, callback) => callback());

				Module.register("name", { getTranslations: () => translations });
				const MMM = Module.create("name");

				const loaded = sinon.stub();
				MMM.loadTranslations(loaded);

				expect(loaded.callCount).to.equal(1);
				expect(Translator.load.args.length).to.equal(1);
				expect(Translator.load.calledWith(MMM, "translations/en.json", true, sinon.match.func)).to.be.true;

				done();
			};
		});

		it("should load no file", (done) => {
			dom.window.onload = async function () {
				const { Translator, Module } = dom.window;
				Translator.load = sinon.stub();

				Module.register("name", {});
				const MMM = Module.create("name");

				const loaded = sinon.stub();
				MMM.loadTranslations(loaded);

				expect(loaded.callCount).to.equal(1);
				expect(Translator.load.callCount).to.equal(0);

				done();
			};
		});
	});

	const mmm = {
		name: "TranslationTest",
		file(file) {
			return `http://localhost:3000/${file}`;
		}
	};

	describe("Parsing language files through the Translator class", function () {
		for (let language in translations) {
			it(`should parse ${language}`, function (done) {
				const dom = new JSDOM(
					`<script>var translations = ${JSON.stringify(translations)}; var Log = {log: function(){}};</script>\
					<script src="file://${path.join(__dirname, "..", "..", "js", "translator.js")}">`,
					{ runScripts: "dangerously", resources: "usable" }
				);
				dom.window.onload = function () {
					const { Translator } = dom.window;

					Translator.load(mmm, translations[language], false, function () {
						expect(Translator.translations[mmm.name]).to.be.an("object");
						expect(Object.keys(Translator.translations[mmm.name]).length).to.be.at.least(1);
						done();
					});
				};
			});
		}
	});

	describe("Same keys", function () {
		let base;

		before(function (done) {
			const dom = new JSDOM(
				`<script>var translations = ${JSON.stringify(translations)}; var Log = {log: function(){}};</script>\
					<script src="file://${path.join(__dirname, "..", "..", "js", "translator.js")}">`,
				{ runScripts: "dangerously", resources: "usable" }
			);
			dom.window.onload = function () {
				const { Translator } = dom.window;

				Translator.load(mmm, translations.en, false, function () {
					base = Object.keys(Translator.translations[mmm.name]).sort();
					done();
				});
			};
		});

		for (let language in translations) {
			if (language === "en") {
				continue;
			}

			describe(`Translation keys of ${language}`, function () {
				let keys;

				before(function (done) {
					const dom = new JSDOM(
						`<script>var translations = ${JSON.stringify(translations)}; var Log = {log: function(){}};</script>\
					<script src="file://${path.join(__dirname, "..", "..", "js", "translator.js")}">`,
						{ runScripts: "dangerously", resources: "usable" }
					);
					dom.window.onload = function () {
						const { Translator } = dom.window;

						Translator.load(mmm, translations[language], false, function () {
							keys = Object.keys(Translator.translations[mmm.name]).sort();
							done();
						});
					};
				});

				it(`${language} keys should be in base`, function () {
					keys.forEach(function (key) {
						expect(base.indexOf(key)).to.be.at.least(0);
					});
				});

				it(`${language} should contain all base keys`, function () {
					// TODO: when all translations are fixed, use
					// expect(keys).to.deep.equal(base);
					// instead of the try-catch-block

					try {
						expect(keys).to.deep.equal(base);
					} catch (e) {
						if (e instanceof chai.AssertionError) {
							const diff = base.filter((key) => !keys.includes(key));
							mlog.pending(`Missing Translations for language ${language}: ${diff}`);
							this.skip();
						} else {
							throw e;
						}
					}
				});
			});
		}
	});
});
