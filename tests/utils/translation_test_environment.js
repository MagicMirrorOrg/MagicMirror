const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { JSDOM } = require("jsdom");

const TRANSLATOR_MODULE_URL = pathToFileURL(path.join(__dirname, "..", "..", "js", "translator.js")).href;

/**
 * Reset mutable Translator state between tests.
 * Clears all non-function plain-object properties to remain resilient
 * when additional translation stores are introduced.
 * @param {object} Translator The shared Translator module instance.
 */
const resetTranslatorState = (Translator) => {
	for (const [key, value] of Object.entries(Translator)) {
		if (typeof value === "function") {
			continue;
		}

		if (Object.prototype.toString.call(value) === "[object Object]") {
			Translator[key] = {};
		}
	}
};

/**
 * Set up DOM globals used by translation tests.
 * @param {number} [port] Base URI port used to resolve relative translation paths.
 * @returns {void}
 */
const setupTranslationTestEnvironment = (port = 3000) => {
	const dom = new JSDOM("", { url: `http://localhost:${port}` });

	global.document = dom.window.document;
	if (!global.Log) {
		global.Log = { log: vi.fn(), error: vi.fn() };
	}
};

module.exports = {
	setupTranslationTestEnvironment,
	TRANSLATOR_MODULE_URL,
	resetTranslatorState
};
