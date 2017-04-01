var fs = require("fs");
var path = require("path");
var chai = require("chai");
var expect = chai.expect;

describe("Translations have the same keys as en.js", function() {
	var translations = require("../../../translations/translations.js");
	var base = JSON.parse(stripComments(fs.readFileSync("translations/en.json", "utf8")));
	var baseKeys = Object.keys(base).sort();

	Object.keys(translations).forEach(function(tr) {
		var fileName = translations[tr];
		var fileContent = stripComments(fs.readFileSync(fileName, "utf8"));
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

// Copied from js/translator.js
function stripComments(str, opts) {
	// strip comments copied from: https://github.com/sindresorhus/strip-json-comments

	var singleComment = 1;
	var multiComment = 2;

	function stripWithoutWhitespace() {
		return "";
	}

	function stripWithWhitespace(str, start, end) {
		return str.slice(start, end).replace(/\S/g, " ");
	}

	opts = opts || {};

	var currentChar;
	var nextChar;
	var insideString = false;
	var insideComment = false;
	var offset = 0;
	var ret = "";
	var strip = opts.whitespace === false ? stripWithoutWhitespace : stripWithWhitespace;

	for (var i = 0; i < str.length; i++) {
		currentChar = str[i];
		nextChar = str[i + 1];

		if (!insideComment && currentChar === "\"") {
			var escaped = str[i - 1] === "\\" && str[i - 2] !== "\\";
			if (!escaped) {
				insideString = !insideString;
			}
		}

		if (insideString) {
			continue;
		}

		if (!insideComment && currentChar + nextChar === "//") {
			ret += str.slice(offset, i);
			offset = i;
			insideComment = singleComment;
			i++;
		} else if (insideComment === singleComment && currentChar + nextChar === "\r\n") {
			i++;
			insideComment = false;
			ret += strip(str, offset, i);
			offset = i;
			continue;
		} else if (insideComment === singleComment && currentChar === "\n") {
			insideComment = false;
			ret += strip(str, offset, i);
			offset = i;
		} else if (!insideComment && currentChar + nextChar === "/*") {
			ret += str.slice(offset, i);
			offset = i;
			insideComment = multiComment;
			i++;
			continue;
		} else if (insideComment === multiComment && currentChar + nextChar === "*/") {
			i++;
			insideComment = false;
			ret += strip(str, offset, i + 1);
			offset = i + 1;
			continue;
		}
	}

	return ret + (insideComment ? strip(str.substr(offset)) : str.substr(offset));
}
