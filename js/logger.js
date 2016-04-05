/* global console */
/* exported Log */

/* Magic Mirror
 * Logger
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

// This logger is very simple, but needs to be extended.
// This system can eventually be used to push the log messages to an external target.

var Log = (function() {
	return {
		info: function(message) {
			console.info(message);
		},
		log: function(message) {
			console.log(message);
		},
		error: function(message) {
			console.error(message);
		}
	};
})();
