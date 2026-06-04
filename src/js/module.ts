/*
 * Module Blueprint.
 * @typedef {Object} Module
 */
class Module {

	/*
	 * `defaults` and `requiresVersion` live on the prototype (assigned after the class
	 * body) rather than as instance fields, so a module definition can shadow them via
	 * Module.extend. Declared here for typing only.
	 */
	declare defaults: any;

	declare requiresVersion: string;

	// Per-instance state.
	showHideTimer: any = null;

	lockStrings: string[] = [];

	_nunjucksEnvironment: any = null;

	data: any = null;

	name = "";

	identifier = "";

	hidden = false;

	hasAnimateIn: string | false = false;

	hasAnimateOut: string | false = false;

	config: any;

	_socket: any;

	_super: any;

	/**
	 *********************************************************
	 * All methods (and properties) below can be overridden. *
	 *********************************************************
	 */

	/**
	 * Called when the module is instantiated.
	 */
	init (): void {
	}

	/**
	 * Called when the module is started.
	 */
	start (): void {
		Log.info(`Starting module: ${this.name}`);
	}

	/**
	 * Returns a list of scripts the module requires to be loaded.
	 * @returns {string[]} An array with filenames.
	 */
	getScripts (): string[] {
		return [];
	}

	/**
	 * Returns a list of stylesheets the module requires to be loaded.
	 * @returns {string[]} An array with filenames.
	 */
	getStyles (): string[] {
		return [];
	}

	/**
	 * Returns a map of translation files the module requires to be loaded.
	 *
	 * return Map<String, String> -
	 * @returns {Map} A map with langKeys and filenames.
	 */
	getTranslations (): any {
		return false;
	}

	/**
	 * Generates the dom which needs to be displayed. This method is called by the MagicMirror² core.
	 * This method can to be overridden if the module wants to display info on the mirror.
	 * Alternatively, the getTemplate method could be overridden.
	 * @returns {HTMLElement|Promise} The dom or a promise with the dom to display.
	 */
	getDom (): any {
		return new Promise((resolve) => {
			const div = document.createElement("div");
			const template = this.getTemplate();
			const templateData = this.getTemplateData();

			// Check to see if we need to render a template string or a file.
			if ((/^.*((\.html)|(\.njk))$/).test(template)) {
				// the template is a filename
				this.nunjucksEnvironment().render(template, templateData, function (err: any, res: any) {
					if (err) {
						Log.error(err);
					}

					div.innerHTML = res;

					resolve(div);
				});
			} else {
				// the template is a template string.
				div.innerHTML = this.nunjucksEnvironment().renderString(template, templateData);

				resolve(div);
			}
		});
	}

	/**
	 * Generates the header string which needs to be displayed if a user has a header configured for this module.
	 * This method is called by the MagicMirror² core, but only if the user has configured a default header for the module.
	 * This method needs to be overridden if the module wants to display modified headers on the mirror.
	 * @returns {string} The header to display above the header.
	 */
	getHeader (): string {
		return this.data.header;
	}

	/**
	 * Returns the template for the module which is used by the default getDom implementation.
	 * This method needs to be overridden if the module wants to use a template.
	 * It can either return a template string, or a template filename.
	 * If the string ends with '.html' it's considered a file from within the module's folder.
	 * @returns {string} The template string of filename.
	 */
	getTemplate (): string {
		return `<div class="normal">${this.name}</div><div class="small dimmed">${this.identifier}</div>`;
	}

	/**
	 * Returns the data to be used in the template.
	 * This method needs to be overridden if the module wants to use a custom data.
	 * @returns {object} The data for the template
	 */
	getTemplateData (): object {
		return {};
	}

	/**
	 * Called by the MagicMirror² core when a notification arrives.
	 * @param {string} notification The identifier of the notification.
	 * @param {object} payload The payload of the notification.
	 * @param {Module} sender The module that sent the notification.
	 */
	notificationReceived (notification: string, _payload: any, sender: any): void {
		if (sender) {
			Log.debug(`${this.name} received a module notification: ${notification} from sender: ${sender.name}`);
		} else {
			Log.debug(`${this.name} received a system notification: ${notification}`);
		}
	}

