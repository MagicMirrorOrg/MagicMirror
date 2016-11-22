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

var JLinst = JL('client');

var LogTee = function(i1, f1, i2, f2) {
	return function() {
		f1.apply(i1, arguments);
		f2.apply(i2, arguments);
	};
};

var Log = (function() {
	return {
		info: LogTee(JLinst, JLinst.info, console, console.info),
		log: LogTee(JLinst, JLinst.log, console, console.log),
		error: LogTee(JLinst, JLinst.error, console, console.error),
		warn: LogTee(JLinst, JLinst.warn, console, console.warn),
		group: Function.prototype.bind.call(console.group, console),
		groupCollapsed: Function.prototype.bind.call(console.groupCollapsed, console),
		groupEnd: Function.prototype.bind.call(console.groupEnd, console),
		time: Function.prototype.bind.call(console.time, console),
		timeEnd: Function.prototype.bind.call(console.timeEnd, console),
		timeStamp: Function.prototype.bind.call(console.timeStamp, console)
	};
})();
