/* global translations */

/* MagicMirror²
 * Translator (l10n)
 *
 * By Christopher Fenner https://github.com/CFenner
 * MIT Licensed.
 */
const Translator = (function () {
	/**
	 * Load a JSON file via XHR.
	 *
	 * @param {string} file Path of the file we want to load.
	 * @param {Function} callback Function called when done.
	 */
	function loadJSON(file, callback) {
		const xhr = new XMLHttpRequest();
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
		load(module, file, isFallback, callback) {
			Log.log(`${module.name} - Load translation${isFallback ? " fallback" : ""}: ${file}`);

			if (this.translationsFallback[module.name]) {
				callback();
				return;
			}

			loadJSON(module.file(file), (json) => {
				const property = isFallback ? "translationsFallback" : "translations";
				this[property][module.name] = json;
				callback();
			});
		},

		/**
		 * Load the core translations.
		 *
		 * @param {string} lang The language identifier of the core language.
		 */
		loadCoreTranslations: function (lang) {
			if (lang in translations) {
				Log.log("Loading core translation file: " + translations[lang]);
				loadJSON(translations[lang], (translations) => {
					this.coreTranslations = translations;
				});
			} else {
				Log.log("Configured language not found in core translations.");
			}

			this.loadCoreTranslationsFallback();
		},

		/**
		 * Load the core translations fallback.
		 * The first language defined in translations.js will be used.
		 */
		loadCoreTranslationsFallback: function () {
			let first = Object.keys(translations)[0];
			if (first) {
				Log.log("Loading core translation fallback file: " + translations[first]);
				loadJSON(translations[first], (translations) => {
					this.coreTranslationsFallback = translations;
				});
			}
		}
	};
})();

window.Translator = Translator;
