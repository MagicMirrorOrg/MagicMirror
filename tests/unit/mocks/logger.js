(function (root, factory) {
	// Node, CommonJS-like
	module.exports = factory(root.config);
})(this, function (config) {
	let logLevel = {
		debug: function () {},
		log: function () {},
		info: function () {},
		warn: function () {},
		error: function () {},
		group: function () {},
		groupCollapsed: function () {},
		groupEnd: function () {},
		time: function () {},
		timeEnd: function () {},
		timeStamp: function () {}
	};

	return logLevel;
});
