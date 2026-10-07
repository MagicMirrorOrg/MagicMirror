import {pathToFileURL} from "node:url";

/**
 * Load and instantiate a CommonJS or ESM module helper.
 * @param {string} helperPath Absolute path to the helper module.
 * @returns {Promise<object>} The instantiated module helper.
 */
export const loadNodeHelper = async (helperPath) => {
	const helperModule = await import(pathToFileURL(helperPath).href);
	const Helper = helperModule.default ?? helperModule;

	if (typeof Helper !== "function") {
		throw new TypeError(`Module helper at ${helperPath} must export a constructor.`);
	}

	return new Helper();
};
