const { htmlToText } = require("html-to-text");

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

module.exports = {
	sanitizeBasicHtml
};
