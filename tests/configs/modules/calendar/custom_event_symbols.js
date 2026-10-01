const config = {
	modules: [
		{
			module: "calendar",
			position: "bottom_bar",
			config: {
				customEvents: [
					{ keyword: "CustomEvent", symbol: "dice" },
					{ keyword: "BrandsTeslaIcon", symbol: "tesla", symbolClassName: "fab fa-fw fa-" }
				],
				forceUseCurrentTime: true,
				calendars: [
					{
						maximumEntries: 10,
						pastDaysCount: 5,
						broadcastPastEvents: true,
						maximumNumberOfDays: 10000,
						url: "http://localhost:8080/tests/mocks/calendar_test_icons.ics"
					}
				]
			}
		}
	]
};

module.exports = config;
