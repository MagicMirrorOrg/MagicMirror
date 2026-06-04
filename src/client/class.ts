/*
 * Historically this file held the John Resig "Simple JavaScript Inheritance"
 * Class system. Module and NodeHelper are now real TypeScript classes, so only the
 * cloneObject helper remains here (used by Module.create to deep-clone a module
 * definition, and loaded as a browser global via index.html).
 */

/**
 * Define the clone method for later use. Helper Method.
 * @param {object} obj Object to be cloned
 * @returns {object} the cloned object
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- cloneObject is a runtime global consumed by js/module.js and the test suite.
function cloneObject (obj: any): any {
	if (obj === null || typeof obj !== "object") {
		return obj;
	}

	if (obj.constructor.name === "RegExp") {
		return new RegExp(obj);
	}

	const temp = obj.constructor(); // give temp the original obj's constructor
	for (const key in obj) {
		temp[key] = cloneObject(obj[key]);

		if (key === "lockStrings") {
			Log.log(key);
		}
	}

	return temp;
}
