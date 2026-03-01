global.moment = require("moment-timezone");

const ical = require("node-ical");
const moment = require("moment-timezone");
const defaults = require("../../../../../js/defaults");

const CalendarFetcherUtils = require(`../../../../../${defaults.defaultModulesDir}/calendar/calendarfetcherutils`);

describe("Calendar fetcher utils test", () => {
	const defaultConfig = {
		excludedEvents: [],
		includePastEvents: false,
		maximumEntries: 10,
		maximumNumberOfDays: 367
	};

	describe("filterEvents", () => {
		it("should return only ongoing and upcoming non full day events", () => {
			const minusOneHour = moment().subtract(1, "hours").toDate();
			const minusTwoHours = moment().subtract(2, "hours").toDate();
			const plusOneHour = moment().add(1, "hours").toDate();
			const plusTwoHours = moment().add(2, "hours").toDate();

			const filteredEvents = CalendarFetcherUtils.filterEvents(
				{
					pastEvent: { type: "VEVENT", start: minusTwoHours, end: minusOneHour, summary: "pastEvent" },
					ongoingEvent: { type: "VEVENT", start: minusOneHour, end: plusOneHour, summary: "ongoingEvent" },
					upcomingEvent: { type: "VEVENT", start: plusOneHour, end: plusTwoHours, summary: "upcomingEvent" }
				},
				defaultConfig
			);

			expect(filteredEvents).toHaveLength(2);
			expect(filteredEvents[0].title).toBe("ongoingEvent");
			expect(filteredEvents[1].title).toBe("upcomingEvent");
		});

		it("should return only ongoing and upcoming full day events", () => {
			const yesterday = moment().subtract(1, "days").startOf("day").toDate();
			const today = moment().startOf("day").toDate();
			const tomorrow = moment().add(1, "days").startOf("day").toDate();
			const dayAfterTomorrow = moment().add(2, "days").startOf("day").toDate();
			// Mark as DATE-only (full-day) events per ICS convention
			yesterday.dateOnly = true;
			today.dateOnly = true;
			tomorrow.dateOnly = true;
			dayAfterTomorrow.dateOnly = true;

			// ICS convention: DTEND for a full-day event is the exclusive next day
			const filteredEvents = CalendarFetcherUtils.filterEvents(
				{
					pastEvent: { type: "VEVENT", start: yesterday, end: today, summary: "pastEvent" },
					ongoingEvent: { type: "VEVENT", start: today, end: tomorrow, summary: "ongoingEvent" },
					upcomingEvent: { type: "VEVENT", start: tomorrow, end: dayAfterTomorrow, summary: "upcomingEvent" }
				},
				defaultConfig
			);

			expect(filteredEvents).toHaveLength(2);
			expect(filteredEvents[0].title).toBe("ongoingEvent");
			expect(filteredEvents[1].title).toBe("upcomingEvent");
		});

		it("should hide excluded event with 'until' when far away and show it when close", () => {
			// An event ending in 10 days with until='3 days' should be hidden now
			const farStart = moment().add(9, "days").toDate();
			const farEnd = moment().add(10, "days").toDate();
			// An event ending in 1 day with until='3 days' should be shown (within 3 days of end)
			const closeStart = moment().add(1, "hours").toDate();
			const closeEnd = moment().add(1, "days").toDate();

			const config = {
				...defaultConfig,
				excludedEvents: [{ filterBy: "Payment", until: "3 days" }]
			};

			const filteredEvents = CalendarFetcherUtils.filterEvents(
				{
					farPayment: { type: "VEVENT", start: farStart, end: farEnd, summary: "Payment due" },
					closePayment: { type: "VEVENT", start: closeStart, end: closeEnd, summary: "Payment reminder" },
					normalEvent: { type: "VEVENT", start: closeStart, end: closeEnd, summary: "Normal event" }
				},
				config
			);

			// farPayment should be hidden (now < endDate - 3 days)
			// closePayment should show (now >= endDate - 3 days)
			// normalEvent should show (not matched by filter)
			const titles = filteredEvents.map((e) => e.title);
			expect(titles).not.toContain("Payment due");
			expect(titles).toContain("Payment reminder");
			expect(titles).toContain("Normal event");
		});

		it("should fully exclude event when excludedEvents has no 'until'", () => {
			const start = moment().add(1, "hours").toDate();
			const end = moment().add(2, "hours").toDate();

			const config = {
				...defaultConfig,
				excludedEvents: ["Hidden"]
			};

			const filteredEvents = CalendarFetcherUtils.filterEvents(
				{
					hidden: { type: "VEVENT", start, end, summary: "Hidden event" },
					visible: { type: "VEVENT", start, end, summary: "Visible event" }
				},
				config
			);

			expect(filteredEvents).toHaveLength(1);
			expect(filteredEvents[0].title).toBe("Visible event");
		});

		it("should return the correct times when recurring events pass through daylight saving time", () => {
			const data = ical.parseICS(`BEGIN:VEVENT
DTSTART;TZID=Europe/Amsterdam:20250311T090000
DTEND;TZID=Europe/Amsterdam:20250311T091500
RRULE:FREQ=WEEKLY;BYDAY=FR,MO,TH,TU,WE,SA,SU
DTSTAMP:20250531T091103Z
ORGANIZER;CN=test:mailto:test@test.com
UID:67e65a1d-b889-4451-8cab-5518cecb9c66
CREATED:20230111T114612Z
DESCRIPTION:Test
LAST-MODIFIED:20250528T071312Z
SEQUENCE:1
STATUS:CONFIRMED
SUMMARY:Test
TRANSP:OPAQUE
END:VEVENT`);

			const filteredEvents = CalendarFetcherUtils.filterEvents(data, defaultConfig);

			const januaryFirst = filteredEvents.filter((event) => moment(event.startDate, "x").format("MM-DD") === "01-01");
			const julyFirst = filteredEvents.filter((event) => moment(event.startDate, "x").format("MM-DD") === "07-01");

			let januaryMoment = moment(`${moment(januaryFirst[0].startDate, "x").format("YYYY")}-01-01T09:00:00`)
				.tz("Europe/Amsterdam", true) // Convert to Europe/Amsterdam timezone (see event ical) but keep 9 o'clock
				.tz(moment.tz.guess()); // Convert to guessed timezone as that is used in the filterEvents

			let julyMoment = moment(`${moment(julyFirst[0].startDate, "x").format("YYYY")}-07-01T09:00:00`)
				.tz("Europe/Amsterdam", true) // Convert to Europe/Amsterdam timezone (see event ical) but keep 9 o'clock
				.tz(moment.tz.guess()); // Convert to guessed timezone as that is used in the filterEvents

			expect(januaryFirst[0].startDate).toEqual(januaryMoment.format("x"));
			expect(julyFirst[0].startDate).toEqual(julyMoment.format("x"));
		});

		it("should return the correct moments based on the timezone given", () => {
			const data = ical.parseICS(`BEGIN:VEVENT
DTSTART;TZID=Europe/Amsterdam:20250311T090000
DTEND;TZID=Europe/Amsterdam:20250311T091500
RRULE:FREQ=WEEKLY;BYDAY=FR,MO,TH,TU,WE,SA,SU
DTSTAMP:20250531T091103Z
UID:67e65a1d-b889-4451-8cab-5518cecb9c66
SUMMARY:Test
END:VEVENT`);

			const instances = CalendarFetcherUtils.expandRecurringEvent(data["67e65a1d-b889-4451-8cab-5518cecb9c66"], moment(), moment().add(365, "days"));

			const januaryFirst = instances.filter((i) => i.startMoment.format("MM-DD") === "01-01");
			const julyFirst = instances.filter((i) => i.startMoment.format("MM-DD") === "07-01");

			// The underlying timestamps must represent 09:00 Amsterdam time, regardless of local timezone
			expect(januaryFirst[0].startMoment.clone().tz("Europe/Amsterdam").toISOString(true)).toContain("09:00:00.000+01:00");
			expect(julyFirst[0].startMoment.clone().tz("Europe/Amsterdam").toISOString(true)).toContain("09:00:00.000+02:00");
		});

		it("should return correct day-of-week for full-day recurring events across DST transitions", () => {
			// Test case for GitHub issue #3976: recurring full-day events showing on wrong day
			// This happens when DST transitions change the UTC offset between occurrences
			const data = ical.parseICS(`BEGIN:VCALENDAR
BEGIN:VEVENT
DTSTART;VALUE=DATE:20251027
DTEND;VALUE=DATE:20251028
RRULE:FREQ=WEEKLY;WKST=SU;COUNT=3
DTSTAMP:20260103T123138Z
UID:dst-test@google.com
SUMMARY:Weekly Monday Event
END:VEVENT
END:VCALENDAR`);

			// Simulate calendar with timezone (e.g., from X-WR-TIMEZONE or user config)
			// This is how MagicMirror handles full-day events from calendars with timezones
			data["dst-test@google.com"].start.tz = "America/Chicago";

			const pastMoment = moment("2025-10-01");
			const futureMoment = moment("2025-11-30");
			const instances = CalendarFetcherUtils.expandRecurringEvent(data["dst-test@google.com"], pastMoment, futureMoment);
			const startMoments = instances.map((i) => i.startMoment);

			// All occurrences should be on Monday (day() === 1) at midnight
			// Oct 27, 2025 - Before DST ends
			// Nov 3, 2025 - After DST ends (this was showing as Sunday before the fix)
			// Nov 10, 2025 - After DST ends
			expect(startMoments).toHaveLength(3);
			expect(startMoments[0].day()).toBe(1); // Monday
			expect(startMoments[0].format("YYYY-MM-DD")).toBe("2025-10-27");
			expect(startMoments[0].hour()).toBe(0); // Midnight
			expect(startMoments[1].day()).toBe(1); // Monday (not Sunday!)
			expect(startMoments[1].format("YYYY-MM-DD")).toBe("2025-11-03");
			expect(startMoments[1].hour()).toBe(0); // Midnight
			expect(startMoments[2].day()).toBe(1); // Monday
			expect(startMoments[2].format("YYYY-MM-DD")).toBe("2025-11-10");
			expect(startMoments[2].hour()).toBe(0); // Midnight
		});

		it("should show Facebook birthday events in the current year, not in the birth year", () => {
			// Facebook birthday calendars use DTSTART with the actual birth year (e.g. 1990),
			// which previously caused rrule.js to return the wrong year occurrence.
			// With rrule-temporal this works correctly without any special-casing.
			const data = ical.parseICS(`BEGIN:VCALENDAR
BEGIN:VEVENT
DTSTART;VALUE=DATE:19900215
RRULE:FREQ=YEARLY
DTSTAMP:20260101T000000Z
UID:birthday_123456789@facebook.com
SUMMARY:Jane Doe's Birthday
END:VEVENT
END:VCALENDAR`);

			const thisYear = moment().year();

			const filteredEvents = CalendarFetcherUtils.filterEvents(data, {
				...defaultConfig,
				maximumNumberOfDays: 366
			});

			const birthdayEvents = filteredEvents.filter((e) => e.title === "Jane Doe's Birthday");
			expect(birthdayEvents.length).toBeGreaterThanOrEqual(1);

			// The event must expand to a recent year — NOT to the birth year 1990.
			// It should be the current or next year depending on whether Feb 15 has already passed.
			const startYear = moment(birthdayEvents[0].startDate, "x").year();
			expect(startYear).toBeGreaterThanOrEqual(thisYear);
			expect(startYear).toBeLessThanOrEqual(thisYear + 1);
		});
	});

	describe("filterEvents error handling", () => {
		it("should skip a broken event but still return other valid events", () => {
			const start = moment().add(1, "hours").toDate();
			const end = moment().add(2, "hours").toDate();

			const icalSpy = vi.spyOn(ical, "expandRecurringEvent").mockImplementationOnce(() => {
				throw new TypeError("invalid rrule");
			});

			const result = CalendarFetcherUtils.filterEvents(
				{
					brokenEvent: { type: "VEVENT", start, end, summary: "Broken" },
					goodEvent: { type: "VEVENT", start, end, summary: "Good" }
				},
				defaultConfig
			);

			expect(result).toHaveLength(1);
			expect(result[0].title).toBe("Good");
			icalSpy.mockRestore();
		});

		it("should let expandRecurringEvent throw through directly", () => {
			const icalSpy = vi.spyOn(ical, "expandRecurringEvent").mockImplementationOnce(() => {
				throw new TypeError("invalid rrule");
			});

			const event = { type: "VEVENT", start: new Date(), end: new Date(), summary: "Broken Event" };
			expect(() => CalendarFetcherUtils.expandRecurringEvent(event, moment(), moment().add(1, "days"))).toThrow("invalid rrule");
			icalSpy.mockRestore();
		});
	});

	describe("unwrapParameterValue", () => {
		it("should return the val of a ParameterValue object", () => {
			expect(CalendarFetcherUtils.unwrapParameterValue({ val: "Text", params: { LANGUAGE: "de" } })).toBe("Text");
		});

		it("should return a plain string unchanged", () => {
			expect(CalendarFetcherUtils.unwrapParameterValue("plain")).toBe("plain");
		});

		it("should return falsy values unchanged", () => {
			expect(CalendarFetcherUtils.unwrapParameterValue(undefined)).toBeUndefined();
			expect(CalendarFetcherUtils.unwrapParameterValue(false)).toBe(false);
		});
	});

	describe("getTitleFromEvent", () => {
		it("should return summary string directly", () => {
			expect(CalendarFetcherUtils.getTitleFromEvent({ summary: "My Event" })).toBe("My Event");
		});

		it("should unwrap ParameterValue summary", () => {
			expect(CalendarFetcherUtils.getTitleFromEvent({ summary: { val: "My Event", params: {} } })).toBe("My Event");
		});

		it("should fall back to description string", () => {
			expect(CalendarFetcherUtils.getTitleFromEvent({ description: "Desc" })).toBe("Desc");
		});

		it("should unwrap ParameterValue description as fallback title", () => {
			expect(CalendarFetcherUtils.getTitleFromEvent({ description: { val: "Desc", params: { LANGUAGE: "de" } } })).toBe("Desc");
		});

		it("should return 'Event' when neither summary nor description is present", () => {
			expect(CalendarFetcherUtils.getTitleFromEvent({})).toBe("Event");
		});
	});

	describe("filterEvents with ParameterValue properties", () => {
		it("should handle DESCRIPTION;LANGUAGE=de and LOCATION;LANGUAGE=de without [object Object]", () => {
			const start = moment().add(1, "hours").toDate();
			const end = moment().add(2, "hours").toDate();

			const filteredEvents = CalendarFetcherUtils.filterEvents(
				{
					event1: {
						type: "VEVENT",
						start,
						end,
						summary: "Test",
						description: { val: "Beschreibung", params: { LANGUAGE: "de" } },
						location: { val: "Berlin", params: { LANGUAGE: "de" } }
					}
				},
				defaultConfig
			);

			expect(filteredEvents).toHaveLength(1);
			expect(filteredEvents[0].description).toBe("Beschreibung");
			expect(filteredEvents[0].location).toBe("Berlin");
		});
	});
});
