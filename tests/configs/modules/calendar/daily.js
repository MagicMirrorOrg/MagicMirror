/* Magic Mirror Test config custom calendar
 *
 * MIT Licensed.
 */
let config = {
	port: 8080,
	ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"],

	language: "en",
	timeFormat: 12,
	units: "metric",
	electronOptions: {
		webPreferences: {
			nodeIntegration: true
		}
	},

	modules: [
		{
			module: "calendar",
			position: "bottom_bar",
			config: {
				showFullDayEventTime: false,
				getRelative: 0,
				calendars: [
					{
						maximumEntries: 10,
						maximumNumberOfDays: 10000,
						symbol: "birthday-cake",
						fullDaySymbol: "calendar-day",
						recurringSymbol: "undo",
						url: "http://localhost:8080/tests/configs/data/calendar_test_full_day_event_daily.ics"
					}
				]
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