	/**
	 * Returns the nunjucks environment for the current module.
	 * The environment is checked in the _nunjucksEnvironment instance variable.
	 * @returns {object} The Nunjucks Environment
	 */
	nunjucksEnvironment (): any {
		if (this._nunjucksEnvironment !== null) {
			return this._nunjucksEnvironment;
		}

		this._nunjucksEnvironment = new nunjucks.Environment(new nunjucks.WebLoader(this.file(""), { async: true }), {
			trimBlocks: true,
			lstripBlocks: true
		});

		this._nunjucksEnvironment.addFilter("translate", (str: string, variables: any) => {
			return nunjucks.runtime.markSafe(this.translate(str, variables));
		});

		return this._nunjucksEnvironment;
	}

	/**
	 * Called when a socket notification arrives.
	 * @param {string} notification The identifier of the notification.
	 * @param {object} payload The payload of the notification.
	 */
	socketNotificationReceived (notification: string, payload: any): void {
		Log.log(`${this.name} received a socket notification: ${notification} - Payload: ${payload}`);
	}

	/**
	 * Called when the module is hidden.
	 */
	suspend (): void {
		Log.log(`${this.name} is suspended.`);
	}

	/**
	 * Called when the module is shown.
	 */
	resume (): void {
		Log.log(`${this.name} is resumed.`);
	}

	/**
	 ***********************************************
	 * The methods below should not be overridden. *
	 ***********************************************
	 */

	/**
	 * Set the module data.
	 * @param {object} data The module data
	 */
	setData (data: any): void {
		this.data = data;
		this.name = data.name;
		this.identifier = data.identifier;
		this.hidden = false;
		this.hasAnimateIn = false;
		this.hasAnimateOut = false;

		this.setConfig(data.config, data.configDeepMerge);
	}

	/**
	 * Set the module config and combine it with the module defaults.
	 * @param {object} config The combined module config.
	 * @param {boolean} deep Merge module config in deep.
	 */
	setConfig (config: any, deep: boolean): void {
		this.config = deep ? configMerge({}, this.defaults, config) : Object.assign({}, this.defaults, config);
	}

	/**
	 * Returns a socket object. If it doesn't exist, it's created.
	 * It also registers the notification callback.
	 * @returns {MMSocket} a socket object
	 */
	socket (): any {
		if (typeof this._socket === "undefined") {
			this._socket = new (MMSocket as any)(this.name);
		}

		this._socket.setNotificationCallback((notification: string, payload: any) => {
			this.socketNotificationReceived(notification, payload);
		});

		return this._socket;
	}

	/**
	 * Retrieve the path to a module file.
	 * @param {string} file Filename
	 * @returns {string} the file path
	 */
	file (file: string): string {
		return `${this.data.path}/${file}`.replace("//", "/");
	}

	/**
	 * Load all required stylesheets by requesting the MM object to load the files.
	 * @returns {Promise<void>}
	 */
	loadStyles (): Promise<void> {
		return this.loadDependencies("getStyles");
	}

	/**
	 * Load all required scripts by requesting the MM object to load the files.
	 * @returns {Promise<void>}
	 */
	loadScripts (): Promise<void> {
		return this.loadDependencies("getScripts");
	}

	/**
	 * Helper method to load all dependencies.
	 * @param {string} funcName Function name to call to get scripts or styles.
	 * @returns {Promise<void>}
	 */
	async loadDependencies (funcName: string): Promise<void> {
		let dependencies = (this as any)[funcName]();

		const loadNextDependency = async () => {
			if (dependencies.length > 0) {
				const nextDependency = dependencies[0];
				await Loader.loadFileForModule(nextDependency, this);
				dependencies = dependencies.slice(1);
				await loadNextDependency();
			} else {
				return Promise.resolve();
			}
		};

		await loadNextDependency();
	}

	/**
	 * Load all translations.
	 * @returns {Promise<void>}
	 */
	async loadTranslations (): Promise<any> {
		const translations = this.getTranslations() || {};
		const language = config.language.toLowerCase();

		const languages = Object.keys(translations);

		if (languages.length === 0) {
			return;
		}

		const fallbackLanguage = languages[0]!;
		const translationFile = translations[language];
		const translationsFallbackFile = translations[fallbackLanguage];

		if (!translationFile) {
			return Translator.load(this, translationsFallbackFile, true);
		}

		await Translator.load(this, translationFile, false);

		if (translationFile !== translationsFallbackFile) {
			return Translator.load(this, translationsFallbackFile, true);
		}
	}

