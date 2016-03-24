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

	// Module config defaults.
	defaults: {},

	/* init()
	 * Is called when the module is instantiated.
	 */
	init: function() {
		//Log.log(this.defaults);
	},

	/* start()
	 * Is called when the module is started.
	 */
	start: function() {
		Log.info('Starting module: ' + this.name);
	},

	/* getScripts()
	 * Returns a list of scripts the module requires to be loaded.
	 *
	 * return Array<String> - An array with filenames.
	 */
	getScripts: function() {
		return [];
	},

	/* getStyles()
	 * Returns a list of stylesheets the module requires to be loaded.
	 *
	 * return Array<String> - An array with filenames.
	 */
	getStyles: function() {
		return [];
	},

	/* getDom()
	 * This method generates the dom which needs to be displayed. This method is called by the Magic Mirror core.
	 * This method needs to be subclassed if the module wants to display info on the mirror.
	 *
	 * return domobject - The dom to display.
	 */
	getDom: function() {
		var nameWrapper = document.createElement("div");
		var name = document.createTextNode(this.name);       
		nameWrapper.appendChild(name);

		var identifierWrapper = document.createElement("div");
		var identifier = document.createTextNode(this.identifier);       
		identifierWrapper.appendChild(identifier);
		identifierWrapper.className = "small dimmed";

		var div = document.createElement("div");
		div.appendChild(nameWrapper);
		div.appendChild(identifierWrapper);

		return div; 
	},

	/* notificationReceived(notification, payload, sender)
	 * This method is called when a notification arrives.
	 * This method is called by the Magic Mirror core.
	 *
	 * argument notification string - The identifier of the noitication.
	 * argument payload mixed - The payload of the notification.
	 * argument sender Module - The module that sent the notification.
	 */
	notificationReceived: function(notification, payload, sender) {
		if (sender) {
			Log.log(this.name + ' received a module notification: ' + notification + ' from sender: ' + sender.name);
		} else {
			Log.log(this.name + ' received a system notification: ' + notification);
		}
	},





	/*********************************************
	 * The methods below don't need subclassing. *
	 *********************************************/

	/* setData(data)
	 * Set the module data.
	 *
	 * argument data obejct - Module data.
	 */
	setData: function(data) {
		this.data = data;
		this.name = data.name;
		this.identifier = data.identifier;

		this.setConfig(data.config);
	},

	/* setConfig(config)
	 * Set the module config and combine it with the module defaults.
	 *
	 * argument config obejct - Module config.
	 */
	setConfig: function(config) {
		this.config = Object.assign(this.defaults, config);
	},

	/* file(file)
	 * Retrieve the path to a module fike.
	 *
	 * argument file string - Filename.
	 *
	 * return string - File path.
	 */
	file: function(file) {
		return this.data.path + '/' + file;
	},

	/* loadStyles()
	 * Load all required stylesheets by requesting the MM object to load the files.
	 */
	loadStyles: function() {
		var styles = this.getStyles();
		for (var s in styles) {
			var style = styles[s];

			Loader.loadFile(style, this);
		}
	},

	/* loadScripts()
	 * Load all required scripts by requesting the MM object to load the files.
	 */
	loadScripts: function() {
		var scripts = this.getScripts();
		for (var s in scripts) {
			var script = scripts[s];

			Loader.loadFile(script, this);
		}
	},

	/* updateDom(speed)
	 * Request an (animated) update of the module.
	 *
	 * argument speed Number - The speed of the animation. (Optional)
	 */
	updateDom: function(speed) {
		MM.updateDom(this, speed);
	},

	/* sendNotification(notification, payload)
	 * Send a notification to all modules.
	 *
	 * argument notification string - The identifier of the noitication.
	 * argument payload mixed - The payload of the notification.
	 */
	sendNotification: function(notification, payload) {
		MM.sendNotification(notification, payload, this);
	}
});

Module.create = function(moduleDefinition) {
	return Module.extend(moduleDefinition);
};
