# MagicMirror² Module Development Documentation

This document describes the way to develop your own MagicMirror² modules.

## Module structure

All modules are loaded in de `modules` folder. The default modules are grouped together in the `modules/default` folder. Your module should be placed in a subfolder of `modules`. Note that any file or folder your create in the `modules` folder will be ignored by git, allowing you to upgrade the MagicMirror² without the loss of your files. 

A module can be placed in one single folder. Or multiple modules can be grouped in a subfoler. Note that name of the module must be unique. Even when a module with a similar name is placed in a different folder, they can't be loaded at the same time. 

### Files
- **modulename/modulename.js** - This is your core module script.
- **modulename/node_helper.js** - This is an optional helper that whill be loaded by the node script. The node helper and module script can communicate with each other using an intergrated socket system.
- **modulename/public** - Any files in this folder can be accesed via the browser on `/modulename/filename.ext`.
- **modulename/anyfileorfolder** Any other file or folder in the module folder can be used by the core module script. For example: *modulename/css/modulename.css* would be a good path for your additional module styles.

## Core module file: modulename.js
This is the script in which the module will be defined. This script is required in order for the module to be used. In it's most simple form, the core module file must contain:
````javascript
Module.register("modulename",{});
````
Of course, the above module would not do anything fancy, so it's good to look at one of the simplest modules: **helloworld**:

````javascript
//helloworld.js:

Module.register("helloworld",{
	// Default module config.
	defaults: {
		text: "Hello World!"
	},

	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");
		wrapper.innerHTML = this.config.text;
		return wrapper;
	}
});
````

As you can see, the `Module.register()` method takes two arguments: the name of the module and an object with the module properties.

### Available module instance properties
After the module is initialized, the module instance has a few available module properties:

####`this.name`
**String**

The name of the module. 

####`this.identifier`
**String**

This is a unique identifier for the module instance. 

####`this.hidden`
**Boolean**

This represents if the module is currently hidden (faded away).

####`this.config`
**Boolean**

The configuration of the module instance as set in the user's config.js file. This config will also contain the module's defaults if these properties are not over written by the user config.

####`this.data`
**Object**

The data object contains additional metadata about the module instance:
- `data.classes` - The classes which are added to the module dom wrapper.
- `data.file` - The filename of the core module file.
- `data.path` - The path of the module folder.
- `data.header` - The header added to the module.
- `data.position` - The position in which the instance will be shown.


####`defaults: {}`
Any properties defined in the defaults object, will be merged with the module config as defined in the user's config.js file. This is the best place to set your modules's configuration defaults. Any of the module configuration properties can be accessed using `this.config.propertyName`, but more about that later.

### Subclassable module methods

####`init()`
This method is called when a module gets instantiated. In most cases you do not need to subclass this method.

####`start()`
This method is called when all modules are loaded an the system is ready to boot up. Keep in mind that the dom object for the module is not yet created. The start method is a perfect place to define any additional module properties:

**Example:**
````javascript
start: function() {
	this.mySpecialProperty = "So much wow!";
	Log.log(this.name + ' is started!');
}
````

####`getScripts()`
**Should return: Array**

The getScripts method is called to request any additional scripts that need to be loaded. This method should therefore return an array with strings. If you want to return a full path to a file in the module folder, use the `this.file('filename.js')` method. In all cases the loader will only load a file once. It even checks if the file is available in the default vendor folder. 

**Example:**
````javascript
getScripts: function() {
	return [
		'script.js', // will try to load it from the vendor folder, otherwise it will load is from the module folder.
		'moment.js', // this file is available in the vendor folder, so it doesn't need to be avialable in the module folder.
		this.file('anotherfile.js'), // this file will be loaded straight from the module folder.
		'https://code.jquery.com/jquery-2.2.3.min.js',  // this file will be loaded from the jquery servers.
	]
}

````
**Note:** If a file can not be loaded, the boot up of the mirror will stall. Therefore it's advised not to use any external urls.


####`getStyles()` 
**Should return: Array**

The getStyles method is called to request any additional stylesheets that need to be loaded. This method should therefore return an array with strings. If you want to return a full path to a file in the module folder, use the `this.file('filename.css')` method. In all cases the loader will only load a file once. It even checks if the file is available in the default vendor folder. 

