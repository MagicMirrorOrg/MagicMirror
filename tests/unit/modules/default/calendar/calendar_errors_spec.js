const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const URL_A = "https://a.example/cal.ics";
const URL_B = "https://b.example/cal.ics";

/**
 * Loads the calendar front end module with stubbed globals.
 * @returns {object} module instance with updateDom spy
 */
const loadModule = function () {
	let definition;
	const code = fs.readFileSync(path.join(__dirname, "../../../../../defaultmodules/calendar/calendar.js"), "utf8");
	vm.runInNewContext(code, {
		Module: { register: (name, def) => { definition = def; } },
		document: { createElement: () => ({ innerHTML: "", className: "" }) },
		Log: { debug () {}, warn () {}, error () {}, log () {} }
	});
	const instance = Object.create(definition);
	instance.config = { ...definition.defaults };
	instance.identifier = "calendar_1";
	instance.name = "calendar";
	instance.calendarData = {};
	instance.calendarDisplayer = {};
	instance.errors = {};
	instance.loaded = false;
	instance.translate = (key) => key;
	instance.updateDom = vi.fn();
	instance.broadcastEvents = vi.fn();
	instance.createEventList = vi.fn(() => instance.events || []);
	return instance;
};

const ok = (url, checksum = "x") => ({ id: "calendar_1", url, events: [], checksum });
const fail = (url) => ({ id: "calendar_1", url, error_type: "MODULE_ERROR_NO_CONNECTION" });

describe("Calendar error handling", () => {
	it("redraws after recovery even if the events checksum is unchanged", () => {
		const m = loadModule();
		m.socketNotificationReceived("CALENDAR_EVENTS", ok(URL_A));
		m.updateDom.mockClear();

		m.socketNotificationReceived("CALENDAR_ERROR", fail(URL_A));
		expect(m.getDom().innerHTML).toContain("MODULE_CONFIG_ERROR");
		m.updateDom.mockClear();

		m.socketNotificationReceived("CALENDAR_EVENTS", ok(URL_A));
		expect(m.updateDom).toHaveBeenCalled();
		expect(m.getDom().innerHTML).not.toContain("MODULE_CONFIG_ERROR");
	});

	it("keeps showing the error until every failing calendar has recovered", () => {
		const m = loadModule();
		m.socketNotificationReceived("CALENDAR_ERROR", fail(URL_A));
		m.socketNotificationReceived("CALENDAR_ERROR", fail(URL_B));
		m.socketNotificationReceived("CALENDAR_EVENTS", ok(URL_A));
		expect(m.getDom().innerHTML).toContain("MODULE_CONFIG_ERROR");
		m.socketNotificationReceived("CALENDAR_EVENTS", ok(URL_B));
		expect(m.getDom().innerHTML).not.toContain("MODULE_CONFIG_ERROR");
	});

	it("shows the error instead of events by default", () => {
		const m = loadModule();
		m.socketNotificationReceived("CALENDAR_ERROR", fail(URL_A));
		expect(m.shouldShowError([{ title: "e" }])).toBe(true);
	});

	it("keeps events visible on error with keepEventsOnError, but shows the error when there are none", () => {
		const m = loadModule();
		m.config.keepEventsOnError = true;
		m.socketNotificationReceived("CALENDAR_ERROR", fail(URL_A));
		expect(m.shouldShowError([{ title: "e" }])).toBe(false);
		expect(m.shouldShowError([])).toBe(true);
	});
});
