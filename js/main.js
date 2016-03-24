/* global  Log, Loader, Module, config, defaults */
/* jshint -W020 */

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
			if (module.data.position) {
				var dom = document.createElement("div");
				dom.id = module.identifier;

				var wrapper = selectWrapper(module.data.position);
				wrapper.appendChild(dom);

				dom.appendChild(module.getDom());
			}
		}

		sendNotification('DOM_OBJECTS_CREATED');	
	};

	/* selectWrapper(position)
	 * Select the wrapper dom object for a specific position.
	 *
	 * argument position string - The name of the position.
	 */
	var selectWrapper = function(position) {
		var classes = position.replace('_',' ');
		var parentWrapper = document.getElementsByClassName(classes);
		if (parentWrapper.length > 0) {
			var wrapper =  parentWrapper[0].getElementsByClassName('container');
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
		var wrapper = document.getElementById(module.identifier);

		if (!speed) {
			wrapper.innerHTML = null;
			wrapper.appendChild(module.getDom());
			return;
		}

		wrapper.style.opacity = 1;
		wrapper.style.transition = "opacity " + speed / 2 / 1000 + "s";
		wrapper.style.opacity = 0;

		setTimeout(function() {
			wrapper.innerHTML = null;
			wrapper.appendChild(module.getDom());

			wrapper.style.opacity = 1;			
		}, speed / 2);

	};

	/* loadConfig()
	 * Loads the core config and combines it with de system defaults.
	 */
	var loadConfig = function() {
		if (typeof config === 'undefined') {
			config = defaults;
			Log.error('Config file is missing! Please create a config file.');
			return;
		}

		config = Object.assign(defaults, config);
	};

	
	return {

		/* Public Methods */

		/* init()
		 * Main init method.
		 */
		init: function() {
			Log.info('Initializing MagicMirror.');
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

			Log.info('All modules started!');
			sendNotification('ALL_MODULES_STARTED');

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
				Log.error('sendNotification: Missing arguments.');
				return;
			}

			if (typeof notification !== 'string') {
				Log.error('sendNotification: Notification should be a string.');
				return;
			}

			if (!(sender instanceof Module)) {
				Log.error('sendNotification: Sender should be a module.');
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
				Log.error('updateDom: Sender should be a module.');
				return;
			}
			
			// Further implementation is done in the private method.
			updateDom(module, speed);
		}
		
	};

})();

MM.init();