	/**
	 * Request the translation for a given key with optional variables and default value.
	 * @param {string} key The key of the string to translate
	 * @param {string|object} [defaultValueOrVariables] The default value or variables for translating.
	 * @param {string} [defaultValue] The default value with variables.
	 * @returns {string} the translated key
	 */
	translate (key: string, defaultValueOrVariables?: any, defaultValue?: string): string {
		if (typeof defaultValueOrVariables === "object") {
			return Translator.translate(this, key, defaultValueOrVariables) || defaultValue || "";
		}
		return Translator.translate(this, key) || defaultValueOrVariables || "";
	}

	/**
	 * Request an (animated) update of the module.
	 * @param {number|object} [updateOptions] The speed of the animation or object with for updateOptions (speed/animates)
	 */
	updateDom (updateOptions?: any): void {
		MM.updateDom(this, updateOptions);
	}

	/**
	 * Send a notification to all modules.
	 * @param {string} notification The identifier of the notification.
	 * @param {object} payload The payload of the notification.
	 */
	sendNotification (notification: string, payload: any): void {
		MM.sendNotification(notification, payload, this);
	}

	/**
	 * Send a socket notification to the node helper.
	 * @param {string} notification The identifier of the notification.
	 * @param {object} payload The payload of the notification.
	 */
	sendSocketNotification (notification: string, payload: any): void {
		this.socket().sendNotification(notification, payload);
	}

	/**
	 * Hide this module.
	 * @param {number} speed The speed of the hide animation.
	 * @param {Promise} callback Called when the animation is done.
	 * @param {object} [options] Optional settings for the hide method.
	 */
	hide (speed: number, callback: any, options: any = {}): void {
		let usedCallback = callback || function () { /* no-op */ };
		let usedOptions = options;

		if (typeof callback === "object") {
			Log.error("Parameter mismatch in module.hide: callback is not an optional parameter!");
			usedOptions = callback;
			usedCallback = function () { /* no-op */ };
		}

		MM.hideModule(
			this,
			speed,
			() => {
				this.suspend();
				usedCallback();
			},
			usedOptions
		);
	}

	/**
	 * Show this module.
	 * @param {number} speed The speed of the show animation.
	 * @param {Promise} callback Called when the animation is done.
	 * @param {object} [options] Optional settings for the show method.
	 */
	show (speed: number, callback: any, options?: any): void {
		let usedCallback = callback || function () { /* no-op */ };
		let usedOptions = options;

		if (typeof callback === "object") {
			Log.error("Parameter mismatch in module.show: callback is not an optional parameter!");
			usedOptions = callback;
			usedCallback = function () { /* no-op */ };
		}

		MM.showModule(
			this,
			speed,
			() => {
				this.resume();
				usedCallback();
			},
			usedOptions
		);
	}

	/*
	 * Registered module definitions, keyed by module name.
	 */
	static definitions: Record<string, any> = {};

	/**
	 * Build a Module subclass from a (cloned) definition object, applying its
	 * properties/methods over the base. A method that references `this._super` is
	 * wrapped so `_super()` calls the overridden base method — the same contract the
	 * previous Class.extend (John Resig) inheritance provided.
	 * @param {object} definition The module definition object.
	 * @returns {typeof Module} A Module subclass.
	 */
	static extend (definition: any): typeof Module {
		// Modules extend the Module base exactly one level deep.
		class Subclass extends Module {}
		const prototype: any = Subclass.prototype;
		const parentPrototype: any = Module.prototype;

		for (const name in definition) {
			const value = definition[name];
			if (typeof value === "function" && typeof parentPrototype[name] === "function" && (/\b_super\b/).test(Function.prototype.toString.call(value))) {
				prototype[name] = (function (methodName, fn) {
					return function (this: any, ...args: any[]) {
						const tmp = this._super;

						// Temporarily expose the overridden base method as this._super().
						this._super = parentPrototype[methodName];
						const ret = fn.apply(this, args);
						this._super = tmp;

						return ret;
					};
				}(name, value));
			} else {
				prototype[name] = value;
			}
		}

		return Subclass;
	}

