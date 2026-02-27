const fs = require("node:fs");
const { expect } = require("playwright/test");
const helpers = require("../helpers/global-setup");

const runTests = () => {
	let page;

	describe("Default configuration", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/newsfeed/default.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should show the newsfeed title", async () => {
			await expect(page.locator(".newsfeed .newsfeed-source")).toContainText("Rodrigo Ramirez Blog");
		});

		it("should show the newsfeed article", async () => {
			await expect(page.locator(".newsfeed .newsfeed-title")).toContainText("QPanel");
		});

		it("should NOT show the newsfeed description", async () => {
			await page.locator(".newsfeed").waitFor({ state: "visible" });
			await expect(page.locator(".newsfeed .newsfeed-desc")).toHaveCount(0);
		});
	});

	describe("Custom configuration", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/newsfeed/prohibited_words.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should not show articles with prohibited words", async () => {
			await expect(page.locator(".newsfeed .newsfeed-title")).toContainText("Problema VirtualBox");
		});

		it("should show the newsfeed description", async () => {
			const locator = page.locator(".newsfeed .newsfeed-desc");
			await expect(locator).toBeVisible();
			const text = await locator.textContent();
			expect(text).toMatch(/\S/);
		});
	});

	describe("Invalid configuration", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/newsfeed/incorrect_url.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should show malformed url warning", async () => {
			await expect(page.locator(".newsfeed .small")).toContainText("Error in the Newsfeed module. Malformed url.");
		});
	});

	describe("Ignore items", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/newsfeed/ignore_items.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should show empty items info message", async () => {
			await expect(page.locator(".newsfeed .small")).toContainText("No news at the moment.");
		});
	});
};

