/* global Log, Class, Loader, Class , MM */
/* exported Module */

/* Magic Mirror
 * Module Blueprint.
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var Module = Class.extend({

	/*********************************************************
	 * All methods (and properties) below can be subclassed. *
	 *********************************************************/

	// Set the minimum MagicMirror module version for this module.
	requiresVersion: "2.0.0",

	// Module config defaults.
	defaults: {},

	// Timer reference used for showHide animation callbacks.
	showHideTimer: null,

	// Array to store lockStrings. These strings are used to lock
	// visibility when hiding and showing module.
	lockStrings: [],

	// Storage of the nunjuck Environment,
	// This should not be referenced directly.
	// Use the nunjucksEnvironment() to get it.
	_nunjucksEnvironment: null,

	/* init()
	 * Is called when the module is instantiated.
	 */
	init: function () {
		//Log.log(this.defaults);
	},

	/* start()
	 * Is called when the module is started.
	 */
	start: function () {
		Log.info("Starting module: " + this.name);
	},

	/* getScripts()
	 * Returns a list of scripts the module requires to be loaded.
	 *
	 * return Array<String> - An array with filenames.
	 */
	getScripts: function () {
		return [];
	},

	/* getStyles()
	 * Returns a list of stylesheets the module requires to be loaded.
	 *
	 * return Array<String> - An array with filenames.
	 */
	getStyles: function () {
		return [];
	},

	/* getTranslations()
	 * Returns a map of translation files the module requires to be loaded.
	 *
	 * return Map<String, String> - A map with langKeys and filenames.
	 */
	getTranslations: function () {
		return false;
	},

	/* getDom()
	 * This method generates the dom which needs to be displayed. This method is called by the Magic Mirror core.
	 * This method can to be subclassed if the module wants to display info on the mirror.
	 * Alternatively, the getTemplate method could be subclassed.
	 *
	 * return DomObject | Promise - The dom or a promise with the dom to display.
	 */
	getDom: function () {
		var self = this;
		return new Promise(function(resolve) {
			var div = document.createElement("div");
			var template = self.getTemplate();
			var templateData = self.getTemplateData();

			// Check to see if we need to render a template string or a file.
			if (/^.*((\.html)|(\.njk))$/.test(template)) {
				// the template is a filename
				self.nunjucksEnvironment().render(template, templateData, function (err, res) {
					if (err) {
						Log.error(err);
					}

					div.innerHTML = res;

					resolve(div);
				});
			} else {
				// the template is a template string.
				div.innerHTML = self.nunjucksEnvironment().renderString(template, templateData);

				resolve(div);
			}
		});
	},

	/* getHeader()
	 * This method generates the header string which needs to be displayed if a user has a header configured for this module.
	 * This method is called by the Magic Mirror core, but only if the user has configured a default header for the module.
	 * This method needs to be subclassed if the module wants to display modified headers on the mirror.
	 *
	 * return string - The header to display above the header.
	 */
	getHeader: function () {
		return this.data.header;
	},

	/* getTemplate()
	 * This method returns the template for the module which is used by the default getDom implementation.
	 * This method needs to be subclassed if the module wants to use a template.
	 * It can either return a template sting, or a template filename.
	 * If the string ends with '.html' it's considered a file from within the module's folder.
	 *
	 * return string - The template string of filename.
	 */
	getTemplate: function () {
		return "<div class=\"normal\">" + this.name + "</div><div class=\"small dimmed\">" + this.identifier + "</div>";
	},

	/* getTemplateData()
	 * This method returns the data to be used in the template.
	 * This method needs to be subclassed if the module wants to use a custom data.
	 *
	 * return Object
	 */
	getTemplateData: function () {
		return {};
	},

	/* notificationReceived(notification, payload, sender)
	 * This method is called when a notification arrives.
	 * This method is called by the Magic Mirror core.
	 *
	 * argument notification string - The identifier of the notification.
	 * argument payload mixed - The payload of the notification.
	 * argument sender Module - The module that sent the notification.
	 */
	notificationReceived: function (notification, payload, sender) {
		if (sender) {
			Log.log(this.name + " received a module notification: " + notification + " from sender: " + sender.name);
		} else {
			Log.log(this.name + " received a system notification: " + notification);
		}
	},

	/** nunjucksEnvironment()
	 * Returns the nunjucks environment for the current module.
	 * The environment is checked in the _nunjucksEnvironment instance variable.

	 * @returns Nunjucks Environment
	 */
	nunjucksEnvironment: function() {
		if (this._nunjucksEnvironment !== null) {
			return this._nunjucksEnvironment;
		}

		var self = this;

		this._nunjucksEnvironment = new nunjucks.Environment(new nunjucks.WebLoader(this.file(""), {async: true}), {
			trimBlocks: true,
			lstripBlocks: true
		});
		this._nunjucksEnvironment.addFilter("translate", function(str) {
			return self.translate(str);
		});

		return this._nunjucksEnvironment;
	},

	/* socketNotificationReceived(notification, payload)
	 * This method is called when a socket notification arrives.
	 *
	 * argument notification string - The identifier of the notification.
	 * argument payload mixed - The payload of the notification.
	 */
	socketNotificationReceived: function (notification, payload) {
		Log.log(this.name + " received a socket notification: " + notification + " - Payload: " + payload);
	},

	/* suspend()
	 * This method is called when a module is hidden.
	 */
	suspend: function () {
		Log.log(this.name + " is suspended.");
	},

	/* resume()
	 * This method is called when a module is shown.
	 */
	resume: function () {
		Log.log(this.name + " is resumed.");
	},

	/*********************************************
	 * The methods below don"t need subclassing. *
	 *********************************************/

	/* setData(data)
	 * Set the module data.
	 *
	 * argument data object - Module data.
	 */
	setData: function (data) {
		this.data = data;
		this.name = data.name;
		this.identifier = data.identifier;
		this.hidden = false;

		this.setConfig(data.config);
	},

	/* setConfig(config)
	 * Set the module config and combine it with the module defaults.
	 *
	 * argument config object - Module config.
	 */
	setConfig: function (config) {
		this.config = Object.assign({}, this.defaults, config);
	},

	/* socket()
	 * Returns a socket object. If it doesn't exist, it"s created.
	 * It also registers the notification callback.
	 */
	socket: function () {
		if (typeof this._socket === "undefined") {
			this._socket = this._socket = new MMSocket(this.name);
		}

		var self = this;
		this._socket.setNotificationCallback(function (notification, payload) {
			self.socketNotificationReceived(notification, payload);
		});

		return this._socket;
	},

	/* file(file)
	 * Retrieve the path to a module file.
	 *
	 * argument file string - Filename.
	 *
	 * return string - File path.
	 */
	file: function (file) {
		return (this.data.path + "/" + file).replace("//", "/");
	},

	/* loadStyles()
	 * Load all required stylesheets by requesting the MM object to load the files.
	 *
	 * argument callback function - Function called when done.
	 */
	loadStyles: function (callback) {
		this.loadDependencies("getStyles", callback);
	},

	/* loadScripts()
	 * Load all required scripts by requesting the MM object to load the files.
	 *
	 * argument callback function - Function called when done.
	 */
	loadScripts: function (callback) {
		this.loadDependencies("getScripts", callback);
	},

	/* loadDependencies(funcName, callback)
	 * Helper method to load all dependencies.
	 *
	 * argument funcName string - Function name to call to get scripts or styles.
	 * argument callback function - Function called when done.
	 */
	loadDependencies: function (funcName, callback) {
		var self = this;
		var dependencies = this[funcName]();

		var loadNextDependency = function () {
			if (dependencies.length > 0) {
				var nextDependency = dependencies[0];
				Loader.loadFile(nextDependency, self, function () {
					dependencies = dependencies.slice(1);
					loadNextDependency();
				});
			} else {
				callback();
			}
		};

		loadNextDependency();
	},

	/* loadScripts()
	 * Load all required scripts by requesting the MM object to load the files.
	 *
	 * argument callback function - Function called when done.
	 */
	loadTranslations: function (callback) {
		var self = this;
		var translations = this.getTranslations();
		var lang = config.language.toLowerCase();

		// The variable `first` will contain the first
		// defined translation after the following line.
		for (var first in translations) { break; }

		if (translations) {
			var translationFile = translations[lang] || undefined;
			var translationsFallbackFile = translations[first];

			// If a translation file is set, load it and then also load the fallback translation file.
			// Otherwise only load the fallback translation file.
			if (translationFile !== undefined && translationFile !== translationsFallbackFile) {
				Translator.load(self, translationFile, false, function () {
					Translator.load(self, translationsFallbackFile, true, callback);
				});
			} else {
				Translator.load(self, translationsFallbackFile, true, callback);
			}
		} else {
			callback();
		}
	},

	/* translate(key, defaultValueOrVariables, defaultValue)
	 * Request the translation for a given key with optional variables and default value.
	 *
	 * argument key string - The key of the string to translate
     * argument defaultValueOrVariables string/object - The default value or variables for translating. (Optional)
     * argument defaultValue string - The default value with variables. (Optional)
	 */
	translate: function (key, defaultValueOrVariables, defaultValue) {
		if(typeof defaultValueOrVariables === "object") {
			return Translator.translate(this, key, defaultValueOrVariables) || defaultValue || "";
		}
		return Translator.translate(this, key) || defaultValueOrVariables || "";
	},

	/* updateDom(speed)
	 * Request an (animated) update of the module.
	 *
	 * argument speed Number - The speed of the animation. (Optional)
	 */
	updateDom: function (speed) {
		MM.updateDom(this, speed);
	},

	/* sendNotification(notification, payload)
	 * Send a notification to all modules.
	 *
	 * argument notification string - The identifier of the notification.
	 * argument payload mixed - The payload of the notification.
	 */
	sendNotification: function (notification, payload) {
		MM.sendNotification(notification, payload, this);
	},

	/* sendSocketNotification(notification, payload)
	 * Send a socket notification to the node helper.
	 *
	 * argument notification string - The identifier of the notification.
	 * argument payload mixed - The payload of the notification.
	 */
	sendSocketNotification: function (notification, payload) {
		this.socket().sendNotification(notification, payload);
	},

	/* hideModule(module, speed, callback)
	 * Hide this module.
	 *
	 * argument speed Number - The speed of the hide animation.
	 * argument callback function - Called when the animation is done.
	 * argument options object - Optional settings for the hide method.
	 */
	hide: function (speed, callback, options) {
		if (typeof callback === "object") {
			options = callback;
			callback = function () { };
		}

		callback = callback || function () { };
		options = options || {};

		var self = this;
		MM.hideModule(self, speed, function () {
			self.suspend();
			callback();
		}, options);
	},

	/* showModule(module, speed, callback)
	 * Show this module.
	 *
	 * argument speed Number - The speed of the show animation.
	 * argument callback function - Called when the animation is done.
	 * argument options object - Optional settings for the hide method.
	 */
	show: function (speed, callback, options) {
		if (typeof callback === "object") {
			options = callback;
			callback = function () { };
		}

		callback = callback || function () { };
		options = options || {};

		this.resume();
		MM.showModule(this, speed, callback, options);
	}
});

