/* global config, vendor, MM, Log, Module */
/* jshint unused:false */
/* jshint -W061 */


/* Magic Mirror
 * Module and File loaders.
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var Loader = (function() {

	/* Create helper valiables */

	var loadedFiles = [];
	var moduleObjects = [];

	var totalFiles = 0;
	var moduleLoadCount = 0;
	var fileLoadCount = 0;


	/* Private Methods */


	/* loadModules()
	 * Loops thru all modules and requests load for every module.
	 */
	var loadModules = function() {

		var moduleData = getModuleData();

		for (var m in moduleData) {
			var module = moduleData[m];
			loadModule(module);
		}
	};

	/* startModules()
	 * Loops thru all modules and requests start for every module.
	 */
	var startModules = function() {
		for (var m in moduleObjects) {
			var module = moduleObjects[m];
			module.start();
		}

		// Notifiy core of loded modules.
		MM.modulesStarted(moduleObjects);
	};

	/* getAllModules()
	 * Retrieve list of all modules.
	 *
	 * return array - module data as configured in config 
	 */
	var getAllModules = function() {
		return config.modules;
	};

	/* getModuleData()
	 * Generate array with module information including module paths.
	 *
	 * return array - Module information.
	 */
	var getModuleData = function() {
		var modules = getAllModules();
		var moduleFiles = [];

		for (var m in modules) {
			var moduleData = modules[m];
			var module = moduleData.module;

			moduleFiles.push({
				index: m,
				identifier: 'module_' + m + '_' + module,
				name: module,
				path: config.paths.modules + '/' +  module,
				file: module + '.js',
				position: moduleData.position,
				config: moduleData.config
			});


		}

		return moduleFiles;
	};


	/* loadModule(module)
	 * Load modules via ajax request and create module objects.
	 *
	 * argument module object - Information about the module we want to load.
	 */
	var loadModule = function(module) {
		Log.log('Loading module: <' + module.name + '> from: ' + module.path + '/' + module.file);

		var url = module.path + '/' + module.file;
		var moduleRequest = new XMLHttpRequest();
		moduleRequest.open("GET", url, true);
		moduleRequest.onreadystatechange = function() {
		  if(this.readyState === 4) {
			if(this.status === 200) {

				// FIXME: 
				// Create the module by evaluating the response.
				// This might not be the best way.
				var ModuleDefinition = eval(this.response);
				var moduleObject = new ModuleDefinition();
	
				bootstrapModule(module, moduleObject);
				moduleProcessed();
			} else {
				Log.error("Could not load module: " + module.name);
				moduleProcessed();
			}
		  }
		};
		moduleRequest.send();
	};	

	/* bootstrapModule(module, mObj)
	 * Bootstrap modules by setting the module data and loading the scripts & styles.
	 *
	 * argument module object - Information about the module we want to load.
	 * argument mObj object - Modules instance.
	 */
	var bootstrapModule = function(module, mObj) {
		Log.info('Bootstrapping module: ' + module.name);

		mObj.setData(module);

		mObj.loadScripts();
		mObj.loadStyles();

		moduleObjects.push(mObj);
	};

	/* loadFile(fileName)
	 * Load a script or stylesheet by adding it to the dom.
	 *
	 * argument fileName string - Path of the file we want to load.
	 */
	var loadFile = function(fileName) {
		totalFiles++;

		var extension =  fileName.slice((Math.max(0, fileName.lastIndexOf(".")) || Infinity) + 1);

		switch (extension.toLowerCase()) {
			case "js":
				Log.log('Load script: ' + fileName);

				var script = document.createElement("script");
				script.type = "text/javascript";
				script.src = fileName;
				script.onload = function() {
					fileProcessed();
				};

				document.getElementsByTagName("body")[0].appendChild(script);
			break;

			case "css":
				Log.log('Load stylesheet: ' + fileName);

				var stylesheet = document.createElement("link");
				stylesheet.rel = "stylesheet";
				stylesheet.type = "text/css";
				stylesheet.href = fileName;
				stylesheet.onload = function() {
					fileProcessed();
				};

				document.getElementsByTagName("head")[0].appendChild(stylesheet);
			break;				
		}

	};

	/* fileProcessed()
	 * Increase the fileLoadCount and check if we are ready to start all modules.
	 */
	var fileProcessed = function() {
		fileLoadCount++;
		prepareForStart();
	};

	/* moduleProcessed()
	 * Increase the moduleLoadCount and check if we are ready to start all modules.
	 */
	var moduleProcessed = function() {
		moduleLoadCount++;
		prepareForStart();
	};

	/* prepareForStart()
	 * Check if all files and modules are loaded. If so, start all modules.
	 */
	var prepareForStart = function() {
		if (moduleLoadCount !== getAllModules().length) {
			Log.log("Waiting for all modules to be loaded.");
			return;
		}

		if (fileLoadCount !== totalFiles) {
			Log.log("Waiting for all files to be loaded.");
			return;
		}

		Log.info('Ready to start!');
		startModules();
	};

	/* Public Methods */
	return {

		/* loadModules()
		 * Load all modules as defined in the config.
		 */
		loadModules: function() {
			loadModules();
		},

		/* loadFile()
		 * Load a file (script or stylesheet).
		 * Prevent double loading and search for files in the vendor folder.
		 */
		loadFile: function(fileName, module) {

			if (fileName.indexOf(config.paths.modules + '/') === 0) {
				// This is a module specific files.
				// Load it and then return.
				loadFile(fileName);
				return;
			}

			if (fileName.indexOf('/') !== -1) {
				// This is an external file.
				// External files will always be loaded.
				// Load it and then return.
				loadFile(fileName);
				return;
			}

			if (vendor[fileName] !== undefined) {
				// This file is available in the vendor folder.
				// Load it from this vendor folder.
				loadedFiles.push(fileName.toLowerCase());
				loadFile(config.paths.vendor+'/'+vendor[fileName]);
				return;
			}

			if (loadedFiles.indexOf(fileName.toLowerCase()) === -1) {
				// File not loaded yet.
				// Load it based on the module path.
				loadedFiles.push(fileName.toLowerCase());
				loadFile(module.file(fileName));
				return;
			}

			Log.log('File already loaded: ' + fileName);
		}
	};

})();







