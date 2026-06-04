/*
 * Ambient types for the newsfeed subsystem (newsfeedfetcher, node_helper, newsfeed
 * module). Included by both the browser and server tsconfig.
 *
 * NewsfeedFetcher parses RSS/Atom feeds and emits NewsItem objects; node_helper adds
 * sourceTitle and the browser module adds publishDate / renders them. Fields are
 * optional with an index signature, so applying these types is a safe refinement of
 * the previous `any`. pubdate/publishDate stay `any` (feed-dependent string/Date).
 */

interface NewsItem {
	title?: string;
	description?: string;
	pubdate?: any;
	publishDate?: any;
	url?: string;
	sourceTitle?: string;
	useCorsProxy?: boolean;
	hash?: string;
	[key: string]: any;
}

interface NewsfeedConfig {
	feeds?: any[];
	feedUrl?: string;
	maxNewsItems?: number;
	showDescription?: boolean;
	showFullArticle?: boolean;
	prohibitedWords?: string[];
	startTags?: string[];
	endTags?: string[];
	removeStartTags?: boolean;
	removeEndTags?: boolean;
	updateInterval?: number;
	scrollLength?: number;
	[key: string]: any;
}
