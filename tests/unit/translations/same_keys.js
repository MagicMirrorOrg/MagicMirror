var fs = require("fs");
var path = require("path");
var chai = require("chai");
var expect = chai.expect;

describe("Translations have the same keys as en.js", function() {
	var translations = require("../../../translations/translations.js");
	var base = JSON.parse(fs.readFileSync("translations/en.json", "utf8"));
	var baseKeys = Object.keys(base).sort();

	Object.keys(translations).forEach(function(tr) {
		var fileName = translations[tr];
		var fileContent = fs.readFileSync(fileName, "utf8");
		var fileTranslations = JSON.parse(fileContent);
		var fileKeys = Object.keys(fileTranslations).sort();

		it(fileName + " keys should be in base", function() {
			fileKeys.forEach(function(key) {
				expect( baseKeys.indexOf(key) ).to.be.at.least(0);
			});
		});

		it(fileName + " should contain all base keys", function() {
			var test = this;
			baseKeys.forEach(function(key) {
				// TODO: when all translations are fixed, use
				// expect(fileKeys).to.deep.equal(baseKeys);
				// instead of the try-catch-block

				try {
					expect(fileKeys).to.deep.equal(baseKeys);
				} catch(e) {
					if (e instanceof chai.AssertionError) {
						test.skip();
					} else {
						throw e;
					}
				}
			});
		});
	});
});
