/* global translations */

const Translator = (function () {

	/**
	 * Load a JSON file via XHR.
	 * @param {string} file Path of the file we want to load.
	 * @returns {Promise<object>} the translations in the specified file
	 */
	async function loadJSON (file) {
		const xhr = new XMLHttpRequest();
		return new Promise(function (resolve) {
			xhr.overrideMimeType("application/json");
			xhr.open("GET", file, true);
			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4 && xhr.status === 200) {
					// needs error handler try/catch at least
					let fileInfo = null;
					try {
						fileInfo = JSON.parse(xhr.responseText);
					} catch (exception) {
						// nothing here, but don't die
						Log.error(` loading json file =${file} failed`);
					}
					resolve(fileInfo);
				}
			};
			xhr.send(null);
		});
	}

	return {
		coreTranslations: {},
		coreTranslationsFallback: {},
		translations: {},
		translationsFallback: {},

		/**
		 * Load a translation for a given key for a given module.
		 * @param {Module} module The module to load the translation for.
		 * @param {string} key The key of the text to translate.
		 * @param {object} variables The variables to use within the translation template (optional)
		 * @returns {string} the translated key
		 */
		translate (module, key, variables = {}) {

			/**
			 * Combines template and variables like:
			 * template: "Please wait for {timeToWait} before continuing with {work}."
			 * variables: {timeToWait: "2 hours", work: "painting"}
			 * to: "Please wait for 2 hours before continuing with painting."
			 * @param {string} template Text with placeholder
			 * @param {object} variables Variables for the placeholder
			 * @returns {string} the template filled with the variables
			 */
			function createStringFromTemplate (template, variables) {
				if (Object.prototype.toString.call(template) !== "[object String]") {
					return template;
				}
				let templateToUse = template;
				if (variables.fallback && !template.match(new RegExp("{.+}"))) {
					templateToUse = variables.fallback;
				}
				return templateToUse.replace(new RegExp("{([^}]+)}", "g"), function (_unused, varName) {
					return varName in variables ? variables[varName] : `{${varName}}`;
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
		 * @param {Module} module The module to load the translation file for.
		 * @param {string} file Path of the file we want to load.
		 * @param {boolean} isFallback Flag to indicate fallback translations.
		 */
		async load (module, file, isFallback) {
			Log.log(`${module.name} - Load translation${isFallback ? " fallback" : ""}: ${file}`);

			if (this.translationsFallback[module.name]) {
				return;
			}

			const json = await loadJSON(module.file(file));
			const property = isFallback ? "translationsFallback" : "translations";
			this[property][module.name] = json;
		},

		/**
		 * Load the core translations.
		 * @param {string} lang The language identifier of the core language.
		 */
		async loadCoreTranslations (lang) {
			if (lang in translations) {
				Log.log(`Loading core translation file: ${translations[lang]}`);
				this.coreTranslations = await loadJSON(translations[lang]);
			} else {
				Log.log("Configured language not found in core translations.");
			}

			await this.loadCoreTranslationsFallback();
		},

		/**
		 * Load the core translations' fallback.
		 * The first language defined in translations.js will be used.
		 */
		async loadCoreTranslationsFallback () {
			let first = Object.keys(translations)[0];
			if (first) {
				Log.log(`Loading core translation fallback file: ${translations[first]}`);
				this.coreTranslationsFallback = await loadJSON(translations[first]);
			}
		}
	};
}());

window.Translator = Translator;
