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

// The full safe list users may opt into; most tests run with it enabled.
const ALL_TAGS = ["b", "strong", "i", "em", "u", "br", "code", "s", "sub", "sup"];
const sanitize = (html, allowedTags = ALL_TAGS) => NewsfeedFetcher.sanitizeBasicHtml(html, allowedTags);

describe("NewsfeedFetcher.sanitizeBasicHtml", () => {
	it("keeps real basic formatting tags", () => {
		expect(sanitize("<b>a</b> <strong>b</strong> <i>c</i> <em>d</em> <u>e</u>"))
			.toBe("<b>a</b> <strong>b</strong> <i>c</i> <em>d</em> <u>e</u>");
	});

	it("keeps the additional safe tags (code, s, sub, sup)", () => {
		expect(sanitize("<code>x</code> <s>y</s> <sub>z</sub> <sup>w</sup>"))
			.toBe("<code>x</code> <s>y</s> <sub>z</sub> <sup>w</sup>");
	});

	it("renders entity-encoded formatting tags (e.g. The Atlantic feed)", () => {
		// Feeds like theatlantic.com ship emphasis as escaped entities
		expect(sanitize("the &lt;em&gt;Atlantic&lt;/em&gt; ocean")).toBe("the <em>Atlantic</em> ocean");
	});

	it("handles emphasis inside titles regardless of how the parser delivers it", () => {
		// The Atlantic uses <em> in titles, e.g. "That's Enough, <em>Euphoria</em>"
		const expected = "That’s Enough, <em>Euphoria</em>";
		expect(sanitize("That’s Enough, <em>Euphoria</em>")).toBe(expected);
		expect(sanitize("That’s Enough, &lt;em&gt;Euphoria&lt;/em&gt;")).toBe(expected);
	});

	it("strips attributes from allowed tags", () => {
		const result = sanitize("<b onclick=\"steal()\" class=\"x\">bold</b>");
		expect(result).toBe("<b>bold</b>");
		expect(result).not.toContain("onclick");
		expect(result).not.toContain("class");
	});

	it("neutralizes script tags", () => {
		expect(sanitize("<script>alert(1)</script>hello")).not.toContain("<script");
		// Entity-encoded scripts must stay inert text, never become live markup
		const encoded = sanitize("&lt;script&gt;alert(1)&lt;/script&gt;");
		expect(encoded).not.toContain("<script");
		expect(encoded).toContain("&lt;script&gt;");
	});

	it("drops images and link hrefs but keeps disallowed-tag text", () => {
		const result = sanitize("<img src=\"x\" onerror=\"alert(1)\"><a href=\"https://evil.example\">link</a><h1>title</h1>");
		expect(result).not.toContain("onerror");
		expect(result).not.toContain("href");
		expect(result).not.toContain("<h1>");
		expect(result).toContain("link");
		expect(result.toLowerCase()).toContain("title");
	});

	it("escapes bare HTML special characters in plain text", () => {
		expect(sanitize("Fish &amp; Chips for &lt; 5")).toBe("Fish &amp; Chips for &lt; 5");
	});

	it("only keeps tags present in the supplied allowlist", () => {
		// Allow just <em>: a safe-but-not-allowed <strong> must become plain text.
		const result = sanitize("<em>kept</em> <strong>dropped</strong>", ["em"]);
		expect(result).toBe("<em>kept</em> dropped");
		expect(result).not.toContain("<strong>");
	});

	it("escapes everything when the allowlist is empty", () => {
		expect(sanitize("<em>hi</em> &amp; <b>bye</b>", [])).toBe("hi &amp; bye");
	});

	it("renders <br> as a single self-closing tag when allowed", () => {
		const result = sanitize("a<br>b", ["br"]);
		expect(result).toContain("<br>");
		expect(result).not.toContain("<br></br>");
		expect(result).not.toContain("&lt;br&gt;");
	});

	it("collapses <br> to a space when not allowed", () => {
		const result = sanitize("a<br>b", ["em"]);
		expect(result).not.toContain("<br>");
		expect(result).toBe("a b");
	});
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
