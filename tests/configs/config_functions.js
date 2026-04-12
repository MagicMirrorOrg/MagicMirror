/*eslint object-shorthand: ["error", "always", { "methodsIgnorePattern": "^roundToInt2$" }]*/

let config = require(`${process.cwd()}/tests/configs/default.js`).configFactory({
	modules: [
		{
			module: "clock",
			position: "middle_center",
			config: {
				moduleFunctions: {
					roundToInt1: (value) => {
						try {
							return Math.round(parseFloat(value));
						} catch {
							return value;
						}
					},
					roundToInt2: function (value) {
						try {
							return Math.round(parseFloat(value));
						} catch {
							return value;
						}
					}
				},
				stringWithArrow: "a => b is not a function",
				stringWithFunction: "this function keyword is just text"
			}
		}
	]
});

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
