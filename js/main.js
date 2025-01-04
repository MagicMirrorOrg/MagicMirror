/* global Loader, defaults, Translator, addAnimateCSS, removeAnimateCSS, AnimateCSSIn, AnimateCSSOut, modulePositions */

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

			let haveAnimateIn = null;
			// check if have valid animateIn in module definition (module.data.animateIn)
			if (module.data.animateIn && AnimateCSSIn.indexOf(module.data.animateIn) !== -1) haveAnimateIn = module.data.animateIn;

			const wrapper = selectWrapper(module.data.position);

			const dom = document.createElement("div");
			dom.id = module.identifier;
			dom.className = module.name;

			if (typeof module.data.classes === "string") {
				dom.className = `module ${dom.className} ${module.data.classes}`;
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

			// create the domCreationPromise with AnimateCSS (with animateIn of module definition)
			// or just display it
			var domCreationPromise;
			if (haveAnimateIn) domCreationPromise = updateDom(module, { options: { speed: 1000, animate: { in: haveAnimateIn } } }, true);
			else domCreationPromise = updateDom(module, 0);

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
	 * @param {string} position The name of the position.
	 * @returns {HTMLElement | void} the wrapper element
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
	 * @param {Module} module The module that needs an update.
	 * @param {object|number} [updateOptions] The (optional) number of microseconds for the animation or object with updateOptions (speed/animates)
	 * @param {boolean} [createAnimatedDom] for displaying only animateIn (used on first start of MagicMirror)
	 * @returns {Promise} Resolved when the dom is fully updated.
	 */
	const updateDom = function (module, updateOptions, createAnimatedDom = false) {
		return new Promise(function (resolve) {
			let speed = updateOptions;
			let animateOut = null;
			let animateIn = null;
			if (typeof updateOptions === "object") {
				if (typeof updateOptions.options === "object" && updateOptions.options.speed !== undefined) {
					speed = updateOptions.options.speed;
					Log.debug(`updateDom: ${module.identifier} Has speed in object: ${speed}`);
					if (typeof updateOptions.options.animate === "object") {
						animateOut = updateOptions.options.animate.out;
						animateIn = updateOptions.options.animate.in;
						Log.debug(`updateDom: ${module.identifier} Has animate in object: out->${animateOut}, in->${animateIn}`);
					}
				} else {
					Log.debug(`updateDom: ${module.identifier} Has no speed in object`);
					speed = 0;
				}
			}

			const newHeader = module.getHeader();
			let newContentPromise = module.getDom();

			if (!(newContentPromise instanceof Promise)) {
				// convert to a promise if not already one to avoid if/else's everywhere
				newContentPromise = Promise.resolve(newContentPromise);
			}

			newContentPromise
				.then(function (newContent) {
					const updatePromise = updateDomWithContent(module, speed, newHeader, newContent, animateOut, animateIn, createAnimatedDom);

					updatePromise.then(resolve).catch(Log.error);
				})
				.catch(Log.error);
		});
	};

	/**
	 * Update the dom with the specified content
	 * @param {Module} module The module that needs an update.
	 * @param {number} [speed] The (optional) number of microseconds for the animation.
	 * @param {string} newHeader The new header that is generated.
	 * @param {HTMLElement} newContent The new content that is generated.
	 * @param {string} [animateOut] AnimateCss animation name before hidden
	 * @param {string} [animateIn] AnimateCss animation name on show
	 * @param {boolean} [createAnimatedDom] for displaying only animateIn (used on first start)
	 * @returns {Promise} Resolved when the module dom has been updated.
	 */
	const updateDomWithContent = function (module, speed, newHeader, newContent, animateOut, animateIn, createAnimatedDom = false) {
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

			if (createAnimatedDom && animateIn !== null) {
				Log.debug(`${module.identifier} createAnimatedDom (${animateIn})`);
				updateModuleContent(module, newHeader, newContent);
				if (!module.hidden) {
					showModule(module, speed, null, { animate: animateIn });
				}
				resolve();
				return;
			}

			hideModule(
				module,
				speed / 2,
				function () {
					updateModuleContent(module, newHeader, newContent);
					if (!module.hidden) {
						showModule(module, speed / 2, null, { animate: animateIn });
					}
					resolve();
				},
				{ animate: animateOut }
			);
		});
	};

	/**
	 * Check if the content has changed.
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
	 * @param {Module} module The module to hide.
	 * @param {number} speed The speed of the hide animation.
	 * @param {Function} callback Called when the animation is done.
	 * @param {object} [options] Optional settings for the hide method.
	 */
	const hideModule = function (module, speed, callback, options = {}) {
		// set lockString if set in options.
		if (options.lockString) {
			// Log.log("Has lockstring: " + options.lockString);
			if (module.lockStrings.indexOf(options.lockString) === -1) {
				module.lockStrings.push(options.lockString);
			}
		}

		const moduleWrapper = document.getElementById(module.identifier);
		if (moduleWrapper !== null) {
			clearTimeout(module.showHideTimer);
			// reset all animations if needed
			if (module.hasAnimateOut) {
				removeAnimateCSS(module.identifier, module.hasAnimateOut);
				Log.debug(`${module.identifier} Force remove animateOut (in hide): ${module.hasAnimateOut}`);
				module.hasAnimateOut = false;
			}
			if (module.hasAnimateIn) {
				removeAnimateCSS(module.identifier, module.hasAnimateIn);
				Log.debug(`${module.identifier} Force remove animateIn (in hide): ${module.hasAnimateIn}`);
				module.hasAnimateIn = false;
			}
			// haveAnimateName for verify if we are using AnimateCSS library
			// we check AnimateCSSOut Array for validate it
			// and finally return the animate name or `null` (for default MM² animation)
			let haveAnimateName = null;
			// check if have valid animateOut in module definition (module.data.animateOut)
			if (module.data.animateOut && AnimateCSSOut.indexOf(module.data.animateOut) !== -1) haveAnimateName = module.data.animateOut;
			// can't be override with options.animate
			else if (options.animate && AnimateCSSOut.indexOf(options.animate) !== -1) haveAnimateName = options.animate;

			if (haveAnimateName) {
				// with AnimateCSS
				Log.debug(`${module.identifier} Has animateOut: ${haveAnimateName}`);
				module.hasAnimateOut = haveAnimateName;
				addAnimateCSS(module.identifier, haveAnimateName, speed / 1000);
				module.showHideTimer = setTimeout(function () {
					removeAnimateCSS(module.identifier, haveAnimateName);
					Log.debug(`${module.identifier} Remove animateOut: ${module.hasAnimateOut}`);
					// AnimateCSS is now done
					moduleWrapper.style.opacity = 0;
					moduleWrapper.classList.add("hidden");
					moduleWrapper.style.position = "fixed";
					module.hasAnimateOut = false;

					updateWrapperStates();
					if (typeof callback === "function") {
						callback();
					}
				}, speed);
			} else {
				// default MM² Animate
				moduleWrapper.style.transition = `opacity ${speed / 1000}s`;
				moduleWrapper.style.opacity = 0;
				moduleWrapper.classList.add("hidden");
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
			}
		} else {
			// invoke callback even if no content, issue 1308
			if (typeof callback === "function") {
				callback();
			}
		}
	};

	/**
	 * Show the module.
	 * @param {Module} module The module to show.
	 * @param {number} speed The speed of the show animation.
	 * @param {Function} callback Called when the animation is done.
	 * @param {object} [options] Optional settings for the show method.
	 */
	const showModule = function (module, speed, callback, options = {}) {
		// remove lockString if set in options.
		if (options.lockString) {
			const index = module.lockStrings.indexOf(options.lockString);
			if (index !== -1) {
				module.lockStrings.splice(index, 1);
			}
		}

		// Check if there are no more lockStrings set, or the force option is set.
		// Otherwise cancel show action.
		if (module.lockStrings.length !== 0 && options.force !== true) {
			Log.log(`Will not show ${module.name}. LockStrings active: ${module.lockStrings.join(",")}`);
			if (typeof options.onError === "function") {
				options.onError(new Error("LOCK_STRING_ACTIVE"));
			}
			return;
		}
		// reset all animations if needed
		if (module.hasAnimateOut) {
			removeAnimateCSS(module.identifier, module.hasAnimateOut);
			Log.debug(`${module.identifier} Force remove animateOut (in show): ${module.hasAnimateOut}`);
			module.hasAnimateOut = false;
		}
		if (module.hasAnimateIn) {
			removeAnimateCSS(module.identifier, module.hasAnimateIn);
			Log.debug(`${module.identifier} Force remove animateIn (in show): ${module.hasAnimateIn}`);
			module.hasAnimateIn = false;
		}

		module.hidden = false;

		// If forced show, clean current lockStrings.
		if (module.lockStrings.length !== 0 && options.force === true) {
			Log.log(`Force show of module: ${module.name}`);
			module.lockStrings = [];
		}

		const moduleWrapper = document.getElementById(module.identifier);
		if (moduleWrapper !== null) {
			clearTimeout(module.showHideTimer);

			// haveAnimateName for verify if we are using AnimateCSS library
			// we check AnimateCSSIn Array for validate it
			// and finally return the animate name or `null` (for default MM² animation)
			let haveAnimateName = null;
			// check if have valid animateOut in module definition (module.data.animateIn)
			if (module.data.animateIn && AnimateCSSIn.indexOf(module.data.animateIn) !== -1) haveAnimateName = module.data.animateIn;
			// can't be override with options.animate
			else if (options.animate && AnimateCSSIn.indexOf(options.animate) !== -1) haveAnimateName = options.animate;

			if (!haveAnimateName) moduleWrapper.style.transition = `opacity ${speed / 1000}s`;
			// Restore the position. See hideModule() for more info.
			moduleWrapper.style.position = "static";
			moduleWrapper.classList.remove("hidden");

			updateWrapperStates();

			// Waiting for DOM-changes done in updateWrapperStates before we can start the animation.
			const dummy = moduleWrapper.parentElement.parentElement.offsetHeight;
			moduleWrapper.style.opacity = 1;

			if (haveAnimateName) {
				// with AnimateCSS
				Log.debug(`${module.identifier} Has animateIn: ${haveAnimateName}`);
				module.hasAnimateIn = haveAnimateName;
				addAnimateCSS(module.identifier, haveAnimateName, speed / 1000);
				module.showHideTimer = setTimeout(function () {
					removeAnimateCSS(module.identifier, haveAnimateName);
					Log.debug(`${module.identifier} Remove animateIn: ${haveAnimateName}`);
					module.hasAnimateIn = false;
					if (typeof callback === "function") {
						callback();
					}
				}, speed);
			} else {
				// default MM² Animate
				module.showHideTimer = setTimeout(function () {
					if (typeof callback === "function") {
						callback();
					}
				}, speed);
			}
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
		modulePositions.forEach(function (position) {
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
		if (typeof config === "undefined") {
			config = defaults;
			Log.error("Config file is missing! Please create a config file.");
			return;
		}

		config = Object.assign({}, defaults, config);
	};

	/**
	 * Adds special selectors on a collection of modules.
	 * @param {Module[]} modules Array of modules.
	 */
	const setSelectionMethodsForModules = function (modules) {

		/**
		 * Filter modules with the specified classes.
		 * @param {string|string[]} className one or multiple classnames (array or space divided).
		 * @returns {Module[]} Filtered collection of modules.
		 */
		const withClass = function (className) {
			return modulesByClass(className, true);
		};

		/**
		 * Filter modules without the specified classes.
		 * @param {string|string[]} className one or multiple classnames (array or space divided).
		 * @returns {Module[]} Filtered collection of modules.
		 */
		const exceptWithClass = function (className) {
			return modulesByClass(className, false);
		};

		/**
		 * Filters a collection of modules based on classname(s).
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
		async init () {
			Log.info("Initializing MagicMirror².");
			loadConfig();

			Log.setLogLevel(config.logLevel);

			await Translator.loadCoreTranslations(config.language);
			await Loader.loadModules();
		},

		/**
		 * Gets called when all modules are started.
		 * @param {Module[]} moduleObjects All module instances.
		 */
		modulesStarted (moduleObjects) {
			modules = [];
			let startUp = "";

			moduleObjects.forEach((module) => modules.push(module));

			Log.info("All modules started!");
			sendNotification("ALL_MODULES_STARTED");

			createDomObjects();

			if (config.reloadAfterServerRestart) {
				setInterval(async () => {
					// if server startup time has changed (which means server was restarted)
					// the client reloads the mm page
					try {
						const res = await fetch(`${location.protocol}//${location.host}${config.basePath}startup`);
						const curr = await res.text();
						if (startUp === "") startUp = curr;
						if (startUp !== curr) {
							startUp = "";
							window.location.reload(true);
							console.warn("Refreshing Website because server was restarted");
						}
					} catch (err) {
						Log.error(`MagicMirror not reachable: ${err}`);
					}
				}, config.checkServerInterval);
			}
		},

		/**
		 * Send a notification to all modules.
		 * @param {string} notification The identifier of the notification.
		 * @param {*} payload The payload of the notification.
		 * @param {Module} sender The module that sent the notification.
		 */
		sendNotification (notification, payload, sender) {
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
		 * @param {Module} module The module that needs an update.
		 * @param {object|number} [updateOptions] The (optional) number of microseconds for the animation or object with updateOptions (speed/animates)
		 */
		updateDom (module, updateOptions) {
			if (!(module instanceof Module)) {
				Log.error("updateDom: Sender should be a module.");
				return;
			}

			if (!module.data.position) {
				Log.warn("module tries to update the DOM without being displayed.");
				return;
			}

			// Further implementation is done in the private method.
			updateDom(module, updateOptions).then(function () {
				// Once the update is complete and rendered, send a notification to the module that the DOM has been updated
				sendNotification("MODULE_DOM_UPDATED", null, null, module);
			});
		},

		/**
		 * Returns a collection of all modules currently active.
		 * @returns {Module[]} A collection of all modules currently active.
		 */
		getModules () {
			setSelectionMethodsForModules(modules);
			return modules;
		},

		/**
		 * Hide the module.
		 * @param {Module} module The module to hide.
		 * @param {number} speed The speed of the hide animation.
		 * @param {Function} callback Called when the animation is done.
		 * @param {object} [options] Optional settings for the hide method.
		 */
		hideModule (module, speed, callback, options) {
			module.hidden = true;
			hideModule(module, speed, callback, options);
		},

		/**
		 * Show the module.
		 * @param {Module} module The module to show.
		 * @param {number} speed The speed of the show animation.
		 * @param {Function} callback Called when the animation is done.
		 * @param {object} [options] Optional settings for the show method.
		 */
		showModule (module, speed, callback, options) {
			// do not change module.hidden yet, only if we really show it later
			showModule(module, speed, callback, options);
		},

		// Return all available module positions.
		getAvailableModulePositions: modulePositions
	};
}());

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
	}());
}

MM.init();
