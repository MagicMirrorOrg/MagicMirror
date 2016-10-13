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
		info: function() {
			console.info.apply(console, arguments);
		},
		log: function() {
			console.log.apply(console, arguments);
		},
		error: function() {
			console.error.apply(console, arguments);
		},
		warn: function() {
			console.warn.apply(console, arguments);	
		},
		group: function() {
			console.group.apply(console, arguments);	
		},
		groupCollapsed: function() {
			console.groupCollapsed.apply(console, arguments);
		},
		groupEnd: function() {
			console.groupEnd();
		},
		time: function() {
			console.time.apply(console, arguments);
		},
		timeEnd: function() {
			console.timeEnd.apply(console, arguments);
		},
		timeStamp: function() {
			console.timeStamp.apply(console, arguments);
		}
	};
})();
