const calendarShowEndConfigs = {
	event_with_time_over_multiple_days_non_repeating_display_end: {
		address: "0.0.0.0",
		ipWhitelist: [],
		timeFormat: 24,
		modules: [
			{
				module: "calendar",
				position: "bottom_bar",
				config: {
					fade: false,
					urgency: 0,
					dateFormat: "Do.MMM, HH:mm",
					dateEndFormat: "Do.MMM, HH:mm",
					fullDayEventDateFormat: "Do.MMM",
					timeFormat: "absolute",
					getRelative: 0,
					showEnd: true,
					calendars: [
						{
							maximumEntries: 100,
							url: "http://localhost:8080/tests/mocks/event_with_time_over_multiple_days_non_repeating.ics"
						}
					]
				}
			}
		]
	},
	event_with_time_over_multiple_days_non_repeating_display_end_dateheaders: {
		address: "0.0.0.0",
		ipWhitelist: [],
		timeFormat: 24,
		modules: [
			{
				module: "calendar",
				position: "bottom_bar",
				config: {
					fade: false,
					urgency: 0,
					dateFormat: "Do.MMM, HH:mm",
					dateEndFormat: "Do.MMM, HH:mm",
					fullDayEventDateFormat: "Do.MMM",
					timeFormat: "dateheaders",
					getRelative: 0,
					showEnd: true,
					calendars: [
						{
							maximumEntries: 100,
							url: "http://localhost:8080/tests/mocks/event_with_time_over_multiple_days_yearly.ics"
						}
					]
				}
			}
		]
	},
	event_with_time_over_multiple_days_non_repeating_display_end_relative: {
		address: "0.0.0.0",
		ipWhitelist: [],
		timeFormat: 24,
		modules: [
			{
				module: "calendar",
				position: "bottom_bar",
				config: {
					fade: false,
					urgency: 0,
					dateFormat: "Do.MMM, HH:mm",
					dateEndFormat: "Do.MMM, HH:mm",
					fullDayEventDateFormat: "Do.MMM",
					timeFormat: "relative",
					getRelative: 0,
					showEnd: true,
					calendars: [
						{
							maximumEntries: 100,
							url: "http://localhost:8080/tests/mocks/event_with_time_over_multiple_days_yearly.ics"
						}
					]
				}
			}
		]
	},
	event_with_time_over_multiple_days_non_repeating_no_display_end: {
		address: "0.0.0.0",
		ipWhitelist: [],
		timeFormat: 24,
		modules: [
			{
				module: "calendar",
				position: "bottom_bar",
				config: {
					fade: false,
					urgency: 0,
					dateFormat: "Do.MMM, HH:mm",
					dateEndFormat: "Do.MMM, HH:mm",
					fullDayEventDateFormat: "Do.MMM",
					timeFormat: "absolute",
					getRelative: 0,
					showEnd: true,
					showEndsOnlyWithDuration: true,
					calendars: [
						{
							maximumEntries: 100,
							url: "http://localhost:8080/tests/mocks/event_with_time_over_multiple_days_non_repeating.ics"
						}
					]
				}
			}
		]
	},
	event_with_time_same_day_yearly_display_end_absolute: {
		address: "0.0.0.0",
		ipWhitelist: [],
		timeFormat: 24,
		modules: [
			{
				module: "calendar",
				position: "bottom_bar",
				config: {
					fade: false,
					urgency: 0,
					dateFormat: "Do.MMM",
					dateEndFormat: "Do.MMM, HH:mm",
					fullDayEventDateFormat: "Do.MMM",
					timeFormat: "absolute",
					getRelative: 0,
					showEnd: true,
					calendars: [
						{
							maximumEntries: 100,
							url: "http://localhost:8080/tests/mocks/event_with_time_same_day_yearly.ics"
						}
					]
				}
			}
		]
	},
	event_with_time_same_day_yearly_display_end_absolute_dateformat_lll: {
		address: "0.0.0.0",
		ipWhitelist: [],
		language: "en",
		timeFormat: 24,
		modules: [
			{
				module: "calendar",
				position: "bottom_bar",
				config: {
					fade: false,
					urgency: 0,
					dateFormat: "LLL",
					dateEndFormat: "Do.MMM, HH:mm",
					fullDayEventDateFormat: "Do.MMM",
					timeFormat: "absolute",
					getRelative: 0,
					showEnd: true,
					calendars: [
						{
							maximumEntries: 100,
							url: "http://localhost:8080/tests/mocks/event_with_time_same_day_yearly.ics"
						}
					]
				}
			}
		]
	},
	event_with_time_same_day_yearly_display_end_absolute_dateformat_with_time: {
		address: "0.0.0.0",
		ipWhitelist: [],
		timeFormat: 24,
		modules: [
			{
				module: "calendar",
				position: "bottom_bar",
				config: {
					fade: false,
					urgency: 0,
					dateFormat: "Do.MMM, HH:mm",
					dateEndFormat: "Do.MMM, HH:mm",
					fullDayEventDateFormat: "Do.MMM",
					timeFormat: "absolute",
					getRelative: 0,
					showEnd: true,
					calendars: [
						{
							maximumEntries: 100,
							url: "http://localhost:8080/tests/mocks/event_with_time_same_day_yearly.ics"
						}
					]
				}
			}
		]
	},
	event_with_time_same_day_yearly_display_end_dateheaders: {
		address: "0.0.0.0",
		ipWhitelist: [],
		timeFormat: 24,
		modules: [
			{
				module: "calendar",
				position: "bottom_bar",
				config: {
					fade: false,
					urgency: 0,
					dateFormat: "Do.MMM",
					dateEndFormat: "Do.MMM, HH:mm",
					fullDayEventDateFormat: "Do.MMM",
					timeFormat: "dateheaders",
					getRelative: 0,
					showEnd: true,
					calendars: [
						{
							maximumEntries: 100,
							url: "http://localhost:8080/tests/mocks/event_with_time_same_day_yearly.ics"
						}
					]
				}
			}
		]
	},
	event_with_time_same_day_yearly_display_end_relative: {
		address: "0.0.0.0",
		ipWhitelist: [],
		timeFormat: 24,
		modules: [
			{
				module: "calendar",
				position: "bottom_bar",
				config: {
					fade: false,
					urgency: 0,
					dateFormat: "Do.MMM",
					dateEndFormat: "Do.MMM, HH:mm",
					fullDayEventDateFormat: "Do.MMM",
					timeFormat: "relative",
					getRelative: 0,
					showEnd: true,
					calendars: [
						{
							maximumEntries: 100,
							url: "http://localhost:8080/tests/mocks/event_with_time_same_day_yearly.ics"
						}
					]
				}
			}
		]
	},
	event_with_time_same_day_yearly_display_end_relative_hide_time: {
		address: "0.0.0.0",
		ipWhitelist: [],
		timeFormat: 24,
		modules: [
			{
				module: "calendar",
				position: "bottom_bar",
				config: {
					fade: false,
					urgency: 0,
					dateFormat: "Do.MMM",
					dateEndFormat: "Do.MMM, HH:mm",
					fullDayEventDateFormat: "Do.MMM",
					timeFormat: "relative",
					getRelative: 0,
					hideTime: true,
					showEnd: true,
					calendars: [
						{
							maximumEntries: 100,
							url: "http://localhost:8080/tests/mocks/event_with_time_same_day_yearly.ics"
						}
					]
				}
			}
		]
	},
	fullday_multiday_showend_dateheaders: {
		address: "0.0.0.0",
		ipWhitelist: [],
		timeFormat: 24,
		modules: [
			{
				module: "calendar",
				position: "bottom_bar",
				config: {
					fade: false,
					urgency: 0,
					fullDayEventDateFormat: "Do.MMM",
					timeFormat: "dateheaders",
					getRelative: 0,
					showEnd: true,
					calendars: [
						{
							maximumEntries: 100,
							url: "http://localhost:8080/tests/mocks/fullday_event_over_multiple_days_nonrepeating.ics"
						}
					]
				}
			}
		]
	},
	fullday_multiday_showend_nextdaysrelative: {
		address: "0.0.0.0",
		ipWhitelist: [],
		timeFormat: 24,
		modules: [
			{
				module: "calendar",
				position: "bottom_bar",
				config: {
					fade: false,
					urgency: 0,
					fullDayEventDateFormat: "Do.MMM",
					timeFormat: "absolute",
					getRelative: 0,
					showEnd: true,
					nextDaysRelative: true,
					calendars: [
						{
							maximumEntries: 100,
							url: "http://localhost:8080/tests/mocks/fullday_event_over_multiple_days_nonrepeating.ics"
						}
					]
				}
			}
		]
	},
	fullday_multiday_showend_relative: {
		address: "0.0.0.0",
		ipWhitelist: [],
		timeFormat: 24,
		modules: [
			{
				module: "calendar",
				position: "bottom_bar",
				config: {
					fade: false,
					urgency: 0,
					fullDayEventDateFormat: "Do.MMM",
					timeFormat: "relative",
					getRelative: 0,
					showEnd: true,
					calendars: [
						{
							maximumEntries: 100,
							url: "http://localhost:8080/tests/mocks/fullday_event_over_multiple_days_nonrepeating.ics"
						}
					]
				}
			}
		]
	}
};

const defaultScenario = "event_with_time_over_multiple_days_non_repeating_display_end";
const selectedScenario = process.env.MM_CALENDAR_SHOWEND_SCENARIO || defaultScenario;
const config = calendarShowEndConfigs[selectedScenario];

if (!config) {
	throw new Error(`Unknown MM_CALENDAR_SHOWEND_SCENARIO: ${selectedScenario}`);
}

module.exports = config;
