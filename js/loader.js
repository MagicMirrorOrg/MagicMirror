/* global defaultModules, vendor */

const Loader = (function () {

	/* Create helper variables */

	const loadedModuleFiles = [];
	const loadedFiles = [];
	const moduleObjects = [];

	/* Private Methods */

	/**
	 * Retrieve object of env variables.
	 * @returns {object} with key: values as assembled in js/server_functions.js
	 */
	const getEnvVars = async function () {
		const res = await fetch(`${location.protocol}//${location.host}${config.basePath}env`);
		return JSON.parse(await res.text());
	};

	/**
	 * Loops through all modules and requests start for every module.
	 */
	const startModules = async function () {
		const modulePromises = [];
		for (const module of moduleObjects) {
			try {
				modulePromises.push(module.start());
			} catch (error) {
				Log.error(`Error when starting node_helper for module ${module.name}:`);
				Log.error(error);
			}
		}

		const results = await Promise.allSettled(modulePromises);

		// Log errors that happened during async node_helper startup
		results.forEach((result) => {
			if (result.status === "rejected") {
				Log.error(result.reason);
			}
		});

		// Notify core of loaded modules.
		MM.modulesStarted(moduleObjects);

		// Starting modules also hides any modules that have requested to be initially hidden
		for (const thisModule of moduleObjects) {
			if (thisModule.data.hiddenOnStartup) {
				Log.info(`Initially hiding ${thisModule.name}`);
				thisModule.hide();
			}
		}
	};

	/**
	 * Retrieve list of all modules.
	 * @returns {object[]} module data as configured in config
	 */
	const getAllModules = function () {
		const AllModules = config.modules.filter((module) => (module.module !== undefined) && (MM.getAvailableModulePositions.indexOf(module.position) > -1 || typeof (module.position) === "undefined"));
		return AllModules;
	};

	/**
	 * Generate array with module information including module paths.
	 * @returns {object[]} Module information.
	 */
	const getModuleData = async function () {
		const modules = getAllModules();
		const moduleFiles = [];
		const envVars = await getEnvVars();

		modules.forEach(function (moduleData, index) {
			const module = moduleData.module;

			const elements = module.split("/");
			const moduleName = elements[elements.length - 1];
			let moduleFolder = `${envVars.modulesDir}/${module}`;

			if (defaultModules.indexOf(moduleName) !== -1) {
				const defaultModuleFolder = `modules/default/${module}`;
				if (window.name !== "jsdom") {
					moduleFolder = defaultModuleFolder;
				} else {
					// running in Jest, allow defaultModules placed under moduleDir for testing
					if (envVars.modulesDir === "modules") {
						moduleFolder = defaultModuleFolder;
					}
				}
			}

			if (moduleData.disabled === true) {
				return;
			}

			moduleFiles.push({
				index: index,
				identifier: `module_${index}_${module}`,
				name: moduleName,
				path: `${moduleFolder}/`,
				file: `${moduleName}.js`,
				position: moduleData.position,
				animateIn: moduleData.animateIn,
				animateOut: moduleData.animateOut,
				hiddenOnStartup: moduleData.hiddenOnStartup,
				header: moduleData.header,
				configDeepMerge: typeof moduleData.configDeepMerge === "boolean" ? moduleData.configDeepMerge : false,
				config: moduleData.config,
				classes: typeof moduleData.classes !== "undefined" ? `${moduleData.classes} ${module}` : module,
				order: (typeof moduleData.order === "number" && Number.isInteger(moduleData.order)) ? moduleData.order : 0
			});
		});

		return moduleFiles;
	};

	/**
	 * Load modules via ajax request and create module objects.
	 * @param {object} module Information about the module we want to load.
	 * @returns {Promise<void>} resolved when module is loaded
	 */
	const loadModule = async function (module) {
		const url = module.path + module.file;

		/**
		 * @returns {Promise<void>}
		 */
		const afterLoad = async function () {
			const moduleObject = Module.create(module.name);
			if (moduleObject) {
				await bootstrapModule(module, moduleObject);
			}
		};

		if (loadedModuleFiles.indexOf(url) !== -1) {
			await afterLoad();
		} else {
			await loadFile(url);
			loadedModuleFiles.push(url);
			await afterLoad();
		}
	};

	/**
	 * Bootstrap modules by setting the module data and loading the scripts & styles.
	 * @param {object} module Information about the module we want to load.
	 * @param {Module} mObj Modules instance.
	 */
	const bootstrapModule = async function (module, mObj) {
		Log.info(`Bootstrapping module: ${module.name}`);
		mObj.setData(module);

		await mObj.loadScripts();
		Log.log(`Scripts loaded for: ${module.name}`);

		await mObj.loadStyles();
		Log.log(`Styles loaded for: ${module.name}`);

		await mObj.loadTranslations();
		Log.log(`Translations loaded for: ${module.name}`);

		moduleObjects.push(mObj);
	};

	/**
	 * Load a script or stylesheet by adding it to the dom.
	 * @param {string} fileName Path of the file we want to load.
	 * @returns {Promise} resolved when the file is loaded
	 */
	const loadFile = async function (fileName) {
		const extension = fileName.slice((Math.max(0, fileName.lastIndexOf(".")) || Infinity) + 1);
		let script, stylesheet;

		switch (extension.toLowerCase()) {
			case "js":
				return new Promise((resolve) => {
					Log.log(`Load script: ${fileName}`);
					script = document.createElement("script");
					script.type = "text/javascript";
					script.src = fileName;
					script.onload = function () {
						resolve();
					};
					script.onerror = function () {
						Log.error("Error on loading script:", fileName);
						script.remove();
						resolve();
					};
					document.getElementsByTagName("body")[0].appendChild(script);
				});
			case "css":
				return new Promise((resolve) => {
					Log.log(`Load stylesheet: ${fileName}`);

					stylesheet = document.createElement("link");
					stylesheet.rel = "stylesheet";
					stylesheet.type = "text/css";
					stylesheet.href = fileName;
					stylesheet.onload = function () {
						resolve();
					};
					stylesheet.onerror = function () {
						Log.error("Error on loading stylesheet:", fileName);
						stylesheet.remove();
						resolve();
					};
					document.getElementsByTagName("head")[0].appendChild(stylesheet);
				});
		}
	};

	/* Public Methods */
	return {

		/**
		 * Load all modules as defined in the config.
		 */
		async loadModules () {
			const moduleData = await getModuleData();
			const envVars = await getEnvVars();
			const customCss = envVars.customCss;

			// Load all modules
			for (const module of moduleData) {
				await loadModule(module);
			}

			// Load custom.css
			// Since this happens after loading the modules,
			// it overwrites the default styles.
			await loadFile(customCss);

			// Start all modules.
			await startModules();
		},

		/**
		 * Load a file (script or stylesheet).
		 * Prevent double loading and search for files in the vendor folder.
		 * @param {string} fileName Path of the file we want to load.
		 * @param {Module} module The module that calls the loadFile function.
		 * @returns {Promise} resolved when the file is loaded
		 */
		async loadFileForModule (fileName, module) {
			if (loadedFiles.indexOf(fileName.toLowerCase()) !== -1) {
				Log.log(`File already loaded: ${fileName}`);
				return;
			}

			if (fileName.indexOf("http://") === 0 || fileName.indexOf("https://") === 0 || fileName.indexOf("/") !== -1) {
				// This is an absolute or relative path.
				// Load it and then return.
				loadedFiles.push(fileName.toLowerCase());
				return loadFile(fileName);
			}

			if (vendor[fileName] !== undefined) {
				// This file is available in the vendor folder.
				// Load it from this vendor folder.
				loadedFiles.push(fileName.toLowerCase());
				return loadFile(`${vendor[fileName]}`);
			}

			// File not loaded yet.
			// Load it based on the module path.
			loadedFiles.push(fileName.toLowerCase());
			return loadFile(module.file(fileName));
		}
	};
}());
