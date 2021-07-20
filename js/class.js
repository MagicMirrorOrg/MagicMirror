/* global Class, xyz */

/* Simple JavaScript Inheritance
 * By John Resig https://johnresig.com/
 *
 * Inspired by base2 and Prototype
 *
 * MIT Licensed.
 */
(function () {
	let initializing = false;
	const fnTest = /xyz/.test(function () {
		xyz;
	})
		? /\b_super\b/
		: /.*/;

	// The base Class implementation (does nothing)
	this.Class = function () {};

	// Create a new Class that inherits from this class
	Class.extend = function (prop) {
		let _super = this.prototype;

		// Instantiate a base class (but only create the instance,
		// don't run the init constructor)
		initializing = true;
		const prototype = new this();
		initializing = false;

		// Make a copy of all prototype properties, to prevent reference issues.
		for (const p in prototype) {
			prototype[p] = cloneObject(prototype[p]);
		}

		// Copy the properties over onto the new prototype
		for (const name in prop) {
			// Check if we're overwriting an existing function
			prototype[name] =
				typeof prop[name] === "function" && typeof _super[name] === "function" && fnTest.test(prop[name])
					? (function (name, fn) {
							return function () {
								const tmp = this._super;

								// Add a new ._super() method that is the same method
								// but on the super-class
								this._super = _super[name];

								// The method only need to be bound temporarily, so we
								// remove it when we're done executing
								const ret = fn.apply(this, arguments);
								this._super = tmp;

								return ret;
							};
					  })(name, prop[name])
					: prop[name];
		}

		/**
		 * The dummy class constructor
		 */
		function Class() {
			// All construction is actually done in the init method
			if (!initializing && this.init) {
				this.init.apply(this, arguments);
			}
		}

		// Populate our constructed prototype object
		Class.prototype = prototype;

		// Enforce the constructor to be what we expect
		Class.prototype.constructor = Class;

		// And make this class extendable
		Class.extend = arguments.callee;

		return Class;
	};
})();

/**
 * Define the clone method for later use. Helper Method.
 *
 * @param {object} obj Object to be cloned
 * @returns {object} the cloned object
 */
function cloneObject(obj) {
	if (obj === null || typeof obj !== "object") {
		return obj;
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

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = Class;
}
