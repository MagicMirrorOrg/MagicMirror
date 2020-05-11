/* Magic Mirror
 * Logger
 * This logger is very simple, but needs to be extended.
 * This system can eventually be used to push the log messages to an external target.
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
(function (root, factory) {
	if (typeof exports === 'object') {
		// Node, CommonJS-like
		module.exports = factory(root.config);
	} else {
		// Browser globals (root is window)
		root.Log = factory(root.config);
	}
}(this, function (config) {
	return {
		info: Function.prototype.bind.call(console.info, console),
		log: Function.prototype.bind.call(console.log, console),
		error: Function.prototype.bind.call(console.error, console),
		warn: Function.prototype.bind.call(console.warn, console),
		group: Function.prototype.bind.call(console.group, console),
		groupCollapsed: Function.prototype.bind.call(console.groupCollapsed, console),
		groupEnd: Function.prototype.bind.call(console.groupEnd, console),
		time: Function.prototype.bind.call(console.time, console),
		timeEnd: Function.prototype.bind.call(console.timeEnd, console),
		timeStamp: Function.prototype.bind.call(console.timeStamp, console)
	};
}));