**Example:**
````javascript
getStyles: function() {
	return [
		'script.css', // will try to load it from the vendor folder, otherwise it will load is from the module folder.
		'font-awesome.css', // this file is available in the vendor folder, so it doesn't need to be avialable in the module folder.
		this.file('anotherfile.css'), // this file will be loaded straight from the module folder.
		'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css',  // this file will be loaded from the bootstrapcdn servers.
	]
}

````
**Note:** If a file can not be loaded, the boot up of the mirror will stall. Therefore it's advised not to use any external urls.

####`getTranslations()` 
**Should return: Dictionary**

The getTranslations method is called to request translation files that need to be loaded. This method should therefore return a dictionary with the files to load, identified by the country's short name.

**Example:**
````javascript
getTranslations: function() {
	return {
			en: "translations/en.json",
			de: "translations/de.json"
	}
}

````

####`getDom()` 
**Should return:** Dom Object

Whenever the MagicMirror needs to update the information on screen (because it starts, or because your module asked a refresh using `this.updateDom()`), the system calls the getDom method. This method should therefor return a dom object.

**Example:**
````javascript
getDom: function() {
	var wrapper = document.createElement("div");
	wrapper.innerHTML = 'Hello world!';
	return wrapper;
}

````

####`notificationReceived(notification, payload, sender)`

That MagicMirror core has the ability to send notifications to modules. Or even better: the modules have the possibility to send notifications to other modules. When this module is called, it has 3 arguments:

- `notification` - String - The notification identifier.
- `payload` - AnyType - The payload of a notification.
- `sender` - Module - The sender of the notification. If this argument is `undefined`, the sender of the notififiction is the core system.

**Example:**
````javascript
notificationReceived: function(notification, payload, sender) {
	if (sender) {
		Log.log(this.name + " received a module notification: " + notification + " from sender: " + sender.name);
	} else {
		Log.log(this.name + " received a system notification: " + notification);
	}
}
````

**Note:** the system sends two notifiations when starting up. These notifications could come in handy!


- `ALL_MODULES_STARTED` - All modules are started. You can now send notifications to other modules.
- `DOM_OBJECTS_CREATED` - All dom objects are created. The system is now ready to perform visual changes.


####`socketNotificationReceived: function(notification, payload)`
When using a node_helper, the node helper can send your module notifications. When this module is called, it has 2 arguments:

- `notification` - String - The notification identifier.
- `payload` - AnyType - The payload of a notification.

**Note 1:** When a node helper send a notification, all modules of that module type receive the same notifications. <br>
**Note 2:** The socket connection is established as soon as the module sends it's first message using [sendSocketNotification](thissendsocketnotificationnotification-payload).

**Example:**
````javascript
socketNotificationReceived: function(notification, payload) {
	Log.log(this.name + " received a socket notification: " + notification + " - Payload: " + payload);
}, 
````

### Module instance methods

Each module instance has some handy methods which can be helpfull building your module.


####`this.file(filename)`
***filename* String** - The name of the file you want to create the path for.<br>
**Returns String**

