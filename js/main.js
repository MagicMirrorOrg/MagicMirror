/* global  Log, Loader, Module, config, defaults */

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
		for (var m in modules) {
			var module = modules[m];

			if (typeof module.data.position === "string") {

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
					dom.appendChild(moduleHeader);
				}

				var moduleContent = document.createElement("div");
				moduleContent.className = "module-content";
				dom.appendChild(moduleContent);

				updateDom(module, 0);
			}
		}

		sendNotification("DOM_OBJECTS_CREATED");
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
			var wrapper =  parentWrapper[0].getElementsByClassName("container");
			if (wrapper.length > 0) {
				return wrapper[0];
			}
		}
	};

	/* sendNotification(notification, payload, sender)
	 * Send a notification to all modules.
	 *
	 * argument notification string - The identifier of the noitication.
	 * argument payload mixed - The payload of the notification.
	 * argument sender Module - The module that sent the notification.
	 */
	var sendNotification = function(notification, payload, sender) {
		for (var m in modules) {
			var module = modules[m];
			if (module !== sender) {
				module.notificationReceived(notification, payload, sender);
			}
		}
	};

	/* updateDom(module, speed)
	 * Update the dom for a specific module.
	 *
	 * argument module Module - The module that needs an update.
	 * argument speed Number - The number of microseconds for the animation. (optional)
	 */
	var updateDom = function(module, speed) {
		var newContent = module.getDom();

		if (!module.hidden) {

			if (!moduleNeedsUpdate(module, newContent)) {
				return;
			}

			if (!speed) {
				updateModuleContent(module, newContent);
				return;
			}

			hideModule(module, speed / 2, function() {
				updateModuleContent(module, newContent);
				if (!module.hidden) {
					showModule(module, speed / 2);
				}
			});
		} else {
			updateModuleContent(module, newContent);
		}
	};

	/* moduleNeedsUpdate(module, newContent)
	 * Check if the content has changed.
	 *
	 * argument module Module - The module to check.
	 * argument newContent Domobject - The new content that is generated.
	 *
	 * return bool - Does the module need an update?
	 */
	var moduleNeedsUpdate = function(module, newContent) {
		var moduleWrapper = document.getElementById(module.identifier);
		var contentWrapper = moduleWrapper.getElementsByClassName("module-content")[0];

		var tempWrapper = document.createElement("div");
		tempWrapper.appendChild(newContent);

		return tempWrapper.innerHTML !== contentWrapper.innerHTML;
	};

	/* moduleNeedsUpdate(module, newContent)
	 * Update the content of a module on screen.
	 *
	 * argument module Module - The module to check.
	 * argument newContent Domobject - The new content that is generated.
	 */
	var updateModuleContent = function(module, content) {
		var moduleWrapper = document.getElementById(module.identifier);
		var contentWrapper = moduleWrapper.getElementsByClassName("module-content")[0];

		contentWrapper.innerHTML = null;
		contentWrapper.appendChild(content);
	};

	/* hideModule(module, speed, callback)
	 * Hide the module.
	 *
	 * argument module Module - The module to hide.
	 * argument speed Number - The speed of the hide animation.
	 * argument callback function - Called when the animation is done.
	 */
	var hideModule = function(module, speed, callback) {
		var moduleWrapper = document.getElementById(module.identifier);
		if (moduleWrapper !== null) {
			moduleWrapper.style.transition = "opacity " + speed / 1000 + "s";
			moduleWrapper.style.opacity = 0;

			clearTimeout(module.showHideTimer);
			module.showHideTimer = setTimeout(function() {
				// To not take up any space, we just make the position absolute.
				// since it"s fade out anyway, we can see it lay above or
				// below other modules. This works way better than adjusting
				// the .display property.
				moduleWrapper.style.position = "absolute";

				if (typeof callback === "function") { callback(); }
			}, speed);
		}
	};

	/* showModule(module, speed, callback)
	 * Show the module.
	 *
	 * argument module Module - The module to show.
	 * argument speed Number - The speed of the show animation.
	 * argument callback function - Called when the animation is done.
	 */
	var showModule = function(module, speed, callback) {
		var moduleWrapper = document.getElementById(module.identifier);
		if (moduleWrapper !== null) {
			moduleWrapper.style.transition = "opacity " + speed / 1000 + "s";
			// Restore the postition. See hideModule() for more info.
			moduleWrapper.style.position = "static";
			moduleWrapper.style.opacity = 1;

			clearTimeout(module.showHideTimer);
			module.showHideTimer = setTimeout(function() {
				if (typeof callback === "function") { callback(); }
			}, speed);

		}
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

		config = Object.assign(defaults, config);
	};

	/* setSelectionMethodsForModules()
	 * Adds special selectors on a collection of modules.
	 *
	 * argument modules array - Array of modules.
	 */
	var setSelectionMethodsForModules = function(modules) {

		/* withClass(className)
		 * filters a collection of modules based on classname(s).
		 *
		 * argument className string/array - one or multiple classnames. (array or space devided)
		 *
		 * return array - Filtered collection of modules.
		 */
		var withClass = function(className) {
			var newModules = [];

			var searchClasses = className;
			if (typeof className === "string") {
				searchClasses = className.split(" ");
			}

			for (var m in modules) {
				var module = modules[m];
				var classes = module.data.classes.toLowerCase().split(" ");

				for (var c in searchClasses) {
					var searchClass = searchClasses[c];
					if (classes.indexOf(searchClass.toLowerCase()) !== -1) {
						newModules.push(module);
					}
				}
			}

			setSelectionMethodsForModules(newModules);
			return newModules;
		};

		/* exceptWithClass(className)
		 * filters a collection of modules based on classname(s). (NOT)
		 *
		 * argument className string/array - one or multiple classnames. (array or space devided)
		 *
		 * return array - Filtered collection of modules.
		 */
		var exceptWithClass  = function(className) {
			var newModules = [];

			var searchClasses = className;
			if (typeof className === "string") {
				searchClasses = className.split(" ");
			}

			for (var m in modules) {
				var module = modules[m];
				var classes = module.data.classes.toLowerCase().split(" ");
				var foundClass = false;
				for (var c in searchClasses) {
					var searchClass = searchClasses[c];
					if (classes.indexOf(searchClass.toLowerCase()) !== -1) {
						foundClass = true;
						break;
					}
				}
				if (!foundClass) {
					newModules.push(module);
				}
			}

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
			var newModules = [];

			for (var m in modules) {
				var mod = modules[m];
				if (mod.identifier !== module.identifier) {
					newModules.push(mod);
				}
			}

			setSelectionMethodsForModules(newModules);
			return newModules;
		};

		/* enumerate(callback)
		 * Walks thru a collection of modules and executes the callback with the module as an argument.
		 *
		 * argument callback function - The function to execute with the module as an argument.
		 */
		var enumerate = function(callback) {
			for (var m in modules) {
				var module = modules[m];
				callback(module);
			}
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
		 */
		hideModule: function(module, speed, callback) {
			module.hidden = true;
			hideModule(module, speed, callback);
		},

		/* showModule(module, speed, callback)
		 * Show the module.
		 *
		 * argument module Module - The module show.
		 * argument speed Number - The speed of the show animation.
		 * argument callback function - Called when the animation is done.
		 */
		showModule: function(module, speed, callback) {
			module.hidden = false;
			showModule(module, speed, callback);
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
