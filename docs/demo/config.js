/* MagicMirror² Demo Configuration */
let config = {
	language: "en",
	timeFormat: 12,
	units: "metric",
	basePath: "/",

	modules: [
		{
			module: "clock",
			position: "top_left",
			config: {
				displaySeconds: true,
				showDate: true,
				showWeek: true,
				dateFormat: "dddd, MMMM Do, YYYY"
			}
		},
		{
			module: "compliments",
			position: "lower_third",
			config: {
				compliments: {
					morning: ["Good morning!", "Enjoy your day!", "Nice to see you!"],
					afternoon: ["Hello!", "Looking good!", "Beautiful afternoon!"],
					evening: ["Good evening!", "Have a nice evening!", "Time to relax!"]
				}
			}
		},
		{
			module: "weather",
			position: "top_right",
			config: {
				weatherProvider: "openweathermap",
				type: "current",
				location: "Berlin",
				locationID: "2950159",
				apiKey: "DEMO_KEY"
			}
		},
		{
			module: "calendar",
			position: "top_left",
			header: "Calendar",
			config: {
				maximumEntries: 5,
				calendars: []
			}
		},
		{
			module: "newsfeed",
			position: "bottom_bar",
			config: {
				feeds: [
					{
						title: "Demo News",
						url: "about:blank"
					}
				],
				showSourceTitle: true,
				showPublishDate: false
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") { module.exports = config; }
