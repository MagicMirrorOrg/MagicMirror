/* MagicMirror² Test config newsfeed module
 *
 * MIT Licensed.
 */
let config = {
	timeFormat: 12,

	modules: [
		{
			module: "newsfeed",
			position: "bottom_bar",
			config: {
				feeds: [
					{
						title: "Rodrigo Ramirez Blog",
						url: "http://localhost:8080/tests/configs/data/feed_test_rodrigoramirez.xml"
					}
				],
				prohibitedWords: ["QPanel"],
				showDescription: true
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
