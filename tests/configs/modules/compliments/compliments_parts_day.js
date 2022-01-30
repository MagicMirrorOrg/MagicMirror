/* MagicMirror² Test config for default compliments
 *
 * By Rodrigo Ramírez Norambuena https://rodrigoramirez.com
 * MIT Licensed.
 */
let config = {
	timeFormat: 12,

	modules: [
		{
			module: "compliments",
			position: "middle_center",
			config: {
				compliments: {
					morning: ["Hi", "Good Morning", "Morning test"],
					afternoon: ["Hello", "Good Afternoon", "Afternoon test"],
					evening: ["Hello There", "Good Evening", "Evening test"]
				}
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
