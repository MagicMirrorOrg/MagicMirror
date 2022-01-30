/* MagicMirror² Test config compliments with date type
 *
 * By Rejas
 * MIT Licensed.
 */
let config = {
	timeFormat: 12,

	modules: [
		{
			module: "compliments",
			position: "middle_center",
			config: {
				mockDate: "2020-01-01",
				compliments: {
					morning: [],
					afternoon: [],
					evening: [],
					"....-01-01": ["Happy new year!"]
				}
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
