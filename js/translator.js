/* exported Translator */
/* Magic Mirror
 * Translator (l10n)
 *
 * By Christopher Fenner http://github.com/CFenner
 * MIT Licensed.
 */
var Translator = (function() {
	return {
		translations: {},
		/* translate(module, key)
		 * Load a translation for a given key for a given module.
		 *
		 * argument module Module - The module to load the translation for.
		 * argument key string - The key of the text to translate.
		 */
		translate: function(module, key) {
			if(this.translations[module.name]) {
				return this.translations[module.name][key];
			}
			return undefined;
		},
		/* load(module, file, callback)
		 * Load a translation file (json) and remember the data.
		 *
		 * argument module Module - The module to load the translation file for.
		 * argument file string - Path of the file we want to load.
		 * argument callback function - Function called when done.
		 */
		load: function(module, file, callback) {
			var self = this;
			if(!this.translations[module.name]) {
				this._loadJSON(module.file(file), function(json) {
					self.translations[module.name] = json;
					callback();
				});
			} else {
				callback();
			}
		},
		/* _loadJSON(file, callback)
		 * Load a JSON file via XHR.
		 *
		 * argument file string - Path of the file we want to load.
		 * argument callback function - Function called when done.
		 */
		_loadJSON: function(file, callback) {
			var xhr = new XMLHttpRequest();
			xhr.overrideMimeType("application/json");
			xhr.open("GET", file, true);
			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4 && xhr.status == "200") {
					callback(JSON.parse(xhr.responseText));
				}
			};
			xhr.send(null);
		}
	};
})();
