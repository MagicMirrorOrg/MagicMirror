const crypto = require("node:crypto");
const { htmlToText } = require("html-to-text");
const Log = require("logger");

// html-to-text formatter that re-emits an allowed inline tag around its content,
// so feeds that send real <em>/<strong> elements keep their emphasis. `br` is a void
// element, so it is emitted as a single self-contained tag with no children/closing tag.
const keepTagFormatter = (elem, walk, builder, formatOptions) => {
	const { tagName } = formatOptions;
	if (tagName === "br") {
		builder.addLiteral("<br>");
		return;
	}
	builder.addLiteral(`<${tagName}>`);
	walk(elem.children, builder);
	builder.addLiteral(`</${tagName}>`);
};

/**
 * Sanitizes a feed string, keeping only the given allowlist of basic
 * formatting tags and neutralizing everything else.
 *
 * The approach is allowlist-only and therefore safe to render unescaped:
 * html-to-text first strips all real markup (scripts, links, images, …) and
 * decodes entities to text, then EVERYTHING is HTML-escaped and ONLY the exact,
 * attribute-free allowlisted tags are restored. No attributes, event handlers,
 * or other tags can survive, so arbitrary HTML/script injection is impossible.
 * @param {string} html - The raw title or description from the feed.
 * @param {string[]} [allowedTags] - Tags to keep, already validated by the caller.
 * @returns {string} Safe HTML containing at most the allowed formatting tags.
 */
const sanitizeBasicHtml = (html, allowedTags = []) => {
	// `br` keeps its default "collapse to a space" behavior unless explicitly allowed.
	const keepTagSelectors = allowedTags.map((tagName) => ({ selector: tagName, format: "keepTag", options: { tagName } }));

	const text = htmlToText(html, {
		wordwrap: false,
		formatters: { keepTag: keepTagFormatter },
		selectors: [
			{ selector: "a", options: { ignoreHref: true, noAnchorUrl: true } },
			{ selector: "br", format: "inlineSurround", options: { prefix: " " } },
			{ selector: "img", format: "skip" },
			...keepTagSelectors
		]
	});

	const escaped = text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");

	if (allowedTags.length === 0) {
		return escaped;
	}

	// Restore only the exact, attribute-free allowed opening/closing tags after escaping.
	const restoreAllowedTags = new RegExp(`&lt;(/?(?:${allowedTags.join("|")}))&gt;`, "g");
	return escaped.replace(restoreAllowedTags, "<$1>");
};

/**
 * Converts a raw feedparser item into the MagicMirror newsfeed item contract.
 * @param {object} item - The parsed feed item from feedparser.
 * @param {object} [options] - Normalization options.
 * @param {string[]} [options.allowedBasicHtmlTags] - Inline tags allowed to survive sanitization.
 * @param {boolean} [options.useCorsProxy] - Whether the item's article should use the CORS proxy.
 * @param {boolean} [options.logFeedWarnings] - Whether to log a warning for items missing a title or publication date.
 * @returns {{title:string, description:string, pubdate:string, url:string, useCorsProxy:boolean, hash:string}|null} The normalized item, or null when title or pubdate is missing.
 */
const normalizeFeedItem = (item, { allowedBasicHtmlTags = [], useCorsProxy = false, logFeedWarnings = false } = {}) => {
	// feedparser strips HTML from item.title; recover the raw title so inline
	// formatting tags (e.g. <em>) in titles survive sanitizeBasicHtml below.
	const title = (item["rss:title"] && item["rss:title"]["#"]) || (item["atom:title"] && item["atom:title"]["#"]) || item.title;
	// feedparser returns null (not "") for a missing/empty description or summary.
	let description = item.description || item.summary || "";
	const pubdateValue = item.pubdate || item.date;
	const pubdate = pubdateValue instanceof Date ? pubdateValue.toISOString() : pubdateValue;
	const url = item.link || item.guid || "";

	if (!title || !pubdate) {
		if (logFeedWarnings) {
			Log.warn("Can't parse feed item:", item);
			Log.warn(`Title: ${title}`);
			Log.warn(`Description: ${description}`);
			Log.warn(`Pubdate: ${pubdate}`);
		}
		return null;
	}

	let displayTitle;
	if (allowedBasicHtmlTags.length > 0) {
		// Keep the configured basic formatting tags in both fields, strip everything else
		description = sanitizeBasicHtml(description, allowedBasicHtmlTags);
		displayTitle = sanitizeBasicHtml(title, allowedBasicHtmlTags);
	} else {
		// Let the template escape plain text exactly once.
		const textOptions = {
			wordwrap: false,
			selectors: [
				{ selector: "a", options: { ignoreHref: true, noAnchorUrl: true } },
				{ selector: "br", format: "inlineSurround", options: { prefix: " " } },
				{ selector: "img", format: "skip" }
			]
		};
		description = htmlToText(description, textOptions);
		displayTitle = htmlToText(title, textOptions);
	}

	return {
		title: displayTitle,
		description,
		pubdate,
		url,
		useCorsProxy,
		// Hash on the original title so the dedup identity is stable regardless of allowedBasicHtmlTags
		hash: crypto.createHash("sha256").update(`${pubdate} :: ${title} :: ${url}`).digest("hex")
	};
};

module.exports = {
	sanitizeBasicHtml,
	normalizeFeedItem
};
