const helpers = require("../global-setup");

describe("Newsfeed module", function () {
	afterAll(async function () {
		await helpers.stopApplication();
	});

	describe("Default configuration", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/newsfeed/default.js");
			helpers.getDocument(done);
		});

		it("should show the newsfeed title", function () {
			helpers.waitForElement(".newsfeed .newsfeed-source").then((elem) => {
				expect(elem).not.toBe(null);
				expect(elem.textContent).toContain("Rodrigo Ramirez Blog");
			});
		});

		it("should show the newsfeed article", function () {
			helpers.waitForElement(".newsfeed .newsfeed-title").then((elem) => {
				expect(elem).not.toBe(null);
				expect(elem.textContent).toContain("QPanel");
			});
		});

		it("should NOT show the newsfeed description", () => {
			helpers.waitForElement(".newsfeed .newsfeed-desc").then((elem) => {
				expect(elem).toBe(null);
			});
		});
	});

	describe("Custom configuration", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/newsfeed/prohibited_words.js");
			helpers.getDocument(done);
		});

		it("should not show articles with prohibited words", function () {
			helpers.waitForElement(".newsfeed .newsfeed-title").then((elem) => {
				expect(elem).not.toBe(null);
				expect(elem.textContent).toContain("Problema VirtualBox");
			});
		});

		it("should show the newsfeed description", () => {
			helpers.waitForElement(".newsfeed .newsfeed-desc").then((elem) => {
				expect(elem).not.toBe(null);
				expect(elem.textContent.length).not.toBe(0);
			});
		});
	});

	describe("Invalid configuration", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/newsfeed/incorrect_url.js");
			helpers.getDocument(done);
		});

		it("should show malformed url warning", function () {
			helpers.waitForElement(".newsfeed .small").then((elem) => {
				expect(elem).not.toBe(null);
				expect(elem.textContent).toContain("Error in the Newsfeed module. Malformed url.");
			});
		});
	});

	describe("Ignore items", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/newsfeed/ignore_items.js");
			helpers.getDocument(done);
		});

		it("should show empty items info message", function () {
			helpers.waitForElement(".newsfeed .small").then((elem) => {
				expect(elem).not.toBe(null);
				expect(elem.textContent).toContain("No news at the moment.");
			});
		});
	});
});