describe("Newsfeed module > Notifications", () => {
	let page;

	afterAll(async () => {
		await helpers.stopApplication();
	});

	/**
	 * Helper: call notificationReceived on the newsfeed module directly.
	 * @param {object} p - playwright page
	 * @param {string} notification - notification name
	 * @param {object} payload - notification payload
	 * @returns {Promise<void>} resolves when the notification has been dispatched
	 */
	const notify = (p, notification, payload = {}) => p.evaluate(
		({ n, pl }) => {
			const nf = MM.getModules().find((m) => m.name === "newsfeed");
			nf.notificationReceived(n, pl, nf);
		},
		{ n: notification, pl: payload }
	);

	beforeAll(async () => {
		await helpers.startApplication("tests/configs/modules/newsfeed/notifications.js");
		await helpers.getDocument();
		page = helpers.getPage();
		await expect(page.locator(".newsfeed .newsfeed-title")).toBeVisible();
	});

	it("ARTICLE_NEXT should show the next article", async () => {
		const title1 = await page.locator(".newsfeed .newsfeed-title").textContent();
		await notify(page, "ARTICLE_NEXT");
		await expect(page.locator(".newsfeed .newsfeed-title")).not.toContainText(title1.trim());
	});

	it("ARTICLE_PREVIOUS should return to the previous article", async () => {
		// Start at article 0, go to article 1, then back
		await page.evaluate(() => {
			const nf = MM.getModules().find((m) => m.name === "newsfeed");
			nf.activeItem = 0;
			nf.resetDescrOrFullArticleAndTimer();
			nf.updateDom(0);
		});
		await expect(page.locator(".newsfeed .newsfeed-title")).toContainText("QPanel");
		const title0 = await page.locator(".newsfeed .newsfeed-title").textContent();

		await notify(page, "ARTICLE_NEXT");
		await expect(page.locator(".newsfeed .newsfeed-title")).not.toContainText(title0.trim());

		await notify(page, "ARTICLE_PREVIOUS");
		await expect(page.locator(".newsfeed .newsfeed-title")).toContainText(title0.trim());
	});

	it("ARTICLE_NEXT should wrap around from the last article to the first", async () => {
		// Jump to the last article
		await page.evaluate(() => {
			const nf = MM.getModules().find((m) => m.name === "newsfeed");
			nf.activeItem = nf.newsItems.length - 1;
			nf.resetDescrOrFullArticleAndTimer();
			nf.updateDom(0);
		});
		await expect(page.locator(".newsfeed .newsfeed-title")).toBeVisible();
		const titleLast = await page.locator(".newsfeed .newsfeed-title").textContent();

		await notify(page, "ARTICLE_NEXT");
		await expect(page.locator(".newsfeed .newsfeed-title")).not.toContainText(titleLast.trim());

		// activeItem should now be 0
		const activeItem = await page.evaluate(() => MM.getModules().find((m) => m.name === "newsfeed").activeItem);
		expect(activeItem).toBe(0);
	});

	it("ARTICLE_PREVIOUS should wrap around from the first article to the last", async () => {
		await page.evaluate(() => {
			const nf = MM.getModules().find((m) => m.name === "newsfeed");
			nf.activeItem = 0;
			nf.resetDescrOrFullArticleAndTimer();
		});
		await notify(page, "ARTICLE_PREVIOUS");

		const activeItem = await page.evaluate(() => {
			const nf = MM.getModules().find((m) => m.name === "newsfeed");
			return { activeItem: nf.activeItem, total: nf.newsItems.length };
		});
		expect(activeItem.activeItem).toBe(activeItem.total - 1);
	});

	it("ARTICLE_INFO_REQUEST should respond with title, source, date, desc and raw url", async () => {
		await page.evaluate(() => {
			const nf = MM.getModules().find((m) => m.name === "newsfeed");
			nf.activeItem = 0;
			nf.resetDescrOrFullArticleAndTimer();
		});

		const info = await page.evaluate(() => new Promise((resolve, reject) => {
			const timer = setTimeout(() => reject(new Error("ARTICLE_INFO_RESPONSE timeout")), 3000);
			const origSend = MM.sendNotification.bind(MM);
			MM.sendNotification = function (n, p, s) {
				if (n === "ARTICLE_INFO_RESPONSE") {
					clearTimeout(timer);
					MM.sendNotification = origSend;
					resolve(p);
				}
				return origSend(n, p, s);
			};
			const nf = MM.getModules().find((m) => m.name === "newsfeed");
			nf.notificationReceived("ARTICLE_INFO_REQUEST", {}, nf);
		}));

		expect(info).toHaveProperty("title");
		expect(info).toHaveProperty("source");
		expect(info).toHaveProperty("date");
		expect(info).toHaveProperty("desc");
		expect(info).toHaveProperty("url");
		expect(info.title).toBe("QPanel 0.13.0");
		expect(info.source).toBe("Rodrigo Ramirez Blog");
		// URL must be the raw article URL, not a CORS proxy URL
		expect(info.url).toMatch(/^https?:\/\//);
		expect(info.url).not.toContain("localhost");
	});

	it("ARTICLE_LESS_DETAILS should reset the full article view", async () => {
		// Simulate full article view being active
		await page.evaluate(() => {
			const nf = MM.getModules().find((m) => m.name === "newsfeed");
			nf.config.showFullArticle = true;
			nf.articleFrameCheckPending = false;
			nf.articleUnavailable = false;
		});

		await notify(page, "ARTICLE_LESS_DETAILS");

		const state = await page.evaluate(() => {
			const nf = MM.getModules().find((m) => m.name === "newsfeed");
			return { showFullArticle: nf.config.showFullArticle };
		});
		expect(state.showFullArticle).toBe(false);
		// Normal newsfeed title should be visible again
		await expect(page.locator(".newsfeed .newsfeed-title")).toBeVisible();
	});
});

describe("Newsfeed module", () => {
	afterAll(async () => {
		await helpers.stopApplication();
	});

	runTests();
});

describe("Newsfeed module located in config directory", () => {
	beforeAll(() => {
		fs.cpSync(`${global.root_path}/${global.defaultModulesDir}/newsfeed`, `${global.root_path}/config/newsfeed`, { recursive: true });
		process.env.MM_MODULES_DIR = "config";
	});

	afterAll(async () => {
		await helpers.stopApplication();
	});

	runTests();
});
