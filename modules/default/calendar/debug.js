/*
 * CalendarFetcher Tester
 * use this script with `node debug.js` to test the fetcher without the need
 * of starting the MagicMirror² core. Adjust the values below to your desire.
 */
// Alias modules mentioned in package.js under _moduleAliases.
require("module-alias/register");

const CalendarFetcher = require("./calendarfetcher");

const url = "https://calendar.google.com/calendar/ical/pkm1t2uedjbp0uvq1o7oj1jouo%40group.calendar.google.com/private-08ba559f89eec70dd74bbd887d0a3598/basic.ics"; // Standard test URL
//const url = "https://www.googleapis.com/calendar/v3/calendars/primary/events/"; // URL for Bearer auth (must be configured  in Google OAuth2 first)
const fetchInterval = 60 * 60 * 1000;
const maximumEntries = 10;
const maximumNumberOfDays = 365;
const user = "magicmirror";
const pass = "MyStrongPass";
const auth = {
	user: user,
	pass: pass
};

console.log("Create fetcher ...");

const fetcher = new CalendarFetcher(url, fetchInterval, [], maximumEntries, maximumNumberOfDays, auth);

fetcher.onReceive(function (fetcher) {
	console.log(fetcher.events());
	console.log("------------------------------------------------------------");
	process.exit(0);
});

fetcher.onError(function (fetcher, error) {
	console.log("Fetcher error:");
	console.log(error);
	process.exit(1);
});

fetcher.startFetch();

console.log("Create fetcher done! ");
