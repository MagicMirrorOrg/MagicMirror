var chai = require("chai");
var expect = chai.expect;
var path = require("path");
var {JSDOM} = require("jsdom");

var translations = {
	"MMM-Module": {
		"Hello": "Hallo",
		"Hello {username}": "Hallo {username}"
	}
};

var coreTranslations = {
	"Hello": "XXX",
	"Hello {username}": "XXX",
	"FOO": "Foo",
	"BAR {something}": "Bar {something}"
};

var translationsFallback = {
	"MMM-Module": {
		"Hello": "XXX",
		"Hello {username}": "XXX",
		"FOO": "XXX",
		"BAR {something}": "XXX",
		"A key": "A translation"
	}
};

var coreTranslationsFallback = {
	"FOO": "XXX",
	"BAR {something}": "XXX",
	"Hello": "XXX",
	"Hello {username}": "XXX",
	"A key": "XXX",
	"Fallback": "core fallback"
};

function setTranslations(Translator) {
	Translator.translations = translations;
	Translator.coreTranslations = coreTranslations;
	Translator.translationsFallback = translationsFallback;
	Translator.coreTranslationsFallback = coreTranslationsFallback;
}

describe("Translator", function() {
	describe("translate", function() {
		it("should return custom module translation", function(done) {
			var dom = new JSDOM(`<script src="${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously",
				resources: "usable" });
			dom.window.onload = function() {
				var {Translator} = dom.window;
				setTranslations(Translator);
				var translation = Translator.translate({name: "MMM-Module"}, "Hello");
				expect(translation).to.be.equal("Hallo");
				translation = Translator.translate({name: "MMM-Module"}, "Hello {username}", {username: "fewieden"});
				expect(translation).to.be.equal("Hallo fewieden");
				done();
			};
		});

		it("should return core translation", function(done) {
			var dom = new JSDOM(`<script src="${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously",
				resources: "usable" });
			dom.window.onload = function() {
				var {Translator} = dom.window;
				setTranslations(Translator);
				var translation = Translator.translate({name: "MMM-Module"}, "FOO");
				expect(translation).to.be.equal("Foo");
				translation = Translator.translate({name: "MMM-Module"}, "BAR {something}", {something: "Lorem Ipsum"});
				expect(translation).to.be.equal("Bar Lorem Ipsum");
				done();
			};
		});

		it("should return custom module translation fallback", function(done) {
			var dom = new JSDOM(`<script src="${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously",
				resources: "usable" });
			dom.window.onload = function() {
				var {Translator} = dom.window;
				setTranslations(Translator);
				var translation = Translator.translate({name: "MMM-Module"}, "A key");
				expect(translation).to.be.equal("A translation");
				done();
			};
		});

		it("should return core translation fallback", function(done) {
			var dom = new JSDOM(`<script src="${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously",
				resources: "usable" });
			dom.window.onload = function() {
				var {Translator} = dom.window;
				setTranslations(Translator);
				var translation = Translator.translate({name: "MMM-Module"}, "Fallback");
				expect(translation).to.be.equal("core fallback");
				done();
			};
		});

		it("should return translation with placeholder for missing variables", function(done) {
			var dom = new JSDOM(`<script src="${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously",
				resources: "usable" });
			dom.window.onload = function() {
				var {Translator} = dom.window;
				setTranslations(Translator);
				var translation = Translator.translate({name: "MMM-Module"}, "Hello {username}");
				expect(translation).to.be.equal("Hallo {username}");
				done();
			};
		});

		it("should return key if no translation was found", function(done) {
			var dom = new JSDOM(`<script src="${path.join(__dirname, "..", "..", "..", "js", "translator.js")}">`, { runScripts: "dangerously",
				resources: "usable" });
			dom.window.onload = function() {
				var {Translator} = dom.window;
				setTranslations(Translator);
				var translation = Translator.translate({name: "MMM-Module"}, "MISSING");
				expect(translation).to.be.equal("MISSING");
				done();
			};
		});
	});
});