	/**
	 * Instantiate a registered module by name.
	 * @param {string} name The module name.
	 * @returns {Module | undefined} A new module instance, or undefined if unknown.
	 */
	static create (name: string): Module | undefined {
		// Make sure module definition is available.
		if (!Module.definitions[name]) {
			return undefined;
		}

		const moduleDefinition = Module.definitions[name];
		const clonedDefinition = cloneObject(moduleDefinition);

		// Note that we clone the definition. Otherwise the objects are shared, which gives problems.
		const ModuleClass = Module.extend(clonedDefinition);

		return new ModuleClass();
	}

	/**
	 * Register a module definition under the given name.
	 * @param {string} name The module name.
	 * @param {object} moduleDefinition The module definition object.
	 */
	static register (name: string, moduleDefinition: ModuleProperties & ThisType<any>): void {
		if (moduleDefinition.requiresVersion) {
			Log.log(`Check MagicMirror² version for module '${name}' - Minimum version:  ${moduleDefinition.requiresVersion} - Current version: ${window.mmVersion}`);
			if (cmpVersions(window.mmVersion, moduleDefinition.requiresVersion) >= 0) {
				Log.log("Version is ok!");
			} else {
				Log.warn(`Version is incorrect. Skip module: '${name}'`);
				return;
			}
		}
		Log.log(`Module registered: ${name}`);
		Module.definitions[name] = moduleDefinition;
	}

	/**
	 * Instantiate the module — runs the (overridable) init method.
	 */
	constructor () {
		if (this.init) {
			this.init();
		}
	}
}

// Prototype-level defaults so a module definition can override them via Module.extend.
Module.prototype.requiresVersion = "2.0.0";
Module.prototype.defaults = {};

/**
 * Merging MagicMirror² (or other) default/config script by `@bugsounet`
 * Merge 2 objects or/with array
 *
 * Usage:
 * -------
 * this.config = configMerge({}, this.defaults, this.config)
 * -------
 * arg1: initial object
 * arg2: config model
 * arg3: config to merge
 * -------
 * why using it ?
 * Object.assign() function don't to all job
 * it don't merge all thing in deep
 * -> object in object and array is not merging
 * -------
 *
 * Todo: idea of Mich determinate what do you want to merge or not
 * @param {object} result the initial object
 * @returns {object} the merged config
 */
function configMerge (result: any, ..._sources: any[]): any {
	// eslint-disable-next-line prefer-rest-params -- variadic merge reads `arguments`; the rest param exists only so call sites type-check.
	const stack = Array.prototype.slice.call(arguments, 1);
	let item, key;

	while (stack.length) {
		item = stack.shift();
		for (key in item) {
			if (item.hasOwnProperty(key)) {
				if (typeof result[key] === "object" && result[key] && Object.prototype.toString.call(result[key]) !== "[object Array]") {
					if (typeof item[key] === "object" && item[key] !== null) {
						result[key] = configMerge({}, result[key], item[key]);
					} else {
						result[key] = item[key];
					}
				} else {
					result[key] = item[key];
				}
			}
		}
	}
	return result;
}

window.Module = Module;

/**
 * Compare two semantic version numbers and return the difference.
 * @param {string} a Version number a.
 * @param {string} b Version number b.
 * @returns {number} A positive number if a is larger than b, a negative
 * number if a is smaller and 0 if they are the same
 */
function cmpVersions (a: string, b: string): number {
	const regExStrip0 = /(\.0+)+$/;
	const segmentsA = a.replace(regExStrip0, "").split(".");
	const segmentsB = b.replace(regExStrip0, "").split(".");
	const l = Math.min(segmentsA.length, segmentsB.length);

	for (let i = 0; i < l; i++) {
		const diff = parseInt(segmentsA[i]!, 10) - parseInt(segmentsB[i]!, 10);
		if (diff) {
			return diff;
		}
	}
	return segmentsA.length - segmentsB.length;
}
