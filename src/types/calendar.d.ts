/*
 * Ambient types for the calendar subsystem (calendarfetcher, calendarfetcherutils,
 * node_helper, calendar module). Included by both the browser and server tsconfig.
 *
 * CalendarFetcherUtils builds CalendarEvent objects from parsed ICS data; the browser
 * calendar module then decorates each event with display flags (today/tomorrow/symbol/
 * color/url/...). Fields are optional and an index signature allows extra keys, so
 * applying these types is a safe refinement of the previous `any`. startDate/endDate are
 * left `any` because the code treats them as both ms-strings (moment.format("x")) and
 * numbers (arithmetic in sorts).
 */

interface CalendarEvent {
	title?: string;
	startDate?: any;
	endDate?: any;
	fullDayEvent?: boolean;
	recurringEvent?: boolean;
	class?: string;
	firstYear?: number;
	location?: any;
	geo?: any;
	description?: string;
	// Display flags added by the calendar module.
	today?: boolean;
	yesterday?: boolean;
	tomorrow?: boolean;
	dayBeforeYesterday?: boolean;
	dayAfterTomorrow?: boolean;
	symbol?: string | string[];
	calendarName?: string;
	color?: string;
	url?: string;
	[key: string]: any;
}

interface CalendarConfig {
	excludedEvents?: any[];
	includePastEvents?: boolean;
	maximumEntries?: number;
	maximumNumberOfDays?: number;
	titleReplace?: any;
	locationTitleReplace?: any;
	[key: string]: any;
}
