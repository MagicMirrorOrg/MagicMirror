import { readFileSync } from "node:fs";
import vm from "node:vm";

// Exercise the real module with Object.groupBy unavailable (Safari 15).
// Only the moment.js date operations needed by this case are supplied here.
const FILE = new URL("../../../../../defaultmodules/calendar/calendar.js", import.meta.url);
const TODAY = Date.UTC(2026, 10, 19, 8);

const fakeMoment = function (value = TODAY) {
	const date = new Date(Number(value));
	return {
		date,
		clone () { return fakeMoment(this.date.valueOf()); },
		tz () { return this; },
		startOf (kind) {
			if (kind === "day") this.date.setUTCHours(0, 0, 0, 0);
			return this;
		},
		add (n, kind) {
			if (kind.startsWith("day")) this.date.setUTCDate(this.date.getUTCDate() + n);
			else if (kind === "millisecond") this.date.setTime(this.date.getTime() + n);
			return this;
		},
		subtract (n, kind) { return this.add(-n, kind); },
		format (kind) {
			if (kind === "YYYY-MM-DD") return this.date.toISOString().slice(0, 10);
			if (kind === "x") return String(this.date.valueOf());
			throw new Error(`unexpected moment format ${kind}`);
		},
		diff (other, kind) {
			if (kind === "days") return Math.trunc((this.date - other.date) / 86400000);
			throw new Error(kind);
		},
		isSame (other, kind) {
			return kind === "d" ? this.format("YYYY-MM-DD") === other.format("YYYY-MM-DD") : +this.date === +other.date;
		},
		isAfter (other) { return this.date > other.date; },
		isBefore (other) { return this.date < other.date; },
		isSameOrBefore (other) { return this.date <= other.date; }
	};
};
fakeMoment.tz = { guess: () => "UTC" };

const calendarWithoutGroupBy = function (config, events) {
	let definition;
	const context = vm.createContext({
		Module: { register (name, module) { expect(name).toBe("calendar"); definition = module; } },
		moment: fakeMoment,
		Log: { debug () {}, info () {} }
	});
	vm.runInContext("Object.groupBy = undefined", context);
	vm.runInContext(readFileSync(FILE, "utf8"), context, { filename: "defaultmodules/calendar/calendar.js" });
	return Object.assign(Object.create(definition), {
		config: {
			...definition.defaults,
			calendars: [{ url: "fixture://test" }],
			maximumEntries: 10,
			maximumNumberOfDays: 30,
			pastDaysCount: 0,
			hideDuplicates: false,
			sliceMultiDayEvents: false,
			...config
		},
		calendarData: { "fixture://test": { events } }
	});
};

const event = function (title, day, hour = 9, duration = 1) {
	const start = TODAY + day * 86400000 + (hour - 8) * 3600000;
	return { title, startDate: String(start), endDate: String(start + duration * 3600000) };
};
const titles = (events) => Array.from(events, (e) => e.title);

describe("calendar date limiting without Object.groupBy (Safari 15)", () => {
	it("accepts an empty calendar", () => {
		expect(titles(calendarWithoutGroupBy({ limitDays: 2 }, []).createEventList(true))).toEqual([]);
	});

	it("preserves the unlimited-day path", () => {
		const events = [event("today", 0), event("tomorrow", 1)];
		expect(titles(calendarWithoutGroupBy({ limitDays: 0 }, events).createEventList(true))).toEqual(["today", "tomorrow"]);
	});

	it("groups today's and tomorrow's events, excluding a third day", () => {
		const events = [event("third", 2), event("tomorrow", 1), event("today late", 0, 16), event("today early", 0, 10)];
		expect(titles(calendarWithoutGroupBy({ limitDays: 2 }, events).createEventList(true))).toEqual(["today early", "today late", "tomorrow"]);
	});

	it("honors the one-day limit and maximumEntries", () => {
		const events = [event("today first", 0, 10), event("tomorrow", 1), event("today second", 0, 11)];
		expect(titles(calendarWithoutGroupBy({ limitDays: 1, maximumEntries: 1 }, events).createEventList(true))).toEqual(["today first"]);
	});

	it("filters already-finished events", () => {
		const events = [event("already ended", 0, 6), event("upcoming", 0, 10)];
		expect(titles(calendarWithoutGroupBy({ limitDays: 2 }, events).createEventList(true))).toEqual(["upcoming"]);
	});
});
