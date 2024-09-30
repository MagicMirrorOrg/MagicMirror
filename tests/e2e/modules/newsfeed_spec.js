const fs = require("node:fs");
const helpers = require("../helpers/global-setup");

const runTests = async () => {
	describe("Default configuration", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/newsfeed/default.js");
			await helpers.getDocument();
		});

		it("should show the newsfeed title", async () => {
			const elem = await helpers.waitForElement(".newsfeed .newsfeed-source");
			expect(elem).not.toBeNull();
			expect(elem.textContent).toContain("Rodrigo Ramirez Blog");
		});

		it("should show the newsfeed article", async () => {
			const elem = await helpers.waitForElement(".newsfeed .newsfeed-title");
			expect(elem).not.toBeNull();
			expect(elem.textContent).toContain("QPanel");
		});

		it("should NOT show the newsfeed description", async () => {
			await helpers.waitForElement(".newsfeed");
			const elem = document.querySelector(".newsfeed .newsfeed-desc");
			expect(elem).toBeNull();
		});
	});

	describe("Custom configuration", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/newsfeed/prohibited_words.js");
			await helpers.getDocument();
		});

		it("should not show articles with prohibited words", async () => {
			const elem = await helpers.waitForElement(".newsfeed .newsfeed-title");
			expect(elem).not.toBeNull();
			expect(elem.textContent).toContain("Problema VirtualBox");
		});

		it("should show the newsfeed description", async () => {
			const elem = await helpers.waitForElement(".newsfeed .newsfeed-desc");
			expect(elem).not.toBeNull();
			expect(elem.textContent).not.toHaveLength(0);
		});
	});

	describe("Invalid configuration", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/newsfeed/incorrect_url.js");
			await helpers.getDocument();
		});

		it("should show malformed url warning", async () => {
			const elem = await helpers.waitForElement(".newsfeed .small", "No news at the moment.");
			expect(elem).not.toBeNull();
			expect(elem.textContent).toContain("Error in the Newsfeed module. Malformed url.");
		});
	});

	describe("Ignore items", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/newsfeed/ignore_items.js");
			await helpers.getDocument();
		});

		it("should show empty items info message", async () => {
			const elem = await helpers.waitForElement(".newsfeed .small");
			expect(elem).not.toBeNull();
			expect(elem.textContent).toContain("No news at the moment.");
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
		const baseDir = `${__dirname}/../../..`;
		if (!fs.existsSync(`${baseDir}/config/newsfeed`)) {
			fs.cpSync(`${baseDir}/modules/default/newsfeed`, `${baseDir}/config/newsfeed`, { recursive: true });
		}
		process.env.MM_MODULES_DIR = "config";
	});

	afterAll(async () => {
		await helpers.stopApplication();
	});

	runTests();
});
