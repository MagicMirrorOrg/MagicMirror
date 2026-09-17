const fs = require("node:fs");
const path = require("node:path");
const { Readable } = require("node:stream");
const defaults = require("../../../../../js/defaults");

const NewsfeedFetcher = require(`../../../../../${defaults.defaultModulesDir}/newsfeed/newsfeedfetcher`);

const xmlContent = fs.readFileSync(path.resolve(__dirname, "../../../../mocks/newsfeed_test.xml"), "utf8");

const feedResponse = (fetcher, xml = xmlContent) => new Promise((resolve) => {
	fetcher.onReceive(() => resolve(fetcher.items));
	fetcher.httpFetcher.emit("response", { body: Readable.from([xml]) });
});

describe("NewsfeedFetcher", () => {
	it("parses all items from the test fixture", async () => {
		const fetcher = new NewsfeedFetcher("http://test.example/feed", 60000, "UTF-8", false, false);
		const items = await feedResponse(fetcher);

		expect(items).toHaveLength(10);
	});

	it("parses title, URL, publication date and description", async () => {
		const fetcher = new NewsfeedFetcher("http://test.example/feed", 60000, "UTF-8", false, false);
		const items = await feedResponse(fetcher);
		const item = items[0];

		expect(item.title).toBeTruthy();
		expect(item.url).toMatch(/^https?:\/\//);
		expect(item.pubdate).toBeTruthy();
		expect(item.description).toBeTruthy();
	});

	it("strips HTML tags from descriptions", async () => {
		const fetcher = new NewsfeedFetcher("http://test.example/feed", 60000, "UTF-8", false, false);
		const items = await feedResponse(fetcher);

		expect(items[0].description).not.toContain("<p>");
	});

	it("generates a stable SHA-256 hash for each item", async () => {
		const fetcher = new NewsfeedFetcher("http://test.example/feed", 60000, "UTF-8", false, false);
		const items = await feedResponse(fetcher);

		for (const item of items) {
			expect(item.hash).toMatch(/^[a-f0-9]{64}$/);
		}
	});

	it("discards items without a title", async () => {
		const xml = xmlContent.replace("<title>QPanel 0.13.0</title>", "<title></title>");
		const fetcher = new NewsfeedFetcher("http://test.example/feed", 60000, "UTF-8", false, false);
		const items = await feedResponse(fetcher, xml);

		expect(items).toHaveLength(9);
	});

	it("discards items without a publication date", async () => {
		const xml = xmlContent.replace("<pubDate>Tue, 20 Sep 2016 11:16:08 +0000</pubDate>", "<pubDate></pubDate>");
		const fetcher = new NewsfeedFetcher("http://test.example/feed", 60000, "UTF-8", false, false);
		const items = await feedResponse(fetcher, xml);

		expect(items).toHaveLength(9);
	});

	it("calls onError when feed XML is malformed", async () => {
		const fetcher = new NewsfeedFetcher("http://test.example/feed", 60000, "UTF-8", false, false);
		const error = new Promise((resolve) => fetcher.onError((_fetcher, info) => resolve(info)));
		fetcher.httpFetcher.emit("response", { body: Readable.from(["this is not xml at all <<<"]) });

		await expect(error).resolves.toMatchObject({ errorType: "PARSE_ERROR" });
	});

	it("calls onError when an HTTP error is emitted", async () => {
		const fetcher = new NewsfeedFetcher("http://test.example/feed", 60000, "UTF-8", false, false);
		const error = new Promise((resolve) => fetcher.onError((_fetcher, info) => resolve(info)));
		fetcher.httpFetcher.emit("error", { message: "404", translationKey: "MODULE_ERROR_CLIENT_ERROR" });

		expect(await error).toMatchObject({ message: "404", translationKey: "MODULE_ERROR_CLIENT_ERROR" });
	});

	it("increases reloadInterval when feed TTL is larger", async () => {
		const ttlMinutes = 30;
		const xml = xmlContent.replace("    <item>", `    <ttl>${ttlMinutes}</ttl>\n    <item>`);
		const fetcher = new NewsfeedFetcher("http://test.example/feed", 60000, "UTF-8", false, false);
		await feedResponse(fetcher, xml);

		expect(fetcher.httpFetcher.reloadInterval).toBe(ttlMinutes * 60 * 1000);
	});

	it("caps TTL at 24 hours", async () => {
		const xml = xmlContent.replace("    <item>", "    <ttl>2880</ttl>\n    <item>");
		const fetcher = new NewsfeedFetcher("http://test.example/feed", 60000, "UTF-8", false, false);
		await feedResponse(fetcher, xml);

		expect(fetcher.httpFetcher.reloadInterval).toBe(24 * 60 * 60 * 1000);
	});

	it("updates reloadInterval only when the configured value is smaller", () => {
		const fetcher = new NewsfeedFetcher("http://test.example/feed", 60000, "UTF-8", false, false);

		fetcher.setReloadInterval(30000);
		expect(fetcher.httpFetcher.reloadInterval).toBe(30000);
		fetcher.setReloadInterval(120000);
		expect(fetcher.httpFetcher.reloadInterval).toBe(30000);
		fetcher.setReloadInterval(500);
		expect(fetcher.httpFetcher.reloadInterval).toBe(30000);
	});

	it("attaches useCorsProxy without changing item URLs", async () => {
		const fetcher = new NewsfeedFetcher("http://test.example/feed", 60000, "UTF-8", false, true);
		const items = await feedResponse(fetcher);

		for (const item of items) {
			expect(item.useCorsProxy).toBe(true);
			expect(item.url).not.toContain("/cors?url=");
		}
	});
});