If you want to create a path to a file in your module folder, use the `file()` method. It returns the path to the filename given as the attribute. Is method comes in handy when configuring the [getScripts](#getscripts) and [getStyles](#getstyles) methods.

####`this.updateDom(speed)`
***speed* Number** - Optional. Animation speed in milliseconds.<br>

Whenever your module need to be updated, call the `updateDom(speed)` method. It requests the MagicMirror core to update it's dom object. If you define the speed, the content update will be animated, but only if the content will realy change.

As an example: the clock modules calls this method every second:

````javascript
...
start: function() {
	var self = this;
	setInterval(function() {
		self.updateDom(); // no speed defined, so it updates instantly.
	}, 1000); //perform every 1000 milliseconds.
},
...
```` 

####`this.sendNotification(notification, payload)`
***notification* String** - The notification identifier.<br>
***payload* AnyType** - Optional. A notification payload.<br>

If you want to send a notification to all other modules, use the `sendNotification(notification, payload)`. All other modules will receive the message via the [notificationReceived](#notificationreceivednotification-payload-sender) method. In that case, the sender is automaticly set to the instance calling the sendNotification method.

**Example:**
````javascript
this.sendNotification('MYMODULE_READY_FOR_ACTION', {foo:bar});
````

####`this.sendSocketNotification(notification, payload)`
***notification* String** - The notification identifier.<br>
***payload* AnyType** - Optional. A notification payload.<br>

If you want to send a notification to the node_helper, use the `sendSocketNotification(notification, payload)`. Only the node_helper of this module will recieve the socket notification.

**Example:**
````javascript
this.sendSocketNotification('SET_CONFIG', this.config);
````

####`this.hide(speed, callback)`
***speed* Number** - Optional, The speed of the hide animation in milliseconds.
***callback* Function** - Optional, The callback after the hide animation is finished.

To hide a module, you can call the `hide(speed, callback)` method. You can call the hide method on the module instance itselve using `this.hide()`, but of course you can also hide an other module using `anOtherModule.hide()`.

**Note 1:** If the hide animation is canceled, for instance because the show method is called before the hide animation was finished, the callback will not be called.<br>
**Note 2:** If the hide animation is hijacked (an other method calls hide on the same module), the callback will not be called.<br>
**Note 3:** If the dom is not yet created, the hide method won't work. Wait for the `DOM_OBJECTS_CREATED` [notification](#notificationreceivednotification-payload-sender).

####`this.show(speed, callback)`
***speed* Number** - Optional, The speed of the show animation in milliseconds.
***callback* Function** - Optional, The callback after the show animation is finished.

To show a module, you can call the `show(speed, callback)` method. You can call the show method on the module instance itselve using `this.show()`, but of course you can also show an other module using `anOtherModule.show()`.

**Note 1:** If the show animation is canceled, for instance because the hide method is called before the show animation was finished, the callback will not be called.<br>
**Note 2:** If the show animation is hijacked (an other method calls show on the same module), the callback will not be called.<br>
**Note 3:** If the dom is not yet created, the show method won't work. Wait for the `DOM_OBJECTS_CREATED` [notification](#notificationreceivednotification-payload-sender).

####`this.translate(identifier)`
***identifier* String** - Identifier of the string that should be translated.

The Magic Mirror contains a convenience wrapper for `l18n`. You can use this to automatically serve different translations for your modules based on the user's `language` configuration.

**Example:**
````javascript
this.translate("INFO") //Will return a translated string for the identifier INFO
````

**Example json file:**
````javascript
{
  "INFO": "Really important information!"
}
````

**Note:** Currently there is no fallback if a translation identifier does not exist in one language. Right now you always have to add all identifier to all your translations even if they are not translated yet (see [#191](https://github.com/MichMich/MagicMirror/issues/191)).


## The Node Helper: node_helper.js

The node helper is a Node.js script that is able to do some backend task to support your module. For every module type, only one node helper instance will be created. For example: if your MagicMirror uses two calendar modules, there will be only one calendar node helper instantiated. 

**Note:** Because there is only one node helper per module type, there is no default config available within your module. It's your task to send the desired config from your module to your node helper.

In it's most simple form, the node_helper.js file must contain:

````javascript
var NodeHelper = require("node_helper");
module.exports = NodeHelper.create({});
````

Of course, the above helper would not do anything usefull. So with the information above, you should be able to make it a bit more sophisticated.

### Available module instance properties

####`this.name`
**String**

The name of the module

####`this.path`
**String**

The path of the module

####`this.expressApp`
**Express App Instance**

This is a link to the express instance. It will allow you to define extra routes.

**Example:**
````javascript
start: function() {
	this.expressApp.get('/foobar', function (req, res) {
		res.send('GET request to /foobar');
	});
}
````

**Note: ** By default, a public path to your module's public folder will be created:
````javascript
this.expressApp.use("/" + this.name, express.static(this.path + "/public"));
````

####`this.io`
**Socket IO Instance**

This is a link to the IO instance. It will allow you to do some Socket.IO magic. In most cases you won't need this, since the Node Helper has a few convenience methods to make this simple.

### Subclassable module methods

####`init()`
This method is called when a node helper gets instantiated. In most cases you do not need to subclass this method.

####`start()`
This method is called when all node helper are loaded an the system is ready to boot up. The start method is a perfect place to define any additional module properties:

**Example:**
````javascript
start: function() {
	this.mySpecialProperty = "So much wow!";
	Log.log(this.name + ' is started!');
}
````

####`socketNotificationReceived: function(notification, payload)`
With this method, your node helper can receive notifications form your modules. When this method is called, it has 2 arguments:

- `notification` - String - The notification identifier.
- `payload` - AnyType - The payload of a notification.

**Note:** The socket connection is established as soon as the module sends it's first message using [sendSocketNotification](thissendsocketnotificationnotification-payload).

**Example:**
````javascript
socketNotificationReceived: function(notification, payload) {
	Log.log(this.name + " received a socket notification: " + notification + " - Payload: " + payload);
}, 
````

### Module instance methods

Each node helper has some handy methods which can be helpfull building your module.

####`this.sendSocketNotification(notification, payload)`
***notification* String** - The notification identifier.<br>
***payload* AnyType** - Optional. A notification payload.<br>

If you want to send a notification to all your modules, use the `sendSocketNotification(notification, payload)`. Only the module of your module type will recieve the socket notification.

**Note:** Since all instances of you module will receive the notifications, it's your task to make sure the right module responds to your messages. 

**Example:**
````javascript
this.sendSocketNotification('SET_CONFIG', this.config);
````

## MagicMirror Helper Methods

The core Magic Mirror object: `MM` has some handy method that will help you in controlling your and other modules. Most of the `MM` methods are available via convenience methods on the Module instance. 

### Module selection
The only additional method available for your module, is the feature to retrieve references to other modules. This can be used to hide and show other modules.

####`MM.getModules()`
**Returns Array** - An array with module instances.<br>

To make a selection of all currently loaded module instances, run the `MM.getModules()` method. It will return an array with all currently loaded module instances. The returned array has a lot of filtering methods. See below for more info.

**Note:** This method returns an empty array if not all modules are started yet. Wait for the `ALL_MODULES_STARTED` [notification](#notificationreceivednotification-payload-sender).


#####`.withClass(classnames)`
***classnames* String or Array** - The class names on which you want to filer.
**Returns Array** - An array with module instances.<br>

If you want to make a selection based on one ore more class names, use the withClass method on a result of the `MM.getModules()` method. The argument of the `withClass(classname)` method can be an array, or space separated string.

**Examples:**
````javascript
var modules = MM.getModules().withClass('classname');
var modules = MM.getModules().withClass('classname1 classname2');
var modules = MM.getModules().withClass(['classname1','classname2']);
````

#####`.exceptWithClass(classnames)`
***classnames* String or Array** - The class names of the modules you want to remove from the results.
**Returns Array** - An array with module instances.<br>

If you to remove some modules from a selection based on a classname, use the exceptWithClass method on a result of the `MM.getModules()` method. The argument of the `exceptWithClass(classname)` method can be an array, or space separated string.

**Examples:**
````javascript
var modules = MM.getModules().exceptWithClass('classname');
var modules = MM.getModules().exceptWithClass('classname1 classname2');
var modules = MM.getModules().exceptWithClass(['classname1','classname2']);
````

#####`.exceptModule(module)`
***module* Module Object** - The reference to a module you want to remove from the results.
**Returns Array** - An array with module instances.<br>

If you to remove a specific module instance from a selection based on a classname, use the exceptWithClass method on a result of the `MM.getModules()` method. This can be helpfull if you want to select all module instances except the instance of your module.

**Examples:**
````javascript
var modules = MM.getModules().exceptModule(this);
````

Of course, you can combine all of the above filters:

**Example:**
````javascript
var modules = MM.getModules().withClass('classname1').exceptwithClass('classname2').exceptModule(aModule);
````

#####`.enumerate(callback)`
***callback* Function(module)** - The callback run on every instance.

If you want to perform an action on all selected modules, you can use the `enumerate` function:

````javascript
MM.getModules().enumerate(function(module) {
    Log.log(module.name);
});
````

**Example:**
To hide all modules except the your module instance, you could write something like:
````javascript
Module.register("modulename",{
	//...
	notificationReceived: function(notification, payload, sender) {
		if (notification === 'DOM_OBJECTS_CREATED') {
			MM.getModules().exceptModule(this).enumerate(function(module) {
				module.hide(1000, function() {
					//Module hidden.
				});
			});
		}
	}, 
	//...
});
```` 

## MagicMirror Logger

The Magic Mirror contains a convenience wrapper for logging. Currently, this logger is a simple proxy to the original `console.log` methods. But it might get additional features in the future. The Loggers is currently only available in the core module file (not in the node_helper).

**Examples:**
````javascript
Log.info('error');
Log.log('log');
Log.error('info');
````
