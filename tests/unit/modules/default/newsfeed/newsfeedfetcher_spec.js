const defaults = require("../../../../../js/defaults");

const NewsfeedFetcher = require(`../../../../../${defaults.defaultModulesDir}/newsfeed/newsfeedfetcher`);

// The full safe list users may opt into; most tests run with it enabled.
const ALL_TAGS = ["b", "strong", "i", "em", "u", "br", "code", "s", "sub", "sup"];
const sanitize = (html, allowedTags = ALL_TAGS) => NewsfeedFetcher.sanitizeBasicHtml(html, allowedTags);

describe("NewsfeedFetcher feed parsing", () => {
	it("keeps processing when an Atom summary is parsed as an object", async () => {
		const fetcher = new NewsfeedFetcher("https://example.com/feed.xml", 60000, "utf-8", false, false);
		const feed = `
			<feed xmlns="http://www.w3.org/2005/Atom">
				<entry>
					<title>Broken summary</title>
					<summary type="text"></summary>
					<updated>2026-09-14T12:00:00Z</updated>
				</entry>
			</feed>`;
		const itemsReceived = new Promise((resolve) => fetcher.onReceive(resolve));
		fetcher.httpFetcher.emit("response", new Response(feed, { status: 200 }));
		const result = await itemsReceived;

		expect(result).toBe(fetcher);
		expect(fetcher.items).toHaveLength(1);
		expect(fetcher.items[0].description).toBe("");
	});

	it("strips HTML tags from descriptions", async () => {
		const fetcher = new NewsfeedFetcher("https://example.com/feed.xml", 60000, "utf-8", false, false);
		const feed = `
			<rss version="2.0">
				<channel>
					<item>
						<title>Headline</title>
						<description><![CDATA[<p>Article <strong>text</strong></p>]]></description>
						<pubDate>Mon, 14 Sep 2026 12:00:00 GMT</pubDate>
					</item>
				</channel>
			</rss>`;
		const itemsReceived = new Promise((resolve) => fetcher.onReceive(resolve));
		fetcher.httpFetcher.emit("response", new Response(feed, { status: 200 }));
		await itemsReceived;

		expect(fetcher.items[0].description).toBe("Article text");
	});
});

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
