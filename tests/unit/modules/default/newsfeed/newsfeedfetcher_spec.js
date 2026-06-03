const defaults = require("../../../../../js/defaults");

const NewsfeedFetcher = require(`../../../../../${defaults.defaultModulesDir}/newsfeed/newsfeedfetcher`);

const { sanitizeBasicHtml } = NewsfeedFetcher;

describe("NewsfeedFetcher.sanitizeBasicHtml", () => {
	it("keeps real basic formatting tags", () => {
		expect(sanitizeBasicHtml("<b>a</b> <strong>b</strong> <i>c</i> <em>d</em> <u>e</u>"))
			.toBe("<b>a</b> <strong>b</strong> <i>c</i> <em>d</em> <u>e</u>");
	});

	it("renders entity-encoded formatting tags (e.g. The Atlantic feed)", () => {
		// Feeds like theatlantic.com ship emphasis as escaped entities
		expect(sanitizeBasicHtml("the &lt;em&gt;Atlantic&lt;/em&gt; ocean")).toBe("the <em>Atlantic</em> ocean");
	});

	it("handles emphasis inside titles regardless of how the parser delivers it", () => {
		// The Atlantic uses <em> in titles, e.g. "That's Enough, <em>Euphoria</em>"
		const expected = "That’s Enough, <em>Euphoria</em>";
		expect(sanitizeBasicHtml("That’s Enough, <em>Euphoria</em>")).toBe(expected);
		expect(sanitizeBasicHtml("That’s Enough, &lt;em&gt;Euphoria&lt;/em&gt;")).toBe(expected);
	});

	it("strips attributes from allowed tags", () => {
		const result = sanitizeBasicHtml("<b onclick=\"steal()\" class=\"x\">bold</b>");
		expect(result).toBe("<b>bold</b>");
		expect(result).not.toContain("onclick");
		expect(result).not.toContain("class");
	});

	it("neutralizes script tags", () => {
		expect(sanitizeBasicHtml("<script>alert(1)</script>hello")).not.toContain("<script");
		// Entity-encoded scripts must stay inert text, never become live markup
		const encoded = sanitizeBasicHtml("&lt;script&gt;alert(1)&lt;/script&gt;");
		expect(encoded).not.toContain("<script");
		expect(encoded).toContain("&lt;script&gt;");
	});

	it("drops images and link hrefs but keeps disallowed-tag text", () => {
		const result = sanitizeBasicHtml("<img src=\"x\" onerror=\"alert(1)\"><a href=\"https://evil.example\">link</a><h1>title</h1>");
		expect(result).not.toContain("onerror");
		expect(result).not.toContain("href");
		expect(result).not.toContain("<h1>");
		expect(result).toContain("link");
		expect(result.toLowerCase()).toContain("title");
	});

	it("escapes bare HTML special characters in plain text", () => {
		expect(sanitizeBasicHtml("Fish &amp; Chips for &lt; 5")).toBe("Fish &amp; Chips for &lt; 5");
	});
});
