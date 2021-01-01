/* global translations */

/* Magic Mirror
 * Translator (l10n)
 *
 * By Christopher Fenner https://github.com/CFenner
 * MIT Licensed.
 */
var Translator = (function () {
	/**
	 * Load a JSON file via XHR.
	 *
	 * @param {string} file Path of the file we want to load.
	 * @param {Function} callback Function called when done.
	 */
	function loadJSON(file, callback) {
		var xhr = new XMLHttpRequest();
		xhr.overrideMimeType("application/json");
		xhr.open("GET", file, true);
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4 && xhr.status === 200) {
				// needs error handler try/catch at least
				let fileinfo = null;
				try {
					fileinfo = JSON.parse(xhr.responseText);
				} catch (exception) {
					// nothing here, but don't die
					Log.error(" loading json file =" + file + " failed");
				}
				callback(fileinfo);
			}
		};
		xhr.send(null);
	}

	return {
		coreTranslations: {},
		coreTranslationsFallback: {},
		translations: {},
		translationsFallback: {},

		/**
		 * Load a translation for a given key for a given module.
		 *
		 * @param {Module} module The module to load the translation for.
		 * @param {string} key The key of the text to translate.
		 * @param {object} variables The variables to use within the translation template (optional)
		 * @returns {string} the translated key
		 */
		translate: function (module, key, variables) {
			variables = variables || {}; //Empty object by default

			/**
			 * Combines template and variables like:
			 * template: "Please wait for {timeToWait} before continuing with {work}."
			 * variables: {timeToWait: "2 hours", work: "painting"}
			 * to: "Please wait for 2 hours before continuing with painting."
			 *
			 * @param {string} template Text with placeholder
			 * @param {object} variables Variables for the placeholder
			 * @returns {string} the template filled with the variables
			 */
			function createStringFromTemplate(template, variables) {
				if (Object.prototype.toString.call(template) !== "[object String]") {
					return template;
				}
				if (variables.fallback && !template.match(new RegExp("{.+}"))) {
					template = variables.fallback;
				}
				return template.replace(new RegExp("{([^}]+)}", "g"), function (_unused, varName) {
					return varName in variables ? variables[varName] : "{" + varName + "}";
				});
			}

			if (this.translations[module.name] && key in this.translations[module.name]) {
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

		/**
		 * Load a translation file (json) and remember the data.
		 *
		 * @param {Module} module The module to load the translation file for.
		 * @param {string} file Path of the file we want to load.
		 * @param {boolean} isFallback Flag to indicate fallback translations.
		 * @param {Function} callback Function called when done.
		 */
		load: function (module, file, isFallback, callback) {
			if (!isFallback) {
				Log.log(module.name + " - Load translation: " + file);
			} else {
				Log.log(module.name + " - Load translation fallback: " + file);
			}

			var self = this;
			if (!this.translationsFallback[module.name]) {
				loadJSON(module.file(file), function (json) {
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

		/**
		 * Load the core translations.
		 *
		 * @param {string} lang The language identifier of the core language.
		 */
		loadCoreTranslations: function (lang) {
			var self = this;

			if (lang in translations) {
				Log.log("Loading core translation file: " + translations[lang]);
				loadJSON(translations[lang], function (translations) {
					self.coreTranslations = translations;
				});
			} else {
				Log.log("Configured language not found in core translations.");
			}

			self.loadCoreTranslationsFallback();
		},

		/**
		 * Load the core translations fallback.
		 * The first language defined in translations.js will be used.
		 */
		loadCoreTranslationsFallback: function () {
			var self = this;

			// The variable `first` will contain the first
			// defined translation after the following line.
			for (var first in translations) {
				break;
			}

			if (first) {
				Log.log("Loading core translation fallback file: " + translations[first]);
				loadJSON(translations[first], function (translations) {
					self.coreTranslationsFallback = translations;
				});
			}
		}
	};
})();
