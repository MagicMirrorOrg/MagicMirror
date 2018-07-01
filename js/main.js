/* global  Log, Loader, Module, config, defaults */
/* jshint -W020, esversion: 6 */

/* Magic Mirror
 * Main System
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var MM = (function() {

	var modules = [];

	/* Private Methods */

	/* createDomObjects()
	 * Create dom objects for all modules that
	 * are configured for a specific position.
	 */
	var createDomObjects = function() {
		var domCreationPromises = [];

		modules.forEach(function(module) {
			if (typeof module.data.position !== "string") {
				return;
			}

			var wrapper = selectWrapper(module.data.position);

			var dom = document.createElement("div");
			dom.id = module.identifier;
			dom.className = module.name;

			if (typeof module.data.classes === "string") {
				dom.className = "module " + dom.className + " " + module.data.classes;
			}

			dom.opacity = 0;
			wrapper.appendChild(dom);

			if (typeof module.data.header !== "undefined" && module.data.header !== "") {
				var moduleHeader = document.createElement("header");
				moduleHeader.innerHTML = module.data.header;
				moduleHeader.className = "module-header";
				dom.appendChild(moduleHeader);
			}

			var moduleContent = document.createElement("div");
			moduleContent.className = "module-content";
			dom.appendChild(moduleContent);

			var domCreationPromise = updateDom(module, 0);
			domCreationPromises.push(domCreationPromise);
			domCreationPromise.then(function() {
				sendNotification("MODULE_DOM_CREATED", null, null, module);
			}).catch(Log.error);
		});

		updateWrapperStates();

		Promise.all(domCreationPromises).then(function() {
			sendNotification("DOM_OBJECTS_CREATED");
		});
	};

	/* selectWrapper(position)
	 * Select the wrapper dom object for a specific position.
	 *
	 * argument position string - The name of the position.
	 */
	var selectWrapper = function(position) {
		var classes = position.replace("_"," ");
		var parentWrapper = document.getElementsByClassName(classes);
		if (parentWrapper.length > 0) {
			var wrapper = parentWrapper[0].getElementsByClassName("container");
			if (wrapper.length > 0) {
				return wrapper[0];
			}
		}
	};

	/* sendNotification(notification, payload, sender)
	 * Send a notification to all modules.
	 *
	 * argument notification string - The identifier of the notification.
	 * argument payload mixed - The payload of the notification.
	 * argument sender Module - The module that sent the notification.
	 * argument sendTo Module - The module to send the notification to. (optional)
	 */
	var sendNotification = function(notification, payload, sender, sendTo) {
		for (var m in modules) {
			var module = modules[m];
			if (module !== sender && (!sendTo || module === sendTo)) {
				module.notificationReceived(notification, payload, sender);
			}
		}
	};

	/* updateDom(module, speed)
	 * Update the dom for a specific module.
	 *
	 * argument module Module - The module that needs an update.
	 * argument speed Number - The number of microseconds for the animation. (optional)
	 *
	 * return Promise - Resolved when the dom is fully updated.
	 */
	var updateDom = function(module, speed) {
		return new Promise(function(resolve) {
			var newContentPromise = module.getDom();
			var newHeader = module.getHeader();

			if (!(newContentPromise instanceof Promise)) {
				// convert to a promise if not already one to avoid if/else's everywhere
				newContentPromise = Promise.resolve(newContentPromise);
			}

			newContentPromise.then(function(newContent) {
				var updatePromise = updateDomWithContent(module, speed, newHeader, newContent);

				updatePromise.then(resolve).catch(Log.error);
			}).catch(Log.error);
		});
	};

	/* updateDomWithContent(module, speed, newHeader, newContent)
	 * Update the dom with the specified content
	 *
	 * argument module Module - The module that needs an update.
	 * argument speed Number - The number of microseconds for the animation. (optional)
	 * argument newHeader String - The new header that is generated.
	 * argument newContent Domobject - The new content that is generated.
	 *
	 * return Promise - Resolved when the module dom has been updated.
	 */
	var updateDomWithContent = function(module, speed, newHeader, newContent) {
		return new Promise(function(resolve) {
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

			hideModule(module, speed / 2, function() {
				updateModuleContent(module, newHeader, newContent);
				if (!module.hidden) {
					showModule(module, speed / 2);
				}
				resolve();
			});
		});
	};

	/* moduleNeedsUpdate(module, newContent)
	 * Check if the content has changed.
	 *
	 * argument module Module - The module to check.
	 * argument newHeader String - The new header that is generated.
	 * argument newContent Domobject - The new content that is generated.
	 *
	 * return bool - Does the module need an update?
	 */
	var moduleNeedsUpdate = function(module, newHeader, newContent) {
		var moduleWrapper = document.getElementById(module.identifier);
		var contentWrapper = moduleWrapper.getElementsByClassName("module-content");
		var headerWrapper = moduleWrapper.getElementsByClassName("module-header");

		var headerNeedsUpdate = false;
		var contentNeedsUpdate = false;

		if (headerWrapper.length > 0) {
			headerNeedsUpdate = newHeader !== headerWrapper[0].innerHTML;
		}

		var tempContentWrapper = document.createElement("div");
		tempContentWrapper.appendChild(newContent);
		contentNeedsUpdate = tempContentWrapper.innerHTML !== contentWrapper[0].innerHTML;

		return headerNeedsUpdate || contentNeedsUpdate;
	};

	/* moduleNeedsUpdate(module, newContent)
	 * Update the content of a module on screen.
	 *
	 * argument module Module - The module to check.
	 * argument newHeader String - The new header that is generated.
	 * argument newContent Domobject - The new content that is generated.
	 */
	var updateModuleContent = function(module, newHeader, newContent) {
		var moduleWrapper = document.getElementById(module.identifier);
		var headerWrapper = moduleWrapper.getElementsByClassName("module-header");
		var contentWrapper = moduleWrapper.getElementsByClassName("module-content");

		contentWrapper[0].innerHTML = "";
		contentWrapper[0].appendChild(newContent);

		if( headerWrapper.length > 0 && newHeader) {
			headerWrapper[0].innerHTML = newHeader;
		}
	};

	/* hideModule(module, speed, callback)
	 * Hide the module.
	 *
	 * argument module Module - The module to hide.
	 * argument speed Number - The speed of the hide animation.
	 * argument callback function - Called when the animation is done.
	 */
	var hideModule = function(module, speed, callback, options) {
		options = options || {};

		// set lockString if set in options.
		if (options.lockString) {
			// Log.log("Has lockstring: " + options.lockString);
			if (module.lockStrings.indexOf(options.lockString) === -1) {
				module.lockStrings.push(options.lockString);
			}
		}

		var moduleWrapper = document.getElementById(module.identifier);
		if (moduleWrapper !== null) {
			moduleWrapper.style.transition = "opacity " + speed / 1000 + "s";
			moduleWrapper.style.opacity = 0;

			clearTimeout(module.showHideTimer);
			module.showHideTimer = setTimeout(function() {
				// To not take up any space, we just make the position absolute.
				// since it's fade out anyway, we can see it lay above or
				// below other modules. This works way better than adjusting
				// the .display property.
				moduleWrapper.style.position = "fixed";

				updateWrapperStates();

				if (typeof callback === "function") { callback(); }
			}, speed);
		} else {
			// invoke callback even if no content, issue 1308
			if (typeof callback === "function") { callback(); }
		}
	};

	/* showModule(module, speed, callback)
	 * Show the module.
	 *
	 * argument module Module - The module to show.
	 * argument speed Number - The speed of the show animation.
	 * argument callback function - Called when the animation is done.
	 */
	var showModule = function(module, speed, callback, options) {
		options = options || {};

		// remove lockString if set in options.
		if (options.lockString) {
			var index = module.lockStrings.indexOf(options.lockString);
			if ( index !== -1) {
				module.lockStrings.splice(index, 1);
			}
		}

		// Check if there are no more lockstrings set, or the force option is set.
		// Otherwise cancel show action.
		if (module.lockStrings.length !== 0 && options.force !== true) {
			Log.log("Will not show " + module.name + ". LockStrings active: " + module.lockStrings.join(","));
			return;
		}

		module.hidden = false;

		// If forced show, clean current lockstrings.
		if (module.lockStrings.length !== 0 && options.force === true) {
			Log.log("Force show of module: " + module.name);
			module.lockStrings = [];
		}

		var moduleWrapper = document.getElementById(module.identifier);
		if (moduleWrapper !== null) {
			moduleWrapper.style.transition = "opacity " + speed / 1000 + "s";
			// Restore the postition. See hideModule() for more info.
			moduleWrapper.style.position = "static";

			updateWrapperStates();

			// Waiting for DOM-changes done in updateWrapperStates before we can start the animation.
			var dummy = moduleWrapper.parentElement.parentElement.offsetHeight;
			moduleWrapper.style.opacity = 1;

			clearTimeout(module.showHideTimer);
			module.showHideTimer = setTimeout(function() {
				if (typeof callback === "function") { callback(); }
			}, speed);

		}
	};

	/* updateWrapperStates()
	 * Checks for all positions if it has visible content.
	 * If not, if will hide the position to prevent unwanted margins.
	 * This method schould be called by the show and hide methods.
	 *
	 * Example:
	 * If the top_bar only contains the update notification. And no update is available,
	 * the update notification is hidden. The top bar still occupies space making for
	 * an ugly top margin. By using this function, the top bar will be hidden if the
	 * update notification is not visible.
	 */

	var updateWrapperStates = function() {
		var positions = ["top_bar", "top_left", "top_center", "top_right", "upper_third", "middle_center", "lower_third", "bottom_left", "bottom_center", "bottom_right", "bottom_bar", "fullscreen_above", "fullscreen_below"];

		positions.forEach(function(position) {
			var wrapper = selectWrapper(position);
			var moduleWrappers = wrapper.getElementsByClassName("module");

			var showWrapper = false;
			Array.prototype.forEach.call(moduleWrappers, function(moduleWrapper) {
				if (moduleWrapper.style.position == "" || moduleWrapper.style.position == "static") {
					showWrapper = true;
				}
			});

			wrapper.style.display = showWrapper ? "block" : "none";
		});
	};

	/* loadConfig()
	 * Loads the core config and combines it with de system defaults.
	 */
	var loadConfig = function() {
		if (typeof config === "undefined") {
			config = defaults;
			Log.error("Config file is missing! Please create a config file.");
			return;
		}

		config = Object.assign({}, defaults, config);
	};

	/* setSelectionMethodsForModules()
	 * Adds special selectors on a collection of modules.
	 *
	 * argument modules array - Array of modules.
	 */
	var setSelectionMethodsForModules = function(modules) {

		/* withClass(className)
		 * calls modulesByClass to filter modules with the specified classes.
		 *
		 * argument className string/array - one or multiple classnames. (array or space divided)
		 *
		 * return array - Filtered collection of modules.
		 */
		var withClass = function(className) {
			return modulesByClass(className, true);
		};

		/* exceptWithClass(className)
		 * calls modulesByClass to filter modules without the specified classes.
		 *
		 * argument className string/array - one or multiple classnames. (array or space divided)
		 *
		 * return array - Filtered collection of modules.
		 */
		var exceptWithClass  = function(className) {
			return modulesByClass(className, false);
		};

		/* modulesByClass(className, include)
		 * filters a collection of modules based on classname(s).
		 *
		 * argument className string/array - one or multiple classnames. (array or space divided)
		 * argument include boolean - if the filter should include or exclude the modules with the specific classes.
		 *
		 * return array - Filtered collection of modules.
		 */
		var modulesByClass = function(className, include) {
			var searchClasses = className;
			if (typeof className === "string") {
				searchClasses = className.split(" ");
			}

			var newModules = modules.filter(function(module) {
				var classes = module.data.classes.toLowerCase().split(" ");

				for (var c in searchClasses) {
					var searchClass = searchClasses[c];
					if (classes.indexOf(searchClass.toLowerCase()) !== -1) {
						return include;
					}
				}

				return !include;
			});

			setSelectionMethodsForModules(newModules);
			return newModules;
		};

		/* exceptModule(module)
		 * Removes a module instance from the collection.
		 *
		 * argument module Module object - The module instance to remove from the collection.
		 *
		 * return array - Filtered collection of modules.
		 */
		var exceptModule = function(module) {
			var newModules = modules.filter(function(mod) {
				return mod.identifier !== module.identifier;
			});

			setSelectionMethodsForModules(newModules);
			return newModules;
		};

		/* enumerate(callback)
		 * Walks thru a collection of modules and executes the callback with the module as an argument.
		 *
		 * argument callback function - The function to execute with the module as an argument.
		 */
		var enumerate = function(callback) {
			modules.map(function(module) {
				callback(module);
			});
		};

		if (typeof modules.withClass === "undefined") { Object.defineProperty(modules, "withClass",  {value: withClass, enumerable: false}); }
		if (typeof modules.exceptWithClass === "undefined") { Object.defineProperty(modules, "exceptWithClass",  {value: exceptWithClass, enumerable: false}); }
		if (typeof modules.exceptModule === "undefined") { Object.defineProperty(modules, "exceptModule",  {value: exceptModule, enumerable: false}); }
		if (typeof modules.enumerate === "undefined") { Object.defineProperty(modules, "enumerate",  {value: enumerate, enumerable: false}); }
	};

	return {
		/* Public Methods */

		/* init()
		 * Main init method.
		 */
		init: function() {
			Log.info("Initializing MagicMirror.");
			loadConfig();
			Translator.loadCoreTranslations(config.language);
			Loader.loadModules();
		},

		/* modulesStarted(moduleObjects)
		 * Gets called when all modules are started.
		 *
		 * argument moduleObjects array<Module> - All module instances.
		 */
		modulesStarted: function(moduleObjects) {
			modules = [];
			for (var m in moduleObjects) {
				var module = moduleObjects[m];
				modules[module.data.index] = module;
			}

			Log.info("All modules started!");
			sendNotification("ALL_MODULES_STARTED");

			createDomObjects();
		},

		/* sendNotification(notification, payload, sender)
		 * Send a notification to all modules.
		 *
		 * argument notification string - The identifier of the noitication.
		 * argument payload mixed - The payload of the notification.
		 * argument sender Module - The module that sent the notification.
		 */
		sendNotification: function(notification, payload, sender) {
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

		/* updateDom(module, speed)
		 * Update the dom for a specific module.
		 *
		 * argument module Module - The module that needs an update.
		 * argument speed Number - The number of microseconds for the animation. (optional)
		 */
		updateDom: function(module, speed) {
			if (!(module instanceof Module)) {
				Log.error("updateDom: Sender should be a module.");
				return;
			}

			// Further implementation is done in the private method.
			updateDom(module, speed);
		},

		/* getModules(module, speed)
		 * Returns a collection of all modules currently active.
		 *
		 * return array - A collection of all modules currently active.
		 */
		getModules: function() {
			setSelectionMethodsForModules(modules);
			return modules;
		},

		/* hideModule(module, speed, callback)
		 * Hide the module.
		 *
		 * argument module Module - The module hide.
		 * argument speed Number - The speed of the hide animation.
		 * argument callback function - Called when the animation is done.
		 * argument options object - Optional settings for the hide method.
		 */
		hideModule: function(module, speed, callback, options) {
			module.hidden = true;
			hideModule(module, speed, callback, options);
		},

		/* showModule(module, speed, callback)
		 * Show the module.
		 *
		 * argument module Module - The module show.
		 * argument speed Number - The speed of the show animation.
		 * argument callback function - Called when the animation is done.
		 * argument options object - Optional settings for the hide method.
		 */
		showModule: function(module, speed, callback, options) {
			// do not change module.hidden yet, only if we really show it later
			showModule(module, speed, callback, options);
		}
	};

})();

// Add polyfill for Object.assign.
if (typeof Object.assign != "function") {
	(function() {
		Object.assign = function(target) {
			"use strict";
			if (target === undefined || target === null) {
				throw new TypeError("Cannot convert undefined or null to object");
			}
			var output = Object(target);
			for (var index = 1; index < arguments.length; index++) {
				var source = arguments[index];
				if (source !== undefined && source !== null) {
					for (var nextKey in source) {
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
