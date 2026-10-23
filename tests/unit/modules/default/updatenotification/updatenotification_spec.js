import { readFileSync } from "node:fs";
import nunjucks from "nunjucks";

const moduleDir = new URL("../../../../../defaultmodules/updatenotification/", import.meta.url);

describe("updatenotification module", () => {
	let updatenotification;
	let env;

	beforeEach(async () => {
		vi.resetModules();
		global.Module = {
			register: vi.fn((name, moduleDefinition) => {
				updatenotification = moduleDefinition;
			})
		};
		global.Log = { info: vi.fn() };

		await import("../../../../../defaultmodules/updatenotification/updatenotification.js");

		updatenotification.updateDom = vi.fn();
		updatenotification.sendSocketNotification = vi.fn();

		env = new nunjucks.Environment();
		env.addFilter("translate", (key, vars = {}) => `${key}${vars.MODULE_NAME ? `:${vars.MODULE_NAME}` : ""}`);
		env.addFilter("diffLink", (text) => text);
	});

	afterEach(() => {
		delete global.Module;
		delete global.Log;
	});

	const render = () => env.renderString(readFileSync(new URL("updatenotification.njk", moduleDir), "utf8"), updatenotification.getTemplateData());

	it("renders a done line for every updated module", () => {
		updatenotification.updatesNotifier({ name: "MMM-A", updated: true, needRestart: true });
		updatenotification.updatesNotifier({ name: "MMM-B", updated: true, needRestart: true });

		const html = render();

		expect(html).toContain("UPDATE_NOTIFICATION_DONE:MMM-A");
		expect(html).toContain("UPDATE_NOTIFICATION_DONE:MMM-B");
		expect(html).toContain("UPDATE_NOTIFICATION_NEED-RESTART");
	});

	it("renders an error line for a failed module", () => {
		updatenotification.updatesNotifier({ name: "MMM-A", error: true });

		const html = render();

		expect(html).toContain("UPDATE_NOTIFICATION_ERROR:MMM-A");
		expect(html).not.toContain("UPDATE_NOTIFICATION_NEED-RESTART");
		expect(updatenotification.sendSocketNotification).not.toHaveBeenCalled();
	});

	it("removes an updated module from the list of available updates", () => {
		updatenotification.updateUI({ module: "MMM-A", behind: 2, current: "master" });
		expect(render()).toContain("UPDATE_NOTIFICATION_MODULE:MMM-A");

		updatenotification.updatesNotifier({ name: "MMM-A", updated: true, needRestart: true });

		const html = render();
		expect(html).not.toContain("UPDATE_NOTIFICATION_MODULE:MMM-A");
		expect(html).toContain("UPDATE_NOTIFICATION_DONE:MMM-A");
	});

	it("reports each module only once", () => {
		updatenotification.updatesNotifier({ name: "MMM-A", updated: true, needRestart: true });
		updatenotification.updatesNotifier({ name: "MMM-A", error: true });

		const html = render();

		expect(html.match(/UPDATE_NOTIFICATION_(DONE|ERROR):MMM-A/g)).toEqual(["UPDATE_NOTIFICATION_DONE:MMM-A"]);
		expect(updatenotification.updateDom).toHaveBeenCalledTimes(1);
	});
});
