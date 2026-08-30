global.moment = require("moment-timezone");

const ical = require("node-ical");
const moment = require("moment-timezone");
const defaults = require("../../../../../js/defaults");

const CalendarFetcherUtils = require(`../../../../../${defaults.defaultModulesDir}/calendar/calendarfetcherutils`);

const CalendarFetcher = require(`../../../../../${defaults.defaultModulesDir}/calendar/calendarfetcher`);

const makeFetcher = (options = {}) => new CalendarFetcher(
	options.url ?? "http://test.example.com/cal.ics",
	options.reloadInterval ?? 60000,
	options.excludedEvents ?? [],
	options.maximumEntries ?? 10,
	options.maximumNumberOfDays ?? 365,
	options.auth ?? null,
	options.includePastEvents ?? false,
	options.selfSignedCert ?? false
);

// Triggers a fetch and resolves once the fetcher finishes (success or error).
// On error, resolves with the errorInfo object so tests can inspect it.
const emitResponse = (fetcher, response) => new Promise((resolve) => {
	fetcher.onReceive(resolve);
	fetcher.onError((_, errorInfo) => resolve(errorInfo));
	fetcher.httpFetcher.emit("response", response);
});

const futureEventICS = () => {
	const start = moment().add(1, "hour");
	const end = moment().add(2, "hours");
	return [
		"BEGIN:VCALENDAR",
		"BEGIN:VEVENT",
		`DTSTART:${start.utc().format("YYYYMMDDTHHmmss")}Z`,
		`DTEND:${end.utc().format("YYYYMMDDTHHmmss")}Z`,
		"UID:future-1@test",
		"SUMMARY:Future Event",
		"END:VEVENT",
		"END:VCALENDAR"
	].join("\r\n");
};

describe("CalendarFetcher", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("304 handling", () => {
		it("keeps previously fetched events when a 304 Not Modified response arrives", async () => {
			const fetcher = makeFetcher();

			await emitResponse(fetcher, new Response(futureEventICS(), { status: 200 }));
			expect(fetcher.events).toHaveLength(1);

			// 304 Not Modified has an empty body: events must be preserved
			await emitResponse(fetcher, new Response(null, { status: 304 }));
			expect(fetcher.events).toHaveLength(1);
		});
	});

	describe("error handling", () => {
		it("forwards HTTP fetch errors to onError callback", () => {
			const fetcher = makeFetcher();
			const onError = vi.fn();
			const errorInfo = { errorType: "NETWORK_ERROR", message: "boom" };

			fetcher.onError(onError);
			fetcher.httpFetcher.emit("error", errorInfo);

			expect(onError).toHaveBeenCalledWith(fetcher, errorInfo);
		});

		it("keeps existing events and reports PARSE_ERROR when parsing fails", async () => {
			const fetcher = makeFetcher();

			await emitResponse(fetcher, new Response(futureEventICS(), { status: 200 }));
			expect(fetcher.events).toHaveLength(1);

			vi.spyOn(ical.async, "parseICS").mockRejectedValueOnce(new Error("invalid ics"));
			const error = await emitResponse(fetcher, new Response("BROKEN", { status: 200 }));

			expect(fetcher.events).toHaveLength(1);
			expect(error).toMatchObject({
				errorType: "PARSE_ERROR",
				translationKey: "MODULE_ERROR_UNSPECIFIED",
				url: "http://test.example.com/cal.ics"
			});
		});
	});

	describe("delegation and refetch", () => {
		it("delegates fetchCalendar to HTTPFetcher.startPeriodicFetch", () => {
			const fetcher = makeFetcher();
			const startSpy = vi.spyOn(fetcher.httpFetcher, "startPeriodicFetch");

			fetcher.fetchCalendar();

			expect(startSpy).toHaveBeenCalledTimes(1);
		});

		it("shouldRefetch respects reload interval boundaries", () => {
			const fetcher = makeFetcher();

			expect(fetcher.shouldRefetch()).toBe(true);

			fetcher.lastFetch = Date.now() - 59999;
			expect(fetcher.shouldRefetch()).toBe(false);

			fetcher.lastFetch = Date.now() - 60000;
			expect(fetcher.shouldRefetch()).toBe(true);
		});

		it("passes configured filter options to CalendarFetcherUtils.filterEvents", async () => {
			const excludedEvents = ["Do not show me"];
			const filterSpy = vi.spyOn(CalendarFetcherUtils, "filterEvents");
			const fetcher = makeFetcher({ excludedEvents, maximumEntries: 7, maximumNumberOfDays: 30, includePastEvents: true });

			await emitResponse(fetcher, new Response(futureEventICS(), { status: 200 }));

			expect(filterSpy).toHaveBeenCalledWith(expect.any(Object), {
				excludedEvents,
				includePastEvents: true,
				maximumEntries: 7,
				maximumNumberOfDays: 30
			});
		});
	});
});