Module.definitions = {};

Module.create = function (name) {

	// Make sure module definition is available.
	if (!Module.definitions[name]) {
		return;
	}

	var moduleDefinition = Module.definitions[name];
	var clonedDefinition = cloneObject(moduleDefinition);

	// Note that we clone the definition. Otherwise the objects are shared, which gives problems.
	var ModuleClass = Module.extend(clonedDefinition);

	return new ModuleClass();
};

/* cmpVersions(a,b)
* Compare two semantic version numbers and return the difference.
*
* argument a string - Version number a.
* argument a string - Version number b.
*/
function cmpVersions(a, b) {
	var i, diff;
	var regExStrip0 = /(\.0+)+$/;
	var segmentsA = a.replace(regExStrip0, "").split(".");
	var segmentsB = b.replace(regExStrip0, "").split(".");
	var l = Math.min(segmentsA.length, segmentsB.length);

	for (i = 0; i < l; i++) {
		diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
		if (diff) {
			return diff;
		}
	}
	return segmentsA.length - segmentsB.length;
}

Module.register = function (name, moduleDefinition) {

	if (moduleDefinition.requiresVersion) {
		Log.log("Check MagicMirror version for module '" + name + "' - Minimum version:  " + moduleDefinition.requiresVersion + " - Current version: " + version);
		if (cmpVersions(version, moduleDefinition.requiresVersion) >= 0) {
			Log.log("Version is ok!");
		} else {
			Log.log("Version is incorrect. Skip module: '" + name + "'");
			return;
		}
	}
	Log.log("Module registered: " + name);
	Module.definitions[name] = moduleDefinition;
};
