/* exported Translator */
/* Magic Mirror
 * Translator (l10n)
 *
 * By Christopher Fenner http://github.com/CFenner
 * MIT Licensed.
 */
var Translator = (function() {

	/* loadJSON(file, callback)
	 * Load a JSON file via XHR.
	 *
	 * argument file string - Path of the file we want to load.
	 * argument callback function - Function called when done.
	 */
	function loadJSON(file, callback) {
		var xhr = new XMLHttpRequest();
		xhr.overrideMimeType("application/json");
		xhr.open("GET", file, true);
		xhr.onreadystatechange = function () {
			if (xhr.readyState == 4 && xhr.status == "200") {
				callback(JSON.parse(stripComments(xhr.responseText)));
			}
		};
		xhr.send(null);
	}

	/* loadJSON(str, options)
	 * Remove any commenting from a json file so it can be parsed.
	 *
	 * argument str string - The string that contains json with comments.
	 * argument opts function - Strip options.
	 *
	 * return the stripped string.
	 */
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

	return {
		coreTranslations: {},
		coreTranslationsFallback: {},
		translations: {},
		translationsFallback: {},

		/* translate(module, key, variables)
		 * Load a translation for a given key for a given module.
		 *
		 * argument module Module - The module to load the translation for.
		 * argument key string - The key of the text to translate.
		 * argument variables - The variables to use within the translation template (optional)
		 */
		translate: function(module, key, variables) {
			variables = variables || {}; //Empty object by default

			// Combines template and variables like:
			// template: "Please wait for {timeToWait} before continuing with {work}."
			// variables: {timeToWait: "2 hours", work: "painting"}
			// to: "Please wait for 2 hours before continuing with painting."
			function createStringFromTemplate(template, variables) {
				if(Object.prototype.toString.call(template) !== "[object String]") {
					return template;
				}
				if(variables.fallback && !template.match(new RegExp("\{.+\}"))) {
					template = variables.fallback;
				}
				return template.replace(new RegExp("\{([^\}]+)\}", "g"), function(_unused, varName){
					return variables[varName] || "{"+varName+"}";
				});
			}

			if(this.translations[module.name] && key in this.translations[module.name]) {
				// Log.log("Got translation for " + key + " from module translation: ");
				return createStringFromTemplate(this.translations[module.name][key], variables);
			}

			if (key in this.coreTranslations) {
				// Log.log("Got translation for " + key + " from core translation.");
				return createStringFromTemplate(this.coreTranslations[key], variables);
			}

			if (this.translationsFallback[module.name] && key in this.translationsFallback[module.name]) {
				// Log.log("Got translation for " + key + " from module translation fallback.");
				return createStringFromTemplate(this.translationsFallback[module.name][key], variables);
			}

			if (key in this.coreTranslationsFallback) {
				// Log.log("Got translation for " + key + " from core translation fallback.");
				return createStringFromTemplate(this.coreTranslationsFallback[key], variables);
			}

			return key;
		},
		/* load(module, file, isFallback, callback)
		 * Load a translation file (json) and remember the data.
		 *
		 * argument module Module - The module to load the translation file for.
		 * argument file string - Path of the file we want to load.
		 * argument isFallback boolean - Flag to indicate fallback translations.
		 * argument callback function - Function called when done.
		 */
		load: function(module, file, isFallback, callback) {
			if (!isFallback) {
				Log.log(module.name + " - Load translation: " + file);
			} else {
				Log.log(module.name + " - Load translation fallback: " + file);
			}

			var self = this;
			if(!this.translationsFallback[module.name]) {
				loadJSON(module.file(file), function(json) {
					if (!isFallback) {
						self.translations[module.name] = json;
					} else {
						self.translationsFallback[module.name] = json;
					}
					callback();
				});
			} else {
				callback();
			}
		},

		/* loadCoreTranslations(lang)
		 * Load the core translations.
		 *
		 * argument lang String - The language identifier of the core language.
		 */
		loadCoreTranslations: function(lang) {
			var self = this;

			if (lang in translations) {
				Log.log("Loading core translation file: " + translations[lang]);
				loadJSON(translations[lang], function(translations) {
					self.coreTranslations = translations;
				});
			} else {
				Log.log("Configured language not found in core translations.");
			}

			self.loadCoreTranslationsFallback();
		},

		/* loadCoreTranslationsFallback()
		 * Load the core translations fallback.
		 * The first language defined in translations.js will be used.
		 */
		loadCoreTranslationsFallback: function() {
			var self = this;

			// The variable `first` will contain the first
			// defined translation after the following line.
			for (var first in translations) {break;}

			if (first) {
				Log.log("Loading core translation fallback file: " + translations[first]);
				loadJSON(translations[first], function(translations) {
					self.coreTranslationsFallback = translations;
				});
			}
		},
	};
})();
