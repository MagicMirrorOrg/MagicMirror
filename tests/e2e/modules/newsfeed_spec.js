const fs = require("node:fs");
const { expect } = require("playwright/test");
const helpers = require("../helpers/global-setup");

const runTests = async () => {
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
