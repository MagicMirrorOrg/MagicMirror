/* global Loader, defaults, Translator */

/* MagicMirror²
 * Main System
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
const MM = (function () {
	let modules = [];

	/* Private Methods */

	/**
	 * Create dom objects for all modules that are configured for a specific position.
	 */
	const createDomObjects = function () {
		const domCreationPromises = [];

		modules.forEach(function (module) {
			if (typeof module.data.position !== "string") {
				return;
			}

			const wrapper = selectWrapper(module.data.position);

			const dom = document.createElement("div");
			dom.id = module.identifier;
			dom.className = module.name;

			if (typeof module.data.classes === "string") {
				dom.className = "module " + dom.className + " " + module.data.classes;
			}

			dom.opacity = 0;
			wrapper.appendChild(dom);

			const moduleHeader = document.createElement("header");
			moduleHeader.innerHTML = module.getHeader();
			moduleHeader.className = "module-header";
			dom.appendChild(moduleHeader);

			if (typeof module.getHeader() === "undefined" || module.getHeader() !== "") {
				moduleHeader.style.display = "none;";
			} else {
				moduleHeader.style.display = "block;";
			}

			const moduleContent = document.createElement("div");
			moduleContent.className = "module-content";
			dom.appendChild(moduleContent);

			const domCreationPromise = updateDom(module, 0);
			domCreationPromises.push(domCreationPromise);
			domCreationPromise
				.then(function () {
					sendNotification("MODULE_DOM_CREATED", null, null, module);
				})
				.catch(Log.error);
		});

		updateWrapperStates();

		Promise.all(domCreationPromises).then(function () {
			sendNotification("DOM_OBJECTS_CREATED");
		});
	};

	/**
	 * Select the wrapper dom object for a specific position.
	 *
	 * @param {string} position The name of the position.
	 * @returns {HTMLElement} the wrapper element
	 */
	const selectWrapper = function (position) {
		const classes = position.replace("_", " ");
		const parentWrapper = document.getElementsByClassName(classes);
		if (parentWrapper.length > 0) {
			const wrapper = parentWrapper[0].getElementsByClassName("container");
			if (wrapper.length > 0) {
				return wrapper[0];
			}
		}
	};

	/**
	 * Send a notification to all modules.
	 *
	 * @param {string} notification The identifier of the notification.
	 * @param {*} payload The payload of the notification.
	 * @param {Module} sender The module that sent the notification.
	 * @param {Module} [sendTo] The (optional) module to send the notification to.
	 */
	const sendNotification = function (notification, payload, sender, sendTo) {
		for (const m in modules) {
			const module = modules[m];
			if (module !== sender && (!sendTo || module === sendTo)) {
				module.notificationReceived(notification, payload, sender);
			}
		}
	};

	/**
	 * Update the dom for a specific module.
	 *
	 * @param {Module} module The module that needs an update.
	 * @param {number} [speed] The (optional) number of microseconds for the animation.
	 * @returns {Promise} Resolved when the dom is fully updated.
	 */
	const updateDom = function (module, speed) {
		return new Promise(function (resolve) {
			const newHeader = module.getHeader();
			let newContentPromise = module.getDom();

			if (!(newContentPromise instanceof Promise)) {
				// convert to a promise if not already one to avoid if/else's everywhere
				newContentPromise = Promise.resolve(newContentPromise);
			}

			newContentPromise
				.then(function (newContent) {
					const updatePromise = updateDomWithContent(module, speed, newHeader, newContent);

					updatePromise.then(resolve).catch(Log.error);
				})
				.catch(Log.error);
		});
	};

	/**
	 * Update the dom with the specified content
	 *
	 * @param {Module} module The module that needs an update.
	 * @param {number} [speed] The (optional) number of microseconds for the animation.
	 * @param {string} newHeader The new header that is generated.
	 * @param {HTMLElement} newContent The new content that is generated.
	 * @returns {Promise} Resolved when the module dom has been updated.
	 */
	const updateDomWithContent = function (module, speed, newHeader, newContent) {
		return new Promise(function (resolve) {
			if (module.hidden || !speed) {
				updateModuleContent(module, newHeader, newContent);
				resolve();
				return;
			}

			if (!moduleNeedsUpdate(module, newHeader, newContent)) {
				resolve();
				return;
			}

			if (!speed) {
				updateModuleContent(module, newHeader, newContent);
				resolve();
				return;
			}

			hideModule(module, speed / 2, function () {
				updateModuleContent(module, newHeader, newContent);
				if (!module.hidden) {
					showModule(module, speed / 2);
				}
				resolve();
			});
		});
	};

	/**
	 * Check if the content has changed.
	 *
	 * @param {Module} module The module to check.
	 * @param {string} newHeader The new header that is generated.
	 * @param {HTMLElement} newContent The new content that is generated.
	 * @returns {boolean} True if the module need an update, false otherwise
	 */
	const moduleNeedsUpdate = function (module, newHeader, newContent) {
		const moduleWrapper = document.getElementById(module.identifier);
		if (moduleWrapper === null) {
			return false;
		}

		const contentWrapper = moduleWrapper.getElementsByClassName("module-content");
		const headerWrapper = moduleWrapper.getElementsByClassName("module-header");

		let headerNeedsUpdate = false;
		let contentNeedsUpdate;

		if (headerWrapper.length > 0) {
			headerNeedsUpdate = newHeader !== headerWrapper[0].innerHTML;
		}

		const tempContentWrapper = document.createElement("div");
		tempContentWrapper.appendChild(newContent);
		contentNeedsUpdate = tempContentWrapper.innerHTML !== contentWrapper[0].innerHTML;

		return headerNeedsUpdate || contentNeedsUpdate;
	};

	/**
	 * Update the content of a module on screen.
	 *
	 * @param {Module} module The module to check.
	 * @param {string} newHeader The new header that is generated.
	 * @param {HTMLElement} newContent The new content that is generated.
	 */
	const updateModuleContent = function (module, newHeader, newContent) {
		const moduleWrapper = document.getElementById(module.identifier);
		if (moduleWrapper === null) {
			return;
		}
		const headerWrapper = moduleWrapper.getElementsByClassName("module-header");
		const contentWrapper = moduleWrapper.getElementsByClassName("module-content");

		contentWrapper[0].innerHTML = "";
		contentWrapper[0].appendChild(newContent);

		headerWrapper[0].innerHTML = newHeader;
		if (headerWrapper.length > 0 && newHeader) {
			headerWrapper[0].style.display = "block";
		} else {
			headerWrapper[0].style.display = "none";
		}
	};

	/**
	 * Hide the module.
	 *
	 * @param {Module} module The module to hide.
	 * @param {number} speed The speed of the hide animation.
	 * @param {Function} callback Called when the animation is done.
	 * @param {object} [options] Optional settings for the hide method.
	 */
	const hideModule = function (module, speed, callback, options) {
		options = options || {};

		// set lockString if set in options.
		if (options.lockString) {
			// Log.log("Has lockstring: " + options.lockString);
			if (module.lockStrings.indexOf(options.lockString) === -1) {
				module.lockStrings.push(options.lockString);
			}
		}

		const moduleWrapper = document.getElementById(module.identifier);
		if (moduleWrapper !== null) {
			moduleWrapper.style.transition = "opacity " + speed / 1000 + "s";
			moduleWrapper.style.opacity = 0;
			moduleWrapper.classList.add("hidden");

			clearTimeout(module.showHideTimer);
			module.showHideTimer = setTimeout(function () {
				// To not take up any space, we just make the position absolute.
				// since it's fade out anyway, we can see it lay above or
				// below other modules. This works way better than adjusting
				// the .display property.
				moduleWrapper.style.position = "fixed";

				updateWrapperStates();

				if (typeof callback === "function") {
					callback();
				}
			}, speed);
		} else {
			// invoke callback even if no content, issue 1308
			if (typeof callback === "function") {
				callback();
			}
		}
	};

	/**
	 * Show the module.
	 *
	 * @param {Module} module The module to show.
	 * @param {number} speed The speed of the show animation.
	 * @param {Function} callback Called when the animation is done.
	 * @param {object} [options] Optional settings for the show method.
	 */
	const showModule = function (module, speed, callback, options) {
		options = options || {};

		// remove lockString if set in options.
		if (options.lockString) {
			const index = module.lockStrings.indexOf(options.lockString);
			if (index !== -1) {
				module.lockStrings.splice(index, 1);
			}
		}

		// Check if there are no more lockstrings set, or the force option is set.
		// Otherwise cancel show action.
		if (module.lockStrings.length !== 0 && options.force !== true) {
			Log.log("Will not show " + module.name + ". LockStrings active: " + module.lockStrings.join(","));
			if (typeof options.onError === "function") {
				options.onError(new Error("LOCK_STRING_ACTIVE"));
			}
			return;
		}

		module.hidden = false;

		// If forced show, clean current lockstrings.
		if (module.lockStrings.length !== 0 && options.force === true) {
			Log.log("Force show of module: " + module.name);
			module.lockStrings = [];
		}

		const moduleWrapper = document.getElementById(module.identifier);
		if (moduleWrapper !== null) {
			moduleWrapper.style.transition = "opacity " + speed / 1000 + "s";
			// Restore the position. See hideModule() for more info.
			moduleWrapper.style.position = "static";
			moduleWrapper.classList.remove("hidden");

			updateWrapperStates();

			// Waiting for DOM-changes done in updateWrapperStates before we can start the animation.
			const dummy = moduleWrapper.parentElement.parentElement.offsetHeight;
			moduleWrapper.style.opacity = 1;

			clearTimeout(module.showHideTimer);
			module.showHideTimer = setTimeout(function () {
				if (typeof callback === "function") {
					callback();
				}
			}, speed);
		} else {
			// invoke callback
			if (typeof callback === "function") {
				callback();
			}
		}
	};

	/**
	 * Checks for all positions if it has visible content.
	 * If not, if will hide the position to prevent unwanted margins.
	 * This method should be called by the show and hide methods.
	 *
	 * Example:
	 * If the top_bar only contains the update notification. And no update is available,
	 * the update notification is hidden. The top bar still occupies space making for
	 * an ugly top margin. By using this function, the top bar will be hidden if the
	 * update notification is not visible.
	 */
	const updateWrapperStates = function () {
		const positions = ["top_bar", "top_left", "top_center", "top_right", "upper_third", "middle_center", "lower_third", "bottom_left", "bottom_center", "bottom_right", "bottom_bar", "fullscreen_above", "fullscreen_below"];

		positions.forEach(function (position) {
			const wrapper = selectWrapper(position);
			const moduleWrappers = wrapper.getElementsByClassName("module");

			let showWrapper = false;
			Array.prototype.forEach.call(moduleWrappers, function (moduleWrapper) {
				if (moduleWrapper.style.position === "" || moduleWrapper.style.position === "static") {
					showWrapper = true;
				}
			});

			wrapper.style.display = showWrapper ? "block" : "none";
		});
	};

	/**
	 * Loads the core config and combines it with the system defaults.
	 */
	const loadConfig = function () {
		// FIXME: Think about how to pass config around without breaking tests
		/* eslint-disable */
		if (typeof config === "undefined") {
			config = defaults;
			Log.error("Config file is missing! Please create a config file.");
			return;
		}

		config = Object.assign({}, defaults, config);
		/* eslint-enable */
	};

	/**
	 * Adds special selectors on a collection of modules.
	 *
	 * @param {Module[]} modules Array of modules.
	 */
	const setSelectionMethodsForModules = function (modules) {
		/**
		 * Filter modules with the specified classes.
		 *
		 * @param {string|string[]} className one or multiple classnames (array or space divided).
		 * @returns {Module[]} Filtered collection of modules.
		 */
		const withClass = function (className) {
			return modulesByClass(className, true);
		};

		/**
		 * Filter modules without the specified classes.
		 *
		 * @param {string|string[]} className one or multiple classnames (array or space divided).
		 * @returns {Module[]} Filtered collection of modules.
		 */
		const exceptWithClass = function (className) {
			return modulesByClass(className, false);
		};

		/**
		 * Filters a collection of modules based on classname(s).
		 *
		 * @param {string|string[]} className one or multiple classnames (array or space divided).
		 * @param {boolean} include if the filter should include or exclude the modules with the specific classes.
		 * @returns {Module[]} Filtered collection of modules.
		 */
		const modulesByClass = function (className, include) {
			let searchClasses = className;
			if (typeof className === "string") {
				searchClasses = className.split(" ");
			}

			const newModules = modules.filter(function (module) {
				const classes = module.data.classes.toLowerCase().split(" ");

				for (const searchClass of searchClasses) {
					if (classes.indexOf(searchClass.toLowerCase()) !== -1) {
						return include;
					}
				}

				return !include;
			});

			setSelectionMethodsForModules(newModules);
			return newModules;
		};

		/**
		 * Removes a module instance from the collection.
		 *
		 * @param {object} module The module instance to remove from the collection.
		 * @returns {Module[]} Filtered collection of modules.
		 */
		const exceptModule = function (module) {
			const newModules = modules.filter(function (mod) {
				return mod.identifier !== module.identifier;
			});

			setSelectionMethodsForModules(newModules);
			return newModules;
		};

		/**
		 * Walks thru a collection of modules and executes the callback with the module as an argument.
		 *
		 * @param {Function} callback The function to execute with the module as an argument.
		 */
		const enumerate = function (callback) {
			modules.map(function (module) {
				callback(module);
			});
		};

		if (typeof modules.withClass === "undefined") {
			Object.defineProperty(modules, "withClass", { value: withClass, enumerable: false });
		}
		if (typeof modules.exceptWithClass === "undefined") {
			Object.defineProperty(modules, "exceptWithClass", { value: exceptWithClass, enumerable: false });
		}
		if (typeof modules.exceptModule === "undefined") {
			Object.defineProperty(modules, "exceptModule", { value: exceptModule, enumerable: false });
		}
		if (typeof modules.enumerate === "undefined") {
			Object.defineProperty(modules, "enumerate", { value: enumerate, enumerable: false });
		}
	};

	return {
		/* Public Methods */

		/**
		 * Main init method.
		 */
		init: function () {
			Log.info("Initializing MagicMirror².");
			loadConfig();

			Log.setLogLevel(config.logLevel);

			Translator.loadCoreTranslations(config.language);
			Loader.loadModules();
		},

		/**
		 * Gets called when all modules are started.
		 *
		 * @param {Module[]} moduleObjects All module instances.
		 */
		modulesStarted: function (moduleObjects) {
			modules = [];
			moduleObjects.forEach((module) => modules.push(module));

			Log.info("All modules started!");
			sendNotification("ALL_MODULES_STARTED");

			createDomObjects();
		},

		/**
		 * Send a notification to all modules.
		 *
		 * @param {string} notification The identifier of the notification.
		 * @param {*} payload The payload of the notification.
		 * @param {Module} sender The module that sent the notification.
		 */
		sendNotification: function (notification, payload, sender) {
			if (arguments.length < 3) {
				Log.error("sendNotification: Missing arguments.");
				return;
			}

			if (typeof notification !== "string") {
				Log.error("sendNotification: Notification should be a string.");
				return;
			}

			if (!(sender instanceof Module)) {
				Log.error("sendNotification: Sender should be a module.");
				return;
			}

			// Further implementation is done in the private method.
			sendNotification(notification, payload, sender);
		},

		/**
		 * Update the dom for a specific module.
		 *
		 * @param {Module} module The module that needs an update.
		 * @param {number} [speed] The number of microseconds for the animation.
		 */
		updateDom: function (module, speed) {
			if (!(module instanceof Module)) {
				Log.error("updateDom: Sender should be a module.");
				return;
			}

			if (!module.data.position) {
				Log.warn("module tries to update the DOM without being displayed.");
				return;
			}

			// Further implementation is done in the private method.
			updateDom(module, speed);
		},

		/**
		 * Returns a collection of all modules currently active.
		 *
		 * @returns {Module[]} A collection of all modules currently active.
		 */
		getModules: function () {
			setSelectionMethodsForModules(modules);
			return modules;
		},

		/**
		 * Hide the module.
		 *
		 * @param {Module} module The module to hide.
		 * @param {number} speed The speed of the hide animation.
		 * @param {Function} callback Called when the animation is done.
		 * @param {object} [options] Optional settings for the hide method.
		 */
		hideModule: function (module, speed, callback, options) {
			module.hidden = true;
			hideModule(module, speed, callback, options);
		},

		/**
		 * Show the module.
		 *
		 * @param {Module} module The module to show.
		 * @param {number} speed The speed of the show animation.
		 * @param {Function} callback Called when the animation is done.
		 * @param {object} [options] Optional settings for the show method.
		 */
		showModule: function (module, speed, callback, options) {
			// do not change module.hidden yet, only if we really show it later
			showModule(module, speed, callback, options);
		}
	};
})();

// Add polyfill for Object.assign.
if (typeof Object.assign !== "function") {
	(function () {
		Object.assign = function (target) {
			"use strict";
			if (target === undefined || target === null) {
				throw new TypeError("Cannot convert undefined or null to object");
			}
			const output = Object(target);
			for (let index = 1; index < arguments.length; index++) {
				const source = arguments[index];
				if (source !== undefined && source !== null) {
					for (const nextKey in source) {
						if (source.hasOwnProperty(nextKey)) {
							output[nextKey] = source[nextKey];
						}
					}
				}
			}
			return output;
		};
	})();
}

MM.init();
