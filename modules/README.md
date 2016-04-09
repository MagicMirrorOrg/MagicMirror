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

### Available module properties
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

The getScripts method is called to request any additional scripts that need to be loaded. This method should therefor return an array with strings. If you want to return a full path to a file in the module folder, use the `this.file('filename.js')` method. In all cases the loader will only load a file once. It even checks if the file is available in the default vendor folder. 

**Example:**
````javascript
getScripts: function() {
	return [
		'script.js', // will try to load it from the vendor folder, otherwise it will load is from the module folder.
		'moment.js', // this file is availabvle in the vendor folder, so it doesn't need to be avialable in the module folder.
		this.file('anotherfile.js'), // this file will be loaded straight from the module folder.
		'https://code.jquery.com/jquery-2.2.3.min.js',  // this file will be loaded from the jquery servers.
	]
}

````
**Note:** If a file can not be loaded, the boot up of the mirror will stall. Therefore it's advised not to use any external urls.


####`getStyles()` 
**Should return: Array**

The getStyles method is called to request any additional scripts that need to be loaded. This method should therefor return an array with strings. If you want to return a full path to a file in the module folder, use the `this.file('filename.css')` method. In all cases the loader will only load a file once. It even checks if the file is available in the default vendor folder. 

**Example:**
````javascript
getStyles: function() {
	return [
		'script.css', // will try to load it from the vendor folder, otherwise it will load is from the module folder.
		'font-awesome.css', // this file is availabvle in the vendor folder, so it doesn't need to be avialable in the module folder.
		this.file('anotherfile.css'), // this file will be loaded straight from the module folder.
		'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css',  // this file will be loaded from the bootstrapcdn servers.
	]
}

````
**Note:** If a file can not be loaded, the boot up of the mirror will stall. Therefore it's advised not to use any external urls.

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

**Note:** When a node helper send a notification, all modules of that module type receive the same notifications. 

**Example:**
````javascript
socketNotificationReceived: function(notification, payload) {
	Log.log(this.name + " received a socket notification: " + notification + " - Payload: " + payload);
}, 
````


### Module instance methods

TODO

## The Node Helper: node_helper.js

TODO

## MagicMirror Helper Methods

TODO

## MagicMirror Logger

TODO
