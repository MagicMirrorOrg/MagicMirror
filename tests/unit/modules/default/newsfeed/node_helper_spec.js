import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
	const fetcherInstances = [];
	const loggerMock = {
		log: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	};
	class MockNewsfeedFetcher {
		constructor (...args) {
			this.url = args[0];
			this.items = [];
			this.onReceiveCallback = undefined;
			this.onErrorCallback = undefined;
			this.setReloadInterval = vi.fn();
			this.broadcastItems = vi.fn();
			this.startFetch = vi.fn();
			fetcherInstances.push(this);
		}

		onReceive (callback) {
			this.onReceiveCallback = callback;
		}

		onError (callback) {
			this.onErrorCallback = callback;
		}
	}

	return { fetcherInstances, loggerMock, MockNewsfeedFetcher };
});

vi.mock("node_helper", () => ({
	default: { create: (definition) => definition }
}));
vi.mock("logger", () => ({ default: mocks.loggerMock }));
vi.mock("../../../../../defaultmodules/newsfeed/newsfeedfetcher.js", () => ({
	default: mocks.MockNewsfeedFetcher
}));

import helper from "../../../../../defaultmodules/newsfeed/node_helper.js";

const loadNewsfeedNodeHelper = () => {
	mocks.fetcherInstances.length = 0;
	helper.fetchers = {};
	helper.sendSocketNotification = vi.fn();
	return { helper, fetcherInstances: mocks.fetcherInstances, loggerMock: mocks.loggerMock };
};

afterEach(() => {
	vi.resetAllMocks();
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

	it("creates and starts a fetcher with feed and module configuration", async () => {
		const { helper, fetcherInstances } = await loadNewsfeedNodeHelper();
		const config = {
			reloadInterval: 300000,
			logFeedWarnings: true,
			allowedBasicHtmlTags: ["em"]
		};

		helper.createFetcher({
			url: "https://example.com/feed.xml",
			encoding: "ISO-8859-1",
			reloadInterval: 120000
		}, config);

		expect(fetcherInstances).toHaveLength(1);
		expect(fetcherInstances[0].startFetch).toHaveBeenCalledTimes(1);
		expect(helper.fetchers["https://example.com/feed.xml"]).toBe(fetcherInstances[0]);
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

	it("broadcasts received feeds and forwards fetch errors", async () => {
		const { helper, fetcherInstances } = await loadNewsfeedNodeHelper();
		const feed = { url: "https://example.com/feed.xml" };
		helper.createFetcher(feed, {});
		const fetcher = fetcherInstances[0];
		fetcher.items = [{ title: "Headline" }];

		fetcher.onReceiveCallback();
		expect(helper.sendSocketNotification).toHaveBeenCalledWith("NEWS_ITEMS", {
			"https://example.com/feed.xml": [{ title: "Headline" }]
		});

		fetcher.onErrorCallback(fetcher, { message: "Parse failed", translationKey: "MODULE_ERROR_UNSPECIFIED" });
		expect(helper.sendSocketNotification).toHaveBeenCalledWith("NEWSFEED_ERROR", {
			error_type: "MODULE_ERROR_UNSPECIFIED"
		});
	});
});
