/* global translations */

/* Magic Mirror
 * Translator (l10n)
 *
 * Rewritten by Seongnoh Sean Yi <eouia0819@gmail.com>
 *
 * MIT Licensed.
 */

const Translator = (function () {
	/** @constant {string} languageCode BCP-47 format preferred. 'en' is default languageCode. */
	const DEFAULT_LANGUAGE = "en";
	/** @constant {string} localeCode BCP-47 format preferred. 'default'(system locale in many case) is default locale.*/
	const DEFAULT_LOCALE = "default";
	/** @constant {string} moduleIdentifier 'core' modules needs to be distinguished. */
	const DEFAULT_CORE_MODULES = "core";

	var _translations = {};
	var _languages = [];
	var _formatters = {};
	var _locale = DEFAULT_LOCALE;
	var _isInitialized = false;

	/**
	 * Convert and return `Date` object from date-like something.
	 *
	 * @private
	 * @param {*} dateLike - Date object or date like string.
	 * @returns {Date} - Converted Date Object.
	 */
	function toDate(dateLike) {
		if (dateLike instanceof Date && !isNaN(dateLike)) return dateLike;
		var date = new Date(dateLike);
		if (isNaN(date)) return dateLike;
		return date;
	}

	/**
	 * Load a JSON file via fetch.
	 *
	 * @param {string} file Path of the file we want to load.
	 * @returns {Promise<JSON|false>} `JSON object` of translation dictionary will be resolved on success. ('false` on fails)
	 */
	async function loadJSON(file) {
		return await fetch(file)
			.then((response) => {
				if (!response.ok) throw Error(response.statusText);
				return response;
			})
			.then(async (response) => {
				return await response.json();
			})
			.catch((err) => {
				Log.info(file, "-", err.toString());
				return false;
			});
	}

	/**
	 * Initialize Translator
	 *
	 * @public
	 * @param {object} options - language, languages, locale value (usually from config)
	 * @param {string} options.language - Usually Config.language for backward compatibility
	 * @param {Array.<string>} options.languages - Array of prefer languages by order. Usually Config.languages
	 * @param {string} options.locale - localeCode(BCP-47) to use in the Translator.
	 * @returns {Promise<boolean>} - return _isInitialized
	 */
	async function init({ languages, language, locale } = {}) {
		if (_isInitialized) {
			Log.warn("Translator was already initialized.");
			return false;
		}
		var candidates = [];
		if (language) candidates.push(language);
		if (languages) {
			var sl = [];
			if (typeof languages === "string") {
				sl = languages.replaceAll(",", "").split(" ");
			}
			if (Array.isArray(languages)) sl = languages;
			for (let l of sl) {
				if (!candidates.includes(l)) candidates.push(l);
			}
		}
		_languages = [...candidates];
		if (!_languages.includes(DEFAULT_LANGUAGE)) _languages.push(DEFAULT_LANGUAGE);
		Log.log(`Translator prefer language order: ${_languages}`);

		try {
			_locale = Intl.getCanonicalLocales(locale)[0] || DEFAULT_LOCALE;
		} catch (err) {
			Log.warn(`Translator detects invalid locale format '${locale}'. Check config.`);
			_locale = DEFAULT_LOCALE;
		}
		Log.log(`Translator locale: ${_locale}`);

		registerFormatter("PluralRules", function ({ locale, value, options, rules } = {}) {
			if (isNaN(value)) return value;
			try {
				const plural = new Intl.PluralRules(locale, options).select(value);
				return rules[plural] ? rules[plural] : rules.other ? rules.other : value;
			} catch (err) {
				Log.error(err);
				return value;
			}
		});
		registerFormatter("ListFormat", function ({ locale, value, options } = {}) {
			if (!Array.isArray(value)) return String(value) || value;
			try {
				return new Intl.ListFormat(locale, options).format(value);
			} catch (err) {
				Log.error(err);
				return value;
			}
		});
		registerFormatter("NumberFormat", function ({ locale, value, options } = {}) {
			if (isNaN(value)) return String(value) || value;
			try {
				return new Intl.NumberFormat(locale, options).format(value);
			} catch (err) {
				Log.error(err);
				return value;
			}
		});
		registerFormatter("Select", function ({ value, rules } = {}) {
			if (rules[value]) return rules[value];
			return rules["other"] || String(value) || value;
		});
		registerFormatter("DateTimeFormat", function ({ locale, value, options } = {}) {
			var date = toDate(value);
			if (!(date instanceof Date)) return value;
			try {
				return new Intl.DateTimeFormat(locale, options).format(date);
			} catch (err) {
				Log.error(err);
				return value;
			}
		});
		registerFormatter("RelativeTimeFormat", function ({ locale, value, options, unit = "seconds" } = {}) {
			if (isNaN(value)) return String(value) || value;
			try {
				return new Intl.RelativeTimeFormat(locale, options).format(value, unit);
			} catch (err) {
				Log.warn(`Invalid locale : ${locale}`);
				return value;
			}
		});
		registerFormatter("AutoScaledRelativeTimeFormat", function ({ locale, value, options = {} }) {
			var date = toDate(value);
			if (!(date instanceof Date)) return value;
			var unit = "seconds";
			var now = Date.now();
			var diff = Math.round((date - now) / 1000);
			var aDiff = Math.abs(diff);
			var gap = diff;
			const rules = [
				["minutes", 60],
				["hours", 60 * 60],
				["days", 60 * 60 * 24],
				["weeks", 60 * 60 * 24 * 7],
				["months", 60 * 60 * 24 * 30],
				["quarters", 60 * 60 * 24 * 90],
				["years", 60 * 60 * 24 * 365]
			];
			for (let [u, f] of rules) {
				if (Math.floor(aDiff / f) < 1) continue;
				unit = u;
				gap = Math.floor(diff / f);
			}
			return new Intl.RelativeTimeFormat(locale, options).format(gap, unit);
		});

		await loadTranslations(DEFAULT_CORE_MODULES, () => {
			Log.log(`Translator is initialized.`);
		});

		_isInitialized = true;
		return _isInitialized;
	}

	/**
	 * Load translation dictionaries for specific module by prefer languages.
	 * It will combine dictionaries of possible hierarchical fallback automatically. ('en-CA' will try to merge 'en-ca.json' and 'en.json' )
	 *
	 * @public
	 * @param {object | string} module or 'core'
	 * @param {Function} callback Executed when the translation dictionaries are loaded.
	 * @returns {Promise<boolean>} return complete.
	 */
	async function loadTranslations(module, callback = () => {}) {
		var moduleName = module.name ? module.name : module;
		if (typeof _translations[moduleName] === "undefined") _translations[moduleName] = {};
		for (let lang of _languages) {
			var parts = lang.toLowerCase().split("-");
			while (parts.length > 0) {
				var langCode = parts.join("-");
				var fileName = "translations/" + langCode + ".json";
				var file = typeof module.file === "function" ? module.file(fileName) : "/" + fileName;
				var json = await loadJSON(file);
				if (json) {
					_translations[moduleName][lang] = Object.assign({}, json, _translations[moduleName][lang]);
					Log.log(`Dictionary merging: '${moduleName}/${langCode}' => '${moduleName}/${lang}'`);
				}
				parts.pop();
			}
		}
		if (typeof callback === "function") callback();
		return Promise.resolve(true);
	}
	/**
	 * Parse translated message from dictionaries and return the result
	 *
	 * @public
	 * @param {object} input - data to translate
	 * @param {string} input.moduleName - MM module name where to seek the dictionary
	 * @param {string} input.key - Term to translate
	 * @param {object} input.variables - (optional) variables to replace matched pattern.
	 * @param {boolean} input.asObject - (optional) return as object or string
	 * @param {string} input.fallback - (optional) fallback for empty/false/null translation.
	 * @returns {object|string|null} Translated result
	 */
	function translate({ moduleName, key, variables = {}, asObject = false, fallback = "" } = {}) {
		var dictionaries = [];
		if (moduleName) dictionaries.push(moduleName);
		dictionaries.push(DEFAULT_CORE_MODULES);
		var { dictionary, source, language, criteria } = findTerm(dictionaries, key);
		if (!source) return fallback ? fallback : null;
		var translated = parse(source, dictionary, variables) || fallback;
		if (asObject)
			return {
				key,
				variables,
				asObject,
				language,
				source,
				translated,
				criteria,
				fallback,
				moduleName,
				toString: () => {
					return translated;
				}
			};
		return translated;
	}

	/**
	 * Parse message with variables and formatters
	 *
	 * @private
	 * @param {string} message - original term definition in the dictionary
	 * @param {object} dictionary - dictionary to use
	 * @param {object} variables - transferred variables from '.translate()'
	 * @returns {string} parsed message
	 */
	function parse(message, dictionary, variables) {
		var regex = new RegExp("{(?<key>[\\w\\.]+)(?<formatter>@\\w+)?}", "gm");
		return message.replaceAll(regex, (...matched) => {
			var key = matched[5].key;
			var value = resurrect(key, variables);
			var formatter = matched[5].formatter ? matched[5].formatter : null;
			if (dictionary[formatter]) {
				//var {format, locale = '', ...rest} = dictionary[formatter];
				// To pass the old eslint...
				var format = dictionary[formatter].format ? dictionary[formatter].format : null;
				var locale = dictionary[formatter].locale ? dictionary[formatter].locale : _locale;
				//var rest = Object.assign({}, dictionary[formatter])

				if (_formatters[format]) {
					/* // current MM's eslint seems not compatible with newest JS spec.
					value = _formatters[format]({
						locale: locale || _locale,
						value: value, 
						...rest
					});
					*/
					// To pass the old eslint
					var data = Object.assign({}, dictionary[formatter], { value: value, locale: locale || _locale });
					value = _formatters[format](data);
				}
			}
			return typeof value !== "undefined" ? value : matched[0];
		});
	}

	/**
	 * Convert reference for property of variables from text
	 *
	 * @private
	 * @param {string} key - flatten string of referral object property
	 * @param {object} variables - referral object
	 * @returns {*} - value as object property resurrected from string
	 */
	function resurrect(key, variables) {
		var parts = key.split(".");
		if (parts.length === 1) return variables[key];
		var part = parts.shift();
		if (variables.hasOwnProperty(part)) {
			return resurrect(parts.join("."), variables[part]);
		} else {
			return variables[part];
		}
	}

	/**
	 * Find term from given dictionaries and return the message definition
	 *
	 * @private
	 * @param {Array.<dictionary>} dictionaries - To seek the term in which dictionaries.
	 * @param {string} key - term to find
	 * @returns {object} - dictionary, criteria, language, key, translation
	 */
	function findTerm(dictionaries, key) {
		for (let d of dictionaries) {
			if (!_translations[d]) continue;
			for (let l of _languages) {
				if (!_translations[d][l]) continue;
				if (_translations[d][l][key]) {
					return {
						key,
						dictionary: _translations[d][l],
						criteria: d,
						language: l,
						source: _translations[d][l][key]
					};
				}
			}
		}
		return {};
	}

	/**
	 * Register custom formatter
	 *
	 * @param {string} formatterName - format function identifier
	 * @param {Function} func - format function
	 */
	function registerFormatter(formatterName, func) {
		if (typeof func !== "function") {
			Log.warn(`Translator formatter '${formatterName}' seems not valid function.`);
		}
		if (!_formatters.hasOwnProperty(formatterName)) {
			_formatters[formatterName] = func;
		} else {
			Log.warn(`Translator formatter '${formatterName}' already exists.`);
		}
	}

	/**
	 * Return current registered languages. (from config.language and config.languages)
	 *
	 * @returns {Array<string>} current registered languages.
	 */
	function getLanguages() {
		return _languages;
	}

	/**
	 * Return current registered locale. (usually from config.locale (if possible, it will be regulated for BCP-47); DEFAULT => 'default')
	 *
	 * @returns {Array<string>} current registered locale.
	 */
	function getLocale() {
		return _locale;
	}

	return {
		init,
		loadTranslations,
		translate,
		registerFormatter,
		getLanguages,
		getLocale
	};
})();

window.Translator = Translator; // `globalThis` instead `window` would be better.
