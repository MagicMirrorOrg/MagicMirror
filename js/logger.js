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
			console.info.apply(this, arguments);
		},
		log: function() {
			console.log.apply(this, arguments);
		},
		error: function() {
			console.error.apply(this, arguments);
		},
		warn: function() {
			console.warn.apply(this, arguments);	
		},
		group: function() {
			console.group.apply(this, arguments);	
		},
		groupCollapsed: function() {
			console.groupCollapsed.apply(this, arguments);
		},
		groupEnd: function() {
			console.groupEnd();
		},
		time: function() {
			console.time.apply(this, arguments);
		},
		timeEnd: function() {
			console.timeEnd.apply(this, arguments);
		},
		timeStamp: function() {
			console.timeStamp.apply(this, arguments);
		}
	};
})();
