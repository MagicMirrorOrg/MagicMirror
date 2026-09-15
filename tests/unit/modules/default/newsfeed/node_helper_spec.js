import Module from "node:module";
import { afterEach, describe, expect, it, vi } from "vitest";

const loadNewsfeedNodeHelper = async () => {
	vi.resetModules();

	const fetcherInstances = [];
	const originalRequire = Module.prototype.require;

	Module.prototype.require = function (id) {
		if (id === "node_helper") {
			return {
				create: vi.fn((definition) => definition)
			};
		}

		if (id === "./newsfeedfetcher") {
			return class MockNewsfeedFetcher {
				constructor (...args) {
					this.url = args[0];
					this.items = [];
					this.onReceive = vi.fn();
					this.onError = vi.fn();
					this.setReloadInterval = vi.fn();
					this.broadcastItems = vi.fn();
					this.startFetch = vi.fn();
					fetcherInstances.push(this);
				}
			};
		}

		return originalRequire.apply(this, arguments);
	};

	let helper;
	try {
		const helperModule = await import("../../../../../defaultmodules/newsfeed/node_helper");
		helper = helperModule.default || helperModule;
	} finally {
		Module.prototype.require = originalRequire;
	}

	helper.fetchers = {};
	helper.sendSocketNotification = vi.fn();
	return { helper, fetcherInstances };
};

afterEach(() => {
	vi.resetAllMocks();
	vi.resetModules();
});

describe("newsfeed node_helper", () => {
	it("rejects malformed feed URLs without creating a fetcher", async () => {
		const { helper, fetcherInstances } = await loadNewsfeedNodeHelper();

		helper.createFetcher({ url: "not a URL" }, {});

		expect(fetcherInstances).toHaveLength(0);
		expect(helper.sendSocketNotification).toHaveBeenCalledWith("NEWSFEED_ERROR", {
			error_type: "MODULE_ERROR_MALFORMED_URL"
		});
	});

	it("reuses a fetcher and updates its interval", async () => {
		const { helper, fetcherInstances } = await loadNewsfeedNodeHelper();
		const feed = { url: "https://example.com/feed.xml", reloadInterval: 60000 };

		helper.createFetcher(feed, {});
		helper.createFetcher({ ...feed, reloadInterval: 30000 }, {});

		expect(fetcherInstances).toHaveLength(1);
		expect(fetcherInstances[0].setReloadInterval).toHaveBeenCalledWith(30000);
		expect(fetcherInstances[0].broadcastItems).toHaveBeenCalledTimes(1);
		expect(fetcherInstances[0].startFetch).toHaveBeenCalledTimes(2);
	});
});
